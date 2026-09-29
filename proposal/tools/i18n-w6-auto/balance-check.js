// Check emphasis-marker balance and bracket balance per line (outside code fences).
const fs = require('fs');
const p = process.argv[2];
const text = fs.readFileSync(p, 'utf8');
const lines = text.split('\n');
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
const bad = { bold: [], italic: [], backtick: [], bracket: [] };
lines.forEach((l, k) => {
  if (isCode[k]) return;
  const stripped = l.replace(/(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g, '');
  const bold = (stripped.match(/\*\*/g) || []).length;
  if (bold % 2 !== 0) bad.bold.push((k + 1) + ': ' + l.slice(0, 120));
  const ticks = (l.match(/`/g) || []).length;
  if (ticks % 2 !== 0) bad.backtick.push((k + 1) + ': ' + l.slice(0, 120));
  const ob = (l.match(/\[/g) || []).length, cb = (l.match(/\]/g) || []).length;
  if (ob !== cb) bad.bracket.push((k + 1) + ': ' + l.slice(0, 120));
});
for (const key of Object.keys(bad)) {
  console.log(key + ' unbalanced: ' + bad[key].length);
  bad[key].slice(0, 8).forEach(x => console.log('   ' + x));
}
// tables: header/separator alignment for every table
const tableRows = [];
lines.forEach((l, k) => { if (!isCode[k] && /^\s*\|.*\|\s*$/.test(l)) tableRows.push(k); });
console.log('pipe-wrapped lines: ' + tableRows.length);
