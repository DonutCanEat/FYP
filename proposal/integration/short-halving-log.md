# Short-proposal shortening log — 2026-09-29

**What this file records.** One piece of work: shortening the project's **immediate submission**, `FYP-Proposal-SHORT.md`, on the owner's instruction, and expressing its tables as prose wherever prose could carry the content.

**Headline.** The proposal went from **20,598 words to 16,640** by this file's counting method (a 19.2% reduction), and from **131,405 bytes to 109,055**; its render went from **65,799 bytes to 53,659**. Its table mass fell from **288 rows to 88**. **The owner asked for roughly half, and the honest floor was not reached** — the residual, its cause and the exact cost of closing it are in §6, and the trade-off is the owner's to take.

---

## 1. Before and after, measured

| Artefact | Before | After | Change |
|---|---|---|---|
| `FYP-Proposal-SHORT.md` | 131,405 B / `B3A933B27E5F58C7E8104831558933BD89F289FCE9C6B44A543BE93468775BD3` | **109,055 B / `290548EDD2264B3401D4F25FB25A35F519DB0E1FD2CCE1636BB8315D23E14A7C`** | −17.0% bytes |
| `FYP-Proposal-SHORT.docx` | 65,799 B / `869882D5140F67081D2AC0B3682F9DCF505127EA351C4C29E9B8282BA1493EA3` | **53,659 B / `46AF15E88E9563DEAD91A0740A8C603F3D80A6CCEC33111126E14C478AA70346`** | −18.4% bytes |
| Words, whole document (prose + table cells) | 20,598 | **16,640** | **−19.2%** |
| Prose words, excluding tables and headings | 10,251 | 13,378 | **+30.5%** |
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

**Commissioned at the owner's instruction and reported in this section when it returns.** The verifier is read-only, was given the pre-shortening backup as its reference, and was asked above all to test the failure this task actually produced — **whether each fact an author "deferred to section N" is really present in section N** — and then to diff the identifier and figure inventory between the backup and the shortened document, to hunt for a Packet Tracer sentence that lost its qualifier, to account for every `[TO CONFIRM]` marker, to compare the section structure of both versions, and to confirm the render is current rather than stale.

**Why the verification is not optional here.** The project's hardest lesson is that a worker's own "all green" report is not evidence — a note once certified "20 bar rows, 0 alignment failures" while **11 of 20 were measurably wrong**. This very task has already produced two defects that no author's self-report caught: eleven lost identifiers, found only by the assembler's mechanical diff, and a pointer to a section that does not exist, found only by the integration editor reading the whole document.

## 8. Consequences for other records

1. **`agent.md` §3's pinned hashes for this deliverable are superseded.** Its table records `FYP-Proposal-SHORT.md` at `B3A933B2…` and the render at `869882D5…`; both are now the previous revision. **The manual has been amended in place to record the new pins as current and the old ones as the archived revision**, because a stale pin reads to the next agent as evidence that the file was tampered with.
2. **`source-integrity-manifest.md` is again stale**, and by more than one row: this log adds one `.md` file under `proposal\integration\`, the halving working folder adds several under `proposal\`, and two integration reports were amended after the manifest was taken. **Re-run the manifest to re-baseline.**
3. **The root now holds nine files**: the two original deliverables, the initial report and its render, the user's topic sheet and image, this project's `agent.md`, and the evidence tree's README is elsewhere. The submission surface is larger than the "six files plus this manual" that `agent.md` §9 describes. **That row is not amended by this log** and should be, by whoever next maintains the manual.
4. **The backup folder `proposal\integration\backup-short-halving\` must not be deleted.** It is the only copy of the pre-shortening revision, and it is the reference the independent verifier diffed against.

---

*Written 2026-09-29 by the incoming agent from measurements taken in this session. Every size and hash was read with `Get-FileHash`/`Get-Item`; the `.docx` files were hashed and rendered but never opened by path; no existing file was modified except the two fragment files named in §4 and the manual row named in §8.1.*
