# Evidence-scaffolding log — 2026-09-29 22:35 CST

**Nature of this file.** A change record for one piece of work: standing up the Git repository and the evidence folder tree, per `FYP-Outline-DRAFT.md` line 1509 / line 887 and the incoming-agent backlog at `agent.md` §10.2. It is a **new report**, appended to the history folder, and **no existing file under `proposal\` was edited to produce it** — in particular `source-integrity-manifest.md` was **not touched** (see §5, item 4).

**Headline: neither deliverable was edited, and every pinned hash still matches.** The two `.docx` files were never opened by any means — not by the Open XML SDK, not by Word COM, not by Word (H1, H2, H12). Only `Get-FileHash`, `Get-Item` and Git ran against them.

---

## 1. What was created

| Path | Bytes | SHA-256 | Purpose |
|---|---|---|---|
| `evidence\README.md` | 10,520 | `F4468EDB67532EB115FDED38D024138AB1D960967941B88386C88DCACEA0913B` | **The frozen evidence standard of record** — the D-09 templates and §H.2 rules E1–E9, with the folder map. *(Was 9,962 / `F81BCFCD…F871` before the §7 amendment corrected a quotation.)* |
| `.gitattributes` | 534 | `C1643FF58A976FF3D1A9DBD6B0261379A1EF5AFD2CC24B528F6245172C69351F` | `* -text` — no EOL conversion, ever |
| `.gitignore` | 1,074 | `0FEA89C33E6ADD1588E2D1E97C0A34769346B5BEEAA0029BF80973F0C243C5F7` | What is deliberately not tracked, and why |
| `evidence\01-reachability\.gitkeep` | 0 | — | E9: one transcript per `REACHABLE` row |
| `evidence\02-services\.gitkeep` | 0 | — | Required-service verification, gate G2 |
| `evidence\03-cisco\.gitkeep` | 0 | — | Gate G1 and Stages B–C |
| `evidence\04-ai-plane\.gitkeep` | 0 | — | The model-choice measurement, gate G3 |
| `evidence\05-evaluation\.gitkeep` | 0 | — | PB-1…PB-9, injected faults, drift and hallucination checks |
| `evidence\06-audit\.gitkeep` | 0 | — | Audit-log exports and hash-chain checks |
| `evidence\figures\.gitkeep` | 0 | — | Captioned captures, `{date}_{host}_{what}.png` |
| `evidence\transcripts\.gitkeep` | 0 | — | Raw command transcripts |

**Git repository:** initialised at `D:\File\School\FYP`, first commit **`c793e5ec104e6e2136fbb08bbdff6865f322643a`** ("Scaffold repository and evidence tree"), **980 tracked files**, working tree clean, `.git` = 4.22 MB.

## 2. Where the standard came from — copied, not invented

The caption and filename forms were **taken verbatim from the authority**, `FYP-Outline-DRAFT.md` §H.2:

- **E1** (line 1036): `Figure {n}: {what} — {host} — {command or action} — {date}`
- **E3** (line 1038): `{date}_{host}_{what}.png`, example `2026-10-06_vpnz-dc01_dcdiag.png`

The rules E1–E9 are quoted in full in `evidence\README.md` §2, each with its outline line number, so that a reader can verify the copy without reading this log. **The decision behind them is D-09 option (b)** (outline line 88, short proposal line 612).

## 3. Decisions taken, each with its reason

| Decision | Reason |
|---|---|
| **`.gitattributes` sets `* -text`** | This project verifies sources by **byte size and SHA-256** (agent.md V7, H3). Git's default EOL conversion rewrites CRLF/LF on checkout, which would change the bytes of a file whose hash is pinned and manufacture a "drift" that is pure tooling artefact. `-text` makes a restore byte-exact. **This is the one decision here that would have caused real damage if omitted.** |
| **`legacy\` is not tracked** | agent.md §9: the superseded ~286,932-word generation must not be submitted or presented as the project. Excluding it means no submission bundle built from Git can contain it by accident. Verified: `git ls-files legacy` = **0**. |
| **The two `.docx` deliverables and the user's originals ARE tracked** | They are the submission surface. Tracking is not submission, and byte-identical restore is exactly what this project needs. |
| **`proposal\tools\i18n-*\out\`, `zh\`, `md2docx\stress\` and `z-scratch-audit\` are not tracked** | agent.md §9 names these as build products, fixtures or scratch; the sources (`proposal\i18n\zh-HK\*.md`, `proposal\sections\*.md`) stay tracked. |
| **`backup-*` folders ARE tracked** | They are the hash-verified pre-edit backups the project's own record-keeping rule requires. 4.00 MB; keeping them costs little and preserves the record. |
| **Git identity set to a placeholder** | No user identity was configured on this machine. Repo-local only: `user.name "FYP evidence scaffold"`, `user.email "fyp@localhost"`. **No person's name was invented or claimed.** The human owner should replace it with their own before any commit is pushed or attributed. |
| **Commit message records the sources** | So the first commit is self-explanatory without this log. |

## 4. Verification performed — commands and results

| Check | Method | Result |
|---|---|---|
| **The submission surface is unchanged** | `Get-FileHash -Algorithm SHA256` + `Get-Item` on all six pinned files, **before** the work and **again after every Git operation** (V7) | **All six MATCH on both passes**: `FYP-Proposal-SHORT.md` 131,405 / `B3A933B2…5BD3`; `FYP-Proposal-SHORT.docx` 65,799 / `869882D5…3EA3`; `FYP-Outline-DRAFT.md` 265,139 / `2A422BF0…1760`; `FYP-Outline-DRAFT.docx` 139,867 / `2FB88823…4E05`; `AY2627_FYP topics_v2_Victor Li.docx` **30,949** / `1B847CF4…FB4E` (the previously damaged file — **still intact**); `image.png` 141,462 / `E2001305…7FDF` |
| **No `.docx` was opened by path** | No SDK, COM or Word invocation was made at all; only hashing and `Get-Item` | **Zero risk incurred** (H1, H12) |
| **The toolchain is untouched** | `convert.js` SHA-256 | `33677F7819C1866B8F6D234F86951EAFE6798A3C8D9FF26F27789F2917D5D12A` — **exactly the hash H9 requires it to keep**; no converter edit was attempted |
| **`legacy\` cannot leak from Git** | `git ls-files legacy` | 0 files |
| **The tree survives a clone** | `git ls-files evidence` | 9 files, all eight folders plus the standard |
| **No stray scratch was written into the tree** | Working tree is clean after the commit | `git status --porcelain` → empty (H13) |

## 5. Open items — reported, not silently resolved (V8)

1. **The caption separator is written two ways in the two deliverables.** The outline (§H.2 E1/E3, line 88, line 1302) uses a spaced **em dash**; the short proposal (line 681, line 612) uses a spaced **hyphen**. `evidence\README.md` §5 adopts the **outline's form as normative** and records the short proposal's as a rendering difference. **Neither deliverable was edited** — both are at their final gate-verified state with pinned hashes, and editing either for punctuation would cost a re-render, all gates and new pinned hashes. **For the human owner to accept or overrule.** Same class as the two residual wording differences already logged at agent.md §10.3 item 7.
2. **The folder names in `evidence\README.md` §3 are provisional.** The authority fixes the caption, the filename and the rules E1–E9, but **not the folder layout**, so the eight names are this agent's proposal. **Treat them as unratified**; a rename should be recorded in that file. No authority was stretched to cover them.
3. **`proposal\tools\i18n-w6-auto\` tracks 829 `.txt` scratch chunks** (841 of its 857 on-disk files are tracked; the remainder are ignored by the `out\`/`zh\` rules). agent.md §8 calls this folder "translation build products (scratch, not sources)". Harmless — Git is not the submission surface — but it is 829 files of noise in the index. **Left exactly as found rather than pruned**, because deciding which of its 8 `.js` and 4 `.json` files are sources is a judgement about someone else's build, not a mechanical rule. **Tidy-up candidate for the human owner.**
4. **`source-integrity-manifest.md` is stale on more than one row, and it was deliberately not edited.** Two separate facts, and the second was found only by independent re-measurement — the first version of this item said "one row" and **understated it**:
   - **Pre-existing staleness of at least two rows.** The manifest's §4 rows already disagreed with disk before this work began: `final-tidy-note.md` — manifest **18,786** / disk **21,560**; `gantt-final-closeout.md` — manifest **33,985** / disk **53,532**. Cause, measured rather than assumed: **both were amended after the manifest was taken.** The manifest's own last-write time is **2026-09-29 22:12:00**; `final-tidy-note.md` was written at **22:16:08** and `gantt-final-closeout.md` at **22:17:56**. So this is a genuine post-baseline edit, **not corruption** — and `final-tidy-note.md`'s amendment is the marked one that agent.md §10.3 item 6 points a reader to. **Staleness is therefore ≥3 rows, not one.**
   - **One row added by this work.** The manifest records **19** `.md` files under `proposal\integration\`; the folder held **20** on disk *before* this work — the twentieth being **`source-integrity-manifest.md` itself**, which it cannot record without invalidating its own hash. That is a self-reference limit, **not a defect**, and no file is unaccounted for. A re-run now records **20** (the previous 19 plus this log) against **21** on disk.
   `evidence\README.md` sits **outside `proposal\`**, so the proposal-scoped manifest is unaffected by it. **Re-run the manifest to re-baseline rather than assuming this log's arithmetic.**
5. **Text ordering inside the two deliverables remains unproven**, and Word-openability remains unverifiable on this machine. Both are pre-existing (agent.md §10.3 items 1–2) and **nothing in this work touched either question**; they are restated here only so this log is not mistaken for a clean bill of health.

## 6. What this work does and does not achieve

**Does:** the evidence standard is now frozen in a form a reader can check against the outline, while there are still **zero captures** to re-caption — which is the whole reason D-09 was to be settled in week 1. The tree names where each gate's evidence goes, so the first capture has an unambiguous home and an unambiguous name. The repository now exists, and its byte fidelity is protected.

**Does not:** file a single piece of evidence. All eight folders are empty by design. **The reachability matrix is not one row closer to fact** — that needs real transcripts from real devices, which is `agent.md` §10.2's first item and cannot be done from this machine. Nothing here advances gate G0, whose outstanding item remains **B2 / D-01, the Cisco platform ratification** — the only current blocker, and a human decision.

---

*Written 2026-09-29 22:35 CST by the incoming agent, from measurements taken in this session. Every size and hash in this file was read with `Get-FileHash`/`Get-Item`; no `.docx` was opened; no file under `proposal\` was edited **to produce this log** — and this log itself was later amended once, in §7 below.*

---

## 7. Amendment — 2026-09-29, after independent verification (V1, V2)

An independent read-only verifier re-derived every claim in §1–§4 from the artefacts, without reading this log first. **All nine of its checks held, and nothing of substance in this log was shown false.** Two narrow corrections followed, and both are recorded here rather than quietly patched:

| # | What was wrong | Where | Correction |
|---|---|---|---|
| 1 | A quotation was **not verbatim**: it read *"in parallel: the folder tree…"* and **silently dropped the words "with 1–4"** from inside the quotation marks | `evidence\README.md` §6 — **not this log** | The quote now reads verbatim from `FYP-Outline-DRAFT.md` line 1509, and that file carries its own correction note. **`evidence\README.md` therefore grew from 9,962 to 10,520 bytes**; §1's row was updated to SHA-256 `F4468EDB67532EB115FDED38D024138AB1D960967941B88386C88DCACEA0913B`, and the superseded hash `F81BCFCD…F871` describes the earlier revision only |
| 2 | §5.4 **understated** the manifest's staleness as "one row" | §5.4 above | Rewritten with the measured figures, the two files' post-baseline write times, and the corrected **≥3 rows** |

**Independently confirmed, so these stand as verified rather than self-reported:** all six pinned hashes; that `evidence\README.md`'s rules E1–E9 are **byte-identical** quotations of outline lines 1036–1044, all nine compared with `-ceq`; that the em dash / hyphen divergence is **TRUE by code point** (`U+2014` in the outline, `U+002D` in the short proposal, and those three outline lines are the only ones containing `Figure {n}`); that `git check-attr` reports `text: unset` and the repo-local `core.autocrlf` is **`false`, overriding a global `true`**; that `legacy\` is **excluded rather than absent** (0 tracked, 9 on disk, `git check-ignore` naming `.gitignore:13`); and that `convert.js` still carries the H9 hash `33677F78…D12A`.

**One clarification, because a summary in chat was loose and this log should not inherit it:** commit **`c793e5e` is the scaffold commit, not HEAD.** §1 says "first commit" and that is accurate; HEAD became `f1b98ff` ("Record the evidence-scaffolding change") when this log was committed, and this amendment adds a third commit. Anyone verifying by HEAD hash must expect the newest commit, not `c793e5e`.

**Why this section exists at all.** The project's hardest lesson is that *a worker's own "all green" report is not evidence* (V1) — a note once certified "20 bar rows, 0 alignment failures" while **11 of 20 bars were misaligned**. The verifier found two defects that self-review had missed, one of them inside a document whose entire purpose is to be quotable. That is the argument for the rule, demonstrated on this work rather than asserted.
