# 00 — CANONICAL DESIGN BASELINE

**Project title (exact string, use verbatim everywhere):**

> **Victor2 – Enterprise Network Infrastructure and Architect**

Subtitle for all deliverable covers: *Design, Build, Verify and Document a Virtualised Enterprise Network for a Hong Kong FinTech Firm*

Context line: **HDTN Final Year Project Topic (AY2026/27)**
Parent topic sheet reference: *Victor2. Enterprise network infrastructure in AI Era* (source file: `D:\File\School\FYP\AY2627_FYP topics_v2_Victor Li.docx`, unmodified original).

**Status of this document:** This is the single canonical baseline. Every later writer (proposal, design document, build manual, test plan, final report, slide deck) MUST conform to it. If a later writer needs to change anything in §16 (**INTERFACE CONTRACT**), this file must be revised first and re-issued with a new revision number. Silent deviation from §16 is a defect.

**How to read the markers used throughout this document:**

| Marker | Meaning |
|---|---|
| **[DECIDED]** | Fixed by this baseline. Later writers must not change it. |
| **[VERIFIED]** | Confirmed against an authoritative external source during authoring of this baseline (source given inline). |
| **[ASSUMPTION]** | Chosen by this baseline because no authoritative confirmation was possible at authoring time. Plausible and defensible, but must be re-checked before the final report and corrected if wrong. |
| **[UNCERTAIN]** | Availability or behaviour genuinely unverified. A mandatory fallback is given. |

**Authoring-time note (be honest in the report):** the baseline at this revision was authored in an environment where direct HTTPS retrieval was blocked by local TLS policy, so most external facts had to be taken from search-result metadata. However, a **verified research pack already exists in this repository** — `proposal\research\wsos-2026-2447.md` — in which the WorldSkills Occupational Standards 2026 page for this skill was fetched successfully (HTTP 200, 55 200-byte body) and its requirement text machine-extracted and re-verified verbatim (131 requirement lines, 0 mismatches). **Every statement in this baseline about what the WSOS 2026 does and does not contain is taken from that pack, which is the citation of record for the standard** (see §14.1 and §11.7). Facts that could not be verified even that way are marked **[ASSUMPTION]** or **[UNCERTAIN]** rather than stated as fact. Inventing a URL, a version string or a standards clause is forbidden in this project; where the truth is unknown the text must say so.

---

## 1. Scope, Deliverable and Success Criteria

### 1.1 Official requirement being satisfied
The topic sheet requires that students *"will study, build, configure, troubleshoot, and document complex enterprise networks using various telecom technologies (including but not limited to)"* the five lines below, and that students *"must produce well-organized documentation that includes all findings, manuals, steps, screen captures, verifications, and references related to the project."* **[VERIFIED]** — topic sheet as supplied.

### 1.2 The five technology lines **[DECIDED]**
| Line | Brief wording | Baseline short name |
|---|---|---|
| L1 | Microsoft Server Networking and Network Services (ADDS, FSRM, iSCSI, RRAS, IKEv2, …) | **MS-SERVER** |
| L2 | Linux Server Administrations (Nginx, Keepalived, nftables, OpenVPN/WireGuard, …) | **LINUX-SERVER** |
| L3 | Cisco Networking (BGP, OSPF, EIGRP, RSTP, ASA, …) | **CISCO** |
| L4 | Network Automation (PowerShell scripting, Ansible Playbook, Bash shell scripting, …) | **AUTOMATION** |
| L5 | AI Network Management (Agentic AI, OpenClaw Skills, …) | **AI-NETOPS** |

### 1.3 Constraints fixed by the client (student) **[DECIDED]**
- **No physical network hardware whatsoever.** Nothing may be ordered, assumed present, or required for any verification step.
- **Cisco work is performed in Cisco Packet Tracer only.**
- **Deliverable is a 12-week project plan.**
- **Group size: 4 students.**
- **Team is Hong Kong based; all writing is in academic English.**
- Single hypervisor host (one student-owned physical machine; no lab cluster).

### 1.4 Success criteria (definition of done)
The project is complete when all of the following exist and are demonstrably reproducible from a clean host:

1. A Packet Tracer project file containing the full L2/L3 topology of §4 with OSPF, EIGRP, BGP, RSTP and ASA perimeter policy working and captured.
2. All VMs of §6 built on the single hypervisor host with the exact software versions of §7.
3. AD DS domain of §9 operational with the OU structure, groups and service accounts of §9.
4. Every service in the port matrix of §10 reachable and evidenced by a screen capture plus a command transcript.
5. Automation: at least three idempotent PowerShell scripts and at least three Ansible playbooks in the repository layout of §8.7, re-runnable with unchanged output on second run.
6. AI-NETOPS: the read-only advisory proof of concept of §12.5 demonstrated end to end on at least one real alert-to-recommendation flow.
7. Documentation: findings, manuals, steps, screen captures, verifications and references, with a traceability matrix (§18) that maps every brief technology name to a section of the report and to a test case ID.

### 1.5 Explicit non-goals **[DECIDED]**
- No production deployment, no real customer data, no real public IP addresses (see §5.6).
- No physical routers, switches, firewalls, APs, servers, or SFP/cabling of any kind.
- No high-availability at the *hardware* layer (no LACP across physical chassis, no dual-PSU, no dual-site storage replication).
- No security certification claim, no penetration test claim, no compliance attestation. The design is *aligned with* selected controls, it is not *certified against* them.
- No commercial licences are purchased. Every version choice below is free, evaluation, or academic-licensed.

---

## 2. Client Scenario Narrative

**Company: Vertex Peak Financial Technologies Limited (Chinese trading name: 駿峰金融科技有限公司), trading as "Vertex Peak".**

| Attribute | Value |
|---|---|
| Sector | Insurance-technology and financial-data services (SFC-licensed wealth-management software vendor; sells SaaS to brokers) |
| Headquarters | Unit 1101–1106, 11/F, Lakeside Tower, Hong Kong Science Park, Pak Shek Kok, Sha Tin, New Territories |
| Head count | 160 staff total |
| HQ population | 110 staff (engineering, product, sales operations, finance, HR, IT) |
| Branch office | Kwun Tong Flagship Service Centre, 22/F, Tower A, Millennium City 5, Kwun Tong — 28 staff (sales and client onboarding) |
| Small office | Wan Chai Delivery Office, 9/F, Wu Chung House, Wan Chai — 12 staff (professional services / integration engineers) |
| Small office | Macau Representative Office, 6/F, FIT Centre, Zape, Macau — 4 staff |
| Remote workforce | 6 permanent home-office staff across Hong Kong plus ad-hoc remote access for ~40 travelling sales staff |
| Client base | 260 insurance brokerages in Hong Kong and Macau; ~14,000 end-user seats on the SaaS platform |
| Fiscal/regulatory context | Hong Kong Insurance Authority regulated clients; the firm is contractually required to demonstrate least privilege, auditability, and protection of client data |
| Head of IT | Reports to the COO; IT team is 5 people (the four project students are the "network engineering workstream" of that team, for narrative purposes) |

### 2.1 The trigger event (why this project exists now)
In the narrative, Vertex Peak has just migrated from a single flat office LAN to a two-and-a-half-site footprint after acquiring a 12-person professional-services team, and it has signed a contract with a new brokerage group whose due-diligence questionnaire demands:

1. Segregation of the platform production chain from ordinary office users.
2. Documented least-privilege access, and an audit trail of administrative actions.
3. Encrypted remote access using certificate-based authentication (no shared passwords).
4. Documented recovery and failover behaviour for the customer-facing web tier.
5. Evidence that network change is applied through reviewed, repeatable configuration rather than by hand.

That due-diligence list is the in-scenario driver for the whole build. Every design decision below traces back to a numbered item in this list or to §1.2.

### 2.2 Why this scenario needs all five technology lines (motivation traceability)
| Line | In-scenario need (narrative) | Concrete deliverable that satisfies it |
|---|---|---|
| **L1 MS-SERVER** | 160 staff across 4 locations need one identity; the brokers' questionnaire demands least privilege and auditable file access; the platform tier needs block storage that can move between hosts; travelling sales need certificate-based VPN. | AD DS single forest/domain for all sites; FSRM quotas + file-screen on the finance share; iSCSI LUN for the platform tier; RRAS IKEv2 remote-access VPN with machine+user certificates. |
| **L2 LINUX-SERVER** | The customer-facing SaaS web tier must survive the loss of one node; the DMZ must be published without exposing origin servers; the Wan Chai integration team needs an independent encrypted tunnel; outbound traffic must be filtered and logged at a chokepoint. | Nginx reverse proxy + TLS termination; Keepalived VRRP pair with a floating VIP; nftables stateful egress filter with NAT and logging; WireGuard tunnel to Wan Chai; OpenVPN as a second, independently-implemented remote-access technology; Easy-RSA as the Linux-side CA for the TLS/tunnel material. |
| **L3 CISCO** | The company now spans four sites plus a cloud SaaS dependency, so the internal network must route dynamically, converge after a link failure, deliver a resilient access layer, and defend a DMZ edge. | OSPF area 0 across HQ/branches; EIGRP on the Macau + legacy segment with controlled mutual redistribution; eBGP to the upstream transit provider; RSTP with explicit root bridge and port roles; ASA 5506-X as DMZ/edge firewall with ACLs, NAT and a site-to-site IPsec tunnel to Wan Chai. |
| **L4 AUTOMATION** | The due-diligence item "change applied through reviewed, repeatable configuration" cannot be satisfied by hand-typed CLIs, and the IT team is only 5 people. | PowerShell scripts for user onboarding, AD health reporting and configuration backup; Ansible playbooks that configure both Linux and Windows targets and collect switch/firewall configurations, all from a Git-tracked repository with a run log. |
| **L5 AI-NETOPS** | The same 5-person team cannot watch 18 VMs and 14 network devices manually, and the topic sheet explicitly names agentic AI and OpenClaw Skills. | An OpenClaw-based agent runtime on `vpnz-ai01` exposing a strictly read-only Skill surface (fetch alert summary, fetch interface counters, fetch failed-login events) that produces a triage note and a *proposed* configuration diff for human review. No write path. |

---

## 3. Sites and Logical Topology

### 3.1 Site codes (fixed) **[DECIDED]**
| Site code | Site | Role |
|---|---|---|
| `HQ` | Sha Tin (Hong Kong Science Park) | Headquarters, data centre of record, all core services |
| `BR` | Kwun Tong | Branch office |
| `WC` | Wan Chai | Small delivery office, IPsec/WireGuard peer |
| `MO` | Macau | Small representative office, EIGRP spoke |
| `ISP` | Simulated upstream transit provider | Packet Tracer only |
| `CLOUD` | Simulated external SaaS + remote-worker Internet | Packet Tracer only |

### 3.2 Functional zones and trust levels **[DECIDED]**
| Zone | Trust level | Contains |
|---|---|---|
| `Z-CORE` | Most trusted network zone (still not a security boundary) | HQ core router, core switches, OSPF backbone |
| `Z-MGMT` | Highest restricted zone | Hypervisor host management, out-of-band switch management, jump box |
| `Z-SERVER` | Trusted server zone | Identity, file, storage, DNS, monitoring, AI VMs |
| `Z-USER` | Untrusted-to-trusted boundary | Staff workstations and VoIP |
| `Z-STUDENT` | Fully untrusted | Lab/Wi-Fi guest segment, deliberately isolated |
| `Z-EGRESS` | Chokepoint | The nftables HA pair, the only path from `Z-SERVER`/`Z-USER` to the Internet |
| `Z-DMZ` | Externally reachable, internally untrusted | Reverse proxy, web farm, WordPress, DMZ jump box |
| `Z-WAN` | Provider-controlled | Transit links, simulated ISP |
| `Z-REMOTE` | Externally reachable, authenticated only | VPN pools for staff, site-to-site tunnel peers |

### 3.3 HQ physical/logical topology **[DECIDED]**
```
                                   [ Simulated Internet / CLOUD ]
                                                |
                            (primary transit 10.10.100.0/30)  eBGP AS 65001 <-> AS 65000
                            (alternate peer  10.10.100.40/30)  eBGP AS 65001 <-> AS 65002
                                                |
                     +-------------------- VP-HQ-EDGE-01 (AS 65001) --------------------+
                     |                                                                  |
        [ VP-HQ-FW-01 ASA5506-X (PT) ]  --------- 10.10.50.0/28 transit ---------   [nftables HA pair
              outside .1                                                                 VP-HQ-NFT-01/.02
              inside  .2 (10.10.50.0/28)                                                                 VIP 10.10.50.10 ]
                     |                                                        |
              (VLAN 90 DMZ-HQ 10.10.90.0/24)                          (VLAN 30 SRV-HQ-1 10.10.30.0/24)
                     |                                                        |
      +--------------+---------------+                       +----------------+-----------------+
      |              |               |                       |                |                 |
 vpnz-dmzweba01 vpnz-dmzweba02 vpnz-dmzwp01/.02        vpnz-dc01/.02     vpnz-fs01        vpnz-mon01
  .21            .22            .25/.26                .11/.12            .21              .31
  (DMZ-HQ, VLAN 90)                                     (SRV-HQ-1, VLAN 30)
      |
 vpnz-dmzjump01 .27 (proxy jump for vendor access into the DMZ only)

      -------------------------- VLAN 10 LAN-HQ-CORE 10.10.10.0/24 --------------------------
             |                                        |
   [ VP-HQ-CORE-01 ] ==== trunk ==== [ VP-HQ-CORE-02 ]      (RSTP: CORE-01 root, CORE-02 secondary)
             |          |          |          |
      DSW-A01    DSW-A02    DSW-A03    DSW-A04        (access switches)
             |          |          |          |
   VLAN 30/40/50/80  VLAN 70   VLAN 20   VLAN 60/90          (see §5)
             |
      VLAN 80 STORAGE-HQ 10.10.80.0/24 : vpnz-san01 .21 (iSCSI target)
      VLAN 20  MGMT-OOB 10.20.20.0/24 : hypervisor host, switch management, vpnz-jump01
      VLAN 70  STUDENT-LAB 10.70.0.0/24 : isolated lab, no route off-segment except the lab console path
```
The nftables HA pair sits **inline** between the HQ core and the ASA, so that every packet from `Z-USER`/`Z-SERVER` to the Internet is filtered, NATed and logged. The ASA owns the DMZ boundary. This is a deliberate two-firewall design (policy a second time, at a second layer) and must be drawn and explained exactly this way; it is not accidental duplication.

### 3.4 Branch and small-office topology **[DECIDED]**
```
Kwun Tong (BR)                          Wan Chai (WC)                     Macau (MO)
  VP-BR-EDGE-01  AS 65001                 VP-WC-EDGE-01                     VP-MO-EDGE-01  AS 65041
   |  OSPF area 0, single area, no      |  BGP AS 65021 (small)          |  EIGRP AS 100
   |  area range, no ABR for Kwun       |                                |
   |  to HQ over WAN1 10.10.100.32/30     |  IPsec to HQ ASA               |  to HQ over 10.10.100.36/30
   |                                      |  WireGuard to VP-HQ-NFT pair   |  redistribution at HQ
   +-- VLAN 110 BR-SALES   10.10.110.0/24   +-- VLAN 130 WC-LAN  10.10.130.0/24   +-- VLAN 120 MO-LAN 10.10.120.0/24
   +-- VLAN 111 BR-STAFF   10.10.111.0/24   +-- VLAN 131 WC-DEV  10.10.131.0/24   +-- VLAN 121 MO-VOICE 10.10.121.0/24
   +-- VLAN 112 BR-VOICE   10.10.112.0/24
   +-- VLAN 113 BR-MGMT    10.10.113.0/24
 VP-BR-DSW-A01 (access)                 VP-WC-DSW-A01                    VP-MO-DSW-A01
 VP-BR-DC-01 (RODC) .11                 (no local server)                (no local server)
```
Route propagation **[DECIDED]**: HQ and Kwun Tong run OSPF area 0 over the WAN1 link. Macau runs EIGRP AS 100 and its routes enter OSPF at `VP-HQ-EDGE-01` — the single, explicitly numbered redistribution point — with route tags (`tag 100`) so that redistribution can never loop. Wan Chai learns a default route from HQ over IPsec and advertises its own `/24`s back through the tunnel. All redistribution is one-way and documented; mutual, un-tagged redistribution is forbidden.

### 3.5 Trust-boundary rules (the normative table) **[DECIDED]**
`PERMIT` = allowed and logged; `DENY` = dropped and logged where the device supports logging; `REVIEW` = allowed only for the named protocol and only to the named destination.

| # | From | To | Verdict | Permitted traffic (exact) |
|---|---|---|---|---|
| TB-01 | `Z-USER` (VLAN 10, 30, 40) | `Z-SERVER` (VLAN 60, 80) | REVIEW | DNS 53/udp+tcp to `vpnz-dc01/02`; Kerberos 88, LDAP 389, SMB 445 to `vpnz-dc01/02`; SMB 445 to `vpnz-fs01`; iSCSI 3260 to `vpnz-san01` from the two platform VMs only; HTTPS 443 to `vpnz-mon01`; RDP is **not** permitted for ordinary users |
| TB-02 | `Z-USER` | Internet (`Z-WAN`) | REVIEW | HTTP 80, HTTPS 443, DNS via internal resolver, NTP via internal resolver, ICMP echo. Everything else denied egress |
| TB-03 | `Z-SERVER` | Internet | REVIEW | HTTPS 443 (OS/patch/package updates, Git), NTP 123 as a client, DNS via forwarder, ICMP. Attributed by source IP and logged by the nftables pair |
| TB-04 | `Z-DMZ` | `Z-SERVER` / `Z-USER` | **DENY** | Nothing, for any protocol. DMZ must never initiate toward the internal network |
| TB-05 | Internet | `Z-DMZ` | REVIEW | HTTPS 443 and HTTP 80 to the reverse-proxy VIP `198.51.100.2` only; ICMP echo; no other port, no other DMZ host directly |
| TB-06 | Internet | `Z-SERVER` / `Z-USER` | **DENY** | Nothing. Only the two VPN endpoints are Internet-reachable (UDP 443 WireGuard, UDP 500/4500 RRAS IKEv2, UDP 1194 OpenVPN) |
| TB-07 | `Z-MGMT` (VLAN 20) | every zone | PERMIT | SSH 22, RDP 3389, WinRM 5985/5986, Windows Admin Center 6516, SNMPv3 161, syslog 514/udp — management protocols only |
| TB-08 | every zone | `Z-MGMT` | REVIEW | Syslog 514/udp and SNMPv3 161/udp and traps 162 from managed devices only; all other traffic denied |
| TB-09 | `Z-STUDENT` (VLAN 70) | everything except its own subnet | **DENY** | Nothing. Only 10.70.0.0/24 intra-VLAN, plus TCP 443 to `VP-HQ-JUMP-01` for the lab console |
| TB-10 | `Z-STUDENT` | Internet | **DENY** | Nothing, by design — a deliberately isolated student/guest segment |
| TB-11 | `Z-REMOTE` (VPN pools) | `Z-SERVER` | REVIEW | As TB-01, plus RDP 3389 to the two platform VMs for the professional-services group only |
| TB-12 | `Z-REMOTE` | `Z-MGMT` | **DENY** | Nothing. VPN users are never administrators of infrastructure |
| TB-13 | `Z-DMZ` | Internet | REVIEW | Only DNS resolution and patch/package retrieval over 443/tcp from `vpnz-dmzrev01` and `vpnz-dmzweba01/02`, outbound only, initiated only by those hosts |
| TB-14 | `Z-WAN` (branch routers) | `Z-MGMT` | **DENY** | Nothing |
| TB-15 | `Z-DMZ` manage path | `Z-DMZ` hosts | REVIEW | Management of DMZ hosts only from `vpnz-dmzjump01` (10.10.90.27), which is itself reachable only from `Z-MGMT` |
| TB-16 | AI agent (`vpnz-ai01`) | all monitored devices | REVIEW | Read-only poll only: ICMP, SNMPv3 161/udp, WinRM 5986, SSH 22 read-only commands, HTTPS 443 read-only APIs. **No write path by construction — see §12.5** |

Any later writer documenting a live test must cite the TB row number it verifies.

### 3.6 Service dependency chain **[DECIDED]**
Hypervisor host → `Z-MGMT` → `vpnz-dc01` (DNS, AD DS, NTP, CA) → `Z-SERVER` services → `Z-EGRESS` (nftables) → ASA → ISP → Internet.
Branches depend on HQ over their WAN link or tunnel; Kwun Tong keeps a cached identity copy (RODC) so branch logins survive an HQ WAN outage.

---

## 4. VLAN Plan (normative)

`VID` is fixed. `HSRP/VRRP VIP` is the client default gateway, never the physical interface address. Where a VIP is `—`, the gateway is the router/switch interface itself.

| VID | Name (exact string) | Site | Purpose | Gateway (VIP) | Carried by / trunked on | Device or host physically on it |
|---|---|---|---|---|---|---|
| 10 | `LAN-HQ-CORE` | HQ | Layer-3 transit between core, edge, ASA inside, nftables pair, and the HQ user VLAN gateway interfaces | 10.10.10.1 (`VP-HQ-CORE-01`) | Trunk `VP-HQ-CORE-01`↔`VP-HQ-CORE-02`; trunk `VP-HQ-CORE-01`↔`VP-HQ-EDGE-01`; access to Nginx pair and ASA inside | HQ core switches, edge router subinterface, nftables pair, ASA inside, Nginx pair (dual-homed) |
| 20 | `MGMT-OOB` | HQ | Hypervisor host, switch management, jump box. No user traffic | 10.20.20.1 (`VP-HQ-CORE-01` gi0/1.20) | Access to `VP-HQ-DSW-A03` (trunked to both cores per rule 4); VLAN 20 is not trunked to any user-facing access switch (A01/A02) | Hypervisor host management, `VP-HQ-CORE-01/02`, `VP-HQ-DSW-A01..A04`, `VP-HQ-JUMP-02`, `VP-BR-DSW-A01` |
| 30 | `SRV-HQ-1` | HQ | Primary Windows server VLAN (identity, file, storage, monitoring, AI, Linux services) | 10.10.30.1 (`VP-HQ-CORE-01` gi0/1.30, HSRP `.254`/`.253`, VIP per §4.1) | Access ports on `VP-HQ-DSW-A04`; trunk `VP-HQ-DSW-A04`↔`VP-HQ-CORE-01/02` | `vpnz-dc01`, `vpnz-dc02`, `vpnz-fs01`, `vpnz-san01`, `vpnz-rras01`, `vpnz-lnxra01`, `vpnz-mon01`, `vpnz-ai01` |
| 40 | `USER-HQ-STF` | HQ | HQ staff workstations (6th–11th floor) | 10.10.40.1 | Access `VP-HQ-DSW-A01`, `VP-HQ-DSW-A02`; trunk to both cores | HQ workstations (Packet Tracer logical endpoints + hypervisor `VMnet8`) |
| 45 | `VOICE-HQ` | HQ | VoIP phones, dedicated voice VLAN, CUCM Express on the core | 10.10.45.1 (`VP-HQ-CORE-01` gi0/1.45) | Trunk `VP-HQ-DSW-A01/A02`↔cores; access to `VP-HQ-DSW-A04` for the CUCM Express router | `VP-HQ-VOICE-01` (CUCM Express, in Packet Tracer) |
| 50 | `TRANSIT-EGRESS` | HQ | The only path from the internal network to the perimeter: core ↔ nftables HA pair ↔ ASA inside | 10.10.50.1 (`VP-HQ-CORE-01` gi0/1.50) | Access to `VP-HQ-DSW-A04`; aggregated link to `VP-HQ-FW-01` (Packet Tracer only) | `VP-HQ-NFT-01`, `VP-HQ-NFT-02` (VIP 10.10.50.10), ASA inside, HQ core subinterface |
| 60 | `SRV-HQ-2` | HQ | Reserved secondary server VLAN for growth and for the second stage of the platform tier | 10.10.60.1 | Access `VP-HQ-DSW-A04` | Reserved; documented as growth space, nothing is deployed in it in the baseline |
| 70 | `STUDENT-LAB` | HQ | Completely isolated training/lab segment | 10.70.0.1 | Access `VP-HQ-DSW-A03` | Isolated lab endpoints; `VMnet7` if used |
| 80 | `STORAGE-HQ` | HQ | iSCSI block storage network, no routing beyond the core | 10.10.80.1 (`VP-HQ-CORE-01` gi0/1.80) | Access `VP-HQ-DSW-A04` | `vpnz-san01` (target .21), platform-tier initiators |
| 90 | `DMZ-HQ` | HQ | Externally published services, strictly compartmented | 10.10.90.1 (`VP-HQ-FW-01` inside interface — the ASA is the DMZ gateway) | Access to `VP-HQ-FW-01` DMZ port; not trunked to any user switch | `vpnz-dmzrev01`, `vpnz-dmzweba01`, `vpnz-dmzweba02`, `vpnz-dmzwp01`, `vpnz-dmzwp02`, `vpnz-dmzjump01` |
| 100 | `LAN-ISP` | ISP | Simulated upstream provider LAN (Packet Tracer only) | 10.10.100.1 | Packet Tracer only | Simulated ISP router, `VP-HQ-EDGE-01` outside, DNS/DHCP of the provider |
| 110 | `BR-SALES` | BR | Kwun Tong sales and client-onboarding floor | 10.10.110.1 | Access `VP-BR-DSW-A01`; trunk to `VP-BR-EDGE-01` | Branch workstations |
| 111 | `BR-STAFF` | BR | Kwun Tong back-office staff | 10.10.111.1 | Access `VP-BR-DSW-A01` | Branch workstations |
| 112 | `BR-VOICE` | BR | Kwun Tong VoIP | 10.10.112.1 | Access `VP-BR-DSW-A01` | Branch phones |
| 113 | `BR-MGMT` | BR | Kwun Tong switch/router management | 10.10.113.1 | Access `VP-BR-DSW-A01` | `VP-BR-EDGE-01`, `VP-BR-DSW-A01`, `VP-BR-DC-01` mgmt NIC |
| 120 | `MO-LAN` | MO | Macau office LAN | 10.10.120.1 | Access `VP-MO-DSW-A01` | Macau workstations |
| 121 | `MO-VOICE` | MO | Macau VoIP | 10.10.121.1 | Access `VP-MO-DSW-A01` | Macau phones |
| 130 | `WC-LAN` | WC | Wan Chai office LAN | 10.10.130.1 | Access `VP-WC-DSW-A01` | Wan Chai workstations |
| 131 | `WC-DEV` | WC | Wan Chai integration/dev segment (least privilege, no production credentials) | 10.10.131.1 | Access `VP-WC-DSW-A01` | Integration test endpoints |
| 999 | `UNUSED-BLACKHOLE` | all | Shutdown VLAN present on every switch to absorb unassigned ports | — | `interface range` on each access switch, `shutdown` | — |

**VLAN discipline rules [DECIDED]**
1. Native VLAN on every trunk is **999**, never VLAN 1. VLAN 1 exists but carries no traffic.
2. Every unused access port is assigned to VLAN 999 and shut down.
3. `switchport nonegotiate` and `spanning-tree portfast` + `bpduguard enable` on all end-user access ports.
4. Trunks are only between `CORE-01/02`, cores↔access switches, cores↔edge router, cores↔ASA, and cores↔`VP-BR-EDGE-01`.
5. No VLAN is stretched between HQ and any branch. Inter-site traffic is routed.

### 4.1 Gateway redundancy **[DECIDED]**
- **HSRP** is used for IPv4 gateway redundancy in the HQ access layer (it is what Packet Tracer supports reliably): `VP-HQ-CORE-01` active (priority 150, preempt), `VP-HQ-CORE-02` standby (priority 100), **one group per SVI** — group 1 on VLAN 30, group 2 on VLAN 40, group 3 on VLAN 70, group 4 on VLAN 80 — with virtual MACs `0000.0c07.ac01`, `0000.0c07.ac02`, `0000.0c07.ac03` and `0000.0c07.ac04` (HSRPv1 formula `0000.0c07.acXX`).
- VIP summary: VLAN 30 = `10.10.30.254`, VLAN 40 = `10.10.40.254`, VLAN 70 = `10.70.0.254`, VLAN 80 = `10.10.80.254`.
- **Keepalived VRRP** is used where the gateway is a Linux VM, not a switch: the nftables pair (§5) and the Nginx pair (§5). These are two *different* first-hop redundancy technologies in one design; the report must present them as deliberate (vendor-native versus open-source) and must not merge them into one claim.

---

## 5. IP Addressing Plan (normative)

All addresses come from the RFC 1918 private ranges or from the RFC 5737 documentation ranges. Nothing else may be used. **[VERIFIED]** — RFC 1918 (*Address Allocation for Private Internets*) and RFC 5737 (*IPv4 Address Blocks Reserved for Documentation*) are the applicable reference documents; the topic sheet's own standard reference for the documentation style is the WorldSkills Occupational Standards page cited in §14.

### 5.1 Allocation of private space (site summary) **[DECIDED]**
| Block | Assigned to | Notes |
|---|---|---|
| `10.10.0.0/16` | All HQ LANs, all branch/small-office LANs, WAN links, ISP-transit links, loopbacks | Logical HQ space 10.10.0.0/17; branch/small-office space 10.10.110.0/17 side |
| `10.20.0.0/16` | Management networks | Chosen deliberately outside the `10.10.0.0/16` block so a routing mistake cannot expose management |
| `10.70.0.0/16` | Isolated student/lab network | Deliberately outside both of the above |
| `10.255.0.0/24` | Router loopbacks | One per routing device |
| `192.0.2.0/24` | Simulated public Internet core (Packet Tracer) | RFC 5737 TEST-NET-1 |
| `198.51.100.0/24` | Simulated public DMZ/publication range (Packet Tracer) | RFC 5737 TEST-NET-2 |
| `203.0.113.0/24` | Simulated public WAN peer range for tunnels (Packet Tracer) | RFC 5737 TEST-NET-3 |
| `172.16.0.0/16` | **Not allocated.** Reserved head-room for future branch growth | Must not appear in any config in this baseline |

### 5.2 Complete subnet table **[DECIDED]**
| Subnet (CIDR) | VLAN | Gateway | First usable | Last usable | Broadcast | DHCP? | Purpose |
|---|---|---|---|---|---|---|---|
| 10.10.10.0/24 | 10 | 10.10.10.1 | 10.10.10.1 | 10.10.10.254 | 10.10.10.255 | No | HQ layer-3 transit/user default gateways |
| 10.20.20.0/24 | 20 | 10.20.20.1 | 10.20.20.1 | 10.20.20.254 | 10.20.20.255 | No | Management / OOB |
| 10.10.30.0/24 | 30 | 10.10.30.254 (VIP) | 10.10.30.1 | 10.10.30.253 | 10.10.30.255 | No | HQ server subnet 1 |
| 10.10.40.0/23 | 40 | 10.10.40.254 (VIP) | 10.10.40.1 | 10.10.41.254 | 10.10.41.255 | Yes | HQ staff workstations (508 usable) |
| 10.10.45.0/24 | 45 | 10.10.45.1 | 10.10.45.1 | 10.10.45.254 | 10.10.45.255 | Yes | HQ VoIP |
| 10.10.50.0/28 | 50 | 10.10.50.1 | 10.10.50.1 | 10.10.50.14 | 10.10.50.15 | No | Egress transit (core ↔ nftables ↔ ASA) |
| 10.10.60.0/24 | 60 | 10.10.60.1 | 10.10.60.1 | 10.10.60.254 | 10.10.60.255 | No | Reserved HQ server subnet 2 |
| 10.70.0.0/24 | 70 | 10.70.0.254 (VIP) | 10.70.0.1 | 10.70.0.253 | 10.70.0.255 | Yes | Isolated lab |
| 10.10.80.0/24 | 80 | 10.10.80.254 (VIP) | 10.10.80.1 | 10.10.80.253 | 10.10.80.255 | No | iSCSI storage |
| 10.10.90.0/24 | 90 | 10.10.90.1 (ASA inside) | 10.10.90.1 | 10.10.90.254 | 10.10.90.255 | No | DMZ |
| 10.10.100.0/30 | 100 | — | .1 / .2 | — | .3 | No | HQ edge ↔ ISP provider edge (the name 10.10.100.0/29 is a container for this link plus 10.10.100.4/30) |
| 10.10.100.4/30 | 100 | — | .5 / .6 | — | .7 | No | HQ edge ↔ ISP backup provider edge |
| 10.10.100.32/30 | 100 | — | .33 / .34 | — | .35 | No | HQ edge ↔ Kwun Tong edge WAN1 (OSPF) |
| 10.10.100.36/30 | 100 | — | .37 / .38 | — | .39 | No | HQ edge ↔ Macau edge (EIGRP domain boundary) |
| 10.10.100.40/30 | 100 | — | .41 / .42 | — | .43 | No | HQ edge ↔ ISP alternate peer (second BGP session) |
| 10.10.110.0/24 | 110 | 10.10.110.1 | .1 | .254 | .255 | Yes | Kwun Tong sales |
| 10.10.111.0/24 | 111 | 10.10.111.1 | .1 | .254 | .255 | Yes | Kwun Tong staff |
| 10.10.112.0/24 | 112 | 10.10.112.1 | .1 | .254 | .255 | Yes | Kwun Tong VoIP |
| 10.10.113.0/24 | 113 | 10.10.113.1 | .1 | .254 | .255 | No | Kwun Tong management |
| 10.10.120.0/24 | 120 | 10.10.120.1 | .1 | .254 | .255 | Yes | Macau LAN |
| 10.10.121.0/24 | 121 | 10.10.121.1 | .1 | .254 | .255 | Yes | Macau VoIP |
| 10.10.130.0/24 | 130 | 10.10.130.1 | .1 | .254 | .255 | Yes | Wan Chai LAN |
| 10.10.131.0/24 | 131 | 10.10.131.1 | .1 | .254 | .255 | Yes | Wan Chai dev |
| 10.255.0.0/24 | — | — | — | — | — | No | Router loopbacks (.11–.41, see §5.5) |
| 192.0.2.0/24 | — | 192.0.2.1 | — | — | — | Simulated | Internet core |
| 198.51.100.0/29 | — | 198.51.100.1 (ASA outside) | .1 | .6 | .7 | No | Public DMZ pool |
| 203.0.113.0/29 | — | 203.0.113.1 (provider) | .1 | .6 | .7 | No | Public tunnel/WAN peer pool |

**Deliberate sizing note [DECIDED]:** VLAN 40 is a `/23` because 110 HQ staff plus growth cannot be addressed most efficiently in a `/24` while keeping a clean DHCP pool; VLAN 45, 70, 80, 90 and the branch voice VLANs are intentionally small. Any later writer who needs more hosts must return to this file and change it, not silently extend a pool.

### 5.3 DHCP scope table **[DECIDED]**
DHCP is authoritatively served by the AD-integrated Windows DHCP role on `vpnz-dc01` and `vpnz-dc02` (80/20 split, `vpnz-dc02` delay 500 ms), with `vpnz-dc01` the primary and locally relevant relay (`ip helper-address`) on every gateway interface. Branch scopes are served over the WAN from HQ; Kwun Tong keeps a DHCP relay only.

| Scope name (exact) | Subnet | Pool range | Excluded from dynamic | Lease | Options pushed | Relay on |
|---|---|---|---|---|---|---|
| `SCOPE-HQ-USER-STF` | 10.10.40.0/23 | 10.10.40.100 – 10.10.41.200 | 10.10.40.1–10.10.40.99, 10.10.41.201–10.10.41.254 | 8 h | 003 = 10.10.40.254; 006 = 10.10.30.11, 10.10.30.12; 015 = `vertexpeak.fyp.lab`; 042 → 10.10.30.11; 051 = 8 h; 119 = `fyp.lab`; 121 = 10.10.40.0/23 → 10.10.30.31; 150 = 10.10.30.31 | `VP-HQ-CORE-01` gi0/1.40 |
| `SCOPE-HQ-VOICE` | 10.10.45.0/24 | 10.10.45.100 – 10.10.45.200 | 10.10.45.1–10.10.45.99, 10.10.45.201–10.10.45.254 | 30 d | 003 = 10.10.45.1; 006 = 10.10.30.11, 10.10.30.12; 042; 066 = 10.10.45.11; 150 = 10.10.45.11 | `VP-HQ-CORE-01` gi0/1.45 |
| `SCOPE-HQ-LAB` | 10.70.0.0/24 | 10.70.0.100 – 10.70.0.200 | 10.70.0.1–10.70.0.99, 10.70.0.201–10.70.0.254 | 8 h | 003 = 10.70.0.254; 006 = 10.10.30.11, 10.10.30.12 | `VP-HQ-DSW-A03` VLAN 70 SVI |
| `SCOPE-BR-SALES` | 10.10.110.0/24 | 10.10.110.100 – 10.10.110.200 | 10.10.110.1–10.10.110.99, 10.10.110.201–10.10.110.254 | 8 h | 003 = 10.10.110.1; 006 = 10.10.30.11, 10.10.30.12; 042; 121 = 10.10.110.0/24 → 10.10.30.31 | `VP-BR-EDGE-01` gi0/0.110 |
| `SCOPE-BR-STAFF` | 10.10.111.0/24 | 10.10.111.100 – 10.10.111.200 | 10.10.111.1–10.10.111.99, 10.10.111.201–10.10.111.254 | 8 h | as `SCOPE-BR-SALES` with 003 = 10.10.111.1 | `VP-BR-EDGE-01` gi0/0.111 |
| `SCOPE-BR-VOICE` | 10.10.112.0/24 | 10.10.112.100 – 10.10.112.200 | 10.10.112.1–10.10.112.99, 10.10.112.201–10.10.112.254 | 30 d | 003 = 10.10.112.1; 066 = 10.10.45.11 | `VP-BR-EDGE-01` gi0/0.112 |
| `SCOPE-MO-LAN` | 10.10.120.0/24 | 10.10.120.100 – 10.10.120.180 | 10.10.120.1–10.10.120.99, 10.10.120.181–10.10.120.254 | 8 h | 003 = 10.10.120.1; 006 = 10.10.30.11, 10.10.30.12 | `VP-MO-EDGE-01` gi0/0.120 |
| `SCOPE-MO-VOICE` | 10.10.121.0/24 | 10.10.121.100 – 10.10.121.150 | 10.10.121.1–10.10.121.99, 10.10.121.151–10.10.121.254 | 30 d | 003 = 10.10.121.1; 066 = 10.10.45.11 | `VP-MO-EDGE-01` gi0/0.121 |
| `SCOPE-WC-LAN` | 10.10.130.0/24 | 10.10.130.100 – 10.10.130.180 | 10.10.130.1–10.10.130.99, 10.10.130.181–10.10.130.254 | 8 h | 003 = 10.10.130.1; 006 = 10.10.30.11, 10.10.30.12 | `VP-WC-EDGE-01` gi0/0.130 |
| `SCOPE-WC-DEV` | 10.10.131.0/24 | 10.10.131.100 – 10.10.131.150 | 10.10.131.1–10.10.131.99, 10.10.131.151–10.10.131.254 | 8 h | 003 = 10.10.131.1; 006 = 10.10.30.11, 10.10.30.12 | `VP-WC-EDGE-01` gi0/0.131 |
| — | — | **There is no DHCP scope for the RRAS IKEv2 pool.** The pool is `10.10.201.0/24`, assigned statically by RRAS (§5.4) and never leased by DHCP | — | — | — | A remote-access pool is not a DHCP scope, and `172.16.0.0/16` is unallocated head-room (§5.1) |
| `SCOPE-VPN-WG` | 10.10.200.0/24 | Static in `wg0.conf`, not DHCP | — | — | — | WireGuard uses static peer addresses, never DHCP |

**DHCP reservations used (fixed in the server, not in the pool) [DECIDED]:** none. Every device that must be predictable is statically addressed (§5.5); DHCP is only for workstations, phones and lab endpoints. Printer/VoIP static ranges are excluded from the pool as shown.

### 5.4 VPN and tunnel addressing **[DECIDED]**
| Tunnel | Type | Endpoint A | Endpoint B | Inner addressing | Notes |
|---|---|---|---|---|---|
| `WG-HQ-WC` | WireGuard, UDP 443 | `vpnz-nft01` / `vpnz-nft02` (VIP 10.10.50.10) via ASA PAT to `203.0.113.2:443` | `vpnz-wcwg01` inner address `10.10.200.5/24` (the Ubuntu guest that emulates the branch encrypting gateway; the site's public address `203.0.113.5` remains the IPsec peer) | A = `10.10.200.1/24` (floating with the VIP), B = `10.10.200.5/24` | Primary small-office tunnel; a Cisco device cannot terminate WireGuard (Rev 1.1 ruling OD-01); keys generated with `wg genkey`, private keys never committed to Git |
| `WG-REMOTE-POOL` | WireGuard, UDP 443 | same VIP | staff laptops | `10.10.200.64/26` (available 10.10.200.65–126) | Second address family deliberately separated from the site tunnel pool to keep ACLs unambiguous |
| `IPSEC-HQ-WC` | IKEv2 site-to-site, UDP 500/4500 | ASA `VP-HQ-FW-01` outside `198.51.100.1` | `VP-WC-EDGE-01` outside `203.0.113.5` | Optional transport for VLAN 131 only | Used to demonstrate ASA IPsec and to compare against WireGuard |
| `IKEV2-RAS-POOL` | RRAS IKEv2 remote access | `vpnz-rras01` outside (via ASA PAT, UDP 500/4500) | staff laptops | `10.10.201.0/24`, static pool `10.10.201.10 – 10.10.201.200` | Certificate-based only; preshared-key IKEv2 is forbidden by design |
| `OPENVPN-POOL` | OpenVPN TLS, UDP 1194 | `vpnz-lnxra01` via ASA PAT | staff laptops | `10.10.202.0/24`, pool `10.10.202.10 – 10.10.202.120` | The second, independent remote-access implementation on Linux; used for the technology comparison chapter |
| `MGMT-TUNNEL` | WireGuard, UDP 51820 | `vpnz-nft01` | `vpnz-mon01` backup path only | `10.10.200.200/32` and `10.10.200.201/32` | Documented as an out-of-band management escape hatch; must be disabled during the security test and its absence evidenced |

**VPN pool exclusion rule [DECIDED]:** no VPN pool may overlap `10.10.0.0/16` LAN space, `10.20.0.0/16` management space, or `10.70.0.0/16` lab space. `172.16.0.0/16` remains unallocated head-room and must not be used for VPN pools.

### 5.5 Loopback and WAN link addressing **[DECIDED]**
| Device | Loopback | WAN/link interface and address | Peer |
|---|---|---|---|
| `VP-HQ-CORE-01` | 10.255.0.11/32 | — | — |
| `VP-HQ-CORE-02` | 10.255.0.12/32 | — | — |
| `VP-HQ-EDGE-01` | 10.255.0.21/32 | gi0/0 = 10.10.100.1/30; gi0/1 = 192.0.2.2/30; gi0/2 = 10.10.100.33/30; gi0/3 = 10.10.100.37/30 | ISP edge; Kwun Tong; Macau |
| `VP-HQ-FW-01` (ASA) | n/a (ASA has no loopback) | outside = 198.51.100.1/29 (default next hop 198.51.100.6, the provider edge); inside = 10.10.50.2/28; dmz = 10.10.90.1/24 | Edge router; DMZ switch |
| `VP-BR-EDGE-01` | 10.255.0.31/32 | gi0/1 = 10.10.100.34/30 | `VP-HQ-EDGE-01` |
| `VP-MO-EDGE-01` | 10.255.0.41/32 | gi0/1 = 10.10.100.38/30 | `VP-HQ-EDGE-01` |
| `VP-WC-EDGE-01` | 10.255.0.51/32 | outside = 203.0.113.5/29 | ASA / WireGuard peer |
| `VP-ISP-EDGE-01` | 10.255.0.61/32 | outside = 198.51.100.6/29; 192.0.2.1/30; 10.10.100.2/30; 10.10.100.42/30 | ASA outside (the default next hop); Internet core; HQ edge (both BGP sessions) |
| `VP-ISP-DNS-01` | — | 192.0.2.53/24, 192.0.2.54/24 | Simulated public resolvers |

### 5.6 Public addressing **[DECIDED]**
No real public address is used anywhere in this project. All Internet-facing addresses come from the RFC 5737 documentation ranges, and any published service name ends in `.example` (RFC 2606 reserved). **[VERIFIED]** — RFC 5737 and RFC 2606 are the applicable references.

| Public address | Published service | Mapped to (inside) |
|---|---|---|
| 198.51.100.1 | ASA `VP-HQ-FW-01` outside interface | — |
| 198.51.100.2 | `https://portal.vertexpeak.example` (443) and `http://portal.vertexpeak.example` (80) | VIP `10.10.90.10` (Nginx HA pair) |
| 198.51.100.3 | `https://www.vertexpeak.example` (443) | `vpnz-dmzweba01` (10.10.90.21) and `vpnz-dmzweba02` (10.10.90.22) |
| 198.51.100.4 | `https://blog.vertexpeak.example` (443) | `vpnz-dmzwp01` (10.10.90.25) |
| 198.51.100.5 | UDP 443 WireGuard / UDP 500,4500 IKEv2 / UDP 1194 OpenVPN | `10.10.50.10` (nftables VIP) → `vpnz-rras01`, `vpnz-lnxra01` per port forwarding |
| 203.0.113.1 | Simulated provider edge | — |
| 203.0.113.2 | Public peer address presented for the HQ tunnel endpoints | `10.10.50.10` |
| 203.0.113.5 | `VP-WC-EDGE-01` public interface | — |

### 5.7 Static host address table (every host referenced by later configs) **[DECIDED]**
| Hostname | IP | VLAN | Role |
|---|---|---|---|
| `vpnz-dc01` | 10.10.30.11 | 30 | Primary AD DS DC, DNS, DHCP, AD CS enterprise root CA, NTP source, Global Catalog |
| `vpnz-dc02` | 10.10.30.12 | 30 | Second AD DS DC, DNS, DHCP (80/20), Global Catalog |
| `vpnz-fs01` | 10.10.30.21 | 30 | File server, FSRM quotas/file screening, DFS-R target, Windows Backup target |
| `vpnz-san01` | 10.10.80.21 | 80 | iSCSI target. Target IQNs are DERIVED by Microsoft's iSCSI Target Server and cannot be set: `iqn.1991-05.com.microsoft:vpnz-san01-storage-lun0N.target`. The canonical project string `iqn.2026-01.lab.fyp.vertexpeak:storage-lun0N` is the INITIATOR IQN on `vpnz-dmzweba01` |
| `vpnz-rras01` | 10.10.30.41 | 30 | RRAS IKEv2 remote-access VPN, RADIUS (NPS) server |
| `vpnz-lnxra01` | 10.10.30.42 | 30 | Ubuntu: OpenVPN server, Easy-RSA CA (Linux side), `nftables` host firewall |
| `vpnz-mon01` | 10.10.30.31 | 30 | Ubuntu: Prometheus, Grafana, Loki (syslog receiver), NTP, TFTP/SCP configuration archive, Ansible control node, Git server |
| `vpnz-ai01` | 10.10.30.51 | 30 | Ubuntu: OpenClaw agent runtime, MCP tool bridge, read-only collector |
| `vpnz-nft01` | 10.10.50.11 (VIP 10.10.50.10) on `VNET-EGRESS`; 10.10.200.2 on `VNET-WAN` | 50 | Ubuntu: nftables egress filter, NAT, first keepalived master |
| `vpnz-nft02` | 10.10.50.12 (VIP 10.10.50.10) on `VNET-EGRESS`; 10.10.200.3 on `VNET-WAN` | 50 | Ubuntu: nftables pair backup |
| `vpnz-dmzrev01` | 10.10.90.28 (VIP 10.10.90.10) on `VNET-DMZ`; 10.10.10.28 on `VNET-CORE` (management reachability only) | 90 | Ubuntu: Nginx reverse proxy, first keepalived master, TLS terminator |
| `vpnz-dmzrev02` | 10.10.90.29 (VIP 10.10.90.10) on `VNET-DMZ`; 10.10.10.29 on `VNET-CORE` (management reachability only) | 90 | Ubuntu: Nginx reverse proxy, keepalived backup |
| `vpnz-dmzweba01` | 10.10.90.21 | 90 | Windows Server: IIS application tier node 1 |
| `vpnz-dmzweba02` | 10.10.90.22 | 90 | Windows Server: IIS application tier node 2 |
| `vpnz-dmzwp01` | 10.10.90.25 | 90 | Ubuntu: WordPress content node 1 (Nginx + PHP-FPM + MariaDB) |
| `vpnz-dmzwp02` | 10.10.90.26 | 90 | Ubuntu: WordPress content node 2 |
| `vpnz-dmzjump01` | 10.10.90.27 | 90 | Ubuntu: DMZ jump/proxy host (the only management path into the DMZ) |
| `vpnz-jump01` | 10.20.20.31 | 20 | Windows Server: privileged access workstation / admin jump box (RDP, WinRM) |
| `vpnz-hvhost01` | 10.20.20.10 | 20 | Hypervisor host management address (not a guest) |
| `vpnz-brdc01` | 10.10.113.11 (host NIC) / 10.10.113.12 (management) | 113 | Kwun Tong RODC, DNS, local DHCP relay |
| `vpnz-pki01` | 10.10.30.15 | 30 | **[ASSUMPTION]** Optional issuing CA for the two-tier PKI; if the group runs single-tier only, this address stays unallocated and `vpnz-dc01` issues directly |

**Network device management addresses (all in VLAN 20 or the branch MGMT VLAN) [DECIDED]**
| Device | Address |
|---|---|
| `VP-HQ-CORE-01` | 10.20.20.11 |
| `VP-HQ-CORE-02` | 10.20.20.12 |
| `VP-HQ-DSW-A01` | 10.20.20.21 |
| `VP-HQ-DSW-A02` | 10.20.20.22 |
| `VP-HQ-DSW-A03` | 10.20.20.23 |
| `VP-HQ-DSW-A04` | 10.20.20.24 |
| `VP-HQ-EDGE-01` | 10.20.20.31 |
| `VP-HQ-FW-01` | 10.20.20.32 (ASA management interface) |
| `VP-HQ-VOICE-01` | 10.10.45.11 (in VLAN 45 because it serves phones) |
| `VP-BR-EDGE-01` | 10.10.113.1 |
| `VP-BR-DSW-A01` | 10.10.113.21 |
| `VP-MO-EDGE-01` | 10.10.120.1 |
| `VP-MO-DSW-A01` | 10.10.120.21 |
| `VP-WC-EDGE-01` | 10.10.130.1 |
| `VP-WC-DSW-A01` | 10.10.130.21 |

### 5.8 DNS record plan **[DECIDED]**
Forward zone `vertexpeak.fyp.lab` (AD-integrated, secure dynamic updates only). Every static host of §5.7 has an A record equal to its hostname. Additional records:

| Record | Type | Value | Purpose |
|---|---|---|---|
| `portal.vertexpeak.fyp.lab` | A | 10.10.90.10 | Published portal name (internal resolution, split-horizon) |
| `www.vertexpeak.fyp.lab` | A | 10.10.90.10 | Internal alias for the reverse proxy |
| `blog.vertexpeak.fyp.lab` | A | 10.10.90.10 | Blog front door, proxied to the WordPress pair |
| `vpn.vertexpeak.fyp.lab` | A | 10.10.50.10 | Group VPN front door (RRAS + OpenVPN) |
| `wg.vertexpeak.fyp.lab` | A | 10.10.50.10 | WireGuard front door |
| `keepalived-hq` | A | 10.10.50.11, 10.10.50.12 | VRRP pair members |
| `_ldap._tcp.dc._msdcs.vertexpeak.fyp.lab` | SRV | created by AD DS | Kerberos/LDAP discovery |
| `_kerberos._tcp.vertexpeak.fyp.lab` | SRV | created by AD DS | Kerberos |
| `_gc._tcp.vertexpeak.fyp.lab` | SRV | created by AD DS | Global Catalog |
| `_autodiscover._tcp` | SRV | **Not created.** No Exchange/Microsoft 365 integration in this project | Documented as out of scope |
| Conditional forwarder `vertexpeak.example` | forwarder | 192.0.2.53 | Resolves the simulated public names in the lab |

Reverse zones **[DECIDED]**: `30.10.10.in-addr.arpa`, `40.10.10.in-addr.arpa`, `90.10.10.in-addr.arpa`, `20.20.10.in-addr.arpa` are AD-integrated with PTR records for all static hosts. Branch reverse zones are delegated to the RODC (`113.10.10.in-addr.arpa`) and forwarded from HQ.

### 5.9 DNS/DHCP redundancy rules **[DECIDED]**
- Every client gets `10.10.30.11` and `10.10.30.12` in that order.
- `vpnz-brdc01` is additionally a DNS server for Kwun Tong and sits third in the branch DHCP option list; it must never be the only resolver for any client.
- DHCP failover partner relationship is `vpnz-dc01` (active) ↔ `vpnz-dc02` (standby), load balance 80/20, `MaxClientLeadTime` 1 h, state switchover interval 60 min. Kwun Tong delays must not exceed 500 ms or the branch will fail over spuriously.

---

## 6. Device and VM Inventory (single authoritative table)

Hypervisor host: **one** student-owned machine, referred to throughout as `vpnz-hvhost01`. All guests are on that host. Nothing in this table may be replaced by physical hardware. **[DECIDED]**

**NIC attachment abbreviations [DECIDED]**
| Code | Meaning in the hypervisor |
|---|---|
| `VNET-MGMT` | VMnet2 (host-only), 10.20.20.0/24 |
| `VNET-CORE` | VMnet3 (host-only), 10.10.10.0/24 |
| `VNET-SRV` | VMnet4 (host-only), 10.10.30.0/24 |
| `VNET-EGRESS` | VMnet5 (host-only), 10.10.50.0/24 |
| `VNET-DMZ` | VMnet6 (host-only), 10.10.90.0/24 |
| `VNET-LAB` | VMnet7 (host-only), 10.70.0.0/24 |
| `VNET-USER` | VMnet8 (host-only), 10.10.40.0/23 |
| `VNET-STOR` | VMnet9 (host-only), 10.10.80.0/24 |
| `VNET-WAN` | VMnet10 (host-only), 10.10.200.0/24 (tunnel/transport emulation) |
| `VNET-NAT` | VMnet8-style NAT network reserved for host patching only; **must not** be a production path |

These VMnet identifiers correspond to real VMware Workstation `vmnet` numbers. `VMnet0` (bridged) is deliberately unused: **the lab must never bridge to the campus or home LAN.** All other VMnets must be host-only with the hypervisor's own DHCP disabled on every one of them (the AD DHCP server is the only DHCP authority in this lab).

| # | Device/VM name | Role | OS and exact version | vCPU | RAM | Disk | NICs | NIC attachment | Lines served |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `VP-HQ-CORE-01` | HQ core L3 switch, OSPF area-0 router (not an ABR), HSRP groups 1-4 active, CUCM Express host device | Cisco IOS 15.2 image bundled with Packet Tracer 8.2.2 (**[UNCERTAIN]** exact image string — record the one PT actually offers) | n/a (PT) | n/a | n/a | 8 (PT logical) | PT logical only | L3, L4 (target of Ansible config collection) |
| 2 | `VP-HQ-CORE-02` | HQ core L3 switch, HSRP standby, RSTP secondary root | same as #1 | n/a | n/a | n/a | 6 | PT logical only | L3 |
| 3 | `VP-HQ-DSW-A01` | HQ access switch (6th–8th floor), RSTP leaf, port security, DHCP snooping | same as #1 | n/a | n/a | n/a | 24 | PT logical only | L3 |
| 4 | `VP-HQ-DSW-A02` | HQ access switch (9th–11th floor), RSTP leaf | same as #1 | n/a | n/a | n/a | 24 | PT logical only | L3 |
| 5 | `VP-HQ-DSW-A03` | HQ access switch (management and isolated lab segments) | same as #1 | n/a | n/a | n/a | 24 | PT logical only | L3 |
| 6 | `VP-HQ-DSW-A04` | HQ access switch (server, storage and DMZ-facing edge segments) | same as #1 | n/a | n/a | n/a | 24 | PT logical only | L3 |
| 7 | `VP-HQ-EDGE-01` | HQ WAN edge router, eBGP AS 65001, OSPF and EIGRP redistribution, NAT boundary | Cisco IOS 15.2 (PT bundled) | n/a | n/a | n/a | 4 | PT logical only | L3 |
| 8 | `VP-HQ-FW-01` | DMZ/edge firewall, ACLs, NAT/PAT, IPsec site-to-site to Wan Chai | **Cisco ASA 5506-X** device, **ASA 9.16(4)** image, in Packet Tracer 8.2.2 | n/a | n/a | n/a | 3 (outside/inside/dmz) + management | PT logical only | L3 |
| 9 | `VP-BR-EDGE-01` | Kwun Tong branch router (OSPF area 0 spoke, inter-VLAN routing) | Cisco IOS 15.2 (PT bundled) | n/a | n/a | n/a | 4 | PT logical only | L3 |
| 10 | `VP-BR-DSW-A01` | Kwun Tong access switch | Cisco IOS 15.2 (PT bundled) | n/a | n/a | n/a | 24 | PT logical only | L3 |
| 11 | `VP-MO-EDGE-01` | Macau router (EIGRP AS 100, redistribution boundary) | Cisco IOS 15.2 (PT bundled) | n/a | n/a | n/a | 4 | PT logical only | L3 |
| 12 | `VP-MO-DSW-A01` | Macau access switch | Cisco IOS 15.2 (PT bundled) | n/a | n/a | n/a | 24 | PT logical only | L3 |
| 13 | `VP-WC-EDGE-01` | Wan Chai router (IPsec + WireGuard peer, small BGP AS 65021) | Cisco IOS 15.2 (PT bundled) | n/a | n/a | n/a | 4 | PT logical only | L3 |
| 14 | `VP-WC-DSW-A01` | Wan Chai access switch | Cisco IOS 15.2 (PT bundled) | n/a | n/a | n/a | 24 | PT logical only | L3 |
| 15 | `VP-ISP-EDGE-01` | Simulated transit provider edge, AS 65000 | Cisco IOS 15.2 (PT bundled) | n/a | n/a | n/a | 4 | PT logical only | L3 |
| 16 | `VP-HQ-VOICE-01` | CUCM Express telephony service (`telephony-service`, ephone-dn) | Cisco IOS 15.2 (PT bundled) | n/a | n/a | n/a | 1 | PT logical only | L3 (supporting) |
| 17 | `vpnz-dc01` | AD DS DC, DNS, DHCP, AD CS (or issuing CA), NTP source | Windows Server 2025 Standard (Desktop Experience), build 10.0.26100.1742 **[ASSUMPTION: exact patch level]** | 2 | 4 GB | 60 GB | 1 | `VNET-SRV` | L1, L4 |
| 18 | `vpnz-dc02` | Second AD DS DC, DNS, DHCP partner, GC | same as #17 | 2 | 4 GB | 60 GB | 1 | `VNET-SRV` | L1, L4 |
| 19 | `vpnz-fs01` | File server, FSRM quotas and file screening, DFS-R, backup target | Windows Server 2025 Standard | 2 | 4 GB | 80 GB + 20 GB data VHDX/VMDK | 1 | `VNET-SRV` | L1, L4 |
| 20 | `vpnz-san01` | iSCSI target (LUN01 20 GB, LUN02 40 GB, LUN03 60 GB thin) | Windows Server 2025 Standard, iSCSI Target Server role | 2 | 4 GB | 30 GB OS + 120 GB thin LUNs | 1 | `VNET-STOR` | L1 |
| 21 | `vpnz-rras01` | RRAS IKEv2 remote-access VPN + NPS/RADIUS | Windows Server 2025 Standard | 2 | 4 GB | 60 GB | 1 | `VNET-SRV` | L1 |
| 22 | `vpnz-lnxra01` | OpenVPN server, Easy-RSA CA, host firewall | Ubuntu Server 24.04.3 LTS (Noble Numbat) | 2 | 4 GB | 40 GB | 1 | `VNET-SRV` | L2, L1 (reliance) |
| 23 | `vpnz-mon01` | Ansible control node, Git server, Prometheus, Grafana, Loki, TFTP/SCP config archive, NTP | Ubuntu Server 24.04.3 LTS | 4 | 8 GB | 100 GB | 1 | `VNET-SRV` | L4, L5 (data source) |
| 24 | `vpnz-ai01` | OpenClaw agent runtime, MCP tool bridge, read-only collector | Ubuntu Server 24.04.3 LTS | 4 | 8 GB | 60 GB | 1 | `VNET-SRV` | L5 |
| 25 | `vpnz-nft01` | nftables stateful firewall, NAT, keepalived master | Ubuntu Server 24.04.3 LTS | 2 | 4 GB | 40 GB | 2 | `VNET-EGRESS` + `VNET-WAN` | L2, L4 |
| 26 | `vpnz-nft02` | keepalived backup, identical ruleset | Ubuntu Server 24.04.3 LTS | 2 | 4 GB | 40 GB | 2 | `VNET-EGRESS` + `VNET-WAN` | L2, L4 |
| 27 | `vpnz-dmzrev01` | Nginx reverse proxy, TLS termination, keepalived master | Ubuntu Server 24.04.3 LTS | 2 | 4 GB | 40 GB | 2 | `VNET-DMZ` + `VNET-CORE` | L2, L1 (reliance) |
| 28 | `vpnz-dmzrev02` | Nginx reverse proxy, keepalived backup | Ubuntu Server 24.04.3 LTS | 2 | 4 GB | 40 GB | 2 | `VNET-DMZ` + `VNET-CORE` | L2 |
| 29 | `vpnz-dmzweba01` | IIS application tier node 1, ASP.NET sample app, behind the proxy | Windows Server 2025 Standard | 2 | 4 GB | 60 GB | 1 | `VNET-DMZ` | L1 |
| 30 | `vpnz-dmzweba02` | IIS application tier node 2 | Windows Server 2025 Standard | 2 | 4 GB | 60 GB | 1 | `VNET-DMZ` | L1 |
| 31 | `vpnz-dmzwp01` | WordPress node 1 (Nginx + PHP-FPM + MariaDB), blog front end | Ubuntu Server 24.04.3 LTS | 2 | 4 GB | 40 GB | 1 | `VNET-DMZ` | L2 |
| 32 | `vpnz-dmzwp02` | WordPress node 2 | Ubuntu Server 24.04.3 LTS | 2 | 4 GB | 40 GB | 1 | `VNET-DMZ` | L2 |
| 33 | `vpnz-dmzjump01` | DMZ jump/proxy host; the only management path into the DMZ | Ubuntu Server 24.04.3 LTS | 2 | 2 GB | 60 GB (backup repository) | 1 | `VNET-DMZ` | L2, L4 |
| 34 | `vpnz-jump01` | Privileged access workstation: RDP/WinRM admin entry point, MMC consoles, PowerShell 7.4 host | Windows Server 2025 Standard | 2 | 4 GB | 60 GB | 1 | `VNET-MGMT` | L1, L4 |
| 35 | `vpnz-brdc01` | Kwun Tong RODC, DNS, DHCP relay, local file cache | Windows Server 2025 Standard | 2 | 4 GB | 60 GB | 2 | `VNET-SRV` + `VNET-USER` **[ASSUMPTION: the second NIC is only to place the RODC into VLAN 113 logically; reduce to one NIC if the hypervisor cannot reach that VMnet]** | L1 |
| 36 | `vpnz-hvhost01` | Hypervisor host (not a guest) | Windows 11 Pro 24H2/25H2 host + VMware Workstation Pro 17.6.2 | host CPUs | host RAM | host disk | 2 physical (LAN + spare) + host-only VMnets | — | all |

**Row count: 36 rows = 16 Packet Tracer logical devices + 19 virtual machines + 1 hypervisor host.** Of the 19 virtual machines there are **9 Windows Server guests** and **10 Ubuntu/Linux guests**. `vpnz-hvhost01` is the physical host and is not a guest. `VP-HQ-DSW-A01..A04` are four separate devices (rows #3–#6), not one. The optional, not-counted `vpnz-pki01` (§13.4 O-06) would make it 20 VMs.

**Base-image rule [DECIDED]:** every Windows guest except the DCs is a full clone of one sysprepped template `W2K25-TEMPLATE-01`; every Ubuntu guest is a full clone of `UBU2404-TEMPLATE-01`. Template disks must not be included in the running count while shut down. This is what makes 19 VMs feasible on one host.

**Unicast MAC convention [DECIDED]:** all lab MAC addresses are hand-assigned in the VMware range `00:50:56:3F:xx:yy`, ignored by Cisco or Packet Tracer.

### 6.1 Hypervisor recommendation **[DECIDED]**
**Recommended default: VMware Workstation Pro 17.6.2** (free for personal use; runs on Windows 11 Pro). **[VERIFIED: existence of a 17.6.2 Pro release]** — release notes page: <https://techdocs.broadcom.com/us/en/vmware-cis/desktop-hypervisors/workstation-pro/17-0/release-notes/vmware-workstation-1762-pro-release-notes.html>. **[ASSUMPTION]** — that the free-personal-use entitlement still applies to this exact build at the time of build; this must be re-checked at build time and, if the entitlement has changed, the group switches to VirtualBox rather than paying.

Why Workstation Pro is the default:
1. Virtual Network Editor gives **arbitrary numbers of host-only VMnets with a chosen subnet and with the built-in DHCP service switchable off** — which is exactly what §5 and §6 need, and which is the single hardest requirement to satisfy on the alternatives.
2. Snapshot and linked-clone workflows make a 19-VM build reproducible for four students on four different laptops, and let the evidence for §1.4 be regenerated.
3. Broadest documentation and the most tutorial material for Windows and Ubuntu guests, which matters because three of the four group members will not have used it before.

**Named alternatives [DECIDED]**
| Alternative | Can it satisfy this baseline? | Conditions and trade-offs |
|---|---|---|
| **Oracle VirtualBox 7.1.x** | Yes, with one caveat | Host-only networks must each be created by hand (`VBoxManage hostonlyif create`) and the built-in DHCP server disabled per network; max ~8 host-only networks by default, which is exactly at the edge of what §6 needs (`VNET-MGMT`, `CORE`, `SRV`, `EGRESS`, `DMZ`, `STOR`, `USER`, `WAN`, `LAB` = 9). Workaround: put `VNET-STOR` and `VNET-LAB` on internal networks instead of host-only ones, and document that change. Bridged mode must remain disabled. |
| **Microsoft Hyper-V (Windows 11 Pro, included)** | Yes, with two caveats | (a) Hyper-V takes control of the host network stack, so VMware/VirtualBox cannot coexist on the same host. (b) The default switch and NAT switch are hard-wired to the host; custom internal-only virtual switches must be created in PowerShell and each guest's VLAN isolation is only as good as the switch design. Guest `RRAS`/DHCP interact correctly, but the host must never run DHCP. |
| **Proxmox VE 8.x** | **No** as a workstation hypervisor | Bare-metal type-1; would need a dedicated machine, which conflicts with §1.3 ("single hypervisor host", student-owned PC). Listed only to explain why it was rejected. |
| **Nested Packet Tracer inside a VM** | Not recommended | Packet Tracer is installed on the host, not inside a guest. Running it inside a VM wastes RAM and complicates screen capture. |

**Portability rule [DECIDED]:** because the hypervisor is not finally chosen, every later writer must express VM specifications **generically** (vCPU, RAM, disk, NIC, "host-only network with subnet X, DHCP off"). Hypervisor-specific wording ("VMnet4", "VBoxManage") belongs only in the build manual's per-hypervisor appendix, never in the design chapter.

---

## 7. Software and Version Pinning List

| Component | Pinned version | Status | Where it runs | Note / fallback |
|---|---|---|---|---|
| Hypervisor | VMware Workstation Pro 17.6.2 | **[VERIFIED existence]** / **[ASSUMPTION usability]** | `vpnz-hvhost01` | Fallback: VirtualBox 7.1.x — see §6.1 |
| Hypervisor host OS | Windows 11 Pro, 24H2 or 25H2 (build 26100.x) | **[ASSUMPTION]** | Host | Any Windows 11 Pro build that supports the chosen hypervisor is acceptable; record the exact build in the build manual |
| Windows Server | Windows Server 2025 Standard, Desktop Experience, build `10.0.26100.1742` | **[ASSUMPTION: exact patch level]** — the base build `10.0.26100` is **[VERIFIED]** | 9 of the Windows guests | 180-day evaluation licence, or the campus volume/media licence. Fallback if 2025 media is unavailable: **Windows Server 2022** (21H2, build 20348) — all roles used here exist there too; note the substitution in the report |
| Windows client OS (optional, for the VPN client demonstration) | Windows 11 Pro 24H2 | **[ASSUMPTION]** | Any laptop used as the road-warrior client | The IKEv2 and OpenVPN clients are built into Windows; no extra purchase |
| Linux server OS | Ubuntu Server **24.04.3 LTS** (Noble Numbat) | **[VERIFIED: 24.04.3 exists]** | 11 Linux guests | Fallback: Ubuntu Server 24.04.x latest point release, or Debian 13 if the group prefers; nothing in this baseline depends on Ubuntu-specific behaviour except package versions, which is why they are pinned below |
| Cisco Packet Tracer | **8.2.2** (64-bit Windows) | **[UNCERTAIN: version number]** — the "*8.2.2*" designation is stated from memory and must be confirmed against the Cisco NetAcad download page at build time | Host | Fallback: whatever current NetAcad-supported release is available to the group's NetAcad account. **The report must state the exact build actually used.** No third-party or mirrored installer may be used |
| Packet Tracer ASA device | **Cisco ASA 5506-X** with **ASA 9.16(4)** image | **[UNCERTAIN]** — PT does ship an ASA5506-X device; the exact image string must be read from the device's `show version` during the build and recorded | PT logical | Fallback if the ASA5506-X is not present in the group's PT build: use the **ASA 5505** device (older, PT-classic) and document that the newer model was unavailable. **Do not** claim in the report that PT's ASA is a faithful 5506-X |
| Routing/switching images inside PT | Cisco IOS 15.2-family image bundled with the PT release (e.g. `c2960-...`, `c1900-...`) | **[UNCERTAIN: exact strings]** | PT logical | Fallback: use whichever routers/switches the group's PT build offers; record the exact `show version` output as evidence |
| Ansible | `ansible-core` 2.18.x with the `ansible` community package **11.x** | **[VERIFIED: community package 11 and its collections exist]** | `vpnz-mon01` (control node) | Fallback: install from `pipx`/`pip` in a virtual environment inside `vpnz-mon01`; `apt install ansible-core` on Ubuntu 24.04 gives an older core if the pin cannot be met — record the version actually present |
| WinRM / pywinrm for Windows targets | `pywinrm` 0.5.0 | **[ASSUMPTION]** | `vpnz-mon01` | Needed for Ansible to reach Windows guests over WinRM |
| PowerShell | **Windows PowerShell 5.1** (in-box) for all scripts run *on* Windows guests, plus **PowerShell 7.4 LTS** on `vpnz-jump01` for authoring and cross-platform scripts | **[ASSUMPTION: 7.4 LTS]** | All Windows guests | Fallback: use only in-box 5.1 if PowerShell 7 installation is blocked. The report must state which runtime each script was tested on — do not claim 7.4 if only 5.1 was used |
| nftables | **1.0.9** (Ubuntu 24.04 repository version) | **[ASSUMPTION]** | `vpnz-nft01/02`, `vpnz-lnxra01` | Fallback: whatever `nft --version` reports in the installed 24.04 image; record it |
| Nginx | **1.24.0** (Ubuntu 24.04 `nginx` package) | **[ASSUMPTION]** | `vpnz-dmzrev01/02`, `vpnz-dmzwp01/02` | Ubuntu 24.04's own nginx lags upstream stable; that is acceptable and **must be stated as a deliberate choice of distro-packaged nginx**. Alternative if a newer feature is required: nginx.org mainline build |
| Keepalived | **2.2.8** (Ubuntu 24.04 repository version) | **[ASSUMPTION]** | `vpnz-dmzrev01/02`, `vpnz-nft01/02` | Fallback: whatever `keepalived --version` reports |
| OpenVPN | **2.6.x** (Ubuntu 24.04 repository version; expected 2.6.9–2.6.12) | **[ASSUMPTION: minor]** / **[VERIFIED: 2.6 series is the current Ubuntu 24.04 series]** | `vpnz-lnxra01` | Fallback: record the exact `openvpn --version` output |
| WireGuard | `wireguard-tools` **1.0.20210914** with the in-kernel module (Ubuntu 24.04 6.8/6.14 HWE kernel) | **[ASSUMPTION]** | `vpnz-nft01/02`, `VP-WC-EDGE-01` logical peer | Fallback: the userspace Go implementation if the kernel module is unavailable in a VM |
| Easy-RSA | **3.1.x** (Ubuntu 24.04 `easy-rsa` package) | **[VERIFIED existence of the package in Noble]** | `vpnz-lnxra01` | Used for the OpenVPN PKI and as an independent CA. Fallback: Easy-RSA 3.0.8 tarball if the package is absent |
| IIS / ASP.NET | IIS 10.0 on Windows Server 2025 with **ASP.NET Core 8.0 LTS Hosting Bundle** | **[ASSUMPTION: 8.0 LTS]** | `vpnz-dmzweba01/02` | Fallback: a static HTML page if the hosting bundle cannot be downloaded in the lab |
| WordPress | **6.4.x or later**, MariaDB **10.11** (Ubuntu 24.04 packaged) | **[ASSUMPTION]** | `vpnz-dmzwp01/02` | Content is generated by the group; nothing may be downloaded from the Internet that is not in the Ubuntu archive or on wordpress.org |
| Prometheus / Grafana | Prometheus **2.5x**, Grafana **11.x**, Loki **3.x** | **[ASSUMPTION]** | `vpnz-mon01` | Fallback if resource-constrained: drop Loki and use rsyslog → file → Grafana text panel |
| `windows_exporter` | **0.29.x** | **[ASSUMPTION]** | All Windows guests | Fallback: PowerShell + WinRM scraping instead of the exporter |
| `node_exporter` | **1.8.x** | **[ASSUMPTION]** | All Linux guests | — |
| OpenClaw agent runtime | Version **not pinned** — must be recorded from the deployed instance | **[UNCERTAIN — highest-uncertainty component in this baseline]** | `vpnz-ai01` | See §12.5 for the mandatory fallback design. **No URL, version or capability claim about OpenClaw may be written into the report without a screenshot of the running instance and a citation to the documentation actually used** |
| Git | Git **2.43+** on `vpnz-mon01` (Gitea or bare repositories over SSH) | **[ASSUMPTION]** | `vpnz-mon01` | Fallback: bare repos + `git` over SSH, no web UI |
| Syslog receiver | `rsyslog` **8.2312** (Ubuntu 24.04 packaged) forwarding to Loki, or plain files | **[ASSUMPTION]** | `vpnz-mon01` | — |
| Text editor / diagramming | Diagrams: draw.io (offline desktop build) or LibreOffice Draw | **[ASSUMPTION]** | Student laptops | Packet Tracer's own screenshots and `show` output are the primary evidence; hand-drawn topology images are secondary |

**Pinning discipline [DECIDED]:** every version above must be re-verified at build time with a version-printing command, and the *actual* output captured as evidence. Where the actual version differs from this table, the report must contain a short "version deviations" subsection listing each difference and its impact. Silently documenting a version that does not match the running system is a reportable integrity failure for this project.

---

## 8. Naming, Domain and Path Conventions

### 8.1 Naming scheme **[DECIDED]**
| Object class | Pattern | Examples |
|---|---|---|
| Packet Tracer routers | `VP-{SITE}-EDGE-{NN}` | `VP-HQ-EDGE-01`, `VP-BR-EDGE-01`, `VP-WC-EDGE-01`, `VP-MO-EDGE-01` |
| Packet Tracer core switches | `VP-HQ-CORE-{NN}` | `VP-HQ-CORE-01`, `VP-HQ-CORE-02` |
| Packet Tracer access switches | `VP-{SITE}-DSW-A{NN}` | `VP-HQ-DSW-A01`, `VP-BR-DSW-A01` |
| Packet Tracer firewall | `VP-{SITE}-FW-{NN}` | `VP-HQ-FW-01` |
| Packet Tracer voice device | `VP-{SITE}-VOICE-{NN}` | `VP-HQ-VOICE-01` |
| Virtual machines | `vpnz-{role}{NN}` (lower case, no separators) | `vpnz-dc01`, `vpnz-dmzrev01`, `vpnz-nft02` |
| Hypervisor host | `vpnz-hvhost01` | — |
| VM templates | `W2K25-TEMPLATE-01`, `UBU2404-TEMPLATE-01`, `ROCKY-TEMPLATE-01` (reserve only) | — |
| Linux network interface | `ens192`/`ens224` — **do not hard-code**; always resolve with `ip -br link` and document the actual name | — |
| Windows interface alias | `SRV-VLAN30`, `MGMT-VLAN20`, `DMZ-VLAN90` | set with `Rename-NetAdapter` so that later scripts never depend on "Ethernet 2" |
| Cisco interface description | `[to {PEER} {PORT} VLAN{id} {ZONE}]` | `description [to VP-HQ-CORE-01 Gi1/0/1 VLAN10 Z-CORE]` |
| VLAN name | exactly as in §4 | `LAN-HQ-CORE`, `SRV-HQ-1` |
| Access-list (ASA and ACL) | `ACL-{ZONE}-{DIR}-{NN}` | `ACL-DMZ-OUT-10` |
| nftables table | `inet fyp_filter` | — |
| Keepalived VRRP `virtual_router_id` | 51 (nftables pair), 61 (nginx pair) | never reuse the same VRID on two different subnets that could ever be bridged |
| Firewall zone object (ASA) | `OBJ-NET-{ZONE}` | `OBJ-NET-DMZ`, `OBJ-NET-SRV` |
| Backup job | `BKP-{TARGET}-{FREQ}` | `BKP-DC01-DAILY`, `BKP-NFT-RULESET-WEEKLY` |

### 8.2 Hostname rules **[DECIDED]**
Windows/NetBIOS: ≤ 15 characters, upper-case in the Cisco/NetBIOS sense but lower-case in the OS/Ansible sense; the exact strings in §5.7 are canonical and must not be re-capitalised. Linux: lower-case, RFC 1123 hostname syntax. **No underscores in hostnames.** No hostname may exceed 15 characters:

| Hostname | Length | Verdict |
|---|---|---|
| `vpnz-dmzweba01` | 13 | OK |
| `vpnz-dmzjump01` | 13 | OK |
| `vpnz-rras01` | 11 | OK |
| `vpnz-hvhost01` | 13 | OK |
| `vpnz-dmzrev01` | 12 | OK |

### 8.3 Domain, DNS and NetBIOS names **[DECIDED]**
| Item | Exact value |
|---|---|
| AD DS forest root domain (and the only domain) | `vertexpeak.fyp.lab` |
| NetBIOS domain name | `VERTEXPEAK` (must be set explicitly; the 15-character auto-derivation must not be accepted blindly) |
| Forest/Domain functional level | Windows Server 2025 |
| UPN suffix | `vertexpeak.fyp.lab` (the default; no additional suffix) |
| Kerberos realm | `VERTEXPEAK.FYP.LAB` |
| AD-integrated DNS forward zone | `vertexpeak.fyp.lab` |
| Public/documentation suffix used in the report | `.example` (RFC 2606) |
| Simulated public service names | `portal.vertexpeak.example`, `www.vertexpeak.example`, `blog.vertexpeak.example` |
| DNS domain suffix pushed to clients | `vertexpeak.fyp.lab` (option 015) and search list `fyp.lab` (option 119) |
| Site names in AD Sites and Services | `HQ-ShaTin`, `BR-KwunTong`, `WC-WanChai`, `MO-Macau` |
| AD site subnet objects | every subnet in §5.2 is mapped to exactly one site; no subnet may be unmapped |
| **Do not use** | `.local`, `.lan`, `.home`, `.corp`, any real registered domain, `contoso.com`, `example.com` (the last is reserved and must not be used as a lab domain) |

### 8.4 Service accounts and groups **[DECIDED]**
All service accounts live in `OU=ServiceAccounts,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab`, are members of **no** privileged group except where stated, have "Password never expires" **disabled** (rotated by the automation playbook), "User cannot change password" **enabled**, and are documented with a 32-character random password stored in the group's password manager — **never** in Git.

| Account (sAMAccountName) | Purpose | Membership |
|---|---|---|
| `svc_ansible` | Ansible connecting to Windows guests over WinRM | Member of `GG-WINRM-Admins` only |
| `svc_backup` | Restic/rsync backup jobs, backup share access | Member of `GG-Backup-Operators` |
| `svc_monitoring` | Prometheus / `windows_exporter` read access, SNMPv3 user | Member of `GG-Monitoring-Readers` |
| `svc_aiagent` | The AI agent's read-only credential | Member of `GG-AI-ReadOnly` only. **Never** a member of Domain Admins, and see §12.5 |
| `svc_ldapbind` | LDAP bind for the WordPress authentication plug-in | Member of `GG-DMZ-LDAP-Readers` |
| `svc_git` | Gitea/Git SSH access from `vpnz-mon01` | Member of `GG-DevOps-Users` |
| `adm-{initials}` (4 accounts, one per student) | Personal, named administrative accounts | Member of `GG-Server-Admins`; **two** of the four are also in `GG-Tier0-Admins` and are the only accounts permitted to touch `vpnz-dc01/02` |
| `da-vertexpeak` | Break-glass Domain Admin | Member of `Domain Admins`; password sealed in a physical envelope held by the group supervisor; **not used** during normal operation, and any use must be logged in the report |
| `krbtgt` | Kerberos service account | Never touched; its reset (twice, as in a real recovery drill) is a documented disaster-recovery exercise only |

| Security group | Type | Purpose |
|---|---|---|
| `GG-Server-Admins` | Global, security | Administer members of the Member Servers OU |
| `GG-Tier0-Admins` | Global, security | Administer `vpnz-dc01/02` and the CA |
| `GG-Workstation-Admins` | Global, security | Manage workstations |
| `GG-Helpdesk` | Global, security | Password resets and unlock only, delegated at OU level |
| `GG-Finance-RW`, `GG-Finance-RO` | Global, security | FSRM share permissions |
| `GG-Engineering-RW` | Global, security | Engineering share |
| `GG-Sales-RO` | Global, security | Sales read access to the CRM export share |
| `GG-VPN-Users` | Global, security | RRAS/OpenVPN/WireGuard authorisation |
| `GG-VPN-ProfServices` | Global, security | `GG-VPN-Users` plus RDP to the platform tier |
| `GG-DMZ-LDAP-Readers` | Domain Local, security | Only the LDAP bind account |
| `GG-Monitoring-Readers` | Domain Local, security | Performance-counter read for Prometheus |
| `GG-AI-ReadOnly` | Domain Local, security | Event-log read only; granted nothing else |
| `GG-Infra-Admins` | Global, security | Linux sudo group mapping (`%gg-infra-admins` via SSSD, or a matching local group) |
| `DL-{Share}-{RW\|RO}` | Domain Local | Mapped one-to-one onto FSRM shares |

### 8.5 Certificate subjects and SANs **[DECIDED]**
Internal PKI: `VP-ROOT-CA` (offline, root) issuing `VP-ISSUING-CA-01` (online). If the group has only four members and 12 weeks, single-tier is acceptable: then `vpnz-dc01` is `VP-ISSUING-CA-01` and there is no `VP-ROOT-CA` — **state which model was used.**

| Certificate | Subject CN | SAN |
|---|---|---|
| Issuing CA | `CN=VP-ISSUING-CA-01, DC=vertexpeak, DC=fyp, DC=lab` | — |
| Domain controller | `CN=vpnz-dc01.vertexpeak.fyp.lab` | DNS `vpnz-dc01.vertexpeak.fyp.lab`, `vpnz-dc01`, `vertexpeak.fyp.lab`, `vpnz-dc01.vertexpeak.fyp.lab` IP |
| LDAPS on the DCs | same as domain controller template | — |
| RRAS IKEv2 server | `CN=vpn.vertexpeak.fyp.lab` | DNS `vpn.vertexpeak.fyp.lab`, `vpnz-rras01.vertexpeak.fyp.lab` |
| IIS web tier | `CN=www.vertexpeak.example` | DNS `www.vertexpeak.example`, `www.vertexpeak.fyp.lab` |
| Reverse proxy (public) | `CN=portal.vertexpeak.example` | DNS `portal.vertexpeak.example`, `portal.vertexpeak.fyp.lab` |
| WordPress (public) | `CN=blog.vertexpeak.example` | DNS `blog.vertexpeak.example` |
| WireGuard mTLS/management | `CN=vpnz-nft01.vertexpeak.fyp.lab` | DNS `wg.vertexpeak.fyp.lab` |
| ASA identity certificate | `CN=VP-HQ-FW-01.vertexpeak.fyp.lab` | DNS `VP-HQ-FW-01.vertexpeak.fyp.lab` |
| OpenVPN server | issued by Easy-RSA: `CN=server-vpnz-lnxra01` | none (OpenVPN uses CN only) |
| OpenVPN clients | `CN=client-{staffid}` | none |
| Certificates for staff laptops | `CN=vpn.vertexpeak.fyp.lab` on the IKEv2 client template, unique per machine | auto-enrolment |

Rules **[DECIDED]**: internal TLS certificates have a 397-day maximum validity (90 days preferred, renewed by a documented `certbot`/`acme.sh` dry run or by the AD CS renewal task); the **root** CA is 20 years; the **issuing** CA is 10 years. No self-signed certificate may be used for any service in the delivered design except during the documented build step where it is replaced later. Public-name certificates in the lab come from the internal PKI plus a documented **name mismatch warning** that the report must show and explain; no real public CA is used and none is claimed.

### 8.6 Repository layout at `C:\FYP` **[DECIDED]**
```
C:\FYP\
├── 00-baseline\        (this file and frozen copies of it; read-only after each freeze)
├── 01-proposal\        (proposal, Gantt, risk register, group charter, meeting minutes)
├── 02-design\          (design document chapters, topologies, IP/VLAN plan exports, decision log)
├── 03-build\
│   ├── packet-tracer\  (01-l2l3-core.pkt, 02-wan-routing.pkt, 03-asa-perimeter.pkt, 04-voice.pkt, 05-full.pkt)
│   ├── windows\        (per-VM build runbooks, screenshots, exported GPO backups, DISM notes)
│   └── linux\          (per-VM build runbooks, screenshots, package lists, `dpkg --get-selections` output)
├── 04-automation\
│   ├── ansible\        (see tree below)
│   ├── powershell\     (see below)
│   ├── bash\           (see below)
│   └── runs\           (timestamped run logs: `YAML: runs/YYYY-MM-DD_HHMM_playbook.log`)
├── 05-ai-netops\       (agent design, skill manifests, prompts, tool allow-list, output samples, limitations)
├── 06-verification\    (test plan, executed test records, `show`/`Get-` transcripts, iperf3 and ping results)
├── 07-evidence\        (PNG screenshots, named `{date}_{host}_{what}.png`, e.g. `2026-10-06_vpnz-dc01_dcdiag.png`)
├── 08-references\      (PDFs/pages of cited standards, RFCs, vendor docs; one file per citation)
├── 09-templates\       (report template, screenshot caption template, test-case template)
└── 10-final\           (assembled deliverables, PDF exports, presentation)
```
`04-automation/ansible`:
```
ansible/
├── ansible.cfg
├── inventory/
│   ├── lab.ini                 (the single inventory file; groups: linux_servers, windows_servers, dmz,
│   │                            network_devices, ai, mgmt)
│   └── group_vars/
│       ├── all.yml             (domain name, NTP server, DNS servers, admin groups)
│       ├── windows_servers.yml
│       ├── linux_servers.yml
│       └── dmz.yml
├── playbooks/
│   ├── 01-baseline-windows.yml
│   ├── 02-baseline-linux.yml
│   ├── 03-nginx-reverseproxy.yml
│   ├── 04-keepalived.yml
│   ├── 05-nftables-egress.yml
│   ├── 06-wireguard.yml
│   ├── 07-ad-users.yml
│   ├── 08-collect-network-configs.yml
│   └── 09-verify-services.yml
├── roles/
│   ├── common/, nginx/, keepalived/, nftables/, wireguard/, winrm/, ad_users/
├── files/              (static configs, e.g. `files/dmzrev01/nginx.conf`)
├── templates/          (Jinja2: `nftables.conf.j2`, `keepalived.conf.j2`, `wg0.conf.j2`)
└── logs/               (per-run `ansible.log`)
```
`04-automation/powershell`:
```
powershell/
├── Invoke-NewStarterOnboarding.ps1     (creates user, mailbox-less account, groups, home dir, FSRM quota)
├── Get-ADHealthReport.ps1              (replication, FSMO, DNS, SYSVOL, time skew → CSV + HTML)
├── Backup-NetworkDeviceConfig.ps1      (TFTP/SCP pull of every device config → config archive)
├── Test-ServiceEndpoints.ps1           (the §10 port matrix as an executable test)
├── Export-GPOBackup.ps1                (documented backup of every GPO)
├── modules/VPCommon/                   (shared functions; versioned)
└── logs/                               (`YYYY-MM-DD_script.log`)
```
`04-automation/bash`:
```
bash/
├── 01-hardening-baseline.sh      (sysctl, SSH, unattended-upgrades, auditd)
├── 02-nftables-apply.sh          (atomic ruleset apply with rollback timer)
├── 03-keepalived-check.sh        (VRRP state verification and failover test)
├── 04-backup-restic.sh           (backup to vpnz-dmzjump01)
├── 05-cert-renew.sh              (certificate expiry check and renewal)
├── lib/common.sh                 (logging, error handling, `set -euo pipefail`)
└── logs/
```

### 8.7 Configuration file paths (exact) **[DECIDED]**
Linux guests only — Windows keeps its own defaults except as noted.

| Path | Owner/mode | Content |
|---|---|---|
| `/etc/netplan/50-cloud-init.yaml` (edit only if netplan is in use; otherwise `/etc/systemd/network/10-static.network`) | root:root 0600 | Static addressing per §5.7 |
| `/etc/nginx/nginx.conf` | root:root 0644 | Global config |
| `/etc/nginx/conf.d/00-upstreams.conf` | root:root 0644 | Upstream pools: `upstream weba_pool { server 10.10.90.21:443; server 10.10.90.22:443; }`, `upstream wp_pool { server 10.10.90.25:443; server 10.10.90.26:443; }` |
| `/etc/nginx/conf.d/10-portal.conf` | root:root 0644 | `portal.vertexpeak.example` vhost (TLS termination) |
| `/etc/nginx/conf.d/20-blog.conf` | root:root 0644 | `blog.vertexpeak.example` vhost |
| `/etc/nginx/sites-available/portal` + `sites-enabled/portal` | symlink | Alternative layout is **not** used; `conf.d` is canonical |
| `/etc/nginx/ssl/portal.crt`, `portal.key`, `chain.crt` | root:root 0600 (key) | TLS material from the internal PKI |
| `/etc/nginx/.htpasswd-portal` | root:root 0640 | Basic-auth test account only (documented as a lab control, not production) |
| `/etc/keepalived/keepalived.conf` | root:root 0644 | VRRP instance, `virtual_router_id` per §8.1, `state`, `priority`, `virtual_ipaddress`, `track_script` |
| `/etc/nftables.conf` | root:root 0644 | Main ruleset, `flush ruleset` + `table inet fyp_filter` |
| `/etc/nftables.d/10-sets.nft`, `20-filter-input.nft`, `30-filter-forward.nft`, `40-nat.nft`, `90-logging.nft` | root:root 0644 | Included fragments; **nftables is one ruleset** — the fragments are `include`d, never independently loaded |
| `/etc/wireguard/wg0.conf` | root:root 0600 | WireGuard interface (never world-readable; also listed in `.gitignore`) |
| `/etc/openvpn/server/server.conf` | root:root 0644 | OpenVPN server |
| `/etc/openvpn/client/` , `/etc/openvpn/ccd/` | root:root 0700 | Client configs and per-client overrides |
| `/etc/openvpn/easy-rsa/` | root:root 0700 | Easy-RSA PKI (`pki/` holds private keys — **never** committed to Git) |
| `/etc/ssh/sshd_config.d/10-fyp-hardening.conf` | root:root 0644 | `PermitRootLogin no`, `PasswordAuthentication no` for Linux-to-Linux, `AllowGroups gg-infra-admins` |
| `/etc/sysctl.d/99-fyp-hardening.conf` | root:root 0644 | `net.ipv4.ip_forward=1` on routers, `rp_filter`, SYN-cookie, ICMP behaviour |
| `/etc/rsyslog.d/50-fyp-forward.conf` | root:root 0644 | Forward to `10.10.30.31:514` (UDP) |
| `/etc/prometheus/prometheus.yml`, `/etc/prometheus/targets/*.yml` | prometheus:prometheus | Scrape configuration |
| `/etc/grafana/grafana.ini` | root:grafana 0640 | Provisioned dashboards `fyp-overview`, `fyp-security`, `fyp-availability` |
| `/srv/backup/` | root:root 0700 | Restic repository (on `vpnz-dmzjump01`) |
| `/srv/tftp/` | root:root 0755 | Network device configuration archive targets |
| `/opt/openclaw/` | root:root 0755 | Agent runtime working directory; `/opt/openclaw/skills/` holds the four Skill manifests |
| `/opt/openclaw/logs/agent.jsonl` | root:root 0640 | Every agent invocation, prompt hash and tool call (the audit evidence for §12.5) |
| `/var/log/fyp/*.log` | root:adm 0640 | Local application logs for scripts not using journald |

Windows guests:

| Path | Content |
|---|---|
| `C:\FYP\logs\` | Script logs (`YYYY-MM-DD_{script}.log`) |
| `C:\FYP\config\` | Exported service baselines (`netsh advfirewall export`, `Get-DhcpServerv4Scope`, DNS zone exports) |
| `C:\FYP\evidence\` | Screenshot staging before transfer to the repository |
| `D:\Shares\Finance`, `D:\Shares\Engineering`, `D:\Shares\SalesRO`, `D:\Shares\Public` | FSRM-managed shares (quota 20 GB/10 GB/10 GB/5 GB, screen `*.exe;*.vbs;*.mp3`) |
| `D:\iSCSI\LUN01..LUN03` | iSCSI target VHDs |
| `\\vpnz-fs01\Shares\...` | UNC paths used verbatim in the report |
| `C:\PerfLogs\FYP\` | Data Collector Set output |
| `C:\Windows\System32\winevt\Logs\` | Event logs referenced by the AI tool surface |

---

## 9. Domain and Identity Design

### 9.1 Forest and domain **[DECIDED]**
- One forest, one domain, one tree: `vertexpeak.fyp.lab` (NetBIOS `VERTEXPEAK`), functional level Windows Server 2025.
- Two domain controllers at HQ (`vpnz-dc01` FSMO holder: Schema, Domain Naming, RID, PDC, Infrastructure; `vpnz-dc02` GC and DNS) and one RODC at Kwun Tong (`vpnz-brdc01`). The RODC has its own filtered credential set and a documented password-replication policy.
- DNS: AD-integrated, secure-only dynamic updates, scavenging 7 days, forwarders `192.0.2.53`, `192.0.2.54` (simulated).
- Time: `vpnz-dc01` is the authoritative NTP source for the forest, syncs to the simulated provider `192.0.2.53`; all other Windows machines sync to `vertexpeak.fyp.lab`; all Linux machines sync to `10.10.30.11` with `10.10.30.12` as the second source. **Time skew must be less than 5 minutes or Kerberos fails — this is a documented troubleshooting scenario.**
- Sites and subnets per §5.2, with `HQ-ShaTin` and `BR-KwunTong` linked by a site link with a 15-minute replication interval.

### 9.2 OU structure (exact, verbatim) **[DECIDED]**
```
vertexpeak.fyp.lab
└── OU=VertexPeak
    ├── OU=Users
    │   ├── OU=HQ-ShaTin
    │   │   ├── OU=Engineering
    │   │   ├── OU=SalesOps
    │   │   ├── OU=Finance
    │   │   ├── OU=HumanResources
    │   │   ├── OU=IT
    │   │   └── OU=Support
    │   ├── OU=BR-KwunTong
    │   ├── OU=WC-WanChai
    │   ├── OU=MO-Macau
    │   └── OU=RemoteAndContractors
    ├── OU=Computers
    │   ├── OU=Servers
    │   │   ├── OU=MemberServers
    │   │   ├── OU=Tier0-DomainControllers
    │   │   └── OU=DMZ-Servers
    │   ├── OU=Workstations
    │   │   ├── OU=HQ
    │   │   └── OU=Branches
    │   └── OU=LinuxServers        (computer objects for SSSD-joined Linux, if joined)
    ├── OU=Groups
    │   ├── OU=Global
    │   ├── OU=DomainLocal
    │   └── OU=RoleBased
    ├── OU=ServiceAccounts
    ├── OU=Admins
    │   ├── OU=Tier0
    │   ├── OU=Tier1
    │   └── OU=BreakGlass
    ├── OU=Network
    │   ├── OU=PacketTracerDevices   (documentation objects; PT is not domain-joined)
    │   └── OU=PrinterAndVoIP
    └── OU=Quarantine
        ├── OU=Disabled
        └── OU=NewObjects
```
Rules **[DECIDED]**: default `CN=Users` and `CN=Computers` containers are used only by the RODC and by nothing else — every user and computer object must live in the tree above before the build is considered complete. Delegation: `GG-Helpdesk` gets "Reset password" and "Read/Write userAccountControl" on `OU=Users` only. `GG-Server-Admins` gets local-admin via **Group Policy restricted groups or LAPS**, not via Domain Admins.

### 9.3 Group Policy objects (the baseline set) **[DECIDED]**
| GPO name | Linked to | Purpose (test-verifiable) |
|---|---|---|
| `GPO-WS-Baseline-Security` | `OU=Computers/OU=Workstations` | Firewall on for all profiles, screen lock 10 min, SMB signing, LLMNR off, USB mass storage read-only |
| `GPO-WS-Deploy-CA-Root` | domain root | Distributes `VP-ROOT-CA`/`VP-ISSUING-CA-01` so internal TLS is trusted |
| `GPO-WS-Drive-Maps` | `OU=Users` | Finance/Engineering/SalesRO mapped drives via item-level targeting |
| `GPO-WS-PowerShell-Logging` | domain root | Script-block and transcription logging to `\\vpnz-fs01\Logs` (this is the audit trail the due-diligence item requires) |
| `GPO-WS-Windows-LAPS` | `OU=Computers` | Local administrator password rotation |
| `GPO-WS-Cert-AutoEnrol` | domain root | Auto-enrolment of the IKEv2 machine template |
| `GPO-WS-IKEv2-VPN-Profile` | `OU=Users/OU=RemoteAndContractors` | Always-on IKEv2 VPN connection profile with certificate authentication |
| `GPO-SRV-Member-Server-Baseline` | `OU=Servers/OU=MemberServers` | WinRM enabled, RDP restricted to `GG-Server-Admins`, audit policy (logon, object access, process creation with command line) |
| `GPO-SRV-DMZ-Baseline` | `OU=Servers/OU=DMZ-Servers` | No domain admin logon, separate local accounts, restricted logon rights (DMZ hosts are domain-joined only if the "no cached credential" trade-off is accepted — **the group must record its decision in the decision log either way**) |
| `GPO-SRV-Tier0-Baseline` | `OU=Servers/OU=Tier0-DomainControllers` | Interactive logon restricted to `GG-Tier0-Admins`, DC hardening, SYSVOL audit |
| `GPO-Audit-Advanced` | domain root | The advanced audit subcategory set used by the AI agent's triage (4624, 4625, 4740, 4720, 4728, 4732, 7045) |

**Design decision to record [DECIDED]:** two of the four students are Tier-0 (DCs and CA); the other two are Tier-1 (member servers, network, DMZ). The report must show this as a deliberate tiering model, with the justification and its limits.

### 9.4 Consistency with the Linux side **[DECIDED]**
- Linux hosts resolve DNS through `10.10.30.11` then `10.10.30.12` only. No public resolver is configured on any Linux guest.
- Linux sudo authority is a **local** group `gg-infra-admins` whose membership mirrors `GG-Infra-Admins`. If the group chooses to domain-join the Linux guests, `realmd`/`sssd` joins `vertexpeak.fyp.lab` and the local group becomes a mapped group; **the design must be identical in outcome either way**, i.e. the same four named administrators only.
- Administrators log in to Linux with the same personal account names as Windows (`adm-{initials}`), never with `root`, never with a shared account. `PermitRootLogin no` is mandatory.
- SSH keys are Ed25519, generated once per administrator, public keys stored in the Ansible repository (`files/ssh/authorized_keys/`), private keys never stored on `vpnz-mon01`.
- The same internal CA chain is trusted on both platforms: on Windows via GPO, on Linux via `/usr/local/share/ca-certificates/vp-root-ca.crt` + `update-ca-certificates`.
- Certificate and hostname conventions are identical on both sides (§8.5), so a certificate issued for `vpnz-lnxra01.vertexpeak.fyp.lab` is trusted on Windows and vice versa.

---

## 10. Port and Protocol Matrix

Direction is written as `source → destination`. `Zone` uses the codes of §3.2. Where a protocol is truly unlisted in the brief but required by the design, it is marked with `†` and must be justified in the report.

| # | Port / protocol | Service | Where it runs (host) | Zone → Zone | Purpose / test evidence |
|---|---|---|---|---|---|
| P-01 | 53/udp + 53/tcp | DNS | `vpnz-dc01`, `vpnz-dc02`, `vpnz-brdc01` | `Z-USER`,`Z-SERVER`,`Z-DMZ` → `Z-SERVER` | Name resolution; evidence: `Resolve-DnsName vpnz-dc01` and `dig` |
| P-02 | 67/udp + 68/udp | DHCP | `vpnz-dc01` (primary), `vpnz-dc02` (80/20), relay everywhere | `Z-SERVER` → `Z-USER` | Address assignment; evidence: `Get-DhcpServerv4Lease`, `ip a` |
| P-03 | 88/tcp + 88/udp | Kerberos | `vpnz-dc01/02`, `vpnz-brdc01` | `Z-USER`,`Z-SERVER` → `Z-SERVER` | Domain authentication; evidence: `klist` |
| P-04 | 389/tcp + 389/udp | LDAP | DCs | `Z-USER`,`Z-DMZ` (bind account only) → `Z-SERVER` | Directory reads; WordPress LDAP plug-in |
| P-05 | 636/tcp | LDAPS | DCs | `Z-SERVER`,`Z-DMZ` → `Z-SERVER` | Encrypted directory reads; evidence: `ldp.exe` connect 636 |
| P-06 | 445/tcp | SMB 3.1.1 | `vpnz-fs01`, DCs (SYSVOL/NETLOGON) | `Z-USER` → `Z-SERVER` | FSRM shares, quota and file-screen evidence |
| P-07 | 135/tcp + 49152–65535/tcp | RPC endpoint mapper / dynamic RPC | Windows guests | `Z-MGMT` → `Z-SERVER` | DFS-R, FSRM management, backup |
| P-08 | 3260/tcp | iSCSI | `vpnz-san01` (target) | platform-tier initiators → `Z-SERVER` VNET-STOR | LUN attachment; evidence: `Get-IscsiSession`, `diskpart` |
| P-09 | 3389/tcp | RDP | All Windows guests | `Z-MGMT` → all; `Z-REMOTE` → platform VMs only (TB-11) | Administration; **denied for ordinary users (TB-01)** |
| P-10 | 5985/tcp, 5986/tcp | WinRM (HTTP/HTTPS) | All Windows guests | `Z-SERVER` (`vpnz-mon01`) → `Z-SERVER`/`Z-DMZ`/`Z-USER`-mgmt | Ansible over WinRM; evidence: `Test-WSMan` |
| P-11 | 22/tcp | SSH | All Linux guests, plus Cisco devices (`transport input ssh`) | `Z-MGMT` and `vpnz-mon01` → targets | Administration and automation; evidence: `ssh -v` |
| P-12 | 123/udp (and 123/tcp for some clients) | NTP | `vpnz-dc01` (forest source), `vpnz-mon01` (Linux source) | all → `Z-SERVER` | Time integrity; evidence: `w32tm /stripchart`, `chronyc sources` |
| P-13 | 80/tcp | HTTP (redirect only) | `vpnz-dmzrev01/02`, `vpnz-dmzweba01/02`, `vpnz-dmzwp01/02` | Internet → `Z-DMZ`; `Z-MGMT` → targets | 301 redirect to 443; evidence: `curl -I` |
| P-14 | 443/tcp | HTTPS / TLS 1.2+ | reverse proxies, web farm, WordPress, Grafana (6516 is separate) | Internet → `Z-DMZ`; `Z-USER` → proxy | Published portal and blog; evidence: browser + `openssl s_client -connect` |
| P-15 | 443/udp | WireGuard | `vpnz-nft01/02` (VIP), WC peer | Internet → `Z-REMOTE` | Primary small-office and remote tunnel |
| P-16 | 500/udp + 4500/udp | IKEv2 / IPsec NAT-T | `vpnz-rras01` (RAS) and ASA `VP-HQ-FW-01` (site-to-site) | Internet → `Z-REMOTE` | Certificate-based VPN; evidence: `Get-VpnConnection`, ASA `show crypto ipsec sa` |
| P-17 | 1194/udp | OpenVPN | `vpnz-lnxra01` | Internet → `Z-REMOTE` | Second remote-access implementation |
| P-18 | 1812/udp + 1813/udp | RADIUS / RADIUS accounting | `vpnz-rras01` (NPS) | `Z-SERVER` → `Z-SERVER` | VPN authorisation + accounting; evidence: NPS log |
| P-19 | 6516/tcp | Windows Admin Center (WinRM gateway) | `vpnz-mon01` or `vpnz-jump01` | `Z-MGMT` → gateway | Browser-based server management |
| P-20 | 9090/tcp | Prometheus | `vpnz-mon01` | `Z-MGMT` → `Z-SERVER` | Metrics UI; evidence: `/targets` all UP |
| P-21 | 3000/tcp | Grafana | `vpnz-mon01` | `Z-MGMT` → `Z-SERVER` | Dashboards `fyp-overview`, `fyp-security`, `fyp-availability` |
| P-22 | 9100/tcp | node_exporter | All Linux guests | `vpnz-mon01` → targets | Host metrics |
| P-23 | 9182/tcp | windows_exporter | All Windows guests | `vpnz-mon01` → targets | Host metrics |
| P-24 | 514/udp † | Syslog | `vpnz-mon01` (receiver); senders = all Linux guests and all Cisco devices | all → `Z-MGMT` | Centralised logging; evidence: `/var/log/remote/{host}.log` |
| P-25 | 161/udp + 162/udp † | SNMPv3 (authPriv) and traps | Cisco devices, Linux guests, Windows guests | `vpnz-mon01` ↔ devices | Device monitoring; **SNMPv2c and community strings are forbidden** |
| P-26 | 69/udp † | TFTP (plus SCP/22) | `vpnz-mon01` (`/srv/tftp`) | Cisco devices ↔ `Z-SERVER` | Device configuration archive (`Backup-NetworkDeviceConfig.ps1`) |
| P-27 | 3306/tcp † | MariaDB | `vpnz-dmzwp01/02` (loopback only for the app; local socket preferred) | localhost | WordPress database; must not be reachable from outside the host |
| P-28 | 9000/tcp † | PHP-FPM | `vpnz-dmzwp01/02` | localhost / Nginx on same host | WordPress application tier |
| P-29 | 11211/tcp † | Memcached (optional object cache) | `vpnz-dmzwp01/02` | WordPress nodes → each other | Only if implemented; must be authenticated or bound to those two hosts |
| P-30 | 5432/tcp | PostgreSQL | Not used in the baseline | — | Listed only to state explicitly that it is **not** part of this design |
| P-31 | 53/tcp (zone transfer) | DNS AXFR | DCs only | `Z-SERVER` → `Z-SERVER` | Restricted to the two DCs; evidence: `dnscmd /zoneexport` |
| P-32 | 464/tcp + 464/udp | Kerberos password change | DCs | `Z-USER` → `Z-SERVER` | Password change; `kpasswd` |
| P-33 | 5989/tcp | WBEM/CIM (SFCB) | Linux guests, only if `sssd`/SCOM-style monitoring is used | `vpnz-mon01` → targets | **[ASSUMPTION]** Optional; drop if unused |
| P-34 | 18789/tcp | OpenClaw agent control/API endpoint | `vpnz-ai01` | `Z-MGMT` → `Z-SERVER` | **Local bind only; must not be reachable from `Z-USER`.** Exact default port is an **[ASSUMPTION]** and must be confirmed against the running instance and corrected here |
| P-35 | 51820/udp | WireGuard management tunnel | `vpnz-nft01` ↔ `vpnz-mon01` | `Z-MGMT` ↔ `Z-EGRESS` | Out-of-band escape hatch; disabled during the security test |

**Default-deny discipline [DECIDED]:** every table above is an allow-list. Any port not listed is denied in both directions. The report must contain one screenshot per zone boundary showing a denied packet (ASA `show logging` / nftables `log prefix` / capture in PT simulation mode).

---

## 11. Technology-to-Implementation Mapping (the honesty table)

For each of the five brief lines: what implements it, which named example from the brief is **COVERED**, which is **PARTIAL**, and which is **NOT COVERED**. A technology is only "COVERED" if a later writer can point to a configured device *and* a captured verification. Nothing in the "NOT COVERED" column may appear in a "what we implemented" list anywhere in the report.

### 11.1 L1 — Microsoft Server Networking and Network Services
| Brief example | Status | Implemented by / evidence |
|---|---|---|
| ADDS | **COVERED** | `vpnz-dc01`, `vpnz-dc02`, `vpnz-brdc01`; evidence `dcdiag /v`, `repadmin /replsummary`, AD Sites, OU tree of §9.2 |
| FSRM | **COVERED** | `vpnz-fs01`; quota templates (`20 GB Finance`, `10 GB Engineering`), file group `Blocked-Executables`, storage reports; evidence `Get-FsrmQuota`, `Get-FsrmFileScreen`, an actual blocked write |
| iSCSI | **COVERED** | `vpnz-san01` iSCSI Target Server, 3 LUNs, CHAP enabled, MPIO not used; evidence `Get-IscsiSession`, mounted volume, `Get-Disk` |
| RRAS | **COVERED** | `vpnz-rras01`; RRAS role, S2S and RAS, NAT not used (NAT is done by nftables); evidence `Get-RemoteAccess`, routing table, client connect |
| IKEv2 | **COVERED** | RRAS with IKEv2, machine + user certificate authentication, NPS authorization; evidence `Get-VpnConnection` EAP/cert details, RRAS `show` output |
| DNS / DHCP / DFS / GPO / NPS | **COVERED (additional, required by the design)** | §9 and §10 |
| Windows Server *failover clustering* (SOFS, Live Migration, S2D) | **NOT COVERED** | Cannot be demonstrated honestly on a single hypervisor host inside guests without nested-virtualisation risk and without a real shared-storage path. Must be listed as future work, **not** as a delivered feature |
| Microsoft Entra / hybrid identity, Exchange, SharePoint, Intune, System Center | **NOT COVERED** | Out of scope; explicitly out of the project's licence and time envelope |
| AD FS, AD RMS, DHCPv6, IPAM role | **NOT COVERED** | Not required by the brief; listed as deliberate exclusions |

### 11.2 L2 — Linux Server Administrations
| Brief example | Status | Implemented by / evidence |
|---|---|---|
| Nginx | **COVERED** | `vpnz-dmzrev01/02` (reverse proxy, TLS termination, `proxy_pass` to the two upstream pools) and `vpnz-dmzwp01/02`; evidence `nginx -t`, `curl -kI https://portal.vertexpeak.example`, access log |
| Keepalived | **COVERED** | Two independent VRRP pairs: nginx pair (`vrid 61`, VIP 10.10.90.10) and nftables pair (`vrid 51`, VIP 10.10.50.10); evidence failover capture — kill the master, VIP moves, service still answers, `journalctl -u keepalived` |
| nftables | **COVERED** | `vpnz-nft01/02` — `table inet fyp_filter`: input policy drop, forward policy drop, sets for the §3.5 peers, NAT (masquerade on the WAN side), connlimit, and `log prefix "NFT-DROP: "` on the drop rules; evidence `nft list ruleset`, `nft monitor`, log lines showing a denied flow |
| OpenVPN | **COVERED** | `vpnz-lnxra01`; full TLS PKI via Easy-RSA, per-client `ccd`, `tls-auth`/`tls-crypt`, pushed routes for `10.10.0.0/16` and `10.10.90.0/24`; evidence client connect from a host laptop and `ip route` on the client |
| WireGuard | **COVERED** | `vpnz-nft01/02` ↔ `VP-WC-EDGE-01`… **[LIMITATION]** a Cisco device cannot terminate WireGuard. **Resolution [DECIDED] — Rev 1.1 ruling OD-01 (Option A).** The Wan Chai peer is the *third Ubuntu VM* `vpnz-wcwg01` (2 vCPU / 2 GB / 20 GB, `VNET-WAN`, inner address `10.10.200.5`) that emulates the branch encrypting gateway, **or** — if the group prefers to keep Cisco in the picture — WireGuard is documented as the *remote-worker* tunnel only (client-to-VIP) and the Wan Chai site-to-site tunnel is IPsec on the ASA. **`VP-WC-EDGE-01` terminates only the IPsec IKEv2 site-to-site tunnel; a Cisco device cannot terminate WireGuard, so the design does not claim it does.** Option B (remote-workers-only WireGuard with the branch on IPsec) remains available only by a formal revision, and the Rev 1.1 addendum records its impact |
| Easy-RSA | **COVERED** | `vpnz-lnxra01`; `easyrsa init-pki`, `build-ca`, `build-server-full`, `build-client-full`, `gen-crl`; evidence the CA certificate chain and the CRL, plus a documented revocation test |
| Bash shell scripting | **COVERED (cross-listed with L4)** | §8.6 `04-automation/bash` (5 scripts + shared library) |
| Linux *high-availability clustering* (Pacemaker/Corosync, DRBD) | **NOT COVERED** | Keepalived covers gateway/service VIP failover; a full cluster resource manager is out of scope for 12 weeks and would duplicate the ASA/VRRP story. Stated as future work |
| SELinux/AppArmor custom policy authoring, KVM/libvirt nested virtualisation | **NOT COVERED** | AppArmor is left at distro defaults and that must be stated, not implied |
| Docker/Kubernetes | **NOT COVERED** | Not named in the brief and not needed for any line; excluded to protect the schedule |

### 11.3 L3 — Cisco Networking
| Brief example | Status | Implemented by / evidence |
|---|---|---|
| OSPF | **COVERED** | Single area 0 at HQ + Kwun Tong (no ABR, no `area range`, no inter-area summarisation); `network` statements, passive interfaces on access ports, `default-information originate` from the edge, authentication (MD5 or SHA) on the core links; evidence `show ip ospf neighbor`, `show ip route ospf`, and a failover capture |
| EIGRP | **COVERED** | Macau (`AS 100`) + one "legacy acquisition" transit segment at HQ; **named EIGRP AS 100, administrative distance left at default 90, and redistribution with OSPF at exactly one router (`VP-HQ-EDGE-01`), one direction per prefix set and never untagged in both directions with route tags 100 (OSPF) and 200 (EIGRP)**; evidence `show ip eigrp topology`, `show ip protocols`, and a routing-loop test after a deliberate misconfiguration that the report documents and fixes |
| RSTP | **COVERED** | IEEE 802.1w across all HQ switches; `spanning-tree mode rapid-pvst`, explicit `spanning-tree vlan 10,20,30,... root primary` on `VP-HQ-CORE-01` and `root secondary` on `VP-HQ-CORE-02`, `portfast`+`bpduguard` on access ports, `guard root` on the expected root ports; evidence `show spanning-tree` before/after a link pull, plus the RSTP convergence measurement |
| ASA | **COVERED (with declared limits)** | `VP-HQ-FW-01` = **ASA 5506-X, ASA 9.16(4)** in Packet Tracer: security levels, ACLs, object groups, NAT/PAT, static NAT, `inspect` policy (ICMP, DNS, HTTP, FTP), syslog to `vpnz-mon01`, and a site-to-site IPsec IKEv2 tunnel to `VP-WC-EDGE-01`; evidence `show run`, `show asp drop`, `show crypto ipsec sa`, and a denied-flow capture |
| BGP | **COVERED (basic only)** | eBGP between `VP-HQ-EDGE-01` (AS 65001) and the simulated provider (AS 65000) over the `/30`; a second session (AS 65002) to a second provider; `network` statements, `neighbor ... route-map` for inbound/outbound prefix control, `maximum-prefix`, and a local-preference/AS-path demonstration; evidence `show ip bgp summary`, `show ip bgp`, `show ip route bgp` |
| BGP *advanced* (route reflectors, confederations, BGPsec, RPKI, `add-path`, communities beyond the simple demo, EVPN) | **NOT COVERED** | Not reliably available in Packet Tracer and not verifiable. **Must not be claimed.** Future work on real equipment |
| OSPF *advanced* (multi-area beyond one ABR, NSSA/stub tuning, OSPFv3, MPLS) | **NOT COVERED** | Single area 0 only. Stated honestly |
| Cisco *SDN* (DNA Center, Viptela SD-WAN, ACI) | **NOT COVERED** | The brief for this project does not ask for SDN (that is the sibling topic Victor3). Explicitly excluded |
| Real Cisco hardware behaviours (real ASIC forwarding, real throughput, real power/fan/HA hardware, IOS-XE-specific features) | **NOT COVERED by construction** | Packet Tracer is a simulator: it models protocol behaviour and CLI syntax, **not** hardware, timing, or scale. This sentence must appear in the report's limitations chapter |
| Switch stacking, VSS, VPC | **NOT COVERED** | Not available/faithful in Packet Tracer for the devices used |

### 11.4 L4 — Network Automation
| Brief example | Status | Implemented by / evidence |
|---|---|---|
| PowerShell scripting | **COVERED** | §8.6 `04-automation/powershell`: `Invoke-NewStarterOnboarding.ps1`, `Get-ADHealthReport.ps1`, `Backup-NetworkDeviceConfig.ps1`, `Test-ServiceEndpoints.ps1`, `Export-GPOBackup.ps1`, plus a shared module and Pester-style self-tests; evidence the scripts, their logs, and a second run producing identical output (idempotence) |
| Ansible Playbook | **COVERED** | §8.6 `04-automation/ansible`: 9 playbooks, 7 roles, Jinja2 templates, an INI inventory with 6 groups, `group_vars`; manages **Linux over SSH and Windows over WinRM from the same control node `vpnz-mon01`**; evidence `ansible-playbook --check` output, a full run log, and `--diff` output |
| Bash shell scripting | **COVERED** | §8.6 `04-automation/bash`: hardening, nftables atomic apply with rollback, keepalived verification, restic backup, certificate renewal |
| Network-device automation *in the simulator* | **PARTIAL — declared** | Packet Tracer has **no API, no SSH server reachable from real tooling, and no Ansible collection**. **[DECIDED] honest approach (two-track):** (a) Track A — the group maintains `03-build/packet-tracer/configs/*.txt` (the exact intended device configurations) as the source of truth and applies them through PT's own CLI and PT's own scripting/`File > Save As` workflow, with the Ansible/Napalm-equivalent step documented but not executed; (b) Track B — `08-collect-network-configs.yml` and `Backup-NetworkDeviceConfig.ps1` are *written and tested* against the Linux/Windows estate and against the **PT device configurations treated as files in Git**, with a documented gap analysis explaining exactly which step a real device would need (`netmiko`/`napalm` over SSH). **The report must state clearly that no playbook ever logged in to a Packet Tracer device.** Claiming otherwise would be fabrication |
| Configuration-as-code / Git workflow | **COVERED** | Bare repos on `vpnz-mon01`, branch-per-task, peer review recorded in the meeting minutes, tagged releases `v0.1`…`v1.0`; evidence `git log --oneline --graph` |
| Terraform / cloud IaC, CI/CD pipelines, AWX/Tower | **NOT COVERED** | Not required by the brief, no cloud account exists in this project, and CI would add infrastructure the group must not depend on. Future work |
| PowerShell DSC | **NOT COVERED** | Deliberately excluded to avoid a second, competing configuration model; **state it explicitly rather than implying it** |

### 11.5 L5 — AI Network Management (**highest-uncertainty line — read §13.6 before writing anything about it**)
| Brief example | Status | Implemented by / evidence |
|---|---|---|
| Agentic AI | **PARTIAL — declared proof of concept** | An agent runtime on `vpnz-ai01` that (1) receives an alert or a schedule trigger, (2) calls at most 4 declared read-only tools, (3) produces (a) a triage note with evidence links and (b) a **proposed** change in diff form. It never applies a change. Defined in §12.5 |
| OpenClaw Skills | **PARTIAL — declared proof of concept** | A "Skills" surface consisting of four manifests under `/opt/openclaw/skills/`: `alert-triage`, `interface-health`, `auth-failure-report`, `doc-draft`. Whether OpenClaw's skill format matches the group's expectation is **[UNCERTAIN]** and must be established empirically in week 6 |
| MCP (named in the *other* Victor2 variant of the topic sheet, and relevant here) | **PARTIAL — declared** | The read-only tool surface is designed as MCP-compatible tool definitions so that it works with or without a specific agent runtime. **[ASSUMPTION]** MCP is a real, documented protocol for connecting models to tools; the group must cite the specification it actually reads |
| Autonomous remediation (agent applies changes) | **NOT COVERED — deliberately excluded** | Excluded on safety and academic-integrity grounds: an unsupervised agent writing to a router or domain controller would make the project's verification results irreproducible. **This exclusion is a design decision, and it must be presented as one, with the justification** |
| Model hosting / fine-tuning / GPU inference | **NOT COVERED** | No GPU. The agent uses either a small local model or an API — see the fallback in §13.6, and note that an API dependency means the demo needs Internet access and a free-tier key, which is a documented project risk |
| Predictive analytics, anomaly-detection ML with trained models | **NOT COVERED** | Out of scope for 12 weeks and unverifiable without a labelled dataset. Must be listed as future work |
| Network digital twin / intent-based networking platforms | **NOT COVERED** | Excluded |

### 11.6 Alignment with the WorldSkills Occupational Standards 2026 (**verified facts — use these, do not re-invent them**) **[DECIDED]**
All statements in this subsection come from the verified extraction in `proposal\research\wsos-2026-2447.md` and may be quoted by later writers without re-checking the live page. **[VERIFIED]**

**Assessment structure (the page's own `Section` / `Relative importance (%)` table; totals 100%):**

| # | Section title (exact) | Weight |
|---|---|---|
| 1 | Work organization and management | 5 % |
| 2 | Communication and interpersonal Skills | 5 % |
| 3 | Data Transfer Networks | 25 % |
| 4 | Network and System Operations | 25 % |
| 5 | Infrastructure Automation | 15 % |
| 6 | Troubleshooting | 25 % |

**Why this matters to the baseline:** 75 % of the standard is the three 25 % technical sections (Data Transfer Networks, Network and System Operations, Troubleshooting). This is the single strongest documentary argument for a hands-on, troubleshooting-heavy, documentation-heavy project, and it justifies the priority order fixed in §13.4 R-02.

**Which of the brief's named technologies the standard actually names (verified occurrence counts in the 2026 text and raw HTML):**

| Brief technology | Named in WSOS 2026? | Requirement line to cite |
|---|---|---|
| ADDS | **YES**, explicitly | `Install and manage enterprise directory services (ADDS, LDAP)` (Domain 4) |
| Nginx | **YES**, explicitly | `Install and manage web hosting services using modern web servers e.g. Apache, Nginx and IIS.` (Domain 4) |
| OpenVPN | **YES**, explicitly | `Provide network connectivity between remote branches using VPN technologies such as IPSec, SSL VPN, Direct Access, OpenVPN, DMVPN, GRE, etc.` (Domain 3) |
| OSPF, BGP, EIGRP | **YES**, all three in one line | `Provide enterprise-wide connectivity using internal and external gateway routing protocols such as OSPF, BGP and EIGRP` (Domain 3) — **the strongest single citation available for this project** |
| PowerShell, Bash, Ansible, Git | **YES**, explicitly | `Setup and run routine infrastructure maintenance operations using various scripting\programming languages` → nested `Bash`, `PowerShell`; `Use modern automation tools for systems deployment and configuration management` → nested `Git`; `Identify and implement infrastructure as code` → nested `Ansible.` (Domain 5) |
| Cisco (vendor), HSRP, VRRP, GLBP, LACP, IPSec, SSL VPN, DMVPN, GRE, VLAN, IPv4/IPv6, SNMP, Syslog, NetFlow, tcpdump, CDP, ssh, RDP, SMB, DFS, NFS, FTP, Windows DNS, BIND, PKI/AD CS/OpenSSL, backup (Windows Server Backup, rsync), WDS, Group Policy, software RAID/mdadm/LVM, NTFS/ReFS/EXT4 | **YES** (present in the standard, not necessarily as the brief lists them) | See the extraction's Domain 3 and Domain 4 lists |
| **Keepalived** | **NO** (0 occurrences, both editions) | Bridge it via the **named protocol**: `Provide network load balancing & fault tolerance at routing and switching levels by using GLBP, HSRP, VRRP, LACP, PAgP, etc.` (Domain 3) — **VRRP is named and Keepalived implements VRRP.** This is the strongest available bridge and must be used verbatim |
| **nftables** | **NO** (0 occurrences) | Bridge via `Apply basic security configuration for control and data plane` and the Domain 3 host/network-security lines |
| **WireGuard** | **NO** (0 occurrences) | Bridge via the Domain 3 VPN line's `etc.` only — the weakest bridge of the five; state it as such |
| **RSTP** | **NO** (0 occurrences) | Bridge via `Configure access, aggregation and core level switching` (Domain 3) — a two/three-tier switching design with loop prevention |
| **ASA** | **NO** (0 occurrences) | Bridge via the Domain 3 VPN/security lines. **`ASA` must not be presented as a WSOS requirement** |
| **FSRM, iSCSI, RRAS, IKEv2** | **NO** (0 occurrences) | Justify from the **topic brief itself** (the brief names them explicitly), not from the standard |
| **Agentic AI, OpenClaw, MCP, artificial intelligence, machine learning** | **NO — zero occurrences; the standard contains no AI content at all** | Justify as **project innovation beyond the standard**, framed by `The speed of IT systems change and the need to maintain currency.` (Domain 1). **Claiming that the WSOS covers agentic AI would be factually wrong and easily contradicted.** See §14.2 rule 6 |
| Packet Tracer / GNS3 / EVE-NG (simulation tools) | **NO** | The use of a simulator is a project constraint (§1.3), not a standard requirement. Say so |
| Terraform, Puppet, Chef, Jenkins | **NO** | Correctly excluded by §11.4 |
| Python, YANG, RESTCONF, NETCONF | **NO in the 2026 edition** — these were present in the 2024 Domain 5 text and were **removed** for 2026 | Do not cite them as standard requirements. They may appear as future work only |

**Two documentation facts that must not be misattributed [DECIDED]**
1. The WSOS 2026 contains **no requirement for screen captures** — the strings `screen`, `capture`, `screenshot` and `evidence` occur **0 times**. The requirement to produce *"all findings, manuals, steps, screen captures, verifications, and references"* comes from the **HDTN topic sheet**, not from WorldSkills. The report must attribute it correctly.
2. The WSOS **does** require documentation, three times, and one line is the strongest available justification for the whole documentation deliverable:
   - `Health and safety legislation, obligations, regulations, and documentation` (Domain 1)
   - `The purpose of documenting the completion of the installation or up-grade` (Domain 6)
   - **`Prepare a technical document reflecting the solution in detail for agreement and sign-off`** (Domain 6) — quote this verbatim in the proposal's rationale
3. The WSOS page contains **no time limit and no module structure** (strings `hour`, `hours`, `minutes`, `days`, `module` = 0 occurrences). **The 12-week duration comes from the student constraint in §1.3 and must never be cited to the standard.**

**Quotation discipline [DECIDED]:** when quoting the standard, reproduce it exactly, **including its own source typos** (`Up-grade`, `identity problems`, `Window Server Back-up`, `EXT4 and NTFS`, `Dependencies structures`, `Behaviour`, `Oranization`, `server rooms.They`). Do not silently correct them; if a correction is needed, present it as `[sic]` plus a note.

### 11.7 What is *simulated* versus *genuinely configured* — the one-paragraph statement every writer must reuse **[DECIDED]**
> **Genuinely configured and running:** the whole VM estate — Active Directory, DNS, DHCP, file services with FSRM, iSCSI, RRAS/IKEv2, Nginx, Keepalived, nftables, OpenVPN, WireGuard, Easy-RSA, the monitoring stack, the Ansible control node and every playbook, the PowerShell scripts, and the agent runtime. **Simulated in Cisco Packet Tracer:** all Cisco routers, switches, the ASA firewall, the WAN links, the ISP, and all Layer-2 behaviour, VLANs, trunks, OSPF, EIGRP, BGP, RSTP and ASA policy. **Emulated on the hypervisor with host-only networks:** the segmentation that a real switch would provide, so that each VLAN is a separate hypervisor virtual network rather than an 802.1Q tag. **Not present at all:** physical hardware, 802.1Q trunking between real hosts, hardware-accelerated forwarding, real Internet connectivity, and any production data.

---

## 12. Technology-Specific Design Decisions (the detail writers must not re-invent)

### 12.1 Windows services **[DECIDED]**
- Domain controllers are **Core-installation=False** (Desktop Experience) because the group needs GUI evidence for the report; this is a deliberate trade-off to be stated.
- `vpnz-dc01` holds all five FSMO roles; transfer of the PDC emulator to `vpnz-dc02` is a documented DR test.
- DNS forwarders are the simulated provider resolvers (`192.0.2.53/54`); **root hints are left in place but must never be reachable** in the lab.
- DHCP: as §5.3. DHCP snooping is enabled on the Packet Tracer access switches; the trusted ports are the uplinks to `VP-HQ-CORE-01/02` only. A rogue-DHCP test (a PT server with DHCP enabled on an access port) must be captured and shown to be blocked.
- FSRM: quota templates and one file screen; accessible via the mapped drive `F:` (Finance, `GG-Finance-RW`) and `G:` (Engineering, `GG-Engineering-RW`), read-only `H:` (Sales).
- iSCSI: CHAP (one-way, per-initiator secret; mutual CHAP if time allows); LUN01 20 GB for the web-farm data, LUN02 40 GB for backup staging, LUN03 60 GB thin, unused but demonstrated.
- Backup: Windows Server Backup to `D:\iSCSI\LUN02` plus a documented off-host restic job from Linux that copies configuration evidence to `vpnz-dmzjump01` — the report must state that this is a **configuration and evidence** backup, not a full VM or hypervisor-level backup, because the group has no hypervisor-level backup licence.
- RRAS: IKEv2 only (no PPTP, no L2TP with pre-shared key, no SSTP claimed unless actually built). NPS policy requires both machine certificate and group membership `GG-VPN-Users`. Split tunnelling is **disabled** (all traffic through the tunnel) because the due-diligence item requires an auditable path; the report must show the client's routing table as evidence.
- **Optional disaster-recovery exercise** (keeps the topic sheet's "Disaster Recovery" wording honest without claiming a full DR solution): (1) seize/transfer FSMO, (2) restore a deleted OU from the AD Recycle Bin, (3) restore a file from the restic repository, (4) fail over the nginx VIP, (5) `krbtgt` double-reset procedure documented but executed only if the supervisor approves. Each has a timed result recorded.

### 12.2 Linux services **[DECIDED]**
- Ubuntu guests are provisioned from a cloud-init template (`UBU2404-TEMPLATE-01`) with the admin user `fypadmin` (SSH key only) and cloud-init disabled after first boot (so Ansible — not cloud-init — owns subsequent configuration; otherwise the two fight and the failure must not be blamed on Ansible).
- The nginx reverse proxy terminates TLS and re-encrypts to the upstreams (TLS end to end); the upstream certificates are trusted via the internal CA. HSTS is enabled; TLS 1.2 minimum, TLS 1.3 preferred; cipher suite evidence captured with `openssl`.
- Keepalived: both pairs use `state MASTER`/`BACKUP` with `priority 150/100`, `preempt`, `authentication { auth_type PASS }` **[DECISION NOTE: PASS authentication is acceptable within a host-only lab segment and this must be stated as a lab simplification, not best practice]**, and `track_script` checks that actually test the service (`curl` the local health endpoint, `nft list ruleset` non-empty), not just the interface.
- nftables: one `inet` table, `policy drop` on input and forward, explicit `ct state established,related accept`, an `ipv4` `set` for each trusted peer group, `masquerade` on the WAN-facing interface, `log prefix` before every drop, and a documented rollback script (`02-nftables-apply.sh` arms `nft -f /etc/nftables.conf` with an `at`-style revert timer so a bad ruleset cannot lock the group out of a remote VM). **The lockout risk must be documented and the mitigation demonstrated.**
- WireGuard: keys generated per peer, `PersistentKeepalive = 25` on the client side only, `AllowedIPs` restricted to the exact prefixes needed (never `0.0.0.0/0` on a site-to-site peer), `wg0.conf` mode 0600 and in `.gitignore`.
- OpenVPN: Easy-RSA CA with a 2048-bit (or 4096-bit if time allows) key; `tls-crypt` preferred over `tls-auth`; `duplicate-cn` disabled; the CRL is regenerated during the revocation test and the revoked client must be shown to fail.
- Monitoring: Prometheus scrapes `node_exporter`, `windows_exporter`, nginx (`stub_status` via a local exporter), and the ASA/switch estate via SNMPv3; Grafana dashboards are provisioned from files in Git so they are reproducible; Loki receives syslog. Alert rules are written to a file in Git and at least three alerts must be shown firing and resolving.

### 12.3 Cisco **[DECIDED]**
- Packet Tracer project files are saved incrementally and there are **exactly five**: `01-l2l3-core.pkt`, `02-wan-routing.pkt`, `03-asa-perimeter.pkt`, `04-voice.pkt`, `05-full.pkt`. `05-full.pkt` is the deliverable topology; the earlier files are the build stages and are evidence of progress.
- Routing: OSPF area 0 (HQ ↔ Kwun Tong) as a **single area** — no ABR, no `area range`, no inter-area summarisation — and EIGRP AS 100 (Macau and the legacy segment), redistribution only at `VP-HQ-EDGE-01` with tags, one direction per prefix set. Administrative distances left at defaults; the report must state that default AD is being relied upon and why.
- BGP: AS 65001 (Vertex Peak), AS 65000 (primary provider), AS 65002 (alternate provider), AS 65021 (Wan Chai, small). Demonstration: inbound prefix filtering with a prefix list, outbound `route-map` prepending, `local-preference` to prefer the primary path, and a failover capture when the primary session is shut down.
- RSTP: root selection explicit, `portfast`/`bpduguard`/`guard root`/`loopguard` where relevant, and a **captured topology-change and convergence sequence** (PT simulation mode + `debug spanning-tree events`, or `show spanning-tree detail` timestamps). Convergence timing in PT is a simulation artefact; **this must be labelled as such and not presented as a real-world convergence figure.**
- ASA: security levels outside 0 / dmz 50 / inside 100; the outside default route is `route outside 0.0.0.0 0.0.0.0 198.51.100.6 1` (the provider edge on the ASA's own /29 — Rev 1.1 ruling C-15); object groups (`OBJ-NET-SRV`, `OBJ-NET-DMZ`, `OBJ-VPN-POOLS`); NAT (dynamic PAT for inside-out, static NAT for the DMZ services); ACLs implementing exactly TB-04, TB-05, TB-06, TB-13, TB-15; `logging trap informational` to `vpnz-mon01`; **no `shun`, no FirePOWER/SFR, no clustering, no failover pair — Packet Tracer does not model them.**
- The ASA image and model must be captured with `show version` on the very first build day, and this file's §7 row updated with the real string.
- Voice (supporting, not a claimed brief line): CUCM Express on `VP-HQ-VOICE-01` with two ephone-dn and two ephones, DHCP option 150 pointing at 10.10.45.11; evidence the registration status and one successful simulated call. **The report must say "CUCM Express simulated in Packet Tracer", not "IP telephony deployed".**

### 12.4 Automation **[DECIDED]**
- Control node: `vpnz-mon01` only. Ansible never runs from a student laptop (so evidence is reproducible and the version is pinned).
- Idempotence is a hard requirement: each playbook is run twice and `changed=0` on the second run is captured as evidence.
- Secrets: Ansible Vault with one vault password held by the group; **no plaintext secret may ever be committed** — a documented `git grep` style check (`gitleaks` if available, otherwise a PowerShell `Select-String` sweep) runs before each tagged release, and its output is evidence.
- Windows management over WinRM with HTTPS (`5986`) and a self-signed (internal-CA-signed) certificate; the report must show the `win_ping` result.
- Every script/playbook writes a run log to `04-automation/runs/` with a timestamp; the logs are committed so that the verification chapter can cite them.
- The "review" control from §2.1 is implemented socially as well as technically: two-person review of every playbook change, recorded in the meeting minutes, because the due-diligence item asks for a *process*, not just a tool.

### 12.5 AI-NETOPS proof of concept (read this before writing anything about AI) **[DECIDED]**
**Objective:** demonstrate that an agent can reduce mean-time-to-triage for a small, well-understood alert set, **without** any write access to production.

**Architecture [DECIDED]**
```
[vpnz-mon01] Prometheus/Alertmanager ──webhook──▶ [vpnz-ai01] OpenClaw agent runtime
                                                          │  (read-only tool surface, 4 tools)
                              ┌───────────────────────────┼───────────────────────────┐
                              ▼                           ▼                           ▼
                   tool: get_active_alerts      tool: get_interface_stats    tool: get_auth_failures
                   (Alertmanager API, HTTPS)    (SNMPv3 poll of the PT device  (Windows Security 4625 /
                                                 estate + Linux ip -s link)     journald sshd via SSH)
                                                          │
                                                          ▼
                                        tool: draft_change_proposal (TEXT ONLY — writes
                                        to /opt/openclaw/proposals/, never to a device)
```
**The four tools are the entire surface.** There is no fifth tool. There is no shell on `vpnz-ai01` that can reach a device except through these four read-only code paths. The report must show the tool manifest files and the allow-list.

**Capability demonstration [DECIDED] (pick at least two, prove them end to end):**
1. *Interface errors:* inject 1 000 errors on a PT interface (`interface ... ` + simulated errors) or flap a link; the agent produces "interface Gi0/1 on VP-HQ-DSW-A02 is showing 812 input errors and 3 CRC failures in 5 minutes; correlated with VLAN 40; proposed next diagnostic: `show interfaces gi0/1 counters errors` and a cable/TDR check."
2. *Brute-force detection:* run a failed-login burst against `vpnz-dmzwp01` (or against the simulated DMZ services); the agent produces "34 failed SSH logins from 10.10.70.50 in 4 minutes; that address is in the isolated lab VLAN and should not be able to reach the DMZ at all — see TB-09; proposed action: verify the ACL and open an incident."
3. *Configuration drift:* change a rule in `/etc/nftables.conf` on `vpnz-nft01`; the agent compares against the Git version and proposes a diff.
4. *Documentation drafting:* the agent drafts the daily operations log from the alert and change history. This is the least risky and the easiest to demonstrate; it is also legitimately useful.

**Guardrails that must be demonstrable [DECIDED]:** read-only credentials (a service account in `GG-AI-ReadOnly`); no stored device credentials other than that account; every invocation logged to `/opt/openclaw/logs/agent.jsonl` with a prompt hash and the tool calls made; a hard rate limit on tool calls; the agent is on a segment that can only reach the management ports listed in §10; and the agent's output is always labelled **"proposed — requires human approval"**.

**Acceptance criteria [DECIDED]:** (a) at least two capabilities demonstrated with transcripts; (b) a false-positive and a hallucination, if they occur, are documented honestly with the prompt that caused them — *documenting a failure is a stronger academic result than hiding one*; (c) a written evaluation of where the agent helped, where it wasted time, and where a human was strictly required.

**FALLBACKS — mandatory, because this is the weakest line [DECIDED]**
| # | If this fails | Fallback (must already be designed in week 6, not invented in week 11) |
|---|---|---|
| F1 | OpenClaw cannot be installed or run on Ubuntu 24.04 in the lab | Run the identical four-tool surface with a **generic agent loop** written by the group (Python + a local or API model, ~150 lines) and document that OpenClaw specifically could not be evaluated. The report's AI chapter then becomes "an agentic-tooling proof of concept, evaluated against the OpenClaw Skills model as a design reference" — which is honest and still satisfies the brief's line |
| F2 | OpenClaw runs but its Skills format differs from the group's assumptions | Re-express the four tools in OpenClaw's documented format, cite the documentation, and **record the corrected format in this baseline as a revision** |
| F3 | No LLM access (no API key, no Internet from the lab, no local model) | Demonstrate the deterministic half only: the four collectors, the correlation rules, and the report generator, with the "agent" being a scripted policy. Document the substitution clearly and keep the agent architecture chapter as design work with a smaller demonstrated scope |
| F4 | Local model inference is too slow on 4 vCPU / 8 GB | Reduce to a single capability (documentation drafting), or move the runtime to a student laptop with more RAM and document the change of host |
| F5 | The agent produces unsafe or wrong proposals | This is a *finding*, not a blocker: record it under a "limitations and failure modes" heading, and add the matching guardrail (e.g. require two independent signal sources before proposing an action) |

---

## 13. Assumptions, Limitations and Risks **of this baseline itself**

### 13.1 Baseline assumptions **[DECIDED]**
| ID | Assumption | If wrong |
|---|---|---|
| A-01 | Each of the four students has, or can share, one 64 GB (32 GB absolute minimum) machine capable of running the chosen hypervisor | Reduce concurrency: run the `Z-SERVER` estate and the `Z-DMZ` estate in two separate shifts rather than all 19 VMs at once, and record the reduction |
| A-02 | The group's Cisco NetAcad account provides the current Packet Tracer build | Use whatever NetAcad provides; note the version in the report. Never use a third-party installer |
| A-03 | Windows Server 2025 evaluation media (or campus media) is available to all four students | Substitute Windows Server 2022 and note it in every affected section |
| A-04 | The campus network is not required for any in-lab dependency except OS/package downloads | Pre-download ISO and package caches to `vpnz-mon01` before the build week |
| A-05 | The official topic reference page (`https://worldskills.org/what/projects/wsos/2026/events/611/skills/2447/`) resolves and displays the 2026 IT Network Systems Administration standard | Cite the page as supplied by the supervisor; if the page content cannot be retrieved, quote it as "as cited in the topic sheet" and do not paraphrase clauses that were never read |
| A-06 | The group may cite the WorldSkills Occupational Standards as a *reference framework for documentation quality*, not as a compliance standard it is being assessed against | State the distinction explicitly in the report |
| A-07 | `vertexpeak.fyp.lab` and all `.example` names are lab-only and will never be registered or resolved publicly | None; this is a naming choice |
| A-08 | Hong Kong legal/regulatory references are used only as narrative motivation, never as legal advice or a compliance claim | Soften the narrative wording if the supervisor objects |

### 13.2 Packet Tracer limitations (be specific and truthful) **[DECIDED]**
| # | Limitation | Consequence for this design |
|---|---|---|
| PT-01 | Packet Tracer is a **simulator**, not an emulator. It models CLI syntax and protocol logic; it does not model real ASICs, line-rate forwarding, real hardware, real clock behaviour, or real-world convergence times | No performance, throughput, or convergence figure from PT may be presented as a real-world measurement. Every such figure must be labelled "simulated" |
| PT-02 | The ASA available in PT is a **reduced legacy-ASA model** (an ASA 5506-X device running an ASA 9.x image in current builds). Features such as FirePOWER/SFR, clustering, failover pairs (active/standby with state replication), `shun`, some inspection engines, and much of `show asp drop`-level detail are absent or incomplete | The design must not claim ASA HA, clustering, or NGFW/threat-detection capability. The DMZ boundary is still valid because it is ACL/NAT/IPsec based — those do work |
| PT-03 | PT's **BGP** support is basic: neighbor establishment, `network` statements, prefix lists, route-maps and simple path attributes work; route reflectors, confederations, `add-path`, RPKI/BGPsec validation, and large-scale peering do not | BGP is demonstrated as a two/three-peer eBGP scenario only. The report must state the ceiling explicitly |
| PT-04 | PT's **EIGRP** is a good approximation but some advanced EIGRP features (stub tuning subtleties, wide metrics beyond the defaults, named mode details) are limited | EIGRP is demonstrated with classic mode, AS 100, and one controlled redistribution point. Named mode is not claimed unless actually configured and captured |
| PT-05 | PT's **RSTP** models the algorithm but timings are simulation artefacts, and some 802.1w protections behave differently from real hardware | RSTP is demonstrated by *topology change behaviour* (which port becomes root/alternate/blocked), not by ms-accurate convergence |
| PT-06 | PT has **no SSH server reachable from external tooling and no API**. Nothing real can log in to a PT device | Network-device automation is a **documented two-track approach** (§11.4). No claim of automated device configuration may be made |
| PT-07 | PT has **no 802.1Q trunking to real hosts**, no LACP to real hosts, and no packet capture to a real NIC | VLAN isolation of real VMs is done with hypervisor host-only networks, not VLAN tags. This is a design approximation and must be drawn as such |
| PT-08 | PT device images/capabilities change between releases and between NetAcad accounts | Every device model and image string must be captured with `show version` on build day and corrected in §7 if it differs |
| PT-09 | PT cannot simulate a real ISP, real DNS delegation, or real certificate validation | All external services are simulated with RFC 5737 addresses and `.example` names |
| PT-10 | PT's own "Multiuser" and assessment features are not required, and no PT assessment file may be relied upon as evidence | Evidence is screenshots + saved `.pkt` files + configuration text files committed to Git |

### 13.3 Physical/logical approximation limitations **[DECIDED]**
| # | Limitation | Honest framing for the report |
|---|---|---|
| AP-01 | "VLANs" for real VMs are separate hypervisor virtual networks (different subnets), not 802.1Q tags on one trunk | The *segmentation outcome* (who can talk to whom) is real; the *mechanism* is emulated. Say exactly this |
| AP-02 | There is no redundant physical path to a VM. `VP-HQ-CORE-01/02` and the two-socket storage path exist only in the Packet Tracer model | Availability claims must be split: *network-path* redundancy is simulated in PT; *service* redundancy (VIP failover, second DC, second proxy) is genuinely demonstrated |
| AP-03 | The hypervisor host is a single point of failure for the entire VM estate | This is the project's single largest availability limitation and must be in the report's risk chapter, not hidden |
| AP-04 | No UPS, no PDU, no cabling, no physical console | Power and physical-layer scenarios are documented as unimplementable |
| AP-05 | The `Z-EGRESS` inline position of the nftables pair is emulated by placing both VMs on one host-only segment; a real inline bump-in-the-wire needs two NICs on real physical segments | Both guests do have two virtual NICs (`VNET-EGRESS` + `VNET-WAN`), which is the closest faithful approximation available |

### 13.4 Design risks and mitigations **[DECIDED]**
| ID | Risk | Likelihood | Impact | Mitigation (with an owner) |
|---|---|---|---|---|
| R-01 | The VM estate does not fit the host (RAM exhaustion) | High | High | Build the templates first, run only what a test needs, keep resource-doc §15 numbers, and use the two-shift fallback of A-01 |
| R-02 | 12-week schedule overruns because the group tries to build everything at depth | High | High | Priority order is fixed: **must** (L1 core roles, L3 OSPF/RSTP/ASA, L2 nginx/keepalived/nftables, L4 three playbooks) → **should** (EIGRP/BGP, iSCSI, monitoring, WordPress) → **could** (voice, PKI two-tier, Restic, MCP) → **won't** (everything in the "NOT COVERED" rows) |
| R-03 | Packet Tracer behaviour differs from expectation and burns days | Medium | Medium | Timebox every PT experiment to half a day; if unresolved, record the discrepancy as an experiment result (which is legitimate academic content) and move on |
| R-04 | The AI line (L5) yields nothing demonstrable | High | Medium | The five fallbacks F1–F5 of §12.5 must be designed by week 6; the chapter is written as "a proof of concept with declared scope", which is defensible |
| R-05 | Inconsistent naming between writers | Medium | High | §16 is the contract; a weekly consistency check script (`Test-ServiceEndpoints.ps1` plus a repository `Select-String` sweep for banned strings such as `.local`, `contoso`, `172.16.`, `192.168.`) is run before every tag |
| R-06 | Version claims in the report drift from reality | Medium | High | §7's pinning discipline: versions are captured from the running systems, and a "version deviations" subsection is mandatory |
| R-07 | Credential or key leakage into Git | Medium | High | `.gitignore` for `*.key`, `wg*.conf`, `*.pem`, `*.pfx`, `pki/`; vault for secrets; the pre-tag sweep; and a documented test that a deliberately committed fake key is caught |
| R-08 | A group member's machine fails mid-project | Medium | Medium | Everything is in Git on `vpnz-mon01` **and** mirrored to a second medium; no group member is the sole holder of any artefact |
| R-09 | The intent of the brief and the group's interpretation diverge | Low | High | This baseline is reviewed with the supervisor before week 3; every "NOT COVERED" entry is presented for approval so that nothing is silently dropped |
| R-10 | The report accidentally claims a certification, compliance or real-world result | Medium | High | §11.6's paragraph is the required framing; a final proof-read pass checks for the words "certified", "compliant", "production", "real-world throughput" and requires each to be either evidenced or deleted |

### 13.5 Ethical and integrity constraints **[DECIDED]**
- All "attacks" in this project are self-directed against the group's own lab segments, are documented in advance, and never touch any system the group does not own. The isolated `Z-STUDENT` VLAN (10.70.0.0/24) is the designated source for the deliberate-misuse tests, which also demonstrates TB-09/TB-10 working.
- No generated content may be presented as measured data. If an AI tool drafts text, the report's methodology chapter must say so, and all technical results must be traceable to a command transcript or a screenshot.
- `da-vertexpeak` (break-glass) use must be logged; `krbtgt` reset must not be performed without supervisor approval.

### 13.6 The single highest-uncertainty item in this baseline **[DECIDED]**
**OpenClaw and its Skills model are the least verifiable element of this project.** At the time this baseline was authored, OpenClaw appeared to be a recent agent-runtime project with a "Skills" extension model, but its exact installation method, its skill-file format, its default ports, its licence and even its stable version could **not** be confirmed from this authoring environment (direct HTTPS retrieval was blocked; only search-result metadata was available). Search results did confirm that an OpenClaw documentation site and OpenClaw skill/plugin projects exist (for example the documented overview pages at `docs.openclaw.ai` and `docs2.openclaw.ai`, and community skill collections on GitHub), but documentation alone is not evidence of a working installation in this lab.

Consequences, which every later writer must respect:
1. **No version, URL, licence or capability statement about OpenClaw may appear in the report without a screenshot of the running instance in this lab and a citation to the documentation actually used.**
2. The AI chapter's opening paragraph must state the uncertainty and the fallback taken.
3. The group must complete a **timeboxed feasibility spike in weeks 5–6** (maximum 3 working days) whose *output is a decision*: adopt OpenClaw, adopt F1's generic agent loop, or drop to F3's deterministic correlation engine. The decision and its evidence go in the decision log.
4. §7's OpenClaw row and §10's P-34 port remain **[UNCERTAIN]**/**[ASSUMPTION]** until that spike closes, and must then be corrected in a revision of this file.

---

## 14. Standards, References and Citation Discipline

### 14.1 Mandatory citations **[DECIDED]**
| Reference | Use in this project | Status |
|---|---|---|
| WorldSkills Occupational Standards 2026, *IT Network Systems Administration* (Skill 2447, WorldSkills Shanghai 2026): `https://worldskills.org/what/projects/wsos/2026/events/611/skills/2447/` | The standard cited by the topic sheet. The report uses it for (a) the six-section assessment weighting that justifies emphasis, (b) verbatim requirement lines that justify each technology, and (c) the documentation deliverable. | **[VERIFIED]** — the page was fetched successfully (HTTP 200, 55 200-byte body, `<title>` = `WorldSkills Occupational Standards - IT Network Systems Administration`, edition label `WorldSkills Shanghai 2026`, footer `Last updated: 02.06.2026 13:34 (GMT)`), and the project's own research pack (`proposal\research\wsos-2026-2447.md`, Section 3.7 census and Appendix A audit row) machine-extracted its 131 requirement lines and re-verified them verbatim against the raw HTML with 0 mismatches. That pack also carries a corrections section (Section 7, items C1-C6) that supersedes the earlier review it examined — notably C1: Domain 5 lost Python, YANG, RESTCONF and NETCONF for the 2026 edition. Full extraction: `proposal\research\wsos-2026-2447.md`. **Use that URL form exactly** (with `/what/`) |
| Local verified extraction of the above | The citation of record inside this project; §11.7 is built from it | **[VERIFIED]** — `proposal\research\wsos-2026-2447.md` (907 lines), including a gap analysis and a corrections section |
| RFC 1918 — *Address Allocation for Private Internets* | Justifies every private range in §5 | **VERIFIED (document identity)** |
| RFC 5737 — *IPv4 Address Blocks Reserved for Documentation* | Justifies `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24` | **VERIFIED (document identity)** |
| RFC 2606 — *Reserved Top Level DNS Names* | Justifies `.example` and `.test`-style names | **VERIFIED (document identity)** |
| RFC 4193 — *Unique Local IPv6 Unicast Addresses* | Referenced only to state that this project is **IPv4-only** and that IPv6 is out of scope | **VERIFIED (document identity)** |
| IEEE 802.1D-2004 / 802.1w / 802.1Q | RSTP and VLAN references | **[ASSUMPTION]** — cite the edition actually consulted; do not invent a clause number |
| RFC 7296 (IKEv2), RFC 4301/4303 (IPsec) | VPN protocol references | **VERIFIED (document identity of IKEv2 = RFC 7296)**, remainder **[ASSUMPTION]** |
| Vendor documentation for each product in §7 | Configuration steps | Must be the documentation actually used for the version actually installed. Record the URL and the access date |
| Cisco NetAcad / Packet Tracer documentation | Simulator capabilities and limitations | Record the exact documentation page and the PT build it applies to |

### 14.2 Citation rules **[DECIDED]**
1. Every technical claim has a reference: RFC/standard, vendor documentation, or the group's own experiment with a test-case ID. "It is well known that…" is not acceptable.
2. A version number is only cited together with the command output that produced it.
3. No URL may be written from memory. Each URL is copied from the browser and archived under `08-references/`.
4. A reference that could not be read is cited as "as cited in <the document that cited it>", never as if it had been read.
5. Screenshot captions use the template `Figure {n}: {what} — {host} — {command or action} — {date}`.
6. **Standard-citation rule [DECIDED].** Every reference to the WSOS 2026 must match the verified facts of §11.7. Specifically: do **not** attribute the screen-capture requirement to the WSOS (it comes from the topic sheet); do **not** cite the WSOS for a 12-week or any other duration; do **not** claim the WSOS names FSRM, iSCSI, RRAS, IKEv2, Keepalived, nftables, WireGuard, RSTP, ASA, Packet Tracer, agentic AI, OpenClaw, MCP or any AI content — none of those strings occur in it; and where a bridge is used (Keepalived→VRRP, nftables→control/data-plane security, WireGuard→the VPN line's `etc.`, RSTP→`Configure access, aggregation and core level switching`), present it as a **bridge**, quoting the standard line and then stating the inference.

---

## 15. Storage and Resource Budget

### 15.1 Per-VM allocation (summarised from §6) **[DECIDED]**
The §6 inventory contains **36 rows: 16 Packet Tracer logical devices + 19 virtual machines + 1 hypervisor host**. Packet Tracer devices consume no host resources (they are simulation objects), so only the 19 VMs and the host itself appear below.

| Class | Count | vCPU | RAM (GB) | Provisioned disk (GB) |
|---|---|---|---|---|
| Windows Server guests (`dc01`, `dc02`, `fs01`, `san01`, `rras01`, `dmzweba01`, `dmzweba02`, `jump01`, `brdc01`) | 9 | 18 | 36 | 540 |
| Ubuntu guest `vpnz-mon01` (Ansible/Git/monitoring) | 1 | 4 | 8 | 100 |
| Ubuntu guest `vpnz-ai01` (agent runtime) | 1 | 4 | 8 | 60 |
| Ubuntu guests — the other 8 (`lnxra01`, `nft01`, `nft02`, `dmzrev01`, `dmzrev02`, `dmzwp01`, `dmzwp02`, `dmzjump01`) | 8 | 16 | 26 | 300 |
| **Total (19 VMs)** | **19** | **42** | **78** | **1 000** |
| Templates (powered off) | 2 | — | — | 130 (excluded from run-time figures) |
| Snapshots allowance | — | — | — | +250 |
| **Host disk requirement** | | | | **≈ 1 400 GB allocated; 2 TB recommended** |

Note: the 42 vCPU figure is *allocated* vCPU, not simultaneous load. Because no VM in this design is CPU-saturated except briefly during package installation or an Ansible run, a 8-core/16-thread host is workable and a 12–16 core host is comfortable (§15.2). RAM does **not** overcommit usefully on a workstation hypervisor, which is why 78 GB of allocation is the binding constraint and why A-01's two-shift fallback exists.

### 15.2 Recommended host specification **[DECIDED]**
| Component | Minimum (workable) | Recommended | Note |
|---|---|---|---|
| CPU | 8 physical cores / 16 threads with AMD-V or Intel VT-x **enabled in firmware** | 12–16 cores / 24–32 threads | 36 vCPUs of guests on 8 cores is heavy oversubscription; it is survivable because the estate is never fully busy. **Virtualisation extensions must be on or nothing runs** |
| RAM | 32 GB | **64 GB** | This is the hard constraint. 32 GB forces the two-shift fallback of A-01 |
| Disk | 1 TB free | **2 TB NVMe free** (the authoring machine's `D:` has 3 716 GB free, so disk is not the binding constraint on that machine) | Thin provisioning plus a 250 GB snapshot allowance is included above. **Never place the VM store on the same physical disk as the host's own page file if it can be avoided** |
| Network | One NIC, Internet access for patching, **no bridging to the campus LAN** | Two NICs | All lab traffic is host-only (see §6). Bridged mode is forbidden |
| OS | Windows 11 Pro (24H2+) if Hyper-V/VMware; Linux also acceptable if the group chooses VirtualBox | Windows 11 Pro 64-bit | A student machine with 16 logical processors and a 3.7 TB free volume — as measured on the authoring workstation — comfortably exceeds the minimum on CPU and disk and is limited only by RAM |
| GPU | Not required | Not required | No local GPU inference is planned; see §12.5 F4 |

### 15.3 Storage discipline **[DECIDED]**
- All guest disks are **thinly provisioned**; growth is monitored and the budget is reviewed at week 6 and week 10.
- Snapshot policy: one snapshot before every significant change, removed once the change is verified and documented. **Snapshots are never used as a backup.**
- The hypervisor host's own backup is the group's responsibility and is explicitly **not** a deliverable of the network design; the report must state this boundary.
- Off-host copy of *evidence* (screenshots, configs, playbook logs) is to `vpnz-dmzjump01` and to the group Git repository; off-host copy of *VMs* is not attempted.

---

## 16. INTERFACE CONTRACT FOR WRITERS

> **This is the anti-inconsistency mechanism of the project. Copy the values below verbatim. Do not paraphrase, re-capitalise, re-address or "improve" them. If a value here is wrong, this file must be revised and re-issued; a writer may not deviate locally.**

```text
=== PROJECT IDENTITY ===
Project title (exact):        Victor2 – Enterprise Network Infrastructure and Architect
Subtitle:                     Design, Build, Verify and Document a Virtualised Enterprise Network for a Hong Kong FinTech Firm
Context:                      HDTN Final Year Project Topic (AY2026/27)
Duration:                     12 weeks
Group size:                   4 students
Institution context:          Hong Kong; academic English
Reference standard:           IT Network Systems Administration, WorldSkills Occupational Standards 2026
                              https://worldskills.org/what/projects/wsos/2026/events/611/skills/2447/
                              (verified: HTTP 200; skill 2447; WorldSkills Shanghai 2026 edition)
                              local verified extraction: proposal\research\wsos-2026-2447.md
                              section weightings: 1 Work organization and management 5% | 2 Communication and
                              interpersonal Skills 5% | 3 Data Transfer Networks 25% | 4 Network and System
                              Operations 25% | 5 Infrastructure Automation 15% | 6 Troubleshooting 25%

=== COMPANY (SCENARIO) ===
Legal name:                   Vertex Peak Financial Technologies Limited
Chinese trading name:         駿峰金融科技有限公司
Trading name (in prose):      Vertex Peak
Headcount:                    160 staff total (110 HQ, 28 Kwun Tong, 12 Wan Chai, 4 Macau, 6 permanent remote)

=== IDENTITY ===
AD DS forest root domain:     vertexpeak.fyp.lab
NetBIOS domain name:          VERTEXPEAK
Kerberos realm:               VERTEXPEAK.FYP.LAB
Functional level:             Windows Server 2025
UPN suffix:                   vertexpeak.fyp.lab
Public/documentation names:   portal.vertexpeak.example | www.vertexpeak.example | blog.vertexpeak.example
Root CA common name:          VP-ROOT-CA
Issuing CA common name:       VP-ISSUING-CA-01
Site names:                   HQ-ShaTin | BR-KwunTong | WC-WanChai | MO-Macau

=== HOSTNAMES (canonical; never re-capitalised, never abbreviated) ===
Windows/Nginx/firewall VMs:   vpnz-dc01  vpnz-dc02  vpnz-fs01  vpnz-san01  vpnz-rras01
                              vpnz-lnxra01  vpnz-mon01  vpnz-ai01
                              vpnz-nft01  vpnz-nft02
                              vpnz-dmzrev01  vpnz-dmzrev02  vpnz-dmzweba01  vpnz-dmzweba02
                              vpnz-dmzwp01  vpnz-dmzwp02  vpnz-dmzjump01
                              vpnz-jump01  vpnz-brdc01
Hypervisor host:              vpnz-hvhost01
Templates:                    W2K25-TEMPLATE-01 | UBU2404-TEMPLATE-01
Optional extra (WireGuard peer, only if §11.2's decision is taken): vpnz-wcwg01
Packet Tracer devices:        VP-HQ-CORE-01  VP-HQ-CORE-02
                              VP-HQ-DSW-A01  VP-HQ-DSW-A02  VP-HQ-DSW-A03  VP-HQ-DSW-A04
                              VP-HQ-EDGE-01  VP-HQ-FW-01  VP-HQ-VOICE-01
                              VP-BR-EDGE-01  VP-BR-DSW-A01
                              VP-MO-EDGE-01  VP-MO-DSW-A01
                              VP-WC-EDGE-01  VP-WC-DSW-A01
                              VP-ISP-EDGE-01

=== KEY IP ADDRESSES ===
vpnz-dc01                     10.10.30.11
vpnz-dc02                     10.10.30.12
vpnz-pki01 (optional)         10.10.30.15
vpnz-fs01                     10.10.30.21
vpnz-mon01                    10.10.30.31
vpnz-rras01                   10.10.30.41
vpnz-lnxra01                  10.10.30.42
vpnz-ai01                     10.10.30.51
vpnz-san01                    10.10.80.21
vpnz-jump01                   10.20.20.31
vpnz-hvhost01                 10.20.20.10
nftables HA VIP               10.10.50.10   (vpnz-nft01 = 10.10.50.11, vpnz-nft02 = 10.10.50.12)
nginx HA VIP                  10.10.90.10   (VIP ONLY, owned by no node; vpnz-dmzrev01 = 10.10.90.28, vpnz-dmzrev02 = 10.10.90.29 per §5.7)
vpnz-dmzweba01 / .02          10.10.90.21 / 10.10.90.22
vpnz-dmzwp01  / .02           10.10.90.25 / 10.10.90.26
vpnz-dmzjump01                10.10.90.27
vpnz-dmzrev01 / .02           10.10.90.28 / 10.10.90.29 (VNET-DMZ); 10.10.10.28 / 10.10.10.29 (VNET-CORE)
vpnz-nft01 / .02 VNET-WAN     10.10.200.2 / 10.10.200.3
ASA VP-HQ-FW-01               outside 198.51.100.1 (default next hop 198.51.100.6) | inside 10.10.50.2/28 | dmz 10.10.90.1
Public published addresses    198.51.100.2 (portal), 198.51.100.3 (www), 198.51.100.4 (blog), 198.51.100.5 (VPN front door)
HQ edge WAN links             gi0/0 10.10.100.1/30 <-> ISP 10.10.100.2/30  (primary eBGP AS 65000)
                              gi0/1 10.10.100.5/30 <-> ISP 10.10.100.6/30  (backup provider leg; the ASA outside segment)
                              gi0/2 10.10.100.33/30 <-> VP-BR-EDGE-01 10.10.100.34/30
                              10.10.100.41/30 <-> ISP gi0/2 10.10.100.42/30  (alternate eBGP AS 65002)
                              gi0/3 10.10.100.37/30 <-> VP-MO-EDGE-01 10.10.100.38/30
Loopbacks                     10.255.0.11 (CORE-01)  .12 (CORE-02)  .21 (HQ-EDGE-01)  .31 (BR-EDGE-01)
                              .41 (MO-EDGE-01)  .51 (WC-EDGE-01)  .61 (ISP-EDGE-01)
VPN pools                     IKEv2 10.10.201.0/24 | OpenVPN 10.10.202.0/24
                              WireGuard site 10.10.200.0/24 | WireGuard remote 10.10.200.64/26
DHCP-relayed DNS option       10.10.30.11, 10.10.30.12

=== VLANs (VID + exact name) ===
10   LAN-HQ-CORE      10.10.10.0/24   gw 10.10.10.1
20   MGMT-OOB         10.20.20.0/24   gw 10.20.20.1
30   SRV-HQ-1         10.10.30.0/24   gw 10.10.30.254 (HSRP VIP)
40   USER-HQ-STF      10.10.40.0/23   gw 10.10.40.254 (HSRP VIP)
45   VOICE-HQ         10.10.45.0/24   gw 10.10.45.1
50   TRANSIT-EGRESS   10.10.50.0/28   gw 10.10.50.1 (nftables VIP 10.10.50.10; usable .1-.14)
60   SRV-HQ-2         10.10.60.0/24   gw 10.10.60.1   (reserved, undeployed)
70   STUDENT-LAB      10.70.0.0/24    gw 10.70.0.254
80   STORAGE-HQ       10.10.80.0/24   gw 10.10.80.254
90   DMZ-HQ           10.10.90.0/24   gw 10.10.90.1 (ASA dmz interface)
100  LAN-ISP          per-link /30s: .0/30, .4/30, .32/30, .36/30, .40/30  (the name 10.10.100.0/29 covers only the first two)
110  BR-SALES         10.10.110.0/24  gw 10.10.110.1
111  BR-STAFF         10.10.111.0/24  gw 10.10.111.1
112  BR-VOICE         10.10.112.0/24  gw 10.10.112.1
113  BR-MGMT          10.10.113.0/24  gw 10.10.113.1
120  MO-LAN           10.10.120.0/24  gw 10.10.120.1
121  MO-VOICE         10.10.121.0/24  gw 10.10.121.1
130  WC-LAN           10.10.130.0/24  gw 10.10.130.1
131  WC-DEV           10.10.131.0/24  gw 10.10.131.1
999  UNUSED-BLACKHOLE (shutdown ports and native VLAN)

=== ROUTING ===
AS numbers                    Vertex Peak HQ 65001 | primary provider 65000 | alternate provider 65002 | Wan Chai 65021
OSPF                          area 0 (single area), MD5/SHA auth on core links, default-information originate at VP-HQ-EDGE-01
EIGRP                         AS 100 (Macau + legacy segment), classic mode
Redistribution                ONLY at VP-HQ-EDGE-01; route tags 100 (OSPF) and 200 (EIGRP); one direction per prefix set. VP-HQ-CORE-01 is NOT a redistribution point and NOT an OSPF ABR (single area 0); no area range may appear in any config
First-hop redundancy          HSRP (switch SVIs, groups 1-4 one per SVI: g1 VLAN30 0000.0c07.ac01, g2 VLAN40 .ac02, g3 VLAN70 .ac03, g4 VLAN80 .ac04; active priority 150) | VRRP via Keepalived
                              (vrid 51 = nftables pair 10.10.50.0/28, vrid 61 = nginx pair 10.10.90.0/24; both VIPs are owned by no node)
VLAN trunking                 native VLAN 999 on every trunk; VLAN 1 carries no traffic

=== VERSIONS (write the value; if the running system differs, record the deviation) ===
Hypervisor                    VMware Workstation Pro 17.6.2   [recommended default]
Hypervisor alternatives       Oracle VirtualBox 7.1.x | Microsoft Hyper-V (both workable, see §6.1)
Hypervisor host OS            Windows 11 Pro, 24H2/25H2, build 26100.x
Windows Server                Windows Server 2025 Standard (Desktop Experience), build 10.0.26100.1742
                              fallback: Windows Server 2022 (build 20348)
Linux                         Ubuntu Server 24.04.3 LTS (Noble Numbat); fallback: 24.04.x latest point release
Cisco Packet Tracer           8.2.2   [UNCERTAIN — confirm against NetAcad at build time and correct this file]
Packet Tracer ASA             Cisco ASA 5506-X device, ASA 9.16(4) image   [UNCERTAIN — record `show version`]
Ansible                       ansible-core 2.18.x + community package 11.x; pywinrm 0.5.0
PowerShell                    Windows PowerShell 5.1 (guests) + PowerShell 7.4 LTS (authoring, vpnz-jump01)
nftables                      1.0.9        Keepalived 2.2.8        Nginx 1.24.0
OpenVPN                       2.6.x        WireGuard wireguard-tools 1.0.20210914
Easy-RSA                      3.1.x        Git 2.43+               MariaDB 10.11
Prometheus 2.5x | Grafana 11.x | Loki 3.x | node_exporter 1.8.x | windows_exporter 0.29.x
OpenClaw                      NOT PINNED — highest-uncertainty item; see §12.5 and §13.6

=== PATHS ===
Repository root (host)        C:\FYP\
  baseline                    C:\FYP\00-baseline\
  proposal                    C:\FYP\01-proposal\
  design                      C:\FYP\02-design\
  packet tracer projects      C:\FYP\03-build\packet-tracer\   (01-l2l3-core.pkt, 02-wan-routing.pkt, 03-asa-perimeter.pkt, 04-voice.pkt, 05-full.pkt; 05-full.pkt is the deliverable)
  windows runbooks            C:\FYP\03-build\windows\
  linux runbooks              C:\FYP\03-build\linux\
  ansible                     C:\FYP\04-automation\ansible\    (ansible.cfg, inventory/lab.ini,
                              playbooks/01-baseline-windows.yml ... 09-verify-services.yml, roles/, templates/)
  powershell                  C:\FYP\04-automation\powershell\ (Invoke-NewStarterOnboarding.ps1,
                              Get-ADHealthReport.ps1, Backup-NetworkDeviceConfig.ps1,
                              Test-ServiceEndpoints.ps1, Export-GPOBackup.ps1)
  bash                        C:\FYP\04-automation\bash\
  run logs                    C:\FYP\04-automation\runs\
  ai                          C:\FYP\05-ai-netops\
  verification                C:\FYP\06-verification\
  evidence                    C:\FYP\07-evidence\   (name: {date}_{host}_{what}.png)
  references                  C:\FYP\08-references\
Linux config paths            /etc/nginx/nginx.conf | /etc/nginx/conf.d/00-upstreams.conf
                              /etc/nginx/conf.d/10-portal.conf | /etc/nginx/conf.d/20-blog.conf
                              /etc/keepalived/keepalived.conf
                              /etc/nftables.conf (+ /etc/nftables.d/*.nft)
                              /etc/wireguard/wg0.conf
                              /etc/openvpn/server/server.conf | /etc/openvpn/easy-rsa/
                              /etc/ssh/sshd_config.d/10-fyp-hardening.conf
                              /etc/sysctl.d/99-fyp-hardening.conf
                              /etc/rsyslog.d/50-fyp-forward.conf
                              /etc/prometheus/prometheus.yml | /etc/grafana/grafana.ini
                              /srv/backup/  /srv/tftp/  /opt/openclaw/  /opt/openclaw/skills/  /var/log/fyp/
Windows paths                 C:\FYP\logs\ | C:\FYP\config\ | C:\FYP\evidence\
                              D:\Shares\Finance | D:\Shares\Engineering | D:\Shares\SalesRO | D:\Shares\Public
                              D:\iSCSI\LUN01..LUN03 | \\vpnz-fs01\Shares\... | C:\PerfLogs\FYP\

=== NETWORK IDENTITY VALUES ===
nftables table                inet fyp_filter
Keepalived VRIDs              51 (nftables pair) | 61 (nginx pair)
nginx upstream names          weba_pool (10.10.90.21:443, 10.10.90.22:443) | wp_pool (10.10.90.25:443, 10.10.90.26:443)
nginx exporter listen port    9113/tcp
ASA object-group names        OBJ-NET-SRV | OBJ-NET-DMZ | OBJ-NET-MGMT | OBJ-NET-USER | OBJ-NET-VPN | OBJ-NET-LAB
ACL naming                    ACL-{ZONE}-{DIR}-{NN}          e.g. ACL-DMZ-OUT-10
iSCSI initiator IQN           iqn.2026-01.lab.fyp.vertexpeak:storage-lun0N  (N = 1, 2, 3; the INITIATOR endpoint on vpnz-dmzweba01)
iSCSI target IQN              DERIVED by Microsoft's iSCSI Target Server and not settable: iqn.1991-05.com.microsoft:vpnz-san01-storage-lun0N.target (confirm with Get-IscsiServerTarget)
WSOS 2026 section weights     1 Work organization and management 5% | 2 Communication and interpersonal
                              Skills 5% | 3 Data Transfer Networks 25% | 4 Network and System Operations 25%
                              | 5 Infrastructure Automation 15% | 6 Troubleshooting 25%
WSOS-named (citable verbatim) ADDS, LDAP, Nginx, IIS, Apache, BIND, Windows DNS, DNS/DHCP/NAT, NTP, SSH, RDP,
                              SMB, DFS, NFS, FTP, AD CS, OpenSSL, Windows Server Backup, rsync, WDS, Group Policy,
                              RAID/mdadm/LVM, NTFS/ReFS/EXT4, OSPF, BGP, EIGRP, HSRP, VRRP, GLBP, LACP, PAgP,
                              IPSec, SSL VPN, DMVPN, GRE, OpenVPN, VLAN, CDP, NetFlow, Syslog, SNMP, tcpdump,
                              PowerShell, Bash, Ansible, Git
WSOS bridges (must be framed    Keepalived -> VRRP line (D3) | nftables -> "Apply basic security configuration
as inferences, not quotes)      for control and data plane" (D3) | WireGuard -> the VPN line's "etc." (D3, weakest)
                              | RSTP -> "Configure access, aggregation and core level switching" (D3)
WSOS-ABSENT (never claim as     FSRM, iSCSI, RRAS, IKEv2, Keepalived, nftables, WireGuard, RSTP, ASA,
WSOS requirements)              Packet Tracer/GNS3/EVE-NG, Agentic AI, OpenClaw, MCP, AI, machine learning,
                              Terraform, Puppet, Chef, Jenkins, Python, YANG, RESTCONF, NETCONF (last four
                              were removed from Domain 5 in the 2026 edition)
Trust-boundary rule IDs       TB-01 ... TB-16   (cite these IDs in the verification chapter)
Test-case IDs                 TC-{LINE}-{NN}    e.g. TC-L1-04, TC-L3-09, TC-L5-02
Service account names         svc_ansible | svc_backup | svc_monitoring | svc_aiagent | svc_ldapbind | svc_git
                              | adm-{initials} | da-vertexpeak
Security groups               GG-Server-Admins | GG-Tier0-Admins | GG-Workstation-Admins | GG-Helpdesk
                              | GG-Finance-RW | GG-Finance-RO | GG-Engineering-RW | GG-Sales-RO
                              | GG-VPN-Users | GG-VPN-ProfServices | GG-DMZ-LDAP-Readers
                              | GG-Monitoring-Readers | GG-AI-ReadOnly | GG-Infra-Admins
GPO names                     GPO-WS-Baseline-Security | GPO-WS-Deploy-CA-Root | GPO-WS-Drive-Maps
                              | GPO-WS-PowerShell-Logging | GPO-WS-Windows-LAPS | GPO-WS-Cert-AutoEnrol
                              | GPO-WS-IKEv2-VPN-Profile | GPO-SRV-Member-Server-Baseline
                              | GPO-SRV-DMZ-Baseline | GPO-SRV-Tier0-Baseline | GPO-Audit-Advanced

=== BANNED STRINGS (must never appear in any deliverable) ===
.local   .lan   contoso.com   example.com as a lab domain   fabrikam
172.16.0.0/16 (reserved head-room, unallocated)
192.168.0.0/16 (not part of this design)
VLAN 1 as a traffic-carrying VLAN
any real public IP address   any real registered domain name   any real customer data
```

---

## 17. Delivery Schedule and Ownership (12 weeks, 4 students)

Roles **[DECIDED]**: **W1 — Identity & Windows**; **W2 — Linux & Services**; **W3 — Cisco & Packet Tracer**; **W4 — Automation, Monitoring & AI**, who is also the documentation integrator. Every member writes into the shared repository, and every deliverable has exactly one accountable owner plus one reviewer.

| Week | Milestone (gate) | Primary owner | Exit evidence |
|---|---|---|---|
| 1 | Baseline approved by supervisor; repository created; Git workflow agreed; group charter and roles signed | W4 | This file frozen as `v00-baseline-v1.0`, supervisor's approval note |
| 2 | Hypervisor chosen and installed on all four machines; `UBU2404-TEMPLATE-01` and `W2K25-TEMPLATE-01` built; host-only networks created and verified; **PT topology 1 (`01-l2l3-core.pkt`) VLANs and trunks working** | W1 + W3 | Template screenshots, `ip -br a`, PT `show vlan brief` and `show interfaces trunk` |
| 3 | AD DS forest, DNS, DHCP, sites and OU structure live; two DCs replicating; RODC staged | W1 | `dcdiag /v`, `repadmin /replsummary`, ADUC screenshots |
| 4 | `Z-USER`/`Z-SERVER` traffic working in PT (OSPF + HSRP); user VLANs reachable; DHCP from the domain | W3 | PT `show ip ospf neighbor`, `show standby brief`, DHCP leases |
| 5 | Linux estate baseline hardened; nginx reverse proxy and Keepalived pair live with failover demonstrated; **AI feasibility spike starts** | W2 + W4 | `nginx -t`, VIP failover capture, spike notes |
| 6 | nftables egress pair live with logging and NAT; WireGuard and OpenVPN tunnels working; iSCSI LUNs attached and mounted; **AI spike decision recorded (adopt / F1 / F3)** | W2 + W4 | `nft list ruleset`, tunnel handshakes, `Get-IscsiSession`, decision-log entry |
| 7 | FSRM quotas and file screens; FSRM evidence; ASA perimeter with ACL/NAT working; DMZ published through the proxy | W1 + W3 | Quota exceeded capture, blocked-file capture, `curl -I https://portal.vertexpeak.example` through the published path |
| 8 | EIGRP + mutual redistribution at one point; BGP to the provider with failover demonstrated; ASA IPsec site-to-site up | W3 | `show ip bgp summary`, `show ip eigrp topology`, `show crypto ipsec sa`, failover capture |
| 9 | RSTP root and convergence demonstration; port security and DHCP snooping; rogue-DHCP test blocked | W3 | `show spanning-tree`, rogue-DHCP capture |
| 10 | Automation complete: 5 PowerShell scripts + 9 playbooks idempotent (second run `changed=0`); monitoring dashboards live; **AI proof of concept demonstrated at least twice** | W4 | Run logs, `changed=0` evidence, Grafana screenshots, agent transcripts |
| 11 | Verification: every TC in the traceability matrix executed; every TB rule tested; failure/denial evidence captured; disaster-recovery exercise run | all | `06-verification/` complete, DR timings recorded |
| 12 | Final report assembled, proof-read against §16, "banned strings" sweep clean, version-deviation subsection written, presentation rehearsed; supervisor sign-off | all | Final PDFs, `v1.0` tag, sign-off sheet |

**Freeze points [DECIDED]:** §16 may not change after end of week 6 except by a formal revision of this file. After week 9, no new technology may be added — only testing, documenting and closing.

---

## 18. Traceability Matrix (initial seed)

Every brief technology name must appear here. Later writers extend it; they never delete a row.

| Brief line | Brief technology name | Status | Implemented by | Test case ID | WSOS 2026 justification (see §11.7) | Report section |
|---|---|---|---|---|---|---|
| L1 | ADDS | COVERED | `vpnz-dc01`, `vpnz-dc02`, `vpnz-brdc01` | TC-L1-01 | **Named**: `Install and manage enterprise directory services (ADDS, LDAP)` (D4) | §9 |
| L1 | FSRM | COVERED | `vpnz-fs01` | TC-L1-02 | Not named — justified from the brief + `Install and manage sharing services` (SMB, DFS) (D4) | §12.1 |
| L1 | iSCSI | COVERED | `vpnz-san01` | TC-L1-03 | Not named — justified from the brief + `Manage file systems` / `LVM/Dynamic disks` (D4) | §12.1 |
| L1 | RRAS | COVERED | `vpnz-rras01` | TC-L1-04 | Not named — justified from the brief + `Install and manage remote network access services` (D4) | §12.1 |
| L1 | IKEv2 | COVERED | `vpnz-rras01`, ASA | TC-L1-05 | Not named — bridge via `Security protocols to secure local and wide area networks` (D3) | §12.1 |
| L1 | Clustering / SOFS | NOT COVERED | — | — | — | future work |
| L2 | Nginx | COVERED | `vpnz-dmzrev01/02`, `vpnz-dmzwp01/02` | TC-L2-01 | **Named**: `Install and manage web hosting services using modern web servers e.g. Apache, Nginx and IIS.` (D4) | §12.2 |
| L2 | Keepalived | COVERED | nginx pair, nftables pair | TC-L2-02 | **Bridge to a named protocol**: `Provide network load balancing & fault tolerance at routing and switching levels by using GLBP, HSRP, VRRP, LACP, PAgP, etc.` (D3) — Keepalived implements VRRP | §12.2 |
| L2 | nftables | COVERED | `vpnz-nft01/02` | TC-L2-03 | **Bridge**: `Apply basic security configuration for control and data plane` (D3) | §12.2 |
| L2 | OpenVPN | COVERED | `vpnz-lnxra01` | TC-L2-04 | **Named**: the D3 VPN-technology line | §12.2 |
| L2 | WireGuard | COVERED (peer choice per §11.2) | `vpnz-nft01/02` ↔ `vpnz-wcwg01` or remote workers | TC-L2-05 | **Weakest bridge**: only the `etc.` of the D3 VPN line — say so | §12.2 |
| L3 | BGP | COVERED (basic) | `VP-HQ-EDGE-01` ↔ ISP | TC-L3-01 | **Named**: `Provide enterprise-wide connectivity using internal and external gateway routing protocols such as OSPF, BGP and EIGRP` (D3) | §12.3 |
| L3 | OSPF | COVERED | HQ ↔ Kwun Tong | TC-L3-02 | **Named**: same line (D3) | §12.3 |
| L3 | EIGRP | COVERED | Macau + legacy segment | TC-L3-03 | **Named**: same line (D3) | §12.3 |
| L3 | RSTP | COVERED | all HQ switches | TC-L3-04 | **Bridge**: `Configure access, aggregation and core level switching` (D3) | §12.3 |
| L3 | ASA | COVERED (declared limits) | `VP-HQ-FW-01` | TC-L3-05 | Not named — bridge via the D3 VPN line and `Apply basic security configuration for control and data plane` | §12.3 |
| L3 | Cisco SDN | NOT COVERED | — | — | The standard *does* mention `Controller-based and software-defined network management approaches` (D3 know/understand 13), but SDN is the sibling topic Victor3 and is excluded here — state both facts | excluded |
| L4 | PowerShell scripting | COVERED | `vpnz-jump01`, Windows guests | TC-L4-01 | **Named**: `Setup and run routine infrastructure maintenance operations using various scripting\programming languages` → nested `PowerShell` (D5) | §12.4 |
| L4 | Ansible Playbook | COVERED | `vpnz-mon01` → Linux + Windows | TC-L4-02 | **Named**: `Identify and implement infrastructure as code` → nested `Ansible.` (D5) | §12.4 |
| L4 | Bash shell scripting | COVERED | all Linux guests | TC-L4-03 | **Named**: same scripting line → nested `Bash` (D5) | §12.4 |
| L4 | Git / version control | COVERED | `vpnz-mon01` | TC-L4-04 | **Named**: `Use modern automation tools for systems deployment and configuration management` → nested `Git`; `Importance of code version control` (D5) | §12.4 |
| L4 | Terraform / CI-CD pipeline | NOT COVERED (concept documented only) | — | — | `Continuous integration and continuous delivery\deployment pipelines concepts` is a **know/understand** line (D5); the project documents the concept and runs a Git review workflow but builds no pipeline. State exactly that, and do not list CI/CD as delivered | excluded |
| L5 | Agentic AI | PARTIAL | `vpnz-ai01` | TC-L5-01 | **No WSOS coverage (0 occurrences).** Frame as innovation *beyond* the standard, anchored on `The speed of IT systems change and the need to maintain currency.` (D1) | §12.5, §11.7 |
| L5 | OpenClaw Skills | PARTIAL | `vpnz-ai01` | TC-L5-02 | **No WSOS coverage** | §12.5, §13.6 |
| L5 | MCP tool surface | PARTIAL | four read-only tools | TC-L5-03 | **No WSOS coverage** | §12.5 |
| L5 | Autonomous remediation | NOT COVERED (deliberate) | — | — | — | excluded, with justification |
| — | Cross-cutting: troubleshooting evidence | COVERED | `06-verification/` | TC-TS-01-nn | Domain 6 *Troubleshooting* is **25 %** of the standard; the verification chapter is therefore a first-class scoring deliverable, not an appendix | §17 |
| — | Cross-cutting: infrastructure monitoring | COVERED | `vpnz-mon01` (Prometheus, Grafana, Loki, exporters) | TC-MON-01-nn | `Install and manage IT infrastructure resources monitoring systems` (D4; nested examples `Icinga2`, `Nagios`, `Cacti`, `Windows Resource Monitor`). **The project uses a different stack and must say so rather than implying it implements the nested examples** | §12.2 |
| — | Cross-cutting: PKI | COVERED | AD CS (`vpnz-dc01`) + Easy-RSA (`vpnz-lnxra01`) | TC-PKI-01-nn | `Setup public key infrastructure services` → nested `Active Directory Certificate Services`, `OpenSSL` (D4). **The project uses Easy-RSA as the Linux-side CA rather than driving OpenSSL directly — state that explicitly** | §8.5, §12.2 |
| — | Cross-cutting: VLAN segmentation | COVERED | Packet Tracer topology + hypervisor host-only networks | TC-L3-06 | `Network segmentation with VLAN` (D3 know/understand 5) and `Configure access, aggregation and core level switching` (D3) | §4 |
| — | Cross-cutting: discovery and traffic analysis | COVERED | CDP/LLDP, NetFlow if available in PT, Syslog, SNMPv3, `tcpdump` on Linux | TC-MON-01-nn | `Use network discovery and traffic analysis tools such as CDP, NetFlow, Syslog, SNMP and tcpdump.` (D3) — this line is directly implementable and must be evidenced, because it is a *shall be able to* line | §10, §12.2 |
| — | Documentation requirement (findings, manuals, steps, screen captures, verifications, references) | COVERED | `06-verification/`, `07-evidence/`, `08-references/` | TC-DOC-01 | **Two-part attribution that must not be merged:** the **screen-capture** wording is the **topic sheet's** requirement; the *documentation* obligation is the WSOS's — `Prepare a technical document reflecting the solution in detail for agreement and sign-off` (D6), plus `The purpose of documenting the completion of the installation or up-grade` (D6) | whole report |

---

## 19. Revision History and Change Control

| Rev | Date (authored) | Author | Change | Affected contract values |
|---|---|---|---|---|
| 1.0 | Authored at project start (see the file's own timestamp on disk) | Baseline author (delegated worker), for the four-member group | Initial canonical baseline | All (§16 as issued) |
| 1.1 | Consistency sweep after the eight section drafts | Design Authority (consistency-review worker) | Resolves 24 reported contradictions; see 00-design-baseline-rev1.1-addendum.md for the rulings and integration\patch-list.md for the propagation edits. Supersedes §3.3 (drawing labels, eBGP sessions), §3.4 (redistribution point, AS typo, area range), §4 (VLAN 20 wording), §4.1 (HSRP groups), §5.2/§5.3/§5.4/§5.5/§5.7 (VLAN 50 mask, LAN-ISP reading, IKEv2 pool, ASA next hop, DMZ node addresses, second-NIC addresses), §8.6 and §12.3 (.pkt list), §11.2/§11.3 (WireGuard peer, redistribution wording), §14.1 (WSOS census attribution), §16 (all amended contract values) | §16 KEY IP ADDRESSES, §16 VLANs, §16 ROUTING, §16 NETWORK IDENTITY VALUES, §16 PATHS |

**Change-control rules [DECIDED]**
1. Any change to §16 requires: a decision-log entry, group agreement (3 of 4), the supervisor's awareness, a new revision row above, and re-issue of the file so that all writers are working from one revision.
2. Changes to §5, §6 or §7 (addressing, inventory, versions) are allowed **only** as recorded corrections with evidence, and must state what previously depended on the old value.
3. Corrections discovered while writing the report are **welcome** and must be recorded as corrections. The failure mode this project must avoid is a report that quietly contradicts its own design.
4. The word "final" may only be used for a revision that has passed the week-12 consistency sweep.

**Open items this revision leaves open (each must be closed and folded back in):**
| # | Open item | Must close by | Owner |
|---|---|---|---|
| O-01 | Hypervisor finally chosen (default recommended: VMware Workstation Pro 17.6.2) | end week 2 | all |
| O-02 | Exact Packet Tracer build and the ASA model/image string read from `show version` | end week 2 | W3 |
| O-03 | Windows Server edition/patch actually installed (2025 vs 2022 fallback) | end week 3 | W1 |
| O-04 | WireGuard site-to-site peer decision — **CLOSED by Rev 1.1 / OD-01: Option A, `vpnz-wcwg01`** (see the addendum). Reopening requires a change record | closed | W2 + W3 |
| O-05 | DMZ hosts domain-joined or workgroup-isolated (GPO-08 decision) | end week 7 | W4 |
| O-06 | Single-tier or two-tier PKI; whether `vpnz-pki01` (10.10.30.15) is deployed | end week 7 | W1 |
| O-07 | AI line outcome: adopt OpenClaw, or fallback F1 (generic agent loop), or F3 (deterministic correlation) | end week 6 | W4 |
| O-08 | Actual version strings of every component in §7 (deviations recorded) | end week 10 | all |
| O-09 | Real edge `P-34` port, service name and default bind of the OpenClaw runtime | end week 6 | W4 |
| O-10 | Whether IPv6 is touched at all (baseline says **no**; if the group changes its mind, this file must be revised) | end week 4 | all |

---

*End of canonical design baseline — revision 1.0.*
