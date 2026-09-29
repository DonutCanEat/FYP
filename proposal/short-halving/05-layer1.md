## 6. Layer 1 - the network and its services, built first

Every service below is classified **required**, **desirable** or **optional**. Required means part of the defensible minimum core: the project is still a coherent, verifiable enterprise network if nothing else is built. Desirable means build it if the required core is green by the end of week 6. Optional means a stretch item attempted only after everything else is verified and documented. A service with no named host and verification cannot be claimed.

### 6.1 Identity, naming and time

**Active Directory Domain Services** - one identity for every Windows host and administrator, and the service identities the AI tools use; the standard names directory services explicitly - on `vpnz-dc01` and `vpnz-dc02`, verified by a directory health check, a replication summary, a Kerberos ticket listing and a capture of the organisational-unit tree.

**Directory-integrated DNS**, name resolution for every family, and **DHCP**, addresses for the user and remote-access segments on a small scope set, on the same pair with forward and reverse zones and a relay on every gateway; verified by lookups from two families, a zone export, a deliberate negative lookup, and a lease listing with a client renewal.

**Network Time Protocol** - the hierarchy source on `vpnz-dc01` for Windows and `vpnz-mon01` for Linux, verified by a time-source query on both families with skew deliberately injected and corrected. Skew beyond a few minutes breaks Kerberos, and it is the strongest injected-fault scenario for the AI evaluation.

**The internal certification authority** - certificates for the remote-access tunnel, proxy TLS and WinRM over HTTPS, a single tier acceptable, on `vpnz-dc01` with a separate open-source authority on `vpnz-lnxra01` - verified by an authority information query, an issued certificate presented by a client and revocation-list inspection.

Directory **sites, subnets, organisational units and groups** - desirable on `vpnz-dc01`, verified by captures of site and subnet configuration and of the organisational-unit tree.

### 6.2 File, storage and application services

**File-server resource-manager quotas and file screening** - desirable on `vpnz-fs01`, giving the agent a policy to audit - verified by quota and file-screen queries, a blocked write and a quota-exceeded capture.

**Block storage over iSCSI** - desirable, a logical unit presented over the network and mounted as a disk, satisfying the brief's storage line - target on `vpnz-san01`, initiator on one platform guest, verified by target and session queries, an attached disk and the mounted volume.

**Web hosting and reverse proxy with TLS** - required, the published service and the natural "is the business service up?" target for AI triage - on Nginx at `vpnz-dmzrev01` and `vpnz-dmzrev02`. **High availability of the proxy** is required on that pair, because it keeps the published service up when one node dies; Keepalived implements the standard's virtual-router redundancy. Verified by a configuration syntax test, a TLS handshake inspection, an HTTP response and the access log, with a failover capture showing the virtual address move, the failover time and the keepalived journal.

### 6.3 Perimeter, remote access and segmentation

**Host firewall and segmentation** - required, stateful filtering with logging at the chokepoint, whose drop log is one of the richest signals the AI layer will read - on `vpnz-nft01` and `vpnz-nft02`, verified by a ruleset listing, rule monitoring and a denied flow in the log.

**Perimeter firewall, access control and translation** - required, the demilitarised-zone boundary and translation edge, and on the Cisco layer an SSH and RESTCONF target - an ASA-class device, verified by the running configuration, access-list and translation captures and a denied-flow capture.

**Certificate-based remote-access tunnel** - desirable, required if only one tunnel is attempted, satisfying the brief's remote-access and the standard's virtual-private-network lines, with OpenVPN the technology the standard names - on `vpnz-lnxra01`, verified by a client connection record, the client's route table and the server log.

**Site-to-site encrypted tunnel** - desirable, linking the branch to headquarters over the Cisco layer - perimeter device to branch router, verified by a security-association capture, tunnel state and a ping across it. **WireGuard tunnel** - optional on a Linux guest pair, verified by peer state, a completed handshake and an inner ping; a Cisco device cannot terminate WireGuard, so it must not be designed that way.

### 6.4 Routing and switching - the AI-reachable layer

**Open shortest path first, single area** - required, interior routing between headquarters and a branch; **Rapid Spanning Tree Protocol** - required, loop-free layer two with an explicit root, satisfying the access, aggregation and core switching requirement; **virtual LANs, trunks, port security and DHCP snooping** - required, segmentation and control-plane hygiene. All three on the Cisco routers and switches, verified by neighbour and route tables with a link-down convergence capture, spanning-tree output with root-bridge election and a link-pull topology change, and VLAN and trunk listings with a blocked rogue-DHCP capture.

**First-hop redundancy on layer-three gateways** - desirable on core switches or the router pair, verified by redundancy-group output and a failover capture. **Enhanced interior gateway routing protocol** - desirable on a second site or a legacy segment, verified by topology and protocol output with one redistribution point carrying route tags. **Exterior BGP to a simulated provider** - desirable for path selection and failover, and verified from the local autonomous system only, the provider having no management interface, as section 5.4 states - from the edge router, a local session summary, an exterior route table and a session-down failover.

**Link aggregation** - optional on a switch pair, verified by an aggregation summary. **Quality of service, multiprotocol label switching, controller-based management and overlay networking** are optional or excluded, being neither named nor affordable in twelve weeks; if attempted, they must be genuinely configured or listed as future work.

### 6.5 Monitoring, logging and telemetry

This subsection is Layer 1 that Layer 2 consumes, built as part of the network rather than added when the AI layer needs it, because an estate not instrumented while built cannot be retro-instrumented cheaply.

**Metrics collection and dashboards** - required on `vpnz-mon01`, numeric evidence and a machine-readable interface for the AI tools - verified by all scrape targets healthy, a dashboard capture and an alert fired then resolved. **Per-host exporters** - required on every guest for processor, memory, disk and interface series - verified by exporter endpoints responding. **SNMPv3 polling of the Cisco estate** - required, the minimum viable way for the AI layer to see the Cisco devices, authentication and privacy mandatory and community-string versions forbidden - poller on `vpnz-mon01`, agent on every Cisco device, verified by an authenticated and encrypted walk returning data. **Centralised syslog** - required, the single highest-value AI input, all three families in one queryable store - receiver on `vpnz-mon01`, verified by per-host log files and a searchable query for a known event. **Configuration archive under version control** - required on `vpnz-mon01`, change history and the agent's drift baseline - verified by timestamped entries and a commit log.

**Flow export from the Cisco layer** - optional, licence- and image-dependent, edge and switch export to a collector - verified by flow records received or an explicit statement that the image does not support it. **Packet capture** - desirable, the ground truth for a "why is this flow failing" scenario, on any Linux host - verified by a capture file and its read-back.

### 6.6 Automation foundations - the bridge into Layer 2

**Ansible** - required on `vpnz-mon01`, where the Cisco collection and inventory the Cisco MCP server will reuse also live - verified by version output, a connectivity test reaching all three families and a playbook whose second run reports no changes. **PowerShell** scripting - required on the Windows guests, authored on a jump host, driving the Windows management surface the AI tools call - and **Bash** scripting on the Linux guests, both named in the standard, verified by scripts and their logs, with a second PowerShell run producing identical output. **A Git repository and review workflow** - required on `vpnz-mon01`, named in the standard and the audit trail the report can cite - verified by a commit graph and a reviewed merge record.

**Cisco configuration automation over SSH** - required, given a reachable platform; only possible because the Cisco layer is reachable, and replacing the earlier design's declared workaround of playbooks written but never executed against a device - from `vpnz-mon01` to the Cisco devices, verified by a playbook run that changes a configuration and an idempotent re-run.

### 6.7 The defensible minimum core and the staging order

If everything except the required list goes wrong, the project is still a coherent, verifiable enterprise network. The required core is directory services, DNS, DHCP, time and certification services; a TLS-terminated published service behind a highly available proxy pair; host firewall and segmentation; an ASA-class perimeter with access control and translation; interior routing, Rapid Spanning Tree Protocol, virtual LANs and trunks; SNMPv3, syslog and metrics collection; and Ansible, Git, PowerShell and Bash. That core is a subset of the estate section 5 records, and yields the reachable command surfaces, structured metrics, central log store and configuration baselines the AI servers consume.

Within this layer the staging order follows that classification: the required list first, the desirable list once the required core is green by the end of week 6, and the optional list only after everything else is verified and documented.

