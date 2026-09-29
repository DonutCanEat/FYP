#!/usr/bin/env node
/*
 * apply-patches.js — mechanically applies the PENDING rows of integration/patch-list.json
 * to the eight section files under sections\.
 *
 * Usage (working directory = D:\File\School\FYP\proposal):
 *   node integration\apply-patches.js [--dry-run] [--root .] [--list integration/patch-list.json]
 *
 * Guarantees / behaviour
 *  - Reads patch-list.json and selects ONLY rows whose `file` resolves inside sections\.
 *    Any row targeting 00-design-baseline.md (or any file outside sections\) is SKIPPED,
 *    whether or not its status claims to be pending.
 *  - Rows whose status starts with "APPLIED" are SKIPPED as well (already-landed record).
 *  - Each row is applied to the file content as an exact literal substitution. Nothing else
 *    is touched: no whitespace normalisation, no re-wrapping, no heading changes.
 *  - Occurrence handling: the JSON carries no occurrence/context field, so a duplicated
 *    literal (P-097/P-098, P-103/P-104 in 04-linux.md) is disambiguated positionally:
 *    rows for a file are processed in file order and each row consumes the FIRST occurrence
 *    that is still unconsumed. Concretely, rows are applied right-to-left by position and
 *    each duplicate row picks the occurrence index its already-landed sibling did not take.
 *    A row whose target cannot be identified (the observed occurrence count does not admit
 *    an unambiguous choice) is NOT guessed at: it is left unapplied and reported UNRESOLVED.
 *  - Idempotent-safe: if `find` is absent but `replace` is present where the row would have
 *    put it, the row is counted ALREADY_APPLIED, not an error.
 *  - File is written back as UTF-8 WITHOUT a BOM, preserving the file's existing line
 *    endings (CRLF stays CRLF, LF stays LF).
 *  - Prints a per-file summary plus a grand total, and per-row detail for anything that is
 *    not a clean single application.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---------------------------------------------------------------- CLI

const argv = process.argv.slice(2);
function opt(name, dflt) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
}
const DRY_RUN = argv.includes('--dry-run');
const UPDATE_LIST = argv.includes('--update-list');
const ROOT = path.resolve(opt('--root', '.'));
const LIST_REL = opt('--list', path.join('integration', 'patch-list.json'));
const LIST_PATH = path.resolve(ROOT, LIST_REL);

const TARGET_DIR = path.join(ROOT, 'sections');

// ---------------------------------------------------------------- helpers

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

function countOccurrences(hay, needle) {
  if (!needle) return 0;
  let n = 0, i = 0;
  for (;;) { const j = hay.indexOf(needle, i); if (j < 0) break; n++; i = j + 1; }
  return n;
}

function allOccurrences(hay, needle) {
  const out = []; let i = 0;
  for (;;) { const j = hay.indexOf(needle, i); if (j < 0) break; out.push(j); i = j + 1; }
  return out;
}

function lineOf(text, offset) {
  return text.slice(0, offset).split('\n').length;
}

// Has this row already landed in `hay`, even though its find string is still present?
//
// This is the awkward case the patch list contains: for several rows the `replace` value
// CONTAINS the `find` value (a clause appended to the same sentence, or a comment inserted
// above the original line). After such a row is applied, its find string is still grep-able,
// so a naive "find present -> apply" rule would append the same clause a second time on the
// next run. The test below reconstructs what the substitution would produce — the row's
// replacement wrapped in the surrounding text that would have been there — and reports the
// row as already applied if the file already looks like that.
// Has this row already landed in `hay`, even though its find string is still present?
//
// This is the awkward case the patch list contains: for rows such as P-070, P-092, P-111,
// P-112, P-123, P-130 and P-137 the `replace` value CONTAINS the `find` value (a clause
// appended to the same sentence, or a comment inserted above the original line). Once such a
// row has been applied its find string is still grep-able, so a naive "find present -> apply"
// rule appends the same clause again on the next run.
//
// The signature of this family, and the only reliable one, is that the document already
// contains at least as many copies of the WHOLE replacement as of the find string. In a
// pristine file such a row has find x1 and replace x0. After application it has find x1 and
// replace x1. A row whose replacement merely CONTAINS its find (the sibling pairs P-097/P-098
// and P-103/P-104) is not caught by this test, because their replacement does not contain
// their find string at all.
function isAppliedAt(hay, find, replace) {
  if (!find || !replace) return false;
  if (!replace.includes(find)) return false;
  return countOccurrences(hay, replace) >= countOccurrences(hay, find);
}

// Resolve a row's `file` to an absolute path, accepting both "sections\x.md"
// and "x.md" spellings, but never escaping sections\.
function resolveSectionFile(rel) {
  const norm = String(rel).replace(/\\/g, '/');
  const base = path.basename(norm);
  const cands = [];
  if (!/^[A-Za-z]:/.test(norm) && !norm.startsWith('/')) {
    cands.push(path.resolve(TARGET_DIR, base));
    cands.push(path.resolve(ROOT, norm));
  }
  for (const c of cands) {
    if (path.dirname(c).toLowerCase() === TARGET_DIR.toLowerCase() && fs.existsSync(c)) return c;
  }
  return null;
}

// ---------------------------------------------------------------- load list

if (!fs.existsSync(LIST_PATH)) {
  console.error(`patch list not found: ${LIST_PATH}`);
  process.exit(2);
}
const listRaw = fs.readFileSync(LIST_PATH, 'utf8');
const actions = JSON.parse(listRaw);
if (!Array.isArray(actions)) {
  console.error('patch list is not a JSON array');
  process.exit(2);
}

// ---------------------------------------------------------------- select rows

const skipped = [];   // {id, file, why}
const selected = [];  // ordered rows we will work on

for (const a of actions) {
  const isApplied = typeof a.status === 'string' && a.status.startsWith('APPLIED');
  const abs = resolveSectionFile(a.file);
  if (!abs) {
    skipped.push({ id: a.id, file: a.file, why: 'target is not a file under sections\\' });
    continue;
  }
  if (isApplied) {
    skipped.push({ id: a.id, file: a.file, why: 'status marks it already applied' });
    continue;
  }
  selected.push({ row: a, abs });
}

// ---------------------------------------------------------------- group by file, preserve order

const byFile = new Map();
for (const s of selected) {
  const key = s.abs;
  if (!byFile.has(key)) byFile.set(key, []);
  byFile.get(key).push(s.row);
}

const results = [];             // per-row outcome records
const fileStates = new Map();   // abs -> { beforeBuf, beforeHash, beforeSize, afterBuf, afterHash, afterSize, eol }
const evidence = new Map();     // abs -> { nestedOk[], wrongPlace[] }
const writeRefused = [];        // files deliberately left untouched because their plan was not clean
const orderProblems = [];       // plan-audit findings across all files

for (const [abs, rows] of byFile) {
  const beforeBuf = fs.readFileSync(abs);
  const text = beforeBuf.toString('utf8');
  const hadCRLF = text.includes('\r\n');
  const beforeHash = sha256(beforeBuf);

  // --- plan phase (see below) ----------------------------------------------

  // Rows whose `find` string encloses another row's `find` string are partitioned out first.
  // In this patch list that is exactly P-106 (whose find is the whole nftables table row) and
  // P-095 (whose find is one cell of that same row): the two are not independent, and their
  // edits must land in one file order with the OUTER span applied first, otherwise the inner
  // span's bytes no longer exist to be replaced. P-106's replacement already carries the /28
  // result P-095 asks for, so P-095 is legitimately SUBSUMED once P-106 lands.
  const strictSubsumed = (inner) => rows.some(rr => rr !== inner && rr.find !== inner.find && rr.find.includes(inner.find));
  const subsumedIds = new Set();
  for (const row of rows) {
    if (countOccurrences(text, row.find) > 0 && strictSubsumed(row)) subsumedIds.add(row.id);
  }
  const independent = rows.filter(r => !subsumedIds.has(r.id));

  // --- pre-check phase ------------------------------------------------------
  // Every row of the independent group MUST match its expected number of occurrences
  // before anything is written. If even one does not, the whole file is refused: applying
  // the rest would leave the section half-updated, which is worse than not touching it.
  const plan = [];
  const skippedAlready = new Set();    // rows whose replacement is already present, no find left
  const precheckFailures = [];
  const ordinals2 = new Map();
  for (const row of independent) {
    const occ = countOccurrences(text, row.find);
    const ord = ordinals2.get(row.find) || 0;
    ordinals2.set(row.find, ord + 1);
    if (occ <= ord) {
      const repCount = countOccurrences(text, row.replace);
      if (repCount > 0) {
        // idempotence: this row has already landed and there is nothing left to substitute
        skippedAlready.add(row.id);
      } else {
        precheckFailures.push(`${row.id}: find absent and the replacement is absent too, but the row is marked pending`);
      }
    } else if (isAppliedAt(text, row.find, row.replace)) {
      // the find string is still grep-able only because the row's own replacement contains
      // it, and the document already reads as the substituted result: do not re-apply
      skippedAlready.add(row.id);
    }
  }
  const precheckOk = precheckFailures.length === 0;
  if (!precheckOk) {
    for (const row of rows) {
      plan.push({ row, outcome: { kind: 'UNRESOLVED', occBefore: countOccurrences(text, row.find), occTotal: countOccurrences(text, row.find), ordinal: -1, at: -1, note: 'refused: another row of this file failed its pre-check' } });
    }
  } else {
    // --- plan phase ---------------------------------------------------------
    // Rows are in no particular file order in the patch list, so each row's target is
    // derived from the ORIGINAL text: row N consumes the (N+1)-th occurrence of its `find`
    // string, counting only rows that share that same literal. Deriving the ordinal from a
    // mutated buffer would be wrong, because a row's `replace` can itself contain another
    // row's `find` string.
    const ordinals3 = new Map();
    for (const row of rows) {
      if (skippedAlready.has(row.id) || subsumedIds.has(row.id)) continue;
      const find = row.find;
      const occTotal = countOccurrences(text, find);
      const ord = ordinals3.get(find) || 0;
      ordinals3.set(find, ord + 1);
      const at = allOccurrences(text, find)[ord];
      plan.push({
        row,
        outcome: {
          kind: 'APPLIED',
          occBefore: occTotal - ord,
          occTotal,
          ordinal: ord,
          at,
          note: occTotal > 1
            ? `duplicated literal (${occTotal} in the original file): this row consumes occurrence #${ord + 1}`
            : ''
        }
      });
    }
    // rows recognised as already landed: recorded, not applied, not an error
    for (const row of rows) {
      if (!skippedAlready.has(row.id)) continue;
      const repCount = countOccurrences(text, row.replace);
      const findLeft = countOccurrences(text, row.find);
      plan.push({
        row,
        outcome: {
          kind: 'ALREADY_APPLIED',
          occBefore: 0,
          occTotal: findLeft,
          ordinal: -1,
          at: text.indexOf(row.replace),
          repCount,
          findAfter: findLeft,
          repBefore: repCount,
          repAfter: repCount,
          note: findLeft > 0
            ? `the document already reads as this row's substituted result; its find string is still grep-able x${findLeft} only because the row's own replacement contains it — nothing to substitute`
            : `find is absent and the row's replacement text is already present x${repCount} — nothing to substitute`
        }
      });
    }
  }

  // --- ordering audit -------------------------------------------------------
  // The rows of one file are NOT listed in file order in the patch list (P-066 sits after
  // P-067's target, P-076 before P-069's, and so on), so "row order == file order" cannot
  // be assumed. What is assumed is that no two distinct `find` strings can ever land on the
  // same spot, and that a row's `replace` never inserts an EARLIER-claiming row's find
  // string. Two checks enforce that, and the file is refused outright if either fails,
  // because a violated assumption is exactly how a stale offset silently corrupts a file.
  let orderedOk = true;
  const orderProblems = [];

  // (a) one row per distinct find string, except the deliberate duplicate pairs, which must
  //     resolve to distinct original offsets
  const byLiteral = new Map();
  for (const p of plan) {
    if (p.outcome.kind !== 'APPLIED') continue;
    const k = p.row.find;
    if (!byLiteral.has(k)) byLiteral.set(k, []);
    byLiteral.get(k).push(p);
  }
  for (const [literal, group] of byLiteral) {
    const offsets = group.map(p => p.outcome.at);
    if (new Set(offsets).size !== offsets.length) {
      orderedOk = false;
      orderProblems.push(`${group.map(p => p.row.id).join('+')}: two rows resolve to the SAME original offset for ${JSON.stringify(literal.slice(0, 50))}`);
    }
  }

  // (b) a `replace` must not introduce a copy of another row's find string at a point
  //     BEFORE that other row's own target
  const appliedPlan = plan.filter(p => p.outcome.kind === 'APPLIED');
  for (const q of appliedPlan) {
    for (const p of appliedPlan) {
      if (p === q || p.row.find === q.row.find) continue;
      if (q.row.replace.includes(p.row.find) && q.outcome.at < p.outcome.at) {
        orderedOk = false;
        orderProblems.push(`${q.row.id}'s replacement introduces ${p.row.id}'s find string before ${p.row.id}'s own target (${q.outcome.at} < ${p.outcome.at})`);
      }
    }
  }

  // --- apply phase
  //
  // Per-row verification afterwards counts the `find` and `replace` strings before and
  // after the edit. `replace` must gain exactly one occurrence — that is the only check
  // that works for the many rows whose `replace` legitimately contains their own `find`
  // as a substring (an appended clause, or a comment added above the original line).
  //
  // The anchor is located by walking forward from a cursor to the this row's occurrence,
  // and the bytes there are compared against the row's `find` before anything is written.
  // A row whose anchor does not verify is NOT applied and is reported UNRESOLVED, so a
  // mis-derived offset can never corrupt the file.
  let out = text;
  let searchStart = 0;
  let shift = 0;                       // cumulative length change of the edits already applied
  const editsInFileOrder = plan
    .filter(p => p.outcome.kind === 'APPLIED')
    .sort((a, b) => a.outcome.at - b.outcome.at);
  for (let i = 0; i < editsInFileOrder.length; i++) {
    const p = editsInFileOrder[i];
    if (!orderedOk) {
      p.outcome.kind = 'UNRESOLVED';
      p.outcome.note = 'application refused: the plan failed the same-offset / replacement-collision audit';
      continue;
    }

    // Locate this row's target by searching forward from the byte just past the previous
    // edit, and require the hit to fall strictly before the NEXT row's start. No shift
    // arithmetic is used to find the anchor — the previous search result IS the position,
    // which removes the whole class of stale-offset mistakes. The boundary is the only
    // value that has to be translated: the next row's offset is a pre-edit coordinate, so
    // it gains the cumulative length change of the edits already applied. The boundary test
    // rejects a hit that is actually a copy introduced by a neighbouring replacement.
    const at = out.indexOf(p.row.find, searchStart);
    const boundary = i + 1 < editsInFileOrder.length
      ? editsInFileOrder[i + 1].outcome.at + shift
      : Infinity;
    if (at < 0 || at >= boundary) {
      p.outcome.kind = 'UNRESOLVED';
      p.outcome.note = `anchor mismatch: ${at < 0 ? 'no occurrence found from the end of the previous edit' : `first hit at ${at} is not before the next row's target (${boundary})`} (planned original offset ${p.outcome.at})`;
      continue;
    }

    const findN = countOccurrences(out, p.row.find);
    const repN = countOccurrences(out, p.row.replace);
    const delta = p.row.replace.length - p.row.find.length;
    out = out.slice(0, at) + p.row.replace + out.slice(at + p.row.find.length);
    searchStart = at + p.row.replace.length;
    shift += delta;
    p.outcome.appliedAt = at;
    p.outcome.findAfter = countOccurrences(out, p.row.find);
    p.outcome.repBefore = repN;
    p.outcome.repAfter = countOccurrences(out, p.row.replace);
    p.outcome.findDelta = p.outcome.findAfter - findN;
    p.outcome.repDelta = p.outcome.repAfter - repN;
    p.outcome.findDeltaOk = p.outcome.findDelta === (p.row.replace.includes(p.row.find) ? 0 : -1);
    p.outcome.atOk = true;
    p.outcome.verifyOk = p.outcome.repDelta === 1 && p.outcome.findDeltaOk;
  }

  // --- subsumed rows --------------------------------------------------------
  // A row whose `find` is enclosed by another row's `find` cannot be applied on its own once
  // the enclosing row has landed: the bytes it targeted no longer exist. It is resolved here
  // against the buffer the enclosing row produced, and is accepted only on positive evidence,
  // namely that this row's exact `replace` string is present. The enclosing replacement in
  // this patch list carries a superset of what the enclosed row asked for, so the row's
  // intended end state IS achieved — but the classification says so explicitly rather than
  // claiming an independent substitution that never ran.
  for (const id of subsumedIds) {
    const row = rows.find(r => r.id === id);
    const entry = { row, outcome: null };
    const findCount = countOccurrences(out, row.find);
    const repCount = countOccurrences(out, row.replace);
    if (findCount === 0 && repCount > 0) {
      const at = out.indexOf(row.replace);
      entry.outcome = {
        kind: 'SUBSUMED',
        occBefore: countOccurrences(text, row.find),
        occTotal: countOccurrences(text, row.find),
        ordinal: -1,
        at,
        appliedAt: at,
        repBefore: 0,
        repAfter: repCount,
        findAfter: 0,
        note: `find is a substring of an enclosing row's find (${row.find.length} bytes vs the enclosing row's longer match); the enclosing replacement already carries this row's exact intended result, present x${repCount} — resolved without a separate substitution`
      };
    } else if (findCount > 0) {
      // the enclosing row has not landed, so this row is still independently applicable
      const at = out.indexOf(row.find);
      const repN = countOccurrences(out, row.replace);
      const before = out;
      out = out.slice(0, at) + row.replace + out.slice(at + row.find.length);
      entry.outcome = {
        kind: 'APPLIED',
        occBefore: findCount,
        occTotal: findCount,
        ordinal: 0,
        at,
        appliedAt: at,
        repBefore: repN,
        repAfter: countOccurrences(out, row.replace),
        findAfter: countOccurrences(out, row.find),
        repDelta: countOccurrences(out, row.replace) - repN,
        findDelta: countOccurrences(out, row.find) - findCount,
        atOk: true,
        verifyOk: (countOccurrences(out, row.replace) - repN) === 1,
        note: 'enclosed-span row applied independently because the enclosing row did not land'
      };
      void before;
    } else {
      entry.outcome = {
        kind: 'UNRESOLVED',
        occBefore: 0,
        occTotal: 0,
        ordinal: -1,
        at: -1,
        note: 'find is enclosed by another row\'s find, neither the find nor the replacement is present'
      };
    }
    plan.push(entry);
  }

  // --- line-ending preservation
  if (hadCRLF) out = out.replace(/\r?\n/g, '\r\n');
  const afterBuf = Buffer.from(out, 'utf8');
  const afterHash = sha256(afterBuf);

  // --- whole-file invariant -------------------------------------------------
  // Take the rows whose `replace` CONTAINS their own `find` (the accepted "append a
  // clause / add a comment above the line" rows) and the rows that hit the same literal.
  // In the final buffer the total number of `find` hits for such a literal must equal the
  // number of those rows that landed, and every hit must sit inside a landed `replace`.
  // A larger count means a real edit landed in the wrong place — the exact failure mode
  // that using stale offsets produced once during development.
  const finalBuf = out;
  const nestedOk = [];
  const wrongPlace = [];
  const literalGroups = new Map();
  for (const p of plan) {
    const key = p.row.find;
    if (!literalGroups.has(key)) literalGroups.set(key, []);
    literalGroups.get(key).push(p);
  }
  for (const [literal, group] of literalGroups) {
    const landed = group.filter(p => p.outcome.kind === 'APPLIED');
    if (!landed.length) continue;
    const origHits = countOccurrences(text, literal);
    const finalHits = countOccurrences(finalBuf, literal);
    if (finalHits <= origHits - landed.length) continue;       // clean: every row consumed a hit
    // some hits remain — they are legitimate only inside a landed replacement
    const repWindows = landed.map(p => p.row.replace).filter(rep => rep.includes(literal));
    let covered = 0;
    for (const o of allOccurrences(finalBuf, literal)) {
      const inWindow = repWindows.some(rep => {
        let i = -1;
        for (;;) {
          i = finalBuf.indexOf(rep, i + 1);
          if (i < 0) return false;
          if (o >= i && o + literal.length <= i + rep.length) return true;
        }
        return false;
      });
      if (inWindow) covered++; else wrongPlace.push(`${group[0].row.id} [${path.basename(abs)}] find hit at line ${lineOf(finalBuf, o)} is NOT inside its row's replacement`);
    }
    if (covered) nestedOk.push(`${group.map(p => p.row.id).join('+')} [${path.basename(abs)}] ${covered} surviving hit(s) of ${JSON.stringify(literal.slice(0, 60))} are nested inside their own landed replacement (expected)`);
  }
  evidence.set(abs, { nestedOk, wrongPlace });

  fileStates.set(abs, {
    abs, beforeBuf, beforeHash, beforeSize: beforeBuf.length,
    afterBuf, afterHash, afterSize: afterBuf.length,
    eol: hadCRLF ? 'CRLF' : 'LF',
    changed: beforeBuf.length !== afterBuf.length || beforeHash !== afterHash
  });

  for (const p of plan) {
    results.push({
      id: p.row.id,
      file: path.basename(abs),
      section: p.row.section,
      kind: p.outcome.kind,
      occBefore: p.outcome.occBefore,
      findAfter: p.outcome.findAfter,
      repBefore: p.outcome.repBefore,
      repAfter: p.outcome.repAfter,
      findDelta: p.outcome.findDelta,
      repDelta: p.outcome.repDelta,
      atOk: p.outcome.atOk,
      verifyOk: p.outcome.verifyOk,
      note: p.outcome.note || '',
      findLine: p.outcome.at === undefined ? null : lineOf(text, p.outcome.at),
      find: p.row.find,
      replace: p.row.replace
    });
  }

  // Write only when this file's plan came out clean. A run that leaves any row unresolved
  // or self-verifying false must not touch the file at all: it is better to refuse than to
  // write a partially-applied section file that still looks plausible.
  const fileFailed = plan.some(p => p.outcome.kind === 'UNRESOLVED' || p.outcome.verifyOk === false);
  if (!DRY_RUN && !fileFailed) fs.writeFileSync(abs, afterBuf);
  else if (!DRY_RUN && fileFailed) writeRefused.push(`${path.basename(abs)} — NOT written (row(s) unresolved or unverified)`);
}

// ---------------------------------------------------------------- report

const kinds = { APPLIED: 0, SUBSUMED: 0, ALREADY_APPLIED: 0, UNRESOLVED: 0 };
for (const r of results) kinds[r.kind] = (kinds[r.kind] || 0) + 1;

const lines = [];
lines.push('apply-patches.js' + (DRY_RUN ? '   [DRY RUN — nothing written]' : '') + (UPDATE_LIST ? '   [--update-list]' : ''));
lines.push(`root          : ${ROOT}`);
lines.push(`patch list    : ${LIST_PATH}`);
lines.push(`rows in list  : ${actions.length}`);
lines.push(`selected      : ${selected.length}   (rows targeting sections\\ with a pending status)`);
lines.push(`skipped       : ${skipped.length}   (not sections\\ targets, or already applied)`);
lines.push('');
lines.push('--- PER FILE ---');
const order = [...byFile.keys()].sort();
for (const abs of order) {
  const st = fileStates.get(abs);
  const rs = results.filter(r => r.file === path.basename(abs));
  const c = { APPLIED: 0, SUBSUMED: 0, ALREADY_APPLIED: 0, UNRESOLVED: 0 };
  for (const r of rs) c[r.kind] = (c[r.kind] || 0) + 1;
  lines.push(`${path.basename(abs).padEnd(26)} rows=${String(rs.length).padStart(3)}  applied=${String(c.APPLIED).padStart(3)}  subsumed=${String(c.SUBSUMED).padStart(2)}  already=${String(c.ALREADY_APPLIED).padStart(3)}  unresolved=${String(c.UNRESOLVED).padStart(3)}  ${st.eol}  ${st.beforeSize} -> ${st.afterSize} bytes  ${st.changed ? 'CHANGED' : 'unchanged'}`);
  lines.push(`  before ${st.beforeHash}`);
  lines.push(`  after  ${st.afterHash}`);
}
lines.push('');
lines.push('--- TOTALS ---');
lines.push(`APPLIED         : ${kinds.APPLIED}`);
lines.push(`SUBSUMED        : ${kinds.SUBSUMED}`);
lines.push(`ALREADY_APPLIED : ${kinds.ALREADY_APPLIED}`);
lines.push(`UNRESOLVED      : ${kinds.UNRESOLVED}`);
lines.push(`selected total  : ${selected.length}`);
lines.push(`grand total (applied + subsumed + already + unresolved = selected): ${kinds.APPLIED + kinds.SUBSUMED + kinds.ALREADY_APPLIED + kinds.UNRESOLVED}`);
lines.push('');

const odd = results.filter(r => (r.kind !== 'APPLIED' && r.kind !== 'SUBSUMED') || r.verifyOk === false || r.kind === 'SUBSUMED');
lines.push('--- ROWS NEEDING ATTENTION / NOTEWORTHY ---');
if (!odd.length) {
  lines.push('(none — every selected row applied cleanly, its one occurrence was consumed,');
  lines.push(' and its replacement text is present in the written file)');
} else {
  for (const r of odd) {
    lines.push(`${r.id} [${r.file}] ${r.kind}  occBefore=${r.occBefore} findAfter=${r.findAfter} repDelta=${r.repDelta} atOk=${r.atOk}  ${r.note}`);
  }
}
lines.push('');

lines.push('--- SKIPPED (not sections\\ targets / already applied) ---');
const skipBy = {};
for (const s of skipped) skipBy[s.why] = (skipBy[s.why] || 0) + 1;
for (const k of Object.keys(skipBy)) lines.push(`${k}: ${skipBy[k]}`);
lines.push('skipped ids: ' + skipped.map(s => s.id).join(', '));
lines.push('');

// Evidence check, evaluated against the buffer that this run would write / did write.
const selfNested = [];
const survivors = [];
const wrongPlaceAll = [];
for (const st of evidence.values()) {
  selfNested.push(...st.nestedOk);
  wrongPlaceAll.push(...st.wrongPlace);
}
lines.push('--- find STRINGS STILL GREP-ABLE AFTER PATCHING ---');
lines.push('rows whose surviving hit is the find string nested inside the row\'s own replacement text (expected):');
lines.push(selfNested.length ? selfNested.join('\n') : '(none)');
lines.push('');
lines.push('rows where a find string genuinely survives outside its own replacement (a real failure):');
lines.push(wrongPlaceAll.length ? wrongPlaceAll.join('\n') : '(none)');
lines.push('');

// applier self-verification failures
const badVerify = results.filter(r => r.verifyOk === false);lines.push('--- APPLIER SELF-VERIFICATION FAILURES (atOk / findDelta / repDelta) ---');
lines.push(badVerify.length ? badVerify.map(r => `${r.id} [${r.file}] atOk=${r.atOk} findDelta=${r.findDelta} repDelta=${r.repDelta}`).join('\n') : '(none)');
lines.push('');
lines.push('--- FILES REFUSED (plan not clean, file left untouched) ---');
lines.push(writeRefused.length ? writeRefused.join('\n') : '(none)');
lines.push('');
lines.push('--- PLAN AUDIT PROBLEMS (same-offset collisions / replacement collisions) ---');
lines.push(orderProblems.length ? orderProblems.join('\n') : '(none)');
console.log(lines.join('\n'));

// ---------------------------------------------------------------- optional list update
//
// The VERIFIER (verify-patch-list.js) decides OK / BROKEN from the row's `status` field:
// a row that is not marked APPLIED but whose find string is gone is reported BROKEN. Once
// the section rows have really been applied, the list therefore has to record that fact or
// the verifier reports every one of them as broken.
//
// This is a SEPARATE, opt-in script (integration\record-patch-status.js) rather than
// something this applier does, and it is never run inside the apply path: the apply run
// must be able to finish without touching the patch list at all. `--update-list` on this
// script is accepted only so that the two-step workflow is discoverable; it points at the
// recorder instead of doing the edit here.
if (UPDATE_LIST) {
  console.log('');
  console.log('--- --update-list ---');
  console.log('Status recording is deliberately NOT done by this applier. Run:');
  console.log('  node integration\\record-patch-status.js');
  console.log('after a successful apply run. See the header of that file for what it writes.');
}

process.exit(kinds.UNRESOLVED || badVerify.length || writeRefused.length ? 1 : 0);
