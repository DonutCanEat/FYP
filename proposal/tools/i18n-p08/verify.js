// Independent side-by-side comparison of the English source and the zh-HK translation.
// Usage: node verify.js <enFile> <zhFile> <outReportTxt>
const fs = require('fs');

const enFile = process.argv[2];
const zhFile = process.argv[3];
const outTxt = process.argv[4];

function load(file) {
  const buf = fs.readFileSync(file);
  const bom = buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
  const text = buf.toString('utf8').replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  const isCode = new Array(lines.length).fill(false);
  const blocks = [];
  {
    let i = 0;
    while (i < lines.length) {
      const m = /^(\s*)(`{3,}|~{3,})(.*)$/.exec(lines[i]);
      if (m) {
        const f = m[2];
        const close = new RegExp('^\\s*' + f[0] + '{' + f.length + ',}\\s*$');
        const start = i;
        isCode[i] = true; i++;
        const body = [];
        while (i < lines.length) { isCode[i] = true; const ic = close.test(lines[i]); if (!ic) body.push(lines[i]); i++; if (ic) break; }
        blocks.push({ tag: m[3].trim(), open: lines[start], closeLine: lines[i - 1], body, bodyText: body.join('\n') });
        continue;
      }
      i++;
    }
  }
  function cells(l) {
    let s = l.replace(/`[^`]*`/g, m => '~'.repeat(m.length)).trim();
    if (s.startsWith('|')) s = s.slice(1);
    if (s.endsWith('|')) s = s.slice(0, -1);
    return s.split(/(?<!\\)\|/).length;
  }
  const tables = [];
  {
    let cur = null;
    for (let i = 0; i < lines.length; i++) {
      if (!isCode[i] && /^\s*\|/.test(lines[i])) {
        if (!cur) cur = { start: i + 1, rows: [] };
        cur.rows.push({ line: i + 1, cells: cells(lines[i]), sep: /^\s*\|[\s:|-]+\|\s*$/.test(lines[i]) });
      } else if (cur) { cur.end = i; tables.push(cur); cur = null; }
    }
    if (cur) { cur.end = lines.length; tables.push(cur); }
  }
  const heads = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  lines.forEach((l, i) => { if (isCode[i]) return; const m = /^(#{1,6})\s+(.*)$/.exec(l); if (m) heads[m[1].length].push({ line: i + 1, text: m[2] }); });
  function numSeq(arr) {
    return arr.map(h => { const m = /^(\d+(?:\.\d+)*)\.?/.exec(h.text.trim()); return m ? m[1] : (h.text.startsWith('Appendix') ? h.text.split('—')[0].trim() : '(none)'); });
  }
  const spans = text.match(/(?<!`)`[^`\n]+`(?!`)/g) || [];
  return {
    file, bytes: buf.length, bom, chars: text.length, lines: lines.length,
    isCode, blocks, tables, heads, spans,
    h2num: numSeq(heads[2]), h3num: numSeq(heads[3]), h4num: numSeq(heads[4]),
    blockquoteLines: lines.filter((l, i) => !isCode[i] && /^\s*>/.test(l)).length,
    listItems: lines.filter((l, i) => !isCode[i] && /^\s*([-*+]|\d+\.)\s/.test(l)).length,
    checkboxes: lines.filter((l, i) => !isCode[i] && /^\s*[-*+]\s+\[[ xX]\]/.test(l)).length,
    images: (text.match(/!\[[^\]]*\]\([^)]*\)/g) || []).length,
    hrules: lines.filter((l, i) => !isCode[i] && /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(l)).length,
    text
  };
}

const en = load(enFile);
const zh = load(zhFile);
const R = {};
const log = [];
const say = s => log.push(s);

R.basics = { en_bytes: en.bytes, zh_bytes: zh.bytes, en_bom: en.bom, zh_bom: zh.bom, en_chars: en.chars, zh_chars: zh.chars, en_lines: en.lines, zh_lines: zh.lines };
say('== 0. BASICS ==');
say(JSON.stringify(R.basics));

const hcount = s => ({ h1: s.heads[1].length, h2: s.heads[2].length, h3: s.heads[3].length, h4: s.heads[4].length, h5: s.heads[5].length, h6: s.heads[6].length });
R.h1_headings = { en: hcount(en), zh: hcount(zh), match: JSON.stringify(hcount(en)) === JSON.stringify(hcount(zh)) };
R.h1_h2_numbering = { en: en.h2num, zh: zh.h2num, match: JSON.stringify(en.h2num) === JSON.stringify(zh.h2num) };
R.h1_h3_numbering = { en: en.h3num, zh: zh.h3num, match: JSON.stringify(en.h3num) === JSON.stringify(zh.h3num), en_count: en.h3num.length, zh_count: zh.h3num.length };
R.h1_h4_numbering = { en: en.h4num, zh: zh.h4num, match: JSON.stringify(en.h4num) === JSON.stringify(zh.h4num), en_count: en.h4num.length, zh_count: zh.h4num.length };
say('');
say('== 1. HEADINGS ==');
say('en ' + JSON.stringify(hcount(en)) + '  zh ' + JSON.stringify(hcount(zh)));
say('h2 numbering en: ' + JSON.stringify(en.h2num));
say('h2 numbering zh: ' + JSON.stringify(zh.h2num));
say('h3 numbering identical sequence: ' + R.h1_h3_numbering.match + ' (en ' + en.h3num.length + ', zh ' + zh.h3num.length + ')');
say('h4 numbering identical sequence: ' + R.h1_h4_numbering.match + ' (en ' + en.h4num.length + ', zh ' + zh.h4num.length + ')');
say('--- en h2/h3/h4 with line numbers ---');
[2, 3, 4].forEach(lv => en.heads[lv].forEach(h => say('  H' + lv + ' L' + h.line + ': ' + h.text)));
say('--- zh h2/h3/h4 with line numbers ---');
[2, 3, 4].forEach(lv => zh.heads[lv].forEach(h => say('  H' + lv + ' L' + h.line + ': ' + h.text)));

const shape = s => s.tables.map(t => t.rows.length + 'x' + (t.rows[0] ? t.rows[0].cells : 0)).join(',');
R.t2_tables = {
  en_tables: en.tables.length, zh_tables: zh.tables.length,
  en_rows: en.tables.reduce((a, t) => a + t.rows.length, 0),
  zh_rows: zh.tables.reduce((a, t) => a + t.rows.length, 0),
  en_data_rows: en.tables.reduce((a, t) => a + t.rows.filter(r => !r.sep).length, 0),
  zh_data_rows: zh.tables.reduce((a, t) => a + t.rows.filter(r => !r.sep).length, 0),
  en_sep_rows: en.tables.reduce((a, t) => a + t.rows.filter(r => r.sep).length, 0),
  zh_sep_rows: zh.tables.reduce((a, t) => a + t.rows.filter(r => r.sep).length, 0),
  shape_sequence_match: shape(en) === shape(zh)
};
const es = shape(en).split(','), zs = shape(zh).split(',');
R.t2_shape_mismatches = [];
if (es.length === zs.length) es.forEach((v, i) => { if (v !== zs[i]) R.t2_shape_mismatches.push({ table: i + 1, en: v, zh: zs[i], en_start_line: en.tables[i].start, zh_start_line: zh.tables[i].start }); });
else R.t2_shape_mismatches.push({ note: 'table count differs', en: es.length, zh: zs.length });
const ragged = [];
zh.tables.forEach((t, i) => { const set = [...new Set(t.rows.map(r => r.cells))]; if (set.length > 1) ragged.push({ table: i + 1, start_line: t.start, cell_counts: set }); });
R.t2_zh_ragged_rows = ragged;
say('');
say('== 2. TABLES ==');
say(JSON.stringify(R.t2_tables));
say('per-table shape mismatches: ' + JSON.stringify(R.t2_shape_mismatches));
say('zh tables with rows of differing cell counts: ' + JSON.stringify(ragged));

R.t3_fences = {
  en_blocks: en.blocks.length, zh_blocks: zh.blocks.length,
  en_tags: en.blocks.map(b => b.tag), zh_tags: zh.blocks.map(b => b.tag),
  tags_match: JSON.stringify(en.blocks.map(b => b.tag)) === JSON.stringify(zh.blocks.map(b => b.tag)),
  openers_match: JSON.stringify(en.blocks.map(b => b.open)) === JSON.stringify(zh.blocks.map(b => b.open)),
  closers_match: JSON.stringify(en.blocks.map(b => b.closeLine)) === JSON.stringify(zh.blocks.map(b => b.closeLine)),
  en_block_lines: en.blocks.map(b => b.body.length), zh_block_lines: zh.blocks.map(b => b.body.length)
};
const perBlock = [];
for (let i = 0; i < Math.min(en.blocks.length, zh.blocks.length); i++) {
  const a = en.blocks[i].bodyText, b = zh.blocks[i].bodyText;
  perBlock.push({ block: i + 1, chars_en: a.length, chars_zh: b.length, bytes_en: Buffer.byteLength(a, 'utf8'), bytes_zh: Buffer.byteLength(b, 'utf8'), identical: a === b });
}
const enConcat = en.blocks.map(b => b.bodyText).join('\n');
const zhConcat = zh.blocks.map(b => b.bodyText).join('\n');
R.t4_code_fidelity = {
  blocks_compared: perBlock.length,
  blocks_byte_identical: perBlock.filter(x => x.identical).length,
  per_block_fidelity: perBlock,
  concat_chars_en: enConcat.length, concat_chars_zh: zhConcat.length,
  concat_bytes_en: Buffer.byteLength(enConcat, 'utf8'), concat_bytes_zh: Buffer.byteLength(zhConcat, 'utf8'),
  concat_byte_identical: Buffer.from(enConcat, 'utf8').equals(Buffer.from(zhConcat, 'utf8')),
  block_line_counts_match: JSON.stringify(en.blocks.map(b => b.body.length)) === JSON.stringify(zh.blocks.map(b => b.body.length))
};
say('');
say('== 3. FENCED CODE BLOCKS ==');
say('en=' + en.blocks.length + ' zh=' + zh.blocks.length + ' tags_match=' + R.t3_fences.tags_match + ' openers_match=' + R.t3_fences.openers_match + ' closers_match=' + R.t3_fences.closers_match);
say('tags: ' + JSON.stringify(R.t3_fences.en_tags));
say('== 4. CODE FIDELITY ==');
say('blocks_compared=' + R.t4_code_fidelity.blocks_compared + ' blocks_byte_identical=' + R.t4_code_fidelity.blocks_byte_identical);
say('concat chars en=' + R.t4_code_fidelity.concat_chars_en + ' zh=' + R.t4_code_fidelity.concat_chars_zh);
say('concat bytes en=' + R.t4_code_fidelity.concat_bytes_en + ' zh=' + R.t4_code_fidelity.concat_bytes_zh);
say('concat byte identical=' + R.t4_code_fidelity.concat_byte_identical);
say('per-block: ' + JSON.stringify(perBlock));

const uniq = a => { const m = new Map(); a.forEach(x => m.set(x, (m.get(x) || 0) + 1)); return m; };
const eS = uniq(en.spans), zS = uniq(zh.spans);
const missing = [], extra = [], countDiff = [];
for (const [k, v] of eS) { if (!zS.has(k)) missing.push(k); else if (zS.get(k) !== v) countDiff.push({ span: k, en: v, zh: zS.get(k) }); }
for (const [k, v] of zS) if (!eS.has(k)) extra.push(k);
R.t6_code_spans = { en_total: en.spans.length, zh_total: zh.spans.length, multiset_equal: !missing.length && !extra.length && !countDiff.length, missing: missing.slice(0, 30), extra: extra.slice(0, 30), count_diff: countDiff.slice(0, 30) };
say('');
say('== 6. INLINE CODE SPANS ==');
say(JSON.stringify(R.t6_code_spans));

R.t5_identifier_patterns = {};
const patterns = {
  test_ids: /\bTC-[A-Z0-9]+-\d+\b/g,
  risk_ids: /\bPR-\d{2}\b/g,
  evidence_ids: /\bEV-\d{4}\b/g,
  objectives: /\bO-\d{1,2}\b/g,
  work_packages: /\bWP-\d{2}\b/g,
  trust_boundaries: /\bTB-\d{2}\b/g,
  findings: /\bFN-\d{2}\b/g,
  versions: /\bv\d+\.\d+(?:\.\d+)?\b/g,
  vrids: /\bVRID \d+\b/g,
  as_numbers: /\bAS \d{5}\b/g,
  vlan_ids: /\bVLAN \d+\b/g,
  ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?\b/g,
  vpnz_hosts: /\bvpnz-[a-z0-9]+/g,
  vp_devices: /\bVP-[A-Z0-9]+-[A-Z0-9-]+/g,
  gpo_names: /\bGPO-[A-Za-z0-9-]+/g,
  groups: /\bGG-[A-Za-z0-9-]+/g,
  urls: /https?:\/\/[^\s`)\]<>"]+/g,
  appendix_letters: /Appendix [A-L]\b/g,
  section_numbers: /^## \d+\./gm
};
const counts = (file, re) => { const m = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').match(re) || []; const o = {}; m.forEach(x => o[x] = (o[x] || 0) + 1); return o; };
const diffsAll = [];
for (const [name, re] of Object.entries(patterns)) {
  const a = counts(enFile, re), b = counts(zhFile, re);
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  const diffs = keys.filter(k => (a[k] || 0) !== (b[k] || 0)).map(k => ({ value: k, en: a[k] || 0, zh: b[k] || 0 }));
  R.t5_identifier_patterns[name] = { distinct_en: Object.keys(a).length, distinct_zh: Object.keys(b).length, en_total: Object.values(a).reduce((x, y) => x + y, 0), zh_total: Object.values(b).reduce((x, y) => x + y, 0), differing: diffs.slice(0, 30), differing_count: diffs.length };
  if (diffs.length) diffsAll.push({ name, diffs: diffs.slice(0, 30) });
  say('');
  say('  ' + name.padEnd(20) + ' distinct en=' + String(Object.keys(a).length).padStart(4) + ' zh=' + String(Object.keys(b).length).padStart(4) + '  occurrences en=' + String(R.t5_identifier_patterns[name].en_total).padStart(6) + ' zh=' + String(R.t5_identifier_patterns[name].zh_total).padStart(6) + '  differing=' + diffs.length + (diffs.length ? '  ' + JSON.stringify(diffs.slice(0, 10)) : ''));
}
R.t5_total_problems = diffsAll;
say('');
say('== 5. EXPLICIT SPOT-CHECK VALUES (>=20) ==');
const explicit = ['TC-L1-01', 'TC-SEC-07', 'TC-FO-13', 'TC-DOC-02', 'TC-MON-03', 'TC-PKI-01', 'PR-01', 'PR-24', 'EV-0001', 'EV-0020', 'O-1', 'O-14', 'WP-01', 'WP-20', 'TB-01', 'TB-16', '10.20.20.10', '10.10.30.254', '10.10.50.10', '10.10.90.0/24', '10.70.0.0/24', 'vpnz-hvhost01', 'vpnz-dc01', 'vpnz-mon01', 'VP-HQ-CORE-01', 'VP-ISP-EDGE-01', 'vertexpeak.fyp.lab', 'AS 65000', 'AS 65002', 'vrid 51', 'VLAN 999', 'VLAN 131', 'v00-baseline-v1.0', 'WG-HQ-WC', 'GG-AI-ReadOnly', 'iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target', '198.51.100.2', '203.0.113.5'] ;
const enRaw = fs.readFileSync(enFile, 'utf8'), zhRaw = fs.readFileSync(zhFile, 'utf8');
R.t5b_explicit = {};
let spotFails = 0;
for (const v of explicit) {
  const re = new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const a = (enRaw.match(re) || []).length, b = (zhRaw.match(re) || []).length;
  R.t5b_explicit[v] = { en: a, zh: b, match: a === b };
  if (a !== b) spotFails++;
  say('  ' + v.padEnd(52) + ' en=' + String(a).padStart(4) + ' zh=' + String(b).padStart(4) + (a === b ? '  OK' : '  <<< MISMATCH'));
}
R.t5b_failures = spotFails;

R.t7_linecount = { en: en.lines, zh: zh.lines, delta: zh.lines - en.lines };
say('');
say('== 7. LINE COUNTS ==');
say(JSON.stringify(R.t7_linecount));

R.t8_appendix_letters = [];
for (const L of 'ABCDEFGHIJKL') {
  const re = new RegExp('Appendix ' + L + '\\b', 'g');
  R.t8_appendix_letters.push({ letter: L, en: (enRaw.match(re) || []).length, zh: (zhRaw.match(re) || []).length });
}
R.t8_section_numbers = [];
for (let n = 12; n <= 20; n++) {
  const re = new RegExp('^## ' + n + '\\.', 'gm');
  R.t8_section_numbers.push({ n, en: (enRaw.match(re) || []).length, zh: (zhRaw.match(re) || []).length });
}
R.t8_ok = R.t8_appendix_letters.every(x => x.en > 0 && x.zh > 0) && R.t8_section_numbers.every(x => x.en === 1 && x.zh === 1);
say('');
say('== 8. APPENDIX LETTERS A-L AND SECTION NUMBERS 12-20 ==');
say(JSON.stringify(R.t8_appendix_letters));
say(JSON.stringify(R.t8_section_numbers));
say('all present in both: ' + R.t8_ok);

R.t9_other = {
  blockquote_lines: { en: en.blockquoteLines, zh: zh.blockquoteLines },
  list_items: { en: en.listItems, zh: zh.listItems },
  checkbox_items: { en: en.checkboxes, zh: zh.checkboxes },
  images: { en: en.images, zh: zh.images },
  horizontal_rules: { en: en.hrules, zh: zh.hrules },
  escaped_pipes: { en: (enRaw.match(/\\\|/g) || []).length, zh: (zhRaw.match(/\\\|/g) || []).length },
  toc_tokens: { en: (enRaw.match(/\[TOC\]/g) || []).length, zh: (zhRaw.match(/\[TOC\]/g) || []).length },
  markers_assumption_marker: { en: (enRaw.match(/\[ASSUMPTION\]/g) || []).length, zh: (zhRaw.match(/\[假設\]/g) || []).length },
  markers_uncertain: { en: (enRaw.match(/\[UNCERTAIN\]/g) || []).length, zh: (zhRaw.match(/\[未確定\]/g) || []).length }
};
say('');
say('== 9. OTHER STRUCTURAL COUNTERS ==');
say(JSON.stringify(R.t9_other, null, 1));

// prose overlay: non-code line-by-line
const enL = en.text.split('\n'), zhL = zh.text.split('\n');
let compared = 0, identical = 0;
const nonCodeDiffs = [];
for (let i = 0; i < Math.min(en.lines, zh.lines); i++) {
  if (en.isCode[i] || zh.isCode[i]) continue;
  compared++;
  if (enL[i] === zhL[i]) identical++;
  else nonCodeDiffs.push({ line: i + 1, en: enL[i].slice(0, 100), zh: zhL[i].slice(0, 100) });
}
// placeholder-only and separator rows must be identical
const mustBeIdentical = [];
for (let i = 0; i < Math.min(en.lines, zh.lines); i++) {
  if (en.isCode[i] || zh.isCode[i]) continue;
  const a = enL[i], b = zhL[i];
  const aPure = a.trim() === '' || /^\s*\|[\s:|-]+\|\s*$/.test(a) || !/[A-Za-z]/.test(a.replace(/`[^`]*`/g, '')) === false && !/[A-Za-z]{3,}/.test(a);
  if (a.trim() === '') { if (a !== b) mustBeIdentical.push({ line: i + 1, kind: 'blank', en: JSON.stringify(a), zh: JSON.stringify(b) }); continue; }
  if (/^\s*\|[\s:|-]+\|\s*$/.test(a)) { if (a !== b) mustBeIdentical.push({ line: i + 1, kind: 'separator', en: a, zh: b }); continue; }
  if (/^#{1,6}\s/.test(a)) { /* headings translated */ continue; }
}
R.t10_prose_overlay = { non_code_lines_compared: compared, translated_differ: nonCodeDiffs.length, structural_mismatches: mustBeIdentical.length, structural_mismatch_detail: mustBeIdentical.slice(0, 20) };
say('');
say('== 10. PROSE LINE OVERLAY ==');
say('non-code lines compared: ' + compared + '; translated (differing): ' + nonCodeDiffs.length + '; blank/separator mismatches: ' + mustBeIdentical.length);
say(JSON.stringify(mustBeIdentical.slice(0, 20)));
say('');
say('--- FULL PROSE LINE OVERLAY: line | EN | ZH (EN===ZH marked SAME) ---');
for (let i = 0; i < Math.max(en.lines, zh.lines); i++) {
  if (en.isCode[i] || zh.isCode[i]) continue;
  const a = enL[i] === undefined ? '(missing)' : enL[i];
  const b = zhL[i] === undefined ? '(missing)' : zhL[i];
  say('L' + (i + 1) + (a === b ? ' SAME' : ' DIFF'));
  say('  EN: ' + a);
  say('  ZH: ' + b);
}

// possible untranslated prose heuristic
const enWords = /\b(the|and|of|to|is|are|with|that|for|from|must|be|not|as|in|on|by|each|this|which|will|have|has)\b/gi;
const leftovers = [];
for (let i = 0; i < zh.lines; i++) {
  if (zh.isCode[i]) continue;
  const l = zhL[i];
  if (!l.trim()) continue;
  const stripped = l.replace(/`[^`]*`/g, ' ').replace(/https?:\/\/\S+/g, ' ');
  const hits = (stripped.match(enWords) || []).length;
  if (hits >= 4) leftovers.push({ line: i + 1, hits, text: l.slice(0, 150) });
}
R.t11_untranslated_candidates = { count: leftovers.length, sample: leftovers.slice(0, 40) };
say('');
say('== 11. POSSIBLE UNTRANSLATED PROSE (English stop-word heuristic) ==');
say('candidates: ' + leftovers.length);
leftovers.slice(0, 40).forEach(x => say('  L' + x.line + ' hits=' + x.hits + ': ' + x.text));

fs.writeFileSync(outTxt, log.join('\n'), 'utf8');
const summary = {
  basics: R.basics,
  h1_headings: R.h1_headings,
  h1_h2_numbering: { match: R.h1_h2_numbering.match, en: R.h1_h2_numbering.en },
  h1_h3_numbering: { match: R.h1_h3_numbering.match, en_count: R.h1_h3_numbering.en_count, zh_count: R.h1_h3_numbering.zh_count },
  h1_h4_numbering: { match: R.h1_h4_numbering.match, en_count: R.h1_h4_numbering.en_count, zh_count: R.h1_h4_numbering.zh_count },
  t2_tables: R.t2_tables,
  t2_shape_mismatches: R.t2_shape_mismatches,
  t2_zh_ragged_rows: R.t2_zh_ragged_rows,
  t3_fences: { en_blocks: R.t3_fences.en_blocks, zh_blocks: R.t3_fences.zh_blocks, tags_match: R.t3_fences.tags_match, openers_match: R.t3_fences.openers_match, closers_match: R.t3_fences.closers_match, tags: R.t3_fences.en_tags },
  t4_code_fidelity: { blocks_compared: R.t4_code_fidelity.blocks_compared, blocks_byte_identical: R.t4_code_fidelity.blocks_byte_identical, concat_chars_en: R.t4_code_fidelity.concat_chars_en, concat_chars_zh: R.t4_code_fidelity.concat_chars_zh, concat_bytes_en: R.t4_code_fidelity.concat_bytes_en, concat_bytes_zh: R.t4_code_fidelity.concat_bytes_zh, concat_byte_identical: R.t4_code_fidelity.concat_byte_identical, per_block: perBlock },
  t5_identifier_patterns: R.t5_identifier_patterns,
  t5_total_problems: R.t5_total_problems,
  t5b_explicit_failures: R.t5b_failures,
  t5b_explicit: R.t5b_explicit,
  t6_code_spans: R.t6_code_spans,
  t7_linecount: R.t7_linecount,
  t8_appendix_letters: R.t8_appendix_letters,
  t8_section_numbers: R.t8_section_numbers,
  t8_ok: R.t8_ok,
  t9_other: R.t9_other,
  t10_prose_overlay: R.t10_prose_overlay,
  t11_untranslated_candidates_count: R.t11_untranslated_candidates.count
};
fs.writeFileSync(outTxt.replace(/\.txt$/, '.json'), JSON.stringify(summary, null, 1), 'utf8');
console.log(JSON.stringify(summary, null, 1));
