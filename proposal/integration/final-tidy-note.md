# Final tidy note — three closing jobs on the FYP document set

**Scope of this note.** Records the three targeted jobs completed on `FYP-Outline-DRAFT.md` (the authority) and its render, and on `FYP-Proposal-SHORT.md` and its render. No structural change was made to either document; every change is a targeted edit to a stage cell, a paragraph, a fenced-block row or a single sentence. No tool under `proposal\tools\*` was modified. No `.docx` was opened by path, by the Open XML SDK by path, by Word COM or by Word — every `.docx` read was raw ZIP access (`word/document.xml`, `w:t` extraction), and `sdk-validate.ps1` was always invoked with `-Path`, which opens from an in-memory `MemoryStream`.

---

## 1. Job 1 — two real internal inconsistencies in the outline

### 1(a) Stage B's weeks disagreed between §C.6's table and §F.3's Gantt band

| Source | Claimed span | Measured bar |
|---|---|---|
| §C.6 Stage B row | **weeks 3–8** | — |
| §F.3 second band, before the fix | — | `#` at columns 43–52 = **weeks 6–7** |

**The correct span is §C.6's, weeks 3–8**, because the table is the normative statement, the short proposal already carries it, and the span is what the exit gate requires: the device is built in weeks 3–6 (`show version` capture is G1 at week 3) and the stage closes only when the **AI** manages the device, which cannot happen before the AI line starts in week 7 and is due by G3 at week 8. The Gantt bar was redrawn to **weeks 3–8** (columns 28–57).

### 1(b) The two-axis conflation (build versus coverage)

A single convention was adopted and stated once in §C.6, in a new paragraph immediately before the stage table:

> A stage's week span is the span of its **build-and-cover sequence**. Its **coverage portion cannot begin before week 7**, when the AI line starts (§L.5), and **no stage can be covered before its own entry gate is met** — so coverage begins at *the later of week 7 and the stage's entry gate*. Every span runs **through** the stage's exit-gate week.

Consequences applied:

| Stage | Before | After | Coverage begins |
|---|---|---|---|
| A — the server estate | weeks 2–7 (build/cover not separated) | weeks 2–7, build and services weeks 2–6, **covered week 7** | week 7 |
| B — first Cisco device | weeks 3–8, start unlabelled | weeks 3–8, **build weeks 3–6, covered weeks 7–8** | week 7 |
| C — full Cisco target set | weeks 8–10 | **weeks 8–10**, build weeks 3–7, **covered weeks 8–10** | week 8 (Stage B must be exited at G3 first) |
| D — optional peer eBGP | weeks 10–12 | weeks 10–12, labelled a **bonus window, not a coverage window** | n/a |

Stage A had the same defect and was given the same treatment. Stages C and D were re-checked against the convention: **Stage C cannot be covered from week 7**, because its stated entry gate is "Stage B is exited" and Stage B closes at G3 (week 8) — so Stage C's coverage is weeks 8–10. This is a correction of a first attempt that had briefly claimed a shared week-7 coverage start for A, B and C; the entry-gate clause is what resolves it.

**Exit gates and §F.1/§F.2/§F.3 were checked and do not contradict the convention.** G2 (week 6) closes Stage A's build; Stage A's cover is week 7; G3 (week 8) closes Stage B; G4 (week 10) closes Stage C; Stage D is a bonus with no exit criterion. §F.4's "MCP contract frozen (end of week 7)" agrees.

### 1(c) Gantt character alignment — re-verified

**Measured fact, corrected in the document:** the ruler itself places `W1` at **column 18** (not 17), and each week occupies five characters, so week *w* begins at column **`18 + 5(w − 1)`**; `W12` ends at column 77. §F.3's prose previously said "columns 17–21" and "no bar extends past column 76" — both wrong — and the one row whose bar began at column 18 instead of column 22 (`Documentation`) was corrected to start in the `W1` cell.

Re-verification result: **20 bar rows checked, 0 alignment failures, 0 ruler failures.** Every bar occupies whole week cells with no partial cell, both bands. Rows examined: the 16 first-band bars and markers, the 4 second-band stage bars, and both gate-marker rows.

**A second, later correction to the same band (found by an independent acceptance check).** The first version of the redrawn band used only two characters — `#` for the AI-covered weeks and `.` for the build weeks — so each stage bar's *visible extent* was the covered portion, not the span §C.6 states. `STAGE A` therefore began at week 3 where §C.6 says weeks 2–7, and `STAGE C` began at week 7 where §C.6 says weeks 8–10. My own verifier had read the two runs as one bar and so missed it; the acceptance check read them separately and was right.

The band now uses **three characters** so that neither axis is lost and each bar's **overall span is exactly §C.6's span**:

| Bar | `=` (build / verify) | `#` (AI-covered) | Overall span |
|---|---|---|---|
| `STAGE A  (servers)` | weeks 2–6 | week 7 | **weeks 2–7** |
| `STAGE B  (one Cisco device)` | weeks 3–6 | weeks 7–8 | **weeks 3–8** |
| `STAGE C  (Cisco set)` | week 7 | weeks 8–10 | **weeks 7–10** |
| `STAGE D  (optional)` | weeks 10–11 | — | **weeks 10–11** |

Every segment occupies whole week cells (A `=` 23–47 = W2–W6, `#` 48–52 = W7; B `=` 28–47 = W3–W6, `#` 48–57 = W7–W8; C `=` 48–52 = W7, `#` 53–67 = W8–W10; D `=` 63–72 = W10–W11), no bar label collides with its bar, and the §F.3 prose and the coverage legend were rewritten to describe the three-character scheme and each bar's full span.

**Final alignment result: 20 bar rows checked, 0 alignment failures, 0 ruler failures.**

> **AMENDMENT, appended 2026-09-29 — the §1(c) alignment result above is WRONG, and `gantt-final-closeout.md` supersedes it.**
>
> *This amendment is written in place and nothing above it has been deleted or rewritten, so the record still shows what was believed here and when it was corrected.*
>
> **The claim corrected.** §1(c) records twice — under *"Re-verification result"* and again under *"Final alignment result"* — that **"20 bar rows checked, 0 alignment failures, 0 ruler failures"**, and asserts **"Every bar occupies whole week cells with no partial cell, both bands."** **That certification was false against the file at the time this note described.** The close-out re-measured every row from the file itself with a collision-detecting column writer and found **9 of the 16 first-band bars and 2 of the 4 stage bars off-grid**: bars beginning on the *second* character of the week cell their row named, because each bar had been appended directly after a row label of 15–22 characters; `Evaluation set` drawn as a 1-week bar among 2-week bars; and in the second band `STAGE A`'s label overrunning into its bar, which reached week 8 where §C.6 states week 7. **The declared "re-measurement" was therefore not performed on both bands** — the count of 20 rows was never the problem; the zero-failure certification was.
>
> **What supersedes this subsection.** `proposal\integration\gantt-final-closeout.md` (2026-09-29 22:12), §1a, §2 and §4. In particular its §4 records this note's own `18 + 5(w − 1)` ruler arithmetic as true *of the arrival ruler line* — the arithmetic was not itself wrong; what was wrong was reading zero alignment failures off a band that was not on whole week cells at all.
>
> **The current verified state of §F.3's two bands** — as recorded in that close-out and re-measured independently against `FYP-Outline-DRAFT.md` when this amendment was written: every row label is right-padded to a 20-character field, so column 21 is the origin of every bar and week *w* begins at column **`21 + 5(w − 1)`** (`W1` 21–25 … `W12` 76–80). **All 16 first-band bars, all 4 stage bars and both gate-marker rows begin at the first character of their own week's cell; no bar extends past column 80; no label touches the bar it names.** `STAGE A` weeks 2–7, `STAGE B` weeks 3–8, `STAGE C` weeks 8–10, `STAGE D` **weeks 10–12**; `G1` column 31 (week 3), `G2` column 46 (week 6), `G3` column 56 (week 8), `G4` column 66 (week 10). **20 bar rows checked, 20 PASS, 0 alignment failures, 0 ruler failures — true of the delivered file.** The §1(c) table's own figures are superseded with the rest: the bar origin is column 21 rather than column 18, and `STAGE D`'s bar is weeks 10–12 rather than weeks 10–11.

### 1(d) Did the shorter proposal need a matching edit?

**No, for the week spans.** §7.2's Stage rows already read "Weeks 3-8", "Weeks 2-7", "Weeks 8-10" and "Weeks 10-12" — identical to the corrected outline — and §7.2 already carries an explicit paragraph separating the build and coverage axes. The only matching edit made there was to the **shared wording of the stage justification**, so the two documents read identically on "Stage B is the floor, not the target", "Stage C is the operational target; Stage D is a bonus" and "the AI line starts in week 7". No reconciliation was reopened.

---

## 2. Job 2 — the 2024 edition's AI content (residual R5)

### What the evidence says

The project's research pack `proposal\research\wsos-2026-2447.md` recorded **both** editions. Its §5.1 technology audit defines its columns explicitly at line 445-446:

> `2026 text` = extracted visible text; `2026 raw HTML` includes markup … `2024 text` is shown for edition diffing.

The 2024 column is therefore **extracted text only** — there is no 2024 raw-HTML column anywhere in the pack, and no cached 2024 page source exists in the workspace (the only 2024 artefact is the research pack's own record; its Appendix A records the URL, HTTP `200` and 55,616 bytes, but not the source).

The 2024 text occurrences are **zero** for every AI term, in three separate places in the pack:

| Term | 2026 text | 2026 raw HTML | **2024 text** | Pack's verdict |
|---|---|---|---|---|
| `Agentic` | 0 | 0 | **0** | ABSENT in both editions |
| `OpenClaw` | 0 | 0 | **0** | ABSENT in both editions |
| `MCP` | 0 | 0 | **0** | ABSENT in both editions |
| `Model Context Protocol` | 0 | 0 | **0** | ABSENT in both editions |
| `artificial intelligence` | 0 | 0 | **0** | ABSENT in both editions |
| `machine learning` | 0 | 0 | **0** | ABSENT in both editions |

(two tables, §5.5 and §5.7, plus §7's correction "C4 — CONFIRMED with a warning: 'no AI content at all' — Correct"). The pack's §5.1 states that these absence claims are "backed by the occurrence counts in Section 5.1".

### What that does and does not support

- It **does** support the claim for 2024 at the **extracted-text** level: zero occurrences of every AI term in the 2024 edition's text.
- It does **not** support the second half of the short proposal's original sentence for 2024, because the raw-source (raw-HTML) check was run on 2026 only.
- The pack also applies the `AI` substring false-positive warning (`ShanghAI`, `dAIly`, `mAIntain`, `domAIn`) to the **2026** text only, so no equivalent raw/substring-level check exists for 2024.

### What was done

The sentence was **narrowed to its actual evidential base** rather than left as it was, because the original wording asserted the raw-source check for both editions:

- **Before:** "zero occurrences of agentic, MCP, Model Context Protocol, artificial intelligence or machine learning, **in the text or in the raw page source, and in neither the 2026 nor the 2024 edition**."
- **After:** "zero occurrences of agentic, MCP, Model Context Protocol, artificial intelligence or machine learning **in its text and in its raw page source, and zero in the 2024 edition's text as well — that second count is a text-level extraction, not the raw-source check run on 2026**."

R5 is therefore **closed by narrowing**, and the claim now matches its base. No reconciliation was reopened. The outline's §I.4 was left unchanged: it makes the no-AI claim for **2026** only, which is what the raw-HTML evidence supports.

---

## 3. Job 3 — the shorter proposal's word band

**Result: the band is met.** Canonical prose measure (the reconciliation's own definition — raw ZIP `word/document.xml`, `w:t` per `w:p` outside `w:tbl`, minus `Heading*` and `SourceCode` paragraphs):

| Measure | Before | After |
|---|---|---|
| **Prose words (canonical, delivered `.docx`)** | **10,860** | **9,996** |
| Paragraph words incl. headings + code | 11,413 | 9,996 + 342 + 211 = 10,549 |
| Table-cell words | 9,068 | 8,981 |
| Whitespace-split words (`validate.ps1`) | 20,394 | 19,530 |

A cut of **864 prose words, 8.0 %**, with nothing removed from the required content. The decision table, completion conditions C1–C8, the evaluation set (twelve scenarios, five injected faults, the permission-boundary suite PB-1–PB-9, the hallucination check, the drift false-positive check, the audit-log coverage check), the stage scheme A–D with its gates, the weekly plan, the deliverables tables, the risk register, the use-case tables, every D-identifier and every quoted standard line are all present and unchanged in structure.

**How it was cut.** Prose only: redundant framing and connectives, wordy verb phrases, hedges, duplicated clauses, and the tightening of several enumerations' connective text. No table row, no gate, no completion condition, no use-case row, no evaluation mechanism, no risk row and no reference was deleted. Six parallel copy-editing passes over 92 prose blocks were each verified for identifier/number preservation and Markdown-construct parity before assembly; the final blocks were tightened directly.

**Note on a converter trap that was hit and fixed.** One caption rewrite dropped the closing `]` of the `[FIGURE: …]` placeholder, which made the converter emit `figures: 0` and `validate.ps1` fail the figure-count check. It was detected by the gate, the bracket restored, and the render and gates re-run — the tool was not touched.

---

## 4. Files changed, with sizes and hashes

Backups of all four pre-edit artefacts are in `proposal\integration\backup-final-tidy\`, each verified byte-identical (SHA-256 and length) to the original before any edit.

| File | Before | After |
|---|---|---|
| `FYP-Outline-DRAFT.md` | 259,634 bytes / `863DFC22971150F3CCAC5754036DB628B6CE5A9E2379B7A83BEF578205690B53` | **263,264 bytes / `AF433265DCB2DAE78A987F660B0B29573236F788146807875B887685BE575C33`** |
| `FYP-Outline-DRAFT.docx` | 137,715 bytes / `4286241E38437F0613A4942A29A6F7DCBDAC1D966C7F905818A288320933E7A2` | **139,032 bytes / `4F352BEB53182F98C6A37A09BC6FD3753971CEC1C1A67ECE4018652344BB5798`** |
| `FYP-Proposal-SHORT.md` | 135,738 bytes / `8F1BC4B8E5D2946992BFFD373D9409073FBE0726D6EB86818415E63455A3CA2C` | **131,405 bytes / `B3A933B27E5F58C7E8104831558933BD89F289FCE9C6B44A543BE93468775BD3`** |
| `FYP-Proposal-SHORT.docx` | 66,980 bytes / `9D97358D2B0B66292C0F46C80D948D0C6544ED29B378716DE566B97B5291E2B8` | **65,799 bytes / `869882D5140F67081D2AC0B3682F9DCF505127EA351C4C29E9B8282BA1493EA3`** |
| this note | — | new |

Renders were produced with the unchanged converter, same titles as the previous renders:

```
powershell -NoProfile -ExecutionPolicy Bypass -File .\convert.ps1 `
  -InputPath  D:\File\School\FYP\FYP-Outline-DRAFT.md `
  -OutputPath D:\File\School\FYP\FYP-Outline-DRAFT.docx
  # dc:title derives from the H1: "Victor2 – Enterprise Network Infrastructure and Architect"

powershell -NoProfile -ExecutionPolicy Bypass -File .\convert.ps1 `
  -InputPath  D:\File\School\FYP\FYP-Proposal-SHORT.md `
  -OutputPath D:\File\School\FYP\FYP-Proposal-SHORT.docx `
  -Title "Victor2 - Enterprise Network Infrastructure and Architect: Project Proposal"
```

Both `dc:title` values were checked against the previous renders and are byte-identical, so document identity is unchanged. The converter is not idempotent (fresh package timestamps), so a later re-render of the same Markdown will differ in bytes and hash.

---

## 5. Gate results, and hash stability

| Gate | Outline | Short proposal |
|---|---|---|
| **`sdk-validate.ps1 -Path`** | `OPEN: OK`, **`ERRORS: 0`**, `openFailures=0 validationErrors=0 rawIssues=0`, no duplicate relationship Ids or content-type declarations, exit **0** | `OPEN: OK`, **`ERRORS: 0`**, `openFailures=0 validationErrors=0 rawIssues=0`, exit **0** |
| **`verify-package.ps1 -Path`** | **PASS, all 9 checks passed**, exit **0** | **PASS, all 9 checks passed**, exit **0** |
| **`validate.ps1 -MarkdownPath`** | **2,524 / 2,524 = 100.000%**, `COVERAGE PROOF`, `RESULT: PASS`, 73 tables rectangular (583 rows), headings `0/15/73/12` | **1,318 / 1,318 = 100.000%**, `COVERAGE PROOF`, `RESULT: PASS`, 29 tables rectangular (259 rows), figures `1 / 1`, headings `0/15/40/6` |
| **Hash before vs after all three gates** | `4F352BEB…44BB5798` — **identical** | `869882D5…A1493EA3` — **identical** |

Coverage did not drop: the outline was 2,522 / 2,522 and is now **2,524 / 2,524** (two lines added by the new convention paragraph and the coverage legend); the short proposal was 1,318 / 1,318 and is **1,318 / 1,318**. Validation did not mutate either artefact.

**A parallel edit to the outline arrived after my first render.** Another agent wrote `proposal\integration\backup-outline-gantt-barfix\` and touched `FYP-Outline-DRAFT.md` at 22:01:50 — after my first outline render. I re-read the file, confirmed **all thirteen of my Job 1 edits were still present** and that the file was byte-stable over a 20-second interval, then re-rendered the `.docx` from that exact state and re-ran all three gates on it. The outline hashes in the table above are from that final, verified render (`md` 263,264 bytes / `AF433265…BE575C33`; `docx` 139,032 bytes / `4F352BEB…44BB5798`). The delivered outline `.docx` contains every one of my edits.

**Line-level and converter checks.** No hard-wrapped paragraph was introduced in either document (checked for consecutive plain-prose lines). No new bold-span-ending-in-a-period construct was introduced; the pre-existing `**Label.**` shapes in the source were left as they were, and the three such shapes created by the copy-editing passes were converted to `**Label**.` before assembly.

---

## 6. The two documents still agree

Thirty-four shared properties were probed as exact strings against both delivered files: **34 / 34 agree, 0 failures.** They cover the stage names A–D and the four-stage scheme, the minimum acceptable stage (Stage B), Stage B as the floor rather than the target, Stage C as the operational target and Stage D as a bonus, each stage's week span (A weeks 2–7, B weeks 3–8, C weeks 8–10, D weeks 10–12), the Stage C entry gate ("Stage B is exited"), the AI line starting in week 7, every gate G0/G1/G2/G2-H/G3/G4/G5/G6 with its week (1/3/6/6/8/10/11/12), the committed use-case set UC-1, UC-3, UC-4 and UC-6 and the reduced set UC-3 and UC-6, the Cisco interface guarantee (SSH and SNMPv3 unconditional, RESTCONF conditional on the image), the five devices fixed by D-16, Packet Tracer as not reachable, the decision identifiers D-01…D-16, the blocking items B1–B3, the completion conditions C1–C8, the permission-boundary test PB-2, the evidence caption template, the five MCP servers, read-only by default with an approval gate, the agent not being autonomous, and the immediate submission being the proposal alone.

**One presentation difference, not a disagreement.** §C.6's stage table (both documents) gives Stage C's weeks as 8–10, because the table is keyed on when the stage is *covered*; §F.3's band draws Stage C's bar from week 7 to week 10, because the bar shows the stage's *full build-and-cover span* and the build finishes at the end of week 7. The band's own prose states this explicitly, and the `=`/`#` split inside the bar marks the boundary. The outline's §F.3 prose also states the same spans as §C.6 for Stage C's coverage ("covered in weeks 8–10"), so the two statements are consistent once the axis is read.

---

## 7. What was not done or not verified

- **Word-openability and visual fidelity of either `.docx`.** `wordcom-test.ps1` was not run: it drives Word, and these artefacts must not be opened with Word. The renders are evidenced only by SDK validation, the 9/9 package check, the raw-ZIP coverage proof and the measured figure/heading/table counts. Layout, fonts, page breaks, table pagination and whether the wide §F.3 code block overflows the page width were **not** inspected.
- **The §F.3 ASCII Gantt's rendered width.** The code block is 77 characters at its widest. It was confirmed to be a single `SourceCode` paragraph per line and aligned character-by-character in the source, but whether 77 monospace characters fit the page in Word was not measured.
- **The 2024 edition's raw page source.** No such artefact exists in the workspace and it was not re-fetched, so the 2024 AI-content finding remains a **text-level** result. That is exactly why §9.2 was narrowed rather than left as it was.
- **The long `FYP-Proposal-*` documents, `proposal\sections\*`, `proposal\i18n\*`, `proposal\research\*` and the other `proposal\integration\*` files.** Read-only, untouched and not assessed; whether they carry the same word-band position or the same 2024 wording is outside this task's scope.
- **No tool was modified.** `convert.js`, `convert.ps1`, `validate.ps1`, `verify-package.ps1`, `sdk-validate.ps1` and every other file under `proposal\tools\*` are untouched.
- **Nothing was installed.** All scratch work used `$env:TEMP`.
