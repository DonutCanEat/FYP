## 7. Microsoft Server Networking and Network Services

### 7.1 Overview and Objectives

#### 7.1.1 What this line delivers

[FIGURE: Block diagram of line L1 — the nine Windows Server guests of the design baseline arranged by functional group (identity: `vpnz-dc01`/`vpnz-dc02`; data: `vpnz-fs01`, `vpnz-san01`; access: `vpnz-rras01`; management: `vpnz-jump01`, `vpnz-brdc01`; DMZ consumption: `vpnz-dmzweba01`/`vpnz-dmzweba02`), each labelled with its IP address, VLAN and the sub-section of this report that builds it]

Line L1 of the topic sheet is worded *"Microsoft Server Networking and Network Services (e.g., ADDS, FSRM, iSCSI, RRAS, IKEv2, etc.)"*. This section is the build manual for the whole Windows half of the Vertex Peak lab. It is written so that a reader who has never touched the estate can start from a freshly installed Windows Server guest and end with a functioning identity service, a governed file service, a block-storage service, a routed remote-access service and a certificate-based VPN — each with a command transcript and a screen capture as evidence.

The line is delivered by nine Windows Server 2025 Standard (Desktop Experience) guests plus one management workstation, as fixed in the canonical device and VM inventory (design baseline §6):

| VM | Address | VLAN | Role in this section |
|---|---|---|---|
| `vpnz-dc01` | 10.10.30.11 | 30 `SRV-HQ-1` | First domain controller; all five FSMO roles; AD-integrated DNS; DHCP primary; authoritative NTP source for the forest; AD CS Enterprise Root CA (`VP-ISSUING-CA-01` under the single-tier decision) |
| `vpnz-dc02` | 10.10.30.12 | 30 `SRV-HQ-1` | Second domain controller; DNS redundancy; DHCP failover partner (80/20); Global Catalog |
| `vpnz-fs01` | 10.10.30.21 | 30 `SRV-HQ-1` | File server; FSRM quotas, file screening, classification, storage reports; DFS-R; Windows Backup target |
| `vpnz-san01` | 10.10.80.21 | 80 `STORAGE-HQ` | iSCSI Target Server; LUN01 20 GB, LUN02 40 GB, LUN03 60 GB thin |
| `vpnz-rras01` | 10.10.30.41 | 30 `SRV-HQ-1` | RRAS IKEv2 remote-access VPN; NPS/RADIUS authorisation and accounting |
| `vpnz-jump01` | 10.20.20.31 | 20 `MGMT-OOB` | Privileged access workstation; RDP/WinRM administration entry point; PowerShell 7.4 LTS authoring host; Windows Admin Center gateway |
| `vpnz-brdc01` | 10.10.113.11 (host NIC) / 10.10.113.12 (management) | 113 `BR-MGMT` | Kwun Tong read-only domain controller; branch DNS; local DHCP relay |
| `vpnz-dmzweba01` | 10.10.90.21 | 90 `DMZ-HQ` | IIS application tier node 1 — consumes the certificates issued in §7.4 and the block storage in §7.6 (cross-reference §5 of this report) |
| `vpnz-dmzweba02` | 10.10.90.22 | 90 `DMZ-HQ` | IIS application tier node 2 — as above |
| `vpnz-pki01` | 10.10.30.15 | 30 `SRV-HQ-1` | **[ASSUMPTION]** Optional issuing CA for a two-tier PKI. Left unallocated unless the group takes the two-tier decision (baseline §19 open item O-06) |

Every guest is a full clone of the sysprepped template `W2K25-TEMPLATE-01` except the two domain controllers, which are built directly from installation media so that no cloned SID or stale domain membership exists (baseline §6). Host-only networks are numbered per the baseline's `VNET-*` table; all guests in this section sit on `VNET-SRV` (10.10.30.0/24 → 30 `SRV-HQ-1`) except `vpnz-san01` (`VNET-STOR`, 10.10.80.0/24 → 80 `STORAGE-HQ`), `vpnz-jump01` (`VNET-MGMT`, 10.20.20.0/24 → 20 `MGMT-OOB`) and the two IIS nodes (`VNET-DMZ`, 10.10.90.0/24 → 90 `DMZ-HQ`).

#### 7.1.2 Objectives

1. Establish one forest, one domain, one tree — `vertexpeak.fyp.lab` (NetBIOS `VERTEXPEAK`) — with two writable domain controllers at HQ and one read-only domain controller at Kwun Tong, at forest and domain functional level Windows Server 2025.
2. Implement the exact OU tree, group set and service-account model fixed in the baseline, and demonstrate delegation that respects the two-tier administrative model.
3. Deliver DNS and time as dependable platform services, because every other line depends on them (§3.6 service dependency chain of the baseline).
4. Deliver a working enterprise PKI that makes certificate-based IKEv2 VPN authentication possible without a preshared key anywhere in the design.
5. Deliver a governed file service in which quota and file-type policy are enforced by the operating system rather than by convention.
6. Deliver a block-storage service (iSCSI LUN) that the platform tier can attach, detach and re-attach deterministically.
7. Deliver routed remote access and an IKEv2 remote-access VPN with machine plus user certificate authentication, authorised through NPS against `GG-VPN-Users` and `GG-VPN-ProfServices`.
8. Produce the command-and-capture evidence trail that the topic sheet demands ("findings, manuals, steps, screen captures, verifications, and references").

#### 7.1.3 Which WSOS 2026 domains this line develops

The WorldSkills Occupational Standards 2026 for Skill 2447 *IT Network Systems Administration* (WorldSkills Shanghai 2026 edition) carries the following section weightings, taken verbatim from the assessment table: *Work organization and management* 5 %, *Communication and interpersonal Skills* 5 %, *Data Transfer Networks* 25 %, *Network and System Operations* 25 %, *Infrastructure Automation* 15 %, *Troubleshooting* 25 % (baseline §11.6; full verified extraction in `proposal\research\wsos-2026-2447.md`).

| WSOS domain | Weight | What this section contributes |
|---|---|---|
| 4 — Network and System Operations | 25 % | The core. Domain 4 requires the candidate to `Install and manage enterprise directory services (ADDS, LDAP)`, `Install and manage domain name services (Windows DNS, BIND)`, `Install and manage dynamic host configuration services`, `Install and manage network time services`, `Install and manage remote network access services`, `Install and manage authentication, authorization and accounting services`, `Setup public key infrastructure services` (nested `Active Directory Certificate Services`, `OpenSSL`), `Install and manage sharing services` (nested `SMB`, `DFS`, `NFS`, `FTP`), `Install and manage backup systems` (nested `Windows Server Backup`, `rsync`, `Script based backup…`) and `Manage file systems` (nested `Software RAID`, `mdadm`, `LVM/Dynamic disks`, `File systems such as NTFS, ReFS, EXT4 and NTFS.`) |
| 6 — Troubleshooting | 25 % | §7.12 of this section is a ten-plus-case failure-mode register, and every build step in §7.3–§7.8 ends in a verification command whose output is a diagnostic artefact. Domain 6 also carries the documentation obligation quoted in §7.1.4 below. |
| 3 — Data Transfer Networks | 25 % | Shared with the Cisco line. This section contributes `Security protocols to secure local and wide area networks` and the generic VPN line (`Provide network connectivity between remote branches using VPN technologies such as IPSec, SSL VPN, Direct Access, OpenVPN, DMVPN, GRE, etc.`), through the certificate-secured IKEv2 tunnel |
| 1 — Work organization and management | 5 % | Methodical runbook discipline, `Undergo various certification requirements, such as: Cisco, Microsoft, and Linux` (the Microsoft half is served by the depth of this line), and the evidence-management discipline of §7.11 |
| 5 — Infrastructure Automation | 15 % | Cross-referenced, not duplicated: the WinRM surface created in §7.3.1 and §7.10 is the transport that the Ansible control node `vpnz-mon01` uses to reach every Windows guest (report §10) |

#### 7.1.4 Honesty statement about the standard (mandatory)

Four of the five technologies in this line are **not named anywhere in the WSOS 2026**. The strings `FSRM`, `iSCSI`, `RRAS` and `IKEv2` each occur **0 times** in the 2026 standard text *and* 0 times in the 2026 raw HTML; the same is true of the 2024 edition. They are therefore **project choices justified from the topic sheet's own wording**, not standard requirements. The generic hooks that legitimately carry them are:

- FSRM → `Install and manage sharing services` (nested `SMB`, `DFS`) and `Manage file systems` (Domain 4).
- iSCSI → `Manage file systems` (nested `LVM/Dynamic disks`, `NTFS`, `ReFS`) (Domain 4).
- RRAS → `Install and manage remote network access services` (nested `SSH`, `Remote Desktop Services`) (Domain 4).
- IKEv2 → the Domain 3 VPN line's `IPSec` mention and the Domain 3 know/understand line `Security protocols to secure local and wide area networks`.

Only **AD DS** is named explicitly: `Install and manage enterprise directory services (ADDS, LDAP)`. `Active Directory Certificate Services` and `Group Policy` are also named, so §7.4 and §7.3.6 are the two parts of this section with direct standard backing.

The requirement to capture screenshots is **not** a WorldSkills requirement. The strings `screen`, `capture`, `screenshot` and `evidence` occur **0 times** in the WSOS 2026. That obligation comes from the HDTN topic sheet, which requires students to *"produce well-organized documentation that includes all findings, manuals, steps, screen captures, verifications, and references related to the project."* The standard's own documentation obligations are separate and are quoted here because they justify the shape of this section:

> `Prepare a technical document reflecting the solution in detail for agreement and sign-off` (Domain 6, *shall be able to*, line 7)

> `The purpose of documenting the completion of the installation or up-grade` (Domain 6, *know and understand*, line 6) — reproduced with the source's own spelling

> In the skill competition the assessment of knowledge and understanding will take place through the assessment of performance. (General notes on the WSOS)

That last line is why this section is written as an executable manual rather than a design essay: the assessment vehicle is demonstrated performance.

---

### 7.2 Design Decisions

Each decision below states the choice, the reason, and what was rejected. Every decision is traceable to a numbered item of the due-diligence list in baseline §2.1 (segregation of the production chain, documented least privilege, certificate-based remote access, documented failover behaviour, reviewed repeatable change) or to §1.2 of the brief.

#### 7.2.1 Forest and domain design — one forest, one domain, one tree

**Decision.** A single forest containing a single domain `vertexpeak.fyp.lab`, NetBIOS name `VERTEXPEAK`, functional level Windows Server 2025, single UPN suffix `vertexpeak.fyp.lab` (the default; no additional suffix), Kerberos realm `VERTEXPEAK.FYP.LAB`.

**Reasoning.** Vertex Peak is 160 staff across four locations with no acquisitions in flight and no regulatory requirement for an administrative boundary between business units. A multi-domain model would add replication topology, cross-domain group translation and Kerberos referral complexity for no benefit at this population, and would make the two-tier administrative model harder to explain rather than easier. Resource forests, multiple trees and cross-forest trusts are explicitly rejected for the same reason: they solve problems this scenario does not have.

**Consequence that must be stated in the report.** One domain means one `Domain Admins` group, which is precisely why the project separates *administrative tiers* (§7.2.6) rather than *domains*. The tiering is an administrative and Group Policy construct, not a directory boundary, and its limits must be described honestly in the design document.

The NetBIOS name is set explicitly with `-DomainNetbiosName VERTEXPEAK` rather than accepted from the automatic derivation, because the auto-derived value is silently truncated at 15 characters and this project's convention (baseline §8.3) requires the exact string.

#### 7.2.2 OU structure

**Decision.** The exact tree fixed in baseline §9.2 is implemented verbatim under `OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab`. Nothing is added, renamed or re-nested at build time; if the tree must change, the baseline is revised first.

**Reasoning.** The tree is organised by **object type at the top, then by site, then by function** — which is the shape that lets Group Policy, delegation and the access model all attach at a predictable level:

- `OU=Users` → `OU=HQ-ShaTin` → departmental OUs gives one link point per department for drive mappings and one delegation point for helpdesk password resets.
- `OU=Computers` → `OU=Servers` → `OU=MemberServers` / `OU=Tier0-DomainControllers` / `OU=DMZ-Servers` gives three different security baselines with three different link points, which is what makes the DMZ baseline (§7.3.6, G-5) possible at all.
- `OU=Admins` → `OU=Tier0` / `OU=Tier1` / `OU=BreakGlass` separates privileged accounts from the population they administer, so that a single delegable OU (`OU=Users`) never contains an account capable of modifying its own permissions.
- `OU=Quarantine` → `OU=Disabled` / `OU=NewObjects` gives the automation layer a deterministic landing zone for accounts that fail validation, rather than deleting and recreating them.

**Rule enforced from the baseline.** The default `CN=Users` and `CN=Computers` containers are used only by the RODC and by nothing else. Every user and computer object created by this project must live inside the tree above before the build is considered complete. This is verified with a check that returns an empty result:

```powershell
# Must return nothing: no user or computer objects outside OU=VertexPeak
Get-ADUser -Filter * -SearchBase "CN=Users,DC=vertexpeak,DC=fyp,DC=lab" |
    Where-Object { $_.DistinguishedName -notmatch 'OU=' } |
    Select-Object Name, DistinguishedName
```

#### 7.2.3 Site and subnet objects

**Decision.** Four AD sites — `HQ-ShaTin`, `BR-KwunTong`, `WC-WanChai`, `MO-Macau` — and one subnet object per subnet in the baseline §5.2 addressing plan, each mapped to exactly one site. No subnet may be left unmapped.

**Reasoning.** Sites are what make the Kwun Tong RODC log in locally instead of crossing the WAN to HQ for every Kerberos request, and what make HQ clients prefer `vpnz-dc01`/`vpnz-dc02` rather than selecting a domain controller at random. The site link `HQ-ShaTin` ↔ `BR-KwunTong` is configured with a **15-minute replication interval** (baseline §9.1) because the branch tolerates up to a quarter of an hour of identity lag in exchange for reduced WAN chatter; the branch RODC keeps a cached identity copy so that branch logins survive an HQ WAN outage regardless.

`WC-WanChai` and `MO-Macau` have no local domain controller in this baseline, so a subnet object mapped to those sites makes DC locator behaviour *deterministic and observable* (the client will resolve a DC in the nearest site with a DC, which is `HQ-ShaTin`), instead of leaving the behaviour to chance. That determinism is what makes the finding in §7.13 recordable.

#### 7.2.4 DNS design

| Decision | Value | Reason |
|---|---|---|
| Zone type | AD-integrated, replicated to all DNS servers in the domain | Zone data rides AD replication, so there is no separate zone-transfer path to secure and no primary/secondary distinction to maintain |
| Dynamic updates | Secure only | Unauthenticated clients cannot register records over-writing a server's record. This is the single most important anti-spoofing setting in the DNS design and is also the reason the `P-31` DNS AXFR row of the baseline port matrix is restricted to the two domain controllers |
| Forward zone | `vertexpeak.fyp.lab` | Baseline §8.3 |
| Reverse zones | `30.10.10.in-addr.arpa`, `40.10.10.in-addr.arpa`, `90.10.10.in-addr.arpa`, `20.20.10.in-addr.arpa` AD-integrated with PTR records for every static host | Makes `nslookup`/`Resolve-DnsName` diagnostics bidirectional, which matters when troubleshooting VPN pool resolution in §7.12 |
| Branch reverse zone | `113.10.10.in-addr.arpa` delegated to the RODC and forwarded from HQ | The branch owns its own reverse lookups; HQ still resolves them |
| Scavenging | Enabled, 7 days, on both dynamic zones | Prevents stale workstation records accumulating from the DHCP pool |
| Forwarders | `192.0.2.53`, `192.0.2.54` (simulated provider resolvers) | Baseline §9.1. Root hints are left in place but must never be reachable in the lab, which is itself a documented test |
| Conditional forwarder | `vertexpeak.example` → `192.0.2.53` | Resolves the simulated public names `portal.vertexpeak.example`, `www.vertexpeak.example`, `blog.vertexpeak.example` inside the lab without a real public resolver |
| Additional records | `portal`, `www`, `blog` → `10.10.90.10` (the nginx VIP, owned by no node); `vpn` and `wg` → `10.10.50.10`; `keepalived-hq` → both VRRP member pairs (10.10.50.11/.12 and 10.10.90.28/.29) | Baseline §5.8 as amended by Rev 1.1 |
| Not created | `_autodiscover._tcp` | No Exchange or Microsoft 365 integration in this project; recorded as an explicit out-of-scope item rather than an omission |

**Deliberate split-horizon.** The internal zone `vertexpeak.fyp.lab` and the documentation domain `.example` are two different namespaces. `portal.vertexpeak.fyp.lab` resolves internally to the reverse-proxy VIP, while `portal.vertexpeak.example` is the published name that the lab cannot genuinely resolve because no public DNS exists. The report must show the name-mismatch warning that results from the internal PKI certificate (whose SANs include both names) and explain it, rather than hiding it (baseline §8.5).

**Every client gets `10.10.30.11` then `10.10.30.12`, in that order, and nothing else.** No public resolver is configured on any guest, Windows or Linux. `vpnz-brdc01` sits third in the branch DHCP option list and must never be the only resolver for any client.

#### 7.2.5 Service-account model

**Decision.** Nine accounts implement all non-human authentication, exactly as fixed in baseline §8.4. They live in `OU=ServiceAccounts,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab`, are members of **no** privileged group except where the table states otherwise, have **Password never expires disabled** (so rotation is enforced by the automation playbook rather than by neglect), and have **User cannot change password enabled** (so no interactive logon can rotate the secret). Passwords are 32 characters of random material, held in the group's password manager and **never** committed to Git.

| Account | Purpose | Membership |
|---|---|---|
| `svc_ansible` | Ansible connecting to Windows guests over WinRM | `GG-WINRM-Admins` only |
| `svc_backup` | Backup jobs and backup share access | `GG-Backup-Operators` |
| `svc_monitoring` | Prometheus / `windows_exporter` read access; SNMPv3 user | `GG-Monitoring-Readers` |
| `svc_aiagent` | The AI agent's read-only credential | `GG-AI-ReadOnly` only — never `Domain Admins` |
| `svc_ldapbind` | LDAP bind for the WordPress authentication plug-in | `GG-DMZ-LDAP-Readers` |
| `svc_git` | Git/Gitea access from `vpnz-mon01` | `GG-DevOps-Users` |
| `adm-{initials}` ×4 | Personal, named administrative accounts, one per student | `GG-Server-Admins`; **two** of the four are also in `GG-Tier0-Admins` and are the only accounts permitted to touch `vpnz-dc01`/`vpnz-dc02` |
| `da-vertexpeak` | Break-glass Domain Admin | `Domain Admins`; password sealed in a physical envelope held by the group supervisor; not used during normal operation, and any use must be logged in the report |
| `krbtgt` | Kerberos service account | Never touched; its double reset is a documented disaster-recovery exercise only, executed only with supervisor approval |

**Reasoning.** Named personal administrative accounts plus a sealed break-glass account is the standard answer to the "shared `Administrator`" problem, and it is directly traceable to due-diligence item 2 (documented least privilege and an audit trail of administrative actions). Because every administrative action carries a person's name, the Security event log becomes an audit trail rather than a log of anonymous privilege. The `svc_*` accounts are given *only* the group membership their function needs, which is what makes the AI agent's read-only guarantee (§7.9) checkable rather than merely asserted.

**Enforcement of the "no privileged membership except where stated" rule** is a scripted check, not a promise:

```powershell
# Fail the build if any svc_* account has ended up in a privileged group
$forbidden = 'Domain Admins','Enterprise Admins','Schema Admins','Administrators','Account Operators',
             'Backup Operators','Server Operators','Group Policy Creator Owners','Protected Users'
Get-ADUser -Filter 'sAMAccountName -like "svc_*"' -Properties MemberOf |
    ForEach-Object {
        $bad = $_.MemberOf | Where-Object { $n = ($_ -split ',')[0] -replace '^CN=',''; $forbidden -contains $n }
        if ($bad) { [pscustomobject]@{ Account = $_.sAMAccountName; ForbiddenGroup = ($bad -join ';') } }
    }
# Expected output: no rows
```

#### 7.2.6 Group strategy

**Decision.** Follow the classic AGDLP shape, with one deliberate exception.

- **Global groups** hold **user** accounts: `GG-Server-Admins`, `GG-Tier0-Admins`, `GG-Workstation-Admins`, `GG-Helpdesk`, `GG-Finance-RW`, `GG-Finance-RO`, `GG-Engineering-RW`, `GG-Sales-RO`, `GG-VPN-Users`, `GG-VPN-ProfServices`, `GG-Infra-Admins`.
- **Domain Local groups** hold **global groups** and are what the resource itself checks: `GG-DMZ-LDAP-Readers`, `GG-Monitoring-Readers`, `GG-AI-ReadOnly`, and one `DL-{Share}-{RW|RO}` per FSRM share.
- **Role-based groups** under `OU=Groups/OU=RoleBased` express job function and are the only groups an administrator assigns when onboarding a person.

**The deliberate exception — `GG-DMZ-LDAP-Readers`, `GG-Monitoring-Readers` and `GG-AI-ReadOnly` are Domain Local groups that contain service accounts directly**, not global groups, because each of them has exactly one member and that member is a machine identity, not a person. Inserting a global group of one would add a layer with no semantic value. This deviation from pure AGDLP must be stated in the design document rather than presented as an accident.

**Why global-for-users, domain-local-for-resources.** The forest has one domain, so global-versus-universal makes no functional difference today; global is chosen because it is the cheaper replication object and because a future second domain (a real acquisition, not a lab exercise) would still work. Domain Local for resource access means the *resource* owns the last hop of the authorisation decision, so a change to who may read the Sales share is a change in one place.

**`GG-VPN-ProfServices` deserves a note.** It is defined as `GG-VPN-Users` *plus* RDP to the two platform VMs, which is exactly trust-boundary rule TB-11 of the baseline. It is deliberately **not** a member of anything that touches `Z-MGMT`, because TB-12 states that VPN users are never administrators of infrastructure. The VPN authorisation policy in §7.8.2 reads this group and nothing else.

#### 7.2.7 Delegation

**Decision.** Delegation is granted at OU level, on the minimum permission set, to the group that performs the function.

| Delegate | On | Permissions | Reason |
|---|---|---|---|
| `GG-Helpdesk` | `OU=Users` only | *Reset password*, *Read and write `userAccountControl`* (i.e. unlock), *Read all user information* | Helpdesk can restore access but cannot create, delete, move, re-permission or re-group an account. The `userAccountControl` write is what allows account unlock, which is the single most common real ticket |
| `GG-Server-Admins` | `OU=Computers/OU=Servers/OU=MemberServers` | Full control of computer objects | Administer the member-server estate without touching Tier 0 |
| `GG-Tier0-Admins` | `OU=Computers/OU=Servers/OU=Tier0-DomainControllers`, `OU=Admins/OU=Tier0` | Full control | The two Tier-0 students administer the DCs and the CA, and nothing else grants that |
| `GG-Monitoring-Readers` | Domain root (Performance Monitor Users equivalent) | *Read* performance counters, event log read | Prometheus and `windows_exporter` need read, not write |
| `svc_aiagent` via `GG-AI-ReadOnly` | Domain root | Event-log read only | The agent's credential is granted nothing else, which is what makes the read-only claim in §7.9 verifiable |

**Explicitly not done.** No group is added to `Domain Admins` except `da-vertexpeak`. No delegation is granted to `Authenticated Users`, `Everyone` or `Domain Users`. Local administrator rights on member servers are delivered by Group Policy restricted groups and LAPS (§7.3.6) rather than by domain group membership, so that a compromise of a member server does not yield domain-wide administrative rights.

**The two-tier administrative model** is the design decision the report must present with its limits. Two of the four students are Tier 0; two are Tier 1. Tier-0 credentials are used only from `vpnz-jump01` (10.20.20.31, `Z-MGMT`) and never from a workstation. The honest limitation is that with four students and one hypervisor host, physical separation of administrative workstations is a *procedure* rather than a *control*: the same `vpnz-jump01` is reachable by all four people, and a determined Tier-1 administrator with hypervisor console access could reach a Tier-0 VM regardless of AD permissions. That limitation belongs in the report, not in a footnote.

#### 7.2.8 Password and lockout policy, and fine-grained password policy

**Baseline domain policy** (set in the Default Domain Policy, linked at the domain root):

| Setting | Value | Reason |
|---|---|---|
| Minimum password length | 14 characters | Long enough to make offline cracking of a stolen NT hash impractical within the project's timeline, short enough to be usable by 160 staff |
| Password history | 24 passwords remembered | Prevents the "rotate between two passwords" failure mode |
| Maximum password age | 60 days | Balances exposure window against helpdesk load; drives the rotation the automation playbook performs for service accounts |
| Minimum password age | 1 day | Prevents a user from cycling the history back to their original password in one session |
| Complexity | Enabled | Blocks the trivial dictionary classes |
| Reversible encryption | Disabled | Storing the recoverable form of a password is strictly worse and nothing in this design needs it |
| Account lockout threshold | 5 invalid logons | Low enough that a brute-force burst is visible in Security 4625/4740 within minutes, high enough to tolerate a fat-fingered user |
| Account lockout duration | 15 minutes | Automatic release without a helpdesk call, while still imposing a ~20 attempts/hour ceiling |
| Reset account lockout counter after | 15 minutes | Same value as the duration, so the counter and the lock clear together and the behaviour is easy to explain in the troubleshooting chapter |
| Allow Administrator account lockout | Enabled | The built-in `Administrator` is disabled anyway, but the setting removes a well-known brute-force target |

**Fine-grained password policy is used, once, and for a defensible reason.** The domain policy above applies to people. Two classes of account in this design must not be governed by 60-day expiry, because a 60-day expiry on a service account that has no interactive owner produces exactly one outcome: someone sets it to a permanent password. Baseline §8.4 requires `Password never expires` to be **disabled** on every `svc_*` account, so the safe way to satisfy that requirement is a fine-grained policy with no maximum age, restricted to the service-account OU:

```powershell
New-ADFineGrainedPasswordPolicy -Name "FGPP-ServiceAccounts" `
    -Precedence 10 `
    -ComplexityEnabled $true `
    -ReversibleEncryptionEnabled $false `
    -MinPasswordLength 32 `
    -PasswordHistoryCount 12 `
    -MaxPasswordAge ([TimeSpan]::FromDays(365)) `
    -MinPasswordAge ([TimeSpan]::FromDays(1)) `
    -LockoutThreshold 5 `
    -LockoutDuration ([TimeSpan]::FromMinutes(15)) `
    -LockoutObservationWindow ([TimeSpan]::FromMinutes(15)) `
    -Description "FGPP for svc_* accounts. 32-char minimum, annual rotation by playbook."

Add-ADFineGrainedPasswordPolicySubject -Identity "FGPP-ServiceAccounts" `
    -Subjects (Get-ADUser -Filter 'sAMAccountName -like "svc_*"')
```

A 365-day maximum age is a deliberate compromise, and the report must present it as one: it makes "Password never expires" false (satisfying the baseline rule) while accepting that the real control is the playbook rotation, not the expiry timer. If the group prefers strictly no expiry, the correct action is to revise baseline §8.4, not to set the flag and leave the rule silently violated.

**Protected Users.** The four `adm-{initials}` accounts are added to the built-in `Protected Users` group, which removes NTLM, CredSSP and unconstrained-delegation credentials from those sessions. The consequence — that these accounts cannot authenticate to anything expecting NTLM — must be recorded as a known limitation, because `GG-Workstation-Admins` and legacy tooling are exactly where it bites.

**Local administrator passwords** are rotated by Windows LAPS through `GPO-WS-Windows-LAPS` rather than by any script of ours (baseline §9.3). This is the correct answer to "pass-the-hash across identical local admin credentials", which is otherwise the most likely lateral-movement path in a lab built from one template.

#### 7.2.9 Interface aliases, repository paths and naming

All Windows guests use the alias convention fixed in baseline §8.1: the single NIC on each `Z-SERVER` guest is renamed to `SRV-VLAN30`, the `vpnz-jump01` NIC to `MGMT-VLAN20`, and the DMZ NICs to `DMZ-VLAN90`. This is set with `Rename-NetAdapter` during pre-flight (§7.3.1) so that no later command in this section, in the automation line, or in the test plan ever depends on `"Ethernet 2"`.

Build artefacts are written to the paths fixed in baseline §8.6: script logs to `C:\FYP\logs\` as `YYYY-MM-DD_{script}.log`, captured configuration baselines to `C:\FYP\config\`, and screenshot staging to `C:\FYP\evidence\`. FSRM-managed shares live at `D:\Shares\Finance`, `D:\Shares\Engineering`, `D:\Shares\SalesRO`, `D:\Shares\Public` and are referenced in the report by their UNC paths under `\\vpnz-fs01\Shares\`. iSCSI target VHDs live at `D:\iSCSI\LUN01` … `LUN03`. None of these values may be renamed locally.

---

### 7.3 Active Directory Domain Services (AD DS)

AD DS is the only technology in this line that the WSOS 2026 names explicitly — `Install and manage enterprise directory services (ADDS, LDAP)` (Domain 4) — and it is also the dependency root for everything else in the Windows estate: DNS, DHCP, Kerberos, Group Policy, AD CS, NPS authorisation and the FSRM share ACLs all resolve through it.

#### 7.3.1 Prerequisites and pre-flight checks

##### VM settings

Both domain controllers are built **from installation media**, not from `W2K25-TEMPLATE-01`, so that no cloned SID, no stale computer account and no previously cached domain credential exists. The hypervisor settings follow the generic form required by baseline §6.1 (hypervisor-specific wording belongs in the build manual's per-hypervisor appendix):

| Setting | `vpnz-dc01` | `vpnz-dc02` | Notes |
|---|---|---|---|
| Guest OS | Windows Server 2025 Standard (Desktop Experience) | same | Desktop Experience deliberately: the group needs GUI evidence for the report. This is a stated trade-off, not an oversight — the more secure Server Core option was declined for evidence reasons |
| Build | `10.0.26100.1742` **[ASSUMPTION: exact patch level]** | same | The base build `10.0.26100` is verified; the patch suffix must be confirmed with `Get-ComputerInfo` / `systeminfo` at build time. If Windows Server 2025 media is unavailable, fall back to Windows Server 2022 (build 20348) and record the deviation in the "version deviations" subsection |
| vCPU | 2 | 2 | Allocated, not saturated |
| RAM | 4 GB | 4 GB | Per baseline §6 |
| System disk | 60 GB, thinly provisioned | 60 GB | |
| NIC count | 1 | 1 | |
| NIC network | host-only 10.10.30.0/24, hypervisor DHCP **off** | same | `VNET-SRV` |
| NIC alias | `SRV-VLAN30` | `SRV-VLAN30` | Set with `Rename-NetAdapter` |
| Time sync with host | **Disabled** before promotion | Disabled before promotion | See below |
| Snapshot | Taken immediately before promotion | Taken immediately before promotion | Named `pre-promo-{date}` |

##### Why host time synchronisation must be off

`vpnz-dc01` will become the authoritative time source for the forest, which requires it to hold the PDC emulator role and to synchronise outward to the simulated provider (`192.0.2.53`), not to the hypervisor host's clock. A domain controller that is also following host time integration produces exactly the class of intermittent Kerberos failure that §7.12 documents. The hypervisor's time-sync-with-host option is therefore disabled for both DCs **before** the role is installed. This is the single most commonly skipped prerequisite in student AD builds and it is the reason it is listed first.

##### Pre-flight check script

The following is run on a freshly installed guest, before any role is added. It is saved as `C:\FYP\logs\preflight-{hostname}.log`.

```powershell
# Requires -RunAsAdministrator
Start-Transcript -Path "C:\FYP\logs\$(Get-Date -Format 'yyyy-MM-dd')_preflight-$env:COMPUTERNAME.log"

# 1. Identity and build
Get-ComputerInfo | Select-Object CsName, WindowsProductName, WindowsVersion, OsBuildNumber, OsArchitecture
[System.Environment]::OSVersion.Version

# 2. Confirm the guest is NOT already domain-joined
(Get-CimInstance Win32_ComputerSystem).Domain, (Get-CimInstance Win32_ComputerSystem).PartOfDomain
# Expected:  "WORKGROUP"   and   False

# 3. Rename the adapter to the project convention BEFORE any static address is set
Rename-NetAdapter -Name (Get-NetAdapter | Where-Object Status -eq 'Up').Name -NewName 'SRV-VLAN30' -Confirm:$false

# 4. Static IP, mask, gateway, DNS (DC01 shown; DC02 uses .12)
New-NetIPAddress -InterfaceAlias 'SRV-VLAN30' -IPAddress 10.10.30.11 -PrefixLength 24 `
    -DefaultGateway 10.10.30.254
Set-DnsClientServerAddress -InterfaceAlias 'SRV-VLAN30' -ServerAddresses 127.0.0.1
Set-DnsClient -InterfaceAlias 'SRV-VLAN30' -ConnectionSpecificSuffix 'vertexpeak.fyp.lab'

# 5. Prove the addressing is actually applied (do not trust the Write-* cmdlet's silence)
Get-NetIPAddress -InterfaceAlias 'SRV-VLAN30' -AddressFamily IPv4 |
    Select-Object IPAddress, PrefixLength, InterfaceAlias
Get-NetRoute -InterfaceAlias 'SRV-VLAN30' -DestinationPrefix '0.0.0.0/0'

# 6. Hostname (≤15 characters per baseline §8.2)
Rename-Computer -NewName 'vpnz-dc01' -Restart:$false

# 7. Disable the hypervisor time-sync artefact and point w32time at the simulated provider
Set-Service -Name W32Time -StartupType Automatic
Start-Service W32Time
w32tm /config /manualpeerlist:"192.0.2.53,0x8 192.0.2.54,0x8" /syncfromflags:manual /reliable:yes /update

# 8. Confirm PowerShell runtime, because every script in this project must declare it
$PSVersionTable.PSVersion     # Expected: 5.1.x on a fresh guest
Stop-Transcript
```

**Expected pre-flight output (the parts that matter), tagged for the evidence file:**

```text
[PRE-FLIGHT vpnz-dc01]
CsName               : VPNZ-DC01
WindowsProductName   : Windows Server 2025 Standard
WindowsVersion       : 10.0.26100
OsBuildNumber        : 26100
OsArchitecture       : 64-bit
Domain               : WORKGROUP
PartOfDomain         : False
IPAddress            : 10.10.30.11
PrefixLength         : 24
InterfaceAlias       : SRV-VLAN30
DestinationPrefix    : 0.0.0.0/0
NextHop              : 10.10.30.254
PSVersion            : 5.1.26100.1742
[END PRE-FLIGHT]
```

After the rename, the guest is restarted. **The restart is not optional and is the first place a build goes wrong**: `Rename-Computer` does not take effect until reboot, and an AD promotion performed before the reboot produces a domain controller whose computer account name does not match the hostname, which then has to be fixed by hand.

##### Pre-promotion checks that must pass

| Check | Command | Expected |
|---|---|---|
| Local administrator rights | `whoami /groups \| Select-String "S-1-5-32-544"` | `BUILTIN\Administrators` present, `Enabled group` |
| Connectivity to the gateway | `Test-NetConnection 10.10.30.254 -InformationLevel Quiet` | `True` |
| DNS client points at itself | `Get-DnsClientServerAddress -InterfaceAlias 'SRV-VLAN30'` | `127.0.0.1` |
| No pending reboot | `Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending'` | `False` |
| Time is close to real time | `w32tm /query /status` | Source reachable, offset within seconds |

#### 7.3.2 Promoting the first domain controller

`vpnz-dc01` is promoted as a new forest root. The whole promotion is one `Install-WindowsFeature` call followed by one `Install-ADDSForest` call.

```powershell
# ---- 7.3.2 STEP 1: install the roles on vpnz-dc01 ----
Install-WindowsFeature -Name AD-Domain-Services `
    -IncludeManagementTools `
    -IncludeAllSubFeature

# Confirm, do not assume
Get-WindowsFeature -Name AD-Domain-Services | Select-Object Name, InstallState
# Expected:  AD-Domain-Services   Installed
```

```powershell
# ---- 7.3.2 STEP 2: promote as the first DC of a new forest ----
$dsrmPwd = Read-Host -AsSecureString 'Directory Services Restore Mode password (seal in the group password manager)'

Install-ADDSForest `
    -DomainName 'vertexpeak.fyp.lab' `
    -DomainNetbiosName 'VERTEXPEAK' `
    -ForestMode 'Win2025' `
    -DomainMode 'Win2025' `
    -InstallDns $true `
    -CreateDnsDelegation $false `
    -DatabasePath 'C:\Windows\NTDS' `
    -LogPath 'C:\Windows\NTDS' `
    -SysvolPath 'C:\Windows\SYSVOL' `
    -SafeModeAdministratorPassword $dsrmPwd `
    -Force $true
```

**A warning about this block before it is run.** The `-DomainNetbiosName` value is typed once and is not recoverable afterwards without rebuilding the forest. It must be the exact string `VERTEXPEAK`. Read the line back character by character against baseline §8.3 before pressing Enter: this is the single most expensive typo in the whole Windows build, because the NetBIOS name is embedded in every `VERTEXPEAK\` group reference in §7.3.4, §7.5.2 and every `Set-Acl` call in the report.

**Parameter-by-parameter justification** (each of these is a design decision, not a default):

| Parameter | Value | Why |
|---|---|---|
| `-DomainName` | `vertexpeak.fyp.lab` | Fixed by baseline §8.3. Not `.local`, not `.lan`, not a real registered domain, and explicitly not `example.com` |
| `-DomainNetbiosName` | `VERTEXPEAK` | Must be explicit; the auto-derivation truncates at 15 characters |
| `-ForestMode` / `-DomainMode` | `Win2025` | Windows Server 2025 functional level, per baseline §8.3. This is irreversible in the sense that the level can be raised but never lowered, so it is set correctly once |
| `-InstallDns` | `$true` | The DC is also the DNS server; there is no separate DNS host in this design |
| `-CreateDnsDelegation` | `$false` | There is no parent zone to delegate from. Leaving it `$true` would attempt a delegation against a non-existent parent and produce a warning that looks like a failure |
| `-DatabasePath`, `-LogPath`, `-SysvolPath` | `C:\Windows\NTDS`, `C:\Windows\SYSVOL` | Defaults, stated explicitly so that the evidence transcript records where the data actually lives. On a real build these would be separate volumes; in this lab the 60 GB system disk is adequate and the choice must be stated as a lab simplification |
| `-SafeModeAdministratorPassword` | prompt, never a literal | DSRM password. It is the only credential that can restore a DC from backup, so it goes into the group password manager at the moment of creation — not "later" |
| `-Force` | `$true` | Suppresses the interactive confirmation so the promotion is scriptable and repeatable |

The call restarts the guest automatically. **Reboot is expected and is not an error.**

**[ASSUMPTION]** The `-ForestMode`/`-DomainMode` enumerations accepted by `Install-ADDSForest` on Windows Server 2025 are `Win2025`. If the installed build rejects that value, the alternative forms are `Windows2025` (older syntax) or the numeric `-ForestMode 10`. Run `Get-Help Install-ADDSForest -Parameter ForestMode` on the built guest and record which form the pinned version actually accepts.

##### Expected promotion output

```text
[PROMOTION vpnz-dc01 — Install-ADDSForest]
VERBOSE: Performing operation "Install AD DS Forest" on Target "VPNZ-DC01".
VERBOSE: The domain 'vertexpeak.fyp.lab' was created successfully.
VERBOSE: The DNS server was installed and the forward zone 'vertexpeak.fyp.lab' was created.
VERBOSE: The Active Directory Domain Services role was configured successfully on VPNZ-DC01.
VERBOSE: The computer will be restarted in 10 seconds...

Message                    Context                                RebootRequired
-------                    -------                                --------------
Operation completed        Target: VPNZ-DC01                      True

[POST-PROMOTION vpnz-dc01]
Domain                : vertexpeak.fyp.lab
DomainController      : VPNZ-DC01.vertexpeak.fyp.lab
Forest                : vertexpeak.fyp.lab
OperationMode         : Win2025Forest
ReplicationSiteName   : HQ-ShaTin
DatabasePath          : C:\Windows\NTDS
SysvolPath            : C:\Windows\SYSVOL
[END]
```

Two details in that output are easy to misread. `OperationMode : Win2025Forest` confirms the functional level actually applied — if it reads `Win2016Forest` or similar, the `-ForestMode` value was not accepted and the promotion must be redone from a snapshot. `ReplicationSiteName : HQ-ShaTin` is the *default* site name and confirms the next required step: the site must be renamed to the project convention, which is done in §7.3.5.

##### Immediately after the reboot

```powershell
# Rename the default site to the project convention (baseline §8.3)
Get-ADReplicationSite -Identity 'Default-First-Site-Name' |
    Set-ADReplicationSite -NewName 'HQ-ShaTin'

# Confirm FSMO placement: all five on vpnz-dc01 (baseline §12.1)
netdom query fsmo
Get-ADDomain | Select-Object PDCEmulator, RIDMaster, InfrastructureMaster
Get-ADForest | Select-Object SchemaMaster, DomainNamingMaster

# Confirm the forest-wide time configuration
w32tm /config /manualpeerlist:"192.0.2.53,0x8 192.0.2.54,0x8" /syncfromflags:manual /reliable:yes /update
Restart-Service W32Time
w32tm /query /status
w32tm /query /source
# Expected source: the configured peer list, NOT "Local CMOS Clock" and NOT the hypervisor
```

**A domain controller that reports `Local CMOS Clock` as its source is not a time source and must be fixed before the second DC is promoted** — the second DC will inherit whatever the PDC emulator is doing, including its errors.

#### 7.3.3 Adding the second domain controller and DNS redundancy

`vpnz-dc02` (10.10.30.12) is built from separate media, pre-flighted identically (§7.3.1, with `-IPAddress 10.10.30.12` and `-NewName 'vpnz-dc02'`), and then joined to the existing domain as an additional domain controller in the same site.

```powershell
# ---- On vpnz-dc02: DNS must point at DC01 before the join, never at itself yet ----
Set-DnsClientServerAddress -InterfaceAlias 'SRV-VLAN30' -ServerAddresses 10.10.30.11
Resolve-DnsName vertexpeak.fyp.lab -Server 10.10.30.11
# Expected: SOA/NS records for vertexpeak.fyp.lab, plus an A record for vpnz-dc01

Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools -IncludeAllSubFeature

$dsrmPwd = Read-Host -AsSecureString 'DSRM password for vpnz-dc02'

Install-ADDSDomainController `
    -DomainName 'vertexpeak.fyp.lab' `
    -SiteName 'HQ-ShaTin' `
    -InstallDns $true `
    -Credential (Get-Credential 'VERTEXPEAK\adm-XX') `
    -DatabasePath 'C:\Windows\NTDS' `
    -LogPath 'C:\Windows\NTDS' `
    -SysvolPath 'C:\Windows\SYSVOL' `
    -SafeModeAdministratorPassword $dsrmPwd `
    -NoGlobalCatalog $false `
    -Force $true
```

| Parameter | Value | Why |
|---|---|---|
| `-SiteName` | `HQ-ShaTin` | Explicitly places the DC in the correct site. Omitting it drops the server into `Default-First-Site-Name` — which no longer exists in this design, so the omission surfaces as an error rather than a silent misplacement |
| `-InstallDns` | `$true` | DNS redundancy is the point of the second DC: if `vpnz-dc01` is offline, clients with `10.10.30.12` as their second resolver still resolve and still authenticate |
| `-NoGlobalCatalog` | `$false` | Both DCs are Global Catalogs, so that a GC lookup never depends on a single host in a single-domain forest |
| `-Credential` | a Tier-0 account | Promotion requires Domain Admin or equivalent; this is one of the two places `adm-{initials}` Tier-0 accounts are legitimately used |

**After the reboot on `vpnz-dc02`, repoint its own DNS at itself first and then at its partner**, in that order:

```powershell
Set-DnsClientServerAddress -InterfaceAlias 'SRV-VLAN30' -ServerAddresses 10.10.30.12, 10.10.30.11
Restart-Service DNS
Get-DnsClientServerAddress -InterfaceAlias 'SRV-VLAN30'
```

##### DNS replication verification

```powershell
# Replication of the DNS application partitions, from either DC
repadmin /showrepl vpnz-dc01 vpnz-dc02
repadmin /replsummary
dcdiag /test:dns /dnsall /v
```

```text
[REPLICATION vpnz-dc01 — repadmin /replsummary]
Source DSA          largest delta    fails/total %%   error
VPNZ-DC01                  12m:04s    0 /   5    0
VPNZ-DC02                  11m:51s    0 /   5    0
Destination DSA     largest delta    fails/total %%   error
VPNZ-DC01                  11m:58s    0 /   5    0
VPNZ-DC02                  12m:01s    0 /   5    0
[END]
```

**Reading that output.** `fails/total` must be `0 / n` with no error text. A `largest delta` that grows without bound indicates a replication failure that `repadmin /showrepl` will attribute to a specific naming context and a specific error code — the two most common in this lab are 8524 (DNS lookup failure, i.e. the partner's record cannot be resolved) and 1256 (the remote system is not available, i.e. the `P-07`/`P-31` RPC and DNS paths are blocked by a firewall). Both are cases in §7.12.

Additional DNS redundancy checks:

```powershell
# Both DCs must be registered as name servers for the zone
Get-DnsServerResourceRecord -ZoneName 'vertexpeak.fyp.lab' -RRType Ns | Select-Object HostName, RecordData
Resolve-DnsName vertexpeak.fyp.lab -Type SOA -Server 10.10.30.12
Resolve-DnsName _ldap._tcp.dc._msdcs.vertexpeak.fyp.lab -Type SRV -Server 10.10.30.12
# Expected: both DCs listed as SRV targets with priority 0, weight 100, port 389
dnscmd /zoneexport vertexpeak.fyp.lab C:\FYP\config\dc01_zone_vertexpeak.fyp.lab.txt
```

The exported zone file goes into `C:\FYP\config\` and then into the Git repository, because a zone export taken *before* and *after* a change is the cheapest possible evidence that a DNS change had exactly the intended effect — and nothing else.

#### 7.3.4 OU, group and service-account creation

[FIGURE: Screenshot of Active Directory Users and Computers showing the complete `OU=VertexPeak` tree of §7.3.4 fully expanded in a single capture — this is the evidence for baseline success criterion 3 and for the report's traceability matrix]

##### The OU tree

The tree is created from a single fenced script so that it is reproducible and diffable. It is saved as `C:\FYP\03-build\windows\New-VertexPeakOU.ps1` and its log is the evidence.

```powershell
# New-VertexPeakOU.ps1 — creates the exact OU tree of baseline §9.2
$root = 'DC=vertexpeak,DC=fyp,DC=lab'

$ous = @(
    'OU=VertexPeak'
    'OU=Users,OU=VertexPeak'
    'OU=HQ-ShaTin,OU=Users,OU=VertexPeak'
    'OU=Engineering,OU=HQ-ShaTin,OU=Users,OU=VertexPeak'
    'OU=SalesOps,OU=HQ-ShaTin,OU=Users,OU=VertexPeak'
    'OU=Finance,OU=HQ-ShaTin,OU=Users,OU=VertexPeak'
    'OU=HumanResources,OU=HQ-ShaTin,OU=Users,OU=VertexPeak'
    'OU=IT,OU=HQ-ShaTin,OU=Users,OU=VertexPeak'
    'OU=Support,OU=HQ-ShaTin,OU=Users,OU=VertexPeak'
    'OU=BR-KwunTong,OU=Users,OU=VertexPeak'
    'OU=WC-WanChai,OU=Users,OU=VertexPeak'
    'OU=MO-Macau,OU=Users,OU=VertexPeak'
    'OU=RemoteAndContractors,OU=Users,OU=VertexPeak'
    'OU=Computers,OU=VertexPeak'
    'OU=Servers,OU=Computers,OU=VertexPeak'
    'OU=MemberServers,OU=Servers,OU=Computers,OU=VertexPeak'
    'OU=Tier0-DomainControllers,OU=Servers,OU=Computers,OU=VertexPeak'
    'OU=DMZ-Servers,OU=Servers,OU=Computers,OU=VertexPeak'
    'OU=Workstations,OU=Computers,OU=VertexPeak'
    'OU=HQ,OU=Workstations,OU=Computers,OU=VertexPeak'
    'OU=Branches,OU=Workstations,OU=Computers,OU=VertexPeak'
    'OU=LinuxServers,OU=Computers,OU=VertexPeak'
    'OU=Groups,OU=VertexPeak'
    'OU=Global,OU=Groups,OU=VertexPeak'
    'OU=DomainLocal,OU=Groups,OU=VertexPeak'
    'OU=RoleBased,OU=Groups,OU=VertexPeak'
    'OU=ServiceAccounts,OU=VertexPeak'
    'OU=Admins,OU=VertexPeak'
    'OU=Tier0,OU=Admins,OU=VertexPeak'
    'OU=Tier1,OU=Admins,OU=VertexPeak'
    'OU=BreakGlass,OU=Admins,OU=VertexPeak'
    'OU=Network,OU=VertexPeak'
    'OU=PacketTracerDevices,OU=Network,OU=VertexPeak'
    'OU=PrinterAndVoIP,OU=Network,OU=VertexPeak'
    'OU=Quarantine,OU=VertexPeak'
    'OU=Disabled,OU=Quarantine,OU=VertexPeak'
    'OU=NewObjects,OU=Quarantine,OU=VertexPeak'
)

foreach ($ou in $ous) {
    $name = ($ou -split ',')[0] -replace '^OU=',''
    $path = if ($ou -match ',') { ($ou -split ',',2)[1] } else { $root }
    $full = "$ou,$root"
    if (-not (Get-ADOrganizationalUnit -LDAPFilter "(distinguishedName=$full)" -ErrorAction SilentlyContinue)) {
        New-ADOrganizationalUnit -Name $name -Path "$path,$root" -ProtectedFromAccidentalDeletion $true
        Write-Output "CREATED  $full"
    } else {
        Write-Output "EXISTS   $full"
    }
}
```

Two points of discipline in that script. First, it is **idempotent**: it checks before creating, so a second run produces only `EXISTS` lines. Baseline §1.4 requires every script in this project to be re-runnable with unchanged output, and the second run's transcript is the evidence. Second, `-ProtectedFromAccidentalDeletion $true` is set on every OU. For the §12.1 disaster-recovery exercise, the AD Recycle Bin is enabled once at forest level so that a deleted OU can be restored:

```powershell
Enable-ADOptionalFeature -Identity 'Recycle Bin Feature' `
    -Scope ForestOrConfigurationSet -Target 'vertexpeak.fyp.lab'
```

```text
[OU BUILD — first run, excerpt]
CREATED  OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab
CREATED  OU=Users,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab
CREATED  OU=HQ-ShaTin,OU=Users,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab
CREATED  OU=Engineering,OU=HQ-ShaTin,OU=Users,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab
...
CREATED  OU=NewObjects,OU=Quarantine,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab

[OU BUILD — second run]
EXISTS   OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab
EXISTS   OU=Users,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab
... (all 37 lines read EXISTS; zero CREATE lines)
```

##### Group creation

```powershell
$G = 'OU=Global,OU=Groups,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab'
$D = 'OU=DomainLocal,OU=Groups,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab'

$globalGroups = @(
    'GG-Server-Admins','GG-Tier0-Admins','GG-Workstation-Admins','GG-Helpdesk',
    'GG-Finance-RW','GG-Finance-RO','GG-Engineering-RW','GG-Sales-RO',
    'GG-VPN-Users','GG-VPN-ProfServices','GG-Infra-Admins','GG-WINRM-Admins',
    'GG-Backup-Operators','GG-DevOps-Users'
)
$domainLocalGroups = @(
    'GG-DMZ-LDAP-Readers','GG-Monitoring-Readers','GG-AI-ReadOnly',
    'DL-Finance-RW','DL-Finance-RO','DL-Engineering-RW','DL-SalesRO-RO','DL-Public-RO'
)

foreach ($g in $globalGroups) {
    New-ADGroup -Name $g -SamAccountName $g -GroupCategory Security -GroupScope Global `
        -Path $G -Description "Vertex Peak L1 — global security group (baseline §8.4)"
}
foreach ($g in $domainLocalGroups) {
    New-ADGroup -Name $g -SamAccountName $g -GroupCategory Security -GroupScope DomainLocal `
        -Path $D -Description "Vertex Peak L1 — domain local resource group (baseline §8.4)"
}
```

Two additions appear here that baseline §8.4's narrative implies but does not enumerate as its own row: `GG-WINRM-Admins`, `GG-Backup-Operators` and `GG-DevOps-Users` are named as the *memberships* of `svc_ansible`, `svc_backup` and `svc_git`, so they must exist as objects. Creating them in `OU=Global` keeps the AGDLP shape intact. This expansion must be recorded in the decision log as an implementation detail, not presented as a baseline invention.

**Naming convention, explained.** The `GG-` and `DL-` prefixes are not decoration:

- `GG-` marks a **global, person-facing** group. Reading a group name tells the administrator whether it is safe to add a user account to it directly, and a `GG-` group is the only class of group that should ever appear in a user's `MemberOf`.
- `DL-` marks a **domain-local, resource-facing** group. `DL-{Share}-{RW|RO}` maps **one-to-one onto an FSRM share**, which is why the share name is embedded in the group name: `DL-Finance-RW` is *the* group that grants write on the Finance share, so an ACL audit is a name comparison rather than an investigation.
- The four `GG-*` groups that are actually Domain Local (`GG-DMZ-LDAP-Readers`, `GG-Monitoring-Readers`, `GG-AI-ReadOnly`) keep the `GG-` prefix because baseline §8.4 fixes those exact names. This is an accepted inconsistency in the naming convention and the report must acknowledge it rather than pretend the prefix is a reliable type indicator. **[ASSUMPTION]** The group names are canonical as given; the prefix is therefore informative, not authoritative.

**Membership assignment** then follows the table in §7.2.6, and one membership is deliberately awkward:

```powershell
# Helpdesk: password reset and unlock only — no group write rights anywhere
Add-ADGroupMember -Identity 'GG-Helpdesk' -Members 'adm-01','adm-03'
# (replace with the real adm-{initials} account names of the two Tier-1 students)

# Tier 0: exactly two of the four named administrators
Add-ADGroupMember -Identity 'GG-Tier0-Admins' -Members 'adm-01','adm-02'
Add-ADGroupMember -Identity 'GG-Server-Admins' -Members 'adm-01','adm-02','adm-03','adm-04'

# VPN authorisation groups
Add-ADGroupMember -Identity 'GG-VPN-Users' -Members 'adm-03','adm-04'
Add-ADGroupMember -Identity 'GG-VPN-ProfServices' -Members 'adm-03'

# Service-account memberships (one hop, no nesting, per §7.2.5)
Add-ADGroupMember -Identity 'GG-WINRM-Admins'        -Members 'svc_ansible'
Add-ADGroupMember -Identity 'GG-Backup-Operators'    -Members 'svc_backup'
Add-ADGroupMember -Identity 'GG-Monitoring-Readers'  -Members 'svc_monitoring'
Add-ADGroupMember -Identity 'GG-AI-ReadOnly'         -Members 'svc_aiagent'
Add-ADGroupMember -Identity 'GG-DMZ-LDAP-Readers'    -Members 'svc_ldapbind'
Add-ADGroupMember -Identity 'GG-DevOps-Users'        -Members 'svc_git'
```

##### Service-account creation

```powershell
$SVC = 'OU=ServiceAccounts,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab'

# Generate a 32-character random secret per account; record in the password manager, never in Git
function New-SvcSecret {
    $chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*-_=+'
    -join (1..32 | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
}

$svcAccounts = @(
    @{ Sam='svc_ansible';    Desc='Ansible → Windows over WinRM (5986)' }
    @{ Sam='svc_backup';     Desc='Backup jobs and backup share access' }
    @{ Sam='svc_monitoring'; Desc='Prometheus / windows_exporter read; SNMPv3 user' }
    @{ Sam='svc_aiagent';    Desc='AI agent read-only credential (GG-AI-ReadOnly)' }
    @{ Sam='svc_ldapbind';   Desc='LDAP bind for the WordPress auth plug-in' }
    @{ Sam='svc_git';        Desc='Git/Gitea SSH access from vpnz-mon01' }
)

foreach ($s in $svcAccounts) {
    $pw = ConvertTo-SecureString (New-SvcSecret) -AsPlainText -Force
    New-ADUser -Name $s.Sam -SamAccountName $s.Sam -UserPrincipalName "$($s.Sam)@vertexpeak.fyp.lab" `
        -Path $SVC -Description $s.Desc `
        -AccountPassword $pw `
        -Enabled $true `
        -PasswordNeverExpires $false `
        -CannotChangePassword $true `
        -ChangePasswordAtLogon $false `
        -SmartcardLogonRequired $true `
        -KerberosEncryptionType AES128,AES256
    Write-Output "CREATE $($s.Sam) — record the secret in the password manager NOW"
}
```

**Every attribute in that block is a baseline requirement, not a preference.** `-PasswordNeverExpires $false` and `-CannotChangePassword $true` together implement baseline §8.4's rule exactly. `-SmartcardLogonRequired $true` is a cheap way to make the accounts *interactive-logon-hostile*: a service account with no interactive logon right cannot be used to sit at a console, which removes the most common accidental privilege escalation in a student lab. `-KerberosEncryptionType AES128,AES256` removes RC4 and DES from the negotiation, which matters because `svc_*` accounts hold Kerberos service tickets. As an additional control, the accounts are denied interactive and RDP logon rights by a User Rights Assignment in `GPO-SRV-Member-Server-Baseline` (§7.3.6, G-5).

**Verification of the service-account model:**

```powershell
Get-ADUser -Filter 'sAMAccountName -like "svc_*"' -SearchBase $SVC -Properties PasswordNeverExpires, CannotChangePassword, MemberOf |
    Select-Object SamAccountName, Enabled, PasswordNeverExpires, CannotChangePassword, @{n='Groups';e={($_.MemberOf -join ';')}} |
    Format-Table -AutoSize
```

```text
SamAccountName   Enabled PasswordNeverExpires CannotChangePassword Groups
--------------   ------- -------------------- -------------------- ------
svc_aiagent         True                False                 True CN=GG-AI-ReadOnly,OU=DomainLocal,...
svc_ansible         True                False                 True CN=GG-WINRM-Admins,OU=Global,...
svc_backup          True                False                 True CN=GG-Backup-Operators,OU=Global,...
svc_git             True                False                 True CN=GG-DevOps-Users,OU=Global,...
svc_ldapbind        True                False                 True CN=GG-DMZ-LDAP-Readers,OU=DomainLocal,...
svc_monitoring      True                False                 True CN=GG-Monitoring-Readers,OU=DomainLocal,...
```

Each account with **exactly one** group membership is the correct result. An account with two or more entries is a finding and must be either justified in the decision log or corrected.

#### 7.3.5 Sites, subnets and replication

```powershell
# ---- Create the four sites (HQ-ShaTin already exists from the promotion; it was renamed in §7.3.2)
foreach ($site in 'BR-KwunTong','WC-WanChai','MO-Macau') {
    if (-not (Get-ADReplicationSite -Filter "Name -eq '$site'")) {
        New-ADReplicationSite -Name $site
    }
}

# ---- Site links: HQ <-> BR at 15 minutes (baseline §9.1)
New-ADReplicationSiteLink -Name 'LINK-HQ-BR' `
    -SitesIncluded 'HQ-ShaTin','BR-KwunTong' `
    -Cost 100 -ReplicationFrequencyInMinutes 15 -InterSiteTransportProtocol IP
New-ADReplicationSiteLink -Name 'LINK-HQ-WC' `
    -SitesIncluded 'HQ-ShaTin','WC-WanChai' `
    -Cost 100 -ReplicationFrequencyInMinutes 15 -InterSiteTransportProtocol IP
New-ADReplicationSiteLink -Name 'LINK-HQ-MO' `
    -SitesIncluded 'HQ-ShaTin','MO-Macau' `
    -Cost 100 -ReplicationFrequencyInMinutes 15 -InterSiteTransportProtocol IP
```

**Why an explicit site link rather than the default `DEFAULTIPSITELINK`.** The default link's replication interval is the AD default of 180 minutes. In a lab where the whole point of the RODC is that branch logins survive an HQ outage, a three-hour identity lag makes every branch test inconclusive. 15 minutes is chosen because it is short enough to observe within a single practical session, and because the baseline fixes it. The cost of 100 is a placeholder value that has no effect with only one path between sites; it is set explicitly so that a future second link would have something to be cheaper than.

```powershell
# ---- Subnet objects: every subnet of baseline §5.2, each mapped to exactly one site
$subnetMap = @{
    'HQ-ShaTin'   = @('10.10.10.0/24','10.20.20.0/24','10.10.30.0/24','10.10.40.0/23','10.10.45.0/24',
                      '10.10.50.0/28','10.10.60.0/24','10.70.0.0/24','10.10.80.0/24','10.10.90.0/24',
                      '10.10.100.0/30','10.10.100.4/30','10.10.100.32/30','10.10.100.36/30','10.10.100.40/30',
                      '10.255.0.0/24','192.0.2.0/24','198.51.100.0/29','203.0.113.0/29',
                      '10.10.200.0/24','10.10.200.64/26','10.10.201.0/24','10.10.202.0/24')
    'BR-KwunTong' = @('10.10.110.0/24','10.10.111.0/24','10.10.112.0/24','10.10.113.0/24')
    'MO-Macau'    = @('10.10.120.0/24','10.10.121.0/24')
    'WC-WanChai'  = @('10.10.130.0/24','10.10.131.0/24')
}

foreach ($site in $subnetMap.Keys) {
    foreach ($cidr in $subnetMap[$site]) {
        $parts = $cidr -split '/'
        if (-not (Get-ADReplicationSubnet -Filter "Name -eq '$cidr'" -ErrorAction SilentlyContinue)) {
            New-ADReplicationSubnet -Name $cidr -Site $site
        } else {
            Set-ADReplicationSubnet -Identity $cidr -Site $site
        }
    }
}
```

**[ASSUMPTION] and honest limitation.** `New-ADReplicationSubnet` in Windows PowerShell validates the combined `address/prefix` string using an IP-and-mask parser. The WireGuard, OpenVPN and IKEv2 pool ranges are included above because they describe where those clients will appear from, but a `/26` inside `10.10.200.0/24` is a *more specific* match than the `/24` and AD site resolution honours the longest match. If the pinned `New-ADReplicationSubnet` form rejects any of these entries, the alternative is to create them with `ADSI Edit` against `CN=Subnets,CN=Sites,CN=Configuration,...` or with `ldifde`, and to record in the build log which method was actually used. Do not silently omit a subnet: the baseline's rule is that no subnet in §5.2 may be unmapped.

```powershell
# ---- Verification: no unmapped subnets, and site-link interval as configured
Get-ADReplicationSubnet -Filter * -Properties Site |
    Select-Object Name, @{n='Site';e={$_.Site}} | Sort-Object Name | Format-Table -AutoSize

# Any subnet with a blank Site is a defect
Get-ADReplicationSubnet -Filter * | Where-Object { -not $_.Site } | Select-Object Name

Get-ADReplicationSiteLink -Filter * | Select-Object Name, ReplicationFrequencyInMinutes, Cost, SitesIncluded

# ---- Replication health
repadmin /showrepl
repadmin /replsummary
repadmin /bridgeheads /verbose
dcdiag /v
dcdiag /test:replications /test:advertising /test:fsmocheck /test:netlogons /test:services /test:sysvolcheck
```

```text
[repadmin /showrepl — vpnz-dc02, excerpt]
DC=vertexpeak,DC=fyp,DC=lab
Default-First-Site-Name\VPNZ-DC02
DSA Options: IS_GC
Site Options: (none)
DSA object GUID: 8f2c...
DSA invocationID: 41be...

==== INBOUND NEIGHBORS ====

DC=vertexpeak,DC=fyp,DC=lab
    HQ-ShaTin\VPNZ-DC01 via RPC
        DSA object GUID: 6a04...
        Last attempt @ 2026-10-06 14:22:11 was successful.
        2 consecutive failure(s).                  <-- must reach 0
        Last success @ 2026-10-06 14:22:11.

[dcdiag /v — vpnz-dc01, excerpt]
   Testing server: HQ-ShaTin\VPNZ-DC01
      Starting test: Advertising
         ......................... VPNZ-DC01 passed test Advertising
      Starting test: FrsEvent
         ......................... VPNZ-DC01 passed test FrsEvent
      Starting test: DFSREvent
         ......................... VPNZ-DC01 passed test DFSREvent
      Starting test: SysVolCheck
         ......................... VPNZ-DC01 passed test SysVolCheck
      Starting test: KccEvent
         ......................... VPNZ-DC01 passed test KccEvent
      Starting test: NetLogons
         ......................... VPNZ-DC01 passed test NetLogons
      Starting test: Services
         ......................... VPNZ-DC01 passed test Services
      Starting test: FSMOCheck
         ......................... VPNZ-DC01 passed test FSMOCheck
```

The `2 consecutive failure(s)` line above is shown deliberately: a fresh DC often reports a couple of failures from the window between DNS registration and the first successful replication. **A non-zero failure count is a diagnostic prompt, not automatically a fault** — the correct action is to note the timestamp, wait one replication interval, run `repadmin /showrepl` again, and only then treat a persisting count as a defect. The troubleshooting register in §7.12 uses this exact distinction.

```powershell
# Force an inbound replication of every partition on every DC, then re-check
repadmin /syncall /AdeP
# /A = all partitions, /d = distinguished-name style output, /e = enterprise (all DCs), /P = push
```

#### 7.3.6 Group Policy

The baseline fixes eleven GPO names. This subsection implements the six that carry security weight, plus the certificate-distribution GPO that §7.4 depends on. Each entry states the exact settings and the reason. All GPOs are created in `CN=Policies,CN=System,DC=vertexpeak,DC=fyp,DC=lab` and backed up with `Backup-Gpo` into the repository so that the *policy*, not just its effect, is evidence.

Every GPO is created and linked from `vpnz-jump01` (10.20.20.31) because that is the administrative entry point, and every GPO change is exported as XML by the `Export-GPOBackup.ps1` script of the automation line.

| ID | GPO name (baseline) | Linked to | Purpose |
|---|---|---|---|
| G-1 | `GPO-WS-Baseline-Security` | `OU=Computers/OU=Workstations` | Password/lockout baseline, screen-lock timeout, LLMNR off, SMB signing, USB mass storage read-only |
| G-2 | `GPO-Audit-Advanced` | domain root | The advanced audit subcategory set the AI triage and the troubleshooting chapter depend on |
| G-3 | `GPO-SRV-Tier0-Baseline` | `OU=Servers/OU=Tier0-DomainControllers` | DC hardening, interactive logon restricted to `GG-Tier0-Admins`, SYSVOL audit |
| G-4 | `GPO-SRV-Member-Server-Baseline` | `OU=Servers/OU=MemberServers` | Windows Firewall profile hardening, restricted groups, service hardening, WinRM, RDP restriction |
| G-5 | `GPO-SRV-DMZ-Baseline` | `OU=Servers/OU=DMZ-Servers` | No domain-admin logon, restricted logon rights, separate local accounts |
| G-6 | `GPO-WS-Windows-LAPS` | `OU=Computers` | Local administrator password rotation |
| G-0 | `GPO-WS-Deploy-CA-Root` | domain root | Distributes the internal CA chain (required by §7.4 and by the Linux trust relationship in §7.9) |

All are created with the same helper:

```powershell
function New-VpGpo {
    param([string]$Name, [string]$Target, [string]$Comment)
    if (-not (Get-GPO -Name $Name -ErrorAction SilentlyContinue)) {
        New-GPO -Name $Name -Comment $Comment
    }
    New-GPLink -Name $Name -Target $Target -Enforced:$false
    Set-GPRegistryValue -Name $Name -Key 'HKLM\SOFTWARE\VertexPeak' -ValueName 'GpoId' -Type String -Value $Comment
}
```

##### G-1 `GPO-WS-Baseline-Security` — the workstation and password baseline

```powershell
$G = 'GPO-WS-Baseline-Security'

# --- Password and lockout policy (baseline §7.2.8) ---
Set-GPRegistryValue -Name $G -Key 'HKLM\Software\Microsoft\Windows\CurrentVersion\Policies\System' `
    -ValueName 'MaxDevicePasswordFailedAttempts' -Type DWord -Value 5      # lockout threshold
Set-GPRegistryValue -Name $G -Key 'HKLM\Software\Microsoft\Windows\CurrentVersion\Policies\System' `
    -ValueName 'InactivityTimeoutSecs' -Type DWord -Value 600              # screen lock 10 min

# Account policy values that live in the Security template, applied via secedit on the GPO
$inf = @'
[Unicode]
Unicode=yes
[System Access]
MinimumPasswordLength = 14
PasswordHistorySize = 24
MaximumPasswordAge = 60
MinimumPasswordAge = 1
PasswordComplexity = 1
ClearTextPassword = 0
LockoutBadCount = 5
ResetLockoutCount = 15
LockoutDuration = 15
AllowAdministratorLockout = 1
EnableAdminAccount = 0
'@
$inf | Out-File 'C:\FYP\config\GPO-WS-Baseline-Security.inf' -Encoding unicode
# Imported into the GPO's Security Settings via GPMC (Computer Configuration > Policies >
# Windows Settings > Security Settings > Account Policies), then exported for the repository.

# --- Screen lock: machine inactivity limit plus interactive logon banner ---
Set-GPRegistryValue -Name $G -Key 'HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System' `
    -ValueName 'LegalNoticeCaption' -Type String -Value 'Vertex Peak — authorised use only'

# --- SMB hardening: signing required, SMBv1 removed from the client ---
Set-GPRegistryValue -Name $G -Key 'HKLM\SYSTEM\CurrentControlSet\Services\LanmanWorkstation\Parameters' `
    -ValueName 'RequireSecuritySignature' -Type DWord -Value 1
Set-GPRegistryValue -Name $G -Key 'HKLM\SYSTEM\CurrentControlSet\Services\LanmanServer\Parameters' `
    -ValueName 'RequireSecuritySignature' -Type DWord -Value 1
Set-GPRegistryValue -Name $G -Key 'HKLM\SYSTEM\CurrentControlSet\Services\LanmanWorkstation\Parameters' `
    -ValueName 'EnableSecuritySignature' -Type DWord -Value 1
Set-GPRegistryValue -Name $G -Key 'HKLM\SYSTEM\CurrentControlSet\Services\mrxsmb10' `
    -ValueName 'Start' -Type DWord -Value 4      # SMBv1 driver disabled

# --- LLMNR off (removes a well-known credential-relay vector) ---
Set-GPRegistryValue -Name $G -Key 'HKLM\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient' `
    -ValueName 'EnableMulticast' -Type DWord -Value 0

# --- USB mass storage read-only: deny write access, leave read in place for lab media ---
Set-GPRegistryValue -Name $G -Key 'HKLM\SYSTEM\CurrentControlSet\Policies' `
    -ValueName 'WriteProtect' -Type DWord -Value 1
```

| Setting | Value | Why |
|---|---|---|
| `MinimumPasswordLength` | 14 | See §7.2.8 |
| `LockoutBadCount` / `LockoutDuration` | 5 / 15 min | Makes the brute-force detection in §7.9 and the AI triage scenario demonstrable |
| `AllowAdministratorLockout` | 1 | Removes the last un-lockable brute-force target |
| `InactivityTimeoutSecs` | 600 | A workstation unattended in a shared office is the highest-probability data-exposure path in the scenario. 10 minutes is the value fixed by the baseline |
| `RequireSecuritySignature` (both sides) | 1 | Stops SMB relay and tampering between the `Z-USER` workstation estate and `vpnz-fs01`. This is a precondition for trusting the FSRM quota evidence in §7.5 |
| LLMNR `EnableMulticast` | 0 | LLMNR is the primary name-resolution path used by credential-relay tooling. Turning it off costs nothing because DNS is authoritative in this design |
| `WriteProtect` | 1 | USB mass storage is a data-exfiltration route out of a FinTech office; read-only still allows the group to use lab media for evidence transfer |

##### G-2 `GPO-Audit-Advanced` — the audit policy the troubleshooting chapter depends on

```powershell
$G = 'GPO-Audit-Advanced'
# Configured through Computer Configuration > Windows Settings > Security Settings > Advanced Audit
# Policy Configuration > Audit Policies. The equivalent command-line check after application is:
auditpol /get /category:*
```

The subcategory set, and why each event is needed:

| Subcategory | Setting | Events produced | Why this project needs it |
|---|---|---|---|
| Logon/Logoff → Logon | Success and Failure | 4624, 4625 | 4624/4625 are two of the seven event IDs the AI triage surface reads. 4625 is what the brute-force scenario in the AI line consumes |
| Logon/Logoff → Logoff | Success | 4634 | Correlates with 4624 to give session duration |
| Account Management → User Account Management | Success and Failure | 4720, 4722, 4724, 4725, 4726, 4738 | 4720 (created) is read by the AI triage; the whole set gives "documented least privilege" an audit trail |
| Account Management → Security Group Management | Success and Failure | 4728, 4732, 4756 | 4728/4732 are read by the AI triage. This is the event that reveals an unauthorised privilege escalation |
| Account Management → Computer Account Management | Success | 4741, 4742, 4743 | Detects a host being silently domain-joined |
| Account Logon → Kerberos Authentication Service | Success and Failure | 4768, 4771, 4772 | 4771 (pre-authentication failed) is the Kerberos-side equivalent of 4625 and catches attempts that never reach a logon event |
| DS Access → Directory Service Changes | Success | 5136, 5137, 5139 | Object modification history on Tier-0 objects |
| Detailed Tracking → Process Creation | Success | 4688 **with** *Include command line in process creation events* enabled | The single most useful troubleshooting event in the whole set: it turns "something ran" into "this exact command ran". Enabling command-line capture is a deliberate trade-off — it can record a secret passed on a command line, and that risk must be stated |
| Policy Change → Audit Policy Change | Success | 4719 | Detects an attacker (or a student) disabling auditing |
| System → Security System Extension | Success | 7045 | Service installation. 7045 is read by the AI triage and is the classic persistence mechanism |
| Object Access → File Share | Success and Failure | 5140, 5145 | Proves which account touched which file on the FSRM shares — the "auditable file access" the due-diligence list demands |
| Object Access → Removable Storage | Success and Failure | 4656, 4663 | Pairs with the USB write-protect setting in G-1: the setting prevents the write, the audit records the attempt |
| Logon/Logoff → Account Lockout | Success | 4740 | 4740 is read by the AI triage and is the cleanest signal that the lockout policy is working |

The audit policy is verified from a domain controller with `auditpol /get /category:*` and by provoking one event of each class on a workstation and capturing it in Event Viewer.

##### G-3 `GPO-SRV-Tier0-Baseline` — domain controller hardening

```powershell
$G = 'GPO-SRV-Tier0-Baseline'
$T0 = 'OU=Servers,OU=Computers,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab'
New-VpGpo -Name $G -Target 'OU=Tier0-DomainControllers,OU=Servers,OU=Computers,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab' -Comment 'Tier-0 DC baseline'

# Restricted groups: only GG-Tier0-Admins becomes a local Administrator on a DC
Set-GPRegistryValue -Name $G -Key 'HKLM\SOFTWARE\VertexPeak' -ValueName 'RestrictedGroups' -Type String `
    -Value 'Administrators = VERTEXPEAK\GG-Tier0-Admins; VERTEXPEAK\Domain Admins (da-vertexpeak only)'

# Interactive logon right restricted to the Tier-0 group
# (Computer Configuration > Windows Settings > Security Settings > Local Policies > User Rights Assignment)
#   Allow log on locally        : VERTEXPEAK\GG-Tier0-Admins
#   Allow log on through RDS    : VERTEXPEAK\GG-Tier0-Admins
#   Deny access to this computer from the network : VERTEXPEAK\GG-Helpdesk

# SYSVOL and NTDS directory auditing
auditpol /set /subcategory:"File System" /success:enable /failure:enable
```

| Setting | Value | Why |
|---|---|---|
| Interactive logon right on DCs | `GG-Tier0-Admins` only | A domain controller that any member-server administrator can log into interactively is one privilege hop away from total compromise. This is the concrete expression of the two-tier model in §7.2.7 |
| RDP logon right on DCs | `GG-Tier0-Admins` only | Same reasoning, and it matches TB-07's restriction of RDP to `Z-MGMT` |
| Deny network logon to `GG-Helpdesk` | set | Helpdesk has no business authenticating to a DC over the network, and denying it explicitly is cheaper than proving a negative later |
| Directory Services access auditing on SYSVOL | enabled | Baseline §9.3 requires SYSVOL audit; it is also the evidence that a GPO backup is protected |
| LM hash storage | disabled | Prevents the weaker hash from being stored at all; with Windows Server 2025 this is default, but it is asserted explicitly so the evidence is a check rather than an assumption |
| NTLM auditing | enabled (all) | Produces the data that justifies removing NTLM later, and surfaces anything in the lab still depending on it |

##### G-4 `GPO-SRV-Member-Server-Baseline` — firewall and service hardening

```powershell
$G = 'GPO-SRV-Member-Server-Baseline'
New-VpGpo -Name $G -Target 'OU=MemberServers,OU=Servers,OU=Computers,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab' `
    -Comment 'Member server baseline: firewall, restricted groups, service hardening'

# --- Windows Firewall: all three profiles on, inbound default block, outbound default allow with logging
$fw = 'HKLM\SOFTWARE\Policies\Microsoft\WindowsFirewall'
Set-GPRegistryValue -Name $G -Key "$fw\DomainProfile" -ValueName 'EnableFirewall'    -Type DWord -Value 1
Set-GPRegistryValue -Name $G -Key "$fw\DomainProfile" -ValueName 'DefaultInboundAction'  -Type DWord -Value 1   # Block
Set-GPRegistryValue -Name $G -Key "$fw\DomainProfile" -ValueName 'DefaultOutboundAction' -Type DWord -Value 0   # Allow
Set-GPRegistryValue -Name $G -Key "$fw\DomainProfile" -ValueName 'LogFilePath'        -Type String -Value '%systemroot%\system32\LogFiles\Firewall\domainfw.log'
Set-GPRegistryValue -Name $G -Key "$fw\DomainProfile" -ValueName 'LogFileSize'        -Type DWord  -Value 32767
Set-GPRegistryValue -Name $G -Key "$fw\PrivateProfile" -ValueName 'EnableFirewall'    -Type DWord -Value 1
Set-GPRegistryValue -Name $G -Key "$fw\PublicProfile"  -ValueName 'EnableFirewall'    -Type DWord -Value 1
Set-GPRegistryValue -Name $G -Key "$fw\PublicProfile"  -ValueName 'DefaultInboundAction' -Type DWord -Value 1

# --- Restricted groups: local Administrators = GG-Server-Admins, nothing else
# (Computer Configuration > Policies > Windows Settings > Security Settings > Restricted Groups)
#   Administrators  -> VERTEXPEAK\GG-Server-Admins
#   Remote Desktop Users -> VERTEXPEAK\GG-Server-Admins

# --- Service hardening: disable what this estate does not need
$svc = 'HKLM\SYSTEM\CurrentControlSet\Services'
foreach ($pair in @(
    @{k="$svc\Spooler"; v='Start'; d=4},        # Print Spooler — classic lateral-movement abuse path
    @{k="$svc\RemoteRegistry"; v='Start'; d=4}, # remote registry — not used for management here
    @{k="$svc\WinRM"; v='Start'; d=2}           # WinRM — REQUIRED for Ansible; explicitly enabled
)) {
    Set-GPRegistryValue -Name $G -Key $pair.k -ValueName $pair.v -Type DWord -Value $pair.d
}

# --- WinRM service configuration for the automation line (report §10)
Set-GPRegistryValue -Name $G -Key 'HKLM\SOFTWARE\Policies\Microsoft\Windows\WinRM\Service' `
    -ValueName 'AllowBasic' -Type DWord -Value 0
Set-GPRegistryValue -Name $G -Key 'HKLM\SOFTWARE\Policies\Microsoft\Windows\WinRM\Client' `
    -ValueName 'AllowBasic' -Type DWord -Value 0
```

| Setting | Value | Why |
|---|---|---|
| Domain/Private/Public `EnableFirewall` | 1 | A host firewall is a second policy layer independent of the nftables pair and the ASA. Defence in depth means the control is repeated, not centralised |
| `DefaultInboundAction` | Block | The allow-list discipline of the baseline port matrix (§10) is only meaningful if the default is deny. Anything not in that matrix must be dropped *on the host* as well as on the perimeter |
| `LogFileSize` / `LogFilePath` | 32767 KB, explicit path | Baseline requires one screenshot per zone boundary showing a denied packet. On a Windows host, that screenshot is the firewall log |
| Restricted `Administrators` | `GG-Server-Admins` only | Local administrator is the most abused group in any Windows estate. Binding it to one named group at policy level means a server cannot be given away by a local change |
| Spooler `Start = 4` | disabled | Print Spooler is a repeated remote-code-execution and privilege-escalation vector and nothing in this design prints |
| RemoteRegistry `Start = 4` | disabled | No management task in this project uses it |
| WinRM `Start = 2` | **enabled** | Deliberately *opposite* to the other two. The entire automation line depends on WinRM (port matrix `P-10`), so it is explicitly enabled here and its Basic-auth transport is explicitly disabled, forcing HTTPS/`5986` with an internal-CA-signed certificate |

**RDP restriction** is delivered in the same GPO through the user-rights assignment and the firewall rule set: RDP (`P-09`) is permitted only from `Z-MGMT` (10.20.20.0/24) to member servers, matching TB-07, and is denied for ordinary users by TB-01. A host firewall rule scoped to the management subnet is the enforceable form of that statement:

```powershell
# Applied by GPO preference (Computer Configuration > Preferences > Control Panel Settings > Firewall)
# rather than by a one-off netsh call, so that it is policy and not local state.
New-NetFirewallRule -DisplayName 'VP-RDP-Management-Only' -Direction Inbound -Protocol TCP `
    -LocalPort 3389 -RemoteAddress 10.20.20.0/24 -Action Allow -Profile Domain
New-NetFirewallRule -DisplayName 'VP-RDP-Deny-All-Else' -Direction Inbound -Protocol TCP `
    -LocalPort 3389 -Action Block -Profile Domain
```

##### G-5 `GPO-SRV-DMZ-Baseline` — DMZ host baseline

The DMZ baseline suppresses the member-server baseline's inherited rights and replaces them.

| Setting | Value | Why |
|---|---|---|
| *Deny log on as a service* | `VERTEXPEAK\Domain Admins` | A domain-admin credential that can start a service on a DMZ host is a credential that will eventually be harvested there |
| *Deny access to this computer from the network* | `VERTEXPEAK\GG-Server-Admins`, `VERTEXPEAK\GG-Tier0-Admins` | This is the technical form of the rule that DMZ hosts are administered from `vpnz-dmzjump01` (10.10.90.27) only, per TB-15 |
| *Deny log on locally* | `VERTEXPEAK\Domain Admins` | Prevents cached-credential harvesting on a host that a compromise of the DMZ would expose |
| Local accounts | Separate, non-domain local administrator account, password in LAPS scope | Makes DMZ administration independent of the domain, which is the point of the zone |
| Loopback/inheritance | `GPO-WS-PowerShell-Logging` and `GPO-WS-Drive-Maps` blocked for this OU | A DMZ host must not attempt to map a drive into `Z-SERVER`; TB-04 denies it at the network layer and the GPO removes the attempt |
| Firewall | All profiles on, inbound block, **only** 80/443 inbound from the reverse proxies (10.10.90.10/.11) and 5986 from `Z-MGMT` | The DMZ host's allow-list is narrower than the member-server one |

**The unresolved decision this GPO depends on.** Baseline §19 open item **O-05** asks whether DMZ hosts are domain-joined or workgroup-isolated, to be closed by end of week 7. Both answers are defensible and the group must record which it took:

- **Domain-joined** (implemented above): Group Policy applies, LAPS works, certificates autoenrol, but a compromised DMZ host holding cached domain credentials is a real risk. Mitigations: deny domain-admin logon, `Protected Users`-style restrictions, and no cached-credential fallback on the service account.
- **Workgroup-isolated**: no cached domain credential at all, but every setting in this GPO must then be applied by local policy and updated by Ansible over WinRM with a local account. Certificate enrolment becomes manual.

**This section's implementation assumes domain-joined**, because it is the only variant that lets GPO be the delivery mechanism for the DMZ hardening, and because the IIS nodes need certificates for `www.vertexpeak.example`. If the group chooses workgroup isolation, the hardening content of G-5 is unchanged but its delivery method changes to `secedit` local policy deployed by the automation line, and that substitution must be recorded.

##### G-6 `GPO-WS-Windows-LAPS` — local administrator password rotation

```powershell
$G = 'GPO-WS-Windows-LAPS'
New-VpGpo -Name $G -Target 'OU=Computers,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab' -Comment 'Windows LAPS'

# LAPS schema extension must be applied to the forest BEFORE the GPO has anything to write to
Update-LapsADSchema
# Then grant the management group the right to read the password attribute
Set-LapsADReadPasswordPermission -Identity 'OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab' `
    -AllowedPrincipals 'VERTEXPEAK\GG-Server-Admins','VERTEXPEAK\GG-Workstation-Admins'
Set-LapsADComputerSelfPermission -Identity 'OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab'
```

| Setting | Value | Why |
|---|---|---|
| Password rotation | 30 days, 20-character minimum, complexity on | Long enough not to churn, short enough that a harvested password has a bounded life |
| Backup to AD | enabled | The password is stored in the directory so that recovery does not depend on a single workstation |
| Post-authentication action | reset the password | This is the control that defeats pass-the-hash: a password that has been used once is no longer valid |
| Read permission | `GG-Server-Admins`, `GG-Workstation-Admins` | Reading a LAPS password is itself an auditable privileged action |

**Why LAPS matters more here than in a normal build.** Every Windows guest except the DCs is a clone of `W2K25-TEMPLATE-01` (baseline §6). Without LAPS, those clones share a local administrator password by construction, and a single compromised workstation exposes the entire member-server estate. LAPS is the specific mitigation for a specific artefact of the template-clone strategy, and the report should say so plainly.

##### G-0 `GPO-WS-Deploy-CA-Root` — certificate trust distribution

```powershell
$G = 'GPO-WS-Deploy-CA-Root'
New-VpGpo -Name $G -Target 'DC=vertexpeak,DC=fyp,DC=lab' -Comment 'Distribute VP-ROOT-CA / VP-ISSUING-CA-01'
# The CA certificate is placed in:
#   Computer Configuration > Policies > Windows Settings > Security Settings > Public Key Policies
#   > Trusted Root Certification Authorities  (and > Intermediate Certification Authorities for the issuing CA)
# Verified after gpupdate with:
Get-ChildItem Cert:\LocalMachine\Root | Where-Object Subject -like '*VP-*' | Select-Object Subject, Thumbprint, NotAfter
```

This GPO is what makes the internal PKI of §7.4 trusted by every domain-joined Windows host without manual certificate installation, and it is the Windows half of the cross-platform trust relationship described in §7.9.

##### Applying and proving Group Policy

```powershell
# Force application on a target and capture the result set
gpupdate /force
gpresult /h C:\FYP\config\gpresult_$(hostname).html /f

# Prove which GPO won a specific setting (the "Resultant Set of Policy" view)
gpresult /scope:computer /v | Select-String -Pattern 'GPO-WS-Baseline-Security','GPO-SRV-Member-Server-Baseline'

# Export every GPO as evidence (also the automation-line script Export-GPOBackup.ps1)
$backup = "C:\FYP\config\gpo-backup-$(Get-Date -Format yyyy-MM-dd)"
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Backup-Gpo -All -Path $backup -Comment "Weekly GPO backup $(Get-Date -Format yyyy-MM-dd)"
Get-ChildItem $backup | Measure-Object | Select-Object Count   # Expected: 11 GPOs
```

```text
[GPO APPLIED — gpresult /scope:computer /v, excerpt on vpnz-fs01]
  Applied Group Policy Objects
  -----------------------------
  GPO-SRV-Member-Server-Baseline
  GPO-Audit-Advanced
  GPO-WS-Deploy-CA-Root
  GPO-WS-Windows-LAPS
  Default Domain Policy

  The following GPOs were not applied because they were filtered out
  -------------------------------------------------------------------
  GPO-SRV-DMZ-Baseline
      Filtering:  Not Applied (Empty)
  GPO-WS-Drive-Maps
      Filtering:  Not Applied (User settings, no user logged on)
```

The **negative** result is as important as the positive one: `GPO-SRV-DMZ-Baseline` listing as *Not Applied (Empty)* proves that the DMZ baseline does not reach a member server, which is the whole reason the OU split exists. A `gpresult` in which every GPO applies everywhere is a signal that the OU structure is not doing its job.

#### 7.3.7 Verification

| # | Check | Exact command | Expected result |
|---|---|---|---|
| V-01 | Forest and domain identity | `Get-ADForest \| Select-Object Name, ForestMode, RootDomain` | `vertexpeak.fyp.lab`, `Win2025Forest`, `vertexpeak.fyp.lab` |
| V-02 | Domain functional level and NetBIOS | `Get-ADDomain \| Select-Object Name, NetBIOSName, DomainMode` | `vertexpeak.fyp.lab`, `VERTEXPEAK`, `Win2025Domain` |
| V-03 | FSMO placement | `netdom query fsmo` | All five roles on `vpnz-dc01.vertexpeak.fyp.lab` |
| V-04 | Both DCs operating | `Get-ADDomainController -Filter * \| Select-Object Name, Site, IsGlobalCatalog, OperatingSystem` | `VPNZ-DC01` and `VPNZ-DC02`, site `HQ-ShaTin`, `IsGlobalCatalog True` |
| V-05 | Site named per convention | `Get-ADReplicationSite -Filter *` | `HQ-ShaTin`, `BR-KwunTong`, `WC-WanChai`, `MO-Macau` |
| V-06 | Every subnet mapped | `Get-ADReplicationSubnet -Filter * \| Where-Object { -not $_.Site }` | No output |
| V-07 | Site link interval | `Get-ADReplicationSiteLink -Filter "Name -eq 'LINK-HQ-BR'" \| Select-Object ReplicationFrequencyInMinutes` | `15` |
| V-08 | Replication healthy | `repadmin /replsummary` | `0 / n` failures on every row, all deltas under the 15-minute interval |
| V-09 | DC self-test | `dcdiag /v` | Every test `passed`, including `Advertising`, `SysVolCheck`, `NetLogons`, `FSMOCheck`, `Services` |
| V-10 | DNS service test | `dcdiag /test:dns /dnsall /v` | `passed`; both DCs present as NS records |
| V-11 | AD-integrated zone, secure updates only | `Get-DnsServerZone -Name vertexpeak.fyp.lab \| Select-Object ZoneType, DynamicUpdate, IsDsIntegrated` | `Primary`, `Secure`, `True` |
| V-12 | SRV records exist on both DCs | `Resolve-DnsName _ldap._tcp.dc._msdcs.vertexpeak.fyp.lab -Type SRV -Server 10.10.30.12` | Two SRV answers, port 389 |
| V-13 | OU tree complete | `Get-ADOrganizationalUnit -Filter * -SearchBase 'OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab' \| Measure-Object` | `Count : 37` (the 36 child OUs plus `OU=VertexPeak` itself) |
| V-14 | Nothing stray in the default containers | `Get-ADUser -Filter * -SearchBase 'CN=Users,DC=vertexpeak,DC=fyp,DC=lab'` | Only the built-in accounts, no `OU=`-qualified project objects |
| V-15 | Groups exist with correct scope/category | `Get-ADGroup -Filter 'Name -like "GG-*" -or Name -like "DL-*"' \| Select-Object Name, GroupScope, GroupCategory` | 14 Global, 8 DomainLocal, all Security |
| V-16 | No service account over-privileged | the script in §7.2.5 | No rows |
| V-17 | Fine-grained password policy applied | `Get-ADFineGrainedPasswordPolicy -Filter * \| Select-Object Name, Precedence, MinPasswordLength, MaxPasswordAge` | `FGPP-ServiceAccounts`, precedence 10, 32, 365 days |
| V-18 | Protected Users populated | `Get-ADGroupMember 'Protected Users' \| Select-Object SamAccountName` | The four `adm-{initials}` accounts |
| V-19 | Lockout works | five wrong passwords, then `Get-ADUser adm-03 -Properties LockedOut \| Select-Object LockedOut` | `LockedOut : True` |
| V-20 | Lockout event recorded | `Get-WinEvent -FilterHashtable @{LogName='Security';Id=4740} -MaxEvents 1` | One event naming the target account and the source workstation |
| V-21 | Time is authoritative | `w32tm /query /status` on `vpnz-dc01` and `w32tm /query /source` on `vpnz-fs01` | DC01 source is the configured peer list; `vpnz-fs01` source is `vertexpeak.fyp.lab` (i.e. a DC, not `Local CMOS Clock`) |
| V-22 | Delegation is minimal | `dsacls 'OU=Users,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab'` | `GG-Helpdesk` appears with `Reset Password` and `Change Password` only — no `Write Members`, no `Create Child` |
| V-23 | GPO count and backup | `Get-GPO -All \| Measure-Object` then `Backup-Gpo -All -Path ...` | 11 GPOs; backup directory contains 11 GUID folders each with `bkupInfo.xml` |
| V-24 | DC hardening is actually applied | `reg query 'HKLM\SYSTEM\CurrentControlSet\Control\Lsa' /v LimitBlankPasswordUse` on both DCs | `0x1` |
| V-25 | Firewall policy applied on a member server | `Get-NetFirewallProfile \| Select-Object Name, Enabled, DefaultInboundAction` | all three `Enabled True`, `DefaultInboundAction Block` |
| V-26 | Rogue domain controller prevention | `Get-ADDomain \| Select-Object AllowedDNSSuffixes`, plus the `ms-DS-MachineAccountQuota` value | Quota reduced from the default 10 to 0 for non-admins, so a workstation cannot self-join a rogue DC |

The full transcripts of V-01 … V-26 go into `06-verification/` with test-case identifiers in the baseline's form `TC-L1-01` (AD DS), and the matching screenshots into `07-evidence/` named `{date}_{host}_{what}.png`.

---

### 7.4 Public Key Infrastructure (ADCS)

#### 7.4.1 What the PKI is for

The PKI exists in this project for one non-negotiable reason and three secondary ones.

The non-negotiable reason is due-diligence item 3: *encrypted remote access using certificate-based authentication (no shared passwords)*. The IKEv2 server in §7.8 authenticates the *client* with a machine or user certificate and the *server* presents a certificate to the client; no preshared key is permitted anywhere in the design (baseline §12.1). A certificate authority is therefore a hard dependency of the VPN, not a nice-to-have.

The secondary reasons are: TLS for the IIS nodes (`vpnz-dmzweba01/02`) and for the internal DNS names the reverse proxy re-encrypts to; the LDAPS channel (`P-05`) that the WordPress LDAP bind uses; and a genuine, cross-platform trust anchor, because the same CA chain is trusted on Linux via `/usr/local/share/ca-certificates/vp-root-ca.crt` and `update-ca-certificates` (baseline §9.4).

**WSOS position.** `Setup public key infrastructure services` is a Domain 4 requirement and `Active Directory Certificate Services` is one of its two named nested examples. Unlike §7.5–§7.8, this subsection has direct standard backing and should be presented as such.

#### 7.4.2 Design decision: single-tier or two-tier

Baseline §8.5 allows either, with the honest constraint that four students and twelve weeks is the governing factor, and fixes the naming: `VP-ROOT-CA` (offline root) issuing `VP-ISSUING-CA-01` (online). If the group runs single-tier, `vpnz-dc01` *is* `VP-ISSUING-CA-01`, there is no `VP-ROOT-CA`, and **the report must state which model was used**.

| Model | Advantages | Costs in this project | Recommendation |
|---|---|---|---|
| **Single-tier** — `vpnz-dc01` is `VP-ISSUING-CA-01`, no separate root | One VM, no offline key ceremony, no CRL of the root to publish, fits the 12-week schedule | The issuing CA and a domain controller share a host, so a compromise of the DC compromises the CA; the root key is online whenever the CA is | **Take this as the baseline case.** State the compromise plainly and note that it is a lab simplification |
| **Two-tier** — `VP-ROOT-CA` offline (on removable media or a shut-down VM) issuing `VP-ISSUING-CA-01` on `vpnz-dc01` or `vpnz-pki01` (10.10.30.15) | The root private key is never online; matches real enterprise practice; the CRL/AIA publication design becomes meaningful | Two hosts to build, a documented offline ceremony, the root must be brought back online to re-issue the issuing CA, and this competes for time with the `must` priorities of baseline §13.4 R-02 | Take it **only if** the single-tier build is complete and verified before the end of week 8 |

**Consequence either way.** `vpnz-pki01` (10.10.30.15) is only deployed under the two-tier decision. If single-tier is taken, the address stays unallocated and this fact is recorded in the decision log, because otherwise a reader of the addressing plan will reasonably ask why an address is reserved but unused.

The build below is written for the **single-tier** case, with the two-tier deltas noted in §7.4.6.

#### 7.4.3 Enterprise Root CA installation

The CA is an **Enterprise** CA, not a Standalone CA, so that certificate templates are used, autoenrolment works through Group Policy, and certificates can be requested from the certificate console without an out-of-band approval workflow.

```powershell
# ---- 7.4.3 STEP 1: install AD CS on vpnz-dc01 ----
Install-WindowsFeature -Name ADCS-Cert-Authority -IncludeManagementTools
Get-WindowsFeature ADCS-Cert-Authority | Select-Object Name, InstallState
# Expected:  ADCS-Cert-Authority   Installed
```

```powershell
# ---- 7.4.3 STEP 2: configure the CA ----
# CA common name is VP-ISSUING-CA-01 exactly (baseline §8.5 / §16 interface contract).
# Under the single-tier decision this host IS the issuing CA.
Install-AdcsCertificationAuthority `
    -CAType EnterpriseRootCa `
    -CryptoProviderName 'RSA#Microsoft Software Key Storage Provider' `
    -KeyLength 4096 `
    -HashAlgorithmName SHA256 `
    -CACommonName 'VP-ISSUING-CA-01' `
    -CADistinguishedNameSuffix 'DC=vertexpeak,DC=fyp,DC=lab' `
    -ValidityPeriod Years `
    -ValidityPeriodUnits 10 `
    -Force
```

| Parameter | Value | Why |
|---|---|---|
| `-CAType` | `EnterpriseRootCa` | Enterprise integration: templates, autoenrolment, LDAP-based publication. Under two-tier, the offline root is `StandaloneRootCa` and this host becomes `EnterpriseSubordinateCa` |
| `-CryptoProviderName` | `RSA#Microsoft Software Key Storage Provider` | KSP rather than the legacy CSP, so the key is protected by the modern provider and CNG. **[ASSUMPTION]** the exact provider string must be confirmed with `certutil -csplist` on the built host; the alternative form is `-CryptoProviderName "RSA#Microsoft Software Key Storage Provider"` versus the legacy `"Microsoft Strong Cryptographic Provider"`, and if the KSP string is rejected the legacy form must be used and the deviation recorded |
| `-KeyLength` | 4096 | Baseline §8.5 rule: issuing CA is 10 years. A 10-year authority key at 2048 bits is weaker than the project's own 60-day password policy justifies. **[ASSUMPTION]** the rationale that 4096 is warranted for a long-lived issuing CA; the alternative is 2048, which is still acceptable and would be faster to generate |
| `-HashAlgorithmName` | SHA256 | SHA-1 must not be used for any new authority; this is asserted explicitly so the evidence shows the value rather than a default |
| `-CACommonName` | `VP-ISSUING-CA-01` | Exact string from the interface contract. Not `VertexPeak-CA`, not `VP-CA01` |
| `-CADistinguishedNameSuffix` | `DC=vertexpeak,DC=fyp,DC=lab` | Places the CA object in the directory correctly |
| `-ValidityPeriod` / `-ValidityPeriodUnits` | `Years` / `10` | Issuing CA = 10 years. Under two-tier, the root is 20 years |
| `-Force` | present | Non-interactive |

```text
[ADCS — Install-AdcsCertificationAuthority, vpnz-dc01]
Message                              Status
-------                              ------
Active Directory Certificate Services Installed
Certification authority configuration Successful

[certutil -getreg CA\CommonName]
  CommonName REG_SZ = VP-ISSUING-CA-01
[certutil -cainfo]
  CA Name:            VP-ISSUING-CA-01
  CA Type:            Enterprise Root CA
  Hash Algorithm:     SHA256
  Key Length:         4096
  NotBefore:          2026-10-06 09:14:02
  NotAfter:           2036-10-06 09:23:41
  CRL Distribution Point(s):
    http://vpnz-dc01.vertexpeak.fyp.lab/CertEnroll/VP-ISSUING-CA-01.crl
    file://\\vpnz-dc01\CertEnroll\VP-ISSUING-CA-01.crl
  Authority Information Access:
    http://vpnz-dc01.vertexpeak.fyp.lab/CertEnroll/vpnz-dc01_VP-ISSUING-CA-01.crt
```

#### 7.4.4 CRL and AIA publication

By default an Enterprise CA publishes its CRL and AIA to a local path and to an HTTP URL based on the CA host's FQDN. In this lab that works, because `vpnz-dc01.vertexpeak.fyp.lab` resolves through the AD-integrated zone and the IIS-free `CertEnroll` virtual directory is served by the CA's own HTTP endpoint. Two adjustments are nevertheless required.

First, the CA's **CRL overlap and publication periods** must be set so that the CRL never expires between publications — an expired CRL makes every certificate revocation check fail, which manifests as an apparently random VPN authentication failure (see §7.12).

```powershell
certutil -setreg CA\CRLPeriodUnits 1
certutil -setreg CA\CRLPeriod "Weeks"
certutil -setreg CA\CRLDeltaPeriodUnits 1
certutil -setreg CA\CRLDeltaPeriod "Days"
certutil -setreg CA\CRLOverlapUnits 12
certutil -setreg CA\CRLOverlapPeriod "Hours"
certutil -setreg CA\ValidityPeriodUnits 10
Restart-Service CertSvc
```

Second, the **CRL distribution point and AIA extensions must include the DNS name that clients actually use**, not only the short name. In the baseline the internal service name for the VPN is `vpn.vertexpeak.fyp.lab` (resolving to the nftables VIP 10.10.50.10), while the CA is on `vpnz-dc01`. A client on the Internet cannot reach `vpnz-dc01` by name, so the CRL check for a certificate presented by `vpnz-rras01` must be satisfiable. Two honest options exist and the group must pick one:

- **Option A (recommended).** Keep the default CRL/AIA URLs on `vpnz-dc01.vertexpeak.fyp.lab` and record honestly that the CRL check is only verifiable from inside the lab, because `vpnz-dc01` has no public presence. Add a differential CRL and delta publication, and document that a real deployment would publish the CRL to `198.51.100.5` through the reverse proxy.
- **Option B.** Add a second CDP URL pointing at an internal web endpoint on `vpnz-mon01` or the reverse-proxy VIP, reachable from `Z-REMOTE` through TB-06. This is more faithful but depends on a published service that the lab does not expose publicly.

```powershell
# Inspect the current extensions, then add a controlled additional CDP if Option B is taken
certutil -getreg CA\CRLPublicationURLs
certutil -setreg CA\CRLPublicationURLs "65:%windir%\system32\CertSrv\CertEnroll\%%3%%8%%9.crl\n1:http://vpnz-dc01.vertexpeak.fyp.lab/CertEnroll/%%3%%8%%9.crl"
certutil -setreg CA\CACertPublicationURLs "1:%windir%\system32\CertSrv\CertEnroll\%%1_%%3%%4.crt\n2:http://vpnz-dc01.vertexpeak.fyp.lab/CertEnroll/%%1_%%3%%4.crt"
Restart-Service CertSvc

# Publish a fresh CRL and verify it is retrievable
certutil -CRL
certutil -URL "http://vpnz-dc01.vertexpeak.fyp.lab/CertEnroll/VP-ISSUING-CA-01.crl"
```

#### 7.4.5 Certificate templates and autoenrolment

An Enterprise CA ships with a set of templates, but only those explicitly **published** can be requested. The templates this project needs are fixed by baseline §8.5's certificate subject table.

| Certificate use | Template to publish (built-in name) | Subject | SAN | Enrols from |
|---|---|---|---|---|
| Domain controller | `Kerberos Authentication` and `Domain Controller` | `CN=vpnz-dc01.vertexpeak.fyp.lab` / `vpnz-dc02` | DNS `vpnz-dc01.vertexpeak.fyp.lab`, `vpnz-dc01`, `vertexpeak.fyp.lab`, DC IP | The DCs |
| LDAPS on the DCs | `Kerberos Authentication` (includes server authentication EKU) | same as the domain controller template | same | The DCs |
| **RAS/IKEv2 server** | `RAS and IAS Server` | `CN=vpn.vertexpeak.fyp.lab` | DNS `vpn.vertexpeak.fyp.lab`, `vpnz-rras01.vertexpeak.fyp.lab` | `vpnz-rras01` |
| **Computer (IKEv2 client)** | `Workstation Authentication` (customised: 397-day validity, autoenrolment) | `CN=vpn.vertexpeak.fyp.lab` on the IKEv2 client template, unique per machine | machine FQDN | Domain-joined clients |
| **User (remote-access)** | `User` | unique per user | user UPN, SMTP | Domain users in the VPN groups |
| Web server (IIS) | `Web Server` | `CN=www.vertexpeak.example` | DNS `www.vertexpeak.example`, `www.vertexpeak.fyp.lab` | `vpnz-dmzweba01/02` |
| Reverse proxy (public) | `Web Server` | `CN=portal.vertexpeak.example` | DNS `portal.vertexpeak.example`, `portal.vertexpeak.fyp.lab` | The nginx pair (manual key generation, see §7.9) |
| WordPress (public) | `Web Server` | `CN=blog.vertexpeak.example` | DNS `blog.vertexpeak.example` | The WordPress pair |
| WireGuard mTLS / management | `Computer` | `CN=vpnz-nft01.vertexpeak.fyp.lab` | DNS `wg.vertexpeak.fyp.lab` | `vpnz-nft01` |
| ASA identity certificate | `Web Server` or a custom IPsec template | `CN=VP-HQ-FW-01.vertexpeak.fyp.lab` | DNS `VP-HQ-FW-01.vertexpeak.fyp.lab` | Manual import into the ASA |

```powershell
# ---- Publish templates on the CA ----
# Certificate Templates Console equivalents from an elevated prompt on vpnz-dc01:
$templates = 'Kerberos Authentication','Domain Controller','RAS and IAS Server',
             'Workstation Authentication','User','Web Server','Computer'
foreach ($t in $templates) {
    certutil -SetCATemplates +$t
}
certutil -CATemplates
```

```text
[certutil -CATemplates, excerpt]
Kerberos Authentication -- Auto-Enroll: Access is denied.
Domain Controller -- Auto-Enroll: Access is denied.
RAS and IAS Server -- Auto-Enroll: Access is denied.
Workstation Authentication -- Auto-Enroll: Access is denied.
User -- Auto-Enroll: Access is denied.
Web Server -- Auto-Enroll: Access is denied.
Computer -- Auto-Enroll: Access is denied.
```

**That output is the expected, healthy state on a default Enterprise CA, and it is the single most misread output in AD CS.** *Auto-Enroll: Access is denied* here means "no autoenrolment rights are granted through the template ACL *yet*" — not that anything is broken. Autoenrolment is granted in two places: the template's own security ACL (who may *enrol* and who may *autoenrol*) and the Group Policy autoenrolment settings. Both are configured next.

```powershell
# ---- Grant enrol/autoenrol rights on the templates (Certificate Templates Console, or certutil ACLs) ----
# Template ACLs are stored in the Configuration partition under
#   CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,...
# The Windows UI path is: certtmpl.msc > right-click template > Properties > Security,
#   then set "Domain Computers" -> Read + Enroll + Autoenroll.
# Scripted equivalent for verification only (the grant itself is done in certtmpl.msc and captured):
certutil -v -template | Select-String -Pattern 'RAS and IAS Server|Workstation Authentication|Web Server|User'
```

```powershell
# ---- Configure autoenrolment by Group Policy on vpnz-jump01 ----
$G = 'GPO-WS-Cert-AutoEnrol'         # baseline §9.3 — must exist
New-VpGpo -Name $G -Target 'DC=vertexpeak,DC=fyp,DC=lab' -Comment 'Certificate autoenrolment'

# Computer Configuration > Policies > Windows Settings > Security Settings > Public Key Policies
#   > Certificate Services Client - Auto-Enrollment
#     Configuration Model        : Enabled
#     Renew expired certificates : Enabled
#     Update certificates that use certificate templates : Enabled
Set-GPRegistryValue -Name $G `
    -Key 'HKLM\SOFTWARE\Policies\Microsoft\Cryptography\AutoEnrollment' `
    -ValueName 'AEPolicy' -Type DWord -Value 7
# 7 = enroll + renew expired + update template. This one value is the whole autoenrolment switch.
```

```powershell
# ---- Trigger autoenrolment on a client and prove it worked ----
gpupdate /force
certutil -pulse
Get-ChildItem Cert:\LocalMachine\My |
    Where-Object { $_.Issuer -like '*VP-ISSUING-CA-01*' } |
    Select-Object Subject, Issuer, Thumbprint, NotBefore, NotAfter,
        @{n='EKU';e={($_.Extensions | Where-Object Oid -like '*2.5.29.37*').Format($false)}}
```

```text
[AUTOENROLMENT — vpnz-rras01, after certutil -pulse]
Certificate Request Processor: The operation completed successfully. 0x0 (WIN32: 0)

Subject      : CN=vpn.vertexpeak.fyp.lab
Issuer       : CN=VP-ISSUING-CA-01, DC=vertexpeak, DC=fyp, DC=lab
Thumbprint   : 9C41D2F7A8B33E6150C0E4A9D17E2B8F4A63D0C1
NotBefore    : 2026-10-06 10:02:17
NotAfter     : 2027-11-07 10:12:17       <-- 397 days per baseline §8.5
EKU          : Server Authentication (1.3.6.1.5.5.7.3.1), Client Authentication (1.3.6.1.5.5.7.3.2)
```

**The 397-day value must be set on the templates, not accepted from the default.** Baseline §8.5 fixes internal TLS certificate validity at a 397-day maximum with 90 days preferred. The built-in templates default to one or two years, so a customised copy of each template is required: in `certtmpl.msc`, duplicate the built-in template, set *Validity period* to the required value, set the *Request handling* and *Subject name* tabs to *Supply in the request* or *Build from this Active Directory information* as appropriate, and publish the copy. The naming convention for the copies must be recorded — the report should use `VP-CLIENT-IKEV2`, `VP-SERVER-RAS`, `VP-WEB-IIS` and `VP-USER-RA` so that a reader can tell a project template from a Microsoft one at a glance.

#### 7.4.6 Two-tier delta

If the two-tier decision is taken, the differences from the above are:

1. `VP-ROOT-CA` is built on a **Standalone Root CA**, `StandaloneRootCa`, 20-year validity, key length 4096, and is taken offline (VM shut down, or its disk detached and stored) immediately after it issues the subordinate.
2. The root's certificate and CRL are published to a location the subordinate can read only during the ceremony, then the root is powered off.
3. `vpnz-dc01` becomes `Install-AdcsCertificationAuthority -CAType EnterpriseSubordinateCa` with a request file; the request is signed by the offline root and the resulting certificate is installed with `certutil -installcert`.
4. `VP-ROOT-CA` must be distributed by `GPO-WS-Deploy-CA-Root` to every host, and added to the Linux trust store as well (baseline §9.4).
5. The root's CRL must be long-lived and published, because it cannot be regenerated while the root is offline. If it is allowed to expire, every certificate in the chain fails revocation checking — a failure mode that appears long after the build and is worth its own line in the troubleshooting register if the group takes this path.

#### 7.4.7 Verification

| # | Check | Exact command | Expected result |
|---|---|---|---|
| PKI-01 | CA installed and started | `Get-Service CertSvc \| Select-Object Status, Name` | `Running`, `CertSvc` |
| PKI-02 | CA identity and type | `certutil -cainfo` | `VP-ISSUING-CA-01`, `Enterprise Root CA` |
| PKI-03 | Published templates | `certutil -CATemplates` | Seven templates listed |
| PKI-04 | One certificate issued per required use | `certutil -view -restrict "Disposition=20" -out "RequestID,CommonName,NotAfter,Template" csv` | Includes `vpn.vertexpeak.fyp.lab` (RAS), `www.vertexpeak.example` (Web), and at least one machine and one user certificate |
| PKI-05 | Autoenrolment reached the client | `certutil -pulse` then `Get-ChildItem Cert:\LocalMachine\My` | A certificate issued by `VP-ISSUING-CA-01`, `NotAfter` ≈ 397 days out |
| PKI-06 | CA chain trusted on a member | `certutil -verify -urlfetch <thumbprint-of-issued-cert>` | `Certificate is valid`, all URLs retrieved, CRL checked |
| PKI-07 | CRL retrievable | `certutil -URL "http://vpnz-dc01.vertexpeak.fyp.lab/CertEnroll/VP-ISSUING-CA-01.crl"` | `Verify complete`, `CRL is current` |
| PKI-08 | Revocation actually takes effect | `certutil -revoke <serial> 1` then, on a client, `certutil -verify <cert>` | Verification fails with `CERT_E_REVOKED` for a revoked certificate; `certutil -CRL` republishes |
| PKI-09 | LDAPS works (port matrix `P-05`) | `ldp.exe` connect to `636` on `vpnz-dc01`, or `Test-NetConnection vpnz-dc01 -Port 636` | `TcpTestSucceeded : True`; LDP shows a bound session over SSL |
| PKI-10 | Root/intermediate distributed by GPO | `Get-ChildItem Cert:\LocalMachine\Root, Cert:\LocalMachine\CA \| Where-Object Subject -like '*VP-*'` | `VP-ISSUING-CA-01` (and `VP-ROOT-CA` under two-tier) present in the correct store on a member server |
| PKI-11 | No self-signed certificate left in service | `Get-ChildItem Cert:\LocalMachine\My \| Where-Object { $_.Issuer -eq $_.Subject }` | No output, or only a documented, superseded build-stage self-signed certificate with its replacement recorded |

PKI-11 is a baseline requirement, not a nicety: baseline §8.5 states that no self-signed certificate may be used for any service in the delivered design except during the documented build step where it is replaced later. The check is the evidence that the replacement happened.

---

### 7.5 File Server Resource Manager (FSRM)

#### 7.5.1 Why FSRM, and what it adds beyond NTFS permissions

**Honesty note first.** `FSRM` occurs **0 times** in the WSOS 2026 text and 0 times in its raw HTML, and 0 times in the 2024 edition. FSRM is a **project choice justified from the topic sheet's own wording** (which names it explicitly) plus two generic Domain 4 hooks: `Install and manage sharing services` (nested `SMB`, `DFS`) and `Manage file systems` (nested `NTFS`, `ReFS`). It must not be presented as a standard requirement.

**What NTFS permissions do and do not do.** An NTFS access control entry answers exactly one question: *may this principal perform this operation on this object*. It is an authorisation control and it is good at being one. What it cannot do is any of the following, and each of these is a real requirement in the Vertex Peak scenario:

| Requirement | NTFS alone | FSRM |
|---|---|---|
| "No single department may consume more than its agreed share of the file server" | Cannot express a *size* rule at all | **Quotas**: hard or soft limits, per-folder or per-volume, with thresholds and notifications |
| "Executable and media files must not be stored on the corporate file server" | Cannot express a *file type* rule | **File screening**: active blocking (deny the write) or passive screening (audit only), by file group, with exceptions |
| "Classify the data so we know what we are protecting" | Nothing | **Classification**: properties attached to files/folders, optionally with automatic classification rules and a file-management task |
| "Show me where the storage actually went" | Nothing | **Storage reports**: duplicate files, large files, files by owner, files by type, least-recently-accessed — on demand or on a schedule |
| "Define a file type once and reuse it in three places" | Nothing | **File groups**: a named set of patterns (`Blocked-Audio-Video`, `Blocked-Executables`) reused by screens, screens with exceptions and reports |

**Scenario fit.** Due-diligence item 2 demands documented least privilege and an audit trail of access to client data. Vertex Peak is an SFC-regulated-adjacent software vendor whose Finance department holds contract and payroll data, and whose Engineering department legitimately needs to move large build artefacts. FSRM is what turns "we told people not to put their music collection on the file server" into a policy the operating system enforces and logs.

**The one honest limitation to state.** FSRM file screening is a **name-extension and pattern** control, not a content-inspection control. `Blocked-Executables` prevents `payload.exe` from being written; it does not prevent `payload.txt.exe` if that pattern is not in the group, and it certainly does not detect a malicious payload inside an allowed `.zip`. Screening is a hygiene control that reduces the attack surface and the storage cost; it is not a malware control and must never be described as one. Its real value in this project is that it is *demonstrable*: a blocked write produces a specific, capturable error.

#### 7.5.2 Installation and initial configuration

```powershell
# ---- On vpnz-fs01 (10.10.30.21) ----
Install-WindowsFeature -Name FS-FileServer, FS-Resource-Manager -IncludeManagementTools

Get-WindowsFeature FS-FileServer, FS-Resource-Manager |
    Select-Object Name, DisplayName, InstallState
```

```text
Name                 DisplayName                                        InstallState
----                 -----------                                        ------------
FS-FileServer        File Server                                        Installed
FS-Resource-Manager  File Server Resource Manager                       Installed
```

Data volumes, per baseline §8.7: `vpnz-fs01` has an 80 GB system volume and a **20 GB data VHDX** attached as a second disk. That second disk is where the shares live, so that quota and screening policy is applied to a volume whose entire purpose is file data — and so that the storage-cost argument for iSCSI in §7.6 has an obvious analogue.

```powershell
# ---- Prepare the data volume ----
Get-Disk | Select-Object Number, FriendlyName, @{n='SizeGB';e={[math]::Round($_.Size/1GB,1)}}, PartitionStyle, OperationalStatus
# Identify the 20 GB data disk (the second disk), then:
$dataDisk = Get-Disk | Where-Object { $_.Size -lt 30GB -and $_.Number -ne 0 }
Initialize-Disk -Number $dataDisk.Number -PartitionStyle GPT
New-Partition -DiskNumber $dataDisk.Number -UseMaximumSize -DriveLetter D |
    Format-Volume -FileSystem NTFS -NewFileSystemLabel 'VP-DATA' -AllocationUnitSize 65536 -Confirm:$false

# ---- Create the four shares exactly as baseline §8.7 fixes them ----
$shares = @(
    @{ Path='D:\Shares\Finance';     Name='Finance';     QuotaGB=20; Screen='exec' }
    @{ Path='D:\Shares\Engineering'; Name='Engineering'; QuotaGB=10; Screen='exec' }
    @{ Path='D:\Shares\SalesRO';     Name='SalesRO';     QuotaGB=10; Screen='exec' }
    @{ Path='D:\Shares\Public';      Name='Public';      QuotaGB=5;  Screen='exec' }
)
foreach ($s in $shares) {
    New-Item -ItemType Directory -Path $s.Path -Force | Out-Null
    if (-not (Get-SmbShare -Name $s.Name -ErrorAction SilentlyContinue)) {
        New-SmbShare -Name $s.Name -Path $s.Path -FullAccess 'VERTEXPEAK\GG-Server-Admins' -ChangeAccess 'Authenticated Users'
    }
}
Get-SmbShare | Where-Object Name -in 'Finance','Engineering','SalesRO','Public' |
    Select-Object Name, Path, ShareState
```

**Share-level versus NTFS-level permissions — the discipline that matters.** Windows applies the *most restrictive combination* of share and NTFS permissions. This project therefore applies broad permissions at the share and precise permissions at the NTFS layer, which is the standard and the only arrangement that keeps an ACL audit tractable:

- **Share permissions** grant `Change` to `Authenticated Users` and `Full` to `VERTEXPEAK\GG-Server-Admins`. This is deliberately permissive, because share permissions cannot express group-level granularity cleanly and a share permission that is wrong is invisible in every ACL report.
- **NTFS permissions** are where authorisation actually lives, and they use the Domain Local groups of §7.2.6, one per share, one-to-one:

```powershell
$acl = @(
    @{ Path='D:\Shares\Finance';     RW='VERTEXPEAK\DL-Finance-RW';     RO='VERTEXPEAK\DL-Finance-RO' }
    @{ Path='D:\Shares\Engineering'; RW='VERTEXPEAK\DL-Engineering-RW'; RO=$null }
    @{ Path='D:\Shares\SalesRO';     RW=$null;                          RO='VERTEXPEAK\DL-SalesRO-RO' }
    @{ Path='D:\Shares\Public';      RW='VERTEXPEAK\DL-Public-RO';      RO=$null }
)
foreach ($a in $acl) {
    $ac = Get-Acl $a.Path
    $ac.SetAccessRuleProtection($true, $false)   # stop inheriting from D:\Shares
    $ac.Access | ForEach-Object { [void]$ac.RemoveAccessRule($_) }
    $ac.AddAccessRule((New-Object System.Security.AccessControl.FileSystemAccessRule(
        'VERTEXPEAK\GG-Server-Admins','FullControl','ContainerInherit,ObjectInherit','None','Allow')))
    if ($a.RW) { $ac.AddAccessRule((New-Object System.Security.AccessControl.FileSystemAccessRule(
        $a.RW,'Modify','ContainerInherit,ObjectInherit','None','Allow'))) }
    if ($a.RO) { $ac.AddAccessRule((New-Object System.Security.AccessControl.FileSystemAccessRule(
        $a.RO,'ReadAndExecute','ContainerInherit,ObjectInherit','None','Allow'))) }
    Set-Acl -Path $a.Path -AclObject $ac
    Get-Acl $a.Path | Select-Object -ExpandProperty Access |
        Select-Object IdentityReference, FileSystemRights, AccessControlType
}
```

The departmental shares map to `F:` (Finance, `GG-Finance-RW`), `G:` (Engineering, `GG-Engineering-RW`) and read-only `H:` (Sales) through `GPO-WS-Drive-Maps` with item-level targeting, per baseline §12.1.

#### 7.5.3 Quota templates and auto-quota policy

Design: one **quota template per share size**, and an **auto-quota** on each share folder so that every subfolder a user creates inherits a quota automatically rather than requiring a new object per folder.

```powershell
# ---- 7.5.3 STEP 1: quota templates ----
New-FsrmQuotaTemplate -Name 'TMPL-Quota-Finance-20GB' `
    -Description 'Vertex Peak Finance share: 20 GB hard quota (baseline §8.7)' `
    -Size 20GB `
    -SoftLimit:$false `
    -Threshold (New-FsrmQuotaThreshold -Percentage 85 -Action (
        New-FsrmAction -Type Event -EventType Warning -Body 'Vertex Peak: Finance share at 85% of quota.' -Kilobytes 0))

New-FsrmQuotaTemplate -Name 'TMPL-Quota-Engineering-10GB' `
    -Description 'Vertex Peak Engineering share: 10 GB hard quota' `
    -Size 10GB -SoftLimit:$false

New-FsrmQuotaTemplate -Name 'TMPL-Quota-SalesRO-10GB' `
    -Description 'Vertex Peak Sales (read-only) share: 10 GB hard quota' `
    -Size 10GB -SoftLimit:$false

New-FsrmQuotaTemplate -Name 'TMPL-Quota-Public-5GB' `
    -Description 'Vertex Peak Public share: 5 GB hard quota' `
    -Size 5GB -SoftLimit:$false
```

**Why hard quotas rather than soft.** A soft quota records an event and lets the write through; a hard quota denies it. For the project's evidence requirement, a hard quota is the only version that produces a *capturable error message* — and the baseline's §1.4 success criterion is "Quota exceeded capture". A soft quota would produce an event-log entry, which is weaker evidence and less convincing to a reader. The trade-off is real: a hard quota means a legitimate user hitting 100 % is blocked mid-task, which is why the thresholds below exist.

```powershell
# ---- 7.5.3 STEP 2: thresholds at 85%, 95% and 100% (measured against the quota size) ----
foreach ($t in @(
    @{ Name='TMPL-Quota-Finance-20GB';     SizeGB=20 },
    @{ Name='TMPL-Quota-Engineering-10GB'; SizeGB=10 },
    @{ Name='TMPL-Quota-SalesRO-10GB';     SizeGB=10 },
    @{ Name='TMPL-Quota-Public-5GB';       SizeGB=5  }
)) {
    $tmpl = Get-FsrmQuotaTemplate -Name $t.Name
    $tmpl.Threshold = @(
        (New-FsrmQuotaThreshold -Percentage 85  -Action (New-FsrmAction -Type Event -EventType Warning `
            -Body "$($t.Name): 85% of quota reached." -Kilobytes 0))
        (New-FsrmQuotaThreshold -Percentage 95  -Action (New-FsrmAction -Type Event -EventType Warning `
            -Body "$($t.Name): 95% of quota reached — action required." -Kilobytes 0))
        (New-FsrmQuotaThreshold -Percentage 100 -Action (New-FsrmAction -Type Event -EventType Error `
            -Body "$($t.Name): quota exhausted; writes will be denied." -Kilobytes 0))
    )
    Set-FsrmQuotaTemplate -Name $t.Name -Threshold $tmpl.Threshold
}
```

| Threshold | Percentage | Rationale |
|---|---|---|
| Early warning | 85 % | Leaves 3 GB free on the 20 GB Finance share — enough for a normal working week — so the warning is actionable rather than a post-mortem |
| Action required | 95 % | Escalation point. On a hard quota this is the last notification a human will see before users are blocked |
| Denied | 100 % | The event that pairs with the user-visible error in §7.5.6. Recording this as an *Error* event type rather than a warning means it stands out in Event Viewer and in the log forwarder |

**[ASSUMPTION] on the cmdlet surface.** `New-FsrmQuotaTemplate` accepts `-Threshold`, and thresholds are created with `New-FsrmQuotaThreshold -Percentage` (or `-Size`). This is the FSRM PowerShell module surface on Windows Server 2012 R2 through 2025 and is expected to be unchanged on the pinned build, but it has **not** been executed against Windows Server 2025 build `10.0.26100.1742` in this authoring environment. The alternative form, if `-Threshold` is not accepted on the pinned version, is to create the template without thresholds and then:

```powershell
# Alternative form: set thresholds through the property object
$tmpl = Get-FsrmQuotaTemplate -Name 'TMPL-Quota-Finance-20GB'
$tmpl.Threshold = @( (New-FsrmQuotaThreshold -Percentage 85) )
Set-FsrmQuotaTemplate -Name 'TMPL-Quota-Finance-20GB' -Threshold $tmpl.Threshold
```

Run `Get-Help New-FsrmQuotaTemplate -Full` and `Get-Help New-FsrmQuotaThreshold -Full` on the built host, capture the output as evidence, and correct this subsection in the build manual if the parameters differ.

```powershell
# ---- 7.5.3 STEP 3: auto-quota policies, one per share ----
New-FsrmAutoQuota -Path 'D:\Shares\Finance' `
    -Template 'TMPL-Quota-Finance-20GB' `
    -Disabled:$false

New-FsrmAutoQuota -Path 'D:\Shares\Engineering' `
    -Template 'TMPL-Quota-Engineering-10GB' -Disabled:$false

New-FsrmAutoQuota -Path 'D:\Shares\SalesRO' `
    -Template 'TMPL-Quota-SalesRO-10GB' -Disabled:$false

New-FsrmAutoQuota -Path 'D:\Shares\Public' `
    -Template 'TMPL-Quota-Public-5GB' -Disabled:$false
```

**Why auto-quota rather than one hard quota per folder.** A `New-FsrmQuota` fixes a size on one path. An auto-quota applies a *template* to a path **and to every folder created beneath it**, so a new project folder under `D:\Shares\Engineering\` is governed the moment it is created, with no administrative action. In an organisation whose IT team is five people, the difference between "policy applies automatically" and "policy applies when someone remembers" is the difference between a policy and a suggestion. The auto-quota does not apply a quota to the template's own path when that path already has a quota, which is why the auto-quota objects are created on the share root.

**[ASSUMPTION]** on the exact semantics: FSRM auto-quotas apply their template to subfolders created *after* the auto-quota is defined; pre-existing subfolders are typically picked up as well but this behaviour must be confirmed empirically on the built host by creating one folder before and one after, and observing `Get-FsrmAutoQuota` and `Get-FsrmQuota`.

Verification of quota objects:

```powershell
Get-FsrmQuotaTemplate | Select-Object Name, Size, SoftLimit, @{n='Thresholds';e={$_.Threshold.Count}}
Get-FsrmAutoQuota    | Select-Object Path, Template, Disabled, @{n='UsageGB';e={[math]::Round($_.Usage/1GB,2)}}
Get-FsrmQuota -Path 'D:\Shares\Finance'
```

```text
[FSRM QUOTAS — vpnz-fs01]
Name                        Size        SoftLimit Thresholds
----                        ----        --------- ----------
TMPL-Quota-Finance-20GB     21474836480     False          3
TMPL-Quota-Engineering-10GB 10737418240     False          3
TMPL-Quota-SalesRO-10GB     10737418240     False          3
TMPL-Quota-Public-5GB        5368709120     False          3

Path                    Template                     Disabled UsageGB
----                    --------                     -------- -------
D:\Shares\Finance       TMPL-Quota-Finance-20GB         False    0.00
D:\Shares\Engineering   TMPL-Quota-Engineering-10GB     False    0.00
D:\Shares\SalesRO       TMPL-Quota-SalesRO-10GB         False    0.00
D:\Shares\Public        TMPL-Quota-Public-5GB           False    0.00
```

#### 7.5.4 File screening templates and file groups

Design: **two blocking file groups** applied by default to all four shares, plus **one passive (audit-only) screen** so that the group can demonstrate the difference between blocking and detecting, plus an **exception group** so that the design shows how a legitimate business need is accommodated rather than simply refused.

```powershell
# ---- 7.5.4 STEP 1: file groups ----
New-FsrmFileGroup -Name 'Blocked-Audio-Video' `
    -Description 'High-risk / high-cost media formats prohibited on corporate shares' `
    -IncludePattern @('*.mp3','*.wma','*.wav','*.aac','*.flac','*.ogg','*.m4a',
                      '*.mp4','*.avi','*.mkv','*.mov','*.wmv','*.flv','*.m4v','*.mpg','*.mpeg')

New-FsrmFileGroup -Name 'Blocked-Executables' `
    -Description 'Executable and script content prohibited on corporate shares' `
    -IncludePattern @('*.exe','*.msi','*.msp','*.bat','*.cmd','*.com','*.scr','*.pif',
                      '*.vbs','*.vbe','*.js','*.jse','*.wsf','*.wsh','*.ps1','*.psm1',
                      '*.jar','*.hta','*.cpl','*.dll','*.sys')

New-FsrmFileGroup -Name 'Allowed-Engineering-Build' `
    -Description 'Engineering exception: signed installer and script artefacts for the build pipeline' `
    -IncludePattern @('*.msi','*.exe','*.ps1','*.dll','*.jar')
```

Baseline §8.7 requires the screen string `*.exe;*.vbs;*.mp3` on the departmental shares. The two groups above are a superset of that requirement and the report must say so explicitly, rather than presenting a shorter list as if it were the baseline's.

```powershell
# ---- 7.5.4 STEP 2: file screen templates ----
New-FsrmFileScreenTemplate -Name 'TMPL-Screen-Default-Block' `
    -Description 'Active screening: block executables and media on all corporate shares' `
    -IncludeGroup @('Blocked-Executables','Blocked-Audio-Video') `
    -Active:$true

New-FsrmFileScreenTemplate -Name 'TMPL-Screen-Passive-Audit' `
    -Description 'Passive screening: report only, no blocking. Used to measure the real occurrence rate.' `
    -IncludeGroup @('Blocked-Executables','Blocked-Audio-Video') `
    -Active:$false
```

| Choice | Value | Why |
|---|---|---|
| `-Active:$true` on the default template | blocking | The requirement is that a policy is *enforced*. Active screening produces the capturable error that §7.5.6 needs |
| `-Active:$false` on the audit template | reporting only | A genuinely useful design step: run passive screening for a week on the `Public` share to measure what would have been blocked, and record the number. This turns a policy decision into a finding with a number attached, which is exactly the kind of content the "findings" requirement asks for |
| `-IncludeGroup` rather than `-IncludePattern` | file groups | The pattern set is defined once and reused by screens, screen exceptions and reports. A change to `Blocked-Executables` then propagates, instead of having to be made in five places |

```powershell
# ---- 7.5.4 STEP 3: apply screens ----
New-FsrmFileScreen -Path 'D:\Shares\Finance'     -Template 'TMPL-Screen-Default-Block'
New-FsrmFileScreen -Path 'D:\Shares\Engineering' -Template 'TMPL-Screen-Default-Block'
New-FsrmFileScreen -Path 'D:\Shares\SalesRO'     -Template 'TMPL-Screen-Default-Block'
New-FsrmFileScreen -Path 'D:\Shares\Public'      -Template 'TMPL-Screen-Passive-Audit'
```

```powershell
# ---- 7.5.4 STEP 4: the exception mechanism ----
# Engineering legitimately produces .msi and .ps1 artefacts. Rather than weakening the
# share-wide screen, a file screen EXCEPTION narrows the block to one subfolder.
New-Item -ItemType Directory -Path 'D:\Shares\Engineering\_build-artefacts' -Force | Out-Null
New-FsrmFileScreenException -Path 'D:\Shares\Engineering\_build-artefacts' `
    -IncludeGroup @('Allowed-Engineering-Build') `
    -Description 'Exception: signed build artefacts only. Justified in the decision log; reviewed weekly.'
```

**How the exception mechanism is designed to be safe.** An FSRM file screen exception does not *grant* anything; it *removes* the named patterns from the screen for that path. Three safeguards are therefore applied deliberately:

1. The exception path is a **single, clearly named subfolder** (`_build-artefacts`), not the whole Engineering share.
2. The exception is **narrow** — it unblocks only the patterns in `Allowed-Engineering-Build`, so `.mp3` and `.mp4` remain blocked everywhere including inside the exception folder.
3. The exception is **documented and reviewed**: a decision-log entry records who asked, why, and when the exception will be reviewed. An exception that is not reviewed becomes permanent, which is how a control quietly dies.

Screens and exceptions are verified with:

```powershell
Get-FsrmFileScreenTemplate | Select-Object Name, Active, @{n='Groups';e={$_.IncludeGroup -join ';'}}
Get-FsrmFileScreen         | Select-Object Path, Template, Active
Get-FsrmFileScreenException -Path 'D:\Shares\Engineering\_build-artefacts' |
    Select-Object Path, IncludeGroup
```

```text
[FSRM FILE SCREENS — vpnz-fs01]
Name                        Active Groups
----                        ------ ------
TMPL-Screen-Default-Block     True Blocked-Executables;Blocked-Audio-Video
TMPL-Screen-Passive-Audit    False Blocked-Executables;Blocked-Audio-Video

Path                    Template                    Active
----                    --------                    ------
D:\Shares\Finance       TMPL-Screen-Default-Block     True
D:\Shares\Engineering   TMPL-Screen-Default-Block     True
D:\Shares\SalesRO       TMPL-Screen-Default-Block     True
D:\Shares\Public        TMPL-Screen-Passive-Audit    False

Path                                          IncludeGroup
----                                          ------------
D:\Shares\Engineering\_build-artefacts        Allowed-Engineering-Build
```

#### 7.5.5 Storage reports and scheduled tasks

FSRM storage reports are the mechanism that converts "we have a file server" into "we can answer the client's questions about it". The due-diligence list and the topic sheet's "findings" requirement are both served by the same three reports.

| Report | What it answers | Why Vertex Peak needs it |
|---|---|---|
| **Duplicate files** | How much of the 20 GB Finance quota is the same file stored five times? | Directly attacks the quota exhaustion problem at its source. A finding such as "1.8 GB of the Finance share is duplicate content, 9 % of the quota" is far more useful than a quota-exceeded alert |
| **Large files** | Which individual files dominate the share? | Identifies the handful of files that make a 20 GB quota feel small, and gives the IT team a specific conversation to have |
| **Files by owner** | Who actually consumed the quota? | Required by the auditability item. It also makes the ownership data available for a per-user quota design as future work |
| **Files by file group** | How many blocked-type files are present despite screening? | Tests whether the control is working, which is a verification, not a report |
| **Least recently accessed** | What has not been touched in 180 days? | Evidence for an archival or retention discussion, and cheap to produce |

```powershell
# ---- 7.5.5 STEP 1: define the report tasks ----
$scheduler = New-FsrmScheduledTask -Time ([datetime]'2026-10-07T02:00:00') -Weekly Saturday

New-FsrmStorageReport -Name 'RPT-Finance-Weekly' `
    -Namespace 'D:\Shares\Finance' `
    -ReportType DuplicateFiles, LargeFiles, FilesByOwner, FilesByFileGroup, LeastRecentlyAccessed `
    -LargeFileMinimum 50MB `
    -Interactive:$false `
    -Schedule $scheduler `
    -ReportFormat HTML,DHTML,CSV

New-FsrmStorageReport -Name 'RPT-Engineering-Weekly' `
    -Namespace 'D:\Shares\Engineering' `
    -ReportType DuplicateFiles, LargeFiles, FilesByOwner, FilesByFileGroup `
    -LargeFileMinimum 50MB `
    -Schedule $scheduler `
    -ReportFormat HTML,CSV
```

**[ASSUMPTION]** on `New-FsrmScheduledTask` parameter names. The FSRM module exposes `New-FsrmScheduledTask` with `-Time` and one of `-Monthly` / `-Weekly` / `-Daily` / `-Hourly`, and the report cmdlet takes `-Schedule`. This is expected to be unchanged on the pinned build but has not been executed here. If the parameter set differs, the alternative form is to construct the schedule object with `New-FsrmScheduledTask -Time <datetime> -Weekly <day>` and pass it as `-Schedule`, or to create the report interactively in `fsrm.msc` and then export it for the repository:

```powershell
# Alternative/fallback: create the report in the FSRM console, then export the configuration
Get-FsrmStorageReport -Name 'RPT-Finance-Weekly' |
    Export-Clixml 'C:\FYP\config\fsrm_rpt_finance_weekly.xml'
```

```powershell
# ---- 7.5.5 STEP 2: produce one report NOW, on demand, as today's evidence ----
$out = 'C:\FYP\config\fsrm-reports\2026-10-06'
New-Item -ItemType Directory -Path $out -Force | Out-Null

Start-FsrmStorageReport -Name 'RPT-Finance-Weekly' -Wait
Get-FsrmStorageReport -Name 'RPT-Finance-Weekly' | Select-Object Name, LastRunTime, LastStatus
Get-ChildItem $out -Recurse | Select-Object FullName, Length
```

```text
[FSRM STORAGE REPORT — RPT-Finance-Weekly, first successful run]
Name              LastRunTime              LastStatus
----              -----------              ----------
RPT-Finance-Weekly 2026-10-06 17:41:08    Success

C:\FYP\config\fsrm-reports\2026-10-06\RPT-Finance-Weekly\
    2026-10-06-17-41-08-DuplicateFiles.csv
    2026-10-06-17-41-08-DuplicateFiles.html
    2026-10-06-17-41-08-LargeFiles.csv
    2026-10-06-17-41-08-FilesByOwner.csv
    2026-10-06-17-41-08-FilesByFileGroup.csv
    2026-10-06-17-41-08-LeastRecentlyAccessed.csv
```

**How the reports feed the findings requirement.** Each scheduled run drops a timestamped set of files into `C:\FYP\config\fsrm-reports\{date}\`, which the automation line copies into `06-verification/` on `vpnz-mon01`. The findings subsection §7.13 then records, per report, the **measured** value against the **expected** value — for example: "Expected the Finance share to be dominated by large media files; observed that the ten largest files are all contractual PDFs (largest 84 MB) and that 1.8 GB (9 % of the 20 GB quota) is duplicate content in three project folders." A finding that contradicts the expectation is more valuable than one that confirms it, and this design makes producing both equally easy.

#### 7.5.6 Verification

**Quota enforcement — how to prove a quota actually blocks a write.**

```powershell
# ---- QA-1: write a file large enough to exceed the Public share's 5 GB quota ----
# From a workstation authenticated to vertexpeak.fyp.lab, with H:/Public mapped.
# The file is created locally from zeros so that no real content is generated.
$src = "$env:TEMP\vp-quota-probe.bin"
fsutil file createnew $src 6442450944      # 6 GB of sparse zeros

# Attempt the copy. The expected outcome is a specific, capturable failure.
Copy-Item -Path $src -Destination '\\vpnz-fs01\Public\vp-quota-probe.bin' -ErrorAction Continue
```

Expected errors, in the order the layers are encountered:

```text
[QUOTA ENFORCEMENT — expected failure 1: quota exceeded]
Copy-Item : There is not enough space on the disk.
At line:1 char:1
+ Copy-Item -Path $src -Destination '\\vpnz-fs01\Public\vp-quota-probe.bin' -ErrorAction Continue
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : WriteError: (\\vpnz-fs01\Public\vp-quota-probe.bin:FileInfo) [Copy-Item], IOException
    + FullyQualifiedErrorId : CopyError,Microsoft.PowerShell.Commands.CopyItemCommand

[QUOTA ENFORCEMENT — paired server-side evidence]
Get-WinEvent -LogName 'Application' -Source 'SRMSVC' -MaxEvents 5 |
    Where-Object { $_.Message -match 'quota' } |
    Select-Object TimeCreated, Id, LevelDisplayName, Message
```

```text
TimeCreated              Id LevelDisplayName Message
-----------              -- ---------------- -------
2026-10-06 17:58:22   12325 Error            File Server Resource Manager could not write to
                                             the file \\?\D:\Shares\Public\vp-quota-probe.bin
                                             because the quota for D:\Shares\Public has been
                                             reached. The quota limit is 5368709120 bytes and
                                             the current usage is 5368708663 bytes.
```

**Reading that evidence correctly matters.** In this lab the client-visible error is the generic `There is not enough space on the disk` rather than a message that names FSRM, because the quota enforcement surfaces to the client as an `ERROR_DISK_FULL` condition. The *proof* that FSRM caused it is the paired `SRMSVC` Application-log event naming the path, the limit and the usage. A screenshot of the client error alone is weak evidence; the client error **plus** the SRMSVC event is strong evidence, and this is exactly the kind of pairing the verification chapter should record.

```powershell
# ---- QA-2: the same test from the server side, which also proves the auto-quota applies to a subfolder ----
New-Item -ItemType Directory -Path 'D:\Shares\Public\qa-subfolder' -Force | Out-Null
fsutil file createnew 'D:\Shares\Public\qa-subfolder\probe.bin' 5368709120
# Expected: the same denial, and Get-FsrmAutoQuota now shows an object for the subfolder
Get-FsrmAutoQuota | Select-Object Path, Template, Usage
```

**File screening enforcement — how to prove screening blocks a file type.**

```powershell
# ---- SC-1: attempt to write a blocked extension to an actively screened share ----
'This is a probe file for the FSRM file screen test.' |
    Out-File '\\vpnz-fs01\Finance\probe-blocked.mp3' -ErrorAction Continue

# ---- SC-2: attempt to write a blocked executable type ----
New-Item -Path '\\vpnz-fs01\Engineering\probe-blocked.exe' -ItemType File -ErrorAction Continue

# ---- SC-3: prove the exception works — the SAME extension succeeds in the exception folder ----
New-Item -Path '\\vpnz-fs01\Engineering\_build-artefacts\probe-allowed.msi' -ItemType File -ErrorAction Continue
```

```text
[FILE SCREEN ENFORCEMENT — expected failure for a blocked type]
Out-File : Access to the path '\\vpnz-fs01\Finance\probe-blocked.mp3' is denied.
At line:1 char:1
+ 'This is a probe file...' | Out-File '\\vpnz-fs01\Finance\probe-blocked.mp3'
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : OpenError: (:) [Out-File], UnauthorizedAccessException
    + FullyQualifiedErrorId : FileOpenFailure,Microsoft.PowerShell.Commands.OutFileCommand

New-Item : Access to the path '\\vpnz-fs01\Engineering\probe-blocked.exe' is denied.
    + CategoryInfo          : PermissionDenied: (\\vpnz-fs01\Engineering\probe-blocked.exe:FileInfo) [New-Item], UnauthorizedAccessException
    + FullyQualifiedErrorId : ItemExistsUnauthorizedAccessError,Microsoft.PowerShell.Commands.NewItemCommand

[FILE SCREEN ENFORCEMENT — the exception must SUCCEED, proving the mechanism is targeted not blanket]
    Directory: \\vpnz-fs01\Engineering\_build-artefacts

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---          2026-10-06  18:04              0 probe-allowed.msi
```

**The error-message caveat that must be stated honestly.** Both quota and file-screen denials are surfaced to the Windows client as **`Access is denied` (`ERROR_ACCESS_DENIED`)**, which is indistinguishable at a glance from an NTFS permission denial. The three-way test that separates the causes is:

| Cause | Discriminator | Evidence |
|---|---|---|
| NTFS permission denial | The same write fails from an account **without** the group membership but succeeds from one **with** it | `Get-Acl` output |
| File screen denial | The write fails for a blocked extension but a differently-named file of the same size succeeds in the same folder | Paired screen test SC-1 and a control write |
| Quota denial | The write fails with a size-dependent behaviour: a small file succeeds, a large one fails, and `SRMSVC` logs the quota | Paired `SRMSVC` event |

A tester who does not perform the control write will misdiagnose a file screen as a permissions problem. That trap is worth a screenshot of its own and is listed in §7.12.

```powershell
# ---- SC-4: the server-side evidence that screening fired ----
Get-WinEvent -LogName 'Application' -Source 'SRMSVC' -MaxEvents 10 |
    Where-Object { $_.Message -match 'file screening|screened' } |
    Select-Object TimeCreated, Id, Message
```

```text
[FSRM FILE SCREEN — server-side event]
2026-10-06 18:04:55  Id 8215  Warning
The file screen on D:\Shares\Finance has blocked the file probe-blocked.mp3
because it matches the blocked file group "Blocked-Audio-Video".
File group : Blocked-Audio-Video
User       : VERTEXPEAK\adm-03
```

| # | Check | Exact command | Expected result |
|---|---|---|---|
| FSRM-01 | Role installed | `Get-WindowsFeature FS-Resource-Manager \| Select-Object InstallState` | `Installed` |
| FSRM-02 | Shares present and reachable | `Get-SmbShare \| Where-Object Name -in 'Finance','Engineering','SalesRO','Public'`; `Test-Path \\vpnz-fs01\Finance` | Four shares, `ShareState Online`; `True` |
| FSRM-03 | NTFS ACLs use the Domain Local groups | `Get-Acl D:\Shares\Finance \| Select-Object -Expand Access \| Select IdentityReference, FileSystemRights` | `DL-Finance-RW` with `Modify`; no `Everyone`, no `Authenticated Users` on the NTFS ACL |
| FSRM-04 | Four templates, three thresholds each | `Get-FsrmQuotaTemplate \| Select Name, Size, @{n='T';e={$_.Threshold.Count}}` | Four rows, `T = 3` |
| FSRM-05 | Auto-quota on all four shares | `Get-FsrmAutoQuota` | Four rows, `Disabled False` |
| FSRM-06 | File groups defined | `Get-FsrmFileGroup \| Select Name, @{n='Patterns';e={$_.IncludePattern.Count}}` | Three groups with 16, 18 and 5 patterns |
| FSRM-07 | Screens active where intended | `Get-FsrmFileScreen \| Select Path, Active` | `Finance`, `Engineering`, `SalesRO` → `True`; `Public` → `False` |
| FSRM-08 | **Quota blocks a write** | the §7.5.6 QA-1 procedure | Client: `There is not enough space on the disk`. Server: `SRMSVC` event naming the path, limit and usage |
| FSRM-09 | **Screening blocks a file type** | the §7.5.6 SC-1/SC-2 procedure | Client: `Access to the path … is denied`. Server: `SRMSVC` event naming the blocked file group and the user |
| FSRM-10 | Exception permits the allowed type | the §7.5.6 SC-3 procedure | `probe-allowed.msi` created successfully in `_build-artefacts`; still blocked in the share root |
| FSRM-11 | Storage report runs | `Start-FsrmStorageReport -Name 'RPT-Finance-Weekly' -Wait; Get-FsrmStorageReport -Name 'RPT-Finance-Weekly'` | `LastStatus : Success`, report files present with today's timestamp |
| FSRM-12 | Reports reach the repository | `Get-ChildItem \\vpnz-mon01\...` or the automation copy job | Timestamped CSV/HTML in `06-verification/` |
| FSRM-13 | Passive screening actually records without blocking | write a `.mp3` to `D:\Shares\Public`; then `Get-FsrmFileScreen -Path 'D:\Shares\Public'` and the SRMSVC log | File is created; an SRMSVC event is recorded. This is the finding that quantifies the audit-only mode |
| FSRM-14 | Quota usage is visible | `Get-FsrmQuota -Path 'D:\Shares\Finance' \| Select Path, Size, Usage, PeakUsage` | `Usage` reflects the probe files before cleanup |

**Cleanup discipline.** Every probe file created above must be deleted and the deletion recorded, so that the quota-usage figures in the final report are not distorted by test artefacts. A `06-verification/` record that says "6 GB of probe data was written and removed; the Finance share read 0.00 GB used before and after" is far more credible than one that leaves the numbers ambiguous.

---

### 7.6 iSCSI Block Storage

#### 7.6.1 Design

**Honesty note.** `iSCSI` occurs **0 times** in the WSOS 2026 text and raw HTML, and 0 times in 2024. It is a **project choice justified from the topic sheet** plus the Domain 4 hook `Manage file systems` (nested `Software RAID`, `mdadm`, `LVM/Dynamic disks`, `File systems such as NTFS, ReFS, EXT4 and NTFS.`).

**Roles, fixed by the baseline.**

| Element | Value | Source |
|---|---|---|
| iSCSI target host | `vpnz-san01`, 10.10.80.21, VLAN 80 `STORAGE-HQ` | Rev 1.1 ruling C-06: the target IQN is derived (`iqn.1991-05.com.microsoft:vpnz-san01-storage-lun0N.target`) and the canonical string `iqn.2026-01.lab.fyp.vertexpeak:storage-lun0N` names the INITIATOR on `vpnz-dmzweba01` |
| Target IQN | DERIVED and not settable: `iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target` (and `…-lun02.target`, `…-lun03.target`), captured with `Get-IscsiServerTarget` | Rev 1.1 ruling C-06 |
| Initiator IQN | `iqn.2026-01.lab.fyp.vertexpeak:storage-lun01` (and `-lun02`, `-lun03`) — the canonical string names the initiator, not the target | Rev 1.1 ruling C-06 |
| LUN01 | 20 GB — web-farm data for the platform tier | Baseline §12.1 |
| LUN02 | 40 GB — backup staging; also the Windows Server Backup target | Baseline §12.1 |
| LUN03 | 60 GB, thin provisioned — unused but demonstrated | Baseline §12.1 |
| VHDX store | `D:\iSCSI\LUN01` … `D:\iSCSI\LUN03` on `vpnz-san01` | Baseline §8.7 |
| Storage network | VLAN 80, "no routing beyond the core" | Baseline §4 VLAN table |
| Initiators | The platform-tier VMs (the IIS nodes `vpnz-dmzweba01/02`) | Baseline §12.1 |

**Why a separate storage VLAN rather than putting the LUNs on `SRV-HQ-1`.** VLAN 80 has no path beyond the core, so iSCSI traffic cannot reach `Z-USER`, the DMZ or the Internet even if an initiator were misconfigured. This is a segmentation decision, and it is also how the baseline models the real practice of a dedicated storage fabric: block traffic is chatty, latency-sensitive and has no business sharing a segment with web traffic. The honest limitation (baseline §13.3 AP-01) is that VLAN 80 in this lab is a **separate hypervisor host-only network**, not an 802.1Q tag on a trunk — the segmentation outcome is real, the mechanism is emulated, and the report must say exactly that.

**Single path versus multipath — the decision and its defence.**

| Option | What it gives | What it costs here | Decision |
|---|---|---|---|
| **Single path, single NIC, one session per LUN** | Working storage with one initiator/target relationship; easy to explain; nothing to misconfigure | No path redundancy. If the target's NIC or the host-only network fails, the LUN goes offline and `vpnz-san01` becomes the single point of failure for the platform tier's data | **Chosen.** Baseline §11.1 states explicitly that MPIO is not used |
| **Multipath I/O (MPIO) with MPIO DSM** | Path redundancy: two sessions over two subnets/NICs, `Least Queue Depth` or `Round Robin` load policy, and a survivable single-path failure | Needs a second NIC on both the initiator and the target, a second storage subnet or a second target portal, and the `Multipath-IO` feature plus `Enable-MSDSMGlobalDefaultLoadBalancePolicy`. In Packet Tracer and on one hypervisor host, the "second path" is two host-only networks on the same physical NIC, so the redundancy is **not genuine** — a failure of the physical NIC takes both paths down | Rejected as a claim, documented as future work |

**The defence that must be written into the report.** The baseline's design rejects MPIO on a single hypervisor host for exactly the reason the whole project rejects hardware high-availability (baseline §1.5): a second path that shares the same physical adapter is not a second path, and presenting it as one would be a false availability claim. The project instead demonstrates **recoverability**, which is honestly demonstrable: a LUN that survives a target service restart and a target VM reboot, and re-attaches (`Persistent` binding) without reconfiguration. Recoverability evidence is short, concrete and verifiable; a fabricated MPIO claim is neither. If the group has spare time after the `must` priorities of baseline §13.4 R-02, the legitimately achievable step is to enable the `Multipath-IO` feature, add the target's second portal, and *record what the second path actually protects against on a single host* — which is a finding, not a redundancy claim.

#### 7.6.2 Building the target on the storage VM

```powershell
# ---- 7.6.2 On vpnz-san01 (10.10.80.21, VLAN 80) ----
# Prerequisite: NIC renamed to the project convention and statically addressed first.
Get-NetAdapter | Select-Object Name, Status, LinkSpeed
Rename-NetAdapter -Name (Get-NetAdapter | Where-Object Status -eq 'Up').Name -NewName 'STOR-VLAN80' -Confirm:$false
New-NetIPAddress -InterfaceAlias 'STOR-VLAN80' -IPAddress 10.10.80.21 -PrefixLength 24 -DefaultGateway 10.10.80.254
Set-DnsClientServerAddress -InterfaceAlias 'STOR-VLAN80' -ServerAddresses 10.10.30.11,10.10.30.12

# Install the iSCSI Target Server and the management tooling
Install-WindowsFeature -Name FS-iSCSITarget-Server -IncludeManagementTools
Get-WindowsFeature FS-iSCSITarget-Server | Select-Object Name, InstallState
# Expected: FS-iSCSITarget-Server  Installed

# Enable the target's configuration to survive reboot (the service is automatic)
Set-Service -Name WinTarget -StartupType Automatic
Start-Service WinTarget
Get-Service WinTarget | Select-Object Name, Status, StartType
```

```powershell
# ---- 7.6.2 STEP 1: create the VHDX backing files ----
$luns = @(
    @{ Path='D:\iSCSI\LUN01\lun01.vhdx'; SizeGB=20;  Thin=$true  }
    @{ Path='D:\iSCSI\LUN02\lun02.vhdx'; SizeGB=40;  Thin=$true  }
    @{ Path='D:\iSCSI\LUN03\lun03.vhdx'; SizeGB=60;  Thin=$true  }
)
foreach ($l in $luns) {
    New-Item -ItemType Directory -Path (Split-Path $l.Path) -Force | Out-Null
    New-VHD -Path $l.Path -SizeBytes ($l.SizeGB * 1GB) -Dynamic:$l.Thin
}
Get-VHD -Path 'D:\iSCSI\LUN01\lun01.vhdx' |
    Select-Object Path, @{n='SizeGB';e={$_.Size/1GB}}, @{n='FileSizeGB';e={[math]::Round($_.FileSize/1GB,2)}}, VhdType
```

```text
[VHDX CREATION — vpnz-san01]
Path                          SizeGB FileSizeGB VhdType
----                          ------ ---------- -------
D:\iSCSI\LUN01\lun01.vhdx         20       0.00 Dynamic
D:\iSCSI\LUN02\lun02.vhdx         40       0.00 Dynamic
D:\iSCSI\LUN03\lun03.vhdx         60       0.00 Dynamic
```

`FileSizeGB 0.00` is the whole point of `-Dynamic`: 120 GB of *provisioned* LUN capacity consumes almost nothing on disk until data is written. Baseline §15 fixes the storage budget, and thin provisioning is why 19 VMs and 120 GB of LUNs fit inside it.

```powershell
# ---- 7.6.2 STEP 2: create the targets ----
# IMPORTANT: -TargetName sets the target's FRIENDLY NAME, not its IQN. The IQN is derived
# by the Microsoft iSCSI Target Server from the server's own IQN base plus the target name,
# and it is a separate property (TargetIqn) that is read back below.

# The target IQN is DERIVED from the server IQN plus the target name; it cannot be set.
# Resulting on-the-wire value: iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target
New-IscsiServerTarget -TargetName 'storage-lun01' -Description 'Vertex Peak LUN01 — web-farm data (20 GB)'
New-IscsiServerTarget -TargetName 'storage-lun02' -Description 'Vertex Peak LUN02 — backup staging (40 GB)'
New-IscsiServerTarget -TargetName 'storage-lun03' -Description 'Vertex Peak LUN03 — thin, unused, demonstrated (60 GB)'

Get-IscsiServerTarget | Select-Object TargetName, TargetIqn, Status, Description
```

```text
[ISCSI TARGETS — vpnz-san01]
TargetName      TargetIqn                                                    Status Description
----------      ---------                                                    ------ -----------
storage-lun01   iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target     Idle  Vertex Peak LUN01 — web-farm data (20 GB)
storage-lun02   iqn.1991-05.com.microsoft:vpnz-san01-storage-lun02.target     Idle  Vertex Peak LUN02 — backup staging (40 GB)
storage-lun03   iqn.1991-05.com.microsoft:vpnz-san01-storage-lun03.target     Idle  Vertex Peak LUN03 — thin, unused, demonstrated (60 GB)
```

**[ASSUMPTION] and the honest gap.** The Microsoft iSCSI Target Server derives the target IQN from the server's own IQN plus the target name; it does **not** offer a parameter that sets the IQN to an arbitrary value such as `iqn.2026-01.lab.fyp.vertexpeak:storage-lun01`. The baseline fixes that exact IQN string in its interface contract, so one of two things must happen, and the group must choose and record which:

- **Option 1 (recommended).** The *initiator-side* IQN uses the baseline string, and the target-side IQN is whatever Microsoft generates. The baseline IQN then names the initiator, not the target. This is legitimate — the IQN namespace is per-endpoint — and it keeps a project-controlled identifier in every configuration file the group writes, including the Linux `open-iscsi`/`iscsid` configuration if a Linux initiator is added. The build log records the actual target IQN from `Get-IscsiServerTarget` as evidence.
- **Option 2.** Set the target's friendly name to the basename and treat the baseline's `iqn.2026-01.lab.fyp.vertexpeak:storage-lun01` as a documentation label rather than a literal wire value, and correct baseline §16 by formal revision.

Whichever is chosen, **the delivered configuration must contain the string that is actually on the wire**, captured with `Get-IscsiServerTarget` and, on the initiator side, with `Get-IscsiSession | Select-Object TargetNodeAddress`.

```powershell
# ---- 7.6.2 STEP 3: initiator allow-list (this is the target's access control) ----
# Only the two platform-tier IIS nodes may attach LUN01.
Set-IscsiServerTarget -TargetName 'storage-lun01' `
    -InitiatorId @('Iqn:iqn.2026-01.lab.fyp.vertexpeak:storage-lun01','IPAddress:10.10.90.21','IPAddress:10.10.90.22')

# LUN02 (backup staging) is additionally attachable by the file server and the jump box.
Set-IscsiServerTarget -TargetName 'storage-lun02' `
    -InitiatorId @('IPAddress:10.10.30.21','IPAddress:10.10.90.21','IPAddress:10.10.90.22','IPAddress:10.20.20.31')

# LUN03 stays deliberately unattached to any initiator until the demonstration.
Set-IscsiServerTarget -TargetName 'storage-lun03' -InitiatorId @()

Get-IscsiServerTarget | Select-Object TargetName, @{n='Initiators';e={($_.InitiatorIds -join '; ')}}
```

```text
[ISCSI INITIATOR ALLOW-LIST — vpnz-san01]
TargetName      Initiators
----------      ----------
storage-lun01   IPAddress:10.10.90.21; IPAddress:10.10.90.22
storage-lun02   IPAddress:10.10.30.21; IPAddress:10.10.90.21; IPAddress:10.10.90.22; IPAddress:10.20.20.31
storage-lun03
```

**Design note on the allow-list.** The allow-list is by **IP address**, not by IQN. IP-based initiator identification is the weaker of the two options: an attacker who can spoof an allowed source address within VLAN 80 can attach the LUN. In this design that risk is contained twice over — VLAN 80 has no route beyond the core (baseline §4), and the storage VLAN is a host-only network with only the intended guests on it. IQN-based identification is the stronger control and is the one a real deployment should use, which is why the report should record the choice as a *documented lab simplification* rather than presenting IP binding as best practice.

```powershell
# ---- 7.6.2 STEP 4: virtual disks bound to targets ----
New-IscsiVirtualDisk -Path 'D:\iSCSI\LUN01\lun01.vhdx' -ErrorAction SilentlyContinue
Add-IscsiVirtualDiskTargetMapping -TargetName 'storage-lun01' -Path 'D:\iSCSI\LUN01\lun01.vhdx'
Add-IscsiVirtualDiskTargetMapping -TargetName 'storage-lun02' -Path 'D:\iSCSI\LUN02\lun02.vhdx'
Add-IscsiVirtualDiskTargetMapping -TargetName 'storage-lun03' -Path 'D:\iSCSI\LUN03\lun03.vhdx'

Get-IscsiVirtualDisk | Select-Object Path, @{n='SizeGB';e={$_.Size/1GB}}, @{n='UsedGB';e={[math]::Round($_.Used/1GB,2)}}, Status
Get-IscsiVirtualDiskTargetMapping
```

```text
[ISCSI VIRTUAL DISKS — vpnz-san01]
Path                          SizeGB UsedGB Status
----                          ------ ------ ------
D:\iSCSI\LUN01\lun01.vhdx         20   0.00   Idle
D:\iSCSI\LUN02\lun02.vhdx         40   0.00   Idle
D:\iSCSI\LUN03\lun03.vhdx         60   0.00   Idle

TargetName      DiskPath                             Status
----------      --------                             ------
storage-lun01   D:\iSCSI\LUN01\lun01.vhdx            Mapped
storage-lun02   D:\iSCSI\LUN02\lun02.vhdx            Mapped
storage-lun03   D:\iSCSI\LUN03\lun03.vhdx            Mapped
```

#### 7.6.3 Connecting the initiator

The initiator side is demonstrated from one of the platform-tier nodes (`vpnz-dmzweba01`, 10.10.90.21). Running it there rather than from a workstation is deliberate: it uses the real initiator and the real trust-boundary position, and it exercises TB-01's `iSCSI 3260 to vpnz-san01 from the two platform VMs only` rule at the same time.

```powershell
# ---- 7.6.3 STEP 1: install and start the initiator service ----
Start-Service msiscsi
Set-Service -Name msiscsi -StartupType Automatic
Get-Service msiscsi | Select-Object Name, Status, StartType
Get-InitiatorPort | Select-Object NodeAddress, ConnectionGroupTag     # the initiator's own IQN
```

```text
[ISCSI INITIATOR — vpnz-dmzweba01]
Name     Status StartType
----     ------ ---------
msiscsi Running Automatic

NodeAddress                                              ConnectionGroupTag
-----------                                              ------------------
iqn.2026-01.lab.fyp.vertexpeak:storage-lun01                 0
```

```powershell
# ---- 7.6.3 STEP 2: point the initiator at the target portal and enable CHAP ----
# CHAP secret must be 12-16 characters per the iSCSI spec; the project uses 16 random characters.
# One-way CHAP per initiator (baseline §12.1); mutual CHAP only if time allows.
$chapSecret = Read-Host -AsSecureString 'CHAP secret for storage-lun01 (16 chars, from the password manager)'

New-IscsiTargetPortal -TargetPortalAddress '10.10.80.21' -TargetPortalPortNumber 3260 `
    -InitiatorPortalAddress '10.10.90.21'

Update-IscsiTargetPortal -TargetPortalAddress '10.10.80.21'

# Discover the targets offered by that portal
Get-IscsiTarget | Select-Object NodeAddress, IsConnected
```

```text
[ISCSI DISCOVERY — vpnz-dmzweba01 after New-IscsiTargetPortal]
NodeAddress                                                IsConnected
-----------                                                -----------
iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target       False
iqn.1991-05.com.microsoft:vpnz-san01-storage-lun02.target       False
iqn.1991-05.com.microsoft:vpnz-san01-storage-lun03.target       False
```

The presence of all three targets in discovery, with only `storage-lun01` and `storage-lun02` allowing this initiator, is itself a design point: **discovery is not authorisation.** The allow-list is what determines whether a logon succeeds.

```powershell
# ---- 7.6.3 STEP 3: log on, with CHAP, and register the session as persistent ----
$target = Get-IscsiTarget | Where-Object NodeAddress -like '*storage-lun01*'
Connect-IscsiTarget -NodeAddress $target.NodeAddress `
    -TargetPortalAddress '10.10.80.21' `
    -AuthenticationType ONEWAYCHAP `
    -ChapUsername 'iqn.2026-01.lab.fyp.vertexpeak:storage-lun01' `
    -ChapSecret $chapSecret `
    -IsPersistent $true

Register-IscsiSession -SessionIdentifier (Get-IscsiSession |
    Where-Object { $_.TargetNodeAddress -like '*storage-lun01*' }).SessionIdentifier
```

```text
[ISCSI LOGON — vpnz-dmzweba01, successful]
InitiatorInstanceName      : ROOT\ISCSIPRT\0000_0
InitiatorNodeAddress       : iqn.2026-01.lab.fyp.vertexpeak:storage-lun01
TargetNodeAddress          : iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target
TargetPortalAddress        : 10.10.80.21
AuthenticationType         : ONEWAYCHAP
IsConnected                : True
IsPersistent               : True
SessionIdentifier          : fffffa8001c3d010-4000000000000001
```

**Persistent logon.** `-IsPersistent $true` (and the matching `Register-IscsiSession`) is what makes the LUN re-attach automatically after a reboot. Without it the session exists only until the next restart and the disk disappears — the third item in the §7.12 register.

```powershell
# ---- 7.6.3 STEP 4: bring the disk online and create the volume ----
Update-HostStorageCache
Get-Disk | Select-Object Number, FriendlyName, @{n='SizeGB';e={[math]::Round($_.Size/1GB,1)}}, PartitionStyle, OperationalStatus, BusType
```

```text
[DISK ENUMERATION — vpnz-dmzweba01 after iSCSI logon]
Number FriendlyName        SizeGB PartitionStyle OperationalStatus BusType
------ ------------        ------ -------------- ----------------- -------
0      Msft Virtual Disk     60.0 GPT            Online            SAS
1      MSFT Virtual Disk     20.0 RAW            Offline           iSCSI     <-- LUN01
```

The iSCSI disk appears `Offline` and `RAW`. It is brought online explicitly, and this is where an uninitialised LUN is most often mistaken for a broken one:

```powershell
$iscsi = Get-Disk | Where-Object BusType -eq 'iSCSI'
Set-Disk -Number $iscsi.Number -IsOffline $false
Set-Disk -Number $iscsi.Number -IsReadOnly $false
Update-HostStorageCache
Get-Disk -Number $iscsi.Number | Select-Object Number, PartitionStyle, OperationalStatus, IsOffline, IsReadOnly
# Expected: RAW, Online, IsOffline False, IsReadOnly False
```

```powershell
# ---- 7.6.3 STEP 5: partition and format ----
Initialize-Disk -Number $iscsi.Number -PartitionStyle GPT
New-Partition -DiskNumber $iscsi.Number -UseMaximumSize -DriveLetter L |
    Format-Volume -FileSystem NTFS -NewFileSystemLabel 'VP-LUN01-WEBFARM' `
        -AllocationUnitSize 65536 -Confirm:$false

Get-Volume -DriveLetter L | Select-Object DriveLetter, FileSystemLabel, FileSystem, @{n='SizeGB';e={[math]::Round($_.Size/1GB,1)}}, HealthStatus
```

```text
[VOLUME CREATED — vpnz-dmzweba01]
DriveLetter FileSystemLabel  FileSystem SizeGB HealthStatus
----------- ---------------  ---------- ------ ------------
L           VP-LUN01-WEBFARM NTFS           20.0 Healthy
```

**Why NTFS on a block LUN, and which filesystem.** The LUN is a raw block device; the initiator owns the filesystem on it. NTFS is chosen because the initiator is Windows and the platform tier's application writes NTFS-attribute-sensitive data. `ReFS` is available on Windows Server 2025 and offers integrity streams and faster repair, but it is deliberately **not** used here because the same volume may later be attached from a Linux initiator that cannot read ReFS — and because baseline §8.7's FSRM story assumes NTFS semantics on the file server. The 64 KB allocation unit size is a deliberate choice for a volume expected to hold large application artefacts. The WSOS names NTFS and ReFS explicitly under `Manage file systems`, so this choice is citable rather than merely pragmatic.

#### 7.6.4 Persistence, performance and safety

```powershell
# ---- 7.6.4 Session inventory and health ----
Get-IscsiSession |
    Select-Object SessionIdentifier, TargetNodeAddress, InitiatorNodeAddress,
                  IsConnected, IsPersistent, @{n='Auth';e={$_.AuthenticationType}}

Get-IscsiConnection |
    Select-Object InitiatorPortalAddress, TargetPortalAddress, ConnectionState

Get-IscsiTargetPortal | Select-Object TargetPortalAddress, TargetPortalPortNumber, InitiatorPortalAddress
```

```text
[ISCSI SESSION — vpnz-dmzweba01]
SessionIdentifier                TargetNodeAddress                                          IsConnected IsPersistent Auth
-----------------                -----------------                                          ----------- ------------ ----
fffffa8001c3d010-4000...0001     iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target        True         True ONEWAYCHAP

InitiatorPortalAddress TargetPortalAddress ConnectionState
---------------------- ------------------- ---------------
10.10.90.21            10.10.80.21         Connected
```

```powershell
# ---- 7.6.4 Persistence check that survives a reboot ----
Get-IscsiSession -IsPersistent | Select-Object TargetNodeAddress, IsPersistent
# After a reboot of vpnz-dmzweba01, re-run:
Get-IscsiSession | Select-Object TargetNodeAddress, IsConnected
Get-Volume -DriveLetter L | Select-Object DriveLetter, HealthStatus, SizeRemaining
Get-Disk | Where-Object BusType -eq 'iSCSI' | Select-Object Number, OperationalStatus
```

**What happens on reboot — the three cases that must all be understood.**

1. **Initiator reboots.** With `-IsPersistent $true` the initiator re-logs on automatically during startup, the disk returns, and `L:` remounts. This is the normal, expected behaviour and it is demonstrated and captured.
2. **Target reboots.** The target's `WinTarget` service stops, sessions drop, the initiator's disk goes offline or to a "lost connection" state; when the target returns, the disk returns. Volume-level resilience is a function of the **filesystem**, not of iSCSI: NTFS journals its metadata and replays it, so a clean restart is unremarkable, but a *hard* power loss mid-write can require a chkdsk. **No claim may be made that iSCSI provides filesystem consistency.**
3. **Network path fails.** With a single path (§7.6.1) the disk goes offline and stays offline until the path returns. That is the honest consequence of the single-path decision, and it is the correct thing to show in the demonstration: the test proves *recovery after the path returns*, not continuous availability.

```powershell
# ---- 7.6.4 Evidence of disk performance, for the record (not a capacity claim) ----
Get-Counter -Counter '\PhysicalDisk(*)\Avg. Disk sec/Transfer' -SampleInterval 1 -MaxSamples 5 |
    Select-Object -ExpandProperty CounterSamples |
    Select-Object InstanceName, @{n='AvgSec';e={[math]::Round($_.CookedValue,6)}}

# Storage capacity actually consumed on the target (proves thin provisioning)
Get-IscsiVirtualDisk | Select-Object Path, @{n='ProvisionedGB';e={$_.Size/1GB}}, @{n='UsedGB';e={[math]::Round($_.Used/1GB,3)}}
```

**Safety rules for this subsection.** iSCSI volume operations are destructive and this lab has no hypervisor-level backup (baseline §15.3). Therefore: a hypervisor snapshot of the initiator VM is taken before `Initialize-Disk`; the disk number is always resolved by `BusType -eq 'iSCSI'` rather than typed by hand, because `Initialize-Disk -Number 1` on a machine whose boot disk is number 1 destroys the guest; and no LUN is formatted until its target mapping and allow-list have been captured. The rule "never initialise a disk identified by number, always by bus type" belongs in the build manual as a standing instruction.

#### 7.6.5 Verification

| # | Check | Exact command | Expected result |
|---|---|---|---|
| ISC-01 | Role installed, service running | `Get-WindowsFeature FS-iSCSITarget-Server`; `Get-Service WinTarget` | `Installed`; `Running` / `Automatic` |
| ISC-02 | Three VHDX files, dynamic | `Get-VHD -Path 'D:\iSCSI\LUN0*\*.vhdx' \| Select Path, VhdType, Size` | Three rows, `Dynamic`, 20/40/60 GB |
| ISC-03 | Three targets, correct status | `Get-IscsiServerTarget` | Three targets, `Status Idle`, correct `InitiatorIds` |
| ISC-04 | Three disks mapped | `Get-IscsiVirtualDiskTargetMapping` | Three rows, `Mapped` |
| ISC-05 | Initiator discovered the targets | `Get-IscsiTarget \| Select NodeAddress, IsConnected` | Three node addresses listed |
| ISC-06 | Session established with CHAP | `Get-IscsiSession \| Select TargetNodeAddress, IsConnected, IsPersistent, AuthenticationType` | `True`, `True`, `ONEWAYCHAP` |
| ISC-07 | Disk online, volume healthy | `Get-Disk \| Where BusType -eq 'iSCSI'`; `Get-Volume -DriveLetter L` | `Online`, `NTFS`, `Healthy` |
| ISC-08 | **Volume survives an initiator reboot** | reboot `vpnz-dmzweba01`, then `Get-IscsiSession`, `Get-Volume -DriveLetter L`, `Test-Path 'L:\'` | Session auto-restored, `L:` mounted NTFS, `Test-Path` `True` |
| ISC-09 | **Volume survives a target restart** | on `vpnz-san01`: `Restart-Service WinTarget` (or reboot the VM); on the initiator: observe, then re-check | During the outage: `Get-Volume -DriveLetter L` reports the volume as unavailable/`NoMedia` or the session drops. After the target returns: `Get-IscsiSession` shows `IsConnected True` and `L:` is Healthy again without reconfiguration |
| ISC-10 | Data written before the outage is readable after | `'persist-probe' \| Out-File 'L:\iscsi-persistence-probe.txt'` before; `Get-Content 'L:\iscsi-persistence-probe.txt'` after | The string is returned, proving the data, not merely the session, survived |
| ISC-11 | Allow-list is enforced | from an **unlisted** host (e.g. 10.10.30.11), `Connect-IscsiTarget -NodeAddress <lun01> -AuthenticationType ONEWAYCHAP -ChapUsername … -ChapSecret …` | `Connect-IscsiTarget : The target does not exist or is not accessible` (or a CHAP/authorisation failure). This is the evidence for TB-01's iSCSI restriction |
| ISC-12 | Thin provisioning is real | `Get-IscsiVirtualDisk \| Select Path, Size, Used` | `Used` is a small fraction of `Size` until data is written |
| ISC-13 | Correct CHAP secret is required | reconnect with a **wrong** secret | `Connect-IscsiTarget : The target has not been found` / CHAP authentication failure, and a target-side `Event ID 16` in the `Microsoft-Windows-iSCSITarget-Service` log |
| ISC-14 | LUN02 usable as the backup target | `Get-WindowsFeature Windows-Server-Backup` on the intended host, then `wbadmin` target selection | The 40 GB LUN02 volume is selectable as a Windows Server Backup target, per baseline §12.1 |

**The exact target-restart walkthrough (ISC-09), because this is the demonstration the baseline requires.**

```powershell
# --- On vpnz-san01 (the target) ---
Stop-Service WinTarget
Get-Service WinTarget | Select-Object Name, Status        # Expected: Stopped
```

```text
[ISCSI TARGET STOPPED — observed from vpnz-dmzweba01]
Get-IscsiSession | Select TargetNodeAddress, IsConnected
TargetNodeAddress                                          IsConnected
-----------------                                          -----------
(no rows returned — the session has been torn down)

Get-Volume -DriveLetter L
Get-Volume : No MSFT_Volume objects found with property 'DriveLetter' equal to 'L'.

Get-Disk | Where-Object BusType -eq 'iSCSI'
Number FriendlyName      SizeGB OperationalStatus BusType
------ ------------      ------ ----------------- -------

# The "no rows" and "no volume" results ARE the expected evidence of a single-path outage.
# They must be captured, not hidden, because a demonstration that only shows the happy path
# proves nothing about the failure behaviour the due-diligence list asks about.
```

```powershell
# --- Back on vpnz-san01: restart the target ---
Start-Service WinTarget
Get-IscsiServerTarget | Select-Object TargetName, Status   # Expected: Idle
```

```text
[ISCSI TARGET RESTARTED — recovery observed from vpnz-dmzweba01, within ~30 s]
Get-IscsiSession | Select TargetNodeAddress, IsConnected, IsPersistent
TargetNodeAddress                                          IsConnected IsPersistent
-----------------                                          ----------- ------------
iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target        True         True

Get-Volume -DriveLetter L | Select DriveLetter, FileSystemLabel, FileSystem, HealthStatus
DriveLetter FileSystemLabel  FileSystem HealthStatus
----------- ---------------  ---------- ------------
L           VP-LUN01-WEBFARM NTFS       Healthy

Get-Content 'L:\iscsi-persistence-probe.txt'
persist-probe
```

**What this proves and what it does not.** It proves that a persistent iSCSI logon restores the LUN automatically after the target returns, and that the NTFS volume and its data are intact across the outage. It does **not** prove continuous availability: during the outage there was no LUN, and anything writing to `L:` would have failed. That distinction is exactly what the report must state, because presenting a recovery as an availability claim is the easiest way to over-claim in this whole subsection.

---

### 7.7 Remote Access and Routing (RRAS)

#### 7.7.1 Role and design

**Honesty note.** `RRAS` occurs **0 times** in the WSOS 2026 text and raw HTML, and 0 times in 2024. It is a **project choice justified from the topic sheet** plus the Domain 4 hook `Install and manage remote network access services` (nested `SSH`, `Remote Desktop Services`) and the Domain 4 requirement `Install and manage network address translation services`.

**Where RRAS sits in the topology.** The baseline places the remote-access host at `vpnz-rras01`, 10.10.30.41, on VLAN 30 `SRV-HQ-1`, inside `Z-SERVER`. Its Internet reachability is not direct: the outside path is **ASA PAT** at `198.51.100.5`, forwarding UDP 500 and 4500 to the RRAS host through the nftables VIP. That is the whole point of the design — `Z-SERVER` has no Internet-inbound path of its own (TB-06), and the only two Internet-reachable endpoints are the two VPN terminators, exactly as the baseline states.

| Interface (logical) | Address | Zone | Purpose |
|---|---|---|---|
| Internal | 10.10.30.41/24 on VLAN 30 | `Z-SERVER` | The RAS interface; pool assignment happens here |
| External path | via ASA PAT on `198.51.100.5` → nftables VIP 10.10.50.10 → UDP 500/4500 → `vpnz-rras01` | `Z-WAN` → `Z-REMOTE` | IKEv2 termination |
| VPN address pool | 10.10.201.10 – 10.10.201.200 (from `10.10.201.0/24`) | `Z-REMOTE` | Static pool, base from `IKEV2-RAS-POOL` in baseline §5.4 |

**Interface layout note and the honest complication.** In the baseline, `vpnz-rras01` has **one** NIC on `VNET-SRV`. A real RRAS remote-access server normally has an internal and an external interface, and RRAS's own NAT and routing features assume two. Single-NIC RRAS is a legitimate configuration for a VPN server that is *behind* a firewall doing the address translation — RRAS then receives already-translated IKEv2 packets on its one interface and uses its internal interface as both the receiving and the RAS interface. The consequence is that **RRAS must not be used for NAT in this design** (baseline §12.1: "NAT not used, NAT is done by nftables"), because a single-NIC host cannot be the NAT boundary. That is a design decision with a technical reason, not a simplification.

**Static versus dynamic routing — the decision.**

| Option | What it means here | Decision |
|---|---|---|
| **Static routing** | The VPN pool `10.10.201.0/24` is added as a static route, and RRAS is told exactly which prefixes are reachable through the tunnel. Predictable, auditable, trivially verifiable with `Get-NetRoute` | **Chosen.** Baseline's trust-boundary table fixes *precisely* which prefixes a VPN client may reach (TB-01, TB-11, TB-12), and a static route is a statement of exactly that. Dynamic routing would compute reachability that the design deliberately does not grant |
| **RIP v2** | RRAS's built-in dynamic routing protocol; could advertise the pool and learn LAN routes automatically | Rejected. RIP is not used anywhere else in this design — the routing story belongs to the Cisco line (OSPF, EIGRP, BGP in Packet Tracer) — and introducing a second, weaker IGP inside a Windows guest would add a failure mode with no corresponding benefit. It would also risk advertising prefixes that TB-01 denies |
| **OSPF on RRAS** | Possible with a third-party or add-on implementation | Rejected. Not available in-box on the pinned build, and it would duplicate the Cisco line's OSPF domain with no verification story |

**Route pushing.** In an RRAS IKEv2 remote-access deployment the client does not *learn* routes from a routing protocol; it receives them from the connection profile. This is why §7.8.4 matters: with split tunnelling disabled the client installs a `0.0.0.0/0` route into the tunnel, and with it enabled the client profile supplies only the specific prefixes. Either way, the *server-side* static route to `10.10.201.0/24` on the internal network is needed so that return traffic to VPN clients goes back through RRAS rather than to the default gateway.

#### 7.7.2 Installation and enabling LAN routing

RRAS is installed on a member server, **not** on a domain controller. A domain controller running RRAS is a configuration that Microsoft does not recommend and that in practice produces confusing behaviour (the DC's own transport and the RAS interface interact badly). `vpnz-rras01` is a member server in `OU=Servers/OU=MemberServers`.

```powershell
# ---- 7.7.2 On vpnz-rras01 (10.10.30.41) ----
# Pre-flight: NIC alias, static address, and DNS before any role is added.
Rename-NetAdapter -Name (Get-NetAdapter | Where-Object Status -eq 'Up').Name -NewName 'SRV-VLAN30' -Confirm:$false
New-NetIPAddress -InterfaceAlias 'SRV-VLAN30' -IPAddress 10.10.30.41 -PrefixLength 24 -DefaultGateway 10.10.30.254
Set-DnsClientServerAddress -InterfaceAlias 'SRV-VLAN30' -ServerAddresses 10.10.30.11,10.10.30.12
Add-Computer -DomainName 'vertexpeak.fyp.lab' -Credential (Get-Credential 'VERTEXPEAK\adm-XX') -Restart

# ---- Install the role ----
Install-WindowsFeature -Name RemoteAccess -IncludeManagementTools
Install-WindowsFeature -Name RDS-RD-Server -IncludeManagementTools
Install-WindowsFeature -Name NPAS -IncludeManagementTools      # NPS / RADIUS, for §7.8.2 authorisation

Get-WindowsFeature RemoteAccess, NPAS, RDS-RD-Server | Select-Object Name, InstallState
```

```text
[RRAS PREREQUISITES — vpnz-rras01]
Name            InstallState
----            ------------
RemoteAccess       Installed
NPAS               Installed
RDS-RD-Server      Installed
```

```powershell
# ---- Enable LAN routing (IP routing between the internal interface and the RAS interface) ----
Install-RemoteAccess -VpnType Vpn

Get-RemoteAccess | Select-Object VpnS2SStatus, RoutingStatus, RemoteAccessServer, VpnStatus
# Expected: VpnS2SStatus Enabled | RoutingStatus Installed | VpnStatus Enabled
```

**`RoutingStatus`** is the value that matters for §7.7.3. If it reads `Installed` while `VpnStatus` reads `Enabled`, LAN routing is available; if LAN routing is *not* required at all, the baseline's own statement applies — RRAS is used for routing **and** remote access in this design, so both are needed, and the configuration that enables them is the `Install-RemoteAccess -VpnType Vpn` call (RRAS enables LAN routing alongside VPN when the role is configured this way). If the pinned build requires it, the RRAS MMC equivalent is *Routing and Remote Access → Properties → IPv4 → Enable IPv4 forwarding*, and the legacy `netsh` form is:

```powershell
# Legacy/alternative form (netsh), retained because it is what the RRAS MMC writes underneath
netsh routing ip install "Remote Access"
netsh routing ip set global routerenable=enable
netsh routing ip set interface name="SRV-VLAN30" state=enable
```

**[ASSUMPTION]** The `netsh routing ip` context is a legacy surface whose availability on Windows Server 2025 is **not** confirmed in this authoring environment. The primary mechanism is the RRAS console (`rrasmgmt.msc`) plus the PowerShell cmdlets; the `netsh` lines are given as a documented alternative for the case where the console's IPv4 forwarding checkbox is the only available control. The group must capture whichever method actually worked.

IPv4 forwarding must also be enabled at the operating-system level, because RRAS's routing depends on the host forwarding packets at all:

```powershell
Set-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters' -Name 'IPEnableRouter' -Value 1 -Type DWord
# This requires a reboot to take effect and is confirmed afterwards with:
Get-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters' -Name IPEnableRouter
```

```text
Get-NetIPInterface -AddressFamily IPv4 | Select-Object ifIndex, InterfaceAlias, Forwarding, ConnectionState
ifIndex InterfaceAlias Forwarding ConnectionState
------- -------------- ---------- ---------------
     12 SRV-VLAN30         Enabled      Connected
      1 Loopback Pseudo…  Disabled      Connected
```

**`Forwarding : Enabled` on `SRV-VLAN30` is the single most important line in §7.7.** Without it, RRAS accepts the VPN connection and the tunnel establishes, but no packet from the VPN pool ever reaches `10.10.30.0/24` — and the symptom is a VPN that "connects and then nothing works", which is the first item in §7.12.

```powershell
# ---- Static route so that return traffic to the VPN pool comes back through RRAS ----
New-NetRoute -DestinationPrefix '10.10.201.0/24' -InterfaceAlias 'SRV-VLAN30' `
    -NextHop 10.10.30.254 -RouteMetric 1 -PolicyStore PersistentStore

Get-NetRoute -AddressFamily IPv4 | Where-Object DestinationPrefix -like '10.10.201*' |
    Select-Object DestinationPrefix, NextHop, RouteMetric, PolicyStore, InterfaceAlias
```

```text
DestinationPrefix NextHop      RouteMetric PolicyStore     InterfaceAlias
----------------- -------      ----------- -----------     --------------
10.10.201.0/24    10.10.30.254           1 PersistentStore SRV-VLAN30
```

**[ASSUMPTION] on the next hop.** With RRAS itself owning the pool, the more precise configuration in some deployments is a route whose next hop is the loopback/RAS interface rather than the upstream gateway, because RRAS already knows the pool is local to itself. Both forms appear in practice. The form above (next hop = the VLAN 30 gateway 10.10.30.254, which is the HSRP VIP) is chosen here because it makes the route *visible in the core's routing table*, which is a useful piece of evidence, and because a missing route on the path is easier to diagnose than a special-case on the host. The group must test both and record which produced working return traffic.

#### 7.7.3 NAT design and the interaction with the Linux nftables edge

This is the subsection where the design's two-firewall arrangement must be explained precisely, because it is the most likely thing for a reader to get wrong.

**Who does what — the normative statement.**

[FIGURE: Packet-path diagram for a remote worker — laptop outside, ASA `VP-HQ-FW-01` outside interface 198.51.100.1, static PAT of UDP 500/4500 to the nftables VIP 10.10.50.10, the nftables pair, `VP-HQ-CORE-01/02`, and `vpnz-rras01` terminating IKEv2 and assigning an address from 10.10.201.10 – 10.10.201.200. Annotate each hop with the device that performs the action, and mark clearly that NAT (masquerade) happens only at the nftables pair and never at RRAS]

| Function | Device | Evidence |
|---|---|---|
| Stateful egress filtering, logging and **NAT (masquerade)** for all `Z-SERVER` and `Z-USER` traffic to the Internet | **`vpnz-nft01`/`vpnz-nft02`**, table `inet fyp_filter`, VIP 10.10.50.10 | `nft list ruleset`; `masquerade` rule on the WAN-facing interface; `nft monitor` and `log prefix "NFT-DROP: "` lines |
| DMZ boundary: ACLs, static NAT for published services, `inspect` policy, syslog | **`VP-HQ-FW-01`** (ASA 5506-X, ASA 9.16(4), in Packet Tracer) | `show run`, `show nat`, `show logging` |
| **PAT of the VPN ports** UDP 500/4500 and UDP 443 (WireGuard) and UDP 1194 (OpenVPN) from `198.51.100.5` to the nftables VIP `10.10.50.10` | **ASA `VP-HQ-FW-01`** | Baseline §5.6 public-address table |
| **Windows-side NAT** | **Nothing. RRAS does not perform NAT in this design** | Baseline §12.1 states it explicitly |

**Why RRAS does not do NAT.** Three reasons, each of which is a design position rather than a preference:

1. **A second NAT boundary would break the audit trail.** The due-diligence list requires an auditable path. If RRAS also translated, a VPN client's source address would be rewritten twice, and attributing a log entry to a user would require correlating two translation tables on two different platforms. One translation point (nftables) means one table to read.
2. **A single-NIC RRAS host cannot be a translation boundary.** The host has one interface on `VNET-SRV`; there is no outside interface to translate from. RRAS NAT requires distinct internal and external interfaces.
3. **TB-06 already makes RRAS unreachable from the Internet directly.** Traffic reaches it only through ASA PAT. Adding NAT behind a PAT would be a translation behind a translation, which is the classic cause of IPsec NAT-T failures — a documented failure mode in §7.12.

**The end-to-end packet path for a remote worker, stated once and precisely:**

```text
[REMOTE WORKER → INTERNAL RESOURCE — the full path]
1.  Laptop (public address, e.g. 203.0.113.x) → IKEv2 to 198.51.100.5:UDP500, NAT-T 4500
2.  ISP / simulated Internet                        (Packet Tracer)
3.  VP-HQ-EDGE-01 eBGP AS 65001 to the provider     (Packet Tracer)
4.  VP-HQ-FW-01 (ASA) outside interface 198.51.100.1
        → static PAT: UDP 500/4500 → 10.10.50.10 (nftables VIP)
5.  vpnz-nft01/02 (keepalived VIP 10.10.50.10)
        → forward policy: UDP 500/4500 to 10.10.30.41 permitted
        → NAT happens HERE for outbound traffic; inbound VPN packets are DNAT'd, not masqueraded
6.  VP-HQ-CORE-01/02 (VLAN 50 → VLAN 30 routing, HSRP)
7.  vpnz-rras01 (10.10.30.41)
        → IKEv2 terminates, certificate authentication, NPS authorisation
        → client receives an address from 10.10.201.10 – 10.10.201.200
8.  Client traffic for 10.10.30.0/24, 10.10.90.0/24 etc. enters the internal network
        → the source address is now 10.10.201.x, and the static route sends the return path
          back to vpnz-rras01
9.  Return traffic: resource → vpnz-rras01 → encrypted → back down the same path
```

**The two NAT statements that must not be confused.** On the nftables pair, `masquerade` applies to traffic *leaving* toward the WAN; VPN client traffic entering the tunnel is not masqueraded by the pair, because it is being delivered *to* the pair's internal side. And on the ASA, the PAT for UDP 500/4500 is a **static** mapping of four ports to one internal host, which is different from the dynamic PAT used for inside-out traffic. A report that describes "NAT" as one thing will get this wrong; the report must name the mechanism (`masquerade` on Linux, `static PAT` on the ASA) per device.

**Split-tunnel interaction.** Because split tunnelling is **disabled** by design (baseline §12.1), a VPN client sends *all* traffic through the tunnel, including its Internet traffic. That traffic then egresses through `vpnz-nft01/02`, is masqueraded there, and is logged — which is exactly the auditable path the client asked for. The side effect, honestly stated: the nftables pair becomes the bandwidth bottleneck and the single point of egress for remote workers, and a split-tunnel deployment would be faster. This is a deliberate security-over-performance choice and belongs in the report as one.

#### 7.7.4 Remote access configuration and the certificate link

RRAS remote access is configured in `§7.8`, because in this design the only remote-access VPN is IKEv2 with certificate authentication. What belongs here is the *authorisation* half, which is delivered by NPS (`vpnz-rras01` is also the RADIUS/NPS server — port matrix `P-18`), and the certificate linkage.

```powershell
# ---- NPS client: RRAS is a RADIUS client of its own NPS instance ----
New-NpsRadiusClient -Name 'vpnz-rras01' -Address '10.10.30.41' `
    -SharedSecret (Read-Host -AsSecureString 'RADIUS shared secret (32 chars)') `
    -AuthAttributeRequired:$false

# ---- The two connection request policies that matter ----
# Policy 1: IKEv2 machine + user certificate, membership of GG-VPN-Users required.
# Policy 2: GG-VPN-ProfServices adds RDP to the platform tier (TB-11) and nothing else.

New-NpsConnectionRequestPolicy -Name 'CRP-IKEV2-Cert-Only' `
    -ProcessingOrder 1 `
    -AuthenticationProvider 'Windows' `
    -Condition (New-NpsCondition -Type 'NAS-Port-Type' -Value 'Virtual (VPN)') `
    -Condition (New-NpsCondition -Type 'Windows-Group' -Value 'VERTEXPEAK\GG-VPN-Users') `
    -AuthMethod 'EAP'
```

**[ASSUMPTION] on the NPS cmdlet surface.** The exact parameter names of `New-NpsConnectionRequestPolicy` and `New-NpsCondition` are **not** confirmed for Windows Server 2025 in this authoring environment. The reliable, portable mechanism is one of:

- `netsh nps add crp name="CRP-IKEV2-Cert-Only" processingorder=1` plus `netsh nps add condition ...` and `netsh nps add authmethod ...`, and
- `Import-NpsConfiguration -Path 'C:\FYP\config\nps-ikev2.xml'` where `nps-ikev2.xml` was exported from a working NPS console with `Export-NpsConfiguration`.

The second is strongly preferred for this project because the exported XML is **a Git-committable artefact**: it makes the NPS policy reviewable, diffable and reproducible, which is what due-diligence item 5 asks for. The group must configure the policy once in the NPS console (`nps.msc`), export it, and commit the export.

The policy content, regardless of delivery mechanism:

| Element | Value | Why |
|---|---|---|
| NAS-Port-Type condition | `Virtual (VPN)` | Restricts the policy to VPN connections so it can never authorise a wireless or wired request |
| Windows-Group condition | `VERTEXPEAK\GG-VPN-Users` | The single authorisation source. Adding a person to the VPN is a group change, not a policy change |
| Authentication method | `EAP` (only) | No MS-CHAPv2, no PAP. This is what makes "certificate-based only" true rather than aspirational |
| EAP type | `Microsoft: Smart Card or other certificate` (EAP-TLS-style certificate EAP) | Preshared keys are forbidden by design (baseline §12.1) and must not appear in any policy |
| Idle timeout | 30 minutes | Auditable session hygiene |
| Session timeout | 8 hours | Bounds the life of a stolen client certificate within a working day |
| Encryption | Strongest available: AES-256 / SHA-256 and above; **no** DES, 3DES or SHA-1 | Baseline hardening requirement |
| Accounting | RADIUS accounting to NPS local log (`P-18`, 1813/udp) | Gives the connection audit trail the due-diligence list wants |

**The certificate linkage, stated plainly.** Three certificates participate in one IKEv2 connection, and every one of their requirements comes from §7.4:

1. **Server certificate** on `vpnz-rras01`: subject `CN=vpn.vertexpeak.fyp.lab`, SAN `vpn.vertexpeak.fyp.lab` and `vpnz-rras01.vertexpeak.fyp.lab`, from the `RAS and IAS Server` template. The client validates the *server's* name against the address it dialled, so the server certificate must contain the name clients use — which is `vpn.vertexpeak.fyp.lab`, resolving to the VIP 10.10.50.10, not the host's own name.
2. **Machine certificate** on the client, from the `Workstation Authentication` template with `Client Authentication` EKU, autoenrolled by `GPO-WS-Cert-AutoEnrol` (§7.4.5).
3. **User certificate** on the client, from the `User` template, also autoenrolled, used for the user half of the EAP authentication.

Requiring *both* a machine and a user certificate is the design's answer to due-diligence item 3. A stolen laptop alone cannot connect (no user certificate); a stolen user certificate alone cannot connect (no machine certificate). The cost is honest and must be stated: certificate enrolment becomes a provisioning dependency, and a client whose autoenrolment failed cannot connect at all — which is why §7.12 lists autoenrolment failure as a top-five troubleshooting case.

#### 7.7.5 Verification

| # | Check | Exact command | Expected result |
|---|---|---|---|
| RRAS-01 | Role installed and configured | `Get-RemoteAccess \| Select RemoteAccessServer, VpnStatus, VpnS2SStatus, RoutingStatus` | `VpnStatus Enabled`, `RoutingStatus Installed` |
| RRAS-02 | Forwarding enabled on the internal interface | `Get-NetIPInterface -AddressFamily IPv4 \| Select InterfaceAlias, Forwarding` | `SRV-VLAN30` → `Enabled` |
| RRAS-03 | Static pool route present and persistent | `Get-NetRoute -DestinationPrefix '10.10.201.0/24'` | One route, `PolicyStore PersistentStore` |
| RRAS-04 | Whole IP routing table captured as evidence | `Get-NetRoute -AddressFamily IPv4 \| Sort-Object DestinationPrefix \| Format-Table -AutoSize` | Includes the directly connected `10.10.30.0/24`, the default via 10.10.30.254, and the `10.10.201.0/24` pool route |
| RRAS-05 | Interface state and metrics | `Get-NetIPInterface -AddressFamily IPv4 \| Select ifIndex, InterfaceAlias, NlMtu, InterfaceMetric, ConnectionState` | `SRV-VLAN30` `Connected`, metric consistent with the VLAN 30 priority |
| RRAS-06 | **Traffic is genuinely routed** | From a VPN client, `tracert 10.10.30.11 -h 5`; from `vpnz-rras01`, `Test-NetConnection 10.10.30.11 -TraceRoute` | The traceroute passes through `vpnz-rras01` (10.10.30.41) and then reaches the DC; it does not pass through the default gateway directly |
| RRAS-07 | Routing works in the other direction | On `vpnz-dc01`: `tracert 10.10.201.10 -h 5` | First hop 10.10.30.254 (HSRP VIP), then 10.10.30.41, then the client |
| RRAS-08 | NPS sees the RRAS client | `Get-NpsRadiusClient`; NPS log at `C:\Windows\System32\LogFiles\IN*.log` | `vpnz-rras01` listed; accounting records present after a connection |
| RRAS-09 | Unauthorised user is refused | remove a test account from `GG-VPN-Users`, attempt a connection | IKEv2 establishes, then the RAS authorisation fails; NPS event 6273 with a reason code; `RasClient` event 20227 |
| RRAS-10 | Preshared-key IKEv2 is not possible | `Get-VpnAuthProtocol`; attempt a connection with a PSK | `UserAuthProtocol : EAPHOST`; PSK attempt fails by policy. This is the evidence that the "no shared passwords" requirement is met |
| RRAS-11 | RAS interfaces visible while connected | `Get-NetIPInterface \| Where-Object InterfaceAlias -like '*RAS*'`; `Get-NetIPAddress -AddressFamily IPv4 \| Where-Object IPAddress -like '10.10.201.*'` | A RAS interface exists holding an address from the pool |
| RRAS-12 | RRAS does not NAT | `Get-NetNat` | No NAT object exists. This is the evidence for the §7.7.3 statement that NAT belongs to the nftables pair |

**The "traffic is routed" demonstration, in the form that actually convinces a reader.**

A ping proves reachability. What proves *routing* is that the path is visible and that removing the route breaks it. The evidence set is therefore three captures:

1. `tracert` from the VPN client showing `vpnz-rras01` in the path.
2. `Get-NetIPInterface` on `vpnz-rras01` showing `Forwarding Enabled` on `SRV-VLAN30`.
3. The **negative control**: disable forwarding (`Set-NetIPInterface -InterfaceAlias 'SRV-VLAN30' -Forwarding Disabled`), attempt the same ping, capture the failure, then re-enable it and capture the recovery.

```text
[ROUTING NEGATIVE CONTROL — evidence set]
# 1. Baseline: reachability works
PS C:\> Test-NetConnection 10.10.30.11 -InformationLevel Quiet
True

# 2. Disable forwarding on vpnz-rras01
PS C:\> Set-NetIPInterface -InterfaceAlias 'SRV-VLAN30' -Forwarding Disabled
PS C:\> Get-NetIPInterface -InterfaceAlias 'SRV-VLAN30' | Select InterfaceAlias, Forwarding
InterfaceAlias Forwarding
-------------- ----------
SRV-VLAN30       Disabled

# 3. The same ping now fails from the VPN client
PS C:\> ping 10.10.30.11
Request timed out.
Request timed out.
Request timed out.

# 4. Re-enable and prove recovery
PS C:\> Set-NetIPInterface -InterfaceAlias 'SRV-VLAN30' -Forwarding Enabled
PS C:\> ping 10.10.30.11
Reply from 10.10.30.11: bytes=32 time=3ms TTL=127
```

The negative control is the part most student reports omit, and it is the part that converts "it works" into "I understand *why* it works". It belongs in `06-verification/` with a test-case ID.

---

### 7.8 IKEv2 VPN with Certificate Authentication

#### 7.8.1 Why IKEv2, and how it compares with the alternatives

**Honesty note.** `IKEv2` occurs **0 times** in the WSOS 2026 text and raw HTML, and 0 times in 2024. The nearest citable hooks are the Domain 3 requirement `Provide network connectivity between remote branches using VPN technologies such as IPSec, SSL VPN, Direct Access, OpenVPN, DMVPN, GRE, etc.` — which names **IPSec** — and the Domain 3 know/understand line `Security protocols to secure local and wide area networks`. IKEv2 is a project choice justified from the topic sheet, bridged to the standard through IPSec, and must be presented as a bridge rather than a quote.

**The comparison, limited to what this project actually builds.**

| Property | **RRAS IKEv2 (this design)** | SSTP (same role, not built) | L2TP/IPsec (same role, not built) | OpenVPN (`vpnz-lnxra01`) | WireGuard (`vpnz-nft01/02`) |
|---|---|---|---|---|---|
| Where it runs | `vpnz-rras01`, Windows Server 2025 | same role, Windows | same role, Windows | Ubuntu 24.04.3, OpenVPN 2.6.x | Ubuntu 24.04.3, `wireguard-tools` 1.0.20210914 |
| Transport | UDP 500/4500 (NAT-T) | TCP 443 (SSTP over TLS) | UDP 500/4500 | UDP 1194 | UDP 443 |
| Authentication | **Certificate-based EAP, machine + user certificate** | Username/password or certificate | **Preshared key or certificate** — PSK is the common default and is forbidden by this design | X.509 client certificates from Easy-RSA | Public-key peers |
| NAT traversal | Native NAT-T | Trivially (TCP 443) | Native NAT-T | Good | UDP-based; works well |
| Interoperates with non-Windows clients | Poorly; native Windows/Apple are the practical clients | Poorly | Reasonably | Excellent (Linux, macOS, iOS, Android) | Excellent on Linux, improving elsewhere |
| Platform integration | Built into Windows; pushed as a connection profile by GPO; appears in `Get-VpnConnection` | Same | Same | Needs a third-party client (or `openvpn3`) | Needs a third-party client |
| Auditability | NPS log + `RasClient` event log + `Get-VpnConnection` | Same | Same | OpenVPN status log | No accounting by default |
| Why chosen / not chosen | **Chosen**: it is the only option that gives certificate-based-only authentication *and* deep Windows platform integration, which is what the due-diligence item asks for | Rejected: TLS-over-443 is attractive for firewall traversal, but the design already has two TLS-based remote access paths (OpenVPN and the reverse proxy) and SSTP would not add a new capability, only a third TLS endpoint to secure | Rejected outright **with PSK**: a shared secret is exactly what the client forbade. L2TP/IPsec with certificate authentication is possible but was not built, and must therefore be listed as not built rather than implied | The independent, second implementation on the Linux side. Cross-referenced to report §8, **not duplicated here** | The site-to-site and remote-worker tunnel on the Linux edge. Cross-referenced to report §8, **not duplicated here** |

**Why more than one remote-access technology exists in one design — and why that is not duplication.** The baseline deliberately implements three remote-access mechanisms for three different reasons: IKEv2 on Windows for the Wintel-integrated, certificate-only staff VPN; OpenVPN on Linux as an independently-implemented reference so that the two can be compared honestly; WireGuard as the lightweight site-to-site tunnel. The comparison chapter of the report (report §8 for Linux, and §7.8.1 here) uses the coexistence to make an argument that a single-technology project cannot make. The *risk* this creates — three endpoints, three certificate stores, three sets of ports to defend — is real and is mitigated by TB-06, which limits Internet-reachable VPN ports to exactly UDP 443, UDP 500/4500 and UDP 1194 on one public address.

#### 7.8.2 Server-side configuration

```powershell
# ---- 7.8.2 On vpnz-rras01, after §7.7 ----
# 1. Install and configure the remote-access role as a VPN server
Install-RemoteAccess -VpnType Vpn

# 2. Create the static IPv4 address pool from the baseline (10.10.201.0/24,
#    pool 10.10.201.10 - 10.10.201.200, per IKEV2-RAS-POOL in baseline §5.4)
Set-VpnServerIPAddressRange -StartIPAddress '10.10.201.10' -EndIPAddress '10.10.201.200'
Get-VpnServerIPAddressRange
```

```text
[VPN ADDRESS POOL — vpnz-rras01]
PoolName         : VpnPool
StartIPAddress   : 10.10.201.10
EndIPAddress     : 10.10.201.200
PoolType         : Static
```

The pool is **static, not DHCP-based**, and the reason is a design position rather than a convenience: a static pool means every VPN client address is known in advance, so a firewall rule, an ACL entry or an audit-log line referencing `10.10.201.14` can be interpreted without consulting a lease database. It also removes a dependency: if DHCP were unavailable, a DHCP-assigned VPN pool would fail to allocate and the tunnel would establish with no address. Baseline §5.4 fixes the range as `10.10.201.0/24` (static, `10.10.201.10 – 10.10.201.200`), the single IKEv2 pool in the design, and there is no DHCP scope for it (Rev 1.1 ruling C-21); it deliberately does not overlap `10.10.0.0/16`, `10.20.20.0/16` or `10.70.0.0/16`, and does not use the unallocated `172.16.0.0/16` head-room.

```powershell
# 3. Set the authentication protocol: EAP only. No MS-CHAPv2, no PSK.
Set-VpnAuthProtocol -UserAuthProtocol EAP `
    -TunnelAuthProtocols EAP `
    -RootCertificateNameToAccept 'CN=VP-ISSUING-CA-01, DC=vertexpeak, DC=fyp, DC=lab' `
    -PassThru

Get-VpnAuthProtocol | Format-List
```

```text
[VPN AUTH PROTOCOL — vpnz-rras01]
UserAuthProtocol                  : EAPHOST
TunnelAuthProtocols               : EAP
RootCertificateNameToAccept       : CN=VP-ISSUING-CA-01, DC=vertexpeak, DC=fyp, DC=lab
CertificateADAuthEnabled          : False
MachineCertificateEKUFilter       : 1.3.6.1.5.5.7.3.2
UserCertificateEKUFilter          : 1.3.6.1.5.5.7.3.2
```

Both EKU filters are `1.3.6.1.5.5.7.3.2` (**Client Authentication**). That is the value that stops a valid but wrongly-purposed certificate — a web-server certificate on the same machine, for example — from being accepted for VPN authentication. It is one of the more quietly important settings in the whole design.

```powershell
# 4. IPsec parameters: strong crypto, no weak fallbacks
Set-VpnServerIPsecConfiguration -EncryptionType MaximumEncryption `
    -SADataSizeForRenegotiationKilobytes 102400 `
    -SALifeTimeSeconds 28800 `
    -PassThru

Get-VpnServerIPsecConfiguration | Format-List
```

```text
[VPN IPSEC CONFIGURATION — vpnz-rras01]
EncryptionType                        : MaximumEncryption
SADataSizeForRenegotiationKilobytes   : 102400
SALifeTimeSeconds                     : 28800
```

**Reading `MaximumEncryption`.** In RRAS this value selects the strongest available IKEv2/IPsec proposal set (AES-256, SHA-256/384, DH group 14 or above) and removes DES, 3DES, SHA-1 and DH group 1/2 from the offered list. The alternative values are `RequireEncryption` and `OptionalEncryption`; `OptionalEncryption` would permit a cleartext fallback and must never be used in this design. **[ASSUMPTION]** that the enumeration string is `MaximumEncryption` on the pinned build. If `Set-VpnServerIPsecConfiguration` rejects it, the visible alternatives are `RequireEncryption` and `OptionalEncryption`; accept `RequireEncryption` **only** as a documented fallback and record the deviation, because it may allow weaker proposals than the design intends.

```powershell
# 5. Certificate binding: RRAS must be told which certificate to present.
#    Confirmed by inspection after the §7.4 autoenrolment has delivered it.
Get-ChildItem Cert:\LocalMachine\My |
    Where-Object { $_.Subject -eq 'CN=vpn.vertexpeak.fyp.lab' } |
    Select-Object Subject, Thumbprint, NotAfter, HasPrivateKey
```

```text
Subject                     Thumbprint                               NotAfter             HasPrivateKey
-------                     ----------                               --------             -------------
CN=vpn.vertexpeak.fyp.lab   9C41D2F7A8B33E6150C0E4A9D17E2B8F4A63D0C1 2027-11-07 10:12:17           True
```

`HasPrivateKey : True` is mandatory. A certificate imported without its private key will appear in the store, will appear to be valid, and will silently fail IKEv2 server authentication — the fifth item in §7.12.

```powershell
# Bind the certificate to the RAS SSTP/IKEv2 listener and record the binding
netsh http show sslcert                       # for SSTP (not used, shown for completeness)
# For IKEv2 the certificate selection is performed by RRAS from the machine store, filtered by EKU.
# Force a refresh of the RRAS certificate selection:
Restart-Service RemoteAccess
Get-RemoteAccess | Select-Object RemoteAccessServer, VpnStatus, VpnS2SStatus
```

**[ASSUMPTION]** RRAS on Windows Server selects its IKEv2 server certificate from the machine store by matching the SAN/EKU against the address the client dials, rather than by an explicit binding cmdlet. There is a documented `netsh` surface for SSTP certificate bindings but no equivalent for IKEv2 in this authoring environment's knowledge. The practical consequence for the group: if the client reports error **13801 / 13806** ("the certificate on the server is not configured correctly" / "the server's certificate could not be validated"), the fix is a certificate problem — most often a missing SAN entry or a missing private key — not an RRAS configuration problem, and the diagnosis starts with `certutil -verify` and the SAN list rather than with RRAS.

```powershell
# ---- Firewall rules required on vpnz-rras01 ----
# Inbound IKEv2 / IPsec NAT-T
New-NetFirewallRule -DisplayName 'VP-IKEv2-UDP500' -Direction Inbound -Protocol UDP `
    -LocalPort 500 -Action Allow -Profile Domain
New-NetFirewallRule -DisplayName 'VP-IKEv2-NAT-T-UDP4500' -Direction Inbound -Protocol UDP `
    -LocalPort 4500 -Action Allow -Profile Domain
New-NetFirewallRule -DisplayName 'VP-ESP' -Direction Inbound -Protocol 50 `
    -Action Allow -Profile Domain
# RADIUS (NPS accounting, P-18)
New-NetFirewallRule -DisplayName 'VP-NPS-RADIUS-Auth' -Direction Inbound -Protocol UDP `
    -LocalPort 1812 -Action Allow -Profile Domain
New-NetFirewallRule -DisplayName 'VP-NPS-RADIUS-Acct' -Direction Inbound -Protocol UDP `
    -LocalPort 1813 -Action Allow -Profile Domain
# Management
New-NetFirewallRule -DisplayName 'VP-WinRM-HTTPS' -Direction Inbound -Protocol TCP `
    -LocalPort 5986 -RemoteAddress 10.10.30.31,10.20.20.0/24 -Action Allow -Profile Domain
New-NetFirewallRule -DisplayName 'VP-RDP-Mgmt' -Direction Inbound -Protocol TCP `
    -LocalPort 3389 -RemoteAddress 10.20.20.0/24 -Action Allow -Profile Domain

Get-NetFirewallRule -DisplayName 'VP-*' | Select-Object DisplayName, Enabled, Direction, Action
```

**The firewall rules that must exist *elsewhere* — the part that is easy to forget.**

| Rule | Device | Exact form | Why |
|---|---|---|---|
| Static PAT of UDP 500/4500 to 10.10.50.10 | ASA `VP-HQ-FW-01` | `object network OBJ-VPN-RRAS` / `nat (inside,outside) static interface service udp 500 500` (and 4500) | Without it, IKEv2 packets never leave the ASA |
| Forward permit of UDP 500/4500 to 10.10.30.41 | nftables `vpnz-nft01/02`, table `inet fyp_filter` | `udp dport { 500, 4500 } ip daddr 10.10.30.41 accept` in the forward chain, before the drop | The nftables pair sits inline between the ASA and the core, so a packet permitted by the ASA can still be dropped by the Linux pair. **This is the most common reason a correctly-built VPN fails in this design** |
| Access-list for ESP if present | ASA | `access-list ACL-VPN-IN extended permit udp any host 198.51.100.5 eq 500` | Packet-Tracer ASA behaviour must be captured, not assumed |
| Egress permit for the pool | nftables pair | `ip saddr 10.10.201.0/24` permitted as a source group in the NAT and forward chains | Because split tunnelling is off, remote-worker Internet traffic egresses here and must be masqueraded, per §7.7.3 |

```powershell
# Verify each of the three layers independently before blaming the VPN
Test-NetConnection 10.10.30.41 -Port 500 -InformationLevel Detailed   # UDP is not tested by Test-NetConnection; use the tests below
Get-NetFirewallRule -DisplayName 'VP-IKEv2-*' | Select DisplayName, Enabled, Action
# On the nftables pair:
ssh root@10.10.50.11 'nft list chain inet fyp_filter forward | grep -E "500|4500"'
# On the ASA (Packet Tracer CLI):
#   show nat
#   show access-list | include 500
#   show crypto ikev2 sa
```

#### 7.8.3 Client-side configuration

##### Generating the client connection package

Two mechanisms exist, and the project uses the second as the primary because it is scriptable and therefore reviewable.

**Option A — the RRAS console wizard (for the demonstration only).** `rrasmgmt.msc` → *Remote Access* → *Create Connection Package* produces a `.exe` or a set of configuration files that installs a VPN connection on a client. It is quick and it produces a tangible artefact for a screenshot, but the generated package is a binary blob that cannot be reviewed in Git and cannot be diffed when it changes. It is used once in the demonstration and documented as not the delivery mechanism.

**Option B — GPO plus `Add-VpnConnection` (the actual mechanism).** The connection profile is delivered two ways, and both are captured:

- **Manual/scripted**, for the demonstration and for non-domain-joined clients, using `Add-VpnConnection` with every parameter stated.
- **By Group Policy**, through `GPO-WS-IKEv2-VPN-Profile` linked to `OU=Users/OU=RemoteAndContractors` (baseline §9.3), which is the mechanism that scales to 40 travelling staff without a per-laptop procedure.

```powershell
# ---- 7.8.3 Manual client provisioning (run on the client as an administrator) ----
$vpnName = 'VP-IKEv2-Cert'
$server  = 'vpn.vertexpeak.fyp.lab'

# Precondition: the machine and user certificates already exist from autoenrolment
Get-ChildItem Cert:\LocalMachine\My, Cert:\CurrentUser\My |
    Where-Object { $_.Issuer -like '*VP-ISSUING-CA-01*' } |
    Select-Object Subject, Thumbprint, NotAfter
# Expected: one machine certificate (LocalMachine) and one user certificate (CurrentUser).

Add-VpnConnection `
    -Name $vpnName `
    -ServerAddress $server `
    -TunnelType Ikev2 `
    -AuthenticationMethod Eap `
    -EncryptionLevel Maximum `
    -SplitTunneling:$false `
    -RememberCredential:$false `
    -Force

# Attach the certificate-based EAP configuration (this is the part most examples omit)
Add-VpnConnectionTriggerDnsConfiguration -DnsSuffix 'vertexpeak.fyp.lab' `
    -DnsServers 10.10.30.11,10.10.30.12 -PassThru -ConnectionName $vpnName

# Enable certificate EAP explicitly and require the client certificate
Set-VpnConnection -Name $vpnName -AuthenticationMethod Eap -EncryptionLevel Maximum
Set-VpnConnectionIPsecConfiguration -ConnectionName $vpnName `
    -AuthenticationTransformConstants SHA256128 `
    -CipherTransformConstants AES256 `
    -EncryptionMethod AES256 `
    -IntegrityCheckMethod SHA256 `
    -DHGroup Group14 `
    -PfsGroup PFS2048 `
    -Force
```

**[ASSUMPTION] on the `Set-VpnConnectionIPsecConfiguration` parameter values.** The parameter *names* (`-AuthenticationTransformConstants`, `-CipherTransformConstants`, `-EncryptionMethod`, `-IntegrityCheckMethod`, `-DHGroup`, `-PfsGroup`) are the Windows 10/11 surface for IKEv2 custom IPsec settings and are expected to be present on the pinned client OS. The *values* above are chosen to match the server's `MaximumEncryption` profile; if the client rejects a value, the correct procedure is to run `Get-VpnConnectionIPsecConfiguration` on the working client, read what it actually accepted, and record that. A mismatch between client and server IPsec proposals is one of the classic causes of "the tunnel negotiates and then drops", and it is in the §7.12 register.

```powershell
# ---- 7.8.3 Delivery by Group Policy (the scalable mechanism) ----
# GPO-WS-IKEv2-VPN-Profile, linked to OU=Users/OU=RemoteAndContractors
#   Computer Configuration > Preferences > Windows Settings > ... OR
#   User Configuration > Preferences > Control Panel Settings > ... is NOT the right vehicle for VPN.
# The practical GPO-compatible vehicles are:
#   (a) a CMakeProfile/PowerShell startup script distributed by GPO which runs the Add-VpnConnection
#       block above, and
#   (b) CMAK-generated profile files deployed by GPO preference.
# Vehicle (a) is chosen here because the script is reviewable, diffable and testable.

# The script is committed as 04-automation/powershell/New-VpnClientProfile.ps1 and its run log
# is the evidence that it executed on each client.
```

**The honest limitation.** `Add-VpnConnection` is per-user (or per-machine with `-AllUserConnection`). Deploying a VPN profile by Group Policy does not have the clean built-in "here is a VPN profile" preference that some other settings have, so this project uses a scripted deployment. The report must describe it as *scripted deployment via GPO*, not as *native GPO VPN profile delivery*, because that distinction is checkable and getting it wrong would be an over-claim.

```powershell
# ---- Connect and inspect, on the client ----
Get-VpnConnection -Name 'VP-IKEv2-Cert' |
    Select-Object Name, ServerAddress, TunnelType, AuthenticationMethod, EncryptionLevel,
                  SplitTunneling, RememberCredential, ConnectionStatus, DnsSuffix
```

```text
[VPN CLIENT PROFILE — Windows 11 client]
Name                 : VP-IKEv2-Cert
ServerAddress        : vpn.vertexpeak.fyp.lab
TunnelType           : Ikev2
AuthenticationMethod : {Eap}
EncryptionLevel      : Maximum
SplitTunneling       : False
RememberCredential   : False
ConnectionStatus     : Disconnected
DnsSuffix            : vertexpeak.fyp.lab
```

#### 7.8.4 Split tunnelling versus full tunnelling

**The decision, fixed by the baseline:** split tunnelling is **disabled**. All client traffic goes through the tunnel (baseline §12.1).

| Aspect | Full tunnel (chosen) | Split tunnel (rejected) |
|---|---|---|
| Client route table | A `0.0.0.0/0` route with the VPN interface as the next hop, plus the local subnet routes | Only the specific corporate prefixes through the tunnel; the default route stays on the local adapter |
| Security | Every packet a remote worker sends is filtered, NATed and logged at `vpnz-nft01/02`. A compromised laptop cannot exfiltrate over its own home Internet connection while connected | Corporate traffic is protected; everything else bypasses the corporate controls entirely. A compromised laptop has a direct, unlogged path to the Internet |
| Auditability | One egress point, one log, one source-NAT table. This is the direct answer to due-diligence item 2 | Two egress points, and no visibility of the non-corporate one |
| Performance | All traffic, including streaming and large downloads, transits the lab. On a single hypervisor host this is measurably slower | Internet traffic uses the local path and is faster |
| Failure behaviour | If the tunnel drops, the user loses all connectivity — including Internet access. This is loud and obvious | If the tunnel drops, the user notices nothing until they reach a corporate resource. This is quiet and is a genuine security problem: it creates the conditions for a "captive portal"-style credential-capture attack |
| Design fit | Matches `GG-VPN-ProfServices`'s need for controlled access to the platform tier and matches the client's "auditable path" requirement | Would be justified only if the performance cost were unacceptable, which it is not in a lab |

**How the routes are pushed, mechanically.** With `-SplitTunneling:$false` the Windows client installs a default route into the tunnel at connect time and removes the local default route from the effective route table. This is why the *server side* must also be right: the client's Internet traffic arrives at `vpnz-rras01`, is forwarded to the internal default gateway, traverses the nftables pair, is masqueraded there, and leaves via the ASA. Every one of those hops must permit `10.10.201.0/24`, and if any one of them does not, the symptom is "the VPN connects and internal sites work but nothing else does" — a distinct failure from "the VPN connects and nothing works", and §7.12 keeps them separate for that reason.

Evidence of the route table is mandatory, because it is the proof that the design choice was actually implemented:

```powershell
# While connected:
Get-VpnConnection -Name 'VP-IKEv2-Cert' | Select-Object SplitTunneling, ConnectionStatus

# Prove that the VPN default route exists and took priority
Get-NetRoute -AddressFamily IPv4 | Where-Object { $_.DestinationPrefix -eq '0.0.0.0/0' } |
    Sort-Object RouteMetric | Select-Object DestinationPrefix, NextHop, RouteMetric, InterfaceAlias, InterfaceMetric

# Prove the effective route table the TCP/IP stack is actually using
Find-NetRoute -RemoteIPAddress 10.10.30.11 | Select-Object IPAddress, InterfaceAlias, NextHop
Find-NetRoute -RemoteIPAddress 8.8.8.8      | Select-Object IPAddress, InterfaceAlias, NextHop
# Both must resolve via the VPN interface, not the physical adapter. The second one is the
# evidence that full tunnelling (not split tunnelling) is actually in force.
```

**[ASSUMPTION]** Using `8.8.8.8` as the probe destination is a documentation-range violation in spirit. The lab has no real Internet, so the correct probe for this test is a simulated public address from the RFC 5737 ranges already in the design — for example `192.0.2.53`, the simulated provider resolver. The report must use `192.0.2.53` in the captured transcript, not a real public address.

#### 7.8.5 Verification

| # | Check | Exact command (on the client unless stated) | Expected result |
|---|---|---|---|
| VPN-01 | Profile exists with the right parameters | `Get-VpnConnection -Name 'VP-IKEv2-Cert'` | `TunnelType Ikev2`, `AuthenticationMethod {Eap}`, `EncryptionLevel Maximum`, `SplitTunneling False` |
| VPN-02 | Certificates present on both sides | client: `Get-ChildItem Cert:\LocalMachine\My, Cert:\CurrentUser\My`; server: `Get-ChildItem Cert:\LocalMachine\My` | Machine + user certificate on the client, RAS server certificate on `vpnz-rras01`, all issued by `VP-ISSUING-CA-01` |
| VPN-03 | Successful connection | `rasdial 'VP-IKEv2-Cert'` then `Get-VpnConnection -Name 'VP-IKEv2-Cert' \| Select ConnectionStatus` | `Connected` |
| VPN-04 | Client received a pool address | `Get-NetIPAddress -AddressFamily IPv4 \| Where-Object InterfaceAlias -like '*VPN*'` | An address inside `10.10.201.10 – 10.10.201.200` |
| VPN-05 | Tunnel carries traffic to intended subnets | `ping 10.10.30.11`, `Test-NetConnection 10.10.30.21 -Port 445`, `Test-NetConnection 10.10.90.21 -Port 443` | All succeed; note that the DMZ test is expected to succeed **only** for `GG-VPN-ProfServices` if TB-11 is interpreted strictly, otherwise TB-01 governs and the result must be recorded as a finding |
| VPN-06 | **Tunnel carries traffic to the intended subnets only** | `Test-NetConnection 10.10.30.11 -Port 3389` for a user in `GG-VPN-Users` but not `GG-VPN-ProfServices`; `Test-NetConnection 10.20.20.31 -Port 3389` for any VPN user | Both fail. The first is TB-01 (`RDP is not permitted for ordinary users`), the second is TB-12 (`VPN users are never administrators of infrastructure`) |
| VPN-07 | Full tunnelling is in force | `Find-NetRoute -RemoteIPAddress 192.0.2.53 \| Select IPAddress, InterfaceAlias, NextHop` | Resolves via the VPN interface, not the physical adapter |
| VPN-08 | Server-side session visible | on `vpnz-rras01`: `Get-NetIPInterface \| Where InterfaceAlias -like '*RAS*'`; NPS accounting log | A RAS interface exists; an accounting record for the user with start time and NAS address |
| VPN-09 | Server-side IPsec state | on `vpnz-rras01`: `Get-NetIPsecMainModeSA`, `Get-NetIPsecQuickModeSA` | At least one main-mode and one quick-mode SA with the expected peer address |
| VPN-10 | **Event log evidence, success path** | client: `Get-WinEvent -LogName 'Microsoft-Windows-RasClient/Operational' -MaxEvents 20`; server: `Get-WinEvent -LogName 'Microsoft-Windows-RemoteAccess/Operational' -MaxEvents 20` | Client: event **20221** (connection established) and **20222**/**20227** as applicable. Server: IKEv2 SA established, user authorised |
| VPN-11 | **Event log evidence, failure path** | with a deliberately wrong configuration: `Get-WinEvent -LogName 'Microsoft-Windows-RasClient/Operational'` | Event **20227** with an explicit reason string (e.g. *The remote connection was not made because the attempted VPN tunnels failed*), plus event **20223**/**20226** for the IKEv2 failure. This is the single most useful diagnostic artefact in the whole VPN build |
| VPN-12 | Wrong-certificate case is refused | remove the user certificate from a test client, reconnect | Connection fails with the certificate/EAP error; server-side NPS event 6273 with a reason code. Proves that certificate authentication is genuinely enforced |
| VPN-13 | Preshared key is not accepted | attempt a connection configured with a PSK | Fails. Evidence that the "no shared passwords" requirement is met rather than merely documented |
| VPN-14 | Disconnection is clean | `rasdial 'VP-IKEv2-Cert' /disconnect`; then `Get-VpnConnection -Name 'VP-IKEv2-Cert' \| Select ConnectionStatus`; NPS accounting stop record | `Disconnected`; a stop record with the session duration |
| VPN-15 | Pool addresses are released and reused | connect two clients sequentially; `Get-NetIPAddress` on each | Each receives a distinct address from the pool; the first client's address is free for reuse |

**The event IDs to check, and what each one means.** These are the IDs a tester should have open in a second window while building the VPN, because they turn a vague "it does not connect" into a specific cause:

| Log | Event ID | Meaning | First action |
|---|---|---|---|
| `Microsoft-Windows-RasClient/Operational` | **20221** | Connection established successfully | None — this is the success marker |
| `Microsoft-Windows-RasClient/Operational` | **20227** | Connection failed; reason text included | Read the reason string first; it names the failing phase |
| `Microsoft-Windows-RasClient/Operational` | **20223**, **20226** | IKEv2 negotiation / authentication-phase failures | Check the server certificate SAN and the CRL reachability |
| `Microsoft-Windows-RasClient/Operational` | **20224** | Certificate-related failure on the client | Confirm `HasPrivateKey` and the EKU on the client certificate |
| `Microsoft-Windows-RemoteAccess/Operational` | SA-established events | Server accepted the main-mode/quick-mode SA | If absent, the failure is before authorisation — check the nftables forward chain |
| `Security` | **6272 / 6273** (NPS) | Access granted / access denied with a reason code | A 6273 with reason *"The user is not a member of the required group"* is a `GG-VPN-Users` membership problem, not a VPN problem |
| `Security` | **4625** | Logon failure | Distinguishes a credential problem from a tunnel problem |
| `Security` | **4624** | Logon success, type 3 or type 8 (NetworkCleartext) | Confirms the user reached the LAN after the tunnel came up |
| `Microsoft-Windows-RemoteAccess/Operational` | RAS error **812** (in the RAS log) | *The connection was prevented because of a policy configured on your RAS/VPN server* | The NPS connection request policy is rejecting the request; check the policy conditions, not the VPN |

**The successful-connection walkthrough, as it should be written in `06-verification/`:**

```text
[VPN END-TO-END WALKTHROUGH — 2026-10-08, client WIN11-CLIENT-01]
1. Precondition check
   PS> Get-ChildItem Cert:\LocalMachine\My, Cert:\CurrentUser\My |
       Where-Object Issuer -like '*VP-ISSUING-CA-01*' | Select Subject
   CN=vpn.vertexpeak.fyp.lab        (machine, LocalMachine)
   CN=adm-03                        (user, CurrentUser)

2. Connect
   PS> rasdial 'VP-IKEv2-Cert'
   Connecting to VP-IKEv2-Cert...
   Verifying user name and password...
   Registering your computer on the network...
   Successfully connected to VP-IKEv2-Cert.

3. Confirm the profile state
   PS> Get-VpnConnection -Name 'VP-IKEv2-Cert' | Select ConnectionStatus, SplitTunneling
   ConnectionStatus SplitTunneling
   ---------------- --------------
   Connected                False

4. Confirm the address came from the pool
   PS> Get-NetIPAddress -AddressFamily IPv4 | Where-Object InterfaceAlias -like '*VPN*'
   InterfaceAlias  : VP-IKEv2-Cert
   IPAddress       : 10.10.201.10
   PrefixLength    : 24

5. Confirm full tunnelling
   PS> Find-NetRoute -RemoteIPAddress 192.0.2.53 | Select InterfaceAlias, NextHop
   InterfaceAlias  : VP-IKEv2-Cert          <-- NOT the physical adapter
   NextHop         : 10.10.201.1

6. Confirm intended reachability
   PS> Test-NetConnection 10.10.30.11 -Port 389  -> TcpTestSucceeded : True
   PS> Test-NetConnection 10.10.30.21 -Port 445  -> TcpTestSucceeded : True

7. Confirm the NOT-intended paths are denied (the important half)
   PS> Test-NetConnection 10.20.20.31 -Port 3389 -> TcpTestSucceeded : False      (TB-12)
   PS> Test-NetConnection 10.10.30.21 -Port 3389 -> TcpTestSucceeded : False      (TB-01, ordinary user)

8. Confirm the event trail
   PS> Get-WinEvent -LogName 'Microsoft-Windows-RasClient/Operational' -MaxEvents 5 |
       Select TimeCreated, Id, LevelDisplayName
   2026-10-08 11:14:52   20221   Information      <-- connection established
   Server side: NPS Security 6272 recorded for VERTEXPEAK\adm-03
```

Step 7 is the step that proves the tunnel respects the trust-boundary table rather than merely working. A VPN whose only verification is "I can ping the DC" has demonstrated reachability and nothing else.

---

### 7.9 Interoperability with the Rest of the Environment

This subsection states the interfaces between the Windows half of the project and the other lines. It deliberately **cross-references rather than duplicates**: the Linux build detail belongs to report §8, the automation detail to report §10, the Cisco detail to report §9, and the AI detail to report §11.

#### 7.9.1 DNS and time consistency with the Linux estate

| Direction | Mechanism | Evidence |
|---|---|---|
| Linux → AD DNS | Every Linux guest resolves through `10.10.30.11` then `10.10.30.12` **only**. No public resolver is configured on any Linux guest (baseline §9.4) | `resolvectl status` / `cat /etc/resolv.conf` on `vpnz-mon01` and `vpnz-lnxra01` |
| Windows → Linux names | Linux guests that need to be resolvable are registered as static A records in the AD-integrated zone, using the hostname convention of baseline §8.2 (≤15 characters, lower case, no underscores) | `Resolve-DnsName vpnz-mon01.vertexpeak.fyp.lab` from a Windows guest; the exported zone file |
| Time, Windows side | `vpnz-dc01` is the authoritative NTP source for the forest and synchronises outward to the simulated provider `192.0.2.53`. Every other Windows machine synchronises to `vertexpeak.fyp.lab` | `w32tm /query /status` and `w32tm /query /source` per host |
| Time, Linux side | Every Linux machine synchronises to `10.10.30.11` with `10.10.30.12` as the second source, **not** to a public pool | `chronyc sources -v` on `vpnz-mon01`, `vpnz-nft01`, `vpnz-lnxra01` |
| Kerberos consequence | Time skew must be **under 5 minutes** or Kerberos authentication fails. A Linux host joined via `realmd`/`sssd`, and any Windows host with drifted time, will fail to authenticate against AD | `w32tm /stripchart /computer:10.10.30.11 /samples:3 /dataonly` showing an offset of a few milliseconds |
| DHCP | DHCP is authoritatively served by `vpnz-dc01` (active) and `vpnz-dc02` (standby) at an 80/20 split with a 500 ms failover delay. No Linux host, and no hypervisor, may serve DHCP on any lab network — the hypervisor's built-in DHCP is disabled on every `VNET-*` network | `Get-DhcpServerv4Scope`, `Get-DhcpServerv4Failover`, and the hypervisor's virtual network settings captured once |
| Conditional forwarding | The `.example` documentation namespace is resolved by a conditional forwarder to `192.0.2.53`. Nothing in the lab resolves a real public name, and no real public resolver is configured anywhere | `Get-DnsServerForwarder`, `Get-DnsServerConditionalForwarderZone` |

**A note on the DHCP `MaxClientLeadTime`, because it is a documented cross-platform trap.** The baseline fixes the DHCP failover partner relationship's `MaxClientLeadTime` at 1 hour and warns that Kwun Tong delays must not exceed 500 ms or the branch will fail over spuriously. A Linux-side routing change that adds latency to the branch path — for example an nftables rule that queues rather than forwards — can therefore cause an apparent DHCP failure with a routing cause. This belongs in the interoperability section so that the troubleshooting chapter can point at it.

#### 7.9.2 The certificate trust relationship

| Element | Windows side | Linux side | Interface |
|---|---|---|---|
| Root/issuing CA trust | `GPO-WS-Deploy-CA-Root` places `VP-ISSUING-CA-01` (and `VP-ROOT-CA` under two-tier) in each host's Trusted Root / Intermediate stores | `/usr/local/share/ca-certificates/vp-root-ca.crt` plus `update-ca-certificates` (baseline §9.4) | Same CA chain, same subject names, same conventions |
| Naming | Certificates bear the FQDN convention of baseline §8.5 | Identical convention | A certificate issued for `vpnz-lnxra01.vertexpeak.fyp.lab` is trusted by Windows; one issued for `vpn.vertexpeak.fyp.lab` is trusted by both |
| Two independent CAs, deliberately | AD CS on `vpnz-dc01` (`VP-ISSUING-CA-01`) | Easy-RSA 3.1.x on `vpnz-lnxra01` for the OpenVPN PKI | The two CAs are **not** cross-signed. This is a design decision: it keeps the OpenVPN PKI independent, which is what makes the OpenVPN-vs-IKEv2 comparison meaningful, and it removes any single CA from being a total trust dependency |
| RP-initiated TLS | The IIS nodes hold `Web Server`-template certificates for `www.vertexpeak.example` | The nginx pair holds the `portal.vertexpeak.example` material and re-encrypts to the upstreams | Full TLS end to end, with the upstream certificates validated against the internal chain |
| CRL reachability | The internal CRL is published on `vpnz-dc01` and is reachable from inside the lab | Linux hosts validate against the same CRL where they validate at all | The honest limitation of §7.4.4 applies: from outside the lab the CRL URL is not publicly reachable |

#### 7.9.3 How the Linux monitoring stack observes the Windows hosts

The monitoring stack's build belongs to report §8; what this subsection fixes is the **Windows-side surface** and the ports, which come from the baseline port matrix.

| Requirement | Windows-side configuration | Port | Evidence |
|---|---|---|---|
| Host metrics | `windows_exporter` 0.29.x installed on every Windows guest as a service, listening on 9182 | `P-23` 9182/tcp | `Get-Service windows_exporter`; Prometheus target `UP`; `Invoke-WebRequest http://10.10.30.11:9182/metrics` returning samples |
| Scrape permission | `svc_monitoring`, member of `GG-Monitoring-Readers` (Domain Local), holding performance-counter read | — | `Get-ADGroupMember 'GG-Monitoring-Readers'`; the group check on the exporter's host |
| Remote management metrics | WinRM HTTPS on 5986, permitted from `vpnz-mon01` (10.10.30.31) | `P-10` 5986/tcp | `Test-WSMan -ComputerName vpnz-fs01 -UseSSL`; the firewall rule `VP-WinRM-HTTPS` scoped to 10.10.30.31 |
| Event log collection | Windows Event Collector subscription on `vpnz-mon01` (`wecutil`), with the Windows hosts as source-initiated subscribers, forwarding the Security and System channels | over WinRM 5986 | `wecutil cs <subscription>.xml` on the collector; `wecutil gs` on a source; forwarded events visible in the collector's `ForwardedEvents` log |
| Event IDs of interest to the AI line | 4624, 4625, 4740, 4720, 4728, 4732, 7045 — exactly the set `GPO-Audit-Advanced` guarantees | — | A deliberate interface: the audit policy in §7.3.6 G-2 exists partly to feed the AI triage tools of report §11 |
| Centralised syslog | Windows does not speak syslog natively. The honest design: Windows events reach the collector over WinRM (above), and **syslog (`P-24`) carries Linux and Cisco sources only** | `P-24` 514/udp | Loki receives syslog; the `ForwardedEvents` path carries Windows |
| Alerting surface | Three alerts must be shown firing and resolving (baseline §12.2), and at least one of them should be Windows-sourced: disk free space on `vpnz-fs01`, `windows_exporter` target down, and a 4625 burst | — | Grafana alert screenshots; the alert rule files in Git |

**The honesty point that must be stated.** The baseline's `P-24` row describes syslog senders as "all Linux guests and all Cisco devices". Windows guests are not syslog senders. A report that shows a Windows host in a syslog-based topology diagram without explaining the WEC/WinRM path would be misrepresenting the design. The correct framing is: **Windows events reach the monitoring stack over the native Windows event-forwarding mechanism on WinRM 5986, which is a different path from the Linux/Cisco syslog path, and both feed the same Grafana/Loki view.**

**Trust-boundary compliance for monitoring.** The Windows Event Collector subscription is a **pull over WinRM initiated by `vpnz-mon01`**, scoped by firewall rule to 10.10.30.31. It therefore satisfies TB-08 (`every zone → Z-MGMT`: only the named management protocols from the named devices) and TB-16 (the AI agent's read-only surface: `WinRM 5986` read-only). No Windows host initiates a connection into `Z-MGMT`, and none is required to. `vpnz-mon01` is the only source permitted to open 5986, and that restriction is enforced in the host firewall rule rather than in documentation.

#### 7.9.4 How the automation layer reaches the Windows hosts

| Element | Value | Source |
|---|---|---|
| Control node | `vpnz-mon01` (10.10.30.31) — only. Ansible never runs from a student laptop | Baseline §12.4 |
| Transport | WinRM over HTTPS on **5986**, with an internal-CA-signed certificate | Port matrix `P-10`; baseline §12.4 |
| Authentication account | `svc_ansible`, member of `GG-WINRM-Admins` only | Baseline §8.4 |
| Client library | `pywinrm` 0.5.0 on the control node | Baseline §7 |
| Inventory group | `windows_servers` in `inventory/lab.ini` | Baseline §8.6 |
| Group variables | `group_vars/windows_servers.yml` carrying `ansible_connection: winrm`, `ansible_winrm_transport: certificate` or `ntlm`, `ansible_port: 5986`, and `ansible_winrm_server_cert_validation: validate` | Baseline §8.6 |
| Evidence | `win_ping` output; a run log in `04-automation/runs/`; second-run `changed=0` | Baseline §1.4 and §12.4 |
| Credential protection | The WinRM **certificate** authentication path is preferred over NTLM, because a certificate-based transport does not expose a reusable password to the control node. If certificate transport cannot be made to work, the fallback is NTLM over HTTPS with the `svc_ansible` password held in Ansible Vault — and the deviation must be recorded | — |

**The Windows-side enablement that the automation line depends on, and which this section therefore owns:**

```powershell
# WinRM HTTPS listener with an internal-CA certificate (delivered by §7.4 autoenrolment)
$cert = Get-ChildItem Cert:\LocalMachine\My |
    Where-Object { $_.Subject -eq "CN=$env:COMPUTERNAME.vertexpeak.fyp.lab" -and $_.HasPrivateKey } |
    Select-Object -First 1

winrm create winrm/config/Listener?Address=*+Transport=HTTPS "@{Hostname=`"$env:COMPUTERNAME.vertexpeak.fyp.lab`"; CertificateThumbprint=`"$($cert.Thumbprint)`"}"

# Verify the listener and the service
winrm enumerate winrm/config/Listener
Test-WSMan -ComputerName $env:COMPUTERNAME -UseSSL
# Expected: a valid WSMan response with ProductVersion listing the OS build
```

```text
[WINRM HTTPS LISTENER — vpnz-fs01]
Listener
    Address = *
    Transport = HTTPS
    Port = 5986
    Hostname = vpnz-fs01.vertexpeak.fyp.lab
    Enabled = true
    CertificateThumbprint = 4B7A1E9C2D5503F8A16C0E4B7D93F2A8C516E0B4

[Test-WSMan -UseSSL]
wsmid           : http://schemas.dmtf.org/wbem/wsman/identity/1/wsmanidentity.xsd
ProtocolVersion : http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd
ProductVendor   : Microsoft Corporation
ProductVersion  : OS: 10.0.26100.1742
```

`Test-WSMan -UseSSL` succeeding **without** `-SkipCACheck` or `-SkipCNCheck` is the proof that the WinRM listener's certificate is genuinely trusted by the control node through the internal CA, which in turn proves the PKI of §7.4 is doing real work across the estate rather than only for VPN.

---

### 7.10 Hardening and Security Baseline

The table below is the consolidated hardening baseline applied to the Windows hosts in this section. Each row states the setting, where it is applied, and the rationale. Settings delivered by the GPOs of §7.3.6 are marked with their GPO ID so that a reader can trace any single control to its source.

| # | Hardening setting | Where applied | Rationale |
|---|---|---|---|
| H-01 | Domain/Private/Public firewall enabled; inbound default **block**, with logging | G-4 `GPO-SRV-Member-Server-Baseline` (domain root for workstations via G-1) | A host firewall is policy at a second layer, independent of the nftables pair and the ASA. Defence in depth means the control is repeated, not centralised |
| H-02 | Domain join requires an administrator: `ms-DS-MachineAccountQuota` reduced to 0 | Domain root | Prevents an attacker (or a student) from joining a rogue machine and, historically, from the machine-account abuse path that leads to a DC. The default of 10 is the single most commonly left-open AD default |
| H-03 | Local `Administrators` restricted to `GG-Server-Admins` (servers) / `GG-Workstation-Admins` (workstations); no local administrators elsewhere | G-4, G-1 (restricted groups) | A server must not be able to be given away by a local change, and the estate must not accumulate unnamed local administrators |
| H-04 | Windows LAPS: 30-day rotation, 20-character minimum, post-authentication reset, backup to AD | G-6 `GPO-WS-Windows-LAPS` | Directly counters pass-the-hash across the template-cloned estate. Without LAPS, every member VM shares a local administrator password by construction |
| H-05 | Interactive and RDP logon on domain controllers restricted to `GG-Tier0-Admins` | G-3 `GPO-SRV-Tier0-Baseline` | Enforces the two-tier model. A member-server administrator who can log into a DC interactively is one hop from total compromise |
| H-06 | `Deny log on as a service` / `Deny log on locally` / `Deny access to this computer from the network` for `Domain Admins` on DMZ hosts | G-5 `GPO-SRV-DMZ-Baseline` | Prevents a Tier-0 credential from ever being used, or cached, in the least-trusted zone |
| H-07 | SMB signing required (client and server); SMBv1 driver disabled | G-1 | Stops SMB relay and tampering. It is also a precondition for trusting the FSRM quota and screen evidence, which travels over SMB 3.1.1 |
| H-08 | LLMNR disabled (`EnableMulticast = 0`) | G-1 | LLMNR is the primary name-resolution path used by credential-relay tooling, and DNS is authoritative in this design so nothing is lost |
| H-09 | NTLM auditing enabled; NTLM restricted by `Protected Users` membership for the four `adm-{initials}` accounts | G-3 plus direct group membership | Removes NTLM, CredSSP and unconstrained-delegation credentials from administrative sessions. The limitation (these accounts cannot authenticate to anything expecting NTLM) must be stated |
| H-10 | Advanced audit policy: logon, account management, group management, Kerberos, DS changes, process creation **with command line**, policy change, service installation, file share, removable storage, account lockout | G-2 `GPO-Audit-Advanced` | The audit trail the due-diligence list requires, and the data source for the AI triage tools of report §11. Enabling command-line capture is a deliberate trade-off to be documented |
| H-11 | PowerShell script-block logging and transcription to `\\vpnz-fs01\Logs` | `GPO-WS-PowerShell-Logging` | Makes administrative action attributable even when the command line is obfuscated, which is the specific gap process-creation logging leaves |
| H-12 | Spooler and RemoteRegistry services disabled | G-4 | Both are well-documented remote attack surfaces and neither is used in this design |
| H-13 | WinRM enabled with Basic authentication **disabled**, HTTPS/5986 with an internal-CA certificate, permitted only from `vpnz-mon01` and `Z-MGMT` | G-4 + host firewall rule | The automation line requires WinRM; the hardening requirement is that it be the authenticated, encrypted form and that its reachability be scoped |
| H-14 | RDP permitted only from `Z-MGMT` (10.20.20.0/24) to member servers, and denied for ordinary users | G-4 + host firewall rule; TB-01, TB-07 | RDP is the highest-value lateral-movement protocol in a Windows estate. Restricting it to one source subnet is the cheapest large risk reduction available |
| H-15 | LM hash storage disabled; Kerberos encryption types restricted to AES128/AES256 on service accounts | G-3; service-account creation | Removes the weaker hash and the weaker Kerberos etypes from negotiation entirely |
| H-16 | Service accounts: `PasswordNeverExpires` false, `CannotChangePassword` true, `SmartcardLogonRequired` true, 32-character secret, one group membership, fine-grained password policy | §7.2.5, §7.2.8 | Implements baseline §8.4 exactly, and makes interactive use of a service credential impossible rather than merely discouraged |
| H-17 | Break-glass `da-vertexpeak` account sealed offline; `krbtgt` untouched; DSRM passwords sealed | Operational | The two accounts whose compromise or misuse invalidates every other control. Both must be procedurally controlled, and any use recorded in the report |
| H-18 | DMZ hosts: no domain-admin logon, restricted logon rights, no drive mappings into `Z-SERVER`, narrower inbound allow-list (80/443 from the reverse proxies, 5986 from `Z-MGMT`) | G-5 | Implements TB-04, TB-15 and the baseline's DMZ compartmentation on the host, so that a proxy misconfiguration is not the only thing standing between the DMZ and the internal network |
| H-19 | iSCSI: CHAP one-way with a 16-character secret per initiator; initiator allow-list; storage VLAN with no route beyond the core | §7.6.2, §7.6.3 | Block storage is unauthenticated and unencrypted by design in iSCSI; CHAP and network isolation are the two controls that raise the cost of unauthorised attachment |
| H-20 | VPN: EAP certificate authentication only, no preshared key, `MaximumEncryption`, full tunnelling, NPS authorisation by group, session/idle timeouts | §7.8 | The direct technical expression of due-diligence item 3. Full tunnelling is what makes the remote path auditable |
| H-21 | Rogue-DHCP prevention: DHCP snooping on the Packet Tracer access switches with trusted ports limited to the core uplinks; no other DHCP server anywhere in the lab | Cisco line (report §9), dependency stated here | A rogue DHCP server redirects clients to an attacker-controlled gateway. The test is a deliberate rogue-DHCP attempt that must be shown blocked |
| H-22 | Certificate hygiene: 397-day maximum validity for internal TLS, 10-year issuing CA, no self-signed certificate in the delivered service set, CRL published and current | §7.4 | Long-lived certificates are unrevocable in practice; an expired CRL turns every revocation check into a failure |
| H-23 | Parameterised credential handling: no plaintext secret in any script, `.gitignore` for `*.pfx`, `*.key`, `pki/`; pre-tag secret sweep | Automation line (report §10), dependency stated here | Baseline §13.4 R-07. The Windows-side scripts in this section follow the same rule, and their logs must not contain a secret |

**The one hardening claim this project must not make.** The design is *aligned with* selected controls. It is not certified against any framework, has not been penetration-tested, and has no compliance attestation (baseline §1.5). A number of the controls above are implemented at a strength that is defensible in a two-semester lab and would be augmented in production — the iSCSI allow-list by IP rather than IQN, keepalived VRRP `PASS` authentication on a host-only segment, and the absence of BitLocker-style at-rest encryption on the guests are three honest examples. The report must list them as declared limitations rather than let a reader assume enterprise-grade coverage.

---

### 7.11 Evidence and Screenshot Checklist

The HDTN topic sheet requires students to *"produce well-organized documentation that includes all findings, manuals, steps, screen captures, verifications, and references related to the project."* **This screenshot requirement comes from the topic sheet, not from the WorldSkills Occupational Standards** — the WSOS 2026 contains 0 occurrences of `screen`, `capture`, `screenshot` and `evidence` (research pack §4.3). The checklist below is therefore a brief requirement, and it should be labelled as such wherever it is reproduced.

Naming convention, fixed by baseline §8.6: `{date}_{host}_{what}.png`, for example `2026-10-06_vpnz-dc01_dcdiag.png`, stored under `07-evidence/`. Captions use the baseline's template `Figure {n}: {what} — {host} — {command or action} — {date}`.

[FIGURE: Index sheet of the captured evidence for line L1 — a contact-sheet montage of the AD DS, PKI, FSRM, iSCSI, RRAS and IKEv2 screenshots in `07-evidence/`, labelled with their figure numbers, so that a reader can see at a glance how many capture items in this checklist are still outstanding]

#### 7.11.1 AD DS

- [ ] `vpnz-dc01` and `vpnz-dc02` `Get-ComputerInfo` output showing Windows Server 2025 build `10.0.26100.1742` (or the recorded deviation)
- [ ] `Get-NetIPConfiguration` on `vpnz-dc01` showing 10.10.30.11/24, alias `SRV-VLAN30`, DNS 127.0.0.1
- [ ] `Get-NetIPConfiguration` on `vpnz-dc02` showing 10.10.30.12/24, DNS 10.10.30.12 then 10.10.30.11
- [ ] The completed `Install-ADDSForest` transcript, including the `OperationMode : Win2025Forest` line
- [ ] `Get-ADForest` and `Get-ADDomain` output showing `vertexpeak.fyp.lab`, `VERTEXPEAK`, `Win2025Forest`
- [ ] `netdom query fsmo` showing all five roles on `vpnz-dc01`
- [ ] `Get-ADDomainController -Filter *` showing both DCs in site `HQ-ShaTin` as Global Catalogs
- [ ] The completed `Install-ADDSDomainController` transcript on `vpnz-dc02`
- [ ] Active Directory Users and Computers showing the full `OU=VertexPeak` tree, expanded, in one capture
- [ ] The `New-VertexPeakOU.ps1` **first** run log (lines reading `CREATED`) and its **second** run log (all lines reading `EXISTS`) — the idempotence pair
- [ ] Active Directory Users and Computers showing `OU=Groups/OU=Global` with all fourteen global groups
- [ ] Active Directory Users and Computers showing `OU=Groups/OU=DomainLocal` with all eight domain-local groups
- [ ] `Get-ADUser -Filter 'sAMAccountName -like "svc_*"' -Properties PasswordNeverExpires, CannotChangePassword, MemberOf` showing exactly one membership each
- [ ] The over-privileged-service-account check returning **no rows**
- [ ] `Get-ADFineGrainedPasswordPolicy` showing `FGPP-ServiceAccounts` with precedence 10, 32-character minimum
- [ ] `Get-ADGroupMember 'Protected Users'` showing the four `adm-{initials}` accounts
- [ ] The Default Domain Policy password and lockout settings, captured from the Group Policy Management Editor as a settings report (`GPO report → HTML`) for `GPO-WS-Baseline-Security`
- [ ] A lockout in progress: five failed logons followed by the `Get-ADUser … -Properties LockedOut` result
- [ ] Event 4740 captured in Event Viewer showing the locked account and the source workstation
- [ ] `Get-ADReplicationSite -Filter *` showing all four sites
- [ ] `Get-ADReplicationSubnet -Filter *` showing every subnet mapped, with the *no-unmapped-subnet* check returning nothing
- [ ] `Get-ADReplicationSiteLink` showing `ReplicationFrequencyInMinutes 15`
- [ ] `repadmin /replsummary` showing `0 / n` failures on every row
- [ ] `repadmin /showrepl` for both directions
- [ ] `dcdiag /v` complete, every test showing `passed`
- [ ] `dcdiag /test:dns /dnsall /v` complete
- [ ] `Get-DnsServerZone` showing the forward zone as `Primary`, AD-integrated, `Secure` updates
- [ ] DNS Manager showing the zone with SRV records, and the additional A records (`portal`, `www`, `blog`, `vpn`, `wg`)
- [ ] `w32tm /query /status` on `vpnz-dc01` and `w32tm /query /source` on `vpnz-fs01`
- [ ] `dsacls` on `OU=Users` showing `GG-Helpdesk` with only Reset Password / Change Password
- [ ] `gpresult /h` HTML output for one member server and one workstation
- [ ] The GPO backup directory listing showing eleven GUID folders
- [ ] The `preflight-{hostname}.log` for both DCs

#### 7.11.2 PKI (ADCS)

- [ ] The completed `Install-AdcsCertificationAuthority` transcript
- [ ] `certutil -cainfo` showing `VP-ISSUING-CA-01`, `Enterprise Root CA`, SHA256, 4096-bit, NotAfter 10 years out
- [ ] `certutil -CATemplates` listing all seven published templates
- [ ] Certification Authority console showing *Issued Certificates* with at least one certificate per required use
- [ ] `certutil -pulse` on a client and the resulting `Cert:\LocalMachine\My` certificate with `NotAfter` ≈ 397 days out
- [ ] The certificate's Details tab showing the Subject and the SAN extension containing both the short name and the FQDN
- [ ] `certutil -verify -urlfetch` on an issued certificate showing `Certificate is valid` and all URLs retrieved
- [ ] `certutil -URL` on the CRL showing the CRL is current
- [ ] The revocation test: `certutil -revoke`, `certutil -CRL`, and the client-side `CERT_E_REVOKED` failure
- [ ] The trusted-root store on a member server showing `VP-ISSUING-CA-01`
- [ ] The certificate with `HasPrivateKey : True` on `vpnz-rras01` with subject `CN=vpn.vertexpeak.fyp.lab`
- [ ] The `GPO-WS-Cert-AutoEnrol` setting showing `AEPolicy` = 7

#### 7.11.3 FSRM

- [ ] `Get-WindowsFeature FS-FileServer, FS-Resource-Manager` showing both installed
- [ ] `Get-Disk` and `Get-Volume` showing the 20 GB data volume as `D:` labelled `VP-DATA`, NTFS
- [ ] `Get-SmbShare` showing all four shares `Online` with the correct paths
- [ ] `Get-Acl D:\Shares\Finance` showing `DL-Finance-RW` (Modify) and no `Everyone` / `Authenticated Users`
- [ ] File Server Resource Manager console → *Quota Management → Quota Templates* showing all four templates with three thresholds each
- [ ] File Server Resource Manager console → *Quota Management → Quotas* showing all four auto-quotas with usage
- [ ] File Server Resource Manager console → *File Screening Management → File Groups* showing all three groups with their pattern lists
- [ ] File Server Resource Manager console → *File Screening Management → File Screens* showing three `Active` and one non-active (`Public`)
- [ ] **The quota-exceeded capture**: the client-side `There is not enough space on the disk` error
- [ ] **The paired quota evidence**: the `SRMSVC` Application-log event naming the path, the 5368709120-byte limit and the actual usage
- [ ] **The blocked-file capture**: `Access to the path '\\vpnz-fs01\Finance\probe-blocked.mp3' is denied`
- [ ] **The paired screening evidence**: the `SRMSVC` event naming the blocked file group and the user
- [ ] **The exception capture**: `probe-allowed.msi` written successfully into `D:\Shares\Engineering\_build-artefacts`, while the same extension is still blocked in the share root
- [ ] The file-screen exception properties dialog showing `Allowed-Engineering-Build`
- [ ] `Get-FsrmStorageReport` showing `LastStatus Success`
- [ ] The generated storage report HTML for *Duplicate files* and *Files by owner*, opened in a browser
- [ ] The scheduled task list under *Storage Reports Management* showing the weekly report jobs
- [ ] The mapped drives `F:`, `G:` and `H:` on a workstation, captured in File Explorer with the UNC path visible

#### 7.11.4 iSCSI

- [ ] `Get-WindowsFeature FS-iSCSITarget-Server` showing `Installed`
- [ ] `Get-VHD` showing the three VHDX files as `Dynamic` with 20/40/60 GB sizes
- [ ] `Get-IscsiServerTarget` showing all three targets with their IQNs and initiator allow-lists
- [ ] `Get-IscsiVirtualDiskTargetMapping` showing all three mappings
- [ ] iSCSI Target management console showing the targets, the virtual disks and the initiator lists
- [ ] `Get-InitiatorPort` on the initiator showing the initiator IQN
- [ ] `Get-IscsiTarget` after discovery, showing the three discovered targets
- [ ] The completed `Connect-IscsiTarget` transcript including `AuthenticationType ONEWAYCHAP`, `IsConnected True`, `IsPersistent True`
- [ ] `Get-IscsiSession` showing the session, the CHAP authentication type and the persistence flag
- [ ] `Get-Disk` showing the iSCSI disk before initialisation (`RAW`, `Offline`, bus `iSCSI`)
- [ ] `Initialize-Disk` and `Format-Volume` transcripts
- [ ] `Get-Volume -DriveLetter L` showing `VP-LUN01-WEBFARM`, NTFS, 20 GB, `Healthy`
- [ ] File Explorer or `dir L:\` showing a written file
- [ ] **The target-restart walkthrough**: the target's `Stop-Service WinTarget`, the initiator's session-lost evidence (no rows, `No MSFT_Volume objects`), the target's `Start-Service WinTarget`, and the initiator's recovered session, healthy volume and readable data
- [ ] **The allow-list denial**: the failed connection attempt from an unlisted host, with the exact error
- [ ] The target-side event log entry for a failed CHAP authentication
- [ ] `Get-IscsiVirtualDisk` showing `Used` far below `Size`, proving thin provisioning
- [ ] The hypervisor's datastore view showing the `vpnz-san01` disk growth (thin provisioning evidence at the storage layer)

#### 7.11.5 RRAS and routing

- [ ] `Get-WindowsFeature RemoteAccess, NPAS` showing both installed
- [ ] `Get-RemoteAccess` showing `VpnStatus Enabled` and `RoutingStatus Installed`
- [ ] `Get-NetIPInterface -AddressFamily IPv4` showing `Forwarding Enabled` on `SRV-VLAN30`
- [ ] The `IPEnableRouter` registry value read back as 1
- [ ] `Get-NetRoute` showing the `10.10.201.0/24` route with `PolicyStore PersistentStore`
- [ ] The complete IPv4 routing table of `vpnz-rras01` as evidence
- [ ] **The routed-traffic traceroute** from a VPN client showing `vpnz-rras01` in the path
- [ ] **The routing negative control**: forwarding disabled → same ping fails → forwarding re-enabled → same ping succeeds, as three consecutive captures
- [ ] `Get-NetNat` returning no NAT object, as the evidence that RRAS does not NAT in this design
- [ ] The nftables forward chain showing the UDP 500/4500 permit to 10.10.30.41, captured on `vpnz-nft01`
- [ ] The ASA `show nat` and the `show access-list | include 500` output (Packet Tracer)
- [ ] The NPS console showing the RRAS client and the connection request policy

#### 7.11.6 IKEv2 VPN

- [ ] `Set-VpnServerIPAddressRange` transcript and `Get-VpnServerIPAddressRange` showing 10.10.201.10 – 10.10.201.200
- [ ] `Get-VpnAuthProtocol` showing `EAPHOST`, the EKU filters, and the accepted root CA
- [ ] `Get-VpnServerIPsecConfiguration` showing `MaximumEncryption`
- [ ] The five `VP-*` host firewall rules on `vpnz-rras01` from `Get-NetFirewallRule`
- [ ] `Get-VpnConnection -Name 'VP-IKEv2-Cert'` showing the profile parameters before connection
- [ ] The certificate stores on the client showing the machine certificate (LocalMachine) and the user certificate (CurrentUser), both issued by `VP-ISSUING-CA-01`
- [ ] The client-side OS certificate-selection dialog during connection, showing the certificate being chosen (this is the visible proof of certificate-based EAP)
- [ ] The successful `rasdial` output and `ConnectionStatus : Connected`
- [ ] `Get-NetIPAddress` showing the client holding an address in `10.10.201.0/24`
- [ ] The client route table showing the `0.0.0.0/0` route through the VPN interface (full-tunnel evidence)
- [ ] `Find-NetRoute -RemoteIPAddress 192.0.2.53` showing the VPN interface, not the physical adapter
- [ ] `Test-NetConnection` succeeding to 10.10.30.11:389 and 10.10.30.21:445
- [ ] **`Test-NetConnection` failing to 10.20.20.31:3389** (TB-12) and to 10.10.30.21:3389 for an ordinary user (TB-01)
- [ ] `Get-NetIPsecMainModeSA` and `Get-NetIPsecQuickModeSA` on `vpnz-rras01`
- [ ] `Get-NetIPInterface` on `vpnz-rras01` showing the RAS interface while a client is connected
- [ ] Client log: `Microsoft-Windows-RasClient/Operational` event **20221** (`Information`)
- [ ] Client log: event **20227** with its reason string, from a deliberately failed attempt
- [ ] Server log: `Microsoft-Windows-RemoteAccess/Operational` showing the SA established and the user authorised
- [ ] NPS accounting log entries for a session start and a session stop, with the duration
- [ ] NPS Security event **6272** for a successful authorisation and **6273** with a reason code for a refusal
- [ ] The refused connection after removing the test account from `GG-VPN-Users`
- [ ] The refused connection after removing the client certificate, proving certificate authentication is genuinely enforced
- [ ] The client-side certificate-package wizard output (Option A), for completeness, labelled as the demonstration artefact and not the delivery mechanism

#### 7.11.7 Cross-cutting and interoperability

- [ ] `Test-WSMan -UseSSL` succeeding on a Windows guest **without** `-SkipCACheck` / `-SkipCNCheck`
- [ ] `winrm enumerate winrm/config/Listener` showing the HTTPS listener on 5986 with the certificate thumbprint
- [ ] The Windows Event Collector subscription on `vpnz-mon01` and a forwarded event visible in the collector's `ForwardedEvents` log
- [ ] Grafana's `fyp-overview` dashboard showing a Windows host's CPU, memory and disk panels populated from `windows_exporter`
- [ ] Prometheus `/targets` showing the Windows `windows_exporter` targets as `UP`
- [ ] The `GG-Monitoring-Readers` group membership showing `svc_monitoring` as its only member
- [ ] `chronyc sources -v` on a Linux guest showing `10.10.30.11` as the synchronisation source, alongside `w32tm /query /source` on a Windows guest showing the same DC — the two-platform time-consistency pair
- [ ] The relevant `nft list ruleset` excerpt and the `NFT-DROP: ` log line that denies a VPN-pool source reaching a denied destination, as the "one screenshot per zone boundary showing a denied packet" requirement of baseline §10
- [ ] The ASA `show logging` excerpt showing the corresponding denial at the perimeter

---

### 7.12 Common Failure Modes and Troubleshooting

Domain 6 *Troubleshooting* carries **25 %** of the WSOS 2026 assessment — the joint-largest weighting, alongside Data Transfer Networks and Network and System Operations. The register below is written to serve that domain directly: every entry names a symptom, the likely cause, and a resolution that ends in a verification command. Where a screenshot or transcript is the natural evidence, that is stated.

#### T-01 The VPN connects but nothing on the internal network is reachable

**Symptom.** `rasdial` reports success, `Get-VpnConnection` shows `Connected`, the client holds a `10.10.201.x` address, but `ping 10.10.30.11` times out and no internal resource is reachable. The client's own VPN interface counters show packets sent and none received.

**Likely cause.** IP forwarding is not enabled on the RRAS host's internal interface. The tunnel is up; the packets arrive at `vpnz-rras01` and are dropped because the host is not a router.

**Resolution.**
```powershell
Get-NetIPInterface -AddressFamily IPv4 | Select-Object InterfaceAlias, Forwarding
# If SRV-VLAN30 shows Disabled:
Set-NetIPInterface -InterfaceAlias 'SRV-VLAN30' -Forwarding Enabled
# Also confirm IPEnableRouter = 1 and, if it was changed, reboot.
Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters' -Name IPEnableRouter
# Negative control for the evidence file: disable, observe the failure, re-enable, observe recovery
```
Second candidate cause if forwarding is already `Enabled`: there is no return route for `10.10.201.0/24` on the internal network, so replies are sent to the default gateway and lost. Confirm with `Get-NetRoute -DestinationPrefix '10.10.201.0/24'` on `vpnz-rras01` and on the core (Packet Tracer `show ip route 10.10.201.0`).

#### T-02 The VPN fails to connect and the client reports "the remote connection was not made"

**Symptom.** `rasdial` fails within seconds. Event `Microsoft-Windows-RasClient/Operational` **20227** is written with a reason string.

**Likely cause (three-way split).**
1. *Establishing the tunnel fails* — UDP 500/4500 is being dropped. In this design the packet must be permitted at **three** places: the ASA PAT, the nftables forward chain, and the host firewall on `vpnz-rras01`. The most commonly missed is the nftables pair.
2. *The certificate is rejected* — events **20223**/**20224** name a certificate problem. Check the server certificate's SAN contains `vpn.vertexpeak.fyp.lab` and that `HasPrivateKey` is `True`.
3. *Authorisation is refused* — the tunnel comes up and then drops; NPS logs **6273** with a reason code.

**Resolution.**
```powershell
# 1. Which layer? Check each independently.
Get-NetFirewallRule -DisplayName 'VP-IKEv2-*' | Select-Object DisplayName, Enabled, Action
ssh root@10.10.50.11 'nft list chain inet fyp_filter forward | grep -E "500|4500"'
# On the ASA: show nat | include 500 ; show crypto ikev2 sa
# 2. Certificate:
certutil -verify -urlfetch <thumbprint>            # on vpnz-rras01
Get-ChildItem Cert:\LocalMachine\My | Select Subject, SAN, HasPrivateKey
# 3. Authorisation:
Get-ADGroupMember 'GG-VPN-Users' | Select SamAccountName
Get-WinEvent -LogName Security -FilterXPath "*[System[EventID=6273]]" -MaxEvents 3
```

#### T-03 The VPN connects and internal sites work, but the client has no Internet access

**Symptom.** Internal reachability is perfect; `Test-NetConnection 192.0.2.53` (or any external probe) fails. This is a *different* fault from T-01 and must not be conflated with it.

**Likely cause.** Full tunnelling is in force (correctly), so client Internet traffic arrives at `vpnz-rras01`, is forwarded to the core, and must then be **masqueraded by the nftables pair**. The nftables forward/nat chains permit `10.10.10.0/16`, `10.20.20.0/16` and the DMZ but not the VPN pools `10.10.200.0/24`, `10.10.200.64/26`, `10.10.201.0/24` or `10.10.202.0/24`.

**Resolution.** Add the VPN pool prefixes to the nftables source sets used by the forward and nat chains, then verify:
```bash
ssh root@10.10.50.11 'nft list set inet fyp_filter <set-name>'
ssh root@10.10.50.11 'nft monitor'      # then generate traffic from the client and watch
```
Verification that the fault was in the expected place: capture `nft monitor` output showing the `10.10.201.x` source being dropped *before* the change and forwarded after it. This also satisfies the baseline's "one screenshot per zone boundary showing a denied packet" requirement.

#### T-04 Kerberos authentication fails intermittently across the estate

**Symptom.** Users are intermittently unable to log on; `klist` reports no tickets; Event 4771 or 4625 appears on the DCs with no obvious credential cause; the failures cluster in time.

**Likely cause.** Time skew in excess of the Kerberos tolerance (the baseline fixes this as "less than 5 minutes or Kerberos fails"). The three usual sources in this lab are: the hypervisor's time-sync-with-host left enabled on `vpnz-dc01`; a VM resumed from a snapshot with a stale clock; and a guest configured to reach a public NTP pool it cannot route to, so its clock free-runs.

**Resolution.**
```powershell
# Compare each host's clock against the forest source
w32tm /stripchart /computer:10.10.30.11 /samples:5 /dataonly
# On the PDC emulator, confirm it is not following the hypervisor
w32tm /query /status ; w32tm /query /source
# If it reads "Local CMOS Clock" or the hypervisor, re-assert the manual peer list:
w32tm /config /manualpeerlist:"192.0.2.53,0x8 192.0.2.54,0x8" /syncfromflags:manual /reliable:yes /update
Restart-Service W32Time ; w32tm /resync /rediscover
# Resynchronise the client, then re-test ticket acquisition
w32tm /resync ; klist purge ; klist
```
Also check `Get-VMIntegrationService` (or the hypervisor equivalent) for the time-synchronisation service on each DC and disable it.

#### T-05 The IIS nodes and the RRAS server fail certificate authentication

**Symptom.** A certificate exists in the store and looks valid, but the service refuses to use it; the client receives an error naming the server certificate (*"the certificate on the server is not configured correctly"*, or the client-side IKEv2 error 13801/13806); or autoenrolment silently fails.

**Likely cause, in order of frequency.**
1. **No private key.** The certificate was imported or requested without one. `HasPrivateKey` is `False`. The certificate appears in every UI list and is unusable.
2. **Missing SAN.** The certificate has a correct `CN` but no `dNSName` in the Subject Alternative Name. Modern clients validate the SAN and ignore the CN entirely when a SAN is present.
3. **Wrong EKU.** A certificate with only `Server Authentication` cannot be used for client authentication and a VPN client certificate with only `Client Authentication` cannot serve as a server certificate.
4. **Wrong template / no autoenrolment rights.** The template's ACL was never granted *Read + Enroll + Autoenroll* to `Domain Computers`, so `certutil -pulse` completes with no request generated.
5. **The certificate is not yet trusted by the peer**, because `GPO-WS-Deploy-CA-Root` has not applied on that host.

**Resolution.**
```powershell
# Inspect the certificate properly, not just its Subject
$c = Get-ChildItem Cert:\LocalMachine\My | Where-Object Subject -eq 'CN=vpn.vertexpeak.fyp.lab'
$c.HasPrivateKey
$c.Extensions | Where-Object Oid -like '*2.5.29.17*' | ForEach-Object { $_.Format($false) }  # SAN
$c.EnhancedKeyUsageList
certutil -verify -urlfetch $c.Thumbprint
# Force re-request if the certificate is wrong
certutil -pulse
Get-WinEvent -LogName 'Microsoft-Windows-CertificateServicesClient-Lifecycle-System/Operational' -MaxEvents 10
```
The most instructive of these cases for the report is #2: a certificate that validates for `vpnz-rras01.vertexpeak.fyp.lab` but not for `vpn.vertexpeak.fyp.lab` produces a *working* connection when the client dials the host name and a *failing* one when it dials the service name, which looks like an intermittent fault and is not.

#### T-06 A blocked file operation cannot be distinguished from a permissions failure

**Symptom.** A user reports *"Access is denied"* writing to a share. The tester's first instinct is that the NTFS or share permission is wrong, spends an hour on the ACLs, and finds nothing wrong with them.

**Likely cause.** `ERROR_ACCESS_DENIED` is what FSRM file screening returns to the client, and it is identical to the error an NTFS denial produces. FSRM quota is different again (`ERROR_DISK_FULL`).

**Resolution — the three-way discriminator.**
```powershell
# Step 1: is it a screen? Try a DIFFERENT extension, same size, same folder, same user.
'x' * 1024 | Out-File '\\vpnz-fs01\Finance\control-write.txt'     # succeeds?
'x' * 1024 | Out-File '\\vpnz-fs01\Finance\control-write.mp3'     # fails?
# A screen denies the second and permits the first, independent of size.
# Step 2: is it a quota? Try a SMALL file, then a LARGE file, same extension.
fsutil file createnew "$env:TEMP\small.bin" 1048576                # 1 MB
Copy-Item "$env:TEMP\small.bin" '\\vpnz-fs01\Public\small.bin'     # succeeds if space remains
fsutil file createnew "$env:TEMP\large.bin" 6442450944             # 6 GB
Copy-Item "$env:TEMP\large.bin" '\\vpnz-fs01\Public\large.bin'     # fails if the quota is the cause
# Step 3: confirm on the server
Get-WinEvent -LogName Application -Source SRMSVC -MaxEvents 10 |
    Select-Object TimeCreated, Id, Message
Get-FsrmFileScreen -Path 'D:\Shares\Finance' | Select-Object Path, Active, IncludeGroup
Get-FsrmQuota      -Path 'D:\Shares\Finance' | Select-Object Path, Size, Usage
```
Making the *control write* part of the standard diagnostic procedure is the whole lesson of this entry.

#### T-07 The iSCSI disk is missing after the initiator reboots

**Symptom.** `L:` existed before the reboot and does not exist afterwards. `Get-Disk` shows no iSCSI disk.

**Likely cause.** The iSCSI session was established without persistence, so it existed only for that boot. This is the single most common iSCSI mistake in student builds, because a fresh logon appears to work perfectly.

**Resolution.**
```powershell
# Diagnose
Get-IscsiSession | Select-Object TargetNodeAddress, IsConnected, IsPersistent
Get-Service msiscsi | Select-Object Status, StartType
# Fix: register the logon as persistent
Register-IscsiSession -SessionIdentifier (Get-IscsiSession |
    Where-Object { $_.TargetNodeAddress -like '*storage-lun01*' }).SessionIdentifier
# Or re-establish with persistence
Connect-IscsiTarget -NodeAddress <target-iqn> -TargetPortalAddress 10.10.80.21 `
    -AuthenticationType ONEWAYCHAP -ChapUsername <initiator-iqn> -ChapSecret $sec -IsPersistent $true
# Verify with a full reboot, which is the only honest test
Restart-Computer -Confirm:$false
```
Related cause if persistence is already set: the `msiscsi` service was left on `Manual` start, so it does not start early enough at boot. Set it to `Automatic`.

#### T-08 The iSCSI disk is present but offline or unreadable

**Symptom.** `Get-Disk` shows the iSCSI disk, but with `OperationalStatus Offline` and `PartitionStyle RAW`, or as `NoMedia`. `New-Partition` fails with *"The disk is offline"* or *"The disk is read-only"*.

**Likely cause.** Three possibilities, in order.
1. Windows brought the new iSCSI disk online in a **read-only** or **offline** state (this is deliberate behaviour for disks that appear to be snapshots).
2. The disk is genuinely a **new, uninitialised** disk, and the tester is attempting to mount it as if existing data were present.
3. The disk *did* contain data and a duplicate disk signature or a stale SAN policy made Windows hide it.

**Resolution.**
```powershell
$d = Get-Disk | Where-Object BusType -eq 'iSCSI'
$d | Select-Object Number, PartitionStyle, OperationalStatus, IsOffline, IsReadOnly
Set-Disk -Number $d.Number -IsOffline $false
Set-Disk -Number $d.Number -IsReadOnly $false
Update-HostStorageCache
# For a genuinely new LUN:
Initialize-Disk -Number $d.Number -PartitionStyle GPT
# Then check the SAN policy, which controls whether new disks are brought online automatically:
san -get  ;  # "OfflineShared" vs "OnlineAll"
```
**The trap: never run `Initialize-Disk -Number 1`.** Always resolve the disk by `BusType -eq 'iSCSI'` first. On a guest whose boot disk is disk 1, the numbered form destroys the operating system, and this is the one mistake in this section with an unrecoverable consequence.

#### T-09 Replication failures between the two domain controllers

**Symptom.** `repadmin /replsummary` shows a growing `largest delta` and non-zero `fails/total`; `dcdiag /test:replications` fails. Users created on one DC are invisible on the other; a password changed on one DC works on that DC and fails on the other.

**Likely cause and the error code that names it.**
- **Error 8524** — *The DSA operation is unable to proceed because of a DNS lookup failure.* The partner's SRV or host record is missing or wrong. Almost always caused by a DNS record that was deleted by hand, or by scavenging removing a record it should not have.
- **Error 1256** — *The remote system is not available.* RPC or DNS connectivity is blocked. Check `P-07` (RPC 135 and the dynamic range 49152–65535) and `P-31` (DNS zone transfer) in the port matrix, and the host firewall.
- **Error 8614** — *The replication operation encountered a database error.* Usually a lingering object after an unclean restore; needs `repadmin /removelingeringobjects`.
- **Errors 1864 / 2089** — *Replication has been stalled longer than the tombstone lifetime.* A genuinely serious condition requiring an authoritative restore or a DC rebuild.

**Resolution.**
```powershell
repadmin /showrepl * /csv > C:\FYP\config\repl-failures.csv
repadmin /replsummary
# DNS-side checks first, because 8524 is the most common cause
Resolve-DnsName -Name _ldap._tcp.dc._msdcs.vertexpeak.fyp.lab -Type SRV
Resolve-DnsName vpnz-dc02.vertexpeak.fyp.lab
nltest /dsgetdc:vertexpeak.fyp.lab /force
# Connectivity
Test-NetConnection vpnz-dc02 -Port 135
dcdiag /test:replications /v ; dcdiag /test:advertising /v
# Force the retry
repadmin /kcc ; repadmin /syncall /AdeP
```
Note the honest reading rule from §7.3.5: a fresh DC often reports one or two consecutive failures from the window between DNS registration and the first successful replication. Wait one 15-minute site-link interval and re-check before treating a non-zero count as a defect.

#### T-10 Autoenrolment completes but no certificate is issued

**Symptom.** `certutil -pulse` returns success `0x0`, yet `Get-ChildItem Cert:\LocalMachine\My` shows no certificate from `VP-ISSUING-CA-01`. Nothing obviously fails.

**Likely cause.**
1. The **template ACL was never granted** *Read + Enroll + Autoenroll*. This is the most common cause and it produces exactly this silent outcome.
2. The **template is not published** on the CA (`certutil -CATemplates` does not list it).
3. Autoenrolment is **not enabled by policy** at the right scope — the `AEPolicy` value exists but is linked to an OU the target is not in, or the target's group policy has not refreshed.
4. The target has no **read access to the CA's certificate and CRL**, so the request cannot complete the chain.

**Resolution.**
```powershell
certutil -CATemplates                      # is the template published?
certutil -template <TemplateName>          # inspect the template and its ACL
certutil -pulse -v                         # verbose: shows what was requested and what happened
Get-WinEvent -LogName 'Microsoft-Windows-CertificateServicesClient-Lifecycle-System/Operational' -MaxEvents 20
gpresult /scope:computer /v | Select-String -Pattern 'GPO-WS-Cert-AutoEnrol'
reg query 'HKLM\SOFTWARE\Policies\Microsoft\Cryptography\AutoEnrollment' /v AEPolicy
# On the CA, is the request even arriving?
certutil -view -restrict "Disposition=9" -out "RequestID,CommonName,DispositionMessage" csv   # pending
certutil -view -restrict "Disposition=30" -out "RequestID,CommonName,DispositionMessage" csv  # failed
```
`certutil -pulse -v` is the decisive tool: it reports the reason the client believes it has nothing to do, which distinguishes "no template applies to me" from "the request was refused".

#### T-11 The LUN is reachable from the wrong host — the allow-list does not appear to work

**Symptom.** An unexpected initiator can see and attach a LUN that the design intended for the platform tier only.

**Likely cause.** The allow-list is by **IP address**, not by IQN (§7.6.2). An initiator with an address inside the permitted set — for example a second guest accidentally given an address from `Z-DMZ` — is treated as an authorised initiator. There is also a simpler cause: a target created during experimentation was left with a wide or empty `InitiatorIds` list, which some configurations interpret permissively.

**Resolution.**
```powershell
Get-IscsiServerTarget | Select-Object TargetName, @{n='Initiators';e={$_.InitiatorIds -join '; '}}
Get-IscsiSession -TargetName <target>       # who is actually connected, from the target's view?
Get-IscsiConnection | Select-Object InitiatorPortalAddress, TargetPortalAddress
# Tighten: bind by IQN rather than by IP where the cmdlet surface allows it
Set-IscsiServerTarget -TargetName 'storage-lun01' -InitiatorId @('Iqn:iqn.2026-01.lab.fyp.vertexpeak:storage-lun01','IPAddress:10.10.90.21','IPAddress:10.10.90.22')
```
Cross-check with the trust-boundary table: TB-01 permits iSCSI 3260 to `vpnz-san01` **from the two platform VMs only**. A host outside that set reaching the LUN is a TB-01 violation and must be recorded as a finding with the topology corrected, not merely patched on the target.

#### T-12 The FSRM quota template applies but the auto-quota does not govern a new subfolder

**Symptom.** `Get-FsrmAutoQuota` shows the auto-quota on the share root as expected, but a newly created subfolder has no quota, or its quota usage is reported as free/unlimited.

**Likely cause.**
1. The auto-quota was created **after** the subfolder, and the pre-existing subfolder was not picked up. The behaviour of FSRM auto-quotas with respect to pre-existing subfolders is the specific item marked `[ASSUMPTION]` in §7.5.3 and must be established empirically.
2. The subfolder was created by a process that bypassed the share (for example from the server's own console), and the auto-quota's inheritance is evaluated on share-level operations.
3. A specific `New-FsrmQuota` object exists on the subfolder and overrides the auto-quota, which is correct behaviour but looks like a failure.

**Resolution.**
```powershell
Get-FsrmAutoQuota | Select-Object Path, Template, Disabled, Usage
Get-FsrmQuota -Path 'D:\Shares\Finance\<subfolder>'
# Empirical test — this IS the finding for the report:
#   (a) create a subfolder BEFORE defining the auto-quota, then check for a quota on it
#   (b) create a subfolder AFTER defining the auto-quota, then check for a quota on it
#   (c) record the difference, or the absence of a difference, as an experiment result
New-FsrmQuota -Path 'D:\Shares\Finance\<existing-subfolder>' -Template 'TMPL-Quota-Finance-20GB'
```
An experiment whose result contradicts the design assumption is legitimate academic content, and the baseline says so explicitly (risk R-03): record the discrepancy and move on.

#### T-13 A GPO is not applying to the hosts it is linked to

**Symptom.** A hardening setting is missing on a target host. `gpresult` shows the GPO as *Not Applied*, or shows it applied but the setting has no effect.

**Likely cause.** Five standard causes, in order of frequency.
1. **Wrong OU.** The computer object is in `CN=Computers` rather than in the intended OU, so no GPO linking to an OU beneath `OU=VertexPeak` reaches it. This is the specific reason baseline §9.2 forbids using the default containers.
2. **Security filtering** excludes the target (the target is not in the ACL, or is in a deny).
3. **WMI filter** fails to match.
4. **Inheritance blocked** on an intermediate OU, or a link disabled.
5. **A setting conflict** — a later-applied GPO wins, and the tested setting comes from one that lost. In this design the classic case is the DMZ baseline being overridden by the member-server baseline on a host that was moved between OUs.

**Resolution.**
```powershell
gpresult /scope:computer /v /h C:\FYP\config\gpresult-$(hostname).html
Get-ADComputer <name> -Properties DistinguishedName | Select-Object DistinguishedName, MemberOf
Get-GPInheritance -Target 'OU=MemberServers,OU=Servers,OU=Computers,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab'
Get-GPOReport -Name 'GPO-SRV-Member-Server-Baseline' -ReportType Html -Path C:\FYP\config\gpo-report.html
# Force and re-check, noting the exact time so the log correlates
gpupdate /force /boot /logoff
```
The narrative for the report should include one genuinely mis-linked GPO and its diagnosis, because Domain 6 rewards demonstrated troubleshooting, not a claim that everything worked first time.

#### T-14 A quota is being bypassed — users can write beyond the limit

**Symptom.** The FSRM console reports a share at 130 % of its quota, yet writes continue to succeed.

**Likely cause.**
1. The quota object on that path is a **soft** quota (`-SoftLimit:$true`), which records an event and permits the write. This is very easy to create by accident with the cmdlet.
2. The write is happening to a **different path** — most commonly `D:\Shares\...` directly on the server by someone with local access, which bypasses the SMB share but should still hit the quota; or to a folder that is not under a quota-governed path at all.
3. A **hard-link or sparse-file** behaviour inflates reported usage without consuming real space, making the percentage misleading.
4. The quota applies to the share root but the user writes to a **junction or mount point** that resolves elsewhere.

**Resolution.**
```powershell
Get-FsrmQuota -Path 'D:\Shares\Finance' | Select-Object Path, Size, SoftLimit, Usage, PeakUsage
Get-FsrmAutoQuota | Select-Object Path, Template, Usage
Get-FsrmQuotaTemplate -Name 'TMPL-Quota-Finance-20GB' | Select-Object Name, Size, SoftLimit
# Prove the hard limit actually denies a write with the QA-1 procedure of §7.5.6
```
The lesson worth recording: a quota that reports a percentage without denying the write is not a control, and the test that distinguishes them is the write test, not the console view.

#### T-15 A VPN client receives no address from the pool, or receives the same address as another client

**Symptom.** The tunnel establishes, the client has no `10.10.201.x` address (or an APIPA `169.254.x.x`), or two clients report the same pool address.

**Likely cause.**
1. The pool range was never set, or was set to a range that overlaps the LAN space. `Get-VpnServerIPAddressRange` will show it.
2. The pool is exhausted: 191 addresses (`10.10.201.10`–`10.10.201.200`) is ample for this lab, but an experimental script that opens many sessions can exhaust it, and because clients disconnect without a clean stop record the addresses may not be reclaimed promptly.
3. The client has a **stale connection profile with a static IP address** configured, which overrides the pool.
4. `rasdial` from a previous session left the adapter bound; a second connection reuses the stale adapter address.

**Resolution.**
```powershell
Get-VpnServerIPAddressRange
Get-RemoteAccessConnectionStatistics | Select-Object UserName, ClientIPAddress, Duration, TotalBytesIn
# Look for pool exhaustion
(Get-RemoteAccessConnectionStatistics).Count
# Client side: remove any static address from the profile and reconnect
Get-VpnConnection -Name 'VP-IKEv2-Cert' | Select-Object -ExpandProperty Routes
rasdial 'VP-IKEv2-Cert' /disconnect
Restart-Service RasMan -Force
```
Cross-check the pool against the baseline's exclusion rule: **no VPN pool may overlap `10.10.0.0/16`, `10.20.20.0/16` or `10.70.0.0/16`, and `172.16.0.0/16` must not be used.** An overlapping pool produces routing symptoms that look like a routing fault and are not.

---

### 7.13 Findings

This subsection is the template for recording what was **actually observed**, as distinct from what was designed. The topic sheet requires "findings"; the WSOS Domain 6 requires `The purpose of documenting the completion of the installation or up-grade` and `Prepare a technical document reflecting the solution in detail for agreement and sign-off`. An observation that contradicts the design is more valuable than one that confirms it, and both must be recorded in the same format.

#### 7.13.1 How to record a finding

Every finding uses the same six fields, so that a reader can compare findings across the whole report:

| Field | Content |
|---|---|
| **F-ID** | `F-L1-{nn}` — line L1, sequential |
| **Discovery point** | Which subsection, test case ID (`TC-L1-{nn}`), and date the observation was made |
| **Expected** | What the design predicted, stated as a measurable claim |
| **Observed** | What actually happened, stated as a measurement or an exact error, with the command that produced it |
| **Interpretation** | Why the difference exists, or an honest statement that the cause is not yet determined |
| **Action** | Corrected in the build / recorded as a limitation / deferred as future work / escalated to a baseline revision |

#### 7.13.2 Findings register (to be completed during the build)

| F-ID | Discovery point | Expected | Observed | Interpretation | Action |
|---|---|---|---|---|---|
| F-L1-01 | §7.5.6, `TC-L1-02` | A quota-exceeded write fails with an FSRM-naming error message | Client error was the generic `There is not enough space on the disk`; the FSRM attribution exists only in the server-side `SRMSVC` event | Quota enforcement surfaces to SMB clients as `ERROR_DISK_FULL`; the client cannot know the cause | Document the paired-evidence procedure (§7.5.6) as the required test method |
| F-L1-02 | §7.5.6, `TC-L1-02` | A screened file type produces a distinct, identifiable error | File-screen denial returned `Access is denied`, indistinguishable from an NTFS denial at the client | Both conditions map to `ERROR_ACCESS_DENIED` | Record the three-way discriminator (T-06) in the build manual as a standard diagnostic |
| F-L1-03 | §7.5.3, `TC-L1-02` | An auto-quota template governs every subfolder created under the share | *(to be measured — see T-12)* | *(to be determined empirically)* | Record the measured behaviour for the pinned FSRM version and correct §7.5.3 if it differs |
| F-L1-04 | §7.6.5, `TC-L1-03` | A LUN disappears during a target restart and re-attaches automatically afterwards | *(to be measured)* | *(to be determined)* | Record the exact recovery time and whether `L:` remounted without intervention |
| F-L1-05 | §7.6.2, `TC-L1-03` | The target IQN matches the baseline string `iqn.2026-01.lab.fyp.vertexpeak:storage-lun01` | Microsoft's iSCSI Target Server derives its own target IQN; the project string is used for the initiator | The IQN namespace is per-endpoint, so both are legitimate | Record which endpoint carries the baseline string, capture `Get-IscsiServerTarget`, and correct baseline §16 if the group takes Option 2 |
| F-L1-06 | §7.4.5, `TC-PKI-01` | Advertised certificate templates autoenrol without manual permission changes | `certutil -CATemplates` reported `Auto-Enroll: Access is denied.` on every template | This is the default CA state, not an error: autoenrolment rights live in the template ACL and in policy | Document the correct reading of this output (§7.4.5) to prevent misdiagnosis |
| F-L1-07 | §7.8.5, `TC-L1-05` | The IKEv2 tunnel restricts a remote user to exactly the subnets TB-01 and TB-11 permit | *(to be measured, including the negative tests)* | *(to be determined)* | Record each permitted and each denied destination with its TB row number |
| F-L1-08 | §7.7.3, `TC-L1-04` | RRAS does not perform NAT anywhere in the design | *(to be confirmed with `Get-NetNat`)* | *(to be confirmed)* | If any NAT object exists on `vpnz-rras01`, it must be removed and the finding recorded, because two translation points break the audit trail |
| F-L1-09 | §7.3.5, `TC-L1-01` | A freshly promoted DC replicates cleanly on the first attempt | `repadmin /showrepl` showed a small number of consecutive failures immediately after promotion | Expected transient state between DNS registration and the first replication cycle | Record the timestamp of the first clean replication, and record the elapsed time as a build-planning datum |
| F-L1-10 | §7.3.3, `TC-L1-01` | The baseline fixes a 15-minute site-link interval | *(to be confirmed, with the observed replication latency at that interval)* | *(to be determined)* | If the observed branch replication lag is unacceptable for the RODC test, propose a baseline revision rather than changing the value silently |
| F-L1-11 | §7.7.2, `TC-L1-04` | The `netsh routing ip` surface is available on the pinned build | *(to be determined)* | *(to be determined)* | Record which mechanism was actually used and remove the other from the build manual, or label it clearly as unavailable |
| F-L1-12 | §7.5.4, `TC-L1-02` | Blocking high-risk extensions measurably reduces their presence on the shares | Run passive screening on `D:\Shares\Public` for one week and count what *would* have been blocked | *(to be determined from the count)* | Record the number. A measured occurrence rate converts a policy decision into a finding with evidence |
| F-L1-13 | §7.5.5, `TC-L1-02` | The duplicate-files report identifies waste worth reclaiming | *(to be measured)* | *(to be determined)* | If duplicate content is a meaningful fraction of the quota, propose a deduplication or a per-project folder redesign as future work |
| F-L1-14 | §7.3.6, `TC-L1-01` | Every hardening setting applies to the intended OU and no other | *(to be confirmed with `gpresult` per OU, including the negative cases)* | *(to be determined)* | Record the negative results (a GPO that correctly did **not** apply) as well as the positive ones |
| F-L1-15 | §7.9.3 | Windows event data reaches the monitoring stack | *(to be confirmed via the WEC subscription and the collector's `ForwardedEvents` log)* | Windows is not a syslog sender; the path is WinRM 5986 | Document the two distinct ingestion paths explicitly so no topology diagram implies otherwise |

#### 7.13.3 Findings that are explicitly required to be recorded, whether or not they are flattering

The baseline's own discipline (`13.4` R-06 and `19` rule 3) requires the following to appear as findings if they occur, and they are listed here so that they are not quietly omitted under schedule pressure:

- **Any version that differs from §7 of the baseline.** The actual output of `Get-ComputerInfo`, `$PSVersionTable`, `certutil -cainfo`, `Get-VpnAuthProtocol` and every other version-printing command must be captured, and each difference from the pinned value listed in a "version deviations" subsection with its impact. Documenting a version that does not match the running system is a reportable integrity failure.
- **Any `[ASSUMPTION]` from this section that proved wrong.** The specific ones most likely to fail are: the `-ForestMode 'Win2025'` value, the `New-FsrmQuotaTemplate -Threshold` parameter form, the `New-FsrmScheduledTask` parameter names, the `Set-VpnServerIPsecConfiguration -EncryptionType MaximumEncryption` value, and the NPS cmdlet surface. Each must be marked as corrected, with the corrected form recorded in the baseline as a revision.
- **Any test that could not be performed at all**, with the reason. "Could not be tested because the hypervisor could not reach VLAN 113 (`RODC` second NIC)" is an acceptable and useful finding; a silently missing test is not.
- **Any deliberate deviation from the baseline**, with the decision-log entry that authorised it and the supervisor's awareness where the deviation touches §16 of the baseline.
- **The DMZ domain-join decision (baseline open item O-05)** and its security consequence, whichever way it was decided, since §7.3.6 G-5 depends entirely on it.
- **The single-tier versus two-tier PKI decision (baseline open item O-06)**, stated explicitly in this section's narrative, with the trade-off described and not merely listed.
