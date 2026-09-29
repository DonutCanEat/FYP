// Independent side-by-side comparison of the source and the translated file.
// Usage: node compare.js <src.md> <out.md>
const fs = require('fs');

const A = process.argv[2], B = process.argv[3];
const out = {};

function analyse(p) {
  const raw = fs.readFileSync(p);
  const bom = raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF;
  const text = raw.toString('utf8');
  const body = bom ? text.slice(1) : text;
  const lines = body.split('\n');
  const isCode = new Array(lines.length).fill(false);
  const fences = [];
  let i = 0;
  while (i < lines.length) {
    const m = /^(\s*)(`{3,}|~{3,})(.*)$/.exec(lines[i]);
    if (m) {
      const f = m[2];
      const close = new RegExp('^\\s*' + f[0] + '{' + f.length + ',}\\s*$');
      const o = i; isCode[i] = true; i++;
      while (i < lines.length) { isCode[i] = true; const ic = close.test(lines[i]); i++; if (ic) break; }
      fences.push({ tag: (m[3] || '').trim(), text: lines.slice(o, i).join('\n') + '\n' });
      continue;
    }
    i++;
  }
  const headings = [];
  lines.forEach((l, k) => {
    if (isCode[k]) return;
    const m = /^(#{1,6})\s+(.*)$/.exec(l);
    if (m) headings.push({ level: m[1].length, text: m[2].trim(), line: k + 1 });
  });
  function cells(line) {
    const s = line.trim(); const o = []; let cur = '';
    for (let k = 0; k < s.length; k++) {
      const c = s[k];
      if (c === '\\' && s[k + 1] === '|') { cur += '\\|'; k++; continue; }
      if (c === '|') { o.push(cur); cur = ''; continue; }
      cur += c;
    }
    o.push(cur);
    if (o.length && o[0].trim() === '') o.shift();
    if (o.length && o[o.length - 1].trim() === '') o.pop();
    return o;
  }
  const tables = [];
  {
    let k = 0;
    while (k < lines.length) {
      if (isCode[k]) { k++; continue; }
      const isSep = /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/.test(lines[k]) && lines[k].includes('|') && lines[k].includes('-');
      if (isSep && k > 0 && !isCode[k - 1] && lines[k - 1].includes('|')) {
        const start = k - 1; let end = k + 1;
        while (end < lines.length && !isCode[end] && lines[end].includes('|') && lines[end].trim() !== '') end++;
        const hdr = cells(lines[start]);
        const rows = [];
        for (let r = k + 1; r < end; r++) rows.push({ line: r + 1, n: cells(lines[r]).length });
        tables.push({ headerLine: start + 1, cols: hdr.length, rows });
        k = end; continue;
      }
      k++;
    }
  }
  let spans = 0;
  const spanRe = /(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g;
  lines.forEach((l, k) => { if (isCode[k]) return; spanRe.lastIndex = 0; while (spanRe.exec(l) !== null) spans++; });
  // escaped pipes outside code
  let escPipes = 0;
  lines.forEach((l, k) => { if (isCode[k]) return; escPipes += (l.match(/\\\|/g) || []).length; });
  const codeText = fences.map(f => f.text).join('');
  return {
    bytes: raw.length, bom, chars: body.length, lines: lines.length,
    headings, tableCount: tables.length,
    tableRows: tables.reduce((a, t) => a + t.rows.length, 0),
    badRows: tables.flatMap((t, ti) => t.rows.filter(r => r.n !== t.cols).map(r => ({ table: ti + 1, line: r.line, cells: r.n, expect: t.cols }))),
    rowCellCounts: tables.map(t => t.rows.map(r => r.n).join(',')),
    fences: fences.length, fenceTags: fences.map(f => f.tag), codeChars: codeText.length, codeText,
    spans, escPipes,
  };
}

const a = analyse(A), b = analyse(B);
const report = [];
const push = (name, va, vb) => report.push({ check: name, source: va, translation: vb, equal: JSON.stringify(va) === JSON.stringify(vb) });

push('h2 count', a.headings.filter(h => h.level === 2).length, b.headings.filter(h => h.level === 2).length);
push('h3 count', a.headings.filter(h => h.level === 3).length, b.headings.filter(h => h.level === 3).length);
push('h4 count', a.headings.filter(h => h.level === 4).length, b.headings.filter(h => h.level === 4).length);
push('h5 count', a.headings.filter(h => h.level === 5).length, b.headings.filter(h => h.level === 5).length);
push('heading total', a.headings.length, b.headings.length);
// numbering sequence preserved (leading numeric token of each heading)
const num = hs => hs.map(h => (h.text.match(/^[\d.]+/) || [''])[0]).join(' ');
push('heading numbering sequence', num(a.headings), num(b.headings));
push('heading level sequence', a.headings.map(h => h.level).join(','), b.headings.map(h => h.level).join(','));
push('table count', a.tableCount, b.tableCount);
push('table data rows', a.tableRows, b.tableRows);
push('rows with differing cell count', a.badRows, b.badRows);
push('per-table row cell counts', a.rowCellCounts, b.rowCellCounts);
push('fenced code blocks', a.fences, b.fences);
push('code fence language tags', a.fenceTags, b.fenceTags);
push('concatenated code block chars', a.codeChars, b.codeChars);
push('concatenated code blocks byte-identical', a.codeText, b.codeText);
push('inline code spans', a.spans, b.spans);
push('escaped pipes \\| outside code', a.escPipes, b.escPipes);
push('line count', a.lines, b.lines);
push('BOM', a.bom, b.bom);

// identifier spot-check
const ids = ['vpnz-mon01', 'vpnz-jump01', 'vpnz-nft01', 'vpnz-dmzrev01', 'vpnz-dc01', 'vpnz-fs01', 'vpnz-dmzjump01', 'vpnz-wcwg01',
  '10.10.30.31', '10.10.50.11', '10.90.90.10', '10.10.90.10', 'vertexpeak.fyp.lab', '5986', '5985', '9100', '9182',
  'ansible-core', 'pywinrm', '2.18.x', '0.5.0', 'win_shell', 'win_ping', 'ansible.builtin.template', 'ansible.windows.win_ping',
  'Invoke-NewStarterOnboarding.ps1', 'Get-ServiceAndFirewallAudit.ps1', 'Invoke-ScheduledBackupVerify.ps1',
  '06-server-health-report.sh', '07-nftables-log-summary.sh', '08-cert-expiry-check.sh',
  '/opt/ansible-venv/venv/bin/ansible-playbook', 'inventory/group_vars/all/vault.yml', 'C:\\FYP\\04-automation\\',
  'ansible-vault', 'ShellCheck', 'PSScriptAnalyzer', 'GG-WINRM-Admins', 'svc_aiagent', 'changed=0', 'nft list ruleset', '--check --diff'];
const count = (s, needle) => s.split(needle).length - 1;
const srcText = fs.readFileSync(A, 'utf8'), outText = fs.readFileSync(B, 'utf8');
const spot = ids.map(k => ({ id: k, source: count(srcText, k), translation: count(outText, k) }));
const spotBad = spot.filter(s => s.source !== s.translation);

report.push({ check: 'identifier spot-check mismatches', source: 'n/a', translation: 'n/a', equal: spotBad.length === 0, detail: spotBad });

console.log('=== SOURCE vs TRANSLATION ===');
for (const r of report) {
  const s = typeof r.source === 'string' && r.source.length > 90 ? '(see detail)' : JSON.stringify(r.source);
  const t = typeof r.translation === 'string' && r.translation.length > 90 ? '(see detail)' : JSON.stringify(r.translation);
  console.log((r.equal ? 'OK   ' : 'FAIL ') + r.check + '  src=' + s + '  zh=' + t);
}
console.log('\n=== identifier spot-check (' + spot.length + ' identifiers) ===');
spot.forEach(s => console.log((s.source === s.translation ? 'OK   ' : 'FAIL ') + s.id + ' src=' + s.source + ' zh=' + s.translation));
fs.writeFileSync('D:/File/School/FYP/proposal/tools/i18n-w6-auto/compare.json', JSON.stringify({ report: report.map(r => ({ check: r.check, equal: r.equal })), spot }, null, 1), 'utf8');
