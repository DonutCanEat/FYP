# RESIDUAL FIX REPORT — the five residual consistency gaps

**Scope:** close the five residuals left by `integration\patch-application-report.md` §4.4 and §6, then
re-verify. Nothing else was changed.
**Working directory for every command below:** `D:\File\School\FYP\proposal\`
**Backups:** `%TEMP%\fyp-residual-backup\` (all eight section files, copied before the first edit;
every "before" hash below was computed from these copies).
**Method:** `read` / `grep` to locate each site, `edit` for the smallest substitution at each site.
Line endings preserved per file (seven LF, `08-project-management.md` CRLF), no BOM added, no
reformatting, no rewording beyond what each fix required.

---

## 1. Summary

| # | Fix | Files touched | Sites |
|---|---|---|---|
| 1 | Live Ansible inventory address `10.10.90.11` → `10.10.90.29` for `vpnz-dmzrev02` | `06-automation.md` | 2 (the named one, **plus one more of the same defect**) |
| 2 | Last stale `/29` mask for VLAN 50 → `/28` | `02-architecture.md`, `05-cisco.md`, `08-project-management.md` | 4 |
| 3 | Topology label `VLAN 10 HQ-CORE` → `LAN-HQ-CORE` | `05-cisco.md` | 1 |
| 4 | Canonical IQN no longer presented as the **target** IQN | `08-project-management.md` | 2 |
| 5 | Missing value `10.10.200.3` added | `02-architecture.md`, `04-linux.md`, `08-project-management.md` | 5 |

**One extra site was found and fixed that the task did not name** — see §2.1. It is the *same* defect
as FIX 1 in the *same* Ansible inventory, one entry above the named line, and it is additionally
required by the inspection the task explicitly asked for ("check the whole file for any other stale
`.11`/`.10` usage in that host's role"). It is reported here rather than left silent, because it is a
deviation from "change nothing beyond what each fix requires".

**One genuine conflict was looked for and NOT found** — see §7. `10.10.200.0/24` serving both the
WireGuard tunnel pool and the nftables WAN NICs is deliberate, is stated by ruling C-07 itself, and is
now stated explicitly in the documents. No design ruling is needed and none was invented.

---

## 2. The fixes, site by site

Line numbers are **final** (post-edit) unless marked "before".

### 2.1 FIX 1 — `sections\06-automation.md`

The Ansible inventory block `linux: > web: > hosts:` (lines 614–625) listed the nginx pair at
`10.10.90.10` and `10.10.90.11`. Under ruling C-02 neither is a node address: `10.10.90.10` is the
VRRP VIP **owned by no node**, `vpnz-dmzrev01` is `10.10.90.28` and `vpnz-dmzrev02` is `10.10.90.29`.
Both entries were stale; the task named only the second.

| Line (final) | Before | After |
|---|---|---|
| 617 | `              ansible_host: 10.10.90.10` | `              ansible_host: 10.10.90.28` |
| 622 | `              ansible_host: 10.10.90.11` | `              ansible_host: 10.10.90.29` |

Line 617 is the extra site. Justification: the task's own instruction was to check the whole file for
any other stale `.11`/`.10` usage in that host's role. `.10` is the *more* dangerous of the two — an
inventory that points `vpnz-dmzrev01` at the VIP makes the playbook connect to whichever node is
currently master, so the "host" would silently move on failover. Leaving it while fixing only `.11`
would have left the inventory half-correct and internally inconsistent with lines 722–723
(`vpnz-dmzrev01: 10.10.90.28` / `vpnz-dmzrev02: 10.10.90.29`) and with line 880 in the same file.

**Rest-of-role check (as instructed).** All 22 `ansible_host` values in the file were enumerated: the
only ones that were stale were the two above. The nftables pair entries `10.10.50.11`/`10.10.50.12`
(lines 629/634) are correct per ruling C-01 and were **not** touched. Post-edit scan for
`ansible_host: 10.10.90.10` and `ansible_host: 10.10.90.11` returns **0 hits**.

### 2.2 FIX 2 — the last stale `/29` for VLAN 50

Ruling C-01 widened VLAN 50 `TRANSIT-EGRESS` to **`10.10.50.0/28`** (usable `.1`–`.14`), host
addresses `.1`/`.2`/`.10`/`.11`/`.12` unchanged. The named site and three further genuine `/29`
occurrences in a VLAN 50 context were corrected. In every case only the mask-length text changed.

| File | Line (final) | Before → After |
|---|---|---|
| `02-architecture.md` | 745 | `… \| 10.10.50.0/29 \| **51** \| …` → `… \| 10.10.50.0/28 \| **51** \| …` |
| `02-architecture.md` | 684 | `50 shown as a short rung because it is a ``/29``;` → `… because it is a ``/28``;` |
| `05-cisco.md` | 851 | `! Vlan45 10.10.45.1/24, Vlan50 10.10.50.1/29, …` → `… Vlan50 10.10.50.1/28, …` |
| `08-project-management.md` | 1685 | `inside = 10.10.50.2/29;` → `inside = 10.10.50.2/28;` |
| `02-architecture.md` | 663 | `inside = 10.10.50.2/29;` → `inside = 10.10.50.2/28;` |
| `05-cisco.md` | 131 | `… inside 10.10.50.2/29 …` → `… inside 10.10.50.2/28 …` (**plus a one-space re-pad**, below) |

Line 745 is the site the task named. 684, 851, 1685, 663 and 131 are the answer to "confirm no other
`/29` mask for VLAN 50 survives anywhere in the eight files" — the mask, not just the literal
`10.10.50.0/29`. `10.10.50.2/29` is the ASA inside interface *in VLAN 50*, so it carried the same
stale mask; 663 and 1685 are the loopback-allocation rows of `02-architecture.md` and
`08-project-management.md`, and 131 is the ASCII topology.

**One non-substitution was needed at `05-cisco.md:131`.** That line is inside the ASCII topology, and
`/28` is one character shorter than `/29`, so the substitution pulled `HSRP standby (100)` one column
left and broke the diagram's column alignment against line 130. One space was removed from the run of
padding so that `HSRP standby` sits at the same column as `mgmt 10.20.20.12` above it — verified:
both now begin at column 65. This is the only whitespace change in the whole task and it exists
solely to keep the substitution from introducing a visible defect.

Post-edit scan: `10.10.50.0/29` → **0 hits**; any `10.10.50.<n>/29` → **0 hits**; `Vlan50 … /29` → **0
hits**; `50 … /29` in any VLAN 50 context → **0 hits**.

### 2.3 FIX 3 — the topology label

Ruling C-05 made the baseline's §4 VLAN table normative and renamed VLAN 10 to `LAN-HQ-CORE`.

| File | Line (final) | Before → After |
|---|---|---|
| `05-cisco.md` | 127 | `  ================ VLAN 10 HQ-CORE 10.10.10.0/24 (L2 transit) ================` → `  ================ VLAN 10 LAN-HQ-CORE 10.10.10.0/24 (L2 transit) ================` |

This is the only ASCII topology diagram in the file (the fenced `text` block at lines 112–144); there
is no Mermaid diagram in `05-cisco.md`. **VLAN 20 / 60 / 70 / 90 in that diagram:** the diagram does
not carry VLAN 60, 70 or 90 as separate labels, so there was nothing to rename for them. What it does
carry is consistent with the normative names: line 132 lists the access switches as
`A03 (VLANs 20,70) | A04 (VLANs 30,45,50,60,80,90)`, and every spelled-out VLAN label elsewhere in
the file already uses the normative strings — `MGMT-OOB` (lines 19, 150, 198, 324, 369, 500, 588),
`SRV-HQ-2` (20, 379, 505, 593), `STUDENT-LAB` (19, 381, 506, 594), `DMZ-HQ` (20, 385, 508, 596). No
further change was needed or made. Post-edit scan: `VLAN 10 HQ-CORE` → **0 hits**.

### 2.4 FIX 4 — the stale iSCSI IQN in two places

Ruling C-06: the canonical string `iqn.2026-01.lab.fyp.vertexpeak:storage-lun0N` names the
**INITIATOR** on `vpnz-dmzweba01`; the **target** IQN is derived by Microsoft's iSCSI Target Server as
`iqn.1991-05.com.microsoft:vpnz-san01-storage-lun0N.target` and is not settable.

**Site 1 — `08-project-management.md` line 1714** (static-host addressing table, Appendix A.7):

* before: `` | `vpnz-san01` | 10.10.80.21 | 80 | Block-storage target; IQN `iqn.2026-01.lab.fyp.vertexpeak:storage-lun01` (and `-lun02`, `-lun03`) | ``
* after: `` | `vpnz-san01` | 10.10.80.21 | 80 | Block-storage target; **target** IQN `iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target`, derived by the iSCSI Target Server and not settable — the canonical string `iqn.2026-01.lab.fyp.vertexpeak:storage-lun01` (and `-lun02`, `-lun03`) is the **initiator** IQN on `vpnz-dmzweba01` (Rev 1.1 ruling C-06) | ``

**Site 2 — `08-project-management.md` line 2073** (the "NETWORK IDENTITY VALUES" block). The single
`iSCSI IQN` line, which named the canonical string with no role and so read as the storage/target
value, was replaced by two role-labelled lines:

```
before:
iSCSI IQN                     iqn.2026-01.lab.fyp.vertexpeak:storage-lun01 (and -lun02, -lun03)

after (lines 2073-2077):
iSCSI initiator IQN           iqn.2026-01.lab.fyp.vertexpeak:storage-lun01 (and -lun02, -lun03)
                              on vpnz-dmzweba01 -- the canonical string, set by the group
iSCSI target IQN              iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target
                              (and -lun02.target, -lun03.target) -- DERIVED by the iSCSI Target
                              Server on vpnz-san01; not settable (Rev 1.1 ruling C-06)
```

Continuation-line indentation (30 spaces) matches the existing convention of that block (e.g. the
"WSOS 2026 section weights" and "Windows paths" entries). ASCII `--` was used rather than an em dash
to match the surrounding block, which contains no non-ASCII characters.

**"Does the surrounding text still imply the canonical string is settable on the target?"** No.
Line 1714 now labels it `**initiator** IQN on `vpnz-dmzweba01``; line 2073 labels it
`iSCSI initiator IQN`; and the new target line states `DERIVED … not settable`.

**Check of `03-microsoft.md` and `02-architecture.md` (as instructed).** No remaining place presents
the canonical string as the target IQN:
* `02-architecture.md:824` already states the derived target IQNs and that the canonical string names
  the *initiator* — correct at hand-off, unchanged.
* `03-microsoft.md:1943/1944/1945` already carry the C-06 table (target derived, initiator canonical)
  — correct, unchanged.
* `03-microsoft.md:2038` (Option 2 of the withdrawn assumption), `:3486` and `:2161` use the string
  as the **initiator** in `-InitiatorId` / `InitiatorNodeAddress` — correct.
* `03-microsoft.md:3602` is the F-L1-05 defect row, whose subject *is* the withdrawn claim that "the
  target IQN matches the baseline string"; it quotes that defective requirement in order to close it.
  Legitimate, unchanged.
* `03-microsoft.md:2035` is the honest-gap note that explains why the canonical string cannot be the
  target IQN. Legitimate, unchanged.
A query for `target…iqn.2026-01.lab.fyp.vertexpeak:storage-lun` returns **0 hits**.

### 2.5 FIX 5 — the missing value `10.10.200.3`

Ruling C-07: `vpnz-nft01` `VNET-WAN` = `10.10.200.2/24`, `vpnz-nft02` `VNET-WAN` =
**`10.10.200.3/24`**. The value appeared in **none** of the eight files before this task
(`integration\consistency-report.md` §5 lists it among the values that must be present).

| File | Line (final) | What was added |
|---|---|---|
| `08-project-management.md` | 1719–1720 | the `vpnz-nft01` / `vpnz-nft02` static-host rows now carry `; `VNET-WAN` NIC 10.10.200.2` and `; `VNET-WAN` NIC 10.10.200.3` |
| `02-architecture.md` | 682 | one added sentence at the end of §6.6.5: the two physical `VNET-WAN` NICs of the pair take `10.10.200.2/24` (nft01) and `10.10.200.3/24` (nft02) in the same `/24`, and they are deliberately *not* the tunnel address |
| `04-linux.md` | 158 | `                                                # (vpnz-nft02 carries 10.10.200.3/24 on the same NIC role)` |
| `04-linux.md` | 168–170 | the C-07 note now states that the ruling fixes **both** the tunnel addressing and each node's physical NIC address: `.2` for nft01, `.3` for nft02 |
| `04-linux.md` | 1664 | §8.4's inline-pair introduction now names both WAN-side addresses: "the WAN-side NIC carries `10.10.200.2/24` on `vpnz-nft01` and `10.10.200.3/24` on `vpnz-nft02` per Rev 1.1 ruling C-07" |

**(b) was the case the task flagged, and the answer is "both".** `vpnz-nft01`'s WAN NIC was *not*
left unaddressed in the configuration — the netplan block at lines 156–157 already assigned
`10.10.200.2/24` — but the explanatory comment underneath it still *described* the pre-C-07 state,
saying that the baseline "does not state a separate physical address for `vpnz-nft01`'s second NIC",
that "leaving the NIC unaddressed lets the wg0 tunnel address do all the work and is the safer
default", and that a physical address "would create a second, competing owner of the same prefix".
The first two claims were falsified by the very address printed above them; the third was an
overstatement that contradicted the new §2.5 sentence. Because the task said to *update that
explanation* rather than invent a new configuration block, the comment was rewritten in place (no new
netplan block was created and `10.10.200.3` was added for nft02 "in the same style" — as an
annotation on the shared nftables configuration, since `04-linux.md` gives the pair one netplan
document with a node-2 keepalived section, not a second netplan block). The rewritten comment now
says the prefix is shared by two different objects (the node's own transport address on the NIC, and
the tunnel address on `wg0`), which is not a duplicate owner because they are different addresses,
and would only be a conflict if the pair forwarded into the rest of `10.10.200.0/24`, which it does
not. The trade-off discussion it replaced was resolved, not deleted silently.

**(c) other enumeration sites.** `10.10.200.3` is now present in the two per-host static-host tables
(`02` §A.7-equivalent row set is in `08`; `02` carries the addressing narrative), the linux per-host
config and the linux §8.4 intro. Deliberately **not** added to the WireGuard tunnel-pool tables
(`02` §6.6.5 tunnel rows, `04` §8.7, `08` §1974–1990), because those enumerate *tunnel* addresses and
`.3` is not one — see §7.

---

## 3. Hashes and sizes

All eight files were backed up to `%TEMP%\fyp-residual-backup\` before the first edit; the "before"
values below are computed from those copies and match `patch-application-report.md` §1 exactly, which
confirms the files were pristine when this task started.

| File | Bytes before → after | SHA-256 before → after |
|---|---|---|
| `01-introduction.md` | 115 332 → 115 332 | `513A01A015498A886E042CB47635DF4F4BF48D298DFF5F2F6CBAF88748B1F9D2` → unchanged |
| `02-architecture.md` | 206 955 → 207 450 | `1930E9782D97085150B88F021DE7D2F379EC90CACAB6364CACA3491EFCD13C72` → `280C9ABC992F8E49FE2D1BA9D3D08256718056248680BD9411A121804F13466E` |
| `03-microsoft.md` | 293 626 → 293 626 | `2539D46F2643DBFE41F488959F9EC663F2DAE81631D8D93A84F1C1ABD385124C` → unchanged |
| `04-linux.md` | 277 037 → 277 513 | `AF5792F533883A86247031CD1C8DD7BE191D06C0BF0DE9048B8224D5E86BA95E` → `5BDF143151B282D602F8D7BBF74A9450B153417DA3562DB2E87595068F7301EA` |
| `05-cisco.md` | 217 089 → 217 092 | `A9DF239D163AADD27AFAA5DAA0F26E7C9013C724E0F429538BEF1BC9E1820FEA` → `AD6D34E10733874E732351A7F842A8AAADF812BC9F20E5EF023B924DA8C8105B` |
| `06-automation.md` | 297 919 → 297 919 | `16A23D8DD72BCC7A340C0E44F28AF75D14FBDB331C489DF127F324A2BA3BB7ED` → `E5F48EA8DBDB47ACEE3B3163AB246358CD932817AB6AFA9F5478F714CFA596BA` |
| `07-ai.md` | 137 806 → 137 806 | `989FA261E9D8A02DE8DF2DEA483A3F5ABCE103DF1940FA4BB14ABE21EB8AAFA5` → unchanged |
| `08-project-management.md` | 428 921 → 429 558 | `0966526F81BBC78F95D4626CE0B5B7C6EF70B3FDBFFAA56A005B05210E1E8CD1` → `BF8A1F2B30CB9FD40E26D77B3DABD99690B2CA6346470F8FCAFEA011DBE48F1B` |

**Three files unchanged** — `01-introduction.md`, `03-microsoft.md`, `07-ai.md` — because no fix
required a change in them. `06-automation.md`'s byte count is unchanged because
`10.10.90.10 → 10.10.90.28` and `10.10.90.11 → 10.10.90.29` are equal-length substitutions; its hash
changed, so the edit did land.

**Encoding and line endings re-verified after the final edit:** no file contains U+FFFD or mojibake
(`â€`/`Ã¢`), no file has a BOM, `01`–`07` are pure LF and `08-project-management.md` is pure CRLF
(2 622 CRLF / 2 622 LF) — identical to the pre-edit state. The only non-ASCII characters introduced
are the em dash `U+2014` in the `08-project-management.md:1714` cell and the section sign `U+A7`
(`§`) already conventional in the `04-linux.md` comment block.

---

## 4. Verification 1 — `verify-patch-list.js`

Run from `D:\File\School\FYP\proposal\`:

```
> node integration\verify-patch-list.js . integration\patch-list.json

actions in list: 166
OK  (unique match, still pending): 15
DUP (multiple occurrences, apply to each): 0
APPLIED (already landed, find string gone as expected): 151
BROKEN (pending but find string absent): 0
file not found: 0

--- DUP ---
(none)

--- BROKEN ---
(none)

--- FILE NOT FOUND ---
(none)
```

**Exit status 0. `BROKEN 0`**, unchanged from `patch-application-report.md` §3. The five fixes added
no new patch-list rows (they are documented here instead), so the counts are identical to the
pre-task run.

## 5. Verification 2 — `verify-sections.js`

Run from `D:\File\School\FYP\proposal\` as `node integration\verify-sections.js` (no arguments; the
header documents the working directory only). Exit status 0. Its output is written to
`integration\verify-sections-output.txt`.

| Property | Pre-edit | Post-edit | Verdict |
|---|---|---|---|
| Real ATX H1 headings | 0 in all eight | 0 in all eight | unchanged |
| H2 headings | 10 / **2** / 1 / 1 / 1 / 1 / 1 / 9 | 10 / **2** / 1 / 1 / 1 / 1 / 1 / 9 | unchanged |
| Fenced code blocks | 4 / 0 / 298 / 354 / 62 / 110 / 46 / 24, all even | identical | balanced, unchanged |
| Tables with column mismatches | `06` 5 rows, `08` 31 rows, others 0 | identical | unchanged |
| Totals line | H2 mismatches 1 · unbalanced fences 0 · files with column mismatches 2 | identical | unchanged |

**On the H2 count for `02-architecture.md`.** The brief's expectation was `10 / 2 / 1 / 1 / 1 / 1 /
1 / 9` and the file measures **2**, which is why the script's built-in `EXPECTED_H2` of `1` prints
one `MISMATCH`. This is pre-existing and is the same note `patch-application-report.md` §5 records:
the two H2s are `## 5. Literature and Technology Review` (line 1) and `## 6. System Architecture
Design` (line 392). It is a stale expectation inside the verifier, not a document defect, and the
count is unchanged by this task. **No fix was applied to the script** (it is outside this task's
scope).

**No new table-column mismatch.** Counted 17 flagged rows pre-edit and 17 post-edit. All 17 were
compared **row-text by row-text** (coordinates stripped) and are textually identical; all 17
`table starting line`/`line` coordinates are also unchanged, so no flagged table moved or grew a row.
The 5 are in `06-automation.md` and the 12 shown are the first twelve of the 31 in
`08-project-management.md` (the script truncates its printed detail at 12 per file). Independently,
all eight files were re-analysed with the same H1/H2/fence/table-cell logic against the
`%TEMP%\fyp-residual-backup\` copies: **0 files differ** in structure or in the flagged-row set.
The `02-architecture.md`, `04-linux.md`, `05-cisco.md` and `08-project-management.md` tables
edited or extended by FIX 2 and FIX 5 all remain at **0 mismatched rows**.

## 6. Verification 3 — independent old/new value scan

### 6.1 Old values — must be gone

| Query | Hits | Where |
|---|---|---|
| `10.10.90.11` (bare) | **1** | `04-linux.md:1517` — inside the `[RESOLVED by Rev 1.1 ruling C-02]` correction note |
| `ansible_host: 10.10.90.10` / `…10.10.90.11` | **0** | — |
| `vpnz-dmzrev0N = 10.10.90.10` / `= 10.10.90.11` | **1** | `04-linux.md:1517`, same correction note (it quotes the old values, then gives `.28`/`.29`) |
| static-host row `| vpnz-dmzrev0N | 10.10.90.10` | **0** | — |
| `10.10.50.0/29` | **0** | — |
| any `10.10.50.<n>/29` | **0** | — |
| `/29` in any VLAN 50 context (incl. `Vlan50 … /29`) | **0** | — |
| `VLAN 10 HQ-CORE` | **0** | — |
| canonical IQN labelled as the **target** IQN | **0** | — |

**The single surviving `10.10.90.11` is the legitimate kind.** Line 1517 of `04-linux.md` is the
correction note created by patch row P-100. It reads "The collision this note flags is fixed:
`vpnz-dmzrev01 = 10.10.90.28`, `vpnz-dmzrev02 = 10.10.90.29`, and `10.10.90.10` is the keepalived VIP
**only** and is owned by no node", and then, deliberately, "The original note began: the baseline
records `vpnz-dmzrev01 = 10.10.90.10 (VIP 10.10.90.10)` and `vpnz-dmzrev02 = 10.10.90.11`." The note
cannot explain which collision it fixed without quoting the old values; `patch-application-report.md`
§4.3 classifies this exact line as legitimate for that reason. **It is the only surviving old value in
the eight files and it is inside an explicit correction note**, which is the case the task's
verification step carved out.

### 6.2 New values — must be present with the expected meaning

| Value | Present? | Occurrences and the meaning carried |
|---|---|---|
| `10.10.200.2` | **yes** | 6 — `VNET-WAN` NIC of `vpnz-nft01` (`02:682`, `04:157/169/171/1664`, `08:1719`) |
| `10.10.200.3` | **yes** | 6 — `VNET-WAN` NIC of `vpnz-nft02` (`02:682`, `04:158/169/171/1664`, `08:1720`) |
| `10.10.90.28` | **yes** | 17 — node address of `vpnz-dmzrev01` (`02:111`, `04:191/255/1230/1495/1517`, `06:617/722/880`, `08:1721`, …) |
| `10.10.90.29` | **yes** | 16 — node address of `vpnz-dmzrev02` (`02:111`, `04:256/1230/1509/1517/1564`, `06:622/723/880`, `08:1722`, …) |
| `10.10.50.0/28` | **yes** | 19 — the VLAN 50 mask (`02:111/485/631/745`, `05:818/1178/1196`, `08:1620/1994`, …) |
| `10.10.90.10` | **yes**, VIP-only | never a node address; the only assignment-form hit is the correction note at `04-linux.md:1517`, which denies it |
| `iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target` | **yes** | 10 — the derived **target** IQN (`02:824`, `03:1944/2018/2030/2137/2162`, `08:1714/2075`) |

Counts are per line. A naive substring count of `10.10.200.2` also matches inside the management
escape-hatch addresses `10.10.200.200/32` and `10.10.200.201/32` (`02-architecture.md:680`,
`04-linux.md:167/3123`, `08-project-management.md:1674`), which inflated the first measurement to 12;
the figure above is with the `10.10.200.2(?!\d)` boundary applied. Those three occurrences are tunnel
addresses, not host addresses, and were correctly left alone.

---

## 7. The possible `10.10.200.0/24` dual-use conflict — **looked for, not found**

The task asked me to stop and report if `10.10.200.0/24` could not legitimately serve both the
WireGuard tunnel pool and the nftables WAN NICs. **It can, and no ruling is needed.** The evidence is
the ruling itself: C-07's own rationale at `00-design-baseline-rev1.1-addendum.md` lines 172–178
assigns `.2`/`.3` *inside* `10.10.200.0/24` and says explicitly that "giving the two physical NICs
distinct addresses keeps transport addressing and **tunnel** addressing separate — a physical address
is not the same object as the `wg0` tunnel address that floats with the VIP." The baseline already
enumerates the same `/24` in both roles without duplicating any address — `00-design-baseline.md`
line 378/379 (`vpnz-nft01` … `10.10.200.2` on `VNET-WAN`), line 452 (`VNET-WAN | VMnet10
(host-only), 10.10.200.0/24 (tunnel/transport emulation)`), lines 331–336 (the tunnel rows `.1`,
`.5`, `.64/26`, `.200`/`.201`) and line 1303 (`vpnz-nft01 / .02 VNET-WAN 10.10.200.2 / 10.10.200.3`).
`.2`, `.3`, `.1`, `.5`, `.64/26`, `.200`, `.201` are seven distinct values in one `/24`, so there is
no collision to resolve.

The one thing that genuinely needed saying was *why* sharing the prefix is not a duplicate owner, so
that a reader meeting `.2` on a physical NIC and `.1` on `wg0` in the same `/24` does not "fix" it.
That statement now exists in both places a reader will look: `02-architecture.md:682` ("A physical
address is a different object from the tunnel address, so the prefix is shared and the roles are
not") and the rewritten `04-linux.md` comment at lines 159–164. **No fix was forced and no baseline
conflict was manufactured.**

---

## 8. What I did not do, and what remains open

1. **Nothing was changed outside the five fixes**, except the one extra site in §2.1 (same defect,
   same file, same inventory, explicitly within the "check the whole file" instruction) and the
   one-space re-pad in §2.2 (`05-cisco.md:131`, a mechanical consequence of `/29`→`/28` in an ASCII
   diagram, not a rewording). Everything else in the eight files is untouched — including the
   17 pre-existing table flags, which were deliberately **not** repaired, because they are an artefact
   of the verifier's code-span heuristic and repairing them is outside this task.
2. **No patch-list rows were added** for the five fixes. `integration\patch-list.json`,
   `patch-list.md` and `record-patch-status.js` were **not** touched; each row would have been a
   different kind of change from the substitutions the list was built to carry, and this report is the
   change record instead. `verify-patch-list.js` therefore still reports 166 actions with the same
   counts.
3. **`verify-sections.js` still expects 1 H2 for `02-architecture.md`** and will keep printing one
   `MISMATCH`. That is the script's expectation being stale, not the document; the file has had 2 H2s
   since before the 114-patch run. I did not edit the script (out of scope, and it is not in the
   protected list either — it simply was not needed to close a residual).
4. **`integration\consistency-report.md` §5's "zero hits" list has one permanent, intended
   exception** — `10.10.90.11` inside the `04-linux.md:1517` correction note. §6.1 above states it
   explicitly rather than letting a future reader think the query should return 0 and find a hit.
5. **Line numbers for the two `08-project-management.md` IQN sites have moved.** `patch-application-
   report.md` cites `:1714` and `:2073`; `:1714` is still the same row, and the identity block now
   occupies `:2073`–`:2077` because the single IQN line became five. A later reader grepping for
   `iSCSI IQN` will not find the old line.
6. **No build, VM, simulator or service was involved.** Every verification here is a text comparison;
   in particular the derived target IQN `iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target`
   remains a documented prediction that the build log must confirm with `Get-IscsiServerTarget`, as
   `consistency-report.md` §7.2 already records.
7. **Files not modified, moved or deleted** (as instructed): `AY2627_FYP topics_v2_Victor Li.docx`,
   `image.png`, `00-design-baseline.md`, `00-design-baseline-rev1.1-addendum.md`,
   `integration\patch-list.json`, `integration\patch-list.md`, `integration\consistency-report.md`,
   `integration\verify-patch-list.js`, `integration\apply-patches.js`, `integration\verify-sections.js`
   and everything under `research\` and `tools\`. Only the five section files in §3 were written.
   `integration\verify-sections-output.txt` was rewritten by running the verifier, which is that
   script's own documented behaviour.

*End of report.*
