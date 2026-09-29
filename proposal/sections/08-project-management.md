## 12. Implementation Plan and Schedule

### 12.1 Delivery Approach

The project is delivered through an **incremental, phase-gated build**. The estate described in chapters 3 to 11 is not constructed in one pass and then tested at the end; it is constructed in seven phases, each of which ends at a **verification gate** that must be passed, with evidence committed to `C:\FYP\06-verification\`, before the next phase is entered. The approach follows five principles that are fixed by the design baseline.

**1. Freeze the identity layer first.** Nothing else in the design is stable until addressing, naming and the domain exist. The canonical baseline (`00-design-baseline.md`) is frozen as `v00-baseline-v1.0` at the end of week 1, and its §16 interface contract — hostnames, IP addresses, VLAN identifiers, AS numbers, service-account names, GPO names, VRID values and the banned-string list — is designated non-negotiable for individual writers. This is the project's principal anti-inconsistency mechanism: four people building four parts of one design will diverge unless a single frozen set of values is copied, not re-invented. The baseline records the mechanism explicitly: any change to §16 requires a decision-log entry, three-of-four group agreement, supervisor awareness and a re-issued revision, because *"silent deviation from §16 is a defect."*

**2. Build one layer, prove it, then build on it.** The service dependency chain fixed in the baseline runs *hypervisor host → management zone (`vpnz-hvhost01`, 10.20.20.10) → `vpnz-dc01` (DNS, AD DS, NTP, CA) → server-zone services → the nftables egress pair → the ASA → the simulated provider → the simulated Internet*. Each phase adds exactly one link to that chain. This matters practically: a later fault cannot be caused by a layer that was already proven, so every phase boundary narrows the search space for the next fault. It also means the weekly gate evidence doubles as troubleshooting evidence for Domain 6 of the standard (*Troubleshooting*, 25 %).

**3. Simulated and genuinely configured work run in parallel but are tested differently.** All Cisco routing, switching and firewall behaviour is simulated in Cisco Packet Tracer, while the VM estate — Active Directory, DNS, DHCP, FSRM, iSCSI, RRAS, Nginx, Keepalived, nftables, OpenVPN, WireGuard, Easy-RSA, the monitoring stack, Ansible and the agent runtime — is genuinely configured and running. The two tracks need different test levels (section 13.1) and must never be reported in the same voice: a convergence figure taken from Packet Tracer is a simulation artefact, and the baseline requires it to be labelled as such.

**4. Two-track automation honesty.** Packet Tracer exposes no API and no SSH server reachable from real tooling, and no Ansible collection can drive it. The automation line is therefore delivered in two declared tracks: the playbooks and scripts are **written, executed and idempotence-tested** against the Linux and Windows estate, while the *intent* for network devices is held as text configuration in Git under `03-build/packet-tracer/configs/*.txt` and applied through the simulator's own CLI, with a written gap analysis of exactly which step a real device would require (`netmiko`/`napalm` over SSH). The proposal states plainly that **no playbook in this project ever logs in to a Packet Tracer device**.

**5. The schedule is protected by a fixed priority order, not by optimism.** The baseline fixes four cut bands — **must** (L1 core roles; L3 OSPF, RSTP, ASA; L2 Nginx, Keepalived, nftables; L4 three playbooks), **should** (EIGRP/BGP, iSCSI, monitoring, WordPress), **could** (voice, two-tier PKI, Restic, MCP tool bridge) and **won't** (everything in the baseline's "NOT COVERED" rows). Section 12.9 turns that order into an explicit cut sequence.

**Why a phased, incremental build suits four students on twelve weeks.** Four parallel builders on one shared lab create three predictable failure modes, and phasing answers each of them:

| Failure mode | Why phasing answers it |
|---|---|
| **Dependency deadlock** — somebody cannot start because somebody else has not finished | Phases are ordered by the service dependency chain, so at most one phase is ever blocked on another. Within a phase, the five technology lines are independent because addressing, naming and the domain were frozen in phase 1. |
| **Unverifiable parallel work** — four people produce four things that never fit together | Each phase ends in a joint integration session (section 12.5) whose output is a gate record. Work that cannot be integrated is not "done". |
| **Late discovery of integration defects** — everything breaks in week 11 | Integration is tested at every phase boundary, so defects surface in the phase that caused them, when the owner still remembers the change. The automation line re-runs the whole estate verification playbook (`09-verify-services.yml`) at the end of every phase, which is deliberately a regression harness as well as a gate. |

The twelve-week duration is a **client constraint of this project** (baseline §1.3: *"Deliverable is a 12-week project plan"*). It is **not** derived from the WSOS 2026: that standard contains no time limit and no module structure — the strings `hour`, `hours`, `minutes`, `days` and `module` occur zero times on the page. The standard contributes the six weighted assessment sections that shape emphasis (75 % of the standard sits in the three 25 % technical sections), and nothing about duration.

### 12.2 Phase Plan

| Phase | Phase name | Objective | Key activities | Weeks | Entry criteria | Exit criteria (gate) | Deliverables |
|---|---|---|---|---|---|---|---|
| **P1** | Mobilisation, Baselines and Environment Build | Freeze the interface contract and build the virtualisation substrate and PT L2/L3 base | Freeze baseline as `v00-baseline-v1.0`; select and install the hypervisor on all four machines; create the nine host-only networks with the hypervisor DHCP service disabled on every one; build `UBU2404-TEMPLATE-01` and `W2K25-TEMPLATE-01`; create the repository tree at `C:\FYP` and the bare Git repos on `vpnz-mon01`; build PT project `01-l2l3-core.pkt` (VLANs, trunks, native VLAN 999, access ports) | 1–2 | Group charter and roles signed; supervisor confirms scope boundaries including every "NOT COVERED" row | Baseline frozen and approved; templates sysprepped and cloned once successfully; `show vlan brief` and `show interfaces trunk` captured; `ip -br link` captured inside a Linux guest; host-only networks verified unreachable from the campus LAN | Charter; frozen baseline v1.0; repository tree; templates; `01-l2l3-core.pkt`; open-item register (O-01, O-02, O-03, O-10 partially closed) |
| **P2** | Identity, Core Network and Access Layer | Make one identity authority and one routed core real | Promote `vpnz-dc01` then `vpnz-dc02`; create the OU tree, groups and service accounts; install and scope DNS, DHCP (80/20 failover), AD CS or the single-tier equivalent; map every subnet of the addressing plan to an AD site; build `VP-HQ-CORE-01/02` with HSRP group 1, `VP-HQ-DSW-A01..A04`, RSTP root/secondary, OSPF area 0 HQ↔Kwun Tong; stage the RODC at `vpnz-brdc01` | 2–3 | Templates exist and clone cleanly; host-only networks reachable from the intended guests only | `dcdiag /v` with no failing test; `repadmin /replsummary` with zero replication errors; all four HSRP VIPs answering (10.10.30.254, 10.10.40.254, 10.70.0.254, 10.10.80.254); OSPF neighbours FULL; PT VLANs and trunks verified | AD DS domain `vertexpeak.fyp.lab`; DNS and DHCP live; site/subnet map; `02-wan-routing.pkt` (partial); gate record G-P2 |
| **P3** | Microsoft and Linux Service Estate | Stand up every server-zone service the design names | Build `vpnz-fs01` (FSRM quotas, file screen, DFS-R target), `vpnz-san01` (three LUNs, CHAP), `vpnz-rras01` (RRAS IKEv2 + NPS) and `vpnz-lnxra01` (OpenVPN, Easy-RSA); build `vpnz-mon01` (Ansible control node, Git server, Prometheus, Grafana, Loki, TFTP/SCP archive); mount iSCSI LUNs on the platform tier; harden the whole Linux estate | 4–6 | AD DS, DNS and DHCP proven in P2; internal PKI issuing certificates | Every service in the port and protocol matrix that lives in the server zone reachable from its permitted zone; `Get-IscsiSession` shows a connected session; a VPN client connects with a certificate and no preshared key; `nginx -t` clean where applicable | FSRM share set; three iSCSI LUNs; RRAS IKEv2 remote access; OpenVPN with Easy-RSA PKI; monitoring stack; gate record G-P3 |
| **P4** | Perimeter, DMZ and Tunnels | Make egress a chokepoint and publish the web tier safely | Build `vpnz-nft01/02` with `table inet fyp_filter` (default drop, CT established accept, masquerade, log prefix before every drop) plus keepalived `vrid 51`; build `vpnz-dmzrev01/02` (Nginx TLS termination, `weba_pool` and `wp_pool` upstreams, keepalived `vrid 61`); build the DMZ web farm and WordPress pair and `vpnz-dmzjump01`; ASA perimeter ACLs, NAT, inspect policy and the IKEv2 site-to-site tunnel; WireGuard tunnels (`WG-HQ-WC`, `WG-REMOTE-POOL`, `MGMT-TUNNEL`) | 5–7 | Linux hardening baseline applied; server-zone services reachable; PKI available for TLS material | `nft list ruleset` shows drop policy on input and forward; VRRP VIP 10.10.50.10 and 10.10.90.10 both answer and both fail over; `curl -I https://portal.vertexpeak.example` returns 200/301 through the published path; ASA `show crypto ipsec sa` shows an established tunnel | nftables HA egress pair; Nginx HA reverse proxy; DMZ estate; ASA perimeter with NAT, ACL and IPsec; three WireGuard tunnels; gate record G-P4 |
| **P5** | Automation, Routing Scale and AI Spike | Turn configuration into reviewed code and close the highest-uncertainty item | Write and test the five PowerShell scripts, nine Ansible playbooks, seven roles and five Bash scripts; build the inventory and `group_vars`; enable EIGRP AS 100 with one tagged redistribution point at `VP-HQ-EDGE-01`; enable eBGP to AS 65000 and AS 65002 with prefix filtering and local-preference policy; add port security, DHCP snooping, RSTP protection; run the AI feasibility spike (maximum three working days) and record the decision | 6–9 | Gate G-P4 passed; the estate is stable enough to be re-run without changing it | Second run of every playbook reports `changed=0`; `show ip bgp summary` shows both sessions Established; `show ip eigrp topology` shows the expected successors; rogue-DHCP test blocked and captured; AI decision recorded as adopt OpenClaw, F1 generic agent loop, or F3 deterministic correlation | Automation repository populated with run logs; routing at scale; AI decision-log entry closing open item O-07; gate record G-P5 |
| **P6** | AI Proof of Concept, Monitoring and Full Verification | Demonstrate the innovation line and execute every test in the verification plan | Implement the four-tool read-only surface (`get_active_alerts`, `get_interface_stats`, `get_auth_failures`, `draft_change_proposal`); demonstrate at least two capability scenarios end to end; three alerts firing and resolving in Grafana; execute every test case in section 13; execute every trust-boundary row TB-01 to TB-16; run the failover and resilience tests; run the security tests; run the optional disaster-recovery exercise | 9–11 | Gate G-P5 passed; automation idempotent; monitoring dashboards provisioned from files in Git | At least two AI capabilities demonstrated with transcripts; every test case in the traceability matrix executed with a pass/fail record; every TB row evidenced; failover thresholds met; disaster-recovery timings recorded | `05-ai-netops\` evidence set; executed test records in `06-verification\`; denial and failover captures; gate record G-P6 |
| **P7** | Documentation Close-Out, Acceptance and Handover | Assemble, prove and sign off the deliverable set | Assemble the final report and manuals; write the version-deviation subsection; run the banned-string sweep; run the traceability sweep; rehearse the demonstration and viva; obtain user acceptance and record it | 11–12 | All test execution complete; no open Critical or High defect | Banned-string sweep clean; every objective in the traceability matrix has at least one passing test; supervisor sign-off recorded; acceptance record signed; release tagged `v1.0` | Final report PDF; build manual; test report; operations manual; presentation; acceptance and sign-off record; tag `v1.0` |

**Freeze points.** The interface contract (baseline §16) may not change after the end of week 6 except by a formal re-issue of the baseline. After week 9, **no new technology may be added** — weeks 10 to 12 are for testing, documenting and closing only. Both freeze points are project decisions recorded in the baseline; neither comes from the WSOS, which specifies no schedule of any kind.

### 12.3 The 12-Week Schedule

| Wk | Focus | L1 MS-SERVER | L2 LINUX-SERVER | L3 CISCO | L4 AUTOMATION | L5 AI-NETOPS | Documentation | Milestone / gate | Verification or review gate |
|---|---|---|---|---|---|---|---|---|---|
| **W1** | Mobilise and freeze | Hypervisor host prepared; Windows Server media obtained; `W2K25-TEMPLATE-01` started | Hypervisor host prepared; Ubuntu media obtained; `UBU2404-TEMPLATE-01` started | PT `01-l2l3-core.pkt` topology drawn from the physical/logical diagram | Repository tree created; Git workflow agreed; branch naming agreed | AI line scoped; OpenClaw documentation collected into `08-references\` | Chapter template frozen; screenshot caption template issued | **M1.1** baseline frozen as `v00-baseline-v1.0`; **M1.2** roles and charter signed | Review: supervisor confirms scope, including every "NOT COVERED" row presented for approval |
| **W2** | Substrate | Templates sysprepped and cloned; host-only networks created; hypervisor DHCP off everywhere | Ubuntu template cloud-init verified; `ip -br link` names recorded | `01-l2l3-core.pkt` VLANs, trunks, native VLAN 999, unused ports shut in VLAN 999 | Ansible installed on `vpnz-mon01`; `ansible --version` captured | Feasibility-spike scope written and timeboxed to three days | Repository tree documented; evidence naming convention published | **M2.1** hypervisor chosen (closes O-01); **M2.2** PT build and ASA image read from `show version` (closes O-02) | Gate **G-P1**: `show vlan brief`, `show interfaces trunk`, `ip -br a` captured |
| **W3** | Identity | `vpnz-dc01` promoted; DNS, DHCP, AD CS; OU tree, groups, service accounts; `vpnz-dc02` promoted and replicating | Base Linux hardening script authored (`01-hardening-baseline.sh`) | `VP-HQ-CORE-01/02` HSRP group 1; `VP-HQ-EDGE-01`; OSPF area 0 HQ↔Kwun Tong | Inventory `lab.ini` drafted with six groups | AI threat model and read-only guardrail list drafted | Verification-record template in use from this week onward | **M3.1** forest live and replicating; **M3.2** Windows edition recorded (closes O-03) | Gate **G-P2**: `dcdiag /v`, `repadmin /replsummary`, ADUC, `show ip ospf neighbor`, `show standby brief` |
| **W4** | Branch and access layer | RODC `vpnz-brdc01` staged; branch DHCP relay; RODC DNS third in branch option list | Linux hardening re-run for idempotence; `02-nftables-apply.sh` written with rollback timer | `VP-BR-EDGE-01`, `VP-BR-DSW-A01`, `VP-MO-EDGE-01`, `VP-MO-DSW-A01`, `VP-WC-EDGE-01`, `VP-WC-DSW-A01`; user VLANs reachable | `01-baseline-windows.yml` and `02-baseline-linux.yml` written | IPv6 decision recorded (closes O-10) | Weekly progress report W1–W3 published | **M4.1** HQ users on VLAN 40 receive DHCP from the domain | Gate: DHCP lease capture, `ip helper-address` verification, PT end-to-end ping across VLANs |
| **W5** | First service wave | `vpnz-fs01` built; FSRM quotas and file screen; DFS-R target configured | `vpnz-dmzrev01/02` Nginx reverse proxy with TLS termination and upstreams; keepalived `vrid 61` | `03-asa-perimeter.pkt` started: security levels, object groups, NAT skeleton | `03-nginx-reverseproxy.yml` and `04-keepalived.yml` written and run | **AI feasibility spike starts** (timeboxed) | Build runbooks for Windows and Linux started | **M5.1** Nginx pair live with VIP; **M5.2** FSRM blocking a denied file type | Gate: `nginx -t`, VIP failover capture, `Get-FsrmQuota`, `Get-FsrmFileScreen` |
| **W6** | Egress chokepoint and storage | `vpnz-san01` iSCSI target with three LUNs and CHAP; LUN01 attached to the platform tier; `vpnz-rras01` RRAS and NPS | `vpnz-nft01/02` `table inet fyp_filter` with default drop, NAT, log prefix; keepalived `vrid 51`; WireGuard tunnels; OpenVPN with Easy-RSA | ASA NAT and ACL rows TB-04, TB-05, TB-06, TB-13, TB-15 | `05-nftables-egress.yml`, `06-wireguard.yml`; `Backup-NetworkDeviceConfig.ps1` written | **AI spike decision recorded** (adopt / F1 / F3) | Interface contract frozen at end of this week | **M6.1** egress pair live; **M6.2** AI decision recorded (closes O-07); **M6.3** WireGuard peer decision (closes O-04) | Gate **G-P4 (partial)**: `nft list ruleset`, tunnel handshakes, `Get-IscsiSession`, decision-log entry |
| **W7** | DMZ and perimeter publication | DMZ web farm `vpnz-dmzweba01/02` (IIS, ASP.NET) ; domain-join decision recorded (closes O-05) | WordPress pair `vpnz-dmzwp01/02`; `vpnz-dmzjump01` as the only DMZ management path; DMZ LDAP bind account | `03-asa-perimeter.pkt` completed: object groups, static NAT, inspect policy, syslog to `vpnz-mon01` | `Test-ServiceEndpoints.ps1` (the port matrix as an executable test) | Agent runtime host `vpnz-ai01` prepared with the four tool manifests drafted | Traceability matrix extended with every new test ID | **M7.1** published portal reachable through the proxy; **M7.2** PKI tier decision (closes O-06) | Gate: `curl -I https://portal.vertexpeak.example`, ASA `show run`, denied-flow capture |
| **W8** | Routing at scale | PKI certificate templates for IKEv2 client auto-enrolment via `GPO-WS-Cert-AutoEnrol` | Certificate renewal script `05-cert-renew.sh`; CRL regeneration and revocation test | EIGRP AS 100 at Macau with tagged redistribution at `VP-HQ-EDGE-01`; eBGP to AS 65000 and AS 65002; ASA IKEv2 site-to-site to Wan Chai | `07-ad-users.yml`; `Invoke-NewStarterOnboarding.ps1`; `Get-ADHealthReport.ps1` | Tool-allow-list and rate limit implemented on `vpnz-ai01` | Test plan document drafted with all tables | **M8.1** BGP failover demonstrated; **M8.2** EIGRP/OSPF redistribution with tags | Gate: `show ip bgp summary`, `show ip eigrp topology`, `show ip protocols`, `show crypto ipsec sa` |
| **W9** | Convergence and switching resilience | RRAS IKEv2 remote-access acceptance test from an external client laptop | nftables lockout-rollback demonstration captured | RSTP root/secondary, portfast, bpduguard, guard root, loopguard; port security and DHCP snooping; rogue-DHCP blocked | `08-collect-network-configs.yml`; `Get-ADHealthReport.ps1` scheduled; `04-backup-restic.sh` | Agent collector code paths written; `/opt/openclaw/logs/agent.jsonl` logging live | Failover test records started | **M9.1** RSTP convergence sequence captured; **M9.2** rogue DHCP blocked | Gate **G-P5**: `show spanning-tree`, rogue-DHCP capture; **technology freeze declared** |
| **W10** | Automation complete and AI demonstrated | Remaining PowerShell scripts (`Export-GPOBackup.ps1`) idempotent; version deviations for all Windows components recorded | All five Bash scripts in use; `dpkg --get-selections` output archived | All PT projects merged into `04-voice.pkt` and `05-full.pkt`; CUCM Express registration shown | Nine playbooks all idempotent (`changed=0`); run logs committed; monitoring dashboards provisioned from Git | **AI proof of concept demonstrated at least twice** with transcripts; limitations written up | Version-deviation subsection drafted | **M10.1** automation complete; **M10.2** AI demonstrated twice; **M10.3** all versions captured (closes O-08) | Gate **G-P6**: run logs, `changed=0` evidence, Grafana screenshots, agent transcripts |
| **W11** | Full verification | All L1 test cases executed; DC failure, DNS redundancy and iSCSI restart tests run | All L2 test cases executed; VRRP failover, web-tier node failure and nginx reload tests run | All L3 test cases executed; HSRP failover, RSTP reconvergence, BGP session loss tested | All L4 test cases executed; security tests for blocked and permitted flows; secrets sweep clean | All AI test cases executed; false-positive and hallucination findings recorded honestly | Every test record indexed; findings register complete; disaster-recovery exercise run | **M11.1** every test case executed; **M11.2** every TB row evidenced | Gate: `06-verification\` complete; DR timings recorded; defect list triaged to zero Critical/High |
| **W12** | Close-out and acceptance | Deviations folded back into affected sections | Final evidence index complete and cross-checked against filenames | Final PT `.pkt` files frozen and archived | Repository tagged `v1.0`; each script and playbook's final run log archived | AI chapter finalised with fallback actually taken stated | Final report assembled and proof-read against the interface contract; banned-string sweep | **M12.1** release tagged `v1.0`; **M12.2** supervisor sign-off; **M12.3** user acceptance recorded | Gate **G-P7**: acceptance record signed; traceability matrix complete; demonstration rehearsed |

#### Gantt-style schedule (bars are inclusive weeks; `·` = not running, `█` = active)

**Virtual machines and the hypervisor host — 19 VMs plus `vpnz-hvhost01`**

```text
                              W1 W2 W3 W4 W5 W6 W7 W8 W9 W10 W11 W12
                              -- -- -- -- -- -- -- -- -- -- -- --
TEMPLATES/NAMING SETUP    |   ██ ██ ·· ·· ·· ·· ·· ·· ·· ··  ··  ··
vpnz-hvhost01    (host)   |   ██ ██ ██ ██ ██ ██ ██ ██ ██ ██  ██  ██
vpnz-dc01        (W2K25)  |   ·· ·· ██ ██ ██ ██ ██ ██ ██ ██  ██  ██
vpnz-dc02        (W2K25)  |   ·· ·· ██ ██ ██ ██ ██ ██ ██ ██  ██  ██
vpnz-brdc01      (W2K25)  |   ·· ·· ·· ██ ██ ██ ██ ██ ██ ██  ██  ██
vpnz-fs01        (W2K25)  |   ·· ·· ·· ·· ██ ██ ██ ██ ██ ██  ██  ██
vpnz-san01       (W2K25)  |   ·· ·· ·· ·· ·· ██ ██ ██ ██ ██  ██  ██
vpnz-rras01      (W2K25)  |   ·· ·· ·· ·· ·· ██ ██ ██ ██ ██  ██  ██
vpnz-lnxra01     (UBU)    |   ·· ·· ·· ·· ·· ██ ██ ██ ██ ██  ██  ██
vpnz-mon01       (UBU)    |   ·· ██ ██ ██ ██ ██ ██ ██ ██ ██  ██  ██
vpnz-nft01       (UBU)    |   ·· ·· ·· ·· ·· ██ ██ ██ ██ ██  ██  ██
vpnz-nft02       (UBU)    |   ·· ·· ·· ·· ·· ██ ██ ██ ██ ██  ██  ██
vpnz-dmzrev01    (UBU)    |   ·· ·· ·· ·· ██ ██ ██ ██ ██ ██  ██  ██
vpnz-dmzrev02    (UBU)    |   ·· ·· ·· ·· ██ ██ ██ ██ ██ ██  ██  ██
vpnz-dmzweba01   (W2K25)  |   ·· ·· ·· ·· ·· ·· ██ ██ ██ ██  ██  ██
vpnz-dmzweba02   (W2K25)  |   ·· ·· ·· ·· ·· ·· ██ ██ ██ ██  ██  ██
vpnz-dmzwp01     (UBU)    |   ·· ·· ·· ·· ·· ·· ██ ██ ██ ██  ██  ██
vpnz-dmzwp02     (UBU)    |   ·· ·· ·· ·· ·· ·· ██ ██ ██ ██  ██  ██
vpnz-dmzjump01   (UBU)    |   ·· ·· ·· ·· ·· ·· ██ ██ ██ ██  ██  ██
vpnz-jump01      (W2K25)  |   ·· ·· ·· ██ ██ ██ ██ ██ ██ ██  ██  ██
vpnz-ai01        (UBU)    |   ·· ·· ·· ·· ·· ·· ·· ██ ██ ██  ██  ██
```

**Packet Tracer logical devices — 16 devices, in five incremental project files**

```text
                              W1 W2 W3 W4 W5 W6 W7 W8 W9 W10 W11 W12
                              -- -- -- -- -- -- -- -- -- -- -- --
VP-HQ-CORE-01             |   ·· ██ ██ ██ ██ ██ ██ ██ ██ ██  ██  ██
VP-HQ-CORE-02             |   ·· ██ ██ ██ ██ ██ ██ ██ ██ ██  ██  ██
VP-HQ-DSW-A01             |   ·· ██ ██ ██ ██ ██ ██ ██ ██ ██  ██  ██
VP-HQ-DSW-A02             |   ·· ██ ██ ██ ██ ██ ██ ██ ██ ██  ██  ██
VP-HQ-DSW-A03             |   ·· ██ ██ ██ ██ ██ ██ ██ ██ ██  ██  ██
VP-HQ-DSW-A04             |   ·· ██ ██ ██ ██ ██ ██ ██ ██ ██  ██  ██
VP-HQ-EDGE-01             |   ·· ·· ██ ██ ██ ██ ██ ██ ██ ██  ██  ██
VP-BR-EDGE-01             |   ·· ·· ·· ██ ██ ██ ██ ██ ██ ██  ██  ██
VP-BR-DSW-A01             |   ·· ·· ·· ██ ██ ██ ██ ██ ██ ██  ██  ██
VP-MO-EDGE-01             |   ·· ·· ·· ██ ██ ██ ██ ██ ██ ██  ██  ██
VP-MO-DSW-A01             |   ·· ·· ·· ██ ██ ██ ██ ██ ██ ██  ██  ██
VP-WC-EDGE-01             |   ·· ·· ·· ██ ██ ██ ██ ██ ██ ██  ██  ██
VP-WC-DSW-A01             |   ·· ·· ·· ██ ██ ██ ██ ██ ██ ██  ██  ██
VP-HQ-FW-01  (ASA5506-X)  |   ·· ·· ·· ·· ██ ██ ██ ██ ██ ██  ██  ██
VP-HQ-VOICE-01 (CUCM-E)   |   ·· ·· ·· ·· ·· ·· ·· ·· ·· ██  ██  ██
VP-ISP-EDGE-01  (AS65000) |   ·· ·· ·· ·· ·· ·· ██ ██ ██ ██  ██  ██
```

**The five technology lines and the documentation workstream**

```text
                              W1 W2 W3 W4 W5 W6 W7 W8 W9 W10 W11 W12
                              -- -- -- -- -- -- -- -- -- -- -- --
L1 MS-SERVER              |   ██ ██ ██ ██ ██ ██ ██ ██ ██ ██  ██  ██
   identity build         |   ·· ·· ██ ██ ·· ·· ·· ·· ·· ··  ··  ··
   file/storage/VPN       |   ·· ·· ·· ·· ██ ██ ██ ██ ██ ··  ··  ··
   L1 test execution      |   ·· ·· ·· ·· ·· ·· ·· ·· ·· ··  ██  ··
L2 LINUX-SERVER           |   ·· ██ ██ ██ ██ ██ ██ ██ ██ ██  ██  ██
   hardening baseline     |   ·· ·· ██ ██ ██ ·· ·· ·· ·· ··  ··  ··
   nginx + keepalived     |   ·· ·· ·· ·· ██ ██ ██ ██ ██ ··  ··  ··
   nftables + tunnels     |   ·· ·· ·· ·· ·· ██ ██ ██ ██ ··  ··  ··
   monitoring stack       |   ·· ·· ·· ·· ·· ·· ██ ██ ██ ██  ··  ··
   L2 test execution      |   ·· ·· ·· ·· ·· ·· ·· ·· ·· ··  ██  ··
L3 CISCO                  |   ██ ██ ██ ██ ██ ██ ██ ██ ██ ██  ██  ██
   01/02 topology + OSPF  |   ██ ██ ██ ██ ██ ·· ·· ·· ·· ··  ··  ··
   03 ASA perimeter       |   ·· ·· ·· ·· ██ ██ ██ ██ ██ ··  ··  ··
   EIGRP + BGP            |   ·· ·· ·· ·· ·· ·· ·· ██ ██ ··  ··  ··
   RSTP + L2 security     |   ·· ·· ·· ·· ·· ·· ·· ·· ██ ██  ··  ··
   04 voice + 05 full     |   ·· ·· ·· ·· ·· ·· ·· ·· ·· ██  ██  ██
   L3 test execution      |   ·· ·· ·· ·· ·· ·· ·· ·· ·· ··  ██  ··
L4 AUTOMATION             |   ██ ██ ██ ██ ██ ██ ██ ██ ██ ██  ██  ██
   Git workflow + repo    |   ██ ██ ██ ██ ·· ·· ·· ·· ·· ··  ··  ··
   PowerShell scripts     |   ·· ·· ·· ·· ██ ██ ██ ██ ██ ··  ··  ··
   Ansible playbooks      |   ·· ·· ·· ██ ██ ██ ██ ██ ██ ██  ··  ··
   Bash scripts           |   ·· ·· ██ ██ ██ ██ ██ ██ ██ ██  ··  ··
   idempotence proof      |   ·· ·· ·· ·· ·· ·· ·· ·· ·· ██  ██  ··
   L4 test execution      |   ·· ·· ·· ·· ·· ·· ·· ·· ·· ··  ██  ··
L5 AI-NETOPS              |   ·· ·· ·· ·· ·· ·· ·· ██ ██ ██  ██  ··
   scope + threat model   |   ██ ██ ██ ██ ·· ·· ·· ·· ·· ··  ··  ··
   feasibility spike      |   ·· ·· ·· ·· ██ ██ ·· ·· ·· ··  ··  ··
   four read-only tools   |   ·· ·· ·· ·· ·· ·· ·· ██ ██ ██  ··  ··
   capability demos       |   ·· ·· ·· ·· ·· ·· ·· ·· ·· ██  ██  ··
   L5 test execution      |   ·· ·· ·· ·· ·· ·· ·· ·· ·· ··  ██  ··
DOCUMENTATION             |   ██ ██ ██ ██ ██ ██ ██ ██ ██ ██  ██  ██
   design chapters        |   ██ ██ ██ ██ ██ ██ ██ ██ ·· ··  ··  ··
   build runbooks         |   ·· ·· ██ ██ ██ ██ ██ ██ ██ ··  ··  ··
   evidence capture       |   ·· ·· ██ ██ ██ ██ ██ ██ ██ ██  ██  ··
   verification records   |   ·· ·· ·· ·· ·· ·· ·· ·· ██ ██  ██  ██
   final report assembly  |   ·· ·· ·· ·· ·· ·· ·· ·· ·· ··  ██  ██
```

**Reading note.** Non-contiguous bars inside a line are deliberate: `L1 identity build` finishing in W4 and `L1 file/storage/VPN` starting in W5 are different work packages with different owners and different test sets, not an interruption. Bars in the same column across lines are what the weekly integration session must make work together.

### 12.4 Critical Path and Dependencies

The critical path is the longest chain of hard dependencies, and every day of slip on it is a day of slip on the delivery. It runs:

**Hypervisor and template availability (W1–W2) → AD DS, DNS and DHCP operational (W3) → internal PKI issuing certificates (W3–W4) → Nginx TLS termination and the DMZ web farm (W5–W7) → nftables egress pair with NAT, required before any published service can be reached from the simulated Internet (W6) → ASA ACL, NAT and site-to-site IPsec (W7–W8) → end-to-end published service path through the proxy (W7) → full verification execution (W11) → documentation close-out and acceptance (W12).**

The reason this, and not the Cisco routing work, is critical is that the *published-service acceptance criterion* depends on four independent things being simultaneously correct: name resolution, TLS material from the PKI, the reverse-proxy tier with a working VIP, and an egress path that permits the flow. Routing scale (EIGRP, BGP) is on a secondary path because the portal can be demonstrated with OSPF alone; it strengthens Domain 3 evidence but does not gate the primary acceptance criterion.

| # | Work package | Depends on (hard) | Depends on (soft) | On critical path? | Float available | If it slips |
|---|---|---|---|---|---|---|
| WP-01 | Hypervisor installed and templates built | Host hardware available to all four members | Group agreement on hypervisor | **Yes** | 0 days | Everything slips one-for-one; the single largest schedule risk (see 15.3) |
| WP-02 | Host-only networks created, hypervisor DHCP disabled | WP-01 | — | **Yes** | 0 days | Guests cannot be isolated; all later VLAN testing is invalid |
| WP-03 | AD DS forest, DNS, DHCP, sites, OUs, groups | WP-01, WP-02 | PT topology not required | **Yes** | 0 days | No domain join, no GPO, no certificate auto-enrolment; L1, L4 and PKI all stall |
| WP-04 | Internal PKI (AD CS and/or Easy-RSA) issuing certificates | WP-03 | — | **Yes** | 0 days | No TLS on the proxy, no IKEv2 client certificates, no OpenVPN PKI: three lines stall at once |
| WP-05 | FSRM, iSCSI, RRAS roles on the Windows estate | WP-03, WP-04 | Storage budget review | No | 5 days (W5–W6 window is 2 weeks for 3 work packages) | Cut to "should" band: RRAS IKEv2 retained as the certificate demonstration, iSCSI reduced to one attached LUN |
| WP-06 | Linux hardening baseline and Bash library | WP-01 | — | No | 8 days | Acceptable to slip; the hardening test cases are cheap to re-run later |
| WP-07 | Nginx reverse proxy with TLS, keepalived `vrid 61` | WP-02, WP-04 | nftables not required for internal testing | **Yes** | 0 days | The published-service acceptance criterion cannot be met |
| WP-08 | nftables egress pair with NAT, logging and `vrid 51` | WP-02, WP-06 | — | **Yes** | 1 day | Nothing inside can reach the simulated Internet; also removes the TB-02/TB-03 denial evidence |
| WP-09 | DMZ web farm, WordPress pair, DMZ jump host | WP-07, WP-04 | O-05 domain-join decision | **Yes** | 0 days | Upstream pools empty, so the proxy has nothing to balance — failover testing is impossible |
| WP-10 | ASA perimeter: ACLs, object groups, NAT, inspect, syslog | WP-05 (PT topology) | PKI for the ASA identity certificate | **Yes** (through WP-11) | 2 days | Published path breaks; TB-05/TB-06 evidence missing |
| WP-11 | Published-service end-to-end path | WP-07, WP-08, WP-09, WP-10 | — | **Yes** | 0 days | Primary acceptance criterion fails |
| WP-12 | EIGRP AS 100 with tagged redistribution | WP-05 (PT WAN topology) | — | No | 6 days | Falls into the "should" band, cut only after WP-05 is cut |
| WP-13 | eBGP to AS 65000 and AS 65002 with policy and failover | WP-05 (PT WAN topology) | — | No | 6 days | "Should" band; the failover capture is the expensive part, not the session |
| WP-14 | RSTP root selection, port security, DHCP snooping | WP-05 (PT access topology) | — | No | 5 days | "Must" band for RSTP root behaviour; port security and rogue-DHCP evidence can slip to W11 |
| WP-15 | WireGuard and OpenVPN tunnels | WP-04, WP-08 | O-04 peer decision | No | 3 days | "Must" for WireGuard remote workers, "should" for the site tunnel |
| WP-16 | PowerShell scripts (5) and Ansible playbooks (9) | WP-03, WP-06 | Monitoring stack for verification playbook | No | 4 days | "Must" reduced from nine playbooks to three (baseline "must" band) |
| WP-17 | Monitoring stack and alert rules | WP-03, WP-06 | — | No | 6 days | "Should" band; Loki is the first element to be dropped |
| WP-18 | AI proof of concept (four read-only tools, two demos) | WP-17 (alert source), WP-09 (targets to read) | O-07 decision, API or local model availability | No | 3 days, protected by fallbacks F1/F3 | The declared proof-of-concept scope shrinks; the chapter remains defensible |
| WP-19 | Full test execution (all test cases and trust-boundary rows) | WP-11, WP-14, WP-16 | — | **Yes** | 0 days | Directly consumes the acceptance window; cannot be compressed |
| WP-20 | Documentation close-out, acceptance and handover | WP-19 | — | **Yes** | 0 days | The hard deadline is the submission date |

**Float management.** Only four work packages have genuinely useful float (WP-05 at five days, WP-12 and WP-13 at six days each, WP-17 at six days). Total float across the secondary path is therefore small, and the group treats any consumption beyond half of it as a trigger for the re-planning procedure in section 12.9 rather than as absorbable slack. Negative float is avoided by protecting WP-01, WP-03, WP-04 and WP-07 with the pairing arrangement in section 12.5 rather than by adding buffer that does not exist.

### 12.5 Four-Person Work Breakdown

The group has four members. Members are labelled **Member A**, **Member B**, **Member C** and **Member D** throughout this proposal; the technology-line ownership is fixed, and each member keeps a named personal administrative account `adm-{initials}` so that every administrative action in the estate is attributable to a person, as the identity design requires.

#### 12.5.1 Responsibility assignment matrix (RACI)

Legend: **R** = Responsible (does the work), **A** = Accountable (owns the outcome, exactly one per row), **C** = Consulted (must be asked before a change), **I** = Informed (told when it changes).

| Workstream or deliverable | Member A | Member B | Member C | Member D |
|---|---|---|---|---|
| Project charter, roles and baseline freeze | **A/R** | C | C | C |
| Interface contract compliance (naming, addressing, banned strings) | **A** | R | R | R |
| Hypervisor selection, installation and host-only network design | C | C | C | **A/R** |
| VM templates (`W2K25-TEMPLATE-01`, `UBU2404-TEMPLATE-01`) | **R** | **R** | I | **A** |
| Repository tree, Git server and branch workflow | I | I | I | **A/R** |
| **L1** AD DS forest, OUs, groups, service accounts, tiers | **A/R** | C | I | C |
| **L1** DNS, DHCP (80/20) and DNS/DHCP redundancy rules | **A/R** | C | C | I |
| **L1** GPO baseline, LAPS, PowerShell logging, drive maps | **A/R** | I | I | C |
| **L1** AD CS / internal PKI (root and issuing CA) | **A/R** | C | I | C |
| **L1** FSRM quotas, file screening, DFS-R | **A/R** | I | I | I |
| **L1** iSCSI target, LUNs, CHAP, initiator attachment | **A/R** | C | I | I |
| **L1** RRAS IKEv2 remote access and NPS/RADIUS policy | **A/R** | C | C | I |
| **L2** Linux hardening baseline and sysctl/SSH policy | C | **A/R** | I | I |
| **L2** Nginx reverse proxy, TLS termination, upstream pools | I | **A/R** | C | C |
| **L2** Keepalived VRRP pairs (VRID 51 and 61) | I | **A/R** | C | C |
| **L2** nftables egress filter, NAT, logging, rollback timer | C | **A/R** | **R** | C |
| **L2** OpenVPN with Easy-RSA PKI and revocation test | I | **A/R** | C | I |
| **L2** WireGuard tunnels (site, remote pool, management escape hatch) | I | **A/R** | **R** | C |
| **L2** WordPress pair and MariaDB | I | **A/R** | I | I |
| **L3** Packet Tracer topology, VLANs, trunks, port discipline | I | I | **A/R** | I |
| **L3** OSPF area 0, HSRP group 1, gateway redundancy | I | I | **A/R** | I |
| **L3** EIGRP AS 100 and tagged redistribution at one point | I | I | **A/R** | I |
| **L3** eBGP to AS 65000 and AS 65002 with prefix policy | I | I | **A/R** | I |
| **L3** RSTP root/primary/secondary and L2 hardening | I | I | **A/R** | I |
| **L3** ASA perimeter: ACLs, object groups, NAT, inspect, syslog | I | C | **A/R** | I |
| **L3** ASA site-to-site IKEv2 tunnel to Wan Chai | C | C | **A/R** | I |
| **L3** CUCM Express voice (supporting, not a claimed brief line) | I | I | **A/R** | I |
| **L4** PowerShell scripts (5) and shared module | **C** | I | I | **A/R** |
| **L4** Ansible playbooks (9), roles, Jinja2 templates, inventory | C | R | R | **A/R** |
| **L4** Bash scripts (5) and shared library | I | **R** | I | **A** |
| **L4** Git workflow, branch-per-task, peer review, tags | I | I | I | **A/R** |
| **L4** Secrets management and pre-tag credential sweep | C | C | C | **A/R** |
| **L5** AI scope, threat model and read-only guardrail design | I | C | **R** | **A/R** |
| **L5** OpenClaw feasibility spike and fallback decision | I | I | R | **A/R** |
| **L5** Four read-only tools and tool allow-list | I | C | **R** | **A/R** |
| **L5** Agent audit log, rate limits, proposal-only output | I | I | C | **A/R** |
| Monitoring: Prometheus, exporters, Grafana dashboards, Loki | C | **R** | C | **A** |
| **Test plan** authorship | C | C | C | **A/R** |
| Test execution — L1 cases | **A/R** | I | I | C |
| Test execution — L2 cases | I | **A/R** | I | C |
| Test execution — L3 cases | I | I | **A/R** | C |
| Test execution — L4 cases | C | C | I | **A/R** |
| Test execution — L5 cases | I | I | C | **A/R** |
| Test execution — security and trust-boundary rows TB-01 to TB-16 | C | **R** | **R** | **A** |
| Test execution — failover and resilience suite | **R** | **R** | **R** | **A** |
| Risk register maintenance | **R** | C | C | **A** |
| Issues log and defect triage | **A** | R | R | R |
| Meeting minutes and action tracking | R | R | R | **A** |
| Evidence capture, naming and indexing | R | R | R | **A** |
| Findings register and lessons learned | R | R | R | **A** |
| Design chapters (3–11) authorship | **A/R** | R | R | R |
| Build runbooks (Windows) | **A/R** | I | I | C |
| Build runbooks (Linux) | I | **A/R** | I | C |
| Build runbooks (Packet Tracer) | I | I | **A/R** | C |
| Automation and AI sections of the report | C | C | C | **A/R** |
| Verification chapter and traceability matrix | C | C | C | **A/R** |
| Final report assembly, consistency sweep and proof-read | **R** | R | R | **A** |
| Presentation and live demonstration | R | R | R | **A** |
| Supervisor liaison and sign-off | **A/R** | I | I | C |

Every row has exactly one **A**. No row is unassigned, which is the property that makes the matrix usable rather than decorative.

#### 12.5.2 Primary ownership of the five technology lines

| Line | Short name | Primary owner | Line shape |
|---|---|---|---|
| **L1** | MS-SERVER | **Member A** | 9 Windows Server guests, the whole identity plane, PKI, file services, block storage, certificate-based remote access |
| **L2** | LINUX-SERVER | **Member B** | 10 Ubuntu guests, the reverse-proxy tier, both VRRP pairs, host and network firewalling, two VPN technologies, the WordPress tier |
| **L3** | CISCO | **Member C** | 16 Packet Tracer devices across four sites, the routing domain, the L2 domain, the ASA perimeter and the voice device |
| **L4** | AUTOMATION | **Member D** | Five PowerShell scripts, nine Ansible playbooks, seven roles, five Bash scripts, the Git repository and the secrets discipline |
| **L5** | AI-NETOPS | **Member D as primary, Member C as the second owner** | The shared line |

**How the fifth line is shared, and why.** The AI line is the only line that has no single natural owner, because it is the only line that *consumes the other four rather than building anything of its own*. The agent runtime runs on one VM (`vpnz-ai01`) and its entire behaviour is reading: alerts from the monitoring stack, interface counters from network devices, failed-login events from the identity plane and the DMZ, and proposed diffs against configuration held in Git. Ownership is therefore shared along a clean interface:

- **Member D** owns the **agent side** — the runtime, the four read-only tool manifests, the allow-list and rate limit, the audit log in `/opt/openclaw/logs/agent.jsonl`, the prompt and evaluation records, and the honesty statement about which fallback was taken.
- **Member C** owns the **data side** — that the read-only collectors actually return correct values, that SNMPv3 is used and SNMPv2c is forbidden, that the credentials used are `svc_aiagent` and nothing else, and that the agent's network reachability is limited to the management ports in the port matrix.
- **Member B** is consulted on the Linux-side collector paths; **Member A** is consulted on the event-log surface and on the `GG-AI-ReadOnly` group membership.

The interface between the two owners is a **frozen tool contract**: four tools, no fifth tool, each with a declared input schema and a declared read-only behaviour. Because the contract is frozen before either side writes code, the two owners can work in parallel without integration surprises — and any change to it is a §16-class change requiring a baseline revision.

Two consequences are worth stating in the proposal rather than discovering at assessment. First, **the AI line is the weakest line and is deliberately scoped as a proof of concept with declared limits**, because the standard on which this project is aligned contains no AI content at all: `Agentic AI`, `OpenClaw`, `MCP`, `artificial intelligence` and `machine learning` each occur **zero times** in the WSOS 2026 page, in both the extracted text and the raw HTML. The AI work is project innovation beyond the standard, and it is presented that way. Second, the line is protected by five pre-designed fallbacks (F1 to F5 in the baseline), and the fallback must be **chosen by the end of week 6**, not improvised in week 11.

#### 12.5.3 How the split keeps each member's contribution individually assessable

Individual contribution normally has to be evidenced, and four people working on one integrated system makes that genuinely difficult. This project answers it with five overlapping mechanisms, so that no single mechanism has to carry the whole argument:

1. **Named personal administrative accounts.** Every member has exactly one `adm-{initials}` account in `OU=Admins`, two of the four are additionally in `GG-Tier0-Admins`, and the identity design requires that no shared administrative account is used in normal operation. Administrative events therefore carry a username, and the security log is evidence of who did what.
2. **One accountable owner and one reviewer per deliverable, recorded in the matrix.** Section 12.5.1 assigns a single **A** per row. Where a row lists two members (**R**/**R**), the accountable member is still singular.
3. **Authorship of report sections is fixed and disjoint.** Members A, B and C author their own technology chapters; Member D authors the automation, AI, verification and close-out chapters. The proposal's own section map shows this, and the final report repeats it.
4. **Evidence ownership.** Every screenshot and transcript in `07-evidence\` and `06-verification\` has an owner recorded in the master evidence index, and the verification record carries the initials of the person who performed the test. A test that nobody signed is not evidence.
5. **Commit history.** Every artefact lives in Git on `vpnz-mon01`, branches are per task, and a release tag `v1.0` closes the project. Commit history is the objective record of who wrote what and when, and it is used as the primary evidence for the contribution matrix in section 16.4 rather than as a secondary anecdote.

The contribution matrix in section 16.4 is *derived* from these five sources rather than asserted alongside them, which is what makes an individual mark defensible.

#### 12.5.4 Cross-cover plan — no single point of failure

The project's largest availability limitation is that there is one hypervisor host and one human per line. The following pairing and shadowing arrangement removes the human single points of failure.

| Pairing | Primary | Shadow | Paired artefacts | Handover trigger |
|---|---|---|---|---|
| **Pair 1 — identity and platform** | Member A (L1) | Member B | AD DS builds, GPO set, PKI issuance, iSCSI attachment, RRAS configuration; Windows build runbooks | Member A unavailable for more than two working days, or a Tier-0 change that Member A is not permitted to make alone |
| **Pair 2 — perimeter and services** | Member B (L2) | Member A | nftables ruleset, keepalived configuration, Nginx configuration, Easy-RSA PKI, WordPress tier | Member B unavailable for more than two working days, or a firewall change that locks out remote access |
| **Pair 3 — network and data surface** | Member C (L3) | Member D | Packet Tracer projects, routing configuration text, ASA policy text, PT configuration archive, SNMPv3 collector correctness | Member C unavailable for more than two working days, or a routing change affecting the published path |
| **Pair 4 — automation and AI** | Member D (L4, L5 primary) | Member C | Playbooks, roles, PowerShell scripts, Git repository, agent runtime and allow-list | Member D unavailable for more than two working days, or an Ansible run that changes more hosts than intended |

Cross-cover is made real, not nominal, by four rules:

1. **The shadow must have run every artefact at least once.** A playbook, script or configuration that only its owner has ever executed is not cross-covered, because nobody else knows how to restore it. Exercising the paired artefact once is a documented task, not an optional courtesy.
2. **The peer-review control doubles as cross-training.** Every playbook and configuration change is reviewed by a second person before it is merged, and the review is recorded in the meeting minutes. This is a deliberate response to the scenario's due-diligence requirement for change applied through *reviewed, repeatable configuration* rather than by hand.
3. **No member holds the only copy of anything.** All artefacts are in Git on `vpnz-mon01` **and** mirrored to a second medium, so that a failed laptop loses work but not the project. No member is the sole holder of any artefact — this is an explicit baseline mitigation for the machine-failure risk.
4. **The vault password and the break-glass password are held by two different people.** The Ansible Vault password is held by the group with a sealed copy deposited with the supervisor; the `da-vertexpeak` break-glass password is sealed in a physical envelope held by the supervisor and is not used during normal operation, with any use logged in the report.

#### 12.5.5 Weekly rhythm

| Activity | When | Duration | Who | Output |
|---|---|---|---|---|
| **Stand-up** | Monday, start of session | 15 minutes | All four | Blockers stated and assigned; no minutes beyond the action line added to the weekly progress report |
| **Build blocks** | Monday to Thursday | Two protected blocks per member per week | Each member on their own line | Committed artefacts, run logs, screenshots staged in `C:\FYP\evidence\` |
| **Integration session** | Thursday, second half | 2 hours | All four, chaired by Member D as integration owner | The week's work joined and smoke-tested end to end; `09-verify-services.yml` run against the whole estate; failures logged as issues |
| **Review and gate** | Friday, first half | 90 minutes | All four, chaired by Member A as project lead | Week's evidence walked through against the gate criteria; defect triage; risk register updated; gate record written to `06-verification\` |
| **Documentation session** | Friday, second half | 2 hours | All four, facilitated by Member D | Each member's week written up while it is fresh; screenshots named, cropped, annotated and indexed; weekly progress report published |

The weekly rhythm is deliberately front-loaded: build early, integrate mid-week, and document while the detail is still remembered. Documentation written from memory in week 12 is the single most common cause of an evidence set that cannot be reconciled with the system it claims to describe.

### 12.6 Meeting and Review Cadence

| Meeting | Frequency | Chair | Attendees | Recorded as | Stored at |
|---|---|---|---|---|---|
| Stand-up | Weekly, Monday | Member A (project lead) | All four | Action lines only, appended to the weekly progress report | `C:\FYP\01-proposal\minutes\` |
| Integration session | Weekly, Thursday | Member D (integration owner) | All four | Integration notes: what was joined, what broke, issue IDs raised | `C:\FYP\01-proposal\minutes\` |
| Weekly review and gate | Weekly, Friday | Member A | All four | Gate record: criteria, evidence paths, verdict, residual actions | `C:\FYP\06-verification\gates\` |
| Documentation session | Weekly, Friday | Member D | All four, each presenting their own evidence | Evidence index update, findings-register rows | `C:\FYP\07-evidence\INDEX.md`, `C:\FYP\01-proposal\findings-register.md` |
| Supervisor review | Fortnightly, and at every phase gate | Supervisor | All four | Supervisor's decisions and any scope correction | `C:\FYP\01-proposal\minutes\` and `C:\FYP\02-design\decision-log.md` |
| Change-control board (short) | As required, within 48 hours of a change request | Member A | Requester plus the two members not otherwise affected | Change record with the fields in section 12.7 | `C:\FYP\02-design\decision-log.md` |
| Phase gate review | At the end of each of the seven phases | Member A | All four plus supervisor for P1, P4 and P7 | Gate record plus the phase's exit-evidence bundle | `C:\FYP\06-verification\gates\` |
| Defect triage | As required, twice weekly minimum in weeks 10–12 | Member D | Owner of the affected line plus one reviewer | Defect record with severity, owner, retest result | `C:\FYP\06-verification\defects.md` |

**What is recorded, and in what form.** Every meeting produces a dated entry containing: date and time; attendees and apologies; the agenda items; each decision in the form *decision — rationale — who is accountable — by when*; every action with an owner and a due date; and any change to the risk register or the issues log arising from it. Decisions that touch the interface contract are additionally recorded in the decision log at `02-design\decision-log.md` with the revision of the baseline they imply. Records live **inside the same repository** as the technical artefacts (`C:\FYP\01-proposal\`, `C:\FYP\02-design\`, `C:\FYP\06-verification\`) so that a reviewer can move from a weekly gate record to the evidence it cites to the configuration that produced it without leaving the repository.

### 12.7 Change Control

A change is anything that alters the interface contract, the addressing plan, the device or VM inventory, a pinned software version, a trust-boundary row, a test acceptance threshold, or a deliverable's scope. Freeze rules are absolute after their dates: the interface contract may not change after the end of week 6 except by formally re-issuing the baseline, and after week 9 no new technology may be added.

| Step | What happens | Who | Time limit | Output |
|---|---|---|---|---|
| 1. **Raise** | Requester completes a change record with the fields below and opens an issue labelled `type:change` | Any member | Immediately on discovering the need | Change record in `02-design\decision-log.md` |
| 2. **Assess** | Impact statement: which phases, work packages, trust-boundary rows, test cases and documents are affected; effort in half-days; effect on the critical path and float; risk introduced | Requester, plus the owner of each affected line as a consultant | 24 hours | Impact statement appended to the record |
| 3. **Decide** | Approve, reject, or approve with reduced scope. A change to the interface contract additionally requires three-of-four agreement and supervisor awareness | Member A chairs; three of four for contract changes, Member A alone for internal changes | 48 hours from assessment | Verdict and rationale, with the dissenting view recorded if there is one |
| 4. **Record** | The baseline is re-issued with a new revision row if the contract changed; the affected design section is corrected with a statement of what previously depended on the old value | Member A | Same day as the verdict | Revised baseline revision, decision-log entry, updated test cases |
| 5. **Propagate** | Every affected artefact is updated: configuration text, playbooks, test cases, traceability matrix, evidence index | Owner of each affected line | Before the next phase gate | Updated artefacts, with the change record ID referenced in the commit message |
| 6. **Verify** | The affected test cases are re-executed, not assumed still to pass | Owner of the affected test cases | At the next gate | Re-executed test record referencing the change ID |
| 7. **Close** | The change record is closed and the risk register is reviewed for any risk the change introduced | Member A | At the next weekly review | Closed record; risk register update if needed |

**Change record template fields.**

| Field | Content |
|---|---|
| Change ID | `CR-{nn}`, sequential |
| Date raised / raised by | Date; member |
| Title | One line |
| Reason | Why the change is needed, with the observation or defect that prompted it |
| Description | Exactly what will change, before and after |
| Category | Contract / addressing / inventory / version / trust boundary / test threshold / scope |
| Artefacts affected | Files, hosts, devices, test IDs, document sections |
| Impact on critical path | Days, and which work package |
| Impact on float | Days consumed, and from which work package |
| Risk introduced | New risks added to the register by ID, or "none" |
| Effort estimate | Half-days, by member |
| Alternatives considered | Including "do nothing" |
| Decision | Approved / rejected / approved with reduced scope |
| Decided by / date | Member A, or the three members for a contract change |
| Baseline revision | The revision issued, if any |
| Propagation checklist | Each affected artefact with a tick and a commit reference |
| Re-verification | Test IDs re-executed and their new results |
| Closed by / date | Member A; date |

**Worked example (illustrative, using a real open item).** *CR-04 — WireGuard site-to-site peer representation.* Reason: a Cisco IOS device cannot terminate WireGuard, and the WireGuard brief technology is a "must" item. Description: adopt resolution option (a) from the baseline — represent the Wan Chai encrypting gateway as an additional Ubuntu virtual machine `vpnz-wcwg01` with the inner address 10.10.200.5 on the WAN transport network — rather than option (b), remote-workers-only WireGuard with IPsec on the ASA for the branch. Category: inventory, design. Artefacts affected: the VM inventory table, the WireGuard test cases, the naming section, the topology diagram, the L2 chapter. Impact: no effect on the critical path; adds one VM and roughly one half-day of build. Risk introduced: none (the host RAM budget is reviewed and the VM is shut down outside tunnel tests). Decision: **approved**, closing open item O-04 at the end of week 6. Rationale recorded: option (a) keeps WireGuard in the design as a genuinely configured technology, which is what the brief asks for, and keeps the tunnel comparison in chapter 5 honest. Re-verification: the WireGuard handshake test case is re-run and the raw baseline row is corrected so that the report and the design cannot contradict one another.

### 12.8 Tooling for Project Management

| Tool | Role | Where it runs | Why this choice |
|---|---|---|---|
| **Git (bare repositories over SSH)** | Version control for every artefact: configuration, playbooks, scripts, report sections, evidence index, minutes | `vpnz-mon01` | It is the version-control tool the standard itself names, and it is already the automation substrate; no extra infrastructure is needed |
| **Issue tracker** | Tasks, changes, defects, risks and test execution items | Self-hosted on `vpnz-mon01`, or a hosted tracker if the group already has one **[ASSUMPTION: no licence is purchased; the free tier of a hosted tracker or the repository's own issue board is used]** | Issue IDs give every commit and every test record a citable anchor |
| **Markdown documents in Git** | All narrative deliverables and registers | Repository | Diffs are reviewable; no proprietary format locks evidence away |
| **Ansible and PowerShell run logs** | Machine-generated evidence of automation execution | `04-automation\runs\` | Timestamped, committed, and impossible to fabricate after the fact without leaving a trace |
| **Packet Tracer `.pkt` files** | Incremental evidence of network build progress | `03-build\packet-tracer\` | Five files show the build stages, not only the finished topology |
| **draw.io or LibreOffice Draw (offline)** | Topology and architecture diagrams for the report | Student laptops | Offline, so no dependency on Internet access at writing time |
| **Hypervisor snapshots** | Short-lived rollback points before risky changes | Hypervisor host | Explicitly **not** a backup; removed once the change is verified and documented |

**Issue tracker conventions.**

| Element | Convention | Example |
|---|---|---|
| Issue ID | Repository-sequential (`#123`) | `#47` |
| Title | `{line} — {artifact} — {outcome}` | `L3 — VP-HQ-FW-01 — deny DMZ→SRV per TB-04` |
| Type label | `type:task`, `type:change`, `type:defect`, `type:risk`, `type:test` | `type:test` |
| Line label | `line:L1` … `line:L5`, plus `line:doc` and `line:mgmt` | `line:L2` |
| Phase label | `phase:P1` … `phase:P7` | `phase:P4` |
| Priority label | `prio:must`, `prio:should`, `prio:could`, `prio:wont` — mirroring the baseline's four cut bands exactly | `prio:must` |
| Status | `backlog → in-progress → in-review → verified → closed`, with `blocked` as an explicit side state carrying the blocker and the member who must unblock it | `in-review` |
| Owner | Exactly one assignee, matching the **A** of the RACI matrix | Member B |
| Evidence link | Every issue that produces evidence carries a link to the file path in `07-evidence\` or `06-verification\`, and every evidence file's index row carries the issue ID back | `#47 → 07-evidence/2026-11-04_vpnz-nft01_tb04-deny.png` |
| Test linkage | Every `type:test` issue states the test case ID it executes and the requirement or trust-boundary row it verifies | `TC-SEC-03, TB-04` |
| Commit linkage | Commit messages end with the issue ID, so `git log` and the tracker reconstruct each other | `nft: add drop+log for DMZ→SRV  (#47)` |
| Definition of done | See below; an issue may not be closed without meeting every clause | — |

**Definition of done (applies to every issue without exception).**

1. The change is **applied** to the real system, not drafted.
2. It is **re-runnable** where it is automation: a second run produces no change (Ansible `changed=0`) or identical output (PowerShell and Bash).
3. It has been **executed by someone other than its author at least once**, or a reviewer has run it in `--check` mode; the reviewer is named in the issue.
4. The **verification record** exists with the exact command, the expected result, the observed result, the screenshot reference, the date and the performer's initials.
5. **Evidence is named and indexed**: the file follows `{date}_{host}_{what}.png` and has a row in the master evidence index.
6. The **traceability matrix** is updated if the issue touches a brief technology, an objective or a trust-boundary row.
7. **Secrets were not committed**: the pre-tag sweep for keys, `wg*.conf`, `pki/` material and plaintext passwords is clean for the change.
8. The **risk register and findings register** are updated if the work changed an assumption or revealed unexpected behaviour.
9. The affected **document section is updated in the same week**, not deferred.

Clause 3 and clause 4 are the two most valuable clauses and the two most tempting to skip; they are what turn an issue tracker into an assessment instrument rather than a to-do list.

### 12.9 Contingency and Re-planning

The contingency plan is a **fixed cut order**, decided in advance. Cutting under pressure without a pre-agreed order produces inconsistent decisions, and the baseline's risk R-02 identifies schedule overrun from attempting full depth as a High/High risk. The order below is derived directly from the baseline's four cut bands.

| Priority | Band | Content | Cut order |
|---|---|---|---|
| 1 | **must** | L1: AD DS, DNS, DHCP, GPO, PKI, FSRM. L2: Nginx reverse proxy, Keepalived, nftables. L3: OSPF, RSTP, ASA policy. L4: three PowerShell scripts and three playbooks, Git workflow. L5: at least two AI capabilities demonstrated. Documentation set, evidence set and traceability matrix. | **Never cut.** If the must band is at risk, the schedule is re-planned by reducing the *depth* of should-band work, not by cutting a must item |
| 2 | **should** | L1: iSCSI, RRAS IKEv2. L3: EIGRP and BGP, port security, DHCP snooping. L2: WordPress pair, monitoring stack with Loki. | Cut first, in reverse order: Loki, then the WordPress second node, then BGP failover capture, then EIGRP, then iSCSI to a single LUN |
| 3 | **could** | Voice (CUCM Express), two-tier PKI, Restic off-host configuration backup, MCP tool bridge | Cut second, and only after the should band is exhausted; voice is cut first because it is explicitly a supporting demonstration and not a claimed brief line |
| 4 | **won't** | Everything in the baseline's "NOT COVERED" rows: Windows Server failover clustering, SOFS, Storage Spaces Direct, advanced BGP (route reflectors, confederations, RPKI), multi-area OSPF beyond one ABR, Cisco SDN, Docker and Kubernetes, Terraform, PowerShell DSC, autonomous agent remediation, model hosting and fine-tuning, predictive analytics, network digital twin | **Not cut — never in scope.** These appear in the report as future work, never as delivered capability |

**Re-planning triggers and responses.**

| Trigger | Response | Owner |
|---|---|---|
| Any critical-path work package slips more than two working days | Convene a change-control board within 24 hours; consume should-band float; if none remains, apply the cut order from the bottom of the should band upwards | Member A |
| More than half of total float consumed by end of week 6 | Freeze the interface contract early (it is due at end of week 6 anyway) and stop accepting new "could" work | Member A |
| Feasibility-spike outcome is fallback F1 or F3 for the AI line | Adopt the fallback immediately; do **not** spend further weeks re-attempting OpenClaw; the chapter is written as a proof of concept with declared scope | Member D |
| Host RAM exhaustion prevents the full estate running at once | Adopt the two-shift fallback: run the server-zone estate and the DMZ estate in separate shifts and record the reduction honestly | Member D |
| A version pin cannot be met | Record the deviation, state its impact, and fall back to the named alternative (for example Windows Server 2022 in place of 2025, VirtualBox in place of Workstation Pro, or the distribution-packaged version of a component) | Owner of the affected line |
| A Packet Tracer discrepancy consumes more than half a day | Stop, record the discrepancy as an experiment result, and move on — a documented discrepancy is legitimate academic content, whereas a lost week is not | Member C |
| Test execution reveals a defect in the must band after the technology freeze | Fix it if the fix is contained; otherwise invoke the change-control board, because the must band is non-negotiable | Member A |

**Non-negotiable items.** Four things are not subject to the cut order, and the proposal states them explicitly so that no future reader can claim they were quietly dropped:

1. **The documentation set itself** — findings, manuals, steps, screen captures, verifications and references. It is the HDTN brief's own requirement, and the standard independently requires a technical document prepared for agreement and sign-off within a 25 %-weighted domain.
2. **The evidence set and the traceability matrix** — without them, no claimed result can be demonstrated, and the project cannot be assessed.
3. **Security correctness of the trust-boundary rows marked DENY** — DMZ to internal, Internet to internal, student lab to everything, VPN users to the management zone, and branch WAN to the management zone. A design that permits any of these is not the design that was approved.
4. **Honesty about what was and was not done** — the "NOT COVERED" rows, the version deviations, the Packet Tracer limitations and any AI failure modes remain in the report whatever the schedule pressure. The failure mode this project must avoid, in the baseline's own words, is a report that contradicts its own design.

## 13. Testing, Verification and Acceptance

### 13.1 Test Strategy

Testing is organised into four levels and five types, and every test produces a named artefact. The strategy is deliberately **evidence-first**: a test that leaves no artefact has not been executed, whatever the person who ran it remembers.

#### 13.1.1 Test levels

| Level | What it tests | Scope | Typical method | Evidence produced |
|---|---|---|---|---|
| **L-A Unit / component** | One service, one script, one configuration block in isolation | A single VM or a single playbook task | `nginx -t`; `nft -c -f /etc/nftables.conf`; `dcdiag /test:dns`; a Pester-style self-test of one PowerShell function; `--check` mode of one playbook | Command transcript, exit status, screenshot where the output is a GUI |
| **L-B Integration** | Two or more components together across a boundary | Service-to-service, host-to-host, script-to-host | Ansible playbook run against the inventory; `Test-WSMan` from the control node; iSCSI initiator to target; VPN client to VPN server; Nginx upstream to web farm | Run log in `04-automation\runs\`; annotated screenshot; `--diff` output |
| **L-C System** | The whole designed estate behaving as a system along the service dependency chain | All zones, all lines | End-to-end published-service path; the port matrix executed as a test; `09-verify-services.yml`; routing convergence across sites | Executed test record per test case; service-endpoint test log; topology screenshots |
| **L-D Acceptance** | The formal conditions of section 13.10, demonstrated to a human | The delivered solution as a whole | Structured demonstration with a scripted run-sheet; documentation review against the standard's sign-off line; user-acceptance walkthrough | Acceptance record with signature and date; demonstration run-sheet with the outcome of each step |

#### 13.1.2 Test types

| Type | Purpose | Where it appears | Evidence |
|---|---|---|---|
| **Functional** | Does the feature do what the design says | Everywhere; the bulk of the test suite | Command output, screenshots, and the expected/actual comparison in the executed test record |
| **Failover and resilience** | Does the design survive the loss of a component | Section 13.4 | Timed sequences, log excerpts from both sides of the failure, service-continuity capture |
| **Security** | Is the zone-to-zone policy matrix enforced, is authentication certificate-based, and are management interfaces unexposed | Section 13.5 | Denial log lines, `curl`/`nc`/`Test-NetConnection` results, port-scan output, certificate chain output |
| **Performance and capacity** | What the estate can sustain, and what demonstrates the measurement method | Section 13.6 | `iperf3` JSON output, Prometheus range queries, Grafana panel exports |
| **Regression** | Did a change break something that previously passed | Every phase gate; the verification playbook is the harness | Re-run log of `09-verify-services.yml`; the previously-passing test list with the re-run result |

#### 13.1.3 Evidence each level produces, and where it goes

| Artefact | Produced by | Stored at | Indexed in |
|---|---|---|---|
| Screenshot (PNG) | Every GUI-based check, every PT topology state | `07-evidence\` | Master evidence index |
| Command transcript | Every CLI-based check, Windows, Linux and Cisco | `06-verification\transcripts\` | Executed test record |
| Executed test record | Every test case | `06-verification\` | Traceability matrix |
| Automation run log | Every playbook, script and Bash run | `04-automation\runs\` | Test record and evidence index |
| Configuration export | End of every phase | `03-build\` and the TFTP/SCP archive on `vpnz-mon01` | Backup register |
| Defect record | Every failed test | `06-verification\defects.md` | Issue tracker |
| Gate record | End of every phase | `06-verification\gates\` | Weekly progress report |

### 13.2 Test Environment and Data

**Lab setup.** Testing is performed on the same estate that is delivered — there is no separate test environment, because there is no second host and the design's whole purpose is to be reproducible from one. The environment is therefore defined precisely so that a test result is meaningful.

| Element | Configuration used for testing |
|---|---|
| Hypervisor host | `vpnz-hvhost01`, management address 10.20.20.10, one student-owned machine, host-only networks only, bridged networking forbidden |
| Virtual networks | Nine host-only networks with the hypervisor's own DHCP service disabled on every one, so that the AD DHCP service is the only DHCP authority: management, core, server, egress, DMZ, lab, user, storage and WAN-transport |
| VM estate | Windows Server guests for identity, file, storage, remote access, two DMZ web nodes, the jump box and the branch RODC; Ubuntu Server guests for the remote-access/CA host, the monitoring and automation control node, the agent runtime, both nftables nodes, both reverse-proxy nodes, both WordPress nodes and the DMZ jump host |
| Network estate | 16 Packet Tracer logical devices: two HQ core switches, four HQ access switches, the HQ edge router, the ASA, three branch edge routers, three branch access switches, the simulated provider edge and the voice device |
| Client under test | A student laptop joined to the domain over the lab network for the user-experience checks, or a workgroup laptop for the VPN client tests |
| Anycast of authority | `vpnz-dc01` is the authoritative time source; a Kerberos failure caused by time skew is a documented troubleshooting scenario, so clock integrity is verified before any authentication test |

**Test accounts.**

| Account | Purpose in testing | Group membership | Notes |
|---|---|---|---|
| `adm-a`, `adm-b`, `adm-c`, `adm-d` | Administrative test actions, each attributable to a person | `GG-Server-Admins`; two of the four also `GG-Tier0-Admins` | The Tier-0 pair are the only accounts permitted to touch `vpnz-dc01/02` |
| `svc_ansible` | Ansible running against Windows targets over WinRM | `GG-WINRM-Admins` only | Used by every Windows playbook test |
| `svc_monitoring` | Performance-counter and SNMPv3 read in the monitoring tests | `GG-Monitoring-Readers` | Least privilege is part of the test |
| `svc_aiagent` | The agent's read-only credential in the AI tests | `GG-AI-ReadOnly` only | Must never be a member of Domain Admins; membership is itself a test |
| `svc_ldapbind` | The WordPress LDAP bind in the DMZ test | `GG-DMZ-LDAP-Readers` | Only the bind account may read the directory from the DMZ |
| `svc_backup` | Backup job and backup-share access tests | `GG-Backup-Operators` | — |
| `svc_git` | Git access from the control node | `GG-DevOps-Users` | — |
| Test user `testuser01` | Ordinary-user tests: drive mapping, quota, file-screen and RDP-denial tests | `GG-Finance-RW` | Deliberately not privileged |
| Test user `testvpn01` | VPN authorisation tests | `GG-VPN-Users`, and in a second phase `GG-VPN-ProfServices` | The group difference is what the RDP-to-platform test depends on |
| `da-vertexpeak` | Break-glass only; **not used in testing** | `Domain Admins` | Any use must be logged; its envelope is held by the supervisor |

**Test data.** All data is fictional and is generated by the group. There is no real customer data, no real personal data, and no real public address anywhere in the lab — public addresses come only from the documentation ranges, and published names end in `.example`. Test data consists of: a synthetic user population (roughly 160 fictional staff objects spread across the OU tree so that group-scope and delegation tests are meaningful); four FSRM shares with named quota templates and a blocked-file-type file screen; three iSCSI LUNs with generated content for the mount and reconnect tests; a generated ASP.NET sample application and a WordPress content set authored by the group; a deliberately long-lived certificate and a deliberately revoked one for the revocation and expiry tests; and, for the security tests, an intentionally isolated lab segment used as the source of the deliberate-misuse traffic.

**Environment reset between major test cycles.** Snapshots are the reset mechanism, and their limitations are stated as prominently as their use:

1. Take a named hypervisor snapshot of every VM in the scope of the cycle before the cycle begins, named `{yyyymmdd}-{cycle}-{host}`.
2. Run the cycle. Record every test result against that snapshot baseline in the executed test record.
3. At the end of the cycle, **revert to the pristine snapshot** rather than repairing the estate, so the next cycle starts from a known state. Repairs are what make later tests irreproducible.
4. Where a configuration is managed by Ansible or a script, prefer re-running the automation over reverting the snapshot, because re-running also re-proves idempotence. Use the snapshot only where the change was manual.
5. Export the current configuration of every network device and every service to the archive before reverting, so the previous cycle's evidence remains reconstructable.
6. Remove the snapshot once the cycle's evidence is complete and indexed. **Snapshots are never treated as a backup**: they share the same failure domain as the estate, they are not validated by a restore, and the design's backup path is the configuration and evidence backup to `D:\iSCSI\LUN02` and the off-host restic job to `vpnz-dmzjump01`.
7. For Packet Tracer, the reset mechanism is different and simpler: each test cycle starts from a named `.pkt` file committed to Git, so the topology and every device configuration are restored by opening a specific version.

**Limitation to record with every result from this environment.** There is no physical hardware. No test in this project measures real forwarding hardware, real ASIC behaviour, real cabling, real power, real clock behaviour or real Internet connectivity. Packet Tracer results are simulator behaviour; VM results are hypervisor-mediated behaviour; and both are reported as such.

### 13.3 Per-Line Test Cases

Test identifiers follow the project's convention `TC-{LINE}-{NN}`. The **Actual result** and **Pass/Fail** columns are intentionally empty in this proposal: they are filled in during execution and reproduced in the verification chapter, which is the honest presentation of a plan rather than a claim.

#### 13.3.1 L1 — Microsoft Server Networking and Network Services

| ID | Requirement / design element under test | Procedure or command (exact) | Expected result | Actual result | Pass/Fail |
|---|---|---|---|---|---|
| TC-L1-01 | AD DS forest and domain health (`vertexpeak.fyp.lab`, functional level Windows Server 2025) | Run `dcdiag /v /c /d /e /s:vpnz-dc01 > C:\FYP\logs\dcdiag-dc01.txt` on `vpnz-dc01`; then on `vpnz-dc02` | All tests pass; no errors in DNS, replication, services, system log or advertising | | |
| TC-L1-02 | Replication between `vpnz-dc01` and `vpnz-dc02` and to the RODC | `repadmin /replsummary` and `repadmin /showrepl vpnz-dc01`; then `repadmin /syncall /AdeP` and re-check | Zero failures and zero errors across all partitions; the RODC appears as a replication partner | | |
| TC-L1-03 | FSMO role placement and transfer | `netdom query fsmo` on `vpnz-dc01`; then `Move-ADDirectoryServerOperationMasterRole -Identity vpnz-dc02 -OperationMasterRole PDCEmulator -Confirm:$false`; then re-query | Before: all five roles on `vpnz-dc01`. After: PDC emulator on `vpnz-dc02`; the estate still authenticates | | |
| TC-L1-04 | AD-integrated DNS forward zone and records | `Get-DnsServerZone`; `Resolve-DnsName vpnz-dc01.vertexpeak.fyp.lab`; `Resolve-DnsName portal.vertexpeak.fyp.lab`; `Resolve-DnsName vpnz-san01.vertexpeak.fyp.lab` | Zone `vertexpeak.fyp.lab` AD-integrated, secure updates only, scavenging 7 days; every static host resolves to its documented address; `portal` resolves to 10.10.90.10 | | |
| TC-L1-05 | Reverse zones and PTR records | `Resolve-DnsName 10.10.30.11 -Type PTR`; `dnscmd /zoneexport` for each reverse zone | Every static host has a matching PTR in the correct `in-addr.arpa` zone; the branch reverse zone is delegated to the RODC | | |
| TC-L1-06 | DHCP scope, options and lease behaviour | `Get-DhcpServerv4Scope`; `Get-DhcpServerv4OptionValue -ScopeId 10.10.40.0`; renew a lease on a test client and run `ipconfig /all` | Option 003 = 10.10.40.254, 006 = 10.10.30.11 then 10.10.30.12, 015 = `vertexpeak.fyp.lab`, 119 = `fyp.lab`, 121 route, 150 for voice; lease 8 h; the client accepts the lease | | |
| TC-L1-07 | DHCP failover partner relationship (80/20) | `Get-DhcpServerv4Failover`; `Get-DhcpServerv4FailoverStats`; then stop the DHCP service on `vpnz-dc01` and request a new lease | Partner relationship active, load balance 80/20, `MaxClientLeadTime` 1 h, state switchover 60 min; the client still receives a lease from `vpnz-dc02` | | |
| TC-L1-08 | GPO baseline security applied to workstations | `gpresult /h C:\FYP\evidence\gpresult-ws.html` on a workstation; `Get-GPOReport -All -ReportType Html` on `vpnz-dc01` | `GPO-WS-Baseline-Security` and `GPO-WS-Deploy-CA-Root` applied; firewall on for all profiles; LLMNR off; SMB signing required; screen lock 10 minutes | | |
| TC-L1-09 | Certificate auto-enrolment and internal TLS trust | `certutil -pulse` on a member server; `Get-ChildItem Cert:\LocalMachine\My`; browse to an internal TLS service | The IKEv2 machine template is auto-enrolled; the root and issuing CA are in the Trusted Root store; no name-mismatch or untrusted-issuer warning for internal names | | |
| TC-L1-10 | TLS chain presented by an internal service | `openssl s_client -connect 10.10.30.11:636 -showcerts < NUL` from `vpnz-mon01` | The chain is complete from the leaf to the internal root; no "unable to verify" error on Linux, because the internal CA is installed under `/usr/local/share/ca-certificates/` | | |
| TC-L1-11 | LDAPS on the domain controllers | `ldp.exe` connect to `vpnz-dc01` on port 636 with the internal CA trusted | Bind succeeds over LDAPS; the certificate shown matches the domain-controller template SANs | | |
| TC-L1-12 | FSRM quota enforcement | `Get-FsrmQuota`; `Get-FsrmQuotaTemplate`; then as `testuser01` copy a file larger than the remaining quota into `\\vpnz-fs01\Shares\Finance` | Quota template `20 GB Finance` applied; the write fails with an insufficient-space error | | |
| TC-L1-13 | FSRM file screening | `Get-FsrmFileScreen`; `Get-FsrmFileGroup`; then copy a blocked file type into the Engineering share | File group `Blocked-Executables` active; the copy is refused and an event is logged | | |
| TC-L1-14 | Share permissions and least privilege | As `testuser01` (Finance RW) attempt to read the Engineering share; as `testuser01` attempt to write to the Sales read-only share | Finance RW succeeds in Finance and is denied in Engineering; the write to Sales is denied | | |
| TC-L1-15 | iSCSI target, LUNs and CHAP | On `vpnz-san01`: `Get-IscsiServerTarget`, `Get-IscsiVirtualDisk`. On the initiator: `Get-IscsiSession`, `Get-Disk`, `diskpart` → `list volume` | Three LUNs present (20 GB, 40 GB, 60 GB thin); CHAP one-way enabled per initiator; session state Connected; the mounted volume appears as a disk | | |
| TC-L1-16 | iSCSI reconnect after target restart | Note the LUN content hash; restart the iSCSI Target service on `vpnz-san01`; on the initiator `Get-IscsiSession` and re-verify the hash | The session re-establishes and the volume remains accessible with content unchanged | | |
| TC-L1-17 | RRAS installed and configured as designed | `Get-RemoteAccess`; `Get-RemoteAccessVpnConfiguration`; `Get-VpnServerIPsecConfiguration` | RRAS configured for IKEv2 only; no PPTP, no L2TP preshared key, no SSTP; NAT is not used (egress NAT belongs to the nftables pair) | | |
| TC-L1-18 | IKEv2 remote access with certificate authentication, split tunnelling disabled | On a Windows 11 client with an auto-enrolled machine certificate: `Add-VpnConnection -Name "VP-IKEv2" -ServerAddress vpn.vertexpeak.fyp.lab -TunnelType IKEv2 -AuthenticationMethod MachineCertificate -SplitTunneling:$false`; then `Get-VpnConnection`; `route print` | Connection state Connected; authentication method EAP/machine certificate; routing table shows the default route through the tunnel (all traffic tunnelled) | | |
| TC-L1-19 | NPS authorisation requires both certificate and group membership | As `testvpn01` without a certificate, attempt to connect; then add the certificate and retry as a user who is not in `GG-VPN-Users`; then retry as a member | Denied without a certificate; denied without group membership; permitted with both. NPS log records the decision and the reason | | |
| TC-L1-20 | Time source integrity (prerequisite for Kerberos) | `w32tm /query /status` on the DCs; `w32tm /stripchart /computer:vpnz-dc01 /samples:5` from a member server; `klist` after a domain logon | `vpnz-dc01` synchronises to the simulated provider; members sync from the domain hierarchy; skew well under 5 minutes; Kerberos tickets obtained normally | | |
| TC-L1-21 | RODC behaviour at Kwun Tong | On `vpnz-brdc01`: `dcdiag /test:dns`; `Get-ADDomainController -Filter *`; simulate the HQ WAN outage in Packet Tracer and attempt a branch logon with a cached credential | The RODC serves DNS and cached identity; the branch logon succeeds during the WAN outage with a previously cached credential | | |
| TC-L1-22 | AD Recycle Bin restore | Delete a test OU containing one user; `Get-ADObject -Filter {isDeleted -eq $true} -IncludeDeletedObjects -Properties LastKnownParent`; `Restore-ADObject` | The deleted OU and user are restored with the same distinguished name and group memberships | | |
| TC-L1-23 | Tier-0 administrative separation | As `adm-c` (Tier-0) attempt interactive logon to `vpnz-dc01`; as `adm-a` (Tier-1) attempt the same | Tier-0 logon permitted; Tier-1 interactive logon refused by policy, with the refusal derived from `GPO-SRV-Tier0-Baseline` | | |
| TC-L1-24 | PowerShell transcription and script-block logging | `Get-ItemProperty HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\Transcription`; run a command; inspect `\\vpnz-fs01\Logs` | Transcription and script-block logging enabled by `GPO-WS-PowerShell-Logging`; the executed command appears in the centralised log — this is the audit trail the scenario's due-diligence item requires | | |
| TC-L1-25 | Windows Server Backup configuration and a restore | `Get-WBPolicy`; run the scheduled backup; then restore one file to an alternate location and compare content | The policy targets the iSCSI backup LUN; the restore returns a byte-identical file | | |

#### 13.3.2 L2 — Linux Server Administrations

| ID | Requirement / design element under test | Procedure or command (exact) | Expected result | Actual result | Pass/Fail |
|---|---|---|---|---|---|
| TC-L2-01 | Nginx configuration validity across the proxy and WordPress nodes | `sudo nginx -t` on `vpnz-dmzrev01`, `vpnz-dmzrev02`, `vpnz-dmzwp01`, `vpnz-dmzwp02` | `syntax is ok` and `test is successful` on every node | | |
| TC-L2-02 | Reverse proxy publishes the portal with TLS termination | `curl -kI https://portal.vertexpeak.example` and `curl -I --resolve portal.vertexpeak.example:443:10.10.90.10 https://portal.vertexpeak.example` from `vpnz-mon01` | HTTP 200 (or a 301 that resolves to 200); response served by the proxy; the access log records the request | | |
| TC-L2-03 | HTTP redirects to HTTPS rather than serving content | `curl -I http://portal.vertexpeak.example`; `curl -I http://blog.vertexpeak.example` | 301 with a `Location:` header pointing at the HTTPS URL; no content served over plain HTTP | | |
| TC-L2-04 | TLS protocol floor and cipher evidence | `openssl s_client -connect 10.10.90.10:443 -tls1_2`; then `-tls1_3`; then `-tls1_1` | TLS 1.2 handshake succeeds; TLS 1.3 succeeds; TLS 1.1 is refused; HSTS header present in the response | | |
| TC-L2-05 | Upstream load distribution across the web farm | `grep -c "upstream" /var/log/nginx/access.log` after 20 requests; `curl` in a loop 20 times; compare the two IIS nodes' logs | Requests are distributed across both upstream nodes in `weba_pool`; no upstream marked down while both are healthy | | |
| TC-L2-06 | Upstream failover when one node is unavailable | Stop the IIS service on `vpnz-dmzweba01`; issue 10 requests; check the proxy error log and the surviving node's log | Requests are served by `vpnz-dmzweba02`; the proxy log shows the failed node marked down and later recovered (`fail_timeout`) | | |
| TC-L2-07 | Keepalived VRRP instance for the proxy pair (VRID 61) | `sudo systemctl status keepalived`; `ip -br a | grep 10.10.90`; `sudo journalctl -u keepalived -n 50` | The VIP 10.10.90.10 is present on exactly one node; VRRP state MASTER on one, BACKUP on the other; the track script reports healthy | | |
| TC-L2-08 | Keepalived VRRP instance for the egress pair (VRID 51) | Same procedure on `vpnz-nft01` and `vpnz-nft02` for VIP 10.10.50.10 | The VIP is present on exactly one node; VRID 51 is not reused on any other segment; track script includes an nftables-ruleset check | | |
| TC-L2-09 | nftables ruleset loads and validates | `sudo nft -c -f /etc/nftables.conf`; `sudo nft list ruleset` | No syntax errors; `table inet fyp_filter` present with `policy drop` on input and forward, `ct state established,related accept`, the trusted-peer sets, `masquerade` on the WAN interface, and a `log prefix` before every drop | | |
| TC-L2-10 | Service tracking actually tests the service, not just the interface | On the master, stop Nginx; wait for the track interval; check VRRP state on both nodes | The track script fails, priority drops, and the VIP moves to the backup node | | |
| TC-L2-11 | nftables atomic apply with rollback protection | Run `sudo ./02-nftables-apply.sh`; confirm the revert timer is armed; deliberately load a ruleset that would block the SSH session and observe the automatic revert | The revert timer restores the previous working ruleset within the configured window; the SSH session survives — the documented lockout mitigation | | |
| TC-L2-12 | Egress NAT behaviour | On `vpnz-nft01`: `sudo nft list ruleset | sed -n '/nat/,/}/p'`; from a server-zone host, `ip route`; `curl -sI` a permitted destination and inspect the source address seen at the far end (simulated) | Inside addresses are masqueraded to the egress interface address; no double NAT; return traffic is permitted by the connection-tracking rule | | |
| TC-L2-13 | WireGuard tunnel `WG-HQ-WC` negotiation | On the peer: `sudo wg show`; ping across the tunnel; `sudo wg show all dump` on both ends | A recent handshake on both sides; peer endpoint and allowed IPs exactly as designed; no `0.0.0.0/0` on the site-to-site peer | | |
| TC-L2-14 | WireGuard remote-access pool | Bring up a client configuration from `10.10.200.64/26`; `sudo wg show`; `ip route` on the client | Handshake succeeds; the client address comes from the dedicated remote pool and does not overlap any LAN, management or lab space | | |
| TC-L2-15 | WireGuard configuration file protection | `sudo stat -c "%a %U:%G" /etc/wireguard/wg0.conf`; `git check-ignore -v wg0.conf`; `git log --all --full-history -- '*wg0.conf'` | Mode is 0600 root:root; the file is ignored by Git; the Git history contains no version of it | | |
| TC-L2-16 | OpenVPN server operation and PKI | `sudo systemctl status openvpn-server@server`; `sudo openvpn --config /etc/openvpn/server/server.conf --test-crypto`; client connects with `client-testuser01.ovpn` | The service is active; the TLS handshake completes; the client receives an address from 10.10.202.0/24 and the pushed routes | | |
| TC-L2-17 | Easy-RSA CA, server and client certificates | `cd /etc/openvpn/easy-rsa && ./easyrsa show-cert server-vpnz-lnxra01`; `./easyrsa show-cert client-testuser01` | Certificates issued by the Easy-RSA CA with the expected subjects; the server certificate CN matches the documented value | | |
| TC-L2-18 | Certificate revocation is enforced | `./easyrsa revoke client-testuser01` then `./easyrsa gen-crl`; attempt to connect with the revoked profile | The connection is refused; the server log names the revoked certificate — a documented requirement, not an optional extra | | |
| TC-L2-19 | Linux hardening baseline applied | `sudo sysctl -a | grep -E "ip_forward|rp_filter|tcp_syncookies"`; `sudo sshd -T | grep -E "permitrootlogin|passwordauthentication|allowgroups"`; `systemctl is-enabled apparmor` | `rp_filter` and SYN-cookie settings as designed; `PermitRootLogin no`; password authentication disabled for Linux-to-Linux; `AllowGroups gg-infra-admins`; AppArmor left at distribution defaults, and that fact is stated rather than implied | | |
| TC-L2-20 | SSH key-only administration with named accounts | `ssh adm-a@vpnz-mon01` using the key; attempt `ssh root@vpnz-mon01`; attempt password authentication with `ssh -o PreferredAuthentications=password` | Key-based logon as `adm-a` succeeds; root logon refused; password authentication refused | | |
| TC-L2-21 | Centralised syslog forwarding | `sudo systemctl status rsyslog`; generate a test message; on `vpnz-mon01` inspect `/var/log/remote/{host}.log` | `50-fyp-forward.conf` forwards to 10.10.30.31:514; the message appears under the sending host's own file | | |
| TC-L2-22 | WordPress tier serves the blog front end | `curl -kI https://blog.vertexpeak.example`; `mysql -e "show databases;"` on `vpnz-dmzwp01` | HTTP 200 through the proxy to the WordPress pair; the database is reachable only locally and is not exposed on the network | | |
| TC-L2-23 | Database and fast-CGI sockets are not network-exposed | From another host: `nc -zv 10.10.90.25 3306`, `nc -zv 10.10.90.25 9000`; on the host: `sudo ss -lntp` | Both connection attempts are refused from off-host; `ss` shows the listeners bound to loopback only | | |
| TC-L2-24 | Certificate expiry monitoring | `sudo ./05-cert-renew.sh --check`; `openssl x509 -in /etc/nginx/ssl/portal.crt -noout -dates` | The script reports remaining validity and warns below threshold; certificates are within the documented 397-day maximum and the 90-day preferred window is stated | | |
| TC-L2-25 | Linux file system and volume management | `lsblk -f`; `sudo mdadm --detail /dev/md0` (if used); `sudo lvs`; `df -hT` | Volumes and file systems match the design; the choice between software RAID, LVM and plain volumes is documented rather than assumed | | |

#### 13.3.3 L3 — Cisco Networking

| ID | Requirement / design element under test | Procedure or command (exact) | Expected result | Actual result | Pass/Fail |
|---|---|---|---|---|---|
| TC-L3-01 | eBGP session to the primary provider (AS 65001 to AS 65000) | `show ip bgp summary` on `VP-HQ-EDGE-01` | Session state Established; prefixes received from the provider; no dampening on the neighbour | | |
| TC-L3-02 | eBGP to the alternate provider and path preference (AS 65002) | `show ip bgp summary`; `show ip bgp`; `show ip route bgp` | Both sessions Established; the primary path is preferred by local preference; the alternate path is present as a valid backup | | |
| TC-L3-03 | BGP prefix control and session loss | `show ip bgp neighbors 10.10.100.2 advertised-routes`; then `shutdown` the primary interface and re-run `show ip bgp summary` and `show ip route bgp` | Advertised and received prefixes match the route-map policy; after the shutdown the alternate path becomes active | | |
| TC-L3-04 | OSPF area 0 adjacency between HQ and Kwun Tong | `show ip ospf neighbor`; `show ip ospf interface brief` on `VP-HQ-EDGE-01` and `VP-BR-EDGE-01` | Neighbour state FULL on the WAN link; the correct area and authentication type; passive interfaces on access ports | | |
| TC-L3-05 | OSPF route propagation and default information | `show ip route ospf`; `show ip protocols`; on the branch `show ip route` | Branch learns HQ routes as OSPF entries; the default route originates at `VP-HQ-EDGE-01`; no unwanted routes are redistributed | | |
| TC-L3-06 | EIGRP AS 100 at Macau | `show ip eigrp neighbors`; `show ip eigrp topology`; `show ip protocols` on `VP-MO-EDGE-01` and `VP-HQ-EDGE-01` | Neighbour adjacency up in AS 100, classic mode; expected successors present; administrative distance left at the default of 90, and the design's reliance on the default is stated | | |
| TC-L3-07 | One-way tagged redistribution between EIGRP and OSPF | `show ip protocols`; `show route-map`; `show ip route 10.10.120.0` on a Kwun Tong device | Redistribution occurs at exactly one router with route tag 100 for OSPF and 200 for EIGRP; only routes with the expected tag are re-redistributed; no mutual un-tagged redistribution exists | | |
| TC-L3-08 | Routing-loop safety after a deliberate misconfiguration | Temporarily introduce an un-tagged mutual redistribution, observe the routing table on `VP-HQ-EDGE-01`, then remove it and re-verify with `show ip route 10.10.120.0` and `traceroute` | The misconfiguration produces observable instability or an incorrect path; after removal the correct path returns. The scene is recorded as an experiment with its finding, which is legitimate troubleshooting evidence | | |
| TC-L3-09 | HSRP group 1 active and standby roles | `show standby brief`; `show standby` on `VP-HQ-CORE-01` and `VP-HQ-CORE-02` | Core 01 Active with priority 150 and preempt; Core 02 Standby with priority 100; virtual MACs `0000.0c07.ac01` (group 1, VLAN 30), `0000.0c07.ac02` (group 2, VLAN 40), `0000.0c07.ac03` (group 3, VLAN 70) and `0000.0c07.ac04` (group 4, VLAN 80); each VIP is the default gateway of its own VLAN, one group per SVI | | |
| TC-L3-10 | RSTP root bridge and port roles | `show spanning-tree`; `show spanning-tree root` on all HQ switches | `VP-HQ-CORE-01` is root primary and `VP-HQ-CORE-02` root secondary for the design's VLANs; the expected root and alternate ports appear on each access switch | | |
| TC-L3-11 | RSTP topology change and reconvergence | Pull (shut) the active uplink on one access switch with `show spanning-tree detail` visible; capture the before and after states | The blocked port becomes forwarding; the previous port becomes non-designated or alternate; the sequence is captured in simulation mode. The timing is a simulator artefact and is labelled as such | | |
| TC-L3-12 | Access-port hardening and trunk discipline | `show interfaces status`; `show running-config interface range`; `show interfaces trunk` | Unused access ports are in VLAN 999 and shut down; `switchport nonegotiate`, `portfast` and `bpduguard enable` on end-user ports; native VLAN 999 on every trunk; VLAN 1 carries no traffic | | |
| TC-L3-13 | Port security blocks an unauthorised MAC | `show port-security interface`; connect a second device with a different MAC; re-check | The violation counter increments and the port takes the configured action; the event is logged | | |
| TC-L3-14 | DHCP snooping and rogue DHCP blocking | `show ip dhcp snooping`; connect a simulator server with DHCP enabled on an untrusted access port and request a lease from a client | Trusted ports are the uplinks to `VP-HQ-CORE-01/02` only; the rogue OFFER is dropped; the client receives a lease only from the authorised DHCP server. In simulation mode the dropped packet is visible | | |
| TC-L3-15 | ASA denied flow for the DMZ boundary (TB-04) | On `VP-HQ-FW-01`, from `vpnz-dmzweba01` (10.10.90.21) attempt TCP 445 to `vpnz-fs01` (10.10.30.21); capture the ASA log and the session table | The flow is denied by the DMZ outbound ACL `ACL-DMZ-OUT-10`; `show logging` shows a deny entry citing the ACL and the source/destination; `show conn` shows no session | | |
| TC-L3-16 | ASA permitted flow — Internet to the published portal only (TB-05) | From the simulated Internet, HTTP/HTTPS to 198.51.100.2; then HTTPS to 10.10.90.21 directly | The port-forwarded flow to the proxy VIP succeeds; a direct attempt to the web node from the Internet fails; `show nat detail` shows the static mapping for the VIP only | | |
| TC-L3-17 | ASA permitted and denied flows for the VPN front door (TB-06) | From the simulated Internet, UDP 500 and 4500 to 198.51.100.5; then TCP 3389 to 198.51.100.5 and TCP 443 to 10.10.30.21 | The VPN ports are permitted and reach the VPN endpoints; the RDP and the direct server-zone attempts are denied and logged — only the two VPN endpoints are Internet-reachable | | |
| TC-L3-18 | ASA security levels and inside-out NAT | `show interface ip brief`; `show run nat`; from a user VLAN browse to a simulated external site | Security levels outside 0, dmz 50, inside 100; dynamic PAT for inside-out; the flow is permitted and logged | | |
| TC-L3-19 | ASA inspection policy | `show run policy-map`; `show service-policy inspect`; run a DNS query and an ICMP echo through the firewall | The configured inspection set applies; the return traffic is admitted by stateful inspection and not by a blanket permit | | |
| TC-L3-20 | ASA syslog to the monitoring host | `show logging`; generate a permitted and a denied flow; check `/var/log/remote/` on `vpnz-mon01` for the ASA's file | Logging trap level informational; the messages arrive at 10.10.30.31 and are filed per host | | |
| TC-L3-21 | ASA site-to-site IPsec IKEv2 to Wan Chai | `show crypto ikev2 sa`; `show crypto ipsec sa`; ping from a Wan Chai host to an HQ server-zone host | IKEv2 SA in READY state; IPsec SA with non-zero encaps/decaps counters; the ping succeeds | | |
| TC-L3-22 | VLAN segmentation with no stretched VLANs | `show vlan brief` on every switch; cross-site `traceroute` between branch and HQ VLANs | Every VLAN identifier and name matches the plan; no VLAN is present at both a branch and HQ; inter-site traffic is routed, not switched | | |
| TC-L3-23 | Device initialisation and management-plane access | `show version`; `show running-config | include hostname|enable secret`; `show ip ssh`; connect with SSH from the management zone | Every device's hostname matches the naming convention; SSH transport is enabled and Telnet is disabled; the management address is in the management subnet only | | |
| TC-L3-24 | Loopback addressing and discovery protocol | `show ip interface brief`; `show cdp neighbors detail` | The loopback address matches the plan for each routing device; CDP reveals the expected neighbours — this is the discovery-evidence requirement of the design's testing plan | | |
| TC-L3-25 | Voice device registration (supporting demonstration) | `show telephony-service ephone`; `show ephone registered` on `VP-HQ-VOICE-01`; check DHCP option 150 delivery to a phone | Two ephone-dn and two ephones registered; option 150 points at 10.10.45.11; the report states "CUCM Express simulated in Packet Tracer", not a deployed telephony service | | |
| TC-L3-26 | NTP and time consistency across the network estate | `show ntp status`; `show clock` on each device | Devices synchronise to the internal source where configured; clock offsets are small; any device that does not use NTP has that fact recorded | | |

#### 13.3.4 L4 — Automation, plus L5 AI Network Management

| ID | Requirement / design element under test | Procedure or command (exact) | Expected result | Actual result | Pass/Fail |
|---|---|---|---|---|---|
| TC-L4-01 | PowerShell user-onboarding script | `.\Invoke-NewStarterOnboarding.ps1 -FirstName Test -LastName User -Department Finance -Site HQ-ShaTin -Verbose` on `vpnz-jump01`; then `Get-ADUser`, `Get-ADPrincipalGroupMembership` | The user is created in the correct OU, added to the correct groups, given a home directory, and applied to the FSRM quota; the script log is written to `C:\FYP\logs\` | | |
| TC-L4-02 | Ansible Windows baseline playbook | `ansible-playbook -i inventory/lab.ini playbooks/01-baseline-windows.yml --check` then without `--check` from `vpnz-mon01` | The play completes with `failed=0`; WinRM over HTTPS 5986 is used; the check mode reports the same changes as the real run | | |
| TC-L4-03 | Ansible Linux baseline playbook | `ansible-playbook -i inventory/lab.ini playbooks/02-baseline-linux.yml --diff` | The play completes with `failed=0`; SSH to the Linux group succeeds; the diff output is captured as evidence | | |
| TC-L4-04 | Bash hardening script and shared library | `sudo ./01-hardening-baseline.sh`; `echo $?`; `bash -n ./lib/common.sh` | Exit status 0; the library passes a syntax check; `set -euo pipefail` is in force; the script is re-runnable without error | | |
| TC-L4-05 | Git workflow, branches and tags | `git log --oneline --graph --all`; `git branch -a`; `git tag` on `vpnz-mon01` | Branch-per-task history visible; peer-review merges recorded; tags from `v0.1` to `v1.0` present at the end of the project | | |
| TC-L4-06 | Idempotence of every playbook (the hard requirement) | Run each of the nine playbooks twice; compare the recap lines | Second run reports `changed=0` for every task; both run logs are committed to `04-automation\runs\` | | |
| TC-L4-07 | Ansible reaching Windows over WinRM | `ansible windows_servers -i inventory/lab.ini -m win_ping`; `Test-WSMan -ComputerName vpnz-fs01 -UseSSL -Port 5986` from the control node | `win_ping` returns `pong` for every Windows host; the WinRM certificate is the internal CA-signed one; unencrypted 5985 is not used for real work | | |
| TC-L4-08 | The port matrix as an executable test | `.\Test-ServiceEndpoints.ps1 -OutputPath C:\FYP\evidence\` executed from `vpnz-jump01` | Each permitted service reports open and each denied service reports closed, in the same run; the CSV output is committed as evidence | | |
| TC-L4-09 | Network device configuration collection | `ansible-playbook -i inventory/lab.ini playbooks/08-collect-network-configs.yml`; `.\Backup-NetworkDeviceConfig.ps1` | Configuration text for every network device is collected into the archive and committed to Git. The report states plainly that no playbook logs in to a Packet Tracer device; the collection targets the estate and the config files held in Git | | |
| TC-L4-10 | GPO backup and export | `.\Export-GPOBackup.ps1`; `Get-ChildItem C:\FYP\config\GPOBackup` | One backup folder per GPO; the set matches `Get-GPO -All`; the export is committed | | |
| TC-L4-11 | AD health reporting script | `.\Get-ADHealthReport.ps1 -OutputPath C:\FYP\evidence\` | Replication, FSMO, DNS, SYSVOL and time skew are reported as CSV and HTML; the report matches the values seen in `dcdiag` and `repadmin` | | |
| TC-L4-12 | Secrets are not committed | `git grep -nIE "(password|secret|passphrase)" -- '*.yml' '*.ps1' '*.sh'`; `git log --all -- '*.key' '*.pem' '*.pfx' 'pki/*' 'wg0.conf'`; the `gitleaks` or equivalent sweep | No plaintext secret in any tracked file; no key material in any historical commit; Ansible Vault protects the inventory secrets; the deliberately planted fake key in the test repository is caught by the sweep | | |
| TC-L4-13 | nftables egress playbook | `ansible-playbook -i inventory/lab.ini playbooks/05-nftables-egress.yml --diff` | The ruleset is applied from the template; second run reports no change; the resulting `nft list ruleset` matches the intended ruleset exactly | | |
| TC-L4-14 | Keepalived playbook and VRRP state convergence | `ansible-playbook -i inventory/lab.ini playbooks/04-keepalived.yml`; then `show` VRRP state on both pairs | The playbook renders the correct VRID, priority, state and track script per host; VRRP converges to the intended master on each pair | | |
| TC-L4-15 | Provisioning from a template to a finished service | Clone `UBU2404-TEMPLATE-01` to a scratch VM; add it to the inventory; run `02-baseline-linux.yml` and `03-nginx-reverseproxy.yml` | The scratch VM reaches the defined baseline and service state with the same commands and no manual steps; the result matches the production node | | |
| TC-L4-16 | Watchdog test — the whole-estate verification playbook | `ansible-playbook -i inventory/lab.ini playbooks/09-verify-services.yml` after each phase gate | Every check reports ok; any failed check becomes a defect or an issue with an owner. This is both a gate instrument and the project's regression harness | | |
| TC-L4-17 | Script logging and auditability | Inspect `04-automation\runs\` and `C:\FYP\logs\` after a week of work | Every script and playbook run has a timestamped log; the logs are committed; a run can be correlated with a person and an issue ID | | |
| TC-L5-01 | Agent runtime is reachable and the tool surface is exactly four tools | `systemctl status` for the agent runtime on `vpnz-ai01`; list `/opt/openclaw/skills/`; query the runtime's tool list | The runtime is running; exactly four tool manifests exist; there is no fifth tool and no shell path from the runtime to a device | | |
| TC-L5-02 | Alert-triage capability end to end | Force an alert (for example stop Nginx on the master proxy pair, or inject the interface-error scenario); observe the Alertmanager webhook; capture the agent's triage note | The agent produces a triage note naming the affected host, the evidence, and a **proposed** next diagnostic; the note is labelled "proposed — requires human approval" | | |
| TC-L5-03 | Interface-health capability | Inject the documented interface-error scenario or flap a link in the simulator; capture the agent's output | The agent reports the error counters, correlates them to the correct VLAN, and proposes a specific diagnostic command | | |
| TC-L5-04 | Authentication-failure capability | Generate a failed-login burst from the isolated lab segment; capture the agent's output | The agent reports the count, the source, the window, and — correctly — that the source should not have been able to reach the target at all per the trust-boundary rules; it proposes verifying the ACL | | |
| TC-L5-05 | Read-only enforcement | Attempt to have the agent perform any write; inspect `/opt/openclaw/logs/agent.jsonl`; scan for write-capable credentials on `vpnz-ai01` | Every invocation is logged with a prompt hash and the tool calls made; no write path exists; the only credential present is the read-only service account | | |
| TC-L5-06 | Credential least privilege for the agent | `Get-ADGroupMember GG-AI-ReadOnly`; `Get-ADUser svc_aiagent -Properties MemberOf` | Only `svc_aiagent` (and the intended readers) are members; the account is not a member of Domain Admins or any other privileged group | | |
| TC-L5-07 | Agent network reachability is restricted to the documented management ports | From `vpnz-ai01`, attempt connections to a service outside the allow-list; verify the permitted read-only paths; scan for the reserved management interface exposure | Only ICMP, SNMPv3, WinRM HTTPS, read-only SSH and read-only HTTPS APIs are reachable; anything else is refused or filtered | | |
| TC-L5-08 | Documentation-drafting capability and honesty of output | Run the documentation-drafting capability over a day of real alert and change history | The draft is accurate against the underlying events; anything the agent inferred rather than observed is marked as inference; the output is reviewed by a human before use and the review is recorded | | |
| TC-L5-09 | False-positive and hallucination handling | Record any incorrect agent output with the exact prompt, model, tool calls and time | Every incorrect output is documented with its cause, not deleted. Documenting an agent failure is a stronger academic result than hiding one, and the fallback decision may change as a result | | |
| TC-L5-10 | Rate limiting and invocation audit | Trigger a burst of alerts; inspect the invocation log and the rate-limit behaviour | The tool-call rate limit holds; every call beyond the limit is refused and logged; the audit trail is complete and machine-generated | | |

**Test-case counts by line.** L1: 25 cases. L2: 25 cases. L3: 26 cases. L4 and L5 combined: 27 cases (17 automation, 10 innovation line). Total: **103 cases across the four line tables**, which is well above the 60-case minimum the project set itself and reflects the fact that a design of this breadth cannot be verified by a handful of checks.

#### 13.3.5 Cross-cutting test cases (documentation, monitoring and project governance)

These cases verify workstreams that span all five lines, and they are referenced by the traceability matrix alongside the per-line cases.

| ID | Requirement or design element under test | Procedure or command (exact) | Expected result | Actual result | Pass/Fail |
|---|---|---|---|---|---|
| TC-DOC-01 | The documentation set contains all six categories the brief requires: findings, manuals, steps, screen captures, verifications and references | Directory-by-directory audit of the repository against the six categories; count of items in each; sample check that a documented step can be followed by a member who did not write it | All six categories present and populated; every category has an owner and an index; a sampled runbook step is executable as written | | |
| TC-DOC-02 | Every screenshot is named to the convention, captioned and indexed, and every index row resolves to an existing file | Automated check of the evidence directory: verify each filename matches the naming pattern; verify that every file has an index row and every index row has a file; verify each caption follows the required template | No unmatched file and no dangling index row; every caption carries what, host, command and date; the index and the report agree in both directions | | |
| TC-DOC-03 | The traceability matrix has no empty cells and the consistency sweep is clean | Run the objective-to-design-to-test-to-evidence check; run the banned-string and hostname-casing sweep across the whole document set and the repository | Every objective resolves to at least one test identifier and one evidence reference; the sweep finds no banned string and no divergent hostname | | |
| TC-PM-01 | The project-management controls actually governed the build: seven phase gates, the weekly cadence, change control and defect management all have records | Audit the gate records, the minutes, the decision log, the change records and the defect list; check that every gate record cites its exit evidence and that every closed change record has re-verification | Seven gate records present with evidence; every week has minutes; every contract change has an assessment and a decision; every closed defect has a re-test result | | |
| TC-PM-02 | The risk register was maintained as a live instrument rather than written once | Compare the register's row dates and status changes across the project; check that at least one row was re-scored, at least one contingency was exercised, and every realised risk has a matching issue | The register shows dated movement, at least one closed row with a reason, and a realised risk that became an issue and was closed | | |
| TC-MON-01 | Metrics collection covers the estate as designed | Query the metrics interface's target list and confirm the state of every target | Every configured target reports up; the Windows and Linux exporters, the web-tier status and the network devices are all included | | |
| TC-MON-02 | Dashboards are provisioned from version-controlled files and show the three designed views | Provision the dashboards from the repository files into a clean instance; then inspect the overview, security and availability views | The three dashboards appear from the files alone, with no manual rebuilding; each shows live data | | |
| TC-MON-03 | Alert rules fire and resolve | Trigger each of the three designed alert conditions in turn and then clear them; capture the alert state and the notification | Each alert fires with the correct host and condition, and resolves when the condition clears; the sequence is captured with timestamps | | |
| TC-MON-04 | Centralised logging receives, separates and retains logs from every source class | Generate one event on a Linux guest, one on a Windows guest and one on a network device; inspect the receiver and the retention state | Each event appears under its own source host's file or stream; the log store has at least 50 % headroom against its allocation | | |
| TC-PKI-01 | Certificate issuance, trust and lifecycle behaviour across both platforms | Issue, deploy, verify, renew and revoke a certificate on each platform; check the trust stores on both sides | Certificates chain to the internal authority on both platforms; a certificate issued by either side is trusted by the other; renewal and revocation both produce the expected result | | |

### 13.4 Failover and Resilience Testing

Each test below has an exact procedure, an expected convergence behaviour and a numeric acceptance threshold. Thresholds are set at values that a virtualised, single-host laboratory can genuinely meet; they are **not** production service-level objectives, and the proposal says so.

| ID | Failure injected | Exact procedure | Expected convergence behaviour | Acceptance threshold |
|---|---|---|---|---|
| **TC-FO-01** | HQ first-hop gateway failure (HSRP) | On `VP-HQ-CORE-01`, `configure terminal` → `interface vlan 30` → `shutdown` (equivalently, take the active switch out of the model in the simulator). On a client on VLAN 30, run a continuous `ping -t 10.10.30.11`. Capture `show standby brief` on `VP-HQ-CORE-02` before and after | `VP-HQ-CORE-02` transitions Standby → Active; the virtual MAC `0000.0c07.ac01` and the VIP 10.10.30.254 answer; the client's pings resume without a client-side change | Recovery within **10 seconds** of the failure; no more than **3 consecutive** unanswered pings (simulated environment); **no** loss of the default gateway after convergence |
| **TC-FO-02** | HQ first-hop gateway recovery (HSRP preempt) | Restore `interface vlan 30` on `VP-HQ-CORE-01`; continue the continuous ping; capture `show standby brief` | Core 01 regains Active because of the priority 150 plus preempt; Core 02 returns to Standby; no persistent duplicate-active state | Preempt within **30 seconds** of the interface returning; exactly **one** active forwarder at every sampled instant |
| **TC-FO-03** | Reverse-proxy master failure (Keepalived VRRP, VRID 61) | On the VRRP master `vpnz-dmzrev01`, run `sudo systemctl stop keepalived` (and, separately, `sudo poweroff` for the harder variant). From `vpnz-mon01`, run a loop of `curl -k -o /dev/null -s -w "%{http_code}\n" https://portal.vertexpeak.example` at one-second intervals for 60 seconds | `vpnz-dmzrev02` takes the VIP 10.10.90.10; the same hostname continues to be served; `journalctl -u keepalived` on both nodes shows the state transition and the reason | Service interruption limited to **≤ 3 seconds**; **≤ 2 consecutive** non-200 responses in the 60-sample loop; VIP present on exactly one node at all times |
| **TC-FO-04** | Egress-pair master failure (Keepalived VRRP, VRID 51) plus service-level failure | Two variants: (a) `sudo systemctl stop keepalived` on `vpnz-nft01`; (b) stop the nftables service so that the track script fails while the interface remains up. In both cases, keep a continuous ICMP and HTTPS test running from a server-zone host to a permitted destination | In (a) the VIP moves on VRRP timeout. In (b) the track script fails, priority drops, and the VIP moves **even though the interface is still up** — the whole point of tracking the service rather than the link | (a) VIP move within **3 seconds**; (b) VIP move within **5 seconds** of the track-script failure; traffic resumes within **5 seconds**; no ruleset gap (no unfiltered traffic at any sampled instant) |
| **TC-FO-05** | Service failure with the interface healthy (Nginx down on the VIP holder) | On the VIP-holding proxy, `sudo systemctl stop nginx`; run the one-second `curl` loop | The keepalived track script fails, priority drops, and the VIP moves to the healthy node; the portal continues to answer | VIP move within **5 seconds**; **≤ 3 consecutive** failed responses; total interruption **≤ 5 seconds** |
| **TC-FO-06** | Domain controller failure | On `vpnz-dc01`, `Stop-Computer -Force` (or `shutdown /r /t 0 /f` with the service stopped). Concurrently: authenticate a new logon from a workstation, resolve an internal name, and authenticate over LDAPS | Existing Kerberos tickets remain valid; new authentication is served by `vpnz-dc02`; DNS resolution continues from `vpnz-dc02`; LDAPS is answered by `vpnz-dc02` using its own certificate | New interactive logon succeeds within **30 seconds**; **zero** failed name resolutions in a 60-probe DNS loop; **zero** authentication failures attributable to the DC loss after the first successful retry |
| **TC-FO-07** | DNS redundancy and the primary resolver's loss | Set a client's resolvers to 10.10.30.11 then 10.10.30.12; stop the DNS service on `vpnz-dc01`; run 100 `Resolve-DnsName` calls for internal and forwarder-resolved names; then verify the branch case with `vpnz-brdc01` third in the branch list | The client falls through to 10.10.30.12 on the first timeout and resolves normally; no client's list ever contains only the RODC | **≥ 99 %** of probes resolved; fallthrough observed within the first **2** probes; **no** client with a single resolver |
| **TC-FO-08** | iSCSI target restart | Note the mounted volume's file count and a content hash; `Restart-Service -Name MSiSCSI -Force` on `vpnz-san01`; on the initiator run `Get-IscsiSession`, `Get-Disk`, and re-verify the hash | The initiator re-establishes the session without a reboot; the volume remains mounted or is remounted cleanly; content is unchanged | Session re-established within **60 seconds**; **zero** data loss (hash identical); a single documented automatic remount rather than repeated manual intervention |
| **TC-FO-09** | Web-tier node failure behind the proxy | Stop the IIS service on `vpnz-dmzweba01`; run the one-second `curl` loop for 60 seconds; inspect the proxy error log and the surviving node's log for request distribution | The proxy marks the failed upstream down after `fail_timeout` and serves all requests from `vpnz-dmzweba02`; the failed node is retried and returns to the pool when it recovers | **Zero** 5xx responses after the first failed request is absorbed; **≤ 2 consecutive** failures; recovery into the pool within **30 seconds** of the node returning |
| **TC-FO-10** | Full DMZ node loss (destructive) | Take both WordPress nodes out of service; observe the behaviour of the blog vhost while the portal vhost stays healthy | The affected vhost returns a controlled error rather than hanging; the unaffected vhost is undisturbed; the failure is visible in monitoring | The blog vhost responds with an error state within **5 seconds** of the second node being stopped; the portal vhost shows **zero** impact in the same window |
| **TC-FO-11** | WAN link failure to a branch and routing reconvergence | Shut the HQ-to-Kwun-Tong WAN interface; observe `show ip ospf neighbor`, `show ip route`, and branch continuity; restore the interface | The adjacency drops and the route is withdrawn or replaced; the branch retains cached identity so logons continue; on restoration the adjacency and routes return without manual intervention | Adjacency returns to FULL within **40 seconds** of restoration; **zero** manual commands needed to restore routing; the branch logon test passes throughout the outage |
| **TC-FO-12** | BGP session loss (external path) | `shutdown` the primary provider-facing interface; capture `show ip bgp summary` and `show ip route bgp`; restore | The primary BGP session drops; the alternate provider's path is used; on restoration the primary path is preferred again by local preference | Alternate path active within **60 seconds** of the session loss; convergence back within **60 seconds** of restoration; no route flapping after stability |
| **TC-FO-13** | Hypervisor host failure — documented non-test | Not injected. The hypervisor host is a single point of failure for the entire VM estate and cannot be failed over | No failover behaviour exists to observe | **Recorded as a limitation, not a test.** The report states that all source artefacts are in Git on `vpnz-mon01` and mirrored off-host, that this protects the *project*, and that it does **not** provide service availability. No availability figure is claimed for the host |

### 13.5 Security Testing

The purpose of this suite is to demonstrate that the **trust-boundary rule table** of the design is enforced, that authentication is certificate-based rather than password-based, and that no management interface is exposed to a lower-trust zone. Each test cites the trust-boundary row it verifies.

#### 13.5.1 Traffic that must be blocked

| ID | Trust-boundary row | Exact procedure | Expected evidence (deny) | Actual | Pass/Fail |
|---|---|---|---|---|---|
| TC-SEC-01 | **TB-04** — DMZ to server zone and user zone: nothing, any protocol | From `vpnz-dmzweba01` (10.10.90.21): `Test-NetConnection vpnz-fs01 -Port 445`; `curl -k -m 5 https://10.10.30.11`; `ping 10.10.30.21`; also run `nmap -Pn -p 22,80,135,389,443,445,3260,3389 10.10.30.21` from the DMZ jump host | All attempts fail or time out; TCP connects never complete; the ASA records denies. Expected ASA log line class: `%ASA-4-106023: Deny tcp src dmz:10.10.90.21/51234 dst inside:10.10.30.21/445 by access-group "ACL-DMZ-OUT-10"`; `show conn` shows no session; `show asp drop` shows the dropped frames | | |
| TC-SEC-02 | **TB-05 / TB-06** — Internet to the internal zones: nothing | From the simulated Internet: `curl -m 5 http://10.10.30.21`; `Test-NetConnection 10.10.30.11 -Port 3389`; then the same to `10.10.90.22` on port 445 | Connections fail; only the published VIP on 198.51.100.2 answers on 80/443; the ASA logs the denies with the outside interface as the source | | |
| TC-SEC-03 | **TB-09 / TB-10** — the isolated lab segment reaches nothing except its own subnet and the lab console | From an endpoint on the isolated lab segment (10.70.0.0/24): `ping 10.10.30.11`; `Test-NetConnection 10.10.90.25 -Port 443`; `curl -m 5 https://portal.vertexpeak.example`; `ping 192.0.2.53`; then `Test-NetConnection VP-HQ-JUMP-01 -Port 443` | All internal and Internet attempts are dropped; only intra-subnet traffic and TCP 443 to the lab console succeed. nftables and the ASA both log drops; expected nftables line form: `NFT-DROP: IN=ens192 OUT= SRC=10.70.0.50 DST=10.10.30.11 ... DPT=22` | | |
| TC-SEC-04 | **TB-12** — VPN users are never administrators of infrastructure | Connect as a VPN user, then from the client: `Test-NetConnection 10.20.20.11 -Port 22`; `Test-NetConnection 10.20.20.31 -Port 3389`; `Test-NetConnection 10.20.20.10 -Port 443` | Every management-zone attempt fails; the client's own routing table shows the traffic going into the tunnel (split tunnelling is disabled), so the denial is a policy denial and not a routing artefact | | |
| TC-SEC-05 | **TB-14** — branch WAN to the management zone: nothing | From `VP-BR-EDGE-01`, `telnet 10.20.20.31 3389` and `ping 10.20.20.11`; capture the ASA and nftables logs | Both are dropped and logged; no management address is reachable from a branch WAN interface | | |
| TC-SEC-06 | **TB-08** — reverse direction to the management zone: only syslog, SNMPv3 and traps | From an ordinary user VLAN host: `Test-NetConnection 10.20.20.31 -Port 3389`; `Test-NetConnection 10.20.20.31 -Port 22`; then from a managed device, verify that 514/udp and 161/udp reach `vpnz-mon01` | User-zone attempts to management are denied; syslog and SNMPv3 from managed devices are accepted; SNMPv2c community strings are refused because SNMPv2c is forbidden by design | | |
| TC-SEC-07 | **TB-01** — ordinary users cannot use RDP to servers | As `testuser01`, run `mstsc /v:vpnz-dc01` and `mstsc /v:10.10.30.21` | Both RDP attempts are refused by policy and permission; the attempt is recorded in the Security event log. RDP remains available to administrators from the management zone | | |
| TC-SEC-08 | **TB-15** — DMZ management path is only through the DMZ jump host | From `vpnz-mon01` or `vpnz-jump01`, attempt direct SSH to `vpnz-dmzrev01` (10.10.90.10) and to `vpnz-dmzwp01`; then attempt SSH to 10.10.90.27 and onward to the DMZ nodes | Direct management of DMZ hosts fails; management is possible only via `vpnz-dmzjump01` at 10.10.90.27, which is itself reachable only from the management zone. Expected nftables line for a direct attempt: `NFT-DROP: ... SRC=10.20.20.31 DST=10.10.90.25 DPT=22` | | |
| TC-SEC-09 | Default-deny discipline: an unlisted port is denied in both directions | Choose a port that appears in no row of the port matrix (for example TCP 8080 between the user zone and the DMZ); test it in both directions from both zones | Both directions are denied and logged. This test proves the tables are allow-lists rather than the design being accidentally permissive | | |
| TC-SEC-10 | nftables logging is present before every drop | `sudo nft list ruleset | grep -c "log prefix"`; then generate one denied flow from each protected zone and count the resulting log lines | Every drop rule carries a log prefix; each denial produces at least one log line in the correct file under `/var/log/remote/`, letting the test prove *which* rule dropped the traffic | | |
| TC-SEC-11 | UDP 51820 management escape hatch is disabled during the security test | `sudo wg show` for the management tunnel; `nc -zvu 10.10.50.11 51820` from the management zone; inspect the ruleset | The tunnel is down or absent and the port does not answer; the absence is the evidence, and the tunnel's presence in the design is documented as an out-of-band escape hatch rather than a service path | | |

#### 13.5.2 Traffic that must be permitted

| ID | Trust-boundary row | Exact procedure | Expected evidence (allow) | Actual | Pass/Fail |
|---|---|---|---|---|---|
| TC-SEC-12 | **TB-01** — the exact permitted service set from the user zone to the server zone | From a user VLAN host: `Resolve-DnsName vertexpeak.fyp.lab`; `klist` after logon; map `\\vpnz-fs01\Shares\Finance`; on an authorised platform node, `Get-IscsiSession`; `curl -kI https://vpnz-mon01:3000` | DNS 53, Kerberos 88, LDAP 389, SMB 445 and HTTPS 443 succeed; iSCSI 3260 succeeds only from the two platform VMs; RDP does not appear in the permitted set | | |
| TC-SEC-13 | **TB-02** — user egress limited to the documented set | From a user VLAN host: `curl -I` a permitted destination; `nslookup` via the internal resolver; then attempt a disallowed port and a disallowed protocol | HTTP, HTTPS, internal DNS, internal NTP and ICMP echo succeed; everything else is denied at the egress pair and logged by the nftables drop rules | | |
| TC-SEC-14 | **TB-03** — server-zone egress is attributed by source | From `vpnz-mon01`, `apt update` against a permitted mirror and `git fetch` from a permitted remote; inspect `/var/log/remote/vpnz-nft01.log` | The permitted flows succeed; the log line attributes the connection to the source address of `vpnz-mon01`, so an authorised exception is distinguishable from a policy breach | | |
| TC-SEC-15 | **TB-05** — the published front door is exactly what is published | From the simulated Internet: `curl -kI https://198.51.100.2`, `curl -I http://198.51.100.2`; then attempt HTTPS to 198.51.100.3 and 198.51.100.4 for the other published names | Only the published ports and the documented names answer; the HTTP request is a 301 to HTTPS; no other DMZ host is directly reachable | | |
| TC-SEC-16 | **TB-07** — the management zone can manage everything with management protocols only | From `vpnz-jump01`: `ssh adm-a@vpnz-mon01`, `mstsc /v:vpnz-fs01`, `Enter-PSSession -ComputerName vpnz-mon01 -UseSSL`, SNMPv3 read from `vpnz-mon01`, and a syslog test message | SSH, RDP, WinRM HTTPS, WAC 6516, SNMPv3 161 and syslog 514 all succeed from the management zone; no non-management protocol is used for administration | | |
| TC-SEC-17 | **TB-11** — the professional-services VPN group and only that group gets RDP to the platform tier | Connect as a member of the restricted VPN group and RDP to the platform VM; then connect as an ordinary VPN user and repeat | The privileged group succeeds; the ordinary VPN user is denied. The difference between the two outcomes in the same session is the evidence | | |
| TC-SEC-18 | **TB-13** — DMZ hosts may initiate outbound only for resolution and patching | From `vpnz-dmzrev01`: resolve an internal name and fetch a package; then attempt to initiate a session towards the server zone and towards a management address | Resolution and patch retrieval succeed through the permitted path; the internal and management initiations are denied and logged, proving DMZ outbound is narrowly scoped | | |
| TC-SEC-19 | **TB-16** — the AI agent's read-only poll is the only agent path | On `vpnz-ai01`, perform each of the four declared reads; then attempt a write-capable operation and attempt a connection to a device port outside the allow-list | The four reads return data; the write attempt and the off-list port are refused. The invocation log in `/opt/openclaw/logs/agent.jsonl` records exactly the four reads and nothing else | | |

#### 13.5.3 Authentication, certificate validation and management-interface exposure

| ID | Requirement under test | Exact procedure | Expected evidence | Actual | Pass/Fail |
|---|---|---|---|---|---|
| TC-SEC-20 | Certificate-based VPN only; no preshared keys anywhere | Inspect the RRAS and NPS configuration (`Get-RemoteAccess`, `Get-VpnServerIPsecConfiguration`, `Get-NpsPolicy`); attempt an IKEv2 connection with a preshared key configuration | The policy requires a machine certificate plus group membership; a preshared-key attempt is refused because preshared-key IKEv2 is forbidden by design, and the refusal is logged with the reason | | |
| TC-SEC-21 | Machine plus user certificate and group membership are all required | Four attempts: no certificate; certificate but no group membership; group membership but an expired certificate; both valid | Only the valid combination connects. Each refusal is logged with a distinguishable reason in the NPS log, so the control is provably specific rather than accidental | | |
| TC-SEC-22 | OpenVPN client certificate identity and revocation | Connect with a valid client certificate; then revoke it, regenerate the CRL, and reconnect | The valid client connects; the revoked client is refused and the server log names the revoked certificate by common name | | |
| TC-SEC-23 | Internal certificate chain validation on both platforms | On Windows: `certutil -verify` against a service certificate. On Linux: `openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt` on the same certificate | Both platforms validate the chain to the internal root; the same certificate is trusted on Windows and Linux, which is the design requirement of matching certificate conventions on both sides | | |
| TC-SEC-24 | Public-name certificate behaviour is documented, not hidden | Browse to `https://portal.vertexpeak.example` from a client that does not have the internal CA | A name or issuer warning appears. The evidence is captured and explained: the lab uses internal PKI for public-style names, no real public certificate authority is used, and none is claimed | | |
| TC-SEC-25 | No self-signed certificate remains in the delivered design | Enumerate certificates presented by every TLS service: `openssl s_client -connect {host}:443`, LDAPS on 636, the WinRM listener, `Get-ChildItem Cert:\LocalMachine\My`, and `Get-ExchangeCertificate` equivalents | Every presented certificate chains to the internal CA. Any self-signed certificate found is recorded as a defect with the build step at which it was supposed to be replaced | | |
| TC-SEC-26 | TLS configuration of the published services | `testssl`-style checks performed manually with `openssl`: `openssl s_client -connect 10.10.90.10:443 -tls1_1`, `-tls1_2`, `-tls1_3`, plus a cipher listing | TLS 1.0 and 1.1 are refused; TLS 1.2 and 1.3 are accepted; weak cipher suites are not offered; HSTS is present | | |
| TC-SEC-27 | Management interfaces are not exposed to lower-trust zones | From outside the management zone, scan the management addresses and the management ports: `nmap -Pn -p 22,161,443,3389,5985,5986,6516 10.20.20.10-32`; repeat from the user zone, the DMZ, the lab segment and the simulated Internet | Every management port is unreachable from every lower-trust zone; only the documented flow from the management zone is permitted. Scanning is performed **only** against the group's own lab and the results are captured in simulation mode where the source is a simulator device | | |
| TC-SEC-28 | Plaintext management protocols are absent | `show ip ssh` and `show line vty` on network devices; `sshd -T` on Linux; check that Telnet is disabled and that WinRM 5985 is not used for real work | SSH transport enabled and Telnet disabled on network devices; SSH key-only on Linux; WinRM HTTPS 5986 used by Ansible; any exception is documented as a build-time step that was later closed | | |
| TC-SEC-29 | SMB signing and legacy protocol suppression | `Get-SmbServerConfiguration | Select RequireSecuritySignature, EnableSMB1Protocol` on each Windows guest; `sudo smbstatus` where relevant | Signing required; SMB1 absent; the settings are delivered by `GPO-WS-Baseline-Security` and `GPO-SRV-Member-Server-Baseline`, so the control is policy-driven rather than hand-configured | | |
| TC-SEC-30 | Credential and key hygiene in the repository | The pre-tag sweep: `git grep` for password-like strings, `git log --all` for key paths and `wg*.conf`, plus the `gitleaks` or equivalent scan; and a repository search for the banned strings (`.local`, `.lan`, `contoso`, `fabrikam`, `172.16.`, `192.168.`) | No secret and no banned string in any tracked file or historical commit; a deliberately planted fake key is caught, proving the sweep works rather than merely running | | |
| TC-SEC-31 | The agent credential is least privilege and its outputs require approval | `Get-ADUser svc_aiagent -Properties MemberOf`; inspect the agent's output labelling | Membership is `GG-AI-ReadOnly` only; every output is labelled "proposed — requires human approval"; no configuration change is ever applied by the agent | | |
| TC-SEC-32 | Deliberate-misuse traffic originates only from the designated segment | Verify that the failed-login burst and the scan traffic originate from the isolated lab segment, and that the segment's design denies it any path to the targets | The traffic is dropped and logged, which simultaneously demonstrates the security tests and proves the isolation rules work | | |
| TC-SEC-33 | Security event logging is sufficient for investigation | Generate one denied flow, one failed logon, one group-membership change and one new-user creation; then hunt the events in the centralised log and in Grafana's security dashboard | All four are visible with source, host, account and time; the advanced audit subcategory set is what makes the failed-logon and group-change events available at all | | |

### 13.6 Performance and Capacity Testing

Performance testing in this project measures the **estate that was actually built** — a virtualised lab on a single hypervisor host with no physical hardware — so its purpose is to demonstrate a defensible measurement method and to expose resource limits, not to publish production capacity figures. Every number in this section is labelled accordingly, and the report states plainly that **no test here can measure real forwarding hardware, real line rate, real cabling or real power behaviour**, because none of those exist in the design.

#### 13.6.1 What is measured, with what tool, and to what threshold

| Measurement | Tool and exact procedure | Acceptance threshold | Why this threshold is honest in this lab |
|---|---|---|---|
| Intra-host-only network throughput between two VMs | `iperf3 -s` on the target; `iperf3 -c {target} -t 30 -P 4 -J > throughput.json` on the source; repeat three times and take the median | **≥ 500 Mbit/s** aggregate on the host-only network with 4 parallel streams | Host-only networking is mediated by the hypervisor's virtual switch; the measurement demonstrates the method and confirms no accidental rate limiting, and it is explicitly not a hardware line-rate claim |
| Latency between zones | `ping -c 100` and `ping -n 100` across the user zone, the server zone and the DMZ; `traceroute` to confirm the path traverses the intended firewall | Median round-trip **≤ 5 ms** intra-host with **0 %** packet loss over 100 probes | Establishes the baseline against which regressions are detectable; no claim is made about production WAN latency |
| Routing convergence — simulated network estate | In Packet Tracer, record the topology-change sequence for RSTP and the adjacency sequence for OSPF in simulation mode, with timestamps from `show spanning-tree detail` | The **sequence** is correct (root, alternate, forwarding order) and the adjacency reaches FULL with no manual intervention | Packet Tracer timings are simulator artefacts; the design therefore tests the *order of events*, not a millisecond figure, and labels any timing as simulated |
| Web-tier capacity under concurrency | 200 concurrent HTTPS requests for 30 seconds against the published portal, generated with a load tool available to the group (`ab`, `hey`, or a `curl` loop with controlled concurrency) | **≥ 99 %** successful responses; no 5xx after upstream warm-up; median response **≤ 500 ms**; error rate **0 %** at 20 concurrent and rising gracefully beyond it | The web tier is two small nodes behind a proxy on one host; the number demonstrates graceful degradation and the measurement method, and the report says so |
| Proxy and web-tier scaling behaviour | Compare 1 versus 2 upstream nodes at 200 concurrent requests, with one node stopped for the second run | With two nodes: throughput at least **1.5×** the single-node figure, or a demonstrated limit that is explained by the host, not by the design | A flat result would indicate the design has no real redundancy benefit; either outcome is a legitimate finding |
| Storage throughput and latency to the iSCSI LUN | `fio --name=seqwrite --rw=write --bs=1M --size=1G --runtime=60 --direct=1` and a mixed read/write profile on the mounted LUN | Sequential write **≥ 50 MB/s**; latency **≤ 20 ms** for the mixed profile | The LUN is a thin virtual disk on the same physical device as the OS disks; the measurement demonstrates the method, and the report states that no shared-storage or controller cache is being tested |
| Hypervisor resource pressure across the full estate | Prometheus scraping the exporters on every guest, plus the host's own performance counters, during a full `09-verify-services.yml` run | Peak guest RAM allocation within the documented host budget; **no** guest swapping during the run; CPU utilisation reported, not asserted | This is the test that decides whether the full estate fits one host or whether the two-shift fallback must be used, so it is a scheduling control as well as a performance measurement |
| Time integrity | `w32tm /stripchart` on Windows, `chronyc sources -v` on Linux, `show ntp status` on network devices | Skew **well under 5 minutes** everywhere, with the target under **1 minute** for the domain hierarchy | Kerberos fails beyond 5 minutes of skew, so this is a functional prerequisite measured as a performance metric |
| Log volume and retention | File sizes under `/var/log/remote/` and the log-store growth rate over 24 hours of normal operation with all drop logging enabled | Growth reported in MB/day; the store fits the allocated disk with at least **50 %** headroom at the end of the project | Drop logging with a prefix on every rule is verbose by design; this measures the cost of that design decision honestly |
| Backup and restore duration | Time a full configuration-and-evidence backup to the iSCSI backup LUN and the off-host restic job; then time a single-file restore | Backup completes within the operational window; a single-file restore completes in **≤ 2 minutes** | The scope is configuration and evidence only; no hypervisor-level backup is claimed, because no such licence exists in the project |

#### 13.6.2 Honest statement about the numbers

Three limits apply to every figure above, and the report repeats them wherever a number appears:

1. **No physical hardware.** There are no real routers, switches, firewalls, access points, servers, storage controllers or cables anywhere in this project. Every network figure is either hypervisor-mediated (for the VM estate) or simulated (for the Cisco estate).
2. **A single hypervisor host is both the environment and the bottleneck.** Every measurement is taken with all measured endpoints on one machine, sharing one CPU, one memory bus and one or two physical disks. Absolute values therefore characterise the *host*, not the *design*.
3. **The purpose is method and regression detection.** The performance suite exists to prove that the group can define a measurable, repeatable, thresholded test, execute it, and detect a regression when a change is made. That is the competency being demonstrated, and it is demonstrated whether the numbers are large or small.

### 13.7 AI Layer Evaluation

The evaluation method for the AI line is defined in section 11 and is not restated here; this subsection states how that method connects to testing and what the acceptance gate for the proof of concept is.

**Cross-reference.** Section 11 defines the evaluation approach for the AI layer — the capability scenarios to be demonstrated, the way outputs are judged (evidence-linked triage note plus a *proposed* change in diff form), the honesty rules about failures, and the fallback path if the preferred runtime cannot be evaluated. Section 13.7 adds only the **gate**: the measurable conditions the proof of concept must satisfy to count as delivered.

**Acceptance gate for the proof-of-concept.**

| Gate condition | How it is demonstrated | Test case |
|---|---|---|
| The agent runtime is running on `vpnz-ai01` and its tool surface consists of exactly the four declared read-only tools, with no fifth tool and no shell path to any device | Tool manifests listed; tool list queried from the runtime; the allow-list file shown | TC-L5-01, TC-SEC-19 |
| At least **two** of the declared capabilities are demonstrated end to end on a real alert-to-recommendation flow, with full transcripts | Triage note, the evidence it cites, and the proposed next step, captured with timestamps | TC-L5-02, TC-L5-03, TC-L5-04 |
| Every output is labelled as a proposal requiring human approval, and no output results in an applied change | Inspect output labelling; diff the configuration before and after each run | TC-L5-05, TC-SEC-31 |
| The agent's credential is the read-only service account and nothing else, and its network reachability is limited to the documented read-only management ports | Group membership query; connection attempts outside the allow-list | TC-L5-06, TC-L5-07 |
| Every invocation is logged with a prompt hash and the tools called, and a hard rate limit on tool calls is in force | Inspect the invocation log; trigger a burst and observe the limit | TC-L5-10 |
| Where the agent was wrong, the failure is documented with the prompt that caused it | Findings register entries with the exact prompt, model, tool calls and time | TC-L5-09 |
| A written evaluation states where the agent helped, where it wasted time, and where a human was strictly required | Evaluation section in the report, with the measured triage times quoted | — |
| The fallback actually taken is stated explicitly if the preferred runtime was not evaluated | One paragraph naming the fallback and why, with the decision-log entry that closed the open item | — |

**What is explicitly outside the gate.** Autonomous remediation is not tested and not claimed: the design deliberately excludes any write path, on safety and academic-integrity grounds, because an unsupervised agent writing to a router or a domain controller would make the project's verification results irreproducible. Model hosting, fine-tuning, GPU inference and predictive analytics with trained models are likewise out of scope and appear only as future work. The standard aligned to this project does not require any of them — the WSOS contains no AI content at all — so their absence cannot be presented as a shortfall against a standard, only as declared scope of a proof of concept.

### 13.8 Documentation Review and Acceptance

The documentation set is reviewed as a **first-class deliverable**, not as an appendix. Three lines of the standard aligned to this project make that a requirement rather than a preference, and they are quoted here verbatim, including the standard's own spelling:

> "Prepare a technical document reflecting the solution in detail for agreement and sign-off"

> "The purpose of documenting the completion of the installation or up-grade"

> "Gain user acceptance and record"

The first and third lines together form a complete chain — a document prepared for agreement and sign-off, and acceptance gained and recorded — which maps directly onto this project's report, its sign-off sheet and its acceptance record. The second line makes documenting the *completion* of the work an explicit piece of knowledge, which is why this project maintains a findings register and a version-deviation subsection rather than only a description of the intended design. All three lines sit in the 25 %-weighted *Troubleshooting* section of the standard.

**The full documentary chain, with quotation.** The standard's relevant sequence runs: select the roles and/or features of the operating/server system; discuss the proposed solution and agree it with the relevant parties; prepare a technical document reflecting the solution in detail for agreement and sign-off; configure following the manufacturer's instructions or organisational best practice; test and rectify problems and re-test as appropriate; gain user acceptance and record. This project executes that sequence explicitly, and the mapping is:

| Standard step (verbatim wording) | This project's artefact |
|---|---|
| `Select the roles and/or features of the operating/server system e.g. Active Directory Domain Services (role) and Window Server Back-up (feature)` | Chapter 7 role/feature selection, with the design's chosen roles and its declared exclusions |
| `Discuss the proposed solution(s) for role/feature and agree with relevant parties e.g. users, colleagues, and managers` | Supervisor reviews at each phase gate; weekly review records; the decision log |
| `Prepare a technical document reflecting the solution in detail for agreement and sign-off` | The design chapters, the build manuals and this proposal as the agreement stage |
| `Configure the appropriate role/feature following manufacturers' instructions or best practice within the organization` | Build runbooks, with the pinned version and the command that produced it |
| `Test and rectify any problems and re-test as appropriate` | The executed test records of section 13, including re-execution after every change |
| `Gain user acceptance and record` | The acceptance record and sign-off sheet of section 13.10 |

**Review process for the documentation set.**

| Stage | What is reviewed | Reviewer | Criteria | Recorded as |
|---|---|---|---|---|
| Weekly documentation session | The week's sections, screenshots and evidence index rows | Owner plus one peer, facilitated by the documentation owner | Every claim has an evidence reference; every screenshot is named and indexed; no banned strings; no version claimed without a command output | Weekly progress report and evidence index update |
| Per-chapter peer review | A complete chapter, before it is accepted as done | A member who did not write it | Technical accuracy against the design; internal consistency with the interface contract; the "NOT COVERED" disclosures are present and honest | Review comment in the issue tracker, with the reviewer named |
| Traceability sweep | Every objective, every brief technology name and every trust-boundary row | Documentation owner | Each row resolves to a design element, at least one test case ID and a documentary evidence reference; no dangling reference | Traceability matrix with no empty cells |
| Banned-string and consistency sweep | The whole document set | Documentation owner | No occurrence of the banned strings; hostnames, addresses, VLAN identifiers and versions match the interface contract exactly | Sweep output committed to the repository |
| Pre-submission proof-read | The assembled report | All four, with one member responsible for the final pass | No unproven use of "certified", "compliant", "production" or "real-world throughput"; every such word is either evidenced or removed | Proof-read log with the changes made |
| Supervisor review and sign-off | The assembled report and the demonstration | Supervisor | The agreed scope has been delivered or its reduction is recorded; the disclosures are adequate | Sign-off sheet, and the acceptance record |

**Acceptance of the documentation itself.** Documentation is accepted when: every section listed in the deliverable set exists and is complete; every figure and table is captioned and referenced in the text; every screenshot has a caption of the prescribed form and a row in the evidence index; the findings register contains every deviation discovered, including those that make the design look less complete; the version-deviation subsection exists and lists each difference between a pinned version and the running system with its impact; and the sign-off sheet carries a date and a signature.

### 13.9 Traceability Matrix

This is the key auditability artefact: it lets an assessor move from an objective, to the design element that satisfies it, to the test that proves it, to the document that records it. **[RESOLVED by Rev 1.1 ruling C-09]** The canonical objective set is O-1 to O-14 as defined in sections\01-introduction.md §2.2, and the provisional keys used below have been re-keyed to it. The design-element, test-case and evidence columns are unchanged, which was the condition this note set. Two objectives have no row here because no single design element maps to them: O-1 is the frozen design baseline itself (evidence EV-0001 and EV-0019) and O-12 is the executed test plan as a whole (TC-TS-01 plus every TC-{LINE}-NN). Their traceability is owned by the acceptance criteria of §13.10 and the evidence index of §14.9, and that ownership is stated rather than left as a missing column. The original note read: the objective wording in this table is derived from the project's design baseline and its seven success criteria, because section 2 of the assembled proposal is authored by another writer. The table is designed to be reconciled with section 2 during assembly, and any renumbering there is a mechanical update to the objective column only — the design element, test IDs and evidence columns do not change.

| Obj. | Objective (aligned to the design baseline's success criteria) | Design element | Test case IDs that verify it | Documentary evidence |
|---|---|---|---|---|
| **O-7** | Build a simulated enterprise topology with working Layer 2 and Layer 3, dynamic routing and a defended perimeter | 16 Packet Tracer devices, five incremental project files, OSPF area 0, EIGRP AS 100, eBGP to two providers, RSTP, ASA ACL/NAT/IPsec | TC-L3-01 to TC-L3-26; TC-FO-01, TC-FO-11, TC-FO-12 | Chapter 9; `03-build\packet-tracer\`; `06-verification\transcripts\`; PT topology screenshots |
| **O-2** | Establish a single identity authority with least privilege and auditable administration | One forest `vertexpeak.fyp.lab`, two HQ DCs, one RODC, the OU tree, security groups, service accounts, Tier-0/Tier-1 separation, GPO baseline | TC-L1-01 to TC-L1-05, TC-L1-08, TC-L1-23, TC-L1-24 | Chapter 7; `dcdiag` and `repadmin` transcripts; ADUC and GPO report screenshots |
| **O-3** | Deliver Windows network services: name resolution, addressing, file services with quota and screening, block storage, certificate-based remote access | DNS with redundancy, DHCP with 80/20 failover, FSRM quotas and file screen, iSCSI target with three LUNs, RRAS IKEv2 with NPS, AD CS | TC-L1-06, TC-L1-07, TC-L1-12 to TC-L1-19, TC-FO-07, TC-FO-08 | Chapter 7; quota-exceeded and blocked-file captures; `Get-IscsiSession`; `Get-VpnConnection` |
| **O-5** | Deliver Linux services: reverse proxy with TLS, first-hop redundancy, host and network firewalling, two independent VPN technologies, a content tier | Nginx reverse proxy with upstream pools, keepalived VRRP pairs (VRID 51 and 61), nftables with default drop and logging, OpenVPN with Easy-RSA, WireGuard, WordPress pair | TC-L2-01 to TC-L2-25; TC-FO-03, TC-FO-04, TC-FO-05, TC-FO-09, TC-FO-10 | Chapter 8; `nft list ruleset`; VIP failover capture; `wg show`; OpenVPN client connect transcript |
| **O-9** | Apply network change through reviewed, repeatable, idempotent configuration rather than by hand | Five PowerShell scripts with a shared module, nine Ansible playbooks, seven roles, five Bash scripts, Git with branch-per-task and peer review | TC-L4-01 to TC-L4-17 | Chapters 8 and 10; `04-automation\runs\`; `changed=0` evidence; `git log --oneline --graph` |
| **O-6** | Implement an encrypted, certificate-based remote-access path for staff and a site-to-site tunnel for a small office | RRAS IKEv2 with NPS policy, OpenVPN with a CRL, WireGuard site and remote pools, ASA IKEv2 site-to-site, no split tunnelling | TC-L1-18, TC-L1-19, TC-L2-13 to TC-L2-18, TC-L3-21, TC-SEC-20 to TC-SEC-22 | Chapters 7, 8 and 9; client `route print`; `show crypto ipsec sa`; revocation test log |
| **O-1**, **O-7**, **O-12** | Segment the enterprise into zones with an enforced, evidenced trust-boundary policy | 20 VLANs with exact names, host-only hypervisor networks for real segmentation, the 16-row trust-boundary table, ASA object groups and ACLs, nftables sets and drop logging | TC-SEC-01 to TC-SEC-19; TC-L3-15 to TC-L3-18, TC-L3-22 | Chapters 3 and 4; denial log lines per boundary; `nmap` and connection-attempt captures |
| **O-10** | Provide monitoring, logging and traffic-analysis evidence across the estate | Prometheus with exporters, Grafana with three provisioned dashboards, Loki receiving syslog, SNMPv3 read, TFTP/SCP configuration archive | TC-MON-01 to TC-MON-04 | Chapter 10; Grafana panel exports; `/var/log/remote/`; `nft monitor` capture |
| **O-11** | Demonstrate a read-only agentic AI proof of concept that shortens alert triage without any write path | Agent runtime on `vpnz-ai01`, exactly four read-only tools, allow-list and rate limit, invocation audit log, proposal-only output | TC-L5-01 to TC-L5-10; TC-SEC-19, TC-SEC-31 | Chapter 11; tool manifests; agent transcripts; invocation log; limitations section |
| **O-14** | Apply project management, risk and change control that demonstrably governed the build | Seven phases with gates, RACI matrix, weekly cadence, change records, risk register, issues log | TC-PM-01, TC-PM-02 | Sections 12, 15 and 16; weekly progress reports; gate records; decision log; closed change records |
| **O-13** | Produce the complete documentation and evidence set the brief requires, with agreement and sign-off recorded | Findings, manuals, steps, screen captures, verifications and references, with a master evidence index and a traceability matrix | TC-DOC-01, TC-DOC-02, TC-DOC-03 | Chapter 14; the report; build manual; test report; operations manual; acceptance record |

| Delivered item referenced in the matrix | Documentary evidence reference |
|---|---|
| Monitoring and log-analysis behaviour | Chapter 10 and the Grafana exports indexed under the monitoring evidence group |
| Infrastructure as code and version control | Chapter 10 and the playbook/script evidence group |
| PKI across both platforms | Chapter 7 and the certificate and chain evidence group |
| VLAN segmentation | Chapter 4 and the VLAN and trunk evidence group |
| Discovery and traffic analysis | Chapter 9 and the CDP, syslog, SNMPv3 and packet-capture evidence group |
| Documentation requirement (findings, manuals, steps, screen captures, verifications, references) | The six documentary categories of section 14.1, each with its index and its acceptance record |

### 13.10 Acceptance Criteria

The project is accepted when all of the following are true. Each criterion names how it is demonstrated, because an acceptance criterion that cannot be shown is not an acceptance criterion.

| # | Acceptance criterion | Demonstrated by |
|---|---|---|
| AC-01 | The full topology is present in a single deliverable Packet Tracer project file, with Layer 2 and Layer 3 working, OSPF, EIGRP, BGP, RSTP and the ASA perimeter policy all configured and captured | A live walkthrough of the `.pkt` file with the `show` outputs of TC-L3-01 to TC-L3-26 reproduced on demand |
| AC-02 | Every virtual machine in the design exists on the single hypervisor host with the recorded software versions, and every version claim is supported by the command output that produced it | The device and VM inventory reconciled line by line against the running estate; the version-deviation subsection for any difference |
| AC-03 | The AD DS domain is operational with the designed OU structure, groups and service accounts, and identity functions with the loss of one domain controller | Live demonstration of the domain, plus the DC-failure test TC-FO-06 executed in front of the assessor |
| AC-04 | Every service in the port and protocol matrix is reachable from its permitted zone and unreachable from every other zone, and each is evidenced by a screen capture plus a command transcript | `Test-ServiceEndpoints.ps1` executed live, producing the permitted/denied CSV; the denial evidence of section 13.5 |
| AC-05 | At least three PowerShell scripts and at least three Ansible playbooks exist, are idempotent, and produce unchanged output on a second run | Running a selected script and playbook twice in front of the assessor and showing `changed=0` in the second recap |
| AC-06 | The AI proof-of-concept gate of section 13.7 is satisfied, with at least two capabilities demonstrated and the fallback actually taken stated | A live alert-to-recommendation flow, plus the tool manifests, the allow-list and the invocation log |
| AC-07 | Every trust-boundary row of the design has been tested, with the DENY rows evidenced by a logged denial and the permitted rows by a successful, attributed flow | The security test records, walked through row by row, with the corresponding log lines shown |
| AC-08 | The failover and resilience thresholds of section 13.4 are met, and any threshold not met is reported as a finding rather than omitted | Live execution of at least the HSRP, VRRP and web-tier failover tests with stopwatch timing |
| AC-09 | The documentation set is complete, internally consistent, correctly attributed, and free of banned strings and unproven claims | The consistency sweep output, the traceability matrix, and the documentation review record |
| AC-10 | Every objective in section 2 has at least one passing test case and at least one documentary evidence reference | The traceability matrix of section 13.9, verified with no empty cells |
| AC-11 | The stated limitations — no physical hardware, the single-host availability limit, Packet Tracer fidelity, the version deviations, and everything in the "NOT COVERED" bands — appear in the report | Reading the limitations and honesty sections in the assembled report |
| AC-12 | User acceptance has been gained and recorded, with the record signed and dated | The acceptance record, executed with the supervisor or the scenario's IT manager role, and archived in the repository |

**Result categories.** Each criterion is recorded as one of three outcomes, and the third category must never be hidden: **Met** (demonstrated with evidence); **Met with declared limitation** (demonstrated, with the limitation stated and indexed); **Not met — reported as a finding** (recorded in the findings register with its cause and its impact). Presenting a limitation honestly is a stronger academic result than reporting a false pass, and the baseline makes this an explicit project rule.

### 13.11 Defect Management

**Defect lifecycle.**

| Stage | What happens | Who | Record |
|---|---|---|---|
| **Log** | A defect is raised the moment a test fails or an unexpected behaviour is observed, with the test case ID, the expected result, the observed result, the exact command, and the environment state (snapshot name, running VMs, PT file) | Whoever observed it | Issue labelled `type:defect`, plus a findings-register row if the behaviour was unexpected rather than a simple error |
| **Triage** | Severity, priority and the affected line are assigned; the defect is either accepted, deferred to a named later window, or rejected as by-design with the reason recorded | Owner of the affected line plus one reviewer; chaired by the integration owner | Severity and priority fields on the issue; triage decision and rationale |
| **Assign** | Exactly one owner, matching the RACI matrix's accountable member for the affected component | Project lead | Assignee field |
| **Fix** | The fix is applied through the normal path — configuration text in Git, a playbook change, or a script change — never by hand-editing a running system and leaving the change unrecorded | The assignee | Commit referencing the defect ID |
| **Re-test** | The originating test case is re-executed, **and** the whole-estate verification playbook is re-run to catch regressions the fix introduced | The assignee, with a second member observing for Critical and High defects | Re-executed test record with the new result |
| **Close** | The defect closes only when the re-test passes and the evidence is indexed. A defect closed without a re-execution is reopened automatically at the next gate review | Integration owner | Closure with the re-test evidence reference |
| **Escalate** | A defect in the **must** band that cannot be fixed within its window escalates to the change-control board within 24 hours, because the must band is non-negotiable and the response is schedule re-planning, not scope reduction | Project lead | Change record referencing the defect |

**Severity definitions.**

| Severity | Definition | Response time | Examples |
|---|---|---|---|
| **Critical** | The delivered design does not exist without it, a DENY trust-boundary row is violated, or evidence cannot be produced at all | Fix or invoke change control within **24 hours**; work stops on the affected line | A DENY flow from the DMZ to the server zone is permitted; the domain does not authenticate; the published service path does not work at all; a credential has leaked into Git |
| **High** | A must-band capability is degraded or unverifiable, a failover threshold is missed, or a deliverable document cannot be completed | Fix within **3 working days** | HSRP does not fail over; VRRP VIP does not move; a playbook is not idempotent; a version claim cannot be evidenced; a test cannot be executed because the estate will not fit the host |
| **Medium** | A should-band capability is degraded, or a functional defect with a workaround | Fix within **the current phase**, or defer to a named later window with the reason recorded | WordPress does not follow a proxy failover; a monitoring panel is empty; a BGP failover capture is missing; a screenshot is un-indexed |
| **Low** | Cosmetic, documentary or could-band issues | Fix before the phase gate, or record as accepted | A caption format inconsistency; a table ordering issue; a naming abbreviation that the interface contract does not permit |

**Priority versus severity.** Severity describes the technical impact; priority describes the order of work. A High-severity defect on the critical path takes priority over a Critical-severity defect that is off it and has a known workaround — but a Critical defect is never deferred past the phase gate regardless of priority, because the must band is non-negotiable.

**Rules that make defect management evidence rather than administration.**

1. A defect is never closed by deleting or weakening the test that found it. If the test was wrong, the test is corrected through change control, with the reason recorded.
2. Every defect that reveals an incorrect assumption is copied into the findings register and the assumptions log, and the risk register is reviewed for a matching risk.
3. Every defect fixed after the technology freeze requires a change record, so the freeze remains meaningful rather than decorative.
4. The defect list is reviewed at every weekly gate, and the residual defect list is part of the acceptance record — a project with three known Medium defects that are documented and understood is in better shape than one that claims none.

## 14. Documentation and Evidence Management

### 14.1 The Documentation Requirement

The project brief states the requirement in its own words:

> "must produce well-organized documentation that includes all findings, manuals, steps, screen captures, verifications, and references related to the project."

That single sentence names **six distinct deliverable categories**, and the project is organised so that each one has an owner, a storage location, an index and an acceptance check. Breaking the sentence apart is also the cleanest way to show that the documentation requirement is not a vague instruction to "write it up" but a specification with six components:

| # | Category (from the brief) | What it means in this project | Where it lives | Owned by | Acceptance check |
|---|---|---|---|---|---|
| 1 | **Findings** | Everything discovered that was not already known: unexpected behaviour, deviations from the design, workarounds, experiment results, lessons learned, and the honest record of what failed | `01-proposal\findings-register.md`, `06-verification\`, and the findings section of the report | All four, aggregated by the documentation owner | Every test that produced a surprising result has a findings row; every deviation between design and reality is recorded, including those that make the design look weaker |
| 2 | **Manuals** | The documents that would let another engineer operate and rebuild the estate: the build manual (per VM and per device), the operations manual (day-two procedures, backup and restore, failover), and the troubleshooting guide | `03-build\windows\`, `03-build\linux\`, `03-build\packet-tracer\`, `10-final\` | Line owners for their own chapters; documentation owner for assembly | A reader who did not build it can follow the runbook and reproduce the state; operations procedures are executable as written |
| 3 | **Steps** | The ordered, exact procedure for each task — not a description of a result, but the sequence of actions with the command, the target host and the expected response | Inside every runbook and every executed test record; the step-level detail is the point of the runbooks | Line owners | Every step has a command or an action, a target and an expected response; no step says "configure appropriately" |
| 4 | **Screen captures** | The visual evidence: GUI states, topology states, dashboards, certificates, quota and file-screen behaviour, failover moments | `07-evidence\` (PNG), staged first in `C:\FYP\evidence\` on Windows hosts | Capturer is the owner; indexing is the documentation owner | Every capture is named to the convention, captioned, annotated where necessary and indexed; no unindexed screenshot exists in the deliverable |
| 5 | **Verifications** | The record that a claim was tested: what was tested, the exact command or procedure, the expected result, the observed result, the screenshot reference, the date and the performer's initials | `06-verification\` (executed test records), `06-verification\gates\` (gate records) | Test executor signs; integration owner aggregates | Every claimed capability has at least one verification record; no verification record lacks a performer's initials |
| 6 | **References** | The sources actually consulted, archived so that a claim can be checked without network access | `08-references\`, one file per citation, plus the reference list in the report | Documentation owner for the register; each member for their own sources | Every reference in the list was genuinely consulted; no URL is written from memory; the two standard URLs are the ones verified in the project's research pack |

**Attribution discipline.** Two facts about these six categories must not be blended together. First, the **screen-capture requirement comes from the brief**, not from the standard aligned to this project: the WSOS 2026 page contains no requirement for screen captures, and the strings `screen`, `capture`, `screenshot` and `evidence` occur **zero times** on it. Second, the standard **does** require documentation — three times, including the line quoted in section 13.8 about preparing a technical document for agreement and sign-off. This proposal therefore presents the evidence set as a **brief requirement** and the technical document as a **brief and standard requirement**, and it does not claim that the standard asks for screenshots.

### 14.2 Documentation Structure

All project artefacts live in one repository so that evidence, configuration and narrative cannot drift apart. The layout is fixed by the design baseline:

```text
C:\FYP\
├── 00-baseline\        (the canonical baseline and frozen copies; read-only after each freeze)
├── 01-proposal\        (proposal, Gantt, risk register, group charter, meeting minutes)
├── 02-design\          (design document chapters, topologies, IP/VLAN plan exports, decision log)
├── 03-build\
│   ├── packet-tracer\  (.pkt files: 01-l2l3-core, 02-wan-routing, 03-asa-perimeter, 04-voice, 05-full)
│   ├── windows\        (per-VM build runbooks, screenshots, exported GPO backups, DISM notes)
│   └── linux\          (per-VM build runbooks, screenshots, package lists, dpkg --get-selections output)
├── 04-automation\
│   ├── ansible\        (inventory, group_vars, nine playbooks, seven roles, templates, logs)
│   ├── powershell\     (five scripts, shared module, logs)
│   ├── bash\           (five scripts, shared library, logs)
│   └── runs\           (timestamped run logs: runs/YYYY-MM-DD_HHMM_playbook.log)
├── 05-ai-netops\       (agent design, skill manifests, prompts, tool allow-list, output samples, limitations)
├── 06-verification\    (test plan, executed test records, show/Get- transcripts, iperf3 and ping results, defects, gates)
├── 07-evidence\        (PNG screenshots, named {date}_{host}_{what}.png, plus INDEX.md)
├── 08-references\      (one file per citation: standards, RFCs, vendor documentation actually consulted)
├── 09-templates\       (report template, screenshot caption template, test-case template)
└── 10-final\           (assembled deliverables, PDF exports, presentation)
```

Directory by directory, and why each exists:

| Directory | Contents | Why it exists as a separate directory | Who writes into it |
|---|---|---|---|
| `00-baseline\` | The canonical design baseline and every frozen revision of it | It is the single source of truth for names, addresses, versions and contract values; keeping it read-only after each freeze is what makes the anti-inconsistency mechanism credible | Project lead only |
| `01-proposal\` | This proposal, the Gantt chart, the risk register, the group charter, the findings register, weekly progress reports and meeting minutes | Planning and governance artefacts are deliverables in their own right and are cited by the report's method section | Documentation owner, with all members contributing |
| `02-design\` | Design chapters 3 to 11, topology diagrams, the exported IP and VLAN plans, and the decision log | Separates *intended* design from *built* reality, so that a deviation between the two is visible rather than hidden inside a build note | Line owners; decision log maintained by the project lead |
| `03-build\packet-tracer\` | The five incremental `.pkt` files and the exact intended device configuration text | The incremental files are evidence of build *progress*, not only of the finished topology; the configuration text is the source of truth for simulated device state | Network owner |
| `03-build\windows\` | Per-VM build runbooks, screenshots, GPO backups, DISM and feature notes | Runbooks are the manual category of the documentation requirement; GPO backups are a restorable artefact, not just a screenshot | Identity and Windows owner |
| `03-build\linux\` | Per-VM build runbooks, screenshots, package lists and `dpkg --get-selections` output | Package lists pin the *actual* installed state, which is exactly what a version claim needs | Linux and services owner |
| `04-automation\ansible\` | `ansible.cfg`, the inventory and `group_vars`, nine playbooks, seven roles, Jinja2 templates and per-run logs | Grouping by artefact type rather than by host is what makes the automation reviewable as code | Automation owner, reviewed by the relevant line owner |
| `04-automation\powershell\` | Five scripts, a versioned shared module, script logs | Named scripts map one-to-one onto the automation objectives, which keeps the traceability matrix short | Automation owner |
| `04-automation\bash\` | Five scripts and a shared library with strict error handling | The Linux-side automation half, with a shared library so that logging and error handling are consistent rather than copy-pasted | Linux and services owner, reviewed by the automation owner |
| `04-automation\runs\` | Timestamped run logs named `YYYY-MM-DD_HHMM_playbook.log` | Machine-generated, committed evidence: a run log cannot be produced retrospectively without leaving a trace, so it is the strongest single piece of automation evidence | Whatever executes the run |
| `05-ai-netops\` | Agent design, the four tool manifests, prompts, the tool allow-list, rate-limit configuration, sample outputs and a limitations document | The AI line is the least verifiable line, so its artefacts are held together in one place with the limitations document alongside them | AI owner, with the network owner for the data surface |
| `06-verification\` | The test plan, executed test records, `show` and `Get-` transcripts, throughput and ping results, defect records and phase gate records | The verification-record format of section 14.5 lives here; it is the directory an assessor can audit end to end | Test executors; aggregated by the integration owner |
| `07-evidence\` | PNG screenshots named `{date}_{host}_{what}.png` and the master evidence index | Screenshots without an index are unfindable and therefore worthless as evidence; the index is what converts a folder of images into a citable evidence set | Capturer; indexing by the documentation owner |
| `08-references\` | One archived file per citation, with the access date recorded | The project rule is that no URL may be written from memory; archiving the source is how that rule is enforced | Documentation owner |
| `09-templates\` | The report template, the screenshot caption template and the test-case template | Templates make the evidence set uniform, and uniformity is what allows the index and the traceability matrix to be generated by search rather than by memory | Documentation owner |
| `10-final\` | The assembled deliverables, PDF exports and the presentation | One directory contains exactly what is submitted, so that the submitted set cannot differ from the reviewed set | All four, assembled by the project lead |

### 14.3 Formatting and Writing Standards

| Element | Rule | Rationale |
|---|---|---|
| **Heading levels** | The report uses one top level for the document, numbered sections beneath it, then numbered subsections, then a fourth level only where a table needs its own grouping. No deeper nesting | Deeper nesting makes a technical report unreadable and makes cross-references fragile |
| **Numbering** | Sections, subsections and sub-subsections are numbered contiguously; every table, figure and appendix is numbered; cross-references always cite a number, never "above" or "below" | A numbered target survives editing; a positional reference does not |
| **Table convention** | Every table has a caption, a number, a source line if it reproduces another document, and a first column that is an identifier wherever the rows are citable (a test ID, a rule ID, a host name) | Identifiers make the artefact auditable: a rule or a test can be cited from the report, the test record and the issue tracker with the same string |
| **Figure captioning** | The fixed template is `Figure {n}: {what} — {host} — {command or action} — {date}` | The caption carries the four things a reader needs to judge the evidence: what, where, how, when |
| **Code and command blocks** | Every fenced block carries a language tag: `powershell` for PowerShell, `bash` for shell, `yaml` for playbooks and structured configuration, `text` for `show` output, trees, diagrams and plain command transcripts, `json` for machine-readable results | Untagged blocks defeat syntax highlighting and make the type of content ambiguous |
| **Command convention** | Commands appear verbatim and executable, with the host they run on stated and prompts omitted so that a reader can copy them | A command that has been paraphrased for readability can no longer be re-run, which destroys its evidential value |
| **Terminology consistency** | The canonical strings of the interface contract are used everywhere, in the same casing: `vpnz-dc01` is never written `DC01`, `VP-HQ-CORE-01` is never written `HQ-Core-1`, and a VLAN is named exactly as in the VLAN plan | Re-capitalisation is the most common way four writers silently diverge; the contract forbids it explicitly |
| **One technology, one name** | A technology is named once and used consistently thereafter; where a vendor name and a protocol name differ, the protocol is used in protocol discussions and the vendor name in product discussions | Prevents the reader from suspecting two technologies where there is one |
| **Abbreviation discipline** | Every abbreviation is expanded in full at first use, with the abbreviation in brackets, and is used thereafter; a glossary is maintained. Acronyms that the standard itself names are quoted exactly as the standard prints them, including its own unusual forms | A report with unexplained abbreviations is unusable by an assessor who is not from that specialism, and mis-quoting a standard's own wording is a citation error |
| **Units and numerals** | Units are always given, never implied; bit rates are distinguished from byte rates; addresses always carry a mask or prefix length where the mask matters | "500 Mb" is ambiguous; in an evidence-based report it is a defect |
| **Voice** | Third person, present or past tense as appropriate for design versus execution; no first-person narration and no marketing adjectives | An assessor must be able to separate what was designed, what was built and what was measured |
| **Honesty phrasing** | Claims are worded to match their evidence: "verified by the transcript in Appendix G" where evidence exists, and "not implemented — see the declared exclusions" where it does not. Words such as *certified*, *compliant*, *production* and *real-world throughput* are used only where evidence supports them, and the final proof-read evidences or removes every occurrence | The design is aligned with selected controls and is **not** certified against them; this distinction is a project rule, not a preference |
| **Date format** | ISO 8601 (`2026-10-06`) everywhere, in captions, filenames, indices and the change log | Sortable, unambiguous, and consistent with the evidence file-naming convention |

### 14.4 Screenshot and Evidence Standards

**Capture.** Screenshots are taken of the whole window that carries the meaning, including the host name and the command that produced the output, at native resolution without scaling. Where a state is transient — a failover in progress, a quota being exceeded, a denial appearing in a live log — the capture is taken during the event, and wherever possible the same event is also recorded as a text transcript so that the two corroborate each other. Long terminal output is captured in overlapping scrolls rather than in one illegible frame, and the overlap is stated in the caption.

**The exact file-naming convention.** The baseline fixes it:

```text
{date}_{host}_{what}.png

Examples:
2026-10-06_vpnz-dc01_dcdiag.png
2026-10-20_vpnz-dmzrev01_keepalived-failover-vip-moved.png
2026-11-03_VP-HQ-FW-01_asa-deny-dmz-to-srv-tb04.png
2026-11-10_vpnz-nft01_nft-ruleset-drop-policy.png
```

The three fields are deliberately chosen so that a filename answers the three questions an assessor asks: **when** (`date`, ISO 8601), **where** (`host`, using the canonical hostname or device name from the interface contract) and **what** (`what`, a short lower-case hyphenated description). Filenames contain no spaces, no non-ASCII characters and no personal names.

**Cropping and annotation.** Cropping is allowed only to remove unrelated screen area — never to remove context a reader needs in order to judge the evidence, and never to remove a warning, an error or a value that is inconvenient. On the contrary: where a name-mismatch warning, a self-signed certificate warning or a version deviation is visible, the capture must **include** it and the caption must explain it. Annotation is by numbered callout with a short legend, using a single colour, and every callout number in the image appears in the caption. Annotations are added with an offline tool and the annotated file replaces the raw capture in `07-evidence\`; the raw capture is kept in the same directory with a `-raw` suffix where the annotation covers anything material.

**Indexing and storage.** All captures live in `07-evidence\` and every one has a row in the master evidence index of section 14.9. Captures are staged first in `C:\FYP\evidence\` on the Windows host on which they were taken, and are transferred to `07-evidence\` at the weekly documentation session together with their index rows. Captures used inside the report are referenced by their index identifier, and the index row carries the report section and figure number, so the report can be checked against the evidence in both directions.

**Why an unindexed screenshot is worthless as evidence.** A screenshot that is not named to the convention and not indexed fails in three ways at once. It is **unfindable**: nobody can locate the one image among hundreds that supports a specific claim, so the claim becomes unverifiable in practice even though the image exists. It is **undated and unattributed**: without the naming fields there is no reliable link to a test execution, a host, a moment or a performer, so an assessor cannot tell whether it was taken during the build, during a test, or after the fact. And it is **unlinkable**: it cannot be referenced by the traceability matrix, so a technology or an objective that depends on it appears to have no evidence at all. The result is the worst of both worlds — the work was done, the proof exists, and the project still cannot demonstrate it. Indexing is therefore treated as part of taking the screenshot rather than as a later chore: a capture with no index row is, by project rule, not yet evidence.

### 14.5 Verification Records

A verification record states not only what passed but *how anyone could check it*, and it carries a named person and a date so that it is attributable. The format fixed for this project is:

```text
=== VERIFICATION RECORD ===
Record ID:              VR-{nnn}
Test case ID:           TC-{LINE}-{NN}
Trust-boundary row:     TB-{nn}            (or "n/a")
Date and time:          {YYYY-MM-DD HH:MM}
Performed by:           {member initials}
Witnessed by:           {initials or "not required"}
Host(s) or device(s):   {canonical hostname(s) or device name(s)}
Snapshot / PT file:     {snapshot name or .pkt filename used as the baseline}
Requirement under test: {the requirement, design element or rule being verified}
Procedure (exact):      {the literal command(s) or ordered GUI steps}
Expected result:        {what should happen, stated before execution}
Observed result:        {what actually happened, verbatim where it is output}
Evidence references:    {evidence index IDs; screenshot filenames; run-log path}
Deviation:              {none, or the difference between expected and observed}
Disposition:            PASS / PASS WITH DECLARED LIMITATION / FAIL
Linked defect:          {defect ID or "none"}
Linked finding:         {findings-register ID or "none"}
```

The fields that matter most, and why:

- **Expected result stated before execution.** A record written after the fact tends to define the expectation as whatever happened.
- **Observed result verbatim.** Summarising output is where accidental misrepresentation starts; the raw line is pasted and, where it is long, the transcript is referenced.
- **Snapshot or project-file reference.** It makes the result reproducible: anyone can restore the same starting state and re-run the procedure.
- **Performer initials and witness.** The record carries a person, not a team; for Critical and High-severity tests a second member witnesses, which is the same peer-review control applied to testing.
- **Deviation and disposition as separate fields.** A test can pass while revealing a deviation worth recording — for example a version differing from the pinned one while behaving as designed — and two fields prevent that nuance being lost.

### 14.6 Findings Register

The findings register records what the project **learnt**, which is a different thing from what it **did**. It captures unexpected behaviour, deviations from the design, workarounds, experiment results, negative results and lessons learned, and it is a required deliverable under the brief's "findings" category. Every finding has an identifier, an owner and a disposition, and a finding is never deleted even when it is resolved — a resolved finding with a documented cause is the most useful row in the register.

```text
=== FINDINGS REGISTER ===
Finding ID:                 FN-{nn}
Date:                       {YYYY-MM-DD}
Raised by:                  {initials}
Line / area:                L1 | L2 | L3 | L4 | L5 | documentation | process
Finding type:               unexpected behaviour | deviation from design | workaround adopted |
                            experiment result | negative result | lesson learned
Summary:                    {one line}
Detail:                     {what was observed, with the command that produced the observation}
Evidence:                   {verification record ID; evidence index ID; transcript path}
Impact:                     none | low | medium | high   (on the build, the schedule or a claim)
Action taken:               {fixed / worked around / accepted and documented / escalated}
Design baseline affected?   {yes — open item or contract value; no}
Report section to update:   {section number}
Disposition:                closed | open | accepted as limitation
Reviewer:                   {initials and date}
```

**Worked example row.**

| Field | Content |
|---|---|
| Finding ID | `FN-07` |
| Date | 2026-11-12 |
| Raised by | Member C (network owner) |
| Line / area | L3 — Packet Tracer simulation fidelity |
| Finding type | Experiment result, and a deviation from a design assumption |
| Summary | The redundant path between the two HQ core switches did **not** produce the expected RSTP port roles on the first attempt; one access switch elected the uplink the design expected to become the alternate as its root port |
| Detail | Two uplinks were connected as designed, but `show spanning-tree vlan 30` on the access switch showed the reverse of the expected role assignment, because the spanning-tree priority of `VP-HQ-CORE-02` was one step lower than intended. Corrected by setting `spanning-tree vlan 10,20,30,40,45,50,60,70,80,90 root primary` on `VP-HQ-CORE-01` and `root secondary` on `VP-HQ-CORE-02`, and by adding `guard root` on the access ports that must never become root |
| Evidence | `06-verification\transcripts\TC-L3-10_spanning-tree-before.txt` and `..._after.txt`; evidence IDs EV-0042 and EV-0043; `03-build\packet-tracer\01-l2l3-core.pkt` before and after |
| Impact | Medium — no effect on any acceptance criterion, but it invalidated the first RSTP test run and consumed roughly half a day |
| Action taken | Fixed. Explicit root configuration is now the documented standard on every switch rather than an implicit expectation |
| Design baseline affected? | No contract value changed; the correction strengthens a rule the design already stated (explicit root selection) |
| Report section to update | Chapter 9 (Cisco), RSTP subsection; and the limitations section, as a simulation-fidelity note |
| Disposition | Closed |
| Reviewer | Member A, 2026-11-12 |

The worked example is deliberately a finding in which **the group was wrong**, because that is the kind of row the register exists to capture. A register containing only successes is not a findings register; it is a summary.

### 14.7 Reference Management

Every technical claim in this project resolves to a reference of one of four kinds: a **standard or framework** (the WorldSkills Occupational Standards, or an RFC), **vendor or platform documentation** for the exact version installed, the project's **own experiment** with a test-case identifier, or the **project brief** itself.

**Recording.** Each citation is a row in a single register containing: a citation key; the author or issuing body; the title as printed; the edition, version or date; the URL **only where the source was genuinely retrieved and that URL is available in the project's own research pack or was copied from the browser at the moment of access**; the access date; which member consulted it; and which report sections cite it. The consulted artefact is archived under `08-references\`, one file per citation, named with the citation key so that the register row and the archived file always agree. Where a source is printed or offline, the register records where it is held instead of a URL.

**Citation style.** In-text citations give the issuing body and a short form of the document title, with the full entry in the reference list; direct quotations are reproduced verbatim inside quotation marks, preserving the source's own spelling and punctuation, including its typographical quirks, and the section or line the quotation comes from is stated. Where a quotation contains an error in the source, the quotation is reproduced as printed rather than silently corrected, because a corrected quotation is no longer a quotation. Where a protocol specification is cited, the reference names the document and its number — for the addressing conventions used in this design the applicable documents are RFC 1918 for private address space, RFC 5737 for the documentation address blocks, RFC 2606 for reserved name suffixes and RFC 4193, which is cited only to state that this project is IPv4-only and that IPv6 is out of scope. No clause number is invented anywhere: where an edition of a specification was consulted for background rather than quoted, the register marks it as consulted but not quoted.

**The rule that every reference be genuinely consulted.** Four rules apply, and they are contract rules rather than style advice:

1. **No URL may be written from memory.** Every URL in the reference list is either present in the project's own verified research pack or was copied from the browser at the time of access, and the archived copy is the proof.
2. **A source that could not be read is cited as cited-by.** If a document is known only through another document that quotes it, the reference says so explicitly rather than presenting it as if it had been read.
3. **A version number is cited only together with the command output that produced it.** A version claim without its producing command is not a reference, it is an assertion.
4. **Nothing may be cited for a fact it does not contain.** This rule matters most where the temptation is greatest: the WSOS 2026 page is never cited for the twelve-week duration, for screen captures, or for any technology string that does not occur on it — it is not cited for FSRM, iSCSI, RRAS, IKEv2, Keepalived, nftables, WireGuard, RSTP, ASA, Agentic AI, OpenClaw or MCP, because those strings occur zero times. Where a bridge is used instead, the standard's line is quoted and the inference is then stated as an inference.

### 14.8 Version Control for Documentation

Documentation is versioned in **the same repository and by the same mechanism** as configuration and code. The justification is straightforward: the value of a design document is that it describes a specific state of a specific system. If the document and the system have separate histories, the document silently becomes a description of a system that no longer exists.

| Practice | Rule |
|---|---|
| Repository | One repository at `C:\FYP` for design, build artefacts, automation, verification, evidence index and report chapters |
| Branching | Branch-per-task, named for the work package or issue; documentation branches are named the same way as configuration branches so that a change to a system and the change to its description travel together |
| Commits | One logical change per commit; the commit message states the change and ends with the issue ID, so `git log` and the issue tracker reconstruct each other |
| Peer review | Every merge into the main line is reviewed by a second member and the review is recorded in the meeting minutes. This applies to documents as well as playbooks, because the scenario's due-diligence requirement asks for change applied through *reviewed* configuration |
| Review of document changes | A documentation change is reviewed for three things: technical accuracy, consistency with the interface contract, and whether the change affects a claim made elsewhere in the document set — for example a claim in a chapter and the result in the test report |
| Large or binary artefacts | Screenshots, `.pkt` files and PDF exports are committed because they are evidence; the rule is that a reviewed artefact is committed, not merely stored |
| Secrets | Keys, `pki/` material, `wg0.conf`, certificates with private keys and plaintext passwords are never committed. A pre-tag sweep for those patterns, and for the project's banned strings, runs before every release tag, and its output is committed as evidence |
| Tags | Milestone tags from `v0.1` through `v1.0`; `v1.0` is the submitted state and is tagged only after the week-12 consistency sweep passes |
| The word "final" | Used only for a revision that has passed that sweep, so that the word keeps its meaning |
| Off-host copies | The repository is mirrored to a second medium so that no member's machine failure can lose the project, and no member is the sole holder of any artefact |

**Where documentation is generated by automation.** Diagrams, IP and VLAN plan exports and parts of the inventory are produced from configuration and committed together with the command that generated them. Where automation generates a document, the generator is itself versioned, and the generated document records the generator's version and the run timestamp, so that a discrepancy between the document and the system can be traced to a run rather than to a person.

### 14.9 Master Evidence Index

The index is the bridge between the report and the evidence folder. The table below is the template, with its first section populated from the project's own planned work; the remaining entries are added during the project, and an incomplete index at submission time is itself an acceptance failure.

| Evidence ID | Evidence item | Type | Supports section | File path | Related test / rule | Captured by | Date |
|---|---|---|---|---|---|---|---|
| EV-0001 | Baseline frozen revision and supervisor approval note | document scan | 12.2 (gate G-P1) | `00-baseline\v00-baseline-v1.0.pdf` | O-14 | Member A | `{YYYY-MM-DD}` |
| EV-0002 | Hypervisor host-only network list with DHCP disabled per network | screenshot | 12.2 (gate G-P1) | `07-evidence\{YYYY-MM-DD}_vpnz-hvhost01_host-only-networks.png` | O-2 | Member D | `{YYYY-MM-DD}` |
| EV-0003 | Packet Tracer `show vlan brief` after trunk and native-VLAN configuration | text transcript | 13.3.3 | `06-verification\transcripts\TC-L3-12_show-vlan-brief.txt` | TC-L3-12, TC-L3-22 | Member C | `{YYYY-MM-DD}` |
| EV-0004 | `dcdiag /v` full output on `vpnz-dc01` | text transcript | 13.3.1 | `06-verification\transcripts\TC-L1-01_dcdiag-dc01.txt` | TC-L1-01 | Member A | `{YYYY-MM-DD}` |
| EV-0005 | AD UC showing the OU structure to the documented depth | screenshot | 13.3.1 | `07-evidence\{YYYY-MM-DD}_vpnz-dc01_aduc-ou-tree.png` | TC-L1-01, O-2 | Member A | `{YYYY-MM-DD}` |
| EV-0006 | HSRP `show standby brief` on both HQ core switches | text transcript | 13.3.3, 13.4 | `06-verification\transcripts\TC-L3-09_show-standby-brief.txt` | TC-L3-09, TC-FO-01 | Member C | `{YYYY-MM-DD}` |
| EV-0007 | VRRP VIP before, during and after a master failure | screenshot (3 frames) | 13.4 | `07-evidence\{YYYY-MM-DD}_vpnz-dmzrev01_keepalived-failover-vip-moved.png` | TC-FO-03 | Member B | `{YYYY-MM-DD}` |
| EV-0008 | FSRM quota-exceeded refusal on the Finance share | screenshot | 13.3.1 | `07-evidence\{YYYY-MM-DD}_vpnz-fs01_fsrm-quota-exceeded.png` | TC-L1-12 | Member A | `{YYYY-MM-DD}` |
| EV-0009 | nftables ruleset with drop policy and log prefixes | text transcript | 13.3.2, 13.5 | `06-verification\transcripts\TC-L2-09_nft-list-ruleset.txt` | TC-L2-09, TC-SEC-10 | Member B | `{YYYY-MM-DD}` |
| EV-0010 | Denied flow from the DMZ to the server zone, with the ASA log line | screenshot | 13.5.1 | `07-evidence\{YYYY-MM-DD}_VP-HQ-FW-01_asa-deny-dmz-to-srv-tb04.png` | TC-L3-15, TC-SEC-01, TB-04 | Member C | `{YYYY-MM-DD}` |
| EV-0011 | Packet Tracer ASA `show version` confirming model and image string | text transcript | Appendix F | `06-verification\transcripts\O-02_asa-show-version.txt` | open item O-02, version deviations | Member C | `{YYYY-MM-DD}` |
| EV-0012 | Published portal served through the reverse proxy | screenshot plus `curl` transcript | 13.3.2, 13.10 | `07-evidence\{YYYY-MM-DD}_vpnz-dmzrev01_portal-200-through-proxy.png` | TC-L2-02, AC-01 | Member B | `{YYYY-MM-DD}` |
| EV-0013 | Ansible idempotence — second run reporting `changed=0` | text transcript | 13.3.4 | `04-automation\runs\2026-11-17_1410_baseline-linux.log` | TC-L4-06, AC-05 | Member D | `{YYYY-MM-DD}` |
| EV-0014 | Grafana availability dashboard with all targets up | screenshot | 13.9 (objective O-10) | `07-evidence\{YYYY-MM-DD}_vpnz-mon01_grafana-targets-all-up.png` | monitoring evidence | Member B | `{YYYY-MM-DD}` |
| EV-0015 | Agent triage note from a real alert, labelled as a proposal | screenshot plus JSON log excerpt | 13.7 | `07-evidence\{YYYY-MM-DD}_vpnz-ai01_agent-triage-note-proposed.png` | TC-L5-02, AC-06 | Member D | `{YYYY-MM-DD}` |
| EV-0016 | Throughput result between two virtual machines | JSON result | 13.6 | `06-verification\iperf3\2026-11-20_hostonly-4streams.json` | performance suite | Member D | `{YYYY-MM-DD}` |
| EV-0017 | Management-port scan from a lower-trust zone showing all ports closed | text transcript | 13.5.3 | `06-verification\transcripts\TC-SEC-27_mgmt-scan-from-user-zone.txt` | TC-SEC-27 | Member B | `{YYYY-MM-DD}` |
| EV-0018 | Secrets and banned-string sweep output before the release tag | text transcript | 13.5.3, 14.8 | `06-verification\transcripts\TC-SEC-30_pretag-sweep.txt` | TC-SEC-30, TC-L4-12 | Member D | `{YYYY-MM-DD}` |
| EV-0019 | Traceability matrix with no empty cells | document | 13.9, 13.10 | `06-verification\traceability-matrix.md` | AC-10 | Member D | `{YYYY-MM-DD}` |
| EV-0020 | Signed acceptance and sign-off record | document scan | 13.10, 17.4 | `10-final\acceptance-record-signed.pdf` | AC-12 | Member A | `{YYYY-MM-DD}` |

**Index rules.** Every evidence file has exactly one row; every row names exactly one capturer; an evidence ID is never reused even when the underlying file is replaced (a replacement takes a new ID and the old row records the supersession); the index is committed to the same repository as the images; and the report cites evidence by index ID rather than by filename, so that moving a file does not break the report.

## 15. Risk Management

### 15.1 Risk Management Approach

Risk management in this project is deliberately lightweight in process and rigorous in record. The method has five elements.

**1. A single register, reviewed weekly.** One risk register is maintained in the repository. It is reviewed at every weekly gate review, and every row has exactly one owner. The register is never rewritten from scratch: rows are updated, closed with a reason, or added, so that the history of the project's risk picture stays visible.

**2. Structured identification.** Risks are identified from five sources: the design baseline's own risk material and its assumption and limitation tables; each phase gate review (what nearly went wrong this week); each defect and finding, since a defect is evidence that a risk was under-estimated; a deliberate re-review at three fixed points (after the environment build, after the perimeter is live, and before the technology freeze); and the standard's own competency areas viewed as failure modes — failure to plan, failure to communicate between colleagues, failure to document completion, failure to test and re-test.

**3. Scoring scales.** Likelihood and impact are each scored on a four-point scale, severity is their product expressed as a band, and the band determines the response obligation. The project uses its own four-point scale rather than the design baseline's High/Medium/Low wording, so that likelihood and impact can be reasoned about separately; the mapping from the baseline's own risk table to this register is given at the end of section 15.2.

| Score | Likelihood | Impact | Severity band (product) | Response obligation |
|---|---|---|---|---|
| **4** | Very likely — expected to occur on current evidence | Severe — a must-band capability, an acceptance criterion or the submission itself is lost | **Critical (12–16)**: immediate action with a named owner and a dated action, and a contingency that is already designed rather than improvised. Cannot be accepted | Action now; escalation to the project lead on identification |
| **3** | Likely — more than an even chance | Major — a should-band capability or a phase gate is lost, or several days of work are lost | **High (8–9)**: mitigate within the current phase, with a contingency named in the register | Action within the phase; contingency documented by the end of the phase |
| **2** | Possible — could occur | Moderate — a could-band capability is lost, or a day or two is lost | **Medium (4–6)**: monitor, with a stated trigger that would raise the score | Reviewed weekly; contingency described |
| **1** | Unlikely — no evidence it will occur | Minor — cosmetic or documentary, or absorbed without effect on scope | **Low (1–3)**: accept and monitor | Accepted; no action required |

**4. Response types.** Each risk carries one of five responses, recorded explicitly: **avoid** (change the design so that the risk cannot occur), **mitigate** (reduce likelihood or impact), **accept** (with the consequence stated rather than implied), **monitor** (no action yet, but a stated trigger), or **exploit** (turn the uncertainty into a deliberate, timeboxed experiment, which is how several of this project's uncertainties are converted into legitimate experiment results instead of lost weeks). Transfer through insurance is not available to a student team and is not claimed.

**5. Review cadence and escalation.**

| Review | Frequency | Who | What changes |
|---|---|---|---|
| Weekly risk review | Every Friday gate review | All four, chaired by the project lead | New rows added; scores revised; contingencies exercised; closed rows retained with the closing reason |
| Focused risk review | At the end of the environment build, at the perimeter gate, and before the technology freeze | All four | Re-scoring of every Critical and High row against actual evidence rather than expectation |
| Escalation to the supervisor | Whenever a Critical row becomes an issue, or a must-band capability is threatened | Project lead | Recorded in the minutes; the supervisor's decision is captured in the decision log |
| Escalation to the change-control board | Whenever the response to a risk requires a change to the interface contract or to scope | Project lead convenes within 24 hours | A change record, assessed and decided per section 12.7 |
| Programme-level trigger | Contingency matrix in section 12.9 | Project lead | The cut order is applied, and the register records which should-band or could-band item was cut and why |

### 15.2 Risk Register

Severity = likelihood × impact, banded as Critical (12–16), High (8–9), Medium (4–6), Low (1–3). Status is recorded as Open, Mitigated (control in place and tested), Monitored, Closed, or Realised (the risk occurred and the contingency is in use).

| ID | Category | Risk description | Likelihood | Impact | Severity | Mitigation | Contingency | Owner | Status |
|---|---|---|---|---|---|---|---|---|---|
| PR-01 | Technical | **The AI line yields nothing demonstrable.** The selected agent runtime cannot be installed, or its Skills format differs from the assumed model, or no model is reachable at all | 4 | 3 | **Critical** | Timeboxed feasibility spike in weeks 5–6 capped at three working days; read-only four-tool surface designed to be runtime-agnostic so that any of three implementations satisfies it; no version, URL, licence or capability statement about the runtime may be written without a screenshot of the running instance and a citation to the documentation actually used | Invoke fallback F1 (a generic agent loop over the same four read-only tools, roughly 150 lines) or F3 (the deterministic collectors, correlation rules and report generator with a scripted policy standing in for the agent). The chapter is then written as an agentic-tooling proof of concept evaluated against the assumed Skills model as a design reference | Member D | Open |
| PR-02 | Technical | **The all-virtual, no-physical-hardware constraint weakens or invalidates technical claims.** No real forwarding hardware, no 802.1Q trunk to a real host, no real cabling, no real power behaviour | 4 | 3 | **Critical** | The design states the constraint as a client constraint of the project; real VM segmentation is implemented with separate hypervisor host-only networks so the *outcome* is genuine even though the *mechanism* is emulated; every affected claim carries an explicit label; the single-paragraph statement of what is simulated versus genuinely configured is reused verbatim wherever a result is reported | Re-scope the affected claims as demonstrations of method and configuration correctness, not of performance or hardware behaviour; move any hardware-dependent claim into future work. If the assessor requires genuine Layer 2 behaviour, document the gap explicitly and present the emulation boundary as a stated design approximation | All four | Mitigated |
| PR-03 | Technical | **Packet Tracer fidelity limits what can be honestly claimed.** The simulator models protocol logic and CLI syntax, not hardware timing, and its ASA model is a reduced legacy model without clustering, failover pairs, threat detection or full drop-level detail | 4 | 2 | **High** | Simulator capabilities and limits are recorded per device during the build; the ASA model and image are read from `show version` on the first build day and the design corrected if they differ; timing figures from the simulator are labelled simulated; routing and firewall claims are restricted to the features actually configured and captured | Before any test, verify that the required feature exists in the simulator; if it does not, record the discrepancy as a finding and drop the claim rather than hedging it. Convergence is demonstrated by topology-change *order*, not by a millisecond figure | Member C | Open |
| PR-04 | Schedule | **The twelve-week schedule overruns because the group attempts full depth on every line.** The design is deliberately broad across five technology lines and 19 virtual machines | 4 | 4 | **Critical** | A fixed four-band priority order is applied from week 1 (must / should / could / won't); the cut order is pre-agreed and not renegotiated under pressure; each phase has entry and exit criteria so that partial work cannot masquerade as complete; the interface contract freezes at end of week 6 and no new technology is added after week 9 | Apply the cut order of section 12.9 in reverse priority: drop the optional monitoring component, then the second content-tier node, then the BGP failover capture, then EIGRP, then reduce block storage to a single attached LUN. The must band and the documentation set are never cut | Member A | Open |
| PR-05 | Resource | **Coordination across four members working on one integrated system.** Divergent naming, duplicated work, interfaces that do not fit, and unverifiable individual contribution | 4 | 3 | **Critical** | One frozen interface contract that no writer may deviate from; a RACI matrix with exactly one accountable member per row and an explicit pairing and shadow arrangement; one accountable owner per deliverable plus one reviewer; weekly integration session with a whole-estate verification run; commit history and evidence ownership as the source of the contribution matrix | Freeze the contract early and treat every deviation as a defect; if integration repeatedly fails at a boundary, assign one member as temporary integration owner for the affected pair for one week, and record it in the minutes | Member A | Mitigated |
| PR-06 | Technical | **The virtual-machine estate does not fit the single hypervisor host.** Memory is the binding constraint, with 78 GB of guest RAM allocated across the 19 virtual machines plus a 100 GB control node and an 8 GB agent node | 4 | 3 | **Critical** | Templates first, then clones; only the virtual machines a test needs are powered on; storage is thinly provisioned; the resource budget is reviewed at weeks 6 and 10; the host specification recommends 64 GB with 32 GB as an absolute minimum | Adopt the two-shift fallback: run the server-zone estate and the DMZ estate in separate shifts rather than all nineteen at once, and record the reduction honestly in the report and in the test records | Member D | Open |
| PR-07 | Schedule | **The AI spike overruns and consumes the weeks that must-band work needs** | 3 | 3 | **High** | The spike is timeboxed to three working days and its output is a *decision*, not a working system; it is scheduled after the perimeter gate so that it cannot delay must-band build; the decision deadline is end of week 6 | If the spike has no decision by its deadline, take fallback F1 by default and record the default as the decision. Do not extend the spike | Member D | Mitigated |
| PR-08 | Technical | **Inconsistent naming, addressing or version references between the four writers** | 3 | 3 | **High** | A single frozen contract of values; a banned-string list; a weekly automated consistency sweep that searches for banned strings and for divergent hostname casings before every tag; peer review of every merge | Any deviation found is corrected in the artefact and re-checked; if a divergence is found late, the interface contract is re-issued with a revision rather than patched locally in one document | Member D | Mitigated |
| PR-09 | Technical | **Version claims drift from reality.** A pinned version in the design differs from what the running system actually reports | 3 | 3 | **High** | Pinning discipline: every version is confirmed at build time with a version-printing command and the actual output is captured as evidence; a mandatory version-deviation subsection lists each difference and its impact; version claims are never made without their producing command | Publish the deviation with its impact and, where the deviation breaks a design assumption (for example an incompatible configuration syntax), fall back to the named alternative: Windows Server 2022 in place of 2025, VirtualBox in place of Workstation Pro, or the distribution-packaged version of the component. If a version differs because of the platform, the substitution is stated in every affected section | All four | Open |
| PR-10 | Security | **Credential or key material leaks into version control.** Private keys, tunnel configuration, certificate private keys or plaintext passwords committed to the repository | 3 | 4 | **Critical** | Ignore rules for key, certificate, tunnel and PKI paths; secrets held in an encrypted vault rather than in files; a pre-tag sweep for credential patterns and for the banned strings; a documented test in which a deliberately planted fake key is committed to a scratch branch to prove that the sweep catches it | Rotate every credential that touched the repository, regenerate tunnel key pairs and the affected certificate material, and record the incident as a finding with the sweep output as evidence. Treat the leak as a High defect and re-run the affected security tests | Member D | Mitigated |
| PR-11 | Resource | **A group member's computer fails mid-project** | 2 | 2 | Medium | All artefacts live in version control on the control node **and** are mirrored to a second medium; cross-cover pairing means no member is the sole holder of any artefact; build runbooks are executable by another member | The affected member works from a paired partner's machine or the control node; rebuild from the repository and the templates. Loss is bounded to the current week's uncommitted work | All four | Mitigated |
| PR-12 | Scope | **The group's interpretation of the brief diverges from the supervisor's intent** | 2 | 4 | **High** | The baseline is reviewed with the supervisor before week 3; every deliberately excluded item is presented for approval so that nothing is dropped silently; the traceability matrix exposes any gap between a brief technology name and what is delivered | Re-scope before the technology freeze; if divergence is discovered after the freeze, register a change and re-plan the remaining weeks rather than attempting a late rebuild | Member A | Open |
| PR-13 | Scope | **The report accidentally claims certification, compliance or real-world results** | 3 | 3 | **High** | The honesty statement is mandated wherever a result is reported; a final proof-read checks for the words *certified*, *compliant*, *production* and *real-world throughput* and requires each occurrence to be evidenced or deleted; the declared-limitations section is a required deliverable | Correct the wording, add the missing disclosure, and re-run the proof-read. If a claim cannot be evidenced, it is removed rather than softened | Member A | Mitigated |
| PR-14 | Technical | **Simulator behaviour differs from expectation and consumes days** | 3 | 2 | Medium | Every simulator experiment is timeboxed to half a day; questions are written down before the session so that a negative result still answers something | Stop at the timebox, record the discrepancy as an experiment result, and move on. A documented discrepancy is legitimate academic content, whereas a lost week is not | Member C | Mitigated |
| PR-15 | External | **The Linux distribution version cannot be obtained or its media is unusable** | 2 | 3 | Medium | The distribution version is pinned with a verified point release; nothing in the design depends on distribution-specific behaviour except package versions, which are pinned and recorded | Fall back to the latest point release of the same long-term-support series, or to the named alternative distribution, and record the substitution and the resulting version deviations in every affected section | Member B | Open |
| PR-16 | External | **The Microsoft Windows Server media cannot be obtained or its evaluation period expires mid-project** | 2 | 3 | Medium | The evaluation period is long relative to a twelve-week project; the campus volume licence is used if available; a fully patched base template is built once and cloned, so that media is needed once rather than per virtual machine | Fall back to the previous server edition, which supports every role used in this design, and note the substitution in every affected section and in the version-deviation subsection | Member A | Open |
| PR-17 | Technical | **Domain controller disaster recovery cannot be demonstrated.** A domain controller is deliberately failed and the environment does not recover cleanly | 2 | 3 | Medium | Replication is verified continuously and re-verified before each DR test; snapshots are taken before every destructive test; recovery procedures are documented before they are needed | Restore from the documented snapshot and re-run replication. If recovery fails beyond the timebox, record the failure as a finding — it is more valuable evidence than a smooth, undocumented success | Member A | Open |
| PR-18 | Technical | **The configuration portal or reporting interface breaks mid-demonstration** | 2 | 2 | Medium | The monitoring dashboards and the agent interface are demonstrated from a restored snapshot state; every demonstration has a pre-recorded fallback capture in the evidence index so that the demonstration can continue and the recorder can be shown afterwards | Present the recorded evidence, state plainly that the live component failed, and record the failure as a finding. A live failure handled honestly is a stronger result than a rehearsal presented as a demonstration | Member B | Monitored |
| PR-19 | External | **Certificate expiry or an unexpected revocation invalidates a demonstration or a test** | 2 | 2 | Medium | Certificate validity windows are chosen well inside the project duration; the renewal script is run and verified twice; a deliberately revoked certificate is used in the revocation test rather than an accidental one | Reissue from the internal certificate authority, which remains available throughout the project, and re-run the affected tests. The reissuance is recorded as a finding | Member B | Monitored |
| PR-20 | Security | **A misapplied firewall configuration locks the group out of a remote virtual machine** | 3 | 2 | Medium | The apply script arms a revert timer so that a bad ruleset cannot persist; management access is available from the management zone and the hypervisor console as a separate path; changes are applied with a second member present | Revert through the timer or, if that fails, restore the virtual machine from its snapshot and reapply the last known-good ruleset from version control. The lockout risk and its mitigation are demonstrated as evidence rather than merely described | Member B | Mitigated |
| PR-21 | Technical | **The load or test tooling needed for the performance suite is unavailable offline** | 2 | 2 | Medium | Only tooling already present in the operating system, in the distribution archive, or in the group's own scripts is used; the measurement method is chosen so that any of several tools can satisfy it | Use a distribution-packaged alternative or a scripted measurement loop; if the quantity still cannot be measured, measure what can be measured and state plainly which metric was substituted and why | Member D | Open |
| PR-22 | External | **Group availability is reduced by illness, workload, or a member withdrawing** | 2 | 4 | **High** | Cross-cover pairing on every line; all artefacts in version control; runbooks written so that a non-author can execute them; the pairing partner runs each paired artefact at least once during the project | Redistribute the affected line to the pair partner, apply the cut order to reduce should-band and could-band scope, and escalate to the supervisor immediately rather than absorbing the loss silently | Member A | Open |
| PR-23 | Schedule | **Evidence collection falls behind the build, so results exist but cannot be demonstrated** | 3 | 3 | **High** | Evidence capture is in the definition of done for every issue: no issue may be closed without a named, indexed evidence item; a fixed weekly documentation session; the evidence index is checked at every phase gate | Freeze new build work for one day to reconstruct the missing evidence from run logs, transcripts and version-controlled configuration; anything that cannot be reconstructed is re-executed rather than described from memory | Member D | Mitigated |
| PR-24 | Technical | **The internal certificate authority is unavailable when material is needed, blocking TLS, VPN and web tier work simultaneously** | 2 | 3 | Medium | The certificate authority runs on a domain controller with a second domain controller available; a Linux-side independent certificate authority is also deployed for tunnel material, so the design does not depend on a single issuance path | Issue from the alternative authority, document which authority issued which certificate, and record the substitution; the certificate-subject conventions are identical on both sides, so a certificate issued by either path is trusted | Member A | Open |

**Mapping to the design baseline's own risk table.** The baseline's risks were written as design risks; the register above carries them all and adds project-level risks. The mapping is deliberate and is recorded so that nothing from the baseline is silently dropped: baseline R-01 → PR-06; R-02 → PR-04; R-03 → PR-14; R-04 → PR-01; R-05 → PR-08; R-06 → PR-09; R-07 → PR-10; R-08 → PR-11; R-09 → PR-12; R-10 → PR-13. The baseline's assumption table maps to the register's external and resource rows (PR-06, PR-14, PR-15, PR-16, PR-21, PR-22), and its limitation tables — simulator limits, and the physical/logical approximations including the single-host availability limitation — are the substance of PR-02 and PR-03.

**Register summary by severity.** Critical and High rows account for 14 of the 24 entries. That is expected in a twelve-week project with five technology lines, a simulation constraint and a proof-of-concept line whose runtime cannot be verified in advance, and it is the reason the cut order in section 12.9 is fixed before it is needed.

### 15.3 The Highest-Risk Items

**1. The AI line (PR-01) — the only line whose central component cannot be verified in advance.** The design baseline is explicit that the agent runtime and its Skills model are the least verifiable element of the project: at authoring time the runtime's installation method, skill-file format, default ports, licence and even a stable version could not be confirmed from the authoring environment, and the baseline states that no version, URL, licence or capability statement about it may appear in the report without a screenshot of the running instance in this lab and a citation to the documentation actually used. The corresponding service port in the port and protocol matrix is marked as an assumption and must be corrected against the running instance.

The risk is not that the work is hard; it is that the work has a **binary dependency on a third-party runtime that the group does not control and cannot fully test in advance**, and that the brief explicitly names it as one of the five technology lines. Three mitigations make this manageable rather than paralysing. First, the design puts the **tool surface, not the runtime, at the centre**: four declared read-only tools with declared input schemas, which any of three implementations can drive. Second, the spike's output is a **decision, not a working system**, and the decision deadline is end of week 6, so a failure costs three days rather than three weeks. Third, the fallbacks are already designed — a generic agent loop over the same four tools, or the deterministic collectors and correlation rules with a scripted policy standing in for the agent. The third fallback is the important one: it means that even in the worst case the project still delivers a **verifiable, useful, documented capability**, and the AI chapter becomes an honest evaluation of an agentic design against a runtime that could not be evaluated. The baseline's own guidance applies: documenting a failure is a stronger academic result than hiding one.

**2. The all-virtual, no-physical-hardware constraint (PR-02) — an honest-evidence risk rather than a build risk.** Nothing in this project may be ordered, assumed present, or required for any verification step. That removes an entire class of practical problems, but it creates a subtler one: the temptation to describe emulated behaviour in the voice of measured behaviour, and the corresponding risk that an assessor dismisses the whole design as "not real". The project answers this by making the boundary explicit and by putting it in every chapter rather than in one disclaimer. The VM estate is genuinely configured and running; the Cisco estate is simulated; segmentation for real hosts is emulated by separate hypervisor networks rather than by 802.1Q tags; and physical hardware, real line-rate forwarding and real Internet connectivity are simply absent. Each of those four statements is a design decision with a reason, and each is labelled wherever a result touches it.

The risk is scored Critical on impact rather than likelihood because a failure here is not a lost test — it is a lost *claim*, and a claim that collapses takes the surrounding chapter with it. The mitigation is to keep claims proportionate to evidence: availability is discussed as *service* redundancy that is genuinely demonstrated (VIP failover, a second domain controller, a second proxy) and separately as *network-path* redundancy that is only simulated, and no availability figure is claimed for the single hypervisor host at all. The report states that the host is a single point of failure for the entire estate, that source artefacts are protected by version control and off-host mirrors, and that this protection applies to the **project** and not to **service availability**. Saying that plainly is what keeps the rest of the technical claims credible.

**3. Packet Tracer fidelity (PR-03) — a ceiling on what can be claimed, not a defect in the work.** The simulator models CLI syntax and protocol logic; it does not model application-specific silicon, line-rate forwarding, real hardware, real clock behaviour or real-world convergence times. Its ASA device is a reduced legacy model: clustering, active/standby failover pairs with state replication, the newer threat-detection engines and much of the drop-level detail are absent or incomplete. Its BGP support covers neighbour establishment, network statements, prefix lists, route maps and simple path attributes but not route reflectors, confederations or large-scale peering. It has no SSH server reachable from external tooling and no API at all, which is precisely why the automation line is documented as a two-track approach and why the report must state that **no playbook ever logs in to a Packet Tracer device**.

Two disciplines convert this ceiling into a managed constraint. The first is **capability verification before testing**: the exact device model and image string are read from `show version` on the first build day and any divergence from the design corrects the design, so the project never tests against a capability it assumed. The second is **the right kind of measurement**: because simulator timings are artefacts, convergence is demonstrated by the *order of topology-change events* — which port becomes root, which becomes alternate, which becomes forwarding — rather than by a millisecond figure presented as a real-world number. The risk that remains is schedule, not truth: a capability the group expected and the simulator lacks can consume a day. That is why every experiment is timeboxed to half a day and a negative result is recorded as an experiment result, because a documented limitation is worth more than an unexplained absence.

**4. The twelve-week schedule (PR-04) — a breadth problem, not an effort problem.** The design deliberately spans five technology lines, 19 virtual machines, 16 simulated network devices, 153 test-case identifiers and a documentation set with six required categories. Attempting full depth on all of that in twelve weeks is the baseline's own identified High/High risk, and the group's judgment is that the schedule is achievable **only because the scope was prioritised before the work started rather than during it**. The four-band order — must, should, could, won't — is therefore a schedule control, not a wish list, and the cut order in section 12.9 is applied from the bottom of the should band upwards.

Three structural choices reduce the risk further. Phases are ordered along the service dependency chain so that at most one phase is ever blocked, which converts parallel work from a coordination hazard into a genuine schedule benefit. The interface contract freezes at the end of week 6 and no new technology is added after week 9, which prevents the most common late-project failure: an appealing addition in week 8 that invalidates two weeks of testing. And the must band is defined narrowly enough to be defensible — core identity roles, OSPF, RSTP and firewall policy, the reverse proxy with first-hop redundancy and firewalling, three scripts and three playbooks, two demonstrated AI capabilities, and the complete documentation and evidence set — so that a project that delivers the must band and honestly declares the rest is a **complete** project rather than a truncated one.

**5. Four-person coordination (PR-05) — the risk that no individual test can detect.** Four people working on one integrated system fail in ways that no single test reveals: two members implement the same thing differently, a dependency is assumed by both and owned by neither, a naming divergence propagates into configuration and evidence, and — the failure that matters most to assessment — individual contribution becomes impossible to demonstrate. Each of these is addressed by a named mechanism rather than by goodwill: a frozen contract of values so that naming cannot diverge; a RACI matrix with exactly one accountable member per row so that no dependency is unowned; a pairing and shadow arrangement in which each partner executes the other's artefact at least once, so that cross-cover is demonstrated rather than asserted; and a weekly integration session with a whole-estate verification run, so that integration failure is detected in the week that caused it. The individual-contribution problem is answered by five overlapping evidence sources — named personal administrative accounts, accountable ownership per deliverable, disjoint section authorship, evidence ownership with performer initials, and commit history — described in section 16.4, so that no single mechanism has to carry the whole argument. The residual risk is interpersonal rather than technical, and the response is procedural: the weekly stand-up exists specifically to surface blockers early, and the standard's own expectation that a professional seeks help from peers when lacking experience in an area is treated as a working practice rather than as an admission.

**Residual and accepted risks.** Four risks are accepted rather than mitigated, and are recorded as accepted so that acceptance is a decision rather than an oversight: the single-hypervisor-host availability limitation, which no amount of process can remove; the absence of any UPS, power distribution or physical console, which makes power and physical-layer scenarios unimplementable; the absence of real public addressing and real certificate authority validation, which is a deliberate consequence of using documentation address ranges and reserved name suffixes; and the absence of a real Internet path, which means the AI line's model access — if an external API is used — depends on something the lab does not control, which is exactly why the deterministic fallback exists.

### 15.4 Issues Log

A **risk** is something that might happen; an **issue** is something that has happened. The distinction governs the response: a risk is reviewed, scored and given a contingency that may never be used, whereas an issue is assigned, worked and closed, and it consumes real time immediately. A risk that occurs becomes an issue and is closed in this log; the risk row is then marked as realised and retained, because the fact that it happened is itself information. Confusing the two produces the classic failure of a register full of past events and a project with no forward view; this project keeps them separate and reviews both weekly.

```text
=== ISSUES LOG ===
Issue ID:        IS-{nn}
Date raised:     {YYYY-MM-DD}
Raised by:       {initials}
Source:          risk realised (risk ID) | defect | test failure | external event | finding
Title:           {one line}
Description:     {what happened, with the observation or command that revealed it}
Impact:          {capability, phase gate or deliverable affected; hours or days lost so far}
Blocking?        {yes — name what cannot proceed, and who must unblock it | no}
Owner:           {one member}
Action agreed:   {the specific action, not the general direction}
Target date:     {YYYY-MM-DD}
Status:          open | in progress | blocked | resolved | closed
Resolution:      {what was actually done}
Evidence:        {evidence ID; test ID re-executed; commit reference}
Linked risk:     {risk ID, marked realised if this issue is why it is closed}
Closed by / date:{initials; date}
```

**Worked illustrative issue.** `IS-03 — VPN client connect fails with a certificate error.` Raised as a test failure during the IKEv2 acceptance test: the client's connection attempt returned a certificate-validation error rather than a logon prompt. Impact: the IKEv2 remote-access test could not run, and two dependent test cases were blocked; approximately half a day lost. Not blocking overall build, because the OpenVPN path was independent. Owner: Member A. Action agreed: verify the certificate template's subject alternative names against the certificate-subject plan, confirm that the client had auto-enrolled the machine template, and re-run the connection test after enrolment. Resolution: the client had not yet received the auto-enrolment policy because it was in a group that the policy did not target; the test client was moved into the correct organisational unit and the policy was confirmed with a group-policy result report before the test was re-run. Evidence: the re-executed test record, the group-policy result report screenshot, and the successful connection transcript. Status: closed. Linked risk: none — which is itself recorded, because the correct response to an issue with no matching risk is to ask why the risk review did not anticipate it.

### 15.5 Assumptions Log

Each assumption is something the project depends on and does not fully control. The right-hand column states what happens if the assumption is false, so that no assumption is discovered to be load-bearing only at the moment it fails. Items marked **[ASSUMPTION]** are those the design baseline itself could not verify and which must be re-checked at build time.

| ID | Assumption | What it enables | If it turns out to be false |
|---|---|---|---|
| AS-01 | Each of the four members has, or can share, a machine capable of running the chosen hypervisor, with 64 GB of RAM recommended and 32 GB as the absolute minimum | Running the 19-virtual-machine estate concurrently | Adopt the documented two-shift fallback: run the server-zone estate and the DMZ estate in separate shifts, reduce concurrency, and record the reduction in the report and in the affected test records |
| AS-02 | **[ASSUMPTION]** The free-personal-use entitlement of the recommended hypervisor version still applies to the exact build at the time of build | Using the virtual network editor's arbitrary host-only networks with the built-in DHCP service disabled, which is the hardest requirement to satisfy on the alternatives | Switch to the named alternative hypervisor rather than paying: host-only networks are created by command, the built-in DHCP service is disabled per network, and the one over-limit network is placed on an internal network instead, with that change documented |
| AS-03 | **[ASSUMPTION]** The group's Cisco NetAcad account provides the current simulator build | All Cisco configuration, routing, switching and firewall work | Use whatever build NetAcad provides, record its version, and note the version deviation; never use a third-party or mirrored installer |
| AS-04 | **[ASSUMPTION]** The simulator ships the assumed ASA device model and security-appliance image | The DMZ and edge firewall demonstrations | Read the actual model and image from the device's own version output on the first build day; if the assumed device is absent, use the older device the build does provide, record the substitution in the version register, and state plainly that the simulator's appliance is not a faithful model of the assumed hardware |
| AS-05 | **[ASSUMPTION]** Windows Server 2025 evaluation media, or the campus volume media, is available to all four members | The nine Windows Server guests and every identity, file, storage and remote-access role | Substitute the previous server edition and note it in every affected section; every role used in this design exists there too |
| AS-06 | **[ASSUMPTION]** PowerShell 7.4 LTS can be installed on the jump host, while Windows PowerShell 5.1 is present in-box on all guests | Script authoring and cross-platform consistency | Use only the in-box runtime, and state which runtime each script was actually tested on rather than claiming the newer one |
| AS-07 | **[ASSUMPTION]** The exact minor versions of the Linux components match the distribution's current package versions | The pinned version table | Record the versions the running system actually reports as evidence, publish the deviation with its impact, and fall back to the distribution-packaged versions, which is the documented default behaviour for most components |
| AS-08 | **[ASSUMPTION]** IPv6 is not touched at all; the design is IPv4-only | Scope control and addressing simplicity | Revise the design baseline, re-issue it as a new revision, and re-plan the affected addressing documentation; this is explicitly a baseline-revision-class change rather than a local decision |
| AS-09 | An AI runtime is installable and workable on the agent virtual machine, and its Skills model resembles the assumed model | The AI proof of concept as designed | Take fallback F1 (a generic agent loop over the same four read-only tools) or F3 (deterministic collectors and correlation rules), record the decision, and write the chapter as a proof of concept with declared scope |
| AS-10 | A model is reachable from the agent host, either as a small local model or through an external API with a free-tier key | Any generative behaviour in the AI line | Demonstrate the deterministic half only — the four collectors, the correlation rules and the report generator — with the agent replaced by a scripted policy, and documentation-drafting as the single reduced capability |
| AS-11 | **[ASSUMPTION]** No licence is purchased for the issue tracker; either the repository's own issue facility or a free tier is used | Task, defect, risk and change tracking | Use the repository's own issue facility, which is the documented default anyway, and record the switch so that issue IDs referenced in the report remain resolvable |
| AS-12 | **[ASSUMPTION]** Diagramming is done with an offline tool, so that no diagram depends on live Internet access at writing time | All topology and architecture figures | Produce figures from the simulator's own screenshots and terminal output, which are the primary evidence in any case, and treat hand-drawn topology images as secondary as the design already provides |
| AS-13 | The campus network is not required for any in-lab dependency other than operating-system and package downloads | The premise that the lab is self-contained once built | Pre-download operating-system images and package caches to the control node before the build week, so that the lab can be rebuilt without campus connectivity |
| AS-14 | The standard's published page resolves and displays the edition being cited | The standards-alignment argument in section 13.8 and the reference list | Cite it as cited in the project's own verified research pack, which records the page's status, size, title, edition label and timestamp, plus the machine-verified requirement line count and the zero-mismatch re-verification result; never paraphrase clauses that were not read |
| AS-15 | **[ASSUMPTION]** The security-tooling commands used in the security tests exist in the environments used to run them | Reproducible security test procedures | Substitute an equivalent present tool or a scripted connection-attempt loop, and state which command was substituted and why, so that the test remains reproducible by a third party |
| AS-16 | The group can cite the occupational standards as a reference framework for documentation quality and technology alignment, **not** as a compliance standard the project is being assessed against | The entire standards-alignment argument, and the freedom to declare out-of-scope items honestly | State the distinction explicitly and soften the alignment claims to a comparison rather than a mapping; the project's own success criteria are independent of the standard and remain intact |
| AS-17 | All laboratory names and addresses are lab-only and will never be registered or resolved publicly, and no real public address is used anywhere | Using documentation address ranges and reserved name suffixes throughout | None: this is a naming choice, and its falsity would be a breach of the project's own rules rather than an external dependency |
| AS-18 | All four members remain available for the majority of the twelve weeks, with reduced availability during the host institution's assessment periods | The pairing and cross-cover arrangement, and the weekly rhythm | Apply the pairing arrangement, redistribute the affected line to the pair partner, apply the cut order to reduce should-band and could-band scope, and escalate to the supervisor immediately rather than absorbing the loss |

## 16. Project Management and Team Organisation

### 16.1 Team Structure and Roles

The group has four members and delivers five technology lines plus the documentation and project-management workstreams. Roles are therefore **functional**: a role is a responsibility that has to be discharged, and the technology lines are distributed so that each role carries a comparable load. Membership is identified as Member A to Member D so that the role descriptions remain stable if names change.

| Role | Holder | Responsibilities | Technology line owned | Principal deliverables |
|---|---|---|---|---|
| **Project lead and integration owner** | **Member A** | Chairs the weekly review and the change-control board; owns the interface contract and the consistency sweep; owns the risk register, the issues log and the schedule; maintains the decision log; is the single point of contact for the supervisor; owns final assembly and the proof-read | **L1 MS-SERVER** (9 Windows Server guests: identity, name resolution, addressing, certificate services, file services, block storage, remote access) | Domain and identity design; policy set; certificate authority; file shares; storage units; certificate-based remote access; the L1 build runbooks; the final report; the acceptance record |
| **Infrastructure and services owner** | **Member B** | Owns the Linux estate and the service tier: hardening, reverse proxy, first-hop redundancy, host and network filtering, tunnelling and the content tier; runs the storage and web-tier failover tests; owns the monitoring stack's application layer | **L2 LINUX-SERVER** (10 Linux guests) | Reverse proxy with transport-security termination and upstream pools; two redundancy pairs; the egress filter with logging, translation and the rollback timer; the second remote-access implementation with the Linux-side certificate authority; the tunnel estate; the content tier; the L2 build runbooks |
| **Network owner** | **Member C** | Owns the whole simulated network estate: topology, VLAN and trunk discipline, routing domains, first-hop redundancy on switches, spanning-tree behaviour, the firewall perimeter and the voice device; owns the network data surface that the innovation line reads | **L3 CISCO** (16 simulated network devices) | Five incremental simulator project files; interior routing area 0; the second routing domain with tagged redistribution at one point; exterior routing to two providers with prefix policy; rapid spanning-tree root selection and Layer 2 hardening; the firewall perimeter with access control, translation, inspection and centralised logging; the site-to-site tunnel; the L3 build runbooks |
| **Automation, AI and documentation owner** | **Member D** | Owns the automation substrate and everything built on it; owns the hypervisor platform decision; owns the agent runtime and its read-only tool surface; owns the evidence index, the findings register and document assembly | **L4 AUTOMATION** and **L5 AI-NETOPS**, with Member C as the second owner of the innovation line's data surface | Hypervisor selection and host-only network design; templates; the repository and branch workflow; five PowerShell scripts; nine playbooks and seven roles; five Bash scripts; the run-log discipline; the agent runtime, four read-only tools, allow-list, rate limit and audit log; the master evidence index; the findings register; the traceability matrix |

**Two notes on the structure.** First, **project lead and integration owner are one role, held by Member A**, because integration failure is the project's principal coordination risk and the person who chairs the review should also be accountable for integration working. Second, **the documentation integration role is held by Member D rather than by a fifth person**, which means Member D carries the heaviest administrative load; the compensating arrangement is that every member owns their own evidence and section authorship, and Member D integrates rather than writes the whole set. That split is stated explicitly so that the load is visible rather than hidden inside the word "documentation".

**Governance rules the structure depends on.** One member is accountable for every deliverable and one other member reviews it. The interface contract of values — hostnames, addresses, VLAN identifiers, AS numbers, account names, policy names and the banned-string list — may not be changed by any member acting alone: a change requires a decision-log entry, three-of-four agreement, supervisor awareness and a re-issued revision, because the failure mode this project must avoid is four documents that contradict one another.

### 16.2 Communication Plan

| Communication type | Audience | Frequency | Channel | Owner |
|---|---|---|---|---|
| Stand-up | All four members | Weekly on Monday in the formal rhythm, with ad-hoc exchanges on working days | In person or a group call; a shared channel for short exchanges | Project lead |
| Integration session | All four members | Weekly, Thursday | In person at the lab host | Integration owner |
| Weekly review and gate | All four members | Weekly, Friday | In person | Project lead |
| Documentation session | All four members | Weekly, Friday | In person | Documentation owner |
| Supervisor review | Supervisor, all members | Fortnightly, and at every phase gate | In person or the institution's channel | Project lead |
| Change-control board | Requester, the accountable owners of affected lines, and the two members not otherwise affected | As required, within 48 hours of a request | In person or group call | Project lead |
| Risk and issues review | All four members | Weekly at the review, and immediately when a Critical risk becomes an issue | The weekly review, then the repository register | Project lead |
| Deliverable handover inside a pair | The two members of the pair | At least once per artefact before the phase gate in which it is first due | In person at the lab host, with the session minuted | The pair's primary owner |
| Written status report | Supervisor, and the repository | Weekly | Written report committed to the repository and sent to the supervisor | Documentation owner |
| Issue and defect notification | The affected line's owner and the reviewers | Immediately on identification | The issue tracker | Whoever identifies it |
| Evidence handover | Documentation owner | Weekly | The repository, at the documentation session | Each member, for their own captures |
| Escalation of a blocker | Project lead, then the supervisor if the blocker is external | Immediately | Direct message, then the supervisor channel | Whoever is blocked |
| Demonstration rehearsal | All four, then the assessor | Once in week 11, then at the final demonstration | In person | Project lead |

**Channel discipline.** A decision is only valid when it is in the repository. A decision made in conversation is recorded in the minutes at the next session, and a decision that affects the interface contract is additionally recorded in the decision log with the revision it implies. Screenshots are transferred to the repository at the weekly documentation session rather than accumulated on individual machines, so that the evidence set never depends on a single laptop being present.

### 16.3 Stakeholders

| Stakeholder | Role in relation to the project | Primary interest | How they are engaged |
|---|---|---|---|
| **Project supervisor** | Academic supervisor, approval authority for scope, and the person who signs off the delivered work | That the scope is realistic, that the standards alignment is honest, and that the group's declared exclusions are deliberate rather than evasive | Fortnightly reviews and phase-gate reviews; the frozen baseline presented before week 3; every excluded item presented for approval so that nothing is dropped silently; the sign-off sheet and the acceptance record |
| **Assessor or examiner** | Evaluates the delivered solution, the report and the demonstration | Technical correctness, evidence quality, traceability from objective to test to artefact, and honest disclosure of limitations | The documentation set, the traceability matrix, the master evidence index, the live demonstration, and the version-deviation and limitations sections |
| **The host organisation's IT manager (in-scenario)** | The fictional client for which the network is built: the head of a five-person IT team at a 160-staff financial-technology firm | That the design satisfies the five due-diligence items: segregation of the platform production chain; documented least-privilege access with an administrative audit trail; certificate-based remote access with no shared passwords; documented failover behaviour for the customer-facing tier; and change applied through reviewed, repeatable configuration | The design chapters; the demonstration of the published service path; the due-diligence mapping; and the user-acceptance walkthrough in which the client role confirms the five items are addressed |
| **Team members (each of the four)** | Deliverers and mutual reviewers; each is accountable for one line and shadows a partner | A clear scope, a fair load, and evidence that their individual contribution is assessable | The responsibility matrix, the pairing arrangement, the weekly rhythm, commit history and the contribution matrix |
| **The wider programme and the next cohort** | Secondary audience for the artefacts as a reusable laboratory | That the estate can be rebuilt from the runbooks and that the automation is re-runnable rather than a one-off | The build manual, the operations manual, the version register with its confirmation commands, and the configuration backup and restore procedure |
| **Software, platform and simulator providers (indirect)** | Not stakeholders in the usual sense but dependencies: their documentation is the basis for configuration, and their licensing terms constrain what may be installed | Behaviour that matches their documentation, and compliance with their licence terms | Documentation archived in the reference register; licensing and entitlement assumptions recorded and re-checked at build time |

**A note about actors.** The project separates the **real** approval chain from the **in-scenario** one. The supervisor approves scope, receives gate reviews and signs off the delivered work. The IT manager role belongs to the client scenario: it supplies the design's business driver and provides a realistic user-acceptance conversation. The project does not claim the involvement of any real external organisation, and no real user data is handled at any point.

### 16.4 Individual Contribution and Assessment

Individual contribution normally has to be evidenced, and a four-person project on one integrated system makes that genuinely difficult: the system succeeds or fails as a whole, so contribution cannot be read off the outcome. This project answers with five **overlapping** evidence sources, so that no single source has to carry the argument and no member's mark depends on a colleague's memory.

| Source | What it evidences | Where it lives | Who can check it |
|---|---|---|---|
| **Named administrative accounts** | Who performed each administrative action in the laboratory. Every member holds one personal named account; administrative actions are logged, and no shared administrative account is used in normal operation | Security event logs, the script-transcription share, and the session history on the management jump host | Any member, the supervisor, the assessor |
| **Commit history** | Who wrote which configuration, playbook, script, document section and index row, and when. Commits are attributed to the author's account and the commit message carries the issue ID | The version-control repository on the control node, reported with the shortlog and log commands | Any member, the assessor |
| **Accountable ownership per deliverable** | Who owned each deliverable and who reviewed it. The responsibility matrix assigns exactly one accountable member per row, and every merge is peer-reviewed with the review minuted | The responsibility matrix in section 12.5.1, the minutes, and the issue tracker's assignee field | Any member, the assessor |
| **Section authorship** | Who wrote which part of the report. Authorship is disjoint and recorded in the section map; a section's author is accountable for its technical accuracy | The report's section map and the commit history of each section file | The assessor |
| **Evidence ownership and performer initials** | Who captured each piece of evidence and who performed each verification. Every evidence item names exactly one capturer, and every verification record carries the performer's initials and, for Critical and High-severity tests, a witness | The master evidence index and the executed test records | Any member, the assessor |

**The contribution matrix.** A contribution matrix is maintained in the repository and is **derived** from the five sources above rather than asserted alongside them.

| Contribution dimension | Evidence source | Reported as |
|---|---|---|
| Work packages owned and delivered | Issue tracker plus phase gate records | Count, with the percentage of that line's work packages completed |
| Deliverables owned | Responsibility matrix | Row count by accountability level |
| Deliverables reviewed | Minutes and issue reviews | Count, with the deliverables named |
| Automation artefacts authored | Commit history and run logs | Count of scripts and playbooks, with the number of recorded successful runs and the idempotence evidence reference |
| Test cases executed | Executed test records | Count by line, with pass, pass-with-limitation or documented failure, and the test IDs listed |
| Evidence captured and indexed | Master evidence index | Count by evidence type, with the identifiers listed |
| Report sections authored | Section map and commit history | Section numbers and the attributable length |
| Change records raised and decided | Decision log | Count, with the outcome of each |
| Cross-cover exercises completed | Minutes | The paired artefacts each member has executed as the shadow |

Its purpose is to make the distribution of work visible early enough to correct it: if the matrix shows one member with half the owned work packages of the others at week 8, the response is a re-balance recorded in the minutes, not an explanation written in week 12. In the report, the matrix is presented with its sources cited, and each member's technical chapter is presented under their own accountability. The honest position is stated once and not repeated defensively: a four-person integrated project is assessed both as a system and as four contributions, and this project's contribution record is designed to support the second assessment without weakening the first.

### 16.5 Health, Safety, Legal and Ethical Considerations

This project is a virtualisation and simulation exercise performed on student-owned computers, so the safety discussion is short and concrete rather than ornamental. The relevant obligations appear in the standard's own work-organisation section, which places health and safety duties, safe working practice, the care of tools and equipment and the integrity of user equipment and information among the first requirements an IT network systems administrator must meet.

**Health and safety in a virtual context.** The hazards at issue are not electrical or mechanical, because no physical network hardware, no cabling and no server-room work is involved. The real hazards are of the working-environment kind. Workstation posture and ergonomics are observed during prolonged configuration sessions, with breaks taken between long tasks. Display and lighting conditions are set to reduce eye strain during extended reading of terminal output and log files. No mains or internal hardware work is performed on any machine. Where a member does handle components — for example adding memory to a hypervisor host — the standard's own guidance applies: the machine is powered down and unplugged and electrostatic discharge precautions are used, because electrostatic damage is the one genuine physical hazard a project of this shape can encounter. Electrical safety follows the manufacturer's instructions and no cable, socket or power supply is modified. Data safety is treated as a safety matter too: the laboratory is isolated from the campus and home networks by design, bridging is forbidden, and no experiment is directed at any system the group does not own.

**Software licensing.** The project is explicit: **only properly licensed software, free-of-charge software, or software that is free for personal use is installed**, and no commercial licence is purchased or claimed. Concretely: the hypervisor is used under its free-for-personal-use entitlement, which is re-checked at build time, with the named alternative being free open-source virtualisation rather than a purchase; server operating systems are used under a time-limited evaluation licence or the host institution's volume media entitlement; the Linux estate uses distribution packages and freely licensed components throughout; the network estate is configured inside a simulator provided through the group's academy account and no third-party or mirrored installer is used; and the open-source components — reverse proxy, first-hop redundancy, packet filtering, tunnel software, certificate tooling, monitoring, configuration management and version control — are used under their respective licences. Because one component in the innovation line had genuinely uncertain licensing provenance at design time, the project rule is strict: no version, capability or licence statement about it may appear in any deliverable without a screenshot of the running instance and a citation to the documentation actually used. Where an entitlement could not be verified, the design names a free fallback rather than assuming a right to install.

**Data protection.** The laboratory uses **fictional data only**. There is no real customer data, no real personal data, no production database and no live system anywhere in the project. Names, account identifiers, document content and application data are generated by the group for testing; the scenario organisation is fictional; and no record retrieved from any real system is used. Addresses come from the documentation address ranges and published service names use a reserved name suffix, so no real organisation's name or address space appears. This is a design constraint rather than an aspiration, and it is verifiable: a repository search for real domain names, real public addresses and real personal data is part of the pre-release sweep.

**Academic integrity.** Four rules apply without exception. First, **all technical results are traceable to a command transcript or a screenshot**; no result is reported that cannot be reproduced from its recorded procedure. Second, **no generated content is presented as measured data**: where an assistance tool has been used to draft or restructure text, that use is disclosed, and generated text is never the source of a technical figure — figures come from the estate. Third, **all sources are genuinely consulted and cited**, with no address written from memory and no reference presented as read when it was only quoted elsewhere. Fourth, **failures are reported**: an incorrect output from the innovation line, a test that did not pass, a version that differs from the register and a capability that was cut are all recorded, because presenting a limitation honestly is a stronger academic result than reporting a false pass.

**Professional ethics.** Deliberate-misuse experimentation is conducted ethically: the failed-login burst, the configuration-drift test, the rogue address-assignment test and the management-port scan are all performed against the group's own laboratory segments, are documented in advance, and are sourced from the deliberately isolated segment that the design itself keeps unprivileged. No test is directed at any system the group does not own, and no service is probed beyond the laboratory boundary. Least privilege is applied to people as well as services: administrative accounts are personal, two of the four members hold the highest tier of access because they administer the identity layer, and the reason and its limits are documented rather than glossed over. Break-glass access is sealed and unused during normal operation, with any use logged in the report. The project also states plainly what it is **not**: the design is *aligned with* selected security controls; it is not certified against them, it makes no compliance claim, and no penetration test is claimed. That is a professional-ethics statement before it is a legal one — the temptation to imply more than was delivered is the specific failure this project is structured to avoid.

### 16.6 Cost Estimate

The design deliberately uses free, free-for-personal-use or open-source software throughout, and no commercial licence is purchased. The dominant cost is therefore not software at all: it is the compute resource of the hypervisor host, the electricity that host consumes over twelve weeks, and the depreciation of hardware the members already own. The table is indicative, is expressed in Hong Kong dollars, and is honest about the fact that most of the money is not spent by the project but consumed by it. **[ASSUMPTION]** The monetary values are planning estimates based on typical local domestic electricity tariffs and typical local retail prices for the hardware classes involved; they are not quotations and no purchase is planned.

| Item | Basis of estimate | Quantity | Indicative cost (HK$) | Notes |
|---|---|---|---|---|
| Hypervisor software | Free for personal use | 4 installations | **0** | Entitlement re-checked at build time; the fallback is free open-source virtualisation rather than a purchase |
| Server operating systems | Evaluation licence or institution volume media | 9 guests | **0** | No licence purchased; the substitution fallback is stated in the assumptions log |
| Linux estate | Free open-source distribution packages | 10 guests | **0** | No subscription and no support contract |
| Network simulator | Provided through the group's academy account | 4 installations | **0** | No third-party installer used |
| Open-source service stack (reverse proxy, first-hop redundancy, filtering, tunnels, certificate tooling, monitoring, exporters, configuration management, version control) | Free open-source licences | All | **0** | The obligations of each project's licence are observed |
| Hypervisor host — already owned by a member | 8–16 cores, 64 GB memory, 2 TB NVMe, Windows 11 Pro | 1 host | **0 (sunk)** | Not purchased for the project; recorded so that the true resource cost is visible. Typical equivalent new-build cost: **HK$12,000–18,000** if a machine had to be bought |
| Additional host memory if a member's machine has 32 GB | One 32 GB memory kit | 0–2 kits | **0–1,400** | Only if needed to reach the recommended 64 GB; the 32 GB two-shift fallback avoids the purchase entirely |
| External storage for the off-host evidence mirror | A spare portable drive already owned, or one small drive | 1 | **0–500** | The mirror can also be an existing drive or a cloud account already held |
| Electricity — hypervisor host | Host plus display drawing roughly 200 W average, running 8 h/day, 6 days/week for 12 weeks ≈ 576 h ≈ 115 kWh at roughly HK$1.3/kWh | ~115 kWh | **~150** | **[ASSUMPTION]** average draw and tariff; the estate is powered off when not under test, which is also the resource-budget discipline |
| Electricity — three secondary machines for document work and lighter guests | ~60 W average for three machines, 6 h/day, 6 days/week for 12 weeks ≈ 78 kWh | ~78 kWh | **~100** | Lighter load; document work needs no virtual machines |
| Hardware depreciation attributable to the project | Host at roughly HK$15,000 over a five-year life = HK$3,000/year; twelve weeks is about 23 % of a year | 0.23 machine-year | **~690** | Depreciation rather than cash, included because the host's service life is genuinely consumed |
| Printing, binding and document production | Two bound copies plus draft printing | ~500 pages | **~250** | Institution-dependent |
| Internet connectivity | Already provided at home or on campus | 12 weeks | **0** | No dedicated circuit; campus connectivity is not required for any in-lab dependency other than downloads |
| Model access for the innovation line | Free tier only | 12 weeks | **0** | A documented risk: if no free tier is available, the deterministic fallback is used and no cost is incurred |
| Contingency for a mid-project component failure (a memory module or a drive) | 10 % of the non-trivial items | — | **~150** | A failed member machine is the largest single cash risk, and it is a member's cost rather than the project's |
| **Indicative total** | | | **≈HK$1,340–1,490 in cash, plus roughly HK$690 of depreciation, plus a sunk host worth HK$12,000–18,000** | Excluding the sunk host, cash cost is under HK$1,500 and the largest single line is electricity |

**Stated assumptions behind the estimate.** The hypervisor host is already owned and is not a project purchase. Machines run only when work is being done and the estate is powered down outside build and test windows, so the electricity figure reflects a disciplined rather than a continuous operating pattern. No software licence, support contract, subscription or hardware purchase is planned. No cost is attributed to member time, because twelve weeks of academic effort cannot be priced meaningfully without inventing a rate. The estimate excludes the sunk cost of members' existing laptops and any cost of the institution's network and facilities, both of which the project uses without charge. The two figures that would change the estimate materially are a decision to buy additional memory to reach the recommended 64 GB, and the failure of a member's machine; both are recorded in the assumptions log and the risk register rather than left implicit.

## 17. Expected Outcomes and Deliverables

### 17.1 Technical Outcomes

At the end of week 12 the following will exist and will be demonstrable from a documented starting state.

| Category | Quantified outcome |
|---|---|
| Virtual machines | **19 virtual machines** on a single hypervisor host: **9 Windows Server guests** and **10 Linux guests**, plus **2 powered-off templates** from which every guest is cloned. **[ASSUMPTION]** If the tunnel-peer decision requires an additional Linux guest to represent the small-office encrypting gateway, the estate becomes 20 virtual machines and the inventory table is corrected by revision; the baseline's authority is preserved in Appendix C, which reproduces the authoritative inventory |
| Hypervisor host | **1** host, with **9 host-only virtual networks**, the hypervisor's own addressing service disabled on every one, and bridged networking disabled by design |
| Simulated network devices | **16 logical devices** across four sites: 2 HQ core switches, 4 HQ access switches, 1 HQ edge router, 1 firewall appliance, 3 branch edge routers, 3 branch access switches, 1 simulated provider edge and 1 voice device — delivered in **5 incremental project files** ending in the full topology |
| VLANs | **20 configured VLANs** with the exact names of the VLAN plan, plus a shutdown blackhole VLAN that carries no traffic and a native VLAN that is never the default |
| Routing | Interior routing in a single area between HQ and one branch; a second routing domain with **1** tagged redistribution point and **2** route tags; exterior routing to **2** simulated providers with prefix filtering and path preference; first-hop redundancy at **2** layers |
| Identity | One forest; one domain; **3 domain controllers** (2 writable, 1 read-only at the branch); the full organisational-unit tree; **14 security groups**; **9 documented service accounts** plus personal administrative accounts; **11 policy objects**; a **2-tier** administrative model |
| Services | **35 catalogued entries** in the port and protocol matrix, of which one is explicitly not used in the design, spanning name resolution, addressing, directory authentication, file sharing with quota and screening, block storage, remote access, web publishing, content management, monitoring, logging and reporting |
| Automation | **5 PowerShell scripts** with a shared module; **9 Ansible playbooks**, **7 roles** and Jinja2 templates; **5 Bash scripts** with a shared library; all re-runnable with unchanged output on a second run |
| Monitoring | **1** control node providing metrics, dashboards, log aggregation, a configuration archive and version control; **3 provisioned dashboards**; **3 alert rules** demonstrated firing and resolving |
| Innovation line | **1** agent runtime exposing exactly **4 read-only tools**, with **0** write paths, a tool allow-list, a rate limit and a complete machine-generated invocation audit log |
| Test coverage | **153 test-case identifiers**, of which **152 are executable tests** and one — the hypervisor-host failure — is recorded as a declared non-test. The breakdown is 103 per-line cases, 11 cross-cutting cases covering documentation, project governance, monitoring and certificate lifecycle, 33 security cases and 6 failover cases that no per-line case already covers |
| Trust boundaries | **All 16 trust-boundary rows evidenced**, with the deny rows evidenced by a logged denial and the permitted rows by a successful, attributed flow |
| Documentation | **1** final report, **1** build manual, **1** test report, **1** operations manual, **1** automation reference, **1** presentation, **1** master evidence index, **1** traceability matrix with no empty cells, and **1** signed acceptance record |

### 17.2 Documentation Outcomes

| Deliverable | Content | Indicative page count |
|---|---|---|
| Proposal (this document set) | Scope, aim and objectives, standards alignment, technology review, architecture, per-line design chapters, implementation plan, test and acceptance plan, documentation and evidence management, risk management, project management, outcomes, conclusion, references and appendices | ~90–120 pages |
| Design document | The architecture chapters in stand-alone form, with topology diagrams, the addressing and VLAN plans, the trust-boundary table and the decision log | ~40–55 pages |
| Build manual | Per-guest and per-device build runbooks for the Windows, Linux and simulated network estates, with the exact sequence, the commands and a reference to the evidence for each stage | ~60–80 pages |
| Test report | The test plan, the executed test records, the trust-boundary results, the failover timings, the performance results and the defect list | ~50–70 pages |
| Operations manual | Day-two procedures: adding a user, adding a host, renewing a certificate, applying a configuration change, running the automation, failing over and failing back, backup and restore, and troubleshooting by symptom | ~35–50 pages |
| Automation reference | The inventory, playbooks, roles, scripts and run-log index, with the idempotence evidence and the two-track honesty statement about network-device automation | ~25–35 pages |
| Evidence index and traceability matrix | Every evidence item with its identifier, type, supporting section, path, related test and capturer; and the objective-to-test-to-evidence matrix | ~15–25 pages |
| Findings, risk and decision registers | The findings register, the risk register with its change log, the issues log, the assumptions log and the decision log | ~15–25 pages |
| Presentation | The demonstration walkthrough and the technical briefing | ~25–40 slides |
| **Total documentary set** | | **~350–500 pages equivalent** |

Page counts are indicative planning figures derived from the artefact list and the phase plan rather than a commitment; the design baseline fixes the *content* of each deliverable. The report's own chapter on limitations and declared exclusions is deliberately generous relative to its technical content, because it is the part of the document an assessor is most entitled to check.

### 17.3 Skills and Competency Outcomes

The project is aligned to the six assessment sections of the WorldSkills Occupational Standards 2026 for IT Network Systems Administration, with their published weightings. The table records what each member will be able to do, and it also records the honest limits of the alignment.

| Standard section (exact title and weight) | Competency outcome | How this project produces it | Evidence |
|---|---|---|---|
| **1 Work organization and management (5 %)** | Planning, scheduling and prioritising under a fixed deadline; methodical working practice; accuracy and attention to detail; collaborative research; maintaining currency in a fast-changing field; working effectively as a member of a project team | The phased plan with gates, the responsibility matrix, the change-control process and the weekly rhythm; the research discipline of the reference register; the innovation line as a deliberately current-technology investigation | The plan, the registers, the weekly reports and the gate records |
| **2 Communication and interpersonal Skills (5 %)** | Effective written and verbal communication with colleagues and managers; teamwork; resolving conflicting demands; sharing knowledge and helping develop a supportive learning culture | The cross-cover pairing arrangement, peer review of every change, the supervisor review cadence, and the documentation set itself | Minutes, review records and the contribution matrix |
| **3 Data Transfer Networks (25 %)** | Configuring access, aggregation and core switching; enterprise-wide connectivity with interior and exterior gateway routing protocols; load balancing and fault tolerance at routing and switching levels; basic control-plane and data-plane security; branch connectivity using VPN technologies; network discovery and traffic analysis | The whole network line: VLAN and trunk discipline, interior routing, a second routing domain with tagged redistribution, exterior routing with policy, rapid spanning-tree, first-hop redundancy at two layers, the firewall perimeter, site-to-site and remote-access tunnels, and the monitoring and discovery evidence | The test cases of section 13.3.3, the failover suite, and the security permission and denial evidence |
| **4 Network and System Operations (25 %)** | Installing and managing directory, name resolution, addressing, translation, time, remote access, authentication, monitoring, certificate, sharing, web hosting, terminal access, backup and file-system services across a variety of operating systems | The entire service estate across nine Windows and ten Linux guests: identity with redundancy, addressing with failover, file services with quota and screening, block storage, certificate authorities on both platforms, certificate-based remote access, the reverse proxy and content tier, the monitoring and log stack, and backup | The test cases of sections 13.3.1 and 13.3.2, and the port-matrix execution |
| **5 Infrastructure Automation (15 %)** | Setting up and running routine infrastructure maintenance through scripting languages; using modern automation tools for deployment and configuration management; identifying and implementing infrastructure as code; understanding continuous integration and delivery concepts and the importance of version control | The automation line: PowerShell, Bash, Ansible and Git within a reviewed change workflow. The standard names exactly these tools, and the project uses exactly these tools | The test cases of section 13.3.4, the run logs, the idempotence evidence and the repository history |
| **6 Troubleshooting (25 %)** | Selecting roles and features and agreeing the solution with the relevant parties; preparing a technical document for agreement and sign-off; configuring to manufacturer guidance or organisational best practice; testing, rectifying and re-testing; gaining and recording user acceptance; using system logs and packet inspection and connectivity tools to identify problems | The documentation and verification workstreams, the defect and findings registers, the log-based and capture-based troubleshooting evidence, and the acceptance process | The executed test records, the findings register, the defect records and the acceptance record |

**Limits of the alignment, stated plainly.** Four disclosures belong with the table above, because an alignment claim that overreaches is worth less than no claim.

1. **The twelve-week duration is the project's own client constraint and is not derived from the standard.** The standard contains **no time limit and no module structure**: the words `hour`, `hours`, `minutes`, `days` and `module` occur zero times on the published page. Weightings and requirement lines are citable; duration and module counts are not.
2. **The screen-capture requirement comes from the project brief, not from the standard.** The strings `screen`, `capture`, `screenshot` and `evidence` occur zero times on the standard's page. The evidence set exists because the brief demands it, and the project does not attribute that demand to the standard.
3. **Several technologies in this design are not named by the standard at all**, including file-server quota and screening, network block storage, certificate-based remote-access service on the Microsoft platform, host-based packet filtering, the tunnel implementation used for the small-office peer, rapid spanning-tree, the firewall appliance platform and the simulator itself. Each is justified from the project brief and from generic requirement lines, and each bridge is presented as an inference from a quoted line rather than as a quotation. Two of the bridges are strong — the standard names VRRP, which the Linux first-hop redundancy tool implements, and it names the switching layers that the spanning-tree design satisfies — and one is weak: the tunnel used for the site-to-office peer is covered only by the `etc.` at the end of the standard's VPN line, and the report says so rather than implying stronger coverage.
4. **The innovation line is outside the standard entirely.** `Agentic AI`, `OpenClaw`, `MCP`, `artificial intelligence` and `machine learning` each occur **zero times** in the standard, in both the extracted text and the raw markup. The innovation work is presented as project innovation beyond the standard, anchored only on the standard's general professional requirements to maintain currency in a fast-changing industry and to research new methods — a legitimate anchor for *professional attributes*, and not a claim of coverage.

**Which member gains which competency.** Member A gains the deepest identity, directory and certificate-services competence, which is the area with the largest single body of work. Member B gains the open-source operations, high-availability and cryptographic-tunnel competence. Member C gains the routing, switching and perimeter-security competence, which the standard cites most directly and which carries the largest share of the standard's named technologies. Member D gains the automation, infrastructure-as-code and technology-evaluation competence, which is the standard's third-largest weighted section and the project's innovation area. Every member works across all five lines through the pairing arrangement, so the competency outcome is not confined to one member's specialism.

### 17.4 Value to the Host Organisation

The value argument runs directly from the scenario's business trigger rather than from a generic benefits statement. The fictional client — a Hong Kong financial-technology firm with 160 staff across four locations, a five-person IT team and a contractual obligation to answer a brokerage group's due-diligence questionnaire — commissioned this design because of five specific demands, and the delivered solution answers each one.

| Due-diligence demand (the business trigger) | How the delivered design answers it | Evidence that it is answered |
|---|---|---|
| **Segregation of the platform production chain from ordinary office users** | A zone-based design with 20 VLANs, an externally published zone kept strictly compartmented, a management zone deliberately addressed outside the production range, and trust-boundary rules that deny the published zone any path into the internal network | The trust-boundary rows that deny published-zone to internal traffic, each proven by a logged denial |
| **Documented least-privilege access and an audit trail of administrative actions** | Personal administrative accounts; a two-tier administrative separation; service accounts that are members of no privileged group; delegation limited to password reset and unlock at one organisational-unit level; and administrative audit trails through policy-driven transcription and script-block logging plus advanced audit policy | Group-membership records, the tier-separation test, and the centralised administrative audit log |
| **Encrypted remote access with certificate-based authentication and no shared passwords** | Certificate-based remote access requiring both a valid machine certificate and group membership, with pre-shared-key authentication forbidden by design; a second, independently implemented remote-access technology on the open-source side, also certificate-based; short certificate validity windows with a documented renewal process | The remote-access tests, including the refusal cases that prove the control is specific rather than incidental |
| **Documented recovery and failover behaviour for the customer-facing tier** | Two first-hop redundancy pairs; two reverse-proxy nodes; a two-node application tier and a two-node content tier; a second domain controller and a read-only copy of identity at the branch; and documented, **measured** failover procedures for each | The failover suite with its convergence thresholds and its timed evidence |
| **Evidence that network change is applied through reviewed, repeatable configuration rather than by hand** | Configuration held as code in version control; applied through automated playbooks and scripts; reviewed by a second person before merge; re-runnable with unchanged output; with a device configuration archive gathered on a schedule | The automation run logs, the idempotence evidence, the repository history and the review records |

**Beyond the five demands.** Two further forms of value are worth stating. The first is **operational**: a five-person IT team cannot watch nineteen servers and sixteen network devices by hand, so the monitoring and logging stack, the automated health reporting, the scheduled configuration archive and the read-only triage assistance all reduce the manual attention the estate requires — and the proof-of-concept agent is deliberately read-only precisely so that it can be introduced into a production-adjacent environment without any risk of unsupervised change. The second is **reusability**: the runbooks, the version register with its confirmation commands, the configuration backup and restore procedure and the re-runnable automation mean the estate can be rebuilt or extended by someone who did not build it, which is the difference between a demonstration and an asset.

**What the value claim honestly excludes.** The design delivers **alignment with** selected controls, not certification, not a compliance attestation and not a penetration test. It is built and verified in a virtualised laboratory with no physical hardware, so it demonstrates design correctness, configuration correctness and documented behaviour rather than production performance. Those limits are stated in the report wherever a result is presented, and they are why the value argument is framed as a **defensible design and a reusable method** rather than as a deployed service.

### 17.5 Future Work and Extension

Every item below is explicitly **out of the current scope**. None is a partially delivered feature and none may be presented as achieved; they are listed because a design that shows where it would go next is more useful than one that pretends to be finished.

| # | Extension | Why it is out of scope now | What it would require |
|---|---|---|---|
| 1 | **Software-defined networking and controller-based management** | The standard's know-and-understand list does mention controller-based and software-defined approaches, but software-defined networking is the sibling topic in this programme, the simulator does not model it reliably, and the current design already spans five lines | A controller platform, a device estate that supports programmatic control, and a laboratory able to host both — realistically a separate programme of work |
| 2 | **Migration to real hardware** | The project has a hard constraint of no physical hardware, and no device may be assumed present for any verification step | Real routers, switches, a firewall appliance and server hardware, plus a migration plan, a cutover plan and re-validation of every test case against real forwarding behaviour |
| 3 | **Security information and event management integration** | The monitoring stack already centralises logs, and a full correlation platform would duplicate work the monitoring layer does adequately at this scale | A log-correlation platform, normalised event schemas across the Windows, Linux and network sources, and a detection rule library with tuning |
| 4 | **Expanded innovation-line capability** | The proof of concept deliberately exposes four read-only tools and no write path, on safety and reproducibility grounds; expanding it before the read-only surface is even verified would invert the risk order | Additional read-only capabilities first, then a formally controlled proposal-and-approval workflow, then — only with a written safety case — a supervised change path with rollback |
| 5 | **Model hosting and local inference** | No graphical processor is available and the agent host has four cores; the current design depends on either a small local model or a free interface tier | Dedicated inference hardware, model selection and evaluation, and a data-protection assessment if any data leaves the laboratory |
| 6 | **Anomaly detection and predictive analytics with trained models** | Unverifiable without a labelled dataset, and the project has no production telemetry history to label | A labelled operational dataset, a training and evaluation method, and false-positive rate targets |
| 7 | **Full-stack availability at the hardware layer** | Not achievable without physical chassis: there is no second hypervisor host, no shared storage fabric, no redundant power and no dual-path cabling | A second host, shared storage, redundant switching and power, and a hypervisor-level clustering and live-migration design |
| 8 | **A production-grade change pipeline** | The standard's continuous-integration requirement is a *know and understand* line, and building a pipeline would add infrastructure the group must not depend on; the project instead documents the concept and runs a reviewed version-control workflow | A pipeline runner, automated test suites inside the pipeline, and deployment automation with rollback |
| 9 | **A second certificate-authority tier with hardware-protected keys** | A single-tier authority is acceptable within the project's time and team size, and the design states which model was used | A hardened offline root with removable key storage, an online issuing authority, a documented ceremony and a key-recovery procedure |
| 10 | **IPv6** | The project is IPv4-only by explicit decision, recorded as a design-revision item rather than a local choice | An IPv6 addressing plan, dual-stack behaviour across every service, and re-validation of the trust-boundary rules in both families |
| 11 | **Voice as a delivered line rather than a supporting demonstration** | Call control is simulated and the report says so; treating it as delivered would overstate the evidence | A genuine call-control platform, endpoint fleets, dial plans, and a quality-of-service design with measured voice traffic |
| 12 | **A third site with a real provider relationship** | The simulated provider is a simulator construct and cannot demonstrate real provider interaction | Real transit connectivity, provider coordination, address assignment from a real allocation, and routing policy agreed with a provider |

## 18. Conclusion

This project will design, build, verify and document a virtualised enterprise network for a fictional Hong Kong financial-technology firm, in answer to a brief that asks students to *"study, build, configure, troubleshoot, and document complex enterprise networks"* across five named technology lines, and to *"produce well-organized documentation that includes all findings, manuals, steps, screen captures, verifications, and references related to the project."* Its aim is not merely to configure a set of services but to leave behind a **verified, reproducible and honestly documented** enterprise network: one where every capability claim traces to a test, every test to a command transcript or a screenshot, and every design decision to a stated requirement or an explicit, declared exclusion.

**What will be built.** On a single student-owned hypervisor host, nineteen virtual machines — nine Windows Server guests and ten Linux guests, cloned from two prepared templates — will carry the whole service estate: one directory forest with two writable domain controllers and a read-only copy of identity at the branch; name resolution and addressing with redundancy and a documented failover relationship; file services with enforced quotas and file-type screening; network block storage with three logical units; a certificate authority on both platforms; certificate-based remote access implemented twice and independently; a two-node reverse proxy terminating transport security in front of a two-node application tier and a two-node content tier; host and network packet filtering with default-deny policy, address translation and logging; and a monitoring, logging and configuration-archive stack. Alongside it, sixteen simulated network devices across four sites will carry the Layer 2 and Layer 3 design: access, aggregation and core switching with explicit root selection and hardened access ports; interior and exterior gateway routing with a single tagged redistribution point; first-hop redundancy at both the switch layer and the Linux layer; and a firewall perimeter enforcing a sixteen-row trust-boundary table with address translation, inspection and centralised logging. On top of that estate, five PowerShell scripts, nine Ansible playbooks, seven roles and five Bash scripts will apply configuration as reviewed, version-controlled, idempotent code; and a read-only agent proof of concept will demonstrate, on real alerts, that triage can be shortened **without any write path to any device**.

**How it will be verified.** Verification is planned as first-class work rather than as a closing activity. One hundred and fifty-three test-case identifiers cover the four technology lines, the failover and resilience suite, the security suite, the performance method, the innovation line, the monitoring and certificate layers, and the documentation and governance workstreams. Six failover scenarios carry explicit numeric convergence thresholds that a virtualised laboratory can genuinely meet. The security suite tests every one of the sixteen trust-boundary rows in both directions and produces logged denial lines for the deny rows. The performance suite states plainly that it demonstrates a measurement method and detects regressions rather than measuring production capacity. And an objective-to-design-to-test-to-evidence traceability matrix with no empty cells is the artefact that makes the whole result auditable. Documentation and evidence are governed by a repository layout, a screenshot naming convention, a verification-record format, a findings register that is required to contain failures, and a master evidence index — because the project takes the view that **an unindexed, undated, unattributed screenshot is not evidence at all**, and that a capability which cannot be demonstrated has not been delivered.

**Standards alignment, stated honestly.** The design is aligned to the WorldSkills Occupational Standards 2026 for IT Network Systems Administration, and the alignment is specific: 75 % of the standard's weight sits in three 25 % sections — Data Transfer Networks, Network and System Operations and Troubleshooting — and this project is deliberately weighted the same way, with a correspondingly small share given to work organisation and communication, which the standard weights at 5 % each. The standard directly names the directory services, the web servers, the routing protocols, the redundancy protocols, the version-control and configuration-management tools, the scripting languages, the file-sharing protocols, the certificate services and the backup mechanisms this design uses, and the design quotes those lines where they apply. The gap disclosure matters just as much and is stated before it can be discovered: the standard contains **no time limit and no module structure**, so the twelve-week schedule is presented as the project's own client constraint and never as a standard requirement; the standard contains **no requirement for screen captures**, so the evidence set is presented as the brief's requirement and not the standard's; several technologies in this design — network block storage, file-server quota and screening, certificate-based remote-access service on the Microsoft platform, host-based packet filtering, the small-office tunnel implementation, rapid spanning-tree, the firewall platform and the simulator itself — are **not named by the standard**, and are justified from the brief and from generic requirement lines, with two strong protocol-level bridges and one deliberately labelled weak one; and the innovation line is **entirely outside** the standard, since the words describing it occur zero times, so it is presented as project innovation beyond the standard, anchored only on the standard's general professional requirement to maintain currency in a fast-changing industry. Presenting a bridge as a bridge, and an inference as an inference, is the specific discipline this proposal commits to, because an alignment claim that overreaches is worth less than no claim at all.

**Why the project is worthwhile and achievable.** It is worthwhile because it is the shape of real work: an IT team of five people supporting 160 staff across four locations, under a contractual obligation to prove least privilege, auditability and failover, with no budget for new hardware — which is exactly the situation in which a well-designed virtualised estate, reviewed configuration-as-code and honest documentation are the difference between a system that can be defended in an audit and one that cannot. It is achievable within twelve weeks by four students with no physical hardware for four reasons, and each was designed in rather than assumed. **First, the scope was prioritised before the work began**, in a fixed four-band order with a pre-agreed cut sequence, so that if the schedule compresses it compresses predictably and the must band survives intact. **Second, the phases follow the service dependency chain**, so at most one phase is ever blocked and four people can genuinely work in parallel instead of queueing. **Third, the highest-uncertainty item is isolated and timeboxed**: the innovation line's runtime is exposed to a three-day feasibility spike whose output is a decision, and it is protected by designed fallbacks, so the least certain part of the project cannot take the rest of it down. **Fourth, and most importantly, the verification and documentation discipline is built into every task rather than added at the end** — evidence is part of the definition of done, the pairing arrangement means no member is a single point of failure, and the traceability matrix is maintained continuously, so that week 12 assembles a record that already exists rather than reconstructing one from memory. The project's honesty rules are part of the same design: version deviations are published, declared exclusions are listed and approved, the simulator's limits are labelled wherever a result touches them, and where the innovation line disappoints, the disappointment is documented as a finding. Delivering the must band with complete evidence, and stating plainly and precisely what was not delivered and why, is a complete and defensible outcome for a twelve-week final-year project — and it is the outcome this plan is built to produce.

## 19. References

### 19.1 Citation Policy Applied

Two rules govern this list, and both are deliberate.

**URLs are given only where the URL is confirmed.** An address appears in this list only if it is present in one of the project's two canonical source documents: the design baseline (`proposal\00-design-baseline.md`) or the verified research pack (`proposal\research\wsos-2026-2447.md`). Both of those documents record how the source was retrieved and verified, so a URL carried from them is traceable. Every other entry is cited **by document title, issuing body and edition or version, without a URL**, because writing an address from memory is forbidden in this project and inventing one is worse than omitting it. Where an address could not be confirmed, the entry says so, or names where the source is archived, rather than pretending to a location.

**Every entry was genuinely consulted, and consultation is recorded.** For each entry the reference register records who consulted it, when, and which sections cite it, and the consulted artefact is archived in the project's reference directory. Where a document is known only through another document that quotes it, the entry says so explicitly rather than presenting it as read. A version number is cited only together with the command output that produced it. And no source is cited for a fact it does not contain: the occupational standard cited below, in particular, is **not** cited for the project's twelve-week duration, for screen captures, or for any technology string that does not appear on it.

### 19.2 Standards and Frameworks

| # | Reference |
|---|---|
| S1 | WorldSkills International, *WorldSkills Occupational Standards — IT Network Systems Administration* (Skill 2447), WorldSkills Shanghai 2026. `https://worldskills.org/what/projects/wsos/2026/events/611/skills/2447/` — the page cited by the project brief; retrieved and verified by the project's own research pack, which records the page's status, body size, page title, edition label and the page's own "last updated" line, and whose own censuses — the requirement-line census in its Section 3.7 and the audit row in its Appendix A — give 131 requirement lines with 0 mismatches. That pack also carries a corrections section (its Section 7, items C1-C6) that supersedes the earlier review it examined, notably C1: Domain 5 lost Python, YANG, RESTCONF and NETCONF for the 2026 edition. Section weightings as published: 1 Work organization and management 5 %; 2 Communication and interpersonal Skills 5 %; 3 Data Transfer Networks 25 %; 4 Network and System Operations 25 %; 5 Infrastructure Automation 15 %; 6 Troubleshooting 25 %; total 100 % |
| S2 | WorldSkills International, *WorldSkills Occupational Standards — IT Network Systems Administration*, WorldSkills Lyon 2024 edition. `https://worldskills.org/what/projects/wsos/2024/events/579/skills/1694/` — the cross-reference edition retrieved and diffed by the research pack. Its six section titles and six weightings are identical to the 2026 edition, but its Infrastructure Automation section listed additional technology examples that the 2026 edition no longer contains. This project therefore cites the **2026** edition for all requirement lines and cites the 2024 edition only where an edition difference is being discussed |
| S3 | *WSOS 2026 Research Pack — "IT Network Systems Administration" (Skill 2447)*, the project's own local verified extraction of S1 and S2, held at `proposal\research\wsos-2026-2447.md`. This is the citation of record inside the project and the source of every standards statement, requirement line, weighting and gap-analysis finding used in this proposal |
| S4 | RFC 1918, *Address Allocation for Private Internets* — the applicable reference for the private address space used throughout the design. Cited by document number and title; no clause is quoted |
| S5 | RFC 5737, *IPv4 Address Blocks Reserved for Documentation* — the applicable reference for the documentation address blocks used for all simulated public addressing in this project |
| S6 | RFC 2606, *Reserved Top Level DNS Names* — the applicable reference for the reserved name suffix used for every simulated published service name in this project |
| S7 | RFC 4193, *Unique Local IPv6 Unicast Addresses* — cited **only** to state that this project is IPv4-only and that IPv6 is out of scope. It is not cited as an implemented standard |
| S8 | RFC 7296, *Internet Key Exchange Protocol Version 2 (IKEv2)* — the applicable reference for the certificate-based remote-access and site-to-site tunnel design. The document identity is confirmed; no clause is quoted. The related IPsec framework documents are cited alongside it and are marked as consulted for background rather than quoted |
| S9 | IEEE 802.1D-2004 with its rapid-reconfiguration amendment, together with IEEE 802.1Q for virtual local area networks — the applicable references for the spanning-tree and VLAN design. **The exact edition and any clause number are unconfirmed and are not asserted**; the design refers to rapid spanning-tree behaviour generally, and the specific protections used are described by their configuration names rather than by clause number |
| S10 | Cisco Networking Academy course and simulator documentation, as provided with the group's academy account — the applicable reference for simulator capabilities and limitations and for the device and image strings actually available. The exact documentation page and the simulator build it applies to are recorded in the project's reference register at build time rather than asserted here |

### 19.3 Vendor and Platform Documentation

All entries in this group are cited **by document title, vendor and version, without a URL**, because no URL for them is confirmed in the project's two canonical source documents. For each, the reference register records the documentation actually used, the access date and the member who consulted it; the applicable version is the version actually installed, confirmed at build time with a version-printing command whose output is captured as evidence.

| # | Reference |
|---|---|
| V1 | Broadcom / VMware, *VMware Workstation Pro 17.6.2 Release Notes* — the release-notes document established by the project baseline as confirming the existence of the hypervisor build used as the recommended default. The free-for-personal-use entitlement is an assumption re-checked at build time |
| V2 | Oracle, *Oracle VM VirtualBox User Manual* (7.1.x series) — the named alternative hypervisor, and the reference for creating host-only networks by command and for disabling the built-in addressing service per network |
| V3 | Microsoft, *Hyper-V documentation for Windows 11 Pro* and *Virtual Switch documentation* — the second named alternative hypervisor, and the reference for host network-stack behaviour |
| V4 | Microsoft, *Windows Server 2025 documentation set*, including *Active Directory Domain Services*, *DNS Server*, *DHCP Server*, *Active Directory Certificate Services*, *File Server Resource Manager*, *iSCSI Target Server*, *Routing and Remote Access Service*, *Network Policy Server*, *Windows Server Backup* and *Group Policy* — the references for every Windows role and feature configured in this design. The edition and patch level actually installed are recorded from the running system |
| V5 | Microsoft, *PowerShell documentation* for Windows PowerShell 5.1 and PowerShell 7.4 — the references for the scripting line. Which runtime each script was tested on is recorded per script rather than assumed |
| V6 | Microsoft, *WinRM and PowerShell Remoting documentation* — the reference for remote management over HTTPS, used by the configuration-management line against Windows targets |
| V7 | Canonical, *Ubuntu Server 24.04 LTS documentation* and the *Ubuntu Server Guide* — the reference for the Linux estate, including static addressing configuration and unattended upgrades |
| V8 | The Nginx project, *nginx documentation* — the reference for the reverse-proxy and content-tier design, including upstream pools and transport-security configuration |
| V9 | The Keepalived project, *Keepalived documentation* — the reference for the first-hop redundancy design, including VRRP instances, priorities, preemption and health-check scripting |
| V10 | The nftables project, *nftables wiki and manual pages* — the reference for the packet-filtering, translation and logging design, including the atomic ruleset replace operation |
| V11 | The WireGuard project, *WireGuard documentation* — the reference for the tunnel design, including key generation and allowed-address scoping |
| V12 | The OpenVPN project, *OpenVPN 2.6 documentation* — the reference for the second remote-access implementation, including control-channel protection and per-client configuration |
| V13 | The Easy-RSA project, *Easy-RSA 3 documentation* — the reference for the Linux-side certificate authority, including PKI initialisation, certificate issuance and revocation-list generation |
| V14 | The Ansible project, *Ansible documentation* for `ansible-core` and the community package, including the Windows and secure-shell connection plug-ins — the reference for the configuration-management line |
| V15 | The pywinrm project, *pywinrm documentation* — the reference for the Windows remote-management connection used by Ansible |
| V16 | The Git project, *Pro Git* and the *git reference manual* — the references for the version-control workflow, branching and tagging used throughout the project |
| V17 | The WordPress project, *WordPress documentation*, together with the *MariaDB documentation* for the packaged database server — the references for the content tier |
| V18 | The Prometheus project, *Prometheus documentation*; Grafana Labs, *Grafana documentation*; Grafana Labs, *Loki documentation*; and the *node_exporter* and *windows_exporter* project documentation — the references for the monitoring, dashboarding and log-aggregation design |
| V19 | The rsyslog project, *rsyslog documentation* — the reference for centralised log forwarding and per-host log files |
| V20 | The Restic project, *Restic documentation* — the reference for the off-host configuration and evidence backup job |
| V21 | The Apache Software Foundation, *Apache HTTP Server documentation* — cited as the alternative modern web server named by the standard, consulted for comparison with the server actually used, and **not deployed** |
| V22 | Internet Systems Consortium, *BIND 9 documentation* — cited as the Linux-side name server named by the standard, consulted for comparison with the name service actually used, and **not deployed** |
| V23 | The OpenSSL project, *OpenSSL documentation* — the reference for certificate inspection and chain verification and for the transport-security checks used in the security tests |
| V24 | The Icinga, Nagios and Cacti project documentation — cited because the standard's monitoring requirement names these products as nested examples; they are **consulted for comparison only and are not deployed**, and the report states this rather than implying that the nested examples were implemented |
| V25 | The agent-runtime project documentation actually used for the innovation line, together with its Skills-extension documentation — cited **only** once the instance is running, with a screenshot of that instance and a citation to the documentation actually read. Until then the component is carried in the version register as unpinned and uncertain, and no version, capability or licence statement about it appears anywhere in this proposal |

### 19.4 Project Documentation

| # | Reference |
|---|---|
| P1 | *HDTN Final Year Project Topic (AY2026/27) — Victor2: Enterprise Network Infrastructure and Architect*, supplied topic sheet, including the requirement that students produce well-organized documentation covering findings, manuals, steps, screen captures, verifications and references. The project brief, and the source of the five technology lines and the project's constraints |
| P2 | *00 — Canonical Design Baseline*, revision 1.0, held at `proposal\00-design-baseline.md`. The single canonical design for this project: scope and success criteria, client scenario, topology, VLAN plan, addressing plan, device and inventory tables, version pinning, naming and path conventions, identity design, port and protocol matrix, technology-to-implementation mapping, technology-specific design decisions, assumptions and risks, standards and citation discipline, resource budget, the interface contract for writers, the delivery schedule and ownership, the traceability matrix, and change control |
| P3 | The project's own registers and records, held in the project repository: the risk register, the issues log, the assumptions log, the findings register, the decision log, the change records, the executed verification records and the master evidence index. These are primary sources for this proposal and are cited by identifier wherever they are referenced |
| P4 | RFC 1123, *Requirements for Internet Hosts — Application and Support* — cited only as the applicable reference for the hostname syntax rule applied to the Linux estate |
| P5 | The project's own experiment records, cited by test-case identifier. Where the design relies on a behaviour that no external document confirms — for example the actual convergence ordering observed in the simulator, the actual version strings of installed components, or the actual behaviour of the innovation-line runtime — the citation is to the project's own executed test rather than to an external source that was not consulted |

## 20. Appendices

The appendices reproduce the project's normative reference material so that any deliverable can be checked without reopening the design baseline, and so that a reader can verify a configuration claim against the plan that governs it. Values are reproduced verbatim. Where a value is an assumption or is unconfirmed it is marked as such rather than presented as settled.

### Appendix A — Full IP Addressing Plan

#### A.1 Allocation of private address space

| Block | Assigned to | Notes |
|---|---|---|
| `10.10.0.0/16` | All HQ LANs, all branch and small-office LANs, WAN links, provider-transit links, router loopbacks | Logical HQ space `10.10.0.0/17`; branch and small-office space on the `10.10.110.0/17` side |
| `10.20.0.0/16` | Management networks | Chosen deliberately outside the `10.10.0.0/16` block so that a routing mistake cannot expose management |
| `10.70.0.0/16` | Isolated student and laboratory network | Deliberately outside both of the above |
| `10.255.0.0/24` | Router loopbacks | One per routing device |
| `192.0.2.0/24` | Simulated public Internet core | RFC 5737 documentation range |
| `198.51.100.0/24` | Simulated public publication range | RFC 5737 documentation range |
| `203.0.113.0/24` | Simulated public peer range for tunnels | RFC 5737 documentation range |
| `172.16.0.0/16` | **Not allocated.** Reserved head-room for future branch growth | Must not appear in any configuration in this project |

#### A.2 Complete subnet table

| Subnet (CIDR) | VLAN | Gateway | First usable | Last usable | Broadcast | Addressing service? | Purpose |
|---|---|---|---|---|---|---|---|
| 10.10.10.0/24 | 10 | 10.10.10.1 | 10.10.10.1 | 10.10.10.254 | 10.10.10.255 | No | HQ layer-3 transit and user default gateways |
| 10.20.20.0/24 | 20 | 10.20.20.1 | 10.20.20.1 | 10.20.20.254 | 10.20.20.255 | No | Management and out-of-band |
| 10.10.30.0/24 | 30 | 10.10.30.254 (VIP) | 10.10.30.1 | 10.10.30.253 | 10.10.30.255 | No | HQ server subnet 1 |
| 10.10.40.0/23 | 40 | 10.10.40.254 (VIP) | 10.10.40.1 | 10.10.41.254 | 10.10.41.255 | Yes | HQ staff workstations (508 usable) |
| 10.10.45.0/24 | 45 | 10.10.45.1 | 10.10.45.1 | 10.10.45.254 | 10.10.45.255 | Yes | HQ voice |
| 10.10.50.0/28 | 50 | 10.10.50.1 | 10.10.50.1 | 10.10.50.14 | 10.10.50.15 | No | Egress transit: core, filtering pair, firewall inside |
| 10.10.60.0/24 | 60 | 10.10.60.1 | 10.10.60.1 | 10.10.60.254 | 10.10.60.255 | No | Reserved HQ server subnet 2 |
| 10.70.0.0/24 | 70 | 10.70.0.254 (VIP) | 10.70.0.1 | 10.70.0.253 | 10.70.0.255 | Yes | Isolated laboratory segment |
| 10.10.80.0/24 | 80 | 10.10.80.254 (VIP) | 10.10.80.1 | 10.10.80.253 | 10.10.80.255 | No | Block-storage network |
| 10.10.90.0/24 | 90 | 10.10.90.1 (firewall inside) | 10.10.90.1 | 10.10.90.254 | 10.10.90.255 | No | Published services zone |
| 10.10.100.0/30 | 100 | — | .1 / .2 | — | .3 | No | HQ edge to provider edge |
| 10.10.100.4/30 | 100 | — | .5 / .6 | — | .7 | No | HQ edge to backup provider edge |
| 10.10.100.32/30 | 100 | — | .33 / .34 | — | .35 | No | HQ edge to branch edge WAN1 |
| 10.10.100.36/30 | 100 | — | .37 / .38 | — | .39 | No | HQ edge to Macau edge (routing-domain boundary) |
| 10.10.100.40/30 | 100 | — | .41 / .42 | — | .43 | No | HQ edge to alternate provider peer |
| 10.10.110.0/24 | 110 | 10.10.110.1 | .1 | .254 | .255 | Yes | Branch sales |
| 10.10.111.0/24 | 111 | 10.10.111.1 | .1 | .254 | .255 | Yes | Branch staff |
| 10.10.112.0/24 | 112 | 10.10.112.1 | .1 | .254 | .255 | Yes | Branch voice |
| 10.10.113.0/24 | 113 | 10.10.113.1 | .1 | .254 | .255 | No | Branch management |
| 10.10.120.0/24 | 120 | 10.10.120.1 | .1 | .254 | .255 | Yes | Macau LAN |
| 10.10.121.0/24 | 121 | 10.10.121.1 | .1 | .254 | .255 | Yes | Macau voice |
| 10.10.130.0/24 | 130 | 10.10.130.1 | .1 | .254 | .255 | Yes | Small-office LAN |
| 10.10.131.0/24 | 131 | 10.10.131.1 | .1 | .254 | .255 | Yes | Small-office development segment |
| 10.10.200.0/24 | — | — | 10.10.200.1 | 10.10.200.254 | 10.10.200.255 | No | Tunnel transport addressing (site and remote pools) |
| 10.10.201.0/24 | — | — | 10.10.201.10 | 10.10.201.200 | 10.10.201.255 | No | Certificate-based remote-access pool |
| 10.10.202.0/24 | — | — | 10.10.202.10 | 10.10.202.120 | 10.10.202.255 | No | Second remote-access pool |
| 10.255.0.0/24 | — | — | — | — | — | No | Router loopbacks (.11 to .61) |
| 192.0.2.0/24 | — | 192.0.2.1 | — | — | — | Simulated | Simulated Internet core |
| 198.51.100.0/29 | — | 198.51.100.1 (firewall outside) | .1 | .6 | .7 | No | Simulated public publication pool |
| 203.0.113.0/29 | — | 203.0.113.1 (provider) | .1 | .6 | .7 | No | Simulated public tunnel and WAN peer pool |

**Sizing note.** The HQ staff subnet is a `/23` because 110 HQ staff plus growth cannot be addressed efficiently in a `/24` while keeping a clean address pool; the voice, laboratory, storage, published-services and branch-voice subnets are intentionally small. VLAN 60 and the reserved `172.16.0.0/16` block are documented growth space and are not deployed.

#### A.3 Addressing scopes

| Scope name (exact) | Subnet | Pool range | Excluded from the pool | Lease | Options pushed | Relay on |
|---|---|---|---|---|---|---|
| `SCOPE-HQ-USER-STF` | 10.10.40.0/23 | 10.10.40.100–10.10.41.200 | 10.10.40.1–10.10.40.99; 10.10.41.201–10.10.41.254 | 8 h | 003 = 10.10.40.254; 006 = 10.10.30.11, 10.10.30.12; 015 = `vertexpeak.fyp.lab`; 042 → 10.10.30.11; 051 = 8 h; 119 = `fyp.lab`; 121 = 10.10.40.0/23 → 10.10.30.31; 150 = 10.10.30.31 | `VP-HQ-CORE-01` gi0/1.40 |
| `SCOPE-HQ-VOICE` | 10.10.45.0/24 | 10.10.45.100–10.10.45.200 | 10.10.45.1–10.10.45.99; 10.10.45.201–10.10.45.254 | 30 d | 003 = 10.10.45.1; 006 = 10.10.30.11, 10.10.30.12; 042; 066 = 10.10.45.11; 150 = 10.10.45.11 | `VP-HQ-CORE-01` gi0/1.45 |
| `SCOPE-HQ-LAB` | 10.70.0.0/24 | 10.70.0.100–10.70.0.200 | 10.70.0.1–10.70.0.99; 10.70.0.201–10.70.0.254 | 8 h | 003 = 10.70.0.254; 006 = 10.10.30.11, 10.10.30.12 | `VP-HQ-DSW-A03` VLAN 70 interface |
| `SCOPE-BR-SALES` | 10.10.110.0/24 | 10.10.110.100–10.10.110.200 | 10.10.110.1–10.10.110.99; 10.10.110.201–10.10.110.254 | 8 h | 003 = 10.10.110.1; 006 = 10.10.30.11, 10.10.30.12; 042; 121 = 10.10.110.0/24 → 10.10.30.31 | `VP-BR-EDGE-01` gi0/0.110 |
| `SCOPE-BR-STAFF` | 10.10.111.0/24 | 10.10.111.100–10.10.111.200 | 10.10.111.1–10.10.111.99; 10.10.111.201–10.10.111.254 | 8 h | As `SCOPE-BR-SALES`, with 003 = 10.10.111.1 | `VP-BR-EDGE-01` gi0/0.111 |
| `SCOPE-BR-VOICE` | 10.10.112.0/24 | 10.10.112.100–10.10.112.200 | 10.10.112.1–10.10.112.99; 10.10.112.201–10.10.112.254 | 30 d | 003 = 10.10.112.1; 066 = 10.10.45.11 | `VP-BR-EDGE-01` gi0/0.112 |
| `SCOPE-MO-LAN` | 10.10.120.0/24 | 10.10.120.100–10.10.120.180 | 10.10.120.1–10.10.120.99; 10.10.120.181–10.10.120.254 | 8 h | 003 = 10.10.120.1; 006 = 10.10.30.11, 10.10.30.12 | `VP-MO-EDGE-01` gi0/0.120 |
| `SCOPE-MO-VOICE` | 10.10.121.0/24 | 10.10.121.100–10.10.121.150 | 10.10.121.1–10.10.121.99; 10.10.121.151–10.10.121.254 | 30 d | 003 = 10.10.121.1; 066 = 10.10.45.11 | `VP-MO-EDGE-01` gi0/0.121 |
| `SCOPE-WC-LAN` | 10.10.130.0/24 | 10.10.130.100–10.10.130.180 | 10.10.130.1–10.10.130.99; 10.10.130.181–10.10.130.254 | 8 h | 003 = 10.10.130.1; 006 = 10.10.30.11, 10.10.30.12 | `VP-WC-EDGE-01` gi0/0.130 |
| `SCOPE-WC-DEV` | 10.10.131.0/24 | 10.10.131.100–10.10.131.150 | 10.10.131.1–10.10.131.99; 10.10.131.151–10.10.131.254 | 8 h | 003 = 10.10.131.1; 006 = 10.10.30.11, 10.10.30.12 | `VP-WC-EDGE-01` gi0/0.131 |

The addressing service is served authoritatively by the directory-integrated role on `vpnz-dc01` and `vpnz-dc02` in an 80/20 failover relationship with a 500 ms partner delay, with `vpnz-dc01` primary and a relay on every gateway interface. There are **no reservations**: every device that must be predictable is statically addressed, and the dynamic service covers workstations, telephones and laboratory endpoints only.

#### A.4 Tunnel and remote-access addressing

| Tunnel | Type | Endpoint A | Endpoint B | Inner addressing | Notes |
|---|---|---|---|---|---|
| `WG-HQ-WC` | Tunnel over UDP 443 | Filtering pair, VIP 10.10.50.10, presented as 203.0.113.2:443 | The Ubuntu guest `vpnz-wcwg01` at 10.10.200.5, emulating the small-office encrypting gateway; the site's public address 203.0.113.5 remains the IPsec peer | A = 10.10.200.1/24; B = 10.10.200.5/24 | Primary small-office tunnel; keys generated on the host and private keys never committed |
| `WG-REMOTE-POOL` | Tunnel over UDP 443 | Same VIP | Staff laptops | 10.10.200.64/26 (10.10.200.65–126) | Deliberately separated from the site pool so that access rules stay unambiguous |
| `IPSEC-HQ-WC` | IKEv2 site-to-site, UDP 500/4500 | Firewall outside 198.51.100.1 | Small-office edge 203.0.113.5 | Optional transport for the development segment only | Demonstrates the firewall's IPsec and allows comparison with the tunnel implementation |
| `IKEV2-RAS-POOL` | Certificate-based remote access | Remote-access server, reached through UDP 500/4500 | Staff laptops | 10.10.201.0/24, static pool 10.10.201.10–200 | Certificate authentication only; preshared-key authentication is forbidden by design |
| `OPENVPN-POOL` | Transport-security VPN, UDP 1194 | Open-source remote-access host | Staff laptops | 10.10.202.0/24, pool 10.10.202.10–120 | The second, independent remote-access implementation, used for the technology comparison |
| `MGMT-TUNNEL` | Tunnel over UDP 51820 | Filtering master node | Monitoring host, backup path only | 10.10.200.200/32 and 10.10.200.201/32 | Documented out-of-band escape hatch; must be disabled during the security test, with its absence evidenced |

**Pool exclusion rule.** No tunnel pool may overlap the `10.10.0.0/16` LAN space, the `10.20.0.0/16` management space or the `10.70.0.0/16` laboratory space. `172.16.0.0/16` remains unallocated head-room and must not be used for a pool.

#### A.5 Loopback and WAN link addressing

| Device | Loopback | WAN or link interface and address | Peer |
|---|---|---|---|
| `VP-HQ-CORE-01` | 10.255.0.11/32 | — | — |
| `VP-HQ-CORE-02` | 10.255.0.12/32 | — | — |
| `VP-HQ-EDGE-01` | 10.255.0.21/32 | gi0/0 = 10.10.100.1/30; gi0/1 = 192.0.2.2/30; gi0/2 = 10.10.100.33/30; gi0/3 = 10.10.100.37/30 | Provider edge; branch; Macau |
| `VP-HQ-FW-01` | n/a (the appliance has no loopback interface) | outside = 198.51.100.1/29; inside = 10.10.50.2/28; published-services interface = 10.10.90.1/24 | Edge router; published-services switch |
| `VP-BR-EDGE-01` | 10.255.0.31/32 | gi0/1 = 10.10.100.34/30 | `VP-HQ-EDGE-01` |
| `VP-MO-EDGE-01` | 10.255.0.41/32 | gi0/1 = 10.10.100.38/30 | `VP-HQ-EDGE-01` |
| `VP-WC-EDGE-01` | 10.255.0.51/32 | outside = 203.0.113.5/29 | Firewall and tunnel peer |
| `VP-ISP-EDGE-01` | 10.255.0.61/32 | 192.0.2.1/30; 10.10.100.6/30; 10.10.100.42/30 | `VP-HQ-EDGE-01` and alternates |
| `VP-ISP-DNS-01` | — | 192.0.2.53/24 and 192.0.2.54/24 | Simulated public resolvers |

#### A.6 Simulated public addressing

No real public address is used anywhere in this project. All Internet-facing addresses come from the RFC 5737 documentation ranges, and every published service name ends in the reserved `.example` suffix.

| Public address | Published service | Mapped to (inside) |
|---|---|---|
| 198.51.100.1 | Firewall outside interface | — |
| 198.51.100.2 | `https://portal.vertexpeak.example` (443) and `http://portal.vertexpeak.example` (80) | Virtual address 10.10.90.10 (reverse-proxy pair) |
| 198.51.100.3 | `https://www.vertexpeak.example` (443) | Application-tier nodes 10.10.90.21 and 10.10.90.22 |
| 198.51.100.4 | `https://blog.vertexpeak.example` (443) | Content-tier node 10.10.90.25 |
| 198.51.100.5 | UDP 443 tunnel; UDP 500 and 4500 IKEv2; UDP 1194 second remote access | Virtual address 10.10.50.10 (filtering pair), forwarded by port to the remote-access hosts |
| 203.0.113.1 | Simulated provider edge | — |
| 203.0.113.2 | Public peer address presented for the HQ tunnel endpoints | 10.10.50.10 |
| 203.0.113.5 | Small-office edge public interface | — |

#### A.7 Static host addressing

| Hostname | IP | VLAN | Role |
|---|---|---|---|
| `vpnz-dc01` | 10.10.30.11 | 30 | Primary domain controller, name resolution, addressing, enterprise root certificate authority, time source, global catalog |
| `vpnz-dc02` | 10.10.30.12 | 30 | Second domain controller, name resolution, addressing partner, global catalog |
| `vpnz-fs01` | 10.10.30.21 | 30 | File services, quota and file screening, replication, backup target |
| `vpnz-san01` | 10.10.80.21 | 80 | Block-storage target; **target** IQN `iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target`, derived by the iSCSI Target Server and not settable — the canonical string `iqn.2026-01.lab.fyp.vertexpeak:storage-lun01` (and `-lun02`, `-lun03`) is the **initiator** IQN on `vpnz-dmzweba01` (Rev 1.1 ruling C-06) |
| `vpnz-rras01` | 10.10.30.41 | 30 | Certificate-based remote-access service and RADIUS server |
| `vpnz-lnxra01` | 10.10.30.42 | 30 | Open-source remote access, Linux-side certificate authority, host firewall |
| `vpnz-mon01` | 10.10.30.31 | 30 | Monitoring, log receiver, time source, configuration archive, automation control node, version-control server |
| `vpnz-ai01` | 10.10.30.51 | 30 | Agent runtime, tool bridge, read-only collector |
| `vpnz-nft01` | 10.10.50.11 (VIP 10.10.50.10) | 50 | Egress filtering, address translation, first redundancy master; `VNET-WAN` NIC 10.10.200.2 |
| `vpnz-nft02` | 10.10.50.12 (VIP 10.10.50.10) | 50 | Egress filtering pair backup; `VNET-WAN` NIC 10.10.200.3 |
| `vpnz-dmzrev01` | 10.10.90.28 (VIP 10.10.90.10) | 90 | Reverse proxy, transport-security termination, redundancy master |
| `vpnz-dmzrev02` | 10.10.90.29 (VIP 10.10.90.10) | 90 | Reverse proxy, redundancy backup |
| `vpnz-dmzweba01` | 10.10.90.21 | 90 | Application-tier node 1 |
| `vpnz-dmzweba02` | 10.10.90.22 | 90 | Application-tier node 2 |
| `vpnz-dmzwp01` | 10.10.90.25 | 90 | Content node 1 (web server, application runtime, database) |
| `vpnz-dmzwp02` | 10.10.90.26 | 90 | Content node 2 |
| `vpnz-dmzjump01` | 10.10.90.27 | 90 | Published-zone jump and proxy host; the only management path into the zone |
| `vpnz-jump01` | 10.20.20.31 | 20 | Privileged access workstation; administrative entry point |
| `vpnz-hvhost01` | 10.20.20.10 | 20 | Hypervisor host management address (not a guest) |
| `vpnz-brdc01` | 10.10.113.11 (host adapter) and 10.10.113.12 (management) | 113 | Branch read-only domain controller, name resolution, local addressing relay |
| `vpnz-pki01` | 10.10.30.15 | 30 | **[ASSUMPTION]** Optional issuing authority for a two-tier certificate hierarchy; if single-tier is used this address stays unallocated |
| `vpnz-wcwg01` | 10.10.200.5 | — | **[ASSUMPTION]** Optional tunnel peer representing the small-office encrypting gateway, deployed only if that design option is chosen; adds one guest and is not included in the count of nineteen |

**Network device management addresses.** `VP-HQ-CORE-01` 10.20.20.11; `VP-HQ-CORE-02` 10.20.20.12; `VP-HQ-DSW-A01` 10.20.20.21; `VP-HQ-DSW-A02` 10.20.20.22; `VP-HQ-DSW-A03` 10.20.20.23; `VP-HQ-DSW-A04` 10.20.20.24; `VP-HQ-EDGE-01` 10.20.20.31; `VP-HQ-FW-01` 10.20.20.32 (management interface); `VP-HQ-VOICE-01` 10.10.45.11 (in the voice VLAN because it serves telephones); `VP-BR-EDGE-01` 10.10.113.1; `VP-BR-DSW-A01` 10.10.113.21; `VP-MO-EDGE-01` 10.10.120.1; `VP-MO-DSW-A01` 10.10.120.21; `VP-WC-EDGE-01` 10.10.130.1; `VP-WC-DSW-A01` 10.10.130.21.

#### A.8 Name resolution records

Forward zone `vertexpeak.fyp.lab`, directory-integrated with secure dynamic updates only and seven-day scavenging. Every static host has an address record equal to its hostname. Additional records: `portal.vertexpeak.fyp.lab` → 10.10.90.10; `www.vertexpeak.fyp.lab` → 10.10.90.10; `blog.vertexpeak.fyp.lab` → 10.10.90.10; `vpn.vertexpeak.fyp.lab` → 10.10.50.10; `wg.vertexpeak.fyp.lab` → 10.10.50.10; `keepalived-hq` → 10.10.50.11 and 10.10.50.12; `keepalived-hq-web` → 10.10.90.10 (the nginx VIP, owned by no node, with `vpnz-dmzrev01` = 10.10.90.28 and `vpnz-dmzrev02` = 10.10.90.29); service-locator records for directory access, authentication and the global catalog created automatically by the directory service; and a conditional forwarder for the simulated public suffix pointing at 192.0.2.53. No autodiscover record is created, because no mail-system integration exists in this design and that exclusion is documented rather than left as an omission. The reverse zones `30.10.10.in-addr.arpa`, `40.10.10.in-addr.arpa`, `90.10.10.in-addr.arpa` and `20.20.10.in-addr.arpa` are directory-integrated with pointer records for all static hosts; the branch reverse zone is delegated to the read-only domain controller and forwarded from HQ.

#### A.9 Addressing redundancy rules

Every client receives 10.10.30.11 then 10.10.30.12 as its resolvers, in that order. The branch read-only domain controller is additionally a resolver for its site and sits third in the branch option list, and is never the only resolver for any client. The addressing relationship is primary to standby at 80/20 with a one-hour maximum client lead time and a 60-minute state switchover interval; branch delays must not exceed 500 ms or the branch fails over spuriously.

### Appendix B — VLAN and Port Allocation Matrix

#### B.1 VLAN plan

`VID` is fixed. The gateway shown is the client default gateway and is a virtual address wherever one exists, never a physical interface address.

| VID | Name (exact) | Site | Purpose | Gateway (VIP) | Carried by / trunked on | Devices or hosts on it |
|---|---|---|---|---|---|---|
| 10 | `LAN-HQ-CORE` | HQ | Layer-3 transit between core, edge, firewall inside, filtering pair, and the user VLAN gateway interfaces | 10.10.10.1 | Trunk core-to-core, core-to-edge, and access to the reverse-proxy pair and firewall inside | HQ core switches, edge router subinterface, filtering pair, firewall inside, reverse-proxy pair (dual-homed) |
| 20 | `MGMT-OOB` | HQ | Hypervisor host, switch management, jump box; no user traffic | 10.20.20.1 | Access on `VP-HQ-DSW-A03`; no trunk to user access switches | Hypervisor host management, both core switches, four HQ access switches, the second management jump host, `VP-BR-DSW-A01` |
| 30 | `SRV-HQ-1` | HQ | Primary server VLAN: identity, file, storage, monitoring, agent, Linux services | 10.10.30.254 (VIP) | Access on `VP-HQ-DSW-A04`; trunk to both cores | `vpnz-dc01`, `vpnz-dc02`, `vpnz-fs01`, `vpnz-rras01`, `vpnz-lnxra01`, `vpnz-mon01`, `vpnz-ai01` |
| 40 | `USER-HQ-STF` | HQ | HQ staff workstations | 10.10.40.254 (VIP) | Access on `VP-HQ-DSW-A01` and `VP-HQ-DSW-A02`; trunk to both cores | HQ workstations (simulated endpoints plus the host-only user network) |
| 45 | `VOICE-HQ` | HQ | Voice endpoints, dedicated voice VLAN, call control on the core device | 10.10.45.1 | Trunk on the user access switches to the cores; access on `VP-HQ-DSW-A04` for the voice device | `VP-HQ-VOICE-01` |
| 50 | `TRANSIT-EGRESS` | HQ | The only path from the internal network to the perimeter | 10.10.50.1 (filtering VIP 10.10.50.10) | Access on `VP-HQ-DSW-A04`; aggregated link to the firewall | `vpnz-nft01`, `vpnz-nft02`, firewall inside, core subinterface |
| 60 | `SRV-HQ-2` | HQ | Reserved secondary server VLAN for growth | 10.10.60.1 | Access on `VP-HQ-DSW-A04` | Reserved; documented as growth space, nothing deployed |
| 70 | `STUDENT-LAB` | HQ | Completely isolated training and laboratory segment | 10.70.0.254 (VIP) | Access on `VP-HQ-DSW-A03` | Isolated laboratory endpoints |
| 80 | `STORAGE-HQ` | HQ | Block-storage network, no routing beyond the core | 10.10.80.254 (VIP) | Access on `VP-HQ-DSW-A04` | `vpnz-san01` and the platform-tier initiators |
| 90 | `DMZ-HQ` | HQ | Externally published services, strictly compartmented | 10.10.90.1 (firewall inside interface) | Access on the firewall's published-services port; not trunked to any user switch | `vpnz-dmzrev01`, `vpnz-dmzrev02`, `vpnz-dmzweba01`, `vpnz-dmzweba02`, `vpnz-dmzwp01`, `vpnz-dmzwp02`, `vpnz-dmzjump01` |
| 100 | `LAN-ISP` | ISP | Simulated provider LAN | 10.10.100.1 | Simulator only | Simulated provider router and name service, HQ edge outside |
| 110 | `BR-SALES` | BR | Branch sales and client-onboarding floor | 10.10.110.1 | Access on `VP-BR-DSW-A01`; trunk to `VP-BR-EDGE-01` | Branch workstations |
| 111 | `BR-STAFF` | BR | Branch back-office staff | 10.10.111.1 | Access on `VP-BR-DSW-A01` | Branch workstations |
| 112 | `BR-VOICE` | BR | Branch voice | 10.10.112.1 | Access on `VP-BR-DSW-A01` | Branch telephones |
| 113 | `BR-MGMT` | BR | Branch router, switch and server management | 10.10.113.1 | Access on `VP-BR-DSW-A01` | `VP-BR-EDGE-01`, `VP-BR-DSW-A01`, `vpnz-brdc01` management adapter |
| 120 | `MO-LAN` | MO | Macau office LAN | 10.10.120.1 | Access on `VP-MO-DSW-A01` | Macau workstations |
| 121 | `MO-VOICE` | MO | Macau voice | 10.10.121.1 | Access on `VP-MO-DSW-A01` | Macau telephones |
| 130 | `WC-LAN` | WC | Small-office LAN | 10.10.130.1 | Access on `VP-WC-DSW-A01` | Small-office workstations |
| 131 | `WC-DEV` | WC | Small-office integration and development segment; least privilege, no production credentials | 10.10.131.1 | Access on `VP-WC-DSW-A01` | Integration test endpoints |
| 999 | `UNUSED-BLACKHOLE` | all | Shutdown VLAN present on every switch to absorb unassigned ports, and the native VLAN on every trunk | — | `interface range` on each access switch, then `shutdown` | — |

#### B.2 VLAN discipline rules

1. The native VLAN on every trunk is 999, never VLAN 1. VLAN 1 exists but carries no traffic.
2. Every unused access port is assigned to VLAN 999 and shut down.
3. `switchport nonegotiate` and `spanning-tree portfast` with `bpduguard enable` on all end-user access ports.
4. Trunks exist only between the two core switches, cores to access switches, cores to the edge router, cores to the firewall, and cores to the branch edge router.
5. No VLAN is stretched between HQ and any branch; inter-site traffic is routed, not switched.

#### B.3 Port allocation matrix

| Access switch | Access ports and VLANs | Uplinks and trunks | Notes |
|---|---|---|---|
| `VP-HQ-DSW-A01` | Workstation ports in VLAN 40; telephone ports in VLAN 45 | Trunk to `VP-HQ-CORE-01` and `VP-HQ-CORE-02`, native VLAN 999 | Rapid spanning-tree leaf; port security and address-assignment snooping enabled; trusted ports are the uplinks only |
| `VP-HQ-DSW-A02` | Workstation ports in VLAN 40; telephone ports in VLAN 45 | Trunk to both cores, native VLAN 999 | As above, serving the upper floors |
| `VP-HQ-DSW-A03` | Management ports in VLAN 20; laboratory ports in VLAN 70 | Trunk to both cores, native VLAN 999 | The laboratory segment has no route off-segment except the laboratory console path |
| `VP-HQ-DSW-A04` | Server ports in VLAN 30; reserved ports in VLAN 60; storage ports in VLAN 80; egress-transit ports in VLAN 50; voice-device port in VLAN 45 | Trunk to both cores, native VLAN 999 | The only switch carrying the storage and egress-transit segments |
| `VP-BR-DSW-A01` | Sales in VLAN 110; staff in VLAN 111; voice in VLAN 112; management in VLAN 113 | Trunk to `VP-BR-EDGE-01`, native VLAN 999 | Branch has no stretched VLAN and a branch-local management VLAN |
| `VP-MO-DSW-A01` | Office LAN in VLAN 120; voice in VLAN 121 | Trunk to `VP-MO-EDGE-01`, native VLAN 999 | The routing-domain boundary device sits at HQ, not here |
| `VP-WC-DSW-A01` | Office LAN in VLAN 130; development segment in VLAN 131 | Trunk to `VP-WC-EDGE-01`, native VLAN 999 | The development segment carries no production credentials |

#### B.4 Gateway redundancy matrix

| Layer | Technology | Group or identifier | Members and roles | Virtual identity |
|---|---|---|---|---|
| HQ access layer | Vendor-native first-hop redundancy | Groups 1-4 (1 to VLAN 30, 2 to VLAN 40, 3 to VLAN 70, 4 to VLAN 80) | `VP-HQ-CORE-01` active, priority 150 with preempt; `VP-HQ-CORE-02` standby, priority 100 | Virtual hardware address `0000.0c07.ac01`; VLAN 30 VIP 10.10.30.254; VLAN 40 VIP 10.10.40.254; VLAN 70 VIP 10.70.0.254; VLAN 80 VIP 10.10.80.254 |
| Egress filtering pair | Standard first-hop redundancy implemented by Keepalived | `virtual_router_id` 51 (nodes 10.10.50.11 and 10.10.50.12; the VIP 10.10.50.10 is owned by no node) | `vpnz-nft01` master, priority 150 with preempt; `vpnz-nft02` backup, priority 100 | VIP 10.10.50.10 on the egress transit subnet |
| Reverse-proxy pair | Standard first-hop redundancy implemented by Keepalived | `virtual_router_id` 61 | `vpnz-dmzrev01` master, priority 150 with preempt; `vpnz-dmzrev02` backup, priority 100 | VIP 10.10.90.10 on the published-services subnet |

The two mechanisms are **deliberately different and must not be merged into one claim**: the switch layer uses the vendor-native mechanism that the simulator supports reliably, and the Linux layer uses the open-source implementation of the standard protocol that the occupational standard names. Both pairs use health checks that test the *service* rather than the interface, so a running interface with a dead service still triggers a failover.

### Appendix C — Device and VM Inventory

One hypervisor host, one student-owned machine, referred to throughout as `vpnz-hvhost01`. All guests run on that host and nothing in this table may be replaced by physical hardware.

| # | Device or VM name | Role | OS and version | vCPU | RAM | Disk | NICs | Network attachment | Lines served |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `VP-HQ-CORE-01` | HQ core Layer-3 switch, routing redistribution point, first-hop redundancy active, voice call-control host | Cisco IOS 15.2-family image bundled with the simulator (**[UNCERTAIN]** exact image string — record what the build actually offers) | n/a | n/a | n/a | 8 logical | simulator only | L3, L4 (configuration-collection target) |
| 2 | `VP-HQ-CORE-02` | HQ core Layer-3 switch, redundancy standby, spanning-tree secondary root | As row 1 | n/a | n/a | n/a | 6 | simulator only | L3 |
| 3 | `VP-HQ-DSW-A01` | HQ access switch, spanning-tree leaf, port security, address-assignment snooping | As row 1 | n/a | n/a | n/a | 24 | simulator only | L3 |
| 4 | `VP-HQ-DSW-A02` | HQ access switch, spanning-tree leaf | As row 1 | n/a | n/a | n/a | 24 | simulator only | L3 |
| 5 | `VP-HQ-DSW-A03` | HQ access switch for management and the isolated laboratory segment | As row 1 | n/a | n/a | n/a | 24 | simulator only | L3 |
| 6 | `VP-HQ-DSW-A04` | HQ access switch for server, storage and egress-facing segments | As row 1 | n/a | n/a | n/a | 24 | simulator only | L3 |
| 7 | `VP-HQ-EDGE-01` | HQ WAN edge router, exterior gateway routing, redistribution, address-translation boundary | Cisco IOS 15.2-family | n/a | n/a | n/a | 4 | simulator only | L3 |
| 8 | `VP-HQ-FW-01` | Published-services and edge firewall; access control, translation, site-to-site tunnel | Security-appliance device, 9.16(4) image, in the simulator (**[UNCERTAIN]** — record the version output) | n/a | n/a | n/a | 3 (outside, inside, published) plus management | simulator only | L3 |
| 9 | `VP-BR-EDGE-01` | Branch router, interior routing spoke, inter-VLAN routing | Cisco IOS 15.2-family | n/a | n/a | n/a | 4 | simulator only | L3 |
| 10 | `VP-BR-DSW-A01` | Branch access switch | Cisco IOS 15.2-family | n/a | n/a | n/a | 24 | simulator only | L3 |
| 11 | `VP-MO-EDGE-01` | Macau router, separate routing domain, redistribution boundary | Cisco IOS 15.2-family | n/a | n/a | n/a | 4 | simulator only | L3 |
| 12 | `VP-MO-DSW-A01` | Macau access switch | Cisco IOS 15.2-family | n/a | n/a | n/a | 24 | simulator only | L3 |
| 13 | `VP-WC-EDGE-01` | Small-office router; tunnel peers; small routing domain | Cisco IOS 15.2-family | n/a | n/a | n/a | 4 | simulator only | L3 |
| 14 | `VP-WC-DSW-A01` | Small-office access switch | Cisco IOS 15.2-family | n/a | n/a | n/a | 24 | simulator only | L3 |
| 15 | `VP-ISP-EDGE-01` | Simulated transit provider edge | Cisco IOS 15.2-family | n/a | n/a | n/a | 4 | simulator only | L3 |
| 16 | `VP-HQ-VOICE-01` | Voice call control (telephony service and directory numbers) | Cisco IOS 15.2-family | n/a | n/a | n/a | 1 | simulator only | L3 (supporting) |
| 17 | `vpnz-dc01` | Primary domain controller, name resolution, addressing, certificate authority, time source | Windows Server 2025 Standard, Desktop Experience, build 10.0.26100.1742 **[ASSUMPTION: exact patch level]** | 2 | 4 GB | 60 GB | 1 | server network | L1, L4 |
| 18 | `vpnz-dc02` | Second domain controller, name resolution, addressing partner, global catalog | As row 17 | 2 | 4 GB | 60 GB | 1 | server network | L1, L4 |
| 19 | `vpnz-fs01` | File services, quota and file screening, replication, backup target | Windows Server 2025 Standard | 2 | 4 GB | 80 GB plus a 20 GB data disk | 1 | server network | L1, L4 |
| 20 | `vpnz-san01` | Block-storage target; three logical units (20 GB, 40 GB, 60 GB thin) | Windows Server 2025 Standard with the storage-target role | 2 | 4 GB | 30 GB OS plus 120 GB thin units | 1 | storage network | L1 |
| 21 | `vpnz-rras01` | Certificate-based remote access and RADIUS policy | Windows Server 2025 Standard | 2 | 4 GB | 60 GB | 1 | server network | L1 |
| 22 | `vpnz-lnxra01` | Second remote-access implementation, Linux-side certificate authority, host firewall | Ubuntu Server 24.04.3 LTS (Noble Numbat) | 2 | 4 GB | 40 GB | 1 | server network | L2, L1 (reliance) |
| 23 | `vpnz-mon01` | Automation control node, version-control server, metrics, dashboards, log aggregation, configuration archive, time source | Ubuntu Server 24.04.3 LTS | 4 | 8 GB | 100 GB | 1 | server network | L4, L5 (data source) |
| 24 | `vpnz-ai01` | Agent runtime, tool bridge, read-only collector | Ubuntu Server 24.04.3 LTS | 4 | 8 GB | 60 GB | 1 | server network | L5 |
| 25 | `vpnz-nft01` | Stateful filtering, address translation, redundancy master | Ubuntu Server 24.04.3 LTS | 2 | 4 GB | 40 GB | 2 | egress plus transport | L2, L4 |
| 26 | `vpnz-nft02` | Redundancy backup with an identical ruleset | Ubuntu Server 24.04.3 LTS | 2 | 4 GB | 40 GB | 2 | egress plus transport | L2, L4 |
| 27 | `vpnz-dmzrev01` | Reverse proxy, transport-security termination, redundancy master | Ubuntu Server 24.04.3 LTS | 2 | 4 GB | 40 GB | 2 | published services plus core | L2, L1 (reliance) |
| 28 | `vpnz-dmzrev02` | Reverse proxy, redundancy backup | Ubuntu Server 24.04.3 LTS | 2 | 4 GB | 40 GB | 2 | published services plus core | L2 |
| 29 | `vpnz-dmzweba01` | Application-tier node 1, sample application, behind the proxy | Windows Server 2025 Standard | 2 | 4 GB | 60 GB | 1 | published services | L1 |
| 30 | `vpnz-dmzweba02` | Application-tier node 2 | Windows Server 2025 Standard | 2 | 4 GB | 60 GB | 1 | published services | L1 |
| 31 | `vpnz-dmzwp01` | Content node 1 (web server, application runtime, database) | Ubuntu Server 24.04.3 LTS | 2 | 4 GB | 40 GB | 1 | published services | L2 |
| 32 | `vpnz-dmzwp02` | Content node 2 | Ubuntu Server 24.04.3 LTS | 2 | 4 GB | 40 GB | 1 | published services | L2 |
| 33 | `vpnz-dmzjump01` | Published-zone jump and proxy host; the only management path into the zone | Ubuntu Server 24.04.3 LTS | 2 | 2 GB | 60 GB (backup repository) | 1 | published services | L2, L4 |
| 34 | `vpnz-jump01` | Privileged access workstation; administrative entry point and script-authoring host | Windows Server 2025 Standard | 2 | 4 GB | 60 GB | 1 | management network | L1, L4 |
| 35 | `vpnz-brdc01` | Branch read-only domain controller, name resolution, addressing relay, local file cache | Windows Server 2025 Standard | 2 | 4 GB | 60 GB | 2 | server plus user network **[ASSUMPTION: the second adapter only places the server logically into the branch management VLAN; reduce to one adapter if the hypervisor cannot reach that network]** | L1 |
| 36 | `vpnz-hvhost01` | Hypervisor host (not a guest) | Windows 11 Pro 24H2 or 25H2 with the chosen hypervisor | host processors | host memory | host disk | 2 physical (LAN plus spare) plus host-only networks | — | all |

**Row count: 36 rows = 16 simulated network devices + 19 virtual machines + 1 hypervisor host.** Of the 19 virtual machines, **9 are Windows Server guests** and **10 are Linux guests**; the hypervisor host is physical and is not a guest. The four HQ access switches are four separate devices, not one. The optional, uncounted additions described in Appendices A and F — an issuing-authority guest and an optional tunnel-peer guest — are not included in the count of nineteen.

| Resource class | Count | vCPU | RAM (GB) | Provisioned disk (GB) |
|---|---|---|---|---|
| Windows Server guests | 9 | 18 | 36 | 540 |
| Automation and monitoring control node | 1 | 4 | 8 | 100 |
| Agent runtime node | 1 | 4 | 8 | 60 |
| Other Linux guests | 8 | 16 | 26 | 300 |
| **Total (19 virtual machines)** | **19** | **42** | **78** | **1 000** |
| Templates (powered off) | 2 | — | — | 130 (excluded from run-time figures) |
| Snapshot allowance | — | — | — | +250 |
| **Host disk requirement** | | | | **≈1 400 GB allocated; 2 TB recommended** |

**Allocation notes.** The 42-vCPU figure is *allocated* processor count, not simultaneous load; no guest is processor-saturated except briefly during package installation or an automation run, so an eight-core host is workable and a twelve-to-sixteen-core host is comfortable. Memory does not overcommit usefully on a workstation hypervisor, which makes the 78 GB of allocation the binding constraint and the reason the two-shift fallback exists. Every Windows guest except the domain controllers is a full clone of one prepared template and every Linux guest is a full clone of a second template; template disks are excluded from the running count while the templates are shut down, and that is what makes nineteen guests feasible on one host. All laboratory hardware addresses are hand-assigned within the hypervisor's own range and are ignored by the simulator.

### Appendix D — Service Port and Protocol Matrix

Direction is written as source to destination. Where a protocol is required by the design but not named in the project brief, it is marked `†` and is justified in the report.

| # | Port / protocol | Service | Where it runs | Zone to zone | Purpose and test evidence |
|---|---|---|---|---|---|
| P-01 | 53/udp and 53/tcp | Name resolution | `vpnz-dc01`, `vpnz-dc02`, `vpnz-brdc01` | user, server, published → server | Name resolution; evidence query from a client and a diagnostic lookup from Linux |
| P-02 | 67/udp and 68/udp | Addressing | `vpnz-dc01` primary, `vpnz-dc02` at 80/20, relay on every gateway | server → user | Address assignment; evidence the lease listing and the interface state on a client |
| P-03 | 88/tcp and 88/udp | Kerberos | domain controllers | user, server → server | Domain authentication; evidence the ticket listing after logon |
| P-04 | 389/tcp and 389/udp | LDAP | domain controllers | user, published (bind account only) → server | Directory reads for the content-tier authentication plug-in |
| P-05 | 636/tcp | LDAPS | domain controllers | server, published → server | Encrypted directory reads; evidence a directory browser connecting on 636 |
| P-06 | 445/tcp | SMB 3.1.1 | file server and domain controllers (SYSVOL, NETLOGON) | user → server | File shares, quota and file-screen evidence |
| P-07 | 135/tcp and the dynamic RPC range | RPC endpoint mapper and dynamic RPC | Windows guests | management → server | Replication, quota management, backup |
| P-08 | 3260/tcp | Block storage | storage target host | platform-tier initiators → server (storage network) | Volume attachment; evidence the session listing and the disk listing |
| P-09 | 3389/tcp | Remote desktop | all Windows guests | management → all; remote-access pool → platform nodes only | Administration; **denied for ordinary users** |
| P-10 | 5985/tcp, 5986/tcp | Remote management (HTTP and HTTPS) | all Windows guests | control node → targets | Automation over the HTTPS listener; evidence a remote-management probe |
| P-11 | 22/tcp | Secure shell | all Linux guests and network devices | management and control node → targets | Administration and automation; evidence a verbose connection |
| P-12 | 123/udp (and 123/tcp for some clients) | Time synchronisation | `vpnz-dc01` as the forest source, `vpnz-mon01` as the Linux source | all → server | Time integrity; evidence the Windows time query and the Linux time source listing |
| P-13 | 80/tcp | HTTP (redirect only) | reverse proxy, application tier, content tier | Internet → published; management → targets | Redirect to HTTPS; evidence a header-only request |
| P-14 | 443/tcp | HTTPS and transport security | reverse proxy, application tier, content tier, dashboards | Internet → published; user → proxy | Published portal and content; evidence a browser plus a transport-security client |
| P-15 | 443/udp | Tunnel (site and remote pool) | filtering pair, small-office peer, staff laptops | Internet → remote-access zone | Primary small-office and remote tunnel |
| P-16 | 500/udp and 4500/udp | IKEv2 and IPsec NAT traversal | remote-access server and firewall | Internet → remote-access zone | Certificate-based remote access and site-to-site tunnel; evidence the client connection object and the tunnel security-association listing |
| P-17 | 1194/udp | Second remote-access implementation | open-source remote-access host | Internet → remote-access zone | Independent remote-access technology for the comparison chapter |
| P-18 | 1812/udp and 1813/udp | RADIUS and accounting | remote-access server policy component | server → server | Remote-access authorisation and accounting; evidence the policy log |
| P-19 | 6516/tcp | Browser-based server management gateway | `vpnz-mon01` or `vpnz-jump01` | management → gateway | Web-based server management |
| P-20 | 9090/tcp | Metrics interface | `vpnz-mon01` | management → server | Metrics interface; evidence all scrape targets reporting up |
| P-21 | 3000/tcp | Dashboard interface | `vpnz-mon01` | management → server | Dashboards: overview, security, availability |
| P-22 | 9100/tcp | Linux host metrics exporter | all Linux guests | control node → targets | Host metrics |
| P-23 | 9182/tcp | Windows host metrics exporter | all Windows guests | control node → targets | Host metrics |
| P-24 | 514/udp † | Centralised logging | receiver on `vpnz-mon01`; senders are all Linux guests and all network devices | all → management | Centralised logging; evidence per-host log files |
| P-25 | 161/udp and 162/udp † | Authenticated and encrypted device monitoring and traps | network devices, Linux guests, Windows guests | control node ↔ devices | Device monitoring. **Community-string-based monitoring is forbidden by design** |
| P-26 | 69/udp † (plus file transfer over the secure shell) | Configuration-file transfer | `vpnz-mon01` archive directory | network devices ↔ server | Device configuration archive |
| P-27 | 3306/tcp † | Content-tier database | content nodes, loopback or local socket only | localhost | Content database; must not be reachable from outside the host |
| P-28 | 9000/tcp † | Application runtime socket | content nodes | localhost and co-located web server | Content application tier |
| P-29 | 11211/tcp † | Optional object cache | content nodes | content nodes → each other | Only if implemented; must be authenticated or bound to those hosts |
| P-30 | 5432/tcp | Relational database | **not used in this design** | — | Listed only to state explicitly that it is not part of this design |
| P-31 | 53/tcp (zone transfer) | Name-service zone transfer | domain controllers only | server → server | Restricted to the two domain controllers; evidence a zone export |
| P-32 | 464/tcp and 464/udp | Kerberos password change | domain controllers | user → server | Password change |
| P-33 | 5989/tcp | Management instrumentation over the network | Linux guests, only if directory-integrated monitoring is used | control node → targets | **[ASSUMPTION]** Optional; dropped if unused |
| P-34 | 18789/tcp | Agent runtime control and interface endpoint | `vpnz-ai01` | management → server | **Bound locally only; must not be reachable from the user zone.** The exact default port is an **[ASSUMPTION]** and must be confirmed against the running instance and corrected |
| P-35 | 51820/udp | Out-of-band management tunnel | filtering master ↔ monitoring host | management ↔ egress | Out-of-band escape hatch; disabled during the security test with its absence evidenced |

**Default-deny discipline.** Every row above is an entry in an allow-list. Any port not listed is denied in both directions, and the report contains one screenshot per zone boundary showing a denied packet, taken from the firewall log, the host filter's log prefix or the simulator's simulation mode.

### Appendix E — Naming Conventions and Interface Contract

The block below is the contract of values as issued. It is the anti-inconsistency mechanism of the project: values are copied verbatim and are never paraphrased, re-capitalised, re-addressed or "improved". A deviation from this block is a defect, and a change to it requires a decision-log entry, three-of-four group agreement, supervisor awareness and a re-issued revision of the design baseline.

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
Windows/firewall VMs:         vpnz-dc01  vpnz-dc02  vpnz-fs01  vpnz-san01  vpnz-rras01
                              vpnz-lnxra01  vpnz-mon01  vpnz-ai01
                              vpnz-nft01  vpnz-nft02
                              vpnz-dmzrev01  vpnz-dmzrev02  vpnz-dmzweba01  vpnz-dmzweba02
                              vpnz-dmzwp01  vpnz-dmzwp02  vpnz-dmzjump01
                              vpnz-jump01  vpnz-brdc01
Hypervisor host:              vpnz-hvhost01
Templates:                    W2K25-TEMPLATE-01 | UBU2404-TEMPLATE-01
Optional extra (tunnel peer, only if that design option is taken): vpnz-wcwg01
Simulated network devices:    VP-HQ-CORE-01  VP-HQ-CORE-02
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
nginx HA VIP                  10.10.90.10
vpnz-dmzweba01 / .02          10.10.90.21 / 10.10.90.22
vpnz-dmzwp01  / .02           10.10.90.25 / 10.10.90.26
vpnz-dmzjump01                10.10.90.27
ASA VP-HQ-FW-01               outside 198.51.100.1 | inside 10.10.50.2 | dmz 10.10.90.1
Public published addresses    198.51.100.2 (portal), 198.51.100.3 (www), 198.51.100.4 (blog), 198.51.100.5 (VPN front door)
HQ edge WAN links             gi0/0 10.10.100.1/30 <-> ISP 10.10.100.2/30
                              gi0/2 10.10.100.33/30 <-> VP-BR-EDGE-01 10.10.100.34/30
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
100  LAN-ISP          10.10.100.0/29  (transit block, + /30s at .4, .32, .36, .40)
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
Redistribution                ONLY at VP-HQ-EDGE-01; route tags 100 (OSPF) and 200 (EIGRP); one direction per prefix set
First-hop redundancy          HSRP (switch SVIs, groups 1-4 one per SVI: VLAN30 .ac01, VLAN40 .ac02, VLAN70 .ac03, VLAN80 .ac04; active priority 150) | VRRP via Keepalived
                              (vrid 51 = nftables pair 10.10.50.0/28, vrid 61 = nginx pair 10.10.90.0/24; both VIPs are owned by no node)
VLAN trunking                 native VLAN 999 on every trunk; VLAN 1 carries no traffic

=== VERSIONS (write the value; if the running system differs, record the deviation) ===
Hypervisor                    VMware Workstation Pro 17.6.2   [recommended default]
Hypervisor alternatives       Oracle VirtualBox 7.1.x | Microsoft Hyper-V (both workable)
Hypervisor host OS            Windows 11 Pro, 24H2/25H2, build 26100.x
Windows Server                Windows Server 2025 Standard (Desktop Experience), build 10.0.26100.1742
                              fallback: Windows Server 2022 (build 20348)
Linux                         Ubuntu Server 24.04.3 LTS (Noble Numbat); fallback: 24.04.x latest point release
Cisco Packet Tracer           8.2.2   [UNCERTAIN — confirm against NetAcad at build time and correct]
Packet Tracer ASA             Cisco ASA 5506-X device, ASA 9.16(4) image   [UNCERTAIN — record `show version`]
Ansible                       ansible-core 2.18.x + community package 11.x; pywinrm 0.5.0
PowerShell                    Windows PowerShell 5.1 (guests) + PowerShell 7.4 LTS (authoring, vpnz-jump01)
nftables                      1.0.9        Keepalived 2.2.8        Nginx 1.24.0
OpenVPN                       2.6.x        WireGuard wireguard-tools 1.0.20210914
Easy-RSA                      3.1.x        Git 2.43+               MariaDB 10.11
Prometheus 2.5x | Grafana 11.x | Loki 3.x | node_exporter 1.8.x | windows_exporter 0.29.x
OpenClaw                      NOT PINNED — highest-uncertainty item

=== PATHS ===
Repository root (host)        C:\FYP\
  baseline                    C:\FYP\00-baseline\
  proposal                    C:\FYP\01-proposal\
  design                      C:\FYP\02-design\
  packet tracer projects      C:\FYP\03-build\packet-tracer\   (01-l2l3-core.pkt ... 05-full.pkt)
  windows runbooks            C:\FYP\03-build\windows\
  linux runbooks              C:\FYP\03-build\linux\
  ansible                     C:\FYP\04-automation\ansible\
  powershell                  C:\FYP\04-automation\powershell\
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
ASA object-group names        OBJ-NET-SRV | OBJ-NET-DMZ | OBJ-NET-MGMT | OBJ-NET-USER | OBJ-NET-VPN | OBJ-NET-LAB
ACL naming                    ACL-{ZONE}-{DIR}-{NN}          e.g. ACL-DMZ-OUT-10
iSCSI initiator IQN           iqn.2026-01.lab.fyp.vertexpeak:storage-lun01 (and -lun02, -lun03)
                              on vpnz-dmzweba01 -- the canonical string, set by the group
iSCSI target IQN              iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target
                              (and -lun02.target, -lun03.target) -- DERIVED by the iSCSI Target
                              Server on vpnz-san01; not settable (Rev 1.1 ruling C-06)
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

**Naming conventions used by the contract, restated as rules.**

| Object class | Pattern | Examples |
|---|---|---|
| Simulated routers | `VP-{SITE}-EDGE-{NN}` | `VP-HQ-EDGE-01`, `VP-BR-EDGE-01`, `VP-WC-EDGE-01`, `VP-MO-EDGE-01` |
| Simulated core switches | `VP-HQ-CORE-{NN}` | `VP-HQ-CORE-01`, `VP-HQ-CORE-02` |
| Simulated access switches | `VP-{SITE}-DSW-A{NN}` | `VP-HQ-DSW-A01`, `VP-BR-DSW-A01` |
| Simulated firewall | `VP-{SITE}-FW-{NN}` | `VP-HQ-FW-01` |
| Simulated voice device | `VP-{SITE}-VOICE-{NN}` | `VP-HQ-VOICE-01` |
| Virtual machines | `vpnz-{role}{NN}`, lower case, no separators | `vpnz-dc01`, `vpnz-dmzrev01`, `vpnz-nft02` |
| VM templates | `W2K25-TEMPLATE-01`, `UBU2404-TEMPLATE-01` | — |
| Linux network interface | Never hard-coded; always resolved with `ip -br link` and documented | — |
| Windows interface alias | `SRV-VLAN30`, `MGMT-VLAN20`, `DMZ-VLAN90`, set with `Rename-NetAdapter` | — |
| Cisco interface description | `[to {PEER} {PORT} VLAN{id} {ZONE}]` | `description [to VP-HQ-CORE-01 Gi1/0/1 VLAN10 Z-CORE]` |
| Access list | `ACL-{ZONE}-{DIR}-{NN}` | `ACL-DMZ-OUT-10` |
| Filter table | `inet fyp_filter` | — |
| Firewall zone object | `OBJ-NET-{ZONE}` | `OBJ-NET-DMZ`, `OBJ-NET-SRV` |
| Backup job | `BKP-{TARGET}-{FREQ}` | `BKP-DC01-DAILY`, `BKP-NFT-RULESET-WEEKLY` |

Hostnames are at most fifteen characters, contain no underscores, and are never re-capitalised: the strings above are canonical. The Linux estate uses lower-case RFC 1123 syntax, and administrators always log in with their own named account, never as the superuser and never with a shared account.

### Appendix F — Software and Version Register

Every version is re-verified at build time with a version-printing command, and the actual output is captured as evidence. Where the actual version differs from this register, the report contains a version-deviations subsection listing each difference and its impact; documenting a version that does not match the running system is treated as an integrity failure for this project.

| Component | Pinned version | Status | Where it runs | How it is confirmed at build time | Fallback |
|---|---|---|---|---|---|
| Hypervisor | VMware Workstation Pro 17.6.2 | Existence confirmed; usability assumed | `vpnz-hvhost01` | The product's own version and build display, recorded in the build manual | Oracle VirtualBox 7.1.x, or the in-box Microsoft hypervisor |
| Hypervisor host OS | Windows 11 Pro, 24H2 or 25H2, build 26100.x | **[ASSUMPTION]** | Hypervisor host | The operating-system version and build reported by the system information tool or the about dialog | Any Windows 11 Pro build that supports the chosen hypervisor; the exact build is recorded |
| Windows Server | Windows Server 2025 Standard, Desktop Experience, build 10.0.26100.1742 | Base build confirmed; exact patch level assumed | Nine Windows guests | The operating-system build reported by the system information command on each guest | Windows Server 2022 (build 20348); every role used here exists there too |
| Windows client OS (optional, for the remote-access client demonstration) | Windows 11 Pro 24H2 | **[ASSUMPTION]** | A member's laptop used as the client | The about dialog on the client | Any supported Windows client build that provides the included certificate-based client |
| Linux server OS | Ubuntu Server 24.04.3 LTS (Noble Numbat) | Release confirmed | Ten Linux guests | The distribution release command and the kernel version command | Latest point release of the same long-term-support series, or the named alternative distribution; nothing depends on distribution-specific behaviour except package versions |
| Network simulator | 8.2.2 | **[UNCERTAIN]** — stated from memory and must be confirmed against the academy download page | Host | The simulator's own about dialog, captured as a screenshot | Whatever current academy-supported release is available; the build actually used is stated in the report, and no third-party installer is used |
| Simulated firewall appliance | Appliance model 5506-X with a 9.16(4) image | **[UNCERTAIN]** | Simulator | The device's own version output, captured on the first build day | The older appliance model the build does provide, with the substitution recorded; the report does not claim the simulated appliance faithfully models the hardware |
| Routing and switching images | Cisco IOS 15.2-family images bundled with the simulator release | **[UNCERTAIN]** — exact strings unknown | Simulator | The device's own version output on each device | Whichever devices the build offers; the version output is captured as evidence |
| Configuration management | `ansible-core` 2.18.x with the community package 11.x | Confirmed that the community package and its collections exist | `vpnz-mon01` | The version command and the collection listing on the control node | Install into a virtual environment on the control node from the package index; if the pin cannot be met, record the version actually present |
| Windows remote management for automation | `pywinrm` 0.5.0 | **[ASSUMPTION]** | `vpnz-mon01` | The package manager's show command for the installed module | Any compatible release; the version actually present is recorded |
| PowerShell | Windows PowerShell 5.1 in-box on guests; PowerShell 7.4 LTS on the authoring host | In-box version certain; 7.4 assumed | All Windows guests | The version table on each host, with the runtime named per script | Use only the in-box runtime if installation of the newer build is blocked, and state which runtime each script was tested on |
| Packet filtering | 1.0.9 (distribution repository version) | **[ASSUMPTION]** | Filtering pair and the open-source remote-access host | The tool's version flag | Whatever the installed image reports; recorded as evidence |
| Reverse proxy and content web server | 1.24.0 (distribution package) | **[ASSUMPTION]** | Reverse-proxy pair and content nodes | The server's version flag | A mainline build if a newer feature is required; the distribution-packaged version is stated as a deliberate choice |
| First-hop redundancy for Linux | 2.2.8 (distribution repository version) | **[ASSUMPTION]** | Reverse-proxy pair and filtering pair | The tool's version flag | Whatever the installed image reports |
| Second remote-access implementation | 2.6.x series (distribution repository version) | Series confirmed; minor assumed | `vpnz-lnxra01` | The server's own version output | Record the exact version output; the minor version is not asserted |
| Tunnel implementation | `wireguard-tools` 1.0.20210914 with the in-kernel module | **[ASSUMPTION]** | Filtering pair and the optional peer | The tool's version flag and the loaded module listing | The userspace implementation if the kernel module is unavailable in a guest |
| Linux-side certificate authority | Easy-RSA 3.1.x (distribution package) | Package existence confirmed | `vpnz-lnxra01` | The tool's version flag and the PKI build output | A 3.0.8 release archive if the package is absent |
| Application server | Web server 10.0 on Windows Server 2025 with an ASP.NET Core 8.0 LTS hosting bundle | **[ASSUMPTION: 8.0 LTS]** | Application-tier nodes | The web-server version in the manager console and the runtime version command | A static page if the hosting bundle cannot be obtained in the laboratory |
| Content management | 6.4.x or later with MariaDB 10.11 (distribution packaged) | **[ASSUMPTION]** | Content nodes | The application's own version page and the database version flag | Any later release available from the distribution archive or the project's own site; content is generated by the group |
| Metrics, dashboards and log aggregation | Prometheus 2.5x; Grafana 11.x; Loki 3.x | **[ASSUMPTION]** | Monitoring and automation control node | Each product's own version flag or about page | If resources are constrained, drop the log-aggregation component and use the system logger with a text panel on a dashboard |
| Windows host metrics exporter | 0.29.x | **[ASSUMPTION]** | All Windows guests | The exporter's version flag | Remote polling over the management protocol instead of the exporter |
| Linux host metrics exporter | 1.8.x | **[ASSUMPTION]** | All Linux guests | The exporter's version flag | — |
| Agent runtime for the innovation line | **Not pinned.** The version must be recorded from the deployed instance | **[UNCERTAIN]** — the highest-uncertainty component in this project | `vpnz-ai01` | A screenshot of the running instance and the version command it provides, plus a citation to the documentation actually read | Five pre-designed fallbacks: a generic agent loop over the same four read-only tools; re-expression of the tools in the runtime's documented format; the deterministic collectors and correlation rules with a scripted policy; reduction to a single capability; and the failure recorded as a limitation. No version, capability or licence statement about this component appears in any deliverable without the screenshot and the citation |
| Version control | Git 2.43+, with bare repositories served over the secure shell | **[ASSUMPTION]** | Control node | The version flag on the control node | Bare repositories over the secure shell with no web interface |
| Log receiver | rsyslog 8.2312 (distribution packaged) | **[ASSUMPTION]** | Control node | The receiver's version flag | Plain files with rotation |
| Off-host backup | Restic | **[ASSUMPTION]** as to version | Backup job to the published-zone jump host | The tool's version flag | A scripted archive copy as an equivalent configuration and evidence backup |
| Diagramming | An offline desktop diagramming tool, or the office suite's drawing component | **[ASSUMPTION]** | Member laptops | Not version-sensitive | The simulator's own screenshots and terminal output, which are the primary evidence in any case |

**Version-deviation record.** Differences between this register and the running systems are listed in the report's version-deviations subsection, each with the impact statement required by the pinning discipline. The record is a table with columns for component, pinned version, observed version, the command that produced the observation, the impact, and whether the deviation changes any design assumption.

### Appendix G — Test Case Index

Every test-case identifier used in this proposal, with its title and the subsection that defines it. The **Actual result** and **Pass/Fail** columns of the executed records are filled in during the project and reproduced in the verification chapter.

| ID | Title | Defined in |
|---|---|---|
| TC-L1-01 | Directory forest and domain health | 13.3.1 |
| TC-L1-02 | Replication between domain controllers and to the read-only copy | 13.3.1 |
| TC-L1-03 | Operations-master role placement and transfer | 13.3.1 |
| TC-L1-04 | Directory-integrated forward zone and host records | 13.3.1 |
| TC-L1-05 | Reverse zones and pointer records | 13.3.1 |
| TC-L1-06 | Addressing scope, options and lease behaviour | 13.3.1 |
| TC-L1-07 | Addressing failover partner relationship (80/20) | 13.3.1 |
| TC-L1-08 | Policy baseline applied to workstations | 13.3.1 |
| TC-L1-09 | Certificate auto-enrolment and internal trust | 13.3.1 |
| TC-L1-10 | Transport-security chain presented by an internal service | 13.3.1 |
| TC-L1-11 | Encrypted directory access on the domain controllers | 13.3.1 |
| TC-L1-12 | Quota enforcement | 13.3.1 |
| TC-L1-13 | File-type screening | 13.3.1 |
| TC-L1-14 | Share permissions and least privilege | 13.3.1 |
| TC-L1-15 | Block-storage target, logical units and authentication | 13.3.1 |
| TC-L1-16 | Storage session reconnect after a target restart | 13.3.1 |
| TC-L1-17 | Remote-access role installed and configured as designed | 13.3.1 |
| TC-L1-18 | Certificate-based remote access with split tunnelling disabled | 13.3.1 |
| TC-L1-19 | Access policy requires both certificate and group membership | 13.3.1 |
| TC-L1-20 | Time-source integrity | 13.3.1 |
| TC-L1-21 | Read-only domain controller behaviour at the branch | 13.3.1 |
| TC-L1-22 | Directory recycle-bin restore | 13.3.1 |
| TC-L1-23 | Highest-tier administrative separation | 13.3.1 |
| TC-L1-24 | Script transcription and script-block logging | 13.3.1 |
| TC-L1-25 | Backup policy configuration and a file restore | 13.3.1 |
| TC-L2-01 | Web-server configuration validity across all nodes | 13.3.2 |
| TC-L2-02 | Reverse proxy publishes the portal with transport-security termination | 13.3.2 |
| TC-L2-03 | Plain HTTP redirects to secure HTTP | 13.3.2 |
| TC-L2-04 | Transport-security protocol floor and cipher evidence | 13.3.2 |
| TC-L2-05 | Upstream load distribution across the application pair | 13.3.2 |
| TC-L2-06 | Upstream failover when one node is unavailable | 13.3.2 |
| TC-L2-07 | First-hop redundancy instance for the proxy pair | 13.3.2 |
| TC-L2-08 | First-hop redundancy instance for the egress pair | 13.3.2 |
| TC-L2-09 | Filtering ruleset loads and validates | 13.3.2 |
| TC-L2-10 | Service tracking tests the service and not only the interface | 13.3.2 |
| TC-L2-11 | Atomic ruleset apply with rollback protection | 13.3.2 |
| TC-L2-12 | Egress translation behaviour | 13.3.2 |
| TC-L2-13 | Site tunnel negotiation | 13.3.2 |
| TC-L2-14 | Remote-access tunnel pool | 13.3.2 |
| TC-L2-15 | Tunnel configuration file protection | 13.3.2 |
| TC-L2-16 | Second remote-access server operation and PKI | 13.3.2 |
| TC-L2-17 | Linux-side authority, server and client certificates | 13.3.2 |
| TC-L2-18 | Certificate revocation is enforced | 13.3.2 |
| TC-L2-19 | Linux hardening baseline applied | 13.3.2 |
| TC-L2-20 | Key-only administration with named accounts | 13.3.2 |
| TC-L2-21 | Centralised log forwarding | 13.3.2 |
| TC-L2-22 | Content tier serves the blog front end | 13.3.2 |
| TC-L2-23 | Database and application sockets are not network-exposed | 13.3.2 |
| TC-L2-24 | Certificate expiry monitoring | 13.3.2 |
| TC-L2-25 | File-system and volume management | 13.3.2 |
| TC-L3-01 | Exterior routing session to the primary provider | 13.3.3 |
| TC-L3-02 | Alternate provider session and path preference | 13.3.3 |
| TC-L3-03 | Prefix control and session loss | 13.3.3 |
| TC-L3-04 | Interior routing adjacency between HQ and the branch | 13.3.3 |
| TC-L3-05 | Interior route propagation and default information | 13.3.3 |
| TC-L3-06 | Second routing domain at the Macau site | 13.3.3 |
| TC-L3-07 | One-way tagged redistribution between the two domains | 13.3.3 |
| TC-L3-08 | Routing-loop safety after a deliberate misconfiguration | 13.3.3 |
| TC-L3-09 | First-hop redundancy active and standby roles | 13.3.3 |
| TC-L3-10 | Spanning-tree root bridge and port roles | 13.3.3 |
| TC-L3-11 | Topology change and reconvergence | 13.3.3 |
| TC-L3-12 | Access-port hardening and trunk discipline | 13.3.3 |
| TC-L3-13 | Port security blocks an unauthorised address | 13.3.3 |
| TC-L3-14 | Address-assignment snooping and rogue server blocking | 13.3.3 |
| TC-L3-15 | Firewall denial for the published-services boundary | 13.3.3 |
| TC-L3-16 | Firewall permission for the published portal only | 13.3.3 |
| TC-L3-17 | Firewall permission and denial at the remote-access front door | 13.3.3 |
| TC-L3-18 | Security levels and inside-out translation | 13.3.3 |
| TC-L3-19 | Inspection policy | 13.3.3 |
| TC-L3-20 | Firewall logging to the monitoring host | 13.3.3 |
| TC-L3-21 | Site-to-site tunnel to the small office | 13.3.3 |
| TC-L3-22 | VLAN segmentation with no stretched VLANs | 13.3.3 |
| TC-L3-23 | Device initialisation and management-plane access | 13.3.3 |
| TC-L3-24 | Loopback addressing and discovery protocol | 13.3.3 |
| TC-L3-25 | Voice device registration (supporting demonstration) | 13.3.3 |
| TC-L3-26 | Time consistency across the network estate | 13.3.3 |
| TC-L4-01 | PowerShell user-onboarding script | 13.3.4 |
| TC-L4-02 | Configuration-management baseline playbook for Windows | 13.3.4 |
| TC-L4-03 | Configuration-management baseline playbook for Linux | 13.3.4 |
| TC-L4-04 | Linux hardening script and shared library | 13.3.4 |
| TC-L4-05 | Version-control workflow, branches and tags | 13.3.4 |
| TC-L4-06 | Idempotence of every playbook | 13.3.4 |
| TC-L4-07 | Configuration management reaching Windows hosts | 13.3.4 |
| TC-L4-08 | The port matrix as an executable test | 13.3.4 |
| TC-L4-09 | Network device configuration collection | 13.3.4 |
| TC-L4-10 | Policy backup and export | 13.3.4 |
| TC-L4-11 | Directory health reporting script | 13.3.4 |
| TC-L4-12 | Secrets are not committed | 13.3.4 |
| TC-L4-13 | Filtering playbook | 13.3.4 |
| TC-L4-14 | First-hop redundancy playbook and state convergence | 13.3.4 |
| TC-L4-15 | Provisioning from a template to a finished service | 13.3.4 |
| TC-L4-16 | Whole-estate verification playbook | 13.3.4 |
| TC-L4-17 | Script logging and auditability | 13.3.4 |
| TC-L5-01 | Agent runtime reachable and tool surface is exactly four tools | 13.3.4 |
| TC-L5-02 | Alert-triage capability end to end | 13.3.4 |
| TC-L5-03 | Interface-health capability | 13.3.4 |
| TC-L5-04 | Authentication-failure capability | 13.3.4 |
| TC-L5-05 | Read-only enforcement | 13.3.4 |
| TC-L5-06 | Credential least privilege for the agent | 13.3.4 |
| TC-L5-07 | Agent reachability restricted to documented management ports | 13.3.4 |
| TC-L5-08 | Documentation-drafting capability and honesty of output | 13.3.4 |
| TC-L5-09 | False-positive and hallucination handling | 13.3.4 |
| TC-L5-10 | Rate limiting and invocation audit | 13.3.4 |
| TC-DOC-01 | All six documentation categories present and populated | 13.3.5 |
| TC-DOC-02 | Every screenshot named, captioned and indexed | 13.3.5 |
| TC-DOC-03 | Traceability complete and consistency sweep clean | 13.3.5 |
| TC-PM-01 | Project-management controls produced their records | 13.3.5 |
| TC-PM-02 | The risk register was maintained as a live instrument | 13.3.5 |
| TC-MON-01 | Metrics collection covers the estate as designed | 13.3.5 |
| TC-MON-02 | Dashboards provisioned from version-controlled files | 13.3.5 |
| TC-MON-03 | Alert rules fire and resolve | 13.3.5 |
| TC-MON-04 | Centralised logging receives and separates every source class | 13.3.5 |
| TC-PKI-01 | Certificate issuance, trust and lifecycle across both platforms | 13.3.5 |
| TC-FO-01 | HQ first-hop gateway failure | 13.4 |
| TC-FO-02 | HQ first-hop gateway recovery with preemption | 13.4 |
| TC-FO-03 | Reverse-proxy master failure | 13.4 |
| TC-FO-04 | Egress-pair master failure, link-down and service-level variants | 13.4 |
| TC-FO-05 | Service failure with the interface healthy | 13.4 |
| TC-FO-06 | Domain controller failure | 13.4 |
| TC-FO-07 | Name-resolution redundancy and the loss of the primary resolver | 13.4 |
| TC-FO-08 | Block-storage target restart | 13.4 |
| TC-FO-09 | Web-tier node failure behind the proxy | 13.4 |
| TC-FO-10 | Full content-tier node loss | 13.4 |
| TC-FO-11 | WAN link failure to a branch and routing reconvergence | 13.4 |
| TC-FO-12 | Exterior routing session loss | 13.4 |
| TC-FO-13 | Hypervisor host failure — **declared non-test**. It is not injected, because the host is a single point of failure with no failover to observe, and it is recorded as a limitation rather than as a test | 13.4 |
| TC-SEC-01 | Published zone to server and user zones: denied at the firewall [trust boundary TB-04] | 13.5.1 |
| TC-SEC-02 | Internet to the internal zones: denied; only the published front door answers [trust boundaries TB-05, TB-06] | 13.5.1 |
| TC-SEC-03 | The isolated laboratory segment reaches nothing except its own subnet and the laboratory console [trust boundaries TB-09, TB-10] | 13.5.1 |
| TC-SEC-04 | Remote-access users are never administrators of infrastructure [trust boundary TB-12] | 13.5.1 |
| TC-SEC-05 | Branch WAN to the management zone: denied [trust boundary TB-14] | 13.5.1 |
| TC-SEC-06 | Reverse direction to the management zone: only centralised logging, authenticated monitoring and traps [trust boundary TB-08] | 13.5.1 |
| TC-SEC-07 | Ordinary users cannot use remote desktop to reach servers [trust boundary TB-01] | 13.5.1 |
| TC-SEC-08 | The published-zone management path is only through the jump host [trust boundary TB-15] | 13.5.1 |
| TC-SEC-09 | The default-deny discipline: an unlisted port is denied in both directions | 13.5.1 |
| TC-SEC-10 | Drop logging is present before every drop in the host-filter ruleset | 13.5.1 |
| TC-SEC-11 | The out-of-band management tunnel is disabled during the security test | 13.5.1 |
| TC-SEC-12 | The exact permitted service set from the user zone to the server zone [trust boundary TB-01] | 13.5.2 |
| TC-SEC-13 | User egress is limited to the documented set [trust boundary TB-02] | 13.5.2 |
| TC-SEC-14 | Server-zone egress is attributed by source address [trust boundary TB-03] | 13.5.2 |
| TC-SEC-15 | The published front door is exactly what is published [trust boundary TB-05] | 13.5.2 |
| TC-SEC-16 | The management zone manages everything, with management protocols only [trust boundary TB-07] | 13.5.2 |
| TC-SEC-17 | The restricted remote-access group, and only that group, reaches the platform tier [trust boundary TB-11] | 13.5.2 |
| TC-SEC-18 | Published-zone hosts may initiate outbound only for resolution and patching [trust boundary TB-13] | 13.5.2 |
| TC-SEC-19 | The agent's read-only poll is its only path to monitored devices [trust boundary TB-16] | 13.5.2 |
| TC-SEC-20 | Certificate-based remote access only; no preshared keys anywhere | 13.5.3 |
| TC-SEC-21 | Machine certificate, user certificate and group membership are all required | 13.5.3 |
| TC-SEC-22 | Second remote-access client certificate identity and revocation | 13.5.3 |
| TC-SEC-23 | Internal certificate chain validation on both platforms | 13.5.3 |
| TC-SEC-24 | Public-name certificate behaviour is documented rather than hidden | 13.5.3 |
| TC-SEC-25 | No self-signed certificate remains in the delivered design | 13.5.3 |
| TC-SEC-26 | Transport-security configuration of the published services | 13.5.3 |
| TC-SEC-27 | Management interfaces are not exposed to lower-trust zones | 13.5.3 |
| TC-SEC-28 | Plaintext management protocols are absent | 13.5.3 |
| TC-SEC-29 | File-sharing signing required and the legacy protocol version suppressed | 13.5.3 |
| TC-SEC-30 | Credential, key and banned-string hygiene in the repository | 13.5.3 |
| TC-SEC-31 | The agent credential is least privilege and its outputs require approval | 13.5.3 |
| TC-SEC-32 | Deliberate-misuse traffic originates only from the designated segment | 13.5.3 |
| TC-SEC-33 | Security event logging is sufficient for investigation | 13.5.3 |


**Index counts.** 103 cases in the four per-line tables (25 identity and Microsoft cases, 25 Linux and services cases, 26 network cases and 27 automation-and-innovation cases), 11 cross-cutting cases covering documentation, project governance, monitoring and certificate lifecycle, 13 failover rows of which 6 are new tests, 6 cross-reference a per-line case and one — the hypervisor-host failure — is a declared non-test, and 33 security cases. The six per-line identifiers cross-referenced by the failover suite are **not** double-counted, so the total is **153 unique test-case identifiers, of which 152 are executable tests and one is a documented non-test**.

### Appendix H — Evidence Index

The evidence index is maintained as a single table at `07-evidence\INDEX.md` and is the bridge between the report and the evidence directory. The structure below is the template as it will be filled during the project; the populated rows for planning purposes are given in section 14.9.

```text
| Evidence ID | Evidence item | Type | Supports section | File path | Related test / rule | Captured by | Date |
|---|---|---|---|---|---|---|---|
| EV-nnnn     | {what it shows} | screenshot | text transcript | JSON result | document | {report section or appendix} | {relative path under C:\FYP\} | {TC-…, TB-…, FN-…, VR-…} | Member {A|B|C|D} | {YYYY-MM-DD} |
```

| Field | Rule |
|---|---|
| Evidence ID | Sequential `EV-nnnn`, never reused. A replaced file takes a new identifier and the old row records the supersession |
| Evidence item | One line that states what the artefact shows, not merely what it is |
| Type | `screenshot`, `text transcript`, `JSON result`, `document`, `run log`, `configuration export` or `packet capture` |
| Supports section | The report section, appendix, objective or trust-boundary row the evidence supports |
| File path | The path relative to the repository root, so it survives the repository being moved |
| Related test or rule | The test-case identifier, trust-boundary row, finding identifier or verification-record identifier |
| Captured by | Exactly one member. This field is what makes evidence ownership and — with commit history — the contribution matrix possible |
| Date | ISO 8601 |
| Index completion | At submission, every evidence file has a row and every row has a file, and `TC-DOC-02` is the test that proves it |

### Appendix I — Configuration Backup and Restore Procedure

**Scope statement.** This is a **configuration and evidence** backup. It is explicitly **not** a full virtual-machine or hypervisor-level backup, because the project has no hypervisor-level backup licence and no shared storage fabric. The report states this boundary wherever the backup design is described, so that no reader infers a restore capability that does not exist. Whole-machine recovery is by re-cloning from the templates and re-applying the automation, which is why the runbooks and the idempotent playbooks are themselves the primary recovery asset.

| # | Target | Method | Schedule | Artefact | Restore procedure |
|---|---|---|---|---|---|
| B-01 | Directory data and policy objects | Native directory backup and policy-object export | Daily via the scheduled job `BKP-DC01-DAILY` | Backup set on the storage logical unit; per-policy export folders in the configuration directory | Restore the directory state, or import individual policy objects; where a single object was deleted, restore it from the directory recycle bin rather than from backup |
| B-02 | File-share data and quota configuration | Native file-service backup plus a quota and screen configuration export | Daily, to the 40 GB backup logical unit | Backup set plus exported quota templates and file groups | Restore the share data to an alternate location, compare hashes, then restore the quota and screen configuration from the export |
| B-03 | Windows guest configuration baselines | Firewall policy export, addressing scope export, name-service zone export, service baseline export | Weekly and before every phase gate | Export files in the configuration directory | Re-import each export; verify with the corresponding query command |
| B-04 | Linux service configuration | Configuration files taken from the automation repository, plus an installed-package listing per host | On every commit and before every phase gate | Files in the automation repository; package listing per host | Re-run the relevant playbook and role, which is the preferred restore path; use the package listing only to detect drift |
| B-05 | Network device configuration | Configuration pull by the collection playbook and the collection script, over the file-transfer service and the secure shell | Weekly and after every change to a device | Configuration text files, committed to the repository under the build directory | Re-apply the configuration text through the device command line, or use the file-transfer path; the simulator's project file is restored from version control instead |
| B-06 | Filtering rulesets | The ruleset is a version-controlled template plus an included-fragment set | On every change, via the automation line | `nftables.conf` and the fragments in the repository | Re-apply from the repository through the apply script, which arms a revert timer so that a bad restore cannot lock out access |
| B-07 | First-hop redundancy configuration | Rendered from a template by the automation line | On every change | Rendered configuration in the repository | Re-render and reload; verify VRRP state on both nodes afterwards |
| B-08 | Certificate material | Certificate and chain files copied to the evidence mirror; **private keys never copied into the repository** | On issuance and renewal | Certificate and chain files only | Reissue from the internal authority if a private key is lost; this is a documented design decision, not an oversight, because key material must not enter version control |
| B-09 | Evidence set (screenshots, transcripts, run logs, results) | Archive copy from the hypervisor host to the published-zone jump host, using the off-host backup job | Daily | Restic repository plus the version-control repository | Restore a single file from the repository and verify it against the index row |
| B-10 | Whole virtual machines | **Not backed up at the hypervisor level.** Recovery is by re-clone from the templates plus re-run of the automation | On failure only | The two templates | Clone the template, add the host to the inventory, run the baseline and service playbooks, then restore configuration from B-01 to B-03 as needed. The measured recovery time is recorded as evidence |

**Restore verification, and why it is mandatory.** A backup that has never been restored is an assumption. The project therefore times and documents four restores and treats them as test evidence rather than as housekeeping: a single file restored from the off-host repository; a deleted organisational unit restored from the directory recycle bin; a file restored to an alternate location from the file-service backup; and a scratch virtual machine rebuilt from a template plus automation. Each restore records the elapsed time, because elapsed time is the only meaningful measure of whether a backup procedure works. The storage-target restart test (`TC-FO-08`) and the optional disaster-recovery exercise both depend on these procedures, so the procedures are exercised before they are needed rather than during an incident.

### Appendix J — Glossary of OSI and Networking Terms

Terms are grouped by the layer of the reference model they primarily belong to, followed by cross-layer terms, identity and platform terms, and project-specific terms.

| Term | Expansion or meaning | Layer or area |
|---|---|---|
| OSI model | Open Systems Interconnection reference model: a seven-layer conceptual model of network communication | Reference model |
| Layer 1 — Physical | Transmission of raw bits over a medium: cabling, connectors, signalling, power | Layer 1 |
| Layer 2 — Data link | Framing and delivery of frames on a single link, including addressing and error detection | Layer 2 |
| Layer 3 — Network | Logical addressing and path selection between networks | Layer 3 |
| Layer 4 — Transport | End-to-end delivery, connection state, reliability and flow control | Layer 4 |
| Layer 5 — Session | Establishing, managing and terminating conversations between applications | Layer 5 |
| Layer 6 — Presentation | Data representation: encoding, compression and encryption formats | Layer 6 |
| Layer 7 — Application | Protocols that applications use directly, such as name resolution, file sharing and web access | Layer 7 |
| Encapsulation | Wrapping data with the headers and trailers of each lower layer as it descends the stack | Cross-layer |
| Frame | A Layer 2 protocol data unit, with source and destination hardware addresses | Layer 2 |
| Packet | A Layer 3 protocol data unit, with source and destination logical addresses | Layer 3 |
| Segment | A Layer 4 protocol data unit in a connection-oriented transport protocol | Layer 4 |
| MTU | Maximum transmission unit: the largest payload a link can carry in one frame | Layer 2 / 3 |
| Ethernet | The dominant Layer 2 technology for local networks, defining framing and addressing | Layer 2 |
| MAC address | Media access control address: a 48-bit hardware address identifying a network interface | Layer 2 |
| Unicast, broadcast, multicast | Delivery to one, to all, and to a subscribed group of destinations | Layer 2 / 3 |
| ARP | Address Resolution Protocol: mapping a logical address to a hardware address on a local link | Layer 2 / 3 |
| VLAN | Virtual local area network: a logically separated Layer 2 broadcast domain on shared physical infrastructure | Layer 2 |
| 802.1Q trunk | A link carrying multiple VLANs, each frame tagged with its VLAN identifier | Layer 2 |
| Native VLAN | The VLAN whose frames are sent untagged on a trunk; here deliberately set to an unused VLAN | Layer 2 |
| Access port | A switch port belonging to a single VLAN, serving an end device | Layer 2 |
| Spanning tree | A protocol that builds a loop-free logical topology by blocking redundant paths | Layer 2 |
| STP, RSTP, PVST | Spanning tree protocol; rapid spanning tree; per-VLAN spanning tree | Layer 2 |
| Root bridge | The reference switch from which the spanning-tree topology is calculated | Layer 2 |
| Root port, designated port, alternate port | The forwarding and non-forwarding port roles elected by the spanning-tree algorithm | Layer 2 |
| PortFast | A spanning-tree feature that puts an end-device port straight into forwarding | Layer 2 |
| BPDU guard, root guard, loop guard | Protections that prevent unauthorised or unexpected spanning-tree participation | Layer 2 |
| Port security | A feature limiting which hardware addresses may appear on a switch port | Layer 2 |
| DHCP snooping | A feature that filters address-assignment messages on untrusted ports | Layer 2 |
| IPv4 addressing | 32-bit logical addressing with a network and host portion, written in dotted-decimal form | Layer 3 |
| Subnet mask and prefix length | The division between network and host bits, expressed either in dotted-decimal or as a prefix | Layer 3 |
| CIDR | Classless inter-domain routing: address aggregation expressed with prefix lengths | Layer 3 |
| Private address space | Address ranges reserved for internal use and not routed on the public Internet | Layer 3 |
| Documentation address range | Address blocks permanently reserved for use in examples and documentation | Layer 3 |
| Gateway | The router interface a host uses to reach destinations outside its own subnet | Layer 3 |
| Static route | A manually configured path to a destination network | Layer 3 |
| Default route | The route used when no more specific route matches | Layer 3 |
| Routing table | The set of known destinations with their next hops and metrics | Layer 3 |
| Administrative distance | The trustworthiness rank a router assigns to routes learned from different sources | Layer 3 |
| Metric | The cost a routing protocol uses to compare paths | Layer 3 |
| Interior gateway protocol | A routing protocol used within one administrative domain, such as OSPF or EIGRP | Layer 3 |
| Exterior gateway protocol | A routing protocol used between administrative domains, such as BGP | Layer 3 |
| OSPF | Open Shortest Path First: a link-state interior routing protocol | Layer 3 |
| EIGRP | Enhanced Interior Gateway Routing Protocol: a distance-vector interior routing protocol with fast convergence | Layer 3 |
| Neighbour adjacency | The state in which two routing devices have exchanged information and can forward routing data | Layer 3 |
| Autonomous system | A set of networks under one administrative control, identified by a number in exterior routing | Layer 3 |
| BGP | Border Gateway Protocol: the exterior routing protocol of the Internet, exchanging reachability between autonomous systems | Layer 3 |
| Prefix list and route map | Mechanisms for filtering and modifying routing information | Layer 3 |
| Local preference and path prepending | Attributes used to influence inbound and outbound path selection in exterior routing | Layer 3 |
| Redistribution | Introducing routes learned by one routing protocol into another | Layer 3 |
| Route tag | A marker attached to redistributed routes so that they can be identified and controlled | Layer 3 |
| Routing loop | A condition in which routing information causes packets or updates to circulate indefinitely | Layer 3 |
| NAT and PAT | Network address translation; translation with port multiplexing so many hosts share one address | Layer 3 / 4 |
| Proxy ARP, ICMP, ping, traceroute | Address resolution on behalf of another host; the control-message protocol; and its basic reachability and path tools | Layer 3 |
| Forwarding, control plane, data plane | The act of moving packets; the logic that decides the paths; and the hardware or software that executes the decision | Layer 3 |
| First-hop redundancy | A mechanism giving hosts a resilient default gateway by sharing a virtual address between devices | Layer 3 |
| HSRP | Hot Standby Router Protocol: a vendor-native first-hop redundancy protocol using an active and a standby device | Layer 3 |
| VRRP | Virtual Router Redundancy Protocol: a standards-based first-hop redundancy protocol, implemented in this design by an open-source service | Layer 3 |
| Virtual IP address | A shared address that moves between redundancy group members and is used as the default gateway | Layer 3 |
| Preemption | A setting allowing a higher-priority device to reclaim the active role when it returns | Layer 3 |
| Track script or object | A health check whose failure lowers a device's priority so the redundancy role moves | Layer 3 |
| TCP | Transmission Control Protocol: a connection-oriented transport protocol with acknowledgement and retransmission | Layer 4 |
| UDP | User Datagram Protocol: a connectionless transport protocol with no delivery guarantee | Layer 4 |
| Port number | A numeric identifier selecting a service on a host | Layer 4 |
| Three-way handshake | The exchange that establishes a reliable transport connection | Layer 4 |
| Connection tracking | Remembering the state of established flows so that return traffic can be permitted without a broad rule | Layer 4 |
| Socket | The combination of an address and a port number identifying one endpoint of a flow | Layer 4 |
| Stateful inspection | Examining and remembering flow state rather than judging each packet in isolation | Layer 4 / firewall |
| Default deny | A policy in which everything is blocked unless explicitly permitted | Firewall |
| Access control list | An ordered set of permit and deny rules applied to traffic | Firewall / Layer 3 |
| Object group | A named set of addresses, networks or services referenced by rules to keep policy readable | Firewall |
| Security level | An interface trust ranking used by some firewalls to imply default direction of flow | Firewall |
| Zone | A group of interfaces or subnets sharing one trust level and one policy boundary | Firewall |
| DMZ | Demilitarised zone: a subnet hosting externally reachable services, kept separate from internal networks | Architecture |
| Egress filtering | Controlling and logging traffic leaving a network | Firewall |
| Log prefix | A text marker added to generated log lines so that a specific rule's action can be identified | Firewall |
| Rate limit and connection limit | Controls that cap how often or how many connections a source may establish | Firewall |
| VPN | Virtual private network: an encrypted tunnel carrying private traffic over an untrusted network | Layer 3 / security |
| Site-to-site tunnel | A tunnel between two gateways, joining two sites | VPN |
| Remote access | A tunnel from an individual client into a network | VPN |
| IKE and IKEv2 | Internet Key Exchange: the protocol that negotiates security associations for IPsec | VPN |
| IPsec | A suite of protocols authenticating and encrypting IP traffic | VPN |
| NAT traversal | Encapsulation allowing IPsec to pass through address translation | VPN |
| Split tunnelling | Sending only some traffic through a tunnel and the rest directly; here deliberately disabled | VPN |
| Preshared key | A shared secret used for authentication; forbidden for the certificate-based design here | VPN |
| Certificate-based authentication | Authenticating with a certificate whose private key the holder possesses | Security |
| TLS | Transport Layer Security: the protocol providing confidentiality and integrity for application traffic | Security |
| Public key infrastructure | The authorities, policies and processes that issue and manage certificates | Security |
| Certificate authority, root, issuing | The entity that signs certificates; the trust anchor; and the subordinate authority that issues end-entity certificates | Security |
| Certificate signing request | A request containing a public key and identity information, submitted for signing | Security |
| Certificate revocation list | A list of certificates the authority has revoked before expiry | Security |
| Subject alternative name | A certificate field listing the names the certificate is valid for | Security |
| Chain of trust, trust store | The path from an end-entity certificate to a trusted root; and where the trusted roots are kept | Security |
| Self-signed certificate | A certificate signed by its own key, trusted only if installed as an anchor | Security |
| HSTS | A response header instructing clients to use secure transport for a host in future | Security |
| Cipher suite | The combination of algorithms a transport-security session uses | Security |
| SSH, host key, key pair | Secure Shell; the server's identifying key; and the public and private key pair used for authentication | Security / Layer 7 |
| Least privilege | Granting only the access required for the task | Security |
| Authentication, authorisation, accounting | Proving identity; deciding what identity may do; and recording what was done | Security |
| Kerberos, ticket | The domain authentication protocol, and the time-limited credential it issues | Security |
| LDAP and LDAPS | The directory access protocol, and its encrypted form | Layer 7 / Security |
| RADIUS | A protocol for centralised authentication, authorisation and accounting for network access | Security |
| Multi-factor and certificate plus group policy | Requiring more than one independent condition before access is granted | Security |
| DNS | Domain Name System: the distributed naming system that maps names to addresses and services | Layer 7 |
| Forward and reverse zone | Zones holding name-to-address and address-to-name records | Layer 7 |
| Conditional forwarder | A resolver configuration sending queries for one name space to a specific server | Layer 7 |
| DHCP | The protocol by which hosts obtain addressing and options automatically | Layer 7 |
| Address pool, lease, exclusion, reservation | The dynamic range, the period of assignment, addresses withheld from the range, and a fixed assignment | Layer 7 |
| DHCP relay | A forwarder that carries addressing messages between a client subnet and a server elsewhere | Layer 7 |
| NTP | The protocol used to synchronise clocks; significant because authentication fails when clocks skew | Layer 7 |
| Syslog | The standard mechanism for sending log messages to a central collector | Layer 7 |
| SNMP and SNMPv3 | A device-monitoring protocol; and its version providing authentication and encryption | Layer 7 |
| SMB, DFS, NFS, FTP | File-sharing protocols and distributed file-system and transfer services | Layer 7 |
| iSCSI and LUN | Sending block-storage commands over IP; and a logical unit presented to an initiator | Storage |
| Initiator and target, CHAP | The client and server roles in block storage; and a challenge-handshake authentication method | Storage |
| Quota and file screen | A storage limit applied to a volume or folder; and a rule refusing files matching given patterns | Storage |
| HTTP, HTTPS, reverse proxy, upstream pool | The web protocol; its secured form; a server that fronts other servers; and the set of servers it forwards to | Layer 7 |
| Virtual host | Serving different content for different names from one listener | Layer 7 |
| Load balancing and health check | Distributing requests across servers; and testing whether a server should receive them | Layer 7 |
| Round-robin, fail timeout | A distribution method; and how long a failed upstream is held out of rotation | Layer 7 |
| Infrastructure as code | Managing configuration as version-controlled, reviewable, repeatable definitions rather than manual actions | Automation |
| Idempotence | The property that applying a definition repeatedly produces no further change | Automation |
| Inventory and group variables | The list of managed hosts and the values applied to groups of them | Automation |
| Playbook, role, template | An ordered automation definition; a reusable bundle of tasks; and a file rendered with host-specific values | Automation |
| Check mode and diff mode | Running automation without applying changes, and showing what would change | Automation |
| Version control, commit, branch, tag, merge | Recording changes with history; a single recorded change; an independent line of work; a named point in history; and joining lines of work | Automation |
| Continuous integration and delivery | Automatically building and validating changes, and keeping the result deployable; documented here as a concept rather than implemented as a pipeline | Automation |
| Secrets vault | Encrypted storage for credentials so that no plaintext secret enters version control | Automation |
| Virtual machine, hypervisor, guest, host | A software computer; the layer running it; the virtual machine it runs; and the physical machine underneath | Virtualisation |
| Host-only network, NAT network, bridged network | Hypervisor network modes: isolated to the host, translated to the outside, and attached to the physical link. Bridging is forbidden in this project | Virtualisation |
| Template, clone, snapshot, thin provisioning | A prepared image; a copy of it; a point-in-time state; and allocating disk space on demand | Virtualisation |
| Scenario terms: | | |
| Trust boundary | A line between two zones where policy is enforced and logged | Architecture |
| Zone code | The short identifier used for a zone in this design's policy tables | Architecture |
| Site code | The short identifier used for a location in this design | Architecture |
| Work package | A defined, owned and scheduled unit of project work | Project |
| Phase gate | A checkpoint whose exit criteria must be met with evidence before the next phase begins | Project |
| Critical path | The longest chain of dependent work packages, whose delay delays delivery | Project |
| Float | The amount a work package may slip without delaying delivery | Project |
| RACI | A responsibility assignment model naming who is responsible, accountable, consulted and informed | Project |
| Definition of done | The conditions an item must satisfy before it may be closed | Project |
| Severity and priority | The technical impact of a defect, and the order in which work is done | Project |
| Risk and issue | Something that might happen, and something that has happened | Project |
| Verification record | The signed record of what was tested, how, the expected and observed results, and the evidence | Project |
| Traceability matrix | The table mapping each objective to its design element, its tests and its evidence | Project |

### Appendix K — Weekly Progress Report Template

The report is published every Friday at the end of the documentation session, committed to the repository under the proposal directory, and sent to the supervisor. It is deliberately short and factual: its value is that it exists every week, not that it is long.

```text
=== WEEKLY PROGRESS REPORT ===
Week number:                 W{n}  ({start date} to {end date})
Report date:                 {YYYY-MM-DD}
Prepared by:                 Member {A|B|C|D}
Phase:                       P{n} — {phase name}
Gate status of the phase:    on track | at risk | slipped — {one-line reason}

--- 1. PLANNED FOR THIS WEEK ---
{List the planned items by line and work package, as agreed at the previous gate review}

--- 2. COMPLETED ---
| Item | Line | Owner | Evidence reference | Definition of done met? |
|---|---|---|---|---|
| {item} | L{1..5} / doc / mgmt | Member {X} | {EV-nnnn / VR-nnnn / run-log path / commit} | yes / no — {what is missing} |

--- 3. NOT COMPLETED AND WHY ---
| Item | Owner | Reason | Revised date | Effect on float |
|---|---|---|---|---|

--- 4. THIS WEEK'S GATE EVIDENCE ---
{The commands run and the evidence identifiers produced, for example dcdiag output, failover capture,
playbook run log, security denial log line. This section is what makes the report auditable.}

--- 5. TEST AND DEFECT STATUS ---
Test cases executed this week: {count}   Passed: {count}   Pass with declared limitation: {count}   Failed: {count}
Defects opened: {IDs}   Defects closed: {IDs}
Residual defects by severity:   Critical {n}   High {n}   Medium {n}   Low {n}

--- 6. RISK AND ISSUE CHANGES ---
Risks added or re-scored: {IDs and new scores, with the reason}
Risks realised / converted to issues: {IDs}
Contingencies exercised: {which, and the outcome}
Issues opened or closed: {IDs}

--- 7. CHANGE RECORDS ---
Raised: {CR-IDs}   Decided: {CR-IDs and outcome}   Open: {CR-IDs and awaiting what}

--- 8. CROSS-COVER AND REVIEW EVIDENCE ---
Deliverables peer-reviewed this week: {list, with reviewer}
Paired artefacts executed by the shadow member: {list}

--- 9. PLAN FOR NEXT WEEK ---
{Items by line, with owners and the gate criteria they are intended to satisfy}

--- 10. BLOCKERS AND REQUESTS ---
| Blocker | Affected work | Owner | What is needed | From whom | By when |
|---|---|---|---|---|---|

--- 11. HOURS AND LOAD (indicative, for fair-load monitoring only) ---
| Member | Hours this week | Owned items completed | Reviewing done | Notes |
|---|---|---|---|---|
| Member A | | | | |
| Member B | | | | |
| Member C | | | | |
| Member D | | | | |
```

### Appendix L — Risk Register Change Log Template

The risk register is a live instrument, so its changes are logged: a register with no history cannot demonstrate that the project monitored risk rather than writing a list once. The change log is maintained immediately beneath the register and is reviewed at every weekly gate.

```text
=== RISK REGISTER CHANGE LOG ===
| # | Date | Risk ID | Change type | Previous state | New state | Reason and evidence | Changed by |
|---|---|---|---|---|---|---|---|
| 1 | {YYYY-MM-DD} | PR-{nn} | {added | re-scored | mitigation added | contingency changed | realised | closed | reopened} | {e.g. likelihood 3, impact 3, High, Open} | {e.g. likelihood 4, impact 3, Critical, Open} | {what changed the assessment, with the observation that prompted it} | Member {A|B|C|D} |
```

| Field | Rule |
|---|---|
| Change type | One of: added, re-scored, mitigation added, contingency changed, owner changed, realised, closed, reopened. A re-score must state which of likelihood or impact moved and why |
| Previous and new state | Likelihood, impact, band and status, so that the movement is visible without reconstructing it |
| Reason and evidence | The observation, test, defect or external event that produced the change. "Re-assessed" alone is not acceptable |
| Realised | When a risk becomes an issue, the row records both the risk identifier and the issue identifier, and the risk is **retained** rather than deleted: the fact that it happened is information for the next project |
| Closed | A closed row states whether the risk passed, was mitigated to an acceptable residual, or was accepted with its consequence stated |
| Reviewer | Every change log entry is reviewed at the following weekly gate, and the review is recorded in the minutes |

**Two worked rows, shown as they would appear in the log.**

| # | Date | Risk ID | Change type | Previous state | New state | Reason and evidence | Changed by |
|---|---|---|---|---|---|---|---|
| 1 | 2026-10-23 | PR-06 | Mitigation added | Likelihood 4, impact 3, Critical, Open | Likelihood 3, impact 3, High, Open | The resource budget was reviewed at the week-6 checkpoint and the two-shift fallback was rehearsed once for real: the server-zone estate and the published-services estate were run in separate windows with all checks passing in both. Evidence EV-0031 and the checkpoint record in the week-6 gate | Member D |
| 2 | 2026-10-23 | PR-07 | Closed | Likelihood 3, impact 3, High, Mitigated | Likelihood 1, impact 2, Low, Closed | The feasibility spike closed inside its three-day timebox with a recorded decision, closing the corresponding open item. The residual uncertainty is carried forward by PR-01, which was re-scored to Critical at the same review. Evidence: the decision-log entry and the spike notes in the innovation-line directory | Member D |

The two rows illustrate the two properties the log exists to enforce: that a change in score is backed by an observation rather than by opinion, and that closing a risk does not mean pretending the underlying uncertainty has gone away — it moves to the risk that actually carries it.
