## 6. Implementation plan

This chapter states how the project is sequenced, who owns each part of it, what is submitted at each tier, and what evidence is required before a claim may be made. Its organising principle is that a schedule is credible only if its entry conditions can be checked and its evidence standard is frozen.

### 6.1 The gated sequence

The plan is a sequence of seven gates. A gate is not a date; it is a condition that is either evidenced or not evidenced on that date.

| Gate | Week | Condition to pass | What it proves |
|---|---|---|---|
| Gate G0 — direction locked | 1 | Decisions D-01, D-02, D-03, D-05, D-09, D-11, D-12, D-14 and D-16 answered and signed off; the outline signed off. Decision D-04 is deliberately absent from this list, because it is the deferred hardware row answered at gate G2-H in week 6; D-03 is the role the laboratory machine plays, which is a design rule decidable now | The direction is locked. Nothing else in the plan starts until it is |
| Gate G1 — one Cisco device genuinely reachable | 3 | An SSH login succeeds from the management host; an SNMPv3 authenticated and encrypted walk returns data; the version banner is captured. Those two interfaces are the unconditional guarantee, and RESTCONF is conditional on the image at this gate | The platform works on real, reachable equipment rather than on a design assumption. If it fails, the project falls through the platform options immediately and does not spend week 4 hoping |
| Gate G2 — required core is up | 6 | Every required service verified by a command transcript and a captioned capture | That the network is built, in the only sense the project accepts: the required-only service checklist has been worked through and each line of it carries evidence |
| Gate G2-H — hardware and model tier decided | 6 | The deferred hardware gate, at which B1, B3 and D-04 close: both laboratory hosts — the model host and the CML host — have their specification captured and written into the decision log, covering graphics-processor model and exact memory, system memory, free disk, processor and cores, operating system and version, whether the machine is shared, bookable or dedicated, what the laboratory permits installing, and the outbound-access rules; and the model tier is selected from that record | The model class is chosen on measured hardware rather than on reputation. If no answer has arrived by week 6, the AI line is planned against the no-graphics-processor fallback, that fallback is stated, and the probe set chooses the model |
| Gate G3 — AI feasibility closed | 8 | A locally served model calls a toy tool reliably; the malformed-call rate is measured; the use-case commitment is confirmed or reduced. Stage B closes here at the earliest, meaning one genuinely reachable Cisco device managed end to end by the AI layer | The model is suitable before the use cases are made to depend on it, and the model class chosen at gate G2-H is confirmed here by the same measurement |
| Gate G4 — use cases demonstrated | 10 | The committed use cases run end to end on the live estate where the project reached Stage C. Where it closed at Stage B, the minimum acceptable stage, the stage-based reduction applies and the gate is met by UC-3 and UC-6 | The AI management layer works against real devices and real telemetry. If the committed set cannot be delivered, the project drops to the read-only use cases and says so |
| Gate G5 — evidence complete | 11 | Evaluation set executed; drift baseline frozen; every capture captioned; every document at target size | The evidence standard has been met rather than promised, and the documentation is finished before week 12 rather than during it |
| Gate G6 — submission | 12 | Report and companion summary assembled; consistency sweep clean; demonstration rehearsed | Delivery, as one assembled artefact rather than a collection of drafted chapters |

Two rules govern the sequence. The first is that a stage is entered only when its entry gate is evidenced, and left only when its exit gate is evidenced; a stage is never entered by declaring it entered. The AI-coverage ramp from Stage A to Stage D runs on that rule, build and coverage are separate axes, coverage cannot begin before week 7, and stages may overlap in time but may not be reordered.

The second rule is the hard dependency between the two halves of the project: the network and its services are built and verified first, and the AI management layer is built second. No Model Context Protocol (MCP) server may be written before the host or device it manages is reachable, authenticated and producing the telemetry its tools read, which is why the Cisco MCP server cannot start until gate G1 passes.

Three freeze points close the scope: no new technology after week 9, no change to the committed use-case list after gate G4, and no change to the evidence standard at any point.

### 6.2 The twelve-week plan and the hard dependency

The week-by-week position is given below as a table, in place of the wide monospaced chart the planning corpus also carries, and a graphical schedule is maintained separately as a figure. The table is the authority on what each week is for.

| Week | The work | The gate it serves |
|---|---|---|
| 1 | Evaluate the Cisco platform options and choose and install the virtualisation platform; name both hosts; build the Windows and Ubuntu base templates and the per-zone host-only networks; stand up the Git repository, the evidence folder tree and the caption template; begin the hardware-agnostic work, which is the MCP server skeletons and the evaluation harness | Gate G0 |
| 1–3 | Review the Cisco and platform text, the identity and Windows text, and the Linux and services text for accuracy; write the proposal from the decision material rather than by pruning the outline | The immediate submission, which has no blocking gate of its own |
| 2 | Bring up the first Cisco device and design virtual local area networks and trunks; bring the directory forest, DNS and DHCP live; baseline hardening; install the Ansible control node and create the inventory | No gate; templates complete |
| 3 | Make SSH and SNMPv3 work on one device and capture the version banner; replicate two domain controllers and build the organisational-unit tree; bring the highly available proxy pair live with a failover capture; run the first read-only collection script against the Linux estate | Gate G1 |
| 4 | Rapid Spanning Tree Protocol and inter-site interior routing; file server with quotas and screening; the packet-filter chokepoint with logging; metrics, exporters and the central syslog receiver | No gate; routing between the families works |
| 5 | The perimeter firewall with access control and translation; block storage target and initiator attached; remote access built; the local-model spike begins, installing the serving runtime and testing candidate models for tool calling | No gate; the perimeter is verified |
| 6 | Gateway redundancy on the layer-three gateways; certification authority issuing to clients and the web tier; a published service through the proxy; capture both laboratory machines' specifications and select the model tier, closing B1, B3 and D-04; the local-model spike closes and the use-case commitment is confirmed | Gate G2 and gate G2-H |
| 7 | A second interior routing protocol with one controlled redistribution point; event-log and audit policy baseline; configuration archive under version control; the Linux MCP server and the documentation server, with the tool surface frozen at the end of the week | No gate; the tool contract is frozen |
| 8 | Exterior routing to the simulated provider; Windows remote management over HTTPS and the read-only service identity; dashboards and alerts tuned; the Windows, monitoring and Cisco MCP servers, the policy engine and the audit log | Gate G3 |
| 9 | Flow export or a documented alternative; drift baselines for the Windows and Linux components; UC-1 and UC-3 implemented, with the fault-injection harness built | No gate; the agent answers estate questions |
| 10 | Drift baseline for the Cisco components and the configuration archive completed; verification records for the Windows and Linux services; UC-4 and, as time allows, UC-2 and UC-5; evaluation scenarios written | Gate G4 |
| 11 | Full verification sweep of the Cisco, Windows and Linux services; the evaluation set executed, metrics collected, and the hallucination and injection checks run | Gate G5 |
| 12 | Documentation closure; report assembly, consistency sweep, companion summary and rehearsal | Gate G6 |

One parallel track must not be read as idle time. The network and services layer, the five MCP servers and their tests, the agent scaffolding with its approval gate and audit log, the evaluation harness and the probe set are independent of the graphics-processor specification and are worked on from week 1. Only the model class and the serving configuration wait, until gate G2-H at the end of week 6. The failure mode it guards against is a team that treats a deferred hardware answer as permission to idle.

### 6.3 Work split and ownership

The work is split across four workstreams, each with a single accountable owner and a named reviewer: S2 reviews S1, S3 reviews S2, S4 reviews S3 and S1 reviews S4. Names are not recorded, because the corpus records owners by workstream reference only.

| Workstream | Owns | Accountable for |
|---|---|---|
| S1 — Cisco and network | The reachable Cisco platform, layer-two and layer-three design and configuration, routing protocols, the perimeter, flow export if used, and the Cisco drift baseline | Every Cisco deliverable and its evidence, and the Cisco tool allow-list |
| S2 — identity and Windows | Directory services, DNS, DHCP, time, certification authority, quotas and screening, block storage, the Windows remote-access choice, the Windows drift baseline, and the read-only service identity | Every Windows deliverable and its evidence, and the Windows tool surface |
| S3 — Linux and services | The Linux estate, the highly available proxy pair, the packet-filter chokepoint, the Linux tunnel, monitoring and syslog collection, and the Linux drift baseline | Every Linux deliverable and its evidence, and the Linux and monitoring tool surfaces |
| S4 — automation, AI and documentation | Ansible, the PowerShell and Bash libraries, the Git workflow, the local model, all five MCP servers, the agent, the guardrails, the evaluation set, and the documentation integrator role | The AI layer end to end, the assembled report, and the evidence standard |

The responsibility matrix is summarised rather than reproduced in full. S1 is accountable for the platform and hypervisor decision, the Cisco platform selection and licence, and the Cisco layer-two and layer-three work. S2 is accountable for the host templates and host-only networks, the identity stack, and file, storage and remote access. S3 is accountable for the highly available proxy pair, the packet-filter chokepoint, and monitoring and syslog. S4 is accountable for Ansible, Git and scripting, the local model, the specification and tier at gate G2-H, the five MCP servers, the agent and guardrails, the evaluation, the documentation set, the evidence standard, and supervisor liaison.

Cross-cover is required rather than optional: a four-person team accepts no single point of failure. Each workstream has a first and a second cover who must act unaided. S4 and S3 can log in to a Cisco device, restore a configuration and run any allow-listed `show` command; S4 and S1 can rebuild a Linux guest, re-apply the packet-filter rules and verify the virtual-address failover; and S1 and S2 can start the model server, start the MCP bundle, run one evaluation scenario and read the audit log. The mechanism is a runbook: every owner writes one by week 8, and every other member executes it once in week 10, which is itself a deliverable. Team-member names and student identifiers are `[TO CONFIRM]` against the programme's records.

### 6.4 Deliverables at each tier

Two submission tiers exist, and only the first is current work.

The immediate tier is the proposal alone. One artefact is submitted now: the condensed proposal, which locks the direction, records the decisions requiring confirmation, states the reachability position, and specifies the AI management plane, its governance and its evaluation. Nothing else is submitted at this stage. Its size band is 15 to 25 pages; the programme's own word band for the proposal is `[TO CONFIRM]` against the programme handbook, and the corpus does not invent one. An initial report follows the proposal in the programme's normal sequence, and its structure is likewise `[TO CONFIRM]`.

The later tier is the full submission, assembled from the component deliverables below. It is a focus-corrected full proposal and report of 90,000 to 110,000 words, hard-capped at 120,000, within which the AI line grows to approximately 18,000 words. These figures are recommendations for the later tier, for the supervisor to confirm.

| Ref | Deliverable | Indicative size |
|---|---|---|
| D6 | The design document: architecture, addressing, topology and decisions | 40–60 pages |
| D7 | The build manuals: Windows, Linux, Cisco and the AI plane, step by step | 60–90 pages total |
| D8 | The test plan and verification records: every service and every trust-boundary rule, with results | 30–50 pages |
| D9 | The evidence pack: captioned screen captures, command transcripts, capture files and configurations | Approximately 150–300 figures |
| D10 | The reference list: every cited standard, specification and vendor document, with access dates | 4–8 pages |
| D11 | The presentation and demonstration script | Slides plus a twelve-minute script |
| D12 | The Chinese companion summary | 1,200–2,000 characters |

Three further later-tier deliverables sit alongside the table: the built environment, meaning the three-family network reproducible from documented steps, with runbooks and no page target; the network services, covered by the build manuals; and the AI management plane, at 20 to 35 pages, with the evaluation at 15 to 25 pages.

The topic sheet requires six documentation classes, each a separate and traceable deliverable: findings, a register of what was discovered during the build, including the surprises and the corrections; manuals, the step-by-step build manuals for the Windows, Linux, Cisco and AI subsystems; steps, the recorded procedure for each verification; screen captures, the captioned evidence pack; verifications, the test plan and its records; and references, the citation list.

### 6.5 The evidence standard

The evidence standard is fixed now, before any captures exist, and it is frozen at that point. It is expressed as nine rules.

| Rule | Requirement |
|---|---|
| E1 | Every figure is captioned in the form `Figure {n}: {what} — {host} — {command or action} — {date}`. An uncaptioned screenshot is treated as absent |
| E2 | Every claim that something works is backed by two things: a command transcript in text and a captioned screenshot in image. Text alone is weakly evidenced and an image alone cannot be searched |
| E3 | Filenames are mechanical, of the form `{date}_{host}_{what}.png`, for example `2026-10-06_vpnz-dc01_dcdiag.png`. Never `screenshot1.png` |
| E4 | Captures are dated and versioned: the capture shows enough context to prove which build produced it, whether a version banner, a prompt carrying the hostname, or a visible date |
| E5 | Verification records are reproducible: every record names the exact command and the exact expected result |
| E6 | Records are honest about failure: a test that failed or was not run says so, and a fault injected and then reverted is documented with both the injection and the revert |
| E7 | AI-generated text is labelled: if any prose was drafted with a model, the methodology chapter says so, and no technical result may rest on generated text, because results come from transcripts and captures |
| E8 | No invented version, URL or licence statement: every version string is captured from the running system, every URL is copied from a browser and archived, and anything unconfirmed is marked `[TO CONFIRM]` in the draft and resolved before submission |
| E9 | Reachability is evidenced rather than asserted: for every reachable row of the reachability matrix there is a transcript showing that interface returning data from that device, and a reachability claim with no transcript is listed in the report as unverified |

The caption and filename templates are reproduced below as this report applies them.

`Figure {n}: {what} — {host} — {command or action} — {date}`

`{date}_{host}_{what}.png`

Three consequences follow. First, the standard is frozen while there are zero captures, because a standard rewritten once a capture is inconvenient is not a standard. Second, an uncaptioned screenshot is treated as absent. Third, a reachability claim with no transcript behind it is listed in the report as unverified.

One further boundary follows from the position this report takes on design-time simulation tools. Equipment that exists only inside a design-time simulator cannot produce a transcript, because it exposes no management interface a real tool can query, so rows describing it cannot satisfy rule E9. The permission policy that governs the AI layer is set out elsewhere in this report; the plan here assumes only that any mutating action carries human approval and a single-use, host-scoped token.

### 6.6 Immediate next steps and the one current blocker

The immediate backlog is ordered, and one item in it blocks work from starting now.

1. Ratify the Cisco platform: take the primary recommendation — Cisco Modelling Labs, running the smallest viable topology — and the fallback, a hybrid of Packet Tracer used strictly for design plus two to four genuinely reachable devices, to the supervisor with the simulator-only case and its scope reduction, and have the decision recorded.
2. Check the platform licence, image entitlement and topology memory cost the same day, at the vendor's own pages rather than from memory or a forum, recording the tier, the images included and the terms relied on. If the check fails, the fallback is taken immediately rather than at week 6.
3. Confirm what the school's rules permit. A licensed platform, personal physical equipment and a hosted sandbox are three permissions that may be granted differently, and discovering a prohibition in week 6 costs the AI demonstration.
4. Start the hardware-agnostic work in week 1 and do not idle on the deferred hardware answer: the five MCP servers and their tests, the agent scaffolding with the approval gate and audit log, the evaluation harness, the probe set of approximately twenty tool-calling probes, and the evidence scaffolding are independent of the graphics-processor specification, and the probe set that chooses the model at gate G2-H is built in weeks 1 to 6.
5. Record the laboratory machines' specification at gate G2-H, at the end of week 6, as one page in the decision log, for both hosts, closing B1, B3 and D-04 there.
6. Stand up the repository and the evidence scaffolding in parallel: the folder tree, the Git repository, the figure-caption template and the filename convention.
7. Confirm the remaining decisions — D-05 the depth split, D-06 the committed use cases, D-13 whether model access is offline or hybrid, D-14 the hypervisor platform, D-15 the remote-access choice and D-16 the Cisco device count — and print the work split and the responsibility matrix before week 2 begins. D-14 is required at gate G0, so it cannot be deferred past week 1.
8. Prove one Cisco device reachable as the week-3 gate, on a single device, before designing the topology: a working SSH login, one authenticated walk and the version banner captured.
9. Write the permission policy into the proposal verbatim, and build the refusal test alongside the first mutating tool rather than after it.
10. Book the local-model measurement window now, with its input tied to the gate G2-H hardware record and its outputs stated as a decision, a measured malformed-tool-call rate and a named model.
11. Start the reachability table on day one and file a transcript for every row as it is obtained, because a row that cannot be evidenced is a row the AI layer cannot use.
12. Write the required-only service list as a one-page checklist, the contract for what the network being built means and the document against which gate G2 is judged.
13. Write the proposal, which is the immediate submission, from the decision material rather than by pruning the outline.
14. Remove every design-time-simulator automation claim inherited from the earlier corpus before new writing begins, because a reader who finds one contradiction will doubt the whole document.

The single current blocker is item 1, the ratification of the Cisco platform, tracked as B2, owned by S1 and due by the end of week 1. It is a human decision, not a task the team can complete by working harder, and it requires a recorded approval: the recommendation, the fallback and the simulator-only case taken to the supervisor as a decision to be minuted.

The team does not wait for it. The hardware-agnostic work of item 4 proceeds from week 1 and needs neither the platform decision nor the graphics-processor specification, and the network and services layer depends on neither. Items 2 and 3 are pursued in the same meeting rather than after it, so that a licence or permission failure is discovered in week 1 rather than in week 6. That is the honest position: one human approval blocks the Cisco path, and everything else is already running or waiting on a named gate rather than on an intention.
