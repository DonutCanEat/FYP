// Verify translated chunk files against the source. Usage:
//   node verify.js <src.md> <workDir> <zhDir>
const fs = require('fs');
const path = require('path');

const src = process.argv[2];
const workDir = process.argv[3];
const zhDir = process.argv[4];

const text = fs.readFileSync(src, 'utf8');
const body = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
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
const markId = m => parseInt(m[1] || m[2], 10);
const spanRe = /(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g;
const spans = s => { const o = []; let m; spanRe.lastIndex = 0; while ((m = spanRe.exec(s)) !== null) o.push(m[0]); return o; };
const idents = s => {
  const o = [];
  const re = /(`[^`\n]+`)|(\bvpnz-[a-z0-9]+\b)|(\b(?:\d{1,3}\.){3}\d{1,3}\b)/g;
  let m;
  while ((m = re.exec(s)) !== null) o.push(m[0]);
  return o;
};
const multiset = a => { const m = new Map(); for (const x of a) m.set(x, (m.get(x) || 0) + 1); return m; };
const diffMs = (A, B) => {
  const missing = [], extra = [];
  for (const [k, v] of A) { const b = B.get(k) || 0; if (v > b) extra.push(k + ' x' + (v - b)); }
  for (const [k, v] of B) { const a = A.get(k) || 0; if (v > a) missing.push(k + ' x' + (v - a)); }
  return { missing, extra };
};

const problems = [];
const files = fs.readdirSync(workDir).filter(f => /^w\d+\.txt$/.test(f)).sort();
const seen = new Set();
let srcSpans = 0, zhSpans = 0, srcIds = 0, zhIds = 0;
const srcSpanAll = [], zhSpanAll = [], srcIdAll = [], zhIdAll = [];
const perChunk = [];
let translated = 0;

for (const f of files) {
  const zf = path.join(zhDir, f);
  if (!fs.existsSync(zf)) { problems.push('missing translation: ' + f); continue; }
  translated++;
  const wl = fs.readFileSync(path.join(workDir, f), 'utf8').replace(/\r\n/g, '\n').split('\n');
  const zl = fs.readFileSync(zf, 'utf8').replace(/\r\n/g, '\n').split('\n');
  const split = ls => {
    const res = []; let cur = null;
    for (const l of ls) {
      const m = MARK.exec(l);
      if (m) {
        cur = { id: markId(m), lines: [] };
        res.push(cur);
        continue;
      }
      if (cur) cur.lines.push(l); else if (l.trim() !== '') res.push({ id: null, lines: [l] });
    }
    for (const u of res) while (u.lines.length && u.lines[u.lines.length - 1] === '') u.lines.pop();
    return res;
  };
  const su = split(wl), zu = split(zl);
  if (su.map(u => u.id).join(',') !== zu.map(u => u.id).join(',')) {
    problems.push(f + ': marker sequence mismatch');
    problems.push('  src: ' + su.map(u => u.id).join(','));
    problems.push('  zh : ' + zu.map(u => u.id).join(','));
    continue;
  }
  let spansOk = true, identsOk = true, empty = 0;
  su.forEach((u, k) => {
    if (u.id === null) return;
    if (seen.has(u.id)) problems.push(f + ': duplicate unit U' + u.id);
    seen.add(u.id);
    if (units[u.id].t !== 'P') problems.push(f + ': unit U' + u.id + ' is not prose');
    const srcBody = units[u.id].lines.join('\n');
    let zhBody = zu[k].lines.join('\n');
    if (zhBody.endsWith('\n')) zhBody = zhBody.slice(0, -1);
    if (zhBody.trim() === '') { problems.push(f + ': empty translation for U' + u.id); empty++; }
    const ss = spans(srcBody), zs = spans(zhBody);
    srcSpans += ss.length; zhSpans += zs.length;
    srcSpanAll.push(...ss); zhSpanAll.push(...zs);
    const d1 = diffMs(multiset(ss), multiset(zs));
    if (d1.missing.length || d1.extra.length) {
      spansOk = false;
      problems.push(f + ' U' + u.id + ': code spans differ (src=' + ss.length + ' zh=' + zs.length +
        ') missing=' + JSON.stringify(d1.missing.slice(0, 6)) + ' extra=' + JSON.stringify(d1.extra.slice(0, 6)));
    }
    const si = idents(srcBody), zi = idents(zhBody);
    srcIds += si.length; zhIds += zi.length;
    srcIdAll.push(...si); zhIdAll.push(...zi);
    const d2 = diffMs(multiset(si), multiset(zi));
    if (d2.missing.length || d2.extra.length) {
      identsOk = false;
      problems.push(f + ' U' + u.id + ': identifiers differ missing=' + JSON.stringify(d2.missing.slice(0, 8)) +
        ' extra=' + JSON.stringify(d2.extra.slice(0, 8)));
    }
  });
  perChunk.push({ file: f, units: su.filter(u => u.id !== null).length, spansOk, identsOk });
}

const proseIds = units.filter(u => u.t === 'P').map(u => u.id);
const notDone = proseIds.filter(id => !seen.has(id));
const stray = [...seen].filter(id => units[id].t !== 'P');
const gSpan = diffMs(multiset(srcSpanAll), multiset(zhSpanAll));
const gId = diffMs(multiset(srcIdAll), multiset(zhIdAll));

const result = {
  chunks: files.length, chunksTranslated: translated,
  proseUnits: proseIds.length, unitsTranslated: seen.size,
  notTranslated: notDone.length,
  spans: { src: srcSpans, zh: zhSpans, globalMissing: gSpan.missing.length, globalExtra: gSpan.extra.length, badChunks: perChunk.filter(c => !c.spansOk).map(c => c.file) },
  identifiers: { src: srcIds, zh: zhIds, globalMissing: gId.missing.length, globalExtra: gId.extra.length, badChunks: perChunk.filter(c => !c.identsOk).map(c => c.file) },
  stray,
  problems,
};
fs.writeFileSync(path.join(zhDir, '_verify.json'), JSON.stringify(result, null, 1), 'utf8');
console.log('chunks=' + files.length + ' translated=' + translated + ' proseUnits=' + proseIds.length + ' translatedUnits=' + seen.size + ' remaining=' + notDone.length);
console.log('code spans: src=' + srcSpans + ' zh=' + zhSpans + ' | identifiers: src=' + srcIds + ' zh=' + zhIds);
console.log('global diffs: spans missing=' + gSpan.missing.length + ' extra=' + gSpan.extra.length + ' | idents missing=' + gId.missing.length + ' extra=' + gId.extra.length);
if (problems.length) { console.log('PROBLEMS (' + problems.length + '):'); problems.slice(0, 40).forEach(p => console.log('  ' + p)); }
else console.log('OK');
