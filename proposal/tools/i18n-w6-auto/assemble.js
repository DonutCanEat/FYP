// Assemble the translated Markdown: code and blank units are copied byte-for-byte
// from the source; prose units come from the translated chunk files.
// Usage: node assemble.js <src.md> <workDir> <zhDir> <outFile>
const fs = require('fs');
const path = require('path');

const src = process.argv[2];
const workDir = process.argv[3];
const zhDir = process.argv[4];
const outFile = process.argv[5];

const text = fs.readFileSync(src, 'utf8');
const bom = text.charCodeAt(0) === 0xFEFF;
const body = bom ? text.slice(1) : text;
const lines = body.split('\n');
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
const units = [];
{
  let k = 0;
  while (k < lines.length) {
    if (isCode[k]) { const s = k; while (k < lines.length && isCode[k]) k++; units.push({ t: 'C', lines: lines.slice(s, k) }); continue; }
    if (lines[k] === '') { const s = k; while (k < lines.length && lines[k] === '' && !isCode[k]) k++; units.push({ t: 'B', lines: lines.slice(s, k) }); continue; }
    const s = k; while (k < lines.length && lines[k] !== '' && !isCode[k]) k++; units.push({ t: 'P', lines: lines.slice(s, k) });
  }
}
units.forEach((u, n) => u.id = n);

const MARK = /^(?:%%U(\d{4})%%|@@@U(\d{4})@@@)$/;
const zhMap = new Map();
const problems = [];
for (const f of fs.readdirSync(workDir).filter(x => /^w\d+\.txt$/.test(x)).sort()) {
  const zf = path.join(zhDir, f);
  if (!fs.existsSync(zf)) { problems.push('missing translation: ' + f); continue; }
  const zl = fs.readFileSync(zf, 'utf8').replace(/\r\n/g, '\n').split('\n');
  let cur = null;
  for (const l of zl) {
    const m = MARK.exec(l);
    if (m) { cur = { id: parseInt(m[1] || m[2], 10), lines: [] }; if (zhMap.has(cur.id)) problems.push('duplicate translation for U' + cur.id); zhMap.set(cur.id, cur); continue; }
    if (cur) cur.lines.push(l);
  }
}
for (const [id, u] of zhMap) {
  while (u.lines.length && u.lines[u.lines.length - 1] === '') u.lines.pop();
}

const out = [];
for (const u of units) {
  if (u.t === 'P') {
    const t = zhMap.get(u.id);
    if (!t) { problems.push('untranslated prose unit U' + u.id); out.push(...u.lines); }
    else out.push(...t.lines);
  } else {
    out.push(...u.lines); // code and blank units verbatim
  }
}
if (problems.length) {
  console.log('PROBLEMS: ' + problems.length);
  problems.slice(0, 10).forEach(p => console.log('  ' + p));
}
fs.writeFileSync(outFile, out.join('\n'), 'utf8');
console.log('written ' + outFile + ' bytes=' + fs.statSync(outFile).size + ' lines=' + out.length + ' units=' + units.length + ' proseTranslated=' + zhMap.size);
