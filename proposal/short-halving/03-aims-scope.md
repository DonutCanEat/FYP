## 3. Aim and objectives

### 3.1 Aim

To design, build, verify and document a multi-vendor enterprise network of Windows, Linux and Cisco devices, then design, build and measure a locally hosted, MCP-based artificial intelligence management plane observing that network across all three families, explaining what it finds, and proposing changes for approval under a read-only-by-default permission model.

### 3.2 Objectives

All twelve are evidenced from an artefact: 1 at G0; 3, 4 and 5 at G2; 7 at G1; 8 and 9 at G3; 10 at G4; 11 at G4 and G5; 12 at G5 and submission; 2 and 6 by transcript and captioned capture. Six of the twelve are verified by a gate rather than by inspection alone, because only a gate prevents a slipped dependency from surfacing in week 11.

1. **Platform.** Select, license and install the virtualisation platform, and instantiate the Windows and Ubuntu templates and host-only networks, with hypervisor DHCP disabled. (week 1)
2. **Identity and time.** Stand up one directory forest with two replicating domain controllers, integrated DNS, DHCP relayed on every gateway, an NTP hierarchy and an internal certification authority. (week 3)
3. **Published service.** Publish a TLS-terminated web service behind an Nginx reverse-proxy pair with Keepalived failover, capturing the virtual-IP move and failover time. (week 6)
4. **Segmentation and perimeter.** Implement stateful filtering with logging at the egress chokepoint, and an ASA-class perimeter with access control lists, translation and a denied-flow capture. (week 6)
5. **Routing, switching and telemetry.** Configure VLANs, trunks and Rapid Spanning Tree Protocol, single-area OSPF across headquarters and a branch, EIGRP with one tagged redistribution point, exterior BGP to a simulated provider and first-hop redundancy; operate metrics, exporters, SNMPv3 polling of every reachable Cisco device, centralised syslog and a configuration archive. (week 8)
6. **Automation foundations.** Run an Ansible control node reaching all three families, and three idempotent PowerShell and three Bash scripts in a reviewed Git repository with a second run reporting no drift. (week 8)
7. **Reachability.** Prove on one Cisco device SSH login from the management host and an encrypted SNMPv3 walk, capture the version banner, and file a transcript for every row of the reachability table. (week 3)
8. **Local model.** Serve a quantised, tool-calling model offline on identified hardware, record its identifier and version from the running system, and measure its tool calling with a fixed probe set. (week 8)
9. **MCP tool plane.** Implement five MCP servers exposing a typed tool surface, every tool classified read-only or mutating, every server under its own minimum-rights service identity, and no tool written against a device not evidenced as reachable. (week 8)
10. **Governance.** Implement and demonstrate the read-only default, the six-field change proposal, the single-use approval token, host-scoped and command-scoped allow-lists and an audit log, and pass the permission-boundary suite. (week 10)
11. **Use cases and evaluation.** Demonstrate the committed use cases end to end against the live estate, using at least two device families in triage; then execute the evaluation set: twelve scenarios run three times each, five injected faults and the hallucination, drift false-positive and audit-log coverage checks. (week 10, week 11)
12. **Documentation.** Produce the documentation set of section 12 by week 11, every figure captioned and every unconfirmed item marked for resolution. (submission)

### 3.3 The completion conditions, and the two stated reductions

Complete when the following are true and reproducible from a clean start; the reductions below are written against them.

**C1.** Three device families run: Windows Server guests, Linux guests, and Cisco devices exposing SSH and SNMPv3 unconditionally, plus RESTCONF only where the image supports it.

**C2.** Routing works with at least two interior protocols and one exterior protocol, and a link-failure convergence is captured.

**C3.** Every required service of section 6 is verified by a transcript and a captioned capture.

**C4.** A local model is served on identified hardware, offline, and its **tool-calling** behaviour is demonstrated and measured.

**C5.** Five or more MCP servers expose a documented, typed tool surface, with a read-only or mutating classification for every tool.

**C6.** The agent completes the committed use cases of section 7.5 against the live estate. **The committed set (D-06) is UC-1, UC-3, UC-4 and UC-6.** Two independent reductions apply, each a stated result rather than a failure. **Stage-based:** where the project closes at **Stage B**, the minimum acceptable stage of section 7.2, C6 is met by **UC-3 and UC-6**, which are Stage A's exit gate. **Tier-based:** UC-4 is a completion condition only where the measured tier and malformed-call rate support an approval-gated change tool; where they do not, C6 is met by **UC-1, UC-3, UC-5 and UC-6**. The stage decides how far the coverage ramp got; the tier decides which tools the model can be trusted with.

**C7.** The evaluation set of section 7.6 is executed: scripted scenarios, injected faults with known ground truth, and a hallucination check.

**C8.** The documentation set of section 12 exists.

## 4. Scope

### 4.1 In scope

Within twelve weeks the project delivers a virtualised estate of nine Windows Server and ten Ubuntu Server guests on one hypervisor host; a reachable Cisco layer of five devices - one headquarters core pair, one wide-area edge router, one branch router and one ASA-class perimeter firewall - up to eight only if each is evidenced as reachable, exposing SSH and SNMPv3 unconditionally and RESTCONF only where the image supports it; the Layer 1 services of section 6, each classified required, desirable or optional with a named host; segmentation and a zone and trust-boundary model; a monitoring and logging plane; automation foundations of Ansible, PowerShell, Bash and Git with a review workflow; an AI management plane of a locally served model, five MCP servers, an agent with a policy engine and approval gate, and an audit log; the evaluation set; and the documentation set of section 12. Per-family interfaces, the reachability rule and its table, and the in-scope extent of the AI layer are in sections 5, 5.4 and 7.

### 4.2 Out of scope

No production deployment, customer data, public IP addresses or registered domain; public addressing uses the reserved documentation ranges.

**No claim that any Cisco Packet Tracer device is managed, polled, configured or tested by the AI layer**; the boundary is section 4.5.

No autonomous remediation - every change is human-approved and logged - no model fine-tuning, no trained anomaly-detection model, no digital twin, and no reinforcement learning from the estate.

No security certification, penetration-test or compliance-attestation claim. No commercial licences, and no third-party or mirrored software images. No voice-over-IP telephony, content-management or container-orchestration platform as a built artefact; these may be documented as future work only.

### 4.3 Constraints

1. **C-01** Twelve weeks, four students (brief). Every service is classified required, desirable or optional, and new technology is frozen after week 9.
2. **C-02** Model compute comes from school or laboratory machines (student). The model host's identity and specification (**B1**) and the graphics-processor tier (**D-04**) are **deferred, not refused**: both are selected at gate **G2-H, end of week 6**. A no-graphics-processor fallback is designed, not improvised.
3. **C-03** The AI layer is locally served and strictly offline for every reported result (student). No result may depend on a hosted inference service; a hosted endpoint is a documented contingency only, never for a graded measurement.
4. **C-04** The permission model is read-only by default, changes only after human approval (student). Mutating tools are gated by a single-use, host-scoped approval token, and the refusal path is tested.
5. **C-05** Packet Tracer devices cannot be managed by automation or by AI (platform fact). The Cisco layer must be genuinely reachable for the AI claim to hold; Packet Tracer is confined to design-time use.
6. **C-06** Documentation is a graded deliverable (brief), and therefore a weekly activity from week 1, not week-12 tidying.
7. **C-07** No invented URL, version number or standards clause may appear in any deliverable (integrity rule): every version is captured from the running system, every external claim is cited from a source actually read, and anything unconfirmed is marked for resolution.
8. **C-08** Windows server licensing (vendor terms): evaluation or campus media only, with any substitution recorded if the pinned media are unavailable.

### 4.4 Assumptions

1. School or laboratory machines are available for the model, the Cisco platform host and the estate host, three roles that may share hardware only where memory permits.
2. The laboratory permits installing a model-serving runtime and can supply model weights through an allowed channel; if not, the documented contingency applies.
3. A lawful entitlement to a virtualised Cisco platform can be obtained; if not, the hybrid fallback applies, and if that also fails the scope reduction in section 5.6 is taken.
4. The virtualisation platform can create per-zone host-only networks with DHCP disabled on each, and run nineteen guests with thin provisioning and snapshots.
5. Active Directory Domain Services is the single identity authority for the Windows estate, and the model selected after measurement can emit schema-valid tool calls - tested in weeks 5 and 6, not assumed.

### 4.5 The scope boundary that matters most

The project's credibility rests on one boundary. **No MCP tool, AI agent, playbook or script may claim to reach, read from or configure a Cisco Packet Tracer device.** It offers no SSH server, no SNMP agent a real poller can query, no NETCONF or RESTCONF endpoint and no management API: **Packet Tracer devices are not reachable**, and any sentence, table row, diagram arrow, tool description or test case implying otherwise is a fabrication that will be deleted. The governing rule: *an interface exists only if a command run from the management host returned data from that specific device, and the transcript is filed as evidence.* Anything else is a design intention, labelled as one. With the Cisco layer inside Packet Tracer, one of the three families would be unmanageable, so the project's claim holds for only two.
