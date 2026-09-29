// Measure, segment, and chunk a Markdown source for i18n. Non-destructive.
// Usage: node split.js <src.md> <outDir> [maxChunkChars]
const fs = require('fs');
const path = require('path');

const src = process.argv[2];
const outDir = process.argv[3];
const MAX = parseInt(process.argv[4] || '9500', 10);

const text = fs.readFileSync(src, 'utf8');
const hasBOM = text.charCodeAt(0) === 0xFEFF;
const body = hasBOM ? text.slice(1) : text;
const lines = body.split('\n');

// ---- code fence mask ----
const isCode = new Array(lines.length).fill(false);
const fences = [];
{
  let i = 0;
  while (i < lines.length) {
    const m = /^(\s*)(`{3,}|~{3,})(.*)$/.exec(lines[i]);
    if (m) {
      const f = m[2];
      const close = new RegExp('^\\s*' + f[0] + '{' + f.length + ',}\\s*$');
      const open = i;
      isCode[i] = true; i++;
      let closed = false;
      while (i < lines.length) {
        isCode[i] = true;
        const ic = close.test(lines[i]);
        i++;
        if (ic) { closed = true; break; }
      }
      fences.push({ open, close: i - 1, tag: (m[3] || '').trim(), closed, len: f.length });
      continue;
    }
    i++;
  }
}
const unclosed = fences.filter(f => !f.closed);

// ---- headings outside code ----
const headings = [];
lines.forEach((l, idx) => {
  if (isCode[idx]) return;
  const m = /^(#{1,6})\s+(.*)$/.exec(l);
  if (m) headings.push({ line: idx + 1, level: m[1].length, text: m[2].trim() });
});

// ---- tables outside code ----
function cells(line) {
  const s = line.trim();
  const out = [];
  let cur = '';
  for (let k = 0; k < s.length; k++) {
    const c = s[k];
    if (c === '\\' && s[k + 1] === '|') { cur += '\\|'; k++; continue; }
    if (c === '|') { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  if (out.length && out[0].trim() === '') out.shift();
  if (out.length && out[out.length - 1].trim() === '') out.pop();
  return out.map(x => x.trim());
}
const tables = [];
{
  let i = 0;
  while (i < lines.length) {
    if (isCode[i]) { i++; continue; }
    const isSep = /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/.test(lines[i]) && lines[i].includes('|') && lines[i].includes('-');
    if (isSep && i > 0 && !isCode[i - 1] && lines[i - 1].includes('|')) {
      const start = i - 1;
      let end = i + 1;
      while (end < lines.length && !isCode[end] && lines[end].includes('|') && lines[end].trim() !== '') end++;
      tables.push({ header: start + 1, sep: i + 1, lines: lines.slice(start, end) });
      i = end;
      continue;
    }
    i++;
  }
}
const tableReport = tables.map((t, ti) => {
  const hdr = cells(t.lines[0]);
  const rows = [];
  for (let k = 2; k < t.lines.length; k++) {
    const c = cells(t.lines[k]);
    rows.push({ line: t.header + k, n: c.length, expect: hdr.length, ok: c.length === hdr.length });
  }
  return { idx: ti + 1, headerLine: t.header, cols: hdr.length, dataRows: rows.length, bad: rows.filter(r => !r.ok) };
});

// ---- inline code spans outside fences ----
let inlineSpans = 0;
{
  const re = /(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g;
  lines.forEach((l, idx) => {
    if (isCode[idx]) return;
    re.lastIndex = 0;
    while (re.exec(l) !== null) inlineSpans++;
  });
}

const codeText = fences.map(f => lines.slice(f.open, f.close + 1).join('\n') + '\n').join('');
const proseText = lines.filter((_, i) => !isCode[i]).join('\n');

const summary = {
  src,
  bytes: fs.statSync(src).size,
  bom: hasBOM,
  chars: body.length,
  crlf: (body.match(/\r\n/g) || []).length,
  lines: lines.length,
  headings: {
    h1: headings.filter(h => h.level === 1).length,
    h2: headings.filter(h => h.level === 2).length,
    h3: headings.filter(h => h.level === 3).length,
    h4: headings.filter(h => h.level === 4).length,
    h5: headings.filter(h => h.level === 5).length,
    total: headings.length,
    list: headings.map(h => '#'.repeat(h.level) + ' ' + h.text),
  },
  fences: {
    count: fences.length,
    unclosed: unclosed.length,
    tags: fences.map(f => f.tag),
    chars: codeText.length,
  },
  tables: { count: tables.length, dataRows: tableReport.reduce((a, b) => a + b.dataRows, 0), report: tableReport },
  inlineSpans,
  proseChars: proseText.length,
};

fs.mkdirSync(outDir, { recursive: true });

// ---- segmentation ----
const units = [];
{
  let i = 0;
  while (i < lines.length) {
    if (isCode[i]) { const s = i; while (i < lines.length && isCode[i]) i++; units.push({ t: 'C', lines: lines.slice(s, i) }); continue; }
    if (lines[i] === '') { const s = i; while (i < lines.length && lines[i] === '' && !isCode[i]) i++; units.push({ t: 'B', lines: lines.slice(s, i) }); continue; }
    const s = i; while (i < lines.length && lines[i] !== '' && !isCode[i]) i++; units.push({ t: 'P', lines: lines.slice(s, i) });
  }
}
units.forEach((u, n) => u.id = n);

const srcDir = path.join(outDir, 'src');
fs.mkdirSync(srcDir, { recursive: true });
units.forEach(u => {
  fs.writeFileSync(path.join(srcDir, 'U' + String(u.id).padStart(4, '0') + '.txt'), u.lines.join('\n'), 'utf8');
});
fs.writeFileSync(path.join(outDir, 'units.json'),
  JSON.stringify({ counts: { total: units.length, prose: units.filter(u => u.t === 'P').length, code: units.filter(u => u.t === 'C').length, blank: units.filter(u => u.t === 'B').length } }, null, 1), 'utf8');

// ---- chunks of consecutive prose units ----
const chunks = [];
let cur = null;
units.forEach(u => {
  if (u.t !== 'P') return;
  const size = u.lines.join('\n').length + 16;
  if (!cur) cur = { ids: [], lines: [], size: 0 };
  cur.ids.push(u.id);
  cur.lines.push('%%U' + String(u.id).padStart(4, '0') + '%%');
  for (const l of u.lines) cur.lines.push(l);
  cur.size += size;
  if (cur.size >= MAX) { chunks.push(cur); cur = null; }
});
if (cur) chunks.push(cur);

const workDir = path.join(outDir, 'work');
fs.mkdirSync(workDir, { recursive: true });
const manifest = chunks.map((c, n) => {
  const name = 'w' + String(n).padStart(2, '0') + '.txt';
  fs.writeFileSync(path.join(workDir, name), c.lines.join('\n') + '\n', 'utf8');
  return { file: name, ids: c.ids, chars: c.lines.join('\n').length };
});

fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(summary, null, 1), 'utf8');
fs.writeFileSync(path.join(outDir, 'chunks.json'), JSON.stringify(manifest, null, 1), 'utf8');

console.log(JSON.stringify({
  bytes: summary.bytes, bom: summary.bom, chars: summary.chars, lines: summary.lines,
  headings: { h2: summary.headings.h2, h3: summary.headings.h3, h4: summary.headings.h4, h5: summary.headings.h5, total: summary.headings.total },
  fences: summary.fences, tables: { count: summary.tables.count, dataRows: summary.tables.dataRows, bad: tableReport.flatMap(t => t.bad) },
  inlineSpans, proseChars: summary.proseChars,
  unitCounts: { total: units.length, prose: units.filter(u => u.t === 'P').length, code: units.filter(u => u.t === 'C').length },
  chunks: chunks.length,
}, null, 1));
