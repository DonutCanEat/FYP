# The shared contract for every section writer — read this before writing anything

You are one of several writers producing **one chapter each** of the **FYP Initial Report** for the project *Victor2 – Enterprise Network Infrastructure and Architect*. This file is the contract. It is deliberately strict, because the failure this project has actually suffered is **fabrication that reads well**.

---

## 1. What you are producing, and where

- Write **exactly one file**, the path given in your own assignment. **Create nothing else. Modify nothing else.** In particular, **never touch** `FYP-Proposal-SHORT.md`, `FYP-Outline-DRAFT.md`, any `.docx`, or any file under `proposal\integration\`.
- Do **not** run any `git` command. Do not create, rename or delete files other than your own.
- Your chapter is a **fragment** of a larger document. Start with the exact heading number and title given in your assignment, and use the sub-numbers specified there so that no two writers collide. Do not add a document title, a table of contents, a front matter block or your own references section — the assembling agent adds those.

## 2. Where the facts come from — and the rule that governs them

**Primary sources, in this order of authority:**

1. `D:\File\School\FYP\FYP-Outline-DRAFT.md` — **the decision-level authority.** Read the specific sections named in your assignment. If anything you write contradicts this file, your text is wrong.
2. `D:\File\School\FYP\FYP-Proposal-SHORT.md` — the condensed, current, gate-verified statement of the project. Its chapters map closely onto the report's, and its wording is the voice to match.
3. `D:\File\School\FYP\proposal\00-design-baseline.md` and `...-rev1.1-addendum.md` — the frozen baseline: inventory, addressing, VLAN and zone plans, naming conventions, service designs, test-case scheme. **Reference for detail, never for direction** — where the baseline and the outline disagree, the outline wins.
4. `D:\File\School\FYP\proposal\research\wsos-2026-2447.md` — the standards evidence pack. The only external document with recorded retrieval evidence.
5. `D:\File\School\FYP\agent.md` — the operating manual. Use it for the project's vocabulary, environment hazards and the list of things this project has learned not to say.

**THE RULE: nothing may be invented. Not one figure.** Every hostname, IP address, VLAN number, byte count, word count, week number, RAM figure, version string, licence term, URL, date, team-member name, student ID or metric must be **traceable to a named section of one of the sources above**. If a fact is not in them:

- write `[TO CONFIRM]` where the value belongs, and say in one clause what has to be confirmed and by whom (the corpus names owners: D-12 is S1, B1 is S4, and so on); or
- **omit it and say less.** A shorter honest sentence beats a specific invented one.

**Never** write an invented URL, an invented version number, an invented licence statement, an invented price, an invented benchmark result, an invented citation, or an invented date. This project's rule is `[TO CONFIRM]` **or silence** — never a plausible guess. Hallucinated detail is the single worst outcome of this task; a reader cannot tell an invented figure from a measured one, which is exactly why it is worse than writing nothing.

**Known `[TO CONFIRM]` items you may need** (do not resolve them, do not invent around them): the programme handbook's word band for this artefact; the date of issue, supervisor, second reader, members' names and student IDs; the CML licence tier, image entitlement and topology RAM cost (D-12); the lab hardware specification of both hosts (B1); the GPU tier (D-04) and the model class (B3/D-10), both decided at gate G2-H; whether model access is offline-only or hybrid (D-13).

## 3. Things that must never appear, in any form

1. **Any claim that a Packet Tracer device is reachable, manageable, pollable, configurable or automatable** — in a sentence, a table cell, a diagram description, a tool description or a test case. Packet Tracer devices expose **no** SSH server reachable by external tooling, **no** SNMP agent a real poller can query, **no** NETCONF or RESTCONF endpoint and **no** management API whatsoever. Packet Tracer is **design-time only** (topology and CCNA-level configuration) and must be labelled as such wherever it appears. This is the project's standing consistency risk.
2. **Anything from `legacy\`** treated as current. That corpus is superseded and must never be submitted or presented as what this project is. Do not read it, do not cite it, do not rebuild anything from it.
3. **The withdrawn framing**, in any hedged or softened form: that the AI line is the weakest line; that no local GPU inference is planned or that model hosting is out of scope; that the MCP bridge is optional or cuttable. All three are withdrawn — the AI/MCP line is the **assessed differentiator** and MCP is the integration contract.
4. **An "autonomous" AI layer.** It is read-only by default and changes only with human approval; a mutating action needs a single-use, host-scoped token. Never call it autonomous, and never present a proposal as an executed change.
5. **Silent scope-shrinking.** If a reduction is stated anywhere (Stage B as the minimum, the tier-based and stage-based reductions), state it as a **result**, not as a failure — and never hide it.

## 4. Markdown rules — the converter is unforgiving, and these are all measured failures

The Markdown is converted to `.docx` by a purpose-built converter. Every rule below exists because it has already broken a real document.

1. **One paragraph, one physical line.** Never hard-wrap a paragraph or a list item. The coverage validator works line by line, so a wrapped paragraph fails as two unmatched halves.
2. **Blank line between every block** — between paragraphs, before and after every table, list and heading.
3. **Tables**: GitHub-flavoured only, a header row plus a separator row. Escape a literal pipe inside a cell as `\|`. Keep every row the same number of cells. Do not put a table inside a list item.
4. **No** raw HTML, images, footnotes, definition lists, maths, nested blockquotes, reference-style links or YAML front matter. They are silently dropped or break the build.
5. **Emphasis**: do not write `**A *B***` or `***A*B**` or a bold span ending in a full stop — those constructs leak literal asterisks or break the coverage comparison. Reword instead. Plain `**bold**` and `*italic*` are fine.
6. **Figures**: a placeholder is recognised **only** when it sits alone on a single line, in the form `[FIGURE: description]`, with the closing bracket present. A missing bracket silently produces zero figures. Use them sparingly; describe what the figure would show.
7. **Headings**: start at the level in your assignment. Do not skip levels. No bold inside a heading.
8. **British English**, formal academic register, third person. Match the corpus: "organisation", "prioritised", "utilise" sparingly. Spell out an acronym at first use in your own chapter.

## 5. Vocabulary lock — use these forms exactly

| Use | Not |
|---|---|
| **gate G2**, **gate G2-H**, gates G0–G6 | "G2" alone, when the gates are meant — `G1`–`G10` are also the **governance mechanisms**, a genuine collision |
| **governance G1–G10**, when the mechanisms are meant | "G1" alone |
| Domain `vertexpeak.fyp.lab`; the **15-character hostname rule**; the banned-strings list | any invented hostname or domain |
| **RW-01 … RW-09** (reachability rows), **TB-01 … TB-16** (trust boundaries), **NR-01a** (the unreachable AS-65000 provider) | renumbering or merging these |
| **UC-1 … UC-6**, **PB-1 … PB-9** (permission-boundary tests), **E1 … E9** (evidence rules), **D-01 … D-16** (decisions), **R1 … R22**-style risk ids, **B1 / B2 / B3** (blocking items), **SQ-1 … SQ-5** (supervisor questions) | new ids of your own |
| **Stage A / B / C / D** (the AI-coverage ramp) | "phase 1" for a stage |
| WSOS 2026, **Skill 2447** | other skill numbers |
| the **immediate tier** (the proposal, D5) / the **later tier** (the full document, D6–D12) | "final report" as a synonym for the proposal |

**The two structural rules the whole project rests on**, stated in the corpus and to be preserved: the build order is a **hard dependency, not a preference** — the Linux, Windows and Cisco network and its services are built and verified **first**, and the AI management layer is built **second**; and **no MCP server may be written before the host or device it manages is reachable, authenticated and producing the telemetry its tools read**.

## 6. Voice and shape

- Write for an academic examiner who has **not** read the outline. Define a term the first time it is used in your chapter.
- **State the honest position**: where something is unverified, unreachable, deferred or a stated reduction, say so plainly. This corpus's credibility comes from naming its own limits, and an examiner notices the difference.
- Prefer concrete, checkable statements over adjectives. "Verified by a command transcript and a captioned capture" beats "robustly implemented".
- Do not pad. The length band in your assignment is a target, not a quota: a tight 1,300 words beats a padded 2,000, and **going over is not a virtue**.
- Do not repeat another chapter's material. Your assignment names the boundaries; respect them, and if you genuinely need a fact that belongs to another chapter, state it in one clause and move on.

## 7. What you must report back

Your final message must contain, in this order and nothing else:

1. **The file you wrote**, its path, its byte size and its word count.
2. **The source sections you actually used**, named precisely (e.g. "outline §C.2b lines 193–236; short proposal §5.4").
3. **Every `[TO CONFIRM]` you wrote**, quoted, with the reason.
4. **Anything you could not verify** and therefore left out or hedged.
5. **Any contradiction you found between two sources**, quoted from both, with the line numbers. Report it — do not silently choose. This is a real outcome of this task and is treated as a valuable finding, not a failure.

Do not summarise your chapter's content in the reply. The assembling agent reads the file.
