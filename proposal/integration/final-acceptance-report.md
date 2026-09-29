# Final Independent Acceptance Report — Victor2 FYP Proposal Deliverables

**Verifier role:** independent verification agent (adversarial by default). Every load-bearing
claim below was re-derived from the artefacts themselves; no producing agent's self-report was
trusted. Verifier-supplied evidence only.

**Date of run:** 2026-09-16 (same working session as delivery)
**Artefact root:** `D:\File\School\FYP\`
**Gates used (as written, unmodified):**

- `proposal\tools\md2docx\sdk-validate.ps1` (Open XML SDK 2.9.1.0, MemoryStream open only)
- `proposal\tools\md2docx\verify-package.ps1`
- `proposal\tools\md2docx\validate.ps1`
- Independent verifier-written structural checker: raw ZIP + hand-written XML parser
  (no SDK, no third-party libraries), run from `%TEMP%\dsh-A8KszQ\`

**Compliance with constraints:** no existing file was modified, moved, renamed or deleted.
No `.docx` was opened with the Open XML SDK by path, with Word COM, or with Word. The only file
created outside the verifier's `%TEMP%` scratch area is this report.

---

## V1 — Hashes and sizes: **ALL 8 MATCH, NO MISMATCH**

Every deliverable was re-hashed and re-measured. All eight byte sizes and all eight SHA-256
digests match the acceptance table exactly.

| File | Bytes | Expected | SHA-256 recomputed | Verdict |
|---|---|---|---|---|
| `FYP-Proposal-COMPLETE.docx` | 925,880 | 925,880 | `C37CED16…294EE3` | MATCH |
| `FYP-Proposal-Volume1-Plan.docx` | 352,414 | 352,414 | `508D4D16…810FF2` | MATCH |
| `FYP-Proposal-Volume2-Technical.docx` | 582,195 | 582,195 | `E37085A1…FEB4E4` | MATCH |
| `FYP-Proposal-COMPLETE-ZH.docx` | 1,036,677 | 1,036,677 | `1D79A3FC…EBB6AD` | MATCH |
| `FYP-Proposal-Volume1-Plan-ZH.docx` | 384,624 | 384,624 | `B66AFBCF…5913A7` | MATCH |
| `FYP-Proposal-Volume2-Technical-ZH.docx` | 660,256 | 660,256 | `8C236844…5405FF` | MATCH |
| `FYP-Proposal-COMPLETE.md` | 1,974,691 | 1,974,691 | `2C6B3E43…A3D9AA9` | MATCH |
| `FYP-Proposal-COMPLETE-ZH.md` | 1,880,699 | 1,880,699 | `1DB3FD47…C93F4D8A` | MATCH |

No regeneration occurred: the recorded digests reproduce exactly, which also proves the
`docProps/core.xml` creation timestamps are unchanged since the delivery table was produced.

**Note on the outer `D:\File\School\FYP\validate.ps1` / `_validate-*.txt` scratch files**
(not part of the eight): `_validate-complete.txt` records `925,582 bytes`, whereas the delivered
`FYP-Proposal-COMPLETE.docx` is `925,880 bytes`. That text file is a stale log from an earlier
build, not a claim about this artefact. Not a defect in any deliverable; recorded for completeness.

---

## V2 — SDK validation: **6/6 OPEN OK, 0 ERRORS, `exit 0`, NO MUTATION**

Each document was validated individually (`-Path` one file per invocation, as required).
The script opens from a `MemoryStream` copy; its own `SHA256(pre)`/`SHA256(post)` self-check
reported no `WARNING`.

| Document | SIZE | `SHA256(pre)` matches V1 | OPEN | ERRORS | RAW dup rel-ids/overrides | exit code |
|---|---|---|---|---|---|---|
| `FYP-Proposal-COMPLETE.docx` | 925,880 | yes | OK | **0** | none | **0** |
| `FYP-Proposal-Volume1-Plan.docx` | 352,414 | yes | OK | **0** | none | **0** |
| `FYP-Proposal-Volume2-Technical.docx` | 582,195 | yes | OK | **0** | none | **0** |
| `FYP-Proposal-COMPLETE-ZH.docx` | 1,036,677 | yes | OK | **0** | none | **0** |
| `FYP-Proposal-Volume1-Plan-ZH.docx` | 384,624 | yes | OK | **0** | none | **0** |
| `FYP-Proposal-Volume2-Technical-ZH.docx` | 660,256 | yes | OK | **0** | none | **0** |

All six `SUMMARY|files=1 openFailures=0 validationErrors=0 rawIssues=0`.

**Mutation check (independent of the script):** all six `.docx` SHA-256 digests were
re-computed *after* the whole verification run and are byte-identical to V1. Validation did not
mutate any artefact. **Zero SDK errors — the specified headline criterion is met.**

---

## V3 — Package structure: **verify-package 6/6 PASS, independent checker 6/6 PASS**

### V3a — `verify-package.ps1` (all 9 checks per document)

| Document | content types | rel-Ids unique | `r:id` resolve | tblGrid vs `w:tc` | styles | numbering | one trailing `w:sectPr` | RESULT | exit |
|---|---|---|---|---|---|---|---|---|---|
| COMPLETE | 2 Default, 11 Override, 14/14 parts | 4 + 7, unique | 2 (rId6, rId7) | 312 tables ok | 29 defined, all resolve | 2 numIds, all resolve | 13,849 children, ok | PASS | 0 |
| VOL1 | same | same | same | 145 tables ok | same | same | 1,566 children, ok | PASS | 0 |
| VOL2 | same | same | same | 167 tables ok | same | same | 12,294 children, ok | PASS | 0 |
| COMPLETE-ZH | same | same | same | 312 tables ok | same | same | 13,847 children, ok | PASS | 0 |
| VOL1-ZH | same | same | same | 145 tables ok | same | same | 1,564 children, ok | PASS | 0 |
| VOL2-ZH | same | same | same | 167 tables ok | same | same | 12,294 children, ok | PASS | 0 |

All six `RESULT|…|PASS|all 9 checks passed`, `exit 0`, zero failures.

*Script observation (not an artefact defect):* `verify-package.ps1` prints
`SUMMARY|files=2 failures=0` for a single input because its `$checked++` counter is duplicated.
Counter cosmetics only; the pass/fail logic is unaffected.

### V3b — Verifier's own independent checks (raw ZIP, own XML parser, no SDK)

Checks performed per document, exactly as commissioned, with **zero failures**:

1. **Every part declared in `[Content_Types].xml`** — 13 non-`[Content_Types]` parts, all declared;
   no duplicate `<Default Extension>`; no duplicate `<Override PartName>`; **plus** an extra check
   that every `<Override PartName>` actually resolves to a part present in the ZIP (0 orphans).
2. **No duplicate relationship Id in ANY `.rels` part** — `_rels/.rels` (4) and
   `word/_rels/document.xml.rels` (7) per document; all Ids unique; 0 duplicates.
3. **Every `r:id` in `document.xml` resolves** — the only relationship-namespace references are
   `<headerReference r:id="rId6">` → `word/header1.xml` and `<footerReference r:id="rId7">` →
   `word/footer1.xml`; both targets exist in the package and both resolve in
   `word/_rels/document.xml.rels`. 0 unresolved. (Reviewed across the whole document *and*
   header/footer parts, not just body text.)
4. **Every `w:tbl` has a `w:tblGrid` whose `gridCol` count equals every row's `w:tc` count** —
   312 / 145 / 167 tables, 3,588 / 1,979 / 1,609 rows respectively, all rectangular; 0 ragged.
   An additional `gridSpan`-sum check found no table needing merged-cell reconciliation.
5. **Exactly one `w:sectPr` as the last child of `w:body`** — true for all six (all hand-written
   `w:pPr` child-order sanity check also clean).
6. **No illegal XML 1.0 character in any part** — no `U+0000–U+0008/000B/000C/000E–001F`, no
   `U+FFFE/U+FFFF`, no lone surrogates, in any of the 14 parts of any of the six packages.
7. Extra: no duplicate ZIP entry names; every central-directory entry inflates to its declared
   uncompressed size.

Both the provided gate and the independent checker agree: **the package structure is sound in all
six documents, in both languages.**

---

## V4 — Content completeness (coverage): **99.940 %–100.000 %**

`validate.ps1` was run against each document's **own correct source set**. Because the generator's
`COMPLETE.md` is a verbatim concatenation of the eight section files, the verifier rebuilt each
subset by concatenating the real sources (VOL1 = `01`+`02`+`08`, VOL2 = `03`…`07`, COMPLETE = all
eight; same for the `zh-HK` tree) and **proved the subsets are the shipped sources**: after removing
the generator's banner comments and the added `---` separators, the multiset of non-blank lines is
identical — EN: 14,516 distinct lines, 0 differences; ZH: 14,026 distinct lines, 0 differences
(the only 8 extras are the generator's own `<!-- source: … -->` comments).

| Document | source lines checked | found verbatim | coverage | hard failures | exit |
|---|---|---|---|---|---|
| `FYP-Proposal-COMPLETE.docx` | 27,090 | 27,083 | **99.974 %** | 0 — **PASS** | 0 |
| `FYP-Proposal-Volume1-Plan.docx` | 10,007 | 10,001 | **99.940 %** | 1 (known stale H1) | 1 |
| `FYP-Proposal-Volume2-Technical.docx` | 17,083 | 17,082 | **99.994 %** | 1 (known stale H1) | 1 |
| `FYP-Proposal-COMPLETE-ZH.docx` | 26,596 | 26,595 | **99.996 %** | 0 — **PASS** | 0 |
| `FYP-Proposal-Volume1-Plan-ZH.docx` | 9,513 | 9,513 | **100.000 %** | 1 (known stale H1) | 1 |
| `FYP-Proposal-Volume2-Technical-ZH.docx` | 17,083 | 17,082 | **99.994 %** | 1 (known stale H1) | 1 |

**The four VOLUME documents fail on exactly one check, the documented stale expectation:**
`CHECK FAILED: H1 count mismatch: markdown 0 (minus 1 title-styled) vs document 0`. Cause confirmed
independently: the source corpus has **no `# ` H1 at all** — its shallowest heading is `## N. Title`
(26 of them) — so `titleStyled` = 1 is subtracted from 0, and the synthesised title page supplies
the title with `TitlePageTitle`/`TitlePageSubtitle` styles rather than an H1. All H2–H5 counts match
exactly in every document (e.g. VOL1: md 21/107/104 vs docx 21/107/104). The coverage figure is
printed before that abort, as stated. **Confirmed as a stale validator expectation, not a
deliverable defect — and it is the *only* reported failure in those four runs.**

### Residual "not found verbatim" lines — producer's claim: **CONFIRMED, I AGREE**

Residuals are 6 (VOL1 EN, all soft line wraps), 1 (VOL2 EN), 1 (VOL2 ZH), 1 (VOL1 EN table cell),
1 (COMPLETE EN) and 1 (COMPLETE ZH); VOL1 ZH has **0** (100.000 %). I hand-checked nine distinct
fragments, not three, by locating each in the real source and testing the **paragraph-joined** text
against the document's own extracted `w:t` text (emphasis and backtick markers stripped).
**All nine are present; none is lost content.**

The two COMPLETE documents' 1-line shortfalls are accounted for and are *not* lost content:
COMPLETE EN's 7 residuals are exactly the 6 VOL1 residuals plus the 1 VOL2 residual (VOL1 and VOL2
are its only parts), and COMPLETE-ZH's single residual is the `zh-HK/03-microsoft.md` boundary item
(#9 below), whose heading text is present in the document.

| # | Reported residual | Source evidence | Verdict in document |
|---|---|---|---|
| 1 | `Systems Administration** (Skill 2447), and carries the footer timestamp Last updated: 02.06.` | `01-introduction.md` L498–499 — a **bold span wrapping a source newline** (`…as **IT Network` / `Systems Administration**…`) | **PRESENT** verbatim as `Systems Administration (Skill 2447), and carries the footer timestamp Last updated: 02.06.2026` — *see caveat C-1: the space here is dropped* |
| 2 | `A naive search for the two letters "AI" does return hits on the page, but **every one is a` | `01-introduction.md` L1044–1045, mid list item, soft-wrapped | **PRESENT** verbatim (`…false positive — …`) |
| 3 | `substring false positive** — the letters occur incidentally inside the words Shanghai,` | `01-introduction.md` L1045–1046, continuation of the same list item | **PRESENT** verbatim as one list item |
| 4 | `RSTP instead of STP. The exact string RSTP does not occur in the standard; the legitimate ` | `02-architecture.md` L183–184, mid paragraph, soft-wrapped | **PRESENT** verbatim; only the emphasis markers differ |
| 5 | `All addressing comes from the RFC 1918 private ranges or the RFC 5737 documentation ranges` | `02-architecture.md` L577–578, mid paragraph, soft-wrapped | **PRESENT** verbatim |
| 6 | `Bridge: Configure access, aggregation and core level switching; **IEEE 802.1w, *Rapid Reco` | `02-architecture.md` L1010–1012 — the cell text begins **after a newline inside the table row** | **PRESENT** verbatim in the same table cell: `Bridge: Configure access, aggregation and core level switching; IEEE 802.1w, Rapid Reconfiguration of Spanning Tree cited by title` |
| 7 | `**The firewall rules that must exist *elsewhere* — the part that is easy to forget.**` | `03-microsoft.md` L2733–2735; the paragraph **immediately follows a closed code fence**, so the first run starts mid-line | **PRESENT** verbatim |
| 8 | `***其他位置*必須存在的防火牆規則 —— 容易遺忘的部分。**` | `zh-HK/03-microsoft.md` L2629–2631; same code-fence adjacency | **PRESENT** verbatim |
| 9 | `單層與兩層 PKI 的決定（基準待辦事項 O-06）…僅列出。## 8. Linux 伺服器管理` | `zh-HK/03-microsoft.md` L3497–3502: the list item ends and the next file's `## 8.` heading is **glued onto the same physical line because `zh-HK/03-microsoft.md` has no trailing newline** | **PRESENT** verbatim in the document; the `## 8. Linux 伺服器管理` heading *is* correctly emitted as a Heading2 (`VOL2-ZH` H2 list item 2, `COMPLETE-ZH` item 14) |

**Cause confirmed:** all residuals are source-line-wrap / marker-normalisation artefacts. EN
`01-introduction.md` is the only file in the corpus that is hard-wrapped mid-paragraph
(**494** soft wraps; every other file has **0**). No content is missing.

---

## V5 — Cross-document additivity: **ADDITIVE ON EVERY METRIC**

All counts below were measured by the verifier directly from the `.docx` files (raw ZIP +
own XML parser), reading paragraph styles and counting `w:tbl`, `w:tr`, `SourceCode` paragraphs and
paragraphs carrying `w:numPr`. They agree exactly with `validate.ps1`'s independent count of the
same documents and with the Markdown-side counts.

| Metric | VOL1 | VOL2 | VOL1+VOL2 | COMPLETE | Additive? |
|---|---|---|---|---|---|
| Top-level headings (H2) | 21 | 5 | **26** | **26** | ✅ |
| H3 | 107 | 69 | **176** | **176** | ✅ |
| H4 | 104 | 268 | **372** | **372** | ✅ |
| H5 | 0 | 66 | **66** | **66** | ✅ |
| Tables | 145 | 167 | **312** | **312** | ✅ |
| Table rows | 1,979 | 1,609 | **3,588** | **3,588** | ✅ |
| Code-block paragraphs | 436 | 10,012 | **10,448** | **10,448** | ✅ |
| List items (`w:numPr`) | 144 | 512 | **656** | **656** | ✅ |

**No non-additive count.** The ZH set is identical on every metric
(H2 21+5=26; H3 107+69=176; H4 104+268=372; H5 0+66=66; tables 145+167=312; rows 1,979+1,609=3,588;
code 436+10,012=10,448; lists 143+512=**655** = COMPLETE-ZH 655 — the ZH corpus legitimately has one
list item fewer than the EN corpus, and the split is still exactly additive).

*Note on markdown cross-check:* `validate.ps1` reports "table data rows" excluding headers
(VOL1 1,834 + 145 header rows = 1,979; VOL2 1,442 + 167 = 1,609; COMPLETE 3,276 + 312 = 3,588), so
`dataRows + tables = my row count` in all cases. Consistent.

### Section membership, verified by listing the actual top-level heading texts

**`FYP-Proposal-Volume1-Plan.docx` — 21 top-level headings, all front matter plus §1–6 and §12–20:

`Title Block`, `Document Control`, `Revision History`, `Executive Summary`, `Table of Contents`,
`Abbreviations and Glossary`, `1. Introduction`, `2. Aim and Objectives`, `3. Project Scope`,
`4. Standards and Compliance Alignment`, `5. Literature and Technology Review`,
`6. System Architecture Design`, `12. Implementation Plan and Schedule`,
`13. Testing, Verification and Acceptance`, `14. Documentation and Evidence Management`,
`15. Risk Management`, `16. Project Management and Team Organisation`,
`17. Expected Outcomes and Deliverables`, `18. Conclusion`, `19. References`, `20. Appendices`.

✅ Contains all six front-matter sections. ✅ Contains §1–6. ✅ Contains §12–20.
✅ **Contains no §7, §8, §9, §10 or §11.**

**`FYP-Proposal-Volume2-Technical.docx` — 5 top-level headings, only §7–11:

`7. Microsoft Server Networking and Network Services`, `8. Linux Server Administration`,
`9. Cisco Networking`, `10. Network Automation`, `11. AI Network Management`.

✅ Contains only §7–11. ✅ **No front matter** (no `Title Block`, `Document Control`,
`Revision History`, `Executive Summary`, `Table of Contents` or `Abbreviations and Glossary` as a
Heading2; the title page uses `TitlePageTitle`/`TitlePageSubtitle` styles, and the single
`TOCHeading` is the field placeholder, not a body section).

The ZH pair is structurally identical with translated headings, and its §8 heading
(`8. Linux 伺服器管理`) is present and correct at position 2 of `Volume2-Technical-ZH`, position 14
of `COMPLETE-ZH`.

---

## V6 — The `rp_filter` inline-code / emphasis fix: **FIXED, NO RESIDUAL DEFECT**

Source: `04-linux.md` L2433 (nftables pitfalls table, row **M-09**, 5 cells). The exacter in both
documents is **section 8.5** (the `M-09` row of the pitfalls table), not the `FSRM-09` row of the
Microsoft FSRM table — both were located and checked.

### `FYP-Proposal-Volume2-Technical.docx` — M-09 row, verbatim runs

- **Cell 1** `M-09` — one run, no `rPr`.
- **Cell 2**: run `"rp_filter = 1"` with `rPr=[rStyle{w:val="MonoChar"}]`, then run
  `" on a multi-homed host with asymmetric routing"` with `xml:space="preserve"`.
- **Cell 3**: `"Intermittent drops on one interface only; "` (`xml:space="preserve"`) + run
  `"log_martians"` (`rStyle=MonoChar`) + `" fills with legitimate-looking addresses"` (`preserve`).
- **Cell 4**: one run, no formatting.
- **Cell 5**: `"Keep strict rp_filter on this design (the pair is symmetric), and if asymmetric routing is ever introduced use "`
  (`xml:space="preserve"`) + run `"rp_filter = 2"` (`rStyle=MonoChar`) + `" (loose) rather than 0"`
  (`preserve`).

### `FYP-Proposal-Volume2-Technical-ZH.docx` — M-09 row, verbatim runs

- **Cell 1** `M-09` — one run, no `rPr`.
- **Cell 2**: `"在多網段主機上搭配非對稱路由使用 "` (`preserve`) + `"rp_filter = 1"` (`MonoChar`).
- **Cell 3**: `"僅在某一個介面上間歇性丟棄；"` + `"log_martians"` (`MonoChar`) + `" 塞滿看似合法的位址"`.
- **Cell 4**: one run, no formatting.
- **Cell 5**: `"本設計保留嚴格 rp_filter（本對組為對稱），而若日後引入非對稱路由，則使用 "` + `"rp_filter = 2"` (`MonoChar`) + `"（寬鬆），而非 0"`.

**Verdict on the specific defect: PASS.** In both languages the identifier is intact and rendered as
a `MonoChar` inline-code run; there is **no stray italic run** anywhere in the row
(0 runs carry `<w:i/>`), and there is **no literal backtick character** rendered as text in the row
(0 backticks). The emphasis delimiter that previously leaked out of the code span is gone; the
literal source is `` `rp_filter = 1` `` / `` `rp_filter = 2` ``, and it renders exactly as the code
text without the delimiters.

### Remaining literal backticks anywhere in Volume 2 (and COMPLETE)

A full audit of every `w:t` node containing a backtick, classified by context:

| Document | backtick chars | nodes with backticks | nodes with an **odd** count | odd-count nodes **not** in a code paragraph | nodes with an **even** count |
|---|---|---|---|---|---|
| `VOL2` EN | 380 (even) | 284 | 228 | **0** | 56 |
| `VOL2` ZH | 380 (even) | 284 | 228 | **0** | 56 |
| `COMPLETE` EN | 382 (even) | 284 | 228 | **0** | 56 |
| `COMPLETE` ZH | 382 (even) | 284 | 228 | **0** | 56 |
| `VOL1` EN / ZH | 2 (even) | 1 | **0** | **0** | 1 |

All 228 odd-count nodes are PowerShell **line-continuation backticks at the end of a code line
inside `SourceCode` paragraphs** (e.g. `"    -Precedence 10 \`"`) — the correct rendering of a backtick
that is genuinely part of the source code, not markup. **No odd-count backtick occurs outside a code
paragraph in any document.** The 56 even-count nodes are properly paired code-span delimiters, and
the two documents' totals (EN 382 / ZH 382) are **identical**, i.e. the fix is applied symmetrically
to both languages. VOL1's only two backticks are the paired `` `show version` `` in an appendix
table cell. **No stray literal backtick rendered as visible markup text was found.**

---

## V7 — Integrity of the user's originals: **BOTH CORRECT**

| File | Bytes | Expected | SHA-256 | Verdict |
|---|---|---|---|---|
| `AY2627_FYP topics_v2_Victor Li.docx` | **30,949** | 30,949 | `1B847CF41700BD1DB3C0E3D5E540BC349674A8177B057AD9AC09F897B4AAFB4E` | **exact match** |
| `image.png` | **141,462** | 141,462 | (not specified) `E2001305D91C2DDF02F8F77310C52459A1C6855CF79D057F564C13C866967FDF` | size exact |

The user's topic-sheet document is byte-for-byte the restored original (correct size **and** the
specified digest — the corrupted state was `30,882` bytes / `3F8632DE…`). `image.png` is a valid PNG
(signature `89 50 4E 47 0D 0A 1A 0A`, IHDR 1056×1018) at exactly 141,462 bytes. **Neither file was
opened with the SDK, Word COM, or Word** — only raw byte reads/hashing were used. Both hashes were
re-checked at the end of the run and are unchanged.

---

## V8 — Text-level spot fidelity: **ALL REQUIRED STRINGS PRESENT IN BOTH LANGUAGES**

Extracted from each document's own concatenated `w:t` text (and cross-checked against
paragraph-joined text — identical results).

| Must-exist string | COMPLETE (EN) | COMPLETE-ZH |
|---|---|---|
| `Victor2 – Enterprise Network Infrastructure and Architect` | **PRESENT** ×7 | **PRESENT** ×7 |
| `Microsoft Server Networking and Network Services` | **PRESENT** ×8 | **PRESENT** ×6 |
| `Linux Server Administrations` | **PRESENT** ×6 | **PRESENT** ×5 |
| `Cisco Networking` | **PRESENT** ×11 | **PRESENT** ×10 |
| `Network Automation` | **PRESENT** ×9 | **PRESENT** ×8 |
| `AI Network Management` | **PRESENT** ×19 | **PRESENT** ×13 |
| `https://worldskills.org/what/projects/wsos/2026/events/611/skills/2447/` | **PRESENT** ×4 | **PRESENT** ×4 |
| `https://worldskills.org/what/projects/wsos/2024/events/579/skills/1694/` | **PRESENT** ×1 | **PRESENT** ×1 |

**Nothing ABSENT.** The ZH document keeps all eight strings — including the project title and the
five deliberately-untranslated technology names — exactly as required. The per-volume distribution
is also consistent: the two WorldSkills URLs are absent from both Volume-2 documents and present in
both Volume-1 documents (2026 URL ×4, 2024 URL ×1 in each), matching where those citations live in
the corpus.

---

## V9 — Overall verdict: **ACCEPT WITH CAVEATS**

### Reasoning

Every gate the commission specified was re-run by me, unmodified, and the result is unambiguous:

- **Artefact identity is exact** — 8/8 sizes and 8/8 SHA-256 digests match, so every conclusion
  below is about the delivered bytes.
- **The documents are schema-valid.** 6/6 open in the Open XML SDK with **0 errors** and `exit 0`,
  with the hash identical before and after. This is the strongest available statement of
  well-formed OOXML, and it is clean.
- **The packages are structurally sound** twice over — once through `verify-package.ps1` (9/9 checks
  each) and once through my own raw-ZIP/own-parser checks (content-type coverage, rel-Id uniqueness,
  `r:id` resolution, `tblGrid`/`w:tc` agreement, single trailing `sectPr`, no illegal XML 1.0
  characters). Zero findings, both languages.
- **Content is complete.** Coverage is 99.940 %–100.000 % with the only hard failure being the
  documented stale H1 expectation. The two COMPLETE documents pass outright; the four volumes fail
  *only* on that one stale check, with the coverage figure already printed.
- **The residual "not found" lines carry no lost content.** I verified nine of them by hand, not the
  three required — all are source-line-wrap / marker-normalisation artefacts, present verbatim in
  the document. The producer's characterisation is accurate.
- **The document set is exactly additive and the split is correct** — H2/H3/H4/H5, tables, rows,
  code paragraphs and list items all satisfy VOL1 + VOL2 = COMPLETE, and the heading texts prove VOL1
  = front matter + §1–6 + §12–20 with no §7–11, VOL2 = only §7–11 with no front matter.
- **The defect that was last fixed is fixed.** `rp_filter` renders as clean `MonoChar` code with no
  stray italic run and no literal backtick, and no stray backtick exists anywhere in either Volume-2
  document or either COMPLETE document.
- **The user's originals are intact**, and nothing in this verification mutated a single file.

### Caveats

**C-1 (only genuine defect found; minor, cosmetic, EN-only).** The converter drops the **space at a
markdown soft line break** in ordinary prose. In `FYP-Proposal-COMPLETE.docx` (and identically in
`FYP-Proposal-Volume1-Plan.docx`) I measured **33** high-confidence lost-space joins, *all* of them at
source line-wrap points in `proposal\sections\01-introduction.md` (which is the only file in the
corpus that is hard-wrapped mid-paragraph — **494** soft wraps vs **0** in every other file). I
attributed **33/33** to an actual source line break. Exact run-level evidence:

- `01-introduction.md` L498–499: markdown ``…names the skill as **IT Network`` / ``Systems Administration**…``
  → docx runs `", names the skill as **IT Network"` then `"Systems Administration** (Skill 2447)…"`
  → **no space**; renders as `IT NetworkSystems Administration`.
- `01-introduction.md` L499–500: ``**Last updated: 02.06.2026`` / ``13:34 (GMT)**`` → renders as
  `02.06.202613:34`.
- Other examples (all with the source line break confirmed): `Hong Kong Insurance|Authority`,
  `anything. The|VM estate`, `Network and|System Operations`, `WorldSkills|Shanghai 2026`,
  `Active Directory Domain|Services (ADDS)`, `Routing and|Remote Access Service`.

Because the space *is* present in the shipped `COMPLETE.md`, this is a **converter fidelity defect,
not a source defect**. Impact: no content loss, no structural or schema impact, no effect on the
Chinese documents (ZH `01-introduction.md` has only **1** soft wrap; the ZH set measures **1**
lost-space join, and Volume-2 measures **0** in both languages). It is a proofreading-level
typographical blemish that a reviewer reading the Word document will notice as a small number of
run-together words, most of them inside **bold** spans.

**Notably, this defect is invisible to both existing gates**: the coverage check passes because the
validator splits its needles on whitespace (it therefore reported the *preceding* fragment
`…names the skill as **IT Network` as "not found" instead of the joined word), and the
`text completeness ratio` gate tolerates large shortfalls (threshold 0.90; measured 96.29 %). This
finding is mine alone, derived from run-level inspection.

**C-2 (informational, not a defect).** `verify-package.ps1` mislabels its file count
(`files=2` for one input) because of a duplicated `$checked++`. Cosmetic to the tool, not the artefact.
Similarly, the stale `_validate-*.txt` logs in the workspace root describe an older
`925,582`-byte COMPLETE build and are not evidence about the delivered file.

### Not verified / limits of this verification

- **No visual/Word rendering check was performed.** Per the constraints, no document was opened in
  Word or via Word COM. All findings are from the OOXML package itself. The C-1 spacing defects are
  therefore confirmed at the XML run level and are certain to be visible as missing spaces in text
  rendering, but I did not produce a screenshot or PDF to demonstrate it, and I cannot state how
  pagination, the TOC field, or font substitution appear on screen.
- **Link targets were not exercised over the network.** Both WorldSkills URLs were confirmed as
  present strings, not as reachable endpoints.
- **No proofreading for semantic/translation accuracy was in scope.** The ZH count differences
  (e.g. 655 vs 656 list items, different occurrence counts per technology name) are consistent with
  translation and were confirmed additive, but translation quality was not assessed.
- **`xml:space="preserve"` was not audited exhaustively.** It was inspected only at the boundaries
  relevant to the C-1 and V6 findings.
- The C-1 count (33) is a **high-confidence lower-bound detector**: it flags only boundaries where a
  run/code-span join is provably missing a space. A silent lost space between two plain words inside
  one run is not detectable by this method, so the true number of affected line breaks could exceed
  33 (bounded above by the 494 soft wraps in `01-introduction.md`).
