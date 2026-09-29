# Victor2 - Enterprise Network Infrastructure and Architect

## FYP Initial Report

## Front matter

| Field | Value |
|---|---|
| Programme | Higher Diploma in Telecommunications and Networking (HDTN) |
| Module | Final Year Project |
| Academic year | AY2026/27 |
| Project title (exact) | Victor2 - Enterprise Network Infrastructure and Architect |
| Host organisation (scenario) | Vertex Peak Financial Technologies Limited, trading as Vertex Peak |
| Duration and team | 12 weeks, 4 students |
| Reference standard | WorldSkills Occupational Standards 2026, *IT Network Systems Administration* (Skill 2447) |
| Deliverable | Initial report — the report that follows the proposal in the programme's normal sequence. **The proposal alone was the immediate submission tier (D5); this report is a separate artefact at a later point and does not replace it.** |
| Date of issue | [TO CONFIRM] |
| Structure and length band | **[TO CONFIRM] against the programme handbook.** The handbook's required structure and word band for an initial report have not been checked, and are deliberately not invented here. This draft follows the sequence the project's own decision draft records for this artefact: introduction and background; aims and objectives; literature and technology review; proposed methodology and design; implementation plan; risks; references. |
| Status | Draft for supervisor review. Every figure in it is traceable to a named section of the project's own decision draft or its condensed proposal; items that could not be confirmed are marked **[TO CONFIRM]** rather than estimated. |
| Decision and stage key | Decisions are keyed **D-01 to D-16** and blocking items **B1 to B3**, exactly as in the decision draft. AI-coverage stages are **Stage A, Stage B, Stage C and Stage D**, whose minimum acceptable stage is **Stage B**. Project gates are **G0 to G6**, including the scheduled hardware gate **G2-H**; they are distinct from the ten governance mechanisms, which are labelled **governance G1 to G10** wherever the two could be confused. |

**Group members and responsibilities.**

| Ref | Name | Student ID | Primary responsibility |
|---|---|---|---|
| S1 | [TO CONFIRM] | [TO CONFIRM] | Cisco and network |
| S2 | [TO CONFIRM] | [TO CONFIRM] | Identity and Windows |
| S3 | [TO CONFIRM] | [TO CONFIRM] | Linux and services |
| S4 | [TO CONFIRM] | [TO CONFIRM] | Automation, AI and documentation |

| Supervisor | [TO CONFIRM] |
|---|---|
| Second reader or moderator | [TO CONFIRM] |

[TOC]

## Executive summary

This report sets out a twelve-week, four-student Final Year Project that builds an enterprise network of three device families and then places an artificial-intelligence management plane upon it. The network is the foundation; the AI capability is the assessed differentiator. The report is written against the project's own decision draft, which is the decision-level authority, and against the condensed proposal that was the immediate submission tier; no fact in it is drawn from the superseded earlier generation of this project, which is retained for reference only and is not current.

The order of work is the governing rule, and it is a hard dependency rather than a preference. The Windows, Linux and Cisco estate is built and every required service in it is verified first. Only then is the AI management capability designed and built, against services that already exist and interfaces that have already been proved to answer. No management tool is written before the device it manages is reachable, authenticated and producing the telemetry that tool reads. Where that rule is broken, the tool is a claim rather than a capability.

The estate is one Windows Server domain of nine guests, ten Ubuntu Server guests on one hypervisor host, and a genuinely reachable Cisco layer whose target size is five devices exposing real SSH and real SNMPv3 unconditionally, with RESTCONF only where the image supports it. The earlier design placed the entire Cisco layer inside Cisco Packet Tracer. That is withdrawn, and the reason is technical rather than preferential: Packet Tracer devices expose no SSH server that external tooling can reach, no SNMP agent a real poller can query, and no NETCONF or RESTCONF endpoint, so nothing can manage them. Packet Tracer is retained as a design-time tool for topology and CCNA-level configuration, labelled as such wherever it appears, and named here as not reachable. One consequence is stated plainly rather than hidden: the exterior-routing provider is a Packet Tracer object, so the AI layer reads the local edge device only and can never verify that session from the peer side.

The AI layer is a locally hosted model plus the Model Context Protocol (MCP) as the single integration contract between the model and the estate. Five MCP servers own one domain each — Linux, Windows, Cisco, monitoring, and the documentation and inventory knowledge base — with every tool typed and classified as read-only or mutating. The model is served on school or laboratory hardware and is intended to be strictly offline, so that no prompt, log line or device configuration leaves the laboratory and no reported result depends on campus Internet access. The hardware specification and the model class are decided at a scheduled gate on measured evidence rather than on reputation, and that deferral does not block the network layer, which proceeds without any hardware answer at all.

Coverage of that layer grows incrementally as four stages, each with an entry gate and an exit gate: Stage A the Linux and Windows estate, Stage B the first genuinely reachable Cisco device, Stage C the five-device Cisco target set, and Stage D the optional peer-side exterior-routing verification. The minimum acceptable stage is Stage B, which is a floor and not the target; Stage C is the operational target and Stage D is a bonus that is not required within the twelve weeks. A stage is entered only when its entry gate is evidenced, never by declaring it entered.

The permission model is read-only by default, and a change requires a human-approved, fully specified proposal. The agent observes, correlates, explains, proposes and documents; when a change is warranted it stops and emits a proposal naming the target, the exact commands or configuration difference, the expected effect, the rollback plan, the blast radius and the supporting evidence. Only on approval is a single-use, host-scoped token issued and one approved action executed against one allow-listed host, with before-and-after verification appended to a tamper-evident audit log. The report is explicit that this is a management aid with a bounded, evidenced surface, and it does not describe the layer as autonomous.

Verification is designed before it is needed. Twelve fixed scenarios are each run three times; at least five faults are injected with ground truth known in advance and reverted after diagnosis; a permission-boundary suite is run in which the refusal tests matter as much as the success tests; a hallucination check counts fabricated answers and gates the write demonstration; and the drift tool is checked for false positives, with zero false positives on unchanged hosts as the bar.

Two reductions are stated in advance as results rather than as failures, and both are independent: a stage-based reduction that falls to two use cases if the project closes at Stage B, and a tier-based reduction that drops one use case if the hardware available cannot host a model reliably. The cut is made at a scheduled gate rather than at the end of the project.

One boundary is stated at the outset because the report is not permitted to blur it. The WorldSkills Occupational Standards 2026 contain no artificial-intelligence content whatsoever, and the 2026 edition removed Python, YANG, RESTCONF and NETCONF from the domains this project touches. The AI layer is therefore positioned as innovation *justified by* the standard's requirements to maintain currency, research thoroughly and embrace change, and deliberately *beyond* it. It is not claimed as standards compliance, and no screen-capture requirement is attributed to the standard, because that requirement belongs to the project brief.

One item blocks work from starting now, and it is a human decision rather than a technical unknown. The Cisco platform on which the management layer will operate must be ratified, with a recorded approval, because there is no defensible way to begin designing that layer against a platform whose management interfaces are not yet known to exist. The recommendation is Cisco Modelling Labs running the smallest viable topology, with a hybrid of Packet Tracer used strictly for design plus two to four genuinely reachable devices as the fallback, and the simulator-only case carries the scope reduction that is stated with it. Everything else that was once described as blocking has been converted into a scheduled gate: the laboratory hardware specification, the graphics-processor tier and the model class are deferred to a dated gate with a named owner and are not refused, and the network layer, the service verification, the tooling and the evaluation harness all proceed in the meantime without any hardware answer at all.
