# The evidence standard of record — frozen 2026-09-29, while there are zero captures

**What this file is.** The single normative statement of how evidence is captured, named and filed in this project, plus the folder tree that holds it. It exists because **D-09 chose option (b), the fixed template**, and because the standard must be frozen in week 1 *while there are zero captures to re-caption* — re-captioning an existing pack is the expensive version of this decision.

**Authority, not invention.** Every rule below is copied from **`FYP-Outline-DRAFT.md` §H.2, rules E1–E9** (the decision-level authority) at the line numbers given. Nothing here was invented by the agent that created this tree, and **nothing here overrides the outline**. Where this file and the outline ever disagree, the outline wins and this file is corrected.

**Status: FROZEN.** The captions and filenames of record are the two in the next section. Changing them later requires a recorded decision-log entry, not a preference.

---

## 1. The two mechanical forms (E1, E3)

**Caption — every figure, no exceptions:**

```
Figure {n}: {what} — {host} — {command or action} — {date}
```

**Filename — every capture file:**

```
{date}_{host}_{what}.png
```

Worked example, taken from **E3** itself: `2026-10-06_vpnz-dc01_dcdiag.png`.

*`{n}` is a single global sequence for the evidence pack (D9, ~150–300 figures), not a per-section number. `{date}` is ISO `YYYY-MM-DD`. `{host}` is the inventory hostname, exactly as it appears in the reachability matrix — never a nickname. `{what}` is short, lowercase, mechanical: `dcdiag`, `ssh-login`, `snmpwalk-v3`, `prom-target-up`.*

**The separator is a spaced em dash `—`, and this matters.** Rule E3's own example and E1's template both use it. See §5 for the one place in the corpus that does not.

---

## 2. The nine rules, verbatim from §H.2

| Rule | Requirement (copied from `FYP-Outline-DRAFT.md` §H.2) |
|---|---|
| **E1** (line 1036) | **Every figure is captioned** in the form `Figure {n}: {what} — {host} — {command or action} — {date}`. An uncaptioned screenshot is treated as absent. |
| **E2** (line 1037) | **Every claim of "it works" is backed by two things:** a command transcript (text) *and* a captioned screenshot (image). Text alone is weakly evidenced; an image alone cannot be searched. |
| **E3** (line 1038) | **Filenames are mechanical:** `{date}_{host}_{what}.png`, for example `2026-10-06_vpnz-dc01_dcdiag.png`. Never `screenshot1.png`. |
| **E4** (line 1039) | **Dated and versioned.** The capture must show enough context to prove *which build* produced it — a version banner, a prompt with the hostname, or a visible date. |
| **E5** (line 1040) | **Reproducible.** Every verification record names the exact command and the exact expected result, so a reader can re-run it. |
| **E6** (line 1041) | **Honest about failure.** A test that failed or was not run says so. A fault deliberately injected and then reverted is documented with both the injection and the revert. |
| **E7** (line 1042) | **AI-generated text is labelled.** If any prose was drafted with a model, the methodology chapter says so, and **no technical result may rest on generated text** — results come from transcripts and captures. |
| **E8** (line 1043) | **No invented version, URL or licence.** Every version string is captured from the running system; every URL is copied from a browser and archived; anything unconfirmed is marked `[TO CONFIRM]` in the draft and resolved before submission. |
| **E9** (line 1044) | **Reachability is evidenced, not asserted.** For every `REACHABLE` row in the Section C.2b matrix there is a transcript showing that interface returning data from that device. A reachability claim with no transcript is listed in the report as **unverified** |

**Rule E9 is the one that gates the AI layer**, and it is why `01-reachability\` is the first folder here: *no MCP server may be written before the host or device it manages is reachable, authenticated and producing the telemetry its tools read*, and the matrix is **normative** — a device not in it is not a managed device.

---

## 3. The folder tree, and what belongs in each folder

```
evidence\
  README.md            this standard. Frozen. The captions and names of record.
  01-reachability\     E9: one transcript per REACHABLE row of the §C.2b matrix.
  02-services\         the required-service verification of section 6 (gate G2).
  03-cisco\            G1 and Stages B-C: ssh login, show version, snmpwalk -v3.
  04-ai-plane\         the ~20-probe tool-calling set, malformed-call rate, model choice.
  05-evaluation\       PB-1..PB-9 permission-boundary suite, injected faults, drift and hallucination checks.
  06-audit\            audit-log exports and hash-chain integrity checks.
  figures\             the captioned captures: {date}_{host}_{what}.png
  transcripts\         the raw command transcripts, text
```

| Folder | Serves | Note |
|---|---|---|
| `01-reachability\` | Stage A entry gate; E9 | A row with no transcript here is **unverified** and must be reported as such. This folder is the difference between a claim and a fact. |
| `02-services\` | Gate G2 | Every required service needs **both** a transcript and a captioned capture (E2). |
| `03-cisco\` | Gate G1, Stages B and C | One filed transcript **per device**; five devices at Stage C, reconciled against D-16. |
| `04-ai-plane\` | Gate G3 | The measurement that chooses the model class — a measurement, never a reputation. |
| `05-evaluation\` | Gate G4, G5 | **PB-2 and PB-7 are filed here alongside the success tests.** A system that cannot be shown to refuse has not been evaluated. |
| `06-audit\` | §7.4 governance | Append-only, digest-chained. An export here is a copy; the log itself is never edited. |
| `figures\` | D9 | Flat, because `{n}` is a global sequence and `{date}_` sorts chronologically. No sub-folders. |
| `transcripts\` | E2 | Plain text, the exact command and its exact output, pasted — not retyped and not summarised. |

**Empty folders carry a `.gitkeep`** so the tree survives a clone. Replace the `.gitkeep` when the first real file lands; never delete the folder.

---

## 4. Rules of this tree — the operational discipline

1. **Caption at the moment of capture, never later.** A file in `figures\` without its caption is treated as absent (E1). There is deliberately **no inbox folder**, because an inbox is where uncaptioned captures go to die.
2. **`{n}` is allocated once and never reused.** A re-taken capture gets a **new** number and a new date; the old one is kept with its caption and marked superseded. Renumbering retroactively breaks every cross-reference in the report.
3. **Prefer a re-capture to a re-caption.** If a capture is wrong, take it again.
4. **Never retype a command's output.** Paste it. A transcript that was typed by hand is not a transcript.
5. **No invented content, ever** (E8): no version string, URL, licence, hostname or metric that was not read from a running system. An unconfirmed item is written `[TO CONFIRM]`, never guessed.
6. **Nothing in this tree may claim to reach, read or configure a Packet Tracer device.** Packet Tracer has no reachable management interface at all; it is design-time only, and a transcript for such a row cannot exist. This is the project's standing consistency risk (R12).
7. **A failed or skipped test stays in the record and says so** (E6). Deleting an inconvenient result is the one act that would invalidate the whole pack.
8. **This tree is not the deliverables.** The evidence pack is **D9, a later-tier artefact**. Nothing here is submitted at the proposal stage, where the proposal (D5) is the only submission.

---

## 5. One recorded divergence, reported rather than silently resolved

The same template is written **two ways** in the two current deliverables:

| Where | Form |
|---|---|
| `FYP-Outline-DRAFT.md` §H.2 E1/E3 (lines 1036, 1038), D-09 (line 88), §G-6 (line 1302) | `Figure {n}: {what} — {host} — {command or action} — {date}` — **em dash** |
| `FYP-Proposal-SHORT.md` §"evidence standard" (line 681), D-09 (line 612) | `Figure {n}: {what} - {host} - {command or action} - {date}` — **hyphen** |

**Resolution adopted here:** the **outline's em dash form is normative**, because the outline is the decision-level authority and `FYP-Proposal-SHORT.md` is its condensed render. The hyphen form in the short proposal is a **rendering difference, not a second standard**.

**Neither deliverable was edited to reconcile this.** Both are at their final gate-verified state with pinned hashes (agent.md §3), and editing either would require a re-render, all gates and new pinned hashes for a punctuation difference. It is recorded here as an **open item** for the human owner, in the same class as the two residual wording differences already logged at agent.md §10.3 item 7.

---

## 6. Provenance

- **Standard**: `FYP-Outline-DRAFT.md` §H.2 (lines 1030–1044), created from the decision at D-09 (line 88) and restated at lines 1302 and 1509.
- **Task origin**: `FYP-Outline-DRAFT.md` line 887 and line 1509 — *"Stand up the repository and the evidence scaffolding in parallel with 1–4: the folder tree, the Git repository, the figure-caption template and the filename convention. Freeze the evidence standard now, while there are zero screenshots to re-caption."*
- **Cross-reference**: `FYP-Proposal-SHORT.md` line 681 and line 692; `agent.md` §10.2 and §7 (V1–V8).
- **Created**: 2026-09-29, by the incoming agent, read-only against the two deliverables (no `.docx` was opened by any means; the Markdown sources were read).
- **Correction, 2026-09-29, found by independent verification and recorded rather than quietly patched**: an earlier version of this file quoted outline line 1509 as *"in parallel: the folder tree…"*, **silently dropping the words "with 1–4" from inside a quotation**. The quote now reads verbatim. The defect was in a quotation, which is the one place in a document of record where a dropped word is not a style choice but a false attribution — so it is logged here, and the general lesson stands: **quote by copying, never by recalling.**
- **Not yet ratified**: the folder names in §3 are this agent's proposal, since the authority fixes the caption, the filename and the rules but **not the folder layout**. Treat the names as provisional until a human signs off, and record any rename here.
