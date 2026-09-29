#!/usr/bin/env node
/*
 * verify-sections.js — independent residual scan + structural re-verification of the eight
 * section files, run AFTER apply-patches.js. It deliberately does not use patch-list.json:
 * it greps for the superseded values the consistency report names, and it re-checks the
 * document structure so a substitution that broke a table or a code fence cannot hide.
 *
 * Usage (working directory = D:\File\School\FYP\proposal):
 *   node integration\verify-sections.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve('.');
const DIR = path.join(ROOT, 'sections');
const FILES = [
  '01-introduction.md', '02-architecture.md', '03-microsoft.md', '04-linux.md',
  '05-cisco.md', '06-automation.md', '07-ai.md', '08-project-management.md'
];

const out = [];
const say = (s) => { out.push(s); };

// ------------------------------------------------------------------ residual scan
// Each entry: { label, regex, note } — `note` says how to judge a hit.
const CHECKS = [
  { label: '10.10.90.10 as a HOST address of vpnz-dmzrev01', re: /10\.10\.90\.10\s*\(VIP|vpnz-dmzrev01\s*=\s*10\.10\.90\.10|10\.10\.90\.10\s+vpnz-dmzrev01/, note: 'must be gone as a host address; a VIP-only mention is legitimate' },
  { label: '10.10.90.11 (old vpnz-dmzrev02 node address)', re: /10\.10\.90\.11/, note: 'must be gone entirely' },
  { label: 'old iSCSI TARGET IQN iqn.2026-01.lab.fyp.vertexpeak:storage-lun0N', re: /iqn\.2026-01\.lab\.fyp\.vertexpeak:storage-lun0[0-9]/, note: 'must be gone as a target IQN; the dmzweba01 INITIATOR IQN is a different value' },
  { label: 'old iSCSI target IQN used as a target (same string)', re: /iqn\.2026-01\.lab\.fyp\.vertexpeak:storage-lun/, note: 'must be gone' },
  { label: 'objective keys O1..O11', re: /\bO(1|2|3|4|5|6|7|8|9|10|11)\b/, note: 'must be gone; the O-13/O-14 keys are the new form' },
  { label: 'evidence ID EV-0214', re: /EV-0214/, note: 'must be gone' },
  { label: 'evidence ID EV-0215', re: /EV-0215/, note: 'must be gone' },
  { label: '10.10.100.4/30 described as "not addressed"', re: /10\.10\.100\.4\/30[^\n]*not addressed|not addressed[^\n]*10\.10\.100\.4\/30/, note: 'must be gone' },
  { label: '10.10.10.60 (old LAN-HQ-CORE assumption address)', re: /10\.10\.10\.60/, note: 'must be gone' },
  { label: '172.16.0.0/24 (old IKEv2 pool row)', re: /172\.16\.0\.0\/24/, note: 'must be gone' },
  { label: '10.10.100.0/29 (old LAN-ISP block)', re: /10\.10\.100\.0\/29/, note: 'must be gone' },
  { label: '[ASSUMPTION] on port 9113', re: /9113\/tcp[^\n]*\[ASSUMPTION\]|\[ASSUMPTION\][^\n]*9113/, note: 'must be gone' },
  { label: 'standing [ASSUMPTION] label (any)', re: /\[ASSUMPTION\]/, note: 'inspect each: a withdrawn label inside a correction note is legitimate' },
  { label: 'VLAN 50 mask 10.10.50.0/29', re: /10\.10\.50\.0\/29/, note: 'must be gone' },
  { label: 'VNET-EGRESS 10.10.50.0/24', re: /10\.10\.50\.0\/24/, note: 'must be gone' },
  { label: '10.10.50.11/29 / 10.10.50.10/29 / 10.10.50.2/29', re: /10\.10\.50\.(2|10|11|12)\/29/, note: 'must be gone' },
  { label: 'host address 10.10.50.11/10.10.50.12 used as an HSRP/VRRP VIP pair', re: /VIP[^\n]*10\.10\.50\.1[12]|10\.10\.50\.1[12][^\n]*VIP/, note: 'must be gone' },
  { label: 'VLAN 60 SERVER / VLAN 10 HQ-CORE / VLAN 20 MGMT / VLAN 70 STUDENT old names', re: /VLAN 60 SERVER|VLAN 10 HQ-CORE|VLAN 20\s+MGMT|VLAN 70\s+STUDENT/, note: 'must be gone' },
  { label: 'group 1 virtual MAC owner-address HSRP map (old)', re: /group 1, virtual MAC/, note: 'must be gone' },
  { label: 'OSPF "area range"', re: /area range/, note: 'may legitimately survive inside a prohibition clause or a struck annotation' },
  { label: 'AS 65011', re: /AS 65011/, note: 'must be gone' },
  { label: '"not addressed in this build"', re: /not addressed in this build/, note: 'must be gone' },
  { label: 'VP-HQ-WEB-01 / VP-HQ-DC-01 (old VM names)', re: /VP-HQ-WEB-01|VP-HQ-DC-01/, note: 'must be gone' },
  { label: '"RRAS IKEv2 pool uses its own range"', re: /RRAS IKEv2 pool uses its own range/, note: 'must be gone' },
  { label: 'Nginx 9113 [ASSUMPTION] label remainder', re: /9113/, note: 'the port itself is a required new value; only a surviving [ASSUMPTION] would be a miss' }
];

say('=== 1. RESIDUAL SCAN FOR SUPERSEDED VALUES ===');
say('');
let genuineMisses = 0;
for (const c of CHECKS) {
  const hits = [];
  for (const f of FILES) {
    const text = fs.readFileSync(path.join(DIR, f), 'utf8');
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (c.re.test(lines[i])) hits.push({ f, line: i + 1, text: lines[i].trim() });
    }
  }
  say(`-- ${c.label}`);
  say(`   query: ${c.re}`);
  say(`   guidance: ${c.note}`);
  if (!hits.length) {
    say('   hits: 0');
  } else {
    say(`   hits: ${hits.length}`);
    for (const h of hits) say(`     ${h.f}:${h.line}  ${h.text.slice(0, 200)}`);
  }
  say('');
}

// Values that MUST still be present after patching.
say('=== 2. VALUES THAT MUST STILL BE PRESENT (new Rev 1.1 values) ===');
say('');
const REQUIRED = ['10.10.90.28', '10.10.90.29', '10.10.50.0/28', '10.10.200.2', '10.10.200.3',
  '10.10.10.28', '0000.0c07.ac02', '9113/tcp', '1991-05.com.microsoft:vpnz-san01-storage-lun01.target',
  'O-14', 'O-13', 'EV-0042'];
const allText = FILES.map(f => ({ f, text: fs.readFileSync(path.join(DIR, f), 'utf8') }));
for (const v of REQUIRED) {
  const where = allText.filter(x => x.text.includes(v)).map(x => x.f);
  say(`${v.padEnd(64)} ${where.length ? 'present in ' + where.join(', ') : '*** ABSENT FROM ALL EIGHT FILES ***'}`);
}
say('');

// ------------------------------------------------------------------ structure
say('=== 3. STRUCTURAL RE-VERIFICATION ===');
say('');
const EXPECTED_H2 = {
  '01-introduction.md': 10,
  '02-architecture.md': 1,
  '03-microsoft.md': 1,
  '04-linux.md': 1,
  '05-cisco.md': 1,
  '06-automation.md': 1,
  '07-ai.md': 1,
  '08-project-management.md': 9
};
say('H1 headings (must be 0 real ATX H1s):');
for (const f of FILES) {
  const lines = fs.readFileSync(path.join(DIR, f), 'utf8').split('\n');
  let inFence = false, h1 = 0;
  const h1lines = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s*(```|~~~)/.test(l)) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (/^#\s+\S/.test(l)) { h1++; h1lines.push(`${i + 1}: ${l.slice(0, 80)}`); }
  }
  say(`  ${f.padEnd(26)} H1 = ${h1}${h1 ? '  <-- ' + h1lines.join(' | ') : ''}`);
}
say('');
say('H2 headings (per-file expected count):');
let hStruct = 0;
for (const f of FILES) {
  const lines = fs.readFileSync(path.join(DIR, f), 'utf8').split('\n');
  let inFence = false, h2 = 0;
  for (const l of lines) {
    if (/^\s*(```|~~~)/.test(l)) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (/^##\s+\S/.test(l)) h2++;
  }
  const exp = EXPECTED_H2[f];
  const ok = h2 === exp;
  if (!ok) hStruct++;
  say(`  ${f.padEnd(26)} H2 = ${String(h2).padStart(3)}   expected ${String(exp).padStart(3)}   ${ok ? 'OK' : '<-- MISMATCH'}`);
}
say('');
say('Fenced code blocks (must be balanced, even count of fence lines per file):');
let fenceBad = 0;
for (const f of FILES) {
  const text = fs.readFileSync(path.join(DIR, f), 'utf8');
  const fences = (text.match(/^\s*(```|~~~)/gm) || []).length;
  const even = fences % 2 === 0;
  if (!even) fenceBad++;
  say(`  ${f.padEnd(26)} fence lines = ${String(fences).padStart(4)}   ${even ? 'balanced' : '<-- UNBALANCED'}`);
}
say('');
say('Markdown tables (column count must be consistent within each table block):');
let tableBad = 0;
for (const f of FILES) {
  const lines = fs.readFileSync(path.join(DIR, f), 'utf8').split('\n');
  let inFence = false;
  const problems = [];
  let block = null;   // { start, headerCells, rows: [{n, line}] }
  const countCells = (l) => {
    let t = l.trim();
    if (t.startsWith('|')) t = t.slice(1);
    if (t.endsWith('|')) t = t.slice(0, -1);
    // count on unescaped pipes, outside inline code spans
    let cells = 1, inCode = false;
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (ch === '`') { inCode = !inCode; continue; }
      if (ch === '\\') { i++; continue; }
      if (ch === '|' && !inCode) cells++;
    }
    return cells;
  };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s*(```|~~~)/.test(l)) { inFence = !inFence; block = null; continue; }
    if (inFence) { continue; }
    const isRow = /^\s*\|/.test(l);
    if (!isRow) { block = null; continue; }
    const n = countCells(l);
    if (!block) { block = { start: i + 1, header: n, rows: [] }; continue; }
    block.rows.push({ n, line: i + 1 });
    if (n !== block.header) {
      problems.push(`table starting line ${block.start} (${block.header} cols): line ${i + 1} has ${n} cols :: ${l.trim().slice(0, 120)}`);
    }
  }
  if (problems.length) tableBad++;
  say(`  ${f.padEnd(26)} ${problems.length ? problems.length + ' mismatched row(s)' : 'all tables consistent'}`);
  for (const p of problems.slice(0, 12)) say(`      ${p}`);
}
say('');
say('=== 4. TOTALS ===');
say(`  residual genuine misses found by the named queries : (see §1; reported per query)`);
say(`  H2 structure mismatches                            : ${hStruct}`);
say(`  unbalanced fenced code blocks                      : ${fenceBad}`);
say(`  files with column-mismatched tables                : ${tableBad}`);

const report = out.join('\n');
console.log(report);
fs.writeFileSync(path.join(ROOT, 'integration', 'verify-sections-output.txt'), report + '\n', 'utf8');
