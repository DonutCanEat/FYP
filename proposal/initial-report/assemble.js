#!/usr/bin/env node
/**
 * assemble.js — build the Initial Report Markdown from its section fragments.
 *
 * Why a script rather than a hand-assembly: the fragments are written by several
 * authors, and the converter that renders the .docx is unforgiving about blank
 * lines, about a `[FIGURE: ...]` placeholder that must sit alone on one line, and
 * about emphasis constructs that leak literal asterisks. Doing this by hand once
 * is possible; doing it reproducibly, and being able to re-run it after a single
 * chapter is revised, is not.
 *
 * Node only, no dependencies (the project has no pandoc, no LibreOffice, and
 * Python here is a Windows Store stub).
 *
 * Usage: node assemble.js [--check]
 *   default  : assemble and write D:\File\School\FYP\FYP-Initial-Report.md
 *   --check  : assemble in memory, report, write nothing
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = 'D:\\File\\School\\FYP';
const SRC = path.join(ROOT, 'proposal', 'initial-report');
const OUT = path.join(ROOT, 'FYP-Initial-Report.md');

// Order is the document. Front and executive summary first, chapters 1-7 in
// numeric order, then the references and the Chinese companion summary.
const PARTS = [
  '00-front.md',
  '01-introduction.md',
  '02-aims.md',
  '03-review.md',
  '04-network-services.md',
  '05-ai-plane.md',
  '06-plan.md',
  '07-risks.md',
  '08-references.md',
  '09-zh-summary.md',
];

const EXPECTED_H2 = [
  'FYP Initial Report',
  'Front matter',
  'Executive summary',
  '1. Introduction and background',
  '2. Aim and objectives, scope and completion conditions',
  '3. Literature and technology review',
  '4. Proposed methodology and design: the network and services layer, built first',
  '5. Proposed methodology and design: the AI management plane, built second',
  '6. Implementation plan',
  '7. Risks and mitigations',
  '8. References',
  '中文摘要（Chinese companion summary）',
];

function readUtf8(p) {
  // Read as a Buffer and decode explicitly: the console here is cp950 and
  // PowerShell 5.1 misparses UTF-8, so nothing may round-trip through it.
  return fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
}

function normalise(text) {
  return text
    .replace(/\r\n?/g, '\n')       // LF only
    .replace(/[ \t]+$/gm, '')      // no trailing whitespace
    .replace(/\n{3,}/g, '\n\n')    // exactly one blank line between blocks
    .trim();
}

function isTableRow(l) { return /^\s*\|/.test(l); }
function isHeading(l) { return /^#{1,6}\s/.test(l); }
function isList(l) { return /^\s*([-*+]|\d+\.)\s/.test(l); }
function isFence(l) { return /^\s*```/.test(l); }

function analyse(name, text) {
  const lines = text.split('\n');
  const issues = [];
  const warns = [];

  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (isFence(l)) { inFence = !inFence; continue; }
    if (inFence) continue;

    // H8: a [FIGURE: ...] placeholder renders only when the bracket closes.
    if (/\[FIGURE:/i.test(l)) {
      if (!/\[FIGURE:[^\]]*\]\s*$/i.test(l)) {
        issues.push(`${name}:${i + 1} [FIGURE: ...] placeholder with no closing bracket on the line (renders as nothing)`);
      }
      if (l.trim() !== l || lines[i - 1] !== undefined && lines[i - 1].trim() !== '' && !isHeading(lines[i - 1])) {
        warns.push(`${name}:${i + 1} [FIGURE: ...] is not alone in its block; it renders only alone on a line`);
      }
    }

    // H9: emphasis constructs that leak literal asterisks or break the coverage comparison.
    if (/\*\*\*/.test(l)) issues.push(`${name}:${i + 1} triple asterisk: \`**A *B***\` / \`***A*B**\` are known to leak literal asterisks`);
    if (/\*\*[^*\n]+\*[^*\n]+\*\*/.test(l)) warns.push(`${name}:${i + 1} bold span containing an italic span — reword if the render leaks asterisks`);
    if (/\*\*[^*\n]*[.!?]\*\*/.test(l)) warns.push(`${name}:${i + 1} bold span ending in a full stop — has tripped the coverage comparator before`);

    // H7: a paragraph or list item must be on ONE physical line.
    const prev = lines[i - 1];
    if (
      l.trim() !== '' && prev !== undefined && prev.trim() !== '' &&
      !isTableRow(l) && !isTableRow(prev) && !isHeading(l) && !isHeading(prev) &&
      !isList(l) && !isList(prev) && !isFence(prev)
    ) {
      issues.push(`${name}:${i + 1} possible hard-wrapped paragraph (the line above is also prose; the coverage validator works line by line)`);
    }

    if (/\t/.test(l)) warns.push(`${name}:${i + 1} literal tab`);
  }

  // Tables: equal cell counts per row (H11 warns a naive split mis-splits escaped
  // pipes, so a mismatch is reported as a candidate for inspection, not a verdict).
  let table = [];
  const flush = () => {
    if (table.length >= 2) {
      const counts = table.map((r) => r.cells);
      const first = counts[0];
      if (counts.some((c) => c !== first)) {
        warns.push(`${name}:${table[0].line} table rows have unequal cell counts (${counts.join(', ')}) — check escaped pipes \\| by hand`);
      }
    }
    table = [];
  };
  for (let i = 0; i < lines.length; i++) {
    if (isTableRow(lines[i])) {
      const cells = lines[i].trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).length;
      table.push({ line: i + 1, cells });
    } else { flush(); }
  }
  flush();

  return { issues, warns };
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const allowMissing = process.argv.includes('--allow-missing');
  let missing = PARTS.filter((f) => !fs.existsSync(path.join(SRC, f)));
  const skipped = allowMissing ? missing.slice() : [];
  const parts = allowMissing ? PARTS.filter((f) => !missing.includes(f)) : PARTS;
  if (missing.length && !allowMissing) {
    console.error('MISSING FRAGMENTS: ' + missing.join(', '));
    process.exit(2);
  }

  let combined = '';
  const stats = [];
  const allIssues = [];
  const allWarns = [];

  for (const f of PARTS) {
    const raw = readUtf8(path.join(SRC, f));
    const text = normalise(raw);
    const words = (text.match(/\S+/g) || []).length;
    const tl = text.split('\n');
    const prose = tl.filter((l) => !isTableRow(l) && !isHeading(l)).join(' ').match(/\S+/g) || [];
    stats.push({ part: f, bytes: Buffer.byteLength(raw, 'utf8'), words, prose: prose.length });
    const a = analyse(f, text);
    allIssues.push(...a.issues);
    allWarns.push(...a.warns);
    combined += text + '\n\n';
  }

  const doc = combined.replace(/\n{3,}/g, '\n\n').trim() + '\n';

  // ---- structural checks on the assembled document -------------------------
  const lines = doc.split('\n');
  const h1 = lines.filter((l) => /^#\s/.test(l));
  const h2 = lines.filter((l) => /^##\s/.test(l)).map((l) => l.replace(/^##\s+/, '').trim());
  const toc = lines.filter((l) => /^\s*\[TOC\]\s*$/i.test(l));

  if (h1.length !== 1) allIssues.push(`assembled document has ${h1.length} H1 headings; exactly one is required (it becomes the title page)`);
  if (toc.length !== 1) allIssues.push(`assembled document has ${toc.length} [TOC] directives; exactly one is required`);
  const missingH2 = EXPECTED_H2.filter((e) => !h2.includes(e));
  const extraH2 = h2.filter((e) => !EXPECTED_H2.includes(e));
  if (missingH2.length) allIssues.push('missing expected H2: ' + missingH2.join(' | '));
  if (extraH2.length) allWarns.push('unexpected H2 (check numbering): ' + extraH2.join(' | '));
  if (JSON.stringify(h2) !== JSON.stringify(EXPECTED_H2)) {
    allWarns.push('H2 order differs from the expected document order');
  }

  const proseWords = lines
    .filter((l) => !isTableRow(l) && !isHeading(l))
    .join(' ')
    .match(/\S+/g) || [];
  const totalWords = (doc.match(/\S+/g) || []).length;

  // ---- report --------------------------------------------------------------
  console.log('PART                              BYTES     WORDS');
  for (const s of stats) console.log(`${s.part.padEnd(32)} ${String(s.bytes).padStart(6)} ${String(s.words).padStart(9)}`);
  console.log(`${'TOTAL'.padEnd(32)} ${String(Buffer.byteLength(doc, 'utf8')).padStart(6)} ${String(totalWords).padStart(9)}`);
  console.log(`\nprose words (tables and headings excluded): ${proseWords.length}`);
  console.log(`H1: ${h1.length}   H2: ${h2.length}   [TOC]: ${toc.length}   lines: ${lines.length}   tables: ${(doc.match(/^\|/gm) || []).length} table rows`);
  console.log(`figures declared: ${(doc.match(/\[FIGURE:/gi) || []).length}`);
  console.log(`[TO CONFIRM] markers: ${(doc.match(/\[TO CONFIRM/gi) || []).length}`);

  if (allIssues.length) {
    console.log(`\nISSUES (${allIssues.length}) — must be fixed before rendering:`);
    for (const i of allIssues) console.log('  ! ' + i);
  } else {
    console.log('\nISSUES: none');
  }
  if (allWarns.length) {
    console.log(`\nWARNINGS (${allWarns.length}) — inspect, not necessarily wrong:`);
    for (const w of allWarns) console.log('  ? ' + w);
  }

  if (checkOnly) { console.log('\n--check: nothing written'); process.exit(allIssues.length ? 1 : 0); }

  if (allIssues.length) {
    console.log('\nNot writing the output while ISSUES remain. Re-run with --check after fixing.');
    process.exit(1);
  }
  fs.writeFileSync(OUT, doc, 'utf8');
  console.log(`\nWROTE ${OUT} (${Buffer.byteLength(doc, 'utf8')} bytes)`);
}

main();
