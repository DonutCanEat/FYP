// Assemble the zh-HK output from verbatim source code segments + translated prose batches.
// Usage: node assemble.js
const fs = require('fs');
const path = require('path');

const src = 'D:/File/School/FYP/proposal/sections/08-project-management.md';
const zhDir = 'D:/File/School/FYP/proposal/tools/i18n-p08/zh';
const outFile = 'D:/File/School/FYP/proposal/i18n/zh-HK/08-project-management.md';
const EXPECTED_BATCHES = 10;

function segment(lines) {
  const isCode = new Array(lines.length).fill(false);
  let i = 0;
  while (i < lines.length) {
    const m = /^(\s*)(`{3,}|~{3,})(.*)$/.exec(lines[i]);
    if (m) {
      const f = m[2];
      const close = new RegExp('^\\s*' + f[0] + '{' + f.length + ',}\\s*$');
      isCode[i] = true; i++;
      while (i < lines.length) { isCode[i] = true; const ic = close.test(lines[i]); i++; if (ic) break; }
      continue;
    }
    i++;
  }
  const segs = [];
  let cur = null;
  for (let n = 0; n < lines.length; n++) {
    const ty = isCode[n] ? 'code' : 'prose';
    if (!cur || cur.type !== ty) { cur = { type: ty, lines: [], s: n + 1 }; segs.push(cur); }
    cur.lines.push(lines[n]); cur.e = n + 1;
  }
  return segs;
}

const srcText = fs.readFileSync(src, 'utf8').replace(/\r\n/g, '\n');
const lines = srcText.split('\n');
const segs = segment(lines);
const problems = [];

const batchFiles = fs.readdirSync(zhDir).filter(f => /^batch-\d+\.md$/.test(f)).sort();
if (batchFiles.length !== EXPECTED_BATCHES) problems.push('expected ' + EXPECTED_BATCHES + ' batch files, found ' + batchFiles.length);

// prose segment index -> parts
const parts = new Map(); // segIndex -> [ {ls, le, lines} ]
for (const f of batchFiles) {
  const raw = fs.readFileSync(path.join(zhDir, f), 'utf8').replace(/\r\n/g, '\n');
  if (raw.charCodeAt(0) === 0xFEFF) problems.push('BOM in ' + f);
  const re = /@@@SEG (\d+) SRC (\d+)-(\d+) LINES (\d+)@@@\n([\s\S]*?)\n@@@ENDSEG \1@@@/g;
  let m, pairs = 0, endPos = 0;
  while ((m = re.exec(raw)) !== null) {
    pairs++; endPos = re.lastIndex;
    const seg = parseInt(m[1], 10), ls = parseInt(m[2], 10), le = parseInt(m[3], 10), ln = parseInt(m[4], 10);
    const body = m[5].split('\n');
    if (segs[seg] === undefined || segs[seg].type !== 'prose') { problems.push(f + ': segment ' + seg + ' is not a prose segment'); continue; }
    if (body.length !== ln) problems.push(f + ' seg' + seg + ': declared ' + ln + ' lines, body has ' + body.length);
    const slice = segs[seg].lines.slice(ls - segs[seg].s, le - segs[seg].s + 1);
    if (slice.length !== ln) problems.push(f + ' seg' + seg + ': source slice mismatch (' + slice.length + ' vs ' + ln + ')');
    const unitOk = slice.every(x => x.length >= 0);
    if (!unitOk) problems.push(f + ' seg' + seg + ': bad slice');
    if (!parts.has(seg)) parts.set(seg, []);
    parts.get(seg).push({ ls, le, lines: body });
  }
  const opens = (raw.match(/@@@SEG \d+ SRC/g) || []).length;
  if (opens !== pairs) problems.push(f + ': marker pair mismatch pairs=' + pairs + ' opens=' + opens);
  const tail = raw.slice(endPos).replace(/@@@ENDBATCH@@@\s*$/, '').replace(/\s+$/, '');
  if (tail !== '') problems.push(f + ': stray text after last segment: ' + JSON.stringify(tail.slice(0, 120)));
  if (!/^@@@BATCH \d+ PARTS \d+ SRC_LINES \d+@@@$/m.test(raw)) problems.push(f + ': missing batch header');
}

// assemble
const outLines = [];
let proseParts = 0, codeSegs = 0;
for (let n = 0; n < segs.length; n++) {
  const s = segs[n];
  if (s.type === 'code') { codeSegs++; for (const l of s.lines) outLines.push(l); continue; }
  const list = (parts.get(n) || []).slice().sort((a, b) => a.ls - b.ls);
  let off = 0;
  for (const p of list) {
    if (p.ls !== s.s + off) problems.push('seg' + n + ': gap or overlap at translated part starting ' + p.ls + ' (expected ' + (s.s + off) + ')');
    for (const l of p.lines) outLines.push(l);
    off += p.lines.length;
    proseParts++;
  }
  if (off !== s.lines.length) problems.push('seg' + n + ': translated ' + off + ' lines, source has ' + s.lines.length);
}

let result = outLines.join('\n');
if (result.charCodeAt(0) === 0xFEFF) result = result.slice(1);
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, result, { encoding: 'utf8' });

const report = {
  out: outFile,
  bytes: Buffer.byteLength(result, 'utf8'),
  chars: result.length,
  outLines: outLines.length,
  srcLines: lines.length,
  lineCountMatch: outLines.length === lines.length,
  proseSegments: segs.filter(s => s.type === 'prose').length,
  codeSegments: codeSegs,
  prosePartsAssembled: proseParts,
  problemCount: problems.length,
  problems: problems.slice(0, 60)
};
console.log(JSON.stringify(report, null, 1));
if (problems.length) process.exit(1);
