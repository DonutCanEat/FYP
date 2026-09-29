// verify-patch-list.js — verifies integration/patch-list.json against the real files.
// Usage: node integration/verify-patch-list.js . integration/patch-list.json
//
// Reports, per action:
//   OK        find string matches exactly once  -> safe to apply
//   DUP       find string matches more than once -> the row says so; apply to all occurrences
//   APPLIED   the row is marked APPLIED and its find string is (correctly) no longer present
//   BROKEN    the find string is absent but the row is still PENDING -> a silently failing patch row
const fs = require('fs');
const path = require('path');
const root = process.argv[2] || '.';
const listPath = process.argv[3] || 'integration/patch-list.json';
const actions = JSON.parse(fs.readFileSync(path.join(root, listPath), 'utf8'));

const cache = new Map();
function content(rel) {
  if (!cache.has(rel)) {
    const cands = [rel, path.join('sections', path.basename(rel))];
    let p = null;
    for (const c of cands) { const q = path.join(root, c); if (fs.existsSync(q)) { p = q; break; } }
    cache.set(rel, p ? fs.readFileSync(p, 'utf8') : null);
  }
  return cache.get(rel);
}
function countOcc(hay, needle) {
  if (hay === null || !needle) return -1;
  let n = 0, i = 0;
  for (;;) { const j = hay.indexOf(needle, i); if (j < 0) break; n++; i = j + 1; }
  return n;
}

const ok = [], dup = [], applied = [], broken = [], nofile = [];
for (const a of actions) {
  const hay = content(a.file);
  if (hay === null) { nofile.push(`${a.id}: ${a.file}`); continue; }
  const n = countOcc(hay, a.find);
  const isApplied = typeof a.status === 'string' && a.status.startsWith('APPLIED');
  if (n === 1) ok.push(a.id);
  else if (n > 1) dup.push(`${a.id} [${a.file}] x${n}`);
  else if (isApplied) applied.push(a.id);
  else broken.push(`${a.id} [${a.file}] :: ${JSON.stringify(a.find).slice(0, 140)}`);
}

const report = [
  `actions in list: ${actions.length}`,
  `OK  (unique match, still pending): ${ok.length}`,
  `DUP (multiple occurrences, apply to each): ${dup.length}`,
  `APPLIED (already landed, find string gone as expected): ${applied.length}`,
  `BROKEN (pending but find string absent): ${broken.length}`,
  `file not found: ${nofile.length}`,
  '',
  '--- DUP ---', dup.length ? dup.join('\n') : '(none)',
  '',
  '--- BROKEN ---', broken.length ? broken.join('\n') : '(none)',
  '',
  '--- FILE NOT FOUND ---', nofile.length ? nofile.join('\n') : '(none)'
];
console.log(report.join('\n'));
process.exit(broken.length ? 1 : 0);
