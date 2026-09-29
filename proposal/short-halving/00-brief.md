# Rewrite contract — shortening the short proposal to about 14,000 words

You are **rewriting an existing, gate-verified chapter** of `FYP-Proposal-SHORT.md`, which is the project's **immediate submission**. You are not writing anything new. Your output is a compressed replacement fragment that loses **no substance a supervisor needs to ratify**.

## 1. Why this is happening, and the two rules that follow

The owner's instruction is to shorten the proposal to roughly **14,000 words total** (it currently measures **20,598**: 10,251 words of prose plus 10,347 words inside 288 table rows), and to **express tables as prose wherever prose can carry the content**.

Two consequences you must respect:

1. **Compression means cutting, not just reformatting.** Turning a table into prose usually costs *more* words than the table did. So your saving must come from deleting repetition, hedging, restatement and preamble — not from shuffling text into a different shape.
2. **A shorter document that drops a decision, a gate, an identifier or a caveat is a worse document.** The proposal exists so that a supervisor can ratify the direction. Cut the explanation, never the substance.

## 2. What must survive your rewrite, in every chapter

**Identifiers and their meanings must all still appear**, even if you compress everything around them: decision ids `D-01`…`D-16`; blocking items `B1`, `B2`, `B3`; supervisor questions `SQ-1`…`SQ-5` where your chapter raises them; project gates `G0`–`G6` and `G2-H`; governance mechanisms `G1`–`G10` (always written "governance G1–G10" so they are not confused with the gates); AI-coverage `Stage A`, `Stage B`, `Stage C`, `Stage D` and the minimum acceptable stage; use cases `UC-1`…`UC-6`; permission-boundary tests `PB-1`…`PB-9`; evidence rules `E1`…`E9`; risk ids `R1`…`R22`; reachability rows `RW-01`…`RW-09` and `NR-01`, `NR-01a`, `NR-02`, `NR-03`; trust boundaries `TB-01`…`TB-16`; MCP server names; the domain `vertexpeak.fyp.lab`; the 15-character hostname rule; hostnames and service ports that appear in your chapter.

**Every `[TO CONFIRM]` in your chapter must survive as a `[TO CONFIRM]`.** A deferred item quietly deleted becomes a silent claim.

**Every caveat and every stated reduction must survive**, because this project's credibility rests on naming its own limits: the Cisco layer's conditional RESTCONF, the unreachable provider row, the two reductions, the deferral of the hardware and model-class decisions, the read-only default, and the rule that a reachability claim with no transcript is unverified.

**In the architecture and plan chapters**, preserve the numbers exactly as they are — the inventory counts, the guest counts, the Cisco target count and its conditional maximum, the week numbers, the scenario and fault counts. **Do not re-derive, round differently, or "tidy" a figure.**

## 3. Tables: dissolve them unless they are genuinely tabular

Prefer prose. A table earns its place only when a reader must **compare values across several rows on the same attributes** and the comparison would be lost in a sentence. Specifically:

- **Dissolve into prose**: a table that is really a list of things with a short description each (service lists, host lists, tool lists, deliverable lists, environment types, option comparisons where one option is recommended and the rest rejected); a table whose cells are mostly sentences; a table with one or two rows; a table that restates something the surrounding prose already says.
- **Keep, minimised**: the **decision register** (`D-01`…`D-16`, if your chapter carries it) because a supervisor ratifies it row by row; the **device-reachability matrix**, because it is normative and evidence is filed against its row identifiers; the **risk register** (`R1`…`R22`), because likelihood, impact, mitigation and owner must be compared across rows. In those three cases, keep the table but **compress every cell** — several of those cells are currently whole paragraphs, and that is where most of the saving in them lies.
- **The front matter and the group-member table stay as tables** — they are structural, not explanatory.

**For every table you dissolve, say so in your report and give the reason. For every table you keep, say why it is genuinely tabular.** A table kept out of habit is a failure of this task; a table dissolved where the reader needed to compare rows is also a failure.

## 4. Voice, and how to write short prose

- **British English**, formal academic register, third person, present tense for design and future tense for plan.
- **Keep the proposal's own wording wherever it is already tight.** Do not paraphrase for the sake of it — paraphrasing costs words and risks changing meaning. Most of your saving should come from deleting sentences and clauses, not from rewriting them.
- **Delete on sight**: restatement of a point made two paragraphs earlier; a sentence that announces what the next sentence will say; adjectival padding ("robust", "comprehensive", "seamless", "state-of-the-art"); hedges that add no information ("it should be noted that"); a paragraph that explains why a decision matters when the decision row already says so.
- **One idea per paragraph, and make it short.** Prefer a plain declarative sentence to a long one with three subordinate clauses.
- **Do not add examples, analogies or justification that the current text does not contain.** You are compressing, not arguing.

## 5. Markdown rules — the converter is unforgiving, and these are measured failures

1. **One paragraph, one physical line.** Never hard-wrap. A wrapped paragraph fails the coverage gate as two unmatched halves.
2. **Blank line between every block** — paragraphs, tables, lists, headings.
3. **Tables** (only where §3 allows): GitHub-flavoured, header row plus separator row, equal cell counts on every row, a literal pipe inside a cell escaped as `\|`. No table inside a list item.
4. **No** raw HTML, images, footnotes, definition lists, maths, nested blockquotes, reference-style links or YAML front matter.
5. **Emphasis**: never `**A *B***`, `***A*B**`, or a bold span ending in a full stop. Plain `**bold**` and `*italic*` are fine.
6. **`[FIGURE: …]`** must sit alone on its line with the closing bracket present, or it renders as nothing.
7. **Headings**: keep the chapter's existing heading numbering exactly. Do not renumber, merge or invent headings. If you dissolve a table under its own `###` heading and the heading then has no content, keep the heading and give it one short paragraph rather than deleting the heading.
8. **Do not add a document title, front matter block, table of contents or references section** unless your assignment says you own it.

## 6. What you must never write

1. **Any claim that a Packet Tracer device is reachable, manageable, pollable, configurable or automatable** — in a sentence, a table cell or a figure description. Packet Tracer is design-time only. Shortening must not create such a claim by dropping the qualifier that made a sentence safe: if you cut a sentence, cut it whole or keep its qualifier.
2. **Anything from the superseded `legacy\` corpus** as current. Do not read it, do not cite it.
3. **The three withdrawn framings** in any hedged form: that the AI line is the weakest line; that no local GPU inference is planned or model hosting is out of scope; that the MCP bridge is optional or cuttable.
4. **The word "autonomous" applied to this project's AI layer.** It is read-only by default and changes only with human approval.
5. **Any invented fact** — no version, URL, licence term, price, date, hostname, address or metric that the current text does not already contain.

## 7. What you must report back

1. **Your file**, its path, its byte size, and its word count **with the method stated** (whitespace-split over the whole fragment).
2. **The original chapter's word count** as you measured it, and your reduction as a percentage. If you missed your assigned target, say by how much and why.
3. **Every table you dissolved**, with its reason, and **every table you kept**, with why it is genuinely tabular.
4. **Anything you deleted that a reader might expect to find**, so the assembling agent can decide whether it must return.
5. **Any `[TO CONFIRM]` you preserved** (the count is enough if unchanged).
6. **Any contradiction or ambiguity you noticed** while compressing, quoted, with line numbers.
7. **Confirmation** that every identifier in §2 that appears in your chapter still appears, and that the numbers are unchanged.

Do not summarise your chapter's content in the reply. The assembling agent reads the file.
