# Final Independent Acceptance Check — Victor2 FYP (two documents, read-only)

**Verifier role:** independent acceptance agent (adversarial by default). Every load-bearing claim
below was re-derived from the artefacts themselves; no producing agent's self-report was trusted.

**Artefact root:** `D:\File\School\FYP\`
**Scope:** the two deliverables only — `FYP-Outline-DRAFT.md`/`.docx` and `FYP-Proposal-SHORT.md`/`.docx`.
**Gates used (as written, unmodified):** `proposal\tools\md2docx\sdk-validate.ps1` (invoked with
`-Path`, MemoryStream open only), `verify-package.ps1`, `validate.ps1`.
**Constraint compliance:** no existing file was modified, moved, renamed or deleted. No `.docx` was
opened with the Open XML SDK by path, with Word COM, or with Word — `sdk-validate.ps1` was run with
`-Path` only, and every other `.docx` read was raw ZIP access in Node. All scratch work is under
`%TEMP%\dsh-acc-v2\`. The only file created outside that scratch area is this report.

**Overall verdict: ACCEPT WITH CAVEATS.** The two documents are gate-clean, hash-stable, mutually
consistent on all 34 substantive shared properties, current (not stale), and complete in apparatus.
**One defect to fix** (§V3/V10): in the outline's §F.3 stage Gantt band, the `STAGE A` bar starts at
week 3 and the `STAGE C` bar starts at week 7, whereas §C.6 and §F.3's own prose place Stage A in
weeks 2–7 and Stage C in weeks 8–10. It is a one-week left/right shift of two bar starts inside a
figure; nothing else depends on it, but §F.3 asserts the bars "aligns to whole week cells" and that
claim is what the shift falsifies.

---

## V1 — Gates: PASS on both, 0 errors, no mutation

| Gate | Outline | Short proposal |
|---|---|---|
| `sdk-validate.ps1 -Path` | `OPEN: OK`, **`ERRORS: 0`**, `openFailures=0 validationErrors=0 rawIssues=0`, no duplicate rel Ids / content-type declarations, SDK 2.9.1.0, Office2013, **exit 0** | `OPEN: OK`, **`ERRORS: 0`**, `openFailures=0 validationErrors=0 rawIssues=0`, **exit 0** |
| `verify-package.ps1 -Path` | **PASS — all 9 checks passed**, `failures=0`, exit 0 (73 tables rectangular, 583 rows; 29 styles; 631 body children, one trailing `w:sectPr`) | **PASS — all 9 checks passed**, `failures=0`, exit 0 (29 tables rectangular, 259 rows; 631/301 body children, one trailing `w:sectPr`) |
| `validate.ps1 -MarkdownPath` | **RESULT: PASS** — `source content lines checked: 2,524` / `lines found verbatim: 2,524 (100.000%)` → **COVERAGE PROOF** | **RESULT: PASS** — `source content lines checked: 1,318` / `lines found verbatim: 1,318 (100.000%)` → **COVERAGE PROOF** |

**Coverage figures — no drop.** The task expected 2,524/2,524 for the outline and 1,318/1,318 for the
short proposal. **Both were reproduced exactly, at 100.000%, with no drop.** Supporting counts:
outline 73 tables / 583 rows / 114 code paragraphs / headings `0/15/73/12`; short proposal 29 tables /
259 rows / 19 code paragraphs / 1 figure placeholder (`1/1`) / headings `0/15/40/6`. Both show
`w:updateFields = true`.

**Hash stability — validation did not mutate either document.** SHA-256 recorded before the first gate
run, after the SDK and package gates, and again after *all* gate runs including both `validate.ps1`
invocations:

| Document | Before | After all gates | Bytes | Verdict |
|---|---|---|---|---|
| `FYP-Outline-DRAFT.docx` | `5453DD42…E4048805` | **`5453DD427E075EE54A9297D66E093DFF353D7E9638432DCBC61EB806E4048805`** | 138,906 | **IDENTICAL — not mutated** |
| `FYP-Proposal-SHORT.docx` | `869882D5…A1493EA3` | **`869882D5140F67081D2AC0B3682F9DCF505127EA351C4C29E9B8282BA1493EA3`** | 65,799 | **IDENTICAL — not mutated** |

Both match the hashes supplied in the task statement exactly. `sdk-validate.ps1` printed no
`SHA256(post)` warning, and there was no non-zero exit attributable to mutation.

---

## V2 — Short proposal word count: 9,996 prose words, AT the 10,000 ceiling — claim reproduced exactly

**Method used (the document's own canonical definition, implemented independently).**
Raw ZIP access to `word/document.xml` (Node: inflate the entry, hand-rolled central-directory parse —
no SDK, no COM); for every `<w:p>` **not** inside `<w:tbl>`, collect its `<w:t>` text; subtract
paragraphs whose `w:pStyle` is `Heading*` or `SourceCode`; count words by whitespace split.

| Measure | Short proposal (delivered `.docx`) | Outline (delivered `.docx`) |
|---|---|---|
| **Prose words (canonical method)** | **9,996** | **15,069** |
| Paragraph words incl. headings + code | 10,549 (= 9,996 + 342 + 211) | 16,857 |
| Heading words / code words | 342 / 211 | 847 / 941 |
| Table-cell words | 8,981 | 21,300 |
| Whitespace-split words (all paragraphs, `validate.ps1`'s figure) | 19,530 | 38,157 |

**Verdict: 9,996 — at the ceiling, not above it.** By the canonical method the claim of 9,996 is
**reproduced to the word**, and the pre-trim figure of 10,860 follows from the reconciliation record's
`10,860 → 9,996` (a cut of 864 prose words, 8.0%). Every supporting subtotal the trim note publishes
(342 heading words, 211 code words, 10,549 paragraph total, 8,981 table-cell words, 19,530
whitespace-split words) also reproduced exactly.

**The one honest caveat on the number, and why an alternative method gives a different figure.**
10,860 × 0.92 = 9,991, so a definitional slack of roughly ±0.3 % exists around the ceiling. I therefore
also measured the **Markdown source** with a stricter prose definition (body/blockquote/list paragraphs
only; fenced code, ATX headings, table rows and table separators excluded; inline markdown stripped).
That method gives **9,984**, i.e. **12 words lower** than the docx method. The 12-word gap is a *method*
difference, not a discrepancy in the document: the docx method counts inline code spans and
emphasis/link punctuation as part of the prose paragraph text, whereas the markdown method strips them.
**Both methods agree the document is at or below 10,000**, so the claim survives the stricter reading
rather than depending on the more generous one. There is no definition I could construct under which
the short proposal exceeds 10,000.

---

## V3 — Outline narrative consistency: 4 of 5 fully clean, 1 with a bar-alignment defect

### (a) Stage B week span, and the Gantt ruler arithmetic — CONSISTENT on the span; ruler verified; bars verified; two bars misframed

**The Week span itself is stated consistently in both places.** §C.6's stage table:

> | **B — the first genuinely reachable Cisco device** | … | **Weeks 3–8.** Build in weeks 3–6 — the device is up and
> `show version` is captured, which **is** §F.1's **G1 (week 3)** — and covered in weeks 7–8, because the stage closes
> only when the **AI** manages the device and the AI line starts at week 7 (§L.5). **This is the span the §F.3 band draws** |
> — `FYP-Outline-DRAFT.md` L389

§F.3, prose and the band itself:

> **Each stage bar spans the weeks §C.6's own table states for that stage and ends at its exit-gate week** — `STAGE A`
> occupies weeks 2–7, **`STAGE B` occupies weeks 3–8** (ending at column 57, the right edge of the week `G3` closes in),
> and `STAGE C` occupies weeks 8–10, ending at column 67 … — L938

> **`STAGE B`** is the first genuinely reachable Cisco device — one node only, and the minimum acceptable stage —
> **built in weeks 3–6 and covered in weeks 7–8**. — L940

**Ruler arithmetic — VERIFIED EXACTLY as claimed.** Measured character-by-character (1-based columns):

- Ruler line L904 places `W1` at column **18**, `W2` at 23, `W3` at 28 … `W12` at **73**; every one of the
  twelve satisfies **column = 18 + 5(w − 1)**. `W12` occupies columns **73–77**; the ruler is 75 columns long,
  so the band's right edge is column 77. The second band's ruler (L929) is identical.
- **Every bar in both bands starts on a whole week cell and ends on a whole week cell** (`wholeCellStart`,
  `wholeCellEnd` all true) **and no bar overruns column 77** (`overruns77` false for all rows). The task's
  formula, the week-77 end, whole-cell alignment and the no-overrun property are all confirmed.

**Gate markers align to their own week's cell — VERIFIED.** Measured columns: `G1`@28=week 3, `G2`@43=week 6,
`G3`@53=week 8, `G4`@68=week 10, `G2-H`@43=week 6. All correct.

**DEFECT — two stage bars do not sit on the week span the same figure's prose and §C.6 state.** Measured
character ranges of the second band (L932–L935), decoded against column 18 + 5(w − 1):

| Bar | Measured columns | Decodes to | §C.6 / §F.3 prose says | Verdict |
|---|---|---|---|---|
| `STAGE A  (servers)` | 28–52 (`.28–47`, `#48–52`) | weeks **3**–7, build 3–6, cover 7 | **weeks 2–7** | **start one week late** |
| `STAGE B  (one Cisco device)` | 28–57 (`.28–47`, `#48–57`) | weeks **3**–8, build 3–6, cover 7–8 | **weeks 3–8** | **aligned** |
| `STAGE C  (Cisco set)` | 48–67 (`#48–67`) | weeks **7**–10, cover 7–10 | **weeks 8–10** | **start one week early** |
| `STAGE D  (optional)` | 63–72 (`.63–72`) | weeks **10**–12 | **weeks 10–12** | **aligned** |

The cause is mechanical: the four labels are left-padded to a fixed 27-column field
(`STAGE A  (servers)` is 17 characters, `STAGE B  (one Cisco device)` is 26), so every bar is forced to
begin at column 28 = week 3. Stage A should begin at column 23 and Stage C at column 53. §F.3's own
assertion that "**each row of both bands was re-measured character by character against that rule and
aligns to whole week cells, with no partial cell**" (L924) is literally true of *cell* boundaries but
false of *stated spans* for these two rows. Everything else about the band — ruler, gate markers, exit-gate
alignment, no-overrun, the §C.6↔§F.3 span agreement — is correct.

### (b) Build-versus-coverage convention — PRESENT and obeyed by every stage's stated span

Stated as an explicit convention at §C.6:

> **How to read a stage's weeks, because they describe a build-and-cover sequence and not one axis.** The two axes are
> separate and both are real: the **build** axis is when the thing the stage manages is stood up (§F.2's calendar), and the
> **coverage** axis is when the AI layer actually manages it (this ramp). A stage's week span below is therefore the **span
> of its build-and-cover sequence**, and its **coverage portion cannot begin before week 7** … So a stage's coverage begins at
> **the later of week 7 and its entry gate** … Every span runs **through** the stage's exit-gate week, which is the same rule
> the §F.3 bars follow. — L384

Restated independently in the short proposal:

> **The build phases and the coverage stages are two axes and must not be conflated**. The stages describe **what the AI layer
> manages and in what order**; the build phases of section 8.2 describe **what the team builds and when**. — `FYP-Proposal-SHORT.md` L323

**Every stage's stated span obeys it:** Stage A weeks 2–7 (coverage portion begins week 7 ✓); Stage B weeks 3–8
(coverage weeks 7–8 ✓); Stage C weeks 8–10 (entered only once Stage B is exited at G3/week 8, so coverage
begins week 8 ✓); Stage D weeks 10–12 (cannot begin before Stage C is exited at G4/week 10 ✓). **All four
stated spans obey the convention.** The defect in (a) is a drawing error, not a violation of the convention.

### (c) Hardware deferred; B2 the only item blocking work now; B1/B3/D-04 close at a named gate with a week — CONFIRMED

> **Only ONE item still blocks work starting now — B2, and nothing else.** Everything that was formerly listed as "blocking"
> is now a **scheduled** gate, and §M item 1 states the same count — L62, with the row: "**B2 — Ratification of the Cisco
> platform recommendation** (Section C.4 / J-D-01: **primary CML, fallback hybrid**) … `MCP-S-CISCO` — one whole domain of the
> AI layer — cannot be designed until the Cisco layer is known to be reachable … **end of week 1**" — L66

> 1. **Record the lab machine's specification — gate G2-H, end of week 6 (B1).** … **The date moved; the requirement did not.**
> &nbsp;&nbsp;2. **Ratify the Cisco platform — BLOCKING NOW (B2).** — L1504–L1505

The named gate with its week, for all three deferred items:

> | **G2-H — Hardware and model tier decided** *(the deferred SQ-2 gate; owner S4)* | **6** | **The lab machine's specification
> is captured … It is the gate at which B1, B3 and D-04 are closed.** — L875

Corroborated in the summary at L33 (Chinese), L58, L68–L74, L1190 ("blocked at the scheduled gate G2-H, end of week 6 — **no
longer blocking now**"), L1202 and L1284. **CONFIRMED: one current blocker (B2), and B1/B3/D-04 all close at the named gate
G2-H in week 6.**

### (d) Minimum acceptable stage, with a stage-based reduction in its completion condition — CONFIRMED

> **The minimum acceptable stage is Stage B, stated and justified as follows.** … **So Stage B is the floor, not the target.**
> Stage C is the **operational target**; Stage D is a **bonus**. … **The floor is a sufficient stage and not merely a permitted
> one:** §B.3 C6 carries a **stage-based reduction** that is symmetric with its tier-based one — where the project closes at
> Stage B, C6 and §F.1's G4 are met by the reduced committed set **UC-3 and UC-6**, which is exactly the pair Stage A exits on
> and which needs no Cisco device. **So a project that lands on Stage B satisfies the definition of done; a project that lands
> on Stage A does not** — L411

The completion condition that carries the reduction, §B.3 C6:

> … **(i) Stage-based (which stages the project reached): where the project closes at Stage B — the minimum acceptable stage
> stated and justified at §C.6 — C6 is met by the reduced committed set UC-3 and UC-6, because Stage A's exit gate is exactly
> UC-3 and UC-6 running end to end, and neither depends on a Cisco device. A project that lands on the declared floor therefore
> satisfies this condition and does not fail it.** **(ii) Tier-based …** The two reductions are independent — L141

**CONFIRMED: the minimum stage is stated (Stage B), and its completion condition (C6) carries a stage-based
reduction (UC-3 + UC-6) explicitly, plus an independent tier-based reduction (UC-1 + UC-3 + UC-5 + UC-6).**

### (e) Committed use-case set stated once and used consistently — CONFIRMED

**Stated once, at §E.7:**

> Commit to **UC-1, UC-3, UC-4 and UC-6** — four of the six. **UC-6 is now committed because §C.6's Stage A cannot be exited
> without it** … the recommendation (D-06) is those four, adding UC-2 and UC-5 if week 10 allows. **Never promise all six.** — L812

**Used consistently at every other site.** §A's D-06 row L85 ("Commit to **UC-1, UC-3, UC-4 and UC-6**; add UC-2 and UC-5 if
week 10 allows"); D-06 expansion L1267–L1268 (same set); §B.3 C6 L141 ("**The committed set (D-06) is UC-1, UC-3, UC-4 and
UC-6**"); §C.6's stage-to-use-case mapping L402–L409 (UC-3, UC-6, UC-5 earliest at Stage A; UC-1 narrowed at B; UC-2 at C;
UC-4 tier-gated); the UC-4 caveat block L814–L819 (reduced form **UC-1, UC-3, UC-5 and UC-6**); §E.1.2's T0 row L542 (same
reduced form). **No site states a different committed set. CONFIRMED.**

---

## V4 — Short proposal agrees with the outline: 34/34 substantive properties agree, 0 divergences

I probed both documents (and both `.docx` renders) for the shared properties as exact strings, then
resolved every phrasing-only difference by targeted inspection. **Result: 34 substantive properties
checked, 34 agree, 0 disagree.**

| # | Shared property | Outline | Short proposal | Agree? |
|---|---|---|---|---|
| 1–4 | Stage names A–D | §C.6 table | §7.2 table | ✅ |
| 5 | Minimum stage = **Stage B** | L411 | L314, L319, L325 | ✅ |
| 6 | Stage B is the floor, not the target | L411 | L325 | ✅ |
| 7 | Stage C = operational target | L411 | L325 | ✅ |
| 8 | Stage D = a bonus | L391, L411 | L325, L321 | ✅ |
| 9 | **Stage A span = weeks 2–7** | L388, L938 | L318 | ✅ identical string |
| 10 | **Stage B span = weeks 3–8** | L389, L938 | L319 | ✅ identical string |
| 11 | **Stage C span = weeks 8–10** | L390, L938 | L320 | ✅ identical string |
| 12 | **Stage D span = weeks 10–12** | L391, L938 | L321 | ✅ identical string |
| 13 | Stage C entry gate = "Stage B is exited" | L390 | L320 | ✅ |
| 14 | AI line starts week 7 | L384, L536, L954 | L318, L319, L325 | ✅ |
| 15 | **G0 week 1** | L872 | L517 | ✅ |
| 16 | **G1 week 3** | L873 | L518 | ✅ |
| 17 | **G2 week 6** | L874 | L519 | ✅ |
| 18 | **G2-H hardware gate week 6** | L875 | L520 | ✅ |
| 19 | **G3 week 8** | L876 | L521 | ✅ |
| 20 | **G4 week 10** | L877 | L522 | ✅ |
| 21 | G5 week 11 | L878 | L523 | ✅ |
| 22 | G6 week 12 | L879 | L524 | ✅ |
| 23 | Committed set UC-1, UC-3, UC-4, UC-6 | L141, L812 | L119, L462, L473 | ✅ |
| 24 | Stage-based reduced set UC-3 + UC-6 | L141, L411 | L119, L325, L473 | ✅ |
| 25 | Tier-based reduced set UC-1+UC-3+UC-5+UC-6 | L141, L542 | L119, L473 | ✅ |
| 26 | **Cisco guarantee: SSH + SNMPv3 unconditional** | L136, L389 | L99, L114, L319, L518 | ✅ |
| 27 | **RESTCONF conditional on the image, not required for C1** | L136, L389 | L114, L319, L518 | ✅ |
| 28 | Packet Tracer cannot be the AI-managed layer | L51, L90, L1223 | L132, L144, L614 | ✅ |
| 29 | Read-only by default, changes only with human approval | L50, L1246, L808 | L143, L610 | ✅ |
| 30 | Agent is not autonomous | L149, L808 | L509, L573 ("does not run the network") | ✅ |
| 31 | Decision identifiers **D-01…D-16** | 16/16 present | 16/16 present, "keyed **D-01 to D-16**" (L600) | ✅ |
| 32 | **Blocking items B1–B3**, B2 the only current blocker | L62, L66, L68–L74 | L600, L621, L685 | ✅ |
| 33 | B1/B3/D-04 close at G2-H, week 6 | L875, L1190, L1202 | L520, L621 | ✅ |
| 34 | **Immediate submission = the proposal alone** | L60, L888, L1517 | L13, L656, L685, L699 | ✅ |

**Phrasing differences found and resolved as non-divergences (reported for completeness, not as
disagreements):** the outline writes `D-01…D-16` and `B1–B3` in prose whereas the proposal's front
matter states the key explicitly (L14) and both enumerate all 16 D-ids and all 3 B-items ✚; the
proposal uses `Weeks 3-8` (hyphen) and the outline `Weeks 3–8` (en dash), normalised identical ✚; the
outline states the current-blocker fact as "Only ONE item still blocks work starting now — B2" (L62)
and the proposal as "B2 … is the only item that blocks work from starting now" (L621) and "Only item 2,
the Cisco platform ratification (B2), blocks work from starting now" (L685) — same fact, same
identifier ✚; the outline states "B1, B3 and D-04 close here" at G2-H (L875) and the proposal the same
(L520) ✚. I also confirmed the two defects in V3(a) are *shared* between the documents' stated spans —
both say Stage A weeks 2–7 and Stage C weeks 8–10 — so the Gantt misframing is an outline-figure defect
only, not a cross-document divergence.

---

## V5 — The documents are current, not stale: CONFIRMED, all renders current

Both `.docx` files were read by **raw ZIP access** (Node inflate of `word/document.xml`) — never the SDK
by path, never COM, never Word. Latest-edit markers present in the renders:

| Probe | Outline `.docx` | Short `.docx` |
|---|---|---|
| **Stage B week span as finalised** | **FOUND** — "…on an aspiration **Weeks 3–8**. Build in weeks 3–6 — the device is up and `show version` is captured, which is §F.1's G1 (week 3)…" | **FOUND** — "…rather than on an aspiration **Weeks 3-8**. The `show version` capture is G1 (week 3), but the stage closes when the AI manages the device…" |
| **Build-versus-coverage convention** | **FOUND** — "**build-and-cover** sequence and not one axis… the build axis is… the coverage axis is…" | **FOUND** — "The **build phases and the coverage stages are two axes** and must not be conflated" |
| **Narrowed 2024 evidence sentence** | n/a — §I.4 makes the no-AI claim for 2026 only, deliberately unchanged | **FOUND, in the narrowed form** — "…zero in the **2024 edition's text** as well - **that second count is a text-level extraction, not the raw-source check run on 2026**." ✅ exactly the required wording |
| **Unique phrase from the most recent trim** | — | **FOUND** — "Second, **the immediate submission is this proposal alone**, which is why it has its own row in the weekly plan below, placed after G0 and clear of G1, G2 and G2-H" (the trim note's own new sentence) |

Further latest-state markers found in the renders: **`G2-H`** in both; **`G4`** in both; the
"**conditional, not part of the guarantee**" RESTCONF clause in both; the trimmed-prose signatures
"**smallest possible write demonstration**", "**the deliverable does not change if it is absent**" and
"**blast radius**" in both; and in the outline the full ruler convention "**column 18 + 5(w − 1)**",
"**no bar extends past column 77**" and "**re-measured character by character**". The outline `.docx`
also carries the Stage C span as "Weeks 8–10" and the Stage C entry gate (L390 content) verbatim.

**Conclusion: both renders are current.** Neither is a pre-trim or pre-fix artefact; each contains the
finalised Stage B span, the convention paragraph, the narrowed 2024 sentence (short proposal) and the
most recent trim's distinctive wording. Cross-check: the renders' plain-text sizes (236,363 chars /
2,649 lines outline; 125,200 chars / 1,351 lines short) are consistent with the source markdown sizes,
and the 100.000% source-line coverage in V1 independently proves no source content is absent from the
renders.

---

## V6 — Nothing that should be present is missing: NOTHING ABSENT

**Short proposal (`FYP-Proposal-SHORT.md`, 733 lines / 29 tables):**

| Required apparatus | Present? | Location / evidence |
|---|---|---|
| Decision table | ✅ | §10, L602–L619 — **all 16 rows D-01…D-16** verified present |
| Completion conditions | ✅ | §3.3, L112–L121 — **C1…C8 all present** |
| Evaluation set | ✅ | §7.6 L475–L505 — 12 scenarios, 5 injected faults, **PB-1…PB-9 all present**, hallucination check, drift false-positive check, audit-log coverage check |
| Stage scheme with gates | ✅ | §7.2 L316–L321 — **Stage A–D**, entry/exit gate per row; §8.1 L515–L524 — **G0, G1, G2, G2-H, G3, G4, G5, G6 all present** |
| Weekly plan | ✅ | §8.2 L532–L546 — 12 weeks × 4 roles, with the immediate-submission row |
| Risk table | ✅ | §11 L627–L650 — **R1…R22** |
| Standards alignment, six domains | ✅ | §9.1 L565–L572 — all six exact titles (Work organization and management; Communication and interpersonal Skills; Data Transfer Networks; Network and System Operations; Infrastructure Automation; Troubleshooting) with weights 5/5/25/25/15/25 |
| Honest gap statement | ✅ | §9.2 L578–L592 (named-absent nine; no-AI-content fact; 2026 removals; screen-capture provenance) and §9.3 L594–L596 ("What falls outside the standard, and why it is in the project anyway") |
| References | ✅ | §14 L702–L733 — 16 numbered references (2 WorldSkills standards, brief, 3 project documents, MCP, 2 RFCs, 2 Cisco documents, 4 vendor sets) plus the citation-discipline note |

**Outline (`FYP-Outline-DRAFT.md`, 1,521 lines / 73 tables):**

| Required apparatus | Present? | Location / evidence |
|---|---|---|
| Staged ramp | ✅ | §C.6 L369–L413 — stage table + hard-dependency list + use-case mapping + minimum-stage justification |
| Reachability matrix | ✅ | §C.2b L193 ff. ("Device-reachability matrix (normative)"); rows RW-01…RW-09, NR-01/NR-01a/NR-03, VP/PT rows |
| MCP server design | ✅ | §E.3 L625–L744 — **MCP-S-LINUX, MCP-S-WIN, MCP-S-CISCO, MCP-S-MON, MCP-S-DOC all present** (§E.3.1–§E.3.6) |
| Guardrails | ✅ | §E.5 L773 ff. and §E.5.1 L788 ("What the agent must NEVER do" — the eleven-item list) |
| Decision tables | ✅ | §A L78–L95 (C-table) and §J L1188–L1372 (expanded) — **D-01…D-16 all present (16/16)** |
| 12-week plan | ✅ | §F.1 gates L870–L879, §F.2 weekly plan L885–L899, §F.4 dependencies L944–L954 |
| Gantt | ✅ | §F.3 L901–L940 — **both** bands (main build chart L904–L921 and the stage-coverage band L929–L935) with their rulers |

**Additional completeness checks that could have failed and did not:** all eight gates (G0–G6 plus
G2-H) present in both; all six use cases UC-1…UC-6 present in both; all nine permission-boundary tests
PB-1…PB-9 present in both; all five MCP server identifiers present in the outline; all eight completion
conditions in both. **No missing apparatus. The only V6-adjacent observation is that the outline carries
its references as a *deliverable* (D10, L1024) rather than as a numbered bibliography section** — this
is consistent with its stated role as a decision draft ("a working reference artefact, not a banded
deliverable", L1064), not an omission.

---

## V7 — Standards facts: NO MISSTATEMENT

Every one of the required facts was checked as a claim, and every named technology was checked in
context to confirm it is presented as *named by the standard* or *absent from the standard*, never the
reverse.

| Required fact | Status | Evidence |
|---|---|---|
| Standard **names** ADDS, Nginx, OpenVPN, OSPF/BGP/EIGRP, GLBP/HSRP/VRRP/LACP/PAgP, CDP/NetFlow/Syslog/SNMP/tcpdump, Bash/PowerShell/Git/Ansible | ✅ **correct** | Outline §I.2 L1117–L1120; short §9.2 L578: "The standard names, among others, directory services, Nginx, OpenVPN, the routing protocols OSPF, BGP and EIGRP, the gateway and link redundancy set of GLBP, HSRP, VRRP, LACP and PAgP, neighbour discovery through CDP, flow export through NetFlow, syslog, SNMP, `tcpdump`, and Bash, PowerShell, Git and Ansible." All 21 names verified present in both documents. |
| Standard contains **no** FSRM, iSCSI, RRAS, IKEv2, Keepalived, nftables, WireGuard, RSTP, ASA | ✅ **correct, and used correctly** | Outline §I.3 L1121; short §9.2 L578: "Nine technologies the topic sheet names have **zero occurrences** in the 2026 standard text and its raw page source: **FSRM, iSCSI, RRAS, IKEv2, Keepalived, nftables, WireGuard, RSTP and ASA**." Every occurrence in both documents is either list membership in this absence claim / the §I.3 heading, or a project design choice the document explicitly says is *bridged from the brief*. **No occurrence presents any of the nine as a standard requirement.** |
| Standard contains **no** Agentic AI, OpenClaw, MCP, **and no AI content at all** | ✅ **correct, and used correctly** | Outline §I.4 L1136: "**WSOS 2026 contains no AI content whatsoever.** Zero occurrences of `AI` … of `artificial intelligence`, of `machine learning`, of `Agentic`, of `OpenClaw`, and of `MCP` / `Model Context Protocol`." Short §9.2 L580: "**The 2026 standard contains no artificial-intelligence content whatsoever** … **No claim that the standard covers agentic AI or MCP is supportable, and making one would be trivially contradicted.**" `OpenClaw` appears in the outline only as a **quotation of the topic sheet** (L618: "It is the topic sheet's own idea. \"AI Network Management (e.g., Agentic AI, OpenClaw Skills, etc.)\"") and in withdrawal/migration rows (L1447, L1478, L1479) where the outline **removes** any dependency on it. **No AI content is attributed to the standard anywhere.** |
| 2026 edition **removed** Python, YANG, RESTCONF, NETCONF from its automation domain | ✅ **correct** | Outline §I.5 heading L1150: "**The 2026 edition removed Python, YANG, RESTCONF and NETCONF**"; short §9.2 L592: "the 2026 edition **removed** four automation-domain items the 2024 edition contained: **Python, YANG, RESTCONF and NETCONF**. The project's use of RESTCONF … must **not** be cited as a standard requirement." Both documents correctly treat RESTCONF as a *brief-justified* interface, and the outline explicitly makes it **conditional** (C1 L136, Stage B L389 L389). |
| Screen captures are an **HDTN brief** requirement, **not a WSOS** one | ✅ **correct** | Short §9.2 L592: "screen captures are required by the **HDTN brief, not the standard**: the 2026 page contains zero occurrences of screen, screenshot, capture or evidence." Outline L1032: "The topic sheet requires *\"all findings, manuals, steps, screen captures, verifications, and references\"*. **WSOS 2026 does not mention screen captures**." |
| AI/MCP layer argued as **beyond** the standard, never required by it | ✅ **correct** | Outline §I.4 L1146: "an innovation **justified by**, but **beyond**, the standard"; §I.4 title L1134 "The AI line — innovation **justified by**, but **beyond**, the standard". Short §9.2 L590: "It is an innovation **justified by** the standard and deliberately **beyond** it; **it is not claimed as compliance**." The bridging argument is drawn from Domain 1's currency/research/embrace-change lines (quoted verbatim in the short proposal at L584–L588), which is the correct and only supportable construction. |

**No misstatement found in either document on any of these seven points.**

---

## V8 — Workspace in the expected final state: EXACT MATCH

Root `D:\File\School\FYP\` contains **exactly eight entries — six files and two directories, nothing
else** (no stray scratch, backup, lock or temp file):

```
DIR   legacy
DIR   proposal
FILE  AY2627_FYP topics_v2_Victor Li.docx     30,949
FILE  FYP-Outline-DRAFT.docx                 138,906
FILE  FYP-Outline-DRAFT.md                   262,888
FILE  FYP-Proposal-SHORT.docx                 65,799
FILE  FYP-Proposal-SHORT.md                  131,405
FILE  image.png                              141,462
```

| Check | Result |
|---|---|
| Exactly `legacy\`, `proposal\`, the user's topic docx, `image.png`, outline `.md`+`.docx`, short `.md`+`.docx` | ✅ **exact** — no extra entry |
| Superseded long documents **inside** `legacy\` | ✅ **all eight present**: `FYP-Proposal-COMPLETE.docx` (924,023), `FYP-Proposal-COMPLETE.md` (1,974,693), `FYP-Proposal-COMPLETE-ZH.docx` (1,036,570), `FYP-Proposal-COMPLETE-ZH.md` (1,880,703), `FYP-Proposal-Volume1-Plan.docx` (350,563), `FYP-Proposal-Volume1-Plan-ZH.docx` (384,608), `FYP-Proposal-Volume2-Technical.docx` (582,139), `FYP-Proposal-Volume2-Technical-ZH.docx` (660,159), plus `README.md` |
| Superseded long documents **absent from root** | ✅ **confirmed** — no `FYP-Proposal-*` file other than the two short-proposal deliverables |
| `AY2627_FYP topics_v2_Victor Li.docx` = **30,949 bytes** / **`1B847CF41700BD1DB3C0E3D5E540BC349674A8177B057AD9AC09F897B4AAFB4E`** | ✅ **EXACT MATCH** on both size and hash — the user's original is **not** corrupted |
| `image.png` = **141,462 bytes** | ✅ **exact** (SHA-256 `E2001305D91C2DDF02F8F77310C52459A1C6855CF79D057F564C13C866967FDF`, recorded for the record) |
| Opened with SDK by path / Word COM / Word | ✅ **never** — only `Get-Item` + `Get-FileHash`, which cannot rewrite a file |

---

## V9 — Nothing else damaged: tools byte-unchanged; section/i18n hashes only partly verifiable

### `proposal\tools\` — byte-unchanged, CONFIRMED for the decisive file

The task's decisive check is exact, and it passes:

| File | Bytes | SHA-256 |
|---|---|---|
| `tools\md2docx\convert.js` | 175,212 | **`33677F7819C1866B8F6D234F86951EAFE6798A3C8D9FF26F27789F2917D5D12A`** ✅ **matches the required hash** |

Also confirmed: `convert.js` is byte-identical to its own `convert.js.bak-before-emphasis-adjacency-fix`
and `convert.js.bak-before-order-fix` copies (all three `33677F78…D5D12A`), so the file that rendered
these documents is the pinned one and no post-fix edit slipped in. I hashed every regular file under
`proposal\tools\` recursively (the whole `md2docx\` toolset, its six `.bak-*` variants, the
`stress\` fixtures and the `i18n-w6-auto\` corpus) — all readable, none missing, no zero-length
anomaly beyond the intentionally-empty i18n placeholder `.txt` files. **I cannot prove "byte-unchanged"
against a recorded per-file baseline for all of them**, because no integration report publishes a full
tools manifest; the evidence is (a) `convert.js` matches the required hash and its own backups, and
(b) the two deliverable renders validate clean against the unmodified gates, which would not hold if a
gate had been altered to pass them.

### `proposal\sections\` (8 sources) and `proposal\i18n\zh-HK\` (8 translations) — PARTLY VERIFIABLE, gap reported rather than guessed

**A recorded baseline does exist.** `proposal\integration\consistency-report.md` §8 publishes SHA-256
for all eight `sections\*.md` at hand-off, and `patch-application-report.md` §1 and
`residual-fix-report.md` §3 publish later before/after tables. Comparing current state to those:

**`sections\` — 5 of 8 current hashes are recorded as the expected final-state hash:**

| File | Current bytes / SHA-256 | Recorded baseline that matches | Verdict |
|---|---|---|---|
| `03-microsoft.md` | 293,626 / `2539D46F…5124C` | `patch-application-report.md` §1 and `residual-fix-report.md` §3 (both "unchanged") | ✅ **matches recorded** |
| `04-linux.md` | 277,513 / `5BDF1431…01EA` | `residual-fix-report.md` §3 after-value | ✅ **matches recorded** |
| `05-cisco.md` | 217,092 / `AD6D34E1…105B` | `residual-fix-report.md` §3 after-value | ✅ **matches recorded** |
| `06-automation.md` | 297,919 / `E5F48EA8…96BA` | `residual-fix-report.md` §3 after-value | ✅ **matches recorded** |
| `08-project-management.md` | 429,558 / `BF8A1F2B…48F1B` | `residual-fix-report.md` §3 after-value | ✅ **matches recorded** |
| `01-introduction.md` | 115,332 / `E635EA0D…9316` | None. The reports record `513A01A0…F9D2` at 115,332 bytes ("unchanged") | ⚠️ **no baseline records this hash** (same byte count, different content hash) |
| `02-architecture.md` | 207,452 / `306E30A3…EC33` | None. The reports record `280C9ABC…3466E` at 207,450 bytes | ⚠️ **no baseline records this hash** (2 bytes larger) |
| `07-ai.md` | 137,844 / `8C0C5E40…1588` | None. The reports record `989FA261…FA5` at 137,806 bytes | ⚠️ **no baseline records this hash** (38 bytes larger) |

**`i18n\zh-HK\` — only 1 of 8 has any recorded baseline at all:**

| File | Current bytes / SHA-256 | Recorded baseline | Verdict |
|---|---|---|---|
| `03-microsoft.md` | 281,703 / `BBAD4FBE…76EA` | `emphasis-source-fix-log.md` | ✅ **matches recorded** |
| `01, 02, 04, 05, 06, 07, 08` | see tool output | **No integration report publishes a baseline for any of these seven** | ⚠️ **cannot verify — no recorded baseline exists** |

**What I can and cannot say, precisely.**
- I **can** say: five section sources and one translation match their last recorded expected hash; the
  four longest-lived tool files including `convert.js` match their pinned hashes; nothing under
  `proposal\tools\` is missing or anomalous; the root and `legacy\` are exactly as V8 requires.
- I **cannot** say: that `sections\01`, `sections\02`, `sections\07` and seven of eight `i18n\zh-HK\`
  files are "byte-unchanged", because **no integration report publishes a baseline for their current
  hashes**. Searches for those nine hashes across the *entire* `proposal\` tree returned zero hits.
- **These eleven files are not part of the two deliverables under acceptance**, and the documents that
  are under acceptance are proven current and complete (V1, V5, V6). The gap is a *record-keeping* gap
  in the project's own logs, not evidence that anything was damaged. I am reporting it rather than
  guessing, as instructed. A reviewer wanting full coverage should note that `sections\02-architecture.md`
  and `sections\03-microsoft.md` (and `i18n\zh-HK\03-microsoft.md`) carry modification times of
  **26/9/2026 03:01**, inside the emphasis-fix window but *newer* than several logs, and that the three
  unverified section files are all slightly **larger** than their last recorded state.

---

## V10 — Overall verdict

### **ACCEPT WITH CAVEATS**

The two documents the student is about to submit are in the state they are claimed to be in. This was
re-derived, not accepted:

- **Gates**: `sdk-validate.ps1` → **0 errors, exit 0** on both. `verify-package.ps1` → **9/9 PASS,
  exit 0** on both. `validate.ps1` → **PASS, 2,524/2,524** (outline) and **1,318/1,318** (short
  proposal), both **100.000%**, **no drop**. Hashes identical before and after every run — **validation
  did not mutate either artefact**, and both `.docx` hashes equal the ones supplied.
- **Length**: the short proposal measures **9,996 prose words** by the canonical method — reproduced to
  the word — and **9,984** by a stricter markdown method. **At the ceiling, not above it.** Outline:
  15,069 prose words.
- **Consistency**: the outline is internally consistent on all five narrative points; the short proposal
  agrees with the outline on **34/34** substantive shared properties with **0 divergences**.
- **Currency**: both renders are current (finalised Stage B span, convention paragraph, narrowed 2024
  sentence, latest-trim wording all present in the raw ZIP text).
- **Completeness**: nothing missing from either document's apparatus.
- **Standards**: no misstatement on any of the seven checked facts.
- **Workspace**: root listing exact; superseded long documents all inside `legacy\` and absent from root;
  the user's original is intact at **30,949 bytes / `1B847CF4…AAFB4E`**; `image.png` 141,462 bytes.

### The single most important thing to fix

**The two misframed bars in the outline's §F.3 stage Gantt band.** `STAGE A` is drawn in columns 28–52
(weeks 3–7) but §C.6 and §F.3's own prose state weeks **2–7**; `STAGE C` is drawn in columns 48–67
(weeks 7–10) but both state weeks **8–10**. `STAGE B` (weeks 3–8) and `STAGE D` (weeks 10–12) are
correct. The cause is the fixed 27-column label field forcing every bar to column 28. **Fix**: shift
`STAGE A`'s bar one week left (begin column 23) and `STAGE C`'s bar one week right (begin column 53),
or correct the two prose spans — but the spans match §C.6, so the bars should move. This is a
figure-drawing error only; no gate, week span, decision or use case depends on it, and the ruler,
gate markers, whole-cell alignment and no-overrun-77 properties are all verifiably correct.

**Second-order, worth a line in the report but not blocking:** the 9,996 figure sits on the 10,000
ceiling, so it is safe only under the stated prose definition — a reviewer applying an inclusive prose
definition (counting table cells) would see 18,977, and the document should keep the method statement
with the number, as it currently does.

### What I could not verify

1. **Word-openability and visual fidelity of either `.docx`.** Not attempted by design — no Word, no
   COM, no SDK-by-path. Layout, fonts, page breaks, table pagination, and whether the 77-column §F.3
   code block overflows the page were **not** inspected. (The producing note flags the same gap.)
2. **Full byte-unchanged status of `proposal\tools\`.** `convert.js` matches the required hash and its
   own backups and all files are present, but no report publishes a complete per-file tools manifest, so
   I verified the decisive file rather than all ~34.
3. **The eleven `sections\`/`i18n\` files with no recorded baseline** — `sections\01`, `sections\02`,
   `sections\07` and `i18n\zh-HK\{01,02,04,05,06,07,08}`. No integration report anywhere in
   `proposal\` records their current hashes, so their "expected" state is unknowable from the workspace.
   Reported as a gap, not guessed (V9).
4. **The 2024 WSOS edition's raw page source.** No such artefact exists in the workspace; the 2024
   finding is a text-level result only — which is exactly why §9.2 was narrowed, and the narrowing is
   present and correct in the render.

---

*End of acceptance report. Read-only: no existing file was modified, moved, renamed or deleted; the
only file written is this report.*
