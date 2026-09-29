#!/usr/bin/env node
/*
 * record-patch-status.js — records the outcome of the section-file patch application back
 * into integration\patch-list.json, so that the re-runnable check
 * (verify-patch-list.js) reports the truth about the list instead of the truth about an
 * obsolete snapshot of it.
 *
 * WHY THIS IS NEEDED. verify-patch-list.js classifies a row as BROKEN when the row is NOT
 * marked APPLIED but its find string can no longer be found. Once the 114 pending section
 * rows have really been applied, their find strings are gone, so the verifier reports all
 * of them as BROKEN — not because anything failed, but because the list still claims they
 * are pending. Recording the application is the only way that check can print BROKEN 0
 * after the work is done.
 *
 * WHAT IT WRITES. Only the `status` field of the 114 section rows is replaced, and only for
 * rows that are actually present in the section files. `id`, `file`, `section`, `find`,
 * `replace` and `reason` are never modified, no row is added or removed, the order is
 * unchanged, and the 52 `00-design-baseline.md` rows keep their exact existing status text.
 * Key order, 1-space JSON indentation and the trailing newline of the original file are all
 * preserved, so the diff is exactly 114 status values.
 *
 * Usage (working directory = D:\File\School\FYP\proposal):
 *   node integration\record-patch-status.js            # write the record
 *   node integration\record-patch-status.js --dry-run   # show what would change
 */

'use strict';

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const ROOT = path.resolve('.');
const LIST_PATH = path.join(ROOT, 'integration', 'patch-list.json');
const TARGET_DIR = path.join(ROOT, 'sections');
const STAMP = new Date().toISOString().slice(0, 10);

if (!fs.existsSync(LIST_PATH)) {
  console.error(`patch list not found: ${LIST_PATH}`);
  process.exit(2);
}
const original = fs.readFileSync(LIST_PATH, 'utf8');
const actions = JSON.parse(original);

function countOccurrences(hay, needle) {
  if (!needle) return 0;
  let n = 0, i = 0;
  for (;;) { const j = hay.indexOf(needle, i); if (j < 0) break; n++; i = j + 1; }
  return n;
}

const cache = new Map();
function sectionText(rel) {
  const base = path.basename(String(rel).replace(/\\/g, '/'));
  const abs = path.join(TARGET_DIR, base);
  if (!cache.has(abs)) cache.set(abs, fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null);
  return cache.get(abs);
}

const changes = [];
const skipped = [];

for (const a of actions) {
  const norm = String(a.file).replace(/\\/g, '/');
  if (!norm.startsWith('sections/')) { skipped.push(a.id); continue; }
  const text = sectionText(a.file);
  if (text === null) { skipped.push(a.id); continue; }

  const oldStatus = a.status;
  const findLeft = countOccurrences(text, a.find);
  const replacePresent = countOccurrences(text, a.replace);

  let newStatus;
  if (findLeft === 0 && replacePresent > 0) {
    newStatus = `APPLIED to ${a.file} on ${STAMP} by integration\\apply-patches.js. The find string is gone and the replacement text is present x${replacePresent}. RETAINED as the record of what changed; do NOT re-apply.`;
    if (a.id === 'P-095') {
      newStatus = `APPLIED to ${a.file} on ${STAMP} by integration\\apply-patches.js — as a SUBSUMED row. Its find string is a substring of P-106's longer find string (the whole nftables table row), and P-106's replacement already carries this row's exact intended result (/28 in that cell). Verified present x${replacePresent}. RETAINED as the record of what changed; do NOT re-apply.`;
    }
  } else if (findLeft > 0 && replacePresent > 0 && String(a.replace).includes(String(a.find))) {
    newStatus = `APPLIED to ${a.file} on ${STAMP} by integration\\apply-patches.js. Its find string is still grep-able x${findLeft} only because this row's own replacement contains it; the document already reads as the substituted result. RETAINED as the record of what changed; do NOT re-apply.`;
  } else {
    skipped.push(`${a.id} (find x${findLeft}, replace x${replacePresent} — not recorded)`);
    continue;
  }

  changes.push({ id: a.id, oldStatus, newStatus });
  a.status = newStatus;
}

// Rebuild with the original key order per row and the original 1-space indentation + newline.
const canonical = actions.map(a => {
  const o = {};
  for (const k of ['id', 'file', 'section', 'find', 'replace', 'reason', 'status']) {
    if (Object.prototype.hasOwnProperty.call(a, k)) o[k] = a[k];
  }
  return o;
});
const output = JSON.stringify(canonical, null, 1) + '\n';

const lines = [];
lines.push('record-patch-status.js' + (DRY_RUN ? '   [DRY RUN — nothing written]' : ''));
lines.push(`patch list : ${LIST_PATH}`);
lines.push(`rows       : ${actions.length}`);
lines.push(`status values rewritten : ${changes.length}`);
lines.push(`rows left as they were  : ${skipped.length}`);
if (skipped.length) lines.push(`  (${skipped.join(', ')})`);
lines.push('');
lines.push('--- CHANGED ROWS ---');
if (!changes.length) lines.push('(none)');
for (const c of changes) {
  lines.push(`${c.id}`);
  lines.push(`  was : ${String(c.oldStatus).slice(0, 100)}`);
  lines.push(`  now : ${String(c.newStatus).slice(0, 100)}`);
}
lines.push('');
const originalParsed = JSON.parse(original);
const fieldBug = canonical.some((r, i) =>
  r.id !== originalParsed[i].id || r.file !== originalParsed[i].file ||
  r.section !== originalParsed[i].section || r.find !== originalParsed[i].find ||
  r.replace !== originalParsed[i].replace || r.reason !== originalParsed[i].reason
);
lines.push('');
lines.push(`find/replace/reason/id/file/section fields changed: ${fieldBug ? 'YES (BUG — do not write)' : 'no'}`);
lines.push(`rows before -> after: ${originalParsed.length} -> ${canonical.length}`);
lines.push(`bytes: ${original.length} -> ${output.length}`);

console.log(lines.join('\n'));

if (fieldBug) {
  console.error('refusing to write: a non-status field would change');
  process.exit(1);
}
if (!DRY_RUN) {
  fs.writeFileSync(LIST_PATH, output, 'utf8');
  console.log('');
  console.log('written.');
}
