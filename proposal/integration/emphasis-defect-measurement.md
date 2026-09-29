# Stray literal emphasis delimiters in the seven generated .docx files — measurement report

**Task:** quantify a rendering defect in which the Markdown→docx converter
`proposal\tools\md2docx\convert.js` leaves literal `*` characters in visible document text.
**Mode:** READ-ONLY measurement. No file was modified, moved, renamed or deleted. The only file
created is this report. Nothing was opened with the Open XML SDK, with Word COM, or with Word.

## 0. Method (what was read, and how)

* Each `.docx` was opened **as a ZIP** with `System.IO.Compression.ZipFile.OpenRead` (read-only) and
  only the `word/document.xml` entry was copied to `%TEMP%` scratch. The `.docx` files themselves were
  never rewritten (their sizes/mtimes are unchanged: 924,009 B / 17-09-2026 01:22:20 for
  `FYP-Proposal-COMPLETE.docx`, etc.).
* `word/document.xml` was parsed with a **normal XML parser** — .NET `System.Xml.XmlDocument`
  (`XmlDocument.Load`, namespace-agnostic `local-name()` XPath) — then analysed in Node.js v24.9.0.
* Every `w:p` was enumerated in document order (index 0-based, table cells and nested text-box
  paragraphs included) and every `w:t` was attributed to its **nearest ancestor** `w:p`, so no text
  node is counted twice.
* A `w:t` was treated as **code** when either
  * its run carries `w:rStyle` ∈ {`MonoChar`, `SourceCode`, `CodeChar`, `Coding`, `HTMLCode`}, **or**
    its `w:rFonts` names **Consolas** anywhere, **or**
  * its paragraph carries `w:pStyle` = `SourceCode` (i.e. it is a fenced-code paragraph).
  In these seven documents the only code carriers that actually occur are `w:rStyle="MonoChar"`
  (inline code spans) and `w:pStyle="SourceCode"` + Consolas (fenced code) — verified by dumping the
  origins of every in-code asterisk (section M4).
* **M1/M2/M4 count only `w:t` elements** — no `w:instrText`, no field codes, no headers/footers
  (this task scoped the walk to `word/document.xml`).
* Totals are also reported as an independent asterisk census (total `*` in all `w:t` = in-code + stray)
  so the code/stray split is auditable.

---

## M1 — Stray literal delimiters in VISIBLE TEXT

| document | `w:p` count | `w:t` count | paragraphs containing any `*` | **affected paragraphs** (stray in visible text) | **stray `*` characters** | **`w:t` elements containing them** | shape |
|---|---|---|---|---|---|---|---|
| `FYP-Proposal-COMPLETE.docx` | 28,144 | 44,481 | 253 | **3** | **12** | **12** | 12 × isolated single `*` (never adjacent to another `*`) |
| `FYP-Proposal-Volume1-Plan.docx` | 9,986 | 14,957 | 16 | **3** | **12** | **12** | same 3 paragraphs as COMPLETE |
| `FYP-Proposal-Volume2-Technical.docx` | 18,168 | 29,532 | 237 | **0** | **0** | **0** | — |
| `FYP-Proposal-COMPLETE-ZH.docx` | 28,142 | 44,558 | 251 | **1** | **4** | **2** | one `***` run + one isolated `*` |
| `FYP-Proposal-Volume1-Plan-ZH.docx` | 9,984 | 14,992 | 13 | **0** | **0** | **0** | — |
| `FYP-Proposal-Volume2-Technical-ZH.docx` | 18,168 | 29,574 | 238 | **1** | **4** | **2** | one `***` run + one isolated `*` |
| `FYP-Outline-DRAFT.docx` | 2,462 | 4,838 | 4 | **0** | **0** | **0** | — |

Independent asterisk census (all `w:t`), confirming the partition:

| document | total `*` in `w:t` | in code | **in visible text** |
|---|---|---|---|
| FYP-Proposal-COMPLETE | 1,474 | 1,462 | **12** |
| FYP-Proposal-Volume1-Plan | 42 | 30 | **12** |
| FYP-Proposal-Volume2-Technical | 1,432 | 1,432 | **0** |
| FYP-Proposal-COMPLETE-ZH | 1,466 | 1,462 | **4** |
| FYP-Proposal-Volume1-Plan-ZH | 30 | 30 | **0** |
| FYP-Proposal-Volume2-Technical-ZH | 1,436 | 1,432 | **4** |
| FYP-Outline-DRAFT | 7 | 7 | **0** |

**Singly or in pairs?** Every stray delimiter in the EN documents is a **single isolated `*`** — there
is not one `**` pair anywhere in visible text, in any of the seven files. In the two ZH documents the
four stray characters are one **`***` triple** (a bold-open `**` immediately adjacent to an italic-open
`*`) followed by one isolated `*`. So the leaking shape in this corpus is *not* `**bold *italic*.**`
leaking two asterisks; it is a **single `*`** per nested span.

---

## M2 — The affected text itself

Only **8 affected paragraphs exist across all seven documents** (max 3 in one document), so all of them
are listed rather than 25. Inline-code content is shown in `⟦…⟧` (it *is* present in the document; it is
displayed so the surrounding sentence reads correctly). "Stray sequence" = the exact text carried by the
`w:t` elements that hold the stray `*`. Paragraph indices are document-order `w:p` indices.

### `FYP-Proposal-COMPLETE.docx` — 3 paragraphs
1. **paragraph #1239** — `… The reference standard to cite by title is IEEE 802.1w, *Rapid Reconfiguration of Spanning Tree*, subsequently folded into the IEEE 802.1D-2004 revision …`
   * stray sequences: `"IEEE 802.1w, *Rapid Reconfiguration of Spanning Tree"` and `"*, subsequently folded into …"`
2. **paragraph #1918** — `… are RFC 1918, *Address Allocation for Private Internets* and RFC 5737, *IPv4 Address Blocks Reserved for Documentation*. Published service names end in ⟦.example⟧, per RFC 2606, *Reserved Top Level DNS Names*. … and RFC 4193, *Unique Local IPv6 Unicast Addresses* is referenced only to record that fact.`
   * stray sequences (8 singles): `"…*Address Allocation for Private Internets"`, `"* and "`, `"…*IPv4 Address Blocks Reserved for Documentation"`, `"*. Published service names end in "`, `"…*Reserved Top Level DNS Names"`, `"*. The project is "`, `"…*Unique Local IPv6 Unicast Addresses"`, `"* is referenced only to record that fact."`
3. **paragraph #2754** — `Bridge: ⟦Configure access, aggregation and core level switching⟧; IEEE 802.1w, *Rapid Reconfiguration of Spanning Tree* cited by title`
   * stray sequences: `"IEEE 802.1w, *Rapid Reconfiguration of Spanning Tree"`, `"* cited by title"`

### `FYP-Proposal-Volume1-Plan.docx` — 3 paragraphs (same three source paragraphs as COMPLETE)

4. **paragraph #1243** — identical text to #1239 above (the `IEEE 802.1w, *Rapid …*` sentence).
5. **paragraph #1922** — identical text to #1918 above (the `RFC 1918 … RFC 4193` sentence).
6. **paragraph #2758** — identical text to #2754 above (the RSTP coverage **table cell**).

### `FYP-Proposal-Volume2-Technical.docx` — none
### `FYP-Proposal-Volume1-Plan-ZH.docx` — none
### `FYP-Outline-DRAFT.docx` — none

### `FYP-Proposal-COMPLETE-ZH.docx` — 1 paragraph
7. **paragraph #5833** — the whole paragraph is affected: `***其他位置必須存在的防火牆規則 —— 容易遺忘的部分。*`
   * stray sequences: `"***其他位置"` (a `***` triple) and `"*"` (the trailing single)

### `FYP-Proposal-Volume2-Technical-ZH.docx` — 1 paragraph
8. **paragraph #3000** — identical text to #5833 above (same source line; Volume 2 ZH is where ZH
   `03-microsoft.md` lands, and COMPLETE-ZH contains the union of both volumes).

**Worst document:** `FYP-Proposal-COMPLETE.docx` and `FYP-Proposal-Volume1-Plan.docx` tie on absolute
count (3 paragraphs / 12 stray characters each) — but it is the *same* three source paragraphs, because
Volume 1 is a subset of COMPLETE. `FYP-Proposal-Volume2-Technical.docx`, `…Volume1-Plan-ZH.docx` and
`FYP-Outline-DRAFT.docx` are completely clean.

---

## M3 — Cross-check against the source

Sources were re-scanned **through the converter's own code** to avoid false positives: `convert.js` was
loaded into a Node process **in memory only** (the trailing `main().catch(…)` invocation was neutralised
in the in-memory string, never on disk) so that the real `paragraphInlineXml` / `inlineToXml` were used,
including the converter's soft-wrap line joining (a paragraph opens an emphasis span on one line and
closes it on the next; a naive per-line scan produces ~33 false positives in `01-introduction.md`,
which this faithful scan eliminates — verified).

**Result: exactly 4 source blocks in the entire corpus (16 stray characters) are genuine converter
failures** — and they are the *only* source of the strays measured in the docx files.

| # | source | source markup (verbatim) | rendered text | diagnosis |
|---|---|---|---|---|
| 1 | `proposal\sections\02-architecture.md` **L184** | `… the reference standard to cite by title is **IEEE 802.1w, *Rapid Reconfiguration of Spanning Tree***, subsequently folded …` | `… is IEEE 802.1w, *Rapid Reconfiguration of Spanning Tree*, subsequently folded …` | **CONVERTER FAILURE** — `**bold *italic***` (bold ending in an italic span, `***` adjacency at the close) |
| 2 | `proposal\sections\02-architecture.md` **L578** | `… are **RFC 1918, *Address Allocation for Private Internets*** and **RFC 5737, *IPv4 Address Blocks Reserved for Documentation***.` (4 such references in the paragraph) | `… are RFC 1918, *Address Allocation for Private Internets* and RFC 5737, *IPv4 Address Blocks Reserved for Documentation*.` | **CONVERTER FAILURE** — 4 × the same shape (8 stray `*`) |
| 3 | `proposal\sections\02-architecture.md` **L1012** (table row) | `… ; **IEEE 802.1w, *Rapid Reconfiguration of Spanning Tree*** cited by title \|` | `… ; IEEE 802.1w, *Rapid Reconfiguration of Spanning Tree* cited by title` | **CONVERTER FAILURE** — same shape inside a table cell |
| 4 | `proposal\i18n\zh-HK\03-microsoft.md` **L2631** | `***其他位置*必須存在的防火牆規則 —— 容易遺忘的部分。**` | `***其他位置必須存在的防火牆規則 —— 容易遺忘的部分。*` | **CONVERTER FAILURE** — `**` + `*` adjacency at the **open** (`***A*B**`); the italic pair is misplaced to the span start |

Samples 1–3 are in `02-architecture.md`, which is included in **Volume 1** and in **COMPLETE**; sample 4
is in ZH `03-microsoft.md`, which is included in **Volume 2 ZH** and in **COMPLETE ZH**. That accounts
exactly for every stray in every document (12 / 12 / 0 / 4 / 0 / 4 / 0).

**EN ⇄ ZH counterpart exhibit (why only the ZH file of the same section fails):**

| | source | render |
|---|---|---|
| EN `sections\03-microsoft.md` L2735 | `**The firewall rules that must exist *elsewhere* — the part that is easy to forget.**` | `The firewall rules that must exist elsewhere — the part that is easy to forget.` — **0 strays** |
| ZH `i18n\zh-HK\03-microsoft.md` L2631 | `***其他位置*必須存在的防火牆規則 —— 容易遺忘的部分。**` | `***其他位置必須存在的防火牆規則 —— 容易遺忘的部分。*` — **4 strays** |

The Italian italic `*elsewhere*` sits in the **middle** of the bold span in English and renders fine;
the Chinese translation moved the italic span to the **start** of the bold span, producing the `***`
delimiter run the parser cannot resolve. So the defect is triggered by *delimiter adjacency*, not by
prose wording.

**Cases that are NOT converter failures — classified LEGITIMATE: 2** (both in
`proposal\i18n\zh-HK\_translation-audit.md`, which is **not an input** to any of the seven documents —
see `split-plan.fyp.json` / `split-plan.fyp.zh.json`):

* L30 — `| `08-project-management.md` * | …` : a lone literal `*` in a table cell (an author's marker).
* L32 — `\* `08-project-management.md` was **present and complete-looking** …` : a **backslash-escaped**
  asterisk. The converter correctly consumes `\*` into a literal `*` (correct escape handling, not a defect).

In the eight EN and eight ZH input files there are **no** legitimate prose asterisks: no footnote `*`,
no multiplication `a * b`, no `*.exe` glob in prose, no wildcard in prose (globs appear only inside code,
section M4). Therefore **0 of the 16 measured strays are LEGITIMATE** — all 16 are converter failures.

**Second, distinct code path that fails on the same 4 blocks (normaliser / coverage metric).**
`stripInlineSyntax()` (convert.js L486-512, rules at L497, L498, L503) cannot invert nested emphasis and
leaves 6 literal asterisks on each of the four blocks (measured):
`**RFC 1918, *Address Allocation for Private Internets***` → `**RFC 1918, Address Allocation for Private Internets`.
This is the function whose regexes the outline-fix log quotes, and it is why a source-line coverage check
reports those lines `NOT FOUND` (the other agent's 100.000 % → 99.573 % figure). The **visible** defect in
the `.docx` is produced by the inline parser (M6), not by this normaliser; both were measured here.

---

## M4 — Code-block asterisks (excluded from M1 by construction)

Literal `*` characters **inside** code runs / fenced-code paragraphs. These are correct and untouched.

| document | in fenced-code paragraphs (`w:pStyle="SourceCode"`) | in inline code spans (`w:rStyle="MonoChar"`) | total |
|---|---|---|---|
| FYP-Proposal-COMPLETE | 1,330 (163 `w:t`) | 132 (112 `w:t`) | 1,462 |
| FYP-Proposal-Volume1-Plan | 1 | 29 (18 `w:t`) | 30 |
| FYP-Proposal-Volume2-Technical | 1,329 (162 `w:t`) | 103 (94 `w:t`) | 1,432 |
| FYP-Proposal-COMPLETE-ZH | 1,330 (163 `w:t`) | 132 (112 `w:t`) | 1,462 |
| FYP-Proposal-Volume1-Plan-ZH | 1 | 29 (18 `w:t`) | 30 |
| FYP-Proposal-Volume2-Technical-ZH | 1,329 (162 `w:t`) | 103 (94 `w:t`) | 1,432 |
| FYP-Outline-DRAFT | 0 | 7 (7 `w:t`) | 7 |

Representative in-code examples (all legitimate): `Get-ADUser -Filter * -SearchBase "CN=Users,…"`,
`Get-ADUser -Filter 'sAMAccountName -like "svc_*"'`, `# Fail the build if any svc_* account…`,
`/etc/nftables.conf (+ /etc/nftables.d/*.nft)`, and the inline spans `*.exe;*.vbs;*.mp3`, `*.key`,
`wg*.conf`, `VNET-*`, `svc_*`, `VP-BR-*`, `VP-MO-*`, `VP-WC-*`.

Note on the briefing: the large in-code counts are **wildcard/glob and `-Filter` asterisks**, not
PowerShell line continuations (PowerShell's continuation character is a backtick, not `*`). No
`*.exe`-style glob occurs in prose — only inside code spans — so no legitimate glob was ever at risk of
being counted as a stray.

---

## M5 — Impact assessment

**Cosmetic, not semantic — but plainly visible where it occurs.** The text is complete and correct
(nothing is lost, no word is corrupted, no number changes): the only damage is that a markup delimiter
is printed as a character. The reader sees, in the middle of an otherwise clean academic sentence:

> … the reference standard to cite by title is `IEEE 802.1w, \*Rapid Reconfiguration of Spanning
> Tree\*`, subsequently folded into the IEEE 802.1D-2004 revision …

That is four literal asterisks around a standard's title, plus the loss of the intended italic on the
title. It reads as unprocessed Markdown — the classic "we shipped the source" tell — which a marker will
notice even though it cannot change a mark for correctness. Meaning, scope, marks and citations are
unaffected.

Density:

| document | affected paragraphs / 1,000 paragraphs | stray `*` / total characters in all `w:t` | total characters in all `w:t` (code included) |
|---|---|---|---|
| FYP-Proposal-COMPLETE | **0.107** (3/28,144) | 12 / 1,853,264 → **0.00065 %** | 1,853,264 |
| FYP-Proposal-Volume1-Plan | **0.300** (3/9,986) — highest | 12 / 698,547 → **0.0017 %** | 698,547 |
| FYP-Proposal-Volume2-Technical | 0 | 0 | 1,155,138 |
| FYP-Proposal-COMPLETE-ZH | 0.036 (1/28,142) | 4 / 1,118,828 → 0.00036 % | 1,118,828 |
| FYP-Proposal-Volume1-Plan-ZH | 0 | 0 | 317,060 |
| FYP-Proposal-Volume2-Technical-ZH | 0.055 (1/18,168) | 4 / 802,076 → 0.0005 % | 802,076 |
| FYP-Outline-DRAFT | 0 | 0 | 175,516 |

(Denominator = every `w:p` element, including table-cell paragraphs, which dominate these documents.)

**Is any single document materially worse?** Not materially. By density, **Volume 1 (EN) is the worst**
(0.30 affected paragraphs per 1,000) because all three EN failures live in `02-architecture.md`, which
Volume 1 carries; `COMPLETE.docx` has the same three paragraphs diluted over 2.8× as many paragraphs.
The EN Volume 2, the ZH Volume 1 and the Outline are entirely clean. All 16 stray characters in the whole
corpus come from 4 source blocks in 2 files, and 12 of the 16 come from a single three-item list of RFC
title citations.

---

## M6 — Root cause confirmation and scope of a fix (nothing was implemented)

### Which rule fails

The visible text is produced by the inline scanner **`inlineToXml()`** (convert.js L1131-1273); its
emphasis branch is at L1224-1250 and the close search it uses is **`findEmphasisClose()`** (L1331-1343):

```js
      if (len <= 3 && !(codeSpans && codeSpans.has(i))) {
        const marker = ch.repeat(len);
        const close = findEmphasisClose(src, i + len, marker, codeSpans);   // L1232-1233
        ...
            i = close + len;                                                 // L1242
```

```js
function findEmphasisClose(src, from, marker, codeSpans) {                   // L1331
  let idx = src.indexOf(marker, from);                                       // L1332  <-- the failing rule
  while (idx > -1) {
    if (codeSpans && (codeSpans.has(idx) || codeSpans.has(idx + marker.length - 1))) {
      idx = src.indexOf(marker, idx + 1);
      continue;
    }
    const after = src[idx + marker.length];
    if (after === undefined || !/[0-9]/.test(after)) return idx;
    idx = src.indexOf(marker, idx + 1);
  }
  return -1;
}
```

Two distinct failures, both caused by **delimiter-run adjacency (`***`)**:

1. **`**A *B***` (the EN corpus shape; 12 of the 16 stray characters).** `findEmphasisClose(src, from,
   '**')` = `src.indexOf('**', from)` returns the **first** two characters of the `***` run — i.e. it
   matches the *italic closer* plus the first *bold closer*, so the bold span ends one character early.
   Consequences: (a) the italic **opener** `*` is left inside the bold span, where the recursive
   `inlineToXml(inner)` call can find no partner for it, so it is emitted literally; (b) the third `*` is
   re-scanned as a *new* italic opener whose candidate close is a later `*`; when that candidate's inner
   text starts or ends with whitespace the `!/^\s|\s$/.test(inner)` guard (L1236) refuses it, and the
   character is emitted literally as well. Result: exactly **two literal `*` per nested span**, and the
   title loses its italic. Verified on the real source lines: `**IEEE 802.1w, *Rapid Reconfiguration of
   Spanning Tree***,` → `IEEE 802.1w, *Rapid Reconfiguration of Spanning Tree*,`.

2. **`***A*B**` (the ZH corpus shape; 4 of the 16 stray characters).** The opener branch computes
   `len = 3` and therefore uses `marker = '***'` (bold-italic). There is no `***` closer, so
   `findEmphasisClose` returns -1 and the whole run is emitted as literal `***`; the scanner then reads
   the *next* `*` (after `其他位置`) as an italic opener and pairs it with the first `*` of the trailing
   `**`, stranding the last `*`. Result: `***其他位置…部分。*`.

**The briefed shape `**bold *italic*.**` is NOT broken in this converter.** It was tested with the real
function in three punctuation variants (`.`, `,`, plus mid-sentence and line-final positions) and renders
with **0 strays** (`bold italic.`), because the closing search finds the trailing `**` directly. The
trigger is the `***` run (italic delimiter adjacent to a bold delimiter), i.e. only the *second* shape
described in the brief, in the two orientations above.

### Could one targeted change fix both shapes without breaking the 136 selftest assertions?

Tested empirically, **in memory only** (the file on disk was never touched):

* Baseline `node convert.js --selftest` on the shipped converter: `SELFTEST SUMMARY|{"total":136,"passed":136,"failed":0}`.
* **Variant A — one edit inside `findEmphasisClose`:** when a candidate run is longer than the marker,
  take the **last** `marker.length` characters of that run as the close
  (`if (src[idx + marker.length] === marker[0]) { let e = idx; while (src[e] === marker[0]) e++; const shifted = e - marker.length; if (shifted > idx) idx = shifted; }`
  inserted before the existing `codeSpans`/digit checks).
  → all three EN blocks render **CLEAN** (the 12 EN stray characters disappear); the ZH block still
  shows 4 strays; `runSelfTest()` still reports **136/136 passed**.
* **Variant B — Variant A plus one matching edit at the opener:** try successively shorter markers for a
  run (`used = len; … while (close < 0 && used > 1) { used--; … }`, then use `used` in the slice, the
  `props` selection and `i = close + used`), so a `***` run can open as `**` (bold) when no `***` closer
  exists.
  → **all four failing blocks render CLEAN — 0 strays everywhere**, and `runSelfTest()` still reports
  **136/136 passed** (so the emphasis/code-span assertions the selftest covers, including the
  `*a \`b_c\` d*`, `**a \`b_c\` d**`, `_a \`b_c\` d_` and escaped-backtick cases, are unaffected).
* Caveat: inside the patched process, the selftest's **end-to-end sub-block spawns the real
  `convert.js`** as a child (`__filename`), so those few e2e assertions exercised the *unpatched* file;
  all other (~130) assertions ran against the patched in-memory functions.

**Answer:** yes — one *targeted* change (Variant B: two small edits, both inside the delimiter-resolution
logic, i.e. the `findEmphasisClose` close boundary plus the opener length fallback in the emphasis branch)
covers **both** shapes and leaves the 136 selftest assertions green. The minimally-sufficient edit for the
EN corpus alone is the single-character-boundary fix in `findEmphasisClose` (Variant A: 12 of the 16 stray
characters, 3 of the 4 blocks). Nothing was implemented.

### Regeneration

**Renderer-only defect; the Markdown sources are correct and need no rewriting.** The sources contain
valid nested emphasis (`**RFC 1918, *Address Allocation for Private Internets***`), so no source edit is
required — but the affected documents must be **regenerated** because the stray characters are already
baked into the `.docx` XML: `FYP-Proposal-COMPLETE.docx`, `FYP-Proposal-Volume1-Plan.docx`,
`FYP-Proposal-COMPLETE-ZH.docx`, `FYP-Proposal-Volume2-Technical-ZH.docx`
(`node convert.js --config split-plan.fyp.json` and `--config split-plan.fyp.zh.json` from
`proposal\tools\md2docx`). `FYP-Proposal-Volume2-Technical.docx`, `FYP-Proposal-Volume1-Plan-ZH.docx` and
`FYP-Outline-DRAFT.docx` contain **no** strays and would not change in this respect. Note the *second*
code path as well: even after the renderer is fixed, `stripInlineSyntax()` will still mis-normalise these
four blocks, so any digests or coverage numbers derived from it stay comparable only if the two paths are
aligned.

---

## Corrections to the briefed premise (measured, not assumed)

1. The shape `**bold *italic*.**` (italic closer followed by `.` `,` `;` `)` `]` `"`) **does not fail**
   in this converter — three punctuation variants tested, 0 strays. The real trigger is the `***`
   adjacency: `**A *B***` (EN, italic at the *end* of the bold span) and `***A*B**` (ZH, italic at the
   *start* of the bold span).
2. **No `**` pair leaks anywhere**; the leaked characters are single `*` (12+12 EN), plus one `***`
   run and one `*` in the ZH documents.
3. The corpus-wide footprint is **4 source blocks / 16 stray characters**, not 10 source lines. The
   "10 affected lines / 99.573 %" figures in `outline-fix-log.md` belong to the outline work; the
   current `FYP-Outline-DRAFT.md` and the freshly generated `FYP-Outline-DRAFT.docx` (md 02:28:06,
   docx 02:28:09) contain **0** strays by this measurement.
4. The regexes quoted in that log (`\*\*([^*]+)\*\*`, `(?<!\*)\*([^*]+)\*(?!\*)`) come from
   `stripInlineSyntax()` — the normaliser/coverage path — not from the renderer. Both paths were measured
   separately here; only the renderer determines what a reader sees.

## What I could not determine

* How `FYP-Outline-DRAFT.docx` is built: it appears in no `split-plan*.json` entry, and I did not search
  for or run any other build command. Its rendering is nevertheless consistent with the sources (7
  inline-code asterisks, 0 prose strays), and the outline `.md`/`.docx` mtimes are 3 s apart. Note that
  another agent was editing the outline during this session (`FYP-Outline-DRAFT.md` 26-09-2026 02:28:06,
  `.docx` 02:28:09, with a backup under `proposal\integration\backup-outline-audit-fix\`), so the outline
  figures here are a snapshot of the 02:28 version — the version that was current when the seven files
  were measured.
* Per-document coverage percentages from `tools\md2docx\validate.ps1` were not recomputed (it is a
  writing/publishing toolchain and out of scope for a read-only task); strays were measured directly from
  `word/document.xml` instead.
* Only `word/document.xml` was inspected. Headers, footers, footnotes, comments and the numbering part
  were not walked, per the task's definition of the walk. (In this converter headers/footers carry
  generated text only.)
* No visual/Word-rendering check was performed (deliberately: no Word, no Open XML SDK by path), so
  font/kerning-level appearance of the stray characters is inferred from the XML, not observed.
