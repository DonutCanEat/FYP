## 8. Linux Server Administration

Line owner: **W2 — Linux & Services**. Reference standard: WorldSkills Occupational Standards 2026, *IT Network Systems Administration* (Skill 2447, WorldSkills Shanghai 2026), cited throughout this chapter by domain and by verbatim requirement line, as recorded in the project's verified extraction (`research/wsos-2026-2447.md`).

### 8.1 Overview and Objectives

The official topic sheet names this line *"Linux Server Administrations (e.g., Nginx, Keepalived, nftables, OpenVPN/Wireguard, etc.)"*. This chapter is the practical manual for that entire line: it is written so that a competent reader with the design baseline in hand can build, verify and troubleshoot every Linux component in the estate without further research.

#### 8.1.1 What this line delivers

| Deliverable | Implemented by | Primary brief technology |
|---|---|---|
| DMZ reverse proxy with TLS termination and health-checked upstreams | `vpnz-dmzrev01`, `vpnz-dmzrev02` | Nginx |
| WordPress content nodes (Nginx + PHP-FPM + MariaDB) behind the proxy | `vpnz-dmzwp01`, `vpnz-dmzwp02` | Nginx, MariaDB |
| Floating default-gateway VIP for the DMZ web tier | `vpnz-dmzrev01` / `vpnz-dmzrev02` (`vrid 61`, VIP `10.10.90.10`) | Keepalived |
| Stateful egress firewall, NAT/DNAT chokepoint and logging | `vpnz-nft01`, `vpnz-nft02` (`vrid 51`, VIP `10.10.50.10`) | nftables, Keepalived |
| Second, independently implemented remote-access VPN | `vpnz-lnxra01` | OpenVPN, Easy-RSA |
| Site-to-site and remote-worker tunnel to Wan Chai | `vpnz-nft01/02` ↔ `vpnz-wcwg01` or staff clients | WireGuard |
| DMZ management path | `vpnz-dmzjump01` | SSH, hardened host |
| Linux host-hardening baseline, time, DNS, backup and logging for the whole Linux estate | all ten Ubuntu guests | Bash scripting, rsync, systemd |

The Linux estate consists of ten Ubuntu Server 24.04.3 LTS guests cloned from the template `UBU2404-TEMPLATE-01`: `vpnz-dmzrev01`, `vpnz-dmzrev02`, `vpnz-dmzwp01`, `vpnz-dmzwp02`, `vpnz-dmzjump01`, `vpnz-nft01`, `vpnz-nft02`, `vpnz-lnxra01`, `vpnz-mon01` and `vpnz-ai01`. `vpnz-mon01` and `vpnz-ai01` also serve the automation and AI lines; this chapter covers their operating-system layer only, and their application roles are owned by other chapters.

#### 8.1.2 Which WSOS 2026 domains this line develops

Domain **4 Network and System Operations (25%)** is the primary beneficiary of this chapter, and the correspondence is unusually direct because the standard names the technology. The verbatim requirement lines most relevant here are:

- `Install and manage web hosting services using modern web servers e.g. Apache, Nginx and IIS.` (Domain 4, *shall be able to*, line 12) — this names **Nginx** explicitly, so the reverse proxy and the WordPress nodes are directly citable.
- `Install and manage IT infrastructure resources monitoring systems` with nested examples `Icinga2`, `Nagios`, `Cacti`, `Windows Resource Monitor` (Domain 4, line 8) — the project uses Prometheus, Grafana and Loki instead, and this chapter states that substitution plainly rather than implying the nested products are used.
- `Install and manage backup systems` with nested examples `Windows Server Backup`, `rsync`, `Script based backup, e.g. Bash, Batch or PowerShell` (Domain 4, line 14) — the Linux estate uses **rsync** and **Bash script-based backup**, both named; see §8.9.
- `Setup public key infrastructure services` with nested examples `Active Directory Certificate Services`, `OpenSSL` (Domain 4, line 10) — the Linux side uses **Easy-RSA**, which is a front end over OpenSSL. The project must state that it drives OpenSSL through Easy-RSA rather than scripting `openssl` directly.
- `Manage file systems` with nested examples `Software RAID`, `mdadm`, `LVM/Dynamic disks`, `File systems such as NTFS, ReFS, EXT4 and NTFS.` (Domain 4, line 16) — the Ubuntu guests are built on **LVM on EXT4**, which is citable; `mdadm` software RAID is exercised only as a documented demonstration, not as a production volume, and that limit is stated in §8.2.
- `Install and manage network time services` and `Install and manage domain name services (Windows DNS, BIND)` (Domain 4, lines 5 and 2) — implemented on Linux as a **chrony** client and a **systemd-resolved/`resolv.conf`** client of the Windows DNS servers; the project does **not** run BIND, and says so.
- `Install and manage remote network access services` with nested examples `SSH`, `Remote Desktop Services` (Domain 4, line 6) and `Install and manage terminal access services` with nested examples `SSH`, `Remote Desktop Services`, `Telnet` (Domain 4, line 13) — SSH administration of the whole Linux estate is the implementation here; `Telnet` is deliberately not deployed.

Three further bridges are used in this chapter, and every one of them is an **inference from a named line, not a quotation**:

1. **Keepalived → VRRP.** The standard contains no occurrence of the string `Keepalived` (0 occurrences in the 2026 text and in the raw HTML). It does contain `Provide network load balancing & fault tolerance at routing and switching levels by using GLBP, HSRP, VRRP, LACP, PAgP, etc.` (Domain 3, line 4). Keepalived *implements* VRRP, which is the named protocol, so the bridge is strong — but it is presented as a bridge to a named protocol, never as "the standard requires Keepalived".
2. **nftables → control- and data-plane security.** `nftables` is likewise absent (0 occurrences). The bridge is `Apply basic security configuration for control and data plane` (Domain 3, line 5), supported by `Common types of attacks on network protocols and mitigation methods` and `Security protocols to secure local and wide area networks` (Domain 3, know/understand, lines 10 and 6).
3. **WireGuard → the VPN line's `etc.`** `Provide network connectivity between remote branches using VPN technologies such as IPSec, SSL VPN, Direct Access, OpenVPN, DMVPN, GRE, etc.` (Domain 3, line 6). **OpenVPN is named in that line; WireGuard is not, and only the trailing `etc.` covers it.** This is the weakest of the three bridges and is labelled as such wherever WireGuard is discussed in this project.

Domain **6 Troubleshooting (25%)** is served by §8.12, which is a deliberately full failure-mode catalogue, and by §8.3.6, §8.4.5, §8.5.6 and §8.6.6, each of which is a verification procedure rather than a narrative. Domain **5 Infrastructure Automation (15%)** is served indirectly: every configuration file in this chapter is applied by an Ansible playbook from `vpnz-mon01` (`03-nginx-reverseproxy.yml`, `04-keepalived.yml`, `05-nftables-egress.yml`, `06-wireguard.yml`) and every shell procedure is implemented as a Bash script in `04-automation/bash`, both of which are named in the standard (`Identify and implement infrastructure as code` → `Ansible.`; `Setup and run routine infrastructure maintenance operations using various scripting\programming languages` → `Bash`).

**Honesty note that must survive into the final report.** The WSOS 2026 contains no requirement for screen captures (`screen`, `capture`, `screenshot` and `evidence` are 0 occurrences in the standard). Every screenshot demanded in §8.11 is required by the **HDTN topic sheet**, which requires documentation containing *"all findings, manuals, steps, screen captures, verifications, and references"*. This chapter never attributes the capture checklist to WorldSkills.

### 8.2 Base Server Build and Standardisation

#### 8.2.1 Operating system and installation choices

The pinned platform is **Ubuntu Server 24.04.3 LTS (Noble Numbat)**, with the fallback being the latest 24.04.x point release or Debian 13 if the group prefers it. Nothing in the design depends on Ubuntu-specific behaviour except package versions, which is exactly why those versions are pinned elsewhere in the baseline and re-verified here at build time.

Installation choices, applied identically to every guest:

| Choice | Value | Rationale |
|---|---|---|
| Image | `ubuntu-24.04.3-live-server-amd64.iso`, obtained from the official Ubuntu archive | One image for all ten guests; no third-party mirrors |
| Installer | Subiquity, non-interactive where possible using the autoinstall data on the template | Reproducibility; the template is built once and cloned |
| Language/locale | `en_US.UTF-8`, keyboard `us` | Matches the report language and avoids console escapes in logs |
| Time zone | `Asia/Hong_Kong` (`HKT`, UTC+08:00) | Hong Kong site; UTC is retained internally by `systemd-timesyncd`/`chrony` |
| Filesystem | LVM on EXT4, no encryption | EXT4 is a named WSOS file system; LVM allows the volume growth described in §8.2.3. LUKS is deliberately **not** used because the hypervisor host is the trust boundary and an unattended boot would need a key on disk, which is worse than no encryption. `[ASSUMPTION]` this trade-off is acceptable in a single-host lab; it must be stated in the report |
| Optional packages | OpenSSH server **only** | "Install third-party drivers" is unchecked; no snaps beyond the base (`snapd` may be removed on guests that do not need it) |
| Admin user | `fypadmin`, SSH public-key authentication only, member of the local group `gg-infra-admins` | Per the baseline: the Linux sudo group mirrors the Windows `GG-Infra-Admins` group, and administrators log in with personal accounts, never `root` and never a shared account |
| cloud-init | Present (the template is provisioned from cloud-init) but **disabled after first boot** | Ansible must own subsequent configuration; if cloud-init stays enabled it re-applies network and user state on every boot and the two systems fight. The failure must not be misattributed to Ansible |
| IPv6 | Disabled at the kernel and netplan level | The design is IPv4-only; IPv6 is out of scope |

#### 8.2.2 Partitioning scheme

Every guest uses the same single-disk layout, which is what makes a 40 GB DMZ guest and a 100 GB monitoring guest differ only in the size of the root logical volume.

```text
Disk /dev/sda: 40 GiB (typical DMZ guest)
  sda1   2 MiB        EFI System Partition (FAT32)      -> /boot/efi
  sda2   1 GiB        /boot (ext4)
  sda3   rest         LVM physical volume (pv.1)
      └── ubuntu-vg            (LVM volume group, whole of sda3)
            ├── ubuntu-lv      ext4, root filesystem   -> /
            └── swap_1         swap
```

| Host | Root LV size | Swap | Justification |
|---|---|---|---|
| `vpnz-dmzrev01/02` | 36 GiB | 2 GiB | Nginx, TLS material, logs |
| `vpnz-dmzwp01/02` | 38 GiB | 2 GiB | WordPress uploads and a local MariaDB data directory |
| `vpnz-nft01/02` | 36 GiB | 2 GiB | Rulesets, packet logs, keepalived state files |
| `vpnz-lnxra01` | 36 GiB | 2 GiB | Easy-RSA PKI; the CRL and issued certificates grow slowly |
| `vpnz-dmzjump01` | 56 GiB | 2 GiB | It is also the Linux-side backup repository (`/srv/backup/`) |
| `vpnz-mon01` | 92 GiB | 4 GiB | Prometheus TSDB, Loki chunks, Git repositories, TFTP/SCP archive |
| `vpnz-ai01` | 56 GiB | 2 GiB | Agent logs, proposals, collector output |

Swap is deliberately small because swap on a thin-provisioned disk on one host is not a safety net; it exists to let `systemd` journal a memory spike without an OOM kill. Resizing is done with LVM while online:

```bash
# On vpnz-mon01, when the Prometheus TSDB outgrows its logical volume
sudo lvextend -L +20G /dev/ubuntu-vg/ubuntu-lv
sudo resize2fs /dev/ubuntu-vg/ubuntu-lv
df -h /    # verify the new size before continuing
```

`mdadm` software RAID is a named WSOS technology but is **not** part of the delivered design: all ten guests are single-disk, and the hypervisor host is a single point of failure by construction. A software-RAID demonstration volume on one spare guest is permitted as an *experiment* and must be labelled as a demonstration, not as a redundancy feature of the design.

#### 8.2.3 Interface naming and address discovery

Linux network interface names are **never hard-coded** in this project. The name must be read from the machine before writing netplan:

```bash
ip -br link
ls /sys/class/net
```

Expected output on a two-NIC guest such as `vpnz-nft01`:

```text
lo               UNKNOWN        00:00:00:00:00:00 <LOOPBACK,UP,LOWER_UP>
ens192           UP             00:50:56:3f:01:01 <BROADCAST,MULTICAST,UP,LOWER_UP>
ens224           UP             00:50:56:3f:01:02 <BROADCAST,MULTICAST,UP,LOWER_UP>
```

`ens192`/`ens224` are the **expected** names, but the baseline requires the actual names to be recorded. Every YAML below therefore carries a one-line comment telling the builder to confirm the name first. Because each "VLAN" is a separate hypervisor host-only network rather than an 802.1Q tag, one NIC corresponds to exactly one subnet and no VLAN sub-interface configuration exists on any Linux guest. This is a design approximation and is documented as such: the **segmentation outcome** is real, the **mechanism** is emulated.

#### 8.2.4 Netplan static configuration

`/etc/netplan/50-cloud-init.yaml` is the canonical file (mode `0600`, `root:root`). Two complete examples follow because the two hosts have genuinely different roles.

**Example 1 — `vpnz-nft01`, the dual-homed egress firewall.** Two interfaces: one facing `Z-EGRESS` (`VNET-EGRESS`, 10.10.50.0/28 transit) and one facing the tunnel/WAN emulation segment (`VNET-WAN`, 10.10.200.0/24). No default route is installed on the egress side; the default route points through the ASA inside interface at `10.10.50.2`, because the nftables pair sits inline between the core and the ASA and this VM is the last internal hop before the perimeter firewall.

```yaml
# /etc/netplan/50-cloud-init.yaml  —  vpnz-nft01  (nftables egress firewall, vrid 51, MASTER)
# Confirm interface names with `ip -br link` first; ens192/ens224 are expected, not guaranteed.
network:
  version: 2
  renderer: networkd
  ethernets:
    ens192:                                     # VNET-EGRESS -> Z-EGRESS (10.10.50.0/28 transit)
      dhcp4: false
      dhcp6: false
      accept-ra: false
      addresses:
        - 10.10.50.11/28                        # physical address of vpnz-nft01
      routes:
        - to: 10.10.0.0/16                      # all HQ private space is behind the core
          via: 10.10.50.1                       # VP-HQ-CORE-01 gi0/1.50
          on-link: false
        - to: 10.20.0.0/16                      # management space (Z-MGMT) is routed, never bridged
          via: 10.10.50.1
        - to: 10.70.0.0/16                      # isolated lab space, deliberately reachable by route only
          via: 10.10.50.1
        - to: default                            # everything else goes outward through the ASA inside
          via: 10.10.50.2                       # VP-HQ-FW-01 inside interface
      nameservers:
        addresses: [10.10.30.11, 10.10.30.12]   # the only resolvers permitted on a Linux guest
        search: [vertexpeak.fyp.lab]
    ens224:                                     # VNET-WAN -> transport segment (10.10.200.0/24)
      dhcp4: false
      dhcp6: false
      accept-ra: false
      addresses:
        - 10.10.200.2/24                        # Rev 1.1 ruling C-07: the node's own transport address
                                                # (vpnz-nft02 carries 10.10.200.3/24 on the same NIC role)
      # NOTE: this physical address is NOT the tunnel address. 10.10.200.0/24 carries both the
      # WireGuard TUNNEL network, and 10.10.200.1/24 belongs to the wg0 interface that floats
      # with the keepalived VIP (see §8.7.3), so the prefix is shared by two different objects:
      # the node's own transport address here, and the tunnel address on wg0. That is not a
      # duplicate owner because they are different addresses; it would only become a conflict
      # if the pair forwarded traffic into the rest of 10.10.200.0/24, which the design never does.
      # [RESOLVED by Rev 1.1 ruling C-07] The baseline fixes the tunnel addressing (10.10.200.1/24 floating with the
      # VIP, 10.10.200.5/24 on the Wan Chai peer, 10.10.200.64/26 for remote workers,
      # 10.10.200.200/32 and 10.10.200.201/32 for the management escape hatch), it fixes
      # VNET-WAN as the 10.10.200.0/24 emulation segment, and Rev 1.1 ruling C-07 also fixes the
      # physical address of each node's second NIC: 10.10.200.2 for vpnz-nft01 and 10.10.200.3 for
      # vpnz-nft02, inside 10.10.200.0/24 and not .1, not .5 and not inside .64/26.
      # The build must not re-open this: 10.10.200.2 is the value for vpnz-nft01 and 10.10.200.3 is the value for
      # vpnz-nft02 (the same NIC role on the second node of the pair), and the tunnel address stays 10.10.200.1 on wg0.
      routes:
        - to: 203.0.113.0/24                    # simulated provider / tunnel peer space
          via: 10.10.50.2
```

**Example 2 — `vpnz-dmzrev01`, the DMZ reverse proxy.** Two interfaces per the inventory (`VNET-DMZ` + `VNET-CORE`), but the *service* interface is the DMZ one, and the default gateway is the ASA DMZ interface at `10.10.90.1`.

```yaml
# /etc/netplan/50-cloud-init.yaml  —  vpnz-dmzrev01  (Nginx reverse proxy, vrid 61, MASTER)
network:
  version: 2
  renderer: networkd
  ethernets:
    ens192:                                     # VNET-DMZ -> Z-DMZ (10.10.90.0/24)
      dhcp4: false
      dhcp6: false
      accept-ra: false
      addresses:
        - 10.10.90.28/24                        # host address of vpnz-dmzrev01. 10.10.90.10 is the keepalived
                                                # VIP (see §8.4) and is owned by no node, so the VIP is
                                                # reserved and floating, never a node address
      routes:
        - to: default
          via: 10.10.90.1                       # VP-HQ-FW-01 ASA dmz interface
      nameservers:
        addresses: [10.10.30.11, 10.10.30.12]
        search: [vertexpeak.fyp.lab]
    ens224:                                     # VNET-CORE -> entry VLAN for management reachability only
      dhcp4: false
      dhcp6: false
      addresses:
        - 10.10.10.28/24                        # Rev 1.1 ruling C-07: address inside VLAN 10 LAN-HQ-CORE; the
                                                # baseline places the proxy pair on VLAN 10 as well as the
                                                # DMZ. It is not a policy bypass: TB-04 is still enforced at the ASA and at the nftables pair,
                                                # the default gateway is still 10.10.90.1, and it is used only for management reachability and
                                                # carries no published traffic. State this sentence in the design narrative.
```

The application of netplan is a two-step, risk-managed operation because a bad netplan file locks out a remote SSH session:

```bash
sudo chmod 600 /etc/netplan/50-cloud-init.yaml   # netplan warns (and may refuse) on world-readable files
sudo netplan generate                            # render to systemd-networkd units without applying
sudo netplan try                                 # apply with a 120-second automatic rollback
# If the session survives, type Enter at the prompt; netplan commits and reports "Configuration accepted."
ip -br a                                         # verify both addresses and both flags UP
ip route show                                    # verify the default route points where you intend
```

#### 8.2.5 Hostname and hosts-file convention

Hostnames are the canonical lower-case strings from the design baseline: `vpnz-dmzrev01`, `vpnz-nft02`, `vpnz-lnxra01` and so on — RFC 1123 syntax, lower case, no underscores, never abbreviated, never re-capitalised.

```bash
sudo hostnamectl set-hostname vpnz-nft01
hostnamectl status | grep -E 'Static hostname|Operating System|Kernel'
```

Expected:

```text
    Static hostname: vpnz-nft01
  Operating System: Ubuntu 24.04.3 LTS
            Kernel: Linux 6.8.0-xx-generic
```

`/etc/hosts` is standardised so that every guest can resolve itself and its immediate peers even with DNS unavailable — which matters for `sudo` performance and for `systemd` unit start ordering:

```text
127.0.0.1       localhost
127.0.1.1       vpnz-nft01.vertexpeak.fyp.lab vpnz-nft01

# --- project static hosts (subset; full table is the design baseline's static host address table) ---
10.10.30.11     vpnz-dc01.vertexpeak.fyp.lab    vpnz-dc01
10.10.30.12     vpnz-dc02.vertexpeak.fyp.lab    vpnz-dc02
10.10.30.31     vpnz-mon01.vertexpeak.fyp.lab   vpnz-mon01
10.10.30.42     vpnz-lnxra01.vertexpeak.fyp.lab vpnz-lnxra01
10.10.50.10     keepalived-hq                   vpn.vertexpeak.fyp.lab wg.vertexpeak.fyp.lab
10.10.50.11     vpnz-nft01.vertexpeak.fyp.lab   vpnz-nft01
10.10.50.12     vpnz-nft02.vertexpeak.fyp.lab   vpnz-nft02
10.10.90.10     portal.vertexpeak.fyp.lab       www.vertexpeak.fyp.lab blog.vertexpeak.fyp.lab
10.10.90.10     keepalived-hq-web               # the nginx VRRP VIP, owned by no node
10.10.90.28     vpnz-dmzrev01.vertexpeak.fyp.lab vpnz-dmzrev01
10.10.90.29     vpnz-dmzrev02.vertexpeak.fyp.lab vpnz-dmzrev02

# --- IPv6 ---
::1             localhost ip6-localhost ip6-loopback
ff02::1         ip6-allnodes
ff02::2         ip6-allrouters
```

#### 8.2.6 SSH hardening

The hardening directives live in a drop-in file, `/etc/ssh/sshd_config.d/10-fyp-hardening.conf` (mode `0644`), so that the distro's own `/etc/ssh/sshd_config` is not forked and can still receive package updates. On Ubuntu 24.04 OpenSSH reads `Include /etc/ssh/sshd_config.d/*.conf` at the **top** of the main file, so first-obtained value wins — which is exactly why the hardening file must be named `10-` and why the builder must check for a competing `50-cloud-init.conf` that enables password authentication.

```ini
# /etc/ssh/sshd_config.d/10-fyp-hardening.conf
# Vertex Peak FYP — Linux SSH baseline. Applied by 01-hardening-baseline.sh / 02-baseline-linux.yml
# Verify it is actually in force with:  sudo sshd -T | grep -E 'port|permitrootlogin|passwordauthentication'

Port 22
AddressFamily inet
ListenAddress 0.0.0.0

# --- authentication ---
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
PermitEmptyPasswords no
AuthenticationMethods publickey
MaxAuthTries 3
MaxSessions 4
LoginGraceTime 30

# --- access restriction (belt and braces with nftables) ---
AllowGroups gg-infra-admins
DenyUsers root

# --- session and forwarding hardening ---
X11Forwarding no
AllowAgentForwarding no
AllowTcpForwarding no
PermitTunnel no
GatewayPorts no
PermitUserEnvironment no

# --- protocol hygiene ---
HostbasedAuthentication no
IgnoreRhosts yes
UseDNS no
ClientAliveInterval 300
ClientAliveCountMax 2
LogLevel VERBOSE
Banner none
Subsystem sftp internal-sftp
```

Notes on two deliberate decisions that the report must state rather than imply:

- **`AllowGroups gg-infra-admins` not `AllowUsers`.** The baseline's contract lists `AllowGroups gg-infra-admins` as the directive for this path. An `AllowUsers` list naming the four personal accounts would be equally valid and is arguably tighter, but it does not survive the arrival of a fifth administrator without an edit on every host. The group is a **local** group whose membership mirrors the Windows `GG-Infra-Admins` group, and the membership is exactly the same four named administrators either way. `[ASSUMPTION]` if the group chooses to domain-join the Linux guests with `realmd`/`sssd`, the local group becomes a mapped group and this directive is unchanged.
- **`AllowTcpForwarding no` on general-purpose guests**, with a documented per-host exception on `vpnz-dmzjump01`, which is *by design* a proxy host and therefore needs forwarding enabled in its own drop-in. That exception belongs in the jump host's runbook, not in the standard basline file.

Key management: SSH keys are **Ed25519**, generated once per administrator, with the public half stored in the Ansible repository under `files/ssh/authorized_keys/`. Private keys are never stored on `vpnz-mon01`.

```bash
# One-off, on the administrator's own machine, never on a lab guest:
ssh-keygen -t ed25519 -a 100 -C "adm-xx@vertexpeak.fyp.lab" -f ~/.ssh/id_ed25519_vpnz
ssh-copy-id -i ~/.ssh/id_ed25519_vpnz.pub fypadmin@10.10.50.11
ssh -i ~/.ssh/id_ed25519_vpnz -o PreferredAuthentications=publickey fypadmin@10.10.50.11 'id; uptime'
```

Verification that the hardening is actually in force (configuration files can be correct and unused):

```bash
sudo sshd -T | grep -Ei '^port|permitrootlogin|passwordauthentication|kbdinteractive|allowgroups|permitemptypasswords|logingracetime'
```

Expected output:

```text
port 22
permitrootlogin no
passwordauthentication no
kbdinteractiveauthentication no
permitemptypasswords no
allowgroups gg-infra-admins
logingracetime 30
```

A password login must then fail visibly — this is one of the §8.11 evidence items:

```bash
ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no fypadmin@10.10.50.11
# expected: Permission denied (publickey).
```

#### 8.2.7 Sudo policy

Sudo is restricted to the `gg-infra-admins` group, always prompts for a password, and logs to a dedicated file that the monitoring and AI lines consume.

```bash
# /etc/sudoers.d/10-fyp-admins   (mode 0440, validated with visudo -c)
%gg-infra-admins ALL=(ALL:ALL) ALL
Defaults:%gg-infra-admins  timestamp_timeout=5, passwd_tries=3, logfile="/var/log/fyp/sudo.log", log_input, log_output
Defaults  use_pty
Defaults  env_reset, secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
```

```bash
sudo visudo -c -f /etc/sudoers.d/10-fyp-admins      # must print "parsed OK"
sudo mkdir -p /var/log/fyp && sudo chmod 0750 /var/log/fyp && sudo chown root:adm /var/log/fyp
```

`log_input` and `log_output` are enabled so that an administrative session's commands and output are recoverable — this is the Linux analogue of the Windows PowerShell transcription and script-block logging that the due-diligence questionnaire in the scenario narrative demands, and it is the audit trail the AI line's `auth-failure-report` skill reads alongside journald.

#### 8.2.8 Unattended security updates

```ini
# /etc/apt/apt.conf.d/20auto-upgrades
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
```

```ini
# /etc/apt/apt.conf.d/52-fyp-unattended.conf
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::Package-Blacklist {
    "nginx";
    "keepalived";
    "nftables";
    "openvpn";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Mail "";
```

Two deliberate choices. **Security origins only**, never `-updates`, so that a feature change cannot silently alter `nginx.conf` semantics mid-build. **Package blacklist** for the four services whose configuration this project pins: `nginx` (1.24.0), `keepalived` (2.2.8), `nftables` (1.0.9) and `openvpn` (2.6.x) are upgraded only through a planned, snapshotted, verified change, because a silent version change would invalidate the version-deviation subsection that the baseline's pinning discipline requires. **`Automatic-Reboot "false"`** because a lab VM rebooting itself in the middle of an evidence capture destroys a test run; the kernel-update flag file is reported by monitoring instead.

```bash
sudo systemctl enable --now unattended-upgrades
systemctl status unattended-upgrades --no-pager | head -5
sudo unattended-upgrade --dry-run --debug 2>&1 | tail -20     # see what it would do, change nothing
sudo cat /var/run/reboot-required 2>/dev/null || echo "no reboot pending"
```

#### 8.2.9 Time synchronisation

`chrony` is the client on every Ubuntu guest. `vpnz-dc01` is the authoritative NTP source for the forest and synchronises to the simulated provider resolver (`192.0.2.53`); all Linux machines synchronise to `10.10.30.11` with `10.10.30.12` as the second source. **Time skew greater than five minutes breaks Kerberos**, which is one of the documented troubleshooting scenarios in §8.12.

```ini
# /etc/chrony/chrony.conf  (project additions; the distro's default pool lines are removed)
# Vertex Peak FYP — Linux time.  Windows DCs are the authoritative sources.
server 10.10.30.11 iburst prefer
server 10.10.30.12 iburst

# Do not step the clock for small offsets; slew instead, so running services are not disturbed.
makestep 1.0 3

# Serve time to the isolated lab segment only if the lab relay needs it (not enabled by default).
# allow 10.70.0.0/24

driftfile /var/lib/chrony/chrony.drift
rtcsync
logdir /var/log/chrony
log measurements statistics tracking
```

```bash
sudo systemctl restart chrony
chronyc tracking          # "System time" offset must be well under 1 second
chronyc sources -v        # both 10.10.30.11 and 10.10.30.12 should show a '*' or '+' state
timedatectl               # "System clock synchronized: yes", "NTP service: active"
```

Expected `chronyc tracking` output on `vpnz-nft01`:

```text
Reference ID    : 0A0A1E0B (10.10.30.11)
Stratum         : 2
Ref time (UTC)  : Tue Oct 06 02:14:07 2026
System time     : 0.000031427 seconds fast of NTP time
Last offset     : +0.000021882 seconds
RMS offset      : 0.000047382 seconds
Frequency       : 4.603 ppm fast
Residual freq   : +0.002 ppm
Skew            : 0.016 ppm
Root delay      : 0.000612827 seconds
Root dispersion : 0.000214573 seconds
Update interval : 64.2 seconds
Leap status     : Normal
```

#### 8.2.10 The repeatable baseline checklist

This list is the gate between "a cloned VM" and "a guest that may be given a role". It is executed by `04-automation/bash/01-hardening-baseline.sh` and idempotently enforced by `ansible/playbooks/02-baseline-linux.yml`. Each line has a verification command; a build is not complete until every line has been observed on the host itself.

| # | Check | Command | Pass condition |
|---|---|---|---|
| B-01 | DHCP is off, addressing is static | `ip -br a` | Expected addresses only, no `dynamic` flag |
| B-02 | Default route correct for the role | `ip route show default` | Matches §8.2.4 for the host's role |
| B-03 | Hostname canonical | `hostnamectl --static` | Exact baseline hostname |
| B-04 | DNS resolvers are the two DCs only | `resolvectl status \| grep -A2 'DNS Servers'` | `10.10.30.11`, `10.10.30.12`, nothing else |
| B-05 | No public resolver configured | `grep -r nameserver /etc/resolv.conf` | Only the two DC addresses |
| B-06 | Time synchronised | `chronyc tracking` | Offset < 1 s, Leap status `Normal` |
| B-07 | SSH hardening live | `sudo sshd -T \| grep permitrootlogin` | `permitrootlogin no` |
| B-08 | Password auth refused | `ssh -o PreferredAuthentications=password ...` | `Permission denied (publickey).` |
| B-09 | Sudo group in force | `getent group gg-infra-admins` | Exactly the four named administrators |
| B-10 | Sudoers syntax valid | `sudo visudo -c` | `parsed OK` |
| B-11 | Unattended upgrades enabled | `systemctl is-enabled unattended-upgrades` | `enabled` |
| B-12 | Kernel hardening applied | `sysctl net.ipv4.conf.all.rp_filter net.ipv4.tcp_syncookies` | `1` and `1` |
| B-13 | Interfaces exposed | `sudo ss -tulpn` | Only the ports this host's role needs |
| B-14 | No unused listening service | `systemctl --type=service --state=running` | Matches the role's allow-list (§8.8) |
| B-15 | AppArmor enabled | `sudo aa-status --enabled && echo OK` | `OK` |
| B-16 | auditd rules loaded | `sudo auditctl -l \| wc -l` | Rule count matches §8.8 |
| B-17 | Syslog forwarding works | `logger -p local5.info "fyp-baseline-test-$(hostname)"` then check `10.10.30.31` | Line appears in `/var/log/remote/{host}.log` |
| B-18 | node_exporter reachable | `curl -s http://localhost:9100/metrics \| head -3` | Metrics text returned |
| B-19 | Version evidence captured | `dpkg -l \| egrep 'nginx\|keepalived\|nftables\|openvpn\|wireguard-tools'` | Matches or documents deviation from the pinning list |
| B-20 | Snapshot taken before any role configuration | hypervisor snapshot list | Snapshot named `pre-role-{role}-{date}` exists |

### 8.3 Nginx Web Tier

#### 8.3.1 Design

The web tier has two distinct roles, and conflating them is the most common design error in this kind of build.

**Role A — DMZ reverse proxy and TLS terminator.** `vpnz-dmzrev01` and `vpnz-dmzrev02` are the *only* DMZ hosts published to the Internet. They listen on TCP 80 (redirect only) and TCP 443 on the floating VIP `10.10.90.10`, terminate TLS with certificates issued by the internal PKI, and re-encrypt to the application tiers. Because they re-encrypt, TLS runs **end to end** between client, proxy and origin; the DMZ leg is not plaintext.

**Role B — application/content node.** `vpnz-dmzweba01/02` (Windows/IIS) carry the application behind the proxy, and `vpnz-dmzwp01/02` (Ubuntu Nginx + PHP-FPM + MariaDB, pinned MariaDB 10.11) carry the WordPress blog. These nodes listen on 443 but are never directly published; the public documentation addresses `198.51.100.3` and `198.51.100.4` map to them through the perimeter firewall, while normal client traffic arrives via the proxy.

The upstream pools are fixed by the naming contract and must be reproduced exactly:

```nginx
upstream weba_pool { server 10.10.90.21:443; server 10.10.90.22:443; }
upstream wp_pool   { server 10.10.90.25:443; server 10.10.90.26:443; }
```

Listeners and routing on both proxies:

| Listener | Name | Backend pool | Notes |
|---|---|---|---|
| `:80` | `portal.vertexpeak.example`, `www.vertexpeak.example`, `blog.vertexpeak.example` | — | 301 redirect to the matching HTTPS name; no content served over HTTP |
| `:443` | `portal.vertexpeak.example` | `weba_pool` | SNI-selected; HSTS; the portal is the published application |
| `:443` | `www.vertexpeak.example` | `weba_pool` | Same pool, separate server block so that logging and headers are per-name |
| `:443` | `blog.vertexpeak.example` | `wp_pool` | WordPress front door |
| `:443` (loopback only) | `localhost` | — | `stub_status` for the Prometheus nginx exporter; never reachable from off-host |
| `:8443` (loopback only) | `monitor` | — | Per-upstream health endpoint used by the keepalived `track_script` in §8.4.3 |

**Certificate infrastructure relationship.** The TLS material on the proxies is not self-signed and is not issued by a public CA — the project has no registered domain and has deliberately forbidden real public addresses. The internal PKI is the source: AD CS on `vpnz-dc01` issues the public-name certificates (subject `CN=portal.vertexpeak.example`, SAN `portal.vertexpeak.example` and `portal.vertexpeak.fyp.lab`; subject `CN=blog.vertexpeak.example`, SAN `blog.vertexpeak.example`; subject `CN=www.vertexpeak.example`, SAN `www.vertexpeak.example` and `www.vertexpeak.fyp.lab`), and Easy-RSA on `vpnz-lnxra01` operates as the independent Linux-side CA for the OpenVPN PKI and the WireGuard management material. Certificates have a 397-day maximum validity and the preferred value is 90 days with a documented renewal run. The Linux hosts trust the internal chain via `/usr/local/share/ca-certificates/vp-root-ca.crt` plus `update-ca-certificates`, mirroring the Windows GPO distribution of the same root. Because the public names are `.example` documentation names, any browser test shows a **name-mismatch warning**; the report must **show that warning and explain it** rather than hide it by clicking through silently.

#### 8.3.2 Installation and base configuration

```bash
sudo apt-get update
sudo apt-get install -y nginx
nginx -v                     # record the exact output; the pin is 1.24.0 (Ubuntu 24.04 package)
dpkg -s nginx | grep -E '^Version|^Status'
```

Expected version evidence:

```text
nginx version: nginx/1.24.0 (Ubuntu)
```

The baseline deliberately uses **the distribution's Nginx**, which lags upstream stable. That is stated as a choice, not an accident: it keeps `apt` patching, keeps the version pinned, and avoids adding a third-party APT repository to the estate. If a feature requires a newer release, the documented alternative is the nginx.org mainline build, with the version deviation recorded.

The baseline's repository layout is `conf.d` based, and the `sites-available`/`sites-enabled` mechanism is **not** used — but the Ubuntu package ships a default site in `sites-enabled`, so the builder must remove it or it will win the default-server contest:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
ls -l /etc/nginx/sites-enabled/          # expected: the directory exists and is empty
```

Global configuration. Only the project-relevant deviations from the packaged `nginx.conf` are shown; the packaged file is edited in place rather than replaced, so that `nginx -t` failures are easier to attribute.

```nginx
# /etc/nginx/nginx.conf  —  vpnz-dmzrev01 / vpnz-dmzrev02   (project-relevant sections)
user  www-data;

# One worker per allocated vCPU (the proxies have 2 vCPU each).
worker_processes  auto;
worker_rlimit_nofile 65535;

pid        /run/nginx.pid;
error_log  /var/log/nginx/error.log warn;

events {
    worker_connections  2048;
    multi_accept        on;
    use                 epoll;
}

http {
    # ---- MIME and defaults ----
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    charset       utf-8;

    # ---- performance ----
    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   30s;
    keepalive_requests  200;
    types_hash_max_size 2048;

    # ---- information disclosure ----
    server_tokens  off;              # suppresses the version string in Server: and error pages

    # ---- body and buffer limits (defence in depth; see §8.3.5) ----
    client_max_body_size        8m;
    client_body_buffer_size     128k;
    client_header_timeout       15s;
    client_body_timeout         20s;
    send_timeout                20s;
    large_client_header_buffers 4 16k;

    # ---- global TLS defaults (per-server blocks override where needed) ----
    ssl_protocols              TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers  off;                 # let the client choose under TLS 1.3 semantics
    ssl_session_cache          shared:SSL:20m;
    ssl_session_timeout        10m;
    ssl_session_tickets        off;
    ssl_stapling               on;
    ssl_stapling_verify        on;
    resolver                   10.10.30.11 10.10.30.12 valid=300s;
    resolver_timeout           5s;

    # ---- log formats ----
    # 'fyp' adds the upstream address/status/time so a proxy decision can be attributed
    # to a specific backend node, which is what the failover and capacity tests need.
    log_format  fyp  '$remote_addr - $remote_user [$time_local] '
                     '"$request" $status $body_bytes_sent '
                     '"$http_referer" "$http_user_agent" '
                     'vhost=$host sni=$ssl_server_name tls=$ssl_protocol/$ssl_cipher '
                     'rt=$request_time urt=$upstream_response_time '
                     'upstream=$upstream_addr ustatus=$upstream_status '
                     'xff="$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  fyp;
    # A promoted log format is useful for WordPress but is OPTIONAL and is off by default
    # because it multiplies log volume on the two content nodes.
    # log_format  fyp_wp  '$remote_addr - $remote_user [$time_local] "$request" $status '
    #                     '$body_bytes_sent rt=$request_time upstream=$upstream_addr';

    # ---- virtual hosts: conf.d is the canonical layout for this project ----
    include /etc/nginx/conf.d/*.conf;

    # ---- local-only status vhost for the Prometheus nginx exporter ----
    server {
        listen       127.0.0.1:443 ssl;
        server_name  localhost;
        ssl_certificate     /etc/nginx/ssl/portal.crt;
        ssl_certificate_key /etc/nginx/ssl/portal.key;

        location = /stub_status {
            stub_status;
            access_log off;
            allow 127.0.0.1;
            deny  all;
        }
        location = /healthz {
            return 200 "ok\n";
            access_log off;
            allow 127.0.0.1;
            deny  all;
        }
    }
}
```

`stub_status` is what feeds the `fyp-availability` dashboard: `Active connections`, `accepts`, `handled`, `requests`, `Reading`, `Writing`, `Waiting`. It is bound to loopback only, which is a deliberate departure from the common "allow the monitoring subnet" pattern — the exporter runs on the same host and the metrics are then pulled from `10.10.90.x`, so the status endpoint never sees a packet from anywhere except the host itself.

Upstream pool file, exactly as the contract specifies:

```nginx
# /etc/nginx/conf.d/00-upstreams.conf
# Upstream pools are declared ONCE and referenced by name. Do not inline server addresses
# in a proxy_pass: a change would then have to be made in every server block.

upstream weba_pool {
    server 10.10.90.21:443 max_fails=3 fail_timeout=10s;
    server 10.10.90.22:443 max_fails=3 fail_timeout=10s;
    keepalive 16;                 # reuse upstream connections; reduces TLS handshakes to the origin
    keepalive_timeout 60s;
    keepalive_requests 100;
    zone weba_pool_zone 64k;      # shared state so max_fails/fail_timeout are enforced across workers
}

upstream wp_pool {
    server 10.10.90.25:443 max_fails=3 fail_timeout=10s;
    server 10.10.90.26:443 max_fails=3 fail_timeout=10s;
    keepalive 16;
    keepalive_timeout 60s;
    keepalive_requests 100;
    zone wp_pool_zone 64k;
}

# Passive health only. There is deliberately NO nginx plus API and no active health-check module in
# the open-source build, so 'max_fails'/'fail_timeout' plus the keepalived track script of §8.4.3
# are the entire health model. State this limitation in the report.
```

#### 8.3.3 Reverse proxy configuration

The portal vhost is the reference implementation. It is stored at `/etc/nginx/conf.d/10-portal.conf` with mode `0644`.

```nginx
# /etc/nginx/conf.d/10-portal.conf  —  published application front door
# Public name:  portal.vertexpeak.example   ->  DNAT 198.51.100.2 -> 10.10.90.10 (VIP) -> here
# Backend pool: weba_pool (vpnz-dmzweba01/02, IIS application tier)

# ---- HTTP: nothing is ever served here; one permanent redirect, one comparison ----
server {
    listen      80 default_server;
    listen      [::]:80 default_server;      # harmless even with IPv6 disabled; keeps config portable
    server_name portal.vertexpeak.example www.vertexpeak.example blog.vertexpeak.example;

    # ACME is not used (no public CA), but leaving the path un-redirected costs nothing
    # and documents the decision.
    location ^~ /.well-known/acme-challenge/ { return 404; }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen      443 ssl;
    listen      [::]:443 ssl;
    http2       on;                          # nginx 1.24.0 syntax; see the [ASSUMPTION] note below
    server_name portal.vertexpeak.example;

    # ---- TLS material (see §8.3.4 for the full discussion) ----
    ssl_certificate         /etc/nginx/ssl/chain.crt;   # leaf followed by the issuing CA, then the root
    ssl_certificate_key     /etc/nginx/ssl/portal.key;  # mode 0600, root:root
    ssl_trusted_certificate /etc/nginx/ssl/chain.crt;   # used for OCSP-staple response verification

    # ---- access and error logs, tagged per site ----
    access_log /var/log/nginx/portal.access.log fyp;
    error_log  /var/log/nginx/portal.error.log  warn;

    # ---- security headers (rationale in §8.3.5) ----
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options    "nosniff" always;
    add_header X-Frame-Options           "SAMEORIGIN" always;
    add_header Referrer-Policy           "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy        "geolocation=(), microphone=(), camera=()" always;
    add_header Content-Security-Policy   "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'self'" always;

    # ---- request limits ----
    client_max_body_size 8m;
    client_body_timeout  20s;

    # ---- rate limiting (zones are declared in 30-limits.conf; see §8.3.5) ----
    limit_req  zone=req_per_ip burst=40 nodelay;
    limit_conn conn_per_ip 50;

    # ---- default response if the pool is fully down: fail closed, not open ----
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
        internal;
    }

    location / {
        proxy_pass https://weba_pool;

        # SNI to the upstream is REQUIRED because the origin presents a certificate for
        # www.vertexpeak.example and virtual-hosts on it.
        proxy_ssl_server_name on;
        proxy_ssl_name        www.vertexpeak.example;
        proxy_ssl_protocols   TLSv1.2 TLSv1.3;
        proxy_ssl_verify      on;
        proxy_ssl_verify_depth 2;
        proxy_ssl_trusted_certificate /etc/nginx/ssl/vp-root-ca.crt;   # pin to the internal root
        proxy_ssl_session_reuse on;

        # ---- mandatory forwarding headers ----
        proxy_set_header Host              $host;                 # 1. preserve the client's Host
        proxy_set_header X-Real-IP         $remote_addr;          # 2. the immediate client address
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;  # 3. append to any existing chain
        proxy_set_header X-Forwarded-Proto $scheme;               # 4. tells the app the client used HTTPS
        proxy_set_header X-Forwarded-Host  $host;                 # 5. needed for absolute-URL generation
        proxy_set_header X-Forwarded-Port  $server_port;          # 6. 443 when reached over TLS
        proxy_set_header Connection        "";                    # 7. empty -> enables upstream keepalive

        # ---- timeouts: tuned for a request/response web app, not for a streaming service ----
        proxy_connect_timeout 5s;
        proxy_send_timeout    30s;
        proxy_read_timeout    30s;

        # ---- buffering: on, so a slow client cannot pin an upstream worker ----
        proxy_buffering        on;
        proxy_buffers          16 16k;
        proxy_buffer_size      8k;
        proxy_busy_buffers_size 32k;
        proxy_max_temp_file_size 256m;
        proxy_request_buffering on;

        # ---- do not silently follow application redirects ----
        proxy_redirect off;

        # ---- pass the real client to the app for audit purposes ----
        proxy_set_header X-Request-ID $request_id;
    }

    # Static assets are also served through the proxy in this design, but a health endpoint exists
    # so that keepalived and Prometheus can test the proxy without touching the application.
    location = /healthz {
        access_log off;
        add_header Content-Type text/plain;
        return 200 "portal-proxy-ok $hostname\n";
    }

    # Deny access to obvious junk paths rather than proxying them to the application tier.
    location ~* /\.(git|svn|env|htaccess|htpasswd) {
        deny all;
        access_log off;
    }
}
```

`[ASSUMPTION]` on the `http2` directive: in Nginx 1.24.0 (the pinned Ubuntu package) HTTP/2 is enabled in a `listen ... ssl` server with the standalone `http2 on;` directive. The older `listen 443 ssl http2;` form also works in 1.24.0 and is deprecated in later releases (1.25.1+). The builder must run `nginx -t` and, if the standalone directive is rejected, fall back to `listen 443 ssl http2;`. The reason to prefer the standalone form is forward compatibility, not current correctness; the exact accepted syntax must be recorded in the build log.

The blog vhost follows the same shape with three differences, which are the ones that matter for a WordPress origin:

```nginx
# /etc/nginx/conf.d/20-blog.conf  —  WordPress front door (excerpt: the differences from 10-portal.conf)
server {
    listen      443 ssl;
    http2       on;
    server_name blog.vertexpeak.example;

    ssl_certificate         /etc/nginx/ssl/chain.crt;
    ssl_certificate_key     /etc/nginx/ssl/portal.key;
    ssl_trusted_certificate /etc/nginx/ssl/chain.crt;

    # WordPress uploads are larger than the portal's JSON payloads.
    client_max_body_size 32m;

    location / {
        proxy_pass https://wp_pool;
        proxy_ssl_server_name on;
        proxy_ssl_name        blog.vertexpeak.example;
        proxy_ssl_verify      on;
        proxy_ssl_trusted_certificate /etc/nginx/ssl/vp-root-ca.crt;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection        "";

        # WordPress behind a proxy needs the HTTPS flag or it redirects to http:// in a loop.
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 5s;
        proxy_read_timeout    60s;      # admin-ajax and plugin work can be slow
        proxy_buffering       on;
    }

    # A separate, quieter log for a high-volume content site.
    access_log /var/log/nginx/blog.access.log fyp;
}
```

Two operational details that belong in the build log because they cause real incidents:

1. **`proxy_set_header Connection ""` must be paired with `keepalive` in the upstream block.** Setting one without the other either disables connection reuse or leaves the hop-by-hop `Connection: close` header in place and defeats it.
2. **`proxy_ssl_verify on` will fail the whole site** the moment the upstream certificate is not trusted, expired, or presented with the wrong SNI. That is intentional — a broken trust chain must break loudly — but the failure mode is a `502` with `upstream SSL certificate verify error` in `portal.error.log`, and §8.12 lists it as a troubleshooting entry.

Rate-limit zone declarations live in a separate small file so that the zones exist before any `server` block references them:

```nginx
# /etc/nginx/conf.d/30-limits.conf
# Declared at http level via conf.d inclusion order: 00-upstreams, 10-portal, 20-blog, 30-limits.
# 'limit_req_zone' is valid in the http context, which conf.d files are included into — so this
# file works, but it MUST be included after nothing and before the server blocks that use it.
# [ASSUMPTION] if the packaged nginx.conf includes conf.d in a different order, move these two
# directives into nginx.conf's http block and delete this file.
limit_req_zone  $binary_remote_addr zone=req_per_ip:10m  rate=20r/s;
limit_conn_zone $binary_remote_addr zone=conn_per_ip:10m;
```

#### 8.3.4 TLS configuration

**Where the material comes from.** AD CS issues the leaf certificates; the chain file is assembled from the leaf plus the issuing CA and the root. On the Linux side the root is installed system-wide so that `curl`, `openssl s_client` and any Python tooling trust it:

```bash
sudo cp 08-references/pki/vp-root-ca.crt /usr/local/share/ca-certificates/vp-root-ca.crt
sudo update-ca-certificates
# Expected: "1 added, 0 removed; done. Running hooks in /etc/ca-certificates/update.d... done."
openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt /etc/nginx/ssl/chain.crt
# Expected: /etc/nginx/ssl/chain.crt: OK
```

**Certificate paths (fixed by the baseline):** `/etc/nginx/ssl/portal.crt`, `/etc/nginx/ssl/portal.key`, `/etc/nginx/ssl/chain.crt`, all `root:root` with the **key at `0600`** and the certificate and chain at `0644`. `/etc/nginx/ssl/vp-root-ca.crt` is the trust anchor pinned for upstream verification. `/etc/nginx/.htpasswd-portal` (mode `0640`) exists only for a documented basic-auth test account and is labelled a lab control, never a production control.

**Protocols and ciphers.** TLS 1.0 and 1.1 are refused; TLS 1.2 is the floor and TLS 1.3 is preferred. The pinned Nginx 1.24.0 on Ubuntu 24.04 links OpenSSL 3.0, which supports the TLS 1.3 suites. The design does not hard-code a TLS 1.2 cipher string, because the distro/OpenSSL default (`ssl_ciphers` unset, i.e. the `DEFAULT` policy combined with `ssl_prefer_server_ciphers off`) already excludes the historic weak suites and honours the client's preference, which is the better outcome for interop with a variety of staff laptops and browsers. Where an explicit list is required by the acceptance test, the fallback is:

```nginx
# [ASSUMPTION] only if an explicit cipher list is required by the marker:
ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
ssl_prefer_server_ciphers off;
```

This is marked as an assumption because the exact suite names OpenSSL 3.0 exposes must be read from `openssl ciphers -v` on the built host and pasted into the report, not written from memory. A cipher name that the runtime does not recognise makes `nginx -t` fail, which is a cheap failure; a cipher name that is silently accepted but weaker than intended is not.

**Sessions and tickets.** `ssl_session_cache shared:SSL:20m` with a 10-minute timeout gives roughly 80 000 resumable sessions across workers and is set once in `nginx.conf`. `ssl_session_tickets off` is deliberate: stateless ticket keys are generated per worker at start-up and are not shared, so with two workers and two proxy nodes a ticket issued by one worker cannot be decrypted by another. Turning tickets off forces the shared session cache path, which is the behaviour this design wants.

**OCSP stapling.** `ssl_stapling on` plus `ssl_stapling_verify on` plus `ssl_trusted_certificate` pointed at the chain, with the internal resolvers `10.10.30.11`/`10.10.30.12` named in `resolver`. Because the internal AD CS responder may not be published as an AIA/OCSP endpoint in the lab, the honest outcome is likely to be `Stapling not happening` in the Nginx error log. The design keeps the directives enabled because the correct production posture is to staple, and the **finding** to record is that the internal CA's OCSP responder was not reachable and that stapling therefore did not occur — with the error-log line as evidence. This is exactly the kind of observed-versus-expected result §8.13 exists to capture, and it is not something to hide by disabling the directive.

**HSTS.** `Strict-Transport-Security: max-age=31536000; includeSubDomains` is sent only from the `443` server blocks. Sending HSTS on a plain-HTTP response is meaningless and sending it from a lab host that later serves HTTP again is a self-inflicted outage for the tester's own browser, so the header is deliberately per-server and never global. `preload` is not used: the project has no registered domain, and a preload directive would be a false claim.

**The name-mismatch reality.** `portal.vertexpeak.example` is an RFC 2606 reserved documentation name and no real public CA will issue for it. The lab presents an internal-CA certificate for that name, so a browser will warn that the chain is trusted only if the internal root is installed **and** will warn about the name if the tester browses to the `.fyp.lab` name instead. Both warnings must be screenshotted and explained. The certificate's SAN deliberately carries both the `.example` and the `.fyp.lab` form of the name, which lets one certificate serve the published path and the split-horizon internal path without a mismatch.

#### 8.3.5 Hardening

```nginx
# /etc/nginx/conf.d/40-hardening.conf  —  host-independent hardening directives
# (they are listed here for evidence purposes; the effective directives are also in nginx.conf)
server_tokens off;                 # no version disclosure in Server: header or error pages
```

| Control | Setting | Why it is there |
|---|---|---|
| Version disclosure | `server_tokens off` | Removes the exact Nginx version from `Server:` and from error pages. Reduces the value of trivial banner-grabbing; does not pretend to be security on its own |
| Clickjacking | `X-Frame-Options: SAMEORIGIN` | Prevents the portal being framed by an attacker page |
| MIME sniffing | `X-Content-Type-Options: nosniff` | Stops a browser from re-interpreting a declared type |
| Transport policy | `Strict-Transport-Security` | Forces HTTPS for the year following the first success |
| Referrer leakage | `Referrer-Policy: strict-origin-when-cross-origin` | Keeps internal paths out of third-party referrers |
| Feature exposure | `Permissions-Policy` | Denies camera, microphone and geolocation, none of which the portal uses |
| Script injection | `Content-Security-Policy` | `default-src 'self'` with `'unsafe-inline'` permitted only for styles. For WordPress this policy will need per-site adjustment, and the adjustment must be recorded rather than quietly loosened |
| Request size | `client_max_body_size 8m` (portal), `32m` (blog) | A request body limit is the cheapest defence against trivial memory/disk exhaustion. 8 MB is generous for a JSON/HTML app; 32 MB covers WordPress media |
| Header limits | `large_client_header_buffers 4 16k` | Caps per-request header memory; oversized headers get 431/400 instead of allocation |
| Rate limiting | `limit_req zone=req_per_ip burst=40 nodelay` | 20 requests/second per source IP with a 40-request burst. Sized so a legitimate browser loading a page with many assets is never limited, while a naive flood is |
| Concurrency | `limit_conn conn_per_ip 50` | Caps simultaneous connections per source IP |
| Method restriction | `if ($request_method !~ ^(GET\|HEAD\|POST)$) { return 405; }` | The portal and blog are read-mostly; `PUT`, `DELETE`, `TRACE`, `OPTIONS` and `CONNECT` have no legitimate use against these vhosts and are refused at the edge of the application |
| Path denial | `location ~* /\.(git\|svn\|env\|htaccess\|htpasswd)` | Refuses requests for version-control and configuration artefacts instead of passing them upstream |
| Information leakage | `error_page 502 503 504 /50x.html` with `internal` | The origin's error page and headers are never relayed to the internet |
| Proxy trust pinning | `proxy_ssl_verify on` + `proxy_ssl_trusted_certificate /etc/nginx/ssl/vp-root-ca.crt` | The proxy refuses to talk to an origin presenting anything other than the internal chain — an important control in a DMZ where the origin might be replaced |
| Basic auth | `/etc/nginx/.htpasswd-portal`, mode `0640` | A single documented lab test account used to prove that an unauthenticated request is challenged. It is **not** an application authentication mechanism and must not be described as one |

Method restriction implementation, written so that it cannot accidentally break the health check:

```nginx
# Place inside the 443 server block, before the location blocks.
if ($request_method !~ ^(GET|HEAD|POST)$) {
    return 405;
}
# TRACE is additionally refused at the firewall layer; both are evidenced separately.
```

#### 8.3.6 Verification

Configuration syntax, before anything is reloaded:

```bash
sudo nginx -t
```

Expected:

```text
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Reload without dropping connections, then confirm the running worker generation changed:

```bash
sudo systemctl reload nginx
systemctl status nginx --no-pager | head -4
sudo ss -tlnp | grep -E ':80|:443'
```

HTTP redirect behaviour and headers, from an internal host (DNS resolving through `10.10.30.11`):

```bash
curl -sI http://portal.vertexpeak.fyp.lab/
```

Expected:

```text
HTTP/1.1 301 Moved Permanently
Server: nginx
Date: Tue, 06 Oct 2026 02:20:11 GMT
Content-Type: text/html
Content-Length: 178
Location: https://portal.vertexpeak.fyp.lab/
Connection: keep-alive
```

```bash
curl -sI --cacert /etc/nginx/ssl/vp-root-ca.crt https://portal.vertexpeak.fyp.lab/
```

Expected (the `Server` header shows no version, which is the `server_tokens` evidence):

```text
HTTP/2 200
server: nginx
date: Tue, 06 Oct 2026 02:20:14 GMT
content-type: text/html; charset=utf-8
strict-transport-security: max-age=31536000; includeSubDomains
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
referrer-policy: strict-origin-when-cross-origin
content-security-policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'self'
```

TLS inspection with `openssl s_client`, which also proves the SNI-selected certificate and the negotiated protocol:

```bash
openssl s_client -connect 10.10.90.10:443 -servername portal.vertexpeak.example \
  -CAfile /etc/nginx/ssl/vp-root-ca.crt -tls1_2 </dev/null 2>/dev/null | \
  grep -E 'Protocol|Cipher|Verify return code|subject=|issuer='
```

Expected:

```text
subject=CN = portal.vertexpeak.example
issuer=CN = VP-ISSUING-CA-01, DC = vertexpeak, DC = fyp, DC = lab
---
Protocol  : TLSv1.2
Cipher    : ECDHE-RSA-AES256-GCM-SHA384
Verify return code: 0 (ok)
```

A TLS 1.1 attempt must fail, which is the negative test that proves the protocol floor is real:

```bash
openssl s_client -connect 10.10.90.10:443 -servername portal.vertexpeak.example -tls1_1 </dev/null
# Expected: an SSL alert (protocol version / handshake failure) and no session established.
```

Proxy-header propagation, which is the check that the application tier will see the correct client:

```bash
curl -s -o /dev/null -D - --cacert /etc/nginx/ssl/vp-root-ca.crt \
  -H 'X-Forwarded-For: 203.0.113.99' https://portal.vertexpeak.fyp.lab/healthz
# Then inspect the application tier's log on vpnz-dmzweba01: the client must appear as
# 10.10.90.1x (the proxy's address) with '203.0.113.99, <proxy-ip>' appended in X-Forwarded-For.
```

Rate-limit and method-restriction evidence:

```bash
# Method restriction: expect 405
curl -s -o /dev/null -w '%{http_code}\n' -X TRACE --cacert /etc/nginx/ssl/vp-root-ca.crt https://portal.vertexpeak.fyp.lab/

# Rate limiting: 60 rapid requests, expect a run of 200 followed by 503s
for i in $(seq 1 60); do
  curl -s -o /dev/null -w '%{http_code} ' --cacert /etc/nginx/ssl/vp-root-ca.crt \
    https://portal.vertexpeak.fyp.lab/healthz
done; echo
# Expected: a tail of "503 503 ..." and matching 'limiting requests' entries in portal.error.log
```

Prometheus availability metrics, proving the metrics path exists before the monitoring chapter cites it:

```bash
curl -sk https://127.0.0.1/stub_status
```

Expected:

```text
Active connections: 3
server accepts handled requests
 128 128 402
Reading: 0 Writing: 1 Waiting: 2
```

### 8.4 High Availability with Keepalived (VRRP)

#### 8.4.1 Design

Keepalived provides **first-hop redundancy for the two Linux-held gateways** in this design, using the VRRP protocol that the WSOS names. It is important to be precise about what is and is not claimed:

- The standard **does not name Keepalived** (0 occurrences in the 2026 text and raw HTML). The bridge is `Provide network load balancing & fault tolerance at routing and switching levels by using GLBP, HSRP, VRRP, LACP, PAgP, etc.` (Domain 3, line 4) — **VRRP is named and Keepalived implements VRRP.** That is the strongest available bridge and it is presented as a bridge.
- This project therefore runs **two different first-hop redundancy technologies**, and they must never be merged into one claim: **HSRP** in the Cisco access layer (where the gateway is a switch, and where Packet Tracer's HSRP implementation is the reliable one) and **Keepalived/VRRP** where the gateway is a Linux VM. Both are deliberate.

Two independent VRRP instances:

| Instance | Nodes | Interface / segment | `virtual_router_id` | VIP | Priority | Preempt |
|---|---|---|---|---|---|---|
| nftables pair | `vpnz-nft01` (MASTER), `vpnz-nft02` (BACKUP) | the egress segment carrying `10.10.50.0/28`, interface `ens192` | **51** | `10.10.50.10` | 150 / 100 | yes, with `preempt_delay` |
| nginx pair | `vpnz-dmzrev01` (MASTER), `vpnz-dmzrev02` (BACKUP) | the DMZ segment `10.10.90.0/24`, interface `ens192` | **61** | `10.10.90.10` | 150 / 100 | yes, with `preempt_delay` |

VRID 51 and 61 are fixed by the naming contract, and the contract's reason is sound: two different VRIDs are never reused on two subnets that could ever be bridged. The nftables VIP is the *tunnel front door* — it is the address that `203.0.113.2` is presented for and that the `198.51.100.5` published VPN services map to, and it is the WireGuard endpoint address `10.10.200.1/24` at the tunnel level. The nginx VIP is the *published web front door*, the DNAT target for `198.51.100.2`.

**Preemption** is enabled on both pairs with a delay, because the intended steady state is that the designated master carries the traffic and the backup is genuinely idle-and-ready. Without `preempt_delay`, a flapping node would reclaim the VIP repeatedly and each reclaim means a gratuitous ARP storm plus a TLS session-cache cold start for every client.

**Track scripts are the whole point of this design.** A VRRP instance that tracks only an interface will happily hold the VIP on a node whose Nginx has crashed, which converts a "high availability" pair into a single point of failure with a warm standby. Both pairs therefore track a **service check**: the nginx pair curls a local health endpoint that proves the proxy can serve, and the nftables pair checks that a ruleset is actually loaded and non-empty.

#### 8.4.2 Installation and `keepalived.conf`

```bash
sudo apt-get install -y keepalived
keepalived --version
# Expected first line: Keepalived v2.2.8 (01/01/2024)   <- the pinned Ubuntu 24.04 version
```

Both nodes must be able to authenticate to each other. The baseline records the authentication decision explicitly: `authentication { auth_type PASS }` with a pre-shared string is used, and this is a **lab simplification within a host-only segment**, not best practice. Two facts must be stated honestly in the report:

1. VRRP authentication in Keepalived uses a simple or AH-style check that is a shared secret in a plaintext configuration file. It is not a cryptographic protection in the modern sense and does not prevent a determined on-segment attacker from injecting advertisements.
2. The real protection in this design is that the egress and DMZ segments carry no user traffic and the hosts on them are enumerated in the nftables ruleset.

The password string below is a placeholder that the builder replaces with a value from the group's password manager. It must never be committed to Git in its real form.

**Node 1 — `vpnz-nft01`, master of the nftables pair (`vrid 51`).**

```ini
# /etc/keepalived/keepalived.conf   —   vpnz-nft01   (state MASTER, priority 150)
# VRRP instance VRID 51 on the egress segment; VIP 10.10.50.10 is the tunnel / NAT front door.
# Verify with: sudo keepalived --config-test -f /etc/keepalived/keepalived.conf
#              ip -br a show ens192 ; journalctl -u keepalived -f

global_defs {
    router_id              vpnz-nft01          # must be unique across the whole VRRP domain
    script_user            keepalived_script   # unprivileged account used to run the track scripts
    enable_script_security                     # refuse to run a script that is group/world writable
    vrrp_skip_check_adv_addr
    vrrp_strict                                # enforce RFC 3768 conformance (see the note below)
    vrrp_garp_interval     0.001               # gratuitous ARP pacing: 1 ms between ARPs
    vrrp_gna_interval      0.000001            # unsolicited NA pacing (a small value avoids a burst)
    vrrp_mcast_group4      224.0.0.18          # the standard VRRP IPv4 multicast group
    notification_email {
        netops@vertexpeak.fyp.lab
    }
    notification_email_from keepalived@vpnz-nft01.vertexpeak.fyp.lab
    smtp_server             10.10.30.31        # vpnz-mon01; see the notification note in §8.4.4
    smtp_connect_timeout    10
}

# ----------------------------------------------------------------------------------
# Health check 1: is the firewall actually enforcing a ruleset?
# ----------------------------------------------------------------------------------
vrrp_script chk_nftables {
    script       "/usr/local/bin/vrrp-check-nftables.sh"
    interval     5          # run every 5 seconds
    timeout      3          # a run that exceeds 3 s is a failure
    weight       -30        # failure DROPS priority by 30 (150 -> 120), it does not remove the VIP
    rise         2          # two consecutive successes to be considered healthy again
    fall         2          # two consecutive failures to be considered failed
    user         root       # required because 'nft list ruleset' needs privileges
}

# ----------------------------------------------------------------------------------
# Health check 2: can the box still forward? A test route lookup plus interface liveness.
# ----------------------------------------------------------------------------------
vrrp_script chk_egress_link {
    script       "/usr/local/bin/vrrp-check-egress.sh"
    interval     10
    timeout      4
    weight       -60        # losing the egress path drops priority to 90, i.e. below the peer's 100
    rise         2
    fall         2
    user         root
}

vrrp_instance VI_EGRESS {
    state                  MASTER
    interface              ens192                # the 10.10.50.0/28 segment; confirm with ip -br link
    virtual_router_id      51                   # FIXED by the naming contract
    priority               150                  # MASTER; the backup node uses 100
    advert_int             1                    # 1 s advertisements -> ~3 s to detect a dead master
    preempt_delay          30                   # wait 30 s before reclaiming the VIP after a restart
    smtp_alert

    authentication {
        auth_type          PASS
        auth_pass          CHANGE_ME_VRRP_51      # replace from the password manager; never commit this
    }

    # The VIP is the ONLY address that moves. Both nodes keep their own physical address
    # (vpnz-nft01 = 10.10.50.11, vpnz-nft02 = 10.10.50.12).
    virtual_ipaddress {
        10.10.50.10/28 dev ens192
    }

    # Addresses advertised as reachable through this instance. Adding the tunnel-local address
    # keeps the WireGuard / NAT front door consistent with the VIP.
    virtual_ipaddress_excluded {
        10.10.200.1/24 dev ens224
    }

    track_script {
        chk_nftables
        chk_egress_link
    }

    # A notify script records every state transition, which is the primary failover evidence.
    notify /usr/local/bin/vrrp-notify.sh
}
```

**Node 2 — `vpnz-nft02`, backup of the nftables pair.** The file is identical except for four values, and it is generated from the *same* Ansible Jinja2 template (`templates/keepalived.conf.j2`) with different host variables, so the two nodes can never drift.

```ini
# /etc/keepalived/keepalived.conf   —   vpnz-nft02   (state BACKUP, priority 100)
global_defs {
    router_id              vpnz-nft02          # DIFFERENT from the master
    script_user            keepalived_script
    enable_script_security
    vrrp_skip_check_adv_addr
    vrrp_strict
    vrrp_garp_interval     0.001
    vrrp_gna_interval      0.000001
    vrrp_mcast_group4      224.0.0.18
    notification_email { netops@vertexpeak.fyp.lab }
    notification_email_from keepalived@vpnz-nft02.vertexpeak.fyp.lab
    smtp_server             10.10.30.31
    smtp_connect_timeout    10
}

vrrp_script chk_nftables {
    script   "/usr/local/bin/vrrp-check-nftables.sh"
    interval 5
    timeout  3
    weight   -30
    rise     2
    fall     2
    user     root
}
vrrp_script chk_egress_link {
    script   "/usr/local/bin/vrrp-check-egress.sh"
    interval 10
    timeout  4
    weight   -60
    rise     2
    fall     2
    user     root
}

vrrp_instance VI_EGRESS {
    state                  BACKUP              # DIFFERENT
    interface              ens192
    virtual_router_id      51                  # SAME VRID — this is what makes them a pair
    priority               100                 # DIFFERENT (lower)
    advert_int             1
    preempt_delay          30
    smtp_alert

    authentication {
        auth_type          PASS
        auth_pass          CHANGE_ME_VRRP_51    # MUST be byte-identical to the master's value
    }

    virtual_ipaddress {
        10.10.50.10/28 dev ens192
    }
    virtual_ipaddress_excluded {
        10.10.200.1/24 dev ens224
    }
    track_script {
        chk_nftables
        chk_egress_link
    }
    notify /usr/local/bin/vrrp-notify.sh
}
```

**The nginx pair.** `vpnz-dmzrev01` (MASTER, priority 150) and `vpnz-dmzrev02` (BACKUP, priority 100) use the same structure with `virtual_router_id 61`, `interface ens192` on the `10.10.90.0/24` segment, and `virtual_ipaddress { 10.10.90.10/24 dev ens192; }` — while the master's own address is `10.10.90.28` and the backup's is `10.10.90.29`, so the pair runs in ordinary non-owner VRRP mode (Rev 1.1 ruling C-02). They track the Nginx service rather than the ruleset.

```ini
# /etc/keepalived/keepalived.conf   —   vpnz-dmzrev01   (VRID 61, MASTER, priority 150)
# On vpnz-dmzrev02 change: router_id -> vpnz-dmzrev02, state -> BACKUP, priority -> 100.
# Everything else, including the VRID and the auth_pass, MUST stay identical.

global_defs {
    router_id              vpnz-dmzrev01
    script_user            keepalived_script
    enable_script_security
    vrrp_skip_check_adv_addr
    vrrp_strict
    vrrp_garp_interval     0.001
    vrrp_gna_interval      0.000001
    vrrp_mcast_group4      224.0.0.18
    notification_email { netops@vertexpeak.fyp.lab }
    notification_email_from keepalived@vpnz-dmzrev01.vertexpeak.fyp.lab
    smtp_server             10.10.30.31
    smtp_connect_timeout    10
}

vrrp_script chk_nginx {
    script   "/usr/local/bin/vrrp-check-nginx.sh"
    interval 3          # the web tier is the customer-facing service: check more often
    timeout  2
    weight   -60        # 150 -> 90, below the backup's 100, so a broken master LOSES the VIP
    rise     2
    fall     2
    user     root       # needs to read the local TLS health endpoint over 443
}

vrrp_script chk_upstream_pool {
    script   "/usr/local/bin/vrrp-check-pool.sh"
    interval 10
    timeout  5
    weight   -20        # a degraded-but-serving proxy keeps the VIP; a totally dead pool does not
    rise     3
    fall     2
    user     root
}

vrrp_instance VI_WEB {
    state                  MASTER
    interface              ens192
    virtual_router_id      61                   # FIXED by the naming contract
    priority               150
    advert_int             1
    preempt_delay          30
    smtp_alert

    authentication {
        auth_type          PASS
        auth_pass          CHANGE_ME_VRRP_61
    }

    virtual_ipaddress {
        10.10.90.10/24 dev ens192
    }

    track_script {
        chk_nginx
        chk_upstream_pool
    }

    notify /usr/local/bin/vrrp-notify.sh
}
```

Two configuration facts that are easy to get wrong and are worth stating explicitly:

- **`vrrp_strict`** enables strict RFC conformance. In some Keepalived builds it also implicitly adds a `DROP` rule for VRRP protocol packets on the interface, which on this design is harmless because the interface exists only for VRRP and forwarded traffic — but if the builder observes VRRP advertisements being blocked, the diagnostic is `iptables -L -n | grep -i vrrp` (Keepalived may install its own filter) and the fix is documented rather than guessed. `[ASSUMPTION]` that `vrrp_strict` does not conflict with the nftables ruleset in this build; it must be confirmed on day one of the pair build.
- **`state MASTER`/`BACKUP` is a starting preference, not a guarantee.** With `preempt_delay` and priorities 150/100 the intended steady state is deterministic, but the *actual* master is whatever the VRRP election produced, and the only authoritative statement of it is `ip -br a` on both nodes plus the `journalctl` transition lines. Every verification step below therefore reads the state rather than assuming it.

#### 8.4.3 Health-check scripts

All three scripts live in `/usr/local/bin`, are owned `root:root` and are mode `0755` (executable and **not** writable by group or other, which `enable_script_security` enforces). Each one exits `0` for healthy and non-zero for unhealthy, and prints a diagnostic line for the log.

```bash
#!/usr/bin/env bash
# /usr/local/bin/vrrp-check-nginx.sh
# Purpose : prove that THIS node can serve HTTPS through its own Nginx before it is allowed to
#           hold the web VIP. A process-name check is not enough: nginx can be running with a
#           broken config, an expired certificate or an unreachable upstream pool.
# Exit    : 0 = healthy, 1 = unhealthy
set -euo pipefail

HOST_FQDN="$(hostname -f)"
ENDPOINT="https://${HOST_FQDN}/healthz"
CAFILE="/etc/nginx/ssl/vp-root-ca.crt"
TIMEOUT=2

result="$(curl -s -o /dev/null -w '%{http_code}' \
            --max-time "${TIMEOUT}" --cacert "${CAFILE}" \
            --resolve "${HOST_FQDN}:443:127.0.0.1" \
            "${ENDPOINT}" 2>/dev/null || true)"

if [[ "${result}" != "200" ]]; then
    logger -t vrrp-check-nginx -p daemon.warning \
        "UNHEALTHY: ${ENDPOINT} returned '${result}' (expected 200)"
    exit 1
fi

# Second, independent signal: is the worker process actually present?
if ! pgrep -x nginx >/dev/null 2>&1; then
    logger -t vrrp-check-nginx -p daemon.warning "UNHEALTHY: no nginx process found"
    exit 1
fi

exit 0
```

Three design notes on this script. It uses `--resolve` to force the request to the **local** socket while still presenting the correct SNI and Host header, so a broken DNS or a broken VIP does not make the check fail for the wrong reason. It verifies the certificate chain with `--cacert`, so an expired or mis-issued certificate makes the node unhealthy — which is the correct behaviour for a handover decision. It exits non-zero with a distinguishable log line, so the failure cause is in `journalctl` before anyone starts guessing.

```bash
#!/usr/bin/env bash
# /usr/local/bin/vrrp-check-pool.sh
# Purpose : is there at least ONE healthy application-tier node behind this proxy?
#           Prevents a proxy that can answer /healthz from holding the VIP while every
#           real request would 502.
# Exit    : 0 = at least one upstream answers, 1 = no upstream answers
set -euo pipefail

CAFILE="/etc/nginx/ssl/vp-root-ca.crt"
declare -A POOLS=(
  [weba]="10.10.90.21 10.10.90.22"
  [wp]="10.10.90.25 10.10.90.26"
)

healthy_total=0
for pool in "${!POOLS[@]}"; do
    healthy=0
    for ip in ${POOLS[$pool]}; do
        code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 \
                 --cacert "${CAFILE}" --resolve "upstream.local:443:${ip}" \
                 "https://upstream.local/" 2>/dev/null || true)"
        # Any HTTP status means the origin answered TLS and spoke HTTP. A 301/403/404 is a
        # healthy origin; only 000 (no response) is unhealthy.
        if [[ -n "${code}" && "${code}" != "000" ]]; then
            healthy=$((healthy + 1))
        fi
    done
    logger -t vrrp-check-pool -p daemon.info "pool ${pool}: ${healthy} healthy of 2"
    healthy_total=$((healthy_total + healthy))
done

if [[ "${healthy_total}" -eq 0 ]]; then
    logger -t vrrp-check-pool -p daemon.warning "UNHEALTHY: no upstream answered in any pool"
    exit 1
fi
exit 0
```

```bash
#!/usr/bin/env bash
# /usr/local/bin/vrrp-check-nftables.sh
# Purpose : prove the firewall host is actually enforcing a rule set before it holds the
#           egress VIP. A firewall that has flushed its ruleset and defaulted to ACCEPT is
#           worse than a firewall that is down, because nothing alarms.
# Exit    : 0 = healthy, 1 = unhealthy
set -euo pipefail

TABLE="inet fyp_filter"

if ! nft list table ${TABLE} >/dev/null 2>&1; then
    logger -t vrrp-check-nftables -p daemon.warning "UNHEALTHY: ${TABLE} is not loaded"
    exit 1
fi

rules="$(nft -a list table ${TABLE} 2>/dev/null | grep -c '^[[:space:]]*[a-z].*' || true)"
if [[ "${rules}" -lt 20 ]]; then
    logger -t vrrp-check-nftables -p daemon.warning \
        "UNHEALTHY: ${TABLE} contains only ${rules} rule lines (expected >= 20)"
    exit 1
fi

# The policies must still be drop. A ruleset that is present but permissive is the exact
# failure this check exists to catch.
for ch in input forward; do
    pol="$(nft list chain ${TABLE} ${ch} 2>/dev/null | grep -o 'policy [a-z]*' | awk '{print $2}' || true)"
    if [[ "${pol}" != "drop" ]]; then
        logger -t vrrp-check-nftables -p daemon.warning \
            "UNHEALTHY: chain ${ch} policy is '${pol}', expected 'drop'"
        exit 1
    fi
done

exit 0
```

```bash
#!/usr/bin/env bash
# /usr/local/bin/vrrp-check-egress.sh
# Purpose : prove the firewall host still has a usable path outward and a usable path inward.
#           Checks the neighbour reachability of the core (inward) and the ASA (outward).
# Exit    : 0 = healthy, 1 = unhealthy
set -euo pipefail

for peer in 10.10.50.1 10.10.50.2; do      # VP-HQ-CORE-01 gi0/1.50 and VP-HQ-FW-01 inside
    if ! ping -c 2 -W 1 -I ens192 "${peer}" >/dev/null 2>&1; then
        logger -t vrrp-check-egress -p daemon.warning "UNHEALTHY: no ICMP reply from ${peer}"
        exit 1
    fi
done

# IP forwarding must be on or this node cannot serve as a gateway at all.
if [[ "$(cat /proc/sys/net/ipv4/ip_forward)" != "1" ]]; then
    logger -t vrrp-check-egress -p daemon.warning "UNHEALTHY: net.ipv4.ip_forward is not 1"
    exit 1
fi

exit 0
```

Notification script, shared by both pairs. This is the mechanism that turns a silent failover into a monitorable event:

```bash
#!/usr/bin/env bash
# /usr/local/bin/vrrp-notify.sh
# Called by keepalived as: vrrp-notify.sh <GROUP|INSTANCE> <name> <STATE>
set -euo pipefail
TYPE="${1:-UNKNOWN}"; NAME="${2:-UNKNOWN}"; STATE="${3:-UNKNOWN}"
HOST="$(hostname -s)"
MSG="${HOST} keepalived ${TYPE} ${NAME} entered state ${STATE}"

logger -t vrrp-notify -p daemon.notice "${MSG}"
# Written to a durable file as well, because the failover evidence must survive a journal rotation.
printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${MSG}" >> /var/log/fyp/keepalived-transitions.log

# Forward to the syslog receiver on vpnz-mon01 so the transition lands in Loki and can be
# alerted on. Notifications are a local UDP send; nothing depends on the SMTP path below.
printf '<%d>%s %s\n' "$(( 16*8 + 5 ))" "${HOST}" "${MSG}" > /dev/udp/10.10.30.31/514 || true
exit 0
```

#### 8.4.4 Failover behaviour and tuning

| Parameter | Value used | What it actually controls |
|---|---|---|
| `advert_int` | `1` (second) | How often the master advertises. The backup declares the master dead after roughly `3 × advert_int + skew`, so the design expects **~3 seconds** of detection latency per pair. Shorter means faster failure detection and more VRRP chatter; 1 s is the standard compromise and is the value the report cites |
| `priority` | 150 master / 100 backup, both above 0 | Determines the election outcome when both nodes are visible. Equal priorities with different addresses are resolved by the highest primary IP, which is a fragile thing to rely on — hence the explicit 50-point gap |
| `preempt_delay` | `30` (seconds) | Prevents a just-rebooted master from instantly reclaiming the VIP. Without it, a node recovering from a crash causes a second, avoidable failover |
| `weight` on track scripts | `-30` (nftables check), `-60` (egress link), `-60` (nginx), `-20` (upstream pool) | The **arithmetic** matters more than the intent: nftables master 150 − 30 = 120, still above the backup's 100, so a failed ruleset check on the master does **not** trigger failover by itself. The nginx master 150 − 60 = 90, **below** the backup's 100, which does trigger a handover. This asymmetry is deliberate: a broken web proxy must lose the VIP, whereas a ruleset check failure is serious enough to alert but not automatically sufficient to hand the egress gateway to a peer that may have the same defect |
| `rise` / `fall` | `2` / `2` (nftables, nginx), `3` / `2` (upstream pool), `2` / `2` (egress) | Consecutive successes/failures required before the tracked state flips. `fall 2` with `interval 3` on the nginx check means a proxy must fail twice (≈6 s) before the weight is removed, which suppresses single-request blips. `rise 3` on the pool check prevents a flapping origin from marking the proxy healthy immediately |
| `vrrp_garp_interval` | `0.001` (1 ms) | Pacing between gratuitous ARP frames during a transition. A zero interval sends them as fast as the kernel can, which on a real segment can overflow a small switch's control-plane queue. 1 ms across a handful of ARPs is effectively instantaneous to the client and kind to the switch |
| `vrrp_gna_interval` | `0.000001` | Pacing for unsolicited IPv6 neighbour advertisements. IPv6 is disabled in this design, so this is present only for config portability — and the honest note is that it therefore has no measurable effect here |
| `smtp_alert` | enabled, `smtp_server 10.10.30.31` | Keepalived's built-in mail notification on transition. `[ASSUMPTION]` `vpnz-mon01` does not run an SMTP listener in the baseline design, so `smtp_alert` is likely to log a connection failure and **the durable notification path is the `logger`/file/UDP-syslog route in `vrrp-notify.sh`**, which is what the report relies on. If the group adds a mail relay this must be re-verified; if it does not, disabling `smtp_alert` and relying on `notify` is the cleaner configuration and the finding must be recorded either way |

**Gratuitous ARP behaviour and what it means for verification.** When a node becomes master it claims the VIP by broadcasting gratuitous ARP so that the upstream switch refreshes its MAC table. In this lab the "switch" is the hypervisor's virtual network, so the observable consequence is that the client's ARP cache for `10.10.90.10` changes MAC. That is the mechanism the failover test in §8.4.5 exploits: after a handover, `ip neigh show 10.10.90.10` on any guest on the same segment must show the **new** master's MAC, and if it still shows the old one, the ARP refresh did not happen and the client will blackhole traffic — a real and instructive failure mode recorded in §8.12.

#### 8.4.5 Verification

The procedure below is the exact sequence required as evidence. Run it on the **master of the nginx pair** (`vpnz-dmzrev01`) with a second SSH session on the backup and a third on a client host.

**Step 1 — establish the baseline state.**

```bash
# On vpnz-dmzrev01 AND vpnz-dmzrev02:
ip -br a show ens192
journalctl -u keepalived --since '-5min' --no-pager | tail -20
```

Expected on the master:

```text
ens192           UP             10.10.90.28/24 10.10.90.10/24
```
(note the VIP `10.10.90.10` present **in addition to** the node's own address), and in the journal:

```text
Oct 06 02:31:04 vpnz-dmzrev01 Keepalived_vrrp[1187]: (VI_WEB) Entering MASTER STATE
Oct 06 02:31:04 vpnz-dmzrev01 Keepalived_vrrp[1187]: (VI_WEB) setting protocol VIPs
Oct 06 02:31:04 vpnz-dmzrev01 Keepalived_vrrp[1187]: (VI_WEB) Sending gratuitous ARP on ens192 for 10.10.90.10
Oct 06 02:31:04 vpnz-dmzrev01 Keepalived_vrrp[1187]: (VI_WEB) Received advert from 10.10.90.29 with lower priority 100
```

Expected on the backup:

```text
ens192           UP             10.10.90.29/24
```
and:

```text
Oct 06 02:31:04 vpnz-dmzrev02 Keepalived_vrrp[1092]: (VI_WEB) Entering BACKUP STATE
```

`[RESOLVED by Rev 1.1 ruling C-02]` The collision this note flags is fixed: `vpnz-dmzrev01 = 10.10.90.28`, `vpnz-dmzrev02 = 10.10.90.29`, and `10.10.90.10` is the keepalived VIP **only** and is owned by no node. The pair therefore runs in ordinary, non-owner VRRP mode and the failover evidence is unambiguous: before the test `ip -br a` on the master shows `10.10.90.28/24` plus the VIP `10.10.90.10/24`, the backup shows only `10.10.90.29/24`; after the handover the VIP appears on the former backup and disappears from the former master. The earlier owner-address caveat and the instruction to determine which address sits on which node are withdrawn, but the before-capture must still be taken, because that capture is the evidence the move happened. The original note began: the baseline records `vpnz-dmzrev01 = 10.10.90.10 (VIP 10.10.90.10)` and `vpnz-dmzrev02 = 10.10.90.11`. That means the master's *own* address is the same address that the pair advertises as the VIP, which is legal — a VRRP owner address — but it changes the failover semantics slightly: on the master, `ip -br a` will show the address once (owner mode) rather than twice, and the "VIP moved" evidence is therefore the **absence** of `10.10.90.10` on the backup before the test and its **presence** after. The builder must record which of the two addresses appears on which node before running any failover test, or the evidence will be uninterpretable.

**Step 2 — start a continuity probe.** A single `curl` proves nothing; a loop proves that service was continuous across the transition.

```bash
# On a client host that can reach the DMZ VIP (e.g. the hypervisor host or vpnz-dmzjump01):
while true; do
  printf '%s %s\n' "$(date -u +%H:%M:%S)" \
    "$(curl -s -o /dev/null -w '%{http_code} %{time_total}s' \
        --cacert /etc/nginx/ssl/vp-root-ca.crt -H 'Host: portal.vertexpeak.example' \
        https://10.10.90.10/healthz || echo FAIL)"
  sleep 0.5
done | tee /var/log/fyp/failover-continuity.log
```

**Step 3 — break the master's Nginx.** This is the *service* failure the track script exists to catch, and it is the more interesting test.

```bash
# On vpnz-dmzrev01 (the current master):
sudo systemctl stop nginx
sudo /usr/local/bin/vrrp-check-nginx.sh ; echo "exit=$?"
```

Expected immediately after the stop:

```text
Oct 06 02:35:12 vpnz-dmzrev01 vrrp-check-nginx[2244]: UNHEALTHY: https://vpnz-dmzrev01.vertexpeak.fyp.lab/healthz returned '000' (expected 200)
exit=1
```

**Step 4 — watch the VIP leave the master.** Because `chk_nginx` has `interval 3`, `fall 2` and `weight -60`, the transition should occur within roughly 6–8 seconds, and `preempt_delay` does not apply on the way out.

```bash
ip -br a show ens192 ; echo '---' ; journalctl -u keepalived -f
```

Expected on `vpnz-dmzrev01`:

```text
Oct 06 02:35:18 vpnz-dmzrev01 Keepalived_vrrp[1187]: (VI_WEB) Track script chk_nginx is FAULT state, priority 90
Oct 06 02:35:18 vpnz-dmzrev01 Keepalived_vrrp[1187]: (VI_WEB) Entering BACKUP STATE
Oct 06 02:35:18 vpnz-dmzrev01 Keepalived_vrrp[1187]: (VI_WEB) removing VIPs.
```

and the new interface state, with the VIP gone:

```text
ens192           UP             10.10.90.29/24
```

Expected on `vpnz-dmzrev02`:

```text
Oct 06 02:35:18 vpnz-dmzrev02 Keepalived_vrrp[1092]: (VI_WEB) Receive advertisement timeout
Oct 06 02:35:18 vpnz-dmzrev02 Keepalived_vrrp[1092]: (VI_WEB) Entering MASTER STATE
Oct 06 02:35:18 vpnz-dmzrev02 Keepalived_vrrp[1092]: (VI_WEB) setting protocol VIPs
Oct 06 02:35:18 vpnz-dmzrev02 Keepalived_vrrp[1092]: (VI_WEB) Sending gratuitous ARP on ens192 for 10.10.90.10
```

```bash
# On vpnz-dmzrev02:
ip -br a show ens192
# Expected: ens192 UP 10.10.90.29/24 10.10.90.10/24   <- the backup's own address plus the VIP that has arrived
```

**Step 5 — confirm the client followed the move.** This is the step that separates "the VIP moved" from "the service is still reachable".

```bash
# On the client host:
ip neigh show 10.10.90.10
arping -c 3 -I <client-iface> 10.10.90.10
tail -5 /var/log/fyp/failover-continuity.log
```

Expected client timeline — a short failure window bounded by the detection interval, then recovery:

```text
02:35:17 200 0.0041s
02:35:17 200 0.0038s
02:35:18 000 3.0012s     <- FAIL: VIP in transit
02:35:19 000 3.0010s
02:35:19 200 0.0092s     <- recovered against vpnz-dmzrev02
02:35:20 200 0.0044s
```

**This is the honest result the report must present**: a Keepalived VRRP pair with a service track script does not give zero-downtime; it gives a **bounded interruption of approximately the detection interval plus ARP convergence time**, here in the region of 3–8 seconds. Claiming "no downtime" would be false, and the measured number with its log is a stronger academic result than a vague assertion. The continuity log, the two `journalctl` excerpts, both `ip -br a` outputs and the `ip neigh` output are the five required screenshots for this test.

**Step 6 — restore the master and observe fail-back.**

```bash
# On vpnz-dmzrev01:
sudo systemctl start nginx
sudo /usr/local/bin/vrrp-check-nginx.sh ; echo "exit=$?"
systemctl status nginx --no-pager | head -4
# Watch for the FAULT track script returning to OK and the priority going back to 150
journalctl -u keepalived -f
```

Expected:

```text
Oct 06 02:38:02 vpnz-dmzrev01 Keepalived_vrrp[1187]: (VI_WEB) Track script chk_nginx is OK, priority 150
```

Then, after `preempt_delay 30` elapses (30 seconds — the deliberate wait that prevents a flapping node from thrashing the VIP):

```text
Oct 06 02:38:32 vpnz-dmzrev01 Keepalived_vrrp[1187]: (VI_WEB) Entering MASTER STATE
Oct 06 06:38:32 vpnz-dmzrev01 Keepalived_vrrp[1187]: (VI_WEB) Sending gratuitous ARP on ens192 for 10.10.90.10
Oct 06 02:38:33 vpnz-dmzrev02 Keepalived_vrrp[1092]: (VI_WEB) Entering BACKUP STATE
```

```bash
# On the client: the continuity log should show a second, similar interruption at fail-back.
grep -n ' 000 ' /var/log/fyp/failover-continuity.log
# Expected: two short blocks of 000 lines, one at the failover and one at the fail-back.
```

**Step 7 — repeat the whole sequence on the nftables pair.** The procedure is identical on `vpnz-nft01`/`vpnz-nft02`, but the service under test is the ruleset rather than Nginx, and the client-side test is a forwarded flow rather than an HTTPS request:

```bash
# On vpnz-nft01 (master of vrid 51):
sudo nft flush ruleset                       # simulate the catastrophic loss of the ruleset
sudo /usr/local/bin/vrrp-check-nftables.sh ; echo "exit=$?"
# Expected log line:
#   vrrp-check-nftables[...]: UNHEALTHY: inet fyp_filter is not loaded
#   exit=1
journalctl -u keepalived -n 20 --no-pager
# Expected: "Track script chk_nftables is FAULT state, priority 120"
# NOTE: priority 120 is still above the peer's 100, so the VIP does NOT move. This is the designed
# asymmetric behaviour described in §8.4.4 and must be captured as evidence of intent, not as a bug.

# Restore immediately, then force a genuine failover to prove the VIP can move at all:
sudo nft -f /etc/nftables.conf
sudo systemctl stop keepalived               # cleanest way to force a real handover
# On vpnz-nft02: expect "(VI_EGRESS) Entering MASTER STATE" and the VIP 10.10.50.10 to appear.
ip -br a show ens192
```

A clean stop of `keepalived` causes the master to *withdraw* its advertisements rather than stop sending them, so the backup promotes almost immediately (a priority-0 advertisement). That is faster than the timeout path and produces a different journal line — `(VI_EGRESS) Sent 0 priority advert` — which is worth capturing because it demonstrates that the implementation distinguishes an orderly shutdown from a crash.

**Evidence summary for this sub-section** (each is a named screenshot, per the HDTN brief's screen-capture requirement — not a WorldSkills requirement): (1) `ip -br a` on the master before the test; (2) `ip -br a` on the backup before the test; (3) the `systemctl stop nginx` and failing track-script run; (4) `journalctl -u keepalived` showing the state transition in both directions; (5) `ip -br a` on the new master showing the VIP; (6) the continuity `curl` log showing the interruption window; (7) `ip neigh show 10.10.90.10` proving the ARP cache followed; (8) the same sequence for the nftables pair with `nft flush ruleset`.

### 8.5 nftables Firewall and Edge Routing

#### 8.5.1 Design

The nftables pair `vpnz-nft01` / `vpnz-nft02` sits **inline** between the HQ core and the ASA perimeter firewall, on the transit segment `10.10.50.0/28` (VLAN 50 `TRANSIT-EGRESS`, `Z-EGRESS`). Its position is the whole point of the design: every packet from `Z-USER` or `Z-SERVER` toward the Internet must traverse it, so it is the single chokepoint where egress is filtered, attributed to a source, network-translated and logged. Each node has two NICs (`VNET-EGRESS` and `VNET-WAN`) — the WAN-side NIC carries `10.10.200.2/24` on `vpnz-nft01` and `10.10.200.3/24` on `vpnz-nft02` per Rev 1.1 ruling C-07 — which is the closest faithful approximation available for a real in-line bump-in-the-wire; the honest framing is that the segmentation outcome is real while the mechanism is emulated.

This is a **deliberate two-firewall design**: the ASA `VP-HQ-FW-01` owns the DMZ boundary and the public edge, and the nftables pair re-applies policy at a second layer inside it. It is not accidental duplication and must be presented as policy-a-second-time. The split is also a design consequence of the tools available: Packet Tracer's ASA can enforce the DMZ ACLs and NAT, but it cannot log to a file, cannot run a stateful filter with `sets`, and cannot be scripted from Ansible — so the Linux pair carries the parts of the policy that need those properties.

**Trust zones and this device's responsibilities** (from the normative trust-boundary table):

| Rule ID | From → To | Verdict | How nftables implements it |
|---|---|---|---|
| TB-01 | `Z-USER` (VLAN 10/30/40) → `Z-SERVER` (VLAN 60/80) | REVIEW | Not this device: that traffic stays inside the core and never reaches `Z-EGRESS`. Stated so the boundary between devices is unambiguous |
| TB-02 | `Z-USER` → Internet | REVIEW | `forward` chain, `iifname "ens192"` from `10.10.40.0/23` to `wan4`: TCP 80/443, DNS to the DCs, NTP to the DCs, ICMP; everything else logged and dropped with `NFT-DROP: TB-02 ` |
| TB-03 | `Z-SERVER` → Internet | REVIEW | `10.10.30.0/24` and `10.10.80.0/24` → `wan4`: TCP 443 (patches, Git), NTP, DNS to the DCs, ICMP. Attributed by source IP and logged |
| TB-04 | `Z-DMZ` → `Z-SERVER` / `Z-USER` | **DENY** | Explicit logged drop, prefix `NFT-DROP: TB-04 `, and it is placed **before** any permit that could match a DMZ source |
| TB-05 | Internet → `Z-DMZ` | REVIEW | NAT prerouting DNAT for `198.51.100.2:80,443` only, then forward permits `dmz4` on 443/80 |
| TB-06 | Internet → `Z-SERVER` / `Z-USER` | **DENY** | No prefix in `lan4` is advertised, DNAT'd or permitted from `wan4`; the catch-all logged drop is the enforcement |
| TB-07 | `Z-MGMT` → every zone | PERMIT | `iifname "ens192"` from `mgmt4` to any `lan4`: TCP 22, 3389, 5985, 5986, 6516, UDP 161, 514. Management is allowed, everything else from management is not |
| TB-08 | every zone → `Z-MGMT` | REVIEW | Only UDP 514 (syslog) and UDP 161/162 (SNMP) from enumerated device addresses to `vpnz-mon01` |
| TB-09 / TB-10 | `Z-STUDENT` → anything / Internet | **DENY** | `10.70.0.0/16` has no prefix in any set and no route through this device; the catch-all drop is the enforcement, with prefix `NFT-DROP: TB-09 ` on an explicit early rule so the denial is attributable |
| TB-11 / TB-12 | `Z-REMOTE` → `Z-SERVER` / `Z-MGMT` | REVIEW / **DENY** | VPN pool prefixes appear in `vpn4`; `vpn4 → mgmt4` has an explicit logged drop with prefix `NFT-DROP: TB-12 ` |
| TB-13 | `Z-DMZ` → Internet | REVIEW | `iifname "ens192"` from `dmz4` → `wan4`: TCP 443 and DNS only, and only from the three enumerated DMZ source addresses |
| TB-14 | `Z-WAN` branch routers → `Z-MGMT` | **DENY** | `wan4 → mgmt4` is not permitted anywhere; explicit logged drop with prefix `NFT-DROP: TB-14 ` |
| TB-15 | `Z-MGMT` → `Z-DMZ` for management | REVIEW | Management of DMZ hosts only through `vpnz-dmzjump01` (`10.10.90.27`); the pair permits `mgmt4 → 10.10.90.27` on 22 only |
| TB-16 | `vpnz-ai01` → monitored devices | REVIEW | Read-only poll from `10.10.30.51` to the enumerated management ports; no write path exists in the rule set |

**NAT summary.** Prerouting DNAT for the published services (documentation addresses only, from the RFC 5737 range), postrouting masquerade on the outbound path so that internal addresses are never exposed, and **hairpin NAT is deliberately not configured** — internal clients reaching the published names resolve them through split-horizon DNS to the internal VIP (`10.10.90.10`), so a hairpin rule would be dead configuration that only obscures the design.

#### 8.5.2 The complete rule set

The rule set is one ruleset in one `inet` table, `fyp_filter`, as the naming contract fixes. It is split into include fragments under `/etc/nftables.d/` so that the sections can be reviewed independently — but the fragments are `include`d and **never independently loaded**, because nftables is atomic per table: loading a fragment alone would flush and replace rules the author did not intend to touch. Each fragment declares its own chains and only *adds* rules to chains declared in `10-sets.nft`.

```nftables
# --- 1 of 6 -------------------------------------------------------------------
# /etc/nftables.d/10-sets.nft  —  table, chains, sets and named sets
# Loaded by /etc/nftables.conf via `include "/etc/nftables.d/*.nft"`. NEVER load this file alone.
# Verify with:  nft -c -f /etc/nftables.conf   then   nft list ruleset

flush ruleset                 # start from a known-empty state; the file is the single source of truth

table inet fyp_filter {
    # ---- named sets: service groups referenced by rule, so a port change is a one-line edit ----
    set svc_web       { type inet_service;  elements = { 80, 443 } }                      # HTTP/HTTPS
    set svc_mgmt      { type inet_service;  elements = { 22, 3389, 5985, 5986, 6516 } }   # SSH/RDP/WinRM/WAC
    set svc_dns       { type inet_service;  elements = { 53 } }                           # DNS, tcp+udp
    set svc_syslog    { type inet_service;  elements = { 514 } }                          # syslog receiver

    # ---- IPv4 sets: the identity of every zone that this device must reason about ----
    set mgmt4 {
        type ipv4_addr; flags interval;
        elements = {
            10.20.20.0/24,      # VLAN 20 MGMT-OOB : hypervisor host, switch management, vpnz-jump01
            10.10.30.31         # vpnz-mon01 : automation and monitoring control node
        }
        comment "Z-MGMT : the highest restricted zone"
    }
    set lan4 {
        type ipv4_addr; flags interval;
        elements = {
            10.10.10.0/24,      # VLAN 10 LAN-HQ-CORE
            10.10.30.0/24,      # VLAN 30 SRV-HQ-1
            10.10.40.0/23,      # VLAN 40 USER-HQ-STF
            10.10.45.0/24,      # VLAN 45 VOICE-HQ
            10.10.80.0/24,      # VLAN 80 STORAGE-HQ
            10.10.110.0/24,     # Kwun Tong
            10.10.111.0/24,
            10.10.112.0/24,
            10.10.113.0/24,
            10.10.120.0/24,     # Macau
            10.10.121.0/24,
            10.10.130.0/24,     # Wan Chai
            10.10.131.0/24
        }
        comment "all internal LAN space that may legitimately reach the Internet"
    }
    set dmz4 {
        type ipv4_addr; flags interval;
        elements = {
            10.10.90.0/24       # VLAN 90 DMZ-HQ : the whole DMZ, internally untrusted
        }
        comment "Z-DMZ : externally reachable, internally untrusted"
    }
    set vpn4 {
        type ipv4_addr; flags interval;
        elements = {
            10.10.201.0/24,     # RRAS IKEv2 remote-access pool
            10.10.202.0/24,     # OpenVPN pool
            10.10.200.64/26     # WireGuard remote-worker pool
        }
        comment "Z-REMOTE : authenticated remote access pools"
    }
    set wan4 {
        type ipv4_addr; flags interval;
        elements = {
            0.0.0.0/0
        }
        comment "Z-WAN : the Internet. Kept as a named set so the direction of a rule is readable"
    }

    # ---- server identities used by the permit rules (exact, from the static host table) ----
    set dns_servers   { type ipv4_addr; elements = { 10.10.30.11, 10.10.30.12 } }
    set ntp_servers   { type ipv4_addr; elements = { 10.10.30.11, 10.10.30.12 } }
    set log_receiver  { type ipv4_addr; elements = { 10.10.30.31 } }
    set dmz_mgmt_path { type ipv4_addr; elements = { 10.10.90.27 } }   # vpnz-dmzjump01
    set dmz_egress_ok { type ipv4_addr; elements = { 10.10.90.28, 10.10.90.29, 10.10.90.21, 10.10.90.22 } }

    # ---- the blocklist: addressed dynamically by fail2ban-style tooling and by the AI line ----
    set blocklist {
        type ipv4_addr;
        flags timeout, dynamic;
        timeout 1h;
        comment "sources to drop outright; entries added by tooling, never hand-edited in production"
    }

    # ---- conntrack helpers (a named set of the helper names is not needed; declared per rule) ----

    # =============================================================================
    # CHAINS
    # =============================================================================
    # input: traffic addressed TO this firewall host.
    # priority filter + policy drop: the default is to refuse everything not explicitly permitted.
    chain input {
        type filter hook input priority filter; policy drop;

        # 1. Loopback is always permitted: systemd-resolved, nginx stub_status and local tooling need it.
        iifname "lo" counter accept comment "loopback"

        # 2. Stateful shortcut. Without this, return traffic for permitted outbound connections
        #    would be dropped by the policy and every service would appear broken.
        ct state established,related counter accept comment "existing flows in either direction"
        ct state invalid counter drop comment "invalid conntrack state - drop before anything else reads it"

        # 3. Ping the firewall itself, rate limited. Useful for the keepalived track script and for
        #    monitoring; unlimited ICMP is an amplification and exhaustion vector.
        ip protocol icmp icmp type { echo-request } limit rate 10/second burst 20 packets \
            counter accept comment "rate-limited ICMP echo to the firewall"

        # 4. Blocklisted sources are refused before any service rule can be reached.
        ip saddr @blocklist counter log prefix "NFT-DROP: BLOCKLIST in " level warn counter drop

        # 5. Management plane. SSH from Z-MGMT and from the monitoring control node only; the
        #    per-host sshd AllowGroups directive is the second control.
        iifname "ens192" ip saddr @mgmt4 tcp dport 22 ct state new \
            counter accept comment "TB-07 SSH administration from the management zone"

        # 6. Syslog from every managed device, and SNMP polling from the monitoring node only.
        udp dport 514 ip saddr @mgmt4 counter accept comment "TB-08 syslog from mgmt"
        iifname "ens192" udp dport 514 counter accept comment "TB-08 syslog from the internal estate"
        ip saddr 10.10.30.31 udp dport 161 counter accept comment "TB-08 SNMPv3 polling from vpnz-mon01"
        udp dport 162 ip saddr 10.10.30.31 counter accept comment "TB-08 SNMP traps to vpnz-mon01"

        # 7. NTP as a client of the domain controllers only.
        ip saddr @ntp_servers udp dport 123 counter accept comment "time from the authoritative DCs"

        # 8. DNS responses for the firewall host's own resolution (queries are permitted in output).
        ip saddr @dns_servers ct state established counter accept comment "DNS replies from the DCs"

        # 9. WireGuard on the two ports the design uses: UDP 443 for the site and remote tunnels and
        #    UDP 51820 for the documented out-of-band management escape hatch. TB-06 permits exactly
        #    these because they are the only Internet-reachable services on this pair.
        udp dport 443 iifname "ens224" counter accept comment "WG-HQ-WC and WireGuard remote workers"
        udp dport 51820 iifname "ens224" ip saddr 10.10.30.31 counter accept comment "MGMT-TUNNEL from vpnz-mon01"

        # 10. VRRP protocol traffic between the pair. VRRP is IP protocol 112 and uses multicast
        #     224.0.0.18; it must never be permitted from outside the pair's own segment.
        iifname "ens192" ip protocol vrrp ip saddr { 10.10.50.11, 10.10.50.12 } \
            counter accept comment "VRRP advertisements and priority-0 withdraws between the pair"
        ip protocol vrrp ip saddr != { 10.10.50.11, 10.10.50.12 } \
            counter log prefix "NFT-DROP: VRRP-SPOOF " level warn counter drop

        # 11. Everything else to the firewall is dropped AND logged, so an unlisted service attempt
        #     leaves a trace instead of disappearing.
        counter log prefix "NFT-DROP: INPUT " level warn counter drop
    }

    # forward: traffic TRANSITING this device. This is the core of the design.
    chain forward {
        type filter hook forward priority filter; policy drop;

        # --- stateful baseline (must be first: see the pitfalls in §8.5.7) ---
        ct state established,related counter accept comment "return traffic for permitted flows"
        ct state invalid counter log prefix "NFT-DROP: INVALID " level warn counter drop

        # --- blocklist is consulted before any zone policy ---
        ip saddr @blocklist counter log prefix "NFT-DROP: BLOCKLIST fwd " level warn counter drop

        # =========================================================================
        # FORBIDDEN DIRECTIONS, logged FIRST so they can never be shadowed by a permit.
        # Each has a DISTINGUISHABLE log prefix, which is what makes the denial
        # attributable to a single TB row in the evidence capture.
        # =========================================================================

        # TB-04 : the DMZ must never initiate toward the internal network, for any protocol.
        iifname "ens192" ip saddr @dmz4 ip daddr @lan4 \
            counter log prefix "NFT-DROP: TB-04 " level warn counter drop

        # TB-06 : the Internet must never reach a server or a user host. Only the two VPN endpoints
        #         and the reverse proxy are Internet-reachable, and those arrive by DNAT to the DMZ.
        iifname "ens224" ip saddr @wan4 ip daddr @lan4 \
            counter log prefix "NFT-DROP: TB-06 " level warn counter drop

        # TB-09 : the isolated student/lab segment is denied everything off-segment by design.
        ip saddr 10.70.0.0/16 ip daddr != 10.70.0.0/24 \
            counter log prefix "NFT-DROP: TB-09 " level warn counter drop

        # TB-12 : VPN users are never administrators of infrastructure.
        ip saddr @vpn4 ip daddr @mgmt4 \
            counter log prefix "NFT-DROP: TB-12 " level warn counter drop

        # TB-14 : branch routers must not reach the management zone.
        iifname "ens224" ip daddr @mgmt4 \
            counter log prefix "NFT-DROP: TB-14 " level warn counter drop

        # =========================================================================
        # PERMITTED DIRECTIONS
        # =========================================================================

        # --- TB-07 : management zone may administer everything, on management protocols only ---
        iifname "ens192" ip saddr @mgmt4 tcp dport @svc_mgmt counter accept comment "TB-07 management protocols"
        iifname "ens192" ip saddr @mgmt4 icmp type { echo-request } counter accept comment "TB-07 ICMP for reachability tests"

        # --- TB-15 : DMZ management is possible only through vpnz-dmzjump01 ---
        iifname "ens192" ip saddr @mgmt4 ip daddr @dmz_mgmt_path tcp dport 22 \
            counter accept comment "TB-15 the only management path into the DMZ is the jump host"

        # --- TB-01 : user and server zones reaching server services ---
        ip saddr { 10.10.40.0/23, 10.10.10.0/24 } ip daddr @dns_servers udp dport 53 counter accept comment "TB-01 DNS udp"
        ip saddr { 10.10.40.0/23, 10.10.10.0/24 } ip daddr @dns_servers tcp dport 53 counter accept comment "TB-01 DNS tcp"
        ip saddr { 10.10.40.0/23, 10.10.10.0/24 } ip daddr @dns_servers tcp dport { 88, 389, 445 } counter accept comment "TB-01 Kerberos, LDAP, SMB to the DCs"
        ip saddr { 10.10.40.0/23, 10.10.10.0/24 } ip daddr 10.10.30.31 tcp dport 443 counter accept comment "TB-01 HTTPS to the monitoring host"
        ip saddr { 10.10.40.0/23, 10.10.10.0/24 } ip daddr @dns_servers tcp dport 53 counter accept comment "TB-01 zone transfer path (AXFR restricted to the DCs at the server)"

        # --- TB-11 : VPN clients reach server services, and RDP only to the platform tier ---
        ip saddr @vpn4 ip daddr @dns_servers udp dport 53 counter accept comment "TB-11 DNS for VPN clients"
        ip saddr @vpn4 ip daddr @dns_servers tcp dport { 53, 88, 389, 445 } counter accept comment "TB-11 directory and file services"
        ip saddr @vpn4 ip daddr { 10.10.30.11, 10.10.30.12, 10.10.30.21 } tcp dport 3389 counter accept comment "TB-11 RDP to the platform tier for the professional-services group"

        # --- TB-05 : the Internet reaches the DMZ web tier only, over the published ports ---
        iifname "ens224" ip saddr @wan4 ip daddr @dmz4 tcp dport @svc_web counter accept comment "TB-05 published portal and blog"
        iifname "ens224" ip saddr @wan4 ip daddr @dmz4 icmp type { echo-request } limit rate 10/second burst 20 packets counter accept comment "TB-05 rate-limited ICMP to the DMZ"

        # --- TB-13 : the DMZ fetches patches and resolves names, outbound only, from named hosts ---
        iifname "ens192" ip saddr @dmz_egress_ok ip daddr @wan4 tcp dport 443 counter accept comment "TB-13 DMZ package and patch retrieval"
        iifname "ens192" ip saddr @dmz_egress_ok ip daddr @dns_servers udp dport 53 counter accept comment "TB-13 DMZ DNS"
        iifname "ens192" ip saddr @dmz_egress_ok ip daddr @dns_servers tcp dport 53 counter accept comment "TB-13 DMZ DNS over TCP"

        # --- TB-02 : user zones to the Internet, on the four permitted protocols only ---
        iifname "ens192" ip saddr 10.10.40.0/23 ip daddr @wan4 tcp dport { 80, 443 } ct state new counter accept comment "TB-02 user web browsing"
        iifname "ens192" ip saddr 10.10.40.0/23 ip daddr @dns_servers udp dport 53 counter accept comment "TB-02 user DNS via the internal resolver"
        iifname "ens192" ip saddr 10.10.40.0/23 ip daddr @wan4 icmp type { echo-request } counter accept comment "TB-02 ICMP echo"
        iifname "ens192" ip saddr 10.10.40.0/23 ip daddr @wan4 counter log prefix "NFT-DROP: TB-02 " level warn counter drop

        # --- TB-03 : server zones to the Internet for patching and Git, attributed and logged ---
        ip saddr { 10.10.30.0/24, 10.10.80.0/24 } ip daddr @wan4 tcp dport 443 counter accept comment "TB-03 package, patch and Git"
        ip saddr { 10.10.30.0/24, 10.10.80.0/24 } ip daddr @dns_servers udp dport 53 counter accept comment "TB-03 DNS via the DCs"
        ip saddr { 10.10.30.0/24, 10.10.80.0/24 } ip daddr @wan4 icmp type { echo-request } counter accept comment "TB-03 ICMP echo"
        ip saddr { 10.10.30.0/24, 10.10.80.0/24 } ip daddr @wan4 counter log prefix "NFT-DROP: TB-03 " level warn counter drop

        # --- TB-16 : the AI agent polls read-only, and can never write ---
        ip saddr 10.10.30.51 ip daddr @mgmt4 tcp dport 22 counter accept comment "TB-16 read-only SSH polling from the agent"
        ip saddr 10.10.30.51 tcp dport { 161, 5986, 443 } counter accept comment "TB-16 read-only SNMP, WinRM and HTTPS polling"
        ip saddr 10.10.30.51 tcp dport != { 161, 5986, 443, 22 } counter log prefix "NFT-DROP: TB-16-WRITE " level warn counter drop comment "any other port from the agent is a policy violation"

        # --- intra-zone transit through the pair (for the DMZ management path and VRRP-adjacent traffic) ---
        iifname "ens192" oifname "ens192" ip saddr @dmz4 ip daddr @dmz4 counter accept comment "intra-DMZ transit, no policy relaxation"

        # =========================================================================
        # CATCH-ALL: nothing that reached this point was permitted by policy.
        # =========================================================================
        counter log prefix "NFT-DROP: FORWARD " level warn counter drop
    }

    # =========================================================================
    # NAT
    # =========================================================================
    chain nat_prerouting {
        type nat hook prerouting priority dstnat; policy accept;

        # TB-05 : published portal. 198.51.100.2:80,443 -> the reverse-proxy VIP 10.10.90.10.
        # Every DNAT target below is taken from the public addressing table; no real public address
        # exists anywhere in this project.
        iifname "ens224" ip daddr 198.51.100.2 tcp dport { 80, 443 } \
            dnat to 10.10.90.10 comment "portal.vertexpeak.example -> nginx VIP"

        # TB-05 : published www. 198.51.100.3:443 -> the IIS application tier node 1.
        # Node 2 is reached through the proxy pool, not by a second public address, so the
        # published surface stays one address per service.
        iifname "ens224" ip daddr 198.51.100.3 tcp dport 443 \
            dnat to 10.10.90.21 comment "www.vertexpeak.example -> vpnz-dmzweba01"

        # TB-05 : published blog. 198.51.100.4:443 -> WordPress node 1.
        iifname "ens224" ip daddr 198.51.100.4 tcp dport 443 \
            dnat to 10.10.90.25 comment "blog.vertexpeak.example -> vpnz-dmzwp01"

        # TB-06 : the VPN front door. 198.51.100.5 -> the nftables VIP, then by port to the host.
        iifname "ens224" ip daddr 198.51.100.5 udp dport 1194 \
            dnat to 10.10.30.42:1194 comment "198.51.100.5:1194/udp -> vpnz-lnxra01 OpenVPN"
        iifname "ens224" ip daddr 198.51.100.5 udp dport 4500 \
            dnat to 10.10.30.41:4500 comment "198.51.100.5:4500/udp -> vpnz-rras01 IKEv2 NAT-T"
        iifname "ens224" ip daddr 198.51.100.5 udp dport 500 \
            dnat to 10.10.30.41:500 comment "198.51.100.5:500/udp -> vpnz-rras01 IKEv2"

        # WireGuard is NOT DNAT'd: the tunnel terminates on the VIP owner itself
        # (10.10.50.10, floating between 10.10.50.11 and 10.10.50.12), so its UDP 443 is handled
        # by the input chain above. Documenting the absence prevents a future "missing rule" bug.
    }

    chain nat_postrouting {
        type nat hook postrouting priority srcnat; policy accept;

        # Outbound masquerade toward the ASA. Every internal address is hidden behind the
        # egress path, so no internal prefix is ever exposed to the WAN side.
        oifname "ens224" ip saddr @lan4 masquerade comment "TB-02/TB-03 egress masquerade for LAN sources"
        oifname "ens224" ip saddr @dmz4  masquerade comment "TB-13 egress masquerade for DMZ patch retrieval, from the enumerated hosts only"
    }

    # ---- chain used by rules that need a scoped, rate-limited drop log ----
    # DECLARED HERE, in the same fragment as the other chains, and NOT in the logging fragment.
    # nftables parses a ruleset in order, so a chain must exist before any rule can jump to it;
    # keeping all chain declarations in one place removes that ordering constraint entirely.
    # The RULES for this chain live in 90-logging.nft, which is loaded after this file.
    chain log_dropped {
        limit rate 10/minute burst 20 packets \
            log prefix "NFT-DROP: RATELIMITED " level warn
        counter drop
    }
}
```

The include file that ties it together, which is also the file systemd loads:

```nftables
# /etc/nftables.conf  —  Vertex Peak FYP egress firewall
# Applied by:  sudo nft -c -f /etc/nftables.conf      (syntax check, no change)
#              sudo nft -f /etc/nftables.conf         (apply)
# Persisted by: systemctl enable --now nftables       (loads this file at boot)
#              plus the project's atomic wrapper  04-automation/bash/02-nftables-apply.sh
#                                                    which arms a revert timer before applying

#!/usr/sbin/nft -f

include "/etc/nftables.d/10-sets.nft"        # table, chains, sets (must be first: it declares them)
include "/etc/nftables.d/20-filter-input.nft"
include "/etc/nftables.d/30-filter-forward.nft"
include "/etc/nftables.d/40-nat.nft"
include "/etc/nftables.d/90-logging.nft"     # log rate limits and the log_dropped chain
```

`[ASSUMPTION]` on the fragment split: the five filenames are fixed by the baseline's configuration-path table, but the baseline does **not** state which rules live in which fragment. The allocation above (sets, input, forward, nat, logging) is the natural reading and is what the Ansible role `roles/nftables/` should generate from `templates/nftables.conf.j2`. If the group chooses a different split, the baseline must be revised — the fragment *names* are contract, the *contents* are not.

#### 8.5.3 Applying and persisting

```bash
# 1. Syntax check. This parses the whole file, including every include, and changes nothing.
#    Run it after EVERY edit. It is the single highest-value habit in this sub-section.
sudo nft -c -f /etc/nftables.conf
# Expected on success: no output and exit status 0.
# Expected on failure: a file, line and column, e.g.
#   /etc/nftables.d/30-filter-forward.nft:118:9-18: Error: unknown keyword
echo "exit=$?"
```

```bash
# 2. Apply. Because the file begins with `flush ruleset`, this is atomic per table and is fully
#    declarative: whatever was loaded before is replaced.
sudo nft -f /etc/nftables.conf
sudo nft list ruleset | head -20
```

```bash
# 3. Persistence at boot. `systemctl enable --now nftables` both applies the file now and loads
#    it at every boot via /lib/systemd/system/nftables.service, which runs
#    `/usr/sbin/nft -f /etc/nftables.conf`. There is no separate save step and no nftables.dump:
#    the file IS the state.
sudo systemctl enable --now nftables
systemctl status nftables --no-pager | head -6
systemctl is-enabled nftables        # expected: enabled
```

```bash
# 4. Prove persistence rather than assuming it: flush, reboot, and check that the ruleset returned.
sudo nft flush ruleset
sudo nft list ruleset | wc -l        # expected: 0
sudo reboot
# After the reboot:
sudo nft list ruleset | head -5
systemctl is-active nftables         # expected: active
```

**The lockout risk and its mitigation.** This is the one configuration in the whole Linux estate that can make a remote VM permanently unreachable: a mistake in the `input` chain drops the administrator's own SSH session, and if the ruleset is also the boot ruleset, the mistake survives the reboot. Two protections are mandatory and both are demonstrated as evidence.

First, an atomic apply wrapper with a revert timer, which is the mitigation the baseline names (`04-automation/bash/02-nftables-apply.sh`, arming an `at`-style revert):

```bash
#!/usr/bin/env bash
# 04-automation/bash/02-nftables-apply.sh
# Apply a candidate ruleset with an automatic rollback if the operator does not confirm.
# Usage: sudo ./02-nftables-apply.sh /etc/nftables.conf [revert-seconds]
set -euo pipefail

CANDIDATE="${1:-/etc/nftables.conf}"
REVERT_SECONDS="${2:-120}"
STAMP="$(date +%Y%m%d-%H%M%S)"
CONFIRM="/tmp/nft-apply-confirm.$$"

# 1. Always have a rollback artefact before touching anything.
sudo nft list ruleset > "/etc/nftables.d/rollback-${STAMP}.nft"
echo "[i] rollback captured: /etc/nftables.d/rollback-${STAMP}.nft"

# 2. Syntax check the candidate. Never apply a file that does not parse.
sudo nft -c -f "${CANDIDATE}" || { echo "[!] syntax check FAILED, nothing applied"; exit 1; }

# 3. Arm the revert. cmd_at/atd must be installed (apt install at && systemctl enable --now atd).
sudo systemd-run --on-active="${REVERT_SECONDS}s" --unit="nft-revert-${STAMP}" \
  /bin/bash -c "test -f '${CONFIRM}' || nft -f '/etc/nftables.d/rollback-${STAMP}.nft'"
echo "[i] auto-revert armed for ${REVERT_SECONDS}s (unit nft-revert-${STAMP})"

# 4. Apply.
sudo nft -f "${CANDIDATE}"
echo "[i] applied. Open a NEW ssh session and verify before confirming:"
echo "      sudo nft list ruleset | head"
echo "      ping -c2 10.10.50.1"

# 5. Confirm within the window.
read -r -p "Keep this ruleset? [y/N] " ans
if [[ "${ans}" =~ ^[Yy]$ ]]; then
    touch "${CONFIRM}"
    sudo systemctl stop "nft-revert-${STAMP}.timer" 2>/dev/null || true
    echo "[i] confirmed: ruleset retained."
else
    sudo nft -f "/etc/nftables.d/rollback-${STAMP}.nft"
    echo "[i] reverted."
fi
```

Second, a **console path that does not depend on the network**. The hypervisor's own VM console remains available no matter what the Linux ruleset does, so the recovery procedure when the ruleset has already locked SSH out is: open the hypervisor console on `vpnz-nft01`, log in as `fypadmin`, and `sudo nft -f /etc/nftables.d/rollback-<stamp>.nft` — or, if no rollback file exists, `sudo systemctl stop nftables && sudo nft flush ruleset`. The mitigation must be **demonstrated once, on purpose**, during the build week and captured; a mitigation that has never been exercised is a claim, not a control.

#### 8.5.4 IP forwarding and kernel tuning

The nftables pair cannot forward a single packet without `net.ipv4.ip_forward`. The settings live in `/etc/sysctl.d/99-fyp-hardening.conf` (mode `0644`), which is the path fixed by the baseline.

```ini
# /etc/sysctl.d/99-fyp-hardening.conf
# Vertex Peak FYP — kernel parameters.
# Apply with:  sudo sysctl --system        (reloads every file in /etc/sysctl.d/ in lexical order)
# Verify with: sysctl -a | grep -E 'ip_forward|rp_filter|syncookies|accept_redirects'

# ---------------------------------------------------------------------------
# ROUTING (nftables pair only — these two lines must NOT be present on non-router hosts)
# ---------------------------------------------------------------------------
# net.ipv4.ip_forward = 1        # uncomment ONLY on vpnz-nft01, vpnz-nft02, vpnz-dmzjump01 (if routing)
# net.ipv6.conf.all.forwarding = 0

# ---------------------------------------------------------------------------
# ANTI-SPOOFING
# ---------------------------------------------------------------------------
# Strict reverse-path filtering: drop a packet whose source address is not reachable
# back through the interface it arrived on. This is the single most valuable sysctl on a
# multi-homed firewall host, because it defeats simple source-address spoofing.
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.ens192.rp_filter = 1
net.ipv4.conf.ens224.rp_filter = 1

# ---------------------------------------------------------------------------
# ICMP AND REDIRECT HYGIENE
# ---------------------------------------------------------------------------
net.ipv4.conf.all.accept_redirects = 0            # a firewall must never accept an ICMP redirect
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.all.send_redirects = 0              # and must never generate one either
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0         # source routing is obsolete and abusable
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1          # no smurf amplification
net.ipv4.icmp_ignore_bogus_error_responses = 1    # do not log garbage from broken devices
net.ipv4.icmp_ratelimit = 100                     # 100 ms between rate-limited ICMP messages
net.ipv4.icmp_ratemask = 6168

# ---------------------------------------------------------------------------
# TCP STACK HARDENING
# ---------------------------------------------------------------------------
net.ipv4.tcp_syncookies = 1                       # survive a SYN flood without dropping the listener
net.ipv4.tcp_rfc1337 = 1                          # drop RST in TIME_WAIT (a real attack primitive)
net.ipv4.tcp_timestamps = 0                       # removes a known uptime/leak side channel
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 300
net.ipv4.ip_local_port_range = 10240 65000        # avoid well-known ports for ephemeral use
net.ipv4.conf.all.log_martians = 1                # log impossible source addresses

# ---------------------------------------------------------------------------
# CONNECTION TRACKING
# ---------------------------------------------------------------------------
# 131072 concurrent tracked flows. On a workstation-class VM this is generous, and it is set
# explicitly so that the conntrack table becomes a documented, monitored quantity rather than
# a surprise under a deliberate flood test.
net.netfilter.nf_conntrack_max = 131072
net.netfilter.nf_conntrack_tcp_timeout_established = 3600
net.netfilter.nf_conntrack_tcp_timeout_time_wait = 30
net.netfilter.nf_conntrack_generic_timeout = 120

# ---------------------------------------------------------------------------
# KERNEL PROTECTIONS
# ---------------------------------------------------------------------------
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2
kernel.yama.ptrace_scope = 1
kernel.randomize_va_space = 2
fs.protected_hardlinks = 1
fs.protected_symlinks = 1
net.ipv4.conf.all.promisc = 0
```

```bash
sudo sysctl --system | tail -20
sysctl net.ipv4.ip_forward net.ipv4.conf.all.rp_filter net.netfilter.nf_conntrack_max
# Expected:
#   net.ipv4.ip_forward = 1
#   net.ipv4.conf.all.rp_filter = 1
#   net.netfilter.nf_conntrack_max = 131072
```

`[ASSUMPTION]`: the `net.netfilter.*` parameters are only writable once the `nf_conntrack` module is loaded, which in practice means after `nftables` or `conntrack` has started. If `sysctl --system` reports `cannot stat /proc/sys/net/netfilter/nf_conntrack_max`, the module is not yet loaded at that point in boot; the fix is to add `nf_conntrack` to `/etc/modules-load.d/` and re-run, or to accept a boot-time warning and set the value from a `systemd` unit ordered after `nftables.service`. The builder must record which of these was needed.

#### 8.5.5 Logging and observability

nftables log messages go to the kernel log, which on Ubuntu Server with systemd-journald means the **`kernel` facility in the journal**, and from there to `/var/log/kern.log` if `rsyslog` is writing that file. They do **not** appear in `/var/log/syslog` by default on every configuration, so the diagnostic must name the right place.

```bash
# Live view of nftables drops. The kernel ring buffer is the immediate source.
sudo journalctl -k -f | grep --line-buffered 'NFT-'

# Same messages from the file, when rsyslog is configured to write them.
sudo tail -f /var/log/kern.log | grep --line-buffered 'NFT-'

# Or read the kernel ring directly, which also works while journald is being restarted.
sudo dmesg -wT | grep --line-buffered 'NFT-'
```

Because every drop rule carries a **distinguishable prefix**, a single `grep` proves a specific trust-boundary row:

```bash
# TB-04 : the DMZ tried to initiate toward the internal network
sudo journalctl -k --since '-15min' | grep 'NFT-DROP: TB-04'

# TB-06 : something on the Internet tried to reach a server or user host
sudo journalctl -k --since '-15min' | grep 'NFT-DROP: TB-06'

# TB-12 : a VPN client tried to reach the management zone
sudo journalctl -k --since '-15min' | grep 'NFT-DROP: TB-12'

# Anything at all that was dropped, with a per-prefix count — useful as a one-line health read
sudo journalctl -k --since '-1h' | grep -o 'NFT-DROP: [A-Z0-9-]*' | sort | uniq -c | sort -rn
```

Expected form of a single log line (the exact wording after the prefix is kernel-supplied and must not be written from memory — capture it from the host):

```text
2026-10-06T02:47:11.482913+08:00 vpnz-nft01 kernel: NFT-DROP: TB-04 IN=ens192 OUT=ens192 MAC=00:50:56:3f:01:0a SRC=10.10.90.21 DST=10.10.30.11 LEN=60 TOS=0x00 PREC=0x00 TTL=63 ID=0 DF PROTO=TCP SPT=44212 DPT=445 WINDOW=64240 RES=0x00 SYN URGP=0
```

**Centralisation.** The pair forwards kernel messages to the monitoring host so that a denial survives on the firewall pair being rebuilt:

```ini
# /etc/rsyslog.d/50-fyp-forward.conf
# Forward everything, but tag the security-relevant facility so it can be routed and alerted on.
# UDP is used because the baseline fixes 514/udp as the transport; the loss window on a
# same-subnet lab link is acceptable and is stated as a limitation.
*.* action(type="omfwd" target="10.10.30.31" port="514" protocol="udp"
           queue.type="LinkedList" queue.size="10000" queue.saveOnShutdown="on"
           action.resumeRetryCount="-1")

# A dedicated rule so nftables drops can be filtered on the receiver without parsing prefixes.
:msg, contains, "NFT-DROP" action(type="omfwd" target="10.10.30.31" port="514" protocol="udp")
```

```bash
sudo systemctl restart rsyslog
systemctl status rsyslog --no-pager | head -4
# On vpnz-mon01, confirm receipt:
sudo tail -5 /var/log/remote/vpnz-nft01.log
logger -t fyp-test 'NFT-DROP: TEST log-path check'
sudo tail -1 /var/log/remote/vpnz-nft01.log
```

**How this feeds the monitoring and AI lines.** Three consumers, and each is a concrete data path rather than an aspiration:

1. **Prometheus/Grafana (`fyp-security` dashboard).** The `node_exporter` textfile collector on each pair runs a small script that counts `NFT-DROP:` occurrences per prefix every 60 seconds and writes `fyp_nft_drops_total{prefix="TB-04"} 12` to `/var/lib/node_exporter/textfile_collector/nft_drops.prom`. Prometheus scrapes port 9100 (the pinned `node_exporter` 1.8.x) and the dashboard plots a per-rule-id drop rate, which is how a denial becomes a visible trend rather than a buried line.
2. **Loki.** Syslog forwarded to `vpnz-mon01` is ingested by Loki (3.x) with the prefix extracted as a label, so a Grafana panel can show the last ten `TB-06` attempts with source addresses.
3. **The AI line's read-only tool surface.** The `interface-health` and `alert-triage` skills on `vpnz-ai01` read exactly two things from this device: SNMPv3 polling of interface counters, and journald/rsyslog lines matching `NFT-DROP`. The agent has **no shell that can reach a device** and no write path; the four-tool surface is the entire capability. The `SVCP-` caveat that must accompany any agent output on firewall logs is that the agent can describe a denial trend but cannot confirm intent, and every proposal it drafts is labelled *proposed — requires human approval*.

#### 8.5.6 Verification

**Step 1 — the ruleset is what was intended.**

```bash
sudo nft list ruleset | head -60
sudo nft list tables
# Expected: table inet fyp_filter
sudo nft -a list table inet fyp_filter | grep -c '^'      # rule count, recorded as a build fact
```

Expected shape of the first lines:

```text
table inet fyp_filter {
	set svc_web {
		type inet_service
		elements = { 80, 443 }
	}
	set mgmt4 {
		type ipv4_addr
		flags interval
		comment "Z-MGMT : the highest restricted zone"
		elements = { 10.10.20.0/24, ... }
```

**Step 2 — the policies are drop.** A ruleset that exists with permissive policies is the failure this test exists to catch:

```bash
sudo nft list chain inet fyp_filter input   | grep policy
sudo nft list chain inet fyp_filter forward | grep policy
# Expected:
#   type filter hook input priority filter; policy drop;
#   type filter hook forward priority filter; policy drop;
```

**Step 3 — the conntrack table reflects real flows.**

```bash
sudo conntrack -L | head -20
sudo conntrack -C                       # current tracked flow count
sudo conntrack -L -p udp --dport 443 2>/dev/null | head -5    # WireGuard flows
sudo conntrack -L -p tcp --dport 1194 2>/dev/null | head -5
```

Expected `conntrack -L` line for a masqueraded outbound flow (the NAT translation is visible in the `src=`/`dst=` and `reply` fields):

```text
tcp      6 431997 ESTABLISHED src=10.10.30.42 dst=203.0.113.9 sport=44120 dport=443 src=10.10.50.11 dst=203.0.113.9 sport=44120 dport=443 [ASSURED] mark=0 use=1
```

Note the masquerade evidence: the `src` was rewritten from the internal `10.10.30.42` to the firewall's own `10.10.50.11`.

**Step 4 — a DNAT test from the outside.** The most robust way to simulate an external client inside a single hypervisor host is a **network namespace with a veth pair**, because it gives a genuinely separate IP stack and a genuinely separate conntrack view. The alternative is a second VM placed on `VNET-WAN`, which is simpler but consumes RAM.

```bash
# On vpnz-lnxra01 (or any guest with the iproute2 suite), create an external "client" namespace.
sudo ip netns add ext
sudo ip link add veth-ext type veth peer name veth-ext-br
sudo ip link set veth-ext-br netns ext
# Both ends are in the WAN-emulation subnet space used by the design:
sudo ip addr add 198.51.100.60/29 dev veth-ext
sudo ip link set veth-ext up
sudo ip -n ext addr add 198.51.100.61/29 dev veth-ext-br
sudo ip -n ext link set veth-ext-br up
sudo ip -n ext link set lo up
# Direct the namespace's traffic for the published addresses at the real firewall.
sudo ip -n ext route add 198.51.100.0/29 dev veth-ext-br
sudo ip -n ext route add default via 198.51.100.1

# Test 1: the published portal. Expect a TLS handshake through the DNAT.
sudo ip netns exec ext curl -skI --max-time 5 https://198.51.100.2/healthz
```

Expected:

```text
HTTP/2 200
server: nginx
strict-transport-security: max-age=31536000; includeSubDomains
```

```bash
# Test 2: prove the DNAT translation, not just the successful response.
sudo conntrack -L -d 10.10.90.10 2>/dev/null | head -5
# Expected: a flow whose DST was rewritten to the DMZ VIP.
#   tcp 6 431997 ESTABLISHED src=198.51.100.61 dst=10.10.90.10 sport=40122 dport=443 ...
# On vpnz-nft01, the dnat chain counters also move:
sudo nft -a list chain inet fyp_filter nat_prerouting | grep -A1 '198.51.100.2'
```

```bash
# Test 3: an UNPUBLISHED port from outside must be dropped, not merely refused.
sudo ip netns exec ext curl -sk --max-time 5 https://198.51.100.2:8443/ ; echo "exit=$?"
# Expected: exit=28 (timeout) — a timeout, not an immediate connection refused, because the
# packet was dropped rather than answered. The distinction matters: a RST would prove the
# packet reached a listener.
sudo journalctl -k --since '-2min' | grep 'NFT-DROP: TB-05\|NFT-DROP: FORWARD'
```

**Step 5 — a forbidden-path test that must be dropped.** Two directions, each with a distinguishable prefix. Both are "self-directed against the group's own lab segments", which is the ethical constraint this project operates under, and both must be documented in advance.

```bash
# TB-04 : DMZ must never initiate toward the internal server zone.
# Run from a DMZ host (vpnz-dmzwp01) toward a server host (vpnz-dc01), on SMB.
ssh fypadmin@10.10.90.25 'timeout 4 bash -c "</dev/tcp/10.10.30.11/445" ; echo "exit=$?"'
# Expected: exit=124 (timeout) and no session. Then on vpnz-nft01:
sudo journalctl -k --since '-2min' | grep 'NFT-DROP: TB-04'
```

Expected log line:

```text
vpnz-nft01 kernel: NFT-DROP: TB-04 IN=ens192 OUT=ens192 SRC=10.10.90.25 DST=10.10.30.11 PROTO=TCP SPT=53104 DPT=445 SYN
```

```bash
# TB-06 : the Internet must never reach a server. Same namespace, aimed at the DC.
sudo ip netns exec ext curl -sk --max-time 5 https://10.10.30.11/ ; echo "exit=$?"
# Expected: exit=28, and on vpnz-nft01:
sudo journalctl -k --since '-2min' | grep 'NFT-DROP: TB-06'
```

```bash
# TB-12 : a VPN client must never reach the management zone.
# From a connected OpenVPN client with an address in 10.10.202.0/24:
ping -c 3 -W 2 10.20.20.10 ; echo "exit=$?"
# Expected: 100% packet loss. And on vpnz-nft01:
sudo journalctl -k --since '-2min' | grep 'NFT-DROP: TB-12'
```

```bash
# The definitive proof that the drop was policy and not a routing accident: an allowed flow
# from the same source to a permitted destination must succeed at the same moment.
sudo ip netns exec ext curl -skI --max-time 5 https://198.51.100.2/healthz   # 200
sudo ip netns exec ext curl -sk  --max-time 5 https://10.10.30.11/           # timeout
# Same source, same device, one permitted and one denied: that pair of results is the evidence.
```

**Step 6 — counters and rate-limit behaviour under load.**

```bash
# Confirm that rules are actually being matched (a rule with counters that never move is dead config).
sudo nft -a list table inet fyp_filter | grep -E 'packets [0-9]+' | head -20

# Flood a denied path and confirm the DROP counter and the log line both appear.
sudo ip netns exec ext bash -c 'for i in $(seq 1 50); do timeout 1 bash -c "</dev/tcp/10.10.30.11/445" 2>/dev/null; done'
sudo nft -a list chain inet fyp_filter forward | grep 'TB-06'
sudo journalctl -k --since '-5min' | grep -c 'NFT-DROP: TB-06'
```

`[ASSUMPTION]` worth flagging: the log volume from a naive flood is large, and the kernel's own `printk` ratelimit (`net.core.message_cost`, `kernel.printk_ratelimit`) will silently suppress some lines **before** nftables' own `limit rate` applies. The observable consequence is that the count of `NFT-DROP:` lines is **lower** than the number of packets the counter shows as dropped. That is expected kernel behaviour, not a broken rule, and the report should present both numbers side by side and explain the gap rather than presenting the log count as a packet count.

**Step 7 — the rollback control.** Prove that the lockout recovery works, by deliberately breaking the input chain and recovering from the hypervisor console:

```bash
# On vpnz-nft01, with the recovery procedure already written down and the console open:
sudo nft add rule inet fyp_filter input iifname "ens192" ip saddr 10.10.50.1 drop
# The SSH session from the core side should now be at risk; from a second session:
sudo nft list chain inet fyp_filter input | tail -3
# Recover via the hypervisor console (not SSH):
#   sudo nft -f /etc/nftables.d/rollback-<stamp>.nft
sudo nft list chain inet fyp_filter input | tail -3   # the injected rule is gone
```

#### 8.5.7 Common mistakes

These are the pitfalls that cost real hours on this design, in rough order of how often they occur.

| # | Mistake | Symptom | Why it happens | Correct approach |
|---|---|---|---|---|
| M-01 | Missing `ct state established,related accept` (or placing it after the policy-relevant rules) | Everything works for the first packet and then dies; returns are dropped; "the firewall randomly breaks web browsing" | `policy drop` applies to the *return* direction too, so without the stateful shortcut every reply is dropped | Put the stateful accept **first** in both `input` and `forward`, before any permit or deny |
| M-02 | Using `iif` instead of `iifname` (or `oif` instead of `oifname`) | `nft -c -f` fails with `Could not process rule: No such file or directory` on a VM, or the rule silently never matches | `iif`/`oif` require the **interface index**, which is not stable across reboots and differs between hosts; `iifname`/`oifname` match the name | Always use `iifname`/`oifname` with the real device name read from `ip -br link` |
| M-03 | Rule order: a broad permit placed *before* a specific deny | A forbidden flow succeeds and no `NFT-DROP:` line ever appears | nftables evaluates a chain top to bottom and the first terminating verdict wins; `accept` is terminal within the chain | Place all DENY rules **before** the permits, then the catch-all drop. The rule set above does this deliberately and says so in a comment |
| M-04 | DNAT rule placed in `forward` instead of `nat prerouting` | `nft -c -f` returns a syntax/position error, or DNAT is silently ignored | DNAT is a NAT-hook operation and cannot be expressed in a filter chain | DNAT belongs in `type nat hook prerouting priority dstnat` |
| M-05 | `masquerade` in `prerouting`, or `dnat` in `postrouting` | Rule rejected at load, or translation applies to the wrong direction | srcnat and dstnat are different hooks with different information available | `dnat` → `nat prerouting`; `masquerade` → `nat postrouting` |
| M-06 | Editing a fragment under `/etc/nftables.d/` and loading **that fragment** with `nft -f` | Half the ruleset vanishes; other chains disappear | Loading a file that contains `flush ruleset` (or that redefines a table) replaces the whole table state | Always apply the top-level `/etc/nftables.conf`; the fragments are includes, not units |
| M-07 | `flush ruleset` left in a fragment rather than only in the top-level file | Applying the fragment wipes the hosts' other rules; a container or libvirt bridge rule vanishes | `flush ruleset` is global, not scoped to `inet fyp_filter` | `flush ruleset` appears **once**, in `/etc/nftables.conf`, before the table is declared |
| M-08 | Forgetting `net.ipv4.ip_forward = 1` | The ruleset loads, counters move, and nothing is forwarded; `ping` to a local address works while `ping` through the host does not | Linux does not forward by default | Set it in `/etc/sysctl.d/99-fyp-hardening.conf` on the router hosts only, verify with `sysctl net.ipv4.ip_forward` |
| M-09 | `rp_filter = 1` on a multi-homed host with asymmetric routing | Intermittent drops on one interface only; `log_martians` fills with legitimate-looking addresses | Strict reverse-path filtering drops packets whose source is not reachable via the arrival interface, which is genuinely true for some asymmetric designs | Keep strict rp_filter on this design (the pair is symmetric), and if asymmetric routing is ever introduced use `rp_filter = 2` (loose) rather than 0 |
| M-10 | Interface names hard-coded from a tutorial (`eth0`, `ens33`, `enp0s3`) | Rules load but never match; nothing is ever permitted or denied as intended | Interface naming is not stable across images and hypervisors | Read the real names with `ip -br link` on the host and use them in the ruleset, then record them in the runbook |
| M-11 | Log rules without a rate limit | A denial flood fills `/var/log` and, on a small VM, takes the filesystem to 100 % and the service down | Every packet generates a log line | Use a distinct `limit rate` per prefix (as the `log_dropped` chain does) and alert on the drop counter rather than relying on the log volume |
| M-12 | Testing only from the host itself | The ruleset "works" and no client can pass a packet | Locally generated traffic hits the `output` chain, which this design leaves permissive, so it never exercises `forward` or the DNAT path | Test transiting traffic from a namespace or a peer VM, always |
| M-13 | Assuming the `nftables.service` unit loaded the file after an edit | The new rule is missing after a reboot and present after `nft -f` | Editing a file does not reload anything; and if the unit is not enabled, boot loads nothing | `sudo nft -c -f`, then `sudo nft -f`, then `systemctl enable --now nftables`, then **reboot and verify** |
| M-14 | Two nodes of the pair running different rulesets | Failover appears to "break the firewall": some flows work on one node and not the other | Manual editing on one node only | Generate both from the same template (`templates/nftables.conf.j2`) with the node's own host variables, and diff the rendered output on both nodes as a checklist item |
| M-15 | `comment` strings that lie | A reviewer trusts a comment that no longer matches the rule | Comments are not validated by anything | Treat a comment as documentation that must be re-read whenever the rule changes; the rule-number comments in §8.5.2 exist so that a reviewer can trace rule → trust-boundary row → test case |

### 8.6 OpenVPN

#### 8.6.1 Design

OpenVPN is the **second, independently implemented remote-access technology** in this project, and it runs on `vpnz-lnxra01` (10.10.30.42, VLAN 30 `SRV-HQ-1`, `Z-SERVER`). Its purpose is deliberately comparative: RRAS with IKEv2 on `vpnz-rras01` demonstrates the Microsoft, certificate-and-NPS-authorised route, and OpenVPN demonstrates the same business outcome with a completely different PKI, a different transport, a different client and a different administrative model. The comparison chapter belongs to the Microsoft line and is **cross-referenced, not duplicated** here: the IKEv2 server, the NPS/RADIUS policy and the Windows autoconnect VPN profile are documented in the Microsoft Server Networking chapter; this sub-section documents only the Linux side.

**OpenVPN is one of the two technologies in this line that the WSOS names explicitly.** The verbatim line is `Provide network connectivity between remote branches using VPN technologies such as IPSec, SSL VPN, Direct Access, OpenVPN, DMVPN, GRE, etc.` (Domain 3, line 6). No bridge or inference is needed for OpenVPN, which is why the report may cite it directly — in contrast to WireGuard, which rests only on the `etc.`.

| Design element | Value | Source |
|---|---|---|
| Server host | `vpnz-lnxra01`, `10.10.30.42` | static host address table |
| Service port and transport | UDP 1194 | port and protocol matrix, `P-17` |
| Reachability | published address `198.51.100.5`, translated twice: the ASA performs the first static PAT to the nftables VIP `10.10.50.10`, and the nftables pair DNATs on that VIP to `10.10.30.42:1194` (Rev 1.1 ruling C-20); the internal name `vpn.vertexpeak.fyp.lab` resolves to `10.10.50.10` for split-horizon | public addressing table; DNS record plan |
| Tunnel network | `10.10.202.0/24` | VPN and tunnel addressing |
| Client address pool | `10.10.202.10 – 10.10.202.120` | VPN and tunnel addressing |
| PKI | Easy-RSA 3.1.x on the same host; CA and private keys under `/etc/openvpn/easy-rsa/pki` (mode `0700`, **never** committed to Git) | version pinning list; configuration paths |
| Server certificate | issued by Easy-RSA, `CN=server-vpnz-lnxra01` | certificate subjects and SANs |
| Client certificate | issued by Easy-RSA, `CN=client-{staffid}` | certificate subjects and SANs |
| Authorisation | Windows group `GG-VPN-Users`; `GG-VPN-ProfServices` additionally gets RDP to the platform tier. Enforcement is by the nftables `vpn4` set plus the certificate; a full LDAP/NPS authorisation path is **not** claimed for OpenVPN | group design; trust-boundary TB-11 |
| Server config path | `/etc/openvpn/server/server.conf` | configuration paths |
| Client and CCD paths | `/etc/openvpn/client/`, `/etc/openvpn/ccd/` (mode `0700`) | configuration paths |

**Split versus full tunnel — the decision, and it is a deliberate one.** For OpenVPN the design uses a **split tunnel with an explicit route list**: only the corporate prefixes are pushed, and general Internet traffic continues to use the client's own connection. The reason is that the split list is exactly the set of subnets the client is *authorised* to reach, so the pushed route table and the firewall policy are the same object expressed twice, which is auditable. This differs from the Microsoft IKEv2 service, where the baseline **disables** split tunnelling because the due-diligence requirement demands an auditable path for the travelling sales population. Both decisions are intentional and both must be stated; the report must not present one as a correction of the other. The comparison is one of the substantive findings the two implementations are there to produce: *full tunnel gives centralised egress control and attribution at a bandwidth and latency cost; split tunnel gives an explicit, minimal authorisation set at the cost of losing visibility into the client's other traffic.*

Routes pushed to an OpenVPN client:

| Prefix | Why it is pushed | Corresponding policy |
|---|---|---|
| `10.10.30.0/24` | Server VLAN: DNS, directory, file services, the monitoring host | TB-11 |
| `10.10.0.0/16` | HQ LAN space generally (VLAN 10/40/45/80) | TB-11 |
| `10.10.90.0/24` | The DMZ, because the professional-services group needs the published portal for integration testing | TB-11 and TB-13 (the DMZ may not initiate back) |

**Not pushed:** `10.20.0.0/16` (management), `10.70.0.0/16` (isolated lab), `10.10.80.0/24` (iSCSI storage), and `0.0.0.0/0` (never — a full tunnel is not configured). The absences are as much a part of the design as the presences, and the verification in §8.6.6 tests both.

#### 8.6.2 PKI with Easy-RSA

Easy-RSA 3.1.x is installed from the Ubuntu 24.04 archive (the pinning list records its existence in Noble as verified; version 3.0.8 from a tarball is the documented fallback).

```bash
sudo apt-get install -y easy-rsa openvpn
dpkg -s easy-rsa | grep -E '^Version|^Status'
ls -l /usr/share/easy-rsa/
# Expected: easyrsa, openssl-easyrsa.cnf, x509-types/  (the packaged CA toolkit)
```

**PKI directory layout** — created under `/etc/openvpn/easy-rsa/` (mode `0700`, `root:root`), which is the path the baseline fixes. The layout below is Easy-RSA 3's own, and it must be reproduced rather than improvised:

```text
/etc/openvpn/easy-rsa/                 0700 root:root
├── vars                               the project's settings file (see below); mode 0600
├── easyrsa                            copied from /usr/share/easy-rsa/easyrsa
├── openssl-easyrsa.cnf                copied from the package
├── x509-types/                        copied from the package (ca, server, client, crl, ...)
└── pki/                               0700 root:root — THE PRIVATE MATERIAL
    ├── ca.crt                         the CA certificate — published to clients
    ├── private/
    │   ├── ca.key                     0600 — the CA private key. NEVER leaves this host
    │   ├── server-vpnz-lnxra01.key
    │   ├── client-alice.key
    │   └── ...
    ├── issued/
    │   ├── server-vpnz-lnxra01.crt
    │   └── client-alice.crt
    ├── reqs/                          certificate signing requests
    ├── crl.pem                        the certificate revocation list — copied to the server dir
    ├── index.txt                      the CA database (which certificate is which, and revoked)
    └── serial
```

`vars` configuration. The baseline's decision is a **2048-bit key, or 4096-bit if time allows**. This design takes the 2048-bit default with an explicit justification, and the 4096-bit variant is recorded as the alternative.

```bash
# /etc/openvpn/easy-rsa/vars     (mode 0600). Sourced by easyrsa at run time.
set_var EASYRSA_ALGO            "rsa"        # alternative: "ec" for ECDSA — see the note below
set_var EASYRSA_KEY_SIZE        2048         # 4096 if the group has the time; see the trade-off note
set_var EASYRSA_DIGEST          "sha512"     # SHA-256 is the floor; SHA-512 is used here
set_var EASYRSA_CA_EXPIRE       3650         # 10 years — the issuing-CA lifetime in the baseline's PKI
set_var EASYRSA_CERT_EXPIRE     825          # ~27 months for client certificates: they are rarely hardware-backed
set_var EASYRSA_CRL_DAYS        180          # CRL validity; must be regenerated well before it lapses
set_var EASYRSA_REQ_COUNTRY     "HK"
set_var EASYRSA_REQ_PROVINCE    "Hong Kong"
set_var EASYRSA_REQ_CITY        "Sha Tin"
set_var EASYRSA_REQ_ORG         "Vertex Peak Financial Technologies Limited"
set_var EASYRSA_REQ_EMAIL       "netops@vertexpeak.fyp.lab"
set_var EASYRSA_REQ_OU          "Network Engineering Workstream"
set_var EASYRSA_NS_SUPPORT      "no"         # modern CN-only naming; no Netscape extensions
set_var EASYRSA_DN              "cn_only"    # subject is CN only, which is what OpenVPN actually matches on
```

**Trade-off note that must appear in the report.** The 2048-bit RSA key is chosen over 4096-bit because the tunnel is a lab demonstration on a single host and the handshake cost is not the constraint; 4096-bit would add CPU cost to every tunnel handshake on a 2-vCPU VM with no threat model attached, since the certificates are lab-only and the CA is not published. The 2048-bit choice must be presented as a **deliberate, documented sizing decision with a stated limitation**, not as the best available security. The honest alternative pairing to record is ECDSA `secp384r1` (`EASYRSA_ALGO ec` + `EASYRSA_CURVE secp384r1`), which gives a stronger primitive with a faster handshake and identical Easy-RSA command syntax — the only reason it is not the primary choice is that the pinned Ubuntu OpenVPN client package and the in-box Windows client must both be confirmed to accept the suite before it is adopted, and that confirmation is work the group has not yet done.

**Building the PKI, in order and with the expected outputs.**

```bash
cd /etc/openvpn/easy-rsa

# 1. Initialise the directory structure. Easy-RSA refuses to overwrite an existing PKI,
#    which is the correct safety behaviour.
sudo ./easyrsa init-pki
# Expected: "init-pki complete; you may now create a CA or requests."
#           "Your newly created PKI dir is: /etc/openvpn/easy-rsa/pki"

# 2. Build the CA. This is a self-signed root and it is the trust anchor for the whole tunnel PKI.
sudo ./easyrsa --batch build-ca nopass
# Expected: "CA creation complete and you may now import and sign cert requests."
# 'nopass' is used because the server must be able to start unattended.
# [ASSUMPTION] this deliberately leaves ca.key unencrypted on disk. The mitigation is the 0700
# directory and the fact that the host is a lab VM; if the group prefers a passphrase-protected
# CA key the server must be given the passphrase via a systemd credential, which is more work.

# 3. Server certificate, with the CN fixed by the certificate-subject table.
sudo ./easyrsa --batch build-server-full server-vpnz-lnxra01 nopass
# Expected: "Note: using Easy-RSA configuration from: /etc/openvpn/easy-rsa/vars"
#           "Certificate created at: /etc/openvpn/easy-rsa/pki/issued/server-vpnz-lnxra01.crt"

# 4. One client certificate per named user. The CN is what the firewall and the CCD key on.
sudo ./easyrsa --batch build-client-full client-alice nopass
sudo ./easyrsa --batch build-client-full client-bob   nopass
sudo ./easyrsa --batch build-client-full client-carol nopass
sudo ./easyrsa --batch build-client-full client-revocation-test nopass

# 5. The CRL. REQUIRED from day one, not only when a revocation happens: OpenVPN's
#    'crl-verify' directive cannot start without a CRL file present.
sudo ./easyrsa gen-crl
# Expected: "An updated CRL has been created."
#           "CRL file: /etc/openvpn/easy-rsa/pki/crl.pem"

# 6. Diffie-Hellman parameters.
#    DECISION: ECDH is used instead of classic DH, and the reason is concrete rather than stylistic.
#    'dh none' with the ECDHE TLS 1.3/1.2 suites gives forward secrecy with no dh.pem file at all,
#    which removes a large file, avoids a multi-minute 'gen-dh' run on a 2-vCPU VM, and cannot be
#    weakened by a low-quality DH parameter set. The alternative — classic DH — is retained below
#    as the fallback because it is what most tutorials show.
sudo ./easyrsa gen-dh          # ONLY if 'dh' is used instead of 'dh none' (see §8.6.3)
```

**Honest note on `dh none` and TLS 1.3.** `dh none` is valid specifically because OpenVPN's default `tls-cipher`/`tls-ciphersuites` negotiation with TLS 1.3 uses ECDHE key exchange, which does not consume a `dh` parameter at all. If the group later pins a non-ECDHE TLS 1.2 suite, `dh none` can no longer establish a session and a `dh.pem` becomes mandatory. This is exactly the kind of dependency worth writing down: the config change and the DH decision are coupled, and the coupling is easy to miss.

`gen-dh` is not run in the delivered design, but the fallback command and the reasoning are recorded above so that a reader who needs classic DH is not left guessing. `[ASSUMPTION]`: if `dh.pem` is used, expect `gen-dh` to take several minutes on a 2-vCPU guest; time it and record it, because it is a legitimate build-cost data point.

Revocation, verified in §8.6.6:

```bash
# Revoke a client certificate and republish the CRL. Both steps are required:
# 'revoke' marks the certificate in index.txt, 'gen-crl' produces the new crl.pem.
sudo ./easyrsa --batch revoke client-revocation-test
sudo ./easyrsa gen-crl
sudo chmod 0644 /etc/openvpn/easy-rsa/pki/crl.pem
sudo cp /etc/openvpn/easy-rsa/pki/crl.pem /etc/openvpn/server/crl.pem
sudo apt-get install -y tlsdate >/dev/null 2>&1 || true   # not required; recorded only to show the intent
```

`[ASSUMPTION]` that must be checked on the built host: some OpenVPN packaging expects the CRL to be readable **by the dropped-privilege user** (because the server reads it after `user nobody` takes effect), which is why the mode above is relaxed to `0644` on the copy under `/etc/openvpn/server/`. If the server logs `Cannot open CRL file`, this permission is the first thing to check — and the fix is a mode change on the copy, never a change to the `0700` mode of the PKI directory itself.

#### 8.6.3 Server configuration

```ini
# /etc/openvpn/server/server.conf        —   vpnz-lnxra01
# OpenVPN 2.6.x (Ubuntu 24.04 package). Verify the running version with: openvpn --version
# Start with:  sudo systemctl restart openvpn-server@server
# Follow with: sudo journalctl -u openvpn-server@server -f
#
# NOTE ON THE UNIT NAME: OpenVPN 2.6 on Ubuntu uses the instance template
# 'openvpn-server@<name>.service', and the instance name is the basename of the .conf file
# found in /etc/openvpn/server/. With the file named 'server.conf' the unit name is
# 'openvpn-server@server'. [ASSUMPTION] confirmed against the installed package on the build
# host, because the older 'openvpn@server' unit name is what most documentation still shows.

##############################################
# NETWORK
##############################################
port            1194
proto           udp
dev             tun
dev-type        tun
topology        subnet          # REQUIRED and must match on both ends; 'net30' is the legacy default
                                # and mixing the two produces a tunnel that routes nothing.

# The tunnel network is fixed by the design: 10.10.202.0/24
server          10.10.202.0 255.255.255.0

# The client pool. Addresses outside it are reserved (the server takes .1, and .121-.254 are
# deliberately left unallocated so that a future second service can be assigned a contiguous range).
ifconfig-pool   10.10.202.10 10.10.202.120

# Per-client configuration directory. The filename must equal the certificate CN.
client-config-dir /etc/openvpn/ccd

# Do NOT route between clients. Two staff laptops have no reason to exchange traffic, and
# 'client-to-client' would bypass the nftables forward chain entirely, creating a path that no
# firewall rule and no log can see. This is a security decision, not a default.
;client-to-client

# Duplicate certificate use is refused: each certificate may have exactly one live session.
;duplicate-cn

# Remove the route to the tunnel network when the client disconnects, cleanly.
;route-nopull

##############################################
# PKI AND TLS
##############################################
ca              /etc/openvpn/server/ca.crt
cert            /etc/openvpn/server/server-vpnz-lnxra01.crt
key             /etc/openvpn/server/server-vpnz-lnxra01.key
dh              none            # ECDHE only — see the discussion in §8.6.2. Fallback: 'dh /etc/openvpn/server/dh.pem'

# TLS control-channel protection.
# tls-crypt is PREFERRED and is what this design uses: it encrypts AND authenticates the control
# channel, so an observer cannot even see the handshake, and it makes the server unresponsive to
# unauthenticated probes. It replaces BOTH tls-auth and a separate --auth digest on the control channel.
tls-crypt       /etc/openvpn/server/tls-crypt.key
# The fallback, if a distributed client cannot be updated to carry a tls-crypt key, is:
#   tls-auth    /etc/openvpn/server/ta.key 0
# tls-auth only *signs* the control channel with an HMAC; the handshake packets remain visible.
# Argument 0 = server; clients must use 1. Getting that direction backwards makes the tunnel fail
# with 'TLS Error: cannot locate HMAC in incoming packet'.

# Protocol floor and cipher suites for the control channel.
tls-version-min 1.2
tls-cipher      TLS-ECDHE-RSA-WITH-AES-256-GCM-SHA384:TLS-ECDHE-ECDSA-WITH-AES-256-GCM-SHA384
tls-ciphersuites TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256

# Data channel. OpenVPN 2.6 prefers the 'data-ciphers' name; 'cipher' is deprecated but is
# still accepted, so BOTH are set to remove ambiguity across client versions.
data-ciphers    AES-256-GCM:AES-128-GCM:CHACHA20-POLY1305
data-ciphers-fallback AES-256-GCM
cipher          AES-256-GCM
auth            SHA512

# Certificate verification.
# remote-cert-tls server is set on CLIENTS (see §8.6.4); on the server the equivalent control is
# that every client must present a certificate signed by this CA.
verify-client-cert require

# Revocation. Mandatory: a lost laptop's certificate must be able to be cancelled.
crl-verify      /etc/openvpn/server/crl.pem

# Refuse a client certificate that is not actually a client certificate.
# NOTE: 'remote-cert-ku' (key usage) is deliberately NOT set here. It requires a numeric
# key-usage value such as 'remote-cert-ku a0', and writing the directive without a value is a
# configuration error that OpenVPN rejects at start-up. The key-usage check is therefore left to
# the CA's x509-types/client definition, which is where Easy-RSA enforces it at signing time.
# 'username-as-common-name' is also NOT used: it requires a username/password authentication
# method to be configured, and this design authenticates every user by certificate alone, so the
# certificate CN is already the client identity.
verify-x509-name server-vpnz-lnxra01 name

##############################################
# ROUTING AND PUSHED OPTIONS
##############################################
# Keep the pushed options inside the tunnel, but enable the pool and the route list.
push "topology subnet"

# --- the authorised route list: exactly what TB-11 permits, nothing more ---
push "route 10.10.30.0 255.255.255.0"
push "route 10.10.0.0 255.255.0.0"
push "route 10.10.90.0 255.255.255.0"
# NOT pushed and must never be pushed:
#   10.20.0.0/16  management  (TB-12 denies it)
#   10.70.0.0/16  isolated lab (TB-09/TB-10 deny it)
#   10.10.80.0/24 iSCSI storage
#   0.0.0.0/0     full tunnel is NOT used for OpenVPN; see §8.6.1

# --- DNS: the two domain controllers only. No public resolver is ever pushed. ---
push "dhcp-option DNS 10.10.30.11"
push "dhcp-option DNS 10.10.30.12"
push "dhcp-option DOMAIN vertexpeak.fyp.lab"
push "dhcp-option SEARCH fyp.lab"
push "dhcp-option DOMAIN-ROUTE vertexpeak.fyp.lab"
push "dhcp-option DOMAIN-ROUTE fyp.lab"

# A redirect-gateway line would make this a full tunnel. It is deliberately absent.
;push "redirect-gateway def1 bypass-dhcp"

# Keep the session alive across a roaming client's network change.
keepalive       10 60

##############################################
# PRIVILEGES AND HARDENING
##############################################
# Drop privileges immediately after the tunnel device is created and the socket is bound.
# 'nobody'/'nogroup' exist on Ubuntu 24.04 by default.
user            nobody
group           nogroup
persist-key
persist-tun

# Refuse to accept a cipher or digest that the client selects outside the configured sets.
# (Removing 'ncp-disable' is what enables OpenVPN 2.6's Negotiable Crypto Parameters.)
;ncp-disable

# Limit the damage a broken client can do.
max-clients     120         # matches the size of the 10.10.202.10-.120 pool
# [ASSUMPTION] on the exact syntax: 'connect-freq' requires a count PLUS a seconds argument
# (n = number of new connections, s = seconds per minute, and s must divide 60). The form below
# is the documented shape; confirm it against `openvpn --help` on the installed 2.6.x package
# before relying on it, because a malformed directive stops the service from starting.
connect-freq    5 60        # at most 5 new connections per 60 s across ALL clients
;connect-freq-initial 20 60 # the alternative directive for a separate initial-window limit

# Explicitly refuse the legacy, weak options. Each of these is a real misconfiguration seen in
# tutorials: 'comp-lzo' is obsolete and can be used in a compression oracle; 'push comp-lzo' would
# spread it to every client.
;comp-lzo
;push "comp-lzo"
allow-compression no         # OpenVPN 2.6 setting: refuse any compression negotiation

# No scripts, no plugins, no client-side up/down execution.
script-security 2
;plugin
;client-connect
;client-disconnect

##############################################
# LOGGING
##############################################
# 'verb 3' is the right level for normal operation: enough to see the handshake and the assigned
# address, not enough to flood the journal with per-packet noise. 'verb 6' is for diagnosis only.
verb            3
mute            20
status          /var/log/openvpn/status.log 30
status-version  2
log-append      /var/log/openvpn/openvpn.log
```

Two decisions in that file deserve an explicit defence, because a reviewer will ask.

**`client-to-client` is disabled.** Enabling it would let two connected staff laptops reach each other without the traffic ever entering the nftables `forward` chain, because OpenVPN would route the packet internally. That would create a communication path with **no firewall rule and no log line** — precisely the kind of invisible channel the trust-boundary table exists to prevent. The cost is that a peer-to-peer application between two remote workers will not work over this tunnel; that is an accepted limitation and it is recorded as such.

**`allow-compression no` is set, and `comp-lzo` is absent.** Compression in a VPN is a well-known information-leak primitive, and OpenVPN 2.6 changed the defaults precisely because of that. Setting the directive explicitly means the posture is visible in the configuration rather than implied by a version default.

#### 8.6.4 Client configuration and packaging

The client template is kept in the repository as a non-secret file, and the per-user artefacts are generated by a script so that no step is done by hand. The design uses **inline certificates**, because a single `.ovpn` file is dramatically easier to distribute and revoke than a directory of five files — and because the file can then be handed over with a documented warning about what it contains.

```ini
# 04-automation/bash/openvpn/client-template.ovpn     (repository file; contains NO key material)
# Per-user .ovpn files are produced from this template by 99-gen-client-ovpn.sh below.
client
dev tun
proto udp
remote 198.51.100.5 1194          # the published VPN front door; DNAT'd to vpnz-lnxra01:1194
resolv-retry infinite
nobind

# Privilege drop on the client side where the platform supports it.
persist-key
persist-tun

# ---- PKI, all inline. The markers below are replaced by the generator script. ----
<ca>
-----BEGIN CERTIFICATE-----
__CA_CERT__
-----END CERTIFICATE-----
</ca>

<cert>
-----BEGIN CERTIFICATE-----
__CLIENT_CERT__
-----END CERTIFICATE-----
</cert>

<key>
-----BEGIN PRIVATE KEY-----
__CLIENT_KEY__
-----END PRIVATE KEY-----
</key>

<tls-crypt>
-----BEGIN OpenVPN Static key V1-----
__TLS_CRYPT_KEY__
-----END OpenVPN Static key V1-----
</tls-crypt>

# ---- verification and hardening on the client side ----
remote-cert-tls server            # REQUIRED: refuse a server that is not a TLS server certificate.
                                  # Without it, a rogue server with any valid client certificate
                                  # signed by the same CA could impersonate the VPN endpoint.
verify-x509-name server-vpnz-lnxra01 name    # pin the exact server CN
tls-version-min 1.2
data-ciphers AES-256-GCM:AES-128-GCM:CHACHA20-POLY1305
auth SHA512
auth-nocache                      # never cache credentials in memory; matters for the password path

# Do not silently accept a redirect pushed by the server: the client's route list is the
# authorised set, and a server-side push must not be able to widen it.
pull-filter ignore "redirect-gateway"
pull-filter ignore "route 0.0.0.0"

# ---- logging (client side) ----
verb 3
;verb 6
mute 20
```

Note the deliberate inversion: `remote-cert-tls server` on the client is the control that stops a **rogue-server** attack, and it has no meaning on the server. This is the single most commonly omitted line in OpenVPN client configurations and it is why a stolen client certificate is not by itself sufficient to redirect a user's traffic.

The generation script, which is the concrete deliverable for this sub-section:

```bash
#!/usr/bin/env bash
# 04-automation/bash/openvpn/99-gen-client-ovpn.sh
# Build one self-contained .ovpn file for a named client from the Easy-RSA PKI.
# Usage: sudo ./99-gen-client-ovpn.sh client-alice
#
# SECURITY: the output file contains a PRIVATE KEY. Write it to an encrypted medium, hand it over
# with a recorded acknowledgement, and never commit it. The repository .gitignore must contain
# '*.ovpn' and 'pki/'.
set -euo pipefail

CLIENT="${1:?usage: $0 client-<staffid>}"
EASYRSA_DIR="/etc/openvpn/easy-rsa"
OUT_DIR="/srv/ovpn-out"                 # 0700, deliberately outside the Git working tree
TEMPLATE="/opt/fyp/templates/client-template.ovpn"
TLS_CRYPT="/etc/openvpn/server/tls-crypt.key"

mkdir -p "${OUT_DIR}" && chmod 0700 "${OUT_DIR}"

# Fail early with a clear message rather than producing a broken file.
for f in "${EASYRSA_DIR}/pki/issued/${CLIENT}.crt" \
         "${EASYRSA_DIR}/pki/private/${CLIENT}.key" \
         "${EASYRSA_DIR}/pki/ca.crt" \
         "${TEMPLATE}" "${TLS_CRYPT}"; do
    [[ -r "$f" ]] || { echo "[!] missing required file: $f" >&2; exit 1; }
done

OUT="${OUT_DIR}/${CLIENT}.ovpn"
cp "${TEMPLATE}" "${OUT}"

# Inline substitution. 'sed' is used with a delimiter that cannot appear in base64 ('|'), and the
# substitution is done from files so that no secret ever reaches the shell's argument list or history.
replace_block() {   # $1 = placeholder, $2 = source file
    local ph="$1" src="$2"
    awk -v ph="${ph}" -v src="${src}" '
        { if (index($0, ph) > 0) { while ((getline line < src) > 0) print line; next } print }
    ' "${OUT}" > "${OUT}.tmp" && mv "${OUT}.tmp" "${OUT}"
}

replace_block "__CA_CERT__"       "${EASYRSA_DIR}/pki/ca.crt"
replace_block "__CLIENT_CERT__"   "${EASYRSA_DIR}/pki/issued/${CLIENT}.crt"
replace_block "__CLIENT_KEY__"    "${EASYRSA_DIR}/pki/private/${CLIENT}.key"
replace_block "__TLS_CRYPT_KEY__" "${TLS_CRYPT}"

chmod 0600 "${OUT}"

echo "[i] generated ${OUT}"
echo "[i] SHA-256 of the file (record this in the handover log):"
sha256sum "${OUT}"
echo "[i] REMINDER: this file is a private key. Revoke with:"
echo "      cd ${EASYRSA_DIR} && ./easyrsa --batch revoke ${CLIENT} && ./easyrsa gen-crl"
```

Two honest limitations of this approach must be stated in the report. Inlining a private key into a single file means the file is a portable credential: whoever holds it can connect until the certificate is revoked **and** the CRL is regenerated and reloaded. And inlining the `tls-crypt` key means that key is now on every client — which is fine for a shared control-channel secret but must be understood: it is not a per-client control.

#### 8.6.5 Hardening

| Control | Setting | What it actually protects against, and its limit |
|---|---|---|
| Control-channel encryption and authentication | `tls-crypt` (preferred), `/etc/openvpn/server/tls-crypt.key` | Encrypts and authenticates the entire control channel. An observer cannot see the handshake, cannot fingerprint the VPN by its packet pattern, and **an unauthenticated probe gets no response at all** — the server is not a TLS banner. This is strictly stronger than `tls-auth` |
| Fallback | `tls-auth ta.key 0` on the server, `1` on clients | Adds an HMAC to control packets so that a spoofed or replayed packet is rejected, but the handshake remains **visible**. Use it only when a client cannot be updated; the direction argument (`0`/`1`) must match or the tunnel fails with `TLS Error: cannot locate HMAC in incoming packet` |
| Control-channel suites | `tls-version-min 1.2` + explicit `tls-cipher`/`tls-ciphersuites` | Excludes the historic CBC suites with known weaknesses and forces AEAD suites where available |
| Data-channel cipher | `data-ciphers AES-256-GCM:...` with `data-ciphers-fallback AES-256-GCM` | AES-GCM is authenticated encryption: confidentiality and integrity in one primitive. `data-ciphers` is set explicitly so the posture does not depend on the OpenVPN version default |
| Control-channel digest | `auth SHA512` | Applies to the HMAC-based control path; SHA-1 is refused |
| Compression | `allow-compression no`, no `comp-lzo` | Removes the compression-oracle class of attack. The cost is higher bandwidth on text-heavy traffic, which on a lab tunnel is irrelevant |
| Server identity from the client's side | `remote-cert-tls server` + `verify-x509-name server-vpnz-lnxra01 name` | Prevents a rogue server presenting a certificate that is signed by the same CA but is a *client* certificate. Without this line the CA alone is insufficient |
| Certificate requirement | `verify-client-cert require` | A client that presents no certificate is refused before any user-level decision |
| Revocation | `crl-verify /etc/openvpn/server/crl.pem` + `easyrsa gen-crl` | **The only way to cancel a lost client.** Also the weakest link operationally, see below |
| Duplicate certificate prevention | `duplicate-cn` **not** set | A single certificate cannot be used by two simultaneous sessions |
| Privilege drop | `user nobody` / `group nogroup`, `persist-key`, `persist-tun` | A memory-safety bug in the OpenVPN process does not give the attacker root. This is the single highest-value hardening line in the file |
| Connection flood | `connect-freq 5 60`, `max-clients 120` | Bounds the damage of an attempted connection flood and keeps the pool from being exhausted |
| No client scripts | no `client-connect`/`client-disconnect`, `script-security 2` | Removes an entire remote-code-execution surface |
| CCD | `/etc/openvpn/ccd/` mode `0700`, keyed on certificate CN | Per-client overrides, e.g. pinning `client-carol` to a fixed address so that a firewall rule can name her |

**The unrevoked lost client certificate — the risk that must be stated plainly.** The whole PKI design reduces to one operational truth: **a client certificate is a bearer credential with a long life.** If a laptop is lost, stolen, or simply not returned at the end of a contract, the certificate remains valid until either (a) the CRL is regenerated and the server reloads it, or (b) the certificate's own expiry passes. The design mitigates this with three layers and it must be honest about the residual risk:

1. `crl-verify` is enabled from day one, so revocation is a supported operation rather than a redesign.
2. A documented revocation drill is executed as evidence: `client-revocation-test` is revoked, `gen-crl` runs, the server reloads, and the revoked client is shown to fail — and the **before** and **after** connection attempts are both captured.
3. Client certificates expire in 825 days rather than never, which bounds the exposure window even if a revocation is never performed.

Residual risk that must be written down: between the loss of the laptop and the completion of the revocation (which requires someone to notice, obtain authority, and run two commands), the certificate is usable. The CRL's own 180-day validity adds a further requirement — an unrefreshed CRL expires and, depending on configuration, the server may then refuse **all** clients, which is a memorable failure mode and is listed in §8.12. The correct operational control is a scheduled task that regenerates the CRL and reloads the service well inside the validity window, and it must appear in the operations log.

#### 8.6.6 Verification

**Step 1 — start the server with verbosity and read the log.** `--verb 3` on the running service is normal operation; a diagnostic run uses a foreground invocation on a spare port so the live service is not disturbed:

```bash
# Diagnostic foreground run (does not conflict with the service if a different port is used):
sudo openvpn --config /etc/openvpn/server/server.conf --verb 3 --dev tun9 --port 11940
# Expected startup lines:
#   Note: --dev tun9 is a non-standard device; use it only for this test
#   OpenVPN 2.6.9 x86_64-pc-linux-gnu [SSL (OpenSSL)] [LZO] [LZ4] [EPOLL] [PKCS11] [MH/PKTINFO] [AEAD]
#   library versions: OpenSSL 3.0.x, LZO 2.10
#   TUN/TAP device tun9 opened
#   /sbin/ip link set dev tun9 up mtu 1500
#   /sbin/ip addr add dev tun9 10.10.202.1/24 broadcast 10.10.202.255
#   Could not determine IPv4/IPv6 protocol. Using AF_INET
#   UDPv4 link local (bound): [AF_INET][undef]:11940
#   Initialization Sequence Completed
```

Then stop that foreground run (`Ctrl-C`) and verify the **real** service, which is the thing that matters:

```bash
sudo systemctl restart openvpn-server@server
sudo systemctl status openvpn-server@server --no-pager | head -12
sudo journalctl -u openvpn-server@server -n 30 --no-pager
```

Expected healthy status:

```text
● openvpn-server@server.service - OpenVPN service for server
     Loaded: loaded (/usr/lib/systemd/system/openvpn-server@.service; enabled; preset: enabled)
     Active: active (running) since Tue 2026-10-06 03:02:11 HKT; 8s ago
   Main PID: 3311 (openvpn)
     Status: "Initialization Sequence Completed"
```

The `Status: "Initialization Sequence Completed"` line is the one-line health read, and it is what monitoring should parse.

**Step 2 — connect the revoked-then-reinstated client, and check the log for the expected handshake.**

```bash
# On the client host (a laptop or a second VM):
sudo openvpn --config /etc/openvpn/client/client-alice.ovpn --verb 3
```

Expected client-side lines at `verb 3`:

```text
TLS: Initial packet from [AF_INET]198.51.100.5:1194, sid=...
VERIFY OK: depth=1, CN=VP-ISSUING-CA-01... / CN=Easy-RSA CA
VERIFY OK: depth=0, CN=server-vpnz-lnxra01
Control Channel: TLSv1.3, cipher TLS_AES_256_GCM_SHA384, peer certificate: CN=server-vpnz-lnxra01
[server-vpnz-lnxra01] Peer Connection Initiated with [AF_INET]198.51.100.5:1194
PUSH: Received control message: 'PUSH_REPLY,topology subnet,route 10.10.30.0 255.255.255.0,route 10.10.0.0 255.255.0.0,route 10.10.90.0 255.255.255.0,dhcp-option DNS 10.10.30.11,dhcp-option DNS 10.10.30.12,dhcp-option DOMAIN vertexpeak.fyp.lab,ifconfig 10.10.202.10 255.255.255.0'
/sbin/ip addr add dev tun0 local 10.10.202.10 peer 10.10.202.11
Initialization Sequence Completed
```

And the matching server-side line:

```text
10.10.202.10:41234 peer info: IV_VER=2.6.9
10.10.202.10:41234 [client-alice] Peer Connection Initiated with [AF_INET]198.51.100.60:41234
client-alice/10.10.202.10:41234 MULTI_sva: pool returned IPv4=10.10.202.10
```

**Step 3 — prove the route table matches the design, and only the design.**

```bash
ip route show | grep -E 'tun0|10\.10\.'
```

Expected — the three pushed prefixes and nothing else:

```text
10.10.0.0/16 via 10.10.202.11 dev tun0
10.10.30.0/24 via 10.10.202.11 dev tun0
10.10.90.0/24 via 10.10.202.11 dev tun0
10.10.202.0/24 dev tun0 proto kernel scope link src 10.10.202.10
```

The **absence** of a `default` or `0.0.0.0/1` route is the proof that the tunnel is split and not full — and this absence is one of the required screenshots.

**Step 4 — a ping across the tunnel, and then the negative tests.**

```bash
ping -c 4 10.10.30.11            # the DC: must succeed
ping -c 4 10.10.90.10            # the DMZ VIP: must succeed (TB-11 permits 443; ICMP is a separate question)
curl -skI --max-time 5 https://10.10.90.10/healthz    # the published service through the tunnel
```

Expected:

```text
PING 10.10.30.11 (10.10.30.11) 56(84) bytes of data.
64 bytes from 10.10.30.11: icmp_seq=1 ttl=63 time=1.42 ms
64 bytes from 10.10.30.11: icmp_seq=2 ttl=63 time=1.18 ms
64 bytes from 10.10.30.11: icmp_seq=3 ttl=63 time=1.35 ms
64 bytes from 10.10.30.11: icmp_seq=4 ttl=63 time=1.21 ms
--- 10.10.30.11 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3004ms
```

The negative tests are the ones that prove the policy, and each must be run:

```bash
# The management zone must be unreachable (TB-12). Expect 100% loss, not "connection refused".
ping -c 3 -W 2 10.20.20.10 ; echo "exit=$?"

# The isolated lab must be unreachable (TB-09/TB-10).
ping -c 3 -W 2 10.70.0.50 ; echo "exit=$?"

# The iSCSI storage network must be unreachable.
ping -c 3 -W 2 10.10.80.21 ; echo "exit=$?"

# And the corresponding server-side evidence on vpnz-nft01:
sudo journalctl -k --since '-5min' | grep -E 'NFT-DROP: TB-12|NFT-DROP: TB-09'
```

`socket` behaviour worth noting for the person reading the evidence: an ICMP `100% packet loss` with a **timeout** means the packet was dropped by policy, while a `Destination Port Unreachable` or an immediate refusal means the packet *arrived* at a host. The distinction is the difference between "the firewall worked" and "the route was missing", and the report should say which one it observed.

**Step 5 — the revocation test, which is the security-relevant result.**

```bash
# 1. Confirm the client currently connects.
sudo openvpn --config /etc/openvpn/client/client-revocation-test.ovpn --verb 3 &
sleep 12
ip -br a show tun0          # expected: tun0 UP 10.10.202.1xx/24
sudo pkill -f client-revocation-test.ovpn

# 2. Revoke and regenerate.
cd /etc/openvpn/easy-rsa
sudo ./easyrsa --batch revoke client-revocation-test
sudo ./easyrsa gen-crl
sudo chmod 0644 pki/crl.pem
sudo cp pki/crl.pem /etc/openvpn/server/crl.pem
sudo systemctl restart openvpn-server@server

# 3. Reconnect: must fail.
sudo openvpn --config /etc/openvpn/client/client-revocation-test.ovpn --verb 3
```

Expected client-side failure:

```text
VERIFY OK: depth=0, CN=client-revocation-test
VERIFY CRL: depth=0, /CN=client-revocation-test
VERIFY ERROR: depth=0, error=certificate revoked: CN=client-revocation-test
TLS_ERROR: BIO read tls_read_plaintext error: error:0A000418:SSL routines::tlsv1 alert unknown ca
TLS Error: TLS object -> incoming plaintext read error
SIGTERM[hard,tls-error] received, process exiting
```

Expected server-side line:

```text
198.51.100.60:43812 VERIFY ERROR: depth=0, serial=0A:1B:..., CN=client-revocation-test
198.51.100.60:43812 CRL CHECK FAILED: CN=client-revocation-test is REVOKED
198.51.100.60:43812 TLS Error: TLS handshake failed
```

And the control that makes the test meaningful: a **non-revoked** client must still connect at the same moment. A revocation test in which everything stops working proves nothing about the CRL.

**Step 6 — the tunnel interface and conntrack view on the server host.**

```bash
ip -br a show tun0
ip route show | grep tun0
sudo ss -lunp | grep 1194
sudo conntrack -L -p udp --dport 1194 | head -5
cat /var/log/openvpn/status.log
```

Expected status file (version 2 format), which is the most useful single artefact for proving who was connected when:

```text
OpenVPN CLIENT LIST
Updated,Tue Oct  6 03:14:22 2026
Common Name,Real Address,Bytes Received,Bytes Sent,Connected Since
client-alice,198.51.100.60:41234,18432,15221,Tue Oct  6 03:12:41 2026
client-bob,203.0.113.77:50911,2048,1893,Tue Oct  6 03:13:02 2026
ROUTING TABLE
Virtual Address,Common Name,Real Address,Last Ref
10.10.202.10,client-alice,198.51.100.60:41234,Tue Oct  6 03:14:19 2026
10.10.202.11,client-bob,203.0.113.77:50911,Tue Oct  6 03:14:20 2026
GLOBAL STATS
Max bcast/mcast queue length,0
END
```
### 8.7 WireGuard

#### 8.7.1 Design, and the honest engineering discussion of branch interworking

WireGuard in this design has three roles, and only one of them is uncontroversial.

| Role | Endpoints | Inner addressing | Status |
|---|---|---|---|
| `WG-HQ-WC` — site-to-site between HQ and Wan Chai | `vpnz-nft01`/`vpnz-nft02` (VIP `10.10.50.10`, presented publicly as `203.0.113.2:443`) ↔ the Wan Chai peer | A = `10.10.200.1/24`, B = `10.10.200.5/24` | **DECIDED by Rev 1.1 / OD-01: Option A — `vpnz-wcwg01` terminates the tunnel; `VP-WC-EDGE-01` terminates only IPsec.** See below |
| `WG-REMOTE-POOL` — remote workers | same HQ VIP ↔ staff laptops | `10.10.200.64/26` (usable `10.10.200.65–126`) | Straightforward, and unaffected by the branch decision |
| `MGMT-TUNNEL` — out-of-band management escape hatch | `vpnz-nft01` ↔ `vpnz-mon01` | `10.10.200.200/32` and `10.10.200.201/32` | Documented as an emergency path; **must be disabled during the security test and its absence evidenced** |

**The open decision, stated honestly.** The design's Wan Chai peer is `VP-WC-EDGE-01`, which is a **Cisco IOS device simulated in Packet Tracer** — and a Cisco router cannot terminate WireGuard. This is not a limitation of the project's skill or of Packet Tracer; it is a statement about the technology: WireGuard is a Linux-kernel (and userspace) implementation, and no mainstream Cisco IOS release terminates it. The baseline records this as an open item to be closed by end of week 6, with two candidate resolutions:

**Option A — represent the Wan Chai encrypting gateway with a third Ubuntu VM.** A new guest `vpnz-wcwg01` (2 vCPU / 2 GB / 20 GB, attached to `VNET-WAN`, inner address `10.10.200.5`, and the optional extra host named in the baseline's hostname list) terminates WireGuard and represents the branch's encrypting gateway. The Cisco `VP-WC-EDGE-01` router continues to exist in Packet Tracer for the BGP/OSPF/IPsec story, and the honest statement is that **the WireGuard endpoint is emulated by a Linux VM that plays the role of the branch gateway**, while the IPsec tunnel to the ASA is the genuinely Cisco-represented site-to-site mechanism.

**Option B — WireGuard as the remote-worker tunnel only, with IPsec on the ASA for the branch.** *(Not taken: Rev 1.1 ruling OD-01 selects Option A. Retained so the alternative and its consequences are documented rather than silently dropped.)* The site-to-site requirement is satisfied by `IPSEC-HQ-WC` (IKEv2, UDP 500/4500, ASA `VP-HQ-FW-01` outside `198.51.100.1` to `VP-WC-EDGE-01` outside `203.0.113.5`), which is a genuine Cisco-to-Cisco mechanism and already the design's "optional transport for VLAN 131 only". WireGuard is then demonstrated **only** between the HQ pair and staff laptops, where the peer is a real WireGuard client and no Cisco interworking question arises at all.

**Recommendation, with the trade-off stated.** The recommendation is **Option A, the `vpnz-wcwg01` Ubuntu peer**, for four reasons:

1. **It keeps the site-to-site WireGuard claim real.** Under Option B, the only WireGuard peers in the project are staff laptops, and the design's own table describes `WG-HQ-WC` as the *primary small-office tunnel*. Dropping the site tunnel would leave the baseline's stated primary use unimplemented and would require the baseline to be revised.
2. **It preserves a like-for-like comparison.** The project's narrative motivation for two small-office mechanisms is comparison: IKEv2 on the ASA versus WireGuard on Linux. That comparison only exists if both tunnels actually come up between two gateways.
3. **It exercises multi-peer WireGuard on the HQ pair.** Two peers (the branch gateway and the remote pool) on one interface with overlapping-but-distinct `AllowedIPs` is where the interesting configuration errors live — the exact territory of the project's troubleshooting domain.
4. **It costs 2 GB of RAM and one VM.** The estate already runs 19 VMs and the two-shift fallback exists for memory pressure; a 2 GB guest is the cheapest of the two options in engineering time, because Option B requires rewriting the Wan Chai story in three chapters.

The honest **cost** of Option A must be stated at the same time: the Wan Chai gateway is a Linux VM *standing in for* a branch router, so the Cisco-to-Linux site-to-site path is **not** demonstrated, and the report may not claim that WireGuard interoperates with Cisco IOS. The tunnel's cryptographic endpoint on the branch side is not a Cisco device. That sentence belongs in the same paragraph as the recommendation, not in a footnote.

Whichever option is chosen, it must be recorded in the decision log against the open item for the WireGuard site-to-site peer, the choice must be reflected in the version/interface tables, and **the design must not claim WireGuard on a Cisco device** under any circumstances.

**Bridges and honesty for this sub-section.** `WireGuard` does not occur in the WSOS 2026 at all (0 occurrences in the text and in the raw HTML). The only licence the standard gives is the trailing `etc.` of `Provide network connectivity between remote branches using VPN technologies such as IPSec, SSL VPN, Direct Access, OpenVPN, DMVPN, GRE, etc.` (Domain 3, line 6) — and **OpenVPN, which is named in that same line, is implemented elsewhere in this chapter.** WireGuard is therefore presented as the weakest of the three bridges in this line, chosen by the group for engineering reasons (kernel-space performance, minimal configuration surface, modern cryptography) rather than because the standard asks for it.

#### 8.7.2 Key generation and management

WireGuard authentication is asymmetric keys only. The private key **is** the identity: there are no certificates, no CA, no revocation list and no expiry. The consequences must be understood before a single key is generated, because they change the operational model completely:

- **A leaked private key is unrevocable.** The only remedy is to stop trusting the corresponding **public** key on every peer — which means editing the peer configuration on every other endpoint, not calling a revocation service.
- **There is no expiry.** A key generated on day one is valid until someone removes it.
- **`AllowedIPs` is simultaneously the routing table and the access control.** A peer's authorised prefixes are exactly the prefixes the tunnel will route to it. There is no separate ACL.

```bash
# WireGuard tools. The pin is wireguard-tools 1.0.20210914 with the in-kernel module.
sudo apt-get install -y wireguard wireguard-tools
wg --version
# Expected: wireguard-tools v1.0.20210914 - https://git.zx2c4.com/wireguard-tools/
modinfo wireguard | head -3
# Expected: filename: /lib/modules/<ver>/kernel/drivers/net/wireguard/wireguard.ko
# If the kernel module is absent, the documented fallback is the userspace Go implementation
# (wireguard-go), which is slower and must be recorded as a deviation.
```

**The `umask 077` discipline.** Every key operation happens in a shell whose umask already forbids group and world access, so that even a momentary creation with default permissions cannot happen. Doing this *after* generation is not equivalent, because there is a window in which the key exists world-readable.

```bash
# Generate a key pair with the umask set BEFORE anything is written.
sudo -i
mkdir -p /etc/wireguard && chmod 0700 /etc/wireguard && cd /etc/wireguard
umask 077
wg genkey > privatekey-hq
wg pubkey < privatekey-hq > publickey-hq
# A preshared key adds a symmetric layer on top of the public-key handshake. It is optional but
# cheap, and it is recommended for the site-to-site peer.
wg genpsk > psk-hq-wc
chmod 0600 privatekey-hq psk-hq-wc ; chmod 0644 publickey-hq
ls -l /etc/wireguard
# Expected:
#   -rw------- 1 root root 45 Oct  6 03:20 privatekey-hq
#   -rw------- 1 root root 45 Oct  6 03:20 psk-hq-wc
#   -rw-r--r-- 1 root root 45 Oct  6 03:20 publickey-hq
```

Verify the umask did its job, because a key file with the wrong mode is the most common WireGuard misconfiguration:

```bash
stat -c '%a %U:%G %n' /etc/wireguard/*
# Expected: 600 for privatekey-* and psk-*, 644 for publickey-*
```

**Key storage and rotation policy.**

| Item | Rule |
|---|---|
| Location | `/etc/wireguard/`, mode `0700`, owner `root:root` |
| Private keys and PSKs | mode `0600`, **never** committed to Git |
| Public keys | mode `0644`; they are safe to publish and are recorded in the design's key table |
| `.gitignore` | must contain `wg*.conf`, `*.key`, `privatekey*`, `psk*`, `*.pem`, `pki/` — and this must be verified with a deliberate test commit |
| Transfer between hosts | copied over SSH, or pasted through the hypervisor console for the first bootstrap; **never** through chat, email or a Git commit |
| Rotation trigger | at the end of the project; after any suspected exposure; whenever a peer is decommissioned; and as a documented drill once during the build so the procedure is known to work |
| Rotation method | generate a new key pair on the peer, add the new public key to every other peer's `AllowedIPs` entry with a **narrower** allowed-IPs set, verify, then remove the old public key. Do the add-then-remove in that order, so the tunnel is never down. A rotation that removes first causes an outage |
| What rotation cannot do | it cannot revoke anything centrally. Every peer must be edited. The number of peers is therefore itself a security-relevant quantity, and it is why the remote-worker pool should be reviewed before it grows |

#### 8.7.3 Interface and peer configuration

**Endpoint A — the HQ side, on `vpnz-nft01`** (and identically on `vpnz-nft02`, with its own private key but the same peers).

```ini
# /etc/wireguard/wg0.conf     —   vpnz-nft01     mode 0600 root:root
# The WireGuard interface is the VPN front door for the site tunnel and the remote-worker pool.
# Tunnel network: 10.10.200.0/24 (site) and 10.10.200.64/26 (remote workers).
# Start:        sudo systemctl enable --now wg-quick@wg0
# Inspect:      sudo wg show ; sudo wg show all dump ; ip -br a show wg0
# SECURITY: this file contains a private key. It is in .gitignore and must never be committed.

[Interface]
# The tunnel-local address. 10.10.200.1/24 is the address that FLOATS WITH THE VIP: the same
# configuration exists on vpnz-nft02 (10.10.50.12) so that whichever node is VRRP master presents
# the same tunnel endpoint address. The floating tunnel address must be declared in the keepalived
# 'virtual_ipaddress_excluded' block as well, or the tunnel address will exist on both nodes.
Address    = 10.10.200.1/24
ListenPort = 443          # UDP 443 as fixed by the design; chosen because it traverses restrictive
                          # hotel and airport networks that block UDP 1194 and 500/4500.
PrivateKey = <contents of /etc/wireguard/privatekey-hq>

# Routing table discipline. Policy routing with a dedicated table keeps VPN routes out of the main
# table so that a mistake in AllowedIPs cannot black-hole ordinary traffic.
Table = off               # we install routes explicitly below rather than letting wg-quick do it
# PostUp/PostDown run as root when the interface comes up and goes down.
PostUp   = ip -4 rule add from 10.10.200.0/24 lookup 51820 priority 100
PostUp   = ip -4 rule add from 10.10.200.64/26 lookup 51820 priority 100
PostUp   = ip -4 route add 10.10.210.0/24 dev wg0 table 51820
PostUp   = ip -4 route add 10.10.200.64/26 dev wg0 table 51820
PostDown = ip -4 rule del from 10.10.200.0/24 lookup 51820 priority 100 || true
PostDown = ip -4 rule del from 10.10.200.64/26 lookup 51820 priority 100 || true
PostDown = ip -4 route flush table 51820 || true

# Optional: an fwmark tags every encapsulated packet so a routing rule can send it out the
# correct egress interface and so that a loop back into the tunnel is impossible.
# FwMark = 0x51820
#   With FwMark set, add:  ip rule add fwmark 0x51820 lookup 51820 priority 100

# Reduce the interface MTU to leave room for the encapsulation overhead.
# 1420 is the value in the WireGuard documentation for a 1500-byte path; it is conservative and
# prevents the classic "ping works, TCP stalls" symptom caused by fragmentation.
MTU = 1420

# ---------------------------------------------------------------
# PEER 1 — the Wan Chai site peer (Option A: vpnz-wcwg01, the Ubuntu peer)
# ---------------------------------------------------------------
[Peer]
# Public key of the Wan Chai endpoint. Generated on that host with 'wg genkey | wg pubkey'.
PublicKey    = <public key of vpnz-wcwg01>
PresharedKey = <contents of /etc/wireguard/psk-hq-wc>       # adds a symmetric layer to the handshake

# AllowedIPs is BOTH the route list and the access control for this peer.
# ONLY the two Wan Chai subnets are listed. 0.0.0.0/0 is deliberately absent: a site-to-site
# peer must never be allowed to route arbitrary traffic through this interface.
AllowedIPs   = 10.10.130.0/24, 10.10.131.0/24

# The Wan Chai peer's public address. The design fixes 203.0.113.5 for VP-WC-EDGE-01's outside
# interface; with Option A the Ubuntu peer carries the same address so the tunnel endpoint
# matches the design's addressing regardless of which option was chosen.
# Port 443 on both ends keeps the tunnel symmetric and firewall-friendly.
Endpoint     = 203.0.113.5:443

# Keepalive is set ONLY on this side. Behind NAT, the peer's map needs to stay open; if BOTH
# sides send keepalives the internet sees twice the traffic for no benefit. The baseline's rule is
# "PersistentKeepalive = 25 on the client side only", and here the HQ pair is the client.
PersistentKeepalive = 25

# ---------------------------------------------------------------
# PEER 2 — the remote-worker pool
# ---------------------------------------------------------------
[Peer]
# The remote-worker peers are added ONE PER CLIENT, not as a single shared entry, because
# AllowedIPs is per-peer access control: a shared key would let one laptop use another's address.
# The example below is the template; the real file carries one block per issued laptop.
PublicKey    = <public key of the staff laptop 'laptop-alice'>
AllowedIPs   = 10.10.200.65/32         # a SINGLE /32 per client, never a range
# No Endpoint line: remote workers are behind unpredictable NATs, so the HQ side learns the
# observed endpoint from the first authenticated packet. This is the correct pattern, and an
# Endpoint line here would be wrong.
# PersistentKeepalive is NOT set on the HQ side for these peers: the laptops send it.
```

The equivalent file on the branch peer (Option A), which is the mirror image and is worth stating in full because the asymmetry is deliberate:

```ini
# /etc/wireguard/wg0.conf     —   vpnz-wcwg01 (the Wan Chai encrypting peer)    mode 0600
[Interface]
Address    = 10.10.200.5/24          # fixed by the tunnel addressing table
ListenPort = 443
PrivateKey = <private key generated on vpnz-wcwg01>
Table      = off
PostUp   = ip -4 route add 10.10.0.0/16 dev wg0
PostUp   = ip -4 route add 10.10.90.0/24 dev wg0
PostDown = ip -4 route del 10.10.0.0/16 dev wg0 || true
PostDown = ip -4 route del 10.10.90.0/24 dev wg0 || true
MTU = 1420

[Peer]
# The HQ side. The public key is the HQ pair's key.
PublicKey    = <public key of vpnz-nft01/nft02>
PresharedKey = <the SAME psk as on the HQ side — a mismatch here fails the handshake silently>
# Only the two HQ prefixes the branch is authorised to reach. Management (10.20.0.0/16) and the
# isolated lab (10.70.0.0/16) are absent, which mirrors TB-14 and TB-12.
AllowedIPs   = 10.10.0.0/16, 10.10.90.0/24, 10.10.200.0/24

# The HQ endpoint. 203.0.113.2 is the address the design presents for the HQ tunnel endpoints,
# mapped to the nftables VIP 10.10.50.10. Using the VIP rather than a node address is what makes
# the tunnel survive a keepalived failover.
Endpoint     = 203.0.113.2:443
PersistentKeepalive = 25
```

Two notes that must not be lost. First, **`Endpoint = 203.0.113.2:443` must point at the VIP, not at `10.10.50.11`.** Pointing at a node address means the tunnel dies on every failover, which is precisely the coupling between this sub-section and §8.4 that a reader will otherwise miss. The same rule applies to the nginx VIP: `vpnz-dmzrev01` is `10.10.90.28`, not the VIP `10.10.90.10` (Rev 1.1 ruling C-02), so any configuration that treats `10.10.90.10` as a node address is wrong. Second, **the `PresharedKey` must be byte-identical on both ends.** A mismatch produces a handshake that never completes with no explicit error message, and it is on the failure-mode list in §8.12.

#### 8.7.4 Routing and firewall interaction

**nftables handling of the WireGuard interface.** Three things must be true for the tunnel to work at all, and each corresponds to a rule in the rule set or a setting in the interface configuration:

1. **The UDP listener port must be permitted inbound.** `udp dport 443 iifname "ens224"` in the `input` chain is what allows the encapsulated packets to arrive.
2. **Transiting traffic must be associated with the tunnel interface.** WireGuard delivers decrypted packets on `wg0`, so the `forward` chain must see the tunnel as an interface. This is where **`iifname` and `oifname` matter more than anywhere else in the design**: `wg0` is a virtual interface whose *index* changes when the interface is recreated, so `iif` with a numeric index would silently stop matching after a restart, while `iifname "wg0"` is stable. The `forward` chain therefore carries interface-scoped rules for the tunnel, and those rules must appear **after** the `ct state` shortcut and **before** the catch-all drop.
3. **NAT must not be applied to the tunnel traffic** unless the design intends it. In this design the VPN pools are routable internal addresses (`10.10.200.64/26` is routed, not masqueraded), because the whole point of a VPN is that source addresses are preserved for attribution. Adding a `masquerade` rule for `wg0` would hide the tunnel client's identity and is therefore deliberately absent — and the temptation to add it as a "fix" when routing misbehaves is one of the failure modes in §8.12.

The relevant additions to the rule set (shown separately here for clarity; in the delivered files they belong in `30-filter-forward.nft`):

```nftables
# --- WireGuard interface handling in the forward chain ---
# The tunnel is an interface-level source of truth: traffic arriving on wg0 is authenticated
# by WireGuard itself and carries the peer's tunnel address.
iifname "wg0" ip saddr 10.10.200.0/24 ip daddr @lan4 counter accept \
    comment "WG-HQ-WC: the branch peer reaches the internal prefixes it is authorised for"
iifname "wg0" ip saddr 10.10.200.64/26 ip daddr @lan4 counter accept \
    comment "WG-REMOTE-POOL: remote workers reach the same service set as the branch peer"
iifname "wg0" counter log prefix "NFT-DROP: WG-FORWARD " level warn counter drop \
    comment "anything arriving on the tunnel that is not from an authorised prefix is dropped and logged"

# --- outbound into the tunnel: the replies and the branch-originated requests ---
oifname "wg0" ip daddr { 10.10.130.0/24, 10.10.131.0/24 } counter accept \
    comment "traffic destined for the Wan Chai subnets goes into the tunnel, not out to the WAN"

# --- the management escape hatch must be called out so it can be proven absent during the test ---
udp dport 51820 iifname "ens224" ip saddr 10.10.30.31 counter accept comment "MGMT-TUNNEL (disabled for the security test)"
```

**The `fwmark` / policy-routing technique.** If the tunnel endpoint and the tunnel's own transport are both reachable through the same default route, a routing loop is possible: a packet to `203.0.113.5` could itself be routed *into* `wg0`. Two mechanisms prevent that, and the design documents both so that whichever is used is a decision rather than an accident.

```bash
# Mechanism 1 (used here) — a dedicated routing table plus source-based rules.
# Traffic FROM the tunnel's own inner prefixes is looked up in table 51820, which contains only
# the tunnel routes; everything else uses the main table. wg-quick's 'Table = off' plus explicit
# PostUp rules implement exactly this.
ip -4 rule show
# Expected:
#   100:	from 10.10.200.0/24 lookup 51820
#   100:	from 10.10.200.64/26 lookup 51820
ip -4 route show table 51820
# Expected:
#   10.10.210.0/24 dev wg0 scope link
#   10.10.200.64/26 dev wg0 scope link

# Mechanism 2 (documented alternative) — an fwmark on encapsulated packets.
# Uncomment 'FwMark = 0x51820' in wg0.conf and add the matching rule:
#   ip rule add fwmark 0x51820 lookup 51820 priority 100
# The advantage of fwmark is that it identifies the ENCAPSULATED packets specifically, which is
# more precise than identifying traffic by source prefix. Its cost is one more piece of state to
# explain and to get wrong.
```

The routing for the remote-worker pool needs one more piece that is easy to omit: the pool addresses (`10.10.200.64/26`) must be **routed back into the tunnel**, or replies to a remote worker will be sent to the default gateway and dropped. That is what `PostUp = ip -4 route add 10.10.200.64/26 dev wg0 table 51820` does, and the symptom of forgetting it is a handshake that succeeds with no data transfer at all — recorded in §8.12.

#### 8.7.5 Verification

**Step 1 — the interface and its peers.**

```bash
sudo systemctl enable --now wg-quick@wg0
systemctl status wg-quick@wg0 --no-pager | head -6
sudo wg show
```

Expected:

```text
interface: wg0
  public key: <HQ public key, base64>
  private key: (hidden)
  listening port: 443

peer: <vpnz-wcwg01 public key>
  preshared key: (hidden)
  endpoint: 203.0.113.5:443
  allowed ips: 10.10.130.0/24, 10.10.131.0/24
  latest handshake: 34 seconds ago
  transfer: 18.42 KiB received, 21.07 KiB sent
  persistent keepalive: every 25 seconds

peer: <laptop-alice public key>
  allowed ips: 10.10.200.65/32
  latest handshake: 2 minutes, 11 seconds ago
  transfer: 4.11 KiB received, 6.02 KiB sent
```

**Step 2 — machine-readable state, which is what a monitoring or Ansible check should parse.**

```bash
sudo wg show all dump
```

Expected (tab-separated; the column order is exactly as shown):

```text
wg0	<HQ-private>	<HQ-public>	443	off
wg0	<wcwg01-public>	(none)	203.0.113.5:443	10.10.130.0/24,10.10.131.0/24	1759720...	18432	21072	25
wg0	<alice-public>	(none)	(none)	10.10.200.65/32	0	4110	6021	0
```

The `latest handshake` field is the health signal: **a peer with no handshake at all** (shown as `0` in the dump) has never completed the cryptographic handshake, which points at a key, PSK or reachability problem; **a peer whose handshake is minutes old but nonzero in transfer** is working and simply idle. Distinguishing those two states is the single most useful troubleshooting skill in this sub-section, and the parsing check is:

```bash
# A one-line liveness test suitable for a monitoring check or an Ansible assertion.
sudo wg show all dump | awk -F'\t' 'NR>1 && $5!="(none)" { now=systime(); if ($6==0 || now-$6>180) print "STALE: peer " $4 " handshake " $6; else print "OK: peer " $4 }'
```

**Step 3 — handshake confirmation and the interface state.**

```bash
ip -br a show wg0
ip route show table 51820
ip -4 rule show
sudo ss -lunp | grep 443
```

Expected:

```text
wg0              UNKNOWN        10.10.200.1/24
```

```text
10.10.200.64/26 dev wg0 scope link
10.10.210.0/24 dev wg0 scope link
```

```text
100:	from 10.10.200.0/24 lookup 51820
100:	from 10.10.200.64/26 lookup 51820
```

```text
UNCONN 0      0         0.0.0.0:443      0.0.0.0:*    users:(("wg-0-wg0",pid=...))
```

**Step 4 — connectivity and scope evidence.** Both a positive and a negative test, from the branch peer's perspective:

```bash
# On vpnz-wcwg01 (the Wan Chai peer):
ping -c 4 10.10.30.11        # a server in the authorised set: must succeed
ping -c 4 10.10.90.10        # the DMZ VIP: must succeed
ping -c 4 10.20.20.10        # Z-MGMT: must FAIL (TB-14 denies the branch router access)
ping -c 4 10.70.0.50         # Z-STUDENT: must FAIL (TB-09/TB-10)
```

Expected:

```text
PING 10.10.30.11 (10.10.30.11) 56(84) bytes of data.
64 bytes from 10.10.30.11: icmp_seq=1 ttl=63 time=3.11 ms
...
4 packets transmitted, 4 received, 0% packet loss, time 3003ms

PING 10.20.20.10 (10.20.20.10) 56(84) bytes of data.
--- 10.20.20.10 ping statistics ---
4 packets transmitted, 0 received, 100% packet loss, time 3061ms
```

and the matching drop on the firewall:

```bash
sudo journalctl -k --since '-5min' | grep 'NFT-DROP: TB-14'
# Expected:
#   vpnz-nft01 kernel: NFT-DROP: TB-14 IN=ens224 ... SRC=10.10.130.1 DST=10.20.20.10 PROTO=ICMP ...
```

**Step 5 — the management escape hatch must be provably disabled.**

```bash
# The documented control: disable the MGMT-TUNNEL before the security test and evidence its absence.
sudo wg set wg1 peer <mon01-public-key> remove 2>/dev/null || true
sudo ip link del wg1 2>/dev/null || true
ip -br a show | grep -c wg1        # expected: 0
sudo wg show all dump | grep -c '10.10.200.200'   # expected: 0
```

**Step 6 — throughput sanity with `iperf3`.** The WSOS does not name `iperf3` (the standard names `tcpdump`, `NetFlow`, `Syslog`, `SNMP` and `CDP`), so this test is justified as a project engineering check, not as a standard requirement — and it must be labelled that way.

```bash
# On the HQ side as server:
sudo apt-get install -y iperf3
iperf3 -s
# On the branch peer as client, through the tunnel:
iperf3 -c 10.10.200.1 -t 15 -P 4
```

Expected form of the result (the numbers below are illustrative of the *shape* and must be replaced by the measured values from the host — never copied):

```text
- - - - - - - - - - - - - - - - - - - - - - - - -
[ ID]   Interval         Transfer     Bitrate         Retr
[SUM]   0.00-15.00  sec   168 MBytes  93.9 Mbits/sec    12             sender
[SUM]   0.00-15.00  sec   167 MBytes  93.4 Mbits/sec                  receiver
```

Three interpretation rules that must accompany any throughput figure in the report: (a) this is a **host-only virtual network on one machine**, so the number measures the hypervisor's virtual switch and CPU, not real branch bandwidth; (b) a WireGuard tunnel is CPU-bound on a 2-vCPU guest, so the figure is a CPU measurement as much as a network one; and (c) the figure must never be presented as a real-world WAN throughput. The correct framing is *"a throughput measurement of the emulated link, used to confirm the tunnel carries traffic and to compare the two small-office mechanisms under identical conditions"* — which is a genuine, defensible result, whereas a claimed 94 Mbit/s branch link would not be.

### 8.8 Linux Server Baseline Hardening

The controls below are applied to every Ubuntu guest by `04-automation/bash/01-hardening-baseline.sh` and enforced idempotently by `ansible/playbooks/02-baseline-linux.yml` (`roles/common/`). Each row states a concrete value, the file that holds it, and the reason — because a hardening table without a rationale is a checklist nobody can defend in a viva.

#### 8.8.1 SSH and local access

| Control | Setting | File / mechanism | Rationale |
|---|---|---|---|
| Root login | `PermitRootLogin no` | `/etc/ssh/sshd_config.d/10-fyp-hardening.conf` | No shared account, no un-attributable administrative action. Administrators use `adm-{initials}` and escalate with `sudo`, which is logged |
| Password authentication | `PasswordAuthentication no`, `KbdInteractiveAuthentication no` | same | Passwords over a network are replacable; keys are not. Also removes the entire brute-force surface from the internet-facing path |
| Authentication methods | `AuthenticationMethods publickey` | same | Explicitly refuses a password fallback even if a client offers one |
| Empty passwords | `PermitEmptyPasswords no` | same | Closes an accidental "account with no password" hole |
| Access restriction | `AllowGroups gg-infra-admins` | same | A named group rather than a shared account; the local group mirrors the Windows `GG-Infra-Admins` group so the same four administrators exist on both platforms |
| Root group deny | `DenyUsers root` | same | A second, independent refusal in case a future edit relaxes `PermitRootLogin` |
| Failed-attempt limit | `MaxAuthTries 3` | same | Bounds a key-guessing loop |
| Session limit | `MaxSessions 4` | same | Prevents one authenticated session from opening unbounded multiplexed channels |
| Login grace | `LoginGraceTime 30` | same | An unauthenticated connection cannot hold a slot indefinitely — the classic DoS against `sshd` |
| Forwarding | `X11Forwarding no`, `AllowAgentForwarding no`, `AllowTcpForwarding no`, `PermitTunnel no`, `GatewayPorts no` | same | Every forwarding feature is a way to pivot. Exceptions are granted per host in a separate drop-in (the DMZ jump host needs `AllowTcpForwarding yes`, and that is documented as an exception rather than baked into the baseline) |
| Environment injection | `PermitUserEnvironment no` | same | Prevents `~/.ssh/environment` from setting variables that `sudo` might honour |
| Host-based auth | `HostbasedAuthentication no`, `IgnoreRhosts yes` | same | Removes the historical `.rhosts` trust model |
| Reverse lookup | `UseDNS no` | same | Avoids a login stall when DNS is slow, and removes a dependency on the resolver during authentication |
| Dead session reaper | `ClientAliveInterval 300`, `ClientAliveCountMax 2` | same | An abandoned session is closed after ~10 minutes instead of staying open forever |
| Logging level | `LogLevel VERBOSE` | same | Records the **key fingerprint** used for each login, which is what makes "who logged in with which key" answerable. This is the data source for the AI line's `auth-failure-report` skill |
| SFTP | `Subsystem sftp internal-sftp` | same | Uses the in-process SFTP server; no separate binary to keep patched |
| Sudo authority | `%gg-infra-admins ALL=(ALL:ALL) ALL` | `/etc/sudoers.d/10-fyp-admins` (0440) | Least privilege at the group level; validated with `visudo -c -f` |
| Sudo session timeout | `timestamp_timeout=5` | same | A five-minute credential cache rather than the default 15, so a walked-away session escalates less easily |
| Sudo audit | `logfile="/var/log/fyp/sudo.log"`, `log_input`, `log_output` | same | Records the commands **and their output** of every privileged action — the Linux analogue of the PowerShell transcription the due-diligence questionnaire demands. Collected by `logrotate` and shipped to the monitoring host |
| PTY enforcement | `Defaults use_pty` | same | Without it, a `sudo` child can survive its parent and be invisible to the session's terminal |

#### 8.8.2 Kernel parameters

The full file is in §8.5.4; the table below states which parameters matter and why, including the ones that are host-role specific.

| Parameter | Value | Rationale |
|---|---|---|
| `net.ipv4.ip_forward` | `1` on `vpnz-nft01/02` only, `0` elsewhere | A firewall host must forward; a web server must never be a router. Setting it globally to 1 would let a compromised DMZ host become a router |
| `net.ipv4.conf.all.rp_filter` | `1` | Drops packets whose source is not reachable back through the arrival interface — the cheapest anti-spoofing control available |
| `net.ipv4.tcp_syncookies` | `1` | Survives a SYN flood without losing the listener |
| `net.ipv4.tcp_rfc1337` | `1` | Drops RST packets in `TIME_WAIT`, closing a real connection-reset primitive |
| `net.ipv4.tcp_timestamps` | `0` | Removes an uptime-fingerprinting side channel. `[ASSUMPTION]` this can interact with PAWS and very fast link reuse; on a host-only lab segment the effect is nil, but the interaction must be stated |
| `net.ipv4.conf.all.accept_redirects` | `0` | A server must never accept an ICMP redirect telling it to use a different gateway — that is a man-in-the-middle primitive |
| `net.ipv4.conf.all.send_redirects` | `0` | And must never generate one |
| `net.ipv4.conf.all.accept_source_route` | `0` | Source routing is obsolete and abusable |
| `net.ipv4.icmp_echo_ignore_broadcasts` | `1` | No smurf/tribe amplification |
| `net.ipv4.conf.all.log_martians` | `1` | Makes spoofed traffic visible instead of silently dropped — this makes the `rp_filter` control **observable**, which matters for the verification chapter |
| `net.ipv4.ip_local_port_range` | `10240 65000` | Keeps ephemeral ports out of the low range where they can collide with service ports and confuse a rule review |
| `net.netfilter.nf_conntrack_max` | `131072` | An explicit, monitored ceiling rather than a version default |
| `kernel.dmesg_restrict` | `1` | Unprivileged users cannot read the kernel ring, which contains nftables log lines that may disclose topology |
| `kernel.kptr_restrict` | `2` | Hides kernel pointers, removing a KASLR-defeating information leak |
| `kernel.yama.ptrace_scope` | `1` | A process may only be traced by its own descendants — blocks cross-user credential theft from a process's memory |
| `kernel.randomize_va_space` | `2` | Full ASLR |
| `fs.protected_hardlinks`, `fs.protected_symlinks` | `1` | Blocks the classic `/tmp` symlink and hardlink privilege escalations |

#### 8.8.3 File permissions and ownership

| Path | Mode | Owner | Rationale |
|---|---|---|---|
| `/etc/ssh/sshd_config.d/10-fyp-hardening.conf` | `0644` | `root:root` | Readable by all (it is not a secret), writable only by root. `sshd` refuses a group/world-writable configuration in some builds |
| `/etc/netplan/50-cloud-init.yaml` | `0600` | `root:root` | Netplan warns on world-readable files and the file carries full addressing detail |
| `/etc/sudoers.d/10-fyp-admins` | `0440` | `root:root` | `sudo` refuses to run with a group/world-writable sudoers file; this is a hard fail, not a warning |
| `/etc/nginx/ssl/*.key`, `/etc/nginx/ssl/portal.key` | `0600` | `root:root` | TLS private keys. Nginx reads them as root before dropping to `www-data` |
| `/etc/nginx/ssl/*.crt`, `chain.crt` | `0644` | `root:root` | Public material |
| `/etc/nginx/.htpasswd-portal` | `0640` | `root:www-data` | Nginx must read it after privilege drop; nobody else may |
| `/etc/keepalived/keepalived.conf` | `0644` | `root:root` | Contains a VRRP shared secret; the host-only segment and the file's non-world-writable mode are the controls, and the secret is a lab simplification |
| `/etc/nftables.conf`, `/etc/nftables.d/*.nft` | `0644` | `root:root` | No credentials in the ruleset; readable so that a reviewer and Ansible's `--diff` can read it |
| `/etc/wireguard/wg0.conf`, `privatekey*`, `psk*` | `0600` | `root:root` | **Private keys.** Also listed in `.gitignore`. `wg-quick` will warn on a world-readable key file |
| `/etc/openvpn/easy-rsa/` | `0700` | `root:root` | The whole PKI directory; the `pki/private/` subtree must never be readable by anyone else |
| `/etc/openvpn/easy-rsa/vars` | `0600` | `root:root` | Contains no key material but does contain the CA defaults |
| `/etc/openvpn/server/*.key`, `/etc/openvpn/server/crl.pem` | `0600` / `0644` | `root:root` | The server key stays `0600`; the CRL copy is `0644` because the server reads it after dropping privileges to `nobody` (see §8.6.2) |
| `/etc/openvpn/ccd/` | `0700` | `root:root` | Per-client overrides |
| `/etc/openvpn/client/*.ovpn` | `0600` | `root:root` | These files contain a private key by design |
| `/var/log/fyp/` | `0750` | `root:adm` | Script and sudo logs; readable by the `adm` group, which monitoring uses |
| `/srv/backup/` (on `vpnz-dmzjump01`) | `0700` | `root:root` | The restic repository |
| `/opt/openclaw/` | `0755` | `root:root`; `logs/agent.jsonl` at `0640` | The runtime directory is readable; the agent audit log is not |
| Custom scripts in `/usr/local/bin` | `0755` | `root:root` | Executable but writable by root only — required by keepalived's `enable_script_security` |

A periodic audit, which is itself the evidence that the table is real rather than aspirational:

```bash
# Find world-writable files outside the known-safe locations (e.g. /tmp, /var/tmp).
sudo find / -xdev -type f -perm -0002 -not -path '/proc/*' -not -path '/sys/*' \
     -not -path '/tmp/*' -not -path '/var/tmp/*' -not -path '/var/mail/*' 2>/dev/null | tee /var/log/fyp/world-writable.txt
wc -l /var/log/fyp/world-writable.txt     # expected: 0

# Find secrets with the wrong mode. Any output here is a defect.
sudo find /etc/wireguard /etc/openvpn /etc/nginx/ssl -type f \( -name '*.key' -o -name 'privatekey*' -o -name 'psk*' \) \
     ! -perm 600 -exec ls -l {} \;      # expected: no output
```

#### 8.8.4 auditd rules

`auditd` provides an independent, kernel-level record that cannot be edited by a user-space process — which is what makes it different from a log file, and why it is the right source for the AI line's read-only evidence.

```bash
sudo apt-get install -y auditd audispd-plugins
sudo systemctl enable --now auditd
```

```ini
# /etc/audit/rules.d/99-fyp.rules   —   loaded by augenrules into /etc/audit/audit.rules
# Immutable bit: set LAST, and it stays set until reboot. Removing it requires a reboot,
# which is exactly the property that makes an audit trail trustworthy.

# ---- identity and privilege ----
-w /etc/passwd   -p wa -k fyp_identity
-w /etc/shadow   -p wa -k fyp_identity
-w /etc/group    -p wa -k fyp_identity
-w /etc/sudoers  -p wa -k fyp_sudoers
-w /etc/sudoers.d/ -p wa -k fyp_sudoers

# ---- SSH and authentication ----
-w /etc/ssh/sshd_config                 -p wa -k fyp_sshd
-w /etc/ssh/sshd_config.d/              -p wa -k fyp_sshd
-w /root/.ssh/                          -p wa -k fyp_sshkeys

# ---- the firewall and the tunnels: the configuration that can lock the host out ----
-w /etc/nftables.conf    -p wa -k fyp_nftables
-w /etc/nftables.d/      -p wa -k fyp_nftables
-w /etc/keepalived/keepalived.conf -p wa -k fyp_keepalived
-w /etc/wireguard/       -p wa -k fyp_wireguard
-w /etc/openvpn/         -p wa -k fyp_openvpn

# ---- PKI material ----
-w /etc/openvpn/easy-rsa/pki -p wa -k fyp_pki
-w /etc/nginx/ssl            -p wa -k fyp_tls

# ---- privilege escalation and process execution by administrators ----
-a always,exit -F arch=b64 -S execve -F auid>=1000 -F auid!=-1 -k fyp_exec
-a always,exit -F arch=b64 -S setuid  -F auid>=1000 -F auid!=-1 -k fyp_setuid

# ---- network configuration change ----
-a always,exit -F arch=b64 -S sethostname -S setdomainname -k fyp_network
-w /etc/hostname  -p wa -k fyp_network
-w /etc/hosts     -p wa -k fyp_network
-w /etc/netplan/  -p wa -k fyp_network
-w /etc/resolv.conf -p wa -k fyp_network

# ---- kernel module and time change (anything that could hide activity) ----
-a always,exit -F arch=b64 -S init_module -S finit_module -k fyp_module
-a always,exit -F arch=b64 -S adjtimex -S settimeofday -k fyp_time
-w /etc/chrony/chrony.conf -p wa -k fyp_time

# ---- make the rules immutable. MUST be the last line in the file. ----
-e 2
```

```bash
sudo augenrules --load
sudo auditctl -s | grep -E 'enabled|pid'
# Expected: enabled 2   (2 = immutable/locked)
sudo auditctl -l | wc -l              # rule count, recorded as a build fact
sudo ausearch -k fyp_nftables -ts recent | tail -5
```

The `-k` keys are chosen so that the AI line's `alert-triage` skill can query a *semantic* category (`fyp_nftables`, `fyp_sshkeys`) rather than a raw syscall number. `ausearch -k <key>` is a read-only operation, which is the only kind of access the agent is permitted at all.

#### 8.8.5 Service minimisation

The principle is that a host should run nothing it does not need, because every listening socket is attack surface and every running daemon is a patching obligation. The allow-list per role is a build artefact and it is checked, not assumed.

| Host role | Services that MUST be running | Deliberately absent, with reason |
|---|---|---|
| `vpnz-nft01/02` | `nftables`, `keepalived`, `wg-quick@wg0`, `ssh`, `systemd-networkd`, `chrony`, `rsyslog`, `node_exporter`, `unattended-upgrades`, `auditd`, `apparmor` | No web server, no database, no mail, no printing (`cups`), no `avahi`, no `ModemManager` |
| `vpnz-dmzrev01/02` | `nginx`, `keepalived`, `ssh`, `systemd-networkd`, `chrony`, `rsyslog`, `node_exporter`, `unattended-upgrades`, `auditd`, `apparmor` | No database, no `php-fpm` (that belongs on the WordPress nodes), no mail |
| `vpnz-dmzwp01/02` | `nginx`, `php8.3-fpm`, `mariadb-server`, `ssh`, `chrony`, `rsyslog`, `node_exporter`, `unattended-upgrades`, `auditd`, `apparmor` | MariaDB must bind to `127.0.0.1` only (as the port matrix states) — a listening `3306` on the DMZ interface is a finding, not a configuration choice |
| `vpnz-lnxra01` | `openvpn-server@server`, `ssh`, `chrony`, `rsyslog`, `node_exporter`, `unattended-upgrades`, `auditd`, `apparmor`, and its own `nftables` host firewall | No web server, no database |
| `vpnz-dmzjump01` | `ssh` (with the forwarding exception), `rsyslog`, `chrony`, `node_exporter`, `unattended-upgrades`, `auditd`, `apparmor` | No web server. It is the backup repository host and the only DMZ management path, so its own hardening is the tightest of the DMZ hosts |
| `vpnz-mon01` | `prometheus`, `grafana-server`, `loki`, `rsyslog`, `ssh`, `chrony`, `node_exporter`, `unattended-upgrades`, `auditd`, `apparmor`, plus `ansible`/`git` used on demand | No web server beyond Grafana; the Git service is exposed over SSH, not over HTTP, unless a web UI is later justified |
| `vpnz-ai01` | the agent runtime, `ssh` (read-only use), `chrony`, `rsyslog`, `node_exporter`, `unattended-upgrades`, `auditd`, `apparmor` | **No shell that can reach a device** other than through the four declared read-only tools. This is the central guardrail and must be demonstrated, not asserted |

```bash
# The per-host check: every listening socket must be justifiable from the table above.
sudo ss -tulpn
# Compare against docs/role-allowlist-<host>.txt, which is committed with the runbook.
# Expected output on vpnz-nft01 (form, not an invention — capture the real addresses and PIDs):
#   Netid State  Local Address:Port  Process
#   udp   UNCONN 0.0.0.0:443         users:(("wg-0-wg0"...))
#   udp   UNCONN 0.0.0.0:514?        (no - the firewall does not listen for syslog)
#   tcp   LISTEN 0.0.0.0:22          users:(("sshd",pid=...))
#   tcp   LISTEN 127.0.0.1:9100      users:(("node_exporter",pid=...))
#   udp   UNCONN 0.0.0.0:112         (VRRP is not a socket; it is IP protocol 112)
```

```bash
# Disable and mask services that must never run on a server.
for svc in cups avahi-daemon avahi-daemon.socket ModemManager bluetooth apache2; do
    sudo systemctl disable --now "${svc}" 2>/dev/null || true
    sudo systemctl mask "${svc}" 2>/dev/null || true
done
# 'mask' rather than 'disable': a masked unit cannot be started even as a dependency of something
# else, which 'disable' does not prevent.

# Purge the ones that are pure attack surface on a server.
sudo apt-get purge -y cups avahi-daemon
```

#### 8.8.6 AppArmor and SELinux status

| Platform | Mechanism | Status in this design | Statement required in the report |
|---|---|---|---|
| Ubuntu 24.04 guests | **AppArmor** | **Enabled, distribution default profiles only** | The design runs AppArmor in complain/enforce mode as shipped. **No custom profile is authored.** This must be stated as a deliberate limit, not implied as full mandatory access control |
| Ubuntu 24.04 guests | SELinux | **Not installed** | SELinux is not the Ubuntu default. It is absent, and its absence is stated |
| Windows Server guests | Neither | n/a | The equivalent controls on Windows are the GPO baselines, documented in the Microsoft chapter |

```bash
sudo aa-status --enabled && echo "AppArmor enabled"
sudo aa-status | head -20          # profiles loaded, enforce vs complain counts
sudo aa-status | grep -c 'enforce' # recorded as a build fact per host
systemctl is-enabled apparmor
getenforce 2>/dev/null || echo "SELinux not installed (expected on Ubuntu)"
```

Expected first lines:

```text
AppArmor enabled
apparmor module is loaded.
NN profiles are loaded.
NN profiles are in enforce mode.
...
processes are unconfined but have a profile defined.
```

`[ASSUMPTION]` worth recording: Nginx and OpenVPN both ship AppArmor profiles on Ubuntu. When the project moves `nginx.conf` to a `conf.d` layout and points TLS material at `/etc/nginx/ssl/`, the shipped `usr.sbin.nginx`-style profile may deny reads of the new paths. The observable symptom is a `502` with `Permission denied` in the Nginx error log **and** an AppArmor denial in the journal (`apparmor="DENIED" operation="open"`), which is a genuinely confusing combination if the analyst only reads one log. The correct resolution is either (a) extend the profile in `/etc/apparmor.d/local/` and reload with `apparmor_parser -r`, or (b) document a deliberate move to complain mode for that profile with the reason. Both are acceptable; silently disabling AppArmor is not, and this failure mode is listed in §8.12.

### 8.9 Backup and Recovery on the Linux Estate

#### 8.9.1 What the standard requires, and what this design therefore does

The WSOS names this requirement directly: `Install and manage backup systems` with nested examples `Windows Server Backup`, `rsync`, `Script based backup, e.g. Bash, Batch or PowerShell` (Domain 4, line 14). The Linux estate implements **two of the three named mechanisms**: **`rsync`** as the transport, and a **Bash script** as the orchestration. The restic tool that the baseline names (`04-automation/bash/04-backup-restic.sh`, repository under `/srv/backup/` on `vpnz-dmzjump01`) provides snapshot semantics on top of that; if restic is unavailable or cannot be built in the time available, the documented fallback is a plain `rsync --link-dest` snapshot rotation, which is entirely Bash and `rsync` and therefore still satisfies the named requirement.

**The scope boundary must be stated plainly, exactly as the baseline requires.** This is a **configuration and evidence backup**, not a full VM or hypervisor-level backup. There is no hypervisor backup licence in this project, no image-level capture, and no bare-metal restore. What is backed up is the material that would otherwise take weeks to recreate: configuration files, PKI material, certificates, rulesets, playbook and script sources, and the evidence tree. Rebuilding a guest is done by re-cloning `UBU2404-TEMPLATE-01` and re-running the Ansible playbooks — which is why the *configuration* backup is the thing that actually matters.

#### 8.9.2 What is backed up, from where, and where it goes

| Backup job | Target host | Source paths | Destination | Frequency | Retention |
|---|---|---|---|---|---|
| `BKP-LINUX-ETC-DAILY` | all ten Ubuntu guests | `/etc/nginx/`, `/etc/keepalived/`, `/etc/nftables.conf`, `/etc/nftables.d/`, `/etc/wireguard/`, `/etc/openvpn/`, `/etc/ssh/sshd_config.d/`, `/etc/sysctl.d/`, `/etc/netplan/`, `/etc/rsyslog.d/`, `/etc/apt/apt.conf.d/`, `/etc/chrony/`, `/etc/sudoers.d/`, `/etc/audit/rules.d/` | `vpnz-dmzjump01:/srv/backup/linux/<host>/` | Daily, 02:15 | 14 daily, 8 weekly, 6 monthly |
| `BKP-LINUX-PKI-WEEKLY` | `vpnz-lnxra01` | `/etc/openvpn/easy-rsa/pki/` (**the whole PKI, including `ca.key`**) | `vpnz-dmzjump01:/srv/backup/pki/` with the repository encrypted | Weekly, Sunday 02:30, plus after **every** certificate issuance or revocation | 12 copies |
| `BKP-LINUX-DATA-DAILY` | `vpnz-dmzwp01/02` | MariaDB logical dump and the WordPress uploads directory, via `mysqldump --single-transaction` piped through compression | `vpnz-dmzjump01:/srv/backup/wordpress/` | Daily, 02:45 | 14 daily |
| `BKP-AUTOMATION-DAILY` | `vpnz-mon01` | the Git repositories, `04-automation/` sources, `06-verification/` records, `07-evidence/` screenshots, prometheus/grafana provisioning | `vpnz-dmzjump01:/srv/backup/repo/` **and** a second medium held by the group | Daily, 03:00 | 30 daily, 12 weekly |
| `BKP-LOGS-WEEKLY` | all guests | `/var/log/fyp/`, the nftables and OpenVPN logs, the audit trail extracts | `vpnz-dmzjump01:/srv/backup/logs/` | Weekly, Sunday 03:15 | 8 weekly |
| `BKP-RULESET-ON-CHANGE` | `vpnz-nft01/02`, `vpnz-dmzrev01/02` | the live rendered configuration captured with the tool's own export (`nft list ruleset`, `nginx -T`) | `vpnz-mon01:/srv/tftp/` config archive, pulled by the automation line | On every Ansible run, and on demand before a change | 30 versions |

The baseline names the job convention `BKP-{TARGET}-{FREQ}`, and the table above uses it. Two jobs deserve comment. `BKP-LINUX-PKI-WEEKLY` is the one backup whose **loss is unrecoverable**: if `ca.key` is lost, every client certificate becomes unrevocable and unusable, and the only remedy is to rebuild the entire PKI and reissue everything. That job therefore runs to two destinations. `BKP-LOGS-WEEKLY` exists because the log is the evidence: a denial screenshot without the log line behind it is an assertion, and the verification chapter will not accept it.

#### 8.9.3 How it runs

The transport is `rsync` over SSH using a dedicated key, invoked by a Bash script with `set -euo pipefail` and a log file. The restic layer adds deduplication and snapshots; the fallback is `rsync --link-dest`.

```bash
#!/usr/bin/env bash
# 04-automation/bash/04-backup-restic.sh
# Vertex Peak FYP — Linux configuration and evidence backup.
# Run as root from cron/timer. Idempotent. Logs to /var/log/fyp/backup-YYYY-MM-DD.log.
# Exit: 0 = all sources succeeded, 1 = at least one source failed (partial success is reported,
#       not hidden — a backup job that reports success on a partial copy is worse than no backup).
set -euo pipefail

HOST="$(hostname -s)"
DEST_HOST="10.10.90.27"                 # vpnz-dmzjump01 — the backup repository host
DEST_BASE="/srv/backup/linux"
KEY="/root/.ssh/id_ed25519_backup"
STAMP="$(date +%Y-%m-%d_%H%M)"
LOGDIR="/var/log/fyp"; LOG="${LOGDIR}/backup-$(date +%Y-%m-%d).log"
RSYNC_OPTS=(-aHAX --numeric-ids --delete-delay --partial --info=stats2
            --exclude='*.sock' --exclude='*/cache/*')

mkdir -p "${LOGDIR}"
exec > >(tee -a "${LOG}") 2>&1
echo "=== ${HOST} backup start ${STAMP} ==="

# Sources are declared as an array so that a missing path is an error, not a silent skip.
SOURCES=(
  /etc/nginx /etc/keepalived /etc/nftables.conf /etc/nftables.d
  /etc/wireguard /etc/openvpn /etc/ssh/sshd_config.d /etc/sysctl.d
  /etc/netplan /etc/rsyslog.d /etc/apt/apt.conf.d /etc/chrony
  /etc/sudoers.d /etc/audit/rules.d
)
fail=0
for src in "${SOURCES[@]}"; do
    if [[ ! -e "${src}" ]]; then
        echo "[!] SKIP (absent on this host, which may be correct): ${src}"
        continue
    fi
    echo "[i] rsync ${src} -> ${DEST_HOST}:${DEST_BASE}/${HOST}/"
    if ! rsync "${RSYNC_OPTS[@]}" -e "ssh -i ${KEY} -o BatchMode=yes -o StrictHostKeyChecking=accept-new" \
            "${src}" "root@${DEST_HOST}:${DEST_BASE}/${HOST}/"; then
        echo "[!] FAILED: ${src}"
        fail=1
    fi
done

# A restic snapshot on top, when restic is available. This gives point-in-time restore and a
# documented retention policy that Rsync alone cannot express.
if command -v restic >/dev/null 2>&1 && [[ -n "${RESTIC_PASSWORD_FILE:-}" ]]; then
    restic -r "sftp:root@${DEST_HOST}:/srv/backup/restic" \
        --password-file "${RESTIC_PASSWORD_FILE}" \
        backup "${SOURCES[@]}" --tag "host=${HOST}" --host "${HOST}" || fail=1
    restic -r "sftp:root@${DEST_HOST}:/srv/backup/restic" \
        --password-file "${RESTIC_PASSWORD_FILE}" \
        forget --keep-daily 14 --keep-weekly 8 --keep-monthly 6 --prune || fail=1
else
    echo "[i] restic unavailable or unconfigured; rsync copy above is the backup of record"
fi

echo "=== ${HOST} backup finished $(date +%Y-%m-%d_%H%M) fail=${fail} ==="
exit "${fail}"
```

The **MariaDB** job on the WordPress nodes is the only one that needs application awareness, because copying a live InnoDB data directory produces a corrupt backup:

```bash
# /usr/local/bin/backup-wordpress.sh  (excerpt — the database steps)
# A consistent logical dump. --single-transaction gives a consistent snapshot without locking
# the tables, which is the correct method for InnoDB and the wrong method for MyISAM.
mysqldump --defaults-extra-file=/root/.my.cnf --single-transaction --quick --routines --triggers \
    --databases wordpress | gzip -9 > "/var/backups/wordpress-$(date +%F).sql.gz"

# Uploads are files, so rsync is correct. They are NOT in the dump.
rsync -aHAX /var/www/html/wp-content/uploads/ "root@10.10.90.27:/srv/backup/wordpress/uploads/"

# Integrity check: a gzip stream that fails -t is a corrupt backup and must fail the job.
gzip -t "/var/backups/wordpress-$(date +%F).sql.gz" || { echo "[!] dump is corrupt"; exit 1; }
```

Scheduling uses `systemd` timers rather than `cron`, because timers give a status, a journal entry and `Persistent=true` (which catches up a missed run after the VM was off):

```ini
# /etc/systemd/system/fyp-backup.service
[Unit]
Description=Vertex Peak FYP Linux configuration backup
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/fyp-backup.sh
User=root
Nice=10
IOSchedulingClass=idle

# /etc/systemd/system/fyp-backup.timer
[Unit]
Description=Daily FYP configuration backup

[Timer]
OnCalendar=*-*-* 02:15:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now fyp-backup.timer
systemctl list-timers fyp-backup.timer --no-pager
sudo systemctl start fyp-backup.service         # a manual run to prove it works end to end
journalctl -u fyp-backup.service -n 40 --no-pager
sudo systemctl status fyp-backup.service --no-pager | grep -E 'Active|Main PID|status='
```

#### 8.9.4 The restore test, which is the only evidence that matters

**A backup that has never been restored is not a backup.** The restore test is a mandatory recorded exercise with a timed result, and it is where the honest findings appear. The procedure below is performed once in full, and its transcript is committed to `06-verification/`.

```bash
# ---------- RESTORE TEST RT-01 : a single configuration file ----------
# 1. Confirm the file exists in the backup:  ssh root@10.10.90.27 'ls -l /srv/backup/linux/vpnz-nft01/etc/nftables.conf'
# 2. Simulate the loss on a host that is NOT the current master. vpnz-nft02 (BACKUP of vrid 51)
#    is chosen so the test cannot affect service:   sudo mv /etc/nftables.conf /etc/nftables.conf.lost
# 3. Restore:  sudo /usr/local/bin/fyp-restore.sh --host vpnz-nft02 --path /etc/nftables.conf
#    (which is: rsync -aHAX --numeric-ids root@10.10.90.27:/srv/backup/linux/vpnz-nft02/etc/nftables.conf /etc/)
sudo nft -c -f /etc/nftables.conf && echo "syntax OK"    # verify it is CORRECT, not merely present
sudo chmod 0644 /etc/nftables.conf && sudo chown root:root /etc/nftables.conf
rm -f /etc/nftables.conf.lost

# ---------- RESTORE TEST RT-02 : the whole NGINX tree on a proxy node ----------
# Safety net first: take a hypervisor snapshot of vpnz-dmzrev01 BEFORE the test.
sudo mv /etc/nginx /etc/nginx.broken && sudo systemctl restart nginx   # expected: fails to start
sudo rsync -aHAX root@10.10.90.27:/srv/backup/linux/vpnz-dmzrev01/etc/nginx/ /etc/nginx/
sudo nginx -t && sudo systemctl restart nginx
curl -skI --cacert /etc/nginx/ssl/vp-root-ca.crt https://127.0.0.1/healthz | head -1   # HTTP/2 200

# ---------- RESTORE TEST RT-03 : a single file from the restic snapshot ----------
restic -r sftp:root@10.10.90.27:/srv/backup/restic --password-file /root/.restic-pass snapshots
restic -r sftp:root@10.10.90.27:/srv/backup/restic --password-file /root/.restic-pass \
    restore latest --target /tmp/restore-test --include /etc/keepalived/keepalived.conf
diff /tmp/restore-test/etc/keepalived/keepalived.conf /etc/keepalived/keepalived.conf && echo "identical"
```

The record that must be produced for each restore test:

| Field | RT-01 | RT-02 | RT-03 |
|---|---|---|---|
| Backup job used | `BKP-LINUX-ETC-DAILY` | `BKP-LINUX-ETC-DAILY` | `BKP-LINUX-ETC-DAILY` (restic layer) |
| Source host | `vpnz-nft02` | `vpnz-dmzrev01` | `vpnz-nft01` |
| What was destroyed | `/etc/nftables.conf` | the whole `/etc/nginx` tree | `/etc/keepalived/keepalived.conf` |
| Time to restore | *measured* | *measured* | *measured* |
| Verification performed | `nft -c -f` plus a live ruleset comparison | `nginx -t` plus a served `200` | `diff` identical |
| Outcome | *pass or fail, with the log* | *pass or fail, with the log* | *pass or fail, with the log* |
| What was learned | *free text — this is the finding* | | |

The expected **finding** from this exercise, and the reason it is worth doing: the restore is fast (a configuration file is small) but the **verification** is the slow part, and every restore needs a service-specific validation step that `rsync` cannot know about — `nft -c -f` for a ruleset, `nginx -t` for a web server, `keepalived --config-test` for a VRRP configuration, `openvpn --config ... --test-crypto` for a tunnel. A generic "we restored the files" claim is not sufficient. That observation belongs in the report as a genuine result of the exercise.

### 8.10 Time, DNS and NTP Consistency

Time and name resolution are the two silent dependencies that break everything else, and the design fixes both explicitly.

**DNS.** Every Linux host resolves through `10.10.30.11` and then `10.10.30.12`, in that order, and **through no other resolver**. No public resolver is configured on any Linux guest — not as a tertiary, not as a fallback. The reason is that a public resolver would let a lab host resolve a `.example` name that the internal split-horizon zone is supposed to answer, producing a silent inconsistency that is very hard to diagnose. Conditional forwarders on the DCs (the forwarder for `vertexpeak.example` pointing at `192.0.2.53`) are the only path to the simulated public namespace, and that path exists only on the DCs.

```bash
# Verify: exactly two resolvers, in the right order, on every guest.
resolvectl status | grep -A3 'DNS Servers'
cat /etc/resolv.conf
```

Expected:

```text
Global
         Protocols: -LLMNR -mDNS -DNSOverTLS DNSSEC=no/unsupported
  resolv.conf mode: stub
Current DNS Server: 10.10.30.11
       DNS Servers: 10.10.30.11 10.10.30.12
        DNS Domain: vertexpeak.fyp.lab
```

```text
# /etc/resolv.conf — expected content (managed by systemd-resolved or netplan, never hand-edited)
nameserver 10.10.30.11
nameserver 10.10.30.12
search vertexpeak.fyp.lab fyp.lab
options timeout:2 attempts:2
```

Name resolution proof, on the same host, for both the internal and the split-horizon public name:

```bash
dig +short vpnz-dc01.vertexpeak.fyp.lab     # expected: 10.10.30.11
dig +short portal.vertexpeak.fyp.lab        # expected: 10.10.90.10
dig +short portal.vertexpeak.example        # expected: 192.0.2.x via the conditional forwarder,
                                            # or NXDOMAIN inside the lab — record which
resolvectl query vpnz-mon01.vertexpeak.fyp.lab
```

Two configuration facts that cause real incidents and must therefore be checked rather than assumed. **`systemd-resolved` and a hand-edited `/etc/resolv.conf` fight**, and the file can be a symlink into `/run/systemd/resolve/stub-resolv.conf`; a manual edit is silently reverted at the next network event, so the netplan `nameservers` block in §8.2.4 is the only correct place to set resolvers. **`/etc/nsswitch.conf` order matters**: with `hosts: files dns`, the static `/etc/hosts` entries of §8.2.5 win over DNS, which is exactly what makes `keepalived-hq` and `portal.vertexpeak.fyp.lab` resolvable before DNS is up — but it also means a stale `/etc/hosts` entry will override a correct DNS record and produce a confusing failure. Both files are in the backup set and both are in the auditd watch list for that reason.

**Time.** The chain is unambiguous and must be reproduced exactly, because a skew of more than five minutes breaks Kerberos and produces symptoms (authentication failures, DFS replication errors, log correlation that does not line up) that look like something else entirely.

| Layer | Host | Source | Mechanism |
|---|---|---|---|
| Simulated provider | `192.0.2.53` / `192.0.2.54` | the simulated Internet | In Packet Tracer only |
| Forest authority | `vpnz-dc01` (then `vpnz-dc02`) | `192.0.2.53` | Windows Time service, authoritative for the domain |
| Windows members | all Windows guests | `vertexpeak.fyp.lab` (i.e. the DCs) | Domain hierarchy |
| **Linux guests** | all ten Ubuntu hosts | **`10.10.30.11`, then `10.10.30.12`** | `chrony`, configuration in §8.2.9 |
| Linux as a *server* | `vpnz-mon01` may serve the isolated lab segment | — | Documented but **not enabled** by default |

```bash
# Cross-platform consistency check: compare the Linux view with the Windows authority.
# On any Linux host:
chronyc tracking | grep -E 'Reference ID|System time|Leap status'
timedatectl | grep -E 'Time zone|System clock synchronized|NTP service'
date -u +%Y-%m-%dT%H:%M:%SZ

# On vpnz-dc01 (Windows):
#   w32tm /query /status
#   w32tm /stripchart /computer:vpnz-dc01 /samples:3 /dataonly
```

Expected Linux output form:

```text
Reference ID    : 0A0A1E0B (10.10.30.11)
System time     : 0.0000314 seconds fast of NTP time
Leap status     : Normal
               Time zone: Asia/Hong_Kong (HKT, +0800)
System clock synchronized: yes
              NTP service: active
```

The consistency requirement is that **the Linux offset from the DC is well under one second**, and that the reported UTC time on a Linux host and a Windows host agree to within a second when read side by side in the same screenshot. That paired screenshot is one of the required evidence items in §8.11, because it is the artefact that proves the two platforms' clocks are aligned — which is what makes cross-platform log correlation in the troubleshooting chapter legitimate rather than wishful.

```bash
# A skew test that deliberately stresses the requirement, on a spare guest only.
# Windows hosts must never be manually skewed in this project; a Linux guest in an isolated
# namespace is the safe place to demonstrate it.
sudo date -s "$(date -d '+6 minutes' '+%Y-%m-%d %H:%M:%S')"
sudo systemctl restart chrony
sleep 30
chronyc tracking | grep -E 'System time|Leap'
# Expected: chrony slews or steps the clock back toward the reference and reports "Normal" again.
# A forced 'makestep 1.0 3' means the correction happens on the first three updates.
```

### 8.11 Evidence and Screenshot Checklist

**The HDTN topic sheet requires the documentation to include "screen captures"** — that requirement comes from the brief, and the WSOS 2026 does not contain it (`screen`, `capture`, `screenshot` and `evidence` are 0 occurrences in the standard). Every item below is therefore a brief requirement, and none of them may be presented as a WorldSkills requirement. Screenshots are stored under `C:\FYP\07-evidence\` using the naming convention `{date}_{host}_{what}.png` (for example `2026-10-06_vpnz-dmzrev01_keepalived-failover.png`), and each caption follows the template `Figure {n}: {what} — {host} — {command or action} — {date}`.

**8.2 — Base build and standardisation**
- `netplan try` / `netplan generate` accepted, with the resulting `ip -br a` output.
- `ip route show` on `vpnz-nft01` showing the default via `10.10.50.2` and the internal routes via `10.10.50.1`.
- `hostnamectl status` showing the canonical hostname.
- The exact `netplan` YAML on screen (`/etc/netplan/50-cloud-init.yaml`), with the `0600` mode visible in `ls -l`.
- `sudo sshd -T` output proving `permitrootlogin no`, `passwordauthentication no`, `allowgroups gg-infra-admins`.
- A **failed** password login attempt showing `Permission denied (publickey).`
- `getent group gg-infra-admins` showing exactly the four administrators.
- `sudo visudo -c` returning `parsed OK`.
- `systemctl status unattended-upgrades` and an `unattended-upgrade --dry-run` excerpt.
- `chronyc tracking` and `timedatectl` showing synchronisation.
- `dpkg -l` output for the pinned packages, i.e. the version evidence.
- `sudo aa-status` showing AppArmor enabled with the profile counts.
- `sudo auditctl -l` showing the loaded rule count.
- The completed B-01…B-20 baseline checklist, signed and dated per host.

**8.3 — Nginx web tier**
- `nginx -v` and `dpkg -s nginx` version output.
- `sudo nginx -t` returning `syntax is ok` / `test is successful`.
- `curl -sI http://portal.vertexpeak.fyp.lab/` showing the `301` and the `Location:` header.
- `curl -sI --cacert ... https://portal.vertexpeak.fyp.lab/` showing `HTTP/2 200` and the full security-header set.
- `Server:` header showing **no version string** (the `server_tokens off` evidence), captured as a close-up.
- `openssl s_client` output showing the subject, the issuer, `Protocol: TLSv1.2`/`TLSv1.3`, the cipher and `Verify return code: 0 (ok)`.
- The TLS 1.1 attempt failing (the protocol-floor negative test).
- The **name-mismatch warning** in a browser, with the explanation written in the caption.
- Rate limiting producing `503`s, with the matching `limiting requests` lines in `portal.error.log`.
- A `405` from the method restriction (`curl -X TRACE`).
- `curl -sk https://127.0.0.1/stub_status` showing the counters.
- A proxy decision attributed to a backend node, visible as `upstream=10.10.90.2x:443 ustatus=200` in `portal.access.log`.
- `sudo ss -tlnp` showing the listeners.
- The `/etc/nginx/conf.d/` directory listing with `sites-enabled/` empty.

**8.4 — Keepalived**
- `ip -br a show ens192` on **both** nginx-pair nodes before the test (the pre-state).
- `keepalived --config-test -f /etc/keepalived/keepalived.conf` (or `keepalived -t`) returning clean.
- `systemctl stop nginx` on the master plus the failing `vrrp-check-nginx.sh` run.
- `journalctl -u keepalived` on the master showing `Track script chk_nginx is FAULT state, priority 90` and `Entering BACKUP STATE`.
- `journalctl -u keepalived` on the backup showing `Receive advertisement timeout` and `Entering MASTER STATE`.
- `ip -br a show ens192` on the new master showing the VIP present, and on the old master showing it gone.
- The continuous `curl` log with the interruption window highlighted (start and end times).
- `ip neigh show 10.10.90.10` proving the ARP cache followed the move.
- The fail-back sequence: track script returns to `OK, priority 150`, then `Entering MASTER STATE` after the 30-second `preempt_delay`.
- The same sequence for the **nftables pair** (`vrid 51`): `sudo nft flush ruleset`, the failing `vrrp-check-nftables.sh`, the `FAULT state, priority 120` line, and the deliberate `systemctl stop keepalived` handover with the `Sent 0 priority advert` line.
- Both `keepalived.conf` files side by side, showing the identical VRID and the differing `router_id`, `state` and `priority`.
- `/var/log/fyp/keepalived-transitions.log` from `vrrp-notify.sh`.

**8.5 — nftables**
- `sudo nft -c -f /etc/nftables.conf` producing **no output** (a successful syntax check), with the exit status visible.
- `sudo nft list tables` showing `table inet fyp_filter`.
- `sudo nft list ruleset` — the full ruleset, in sections if necessary, legibly.
- `sudo nft list chain inet fyp_filter input` and `... forward` showing `policy drop`.
- `sudo nft list sets` showing the sets and their elements.
- Rule counters with non-zero packet counts (proof the rules are matched, not dead).
- `sudo conntrack -L` showing a masqueraded flow with the rewritten source.
- The **namespace DNAT test**: `curl -skI https://198.51.100.2/healthz` returning `200` from the simulated external client.
- The matching `conntrack` entry showing the DNAT to `10.10.90.10`.
- An unpublished port from outside timing out, plus the `NFT-DROP: FORWARD` / `TB-05` log line.
- **TB-04** denial: the DMZ host failing to reach `10.10.30.11:445`, with the `NFT-DROP: TB-04 ` log line shown beside it.
- **TB-06** denial: the external namespace failing to reach `10.10.30.11`, with `NFT-DROP: TB-06 `.
- **TB-12** denial: the VPN client failing to reach `10.20.20.10`, with `NFT-DROP: TB-12 `.
- The permitted/denied pair from the same source in one screenshot (the "policy, not routing" proof).
- `grep -c` counts per prefix from a deliberate flood.
- `sysctl` output for `ip_forward`, `rp_filter`, `syncookies`, `nf_conntrack_max`.
- The rollback demonstration: injected bad rule, console recovery, rule gone.
- `systemctl status nftables` and the result of a **reboot** proving persistence.

**8.6 — OpenVPN**
- `openvpn --version` and `dpkg -s openvpn` version output.
- `ls -l /etc/openvpn/easy-rsa/` showing `0700`, with the `pki/` subtree visible.
- `init-pki`, `build-ca`, `build-server-full`, `build-client-full` and `gen-crl` success messages.
- `cat /etc/openvpn/easy-rsa/vars` showing the algorithm, key size, digest and lifetimes.
- The CA certificate as shown by `openssl x509 -in pki/ca.crt -noout -subject -issuer -dates`.
- `systemctl status openvpn-server@server` showing `Status: "Initialization Sequence Completed"`.
- The server-start log at `verb 3` showing `Initialization Sequence Completed`.
- A successful client connect log showing `VERIFY OK: depth=0, CN=server-vpnz-lnxra01` and the `PUSH_REPLY`.
- The client's `ip route show | grep tun0` proving the three pushed prefixes and **no default route**.
- A successful `ping` to `10.10.30.11` across the tunnel.
- The negative tests: `10.20.20.10`, `10.70.0.50` and `10.10.80.21` all failing, with the `TB-12`/`TB-09` log lines.
- `/var/log/openvpn/status.log` showing the connected-client table.
- The **revocation test**: the revoked client's `VERIFY ERROR: ... certificate revoked` client-side line **and** the server-side `CRL CHECK FAILED` line, **and** a non-revoked client still connecting at the same moment.

**8.7 — WireGuard**
- `wg --version` and `modinfo wireguard`.
- `stat -c '%a %U:%G %n' /etc/wireguard/*` showing `600` on the private key and PSK.
- `sudo wg show` on the HQ side showing both peers with `latest handshake` and `transfer` values.
- `sudo wg show all dump` in raw tab-separated form.
- `ip -br a show wg0` and `ip -4 rule show` and `ip route show table 51820`.
- A successful `ping` from the branch peer to `10.10.30.11` and to `10.10.90.10`.
- The negative tests from the branch peer: `10.20.20.10` (TB-14) and `10.70.0.50` failing, with the `NFT-DROP: TB-14 ` log line.
- The management escape hatch shown **absent** (`ip -br a | grep -c wg1` returning 0).
- The `iperf3` result, with the caption stating that this is a host-only emulated link and not real-world WAN throughput.
- The decision-log entry recording Option A or Option B for the Wan Chai WireGuard peer, with the honest statement about Cisco interworking.

**8.8 — Baseline hardening**
- The `find` sweep for world-writable files returning **nothing**.
- The `find` sweep for secret files with the wrong mode returning **nothing**.
- `sudo ss -tulpn` compared against the per-host role allow-list.
- `sudo ausearch -k fyp_nftables -ts recent` showing an audit record.
- `sudo auditctl -s | grep enabled` showing `2` (immutable).
- `sudo aa-status` with the enforce/complain counts.

**8.9 — Backup and recovery**
- The systemd timer list showing `fyp-backup.timer` scheduled.
- A completed backup run log with the per-source `rsync` results.
- A listing of the destination tree on `vpnz-dmzjump01` with sizes and dates.
- `restic snapshots` output (if the restic layer is used).
- All three restore tests (RT-01, RT-02, RT-03) with the **before-destruction**, **restore command** and **post-restore validation** frames, plus the timed result table.

**8.10 — Time, DNS and NTP**
- `resolvectl status` showing exactly two DNS servers in the correct order.
- `dig +short` for an internal name and for a `.example` name.
- `chronyc tracking` and `chronyc sources -v` showing both DCs.
- The **paired clock screenshot**: `date -u` on a Linux host and `w32tm /query /status` (or `Get-Date -AsUTC`) on `vpnz-dc01` captured within the same minute, showing agreement to within a second.
- The deliberate skew test: the skew applied, then `chronyc tracking` after recovery.

**8.12 and 8.13 — Troubleshooting and findings**
- For **each** failure mode exercised, the symptom, the diagnostic command and the resolution, with the before/after evidence.
- The findings log entries (template in §8.13) for every observed-versus-expected deviation, including the ones that were never resolved.

### 8.12 Common Failure Modes and Troubleshooting

This sub-section serves the WSOS **Troubleshooting domain (25%)** directly, and it is written so that each entry is actionable without further research. The diagnostic column names the command that *distinguishes* the cause from the alternatives, which is the skill the domain is actually assessing.

| # | Symptom | Likely cause | Diagnostic command | Resolution |
|---|---|---|---|---|
| T-01 | `ssh` to a Linux guest times out; `ping` also fails | A wrong `netplan` address, a wrong interface name in the YAML, or a missing route back. A silent `netplan` failure is the most common | On the host, via the **hypervisor console**: `ip -br a`, `ip route`, `networkctl status ens192`, `journalctl -u systemd-networkd -n 50` | Correct the YAML with the real interface name from `ip -br link`, then `sudo netplan try`. If the guest is unreachable and the console is the only path, that is itself the argument for the `netplan try` discipline |
| T-02 | `ssh` answers but every login is refused with `Permission denied (publickey)` even though the key is correct | The user is not in `gg-infra-admins` and `AllowGroups` refuses them; or the key file has the wrong mode; or `~/.ssh` is `0777` | `journalctl -u ssh -n 40`, `sudo sshd -T \| grep allowgroups`, `getent group gg-infra-admins`, `ls -ld ~/.ssh ~/.ssh/authorized_keys`, then `ssh -vvv` from the client | Add the user to the group, `chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`, and check that `PubkeyAuthentication yes` is actually in force |
| T-03 | The web VIP is up, `curl` returns `502 Bad Gateway` | The proxy's Nginx is running but the upstream pool is unreachable, or `proxy_ssl_verify` is rejecting the origin certificate | `curl -skI https://10.10.90.2x/` from the proxy host itself; `tail -50 /var/log/nginx/portal.error.log \| grep -i 'upstream\|ssl'`; `openssl s_client -connect 10.10.90.21:443 -servername www.vertexpeak.example -CAfile /etc/nginx/ssl/vp-root-ca.crt` | If the TLS check fails, install the internal root with `update-ca-certificates` on the proxy; if the origin is genuinely down, `vrrp-check-pool.sh` should already have lowered the priority — verify that it did, because if it did not, the track script is not working and that is the real defect |
| T-04 | `curl https://portal...` returns a **name-mismatch** or **untrusted issuer** error in a browser but works with `--cacert` | The browser does not trust the internal CA, and the `.example` name does not match a real public certificate | `openssl s_client -connect ... -servername portal.vertexpeak.example \| openssl x509 -noout -subject -ext subjectAltName` | Install `vp-root-ca.crt` in the browser's trust store, or use the `.fyp.lab` SAN that the same certificate carries. **This is an expected lab condition, not a defect** — screenshot it and explain it |
| T-05 | Nginx fails to start after adding the HTTP/2 directive | The `http2 on;` standalone form is not accepted by the installed build, or the same `listen` line uses the legacy `http2` parameter as well | `sudo nginx -t` (the error names the file and line) | Use one form or the other, never both: either `listen 443 ssl;` plus `http2 on;`, or `listen 443 ssl http2;` alone. Record which form the built version accepts |
| T-06 | `nginx -t` passes but a site returns the **default** page or the wrong vhost | `/etc/nginx/sites-enabled/default` still exists, or two server blocks both claim `default_server`, or SNI is not being sent | `sudo nginx -T \| grep -n 'server_name\|default_server\|root '` (the `-T` flag dumps the *effective* configuration) | Remove the packaged default site; keep exactly one `default_server`; test with `curl --resolve` so the Host header and SNI are explicit |
| T-07 | The VIP is present on a node but clients still reach the old node, or traffic black-holes | The gratuitous ARP was not absorbed, so the client's ARP/neighbour cache still holds the old MAC | `ip neigh show 10.10.90.10` on the client, `arping -c 3 10.10.90.10`; on the node, `ip -br a` and `journalctl -u keepalived` for the `Sending gratuitous ARP` line | Wait for the cache to expire, or force a refresh (`ip neigh flush to 10.10.90.10`). If it happens on every failover, check that `vrrp_garp_interval` is set and that the hypervisor's virtual network is not filtering ARP |
| T-08 | Both nodes of a VRRP pair claim the VIP, or neither does | Different `auth_pass` values, a duplicated `router_id`, or an equal priority on both nodes | `journalctl -u keepalived -n 60` on both nodes; `sudo tcpdump -ni ens192 -c 20 vrrp` (VRRP is IP protocol 112) | Make the `router_id` unique, the `auth_pass` byte-identical, and the priorities 150/100. `tcpdump` showing advertisements from only one node is the definitive test that the peer is not sending |
| T-09 | A `vrrp_script` never causes a failover | The `weight` arithmetic does not cross the peer's priority, or `enable_script_security` is silently refusing to run the script | `journalctl -u keepalived \| grep -i 'script\|Track script'`, `ls -l /usr/local/bin/vrrp-check-*.sh`, and run the script by hand to confirm its exit code | Fix the weight arithmetic so that `priority + weight < peer priority` for the check that must trigger a handover; make the script `0755` and `root:root`; note that the nftables check uses `weight -30` **on purpose** and does not trigger a failover |
| T-10 | nftables drops traffic that should be permitted, and the log prefix is `NFT-DROP: FORWARD` | A missing permit for that exact source/destination pair, or the permit is placed **after** a deny that already matched, or `iifname` names the wrong interface | `sudo nft -a list chain inet fyp_filter forward`, `sudo conntrack -L \| grep <addr>`, `sudo journalctl -k \| grep 'NFT-DROP: FORWARD' \| tail -20` | Add the specific permit, place it before the catch-all, and confirm the interface name with `ip -br link`. Use `nft -a` to get the rule handle so the exact matching rule can be quoted in the report |
| T-11 | A forwarded flow works in one direction only | The `ct state established,related accept` rule is missing or is placed after a deny; or the return path's route is missing (`rp_filter` silently dropping) | `sudo conntrack -L \| grep <flow>`, `sysctl net.ipv4.conf.all.rp_filter`, `sudo journalctl -k \| grep -i martian`, `ip route get <client-ip> from <server-ip>` | Restore the stateful shortcut as the first rule; check `log_martians` output, because an `rp_filter` drop is logged as a martian and is otherwise invisible |
| T-12 | A WireGuard peer shows no handshake at all | A key or `PresharedKey` mismatch, a wrong `Endpoint`, the opposite side not listening, or a firewall dropping UDP 443 | `sudo wg show`, `sudo tcpdump -ni ens224 udp port 443`, `sudo ss -lunp \| grep 443`, and compare `wg pubkey < privatekey` against the peer's configured public key | Verify the public key by deriving it from the private key rather than by eye; confirm both `PresharedKey` values match; confirm `udp dport 443` is permitted in the nftables input chain on both ends |
| T-13 | A WireGuard handshake succeeds, the peer appears in `wg show`, but **no traffic flows** | The return route for the peer's tunnel address is missing, or `AllowedIPs` does not cover the prefix being tested, or the MTU is too high and only large packets are lost | `ip route get 10.10.200.65`, `ip route show table 51820`, `sudo wg show`, and `ping -M do -s 1372 10.10.200.1` to test the MTU | Add the route back into the tunnel (`ip route add 10.10.200.64/26 dev wg0 table 51820`); verify `AllowedIPs` covers the tested prefix exactly; set `MTU = 1420` and retest. The "ping works, `scp` stalls" variant is the classic MTU symptom |
| T-14 | The WireGuard tunnel survives a reboot but dies on every keepalived failover | The peer's `Endpoint` points at the **node** address (`10.10.50.11`) rather than the **VIP** (`10.10.50.10` / `203.0.113.2`); or `wg0` is not enabled on the second node | On the branch peer: `sudo wg show` (the endpoint address shown is the one in use); on the HQ node: `ip -br a show wg0` after a handover | Change the peer's `Endpoint` to the VIP, enable `wg-quick@wg0` on **both** nodes, and declare the tunnel address in keepalived's `virtual_ipaddress_excluded` so it floats with the VIP |
| T-15 | An OpenVPN client connects and gets an address, but cannot reach anything | The pushed routes were not applied (the client ignores pushes), or the server's `ip_forward` is off, or the return route to `10.10.202.0/24` is missing on the internal network | On the client: `ip route show \| grep tun0`. On the server: `sysctl net.ipv4.ip_forward`, `ip route show \| grep 10.10.202`, and `sudo journalctl -k \| grep 'NFT-DROP'` | Enable `ip_forward` on `vpnz-lnxra01`, ensure the internal routes for `10.10.202.0/24` point at `10.10.30.42`, and confirm the client did not filter the `PUSH_REPLY` with a `pull-filter` |
| T-16 | OpenVPN clients are all refused at once, after working earlier | The CRL has **expired** (`EASYRSA_CRL_DAYS` elapsed), or the CRL file is unreadable by the dropped-privilege user | `openssl crl -in /etc/openvpn/server/crl.pem -noout -nextupdate -lastupdate`, `ls -l /etc/openvpn/server/crl.pem`, `journalctl -u openvpn-server@server \| grep -i crl` | Regenerate and republish: `./easyrsa gen-crl`, copy to `/etc/openvpn/server/crl.pem`, set mode `0644`, restart the service. Then add a calendar reminder — an expiring CRL is a scheduled outage |
| T-17 | One specific client can no longer connect although others can | That client's certificate was revoked and the CRL is being enforced, or its certificate expired | Server: `openssl crl -in /etc/openvpn/server/crl.pem -noout -text \| grep -A2 'Serial Number'`; `grep <CN> /etc/openvpn/easy-rsa/pki/index.txt`; client: `openssl x509 -in <cert> -noout -dates` | If revocation was intended, no action is needed — the control worked, and the log line is the evidence. If it was not, issue a new certificate. **Never** disable `crl-verify` to "fix" this |
| T-18 | `nft -f` succeeds but the rules are gone after a reboot | `nftables.service` is not enabled, or something else flushes the ruleset at boot (a container runtime, a DHCP client hook, or another unit) | `systemctl is-enabled nftables`, `systemctl status nftables` after a reboot, `journalctl -b \| grep -i nft` | `sudo systemctl enable --now nftables`, then reboot and re-verify. If another unit is flushing, find it with `journalctl -b \| grep -i 'flush\|nftables'` and order `nftables.service` after it |
| T-19 | The firewall host is unreachable after a ruleset change and SSH cannot be re-established | An `input`-chain mistake, applied to the boot ruleset so it survives the reboot | The only reliable diagnostic is the hypervisor console | Recover from the console: `sudo nft -f /etc/nftables.d/rollback-<stamp>.nft`, or `sudo systemctl stop nftables && sudo nft flush ruleset`. Then re-apply a corrected file with `02-nftables-apply.sh` and its revert timer. **This is why the rollback artefact is created before every apply** |
| T-20 | Kerberos authentication fails across platforms and log timestamps do not line up | Clock skew greater than five minutes, or a Linux host resolving through a different DNS server than the DCs publish | `chronyc tracking`, `timedatectl`, `date -u` compared with `w32tm /query /status` on `vpnz-dc01`; `resolvectl status`; `dig +short vpnz-dc01.vertexpeak.fyp.lab` | Point `chrony` at `10.10.30.11`/`10.10.30.12`, apply the correction, and re-test. Skew is the cause far more often than the symptom suggests |
| T-21 | `nginx` returns `403 Forbidden` for a static path that exists | Filesystem permissions, an AppArmor denial, or an SELinux-style context problem (not applicable on Ubuntu) | `ls -l` on the file and every parent directory, `namei -l /path/to/file`, `sudo journalctl -k \| grep -i 'apparmor.*DENIED'` | Fix ownership/permissions so that `www-data` can read the path, or extend the AppArmor local profile and reload it. The journal is the deciding evidence, and it is why both logs must be read |
| T-22 | Intermittent one-way packet loss on a multi-homed firewall host, with "martian" log lines | Strict `rp_filter` dropping asymmetric return traffic, or an address on the wrong interface | `sudo journalctl -k \| grep -i martian`, `sysctl net.ipv4.conf.all.rp_filter`, `ip route get <dst>` from the opposing direction | Keep strict `rp_filter` where the topology is symmetric (as here). If asymmetry is introduced deliberately, use `rp_filter = 2` (loose) and document the change as a design decision, never silently as a `0` |

Two meta-rules for using this table, which are worth stating because they are what distinguishes a competent troubleshooter from a fast one. **Read the log before changing the configuration** — in this estate, every symptom above has a matching log line, and a change made without reading the log destroys the evidence that would have proved the cause. And **change one thing at a time**: a failover test that alters the ruleset, the priority and the track script simultaneously produces a result nobody can interpret, and the test must be re-run from a known state.

### 8.13 Findings

The topic sheet requires the documentation to include "all findings", and the WSOS makes documentation an explicit obligation in its own right (`Prepare a technical document reflecting the solution in detail for agreement and sign-off`, Domain 6, line 7; `The purpose of documenting the completion of the installation or up-grade`, Domain 6, line 6). A findings log is therefore a first-class deliverable of this line, not a by-product. It is maintained as `06-verification/findings-linux.md`, one entry per observation, appended during the build rather than reconstructed afterwards.

Each finding is recorded in this template:

```text
FIND-L2-NN — <one-line title>

- Date and host:           2026-10-06, vpnz-dmzrev02
- Sub-section:             §8.4 Keepalived
- Test case ID:            TC-L2-02 (and the TB row, if a trust boundary is involved)
- EXPECTED (from the design baseline):
    A VRRP pair with a service track script moves the VIP within ~3 s of the lost
    service, and clients see a bounded interruption of about the detection interval.
- OBSERVED (what actually happened):
    The VIP moved 6.2 s after 'systemctl stop nginx'. The continuity probe failed for
    2 requests (~1.0 s at 0.5 s intervals) and recovered against vpnz-dmzrev02.
- EVIDENCE:
    Figure 12: keepalived transition on the master — vpnz-dmzrev01 — journalctl -u keepalived — 2026-10-06
    Figure 13: failover continuity log — client — curl loop — 2026-10-06
    Log: 07-evidence/2026-10-06_vpnz-dmzrev01_keepalived-transitions.log
- DIFFERENCE AND WHY IT MATTERS:
    Detection took about twice the theoretical minimum (interval 3 s x fall 2 = 6 s),
    which is exactly as designed, but 'high availability' did NOT mean zero downtime.
    Any claim of uninterrupted service would be false.
- CAUSE (if established) / UNKNOWN IF NOT:
    Cause established: chk_nginx has interval=3 and fall=2, so two consecutive failures
    are required before the weight is removed.
- RESOLUTION OR ACCEPTANCE:
    Accepted as a design property and documented as a measured figure. The alternative
    (interval 1, fall 1) was rejected because it would make the pair flap on a single
    slow HTTP response; the trade-off is recorded.
- FOLLOW-UP / OWNER:
    None. W2.
- STATUS:                  CLOSED (accepted) | OPEN | WONTFIX-with-reason
```

The discipline that makes the log credible, and that must be stated in the report:

1. **Every finding cites a test case ID and, where a trust boundary is involved, the trust-boundary row.** A collection of anecdotes is not a findings log; a collection of traceable observations is.
2. **Deviations are recorded, not smoothed over.** If the running `keepalived` version is not 2.2.8, or the Packet Tracer ASA image string differs from the baseline, or the HTTP/2 directive syntax needed the fallback form, that is written down with the version-deviation subsection the baseline's pinning discipline requires.
3. **A failed expectation is a stronger result than a hidden one.** Where Nginx OCSP stapling did not occur because the internal CA's responder was unreachable, the finding is that stapling was configured, verified as not happening, and why — not that the directive was quietly removed. The same applies to a false positive or a hallucination in the AI line: documenting the failure is the academic result.
4. **Findings feed the verification chapter and the risk register.** A finding that reveals a new failure mechanism is added to §8.12 and to the project risk register; an open finding with a follow-up owner is tracked to its close by the delivery schedule's week-11 verification gate.

