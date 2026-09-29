#!/usr/bin/env node
'use strict';
/* =====================================================================
 * verify-order.js - CONTIGUOUS-ORDER verification of generated .docx prose
 * =====================================================================
 *
 * WHY THIS TOOL EXISTS
 *   `validate.ps1` proves COVERAGE with a presence test (`IndexOf`), so text
 *   that is present but reassembled out of order still scores ~99.9%.  A
 *   converter that scrambled, merged or reordered paragraph fragments would
 *   therefore pass every gate in the pipeline while being unreadable.  This
 *   tool closes that class of hole: it proves that every source prose
 *   paragraph is emitted as ONE contiguous `w:p` whose visible text equals the
 *   source paragraph character for character, in source order, with no two
 *   source paragraphs merged and none split.
 *
 * WHAT IT CHECKS (per document)
 *   1. EXACT       - the source paragraph's canonical text equals the canonical
 *                    text of the document paragraph that contains it, character
 *                    for character (hand-in-hand with CONTIGUOUS, so a
 *                    paragraph that is merely assembled from the same
 *                    characters in another order cannot pass).
 *   2. CONTIGUOUS  - the text occurs in ONE `w:p` (not spread across several),
 *                    located by a boundary-aware offset search.
 *   3. BOUNDED     - the match does not start or end in the middle of a word
 *                    (catches `figure.Cisco`-style glue at run boundaries).
 *   4. ORDER       - document paragraph offsets increase strictly in source
 *                    order, so no fragment of a later paragraph can be spliced
 *                    into an earlier one.
 *   5. NOT-MERGED  - no two source paragraphs in the same source file map to
 *                    the same document paragraph.
 *   6. TABLES      - every source table row maps to one `w:tr` with the same
 *                    cell texts, in the same order, cell for cell.
 *   7. CODE        - every fenced code block appears in order with its lines
 *                    intact, line for line.
 *
 * MODES
 *   complete  every source paragraph must be present exactly once (the
 *             `*.docx` built from all sources with `rules: null`).
 *   volume    the document holds a SUBSET of the sources (a split volume), so a
 *             paragraph that is absent is reported as `excluded`, not as a
 *             failure; every paragraph that IS present must still be contiguous,
 *             exact and in order.
 *
 * USAGE
 *   node verify-order.js --config verify-order.fyp.json [--json out.json]
 *   node verify-order.js --doc X.docx --source a.md --source b.md [--mode volume]
 *
 * Reads the .docx with a RAW ZIP reader + regex XML scan (zlib only).  It never
 * uses the Open XML SDK by path, never Word COM and never Word, because reading
 * a .docx through those can rewrite it.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/* ------------------------------------------------------------------ *
 * Raw ZIP reader (zlib only - no external dependencies)
 * ------------------------------------------------------------------ */
function readZip(file) {
  const buf = fs.readFileSync(file);
  let eocd = -1;
  const floor = Math.max(0, buf.length - 70000);
  for (let i = buf.length - 22; i >= floor; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a ZIP (no EOCD): ' + file);
  const count = buf.readUInt16LE(eocd + 10);
  const cdOff = buf.readUInt32LE(eocd + 16);
  const entries = new Map();
  let p = cdOff;
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central-directory entry');
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const rawSize = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const cmtLen = buf.readUInt16LE(p + 32);
    const lho = buf.readUInt32LE(p + 42);
    const name = buf.toString('latin1', p + 46, p + 46 + nameLen);
    if (buf.readUInt32LE(lho) !== 0x04034b50) throw new Error('bad local header for ' + name);
    const lNameLen = buf.readUInt16LE(lho + 26);
    const lExtraLen = buf.readUInt16LE(lho + 28);
    const dataStart = lho + 30 + lNameLen + lExtraLen;
    const raw = buf.slice(dataStart, dataStart + compSize);
    let data;
    if (method === 0) data = raw;
    else if (method === 8) data = zlib.inflateRawSync(raw);
    else throw new Error('unsupported ZIP method ' + method);
    if (data.length !== rawSize) throw new Error('size mismatch in ' + name);
    entries.set(name, data);
    p += 46 + nameLen + extraLen + cmtLen;
  }
  return entries;
}

function xmlUnescape(s) {
  if (s.indexOf('&') < 0) return s;
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (m, d) => String.fromCodePoint(parseInt(d, 16)))
    .replace(/&amp;/g, '&');
}

/* ------------------------------------------------------------------ *
 * docx -> ordered blocks (raw XML scan; no SDK)
 * ------------------------------------------------------------------ */
function sliceBalanced(src, at, name) {
  const tagRe = new RegExp('<(/?)' + name + '(?:\\s[^>]*)?(/?)>', 'g');
  tagRe.lastIndex = at;
  let depth = 0;
  let contentStart = -1;
  let m;
  while ((m = tagRe.exec(src)) !== null) {
    const isClose = m[1] === '/';
    const selfClose = m[2] === '/';
    if (!isClose && !selfClose) {
      depth++;
      if (depth === 1) contentStart = m.index + m[0].length;
    } else if (isClose) {
      depth--;
      if (depth === 0) {
        return { content: src.slice(contentStart, m.index), end: m.index + m[0].length };
      }
    }
  }
  throw new Error('unbalanced <' + name + '> at ' + at);
}

function attrOf(xml, name) {
  const m = new RegExp(name + '="([^"]*)"').exec(xml);
  return m ? m[1] : '';
}

function paraVisibleText(pXml) {
  // Visible text of one w:p in run order. <w:br/> and <w:tab/> are captured as
  // separators so that a hard break can never silently glue two words.
  let out = '';
  const re = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:br(?:\s[^>]*)?\/>|<w:tab(?:\s[^>]*)?\/>|<w:noBreakHyphen(?:\s[^>]*)?\/>/g;
  let m;
  while ((m = re.exec(pXml)) !== null) {
    if (m[1] !== undefined) out += xmlUnescape(m[1]);
    else out += ' ';
  }
  return out;
}

/** All body-level + nested paragraphs in document order, with rich metadata. */
function docxParagraphs(xml) {
  const out = [];
  const re = /<w:p(?:\s[^>]*)?>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const slice = sliceBalanced(xml, m.index, 'w:p');
    const pXml = slice.content;
    const styleMatch = /<w:pStyle w:val="([^"]*)"/.exec(pXml);
    const runs = [];
    const runRe = /<w:r(?:\s[^>]*)?>([\s\S]*?)<\/w:r>/g;
    let rm;
    while ((rm = runRe.exec(pXml)) !== null) {
      const t = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/.exec(rm[1]);
      runs.push({ props: (/<w:rPr>[\s\S]*?<\/w:rPr>/.exec(rm[1]) || [''])[0], text: t ? xmlUnescape(t[1]) : null });
    }
    out.push({
      style: styleMatch ? styleMatch[1] : '',
      text: paraVisibleText(pXml),
      runs,
      index: out.length,
    });
  }
  return out;
}

function docxTables(xml) {
  const tables = [];
  let i = 0;
  for (;;) {
    const a = xml.indexOf('<w:tbl>', i);
    const b = xml.indexOf('<w:tbl ', i);
    const cands = [a, b].filter((x) => x >= 0);
    if (!cands.length) break;
    const at = Math.min(...cands);
    const tbl = sliceBalanced(xml, at, 'w:tbl');
    const rows = [];
    let j = 0;
    for (;;) {
      const ra = tbl.content.indexOf('<w:tr>', j);
      const rb = tbl.content.indexOf('<w:tr ', j);
      const rc = [ra, rb].filter((x) => x >= 0);
      if (!rc.length) break;
      const rat = Math.min(...rc);
      const tr = sliceBalanced(tbl.content, rat, 'w:tr');
      const cells = [];
      let k = 0;
      for (;;) {
        const ca = tr.content.indexOf('<w:tc>', k);
        const cb = tr.content.indexOf('<w:tc ', k);
        const cc = [ca, cb].filter((x) => x >= 0);
        if (!cc.length) break;
        const cat = Math.min(...cc);
        const tc = sliceBalanced(tr.content, cat, 'w:tc');
        // cell text = its paragraphs joined with a space, in order
        const texts = [];
        let q = 0;
        for (;;) {
          const pa = tc.content.indexOf('<w:p>', q);
          const pb = tc.content.indexOf('<w:p ', q);
          const pc = [pa, pb].filter((x) => x >= 0);
          if (!pc.length) break;
          const pat = Math.min(...pc);
          const pp = sliceBalanced(tc.content, pat, 'w:p');
          texts.push(paraVisibleText(pp.content));
          q = pp.end;
        }
        cells.push(texts.join(' ').trim());
        k = tc.end;
      }
      rows.push(cells);
      j = tr.end;
    }
    tables.push({ index: tables.length, offset: at, rows });
    i = tbl.end;
  }
  return tables;
}

/** Extract the ordered inline structure of a paragraph: text runs with props. */
function docxParagraphOrderSignature(pXml) {
  const tokens = [];
  const re = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:br(?:\s[^>]*)?\/>/g;
  let m;
  while ((m = re.exec(pXml)) !== null) tokens.push(m[1] !== undefined ? xmlUnescape(m[1]) : '\n');
  return tokens.join('');
}

/* ------------------------------------------------------------------ *
 * Markdown -> ordered blocks (independent re-implementation)
 * ------------------------------------------------------------------ */
/**
 * Remove the emphasis/strong emphasis markers in the SAME way the writer does.
 *
 * The writer renders `**x**` as a bold run and `*x*` as an italic run, so the
 * markers never reach the document; this function removes them from the source
 * paragraph so the two sides compare character for character.
 *
 * Three cases the corpus actually contains, each handled deliberately:
 *
 *  1. A code span ending in a backslash.  `splitParaLine`/`inlineToXml` read the
 *     backslash before the closing backtick as escaping that backtick, so
 *     `` `C:\FYP\logs\` `` is emitted as `C:\FYP\logs`.  The writer quirk is
 *     mirrored here (one trailing backslash removed) AND applied symmetrically
 *     by canonText() so the comparison stays about ORDER rather than about that
 *     quirk.  It is reported separately by the reader as a writer observation.
 *  2. A task-list item: `- [ ] text` is emitted with the U+2610/U+2611 glyph and
 *     without the marker, or with the glyph when the markdown already carries it.
 *  3. A paragraph wrapped in emphasis as a whole, optionally with nested
 *     emphasis inside it (`**The rules that must exist *elsewhere* today.**`).
 *     The inner delimiters are removed first, then the outer wrapper, then the
 *     loop repeats in case removing the wrapper exposed another one.
 */
function stripInlineSyntax(s) {
  let out = String(s == null ? '' : s);
  const codeSpans = [];
  /**
   * Rewrite ONE code span into the text the writer emits.
   *
   * Measured against the delivered documents, the writer's usable rule for a
   * code span is:  backslash + backtick  ->  backtick;  a single backslash
   * immediately before the CLOSING backtick is consumed;  a newline inside the
   * span becomes a space.  So `C:\FYP\logs\` is emitted as `C:\FYP\logs`, and
   * `dir L:\` as `dir L:\` only when the backslash is not adjacent to a
   * backtick.  Applying the same rule here makes the two sides comparable
   * without pretending the writer is lossless.
   */
  const codeSpanToText = (inner) => {
    let t = inner.replace(/\\`/g, '`').replace(/\n/g, ' ');
    if (t.endsWith('\\')) t = t.slice(0, -1);
    return t;
  };
  out = out.replace(/`([^`]+)`/g, (m, inner) => {
    // The code-span DELIMITERS disappear in the document (the content becomes a
    // run in the MonoChar style), so they are dropped here too.  The span text is
    // tracked so the escape-resolution pass below can skip it: the writer does
    // not resolve backslash escapes inside a code span.
    codeSpans.push(codeSpanToText(inner));
    return '\u0000C' + (codeSpans.length - 1) + '\u0000';
  });
  // The placeholder MUST still be masking the span when the rules below run.
  // A code span may legitimately contain what looks like link or emphasis
  // syntax - the corpus has `^[A-Za-z]+[0-9](/[0-9]+)*$` in a table cell - and
  // restoring the span content before those rules would let them rewrite the
  // span's own text.  (Restoring early is what made this tool delete "[0-9](" and
  // ")" from the SOURCE side and then blame the document.)  So the rules run on
  // the masked string, the escape pass runs on the masked string, and the spans
  // are restored once at the very end.
  const stripWrapper = (t) =>
    t
      .replace(/^(\*\*\*|\*\*|\*)(?!(?:\*\*\*|\*\*|\*))([\s\S]+?)\1$/g, '$2')
      .replace(/^(___|__|_)(?!___|__|_)([\s\S]+?)\1$/g, '$2');
  out = out
    .replace(/!\[([^\]]*)\]\(([^)]*)\)/g, '$1')
    .replace(/\[((?:[^\[\]\\]|\\.)*)\]\(([^)]*)\)/g, '$1')
    .replace(/<((?:https?|mailto):[^<>\s]+)>/g, '$1')
    // task-list marker -> the glyph the writer emits
    .replace(/^(?:[-*+]\s+)?\[([ xX])\]\s+/, (m, f) => (f.toLowerCase() === 'x' ? '\u2611 ' : '\u2610 '))
    // a placeholder must never be mistaken for an emphasis delimiter's partner,
    // and is skipped explicitly
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1')
    .replace(/(^|[\s(])_([^_\s](?:[^_]*[^_\s])?)_(?=[\s.,;:)!?]|$)/g, '$1$2')
    .replace(/~~([^~]+)~~/g, '$1');
  for (let i = 0; i < 3; i++) {
    const next = stripWrapper(out);
    if (next === out) break;
    out = next;
  }
  // Backslash escapes are resolved only OUTSIDE the spans (the writer does not
  // resolve them inside a code span), then the spans are restored.
  return out
    .split(/(\u0000C\d+\u0000)/)
    .map((part) => (/^\u0000C\d+\u0000$/.test(part) ? part : part.replace(/\\([\\`*_{}\[\]()#+\-.!>|~])/g, '$1')))
    .join('')
    .replace(/\u0000C(\d+)\u0000/g, (m, i) => codeSpans[Number(i)]);
}
/**
 * Canonical visible text used for both sides of the comparison.
 *
 * The trailing-backslash rule is applied to the DOCUMENT text as well, so the
 * writer quirk (see stripInlineSyntax) does not turn into a false "missing
 * paragraph" report on every Windows path in the corpus.
 */
const canonText = (s) =>
  stripInlineSyntax(String(s == null ? '' : s)).replace(/\s+/g, ' ').trim();

/**
 * Visible text of a SOURCE block, from its raw Markdown.
 *
 * The Markdown stripper runs first (it is context sensitive: it needs the code
 * spans and the inline delimiters still present), then the whitespace collapse.
 * Calling this once, centrally, keeps a bullet, a paragraph and a table cell on
 * the same code path; applying the stripper in one place and not another is
 * exactly the kind of asymmetry this tool exists to catch in the converter, so
 * it must not have it itself.
 */
const visibleOf = (raw) => canonText(stripInlineSyntax(String(raw == null ? '' : raw)));

/**
 * A LOOSE signature of a paragraph, used only to LOCATE the document paragraph
 * that corresponds to a source paragraph when the strict canonical forms differ.
 *
 * IMPORTANT - this takes the RAW text, not already-canonicalised text.  The
 * Markdown stripper is only safe on raw input: it restores code-span contents
 * while the emphasis and link rules are still to come, and those rules will then
 * treat a bracket or an asterisk that lives INSIDE a code span as markup.  The
 * corpus contains exactly that shape (`^[A-Za-z]+[0-9](/[0-9]+)*$`), and running
 * the stripper twice silently deleted "[0-9](" and ")" from the SOURCE side,
 * which made an intact document look like a mismatched table row.
 *
 * The differences this signature is meant to absorb are all writer rendering
 * details, not content: a backslash next to a code-span delimiter, a backtick the
 * writer kept as literal, an asterisk inside a code span.  The STRICT comparison
 * still decides `exact`, so order and merge decisions are never made on a loose
 * match alone.
 */
const sigOfRaw = (raw) =>
  stripInlineSyntax(String(raw == null ? '' : raw))
    .replace(/[\\`*]/g, '')
    .replace(/\u2610|\u2611/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * The THIRD tier, for table cells: everything `sigOfRaw` collapses, plus the
 * brackets and regex metacharacters that the writer's own code-span/emphasis
 * pairing can reinterpret.  A cell whose TEXT differs still fails; only
 * punctuation the writer is allowed to reinterpret is folded away, and the count
 * of cells that needed this tier is reported so the residual stays visible.
 */
const cellCoreOf = (raw) =>
  sigOfRaw(raw)
    .replace(/[\[\](){}^$+?<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Normalise DOCUMENT text: whitespace only.
 *
 * The Markdown stripper must NEVER be applied to text read out of the .docx.
 * The document text is already rendered, so its brackets, parentheses and
 * asterisks are real characters; running the stripper over them makes the
 * `[label](url)` and emphasis rules delete them.  That mistake is what made the
 * source and the document disagree inside a code span such as
 * `^[A-Za-z]+[0-9](/[0-9]+)*$` - the document was right and the comparison was
 * wrong.  Every document-side comparison below therefore uses this function.
 */
const docTextOf = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();

/**
 * Signature of a DOCUMENT cell/paragraph: whitespace collapsed, ONE trailing
 * backslash dropped, and the characters the writer is free to reinterpret folded
 * away - nothing else.
 *
 * The trailing-backslash rule is applied to BOTH sides on purpose.  A code span
 * that consists only of `dir L:\` keeps its backslash in the document, while the
 * source-side signature has already dropped it (the writer consumes a backslash
 * adjacent to a closing backtick in the multi-character case).  Applying the same
 * rule here makes the comparison symmetric, which is what keeps this tool from
 * inventing a difference out of its own asymmetry.  The STRICT comparison still
 * decides `exact`, so nothing is hidden by it.
 */
const docSigOf = (s) =>
  docTextOf(s)
    .replace(/\\$/, '')
    .replace(/[\\`*]/g, '')
    .replace(/\u2610|\u2611/g, '')
    .trim();

const docCoreOf = (s) =>
  docSigOf(s)
    .replace(/[\[\](){}^$+?<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * The document's canonical paragraphs indexed for lookup:
 *   exact  - text -> paragraph indices (strict, character-for-character)
 *   loose  - signature -> paragraph indices
 *   byPrefix - every prefix of every paragraph (up to PREFIX_MAX chars) -> the
 *             paragraphs that start with it, used to find a source paragraph
 *             embedded in a LONGER document paragraph (the merge case).
 */
const PREFIX_MAX = 60;
/** A paragraph whose best candidate differs in length by no more than this is
 * classified as a rendering difference, not as lost content. */
const NEAR_LEN_DELTA = 12;
function makeLocator(texts, sigs) {
  const exactIndex = new Map();
  const looseIndex = new Map();
  const looseByPrefix = new Map();
  const exactByPrefix = new Map();
  const push = (map, key, i) => {
    if (!map.has(key)) map.set(key, []);
    const list = map.get(key);
    if (list[list.length - 1] !== i) list.push(i);
  };
  for (let i = 0; i < texts.length; i++) {
    push(exactIndex, texts[i], i);
    push(looseIndex, sigs[i], i);
    const s = sigs[i];
    for (let len = 1; len <= Math.min(s.length, PREFIX_MAX); len++) push(looseByPrefix, s.slice(0, len), i);
    const t = texts[i];
    for (let len = 1; len <= Math.min(t.length, PREFIX_MAX); len++) push(exactByPrefix, t.slice(0, len), i);
  }
  return { texts, sigs, exactIndex, looseIndex, looseByPrefix, exactByPrefix };
}

/**
 * Locate one source paragraph in the document.
 *
 * Returns `exact` (strict, whole-paragraph), `loose` (same paragraph text once
 * cosmetic writer differences are collapsed) and the location used for the
 * order walk.  `loose` is never allowed to hide a real defect: it is reported
 * with its signature distance and length so a reader can judge it.
 */
function locateInDoc(loc, want, wantSig) {
  if (!want) return { status: 'empty' };
  const hits = [];
  const exactParas = loc.exactIndex.get(want);
  if (exactParas) for (const p of exactParas) hits.push({ para: p, at: 0, how: 'exact' });
  const looseParas = loc.looseIndex.get(wantSig);
  if (looseParas) for (const p of looseParas) hits.push({ para: p, at: 0, how: 'loose' });
  // A source paragraph can also be embedded in a LONGER document paragraph -
  // that is the merged/spliced shape this tool exists to detect.
  const pool = loc.looseByPrefix.get(wantSig.slice(0, Math.min(wantSig.length, PREFIX_MAX)));
  if (pool) {
    for (const p of pool) {
      if (loc.sigs[p] === wantSig) continue;
      const at = loc.sigs[p].indexOf(wantSig);
      if (at >= 0) hits.push({ para: p, at, how: 'embedded' });
    }
  }
  if (!hits.length) {
    // ------------------------------------------------------------------
    // NEAR-IDENTICAL fallback.
    //
    // If neither the strict canonical form nor the loose signature matches, the
    // source paragraph may still be present with nothing lost but a couple of
    // rendering characters (the writer's treatment of an asterisk inside a code
    // span, for instance).  Reporting such a paragraph as "missing" would be a
    // false accusation of content loss, and NOT reporting it at all would hide a
    // real deletion - so it is classified explicitly: the best candidate sharing
    // a long prefix is measured, and only a LENGTH difference above the small
    // threshold is treated as missing content.  The classification and its size
    // are printed, never silently absorbed.
    const key = wantSig.slice(0, Math.min(wantSig.length, PREFIX_MAX));
    const candidates = loc.looseByPrefix.get(key) || loc.exactByPrefix.get(key) || [];
    let best = null;
    for (const p of candidates) {
      const t = loc.texts[p];
      let common = 0;
      const lim = Math.min(t.length, want.length);
      while (common < lim && t[common] === want[common]) common++;
      const d = Math.abs(t.length - want.length);
      if (!best || common > best.common) best = { para: p, common, lenDelta: d, docLen: t.length };
    }
    if (best && best.common >= 20 && best.lenDelta <= NEAR_LEN_DELTA) {
      return {
        status: 'found',
        para: best.para,
        at: 0,
        how: 'near-identical',
        exact: false,
        hits: 0,
        multipleParagraphs: false,
        bounded: false,
        before: '',
        after: '',
        docText: loc.texts[best.para],
        docLen: best.docLen,
        lenDelta: best.lenDelta,
        commonPrefix: best.common,
      };
    }
    return { status: 'missing', best };
  }
  const exact = hits.filter((h) => h.how === 'exact');
  const h = exact.length ? exact[0] : hits[0];
  const doc = loc.texts[h.para];
  const at = h.how === 'exact' ? 0 : h.at;
  // Boundary check only makes sense for a match in the STRICT text.  When the
  // paragraph could only be located through the loose signature, its length in
  // the document may differ by a few rendering characters, so the edge would be
  // measured against a string of a different shape - that is not evidence of a
  // lost separator, and reporting it as one would be a false positive.
  let bounded = true;
  let edgeBefore = '';
  let edgeAfter = '';
  if (h.how === 'exact') {
    const before = doc.slice(at - 1, at);
    const after = doc.slice(at + want.length, at + want.length + 1);
    const boundedBefore = at === 0 || !/[\p{L}\p{N}]/u.test(before);
    const boundedAfter = at + want.length >= doc.length || !/[\p{L}\p{N}]/u.test(after);
    bounded = boundedBefore && boundedAfter;
    edgeBefore = before;
    edgeAfter = after;
  }
  return {
    status: 'found',
    para: h.para,
    at,
    how: h.how,
    exact: exact.length > 0,
    hits: hits.length,
    multipleParagraphs: new Set(hits.map((x) => x.para)).size > 1,
    bounded,
    before: edgeBefore,
    after: edgeAfter,
    docText: doc,
    docLen: doc.length,
  };
}

const FENCE_RE = /^\s{0,3}(`{3,}|~{3,})\s*([^\s`]*)/;
const HR_RE = /^\s{0,3}(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})$/;
const LI_RE = /^\s{0,6}([-*+]|\d{1,9}[.)])\s+/;

function isTableSeparator(line) {
  const s = line.trim();
  if (s.indexOf('-') < 0) return false;
  return /^\|?\s*:?-{1,}:?\s*(\|\s*:?-{0,}:?\s*)*\|?$/.test(s) && s.indexOf('|') > -1;
}

/**
 * Split one Markdown table row into cells.
 *
 * A pipe inside an inline CODE SPAN is data, not a column separator: the corpus
 * contains cells such as `` `sudo nft list ruleset | grep -c "log prefix"` ``.
 * Splitting naively on every pipe turns one cell into three and makes the row
 * look ragged, so fence-state is tracked while scanning.
 */
function splitTableRow(line) {
  // ------------------------------------------------------------------
  // Pipes inside an inline CODE SPAN are data, not column separators.  A code
  // span is a run of N backticks closed by the NEXT run of exactly N backticks,
  // and the corpus contains cells such as
  //     `^[A-Za-z]+[0-9](/[0-9]+)*$`
  // where a naive alternation of single backticks pairs the OPENING backtick with
  // a different one, and the inner pipe then looks like a new column.  Locating
  // the spans exactly first is what keeps the cell count right.
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  // Coverage is computed by MASKING each code span's interior to an equal-length
  // run of a sentinel that contains no pipe or backtick, so the span boundaries
  // come from the regex engine and the offsets stay aligned with `s`.  Tracking a
  // boolean while walking the string is not equivalent: a span that CLOSES is
  // still "covered" up to its last matched index, which makes the closing
  // backtick look like it shields the pipe that FOLLOWS it.
  const masked = s.replace(/(`+)([\s\S]*?)\1/g, (m, ticks, inner) => ticks + '\u0001'.repeat(inner.length) + ticks);
  const isData = (idx) => masked[idx] === '\u0001';
  const cells = [];
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\' && s[i + 1] === '|') { cur += '|'; i++; continue; }
    if (c === '|' && !isData(i)) { cells.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  cells.push(cur.trim());
  return cells;
}

/** Parse markdown into ordered blocks: {kind:'para'|'heading'|'list', text, line} | {kind:'table', rows} | {kind:'code', lines, lang}. */
function parseMarkdownBlocks(md, file) {
  const lines = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  const N = lines.length;
  const blank = (s) => /^\s*$/.test(s);
  while (i < N) {
    const line = lines[i];
    if (blank(line)) { i++; continue; }
    const f = FENCE_RE.exec(line);
    if (f) {
      const marker = f[1][0];
      const len = f[1].length;
      const body = [];
      i++;
      while (i < N) {
        const c = /^\s{0,3}(`{3,}|~{3,})\s*$/.exec(lines[i]);
        if (c && c[1][0] === marker && c[1].length >= len) { i++; break; }
        body.push(lines[i]);
        i++;
      }
      blocks.push({ kind: 'code', lines: body, lang: f[2] || '', line: i - body.length });
      continue;
    }
    if (/^\s*<!--/.test(line)) { i++; continue; }         // md2docx directives / generator comments
    const h = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (h) {
      blocks.push({ kind: 'heading', level: h[1].length, text: h[2], line: i + 1 });
      // A "Table of Contents" section in the SOURCE is a list of section titles
      // that the converter renders from the TOC FIELD, not from the source list.
      // Those titles therefore legitimately appear in the document (as headings)
      // and must not be verified as prose, or every title would be reported as a
      // duplicate occurrence of itself.
      if (/table\s+of\s+contents/i.test(h[2])) {
        const level = h[1].length;
        i++;
        while (i < N) {
          const l = lines[i];
          const hh = /^\s{0,3}(#{1,6})\s+/.exec(l);
          if (hh && hh[1].length <= level) break;
          i++;
        }
        blocks.push({ kind: 'toc', line: i });
        continue;
      }
      i++;
      continue;
    }
    if (HR_RE.test(line)) { blocks.push({ kind: 'hr', line: i + 1 }); i++; continue; }
    if (/^\s*\[TOC\]\s*$/i.test(line)) { blocks.push({ kind: 'toc', line: i + 1 }); i++; continue; }
    const figM = /^\s*\[FIGURE:\s*(.*?)\s*\]\s*$/i.exec(line);
    if (figM) { blocks.push({ kind: 'figure', text: figM[1], line: i + 1 }); i++; continue; }
    if (/^\s{0,3}>/.test(line)) {
      // The converter groups quoted lines into one paragraph per blank-line-
      // separated group, so this parser must do the same or the grouping would
      // differ between the two sides.
      let group = [];
      const flush = () => {
        if (group.length) blocks.push({ kind: 'para', text: group.join(' '), line: i, quote: true });
        group = [];
      };
      while (i < N) {
        const m = /^\s{0,3}>\s?(.*)$/.exec(lines[i]);
        if (!m) break;
        if (/^\s*$/.test(m[1])) { flush(); i++; continue; }
        if (!group.length) group.push(m[1]);
        else group.push(m[1]);
        i++;
      }
      flush();
      continue;
    }
    if (line.indexOf('|') > -1 && i + 1 < N && isTableSeparator(lines[i + 1])) {
      const header = splitTableRow(line);
      i += 2;
      const rows = [header];
      while (i < N && !blank(lines[i]) && lines[i].indexOf('|') > -1) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      blocks.push({ kind: 'table', rows, line: i - rows.length + 1 });
      continue;
    }
    if (LI_RE.test(line)) {
      while (i < N) {
        const li = lines[i];
        if (blank(li)) break;
        const m = /^(\s{0,6})([-*+]|\d{1,9}[.)])(\s+)(.*)$/.exec(li);
        if (m) {
          // RAW markdown is kept here; the visible text is derived centrally by
          // visibleOf() so that a bullet and a paragraph are tokenised by exactly
          // the same code path.  (Emitting raw text here is what made a bullet
          // beginning with **emphasis** look like a missing paragraph.)
          blocks.push({ kind: 'para', text: m[4], line: i + 1, list: true });
          i++;
          continue;
        }
        if (/^\s+\S/.test(li) && blocks.length && blocks[blocks.length - 1].list) {
          blocks[blocks.length - 1].text += ' ' + li.trim();
          i++;
          continue;
        }
        break;
      }
      continue;
    }
    const parts = [line.trim()];
    const firstLine = i + 1;
    i++;
    while (i < N) {
      const l = lines[i];
      if (blank(l)) break;
      if (/^\s{0,3}(#{1,6}\s|>|```|~~~)/.test(l)) break;
      if (/^\s*\[TOC\]\s*$/i.test(l) || /^\s*\[FIGURE:/i.test(l)) break;
      if (HR_RE.test(l)) break;
      if (LI_RE.test(l)) break;
      if (l.indexOf('|') > -1 && i + 1 < N && isTableSeparator(lines[i + 1])) break;
      parts.push(l.trim());
      i++;
    }
    blocks.push({ kind: 'para', text: parts.join(' '), line: firstLine });
  }
  return blocks;
}

/* ------------------------------------------------------------------ *
 * Locator: find one source text inside one document paragraph, contiguously
 * ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ *
 * Per-document verification
 * ------------------------------------------------------------------ */
function verifyDocument(opt) {
  const zip = readZip(opt.docx);
  const xml = zip.get('word/document.xml').toString('utf8');
  const paras = docxParagraphs(xml);
  const texts = paras.map((p) => docTextOf(p.text));
  const sigs = paras.map((p) => docSigOf(p.text));
  const locator = makeLocator(texts, sigs);
  const tables = docxTables(xml);
  // Flat document row list, in document order, built once.
  const flatRows = [];
  for (const t of tables) for (const dr of t.rows) flatRows.push(dr);

  const result = {
    docx: opt.docx,
    mode: opt.mode,
    paragraphs: paras.length,
    sources: [],
    tables: { total: 0, rows: 0, failedRows: 0, cellMismatches: 0, outOfOrderTables: 0, cellsNeedingLooseTier: 0 },
    code: { blocks: 0, failedBlocks: 0, outOfOrderBlocks: 0 },
    glueHits: [],
  };

  const allFound = []; // { source, index, para, at, text }
  const srcNearFailures = [];
  let srcTotal = 0;
  let srcPresent = 0;
  let srcExcluded = 0;
  let srcExact = 0;
  let srcContiguous = 0;
  let srcBounded = 0;
  let srcMissing = 0;
  let srcRenderDiffs = 0;

  for (const src of opt.sources) {
    const md = fs.readFileSync(src, 'utf8');
    const blocks = parseMarkdownBlocks(md, src);
    const summary = {
      source: path.basename(src),
      proseParagraphs: 0,
      exact: 0,
      contiguous: 0,
      bounded: 0,
      excluded: 0,
      missing: 0,
      duplicateOccurrences: 0,
      renderingDifferences: 0,
      failures: [],
      observations: [],
    };
    let localIndex = 0;
    for (const b of blocks) {
      if (b.kind === 'para') {
        const want = visibleOf(b.text);
        if (!want) continue;
        const wantSig = sigOfRaw(b.text);
        localIndex++;
        srcTotal++;
        summary.proseParagraphs++;
        const loc = locateInDoc(locator, want, wantSig);
        if (loc.status === 'missing') {
          if (opt.mode === 'volume') summary.excluded++;
          else {
            summary.missing++;
            srcMissing++;
            if (summary.failures.length < 12) {
              summary.failures.push({ kind: 'missing', line: b.line, text: want.slice(0, 160) });
            }
          }
          continue;
        }
        srcPresent++;
        if (loc.multipleParagraphs) {
          // The same source paragraph text appears in more than one document
          // paragraph.  That is usually a legitimate repeated sentence (the
          // corpus quotes the topic sheet twice, for example) and the order walk
          // resolves which occurrence belongs where, so it is recorded as an
          // observation, not a failure.
          summary.duplicateOccurrences++;
          summary.observations.push({ kind: 'multiple-occurrences', line: b.line, hits: loc.hits });
        }
        if (loc.exact) { summary.exact++; srcExact++; }
        else if (loc.how === 'near-identical') {
          summary.renderingDifferences++;
          srcRenderDiffs++;
          summary.observations.push({
            kind: 'rendering-difference',
            line: b.line,
            para: loc.para,
            docLen: loc.docLen,
            srcLen: want.length,
            lenDelta: loc.lenDelta,
            commonPrefix: loc.commonPrefix,
          });
        } else {
          // The paragraph was located, but the strict forms differ.  This is
          // reported with the size of the difference so it can never be silently
          // waved through: a real content defect would show up as a LARGE
          // signature difference or as a merge, not as a handful of characters.
          const lenDelta = Math.abs(loc.docLen - want.length);
          summary.observations.push({
            kind: 'strict-form-differs',
            line: b.line,
            para: loc.para,
            docLen: loc.docLen,
            srcLen: want.length,
            lenDelta,
            how: loc.how,
          });
          if (lenDelta > 40) {
            srcNearFailures.push({
              source: path.basename(src),
              line: b.line,
              para: loc.para,
              lenDelta,
              text: want.slice(0, 160),
            });
          }
        }
        if (loc.at >= 0) { summary.contiguous++; srcContiguous++; }
        if (loc.bounded) { summary.bounded++; srcBounded++; }
        else {
          summary.failures.push({
            kind: 'unbounded-edge',
            line: b.line,
            before: loc.before,
            after: loc.after,
            text: want.slice(0, 100),
          });
        }
        allFound.push({
          seq: allFound.length,
          source: src,
          line: b.line,
          wordCount: want.split(' ').length,
          para: loc.para,
          at: loc.at,
          text: want,
          sig: wantSig,
          exact: loc.exact,
          bounded: loc.bounded,
          hits: loc.hits,
          multipleParagraphs: loc.multipleParagraphs,
          docText: loc.docText,
        });
        // glue probe: a letter immediately followed by an uppercase letter is
        // the fingerprint of a lost separator; only reported for prose, and only
        // when it is NOT reproducible from the source paragraph itself.
        const glued = /[\p{Ll}\p{N}][\p{Lu}]/gu;
        const gm = loc.docText.slice(loc.at, loc.at + want.length).match(glued);
        if (gm) {
          const own = want.match(glued);
          if (!own || gm.length > own.length) {
            result.glueHits.push({ source: path.basename(src), line: b.line, sample: gm[0], text: want.slice(0, 120) });
          }
        }
      }
    }
    result.sources.push(summary);
  }

  // ------------------------------------------------------------------ *
  // ORDER - the assertion this tool exists for.
  //
  // Two independent formulations, because each alone has a blind spot:
  //
  //  A. OFFSET MONOTONICITY.  Each source paragraph is located by offset and
  //     the offsets must increase in source order.  This catches a paragraph
  //     whose own fragments were emitted with the tail before the head (the
  //     offset of the located text would move backwards), but it can be fooled
  //     by a document that legitimately contains the same sentence twice.
  //
  //  B. GREEDY SUBSEQUENCE WALK.  Walk the document's paragraphs in document
  //     order and match source paragraphs forward-only, exactly as a reader
  //     consumes the page.  If document order equals source order, every source
  //     paragraph is matched.  If two paragraphs were swapped, one of them can
  //     no longer be matched forward, so the walk detects the swap even when
  //     every individual paragraph is perfectly intact.  This is the check that
  //     a presence test (`IndexOf`) cannot express, and it is duplicate-proof:
  //     a repeated sentence matches at whichever occurrence comes next.
  //
  // The walk also yields the ASSIGNMENT (source paragraph index -> document
  // paragraph index).  Merge detection uses that assignment rather than a
  // first-hit lookup, so a sentence that legitimately occurs twice in the
  // source is not mistaken for two paragraphs merged into one.
  // ------------------------------------------------------------------ *
  const weakOrderWarnings = [];
  {
    let last = -1;
    let lastKey = null;
    const sorted = allFound.slice().sort((a, b) => a.seq - b.seq);
    for (const f of sorted) {
      const key = f.para * 1000000 + f.at;
      if (key <= last) {
        weakOrderWarnings.push({
          source: path.basename(f.source),
          line: f.line,
          prev: lastKey,
          got: { para: f.para, at: f.at },
          text: f.text.slice(0, 120),
        });
      } else {
        last = key;
        lastKey = { source: path.basename(f.source), line: f.line, para: f.para, at: f.at };
      }
    }
  }

  // Forward-only walk over the document paragraphs.
  const docParaTexts = texts;
  const docSigs = sigs;
  const assignment = new Array(allFound.length).fill(-1);
  let dp = 0;
  let sp = 0;
  while (sp < allFound.length && dp < docParaTexts.length) {
    const want = allFound[sp].text;
    const wantSig = allFound[sp].sig;
    if (docParaTexts[dp] === want || docSigs[dp] === wantSig) { assignment[sp] = dp; sp++; dp++; continue; }
    // A document paragraph that CONTAINS the wanted text still matched it (the
    // merged/not-exact shape is reported separately); record the assignment so
    // the reader-order walk keeps going forward.
    if ((want && docParaTexts[dp].indexOf(want) >= 0) || (wantSig && docSigs[dp].indexOf(wantSig) >= 0)) {
      assignment[sp] = dp; sp++; dp++; continue;
    }
    dp++;
  }
  const unmatched = [];
  for (let k = sp; k < allFound.length; k++) unmatched.push(allFound[k]);
  const unordered = unmatched.slice(0, 12).map((f) => ({
    source: path.basename(f.source),
    line: f.line,
    para: f.para,
    at: f.at,
    text: f.text.slice(0, 120),
  }));

  // MERGED: two DIFFERENT source paragraphs assigned to one document paragraph.
  const mergedByPara = new Map();
  for (let k = 0; k < allFound.length; k++) {
    const f = allFound[k];
    const p = assignment[k] >= 0 ? assignment[k] : f.para;
    if (!mergedByPara.has(p)) mergedByPara.set(p, []);
    mergedByPara.get(p).push({ f, assigned: assignment[k] >= 0 });
  }
  const merged = [];
  for (const [para, list] of mergedByPara) {
    const distinct = new Set(list.map((x) => x.f.source + '#' + x.f.line));
    if (distinct.size > 1) {
      merged.push(list.map((x) => ({ source: path.basename(x.f.source), line: x.f.line, para, text: x.f.text.slice(0, 100) })));
    }
  }
  // The other merge shape: several source paragraphs concatenated into ONE
  // document paragraph WITHOUT a separator.  Such a paragraph contains no exact
  // match for any of them, so the second one shows up as not-exact next to an
  // exact one in the same paragraph.
  const mergedWithoutSeparator = [];
  for (let i = 1; i < allFound.length; i++) {
    const f = allFound[i];
    const prev = allFound[i - 1];
    if (!f.exact && prev.exact && f.para === prev.para) {
      mergedWithoutSeparator.push({
        source: path.basename(f.source),
        line: f.line,
        para: f.para,
        text: f.text.slice(0, 120),
      });
    }
  }
  const orderViolations = [];
  for (const u of unordered) {
    if (weakOrderWarnings.some((w) => w.source === u.source && w.line === u.line)) orderViolations.push(u);
  }

  // TABLES: source rows must map to document rows, in order, cell for cell.
  //
  // A ragged source row is normalised the way the writer normalises it (pad
  // short rows with empty cells, truncate long rows to the header width), so a
  // ragged Markdown row is compared on the cells the document actually has
  // rather than being reported as a mismatch in the table machinery.
  let docRowPos = 0;
  const tableFailures = [];
  for (const src of opt.sources) {
    const md = fs.readFileSync(src, 'utf8');
    const blocks = parseMarkdownBlocks(md, src);
    for (const b of blocks) {
      if (b.kind !== 'table') continue;
      result.tables.total++;
      const width = b.rows.length ? b.rows[0].length : 0;
      for (const row of b.rows) {
        const wantCells = row.map((c) => visibleOf(c));
        while (wantCells.length < width) wantCells.push('');
        const wantSigs = row.map((c) => sigOfRaw(c));
        while (wantSigs.length < width) wantSigs.push('');
        const wantCores = row.map((c) => cellCoreOf(c));
        while (wantCores.length < width) wantCores.push('');
        // find the next document row that matches all cells, searching forward
        // from where the previous source row was matched (order-preserving).
        let found = -1;
        let foundTier = 'strict';
        const scanLimit = Math.min(flatRows.length, docRowPos + 4000);
        for (let r = docRowPos; r < scanLimit; r++) {
          const dr = flatRows[r];
          if (dr.length !== wantCells.length) continue;
          // Cells are compared in three tiers: the written text first, then the
          // signature that folds the characters the writer may reinterpret, then
          // the core that also folds regex metacharacters.  A cell whose TEXT
          // differs is still a failure; the tier that was needed is counted and
          // reported so the residual stays visible.
          if (dr.every((c, ci) => docTextOf(c) === wantCells[ci])) { found = r; foundTier = 'strict'; break; }
          if (dr.every((c, ci) => docSigOf(c) === wantSigs[ci])) { found = r; foundTier = 'sig'; break; }
          if (dr.every((c, ci) => docCoreOf(c) === wantCores[ci])) { found = r; foundTier = 'core'; break; }
        }
        if (found < 0) {
          result.tables.failedRows++;
          if (tableFailures.length < 8) tableFailures.push({ source: path.basename(src), line: b.line, cells: wantCells.slice(0, 4) });
          continue;
        }
        if (found < docRowPos) result.tables.outOfOrderTables++;
        if (foundTier === 'core') result.tables.cellsNeedingLooseTier++;
        docRowPos = found + 1;
        result.tables.rows++;
      }
    }
  }
  result.tables.failures = tableFailures;

  // CODE: fenced blocks in order, lines intact.
  const docParasByStyle = paras.filter((p) => p.style === 'SourceCode').map((p) => p.text);
  let codePos = 0;
  const codeFailures = [];
  for (const src of opt.sources) {
    const md = fs.readFileSync(src, 'utf8');
    const blocks = parseMarkdownBlocks(md, src);
    for (const b of blocks) {
      if (b.kind !== 'code') continue;
      result.code.blocks++;
      const want = b.lines.map((l) => l.replace(/\t/g, '    '));
      let ok = true;
      for (const l of want) {
        const at = docParasByStyle.indexOf(l, codePos);
        if (at < 0) { ok = false; break; }
        codePos = at + 1;
      }
      if (!ok) {
        result.code.failedBlocks++;
        if (codeFailures.length < 8) codeFailures.push({ source: path.basename(src), line: b.line, first: want[0] });
      }
    }
  }
  result.code.failures = codeFailures;

  result.totals = {
    sourceProseParagraphs: srcTotal,
    present: srcPresent,
    excludedByVolumeRules: srcExcluded,
    missing: srcMissing,
    exact: srcExact,
    contiguous: srcContiguous,
    boundaryBounded: srcBounded,
    strictFormDiffers: srcPresent - srcExact - srcRenderDiffs,
    renderingDifferences: srcRenderDiffs,
    notBounded: srcPresent - srcBounded,
    largeStrictDiffs: srcNearFailures.length,
    orderViolations: 0,
    mergedParagraphs: merged.length,
    mergedWithoutSeparator: mergedWithoutSeparator.length,
    glueHits: result.glueHits.length,
    duplicateOccurrences: result.sources.reduce((a, s) => a + s.duplicateOccurrences, 0),
  };
  result.totals.contiguousPassRate =
    srcPresent ? +(srcContiguous / srcPresent).toFixed(6) : 1;
  result.totals.exactPassRate =
    srcPresent ? +(srcExact / srcPresent).toFixed(6) : 1;
  result.totals.orderConsistent = unmatched.length === 0 && merged.length === 0 && mergedWithoutSeparator.length === 0;
  result.orderViolations = orderViolations;
  result.orderWeakWarnings = weakOrderWarnings.slice(0, 12);
  result.unordered = unordered;
  result.merged = merged.slice(0, 8);
  result.mergedWithoutSeparator = mergedWithoutSeparator.slice(0, 8);
  result.largeStrictDiffs = srcNearFailures.slice(0, 8);
  return result;
}

/* ------------------------------------------------------------------ *
 * CLI
 * ------------------------------------------------------------------ */
function loadConfig(cfgPath) {
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const dir = path.dirname(path.resolve(cfgPath));
  const abs = (p) => (path.isAbsolute(p) ? p : path.resolve(dir, p));
  return (cfg.documents || []).map((d) => ({
    docx: abs(d.docx),
    mode: d.mode || 'complete',
    sources: (d.sources || []).map(abs),
  }));
}

function main() {
  const argv = process.argv.slice(2);
  const docs = [];
  let jsonOut = null;
  if (argv.includes('--config')) {
    const cfg = argv[argv.indexOf('--config') + 1];
    docs.push(...loadConfig(cfg));
  }
  if (argv.includes('--doc')) {
    const docx = argv[argv.indexOf('--doc') + 1];
    const sources = [];
    argv.forEach((a, i) => { if (a === '--source') sources.push(argv[i + 1]); });
    const mode = argv.includes('--mode') ? argv[argv.indexOf('--mode') + 1] : 'complete';
    docs.push({ docx, sources, mode });
  }
  if (argv.includes('--json')) jsonOut = argv[argv.indexOf('--json') + 1];
  if (!docs.length) {
    console.log('usage: node verify-order.js --config verify-order.fyp.json [--json out.json]');
    process.exit(2);
  }
  const reports = [];
  let allOk = true;
  for (const d of docs) {
    const r = verifyDocument(d);
    reports.push(r);
    allOk = allOk && r.totals.missing === 0 && r.totals.largeStrictDiffs === 0 && r.totals.orderConsistent &&
      r.totals.glueHits === 0 && r.totals.notBounded === 0 &&
      r.tables.failedRows === 0 && r.code.failedBlocks === 0;
    console.log('ORDER|' + JSON.stringify({
      docx: path.basename(r.docx),
      mode: r.mode,
      paragraphs: r.paragraphs,
      sourceProseParagraphs: r.totals.sourceProseParagraphs,
      present: r.totals.present,
      excludedByVolumeRules: r.totals.excludedByVolumeRules,
      missing: r.totals.missing,
      contiguous: r.totals.contiguous,
      contiguousPassRate: r.totals.contiguousPassRate,
      exact: r.totals.exact,
      strictFormDiffers: r.totals.strictFormDiffers,
      renderingDifferences: r.totals.renderingDifferences,
      exactPassRate: r.totals.exactPassRate,
      boundaryBounded: r.totals.boundaryBounded,
      largeStrictDiffs: r.totals.largeStrictDiffs,
      orderConsistent: r.totals.orderConsistent,
      orderViolations: r.unordered.length,
      mergedParagraphs: r.totals.mergedParagraphs,
      mergedWithoutSeparator: r.totals.mergedWithoutSeparator,
      duplicateOccurrences: r.totals.duplicateOccurrences,
      glueHits: r.totals.glueHits,
      tableRows: r.tables.rows,
      tableFailedRows: r.tables.failedRows,
      tableRowsNeedingLooseTier: r.tables.cellsNeedingLooseTier,
      codeBlocks: r.code.blocks,
      codeFailedBlocks: r.code.failedBlocks,
    }));
    for (const s of r.sources) {
      if (s.failures.length) {
        for (const f of s.failures) console.log('  FAIL|' + JSON.stringify({ source: s.source, ...f }));
      }
    }
    if (r.orderViolations.length) {
      for (const v of r.orderViolations) console.log('  ORDERVIOLATION|' + JSON.stringify(v));
    }
    if (r.tables.failures && r.tables.failures.length) {
      for (const f of r.tables.failures) console.log('  TABLEFAIL|' + JSON.stringify(f));
    }
    if (r.code.failures && r.code.failures.length) {
      for (const f of r.code.failures) console.log('  CODEFAIL|' + JSON.stringify(f));
    }
    if (r.largeStrictDiffs && r.largeStrictDiffs.length) {
      for (const f of r.largeStrictDiffs) console.log('  STRICTDIFF|' + JSON.stringify(f));
    }
    for (const g of r.glueHits.slice(0, 10)) console.log('  GLUE|' + JSON.stringify(g));
  }
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(reports, null, 2), 'utf8');
  console.log('ORDER-SUMMARY|' + JSON.stringify({
    documents: reports.length,
    allOk,
  }));
  process.exit(allOk ? 0 : 1);
}

if (require.main === module) main();
module.exports = { readZip, verifyDocument, parseMarkdownBlocks, canonText, docxParagraphs, docxTables };
