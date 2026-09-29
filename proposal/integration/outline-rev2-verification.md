# Independent verification — `FYP-Outline-DRAFT.md` / `.docx`, Revision 2 (the four ratified SQ answers)

**Verifier:** independent worker agent (not the revising agent). **Date of check:** the session in which Revision 2 was delivered.
**Mode: READ-ONLY.** The only file created by this verification is this report. Scratch output was written under `$env:TEMP` only.
No `.docx` was opened with the Open XML SDK **by path**, with Word COM, or with Word. Every `.docx` read below was raw ZIP access (`System.IO.Compression.ZipFile` + `XmlDocument`, `w:t` extraction) or a tool that opens from an in-memory `MemoryStream` (`sdk-validate.ps1`). Every UTF-8 read used `[System.IO.File]::ReadAllText($p,[System.Text.Encoding]::UTF8)` or Node. Nothing was installed; no tool, section file, i18n file, research file, or other agent's report was modified.

Source of truth read in full or in the relevant part: `FYP-Outline-DRAFT.md` (1,508 lines). Change log read: `proposal\integration\outline-fix-log.md` Revision 2 entry (lines 403–560). The claims in that entry were **re-derived from the document**, not accepted.

## 0. Artefact identity (re-measured)

| Artefact | Size | SHA-256 (re-measured) | Matches the log's Revision-2 figures? |
|---|---|---|---|
| `FYP-Outline-DRAFT.md` | 246,559 bytes | `B172D5963BDB08BE848032E0006A8553E60835AB81EA1494DFFEF0DC19AB651F` | **Yes** — identical |
| `FYP-Outline-DRAFT.docx` | 132,049 bytes | `38EE0EE9C6DCB5CE7078427EDC346D3DFB1B5A0CAD465122E31D7DC6828BFB0E` | **Yes** — identical |
| `proposal\integration\backup-outline-sq-ratify\FYP-Outline-DRAFT.md.bak` | 197,870 bytes | `5546CE59…D18F` | **Yes** — matches the claimed pre-edit Revision-1 hash |
| `proposal\integration\backup-outline-sq-ratify\FYP-Outline-DRAFT.docx.bak` | 110,517 bytes | `B2FD9F74…5BBD` | **Yes** — matches the claimed pre-edit Revision-1 hash |

The two backups independently corroborate that the delivered Revision 2 really was written over the Revision 1 bytes the log names.

---

## V1 — The staged ramp exists, is coherent, and does not contradict the rest of the document

### V1.1 The section exists and is where it is claimed

`### C.6 The staged AI-coverage ramp — how management is introduced incrementally (SQ-1's answer, made operational)` — **line 367**, inserted between §C.5 and §D. Confirmed present in the Markdown **and** in the render (probe: `C.6 The staged AI-coverage ramp` → present).

The dependency chain is drawn first (lines 371–378) and then stated as a rule (line 380):

> **Each arrow above is a hard dependency, not a preference:** no MCP server may be written before the thing it manages is reachable, authenticated and logging (§B.2's rule, and §L.5's gate). **No stage may be entered by declaring it entered — a stage is entered only by its entry gate being evidenced, and left only by its exit gate being evidenced.** Stages may overlap in calendar time; they may not be reordered.

### V1.2 Stage table — every required field is present for all four stages

Header (line 382): *Stage | What becomes AI-manageable | Preconditions (entry gate) | The demonstration that proves it | Evidence required | Exit gate | Weeks it can fall in*. All seven columns are populated for A, B, C and D.

**Stage A — the server estate** (line 384)
- *Becomes manageable:* §C.2b RW-01, RW-02, RW-03 (all 9 Windows guests), RW-04, RW-05, RW-06 (all 10 Ubuntu guests) and RW-09 — "these hosts are already reachable, so this stage needs **no Cisco platform and no GPU**".
- *Entry gate:* named hosts up/authenticated/logging; `MCP-S-LINUX`, `MCP-S-WIN`, `MCP-S-MON`, `MCP-S-DOC` written against only rows evidenced `REACHABLE`; allow-lists and read-only/mutating classification frozen.
- *Demonstration:* the four servers answer real questions; **UC-3 and UC-6 run end to end**; tool-calling probe set run and malformed-call rate reported.
- *Evidence:* "One **filed transcript per `REACHABLE` row**"; tool listings; audit log; "**§C.2b's `REACHABLE` rows filing their transcripts flip from claim to fact**".
- *Exit gate:* "Every row this stage claims is **evidenced in §C.2b and in §H.2 rule E9**, not merely designed".
- *Weeks:* **2–7** (platform/templates 1–2, services verified at G2 week 6, AI-to-server demonstration week 7).

**Stage B — the first genuinely reachable Cisco device** (line 385)
- *Becomes manageable:* **one** device of the kind RW-07 will hold; "**RW-08 is not required to pass this stage**".
- *Entry gate:* G0 has ratified the platform (B2) and lab rules permit it; `MCP-S-CISCO` written against one device, `show`-only allow-list, no configuration mode; device logging to central syslog.
- *Demonstration:* read-only end-to-end run — `ssh` login, `show version`, one `snmpwalk -v3`, one `restconf` GET "where the image supports it", with the agent reporting "**through `MCP-S-CISCO` only**".
- *Evidence:* exact `show version` string; `snmpwalk -v3` output (authPriv; "**SNMPv2c and community strings are forbidden**"); syslog lines; the §C.2b transcript; the `MCP-S-CISCO` tool listing.
- *Exit gate:* "Every precondition and every piece of evidence is filed. **This is the minimum acceptable stage** (justified below)…on **one** device rather than on an aspiration".
- *Weeks:* **3–8** ("`show version` capture **is** §F.1's **G1 (week 3)**, but the stage closes when the **AI** manages the device, which is **week 8** at the earliest").

**Stage C — the full Cisco target set** (line 386)
- *Becomes manageable:* the **five D-16 devices** (HQ core pair, WAN edge, branch, perimeter firewall), largely RW-07 with RW-08 carrying the ASA-class perimeter "where that platform is available".
- *Entry gate:* Stage B exited; routing/switching/perimeter services up and verified so there is state to read.
- *Demonstration:* **UC-1 and UC-2 across all three families**; each of the five devices answers through `MCP-S-CISCO`.
- *Evidence:* "**Five §C.2b transcripts — one per device**"; five-device topology; the allow-list verbatim.
- *Exit gate:* "Every device the stage claims carries a transcript, and the count is reconciled with **D-16**. **Devices that sit inside Packet Tracer as `NR-01` are excluded by definition and must never be counted here**".
- *Weeks:* **8–10**, AI-side closure at **G4 (week 10)**.

**Stage D — OPTIONAL: peer-side eBGP verification** (line 387)
- *Becomes manageable:* the peer AS-65000 provider, converting NR-01a into an RW-07 row.
- *Entry gate:* Stage C exited; a second genuinely reachable CML IOS-XE node under D-01 with D-12 licence cover; added as an RW-07 row; count reconciled with D-16.
- *Demonstration:* two-sided `show ip bgp summary` / `show ip route bgp` through `MCP-S-CISCO` in one recorded run.
- *Evidence:* transcripts from both sides plus the NR-01a → RW-07 reconciliation and the licence record.
- *Exit gate:* "**A bonus, not an exit criterion for the project.**"
- *Weeks:* **8–11, "and only if Stage C closed early"** (see V1.5(b) — this is internally strained).

The chain is also stated as four numbered hard dependencies (lines 389–394) and mapped to the committed use cases (lines 398–405). **A minimum acceptable stage is stated and justified** (line 407): Stage B, because "the student's ratified answer to SQ-1 requires the Cisco layer to become genuinely manageable, and the only thing that demonstrates a genuinely manageable network device is a **device the AI layer actually manages**", achievable with "**one** device, **one** server and **no GPU**"; "**So Stage B is the floor, not the target.** Stage C is the **operational target**; Stage D is a **bonus**."

### V1.3 The incrementality requirement is genuinely gated on evidence (this also answers V2 — the rule is present)

Three independent rules, all quotable, all in the document:

1. §C.6 hard dependency 3 (line 393): "This is the 1→5 relationship, and it is monotone **only in one direction**: the count may rise from one to five as transcripts are filed, and **may never be raised by design intent** — **D-16** and §C.2b's normative rule are what forbid it."
2. §C.2b's consuming paragraph (line 231): "a row may not be advanced to a later stage by design intent — **only by a filed transcript, per this matrix's own verification obligation above** — and **nothing at all may be claimed from `NR-01` at any stage**".
3. §C.6 preamble (line 380): a stage "is entered only by its entry gate being evidenced, and left only by its exit gate being evidenced", plus §B.2 (line 126): "**A stage is entered when its preconditions are evidenced and left when its evidence is filed; it is never entered by declaration.**"

**Verdict V2: the "not all at once" requirement is satisfied by an evidence gate that binds the device count, not merely by descriptive prose.** The rule is in the Markdown and in the render (`may never be raised by design intent` → present in `word/document.xml` text).

### V1.4 Cisco device count — mutually consistent

Every Cisco count in the document now traces to D-16: §C.1 "**5 target, 8 at most**" (line 161); §C.2b coverage table "5 target (D-16) … 5–8, **conditional**" (line 226); §C.4 "the CML target is five devices … rising to at most eight only if every one of them can be evidenced as `REACHABLE`… under the hybrid fallback the reachable count is **2–4**" (line 312); §D.2 "the **five Cisco devices fixed as the target by D-16** (eight at most)" (line 490); Stage C "the **five Cisco devices fixed by D-16**"; §J-D-16 (line 1343). **No competing figure survives** — the previously disagreeing 5–8 / 5–6 / implied-5 are named only as the historic disagreement. Stage D's extra node is explicitly reconciled against D-16 (§J-D-16, line 1345). **Consistent.**

### V1.5 Cross-section contradictions found

**(a) The stated minimum stage (B) does not satisfy the document's own definition of done or its G4 gate — because the committed use cases need Stage C.**
- §B.3 C6 (line 139): "*The agent completes the committed use cases from Section E.7 against the live estate, with transcripts.*" Its only reduction path is **tier-based** (T0/T1 → UC-1/UC-3/UC-5), **not stage-based**.
- D-06 (line 83, §J line 1255) commits **UC-1, UC-3, UC-4** (plus UC-2/UC-5 if week 10 allows).
- §C.6's own mapping table (line 403) states UC-1's earliest full stage is **C** ("Its whole claim is *cross-family*: with two families it is not the use case the report describes. At Stage B it is run in the narrowed form … and **the narrowing must be written down as such**"), and UC-2's earliest stage is **C**.
- §F.1 G4 (week 10, line 873): "The committed use cases run end to end on the live estate".
- Therefore a project that lands exactly on the **minimum acceptable stage (B)** fails B.3 C6 and G4 as written, while §C.6 says Stage B is an acceptable floor. **The ramp needs a stage-based reduction clause in B.3 C6 (or G4) symmetric with the tier-based one it already has**, otherwise "minimum acceptable" and "definition of done" disagree.

**(b) Stage D's weeks window contradicts its own precondition (and §C.4/§J-D-01).**
- Stage D entry gate: "**Stage C is exited**" (line 387). Stage C's own window is **weeks 8–10**, exiting at **G4 (week 10)**; Stage B cannot exit before week 8. So Stage D cannot begin before ~week 10, yet its weeks column reads "**Weeks 8–11**".
- §C.4 (line 310) and §J-D-01 (line 1214) both say the peer-side/second-node decision "**must be taken in week 1**" (it changes the device count and the CML licence requirement, D-12/D-16), while §C.6 makes Stage D optional, "**explicitly not required within the 12 weeks**", and taken up "**only after Stage C is evidenced**". The **decision-in-week-1** requirement and the **optional-and-late** status are not reconciled.

**(c) Stage A's proving demonstration requires a use case that D-06 deliberately does not commit.**
- Stage A demonstration (line 384): "**UC-3 (drift check) and UC-6 (estate Q&A) run end to end**"; the mapping table (line 401) lists UC-6 → A.
- D-06/§E.7 (lines 808, 1255): commit to **UC-1, UC-3, UC-4**; "**never promise six**"; UC-6 is the sixth. So Stage A's exit gate depends on a non-committed use case. (Impact is limited because Stage A is below the floor, but it is a real cross-reference inconsistency.)

**(d) §B.3 C1 requires two management interfaces beyond SSH; Stage B's evidence guarantees only one unconditionally.**
- C1 (line 134): Cisco devices "**that expose working SSH, and at least two of {SNMPv3, RESTCONF, NETCONF}**".
- Stage B's demonstration/evidence requires SSH + `snmpwalk -v3` **unconditionally** and RESTCONF only "**where the image supports it**". If the chosen image has no RESTCONF (which §C.4 concedes is possible, and which classic IOS lacks), a minimum-stage delivery can fail C1.

**(e) Cosmetic: the §F.3 ASCII gate rows are not aligned to the week ruler (the pre-existing band shares this; the new ramp band inherits it).**
- Ruler columns: W1 at col 17 … W6 42 … W10 62 (5-char cells). In the **first** band, the gate row places **G1 at col 46, G2 at 56, G3 at 61** — i.e. in the week-6/7, week-8/9 and week-9/10 cells, although G1=week 3, G2=week 6, G3=week 8.
- In the **new ramp band** (line 923) the four gates are drawn in four *consecutive* cells (G1 46, G2 51, G3 56, G4 61) — again not at their weeks (3/6/8/10). The one alignment claim that does hold is that **G2-H shares G2's column, which is correct (both week 6)**.
- The new stage bars also sit right of the gates the ramp says they close at: `STAGE B` is drawn at cols 64/68 (≈W10/W11) though §C.6 says Stage B closes at G3 (week 8); `STAGE C` at cols 69/73 though Stage C closes at G4 (week 10); and `STAGE D`'s ellipsis runs to col 78, **past the W12 edge of the ruler**, although its table window is weeks 8–11.
- This is diagrammatic only — a fenced ASCII block, no decision content — but the document asserts the band is drawn "beneath the same week ruler", so it is worth a one-line fix.

**(f) Minor: Stage A's cell says "RW-04, RW-05, RW-06 (all 10 Ubuntu guests)" while also naming RW-09.** §C.2b's own enumeration puts `vpnz-ai01` in RW-09, so RW-01…RW-06 cover 18 guests and RW-09 the nineteenth. The parenthetical is loose but the cell names RW-09 in the same breath, so all 19 are covered; no count error results.

**V1 verdict: the ramp exists, has all required fields, forms a dependency chain, states and justifies a minimum, and the Cisco count is consistent. Two substantive cross-section gaps remain — the minimum stage (B) vs the committed use cases/definition of done (§B.3 C6, G4) and Stage D's precondition-vs-window (and its week-1-decision conflict with §C.4/§J-D-01).**

---

## V2 — Is the incremental requirement genuinely satisfied?

**Yes.** The rule is not descriptive prose; it gates the managed-device count on filed evidence. Exact quotes in V1.3 above (`may never be raised by design intent`; `only by a filed transcript`; `never entered by declaration`). Re-derived independently in the render text as well (§V9).

---

## V3 — The deferred hardware decision

**(a) A scheduled decision gate with a week and an owner exists.**
- §F.1 (line 871): "**G2-H — Hardware and model tier decided** *(the deferred SQ-2 gate; owner S4)* | **6** | … **It is the gate at which B1, B3 and D-04 are closed.**" with a stated failure action ("plan the AI line against the T0/T1 fallback (§E.1.3) and say so").
- §E.1.1 (line 512–514): "**Action item (owner: S4, at G2-H — end of week 6)**", with the full field list retained verbatim (GPU model, VRAM, RAM, disk, CPU/cores, OS, shared/bookable/dedicated, install permission, outbound rules, **both hosts**).
- §G.2 RACI (line 977): "**Lab-machine specification and model tier (B1/D-04) — gate G2-H, week 6** … S4 **A/R**".
- §F.2 week 6 leads with G2-H (line 888); §J-B1/D-03/D-04 heading is re-titled "(blocked at the scheduled gate G2-H, end of week 6 — no longer blocking now)"; §M item 1 is re-timed.

**(b) An explicit statement of what proceeds WITHOUT the hardware specification exists.** §E.1.1a (line 518–532) is a five-row table (the whole network/services layer; the five MCP servers; the agent scaffolding/guardrails; the evaluation harness; the evidence scaffolding), closed by: "**What waits, and only this:** the **model class** … and the **serving configuration** … **Those two decisions, and nothing else, are what the hardware answer gates.**" Reinforced at §J-B1 (row "What the deferral does NOT block") and §J-D-04 (row "What proceeds without this row"), §F.4 (line 943), §M item 2a.

**(c) The tier table and the no-GPU fallback are still present and only re-timed.**
- §E.1.2 (lines 536–542): **T0 / T1 / T2 / T3 / T4**, all five rows intact (CPU-only through multi-GPU), with the T3/T4 inversion note.
- §E.1.3 (lines 562–571): the no-GPU fallback, six numbered items intact, including the honest report sentence.
- Explicitly labelled as re-timed, not deleted: §E.1.1a "The tier table **T0–T4** and the **no-GPU fallback path** … are **unchanged and remain valid**"; §A's D-04 row "only the decision's timing is re-labelled"; §J-D-04 "retained unchanged"; the Chinese summary "**這五層與無 GPU 後備路徑全部保留，只是把時序重新標示**". Confirmed against the Revision-1 backup: the revision did not remove content from either block.

### Places that still treat the hardware specification as a CURRENT blocker (each is a contradiction of the deferral)

1. **§A, "Blocking now" table (lines 60–65)** — "**Only two items still block work starting now.**" with rows **B2** *and* **B3 — The model class (derived from B1, then measured) … provisional end of week 3; confirmed at G3 (week 8)**. This is the single clearest residue: B3 is derived from B1, and §E.1.1a states the model class is exactly what waits. §A itself says two paragraphs earlier (line 56): "Nothing before that gate needs the specification (§E.1.1a)." **Direct self-contradiction**, and it also contradicts §M line 1489: "**Only ONE item blocks work starting now — item 2, the Cisco platform ratification (B2).**" (§A says two; §M says one.)
2. **§A's D-10 row (line 87)** — "must be decided by: **end of week 3**". B3/D-10 is the model class; §F.1's G2-H closes B3 at **week 6**.
3. **§J-D-10 (line 1190)** — "**By when … provisional end of week 3**, confirmed at G3 week 8 (model class, after measurement — B3)", which also contradicts **§J-D-10's own "Status against the schedule" row** (line 1300): "The **week-5–6 spike** (§F.2) is what produces it".
4. **§F.1 G0 (line 868)** — the week-1 gate requires "**D-01 to D-05**, D-09, D-11, D-12 and D-16 answered". "D-01 to D-05" **includes D-04**, which the same document defers to G2-H (week 6). The deferral was not propagated into G0's answered-list.
5. **§A's D-03 row (line 80)** — "must be decided by: **end of week 1 (with B1)**". D-03 is the lab machine's *role*, hardware-dependent; "(with B1)" is stale now that B1 is dated week 6. (§M item 1 correctly narrows week-1 work to *naming* the two hosts.)
6. **§K R20 (line 1383)** — "**Ask in week 1 as part of B1**; if weights cannot be fetched…". B1 no longer has a week-1 action.
7. **§K R18 (line 1381)** — "**Establish the booking rules in week 1**", which presupposes the machine arrangement the student deferred until their return to Hong Kong.
8. **§L.3 item 3 (line 1443)** — describes "a **blocking action item to capture the lab specification**" with no G2-H qualification (residual wording from Revision 1's §E.1.1 heading, which Revision 2 otherwise re-titled).

**V3 verdict: the deferral itself is implemented thoroughly (gate, owner, week, hardware-agnostic phase, table and fallback retained). But eight places still carry week-1/week-3 hardware timing, of which items 1–4 are genuine contradictions (not mere wording), and item 1 additionally breaks the "only one item blocks now" claim that §M makes.**

---

## V4 — The withdrawn framing and the differentiator status

Search results for `weakest` in the Markdown: **four** matches, of which **three** are the retired framing and **one** is unrelated.

| Line | Occurrence | Context | Active assertion? |
|---|---|---|---|
| 57 | `the old *"the AI line is the weakest line"* framing is **withdrawn as a ratified position**` | §A bullet summarising the SQ-4 answer | **No — withdrawal record** |
| 106 | `the corpus currently calls the AI line *"the weakest line"*, treats MCP as cuttable…` | §A.1 SQ-4 row, column "Why it is a supervisor's question" | **No — citation of the corpus inside the correction record** |
| 1463 | `W4 | *"the AI line is the weakest line"* … **WITHDRAWN — DEFINITIVELY, AND AS A RATIFIED POSITION RATHER THAN A RECOMMENDATION.**` | §L.4 register, status cell | **No — the withdrawal register itself** |
| 1118 | `WireGuard | … **the weakest bridge; say so**` | §I.3, a standards-bridge honesty note about WireGuard | **Different subject — not the AI framing** |

Equivalent formulations were also checked: "AI as an **optional**, read-only advisory proof of concept" (line 1433) and "AI is optional … therefore may be reduced" (line 1469) appear **only** inside §L.2's "postponed → now" change table and §L.4's **W10** withdrawal entry.

Positive status claims present and explicit: line 57 ("The **AI / MCP layer is the assessed differentiator**"); §A.1 SQ-4 ("**ANSWERED — CONFIRMED YES** … **both halves are ratified: yes, and yes**"); §L.4 W4 replacement cell ("**The AI / MCP line is THE ASSESSED DIFFERENTIATOR**, and the network is **the foundation it depends on**"); §I.4 closing block ("The **AI / MCP layer is the project's assessed differentiator**… **not claimed as WSOS compliance**"); §I.1 ("The AI layer is the differentiator, not the core"); §L.3 item 12.

The standards-alignment argument is still honest: §I.4 keeps WSOS 2026's **zero AI content** and its Domain-1 currency/research/embrace-change quotes, and states the three-part position that "**all three must appear together**": outside the standard / justified by it / **never claimed as compliance**. §I.5 still says "**do not cite the standard as requiring RESTCONF or NETCONF**".

**V4 verdict: all three `weakest line` occurrences sit inside withdrawal/correction records; none is an active assertion. The differentiator status is stated repeatedly and the standards argument is not inflated into a compliance claim.**

---

## V5 — Submission scope

- **Immediate tier = the proposal alone.** Front matter row "Submission scope now (SQ-5)" (line 14): "**The IMMEDIATE tier is the proposal alone — nothing else is being submitted at this stage** (「暫時只做 proposal」)". §H.1 **D5** (line 1008): "**Proposal** — **this is the IMMEDIATE submission, and the only thing being submitted now**". §H.3 (line 1037): "the immediate submission is the proposal alone". §A.1 SQ-5 (line 107) and §M item 13 (line 1504) repeat it.
- **The full 90,000–110,000-word document is the later tier.** §H.3's two-tier table (lines 1039–1042): later tier "**90,000–110,000 words**, hard ceiling 120,000 — a **58–69% cut**", status "**Later, and not the immediate deliverable**"; §H.1's closing note (line 1017) and §A.1 SQ-5 say the same.
- **The initial report appears as a single clearly-labelled future-deliverable note, in exactly one body place.** §H.3 (line 1044): "**A likely future deliverable, recorded in one line and NOT current scope.** An **initial report** is expected to follow the proposal in the programme's normal sequence — … — but **its exact required structure is `[TO CONFIRM]` … and it is not work to be done at this stage.** *(An earlier answer to SQ-5 suggested completing an initial report alongside the proposal; that was narrowed by the student to 「暫時只做 proposal」…)*". Cross-referenced (not restated as scope) at line 14 (front matter), line 107 (§A.1 SQ-5), line 1017 (§H.1 closing note) and line 1504 (§M item 13, in a parenthesis).
- **Not in the deliverable list:** D1–D12 contain no initial-report row; D5 is the proposal; D6–D12 are the later-tier set.
- **Not in the schedule as current work:** §F.2's 12 weekly rows contain no initial-report cell (week 12 is "Report assembly, consistency sweep, Chinese companion, presentation rehearsal" — the project report/final submission, and G6 is the end-of-project submission). **No place in the document implies a proposal-plus-initial-report scope.** The negative control probe `proposal plus an initial report` is absent from the render.

Two observations from the same pass, neither of which breaks the proposal-only scope:
- **§A.1's SQ-5 row (line 107) still asserts "This outline itself is sized to 6,000–10,000 words"**, while §H.3 measures it at **35,384 whitespace-split words** and states it is "a **working reference artefact, not a banded deliverable**" that "sits **well above** the 6,000–10,000-word outline band". §A.1 and §H.3 contradict each other on the same fact; §H.3's later, measured statement is the correct one. (The log claims the number was reconciled — it was, *inside §H.3*; the stale claim survives in §A.1.)
- The **immediate-tier proposal has no row in §F.2**; it appears only as §M item 13 (and as §H.3's option 1). Given that the proposal is the current target, its absence from the weekly plan is a gap rather than a contradiction.

---

## V6 — Chinese executive summary fidelity (lines 19–39) vs the English body

All four decisions are present in the Chinese, transcribed with the students' verbatim answers, and **none is softened or vaguer than the English body**:

| Decision | Chinese text (abridged) | Strength vs English |
|---|---|---|
| SQ-1 (incremental) | "Cisco 層**必須**真正可被 AI 接觸與管理，最終目標是全面管理，但**可以分階段逐步加入，並非一步到位**，因此新增第 C.6 節的**分階段 AI 覆蓋路線圖**（Stage A/B/C，另加可選的 Stage D），每一階段都有明確的進入條件、證明、所需證據、退出關卡與可落入的週次" (line 23); Stage A/B/C/D named with RW rows and the NR-01a reference, the 硬性依賴 stated, and "**最低可接受階段是 Stage B**，理由寫在第 C.6 節" (line 35) | **Equal** to the English; includes the minimum stage and the justification pointer |
| SQ-2 (deferred) | "**SQ-2 是延後而非否決** … **B1 與 D-04 的阻塞時間改為第 6 週的關卡 G2-H**（不是第 1 週）" (line 33); "**只有「模型類別」與「推論服務設定」才等待硬件決定**"; "**這五層與無 GPU 後備路徑全部保留，只是把時序重新標示**"; "**B1 規格紀錄同時要指名兩部機器**" | **Equal**, and on B3 specifically see the discrepancy below |
| SQ-4 (differentiator + withdrawal) | "**SQ-4 已答：是**——**AI／MCP 層就是被評分的差異化交付物**，而「AI 是最弱一環」的舊講法已**正式、明確地撤銷**（第 L.4 節 W4），不是建議而是已拍板立場" (line 23); line 39 repeats the honest "由標準引申而超越標準，而不是聲稱標準涵蓋 AI" | **Equal** |
| SQ-5 (proposal only) | "**眼前只遞交 proposal，暫時不做其他**…**現在的目標就是第一層：proposal 本身**… initial report 只**記錄為預期會在日後跟隨 proposal 出現的未來交付物，並非現時工作範圍**" (line 23); "**現階段只需要遞交 proposal**…90,000–110,000 字的完整文件屬於較後期的「完整遞交層級」" (line 39) | **Equal** |

**Discrepancies found (all of them are the Chinese being *more* consistent with the ratified answer than one English residue):**

1. **B3's timing.** Chinese line 37 places B3 with the deferred group: "而 B1（實驗室機器規格）、**B3（模型類別）**與 D-04（VRAM 層級）已改為「在已排定的時間點阻塞」… 所以它們的關卡是第 6 週的 G2-H". The English §A "blocking now" table (line 65) and §A D-10 / §J-D-10 place B3 at "end of week 3". The Chinese is aligned with §E.1.1a, §F.1 G2-H and §M; **the English §A/§J-D-10 residue is the outlier.** Not a Chinese defect, but a genuine English–Chinese divergence that must be resolved in the English.
2. **"Blocking now" count.** Chinese line 37: "**現在就阻塞的只有 B2**". English §A line 60: "**Only two items still block work starting now**" (B2 and B3). §M line 1489 agrees with the Chinese ("Only ONE item blocks work starting now…(B2)"). So the English document contradicts itself and the Chinese on this count.
3. **§A.1's "sized to 6,000–10,000 words" claim is English-only** and contradicts §H.3's measured 35,384; the Chinese makes no such claim (it states only that the full 90,000–110,000-word document is a later tier).
4. The Chinese line 37 lists **D-03** in the end-of-week-1 group, i.e. it shares the English §A D-03 week-1 date (see V3 item 5) — a shared residue, not a translation divergence.

**V6 verdict: no Chinese claim is absent from, weaker than, or stronger than the English. The only asymmetries are places where the Chinese is *more* faithful to the ratified deferral than a stale English row.**

---

## V7 — Decision-table consistency

- **SQ rows.** §A.1: SQ-1, SQ-2, SQ-4, SQ-5 are all marked **ANSWERED**; **SQ-3 is "STILL OPEN — this is the one question only a supervisor can close"** (line 105). §A.1's preamble (line 99) states the same: "SQ-1, SQ-2, SQ-4 and SQ-5 have been answered… **SQ-3 remains open**". **A supervisor-only question remains deliberately open, and that is appropriate**: SQ-3 asks for a supervisor's agreement to a change of position (read-only + approved changes replacing the previous design's total exclusion of state-changing actions), which the group cannot ratify for itself. The unresolved status is explicitly tied to that reason in both the preamble and the row.
- **Nothing the student decided is still marked open.** D-02 (compute) is CLOSED; D-07 (permission model) is CLOSED as governing policy with §J-D-07 pointing at E.4/E.5/E.8/I.8; SQ-1's direction is recorded as ratified in §A, §A.1, §C.6, §J-D-01 and §M item 2.
- **Three defects found:**
  1. **D-13 (offline-only vs hybrid) is simultaneously closed and open.** §A's preamble (lines 45–51) lists it as one of "**Three decisions are already closed** by the student and are now project policy" ("**Offline model only, or hybrid**"), while §A's own D-13 row (line 90) gives it a deadline of "**end of week 2**" with no CLOSED marker, §J-D-13 (lines 1192–1201) records it as a decision with options, a recommendation and "**By when: End of week 2**", and §M item 6 instructs the group to "**Answer … D-13 (offline vs hybrid)**". One of the two statements must go; if the student only expressed a preference, D-13 must not appear in the closed list.
  2. **§A's preamble count and §A's table disagree on which three rows are closed.** The preamble names compute (D-02), permission depth (D-07) and offline/hybrid (**D-13**); the table's three CLOSED rows are **D-02, D-07 and D-11** — and D-11 is closed "**by construction**", explicitly not a student decision ("This is not an open question: the answer is already executed in **four places**…"). So the document both over-claims D-13 as student-decided and lists a non-student row among the closed three.
  3. **B3/D-10's date remains in the table.** §A's D-10 row says "end of week 3" and §J-D-10 says "provisional end of week 3" while §F.1's G2-H closes B3 at week 6 (see V3 items 2–3).
- **Nothing decided on a mere preference:** D-05, D-06, D-15 are presented as recommendations with stated deadlines and are **not** marked decided; D-10, D-12, D-14 are correctly left `[TO CONFIRM]` (technical/entitlement questions the group must answer, not student decisions); D-16 is correct as an open week-1 decision fixing the previously-disagreeing count. D-01 remains "**needs ratification (B2)**" for the *platform record* while SQ-1's *direction* is ratified — the log's own distinction, and §M item 2 states it explicitly, so this is consistent rather than a contradiction.

---

## V8 — Gates, hash stability, and heading/table counts

Commands were run exactly as prescribed — one `-Path` per call, `powershell -NoProfile -ExecutionPolicy Bypass -File`, from `proposal\tools\md2docx`.

| Gate | Result | Exit |
|---|---|---|
| `sdk-validate.ps1 -Path …\FYP-Outline-DRAFT.docx` | **`OPEN : OK`, `ERRORS: 0`**, `RAW : no duplicate relationship Ids, no duplicate content-type declarations`, `SUMMARY|files=1 openFailures=0 validationErrors=0 rawIssues=0`, SDK 2.9.1.0, Office2013, opened from an in-memory copy (never by path) | **0** |
| `verify-package.ps1 -Path …\FYP-Outline-DRAFT.docx` | **`RESULT|…|PASS|all 9 checks passed`** — content types 2 Default / 11 Override / 14 parts; `_rels/.rels` 4 unique; `document.xml.rels` 8 unique; 3 `r:id` all resolve; **tables 73**, every `w:tblGrid` matching every row's `tc` count; 29 styles; 2 `numId`s; `w:body` 625 children with exactly one trailing `w:sectPr` | **0** |

**Hash stability.** `38EE0EE9C6DCB5CE7078427EDC346D3DFB1B5A0CAD465122E31D7DC6828BFB0E`, 132,049 bytes **before**, **between** (after SDK validation) and **after** both gates — byte-identical at every step. **Validation did not mutate the artefact.**

**Heading counts (re-derived independently).**
- Markdown, excluding fenced code blocks: **H1 = 1, H2 = 15, H3 = 73, H4 = 12** — matches the log's claimed `H1 1 / H2 15 / H3 73 / H4 12` exactly, i.e. the revision added the two new H3 subsections (§C.6, §E.1.1a) and nothing else.
- **On "no `# ` H1 heading": the literal claim is false.** Line 1 is `# Victor2 – Enterprise Network Infrastructure and Architect` — one H1, the document title, and the log itself records `H1 1`. What *is* true and is presumably the intended point: (i) there is exactly one H1 and it is the title (no body section uses H1); and (ii) in the render that title is styled `TitlePageTitle`, so `word/document.xml` contains **no `Heading1`-styled paragraph at all**. Render style census of direct body paragraphs: `TitlePageTitle` 1, `Heading2` 15, `Heading3` 73, `Heading4` 12 — **equal to the Markdown's heading levels**, so heading counts are internally consistent between source and render.

**Table counts are internally consistent.** Outside fenced blocks the Markdown has **73 tables** (73 blocks of consecutive `|` runs) and **654** pipe lines. A naive "separator row" regex matches 89 lines, but 16 of those are the `| | |` **header** rows of §J's key–value tables (`| | |\n|---|---|`). Correct separator count = **73**, so data rows = 654 − 73 = **581**, exactly the `581 rows` `verify-package.ps1` reports for the render's 73 tables. No discrepancy.

---

## V9 — Stale render?

Raw ZIP access (`ZipFile.OpenRead` → `word/document.xml` → `XmlDocument`, `w:t` concatenation per paragraph) on the delivered `.docx` (2,633 paragraphs anywhere; 221,098 characters extracted).

**Positive probes (Revision-2 content actually in the render):**

| Probe | Present |
|---|---|
| `C.6 The staged AI-coverage ramp` (new section heading) | **Yes** |
| `A — the server estate` / `B — the first genuinely reachable Cisco device` / `C — the full Cisco target set` / `D — OPTIONAL: peer-side eBGP verification` (all four stage labels) | **Yes** |
| `The minimum acceptable stage is Stage B, stated and justified` (minimum-stage statement) | **Yes** |
| `may never be raised by design intent` (the evidence-gated rule) | **Yes** |
| `never entered by declaration` | **Yes** |
| `The hardware-agnostic first phase — what proceeds with NO specification at all` (new §E.1.1a heading) | **Yes** |
| `G2-H — Hardware and model tier decided` (new gate name); `G2-H` occurs **43** times; `end of week 6` present | **Yes** |
| `It is the gate at which B1, B3 and D-04 are closed` | **Yes** |
| `The IMMEDIATE tier is the proposal alone`; `the proposal alone`; `initial report` | **Yes** |
| `暫時只做 proposal` | **Yes** |
| `STILL OPEN — this is the one question only a supervisor can close` (SQ-3) | **Yes** |
| `35,384` and `3,136` (the §H.3 measured figures) | **Yes** |

**Negative controls (superseded Revision-1 content correctly absent):** `BLOCKING ACTION — capture the lab machine…`; `28,299`; `G2-H, end of week 1`; `Two decisions are already closed`; `Three items are BLOCKING`; `proposal plus an initial report`; `B1 is a blocking action item with a week-1 deadline` — **all absent**.

**Independent corroboration of §H.3's own numbers, from my own extraction:** whitespace-split words = **35,384**; CJK characters (`[\u4E00-\u9FFF]`) = **3,136**; Markdown source whitespace-split = **38,357** — all three equal to §H.3's published table, produced by the method §H.3 defines.

**Verdict: the render is current.** The Revision-2 text is in `word/document.xml`, the superseded text is gone, and the render's paragraph/heading/table structure matches the Markdown. (Not verified: how the document *looks* in Word — see V11.)

---

## V10 — Integrity of protected artefacts

| Artefact | Expected | Re-measured | Verdict |
|---|---|---|---|
| `AY2627_FYP topics_v2_Victor Li.docx` | 30,949 bytes · `1B847CF41700BD1DB3C0E3D5E540BC349674A8177B057AD9AC09F897B4AAFB4E` | 30,949 bytes · `1B847CF4…4FB4E` | **Untouched** (mtime 16/9/2026 20:33, before Revision 2) |
| `image.png` | 141,462 bytes | 141,462 bytes (`E2001305…67FDF`, mtime 16/9 20:53) | **Untouched** |
| `proposal\sections\*` | eight sources | 8 files, mtimes **16/9–26/9** — all before the Revision-2 write (29/9 21:11) | **Untouched** |
| `FYP-Proposal-*` frozen set (8 files: COMPLETE md/docx, COMPLETE-ZH md/docx, Volume1-Plan docx, Volume1-Plan-ZH docx, Volume2-Technical docx, Volume2-Technical-ZH docx) | unmodified | all eight mtime **26/9/2026 03:02–03:03**; hashes `92E3664B…`, `AB7D043B…`, `75B46A41…`, `48F55727…`, `8448B3B7…`, `CCF6BE9C…`, `F887312B…`, `3F409536…` | **Untouched** |
| Revision-2 backup folder | two byte-identical pre-edit copies | matches the log's Revision-1 hashes (see §0) | **Consistent** |

Note: two **additional** `FYP-Proposal-SHORT.md` / `.docx` files (120,233 / 60,490 bytes, mtime **29/9 21:14** — *after* the outline revision) exist in the root. They are another agent's in-flight work, not part of the frozen `FYP-Proposal-*` set, and were **not** touched or opened by this verification. The brief's "six `FYP-Proposal-*` deliverables" most closely matches the eight frozen files above (four document stems × md/docx for COMPLETE and COMPLETE-ZH, plus four volume docx files); I checked all eight.

Neither original protected `.docx` was opened with the SDK, Word COM, or Word — the topics file was read only as bytes for hashing.

---

## V11 — Overall verdict

### **ACCEPT WITH CAVEATS**

All four ratified decisions are genuinely implemented, the new ramp is real and evidence-gated rather than decorative, the render is current, both gates pass with zero errors and a stable hash, and no protected artefact was touched. The caveats are **internal-consistency residues in the English body**, not failures of the four decisions:

**The single most important thing to fix** — the **deferred-hardware timing residue around B3/D-10**, which is the one place where the revision contradicts itself on a ratified decision:
- §A line 60–65 puts **B3** in the "**Only two items still block work starting now**" table with "provisional end of week 3";
- §A's D-10 row and §J-D-10 also say "**end of week 3**";
- §M line 1489 says "**Only ONE item blocks work starting now**";
- §F.1's G2-H says B3 is closed at **week 6**, §E.1.1a says the model class is exactly what waits, and the Chinese summary already reads B3 as deferred to G2-H.
Fix: move B3 out of the "blocking now" table into the scheduled-gate table, retime D-10 to G2-H/G3 in §A and §J (and align §J-D-10's "By when" with its own "week-5–6 spike" row), and drop `D-04` from G0's answered list in §F.1 ("D-01 to D-05" → "D-01, D-02, D-03, D-05"). Two smaller same-class residues: §K R18/R20 ("week 1 … as part of B1") and §A's D-03 "(with B1)".

**Also worth fixing, in priority order:**
1. **§B.3 C6 / §F.1 G4 vs the stated minimum stage** — add a stage-based reduction clause so that landing on Stage B (the declared floor) does not fail the definition of done; or state explicitly that Stage C is required for C6/G4 and that Stage B is only the ramp's floor.
2. **Stage D** — reconcile "Weeks 8–11" with "Stage C is exited" (which cannot happen before ~week 10) and with §C.4/§J-D-01's "the decision must be taken in week 1".
3. **§A.1's "This outline itself is sized to 6,000–10,000 words"** — contradicted by §H.3's measured 35,384; delete or reword.
4. **D-13's closed/open contradiction** and the preamble-vs-table mismatch over which three decisions are "already closed" (D-13 vs D-11).
5. **Stage A's exit gate requires UC-6**, which D-06 deliberately does not commit; and **§B.3 C1's "two of {SNMPv3, RESTCONF, NETCONF}"** is stronger than Stage B's unconditional Cisco evidence (SNMPv3 only, RESTCONF "where the image supports it").
6. **Cosmetic:** §F.3's gate rows (both bands) do not align with the week ruler, the new stage bars sit right of the gates they close at, and `STAGE D`'s bar overruns the W12 edge.

### What I could not verify
- **Word-openability and visual fidelity of the `.docx`.** Per the constraints, Word COM was not run and no PDF/print check was possible; the render is evidenced only by the Open XML SDK validation (0 errors) and the 9/9 package check plus the raw-ZIP text probes. Layout, fonts, page breaks and table pagination were **not** inspected.
- **The students' answers themselves.** I re-derived only what the document transcribes (the Chinese quotations). I did not see the original conversation, so I verified that the document *implements the described answers*, not that the quotations are the students' actual words.
- **§L.4 W1–W11's citations against the corpus** (`proposal\sections\*`, `00-design-baseline.md`). These were Revision 1's subject and are outside this brief; I confirmed the register is intact and W4 strengthened, but did not re-open the cited passages to re-verify each citation.
- **The word-count claims about the other corpus figures** (286,932 words, 66,754, 21,202, 111,219). Only the outline's own three figures (35,384 / 3,136 / 38,357) were independently reproduced.
- **The other agent's `FYP-Proposal-SHORT.*`** — present, timestamped after the revision, not read and not assessed.
