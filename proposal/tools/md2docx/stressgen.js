/*
 * stressgen.js - generate a synthetic Markdown corpus for scale testing.
 *
 * Produces the SAME structure the real proposal will have (numbered H1 sections,
 * H2/H3 subsections, paragraphs, tables, fenced code blocks, lists, block quotes,
 * figure placeholders, a TOC placeholder, horizontal rules), at whatever size is
 * requested. Used to prove md2docx survives a 300,000-word / 2 MB input.
 *
 * Usage:
 *   node stressgen.js <outDir> [--words 300000] [--files 8] [--tables 2000] [--code 1600]
 */
'use strict';
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = { dir: null, words: 300000, files: 8, tables: 2000, code: 1600 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--words') out.words = parseInt(argv[++i], 10);
    else if (a === '--files') out.files = parseInt(argv[++i], 10);
    else if (a === '--tables') out.tables = parseInt(argv[++i], 10);
    else if (a === '--code') out.code = parseInt(argv[++i], 10);
    else if (!out.dir) out.dir = a;
  }
  return out;
}

const WORDS = (
  'distributed system architecture proposal implementation evaluation methodology prototype ' +
  'throughput latency replication consistency partitioning failover observability resilience ' +
  'authentication authorisation encryption telemetry orchestration container network storage ' +
  'framework interface dependency pipeline validation migration rollback dashboard metric alert ' +
  'protocol topology cluster scheduler buffer throughput convergence availability durability ' +
  'governance compliance baseline artefact deliverable milestone stakeholder requirement constraint ' +
  'Microsoft Windows Server Active Directory Group Policy Entra Intune Defender Hyper-V Linux ' +
  'Ubuntu Debian kernel systemd firewall nftables SELinux AppArmor Cisco IOS routing switching VLAN ' +
  'automation Ansible Terraform Python PowerShell Bash API REST GraphQL JSON YAML token endpoint'
).split(/\s+/);

const CODE_SAMPLES = [
  ['powershell', [
    'function Get-ServiceHealth {',
    '    [CmdletBinding()]',
    '    param([string]$ComputerName = $env:COMPUTERNAME)',
    '    try {',
    '        $svc = Get-Service -ComputerName $ComputerName -ErrorAction Stop',
    '        $svc | Where-Object { $_.Status -ne "Running" } | Select-Object Name, Status',
    '    } catch {',
    '        Write-Error "health probe failed for $ComputerName : $_"',
    '    }',
    '}',
  ]],
  ['bash', [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    'for host in $(cat hosts.txt); do',
    '  ssh -o BatchMode=yes "$host" "systemctl is-active nginx || true"',
    'done',
  ]],
  ['python', [
    'import json, statistics',
    'def summarise(samples):',
    '    return {"mean": statistics.mean(samples), "p95": sorted(samples)[int(len(samples) * 0.95)]}',
  ]],
  ['yaml', [
    'apiVersion: apps/v1',
    'kind: Deployment',
    'metadata:',
    '  name: proposal-api',
    'spec:',
    '  replicas: 3',
  ]],
  ['sql', [
    'SELECT section_id, COUNT(*) AS findings',
    'FROM review_items',
    'WHERE severity >= 3',
    'GROUP BY section_id',
    'ORDER BY findings DESC;',
  ]],
  ['json', [
    '{ "volume": 1, "sections": [1, 2, 3, 4, 5, 6], "strict": true }',
  ]],
];

function rnd(seed) {
  // deterministic xorshift so repeated runs are comparable
  let s = seed >>> 0;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 0xffffffff;
  };
}

function makeWords(r, n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(WORDS[Math.floor(r() * WORDS.length)]);
  return out.join(' ');
}

function sentence(r, words) {
  const t = makeWords(r, words);
  return t.charAt(0).toUpperCase() + t.slice(1) + '.';
}

function paragraph(r, targetWords) {
  const parts = [];
  let n = 0;
  while (n < targetWords) {
    const w = 12 + Math.floor(r() * 18);
    parts.push(sentence(r, w));
    n += w;
  }
  return parts.join(' ');
}

function table(r, idx, rows) {
  const lines = [];
  lines.push('| Component ' + idx + ' | Responsibility | Status | Owner |');
  lines.push('| --- | --- | :---: | ---: |');
  for (let i = 0; i < rows; i++) {
    lines.push(
      `| ${makeWords(r, 2)} ${idx}.${i + 1} | ${sentence(r, 9)} | ${r() > 0.5 ? 'Done' : 'Planned'} | ${makeWords(r, 1)} |`
    );
  }
  return lines;
}

function codeBlock(r, idx) {
  const [lang, body] = CODE_SAMPLES[Math.floor(r() * CODE_SAMPLES.length)];
  return ['```' + lang].concat(body.map((l) => l.replace(/idx/g, String(idx))), ['```']);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.dir) {
    console.error('usage: node stressgen.js <outDir> [--words N] [--files N] [--tables N] [--code N]');
    process.exit(2);
  }
  fs.mkdirSync(args.dir, { recursive: true });
  const r = rnd(20260101);

  // distribute the word budget over the files
  const wordsPerFile = Math.floor(args.words / args.files);
  const tablesPerFile = Math.ceil(args.tables / args.files);
  const codePerFile = Math.ceil(args.code / args.files);

  let totalWords = 0;
  let totalTables = 0;
  let totalCode = 0;
  const summary = [];

  for (let f = 1; f <= args.files; f++) {
    const out = [];
    totalWords += 0;
    // every file has its own front matter + TOC so each is standalone-ish
    out.push(`# Volume Section ${f}: ${makeWords(r, 4)} Technical Chapter`);
    out.push('');
    out.push('[TOC]');
    out.push('');
    out.push('---');
    out.push('');

    let words = 0;
    let sec = 1;
    let tables = 0;
    let code = 0;
    while (words < wordsPerFile) {
      out.push(`## ${f}.${sec} ${makeWords(r, 4)}`);
      out.push('');
      out.push(paragraph(r, 180));
      words += 180;

      for (let sub = 1; sub <= 3; sub++) {
        out.push('');
        out.push(`### ${f}.${sec}.${sub} ${makeWords(r, 3)}`);
        out.push('');
        out.push(paragraph(r, 220));
        words += 220;

        out.push('');
        out.push('> ' + sentence(r, 22));
        out.push('');

        out.push('- ' + makeWords(r, 10));
        out.push('  - ' + makeWords(r, 8));
        out.push('- ' + makeWords(r, 9));
        out.push('');
        out.push('1. ' + makeWords(r, 9));
        out.push('2. ' + makeWords(r, 11));
        out.push('');

        if (code < codePerFile) {
          out.push(...codeBlock(r, code), '');
          code++;
          totalCode++;
        }
        if (tables < tablesPerFile) {
          out.push(...table(r, tables + 1, 3 + Math.floor(r() * 4)), '');
          tables++;
          totalTables++;
        }
        if (sub === 2) {
          out.push(`[FIGURE: ${makeWords(r, 8)} diagram for section ${f}.${sec}]`, '');
        }
      }
      out.push('| Metric | Value |');
      out.push('| --- | --- |');
      out.push('| Requirement | ' + makeWords(r, 6) + ' |');
      out.push('| Evidence | ' + makeWords(r, 6) + ' |');
      out.push('');
      tables++; totalTables++;
      sec++;
    }
    out.push('---');
    out.push('');
    out.push(paragraph(r, 60));

    const p = path.join(args.dir, `stress-${String(f).padStart(2, '0')}.md`);
    const text = out.join('\n') + '\n';
    fs.writeFileSync(p, text, 'utf8');
    const wc = text.split(/\s+/).filter(Boolean).length;
    totalWords += wc;
    summary.push({ file: p, bytes: Buffer.byteLength(text, 'utf8'), words: wc, tables, code });
    console.log(`${p}  ${Buffer.byteLength(text, 'utf8')} bytes  ${wc} words  tables=${tables} code=${code}`);
  }

  const totalBytes = summary.reduce((n, s) => n + s.bytes, 0);
  console.log('---');
  console.log(`TOTAL files=${summary.length} bytes=${totalBytes} words=${totalWords} tables=${totalTables} codeBlocks=${totalCode}`);
  console.log('STRESSGEN|' + JSON.stringify({ files: summary.length, bytes: totalBytes, words: totalWords, tables: totalTables, codeBlocks: totalCode, detail: summary }));
}

main();
