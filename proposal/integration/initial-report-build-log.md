# Initial-report build log — 2026-09-29

**What this file is.** The change record for one piece of work: producing `FYP-Initial-Report.md` and its render `FYP-Initial-Report.docx` from the project's current decision material, on the owner's instruction. It is a **new report appended to the history folder**. No existing file under `proposal\` was edited to produce it, and **neither existing deliverable was touched** — `FYP-Proposal-SHORT.*` and `FYP-Outline-DRAFT.*` still carry the hashes pinned at agent.md §3 (re-verified after all of this work; see §5).

---

## 1. What was produced, and where

| Path | Bytes | SHA-256 | Role |
|---|---|---|---|
| `FYP-Initial-Report.md` | 146,295 | `5F0BCC2F59C1B8A963AFF39C9C74FCE902E072597220D93AEFCB072506DB19AE` | **The deliverable source.** *(The revision the independent agent verified was 145,776 / `C5013BB9…2898`; two wording repairs followed — see §8.)* |
| `FYP-Initial-Report.docx` | 68,137 | `1CA306A0D5863EA9F3EDBECFA0B9CEA0F1424A554708BBA8D6C8CB9E46616267` | Its render: 284 paragraphs, headings `1/12/41/0`, 23 tables, 40 list items, 2 figures, 22,083 converter-counted words. *(Superseded revision: 67,924 / `F39D5DF0…C6B2`.)* |
| `proposal\initial-report\00-brief.md` | 10,288 | — | The shared contract every section writer was bound by (no invented facts, forbidden claims, converter rules, vocabulary lock) |
| `proposal\initial-report\assemble.js` | — | — | The assembler: normalises, concatenates in document order, runs structural self-checks, reports word counts. Node only, no dependencies, `--check` and `--allow-missing` modes |
| `proposal\initial-report\00-front.md`, `01-introduction.md` … `09-zh-summary.md` | — | — | The ten section fragments, each written by one author to one file |

**The document's shape.** Front matter; executive summary; 1 Introduction and background; 2 Aim and objectives, scope and completion conditions; 3 Literature and technology review; 4 Proposed methodology and design: the network and services layer, built first; 5 Proposed methodology and design: the AI management plane, built second; 6 Implementation plan; 7 Risks and mitigations; 8 References; 中文摘要（Chinese companion summary）. Measured: **23,083 words total, of which 15,932 are prose outside tables and headings**; 741 lines; 235 table rows; 2 figure placeholders; 26 `[TO CONFIRM]` markers.

## 2. Where the structure came from — and the one thing it cannot claim

The owner asked for an initial report "based on the current content". The project had already recorded where an initial report sits, and this build honours that record rather than inventing a scope:

- **`FYP-Outline-DRAFT.md` §H.3 (line 1055)** names the sequence an initial report is expected to follow — introduction and background; aims and objectives; literature and technology review; proposed methodology and design; implementation plan; risks; references — and states in the same sentence that **its exact required structure is `[TO CONFIRM]` against the programme handbook and is not invented here**. This report follows that recorded sequence and says so in its own front matter. **The handbook has not been checked, and no structure or word band is claimed as the programme's.**
- The earlier tier is unchanged and is restated in the report: **the immediate submission was the proposal alone (D5)**, and this report is a separate, later artefact. Nothing here is submitted in place of it.
- The content is derived from the current decision material only: the outline (authority), the condensed proposal, the frozen baseline for detail, the standards research pack, and `agent.md`. **The superseded `legacy\` corpus was neither read nor cited**, and every chapter was instructed in writing not to reach for it.

## 3. How the work was split, and what the writers were bound by

Seven section-writer agents ran in parallel, each writing **exactly one file**, each bound by `00-brief.md`, which required: every figure traceable to a named source section or marked `[TO CONFIRM]`; no invented hostname, address, version, URL, licence, price, date or metric; **never** an assertion that a Packet Tracer device is reachable, manageable, pollable or automatable; never `legacy\` as current; never the three withdrawn framings; never calling the AI layer autonomous; and the converter's Markdown rules (one paragraph per physical line, escaped pipes in tables, `[FIGURE: …]` alone on its line, no triple-asterisk emphasis, British English, GitHub-flavoured Markdown only).

Each writer reported back five things: the file and its size and word count; the source sections actually used; every `[TO CONFIRM]` with its reason; what it could not verify and therefore omitted; and **any contradiction found between sources, quoted from both**. That last requirement is why §6 below exists.

**Measured sizes against the bands set in the brief.** Six of the seven exceeded their band, and this is reported rather than smoothed over: chapter 1 at 1,572 words (band 1,400–1,700, inside), chapter 2 at 2,175 total of which 1,524 are prose and 608 are the required twelve-objective evidence list, chapter 3 at 2,036 prose (band ceiling 2,000, +36), chapter 5 at 2,939 prose (band 2,200–2,600, +13%, self-reported with its own compression note), chapter 6 at 1,798 prose but 3,628 words including its tables, chapter 7 at 1,009 prose plus a 22-row register. Two writers moved enumerations into tables specifically to claw length back. **No trimming was done by the assembling agent**: the report's own band is unconfirmed, an over-long honest draft can be cut by its owner whereas a thin one cannot be filled, and silently discarding sourced material to hit a band I invented would have been the wrong trade. **The measured figures are the record; the decision to cut is the owner's.**

## 4. Integrator changes — four, each for a stated reason

The assembling agent edited section files in four places, in every case to repair a defect the writer's own contract had caused or a link the document needed:

| # | Change | Reason |
|---|---|---|
| 1 | `05-ai-plane.md`: "the container-lab host" → **"the Cisco platform host"** | The writer had avoided the product name because the brief's vocabulary table did not license it, and coined a vague term instead. B1 requires the specification of **both** hosts, and the corpus names them (the model host and the CML host). A vague coinage is worse than the name it replaced |
| 2 | `05-ai-plane.md`: the Stage B row's exit-gate cell now names **gate G3, week 8 at the earliest** | The writer deliberately left the gate unnamed because two sources differed. `agent.md` §4.1 already adjudicates it ("closes at G3, week 8, at the earliest"), and chapter 6 prints the gate table — an unnamed gate would have left the two chapters unreconciled |
| 3 | `05-ai-plane.md`: added the **architecture figure placeholder**, naming the crossed-out arrow to the design-time simulator box | The corpus requires that figure, and specifically requires the crossed-out arrow to be drawn (D-11). No writer had inserted one, so the requirement would have been silently absent from the document |
| 4 | `06-plan.md`: the ratify-the-platform step now names **Cisco Modelling Labs** and names **Packet Tracer** as the design-time half of the fallback | Same root cause as change 1. The single blocking decision had been reduced to "a licensed virtual platform", which leaves an examiner and a supervisor with no recommendation to approve |
| 5 | `00-front.md` (the assembler's own file): the executive summary gained a paragraph stating **the one current blocker** and the recommendation | An executive summary that omits the single blocking decision is defective; chapter 6 §6.6 carries it, and the summary did not |

**No writer edited another writer's file, and no two agents held the same file at once** — the incident recorded at `agent.md` V3 (a concurrent edit that reverted a completed fix) was designed out by giving each author exactly one path.

## 5. Verification performed

| Check | Method | Result |
|---|---|---|
| **Markdown is unchanged by rendering and by the gates (V7)** | `Get-FileHash` before `convert.ps1` and after all three gates | `C5013BB9…2898` **both times — identical** |
| **SDK schema gate** | `sdk-validate.ps1 -Path FYP-Initial-Report.docx` | **ERRORS: 0**, exit 0, Office2013, SDK 2.9.1.0, `openFailures=0 validationErrors=0 rawIssues=0` |
| **Package gate** | `verify-package.ps1 -Path FYP-Initial-Report.docx` | **PASS — all 9 checks passed** |
| **Coverage gate** | `validate.ps1 FYP-Initial-Report.docx -MarkdownPath FYP-Initial-Report.md` | **PASS**, 0 notes: "every source content line is present in the document" |
| **Render is current, not stale (V5)** | delegated to an independent verifier, which extracts the `.docx` text from the raw ZIP and looks for three edits made after the first draft | recorded in §7 |
| **The pipeline works at all, before risking the deliverable** | a throwaway document in `$env:TEMP` run through all four tools | convert exit 0, SDK 0 errors, package 9/9, coverage PASS. **Nothing was written into the tree as scratch (H13)** |
| **The six pinned originals are untouched** | `Get-FileHash` on all six, re-run after every edit, render and commit in this work | **all six MATCH**, including `AY2627_FYP topics_v2 Victor Li.docx` at **30,949 / `1B847CF4…FB4E`** — the file damaged once before and never again |
| **No `.docx` was opened by path anywhere in this work** | no SDK, COM or Word invocation was made; the two rendered artefacts were produced by the project's own converter, and every other `.docx` was only hashed | **rule H1/H12 held throughout** |
| **Forbidden-claim sweep** | `grep` over all fragments for Packet Tracer + reach/manage/poll/automat/configure, `autonomous`, `OpenClaw`, `weakest line`, `legacy\` | **25 hits, all of them correct denials** — the Packet Tracer hits are sentences *denying* reachability, the "autonomous" hits are sentences refusing the label, and the withdrawn framings appear only as withdrawn. No violation found mechanically; the independent verifier re-checks this by reading |
| **Converter emphasis warning calibrated** | the assembler flagged 26 "bold span ending in a full stop" warnings; the outline contains **221** such spans and passes coverage at 100%, and a throwaway render containing one **passed coverage** | the warning is a **false positive**; no chapter text was changed for it |

## 6. Open items — reported, not silently resolved (V8)

**A. Cross-source contradictions found by the writers.** Each was reported with line numbers from both sides instead of being silently adjudicated, and each is a real defect in the corpus that a reader could otherwise trip over.

| # | Contradiction | Where |
|---|---|---|
| 1 | **Withdrawn statements: three, or eleven?** The proposal says the clarified intent "withdraws three statements"; the outline's §L.4 table carries **W1–W11, eleven rows**, every one typed withdrawn or superseded, and the mapping is not one-to-one | proposal line 81 vs outline lines 1467–1484 |
| 2 | **Who withdraws them?** The proposal attributes the act to the student's clarified intent; the outline's §L.4 heading attributes it to the outline itself | proposal line 81 vs outline line 1467 |
| 3 | **The host organisation's regulator.** The proposal says the *firm's clients* are regulated by the Hong Kong Insurance Authority; the frozen baseline describes the *firm itself* as an "SFC-licensed wealth-management software vendor" | proposal line 67 vs baseline line 75. The report follows the proposal, which is the higher authority |
| 4 | **Cisco configuration automation.** The baseline says "No claim of automated device configuration may be made"; the outline calls reachable-SSH automation the direct replacement for the old "two-track" approach | baseline line 1123 vs outline line 486 |
| 5 | **The isolated laboratory segment's prefix.** The outline and the baseline's allocation table say `10.70.0.0/16`; the baseline's own VLAN and trust-boundary tables say `10.70.0.0/24` — the baseline contradicts itself | outline 213/1411 vs baseline 167/201 vs baseline 268. **The report carries no prefix for that segment**, so it propagates neither figure |
| 6 | **`VP-HQ-FW-01` is two devices under one name.** It appears both among the 16 **not reachable** Packet Tracer logical devices and as a **conditionally reachable** `RW-08` ASA-class row with real SSH/SNMPv3; the baseline makes it a Packet Tracer object *and* gives it a live management address | outline 208/210/276 vs baseline 233/402/466. **The report never uses the identifier**, describing only "the ASA-class perimeter". Flagged as the project's standing consistency risk (R12) |
| 7 | **The risk register's length.** The proposal carries **R1–R22**; the outline carries **R1–R21**. **R22 — the absence from Hong Kong delaying the hardware record and therefore the model decision — exists only in the proposal**, and it is one of the three risks the report's §7.2 argues carry the most weight | proposal 627–650 vs outline 1375–1397. The report uses the proposal's 22-row register |
| 8 | **Risk wording drift** on R2, R15, R17 and R21 between the two registers | proposal 630/643/645/649 vs outline 1378/1391/1393/1397 |
| 9 | **The probe set: twenty, or approximately twenty?** The proposal says "twenty fixed probes"; the outline says "~20" | proposal 304 vs outline 531/564. The report uses the definite "twenty" |
| 10 | **The immediate-submission window.** The outline gives the proposal row **2–3** weeks; the proposal gives it **1–3**. Related: the proposal says the row sits "after G0 and clear of G1, G2 and G2-H", while the outline says "before G2/G2-H" — a week-2 start is not clear of G1 at week 3 | outline 888 vs proposal 535/530. The report uses 1–3 |
| 11 | **Is the licence check blocking now?** The proposal marks the D-12 check as "BLOCKING NOW (B2)" alongside the platform ratification; `agent.md` says the ratification is "the only blocker" with D-12 checked the same day | proposal 689 vs agent.md 305. The report treats ratification as the single blocker |
| 12 | **The unit of the deferred hardware item:** "the lab machine's specification for both hosts" versus "the laboratory machines' specification" | outline 1504 vs proposal 687. The report uses the plural |
| 13 | **Stage B's exit gate is named only outside the proposal.** The outline says Stage B closes at G3, week 8; the proposal names no gate id; the minimum-stage reduction says a project closing at Stage B meets **G4**, while the outline elsewhere places G4 at week 10 for the full Cisco set | outline 390/411/413 vs proposal 319/325. The report names G3 for Stage B's close and does not assert that Stage B closes G4 |
| 14 | **D-12's owner is not attested in the D-12 row itself.** The report names S1, on `agent.md` §5 item 3 and risk R2; the proposal's D-12 row names no owner | proposal 615 vs agent.md 188 |
| 15 | **The research pack's total row has one cell fewer than its sibling rows** — a formatting artefact, not a factual conflict | `research\wsos-2026-2447.md` line 67. The report quotes the six weights and lets the arithmetic stand |
| 16 | **The project title's punctuation.** The outline's H1 separates the two halves with an en dash; the proposal's front matter labels the hyphen form "exact". The report uses the hyphen form throughout | outline line 1 vs proposal line 8 |

**B. Items that are not contradictions but are unresolved by design.**

1. **The report's own band and required structure remain `[TO CONFIRM]` against the programme handbook**, which has not been consulted. The front matter says so.
2. **The single current project blocker is unchanged: B2 / D-01, the ratification of the Cisco platform**, a human decision requiring a recorded approval. Nothing in this work advances gate G0, and **not one row of the reachability matrix is closer to fact** — that needs real transcripts from real devices.
3. **The evidence folder names in `evidence\README.md` are still unratified**, and the caption-separator divergence recorded there (em dash in the outline, hyphen in the short proposal) is still open. The report uses the outline's em dash form in its evidence-standard section.
4. **`source-integrity-manifest.md` was again not edited**, and it is now stale by more than one row: two `proposal\integration\` files were amended after the manifest was taken, and this file adds one more. Re-run the manifest to re-baseline.
5. **The root is now a larger submission surface** — eight files rather than seven. `agent.md` §3's table and §9's row do not yet list `FYP-Initial-Report.*`, and **this log does not amend that manual**; whoever next maintains it should.

## 7. Independent verification

**Commissioned, and its result is recorded here in full rather than compressed into the word "passed".** An independent read-only verifier re-derived every load-bearing claim from the artefacts, never from this log, and checked that the render was current rather than stale.

| Check | Verdict | The measurement that decided it |
|---|---|---|
| Sizes and hashes | **PASS** | the two hashes in §1's verified revision, measured independently |
| **Render is current, not stale (V5)** | **PASS** | raw-ZIP extraction of `word/document.xml` from an in-memory copy found all three post-draft edits: `Cisco Modelling Labs` (3 hits), `the stage closes at gate G3` (1 hit, inside the Stage B row), `crossed-out arrow` (3 hits). Reading the ZIP left the file's hash unchanged |
| Structure | **PASS** | exactly one H1, exactly one `[TOC]`, twelve H2s in the order the front matter claims |
| Invented facts | **PASS — 24 of 24 spot-checks sourced, 0 unsourced** | including the 36-row inventory and its split, the 5-device Cisco target with its conditional maximum, the matrix's 13 rows, 36 tools with 34 read-only and 2 mutating, the 7/10/6/5/8 per-server split, 12 scenarios × 3 runs, ≥5 injected faults, PB-1…PB-9, E1…E9, the six domain weights summing to 100, the nine zero-occurrence technologies, and the standard page's recorded retrieval facts (200 OK, 55,200 bytes, last updated 02.06.2026 13:34 GMT) |
| **Forbidden claims** | **PASS — 0 violations** | all 21 Packet Tracer lines are denials; all 9 `autonom*` lines are denials or the unrelated "autonomous system AS-65000"; `legacy\` has **0 occurrences**; "weakest line" occurs once and it **is** the withdrawal; "cuttable" occurs once and it is a denial |
| `[TO CONFIRM]` honesty | **PASS** — 24 occurrences on 17 lines, 21 distinct items | `grep handbook` across the corpus returns only "not checked" wording, so **no marker hides a fact the corpus already states** |
| The evidence templates | **PASS — byte-identical** | caption template 60 characters with **U+2014 EM DASH** at three positions; filename template 26 characters with **U+005F LOW LINE** at two; the E1–E9 summary compared line by line and found faithful |
| Internal consistency | **PASS** | gate weeks agree across chapters (G0 1, G1 3, G2 6, G2-H 6, G3 8, G4 10, G5 11, G6 12); no dangling section or chapter reference; tool arithmetic 7+10+6+5+8 = 36, read-only 6+9+6+5+8 = 34, mutating 1+1 = 2 |
| Chinese companion summary | **PASS** | Traditional script confirmed by a 61-pair simplified/traditional test — the four 准 hits are all inside 批准, and 標準 appears 6 times against 标准 0 times; 1,213 characters; direction, build order, Stage B floor, permission model and standards position all agree with the English chapters, with no claim the English does not make |

**Its five discrepancies, and what was done with each. Nothing in the report was shown FALSE.**

1. **§7.1 claimed singleton provenance while the register carries 22 rows against the authority's 21 — fixed.** See §8 item 1. The register's *contents* were right; its *attribution* was not.
2. **36 tools and 2 mutating are not reproducible from the outline alone.** The outline's enumerated tool tables do not cover the monitoring and documentation servers; the figure the report uses is the one the project's operating manual records and labels as its own count. **Recorded rather than papered over** — the report's own table is internally consistent and names both mutating tools exactly, but **a reader checking only the decision draft cannot reproduce the total**, and that is now stated here instead of being left for someone to discover.
3. **§4.2's table was described as a "split by managed family" when it is a split by kind — fixed.** See §8 item 2.
4. **`vpnz-llm01` still has no row in the normative matrix**, a gap `agent.md` §10.3 item 8 already records: the figure names it as the model server while neither the Ubuntu enumeration nor the matrix lists it. **No report edit was made**, because the report never introduces the hostname and therefore commits no new error — but the report calls the matrix normative, so **the model host's absence from it is a defect to raise with the supervisor, not a wording problem to smooth away.**
5. **The outline mixes "Modeling" and "Modelling"; the report uses "Modelling" consistently.** No action.

**What the verifier could not check, and this log does not pretend otherwise:** Word rendering quality, styling, pagination and table widths (Word COM is unavailable on this machine and forbidden by H2); **the `.docx` carries no embedded images at all**, so the caption template has never been tested against a real caption in this deliverable; every physical-world fact (the CML licence, the laboratory machines, the GPU, the school's rules, the handbook's band); Chinese translation *quality* as distinct from script and content agreement; the topic sheet itself, which was deliberately not opened; and the contents of `legacy\`, which were deliberately not read.

**Why this section exists rather than a self-certification.** The project's hardest lesson is that a worker's own "all green" report is not evidence: a note once certified "20 bar rows, 0 alignment failures" while **11 of 20 bars were measurably off-grid**, and only an independent re-derivation found it. The same discipline applied to this build already found two defects in the previous piece of work — a non-verbatim quotation and an understated staleness count — that self-review had missed.

---

*Written 2026-09-29 by the incoming agent from measurements taken in this session, and amended once after independent verification (§8). Every size and hash was read with `Get-FileHash`/`Get-Item`; the `.docx` files were hashed and rendered but never opened by path; no existing file under `proposal\` was modified — **except this log and the two section fragments named in §8**, which are this build's own files.*

---

## 8. Post-verification amendment — 2026-09-29

The revision the independent agent verified was `FYP-Initial-Report.md` at `C5013BB9…2898` / 145,776 bytes with its render at `F39D5DF0…C6B2` / 67,924 bytes. **Two wording repairs were then made**, and this section exists so that the amendment is visible rather than absorbed into a fresh hash:

| # | Repair | Why |
|---|---|---|
| 1 | **§7.1's provenance sentence.** It read "carried forward with the corpus's own columns and identifiers. No risk has been added, merged or renumbered" — which is true of what the register *contains* but false about *where it came from*, since the outline carries 21 rows and the register carries 22. It now states the provenance precisely: **R1 to R21 are the decision draft's rows, and R22 — the risk that absence from Hong Kong delays the hardware record and therefore the model decision — appears only in the condensed proposal**, with the superset used and the difference recorded rather than silently merged | Renumbering to 21 would have **deleted a live risk** to make a sentence true; the honest repair was to make the sentence describe the two sources. The outline is the designated decision-level authority, so a claim of single provenance from it has to be accurate |
| 2 | **§4.2's table label.** It was described as a "split by managed family" when the four rows are Windows guests, Ubuntu guests, the hypervisor host and the simulator devices — a split by **kind** (9 + 10 + 1 + 16 = 36) | Wording only, and all four figures were already correct. Left uncorrected it would have invited a reader to look for a Linux/Windows/Cisco family split that the table does not and should not contain |

**After both repairs the document was re-assembled, re-rendered and re-gated:** SDK **0 errors**, package **9/9 PASS**, coverage **PASS**. The current hashes are in §1, and the Markdown hash was again identical before rendering and after all three gates. **The two repairs were confirmed present in the new render mechanically** — by extracting `word/document.xml` text from the raw ZIP and matching both new phrasings — rather than by assuming a fresh render.

**The scope of the verification, stated precisely:** the verifier's verdicts apply to the revision named at the head of this section. For the current revision they apply to everything except these two sentences, which are new text that no independent agent has yet read. That is a real, bounded limitation and it is recorded here rather than presented as full coverage.
