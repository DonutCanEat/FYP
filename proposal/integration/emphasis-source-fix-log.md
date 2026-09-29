# Stray literal `*` in the seven generated `.docx` files — SOURCE-LEVEL fix log

**Task:** remove the 16 stray literal `*` characters measured in four published Word deliverables
by making a minimal, semantics-preserving change to **four Markdown source blocks**.
**Mode:** the Markdown source is the only thing changed. `convert.js` and every other tool were
**not** modified (verified byte-for-byte below).
**No `.docx` was ever opened by path** with the Open XML SDK, with Word COM, or with Word: every
document was read as a ZIP (`word/document.xml` only) or validated through a script that opens from
a `MemoryStream`.

Companion measurement report: `emphasis-defect-measurement.md` (same directory).

---

## 1. The four changed blocks — exact before / after

### Block 1 — `proposal\sections\02-architecture.md` line 184
**Technique: close the bold before the italic and reopen after** (the preferred form — both bold
and italic survive).

BEFORE
```markdown
**RSTP instead of STP.** The exact string `RSTP` does not occur in the standard; the legitimate hook is `Configure access, aggregation and core level switching` (Domain 3). The reference standard to cite by title is **IEEE 802.1w, *Rapid Reconfiguration of Spanning Tree***, subsequently folded into the IEEE 802.1D-2004 revision, so the edition actually consulted must be recorded rather than a clause number invented.
```
AFTER
```markdown
**RSTP instead of STP.** The exact string `RSTP` does not occur in the standard; the legitimate hook is `Configure access, aggregation and core level switching` (Domain 3). The reference standard to cite by title is **IEEE 802.1w**, *Rapid Reconfiguration of Spanning Tree*, subsequently folded into the IEEE 802.1D-2004 revision, so the edition actually consulted must be recorded rather than a clause number invented.
```
Localised diff: `**IEEE 802.1w, *Rapid Reconfiguration of Spanning Tree***,` →
`**IEEE 802.1w**, *Rapid Reconfiguration of Spanning Tree*,`
**Why:** the `***` delimiter run (italic closer adjacent to the bold closer) is what the converter
cannot resolve. Separating the two spans removes the adjacency.
**Strays:** 2 → **0**. Wording unchanged (the `*` pair becomes an italic run; the comma stays).

### Block 2 — `proposal\sections\02-architecture.md` line 578
**Technique: close the bold before the italic and reopen after** — applied to all four RFC citations
in the block.

BEFORE
```markdown
All addressing comes from the RFC 1918 private ranges or the RFC 5737 documentation ranges; nothing else is used. The applicable references, cited by title and number, are **RFC 1918, *Address Allocation for Private Internets*** and **RFC 5737, *IPv4 Address Blocks Reserved for Documentation***. Published service names end in `.example`, per **RFC 2606, *Reserved Top Level DNS Names***. The project is **IPv4-only**; IPv6 is out of scope, and **RFC 4193, *Unique Local IPv6 Unicast Addresses*** is referenced only to record that fact.
```
AFTER
```markdown
All addressing comes from the RFC 1918 private ranges or the RFC 5737 documentation ranges; nothing else is used. The applicable references, cited by title and number, are **RFC 1918**, *Address Allocation for Private Internets*, and **RFC 5737**, *IPv4 Address Blocks Reserved for Documentation*. Published service names end in `.example`, per **RFC 2606**, *Reserved Top Level DNS Names*. The project is **IPv4-only**; IPv6 is out of scope, and **RFC 4193**, *Unique Local IPv6 Unicast Addresses*, is referenced only to record that fact.
```
Four substitutions: `**RFC NNNN, *Title***` → `**RFC NNNN**, *Title*,`
**Punctuation added at the emphasis boundary only:** a comma after each italic title (before the
original ` and ` / `.` / ` is `). No number, RFC identifier or title word changed.
**Strays:** 8 → **0**.

### Block 3 — `proposal\sections\02-architecture.md` line 1012 (table row, last cell)
**Technique: close the bold before the italic and reopen after.**

BEFORE (last cell)
```markdown
**Bridge**: `Configure access, aggregation and core level switching`; **IEEE 802.1w, *Rapid Reconfiguration of Spanning Tree*** cited by title
```
AFTER (last cell)
```markdown
**Bridge**: `Configure access, aggregation and core level switching`; **IEEE 802.1w**, *Rapid Reconfiguration of Spanning Tree* cited by title
```
**Strays:** 2 → **0**. Nothing but the two delimiters moved; the cell still has 5 columns and the
row is still rectangular.

### Block 4 — `proposal\i18n\zh-HK\03-microsoft.md` line 2631
**Technique: close the bold before the italic and reopen after** (equivalent minimal change in the
same style, applied to the ZH `***A*B**` orientation).

BEFORE
```markdown
***其他位置*必須存在的防火牆規則 —— 容易遺忘的部分。**
```
AFTER
```markdown
**其他位置** *必須存在的防火牆規則 —— 容易遺忘的部分。*
```
**Why:** the `***` open run took `marker = '***'`, found no `***` closer, and emitted the run
literally; the following `*` then paired with the first `*` of the trailing `**`. Separating the
spans removes the run entirely.
**Strays:** 4 → **0**.

**Honest note on the ZH block (the one trade-off in this change).** The Chinese translation places
the italic span at the *start* of the bold span, so unlike the English block (whose `*elsewhere*`
sits *inside* the bold span and is therefore delimiter-separated) there is no mid-span text
available to keep both spans adjacent without a delimiter run. The close-and-reopen form therefore
adds **one space** at the emphasis boundary: the rendered line is
`其他位置 必須存在的防火牆規則 —— 容易遺忘的部分。` instead of the pre-fix
`其他位置必須存在的防火牆規則 —— 容易遺忘的部分。`. No word was added, removed or changed; the
emphasis roles are preserved exactly (bold on `其他位置`, italic on the rest, as in the source) and
the boundary space is explicitly sanctioned by the task's preferred technique. The alternative
(spaceless) spelling `**其他位置***必須存在的…*` was measured and also renders 0 strays, but it
silently changes *which* span is bold — it was rejected as semantically worse.

---

## 2. Chinese / English counterparts of the four blocks (all already clean — left alone)

Only the blocks that actually leaked were changed. Every counterpart was rendered first:

| English block | Chinese counterpart | its markup | strays |
|---|---|---|---|
| `02-architecture.md` L184 | `i18n\zh-HK\02-architecture.md` L184 | `**IEEE 802.1w《Rapid Reconfiguration of Spanning Tree》**` | **0** |
| `02-architecture.md` L578 | `i18n\zh-HK\02-architecture.md` L578 | `**RFC 1918《Address Allocation for Private Internets》**` (×4) | **0** |
| `02-architecture.md` L1012 | `i18n\zh-HK\02-architecture.md` L1012 | `**IEEE 802.1w《Rapid Reconfiguration of Spanning Tree》**` | **0** |
| `03-microsoft.md` L2735 `*elsewhere*` | `i18n\zh-HK\03-microsoft.md` L2631 | *(this is the file that was fixed)* | 4 → **0** |

The Chinese translation renders the titles with `《》` instead of a nested italic, so it never
produced the `***` adjacency, and the English `L2735` (`**The firewall rules that must exist
*elsewhere* — the part that is easy to forget.**`) puts the italic in the middle of the bold span
and renders with 0 strays. Neither needed an edit. **A markup-style difference between the two
languages is therefore present and intentional; no content diverges** — all six citation tokens
(`802.1w`, `802.1D-2004`, `RFC 1918`, `RFC 5737`, `RFC 2606`, `RFC 4193`) are present in both
languages' corresponding paragraphs.

---

## 3. The converter-level fix: attempted by a previous agent, measured to regress, ABANDONED

**Do not repeat it. `convert.js` must stay exactly as it is.**

The measurement agent tested two in-memory patches of `findEmphasisClose()` /
the emphasis-opener length fallback (see `emphasis-defect-measurement.md` §M6):

* **Variant A** — when a candidate delimiter run is longer than the marker, take the **last**
  `marker.length` characters of that run as the close. Result: the three English blocks render
  clean and `--selftest` stays 136/136 — **but the ZH block still leaks 4 strays.**
* **Variant B** — Variant A plus an opener fallback that tries successively shorter markers
  (`***` → `**` → `*`) when no closer of the full length exists. Result: all four blocks clean,
  `--selftest` 136/136 — **yet it was measured to regress other documents**, which is why it was
  reverted.

The file was restored to **byte-identical** state: `convert.js` and
`convert.js.bak-before-emphasis-adjacency-fix` both hash to
`33677F7819C1866B8F6D234F86951EAFE6798A3C8D9FF26F27789F2917D5D12A`. Both are unchanged in this
change (re-verified below). The reason the source-level fix is preferred is that the delimiter
adjacency is a property of four specific source blocks, whereas a change to the delimiter-resolution
law is corpus-wide and was demonstrated to move other documents' output.

Also note the **second, distinct code path** that fails on the same four blocks:
`stripInlineSyntax()` (the normaliser / coverage path, not the renderer) cannot invert nested
emphasis either — which is why a source-line coverage check reports those lines `NOT FOUND`.
Fixing the sources fixes both paths at once; patching the renderer fixes only the visible one.

---

## 4. Verification (all measured, nothing assumed)

### 4.1 Source-level render, through the real converter functions, in memory
`convert.js` was read as a string, its `main().catch(...)` entry point neutralised **in the string
only**, the module evaluated and `inlineToXml` / `paragraphInlineXml` called directly. Nothing was
written to the converter on disk.

| | stray `*` before | after |
|---|---|---|
| the four blocks | 2 + 8 + 2 + 4 = **16** | **0** |
| the whole 16-file source corpus (8 EN sections + 8 zh-HK sections) | **16** | **0** |
| new strays introduced anywhere | — | **none** |

### 4.2 Generated documents — strays, before → after

Method: raw ZIP read of `word/document.xml`; a `*` in a `w:t` counts as stray unless its run
carries `w:rStyle` ∈ {MonoChar, SourceCode, CodeChar, Coding, HTMLCode} or a Consolas `w:rFonts`,
or its paragraph carries `w:pStyle="SourceCode"`.

| document | stray before | **stray after** | in-code before | **in-code after** |
|---|---|---|---|---|
| `FYP-Proposal-COMPLETE.docx` | 12 | **0** | 1,462 | **1,462** |
| `FYP-Proposal-Volume1-Plan.docx` | 12 | **0** | 30 | **30** |
| `FYP-Proposal-Volume2-Technical.docx` | 0 | **0** | 1,432 | **1,432** |
| `FYP-Proposal-COMPLETE-ZH.docx` | 4 | **0** | 1,462 | **1,462** |
| `FYP-Proposal-Volume1-Plan-ZH.docx` | 0 | **0** | 30 | **30** |
| `FYP-Proposal-Volume2-Technical-ZH.docx` | 4 | **0** | 1,432 | **1,432** |
| `FYP-Outline-DRAFT.docx` | 0 | **0** | 7 | **7** |
| **corpus** | **16** | **0** | **5,855** | **5,855** |

The in-code counts are the legitimate globs / `-Filter *` asterisks and are **exactly unchanged**.

### 4.3 Rendered text of the four fixed blocks (from the regenerated `.docx`)

1. `FYP-Proposal-COMPLETE.docx` paragraph #1239 —
   `… The reference standard to cite by title is `**`IEEE 802.1w`**`, `*`Rapid Reconfiguration of
   Spanning Tree`*`, subsequently folded into the IEEE 802.1D-2004 revision, …`
   runs: `[bold]"IEEE 802.1w"` `[-]", "` `[italic]"Rapid Reconfiguration of Spanning Tree"`
2. `FYP-Proposal-COMPLETE.docx` paragraph #1918 —
   `… are `**`RFC 1918`**`, `*`Address Allocation for Private Internets`*`, and `**`RFC 5737`**`,
   `*`IPv4 Address Blocks Reserved for Documentation`*`. … per `**`RFC 2606`**`,
   `*`Reserved Top Level DNS Names`*`. … and `**`RFC 4193`**`,
   `*`Unique Local IPv6 Unicast Addresses`*`, is referenced only to record that fact.`
3. `FYP-Proposal-COMPLETE.docx` / `FYP-Proposal-Volume1-Plan.docx` RSTP coverage table cell —
   `**`Bridge`**`: Configure access, aggregation and core level switching; `**`IEEE 802.1w`**`,
   `*`Rapid Reconfiguration of Spanning Tree`*` cited by title`
4. `FYP-Proposal-Volume2-Technical-ZH.docx` paragraph #3000 —
   `**`其他位置`**` `*`必須存在的防火牆規則 —— 容易遺忘的部分。`*`

No `*` is visible in any of them, and bold and italic are both present.

### 4.4 Gates on the six regenerated documents

| document | size (bytes) | SHA-256 | SDK errors | verify-package | coverage (`validate.ps1`) | ragged |
|---|---|---|---|---|---|---|
| `FYP-Proposal-COMPLETE.docx` | 924,023 | `AB7D043BC51D2E4F25C40838371643FB30DE15E29CD0E1135E5D998229DDD6EC` | **0** | **9/9 PASS** | FAIL (1) — `horizontal rule count mismatch: markdown 60 vs document 52` *(known .md-generator frame separators)* | **0** |
| `FYP-Proposal-Volume1-Plan.docx` | 350,563 | `8448B3B7A3784C4F9E9445A0A293E4C38D07300D3BD331618D4CD5D506B1B1A2` | **0** | **9/9 PASS** | FAIL (2) — `H1 count mismatch … (minus 1 title-styled)` *(known false alarm)* + `horizontal rule count mismatch: markdown 7 vs document 4` *(3 frame separators of the temp volume concatenation)* | **0** |
| `FYP-Proposal-Volume2-Technical.docx` | 582,139 | `F887312B0B60ED6E254950E5EAEE1D8A2C5D41CBF2E17786D6ABACB20E1ACEB0` | **0** | **9/9 PASS** | FAIL (2) — same two known false failures (markdown 53 vs document 48) | **0** |
| `FYP-Proposal-COMPLETE-ZH.docx` | 1,036,570 | `48F557278AD78C49C2FD101569BE2E43D9CC80952C3664C7111D8B1C052623D9` | **0** | **9/9 PASS** | FAIL (1) — `horizontal rule count mismatch: markdown 60 vs document 52` *(known)* | **0** |
| `FYP-Proposal-Volume1-Plan-ZH.docx` | 384,608 | `CCF6BE9C744A157A5BC9186E19A418C72599C7330843D70D5A4D084A0B8AF166` | **0** | **9/9 PASS** | FAIL (2) — the same two known false failures | **0** |
| `FYP-Proposal-Volume2-Technical-ZH.docx` | 660,159 | `3F409536E4633C8F06BC796568E49A635708D4E07F3FCF8D6ADF1E765C7642D2` | **0** | **9/9 PASS** | FAIL (2) — the same two known false failures | **0** |

Every failure is one of the two pre-existing false failures (the `H1 count mismatch … (minus 1
title-styled)` on the volumes and the `horizontal rule count mismatch` caused by the `.md`
concatenation's frame separators). No new failure category appeared. All `H1..H4` / tables / table
rows / list items / figure counts in the `SOURCE MARKDOWN vs DOCX` blocks match exactly.

### 4.5 Additivity (from the generated files)

COMPLETE's heading / table / code / list counts equal VOL1's plus VOL2's, in both languages:

| metric | COMPLETE | VOL1+VOL2 | delta |
|---|---|---|---|
| H2 / H3 / H4 / H5 | 26 / 176 / 372 / 66 | 26 / 176 / 372 / 66 | **0** |
| tables | 312 | 312 | **0** |
| table rows | 3,588 | 3,588 | **0** |
| code-block paragraphs | 10,448 | 10,448 | **0** |
| list items (EN / ZH) | 656 / 655 | 656 / 655 | **0** |
| `w:p` | 28,144 / 28,142 | 28,154 / 28,152 | +10 (the two volumes' title pages: 5 paragraphs each; COMPLETE has none) |
| `w:t` | 44,493 / 44,558 | 44,501 / 44,566 | +8 (same title pages) |

The only non-zero deltas are fully explained by `TitlePageTitle`+`TitlePageSubtitle` paragraphs,
which exist in the two volumes and not in COMPLETE (`.md` → `.docx` only: 0/0 vs 1/2 and 1/2).

### 4.6 Previously-fixed language defects still absent

`IT NetworkSystems` = 0, `02.06.202613:34` = 0, `InsuranceAuthority` = 0, `DomainServices` = 0,
`WorldSkillsShanghai` = 0, `NetworkandSystem` = 0, `anythinTheVM` = 0 — measured in all six
regenerated documents. Correct forms present: `IT Network Systems`, `02.06.2026 13:34`,
`Insurance Authority`, `Domain Services`, `WorldSkills Shanghai`, `Network and System`.

### 4.7 Converter and tools byte-unchanged

`node convert.js --selftest` → `SELFTEST SUMMARY|{"total":136,"passed":136,"failed":0}` (exit 0).

All **25** files in `proposal\tools\md2docx\` hash identically to their pre-change values,
including `convert.js` = `33677F7819C1866B8F6D234F86951EAFE6798A3C8D9FF26F27789F2917D5D12A` and
`convert.js.bak-before-emphasis-adjacency-fix` = the same. `split-plan.fyp.json`,
`split-plan.fyp.zh.json`, `sdk-validate.ps1`, `verify-package.ps1`, `validate.ps1`, `tablecells.ps1`,
`verify-order.js` — all unchanged.

### 4.8 What was NOT regenerated

The converter was run for **all six** proposal documents (`--config split-plan.fyp.json` and
`--config split-plan.fyp.zh.json`), which is the safer choice given that the converter is **not
idempotent**. It was **not run** for `FYP-Outline-DRAFT.docx` (clean, source unchanged) — that file
is byte-identical to its pre-change state (`B2FD9F74…E135BBD`, 110,517 B, 2026-09-26 02:28:09), as
is `FYP-Outline-DRAFT.md`. `AY2627_FYP topics_v2_Victor Li.docx` and `image.png` were not touched.

Because regeneration is not idempotent, the two documents whose sources did **not** change
(`FYP-Proposal-Volume2-Technical.docx`, `FYP-Proposal-Volume1-Plan-ZH.docx`) do have new bytes after
this run — that is a property of the tool, not a content change: each still reports **0 strays**,
the same counts, and 9/9 + 0 SDK errors. "Untouched" for these two therefore means *no source edit
was involved*, not *identical bytes*.

### 4.9 The two `.md` concatenations

`FYP-Proposal-COMPLETE.md` and `FYP-Proposal-COMPLETE-ZH.md` were refreshed by applying **the same
four line-level substitutions** (they are a verbatim concatenation of the section files; the
generator script is not in the repository, so a surgical edit is the only way to guarantee nothing
else moves). Verified: every non-empty line of all sixteen source files is present verbatim in the
corresponding concatenation (0 missing), and the only changed lines are the four fixed ones.

`FYP-Proposal-COMPLETE.md` 1,974,693 B → `92E3664B88B06CA51831853DF8D4856BEECBFC90DB29091B18EBF3719CC62349`
`FYP-Proposal-COMPLETE-ZH.md` 1,880,703 B → `75B46A4136953F40A6196EF686E0CACBDAE165A1356498F33D83E467330232D2`

---

## 5. Summary for a future agent

* The defect was **delimiter adjacency (`***`) in four source blocks**, not bad prose.
* Two shapes occur: `**A *B***` (EN ×3, 12 strays) and `***A*B**` (ZH ×1, 4 strays).
* The fix is **close the bold before the italic and reopen after** in all four blocks. Both bold and
  italic are preserved; nothing but the emphasis boundary changed (one added space in the ZH block,
  four added boundary commas in the EN `RFC` block).
* **Do not patch `convert.js`.** The in-memory patch that fixed both shapes passed the 136/136
  selftest and was still measured to regress other documents; it was reverted to byte-identical
  state and must stay that way.
* After any future source edit, re-measure **strays**, not hashes: regeneration is not idempotent
  and byte comparison is meaningless across runs.

---

## 6. Post-fix review — `proposal\i18n\zh-HK\03-microsoft.md` **L1962** — determination: **NOT A DEFECT. The line is correct as written and was NOT changed.** (CLOSED — do not re-open)

A verifier reported that L1962 renders with **0 stray asterisks but "silently loses the bold"** on
`起始器側`, and warned that "0 strays" does not mean "no emphasis defects". The line was re-measured
against the English original. **The rendering matches the English intent exactly.**

### 6.1 The two markups, side by side

| | source markup (verbatim) |
|---|---|
| EN `proposal\sections\03-microsoft.md` **L2037** | `- **Option 1 (recommended).** The *initiator-side* IQN uses the baseline string, …` |
| ZH `proposal\i18n\zh-HK\03-microsoft.md` **L1962** | `- **選項 1（建議）。***起始器側* IQN 使用基準字串，…` |

Both express the **same** emphasis structure: **bold on the option label, italic-only on the phrase that
follows it**. The phrase after the label is *not* bold in English, so the Chinese is right to render it
italic-only. The English separates the two spans with an inter-word space; Chinese typography does not
use that space, so the Chinese spells the boundary as the delimiter run `***` (bold-close `**` +
italic-open `*`). That is a *localisation* difference in spacing, not an emphasis difference.

### 6.2 Rendered run sequence — in memory (real `inlineToXml`, converter read as a string, `main()` neutralised in the string only)

```
EN L2037   B "Option 1 (recommended)." | plain " The " | I "initiator-side" | plain " IQN uses … "
ZH L1962   B "選項 1（建議）。"        |                I "起始器側"        | plain " IQN 使用 … "      strays=0
```

### 6.3 Rendered run sequence — as delivered in `FYP-Proposal-Volume2-Technical-ZH.docx` (raw ZIP read, both files have this paragraph at **`w:p` #2286**)

```
ZH  B "選項 1（建議）。" | I "起始器側" | plain " IQN 使用基準字串，…" …
EN  B "Option 1 (recommended)." | plain " The " | I "initiator-side" | plain " IQN uses the baseline string, …" …
```

Identical emphasis structure, character for character apart from the space and the language. The
converter's scanner resolves the `***` run correctly here: at the label it takes `marker = '**'`, whose
`indexOf` close is the **first** two characters of the `***` run (the true bold closer); scanning resumes
on the third `*`, which opens the italic span closed by the `*` after `起始器側`. **Nothing is lost.**

### 6.4 Why the report's wording was misleading, and why a "fix" would have been a regression

"Loses the bold on `起始器側`" presupposes that `起始器側` was meant to be bold. It was not — the English
is `*initiator-side*`, italic-only. The observed output (bold label, italic phrase, plain remainder) *is*
the correct output. Two candidate "fixes" were rendered in memory to prove neither is an improvement:

| variant | markup | render | verdict |
|---|---|---|---|
| as-is | `**…（建議）。***起始器側*` | `B(label) I(起始器側) plain` | **correct — matches EN** |
| close-and-reopen | `**…（建議）。** *起始器側*` | `B(label) plain(" ") I(起始器側) plain` | same emphasis **plus a spurious visible space** the English has but Chinese must not |
| bold+italic | `**…（建議）。** ***起始器側***` | `B(label) plain(" ") B+I(起始器側) plain` | **contradicts** the English, which is italic-only |

All three render with **0 strays**, so "0 strays" cannot discriminate between them — the tie-break is the
English intent, and only the as-is form matches it. **No edit was made; the file is byte-unchanged**
(`zh-HK\03-microsoft.md` SHA-256 `BBAD4FBE1EE2C881367CC0E4CC4F23B861C8B2E3FB73E225B8DCE41251A476EA`,
mtime 2026-09-26 03:01:36 — the post-fix state from §1).

### 6.5 The whole `***`-adjacency family was re-checked (not just the reported line)

Every prose `***` adjacency in the 16-file corpus was enumerated and rendered in memory. The English
corpus has **none** (its `***` occurrences are all Ansible/banner text inside fenced code). The Chinese
corpus has **six**, all measuring **0 strays** and all preserving their intended emphasis:

| # | source | markup shape | render | verdict |
|---|---|---|---|---|
| 1 | `zh-HK\03-microsoft.md` L1962 | `**A。***B*` | `B(label) + I(B)` | matches EN L2037 — **the reported line; correct** |
| 2 | `zh-HK\03-microsoft.md` L2979 | `*"…"***B**` | `I(quote) + B(B)` | matches EN L3098 — correct (explicitly out of scope; untouched) |
| 3 | `zh-HK\02-architecture.md` L919 | `**A。****B。**` | one merged `B("A。B。")` | EN L919 merges the same way (its separating space is absorbed by the converter's whitespace-run merge, by design); character coverage identical — correct |
| 4 | `zh-HK\05-cisco.md` L1204 | `**A。****B**` | one merged `B("A。B")` | EN L1204 renders the same single bold run — correct |
| 5 | `zh-HK\05-cisco.md` L2365 | `*「…」***B**` | `I(quote) + B(B)` | matches EN L2365 — correct |
| 6 | `zh-HK\05-cisco.md` L2367 | `**A：****B**` | one merged `B("A：B")` | EN L2367 keeps two bold runs only because of its space; emphasis roles identical — correct |

Cases 3, 4 and 6 merge two adjacent bold spans into one run **because the Chinese has no text between
them**; the bold covers exactly the same characters either way, so the merge is not visible. **No other
member of the family is defective, and none was touched.**

### 6.6 Stray census and gates (nothing was regenerated — see 6.7)

In-memory re-render of all 16 source files through the real `paragraphInlineXml`: **stray `*` = 0**
(264 asterisks correctly confined to code runs; the first naive per-line pass produced 66 EN false
positives purely because it split soft-wrapped paragraphs — the paragraph-aware pass eliminates them,
exactly as §M3 of the measurement report warns).

Delivered `.docx`, raw ZIP read of `word/document.xml`, same code-run definition as §4.2:

| document | `w:p` | **stray `*`** | in-code `*` |
|---|---|---|---|
| `FYP-Proposal-COMPLETE-ZH.docx` | 28,142 | **0** | 1,462 |
| `FYP-Proposal-Volume1-Plan-ZH.docx` | 9,984 | **0** | 30 |
| `FYP-Proposal-Volume2-Technical-ZH.docx` | 18,168 | **0** | 1,432 |

Gates (all opened from a `MemoryStream`; no `.docx` was ever opened by path, with Word COM or with Word):

| document | SDK errors | verify-package | tablecells | SHA-256 before | SHA-256 after | mutated? |
|---|---|---|---|---|---|---|
| `FYP-Proposal-COMPLETE-ZH.docx` | **0** | **9/9 PASS** | ragged **0** (312 tables) | `48F55727…2623D9` | same | **no** |
| `FYP-Proposal-Volume1-Plan-ZH.docx` | **0** | **9/9 PASS** | ragged **0** (145 tables) | `CCF6BE9C…8AF166` | same | **no** |
| `FYP-Proposal-Volume2-Technical-ZH.docx` | **0** | **9/9 PASS** | ragged **0** (167 tables) | `3F409536…C7642D2` | same | **no** |

Re-measured in the three documents: `IT NetworkSystems` = 0, `02.06.202613:34` = 0,
`InsuranceAuthority` = 0, `DomainServices` = 0, `WorldSkillsShanghai` = 0, `NetworkandSystem` = 0,
`anythinTheVM` = 0; corrected forms `IT Network Systems`, `02.06.2026 13:34`, `Domain Services`,
`WorldSkills Shanghai`, `Network and System` all present where the source contains them. Two honest
notes: `02.06.2026 13:34` occurs only in `COMPLETE-ZH` (it lives in §1, which Volume 2 does not carry),
and `Insurance Authority` occurs in **no** Chinese document because the translation renders the body as
`保險業監管局` — that is a translation, not a defect.

`node convert.js --selftest` → `SELFTEST SUMMARY|{"total":136,"passed":136,"failed":0}` (exit 0).
All **39** files under `proposal\tools\md2docx\` (recursive, `stress\` included) hash identically before
and after every check above; `convert.js` =
`33677F7819C1866B8F6D234F86951EAFE6798A3C8D9FF26F27789F2917D5D12A`, still byte-identical to
`convert.js.bak-before-emphasis-adjacency-fix`.

### 6.7 Nothing was regenerated, and no recorded hash is stale

Because the source is correct, the task's regeneration step (which is conditional on a source change) was
**not** executed: `node convert.js` was not run for any document. The three Chinese deliverables are
therefore **byte-identical** to the versions recorded in §4.4 / `emphasis-fix-verification.md`
(1,036,570 / 384,608 / 660,159 B, hashes above, all mtime 2026-09-26 03:02:39). The English deliverables
and `FYP-Outline-DRAFT.docx` (`B2FD9F74…E135BBD`, 110,517 B, 02:28:09) were not touched.

**Therefore the hashes previously recorded in `emphasis-fix-verification.md` have NOT gone stale** — that
report needs no correction. (Had a regeneration been run, they would have.)

### 6.8 Answer for the next agent

`zh-HK\03-microsoft.md` L1962 is **correctly rendered and must not be edited**. The `***` adjacency there
is benign: the scanner resolves `**` first and leaves the trailing `*` to open the italic span. The
reported symptom ("italic-only on `起始器側`") is precisely what the English `*initiator-side*` intends.
The real, closed defect in this file was L2631 (§1 block 4), which was a *different* orientation
(`***A*B**`, open-side adjacency) and **did** leak. Check the orientation, not the asterisk count.
