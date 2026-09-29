# Short-proposal shortening log — 2026-09-29

**What this file records.** One piece of work: shortening the project's **immediate submission**, `FYP-Proposal-SHORT.md`, on the owner's instruction, and expressing its tables as prose wherever prose could carry the content.

**Headline.** The proposal went from **20,598 words to 16,678** by this file's counting method (a 19.0% reduction), and from **131,405 bytes to 109,280**; its render went from **65,799 bytes to 53,753**. Its table mass fell from **288 rows to 88**. **The owner asked for roughly half, and the honest floor was not reached** — the residual, its cause and the exact cost of closing it are in §6, and the trade-off is the owner's to take.

---

## 1. Before and after, measured

| Artefact | Before | After | Change |
|---|---|---|---|
| `FYP-Proposal-SHORT.md` | 131,405 B / `B3A933B27E5F58C7E8104831558933BD89F289FCE9C6B44A543BE93468775BD3` | **109,280 B / `2DF3AB4497415CC1BC9887595E7ABEFA8E10268C23D29DD1ECD52D8C19544DE0`** | −16.8% bytes |
| `FYP-Proposal-SHORT.docx` | 65,799 B / `869882D5140F67081D2AC0B3682F9DCF505127EA351C4C29E9B8282BA1493EA3` | **53,753 B / `4FCF5E0C5D2518F79A9319D6ADBB6B4CFEAF81054F44FDE86582A530EFA609C6`** | −18.3% bytes |
| Words, whole document (prose + table cells) | 20,598 | **16,678** | **−19.0%** |
| Prose words, excluding tables and headings | 10,251 | 13,416 | **+30.9%** |
| Words inside table rows | 10,347 | 3,262 | −68.5% |
| Table rows | 288 | **88** | −69.4% |
| Render: paragraphs / H2 / tables / list items / figures | — | 310 / 15 / 7 / 71 / 1 | — |

**Read the prose row carefully, because it is the trap in this work.** Dissolving tables into prose moves words into the prose count: the document became **19% smaller overall while its prose grew by 30%**. The project's own record measures this deliverable in *prose* words (`agent.md` §3: "9,996 prose words (ceiling 10,000)"). By that measure alone the shortened draft looks **larger** than what it replaces, even though it is materially shorter. **The owner chose the total-word measure when this was put to them, and the tables-to-prose instruction is theirs**; the two instructions pull in opposite directions on the prose metric, and this row is where that shows.

**The seven tables that remain** are the three the project treats as registers (the `D-01`…`D-16` decision register, the `RW-01`…`NR-03` device-reachability matrix, the `R1`–`R22` risk register), the front-matter table, the group-members table, the supervisor table and the gate table. Every other table was dissolved, with its reason recorded by the author who dissolved it.

## 2. Method, and why it was done this way

The owner's two instructions — "shorten it by about half" and "express tables as prose wherever possible" — were put to them as a question first, because they conflict: a table is the denser form, so converting one to prose normally *adds* words. The owner chose a **total-word target of about 14,000** and **dissolving tables wherever prose can carry the content**. Both choices are theirs and are recorded here.

The work then ran in three stages:

1. **A shared contract** (`proposal\short-halving\00-brief.md`) bound nine chapter authors, each writing one fragment and no other file. It required every identifier, figure, caveat and `[TO CONFIRM]` to survive; forbade invented facts; forbade any claim that a Packet Tracker device is reachable; and listed the converter's Markdown rules.
2. **A second-pass ruling** (`01-second-pass-ruling.md`) after every author reported it could not reach its ceiling. The ruling diagnosed the residual as **duplication rather than substance**: the document stated many of the same rules in three or four chapters, because no chapter author could see the others. It published a **single-home allocation** — estate detail in section 5, the build order in sections 1–2, the Packet Tracer unreachability rule in 4.5, the reductions in 3.3, the evidence standard in 12.3, the permission model in 7.4, the standards position in 9, the deliverables in 12 — and **explicitly authorised** deleting restatement of anything whose home is elsewhere. It also withdrew two of my own instructions after measurement showed them wrong (see §4).
3. **One integration editor** (`02-integration-editor-brief.md`), the only agent who could see the whole assembled document, tasked with enforcing the single-home rule across chapter boundaries.

**Two coordination failures were caught and handled**, both from the project's own recorded hazards:

- **A concurrent edit (V3).** Chapter 02's author was still rewriting `02-introduction.md` after the other eight had finished, while the integration editor had begun. The project has already been damaged once by two agents holding one file — a stopped writer left a partial edit that reverted a completed fix — so the writer was **interrupted immediately**, its fragment was then read in full to confirm no partial edit had been left (it was complete and coherent), and the integration editor was told to re-read that file from disk before touching it.
- **A false "deferred to section N" (found by reading a report against the source).** Chapter 02 deleted the host organisation's site and staffing facts on the stated ground that section 5 owned them. **Section 5 does not contain them** — a search of all ten fragments found them nowhere — so the deletion removed them from the proposal rather than deferring them. The business-model clause was restored (`selling software as a service to insurance brokerages`); the per-site staffing figures and site names were **deliberately not restored**, because they are scenario texture rather than content a supervisor ratifies, the multi-site nature survives in §2.2's own "routed multi-site network", and the word budget is better spent on substance. **They are therefore gone from this deliverable, by decision, and this line is the disclosure.** The integration editor then re-ran that check across all ten fragments and found no other false deferral.

## 3. Verification performed

| Check | Method | Result |
|---|---|---|
| **The source was never edited by a writer** | `Get-FileHash` on both deliverable files, re-run after every writer finished | **both matched the pins at every check**, right up to the deliberate publication |
| **A verified backup exists before anything was touched** | copied both files into `proposal\integration\backup-short-halving\` and compared SHA-256 with the pins | **verified: `B3A933B2…` and `869882D5…`** — and the backup is what the independent verifier diffs against |
| **Word was holding the file** | `Get-FileHash` failed with a sharing violation; `Get-Process` showed `WINWORD` | the owner closed Word; the file then hashed **identical to its pin**, which proves **that Word session changed nothing** |
| **No identifier was lost** | the assembler extracts 15 identifier classes from the original backup and diffs them against the draft, and **refuses to publish** while any is missing | **caught eleven missing: `D1`–`D12`.** The deliverables table had been dissolved and its identifiers dropped with it. They were restored inline, and the check then reported **none lost** |
| **The identifier check itself had a blind spot** | the first version matched `D-\d+` only, so the **bare** deliverable references `D1`…`D12` were invisible to it | **my defect, found by the check failing to fire when an author said it had dropped them.** The class was added and the loss surfaced immediately |
| **The render is current, not stale (V5)** | delegated to the independent verifier, which extracts `word/document.xml` from a memory-stream copy of the raw ZIP | recorded in §7 |
| **SDK schema gate** | `sdk-validate.ps1` | **ERRORS: 0**, `openFailures=0 validationErrors=0 rawIssues=0` |
| **Package gate** | `verify-package.ps1` | **PASS — all 9 checks passed** |
| **Coverage gate** | `validate.ps1 <docx> -MarkdownPath <md>` | **PASS**, 0 notes: every source content line is present |
| **Nothing new was published over a working file** | the assembler writes a **staged** file by default and replaces the deliverable only under `--publish`, which is itself blocked while identifiers are missing | the deliverable was replaced **once**, deliberately, after the staged draft passed the identifier gate |
| **No `.docx` was opened by path anywhere in this work** | no SDK, COM or Word invocation; the render came from the project's own converter and every other read was a hash or a raw-ZIP read | **H1/H12 held throughout** |

## 4. Two of my own instructions were wrong, and were withdrawn after measurement

1. **"A bold span ending in a full stop breaks the converter."** I carried this from the project manual into the contract. **Measurement says otherwise**: the original document contains **53** such spans and passes coverage at 100%, and a throwaway render containing one passed coverage. **Withdrawn**, and authors who had stripped the source's emphasis to comply were told to restore it.
2. **"The evidence standard's home is section 8.5."** I invented that section number. Section 8 is the implementation plan with subsections 8.1–8.3; there is no 8.5. Because the single-home ruling told authors to defer the evidence standard to it, **the pointer "the evidence standard of section 8" was written into the document and pointed at nothing.** Both were fixed at publication: the pointer now sits in section 12.3 where the standard actually is, and **two rules that had been lost in the process were restored** — that an uncaptioned capture is treated as absent, and that a reachability claim with no transcript is listed as unverified. They existed only in my briefs and nowhere in the document, which is exactly the kind of loss a "deferred" fact suffers when its claimed home does not carry it.

## 5. Contradictions and ambiguities the authors found in the source, reported rather than resolved

Every one of these is a defect in the **existing** proposal, not in the shortening, and none was silently reconciled. They are the most valuable output of a task like this, because a shortening pass forces a writer to read every sentence closely.

1. **"Six of the twelve objectives are verified by a gate"** (line 106) against **ten** objectives carrying an "*Assessed at gate …*" clause (lines 93–104). The count and the tags disagree.
2. **"withdraws three statements"** (line 81) against the outline's **`W1`–`W11`, eleven-row** withdrawal table. The mapping is not one-to-one.
3. **Who withdraws them** — the student's clarified intent (proposal) or the outline itself (outline §L.4 heading).
4. **The host organisation's regulator** — the proposal has the *clients* regulated by the Hong Kong Insurance Authority; the frozen baseline calls the *firm* an "SFC-licensed wealth-management software vendor".
5. **Cisco configuration automation** — the baseline says "no claim of automated device configuration may be made"; the outline calls reachable-SSH automation the direct replacement for the old "two-track" approach.
6. **The isolated laboratory segment's prefix** — `10.70.0.0/16` in the outline and the baseline's allocation table, `10.70.0.0/24` in the baseline's own VLAN and trust-boundary tables. The shortened document carries **no prefix** for that segment and so propagates neither figure.
7. **`VP-HQ-FW-01` is two devices under one name** — a not-reachable Packet Tracer logical device *and* the conditionally reachable `RW-08` ASA-class row with a live management address. The document never uses the identifier.
8. **The risk register's length** — 22 rows in the proposal against 21 in the outline; **`R22` exists only in the proposal**.
9. **The probe set** — "twenty fixed probes" in the proposal against "~20" in the outline.
10. **The immediate-submission window** — 1–3 weeks in the proposal against 2–3 in the outline; and "clear of G1, G2 and G2-H" against "before G2/G2-H", where a week-2 start is not clear of G1 at week 3.
11. **The week-1 MCP skeletons** against the rule that no MCP server may be written before its host is reachable, and against the Linux server's week-7 slot — reconcilable only implicitly, as skeletons versus implemented servers.
12. **Week 3 carrying live services** while G2 at week 6 is where every required service is verified.
13. **Week 3 carrying both `G1` and replicating domain controllers** while G2 is the verification point.
14. **Is the licence check blocking now?** The proposal marks the D-12 check "BLOCKING NOW (B2)" alongside platform ratification; `agent.md` calls ratification "the only blocker" with D-12 checked the same day.
15. **`D-01` as a "week-1 decision"** against `G0` gating on D-01 being answered and signed off — whether "week 1" and "G0" are the same event is left open.
16. **The decision register has no owner column** while the risk register has one.
17. **The 2026 page "contains zero occurrences of … evidence"** while the same section requires a technical document for sign-off — preserved as written.
18. **`B3` and `D-10`** appear only in the decision register, so the risk register's model risk carries no pointer to either.
19. **§7.3.5's documentation server** carries no service identity in the source, so none was invented for it.
20. **The research pack's total row** has one cell fewer than its sibling rows (in the standards evidence pack, not this document).

## 6. The residual, and exactly what closing it would cost

**The owner's instruction was about 14,000 words. The document stands at 16,640, so the residual is about 2,640 words (16% of the target).** The integration editor's independent attempt to find them yielded **134 words — 0.8%** — and its conclusion, which the measurements support, is that the nine chapter authors had already removed the duplication the estimate assumed was still there.

**What the residual consists of, measured.** These blocks may not lose a named item without ceasing to be what they are:

| Protected block | Words |
|---|---|
| Risk register `R1`–`R22` (22 rows) | 1,079 |
| Decision register `D-01`–`D-16` (16 rows) | 1,019 |
| Gate table and weekly plan | 987 |
| Objectives and completion conditions `C1`–`C8` | 757 |
| Device-reachability matrix (13 rows) | 727 |
| `§7.3` tool surface — 36 named tools | 634 |
| References | 470 |
| Front matter | 257 |
| Governance `G1`–`G10` | 149 |
| `PB-1`–`PB-9` suite | 79 |
| Agent must-never list | 34 |
| **Subtotal** | **≈6,200** |

That is before counting section 6's service plan, section 9's standards argument or section 5's architecture.

**What closing the remaining 2,640 words would require — the owner's choice, not mine:**

1. **Dissolve the risk register** (−800 or more) — it stops being comparable row by row, which is why it stayed a table.
2. **Cut the decision register to a status list** — dropping the Options and Consequence columns (−330). **I refused this once already**, because the consequence of deciding otherwise is what a supervisor reads when ratifying a row.
3. **Drop the Packet Tracer qualifiers or the reachability rule** — **refused outright**: a shorter sentence that reads as a reachability claim is a defect, not a saving.
4. **Cut the weekly plan to phases** (−250) — loses week-level accountability.
5. **Reduce the 38-service plan or the 36-tool surface to names without their verification or signature** (−500 or more) — turns checkable evidence into unverifiable labels.
6. **Delete the section 5 architecture detail** (zones, addressing, the isolated segment) — breaks the scope statement.

**No combination of the safe options reaches 14,000.** Getting there requires at least one of items 1, 2, 4 or 5, and each of those trades a control for length. **That trade is the owner's, and this log does not take it.**

## 7. Independent verification

**Commissioned, and its verdict is that the shortening preserved the substance — with three defects, all now repaired (§9).** The verifier was read-only, was given the pre-shortening backup as its reference, and was asked above all to test the failure this task actually produced — whether each fact an author "deferred to section N" is really present in section N.

| Check | Verdict | The measurement that decided it |
|---|---|---|
| **Deferred facts really land (12 checked)** | **11 PASS, 1 FAIL** | Each claimed home was opened. Section 5 does carry the estate counts, the per-family interfaces and the ports; 5.1 carries the packet-capture interface; 8.2 and 6.7 carry the build order; 7.4 carries the permission model with all six proposal fields; 3.3 carries both reductions; 9 carries the standards position; 12.1–12.2 carry the deliverables with all twelve identifiers; 11 carries the complete `R1`–`R22` register; 10 carries the complete `D-01`–`D-16` register; 4.5 carries the scope boundary. **The failure was a pointer, not a fact**: the `D-09` row cited "the fixed template **of section 8**", and section 8 is the implementation plan with subsections 8.1–8.3 and no template anywhere — while the template itself does survive at 12.3 |
| **Identifier and figure survival** | **PASS — zero losses** | an exhaustive word-boundary token diff of both files found **no backup-only token** across `D-01`…`D-16`, `D1`…`D12`, `B1`–`B3`, `G0`–`G6`, `G2-H`, `UC-1`…`UC-6`, `PB-1`…`PB-9`, `C1`–`C8`, `R1`–`R22`, `Stage A`–`D`, `T0`–`T3`, all twelve hostnames, all thirty-six tool names, the ports, the prefixes and every page and word band. `SQ-1`…`SQ-5`, `E1`–`E9` and `TB-01`…`TB-16` are **absent from the backup itself**, so they are not losses; and `RW-01`…`NR-03` appear **only** in the shortened document as new row labels, traceable to the outline, which uses them |
| **The qualifier-loss test — the one asked for** | **PASS** | all sixteen Packet Tracer sentences are denials, and the executive summary's safety clause kept **both** its negation and its "so nothing can manage them" consequence; the per-protocol enumeration also survives at 4.5 and 5.4. **No sentence became a reachability claim by losing its qualifier** |
| **No invented content** | **PASS** | twelve load-bearing claims traced to the backup, the outline or the manual; the only new wordings are "seven gates" (arithmetically `G0`–`G6`) and the reworded evidence rule from the outline's §H.2 E1 |
| **Forbidden claims** | **PASS — none** | no Packet Tracer reachability claim; "autonomous" appears twice, both times as a denial; zero reliance on `legacy\`; all three withdrawn framings appear only as withdrawn |
| **`[TO CONFIRM]` markers** | **PASS, and my premise was wrong** | the verifier measured **17 in both** files, line-for-line identical, not the 17-against-14 I had assumed — so nothing was added and nothing dropped. Every one is genuinely unresolved by the corpus |
| **Structural integrity** | **PASS** | fifteen H2s in both files, identical set, order and numbering; no section renamed, merged, dropped or added; `[TOC]` once in both; no H1 in either |
| **Render is current (V5)** | **PASS** | three post-shortening features found by extracting `word/document.xml` from a memory-stream copy; both files' hashes identical before and after the read |

**What the shortening did not preserve**, stated narrowly, because the verdict should not be read as "nothing was lost":

1. **The false `D-09` pointer** (§9 item 1) — repaired.
2. **Two caveats dropped from completion conditions C1 and C8** (§9 items 2 and 3). Both facts survive elsewhere, but §3.3 is the one place where the single-home rule was applied to a condition that needs to be self-contained: without C1's exemption a **correct** classic-IOS deployment could be marked as failing C1.
3. **The `95 per cent` assessment-alignment figure** — gone, and it exists in the backup only. The verifier's own reading is that its deletion removed an *understatement* rather than a truth: section 9.1 states coverage of all six domains, 5+5+25+25+15+25 = 100. **Left deleted**, and disclosed here.
4. **The tool-signature numeric bounds** — repaired (§9 item 4).
5. **The host organisation's site and staffing premises** (110/28/12/4, the four site names) — left deleted by decision, disclosed in §2.
6. **Figure 1's in-figure port and host evidence**, and **7.2's requirement that the optional peer node join the reachability table as a reachable row** — the figure is no longer readable standalone, the requirement is no longer stated. **Left as compression choices**, with the facts locatable in 5.1 and 5.4 respectively.

**Why the verification is not optional here.** The project's hardest lesson is that a worker's own "all green" report is not evidence — a note once certified "20 bar rows, 0 alignment failures" while **11 of 20 were measurably wrong**. This very task has already produced two defects that no author's self-report caught: eleven lost identifiers, found only by the assembler's mechanical diff, and a pointer to a section that does not exist, found only by the integration editor reading the whole document.

## 8. Consequences for other records

1. **`agent.md` §3's pinned hashes for this deliverable are superseded.** Its table records `FYP-Proposal-SHORT.md` at `B3A933B2…` and the render at `869882D5…`; both are now the previous revision. **The manual has been amended in place to record the new pins as current and the old ones as the archived revision**, because a stale pin reads to the next agent as evidence that the file was tampered with.
2. **`source-integrity-manifest.md` is again stale**, and by more than one row: this log adds one `.md` file under `proposal\integration\`, the halving working folder adds several under `proposal\`, and two integration reports were amended after the manifest was taken. **Re-run the manifest to re-baseline.**
3. **The root now holds nine files**: the two original deliverables, the initial report and its render, the user's topic sheet and image, this project's `agent.md`, and the evidence tree's README is elsewhere. The submission surface is larger than the "six files plus this manual" that `agent.md` §9 describes. **That row is not amended by this log** and should be, by whoever next maintains the manual.
4. **The backup folder `proposal\integration\backup-short-halving\` must not be deleted.** It is the only copy of the pre-shortening revision, and it is the reference the independent verifier diffed against.

---

*Written 2026-09-29 by the incoming agent from measurements taken in this session, and amended once after independent verification (§9). Every size and hash was read with `Get-FileHash`/`Get-Item`; the `.docx` files were hashed and rendered but never opened by path; no existing file was modified except the fragment files named in §4 and §9 and the manual rows named in §8.1.*

---

## 9. Post-verification repairs — four, each verified against the backup before publication

The independent verification found one false cross-reference and two dropped caveats, and the qualifier test it ran also confirmed a fourth loss the authors had reported. All four were repaired in the fragment files, and **every repaired sentence was checked against the pre-shortening backup myself before it was written**, rather than trusting the verifier's summary of it — the project's rule is that an agent's report is not evidence.

| # | Repair | Where | The backup line that authorises it |
|---|---|---|---|
| 1 | The `D-09` row's pointer **"the fixed template of section 8"** now reads **"of section 12.3"** | `08-standards-decisions.md`, decision register | the backup's `D-09` row carries **no section pointer at all**, and the template it describes lives in the backup's §12.3 paragraph. Section 8 is the implementation plan and contains no template. The verifier proved the pointer was **newly introduced** by the shortening, not inherited |
| 2 | **C1 regained its exemption**: "RESTCONF is conditional by design and is **not** required to pass C1; the image decides it." | `03-aims-scope.md`, §3.3 | backup line 114: *"The third interface is conditional by design and is not required to pass C1; the platform's own image decides it."* **This mattered substantively:** without it, a correct classic-IOS deployment — the platform's primary case — could be marked as failing a completion condition |
| 3 | **C8 regained its acceptance criterion**: the documentation set exists "**in English with the Chinese companion summary**" | `03-aims-scope.md`, §3.3 | backup line 121: *"The documentation set of section 12 exists in English, with the Chinese companion summary"*, and the language split is separately fixed by `D-08` |
| 4 | **The tool-signature bounds were restored**: "at most 500 lines or 32,768 bytes, 500 events, 200 rows and 20 object identifiers" | `06-layer2.md`, §7.4's credential and output rules | backup lines 340, 344, 357, 376, 377 and 379 — `max_lines: int<=500`, `max_bytes: int<=32768`, `max_events: int<=500`, `oids: [str]<=20`, `max_rows: int<=200`. These were the only concrete evidence behind the claim that **tool output is bounded**, a stated security property; the general claim survived the shortening while its numbers did not |

**After the repairs the document was re-assembled, re-published, re-rendered and re-gated:** SDK **0 errors**, package **9/9 PASS**, coverage **PASS**. The four repaired sentences were then confirmed present in the new render by extracting `word/document.xml` text from the raw ZIP — the pointer, the C1 exemption, the C8 language clause and the byte bound were each found. The final artefacts are **109,280 bytes / `2DF3AB4497415CC1BC9887595E7ABEFA8E10268C23D29DD1ECD52D8C19544DE0`** and the render **53,753 bytes / `4FCF5E0C5D2518F79A9319D6ADBB6B4CFEAF81054F44FDE86582A530EFA609C6`**.

**The repairs cost 38 words** (16,640 → 16,678). That is the honest price of making a completion condition self-contained and a cross-reference true, and it is charged against a target that was already missed — not hidden by trimming something else to compensate.

**Two further corrections the verification forced on this log**, both of them my errors rather than the document's: the `[TO CONFIRM]` count is **17 in both** versions, not "17 against 14" as I had recorded from an author's report; and `SQ-1`…`SQ-5`, `E1`–`E9` and `TB-01`…`TB-16` were **never in this deliverable**, so their absence is not a shortening loss.
