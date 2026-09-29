## 8. Implementation plan

### 8.1 The gated sequence

The project is held to seven gates, **G0** to **G6**, plus the deferred hardware gate **G2-H**.

| Gate | Week | Condition to pass | If it fails |
|---|---|---|---|
| G0 - Direction locked | 1 | **D-01, D-02, D-03, D-05, D-09, D-11, D-12, D-14 and D-16** answered and signed off: the Cisco platform and device count, the hypervisor platform, the model host's role, the depth split, the evidence standard, the Packet Tracer role, the licence and image entitlement, the language split and the reachability baseline. **D-04 is deliberately NOT in this list** - it is the deferred hardware row, answered at **G2-H (week 6)** | Nothing else starts |
| G1 - One Cisco device genuinely reachable | 3 | An SSH login succeeds from the management host, an SNMPv3 authenticated and encrypted walk returns data, and the version banner is captured. These two interfaces are the unconditional guarantee; RESTCONF is conditional on the image at this gate | Fall through the platform options immediately; do not spend week 4 hoping |
| G2 - Required core is up | 6 | Every required service verified with a transcript and a captioned capture | Cut the desirable items |
| **G2-H - Hardware and model tier decided** | **6** | **The deferred hardware gate: B1, B3 and D-04 close here.** The lab machines' specification is captured in the decision log - graphics-processor model, exact memory, system memory, disk, processor and cores, operating system and version, shared or bookable or dedicated, what the lab permits installing, and outbound-access rules - **for both the model host and the Cisco platform host**; and the model tier is selected from that record. If the answer has not arrived by week 6, plan the AI line against the no-graphics-processor fallback and let the probe set choose the model; do not idle and do not select a model on reputation | The hardware answer is expected on the student's return to Hong Kong. **Never let weeks 7-8 idle waiting for a machine** |
| G3 - AI feasibility closed | 8 | A locally served model calls a toy tool reliably, the malformed-call rate is measured, and the use-case commitment is confirmed or reduced. **The model class chosen at G2-H is confirmed here by the same measurement.** **Stage B closes here at the earliest** - one genuinely reachable Cisco device managed end to end by the AI layer | Reduce the committed use cases; never proceed on an unmeasured model |
| G4 - Use cases demonstrated | 10 | The committed use cases run end to end on the live estate - **where the project has reached Stage C**; otherwise the stage-based reduction applies, and **G4 is met by UC-3 and UC-6** under the minimum acceptable stage | Drop to the read-only use cases and say so |
| G5 - Evidence complete | 11 | Evaluation set executed, drift baseline frozen, every capture captioned, every document at target size | Documentation spills into week 12 and the report becomes thin |
| G6 - Submission | 12 | Report and companion summary assembled, consistency sweep clean, demonstration rehearsed | - |

### 8.2 Weekly plan and the hard dependency

One dependency must never be reordered: the Cisco MCP server starts only after gate G1 passes. A Cisco platform decision slipping past week 4 costs the AI layer one of its three families, so that decision is taken in week 1.

The deferred hardware decision does not stall the AI line: everything except the model class and the serving configuration is independent of the graphics-processor specification, proceeds from week 1, and waits only on **G2-H**. **The immediate submission is this proposal alone**, placed after **G0** and before **G1**, **G2** and **G2-H**.

- Week 1: the Cisco platform options, the virtualisation platform and both host names; the Windows and Ubuntu base templates with media, licence and the per-zone host-only networks; the Git repository, evidence folder tree, caption template, MCP server skeletons and evaluation harness. **G0**.

- Weeks 1-3 also carry **the immediate submission, this document**: the Cisco, platform and ramp text reviewed for accuracy, the identity and Windows text reviewed and the licence and media facts confirmed, and the Linux and services text and the availability rule reviewed. The proposal is written by S4 from the decision material, not by pruning the outline. It has no blocking gate of its own: **G0** has locked the direction it reports.

- Week 2: the first Cisco device, virtual LANs and trunks; the directory forest with DNS and DHCP; hardening baselines and the proxy tier design; the Ansible control node and inventory.

- Week 3: **SSH and SNMPv3 working on one device, with the version banner captured**; two replicating domain controllers, organisational units and groups; the highly available proxy pair live with failover captured; the first read-only collection script against Linux. **G1**.

- Week 4: Rapid Spanning Tree Protocol and inter-site interior routing; the file server with quotas and screening; the packet-filter chokepoint with logging; metrics, exporters and the central syslog receiver.

- Week 5: the ASA-class perimeter with access control and translation; block storage attached; remote access built; the local-model spike begins with the serving runtime installed and candidate models tested for tool calling.

- Week 6: gateway redundancy on the layer-three gateways; the certification authority; a published service through the proxy; and at **G2-H** the lab machines' specification captured for both hosts, the model tier selected, **B1**, **B3** and **D-04** closed, the spike closed and the use-case commitment confirmed. **G2**.

- Week 7: a second interior protocol with one controlled redistribution point; the event-log and audit policy baseline; the configuration archive under version control; the Linux MCP server and the documentation server, with the tool surface frozen.

- Week 8: exterior routing to the simulated provider; WinRM over HTTPS and the read-only service identity; dashboards and alerts tuned; the Windows, monitoring and Cisco MCP servers, the policy engine and the audit log. **G3**.

- Week 9: flow export or a documented alternative; the Windows and Linux drift baselines; **UC-1 and UC-3 implemented**; the fault-injection harness built. The agent answers estate questions.

- Week 10: the Cisco drift baseline and the archive; verification records for the Windows and Linux services; **UC-4 and, as time allows, UC-2 and UC-5**; the evaluation scenarios written. **G4**.

- Week 11: the full verification sweep of the Cisco services and of each other layer; the evaluation set executed, metrics collected, hallucination and injection checks run. **G5**.

- Week 12: documentation closure; report assembly, the consistency sweep, the companion summary and the rehearsal. **G6**.

### 8.3 Four-person work split

**S1 - Cisco and network** owns the reachable Cisco platform, layer-two and layer-three design and configuration, routing protocols, the perimeter, flow export if used, and the Cisco drift baseline, and is accountable for every Cisco deliverable and its evidence, and the Cisco tool allow-list. **S2 - Identity and Windows** owns directory services, DNS, DHCP, time, certification authority, quotas and screening, block storage, the Windows remote-access choice, the Windows drift baseline and the read-only service identity, and is accountable for every Windows deliverable and its evidence, and the Windows tool surface. **S3 - Linux and services** owns the Linux estate, the highly available proxy pair, the packet-filter chokepoint, the Linux tunnel, monitoring and syslog collection, and the Linux drift baseline, and is accountable for every Linux deliverable and its evidence, and the Linux and monitoring tool surfaces. **S4 - Automation, AI and documentation** owns Ansible, the PowerShell and Bash libraries, the Git workflow, the local model, all five MCP servers, the agent, the guardrails, the evaluation set, and the documentation integrator role, and is accountable for the AI layer end to end, the assembled report, and the evidence standard.

Cross-cover is required, not optional, so that no workstream has a single point of failure: every owner writes a runbook for their layer by week 8, and every other member executes it once in week 10 as a verification exercise. The exercise record is itself a deliverable, and the cheapest way to satisfy the standard's teamwork lines with evidence.

**Freeze points.** No new technology after week 9; no change to the use-case list after gate G4; no change to the evidence standard at any point.
