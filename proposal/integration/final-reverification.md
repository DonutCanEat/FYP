# Independent re-verification of the regenerated proposal deliverables

Auditor: separate agent, not the producer. Nothing below is taken from the producer's
self-report without independent re-derivation.

- Build audited (mtime): `.docx` written 2026-09-17 00:37:53–54; `.md` written 00:10:02.
- `proposal\tools\md2docx\convert.js` mtime 00:07:42 — i.e. **the converter was saved
  before the artefacts were regenerated**, so the artefacts post-date the soft-break fix.
- The producer's acceptance report `proposal\integration\final-acceptance-report.md`
  (mtime 00:02:22) **pre-dates the .md files by 8 minutes and the .docx by 35 minutes**,
  and quotes a `925,582-byte` COMPLETE.docx; the delivered file is 924,009 bytes. The
  producer's report therefore describes an **earlier build** and is stale.
- Nothing was modified during this audit. All eight deliverables were hashed before and
  after every gate run; every hash is unchanged.

**Overall verdict: REJECT.** See R9.

---

## R1 — Sizes and SHA-256 — PASS (8/8 exact)

| File | Bytes | Matches claim | SHA-256 | Matches claim |
|---|---|---|---|---|
| FYP-Proposal-COMPLETE.docx | 924,009 | yes | E780FA1526D30C49…B4C438 | yes |
| FYP-Proposal-Volume1-Plan.docx | 350,547 | yes | ADA52C51C68950C3…8D954E | yes |
| FYP-Proposal-Volume2-Technical.docx | 582,139 | yes | 8C5349DAFA906A10…4EFED | yes |
| FYP-Proposal-COMPLETE-ZH.docx | 1,036,581 | yes | D142801226A9C02E…AFC677 | yes |
| FYP-Proposal-Volume1-Plan-ZH.docx | 384,608 | yes | BBC14CAB8D63D169…8703E49 | yes |
| FYP-Proposal-Volume2-Technical-ZH.docx | 660,169 | yes | 7ADBC5360E96DD34…AAC855 | yes |
| FYP-Proposal-COMPLETE.md | 1,974,691 | yes | 0921C677E4FB2E7B…1A3239C | yes |
| FYP-Proposal-COMPLETE-ZH.md | 1,880,702 | yes | BD73A157F0625208…F04770A1 | yes |

No mismatch. No file was rewritten after the producer's report: every mtime is ≤ 00:37:54
and the producer's report is 00:02:22, but the report's own quoted size for
COMPLETE.docx (925,582 B) does not match this build, so the report text is stale
rather than the artefacts.

## R2 — Open XML SDK 2.9.1.0 — PASS (6/6, 0 errors)

One `-Path` per invocation, from a MemoryStream only (never by path).

| Document | OPEN | ERRORS | raw issues | exit | SHA before → after |
|---|---|---|---|---|---|
| COMPLETE.docx | OK | 0 | 0 | 0 | E780FA15… → E780FA15… unchanged |
| Volume1-Plan.docx | OK | 0 | 0 | 0 | ADA52C51… → ADA52C51… unchanged |
| Volume2-Technical.docx | OK | 0 | 0 | 0 | 8C5349DA… → 8C5349DA… unchanged |
| COMPLETE-ZH.docx | OK | 0 | 0 | 0 | D1428012… → D1428012… unchanged |
| Volume1-Plan-ZH.docx | OK | 0 | 0 | 0 | BBC14CAB… → BBC14CAB… unchanged |
| Volume2-Technical-ZH.docx | OK | 0 | 0 | 0 | 7ADBC536… → 7ADBC536… unchanged |

Format Office2013, MaxNumberOfErrors 2,000,000, SDK 2.9.1.0. All six hashes stable.

## R3 — Independent raw-ZIP / XML structure — PASS (6/6)

Own parser (Node.js: EOCD/central-directory reader + `zlib.inflateRawSync` + a
namespace-aware XML parser). No SDK, no repo tool used.

| Check | COMPLETE | VOL1 | VOL2 | COMPLETE-ZH | VOL1-ZH | VOL2-ZH |
|---|---|---|---|---|---|---|
| zip entries | 14 | 14 | 14 | 14 | 14 | 14 |
| content types (Default/Override) | 2/11 | 2/11 | 2/11 | 2/11 | 2/11 | 2/11 |
| parts with no content type | 0 | 0 | 0 | 0 | 0 | 0 |
| Override with no zip entry | 0 | 0 | 0 | 0 | 0 | 0 |
| `.rels` parts / duplicate rIds | 2 / 0 | 2 / 0 | 2 / 0 | 2 / 0 | 2 / 0 | 2 / 0 |
| `r:id` in document/header/footer, unresolved | 2 / 0 | 2 / 0 | 2 / 0 | 2 / 0 | 2 / 0 | 2 / 0 |
| illegal XML 1.0 chars | 0 | 0 | 0 | 0 | 0 | 0 |
| parts not well-formed | 0 | 0 | 0 | 0 | 0 | 0 |
| tables / rows / cells | 312 / 3,588 / 14,608 | 145 / 1,979 / 8,566 | 167 / 1,609 / 6,042 | 312 / 3,588 / 14,608 | 145 / 1,979 / 8,566 | 167 / 1,609 / 6,042 |
| tables lacking `w:tblGrid` | 0 | 0 | 0 | 0 | 0 | 0 |
| rows whose `w:tc` ≠ `gridCol` count | 0 | 0 | 0 | 0 | 0 | 0 |
| `w:sectPr` in body / last child | 1 / yes | 1 / yes | 1 / yes | 1 / yes | 1 / yes | 1 / yes |
| undefined styles / numIds | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |

`_rels/.rels` carries no individual content-type declaration; per OPC (ECMA-376 Part 2)
relationship parts are covered by the reserved `rels` Default, which is present. Not a defect.

Repo tools, re-run:

- `verify-package.ps1`: **6/6 PASS, all 9 checks, 0 failures** (exit 0). Reports itself as
  `SUMMARY|files=1` per invocation, i.e. its file count is the per-call count — cosmetic only.
- `tablecells.ps1`: 312 / 145 / 167 / 312 / 145 / 167 tables, **ragged = 0** in all six
  (exit 0).

## R4 — the soft-break defect — mixed; the specific fix holds, the class is NOT gone

Bad strings, occurrence counts (expect 0) — **all 0 in all six**:

| bad string | COMPLETE | VOL1 | VOL2 | COMPLETE-ZH | VOL1-ZH | VOL2-ZH |
|---|---|---|---|---|---|---|
| `IT NetworkSystems` | 0 | 0 | 0 | 0 | 0 | 0 |
| `02.06.202613:34` | 0 | 0 | 0 | 0 | 0 | 0 |
| `InsuranceAuthority` | 0 | 0 | 0 | 0 | 0 | 0 |
| `DomainServices` | 0 | 0 | 0 | 0 | 0 | 0 |
| `WorldSkillsShanghai` | 0 | 0 | 0 | 0 | 0 | 0 |
| `NetworkandSystem` | 0 | 0 | 0 | 0 | 0 | 0 |
| `anythinTheVM` | 0 | 0 | 0 | 0 | 0 | 0 |

Correct forms present:

| correct form | COMPLETE | VOL1 | VOL2 | COMPLETE-ZH | VOL1-ZH | VOL2-ZH |
|---|---|---|---|---|---|---|
| `IT Network Systems Administration` | 19 | 15 | 4 | 19 | 15 | 4 |
| `02.06.2026 13:34` | 2 | 2 | 0 | 2 | 2 | 0 |
| `Hong Kong Insurance Authority` | 1 | 1 | 0 | **0** | **0** | **0** |
| `Active Directory Domain Services` | 13 | 11 | 2 | 13 | 11 | 2 |
| `Network and System Operations` | 26 | 20 | 6 | 19 | 14 | 5 |
| `WorldSkills Shanghai 2026` | 11 | 7 | 4 | 11 | 7 | 4 |

The one anomaly — `Hong Kong Insurance Authority` absent from the ZH documents — is a
ZH-naming question, not the English soft-break defect; the ZH text uses a Chinese/NB
form. Flagged for the producer, not counted as a new hard defect.

Own soft-break detection. Over all non-`SourceCode` paragraphs I searched for a
sentence-final `.` immediately followed by an uppercase letter (the signature of a
wrapped fragment that lost its separator), plus independent sentence-contiguity testing:

| Document | prose paragraphs | lost-space hits in prose | source prose sentences ≥15 words | found contiguous | found separated (scrambled order) |
|---|---|---|---|---|---|
| COMPLETE.docx | 17,696 | **388** | 2,785 | 1,110 | **1,107** |
| Volume1-Plan.docx | 9,550 | **130** | 1,168 | 643 | **393** |
| Volume2-Technical.docx | 8,156 | **258** | 1,617 | 467 | **713** |
| COMPLETE-ZH.docx | 17,694 | 13 (nearly all inside technical strings) | 2,613 (ZH) | 835 | **1,310** |

The producer claims **704/704** breaks render with exactly one space. **I could not
reproduce that claim and the evidence contradicts it.** Direct examples from
`FYP-Proposal-COMPLETE.docx` (`verify-package.ps1`'s own text extraction would show the
same; these are from body-level `w:p` text in document order):

```
body[27] FULL: , which models the Layer 2 and Layer 3 topology, the routing protocols and the
firewall policy — the simulator's limits are stated explicitly and no simulated measurement is
presented as a real-world figure.Cisco Packet Tracer, chosen because its Virtual Network Editor
supports arbitrary host-only networks ... The Cisco layer is built in VMware Workstation Pro
17.6.2, the physical machine owned by a group member). The recommended hypervisor is
vpnz-hvhost01 (nineteen virtual machines — nine Windows Server guests and ten Ubuntu Linux
guests — running on one hypervisor hostThe entire environment is virtual. There is no physical
network hardware of any kind: ... The VM estate comprises
```

Two things are visible here: fragments merged with **no separator at all**
(`figure.Cisco`, `hostThe entire`), and **fragments delivered in reversed order**
(source reads "The Cisco layer is built in **Cisco Packet Tracer**, which models …",
"… the physical machine owned by a group member). The recommended hypervisor is
**VMware Workstation Pro 17.6.2**, chosen because …"). Same failure mode in list items:

```
body[24] FULL:  A Git-tracked repository of PowerShell scripts, Ansible playbooks, roles and
Jinja2 templates, ... idempotence is a hard requirement and is demonstrated by a second run
reporting no changes.Network Automation.
```

So: the **specific enumerated strings were fixed**, but the underlying defect class —
wrapped-line fragment reassembly — is **still present and much broader than the seven
probe strings**, because it also reorders fragments. R4 therefore fails on the "prove it
is genuinely gone" requirement.

## R5 — Coverage — volumes FAIL benignly, COMPLETE fails only against the generated .md

`validate.ps1` run once per document against its own source set (COMPLETE = 8-file
concatenation; VOL1 = 01+02+08; VOL2 = 03..07).

| Document | source set | content lines checked | found verbatim | result | gates failed |
|---|---|---|---|---|---|
| COMPLETE.docx | 8-file concatenation | 27,090 | 27,054 (99.867%) | **PASS** | none |
| Volume1-Plan.docx | src-VOL1 | 10,007 | 9,972 (99.650%) | FAIL | `H1 count mismatch` (1) |
| Volume2-Technical.docx | src-VOL2 | 17,083 | 17,082 (99.994%) | FAIL | `H1 count mismatch` (1) |
| COMPLETE.docx | `FYP-Proposal-COMPLETE.md` | 27,108 | 27,055 (99.804%) | FAIL | `horizontal rule count mismatch` (1) |
| COMPLETE-ZH.docx | `FYP-Proposal-COMPLETE-ZH.md` | 26,614 | 26,596 (99.932%) | FAIL | `horizontal rule count mismatch` (1) |

**(a) `H1 count mismatch: markdown 0 (minus 1 title-styled) vs document 0` — confirmed,
and it is a validator false-alarm, not an artefact defect.** The markdown has **zero** H1
lines (I counted H1 lines across all eight sources: 0). The document has **zero**
`Heading1` paragraphs. The failing condition is therefore `(0 - 1) != 0`, i.e. the
validator subtracts a title-styled H1 that does not exist. Harmless, pre-existing,
not to be "fixed" in the artefacts.

**(b) `horizontal rule count mismatch: markdown 60 vs document 52` — CONFIRMED, and I
confirmed the diagnosis myself.** The producer says 8 `---` frame separators are counted
as Markdown rules though the converter never renders them. Measured independently:

- The eight source files contain **exactly 52** real horizontal rules outside code fences
  (01:4, 02:0, 03:12, 04:0, 05:16, 06:6, 07:14, 08:0).
- The `.docx` documents contain **exactly 52** `HorizontalRule` paragraphs
  (COMPLETE 52 = VOL1 4 + VOL2 48). So 52 **real** rules — the producer's question
  "are there really 52 real rules in the document" is **yes**.
- The generated `FYP-Proposal-COMPLETE.md` contains **60** strict rule lines: the same 52
  plus **8 extra line-leading `---` separators**; `COMPLETE-ZH.md` likewise 60. Its own
  banner states the format: *"Each source file is preceded by a horizontal rule and an
  HTML comment naming it."* — so the 8 extras are exactly the generator's frame separators,
  inserted before each of the 8 source files.
- Consequence: running the gate against the **generated `.md`** fails; running it against
  the **8-file section sources** passes (52 vs 52). Both behaviours reproduced.

So the producer's description of (b) is correct in substance. It is a `.md`-generator /
gate-input mismatch, not a `.docx` defect.

**Additional validator defect found (secondary, report only).** `validate.ps1`'s Markdown
rule counter does not track fenced code blocks: it counts only 52 of the 55 `---` lines in
the concatenation because 3 additional `---` lines sit inside fences (`08-project-management.md`).
That the concatenated run passes is therefore partly luck. Also, every `CHECK FAILED`
message interpolates `$mdCounts.rules` / `$mdCounts.listItems` without a `.rules` /
`.listItems` member, so the message prints the type name
(`System.Collections.Specialized.OrderedDictionary.rules`) instead of the value — this is
why the producer's quoted message hid its own numbers.

**Residual "not found verbatim" lines — hand-checked (I agree no content is missing).**
COMPLETE against its generated `.md`: 53 lines not found. I hand-checked 7:

| md line | kind | verdict |
|---|---|---|
| 1 (`<!--`) | generated banner/comment | genuinely never emitted into the .docx — correct |
| 7 ("Each source file is preceded by a horizontal rule …") | generated banner text about the tooling | absent by design — correct |
| 14 (`<!-- source: 01-introduction.md (1 of 8) -->`) | generator comment | absent by design — correct |
| 139 ("VM estate comprises **nineteen virtual machines …") | real prose | **present** (para 112), but as scrambled fragments: `… is vpnz-hvhost01 (nineteen virtual machines — nine Windows Server guests and ten Ubuntu Linux guests — running on one hypervisor hostThe entire environment …` |
| 140 ("guests — running on one hypervisor host** …") | real prose | **present**, same scrambled region |
| 394 ("**[FIGURE: Site and connection map — HQ (Sha Tin) …") | figure caption | **present** at para 354 |
| 396 ("the service zones labelled.]**") | figure caption | **present** at para 354 (same paragraph as 394 — so this is the 2-line caption case, and it is NOT missing) |

The producer's classification is **partly right**: categories (i) generated banner/comment
lines and (iii) the two-line `[FIGURE: …]` caption are correct, and no content is missing.
But only ~10 of the 53 lines are generated banner/comment lines; the remaining ~43 are
**real prose/caption content that is present but reordered or emphasis-marker-broken** —
which the producer's category (ii) "emphasis markers left open by a soft wrap" understates.
These lines are the gate's *symptom* of the R4/R9 scrambling defect.

## R6 — Additivity — PASS on every metric requested

Measured from the .docx files themselves (`Heading2..5` styles, `w:tbl`/`w:tr`,
`SourceCode` paragraphs, `numPr` paragraphs):

| metric | COMPLETE | VOL1 | VOL2 | VOL1+VOL2 | additivity |
|---|---|---|---|---|---|
| H2 | 26 | 21 | 5 | 26 | OK |
| H3 | 176 | 107 | 69 | 176 | OK |
| H4 | 372 | 104 | 268 | 372 | OK |
| H5 | 66 | 0 | 66 | 66 | OK |
| tables | 312 | 145 | 167 | 312 | OK |
| table rows | 3,588 | 1,979 | 1,609 | 3,588 | OK |
| (table cells) | 14,608 | 8,566 | 6,042 | 14,608 | OK |
| code paragraphs | 10,448 | 436 | 10,012 | 10,448 | OK |
| list items | 656 | 144 | 512 | 656 | OK |
| H1 | 0 | 0 | 0 | 0 | OK |

ZH: identical additivity on H2 (26/21/5), H3 (176/107/69), H4 (372/104/268), H5 (66/0/66),
tables (312/145/167), rows (3,588/1,979/1,609), code (10,448/436/10,012) and list items
(655/143/512). **Exact in both languages.**

Non-additive by design (each volume carries its own title block / TOC / document control /
revision history / abbreviations table — the repeated front matter): paragraphs
COMPLETE 28,144 vs VOL1+VOL2 28,154 (−10), `w:t` nodes 44,481 vs 44,489 (−8), text chars
1,853,264 vs 1,853,685 (−421). ZH: 28,142 vs 28,152 (−10) paragraphs, 44,558 vs 44,566 (−8)
`w:t`, 1,118,828 vs 1,119,136 (−308) chars. All three deltas are fully accounted for by the
duplicated front matter, so the additivity claim holds.

Top-level heading texts confirm the claimed composition:

- **VOL1 = front matter + sections 1–6 and 12–20, no §7–11.** Its 21 `Heading2` texts are
  `Title Block`, `Document Control`, `Revision History`, `Executive Summary`,
  `Table of Contents`, `Abbreviations and Glossary`, then `1. Introduction`, `2. Aim and
  Objectives`, `3. Project Scope`, `4. Standards and Compliance Alignment`, `5. Literature
  and Technology Review`, `6. System Architecture Design`, `12. Implementation Plan and
  Schedule`, `13. Testing, Verification and Acceptance`, `14. Documentation and Evidence
  Management`, `15. Risk Management`, `16. Project Management and Team Organisation`,
  `17. Expected Outcomes and Deliverables`, `18. Conclusion`, `19. References`,
  `20. Appendices`. Appendices are inside §20 (`20.1 …` etc.). No §7–11 present.
- **VOL2 = sections 7–11 only, no front matter.** Its 5 `Heading2` texts are exactly
  `7. Microsoft Server Networking and Network Services`, `8. Linux Server Administration`,
  `9. Cisco Networking`, `10. Network Automation`, `11. AI Network Management`. It does
  carry `TitlePageTitle`/`TitlePageSubtitle`/`TOCHeading` styled paragraphs (the volume
  cover and TOC), and no `Executive Summary`/`Document Control`/`Revision History`/
  `Abbreviations and Glossary` — consistent with "no front matter".

## R7 — The user's originals — PASS, untouched

| File | Bytes | Expected | SHA-256 | Verdict |
|---|---|---|---|---|
| `AY2627_FYP topics_v2_Victor Li.docx` | 30,949 | 30,949 | `1B847CF41700BD1DB3C0E3D5E540BC349674A8177B057AD9AC09F897B4AAFB4E` | exact match |
| `image.png` | 141,462 | 141,462 | `E2001305D91C2DDF02F8F77310C52459A1C6855CF79D057F564C13C866967FDF` (not specified) | correct size |

Neither file was opened with the SDK, Word COM, or Word — only `Get-Item` / `Get-FileHash`.

## R8 — Workspace root tidiness

Root listing **before** (excluding the audit's own scratch directory):

```
proposal\                                  (dir, untouched)
AY2627_FYP topics_v2_Victor Li.docx        30,949
convert.js                                  0        <-- stale
FYP-Proposal-COMPLETE-ZH.docx           1,036,581
FYP-Proposal-COMPLETE-ZH.md             1,880,702
FYP-Proposal-COMPLETE.docx                924,009
FYP-Proposal-COMPLETE.md                1,974,691
FYP-Proposal-Volume1-Plan-ZH.docx         384,608
FYP-Proposal-Volume1-Plan.docx            350,547
FYP-Proposal-Volume2-Technical-ZH.docx    660,169
FYP-Proposal-Volume2-Technical.docx       582,139
image.png                                 141,462
validate.ps1                                3,818   <-- stale third copy
_probe_zip.js                               0        <-- stale
```

`_validate-complete.txt`, `_validate-vol1.txt` and `_validate-vol2.txt` were **not present**
(already gone before this audit) — nothing to move.

Moved (not deleted) to `$env:TEMP\fyp-root-cleanup\`, byte- and hash-verified at the
destination:

| Moved | Bytes | SHA-256 | Destination check |
|---|---|---|---|
| `convert.js` | 0 | E3B0C442… (empty file) | present, 0 B, hash match |
| `_probe_zip.js` | 0 | E3B0C442… (empty file) | present, 0 B, hash match |
| `validate.ps1` | 3,818 | `6709A8EAD159EC191BE0FBD79556F94F0E38AAC6F50ADEF844BF70FD28822425` | present, 3,818 B, hash match |

`validate.ps1` was confirmed stale: it is a **truncated fragment** (no `param` block, no
functions — it begins mid-body at the coverage-presence proof) of the canonical
`proposal\tools\md2docx\validate.ps1` (50,885 B, SHA-256
`4E066BA535405B83FDC33CE371F98651B5C83E4C09804E316FF94FDFD04C0C5D`), which is intact.

Root listing **after**:

```
proposal\                                  (dir)
AY2627_FYP topics_v2_Victor Li.docx        30,949
FYP-Proposal-COMPLETE-ZH.docx           1,036,581
FYP-Proposal-COMPLETE-ZH.md             1,880,702
FYP-Proposal-COMPLETE.docx                924,009
FYP-Proposal-COMPLETE.md                1,974,691
FYP-Proposal-Volume1-Plan-ZH.docx         384,608
FYP-Proposal-Volume1-Plan.docx            350,547
FYP-Proposal-Volume2-Technical-ZH.docx    660,169
FYP-Proposal-Volume2-Technical.docx       582,139
image.png                                 141,462
```

All eight deliverables, `proposal\`, the user's original and `image.png` are untouched.
No other item was ambiguous enough to need flagging.

## R9 — Overall verdict: **REJECT**

**Reasoning.**

Every mechanical gate the task specifies is green, and I re-derived each one:
hashes/sizes exact (R1); Open XML SDK 0 errors on all six with stable hashes (R2); my own
independent raw-ZIP/XML checker clean on all six, plus `verify-package.ps1` 6/6 PASS and
`tablecells.ps1` 0 ragged (R3); all seven bad strings absent and the correct forms present
(R4, bad-string half); additivity exact on every requested metric in both languages (R6);
the user's originals intact (R7); root tidied (R8).

I still reject, because **the prose in all six deliverables is systematically scrambled**,
and no gate in the pipeline can see it. This is the same defect class the producer says it
just fixed, so it is squarely in scope:

- `FYP-Proposal-COMPLETE.docx`: of 2,785 source prose sentences of ≥15 words (non-table,
  non-heading), only **1,110 are contiguous** in the document; **1,107 have their head and
  tail present separately, in the wrong order**; 568 could not be located at all.
- `FYP-Proposal-Volume2-Technical.docx`: 467 contiguous vs **713 scrambled** of 1,617.
- `FYP-Proposal-Volume1-Plan.docx`: 643 contiguous vs **393 scrambled** of 1,168.
- `FYP-Proposal-COMPLETE-ZH.docx`: 835 contiguous vs **1,310 scrambled** of 2,613 — the ZH
  documents are affected at least as badly as the English ones.
- 388 / 130 / 258 prose paragraphs in COMPLETE / VOL1 / VOL2 contain a missing separator
  between two sentences (`figure.Cisco Packet Tracer`, `changes.Network Automation`,
  `guest.Linux Server Administrations`, `hostThe entire environment`, `audit.Change-management`).

Two distinct, reproducible mechanisms:
1. **Reordered fragments.** A paragraph appears with its own later part printed first
   (`… second is the working technical environmentTwo deliverables, treated as equally
   important. The first is the …`; `… the third due-diligence condition directly.Identity
   and Windows platform deficiencies (L1 — Microsoft Server Networking and Network
   Services).`). Table rows are affected too
   (`… 0 times occur evidence and screenshot, capture, screen a WorldSkills requirement.
   The strings notThe requirement to capture screenshots is …`).
2. **Fragments concatenated with no separator**, producing the run-on text that R4 exposes.

Why the producer's "all gates green" is not exculpatory: `validate.ps1`'s completeness gate
tests **presence, not order** (`$docxFlat.IndexOf($needle)`), so scrambled text still scores
99.65–99.99%, and the two gate failures the producer does report are the benign
`H1 count` false-alarm and the `.md`-frame `horizontal rules` mismatch. The
`final-acceptance-report.md` was additionally written 35 minutes **before** the artefacts it
describes, and quotes a different COMPLETE.docx size (925,582 vs 924,009), so it does not
audit this build.

**Corrections to the producer's specific claims.**

| Producer claim | Verdict |
|---|---|
| all gates green | Half true: SDK/verify-package/tablecells/COMPLETE-coverage are green; the volumes DO fail `H1 count`, and both COMPLETE docs DO fail `horizontal rules` against their own `.md`. Both are benign, as argued. |
| 8-frame-separator horizontal-rule cause | **Confirmed** — 52 real rules in sources and in the document; 60 in the generated `.md` = 52 + 8 frame separators; the `.md` banner documents them. |
| VOL1/VOL2 `H1 count mismatch` | **Confirmed**, and it is a validator off-by-one (markdown H1 = 0, document H1 = 0, yet it computes `(0-1) != 0`). |
| 704/704 soft breaks correct | **NOT reproduced; contradicted.** Independent counting shows hundreds of fragment joins with no separator, plus large-scale reordering. |
| residual lines are banner/comment, emphasis, or a 2-line caption | **Partly correct.** Categories (i) and (iii) verified; but ~43 of 53 are real prose present in scrambled order, not merely emphasis artefacts. |
| "no content is missing" | **Agreed**, on the evidence I checked (7 hand-checks): the text is present, but reordered/merged. |

**What I could not verify / limitations.**

- I did not reproduce the producer's exact 704-break count; I have no access to its pairing
  method, and my own method contradicts the result on the artefacts as delivered.
- I hand-checked 7 of the 53 "not found verbatim" lines (target ≥5) rather than all 53.
- I did not attempt to localise the scrambling inside `convert.js` (forbidden to modify,
  and the task is audit-only). I cannot therefore say whether this scrambling was
  introduced by the soft-break change or pre-existed it; the available backups
  (`convert.js.bak-before-softbreak-fix` etc.) would let the producer settle that quickly.
- I ran `FYP-Proposal-COMPLETE-ZH.md` only against the ZH document, not the ZH documents
  against ZH section sources, because `proposal\i18n\` was out of scope for reading beyond
  what was needed; the ZH reordering result was obtained by direct ZH-source-to-ZH-document
  sentence comparison instead.
- `validate.ps1` writes no artefacts, and I confirmed by re-hash that all eight deliverables
  were unchanged after every gate run.
