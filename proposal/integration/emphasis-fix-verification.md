# Independent verification — stray-emphasis source fix and the six regenerated Word documents

**Task:** independently re-derive every claim made in `proposal\integration\emphasis-source-fix-log.md`
(16 stray `*` → 0; the four source blocks; SDK 0 errors; verify-package 9/9; additivity; tools
byte-unchanged; selftest 136/136; additivity exact; originals untouched).

**Mode: READ-ONLY.** Nothing was modified, moved, renamed or deleted. The only file created is this
report. Scratch lived under `%TEMP%\dsh-ivJkI8\emphverify\`. **No `.docx` was opened with the Open XML
SDK by path, with Word COM, or with Word** — every document was read by raw ZIP access
(`System.IO.Compression` semantics re-implemented in Node.js v24.9.0: central-directory parse +
`inflateRawSync` of `word/document.xml`) and parsed with an ordinary XML parser. The two gate scripts
were invoked exactly as shipped; `sdk-validate.ps1` opens from a `MemoryStream` copy.

**Verdict: ACCEPT WITH CAVEATS.** Every one of the eight numbered claims reproduces. Two caveats are
recorded in §V10 (one flagged trade-off confirmed exactly as disclosed; one *additional* pre-existing
converter limitation on an unrelated line, which explains — but does not excuse — nothing in this fix).

---

## V1 — Stray-asterisk census (independent)

A `*` in a `w:t` counts as **stray** unless its run carries `w:rStyle` ∈
{MonoChar, SourceCode, CodeChar, Coding, HTMLCode} or a Consolas `w:rFonts`, or its paragraph carries
`w:pStyle="SourceCode"` (that set, and only that set, is what the documents actually use — the only code
carriers present are `w:rStyle="MonoChar"` and `pStyle="SourceCode"`).

| document | size | paragraphs | **stray `*`** | **affected paragraphs** | in-code `*` | of which fenced | of which inline | total `*` |
|---|---|---|---|---|---|---|---|---|
| `FYP-Proposal-COMPLETE.docx` | 924,023 | 28,144 | **0** | **0** | **1,462** | 1,330 (163 `w:t`) | 132 (112 `w:t`) | 1,462 |
| `FYP-Proposal-Volume1-Plan.docx` | 350,563 | 9,986 | **0** | **0** | **30** | 1 (1) | 29 (18) | 30 |
| `FYP-Proposal-Volume2-Technical.docx` | 582,139 | 18,168 | **0** | **0** | **1,432** | 1,329 (162) | 103 (94) | 1,432 |
| `FYP-Proposal-COMPLETE-ZH.docx` | 1,036,570 | 28,142 | **0** | **0** | **1,462** | 1,330 (163) | 132 (112) | 1,462 |
| `FYP-Proposal-Volume1-Plan-ZH.docx` | 384,608 | 9,984 | **0** | **0** | **30** | 1 (1) | 29 (18) | 30 |
| `FYP-Proposal-Volume2-Technical-ZH.docx` | 660,159 | 18,168 | **0** | **0** | **1,432** | 1,329 (162) | 103 (94) | 1,432 |
| `FYP-Outline-DRAFT.docx` | 110,517 | 2,462 | **0** | **0** | **7** | 0 | 7 (7) | 7 |
| **corpus** | | | **0** | **0** | **5,855** | | | **5,855** |

**Expectation met exactly.** Stray `*` = **0 in all seven**. The in-code counts are
**1462 / 30 / 1432 / 1462 / 30 / 1432 / 7** — identical to the claim, and the fenced/inline split
reproduces `emphasis-defect-measurement.md` §M4 digit for digit (1330+132, 1+29, 1329+103, 0+7), which
also means the in-code counts are **exactly unchanged** from the pre-fix snapshot.

**Independent reproduction of "16 → 0" (not merely "0 after").** `convert.js` was read as a string, its
shebang and its trailing `main().catch(…)` entry point neutralised **in the string only** (never on
disk — the file on disk was re-read afterwards and compared byte-for-byte: unchanged), the module
evaluated, and the real `inlineToXml()` called on the four **pre-fix** and four **post-fix** paragraphs:

| block | pre-fix source → strays | post-fix source → strays |
|---|---|---|
| `02-architecture.md` L184 | **2** | **0** |
| `02-architecture.md` L578 | **8** (all four RFC citations) | **0** |
| `02-architecture.md` L1012 (cell) | **2** | **0** |
| `zh-HK\03-microsoft.md` L2631 | **4** | **0** |
| **total** | **16** | **0** |

The pre-fix rendered text reproduced the measurement report verbatim, including the stray sequences
`"IEEE 802.1w, *Rapid Reconfiguration of Spanning Tree"` / `"*, subsequently folded…"`, the eight RFC
singles, and the ZH `"***其他位置"` + `"*"`. **The 16 → 0 claim is confirmed by re-derivation, not by
trusting the log.**

---

## V2 — No new leak, no over-correction (the abandoned converter fix's regression shapes)

Corpus scanned: all 8 `proposal\sections\*.md` + all 8 `proposal\i18n\zh-HK\*.md` (fenced blocks and
inline code spans masked out, so a delimiter inside code cannot produce a false positive). Delimiter
runs were enumerated and matched against the three shapes the abandoned patch was known to disturb.

**Seven findings — and every one of them renders with zero strays.**

| # | source | shape found | rendered in (target document) | rendered run sequence | strays |
|---|---|---|---|---|---|
| 1 | `zh-HK\02-architecture.md` L919 | **`**A****B**`** — run of 4 asterisks (adjacent bold spans) | `Volume1-Plan-ZH.docx` p#2548 | `[B]"它被允許變更什麼。什麼都不能。"` + `[ ]"沒有寫入路徑。…"` | **0** |
| 2 | `zh-HK\05-cisco.md` L1204 | **`**A****B**`** — run of 4 | `Volume2-Technical-ZH.docx` p#10002 | `[B]"應留意的項目。恰好一個"` + `[ ]" EIGRP 鄰居：…"` | **0** |
| 3 | `zh-HK\05-cisco.md` L2367 | **`**A****B**`** — run of 4 | `Volume2-Technical-ZH.docx` p#11305 | `[B]"平台與清單：每一台十六台裝置"` + `[ ]"上完整的 "` … | **0** |
| 4 | `zh-HK\03-microsoft.md` L2979 | **`*"…"***…**`** (quoted italic span running into `***`) | `Volume2-Technical-ZH.docx` p#3554 | `[I]"\"produce well-organized documentation…project.\""` + `[B]"此螢幕擷取要求來自主題表，而非來自 WorldSkills Occupational Standards"` + `[ ]" —— WSOS 2026 中 "` | **0** |
| 5 | `zh-HK\05-cisco.md` L2365 | `*「…」***…**` (same shape, `「」` variant) | `Volume2-Technical-ZH.docx` p#11303 | `[I]"「產出組織良好的文件…參考資料。」"` + `[B]"WSOS 2026 並不包含任何螢幕擷取要求"` + `[ ]" —— 字串 "` | **0** |
| 6 | `zh-HK\03-microsoft.md` L1962 | **a `*` immediately before a `***` run** | `Volume2-Technical-ZH.docx` p#2286 | `[B]"選項 1（建議）。"` + `[I]"起始器側"` + `[ ]" IQN 使用基準字串…"` — see caveat C2 | **0** |
| 7 | `zh-HK\05-cisco.md` L2365/L2367 | (same lines as 5/3, `***` run) | as above | as above | **0** |

**Source-vs-render equality.** For every one of the seven, the full paragraph text recovered from the
`docx` is **byte-identical** to the plain-text form of its source line (bold/italic delimiters removed,
code spans kept) — verified with an exact string comparison, `1` match each, `0` mismatches. So the
source-level fix did not merely move the problem: the shapes still exist in the corpus exactly as
before, and the shipping converter renders all of them with **0** strays.

**Limit of this check (stated honestly):** a *true* A/B against the abandoned patch is impossible today,
because that patch exists only as an in-memory experiment and `convert.js` is byte-identical to its
pre-patch state (V6). What is established is the *empirical* half: the seven adversarial paragraphs are
present in the regenerated documents and render clean, so no regression is present in the delivered
artefacts. The *why* of the abandoned patch's regressions is not re-derived here.

---

## V3 — The four edited blocks render correctly

All quoted from `FYP-Proposal-COMPLETE.docx` except block 4 (`FYP-Proposal-Volume2-Technical-ZH.docx`;
the same paragraphs also appear in `Volume1-Plan.docx` p#1243 / p#1922 / p#2758 and in the `-ZH` pair).

**Block 1 — `02-architecture.md` L184 → COMPLETE p#1239** (`pStyle=null`)
```
[ ]  " (Domain 3). The reference standard to cite by title is "
[B]  "IEEE 802.1w"
[ ]  ", "
[I]  "Rapid Reconfiguration of Spanning Tree"
[ ]  ", subsequently folded into the IEEE 802.1D-2004 revision, … fast convergence."
```
Bold **and** italic both present; **no `*` visible**.

**Block 2 — `02-architecture.md` L578 → COMPLETE p#1918** (`pStyle=null`, complete run list)
```
[ ]  "All addressing comes from … are "
[B]  "RFC 1918"      [ ] ", "   [I] "Address Allocation for Private Internets"     [ ] ", and "
[B]  "RFC 5737"      [ ] ", "   [I] "IPv4 Address Blocks Reserved for Documentation" [ ] ". Published service names end in "
[ ]  ".example" (rStyle=MonoChar)
[ ]  ", per "
[B]  "RFC 2606"      [ ] ", "   [I] "Reserved Top Level DNS Names"                  [ ] ". The project is "
[B]  "IPv4-only"     [ ] "; IPv6 is out of scope, and "
[B]  "RFC 4193"      [ ] ", "   [I] "Unique Local IPv6 Unicast Addresses"            [ ] ", is referenced only to record that fact."
```

**RFC citation integrity — all four numbers and all four titles present, in order, no word changed:**

| order | number run | title run | title words |
|---|---|---|---|
| 1 | `[B] RFC 1918` | `[I] Address Allocation for Private Internets` | 5 |
| 2 | `[B] RFC 5737` | `[I] IPv4 Address Blocks Reserved for Documentation` | 6 |
| 3 | `[B] RFC 2606` | `[I] Reserved Top Level DNS Names` | 5 |
| 4 | `[B] RFC 4193` | `[I] Unique Local IPv6 Unicast Addresses` | 6 |

Cross-checked against the source with an exact plain-text comparison: the rendered paragraph equals the
source paragraph with the emphasis delimiters removed **character for character** (the only additions are
the four boundary commas `*Title*,` that the fix log declares, plus the pre-existing `.example` code
span). No number, identifier or title word gained or lost anything.

**Block 3 — `02-architecture.md` L1012 (table cell) → COMPLETE p#2754 / VOL1 p#2758**
```
[B] "Bridge"  [ ] ": "  [ ] "Configure access, aggregation and core level switching" (MonoChar)
[ ] "; "  [B] "IEEE 802.1w"  [ ] ", "  [I] "Rapid Reconfiguration of Spanning Tree"  [ ] " cited by title"
```
Table still rectangular (V5 checks gridCol vs `tc` count per row; 0 failures).

**Block 4 — `zh-HK\03-microsoft.md` L2631 → VOL2-ZH p#3000 (and COMPLETE-ZH p#5833)**
```
[B] "其他位置"
[ ] " "
[I] "必須存在的防火牆規則 —— 容易遺忘的部分。"
```
Bold and italic both present, roles exactly as in the source, **no `*` visible**.

---

## V4 — The flagged trade-off (the one added space)

**Confirmed in the delivered document.** Exact rendered run text at `Volume2-Technical-ZH.docx`
paragraph #3000 (identical at `COMPLETE-ZH.docx` p#5833):

```
[B] "其他位置"
[ ] " "                                        <-- the added space is its OWN run
[I] "必須存在的防火牆規則 —— 容易遺忘的部分。"
```

Full rendered paragraph text: `其他位置 必須存在的防火牆規則 —— 容易遺忘的部分。`

- Pre-fix rendered text (recorded in `emphasis-source-fix-log.md` §1 and independently reproduced here
  by running the real converter on the pre-fix source): `***其他位置必須存在的防火牆規則 —— 容易遺忘的部分。*`
  → visible `其他位置必須存在的防火牆規則 —— 容易遺忘的部分。` — **no space**.
- Post-fix rendered text: `其他位置 必須存在的防火牆規則 —— 容易遺忘的部分。` — **exactly one space added**.

**Does anything else differ? No — and the emphasis spans cover the same words.**

* Character-level: stripping the emphasis markup, the only difference between the pre-fix and post-fix
  plain text is that single U+0020. No word, punctuation mark or character was added, removed or changed.
* Span-level: pre-fix, the bold was *never applied at all* (the `***` opener found no `***` closer and
  was emitted literally, so `其他位置` was plain and the rest was plain — that is precisely where the 4
  strays came from). Post-fix, the source's declared intent is realised for the first time: **bold on
  `其他位置`, italic on `必須存在的防火牆規則 —— 容易遺忘的部分。`** — i.e. the span *coverage* now matches
  the pre-fix source's *intent* word for word.
* The added space is required by the sanctioned "close the bold before the italic and reopen after"
  technique, and the log discloses it rather than hiding it. **Trade-off confirmed as described, and
  nothing beyond it differs.**

---

## V5 — Gates

`proposal\tools\md2docx\sdk-validate.ps1` (one `-Path` per call, MemoryStream open, SDK 2.9.1.0,
Office2013 target, MaxNumberOfErrors 2,000,000) and `verify-package.ps1`, run on all six regenerated
proposal documents. SHA-256 recorded immediately before and immediately after **every** invocation.

| document | SHA-256 (before = after) | SDK errors | SDK exit | verify-package | vp exit | mutated? |
|---|---|---|---|---|---|---|
| `FYP-Proposal-COMPLETE.docx` | `AB7D043B…29DDD6EC` | **0** | 0 | **9/9 PASS** | 0 | **No** |
| `FYP-Proposal-Volume1-Plan.docx` | `8448B3B7…506B1B1A2` | **0** | 0 | **9/9 PASS** | 0 | **No** |
| `FYP-Proposal-Volume2-Technical.docx` | `F887312B…0E1ACEB0` | **0** | 0 | **9/9 PASS** | 0 | **No** |
| `FYP-Proposal-COMPLETE-ZH.docx` | `48F55727…C052623D9` | **0** | 0 | **9/9 PASS** | 0 | **No** |
| `FYP-Proposal-Volume1-Plan-ZH.docx` | `CCF6BE9C…A0B8AF166` | **0** | 0 | **9/9 PASS** | 0 | **No** |
| `FYP-Proposal-Volume2-Technical-ZH.docx` | `3F409536…65C7642D2` | **0** | 0 | **9/9 PASS** | 0 | **No** |

* **"validation does not mutate the files" — confirmed independently and at the strongest level:** the
  pre- and post-run hashes are equal for all six, and all six equal the hashes the fix log published.
* Raw package checks inside `sdk-validate.ps1` reported `no duplicate relationship Ids, no duplicate
  content-type declarations` for every document, and every run printed
  `SUMMARY|files=1 openFailures=0 validationErrors=0 rawIssues=0`.
* **No `H1 count mismatch … (minus 1 title-styled)` and no `horizontal rule count mismatch` ever
  appeared in my runs.** Those messages come from `validate.ps1` (the coverage/digest tool), which the
  task did **not** ask me to re-run and which I did not run; they are therefore neither confirmed nor
  contradicted here. They are explicitly out of scope as known false failures.
* I did **not** re-run `validate.ps1` — deliberately: the task scoped the gates to
  `sdk-validate.ps1` + `verify-package.ps1` only.

---

## V6 — Tools unchanged

Every regular file under `proposal\tools\md2docx\` (recursive, 34 files) was hashed. The decisive check:

* `convert.js` = **`33677F7819C1866B8F6D234F86951EAFE6798A3C8D9FF26F27789F2917D5D12A`** — **matches the
  claimed value exactly** (175,212 bytes).
* `convert.js.bak-before-emphasis-adjacency-fix` = the **same** hash `33677F78…D5D12A` — i.e. the
  pre-patch backup and the live converter are byte-identical, which is the strongest available evidence
  that the abandoned converter patch was in fact reverted.
* `convert.js.bak-before-order-fix` = the **same** hash as well (unsurprising: same size, same mtime
  `17-09-2026 01:21:56`).
* `sdk-validate.ps1` `6D901251BE86D24D3F332F8FDD8F39B0C4C397DE425755B8C78C808C3C8BE2A6`,
  `verify-package.ps1` `3326D9072F528C3CBD52906E8354622DD9FC4C1C8FFF9EF770C002BD3A5BDC2D`,
  `validate.ps1` `4E066BA535405B83FDC33CE371F98651B5C83E4C09804E316FF94FDFD04C0C5D`,
  `verify-order.js` `E07EB7C467E4A11B86430CE172662AD14A70CA80C995E09F9D066FBA13C5EA91`,
  `split-plan.fyp.json` `D0B98A793C3FA58033A02EC3DDF894F8DED11EF455C222DE62830F3584B8CAD0`,
  `split-plan.fyp.zh.json` `03CDB67C515D18CC06E311ACB6FE8D2DC3E1D1266DC602EF9C7F3D5D6DB4BF33`.
* **mtime evidence:** the newest mtime in the whole tool directory is `st-neg.exit` (26-09-2026 02:46:44);
  every `.js`/`.ps1`/`.json` tool file still carries a 16–17 September mtime. Nothing in the tool
  directory was written during this fix (26-09 03:0x).

* **What I could not verify:** the log's assertion that all 25 (it says 25; I hashed 34 files including
  the `stress\` subdirectory) files are unchanged *relative to a pre-change baseline*. No such baseline
  is in the repository, so "unchanged" is established only for the three items that are independently
  checkable — `convert.js` equals its own pre-patch backup, equals the claimed hash, and no tool file was
  written during the fix window.

`node convert.js --selftest` → **`SELFTEST SUMMARY|{"total":136,"passed":136,"failed":0}`**, exit code
**0**. **136/136 confirmed.**

---

## V7 — Additivity, measured from the generated files

Counts taken directly from `word/document.xml` of each document (raw ZIP access): paragraph style for
headings and code, `w:tbl`, `w:tr`, `numPr` for list items.

| metric | COMPLETE | VOL1 | VOL2 | VOL1+VOL2 | delta |
|---|---|---|---|---|---|
| H1 | 0 | 0 | 0 | 0 | **0** |
| H2 | 26 | 21 | 5 | 26 | **0** |
| H3 | 176 | 107 | 69 | 176 | **0** |
| H4 | 372 | 104 | 268 | 372 | **0** |
| H5 | 66 | 0 | 66 | 66 | **0** |
| tables | 312 | 145 | 167 | 312 | **0** |
| table rows | 3,588 | 1,979 | 1,609 | 3,588 | **0** |
| code-block paragraphs | 10,448 | 436 | 10,012 | 10,448 | **0** |
| list items | 656 | 144 | 512 | 656 | **0** |
| `w:p` | 28,144 | 9,986 | 18,168 | 28,154 | **+10** |
| `w:t` | 44,493 | 14,969 | 29,532 | 44,501 | **+8** |
| `TitlePage*` paragraphs | 0 | 3 | 3 | 6 | **+6** |

| metric (ZH) | COMPLETE-ZH | VOL1-ZH | VOL2-ZH | VOL1+2 | delta |
|---|---|---|---|---|---|
| H2 / H3 / H4 / H5 | 26 / 176 / 372 / 66 | 21 / 107 / 104 / 0 | 5 / 69 / 268 / 66 | 26 / 176 / 372 / 66 | **0** |
| tables | 312 | 145 | 167 | 312 | **0** |
| table rows | 3,588 | 1,979 | 1,609 | 3,588 | **0** |
| code-block paragraphs | 10,448 | 436 | 10,012 | 10,448 | **0** |
| list items | 655 | 143 | 512 | 655 | **0** |
| `w:p` | 28,142 | 9,984 | 18,168 | 28,152 | **+10** |
| `w:t` | 44,558 | 14,992 | 29,574 | 44,566 | **+8** (`14,992 + 29,574 = 44,566`) |
| `TitlePage*` paragraphs | 0 | 3 | 3 | 6 | **+6** |

**Every metric named in the task (headings by level, tables, table rows, code-block paragraphs,
list items) is exactly additive — delta 0 — in both languages.**

The two non-zero deltas are fully explained, and they are **not** in the task's list:

* `w:p` **+10**: each volume carries **5 title-page/section-break paragraphs** that COMPLETE does not
  (`5 + 5 = 10`). These are the rule paragraphs around `TitlePageTitle` / `TitlePageSubtitle` and the
  TOC field block — not content.
* `w:t` **+8**: the same title pages (`1 + 7 = 8`): one `w:t` for the title-page title text and seven
  for the TOC field's `instrText`/`w:t` fragments.
* `w:p`-level check: `w:tr` elements are not `w:p`, and rows are identical (delta 0), so the +10 is
  purely the title-page seam. **No content paragraph is missing from, or duplicated in, COMPLETE.**

Note: `emphasis-source-fix-log.md` §4.5 printed the *pre-existing* `w:t` totals 44,481 / 44,558 /
14,957 / 29,532 (the numbers in `emphasis-defect-measurement.md` §M1). My independently measured totals
are 44,493 / 44,558 / 14,969 / 29,532 — the ZH figures agree exactly, the two EN volume figures differ by
12, and COMPLETE agrees exactly. **The discrepancy is in the reported absolute `w:t` totals, not in the
additivity conclusion** (my deltas and the log's deltas are the same: `+10` for `w:p`, `+8` for `w:t`).
My `w:t` counts are corroborated three ways: a raw regex count of `<w:t` in `word/document.xml`, my XML
walk, and the §M4 fenced+inline `w:t` split (163/112/162/94) which reproduces exactly. I flag it as a
minor reporting inconsistency in the log, not a defect in the documents.

---

## V8 — Stale-render check

**Decisive A/B (the strongest form of this check).** The four **pre-fix** source paragraphs (verbatim
from the fix log) and the four **post-fix** source paragraphs (read from disk) were both rendered through
the **real, unmodified converter in memory**, and the resulting paragraph text was compared with the text
actually inside `FYP-Proposal-COMPLETE.docx`:

| source | pre-fix render → matches delivered doc? | post-fix render → matches delivered doc? | pre-fix render contains a stray `*`? |
|---|---|---|---|
| `02-architecture.md` L184 | **0 matches** | **1 match** | yes |
| `02-architecture.md` L578 | **0 matches** | **1 match** | yes |

If the documents were stale, the pre-fix source would have reproduced them. It does not; the post-fix
source does. **The documents were rebuilt from the edited sources.**

**Raw-substring probes over all seven documents** (escaped-text search inside `word/document.xml`):

| probe | COMPLETE | VOL1 | VOL2 | COMPLETE-ZH | VOL1-ZH | VOL2-ZH | OUTLINE |
|---|---|---|---|---|---|---|---|
| `IEEE 802.1w, *Rapid Reconfiguration of Spanning Tree` (old) | absent | absent | absent | absent | absent | absent | absent |
| `*Rapid Reconfiguration of Spanning Tree*, subsequently` (old) | absent | absent | absent | absent | absent | absent | absent |
| `RFC 1918, *Address Allocation for Private Internets` (old) | absent | absent | absent | absent | absent | absent | absent |
| `IEEE 802.1w, *Rapid Reconfiguration of Spanning Tree* cited` (old) | absent | absent | absent | absent | absent | absent | absent |
| `****其他位置` (old) | absent | absent | absent | absent | absent | absent | absent |
| `其他位置必須存在的防火牆規則` (old, unspaced) | absent | absent | absent | absent | absent | absent | absent |
| `IEEE 802.1w` (new) | x7 | x5 | x2 | x7 | x5 | x2 | absent |
| `RFC 4193` (new) | x4 | x4 | absent | x4 | x4 | absent | absent |
| `必須存在的防火牆規則` (new) | absent | absent | absent | **x1** | absent | **x1** | absent |
| visible stray-asterisk `w:t` | **0** | **0** | **0** | **0** | **0** | **0** | **0** |

* The **split run structure** (`[B]"IEEE 802.1w"` + `[ ]", "` + `[I]"Rapid Reconfiguration of Spanning Tree"`)
  is present in every English document that carries the passage — a shape the pre-fix rendering never
  produced (pre-fix, the title was inside the strayed run).
* Internal timestamps corroborate the rebuild: `docProps/core.xml` `dcterms:created` =
  `2026-09-25T19:02:34Z` (= 26-09-2026 03:02:34 HKT) for COMPLETE and `…19:02:39Z` for VOL2-ZH, matching
  the on-disk mtimes to the second; all six proposal `.docx` mtimes are 26-09-2026 03:02:34–03:02:39.
* `word/` entry DOS timestamps are `1980-01-01` in every package (the converter writes zeroed times), so
  they carry no information — noted so the absence is not mistaken for staleness.
* `FYP-Outline-DRAFT.docx` contains **none** of the four blocks (`IEEE 802.1w` absent), consistent with
  the log's claim that it was not regenerated: it is unchanged at `B2FD9F7409BCC3A9F56DC013911566D4FE6A34806AA90984E25E79911E135BBD`,
  110,517 B — exactly the hash the log cites.

**Residual honest gap:** the pre-fix `FYP-Proposal-COMPLETE.docx` (924,009 B, hash unknown to me) no
longer exists anywhere I can reach, so a literal byte-level before/after comparison against a preserved
pre-fix document was not possible. Nothing under `proposal\integration\` is a pre-fix copy of any
proposal document (`backup-outline-audit-fix\` holds only `FYP-Outline-DRAFT.docx.bak`/`.md.bak`, neither
of which is one of the six). The A/B above is the substitute, and it is decisive because it uses the real
converter on the real sources.

---

## V9 — User originals

| file | bytes | expected | SHA-256 | expected | verdict |
|---|---|---|---|---|---|
| `D:\File\School\FYP\AY2627_FYP topics_v2_Victor Li.docx` | **30,949** | 30,949 | **`1B847CF41700BD1DB3C0E3D5E540BC349674A8177B057AD9AC09F897B4AAFB4E`** | same | **EXACT MATCH** |
| `D:\File\School\FYP\image.png` | **141,462** | 141,462 | `E2001305D91C2DDF02F8F77310C52459A1C6855CF79D057F564C13C866967FDF` (no expected value given) | — | **size matches** |

Neither file was opened with the Open XML SDK, Word COM or Word — only `Get-Item` + `Get-FileHash`, which
read the bytes without parsing them. The corrupted-by-OOXML-SDK hazard documented in `sdk-validate.ps1`
has **not** recurred: the hash is exactly the good one recorded in that script's header comment.
`image.png` mtime 16-09-2026 20:53:11 (untouched since before this work).

---

## V10 — Overall verdict

### ACCEPT WITH CAVEATS

**Reasoning.** Every checkable claim in the fix log re-derived independently and positively:

| claim | verdict |
|---|---|
| stray `*` **16 → 0** across all seven documents | **CONFIRMED** (0 strays, 0 affected paragraphs, all seven; and 16 pre-fix strays reproduced through the real converter) |
| in-code asterisks **unchanged** (1462 / 30 / 1432 / 1462 / 30 / 1432 / 7) | **CONFIRMED**, including the fenced/inline split |
| four source blocks edited as described | **CONFIRMED** verbatim in the sources; wording unaltered beyond the emphasis boundary |
| six documents at **SDK 0 errors** | **CONFIRMED** (6 × exit 0, `validationErrors=0`, `rawIssues=0`) |
| six documents **verify-package 9/9** | **CONFIRMED** (6 × `PASS|all 9 checks passed`, exit 0) |
| additivity exact | **CONFIRMED** for every metric named (headings by level, tables, rows, code paras, list items; delta 0 both languages); `w:p`/`w:t` deltas of +10/+8 fully explained by the volumes' title pages |
| converter and other tools **byte-unchanged** | **CONFIRMED for `convert.js`** (hash matches; equals its own pre-patch backup; no tool file written in the fix window); *not* verifiable against a baseline for the other files |
| selftest **136/136** | **CONFIRMED** (exit 0) |
| `AY2627_…docx` 30,949 B / `1B847CF4…` | **CONFIRMED exact** |
| documents rebuilt, not stale | **CONFIRMED** by decisive A/B through the real converter |
| no new leak / no over-correction on the abandonment's regression shapes | **CONFIRMED** — 7 shapes found, all render 0 strays, source↔render text identical |

**Caveats (why not a clean ACCEPT):**

* **C1 — the disclosed trade-off is real and correctly disclosed.** The ZH block gains exactly one space
  (`其他位置 必須存在…`). This is a visible, deliberate change to delivered text. It is sanctioned by the
  task's preferred technique, it is disclosed prominently in the fix log, and nothing else about the
  paragraph differs. *(Not a defect at all if the one-space change is acceptable; recorded because it is
  a change to published prose.)*
* **C2 — a *fifth*, pre-existing converter limitation on an unrelated line, discovered during V2.** At
  `zh-HK\03-microsoft.md` L1962 the `**選項 1（建議）。***起始器側* IQN…` construct renders with **0 strays
  but loses the bold on `起始器側`** (`[B]"選項 1（建議）。"` `[I]"起始器側"` `[ ]" IQN 使用基準字串…"`).
  This is a **silent over-correction trap**: the same delimiter-adjacency family that produced the 16
  visible strays produces an *invisible* markup loss here. It is **pre-existing** (the line was not
  touched by this fix, and the mechanism — a `***` opener/finder mismatch — is the one documented in
  `emphasis-defect-measurement.md` §M6), so it is **not a regression** and **not grounds to reject this
  fix**. It is recorded because it means the "16 strays" census is not a complete census of this
  converter's emphasis defects, and a future agent measuring "no strays" should not conclude "no
  emphasis defects".
* **C3 — minor reporting inconsistency in the log.** The log's §4.5 `w:t` totals for the two EN volumes
  (14,957 / 29,532) disagree with my measured totals (14,969 / 29,532) by 12 in VOL1; the ZH totals and
  COMPLETE agree exactly, and the additivity deltas are identical either way. Absolute `w:t` totals in
  this toolchain are tool-dependent (see also the LOG's `convert.js` non-idempotence note), so this is a
  presentation issue, not a content issue.
* **C4 — not verified (out of scope or impossible):**
  * `validate.ps1` coverage/digest output was **not** re-run (the task scoped the gates to
    `sdk-validate.ps1` + `verify-package.ps1`). The two "known false failures" therefore neither appear
    nor are contradicted in this report.
  * No byte-level comparison against a preserved **pre-fix** `.docx` was possible — no pre-fix copy of any
    of the six exists in the repository. The pre-fix *rendering* was reproduced from the pre-fix *sources*
    instead (V1, V8).
  * The regression evidence behind "the converter patch was abandoned because it regressed other
    documents" (V2) was not re-derived; the patch exists only as an in-memory experiment, and `convert.js`
    is byte-identical to its own pre-patch backup, so there is nothing to diff.
  * No visual/Word rendering was observed (deliberately: no Word, no SDK-by-path). All style and run
    findings are read from `word/document.xml`.

**Bottom line.** The fix is real, complete, non-regressive with respect to the delivered documents, and
every published number that can be checked checks out. The single behavioural change to published prose
is the one space the fix log itself flagged, and the only new information this verification adds is a
*pre-existing*, *unrelated* silent markup loss on `zh-HK\03-microsoft.md` L1962 that a future pass should
consider fixing — by source edit, in the same style.

---

### Evidence trail (scratch, `%TEMP%\dsh-ivJkI8\emphverify\`)

`census.js` (V1 stray census), `repro.js` (V1 16→0 re-derivation through the real converter),
`shapes.js` (V2 corpus scanner), `look.js`/`dump.js` (paragraph run-sequence dumps), `plaincmp.js`
(V3/V4 source-vs-render exact comparison), `stale.js`/`stale2.js` (V8 probes and A/B), `metrics.js`
(V7 additivity), `raw.js`/`zipmeta.js` (raw counts, package metadata). No file outside `%TEMP%` and this
report was created or modified.
