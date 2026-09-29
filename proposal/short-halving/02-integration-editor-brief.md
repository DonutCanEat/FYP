# Integration editor's brief — enforce single-home de-duplication on the assembled draft

You are the **integration editor** for the shortened `FYP-Proposal-SHORT.md`. Nine chapter authors have each rewritten their own chapter under a contract, then compressed again under a single-home ruling. The assembled draft is still about **2,700 words above** the owner's 14,000-word instruction, and the remaining excess is **not** in any one chapter: it is the same rules explained more than once, in different words, because no chapter author could see the other chapters.

**You are the only agent who sees the whole document. That is the entire point of this task.**

## 1. What you are given, and what you may touch

- **Read the assembled staged draft** at `D:\File\School\FYP\proposal\short-halving\_staged-FYP-Proposal-SHORT.md`. It is the concatenation of the ten fragments in order.
- **You may edit only the fragment files** `01-…` through `10-…` in `D:\File\School\FYP\proposal\short-halving\`. Do not edit the staged file (it is regenerated), and **never touch `D:\File\School\FYP\FYP-Proposal-SHORT.md`** — that is the pinned, gate-verified deliverable and it is replaced only by the assembler.
- Run no `git` command. Create no file other than the ones you are editing.

## 2. The task: one fact, one home, one statement

The document currently states several rules in two or three places, each time in different words. Your job is to leave **one full statement** in the chapter that owns the fact and **at most a short cross-referencing clause** everywhere else.

| Fact or rule | Its home |
|---|---|
| Estate counts, device families, per-family interfaces, addresses, VLAN and zone plans, ports, the reachability matrix | **Section 5** |
| The hard build order — network and services first, the AI layer second; no server written before its device is reachable, authenticated and producing the telemetry its tools read | **Sections 1 and 2** |
| The Packet Tracer unreachability rule; the rule that an interface exists only if a command run from the management host returned data from that specific device with the transcript filed | **Section 4.5**, with the `NR-01` row in 5.4 |
| The completion conditions and the two stated reductions | **Section 3.3** |
| The evidence standard — transcript **and** captioned capture, the two templates, an uncaptioned capture treated as absent, an unevidenced reachability row listed as unverified | **Section 8.5** |
| The permission model — read-only default, the six-field change proposal, the single-use host-scoped token, the audit log, the blast radius | **Section 7.4** |
| The standards position — the standard contains no AI content, screen captures are the brief's requirement, RESTCONF is not a standard requirement | **Section 9** |
| Deliverables, the two tiers, and what is submitted now | **Section 12** |
| The business trigger and the host organisation | **Section 2** |
| The risk register, the decision register | **Sections 11 and 10** |

**Where a chapter restates a fact whose home is elsewhere, cut the restatement and leave a clause such as "the build order is stated in section 2".** Do not cut the fact from its home chapter, and do not cut a chapter's own commitments merely because they resemble another chapter's summary.

## 3. What must not be lost — this is the whole risk of your task

- **Every identifier and every number.** The assembler mechanically diffs the identifier inventory of the original document against the draft and **refuses to publish if any identifier is missing**. It currently reports **eleven missing**: the deliverable references `D1` to `D12`, dropped when the deliverables table was dissolved into prose. **Restore them inline where they belong** — for example "D6 the design document, 40–60 pages" — because the project's own outline cross-references the deliverables by those identifiers. That costs about twenty words and buys back the cross-reference.
- **Every caveat and stated reduction**, and every `[TO CONFIRM]` that exists.
- **Every named service, host, tool, risk, decision, gate, stage, use case, test identifier and freeze point.**
- **The three tables that must remain tables**: the decision register, the device-reachability matrix, the risk register. You may compress their cells; you may not dissolve them.
- **Nothing may be invented.** No new sentence that the sources do not support, no new figure, no new marker.

## 4. Where to look for the remaining words

1. **The same rule stated twice**, which is the main target of §2 above.
2. **A sentence that explains why something matters** when the register row or normative table next to it already carries the recommendation, the status and the consequence.
3. **A preamble that announces the next paragraph**, and a closing sentence that summarises the paragraph just read.
4. **Adjectival padding** and contentless hedges.
5. **A clause restating the chapter's own heading** ("This section describes the gated sequence").
6. **A safety qualifier repeated three times.** Keep the qualifier in the sentence that needs it — usually the one making the claim — and shorten the echoes, **without ever removing the qualifier that makes a Packet Tracer sentence safe**. If in doubt, keep the qualifier: a shorter sentence that reads as a reachability claim is a defect, not a saving.

**Target: 14,000 words or fewer, whitespace-split over the whole assembled document.** A total of about 14,000 is the instruction; if you cannot reach it without deleting a named item from §3, **stop and report the floor** with the exact residual rather than deleting that item. An honest 14,900 with a named reason is worth more than a 13,950 that lost a decision row, and a lost identifier will be caught mechanically in any case.

## 5. Markdown, because the converter is unforgiving

One paragraph per physical line and never hard-wrapped; a blank line between every block; tables GitHub-flavoured with equal cell counts and `\|` for a literal pipe; no raw HTML, images, footnotes or maths; no `**A *B***`, `***A*B**`; keep the existing heading numbering exactly; keep `[FIGURE: …]` alone on its line with the closing bracket.

## 6. What to report

1. **The final total**, whitespace-split, and the per-file word count before and after your edit.
2. **Every deletion**, as a list: the fact you removed, and the home chapter you deferred to. If you removed something that had no other home, say so explicitly.
3. **The `D1`–`D12` restoration**, quoted.
4. **Anything you judged uncuttable**, with its word count, so that the residual can be reported to the owner with a named cause.
5. **Confirmation** that you edited no file outside the fragment set and ran no git command.
