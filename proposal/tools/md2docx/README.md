# md2docx — Markdown → Microsoft Word (.docx) converter (no pandoc required)

A dependency-free Markdown-to-OOXML converter plus a strict validator, built for the
DSH offline Windows box where **pandoc is not installed, LibreOffice/soffice is not
installed, 7z is not installed, and Python on PATH is a Windows Store stub that exits
9009**. Node.js is present, so Node writes the `.docx` package directly.

---

## 1. Why this approach

| Option | Status on this machine | Verdict |
| --- | --- | --- |
| pandoc | not installed (`exit 9009`) | unusable |
| LibreOffice headless | not installed | unusable |
| Python + python-docx | Windows Store stub, fails | unusable |
| **Node.js + hand-written OOXML + own ZIP writer** | Node v24.9.0 works | **used** |

The converter writes the WordprocessingML parts itself and packs them with a small
ZIP writer (raw `zlib` deflate, method 8). Nothing is installed and nothing is
downloaded — the box is offline and `Invoke-WebRequest`/`curl.exe` fail here anyway
(schannel `SEC_E_NO_CREDENTIALS`).

---

## 2. Requirements

* Node.js (tested with v24.9.0). No npm packages, no network.
* Windows PowerShell 5.1 for the wrapper and the validator.

---

## 3. Quick start

```powershell
cd D:\File\School\FYP\proposal\tools\md2docx

# single file
.\convert.ps1 -InputPath .\sample.md -OutputPath .\sample.docx -Title "Sample Document"

# validate the result (structure + content counts + coverage proof)
.\validate.ps1 .\sample.docx -MarkdownPath .\sample.md

# Word open + PDF export acceptance test (see section 8 for the caveat)
.\wordcom-test.ps1 .\sample.docx
```

The converter also prints a machine-readable report:

```
MD2DOCX|{"output":"...","outputBytes":11507,"parts":14,"stats":{...},"canonicalSha256":"...",...}
MD2DOCX-SUMMARY|{"documents":1,"totalMs":11,...}
```

---

## 4. Command-line shapes

### 4.1 One document from one file

```powershell
node convert.js <input.md> <output.docx> ["Document Title"]
```

### 4.2 One document from MANY files (concatenated in order, page break between files)

```powershell
node convert.js --input 01.md,02.md,03.md,04.md,05.md,06.md,07.md,08.md `
                --output proposal.docx --title "FYP Proposal"
```

or positionally — the **first** `.docx`-looking argument is treated as the output and
everything after it is the title:

```powershell
node convert.js 01.md 02.md 03.md 04.md 05.md 06.md 07.md 08.md proposal.docx "FYP Proposal"
```

Each file starts a fresh page; heading hierarchy continues across file boundaries
(one continuous document, one navigation pane, one TOC field).

### 4.3 One run, several documents (combined + two-volume split)

Drive it from a JSON split manifest so the split rule is **data, not code**:

```powershell
node convert.js --config .\split-plan.example.json
```

```json
{
  "title": "FYP Proposal",
  "inputs": ["01.md", "02.md", "03.md", "04.md", "05.md", "06.md", "07.md", "08.md"],
  "outputs": [
    { "path": "proposal.docx", "title": "FYP Proposal: Complete" },
    { "path": "volume1.docx", "title": "Volume 1: Overview",
      "rules": { "include": ["1-6", "12-20"], "frontMatter": true } },
    { "path": "volume2.docx", "title": "Volume 2: Deep Technical Chapters",
      "rules": { "include": ["7-11", "A-"], "frontMatter": false } }
  ]
}
```

Rule fields (all optional, all data-driven):

| Field | Meaning |
| --- | --- |
| `include` | list of section keys/ranges, e.g. `["1-6", "12-20", "A"]` |
| `exclude` | applied after `include` |
| `match` | regex tested against the section heading text (alternative to number lists) |
| `frontMatter` | keep everything before the first numbered section (title page, TOC, unnumbered top-level headings). Defaults to `true` only for the volume that contains section 1 |
| `titlePage` | output-level (or manifest-level) flag: synthesise a title page + TOC field when the body has no H1 to promote — see 4.3.1 |

Section numbers are read from the leading number of each top-level heading and the
extractor is tolerant of real-world heading styles:

```
# 3 Microsoft Infrastructure        -> key "3"
# Volume Section 3: Linux Platform  -> key "3"
## Chapter 7 - Automation           -> key "7"
# Appendix A                        -> key "A"
```

**The section boundary is the document's shallowest heading level, not literally H1.**
A corpus whose top-level sections are written as `## N. Title` (the real
`proposal\sections\*.md` corpus: 26 `## ` sections, no `# ` at all) is split by
those `## N.` numbers, because a boundary hard-coded to `# ` would swallow the whole
document into one front-matter group and every `include` rule would select nothing.
For a normal H1-based document the shallowest level is 1 and behaviour is unchanged.

Unnumbered top-level headings are front matter: they are kept only when the output's
`frontMatter` is true, or when the output contains section 1 and does not say
otherwise.

### 4.3.1 `titlePage`: a title page for a corpus with no H1

`[TOC]` and the title page are normally triggered by content (an H1 becomes the title
page; `[TOC]` becomes the field). A corpus with no H1 has neither, so an output may
declare it explicitly:

```json
{ "path": "volume2.docx", "title": "...", "subtitle": "...", "titlePage": true,
  "rules": { "include": ["7-11"], "frontMatter": false } }
```

It may be set once at the top level of the manifest (applying to every output) or per
output. When set, and only when the selected body has no H1 of its own, the converter
prepends a synthetic title page (the output's `title` + optional `subtitle`, in the
`TitlePageTitle`/`TitlePageSubtitle` styles) and a real `TOC \o "1-3"` field, unless the
body already contains a `[TOC]`. The synthetic blocks are included in the converter's
canonical text, so `bodyDigestMatches`/`digestPlausible` stay meaningful.

`validate.ps1` counts the injected title paragraph as a `TitlePageTitle` style paragraph,
so its `H1 count` comparison reports `markdown 0 (minus 1 title-styled) vs document 0`
for such a volume — that FAIL line is expected for a synthesised title page and is
unrelated to content completeness. Everything else in its report (H2-H6 counts, tables,
rows, list items, figures, rules, code paragraphs, TABLE INTEGRITY and the coverage
proof) is unaffected.

### 4.3.2 Production manifest for this proposal

`split-plan.fyp.json` in this folder is the production run for the eight-file corpus:

```powershell
cd proposal\tools\md2docx
node convert.js --config split-plan.fyp.json
```

It produces, in `D:\File\School\FYP\`:
`FYP-Proposal-COMPLETE.docx`, `FYP-Proposal-Volume1-Plan.docx` (front matter + 1-6 + 12-20)
and `FYP-Proposal-Volume2-Technical.docx` (7-11, no front matter).

---

## 5. Markdown features supported

| Markdown | Word output |
| --- | --- |
| `# ` first heading | title page (own style) + page break |
| `## `, `### `, `#### `, `##### `, `###### ` | **built-in** Heading 1–6 styles (real navigation pane, updatable TOC) |
| body paragraphs | justified normal paragraphs |
| `**bold**`, `*italic*`, `***both***`, `~~strike~~` | bold / italic / both / strikethrough runs |
| `` `code` `` | monospace run with light shading (`MonoChar` character style) |
| `[text](url)`, `<url>` | real hyperlinks via external relationships |
| `- `, `* `, `+ ` (nested 3 levels) | bulleted lists with `Symbol`/`Courier New`/`Wingdings` markers |
| `1. ` (nested 3 levels) | numbered lists (decimal, `%1.` / `%2.` / `%3.`) |
| `- [ ]` / `- [x]` | ☐ / ☑ ballot-box list items |
| GitHub tables | real `w:tbl` with borders, shaded header row, **`<w:tblHeader/>`** (header repeats on every page), per-column alignment, `cantSplit` rows |
| fenced code blocks (with or without language) | one monospaced paragraph per line, grey shaded background, `<w:noProof/>` (no spell-check), language label line above |
| `> ` blockquote | left-bar + light fill, italic body |
| `---` | paragraph with a bottom border (plus an invisible U+2015 sentinel so text extraction stays accountable) |
| `[FIGURE: ...]` | red-bordered shaded centred placeholder paragraph, prefixed `[FIGURE]` |
| `[TOC]` | **real Word TOC field** `TOC \o "1-3" \h \z \u`, marked dirty, with `w:updateFields=true` in `settings.xml` so Word offers/rebuilds it on open |

Page setup: A4 (11,906 × 16,838 twips), 2.5 cm margins, running header with the document
title, footer with `PAGE`/`NUMPAGES` fields, page break between title page and body.

### 5.1 Table pipes: escaped and inside code spans (important)

Pipes in a table row are ambiguous, and getting them wrong silently shifts columns or
mangles a row. `splitTableRow()` implements these rules, and `node convert.js --selftest`
asserts every one of them:

| Input in a cell | Rule | Result |
| --- | --- | --- |
| `\|` | escaped pipe | a literal `|` inside that one cell; never a separator |
| `` `a|b` `` | pipe inside an inline code span | cell content, not a separator |
| `` `a\|b` `` | both at once | **escaping wins** — literal `|`, still one cell |
| a plain `|` outside code spans | separator | starts the next cell |

The code-span rule uses a simple backtick toggle, which is how CommonMark delimits
single-backtick spans and which re-synchronises correctly when a cell holds several spans.

**Ragged rows never crash the conversion.** A row whose cell count differs from its header
is normalised to the header's width — short rows are padded with empty cells, long rows are
truncated — the Word table therefore stays rectangular, and the row is reported in the
converter's report as `raggedTableRows` (with `source`, `line`, `cells`, `headerCells`), plus
a one-line note on stderr. An author who *intends* a ragged row can declare it with the
directive

```
<!-- md2docx:expect-ragged -->
```

on the line above the table header; the rows below are then normalised quietly. Directives
of the form `<!-- md2docx:... -->` are tooling instructions: they are consumed and never
written into the document.

`validate.ps1` independently re-checks every table for rectangularity and reports e.g.
`TABLE INTEGRITY: all 30 table(s) rectangular (307 rows, every row's cell count matches its
header)`.

Verified on the real corpus (`proposal\sections\*.md`, 312 tables, 3,588 rows, 71 rows
containing `\|`, 912 rows documenting pipes): the converter's parser reports **2 ragged rows
in total**, both in `06-automation.md` at lines 1129-1130, where the source row genuinely
omits a column (the `#` cell is missing) — padded to 5 cells and reported. Everything else is
rectangular, and `06-automation.md` (the pipe-heaviest file) validates at **100.000% source
coverage with 30/30 tables rectangular**. A naive split-on-every-pipe parser mis-splits 85 of
those rows.

To inspect a produced file's tables directly:

```powershell
.\tablecells.ps1 .\sample.docx
```

---

## 6. Generated package (14 parts)

```
[Content_Types].xml  _rels/.rels  docProps/core.xml  docProps/custom.xml  docProps/app.xml
word/document.xml    word/_rels/document.xml.rels     word/styles.xml   word/numbering.xml
word/settings.xml    word/fontTable.xml               word/theme/theme1.xml
word/header1.xml     word/footer1.xml
```

`docProps/custom.xml` carries a SHA-256 of the canonical visible text plus the paragraph,
table, code-block and list-item counts, for auditing.

---

## 7. Validator (`validate.ps1`)

```powershell
.\validate.ps1 <docx> [-MarkdownPath <md>] [-AsJson] [-Quiet] [-FullParts]
```

Checks performed:

1. the file opens as a ZIP; **every part is listed with uncompressed and compressed size**;
2. **every `.xml`/`.rels` part parses with `XmlDocument`** (no malformed XML);
3. all required OOXML parts exist and **every part is declared** by a content-type
   `Default` extension or `Override` `PartName`;
4. **every `r:id`** referenced from `document.xml`/`header1.xml`/`footer1.xml`
   **resolves** in the matching `.rels`, every internal relationship target exists, and
   the header/footer `sectPr` references resolve;
5. counts: paragraphs (total and body-level), **headings H1–H6**, tables, table rows and
   repeating header rows, code-block paragraphs, list items, figures, quotes, rules,
   hyperlinks, page breaks, `w:t` node count, and the **total character count extracted
   from every `w:t` node** (plus words);
6. `TOC \o "1-3"` field with `begin`/`separate`/`end`, `w:updateFields=true`, A4 page
   size, header/footer references, `PAGE` field in the footer, all referenced styles
   defined, all `numId`s defined;
7. with `-MarkdownPath`, the source counts are recomputed and compared:
   H1–H4 counts, table count, table rows, list items, figures, rules, code paragraphs;
   **table integrity** is checked as well: every table row must have the same cell count as
   its header row, which is what catches a mis-split `\|` or code-span pipe;
8. **coverage proof**: every content line of the source (headings, paragraphs, list
   items, table cells, code lines) must appear **verbatim** in the document text.
   This is the completeness gate.

`convert.js --selftest` runs **136** built-in assertions covering the table pipe rules,
section keys, range expansion, inline-syntax stripping, XML escaping, the **ordered
serialiser tables** for `w:rPr`/`w:pPr`/`w:tblPr`/`w:tcPr`/`w:settings` (compared against
Microsoft's own SDK sequence), the **relationship-id allocator and its duplicate
assertions**, the **strict fenced-code-block rules** (see section 13), and the
**order/reassembly assertions** (see section 14) which emit a synthetic document through the
real pipeline and read the body back, then repeat the check end-to-end through the CLI and
`verify-order.js`; it exits non-zero on the first failure and is the fastest way to confirm
the parser behaves as documented.

Exit code is `0` on pass and non-zero on any failure, with `CHECK FAILED: <detail>` on
stderr.

### Why the completeness gate is a coverage proof, not a text digest

An earlier iteration compared a SHA-256 of the whole canonical text between Markdown and
`.docx`. That cannot be made reliable: Markdown emphasis and a **literal asterisk inside a
code span normalise to the same text** — `` `code_span_with_*stars*` `` is
indistinguishable from an emphasised `code_span_with_stars` once the backticks are gone.
Any rule set that strips emphasis will therefore strip the literal one too, on one side but
not the other, producing a false failure on perfectly converted content. This was verified
directly with a probe. Per-line coverage checking has no such ambiguity and localises any
real loss to a specific source line.

The converter still computes a digest (published in `docProps/custom.xml` and printed in its
report as `bodyDigestMatches`), but it is scoped honestly: it compares the text the writer
measured on its way into the ZIP against the same text re-derived from the source using the
same normalisation. It fails if the writer drops, truncates or mangles a paragraph, and it is
what caught the zero-byte `document.xml` bug during development. It is **not** the
completeness guarantee — the coverage proof is.

---

## 8. Word COM acceptance test (`wordcom-test.ps1`)

```powershell
.\wordcom-test.ps1 .\sample.docx [.\sample.pdf]
```

It probes `New-Object -ComObject Word.Application`, opens the `.docx` in Word, reports
Word's own `ComputeStatistics` page/word/character counts, exports a PDF with
`SaveAs(path, 17)`, and closes/Quits. Exit codes: `2` = not found, `3` = Word COM
unavailable, `4` = PDF not produced, `5` = open/export failed, `6` = refused (unsafe
target).

**The script is now guarded so it cannot be pointed at a real document.**
`wordcom-test.ps1` used to open whatever path it was given, which is exactly the
mechanism that once rewrote `AY2627_FYP topics_v2_Victor Li.docx` in place (section
13.4). It now enforces a hard allow-list *before* it hashes, copies or opens anything:
the resolved target must sit inside a temporary directory (`$env:TEMP`/`$env:TMP`, or a
caller-supplied `-AllowRoot` that may only narrow that list, never widen it), and it is
refused outright — exit code **6**, with the reason printed — if it is anywhere under
`D:\File\School\FYP`, contains `proposal\sections`, `proposal\i18n`,
`proposal\research`, `proposal\integration`, is named `FYP-Proposal-*` or
`AY2627_FYP topics_v2_Victor Li.docx`, or lies outside the allowed temp roots. Only if
that gate passes does it copy the target into a fresh `%TEMP%\wordcom-test-<guid>\`
subdirectory, record the caller's SHA-256 before and after, operate *only* on the copy
(the PDF is written beside the copy, and the copy path is printed so the caller can see
the original was never touched), and fail with exit 6 plus a loud warning if the
caller's original hash changed. `-SelfCheck` runs the gate's own 11-case self-test and
exits (0 = gate correct, 6 = gate wrong) without opening any document, and a
`[CmdletBinding()]` wrapper documents that the script must never run unattended. The
rule this encodes, and which applies to *every* tool in this folder: **never open a
`.docx` by path — Word COM and the Open XML SDK can both rewrite it in place, even when
opened read-only.**

**Important, measured caveat:** on this machine `New-Object -ComObject Word.Application`
**succeeds** (Word 16.0), but every operation that touches a document hangs indefinitely —
`Documents.Open`, `Documents.Add`, even reading `Word.Options`. This was reproduced with
the machine's own pre-existing `AY2627_FYP topics_v2_Victor Li.docx`, so it is not caused by
this converter's output. On a later run, re-testing the guard, `Documents.Open` on a temp
copy failed outright instead of hanging (`COMException: Exception from HRESULT: 0x800A13E9`,
exit 5, no Word process left behind). Either way the COM/Word environment in this sandbox
cannot do document work, so **Word-openability could not be verified here**; use
`validate.ps1` as the gate, and run `wordcom-test.ps1` on a normal desktop session to get
the definitive answer.

> **WARNING — never point this script at a document you cannot afford to lose.**
> `wordcom-test.ps1` opens a `.docx` **by path** (`$word.Documents.Open($workPath, ...)`)
> through Word COM, and on this Office build Word can rewrite a document in place even when
> it is opened read-only. The guard added above is a second line of defence, not a licence
> to aim it at a source document: it still runs Word at all, and the only file it will ever
> open is its own temp copy. See section 13.4.

---

## 9. Scale: measured results

Corpus generated by `stressgen.js` (deterministic; same structure as the real proposal:
numbered sections, tables, code blocks, lists, quotes, figures).

```powershell
node stressgen.js stress --words 300000 --files 8 --tables 2000 --code 1600
.\bench.ps1 -OutDir .\stress
```

| Case | Input | Output `.docx` | Wall clock | Peak RSS | Paragraphs | Tables | Code blocks | List items | Words |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 file (largest) | 0.59 MB | 0.17 MB | 0.16 s | 37 MB | 2,190 | 180 | 135 | 675 | 63,073 |
| **8 files combined** | **4.74 MB** | **1.32 MB** | **0.82 s** | **287 MB** | **17,780** | **1,440** | **1,080** | **5,400** | **503,876** |
| 8 files ×3 | 14.2 MB | 3.93 MB | 2.43 s | 758 MB | 53,340 | 4,320 | 3,240 | 16,200 | 1,511,628 |
| 8 files ×4 | 18.9 MB | 5.24 MB | 2.41 s | 959 MB | 71,120 | 5,760 | 4,320 | 21,600 | 2,015,504 |
| 8 files ×8 | 37.9 MB | 10.46 MB | 4.64 s | 1,361 MB | 142,240 | 11,520 | 8,640 | 43,200 | 4,031,008 |

The 8-file 4.74 MB case is **more than twice the stated 2.0 MB / 300,000-word target** and
converts in **0.82 s**. Validating that output (independently, by re-reading the ZIP) reports
**43,512 paragraphs, 503,876 words, 1,440 tables, 1,080 code blocks, 1,440 repeating table
header rows, 14/14 XML parts parsed — RESULT: PASS**.

Largest input actually proved end to end: **37.9 MB of Markdown → a single 10.46 MB
`.docx` with 11,520 tables** (4.6 s, 1.36 GB peak RSS). Conversion cost is linear in input
size at roughly 120–250 ms per MB of Markdown.

Practical limits found:

* **Time**: not a constraint — even 100× the target size would be about a minute.
* **Memory**: the binding constraint. Peak RSS is roughly 50–60 MB per MB of Markdown
  (287 MB at 4.7 MB, 1.36 GB at 38 MB). Node's default heap handles ~30 MB of Markdown;
  beyond that raise it with `node --max-old-space-size=4096 convert.js ...`, or split into
  volumes (which is what the split manifest is for). The uncompressed `document.xml` is
  **never** held in memory — it is streamed into the ZIP through a deflate stream — so
  memory scales with the input text, not with the generated XML.
* **ZIP ceiling**: the writer is plain (non-zip64) ZIP, so the 4 GiB entry/archive limit
  applies. That is far beyond any plausible proposal, but the converter fails loudly rather
  than emitting a corrupt archive if it is ever hit.

### Two performance bugs found and fixed during this testing

1. **Stack overflow on large inputs.** `array.push(...bigArray)` builds an argument list,
   and JS argument lists are stack-bounded: with 14 MB of input the converter died with
   `RangeError: Maximum call stack size exceeded`. All five spread-push sites were rewritten
   as loops.
2. **Zero-byte `word/document.xml`.** `zlib` `end(callback)` fires before queued `data`
   events, so the ZIP local header was patched with a compressed size of 0 and the part came
   out empty. The flush-complete signal is the stream `'close'` event; the writer now
   collects the deflated output and writes it in one ordered pass after `'close'`.

---

## 10. Limitations

* **GitHub-flavoured Markdown only.** Supported: headings, paragraphs, emphasis, code spans,
  code fences, bulleted/ordered/task lists (3 levels), tables, block quotes, horizontal
  rules, links, autolinks, `[TOC]`, `[FIGURE: ...]`. **Not** supported: raw HTML blocks,
  images/`![]()`, footnotes, definition lists, math, nested block quotes, tables inside list
  items, `==highlight==`, reference-style links, and any YAML front matter (it is rendered as
  a paragraph or table, not consumed).
* Emphasis parsing is deliberately simple: `*`/`_` must be balanced and cannot be adjacent
  to another marker, and simple nesting uses whichever marker came first.
* Only one section (`sectPr`) is emitted, so page setup, header and footer are uniform; there
  is no per-volume cover art, no custom page numbering restart, and the TOC is a single
  field covering levels 1–3.
* The `[FIGURE: ...]` placeholders are **styled placeholders, not embedded images**. Real
  diagrams must be inserted by hand (or the Markdown must reference images, which this
  converter does not embed).
* `docProps/app.xml` page/word counts are estimates; Word recalculates them on open.
* The generated TOC shows placeholder text until Word updates the field. `w:updateFields` is
  set to `true` so Word offers to do this; in Word you can also press `Ctrl+A` then `F9`.
* **Word-openability was not verified on this machine** (see section 8). Evidence that the
  package is well formed: all 14 parts parse as XML, content types and relationships are
  mutually consistent, every `r:id` resolves, the structure follows Word's own conventions —
  minimal namespace declarations, correct content types, `w:updateFields`, repeating table
  headers, built-in heading style IDs. The XML is deliberately free of the one class of bug
  that most often makes Word report "the file appears to be corrupted": an earlier build
  declared `mc:Ignorable="mc"` while never declaring the `mc` namespace; that has been
  removed.
* `validate.ps1` uses `XmlDocument`, which does **not** validate against the OOXML XSD
  schema. It proves well-formedness, package consistency and content completeness, not schema
  conformance.
* `stressgen.js` produces deterministic synthetic text (drawn from a fixed word list). It is
  structurally representative of the real corpus, not linguistically representative, so it is
  a scale test rather than a fidelity test.

---

## 11. Files in this folder

| File | Purpose |
| --- | --- |
| `convert.js` | converter core (Node, no dependencies) — parser, OOXML writer, ZIP writer, ordered serialiser, section split, `--selftest` |
| `convert.ps1` | PowerShell front-end: locates Node, validates arguments, prints the report |
| `validate.ps1` | package/structure/content validator with table integrity and the coverage proof |
| `sdk-validate.ps1` | **Microsoft Open XML SDK 2.9.1 gate**: opens each `.docx` from an in-memory copy (`WordprocessingDocument.Open(MemoryStream, true)` — **never by path**) and reports the true (uncapped) `OpenXmlValidator` error count, with SHA-256 recorded before and after. Non-mutating (see 13.4) |
| `verify-package.ps1` | independent structural re-verification (content types, duplicate rel ids, `r:id` resolution, `tblGrid`/`tc` counts, style + `numId` resolution, exactly one trailing `sectPr`, illegal XML chars) |
| `wordcom-test.ps1` | Word COM open + PDF export acceptance test. **Guarded:** refuses any target outside `$env:TEMP` (hard block on the FYP tree, the section/i18n/research/integration folders and the protected deliverable names) and then operates only on a fresh temp copy, so it can no longer be aimed at a real document (see 8 and 13.4) |
| `tablecells.ps1` | reports each table's dimensions and the cell counts of every row (pipe-split evidence) |
| `verify-order.js` | **contiguous-order / reassembly verifier** (section 14): proves every source prose paragraph is one contiguous `w:p` whose text matches the source, in source order, with no merge and no split, plus per-row table and per-line code checks. Raw ZIP reader only — no SDK, no Word |
| `verify-order.fyp.json` | document↔source manifest for `verify-order.js` (the six deliverables) |
| `verify-order.fyp.report.json` | the machine-readable result of the last full order run |
| `stressgen.js` | deterministic synthetic corpus generator for scale testing |
| `bench.ps1` | timed, peak-memory benchmark harness (runs conversions as child processes) |
| `split-plan.example.json` | example combined + two-volume split manifest |
| `split-plan.fyp.json` | production manifest for `proposal/sections` (COMPLETE + two volumes) |
| `sample.md` | hand-written Markdown exercising every supported feature, including the pipe cases |
| `sample.docx` | that sample converted (SDK validation 0 errors, `verify-package.ps1` PASS) |
| `stress/` | generated stress corpus, its outputs, and the split volumes |
| `convert.js.bak-before-schema-fix` | pre-fix backup of `convert.js` (kept) |
| `convert.js.bak-before-fyp-production` | earlier backup of `convert.js` (kept) |
| `convert.js.bak-before-inlinecode-fix` | backup taken before the "emphasis delimiter inside a code span" fix (kept) |
| `convert.js.bak-before-softbreak-fix` | backup taken before the soft-line-break fix (kept) |
| `convert.js.bak-before-order-fix` | backup taken before the order/reassembly assertion work of section 14 (kept) |

---

## 12. Verified results for `sample.docx`

```
file size 11,508 bytes, 14 ZIP parts
XML PARSE: 14 of 14 xml/rels parts parsed with XmlDocument
CONTENT TYPES: 2 Default, 11 Override; all 14 parts declared
RELATIONSHIPS: 4 r:id references; all resolve
paragraphs 107 (71 body-level) | headings H2/H3/H4 = 5/9/1
tables 3 (12 rows, 3 repeating header rows) | code paragraphs 12 | list items 20
figures 2 | quotes 3 | rules 2 | hyperlinks 2 | page breaks 2
w:t nodes 141 | extracted characters 3,901 (3,237 without whitespace) | 662 words
source content lines checked 106 | found verbatim 106 (100.000%) -> COVERAGE PROOF
RESULT: PASS
```

Note on the counts: the document has 71 body-level paragraphs but the validator's
`paragraphs (all, incl. inside table cells)` figure is 107, because every table cell
contains its own `w:p`. Heading H1 shows 0 in the document while the source has one H1:
that first H1 is rendered with the `TitlePageTitle` style on the title page, not with
`Heading1`, and the validator accounts for this in its comparison.

The sample Markdown itself contains 3,446 non-whitespace characters; the document yields
3,237 counted that way, and the remaining difference is Markdown syntax characters (`#`,
`|`, `-`, `*`, backticks) which correctly do not appear in the rendered document. The
line-by-line coverage proof is the authoritative completeness check.

---

## 13. Schema-compliance fixes (OOXML validity)

An independent audit validated the generated packages with **Microsoft's own Open XML SDK
2.9.1** (`DocumentFormat.OpenXml.dll` from the Office installation) and found that
`WordprocessingDocument.Open()` **failed outright** on some outputs and that the three
production deliverables carried **10,776 / 587 / 10,195** validator errors. All of those are
now eliminated. This section records what was wrong and why, because each fix is
structural: none of them can silently come back.

### 13.1 FATAL: duplicate relationship Ids

**Symptom.** `word/_rels/document.xml.rels` declared the same `Id` twice, and Microsoft's
parser refused the package:

```
System.Xml.XmlException: 'rId11' ID conflicts with the ID of an existing relationship
                          for the specified source.
```

**Cause.** Two independent id schemes. Hyperlink ids were `rels.length + 10`, while
`headerRid`/`footerRid` were computed as `11 + rels.length` **before** the body was
streamed — so they were always `rId11` and `rId12`. A document with exactly **two distinct
hyperlinks** therefore emitted `rId11`/`rId12` twice. `sample.md` reproduces it
deterministically; the three production deliverables happened to contain zero hyperlink
relationships, which was luck, not correctness.

**Fix.** One monotonic allocator, `createRelIdAllocator()`, is now the ONLY source of
relationship ids in the package, used by hyperlinks, header, footer, and the reserved
`rId1..rId5` part relationships. On top of that, three assertions refuse to write a bad
package:

* `assertRelsUnique(part, xml)` — one `.rels` part, called for `_rels/.rels` and
  `word/_rels/document.xml.rels`;
* `assertPackageRelsUnique(parts)` — every `.rels` part, called before the ZIP closes;
* `assertContentTypesUnique(xml)` — duplicate `<Override PartName>` and
  `<Default Extension>` in `[Content_Types].xml`.

Each throws with the offending id and the reason, so a future edit fails loudly instead of
shipping an unopenable `.docx`. All are covered by `--selftest`.

### 13.2 Element order: `w:rPr`, `w:pPr`, `w:tblPr`, `w:tcPr`, `w:settings`

WordprocessingML enforces a strict child-element order; a child in the wrong place is a
schema violation, reported as *"The element has unexpected child element 'w:…'"*. The
emitter wrote some fragments ad hoc, which produced roughly one violation per code-block
line. The dominant instance:

```xml
<!-- WRONG (pre-fix): noProof before rFonts, sz after color -->
<w:rPr><w:noProof/><w:rFonts w:ascii="Consolas" …/><w:b/><w:sz w:val="17"/><w:color …/></w:rPr>
```

**Fix — structural, not one-off.** `WP_ORDER` declares the canonical child sequence for
each element the generator emits, and `normalizeOrderedElements()` re-orders the children of
every `w:rPr`/`w:pPr`/`w:tblPr`/`w:tcPr` fragment just before it is written. Every emission
in `emitBlocks()` goes through the `emitBatch()` wrapper rather than `ctx.emit` directly, so
a future ad-hoc string in the emitter is corrected automatically instead of reintroducing
the bug.

The sequences in `WP_ORDER` are **not** written from memory: they were read out of the SDK
assembly's property declaration order and then confirmed empirically with
`OpenXmlValidator`; `--selftest` asserts each table equals an embedded copy of that
sequence, so a wrong table fails locally rather than as thousands of SDK errors.

The individual cases the audit identified:

| Element | Wrong order (pre-fix) | Canonical |
| --- | --- | --- |
| `w:rPr` | `noProof` before `rFonts`; `sz` after `color` | `rFonts` … `noProof` … `color` … `sz` |
| `w:tblPr` | `tblLayout` before `tblBorders` | `tblBorders` … `tblLayout` … `tblCellMar` |
| `w:pPr` (SourceCode style) | `jc` before `shd` | `shd` … `spacing` … `ind` … `jc` |
| `w:settings` | `updateFields` before `characterSpacingControl` | `zoom`, `defaultTabStop`, `characterSpacingControl`, `updateFields`, `compat` |

### 13.3 What was deliberately NOT changed

* **`w:sectPr` child order.** `headerReference, footerReference, pgSz, pgMar, cols,
  docGrid` is **valid**; `headerReference` must precede `pgSz`. Reordering it would have
  been a regression (verified: 0 errors from `/word/document.xml` sectPr). `WP_ORDER.sectPr`
  is declared for completeness but the emitted order already conforms.
* **`w:trPr` `<w:tblHeader/>` / `<w:cantSplit/>`.** The SDK accepts this (a repeating
  schema choice); it was tested and is not a violation. Left alone.
* **Namespaces.** `document.xml` declares only `xmlns:w` and `xmlns:r` and has no
  `mc:Ignorable`. That is legal and sufficient; fewer declarations than Word emits is fine.

### 13.4 The SDK gate never writes to what it measures

> **WARNING — opening any `.docx` from this Office build via the Open XML SDK or Word COM
> can rewrite the file in place.** `WordprocessingDocument.Open(path, ReadOnly:=true)`
> followed by `Validate()` and `Dispose()` re-serialises the package on disk, and
> `Word.Documents.Open(path, ..., ReadOnly:=true)` can do the same. The content survives
> byte-for-byte, but the file's bytes do not — so the document is no longer the artefact
> whose hash was recorded. Therefore: **never validate a `.docx` by path — read the bytes
> into a `MemoryStream` and open the package from that stream — and always record the
> SHA-256 of every generated artefact before and after any validation step, re-verifying
> that the two hashes are identical.** This is not theoretical: it silently corrupted the
> user's `AY2627_FYP topics_v2_Victor Li.docx` (30,949 bytes / `1B847CF4…AAFB4E` became
> 30,882 bytes / `3F8632DE…54F755`), and the damage was only reversible because an
> untouched byte-identical copy happened to exist elsewhere on the machine.

Measured on this Office/SDK build: `WordprocessingDocument.Open(path, true)` followed by
`Validate(package)` and `Dispose()` **rewrites the `.docx` on disk** (same byte size,
different SHA-256) even though `ReadOnly` is true. Opening by path therefore mutates the very
artefact whose hash it was supposed to confirm.

`sdk-validate.ps1` consequently opens the package from a **`MemoryStream` copy**, never by
path, and records the SHA-256 before and after each document, reporting a warning (and a
non-zero exit) if they differ. Validation results are identical either way.

In the observed corruption of `AY2627_FYP topics_v2_Victor Li.docx`, exactly three parts
changed — `word/settings.xml`, `word/endnotes.xml` and `word/footnotes.xml` (attribute
order, `/>` becomes ` />`, and the XML declaration's encoding case) — while
`word/document.xml`, the document body, came back **byte-identical**. All 24 parts were
semantically equal XML. That is why the damage is invisible to a text comparison or to any
content check and only a hash comparison catches it.

### 13.5 Strict fenced-code-block recognition

A fenced block whose **content** contains a backtick sequence breaks any scanner that simply
toggles on every line beginning with ```` ``` ````: the block ends early and every later
fence's parity shifts. `sections/07-ai.md` exercises exactly this shape (a `doc-draft` Skill
example whose JSON payload embeds a ```` ``` ```` sequence).

The fence rule is now the CommonMark one, which makes mis-detection impossible rather than
unlikely: a fence line is indented by **at most 3 spaces** (4+ spaces is code content); an
**opening** fence may carry an info string; a **closing** fence must be **bare** and use the
same character and be at least as long as the opener. `--selftest` covers the embedded
```` ``` ````, the four-space-indented fence, the bare/longer/shorter-run cases, and asserts
the real `07-ai.md` fence count.

### 13.6 Measured results

| Document | SDK errors before | SDK errors after | Coverage before | Coverage after |
| --- | --- | --- | --- | --- |
| `sample.md` output | could not be opened (duplicate `rId11`) | **0** | n/a | n/a |
| `FYP-Proposal-COMPLETE.docx` | 10,776 | **0** | 99.967% | **99.967%** |
| `FYP-Proposal-Volume1-Plan.docx` | 587 | **0** | 99.930% | **99.930%** |
| `FYP-Proposal-Volume2-Technical.docx` | 10,195 | **0** | 99.988% | **99.988%** |

Reproduce:

```powershell
node convert.js --selftest                     # 136/136 assertions

# Microsoft's SDK: 0 errors expected on all four
.\sdk-validate.ps1 -Path ..\..\..\FYP-Proposal-COMPLETE.docx `
                   -Path ..\..\..\FYP-Proposal-Volume1-Plan.docx `
                   -Path ..\..\..\FYP-Proposal-Volume2-Technical.docx

.\verify-package.ps1 -Path ..\..\..\FYP-Proposal-COMPLETE.docx   # 9 checks PASS

# coverage proof (COMPLETE source is the ordered concatenation of the 8 sections)
.\validate.ps1 ..\..\..\FYP-Proposal-COMPLETE.docx -MarkdownPath <concatenation>.md

# order proof (section 14): 100% contiguous, 0 order violations, 0 merges
node verify-order.js --config verify-order.fyp.json
```

> **Known validator limitation (pre-existing, not a document defect).**
> `validate.ps1` reports `CHECK FAILED: H1 count mismatch` for the two *volume* documents
> because their only H1 is the synthesised title-page heading, which is rendered with the
> `TitlePageTitle` style rather than `Heading1`; the check subtracts `TitlePageTitle`
> paragraphs from the *markdown* count (0) and compares it with the document's `Heading1`
> count (0), so it fails on a document that is in fact correct. COMPLETE does not use
> `titlePage`, so it passes. This failure is present identically on the pre-fix volumes and
> is unrelated to the content delivered. Coverage is measured and reported before the check
> aborts, and does not regress.

### 13.7 `sample.docx`

`sample.docx` in this folder has been regenerated with the fixed converter: 12,509 bytes,
14 parts, **0 SDK validation errors**, `verify-package.ps1` PASS (9/9), relationships
`rId1..rId5` parts + `rId6` header + `rId7` footer + `rId8`/`rId9` hyperlinks — all unique.

## 14. Order and reassembly verification (`verify-order.js`)

### 14.1 Why the previous gates could not see an ordering defect

Every gate in the pipeline before this one is an **existence** test:

* `validate.ps1` proves *coverage* with `$docxFlat.IndexOf($needle)` — presence, not order.
  Text that is fully present but reassembled out of order still scores 99.65–99.99%.
* `sdk-validate.ps1` proves *schema* validity, which says nothing about prose.
* `verify-package.ps1` proves *package* integrity (parts, rels, grids).
* `--selftest` tested each inline emitter in **isolation**: `paragraphInlineXml(['a','b'])`
  was asserted to be `a b`, but nothing asserted that paragraph *n* of a document appears
  after paragraph *n−1*, that a paragraph was not merged with its neighbour, or that a table
  row's cells kept their column order.

That is a real hole: a converter that emitted each paragraph's fragments in the wrong order
would pass all four gates. `verify-order.js` closes it.

### 14.2 What it asserts

For every source paragraph the tool locates the paragraph in the generated document and
checks:

| # | Assertion | Failure it catches |
| --- | --- | --- |
| 1 | **CONTIGUOUS** – the text occurs as one contiguous run | fragments scattered across `w:p` elements |
| 2 | **EXACT** – that paragraph's canonical text equals the source's character for character | reordered fragments inside one paragraph |
| 3 | **BOUNDED** – the match neither starts nor ends mid-word | `…figure.Cisco Packet Tracer…` (a lost separator) |
| 4 | **ORDER** (greedy forward walk) – reading the document top to bottom matches source order | two paragraphs swapped, or a fragment spliced into an earlier paragraph |
| 5 | **NOT-MERGED** – no two source paragraphs map to one `w:p`, and none is split | paragraphs glued together |
| 6 | **TABLES** – one `w:tr` per source row, same cell texts in the same order | reordered/merged cells |
| 7 | **CODE** – fenced blocks in order, line for line | reordered code lines |

The order walk is a forward-only match over the document, which is exactly how a reader
consumes the page; a swap makes one paragraph unmatchable forward and is reported even when
that paragraph is *individually* perfect. The paragraph→document assignment it produces is
also what merge detection uses, so a sentence legitimately repeated in the source (the corpus
quotes the topic sheet twice) is never mistaken for a merge.

### 14.3 Reading a raw `.docx` safely

The tool reads `word/document.xml` with its **own ZIP reader + regex XML scan** (Node `zlib`
only). It never uses the Open XML SDK by path, never Word COM and never Word — reading a
`.docx` through those can rewrite the file. (This project has already had one document
corrupted that way.)

### 14.4 Usage

```powershell
# all six deliverables, using the checked-in manifest
node verify-order.js --config verify-order.fyp.json

# the same, plus a machine-readable report
node verify-order.js --config verify-order.fyp.json --json verify-order.fyp.report.json

# one document against an explicit source list
node verify-order.js --doc ..\..\..\FYP-Proposal-Volume2-Technical.docx `
                     --source ..\..\sections\03-microsoft.md `
                     --source ..\..\sections\04-linux.md --mode complete
```

`--mode complete` requires every source paragraph to be present exactly once (the COMPLETE
documents and each volume's own source subset). `--mode volume` allows a paragraph to be
absent (a split volume legitimately omits other sections) but still requires every *present*
paragraph to be contiguous, exact and in order. Exit code is 0 only when every document
passes.

`verify-order.fyp.json` in this folder holds the document↔source mapping for the six
deliverables, in manifest order.

### 14.5 Measured results on the delivered build

Run at 2026-09-17 against the six regenerated documents (the report is checked in beside the
tool as `verify-order.fyp.report.json`):

| Document | source prose paras | present | contiguous | pass rate | order violations | merged | glue |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FYP-Proposal-COMPLETE.docx | 2,031 | 2,031 | 2,031 | **100 %** | 0 | 0 | 0 |
| FYP-Proposal-Volume1-Plan.docx | 556 | 556 | 556 | **100 %** | 0 | 0 | 0 |
| FYP-Proposal-Volume2-Technical.docx | 1,475 | 1,475 | 1,475 | **100 %** | 0 | 0 | 0 |
| FYP-Proposal-COMPLETE-ZH.docx | 2,067 | 2,067 | 2,067 | **100 %** | 0 | 0 | 0 |
| FYP-Proposal-Volume1-Plan-ZH.docx | 592 | 592 | 592 | **100 %** | 0 | 0 | 0 |
| FYP-Proposal-Volume2-Technical-ZH.docx | 1,475 | 1,475 | 1,475 | **100 %** | 0 | 0 | 0 |

All 3,588 table rows and all 449 code blocks matched in the COMPLETE documents (1,979 rows /
14 blocks and 1,609 rows / 435 blocks in the volumes — exactly additive).

`strictFormDiffers` (31 / 15 / 16 / 30 / 13 / 17 out of 2,031 … 592 paragraphs) counts the
paragraphs whose text differs from the source by a **rendering** detail rather than by
content; the mean difference is one character and the maximum is four. Every one is a
backslash immediately adjacent to a code-span delimiter, where the writer consumes the
backslash that the Markdown source used to escape the delimiter — for example the source
`` `C:\FYP\logs\` `` is written as `C:\FYP\logs\`. The tool reports them rather than
absorbing them silently, and `largeStrictDiffs` (differences of more than 40 characters)
is **0** on all six.

### 14.6 Negative controls (proof the tool actually detects the defect class)

Four tampered copies of `Volume1-Plan.docx` were built by rewriting `word/document.xml`
inside the ZIP, with everything else untouched:

| Tamper | Result |
| --- | --- |
| **Swap two complete paragraphs** (every character still present, only the order wrong) | `exact=127/127`, `contiguous=100%`, **orderConsistent=false, order violations reported** → FAIL |
| Reverse the words of every long paragraph | 76 paragraphs unlocatable → FAIL |
| Swap the head halves of consecutive paragraphs | 92 unlocatable → FAIL |
| Delete one separator (`… . The …` → `…. The…`) in long paragraphs | 31 rendering differences + 5 unlocatable → FAIL |

The first row is the important one: it is invisible to a presence check, to the SDK and to
any per-paragraph emitter assertion, and the order walk is the only gate that fails it.

