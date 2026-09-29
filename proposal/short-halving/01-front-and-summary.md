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
| Date of issue | [TO CONFIRM] |
| Status | Condensed proposal for supervisor review. **This proposal alone is the immediate submission tier (D5, 15-25 pages).** The fuller document at the 90,000-110,000-word scale is a later tier and is not submitted now. |
| Decision and stage key | Decisions are keyed **D-01 to D-16** and blocking items **B1 to B3**, exactly as in the outline decision draft. AI-coverage stages are **Stage A, Stage B, Stage C and Stage D**, whose minimum acceptable stage is **Stage B**. |

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

## 1. Executive summary

This proposal describes a twelve-week, four-student Final Year Project that builds an enterprise network of three device families and then places an AI management plane on top of it. The network is the foundation; the AI layer is the point.

The order of work is the governing rule. First the Windows, Linux and Cisco estate is built and every service in it verified; only then is the AI management plane designed, against services already existing and interfaces already proved to answer. No management tool is written before the device it manages is reachable, authenticated and logging.

The estate is one Windows Server domain of nine guests, ten Ubuntu Server guests on one hypervisor host, and a genuinely reachable Cisco layer of five devices; the layers, interfaces and ports are in section 5. The AI layer is a locally hosted model plus MCP as the single integration contract, served strictly offline on school or laboratory hardware: five MCP servers own Linux, Windows, Cisco, monitoring, and documentation and inventory, with every tool typed read-only or mutating.

The earlier design put the whole Cisco layer in Packet Tracer, whose devices expose no management interface external tooling can reach, so nothing can manage them; it is withdrawn, and Packet Tracer is retained as a design-time tool for topology and CCNA-level configuration - not reachable, and never AI-managed.

Coverage grows as four **stages** with entry and exit gates: **Stage A** the Linux and Windows estate, **Stage B** the first genuinely reachable Cisco device, **Stage C** the five-device Cisco target set, and **Stage D** the optional peer-side exterior-routing verification. **The minimum acceptable stage is Stage B** - one genuinely reachable Cisco device, proved end to end.

The permission model is read-only by default: changes need a human-approved, fully specified proposal, a single-use token scoped to one allow-listed host, and a tamper-evident audit log.

Verification is designed before it is needed: twelve fixed scenarios run three times each, five injected faults whose ground truth is known in advance and reverted after diagnosis, a permission-boundary suite whose refusal tests matter as much as its success tests, a hallucination check that counts fabricated answers and gates the write demonstration, and a drift false-positive check.

The deliverables, the documentation set the topic sheet requires and the full document at the 90,000-110,000-word scale are described in section 12. Only this proposal, with a Chinese companion summary, is submitted now.

The WorldSkills standard contains no artificial-intelligence content whatsoever, so the AI layer is positioned as innovation *justified by* the standard's requirements to maintain currency, research thoroughly and embrace change, and deliberately *beyond* it; it is not claimed as standards compliance.
