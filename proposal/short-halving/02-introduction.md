## 2. Introduction and background

### 2.1 The topic sheet's own framing

The HDTN topic sheet places the work in a sector changing faster than the qualifications that describe it, and frames it around real-life scenarios, specifically network systems and network administration, recommending it to self-motivated students who want to overcome challenges in real-world situations. The subject is the administrator's occupation as practised: the project is built around an organisation with a commercial reason to need it, and a real environment's dependencies, failure modes and unfinished edges set the depth. That public-sector and international framing is why the scenario spans Hong Kong and Macau, and why a regulated financial-services client drives the design.

The sheet names five technology families under "including but not limited to": Microsoft Server Networking and Network Services (ADDS, FSRM, iSCSI, RRAS, IKEv2); Linux Server Administrations (Nginx, Keepalived, nftables, OpenVPN or WireGuard); Cisco Networking (BGP, OSPF, EIGRP, RSTP, ASA); Network Automation (PowerShell scripting, Ansible playbooks, Bash shell scripting); and AI Network Management (agentic AI and OpenClaw skills). The documentary obligation the sheet imposes - findings, manuals, steps, screen captures, verifications and references - is treated in section 12 as a deliverable.

Screen captures are a requirement of the *brief*, not of the WorldSkills standard. Findings, manuals, steps, screen captures, verifications and references are six distinct artefact classes, each existing separately and traceable to its configuration.

### 2.2 The host organisation and the business trigger

The scenario is the invented host organisation **Vertex Peak Financial Technologies Limited**, a Hong Kong insurance-technology and financial-data services firm that sells software as a service to insurance brokerages, serving 260 of them across Hong Kong and Macau. Its clients are regulated by the Hong Kong Insurance Authority, so the firm must demonstrate least privilege, auditability and protection of client data.

The trigger event is a due-diligence questionnaire from a newly signed brokerage group, whose five demands drive the design:

1. Segregation of the platform production chain from ordinary office users.
2. Documented least-privilege access, with an audit trail of administrative actions.
3. Encrypted remote access using certificate-based authentication, with no shared passwords.
4. Documented recovery and failover behaviour for the customer-facing web tier.
5. Evidence that network change is applied through reviewed, repeatable configuration, not by hand.

The fifth demand makes this an automation project, not a configuration project, and makes an AI management plane coherent rather than bolted on. A five-person information-technology team cannot watch nine Windows servers, ten Linux servers, a routed multi-site network and a published web tier by hand, so the estate is instrumented as it is built, with logging, metrics and a version-controlled configuration archive in place before the AI layer uses them.

### 2.3 What has changed since the earlier frozen design

This proposal supersedes the frozen design baseline in part, a broad, documented enterprise network with a small, deliberately read-only AI proof of concept attached. The clarified intent relaxes or reverses three constraints and withdraws three statements: compute may come from school or laboratory machines, so the "one student laptop and nothing else" limit no longer applies to the model; the AI layer is the assessed differentiator, not the weakest line; and a change may occur, provided a human approves it after reading a fully specified proposal. Withdrawn are the exclusions of model hosting and graphics-processor inference from scope, the exclusion of a graphics processor from the host specification, and the claim that the AI line is optional because the standard does not require it. The baseline's addressing plan, VLAN plan, naming conventions, zone and trust-boundary model, service identities, inventory, test-case identifier scheme and documentation standard carry forward essentially unchanged.
