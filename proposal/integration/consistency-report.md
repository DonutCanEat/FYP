# CONSISTENCY REPORT — baseline Rev 1.1 sweep

**Companion documents:** `proposal\00-design-baseline-rev1.1-addendum.md` (the rulings), `proposal\integration\patch-list.md` + `proposal\integration\patch-list.json` (the edits).
**Prepared by:** Design Authority (consistency-review worker).
**Scope of the sweep:** `00-design-baseline.md` and the eight section files, against the 24 reported contradictions C-01 … C-24.

---

## 1. Step 0 — stability check

All eight section files were hashed, then hashed again after a 90-second `Start-Sleep`. Line endings are CRLF; `[System.IO.File]::ReadAllText($p,[System.Text.Encoding]::UTF8)` / Node `readFileSync(...,'utf8')` were used throughout, never `Get-Content -Raw`.

| File | Bytes | SHA-256 at T0 (22:02:53) | SHA-256 at T1 (22:04:14) | Verdict |
|---|---|---|---|---|
| `sections\01-introduction.md` | 114 841 | `31E6ED29502CE9F2DBB72DB089C00144B0D0FE3C42590CEFEC38C082EEA4899F` | same | **unchanged** |
| `sections\02-architecture.md` | 205 493 | `EB72268FA4BA1B41B3609EBD408BCF32C813373BB12F293F20630F7C7FF7FB87` | same | **unchanged** |
| `sections\03-microsoft.md` | 292 597 | `CC32D361ACF5715E5B83FFF6394943AA65F1B7E6A9CE848941C99EC919756415` | same | **unchanged** |
| `sections\04-linux.md` | 275 149 | `E0283011F8DE0404C9BC61B3E1BA2BE05A922212E221661C8C8C56BF36C4FE67` | same | **unchanged** |
| `sections\05-cisco.md` | 215 580 | `9B4CA10DE2D38C22FFA4D8E58162A755C8EE1B4A3966098D65947A7C8B6F0885` | 216 151 / `549EDC24DADF5D04455732C5690B0C6930494FADE483673D02AB10D8D2FE1C2C` | **changed before the window; stable through it** |
| `sections\06-automation.md` | 297 713 | `DCB8E9A0563E4B92421DA4D1F51EE644C061864008FC6A10EE3CAAA27944143A` | same | **unchanged** |
| `sections\07-ai.md` | 137 806 | `989FA261E9D8A02DE8DF2DEA483A3F5ABCE103DF1940FA4BB14ABE21EB8AAFA5` | same | **unchanged** |
| `sections\08-project-management.md` | 427 289 | `E38C6A07CC75A85010A923EF26E6EDBBB988845B566FAF008EBD8CED53C14B77` | same | **unchanged** |

**Interpretation and the residual risk.** `sections\05-cisco.md` moved inside the check window: 215 580 → 216 151 bytes. The Cisco writer (`W3`) confirmed this was its last rewrite pass and reported the settled values — 216 151 bytes, 32 283 words, `549EDC24…D8D2FE1C2C`, one H2, 17 H3s (9.1–9.17), 50 H4s, 31 language-tagged fenced blocks, 1 `[FIGURE:]`, 23 failure modes in §9.16 — and every later hash of the file returned exactly that value. **Every `05-cisco.md` find string in the patch list was verified against that revision, not the earlier one.** Residual risk: if the writer had made a further unreported pass before the last hash, a find string could have drifted; the automated verification in §4 would have caught it, and none failed. The risk is therefore closed for the cited rows.

**Files that were not hashed** (out of scope, deliberately untouched): `research\wsos-2026-2447.md`, `tools\md2docx\*`, `AY2627_FYP topics_v2_Victor Li.docx`, `image.png`.

## 2. What was read

For each conflict the actual text was read in the baseline **and** in every section file that touches it, rather than working from the summary:

- `00-design-baseline.md` in full (§3.3, §3.4, §4, §4.1, §5.1–§5.9, §6, §6.1, §8.5, §8.6, §10, §11.2, §11.3, §11.6, §12.3, §13.2, §14.1, §16, §18, §19 read line by line);
- `sections\04-linux.md` §8.2.4–§8.2.6, §8.4, §8.4.5, §8.6, §8.7.2 (the three places where the undecided facts were flagged with `[ASSUMPTION]`);
- `sections\03-microsoft.md` §7.3, §7.5, §7.6.1–§7.6.2, §7.11, Appendix C;
- `sections\02-architecture.md` chapter opening, §6.3, §6.6.3–§6.6.5, §6.7.4, §6.8.1, §6.9, §6.10.1;
- `sections\05-cisco.md` §9.1, §9.2, §9.3, §9.4.2, §9.6, §9.7.2, §9.10, §9.11.1–§9.11.5, §9.12.2–§9.12.3, §9.16, §9.17;
- `sections\08-project-management.md` §12.7, §13.3.3, §13.8, §13.9, §13.10, §14.9, §16 Appendix A, §19.2, §19.4, Appendix H, Appendix I;
- `sections\01-introduction.md` §2.2, §3.2, §4.2, §4.3; `sections\06-automation.md` §6; `sections\07-ai.md` (VIP log samples only).

## 3. Rulings and their evidence

| ID | Ruling (one line) | Files that carry the change | Verified against file text |
|---|---|---|---|
| C-01 | VLAN 50 is `10.10.50.0/28`; host addresses unchanged | baseline; 02, 03, 04, 05, 06, 08 | **yes** |
| C-02 | `10.10.90.10` is the nginx VIP only; nodes are `.28`/`.29` | baseline; 01, 03, 04, 06, 08 | **yes** |
| C-03 | Five normative `/30` links; `10.10.100.0/29` is a two-link container; `.4/30` IS addressed | baseline; 02, 03, 05 | **yes** |
| C-04 | Redistribution only at `VP-HQ-EDGE-01`; the `VP-HQ-CORE-01` attributions are struck | baseline; 02, 05, 08 (already correct) | **yes** |
| C-05 | The §4 VLAN table is normative; the §3.3 diagram labels are corrected | baseline | **yes** |
| C-06 | The canonical IQN names the **initiator**; the target IQN is derived | baseline; 02, 03 | **yes** |
| C-07 | `vpnz-nft01/02` `VNET-WAN` = `.2`/`.3`; `vpnz-dmzrev01/02` `VNET-CORE` = `10.10.10.28`/`.29` | baseline; 04 (both flagged `[ASSUMPTION]` sites) | **yes** |
| C-08 | `9113/tcp` confirmed as a baseline value | baseline; 02 | **yes** |
| C-09 | Canonical objectives are `O-1` … `O-14`; §13.9 re-keyed | 08 (§13.9, §14.9) | **yes** |
| C-10 | Evidence IDs are block-allocated; `EV-0214/0215` → `EV-0042/0043` | 08 | **yes** |
| C-11 | OD-01/OD-02/OD-03 recorded formally, with recommendation, decision point and other-branch impact | baseline; 02, 04, 08 | **yes** |
| C-12 | One five-file `.pkt` list, extensions included, listed once per tree | baseline | **yes** |
| C-13 | Single area 0; `area range` struck and forbidden | baseline; 05 | **yes** |
| C-14 | Four HSRP groups ratified, `.ac01`–`.ac04` | baseline; 02, 05, 08 | **yes** |
| C-15 | ASA outside default next hop = `198.51.100.6` | baseline; 05 | **yes** |
| C-16 | Merged into C-11/OD-01: `vpnz-wcwg01` terminates WireGuard; `VP-WC-EDGE-01` terminates only IPsec | baseline; 04, 08 | **yes** |
| C-17 | Two eBGP sessions; the §3.3 drawing gains the second | baseline | **yes** |
| C-18 | VLAN 30 hosts the server estate, VLAN 60 stays reserved, VLAN 90 the DMZ; `vpnz-*` names in the drawing | baseline | **yes** |
| C-19 | VLAN 20 wording clarified; A03's core uplinks are trunked | baseline; 05 (no design change) | **yes** |
| C-20 | ASA owns hop 1 of the front-door translation, the nftables pair hop 2 | baseline; 04, 05 | **yes** |
| C-21 | The only IKEv2 RAS pool is `10.10.201.0/24`; the `172.16.0.0/24` scope row is deleted | baseline; 03 (already correct) | **yes** |
| C-22 | Merged with C-12: one five-file list | baseline | **yes** |
| C-23 | Port budget added: 24 ports, 2 uplinks, 22 access ports per HQ switch | baseline (new value) | **yes** |
| C-24 | Standards census attributed to the research pack's §3.7/Appendix A census, with the pack's corrections carried | baseline; 01, 02, 08 | **yes** |

## 4. Patch-list verification (the step that could silently fail)

Every action was tested mechanically, not by eye. The final harness is `integration\verify-patch-list.js` (run from `proposal\` as `node integration\verify-patch-list.js . integration/patch-list.json`); it reads each action, loads the named file, and counts literal occurrences of the `find` value. **Before** the baseline was patched the run was:

```
total actions: 166
unique match (x1): 162
zero match (BROKEN): 0
multi-occurrence: 4
file not found: 0

--- MULTI (both are intended) ---
P-097 [sections\04-linux.md] x2   "        10.10.50.10/29 dev ens192"
P-098 [sections\04-linux.md] x2   "        10.10.50.10/29 dev ens192"
P-103 [sections\04-linux.md] x2   "ens192           UP             10.10.90.11/24"
P-104 [sections\04-linux.md] x2   "ens192           UP             10.10.90.11/24"
```

**After** the baseline patch the same harness reports the state a later worker will actually meet:

```
actions in list: 166
OK  (unique match, still pending): 118
DUP (multiple occurrences, apply to each): 4
APPLIED (already landed, find string gone as expected): 44
BROKEN (pending but find string absent): 0
file not found: 0

--- DUP ---
P-097 [sections\04-linux.md] x2
P-098 [sections\04-linux.md] x2
P-103 [sections\04-linux.md] x2
P-104 [sections\04-linux.md] x2
```

Read that second run as: **118 of the 114 pending section-file rows still match uniquely and are ready to apply** (the 118 figure counts the two duplicate rows once each, so the pending rows are 114 distinct edits across 118 matching occurrences), **the 4 duplicates are the intended second occurrences**, **44 of the 52 baseline rows are confirmed landed** (their find strings are gone exactly as expected), and the remaining 8 baseline rows still match once because their replacement text contains their own find string — P-003 (`inside  .2`), P-016 (the HSRP bullet), P-041/P-042 (the WAN-link lines), P-045, P-048, P-051 and P-039. That is an expected artefact of substitution, not an unstaged row; an in-line containment check against the patched baseline returns nothing for any baseline row. **Zero rows are broken in either run.**

Two further checks were run:

- **Round-trip check**: the Markdown table in `patch-list.md` was parsed exactly as an applier would parse it — strip the one Markdown padding space, un-escape `\|` to `|`, strip the wrapping backticks, un-escape `\n` — and compared value-by-value with `patch-list.json`. Result: **166 rows parsed, 0 mismatches, 0 rows without a JSON counterpart.** So the human-readable table and the machine file agree exactly. (This check is why `patch-list.json` exists as the primary artefact: a Markdown table cannot carry a literal pipe inside a cell without escaping, and the find strings frequently contain table rows.)
- **Post-application residual scan** of the patched baseline: 18 forbidden strings now occur **0 times** (`10.10.50.0/29`, `10.10.50.11/29`, `10.10.50.10/29`, `AS 65011`, `(VLAN 90 DMZ 10.10.90.0/24)`, `VLAN 60 SERVER`, `VLAN 10 HQ-CORE`, `VLAN 20  MGMT `, `VLAN 70  STUDENT `, `iqn…:storage-lun01/02/03`, `172.16.0.0/24`, `group 1, virtual MAC`, `OSPF ABR/redistribution point`, `not addressed in this build`, `VP-HQ-WEB-01`, `VP-HQ-DC-01`, `10.10.10.60`, `RRAS IKEv2 pool uses its own range`), and all 21 new values are present.

**One caveat, stated plainly.** `area range` still occurs **5 times** in the patched baseline: once in the struck annotation line inside the §3.4 code block (deliberately retained as the visible correction, paired with the replacement line below it), and four times in prohibition clauses — §16 ROUTING, §12.3's routing bullet, §11.3's OSPF row and the §4/VLAN context — that say it must not appear. That is a documentation artefact of quoting a forbidden string, **not** an unpatched finding, but a reviewer grepping for `area range` will see hits and should read them.

## 5. Spot-check queries for the applying worker

After applying the 114 pending section-file rows, these must all return **zero** hits:

```
vpnz-dmzrev01 = 10.10.90.10          # 04-linux §8.4.5 (patched by P-100)
10.10.50.0/29                        # 02, 04, 06
10.10.50.11/29                       # 04-linux §8.2.4
10.10.50.10/29                       # 04-linux §8.4 (two lines)
10.10.90.11/24                       # 04-linux §8.4.5 (two lines)
10.10.100.4/30, not addressed        # 05-cisco §9.4.2
area range                           # 05-cisco §9.10
AS 65011                             # (baseline only; already 0)
O10 | O11 | O8 | O2 | O1             # 08 §13.9 and §14.9 objective columns
EV-0214                              # 08 §13.8
10.10.90.10 (VIP                   # 03, 04, 06, 08 static-host rows
iqn.2026-01.lab.fyp.vertexpeak:storage-lun0N   # used as a TARGET IQN, e.g. 03 §7.6.1
```
And these must still be present: `10.10.90.28`, `10.10.90.29`, `10.10.50.0/28`, `10.10.200.2`, `10.10.200.3`, `10.10.10.28`, `0000.0c07.ac02`, `9113/tcp`, `1991-05.com.microsoft:vpnz-san01-storage-lun01.target`, `O-14`, `O-13`, `EV-0042`.

## 6. What was NOT done, and what remains

**Not edited (by instruction).** The eight section files. `sections\07-ai.md` was checked and needs **no** change; the other seven carry the 114 pending rows. Nothing under `research\` was touched, and neither `AY2627_FYP topics_v2_Victor Li.docx` nor `image.png` was opened, moved, renamed or deleted.

**Edited.** `00-design-baseline.md` — the 52 baseline rows were applied by the Design Authority with a one-shot script that refused to write unless every find string matched exactly once (it reported `applied 52 actions`); the script was removed after use, and the re-runnable check that replaces it is `integration\verify-patch-list.js`:

| File | Rev 1.0 | Rev 1.1 |
|---|---|---|
| `00-design-baseline.md` | 172 475 bytes, `2CCA3C15AC09573279B50398377055633EEF90567EEF6594BF719A16C245CA20` | **176 892 bytes, `8EE8FAC57E0A49537C3F584C7464E28DB12016BA1EB056874B3518D2EC1844FA`** |

This was judged necessary rather than optional: §16 is the contract that writers copy from, so leaving a falsified contract in place would re-introduce every conflict at the next copy. The patch-list rows for the baseline are retained as the change record and **must not be re-applied** (their find strings no longer exist).

**Remains inconsistent until the 114 pending rows are applied.** Concretely, at this moment the eight section files still state the Rev 1.0 values for: the VLAN 50 mask (`02`, `04`, `05`), the DMZ node addresses (`04`, `06`, `08`), the 9113 assumption label (`02`), the target IQN (`02`, `03`), the second-NIC addresses (`04`), the HSRP group map (`02`, `05`, `08`), the LAN-ISP "not addressed" claim (`05`), the objective keys (`08`), the evidence IDs (`08`), the `.pkt`/open-decision framing (`04`, `08`) and the WSOS census attribution (`01`, `02`, `08`). That is expected and is exactly what the patch list is for. **A submission built from the current section files would still be self-contradictory.**

## 7. Open items and things I could not resolve

1. **C-11's OD-02 (DMZ domain-join) and OD-03 (PKI tiering) are recorded as open, not decided.** Neither writer's material fixes a branch, and the baseline deliberately leaves them to a week-7 decision (`O-05`, `O-06`). I recorded the recommendation, the decision point and the impact of the other branch, which is what removes the self-contradiction; I did **not** invent a decision the group has not taken. This is the one substantive area where the document remains legitimately two-branched.
2. **The derived target IQN string is a prediction, not a captured value.** `iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target` follows Microsoft's documented derivation pattern (server IQN + target name + `.target`), but **no build has run**, so it has not been confirmed by `Get-IscsiServerTarget`. The addendum says so and requires the build log to record the real string, which then becomes the value every document uses. Everything else about C-06 (which endpoint owns the canonical string) is fully resolved.
3. **The nginx-exporter port was confirmed from product knowledge, not from an installed system.** `9113/tcp` is the standard nginx Prometheus exporter listen port and the design's own `[ASSUMPTION]` flag is removed; no live service was available to scrape. If the built exporter listens elsewhere, §10's matrix row and `02` §6.9 change — a one-line correction, recorded as such.
4. **`sections\05-cisco.md` had three rewrite passes.** All cited find strings verified against the final 216 151-byte revision; I did not diff the earlier passes, so I cannot say whether the writer's earlier drafts contained conflicts that the final pass removed.
5. **C-23 (port budget) is a new baseline fact, not a reconciliation of two existing facts.** The baseline was silent; I set 24 ports / 2 uplinks / 22 access ports per HQ switch, consistent with §6's NIC column of `24` and with §4 rule 2. If the group's simulator device has a different port count, the number is a one-line change and the *rule* (2 uplinks, rest access, unused shut in VLAN 999) is what matters.
6. **`10.10.50.0/24` vs `/28` for `VNET-EGRESS` was harmonised to `/28`.** The baseline's §6.1 `VNET-EGRESS | VMnet5 (host-only), 10.10.50.0/24` and `02` Figure 6.2's `VNET-EGRESS 10.10.50.0/24` both said `/24`; since each hypervisor host-only network should carry exactly the VLAN's subnet, both are corrected to `/28`. This was a third instance of C-01 that no writer had reported, found while reading; it is patched and recorded.
7. **Nothing was verified by running the built estate.** No virtual machine, no Packet Tracer project and no service exists at this stage; every ruling is a documentation-level decision and every verification in this report is a text comparison.

## 8. Final hashes at hand-off (22:14:15)

| File | Bytes | SHA-256 |
|---|---|---|
| `00-design-baseline.md` | 176 892 | `8EE8FAC57E0A49537C3F584C7464E28DB12016BA1EB056874B3518D2EC1844FA` |
| `00-design-baseline-rev1.1-addendum.md` | 64 324 | `573502AEB5A91E864710E2643CD07F68C56EFEE3EC4035262CD5D9EDFCFF6714` |
| `integration\patch-list.md` | 76 699 | (regenerated from `patch-list.json` after the SHA above; see the file on disk) |
| `integration\patch-list.json` | 98 990 | (source of the table; 166 actions, 52 applied, 114 pending) |
| `sections\01-introduction.md` | 114 841 | `31E6ED29502CE9F2DBB72DB089C00144B0D0FE3C42590CEFEC38C082EEA4899F` |
| `sections\02-architecture.md` | 205 493 | `EB72268FA4BA1B41B3609EBD408BCF32C813373BB12F293F20630F7C7FF7FB87` |
| `sections\03-microsoft.md` | 292 597 | `CC32D361ACF5715E5B83FFF6394943AA65F1B7E6A9CE848941C99EC919756415` |
| `sections\04-linux.md` | 275 149 | `E0283011F8DE0404C9BC61B3E1BA2BE05A922212E221661C8C8C56BF36C4FE67` |
| `sections\05-cisco.md` | 216 151 | `549EDC24DADF5D04455732C5690B0C6930494FADE483673D02AB10D8D2FE1C2C` |
| `sections\06-automation.md` | 297 713 | `DCB8E9A0563E4B92421DA4D1F51EE644C061864008FC6A10EE3CAAA27944143A` |
| `sections\07-ai.md` | 137 806 | `989FA261E9D8A02DE8DF2DEA483A3F5ABCE103DF1940FA4BB14ABE21EB8AAFA5` |
| `sections\08-project-management.md` | 427 289 | `E38C6A07CC75A85010A923EF26E6EDBBB988845B566FAF008EBD8CED53C14B77` |

*End of consistency report.*
