// Content sanity checks on the translated file.
const fs = require('fs');
const p = process.argv[2];
const text = fs.readFileSync(p, 'utf8');
const lines = text.split('\n');

// 1. stray sentinel markers
const stray = lines.filter(l => /%%U\d{4}%%/.test(l));
console.log('stray markers: ' + stray.length);

// 2. ASCII-only prose lines (outside code fences) that are not tables/structural
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
const suspicious = [];
lines.forEach((l, k) => {
  if (isCode[k]) return;
  if (/[\u4e00-\u9fff]/.test(l)) return;
  if (l.trim() === '') return;
  if (/^\|?[\s:|-]*\|[\s:|-]*$/.test(l)) return;   // table separator
  if (/^#{1,6} /.test(l) === false && /^[|>\-*\d.\s`#\[\]()A-Za-z_/\\:.§,…–—-]*$/.test(l) && l.length > 40) suspicious.push((k + 1) + ': ' + l);
});
console.log('non-CJK non-structural prose lines >40 chars: ' + suspicious.length);
suspicious.slice(0, 25).forEach(s => console.log('  ' + s));

// 3. blank-line count and trailing newline
console.log('total lines: ' + lines.length + ' last line empty: ' + (lines[lines.length - 1] === ''));
console.log('blank lines: ' + lines.filter(l => l === '').length);

// 4. headings with the numbering retained
const heads = lines.map((l, k) => ({ l, k })).filter(x => !isCode[x.k] && /^#{1,6} /.test(x.l));
console.log('headings: ' + heads.length);
heads.slice(0, 6).forEach(h => console.log('  ' + h.l.slice(0, 100)));
heads.slice(-4).forEach(h => console.log('  ' + h.l.slice(0, 100)));

// 5. [ASSUMPTION] / [DECIDED] / [DECLARED] markers
for (const t of ['[ASSUMPTION]', '[假設]', '[DECIDED]', '[已決定]', '[DECLARED]', '[已聲明]', '[TOC]']) {
  const n = text.split(t).length - 1;
  if (n) console.log('marker ' + t + ': ' + n);
}
