# Evidence-scaffolding log — 2026-09-29 22:35 CST

**Nature of this file.** A change record for one piece of work: standing up the Git repository and the evidence folder tree, per `FYP-Outline-DRAFT.md` line 1509 / line 887 and the incoming-agent backlog at `agent.md` §10.2. It is a **new report**, appended to the history folder, and **no existing file under `proposal\` was edited to produce it** — in particular `source-integrity-manifest.md` was **not touched** (see §5, item 4).

**Headline: neither deliverable was edited, and every pinned hash still matches.** The two `.docx` files were never opened by any means — not by the Open XML SDK, not by Word COM, not by Word (H1, H2, H12). Only `Get-FileHash`, `Get-Item` and Git ran against them.

---

## 1. What was created

| Path | Bytes | SHA-256 | Purpose |
|---|---|---|---|
| `evidence\README.md` | 9,962 | `F81BCFCD9E92922EDC812488D0A8D3D1000575EDBC98150F9DA783784DA7F871` | **The frozen evidence standard of record** — the D-09 templates and §H.2 rules E1–E9, with the folder map |
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
4. **This file makes `source-integrity-manifest.md` stale by one row, and the manifest was deliberately not edited.** Measured: the manifest records **19** `.md` files under `proposal\integration\`, and the folder held **20** on disk *before* this work — the twentieth being **`source-integrity-manifest.md` itself**, which the manifest cannot record without invalidating its own hash. That is a self-reference limit, **not a defect**, and no file is unaccounted for. A re-run of the manifest now records **20** under `proposal\integration\` (the previous 19 plus this file). `evidence\README.md` sits **outside `proposal\`**, so the proposal-scoped manifest is otherwise unaffected. **Re-run the manifest to re-baseline rather than assuming this log's arithmetic.**
5. **Text ordering inside the two deliverables remains unproven**, and Word-openability remains unverifiable on this machine. Both are pre-existing (agent.md §10.3 items 1–2) and **nothing in this work touched either question**; they are restated here only so this log is not mistaken for a clean bill of health.

## 6. What this work does and does not achieve

**Does:** the evidence standard is now frozen in a form a reader can check against the outline, while there are still **zero captures** to re-caption — which is the whole reason D-09 was to be settled in week 1. The tree names where each gate's evidence goes, so the first capture has an unambiguous home and an unambiguous name. The repository now exists, and its byte fidelity is protected.

**Does not:** file a single piece of evidence. All eight folders are empty by design. **The reachability matrix is not one row closer to fact** — that needs real transcripts from real devices, which is `agent.md` §10.2's first item and cannot be done from this machine. Nothing here advances gate G0, whose outstanding item remains **B2 / D-01, the Cisco platform ratification** — the only current blocker, and a human decision.

---

*Written 2026-09-29 22:35 CST by the incoming agent, from measurements taken in this session. Every size and hash in this file was read with `Get-FileHash`/`Get-Item`; no `.docx` was opened; no file under `proposal\` was edited.*
