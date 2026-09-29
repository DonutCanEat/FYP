> **[FRONT MATTER — for the assembly step]** The block below is supplied as structured
> Markdown (headings and tables only, no `# ` H1) so that it can be converted mechanically
> into a title page, a document-control page and the front tables.

## Title Block

| Field | Value |
|---|---|
| Programme | Higher Diploma in Telecommunications and Networking (HDTN) |
| Module | Final Year Project |
| Academic year | AY2026/27 |
| Project title | **Victor2 – Enterprise Network Infrastructure and Architect** |
| Subtitle | *Design, Build, Verify and Document a Virtualised Enterprise Network for a Hong Kong FinTech Firm* |
| Context line | HDTN Final Year Project Topic (AY2026/27) |
| Host organisation (scenario) | Vertex Peak Financial Technologies Limited (Chinese trading name: 駿峰金融科技有限公司), trading as "Vertex Peak" |
| Organisation sector | Insurance-technology and financial-data services; SaaS vendor to insurance brokerages |
| Organisation footprint | Headquarters: Sha Tin, Hong Kong Science Park. Offices: Kwun Tong, Wan Chai, Macau. 160 staff total. |
| Duration | 12 weeks |
| Group size | 4 students |
| Deliverable context | Working virtualised enterprise network plus the full documentation set |
| Reference standard | *IT Network Systems Administration*, WorldSkills Occupational Standards 2026 (Skill 2447, WorldSkills Shanghai 2026) |

### Group Members

| Name | Student ID | Email | Mobile |
|---|---|---|---|
| [to be completed] | [to be completed] | [to be completed] | [to be completed] |
| [to be completed] | [to be completed] | [to be completed] | [to be completed] |
| [to be completed] | [to be completed] | [to be completed] | [to be completed] |
| [to be completed] | [to be completed] | [to be completed] | [to be completed] |

| Field | Value |
|---|---|
| Supervisor | [to be completed] |
| Date of submission | [to be completed] |

## Document Control

| Item | Value |
|---|---|
| Document title | Final Year Project Proposal — *Victor2 – Enterprise Network Infrastructure and Architect* |
| Version | 1.0 |
| Status | Final (issued for supervisor approval) |
| Date | [to be completed] |
| Author(s) | Group members, HDTN Final Year Project AY2026/27 (four students) |
| Reviewer | All four group members, plus the Internal Reviewer named in the group charter |
| Approved by | [Supervisor name, to be completed] — [signature and date, to be completed] |

## Revision History

| Version | Date | Author | Summary of changes |
|---|---|---|---|
| 0.1 | Week 1 of AY2026/27 — [ASSUMPTION: exact date to be confirmed] | Group members (all four) | First draft. Scope drawn from the official topic sheet and from the canonical design baseline; five technology lines identified; initial aim, objectives and success criteria written. |
| 0.2 | Week 2 of AY2026/27 — [ASSUMPTION: exact date to be confirmed] | Group members, incorporating the Internal Reviewer's comments | Internal review round. Objectives rewritten in SMART form and mapped to WorldSkills Occupational Standards (WSOS) 2026 assessment domains; scope and constraints tightened; out-of-scope list made explicit; abbreviation list completed. |
| 0.3 | Week 2 of AY2026/27 — [ASSUMPTION: exact date to be confirmed] | Document integrator (Workstream 4) | Consistency pass against the interface contract: every hostname, address, VLAN identifier and software version in the proposal reconciled with the canonical design baseline; citation discipline checked so that no WorldSkills requirement is claimed for a technology the standard does not name. |
| 1.0 | Week 3 of AY2026/27 — [ASSUMPTION: exact date to be confirmed] | Group members (all four) | Final proposal issued for supervisor approval. Includes the WSOS 2026 domain mapping, the honest gap disclosure for technologies not named in the standard, and the innovation positioning of the AI Network Management line. |

## Executive Summary

### The organisation and the trigger

Vertex Peak Financial Technologies Limited (駿峰金融科技有限公司) is a Hong Kong insurance-technology
and financial-data services company: an SFC-licensed wealth-management software vendor selling a
software-as-a-service platform to 260 insurance brokerages in Hong Kong and Macau, with
approximately 14,000 end-user seats on that platform. The company employs 160 staff across a
headquarters at Hong Kong Science Park in Sha Tin, a flagship service centre in Kwun Tong, a
delivery office in Wan Chai and a representative office in Macau, supported by six permanent
home-office staff and about forty travelling sales staff who need remote access. Its information
technology function is five people, and its clients are regulated by the Hong Kong Insurance
Authority, which makes demonstrable least privilege, auditability and protection of client data a
contractual matter rather than a matter of good practice.

The business trigger for this project is a newly signed contract with a brokerage group whose
due-diligence questionnaire imposes five conditions: segregation of the platform production chain
from ordinary office users; documented least-privilege access with an audit trail of
administrative actions; encrypted remote access using certificate-based authentication instead of
a shared password; documented recovery and failover behaviour for the customer-facing web tier;
and evidence that network change is applied through reviewed, repeatable configuration rather than
by hand. The present environment — a single flat office network extended informally to three more
locations — satisfies none of the five. This project is the network engineering workstream's
response to that gap.

### What will be built

The deliverable is a complete, working, documented enterprise network for that organisation,
organised around the five technology lines named in the topic sheet.

- **Microsoft Server Networking and Network Services.** A single Active Directory Domain Services
  forest and domain (`vertexpeak.fyp.lab`, NetBIOS `VERTEXPEAK`) with two domain controllers at
  headquarters and a read-only domain controller at Kwun Tong, a site-aware organisational unit
  structure, tiered administrative groups, AD-integrated DNS, DHCP with failover, Active Directory
  Certificate Services, Group Policy baselines and an audit policy; File Server Resource Manager
  quotas, file screening and storage reports on the finance, engineering and sales shares; iSCSI
  LUNs served to the platform tier; Routing and Remote Access Service with IKEv2
  certificate-authenticated remote access authorised by Network Policy Server.
- **Linux Server Administrations.** An Nginx reverse proxy pair terminating TLS and re-encrypting
  to the application tier, made resilient by a Keepalived VRRP pair with a floating virtual
  address; an nftables egress filter pair placed inline as the single chokepoint for outbound
  traffic, performing stateful filtering, address translation and drop logging; an OpenVPN
  server with a full Easy-RSA public key infrastructure and an independent WireGuard tunnel to the
  Wan Chai office; a WordPress content pair; and a hardened Ubuntu baseline applied to every Linux
  guest.
- **Cisco Networking.** A three-tier Packet Tracer topology with OSPF in single area 0 between
  headquarters and Kwun Tong, EIGRP at the Macau office and the legacy segment with redistribution
  controlled at exactly one router using route tags, basic eBGP to a simulated transit provider
  with a second provider session and prefix control, Rapid Spanning Tree Protocol with an explicit
  root bridge and access-port protections, HSRP gateway redundancy, and a Cisco ASA perimeter
  firewall implementing the DMZ boundary with access lists, NAT and a site-to-site IPsec tunnel to
  Wan Chai.
- **Network Automation.** A Git-tracked repository of PowerShell scripts, Ansible playbooks, roles
  and Jinja2 templates, plus Bash hardening and operations scripts, all executed from a single
  control node; the playbooks configure both the Linux and the Windows estate from one inventory;
  idempotence is a hard requirement and is demonstrated by a second run reporting no changes.
- **AI Network Management.** An agent runtime with a strictly read-only tool surface of four
  declared tools, which consumes alerts, correlates them with interface and authentication
  evidence, and produces a triage note and a *proposed* configuration change for human review.
  There is no write path by construction, and the demonstration is presented as a proof of concept
  with a declared scope.

### How it will be built

The entire environment is virtual. There is no physical network hardware of any kind: no routers,
no switches, no firewalls, no access points, no cabling, and no requirement to order anything. The
VM estate comprises **nineteen virtual machines — nine Windows Server guests and ten Ubuntu Linux
guests — running on one hypervisor host** (`vpnz-hvhost01`, the physical machine owned by a group
member). The recommended hypervisor is **VMware Workstation Pro 17.6.2**, chosen because its
Virtual Network Editor supports arbitrary host-only networks with independently switchable DHCP,
which is exactly what the segmentation design needs; the evaluation licence for the server
operating system and the free or academic entitlement for every other component mean no software
is purchased. Segment isolation for the virtual machines is provided by separate host-only virtual
networks, and bridged mode is forbidden so that the lab never connects to the campus or home
network. The Cisco layer is built in **Cisco Packet Tracer**, which models the Layer 2 and Layer 3
topology, the routing protocols and the firewall policy — the simulator's limits are stated
explicitly and no simulated measurement is presented as a real-world figure.

### How it will be verified

Verification is designed at the same time as the build, not afterwards. Every technology in the
five lines is traced to a numbered test case, every trust boundary in the design carries an
identifier, and the delivered environment must be reproducible from a clean host. Verification
methods include: protocol evidence from the simulator (neighbour and topology output for OSPF,
EIGRP and BGP, spanning-tree output before and after a link failure, firewall session and drop
output); service-level evidence from the virtual estate (directory replication health, quota and
file-screen enforcement, LUN attachment, VPN client connection detail, port-matrix reachability
and denial); failover evidence (killing a Keepalived master and capturing the virtual address
moving while the service continues to answer); automation evidence (a second playbook run
reporting no changes); monitoring evidence (dashboards and at least three alerts shown firing and
resolving); and negative evidence, which is treated as first-class — each zone boundary must be
shown rejecting traffic that should not cross it.

### What will be delivered

Two deliverables, treated as equally important. The first is the **working technical environment**:
the Packet Tracer project file containing the full topology with its routing, switching and
perimeter policy operational; the virtual machine estate built to pinned software versions; the
directory, file, storage, remote-access, proxy, filtering, tunnelling and monitoring services
running; and the automation repository able to rebuild and verify that state. The second is the
**documentation set** required by the topic sheet — findings, manuals, build steps, screen
captures, verifications and references — structured as a design document, per-technology build
runbooks, a test plan with executed test records, an evidence library, a reference library, and a
traceability matrix that maps every technology named in the topic sheet to a section of the report
and to a test case identifier. The demonstration and defence in front of the supervisor forms the
third part of the delivery: the environment is shown working, one component is deliberately broken
and repaired, and the results are defended against the evidence.

### Value to the organisation and alignment to the standard

For Vertex Peak, the outcome is the ability to answer its client's due-diligence questionnaire
with evidence rather than assertion: segregated production and user traffic, least privilege that
can be shown in the directory and in the file system, an audit trail of administrative action,
certificate-based encrypted remote access, documented failover for the customer-facing tier, and a
reviewed, version-controlled change process. For the students, the outcome is a portfolio-grade
artefact assembled at enterprise scale but within a resource envelope that a four-person team can
actually deliver in twelve weeks.

The project is aligned to the *IT Network Systems Administration* standard in the **WorldSkills
Occupational Standards 2026** (Skill 2447, WorldSkills Shanghai 2026 edition). The standard's
assessment structure is six weighted sections — Work organization and management 5 per cent,
Communication and interpersonal Skills 5 per cent, Data Transfer Networks 25 per cent, Network and
System Operations 25 per cent, Infrastructure Automation 15 per cent and Troubleshooting 25 per
cent — totalling 100 per cent. This project develops **95 per cent of that weighted structure
directly**: Domain 1, Domain 3, Domain 4, Domain 5 and Domain 6. Domain 2 is developed only
indirectly through the project's written and verbal communication obligations, and this is
disclosed rather than glossed over. The AI Network Management line, by contrast, has **no coverage
in the standard at all**: the 2026 edition contains zero occurrences of agentic AI, OpenClaw, MCP
or artificial intelligence in any form. That line is therefore presented as innovation beyond the
standard, justified by the standard's own Domain 1 requirements that an IT professional maintain
currency with the speed of change in IT systems, use thorough and efficient research methods, and
be enthusiastic to try new methods and embrace change. No claim of AI compliance is made, because
such a claim would be false.

## Table of Contents

[TOC]

- 1 Introduction
  - 1.1 Background
  - 1.2 Problem Statement
  - 1.3 Rationale for the Five Technology Lines
  - 1.4 The WorldSkills Context
- 2 Aim and Objectives
  - 2.1 Aim
  - 2.2 Objectives
  - 2.3 Deliverables
  - 2.4 Success Criteria
- 3 Project Scope
  - 3.1 In Scope
  - 3.2 Out of Scope
  - 3.3 Constraints
  - 3.4 Assumptions
  - 3.5 Scope Management
- 4 Standards and Compliance Alignment
  - 4.1 The Reference Standard
  - 4.2 Mapping of This Project to the Standard
  - 4.3 Honest Gap Disclosure
  - 4.4 The AI Network Management Line
  - 4.5 Other Standards and Good Practice
- 5 Literature and Technology Review
- 6 System Architecture Design
- 7 Microsoft Server Networking and Network Services
- 8 Linux Server Administration
- 9 Cisco Networking
- 10 Network Automation
- 11 AI Network Management
- 12 Implementation Plan and Schedule
- 13 Testing, Verification and Acceptance
- 14 Documentation and Evidence Management
- 15 Risk Management
- 16 Project Management and Team Organisation
- 17 Expected Outcomes and Deliverables
- 18 Conclusion
- 19 References
- 20 Appendices

## Abbreviations and Glossary

| Abbreviation | Expansion | Meaning in this proposal |
|---|---|---|
| ACL | Access Control List | Ordered permit/deny rule set on the ASA and on Cisco device interfaces; named `ACL-{ZONE}-{DIR}-{NN}`. |
| AD CS | Active Directory Certificate Services | The Windows Server role that issues and manages certificates from the internal public key infrastructure. |
| AD DS | Active Directory Domain Services | The directory service that provides authentication, authorisation and the single identity for all 160 staff across the four sites. |
| AI | Artificial Intelligence | Used only in the phrase "AI Network Management"; the term does not appear in the WSOS 2026 standard at all. |
| ASA | Cisco Adaptive Security Appliance | The Packet Tracer perimeter firewall `VP-HQ-FW-01` (ASA 5506-X, ASA 9.16(4)) that owns the DMZ boundary. |
| BGP | Border Gateway Protocol | The exterior gateway protocol used for the eBGP session between the enterprise edge and the simulated transit provider. |
| CA | Certification Authority | The entity that signs certificates; `VP-ROOT-CA` and `VP-ISSUING-CA-01` on the Windows side, Easy-RSA on the Linux side. |
| CHAP | Challenge Handshake Authentication Protocol | The iSCSI authentication method required before an initiator may attach a LUN. |
| CI/CD | Continuous Integration / Continuous Delivery | A Domain 5 *know/understand* concept in the standard; documented in this project but not implemented as a pipeline. |
| CUCM | Cisco Unified Communications Manager | CUCM Express on `VP-HQ-VOICE-01`, the simulated voice service in Packet Tracer. |
| DC | Domain Controller | A server hosting an AD DS partition; `vpnz-dc01`, `vpnz-dc02` and the read-only `vpnz-brdc01`. |
| DHCP | Dynamic Host Configuration Protocol | The service that leases addresses to workstations, telephones and lab endpoints. |
| DMZ | Demilitarised Zone | VLAN 90 (`10.10.90.0/24`), the externally published, internally untrusted service segment. |
| DNS | Domain Name System | AD-integrated name resolution for the forest root domain `vertexpeak.fyp.lab`. |
| EIGRP | Enhanced Interior Gateway Routing Protocol | The interior gateway protocol used at the Macau office and the legacy segment (AS 100), redistributed into OSPF at one point only. |
| FSRM | File Server Resource Manager | The Windows Server role providing file quotas, file screening and storage reports on the finance, engineering and sales shares. |
| GPO | Group Policy Object | A centrally managed set of computer and user settings applied to the OU structure. |
| HSRP | Hot Standby Router Protocol | The Cisco first-hop redundancy protocol used for gateway redundancy on the HQ access switches. |
| HTTPS | Hypertext Transfer Protocol Secure | HTTP over TLS; the only protocol by which the DMZ services are published. |
| IKEv2 | Internet Key Exchange version 2 | The key-exchange protocol used by RRAS remote-access VPN and by the ASA site-to-site tunnel. |
| IIS | Internet Information Services | The Microsoft web server hosting the DMZ application tier nodes. |
| IPsec | Internet Protocol Security | The protocol suite used to build the site-to-site tunnel between the enterprise edge firewall and the Wan Chai office. |
| iSCSI | Internet Small Computer Systems Interface | Block storage delivered over IP; the LUNs served by the iSCSI target host to the platform tier. |
| LAN | Local Area Network | A single-site network segment; used here for the HQ, branch and small-office user networks. |
| LUN | Logical Unit Number | An addressable block-storage unit presented by the iSCSI target. |
| MCP | Model Context Protocol | The protocol model used to define the AI agent's read-only tool surface; **not named anywhere in the WSOS 2026 standard**. |
| NAT | Network Address Translation | Address translation performed at the egress chokepoint and stated as static NAT for published services at the perimeter firewall. |
| NETCONF | Network Configuration Protocol | Not part of this project; noted in the gap analysis because it was present in the 2024 standard and removed in 2026. |
| NPS | Network Policy Server | The RADIUS role that authorises VPN connections on certificate and group membership. |
| nftables | (Lower-case product name, not an acronym) | The Linux in-kernel packet-filtering framework used for the stateful egress filter, NAT and drop logging. |
| NTP | Network Time Protocol | The service keeping all hosts within Kerberos' five-minute skew tolerance. |
| OSPF | Open Shortest Path First | The interior gateway protocol used in single area 0 across HQ and the Kwun Tong branch. |
| OU | Organisational Unit | The container structure inside the domain that carries delegation and Group Policy. |
| PKI | Public Key Infrastructure | The certificate hierarchy that issues every server, VPN and TLS certificate used in the design. |
| PoC | Proof of Concept | A bounded demonstration whose scope is declared in advance; the status claimed for the whole AI Network Management line. |
| PowerShell | (Product name, not an acronym) | The Windows scripting language used for onboarding, health reporting and configuration backup. |
| RADIUS | Remote Authentication Dial-In User Service | The authentication, authorisation and accounting protocol used for VPN access control. |
| RFC | Request for Comments | A published internet standards document; used here for addressing, addressing-documentation and protocol references. |
| RODC | Read-Only Domain Controller | The Kwun Tong cached identity copy that keeps branch logons working during an HQ WAN outage. |
| RRAS | Routing and Remote Access Service | The Windows Server role providing the IKEv2 remote-access VPN and its routing functions. |
| RSTP | Rapid Spanning Tree Protocol | The loop-prevention protocol used across the HQ switching layer, with explicit root bridge selection. |
| SDN | Software-Defined Networking | Mentioned in the standard and deliberately excluded from this project, because it is the subject of a sibling topic. |
| SLA | Service Level Agreement | Used only as an in-scenario business driver; no SLA is contractually offered or measured. |
| SMB | Server Message Block | The file-sharing protocol used by the Windows file shares and by SYSVOL and NETLOGON. |
| SMTP | Simple Mail Transfer Protocol | Named in the standard; explicitly out of scope in this project because no mail system is built. |
| SNMP | Simple Network Management Protocol | Used in SNMPv3 (authPriv) form only for device monitoring and traps; SNMPv2c and community strings are forbidden. |
| SSH | Secure Shell | The encrypted administrative and automation transport for all Linux guests and all Cisco devices. |
| SSL VPN | Secure Sockets Layer Virtual Private Network | Named in the standard as a remote-access technology; the functions it covers are delivered here by OpenVPN and IKEv2. |
| TCP/IP | Transmission Control Protocol / Internet Protocol | The protocol stack underlying every service in the design. |
| TLS | Transport Layer Security | The encryption protocol terminated at the reverse proxy and re-established to the upstream application servers. |
| VIP | Virtual IP address | The floating address owned by a first-hop redundancy pair and owned by no node: `10.10.50.10` (nftables egress pair, nodes `10.10.50.11`/`.12`) and `10.10.90.10` (nginx reverse-proxy pair, nodes `10.10.90.28`/`.29`). |
| VLAN | Virtual Local Area Network | A logically separated Layer 2 segment; the design uses VLANs from 10 to 999, with VLAN 999 as the blackhole. |
| VRRP | Virtual Router Redundancy Protocol | The first-hop redundancy protocol implemented by Keepalived on the Linux pairs. |
| VPN | Virtual Private Network | Encrypted remote access and site-to-site connectivity, implemented three ways for comparison. |
| WAN | Wide Area Network | The inter-site links and the simulated transit provider connection. |
| WinRM | Windows Remote Management | The management protocol over which Ansible configures the Windows guests. |
| WSOS | WorldSkills Occupational Standards | The international standard issued by WorldSkills International that defines the knowledge, understanding, skills and capabilities for this occupation; the reference standard of this project. |
| YANG | (Data modelling language, not an acronym) | Not part of this project; noted because it was removed from the standard's automation section in the 2026 edition. |

---

## 1. Introduction

### 1.1 Background

The official topic sheet for this project, *HDTN Final Year Project Topic (AY2026/27)* — whose
title line is *Victor2 – Enterprise Network Infrastructure and Architect* — situates the work
inside a sector that is changing faster than the qualifications that describe it. Its opening
paragraph is quoted here in full, because the framing it supplies is the framing this project
adopts:

> With the fast globalization of IT systems and the international mobility of people, IT Network
> Systems Administrators face rapidly expanding opportunities and challenges. For the talented IT
> Network Systems Administrator, there are many commercial, public sector and international
> opportunities. This project focuses on real-life scenarios, specifically network systems and
> network administration. It is highly recommended for students with high self-motivation and a
> desire to overcome challenges in real-world situations.

Three consequences follow directly from that paragraph and shape everything described below. First,
the scope of the work is the network systems administrator's occupation as it is practised, not as
it is examined: the sheet asks for "real-life scenarios" rather than isolated laboratory exercises,
so the project is built around an organisation with a commercial reason to need it. Second, the
sheet addresses itself to students who want to "overcome challenges in real-world situations",
which is a statement about the depth expected rather than about the difficulty of any single
technology: a real environment has dependencies, failure modes and unfinished edges, and the
project is expected to meet them rather than to avoid them. Third, the sheet frames the work within
"commercial, public sector and international opportunities", which is why the scenario chosen
spans Hong Kong and Macau and why the identity, data-protection and auditability requirements of a
regulated financial-services client are treated as the design driver rather than as decoration.

The topic sheet then states what the student must actually do, and names the technology families
that constitute "including but not limited to":

> You will study, build, configure, troubleshoot, and document complex enterprise networks using
> various telecom technologies (including but not limited to):

Finally, the sheet sets an explicit documentary obligation, which is treated as a deliverable in
its own right throughout this proposal:

> To provide a clear picture, network environments for the project and related documentation might
> be provided and disclosed. Most importantly, students must produce well-organized documentation
> that includes all findings, manuals, steps, screen captures, verifications, and references
> related to the project.

That obligation is the origin of the documentation set described in Section 2.3(b) and of the
traceability discipline in Section 3.5. It is worth stating precisely where the requirement comes
from: the demand for "screen captures" and for "all findings, manuals, steps, screen captures,
verifications, and references" is the **topic sheet's** requirement. It is not a requirement of the
WorldSkills Occupational Standards, whose 2026 edition contains no occurrence of the words
"screen", "capture", "screenshot" or "evidence" at all. Section 4.2 attributes that requirement
correctly, and the distinction is maintained everywhere it appears.

This proposal answers that framing with an invented but deliberately realistic enterprise. The
host organisation is **Vertex Peak Financial Technologies Limited** (Chinese trading name
駿峰金融科技有限公司), trading as **Vertex Peak**. Vertex Peak is a Hong Kong insurance-technology
and financial-data services company: an SFC-licensed wealth-management software vendor that sells
a software-as-a-service platform to insurance brokerages. Its clients are 260 brokerages across
Hong Kong and Macau, and approximately 14,000 end-user seats sit on the platform. The company
employs 160 staff in total. One hundred and ten work at the headquarters at Hong Kong Science
Park in Sha Tin, which is the data centre of record and hosts every core service. Twenty-eight
work at the Kwun Tong flagship service centre, twelve at the Wan Chai delivery office, and four
at the Macau representative office. Six staff work permanently from home, and roughly forty
travelling sales staff require ad-hoc remote access. The information technology function is five
people reporting to the Chief Operating Officer. For the purposes of this project, the four
students of the group constitute the network engineering workstream of that team.

The business trigger is specific and would be recognisable to any small Hong Kong technology
firm. Vertex Peak has just absorbed a twelve-person professional-services team, taking its
footprint from a single flat office network to a two-and-a-half-site operation, and it has signed
a contract with a new brokerage group whose due-diligence questionnaire imposes five explicit
conditions. First, the platform production chain must be segregated from ordinary office users.
Second, least-privilege access must be documented and administrative actions must leave an audit
trail. Third, remote access must be encrypted and must use certificate-based authentication
rather than a shared password. Fourth, the failover and recovery behaviour of the customer-facing
web tier must be documented. Fifth, network change must be applied through reviewed, repeatable
configuration rather than by hand. These five conditions are contractual, not aspirational, and
they cannot be satisfied by the present environment. That gap — between what the company has and
what its newest client contract requires — is the reason this project exists, and every design
decision in it traces back to one of the five due-diligence items.

**[FIGURE: Site and connection map — HQ (Sha Tin), Kwun Tong branch, Wan Chai delivery office,
Macau representative office, simulated transit provider — with the four sites, the WAN links and
the service zones labelled.]**

### 1.2 Problem Statement

The environment that Vertex Peak operates today grew by accretion rather than by design, and each
of its deficiencies can be traced to one or more of the five technology lines that this project
addresses. The deficiencies are stated below as they would be found during a review, with the
technology line that must resolve each one named in parentheses.

**Identity and Windows platform deficiencies (L1 — Microsoft Server Networking and Network
Services).** There is no single identity for the organisation. Staff at the Kwun Tong, Wan Chai
and Macau sites hold locally created accounts on locally managed machines, so a leaver's access is
removed only if the site administrator remembers to remove it, and there is no authoritative
record of who holds what. The domain that exists at headquarters has never been extended into a
site-aware structure, so replication topology, logon locality and delegated administration are all
undesigned. File access is uncontrolled in the precise sense the due-diligence questionnaire
cares about: the finance, engineering and sales shares have permissions but no quotas, no file
screening and no storage reporting, so an individual can fill a volume and no one can demonstrate
afterwards who held or distributed what. The software-as-a-service platform, which is the
company's only revenue-generating asset, has no block storage of its own and depends on disks
attached inside individual virtual machines, so a node failure takes its data with it. Remote
access is a shared-password VPN on an ageing appliance, which fails the third due-diligence
condition directly.

**Linux and application-delivery deficiencies (L2 — Linux Server Administrations).** The
customer-facing web tier has no reverse proxy and no load balancing, so it is published in a way
that exposes origin servers and cannot survive the loss of a single node; the fourth
due-diligence condition — documented failover behaviour for the customer-facing web tier — cannot
be met at all. There is no demilitarised zone in any meaningful sense: services reachable from
the outside sit on the same segments as internal systems. Egress traffic is unfiltered and
unlogged, so outbound connections from an infected workstation or a compromised server are
indistinguishable from legitimate traffic and leave no attributable record. The Wan Chai delivery
office, which handles integration work for third-party systems, reaches headquarters over the
same path as ordinary office traffic, with no independent encrypted tunnel and no least-privilege
separation of the integration segment from production credentials. Certificates across the estate
are self-signed and renewed by hand, so expiry is discovered by outage.

**Network and routing deficiencies (L3 — Cisco Networking).** There is no dynamic routing between
headquarters and the branch office. The Macau office runs a different routing domain from the
rest of the company, and the boundary between them has never been deliberately designed, so a
single misconfigured advertisement could black-hole or loop traffic. There is one WAN link and no
BGP relationship with a transit provider, so failover to an alternate path is a manual activity.
At the switching layer the spanning-tree root has never been chosen on purpose: root election is
decided by whatever hardware happens to boot first, and access ports run without PortFast, BPDU
guard or port security, which leaves the network exposed to bridging loops and to an unauthorised
device being plugged into a socket. At the perimeter, the DMZ boundary is not enforced by a
firewall with explicit access lists, NAT rules and an inspected policy; and there is no
site-to-site encrypted tunnel to the Wan Chai office.

**Change-management deficiencies (L4 — Network Automation).** The fifth due-diligence condition —
that network change be applied through reviewed, repeatable configuration — is currently
unsatisfiable. Switch and firewall changes are typed by hand from memory, are not version
controlled, are not peer-reviewed, and cannot be reproduced. User onboarding is a manual sequence
of steps whose completeness depends on the administrator, which is exactly how privilege creep
begins. There is no automated health check of the directory service, so replication failures are
discovered by users. There is no automated inventory of device configurations, so the company
cannot prove what its network configuration was on any past date — the single most common demand
in a broker's audit.

**Operational-visibility deficiencies (L5 — AI Network Management).** There is no centralised
monitoring, no log aggregation and no alert correlation. Eighteen virtual machines and fourteen
network devices are watched by five people using individual consoles. Alerts that do arrive
arrive as raw events without context, so the discriminating work — deciding whether a burst of
authentication failures indicates a misconfigured client, an expired certificate or an actual
credential attack — is done from memory under time pressure. This is the deficiency that motivates
the project's fifth and most exploratory workstream: an advisory, strictly read-only agent that
gathers evidence and drafts a triage note, while leaving every decision and every change with a
human administrator.

### 1.3 Rationale for the Five Technology Lines

The five lines are not an arbitrary list; they are the five layers at which the same business
problem has to be solved, and the topic sheet groups them for that reason. Taken one at a time,
each line is a technology exercise. Taken together, they form the minimum coherent system that
meets the client's five contractual conditions.

The coherence runs in both directions. Identity (L1) is the foundation on which authorisation
depends; the network (L3) is the transport that carries every other line's traffic and enforces
which zone may speak to which; the Linux application tier (L2) is where the customer-facing
service actually lives and where the perimeter between published and internal services is drawn;
automation (L4) is what turns a configuration into a reviewed, reproducible artefact rather than a
memory of keystrokes; and the AI operations line (L5) is the practical answer to the question of
how a five-person team watches an estate of this size. Remove any one line and a due-diligence
condition becomes unmet: without L1 there is no least-privilege claim, without L2 there is no
documented web-tier failover, without L3 there is no segregation or controlled inter-site
routing, without L4 there is no reviewed change process, and without L5 the operational burden
that makes all of the above sustainable is unaddressed.

The lines also depend on each other technically, which is what makes the project a single piece of
engineering rather than five parallel coursework submissions. The remote-access solution is
certificate-based, so it requires both the Windows certificate authority (L1) and the Linux TLS
material (L2); the egress filter (L2) is meaningful only because the routing design (L3) makes it
the sole path from the internal zones to the internet; the automation playbooks (L4) configure
both the Linux estate and the Windows estate, and collect the Cisco configurations as files; and
the agent (L5) consumes telemetry produced by the monitoring stack and reads the same audit policy
that L1 configures. This interdependency is a deliberate design property and is the reason the
proposal presents one environment with five technology lines rather than five separate
deliverables.

### 1.4 The WorldSkills Context

WorldSkills International publishes Occupational Standards (WSOS) that specify the knowledge,
understanding, skills and capabilities underpinning international best practice in a given
occupational role. The standards are written to describe what an occupation actually represents
for industry and business, and in the skill competition the assessment of knowledge and
understanding takes place through the assessment of performance rather than through separate
written examination. For a final-year project, that orientation is decisive: it rewards an
environment that can be built, operated, broken and fixed in front of an assessor, supported by
evidence, rather than one that exists as a diagram.

The topic sheet used by this module explicitly cites the occupational standard for this
occupation, *IT Network Systems Administration*, and the standard's 2026 edition is published at:

```text
https://worldskills.org/what/projects/wsos/2026/events/611/skills/2447/
```

That page identifies the edition as **WorldSkills Shanghai 2026**, names the skill as **IT Network
Systems Administration** (Skill 2447), and carries the footer timestamp **Last updated: 02.06.2026
13:34 (GMT)**. Its assessment structure comprises six weighted sections totalling 100 per cent,
and the project's own research pack records 131 requirement lines across those six sections (census: `proposal\research\wsos-2026-2447.md` Section 3.7 and Appendix A). All statements in this proposal
about what the standard does and does not contain are taken from a machine-verified extraction of
that page held in this project's repository, which fetched the page successfully and re-verified
every quoted requirement line verbatim against the retrieved source. The standard is used
throughout this proposal in three specific ways: as the source of the assessment weighting that
justifies where the project spends its effort, as the source of verbatim requirement lines that
justify individual technology choices, and as the reference framework for the quality and
traceability of the documentation set.

One qualification must be stated at the outset, because the integrity of this proposal depends on
it. The WSOS 2026 is a **reference framework** for this project, not a compliance standard against
which the project is certified. The project is not claiming WorldSkills certification, conformity
or accreditation, and it does not present the WSOS as a regulatory obligation. It uses the
standard to answer a narrower and more defensible question: does the work this project performs
develop the competencies that the international standard for this occupation describes, and in
roughly the proportions that the standard itself assigns to them? Section 4 answers that question
with a domain-by-domain mapping and with an explicit disclosure of the places where the standard
is silent.

---

## 2. Aim and Objectives

### 2.1 Aim

The aim of this project is to design, build, configure, verify and document a complete virtualised
enterprise network for the host organisation, Vertex Peak Financial Technologies Limited, using
the five technology lines named in the topic sheet — Microsoft Server networking and network
services, Linux server administration, Cisco networking, network automation, and AI network
management — so that the organisation can demonstrate, with reproducible evidence, that its
network satisfies the five conditions its newest brokerage client's due-diligence questionnaire
imposes, and so that the group demonstrates the professional competency described by the
*IT Network Systems Administration* standard in the WorldSkills Occupational Standards 2026.

### 2.2 Objectives

Each objective below is stated in SMART form (specific, measurable, achievable within the
twelve-week schedule, relevant to the aim, and time-bound). Each is mapped to the technology line
or lines it serves, to the WorldSkills Occupational Standards 2026 assessment domain it develops,
and to the initial test case identifier used by the verification workstream.

| # | Objective | Technology line(s) | WSOS 2026 domain | Test case |
|---|---|---|---|---|
| O-1 | **Design.** Produce a complete, internally consistent design for the enterprise network — site topology, zone and trust-boundary model, VLAN plan, IP addressing plan, routing design, and device and virtual machine inventory — frozen as a version-controlled design document by the end of week 2, with every hostname, address and identity value fixed before any device is configured. | All five lines | 1 Work organization and management (5%); 3 Data Transfer Networks (25%) | TC-DOC-01 |
| O-2 | **Build — Microsoft platform.** Deploy and configure a single Active Directory Domain Services forest and domain (`vertexpeak.fyp.lab`) comprising two domain controllers at headquarters and one read-only domain controller at the Kwun Tong branch, with a site-aware organisational unit structure, delegated administration, two-tier administrative separation, Group Policy baselines, advanced audit policy and an audit trail of administrative actions, demonstrated by directory replication and health output, by the end of week 3. | L1 | 4 Network and System Operations (25%); 6 Troubleshooting (25%) | TC-L1-01 |
| O-3 | **Build — Microsoft network services.** Configure the supporting Windows network services — AD-integrated DNS with redundant resolvers, DHCP with a failover partner arrangement, network time synchronisation within Kerberos tolerance, and File Server Resource Manager quotas, file screening and storage reporting on the finance, engineering and sales shares — and evidence each by command output and by an actual enforced action such as a quota breach and a blocked file write, by the end of week 7. | L1 | 4 Network and System Operations (25%) | TC-L1-02 |
| O-4 | **Build — storage and certificate-based remote access.** Present iSCSI LUNs from the storage host to the platform tier with authentication enabled, and deploy a certificate-authenticated IKEv2 remote-access VPN authorised by policy on certificate and group membership with split tunnelling disabled, demonstrated by an attached and mounted volume and by a successful client connection whose certificate details are captured, by the end of week 7. | L1 | 4 Network and System Operations (25%); 3 Data Transfer Networks (25%) | TC-L1-03, TC-L1-04, TC-L1-05 |
| O-5 | **Build — Linux application delivery.** Deploy an Nginx reverse proxy pair that terminates TLS and re-encrypts to the application tier, publishes the customer-facing portal and blog names, and is made resilient by a Keepalived VRRP pair owning a floating virtual address that **no node also holds** (`vpnz-dmzrev01` = 10.10.90.28, `vpnz-dmzrev02` = 10.10.90.29, VIP = 10.10.90.10); demonstrate failover by stopping the master and capturing the address moving while the service continues to answer, by the end of week 6. | L2 | 4 Network and System Operations (25%); 3 Data Transfer Networks (25%) | TC-L2-01, TC-L2-02 |
| O-6 | **Build — Linux security and tunnelling.** Deploy an nftables egress filter pair inline as the sole path from the internal zones to the outside, with default-deny policy, stateful inspection, address translation, connection limiting and logging of every drop; and deploy two independently implemented encrypted tunnels — OpenVPN with a full certificate authority and revocation list, and WireGuard — with their key material excluded from version control, by the end of week 6. | L2 | 3 Data Transfer Networks (25%); 4 Network and System Operations (25%) | TC-L2-03, TC-L2-04, TC-L2-05 |
| O-7 | **Build — enterprise switching and interior routing.** Build the Packet Tracer topology with a three-tier switching design, VLANs, trunks and explicit Rapid Spanning Tree Protocol root selection, together with OSPF in single area 0 across headquarters and the branch and EIGRP at the Macau office, and document a single, tagged, one-way redistribution point; evidence the design by neighbour, topology and spanning-tree output and by a captured convergence sequence after a deliberate link failure, by the end of week 9. | L3 | 3 Data Transfer Networks (25%) | TC-L3-02, TC-L3-03, TC-L3-04, TC-L3-06 |
| O-8 | **Build — exterior routing and perimeter security.** Establish a basic external BGP session with a simulated transit provider and a second session with an alternate provider, including prefix filtering, outbound path control and a demonstrated failover when the primary session is shut down; deploy the perimeter firewall as the demilitarised-zone boundary with security levels, object groups, access lists, static and dynamic address translation and a site-to-site IPsec tunnel; evidence each by protocol output and by a captured denied flow, by the end of week 8. | L3 | 3 Data Transfer Networks (25%) | TC-L3-01, TC-L3-05 |
| O-9 | **Automate.** Implement infrastructure as code in a single Git-tracked repository: at least five PowerShell scripts covering user onboarding, directory health reporting, device configuration backup, endpoint testing and policy backup; at least nine Ansible playbooks with roles and templates that configure both the Linux estate over SSH and the Windows estate over WinRM from one control node; and at least five Bash scripts covering hardening, atomic firewall application with rollback, failover checking, backup and certificate renewal — with **every** artefact re-run and shown to change nothing on its second execution, by the end of week 10. | L4 | 5 Infrastructure Automation (15%); 4 Network and System Operations (25%) | TC-L4-01, TC-L4-02, TC-L4-03, TC-L4-04 |
| O-10 | **Monitor and observe.** Deploy a monitoring stack that collects host and device metrics and aggregates logs, with provisioned dashboards covering overview, security and availability, and with alert rules held as version-controlled files; demonstrate at least three alerts firing and then resolving, and demonstrate the device-discovery and traffic-analysis tooling (syslog, SNMP version 3, packet capture on the Linux estate) required by the standard's discovery requirement, by the end of week 10. | L4, L5 | 4 Network and System Operations (25%); 3 Data Transfer Networks (25%) | TC-MON-01 |
| O-11 | **AI-assisted operations (proof of concept).** Build and demonstrate an agent runtime with a strictly read-only tool surface of four declared tools that turns a real alert into (a) a triage note with evidence and (b) a *proposed* configuration change in diff form, with every invocation logged, a hard rate limit, read-only credentials that grant nothing else, and output always labelled as requiring human approval; demonstrate at least two capabilities end to end and record a false positive or a hallucination honestly if one occurs, by the end of week 10. | L5 | 1 Work organization and management (5%) — as innovation beyond the standard; no direct domain coverage exists | TC-L5-01, TC-L5-02, TC-L5-03 |
| O-12 | **Troubleshoot and verify.** Execute the complete test plan so that every numbered test case is run against the built environment, including a deliberate misconfiguration that is diagnosed and corrected, a rogue address-server test shown to be blocked, and a failover test at each redundancy layer; record the result, the command transcript and the evidence for each, and state the simulated-versus-genuine limitation of every measurement, by the end of week 11. | All five lines | 6 Troubleshooting (25%) | TC-TS-01, plus all TC-{LINE}-NN |
| O-13 | **Document and hand over.** Produce the full documentation set required by the topic sheet — findings, manuals, steps, screen captures, verifications and references — structured as a design document, per-technology build runbooks, a test plan with executed records, an evidence library with a consistent capture-naming convention, a reference library, and a traceability matrix that maps every technology named in the topic sheet to a report section and a test case identifier; obtain supervisor sign-off by the end of week 12. | All five lines | 6 Troubleshooting (25%) — *"Prepare a technical document reflecting the solution in detail for agreement and sign-off"*; 1 Work organization and management (5%) | TC-DOC-01 |
| O-14 | **Manage the project.** Operate the project as a controlled engineering activity through a four-person team with named owners: a published twelve-week schedule with entry and exit criteria at each weekly gate, a live risk register reviewed weekly, a decision log recording every open design question and its closure, and a repository in which every deliverable has exactly one accountable owner and one independent reviewer, maintained from week 1 to week 12. | All five lines | 1 Work organization and management (5%); 2 Communication and interpersonal Skills (5%, indirect) | TC-PM-01 |

### 2.3 Deliverables

The deliverables fall into three groups. Each item names its accountable owner role and the
evidence by which its completion is judged.

#### (a) The working technical environment

| # | Deliverable | Evidence of completion |
|---|---|---|
| D-A1 | The final Packet Tracer project containing the full Layer 2 and Layer 3 topology, with OSPF, EIGRP, basic BGP, Rapid Spanning Tree Protocol, HSRP and perimeter firewall policy all operational, plus the staged build files that record progress. | Saved project file, device configuration listings, protocol and spanning-tree output, a captured convergence sequence and a captured denied flow. |
| D-A2 | Nineteen virtual machines — nine Windows Server guests and ten Ubuntu Linux guests — built on the single hypervisor host from two sysprepped templates, addressed and named according to the design, with every pinned software version recorded from the running system. | Host inventory, per-guest version output, and a "version deviations" list recording any difference from the pinned list. |
| D-A3 | A working directory and identity service: the domain operational with its organisational unit structure, groups, service accounts, delegated administration, Group Policy baselines and audit policy, replicated across headquarters and cached at the branch. | Directory health and replication output, policy backup, and demonstration of least privilege by a refused action. |
| D-A4 | Working network services across both platforms: directory-integrated name resolution, leased addressing with a failover partner, time synchronisation, file services with enforced quota and file screening, block storage attached to the platform tier, certificate-based remote access, reverse proxying with load-balanced failover, an egress filter with logging and translation, two independent encrypted tunnels, and a monitoring stack with dashboards and alerts. | One transcript and one screen capture per service, plus at least one enforcement or failure event per control claimed. |
| D-A5 | An automation repository that can rebuild and verify the estate: PowerShell scripts, Ansible playbooks with roles and templates, Bash operations scripts, an inventory, and a shared module — with run logs committed as evidence. | Second-run output reporting no changes, playbook run logs, and the version-control history. |
| D-A6 | A demonstrated AI-assisted operations proof of concept with a read-only tool surface, an invocation log and a declared evaluation of where it helped, where it wasted time and where a human was required. | Agent transcripts for at least two capabilities, the tool manifests and allow-list, and the written evaluation including any failure. |

#### (b) The documentation set

| # | Deliverable | Content |
|---|---|---|
| D-B1 | Design document | The architecture, site and zone model, addressing and VLAN plans, routing and switching design, service design, naming conventions and the decision log. |
| D-B2 | Build runbooks | One per technology: reproducible, ordered build steps with the commands used, the values expected, and the capture taken at each checkpoint. |
| D-B3 | Test plan and executed test records | Every numbered test case with its objective, preconditions, procedure, expected result, actual result, verdict and evidence reference, including the deliberate-failure and denial tests. |
| D-B4 | Evidence library | Screen captures and command transcripts, named to a single convention of date, host and subject, each traceable to a test case. |
| D-B5 | Reference library | One archived file per citation — standards, requests for comments, vendor documentation — with the access date, since no URL may be written from memory. |
| D-B6 | Traceability matrix | Every technology named in the topic sheet mapped to the design section, the build runbook, the test case identifier and the report section, with any technology not implemented marked as such. |
| D-B7 | Management records | Group charter with roles and ownership, twelve-week schedule, risk register, decision log, meeting minutes and the two-person review records for automation changes. |

#### (c) The demonstration and defence

| # | Deliverable | Content |
|---|---|---|
| D-C1 | Live demonstration | The environment demonstrated working end to end, following the client's five due-diligence conditions as the narrative thread, with the evidence shown from the repository rather than from memory. |
| D-C2 | Controlled failure and repair | One component deliberately broken in front of the assessor and diagnosed and repaired using the documentation the group wrote, demonstrating that the runbooks and the troubleshooting capability are real. |
| D-C3 | Defence | A presentation of the design decisions and their justifications, the honest limitations of the simulated and emulated layers, and the declared scope of the AI proof of concept, followed by questions. |

### 2.4 Success Criteria

The project is judged complete only when **all** criteria below are met. The third column names
the artefact that proves each criterion; a criterion without evidence is treated as unmet.

| # | Criterion (measurable) | Evidence required | Threshold |
|---|---|---|---|
| S-1 | Directory service is operational and healthy across both headquarters domain controllers and the branch read-only domain controller. | Health and replication output; demonstration that a branch logon continues during a simulated headquarters link outage. | All tests pass; no unresolved replication error at the final check. |
| S-2 | Every service named in the design's port and protocol matrix is reachable from its permitted source zone and unreachable from every zone that should not reach it. | Reachability and denial transcripts. | 100 per cent of permitted paths proven reachable; 100 per cent of the designated denial tests proven blocked. |
| S-3 | Automation artefacts are idempotent. | Second execution of every script and playbook. | Zero changes reported on the second run for every artefact; no exceptions. |
| S-4 | High-availability behaviour is demonstrated at both the network and the service layer. | Failover captures at each redundancy layer, and a captured convergence sequence after a link failure in the simulator. | Every failover completes and the service continues to answer; simulator timings labelled as simulated. |
| S-5 | Certificate-based encrypted remote access works without any shared secret serving as the sole authenticator. | Client connection detail showing certificate authentication, and the client routing table showing that split tunnelling is disabled. | Connection succeeds for an authorised user; is refused for a user removed from the authorising group. |
| S-6 | The documentation set is complete and traceable. | The traceability matrix, the test records and the evidence library. | Every technology named in the topic sheet maps to at least one report section and one executed test case; no orphan evidence and no unmapped technology. |
| S-7 | The environment is reproducible from a clean host. | A clean-host rebuild walkthrough performed from the runbooks by a member who did not write them. | The rebuild reaches a working state with only documented deviations, all of which are recorded. |
| S-8 | The AI-assisted operations proof of concept works end to end within its declared read-only scope. | Agent transcripts, the tool manifests, the invocation log and the evaluation. | At least two capabilities demonstrated; no write path demonstrated or present; failures documented rather than omitted. |
| S-9 | Claims in the report match the running system. | Version output from each component against the pinned version list. | Any difference appears in a version-deviations subsection with its impact stated. |
| S-10 | Schedule and management discipline are maintained. | Weekly gate records, risk register and decision log. | Every weekly gate either met, or missed with a recorded decision and a recorded recovery action. |

---

## 3. Project Scope

### 3.1 In Scope

The five technology lines below define the technical boundary of the project. They are reproduced
first exactly as the topic sheet names them, including the sheet's own wording and spelling:

> You will study, build, configure, troubleshoot, and document complex enterprise networks using
> various telecom technologies (including but not limited to):

- Microsoft Server Networking and Network Services (e.g., ADDS, FSRM, iSCSI, RRAS, IKEv2, etc.)
- Linux Server Administrations (e.g., Nginx, Keepalived, nftables, OpenVPN/Wireguard, etc.)
- Cisco Networking (e.g., BGP, OSPF, EIGRP, RSTP, ASA, etc.)
- Network Automation (e.g., PowerShell scripting, Ansible Playbook, Bash shell scripting, etc.)
- AI Network Management (e.g., Agentic AI, OpenClaw Skills, etc.)

Two notes on the wording above are recorded so that no later reader mistakes them for editorial
carelessness. The topic sheet writes the tunnel technology as "Wireguard" in its Linux line; the
product's own name is WireGuard, and this proposal uses "WireGuard" when it discusses the product
itself and the sheet's spelling only inside quotations of the sheet. The sheet also writes the
directory service as "ADDS", which this proposal expands on first use as Active Directory Domain
Services (ADDS) and then uses in the sheet's form. The phrase "including but not limited to" is
significant for scope: the five lists are illustrative, so Section 3.2 states explicitly which
additional technologies the project takes on and which it declines.

Each sub-section below states the technologies that will actually be implemented, and the specific
work that constitutes implementation.

#### 3.1.1 L1 — Microsoft Server Networking and Network Services

Active Directory Domain Services (ADDS), File Server Resource Manager (FSRM), iSCSI, Routing and
Remote Access Service (RRAS) and IKEv2 will be implemented, together with the supporting roles the
design requires.

- **ADDS:** one forest, one domain and one tree (`vertexpeak.fyp.lab`, NetBIOS `VERTEXPEAK`,
  functional level Windows Server 2025); two writable domain controllers at headquarters with
  directory-integrated DNS, DHCP and Active Directory Certificate Services; one read-only domain
  controller at the Kwun Tong branch; a four-site Active Directory site topology with every subnet
  mapped to a site; and a full organisational unit structure covering users, computers, groups,
  service accounts, administrators, network objects and quarantine.
- **FSRM:** quota templates applied per share, at least one file group with a blocking file screen,
  storage reports, and the evidence of an actual quota breach and an actual blocked write.
- **iSCSI:** an iSCSI target server presenting three LUNs (20 GB, 40 GB and 60 GB thin) over a
  dedicated storage network, with challenge-handshake authentication enabled per initiator, and
  the LUNs attached and mounted by the platform tier.
- **RRAS:** the Routing and Remote Access Service role providing remote-access VPN together with
  Network Policy Server acting as the RADIUS authorisation and accounting service.
- **IKEv2:** certificate-authenticated IKEv2 remote access using machine and user certificates, with
  preshared-key IKEv2 forbidden by design and split tunnelling disabled.
- **Supporting roles required by the design:** Active Directory-integrated DNS with forward and
  reverse zones, conditional forwarding for the simulated public namespace and redundant resolvers
  pushed to every client; DHCP with a load-balanced failover partner relationship and relay at
  every gateway; network time synchronisation with the domain controllers as the forest source;
  certificate services issuing the internal public key infrastructure; Group Policy baselines for
  workstations, member servers, the demilitarised zone and domain controllers; file sharing with
  DFS replication targets; and a privileged-access workstation as the administrative entry point.

#### 3.1.2 L2 — Linux Server Administrations

Nginx, Keepalived, nftables, OpenVPN and WireGuard will be implemented, together with the
supporting Linux services the design requires.

- **Nginx:** a reverse-proxy pair in the demilitarised zone terminating TLS and re-encrypting to
  the application tier, publishing the portal and blog names, with upstream pools, hardened TLS
  policy and a documented certificate chain; plus Nginx with PHP-FPM and MariaDB on the content
  nodes.
- **Keepalived:** two independent VRRP pairs — one on the egress filter pair and one on the
  reverse-proxy pair — each with a floating virtual address, priorities, preemption and health
  checks that test the service rather than merely the interface, and each demonstrated by a
  captured failover.
- **nftables:** a single inet-family ruleset with default-deny input and forward policies, stateful
  connection tracking, address sets for trusted peers, masquerading on the outward interface,
  connection limiting against abuse, a log prefix before every drop, and an atomic apply script
  with a rollback timer so that a bad ruleset cannot lock the team out of a remote host.
- **OpenVPN:** a full TLS virtual private network with its own certificate authority built with
  Easy-RSA, per-client configuration, transport hardening, pushed routes restricted to the
  prefixes actually required, disabled duplicate-client support, and a revocation test in which a
  revoked client is shown to fail.
- **WireGuard:** a modern tunnel implementation using the in-kernel module, with per-peer keys,
  restricted allowed-prefixes (never a default route on a site-to-site peer), restricted keepalive
  behaviour, and key material excluded from version control.
- **Supporting Linux work required by the design:** a hardened Ubuntu server baseline applied to
  every Linux guest (kernel parameters, SSH restrictions, unattended security updates, audit
  daemon); a monitoring and log-aggregation stack; the automation control node and version-control
  server; a demilitarised-zone jump host as the only management path into that zone; and an
  off-host configuration and evidence backup.

#### 3.1.3 L3 — Cisco Networking

BGP, OSPF, EIGRP, RSTP and the ASA perimeter firewall will be implemented in Cisco Packet Tracer.

- **OSPF:** single area 0 across headquarters and the Kwun Tong branch, with authentication on core
  links, passive interfaces toward access ports, and default-information origination at the edge.
- **EIGRP:** classic mode, autonomous system 100, used at the Macau office and on one legacy
  transit segment, with administrative distance left at its default value and that reliance stated
  explicitly.
- **Controlled redistribution:** exactly one redistribution point, with route tags distinguishing
  the two routing domains and one-way redistribution per prefix set, so that redistribution cannot
  loop; mutual untagged redistribution is forbidden by the design.
- **BGP:** basic external BGP between the enterprise edge and a simulated transit provider, with a
  second session to an alternate provider, prefix filtering inbound, path manipulation outbound,
  a maximum-prefix guard, a local-preference demonstration and a captured failover when the
  primary session is closed.
- **RSTP:** Rapid Spanning Tree Protocol across the headquarters switching layer with explicit root
  primary and secondary selection, PortFast and BPDU guard on access ports, root guard on the
  expected root ports, and a captured topology-change and convergence sequence presented as a
  simulation behaviour rather than a real-world timing.
- **ASA:** the perimeter firewall as the demilitarised-zone boundary, with security levels, object
  groups, access lists implementing the trust-boundary rules, dynamic and static address
  translation, an inspection policy for the protocols the design permits, logging to the central
  log receiver, and a site-to-site IPsec tunnel with IKEv2 to the Wan Chai office.
- **Supporting network work required by the design:** a three-tier switching topology with VLANs,
  trunks and a blackhole VLAN for unused ports; HSRP gateway redundancy at headquarters;
  first-hop redundancy comparison between HSRP and the Linux VRRP implementation; port security
  and DHCP snooping; and a simulated voice service to carry the office telephony VLAN.

#### 3.1.4 L4 — Network Automation

PowerShell scripting, Ansible Playbook and Bash shell scripting will be implemented, plus the
version-control practice that makes them meaningful.

- **PowerShell scripting:** at least five scripts covering new-starter onboarding (account, group
  membership, home directory and storage allocation in one idempotent operation), directory
  health reporting (replication, operations-master roles, name resolution, policy volume and time
  skew exported to a report), network-device configuration backup, executable endpoint testing of
  the service matrix, and policy-object backup — supported by a shared versioned module and a log
  per run.
- **Ansible Playbook:** at least nine playbooks with reusable roles, an inventory covering the
  Linux, Windows, demilitarised-zone, network-device, AI and management groups, group variables
  for the environment, Jinja2 templates for generated configuration, support for both Linux over
  SSH and Windows over WinRM from the same control node, and a check-mode run for every playbook.
- **Bash shell scripting:** at least five scripts covering the hardening baseline, atomic firewall
  application with rollback, failover verification, backup, and certificate expiry checking and
  renewal, with a shared library implementing logging and strict error handling.
- **Version control and review:** a Git repository with branch-per-task working, tagged releases,
  two-person review of every automation change recorded in the minutes, a secret-scanning sweep
  before each release, and committed run logs.
- **Configuration as code for the Cisco layer:** the intended device configurations are maintained
  as files in the same repository, so that the network configuration has a reviewable source of
  truth even though the simulator exposes no management interface to external tooling. This
  limitation and the two-track treatment it requires are stated in the out-of-scope and
  limitations material rather than hidden.

#### 3.1.5 L5 — AI Network Management

Agentic AI, OpenClaw Skills and a Model Context Protocol-compatible tool surface will be
implemented as a bounded proof of concept on a dedicated Linux guest.

- **Agentic AI:** an agent runtime that accepts an alert or a schedule trigger, calls at most four
  declared read-only tools, and produces a triage note with evidence references and a *proposed*
  configuration change in diff form. It never applies a change.
- **OpenClaw Skills:** a skill surface consisting of four manifests — alert triage, interface
  health, authentication-failure reporting and documentation drafting — with the runtime's
  version, capability and skill format established empirically during a timeboxed feasibility
  spike before the line is relied upon.
- **Model Context Protocol (MCP):** the read-only tool surface is defined as MCP-compatible tool
  definitions so that it remains usable with or without a specific agent runtime, and the
  specification actually read by the group is cited.
- **Guardrails:** read-only credentials granted no other privilege; no stored device credentials
  beyond that account; every invocation logged with a prompt hash and the list of tool calls made;
  a hard rate limit on tool calls; a network path that reaches only the management ports the design
  permits; and output always labelled as proposed and requiring human approval.
- **Declared fallbacks:** if the named runtime cannot be installed or evaluated, an equivalent
  generic agent loop implementing the identical four-tool surface will be built and the
  substitution reported; if no language-model access is available at all, only the deterministic
  collectors, correlation rules and report generator will be demonstrated, with the agent
  architecture retained as design work and the reduced demonstrated scope stated plainly.

### 3.2 Out of Scope

The following items will **not** be delivered. Each exclusion is deliberate, and the reason is
recorded so that the boundary of the project is auditable rather than implied.

| # | Excluded item | Reason for exclusion |
|---|---|---|
| X-1 | Physical network hardware of any kind — routers, switches, firewalls, access points, servers, storage arrays, transceivers and cabling. | Fixed by the client constraint: nothing may be ordered, assumed present or required for any verification step. All network devices exist as logical devices inside the simulator; all servers exist as virtual machines. |
| X-2 | Production deployment, real customer data, and any real public IP address or registered domain name. | The project is an academic build. Only private address ranges and documentation address ranges are used, only reserved example names are published, and no real customer data is ever loaded. |
| X-3 | Any licensed commercial software that cannot be obtained free of charge, under evaluation, or under an academic licence. | No software budget exists. Every component in the design is free, evaluation-licensed or academic-licensed, with a named alternative where an entitlement is uncertain. |
| X-4 | Cisco SDN controllers, software-defined wide-area networking and fabric technologies. | The topic sheet for this project does not request them; software-defined networking is the subject of a sibling topic. The standard mentions controller-based and software-defined approaches as knowledge, and the project documents that knowledge without building it. |
| X-5 | Internet Protocol version 6. | The design is IPv4-only, stated explicitly so that an IPv6 omission is not mistaken for an oversight. The standard names IPv6 in its addressing knowledge line, and the design's addressing plan is documented as deliberately IPv4-scoped. |
| X-6 | Windows Server failover clustering, scale-out file server, live migration and storage spaces direct. | Cannot be demonstrated honestly on a single hypervisor host without nested-virtualisation risk and without a genuine shared-storage path. Listed as future work, not delivered. |
| X-7 | Hypervisor-level or whole-virtual-machine backup. | No hypervisor-level backup entitlement exists. The backup deliverable is a configuration and evidence backup, and it is described as exactly that. |
| X-8 | Physical-layer high availability: link aggregation across physical chassis, dual power supplies, uninterruptible power, structured cabling and console access. | No physical hardware exists, so these scenarios are documented as unimplementable rather than attempted. |
| X-9 | Cloud identity, hybrid identity, mail systems, collaboration platforms, endpoint management suites and enterprise systems-management suites. | Not named in the topic sheet, outside the project's licence envelope, and unnecessary for any of the five contractual conditions the project exists to satisfy. |
| X-10 | Container orchestration and container platforms. | Not named in the topic sheet and not required by any line; including them would consume schedule without strengthening any claimed outcome. |
| X-11 | Infrastructure-as-code tooling other than Ansible, and any configuration-management tool that would compete with it, including the Windows native configuration platform. | One configuration model is deliberately chosen. Running two competing models would make the idempotence claim unverifiable and would double the learning cost. |
| X-12 | Continuous integration and continuous deployment pipelines. | The standard requires knowledge of the concepts, and the project documents them and runs a peer-review workflow; a pipeline would introduce infrastructure the group must not depend on. Stated as documented-but-not-built. |
| X-13 | Model-driven network automation languages and protocols that were removed from the standard's automation section in the 2026 edition, and Python as a claimed standard-backed automation language. | The 2026 edition of the standard no longer lists them; claiming them as standard-backed would be factually wrong. They are recorded as future work only. |
| X-14 | Autonomous remediation — any agent, script or automation that writes changes to a device, a directory service or a firewall without human approval. | Excluded on safety and academic-integrity grounds: unsupervised automated change would make the project's verification results irreproducible. The exclusion is a design decision and is presented as one. |
| X-15 | Model training, model fine-tuning, graphics-processor inference, predictive analytics and anomaly detection using trained models, and network digital-twin or intent-based platforms. | No graphics processor exists in the environment, no labelled dataset exists to justify a trained model, and none of these is required by the topic sheet within twelve weeks. Listed as future work. |
| X-16 | A security certification, penetration-test claim or compliance attestation of any kind. | The design is *aligned with* selected good practice; it is not certified against anything. All tests are self-directed against the group's own isolated segments. |
| X-17 | Any performance, throughput or convergence figure presented as a real-world measurement. | The Cisco layer is a simulator, which models protocol behaviour rather than hardware. Every such figure is labelled simulated, or it is not stated at all. |
| X-18 | Conformance to the WorldSkills Occupational Standards as an assessment or certification claim. | The standard is used as a reference framework for the competency the project demonstrates and for the quality of its documentation, not as a compliance obligation. |

### 3.3 Constraints

| # | Constraint | Consequence for the project |
|---|---|---|
| C-1 | **Twelve weeks.** The project delivers against a fixed twelve-week schedule with a weekly review gate, and the schedule is one academic term. | Scope is prioritised in four bands — must, should, could and won't — and the must band is protected. A technical freeze applies after the ninth week: after that point no new technology may be introduced, and the remaining time is spent testing, evidencing and writing. |
| C-2 | **All-virtual lab; no physical hardware whatsoever.** | Every verification claim must be supportable in software. Nothing may be demonstrated that requires a physical port, a physical link state or a physical console. |
| C-3 | **Cisco work is performed in Cisco Packet Tracer only.** | The simulator is not an emulator: it models command syntax and protocol logic but not hardware forwarding, real timing or scale. It also exposes no management interface reachable from external automation tooling, so network-device automation is documented in a two-track approach and no claim of automated device configuration is made. |
| C-4 | **A four-person team.** | Four workstreams — identity and Windows, Linux and services, Cisco and simulation, and automation with monitoring and AI, the last also acting as documentation integrator — each with exactly one accountable owner and one independent reviewer. Two of the four hold the highest privilege tier and two the second, so the tiering model is exercised rather than described. |
| C-5 | **Single hypervisor host.** | The nineteen virtual machines must fit one student-owned physical machine. Memory, not processor, is the binding constraint, and a two-shift arrangement (running the server zone and the demilitarised zone in separate sessions) is the declared fallback. |
| C-6 | **Licensing and availability.** No commercial licence is purchased. The server operating system is used under an evaluation or campus entitlement; the hypervisor is used under a free personal entitlement whose continued applicability must be re-checked at build time; the simulator comes from the group's academy account; and the AI runtime's licence, version and capabilities could not be confirmed during design and must be established empirically. | Every uncertain entitlement has a named alternative or a declared fallback, and any substitution actually taken is recorded in the report rather than silently absorbed. |
| C-7 | **Network isolation.** The lab must never bridge to the campus network or a home network. | Bridged networking is forbidden. All lab traffic is confined to host-only virtual networks, and where a virtual machine must also reach the internet for updates, that access is treated as a maintenance path and not as a production path. |
| C-8 | **Language and academic conventions.** The team is Hong Kong based and all deliverables are written in academic English, with documentation conventions consistent across four authors. | The design fixes naming, addressing and identity values before writing begins, and the documentation integrator runs a consistency sweep against those fixed values before every release. |
| C-9 | **Individual hardware risk.** Each student's own machine is the only hardware. | No group member is the sole holder of any artefact: the repository is centralised and mirrored, and every deliverable has a second reader. |
| C-10 | **Uncertainty in the AI line.** The AI workstream's runtime, skill format, default ports and licence were not confirmable during design. | The line is scoped as a proof of concept with three declared fallback paths designed in advance, and a timeboxed feasibility decision must be taken at the mid-point of the schedule rather than discovered late. |

### 3.4 Assumptions

The assumptions below are carried across from the project's canonical design baseline and are
restated here because scope, schedule and verification all depend on them. Each states the
consequence if it proves wrong.

| ID | Assumption | If the assumption is wrong |
|---|---|---|
| A-1 | Each student has, or can share, one machine with sufficient memory — 64 GB recommended, 32 GB an absolute minimum — capable of running the chosen hypervisor. | Reduce concurrency: run the server zone estate and the demilitarised zone estate in two separate shifts rather than all nineteen virtual machines simultaneously, and record the reduction as a stated limitation. |
| A-2 | The group's Cisco academy account provides a current Packet Tracer build. | Use whatever build the account provides and record the exact version actually used; no third-party or mirrored installer may be used under any circumstances. |
| A-3 | Windows Server evaluation media, or campus media, is available to all four students. | Substitute the previous server release, whose roles cover every requirement of this design, and note the substitution in every affected section of the report. |
| A-4 | The campus network is not required for any in-lab dependency other than operating-system and package downloads. | Pre-download installation media and package caches to the internal server before the build week begins, so that the build is not blocked by network access. |
| A-5 | The standard's published page resolves and continues to display the 2026 edition of the occupational standard for this skill. | The requirements quoted in this proposal were re-verified verbatim against the retrieved source, so they may be quoted as read. If the page content later changes or becomes unobtainable, quote it as previously verified and cite the archived copy in the reference library rather than paraphrasing from memory. |
| A-6 | The group may cite the WorldSkills Occupational Standards as a reference framework for the competency demonstrated and for documentation quality, not as a compliance standard it is assessed against. | State the distinction even more explicitly wherever the standard is mentioned, and remove any wording that could be read as a certification claim. |
| A-7 | All lab domain names and example names are lab-only and will never be registered or resolved publicly. | No impact; this is a naming choice made precisely so that publication is impossible. |
| A-8 | Hong Kong regulatory references are used only as narrative motivation and never as legal advice or a compliance claim. | Soften the scenario wording if the supervisor objects, retaining the business trigger but removing any regulatory assertion. |
| A-9 | Package and version availability in the chosen operating system releases remains as recorded in the design baseline. | Record the version actually present from the running system, list the deviation, and state its impact; the report's integrity rule forbids documenting a version that does not match the running system. |
| A-10 | The AI workstream can reach either a local model or a hosted model endpoint from the lab. | Fall back to the deterministic collectors and correlation engine with a scripted policy, document the substitution, and present the agent architecture as design work with a reduced demonstrated scope. |

### 3.5 Scope Management

Scope is controlled rather than merely written down. Five mechanisms apply.

1. **A single canonical design baseline.** Every hostname, address, VLAN identifier, software
   version, path and naming convention is fixed in one version-controlled baseline document before
   any writing begins. Where a deliverable needs a value, it takes the value from that document,
   and no writer may deviate locally. The baseline is itself versioned and revised formally rather
   than edited informally.
2. **A priority band for every candidate item.** Each item is classified as must, should, could or
   won't. The must band — the core Windows roles, the OSPF, spanning-tree and perimeter work, the
   proxy with failover and the egress filter, and a minimum of three automation artefacts — is
   protected first, and the should and could bands are only started once the band above is
   evidenced.
3. **A formal change request path.** Any proposed addition to or removal from scope is raised in
   the weekly review, recorded in the decision log with its impact on time, risk and dependencies,
   and accepted only by agreement of at least three of the four members with the supervisor aware.
   Accepted changes are reflected in the schedule and in the baseline before work continues.
4. **A technical freeze.** After the ninth week no new technology may be added. The remaining
   weeks are reserved for testing, evidencing, closing decisions and writing. This rule exists
   because the most likely cause of failure in a project of this breadth is starting a seventh
   interesting thing in week ten.
5. **A traceability check at every release.** Before each tagged release, the traceability matrix
   is regenerated and checked for two failure modes: a technology named in the topic sheet with no
   design section and no test case, and a technology claimed as delivered with no evidence
   reference. Either finding blocks the release. The same sweep removes any excluded technology
   that has crept into a "what we implemented" list, so that the boundary between what was built
   and what was not stays honest as the report is edited by four people.

Planned removals follow the reverse of the same discipline. Where an item is dropped — most
plausibly an optional second-tier certificate authority, the voice service, or an individual AI
capability — the drop is recorded with the reason, the affected report sections are corrected, and
the item is moved to future work rather than deleted from the record.

---

## 4. Standards and Compliance Alignment

### 4.1 The Reference Standard

The reference standard for this project is the **WorldSkills Occupational Standards 2026** for the
skill **IT Network Systems Administration**. This is the standard the topic sheet itself names, in
its own reference line:

> Reference: IT Network Systems Administration, WorldSkills Occupational Standards 2026

The standard is published by WorldSkills International and identifies itself as the **WorldSkills
Shanghai 2026** edition. The edition covered by this proposal is the 2026 edition only. The topic
sheet supplies the standard's location in the same reference line, the address having been
verified independently at source, and the exact location of the standard is:

```text
https://worldskills.org/what/projects/wsos/2026/events/611/skills/2447/
```

The standard's own footer carries the timestamp **Last updated: 02.06.2026 13:34 (GMT)**, and the
page's title is *WorldSkills Occupational Standards - IT Network Systems Administration*. The
assessment structure consists of six weighted sections plus a total row, and the full text contains
**131 requirement lines** across those six sections, per the project's research pack's own census (`proposal\research\wsos-2026-2447.md` Section 3.7 and Appendix A). Every statement made in this proposal about
the content of the standard is taken from a machine-verified extraction of that page held in the
project repository (`proposal\research\wsos-2026-2447.md`), in which the page was retrieved
successfully and each extracted requirement line was re-verified verbatim against the retrieved
source with zero mismatches.

The standard's own general notes explain how the structure is used: the standards specify the
knowledge, understanding, skills and capabilities that underpin international best practice in
technical and vocational performance; the standard is divided into distinct sections with headings
and reference numbers; and *"Each section is assigned a percentage of the total marks to indicate
its relative importance within the Standards. This is often referred to as the "weighting". The
sum of all the percentage marks is 100. The weightings determine the distribution of marks within
the Marking Scheme."* The assessment of knowledge and understanding takes place through the
assessment of performance, and the vehicle is the Test Project assessed by the Marking Scheme.

**Table 4.1.1 — WSOS 2026 assessment structure, exact section titles and weightings.**

| # | Section title (exact, as published) | Relative importance (%) | Requirement lines |
|---|---|---|---|
| 1 | Work organization and management | 5 | 23 |
| 2 | Communication and interpersonal Skills | 5 | 12 |
| 3 | Data Transfer Networks | 25 | 20 |
| 4 | Network and System Operations | 25 | 46 |
| 5 | Infrastructure Automation | 15 | 11 |
| 6 | Troubleshooting | 25 | 19 |
| | **Total** | **100** | **131** (census: `proposal\research\wsos-2026-2447.md` Section 3.7 and Appendix A) |

Three structural facts from that table shape this project. First, **75 per cent of the standard
sits in the three 25 per cent technical sections** — Data Transfer Networks, Network and System
Operations, and Troubleshooting — which is the strongest single documentary argument for a
hands-on, troubleshooting-heavy, evidence-heavy project rather than a design-only one. Second,
**Troubleshooting alone is worth 25 per cent**, equal to each of the other technical sections, so
verification and fault-diagnosis capability are first-class scoring material and cannot be treated
as an appendix to the build. Third, the two five-per-cent domains are small in weight but
non-zero, and one of them — Work organization and management — contains the requirement lines that
this project uses to justify its exploration of technology the standard does not yet name.

Two limitations of what the standard can be cited for are recorded here so that they are not
misused later. The standard contains **no time limit and no module structure** — the strings
"hour", "hours", "minutes", "days" and "module" do not occur on the page — so the twelve-week
duration of this project is a client constraint and must never be attributed to the standard. The
standard also contains **no requirement for screen captures or evidence-based assessment**: the
words "screen", "capture", "screenshot" and "evidence" occur zero times. The requirement to produce
"all findings, manuals, steps, screen captures, verifications, and references" comes from the
module's own topic sheet, and this proposal attributes it there. The standard does, however,
require documentation three times, including the line quoted in Section 4.2 below.

### 4.2 Mapping of This Project to the Standard

Table 4.2.1 maps each of the six assessment domains to the project workstreams that develop it and
quotes the most relevant requirement lines verbatim. Quotations reproduce the standard exactly,
including its own spelling and capitalisation, as required by the project's quotation discipline;
where the source's wording is unusual it is left unchanged and not corrected.

**Table 4.2.1 — Domain-by-domain mapping of project workstreams to WSOS 2026 requirements.**

| Domain (weight) | Project workstreams that develop it | Verbatim requirement line(s) from the standard | Coverage |
|---|---|---|---|
| **1 Work organization and management (5%)** | Project management and team organisation; the decision log and baseline discipline; the research done into the standard itself and into each technology; the deliberate introduction of a technology the standard does not yet name; the certification-aligned depth of the Microsoft, Linux and Cisco workstreams. | `The techniques of planning, scheduling, and prioritizing`; `The significance of accuracy, checking, and attention to detail in all working practices`; `The importance of methodical working practices`; `Collaboration and research methods and techniques`; `The value of managing own continuing professional development`; `The speed of IT systems change and the need to maintain currency.`; `Use thorough and efficient research methods to support knowledge growth`; `Be enthusiastic to try new methods, systems, and embrace change`; `Undergo various certification requirements, such as: Cisco, Microsoft, and Linux, specializing in at least one specific area` | Direct |
| **2 Communication and interpersonal Skills (5%)** | Weekly review meetings with recorded minutes; two-person review of every automation change; the design document written for agreement and sign-off; the demonstration and defence; knowledge transfer between four members each holding a different specialism. | `Maintain consistently effective verbal and written communications with colleagues`; `Techniques for effective teamwork`; `Share knowledge and expertise with colleagues and help develop a supportive learning culture`; `Recognize and adapt to the changing needs of colleagues`; `Pro-actively contribute to the development of a strong and effective team` | **Indirect only** — the project has no assessed element that tests interpersonal skill directly; it is developed as a by-product of team practice and of the written deliverable. |
| **3 Data Transfer Networks (25%)** | VLAN, trunking and spanning-tree design; the addressing plan; OSPF, EIGRP and BGP; controlled redistribution; HSRP and VRRP first-hop redundancy; the perimeter firewall access lists, translation and IPsec tunnel; the egress filter; the proxy with failover; the VPN implementations; the monitoring and discovery tooling. | `Provide enterprise-wide connectivity using internal and external gateway routing protocols such as OSPF, BGP and EIGRP`; `Configure access, aggregation and core level switching`; `Provide network load balancing & fault tolerance at routing and switching levels by using GLBP, HSRP, VRRP, LACP, PAgP, etc.`; `Apply basic security configuration for control and data plane`; `Provide network connectivity between remote branches using VPN technologies such as IPSec, SSL VPN, Direct Access, OpenVPN, DMVPN, GRE, etc.`; `Use network discovery and traffic analysis tools such as CDP, NetFlow, Syslog, SNMP and tcpdump.`; `Network segmentation with VLAN`; `Routing and switching concepts`; `Common types of attacks on network protocols and mitigation methods` | Direct — the strongest-covered domain, and this project's largest single technical investment. |
| **4 Network and System Operations (25%)** | Active Directory Domain Services; name resolution; addressing services; time services; remote access; authentication, authorisation and accounting; monitoring; certificate services; file sharing; web hosting; terminal access; backup; certificate auto-enrolment and policy-based configuration; file systems and volumes. | `Install and manage enterprise directory services (ADDS, LDAP)`; `Install and manage domain name services (Windows DNS, BIND)`; `Install and manage dynamic host configuration services`; `Install and manage network address translation services`; `Install and manage network time services`; `Install and manage remote network access services`; `Install and manage authentication, authorization and accounting services`; `Install and manage IT infrastructure resources monitoring systems`; `Setup public key infrastructure services`; `Install and manage sharing services`; `Install and manage web hosting services using modern web servers e.g. Apache, Nginx and IIS.`; `Install and manage backup systems`; `Install and manage client workstations deployment systems`; `Manage file systems` | Direct. Note that the standard's nested examples for monitoring and for the Linux-side certificate authority differ from this project's chosen products; the project states that it implements the *requirement* with different tools rather than claiming the nested examples. |
| **5 Infrastructure Automation (15%)** | PowerShell scripts and shared module; Ansible playbooks, roles, inventory and templates; Bash operations scripts; the Git repository, branching and tagged releases; secret scanning before release; committed run logs; idempotence demonstrated by a second run. | `Setup and run routine infrastructure maintenance operations using various scripting\programming languages`; `Use modern automation tools for systems deployment and configuration management`; `Identify and implement infrastructure as code`; `Importance of code version control`; `Continuous integration and continuous delivery\deployment pipelines concepts`; `Behaviour of infrastructure automation tools.` | Direct for the scripting, tooling and infrastructure-as-code requirements; the continuous-integration line is developed at the level of **knowledge and documented process**, not by building a pipeline — see Section 4.3. |
| **6 Troubleshooting (25%)** | The test plan with numbered test cases; deliberate misconfiguration and its diagnosis; the rogue address-server test; failover tests at each redundancy layer; the denial tests at each zone boundary; the runbooks; the evidence library and traceability matrix; the final technical document and the sign-off. | `Prepare a technical document reflecting the solution in detail for agreement and sign-off`; `The purpose of documenting the completion of the installation or up-grade`; `Select the roles and/or features of the operating/server system e.g. Active Directory Domain Services (role) and Window Server Back-up (feature)`; `Test and rectify any problems and re-test as appropriate`; `Gain user acceptance and record`; `Use system logs to find and identify issues`; `Use network package inspection, connectivity checking tools etc to troubleshoot and identity problems in a network.` | Direct. The quoted documentation line is the standard's own justification for the topic sheet's requirement that students produce a complete, organised documentation set. |

**Coverage arithmetic.** Applying the published weightings to the mapping above gives the
following result. Domains 3, 4 and 6 are each directly served at their full 25 per cent; Domain 5
is directly served at its full 15 per cent for scripting, tooling and infrastructure as code;
Domain 1 is directly served at its full 5 per cent. Domain 2, at 5 per cent, is served only
indirectly, because the project contains no element that independently assesses interpersonal
skill. The arithmetic is therefore:

| Domains directly served | Sum of weightings |
|---|---|
| 1 (5%) + 3 (25%) + 4 (25%) + 5 (15%) + 6 (25%) | **95%** |
| Domain 2 (5%) | **5% — indirect only** |
| Total standard | 100% |

**This project develops 95 per cent of the weighted standard directly, with Domain 2 covered only
indirectly.** That is the honest headline figure, and it is deliberately not rounded up to 100.
The five-per-cent indirect band corresponds to a real gap in the project's design: nothing in the
build tests listening skill, verbal communication under pressure or the resolution of conflicting
demands between colleagues. What the project does provide is the written communication line —
`Maintain consistently effective verbal and written communications with colleagues` — through the
documentation set, two-person reviews and minutes, and the teamwork lines through a four-person
split with named ownership and independent review.

### 4.3 Honest Gap Disclosure

The topic sheet names several technologies that the standard does not name. Disclosure of that gap
is a requirement of this proposal's integrity rules: a technology must never be presented as a
standard requirement when it is not one. Machine-verified occurrence counts confirm that the
following strings occur **zero times** in the 2026 standard — not in its visible text and not in
its raw markup.

**Table 4.3.1 — Technologies named in the topic sheet but absent from the WSOS 2026 standard, and
the justification used instead.**

| Technology | Named in WSOS 2026? | Best available hook in the standard | How this project justifies it |
|---|---|---|---|
| FSRM (File Server Resource Manager) | No — 0 occurrences | `Install and manage sharing services` (Domain 4, nested `SMB`, `DFS`, `NFS`, `FTP`); `Manage file systems` (Domain 4) | Justified from the topic sheet itself, which names FSRM explicitly, and positioned as an implementation of the generic sharing-and-file-system requirements. |
| iSCSI | No — 0 occurrences | `Manage file systems` (Domain 4, nested `LVM/Dynamic disks`); `Install and manage backup systems` (Domain 4) | Justified from the topic sheet, which names iSCSI explicitly; it is the block-storage implementation of the standard's generic storage requirement, and it is what makes the platform tier's recoverability a real property rather than a diagram. |
| RRAS (Routing and Remote Access Service) | No — 0 occurrences | `Install and manage remote network access services` (Domain 4, nested `SSH`, `Remote Desktop Services`); `Install and manage authentication, authorization and accounting services` (Domain 4) | Justified from the topic sheet; the standard's own remote-access and authentication lines describe the function, and RRAS is the Microsoft implementation of it in this design. |
| IKEv2 | No — 0 occurrences | `Security protocols to secure local and wide area networks` (Domain 3, knowledge); `Provide network connectivity between remote branches using VPN technologies such as IPSec, SSL VPN, Direct Access, OpenVPN, DMVPN, GRE, etc.` (Domain 3) | Justified from the topic sheet and from the standard's generic secure-tunnel requirement. The standard names IPSec, which IKEv2 negotiates; this is presented as a bridge, not as a quotation. |
| Keepalived | No — 0 occurrences | `Provide network load balancing & fault tolerance at routing and switching levels by using GLBP, HSRP, VRRP, LACP, PAgP, etc.` (Domain 3) | Justified through the named protocol rather than the product: **VRRP is named in the standard and Keepalived is a VRRP implementation.** This is the strongest bridge available for any of the twelve technologies in this table, and it is presented as an inference from a named protocol, not as a quotation of the product. |
| nftables | No — 0 occurrences | `Apply basic security configuration for control and data plane` (Domain 3); `Common types of attacks on network protocols and mitigation methods` (Domain 3, knowledge); `Security protocols to secure local and wide area networks` (Domain 3, knowledge) | Justified from the topic sheet and from the standard's generic control-plane and data-plane security requirement. The project names the requirement it satisfies and states plainly that the standard does not name the tool. |
| WireGuard | No — 0 occurrences | Only the trailing `etc.` of the Domain 3 VPN line — the weakest hook of the twelve | Explicitly declared as the weakest bridge in this table. Justified by the topic sheet, and given an additional independent purpose: it provides the second, independently implemented tunnel that makes the project's technology comparison meaningful. |
| RSTP (Rapid Spanning Tree Protocol) | No — 0 occurrences in either the 2024 or the 2026 edition | `Configure access, aggregation and core level switching` (Domain 3); `Network topology types and usage scenarios` (Domain 3, knowledge) | Justified as the loop-prevention mechanism of the three-tier switching design the standard's switching line requires. Presented as a bridge from the switching requirement, never as a named requirement. |
| ASA (Cisco Adaptive Security Appliance) | No — 0 occurrences | The Domain 3 VPN line and `Apply basic security configuration for control and data plane` (Domain 3) | Justified from the topic sheet. **The standard must not be read as requiring an ASA**, and this proposal does not present it as such: the firewall is the implementation of the standard's control-plane and perimeter-security requirement. |
| Agentic AI | No — 0 occurrences | None. The nearest lines are Domain 1's currency, research and embrace-change requirements. | Presented as **innovation beyond the standard**, detailed separately in Section 4.4. No compliance claim is made. |
| OpenClaw | No — 0 occurrences | None | As above. The standard contains no product of this kind, and the project does not imply otherwise. |
| MCP (Model Context Protocol) | No — 0 occurrences | None | As above. The tool-surface protocol is a design choice by the group, defined so that the proof of concept is not locked to one runtime, and it is not attributed to the standard. |

**The automation-domain finding.** The gap is not only a list of absent product names; the content
of the automation domain itself changed between editions. The 2026 standard's Infrastructure
Automation section (15 per cent) lists, in its nested technology examples, only **Bash** and
**PowerShell** under the scripting requirement, **Git** under the modern-automation-tools
requirement, and **Ansible.** under the infrastructure-as-code requirement. **Python, YANG,
RESTCONF and NETCONF were present in the 2024 edition of Domain 5 and were removed in the 2026
edition**: occurrence counts fall from Python 2 to 0, YANG 1 to 0, RESTCONF 1 to 0 and NETCONF 1 to
0, while Ansible remains at 1. The wording of one requirement also changed, from `Describe and implement infrastructure as code` in 2024 to `Identify and implement infrastructure as code` in
2026. This project therefore makes no claim that the 2026 standard backs Python, YANG, RESTCONF or
NETCONF, and it lists model-driven and language-based network automation as future work rather than
as delivered scope, even though such work would be technically attractive.

The same discipline applies to a related temptation: the standard requires knowledge of
`Continuous integration and continuous delivery\deployment pipelines concepts`, which is a
knowledge requirement, and of `Importance of code version control`, which this project satisfies in
practice through its repository, branching, review and tagged releases. The project documents the
pipeline concept and operates a peer-review workflow, but it **does not build a pipeline**, and CI
and CD are not listed anywhere in this proposal as delivered.

### 4.4 The AI Network Management Line

The AI Network Management line is the one technology line in this project that receives **zero
coverage** in the reference standard. This is stated plainly because the alternative — implying
that agentic AI network management is a WorldSkills requirement — would be false and could be
contradicted by a single search of the published page. The verified position is as follows.

- The 2026 standard contains **no occurrence** of `Agentic`, `OpenClaw`, `MCP`,
  `Model Context Protocol`, `artificial intelligence` or `machine learning`, in its visible text or
  in its raw markup.
- The same is true of the 2024 edition: this is not a recent removal, it is a genuine absence from
  the skill's published standards.
- A naive search for the two letters "AI" does return hits on the page, but **every one is a
  substring false positive** — the letters occur incidentally inside the words *Shanghai*,
  *daily*, *maintain* and *domain* (as in Sh-ai-nghai, d-ai-ly, m-ai-ntain, dom-ai-n). None of them
  is evidence of AI content, and this project does not cite them as such.
- The 2026 standard's automation domain, at 15 per cent, is the automation of routine
  infrastructure maintenance by script and infrastructure defined as code. It is not, and does not
  claim to be, the automation of operational *decisions*.

The line is therefore positioned as **project innovation beyond the standard**, and its
justification is anchored in the standard's own professional-attribute requirements in Domain 1
(Work organization and management, 5 per cent). Four verbatim lines carry that justification:

> `The speed of IT systems change and the need to maintain currency.`

> `Use thorough and efficient research methods to support knowledge growth`

> `Be enthusiastic to try new methods, systems, and embrace change`

> `The value of managing own continuing professional development`

Read together, these lines describe a professional obligation that is independent of any particular
technology: an IT network systems administrator is expected to keep pace with a field that changes
quickly, to research new methods thoroughly, and to be willing to try systems that did not exist
when their current toolset was chosen. Agentic assistance in network operations is a current
frontier of that change. The project's claim is therefore a claim about *professional behaviour*
under Domain 1 — that the group researched an emerging area properly, bounded it honestly, built a
working artefact with safety guardrails, and reported what did and did not work — and **not** a
claim that the standard requires or assesses agentic AI. The project's own traceability record
classifies this line as having no direct domain coverage.

Three boundaries reinforce the honesty of that framing. First, the line is scoped as a **proof of
concept with a declared scope**: a read-only advisory surface, an evaluation of where it helped and
where it wasted time, and documented failures including any false positive or hallucination, on the
principle that documenting a failure is a stronger academic result than concealing one. Second, the
line has **three pre-designed fallbacks** — an equivalent generic agent loop if the named runtime
cannot be evaluated, re-expression of the tool surface in the runtime's documented format if the
assumed format proves wrong, and a deterministic correlation engine with a scripted policy if no
language-model access is available at all — so that a failure of the technology does not become a
failure of the project. Third, **no autonomous remediation is implemented or claimed**. Nothing in
this project writes a change to a device, a directory service or a firewall without a human
approving it, and that exclusion is a design decision taken for safety and reproducibility rather
than a limitation the group was forced into.

### 4.5 Other Standards and Good Practice

Beyond the WorldSkills Occupational Standards, the design follows the documents in Table 4.5.1.
They are cited by title. Where a document's identity is confirmed by the project's own reference
records the fact is stated; where it is not, the entry is marked as an assumption and the edition
actually consulted must be recorded in the reference library before the final report. No URL is
written from memory anywhere in this proposal, and each cited document is archived as one file in
the reference library with its access date.

**Table 4.5.1 — Other standards, requests for comments and guidance followed by the design.**

| Document (cited by title) | What the design uses it for | Status |
|---|---|---|
| RFC 1918, *Address Allocation for Private Internets* | The authority for every private address range used in the addressing plan. | Confirmed as the applicable reference document for private addressing in this project. |
| RFC 5737, *IPv4 Address Blocks Reserved for Documentation* | The authority for the three documentation address blocks used to represent the simulated public internet, the published demilitarised-zone range and the wide-area peer range. | Confirmed as the applicable reference document; no real public address appears anywhere in the design. |
| RFC 2606, *Reserved Top Level DNS Names* | The authority for the reserved suffix used for every simulated published service name, so that no registered domain name is ever used. | Confirmed as the applicable reference document. |
| RFC 4193, *Unique Local IPv6 Unicast Addresses* | Referenced only to state explicitly that this design is IPv4-only and that IPv6 unique local addressing is out of scope. | Confirmed as the applicable reference document; cited for a scope statement, not for a design decision. |
| RFC 7296, *Internet Key Exchange Protocol Version 2 (IKEv2)* | The protocol reference for the certificate-authenticated IKEv2 remote-access design and the site-to-site tunnel. | The identity of IKEv2 as RFC 7296 is confirmed in the project's reference records; the specific clauses relied upon must be recorded from the copy actually consulted. |
| RFC 4301 and RFC 4303, *Security Architecture for the Internet Protocol* and *IP Encapsulating Security Payload (ESP)* | Background protocol references for the IPsec transport used by the site-to-site tunnel. | [ASSUMPTION] — the editions actually consulted must be recorded; no clause number is cited until it has been read. |
| IEEE 802.1w, *Rapid Reconfiguration of Spanning Tree* (with IEEE 802.1D-2004 and IEEE 802.1Q) | The standard behind the Rapid Spanning Tree Protocol and VLAN design, including root selection, port roles and per-VLAN spanning-tree behaviour. | [ASSUMPTION] — cite the edition actually consulted; no clause number is invented. |
| RFC 1123, *Requirements for Internet Hosts — Application and Support* | The hostname syntax rule applied to every Linux host and to the hostname length discipline applied to all hosts. | [ASSUMPTION] — cite the edition actually consulted. |
| Vendor hardening and configuration guidance for each product version actually installed | The specific hardening settings applied to the server operating system, the Linux baseline, the hypervisor, the web server, the proxy, the firewall families and the directory service. | To be recorded product by product, with the documentation page actually used, its version applicability and the access date, in the reference library. Guidance applied to a different version than the one installed must be identified as such. |
| The simulator vendor's own documentation for the build actually in use | The applicable capabilities and the declared limitations of the simulated Cisco layer, which bound every claim made about it in this proposal. | To be recorded with the exact build it applies to, read from the installed software rather than from the product family name. |
| The project's own canonical design baseline | The single source of every hostname, address, VLAN identifier, software version, path and naming convention used across all deliverables, and the mechanism that prevents four writers from drifting apart. | Internal project document, revision 1.0, version-controlled; deviations require a formal revision. |

Two limits on this table are stated for completeness. First, several entries are recorded by
document identity and title only, because the group's reference records confirm that the document
is the correct one to follow but not which edition or clause was read; those entries carry an
assumption marker and must be closed before the final report, in line with the project's rule that
a reference which has not been read may only be cited as "as cited in" the document that cited it.
Second, this project makes **no compliance claim** against any of the documents above. It follows
the addressing, naming and protocol standards as design authorities, and it aligns with vendor
hardening guidance as good practice; it is not certified against any of them, and the absence of a
formal certification, audit or attestation is stated in the out-of-scope material rather than left
to inference.
