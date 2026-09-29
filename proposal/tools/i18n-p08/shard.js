// P08 shard (isolated work dir, prefix p08b).
const fs = require('fs');
const path = require('path');
const src = 'D:/File/School/FYP/proposal/sections/08-project-management.md';
const outDir = 'D:/File/School/FYP/proposal/tools/i18n-p08/out';
const MAXLINES = 220;
const lines = fs.readFileSync(src, 'utf8').replace(/\r\n/g, '\n').split('\n');
const isCode = new Array(lines.length).fill(false);
{
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
}
const segs = [];
let cur = null;
for (let i = 0; i < lines.length; i++) {
  const ty = isCode[i] ? 'code' : 'prose';
  if (!cur || cur.type !== ty) { cur = { type: ty, lines: [], s: i + 1 }; segs.push(cur); }
  cur.lines.push(lines[i]); cur.e = i + 1;
}
const units = [];
let unit = { parts: [] };
const unitLen = u => u.parts.reduce((a, p) => a + p.lines.length, 0);
for (let n = 0; n < segs.length; n++) {
  const s = segs[n];
  if (s.type !== 'prose') continue;
  let off = 0;
  while (off < s.lines.length) {
    const room = MAXLINES - unitLen(unit);
    if (room <= 0) { units.push(unit); unit = { parts: [] }; continue; }
    const take = Math.min(room, s.lines.length - off);
    unit.parts.push({ seg: n, srcStart: s.s + off, lines: s.lines.slice(off, off + take) });
    off += take;
    if (unitLen(unit) >= MAXLINES) { units.push(unit); unit = { parts: [] }; }
  }
}
if (unit.parts.length) units.push(unit);
fs.mkdirSync(outDir, { recursive: true });
const index = [];
units.forEach((u, i) => {
  const total = unitLen(u);
  let out = '@@@BATCH ' + String(i).padStart(2, '0') + ' PARTS ' + u.parts.length + ' SRC_LINES ' + total + '@@@\n';
  for (const p of u.parts) {
    out += '@@@SEG ' + p.seg + ' SRC ' + p.srcStart + '-' + (p.srcStart + p.lines.length - 1) + ' LINES ' + p.lines.length + '@@@\n';
    out += p.lines.join('\n') + '\n';
    out += '@@@ENDSEG ' + p.seg + '@@@\n';
  }
  out += '@@@ENDBATCH@@@\n';
  fs.writeFileSync(path.join(outDir, 'batch-' + String(i).padStart(2, '0') + '.md'), out, 'utf8');
  index.push({ batch: i, parts: u.parts.map(p => ({ seg: p.seg, srcStart: p.srcStart, lines: p.lines.length })), srcLines: total });
});
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify({ maxLines: MAXLINES, batches: index.length, prevBatchesTranslated: [0, 1, 2], index }, null, 1), 'utf8');
console.log(JSON.stringify(index.map(x => ({ b: x.batch, parts: x.parts.length, srcLines: x.srcLines, firstSrc: x.parts[0].srcStart })), null, 0));
