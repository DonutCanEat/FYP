// Repair missing %%U####%% marker lines in a translated chunk file by aligning its
// non-marker content against the source chunk's prose units.
// Usage: node repair.js <workDir> <zhDir> [chunkFile]
const fs = require('fs');
const path = require('path');

const workDir = process.argv[2];
const zhDir = process.argv[3];
const only = process.argv[4];

const MARK = /^(?:%%U(\d{4})%%|@@@U(\d{4})@@@)$/;
const markId = m => parseInt(m[1] || m[2], 10);

function parse(text) {
  // returns list of blocks: {id, body:[lines]} in file order; id null if no marker
  const blocks = [];
  let cur = null;
  for (const l of text.split('\n')) {
    const m = MARK.exec(l);
    if (m) { cur = { id: markId(m), body: [] }; blocks.push(cur); continue; }
    if (cur) cur.body.push(l);
    else blocks.push({ id: null, body: [l] });
  }
  return blocks;
}

const files = fs.readdirSync(workDir).filter(f => /^w\d+\.txt$/.test(f)).sort();
let anyFixed = false;
for (const f of files) {
  if (only && f !== only) continue;
  const zf = path.join(zhDir, f);
  if (!fs.existsSync(zf)) continue;
  const srcBlocks = parse(fs.readFileSync(path.join(workDir, f), 'utf8'));
  const srcIds = srcBlocks.filter(b => b.id !== null).map(b => b.id);
  const zhBlocks = parse(fs.readFileSync(zf, 'utf8'));
  const zhIds = zhBlocks.filter(b => b.id !== null).map(b => b.id);
  if (srcIds.join(',') === zhIds.join(',')) { console.log(f + ': markers OK (' + srcIds.length + ')'); continue; }
  anyFixed = true;
  // walk the translation bodies in order, consuming source ids in order
  const content = zhBlocks.filter(b => b.id !== null).flatMap(b => b.body);
  // drop leading blanks, keep interior content
  const out = [];
  let ptr = 0;
  for (const b of srcBlocks) {
    if (b.id === null) continue;
    out.push('%%U' + String(b.id).padStart(4, '0') + '%%');
    const n = b.body.length;
    for (let k = 0; k < n && ptr < content.length; k++) out.push(content[ptr++]);
    out.push('');
  }
  const leftover = content.slice(ptr).filter(l => l.trim() !== '');
  fs.writeFileSync(zf, out.join('\n') + '\n', 'utf8');
  console.log(f + ': repaired, srcIds=' + srcIds.length + ' zhIds=' + zhIds.length + ' leftoverContentLines=' + leftover.length +
    (leftover.length ? ' FIRST=' + JSON.stringify(leftover[0].slice(0, 60)) : ''));
}
if (!anyFixed) console.log('no repair needed');
