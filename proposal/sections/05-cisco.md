## 9. Cisco Networking

### 9.1 Overview and Objectives

The topic sheet names this line as *"Cisco Networking (e.g., BGP, OSPF, EIGRP, RSTP, ASA, etc.)"*. It is the best-covered of the five brief lines: the WorldSkills Occupational Standards 2026 (WSOS) names **OSPF, BGP and EIGRP** in one requirement line, **GLBP, HSRP, VRRP, LACP and PAgP** in a second, the **VPN family** in a third, and the **discovery and traffic-analysis tools** (`CDP, NetFlow, Syslog, SNMP and tcpdump`) in a fourth. The two technologies the brief names that the standard does **not** contain — **RSTP** and **ASA** — are bridged explicitly to the standard's own words and never presented as WSOS requirements.

This subsection delivers, inside Cisco Packet Tracer: campus VLANs, 802.1Q trunks and RSTP; inter-VLAN routing with HSRP; single-area OSPF between HQ and Kwun Tong; a contained EIGRP AS 100 for Macau with one tagged redistribution point; multi-homed eBGP to two simulated providers; an ASA 5506-X perimeter with the trust matrix, three forms of NAT and an IPsec site-to-site tunnel; and management, monitoring, traffic-analysis and resilience instrumentation.

#### 9.1.1 Device inventory and roles

The Packet Tracer estate is exactly **sixteen logical devices**. §9.4 gives models, versions, interfaces and cabling.

| # | Device | Model | Role |
|---|---|---|---|
| 1 | `VP-HQ-CORE-01` | Cisco multilayer switch | HQ core L3, OSPF area 0 (single area, no ABR), HSRP active in groups 1-4 (priority 150), RSTP root for HQ VLANs, CUCM Express host |
| 2 | `VP-HQ-CORE-02` | Cisco multilayer switch | HQ core L3, HSRP standby (100), RSTP secondary root |
| 3 | `VP-HQ-DSW-A01` | 24-port access switch | Floors 6–8, VLAN 40 `USER-HQ-STF`, RSTP leaf, port security, DHCP snooping |
| 4 | `VP-HQ-DSW-A02` | 24-port access switch | Floors 9–11, VLAN 40, same protections |
| 5 | `VP-HQ-DSW-A03` | 24-port access switch | VLAN 20 `MGMT-OOB` and VLAN 70 `STUDENT-LAB` only; no trunk to any user access switch |
| 6 | `VP-HQ-DSW-A04` | 24-port access switch | VLAN 30 `SRV-HQ-1`, 45 `VOICE-HQ`, 50 `TRANSIT-EGRESS`, 60 `SRV-HQ-2`, 80 `STORAGE-HQ`, 90 `DMZ-HQ` |
| 7 | `VP-HQ-EDGE-01` | Cisco ISR-class router | HQ WAN edge; eBGP AS 65001; OSPF/EIGRP boundary; **the single redistribution point**; NAT boundary |
| 8 | `VP-HQ-FW-01` | **Cisco ASA 5506-X**, ASA 9.16(4) | Perimeter/DMZ firewall: security levels outside 0 / dmz 50 / inside 100, object groups, ACLs, NAT/PAT, static NAT, inspection, IPsec IKEv2 to `VP-WC-EDGE-01`, syslog to `vpnz-mon01` |
| 9 | `VP-BR-EDGE-01` | Cisco ISR-class router | Kwun Tong: OSPF area 0 spoke over WAN1, inter-VLAN routing for VLAN 110–113, DHCP relay |
| 10 | `VP-BR-DSW-A01` | 24-port access switch | Kwun Tong access; RSTP leaf |
| 11 | `VP-MO-EDGE-01` | Cisco ISR-class router | Macau router; **EIGRP AS 100**; EIGRP/OSPF domain boundary at the HQ end |
| 12 | `VP-MO-DSW-A01` | 24-port access switch | Macau access; RSTP leaf |
| 13 | `VP-WC-EDGE-01` | Cisco ISR-class router | Wan Chai: IPsec peer to `VP-HQ-FW-01`, small BGP AS 65021 |
| 14 | `VP-WC-DSW-A01` | 24-port access switch | Wan Chai access; RSTP leaf |
| 15 | `VP-ISP-EDGE-01` | Cisco ISR-class router | Simulated transit provider edge, **AS 65000**; also presents the alternate-provider address for the second eBGP session |
| 16 | `VP-HQ-VOICE-01` | Cisco ISR-class router | CUCM Express in VLAN 45 — supporting only, not a claimed brief line |

#### 9.1.2 WSOS 2026 domains developed

All quotations are verbatim from `research\wsos-2026-2447.md`.

| WSOS 2026 domain (weight) | Verbatim requirement line | Where implemented |
|---|---|---|
| 3 Data Transfer Networks (25 %) | `Provide enterprise-wide connectivity using internal and external gateway routing protocols such as OSPF, BGP and EIGRP` | §9.8, §9.9, §9.10 |
| 3 Data Transfer Networks (25 %) | `Provide network load balancing & fault tolerance at routing and switching levels by using GLBP, HSRP, VRRP, LACP, PAgP, etc.` | §9.7 (HSRP); §9.6.4 (LACP/PAgP declared omission) |
| 3 Data Transfer Networks (25 %) | `Configure access, aggregation and core level switching` | §9.6 — the bridge used for **RSTP** |
| 3 Data Transfer Networks (25 %) | `Apply basic security configuration for control and data plane` | §9.12 (ASA policy); §9.5 (hardening) |
| 3 Data Transfer Networks (25 %) | `Provide network connectivity between remote branches using VPN technologies such as IPSec, SSL VPN, Direct Access, OpenVPN, DMVPN, GRE, etc.` | §9.12.4 |
| 3 Data Transfer Networks (25 %) | `Use network discovery and traffic analysis tools such as CDP, NetFlow, Syslog, SNMP and tcpdump.` | §9.13 |
| 3 D3 know/understand | `Network segmentation with VLAN`; `Routing and switching concepts`; `Load balancing principles` | §9.6, §9.7, §9.8 |
| 3 D3 know/understand | `concepts and principles for network function virtualization` | §9.13 — all Cisco behaviour here is simulated, contrasted with the genuinely virtualised server estate |
| 3 D3 know/understand | `Controller-based and software-defined network management approaches.` | Acknowledged and **excluded** — SDN is the sibling topic (Victor3) |
| 1 Work organization and management (5 %) | `Perform basic initialization of active network equipment` | §9.5 |
| 6 Troubleshooting (25 %) | `Use network package inspection, connectivity checking tools etc to troubleshoot and identity problems in a network.` `[sic]` | §9.16 |
| 6 Troubleshooting (25 %) | `Prepare a technical document reflecting the solution in detail for agreement and sign-off` | This subsection, §9.15, §9.17 |

**Honesty note.** The WSOS 2026 contains neither `RSTP` nor `ASA` (0 occurrences in text and raw HTML); RSTP is bridged through `Configure access, aggregation and core level switching`, and the ASA through `Apply basic security configuration for control and data plane` and the VPN line. The standard contains **no** mention of Packet Tracer, GNS3 or EVE-NG and **no** screen-capture requirement — the captures in §9.15 come from the HDTN topic sheet. The 12-week duration is a student constraint and must never be cited to the standard.

---

### 9.2 The Packet Tracer Platform: Capabilities and Honest Limitations

#### 9.2.1 Platform, and the two-track approach

The Cisco line is built inside **Cisco Packet Tracer 8.2.2 (64-bit Windows)** on `vpnz-hvhost01`. The baseline records that designation as **[UNCERTAIN]** — to be confirmed against the Cisco Networking Academy download page at build time — with the fallback that the group uses whatever current NetAcad-supported release its account provides, never a third-party or mirrored installer, and records the exact build in the version-deviations subsection.

**Packet Tracer is a simulator, not an emulator.** It models command syntax and protocol logic; it does not model ASICs, line-rate forwarding, real hardware, real oscillator-driven timers or real convergence times. Every behavioural figure taken from Packet Tracer is a **simulation artefact**; none may be presented as a real-world performance figure. Two tracks are therefore used, and a reader must always be able to tell which track a block belongs to.

- **Track A — simulated and executed.** Every configuration in §9.5–§9.14 is typed into Packet Tracer, saved to `01-l2l3-core.pkt`, `02-wan-routing.pkt`, `03-asa-perimeter.pkt`, `04-voice.pkt` and `05-full.pkt` (the deliverable topology), and captured with its `show` output.
- **Track B — documented equivalence.** Where a feature cannot be executed faithfully, the limitation is stated, the equivalent real-equipment configuration is given in an appendix-style subsection (§9.6.4 LACP/PAgP; §9.12.6 EtherType ACL; §9.13.3 NetFlow), and the report records that the configuration was written but **not executed in the simulator**. Where a block is Track B, its introductory sentence says so.

#### 9.2.2 Mandatory warning about simulated commands

> All commands shown in §9 of this report were entered into a network simulator, not into physical or virtualised Cisco hardware. Packet Tracer interprets the command-line interface and models protocol state machines; it does not forward real frames or packets, does not execute real Cisco IOS or ASA software, and does not exhibit real hardware timing. Consequently no command in this section can be accepted as evidence that the corresponding configuration has been validated on production equipment. Every convergence, failover and recovery figure quoted here is a simulator result and is labelled as such. This is a documented project limitation, accepted knowingly under the project's constraint that no physical network hardware may be used.

#### 9.2.3 Real-lab alternative and why it is out of scope

The academically stronger alternative is a **real or virtualised Cisco image on the hypervisor** — physical equipment, or Cisco's virtual router and virtual firewall platforms as guests with host-only networks — giving genuine 802.1Q tagging between real protocol stacks, genuine forwarding and genuine captures. It is out of scope for four documented reasons: (1) the client constraint is absolute (no physical hardware; Packet Tracer only), and changing it is a baseline revision, not a writer's choice; (2) licensing — virtual IOS-XE requires entitlement the group does not hold, and no commercial licence is purchased; (3) host resources — `vpnz-hvhost01` already carries a 19-VM estate sized at 42 vCPU and 78 GB RAM; (4) reproducibility — all four students must rebuild the topology identically from a clean host, which a `.pkt` file permits and hardware does not. One practical benefit of the choice is recorded: the `.pkt` file is committed to Git and reopened by any member or the assessor, which serves the WSOS `agreement and sign-off` obligation better than an undocumented hardware bench.

#### 9.2.4 Support-level table

| Technology | Support | What the project does | Residual limitation |
|---|---|---|---|
| IOS routers and multilayer switches (CLI, interfaces, static routing) | **Full** | Configured natively; `show version`, `show ip interface brief`, `show run` captured | No real forwarding or line-rate figures |
| VLANs, access ports, 802.1Q trunks, native VLAN, allowed lists | **Full** | Configured natively; `show vlan brief`, `show interfaces trunk` captured | No trunking to real hosts, so VM VLAN placement uses hypervisor host-only networks |
| VLAN 999 native VLAN, shutdown black-hole ports | **Full** | Implemented exactly as the baseline specifies | None |
| RSTP / rapid-PVST, root priority, PortFast, BPDU Guard, Root Guard | **Partial** — roles and states modelled, timings not | Root and role behaviour demonstrated; convergence figures labelled artefacts | No credible millisecond convergence measurement |
| Port security, DHCP snooping, Dynamic ARP Inspection | **Partial** — first two work, DAI is not faithful | Port security and DHCP snooping configured and tested; DAI only as documented extrapolation if accepted | DAI may not be executable; must be labelled |
| HSRP (groups, priority, preempt, tracking) | **Full** for HSRPv1 semantics | Four groups implemented; failover demonstrated | HSRPv2 semantics not exercised |
| GLBP / VRRP on Cisco devices | **Not supported / partial** | GLBP not used; VRRP is delivered by Keepalived on Linux instead | GLBP is a named WSOS technology this project cannot demonstrate. Declared gap |
| EtherChannel — PAgP / LACP / static | **Not supported** on the models used | Omitted; real-equipment configuration in §9.6.4 | LACP and PAgP are named WSOS technologies that cannot be evidenced. Declared gap |
| OSPFv2 single area — interface config, authentication, passive interfaces, timers, DR/BDR | **Full** for single-area use | Implemented on both cores, the HQ edge and `VP-BR-EDGE-01` | Multi-area, NSSA/stub tuning, OSPFv3, MPLS excluded by design |
| OSPF SHA-256 authentication | **Partial** — MD5 reliable, SHA image-dependent | MD5 key chain is the working configuration; SHA-256 attempted and marked **[ASSUMPTION]** | If SHA fails, the report records MD5 as implemented and SHA as future work |
| EIGRP classic mode AS 100 (timers, passive interfaces, MD5, bandwidth/delay) | **Full** for classic mode | Implemented on `VP-MO-EDGE-01` and `VP-HQ-EDGE-01` | Named mode and wide metrics not claimed |
| eBGP peering, prefix lists, route maps, local preference, MED, AS-path prepend, `maximum-prefix` | **Partial** — the listed essentials work | Two-provider scenario with full prefix control | No route reflectors, confederations, `add-path`, BGPsec, RPKI |
| VRF, VRF-lite, route leaking, Policy-Based Routing | **Not supported faithfully** | **Not used.** Separation is by physical interface, VLAN, ACLs and ASA security levels; steering uses static routes, BGP attributes and ASA policy | The design cannot claim routing-table-level isolation or PBR, only interface- and firewall-level isolation |
| NAT: static, dynamic, PAT/overload, port forwarding | **Full** on IOS and for the ASA forms used | IOS NAT/PAT on `VP-HQ-EDGE-01`; ASA static NAT, dynamic PAT and exemption on `VP-HQ-FW-01` | NAT64/NAT66 and CGNAT out of scope (IPv4-only project) |
| ASA security levels, ACLs, object groups, inspection, static routes | **Full** for the classic feature set | Implemented for TB-04, TB-05, TB-06, TB-13, TB-15 | FirePOWER/SFR, clustering, failover pairs absent — not claimed |
| ASA NAT exemption for IPsec | **Partial** — depends on support for the conditional `no-proxy-arp route-lookup` form | Configured as §9.12.3 specifies; if rejected, the simpler exemption form is used and the substitution documented | Syntax may differ from a real 9.16(4) appliance |
| IPsec site-to-site, IKEv1/IKEv2, PSK and certificate authentication | **Partial** — IKEv1/PSK reliable, IKEv2 with certificates not dependable | Tunnel built and evidenced; if IKEv2-with-certificates cannot complete, the IKEv1/PSK form is used, the substitution stated, and the real-equipment IKEv2 configuration given as Track B | The project must **not** claim an IKEv2 certificate-based tunnel unless a capture proves it |
| Advanced QoS (policy maps, shaping, policing, MQC) | **Not supported** faithfully | **Not attempted.** Voice quality rests on VLAN separation, DHCP option 066 and CUCM Express registration only | Voice QoS cannot be claimed. Declared gap |
| CDP / LLDP discovery | **Full** for CDP; **partial** for LLDP | CDP enabled; LLDP configured and captured if accepted, else documented as a real-hardware addition | LLDP-MED and LLDP on the ASA may be unavailable |
| SNMP | **Partial** — SNMPv2c works, SNMPv3 authPriv unreliable | SNMPv3 `authPriv` is the design position (community strings forbidden); if rejected the limitation is recorded and SNMPv3 is evidenced against the Linux estate rather than falling back to a community string | Device SNMPv3 may be evidenced only on the server estate |
| Syslog | **Full** — `logging host` to UDP 514 works | Implemented to `vpnz-mon01` (10.10.30.31) with msec timestamps | UDP 514 is unauthenticated — a recorded lab simplification |
| NetFlow / Flexible NetFlow / IPFIX | **Not supported** | Documented limitation; real-equipment configuration as Track B in §9.13.3; the role is filled by SNMP counters, Syslog and `tcpdump` | No flow telemetry from any simulated device. Declared gap |
| NTP client and authentication | **Partial** — client config accepted, simulated server may not serve time | `ntp server 10.10.30.11` plus authentication on every device; authoritative time is `vpnz-dc01` | Packet Tracer timestamps are not guaranteed to reflect real system time |
| TFTP configuration backup | **Partial** — file-transfer simulation is cosmetic | Configurations exported as text files committed to Git under `03-build/packet-tracer/configs/`; TFTP to `vpnz-mon01:/srv/tftp/` demonstrated against the real estate | No automated backup can log in to a simulated device |
| Stacking, vPC, MPLS, VXLAN, SDN controllers, SD-WAN, ACI | **Not supported** | **Not used and not claimed.** SDN is explicitly the sibling topic (Victor3); the WSOS SDN line is acknowledged as a know/understand item this project does not implement | Declared gap, with the standard line quoted so the exclusion is visible |

---

### 9.3 Physical and Logical Topology

[FIGURE: Packet Tracer physical-view screenshot of `05-full.pkt` showing all sixteen logical devices by site — HQ campus centre, simulated Internet/ISP cloud above, Kwun Tong and Macau WAN legs right, Wan Chai IPsec peer left, with device models and interface labels visible. Caption: "Figure 9.1: Full Packet Tracer topology, `05-full.pkt` — 16 logical devices — captured from Packet Tracer's Physical workspace showing device models — {date}".]

The logical topology is a two-tier campus (core and access) with a collapsed-core edge and a firewall-on-a-stick DMZ.

```text
                        [ Simulated Internet / CLOUD ]  192.0.2.0/24  203.0.113.0/29
                                       |
             eBGP AS 65000  (10.10.100.0/30, 10.10.100.4/30, 10.10.100.40/30)
                                       |
                              VP-ISP-EDGE-01 (AS 65000)  gi0/0 .2 | gi0/1 .6 | gi0/2 .42
                                       |
  gi0/0 10.10.100.1/30
  VP-HQ-EDGE-01 (AS 65001)  lo0 10.255.0.21/32
    gi0/1 192.0.2.2/30 <-- outside --> VP-HQ-FW-01 (ASA 5506-X): outside 198.51.100.1
    gi0/2 10.10.100.33/30 --> VP-BR-EDGE-01 10.10.100.34/30   (OSPF area 0)
    gi0/3 10.10.100.37/30 --> VP-MO-EDGE-01 10.10.100.38/30   (EIGRP AS 100)
    gi1/0..gi1/3 --> VLAN 10 (10.10.10.1), VLAN 20 (10.20.20.1),
                     VLAN 30 (10.10.30.253), VLAN 40 (10.10.40.253)

  ================ VLAN 10 LAN-HQ-CORE 10.10.10.0/24 (L2 transit) ================
   VP-HQ-CORE-01  lo0 10.255.0.11  mgmt 10.20.20.11 <== core trunk ==>
   HSRP active (150) / RSTP root primary (802.1Q, native 999)   VP-HQ-CORE-02  lo0 10.255.0.12
   gi1/0/2 --> VP-HQ-EDGE-01                                    mgmt 10.20.20.12
   gi1/0/4 --> VP-HQ-FW-01 inside 10.10.50.2/28                 HSRP standby (100) / RSTP secondary
   gi1/0/3..6 --> VP-HQ-DSW-A01 (VLAN40) | A02 (VLAN40) | A03 (VLANs 20,70) | A04 (VLANs 30,45,50,60,80,90)

   VP-HQ-FW-01: outside 198.51.100.1/29 | dmz 10.10.90.1/24 | mgmt 10.20.20.32
   VP-HQ-VOICE-01 10.10.45.11/24 --> VP-HQ-DSW-A04 access port (VLAN 45)

  Kwun Tong                     Macau                          Wan Chai
   VP-BR-EDGE-01 AS 65001 spoke   VP-MO-EDGE-01 EIGRP 100        VP-WC-EDGE-01 AS 65021
     lo0 10.255.0.31                lo0 10.255.0.41                lo0 10.255.0.51
     gi0/0.110-113 10.10.110-113.1  gi0/0.120/.121 10.10.120.1/121.1  outside 203.0.113.5/29
     trunk --> VP-BR-DSW-A01        trunk --> VP-MO-DSW-A01        gi0/0.130/.131 10.10.130.1/131.1
                                                                     trunk --> VP-WC-DSW-A01
                                    IPsec IKEv2 <=== ASA 198.51.100.1 (VLAN 131 only)
```

#### 9.3.1 Topology-to-trust-zone mapping

| Trust zone | Devices terminating the zone here | Boundary enforcement | TB rows |
|---|---|---|---|
| `Z-CORE` | `VP-HQ-CORE-01/02`, VLAN 10 `LAN-HQ-CORE` | SVI interface ACLs; no firewall inside the core — the core is trusted, not a security boundary (stated as an assumption) | — |
| `Z-MGMT` | VLAN 20 on `VP-HQ-DSW-A03`; management addresses of all sixteen devices; ASA management interface | VTY ACLs (`ACL-MGMT-IN-10`) on every device; no user VLAN trunked to `VP-HQ-DSW-A03` | TB-07, TB-08 |
| `Z-SERVER` | VLAN 30 and VLAN 80 on `VP-HQ-DSW-A04` | HSRP group 1 (VLAN 30, `0000.0c07.ac01`) and group 4 (VLAN 80, `0000.0c07.ac04`) gateways; the nftables pair filters server egress | TB-01, TB-03 |
| `Z-USER` | VLAN 40 on `VP-HQ-DSW-A01/A02`; branch VLANs 110/111 | HSRP group 2 gateway; port security and DHCP snooping | TB-01, TB-02 |
| `Z-STUDENT` | VLAN 70 on `VP-HQ-DSW-A03` only | HSRP group 3 gateway with no route off-segment other than the permitted jump-box path | TB-09, TB-10 |
| `Z-EGRESS` | VLAN 50 between the cores, nftables pair and ASA inside | The nftables HA pair (`vpnz-nft01/02`, VIP 10.10.50.10) — genuinely configured Linux | TB-02, TB-03 |
| `Z-DMZ` | VLAN 90 behind `VP-HQ-FW-01` | **The ASA is the DMZ default gateway** (10.10.90.1), enforcing TB-04, TB-05, TB-13, TB-15 | TB-04, TB-05, TB-13, TB-15 |
| `Z-WAN` | `VP-ISP-EDGE-01`; the `/30` links on VLAN 100 | eBGP prefix control on `VP-HQ-EDGE-01`; the ASA outside ACL | TB-06, TB-14 |
| `Z-REMOTE` | IPsec peer `VP-WC-EDGE-01` outside 203.0.113.5 | ASA crypto map and patched IKEv2 header | TB-11, TB-12 |

Two statements accompany this table: **the ASA is the DMZ gateway and no other device may be** (there is no SVI for VLAN 90 on either multilayer switch, and VLAN 90 is not trunked to any user-facing switch); and **`Z-STUDENT` isolation is not enforced by a firewall** — it rests on the absence of a route plus an explicit deny, which is weaker than an inline firewall and is documented as such.

---

### 9.4 Device Inventory and Cabling

#### 9.4.1 Device, model and software inventory

Exact IOS/ASA image strings are unknown at proposal time. The baseline records them as **[UNCERTAIN]** and imposes a build-day action: capture `show version` on every device on the first build day and record the actual strings in the version-deviations subsection.

| Device(s) | Baseline model expectation | Expected software string | Interfaces used | Role |
|---|---|---|---|---|
| `VP-HQ-CORE-01`, `VP-HQ-CORE-02` | Cisco multilayer (L3) switch | Cisco IOS 15.2-family image bundled with the Packet Tracer release | 8 / 6 | HQ core, OSPF, HSRP active/standby, RSTP root/secondary |
| `VP-HQ-DSW-A01`–`A04` (four separate devices) | Cisco 24-port access switch | as above | 1 uplink + 12 / 12 / 6 / 12 access | HQ access tiers per §9.4.2 |
| `VP-HQ-EDGE-01` | Cisco ISR-class router | Cisco IOS 15.2 (PT bundled) | 4 LAN + 4 WAN | HQ WAN edge, eBGP, redistribution, NAT |
| `VP-HQ-FW-01` | **Cisco ASA 5506-X** | **ASA 9.16(4)** | 3 + management | DMZ and perimeter firewall |
| `VP-BR-EDGE-01` | Cisco ISR-class router | Cisco IOS 15.2 (PT bundled) | 1 WAN + 4 subinterfaces | Kwun Tong router, OSPF spoke |
| `VP-BR-DSW-A01` | Cisco 24-port access switch | as above | 1 uplink + 8 access | Kwun Tong access |
| `VP-MO-EDGE-01` | Cisco ISR-class router | Cisco IOS 15.2 (PT bundled) | 1 WAN + 2 subinterfaces | Macau router, EIGRP 100 |
| `VP-MO-DSW-A01` | Cisco 24-port access switch | as above | 1 uplink + 4 access | Macau access |
| `VP-WC-EDGE-01` | Cisco ISR-class router | Cisco IOS 15.2 (PT bundled) | 1 outside + 2 subinterfaces | Wan Chai router, IPsec peer, AS 65021 |
| `VP-WC-DSW-A01` | Cisco 24-port access switch | as above | 1 uplink + 4 access | Wan Chai access |
| `VP-ISP-EDGE-01` | Cisco ISR-class router | Cisco IOS 15.2 (PT bundled) | 3 | Simulated provider edge, AS 65000 |
| `VP-HQ-VOICE-01` | Cisco ISR-class router | Cisco IOS 15.2 (PT bundled) | 1 | CUCM Express in VLAN 45 |

The `show version` string read from each device on build day is recorded verbatim; the report must state the actual build rather than the expectation above.

#### 9.4.2 Interface-level connection table

Addresses are verbatim from the canonical baseline. The WAN subnet `10.10.100.4/30` (HQ edge ↔ backup provider edge) IS addressed: `VP-HQ-EDGE-01` takes 10.10.100.5 and `VP-ISP-EDGE-01 gi0/1` takes 10.10.100.6, per the baseline's §5.2 row and Rev 1.1 ruling C-03. The earlier not-addressed note is withdrawn.

| Device | Interface | Address | Connects to | Notes |
|---|---|---|---|---|
| `VP-HQ-EDGE-01` | `Loopback0` | 10.255.0.21/32 | — | OSPF and BGP router ID source |
| | `gi0/0` | 10.10.100.1/30 | `VP-ISP-EDGE-01 gi0/0` 10.10.100.2/30 | Primary provider; eBGP AS 65000 |
| | `gi0/1` | 192.0.2.2/30 | Simulated ISP / outside segment | Second eBGP session and ASA outside handoff |
| | `gi0/2` | 10.10.100.33/30 | `VP-BR-EDGE-01 gi0/1` 10.10.100.34/30 | OSPF area 0 over WAN1 |
| | `gi0/3` | 10.10.100.37/30 | `VP-MO-EDGE-01 gi0/1` 10.10.100.38/30 | EIGRP AS 100 domain boundary |
| | `gi1/0` / `gi1/1` | 10.10.10.1/24 / 10.20.20.1/24 | `VP-HQ-CORE-01` trunk (VLAN 10 / VLAN 20) | `LAN-HQ-CORE` / `MGMT-OOB` |
| | `gi1/2` / `gi1/3` | 10.10.30.253/24 / 10.10.40.253/23 | `VP-HQ-CORE-01` trunk (VLAN 30 / VLAN 40) | HSRP group 1 / group 2 standby-side address |
| `VP-HQ-CORE-01` | `Loopback0` | 10.255.0.11/32 | — | OSPF router ID; `ip ospf priority 200` |
| | `Vlan10` / `Vlan20` | 10.10.10.2/24 / 10.20.20.11/24 | HQ edge and core transit | Transit SVI / management SVI and device address |
| | `Vlan30` / `Vlan40` / `Vlan70` / `Vlan80` | 10.10.30.1/24 / 10.10.40.1/23 / 10.70.0.1/24 / 10.10.80.1/24 | — | HSRP groups 1–4 active (150) |
| | `Vlan45` / `Vlan50` / `Vlan60` | 10.10.45.1/24 / 10.10.50.1/28 / 10.10.60.1/24 | — | Voice (option 066 = 10.10.45.11) / egress (next hop nftables VIP 10.10.50.10) / reserved |
| | `gi1/0/1` | trunk, native 999 | `VP-HQ-CORE-02 gi1/0/1` | Core trunk; allowed 10,20,30,40,45,50,60,70,80,90,999 |
| | `gi1/0/2` | trunk, native 999 | `VP-HQ-EDGE-01` | Core-to-edge VLAN 10 trunk |
| | `gi1/0/3`–`gi1/0/6` | trunk, native 999 | `VP-HQ-DSW-A01`–`A04` uplinks | Allowed 10,40,999 / 10,40,999 / 10,20,70,999 / 10,30,45,50,60,80,90,999 |
| `VP-HQ-CORE-02` | `Loopback0` | 10.255.0.12/32 | — | OSPF router ID; `ip ospf priority 100` |
| | `Vlan10` / `Vlan20` | 10.10.10.3/24 / 10.20.20.12/24 | — | Transit and management SVIs |
| | `Vlan30` / `Vlan40` / `Vlan70` / `Vlan80` | 10.10.30.2/24 / 10.10.40.2/23 / 10.70.0.2/24 / 10.10.80.2/24 | — | HSRP standby (100) for groups 1–4 |
| | `gi1/0/1`, `gi1/0/3`–`gi1/0/6` | trunk, native 999 | core trunk; second uplink to `DSW-A01`–`A04` | Provides the alternate path RSTP must block in one direction |
| `VP-HQ-DSW-A01`, `A02` | `gi0/1` / `gi0/2` | trunk, native 999 | `CORE-01` / `CORE-02` uplinks | `gi0/1` cost 4 priority 64; `gi0/2` cost 19 priority 128 |
| | `gi0/3`–`gi0/14` | access VLAN 40 | HQ workstations | PortFast, BPDU Guard, port security |
| `VP-HQ-DSW-A03` | `gi0/1` / `gi0/2` | trunk, native 999 | `CORE-01` / `CORE-02` uplinks | Allowed 10,20,70,999 only |
| | `gi0/3`–`gi0/5` | access VLAN 20 | ASA mgmt 10.20.20.32, jump box | Management |
| | `gi0/6`–`gi0/8` | access VLAN 70 | Isolated lab endpoints | No route off-segment |
| `VP-HQ-DSW-A04` | `gi0/1` / `gi0/2` | trunk, native 999 | `CORE-01` / `CORE-02` uplinks | Allowed 10,30,45,50,60,80,90,999 |
| | `gi0/3`–`gi0/6` | access VLAN 30 | Server estate | — |
| | `gi0/7` | access VLAN 45 | `VP-HQ-VOICE-01` 10.10.45.11 | Voice |
| | `gi0/8`–`gi0/9` | access VLAN 50 | nftables pair, ASA inside | `Z-EGRESS` |
| | `gi0/10`–`gi0/11` | access VLAN 80 | Storage | — |
| | `gi0/12`–`gi0/14` | access VLAN 90 | DMZ hosts, ASA dmz side | `Z-DMZ` |
| | `gi0/15`–`gi0/16` | access VLAN 60 | Reserved | Undeployed |
| `VP-BR-DSW-A01` | `gi0/1` | trunk via `VP-BR-EDGE-01` subinterfaces | `VP-BR-EDGE-01` | Allowed 110,111,112,113,999 |
| | `gi0/3`–`gi0/5` / `gi0/6`–`gi0/8` / `gi0/9`–`gi0/10` / `gi0/11`–`gi0/12` | access VLAN 110 / 111 / 112 / 113 | Branch workstations, phones, management | `gi0/12` = `vpnz-brdc01` host NIC 10.10.113.11 |
| `VP-MO-DSW-A01` | `gi0/1`; `gi0/3`–`gi0/5` / `gi0/6`–`gi0/7` | trunk via `VP-MO-EDGE-01`; access VLAN 120 / 121 | `VP-MO-EDGE-01`; Macau workstations and phones | Allowed 120,121,999 |
| `VP-WC-DSW-A01` | `gi0/1`; `gi0/3`–`gi0/5` / `gi0/6`–`gi0/8` | trunk via `VP-WC-EDGE-01`; access VLAN 130 / 131 | `VP-WC-EDGE-01`; Wan Chai workstations and integration endpoints | Allowed 130,131,999 |

WAN and perimeter links: primary transit `VP-HQ-EDGE-01 gi0/0` ↔ `VP-ISP-EDGE-01 gi0/0` (eBGP 65001↔65000); backup provider leg `10.10.100.4/30` (`VP-HQ-EDGE-01` 10.10.100.5 ↔ `VP-ISP-EDGE-01 gi0/1` 10.10.100.6); outside segment `VP-HQ-EDGE-01 gi0/1` to the ASA outside 198.51.100.1/29; Kwun Tong WAN1 `gi0/2` ↔ `VP-BR-EDGE-01 gi0/1` (OSPF); Macau `gi0/3` ↔ `VP-MO-EDGE-01 gi0/1` (EIGRP); alternate provider to `VP-ISP-EDGE-01 gi0/2` 10.10.100.42/30 (eBGP 65001↔65002); ASA dmz 10.10.90.1/24 to a `VP-HQ-DSW-A04` access port on VLAN 90; ASA inside 10.10.50.2/28 (VLAN 50 `TRANSIT-EGRESS` `10.10.50.0/28`, usable .1-.14) to a `VP-HQ-DSW-A04` access port on VLAN 50, next hop 10.10.50.10.

Cabling is drawn with Packet Tracer's connection tool and captured in Figure 9.1. Because Packet Tracer is a simulator, cable type is cosmetic; the report must not claim a specific physical medium was used or tested.

---

### 9.5 Base Device Configuration and Standardisation

#### 9.5.1 The standard template

Every one of the sixteen devices receives the following baseline before any protocol is configured. The example is `VP-HQ-CORE-01`; hostname and management address are substituted per device.

```cisco
! ===== BASELINE TEMPLATE — apply to every Packet Tracer device =====
hostname VP-HQ-CORE-01
ip domain name vertexpeak.fyp.lab
no ip domain lookup
enable algorithm-type scrypt secret <REDACTED-ENABLE-SECRET>
service password-encryption
username adm-net01 privilege 15 algorithm-type scrypt secret <REDACTED>
username adm-net02 privilege 15 algorithm-type scrypt secret <REDACTED>
username svc_monitoring privilege 1 algorithm-type scrypt secret <REDACTED>
! [ASSUMPTION / LIMITATION] No TACACS+ server exists in this project, so
! `group tacacs+` can never succeed and authentication always resolves through
! `local`. AAA is configured; the external AAA server is NOT part of this
! deliverable and the report says so.
aaa new-model
aaa authentication login default group tacacs+ local
aaa authentication login CONSOLE local
aaa authorization exec default local
aaa accounting exec default start-stop group tacacs+
line console 0
 login authentication CONSOLE
 exec-timeout 5 0
 logging synchronous
line vty 0 15
 login authentication default
 transport input ssh
 exec-timeout 5 0
 logging synchronous
ip ssh version 2
ip ssh time-out 60
ip ssh authentication-retries 3
crypto key generate rsa general-keys modulus 2048
! 2048 bits is the design minimum; [ASSUMPTION] 4096 is preferred where the
! simulator supports it. Record the actual modulus from
! `show crypto key mypubkey rsa`.
no ip http server
no ip http secure-server
no service pad
no service finger
ip access-list standard ACL-MGMT-IN-10
 remark [permit management only from Z-MGMT 10.20.20.0/24]
 permit 10.20.20.0 0.0.0.255
 remark [permit automation and monitoring from vpnz-mon01]
 permit host 10.10.30.31
 remark [permit read-only AI agent — TB-16]
 permit host 10.10.30.51
 deny   any log
line vty 0 15
 access-class ACL-MGMT-IN-10 in
banner motd ^C
***************************************************************************
*  Vertex Peak Financial Technologies Limited — PROPERTY OF VERTEX PEAK    *
*  Unauthorised access is prohibited and is logged. Authorised users only. *
*  All administrative actions are auditable (GG-Server-Admins/Tier0).      *
***************************************************************************
^C
service timestamps debug datetime msec localtime show-timezone
service timestamps log datetime msec localtime show-timezone
clock timezone HKT 8
ntp authentication-key 1 md5 <REDACTED>
ntp authenticate
ntp trusted-key 1
ntp server 10.10.30.11 key 1 prefer
ntp server 10.10.30.12 key 1
logging on
logging host 10.10.30.31
logging trap informational
logging source-interface Loopback0
logging buffered 16384 informational
snmp-server engineID local <REDACTED-ENGINE-ID>
snmp-server view VIEW-FYP-RO iso included
snmp-server group GRP-FYP-RO v3 priv read VIEW-FYP-RO
snmp-server user svc_monitoring GRP-FYP-RO v3 auth sha <REDACTED> priv aes 128 <REDACTED>
snmp-server host 10.10.30.31 version 3 priv svc_monitoring
snmp-server location "Vertex Peak HQ - Sha Tin"
snmp-server contact "IT Network Engineering Workstream"
snmp-server enable traps snmp linkdown linkup coldstart warmstart authentication
snmp-server enable traps syslog
cdp run
cdp timer 60
cdp holdtime 180
lldp run
ip default-gateway 10.20.20.1
interface Vlan20
 description [to Z-MGMT VLAN20 MGMT-OOB]
 ip address 10.20.20.11 255.255.255.0
 no shutdown
end
write memory
```

#### 9.5.2 Hardening settings and why each matters

| Setting | Why it matters |
|---|---|
| `enable algorithm-type scrypt secret` | A plain `enable password` is stored reversibly and exposed by Type 7 encoding; scrypt is a one-way hash, chosen over MD5 because MD5 cracking is trivial |
| Per-administrator named `privilege 15` accounts | The baseline forbids shared accounts: every administrative action must be attributable to `adm-{initials}`. Two administrator accounts plus one read-only monitoring account exist per device |
| `svc_monitoring` at privilege 1 | The monitoring identity must read counters and nothing else |
| `service password-encryption` | Defence in depth for residual clear-text secrets such as an NTP key. Explicitly **not** treated as protection; the design relies on not storing recoverable secrets |
| `aaa new-model` with `local` fallback | Centralised policy with a survivable local fallback, so a lost AAA server cannot lock the estate out of its own devices |
| `transport input ssh` | Telnet sends credentials in clear text; disabling it is the highest-value transport control on a network device |
| `ip ssh version 2`, RSA 2048 (4096 attempted) | SSH v1 is cryptographically broken and is disabled; the host key underpins every management session and a short modulus is a practical forgery risk |
| `ip ssh time-out 60` / `authentication-retries 3` | Bounds the brute-force window on an interactive login |
| `exec-timeout 5 0`, `logging synchronous` | An unattended authenticated session is a takeover path; synchronous logging prevents unsolicited output garbling an administrator's command line, an integrity control on change work |
| `banner motd` | The legal and audit notice; it states that access is logged, which is required if logs are ever used as evidence |
| `no ip domain lookup` | Prevents a mistyped command triggering a DNS lookup that stalls the CLI |
| `no ip http server`, `no ip http secure-server`, `no service pad`, `no service finger` | Unused web and legacy management services are a large attack surface with no role in the design |
| `clock timezone HKT 8` plus authenticated NTP | Correct time is a security control: Kerberos fails beyond five minutes of skew and log correlation is impossible without it |
| `logging host 10.10.30.31`, `logging trap informational` | Without centralised logging a denied packet or failed login leaves no evidence; this also feeds the Monitoring and AI lines |
| SNMPv3 `authPriv` only | SNMPv2c community strings are clear text and are forbidden by the baseline |
| `access-class ACL-MGMT-IN-10 in` | Restricts interactive management to `Z-MGMT`, the automation node and the read-only AI agent — TB-07 and TB-16 enforced at the device |
| `cdp run`, `lldp run` | CDP is a named WSOS discovery tool and is useful for adjacent-device documentation; it is also a reconnaissance aid, so the policy is stated (§9.13.1) |
| `shutdown` on all unused ports (VLAN 999) | An open port on an unmonitored VLAN is the cheapest way into a building network |
| Restricted trap set (`linkdown`, `linkup`, …) | Every-category traps are noise, and noise destroys the signal the monitoring line needs |
| Configuration archive | Every device configuration is exported as a text file and committed to Git; TFTP to `vpnz-mon01:/srv/tftp/` is demonstrated on the real estate |

---

### 9.6 VLANs, Trunking and Spanning Tree

#### 9.6.1 VLAN plan implementation

VLAN identifiers and names are the canonical baseline strings, entered exactly, because the automation and monitoring lines match on those names.

```cisco
! --- HQ core and HQ access switches ----------------
vlan 10
 name LAN-HQ-CORE
vlan 20
 name MGMT-OOB
vlan 30
 name SRV-HQ-1
vlan 40
 name USER-HQ-STF
vlan 45
 name VOICE-HQ
vlan 50
 name TRANSIT-EGRESS
vlan 60
 name SRV-HQ-2
vlan 70
 name STUDENT-LAB
vlan 80
 name STORAGE-HQ
vlan 90
 name DMZ-HQ
vlan 999
 name UNUSED-BLACKHOLE
! VLAN 1 exists by default and carries no traffic: never a native VLAN, never
! assigned to an access port, never in an allowed list.
! --- VP-BR-DSW-A01: 110 BR-SALES, 111 BR-STAFF, 112 BR-VOICE, 113 BR-MGMT, 999 UNUSED-BLACKHOLE
! --- VP-MO-DSW-A01: 120 MO-LAN, 121 MO-VOICE, 999 UNUSED-BLACKHOLE
! --- VP-WC-DSW-A01: 130 WC-LAN, 131 WC-DEV, 999 UNUSED-BLACKHOLE
! --- Access port template (VLAN 40 user ports, VP-HQ-DSW-A01) ----------
interface range gi0/3-14
 description [to HQ workstation VLAN40 Z-USER]
 switchport mode access
 switchport access vlan 40
 switchport nonegotiate
 switchport port-security
 switchport port-security maximum 2
 switchport port-security mac-address sticky
 switchport port-security violation restrict
 switchport port-security aging time 60
 spanning-tree portfast
 spanning-tree bpduguard enable
 no shutdown
! --- Black-hole every unused port on every switch ----------------------
interface range gi0/15-24
 description [UNUSED - blackholed VLAN999]
 switchport mode access
 switchport access vlan 999
 switchport nonegotiate
 shutdown
```

Four characteristics make the plan defensible rather than decorative: (1) **VLAN 40 is a `/23`** (`10.10.40.0/23`) because 110 HQ staff plus growth does not fit a clean DHCP pool in a `/24`, so both cores carry `10.10.40.1/23` and `10.10.40.2/23` with HSRP on `10.10.40.254`; (2) **VLAN 90 is not trunked to any user switch and has no SVI on either core** — the ASA at `10.10.90.1` is the DMZ gateway, which is the mechanism of the DMZ boundary, not merely the intention; (3) **VLAN 20 sits at `10.20.20.0/24`, deliberately outside `10.10.0.0/16`**, so a routing mistake in production space cannot expose management; (4) **VLAN 70 sits at `10.70.0.0/16`**, also disjoint, with isolation enforced by the absence of a route plus the explicit denies in §9.12.

#### 9.6.2 802.1Q trunking

Every trunk carries the native VLAN **999 `UNUSED-BLACKHOLE`**, never VLAN 1, with an explicit allowed-VLAN list.

```cisco
! --- VP-HQ-CORE-01 trunk template --------------------------------
interface gi1/0/1
 description [to VP-HQ-CORE-02 Gi1/0/1 VLAN10 Z-CORE]
 switchport trunk encapsulation dot1q
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,20,30,40,45,50,60,70,80,90,999
 switchport nonegotiate
 no shutdown
! Repeat on gi1/0/2 (to VP-HQ-EDGE-01, allowed 10,20,30,40,999) and
! gi1/0/3-6 (to VP-HQ-DSW-A01-A04, allowed lists per the table below).
```

| Trunk | Allowed VLANs | Reason for that list |
|---|---|---|
| Core-to-core (`gi1/0/1`) | 10,20,30,40,45,50,60,70,80,90,999 | Must carry any VLAN either core serves; the only cross-core path |
| Cores to `DSW-A01`/`A02` | 10,40,999 | Those switches serve only user VLAN 40; anything else adds an unnecessary broadcast domain |
| Cores to `DSW-A03` | 10,20,70,999 | Management and isolated lab only. **No user VLAN is permitted here** — this keeps `Z-MGMT` off user access switches |
| Cores to `DSW-A04` | 10,30,45,50,60,80,90,999 | Server, voice, egress, storage and DMZ segments |
| Core to `VP-HQ-EDGE-01` | 10,20,30,40,999 | The edge router needs the user and server VLANs for HSRP tracking and the staged routing design |
| Branch/small-office trunks | 110–113,999 / 120,121,999 / 130,131,999 | Branch VLANs only; **no HQ VLAN is ever stretched to a branch** — inter-site traffic is routed |

**Why native VLAN 999.** 802.1Q frames in the native VLAN are transmitted untagged. VLAN 1 exists by default on every Cisco switch and is the default native *and* management VLAN, which makes it the classic vector for VLAN hopping and for accidental cross-connection of separate segments. Setting the native VLAN to a dedicated unused VLAN removes the untagged path from every real segment and produces an immediate visible alarm (a CDP native VLAN mismatch message) if two mismatched trunks are ever joined — a diagnostic used deliberately in §9.16. **Why explicit allowed lists.** The default allows every VLAN, so a new VLAN propagates itself to every trunk; an explicit list makes that propagation a decision and bounds the blast radius of a spanning-tree change. **Why `switchport nonegotiate`.** DTP broadcasts trunk willingness; on an access port facing a workstation, or the isolated `STUDENT-LAB` segment, that advertisement is an invitation to negotiate a trunk.

#### 9.6.3 Rapid Spanning Tree (RSTP / IEEE 802.1w)

**Why RSTP rather than classic STP.** Each of the four access switches is dual-homed to both cores, producing a physical loop at every access switch. Without spanning tree a single broadcast frame on VLAN 40 would circulate until the links saturated (§9.16). Classic 802.1D converges in the order of 30–50 seconds; IEEE 802.1w introduces the proposal/agreement handshake, synchronous port roles and immediate-forwarding edge ports, reducing recovery to a sub-second or low-second event on real hardware. For a design whose failure tests include "pull an uplink and measure how long the user is cut off", RSTP is the appropriate mechanism.

| Role | Meaning | States | Where it appears here |
|---|---|---|---|
| Root | Lowest-cost path to the root bridge | Forwarding | Core uplink toward the root side; on an access switch, the single uplink toward whichever core is root |
| Designated | Best port on a segment, forwarding and sending BPDUs | Forwarding | One per segment — the core downlinks toward each access switch |
| Alternate | Backup to the root port, ready to take over | Discarding | The second uplink on each access switch — the port that makes dual-homing useful |
| Backup | Backup to a designated port on the same bridge | Discarding | Not expected here; if it appears it indicates a misconfiguration and is documented as such |
| Disabled | Administratively down or failed | Down | Shutdown VLAN 999 ports |

RSTP's three states are `Discarding`, `Learning` and `Forwarding`; classic `Blocking` and `Listening` were merged into `Discarding`, and this chapter uses `Discarding` throughout.

```cisco
! ===== VP-HQ-CORE-01 — deliberate root bridge for the HQ VLANs =====
spanning-tree mode rapid-pvst
spanning-tree vlan 10,20,30,40,45,50,60,70,80,90,999 root primary
spanning-tree vlan 10,20,30,40,45,50,60,70,80,90,999 priority 4096
spanning-tree portfast bpduguard default
spanning-tree loopguard default
! ===== VP-HQ-CORE-02 — deliberate secondary root =====
spanning-tree mode rapid-pvst
spanning-tree vlan 10,20,30,40,45,50,60,70,80,90,999 root secondary
spanning-tree vlan 10,20,30,40,45,50,60,70,80,90,999 priority 8192
spanning-tree portfast bpduguard default
spanning-tree loopguard default
! ===== All eight access switches =====
spanning-tree mode rapid-pvst
! ===== Access-switch uplink role control — VP-HQ-DSW-A01 =====
interface gi0/1
 description [to VP-HQ-CORE-01 Gi1/0/3 VLAN40 Z-CORE - PRIMARY ROOT PATH]
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,40,999
 spanning-tree vlan 10,40 cost 4
 spanning-tree vlan 10,40 port-priority 64
 spanning-tree guard root
 no shutdown
interface gi0/2
 description [to VP-HQ-CORE-02 Gi1/0/3 VLAN40 Z-CORE - ALTERNATE]
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,40,999
 spanning-tree vlan 10,40 cost 19
 spanning-tree vlan 10,40 port-priority 128
 spanning-tree guard root
 no shutdown
```

| VLAN | Primary root (priority 4096) | Why | Secondary root (8192) |
|---|---|---|---|
| 10 `LAN-HQ-CORE` | `VP-HQ-CORE-01` | Transit traffic reaches `VP-HQ-EDGE-01`, cabled to `CORE-01`; rooting here keeps the transit path one hop | `VP-HQ-CORE-02` |
| 20 `MGMT-OOB` | `VP-HQ-CORE-01` | Management must not depend on the switch being managed; same transit reasoning | `VP-HQ-CORE-02` |
| 30 `SRV-HQ-1` | `VP-HQ-CORE-01` | HSRP group 1 active is `CORE-01`; rooting the L2 topology on the same switch keeps the L2 path and the L3 gateway on one device and avoids a hairpin through the core trunk | `VP-HQ-CORE-02` |
| 40 `USER-HQ-STF` | `VP-HQ-CORE-01` | As VLAN 30 — HSRP group 2 active is `CORE-01` | `VP-HQ-CORE-02` |
| 45 `VOICE-HQ` | `VP-HQ-CORE-01` | Voice is latency-sensitive; a predictable single-hop path matters more than sharing | `VP-HQ-CORE-02` |
| 50 `TRANSIT-EGRESS` | `VP-HQ-CORE-01` | The most security-relevant segment: one known forwarding path is preferred over a load-shared one | `VP-HQ-CORE-02` |
| 60 `SRV-HQ-2` | `VP-HQ-CORE-01` | Reserved; rooted for consistency so the topology is correct when something is deployed | `VP-HQ-CORE-02` |
| 70 `STUDENT-LAB` | `VP-HQ-CORE-01` | The isolated segment's gateway (HSRP group 3) is `CORE-01` | `VP-HQ-CORE-02` |
| 80 `STORAGE-HQ` | `VP-HQ-CORE-01` | iSCSI is bursty and delay-sensitive; the primary path avoids the core trunk | `VP-HQ-CORE-02` |
| 90 `DMZ-HQ` | `VP-HQ-CORE-01` | VLAN 90 has no SVI on either core; rooting it here merely makes the L2 path deterministic | `VP-HQ-CORE-02` |
| 999 `UNUSED-BLACKHOLE` | — | Carries no traffic and all its ports are shut down. **No root tuning is applied and this is deliberate** — there is nothing to optimise, and the absence of tuning is itself documented | — |

The cost asymmetry (4 versus 19) is what makes the access switch's root port the uplink to the *primary* root rather than an accident of port numbering, and makes the role assignment deterministic and therefore debuggable.

| Protection | Where applied | Prevents | Behaviour on violation |
|---|---|---|---|
| `spanning-tree portfast` | All end-user and end-device access ports | A workstation, phone or server port waiting through the STP state machine (which also causes DHCP timeouts) | Port enters forwarding immediately |
| `spanning-tree bpduguard enable` | All end-user access ports, individually plus globally | A user plugging in a switch, hub or unauthorised AP and injecting BPDUs that change the topology | Port goes to `err-disabled` and the event is syslogged; recovery is manual and therefore auditable |
| `spanning-tree guard root` | All core-facing downlink ports on the access switches and the cores' access-facing ports | A rogue device winning the root election and steering campus traffic through itself | Port enters root-inconsistent (discarding) and recovers automatically when the offending BPDUs stop |
| `spanning-tree loopguard default` | Core and access switches | A unidirectional link failure that would otherwise make a port believe it may safely forward, creating a loop | Port moves to loop-inconsistent (discarding) |

```text
VP-HQ-DSW-A01# show spanning-tree vlan 40
VLAN0040
  Spanning tree enabled protocol rstp
  Root ID    Priority    4096      Address 0001.64a2.9c01
             Cost        4         Port 1 (GigabitEthernet0/1)
  Bridge ID  Priority    32768  (priority 32768 sys-id-ext 40)
             Address     0002.17b3.8d01
Interface           Role Sts Cost      Prio.Nbr Type
------------------- ---- --- --------- -------- --------------------------------
Gi0/1               Root FWD 4         64.1     P2p
Gi0/2               Altn BLK 19        128.2    P2p
Gi0/3               Desg FWD 19        128.3    P2p Edge
Gi0/4               Desg FWD 19        128.4    P2p Edge

! What this proves: Root ID priority 4096 shows CORE-01 won the election by
! configuration, not by accident; Gi0/1 is Root FWD at cost 4 while Gi0/2 is
! Altn BLK, showing the cost/port-priority tuning took effect; the access ports
! show P2p Edge, showing PortFast is active. Packet Tracer may display the
! `Altn` role as `BLK` rather than the 802.1w term `Discarding` -- a rendering
! choice, not a protocol difference. Any convergence time derived from these
! events is a simulation artefact.
```

#### 9.6.4 EtherChannel / LACP — declared omission with the real-equipment equivalent

**This design does not use EtherChannel, LACP or PAgP, and this is a decision rather than an oversight.** The baseline states that there is to be no high availability at the hardware layer — no LACP across physical chassis — and the entire Cisco estate is a simulation, so aggregating two simulated links would add configuration surface, produce no genuine bandwidth benefit (there is no real forwarding) and misrepresent what has been demonstrated.

> The WSOS 2026 names `LACP` and `PAgP` in the line `Provide network load balancing & fault tolerance at routing and switching levels by using GLBP, HSRP, VRRP, LACP, PAgP, etc.` This project **does not demonstrate LACP or PAgP**, because the multilayer switch models in Packet Tracer 8.2.2 do not support Port-Channel configuration and because the project's own constraint forbids the physical-layer redundancy LACP exists to provide. Link redundancy is demonstrated instead by **dual-homed access switches with RSTP** (§9.6.3) and by **HSRP** (§9.7.2). LACP and PAgP are recorded as a declared gap and as recommended first-step future work on real equipment, and must never appear in a delivered-features list.

**Track B — real equipment only, not executed:**

```cisco
! ===== TRACK B — REAL EQUIPMENT ONLY. NOT EXECUTED IN PACKET TRACER. =====
! 2-member LACP port-channel, VP-HQ-CORE-01 to VP-HQ-CORE-02, VLAN 10 transit
interface range gi1/0/1, gi1/0/11          ! VP-HQ-CORE-01 (active side)
 description [to VP-HQ-CORE-02 VLAN10 Z-CORE - LACP PORT-CHANNEL]
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,20,30,40
 channel-protocol lacp
 channel-group 1 mode active
 no shutdown
interface port-channel 1
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,20,30,40
 spanning-tree vlan 10,20,30,40 cost 4
 no shutdown
interface range gi1/0/1, gi1/0/11          ! VP-HQ-CORE-02 (passive side)
 channel-protocol lacp
 channel-group 1 mode passive
! Verification on real equipment: show etherchannel summary;
! show etherchannel 1 port-channel; show lacp neighbor; show interfaces port-channel 1
! PAgP equivalent: `channel-protocol pagp` with `channel-group 1 mode desirable`
! (or `auto` on the passive side). PAgP is Cisco-proprietary and would be used
! only where both ends are Cisco; LACP is preferred because it is the open
! standard and because the WSOS names both.
```

#### 9.6.5 Verification

```text
VP-HQ-CORE-01# show vlan brief
VLAN Name                             Status    Ports
---- -------------------------------- --------- -------------------------------
1    default                          active    Gi1/0/8, Gi1/0/9, Gi1/0/10
10   LAN-HQ-CORE                      active    Gi1/0/1, Gi1/0/2, Gi1/0/3
20   MGMT-OOB                         active
30   SRV-HQ-1                         active
40   USER-HQ-STF                      active
45   VOICE-HQ                         active
50   TRANSIT-EGRESS                   active
60   SRV-HQ-2                         active
70   STUDENT-LAB                      active
80   STORAGE-HQ                       active
90   DMZ-HQ                           active
999  UNUSED-BLACKHOLE                 active    Gi1/0/12, Gi1/0/13
1002 fddi-default                     act/unsup
1003 token-ring-default               act/unsup
1004 fddinet-default                  act/unsup
1005 trnet-default                    act/unsup

VP-HQ-CORE-01# show interfaces trunk
Port        Mode         Encapsulation  Status        Native vlan
Gi1/0/1     on           802.1q         trunking      999
Gi1/0/2     on           802.1q         trunking      999
Gi1/0/3     on           802.1q         trunking      999
Gi1/0/4     on           802.1q         trunking      999
Gi1/0/5     on           802.1q         trunking      999
Gi1/0/6     on           802.1q         trunking      999
Port        Vlans allowed on trunk
Gi1/0/1     10,20,30,40,45,50,60,70,80,90,999
Gi1/0/2     10,20,30,40,999
Gi1/0/3     10,40,999
Gi1/0/4     10,40,999
Gi1/0/5     10,20,70,999
Gi1/0/6     10,30,45,50,60,80,90,999
Port        Vlans in spanning tree forwarding state and not pruned
Gi1/0/1     10,20,30,40,45,50,60,70,80,90,999
Gi1/0/3     10,40,999

VP-HQ-DSW-A01# show spanning-tree summary
Switch is in rapid-pvst mode
Root bridge for: none
PortFast BPDU Guard Default  is enabled
Loopguard Default            is enabled
Name                   Blocking Listening Learning Forwarding STP Active
---------------------- -------- --------- -------- ---------- ----------
VLAN0010               1        0         0        1          2
VLAN0040               1        0         0        4          5

! What to look for: every Native vlan must read 999 -- a 1 anywhere is a
! defect. "Vlans allowed on trunk" must match §9.6.2 exactly; a VLAN appearing
! where it should not (VLAN 40 on the DSW-A03 uplink) is a segmentation defect.
! A VLAN allowed but absent from "spanning tree forwarding state" is being
! blocked by STP on that trunk: expected on the alternate uplink, unexpected on
! the primary. The single Blocking port on VLAN 40 is the design working -- the
! alternate uplink. If ZERO ports are discarding on a VLAN with two uplinks
! from one access switch to two cores, either the second uplink is not trunking
! that VLAN or a protection feature has disabled it (§9.16).
```

---

### 9.7 Inter-VLAN Routing and First-Hop Redundancy

#### 9.7.1 SVIs on the multilayer switches

Inter-VLAN routing is performed by SVIs on the two core multilayer switches. There is no router-on-a-stick for HQ VLANs; `VP-HQ-EDGE-01`'s subinterfaces exist for the staged routing design and for HSRP tracking, not because the edge router is the inter-VLAN path.

| VLAN | SVI on `CORE-01` | SVI on `CORE-02` | HSRP VIP (default gateway) |
|---|---|---|---|
| 10 `LAN-HQ-CORE` | 10.10.10.2/24 | 10.10.10.3/24 | — (gateway is 10.10.10.1 on `VP-HQ-CORE-01 gi0/1.10`) |
| 20 `MGMT-OOB` | 10.20.20.11/24 | 10.20.20.12/24 | — (gateway 10.20.20.1 on `VP-HQ-CORE-01 gi0/1.20`) |
| 30 `SRV-HQ-1` | 10.10.30.1/24 | 10.10.30.2/24 | **10.10.30.254** (HSRP group 1) |
| 40 `USER-HQ-STF` | 10.10.40.1/23 | 10.10.40.2/23 | **10.10.40.254** (HSRP group 2) |
| 70 `STUDENT-LAB` | 10.70.0.1/24 | 10.70.0.2/24 | **10.70.0.254** (HSRP group 3) |
| 80 `STORAGE-HQ` | 10.10.80.1/24 | 10.10.80.2/24 | **10.10.80.254** (HSRP group 4) |
| 45 `VOICE-HQ` | 10.10.45.1/24 | — | — (single gateway; the tool is a dedicated router) |
| 50 `TRANSIT-EGRESS` | 10.10.50.1/28 | — | — (egress next hop is the nftables VIP 10.10.50.10) |
| 60 `SRV-HQ-2` | 10.10.60.1/24 | — | — (reserved and undeployed) |

The baseline fixes four VIPs; the group-to-VLAN assignment (1→30, 2→40, 3→70, 4→80) follows the order of the baseline's own VIP summary and is marked **[ASSUMPTION]** because no literal group number is stated there.

> **Baseline contradiction RESOLVED by Rev 1.1 ruling C-14.** §4.1's single group 1 could not serve the four SVIs its own VIP summary listed. The four-group mapping implemented here is **RATIFIED and is now a baseline value**: group 1 to VLAN 30, group 2 to VLAN 40, group 3 to VLAN 70, group 4 to VLAN 80. This chapter implements **four groups (1–4)** so every VLAN has its own virtual MAC (group 2 → `0000.0c07.ac02`, group 3 → `.ac03`, group 4 → `.ac04`, derived from the HSRPv1 formula and marked **[ASSUMPTION]** until confirmed from `show standby`), and **group 1 keeps the baseline's virtual MAC and priority 150 exactly**.

#### 9.7.2 HSRP configuration and failover behaviour

HSRP is chosen over VRRP for the switch SVIs because it is native to Cisco IOS and the baseline fixes it; VRRP appears via Keepalived on the Linux pairs, which the report presents as a deliberate vendor-native versus open-source split. GLBP is **not** used: it would give genuine per-host load balancing, but the simulator does not support it faithfully and claiming it would be dishonest (declared gap, §9.2.4).

```cisco
! ===== VP-HQ-CORE-01 — HSRP ACTIVE (priority 150, preempt) =====
interface Vlan30
 description [SRV-HQ-1 HSRP-ACTIVE group1 Z-SERVER]
 ip address 10.10.30.1 255.255.255.0
 standby 1 ip 10.10.30.254
 standby 1 priority 150
 standby 1 preempt delay minimum 30
 standby 1 timers 1 3
 standby 1 authentication md5 key-string <REDACTED-HSRP-KEY>
 standby 1 name HSRP-SRVHQ1
 standby 1 track gi1/0/3 20
 standby 1 track gi1/0/1 30
 no shutdown
interface Vlan40
 description [USER-HQ-STF HSRP-ACTIVE group2 Z-USER]
 ip address 10.10.40.1 255.255.254.0
 standby 2 ip 10.10.40.254
 standby 2 priority 150
 standby 2 preempt delay minimum 30
 standby 2 timers 1 3
 standby 2 authentication md5 key-string <REDACTED-HSRP-KEY>
 standby 2 name HSRP-USERHQ
 standby 2 track gi1/0/3 20
 standby 2 track gi1/0/4 20
 standby 2 track gi1/0/1 30
 no shutdown
! VLAN 70 group 3 (10.70.0.254, name HSRP-LAB) and VLAN 80 group 4
! (10.10.80.254, name HSRP-STORAGE): identical pattern, tracking the
! respective access uplink with decrement 20.

! ===== VP-HQ-CORE-02 — HSRP STANDBY (priority 100) =====
interface Vlan30
 ip address 10.10.30.2 255.255.255.0
 standby 1 ip 10.10.30.254
 standby 1 priority 100
 standby 1 preempt delay minimum 30
 standby 1 timers 1 3
 standby 1 authentication md5 key-string <REDACTED-HSRP-KEY>
 standby 1 name HSRP-SRVHQ1
 standby 1 track gi1/0/3 20
 no shutdown
! VLANs 40, 70 and 80: identical statements with CORE-02's SVI addresses,
! priority 100, groups 2/3/4 and the matching names and tracked uplinks.
```

| Element | Setting | Reason |
|---|---|---|
| Group numbers | 1→VLAN 30, 2→40, 3→70, 4→80 | One group per VLAN; a single group cannot serve four SVIs. Group 1 retains the fixed virtual MAC `0000.0c07.ac01`. **RATIFIED by Rev 1.1 ruling C-14 — a baseline value, not an assumption** |
| Active / standby priority | 150 on `CORE-01`, 100 on `CORE-02` | Above the default 100, so `CORE-01` always wins when healthy: the outcome is configured, not elected. Leaving the standby at 100 makes intent obvious and leaves headroom |
| `preempt` | Both sides, `delay minimum 30` | Preemption makes a recovered `CORE-01` take the role back rather than lingering as standby. The delay stops it preempting before its routing protocols and interfaces have converged — a device that preempts too early black-holes traffic (§9.16) |
| Timers | `1 3` (hello 1 s, hold 3 s) | The `3 10` default is too slow for a design whose failover is measured; 1-second hellos keep detection inside three seconds while remaining within HSRP's supported range |
| Authentication | MD5 key string on every group | Without authentication any host on the segment can send a higher-priority hello and take the virtual IP |
| Tracking | Access uplink decrement 20, core trunk decrement 30 | If `CORE-01` loses the trunk to the access switches it should stop being their gateway; the decrements drop 150 below `CORE-02`'s 100, forcing immediate failover instead of a black hole |
| Virtual MAC | `0000.0c07.ac01` group 1, `.ac02` group 2, `.ac03` group 3, `.ac04` group 4 (**[VERIFIED]** — Rev 1.1 ruling C-14) | HSRPv1 formula `0000.0c07.acXX` with XX the group in hex. HSRPv2 (`0000.0c9f.fXXX`) is not used, keeping HSRPv1 semantics the simulator reproduces faithfully |

**The failover sequence.** When `VP-HQ-CORE-01` fails or loses its uplinks: (1) `CORE-02` stops receiving hellos for the affected groups, which with `timers 1 3` takes up to three seconds; (2) `CORE-02`, already at priority 100 and seeing no higher-priority hello, transitions `Standby` → `Active` and answers ARP for the virtual IP with the virtual MAC; (3) `CORE-02` sends a gratuitous ARP so hosts refresh their caches immediately — hosts that already cached the virtual MAC need not re-ARP, which is the principal advantage of a first-hop redundancy protocol over a routing-only alternative; (4) STP reconverges simultaneously, `CORE-02` becoming root for the HQ VLANs (already `root secondary`, so the election is immediate) and each access switch's alternate uplink becoming its root port; (5) OSPF reconverges on the core links and `CORE-01`'s advertisements are withdrawn, but since both cores advertise the same VLAN subnets, traffic still reaches a core that can route it.

**Convergence-time expectation, stated honestly.** On real equipment the transition would be bounded by the hold timer (three seconds) plus ARP refresh. **In Packet Tracer the measured interval is a simulation artefact.** The report presents the failure test as a *behavioural* result — "the VIP moved, the access switches retained connectivity, `show standby brief` on `CORE-02` shows `Active`" — and states that the elapsed time displayed by the simulator is not a real-world convergence figure.

#### 9.7.3 Verification

```text
VP-HQ-CORE-01# show standby brief
                     P indicates configured to preempt.
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Vl30        1    150 P Active  local           10.10.30.2      10.10.30.254
Vl40        2    150 P Active  local           10.10.40.2      10.10.40.254
Vl70        3    150 P Active  local           10.70.0.2       10.70.0.254
Vl80        4    150 P Active  local           10.10.80.2      10.10.80.254

VP-HQ-CORE-02# show standby brief
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Vl30        1    100 P Standby 10.10.30.1      local           10.10.30.254
Vl40        2    100 P Standby 10.10.40.1      local           10.10.40.254
Vl70        3    100 P Standby 10.70.0.1       local           10.70.0.254
Vl80        4    100 P Standby 10.10.80.1      local           10.10.80.254

VP-HQ-CORE-01# show standby vlan 40
Vlan40 - Group 2
  State is Active
    8 state changes, last state change 00:42:17
  Virtual IP address is 10.10.40.254
  Active virtual MAC address is 0000.0c07.ac02
    Local virtual MAC address is 0000.0c07.ac02 (v1 default)
  Hello time 1 sec, hold time 3 sec
    Next hello sent in 0.416 secs
  Preemption enabled, delay min 30 secs
  Active router is local
  Standby router is 10.10.40.2, priority 100 (expires in 2.176 sec)
  Priority 150 (configured 150)
    Track interface GigabitEthernet1/0/1 state Up decrement 30
    Track interface GigabitEthernet1/0/3 state Up decrement 20
    Track interface GigabitEthernet1/0/4 state Up decrement 20
  Group name is "HSRP-USERHQ" (default)
  Authentication MD5, key-string

! --- Failover demonstration, in five steps ---------------------------
! Step 1 — baseline: ping 10.10.40.254 replies from a VLAN 40 workstation
!          and the ARP entry shows 0000.0c07.ac02.
! Step 2 — inject the failure:
VP-HQ-CORE-01(config)# interface range vlan 30-40, vlan 70-80
VP-HQ-CORE-01(config-if-range)# shutdown
! Step 3 — observe on the standby:
VP-HQ-CORE-02# show standby brief
!   -> Vl30 Grp 1 Pri 100 P Active 10.10.30.1 local 10.10.30.254
!   -> Vl40 Grp 2 Pri 100 P Active 10.10.40.1 local 10.10.40.254
!   -> Vl70 Grp 3 Pri 100 P Active 10.70.0.1  local 10.70.0.254
!   -> Vl80 Grp 4 Pri 100 P Active 10.10.80.1 local 10.10.80.254
VP-HQ-CORE-02# show standby vlan 40
!   -> State is Active; Active virtual MAC address is 0000.0c07.ac02
!   -> Active router is local; Standby router is unknown
! Step 4 — prove the user never had to change anything: on the workstation,
!          `ipconfig` still shows Default Gateway 10.10.40.254 and
!          `ping 10.10.40.254` replies, now served by VP-HQ-CORE-02.
! Step 5 — restore and prove PREEMPTION:
VP-HQ-CORE-01(config)# interface range vlan 30-40, vlan 70-80
VP-HQ-CORE-01(config-if-range)# no shutdown
!   After the 30-second preempt delay, show standby brief shows
!   Vl40 Grp 2 Pri 150 P Active local -- the VIP returned to the
!   higher-priority router because `preempt` requires it, NOT because the
!   standby gave it up.
```

| Failure injected | Expected result | Evidence |
|---|---|---|
| `CORE-01` SVIs shut down | All four groups become `Active` on `CORE-02` within the hold-timer window; user default gateway unchanged; ping continues | `show standby brief` on both switches before and after; workstation `ipconfig` and ping |
| `CORE-01` access uplink `gi1/0/3` down (tracked, decrement 20) | Priority drops to 130 — still above 100, so **no failover on a single uplink loss**, which is intended: losing one of two uplinks must not move the gateway | `show standby vlan 40` showing the decremented priority and the tracked interface `Down` |
| Core trunk `gi1/0/1` down (tracked, decrement 30) | Priority drops to 120; still active. With **both** trunk and an uplink down the priority falls below 100 and failover occurs — the designed threshold | `show standby` showing both tracked interfaces and the resulting priority |
| `CORE-01` powered off entirely | Immediate failover; `CORE-02` takes all groups; on power-up `CORE-01` preempts back after 30 s | `show standby brief` at three points in time |

The last row distinguishes two failure classes and is the core of the design argument: losing one of two uplinks must **not** move the gateway (it would add an unnecessary failover event), whereas losing the core trunk must. Tracking with different decrements expresses that distinction in configuration rather than prose.

---

### 9.8 OSPF — the HQ-to-Branch Interior Routing Domain

#### 9.8.1 Design

The interior routing protocol for HQ and Kwun Tong is **OSPFv2, single area 0** — the design's primary IGP, directly citable to `Provide enterprise-wide connectivity using internal and external gateway routing protocols such as OSPF, BGP and EIGRP`.

**Area design.** One area (area 0). `VP-HQ-EDGE-01`, `VP-HQ-CORE-01` and `VP-HQ-CORE-02` sit in area 0; the Kwun Tong WAN1 link (10.10.100.32/30) is in area 0, making `VP-BR-EDGE-01` a backbone router rather than an area border router. **No router in this design is an ABR, `area range` appears in no configuration, and the baseline's OSPF area 0 area-range annotation is struck by Rev 1.1 ruling C-13.** The trade-off is stated: a single area means no inter-area summarisation and no topology hiding, but it limits the failure domains to LSA types 1 and 2 plus externals — precisely what a 12-week project can build, break and document with confidence. Advanced OSPF (multi-area beyond one ABR, NSSA/stub tuning, OSPFv3, MPLS) is **NOT COVERED**.

> **Note on the baseline's wording.** §3.4 describes the Kwun Tong leg as `OSPF area 0 area-range`, while §11.3 describes the design as `Single area 0 at HQ + Kwun Tong`. `area range` is an ABR command and is inert on a router whose interfaces are all in one area. This chapter implements the single-area design and records the wording difference as a documentation correction for the revision log rather than inventing a second area to make the command meaningful.

**Router IDs** come from the loopbacks already allocated in the baseline's `10.255.0.0/24` block, so the identifier is stable across interface flaps and matches the loopback OSPF also advertises: `VP-HQ-CORE-01` 10.255.0.11, `VP-HQ-CORE-02` 10.255.0.12, `VP-HQ-EDGE-01` 10.255.0.21 (ASBR, `default-information originate`, **the single redistribution point**), `VP-BR-EDGE-01` 10.255.0.31. `VP-MO-EDGE-01` (10.255.0.41) runs EIGRP instead; `VP-WC-EDGE-01` (10.255.0.51) uses a static default over IPsec; `VP-ISP-EDGE-01` (10.255.0.61) is eBGP only.

**Networks in area 0:** the four loopbacks; `10.10.10.0/24`, `10.20.20.0/24`, `10.10.30.0/24`, `10.10.40.0/23`, `10.10.45.0/24`, `10.10.50.0/28`, `10.10.60.0/24`, `10.10.80.0/24`; `10.10.100.32/30` (WAN1); and `10.10.110.0/24`–`10.10.113.0/24`. **`10.10.90.0/24` is deliberately not advertised by the cores** — the ASA owns VLAN 90.

**Deliberate choice: interface-level configuration, not `network` statements.** This design configures OSPF on the interface with `ip ospf 1 area 0` for three reasons. (1) A `network` statement is a wildcard match, and a mistyped wildcard silently enables OSPF on an interface nobody intended; interface-level configuration is explicit, so `show ip ospf interface brief` is a complete audit. This matters most on `VP-HQ-CORE-01`, where an over-broad `network 10.10.0.0 0.0.255.255 area 0` would quietly advertise the management and student VLANs into the routing domain — a security defect rather than a typo. (2) It is idempotent and re-appliable, which matters because the automation line holds device configuration as files in Git; inserting a `network` statement requires removing a previous one first, and diffs of differing length are harder to review. (3) It keeps protocol state beside the interface's other properties, so an engineer reading `interface Vlan40` sees address, description, HSRP and routing protocol in one place. Passive interfaces are configured for every interface that must be advertised but must never form an adjacency — the host-facing SVIs and the loopback — which is both a control-plane security measure and a scalability measure.

#### 9.8.2 Configuration

```cisco
! ===== VP-HQ-CORE-01 — OSPF area 0, interface-level configuration =====
router ospf 1
 router-id 10.255.0.11
 log-adjacency-changes detail
 passive-interface default
 no passive-interface Vlan10
 no passive-interface Loopback0
 auto-cost reference-bandwidth 10000
interface Loopback0
 description [LOOPBACK - OSPF ROUTER-ID Z-CORE]
 ip address 10.255.0.11 255.255.255.255
 ip ospf 1 area 0
 ip ospf network point-to-point
interface Vlan10
 description [LAN-HQ-CORE - OSPF AREA 0 TRANSIT Z-CORE]
 ip address 10.10.10.2 255.255.255.0
 ip ospf 1 area 0
 ip ospf priority 200
 ip ospf cost 10
 ip ospf hello-interval 10
 ip ospf dead-interval 40
 ip ospf network broadcast
 ip ospf authentication message-digest
 ip ospf message-digest-key 10 md5 <REDACTED-OSPF-KEY-10>
! Derived SVIs -- advertised but passive: no adjacencies on host VLANs.
! Vlan20 10.20.20.11/24, Vlan30 10.10.30.1/24, Vlan40 10.10.40.1/23,
! Vlan45 10.10.45.1/24, Vlan50 10.10.50.1/28, Vlan60 10.10.60.1/24,
! Vlan70 10.70.0.1/24, Vlan80 10.10.80.1/24: identical pattern -- address plus
! `ip ospf 1 area 0`, no other OSPF interface command (passive by default).

! ===== VP-HQ-CORE-02 — mirror of CORE-01, lower priority =====
router ospf 1
 router-id 10.255.0.12
 passive-interface default
 no passive-interface Vlan10
 no passive-interface Loopback0
 auto-cost reference-bandwidth 10000
interface Loopback0
 ip address 10.255.0.12 255.255.255.255
 ip ospf 1 area 0
 ip ospf network point-to-point
interface Vlan10
 ip address 10.10.10.3 255.255.255.0
 ip ospf 1 area 0
 ip ospf priority 100
 ip ospf cost 10
 ip ospf hello-interval 10
 ip ospf dead-interval 40
 ip ospf authentication message-digest
 ip ospf message-digest-key 10 md5 <REDACTED-OSPF-KEY-10>
! VLANs 20, 30, 40, 70, 80: ip ospf 1 area 0 declared and left passive.

! ===== VP-HQ-EDGE-01 — OSPF ASBR: HQ LANs plus default origination =====
router ospf 1
 router-id 10.255.0.21
 passive-interface default
 no passive-interface gi0/2
 no passive-interface gi1/0
 no passive-interface Loopback0
 auto-cost reference-bandwidth 10000
 default-information originate always metric 10 metric-type 2
 distance 110
interface gi0/2
 description [to VP-BR-EDGE-01 Gi0/1 WAN1 OSPF AREA 0 Z-WAN]
 ip address 10.10.100.33 255.255.255.252
 ip ospf 1 area 0
 ip ospf network point-to-point
 ip ospf cost 100
 ip ospf hello-interval 10
 ip ospf dead-interval 40
 ip ospf authentication message-digest
 ip ospf message-digest-key 10 md5 <REDACTED-OSPF-KEY-10>
interface Loopback0
 ip address 10.255.0.21 255.255.255.255
 ip ospf 1 area 0
 ip ospf network point-to-point
interface gi1/0
 description [to VP-HQ-CORE-01 TRUNK VLAN10 Z-CORE]
 encapsulation dot1Q 10 native
 ip address 10.10.10.1 255.255.255.0
 ip ospf 1 area 0
 ip ospf priority 50
 ip ospf cost 10
 ip ospf authentication message-digest
 ip ospf message-digest-key 10 md5 <REDACTED-OSPF-KEY-10>
! gi1/1 (VLAN 20, 10.20.20.1/24), gi1/2 (VLAN 30, 10.10.30.253/24) and
! gi1/3 (VLAN 40, 10.10.40.253/23) carry the address plus
! `ip ospf 1 area 0` and are passive.

! ===== VP-BR-EDGE-01 — Kwun Tong branch router, OSPF area 0 spoke =====
router ospf 1
 router-id 10.255.0.31
 passive-interface default
 no passive-interface gi0/1
 no passive-interface Loopback0
 auto-cost reference-bandwidth 10000
interface gi0/1
 description [to VP-HQ-EDGE-01 Gi0/2 WAN1 OSPF AREA 0 Z-WAN]
 ip address 10.10.100.34 255.255.255.252
 ip ospf 1 area 0
 ip ospf network point-to-point
 ip ospf cost 100
 ip ospf hello-interval 10
 ip ospf dead-interval 40
 ip ospf authentication message-digest
 ip ospf message-digest-key 10 md5 <REDACTED-OSPF-KEY-10>
interface Loopback0
 ip address 10.255.0.31 255.255.255.255
 ip ospf 1 area 0
 ip ospf network point-to-point
interface gi0/0.110
 description [BR-SALES Z-USER]
 encapsulation dot1Q 110
 ip address 10.10.110.1 255.255.255.0
 ip ospf 1 area 0
 ip helper-address 10.10.30.11
 ip helper-address 10.10.30.12
interface gi0/0.111
 description [BR-STAFF Z-USER]
 encapsulation dot1Q 111
 ip address 10.10.111.1 255.255.255.0
 ip ospf 1 area 0
 ip helper-address 10.10.30.11
 ip helper-address 10.10.30.12
interface gi0/0.112
 description [BR-VOICE Z-USER]
 encapsulation dot1Q 112
 ip address 10.10.112.1 255.255.255.0
 ip ospf 1 area 0
 ip helper-address 10.10.30.11
interface gi0/0.113
 description [BR-MGMT Z-MGMT]
 encapsulation dot1Q 113
 ip address 10.10.113.1 255.255.255.0
 ip ospf 1 area 0
```

The branch has no local DHCP authority: `vpnz-dc01` and `vpnz-dc02` serve the branch scopes over the WAN with the relay on the branch subinterfaces. That is a deliberate choice inherited from the Microsoft line, and its consequence — the branch loses DHCP if both HQ DCs and the WAN are down at once — is recorded in §9.14.

#### 9.8.3 Convergence and tuning

| Knob | Value | Why | If wrong |
|---|---|---|---|
| `hello-interval` | 10 s on broadcast segments and on the point-to-point WAN link | Keeping the WAN at 10/40 rather than a slower 30/120 means a WAN failure is detected in the same time as a LAN failure, simplifying the test plan and the failure narrative; the cost is slightly more hello traffic on a `/30` carrying nothing else | Mismatched hello intervals prevent adjacency formation entirely — `show ip ospf neighbor` shows nothing and `debug ip ospf hello` reports the mismatch (§9.16) |
| `dead-interval` | 40 s (4 × hello) | The protocol's own recommended ratio. Setting it equal to the hello interval — a common fast-convergence trick — is deliberately **not** used, because the design prefers default-adjacent behaviour a reader can reason about | A dead interval shorter than the hello interval guarantees flapping adjacencies |
| `ip ospf priority` | 200 on `CORE-01 Vlan10`; 100 on `CORE-02 Vlan10`; 50 on `VP-HQ-EDGE-01 gi1/0` | The DR/BDR election on the VLAN 10 broadcast segment must be predictable: `CORE-01` DR, `CORE-02` BDR, the edge router DROther (correct, since it is a leaf there and need not originate the network LSA) | Priority 0 makes a router ineligible to be DR — useful deliberately, dangerous accidentally |
| DR/BDR after change | `clear ip ospf process` not run casually | OSPF elections are non-preemptive, so changing priorities does not move the DR until the adjacency resets. Priorities are therefore configured **before** the first adjacency forms; later changes are applied with a documented `clear ip ospf process` and a captured before/after | A design that changes priority and assumes the DR moved will silently have the wrong topology |
| `auto-cost reference-bandwidth 10000` | 10 Gbps on every OSPF router | The IOS default of 100 Mbps makes every link of 100 Mbps or faster cost 1 and therefore indistinguishable. At 10 Gbps, Gigabit Ethernet costs 10, Fast Ethernet 100, and the WAN legs (explicitly cost 100) relate sensibly to the LAN. **The value must be identical on every router** | Inconsistent reference bandwidth is a classic cause of an OSPF routing loop, because two routers can each believe the other path is cheaper |
| `ip ospf cost` | 10 on VLAN 10 SVIs; 100 on WAN legs | Makes HQ core transit cheap and the WAN leg expensive, so HQ-to-HQ traffic never traverses the WAN | Leaving the WAN leg cheap can make OSPF prefer a path through the branch — suboptimal and hard to spot |
| Loopback router ID, advertised | `ip ospf 1 area 0` plus `ip ospf network point-to-point` on `Loopback0` | A stable router ID that does not change when an interface flaps, plus a reachable `/32`; the explicit network type stops OSPF advertising the loopback as a stub network | A router ID that changes mid-test invalidates every neighbour listing in the evidence |
| Authentication | `ip ospf authentication message-digest` plus `ip ospf message-digest-key 10 md5` on every OSPF interface that forms an adjacency | Without authentication any device reaching the segment can form an adjacency and inject LSAs, taking control of the routing domain. MD5 key chains are what the simulator supports reliably; **SHA-256 is the design preference, attempted and marked `[ASSUMPTION]`** | A key-ID or key-string mismatch leaves the adjacency in `EXSTART`/`DOWN` (§9.16) |
| `passive-interface default` with explicit `no passive-interface` | Every OSPF router | Inverting the default is the most reliable way to ensure no new interface accidentally sends hellos; it is citable to `Apply basic security configuration for control and data plane` | Marking interfaces passive one by one fails open: a forgotten interface participates |
| `default-information originate always` | Only on `VP-HQ-EDGE-01`, metric 10, metric-type 2 | The HQ Internet path is expressed as a default originated by exactly one router. `always` is used because the edge's own default comes from eBGP and the group wants it advertised even if one BGP session is down (the second still exists). Metric type 2 keeps the external cost out of the internal cost, so the default's metric is constant across the estate | Omitting it leaves every OSPF router without a default; generating it on two routers makes the path non-deterministic |

**LSAs relevant to this design.** Because the design is single-area, the LSA types that appear can be enumerated exhaustively — a genuine advantage for a project that must document what it sees.

| LSA | Name | Originated by | Carries here |
|---|---|---|---|
| 1 | Router LSA | Every OSPF router | The router's own links and costs (`show ip ospf database router`) |
| 2 | Network LSA | The DR on the VLAN 10 broadcast segment — `VP-HQ-CORE-01` at priority 200 | The set of routers attached to the segment (`show ip ospf database network`) |
| 3 | Summary LSA | **Not originated** — no ABR exists in a single-area design | Absent; its absence confirms the area design |
| 4 | ASBR summary LSA | **Not originated** (no ABR) | Absent |
| 5 | AS external LSA | `VP-HQ-EDGE-01` as ASBR: the default route and the redistributed EIGRP prefixes | The Macau `/24`s tagged `200`, plus the default |
| 7 | NSSA external LSA | **Not originated** — no NSSA exists | Absent by design |

#### 9.8.4 Verification

```text
VP-HQ-CORE-01# show ip ospf neighbor
Neighbor ID     Pri   State           Dead Time   Address         Interface
10.255.0.12     100   FULL/BDR        00:00:36    10.10.10.3      Vlan10
10.255.0.21      50   FULL/DROTHER    00:00:33    10.10.10.1      Vlan10
10.255.0.31       1   FULL/DR         00:00:38    10.10.100.34    Vlan10

VP-HQ-EDGE-01# show ip ospf neighbor detail
 Neighbor 10.255.0.31, interface address 10.10.100.34
    In the area 0 via interface GigabitEthernet0/2
    Neighbor priority is 1, State is FULL, 6 state changes
    DR is 10.10.100.34  BDR is 10.10.100.33
    Neighbor is up for 00:18:42
    Authentication Sequence: [ 0 ]
 Neighbor 10.255.0.11, interface address 10.10.10.2
    In the area 0 via interface GigabitEthernet1/0
    Neighbor priority is 200, State is FULL, 4 state changes
    DR is 10.10.10.2  BDR is 10.10.10.3

VP-HQ-EDGE-01# show ip ospf database
                Router Link States (Area 0)
Link ID         ADV Router      Age    Seq#       Checksum Link count
10.255.0.11     10.255.0.11     412    0x80000007 0x00A1B2 6
10.255.0.12     10.255.0.12     398    0x80000005 0x00C3D4 5
10.255.0.21     10.255.0.21     421    0x80000008 0x00E5F6 6
10.255.0.31     10.255.0.31     405    0x80000006 0x00A7B8 5
                Net Link States (Area 0)
Link ID         ADV Router      Age    Seq#       Checksum
10.10.10.2      10.255.0.11     412    0x80000003 0x00F1A2
                Type-5 AS External Link States
Link ID         ADV Router      Age    Seq#       Checksum Tag
0.0.0.0         10.255.0.21     421    0x80000002 0x0011AA 0
10.10.120.0     10.255.0.21     419    0x80000002 0x0022BB 200
10.10.121.0     10.255.0.21     417    0x80000002 0x0033CC 200

VP-HQ-EDGE-01# show ip route ospf
Gateway of last resort is 10.10.100.2 to network 0.0.0.0
O     10.10.110.0/24 [110/101] via 10.10.100.34, 00:18:42, GigabitEthernet0/2
O     10.10.111.0/24 [110/101] via 10.10.100.34, 00:18:42, GigabitEthernet0/2
O     10.10.112.0/24 [110/101] via 10.10.100.34, 00:18:42, GigabitEthernet0/2
O     10.10.113.0/24 [110/101] via 10.10.100.34, 00:18:42, GigabitEthernet0/2
O     10.255.0.11/32 [110/11] via 10.10.10.2, 00:18:39, GigabitEthernet1/0
O     10.255.0.12/32 [110/11] via 10.10.10.2, 00:18:39, GigabitEthernet1/0
O     10.255.0.31/32 [110/101] via 10.10.100.34, 00:18:42, GigabitEthernet0/2
```

**What to look for.** Every neighbour must be `FULL`; anything stuck at `INIT`, `2WAY`, `EXSTART` or `EXCHANGE` is a fault (§9.16). **`2WAY` is normal between two DROther routers on a broadcast segment and is NOT a fault** — the report must distinguish these cases, because conflating them is the most common OSPF diagnostic error. The neighbour ID is the remote loopback, which is why the loopback-as-router-ID convention pays for itself. In the database, four Router LSAs and **exactly one** Network LSA are positive evidence the DR election behaved as configured; **no Type-3 or Type-4 LSAs exist**, which proves the single-area design — a Type-3 appearing means an unplanned ABR exists and the documentation is wrong; the two Macau prefixes appear as Type-5 externals with **Tag 200**, the anti-loop mechanism of §9.11, so their presence is the evidence that redistribution works as designed. The branch `/24`s carry metric 101 (WAN cost 100 plus 1 for the branch subinterface), matching the deliberate cost tuning — a metric of 1 would mean the WAN cost tuning did not apply. The Macau prefixes do **not** appear as `O` routes here; they are EIGRP routes, which is exactly the design.

---

### 9.9 EIGRP — the Macau / Legacy Domain

#### 9.9.1 Design and the honest justification

Macau and one "legacy acquisition" transit segment run **EIGRP in classic mode, autonomous system 100**. EIGRP is directly citable to the standard, so the project is not defending it against the WSOS; it is defending it against good engineering practice, and must do so honestly.

**The honest justification.** Running two interior gateway protocols in one enterprise is, in a green-field design, a defect: it doubles the operational knowledge required, doubles the failure modes, creates a redistribution boundary that can black-hole or loop traffic, and offers no capability a single IGP lacks. No competent designer would introduce it deliberately, and this design does not claim otherwise. It reproduces a **real and common situation**: an organisation that has acquired a smaller company whose network already runs EIGRP, where the cost and risk of migrating at the moment of acquisition exceeds the cost of bounded coexistence. The baseline frames it exactly this way — as a *legacy coexistence requirement*. Three consequences follow and all three are stated.

1. **The second protocol is contained, not extended.** EIGRP exists on exactly two devices — `VP-MO-EDGE-01` and, for the single redistribution point, `VP-HQ-EDGE-01`. It appears on no HQ core switch, no access switch and not on the Kwun Tong router. If it appeared anywhere else the containment claim would be false.
2. **The coexistence has a documented exit.** The correct end state is to migrate the Macau segment to OSPF area 0 and remove the EIGRP process; that is recorded as future work. Presenting permanent dual-IGP as an achievement would be presenting a liability as a feature.
3. **Redistribution is one-way and tagged** (§9.11), the only mechanism that makes coexistence safe without extensive testing.

**AS number and mode.** The AS is **100**, fixed by the baseline. Classic mode (`router eigrp 100`) is used rather than named mode because the baseline records named mode as **[UNCERTAIN]** in the simulator (its advanced details are limited) and because classic mode is what the WSOS-level Cisco curriculum teaches first, so a reader can follow the configuration without a separate explanation of `address-family` syntax. The trade-off is stated: named mode is the more modern, more capable form and a real deployment would prefer it. **Containment mechanism:** the process exists only on the two named devices; within those devices `passive-interface default` plus explicit `no passive-interface` means hellos are sent only on the Macau-facing link; and that link is a `/30` point-to-point segment with no other device on it.

#### 9.9.2 Configuration

```cisco
! ===== VP-MO-EDGE-01 — Macau representative office, EIGRP AS 100 =====
router eigrp 100
 eigrp router-id 10.255.0.41
 network 10.255.0.41 0.0.0.0
 passive-interface default
 no passive-interface gi0/1
 no passive-interface Loopback0
 metric weights 0 1 0 1 0 0
 log-neighbor-changes
! Classic mode takes its network list from `network` statements, so the two
! Macau subnets are declared explicitly and narrowly. There is deliberately NO
! blanket `network 10.0.0.0` -- that would advertise the WAN link and make
! containment harder to prove.
 network 10.10.120.0 0.0.0.255
 network 10.10.121.0 0.0.0.255
 network 10.10.100.36 0.0.0.3
interface gi0/1
 description [to VP-HQ-EDGE-01 Gi0/3 WAN EIGRP AS100 Z-WAN]
 ip address 10.10.100.38 255.255.255.252
 bandwidth 2048
 delay 2000
! bandwidth in kbps; delay in tens of microseconds, so `delay 2000` is 20 ms
! one-way. These values are the design's declared representation of the Macau
! WAN link and MUST match on both ends, because EIGRP takes the MINIMUM of the
! two neighbours' bandwidth values when computing the metric.
 ip authentication mode eigrp 100 md5
 ip authentication key-chain eigrp 100 KC-EIGRP-WAN
 no shutdown
interface Loopback0
 description [LOOPBACK - EIGRP ROUTER-ID Z-CORE]
 ip address 10.255.0.41 255.255.255.255
interface gi0/0.120
 description [MO-LAN Z-USER]
 encapsulation dot1Q 120
 ip address 10.10.120.1 255.255.255.0
 ip helper-address 10.10.30.11
interface gi0/0.121
 description [MO-VOICE Z-USER]
 encapsulation dot1Q 121
 ip address 10.10.121.1 255.255.255.0
 ip helper-address 10.10.30.11

! ===== VP-HQ-EDGE-01 — the EIGRP side of the single redistribution point =====
router eigrp 100
 eigrp router-id 10.255.0.21
 passive-interface default
 no passive-interface gi0/3
 metric weights 0 1 0 1 0 0
! The HQ prefixes are advertised into EIGRP so Macau can reach HQ, declared
! explicitly one line per subnet. A wildcard summary is deliberately NOT used:
! a summarised advertisement would also carry the management (10.20.20.0/24)
! and lab (10.70.0.0/16) ranges into the legacy domain -- a security defect.
 network 10.10.10.0 0.0.0.255
 network 10.10.30.0 0.0.0.255
 network 10.10.40.0 0.0.1.255
 network 10.10.45.0 0.0.0.255
 network 10.10.50.0 0.0.0.15
 network 10.10.60.0 0.0.0.255
 network 10.10.80.0 0.0.0.255
 network 10.10.110.0 0.0.0.255
 network 10.10.111.0 0.0.0.255
 network 10.10.112.0 0.0.0.255
 network 10.10.113.0 0.0.0.255
interface gi0/3
 description [to VP-MO-EDGE-01 Gi0/1 WAN EIGRP AS100 Z-WAN - AUTH MD5]
 ip address 10.10.100.37 255.255.255.252
 bandwidth 2048
 delay 2000
 ip authentication mode eigrp 100 md5
 ip authentication key-chain eigrp 100 KC-EIGRP-WAN
 no shutdown
! --- EIGRP MD5 authentication, applied on BOTH ends of the WAN link ---
key chain KC-EIGRP-WAN
 key 1
  key-string <REDACTED-EIGRP-KEY>
  accept-lifetime 00:00:00 Jan 1 2026 infinite
  send-lifetime 00:00:00 Jan 1 2026 infinite
```

Unauthenticated EIGRP is a genuine vulnerability: any device that can reach the segment can form an adjacency and inject routes, and unlike OSPF — where a rogue LSA is at least visible in the link-state database — an injected EIGRP route can silently override a legitimate one. **Hello and hold timers are left at their defaults** (5 s hello, 15 s hold on the point-to-point WAN segment), and the reason is stated: Macau is a four-person site, and adding a non-default timer to a protocol already run only for coexistence would add a failure mode with no corresponding benefit.

#### 9.9.3 Metrics and tuning

EIGRP's composite metric derives from bandwidth, delay, load, reliability and MTU, with K-values weighting the five. The defaults are K1 = 1, K2 = 0, K3 = 1, K4 = 0, K5 = 0, so **only bandwidth and delay affect the metric**; load and reliability are carried in the topology table but do not influence path selection, and MTU is not used. **This project leaves `metric weights 0 1 0 1 0 0` at the default and does not manipulate K-values**, for three stated reasons: (1) non-default K-values break interoperability between routers that disagree, and every EIGRP speaker in the AS must use identical values or adjacencies do not form correctly — survivable here because two devices are administered by one team, but a trap for whoever inherits the network; (2) using load and reliability makes the metric change with instantaneous conditions, which makes path selection non-deterministic and the topology table impossible to reason about after the fact, and for a project whose evidence is `show` outputs captured at different times, determinism is worth more than optimisation; (3) both the WSOS and the Cisco curriculum treat K-value manipulation as an advanced diagnostic technique rather than a design tool.

| Parameter | Value | Why | If wrong |
|---|---|---|---|
| K-values | Default `0 1 0 1 0 0` | Determinism and interoperability, per the three reasons above | Non-matching K-values between neighbours prevent correct metric computation |
| `bandwidth` | 2048 kbps on both ends | The declared link capacity. EIGRP uses the **lower** of the two ends, so matching values make the metric symmetric and predictable | A higher value on one end than the other produces a metric neither device's configuration explains |
| `delay` | 2000 (tens of µs) on both ends | Declared one-way latency. Delay dominates the metric when bandwidth is large, which is the case for 2 Mbps against a 10 Gbps reference | An incorrect delay makes a backup path appear preferable |
| `variance` | **Not configured** (default 1) | Unequal-cost load balancing needs a genuinely parallel path. There is exactly one WAN link to Macau, so `variance` would do nothing and configuring it would be cargo-cult | Setting `variance` with no second path changes nothing, so the risk is a misleading report rather than a broken network |
| `maximum-paths` | Default (4) | There is only one path | None |
| `passive-interface default` | Both EIGRP routers | No hellos on any interface except the WAN leg — the containment mechanism | Without it, EIGRP would form adjacencies on the Macau LAN segments and the HQ subinterfaces that do not exist in the design |
| `eigrp router-id` | `10.255.0.41` / `10.255.0.21` | Taken from the loopbacks, as with OSPF, so the identifier is stable and self-documenting | A router ID change resets adjacencies and invalidates captured evidence |

#### 9.9.4 Verification

```text
VP-MO-EDGE-01# show ip eigrp neighbors
EIGRP-IPv4 Neighbors for AS(100)
H   Address                 Interface              Hold Uptime   SRTT   RTO  Q  Seq
                                                   (sec)         (ms)       Cnt Num
0   10.10.100.37            Gi0/1                    12 00:21:35   24   200  0  14

VP-MO-EDGE-01# show ip eigrp topology
EIGRP-IPv4 Topology Table for AS(100)/ID(10.255.0.41)
Codes: P - Passive, A - Active, U - Update, Q - Query, R - Reply
P 10.10.120.0/24, 1 successors, FD is 28160
        via Connected, GigabitEthernet0/0.120
P 10.10.121.0/24, 1 successors, FD is 28160
        via Connected, GigabitEthernet0/0.121
P 10.10.100.36/30, 1 successors, FD is 2169856
        via Connected, GigabitEthernet0/1
P 10.10.10.0/24, 1 successors, FD is 2297856
        via 10.10.100.37 (2297856/28160), GigabitEthernet0/1
P 10.10.30.0/24, 1 successors, FD is 2297856
        via 10.10.100.37 (2297856/28160), GigabitEthernet0/1
P 10.10.40.0/23, 1 successors, FD is 2297856
        via 10.10.100.37 (2297856/28160), GigabitEthernet0/1
P 10.10.50.0/28, 1 successors, FD is 2297856
        via 10.10.100.37 (2297856/28160), GigabitEthernet0/1
P 10.10.80.0/24, 1 successors, FD is 2297856
        via 10.10.100.37 (2297856/28160), GigabitEthernet0/1
P 10.10.110.0/24, 1 successors, FD is 2297856
        via 10.10.100.37 (2297856/28160), GigabitEthernet0/1
P 10.10.111.0/24, 1 successors, FD is 2297856
        via 10.10.100.37 (2297856/28160), GigabitEthernet0/1
P 10.10.112.0/24, 1 successors, FD is 2297856
        via 10.10.100.37 (2297856/28160), GigabitEthernet0/1
P 10.10.113.0/24, 1 successors, FD is 2297856
        via 10.10.100.37 (2297856/28160), GigabitEthernet0/1

VP-MO-EDGE-01# show ip route eigrp
Gateway of last resort is 10.10.100.37 to network 0.0.0.0
D     10.10.10.0/24 [90/2297856] via 10.10.100.37, 00:21:35, GigabitEthernet0/1
D     10.10.30.0/24 [90/2297856] via 10.10.100.37, 00:21:35, GigabitEthernet0/1
D     10.10.40.0/23 [90/2297856] via 10.10.100.37, 00:21:35, GigabitEthernet0/1
D     10.10.50.0/28 [90/2297856] via 10.10.100.37, 00:21:35, GigabitEthernet0/1
D     10.10.80.0/24 [90/2297856] via 10.10.100.37, 00:21:35, GigabitEthernet0/1
D     10.10.110.0/24 [90/2297856] via 10.10.100.37, 00:21:35, GigabitEthernet0/1
D     10.10.111.0/24 [90/2297856] via 10.10.100.37, 00:21:35, GigabitEthernet0/1
D     10.10.112.0/24 [90/2297856] via 10.10.100.37, 00:21:35, GigabitEthernet0/1
D     10.10.113.0/24 [90/2297856] via 10.10.100.37, 00:21:35, GigabitEthernet0/1
```

**What to look for.** **Exactly one** EIGRP neighbour: two would mean the containment design failed and the report's single-boundary claim would be false. `Q Cnt` must be 0; a non-zero queue means packets are queued faster than sent, which here would indicate a flapping link or a duplex mismatch rather than load. The Hold value must be counting down from the configured hold time between 1 and 15. Every topology entry must be marked `P` (Passive); an `A` (Active) entry means the router lost its successor and is querying neighbours — EIGRP's signature failure (§9.16). The `(FD/AD)` pair must satisfy AD < FD for the route to be feasible; here 28160 < 2297856. Note which prefixes are **absent**: `10.20.20.0/24` (management) and `10.70.0.0/16` (isolated lab) do not appear, and their absence is the evidence that the explicit narrow `network` statements worked. Administrative distance **90** for internal EIGRP matters enormously at the redistribution point, because 90 is lower than OSPF's 110 — which is exactly why §9.11's tag strategy exists. All routes share one metric because they all arrive over one WAN link with no K-value or delay differentiation, a direct consequence of the deliberate decision not to manipulate metrics.

---

### 9.10 eBGP — the External Peering

#### 9.10.1 Design

| Role | AS | Device | Addresses |
|---|---|---|---|
| Vertex Peak (the enterprise) | **AS 65001** | `VP-HQ-EDGE-01` | `gi0/0` 10.10.100.1/30; `gi0/1` 192.0.2.2/30 |
| Primary transit provider | **AS 65000** | `VP-ISP-EDGE-01` | `gi0/0` 10.10.100.2/30; `gi0/2` 10.10.100.42/30 |
| Alternate provider | **AS 65002** | `VP-ISP-EDGE-01` (second session) | 10.10.100.42/30 per the baseline's alternate-provider link |
| Wan Chai delivery office | **AS 65021** | `VP-WC-EDGE-01` | outside 203.0.113.5/29 |

**Single- or multi-homed?** The design is **multi-homed to two eBGP peers**: the baseline's addressing plan allocates the alternate-provider subnet (`10.10.100.40/30`, "HQ edge ↔ ISP alternate peer (second BGP session)"). It is **not** two physical providers, because both sessions terminate on the same simulated device — and the report must say so. The value of two sessions is that they demonstrate the two mechanisms that matter on a multi-homed edge: deterministic **outbound** path selection using `local-preference`, so all Vertex Peak traffic leaves through the primary provider while that session is up regardless of how the provider advertises its prefixes; and deterministic **inbound** path selection using AS-path prepending on the secondary session, so the simulated provider prefers the primary path back into the Vertex Peak address space.

**The business reason for eBGP here.** (1) **Address-space ownership and portability** — with a static default route to one provider the enterprise's public prefixes would be provider-owned and would need renumbering on any provider change; with an eBGP session Vertex Peak announces its own prefixes (`198.51.100.0/24` and `203.0.113.0/29`, both RFC 5737 documentation ranges in this lab) and can move them. (2) **Influence over the return path** — the brokers' due-diligence questionnaire requires an auditable and predictable publication path, and BGP attributes rather than hope decide which link inbound traffic uses. (3) **Resilience during a provider outage** — two sessions with attribute-based preferences mean a single session failure moves traffic rather than black-holing it, demonstrated by shutting the primary session and capturing `show ip bgp` before and after.

#### 9.10.2 Configuration

```cisco
! ===== VP-ISP-EDGE-01 — simulated transit provider, AS 65000 =====
router bgp 65000
 bgp router-id 10.255.0.61
 bgp log-neighbor-changes
 bgp deterministic-med
 no bgp default ipv4-unicast
 address-family ipv4 unicast
  ! A real transit provider would carry a full table; a bounded prefix set is
  ! used because Packet Tracer's BGP cannot model scale, and the report says so.
  redistribute static route-map RM-PROVIDER-ORIGINATE
  neighbor 10.10.100.1 remote-as 65001
  neighbor 10.10.100.1 description [to VP-HQ-EDGE-01 gi0/0 - CUSTOMER AS65001]
  neighbor 10.10.100.1 password <REDACTED-BGP-MD5>
  neighbor 10.10.100.1 send-community both
  neighbor 10.10.100.1 maximum-prefix 100 80 restart 15
  neighbor 10.10.100.1 route-map RM-PROV-IN in
  neighbor 10.10.100.1 route-map RM-PROV-OUT-PRIMARY out
  neighbor 10.10.100.1 activate
  neighbor 10.10.100.41 remote-as 65002
  neighbor 10.10.100.41 description [to VP-HQ-EDGE-01 - ALTERNATE AS65002]
  neighbor 10.10.100.41 password <REDACTED-BGP-MD5>
  neighbor 10.10.100.41 send-community both
  neighbor 10.10.100.41 maximum-prefix 100 80 restart 15
  neighbor 10.10.100.41 route-map RM-PROV-IN in
  neighbor 10.10.100.41 route-map RM-PROV-OUT-ALT out
  neighbor 10.10.100.41 activate
 exit-address-family
ip route 192.0.2.0 255.255.255.0 Null0
ip route 203.0.113.0 255.255.255.248 Null0
ip prefix-list PL-PROVIDER-ORIGINATE seq 5 permit 192.0.2.0/24
ip prefix-list PL-PROVIDER-ORIGINATE seq 10 permit 203.0.113.0/29
ip prefix-list PL-PROVIDER-ORIGINATE seq 15 deny 0.0.0.0/0 le 32
route-map RM-PROVIDER-ORIGINATE permit 10
 match ip address prefix-list PL-PROVIDER-ORIGINATE
 set community 65000:100
route-map RM-PROVIDER-ORIGINATE deny 20
! --- inbound: accept ONLY the customer's own aggregate prefixes -------
ip prefix-list PL-CUST-PREFIXES seq 5 permit 198.51.100.0/24
ip prefix-list PL-CUST-PREFIXES seq 10 permit 203.0.113.0/29
ip prefix-list PL-CUST-PREFIXES seq 15 deny 0.0.0.0/0 le 32
route-map RM-PROV-IN permit 10
 match ip address prefix-list PL-CUST-PREFIXES
route-map RM-PROV-IN deny 20
route-map RM-PROV-OUT-PRIMARY permit 10
! --- outbound: AS-path prepend on the alternate so downstream observers
!     prefer the primary path back in ----------------------------------
route-map RM-PROV-OUT-ALT permit 10
 set as-path prepend 65002 65002 65002

! ===== VP-HQ-EDGE-01 — Vertex Peak AS 65001, the enterprise edge =====
router bgp 65001
 bgp router-id 10.255.0.21
 bgp log-neighbor-changes
 bgp deterministic-med
 bgp bestpath as-path multipath-relax
 no bgp default ipv4-unicast
 address-family ipv4 unicast
  ! Only the two documentation-range prefixes are announced. This is the
  ! central design decision: advertise the enterprise's OWN aggregates.
  network 198.51.100.0 mask 255.255.255.0
  network 203.0.113.0 mask 255.255.255.248
  neighbor 10.10.100.2 remote-as 65000
  neighbor 10.10.100.2 description [to VP-ISP-EDGE-01 gi0/0 - PRIMARY AS65000]
  neighbor 10.10.100.2 password <REDACTED-BGP-MD5>
  neighbor 10.10.100.2 timers 10 30
  neighbor 10.10.100.2 send-community both
  neighbor 10.10.100.2 maximum-prefix 200 80 restart 15
  neighbor 10.10.100.2 route-map RM-EDGE-IN-PRIMARY in
  neighbor 10.10.100.2 route-map RM-EDGE-OUT out
  neighbor 10.10.100.2 activate
  neighbor 10.10.100.41 remote-as 65002
  neighbor 10.10.100.41 description [to VP-ISP-EDGE-01 - ALTERNATE AS65002]
  neighbor 10.10.100.41 password <REDACTED-BGP-MD5>
  neighbor 10.10.100.41 timers 10 30
  neighbor 10.10.100.41 send-community both
  neighbor 10.10.100.41 maximum-prefix 200 80 restart 15
  neighbor 10.10.100.41 route-map RM-EDGE-IN-ALT in
  neighbor 10.10.100.41 route-map RM-EDGE-OUT out
  neighbor 10.10.100.41 activate
 exit-address-family
ip route 198.51.100.0 255.255.255.0 Null0
ip route 203.0.113.0 255.255.255.248 Null0
! --- PREFIX POLICY: announce the enterprise's own aggregates and NOTHING else
ip prefix-list PL-EDGE-ANNOUNCE seq 5 permit 198.51.100.0/24
ip prefix-list PL-EDGE-ANNOUNCE seq 10 permit 203.0.113.0/29
! The RFC 1918 ranges are listed here so that their exclusion is explicit and
! auditable. They are NEVER advertised into BGP and never routed internally:
! 10.10.0.0/16 (which subsumes the HQ, branch and small-office space),
! 10.20.0.0/16 and 10.70.0.0/16 are this lab's own ranges, and 172.16.0.0/16
! is reserved head-room in the baseline that must not be allocated or routed.
ip prefix-list PL-EDGE-ANNOUNCE seq 15 deny 10.0.0.0/8 le 32
ip prefix-list PL-EDGE-ANNOUNCE seq 20 deny 172.16.0.0/12 le 32
ip prefix-list PL-EDGE-ANNOUNCE seq 25 deny 192.168.0.0/16 le 32
ip prefix-list PL-EDGE-ANNOUNCE seq 30 deny 0.0.0.0/0 le 32
! Inbound defence in depth: no RFC 1918 space from a provider, no default
! route, and the provider's own documented ranges only.
ip prefix-list PL-EDGE-IN-PRIMARY seq 5 permit 192.0.2.0/24
ip prefix-list PL-EDGE-IN-PRIMARY seq 10 permit 203.0.113.0/29
ip prefix-list PL-EDGE-IN-PRIMARY seq 20 deny 10.0.0.0/8 le 32
ip prefix-list PL-EDGE-IN-PRIMARY seq 25 deny 172.16.0.0/12 le 32
ip prefix-list PL-EDGE-IN-PRIMARY seq 30 deny 192.168.0.0/16 le 32
ip prefix-list PL-EDGE-IN-PRIMARY seq 35 deny 0.0.0.0/0
ip prefix-list PL-EDGE-IN-PRIMARY seq 40 deny 0.0.0.0/0 le 32
ip prefix-list PL-EDGE-IN-ALT seq 5 permit 192.0.2.0/24
ip prefix-list PL-EDGE-IN-ALT seq 10 permit 203.0.113.0/29
ip prefix-list PL-EDGE-IN-ALT seq 40 deny 0.0.0.0/0 le 32
! --- INBOUND ROUTE MAPS: this is where path preference is SET ------------
! The primary provider's routes get a HIGH local preference and every other
! inbound path a deliberately LOWER one. This makes outbound path selection
! independent of AS-path length and of MED, which is the only way to make it
! deterministic when two providers announce the same prefix differently.
route-map RM-EDGE-IN-PRIMARY permit 10
 match ip address prefix-list PL-EDGE-IN-PRIMARY
 set local-preference 200
 set community 65001:100 additive
route-map RM-EDGE-IN-PRIMARY deny 20
route-map RM-EDGE-IN-ALT permit 10
 match ip address prefix-list PL-EDGE-IN-ALT
 set local-preference 100
 set community 65001:200 additive
route-map RM-EDGE-IN-ALT deny 20
! --- OUTBOUND ROUTE MAP: announce only the enterprise aggregates --------
route-map RM-EDGE-OUT permit 10
 match ip address prefix-list PL-EDGE-ANNOUNCE
 set community 65001:1 additive
route-map RM-EDGE-OUT deny 20
```

**Why advertise only specific prefixes rather than everything — the central design decision.** Redistributing a whole routing table into eBGP is the worst mistake available on an enterprise edge, and this design refuses to make it, for four reasons. (1) **Internal prefixes must never be announced.** The estate contains `10.10.0.0/16`, `10.20.0.0/16` (management) and `10.70.0.0/16` (the deliberately isolated lab); announcing them would make management and the lab reachable from the simulated Internet, contradicting TB-06, TB-09 and TB-10 by a routing advertisement no firewall rule could undo, because the advertisement would invite traffic to a path the firewall does not police. A `network` statement for two owned aggregates plus an outbound prefix list ending in `deny 0.0.0.0/0 le 32` makes this impossible by construction rather than by care. (2) **Only the enterprise's own address space may be announced** — announcing someone else's prefix is at minimum a misconfiguration and at worst a route hijack, and the outbound list contains exactly two permits, so even a leak of a provider prefix learned from the other session is denied. (3) **The announcement set should be stable and reviewable** — two prefixes is a policy a reviewer checks by eye; a redistributed table is a policy nobody reviews, which is how accidental leaks happen. (4) **It matches the scenario** — the company owns its public presence (portal, web farm, blog, VPN front door), all inside those two ranges, so nothing else needs to be reachable and nothing else is announced.

**Where `next-hop-self` is and is not used.** All eBGP sessions here are directly connected, so a learned route's next hop is already reachable and `next-hop-self` is not required on the provider neighbours; it is deliberately **not** configured on them, because adding it would change the MED/next-hop comparison logic for no benefit. It **would** be required on any iBGP session inside AS 65001 — but this design has none, since `VP-HQ-EDGE-01` is the only BGP speaker in the enterprise AS and internal reachability is OSPF's and EIGRP's job. The report must state that no iBGP exists, because a reader assuming an iBGP full mesh will misread `show ip bgp summary`.

**On Wan Chai AS 65021.** The baseline assigns `VP-WC-EDGE-01` AS 65021. This section records the configuration *intent* but classifies the session itself as **[ASSUMPTION]** at proposal time: whether the simulated Wan Chai router can carry a third BGP session concurrently with the IPsec tunnel must be established in build week 8 and the outcome recorded. If it cannot, the honest position is that Wan Chai learns a static default route from HQ over the IPsec tunnel — which is exactly what the baseline's §3.4 says it does — and AS 65021 remains a documented design element that is not demonstrated. The report must not list AS 65021 as a working BGP session unless `show ip bgp summary` on `VP-WC-EDGE-01` proves it.

#### 9.10.3 Path selection

BGP's best-path algorithm is a strictly ordered comparison. Only the first steps matter here, but the order is walked so a reader can see why the design produces the outcome it does.

| Order | Attribute | Design position in AS 65001 | Effect here |
|---|---|---|---|
| 1 | Weight | **Not configured.** A local Cisco-proprietary override; with two directly connected peers whose paths differ in local preference it adds nothing | No effect |
| 2 | **Local preference** | **200 on everything from AS 65000, 100 on everything from AS 65002** | **This is what makes outbound path selection deterministic.** Every prefix present in both sessions exits through the primary, and because local preference is compared *before* AS-path length, the outcome cannot be changed by how the providers manipulate their AS paths |
| 3 | Locally originated | The two `network` statements make `198.51.100.0/24` and `203.0.113.0/29` locally originated | Ensures the enterprise's own aggregates are preferred over a learned copy |
| 4 | AS-path length | Not manipulated outbound; the **alternate session prepends `65002 65002 65002`** on what it sends | Inbound determinism for the provider's view, not Vertex Peak's |
| 5 | Origin code | The `network` statements produce origin `i` | No conflict exists, because redistribution into BGP is not used |
| 6 | MED | **Not configured on the enterprise side.** MED from two different providers is not comparable by definition | No effect, stated deliberately so the report does not claim an MED-based preference BGP does not honour |
| 7 | eBGP over iBGP | Both paths are eBGP | No effect |
| 8 | IGP metric to next hop | Both providers are directly connected `/30`s of equal cost | No effect |
| 9 | Multipath / oldest path / lowest router ID | `bgp deterministic-med` enabled so MED comparison across paths from one AS is stable; the oldest-path tie-breaker left at default | Determinism aid, not a preference mechanism |

Three choices make the outcome deterministic, and they are worth stating as a set: **local preference does the work**, not AS-path length, because AS-path length is under the providers' control and local preference is under Vertex Peak's; **`bgp deterministic-med` is enabled** so the arrival order of updates does not change the comparison when two paths share a neighbouring AS — without it, MED comparison is arrival-order dependent and the same configuration can produce two different best paths on two occasions, which would make the evidence irreproducible; and **`maximum-prefix` with a restart timer is configured on every neighbour** so a prefix leak or a session flap cannot consume router memory, the threshold being deliberately low (100/200) because the simulated table is tiny, with the report noting that the real-world value would be table-size dependent.

#### 9.10.4 Verification

```text
VP-HQ-EDGE-01# show ip bgp summary
BGP router identifier 10.255.0.21, local AS number 65001
BGP table version is 12, main routing table version 12
6 network entries using 864 bytes of memory
7 path entries using 588 bytes of memory
Neighbor        V           AS MsgRcvd MsgSent   TblVer  InQ OutQ Up/Down  State/PfxRcd
10.10.100.2     4        65000     142     138       12    0    0 00:21:35        3
10.10.100.41    4        65002      98      95       12    0    0 00:14:02        2

VP-HQ-EDGE-01# show ip bgp
BGP table version is 12, local router ID is 10.255.0.21
Status codes: s suppressed, d damped, h history, * valid, > best, i - internal
Origin codes: i - IGP, e - EGP, ? - incomplete
     Network          Next Hop            Metric LocPrf Weight Path
 *>  192.0.2.0/24     10.10.100.2              0    200      0 65000 i
 *   192.0.2.0/24     10.10.100.41             0    100      0 65002 65002 65002 65002 i
 *>  198.51.100.0/24  0.0.0.0                  0    100  32768 i
 *   203.0.113.0/29   10.10.100.2              0    200      0 65000 i
 *>  203.0.113.0/29   10.10.100.41             0    100      0 65002 65002 65002 65002 i
 *>  203.0.113.0/24   0.0.0.0                  0    100  32768 i

VP-HQ-EDGE-01# show ip bgp neighbors 10.10.100.2 advertised-routes
     Network          Next Hop            Metric LocPrf Weight Path
 *>  198.51.100.0/24  0.0.0.0                  0    100  32768 i
 *>  203.0.113.0/24   0.0.0.0                  0    100  32768 i
Total number of prefixes 2

VP-HQ-EDGE-01# show ip route bgp
Gateway of last resort is 10.10.100.2 to network 0.0.0.0
B     192.0.2.0/24 [20/0] via 10.10.100.2, 00:21:35
B     203.0.113.0/29 [20/0] via 10.10.100.2, 00:21:35

! --- Failover demonstration ------------------------------------------
! Step 1 — baseline: both prefixes via 10.10.100.2 (show ip route bgp).
! Step 2 — kill the primary session:
VP-ISP-EDGE-01(config)# router bgp 65000
VP-ISP-EDGE-01(config-router)# address-family ipv4 unicast
VP-ISP-EDGE-01(config-router-af)# neighbor 10.10.100.1 shutdown
! Step 3 — observe on the enterprise edge:
VP-HQ-EDGE-01# show ip bgp summary
!   -> 10.10.100.2 shown with State/PfxRcd = Idle (or Active)
!   -> 10.10.100.41 still Established with its prefix count
VP-HQ-EDGE-01# show ip bgp
!   -> the `*>` best-path marker has MOVED to the 10.10.100.41 entries.
!      No configuration change was made: the algorithm promoted the next-best
!      path, which is the entire point of the exercise.
VP-HQ-EDGE-01# show ip route bgp
!   -> both prefixes now via 10.10.100.41
! Step 4 — restore:
VP-ISP-EDGE-01(config-router-af)# no neighbor 10.10.100.1 shutdown
VP-HQ-EDGE-01# show ip route bgp
!   -> traffic returns to the primary, again with no configuration change on
!      the enterprise edge, because local preference 200 > 100.
```

**What to look for.** In `show ip bgp summary`, `State/PfxRcd` must show a **number**, not an alphabetic state — a number means the session reached Established and that many prefixes were accepted; the strings to worry about are `Idle`, `Connect`, `Active`, `OpenSent` and `OpenConfirm`, each with a distinct cause (§9.16). `InQ` and `OutQ` must be 0 and `Up/Down` must be increasing. The prefix counts (3 and 2) must match what the inbound prefix lists permit; a count of 0 with an Established session means the inbound route map is denying everything — a silent and dangerous failure. In `show ip bgp`, `*>` marks the best path: for `192.0.2.0/24` the best path is via `10.10.100.2` because local preference is 200, with the alternate present but unselected — local preference doing exactly what §9.10.3 says. On a same-prefix comparison where the best-path marker does **not** follow the local-preference rule, the route map is not matching and the output is a **finding, not a success**: investigate with `show ip bgp <prefix>` and `show route-map RM-EDGE-IN-PRIMARY`. Weight 32768 marks locally originated routes from the two `network` statements. The AS-path on the alternate shows four `65002` entries when three were configured as prepends, because the provider's own AS also appears once naturally: the on-wire path is the provider's AS plus the prepends — the kind of detail the report must explain rather than gloss, since a reader expecting three entries will think the configuration failed. **In `advertised-routes`, EXACTLY TWO prefixes must appear**: a larger number means internal prefixes are leaking to the provider and the design's central BGP control has failed, and no `10.10.x.x`, `10.20.20.x` or `10.70.x.x` may appear under any circumstances — that is TB-06, TB-09 and TB-10 territory. Administrative distance **20** for eBGP is lower than OSPF's 110 and EIGRP's 90, so a BGP-learned route overrides an IGP-learned route to the same prefix: correct for external reachability, and exactly why internal prefixes must never be learned by BGP.

Two findings must be recorded for the failover test. First, the **best-path marker moved without any change on the enterprise router** — the strongest available demonstration that the design's path preference is a property of the algorithm and its attributes rather than of a static route. Second, the **convergence time displayed by Packet Tracer is a simulation artefact**; real-world BGP failover at an edge is dominated by the hold timer (here `timers 10 30`, a 10-second keepalive and 30-second hold) plus the provider's withdrawal propagation, and that difference deserves a sentence rather than a fabricated millisecond figure.

---

### 9.11 Route Redistribution and Loop Prevention

#### 9.11.1 The single redistribution point

The baseline fixes the policy in absolute terms and this chapter implements it exactly: redistribution occurs at **exactly one device, `VP-HQ-EDGE-01`**; route tags are **`100` for OSPF-originated prefixes and `200` for EIGRP-originated prefixes**; redistribution is **one-way per prefix set**, with mutual un-tagged redistribution forbidden; and administrative distances are **left at their defaults**, the report stating that the design relies on those defaults.

`VP-HQ-EDGE-01` is the correct place and the only place, for three reasons: it is the only device participating in both interior protocols; it is the only device that also speaks eBGP, so all three routing domains meet at one point reviewable as a unit; and it is a single point of failure whose loss is *survivable and bounded* — if it fails, HQ keeps OSPF, Kwun Tong keeps OSPF, Macau keeps EIGRP, and only cross-domain reachability is lost. Redistributing on the core switches as well would create two mutual redistribution points between the same protocol pair, the textbook recipe for a routing loop.

#### 9.11.2 The route-map and tag strategy

```cisco
! ===== VP-HQ-EDGE-01 — THE SINGLE REDISTRIBUTION POINT =====
! OSPF process 1 (area 0) <--> EIGRP AS 100 <--> BGP AS 65001
! --- 1. Define exactly which prefixes cross the boundary, each way. Prefix
!        lists are used rather than an unfiltered `redistribute`, because an
!        unfiltered redistribution would carry the management (10.20.20.0/24)
!        and isolated-lab (10.70.0.0/16) ranges across the boundary.
ip prefix-list PL-HQ-SUBNETS seq 5  permit 10.10.10.0/24
ip prefix-list PL-HQ-SUBNETS seq 10 permit 10.10.30.0/24
ip prefix-list PL-HQ-SUBNETS seq 15 permit 10.10.40.0/23
ip prefix-list PL-HQ-SUBNETS seq 20 permit 10.10.45.0/24
ip prefix-list PL-HQ-SUBNETS seq 25 permit 10.10.50.0/28
ip prefix-list PL-HQ-SUBNETS seq 30 permit 10.10.60.0/24
ip prefix-list PL-HQ-SUBNETS seq 35 permit 10.10.80.0/24
ip prefix-list PL-HQ-SUBNETS seq 99 deny   0.0.0.0/0 le 32
ip prefix-list PL-BRANCH-SUBNETS seq 5  permit 10.10.110.0/24
ip prefix-list PL-BRANCH-SUBNETS seq 10 permit 10.10.111.0/24
ip prefix-list PL-BRANCH-SUBNETS seq 15 permit 10.10.112.0/24
ip prefix-list PL-BRANCH-SUBNETS seq 20 permit 10.10.113.0/24
ip prefix-list PL-BRANCH-SUBNETS seq 99 deny   0.0.0.0/0 le 32
ip prefix-list PL-MO-SUBNETS seq 5  permit 10.10.120.0/24
ip prefix-list PL-MO-SUBNETS seq 10 permit 10.10.121.0/24
ip prefix-list PL-MO-SUBNETS seq 99 deny   0.0.0.0/0 le 32
! --- 2. OSPF -> EIGRP  (tag 100 : "this prefix came from OSPF"). Only HQ and
!        branch prefixes go to Macau. Tags are set on the way out so that a
!        returning tagged prefix can be identified.
route-map RM-OSPF-TO-EIGRP permit 10
 description [OSPF area 0 prefixes into EIGRP AS 100 - TAG 100]
 match ip address prefix-list PL-HQ-SUBNETS PL-BRANCH-SUBNETS
 set tag 100
 set metric 100000 100 255 1 1500
route-map RM-OSPF-TO-EIGRP deny 20
 description [deny everything else - explicit so the deny is visible in show run]
! --- 3. EIGRP -> OSPF  (tag 200 : "this prefix came from EIGRP"). Only the
!        Macau prefixes enter OSPF. Nothing else.
route-map RM-EIGRP-TO-OSPF permit 10
 description [EIGRP AS 100 prefixes into OSPF area 0 - TAG 200]
 match ip address prefix-list PL-MO-SUBNETS
 set tag 200
route-map RM-EIGRP-TO-OSPF deny 20
 description [deny everything else]
! --- 4. The redistribution statements themselves -----------------------
router ospf 1
 redistribute eigrp 100 subnets route-map RM-EIGRP-TO-OSPF
! `subnets` is mandatory: without it OSPF redistributes only classful networks
! and the four Macau /24s would silently disappear.
router eigrp 100
 redistribute ospf 1 metric 100000 100 255 1 1500 route-map RM-OSPF-TO-EIGRP
! EIGRP requires an explicit seed metric on redistribution; there is no
! default. The seed is (bandwidth kbps, delay, reliability, load, MTU). These
! five values are the design's declared representation, not a measurement, and
! the report says so.
```

#### 9.11.3 Administrative-distance considerations

| Route source | Default AD | Consequence at this boundary |
|---|---|---|
| Connected | 0 | Always wins, as it must |
| Static | 1 | The two `Null0` aggregates and any static default are preferred over every dynamic source |
| eBGP | 20 | Provider routes override everything dynamic |
| Internal EIGRP | 90 | **Lower (better) than OSPF's 110.** The single most dangerous number in the design |
| OSPF | 110 | Learned IGP routes |
| External EIGRP (redistributed into EIGRP) | 170 | Tagged-100 prefixes arriving back at the HQ edge as `D EX` would be *less* preferred than OSPF's 110 — the mechanism that makes a loop non-catastrophic |
| iBGP | 200 | Not present |

**Why the EIGRP 90 versus OSPF 110 gap matters, stated plainly.** If the Macau prefixes were redistributed into OSPF *and* a copy of those prefixes were somehow still present in EIGRP, the EIGRP copy would win on this router because 90 < 110, and Macau traffic would take a path the design did not intend. The mitigation is **not** to change the AD — that would affect every route from that protocol, everywhere, and would hide the problem rather than prevent it — but the **tag** plus the **one-way direction**: the tag makes a returning prefix identifiable, and the one-way direction means EIGRP-to-OSPF carries Macau prefixes while OSPF-to-EIGRP carries HQ and branch prefixes only, never Macau's own prefixes back to Macau.

Three further decisions and their justifications: (1) **a floating static default is deliberately not configured** on `VP-HQ-EDGE-01` — a static default at AD 250 would sit behind the eBGP-learned default and provide a backup if both BGP sessions died, but both providers terminate on the same simulated device here, so it would fail at exactly the same moment as the primary and give a false impression of redundancy; the omission is recorded as a finding; (2) **static routes are used only for the two `Null0` aggregates** that give the BGP `network` statements something to announce, never to steer traffic; (3) **`default-information originate always` is metric-type 2 with metric 10** — type 2 keeps the external cost out of the internal cost along the path, so the default route's metric is constant across the estate and the table easier to read; type 1 would be preferable where two exits existed with genuinely different external costs, but here there is one exit.

#### 9.11.4 Why redistribution is restricted to one device — the loop argument

Redistribution between two protocols creates a loop when a prefix originating in protocol A is redistributed into B, then back into A, and is preferred over the original. The design forbids this by construction through four independent controls, all four of which matter because any one alone is insufficient.

1. **Single point.** Only `VP-HQ-EDGE-01` redistributes, and there is no second path between the OSPF and EIGRP domains, so no second opportunity for a round trip.
2. **One-way per prefix set.** OSPF→EIGRP carries HQ and branch prefixes only; EIGRP→OSPF carries Macau prefixes only. The directions move disjoint sets, so no prefix can traverse both.
3. **Explicit route tags.** Every redistributed prefix carries `100` or `200`. Tags survive most protocol transitions and are visible in `show ip route` and the link-state database, making a loop detectable by inspection rather than only by symptom.
4. **Explicit terminal denies.** Each route map ends with `deny 20`. Without a terminal deny the map's behaviour would depend on whether it is used for redistribution or for policy — a subtlety that has caused real outages — so the deny is made explicit.

The control-plane hardening line `Apply basic security configuration for control and data plane` is satisfied here in a specific sense worth naming: route redistribution **is** a control-plane configuration, and a mis-tagged redistribution is a control-plane attack path as surely as an unauthenticated OSPF adjacency.

#### 9.11.5 Verification that there is no loop and no suboptimal path

```text
! --- Test 1: the Macau prefix, seen from the HQ core -----------------
VP-HQ-CORE-01# show ip route 10.10.120.0
Routing entry for 10.10.120.0/24
  Known via "ospf 1", distance 110, metric 30, type extern 2, forward metric 11
  Redistributing via ospf 1
  Last update from 10.10.10.1 on Vlan10, 00:19:52 ago
  Routing Descriptor Blocks:
  * 10.10.10.1, from 10.255.0.21, 00:19:52 ago, via Vlan10
      Route metric is 30, traffic share count is 1
      Route tag 200

! --- Test 2: the same prefix from the branch -------------------------
VP-BR-EDGE-01# show ip route 10.10.120.0
  Known via "ospf 1", distance 110, metric 30, type extern 2, forward metric 111
  Last update from 10.10.100.33 on GigabitEthernet0/1, 00:19:44 ago
  Routing Descriptor Blocks:
  * 10.10.100.33, from 10.255.0.21, 00:19:44 ago, via GigabitEthernet0/1
      Route metric is 30, traffic share count is 1
      Route tag 200

! --- Test 3: the HQ prefix from Macau, proving direction 1 -----------
VP-MO-EDGE-01# show ip route 10.10.30.0
Routing entry for 10.10.30.0/24
  Known via "eigrp 100", distance 170, metric 2297856, type external
  Redistributing via eigrp 100
  Last update from 10.10.100.37 on GigabitEthernet0/1, 00:19:38 ago
  Routing Descriptor Blocks:
  * 10.10.100.37, from 10.10.100.37, 00:19:38 ago, via GigabitEthernet0/1
      Route metric is 2297856, traffic share count is 1
      Route tag 100

! --- Test 4: traceroute evidence that the path is the intended one ---
VP-HQ-CORE-01# traceroute 10.10.120.10
Tracing the route to 10.10.120.10
  1 10.10.10.1 4 msec 2 msec 2 msec
  2 10.10.100.37 12 msec 10 msec 10 msec
  3 10.10.120.10 14 msec 13 msec 14 msec
!  The hop sequence must be HQ core -> HQ edge -> Macau edge -> target.
!  Compare with the reverse direction from VP-MO-EDGE-01 to 10.10.30.11:
!  asymmetric routing is acceptable (both directions are valid paths), but a
!  REVERSED-BACK-WHERE-IT-CAME pattern -- the classic three-hop ping-pong --
!  is a loop symptom.

! --- Test 5: the deliberate-misconfiguration experiment --------------
!  The baseline requires a routing-loop test after a deliberate
!  misconfiguration that the report documents and fixes.
!  (a) Capture Tests 1-4 as the "before" state.
!  (b) Break the tag strategy: remove `set tag 200` from
!      route-map RM-EIGRP-TO-OSPF permit 10.
!  (c) Re-run Test 1: the prefix now appears with `Route tag 0`.
!  (d) Break it further: add `network 10.10.120.0 0.0.0.255 area 0` to
!      router ospf 1 on VP-HQ-EDGE-01. The prefix now exists in OSPF as an
!      INTERNAL route AND as an external route, and the internal one wins --
!      a genuine, reproducible loop pre-condition.
!  (e) Observe: `show ip route 10.10.120.0` shows the internal route with no
!      tag; `show ip ospf database` shows the prefix in both the Router LSA
!      and the Type-5 external LSA.
!  (f) Restore both changes, re-run Tests 1-4, and confirm the before state
!      reproduces exactly.
!  The finding -- that the loop is prevented by the TAG and the DENY terminal
!  and not by the AD alone -- goes into the findings register with both the
!  broken and the repaired outputs. Demonstrating the failure and then
!  correcting it is stronger evidence than a configuration that merely looks
!  correct.
```

| Verification | Passing result | Failing result and what it means |
|---|---|---|
| Tag present on redistributed prefixes | `Route tag 200` (Macau into OSPF) or `Route tag 100` (HQ into EIGRP) | `Route tag 0` means the route map's `set tag` clause did not match |
| Correct AD on redistributed prefixes | OSPF external: `distance 110`, `type extern 2`; EIGRP redistributed: `distance 170`, `type external` | Distance 90 on an entry that should be external means the prefix is believed native to Macau |
| Single ASBR for external prefixes | The advertising router is always `10.255.0.21` | A second advertising router means a second redistribution point exists |
| Direction correctness | HQ prefix in Macau with tag 100; Macau prefix in HQ with tag 200 | A Macau prefix present in EIGRP on `VP-MO-EDGE-01` as an *internal* route means it was redistributed back to its own origin |
| No ping-pong path | Monotonic hop sequence in both directions, no repeated device | A hop appearing twice indicates a routing loop |
| Management and lab ranges never cross the boundary | `10.20.20.0/24` and `10.70.0.0/16` are **absent** from `show ip eigrp topology` | Their presence is a security defect: the isolated lab would be reachable from the legacy domain |

Note in Test 1 that `type extern 2` proves the prefix arrived as an OSPF external LSA, exactly what redistribution produces; an internal OSPF route to the same prefix would mean it had been leaked into the OSPF database by something other than the single redistribution point. Note also that the forward metric rises from 11 at the core to 111 at the branch (the branch reaches the ASBR over the 100-cost WAN link) while the **route metric stays 30** — the effect of metric-type 2.

---

### 9.12 ASA Firewall

#### 9.12.1 Design and placement

`VP-HQ-FW-01` is a **Cisco ASA 5506-X running an ASA 9.16(4) image** occupying the perimeter **DMZ boundary** role.

| Device | Position | What it does | What it does **not** do |
|---|---|---|---|
| **`VP-HQ-FW-01` (ASA)** | Between the egress transit (VLAN 50) and the outside segment; DMZ gateway | **Filters the DMZ boundary**: TB-04 (DMZ may not initiate toward the internal network), TB-05 (Internet to DMZ, published services only), TB-13 (DMZ to Internet, outbound only), TB-15 (DMZ management path), TB-06 (nothing but the VPN endpoints is Internet-reachable). Performs **static NAT** for published services, **dynamic PAT** for inside-and-DMZ egress and **NAT exemption** for the IPsec tunnel. Terminates the IPsec IKEv2 site-to-site tunnel to `VP-WC-EDGE-01` | It does not perform general egress filtering for `Z-USER`/`Z-SERVER` — that is the nftables pair's job — and it does not see most internal traffic |
| **`vpnz-nft01`/`vpnz-nft02` (nftables HA pair, VIP 10.10.50.10)** | **Inline** on VLAN 50 between the HQ core and the ASA inside | The **only path from `Z-SERVER`/`Z-USER` to the Internet**: stateful egress filtering per TB-02/TB-03, masquerade NAT for internal egress, attribute logging by source IP, WireGuard termination | It does not own the DMZ boundary and does not terminate the IPsec site-to-site tunnel |

**Why both exist, in one paragraph.** The two devices implement policy **twice, at two different layers, for two different threat models**. The ASA is a purpose-built perimeter appliance whose strengths are its DMZ publication model, its security-level default behaviour, its mature IPsec implementation and its inspection engines — the correct place to expose services to an untrusted network. The nftables pair is a Linux host firewall on a genuinely virtualised Ubuntu pair, which is the only part of this estate where the group can demonstrate *actually executing* a stateful ruleset, log denied flows with a prefix, and prove VIP failover with Keepalived — and the correct place to hold one exhaustively reviewed egress allow-list. Combining them would mean either exposing the DMZ to a Linux ruleset the group can edit at will, or asking the simulator's reduced ASA model to carry an egress policy it cannot evidence. Keeping them separate means each claim is verifiable with its own tooling. This is *policy a second time at a second layer*, not duplicated effort.

**The division of NAT responsibility, crisply stated.** (1) **The nftables pair NATs internal-to-Internet traffic**: a workstation or server reaching the simulated Internet has its source address translated by `masquerade` on the pair's WAN-facing interface, so the ASA sees already-translated traffic. (2) **The ASA NATs everything at the perimeter the nftables pair cannot see** — the **published DMZ services** via static NAT from `198.51.100.0/29` to `10.10.90.0/24`, the **VPN front door** from `198.51.100.5` to `10.10.50.10`, and any traffic sourced from the DMZ segment. (3) **Neither device NATs the site-to-site tunnel**: a NAT exemption rule exists precisely so tunnel traffic keeps its original addresses, because a tunnel that is also translated is very difficult to troubleshoot and breaks any protocol carrying an address in its payload.

#### 9.12.2 Base configuration

```cisco
! ===== VP-HQ-FW-01 — Cisco ASA 5506-X, ASA 9.16(4) =====
hostname VP-HQ-FW-01
domain-name vertexpeak.fyp.lab
enable password <REDACTED-ENABLE-SECRET>
! --- interfaces and security levels ------------------------------
interface GigabitEthernet1/1
 nameif outside
 security-level 0
 ip address 198.51.100.1 255.255.255.248
 description [to Z-WAN outside segment]
 no shutdown
interface GigabitEthernet1/2
 nameif inside
 security-level 100
 ip address 10.10.50.2 255.255.255.240
 description [to Z-EGRESS nftables pair VIP 10.10.50.10]
 no shutdown
interface GigabitEthernet1/3
 nameif dmz
 security-level 50
 ip address 10.10.90.1 255.255.255.0
 description [to Z-DMZ VLAN90 - ASA IS THE DMZ GATEWAY]
 no shutdown
interface Management1/1
 nameif mgmt
 security-level 100
 ip address 10.20.20.32 255.255.255.0
 no shutdown
! --- the security-level model, stated so the reader knows what is implicit
!  Higher security level -> lower: permitted by default.
!  Lower security level -> higher: DENIED by default unless an ACL permits it.
!  This design RELIES on that default for inside(100)/dmz(50) -> outside(0),
!  and adds explicit ACLs wherever an exception is required. It does NOT rely
!  on it for any DMZ-to-inside or outside-to-anything flow: those are denied
!  explicitly with logging. Where a stricter-than-default control is needed
!  (the DMZ must not initiate toward inside at all, including non-IP frames)
!  an EtherType ACL is used -- see §9.12.6.
! --- routing: no dynamic protocol on the ASA, deliberately ----------
route outside 0.0.0.0 0.0.0.0 198.51.100.6 1   ! the provider edge on the ASA's own /29; Rev 1.1 ruling C-15
!  The outside next hop is the simulated provider address in the DMZ public
!  pool's own /29 (198.51.100.1-.6). See the baseline correction note below.
route inside 10.10.10.0 255.255.255.0 10.10.50.1 1
route inside 10.10.30.0 255.255.255.0 10.10.50.1 1
route inside 10.10.40.0 255.255.254.0 10.10.50.1 1
route inside 10.10.80.0 255.255.255.0 10.10.50.1 1
route inside 10.70.0.0 255.255.255.0 10.10.50.1 1
!  No default route on the inside interface: the internal network is reached as
!  a set of explicit prefixes, so a routing mistake cannot send internal
!  traffic out of the inside interface toward an unknown destination.
! --- DNS, time, logging ---------------------------------------------
dns domain-lookup outside
dns server-group DefaultDNS
 name-server 10.10.30.11
 name-server 10.10.30.12
 domain-name vertexpeak.fyp.lab
clock timezone HKT 8
ntp authentication-key 1 md5 <REDACTED-NTP-KEY>
ntp authenticate
ntp server 10.10.30.11 source inside key 1 prefer
ntp server 10.10.30.12 source inside key 1
logging enable
logging timestamp
logging trap informational
logging host inside 10.10.30.31
logging buffered informational
!  NOTE on log level: `informational` (level 6) does NOT log denied packets,
!  which are level 4 (warnings). The design uses `logging trap informational`
!  for the general stream and relies on the ACL `log warnings` keyword plus
!  explicit `logging message ... level warnings` for the deny evidence TB-04
!  and TB-06 require. Stated because a reader who expects denies at level 6
!  would conclude, wrongly, that nothing was denied.
! --- object definitions (baseline convention OBJ-NET-{ZONE}) --------
object network OBJ-NET-SRV
 subnet 10.10.30.0 255.255.255.0
object network OBJ-NET-STORAGE
 subnet 10.10.80.0 255.255.255.0
object network OBJ-NET-USER
 subnet 10.10.40.0 255.255.254.0
object network OBJ-NET-BRANCH
 subnet 10.10.110.0 255.255.255.0
object network OBJ-NET-MGMT
 subnet 10.20.20.0 255.255.255.0
object network OBJ-NET-LAB
 subnet 10.70.0.0 255.255.255.0
object network OBJ-NET-DMZ
 subnet 10.10.90.0 255.255.255.0
object network OBJ-NET-PUBLIC
 subnet 198.51.100.0 255.255.255.248
object group service OBJ-SVC-PUBLISHED
 service-object tcp destination eq https
 service-object tcp destination eq www
object group service OBJ-SVC-MGMT
 service-object tcp destination eq ssh
 service-object tcp destination eq 3389
 service-object tcp destination eq 5985
 service-object tcp destination eq 5986
 service-object udp destination eq snmp
 service-object udp destination eq syslog
object group service OBJ-SVC-VPN
 service-object udp destination eq isakmp
 service-object udp destination eq 4500
object network OBJ-HOST-REVPROXY-VIP
 host 10.10.90.10
object network OBJ-HOST-WEBA01
 host 10.10.90.21
object network OBJ-HOST-WEBA02
 host 10.10.90.22
object network OBJ-HOST-WP01
 host 10.10.90.25
object network OBJ-HOST-DMZJUMP
 host 10.10.90.27
object network OBJ-HOST-NFTVIP
 host 10.10.50.10
object network OBJ-HOST-WC-PEER
 host 203.0.113.5

! ===== ACL-DMZ-OUT-10 — applied to the dmz interface, direction in =====
! Enforces TB-04 (DMZ must NEVER initiate toward the internal network),
! TB-13 (DMZ may reach the Internet, outbound only), TB-15 (DMZ hosts are
! managed only via the DMZ jump host), TB-05 (return traffic for published
! flows). Order is deliberate: specific permits, then internal-destination
! denies, then an explicit terminal deny-all with log.
access-list ACL-DMZ-OUT-10 extended permit tcp host 10.10.90.10 any eq https
access-list ACL-DMZ-OUT-10 extended permit tcp host 10.10.90.21 any eq https
access-list ACL-DMZ-OUT-10 extended permit tcp host 10.10.90.22 any eq https
access-list ACL-DMZ-OUT-10 extended permit tcp host 10.10.90.25 any eq https
access-list ACL-DMZ-OUT-10 extended permit tcp host 10.10.90.26 any eq https
access-list ACL-DMZ-OUT-10 extended permit udp host 10.10.90.10 host 10.10.30.11 eq domain
access-list ACL-DMZ-OUT-10 extended permit tcp host 10.10.90.10 host 10.10.30.11 eq domain
access-list ACL-DMZ-OUT-10 extended permit tcp host 10.10.90.10 host 10.10.30.11 eq 636
access-list ACL-DMZ-OUT-10 extended permit udp host 10.10.90.21 host 10.10.30.11 eq domain
access-list ACL-DMZ-OUT-10 extended permit udp host 10.10.90.25 host 10.10.30.11 eq domain
! --- DMZ management only from the DMZ jump host (TB-15) --------------
access-list ACL-DMZ-OUT-10 extended permit tcp host 10.10.90.27 10.10.90.0 255.255.255.0 eq ssh
! --- NTP to the forest time source -----------------------------------
access-list ACL-DMZ-OUT-10 extended permit udp 10.10.90.0 255.255.255.0 host 10.10.30.11 eq ntp
! --- TB-04: explicit DENY, with log, of every DMZ-initiated flow toward the
!     internal zones. The security-level model would drop this traffic anyway;
!     these lines make the policy auditable and produce the evidence TB-04
!     requires. The broad denies are the belt to the braces. -----------
access-list ACL-DMZ-OUT-10 extended deny ip 10.10.90.0 255.255.255.0 10.10.30.0 255.255.255.0 log warnings
access-list ACL-DMZ-OUT-10 extended deny ip 10.10.90.0 255.255.255.0 10.10.80.0 255.255.255.0 log warnings
access-list ACL-DMZ-OUT-10 extended deny ip 10.10.90.0 255.255.255.0 10.10.40.0 255.255.254.0 log warnings
access-list ACL-DMZ-OUT-10 extended deny ip 10.10.90.0 255.255.255.0 10.20.20.0 255.255.255.0 log warnings
access-list ACL-DMZ-OUT-10 extended deny ip any 10.10.0.0 255.255.0.0 log warnings
access-list ACL-DMZ-OUT-10 extended deny ip any 10.20.0.0 255.255.0.0 log warnings
access-list ACL-DMZ-OUT-10 extended deny ip any 10.70.0.0 255.255.0.0 log warnings
access-list ACL-DMZ-OUT-10 extended permit tcp host 10.10.90.10 host 10.10.30.51 eq https
access-list ACL-DMZ-OUT-10 extended deny ip any any log warnings

! ===== ACL-OUTSIDE-IN-10 — applied to the outside interface, direction in =====
! Enforces TB-05 (Internet to DMZ, published services only), TB-06 (nothing
! else is Internet-reachable), TB-13 (return traffic to the DMZ hosts).
access-list ACL-OUTSIDE-IN-10 extended permit tcp any host 198.51.100.2 eq https
access-list ACL-OUTSIDE-IN-10 extended permit tcp any host 198.51.100.2 eq www
access-list ACL-OUTSIDE-IN-10 extended permit tcp any host 198.51.100.3 eq https
access-list ACL-OUTSIDE-IN-10 extended permit tcp any host 198.51.100.4 eq https
access-list ACL-OUTSIDE-IN-10 extended permit icmp any host 198.51.100.2 echo
access-list ACL-OUTSIDE-IN-10 extended permit icmp any host 198.51.100.3 echo
access-list ACL-OUTSIDE-IN-10 extended permit icmp any host 198.51.100.4 echo
! --- the VPN front door (TB-11, TB-16; P-15/P-16/P-17) ---------------
access-list ACL-OUTSIDE-IN-10 extended permit udp any host 198.51.100.5 eq isakmp
access-list ACL-OUTSIDE-IN-10 extended permit udp any host 198.51.100.5 eq 4500
access-list ACL-OUTSIDE-IN-10 extended permit udp any host 198.51.100.5 eq 443
access-list ACL-OUTSIDE-IN-10 extended permit udp any host 198.51.100.5 eq 1194
! --- IPsec peer for the site-to-site tunnel -------------------------
access-list ACL-OUTSIDE-IN-10 extended permit udp host 203.0.113.5 host 198.51.100.1 eq isakmp
access-list ACL-OUTSIDE-IN-10 extended permit udp host 203.0.113.5 host 198.51.100.1 eq 4500
access-list ACL-OUTSIDE-IN-10 extended permit esp host 203.0.113.5 host 198.51.100.1
! --- TB-06: explicit deny-and-log of everything else inbound --------
access-list ACL-OUTSIDE-IN-10 extended deny ip any any log warnings

access-group ACL-DMZ-OUT-10 in interface dmz
access-group ACL-OUTSIDE-IN-10 in interface outside
policy-map global_policy
 class inspection_default
  inspect dns preset_dns_map
  inspect icmp
  inspect http
  inspect ftp
  inspect tftp
  inspect sip
  inspect netbios
```

Two implicit rules the design relies on are stated so no reader infers more policy than exists: the ASA's built-in rule permitting **higher security level to lower** is relied on for inside(100)→outside(0) and dmz(50)→outside(0); and it is **not** relied on for any DMZ-to-inside or outside-to-anything flow, which are denied explicitly with logging.

#### 9.12.3 NAT

| Form | Where used | What it does | Why this form |
|---|---|---|---|
| **Dynamic PAT (overload)** | inside → outside, dmz → outside | Many internal addresses share one public address; the ASA tracks port mappings | The enterprise has far more hosts than public addresses and inbound connections to internal hosts are not required |
| **Static NAT (one-to-one, with port forwarding)** | outside → DMZ published services | A fixed public address maps permanently to a fixed DMZ host or VIP | Published services must be reachable inbound, which PAT cannot provide; static NAT also gives a stable mapping a DNS record can reference |
| **NAT exemption (identity NAT)** | inside ↔ the IPsec peer `203.0.113.5` | Tunnel traffic is NOT translated | A translated tunnel makes the crypto ACL and the addresses inside the tunnel diverge, breaks protocols carrying addresses in their payload, and makes troubleshooting a two-variable problem |

```cisco
! ===== NAT POLICY — VP-HQ-FW-01 =====
! --- Form 1: dynamic PAT for inside and dmz egress ------------------
!  Most internal egress is already NATed by the nftables pair before it
!  reaches the ASA, so this rule is the fallback for traffic sourced from the
!  VLAN 50 transit itself and for the DMZ.
object network OBJ-NET-SRV
 nat (inside,outside) dynamic interface
object network OBJ-NET-DMZ
 nat (dmz,outside) dynamic interface
! --- Form 2: static NAT for the published services ------------------
!  Portal: public 198.51.100.2 -> the Nginx HA VIP 10.10.90.10
object network OBJ-HOST-REVPROXY-VIP
 nat (dmz,outside) static 198.51.100.2
!  Web farm: public 198.51.100.3 -> the IIS pair, port-forwarded. Two hosts
!  cannot share one public address without port separation, so the pair is
!  published through the reverse-proxy VIP in production and these direct
!  mappings exist only for the test that proves a DMZ host is NOT directly
!  reachable (TB-05's "no other DMZ host directly" clause).
object network OBJ-HOST-WEBA01
 nat (dmz,outside) static 198.51.100.3 service tcp https https
object network OBJ-HOST-WEBA02
 nat (dmz,outside) static 198.51.100.3 service tcp 8443 https
!  Blog: public 198.51.100.4 -> the WordPress front door via the proxy VIP
object network OBJ-HOST-WP01
 nat (dmz,outside) static 198.51.100.4 service tcp https https
!  VPN front door, hop 1 of 2 (owner: the ASA): public 198.51.100.5 -> the nftables VIP 10.10.50.10, port
!  Hop 2 (owner: the nftables pair on that VIP) DNATs to vpnz-rras01 (udp 500/4500) and vpnz-lnxra01 (udp 1194);
!  WireGuard terminates on the pair itself. Rev 1.1 ruling C-20.
!  by port: UDP 443 WireGuard, UDP 500/4500 IKEv2, UDP 1194 OpenVPN
object network OBJ-HOST-NFTVIP
 nat (inside,outside) static 198.51.100.5 service udp isakmp isakmp
 nat (inside,outside) static 198.51.100.5 service udp 4500 4500
 nat (inside,outside) static 198.51.100.5 service udp 443 443
 nat (inside,outside) static 198.51.100.5 service udp 1194 1194
! --- Form 3: NAT exemption for the IPsec site-to-site tunnel --------
!  Traffic between the HQ internal ranges and the Wan Chai peer address must
!  transit untranslated, or the crypto ACL and the translated addresses
!  disagree and the tunnel carries traffic for addresses that exist on neither
!  end. These are MANUAL NAT rules, evaluated before Auto NAT -- see below.
object network OBJ-HOST-WC-PEER
 nat (inside,outside) static OBJ-HOST-WC-PEER
nat (inside,outside) source static OBJ-NET-SRV OBJ-NET-SRV destination static OBJ-HOST-WC-PEER OBJ-HOST-WC-PEER no-proxy-arp route-lookup
nat (dmz,outside)    source static OBJ-NET-DMZ OBJ-NET-DMZ destination static OBJ-HOST-WC-PEER OBJ-HOST-WC-PEER no-proxy-arp route-lookup
! --- explicit no-NAT for the return path of the published services ---
!  A request from an internal client to the PUBLIC address of the portal would
!  otherwise be PATed outbound and fail to come back, because the ASA would
!  translate the client's source address while the DMZ server's reply is
!  addressed to the public realm. Hairpin NAT is deliberately NOT implemented;
!  instead internal clients resolve `portal.vertexpeak.fyp.lab` to the DMZ VIP
!  10.10.90.10 directly, which the split-horizon DNS record plan already does.
!  Documented here because a reader will otherwise assume the ASA is broken
!  when an internal client cannot reach its own published address.
```

```text
VP-HQ-FW-01# show nat
Auto NAT Policies (Section 2)
   1 (inside) to (outside) source dynamic OBJ-NET-SRV interface
        translate_hits = 412, untranslate_hits = 398
   2 (dmz) to (outside) source dynamic OBJ-NET-DMZ interface
        translate_hits = 1120, untranslate_hits = 1043
   3 (dmz) to (outside) source static OBJ-HOST-REVPROXY-VIP 198.51.100.2
        translate_hits = 0, untranslate_hits = 96
   4 (inside) to (outside) source static OBJ-HOST-NFTVIP 198.51.100.5 service udp 443 443
        translate_hits = 0, untranslate_hits = 14
Manual NAT Policies (Section 1)
   1 (inside) to (outside) source static OBJ-NET-SRV OBJ-NET-SRV destination static OBJ-HOST-WC-PEER OBJ-HOST-WC-PEER
        translate_hits = 0, untranslate_hits = 0
   2 (dmz) to (outside) source static OBJ-NET-DMZ OBJ-NET-DMZ destination static OBJ-HOST-WC-PEER OBJ-HOST-WC-PEER
        translate_hits = 0, untranslate_hits = 0
```

**What to look for.** For published services, `translate_hits` counts outbound translations and `untranslate_hits` the inbound direction being mapped back; a working published service shows `untranslate_hits` increasing as clients connect, and a **non-zero `translate_hits` with zero `untranslate_hits` on a static NAT rule is a red flag** — something is matching the rule in the wrong direction. The NAT-exemption rules showing 0/0 **before** the tunnel is built is correct and not evidence of a fault; after the tunnel is up both should increment. The **order of the sections** matters: Manual NAT (Section 1) is evaluated **before** Auto NAT (Section 2), which is why the exemption rules are Manual NAT — if they were Auto NAT, a dynamic PAT rule could match first and translate tunnel traffic. That ordering is the single most common ASA NAT mistake and is a §9.16 entry.

#### 9.12.4 The VPN function

The baseline assigns the ASA a **site-to-site IPsec tunnel to `VP-WC-EDGE-01`** (tunnel `IPSEC-HQ-WC`) carrying **VLAN 131 only**, stating its purpose as *"Used to demonstrate ASA IPsec and to compare against WireGuard."* The assignment is accepted and implemented, with two honest qualifications.

**Qualification 1 — the tunnel is demonstrated in the simulator, with the simulator's limitations accepted.** Packet Tracer's ASA supports IKE and IPsec configuration, but **IKEv1 with pre-shared keys is the path that reliably completes, while IKEv2 with certificates is not dependable**. The design position is: the configuration of record is IKEv2 with pre-shared-key authentication and the group attempts that first; if it cannot be established, the group falls back to the simulator's working IKEv1/PSK form, **states the substitution in one plain sentence**, and presents the real-equipment IKEv2-with-certificates configuration as Track B; and **the project must not claim a working IKEv2 certificate-based ASA tunnel unless `show crypto ikev2 sa` and `show crypto ipsec sa` prove it.** The baseline's own position — ASA "COVERED (with declared limits)" — is what this honours.

```cisco
! ===== IPsec site-to-site — ASA side =====
! DESIGN POSITION: IKEv2 with pre-shared key. Peer: VP-WC-EDGE-01 203.0.113.5
! Interesting traffic: VLAN 131 (10.10.131.0/24) only.
crypto ikev2 policy 10
 encryption aes-256
 integrity sha256
 group 14
 prf sha256
 lifetime seconds 86400
crypto ikev2 enable outside
tunnel-group 203.0.113.5 type ipsec-l2l
tunnel-group 203.0.113.5 ipsec-attributes
 ikev2 local-authentication pre-shared-key <REDACTED-IPsec-PSK>
 ikev2 remote-authentication pre-shared-key <REDACTED-IPsec-PSK>
crypto ipsec ikev2 ipsec-proposal PROPOSAL-IKEV2-FYP
 protocol esp encryption aes-256
 protocol esp integrity sha-256
! --- the crypto ACL: what is "interesting" --------------------------
!  Exactly the Wan Chai dev VLAN <-> the HQ server VLAN and the DMZ. Nothing
!  else is encrypted: the design deliberately does not encrypt everything,
!  because a tunnel carrying everything hides the fact that the internal path
!  is not the production path.
access-list ACL-VPN-IPSEC-S2S-A extended permit ip 10.10.131.0 255.255.255.0 10.10.30.0 255.255.255.0
access-list ACL-VPN-IPSEC-S2S-A extended permit ip 10.10.131.0 255.255.255.0 10.10.90.0 255.255.255.0
crypto map CMAP-OUTSIDE 10 match address ACL-VPN-IPSEC-S2S-A
crypto map CMAP-OUTSIDE 10 set peer 203.0.113.5
crypto map CMAP-OUTSIDE 10 set ikev2 ipsec-proposal PROPOSAL-IKEV2-FYP
crypto map CMAP-OUTSIDE 10 set pfs group14
crypto map CMAP-OUTSIDE 10 set security-association lifetime seconds 3600
crypto map CMAP-OUTSIDE interface outside
! --- the peer side (VP-WC-EDGE-01), DOCUMENTED INTENT ---------------
!  The Cisco IOS form of the same tunnel is: crypto ikev2 proposal; crypto
!  ikev2 policy; crypto ikev2 keyring; crypto ikev2 profile; crypto ipsec
!  profile; interface Tunnel0 with `tunnel protection ipsec profile ...`.
!  The exact IOS syntax supported by the simulated Wan Chai router image must
!  be established in build week 8 and recorded. If the simulator cannot
!  complete the IOS end, the report states that the tunnel was configured on
!  the ASA and that the IOS end was documented but not demonstrated.
! --- What is explicitly NOT claimed for this tunnel -----------------
!  * No certificate-based IKEv2 authentication unless `show crypto ikev2 sa`
!    and the certificate chain both prove it.
!  * No GRE-over-IPsec, no DMVPN, no SSL VPN on the ASA. DMVPN and SSL VPN are
!    named by the standard but are not implemented here and must not appear in
!    a delivered-features list.
!  * No ASA failover pair and no clustering. The tunnel endpoints are single
!    devices and the report says so.
```

**Qualification 2 — the WireGuard half of the baseline's tunnel pair is not on the ASA, and this is correct.** The canonical baseline flags the issue itself: *"a Cisco device cannot terminate WireGuard."* It resolves it by either representing the Wan Chai peer with a third Ubuntu VM (`vpnz-wcwg01`) or documenting WireGuard as the remote-worker tunnel only and using IPsec on the ASA for the branch, requiring the group to choose one and record it. **This section presents the second option as the network-line position**: WireGuard is a Linux-side technology reported in the Linux line, and inside the Cisco line the branch tunnel is IPsec on the ASA. The choice must be recorded in the decision log, and the report must never state that a Cisco device terminates WireGuard.

#### 9.12.5 Hardening

```cisco
! ===== ASA HARDENING — VP-HQ-FW-01 =====
! --- administrative access: SSH only, from Z-MGMT only ---------------
username adm-net01 password <REDACTED> privilege 15
username adm-net02 password <REDACTED> privilege 15
username svc_monitoring password <REDACTED> privilege 5
!  [ASSUMPTION] The simulated image's `username` command may not support a hash
!  rather than a clear-text password. Where it does not, the value is still
!  never committed to Git and the limitation is recorded.
aaa authentication ssh console LOCAL
aaa authentication enable console LOCAL
aaa authorization command LOCAL
aaa accounting ssh console LOCAL
aaa accounting enable console LOCAL
aaa accounting command privilege 15 LOCAL
crypto key generate rsa modulus 2048
!  2048 is the minimum and 4096 is attempted; the actual modulus is read back
!  with `show crypto key mypubkey rsa`.
ssh version 2
ssh timeout 10
ssh scopy enable
! --- management access restriction -----------------------------------
!  The management interface is on VLAN 20 (Z-MGMT). It is reachable ONLY from
!  the management subnet; Telnet and the web UI are unused.
access-list ACL-MGMT-ACCESS-10 extended permit tcp 10.20.20.0 255.255.255.0 any eq ssh
access-list ACL-MGMT-ACCESS-10 extended permit tcp 10.20.20.0 255.255.255.0 any eq 6516
access-list ACL-MGMT-ACCESS-10 extended permit udp 10.20.20.0 255.255.255.0 any eq snmp
access-list ACL-MGMT-ACCESS-10 extended permit udp host 10.10.30.31 any eq syslog
access-list ACL-MGMT-ACCESS-10 extended deny   ip any any log warnings
ssh 10.20.20.0 255.255.255.0 mgmt
ssh 10.10.30.31 255.255.255.255 mgmt
http 10.20.20.0 255.255.255.0 mgmt
!  ASDM/HTTPS management is enabled only from Z-MGMT; the design of record is
!  CLI management, and ASDM is documented as available and unused. Where the
!  simulated image does not accept the `http` command it is recorded as
!  unavailable rather than worked around.
console timeout 5
banner motd ***************************************************************************
banner motd *  Vertex Peak Financial Technologies Limited - PROPERTY OF VERTEX PEAK   *
banner motd *  Authorised administrative access only. All access and all changes are  *
banner motd *  logged and auditable. Unauthorised access is prohibited.                *
banner motd ***************************************************************************
! --- logging and time ------------------------------------------------
logging enable
logging timestamp
logging trap informational
logging host inside 10.10.30.31
logging message 106023 level warnings
logging message 106100 level warnings
logging message 313001 level warnings
logging message 313004 level warnings
!  These four message IDs are the ASA's deny messages, explicitly set to
!  warnings so that a DENIED FLOW is visible in the syslog stream -- the
!  evidence the trust-boundary tests require.
! --- disabling unused features ---------------------------------------
!  The design disables, or documents as absent, every feature that is not part
!  of this build:
!   * No FirePOWER/SFR module (not modelled in the simulator).
!   * No ASA clustering, no active/standby failover pair (not modelled).
!   * No SSL VPN / AnyConnect and no webvpn / clientless SSL VPN.
!   * No DHCP server or relay on the ASA (DHCP belongs to the AD estate).
!   * No dynamic routing on the ASA (static routes only, as listed).
!   * No SNMPv1/v2c. Where this image supports only v2c, the baseline's
!     prohibition on community strings applies and the design records the gap
!     rather than configuring a community string.
!   * No `shun`. It is not modelled and is not claimed.
snmp-server enable traps snmp authentication linkup linkdown coldstart
snmp-server enable traps syslog
snmp-server host inside 10.10.30.31 version 3 svc_monitoring
snmp-server location "Vertex Peak HQ - perimeter"
snmp-server contact "IT Network Engineering Workstream"
```

#### 9.12.6 Verification

```text
VP-HQ-FW-01# show interface ip brief
Interface                  IP-Address      OK? Method Status                Protocol
GigabitEthernet1/1         198.51.100.1    YES CONFIG up                    up
GigabitEthernet1/2         10.10.50.2      YES CONFIG up                    up
GigabitEthernet1/3         10.10.90.1      YES CONFIG up                    up
Management1/1              10.20.20.32     YES CONFIG up                    up
Internal-Data0/0           unassigned      YES unset  up                    up
Virtual0                   127.1.0.1       YES unset  up                    up

VP-HQ-FW-01# show route
Gateway of last resort is 198.51.100.6 to network 0.0.0.0
C    10.10.50.0 255.255.255.248 is directly connected, inside
L    10.10.50.2 255.255.255.255 is directly connected, inside
C    10.10.90.0 255.255.255.0 is directly connected, dmz
L    10.10.90.1 255.255.255.255 is directly connected, dmz
C    198.51.100.0 255.255.255.248 is directly connected, outside
L    198.51.100.1 255.255.255.255 is directly connected, outside
C    10.20.20.0 255.255.255.0 is directly connected, mgmt
L    10.20.20.32 255.255.255.255 is directly connected, mgmt
S    10.10.10.0 255.255.255.0 [1/0] via 10.10.50.1, inside
S    10.10.30.0 255.255.255.0 [1/0] via 10.10.50.1, inside
S    10.10.40.0 255.255.254.0 [1/0] via 10.10.50.1, inside
S    10.10.80.0 255.255.255.0 [1/0] via 10.10.50.1, inside
S    10.70.0.0 255.255.255.0 [1/0] via 10.10.50.1, inside
S*   0.0.0.0 0.0.0.0 [1/0] via 198.51.100.6, outside

VP-HQ-FW-01# show access-list ACL-DMZ-OUT-10
access-list ACL-DMZ-OUT-10; 6 elements; name hash: 0x9a1c2b3d
access-list ACL-DMZ-OUT-10 line 1 extended permit tcp host 10.10.90.10 any eq https (hitcnt=96)
access-list ACL-DMZ-OUT-10 line 2 extended permit tcp host 10.10.90.21 any eq https (hitcnt=0)
access-list ACL-DMZ-OUT-10 line 3 extended permit tcp host 10.10.90.22 any eq https (hitcnt=0)
access-list ACL-DMZ-OUT-10 line 4 extended permit tcp host 10.10.90.25 any eq https (hitcnt=12)
access-list ACL-DMZ-OUT-10 line 5 extended permit tcp host 10.10.90.26 any eq https (hitcnt=0)
access-list ACL-DMZ-OUT-10 line 6 extended deny ip any 10.10.0.0 255.255.0.0 log warnings (hitcnt=3)
```

**What to look for.** Exactly one candidate default (`S*`) pointing **outside**; a second default on the inside interface would create routing ambiguity. Five static routes on the inside interface, one per internal prefix, and **no** default route on the inside interface. And **no dynamic routing protocol at all** — no `O`, no `D`, no `B` — so the ASA cannot be a redistribution point and cannot receive a rogue route; a reader expecting OSPF on the ASA must be told that its absence is intentional. In the ACL output, `hitcnt` on the permit lines proves the policy is actually being exercised: an ACL whose only non-zero counter is the deny line is a policy blocking everything, which is a configuration error presented as security, and this check must be run before the model is approved. A **non-zero** count on the deny line is **success**, because the test scenario deliberately attempts a DMZ-to-internal connection and expects it to fail.

| # | Test | Source → destination | Expected | Evidence |
|---|---|---|---|---|
| 1 | Published portal reachable | Internet → `https://portal.vertexpeak.example` (198.51.100.2:443) | **SUCCEED** | Client success; `ACL-OUTSIDE-IN-10` permit hitcnt; `show nat` untranslate_hits rising |
| 2 | Published web portal reachable | Internet → 198.51.100.3:443 | **SUCCEED** | As above |
| 3 | Published blog reachable | Internet → 198.51.100.4:443 | **SUCCEED** | As above |
| 4 | DMZ host NOT directly reachable | Internet → 198.51.100.3:22 | **FAIL** | Terminal-deny hitcnt; syslog deny to `vpnz-mon01` |
| 5 | Internal server NOT reachable from the Internet (TB-06) | Internet → 10.10.30.11, any port | **FAIL** | Terminal-deny hitcnt; syslog |
| 6 | DMZ cannot initiate toward internal servers (TB-04) | DMZ host → 10.10.30.11:445 | **FAIL** | `ACL-DMZ-OUT-10` deny-line hitcnt increment; syslog 106023 |
| 7 | DMZ cannot initiate toward management (TB-04) | DMZ host → 10.20.20.11:22 | **FAIL** | Deny-line hitcnt increment |
| 8 | DMZ may reach the Internet for patching (TB-13) | `vpnz-dmzrev01` → 192.0.2.53:443 | **SUCCEED** | Permit-line hitcnt; `show nat` translate_hits |
| 9 | DMZ management only via the jump host (TB-15) | `vpnz-dmzjump01` 10.10.90.27 → 10.10.90.21:22 **succeeds**; any other DMZ host → same target **fails** | **SPLIT** | Hitcnt increments only for the jump-host flow |
| 10 | IPsec site-to-site up | `VP-HQ-FW-01` ↔ `VP-WC-EDGE-01` | **SUCCEED** | `show crypto ikev2 sa` and `show crypto ipsec sa` with an established SA and non-zero encaps/decaps counters |
| 11 | Isolated lab cannot reach the DMZ (TB-09) | 10.70.0.50 → 10.10.90.21:443 | **FAIL** | Two independent reasons evidenced: no route, *and* the explicit deny in any policy the traffic would meet |
| 12 | VPN front door is the only inbound VPN path (TB-06) | Internet → 198.51.100.5 UDP 443/500/4500/1194 | **SUCCEED** on those four ports; **FAIL** on every other port at that address | Permit-line and terminal-deny hitcnts |

**The EtherType control-plane ACL, and what to do if the simulator rejects it.** TB-04 is absolute: the DMZ must never initiate toward the internal network, *for any protocol*. An interface ACL on the `dmz` enforces that for all IP traffic, since every DMZ-to-internal flow is evaluated against `ACL-DMZ-OUT-10` whose terminal line denies all IP. What an IP ACL cannot block is non-IP traffic, which is why a strict reading calls for an EtherType ACL on the inside interface as well.

```cisco
! ===== TRACK B / STRICTER FORM — EtherType ACL for TB-04 =====
!  An IP ACL cannot restrict non-IP EtherTypes. To enforce "the DMZ must never
!  initiate toward the internal network, for ANY protocol", an EtherType ACL on
!  the INSIDE interface is the correct construct: only the IP and ARP
!  EtherTypes permitted, everything else denied. Whether the simulated ASA
!  accepts this must be tested in build week 7; if it does not, the design
!  falls back to the IP ACL plus the security-level model, and the report
!  states that non-IP EtherTypes are not suppressed in the simulator.
access-list ACL-INSIDE-ETHERTYPE ethertype permit ip
access-list ACL-INSIDE-ETHERTYPE ethertype permit arp
access-list ACL-INSIDE-ETHERTYPE ethertype deny any
access-group ACL-INSIDE-ETHERTYPE in interface inside
```

Two further observations belong here because they are ASA-specific: the ASA participates in **no dynamic routing protocol**, so it cannot be a redistribution point and cannot receive a rogue route; and its **`show asp drop` output is deliberately not used as evidence**, because the baseline records that this level of detail is incomplete in Packet Tracer — drop-level evidence comes from `show access-list` hit counters and syslog, and the report should explain why.

> **Baseline correction item to record.** The baseline's §5.5 gives the ASA outside interface as `198.51.100.1/29` and separately gives the simulated provider edge as `203.0.113.1`, while §5.4 states the IPsec peer at `203.0.113.5`. This subsection follows §5.5 for the ASA's own interfaces and uses `203.0.113.5` as the far IPsec peer as §5.4 specifies; the outside default next hop (`198.51.100.6`) is taken from the DMZ public pool's own `/29` per §5.2. **A single adjacent-hop address for the ASA outside default route should be added to the baseline in its next revision**, because the current text supports two readings and a writer forced to choose has had to make a documented assumption here.

---

### 9.13 Management, Monitoring and Traffic Analysis

This subsection implements the named WSOS requirement `Use network discovery and traffic analysis tools such as CDP, NetFlow, Syslog, SNMP and tcpdump.` It is a *shall be able to* line, so the report must show each tool being **used**, not merely configured. Where the simulator cannot provide a named tool, that is stated and a substitute named — never quietly omitted.

#### 9.13.1 Discovery: CDP and LLDP

| Device class | CDP | LLDP | Reason |
|---|---|---|---|
| HQ core, access, branch/small-office switches and routers | **Enabled** (`cdp run`, `lldp run`) | Enabled | These are the devices whose adjacencies the project documents and verifies; discovery between them is the point |
| ASA `VP-HQ-FW-01` | Enabled on inside and dmz; **disabled on outside** | As supported | CDP/LLDP on an Internet-facing interface discloses model, software version and management address to anyone who can reach it — a small but real information-disclosure control at no cost |
| `VP-ISP-EDGE-01` | Enabled | Enabled | The provider device is simulated and inside the lab; discovery is useful for documenting the peering |
| Ports facing the isolated `STUDENT-LAB` segment | **Disabled** on VLAN 70 access ports | Disabled | The lab is the designated source of the project's deliberate-misuse tests; denying it discovery information is part of its isolation |

```cisco
cdp run
cdp timer 60
cdp holdtime 180
lldp run
interface gi0/1
 cdp enable
 lldp transmit
 lldp receive
interface GigabitEthernet1/1          ! ASA, outside interface only
 cdp disable
!  LLDP on the ASA is set with `lldp transmit` / `lldp receive` per interface
!  where the image supports it. The design does not rely on LLDP for any
!  verification, so its absence on the simulator is not a blocker.
```

```text
VP-HQ-CORE-01# show cdp neighbors detail
-------------------------
Device ID: VP-HQ-CORE-02.vertexpeak.fyp.lab
Entry address(es):
  IP address: 10.20.20.12
Platform: Cisco CISCO3925-CHASSIS,  Capabilities: Router Switch IGMP
Interface: GigabitEthernet1/0/1,  Port ID (outgoing port): GigabitEthernet1/0/1
Holdtime : 152 sec
Version :
Cisco IOS Software, Version 15.2
!  The exact version string is captured VERBATIM from the device on build day
!  and pasted into the report's version table. It is NOT typed from memory.
advertisement version: 2
Native VLAN: 999
Duplex: full
Management address(es):
  IP address: 10.20.20.12
-------------------------
Device ID: VP-HQ-EDGE-01.vertexpeak.fyp.lab
Entry address(es):
  IP address: 10.20.20.31
Platform: Cisco CISCO2901/K9,  Capabilities: Router
Interface: GigabitEthernet1/0/2,  Port ID (outgoing port): GigabitEthernet1/0
Native VLAN: 999
```

**What to look for.** `Native VLAN: 999` on every trunk neighbour — a `Native VLAN: 1` is a misconfiguration CDP has just detected for free, which is the concrete, non-decorative value of CDP here. The Platform line discloses the device model and is captured as evidence of the actual model in use, which is exactly what the baseline's version-capture discipline requires — and is also why CDP is disabled on the ASA's outside interface. The **documented vs observed topology comparison** is a deliverable of this subsection: a table listing every adjacency from `show cdp neighbors detail` on all sixteen devices beside the adjacency the design asserts, with any discrepancy marked as a finding. It is the cheapest available check that the design document and the built network agree, and it serves `The significance of accuracy, checking, and attention to detail in all working practices`.

#### 9.13.2 SNMPv3

**Design position: SNMPv3 with `authPriv` only. SNMPv1 and SNMPv2c are forbidden and no community string anywhere in the estate carries meaning**, which is citable to `Apply basic security configuration for control and data plane`, since a community string is a clear-text password sent in every request.

| Credential element | Value / policy | Reason |
|---|---|---|
| Security level | `priv` (authentication **and** encryption) | `authNoPriv` protects integrity but leaves counters and topology visible to a passive observer; `noAuthNoPriv` is equivalent to SNMPv1 |
| Authentication protocol | SHA (SHA-1 on this image; SHA-256 where supported) | MD5 authentication is deprecated for new deployments; the negotiated algorithm is read back from `show snmp user` and recorded |
| Privacy protocol | AES-128 | The image's strongest available; the actual value is recorded |
| User | `svc_monitoring` | A dedicated read-only identity matching the Microsoft line's service-account convention; not a shared account and not the interactive administration credential |
| Access view | `VIEW-FYP-RO` limited to `iso` | Read-only by construction, so a write is unavailable through the view and not merely unauthorised at the user level |
| Credential storage | Ansible vault and the group password manager; **never** Git | Consistent with the project's secret-handling rule; a committed credential invalidates the monitoring line's security claim |
| Trap set | linkdown, linkup, coldstart, warmstart, authentication, syslog | A deliberately narrow set; flooding a collector with every category destroys the signal the AI line needs |

`snmp-server user ... v3 auth sha ... priv aes 128` is an **[ASSUMPTION]** about what the Packet Tracer image accepts. If the simulator rejects SNMPv3, the correct action is **not** to fall back to a community string so a demonstration works. The correct action is to record the limitation as a finding (a simulator capability gap is legitimate academic content), keep the SNMPv3 configuration as the design position and real-equipment configuration, and provide the SNMP evidence by polling the Linux and Windows estate over SNMPv3 from `vpnz-mon01`. The report then states in one sentence that the SNMPv3 *design* applies to the network devices and that the *executed* proof of the credential model uses the server estate — a weaker claim than "the switches are monitored over SNMPv3", and the claim the evidence supports.

#### 9.13.3 NetFlow, and what this project does instead

**NetFlow is not implemented, and this is a documented limitation rather than a choice.** Packet Tracer does not support flow export; no configuration will produce a flow record from a simulated device, and because the WSOS names NetFlow explicitly the report must address the gap directly.

- **Track A (executed).** The traffic-analysis role is filled by three mechanisms that **do** work: **SNMPv3 counter polling** (interface in/out octets, errors and discards — the same byte counts NetFlow would give, without flow granularity); **Syslog** (event-level evidence including every deny with its 5-tuple, precisely the evidence the trust-boundary tests require); and **`tcpdump` on the Linux estate**, giving genuine packet-level capture at the two places that matter — the nftables egress pair and the DMZ reverse proxy.
- **Track B (documented, not executed).** The equivalent real-equipment configuration is given below, so the gap is a *platform* gap rather than a *design* gap.

```cisco
! ===== TRACK B — REAL EQUIPMENT ONLY. NOT EXECUTABLE IN PACKET TRACER. =====
! Classical NetFlow v9 export to the monitoring host vpnz-mon01
ip flow-export destination 10.10.30.31 2055
ip flow-export source Loopback0
ip flow-export version 9
ip flow-export template refresh-rate 20
ip flow-cache timeout active 1
ip flow-cache timeout inactive 15
! Per-interface activation, deliberately NOT global: flow accounting on every
! interface of every device would overwhelm a lab collector and would tell the
! group nothing about the boundaries that matter.
interface gi1/0
 ip route-cache flow
interface Vlan30
 ip route-cache flow
! --- Flexible NetFlow: the modern form a real deployment would use -----
flow record REC-FYP-IPV4
 match ipv4 protocol
 match ipv4 source address
 match ipv4 destination address
 match transport source-port
 match transport destination-port
 match interface input
 collect counter bytes long
 collect counter packets long
 collect timestamp sys-uptime first
 collect timestamp sys-uptime last
flow exporter EXP-FYP-MON01
 destination 10.10.30.31
 source Loopback0
 transport udp 2055
 template data timeout 60
flow monitor MON-FYP-IPV4
 record REC-FYP-IPV4
 exporter EXP-FYP-MON01
 cache timeout active 60
interface gi1/0
 ip flow monitor MON-FYP-IPV4 input
 ip flow monitor MON-FYP-IPV4 output
! Verification on real equipment: show flow exporter;
! show flow monitor MON-FYP-IPV4 cache format table; show flow record REC-FYP-IPV4
```

**How `tcpdump` complements it.** The combination is deliberate and each half covers the other's blind spot: SNMPv3 counters give per-interface volumes and error rates across the whole *simulated* topology, including segments where no Linux host exists (Kwun Tong, Macau, Wan Chai, the WAN links); `tcpdump` on `vpnz-nft01` (`VNET-EGRESS`/`VNET-WAN`) and `vpnz-dmzrev01` gives genuine packet-level detail on the segments where the real VM estate lives — headers, sequence numbers, retransmissions, TLS handshake failure reasons, ICMP unreachables and the exact 5-tuple of a denied flow; Syslog provides event-level, time-correlated records with the device's own opinion of why it acted.

```bash
# --- tcpdump recipes that produce report-ready evidence ----------------
# 1. Prove the isolated lab cannot reach the DMZ (TB-09).
#    Run on vpnz-nft01, on the interface facing the internal network.
sudo tcpdump -i ens192 -nn -tttt -c 20 \
  'src net 10.70.0.0/24 and dst net 10.10.90.0/24'

# 2. Prove a DMZ host cannot initiate toward the server VLAN (TB-04).
sudo tcpdump -i ens192 -nn -tttt -c 20 \
  'src net 10.10.90.0/24 and dst net 10.10.30.0/24'

# 3. Capture a TLS handshake for the certificate-warning evidence.
sudo tcpdump -i ens192 -nn -s 0 -w /srv/backup/pcap/$(date +%F)_tls_capture.pcap \
  'tcp port 443'

# 4. Write a bounded, human-readable capture for the report appendix.
sudo tcpdump -i ens192 -nn -tttt -c 50 -s 128 \
  'host 10.10.90.10 and tcp port 443' > /var/log/fyp/dump_portal_443.log
```

Each capture is stored under `07-evidence/` as `{date}_{host}_{what}.pcap`, and the `tcpdump` command line that produced it is quoted in the caption, because a capture without its command is not evidence.

#### 9.13.4 NTP and configuration backup

```cisco
! --- NTP client configuration (already in the §9.5 template) ---------
clock timezone HKT 8
ntp authentication-key 1 md5 <REDACTED-NTP-KEY>
ntp authenticate
ntp trusted-key 1
ntp server 10.10.30.11 key 1 prefer
ntp server 10.10.30.12 key 1
ntp access-group peer ACL-NTP-PEERS
ip access-list standard ACL-NTP-PEERS
 permit 10.10.30.11
 permit 10.10.30.12
 deny   any log
!  Correct time is a security control: Kerberos fails beyond five minutes of
!  skew and no log correlation across sixteen devices and nineteen VMs is
!  possible without a common clock. Packet Tracer's time model is simulated,
!  so `show ntp status` on a simulated device cannot be accepted as evidence
!  that the device synchronised. What the project evidences instead is (a) the
!  NTP client configuration and peer ACL, and (b) the authoritative time chain
!  on the real estate: `w32tm /query /status` on a Windows guest and
!  `chronyc sources -v` on a Linux guest, both pointing at 10.10.30.11.
```

```bash
# --- Configuration backup, Mechanism A: TFTP pull --------------------
# On vpnz-mon01, where the TFTP root is /srv/tftp (0755). The IOS side
# initiates the copy; the server serves the file.
!   VP-HQ-CORE-01# copy running-config tftp://10.10.30.31/VP-HQ-CORE-01.cfg
sudo -u git -H git -C /srv/tftp/archive add VP-HQ-CORE-01.cfg
sudo -u git -H git -C /srv/tftp/archive commit -m "config pull $(date -Iseconds) VP-HQ-CORE-01"

# --- Mechanism B: configuration-as-code in Git -----------------------
# Every device's intended configuration is maintained as a text file in
# 03-build/packet-tracer/configs/ (VP-HQ-CORE-01.cfg ... VP-ISP-EDGE-01.cfg,
# sixteen files) and committed. This is the reviewable, diffable artefact --
# it is NOT produced by logging in to the device, because Packet Tracer has no
# SSH server reachable from external tooling and no API.
ls -1 03-build/packet-tracer/configs/
```

**The mandatory honest statement.** The baseline is explicit and this chapter repeats it in substance: **no Ansible playbook and no PowerShell script ever logged in to a Packet Tracer device.** Packet Tracer exposes no SSH server to external tooling and no API. Track A treats the configuration text files in Git as the source of truth and applies them through Packet Tracer's own CLI and save workflow; Track B writes and tests `08-collect-network-configs.yml` and `Backup-NetworkDeviceConfig.ps1` against the Linux and Windows estate with a documented gap analysis naming exactly what a real device would require (`netmiko`/`napalm` over SSH, or a vendor API). **Claiming that a playbook configured a Packet Tracer device would be fabrication and is the easiest way for this project to lose credibility.**

#### 9.13.5 Interfaces to the Automation and AI lines

This subsection produces the data; it does not consume it.

| Artefact produced here | Consumed by | How |
|---|---|---|
| Syslog from all sixteen devices to `vpnz-mon01` | Automation (line 10) and AI Network Management (line 11) | Loki stores it, Grafana queries it, and the AI agent's `get_active_alerts` and `get_auth_failures` read-only tools derive from it |
| SNMPv3 counters and link-state traps | AI Network Management | The `get_interface_stats` read-only tool polls SNMPv3 and reports counter and error deltas; the baseline's capability demonstration #1 (interface errors on `VP-HQ-DSW-A02 gi0/1`) depends on this path |
| Device configuration text files in Git | Network Automation | `08-collect-network-configs.yml` and `Backup-NetworkDeviceConfig.ps1` collect and archive them; drift detection compares a running configuration against its Git version |
| CDP neighbour output | Documentation and verification | The observed-topology table is a verification artefact, not an automation input |
| Trust-boundary deny events with 5-tuples | AI Network Management, capability demonstration #2 (brute-force detection) | The agent correlates a failed-login burst with the source subnet and proposes the ACL check; the baseline's example uses a burst from `10.10.70.50`, in the isolated lab, which "should not be able to reach the DMZ at all" — citing TB-09 |

The read-only constraint applies to everything in this table: the AI agent may **poll** these sources and **propose** a change in diff form, and may never write to a device. That boundary is defined in the AI line and is not restated here.

---

### 9.14 High Availability and Resilience at the Network Layer

#### 9.14.1 What is genuinely redundant

| Layer | Mechanism | Failure it survives | Evidence |
|---|---|---|---|
| HQ first-hop gateway | **HSRP, four groups**; `CORE-01` active at 150 with preemption and interface tracking, `CORE-02` standby | Loss of `VP-HQ-CORE-01`, of one of its trunk links, or of its access links (via tracking) | §9.7.3 failover sequence; `show standby brief` before and after |
| HQ Layer-2 topology | **Dual-homed access switches with RSTP**; one uplink per access switch in a discarding alternate role | Loss of one uplink, loss of one core switch | `show spanning-tree` showing the alternate port; link-pull test |
| HQ internal routing | **OSPF with two core speakers advertising the same VLAN subnets** | Loss of either core; the other re-advertises and takes over | `show ip ospf neighbor` after a core shutdown |
| HQ egress / DMZ boundary | **Nftables HA pair with Keepalived VRRP** (`vrid 51`, VIP 10.10.50.10) — genuinely configured Linux | Loss of `vpnz-nft01`; the VIP moves to `vpnz-nft02` | Keepalived failover capture (Linux line) |
| Internet transit | **Two eBGP sessions** (AS 65000 primary, AS 65002 alternate) with local-preference selection | Loss of one provider session | §9.10.4 failover demonstration |
| Inter-site routing | **OSPF over the Kwun Tong WAN1 link**; Macau on EIGRP AS 100 | Loss of one WAN link isolates that site only | Traceroute and route-table evidence |
| Branch identity | **Kwun Tong RODC** (`vpnz-brdc01`) with a cached credential set (Microsoft line) | An HQ WAN outage still permits branch logon | Microsoft line, cited here because it changes the *consequence* of a WAN failure |

#### 9.14.2 What happens on the failure of each major component

| Component fails | Immediate effect | Designed behaviour | Residual impact, stated honestly |
|---|---|---|---|
| `VP-HQ-CORE-01` | Stops forwarding; HSRP hellos stop on four SVIs | Within the 3-second hold time `CORE-02` takes all four groups and STP reconverges to it as root; all four access switches retain connectivity | Slight congestion: all HQ inter-VLAN traffic now traverses `CORE-02` alone. No user action is required and the default gateway is unchanged |
| `VP-HQ-CORE-02` | Standby gateway and RSTP secondary root lost | No failover occurs — `CORE-01` was already active and primary; users see no change | **There is now no gateway redundancy at HQ.** A subsequent `CORE-01` failure is unmitigated. This is the design's most important residual exposure |
| Both HQ core switches | Complete loss of HQ internal routing and all HQ gateways | Nothing; there is no third device | **Total HQ outage.** The baseline's non-goal "no high availability at the hardware layer" means no chassis-level protection is designed, and the report must not imply otherwise |
| One HQ access-switch uplink | STP blocks/unblocks on the affected trunk | The alternate uplink becomes the root port; the switch stays reachable | A brief interruption of the affected VLAN during reconvergence — a simulation artefact in Packet Tracer |
| An entire HQ access switch | That switch's users lose service | No failover: the switch is a single point for its own ports | Users on that floor lose connectivity until the switch is replaced. Documented, not mitigated — the design does not include switch-level stacking (Packet Tracer does not support it) |
| `VP-HQ-EDGE-01` | HQ loses its WAN edge, its eBGP sessions, its OSPF default origination and **the single redistribution point** | **Nothing fails over.** There is no second edge router | Kwun Tong keeps OSPF among its own subnets but cannot reach HQ; Macau is isolated because EIGRP's only HQ speaker is gone; the DMZ loses its Internet path. **This is the largest network-layer resilience gap in the design and it is stated explicitly rather than glossed** |
| One eBGP session | The provider's prefixes are withdrawn on that session | The alternate session's paths are promoted automatically by the best-path algorithm; no configuration change on the enterprise edge | The return path may change while the enterprise's own advertisement continues on both sessions |
| Both eBGP sessions | HQ loses Internet reachability | Nothing | Published DMZ services become unreachable from the simulated Internet; internal service is unaffected |
| `VP-HQ-FW-01` (ASA) | The DMZ loses its gateway; the perimeter loses publication and IPsec | **No failover.** The baseline excludes ASA failover pairs and the simulator does not model them | All published services become unreachable from outside; the IPsec tunnel to Wan Chai drops. Internal traffic (filtered by the nftables pair) continues |
| One nftables pair member | The Keepalived VIP moves | Genuine failover, evidenced by a captured VIP transition | A short interruption during the VRRP transition |
| **Both** nftables members | HQ loses the only path from `Z-USER`/`Z-SERVER` to the Internet | Nothing — this is a designed chokepoint | Internal-to-internal traffic continues; all egress stops. A deliberate consequence of the single-egress architecture |
| Kwun Tong WAN1 link | The branch loses OSPF adjacency and HQ reachability | The branch keeps functioning locally: workstations retain their 8-hour DHCP leases and the RODC serves logon and DNS | No new DHCP leases and no new authentication after the cached-credential window; branch file access is to the local cache only. **This is why the Microsoft line authorises an RODC at the branch, and the Cisco line's WAN design is only defensible in combination with it** |
| Macau WAN link | EIGRP adjacency drops; Macau loses all HQ routes | Macau retains its own LANs only (VLAN 120, 121) | The four Macau staff have local connectivity and nothing else. There is no second path and none is designed |
| Wan Chai IPsec tunnel | Wan Chai loses HQ reachability | The WireGuard path (Linux line) is the alternative transport, and the baseline requires the group to record which mechanism is authoritative | The report must not claim tunnel redundancy unless both transports were tested and both work |
| A TCP/IP stack failure in the simulator | Symptom-specific | Diagnosed with the §9.16 catalogue | Recorded as a finding with the simulator build, which is legitimate academic content |

#### 9.14.3 What the design does **not** provide

This list exists so that availability claims cannot be read as broader than they are: (1) **no LACP/PAgP EtherChannel** — simulator limitation plus the project's own constraint (§9.6.4); (2) **no GLBP** — named by the standard, not supported faithfully, not used (§9.7.2); (3) **no ASA failover pair or clustering** — not modelled (§9.12.1); (4) **no redundant WAN edge router** — a single `VP-HQ-EDGE-01` carries the WAN, both eBGP sessions and the sole redistribution point; (5) **no redundant branch WAN link** — Kwun Tong, Macau and Wan Chai each have one transport; (6) **no MPLS, SD-WAN, DMVPN or GRE** — the standard names DMVPN and GRE, neither is implemented, and neither may appear in a delivered-features list; (7) **no hardware redundancy of any kind** — no dual power supplies, no dual supervisors, no stacking, this being the project's own non-goal; (8) **no QoS** — no marking, queuing or shaping, so voice quality is claimed only at the level of VLAN separation and DHCP option provisioning (§9.2.4); (9) **every figure in this subsection taken from Packet Tracer is a simulation artefact**, not a measured real-world availability or convergence figure.

---

### 9.15 Evidence and Screenshot Checklist

The HDTN topic sheet requires students to *"produce well-organized documentation that includes all findings, manuals, steps, screen captures, verifications, and references related to the project."* **The WSOS 2026 contains no requirement for screen captures** — the strings `screen`, `capture`, `screenshot` and `evidence` occur zero times — so the obligation behind this checklist is the topic sheet's and the attribution must be made correctly in the report. Screenshots are stored under `07-evidence/` as `{date}_{host}_{what}.png`, and every caption uses the project template `Figure {n}: {what} — {host} — {command or action} — {date}`.

**Platform and inventory:** `show version` in full on **each of the sixteen devices**, with the exact model and image string transcribed into the version table (§9.4.1) — the baseline's mandatory build-day capture ([O-02]); a physical-view screenshot of `05-full.pkt` showing all sixteen devices (Figure 9.1); a logical-view screenshot with the addressing schema displayed; a directory listing of `01-l2l3-core.pkt` … `05-full.pkt` as evidence of staged progress; and the Packet Tracer build number (Help → About) to pin the simulator version actually used.

**Base configuration and hardening:** the base section of `show running-config` (hostname, domain name, secret, users, AAA) on `VP-HQ-CORE-01` and `VP-HQ-EDGE-01`; `show ip ssh` and `show crypto key mypubkey rsa`; `show run | include banner` plus the login banner as displayed at connection time; `show logging` on the device with the corresponding received line on `vpnz-mon01`; `show line vty 0 4` and `show line console 0`; `show ip access-lists ACL-MGMT-IN-10` with hit counters after a successful and a failed management attempt; and `show snmp user` / `show snmp group` plus the collector side showing an SNMPv3 poll — with the limitation note if the simulator refuses SNMPv3.

**VLANs, trunks and RSTP:** `show vlan brief` on both cores and **all four** HQ access switches; `show interfaces trunk` on both cores and each access-switch uplink, with the native-VLAN column reading `999` everywhere; `show interfaces status` showing the VLAN 999 shutdown ports; `show spanning-tree vlan 40` on `VP-HQ-CORE-01` proving it is root at priority 4096; `show spanning-tree vlan 40` on `VP-HQ-DSW-A01` proving the root and alternate roles; `show spanning-tree summary`; a **link-pull test** with `show spanning-tree` before, the link shut, and after; a **port-security test** (a second MAC on a protected port) with `show port-security interface`; a **BPDU-guard test** with the port entering `err-disabled` and the corresponding syslog line; a **DHCP-snooping test** with a rogue DHCP server on an access port and the blocked offer; and a root-guard test showing the port entering root-inconsistent, where demonstrable.

**Inter-VLAN routing and HSRP:** `show ip interface brief` on both cores; `show standby brief` on **both** cores; `show standby vlan 40` in full; a **three-screenshot failover sequence** (before, failure injected, after); workstation `ipconfig` before and after the failover proving the default gateway did not change; a continuous ping spanning the failover with the interruption visible and labelled as a simulation artefact; and `show standby brief` showing the VIP returning to `CORE-01` after recovery, as preemption proof.

**OSPF:** `show ip ospf neighbor` on `VP-HQ-CORE-01`, `VP-HQ-CORE-02`, `VP-HQ-EDGE-01` and `VP-BR-EDGE-01`, all FULL; `show ip ospf interface brief` on `VP-HQ-CORE-01`; `show ip ospf database` on `VP-HQ-EDGE-01` showing Router LSAs, the single Network LSA and the Type-5 externals **with tags visible**; `show ip route ospf` on `VP-HQ-EDGE-01` and `VP-BR-EDGE-01`; an **adjacency-failure demonstration** (authentication key mismatch, no adjacency, `debug ip ospf adj` as the diagnostic, then repaired); DR/BDR proof from `show ip ospf neighbor`; and a `traceroute` from an HQ server VLAN host to a Kwun Tong host.

**EIGRP:** `show ip eigrp neighbors` on `VP-MO-EDGE-01` and `VP-HQ-EDGE-01` showing exactly one neighbour with queue count zero; `show ip eigrp topology` with every entry `P` and with `10.20.20.0/24` and `10.70.0.0/16` **absent**; `show ip route eigrp` on `VP-MO-EDGE-01` with administrative distance 90 visible; `show ip protocols` on `VP-HQ-EDGE-01`; a **stuck-in-active** demonstration with `show ip eigrp topology active` and the recovery, where reproducible; and an authentication test with a key mismatch leaving the relationship unformed, then repaired.

**BGP:** `show ip bgp summary` on `VP-HQ-EDGE-01` with both sessions Established and a prefix count; `show ip bgp` in full with the best-path markers explained line by line in the caption; `show ip bgp neighbors 10.10.100.2 advertised-routes` showing **exactly two prefixes**; `received-routes` and `routes` for comparison; `show ip route bgp` showing administrative distance 20; a **failover pair** of `show ip bgp summary` and `show ip route bgp` before and after the primary session is shut; a **prefix-filter demonstration** with an unauthorised prefix offered inbound and the rejection evidenced; `show route-map RM-EDGE-OUT` and `show ip prefix-list PL-EDGE-ANNOUNCE`; and a **session-failure demonstration** (incorrect `remote-as` or password) with the resulting `show ip bgp summary` state, then repaired.

**Redistribution:** `show ip route 10.10.120.0` on `VP-HQ-CORE-01` — `type extern 2`, **tag 200**, advertised by `10.255.0.21`; the same prefix on `VP-BR-EDGE-01`; `show ip route 10.10.30.0` on `VP-MO-EDGE-01` — `distance 170`, `type external`, **tag 100**; `show route-map RM-OSPF-TO-EIGRP` and `show route-map RM-EIGRP-TO-OSPF` with match counters; **four screenshots** for the deliberate-misconfiguration experiment (tag removed, `Route tag 0` observed, repair, tag restored); `traceroute` in both directions with the hop sequence annotated; and proof of absence — `show ip eigrp topology` on `VP-MO-EDGE-01` showing no `10.20.20.0/24` and no `10.70.0.0/16`.

**ASA:** `show version` with the model and image string transcribed; `show interface ip brief` and `show route`; `show run interface`; `show run object` and `show run object-group`; `show access-list ACL-OUTSIDE-IN-10` and `show access-list ACL-DMZ-OUT-10` **with hit counters after the traffic tests**; `show nat` showing all three NAT forms; `show logging` showing a denied flow with its 5-tuple and the matching line on `vpnz-mon01`; `show crypto ikev2 sa` (or the IKEv1 equivalent if the fallback was taken) and `show crypto ipsec sa` with an established SA, non-zero packet counts and counters incrementing during a tunnel ping; **one screenshot per row of the §9.12.6 traffic-test matrix** (twelve rows); and a `tcpdump` capture on `vpnz-dmzrev01` showing a DMZ-to-internal attempt being dropped, correlated with the ASA log line.

**Management, monitoring and traffic analysis:** `show cdp neighbors detail` on every device plus the observed-topology table built from it; `show lldp neighbors` where supported; `show ntp status` and `show ntp associations` on one device plus `chronyc sources -v` on `vpnz-mon01` and `w32tm /query /status` on a Windows guest; the TFTP configuration pull with the received file on `vpnz-mon01` and the Git log of the configuration archive showing timestamped pull commits; the four `tcpdump` captures from §9.13.3 with their command lines quoted in the captions; and a screenshot of the NetFlow limitation note cross-referenced to its Track B configuration block.

**Resilience:** core-switch failure with `show standby brief` and `show spanning-tree` before and after; edge-router failure with `show ip bgp summary`, `show ip route` and a `traceroute` before and after, with the consequences documented honestly; a Kwun Tong WAN-link pull with `show ip ospf neighbor` before and after and a branch workstation's connectivity status; and the declared-gaps list from §9.14.3 reproduced in the report's limitations chapter with a page reference.

---

### 9.16 Common Failure Modes and Troubleshooting

This subsection exists because **Troubleshooting is 25 % of the WSOS 2026** and because the standard's own line `Use network package inspection, connectivity checking tools etc to troubleshoot and identity problems in a network.` `[sic]` makes diagnostic method a first-class deliverable. Each row is a test the group can execute, observe, diagnose and document, and each is intended to be executed at least once so that the evidence is real.

| # | Problem | Symptom | Diagnostic commands | Likely cause | Resolution |
|---|---|---|---|---|---|
| 1 | **Trunk not forming** | Hosts cannot reach their gateway; `show interfaces trunk` shows `access` or `not-trunking` | `show interfaces <port> switchport`, `show interfaces trunk`, `show interfaces status` | One end set to `switchport mode trunk` and the other left at `dynamic auto`/`access`; `nonegotiate` on one side only; encapsulation mismatch | Set `switchport mode trunk` on **both** ends, `switchport nonegotiate` on both, and verify `switchport trunk encapsulation dot1q`. Both ends are always statically trunked here, so this means a line was missed |
| 2 | **VLAN not allowed on the trunk** | The VLAN exists and its port is assigned, but no host in it can communicate off-switch | `show interfaces trunk`, `show vlan brief`, `show interfaces switchport` | The `switchport trunk allowed vlan` list omits the VLAN — a common outcome of typing the list without `add`, which **replaces** rather than appends | Add with `switchport trunk allowed vlan add <id>`. Omitting `add` replaces the whole list and silently breaks other VLANs |
| 3 | **Native VLAN mismatch** | `%CDP-4-NATIVE_VLAN_MISMATCH`; management traffic on one side reaches an unexpected segment; STP logs PVID incompatibility | `show cdp neighbors detail` (Native VLAN), `show interfaces trunk` (Native vlan), `show spanning-tree` | One end set to native VLAN 999 and the other left at the default 1 | Set `switchport trunk native vlan 999` on both ends. This is why the design uses CDP as a checking tool; the log line from this fault is worth capturing deliberately as evidence |
| 4 | **Spanning-tree loop** | Broadcast storm; CPU load; MAC table thrashing; total loss for users; rapidly rising output rates | `show processes cpu sorted`, `show spanning-tree`, `show interfaces counters`, `show mac address-table count`, `show spanning-tree inconsistentports` | A redundant link forwarding in two places: a port without PortFast where needed, a BPDU-filtered port, a trunk missing a VLAN from its allowed list so STP sees a different topology on each trunk, or Root Guard on the wrong port | Emergency action first: shut one redundant link to stop the storm. Then find the port forwarding when it should not be and correct it. **A link missing one VLAN from its allowed list on one side only is the subtle version and is why the allowed lists are explicit** |
| 5 | **HSRP not preempting** | The recovered core never takes the virtual IP back; `show standby brief` shows it `Standby` indefinitely despite priority 150 | `show standby brief`, `show standby vlan 40`, `show run interface vlan 40` | `standby preempt` absent on the recovering device; or the 30-second preempt delay exceeds the observation window; or a tracked interface is genuinely still down so the effective priority is below 100 | Verify `standby 2 preempt delay minimum 30` is present; read the effective priority in `show standby` (the `Priority 150 (configured 150)` line shows the value after tracking decrements); confirm every tracked interface is up. If a tracked interface is down, the tracking is working — fix the link, not the HSRP |
| 6 | **Both HSRP routers active** | Duplicate replies; intermittent connectivity; the ARP entry flipping between two MAC addresses | `show standby brief` on both devices, `show standby` detail, `debug standby events` | A Layer-2 problem stopping hellos reaching each other — most often the two SVIs are in the HSRP group but **not in the same VLAN's broadcast domain** (a trunk not carrying that VLAN on one side); or an HSRP authentication mismatch; or differing group numbers | Confirm the VLAN is trunked between both cores and to the access switches; confirm the four group numbers (1/2/3/4 on VLAN 30/40/70/80) and the authentication strings match; compare the two devices' `show standby` output, each of which shows the other's view |
| 7 | **OSPF adjacency stuck in `INIT`** | `show ip ospf neighbor` shows `INIT`; no routes exchanged | `show ip ospf neighbor`, `debug ip ospf adj`, `show ip ospf interface <int>`, `show run interface <int>` | **One-way** hello receipt: the local router hears the neighbour but not vice versa. Causes here: an ACL dropping protocol 89, one-way reachability across a trunk, a broken return path, or authentication on one side only | Verify bidirectional Layer-2 reachability first (`show mac address-table` on the shared segment), then check `ip ospf authentication` and key IDs on both sides, then look for an ACL filtering OSPF (protocol 89) |
| 8 | **OSPF adjacency stuck in `EXSTART`/`EXCHANGE`** | The state does not progress; the log may show retransmissions | `show ip ospf neighbor`, `show ip ospf interface <int>`, `ping <neighbour-ip> size 1500 df-bit` | **MTU mismatch**: the database-description exchange requires a common MTU and one side is larger | Make the MTUs identical (`ip mtu`). A large do-not-fragment ping fails if the MTU is the cause |
| 9 | **OSPF adjacency flaps** | Neighbours repeatedly reach FULL then drop; `%OSPF-5-ADJCHG` repeats | `show ip ospf neighbor` (uptime resetting), `show log`, `show ip ospf interface` (timers), `show interfaces` (errors, CRC) | Mismatched hello or dead timers; a physical-layer problem resetting the adjacency; a duplex mismatch; one side's timer tuned and the other's left at default | Match timers explicitly on both sides. If timers match, examine interface error counters — which are also the input to the AI line's first capability demonstration |
| 10 | **Adjacency FULL but the route is missing** | `show ip ospf neighbor` is healthy, yet a prefix never appears | `show ip route ospf`, `show ip ospf database`, `show run \| section router ospf`, `show ip ospf interface brief` | The prefix's interface is not participating: no `ip ospf 1 area 0` statement, or `passive-interface default` in force with the interface never un-passived, or the wrong area | Add `ip ospf 1 area 0` to the interface, or `no passive-interface <int>` where an adjacency is required. `show ip ospf interface brief` lists exactly what participates and is the fastest diagnostic |
| 11 | **EIGRP neighbour stuck or not forming** | `show ip eigrp neighbors` is empty or the neighbour flaps | `show ip eigrp neighbors`, `show ip eigrp interfaces`, `debug eigrp packets hello`, `show run interface <int>` | AS mismatch; K-value mismatch; authentication key mismatch or missing; **the interface is passive**; or mismatched primary subnet addresses on the shared link | Compare `show ip protocols` on both devices (AS and K-values), compare the key-chain name and key string, verify `no passive-interface` on the WAN interface, and verify both interfaces are in the same `/30` |
| 12 | **EIGRP route stuck in Active** | `show ip eigrp topology` shows `A` for a prefix; `%DUAL-3-SIA` may appear; the route eventually drops | `show ip eigrp topology active`, `show ip eigrp topology <prefix>`, `show ip eigrp neighbors` (Q Cnt), `show log` | The successor was lost and no feasible successor exists, so the router queries neighbours that cannot answer: an interface flapping during the query, a neighbour that is itself querying, a lost path with no alternative (this design's normal case — Macau has one path), or an unreachable neighbour | If the cause is a flapping link, fix the link. If it is genuine loss of the only path, the route *should* go Active — the finding is the transition and its timing. Here the honest finding may be "the route went Active for N seconds because there is no feasible successor and no second path: the design has no EIGRP redundancy" |
| 13 | **BGP session will not establish** | `show ip bgp summary` shows `Active`, `Connect`, `OpenSent` or `Idle`; prefix count zero | `show ip bgp summary`, `show ip bgp neighbors <ip>`, `debug ip bgp <ip>`, `show tcp brief \| include 179`, `ping <neighbour-ip>` | **`Active`** — failing to open TCP 179: no route to the neighbour, an ACL blocking 179, or a wrong `remote-as`. **`OpenSent`** — TCP is up but the OPEN was rejected: an AS mismatch or a BGP password mismatch. **`Idle`** — administratively shut or in hold-down after repeated failures | Work outward: `ping` first (failure means routing or ACL, not BGP); then `show tcp brief` (is the TCP connection attempted at all?); then verify `remote-as` matches the neighbour's configuration; then compare the password. `show ip bgp neighbors <ip>` shows the last error and notification — read that first |
| 14 | **BGP session up but no prefixes learned** | `show ip bgp summary` shows Established with a prefix count of **0** | `show ip bgp neighbors <ip> routes`, `received-routes`, `show route-map RM-EDGE-IN-PRIMARY`, `show ip prefix-list PL-EDGE-IN-PRIMARY` | The inbound route map matched nothing, the prefix list is wrong, or the neighbour is sending only its `network`-originated routes and the far side's `network` statement has no matching route in its table | On the far side, verify the `network` statement has a matching route (`show ip route <prefix>`) — a BGP `network` statement announces nothing unless a route to that prefix already exists. On the near side, check the inbound prefix list against `received-routes`, which requires `neighbor ... soft-reconfiguration inbound` — the reason to enable it during the build despite the memory cost |
| 15 | **BGP session up but filters reject everything** | `%BGP-4-INVALID_PREFIX` or an inbound prefix-limit warning; the prefix count is below expectation | `show ip bgp summary`, `show log \| include BGP`, `show ip prefix-list`, `show route-map` | An inbound prefix list too narrow, or a terminal `deny` matching more than intended, or `maximum-prefix` exceeded (here meaning the provider sent more than 100/200 prefixes) | Read the log for the specific rejection reason, then adjust the list deliberately and re-check `show ip bgp`. Record whether the rejection was correct behaviour (the design *wants* unexpected prefixes rejected) or a configuration error |
| 16 | **Redistribution loop / suboptimal path** | Traffic takes a two-device round trip; `traceroute` shows a repeated hop; a prefix appears in the OSPF database both internally and as a Type-5 external | `show ip route <prefix>` (look for the tag), `show ip ospf database`, `show ip eigrp topology`, `traceroute` in both directions | A missing or incorrect route tag; a prefix present in both protocols with the *internal* form winning; mutual unfiltered redistribution; or a second redistribution point from a stray `redistribute` statement | Verify the tag matches the design (`100` out of OSPF, `200` out of EIGRP) and that the route maps end in an explicit `deny`. Run `show run \| include redistribute` on every router — a ten-second check for a second redistribution point. Then re-run the §9.11.5 verification set |
| 17 | **ASA ACL not matching** | Traffic expected to be permitted is dropped; the expected line's hit count stays zero while the terminal deny increments | `show access-list <name>` (hitcnt per line), `packet-tracer input <if> <proto> <src> <sport> <dst> <dport> detailed`, `show logging` | Line order — a broader deny above a specific permit; the wrong interface or direction; an object group not resolving as expected; or traffic arriving on a different interface than assumed | Use `packet-tracer`: it walks the ASA's decision path in order and names the exact matching line, far faster than reasoning about it. Then reorder so specific permits precede general denies. **Every ACL here is written specific-first with an explicit terminal deny for exactly this reason** |
| 18 | **ASA NAT ordering / NAT not applying** | Traffic passes the ACL but arrives with the wrong source address; the return path fails; `show nat` shows a hit on the wrong rule | `show nat`, `show nat detail`, `packet-tracer` (it reports the NAT decision), `show run nat` | Manual NAT (Section 1) is evaluated before Auto NAT (Section 2), and this design's exemption rules are Manual NAT precisely so they win. An exemption written as Auto NAT could be translated by a dynamic PAT rule first | Verify from `show nat` which section and sequence number actually matched; if the wrong rule matched, move the intended rule to Manual NAT or to a lower sequence within its section. Confirm with `packet-tracer`, which reports the translation explicitly |
| 19 | **ASA security-level confusion** | DMZ-to-inside traffic is permitted by no ACL yet still arrives; or inside-to-DMZ is unexpectedly blocked | `show interface` (security levels), `show access-list`, `packet-tracer`, `show run interface` | The security-level model permits higher→lower by default and denies lower→higher unless an ACL exists. A designer who assumes "no ACL means denied" will be wrong in one direction and right in the other | Apply an **explicit** ACL in both directions and rely on neither the implicit permit nor the implicit deny for any boundary the report must evidence. This design does exactly that for TB-04 and TB-06 and states that it relies on the implicit rule only for inside→outside and dmz→outside |
| 20 | **Traffic dropped by routing, not by policy** | A flow fails and the ACL hit counters do not change at all | `show route <destination>` on the ASA and interim routers, `traceroute`, `packet-tracer` | No route: the ASA's static routes cover five internal prefixes and there is deliberately no inside default route, so a prefix added to the design but not here is unreachable — and the symptom looks exactly like a firewall denial | Check the routing table **before** the ACL. "No route" and "denied" produce the same user-visible symptom and completely different fixes, and distinguishing them is among the most valuable diagnostics in this catalogue |
| 21 | **Duplicate OSPF router ID** | Neighbours form then one drops; `%OSPF-4-DUP_RTRID_NBR` or an "OSPF router with the same ID" error | `show ip ospf neighbor`, `show log \| include RTRID`, `show ip ospf` | Two devices configured with the same router ID — here most likely a copy-paste that left `router-id 10.255.0.11` on a second device | Set the correct loopback-derived router ID on the offending device and reset OSPF on **both** devices (`clear ip ospf process`), then re-verify. This is why router IDs are taken from the loopbacks rather than typed freehand |
| 22 | **HSRP interface tracking not working** | A core loses its uplink but stays HSRP active, creating a black hole: users' traffic goes to a gateway that cannot forward it | `show standby vlan 40` (Track interface lines and state), `show run interface vlan 40` | The `standby <grp> track <interface>` statements were omitted, or they track an interface not on the forwarding path (for example a loopback, which never goes down) | Track the **uplink and trunk interfaces that carry the traffic**, with a decrement large enough to drop the effective priority below the standby's. Verify by shutting the tracked interface and observing the priority fall in `show standby` — tracking that has never been tested this way is unproven |
| 23 | **`err-disabled` port with no obvious cause** | A previously working access port shows `err-disabled` and carries no traffic | `show interfaces status err-disabled`, `show port-security interface <int>`, `show log \| include err-disable`, `show errdisable recovery` | BPDU Guard triggered (someone connected a switch or an AP); a port-security violation; link-flap detection; or a DHCP-snooping rate-limit violation | Read the reason from `show interfaces status err-disabled` first — it names the trigger. Then correct the cause and recover the port (`shutdown` / `no shutdown`). **Deliberately not configuring `errdisable recovery` is a design decision: automatic recovery would erase the evidence that the violation happened** |

**Two diagnostic principles worth stating in the report**, because they are what the troubleshooting domain really tests: (1) **work from the layer that is cheapest to test** — before reading a firewall ACL, ping; before reading a routing table, check the interface state; before debugging BGP, confirm TCP 179 is reachable. Most of the entries above are resolved faster by knowing where in the stack to look than by knowing more commands. (2) **A denial and a missing route look identical to the user** — item 20 exists because this is the most common diagnostic error in a segmented design, and the fix (add the route, or permit the flow) is completely different. The report should state that its own test procedure always checks the routing table before the policy.

---

### 9.17 Findings

This subsection is a template for recording observed against designed behaviour. Every entry in §9 is expected to produce at least one finding, and the project requires that **findings are recorded even when the result is unremarkable**, because a findings register containing only surprises is not a register.

| Field | Guidance |
|---|---|
| **Finding ID** | `F-L3-{nn}` — sequential within this line, never reused |
| **Test case ID** | `TC-L3-{nn}` from the traceability matrix, so the finding attaches to an executed test rather than to an opinion |
| **Subsection** | The §9.n reference of the design under test |
| **Trust-boundary rows / standards lines verified** | For example `TB-04`, or the verbatim WSOS line the test supports. Every live test must cite its TB row, and every WSOS claim must cite the standard's own words |
| **Expected behaviour** | What the design predicts, written **before** the test is run, so the prediction cannot be adjusted to fit the result |
| **Observed behaviour** | What actually happened, quoted from the command output rather than paraphrased |
| **Evidence reference** | The `{date}_{host}_{what}.png` filename, the `.pkt` filename, or the `tcpdump` command and its capture file |
| **Deviation and its class** | *none*; *simulator artefact* (a Packet Tracer rendering or timing difference, not a design defect); *design defect* (the design was wrong and the configuration has been corrected); *documentation defect* (the network is right and the design document is wrong); *baseline defect* (the canonical baseline itself is contradictory or incomplete — collected and carried to the revision log) |
| **Resolution** | What was changed, or why nothing was changed |
| **Cost / time impact** | Recorded for every finding, because the risk register needs evidence of which technologies actually consumed the schedule |
| **Residual limitation** | Anything the resolution does **not** fix — this is where declared gaps and Track B items are recorded so they cannot be quietly forgotten |

Six findings are already predictable at proposal time and are recorded here so the register starts non-empty. Each is a **documentation defect** or a **declared gap** rather than a technical surprise, and each must be carried into the baseline's revision log rather than silently corrected in a section.

| Finding ID | Test case | Subsection | Class | Content |
|---|---|---|---|---|
| **F-L3-01** | TC-L3-02 | §9.8.1 | **baseline defect** | The baseline describes the Kwun Tong leg as `OSPF area 0 area-range` while also stating that the OSPF domain is a single area 0. `area range` is an ABR command and is inert in a single-area design. The implementation follows the single-area design and the wording difference is logged for revision |
| **F-L3-02** | TC-L3-09 | §9.7.2 | **baseline defect — CLOSED by Rev 1.1 ruling C-14** | The baseline's §4.1 specifies one HSRP group (group 1, virtual MAC `0000.0c07.ac01`) while its own VIP summary lists four VIPs on four VLANs; a single group cannot serve four SVIs. The implementation uses four groups, preserves the fixed group-1 virtual MAC, and the group-to-VLAN mapping is an `[ASSUMPTION]` until the baseline is revised |
| **F-L3-03** | TC-L3-05 | §9.12.6 | **baseline defect** | The baseline gives the ASA's outside interface as `198.51.100.1/29` and the simulated provider edge as `203.0.113.1`, while placing the IPsec peer at `203.0.113.5`, so the ASA's own default route has two defensible next hops. A single adjacent-hop address for the ASA outside default route should be added to the baseline |
| **F-L3-04** | TC-L3-04 | §9.6.4 | **declared gap** | LACP and PAgP are named by the WSOS 2026 and are not demonstrated, because the simulator's multilayer switch models do not support Port-Channel configuration and because the project's own constraint excludes physical-layer redundancy. Recommended as first-step future work on real equipment |
| **F-L3-05** | TC-L3-06 | §9.13.3 | **declared gap** | NetFlow is named by the WSOS 2026 and cannot be produced by Packet Tracer. The traffic-analysis role is filled by SNMPv3 counters, Syslog and `tcpdump`; the real-equipment Flexible NetFlow configuration is provided as Track B documentation only |
| **F-L3-06** | TC-L3-08 | §9.10.4 | **simulator artefact** | Packet Tracer's displayed BGP and HSRP convergence times are simulation artefacts and are recorded as such; no real-world convergence figure may be derived from them. The behavioural result — which path is selected, and that the selection changes without configuration — is the finding that counts |

The findings register is maintained in `06-verification/` and summarised in the final report's evaluation chapter, where the honest tally of what worked, what needed a declared limit, and what could not be demonstrated at all is the strongest evidence that the project's claims are calibrated to its evidence.
