# 00-design-baseline — REV 1.1 ADDENDUM (Formal Change Record)

**Supersedes, for the specific clauses listed below only:** `proposal\00-design-baseline.md` Rev 1.0.
**Issued by:** Design Authority (consistency-review worker), acting on eight section writers' cross-check reports.
**Date of issue:** authoring day of this addendum (see the file's own timestamp on disk).
**Applies to:** `sections\01-introduction.md` … `sections\08-project-management.md`, and the baseline clauses named below.
**Machine-applicable edit list:** `proposal\integration\patch-list.json` (166 actions; the primary artefact) and `proposal\integration\patch-list.md` (the same 166 rows as a Markdown table, generated from the JSON). Re-check at any time with `node integration\verify-patch-list.js . integration\patch-list.json`.
**Verification record:** `proposal\integration\consistency-report.md`.

> **Reading rule.** Where a clause below is listed as *SUPERSEDED*, the value in this addendum is normative and Rev 1.0's text was wrong. Where a clause is listed as *RATIFIED*, Rev 1.0's text was ambiguous or silent and this addendum fixes the meaning for the first time. Nothing else in Rev 1.0 changes. The **Interface contract for writers (§16)** authority is preserved: §16 is still the single authority for hostnames, addresses, versions and paths — this addendum amends §16 where C-01, C-03, C-06, C-07, C-14 and C-22 require it.

> **Application status of this revision.**
> * **`00-design-baseline.md` has been patched and is now Rev 1.1** — 176 892 bytes, SHA-256 `8EE8FAC57E0A49537C3F584C7464E28DB12016BA1EB056874B3518D2EC1844FA` (Rev 1.0 was 172 475 bytes, `2CCA3C15AC09573279B50398377055633EEF90567EEF6594BF719A16C245CA20`). All 52 baseline actions in `integration\patch-list.json` are applied; they are retained there as the change record and **must not be re-applied**, because their find strings no longer exist in the patched file. §16 now carries the amended values, so no future writer can re-copy a superseded one.
> * **The eight section files are NOT yet patched.** The 114 section-file actions are `PENDING`. Until they are applied, the section files still state the Rev 1.0 values, and a submission assembled from them would still contradict the patched baseline and itself. `integration\consistency-report.md` §6 lists exactly which section still holds which superseded value.

## 1. Stability check (Step 0)

| File | Bytes | SHA-256 at start (22:02:53) | SHA-256 at end (22:04:14) | Verdict |
|---|---|---|---|---|
| `sections\01-introduction.md` | 114 841 | `31E6ED29…EA4899F` | `31E6ED29…EA4899F` | unchanged |
| `sections\02-architecture.md` | 205 493 | `EB72268F…FF7FB87` | `EB72268F…FF7FB87` | unchanged |
| `sections\03-microsoft.md` | 292 597 | `CC32D361…9756415` | `CC32D361…9756415` | unchanged |
| `sections\04-linux.md` | 275 149 | `E0283011…36C4FE67` | `E0283011…36C4FE67` | unchanged |
| `sections\05-cisco.md` | 215 580 → 216 151 | `9B4CA10D…B6F0885` | `549EDC24…D8D2FE1C2C` | **changed before the check window; stable thereafter** |
| `sections\06-automation.md` | 297 713 | `DCB8E9A0…27944143A` | `DCB8E9A0…27944143A` | unchanged |
| `sections\07-ai.md` | 137 806 | `989FA261…1EB8AAFA5` | `989FA261…1EB8AAFA5` | unchanged |
| `sections\08-project-management.md` | 427 289 | `E38C6A07…3C14B77` | `E38C6A07…3C14B77` | unchanged |

`05-cisco.md` completed three writer rewrite passes (`235,696 → 221,232 → 215,580 → 216,151` bytes). Its final state was confirmed by W3 as 216,151 bytes / 32,283 words / `549EDC24…D8D2FE1C2C`, and the file did not move during the 90-second hash window or afterwards. **All rulings below are quoted from, and verified against, that final revision.** Full hashes and the verification method are in `integration\consistency-report.md`.

## 2. Rulings C-01 … C-12

### C-01 — VLAN 50 `TRANSIT-EGRESS` subnet too small **[SUPERSEDED]**

**Conflicting text.**
- `00-design-baseline.md` §4 VLAN table (line 226): `| 50 | `TRANSIT-EGRESS` | HQ | … | 10.10.50.1 (`VP-HQ-CORE-01` gi0/1.50) |`
- `00-design-baseline.md` §5.2 (line 280): `| 10.10.50.0/29 | 50 | 10.10.50.1 | 10.10.50.1 | 10.10.50.6 | 10.10.50.7 | No | Egress transit (core ↔ nftables ↔ ASA) |`
- `00-design-baseline.md` §5.7 (lines 375–376): `| `vpnz-nft01` | 10.10.50.11 (VIP 10.10.50.10) | 50 | …` / `| `vpnz-nft02` | 10.10.50.12 (VIP 10.10.50.10) | 50 | …`
- `00-design-baseline.md` §5.5 (line 343): `inside = 10.10.50.2/29`
- `sections\04-linux.md` §8.2.4 line 138: `- 10.10.50.11/29                        # physical address of vpnz-nft01`
- `sections\02-architecture.md` §6.6.3 line 631: `| 10.10.50.0/29 | 50 | 10.10.50.1 | .1 – .6 | No | Egress transit: core ↔ nftables ↔ ASA |`

**Ruling.** The **mask is wrong, not the host addresses**. VLAN 50 is `10.10.50.0/28` (usable `10.10.50.1 – 10.10.50.14`, broadcast `10.10.50.15`). The 5 addresses already written — `10.10.50.1` (`VP-HQ-CORE-01` gi0/1.50), `10.10.50.2` (ASA inside), `10.10.50.10` (nftables VRRP VIP), `10.10.50.11` (`vpnz-nft01`), `10.10.50.12` (`vpnz-nft02`) — are **all retained unchanged**.

**Why this minimised downstream edits.** Re-numbering the host addresses into `10.10.50.0/29` instead would have required rewriting every one of the ~78 verified occurrences of `10.10.50.10/.11/.12` across all eight section files (interface addresses, keepalived stanzas, nftables VRRP-source rules, Ansible inventory, DNS records, conntrack samples, curl and ssh targets, ACLs, test cases), plus `sections\05-cisco.md`'s ASA `route inside` set, and would have changed the VRRP VIP that every document treats as the tunnel front door. Widening the mask changes **only mask-length text**: 18 occurrences across four files. It also fits the existing allocation, because `10.10.50.0/24` is otherwise unallocated — nothing else in the design lives in `10.10.50.0/24`.

**New facts (copy-paste-able).**
```
VLAN 50  TRANSIT-EGRESS  10.10.50.0/28   gw 10.10.50.1
  first usable 10.10.50.1   last usable 10.10.50.14   broadcast 10.10.50.15   DHCP: No
  VP-HQ-CORE-01 gi0/1.50            10.10.50.1
  VP-HQ-FW-01 (ASA) inside          10.10.50.2   (mask 255.255.255.240)
  nftables VRRP VIP (vrid 51)       10.10.50.10
  vpnz-nft01 (VNET-EGRESS, ens192)  10.10.50.11
  vpnz-nft02 (VNET-EGRESS, ens192)  10.10.50.12
  # 10.10.50.3 – 10.10.50.9 and 10.10.50.13 – .14 are reserved, unallocated, and must not be used
```
Linked consequence: `VNET-EGRESS` is the hypervisor host-only network carrying VLAN 50; `sections\03-microsoft.md` §7 AD-site subnet list and `sections\05-cisco.md` §9.11's prefix list / EIGRP / OSPF forms must carry `/28` and `0.0.0.15`. `sections\02-architecture.md`'s Figure 6.2 spoke label `VNET-EGRESS 10.10.50.0/24` is corrected to `10.10.50.0/28` (it was never the baseline's value; §6.1 of the baseline lists `VNET-EGRESS | VMnet5 (host-only), 10.10.50.0/24` and that clause is superseded here too).

### C-02 — Nginx/edge HA VIP collides with a host address **[SUPERSEDED]**

**Conflicting text.**
- `00-design-baseline.md` §5.7 (line 377): `| `vpnz-dmzrev01` | 10.10.90.10 (VIP 10.10.90.10) | 90 | Ubuntu: Nginx reverse proxy, first keepalived master, TLS terminator |`
- `00-design-baseline.md` §16 (line 1295): ``nginx HA VIP                  10.10.90.10   (vpnz-dmzrev01 = 10.10.90.10 host addr 10.10.90.10/.11 pair per §5.7)``
- `sections\04-linux.md` §8.4.5 line 1511: *"the baseline records `vpnz-dmzrev01 = 10.10.90.10 (VIP 10.10.90.10)` … which is legal — a VRRP owner address — but it changes the failover semantics slightly"*

**Ruling.** The VIP is reserved and the two nodes get their own addresses. `10.10.90.10` is **the VRRP VIP only** — never a node address — so the failover test has an unambiguous signature: the VIP is present on exactly one node, is **absent from both nodes before** a `systemctl stop keepalived`, and appears on the new master afterwards.

```
nginx HA VIP (vrid 61)            10.10.90.10   # VIP ONLY — owned by no node
vpnz-dmzrev01                     10.10.90.28   # keepalived master (priority 150)
vpnz-dmzrev02                     10.10.90.29   # keepalived backup (priority 100)
```

**Why these numbers.** `.28`/`.29` are free, sit above the highest used DMZ octet (`vpnz-dmzjump01` `.27`), and do not collide with `vpnz-dmzweba01/02` (`.21`/`.22`), `vpnz-dmzwp01/02` (`.25`/`.26`) or `vpnz-dmzjump01` (`.27`), as required. Keeping `.10`/`.11` as the two node addresses and moving the VIP elsewhere was rejected because the VIP `10.10.90.10` is the DNAT target of `198.51.100.2`, the split-horizon answer for `portal`/`www`/`blog.vertexpeak.fyp.lab`, the target of `curl --resolve`, of the TLS test commands, of the `conntrack` sample and of the DMZ `nft` policy — moving the VIP would have touched far more text and broken the published-name plan. No hostname is invented.

**Consequence to state in the report.** The pair is now in ordinary (non-owner) VRRP mode: on the master, `ip -br a` shows **two** addresses on `ens192` (`.28` and the VIP `.10`); on the backup, **one** (`.29`). The §9.16 failure-mode entry that describes the VIP as an owner address is withdrawn.

**New facts (copy-paste-able).**
```
10.10.90.10     portal.vertexpeak.fyp.lab       www.vertexpeak.fyp.lab blog.vertexpeak.fyp.lab
10.10.90.10     # nginx VRRP VIP (vrid 61) — not a node address
10.10.90.28     vpnz-dmzrev01.vertexpeak.fyp.lab vpnz-dmzrev01
10.10.90.29     vpnz-dmzrev02.vertexpeak.fyp.lab vpnz-dmzrev02
keepalived vrid 61: vpnz-dmzrev01 priority 150 MASTER, vpnz-dmzrev02 priority 100 BACKUP
```

### C-03 — `LAN-ISP` defined two ways **[RATIFIED + RECONCILED]**

**Conflicting text.**
- `00-design-baseline.md` §4 VLAN table (line 231) and §16 (line 1321): `100  LAN-ISP          10.10.100.0/29  (transit block, + /30s at .4, .32, .36, .40)`
- `00-design-baseline.md` §5.2 (lines 285–289): five separate `/30` rows, `10.10.100.0/30`, `.4/30`, `.32/30`, `.36/30`, `.40/30`
- `sections\02-architecture.md` §6.6.3 line 654: *"Where the baseline's own VLAN summary prints the `LAN-ISP` block as `10.10.100.0/29`, the normative table above gives the individual `/30` link allocations that are actually configured; the discrepancy is recorded as a documentation correction rather than silently harmonised."*

**Ruling.** **Both are right about different objects, and the `/29` label was misleading.** The normative, configurable objects are the **five `/30` point-to-point links** — §5.2 is the normative table and stays as written. `10.10.100.0/29` is retained **only** as the name of a two-link container: the `10.10.100.0/29` bit-boundary holds exactly the first two `/30`s. The other three `/30`s are separate blocks and are **not** inside it.

**Mapping (normative).**
```
VLAN 100 LAN-ISP — link-level truth (each link is its own /30, no gateway, no DHCP)
  10.10.100.0/30   HQ edge gi0/0 10.10.100.1  <->  VP-ISP-EDGE-01 gi0/0 10.10.100.2   eBGP AS65001<->65000   [the only two links inside the /29]
  10.10.100.4/30   HQ edge        10.10.100.5  <->  VP-ISP-EDGE-01 gi0/1 10.10.100.6   backup provider leg
  10.10.100.32/30  HQ edge gi0/2  10.10.100.33 <->  VP-BR-EDGE-01  gi0/1 10.10.100.34  OSPF area 0 (WAN1)
  10.10.100.36/30  HQ edge gi0/3  10.10.100.37 <->  VP-MO-EDGE-01  gi0/1 10.10.100.38  EIGRP AS 100 boundary
  10.10.100.40/30  HQ edge        10.10.100.41 <->  VP-ISP-EDGE-01 gi0/2 10.10.100.42  eBGP AS65001<->65002
  Container name only: 10.10.100.0/29 = { 10.10.100.0/30, 10.10.100.4/30 }
  Do NOT read 10.10.100.0/29 as containing .32/.36/.40.
```
Two consequences to record: (1) the `10.10.100.4/30` link **is** addressed (`HQ edge 10.10.100.5`, `ISP edge 10.10.100.6`) — the baseline's §5.2 row already gives `.5 / .6`, so `sections\05-cisco.md`'s "not addressed in this build" note is superseded; (2) the §3.3 diagram annotation `(transit 10.10.100.0/29)` is corrected to the primary link `10.10.100.0/30` and the second session is added (see C-17).

### C-04 — Two different redistribution points named **[SUPERSEDED]**

**Conflicting text.**
- `00-design-baseline.md` §3.4 (line 183): *"Macau runs EIGRP AS 100 and its routes enter OSPF at `VP-HQ-CORE-01` through a single, explicitly numbered redistribution point, with route tags (`tag 100`)"*
- `00-design-baseline.md` §6 inventory row 1 (line 456): `| 1 | `VP-HQ-CORE-01` | HQ core L3 switch, OSPF ABR/redistribution point, HSRP active, …`
- `00-design-baseline.md` §11.3 (line 935) and §12.3 (line 1043) and §16 (line 1336): redistribution at `VP-HQ-EDGE-01` only.

**Ruling.** **`VP-HQ-EDGE-01` is the single redistribution point.** The two `VP-HQ-CORE-01` attributions in §3.4 and §6 are struck. This matches the contract clause §16 — *"Redistribution ONLY at VP-HQ-EDGE-01; route tags 100 (OSPF) and 200 (EIGRP); one direction per prefix set"* — and matches what all three affected writers (`02-architecture.md` §6.7.4, `05-cisco.md` §9.11.1, `08-project-management.md` §13.3.3/13.4) already implemented and, in one case, flagged as an unresolved contradiction.

**Loop-prevention consequence (normative statement).** Redistribution between OSPF and EIGRP occurs at exactly one router, `VP-HQ-EDGE-01`; it is tagged in both directions (`tag 100` for OSPF-originated prefixes, `tag 200` for EIGRP-originated prefixes) and is one-way **per prefix set**; no other router may carry a `redistribute` statement for the OSPF↔EIGRP pair. There is therefore no second path by which a prefix can cross the boundary and return, which is what makes an untagged round trip impossible; the tag is the secondary defence that makes any stray re-advertisement *detectable* in `show ip route` and in the OSPF database. A second redistribution point on the core pair would create an untagged mutual round trip and is the exact misconfiguration the project reproduces deliberately once, captures, and then repairs (`TC-L3-08`). `sections\05-cisco.md`'s ten-second check — `show run | include redistribute` on every router — is the operational control.

`VP-HQ-CORE-01` is **not** an OSPF ABR either: the design is a single OSPF area 0, so no router in it can be an area border router (see C-13).

### C-05 — Topology-diagram labels disagree with the §4 VLAN table **[RATIFIED]**

**Conflicting text.** `00-design-baseline.md` §3.3 (`### 3.3 HQ physical/logical topology`), lines 146, 155, 163–165 versus the §4 VLAN table, lines 222, 227, 228, 230.

**Ruling.** **The §4 VLAN table is normative.** The diagram in §3.3 is an illustration and must carry the §4 exact strings. Corrections required:

| Where | Rev 1.0 diagram text | Normative text |
|---|---|---|
| §3.3 line 146 | `(VLAN 90 DMZ 10.10.90.0/24)` and `(VLAN 60 SERVER 10.10.60.0/24)` | `(VLAN 90 DMZ-HQ 10.10.90.0/24)` and `(VLAN 60 SRV-HQ-2 10.10.60.0/24 — reserved, undeployed)` |
| §3.3 line 164 | `VLAN 20  MGMT    10.20.20.0/24 : hypervisor host, switch mgmt, VP-HQ-JUMP-02` | `VLAN 20  MGMT-OOB    10.20.20.0/24 : hypervisor host, switch mgmt, vpnz-jump01` |
| §3.3 line 165 | `VLAN 70  STUDENT 10.70.0.0/24  : isolated lab, no route off-segment except the jump box` | `VLAN 70  STUDENT-LAB 10.70.0.0/24  : isolated lab, no route off-segment except the lab console path` |

Two further corrections in the same block, ruling on the same principle (table wins): the VLAN 90 hosts are named as Packet Tracer placeholder names (`VP-HQ-WEB-01`, `VP-HQ-WEB-02`, `VP-HQ-WP-01/.02`, `VP-HQ-JUMP-01`) where the canonical VM hostnames are `vpnz-dmzweba01/02`, `vpnz-dmzwp01/02`, `vpnz-dmzjump01`; and the VLAN 10 core line must read `VLAN 10  LAN-HQ-CORE 10.10.10.0/24` (see C-18). Hostname-versus-VLAN mismatches inside the drawing are covered by C-18.

### C-06 — iSCSI target IQN cannot be set **[SUPERSEDED]**

**Conflicting text.**
- `00-design-baseline.md` §5.7 (line 370): ``| `vpnz-san01` | 10.10.80.21 | 80 | iSCSI target (`iqn.2026-01.lab.fyp.vertexpeak:storage-lun01/02/03`) |``
- `00-design-baseline.md` §16 (line 1398): ``iSCSI IQN                     iqn.2026-01.lab.fyp.vertexpeak:storage-lun01 (and -lun02, -lun03)``
- `sections\03-microsoft.md` §7.6.2 line 2032: *"The Microsoft iSCSI Target Server derives the target IQN from the server's own IQN plus the target name; it does **not** offer a parameter that sets the IQN to an arbitrary value such as `iqn.2026-01.lab.fyp.vertexpeak:storage-lun01`."*
- `sections\02-architecture.md` §6.10.1 line 824 already asserts the baseline string as the *target's* IQN: *"Three targets are published as `iqn.2026-01.lab.fyp.vertexpeak:storage-lun01`, `-lun02` and `-lun03`"*

**Ruling.** **The canonical string names the INITIATOR endpoint, not the target.** Microsoft's iSCSI Target Server derives its target IQN from the server IQN plus the target name and exposes no override, so the baseline string cannot be a target IQN. The writers' recommended option (Option 1 in `03-microsoft.md` §7.6.2) is adopted. The IQN namespace is per-endpoint, so both endpoints legitimately carry different strings, and the project-controlled string still appears in every configuration file the group writes.

**Exact resulting IQN values (copy-paste-able).**
```
Target  (vpnz-san01, Microsoft iSCSI Target Server — DERIVED, not settable):
  storage-lun01   iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target
  storage-lun02   iqn.1991-05.com.microsoft:vpnz-san01-storage-lun02.target
  storage-lun03   iqn.1991-05.com.microsoft:vpnz-san01-storage-lun03.target

Initiator (vpnz-dmzweba01 — the project-controlled endpoint; the canonical string):
  storage-lun01   iqn.2026-01.lab.fyp.vertexpeak:storage-lun01
  storage-lun02   iqn.2026-01.lab.fyp.vertexpeak:storage-lun02
  storage-lun03   iqn.2026-01.lab.fyp.vertexpeak:storage-lun03

Rule:           one shared suffix per LUN; the canonical string is the INITIATOR IQN.
Capture both:   Get-IscsiServerTarget    -> target IQN as it is actually on the wire
                Get-IscsiSession         -> InitiatorNodeAddress and TargetNodeAddress
```
The target-side IQN strings above are the values the platform derives from the target names fixed by the baseline (`storage-lun01/02/03` + hostname `vpnz-san01`) and must be **confirmed at build time** by `Get-IscsiServerTarget`; if the build derives a different string, the build log records the deviation and that derived string becomes the value every document uses. `sections\03-microsoft.md`'s variant `iqn.2026-01.lab.fyp.vertexpeak:dmzweba01` is superseded by the per-LUN form above so that the same string means the same endpoint in every file.

### C-07 — Missing addresses **[RATIFIED]**

**Baseline is silent.** `00-design-baseline.md` §6 inventory rows 25–26 give `vpnz-nft01/02` the NICs `VNET-EGRESS` + `VNET-WAN`; rows 27–28 give `vpnz-dmzrev01/02` the NICs `VNET-DMZ` + `VNET-CORE`. §5.7 assigns an address only for the primary NIC. `sections\04-linux.md` §8.2.4 flagged both gaps with `[ASSUMPTION]` and asked for a decision (`10.10.200.x` for the WAN NIC; `10.10.10.60/24` for the core NIC).

**Ruling.**

```
vpnz-nft01   VNET-WAN  (ens224)   10.10.200.2/24    # transport-segment address of the node
vpnz-nft02   VNET-WAN  (ens224)   10.10.200.3/24    # transport-segment address of the node
vpnz-dmzrev01 VNET-CORE (ens224)  10.10.10.28/24    # VLAN 10 LAN-HQ-CORE, management reachability only
vpnz-dmzrev02 VNET-CORE (ens224)  10.10.10.29/24    # VLAN 10 LAN-HQ-CORE, management reachability only
```
Both allocations are inside existing subnets and invent nothing:
- `10.10.200.0/24` (`VNET-WAN`) has only `.1` (wg0 tunnel address, floating with the nftables VIP), `.5` (`vpnz-wcwg01` / Wan Chai peer), `.64/26` (remote-worker pool), `.200`/`.201` (management escape hatch) allocated. `.2` and `.3` are free, and giving the two physical NICs distinct addresses keeps transport addressing and **tunnel** addressing separate — a physical address is not the same object as the `wg0` tunnel address that floats with the VIP.
- `10.10.10.0/24` (`VNET-CORE`) currently has only `.1`–`.3` allocated (core/edge SVIs); `.28`/`.29` mirror the DMZ pairing in C-02 and stay clear of the `.253`–`.254` reserved and virtual range. The `10.10.10.60` figure in `04-linux.md` is superseded.

**Constraint to state in the report (do not silently omit).** A `VNET-CORE` NIC places the reverse proxy in the VLAN 10 broadcast domain. This is **not** a policy bypass: the trust matrix (`TB-04`) is enforced at the ASA and at the nftables pair, and the DMZ nodes' default gateway is still the ASA DMZ interface `10.10.90.1`. The second NIC exists for management-plane reachability only, carries no published traffic, and must be named as such wherever the interface is listed.

### C-08 — Nginx status-exporter port `9113/tcp` **[RATIFIED]**

**Flagged text.** `sections\02-architecture.md` §6.9 monitoring table: ``| Nginx (proxy pair and content nodes) | Local status exporter reading `stub_status` | 9113/tcp [ASSUMPTION] | Connections, requests, upstream health |``

**Ruling.** **Confirmed: `9113/tcp` is correct and is now a baseline value.** Port `9113/tcp` is the default listen address of the standard nginx Prometheus exporter, which is precisely the "local exporter reading `stub_status`" this design uses, and the baseline already requires the exporter to be local and loopback-bound. The `[ASSUMPTION]` label is removed; no value is replaced.

```
nginx-prometheus-exporter listen address   9113/tcp   (baseline value, not an assumption)
scrape source                              vpnz-mon01 (Prometheus)
stub_status bind                           127.0.0.1:8080 only, never published (nginx side)
```
The baseline's port/protocol matrix (§10) should gain the row below at the next revision sweep (a new matrix row is *not* required for consistency today, because no existing row is wrong):
```
| P-36 | 9113/tcp | Nginx Prometheus exporter | vpnz-dmzrev01/02, vpnz-dmzwp01/02 | vpnz-mon01 → Z-DMZ | Fetched from Z-MGMT; the exporter's own bind is the host, the stub_status endpoint stays loopback-only |
```

### C-09 — Objective numbering collision **[SUPERSEDED in §13.9 only]**

**Conflicting text.**
- `sections\01-introduction.md` §2.2 (lines 544–557): the canonical objective set `O-1` … `O-14`.
- `sections\08-project-management.md` §13.9 (line 835 heading and rows 837–847): `| Obj. | …` with provisional keys `**O1**` … `**O11**`, self-flagged at line 833: *"[ASSUMPTION] The objective wording in this table is derived from the project's design baseline and its seven success criteria, because section 2 of the assembled proposal is authored by another writer … any renumbering there is a mechanical update to the objective column only — the design element, test IDs and evidence columns do not change."*

**Ruling.** **The canonical set is `O-1` … `O-14` as written in `01-introduction.md` §2.2.** The §13.9 keys `O1`…`O11` are superseded. The table's structure and its stability claim are honoured: only the objective column is re-keyed, and **every design-element, test-case and evidence cell stays byte-identical**.

**Re-keying of §13.9 (mechanical, one row at a time).**

| §13.9 row as written | becomes | Note |
|---|---|---|
| `**O1**` simulated enterprise topology, L2/L3, routing, perimeter | `**O-7**` | matches `O-7` (enterprise switching and interior routing) and `O-8` (exterior routing and perimeter security); do **not** split the row |
| `**O2**` single identity authority with least privilege | `**O-2**` | exact match |
| `**O3**` Windows network services | `**O-3**` | `O-3` (network services) + `O-4` (block storage and certificate-based remote access); do **not** split the row |
| `**O4**` Linux services | `**O-5**` | `O-5` (Nginx/Keepalived delivery) + `O-6` (nftables, OpenVPN, WireGuard); do **not** split the row |
| `**O5**` reviewed, repeatable, idempotent configuration | `**O-9**` | exact match |
| `**O6**` encrypted remote access and a site-to-site tunnel | `**O-6**` | tunnel half of `O-6`, plus `O-4`'s certificate-based remote access; do **not** split the row |
| `**O7**` zones and trust-boundary policy | `**O-1**`, `**O-7**`, `**O-12**` | the only row that spans three objectives; list all three in the single cell |
| `**O8**` monitoring, logging, traffic-analysis evidence | `**O-10**` | exact match |
| `**O9**` read-only agentic-AI proof of concept | `**O-11**` | exact match |
| `**O10**` project management, risk and change control | `**O-14**` | exact match |
| `**O11**` complete documentation and evidence set | `**O-13**` | exact match |

**Two objectives have no row and must be added** (new rows in the §13.9 table, placed in numeric order, with their own design-element, test-case and evidence cells):
- `**O-1**` *Design* — "Produce a complete, internally consistent design … frozen as a version-controlled design document by the end of week 2" → design element: the canonical baseline `00-design-baseline.md` Rev 1.0 + this Rev 1.1 addendum, §4 VLAN plan, §5 addressing plan, §6 inventory, §16 interface contract; tests: `TC-DOC-01`; evidence: `EV-0001`, `EV-0019`, the `integration\consistency-report.md` run and this addendum's own change record.
- `**O-12**` *Troubleshoot and verify* — "Execute the complete test plan …" → design element: the executed test plan of §13.3–13.5 including the deliberate misconfiguration, the rogue-DHCP test and one failover test per redundancy layer; tests: `TC-TS-01` plus every `TC-{LINE}-NN`; evidence: `06-verification\transcripts\`, `06-verification\` result files, `EV-0006`, `EV-0010`, `EV-0016`.

**Blanket rule for the whole proposal.** Nothing outside `01-introduction.md` §2.2 may define an objective. Any `O`-key that is not in the form `O-1`…`O-14` is either corrected to that form or, where it names an **open item** rather than an objective, corrected to the `O-0n` form, which is reserved for the baseline's §19 open-item register (`O-01`…`O-10`). Two known instances in `08-project-management.md` §14.9 are open-item confusions and are corrected in the patch list: `O10` → `O-14` (EV-0001), `O2` → `O-2` (EV-0005), `O1` → `O-2` (EV-0002), `O8` → `O-10` (EV-0014).

### C-10 — Evidence-ID range mismatch **[SUPERSEDED]**

**Conflicting text.**
- `sections\08-project-management.md` §13.8 (line 1088): ``| Evidence | `06-verification\transcripts\TC-L3-10_spanning-tree-before.txt` and `..._after.txt`; evidence IDs EV-0214 and EV-0215; `03-build\packet-tracer\01-l2l3-core.pkt` before and after |``
- `sections\08-project-management.md` §14.9 (lines 1138–1157) defines only the illustrative range `EV-0001` … `EV-0020`, and its rule column says ``| Evidence ID | Sequential `EV-nnnn`, never reused …``

**Ruling.** The illustrative range is the **whole project-wide block** and is not the total ID space; `EV-0214`/`EV-0215` were never defined anywhere and are corrected. The **block-allocation rule** is now:

```
Evidence-ID block allocation (normative)
  EV-0001 – EV-0099   project-wide and cross-cutting evidence, in creation order
                      (governance, environment, security sweeps, acceptance) — the §14.9 set
  EV-0100 – EV-0199   report chapter 1
  EV-0200 – EV-0299   report chapter 2
  ...
  EV-1700 – EV-1799   report chapter 17
  EV-2000 – EV-2099   cross-cutting verification and troubleshooting evidence that no single chapter owns
  The 100-block is a convenience, never a quota: an exhausted chapter continues into the next free block
  and the index records the overflow. An ID is never reused; a replaced file takes a new ID and the old row
  records the supersession (§14.9 rule, unchanged). Every cited ID must exist as a row in 07-evidence\INDEX.md.
```
The recalled `EV-0214`/`EV-0215` pair belongs to the spanning-tree / RSTP demonstration, which the `EV-` series in `08-project-management.md` does not otherwise own, so it is re-cited to two IDs in the **unused** project-wide block:
```
EV-0042   Packet Tracer `show spanning-tree` output before the deliberate link pull (RSTP topology change)   -> TC-FO-11
EV-0043   Packet Tracer `show spanning-tree` output after the link pull, showing the new root/alternate port -> TC-FO-11
```
Both are added to `07-evidence\INDEX.md` at the next index update; the citation in §13.8/`TC-FO-11` is corrected to `EV-0042`/`EV-0043`. **Stated plainly:** `EV-0214`/`EV-0215` are outside the range the citation claimed and had no index row; this is a citation defect, corrected, not a substantive change.

### C-11 — Open decisions written as option-pairs **[RATIFIED as formal open decisions]**

All three are recorded formally. Each carries the writers' recommendation, the decision point, and the consequence of taking the other branch. The design document must not read as self-contradictory: an option-pair appears **once**, in the form below, and nowhere else as an unresolved assertion.

**OD-01 — WireGuard branch-peer representation** (baseline §11.2 / §19 `O-04`; sections `02` §6.3, `04` §8.7, `08` §12.7/§20).
- *Question.* Is the Wan Chai WireGuard endpoint represented by a third Ubuntu guest `vpnz-wcwg01` (IPsec stays on the ASA for the Cisco-to-Cisco story), or is WireGuard reduced to the remote-worker pool with the branch tunnel carried by IPsec on the ASA alone?
- *Recommendation (already made and recorded as CR-04 in `08-project-management.md` §12.7, and implemented in `04-linux.md` §8.7):* **Option A — `vpnz-wcwg01`.** `vpnz-wcwg01`, 2 vCPU / 2 GB / 20 GB, `VNET-WAN`, inner address `10.10.200.5`, terminates WireGuard and plays the branch encrypting gateway. `VP-WC-EDGE-01` becomes a **Packet Tracer representation only**: it terminates the **IPsec IKEv2 site-to-site tunnel** (`IPSEC-HQ-WC`, UDP 500/4500, `198.51.100.1` ↔ `203.0.113.5`), carries BGP AS 65021, OSPF/EIGRP history and the Wan Chai LAN/VLAN presence — and it **never terminates WireGuard**, because a Cisco IOS device cannot.
- *Decision point.* End of week 6 (gate G-P4 partial / `M6.3`), recorded in the decision log as `CR-04`; the fourth guest is not part of the nineteen-VM count and is shut down outside tunnel tests.
- *Impact if the other branch (Option B) is taken:* WireGuard becomes remote-access-only; `WG-HQ-WC` is deleted as a site-to-site tunnel; `vpnz-wcwg01` is not built; the host resource budget loses one guest; `IPSEC-HQ-WC` is upgraded from "optional transport for VLAN 131 only" to the branch's only tunnel, so its test set grows and its IPsec evidence becomes a must-band item; the tunnel-comparison section loses a like-for-like comparison and must state that it compares IPsec-site-to-site against WireGuard-remote-access instead; `04-linux.md` §8.7's `wg0` `AllowedIPs = 10.10.130.0/24, 10.10.131.0/24` peer block, §8.7.6's handshake test, failure mode T-13/T-14 and `02-architecture.md` Figure 6.4's WireGuard line all change.

**OD-02 — DMZ domain membership** (baseline §19 `O-05`; sections `03` §7.11 (`GPO-SRV-DMZ-Baseline`), `05` §9.12, `08` week W7).
- *Question.* Are the DMZ guests (`vpnz-dmzweba01/02`, `vpnz-dmzwp01/02`, `vpnz-dmzrev01/02`, `vpnz-dmzjump01`) domain-joined, or workgroup-isolated with a local account model and anonymous/LDAPS-only directory access?
- *Recommendation (writers' position, and the stronger security answer):* **workgroup-isolated for the published web tier**, with `vpnz-dmzweba01/02` operating under `GPO-SRV-DMZ-Baseline`-equivalent local policy and directory read via LDAP/LDAPS only through the single service account `svc_ldapbind` (`GG-DMZ-LDAP-Readers`). If the group prefers domain join for manageability, `GPO-SRV-DMZ-Baseline` and the `OU=DMZ-Servers` OU already exist and are the supported path.
- *Decision point.* End of week 7 (gate before `M7.1`/`M7.2`), recorded in the decision log as `O-05`.
- *Impact if the other branch is taken:* a joined DMZ forces GPO scope changes (`GPO-SRV-DMZ-Baseline` must be linked and its "deny access from the network" / inbound-firewall allow-list settings re-verified against `TB-15`), it makes `TB-04`'s "DMZ must never initiate toward the internal network" a *per-host* obligation instead of a network fact, it adds a domain-authentication dependency for the published tier (a DC outage then reaches the portal), and the CRL/AIA reachability problem already flagged in `03-microsoft.md` §7.4 becomes a hard requirement rather than a design choice.

**OD-03 — PKI tiering** (baseline §5.7 `vpnz-pki01` row, §8.5, §19 `O-06`; section `03` §7.4; `08` week W7 `M7.2`).
- *Question.* Two-tier (`VP-ROOT-CA` offline → `VP-ISSUING-CA-01` online) with the optional `vpnz-pki01` (10.10.30.15) as the issuing CA, or single-tier (`vpnz-dc01` issues directly, no `VP-ROOT-CA`)?
- *Recommendation (writers' position):* **two-tier, `VP-ROOT-CA` → `VP-ISSUING-CA-01`**, because AD CS auto-enrolment is what lets the project satisfy the prohibition on shared passwords at scale, and the two-tier model is what makes the offline root a defensible design statement. If the schedule slips, the acceptable fallback is **single-tier with the deviation recorded in one plain sentence** (`VP-ISSUING-CA-01` on `vpnz-dc01`, no `VP-ROOT-CA`, `vpnz-pki01` not built).
- *Decision point.* End of week 7, recorded in the decision log as `O-06`; `vpnz-pki01` stays unallocated until the decision is taken.
- *Impact if single-tier is taken:* `VP-ROOT-CA` disappears from every certificate-chain statement; the root/issuing lifetime rules in §8.5 collapse to one; `03-microsoft.md`'s offline-root custody evidence, the "root is offline" claim and any CRL/AIA chain diagram change; one fewer VM (the optional twentieth); the PKI row of the traceability matrix changes its justification wording. **Impact if the two-tier model is kept but `vpnz-pki01` is not deployed:** the issuing CA runs on `vpnz-dc01` and that must be stated, because a DC hosting the issuing CA is a bigger blast radius than a separate host.

### C-12 — Packet Tracer `.pkt` filename duplication **[RATIFIED]**

**Conflicting/normative text.** `00-design-baseline.md` §8.6 repository tree (line 663): `│   ├── packet-tracer\  (.pkt files: 01-l2l3-core, 02-wan-routing, 03-asa-perimeter, 04-voice, 05-full)`; §12.3 (line 1042): the same five with `.pkt`; §16 PATHS (line 1363): `packet tracer projects      C:\FYP\03-build\packet-tracer\   (01-l2l3-core.pkt ... 05-full.pkt)` → **the range is listed twice, once without the extension and once as a range**. `sections\08-project-management.md` §12.3 tree (line 942) repeats the parenthetical form and §Appendix E (line 385) says "Five files show the build stages".

**Ruling.** One normative list, five files, listed **in full exactly once per repository-tree occurrence** — never as a range, never twice in the same listing, always with the `.pkt` extension:

```
C:\FYP\03-build\packet-tracer\
  01-l2l3-core.pkt
  02-wan-routing.pkt
  03-asa-perimeter.pkt
  04-voice.pkt
  05-full.pkt          <- the deliverable topology; the other four are build-stage evidence
```
Corrected listing form for any repository tree that shows the directory on one line:
```
│   ├── packet-tracer\  (01-l2l3-core.pkt, 02-wan-routing.pkt, 03-asa-perimeter.pkt, 04-voice.pkt, 05-full.pkt)
```
The range notation `01-l2l3-core.pkt ... 05-full.pkt` is retained **only** in the §16 PATHS contract line, where it is a summary of a path contract rather than a repository listing; within it the byte-final form is `C:\FYP\03-build\packet-tracer\   (01-l2l3-core.pkt, 02-wan-routing.pkt, 03-asa-perimeter.pkt, 04-voice.pkt, 05-full.pkt; 05-full.pkt is the deliverable)`. See also C-22, which confirms the same five names and forbids a sixth.

## 3. Rulings C-13 … C-24 (second wave)

Three of these are merged into a single ruling because one decision settles them: **C-13 + C-14 + C-19 are all "the routing/switching layer is single-domain and the §4 table plus §16 win over prose"**, ruled separately below for auditability but decided on one principle. **C-16 is merged into C-11/OD-01** and is not re-argued. **C-18 is merged with C-05** (same diagram-versus-table defect) and is ruled separately because it also governs hostname/zone collisions.

### C-13 — OSPF `area range` is inert **[SUPERSEDED, single-area confirmed]**

**Conflicting text.**
- `00-design-baseline.md` §3.3 (line 174): `    |  OSPF area 0 area-range              |  BGP AS 65021 (small)          |  EIGRP AS 100`
- `00-design-baseline.md` §3.4 (line 173 of the Kwun Tong box): `    |  OSPF area 0 area-range              |`
- `00-design-baseline.md` §11.3 (line 934): ``| OSPF | **COVERED** | Single area 0 at HQ + Kwun Tong; …`` and (line 940) ``| OSPF *advanced* (multi-area beyond one ABR, NSSA/stub tuning, OSPFv3, MPLS) | **NOT COVERED** | Single area 0 only. Stated honestly |``
- `sections\05-cisco.md` §9.10 line 812: *"One area (area 0) … the trade-off is stated: a single area means no inter-area summarisation and no topology hiding"*, and §9.10 line 1038: *"**no Type-3 or Type-4 LSAs exist**, which proves the single-area design"*.

**Ruling.** **The design is single-area.** `area range` is an ABR-only command and would do nothing here, and the presence of `area range` in the drawing contradicts §11.3, §16 and the implementation. **The §3.3/§3.4 phrases `OSPF area 0 area-range` are struck**; §11.3, §12.3, §16 and the implementation stand unchanged (therefore zero downstream section edits for C-13 beyond the two baseline phrases and the `VP-HQ-CORE-01` ABR label already removed by C-04).

**Normative statement to carry instead, in both places:**
```
Kwun Tong (BR) — OSPF area 0, no area range, no ABR: HQ and Kwun Tong share one area 0,
so no inter-area summarisation exists; Branch /24s are advertised as normal area-0 prefixes
and appear as intra-area (O) routes everywhere, with metrics tuned by interface cost only.
```
`area range` may not appear in any configuration in this design; it is a multi-area feature and multi-area OSPF is a declared `NOT COVERED` item. If the group ever adds a second area, that is a baseline revision, not a writer's choice.

### C-14 — HSRP group count contradicts the VIP list **[RATIFIED]**

**Conflicting text.**
- `00-design-baseline.md` §4.1 (line 250): ``- **HSRP** is used for IPv4 gateway redundancy in the HQ access layer … group 1, virtual MAC `0000.0c07.ac01`.``
- `00-design-baseline.md` §4.1 (line 251): ``- VIP summary: VLAN 30 = `10.10.30.254`, VLAN 40 = `10.10.40.254`, VLAN 70 = `10.70.0.254`, VLAN 80 = `10.10.80.254`.``
- `00-design-baseline.md` §16 (line 1337): `First-hop redundancy          HSRP (switch SVIs, group 1, active priority 150) | VRRP via Keepalived`
- Implementation already written: `sections\05-cisco.md` §9.7 line 719 (`| Group numbers | 1→VLAN 30, 2→40, 3→70, 4→80 | …`), line 665 (`**[ASSUMPTION]** until confirmed from `show standby``), line 2446 (`F-L3-02` baseline-defect entry); `sections\08-project-management.md` §13.3.3 `TC-L3-09`.

**Ruling.** **One HSRP group per SVI is correct; the writer's four-group mapping is RATIFIED and is no longer an `[ASSUMPTION]`.** A single group cannot serve four SVIs — one virtual MAC cannot answer for four subnets, and the failover semantics would be undefined. Group 1 keeps the baseline's fixed virtual MAC `0000.0c07.ac01` exactly, and the derived MACs follow the HSRPv1 formula `0000.0c07.acXX` with XX the group number in hex.

```
HSRP group 1 -> VLAN 30 SRV-HQ-1     virtual MAC 0000.0c07.ac01   VIP 10.10.30.254
HSRP group 2 -> VLAN 40 USER-HQ-STF  virtual MAC 0000.0c07.ac02   VIP 10.10.40.254
HSRP group 3 -> VLAN 70 STUDENT-LAB  virtual MAC 0000.0c07.ac03   VIP 10.70.0.254
HSRP group 4 -> VLAN 80 STORAGE-HQ   virtual MAC 0000.0c07.ac04   VIP 10.10.80.254
Active: VP-HQ-CORE-01, priority 150, preempt delay minimum 30, timers 1 3, MD5 authentication
Standby: VP-HQ-CORE-02, priority 100
Virtual MAC formula: HSRPv1 0000.0c07.acXX (XX = group in hex); HSRPv2 (0000.0c9f.fXXX) is NOT used
Reserved and unchanged: VLAN 30 VIP 10.10.30.254, VLAN 40 VIP 10.10.40.254,
                        VLAN 70 VIP 10.70.0.254, VLAN 80 VIP 10.10.80.254
```
Affected sections and where they must change: `05-cisco.md` line 665 (drop the `[ASSUMPTION]` label; keep the mapping) and line 2446 (`F-L3-02` is now a **closed** baseline defect, not an open one); `02-architecture.md` §6.8.1 line 728 (*"One group, group 1, spans the headquarters server, user, lab and storage segments"* → four groups, one per SVI) and Figure 6.7 line 756 (`HSRP group 1 — virtual MAC 0000.0c07.ac01 — VIPs 10.10.30.254 / …` → four diamonds/labels, listed per group); `08-project-management.md` §13.3.3 `TC-L3-09` line 605 and §Appendix A line 1797 and §14 Appendix line 2015; `01-introduction.md` is not affected.

### C-15 — ASA outside default next hop **[RATIFIED]**

**Conflicting text.**
- `00-design-baseline.md` §5.2 (line 300): `| 198.51.100.0/29 | — | 198.51.100.1 (ASA outside) | .1 | .6 | .7 | No | Public DMZ pool |`
- `00-design-baseline.md` §5.5 (lines 342, 346–347): `VP-HQ-EDGE-01 … gi0/1 = 192.0.2.2/30`, `VP-WC-EDGE-01 … outside = 203.0.113.5/29`, `VP-ISP-EDGE-01 … 192.0.2.1/30`
- Implementation: `sections\05-cisco.md` §9.12.2 line 1671 `route outside 0.0.0.0 0.0.0.0 198.51.100.6 1`

**Ruling.** **Confirmed: the ASA outside default route points at `198.51.100.6`.** The ASA outside interface is `198.51.100.1/29` on the same `198.51.100.0/29` segment as the simulated provider edge, whose on-segment address is `.6`; `.1` is the ASA's own address, not a next hop, and `.5` is the public address mapped to the nftables VIP (a NAT object, never a routing next hop). `203.0.113.5` is `VP-WC-EDGE-01`, a remote tunnel peer reachable only *through* the crypto tunnel — it can never be a default next hop for cleartext traffic. `192.0.2.x` is the simulated Internet core, reached *behind* the provider edge, so it is likewise not a next hop.

```
VP-HQ-FW-01 outside interface       198.51.100.1 255.255.255.248   (security level 0)
ASA outside default route           route outside 0.0.0.0 0.0.0.0 198.51.100.6 1
Provider edge on-segment address    198.51.100.6                       (VP-ISP-EDGE-01)
198.51.100.5                        public address mapped (NAT) to 10.10.50.10 — never a next hop
203.0.113.5                         VP-WC-EDGE-01, reached only inside IPSEC-HQ-WC — never a next hop
```
Add the missing baseline row the implementation already assumes (base the addition on §5.5, which is silent for the provider edge's outside-segment address):
```
| `VP-ISP-EDGE-01` | 10.255.0.61/32 | outside = 198.51.100.6/29; 192.0.2.1/30; 10.10.100.2/30; 10.10.100.42/30 | ASA outside; Internet core; HQ edge (both BGP sessions) |
```

### C-16 — WireGuard termination on a Cisco device **[MERGED into C-11 / OD-01; no separate ruling]**

`00-design-baseline.md` §5.4 lists `WG-HQ-WC` endpoint B as `VP-WC-EDGE-01 outside 203.0.113.5`, while §11.2 already states the Cisco limitation and offers the two options. **This is the same conflict as C-11/OD-01 and is settled by that ruling:** the design takes **Option A** (`vpnz-wcwg01` terminates the WireGuard tunnel), and **`VP-WC-EDGE-01` terminates the IPsec IKEv2 site-to-site tunnel only** (`IPSEC-HQ-WC`, UDP 500/4500 ↔ `198.51.100.1`, crypto ACL `VLAN 131`). No document may state or imply that a Cisco device terminates WireGuard; §5.4's Endpoint B cell is corrected to `vpnz-wcwg01` (`10.10.200.5`, presented at the HQ end as `203.0.113.2:443`) with the Wan Chai public address `203.0.113.5` retained as the **IPsec** peer and as the branch's own public presence.

### C-17 — eBGP session count contradicts the topology drawing **[SUPERSEDED in the drawing]**

**Conflicting text.**
- `00-design-baseline.md` §3.3 (line 138): `                            (transit 10.10.100.0/29)  eBGP AS 65001 <-> AS 65000` — **one** session drawn.
- `00-design-baseline.md` §5.2 (line 289): `| 10.10.100.40/30 | 100 | — | .41 / .42 | — | .43 | No | HQ edge ↔ ISP alternate peer (second BGP session) |`
- `00-design-baseline.md` §5.5 (line 347): `VP-ISP-EDGE-01 … 10.10.100.42/30`
- `00-design-baseline.md` §12.3 (line 1044): `BGP: AS 65001 (Vertex Peak), AS 65000 (primary provider), AS 65002 (alternate provider), AS 65021 (Wan Chai, small)`
- Implementation: `sections\05-cisco.md` §9.11.3 — two sessions, `neighbor 10.10.100.2` and `neighbor 10.10.100.41`, `local-preference` 200/100, AS-path prepending, `show ip bgp summary` with both Established.

**Ruling.** **Two eBGP sessions are correct; the drawing is wrong.** The addressing (§5.2), the loopback table (§5.5), §12.3 and the implementation all agree on two sessions, so the §3.3 one-line annotation is corrected and nothing else changes.

```
Corrected §3.3 annotation:
                            (primary transit 10.10.100.0/30)  eBGP AS 65001 <-> AS 65000
                            (alternate peer 10.10.100.40/30)  eBGP AS 65001 <-> AS 65002
Sessions and policy (normative):
  Session 1  VP-HQ-EDGE-01 gi0/0 10.10.100.1  <->  VP-ISP-EDGE-01 gi0/0 10.10.100.2   remote-as 65000  local-preference 200  (preferred outbound)
  Session 2  VP-HQ-EDGE-01       10.10.100.41 <->  VP-ISP-EDGE-01 gi0/2 10.10.100.42  remote-as 65002  local-preference 100  + AS-path prepend outbound (secondary inbound)
  Both sessions terminate on the same simulated device; the report must say so and must NOT claim two physical providers.
  Announced set: exactly two prefixes (the portal/publication range and the tunnel/WAN peer range). No 10.10.x.x/10.20.20.x/10.70.x.x may ever be advertised.
```

### C-18 — VLAN 60 and VLAN 90 dual roles, and DMZ host octets **[RATIFIED, merged with C-05]**

**Conflicting text.** `00-design-baseline.md` §3.3 lines 146, 150–153 (`VLAN 60 SERVER 10.10.60.0/24` hosting `VP-HQ-DC-01/.02`, `VP-HQ-FS-01`, `VP-HQ-MON-01`; `VLAN 90 DMZ 10.10.90.0/24` hosting `VP-HQ-WEB-01 .21`, `VP-HQ-WEB-02 .22`, `VP-HQ-WP-01/.02 .25/.26`, `VP-HQ-JUMP-01 .27`) versus §4 lines 227, 230 (`60 SRV-HQ-2 … Reserved; documented as growth space, nothing is deployed in it`; `90 DMZ-HQ … Access to VP-HQ-FW-01 DMZ port; not trunked to any user switch`) and §5.7 lines 379–383.

**Ruling.** The §4/§5 reading is normative, and the drawing contains an arithmetic error that produced the apparent collision.

1. **VLAN 30 `SRV-HQ-1` (`10.10.30.0/24`) hosts the Windows server estate**: `vpnz-dc01` `10.10.30.11`, `vpnz-dc02` `10.10.30.12`, `vpnz-fs01` `10.10.30.21`, `vpnz-san01` `10.10.80.21` (VLAN 80), `vpnz-rras01` `10.10.30.41`, `vpnz-lnxra01` `10.10.30.42`, `vpnz-mon01` `10.10.30.31`, `vpnz-ai01` `10.10.30.51`, optional `vpnz-pki01` `10.10.30.15`. **The octal values in the drawing are correct for these hosts** (`.11`/`.12`/`.21`); only their VLAN label was wrong. So the drawing's `VLAN 60 SERVER` label is corrected to `VLAN 30 SRV-HQ-1` and its hostname list is corrected to the canonical `vpnz-*` names.
2. **VLAN 60 `SRV-HQ-2` (`10.10.60.0/24`) stays reserved and undeployed.** It is trunked (cores ↔ `VP-HQ-DSW-A04`) so the VLAN exists, and it has **no** access host and no SVI host address other than `10.10.60.1`. Nothing may migrate into it without a baseline revision.
3. **VLAN 90 `DMZ-HQ` hosts the DMZ estate**, and the `10.10.90.21/.22/.25/.26` octets belong to `vpnz-dmzweba01/.02` and `vpnz-dmzwp01/.02` in **that** VLAN. The apparent "collision" is the drawing's mislabelling, not an addressing conflict: no address is duplicated between two VLANs. The DMZ list is `vpnz-dmzrev01` `10.10.90.28`, `vpnz-dmzrev02` `10.10.90.29` (per C-02), `vpnz-dmzweba01` `.21`, `vpnz-dmzweba02` `.22`, `vpnz-dmzwp01` `.25`, `vpnz-dmzwp02` `.26`, `vpnz-dmzjump01` `.27`.
4. **Zone versus naming.** The drawing used Packet Tracer-style `VP-HQ-*` names for hosts that are **virtual machines**, which violates the §16 hostnames block. Every host in a VM role carries its canonical `vpnz-*` name; `VP-HQ-*` names are reserved for the sixteen Packet Tracer logical devices. VLAN 90 is reached by an **access port on `VP-HQ-DSW-A04`** for the ASA DMZ interface, plus a trunk to the cores carrying VLAN 90 (see C-19); the ASA remains the DMZ default gateway at `10.10.90.1` and no SVI for VLAN 90 exists on either core.

### C-19 — `VP-HQ-DSW-A03` trunking statement **[RATIFIED — wording clarified, no design change]**

**Conflicting text.**
- `00-design-baseline.md` §4 VLAN table, VLAN 20 cell (line 222): ``| 20 | `MGMT-OOB` | HQ | … | Access to `VP-HQ-DSW-A03`; no trunk to user access switches |``
- `00-design-baseline.md` §4 VLAN discipline rules (line 246): `4. Trunks are only between `CORE-01/02`, cores↔access switches, cores↔edge router, cores↔ASA, and cores↔`VP-BR-EDGE-01`.`
- Implementation: `sections\05-cisco.md` §9.4.2 line 213 — `VP-HQ-DSW-A03` `gi0/1`/`gi0/2` **are trunks** to `CORE-01`/`CORE-02`, allowed `10,20,70,999`.

**Ruling.** The two statements are not in conflict once read precisely, and **the design does not change**: the phrase "no trunk to user access switches" restricts where VLAN 20 may reach, not whether A03 may be trunked. Rule 4 already requires cores↔access-switch trunks, and HSRP for VLAN 20 and OSPF both need them. The wording is clarified so a reader cannot read it as forbidding the required uplinks.

```
Normative wording (replaces "Access to VP-HQ-DSW-A03; no trunk to user access switches"):
  Access to VP-HQ-DSW-A03 (trunked to both cores per rule 4); VLAN 20 is not trunked
  to any user-facing access switch (A01/A02)
```
Consequence for the record: `VP-HQ-DSW-A03`'s uplinks are trunks carrying `10,20,70,999` only, A03 is the only switch carrying VLAN 20, and `VP-HQ-DSW-A04` carries the server/storage/egress/voice/VLAN 90/DMZ set. No port-budget change (see C-23).

### C-20 — VPN front-door NAT ownership **[RATIFIED]**

**Conflicting text.**
- `00-design-baseline.md` §5.6 (line 359): `| 198.51.100.5 | UDP 443 WireGuard / UDP 500,4500 IKEv2 / UDP 1194 OpenVPN | `10.10.50.10` (nftables VIP) → `vpnz-rras01`, `vpnz-lnxra01` per port forwarding |`
- `sections\04-linux.md` §8.6 line 2447: ``| Reachability | published address `198.51.100.5`, DNAT'd by the nftables pair to `10.10.30.42:1194` … |``
- Implementation: `sections\05-cisco.md` §9.12.3 lines 1856–1860 — the ASA performs `nat (inside,outside) static 198.51.100.5 service udp 443/1194/isakmp/4500` to the nftables VIP, and the comment on line 1846 *"these direct mappings exist only for the test…"*.

**Ruling.** **The ASA owns the first translation; the nftables pair owns the second.** Two translations, two owners, one direction each — stated once as a rule and never left to inference:

```
Hop 1 (owner: ASA VP-HQ-FW-01):  static PAT 198.51.100.5 to 10.10.50.10, per port only:
                                 udp 443 (WireGuard), udp 500+4500 (IKEv2), udp 1194 (OpenVPN)
Hop 2 (owner: nftables pair, on VIP 10.10.50.10): DNAT to the terminating host:
                                 udp 500/4500 -> vpnz-rras01 10.10.30.41
                                 udp 1194     -> vpnz-lnxra01 10.10.30.42
                                 udp 443      -> stays on the pair (wg0 terminates there) and to vpnz-wcwg01's peer
Return path:                     nftables un-DNAT, then ASA un-PAT; no masquerade on tunnel traffic (NAT exemption holds)
The nftables VIP is a routing/VRRP object AND a DNAT target; it is NOT "the published address", and no document may
    describe 10.10.50.10 as the Internet-facing address, nor 198.51.100.5 as DNAT'd to a host address directly.
```
`sections\04-linux.md`'s phrasing that the pair "DNAT's the published address to `10.10.30.42:1194`" is corrected to name the second hop only, so that it does not imply the pair owns the public address.

### C-21 — IKEv2 RAS pool uses forbidden space **[SUPERSEDED]**

**Conflicting text.**
- `00-design-baseline.md` §5.4 (line 331): `| `IKEV2-RAS-POOL` | RRAS IKEv2 remote access | … | `10.10.201.0/24`, static pool `10.10.201.10 – 10.10.201.200` | …`
- `00-design-baseline.md` §5.3 (line 320): `| `SCOPE-REMOTE-IKEV2` | 172.16.0.0/24 | **Not allocated — do not create** | — | — | — | The RRAS IKEv2 pool uses its own range; see §5.4 |`
- `00-design-baseline.md` §5.1 (line 270) and the banned-string list (line 1429): `| `172.16.0.0/16` | **Not allocated.** Reserved head-room for future branch growth | Must not appear in any config in this baseline |` / `172.16.0.0/16 (reserved head-room, unallocated)`

**Ruling.** **`10.10.201.0/24` is the single IKEv2 RAS pool** (`10.10.201.10 – 10.10.201.200`, static, non-DHCP, certificate-based only). The `172.16.0.0/24` scope row is not merely "not created" — it contradicts §5.1 and the banned-string list, and **it is deleted from the DHCP scope table**; the row is not renumbered or replaced, because an IKEv2 RAS pool is never a DHCP scope. `172.16.0.0/16` stays unallocated head-room and must not appear in any configuration **except** as the prohibited example in the baseline's own banned-string list and in section prose that names it as prohibited, and in a `deny`-style policy statement that explicitly forbids it. Every other mention of the IKEv2 pool already reads `10.10.201.0/24` (`02-architecture.md` §6.6.5, `03-microsoft.md` §7.5, `08-project-management.md` Appendix A row `10.10.201.0/24`) and needs no change.

```
DHCP scopes served by the AD-integrated DHCP role: SCOPE-HQ-USER-STF, SCOPE-HQ-VOICE, SCOPE-HQ-LAB,
  SCOPE-BR-SALES, SCOPE-BR-STAFF, SCOPE-BR-VOICE, SCOPE-MO-LAN, SCOPE-MO-VOICE, SCOPE-WC-LAN, SCOPE-WC-DEV.
RRAS IKEv2 remote-access pool: 10.10.201.0/24, static assignment 10.10.201.10 – 10.10.201.200 — NOT a DHCP scope.
OpenVPN pool: 10.10.202.0/24, 10.10.202.10 – 10.10.202.120. WireGuard pools: 10.10.200.0/24 (site), .64/26 (remote).
172.16.0.0/16: unallocated head-room. There is no DHCP scope, VPN pool, VLAN or interface in it.
```

### C-22 — Packet Tracer `.pkt` filenames must stay in step **[RATIFIED — merged with C-12]**

**Text.** `00-design-baseline.md` §8.6 line 663 and §12.3 line 1042 list the five files; §16 line 1363 lists them as a range. `sections\08-project-management.md` §12.3 tree line 942 and §Appendix E line 385 agree on five.

**Ruling.** **One normative list: `01-l2l3-core.pkt`, `02-wan-routing.pkt`, `03-asa-perimeter.pkt`, `04-voice.pkt`, `05-full.pkt`** (see C-12 for the corrected listing form). Both sections and every tree listing must match it exactly, extension included; `05-full.pkt` is the deliverable and the other four are build-stage evidence; **no sixth project file may be added** without a baseline revision, and the `S`-numbered build stages implied by §17's weekly schedule (`01-l2l3-core.pkt` in week 2, `02-wan-routing.pkt` in week 3, `03-asa-perimeter.pkt` in week 5/7, `04-voice.pkt` and `05-full.pkt` in week 10) are the only files in that sequence. `.pkt` files are committed to Git as evidence (§13.2 `PT-10`), so a renamed file breaks the evidence index.

### C-23 — Switch port budget unstated **[RATIFIED — budget added]**

**Text.** `00-design-baseline.md` §4 rule (line 245): `2. Every unused access port is assigned to VLAN 999 and shut down.` §6 rows 3–6 give `VP-HQ-DSW-A01..A04` a NIC column of `24` each. No nominal port budget is stated, so `sections\05-cisco.md` §9.4.2's per-switch port ranges were a design choice.

**Ruling.** The budget is **now stated in the baseline**, so the section's ranges are no longer an unlabelled assumption. A 24-port switch has **24 access-capable ports**; two are consumed as core uplinks, leaving **22 access ports** per HQ switch (the uplinks are logical trunk ports drawn in the same 24-port budget in the simulator, which is what the section already assumes).

```
Per-switch port budget (normative):
  VP-HQ-DSW-A01..A04  24 ports total; 2 ports (gi0/1, gi0/2) trunked to VP-HQ-CORE-01/02; 22 access ports
  VP-BR-DSW-A01, VP-MO-DSW-A01, VP-WC-DSW-A01  24 ports total; 1 uplink to the site router; 23 access ports
  Every port not carrying a named device is assigned to VLAN 999 UNUSED-BLACKHOLE and shut down;
  each switch records its port-to-device map in its build runbook, and the count of shut ports is evidence.
```
`sections\05-cisco.md` keeps its per-switch ranges and **drops the implied assumption label**; it must additionally state which of its 22/23 ports remain unused and shut, because §4 rule 2 makes that a compliance item rather than an omission.

### C-24 — Citation-attribution defect **[SUPERSEDED]**

**Conflicting text.**
- `00-design-baseline.md` §14.1 row S1 (line 1170): *"…and its 131 requirement lines were machine-extracted and re-verified verbatim against the raw HTML."* — the sentence attaches the extraction to the **standard's own page** with no attribution to the pack, and §23 line 23 and §11.6 line 968 attribute the verification to *"a verified research pack"* while the surrounding narrative credits an earlier agent's summary.
- `research\wsos-2026-2447.md` §2.1 (lines 71–83): explicitly reviews *"the earlier agent's 2024 numbers"* — the weightings are **CORRECT and identical for 2026**, but *"the earlier agent's scope conclusion was incomplete"*, and §7 item **C1** is a *"CORRECTION (significant): Domain 5 lost Python, YANG, RESTCONF and NETCONF in 2026"*.
- `research\wsos-2026-2447.md` §3.7 (line 338) and Appendix A (lines 900–901) carry the authoritative census: `131` requirement lines, `0 mismatches`.

**Ruling.** The **census of record is the research pack's own §3.7 census and its Appendix A audit row** (`1 Work organization and management … 23`, `2 … 12`, `3 … 20`, `4 … 46`, `5 … 11`, `6 … 19`, total `131`; re-verification `0 mismatches`). The claim must be attributed to *"the project's own research pack `proposal\research\wsos-2026-2447.md`, Section 3.7 and Appendix A"* — **never** to an earlier agent's summary, and never presented as a property of the WorldSkills page itself. Where the pack **corrects** the earlier agent, the correction must be carried, not the superseded conclusion: in particular, Domain 5's 2026 text **no longer** contains Python, YANG, RESTCONF or NETCONF (pack §7 C1), and the "no AI content at all" finding is a pack finding (§7 C4), not a page-supplied statement.

**Instances to correct:**
- `00-design-baseline.md` §14.1 S1 (line 1170) and §23 authoring note (line 23) → attribute to the pack's census and say the pack also records corrections (C1–C6) to an earlier review.
- `sections\02-architecture.md` §6.1 opening (line 3): *"Every statement about the standard is taken from the verified extraction held in this repository (`proposal\research\wsos-2026-2447.md`), which machine-extracted 131 requirement lines from the published page and re-verified each one verbatim."* → attribute to **the pack's §3.7 census / Appendix A audit row**, and add that the pack also carries the corrections C1–C6 (notably C1: Domain 5 lost Python/YANG/RESTCONF/NETCONF for 2026).
- `sections\01-introduction.md` (lines 501, 901, 926, 935): the "131 requirement lines" figures are **correct** and stay, but the sentence must attribute the count to the pack's census (`proposal\research\wsos-2026-2447.md` §3.7 / Appendix A) and must not attribute extraction to the standard's page.
- `sections\08-project-management.md` §19.2 row S1 (line 1539) and row S3 (line 1541): the S1 sentence *"retrieved and verified by the project's own research pack, which records … and which machine-extracted its 131 requirement lines and re-verified them verbatim against the raw page with zero mismatches"* is **substantially correct** and stays, with the census rows cited explicitly (`§3.7` and `Appendix A`) and one added clause: the pack also contains a corrections section (`§7`, items C1–C6) that supersedes the earlier review it examined. S3 already names the pack as "the citation of record" and needs no change.

**Stated check performed for this ruling:** the only occurrences of the "131 / 0 mismatches" claim in the eight section files are `01-introduction.md` (lines 501, 901, 926, 935), `02-architecture.md` (line 3) and `08-project-management.md` (line 1539). No occurrence attributes the extraction to a **named individual** other than implicitly; all attribute it to *"the project's own research pack"*, which is the correct owner once the pack's own §3.7/Appendix A rows are cited. The defect is therefore one of *precision and of carrying the pack's corrections*, not of naming the wrong document — except in the baseline, where §11.6/§14.1 present the census as a property of the standard. No `sections\19`-numbered file exists; the References material lives in `08-project-management.md` §19, which is covered above.

## 4. Consolidated "new facts" block

Everything below is normative from this revision, in copy-paste-able form.

```
=== ADDRESSING (amended by Rev 1.1) ===
VLAN 50  TRANSIT-EGRESS  10.10.50.0/28   gw 10.10.50.1   usable .1-.14   bcast .15
  10.10.50.1  VP-HQ-CORE-01 gi0/1.50 | 10.10.50.2 ASA inside (255.255.255.240)
  10.10.50.10 nftables VRRP VIP (vrid 51)  | 10.10.50.11 vpnz-nft01 | 10.10.50.12 vpnz-nft02
VLAN 90  DMZ-HQ          10.10.90.0/24   gw 10.10.90.1 (ASA dmz interface)
  10.10.90.10 nginx VRRP VIP (vrid 61) — not a node address
  10.10.90.28 vpnz-dmzrev01 (keepalived master)  | 10.10.90.29 vpnz-dmzrev02 (backup)
  10.10.90.21 vpnz-dmzweba01 | .22 vpnz-dmzweba02 | .25 vpnz-dmzwp01 | .26 vpnz-dmzwp02 | .27 vpnz-dmzjump01
VLAN 10   LAN-HQ-CORE    10.10.10.0/24   gw 10.10.10.1
  10.10.10.28 vpnz-dmzrev01 VNET-CORE NIC (management reachability only)
  10.10.10.29 vpnz-dmzrev02 VNET-CORE NIC (management reachability only)
VNET-WAN  10.10.200.0/24
  10.10.200.1 wg0 HQ tunnel address (floats with the nftables VIP) | 10.10.200.2 vpnz-nft01 NIC
  10.10.200.3 vpnz-nft02 NIC | 10.10.200.5 vpnz-wcwg01 (branch peer) | 10.10.200.64/26 remote workers
  10.10.200.200/32, 10.10.200.201/32 MGMT-TUNNEL
LAN-ISP   per-link /30s (see the C-03 mapping block)

=== FIRST-HOP REDUNDANCY (amended by Rev 1.1) ===
HSRP  group 1 -> VLAN 30  0000.0c07.ac01  10.10.30.254
HSRP  group 2 -> VLAN 40  0000.0c07.ac02  10.10.40.254
HSRP  group 3 -> VLAN 70  0000.0c07.ac03  10.70.0.254
HSRP  group 4 -> VLAN 80  0000.0c07.ac04  10.10.80.254
      Active VP-HQ-CORE-01 pri 150 preempt delay minimum 30; Standby VP-HQ-CORE-02 pri 100; timers 1 3; MD5 auth
VRRP  vrid 51 -> nftables pair 10.10.50.0/28  VIP 10.10.50.10  (nodes .11/.12)
VRRP  vrid 61 -> nginx pair    10.10.90.0/24  VIP 10.10.90.10  (nodes .28/.29)

=== ROUTING (amended by Rev 1.1) ===
OSPF   single area 0 (HQ + Kwun Tong). No ABR, no `area range`, no inter-area summarisation. Multi-area = NOT COVERED.
EIGRP  AS 100 (Macau + one legacy transit segment), classic mode, AD 90.
Redistribution  ONLY at VP-HQ-EDGE-01; tags 100 (OSPF-originated) and 200 (EIGRP-originated);
      one-way per prefix set; no other router may carry a redistribute statement for this pair.
BGP    AS 65001 (HQ) <-> AS 65000 (primary, local-preference 200) and AS 65002 (alternate, local-preference 100
      + AS-path prepend). Both sessions terminate on the same simulated device — state that; announce exactly two prefixes.

=== NAT OWNERSHIP (amended by Rev 1.1) ===
Published DMZ services  static NAT at the ASA from 198.51.100.2/.3/.4 to the DMZ tier
VPN front door, hop 1    static PAT at the ASA from 198.51.100.5 to the nftables VIP 10.10.50.10, per port
VPN front door, hop 2    DNAT at the nftables pair from the VIP to vpnz-rras01 (udp 500/4500) and vpnz-lnxra01 (udp 1194)
Internal egress          masquerade at the nftables pair only
Site-to-site tunnel      NO NAT on either device (exemption rules are Manual NAT, evaluated before Auto NAT)
ASA outside default      route outside 0.0.0.0 0.0.0.0 198.51.100.6 1

=== STORAGE IQN (amended by Rev 1.1) ===
target    (DERIVED, not settable)  iqn.1991-05.com.microsoft:vpnz-san01-storage-lun0N.target
initiator (canonical string)       iqn.2026-01.lab.fyp.vertexpeak:storage-lun0N

=== EVIDENCE AND OBJECTIVE KEYS (added by Rev 1.1) ===
Evidence IDs   EV-0001-EV-0099 project-wide | EV-0100+ per report chapter (100-block) | EV-2000-EV-2099 cross-cutting
Objectives     canonical set is O-1 ... O-14 (01-introduction.md §2.2). Open items are O-01 ... O-10 (baseline §19).
               No other form of either key may appear.
Nginx exporter 9113/tcp — a baseline value, not an assumption
```

## 5. What this addendum does not do

- It does not renumber, rename or re-address anything that already works, except where a value was arithmetically impossible (C-01), self-colliding (C-02, C-06) or forbidden by the baseline's own rules (C-21).
- It does not invent a hostname. Every hostname used above already exists in the §16 hostname block.
- It does not resolve C-11's three option-pairs into a single branch for the group; it records the recommendation, the decision point and the consequence of the other branch, which is what makes the document non-self-contradictory. **OD-01 is the only one that already has a recorded decision (CR-04, Option A) and is therefore treated as decided.**
- It does not claim any figure from Packet Tracer as a real-world measurement, and it does not add coverage beyond §11.6.
- **It does not patch the eight section files.** It cannot honestly certify them as consistent either: `integration\consistency-report.md` §6 states which superseded value each section still contains, and §5 gives the spot-check queries that prove the patches landed.

## 6. Verification performed on this revision

Stated so that nothing above has to be taken on trust.

1. **Stability.** All eight section files were hashed, slept on for 90 seconds, and re-hashed. Seven were unchanged; `05-cisco.md` had settled at 216 151 bytes / `549EDC24…D8D2FE1C2C` and did not move again. Hashes before and after are in the consistency report §1 and in §1 of this addendum.
2. **Every ruling was read out of the files**, not from the conflict summary. The conflicting passages are quoted with file, section and line in the rulings above.
3. **Every patch action was tested against the real file text.** `node integration\_verify.js . integration\patch-list.json` → **166 actions: 162 unique match, 4 intended duplicate occurrences, 0 unmatched, 0 missing files.**
4. **The Markdown table and the JSON action file agree.** `node integration\_roundtrip.js` parses `patch-list.md` exactly as an applier would and compares it with `patch-list.json` → **166 rows, 0 mismatches.**
5. **The baseline patch was applied only after that verification**, by `node integration\_apply_baseline.js`, which aborts without writing if any find string does not match exactly once. It reported `applied 52 actions`.
6. **A residual scan of the patched baseline** (`node integration\_residual.js`) found 18 forbidden strings at **0 occurrences** and all 21 new values present. The one deliberate residue is `area range`, which survives in the struck annotation line and in four prohibition clauses; that is quoting a forbidden string in order to forbid it, not an unpatched finding.
7. **Not verified:** anything requiring the built estate. No VM, no Packet Tracer project and no service exists, so every check above is a text comparison. The derived target IQN, the `9113/tcp` exporter port and the 24-port switch budget are documentation decisions whose truth the build must confirm and record.

*End of Rev 1.1 addendum.*
