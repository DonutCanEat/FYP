#!/usr/bin/env node
/**
 * assemble.js — build the shortened short proposal from its rewritten fragments.
 *
 * Two things make this more than a concatenation:
 *
 * 1. The built proposal must contain no more text than the owner asked for, and the
 *    saving must come from prose and table bulk rather than from lost substance. So
 *    this reports per-part and total word counts against the target.
 *
 * 2. The failure mode of a shortening job is a silently dropped decision, gate or
 *    identifier. So this extracts every identifier from the ORIGINAL document and from
 *    the assembled draft and reports any that went missing. A compression that loses
 *    "D-12" or "PB-7" has broken the document without breaking its prose.
 *
 * It never writes the deliverable unless told to: the default output is a staged file
 * beside the fragments, so that the staged text can be read and gated before it
 * replaces a pinned, gate-verified artefact.
 *
 * Usage:
 *   node assemble.js                 report only, writes the staged file
 *   node assemble.js --check         report only, writes nothing
 *   node assemble.js --publish       additionally copy the staged file over the deliverable
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = 'D:\\File\\School\\FYP';
const SRC = path.join(ROOT, 'proposal', 'short-halving');
const STAGED = path.join(SRC, '_staged-FYP-Proposal-SHORT.md');
const DELIVERABLE = path.join(ROOT, 'FYP-Proposal-SHORT.md');
const ORIGINAL = path.join(ROOT, 'proposal', 'integration', 'backup-short-halving', 'FYP-Proposal-SHORT.md.bak');

const TARGET_WORDS = 14000;

const PARTS = [
  '01-front-and-summary.md',
  '02-introduction.md',
  '03-aims-scope.md',
  '04-architecture.md',
  '05-layer1.md',
  '06-layer2.md',
  '07-plan.md',
  '08-standards-decisions.md',
  '09-risks-deliverables-nextsteps.md',
  '10-references.md',
];

// The document has no H1 (it opens with "## Front matter"), so the render must be
// given a title explicitly. These are the H2s the original carries, in order.
const EXPECTED_H2 = [
  'Front matter',
  '1. Executive summary',
  '2. Introduction and background',
  '3. Aim and objectives',
  '4. Scope',
  '5. Target architecture',
  '6. Layer 1 - the network and its services, built first',
  '7. Layer 2 - the AI management plane, built second',
  '8. Implementation plan',
  '9. Standards alignment',
  '10. Key decisions and open items',
  '11. Risks and mitigations',
  '12. Deliverables',
  '13. Immediate next steps',
  '14. References',
];

const isTableRow = (l) => /^\s*\|/.test(l);
const isHeading = (l) => /^#{1,6}\s/.test(l);
const isFence = (l) => /^\s*```/.test(l);
const words = (s) => (s.match(/\S+/g) || []).length;

function readUtf8(p) { return fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''); }

function normalise(text) {
  return text.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
}

/** Every identifier class the project uses, with the pattern that matches it. */
const ID_CLASSES = [
  ['decision', /\bD-\d{1,2}\b/g],
  ['deliverable (bare)', /\bD\d{1,2}\b/g],
  ['gate', /\bG[0-6]\b|\bG2-H\b/g],
  ['governance', /governance\s+G(?:10|[1-9])\b/gi],
  ['blocking', /\bB[1-3]\b/g],
  ['supervisor question', /\bSQ-[1-5]\b/g],
  ['use case', /\bUC-[1-6]\b/g],
  ['permission boundary test', /\bPB-[1-9]\b/g],
  ['evidence rule', /\bE[1-9]\b/g],
  ['risk', /\bR\d{1,2}\b/g],
  ['reachable row', /\bRW-0\d\b/g],
  ['not-reachable row', /\bNR-0\d[ab]?\b/g],
  ['trust boundary', /\bTB-\d{2}\b/g],
  ['completion condition', /\bC[1-8]\b/g],
  ['stage', /\bStage [ABCD]\b/g],
];

function idsIn(text) {
  const out = {};
  for (const [name, re] of ID_CLASSES) {
    out[name] = new Set((text.match(re) || []).map((s) => s.toUpperCase().replace(/\s+/g, ' ')));
  }
  return out;
}

function main() {
  const write = process.argv.includes('--check') ? false : true;
  const publish = process.argv.includes('--publish');

  const missing = PARTS.filter((f) => !fs.existsSync(path.join(SRC, f)));
  if (missing.length) {
    console.error('MISSING FRAGMENTS: ' + missing.join(', '));
    process.exit(2);
  }

  const issues = [];
  const warns = [];
  let combined = '';
  const stats = [];

  for (const f of PARTS) {
    const raw = readUtf8(path.join(SRC, f));
    const text = normalise(raw);
    const lines = text.split('\n');
    const proseLines = lines.filter((l) => !isTableRow(l) && !isHeading(l) && !isFence(l));
    const tableLines = lines.filter(isTableRow);
    const st = {
      part: f,
      bytes: Buffer.byteLength(raw, 'utf8'),
      prose: words(proseLines.join(' ')),
      table: words(tableLines.join(' ')),
      rows: tableLines.length,
    };
    st.total = st.prose + st.table;
    stats.push(st);

    // Converter hazards, same rules as the rest of the project.
    let inFence = false;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (isFence(l)) { inFence = !inFence; continue; }
      if (inFence) continue;
      if (/\[FIGURE:/i.test(l) && !/\[FIGURE:[^\]]*\]\s*$/i.test(l)) issues.push(`${f}:${i + 1} [FIGURE: ...] with no closing bracket`);
      if (/\*\*\*/.test(l)) issues.push(`${f}:${i + 1} triple asterisk emphasis`);
      const prev = lines[i - 1];
      if (l.trim() !== '' && prev !== undefined && prev.trim() !== '' &&
          !isTableRow(l) && !isTableRow(prev) && !isHeading(l) && !isHeading(prev) &&
          !/^\s*([-*+]|\d+\.)\s/.test(l) && !/^\s*([-*+]|\d+\.)\s/.test(prev) && !isFence(prev)) {
        issues.push(`${f}:${i + 1} possible hard-wrapped paragraph`);
      }
    }
    // Table rectangularity, tolerant of escaped pipes.
    let tbl = [];
    const flush = () => {
      if (tbl.length >= 2) {
        const counts = tbl.map((r) => r.c);
        if (counts.some((c) => c !== counts[0])) warns.push(`${f}:${tbl[0].line} table rows have unequal cell counts (${counts.join(', ')})`);
      }
      tbl = [];
    };
    for (let i = 0; i < lines.length; i++) {
      if (isTableRow(lines[i])) tbl.push({ line: i + 1, c: lines[i].trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).length });
      else flush();
    }
    flush();
    combined += text + '\n\n';
  }

  const doc = combined.replace(/\n{3,}/g, '\n\n').trim() + '\n';
  const docLines = doc.split('\n');

  // ---- structure ----------------------------------------------------------
  const h1 = docLines.filter((l) => /^#\s/.test(l));
  const h2 = docLines.filter((l) => /^##\s/.test(l)).map((l) => l.replace(/^##\s+/, '').trim());
  const toc = docLines.filter((l) => /^\s*\[TOC\]\s*$/i.test(l));
  if (h1.length) issues.push(`the document has ${h1.length} H1 heading(s); this deliverable has none, and an H1 would create a title page the render does not expect`);
  if (toc.length !== 1) issues.push(`found ${toc.length} [TOC] directives; exactly one is required`);
  const missingH2 = EXPECTED_H2.filter((e) => !h2.includes(e));
  const extraH2 = h2.filter((e) => !EXPECTED_H2.includes(e));
  if (missingH2.length) issues.push('missing expected H2: ' + missingH2.join(' | '));
  if (extraH2.length) issues.push('unexpected H2: ' + extraH2.join(' | '));
  if (!missingH2.length && !extraH2.length && JSON.stringify(h2) !== JSON.stringify(EXPECTED_H2)) warns.push('H2 order differs from the original document order');

  // ---- identifier survival ------------------------------------------------
  const draftIds = idsIn(doc);
  let originalIds = null;
  if (fs.existsSync(ORIGINAL)) {
    originalIds = idsIn(readUtf8(ORIGINAL));
  } else {
    warns.push('original backup not found, so identifier survival could not be checked');
  }

  const lost = [];
  if (originalIds) {
    for (const cls of Object.keys(originalIds)) {
      for (const id of originalIds[cls]) {
        if (!draftIds[cls].has(id)) lost.push(`${cls} ${id}`);
      }
    }
  }

  const proseTotal = stats.reduce((a, s) => a + s.prose, 0);
  const tableTotal = stats.reduce((a, s) => a + s.table, 0);
  const grand = proseTotal + tableTotal;
  const rows = stats.reduce((a, s) => a + s.rows, 0);
  const toConfirm = (doc.match(/\[TO CONFIRM/gi) || []).length;

  // ---- report -------------------------------------------------------------
  console.log('PART                                    BYTES    PROSE    TABLE    TOTAL   TROWS');
  for (const s of stats) {
    console.log(`${s.part.padEnd(38)} ${String(s.bytes).padStart(7)} ${String(s.prose).padStart(8)} ${String(s.table).padStart(8)} ${String(s.total).padStart(8)} ${String(s.rows).padStart(7)}`);
  }
  console.log(`${'TOTAL'.padEnd(38)} ${String(Buffer.byteLength(doc, 'utf8')).padStart(7)} ${String(proseTotal).padStart(8)} ${String(tableTotal).padStart(8)} ${String(grand).padStart(8)} ${String(rows).padStart(7)}`);
  console.log('');
  console.log(`target total words      : ${TARGET_WORDS}`);
  console.log(`grand total words       : ${grand}   (${(((grand - TARGET_WORDS) / TARGET_WORDS * 100).toFixed(1))}% against target)`);
  console.log(`prose / table split     : ${proseTotal} prose  +  ${tableTotal} in ${rows} table rows`);
  console.log(`[TO CONFIRM] markers    : ${toConfirm}`);
  console.log(`H1 ${h1.length}   H2 ${h2.length}   [TOC] ${toc.length}   lines ${docLines.length}`);

  if (originalIds) {
    const origTotal = Object.values(originalIds).reduce((a, s) => a + s.size, 0);
    console.log(`identifiers in original : ${origTotal}`);
    console.log(`identifiers in draft    : ${Object.values(draftIds).reduce((a, s) => a + s.size, 0)}`);
    if (lost.length) {
      console.log(`\nIDENTIFIERS LOST (${lost.length}) — each one is substance the compression dropped:`);
      for (const l of lost) console.log('  x ' + l);
    } else {
      console.log('\nIDENTIFIERS LOST: none — every identifier class present in the original survives');
    }
  }

  if (issues.length) {
    console.log(`\nISSUES (${issues.length}) — must be fixed before publishing:`);
    for (const i of issues) console.log('  ! ' + i);
  } else {
    console.log('\nISSUES: none');
  }
  if (warns.length) {
    console.log(`\nWARNINGS (${warns.length}):`);
    for (const w of warns) console.log('  ? ' + w);
  }

  if (!write) { console.log('\n--check: nothing written'); process.exit(issues.length ? 1 : 0); }
  if (issues.length) { console.log('\nNot writing while ISSUES remain.'); process.exit(1); }

  fs.writeFileSync(STAGED, doc, 'utf8');
  console.log(`\nWROTE STAGED ${STAGED} (${Buffer.byteLength(doc, 'utf8')} bytes)`);

  if (publish) {
    if (lost.length) {
      console.log('\nREFUSING TO PUBLISH: identifiers are missing from the draft. Fix them, or state in the change record why each is intentionally gone.');
      process.exit(1);
    }
    fs.copyFileSync(STAGED, DELIVERABLE);
    console.log(`PUBLISHED over ${DELIVERABLE}`);
    console.log('The deliverable now differs from its pinned hash. Re-render and re-run every gate, and record pre/post SHA-256.');
  } else {
    console.log('Staged only. Read it, then re-run with --publish to replace the deliverable.');
  }
}

main();
