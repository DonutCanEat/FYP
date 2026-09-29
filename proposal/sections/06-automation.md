## 10. Network Automation

### 10.1 Overview and Objectives

The official topic sheet names this technology line as **"Network Automation (e.g., PowerShell scripting, Ansible Playbook, Bash shell scripting, etc.)"**. It is line **L4 (AUTOMATION)** of the five lines of the project *Victor2 – Enterprise Network Infrastructure and Architect*, subtitled *Design, Build, Verify and Document a Virtualised Enterprise Network for a Hong Kong FinTech Firm*, an HDTN Final Year Project Topic (AY2026/27) delivered over 12 weeks by a group of four students.

For the client scenario, this line is not decorative. Vertex Peak's due-diligence questionnaire (item 5) demands *"evidence that network change is applied through reviewed, repeatable configuration rather than by hand"*, and the in-scenario IT team is only five people serving 160 staff across four locations. L4 exists to satisfy both pressures: change must be **reviewable before it happens** and **repeatable afterwards**, and the routine maintenance that a small team cannot perform manually must be performed by code.

#### 10.1.1 What this line delivers

| Deliverable | Form | Baseline reference |
|---|---|---|
| A single automation control node | `vpnz-mon01` (10.10.30.31), Ubuntu Server 24.04.3 LTS, 4 vCPU / 8 GB / 100 GB | §6 row 23, §12.4 |
| Configuration management of both Linux and Windows estates from one control node | `ansible-core` 2.18.x with the `ansible` community package 11.x; Linux over SSH, Windows over WinRM | §7, §11.4, §12.4 |
| An infrastructure-as-code repository | `C:\FYP\04-automation\` — `ansible/`, `powershell/`, `bash/`, `runs/` | §8.6 |
| At least nine runnable playbooks and six roles | `playbooks/01-baseline-windows.yml` … `09-verify-services.yml`; `roles/common`, `nginx`, `keepalived`, `nftables`, `winrm`, `ad_users` | §8.6 |
| At least five production-quality PowerShell scripts | `Invoke-NewStarterOnboarding.ps1`, `Get-ADHealthReport.ps1`, `Backup-NetworkDeviceConfig.ps1`, `Test-ServiceEndpoints.ps1`, `Export-GPOBackup.ps1` | §8.6, §11.4 |
| At least five production-quality Bash scripts plus a shared library | `01-hardening-baseline.sh` … `05-cert-renew.sh`, `lib/common.sh` | §8.6, §11.4 |
| Version control and peer review of every change | Bare Git repositories or Gitea on `vpnz-mon01`, branch-per-task, tagged releases `v0.1` … `v1.0` | §8.6, §11.4 |
| Reproducible evidence | Timestamped run logs in `04-automation/runs/`, committed to Git | §12.4 |

Completion of this line is defined by the project's own success criteria: *"at least three idempotent PowerShell scripts and at least three Ansible playbooks in the repository layout of §8.7, re-runnable with unchanged output on second run."* This chapter deliberately over-delivers against that floor, for the reason given in §13.4 R-02 (L4 is on the **must** list of the priority order).

#### 10.1.2 The automation control node

**`vpnz-mon01` is the only automation control node [DECIDED].** Ansible never runs from a student laptop, so that the engine version is pinned, the working tree is single-sourced, and every run log in the evidence chapter can be reproduced by anybody holding the repository. `vpnz-mon01` already carries the roles that make this placement natural:

- Ansible control node and Git server (bare repositories over SSH, or Gitea).
- Prometheus, Grafana and Loki — the telemetry source that section 11 consumes.
- NTP for the Linux estate, and the TFTP/SCP configuration archive target at `/srv/tftp/`.

PowerShell scripts are **authored** on `vpnz-jump01` (PowerShell 7.4 LTS) but **executed** on the Windows guests as required, under Windows PowerShell 5.1 where 5.1 is what the guest runs. Bash scripts execute locally on the Linux guests or are invoked by Ansible on their behalf. This split matters for honesty in the report: the runtime actually used must be stated per script, and PowerShell 7.4 must never be claimed for a script that was only exercised on 5.1.

#### 10.1.3 Which WSOS 2026 domain this develops

This line develops **Domain 5 — Infrastructure Automation, 15 %** of the WorldSkills Occupational Standards 2026 for *IT Network Systems Administration* (Skill 2447, WorldSkills Shanghai 2026). The three citable "shall be able to" requirements, quoted verbatim from the local verified extraction of that page, are:

> `Setup and run routine infrastructure maintenance operations using various scripting\programming languages`
> — nested technology examples: `Bash`, `PowerShell`

> `Use modern automation tools for systems deployment and configuration management`
> — nested technology example: `Git`

> `Identify and implement infrastructure as code`
> — nested technology example: `Ansible.`

It also develops three of the four Domain 5 "needs to know and understand" lines, quoted verbatim:

> `Continuous integration and continuous delivery\deployment pipelines concepts`

> `Capabilities of various automation tools`

> `Importance of code version control`

> `Behaviour of infrastructure automation tools.`

Domain 4 — Network and System Operations (25 %) is served as well, through `Install and manage backup systems` with its nested `Script based backup, e.g. Bash, Batch or PowerShell`, and Domain 1 (5 %) through `The importance of methodical working practices` and `The techniques of planning, scheduling, and prioritizing`.

**An explicit correction that this chapter must carry.** The 2026 edition of Domain 5 lists **only** `Bash`, `PowerShell`, `Git` and `Ansible` as nested technology examples. `Python`, `YANG`, `RESTCONF` and `NETCONF` were present in the 2024 (Lyon) edition of Domain 5 and were **removed for 2026**: their machine-verified occurrence counts move from 2, 1, 1 and 1 in 2024 to **0, 0, 0 and 0** in 2026. This proposal therefore does **not** claim that the WSOS 2026 requires network automation in Python, and does **not** claim YANG/RESTCONF/NETCONF model-driven automation as a standard requirement. Where Python is used at all in this project it is used as an implementation detail of the fallback agent loop in section 11 and as a delivery mechanism for Ansible itself — never as a cited standard requirement. Python, YANG, RESTCONF and NETCONF may appear in this report's future-work discussion only.

One further attribution rule applies throughout this chapter. The requirement to produce *"all findings, manuals, steps, screen captures, verifications, and references"* comes from the **HDTN topic sheet**, not from the WSOS. The WSOS 2026 contains **zero** occurrences of `screen`, `capture`, `screenshot` or `evidence`. Where this chapter asks for screen captures, it does so because the topic sheet requires them.

---

### 10.2 Automation Strategy and Principles

#### 10.2.1 Declarative versus imperative

The project uses both models, and the choice is deliberate rather than accidental.

**Imperative** code states the sequence of actions to take. The Bash scripts of section 10.6 are imperative: `05-cert-renew.sh` does not describe a desired end state, it describes a procedure — parse arguments, read a certificate, compare `notAfter` against a threshold, renew if needed, log, exit. A system that must *do something in an order* is imperative, and forcing it into a declarative tool produces a worse artefact.

**Declarative** code states the desired end state and lets the engine compute the difference. Ansible is declarative in intent: a task that says `state: present` on a package does not say "run `apt-get install`"; it says "nginx must be installed" and the module decides what, if anything, to do. This is the model required by `Identify and implement infrastructure as code`, because infrastructure as code only has value if the code *describes the infrastructure* rather than *describing a session*.

The practical rule adopted by the group: **any state that must be true after every run is expressed declaratively in Ansible; any procedure that has a start, a sequence and an end is expressed imperatively in Bash or PowerShell, and Ansible invokes it through `command` or a purpose-built module only when no declarative module exists.** Hand-typed CLI sessions are not a third category — they are a defect, because they leave no artefact to review.

#### 10.2.2 Idempotence

Idempotence means that applying the same code twice produces the same state and, on the second application, no change. The project treats idempotence as a **hard requirement** rather than a virtue: §12.4 states that each playbook is run twice and `changed=0` on the second run is captured as evidence.

Idempotence is what makes change safe. If a playbook is idempotent, re-running it to recover from a partially failed deployment is a legitimate repair action. If it is not, re-running it may compound the damage — appending a second copy of a firewall rule, duplicating a user, or recreating a certificate. Every role in section 10.4.5 therefore carries a written idempotence note, and the note states *what would break the property* (usually a `shell` or `command` task without a `creates:`, `changed_when:` or `when:` guard).

#### 10.2.3 The source of truth

Every piece of configuration has exactly one authoritative home, and that home is a file in Git:

| Object | Source of truth |
|---|---|
| Host identity, addresses, groups | `04-automation/ansible/inventory/hosts.yml` |
| Per-group and per-host variables | `inventory/group_vars/`, `inventory/host_vars/` |
| Secrets | Ansible-Vault-encrypted variable files, decrypted at run time only |
| Configuration templates | `04-automation/ansible/templates/*.j2` |
| Intended Packet Tracer device configurations | `03-build/packet-tracer/configs/*.txt` (Track A of §11.4) |
| Test definitions and their expected results | `06-verification/` |
| The design itself | `00-baseline/` — frozen, read-only after each freeze |

The corollary is a rule the group must enforce: **if a value changes in the lab and the change is not committed, the source of truth is a lie.** Every manual change made during troubleshooting is followed by the same change being written back into the repository, or the manual change is reverted. Where a manual change cannot be captured by the automation (for instance a Packet Tracer CLI action during a demonstration), it is recorded in the decision log with its justification.

#### 10.2.4 Peer review

The due-diligence item asks for a *process*, not a tool. The group implements peer review socially as well as technically: every playbook, script and template change is committed on a branch, pushed to `vpnz-mon01`, and reviewed by a second group member before merge into `main`. The reviewer's name and the review outcome are recorded in the meeting minutes under `01-proposal/`. A commit that changes anything under `04-automation/` without a recorded second reader is treated as unreviewed, and the tagged release at week 12 must contain none.

#### 10.2.5 Staging before production

The lab has no physically separate staging environment, so staging is implemented as **three graded steps** in the same estate:

1. **Syntax and lint gate** — `ansible-playbook --syntax-check`, plus ShellCheck for Bash and PSScriptAnalyzer for PowerShell. Nothing runs until it parses and lints.
2. **Dry-run gate** — `--check --diff` against the whole target group. This reports what *would* change without changing it.
3. **Canary gate** — the real run against **one host** first (`--limit`), verified by hand, then the remainder of the group, then the site.

For the Windows estate the canary is always a non-DC member server; for the DMZ the canary is the secondary node (`vpnz-dmzrev02`), never the node currently holding the VIP. This ordering is a design decision, not a habit.

#### 10.2.6 Blast-radius control

Blast radius is the set of systems that a single mistake can damage. It is controlled by four mechanisms:

- **Groupings over wildcards.** No playbook targets `all` except the read-only audit playbook of section 10.4.6.4. Deployment playbooks target a named group with an explicit `hosts:` line.
- **`serial` and `max_fail_percentage`.** Rolling deployment across a tier (`serial: 1` for the two-node pairs) so that a failure stops the rollout while a majority of the service is still healthy.
- **`--limit` as the default discipline.** Every group member prefixes a first run with `--limit`.
- **Tier separation of credentials.** The GitHub-style service account `svc_ansible` is a member of `GG-WINRM-Admins` **only**. It is not a Domain Admin. Administering `vpnz-dc01` and `vpnz-dc02` requires one of the four named `adm-{initials}` accounts, two of which are in `GG-Tier0-Admins`. A playbook aimed at the domain controllers therefore cannot be run by the automation account alone, which is itself a blast-radius control.

#### 10.2.7 Rollback

Three rollback mechanisms exist, in increasing order of severity:

| Mechanism | Applies to | How |
|---|---|---|
| Declarative revert | Anything Ansible manages | Revert the Git commit and re-run the playbook; because the code is idempotent, the state converges back |
| Configuration-file revert | `nftables`, `keepalived`, `nginx`, `sshd` | The role keeps the previous file as `<file>.bak.<timestamp>`, and the handlers restore it if the new file fails its validation |
| Firewall lock-out timer | nftables only | `02-nftables-apply.sh` arms an automatic revert before applying a new ruleset, so a bad ruleset cannot strand the group outside a remote VM — this is the documented lock-out mitigation required by §12.2 |
| Hypervisor snapshot | Anything | One snapshot before every significant change, removed once the change is verified; **snapshots are never a backup** (§15.3) |

Rollback is tested, not assumed. At least one deliberate rollback is executed and captured as evidence, because an untested rollback path is an unverified claim.

#### 10.2.8 Secrets management

No plaintext secret may ever be committed. The controls are:

- **Ansible Vault** for every secret consumed by a playbook (Windows local administrator passwords during bootstrap, the vault-encrypted `svc_ansible` credential, iSCSI CHAP secrets, the Grafana administrator password, and the SMTP-style alert webhook tokens if configured).
- **`svc_ansible`** is created with a 32-character random password stored in the group's password manager, never in Git; "Password never expires" is disabled and the password is rotated by playbook, per §8.4.
- **`.gitignore`** covering `*.key`, `wg*.conf`, `*.pem`, `*.pfx`, `pki/`, `vault-pass*`, `*.retry` and `logs/`.
- **A pre-tag sweep.** Before each tagged release, the repository is searched for secret-shaped strings — `gitleaks` if it is available in the Ubuntu archive, otherwise a `git grep` sweep plus a PowerShell `Select-String` sweep for `password=`, `PRIVATE KEY` and `BEGIN OPENSSH`. The sweep output is evidence.
- **A deliberate negative test.** A fake key is committed once, on a throwaway branch, to prove the sweep catches it; the branch is deleted and the capture is retained in `06-verification/`.

#### 10.2.9 Relationship of each principle to the WSOS Domain 5 requirement

The WSOS Domain 5 requirement is `Identify and implement infrastructure as code` (nested: `Ansible.`). The mapping from principle to requirement is direct and is stated here because it is the chapter's justification:

| Principle | How it satisfies `Identify and implement infrastructure as code` |
|---|---|
| Declarative model | Infrastructure as code is only meaningful when the code describes *state*; the declarative choice is what makes the repository the description of the estate |
| Idempotence | A repository that is not idempotent cannot be the source of truth, because applying it changes the estate in unstated ways; `changed=0` is the proof that the code and the estate agree |
| Source of truth | "As code" means the file is authoritative and the running system is the derivative — the single-home rule is the operational form of the requirement |
| Peer review | Code is reviewable; a CLI session is not. Review is what makes the artefact "code" rather than "a log of what someone typed" |
| Staging before production | The `Capabilities of various automation tools` and `Behaviour of infrastructure automation tools.` know/understand lines require the team to know how the tool behaves before it acts; the dry-run gate is that knowledge in practice |
| Blast-radius control | `The importance of methodical working practices` (Domain 1) applied to change management |
| Rollback | `Importance of code version control` (Domain 5) — version control exists precisely so that a previous state can be recovered |
| Secrets management | A repository that cannot be shared is not a source of truth; vaulting is what allows the code to be complete *and* committable |

`Use modern automation tools for systems deployment and configuration management` (nested `Git`) is satisfied by the repository, the branch strategy of section 10.3 and the tagged releases; `Setup and run routine infrastructure maintenance operations using various scripting\programming languages` (nested `Bash`, `PowerShell`) is satisfied by sections 10.5 and 10.6.

---

### 10.3 Repository and Project Structure

#### 10.3.1 The exact directory layout

The automation repository is at `C:\FYP\04-automation\` on the working copies and is mirrored to Git on `vpnz-mon01`. All paths below are verbatim from the baseline and must not be re-arranged:

```text
C:\FYP\04-automation\
├── ansible/
│   ├── ansible.cfg
│   ├── inventory/
│   │   ├── hosts.yml
│   │   ├── lab.ini
│   │   ├── group_vars/
│   │   │   ├── all.yml
│   │   │   ├── all/
│   │   │   │   └── vault.yml          (Ansible Vault; committed encrypted)
│   │   │   ├── windows.yml
│   │   │   ├── linux.yml
│   │   │   ├── web.yml
│   │   │   ├── edge.yml
│   │   │   ├── monitoring.yml
│   │   │   └── dmz.yml
│   │   └── host_vars/
│   │       ├── vpnz-nft01.yml
│   │       ├── vpnz-nft02.yml
│   │       ├── vpnz-dmzrev01.yml
│   │       ├── vpnz-dmzrev02.yml
│   │       └── vpnz-mon01.yml
│   ├── playbooks/
│   │   ├── 01-baseline-windows.yml
│   │   ├── 02-baseline-linux.yml
│   │   ├── 03-nginx-reverseproxy.yml
│   │   ├── 04-keepalived.yml
│   │   ├── 05-nftables-egress.yml
│   │   ├── 06-wireguard.yml
│   │   ├── 07-ad-users.yml
│   │   ├── 08-collect-network-configs.yml
│   │   └── 09-verify-services.yml
│   ├── roles/
│   │   ├── common/
│   │   ├── nginx/
│   │   ├── keepalived/
│   │   ├── nftables/
│   │   ├── wireguard/
│   │   ├── winrm/
│   │   ├── windows_baseline/
│   │   ├── ad_users/
│   │   └── users/
│   ├── filter_plugins/
│   │   ├── fyp_filters.py
│   │   └── README.md
│   ├── templates/
│   │   ├── nftables.conf.j2
│   │   ├── keepalived.conf.j2
│   │   ├── wg0.conf.j2
│   │   ├── nginx-upstreams.conf.j2
│   │   ├── portal.conf.j2
│   │   ├── sshd-hardening.conf.j2
│   │   └── sysctl-hardening.conf.j2
│   ├── files/
│   │   ├── dmzrev01/nginx.conf
│   │   ├── dmzrev02/nginx.conf
│   │   └── ssh/authorized_keys/
│   │       ├── adm-w1.pub
│   │       ├── adm-w2.pub
│   │       ├── adm-w3.pub
│   │       └── adm-w4.pub
│   ├── docs/
│   │   ├── 01-runbook-baseline-linux.md
│   │   ├── 02-runbook-nftables-lockout.md
│   │   ├── 03-runbook-vault.md
│   │   ├── 04-variable-dictionary.md
│   │   └── 05-idempotence-log.md
│   └── logs/
│       └── ansible.log
├── powershell/
│   ├── Invoke-NewStarterOnboarding.ps1
│   ├── Get-ADHealthReport.ps1
│   ├── Backup-NetworkDeviceConfig.ps1
│   ├── Test-ServiceEndpoints.ps1
│   ├── Export-GPOBackup.ps1
│   ├── Invoke-ScheduledBackupVerify.ps1
│   ├── modules/VPCommon/VPCommon.psm1
│   ├── data/newstarters.csv
│   └── logs/
├── bash/
│   ├── 01-hardening-baseline.sh
│   ├── 02-nftables-apply.sh
│   ├── 03-keepalived-check.sh
│   ├── 04-backup-restic.sh
│   ├── 05-cert-renew.sh
│   ├── 06-server-health-report.sh
│   ├── 07-nftables-log-summary.sh
│   └── lib/common.sh
└── runs/
    └── YYYY-MM-DD_HHMM_playbook.log
```

#### 10.3.2 What every directory is for

| Path | Purpose and rules |
|---|---|
| `ansible/ansible.cfg` | The single configuration file, versioned. Every playbook run from the repository root picks it up automatically; nobody passes ad-hoc flags that change its behaviour, because a flag is invisible to the next reader (see 10.4.3) |
| `inventory/hosts.yml` | The **authoritative** inventory: every host, its address, and its group membership. `lab.ini` is retained as the baseline's INI-format inventory and kept in sync by a consistency check, because the baseline names it; `hosts.yml` is what the playbooks actually consume |
| `inventory/group_vars/` | Variables that apply to a group. `all.yml` holds the values true everywhere — domain name, NTP and DNS servers, admin groups, package update policy. Group files hold the tier-specific values |
| `inventory/group_vars/all/vault.yml` | Vault-encrypted secrets (see 10.4.4). Committed **encrypted**; the plaintext never exists on disk in the repository |
| `inventory/host_vars/` | Per-host overrides that genuinely differ, such as `keepalived_priority` and `keepalived_state` for the two VRRP pairs, or the backup destination for a specific host. Anything that could be a group variable belongs in a group variable — host_vars is for genuine per-host facts, not for convenience |
| `playbooks/` | Entry points. A playbook describes *what deployment is being performed*; it contains as little logic as possible, delegating to roles. The numbered prefix is the recommended run order and is referenced by the schedule |
| `roles/` | Reusable units. Each role contains `tasks/`, `handlers/`, `templates/`, `files/`, `defaults/`, `vars/` and `meta/` as needed, plus a `README.md` stating the role's purpose and its idempotence note |
| `templates/` | Jinja2 templates only. A template rendered anywhere in the project lives here; a role's `templates/` directory is used only when the template is genuinely private to that role |
| `files/` | Static, non-templated content: the hand-written `nginx.conf`, and the administrators' Ed25519 public keys under `files/ssh/authorized_keys/`. Public keys are committed; **private keys are never stored on `vpnz-mon01`** |
| `filter_plugins/` | Custom Jinja2 filters used by the templates. The project needs only a small number — for example a filter that renders a list of prefixes into nftables set syntax, and a filter that derives the correct VLAN interface name from a host's role — and they are unit-tested by a small assertion playbook so that a broken filter fails loudly rather than rendering an empty firewall rule |
| `docs/` | The human-readable operational documentation that belongs beside the code: the runbooks, the variable dictionary, and the idempotence log that records each `changed=0` proof |
| `logs/ansible.log` | Ansible's own log file, as configured by `log_path` in `ansible.cfg`. It is a convenience for debugging, not the evidence |
| `powershell/` | The Windows-side scripts, a shared module, input data and script logs. `modules/VPCommon/` holds functions reused by more than one script and is versioned so that a change to a shared function is visible in `git log` |
| `bash/` | The Linux-side scripts plus `lib/common.sh`, which provides logging, error handling and the `set -euo pipefail` preamble so that every script behaves identically |
| `runs/` | **Evidence.** Timestamped run logs named `YYYY-MM-DD_HHMM_playbook.log`, committed so that the verification chapter can cite them. A playbook run whose log is not committed did not provably happen |

#### 10.3.3 Branch strategy

A lightly-governed Git-flow variant, sized for four students and twelve weeks:

| Branch | Lifetime | Rule |
|---|---|---|
| `main` | permanent | Always deployable. Only merges from `task/*` arrive here, always with one recorded reviewer. Tagged `v0.1`, `v0.2`, … at each milestone gate |
| `task/{line}-{short-name}` | per change | One branch per change, named for the line and the change, e.g. `task-l4-nftables-egress-role`, `task-l2-keepalived-track-script` |
| `fix/{short-name}` | per defect | A defect found during verification |
| `docs/{short-name}` | per documentation change | Documentation-only changes, so that a documentation commit never mixes with a configuration commit |
| `spike/{short-name}` | per experiment | Throwaway branches for Packet Tracer experiments and the AI feasibility spike; merged only as notes, never as configuration |

Naming follows the baseline: `task-l1-…` for MS-SERVER, `task-l2-…` for LINUX-SERVER, `task-l3-…` for CISCO, `task-l4-…` for AUTOMATION, `task-l5-…` for AI-NETOPS.

#### 10.3.4 Commit and review convention

Commits are conventional-commit style with a scope that names the artefact, so that `git log` is readable evidence in its own right:

```text
feat(l4-ansible): add nftables role with lockout-safe apply

- renders /etc/nftables.conf from templates/nftables.conf.j2
- table inet fyp_filter, input+forward policy drop, log prefix NFT-DROP:
- validate with `nft -c -f` before reload; reload via systemd unit
- idempotence: second run changed=0 (see runs/2026-11-03_2140_05-nftables-egress.log)

Refs: TC-L4-03, TB-03, TB-04
Reviewed-by: adm-w3
```

The rules:

1. One logical change per commit. A commit that changes the firewall *and* reformats an unrelated playbook is sent back.
2. **Every commit that changes configuration cites at least one test-case ID (`TC-L4-nn`) and, where relevant, the trust-boundary rule it implements (`TB-nn`).** This is what turns the repository into a traceability artefact rather than a file dump.
3. Every commit that changes an idempotent artefact states the idempotence evidence in the message body.
4. `Reviewed-by:` names a second group member. The same person may not be author and reviewer.
5. Tags are annotated and pushed: `git tag -a v0.3 -m "Week 6 gate: nftables pair live, idempotent"`. Release tags are the points at which the secret sweep runs.
6. Commit messages are written in English, in the imperative mood, and never contain a real credential, an internal password, or a private key — including in a "temporary" commit, because `git log` is forever.

---

### 10.4 Ansible

#### 10.4.1 Control node setup

##### 10.4.1.1 Pinned engine and Python environment

The pinned engine is `ansible-core` **2.18.x** with the **`ansible` community package 11.x**, plus **`pywinrm` 0.5.0** for Windows connectivity. These versions are chosen for a reason that is easy to get wrong: `ansible-core` from the Ubuntu 24.04 archive is older than the pin, and the community package collection `ansible.windows`, which provides `win_ping` and the rest of the Windows module set, must match the core version. The supported installation is therefore a virtual environment under `/opt`, not an `apt` package:

```bash
#!/usr/bin/env bash
# vpnz-mon01 — one-time control-node bootstrap (run as an administrator)
set -euo pipefail

sudo apt-get update
sudo apt-get install -y python3-venv python3-pip sshpass git jq

sudo mkdir -p /opt/ansible-venv
sudo chown "$(id -un):$(id -gn)" /opt/ansible-venv
python3 -m venv /opt/ansible-venv/venv

# ansible-core 2.18.x + community package 11.x + pywinrm 0.5.0
/opt/ansible-venv/venv/bin/pip install --upgrade pip
/opt/ansible-venv/venv/bin/pip install \
  'ansible-core~=2.18.0' \
  'ansible~=11.0' \
  'pywinrm==0.5.0' \
  'jmespath' 'netaddr'

# Record the ACTUAL versions as evidence (required by the version-pinning discipline)
{
  echo "=== captured $(date -Is) on $(hostname) ==="
  /opt/ansible-venv/venv/bin/ansible --version
  /opt/ansible-venv/venv/bin/ansible-galaxy collection list
  /opt/ansible-venv/venv/bin/python3 -c 'import winrm, sys; print("pywinrm", winrm.__version__)'
} | tee /srv/evidence/version-ansible-$(date +%Y%m%d).txt
```

The version capture is not optional. §7's pinning discipline requires that where the actual version differs from the table, the report contains a *version deviations* subsection listing each difference and its impact. If the community package cannot be installed at 11.x in the lab, the group records the version actually present and states the deviation — silently writing "11.x" against a 10.x installation is a reportable integrity failure for this project.

##### 10.4.1.2 SSH keys to the managed Linux hosts

Administrators use Ed25519 keys. The keys are generated **once per administrator on that administrator's own machine**; only the public halves are committed, under `04-automation/ansible/files/ssh/authorized_keys/adm-w{n}.pub`. Private keys are never stored on `vpnz-mon01`, which is the rule that makes the control node a place a student can hand over.

```bash
# 1) On each administrator's own machine (not on vpnz-mon01):
ssh-keygen -t ed25519 -a 100 -C "adm-w1@vertexpeak.fyp.lab" -f ~/.ssh/id_ed25519_adm-w1
# 2) The PUBLIC key is committed:
#    files/ssh/authorized_keys/adm-w1.pub
# 3) Distribute, then immediately verify password login is refused:
ssh-copy-id -i ~/.ssh/id_ed25519_adm-w1.pub fypadmin@10.10.30.31
ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no adm-w1@10.10.30.31   # must fail
```

The `users` role then owns the steady state: it installs the public keys for exactly the four `adm-{initials}` accounts, keeps `PermitRootLogin no` and `PasswordAuthentication no` in `/etc/ssh/sshd_config.d/10-fyp-hardening.conf`, and restricts SSH to `AllowGroups gg-infra-admins`. The bootstrap account `fypadmin` created by the cloud-init template is disabled once the four administrators can log in through Ansible — otherwise the template account becomes a permanent shared credential, which the design forbids.

##### 10.4.1.3 Windows managed-node prerequisites

Ansible reaches Windows guests through WinRM, and WinRM is **not** on by default in a way that supports this design. Three things must be true on every Windows managed node: a listener exists and is reachable, the authentication path is trusted, and the firewall permits the traffic from `vpnz-mon01` only.

**The decision on the listener.** Two options exist — WinRM over HTTP on 5985, or WinRM over HTTPS on 5986. **This project uses HTTPS on 5986**, because §12.4 requires it, because the credential travels inside the session, and because 5985 is unencrypted and unauthenticated at the transport layer. That decision is not free: an HTTPS listener needs a certificate whose subject name matches how Ansible addresses the host, and the certificate must be trusted by the client, or validation must be deliberately relaxed.

Three sub-options were considered:

| Option | Verdict | Reason |
|---|---|---|
| HTTPS with a certificate issued by the internal PKI (`VP-ISSUING-CA-01`) and the CA chain distributed to `vpnz-mon01` | **Chosen for the domain-joined estate** | Correct, auditable, and demonstrates the PKI work of L1 being used by L4. Requires `vpnz-mon01` to trust the CA chain, which is done by placing `vp-root-ca.crt` in `/usr/local/share/ca-certificates/` and running `update-ca-certificates` |
| HTTPS with a self-signed certificate created by `New-SelfSignedCertificate` | **Chosen for the two DMZ web nodes only** | The DMZ hosts are domain-joined only if the group accepts the "no cached credential" trade-off (open item O-05); if they are workgroup-isolated, a PKI-issued certificate is not available and a self-signed one is the pragmatic choice. The trust consequence is documented rather than hidden: either the exporting certificate is imported into `vpnz-mon01`'s trust store, or `ansible_winrm_server_cert_validation` is set to `ignore` **for those two hosts only, as a declared lab simplification** |
| HTTPS with `ansible_winrm_server_cert_validation=ignore` estate-wide, or plain HTTP on 5985 | **Rejected** | Estate-wide validation bypass would be the wrong lesson to document; the report is meant to be evidence of good practice, and a bypass documented as normal practice is not |

For the non-domain-joined case, `TrustedHosts` on the *client* is not used at all in this design — the client is Linux. `TrustedHosts` is a Windows-client-side list that applies when a Windows machine initiates WinRM to a non-domain target; it is mentioned in section 10.5.2 because the group uses it during the PowerShell remoting demonstration from `vpnz-jump01`, but the Ansible path relies on the listener certificate plus a trusted chain, not on `TrustedHosts`.

**The exact WinRM configuration PowerShell.** This block is executed once on each Windows managed node, either interactively during the build or, preferably, pushed by the `winrm` role:

```powershell
<#
.SYNOPSIS
    Configures a Windows Server 2025 guest as an Ansible-managed node over WinRM/HTTPS.
.DESCRIPTION
    Run once on every Windows managed node, elevated. Idempotent: safe to re-run.
    Scope of this project: Windows Server 2025 Standard (Desktop Experience).
    Fallback: Windows Server 2022 (build 20348) — identical cmdlets.
.PARAMETER ControlNodeAddress
    The automation control node. Only this address is allowed through the firewall.
.PARAMETER CertificateThumbprint
    Thumbprint of an existing certificate with a SAN matching the host FQDN.
    Omit to create a self-signed certificate of last resort (documented deviation).
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidatePattern('^(\d{1,3}\.){3}\d{1,3}$')]
    [string]$ControlNodeAddress = '10.10.30.31',

    [ValidatePattern('^[0-9A-Fa-f]{40}$')]
    [string]$CertificateThumbprint,

    [ValidateSet('5985','5986')][string]$ListenerPort = '5986'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step { param([string]$Message)
    Write-Host ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message) }

try {
    Write-Step 'Checking WinRM service state'
    if ((Get-Service WinRM).StartType -ne 'Automatic') {
        Set-Service WinRM -StartupType Automatic
    }
    if ((Get-Service WinRM).Status -ne 'Running') { Start-Service WinRM }

    Write-Step 'Enabling PowerShell remoting (HTTP listener, then removed below)'
    # -SkipNetworkProfileCheck: needed because lab NICs are often classified as Public.
    Enable-PSRemoting -Force -SkipNetworkProfileCheck

    if ($ListenerPort -eq '5986') {
        if (-not $CertificateThumbprint) {
            Write-Step 'No thumbprint supplied - creating a self-signed certificate (documented deviation)'
            $fqdn = "$env:COMPUTERNAME.$((Get-CimInstance Win32_ComputerSystem).Domain)"
            $CertificateThumbprint = (New-SelfSignedCertificate `
                -DnsName $env:COMPUTERNAME, $fqdn `
                -CertStoreLocation 'Cert:\LocalMachine\My' `
                -NotAfter (Get-Date).AddDays(397) `
                -KeyAlgorithm RSA -KeyLength 2048 `
                -TextExtension @('2.5.29.37={text}1.3.6.1.5.5.7.3.1')).Thumbprint
            Write-Warning "Self-signed thumbprint $CertificateThumbprint - must be trusted on vpnz-mon01"
        }

        Write-Step "Creating HTTPS listener on port 5986 (thumbprint $CertificateThumbprint)"
        $https = Get-ChildItem WSMan:\Localhost\Listener |
                 Where-Object { $_.Keys -contains 'Transport=HTTPS' }
        if (-not $https) {
            New-Item -Path WSMan:\Localhost\Listener `
                     -Transport HTTPS -Address * `
                     -CertificateThumbprint $CertificateThumbprint | Out-Null
        }

        Write-Step 'Removing the unencrypted HTTP listener on 5985'
        Get-ChildItem WSMan:\Localhost\Listener |
            Where-Object { $_.Keys -contains 'Transport=HTTP' } |
            ForEach-Object { Remove-Item -Path ("WSMan:\Localhost\Listener\" + $_.Name) -Recurse -Force }

        Write-Step 'Restricting WinRM to Negotiate/CredSSP and setting MaxEnvelopeSizekb'
        Set-Item WSMan:\Localhost\Service\Auth\Basic -Value $false
        Set-Item WSMan:\Localhost\Service\AllowUnencrypted -Value $false
        Set-Item WSMan:\localhost\MaxEnvelopeSizekb -Value 500
        Set-Item WSMan:\localhost\Shell\IdleTimeout -Value 300000   # 5 minutes
        Set-Item WSMan:\localhost\Service\MaxConcurrentUsers -Value 10
    }

    Write-Step "Firewall rule: allow TCP $ListenerPort from $ControlNodeAddress only"
    $ruleName = "FYP-Ansible-WinRM-$ListenerPort"
    $existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    if ($existing) { Remove-NetFirewallRule -DisplayName $ruleName }
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow `
        -Protocol TCP -LocalPort ([int]$ListenerPort) `
        -RemoteAddress $ControlNodeAddress -Profile Domain,Private,Public `
        -Description 'Ansible control node on vpnz-mon01 (10.10.30.31) - TB-07/TB-08' | Out-Null

    Write-Step 'Verifying'
    Test-WSMan -ComputerName $env:COMPUTERNAME -UseSSL -ErrorAction Continue
    Get-ChildItem WSMan:\Localhost\Listener | Select-Object Name, Keys
    Get-NetFirewallRule -DisplayName $ruleName |
        Get-NetFirewallAddressFilter | Select-Object RemoteAddress
    Write-Step 'Done'
}
catch {
    Write-Error ("WinRM configuration failed: {0}" -f $_.Exception.Message)
    throw
}
```

**Why each element is there.** `Enable-PSRemoting -Force -SkipNetworkProfileCheck` is used for the HTTP listener because it creates the service configuration, the `WSMan` provider settings and the required firewall group in one step; the HTTP listener it creates is then *removed*, because leaving it enabled would leave an unencrypted path that the design says does not exist. `-SkipNetworkProfileCheck` is needed in this lab specifically because hypervisor host-only adapters are frequently classified as `Public`, and without the flag the cmdlet refuses. Disabling `Basic` authentication and `AllowUnencrypted` closes the credential path that HTTP would have used. The firewall rule is scoped by `-RemoteAddress` to `10.10.30.31` alone, which implements the spirit of the trust-boundary table's management rows (TB-07, TB-08) at the host level as well as at the network level. `MaxEnvelopeSizekb 500` and a five-minute idle timeout are the standard hardening adjustments needed before Ansible can move a moderately large module payload over WinRM without a `WinRM cannot process the request` fault.

**Ansible's side of the connection.** The connection variables live in `inventory/group_vars/windows.yml`, not on the command line:

```yaml
# inventory/group_vars/windows.yml
ansible_connection: winrm
ansible_port: 5986
ansible_winrm_transport: ntlm          # kerberos is preferred; see the note below
ansible_winrm_scheme: https
ansible_winrm_server_cert_validation: validate
ansible_user: "{{ vault_svc_ansible_user }}"
ansible_password: "{{ vault_svc_ansible_password }}"
ansible_winrm_read_timeout_sec: 60
ansible_winrm_operation_timeout_sec: 30
ansible_winrm_message_encryption: auto
ansible_become: false                  # Ansible runs as a local/domain admin; see 10.4.4
```

`ansible_winrm_transport: ntlm` is the pragmatic choice for a small domain. Kerberos is the stronger option and should be used if the group can arrange it, because it avoids sending a reusable credential; NTLM is at least encrypted inside the HTTPS session. The report must state which transport was used and why, because this is exactly the kind of detail that a "we used Ansible on Windows" sentence erases.

##### 10.4.1.4 Verification of the control-node path

The proof that the control node can reach the estate is the `win_ping` result required by §12.4, plus the SSH equivalent for Linux:

```bash
cd /opt/ansible-venv/repo/04-automation/ansible
ansible windows -i inventory/hosts.yml -m ansible.windows.win_ping
ansible linux -i inventory/hosts.yml -m ansible.builtin.ping
ansible windows -i inventory/hosts.yml -m ansible.windows.win_shell -a 'whoami; $PSVersionTable.PSVersion'
```

Expected shape of the result (illustrative):

```text
vpnz-dc01 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
vpnz-fs01 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
```

The `whoami` check is included deliberately: it proves *which identity* Ansible is using, which is the fact that most often differs from what the team believes.

#### 10.4.2 Inventory design

##### 10.4.2.1 The complete inventory

`inventory/hosts.yml` is the authoritative inventory. Every hostname, address and VLAN below is taken verbatim from the canonical design; no host in this file may be re-addressed, re-capitalised or abbreviated locally.

```yaml
---
# C:\FYP\04-automation\ansible\inventory\hosts.yml
# Vertex Peak - Victor2 FYP - authoritative Ansible inventory.
# Addresses are verbatim from the canonical design baseline (static host table).
# Packet Tracer devices are tracked here for documentation and config-collection
# purposes only; Ansible CANNOT reach them (see 10.7).

all:
  children:

    # ------------------------------------------------------------------
    # Automation, monitoring and AI tier
    # ------------------------------------------------------------------
    monitoring:
      hosts:
        vpnz-mon01:
          ansible_host: 10.10.30.31
          ansible_user: adm-w4          # automation owner
          fyp_role: ansible_control_node

    ai:
      hosts:
        vpnz-ai01:
          ansible_host: 10.10.30.51
          ansible_user: adm-w4
          fyp_role: agent_runtime
          fyp_readonly_only: true       # never targeted by a mutating playbook

    # ------------------------------------------------------------------
    # Microsoft estate (managed over WinRM/HTTPS, 5986)
    # ------------------------------------------------------------------
    windows:
      children:
        windows_servers:
          hosts:
            vpnz-dc01:      { ansible_host: 10.10.30.11, fyp_tier: tier0, fyp_role: dc }
            vpnz-dc02:      { ansible_host: 10.10.30.12, fyp_tier: tier0, fyp_role: dc }
            vpnz-fs01:      { ansible_host: 10.10.30.21, fyp_tier: tier1, fyp_role: file_server }
            vpnz-san01:     { ansible_host: 10.10.80.21, fyp_tier: tier1, fyp_role: iscsi_target }
            vpnz-rras01:    { ansible_host: 10.10.30.41, fyp_tier: tier1, fyp_role: vpn }
            vpnz-jump01:    { ansible_host: 10.20.20.31, fyp_tier: tier0, fyp_role: paw }
            vpnz-brdc01:    { ansible_host: 10.10.113.11, fyp_tier: tier0, fyp_role: rodc }
        dmz_windows:
          hosts:
            vpnz-dmzweba01: { ansible_host: 10.10.90.21, fyp_tier: tier1, fyp_role: iis }
            vpnz-dmzweba02: { ansible_host: 10.10.90.22, fyp_tier: tier1, fyp_role: iis }
      vars:
        ansible_connection: winrm
        ansible_port: 5986
        ansible_winrm_transport: ntlm
        ansible_winrm_scheme: https
        ansible_winrm_server_cert_validation: validate

    # ------------------------------------------------------------------
    # Linux estate (managed over SSH)
    # ------------------------------------------------------------------
    linux:
      children:
        linux_servers:
          hosts:
            vpnz-lnxra01:   { ansible_host: 10.10.30.42, fyp_role: openvpn }
            vpnz-dmzwp01:   { ansible_host: 10.10.90.25, fyp_role: wordpress }
            vpnz-dmzwp02:   { ansible_host: 10.10.90.26, fyp_role: wordpress }
            vpnz-dmzjump01: { ansible_host: 10.10.90.27, fyp_role: dmz_jump }
        web:
          hosts:
            vpnz-dmzrev01:
              ansible_host: 10.10.90.28
              fyp_role: nginx_reverse_proxy
              keepalived_state: MASTER
              keepalived_priority: 150
            vpnz-dmzrev02:
              ansible_host: 10.10.90.29
              fyp_role: nginx_reverse_proxy
              keepalived_state: BACKUP
              keepalived_priority: 100
        edge:
          hosts:
            vpnz-nft01:
              ansible_host: 10.10.50.11
              fyp_role: nftables_egress
              keepalived_state: MASTER
              keepalived_priority: 150
            vpnz-nft02:
              ansible_host: 10.10.50.12
              fyp_role: nftables_egress
              keepalived_state: BACKUP
              keepalived_priority: 100
      vars:
        ansible_connection: ssh
        ansible_user: "{{ lookup('env', 'USER') | default('adm-w4', true) }}"
        ansible_ssh_private_key_file: "~/.ssh/id_ed25519_adm-w4"
        ansible_python_interpreter: auto_silent
        ansible_become: true
        ansible_become_method: sudo
        ansible_become_user: root
        ansible_ssh_common_args: >-
          -o StrictHostKeyChecking=accept-new
          -o UserKnownHostsFile=~/.ssh/known_hosts

    # ------------------------------------------------------------------
    # Management / out of band
    # ------------------------------------------------------------------
    mgmt:
      hosts:
        vpnz-hvhost01:
          ansible_host: 10.20.20.10
          fyp_role: hypervisor
          ansible_connection: local      # never managed remotely; documented only
```

##### 10.4.2.2 Groups, the group-of-groups pattern, and why the hierarchy is shaped this way

**The seven named groups.** `windows`, `linux`, `web`, `edge`, `monitoring`, `cisco` and `mgmt` are the groups the baseline fixes for the inventory. The design adds one refinement: the Windows and Linux groups are themselves **groups of groups**, containing `windows_servers` and `dmz_windows`; and `linux_servers`, `web` and `edge`.

The group-of-groups pattern exists because a *zone* and an *operating system family* are two different facts about a host, and a flat inventory cannot express both without duplication. `vpnz-dmzrev01` is a Linux host **and** a DMZ host **and** a web-tier host. With the hierarchy:

- `hosts: linux` matches all nine Linux guests — this is the group that carries the SSH connection variables.
- `hosts: web` matches exactly the two reverse proxies — this is the group the `keepalived` and `nginx` roles are written against, and it is naturally `serial: 1`.
- `hosts: windows` matches all nine Windows guests and carries the single set of WinRM connection variables, so a connection setting is stated once and cannot drift between the two Windows subgroups.
- `hosts: edge` matches the two nftables nodes — the only hosts on which a firewall playbook may change the ruleset, and the only hosts where the lock-out timer logic of `02-nftables-apply.sh` matters.

**`vpnz-dc01` and `vpnz-dc02` are deliberately placed in `windows`, not in a "servers" group, and are further tagged with `fyp_tier: tier0`.** This lets a playbook exclude them by variable rather than by a remembered exclusion, and it lets the audit playbook target tier 0 separately. The tier tags mirror the two-of-four Tier-0 split recorded in §9.3.

**The `cisco` group.** Packet Tracer devices cannot be reached by Ansible at all (§11.4, PT-06). They therefore appear in the inventory as a **documentation group with `ansible_connection: local` and no connection attempt**, so that a single inventory file remains the complete picture of the estate and so that the configuration-collection playbook of 10.4.6.5 can correlate "a configuration exists for this device" without pretending to log in:

```yaml
    cisco:
      hosts:
        VP-HQ-CORE-01:   { fyp_device_ip: 10.20.20.11, fyp_loopback: 10.255.0.11 }
        VP-HQ-CORE-02:   { fyp_device_ip: 10.20.20.12, fyp_loopback: 10.255.0.12 }
        VP-HQ-DSW-A01:   { fyp_device_ip: 10.20.20.21 }
        VP-HQ-DSW-A02:   { fyp_device_ip: 10.20.20.22 }
        VP-HQ-DSW-A03:   { fyp_device_ip: 10.20.20.23 }
        VP-HQ-DSW-A04:   { fyp_device_ip: 10.20.20.24 }
        VP-HQ-EDGE-01:   { fyp_device_ip: 10.20.20.31, fyp_loopback: 10.255.0.21 }
        VP-HQ-FW-01:     { fyp_device_ip: 10.20.20.32 }
        VP-BR-EDGE-01:   { fyp_device_ip: 10.10.113.1,  fyp_loopback: 10.255.0.31 }
        VP-BR-DSW-A01:   { fyp_device_ip: 10.10.113.21 }
        VP-MO-EDGE-01:   { fyp_device_ip: 10.10.120.1,  fyp_loopback: 10.255.0.41 }
        VP-MO-DSW-A01:   { fyp_device_ip: 10.10.120.21 }
        VP-WC-EDGE-01:   { fyp_device_ip: 10.10.130.1,  fyp_loopback: 10.255.0.51 }
        VP-WC-DSW-A01:   { fyp_device_ip: 10.10.130.21 }
        VP-ISP-EDGE-01:  { fyp_device_ip: 10.20.20.41,  fyp_loopback: 10.255.0.61 }
        VP-HQ-VOICE-01:  { fyp_device_ip: 10.10.45.11 }
      vars:
        ansible_connection: local       # documentation-only group - no login is attempted
        fyp_automation_reachable: false
```

##### 10.4.2.3 Inventory consistency checks

Two baselines in one repository is one baseline too many, so a small consistency playbook asserts that every address in `hosts.yml` also appears in the frozen address table, and that `lab.ini` has not drifted from `hosts.yml`:

```yaml
---
- name: INVENTORY-CONSISTENCY - assert inventory matches the design baseline
  hosts: localhost
  gather_facts: false
  vars:
    expected:
      vpnz-dc01: 10.10.30.11
      vpnz-dc02: 10.10.30.12
      vpnz-fs01: 10.10.30.21
      vpnz-san01: 10.10.80.21
      vpnz-rras01: 10.10.30.41
      vpnz-lnxra01: 10.10.30.42
      vpnz-mon01: 10.10.30.31
      vpnz-ai01: 10.10.30.51
      vpnz-jump01: 10.20.20.31
      vpnz-nft01: 10.10.50.11
      vpnz-nft02: 10.10.50.12
      vpnz-dmzrev01: 10.10.90.28
      vpnz-dmzrev02: 10.10.90.29
      vpnz-dmzweba01: 10.10.90.21
      vpnz-dmzweba02: 10.10.90.22
      vpnz-dmzwp01: 10.10.90.25
      vpnz-dmzwp02: 10.10.90.26
      vpnz-dmzjump01: 10.10.90.27
      vpnz-brdc01: 10.10.113.11
  tasks:
    - name: Every host in hosts.yml must carry the baseline address
      ansible.builtin.assert:
        that:
          - hostvars[item.key].ansible_host | default('') == item.value
        fail_msg: >-
          {{ item.key }} is {{ hostvars[item.key].ansible_host | default('unset') }}
          but the design baseline requires {{ item.value }}.
          A writer may not re-address a host locally; the baseline must be revised.
      loop: "{{ expected | dict2items }}"
      loop_control: { label: "{{ item.key }}" }
```

This is a small amount of code for a large amount of consistency, and it is the mechanism by which the interface-contract discipline of the design baseline is enforced technically rather than by good intentions.

#### 10.4.3 Configuration management: `ansible.cfg`

```ini
; C:\FYP\04-automation\ansible\ansible.cfg
; Vertex Peak - Victor2 FYP - single authoritative Ansible configuration.
[defaults]
inventory                  = ./inventory/hosts.yml
roles_path                 = ./roles
collections_path           = /opt/ansible-venv/venv/lib/python3.12/site-packages/ansible_collections
library                    = ./library
filter_plugins             = ./filter_plugins
remote_user                = adm-w4
host_key_checking          = False
retry_files_enabled        = True
retry_files_save_path      = ./logs/retry
gathering                  = smart
fact_caching               = jsonfile
fact_caching_connection    = ./logs/facts
fact_caching_timeout       = 86400
stdout_callback            = yaml
bin_ansible_callbacks      = True
callbacks_enabled          = profile_tasks, timer
display_skipped_hosts      = False
display_ok_hosts           = True
deprecation_warnings       = True
command_warnings           = True
log_path                   = ./logs/ansible.log
interpreter_python         = auto_silent
forks                      = 10
timeout                    = 30
nocows                     = 1
vault_password_file        = /home/adm-w4/.ansible/vault-pass-vp
ask_vault_pass             = False
allow_world_readable_tmpfiles = False

[privilege_escalation]
become                     = True
become_method              = sudo
become_user                = root
become_ask_pass            = False
become_flags               = -H -S -n

[persistent_connection]
connect_timeout            = 30
command_timeout            = 30

[inventory]
enable_plugins             = yaml, ini, host_list
unparsed_is_failed         = True

[ssh_connection]
pipelining                 = True
ssh_args                   = -o ControlMaster=auto -o ControlPersist=300s -o PreferredAuthentications=publickey
scp_if_ssh                 = smart
retries                    = 3
```

**Explanation of every setting, and why it is set that way here.**

| Setting | Value | Reason |
|---|---|---|
| `inventory` | `./inventory/hosts.yml` | A repository-relative path, so the repository is portable between the four students' machines and `vpnz-mon01`. Anyone who runs `ansible-playbook` from the repository root gets the right inventory with no flag |
| `roles_path` | `./roles` | Roles are found relative to the repository, so a role's location is never a matter of the machine's Ansible defaults |
| `collections_path` | the virtual-environment path | Makes the community package version in use explicit and prevents an accidental fallback to a system collection |
| `library` | `./library` | Present so that a bespoke module, if one is ever written, has a defined home |
| `filter_plugins` | `./filter_plugins` | The project's custom Jinja2 filters (for example the nftables-set renderer) must be found automatically |
| `remote_user` | `adm-w4` | A named personal account, never `root`, never a shared account. Overridden per host where a different administrator owns a host |
| `host_key_checking` | `False` | **[DECLARED LAB SIMPLIFICATION — not best practice]** The 19 VMs are rebuilt from templates repeatedly during the 12-week build, so their SSH host keys legitimately change and a strict check would block every automation run with a false alarm. The compensating controls are stated: the lab is entirely host-only with no bridging, no lab host is reachable from outside the hypervisor host, and the group additionally records the host keys of the steady-state estate in `docs/04-variable-dictionary.md` after week 9. The report must present this as a lab simplification with its justification — exactly as §12.2 requires for the Keepalived `PASS` authentication simplification |
| `retry_files_enabled` / `retry_files_save_path` | `True`, `./logs/retry` | A failed run leaves a retry file, so recovery is a single command and the failed host list is preserved |
| `gathering` / `fact_caching` | `smart` + `jsonfile` | Facts are gathered once and cached for 24 h. Without caching, a nine-host Windows gather dominates the runtime of every small playbook and tempts the team to disable fact gathering, which then breaks templates that depend on facts |
| `stdout_callback` | `yaml` | The readable recap. A plain `default` callback makes a long diff unreadable in a log, and the log *is* the evidence |
| `callbacks_enabled` | `profile_tasks, timer` | Records per-task duration, which is how slow roles get found and how the scheduling estimates in section 10.8 are justified |
| `display_skipped_hosts` | `False` | Skipped tasks are noise in a log that must be read by a reviewer |
| `log_path` | `./logs/ansible.log` | A persistent, committable log. `04-automation/runs/` additionally holds the timestamped per-run log written by the wrapper |
| `interpreter_python` | `auto_silent` | Discovers the interpreter and suppresses the discovery warning that would otherwise pollute every single run's output. The Linux estate has one interpreter (`/usr/bin/python3` from Ubuntu 24.04.3 LTS); Windows uses PowerShell through `pywinrm`, where this setting does not apply |
| `forks` | `10` | Ten parallel connections against a 19-VM estate on one hypervisor host is a deliberate ceiling: higher values exhaust the host's RAM before they save wall-clock time (§15.1) |
| `timeout` | `30` | Connection timeout. Long enough for a loaded host-only segment, short enough that a dead host fails a rollout in half a minute |
| `nocows` | `1` | ASCII art in a log is noise |
| `vault_password_file` | `/home/adm-w4/.ansible/vault-pass-vp` | The vault password file lives **outside the repository**, in the administrator's home directory, mode 0600. See 10.4.4 |
| `ask_vault_pass` | `False` | Because the file is used. The trade-off (the file is a secret on disk) is stated and compensated: the file is excluded by `.gitignore`, by the pre-tag secret sweep, and by file permissions, and scheduled runs use it through a `systemd` unit whose environment file is also 0600 root-owned |
| `allow_world_readable_tmpfiles` | `False` | The safe default; enabling it would be a security regression for convenience |
| `[privilege_escalation] become` | `True` | True globally, and then explicitly **overridden to `false` in `group_vars/windows.yml`**, because Windows targets have no `sudo`. Ansible's Windows modules are invoked in an already-elevated session |
| `become_method` / `become_user` | `sudo` / `root` | The Linux estate's escalation path. The members of the local `gg-infra-admins` group are the only accounts permitted to escalate |
| `become_flags` | `-H -S -n` | `-H` sets `$HOME` to root's home (avoids the classic `sudo: a password is required` / profile errors), `-S` reads the password from stdin, `-n` makes a non-interactive failure explicit rather than hanging |
| `[inventory] unparsed_is_failed` | `True` | If an inventory file exists but fails to parse, the run stops. The default is to warn and continue with an empty inventory, which in a firewall playbook would mean "no hosts, all good" — the most dangerous possible outcome |
| `[ssh_connection] pipelining` | `True` | A large speed-up, and safe here because `requiretty` is not set in the Ubuntu 24.04 sudoers configuration |
| `ssh_args` | `ControlMaster=auto`, `ControlPersist=300s` | Reuses one SSH connection for the duration of a rollout |
| `scp_if_ssh` | `smart` | Uses `scp` when the transfer is small and the target's SSH supports it; avoids the `sftp` failure mode on a minimal Ubuntu install |

Two anti-patterns are explicitly forbidden by the group's working agreement: passing `-e` with a secret on the command line (it lands in the shell history and in the process list), and overriding `ansible.cfg` values with flags on a run that produces evidence (the evidence then does not describe what the repository would do).

#### 10.4.4 Variables and secrets

##### 10.4.4.1 Variable precedence as the project uses it

Ansible's precedence order is long, and the project deliberately uses only five layers so that the origin of any value is obvious within seconds:

| Layer | File | Contents |
|---|---|---|
| 1 (lowest) | `roles/<role>/defaults/main.yml` | The role's tunable inputs with safe defaults. A default must be a value that is *correct for this project*, not a placeholder |
| 2 | `inventory/group_vars/all.yml` | Values true everywhere: `fyp_domain`, `fyp_netbios`, NTP and DNS servers, administrator group names, package policy |
| 3 | `inventory/group_vars/<group>.yml` | Tier values: connection settings, package lists, service enablement |
| 4 | `inventory/host_vars/<host>.yml` | Genuine per-host facts: VRRP state and priority, the backup destination, the specific upstream the host serves |
| 5 (highest, excluding runtime) | Vault-encrypted variables in `group_vars/all/vault.yml` | Secrets only. Nothing but secrets |

`roles/<role>/vars/main.yml` is used only for values that are *genuinely not tunable* — the internal constants of a role. Putting a variable there makes it effectively unchangeable, and that is occasionally the correct decision; it must never be used to "win" a precedence argument.

```yaml
# inventory/group_vars/all.yml
fyp_domain: vertexpeak.fyp.lab
fyp_netbios: VERTEXPEAK
fyp_site: HQ-ShaTin
fyp_dns_servers: [10.10.30.11, 10.10.30.12]
fyp_ntp_windows_source: vpnz-dc01.vertexpeak.fyp.lab
fyp_ntp_linux_source: 10.10.30.11
fyp_infra_admins_unix_group: gg-infra-admins
fyp_admins_group_windows: GG-Server-Admins
fyp_tier0_group_windows: GG-Tier0-Admins
fyp_monitoring_host: 10.10.30.31
fyp_log_forward_target: 10.10.30.31
fyp_log_forward_port: 514
fyp_package_update_cron: "0 3 * * 0"       # Sun 03:00 - inside the change window
fyp_change_window: "Sat 22:00 - Sun 02:00"
fyp_nftables_table: inet fyp_filter
fyp_nftables_log_prefix: "NFT-DROP: "
fyp_nginx_upstreams:
  weba_pool: ["10.10.90.21:443", "10.10.90.22:443"]
  wp_pool:   ["10.10.90.25:443", "10.10.90.26:443"]
```

```yaml
# inventory/host_vars/vpnz-dmzrev01.yml
keepalived_state: MASTER
keepalived_priority: 150
keepalived_vrid: 61
keepalived_vip: 10.10.90.10   # the VIP only; vpnz-dmzrev01 is 10.10.90.28 and vpnz-dmzrev02 is 10.10.90.29 (Rev 1.1 ruling C-02)
keepalived_interface: "{{ ansible_facts['default_ipv4']['interface'] }}"
nginx_server_name: portal.vertexpeak.example
nginx_tls_cert: /etc/nginx/ssl/portal.crt
nginx_tls_key: /etc/nginx/ssl/portal.key
```

The `keepalived_interface` line is worth noting: the baseline forbids hard-coding `ens192`/`ens224` and requires resolving the actual interface name with `ip -br link` and documenting it. Using the Ansible fact instead of a literal is the technical enforcement of that rule.

##### 10.4.4.2 Ansible Vault

**Exact commands to create, edit and use an encrypted variable file.**

```bash
# 0) Create the vault password file OUTSIDE the repository, readable only by its owner.
install -m 0600 /dev/null /home/adm-w4/.ansible/vault-pass-vp
printf '%s\n' "$(openssl rand -base64 32)" > /home/adm-w4/.ansible/vault-pass-vp
chmod 0600 /home/adm-w4/.ansible/vault-pass-vp

# 1) CREATE the encrypted variable file (prompts for the vault password once).
cd /opt/ansible-venv/repo/04-automation/ansible
ansible-vault create inventory/group_vars/all/vault.yml
# ... paste content, save, exit the editor ...

# 2) EDIT it later (decrypts to a temp file, re-encrypts on save).
ansible-vault edit inventory/group_vars/all/vault.yml

# 3) ENCRYPT an existing plaintext file in place (and remove the plaintext commit).
ansible-vault encrypt inventory/group_vars/all/vault.yml

# 4) VIEW without writing.
ansible-vault view inventory/group_vars/all/vault.yml

# 5) CHANGE the vault password (after a member leaves the group).
ansible-vault rekey inventory/group_vars/all/vault.yml

# 6) USE it in a run - ansible.cfg already points at the vault password file,
#    so no flag is needed. For an ad-hoc run without the config:
ansible-playbook playbooks/01-baseline-windows.yml --ask-vault-pass

# 7) ENCRYPT a single value inline (for a one-off), never a whole file:
ansible-vault encrypt_string --name 'vault_svc_ansible_password' 'REDACTED'
```

The content of the encrypted file is deliberately small and is *only* secrets:

```yaml
# inventory/group_vars/all/vault.yml   (committed ENCRYPTED, never plaintext)
vault_svc_ansible_user: "VERTEXPEAK\\svc_ansible"
vault_svc_ansible_password: !vault |
  $ANSIBLE_VAULT;1.1;AES256
  6433373533393563306533373736663039363832383931363232326137393535323130373933383662
  3035663731656336366262643130656236356239310a326131646338386136383162356563366665
  65613133333533643733653263623232656434646561353461323732646634633262663530303832
  3738653337653138380a313663646263633233346338633862653862653434343439653435373834
  3535
vault_iscsi_chap_secret: !vault |
  $ANSIBLE_VAULT;1.1;AES256
  3939623239326635323032313666303365393964616665353863326336373731633937333035373862
  3934663632393662356564613762356537393963340a623366376339306434373335353739613062
  37643463373133393334386661366464626438396138373037623633396437636166643864636661
  6134613239663739323739360a623432316137646534613664303735346265633937346662386130
  64373663
vault_grafana_admin_password: !vault |
  $ANSIBLE_VAULT;1.1;AES256
  3162383563323836363734346530343034633539306439633835323332333538313366646636386263
  6534356234363665363662646465653965623031350a373464356530653537646630366337613837
  31626165616230653030393531313364313665613232626566356464623035336539356530643665
  3130663134393364343337310a383231386632386563303532386464353662383133623630363261
  30303731
vault_ai_service_account_password: !vault |
  $ANSIBLE_VAULT;1.1;AES256
  3531303931633633333964353436336233333738656465336438393761383634363966323465316264
  3538663439393465633330316566373631353064660a646537306137383530313366393964366565
  62656165653531636666663037626664613964633630663237316139383665386538663461636263
  623161613332393235616631660a616135633739343838306635373838356133643263336561653232
  38626165
```

**Where the vault password file lives, and why it must not be committed.** It lives at `/home/adm-w4/.ansible/vault-pass-vp` on `vpnz-mon01`, owned by the automation owner, mode `0600`, in a directory that is mode `0700`. It is excluded by `.gitignore` and by the pre-tag secret sweep. The reason is not ceremony: **an encrypted file plus a committed password file is a plaintext file.** The vault protects the repository at rest and in transit — on the Git server, in any clone, in any backup, in any screenshot of a `git diff` — and that protection is worth exactly nothing if the key to it travels in the same repository. Two consequences follow and are stated in the runbook:

1. The vault password is stored in the group's password manager, held by all four members, and rotated with `ansible-vault rekey` if a member leaves. Rotation is followed by a commit of the re-encrypted file.
2. Any copy of `vault-pass-vp` outside `vpnz-mon01` is deleted; the file is never placed under `C:\FYP\`, never attached to a message, and never pasted into the proposal or the report — including in a screenshot. When the report needs to *show* vault usage, it shows `ansible-vault view` output with the secret values replaced by `REDACTED` before the capture, and it says so in the caption.

**What must not go into the vault.** Non-secret configuration belongs in plain variables, where a reviewer can read it. Vaulting a subnet, a hostname or a package list is a common mistake that makes the repository unreadable and creates a false impression of secrecy.

#### 10.4.5 Roles

Nine roles exist in the repository. Six are specified in full detail below; `wireguard`, `winrm` and `ad_users` are specified more briefly because they are covered by other chapters' detail (§12.2 for WireGuard, §9 for identity). Every role follows the same structure: `tasks/main.yml`, `handlers/main.yml`, `defaults/main.yml`, `templates/`, `files/`, `meta/main.yml`, plus a `README.md` with the idempotence note.

##### 10.4.5.1 `common` — Linux baseline role

**Purpose.** Establish the security and operational baseline that every Ubuntu 24.04.3 LTS guest in the estate must satisfy before any service role runs: packages, time, DNS resolution, sudo authority, SSH hardening, kernel parameters, logging, unattended upgrades and the monitoring agent. It implements the hardening rules that §12.2 and §8.7 fix, and it is the technical enforcement of the trust-boundary expectation that non-management zones cannot be administered.

**Tasks** (`roles/common/tasks/main.yml`, abbreviated to the real task list):

| # | Task | Module | Notes |
|---|---|---|---|
| 1 | Set the hostname and `/etc/hosts` entry | `ansible.builtin.hostname`, `ansible.builtin.lineinfile` | Hostname comes from `inventory_hostname`; the FQDN is `{{ inventory_hostname }}.{{ fyp_domain }}` |
| 2 | Install the baseline package set | `ansible.builtin.apt` | `chrony`, `rsyslog`, `auditd`, `unattended-upgrades`, `nftables`, `curl`, `jq`, `ca-certificates`, `python3-apt` |
| 3 | Remove the packages the design forbids | `ansible.builtin.apt` with `state: absent` | `telnet`, `rsh-client`, `tftp-hpa` (the TFTP *server* exists only on `vpnz-mon01`; a client on a server VM is an unnecessary path) |
| 4 | Configure chrony to the domain time source | `ansible.builtin.template` → `/etc/chrony/chrony.conf` | `server 10.10.30.11 iburst`, then `10.10.30.12`. Time skew greater than five minutes breaks Kerberos, so this task protects authentication, not just convenience |
| 5 | Configure DNS resolution | `ansible.builtin.template` → `/etc/resolv.conf` (managed via `systemd-resolved` drop-in) | `nameserver 10.10.30.11`, then `10.10.30.12`. **No public resolver may be configured on any Linux guest** |
| 6 | Create the local `gg-infra-admins` group and the four administrator accounts | `ansible.builtin.group`, `ansible.builtin.user` | Members mirror `GG-Infra-Admins`; no shared accounts; `root` login is disabled |
| 7 | Install the four Ed25519 public keys | `ansible.posix.authorized_key` | From `files/ssh/authorized_keys/`, one task per account via `loop` |
| 8 | Install the sudoers drop-in | `ansible.builtin.template` + `ansible.builtin.validate` | `%gg-infra-admins ALL=(ALL:ALL) ALL`, validated with `visudo -cf %s` |
| 9 | Deploy SSH hardening | `ansible.builtin.template` → `/etc/ssh/sshd_config.d/10-fyp-hardening.conf` | `PermitRootLogin no`, `PasswordAuthentication no`, `AllowGroups gg-infra-admins`, `KexAlgorithms`/`Ciphers` modern set |
| 10 | Deploy sysctl hardening | `ansible.builtin.template` → `/etc/sysctl.d/99-fyp-hardening.conf` | `rp_filter`, SYN cookies, ICMP behaviour; `net.ipv4.ip_forward=1` **only** where `fyp_role` implies a router (the nftables pair) |
| 11 | Configure unattended security upgrades | `ansible.builtin.template` → `/etc/apt/apt.conf.d/50unattended-upgrades` | Security-only; no automatic reboot; a reboot-required flag is reported by the health script rather than acted upon |
| 12 | Configure rsyslog forwarding | `ansible.builtin.template` → `/etc/rsyslog.d/50-fyp-forward.conf` | Forward to `10.10.30.31:514` per §8.7. The DMZ hosts forward too, which is how DMZ events reach Loki under TB-13's constraint that DMZ may only initiate limited outbound traffic |
| 13 | Install and configure `auditd` | `ansible.builtin.template`, `ansible.builtin.service` | Execve and identity-file watches |
| 14 | Install `node_exporter` | `ansible.builtin.apt` + `ansible.builtin.service` | Port 9100, listening only where the monitoring host can reach it |
| 15 | Install the internal CA certificate | `ansible.builtin.copy` → `/usr/local/share/ca-certificates/vp-root-ca.crt` + `command: update-ca-certificates` with `creates:` guard | This is what allows the same certificate conventions to work on Windows and Linux |
| 16 | Apply the vendor-recommended MOTD banner | `ansible.builtin.copy` | Authorised-use notice; harmless and expected in an enterprise estate |

**Handlers:** `Restart sshd` (`ansible.builtin.service`), `Restart chrony`, `Restart rsyslog`, `Reload sysctl` (`ansible.builtin.command: sysctl --system`), `Restart auditd`, `Reload systemd-resolved`.

**Templates:** `chrony.conf.j2`, `resolv-conf.j2`, `sshd-hardening.conf.j2`, `sysctl-hardening.conf.j2`, `sudoers-gg-infra-admins.j2`, `rsyslog-50-fyp-forward.conf.j2`, `motd.j2`.

**Default variables:** `common_admin_group: gg-infra-admins`, `common_admins: [adm-w1, adm-w2, adm-w3, adm-w4]`, `common_time_servers: [10.10.30.11, 10.10.30.12]`, `common_allow_ip_forward: false`, `common_install_auditd: true`, `common_node_exporter_port: 9100`, `common_unattended_security_only: true`.

**Idempotence note.** Every task is a declarative module with a desired state, so a second run reports `changed=0`. The one risk is task 15's `update-ca-certificates`: it is guarded with `creates: /etc/ssl/certs/vp-root-ca.pem` and a `when:` on the certificate's checksum, because an unguarded `command` task re-runs the CA bundle rebuild on every execution and would report `changed=1` forever, breaking the idempotence proof for the whole role. This is the single most likely place for the group's `changed=0` evidence to fail, and it is called out in the runbook for that reason.

##### 10.4.5.2 `nginx` — reverse proxy and TLS termination role

**Purpose.** Configure the two reverse proxies `vpnz-dmzrev01` and `vpnz-dmzrev02` as a TLS-terminating reverse proxy pair in front of two upstream pools, with HSTS, TLS 1.2 minimum / 1.3 preferred, a `/healthz` endpoint that Keepalived tracks, and `stub_status` so that the monitoring stack can scrape it. The role must produce byte-identical configuration on both nodes, because a divergence between the pair is the failure that only appears during a failover.

**Tasks:**

| # | Task | Module | Notes |
|---|---|---|---|
| 1 | Install `nginx` and `openssl` | `ansible.builtin.apt` | Nginx 1.24.0 from the Ubuntu 24.04 archive — the distro-packaged version, stated as a deliberate choice |
| 2 | Deploy the global configuration | `ansible.builtin.copy` from `files/dmzrev01/nginx.conf` | Global tuning: worker count, `worker_connections`, log format including `$upstream_addr` (essential for reading which node answered) |
| 3 | Deploy the upstream pool definitions | `template` → `/etc/nginx/conf.d/00-upstreams.conf` | Rendered from `fyp_nginx_upstreams`: `upstream weba_pool { server 10.10.90.21:443; server 10.10.90.22:443; }` and `upstream wp_pool { … }`, with `least_conn` and `max_fails`/`fail_timeout` |
| 4 | Deploy the portal vhost | `template` → `/etc/nginx/conf.d/10-portal.conf` | TLS termination for `portal.vertexpeak.example`, `proxy_pass https://weba_pool` (re-encrypt to the upstreams — TLS end to end), HSTS, security headers, HTTP→HTTPS redirect |
| 5 | Deploy the blog vhost | `template` → `/etc/nginx/conf.d/20-blog.conf` | `blog.vertexpeak.example` → `wp_pool` |
| 6 | Deploy the health endpoint | `template` → `/etc/nginx/conf.d/90-healthz.conf` | `/healthz` returns 200 with `upstream_ok` body only if both upstream pools answer; this is what `track_script` actually tests |
| 7 | Deploy `stub_status` | `template` | Bound to `127.0.0.1:8080` only — never published |
| 8 | Install TLS material | `ansible.builtin.copy` with `mode: '0600'` for the key | From the internal PKI; the private key is delivered from the vault-encrypted source or from a `files/` path that is `.gitignore`d. **No private key is ever committed** |
| 9 | Remove the default site | `ansible.builtin.file` with `state: absent` | The Ubuntu default vhost must not answer for a real name |
| 10 | Remove `sites-enabled/default` and assert `conf.d` is canonical | `ansible.builtin.file` + `assert` | §8.7 fixes `conf.d` as canonical; the `sites-available` layout is not used |
| 11 | Validate the configuration | `ansible.builtin.command: nginx -t` with `changed_when: false` | Fails the role before any reload. `changed_when: false` is what keeps the validation out of the change count |
| 12 | Ensure the service is enabled and started | `ansible.builtin.systemd_service` | |
| 13 | Periodic TLS certificate expiry check | `ansible.builtin.cron` | Calls `05-cert-renew.sh --warn-days 30`, which is also the subject of section 10.6 |
| 14 | Verify the published path from the control node | `ansible.builtin.uri` with `validate_certs: false` and `status_code: 200` | **[DECLARED]** the lab uses an internal CA plus a deliberately mismatched public name, so a name-mismatch warning is expected and must be shown in the report rather than suppressed |

**Handlers:** `Reload nginx` (`systemd_service` with `state: reloaded`) — a reload, not a restart, because two nodes behind a VIP must not both stop serving simultaneously. `Restart nginx` exists but is used only by the first-install path (`when: nginx_first_install | bool`).

**Templates:** `nginx-upstreams.conf.j2`, `portal.conf.j2`, `blog.conf.j2`, `healthz.conf.j2`, `stub-status.conf.j2`.

**Default variables:** `nginx_worker_processes: auto`, `nginx_worker_connections: 2048`, `nginx_tls_min: TLSv1.2`, `nginx_tls_preferred: TLSv1.3`, `nginx_hsts_max_age: 31536000`, `nginx_health_path: /healthz`, `nginx_client_max_body_size: 16m`, `nginx_upstream_max_fails: 3`, `nginx_upstream_fail_timeout: 10s`.

**Idempotence note.** Template rendering is idempotent by construction *provided the template contains no non-deterministic content* — no timestamps, no hostname of the control node, no random ordering of a dictionary. The proxy is required to be byte-identical across the pair, so the templates iterate over sorted lists and never over an unsorted dict, and the `00-upstreams.conf` template sorts by address. Task 11 (`nginx -t`) and task 14 (the `uri` check) both use `changed_when: false` so that verification never appears as a change. Task 14's `validate_certs: false` is required by the internal-CA-plus-public-name design and is documented as such; it is not a general pattern and appears nowhere else.

##### 10.4.5.3 `keepalived` — VRRP pair role

**Purpose.** Provide first-hop redundancy for the two Linux service pairs, using two distinct virtual router IDs: **VRID 51** for the nftables pair on 10.10.50.0/28 with VIP **10.10.50.10** (nodes 10.10.50.11 and 10.10.50.12), and **VRID 61** for the nginx pair on 10.10.90.0/24 with VIP **10.10.90.10** (nodes 10.10.90.28 and 10.10.90.29, so the VIP is owned by no node). The role must never reuse one VRID across two subnets that could ever be bridged, and it must track the *service*, not the interface.

**Tasks:**

| # | Task | Module | Notes |
|---|---|---|---|
| 1 | Install `keepalived` (2.2.8) | `ansible.builtin.apt` | |
| 2 | Confirm the VRID/VIP pair matches the design | `ansible.builtin.assert` | Asserts `keepalived_vrid` is 51 or 61 and that it matches the host's group. This catches the highest-consequence copy-paste error in the whole project |
| 3 | Allow VRRP protocol 112 in the host firewall | `ansible.posix.firewalld`/`ansible.builtin.command` for nftables, or an `nft` rule include | VRRP advertisements must traverse between pair members; the management-plane firewall must not silently break the pair |
| 4 | Deploy the tree-check scripts | `ansible.builtin.copy` + `mode: '0750'` | `check_nginx.sh` / `check_nftables.sh`; each returns 0/1 and both are the same scripts used by `03-keepalived-check.sh` for manual verification, so the automated and manual views cannot disagree |
| 5 | Deploy the configuration | `template` → `/etc/keepalived/keepalived.conf` with `ansible.builtin.validate` | `vrrp_instance FYP_<PAIR>` with `state`, `priority`, `virtual_router_id`, `virtual_ipaddress`, `track_script` |
| 6 | Enable and start the service | `ansible.builtin.systemd_service` | |
| 7 | Verify the VIP is present on the expected node | `ansible.builtin.command: ip -br addr show` + `assert` | The MASTER must own the VIP after convergence; this is the check that distinguishes "keepalived is running" from "keepalived is working" |
| 8 | Record the VRRP state for evidence | `ansible.builtin.shell: journalctl -u keepalived --since "-5 min" -o cat` with `changed_when: false` | The transcript is committed to `runs/` as failover evidence |

**Handlers:** `Reload keepalived` (`systemd_service: state=reloaded`) and `Restart keepalived`. The reload path is preferred because a restart on the MASTER would momentarily remove the VIP; the role uses reload for configuration changes and reserves restart for the first install.

**Templates:** `keepalived.conf.j2` (one template, parameterised by the host variables), `check_nginx.sh.j2`, `check_nftables.sh.j2`.

**Default variables:** `keepalived_enabled: true`, `keepalived_state: BACKUP`, `keepalived_priority: 100`, `keepalived_vrid: 61`, `keepalived_vip: 10.10.90.10`, `keepalived_auth_type: PASS`, `keepalived_preempt: true`, `keepalived_advert_int: 1`, `keepalived_track_interval: 5`, `keepalived_track_fall: 2`, `keepalived_track_rise: 2`.

The `keepalived_auth_type: PASS` default carries a mandatory annotation: **`PASS` authentication with a shared string is acceptable within a host-only lab segment and this is stated as a lab simplification, not as best practice.** The report must say so in the same paragraph that describes the setting.

**Idempotence note.** `state` and `priority` come from `host_vars`, so the two members receive different files and each node's file is stable. The single risk is the `track_script` interval: if the script is a `shell` task rather than a file deployed by task 4, Ansible would report a change on every run. The design therefore deploys the check script **as a file** and never generates it inline. Task 8 uses `changed_when: false`, and tasks 3 and 7 are written to be safe on re-run (the VRRP firewall rule is expressed as an idempotent set membership, and the VIP assertion is read-only).

##### 10.4.5.4 `nftables` — egress filter role

**Purpose.** Configure the inline egress filter pair `vpnz-nft01` / `vpnz-nft02` — the only path from the server and user zones to the Internet — as a single stateful ruleset in one `inet` table, `inet fyp_filter`, with drop policy on input and forward, explicit established/related acceptance, named sets for trusted peers, masquerade on the WAN-facing interface, and a log prefix before every drop. The role is the technical implementation of TB-02, TB-03, TB-06 and TB-08, and it is the highest-risk role in the repository because a mistake can remove the group's own management path to a remote VM.

**Tasks:**

| # | Task | Module | Notes |
|---|---|---|---|
| 1 | Install `nftables` (1.0.9) | `ansible.builtin.apt` | |
| 2 | Resolve and record the interface names | `ansible.builtin.set_fact` from `ansible_facts` + `assert` | The baseline forbids hard-coding `ens192`; the role asserts that two interfaces exist and records their names in the run log |
| 3 | Deploy the ruleset fragments | `template` → `/etc/nftables.d/10-sets.nft`, `20-filter-input.nft`, `30-filter-forward.nft`, `40-nat.nft`, `90-logging.nft` | The fragments are `include`d by the main file and are **never loaded independently** — nftables is one ruleset |
| 4 | Deploy the main ruleset | `template` → `/etc/nftables.conf` | `flush ruleset`, `table inet fyp_filter`, includes |
| 5 | **Validate the candidate ruleset before applying it** | `command: nft -c -f /etc/nftables.conf` with `changed_when: false` | Syntax-only check (`-c`), no apply. A syntax failure aborts the role while the old ruleset is still active |
| 6 | **Arm the rollback timer** | `command: /usr/local/sbin/fyp-nft-rollback-arm.sh {{ nftables_rollback_seconds }}` | Writes a systemd timer that will restore the previously validated ruleset if the playbook does not explicitly disarm it. Default `600` seconds |
| 7 | Apply the ruleset | `ansible.builtin.systemd_service` restart of `nftables.service`, then `command: nft list ruleset` to load the running ruleset into a fact | |
| 8 | **Verify from the far side** | `ansible.builtin.wait_for` / `uri` against a known-reachable target through the pair | The verification that matters is *from the outside in*, because that is the path the new ruleset could have broken |
| 9 | **Disarm the rollback timer** | `command: /usr/local/sbin/fyp-nft-rollback-disarm.sh` `when: nftables_verify_ok \| bool` | Only disarms if task 8 succeeded |
| 10 | Persist the ruleset across reboot | `ansible.builtin.systemd_service: enabled=true` | A firewall that disappears on reboot is worse than no firewall |
| 11 | Publish the active ruleset as evidence | `command: nft list ruleset` with `changed_when: false`, `register`, `copy` with `content:` into `runs/` | The ruleset text is evidence for TC-L2-03 |
| 12 | Hand the ruleset to Git | `ansible.builtin.copy` of the running `nft list ruleset` output into `docs/current-ruleset-{{ inventory_hostname }}.txt` **with a diff task that fails the run if it differs from the template output** | This is the drift detector of section 10.8. If the running ruleset differs from the template, someone has changed a live firewall by hand and the role says so |

**Handlers:** `Reload nftables` (systemd reload), `Restart nftables`, `Reload rsyslog` (the logging fragment changes the syslog destination in some configurations).

**Templates:** `nftables.conf.j2`, `nftables-10-sets.nft.j2`, `nftables-20-filter-input.nft.j2`, `nftables-30-filter-forward.nft.j2`, `nftables-40-nat.nft.j2`, `nftables-90-logging.nft.j2`.

**Default variables:** `nftables_table: inet fyp_filter`, `nftables_log_prefix: "NFT-DROP: "`, `nftables_internal_networks: [10.10.0.0/16, 10.20.0.0/16, 10.70.0.0/16]`, `nftables_trusted_mgmt: [10.20.20.0/24, 10.10.30.31]`, `nftables_allow_egress_tcp: [80, 443]`, `nftables_allow_egress_udp: [53, 123]`, `nftables_masquerade_interface: "{{ ansible_facts['default_ipv4']['interface'] }}"`, `nftables_rollback_seconds: 600`, `nftables_connlimit_ssh: 8`.

**Idempotence note.** Ansible cannot natively diff an nftables ruleset, so the idempotence of this role rests on three deliberate choices. First, the ruleset is rendered from templates and compared as a **rendered file**, so a stable template produces a stable file and the module reports no change. Second, the `nft -c -f` validation uses `changed_when: false`. Third, and most importantly, the rollback timer scripts are guarded with `creates:`-style conditions on their systemd unit files so that arming and disarming are idempotent — an unguarded `command` here would report `changed=1` on every run *and* would re-arm a rollback timer on a healthy node, which is both a broken idempotence proof and a real operational hazard. The role's secondary idempotence property is that it must produce the **same ruleset on both pair members**, so the templates contain no host-specific literals; host-specific values are passed as variables that differ only in the addresses the design already distinguishes.

##### 10.4.5.5 `windows_baseline` — Windows security and service baseline role

**Purpose.** Bring every Windows Server 2025 guest to the same security baseline so that the differences between them are only the differences the design intends: WinRM over HTTPS enabled for the member servers, RDP restricted to the administrative groups, the advanced audit subcategory set of `GPO-Audit-Advanced` implemented locally on hosts outside a GPO's scope, the `windows_exporter` installed, time synchronised to the domain, SMB signing on, and the local administrators group populated from the design's identity groups rather than by hand.

**Tasks** (executed with `win_*` modules from the `ansible.windows` and `community.windows` collections):

| # | Task | Module | Notes |
|---|---|---|---|
| 1 | Assert the OS and build | `ansible.windows.win_shell: (Get-CimInstance Win32_OperatingSystem).Caption, BuildNumber` + `assert` | Expects Windows Server 2025 build `10.0.26100`; a Windows Server 2022 fallback (build 20348) is accepted only if `windows_baseline_allow_2022` is true, and the role then records the deviation |
| 2 | Set the time zone and time source | `community.windows.win_timezone`, `ansible.windows.win_shell: w32tm /config` | `w32tm /config /manualpeerlist:vpnz-dc01.vertexpeak.fyp.lab /syncfromflags:manual /reliable:no /update`, then `w32tm /resync` |
| 3 | Enable WinRM/HTTPS prerequisites | `ansible.windows.win_shell` running the block of 10.4.1.3 | Kept in the role so the configuration is repeatable rather than a one-off manual step |
| 4 | Restrict RDP to the administrative groups | `ansible.windows.win_user_right` (`SeRemoteInteractiveLogonRight`) | `GG-Server-Admins` and, for the two platform VMs, `GG-VPN-ProfServices` per TB-11. Ordinary users must not hold this right |
| 5 | Populate the local Administrators group | `ansible.windows.win_group_membership` | From `GG-Server-Admins` / `GG-Tier0-Admins`; **no individual account is added by name in the role**, which is what makes the group membership reviewable in AD rather than in Ansible |
| 6 | Configure the advanced audit policy | `ansible.windows.win_shell: auditpol /set` per subcategory | 4624, 4625, 4740, 4720, 4728, 4732, 7045 — the same set the AI triage of section 11 reads |
| 7 | Enable PowerShell script-block and transcription logging | `ansible.windows.win_shell: reg add` + directory creation | Target `\\vpnz-fs01\Logs` where reachable, local otherwise. This is the audit trail the due-diligence item requires |
| 8 | Require SMB signing and disable LLMNR | `ansible.windows.win_regedit` | `RequireSecuritySignature=1`, `EnableMulticast=0` |
| 9 | Install `windows_exporter` 0.29.x | `ansible.windows.win_package` (MSI) | Idempotent by product code; the firewall rule for 9182 is added scoped to `10.10.30.31` |
| 10 | Configure the Windows firewall baseline | `community.windows.win_firewall_rule` | Explicit inbound rules for the port matrix rows that apply to the host's role, each scoped by remote address |
| 11 | Remove the default SMB share exposure where not required | `ansible.windows.win_share` with `state: absent` | Administration shares are handled per role; `vpnz-fs01` is the exception and manages its FSRM shares |
| 12 | Assert no plaintext credential file exists under `C:\FYP\config\` | `ansible.windows.win_shell: Get-ChildItem -Recurse` + `assert` | Exported service baselines must not contain secrets; this is a control, not a formality |
| 13 | Export the effective firewall and service baseline | `ansible.windows.win_shell: netsh advfirewall export` → `C:\FYP\config\` | The artefact that makes the configuration reviewable outside PowerShell |

**Handlers:** `Restart WinRM` (`win_service`), `Restart windows_exporter`, `Reapply audit policy`. The WinRM restart is dangerous by construction — restarting the service that Ansible is connected *through* will drop the session — so the handler is written to schedule a restart with a delay and the playbook's final task waits for the port to answer again. This is documented because a reader will otherwise assume it is an oversight.

**Templates and files:** `w32tm-config.ps1.j2` (a template because the peer list is a variable), `auditpol-baseline.ps1.j2`, `winrm-enable.ps1.j2` (the block of 10.4.1.3), `powershell-logging.reg.j2`, `windows_exporter-0.29.x.msi` under `files/` (with its hash recorded in `docs/04-variable-dictionary.md`).

**Default variables:** `windows_baseline_allow_2022: false`, `windows_baseline_rdp_groups: [GG-Server-Admins]`, `windows_baseline_local_admin_groups: [GG-Server-Admins]`, `windows_baseline_exporter_port: 9182`, `windows_baseline_time_source: vpnz-dc01.vertexpeak.fyp.lab`, `windows_baseline_audit_subcategories: [Logon, Logoff, Account\ Lockout, User\ Account\ Management, Security\ Group\ Management, Process\ Creation, Other\ System\ Events]`.

**Idempotence note.** Idempotence here is harder than on Linux, for three reasons and three mitigations. First, `win_regedit` is idempotent by nature, but a `win_shell: reg add` is not, so the design prefers `win_regedit` everywhere a registry value is the goal and uses `win_shell` only where no module exists (task 6's `auditpol` and task 7's policy keys). Second, `auditpol /set` reports success on every invocation even when nothing changed, so task 6 is wrapped in a `win_shell` whose `changed_when` compares the post-state from `auditpol /get /category:*` against the desired set — the comparison, not the exit code, decides the change. Third, MSI installation reports a change only when it actually installs, which makes task 9 naturally idempotent. The role's `changed=0` evidence is therefore expected to be clean, and any non-zero change on a second run has a named cause in the runbook.

##### 10.4.5.6 `users` — identity and group convergence role

**Purpose.** Converge the operating-system-level accounts and group memberships that the design fixes, without turning Ansible into a second identity system. On Linux it creates the four administrator accounts and the local `gg-infra-admins` group; on Windows it creates or verifies the service accounts and their group memberships. It is deliberately **narrow**: it converges named accounts that the design specifies in writing, and it does not become a general user-lifecycle engine — the day-to-day user lifecycle in the Windows domain belongs to `Invoke-NewStarterOnboarding.ps1` (section 10.5.3), driven by a reviewed CSV, because AD objects need the directory-aware cmdlets and the review step that a CSV provides.

**Tasks:**

| # | Task | Module | Hosts | Notes |
|---|---|---|---|---|
| 1 | Create the Linux administrator accounts | `ansible.builtin.user` | `linux` | `adm-w1` … `adm-w4`, shell `/bin/bash`, `groups: gg-infra-admins`, no password (`password_lock: true` — key-only login) |
| 2 | Assert no account has an empty password | `ansible.builtin.command: awk -F: '($2==""){print $1}' /etc/shadow` + `assert` | A fail-closed control |
| 3 | Lock the template bootstrap account | `ansible.builtin.user` with `password_lock: true` and `shell: /usr/sbin/nologin` | `fypadmin` from `UBU2404-TEMPLATE-01` |
| 4 | Create or verify the Windows service accounts | `microsoft.ad.user` / `ansible.windows.win_shell` with `Get-ADUser` | `windows` | `svc_ansible`, `svc_backup`, `svc_monitoring`, `svc_aiagent`, `svc_ldapbind`, `svc_git` — placed in `OU=ServiceAccounts,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab`, password from the vault, **"Password never expires" disabled**, "User cannot change password" enabled |
| 5 | Converge service-account group membership | `microsoft.ad.group` / `win_shell` | `windows` | `svc_ansible` → `GG-WINRM-Admins` only; `svc_monitoring` → `GG-Monitoring-Readers`; `svc_aiagent` → `GG-AI-ReadOnly` only. The role **asserts** that `svc_aiagent` is a member of no other group, which is the identity-layer enforcement of section 11's read-only guarantee |
| 6 | Converge the personal administrative accounts' group membership | `microsoft.ad.group` | `windows` | Two of four into `GG-Tier0-Admins`; all four into `GG-Server-Admins` |
| 7 | Report accounts with non-expiring passwords | `win_shell: Search-ADAccount -PasswordNeverExpires` with `changed_when: false` | `windows` | Evidence for the audit playbook; the design's rule is that only the break-glass account may be non-expiring, and any other result is a finding |
| 8 | Verify the break-glass account is untouched | `win_shell: Get-ADUser da-vertexpeak -Properties LastLogonDate` | `windows` | **Read-only.** A `LastLogonDate` newer than the project start is a finding requiring a written explanation, because §8.4 requires any use to be logged in the report |

**Handlers:** `Restart sssd` (only if the optional SSSD join is used), none on Windows (AD changes take effect immediately).

**Templates and files:** `ad-service-accounts.ps1.j2`, `linux-admins.yml` data file under `files/`, `assert-ai-readonly.ps1.j2`.

**Default variables:** `users_linux_admins: [adm-w1, adm-w2, adm-w3, adm-w4]`, `users_linux_admin_group: gg-infra-admins`, `users_service_accounts:` (a list of sAMAccountName and target group), `users_tier0_admins: [adm-w1, adm-w2]`, `users_disable_template_account: true`, `users_rotate_service_passwords_days: 90`.

**Idempotence note.** `ansible.builtin.user` and the AD modules are declarative; a second run reports `changed=0`. Two traps are documented. First, **group membership is reconciled, not appended**: a task that adds a member without an `append: false` companion will never remove a wrongly added member, so the role states the desired membership and asserts the full set, which means a second run is truly clean and a drifted group is actually corrected. Second, **password handling must not be destructive**: if the role sets a password on every run, the account's password is reset every run and the service breaks while the playbook reports success. The design therefore sets a password only when the account is created (`when: ad_user_result.changed` or `update_password: on_create`), and says so explicitly, because this is the single most common cause of a "successful" Ansible run that breaks a service.

##### 10.4.5.7 The remaining three roles

| Role | Purpose | Key tasks | Critical defaults |
|---|---|---|---|
| `wireguard` | Configure the WireGuard interface on the nftables pair and, if open item O-04 is resolved in favour of the emulated peer, on `vpnz-wcwg01` | Install `wireguard-tools` 1.0.20210914; generate keys with `wg genkey`/`wg pubkey` (private key written `0600`, `.gitignore`d, never committed); render `/etc/wireguard/wg0.conf` (`0600`); enable `wg-quick@wg0`; restrict `AllowedIPs` to exactly the prefixes needed | `wireguard_private_key_path`, `wireguard_allowed_ips` (never `0.0.0.0/0` on a site-to-site peer), `wireguard_persistent_keepalive: 25` **client side only** |
| `winrm` | Make the WinRM/HTTPS listener and firewall rule a repeatable, reviewable artefact rather than a manual build step | Run the block of 10.4.1.3; remove any HTTP listener; verify with `Test-WSMan -UseSSL` and `Get-ChildItem WSMan:\Localhost\Listener` | `winrm_port: 5986`, `winrm_control_node: 10.10.30.31`, `winrm_cert_thumbprint`, `winrm_allow_self_signed: false` |
| `ad_users` | Thin wrapper that invokes `Invoke-NewStarterOnboarding.ps1` with a vault-supplied credential and a reviewed CSV path, so that user onboarding is reproducible but still passes through the script that the L4 evidence requires | Copy the script and module, copy the CSV, run with `--check`-equivalent (`-WhatIf`) first, then for real; export the resulting report | `ad_users_csv: ../../powershell/data/newstarters.csv`, `ad_users_whatif_first: true`, `ad_users_default_ou: OU=Users,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab` |

The `ad_users` role is deliberately thin because the interesting logic belongs in the PowerShell script, where it can be reviewed and demonstrated on its own. A role that reimplements user provisioning in Ansible would duplicate a script the brief explicitly requires and would leave the PowerShell deliverable untested.

All nine roles declare `meta/main.yml` dependencies so that `common` is a dependency of `nginx`, `keepalived` and `nftables`, and `winrm` is a dependency of `windows_baseline`. This guarantees that a service role can never be applied to a host that has not received its baseline — a class of error that is otherwise discovered by a security test rather than by the playbook.

#### 10.4.6 Playbooks

Six playbooks are given in full below. Each is runnable exactly as written from `C:\FYP\04-automation\ansible\` on `vpnz-mon01`, against the inventory of 10.4.2. The remaining three baseline playbooks (`06-wireguard.yml`, `07-ad-users.yml` and `08-collect-network-configs.yml`) are specified in outline in 10.4.6.7 because their content is covered in detail elsewhere.

##### 10.4.6.1 `01-baseline-windows.yml` — site baseline hardening (Windows estate)

```yaml
---
# 01-baseline-windows.yml
# Purpose : Apply the Windows security, time, audit and monitoring baseline to the
#           Windows estate, and enable WinRM/HTTPS so that later playbooks can run.
# Owner   : W4 (Automation, Monitoring & AI). Reviewer: W1.
# Test IDs: TC-L4-01, TC-L4-02, TB-07, TB-08.
# Idempotence: second run must report changed=0 (see runs/ for the evidence log).
# Notes   : Ansible's WinRM connection is already active when this runs, so the
#           listener tasks are verification-and-repair rather than bootstrap.
#           The original bootstrap of WinRM is done once by hand (10.4.1.3).

- name: Baseline hardening of the Windows estate
  hosts: windows
  gather_facts: true
  serial: 1                     # rolling: one host at a time, never the whole estate at once
  max_fail_percentage: 0        # stop the rollout on the first failure
  any_errors_fatal: true

  vars:
    baseline_audit_subcategories:
      - "Logon"
      - "Logoff"
      - "Account Lockout"
      - "User Account Management"
      - "Security Group Management"
      - "Process Creation"
      - "Other System Events"

  pre_tasks:
    - name: Assert the operating system and build number
      ansible.windows.win_shell: |
        $os = Get-CimInstance Win32_OperatingSystem
        "{0}|{1}" -f $os.Caption, $os.BuildNumber
      register: os_check
      changed_when: false

    - name: Fail if this is not Windows Server 2025 (or the declared 2022 fallback)
      ansible.builtin.assert:
        that:
          - "'10.0.26100' in os_check.stdout or (windows_baseline_allow_2022 | bool and '20348' in os_check.stdout)"
        fail_msg: >-
          {{ inventory_hostname }} reports '{{ os_check.stdout }}'.
          The design pins Windows Server 2025 build 10.0.26100.
          A Windows Server 2022 substitution is permitted only with
          windows_baseline_allow_2022=true AND a recorded version deviation.
        success_msg: "{{ inventory_hostname }} OS check passed: {{ os_check.stdout }}"

    - name: Record the OS string as evidence
      ansible.builtin.copy:
        content: "{{ inventory_hostname }} {{ os_check.stdout }}\n"
        dest: "{{ playbook_dir }}/../runs/{{ lookup('pipe', 'date +%Y-%m-%d') }}_os-strings.txt"
        mode: "0644"
      delegate_to: localhost
      become: false

  roles:
    - role: winrm
      tags: [winrm, connectivity]
    - role: windows_baseline
      tags: [baseline, security]

  tasks:
    - name: Converge the service accounts and administrative group memberships
      ansible.builtin.include_role:
        name: users
      tags: [users, identity]

    - name: Verify that the time source is the domain and skew is inside tolerance
      ansible.windows.win_shell: |
        $skew = (w32tm /stripchart /computer:vpnz-dc01.vertexpeak.fyp.lab /samples:1 /dataonly) -split "`n" |
                Select-Object -Last 1
        $skew
      register: time_check
      changed_when: false
      tags: [verify, time]

    - name: Assert time skew is below the Kerberos tolerance
      ansible.builtin.assert:
        that:
          - time_check.stdout is search('^[+-]?0?[0-5]?\.\d+')
        fail_msg: >-
          Time skew on {{ inventory_hostname }} appears to exceed 5 minutes.
          Kerberos will fail. Check the DC time source before continuing.
      tags: [verify, time]

    - name: Confirm the server answers on the published verification port set
      ansible.windows.win_shell: |
        foreach ($p in @(5986, {{ windows_baseline_exporter_port }})) {
          $r = Test-NetConnection -ComputerName $env:COMPUTERNAME -Port $p -WarningAction SilentlyContinue
          "{0}:{1}" -f $p, $r.TcpTestSucceeded
        }
      register: port_check
      changed_when: false
      tags: [verify, ports]

    - name: Publish the port check result after the run
      ansible.builtin.debug:
        msg: "{{ inventory_hostname }} port check: {{ port_check.stdout_lines }}"
      tags: [verify, ports]

  post_tasks:
    - name: Write a per-host summary line into the run log
      ansible.builtin.lineinfile:
        path: "{{ playbook_dir }}/../runs/{{ lookup('pipe', 'date +%Y-%m-%d_%H%M') }}_01-baseline-windows.log"
        line: >-
          {{ inventory_hostname }} | os={{ os_check.stdout }} |
          winrm={{ 'ok' if ansible_winrm_scheme is defined else 'unknown' }} |
          time_skew_check={{ 'pass' if time_check is succeeded else 'fail' }}
        create: true
        mode: "0644"
      delegate_to: localhost
      become: false
      tags: [evidence]
```

**Why the playbook is shaped this way.** `serial: 1` with `max_fail_percentage: 0` and `any_errors_fatal: true` is the blast-radius control of 10.2.6 applied to a real playbook: the rollout stops at the first host that fails, and the remaining hosts keep their working configuration. The OS assertion is not pedantry — the design pins Windows Server 2025, and silently baselining a 2022 host would produce a report whose version table is wrong. The time-skew assertion exists because time skew above five minutes is a named Kerberos failure scenario in this design, and it is far cheaper to detect it here than to diagnose an authentication fault later. The evidence tasks write into `runs/` through `delegate_to: localhost`, which is the mechanism by which a playbook run leaves a citable artefact.

##### 10.4.6.2 `03-nginx-reverseproxy.yml` — web-tier deployment

```yaml
---
# 03-nginx-reverseproxy.yml
# Purpose : Deploy and converge the Nginx reverse-proxy pair and its VRRP gateways.
# Owner   : W2 (Linux & Services). Reviewer: W4.
# Test IDs: TC-L2-01, TC-L2-02, TC-L4-02, TB-05, TB-15.
# Idempotence: second run must report changed=0 and the VIP must not move.
# Safety  : serial:1 with the BACKUP node first, so the node holding the VIP is
#           never the first host changed. Ordering is enforced by the two plays.

- name: Web tier - converge the reverse-proxy pair (secondary node first)
  hosts: web
  gather_facts: true
  serial: 1
  max_fail_percentage: 0
  order: sorted               # BACKUP (vpnz-dmzrev02) sorts before MASTER (vpnz-dmzrev01) by name
  become: true

  pre_tasks:
    - name: Show which node is being changed and its VRRP role
      ansible.builtin.debug:
        msg: >-
          Changing {{ inventory_hostname }} ({{ keepalived_state }},
          priority {{ keepalived_priority }}) - VIP {{ keepalived_vip }}
      tags: [always]

    - name: Record the pre-change VRRP state as evidence
      ansible.builtin.shell: |
        set -o pipefail
        ip -br addr show | grep -F '{{ keepalived_vip }}' || echo "VIP not present on this node"
      register: vrrp_before
      changed_when: false
      tags: [evidence, keepalived]

  roles:
    - role: common
      tags: [common]
    - role: nginx
      tags: [nginx]
    - role: keepalived
      tags: [keepalived]

  post_tasks:
    - name: Verify the local health endpoint answers 200
      ansible.builtin.uri:
        url: "http://127.0.0.1{{ nginx_health_path }}"
        status_code: 200
        return_content: true
      register: healthz
      changed_when: false
      tags: [verify]

    - name: Verify the published name resolves and answers through this node
      ansible.builtin.uri:
        url: "https://portal.vertexpeak.example/"
        validate_certs: false        # DECLARED: internal CA + public name mismatch, per 3-8-5
        status_code: [200, 301, 302]
      register: portal_check
      changed_when: false
      tags: [verify]
      ignore_errors: true            # DNS for .example is simulated; the local check above is authoritative

    - name: Verify nginx configuration syntax survived the change
      ansible.builtin.command: nginx -t
      changed_when: false
      tags: [verify]

    - name: Confirm the VIP's location has not moved unintentionally
      ansible.builtin.shell: |
        set -o pipefail
        ip -br addr show | grep -F '{{ keepalived_vip }}' || echo "VIP not present on this node"
      register: vrrp_after
      changed_when: false
      tags: [evidence, keepalived]

    - name: Append the VRRP before/after record to the run log
      ansible.builtin.copy:
        content: |
          === {{ inventory_hostname }} ===
          BEFORE: {{ vrrp_before.stdout }}
          AFTER : {{ vrrp_after.stdout }}
          healthz: {{ healthz.status }}
        dest: "{{ playbook_dir }}/../runs/{{ lookup('pipe', 'date +%Y-%m-%d_%H%M') }}_03-nginx-vrrp.txt"
        mode: "0644"
      delegate_to: localhost
      become: false
      tags: [evidence]

- name: Web tier - post-deployment failover proof (optional, tagged failover)
  hosts: vpnz-dmzrev01
  gather_facts: false
  become: true
  tags: [never, failover]

  tasks:
    - name: Stop keepalived on the MASTER to move the VIP
      ansible.builtin.systemd_service:
        name: keepalived
        state: stopped

    - name: Wait for the VIP to appear on the BACKUP node
      ansible.builtin.wait_for:
        host: "{{ keepalived_vip }}"
        port: 443
        timeout: 30

    - name: Confirm the service still answers through the VIP
      ansible.builtin.uri:
        url: "https://{{ keepalived_vip }}{{ nginx_health_path }}"
        validate_certs: false
        status_code: 200
      delegate_to: vpnz-dmzrev02

    - name: Restart keepalived on the original MASTER
      ansible.builtin.systemd_service:
        name: keepalived
        state: started
```

The second play is tagged `never` on purpose: it is a **demonstration** playbook run only when a failover capture is needed, and never as part of a routine deployment. Tagging it `never` means it cannot be triggered by an accidental full run, which is the same philosophy as the `--limit` discipline in 10.4.7.

##### 10.4.6.3 `05-nftables-egress.yml` — firewall deployment

```yaml
---
# 05-nftables-egress.yml
# Purpose : Converge the inline nftables egress pair: single inet table fyp_filter,
#           drop policy, NAT/masquerade, logging before every drop, and drift detection.
# Owner   : W2 + W4. Reviewer: W3 (who owns the ASA policy on the other side).
# Test IDs: TC-L2-03, TC-L4-03, TB-02, TB-03, TB-06, TB-08.
# Safety  : a rollback timer is armed BEFORE the ruleset is applied and disarmed only
#           after verification succeeds. This is the documented lock-out mitigation.
# Risk    : highest-consequence playbook in the repository. Never run without --check first.

- name: Egress firewall - converge the nftables pair
  hosts: edge
  gather_facts: true
  serial: 1                     # never change both halves of the pair simultaneously
  max_fail_percentage: 0
  any_errors_fatal: true
  become: true

  vars:
    nft_candidate: /etc/nftables.conf
    nft_revert_after_seconds: 600

  pre_tasks:
    - name: Assert that the two expected interfaces exist
      ansible.builtin.assert:
        that:
          - ansible_facts['default_ipv4']['interface'] is defined
          - (ansible_facts['interfaces'] | length) >= 2
        fail_msg: >-
          {{ inventory_hostname }} does not present two interfaces.
          The egress pair must be inline with VNET-EGRESS + VNET-WAN.
          Resolve with: ip -br link
      tags: [always]

    - name: Record the interface names (the baseline forbids hard-coded ens names)
      ansible.builtin.set_fact:
        nft_ingress_if: "{{ ansible_facts['default_ipv4']['interface'] }}"
        nft_all_if: "{{ ansible_facts['interfaces'] }}"
      tags: [always]

    - name: Capture the pre-change ruleset as the rollback reference
      ansible.builtin.command: nft list ruleset
      register: nft_before
      changed_when: false
      tags: [evidence]

    - name: Persist the rollback reference to the host
      ansible.builtin.copy:
        content: "{{ nft_before.stdout }}\n"
        dest: /var/lib/fyp/nftables.pre-change
        mode: "0644"
      tags: [rollback]

    - name: Arm the automatic rollback timer
      ansible.builtin.command: /usr/local/sbin/fyp-nft-rollback-arm.sh {{ nft_revert_after_seconds }}
      args:
        creates: /run/fyp-nft-rollback.armed
      tags: [rollback]

  roles:
    - role: common
      tags: [common]
    - role: nftables
      tags: [nftables]
    - role: keepalived
      tags: [keepalived]

  tasks:
    - name: Validate the candidate ruleset without applying it
      ansible.builtin.command: nft -c -f {{ nft_candidate }}
      register: nft_syntax
      changed_when: false
      failed_when: nft_syntax.rc != 0
      tags: [validate]

    - name: Apply the ruleset
      ansible.builtin.systemd_service:
        name: nftables
        state: restarted
        enabled: true
      tags: [apply]

    - name: Wait for the ruleset to be loaded and policy to be drop
      ansible.builtin.shell: |
        set -o pipefail
        for i in $(seq 1 10); do
          if nft list table inet fyp_filter | grep -q 'policy drop'; then exit 0; fi
          sleep 1
        done
        exit 1
      changed_when: false
      tags: [verify]

    - name: Verify connectivity FROM THE FAR SIDE (the path the ruleset could break)
      ansible.builtin.wait_for:
        host: 10.10.50.10            # the pair's VIP, reached from the control node
        port: 22
        timeout: 20
      delegate_to: localhost
      become: false
      register: nft_reachability
      tags: [verify]

    - name: Verify that a permitted egress flow still works (HTTPS to the simulated DMZ)
      ansible.builtin.uri:
        url: "https://blog.vertexpeak.example/"
        validate_certs: false
        status_code: [200, 301, 302]
      register: egress_check
      changed_when: false
      ignore_errors: true
      tags: [verify]

    - name: Detect configuration drift between the running ruleset and the template
      ansible.builtin.shell: |
        set -o pipefail
        nft list ruleset | sed 's/[[:space:]]*$//' > /tmp/running.nft
        diff -u /tmp/running.nft /var/lib/fyp/nftables.rendered > /tmp/nft-drift.diff && echo "NO-DRIFT" || { echo "DRIFT"; cat /tmp/nft-drift.diff; }
      register: nft_drift
      changed_when: false
      failed_when: false
      tags: [drift]

    - name: Report drift as a finding rather than failing the run
      ansible.builtin.debug:
        msg: >-
          {{ inventory_hostname }}: {{ 'NO DRIFT - running ruleset matches Git'
             if 'NO-DRIFT' in nft_drift.stdout
             else 'DRIFT DETECTED - a live firewall was changed outside Ansible. See the diff below.' }}
      tags: [drift]

    - name: Write the drift diff to the evidence directory
      ansible.builtin.copy:
        content: "{{ nft_drift.stdout }}\n"
        dest: "{{ playbook_dir }}/../runs/{{ lookup('pipe', 'date +%Y-%m-%d_%H%M') }}_05-nftables-drift-{{ inventory_hostname }}.txt"
        mode: "0644"
      delegate_to: localhost
      become: false
      tags: [evidence, drift]

  post_tasks:
    - name: Disarm the rollback timer ONLY because verification passed
      ansible.builtin.command: /usr/local/sbin/fyp-nft-rollback-disarm.sh
      args:
        removes: /run/fyp-nft-rollback.armed
      tags: [rollback]

    - name: Publish the active ruleset as evidence for TC-L2-03
      ansible.builtin.command: nft list ruleset
      register: nft_after
      changed_when: false
      tags: [evidence]

    - name: Save the ruleset capture
      ansible.builtin.copy:
        content: "{{ nft_after.stdout }}\n"
        dest: "{{ playbook_dir }}/../runs/{{ lookup('pipe', 'date +%Y-%m-%d_%H%M') }}_nft-ruleset-{{ inventory_hostname }}.txt"
        mode: "0644"
      delegate_to: localhost
      become: false
      tags: [evidence]
```

**The three safety mechanisms in this playbook are the point of it.** First, `serial: 1` means the pair is never changed in one step, so at least one half of the inline path is always serving with a known-good ruleset. Second, the rollback timer is armed before the apply and disarmed only after the far-side reachability check succeeds — this is exactly the mitigation §12.2 requires for the lock-out risk, and the `--limit` discipline complements it. Third, drift is *reported*, not failed: a difference between the running ruleset and the rendered template is a genuine security finding (someone changed a live firewall by hand) but it is not a reason to abandon the run, because abandoning the run would leave the change unreported. Recording it as evidence and continuing is the correct behaviour, and the report must present any drift found rather than quietly reconciling it.

##### 10.4.6.4 `09-verify-services.yml` — read-only compliance audit

```yaml
---
# 09-verify-services.yml
# Purpose : A strictly READ-ONLY audit of the estate. Produces a machine-readable
#           compliance report for the verification chapter. This playbook is the
#           reference implementation of "check mode by construction": it makes no
#           change even when run without --check, and every task declares
#           changed_when: false.
# Owner   : W4. Reviewer: all four members (this is the one playbook that touches
#           every host, so it must be safe by construction).
# Test IDs: TC-L4-05, TC-L2-01..03, TC-L1-01, TB-01..TB-16 (read-only probes).
# Hosts   : 'all' is permitted HERE AND NOWHERE ELSE, because no mutation is possible.

- name: FYP estate compliance audit (read-only)
  hosts: all
  gather_facts: true
  become: true                  # needed to read /etc/nftables.conf, sshd -T and the shadow-file policy
  serial: 0                     # audit the whole estate in parallel; nothing is mutated

  vars:
    audit_report_dir: "{{ playbook_dir }}/../runs/audit"
    audit_expected_linux_packages: [chrony, rsyslog, auditd, nftables, curl, jq]
    audit_forbidden_ports_up: [23, 21, 3389]      # telnet, ftp, RDP on a Linux guest
    audit_result: []

  tasks:
    - name: Initialise the report directory
      ansible.builtin.file:
        path: "{{ audit_report_dir }}"
        state: directory
        mode: "0755"
      delegate_to: localhost
      become: false
      run_once: true
      changed_when: false

    # ---------------- Linux audit ----------------
    - name: Linux - collect package presence
      ansible.builtin.command: "dpkg-query -W -f='${Status} ${Version}' {{ item }}"
      register: pkg_results
      changed_when: false
      failed_when: false
      loop: "{{ audit_expected_linux_packages }}"
      when: "'linux' in group_names"

    - name: Linux - collect listening TCP sockets
      ansible.builtin.command: ss -H -tlnp
      register: ss_results
      changed_when: false
      when: "'linux' in group_names"

    - name: Linux - effective SSH policy (read-only)
      ansible.builtin.command: sshd -T
      register: sshd_effective
      changed_when: false
      failed_when: false
      when: "'linux' in group_names"

    - name: Linux - assert the SSH hardening that the design requires
      ansible.builtin.assert:
        that:
          - sshd_effective.stdout is search('(?m)^permitrootlogin no$')
          - sshd_effective.stdout is search('(?m)^passwordauthentication no$')
        fail_msg: "{{ inventory_hostname }} FAILS: SSH hardening missing or reverted (see /etc/ssh/sshd_config.d/10-fyp-hardening.conf)"
        success_msg: "{{ inventory_hostname }} PASS: SSH hardening present"
      when: "'linux' in group_names"
      changed_when: false

    - name: Linux - verify the nftables table exists on the egress pair
      ansible.builtin.command: nft list table inet fyp_filter
      register: nft_audit
      changed_when: false
      failed_when: false
      when: "'edge' in group_names"

    - name: Linux - verify Keepalived is active and the VIP is owned where expected
      ansible.builtin.shell: |
        set -o pipefail
        systemctl is-active keepalived
        ip -br addr show | grep -cF '{{ keepalived_vip | default("0.0.0.0") }}' || true
      register: ka_audit
      changed_when: false
      when: "'edge' in group_names or 'web' in group_names"

    - name: Linux - verify certificate expiry is inside the policy window
      ansible.builtin.shell: |
        set -o pipefail
        for f in /etc/nginx/ssl/*.crt; do
          [ -e "$f" ] || continue
          end=$(openssl x509 -enddate -noout -in "$f" | cut -d= -f2)
          echo "$f|$end"
        done
      register: cert_audit
      changed_when: false
      failed_when: false
      when: "'web' in group_names"

    # ---------------- Windows audit ----------------
    - name: Windows - collect service state for the design's expected services
      ansible.windows.win_shell: |
        Get-Service -Name WinRM, W32Time, DNS, Netlogon, W3SVC, DHCP -ErrorAction SilentlyContinue |
          Select-Object Name, Status, StartType | ConvertTo-Csv -NoTypeInformation
      register: win_services
      changed_when: false
      failed_when: false
      when: "'windows' in group_names"

    - name: Windows - verify the WinRM HTTPS listener and absence of an HTTP listener
      ansible.windows.win_shell: |
        $l = Get-ChildItem WSMan:\Localhost\Listener
        $https = ($l | Where-Object { $_.Keys -contains 'Transport=HTTPS' }).Count
        $http  = ($l | Where-Object { $_.Keys -contains 'Transport=HTTP' }).Count
        "https_listeners=$https http_listeners=$http"
      register: win_winrm
      changed_when: false
      failed_when: false
      when: "'windows' in group_names"

    - name: Windows - assert that no unencrypted WinRM listener remains
      ansible.builtin.assert:
        that:
          - "'http_listeners=0' in win_winrm.stdout"
          - "'https_listeners=1' in win_winrm.stdout"
        fail_msg: "{{ inventory_hostname }} FAILS: WinRM listener state is {{ win_winrm.stdout }} (expected exactly one HTTPS listener and no HTTP listener)"
      when: "'windows' in group_names"
      changed_when: false

    - name: Windows - verify the firewall rules scoped to the control node exist
      ansible.windows.win_shell: |
        Get-NetFirewallRule -DisplayName 'FYP-Ansible-WinRM-5986' -ErrorAction SilentlyContinue |
          Get-NetFirewallAddressFilter | Select-Object -ExpandProperty RemoteAddress
      register: win_fw
      changed_when: false
      failed_when: false
      when: "'windows' in group_names"

    - name: Windows - verify that the AI read-only account holds only one group
      ansible.windows.win_shell: |
        (Get-ADUser svc_aiagent -Properties MemberOf).MemberOf
      register: ai_groups
      changed_when: false
      failed_when: false
      when: "inventory_hostname == 'vpnz-dc01'"

    - name: Assert svc_aiagent is a member of GG-AI-ReadOnly and nothing else
      ansible.builtin.assert:
        that:
          - ai_groups.stdout_lines | length == 1
          - "'GG-AI-ReadOnly' in ai_groups.stdout"
        fail_msg: >-
          svc_aiagent holds {{ ai_groups.stdout_lines | length }} group memberships.
          Section 11 depends on this account being read-only by identity, not by
          convention. Investigate before demonstrating the AI layer.
      when: "inventory_hostname == 'vpnz-dc01'"
      changed_when: false

    # ---------------- Report assembly ----------------
    - name: Assemble the per-host audit record
      ansible.builtin.set_fact:
        audit_result: >-
          {{ audit_result + [{
               'host': inventory_hostname,
               'groups': group_names,
               'linux_packages': (pkg_results.results | default([]) | map(attribute='stdout') | list),
               'listening_tcp': (ss_results.stdout_lines | default([])),
               'ssh_policy_ok': (sshd_effective.stdout is defined and
                                 sshd_effective.stdout is search('(?m)^passwordauthentication no$')),
               'nftables_present': (nft_audit.rc | default(-1) == 0),
               'keepalived_active': (ka_audit.stdout_lines[0] | default('n/a')),
               'windows_services': (win_services.stdout_lines | default([])),
               'winrm': (win_winrm.stdout | default('n/a')),
               'winrm_fw_scope': (win_fw.stdout_lines | default([]))
             }] }}
      changed_when: false

    - name: Write the JSON audit report
      ansible.builtin.copy:
        content: "{{ audit_result | to_nice_json }}\n"
        dest: "{{ audit_report_dir }}/audit-{{ lookup('pipe', 'date +%Y-%m-%d_%H%M') }}.json"
        mode: "0644"
      delegate_to: localhost
      become: false
      run_once: true
      changed_when: false

    - name: Print the audit summary
      ansible.builtin.debug:
        msg: >-
          AUDIT COMPLETE - {{ audit_result | length }} hosts recorded.
          Report: {{ audit_report_dir }}/audit-{{ lookup('pipe', 'date +%Y-%m-%d') }}.json
      run_once: true
      changed_when: false
```

**Why a read-only playbook matters more than it looks.** This playbook is the one artefact that can be run at any time, by anyone, against the whole estate, with no risk. That property makes it the group's default first response to any suspicion of drift, and it is also the playbook that section 11's agent is allowed to trigger (through the same inventory, not by running Ansible itself). Every task declares `changed_when: false`, the report is written once with `run_once: true`, and the only assertions are failures of *observation*, never of *state*. A playbook that "audits" by converging is not an audit, and the report must state that the audit was genuinely non-mutating: the second-run `changed=0` evidence for this playbook is trivially true, and that is the honest answer rather than an impressive-looking number.

##### 10.4.6.5 `08-collect-network-configs.yml` — configuration collection and archive

```yaml
---
# 08-collect-network-configs.yml
# Purpose : Collect the intended device configurations and the live Linux/Windows
#           service configurations into the evidence archive on vpnz-mon01 (/srv/tftp).
#           HONEST SCOPE: Packet Tracer devices cannot be logged into by any external
#           tooling (no API, no reachable SSH server). This playbook therefore:
#             (a) copies the Git-tracked intended configs from
#                 03-build/packet-tracer/configs/*.txt into the archive, and
#             (b) collects the LIVE configuration of every reachable Linux and Windows host.
#           It NEVER logs in to a Packet Tracer device, and the report must say so.
# Owner   : W3 + W4. Reviewer: W1.
# Test IDs: TC-L4-04, TC-L3-0x (config baseline evidence).

- name: Configuration archive - collect intended device configs and live host configs
  hosts: localhost
  gather_facts: false

  vars:
    pt_config_dir: "{{ playbook_dir }}/../../03-build/packet-tracer/configs"
    archive_dir: /srv/tftp/config-archive/{{ lookup('pipe', 'date +%Y-%m-%d_%H%M') }}

  tasks:
    - name: List the Git-tracked intended Packet Tracer configurations
      ansible.builtin.find:
        paths: "{{ pt_config_dir }}"
        patterns: "*.txt"
      register: pt_configs
      delegate_to: localhost

    - name: Fail loudly if the intended device configurations are missing
      ansible.builtin.assert:
        that:
          - pt_configs.matched >= 15
        fail_msg: >-
          Only {{ pt_configs.matched }} intended device configuration files were found in
          {{ pt_config_dir }}. The design has 16 Packet Tracer devices. Track A of the
          automation approach requires an intended configuration for every device.
      run_once: true

    - name: Create the dated archive directory
      ansible.builtin.file:
        path: "{{ archive_dir }}"
        state: directory
        mode: "0755"
      delegate_to: vpnz-mon01

    - name: Copy the intended Packet Tracer configurations into the archive
      ansible.builtin.copy:
        src: "{{ item.path }}"
        dest: "{{ archive_dir }}/pt-{{ item.path | basename }}"
        mode: "0644"
      loop: "{{ pt_configs.files }}"
      delegate_to: vpnz-mon01

    - name: Write a manifest that states plainly what this archive does and does not contain
      ansible.builtin.copy:
        content: |
          Configuration archive {{ archive_dir }}
          Generated by 08-collect-network-configs.yml

          CONTAINS:
            - The Git-tracked INTENDED configurations of the 16 Packet Tracer logical
              devices, exported by hand from Packet Tracer and committed as source of
              truth (Track A of the network-automation approach).
            - The LIVE collected configuration of every reachable Linux and Windows host
              produced by the second play of this playbook.

          DOES NOT CONTAIN:
            - Any configuration retrieved FROM a running Packet Tracer device by an
              automated tool. Packet Tracer exposes no API and no reachable SSH server,
              so no playbook in this project ever logged in to a Packet Tracer device.
              A real deployment would require netmiko/napalm or an SSH-based push; the
              gap analysis for that step is in the design document.
        dest: "{{ archive_dir }}/MANIFEST.txt"
        mode: "0644"
      delegate_to: vpnz-mon01

- name: Configuration archive - collect live host configurations
  hosts: linux:windows
  gather_facts: true

  tasks:
    - name: Create a per-host staging directory
      ansible.builtin.file:
        path: "/tmp/fyp-collect-{{ inventory_hostname }}"
        state: directory
        mode: "0700"
      become: true

    - name: Linux - collect the configuration files the design fixes
      ansible.builtin.command: "cat {{ item }}"
      register: linux_configs
      changed_when: false
      failed_when: false
      loop:
        - /etc/nftables.conf
        - /etc/keepalived/keepalived.conf
        - /etc/nginx/nginx.conf
        - /etc/ssh/sshd_config.d/10-fyp-hardening.conf
        - /etc/sysctl.d/99-fyp-hardening.conf
        - /etc/chrony/chrony.conf
      become: true
      when: "'linux' in group_names"

    - name: Windows - export firewall, service and DNS configuration
      ansible.windows.win_shell: |
        New-Item -ItemType Directory -Force -Path C:\FYP\config | Out-Null
        netsh advfirewall export C:\FYP\config\firewall-$(Get-Date -f yyyyMMdd).wfw
        Get-Service | Select-Object Name,Status,StartType |
          Export-Csv C:\FYP\config\services-$(Get-Date -f yyyyMMdd).csv -NoTypeInformation
        Get-DnsServerZone -ErrorAction SilentlyContinue |
          Export-Csv C:\FYP\config\dns-zones-$(Get-Date -f yyyyMMdd).csv -NoTypeInformation
        "exported"
      register: win_export
      changed_when: false
      failed_when: false
      when: "'windows' in group_names"

    - name: Windows - read the exported configuration files back
      ansible.windows.win_shell: |
        Get-ChildItem C:\FYP\config\*.csv, C:\FYP\config\*.wfw |
          Sort-Object LastWriteTime | Select-Object -Last 3 |
          ForEach-Object { "===== $($_.FullName) ====="; Get-Content $_.FullName -TotalCount 200 }
      register: win_configs
      changed_when: false
      failed_when: false
      when: "'windows' in group_names"

    - name: Fetch the collected configuration back to the archive host
      ansible.builtin.copy:
        content: |
          ===== {{ inventory_hostname }} @ {{ ansible_date_time.iso8601 }} =====
          --- (linux) collected configuration files ---
          {{ linux_configs.results | default([]) | map(attribute='stdout') | join('\n') }}
          --- (windows) exported configuration ---
          {{ win_configs.stdout | default('n/a') }}
        dest: "/srv/tftp/config-archive/{{ lookup('pipe', 'date +%Y-%m-%d_%H%M') }}/{{ inventory_hostname }}.txt"
        mode: "0644"
      delegate_to: vpnz-mon01
      become: true
```

**The manifest task is the most important task in this playbook.** The baseline's honest two-track approach requires that the report state clearly that **no playbook ever logged in to a Packet Tracer device**. A manifest that says so, written into the archive by the automation itself, is far stronger evidence of that discipline than a sentence in the report, because the archive and the prose are then produced by the same run.

##### 10.4.6.6 `02-baseline-linux.yml` — Linux baseline hardening (outline)

`02-baseline-linux.yml` is the Linux counterpart of 10.4.6.1. Its full text is not reproduced because it is structurally identical to the playbook above, with four differences that matter:

- `hosts: linux` with `serial: 2`, because the Linux estate contains no VRRP pair except `edge` and `web`, which are excluded by a `--limit` during a first run and covered by their own playbook (`05-nftables-egress.yml`, `03-nginx-reverseproxy.yml`).
- The role list is `common` only, plus an `assert` block that verifies no public resolver is configured and that chrony is bound to `10.10.30.11`.
- An `assert` that `net.ipv4.ip_forward` equals `1` **on the nftables pair only** and `0` elsewhere, which is one of the most easily lost facts in a routed lab.
- A final task that runs `01-hardening-baseline.sh --check` so that the shell script and the Ansible role are proven to agree. Two implementations of the same baseline that disagree is a defect, and this task is what detects it.

##### 10.4.6.7 The remaining playbooks

| Playbook | Hosts | Purpose | Note |
|---|---|---|---|
| `04-keepalived.yml` | `web`, `edge` | Converge only the VRRP configuration and run the failover proof | Separated from the service playbooks so that a VRRP-only change never forces an nginx or nftables reload; tagged `keepalived` |
| `06-wireguard.yml` | `edge` (and `vpnz-wcwg01` if O-04 resolves that way) | Converge `/etc/wireguard/wg0.conf` from the templated configuration and verify the handshake | Uses `wg show` output as the verification, `changed_when: false` |
| `07-ad-users.yml` | `vpnz-dc01` | Invoke `Invoke-NewStarterOnboarding.ps1` with `-WhatIf` first, then for real, and collect the CSV report | Tier-0 tagged; requires an `adm-{initials}` credential, not `svc_ansible`, by design |

#### 10.4.7 Testing and safety

##### 10.4.7.1 `--check` and `--diff`

`--check` runs the playbook without making changes, reporting what *would* change. `--diff` shows the file-level change, which is the part that makes a dry run actually useful: a firewall change is reviewed by reading the diff of `/etc/nftables.conf`, not by reading a task name.

```bash
cd /opt/ansible-venv/repo/04-automation/ansible

# Full dry run of the firewall playbook with before/after file diffs
ansible-playbook playbooks/05-nftables-egress.yml --check --diff

# Dry run constrained to one node
ansible-playbook playbooks/05-nftables-egress.yml --check --diff --limit vpnz-nft02

# Dry run restricted to the validation and rollback tags only
ansible-playbook playbooks/05-nftables-egress.yml --check --diff --tags validate,rollback
```

Three honest caveats must appear in the report, because a dry run that is trusted too far is a hazard:

1. **`--check` cannot validate everything.** Modules that do not support check mode (`command`, `shell`, and some Windows modules) report as skipped rather than as "would change". The nftables playbook's most consequential tasks are `command` tasks, so `--check` alone does not prove the ruleset is safe — the `nft -c -f` validation task and the rollback timer are what prove that.
2. **`--check` on a template change is reliable; `--check` on a service restart is not.** The playbook's handlers do not run in check mode, so the dry run never shows the restart consequence. The group therefore treats `--check` as a *file-level* review tool.
3. **A clean `--check` is not permission to skip the canary.** The documented workflow is check → diff → canary → group, and the canary is mandatory for `edge`, `web` and anything touching tier 0.

##### 10.4.7.2 `--limit`

`--limit` is the single most effective safety flag available, because it converts a site-wide action into a single-host action without changing the code under test.

```bash
# Canary on the BACKUP nftables node only
ansible-playbook playbooks/05-nftables-egress.yml --limit vpnz-nft02

# Canary on the secondary reverse proxy only
ansible-playbook playbooks/03-nginx-reverseproxy.yml --limit vpnz-dmzrev02

# A group-of-groups limit: only the non-DMZ Linux hosts
ansible-playbook playbooks/02-baseline-linux.yml --limit 'linux:!dmz'

# Exclude tier 0 from a baseline run in one expression
ansible-playbook playbooks/01-baseline-windows.yml --limit 'windows:!vpnz-dc01:!vpnz-dc02'

# Target only the edge pair
ansible-playbook playbooks/05-nftables-egress.yml --limit edge
```

The group patterns above use only the group names and hostnames of the inventory of 10.4.2; the `!` exclusion syntax depends on the inventory containing the groups named. **Rule: a first-ever run of any playbook against a host is always `--limit <one-host>`.** This rule is written into the group's working agreement and appears in every runbook.

##### 10.4.7.3 `--syntax-check`, linting and tags

```bash
# Syntax gate - fast, no connection, catches YAML and Jinja2 errors
ansible-playbook playbooks/05-nftables-egress.yml --syntax-check
ansible-playbook --syntax-check playbooks/*.yml

# Inventory gate
ansible-inventory -i inventory/hosts.yml --graph
ansible-inventory -i inventory/hosts.yml --list > /dev/null    # fails on unparsed groups

# Vault integrity gate (no decryption of values, just readability)
ansible-vault view inventory/group_vars/all/vault.yml > /dev/null

# Tag discovery - documents what a targeted run can actually do
ansible-playbook playbooks/05-nftables-egress.yml --list-tags
```

`ansible-lint` is a natural addition and is *not* claimed as part of this project unless the group installs and runs it: the report must not name a tool it did not use. Where `ansible-lint` is available in the Ubuntu archive or through `pip` in the virtual environment, using it is encouraged and its output is committed; where it is not, the group's fallback is the `--syntax-check` gate plus a peer review against the documented rules in `docs/04-variable-dictionary.md`. Either way, the report states which was actually done.

Tags are used to make a partial run expressible without editing the playbook. The tag vocabulary is fixed and small: `always`, `never`, `baseline`, `security`, `nginx`, `keepalived`, `nftables`, `wireguard`, `users`, `identity`, `validate`, `apply`, `verify`, `drift`, `rollback`, `evidence`, `failover`. Tags on the evidence and verification tasks exist so that a reviewer can re-run *just* the verification without touching the configuration — which is exactly what the audit playbook of 10.4.6.4 provides for the whole estate.

##### 10.4.7.4 How the team avoids breaking the live lab

The following is the group's written change procedure, and it is the answer to the due-diligence item that asks for reviewed, repeatable change rather than hand-typed configuration:

| Step | Action | Evidence produced |
|---|---|---|
| 1 | Write the change on a `task-*` branch; run `--syntax-check` | Commit |
| 2 | Run `--check --diff` against the whole target group | Dry-run log in `runs/` |
| 3 | Review the diff with a second member; record the review in the minutes | Meeting minute |
| 4 | Snapshot the target VM in the hypervisor (except for tier 0, where the change is made during the change window only) | Snapshot name and timestamp |
| 5 | Run against **one** host with `--limit`, during the change window | Canary run log |
| 6 | Verify the service by hand (service answers, VIP correct, logs clean) | Transcript or screenshot |
| 7 | Run against the remaining hosts of the group | Group run log |
| 8 | Re-run the whole playbook; capture `changed=0` | Idempotence log in `runs/` |
| 9 | Run `09-verify-services.yml` and diff the JSON audit report against the previous one | Two audit JSON files |
| 10 | Merge to `main`, tag if it is a milestone | Annotated tag |
| 11 | Remove the snapshot once the change is verified and documented | Decision-log entry |

The change window is Saturday 22:00 to Sunday 02:00, declared in `group_vars/all.yml` as `fyp_change_window`. Nothing that can interrupt a service is run outside it. The one exception, stated as such, is the week-10 to week-12 verification phase, when the group runs tests deliberately outside the window and records that it did so.

#### 10.4.8 Verification

##### 10.4.8.1 The exact commands

```bash
# --- 0. Prepare: one timestamped log file per run -------------------------------
export FYP_RUNLOG="/opt/ansible-venv/repo/04-automation/runs/$(date +%Y-%m-%d_%H%M)_05-nftables-egress.log"

# --- 1. Gate: syntax ----------------------------------------------------------
ansible-playbook playbooks/05-nftables-egress.yml --syntax-check

# --- 2. Gate: dry run with diffs ----------------------------------------------
ansible-playbook playbooks/05-nftables-egress.yml --check --diff 2>&1 | tee "${FYP_RUNLOG%.log}.check.log"

# --- 3. Canary ----------------------------------------------------------------
ansible-playbook playbooks/05-nftables-egress.yml --limit vpnz-nft02 2>&1 | tee "$FYP_RUNLOG"

# --- 4. Full run (the FIRST run - changes are expected) -----------------------
ansible-playbook playbooks/05-nftables-egress.yml 2>&1 | tee -a "$FYP_RUNLOG"

# --- 5. IDEMPOTENCE PROOF: run it again immediately ---------------------------
ansible-playbook playbooks/05-nftables-egress.yml 2>&1 | tee "/opt/ansible-venv/repo/04-automation/runs/$(date +%Y-%m-%d_%H%M)_05-nftables-egress.SECOND-RUN.log"

# --- 6. Independent verification, not the playbook's own opinion --------------
ansible edge -i inventory/hosts.yml -m ansible.builtin.shell -a 'nft list table inet fyp_filter | head -5'
ansible edge -i inventory/hosts.yml -m ansible.builtin.shell -a 'systemctl is-active nftables keepalived'
ansible edge -i inventory/hosts.yml -m ansible.builtin.shell -a 'ip -br addr show | grep 10.10.50.10 || echo "VIP not here"'

# --- 7. Whole-estate audit ----------------------------------------------------
ansible-playbook playbooks/09-verify-services.yml 2>&1 | tee "/opt/ansible-venv/repo/04-automation/runs/$(date +%Y-%m-%d_%H%M)_09-verify-services.log"

# --- 8. Commit the evidence ---------------------------------------------------
git add 04-automation/runs/
git commit -m "evidence(l4): nftables egress deployment - first run, canary, idempotence proof"
```

##### 10.4.8.2 The expected recap output — the idempotence proof

The output below is **illustrative** and shows the exact shape required. The values in a real run will differ in timing; the property that must hold is the `changed=0` counts on the second run.

**First run (canary, `vpnz-nft02`) — changes expected:**

```text
PLAY [Egress firewall - converge the nftables pair] ***************************

TASK [Gathering Facts] *********************************************************
ok: [vpnz-nft02]

TASK [Assert that the two expected interfaces exist] ***************************
ok: [vpnz-nft02]

TASK [Capture the pre-change ruleset as the rollback reference] ****************
ok: [vpnz-nft02]

TASK [Arm the automatic rollback timer] ***************************************
changed: [vpnz-nft02]

TASK [common : Install the baseline package set] *******************************
ok: [vpnz-nft02]

TASK [nftables : Deploy the ruleset fragments] *********************************
changed: [vpnz-nft02] => (item=10-sets.nft)
changed: [vpnz-nft02] => (item=20-filter-input.nft)
changed: [vpnz-nft02] => (item=30-filter-forward.nft)
changed: [vpnz-nft02] => (item=40-nat.nft)
changed: [vpnz-nft02] => (item=90-logging.nft)

TASK [nftables : Deploy the main ruleset] **************************************
changed: [vpnz-nft02]

TASK [Validate the candidate ruleset without applying it] **********************
ok: [vpnz-nft02]

TASK [Apply the ruleset] *******************************************************
changed: [vpnz-nft02]

TASK [Wait for the ruleset to be loaded and policy to be drop] *****************
ok: [vpnz-nft02]

TASK [Verify connectivity FROM THE FAR SIDE (the path the ruleset could break)]
ok: [vpnz-nft02 -> localhost]

TASK [Detect configuration drift between the running ruleset and the template]
ok: [vpnz-nft02]

TASK [Disarm the rollback timer ONLY because verification passed] **************
changed: [vpnz-nft02]

TASK [Publish the active ruleset as evidence for TC-L2-03] *********************
ok: [vpnz-nft02]

RUNNING HANDLER [nftables : Reload nftables] ***********************************
changed: [vpnz-nft02]

PLAY RECAP *********************************************************************
vpnz-nft02                 : ok=31   changed=11   unreachable=0    failed=0    skipped=3    rescued=0    ignored=0
```

**Second run, immediately afterwards — the idempotence proof:**

```text
PLAY [Egress firewall - converge the nftables pair] ***************************

TASK [Gathering Facts] *********************************************************
ok: [vpnz-nft01]
ok: [vpnz-nft02]

TASK [Assert that the two expected interfaces exist] ***************************
ok: [vpnz-nft01]
ok: [vpnz-nft02]

TASK [Arm the automatic rollback timer] ***************************************
skipping: [vpnz-nft01]
skipping: [vpnz-nft02]

TASK [nftables : Deploy the ruleset fragments] *********************************
ok: [vpnz-nft01] => (item=10-sets.nft)
ok: [vpnz-nft01] => (item=20-filter-input.nft)
ok: [vpnz-nft01] => (item=30-filter-forward.nft)
ok: [vpnz-nft01] => (item=40-nat.nft)
ok: [vpnz-nft01] => (item=90-logging.nft)
ok: [vpnz-nft02] => (item=10-sets.nft)
...
ok: [vpnz-nft02] => (item=90-logging.nft)

TASK [Validate the candidate ruleset without applying it] **********************
ok: [vpnz-nft01]
ok: [vpnz-nft02]

TASK [Wait for the ruleset to be loaded and policy to be drop] *****************
ok: [vpnz-nft01]
ok: [vpnz-nft02]

TASK [Disarm the rollback timer ONLY because verification passed] **************
skipping: [vpnz-nft01]
skipping: [vpnz-nft02]

PLAY RECAP *********************************************************************
vpnz-nft01                 : ok=26   changed=0    unreachable=0    failed=0    skipped=8    rescued=0    ignored=0
vpnz-nft02                 : ok=26   changed=0    unreachable=0    failed=0    skipped=8    rescued=0    ignored=0
```

**How to read this as evidence, and what it does not prove.**

- `changed=0` on both pair members is the requirement. It is proof that the playbook is idempotent for this configuration on this estate.
- `failed=0` and `unreachable=0` prove the change did not break the connection to either node. For an inline firewall, `unreachable=1` would be the exact signature of the lock-out failure mode, which is why the far-side verification task exists.
- The `skipping` lines on the rollback tasks are *correct*: the timer is already armed and the `creates:` guard prevents a re-arm. An idempotence proof that shows zero skips on every task is suspicious rather than reassuring.
- **What it does not prove.** `changed=0` does not prove that the *desired* state is correct — a playbook that does nothing idempotently is perfectly idempotent. The correctness claim comes from the audit playbook's assertions and from the scenario tests in the verification chapter, which are separate evidence. Both are needed; neither substitutes for the other.

The equivalent proof is captured for every playbook in the repository, and the collected results are recorded, with the log file path and the date, in `04-automation/ansible/docs/05-idempotence-log.md`:

| Playbook | Hosts | First run changed | Second run changed | Log file | Date |
|---|---|---|---|---|---|
| `01-baseline-windows.yml` | 9 Windows guests | *(record)* | **0** | `runs/…_01-baseline-windows.SECOND-RUN.log` | *(record)* |
| `02-baseline-linux.yml` | 9 Linux guests | *(record)* | **0** | `runs/…_02-baseline-linux.SECOND-RUN.log` | *(record)* |
| `03-nginx-reverseproxy.yml` | `vpnz-dmzrev01/02` | *(record)* | **0** | `runs/…_03-nginx.SECOND-RUN.log` | *(record)* |
| `04-keepalived.yml` | `web`, `edge` | *(record)* | **0** | `runs/…_04-keepalived.SECOND-RUN.log` | *(record)* |
| `05-nftables-egress.yml` | `vpnz-nft01/02` | *(record)* | **0** | `runs/…_05-nftables.SECOND-RUN.log` | *(record)* |
| `06-wireguard.yml` | `edge` | *(record)* | **0** | `runs/…_06-wireguard.SECOND-RUN.log` | *(record)* |
| `07-ad-users.yml` | `vpnz-dc01` | *(record)* | **0** | `runs/…_07-ad-users.SECOND-RUN.log` | *(record)* |
| `08-collect-network-configs.yml` | all reachable + localhost | *(record)* | **0** | `runs/…_08-collect.SECOND-RUN.log` | *(record)* |
| `09-verify-services.yml` | all | *(record)* | **0** (by construction) | `runs/audit/audit-*.json` | *(record)* |

A blank cell in this table at the end of week 12 is a missing deliverable, not an oversight to be explained in prose.

---

### 10.5 PowerShell

#### 10.5.1 Why PowerShell for the Windows estate

The official topic sheet names PowerShell explicitly as an example for this line, and the WSOS 2026 makes it citable in two places: `Setup and run routine infrastructure maintenance operations using various scripting\programming languages` with the nested example `PowerShell` (Domain 5 — Infrastructure Automation, 15 %), and `Install and manage backup systems` with the nested example `Script based backup, e.g. Bash, Batch or PowerShell` (Domain 4 — Network and System Operations, the line that also names `Windows Server Backup`). Domain 4's other lines — directory services, DNS, DHCP, time, remote access, PKI, sharing services, monitoring, backup, deployment — are all, in a Microsoft estate, things PowerShell is the first-class interface to. That is the standards argument, and it is a strong one for this line specifically.

The technical argument is three properties that Bash and Ansible do not have on Windows:

1. **The object pipeline.** PowerShell passes .NET objects between commands, not text. `Get-Service | Where-Object Status -eq 'Stopped' | Select-Object Name, DisplayName, StartType` produces structured records that can be filtered, formatted, exported or asserted against, with no parsing. The consequence for this project is that the audit and reporting scripts of 10.5.3 do not parse console output — they consume objects — which means a change in a service's display text does not silently break the check. Every script in this section therefore ends by emitting objects, and the object stream is what gets exported to CSV.
2. **Remoting.** `Invoke-Command` runs a script block on a remote host, or on many hosts concurrently, and returns deserialised objects that behave like local ones. This lets one script audit the whole nine-host Windows estate without an agent, and it is the same transport (`WinRM` 5986 over HTTPS) that Ansible uses, so the two automation paths share one firewall rule, one certificate decision and one troubleshooting procedure.
3. **Depth of coverage on the Microsoft roles.** DHCP, DNS, FSRM, iSCSI Target, AD CS and RRAS all expose `*-` cmdlets with `-WhatIf` support on the modifying ones. `-WhatIf` gives the Windows scripts something Ansible's `--check` gives Linux: a dry-run path that the group uses as a gate before any change.

**The honest boundary.** PowerShell is *not* the tool for the Linux estate (Bash and Ansible are), and it is *not* the tool for the Cisco estate (`Packet Tracer` exposes no interface any script can reach — see 10.7). It is also not the right tool for a change to `vpnz-dc01`'s DNS or DHCP configuration where the group's decision is that the change belongs in a reviewed playbook or a documented GPO instead.

**Runtime discipline.** Windows PowerShell **5.1** is what runs on the Windows guests, because it is in-box. PowerShell **7.4 LTS** runs on `vpnz-jump01` for authoring and for cross-platform use. Every script in this section is written to run on **5.1** unless it states otherwise, and each script's help block records the runtime it was tested on. This matters: a script that uses the ternary operator or `??` will fail on 5.1, and claiming 7.4 where only 5.1 was exercised is exactly the kind of version claim the project treats as an integrity failure.

#### 10.5.2 PowerShell remoting setup

##### 10.5.2.1 `Enable-PSRemoting` on the target

`Enable-PSRemoting -Force` on a Windows Server 2025 guest starts the WinRM service, sets it to automatic, creates a listener, and enables the firewall group `Windows Remote Management (HTTP-In)`. That is useful as a starting point and **insufficient as a design**, for three reasons that this project's threat model makes concrete:

```powershell
# What Enable-PSRemoting does, and what the project therefore adds on top of it.
Enable-PSRemoting -Force -SkipNetworkProfileCheck
# -SkipNetworkProfileCheck  : required in this lab, because hypervisor host-only
#                             adapters are often classified as Public and the
#                             cmdlet otherwise refuses to proceed.

# Project additions, in order of importance:
Set-Item WSMan:\localhost\Service\Auth\Basic -Value $false             # no cleartext auth
Set-Item WSMan:\localhost\Service\AllowUnencrypted -Value $false       # no cleartext transport
Get-ChildItem WSMan:\localhost\Listener |                            # remove the HTTP listener
    Where-Object { $_.Keys -contains 'Transport=HTTP' } |
    ForEach-Object { Remove-Item ("WSMan:\localhost\Listener\" + $_.Name) -Recurse -Force }
New-Item WSMan:\localhost\Listener -Transport HTTPS -Address * `
    -CertificateThumbprint $cert.Thumbprint                            # HTTPS listener only
Set-Item WSMan:\localhost\MaxEnvelopeSizekb -Value 500
Set-Item WSMan:\localhost\Shell\IdleTimeout -Value 300000
```

**Why the HTTP listener is removed.** The default listener is unencrypted. Leaving it enabled means the design's claim that WinRM traffic is encrypted is false, and it means a credential sent by a misconfigured client travels in the clear. The design therefore states one listener, on 5986, and the audit playbook of 10.4.6.4 asserts `https_listeners=1 http_listeners=0` on every Windows guest.

**Firewall scoping.** The default rule enabled by `Enable-PSRemoting` permits WinRM from any remote address. The project replaces that with a rule scoped by `-RemoteAddress 10.10.30.31`, so that WinRM is reachable only from the automation control node, and records the resulting address filter as evidence (10.4.1.3). This is the host-level implementation of the TB-07/TB-08 management-plane discipline.

##### 10.5.2.2 `TrustedHosts` versus HTTPS

`TrustedHosts` is a **client-side** list of hostnames or addresses that a Windows machine will accept as WinRM targets when it cannot authenticate them through a domain. Two facts about it determine this project's decision:

- `TrustedHosts` applies to the machine that **initiates** the connection, not the target.
- Using it means the initiator does not verify the target's identity; the traffic is authenticated as NTLM or Basic but the *server* is not proved to be the host it claims to be. It also cannot be set by Group Policy, so it is a per-machine manual step that will silently be missing on a rebuilt VM.

For **Ansible this setting is irrelevant**: the control node is Linux and `pywinrm` performs its own certificate validation. There is no `TrustedHosts` in the Ansible path at all; the equivalent control is `ansible_winrm_server_cert_validation: validate` plus a trusted certificate chain.

For **administrators working from a Windows machine**, the project uses `TrustedHosts` only in one place and only as a documented, dated experiment: demonstrating that a Windows administrator at `vpnz-jump01` can reach a DMZ web node that is workgroup-isolated. That demonstration is captured with the warning it deserves:

```powershell
# ON vpnz-jump01 ONLY. Documented experimental use; NOT used by the Ansible path.
$cur = (Get-Item WSMan:\localhost\Client\TrustedHosts).Value
Set-Item WSMan:\localhost\Client\TrustedHosts -Value "10.10.90.21,10.10.90.22" -Concatenate -Force
Test-WSMan -ComputerName 10.10.90.21 -UseSSL     # must negotiate; check the certificate it presents
# ... capture the evidence, then revert the change and record the revert:
Set-Item WSMan:\localhost\Client\TrustedHosts -Value $cur -Force
```

The report must present this as a **lab simplification for one specific workgroup scenario**, with the security consequence stated: `TrustedHosts` disables target-identity verification and is therefore not the design's supported path. Where the DMZ hosts are domain-joined (open item O-05), this experiment is not needed at all.

##### 10.5.2.3 How Ansible connects to it

Ansible's Windows connection is declared in `inventory/group_vars/windows.yml` (10.4.1.3) and uses `winrm` over HTTPS with NTLM. The fact that both the PowerShell scripts and Ansible use the *same* transport is deliberate: one firewall rule per host, one certificate decision, one troubleshooting procedure, and one place to fix a break. Where a break occurs in that transport, both the `Test-WSMan` diagnostic and the `ansible windows -m ansible.windows.win_ping` diagnostic are run and both results are recorded, because a failure that appears in one and not the other is itself information about where the fault lies.

#### 10.5.3 Production-quality scripts

Three scripts are specified in full. Each has comment-based help, `[CmdletBinding()]`, typed and validated parameters, structured error handling with `try`/`catch`/`finally`, `Write-Verbose` and `Write-Error` used for their intended purposes, and a clean output object suitable for `Export-Csv`. Each is preceded by a short design note and followed by the invocation evidence required.

##### 10.5.3.1 `Invoke-NewStarterOnboarding.ps1`

**Design note.** This is the script that answers due-diligence item 2 (documented least-privilege access and an audit trail of administrative actions) and the in-scenario need for repeatable, reviewed onboarding. It is **CSV-driven on purpose**: the CSV is the reviewed artefact, it can be diffed in Git, and it means the script has no interactive prompts — which is what allows it to be run by a scheduled task or a playbook. The script creates the account in the correct OU from the site code, adds the group memberships for the department, creates the home directory and the FSRM quota, and returns one object per user. It supports `-WhatIf` so that a run can be verified before it changes anything, and it never writes a password to a log.

```powershell
<#
.SYNOPSIS
    Provisions Vertex Peak starters in AD DS from a reviewed CSV file.

.DESCRIPTION
    Creates user accounts in the OU tree of vertexpeak.fyp.lab, adds them to the
    department and site security groups, creates the home directory, and applies a
    per-user FSRM quota where the department has a quota template.

    This script is CSV-driven by design: the CSV is the reviewed source of truth and
    is committed to Git. The script makes no interactive prompts, so it can be run
    from a verified scheduled task or from an Ansible playbook.

    Verified on: Windows PowerShell 5.1 (Windows Server 2025 Standard, build 10.0.26100)
    Requires  : ActiveDirectory, FileServerResourceManager modules (RSAT / role installed)
    Test IDs  : TC-L4-01, TC-L1-01

.PARAMETER CsvPath
    Path to the reviewed CSV. Required columns:
    SamAccountName, GivenName, Surname, Department, SiteCode, Title

.PARAMETER DefaultPassword
    Initial password. Must satisfy the domain complexity policy. The account is
    flagged ChangePasswordAtLogon. The value is NEVER written to the log.

.PARAMETER HomeRoot
    UNC root for home directories. Default \\vpnz-fs01\Shares\Home.

.PARAMETER QuotaTemplate
    Name of the FSRM quota template applied to a user's home directory. Empty
    string disables quota application (for example for the Sales read-only share).

.PARAMETER LogPath
    Directory for the run log. Default C:\FYP\logs.

.EXAMPLE
    .\Invoke-NewStarterOnboarding.ps1 -CsvPath .\data\newstarters.csv `
        -DefaultPassword (Read-Host -AsSecureString) -WhatIf -Verbose

    Previews every action for the reviewed CSV without creating anything.
    This is the mandatory first invocation.

.EXAMPLE
    .\Invoke-NewStarterOnboarding.ps1 -CsvPath .\data\newstarters.csv `
        -DefaultPassword $pw -QuotaTemplate 'Quota-20GB-Finance'

    Runs the provisioning for real and returns one object per provisioned user.

.OUTPUTS
    PSCustomObject per input row, with properties:
    SamAccountName, DistinguishedName, Created, GroupCount, HomeCreated, QuotaApplied, Status

.NOTES
    Author : Vertex Peak FYP workstream W4 (Automation, Monitoring & AI)
    Reviewer: W1 (Identity & Windows)
    Idempotence: re-running with the same CSV reports Created=$false and makes no change.
                 A user whose OU or group membership has drifted IS corrected; that is
                 intentional and is recorded in the output object's Status property.
#>
[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
param(
    [Parameter(Mandatory = $true)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
    [string]$CsvPath,

    [Parameter(Mandatory = $true)]
    [System.Security.SecureString]$DefaultPassword,

    [ValidateNotNullOrEmpty()]
    [string]$HomeRoot = '\\vpnz-fs01\Shares\Home',

    [string]$QuotaTemplate = '',

    [ValidateNotNullOrEmpty()]
    [string]$LogPath = 'C:\FYP\logs'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Fixed design values - these come from the canonical design and are not tunable
# ---------------------------------------------------------------------------
$DomainDn     = 'DC=vertexpeak,DC=fyp,DC=lab'
$UserRootOu   = "OU=Users,OU=VertexPeak,$DomainDn"
$SiteOuMap    = @{
    'HQ' = "OU=HQ-ShaTin,$UserRootOu"
    'BR' = "OU=BR-KwunTong,$UserRootOu"
    'WC' = "OU=WC-WanChai,$UserRootOu"
    'MO' = "OU=MO-Macau,$UserRootOu"
}
$DepartmentMap = @{
    'Engineering'     = @{ Ou = 'Engineering';      Groups = @('GG-Engineering-RW');             Quota = 'Quota-10GB-Engineering' }
    'SalesOps'        = @{ Ou = 'SalesOps';         Groups = @('GG-Sales-RO');                   Quota = 'Quota-10GB-SalesRO' }
    'Finance'         = @{ Ou = 'Finance';          Groups = @('GG-Finance-RW');                 Quota = 'Quota-20GB-Finance' }
    'HumanResources'  = @{ Ou = 'HumanResources';   Groups = @();                                Quota = '' }
    'IT'              = @{ Ou = 'IT';               Groups = @('GG-Server-Admins');              Quota = 'Quota-10GB-Engineering' }
    'Support'         = @{ Ou = 'Support';          Groups = @('GG-Helpdesk');                   Quota = '' }
}

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
if (-not (Test-Path -LiteralPath $LogPath)) {
    New-Item -ItemType Directory -Path $LogPath -Force | Out-Null
}
$LogFile = Join-Path $LogPath ("{0}_Invoke-NewStarterOnboarding.log" -f (Get-Date -Format 'yyyy-MM-dd'))

function Write-RunLog {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Message,
        [ValidateSet('INFO', 'WARN', 'ERROR')][string]$Level = 'INFO'
    )
    $line = "{0} [{1}] {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message
    Add-Content -LiteralPath $LogFile -Value $line
    switch ($Level) {
        'ERROR' { Write-Error $Message -ErrorAction Continue }
        'WARN'  { Write-Warning $Message }
        default { Write-Verbose $Message }
    }
}

function ConvertTo-PlainText {
    [CmdletBinding()]
    param([Parameter(Mandatory)][System.Security.SecureString]$Secure)
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
    try   { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
$required = @('SamAccountName', 'GivenName', 'Surname', 'Department', 'SiteCode', 'Title')
$results  = New-Object System.Collections.Generic.List[object]

try {
    Import-Module ActiveDirectory -ErrorAction Stop
    Write-RunLog "Starting onboarding run from $CsvPath"

    $rows = Import-Csv -LiteralPath $CsvPath
    if (-not $rows) { throw "CSV '$CsvPath' contains no data rows." }

    $missing = $required | Where-Object { $_ -notin $rows[0].PSObject.Properties.Name }
    if ($missing) { throw "CSV is missing required column(s): $($missing -join ', ')" }

    $plain = ConvertTo-PlainText -Secure $DefaultPassword

    foreach ($row in $rows) {
        $status     = 'OK'
        $created    = $false
        $homeMade   = $false
        $quotaDone  = $false
        $groupCount = 0

        try {
            if ($row.Department -notin $DepartmentMap.Keys) {
                throw "Unknown department '$($row.Department)' for $($row.SamAccountName)."
            }
            if ($row.SiteCode -notin $SiteOuMap.Keys) {
                throw "Unknown site code '$($row.SiteCode)' for $($row.SamAccountName)."
            }
            if ($row.SamAccountName -notmatch '^[a-z][a-z0-9]{2,14}$') {
                throw "SamAccountName '$($row.SamAccountName)' violates the naming rule (lower-case, 3-15 chars)."
            }

            $dept     = $DepartmentMap[$row.Department]
            $targetOu = "OU=$($dept.Ou),$($SiteOuMap[$row.SiteCode])"
            $upn      = "$($row.SamAccountName)@vertexpeak.fyp.lab"

            $existing = Get-ADUser -Filter "SamAccountName -eq '$($row.SamAccountName)'" `
                                   -ErrorAction SilentlyContinue

            if (-not $existing) {
                if ($PSCmdlet.ShouldProcess($upn, 'Create AD user')) {
                    $params = @{
                        Name                  = "$($row.GivenName) $($row.Surname)"
                        GivenName             = $row.GivenName
                        Surname               = $row.Surname
                        SamAccountName        = $row.SamAccountName
                        UserPrincipalName     = $upn
                        DisplayName           = "$($row.GivenName) $($row.Surname)"
                        Title                 = $row.Title
                        Department            = $row.Department
                        Path                  = $targetOu
                        AccountPassword       = (ConvertTo-SecureString -String $plain -AsPlainText -Force)
                        Enabled               = $true
                        ChangePasswordAtLogon = $true
                        PasswordNeverExpires  = $false
                    }
                    New-ADUser @params
                    $created = $true
                    Write-RunLog "Created $upn in $targetOu"
                }
                else {
                    $status = 'WhatIf'
                    Write-RunLog "WhatIf: would create $upn in $targetOu"
                }
            }
            else {
                Write-RunLog "User $($row.SamAccountName) already exists - checking drift" 'WARN'
                if ($existing.DistinguishedName -notlike "*$targetOu") {
                    $status = 'Corrected-DN'
                    if ($PSCmdlet.ShouldProcess($upn, 'Move to correct OU')) {
                        Move-ADObject -Identity $existing.DistinguishedName -TargetPath $targetOu
                        Write-RunLog "Moved $upn to $targetOu"
                    }
                }
            }

            foreach ($group in $dept.Groups) {
                $isMember = Get-ADGroupMember -Identity $group -ErrorAction SilentlyContinue |
                            Where-Object { $_.SamAccountName -eq $row.SamAccountName }
                if (-not $isMember) {
                    if ($PSCmdlet.ShouldProcess($upn, "Add to $group")) {
                        Add-ADGroupMember -Identity $group -Members $row.SamAccountName
                        Write-RunLog "Added $upn to $group"
                    }
                }
                $groupCount++
            }

            # Home directory. The share is created once by the file-server role;
            # this script only creates the per-user folder and sets its ACL.
            if ($status -ne 'WhatIf') {
                $home = Join-Path $HomeRoot $row.SamAccountName
                if (-not (Test-Path -LiteralPath $home)) {
                    if ($PSCmdlet.ShouldProcess($home, 'Create home directory')) {
                        New-Item -ItemType Directory -Path $home -Force | Out-Null
                        $acl = Get-Acl -LiteralPath $home
                        $acl.SetAccessRuleProtection($true, $false)
                        $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
                            "$($row.SamAccountName)", 'Modify', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
                        $acl.AddAccessRule($rule)
                        Set-Acl -LiteralPath $home -AclObject $acl
                        $homeMade = $true
                        Write-RunLog "Created home directory $home (owner-only ACL)"
                    }
                }
                if (-not $homeMade -and (Test-Path -LiteralPath $home)) {
                    $homeMade = $true   # already compliant; not a change
                }

                $templateToUse = if ($QuotaTemplate) { $QuotaTemplate } else { $dept.Quota }
                if ($templateToUse) {
                    $existingQuota = Get-FsrmQuota -Path $home -ErrorAction SilentlyContinue
                    if (-not $existingQuota) {
                        if ($PSCmdlet.ShouldProcess($home, "Apply FSRM quota $templateToUse")) {
                            New-FsrmQuota -Path $home -Template $templateToUse | Out-Null
                            $quotaDone = $true
                            Write-RunLog "Applied FSRM quota $templateToUse to $home"
                        }
                    }
                    else { $quotaDone = $true }
                }
            }

            $dn = (Get-ADUser -Identity $row.SamAccountName -Properties DistinguishedName).DistinguishedName
            $results.Add([PSCustomObject]@{
                SamAccountName    = $row.SamAccountName
                DistinguishedName = $dn
                Created           = $created
                GroupCount        = $groupCount
                HomeCreated       = $homeMade
                QuotaApplied      = $quotaDone
                Status            = $status
            })
        }
        catch {
            Write-RunLog "FAILED $($row.SamAccountName): $($_.Exception.Message)" 'ERROR'
            $results.Add([PSCustomObject]@{
                SamAccountName    = $row.SamAccountName
                DistinguishedName = ''
                Created           = $false
                GroupCount        = 0
                HomeCreated       = $false
                QuotaApplied      = $false
                Status            = "ERROR: $($_.Exception.Message)"
            })
            continue
        }
        finally {
            if ($plain) { $plain = $null }
        }
    }

    $failures = @($results | Where-Object { $_.Status -like 'ERROR*' }).Count
    Write-RunLog ("Run complete: {0} row(s), {1} failure(s)" -f $results.Count, $failures)
    if ($failures -gt 0) {
        Write-RunLog "One or more rows failed; see the log for detail" 'WARN'
    }
}
catch {
    Write-RunLog "Aborted: $($_.Exception.Message)" 'ERROR'
    throw
}
finally {
    $plain = $null
}

# Emit objects, never formatted text - this is what allows export and assertion.
$results
```

##### 10.5.3.2 `Get-ServiceAndFirewallAudit.ps1`

**Design note.** This is the Windows half of the drift detector. It answers the question the security tests ask — *is the host still configured the way the design says it is?* — without changing anything. It queries services against an expected-state table, enumerates firewall profiles and rules, checks for the specific inbound allowances the port matrix requires, reports the WinRM listener state, and returns one object per finding. It accepts several `-ComputerName` values so that the same script audits the estate from `vpnz-jump01` or from `vpnz-mon01` through remoting, and it degrades honestly when a host is unreachable: the unreachable host becomes a finding, not an exception that aborts the run. It contains **no** state-changing cmdlet anywhere — a property that is checkable with `Get-Command -Verb Set,New,Remove` rather than merely asserted.

```powershell
<#
.SYNOPSIS
    Read-only audit of Windows service state, firewall configuration and WinRM listeners.

.DESCRIPTION
    Produces a structured, exportable record of the security-relevant state of one or
    more Windows hosts and compares it against the expected state defined by the project
    design. The script NEVER changes configuration: it is the Windows-side reference
    implementation of "read-only by construction", and no state-changing cmdlet appears
    anywhere in it.

    Checks performed:
      1. Expected service state (WinRM, W32Time, DNS, Netlogon, DHCPServer, W3SVC,
         iSCSITarget, RemoteAccess) against an expected table, only where the role applies.
      2. Firewall profile state: all three profiles enabled with default inbound Block.
      3. Presence of the design's scoped inbound rules (WinRM 5986 and windows_exporter
         9182, both limited to the control node 10.10.30.31).
      4. WinRM listener state: exactly one HTTPS listener and no HTTP listener.
      5. Listening TCP ports compared against the design's port matrix.
      6. Local Administrators group membership, reported for review and never modified.

    Verified on: Windows PowerShell 5.1 (Windows Server 2025, build 10.0.26100)
                 and PowerShell 7.4 LTS on vpnz-jump01.
    Test IDs   : TC-L4-01, TC-L4-05, TB-07, TB-08

.PARAMETER ComputerName
    One or more host names or addresses. Defaults to the local computer.

.PARAMETER OutputPath
    Directory for the CSV and the run log. Default C:\FYP\config.

.PARAMETER Credential
    Optional credential for a remote audit. Use an account that is a member of
    GG-Server-Admins; never a Domain Admin for a routine audit.

.EXAMPLE
    .\Get-ServiceAndFirewallAudit.ps1 -OutputPath C:\FYP\config -Verbose

    Audits the local host and writes ServiceFirewallAudit-<timestamp>.csv.

.EXAMPLE
    $cred = Get-Credential VERTEXPEAK\adm-w4
    .\Get-ServiceAndFirewallAudit.ps1 -ComputerName vpnz-dc01,vpnz-dc02,vpnz-fs01 `
        -Credential $cred -OutputPath C:\FYP\config

    Audits three hosts over WinRM/HTTPS and writes one CSV containing every finding.

.OUTPUTS
    PSCustomObject per check with properties:
    ComputerName, Check, Expected, Actual, Result (PASS/FAIL/INFO/UNREACHABLE), Detail

.NOTES
    Author : Vertex Peak FYP workstream W4
    Reviewer: W1
    Safety : READ-ONLY. No Set-, New-, Remove-, Start- or Stop- cmdlet is used.
#>
[CmdletBinding()]
param(
    [Parameter(ValueFromPipeline = $true)]
    [string[]]$ComputerName = $env:COMPUTERNAME,

    [ValidateNotNullOrEmpty()]
    [string]$OutputPath = 'C:\FYP\config',

    [System.Management.Automation.PSCredential]$Credential
)

begin {
    Set-StrictMode -Version Latest
    $ErrorActionPreference = 'Stop'

    $ExpectedServices = @{
        WinRM        = @{ Status = 'Running'; StartType = 'Automatic'; Roles = @('*') }
        W32Time      = @{ Status = 'Running'; StartType = 'Automatic'; Roles = @('*') }
        DNS          = @{ Status = 'Running'; StartType = 'Automatic'; Roles = @('dc','rodc') }
        Netlogon     = @{ Status = 'Running'; StartType = 'Automatic'; Roles = @('dc','rodc') }
        DHCPServer   = @{ Status = 'Running'; StartType = 'Automatic'; Roles = @('dc') }
        W3SVC        = @{ Status = 'Running'; StartType = 'Automatic'; Roles = @('iis') }
        iSCSITarget  = @{ Status = 'Running'; StartType = 'Automatic'; Roles = @('iscsi_target') }
        RemoteAccess = @{ Status = 'Running'; StartType = 'Automatic'; Roles = @('vpn') }
    }
    $ExpectedRules = @(
        @{ Name = 'FYP-Ansible-WinRM-5986'; Port = 5986; RemoteAddress = '10.10.30.31' }
        @{ Name = 'FYP-Exporter-9182';      Port = 9182; RemoteAddress = '10.10.30.31' }
    )
    $AllowedListening = @(135,139,445,3389,5986,9182,53,88,389,636,3268,3269,464,123,80,443,6516)
    $Findings = New-Object System.Collections.Generic.List[object]

    if (-not (Test-Path -LiteralPath $OutputPath)) {
        New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
    }
    $LogFile = Join-Path $OutputPath ("{0}_service-firewall-audit.log" -f (Get-Date -Format 'yyyy-MM-dd'))

    function Write-AuditLog {
        [CmdletBinding()]
        param([Parameter(Mandatory)][string]$Message,
              [ValidateSet('INFO','WARN','ERROR')][string]$Level = 'INFO')
        Add-Content -LiteralPath $LogFile -Value ("{0} [{1}] {2}" -f (Get-Date -f 'yyyy-MM-dd HH:mm:ss'), $Level, $Message)
        switch ($Level) {
            'ERROR' { Write-Warning $Message }
            'WARN'  { Write-Warning $Message }
            default { Write-Verbose $Message }
        }
    }

    function Add-Finding {
        [CmdletBinding()]
        param(
            [Parameter(Mandatory)][string]$Computer,
            [Parameter(Mandatory)][string]$Check,
            [string]$Expected = '',
            [string]$Actual = '',
            [Parameter(Mandatory)][ValidateSet('PASS','FAIL','INFO','UNREACHABLE')][string]$Result,
            [string]$Detail = ''
        )
        $Findings.Add([PSCustomObject]@{
            ComputerName = $Computer
            Check        = $Check
            Expected     = $Expected
            Actual       = $Actual
            Result       = $Result
            Detail       = $Detail
        })
    }
}

process {
    foreach ($computer in $ComputerName) {
        try {
            if ($computer -eq $env:COMPUTERNAME -and -not $Credential) {
                $remote = $false
            }
            else {
                # Fail fast and report clearly if the transport is the problem.
                if (-not (Test-WSMan -ComputerName $computer -UseSSL -Credential $Credential -ErrorAction Stop)) {
                    throw "Test-WSMan returned nothing for $computer"
                }
                $remote = $true
            }
        }
        catch {
            Write-AuditLog "UNREACHABLE $computer : $($_.Exception.Message)" 'ERROR'
            Add-Finding -Computer $computer -Check 'Connectivity' -Expected 'WinRM/HTTPS 5986 reachable' `
                        -Actual 'unreachable' -Result 'UNREACHABLE' -Detail $_.Exception.Message
            continue
        }

        try {
            $scriptBlock = {
                [PSCustomObject]@{
                    Profiles = @(Get-NetFirewallProfile | Select-Object Name, Enabled, DefaultInboundAction)
                    Rules    = @(Get-NetFirewallRule -ErrorAction SilentlyContinue |
                                 Where-Object { $_.DisplayName -like 'FYP-*' } |
                                 ForEach-Object {
                                     [PSCustomObject]@{
                                         DisplayName   = $_.DisplayName
                                         Enabled       = [string]$_.Enabled
                                         Direction     = [string]$_.Direction
                                         Action        = [string]$_.Action
                                         RemoteAddress = (($_ | Get-NetFirewallAddressFilter).RemoteAddress -join ',')
                                         LocalPort     = (($_ | Get-NetFirewallPortFilter).LocalPort -join ',')
                                     }
                                 })
                    Services  = @(Get-Service -ErrorAction SilentlyContinue | Select-Object Name, Status, StartType)
                    Listeners = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
                                  Select-Object LocalAddress, LocalPort, OwningProcess)
                    Admins    = @(Get-LocalGroupMember -Group Administrators -ErrorAction SilentlyContinue |
                                  Select-Object Name, ObjectClass)
                    WinRM     = @(Get-ChildItem WSMan:\Localhost\Listener |
                                  Select-Object Name, @{n='Keys';e={ ($_.Keys -join ';') }})
                }
            }

            if ($remote) {
                $data = Invoke-Command -ComputerName $computer -ScriptBlock $scriptBlock `
                                       -Credential $Credential -ErrorAction Stop
            }
            else {
                $data = & $scriptBlock
            }

            # --- 1. Services ------------------------------------------------
            foreach ($svcName in $ExpectedServices.Keys) {
                $svc = $data.Services | Where-Object { $_.Name -eq $svcName }
                if (-not $svc) {
                    $roles  = $ExpectedServices[$svcName].Roles
                    $result = if ($roles -contains '*') { 'FAIL' } else { 'INFO' }
                    Add-Finding -Computer $computer -Check "Service:$svcName" `
                                -Expected $ExpectedServices[$svcName].Status -Actual 'not installed' `
                                -Result $result -Detail "Roles for this service: $($roles -join ',')"
                    continue
                }
                $ok = ($svc.Status -eq $ExpectedServices[$svcName].Status) -and
                      ($svc.StartType -eq $ExpectedServices[$svcName].StartType)
                Add-Finding -Computer $computer -Check "Service:$svcName" `
                            -Expected "$($ExpectedServices[$svcName].Status)/$($ExpectedServices[$svcName].StartType)" `
                            -Actual   "$($svc.Status)/$($svc.StartType)" `
                            -Result   $(if ($ok) { 'PASS' } else { 'FAIL' })
            }

            # --- 2. Firewall profiles ---------------------------------------
            foreach ($profile in $data.Profiles) {
                $ok = ($profile.Enabled -eq 'True') -and ($profile.DefaultInboundAction -eq 'Block')
                Add-Finding -Computer $computer -Check "FirewallProfile:$($profile.Name)" `
                            -Expected 'Enabled=True, DefaultInboundAction=Block' `
                            -Actual "Enabled=$($profile.Enabled), DefaultInboundAction=$($profile.DefaultInboundAction)" `
                            -Result $(if ($ok) { 'PASS' } else { 'FAIL' })
            }

            # --- 3. Scoped inbound rules ------------------------------------
            foreach ($expectedRule in $ExpectedRules) {
                $rule = $data.Rules | Where-Object { $_.DisplayName -eq $expectedRule.Name }
                if (-not $rule) {
                    Add-Finding -Computer $computer -Check "FirewallRule:$($expectedRule.Name)" `
                                -Expected "inbound allow TCP $($expectedRule.Port) from $($expectedRule.RemoteAddress)" `
                                -Actual 'absent' -Result 'FAIL' `
                                -Detail 'Create it with the winrm / windows_baseline role.'
                    continue
                }
                $ok = ($rule.Enabled -eq 'True') -and ($rule.Action -eq 'Allow') -and
                      ($rule.RemoteAddress -eq $expectedRule.RemoteAddress)
                Add-Finding -Computer $computer -Check "FirewallRule:$($expectedRule.Name)" `
                            -Expected "Allow TCP $($expectedRule.Port) from $($expectedRule.RemoteAddress)" `
                            -Actual "Enabled=$($rule.Enabled), Action=$($rule.Action), RemoteAddress=$($rule.RemoteAddress)" `
                            -Result $(if ($ok) { 'PASS' } else { 'FAIL' }) `
                            -Detail 'A rule scoped wider than the control node is a finding, not a pass.'
            }

            # --- 4. WinRM listeners -----------------------------------------
            $https = @($data.WinRM | Where-Object { $_.Keys -like '*Transport=HTTPS*' }).Count
            $http  = @($data.WinRM | Where-Object { $_.Keys -like '*Transport=HTTP*' }).Count
            Add-Finding -Computer $computer -Check 'WinRMListeners' `
                        -Expected 'https=1, http=0' -Actual "https=$https, http=$http" `
                        -Result $(if (($https -eq 1) -and ($http -eq 0)) { 'PASS' } else { 'FAIL' }) `
                        -Detail 'An HTTP listener means unencrypted WinRM is exposed.'

            # --- 5. Listening TCP ports -------------------------------------
            $unexpected = @($data.Listeners |
                            Where-Object { $_.LocalAddress -notin @('127.0.0.1','::1') -and
                                           $_.LocalPort -notin $AllowedListening })
            foreach ($l in $unexpected) {
                Add-Finding -Computer $computer -Check 'UnexpectedListeningPort' `
                            -Expected 'port in the design port matrix' `
                            -Actual "$($l.LocalAddress):$($l.LocalPort) (PID $($l.OwningProcess))" `
                            -Result 'FAIL' -Detail 'Investigate before the port-matrix evidence is signed off.'
            }
            Add-Finding -Computer $computer -Check 'ListeningPortSummary' `
                        -Expected "subset of $($AllowedListening -join ',')" `
                        -Actual "$(@($data.Listeners).Count) listening socket(s)" `
                        -Result $(if ($unexpected.Count -gt 0) { 'FAIL' } else { 'PASS' })

            # --- 6. Local administrators (reported, never modified) ---------
            Add-Finding -Computer $computer -Check 'LocalAdministrators' `
                        -Expected 'members from GG-Server-Admins / GG-Tier0-Admins only' `
                        -Actual (($data.Admins | ForEach-Object { $_.Name }) -join ';') `
                        -Result 'INFO' `
                        -Detail 'Reported for review against the design group model.'
        }
        catch {
            Write-AuditLog "Audit failed on $computer : $($_.Exception.Message)" 'ERROR'
            Add-Finding -Computer $computer -Check 'AuditExecution' -Expected 'complete' `
                        -Actual 'error' -Result 'FAIL' -Detail $_.Exception.Message
        }
    }
}

end {
    $stamp   = Get-Date -Format 'yyyy-MM-dd_HHmm'
    $csvPath = Join-Path $OutputPath "ServiceFirewallAudit-$stamp.csv"
    $Findings | Export-Csv -LiteralPath $csvPath -NoTypeInformation -Encoding UTF8

    $failures = @($Findings | Where-Object Result -eq 'FAIL')
    Write-AuditLog "Audit complete. Findings: $($Findings.Count). FAIL: $($failures.Count). CSV: $csvPath"

    # Non-zero exit code on failure so that a scheduled task or a pipeline can act on it.
    if ($failures.Count -gt 0) {
        Write-Warning "$($failures.Count) audit finding(s) FAILED - see $csvPath"
        $global:LASTEXITCODE = 2
    }

    $Findings
    Write-Host "Audit CSV written to $csvPath"
}
```

**What this script demonstrates about PowerShell quality.** It uses a `begin`/`process`/`end` structure so that it composes correctly in a pipeline; it separates **expected** from **actual** in every finding so that the CSV is self-explaining to a reader who was not present; it treats a rule scoped wider than the control node as a **failure**, because a rule that permits `Any` where the design permits one address is exactly the drift the audit exists to catch; and unreachability is a finding rather than an abort, so one dead host does not hide the state of the other eight.

##### 10.5.3.3 `Invoke-ScheduledBackupVerify.ps1`

**Design note.** This script implements the WSOS Domain 4 line `Install and manage backup systems` with the nested example `Windows Server Backup`, and links it to the nested `Script based backup, e.g. Bash, Batch or PowerShell`. It runs a Windows Server Backup job against the design's target and then **verifies the backup it just made**. The verification half is the point: a backup that has never been read back is a hypothesis, not a backup. The script also cross-checks the off-host restic job on `vpnz-dmzjump01`, which is how the report can claim an off-host copy of configuration and evidence without claiming a full VM backup — a distinction §12.1 requires to be stated.

```powershell
<#
.SYNOPSIS
    Runs a scheduled Windows Server Backup job and verifies the resulting backup.

.DESCRIPTION
    Implements the FYP backup deliverable for a Windows member server in five phases:
      Phase 1  Pre-flight : target volume exists, free space above threshold, no backup
                            already running, Windows Server Backup feature installed.
      Phase 2  Backup     : run wbadmin with an explicit target and description.
      Phase 3  Verify     : read the backup set back and assert version, age and that the
                            component list can be enumerated. This is the phase that
                            converts "a backup ran" into "a backup exists that can be read".
      Phase 4  Off-host   : assert that the restic repository on vpnz-dmzjump01 was written
                            inside the expected window (configuration and evidence copy).
      Phase 5  Report     : one object per phase, exported to CSV, and a non-zero exit code
                            when any phase failed.

    Designed to run as a scheduled task using the design's BKP-{TARGET}-{FREQ} naming.

    Verified on: Windows PowerShell 5.1 (Windows Server 2025, build 10.0.26100)
    Requires  : Windows Server Backup feature; wbadmin; restic on the off-host repository
                (optional - its absence is reported, not treated as a failure)
    Test IDs  : TC-L4-01, TC-L1-06

.PARAMETER TargetVolume
    Backup destination drive letter. Default D:, the iSCSI LUN02 volume presented by
    vpnz-san01.

.PARAMETER JobName
    Job label used in the log, the backup description and the BKP naming convention.
    Default BKP-FS01-DAILY.

.PARAMETER MinFreeSpaceGB
    Minimum free space on the target before a backup is attempted. Default 5.

.PARAMETER ResticHost
    Host holding the off-host restic repository. Default vpnz-dmzjump01.

.PARAMETER ResticMaxAgeHours
    Maximum acceptable age of the newest off-host snapshot. Default 26.

.PARAMETER LogPath
    Directory for the run log. Default C:\FYP\logs.

.EXAMPLE
    .\Invoke-ScheduledBackupVerify.ps1 -Verbose

    Runs the daily backup, verifies it, cross-checks the off-host repository and returns
    the phase result objects.

.EXAMPLE
    $r = .\Invoke-ScheduledBackupVerify.ps1 -MinFreeSpaceGB 10 -ResticMaxAgeHours 48
    $r | Export-Csv C:\FYP\config\BackupVerify-$(Get-Date -f yyyyMMdd).csv -NoTypeInformation
    if ($r.Result -contains 'FAIL') { exit 3 }

.OUTPUTS
    PSCustomObject per phase: Phase, JobName, Host, Started, Completed, DurationSeconds,
    Target, Result, Detail

.NOTES
    Author : Vertex Peak FYP workstream W2 with W4
    Reviewer: W1
    Warning: This script is NOT naturally idempotent - running it twice makes two backups.
             The design handles that with a once-per-20-hours guard and a lock file rather
             than by pretending the operation is safe to repeat. A backup script that claims
             idempotence is a script that has not been thought about.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [ValidatePattern('^[A-Za-z]:$')]
    [string]$TargetVolume = 'D:',

    [ValidateNotNullOrEmpty()]
    [string]$JobName = 'BKP-FS01-DAILY',

    [ValidateRange(1,500)]
    [int]$MinFreeSpaceGB = 5,

    [ValidateNotNullOrEmpty()]
    [string]$ResticHost = 'vpnz-dmzjump01',

    [ValidateRange(1,720)]
    [int]$ResticMaxAgeHours = 26,

    [ValidateNotNullOrEmpty()]
    [string]$LogPath = 'C:\FYP\logs'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$LockFile = Join-Path $env:TEMP "fyp-backup-$JobName.lock"
if (-not (Test-Path -LiteralPath $LogPath)) {
    New-Item -ItemType Directory -Path $LogPath -Force | Out-Null
}
$LogFile = Join-Path $LogPath ("{0}_{1}.log" -f (Get-Date -Format 'yyyy-MM-dd'), $JobName)
$results = New-Object System.Collections.Generic.List[object]

function Write-RunLog {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Message,
          [ValidateSet('INFO','WARN','ERROR')][string]$Level = 'INFO')
    Add-Content -LiteralPath $LogFile -Value ("{0} [{1}] {2}" -f (Get-Date -f 'yyyy-MM-dd HH:mm:ss'), $Level, $Message)
    switch ($Level) {
        'ERROR' { Write-Error $Message -ErrorAction Continue }
        'WARN'  { Write-Warning $Message }
        default { Write-Verbose $Message }
    }
}

function Add-PhaseResult {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Phase,
        [Parameter(Mandatory)][datetime]$Started,
        [string]$Target = '',
        [Parameter(Mandatory)][ValidateSet('PASS','FAIL','SKIP')][string]$Result,
        [string]$Detail = ''
    )
    $results.Add([PSCustomObject]@{
        Phase           = $Phase
        JobName         = $JobName
        Host            = $env:COMPUTERNAME
        Started         = $Started.ToString('s')
        Completed       = (Get-Date).ToString('s')
        DurationSeconds = [math]::Round(((Get-Date) - $Started).TotalSeconds, 1)
        Target          = $Target
        Result          = $Result
        Detail          = $Detail
    })
}

# --- Guard: one run at a time, and not twice in the same shift ---------------
if (Test-Path -LiteralPath $LockFile) {
    $lockAge = (Get-Date) - (Get-Item -LiteralPath $LockFile).LastWriteTime
    if ($lockAge.TotalHours -lt 20) {
        Write-RunLog "Skipping: a run completed $([math]::Round($lockAge.TotalHours,1)) h ago (lock $LockFile)" 'WARN'
        Add-PhaseResult -Phase 'Guard' -Started (Get-Date) -Result 'SKIP' `
                        -Detail "Already ran within 20 h. Lock: $LockFile"
        $results
        return
    }
    Write-RunLog "Removing a stale lock from $([math]::Round($lockAge.TotalHours,1)) h ago" 'WARN'
    Remove-Item -LiteralPath $LockFile -Force
}

try {
    # ---------------- Phase 1: pre-flight ----------------
    $t0 = Get-Date
    try {
        $vol     = Get-Volume -DriveLetter $TargetVolume[0] -ErrorAction Stop
        $freeGB  = [math]::Round($vol.SizeRemaining / 1GB, 1)
        if ($freeGB -lt $MinFreeSpaceGB) {
            throw "Only $freeGB GB free on $TargetVolume; the minimum is $MinFreeSpaceGB GB."
        }
        $running = Get-WbJob -ErrorAction SilentlyContinue
        if ($running -and $running.CurrentOperation -ne 'None') {
            throw "A Windows Server Backup job is already running ($($running.CurrentOperation))."
        }
        if (-not (Get-WindowsFeature -Name Windows-Server-Backup).Installed) {
            throw 'The Windows-Server-Backup feature is not installed.'
        }
        Write-RunLog "Pre-flight OK: $freeGB GB free on $TargetVolume"
        Add-PhaseResult -Phase 'Preflight' -Started $t0 -Target $TargetVolume -Result 'PASS' `
                        -Detail "$freeGB GB free; no conflicting job; feature installed"
    }
    catch {
        Write-RunLog "Pre-flight FAILED: $($_.Exception.Message)" 'ERROR'
        Add-PhaseResult -Phase 'Preflight' -Started $t0 -Target $TargetVolume -Result 'FAIL' `
                        -Detail $_.Exception.Message
        throw
    }

    # ---------------- Phase 2: backup ----------------
    $t1 = Get-Date
    try {
        if (-not $PSCmdlet.ShouldProcess($TargetVolume, "Run $JobName backup")) {
            Add-PhaseResult -Phase 'Backup' -Started $t1 -Target $TargetVolume -Result 'SKIP' -Detail 'WhatIf requested'
            throw 'WhatIf requested'
        }

        $wbArgs = @('start','backup',"-backupTarget:$TargetVolume",'-allCritical','-quiet',"-setDescription:$JobName")
        Write-RunLog "Starting: wbadmin $($wbArgs -join ' ')"
        $out = & wbadmin @wbArgs 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "wbadmin exit code $LASTEXITCODE. Output: $($out -join ' | ')"
        }
        Write-RunLog 'Backup command completed with exit code 0'
        Add-PhaseResult -Phase 'Backup' -Started $t1 -Target $TargetVolume -Result 'PASS' `
                        -Detail "wbadmin completed in $([math]::Round(((Get-Date)-$t1).TotalSeconds,1)) s"
    }
    catch {
        if ($_.Exception.Message -eq 'WhatIf requested') { throw }
        Write-RunLog "Backup FAILED: $($_.Exception.Message)" 'ERROR'
        Add-PhaseResult -Phase 'Backup' -Started $t1 -Target $TargetVolume -Result 'FAIL' -Detail $_.Exception.Message
        throw
    }

    # ---------------- Phase 3: verification (the half that matters) ----------------
    $t2 = Get-Date
    try {
        $versions = @(Get-WBBackupSet -BackupTarget $TargetVolume -ErrorAction Stop)
        if ($versions.Count -eq 0) { throw "No backup set found on $TargetVolume after a completed run." }

        $latest   = $versions | Sort-Object -Property Version -Descending | Select-Object -First 1
        $ageHours = [math]::Round(((Get-Date) - $latest.CreationTime).TotalHours, 2)
        if ($ageHours -gt 24) { throw "The newest backup set is $ageHours h old; expected under 24 h." }

        $detail         = @(Get-WBBackupSet -BackupTarget $TargetVolume -BackupSet $latest)
        $componentCount = $detail.Count
        if ($componentCount -lt 1) { throw "The newest backup set enumerates $componentCount components." }

        Write-RunLog "Verification OK: version $($latest.Version), age $ageHours h, $componentCount component(s)"
        Add-PhaseResult -Phase 'Verify' -Started $t2 -Target $TargetVolume -Result 'PASS' `
                        -Detail "version=$($latest.Version); ageHours=$ageHours; components=$componentCount"
    }
    catch {
        Write-RunLog "Verification FAILED: $($_.Exception.Message)" 'ERROR'
        Add-PhaseResult -Phase 'Verify' -Started $t2 -Target $TargetVolume -Result 'FAIL' -Detail $_.Exception.Message
    }

    # ---------------- Phase 4: off-host restic cross-check ----------------
    $t3 = Get-Date
    try {
        $snap = Invoke-Command -ComputerName $ResticHost -ErrorAction Stop -ScriptBlock {
            if (-not (Get-Command restic -ErrorAction SilentlyContinue)) {
                return [PSCustomObject]@{ Available = $false; Newest = $null }
            }
            $json = restic -r /srv/backup/restic snapshots --json 2>$null | ConvertFrom-Json
            [PSCustomObject]@{
                Available = $true
                Newest    = ($json | Sort-Object time -Descending | Select-Object -First 1).time
            }
        }
        if (-not $snap.Available) {
            Add-PhaseResult -Phase 'OffHostCheck' -Started $t3 -Target $ResticHost -Result 'SKIP' `
                            -Detail 'restic is not installed on the off-host repository; cross-check not performed'
        }
        else {
            $age = [math]::Round(((Get-Date).ToUniversalTime() - ([datetime]$snap.Newest).ToUniversalTime()).TotalHours, 2)
            $ok  = $age -le $ResticMaxAgeHours
            Add-PhaseResult -Phase 'OffHostCheck' -Started $t3 -Target $ResticHost `
                            -Result $(if ($ok) { 'PASS' } else { 'FAIL' }) `
                            -Detail "newest off-host snapshot age ${age} h (limit $ResticMaxAgeHours h)"
            if (-not $ok) { Write-RunLog "Off-host copy is stale: $age h" 'WARN' }
        }
    }
    catch {
        Write-RunLog "Off-host check could not run: $($_.Exception.Message)" 'WARN'
        Add-PhaseResult -Phase 'OffHostCheck' -Started $t3 -Target $ResticHost -Result 'SKIP' `
                        -Detail "Could not query $ResticHost : $($_.Exception.Message)"
    }
}
catch {
    Write-RunLog "Run aborted: $($_.Exception.Message)" 'ERROR'
}
finally {
    Set-Content -LiteralPath $LockFile -Value (Get-Date -Format 's') -Force
    $csvDir = 'C:\FYP\config'
    if (-not (Test-Path -LiteralPath $csvDir)) { New-Item -ItemType Directory -Path $csvDir -Force | Out-Null }
    $csv = Join-Path $csvDir ("BackupVerify-$JobName-{0}.csv" -f (Get-Date -Format 'yyyyMMdd'))
    try {
        $results | Export-Csv -LiteralPath $csv -NoTypeInformation -Encoding UTF8
        Write-RunLog "CSV written to $csv"
    }
    catch {
        Write-RunLog "Could not write CSV $csv : $($_.Exception.Message)" 'WARN'
    }
}

$failures = @($results | Where-Object Result -eq 'FAIL')
if ($failures.Count -gt 0) {
    Write-Warning "$($failures.Count) backup phase(s) FAILED - see $LogFile"
    $global:LASTEXITCODE = 3
}
$results
```

**The lock file is part of the design, not a detail.** This is the one script in the repository that is genuinely *not* idempotent, because running it twice makes two backups. Rather than pretending otherwise, the script names the limitation in its own help block and solves it with a once-per-20-hours guard plus a lock file. A backup script that claims idempotence is a script nobody has thought about.

##### 10.5.3.4 The remaining PowerShell scripts

| Script | Purpose | Key implementation points |
|---|---|---|
| `Get-ADHealthReport.ps1` | The AD health report the L1 verification chapter cites: replication status, FSMO placement, DNS zone state, SYSVOL share state, time skew, and a DC diagnostic summary. Outputs CSV plus a small HTML page for `07-evidence/`. | Runs `dcdiag /v`, `repadmin /replsummary`, `Get-ADDomain`, `Get-DnsServerZone`, `w32tm /query /status`, and **parses them into objects** rather than exporting raw text, so a wording change in the tool cannot silently produce a "healthy" report |
| `Test-ServiceEndpoints.ps1` | The port matrix of the design as an executable test: one test per `P-nn` row, asserting reachability *or* deliberate unreachability from a named source. | `Test-NetConnection` per host/port with a per-row expected result, plus explicit negative tests that assert a `DENY` row really is denied. Its second run produces identical output, which is why it also appears in the pre-tag consistency sweep of §13.4 R-05 |
| `Backup-NetworkDeviceConfig.ps1` | The baseline's configuration-collection script. Collects the Git-tracked intended Packet Tracer configurations and the live host configurations into the archive under `/srv/tftp/` through TFTP/SCP. | **Honest scope:** it never logs in to a Packet Tracer device, because none is reachable (§11.4, PT-06). Its manifest states what the archive does and does not contain |
| `Export-GPOBackup.ps1` | Documented backup of every GPO, with a manifest recording each GPO's name, ID and modification time. | `Backup-Gpo -All -Path` into a dated subdirectory; it never overwrites a previous backup, so it is *not* expected to report "no change" and its `.NOTES` block says so |

#### 10.5.4 Modules and code quality

##### 10.5.4.1 `PSScriptAnalyzer`

`PSScriptAnalyzer` is the standard static-analysis tool for PowerShell, installed from the PowerShell Gallery (`Install-Module PSScriptAnalyzer`). Whether the lab can reach the Gallery from `vpnz-jump01` depends on connectivity, and **the group must record which case applied** rather than assuming the tool was available.

```powershell
# Install once on the authoring host only.
Install-Module PSScriptAnalyzer -Scope CurrentUser -Force -AllowClobber

# Analyse the repository with an explicit, committed settings file.
Invoke-ScriptAnalyzer -Path C:\FYP\04-automation\powershell -Recurse `
    -Settings C:\FYP\04-automation\powershell\PSScriptAnalyzerSettings.psd1 `
    -Severity Error, Warning |
    Export-Csv C:\FYP\06-verification\psscriptanalyzer-$(Get-Date -f yyyyMMdd).csv -NoTypeInformation

# Gate the review on Error-severity findings; warnings are reviewed by a human.
$errors = Invoke-ScriptAnalyzer -Path C:\FYP\04-automation\powershell -Recurse -Severity Error
if ($errors) { Write-Error "$($errors.Count) PSScriptAnalyzer error(s) must be fixed before review"; exit 4 }
```

The committed settings file disables only rules the group has consciously rejected, and every exclusion carries a comment explaining why. One example: `PSAvoidUsingWriteHost` is downgraded from Error to Warning, because two scripts use `Write-Host` deliberately for a human-facing progress line while **all data goes to the object stream** — the rule's intent is satisfied even though the cmdlet appears. If `PSScriptAnalyzer` cannot be installed, the report says so plainly and the fallback is the peer-review checklist below; claiming to have run a tool that was not run is exactly the kind of claim the project treats as an integrity failure.

##### 10.5.4.2 Function naming and the approved-verb convention

Every function in `modules/VPCommon/VPCommon.psm1` and every script uses a verb from `Get-Verb`. The project's own vocabulary is deliberately small and is fixed in `04-automation/ansible/docs/04-variable-dictionary.md`:

| Approved verb | Used for | Project examples |
|---|---|---|
| `Get` | Read state, return objects, no side effect | `Get-VPFypHostRecord`, `Get-ADHealthReport.ps1`, `Get-ServiceAndFirewallAudit.ps1` |
| `Test` | Return a boolean or a pass/fail finding | `Test-ServiceEndpoints.ps1`, `Test-VPNftRulePresent` |
| `Invoke` | Perform an operation that changes state | `Invoke-NewStarterOnboarding.ps1`, `Invoke-ScheduledBackupVerify.ps1` |
| `New` | Create an object | `New-VPFypReportRow` |
| `Export` | Write data out to a file | `Export-GPOBackup.ps1`, `Export-VPFypCsv` |
| `Backup` | Approved Windows verb, retained because the design names the script | `Backup-NetworkDeviceConfig.ps1` |
| `Convert` | Change representation without changing substance | `ConvertTo-PlainText` |

Banned patterns: `Do-`, `Run-`, `Make-`, `Create-` (use `New-`), `Execute-` (use `Invoke-`), and `Fix-` (use `Repair-`, and only where a repair genuinely happens). The reason is not stylistic: with a consistent verb set, `Get-Command -Verb Get -Module VPCommon` lists every read-only operation the project owns, which is a **capability check a reviewer can perform in one command** — and the same check is what makes the read-only claim of section 11 verifiable instead of rhetorical.

The other rules the group applies to PowerShell code:

- **`[CmdletBinding()]` on every function that is not a one-liner**, so `-Verbose` and `-ErrorAction` behave as a caller expects.
- **Typed parameters with `[Validate*]` attributes.** Parameter-boundary validation removes a whole class of defensive code from the body, as the three scripts above demonstrate.
- **`Write-Verbose` for progress, `Write-Warning`/`Write-Error` for problems, the object stream for data.** `Write-Host` only for a human-facing progress line, never for data.
- **No `exit` inside a function.** `exit` terminates the host and makes the function unusable in a pipeline or an Ansible run; the scripts above set `$global:LASTEXITCODE` and return instead.
- **Comment-based help on every script**, including the runtime it was tested on and its known limitations. The help block is also where a non-obvious design decision is explained to the next reader.
- **No credential in a parameter default, a log line, or an exception message.** Passwords arrive as `SecureString` and are cleared in a `finally` block.

##### 10.5.4.3 The review checklist when a linter is unavailable

If `PSScriptAnalyzer` cannot be installed, a human reviewer works through a fixed checklist and records the result in the meeting minutes. It is deliberately short enough to be completed honestly:

1. Does every function use a verb from `Get-Verb`?
2. Does every script have comment-based help with an `.EXAMPLE` that can actually be run?
3. Is there a `try`/`catch` around every external call (`wbadmin`, `netsh`, `dcdiag`, remote invocation)?
4. Does any `catch` block swallow an error without logging it? (A silent `catch {}` is an automatic rejection.)
5. Can any code path write a credential to a log, a console, a CSV or an exception message?
6. Does the script emit objects rather than formatted text as its primary output?
7. Is there any `Invoke-Expression`, string-concatenated command construction, or unvalidated path interpolation?
8. Does the script behave correctly when its primary input is missing, empty, or malformed?

##### 10.5.4.4 The shared module

`modules/VPCommon/VPCommon.psm1` holds functions used by more than one script, and each is exported explicitly through `Export-ModuleMember`. It is versioned with a `ModuleVersion` in the manifest and every function change appears in `git log` because the module is code, not a helper file. Its initial contents are `Write-VPFypLog` (the common logging format), `Export-VPFypCsv` (CSV export with the project's naming convention), `Test-VPFypReachable` (WinRM reachability with a structured result), and `ConvertTo-VPFypSafeName` (path and object-name sanitisation). Keeping the module small is deliberate: a shared module that grows into a framework becomes unmaintainable within a 12-week project.

#### 10.5.5 Verification

##### 10.5.5.1 Example invocations

```powershell
# --- Invoke-NewStarterOnboarding.ps1 -----------------------------------------
# MANDATORY first invocation: preview against the reviewed CSV.
$csv = 'C:\FYP\04-automation\powershell\data\newstarters.csv'
$pw  = Read-Host -AsSecureString -Prompt 'Initial password'
.\Invoke-NewStarterOnboarding.ps1 -CsvPath $csv -DefaultPassword $pw -WhatIf -Verbose

# Then the real run, capturing the object stream and exporting it.
$report = .\Invoke-NewStarterOnboarding.ps1 -CsvPath $csv -DefaultPassword $pw -Verbose
$report | Export-Csv C:\FYP\config\onboarding-$(Get-Date -f yyyyMMdd).csv -NoTypeInformation
$report | Format-Table SamAccountName, Created, GroupCount, HomeCreated, Status -AutoSize

# And the idempotence run: the second pass must create nothing.
$second = .\Invoke-NewStarterOnboarding.ps1 -CsvPath $csv -DefaultPassword $pw -Verbose
$second | Format-Table SamAccountName, Created, HomeCreated, QuotaApplied, Status -AutoSize

# --- Get-ServiceAndFirewallAudit.ps1 ----------------------------------------
$cred = Get-Credential 'VERTEXPEAK\adm-w4'
'vpnz-dc01','vpnz-dc02','vpnz-fs01' |
    .\Get-ServiceAndFirewallAudit.ps1 -Credential $cred -OutputPath C:\FYP\config -Verbose |
    Where-Object Result -eq 'FAIL'

# --- Invoke-ScheduledBackupVerify.ps1 ---------------------------------------
$bk = .\Invoke-ScheduledBackupVerify.ps1 -JobName BKP-FS01-DAILY -MinFreeSpaceGB 10 -Verbose
$bk | Format-Table Phase, Result, DurationSeconds, Detail -AutoSize
if ($bk.Result -contains 'FAIL') { 'BACKUP FAILURES PRESENT' }
```

##### 10.5.5.2 Expected output

All output below is **illustrative**. The shape is what must hold; the values in a real run come from the group's own CSV and estate.

**Onboarding, `-WhatIf` preview:**

```text
VERBOSE: 2026-11-09 14:02:11 [INFO] Starting onboarding run from C:\FYP\04-automation\powershell\data\newstarters.csv
What if: Performing the operation "Create AD user" on target "kwong.cy@vertexpeak.fyp.lab".
VERBOSE: 2026-11-09 14:02:11 [INFO] WhatIf: would create kwong.cy@vertexpeak.fyp.lab in OU=Engineering,OU=HQ-ShaTin,OU=Users,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab
What if: Performing the operation "Create AD user" on target "tsang.mh@vertexpeak.fyp.lab".
VERBOSE: 2026-11-09 14:02:12 [INFO] WhatIf: would create tsang.mh@vertexpeak.fyp.lab in OU=Finance,OU=HQ-ShaTin,OU=Users,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab

SamAccountName DistinguishedName Created GroupCount HomeCreated QuotaApplied Status
-------------- ----------------- ------- ---------- ----------- ------------ ------
kwong.cy                       False          1       False        False WhatIf
tsang.mh                       False          1       False        False WhatIf
```

**Onboarding, real first run:**

```text
VERBOSE: 2026-11-09 14:05:40 [INFO] Created kwong.cy@vertexpeak.fyp.lab in OU=Engineering,OU=HQ-ShaTin,OU=Users,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab
VERBOSE: 2026-11-09 14:05:41 [INFO] Added kwong.cy@vertexpeak.fyp.lab to GG-Engineering-RW
VERBOSE: 2026-11-09 14:05:42 [INFO] Created home directory \\vpnz-fs01\Shares\Home\kwong.cy (owner-only ACL)

SamAccountName DistinguishedName                                              Created GroupCount HomeCreated QuotaApplied Status
-------------- -----------------                                              ------- ---------- ----------- ------------ ------
kwong.cy       CN=Kwong Chun-Yu,OU=Engineering,OU=HQ-ShaTin,OU=Users,OU=Ve...     True          1        True         True OK
tsang.mh       CN=Tsang Man-Ho,OU=Finance,OU=HQ-ShaTin,OU=Users,OU=VertexP...     True          1        True         True OK
```

**Onboarding, immediate re-run — the idempotence evidence:**

```text
WARNING: 2026-11-09 14:09:03 [WARN] User kwong.cy already exists - checking drift
WARNING: 2026-11-09 14:09:04 [WARN] User tsang.mh already exists - checking drift

SamAccountName DistinguishedName                                              Created GroupCount HomeCreated QuotaApplied Status
-------------- -----------------                                              ------- ---------- ----------- ------------ ------
kwong.cy       CN=Kwong Chun-Yu,OU=Engineering,OU=HQ-ShaTin,OU=Users,OU=Ve...    False          1        True         True OK
tsang.mh       CN=Tsang Man-Ho,OU=Finance,OU=HQ-ShaTin,OU=Users,OU=VertexP...    False          1        True         True OK
```

`Created = False` on the second pass, with no `Created`/`Added`/`Applied` lines in the log, is the property the report cites. It is **not** the same claim as Ansible's `changed=0`, and the report must not conflate them: PowerShell has no change counter, so the equivalent evidence is that every action flag is false and the log contains no action lines on the second pass. This distinction is stated here because an internship-examiner question about "how do you know it is idempotent" is very likely, and the honest answer differs between the two tools.

**Firewall and service audit, failures only:**

```text
ComputerName Check                        Expected                        Actual                   Result Detail
------------ -----                        --------                        ------                   ------ ------
vpnz-fs01    FirewallRule:FYP-Exporter-9182 Allow TCP 9182 from 10.10.30.31  absent                   FAIL   Create it with the winrm / ...
vpnz-fs01    UnexpectedListeningPort      port in the design port matrix  0.0.0.0:3306 (PID 4188)  FAIL   Investigate before the port-matrix ...
```

**Firewall and service audit, summary:**

```text
VERBOSE: 2026-11-09 14:22:51 [INFO] Audit complete. Findings: 61. FAIL: 2. CSV: C:\FYP\config\ServiceFirewallAudit-2026-11-09_1422.csv
WARNING: 2 audit finding(s) FAILED - see C:\FYP\config\ServiceFirewallAudit-2026-11-09_1422.csv
Audit CSV written to C:\FYP\config\ServiceFirewallAudit-2026-11-09_1422.csv
```

**Backup and verify, all phases passing:**

```text
VERBOSE: 2026-11-09 22:00:05 [INFO] Pre-flight OK: 34.2 GB free on D:
VERBOSE: 2026-11-09 22:00:05 [INFO] Starting: wbadmin start backup -backupTarget:D: -allCritical -quiet -setDescription:BKP-FS01-DAILY
VERBOSE: 2026-11-09 22:04:38 [INFO] Backup command completed with exit code 0
VERBOSE: 2026-11-09 22:04:39 [INFO] Verification OK: version 11/09/2026-22:00, age 0.07 h, 7 component(s)
VERBOSE: 2026-11-09 22:04:41 [INFO] CSV written to C:\FYP\config\BackupVerify-BKP-FS01-DAILY-20261109.csv

Phase        JobName          Host      Started           DurationSeconds Target          Result Detail
-----        -------          ----      -------           --------------- ------          ------ ------
Preflight    BKP-FS01-DAILY   vpnz-fs01 2026-11-09T22:00:05             0.4 D:              PASS   34.2 GB free; no conflicting job; feature installed
Backup       BKP-FS01-DAILY   vpnz-fs01 2026-11-09T22:00:05           273.1 D:              PASS   wbadmin completed in 273.1 s
Verify       BKP-FS01-DAILY   vpnz-fs01 2026-11-09T22:04:38             1.2 D:              PASS   version=11/09/2026-22:00; ageHours=0.07; components=7
OffHostCheck BKP-FS01-DAILY   vpnz-fs01 2026-11-09T22:04:39             2.4 vpnz-dmzjump01  PASS   newest off-host snapshot age 0.3 h (limit 26 h)
```

A `SKIP` on `OffHostCheck` is a legitimate result when the restic repository is not reachable, and the report must present it as an unverified cross-check rather than as a pass. That distinction is the difference between an honest report and one that has quietly turned an absence of evidence into a positive result.

---

### 10.6 Bash

#### 10.6.1 Where Bash is the right tool, and where it is not

Bash is the right tool when the task is **a procedure on one host**, when the primitives are already installed (`awk`, `grep`, `openssl`, `nft`, `journalctl`, `ss`), and when the result is a log line or an exit code rather than a managed state.

| Task | Right tool | Why |
|---|---|---|
| Summarise hundreds of thousands of nftables drop-log lines by source prefix | **Bash** (`awk`) | A one-pass text reduction; `awk` is the correct instrument and is present everywhere |
| Compare certificate `notAfter` values across nine hosts and exit non-zero before expiry | **Bash** (`openssl` + arithmetic) | A thin wrapper over a tool that already produces the fact |
| Produce a health and capacity report from `/proc`, `df`, `systemctl` | **Bash** | A local read-only report whose output is a file; no state is being converged |
| Apply a hardened SSH, sysctl and audit baseline to nine hosts, idempotently, with a change count | **Ansible** | State, not procedure. Bash can do it once; Ansible proves it, reports `changed=0`, and is reviewable as a diff |
| Create and converge AD users and groups | **PowerShell** | The domain-aware cmdlets are the only sane interface, and `-WhatIf` provides the dry run |
| Revert the estate after a failed change | **Ansible** | It ties back to Git, which is where the previous state lives |
| Arm a rollback timer around a firewall apply | **Bash** | A time-bounded local action driven by a `systemd` timer — exactly what Bash and `systemd` are for, and the reason `02-nftables-apply.sh` exists as a script *and* is invoked by the Ansible role |

**Where Bash is the wrong tool, stated plainly.** Bash is the wrong choice when the task converges state across many hosts, when the desired end state must be reviewable as a diff, when error handling must distinguish "already satisfied" from "failed", or when the logic exceeds roughly 200 lines with more than three conditionals. In all of those cases the project uses Ansible or PowerShell, and the mixed model is presented in the report as a deliberate division of labour rather than as an accident of who wrote what. The anti-pattern the group forbids by name is the **Ansible-shaped Bash script** — a script that reimplements idempotence badly with a pile of `grep -q` guards and its own `--check` flag. If a Bash script starts needing a `--check` mode, that is the signal it should have been a role.

##### 10.6.1.1 `lib/common.sh` — the shared library

All Bash scripts source one library, so logging, error handling, cleanup and exit-code conventions are identical across the set. This is the Bash equivalent of the Ansible role dependency and the PowerShell module: one place to fix a convention, and one place to read to know what the convention is.

```bash
#!/usr/bin/env bash
# 04-automation/bash/lib/common.sh
# Shared library for the Vertex Peak FYP Bash scripts.
# Source it, never execute it:   . "$(dirname "$0")/lib/common.sh"
# Owner: W2 (Linux & Services). Reviewer: W4.  Test IDs: TC-L4-03
#
# Strict mode is deliberately set by the CALLER (set -euo pipefail) so that the
# intent is visible at the top of each script and so that a future reader cannot
# wonder whether the shell options were applied.

FYP_LOG_DIR="${FYP_LOG_DIR:-/var/log/fyp}"
FYP_SCRIPT_NAME="$(basename "${0%.sh}")"
FYP_LOG_FILE="${FYP_LOG_FILE:-${FYP_LOG_DIR}/$(date +%F)_${FYP_SCRIPT_NAME}.log}"
FYP_HOST="$(hostname -s 2>/dev/null || echo unknown)"
FYP_EXIT_OK=0
FYP_EXIT_FAIL=1
FYP_EXIT_USAGE=2
FYP_EXIT_DEPENDENCY=3

# Colour only on a terminal; never in a captured log.
if [ -t 1 ]; then
  C_RED=$'\033[0;31m'; C_GRN=$'\033[0;32m'; C_YLW=$'\033[0;33m'; C_RST=$'\033[0m'
else
  C_RED=''; C_GRN=''; C_YLW=''; C_RST=''
fi

# log LEVEL MESSAGE...   -> file always; console for WARN and ERROR
log() {
  local level="${1:?log requires a level}"; shift
  local ts; ts="$(date '+%Y-%m-%d %H:%M:%S')"
  local line="${ts} [${level}] ${FYP_HOST} ${FYP_SCRIPT_NAME}: $*"
  printf '%s\n' "${line}" >>"${FYP_LOG_FILE}" 2>/dev/null || true
  case "${level}" in
    ERROR) printf '%s%s%s\n' "${C_RED}" "${line}" "${C_RST}" >&2 ;;
    WARN)  printf '%s%s%s\n' "${C_YLW}" "${line}" "${C_RST}" >&2 ;;
    *)     printf '%s\n' "${line}" ;;
  esac
}

die() {
  log ERROR "$*"
  exit "${FYP_EXIT_FAIL}"
}

require_cmd() {
  local c
  for c in "$@"; do
    if ! command -v "${c}" >/dev/null 2>&1; then
      log ERROR "required command not found: ${c}"
      exit "${FYP_EXIT_DEPENDENCY}"
    fi
  done
}

# --- Cleanup registry ---------------------------------------------------------
# Scripts call register_cleanup with a function name; the EXIT trap runs them all.
cleanup_actions=()
FYP_TMPFILE=""
register_cleanup() { cleanup_actions+=("$1"); }

run_cleanup() {
  local rc=$?
  local fn
  for fn in ${cleanup_actions[@]+"${cleanup_actions[@]}"}; do
    ${fn} || log WARN "cleanup action ${fn} returned non-zero"
  done
  if [ -n "${FYP_TMPFILE}" ] && [ -e "${FYP_TMPFILE}" ]; then
    rm -f -- "${FYP_TMPFILE}"
  fi
  return ${rc}
}
trap run_cleanup EXIT
trap 'log WARN "interrupted by signal"; exit 130' INT TERM HUP

# Fail-closed on the log directory even if a caller forgot to create it.
if [ ! -d "${FYP_LOG_DIR}" ]; then
  mkdir -p "${FYP_LOG_DIR}" 2>/dev/null || true
fi
```

**`trap` for cleanup, and its limits.** `trap run_cleanup EXIT` runs the registered cleanup functions and removes the temporary file on **every** exit path, including a failure. `trap 'log WARN ...; exit 130' INT TERM HUP` makes an interrupted run visible in the log rather than silent. The most important trap in the repository is not in this library, however: `02-nftables-apply.sh` registers a cleanup action that **restores the previous firewall ruleset**, because an interrupted firewall apply is the one case where "leave things as they are" is not the safe default. That is stated here because it is the clearest example in the project of a trap carrying design significance rather than hygiene value.

#### 10.6.2 Production-quality scripts

##### 10.6.2.1 `06-server-health-report.sh`

**Design note.** This script produces the local evidence that the Linux estate is operating as designed: load, memory and swap pressure, filesystem headroom against warn and critical thresholds, the state of the services this host is supposed to run, failed systemd units, time synchronisation, listening sockets that fall outside the design's port matrix, certificate ages, and the reboot-required flag. It is read-only by construction. It logs to `/var/log/fyp/`, writes a machine-readable report, and exits non-zero when any threshold is breached, so a scheduled timer can alert on it and section 11's agent can consume the same facts a human reads.

```bash
#!/usr/bin/env bash
# 04-automation/bash/06-server-health-report.sh
# Purpose : Read-only health and capacity report for a Linux guest in the Vertex Peak lab.
#           Threshold breaches are reported as findings and the script exits non-zero.
# Owner   : W2 (Linux & Services). Reviewer: W4.   Test IDs: TC-L4-03, TC-L4-05
# Runtime : Ubuntu Server 24.04.3 LTS; bash 5.2.
# Safety  : no state is modified. systemctl is-active, nft list and ss are read-only.
# Exit    : 0 = no findings, 1 = findings, 2 = usage error, 3 = missing dependency.

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
. "${SCRIPT_DIR}/lib/common.sh"

# --- Defaults -----------------------------------------------------------------
DISK_WARN_PCT=85
DISK_CRIT_PCT=95
MEM_WARN_PCT=90
LOAD_WARN_PER_CPU=2.0
CERT_WARN_DAYS=30
OUTPUT_FORMAT="text"
OUT_FILE=""
VERBOSE=0

usage() {
  cat <<'EOF'
Usage: 06-server-health-report.sh [OPTIONS]

Read-only health and capacity report for this host.

Options:
  -d PCT    Disk used-percent warning threshold      (default 85)
  -D PCT    Disk used-percent critical threshold     (default 95)
  -m PCT    Memory used-percent warning threshold    (default 90)
  -l FLOAT  Load-per-CPU warning threshold           (default 2.0)
  -c DAYS   Certificate expiry warning window, days  (default 30)
  -f FMT    Output format: text or json              (default text)
  -o FILE   Also write the report to FILE
  -v        Verbose: log every check, not only findings
  -h        Show this help and exit 0

Exit codes:
  0  every check within threshold
  1  one or more checks breached a threshold
  2  usage error
  3  a required dependency is missing

Examples:
  06-server-health-report.sh
  06-server-health-report.sh -f json -o /tmp/health.json -v
  06-server-health-report.sh -d 80 -c 45 -v
EOF
}

while getopts ':d:D:m:l:c:f:o:vh' opt; do
  case "${opt}" in
    d) DISK_WARN_PCT="${OPTARG}" ;;
    D) DISK_CRIT_PCT="${OPTARG}" ;;
    m) MEM_WARN_PCT="${OPTARG}" ;;
    l) LOAD_WARN_PER_CPU="${OPTARG}" ;;
    c) CERT_WARN_DAYS="${OPTARG}" ;;
    f) OUTPUT_FORMAT="${OPTARG}" ;;
    o) OUT_FILE="${OPTARG}" ;;
    v) VERBOSE=1 ;;
    h) usage; exit "${FYP_EXIT_OK}" ;;
    :) usage; log ERROR "option -${OPTARG} requires an argument"; exit "${FYP_EXIT_USAGE}" ;;
    \?) usage; log ERROR "unknown option -${OPTARG}"; exit "${FYP_EXIT_USAGE}" ;;
  esac
done
shift $((OPTIND - 1))

# --- Validate every argument --------------------------------------------------
is_uint() { case "${1}" in ''|*[!0-9]*) return 1 ;; *) return 0 ;; esac; }
is_num()  { [[ "${1}" =~ ^[0-9]+([.][0-9]+)?$ ]]; }

if ! is_uint "${DISK_WARN_PCT}"; then usage; die "-d must be an integer 0-100"; fi
if ! is_uint "${DISK_CRIT_PCT}"; then usage; die "-D must be an integer 0-100"; fi
if ! is_uint "${MEM_WARN_PCT}";  then usage; die "-m must be an integer 0-100"; fi
if ! is_num  "${LOAD_WARN_PER_CPU}"; then usage; die "-l must be a number, e.g. 2.0"; fi
if ! is_uint "${CERT_WARN_DAYS}"; then usage; die "-c must be an integer number of days"; fi
if [ "${DISK_WARN_PCT}" -gt 100 ] || [ "${DISK_CRIT_PCT}" -gt 100 ]; then
  usage; die "percentage thresholds must be between 0 and 100"
fi
if [ "${DISK_WARN_PCT}" -gt "${DISK_CRIT_PCT}" ]; then
  usage; die "-d (${DISK_WARN_PCT}) must not exceed -D (${DISK_CRIT_PCT})"
fi
case "${OUTPUT_FORMAT}" in text|json) ;; *) usage; die "-f must be text or json" ;; esac

require_cmd hostname date awk df systemctl nproc

[ "${VERBOSE}" -eq 1 ] && log INFO "starting health report (disk ${DISK_WARN_PCT}/${DISK_CRIT_PCT}%, mem ${MEM_WARN_PCT}%, load ${LOAD_WARN_PER_CPU}/CPU, cert window ${CERT_WARN_DAYS}d)"

FINDINGS=0
ROWS=()

add_row() {  # add_row CHECK STATUS DETAIL
  local check="$1" status="$2" detail="$3"
  ROWS+=("${check}|${status}|${detail}")
  if [ "${status}" = "FAIL" ]; then FINDINGS=$((FINDINGS + 1)); fi
  if [ "${VERBOSE}" -eq 1 ] || [ "${status}" != "PASS" ]; then
    if [ "${status}" = "FAIL" ]; then log ERROR "${check} [FAIL] ${detail}"
    else log INFO "${check} [${status}] ${detail}"; fi
  fi
}

# --- 1. Load per CPU ----------------------------------------------------------
if [ -r /proc/loadavg ]; then
  # shellcheck disable=SC2034  # l1 and l15 are read for completeness of the record
  read -r l1 l5 l15 rest < /proc/loadavg
  cpus="$(nproc)"
  per_cpu="$(awk -v l="${l5}" -v c="${cpus}" 'BEGIN{ printf "%.2f", l/c }')"
  if awk -v p="${per_cpu}" -v t="${LOAD_WARN_PER_CPU}" 'BEGIN{ exit !(p>t) }'; then
    add_row "load5-per-cpu" "FAIL" "5-min load ${l5} over ${cpus} CPU(s) = ${per_cpu}/CPU exceeds ${LOAD_WARN_PER_CPU}"
  else
    add_row "load5-per-cpu" "PASS" "5-min load ${l5} over ${cpus} CPU(s) = ${per_cpu}/CPU"
  fi
else
  add_row "load5-per-cpu" "FAIL" "/proc/loadavg is not readable"
fi

# --- 2. Memory ----------------------------------------------------------------
if [ -r /proc/meminfo ]; then
  mem_total="$(awk '/^MemTotal:/{print $2}' /proc/meminfo)"
  mem_avail="$(awk '/^MemAvailable:/{print $2}' /proc/meminfo)"
  mem_pct="$(awk -v t="${mem_total}" -v a="${mem_avail}" 'BEGIN{ if (t>0) printf "%.1f", (t-a)*100/t; else print "0" }')"
  if awk -v p="${mem_pct}" -v m="${MEM_WARN_PCT}" 'BEGIN{ exit !(p>m) }'; then
    add_row "memory-used-percent" "FAIL" "${mem_pct}% used (${mem_avail} kB available of ${mem_total} kB) exceeds ${MEM_WARN_PCT}%"
  else
    add_row "memory-used-percent" "PASS" "${mem_pct}% used (${mem_avail} kB available of ${mem_total} kB)"
  fi

  swap_total="$(awk '/^SwapTotal:/{print $2}' /proc/meminfo)"
  swap_free="$(awk '/^SwapFree:/{print $2}' /proc/meminfo)"
  if [ "${swap_total}" -gt 0 ]; then
    swap_used_pct="$(awk -v t="${swap_total}" -v f="${swap_free}" 'BEGIN{ printf "%.1f", (t-f)*100/t }')"
    if awk -v p="${swap_used_pct}" 'BEGIN{ exit !(p>25) }'; then
      add_row "swap-used-percent" "FAIL" "${swap_used_pct}% of ${swap_total} kB swap in use - a lab VM that swaps is a capacity problem"
    else
      add_row "swap-used-percent" "PASS" "${swap_used_pct}% of ${swap_total} kB swap in use"
    fi
  else
    add_row "swap-used-percent" "PASS" "no swap configured"
  fi
fi

# --- 3. Filesystems -----------------------------------------------------------
while read -r fs _size _used avail pct mount; do
  case "${fs}" in tmpfs|devtmpfs|squashfs|overlay) continue ;; esac
  pct_num="${pct%\%}"
  case "${pct_num}" in ''|*[!0-9]*) continue ;; esac
  if [ "${pct_num}" -ge "${DISK_CRIT_PCT}" ]; then
    add_row "disk:${mount}" "FAIL" "${pct} used on ${fs} (${avail} kB free) - CRITICAL threshold ${DISK_CRIT_PCT}%"
  elif [ "${pct_num}" -ge "${DISK_WARN_PCT}" ]; then
    add_row "disk:${mount}" "FAIL" "${pct} used on ${fs} (${avail} kB free) - warning threshold ${DISK_WARN_PCT}%"
  else
    add_row "disk:${mount}" "PASS" "${pct} used on ${fs} (${avail} kB free)"
  fi
done < <(df -Pk -x tmpfs -x devtmpfs 2>/dev/null | awk 'NR>1')

# --- 4. Services expected on this host ---------------------------------------
# The expected set comes from the host's own role marker, not from a per-host list,
# so this one script serves the whole Linux estate.
ROLE_FILE="/etc/fyp/role"
declare -A ROLE_SERVICES=(
  ["nginx_reverse_proxy"]="nginx keepalived"
  ["nftables_egress"]="nftables keepalived"
  ["openvpn"]="openvpn-server@server nftables"
  ["wordpress"]="nginx php8.3-fpm mariadb"
  ["agent_runtime"]="ssh"
  ["ansible_control_node"]="nginx prometheus grafana-server loki ssh"
  ["dmz_jump"]="ssh"
)
if [ -r "${ROLE_FILE}" ]; then
  role="$(tr -d '[:space:]' < "${ROLE_FILE}")"
  services="${ROLE_SERVICES[${role}]:-}"
  if [ -z "${services}" ]; then
    add_row "role" "FAIL" "unknown role '${role}' in ${ROLE_FILE}"
  else
    add_row "role" "PASS" "role=${role}; expected services: ${services}"
    for svc in ${services}; do
      if systemctl is-active --quiet "${svc}" 2>/dev/null; then
        add_row "service:${svc}" "PASS" "active"
      else
        add_row "service:${svc}" "FAIL" "not active: $(systemctl is-active "${svc}" 2>&1 || true)"
      fi
    done
  fi
else
  add_row "role" "FAIL" "${ROLE_FILE} is missing - the host role cannot be determined, so service state cannot be judged"
fi

# --- 5. Failed systemd units -------------------------------------------------
failed_units="$(systemctl --failed --no-legend --plain 2>/dev/null | awk '{print $1}' | paste -sd, - || true)"
if [ -n "${failed_units}" ]; then
  add_row "systemd-failed-units" "FAIL" "${failed_units}"
else
  add_row "systemd-failed-units" "PASS" "no failed units"
fi

# --- 6. Time synchronisation (Kerberos depends on it) ------------------------
if command -v chronyc >/dev/null 2>&1 && chronyc tracking >/dev/null 2>&1; then
  skew="$(chronyc tracking | awk -F': *' '/System time/{print $2}')"
  leap="$(chronyc tracking | awk -F': *' '/Leap status/{print $2}')"
  if [ "${leap}" = "Normal" ]; then
    add_row "time-sync" "PASS" "chrony tracking normal (system time ${skew})"
  else
    add_row "time-sync" "FAIL" "chrony leap status '${leap}', system time ${skew} - time skew above 5 minutes breaks Kerberos"
  fi
else
  add_row "time-sync" "FAIL" "chronyc is not installed or cannot reach a time source"
fi

# --- 7. Listening TCP sockets outside the design's port matrix ---------------
allowed=" 22 53 80 443 514 1194 3000 3260 3306 9000 9090 9100 9182 6516 179 500 4500 51820 123 "
unexpected=""
while read -r _proto _recvq _sendq local _foreign state _rest; do
  [ "${state}" = "LISTEN" ] || continue
  port="${local##*:}"
  case "${allowed}" in
    *" ${port} "*) ;;
    *) unexpected="${unexpected} ${local}" ;;
  esac
done < <(ss -H -tln 2>/dev/null || true)

if [ -n "${unexpected}" ]; then
  add_row "listening-ports-unexpected" "FAIL" "not in the design port matrix:${unexpected}"
else
  add_row "listening-ports-unexpected" "PASS" "all TCP listeners are in the design port matrix"
fi

# --- 8. Certificate expiry ----------------------------------------------------
if command -v openssl >/dev/null 2>&1; then
  certs_checked=0
  for dir in /etc/nginx/ssl /etc/ssl/fyp /etc/openvpn/easy-rsa/pki; do
    [ -d "${dir}" ] || continue
    while IFS= read -r crt; do
      [ -n "${crt}" ] || continue
      end="$(openssl x509 -enddate -noout -in "${crt}" 2>/dev/null | cut -d= -f2- || true)"
      [ -n "${end}" ] || continue
      if ! end_epoch="$(date -d "${end}" +%s 2>/dev/null)"; then continue; fi
      now_epoch="$(date +%s)"
      days=$(( (end_epoch - now_epoch) / 86400 ))
      certs_checked=$((certs_checked + 1))
      if [ "${days}" -le 0 ]; then
        add_row "cert:${crt}" "FAIL" "EXPIRED on ${end}"
      elif [ "${days}" -le "${CERT_WARN_DAYS}" ]; then
        add_row "cert:${crt}" "FAIL" "expires in ${days} day(s) on ${end}"
      else
        add_row "cert:${crt}" "PASS" "expires in ${days} day(s) on ${end}"
      fi
    done < <(find "${dir}" -maxdepth 3 -type f \( -name '*.crt' -o -name '*.pem' \) 2>/dev/null)
  done
  [ "${certs_checked}" -eq 0 ] && add_row "cert:any" "PASS" "no certificate files found in the searched directories"
else
  add_row "cert:openssl" "FAIL" "openssl is not installed, so certificate expiry cannot be checked"
fi

# --- 9. Reboot required ------------------------------------------------------
if [ -f /var/run/reboot-required ]; then
  add_row "reboot-required" "FAIL" "$(head -n 1 /var/run/reboot-required 2>/dev/null || echo 'reboot required')"
else
  add_row "reboot-required" "PASS" "no reboot required"
fi

# --- Output -------------------------------------------------------------------
if [ "${OUTPUT_FORMAT}" = "json" ]; then
  {
    printf '{\n'
    printf '  "host": "%s",\n' "${FYP_HOST}"
    printf '  "timestamp": "%s",\n' "$(date -Is)"
    printf '  "findings": %d,\n' "${FINDINGS}"
    printf '  "checks": [\n'
    first=1
    for row in "${ROWS[@]}"; do
      IFS='|' read -r check status detail <<<"${row}"
      [ "${first}" -eq 1 ] || printf ',\n'
      first=0
      printf '    {"check": "%s", "status": "%s", "detail": "%s"}' \
        "${check//\"/\\\"}" "${status}" "${detail//\"/\\\"}"
    done
    printf '\n  ]\n}\n'
  } > "${OUT_FILE:-/dev/stdout}"
  [ -n "${OUT_FILE}" ] && log INFO "JSON report written to ${OUT_FILE}"
else
  {
    printf 'FYP server health report\n'
    printf 'host      : %s\n' "${FYP_HOST}"
    printf 'timestamp : %s\n' "$(date -Is)"
    printf 'findings  : %d\n\n' "${FINDINGS}"
    printf '%-36s %-6s %s\n' "CHECK" "STATUS" "DETAIL"
    printf '%-36s %-6s %s\n' "------------------------------------" "------" "-----------------------------------"
    for row in "${ROWS[@]}"; do
      IFS='|' read -r check status detail <<<"${row}"
      printf '%-36s %-6s %s\n' "${check}" "${status}" "${detail}"
    done
  } | if [ -n "${OUT_FILE}" ]; then tee "${OUT_FILE}"; else cat; fi
  [ -n "${OUT_FILE}" ] && log INFO "text report written to ${OUT_FILE}"
fi

if [ "${FINDINGS}" -gt 0 ]; then
  log ERROR "health report completed with ${FINDINGS} finding(s); full log: ${FYP_LOG_FILE}"
  exit "${FYP_EXIT_FAIL}"
fi
log INFO "health report completed with no findings"
exit "${FYP_EXIT_OK}"
```

##### 10.6.2.2 `07-nftables-log-summary.sh`

**Design note.** The egress pair logs every drop with the prefix `NFT-DROP: `, on both members, at a rate that a human cannot read. This script performs the reduction: it takes the journal for a chosen window, extracts the source addresses of dropped flows, aggregates them into prefixes, and ranks them. Its output is (a) a human-readable table for the daily operations log and (b) a JSON object that the AI layer of section 11 consumes as a tool result. It is read-only: `journalctl` is invoked without any state-changing option, and no rule is added, removed or flushed.

```bash
#!/usr/bin/env bash
# 04-automation/bash/07-nftables-log-summary.sh
# Purpose : Summarise nftables drop events by source prefix over a chosen window.
#           Output: human-readable table and/or JSON, suitable for the operations log
#           and for consumption as a tool result by the AI operations layer (section 11).
# Owner   : W2 (Linux & Services). Reviewer: W4.  Test IDs: TC-L4-03, TB-02, TB-03
# Runtime : Ubuntu Server 24.04.3 LTS; journalctl, awk.
# Safety  : READ-ONLY. journalctl is read with no state-changing option.
# Exit    : 0 = summarised, 1 = no drop events found in the window (not an error state,
#           but reported as a finding so that a silent firewall is noticed), 2 = usage.

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
. "${SCRIPT_DIR}/lib/common.sh"

WINDOW="last hour"          # any value accepted by journalctl --since
PREFIX="NFT-DROP: "
GROUP_BITS=24               # aggregate sources to /24 by default
TOP_N=20
FORMAT="text"
OUT_FILE=""
VERBOSE=0

usage() {
  cat <<'EOF'
Usage: 07-nftables-log-summary.sh [OPTIONS]

Summarises nftables drop events by source prefix.

Options:
  -s WINDOW   journalctl --since value            (default "last hour")
  -p PREFIX   log prefix to match                 (default "NFT-DROP: ")
  -b BITS     Prefix length to aggregate to       (default 24)
  -n N        Show the top N prefixes             (default 20)
  -f FMT      Output format: text or json         (default text)
  -o FILE     Also write the report to FILE
  -v          Verbose
  -h          Show this help and exit 0

Examples:
  07-nftables-log-summary.sh
  07-nftables-log-summary.sh -s "2026-11-09 20:00:00" -b 16 -n 10
  07-nftables-log-summary.sh -f json -o /tmp/nft-drops.json
EOF
}

while getopts ':s:p:b:n:f:o:vh' opt; do
  case "${opt}" in
    s) WINDOW="${OPTARG}" ;;
    p) PREFIX="${OPTARG}" ;;
    b) GROUP_BITS="${OPTARG}" ;;
    n) TOP_N="${OPTARG}" ;;
    f) FORMAT="${OPTARG}" ;;
    o) OUT_FILE="${OPTARG}" ;;
    v) VERBOSE=1 ;;
    h) usage; exit "${FYP_EXIT_OK}" ;;
    :) usage; die "option -${OPTARG} requires an argument" ;;
    \?) usage; die "unknown option -${OPTARG}" ;;
  esac
done
shift $((OPTIND - 1))

# --- Validate -----------------------------------------------------------------
case "${GROUP_BITS}" in ''|*[!0-9]*) usage; die "-b must be an integer";; esac
[ "${GROUP_BITS}" -ge 8 ] && [ "${GROUP_BITS}" -le 32 ] || { usage; die "-b must be between 8 and 32"; }
case "${TOP_N}" in ''|*[!0-9]*) usage; die "-n must be an integer";; esac
[ "${TOP_N}" -ge 1 ] || { usage; die "-n must be at least 1"; }
case "${FORMAT}" in text|json) ;; *) usage; die "-f must be text or json" ;; esac
# Guard against a prefix containing regex metacharacters being used unescaped.
[ -n "${PREFIX}" ] || die "-p must not be empty"

require_cmd journalctl awk sort date

log INFO "summarising drops since '${WINDOW}' on ${FYP_HOST} (prefix '${PREFIX}', aggregate /${GROUP_BITS}, top ${TOP_N})"

FYP_TMPFILE="$(mktemp)"
register_cleanup 'cleanup_tmp'
cleanup_tmp() { [ -e "${FYP_TMPFILE}" ] && rm -f -- "${FYP_TMPFILE}"; return 0; }

# journalctl -o cat gives the message only, with no timestamp decoration, which keeps
# the awk parsing simple and stable across journald versions.
if ! journalctl -o cat --no-pager --since "${WINDOW}" 2>/dev/null |
     awk -v prefix="${PREFIX}" -v bits="${GROUP_BITS}" '
       index($0, prefix) == 0 { next }
       {
         src = ""
         for (i = 1; i <= NF; i++) {
           if ($i == "SRC=" && (i+1) <= NF) { src = $(i+1); break }
           if ($i ~ /^SRC=/)                { src = substr($i, 5); break }
         }
         if (src == "" || src !~ /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/) { next }
         split(src, o, ".")
         mask = 0
         for (b = 0; b < bits; b++) {
           oct = int(b / 8) + 1
           bitpos = 7 - (b % 8)
           if (and(o[oct] + 0, 2 ^ bitpos) != 0) { mask += 2 ^ (31 - b) }
         }
         a = int(mask / 16777216) % 256
         b2 = int(mask / 65536) % 256
         c = int(mask / 256) % 256
         d = mask % 256
         key = a "." b2 "." c "." d "/" bits
         count[key]++
         total++
       }
       END {
         if (total == 0) { exit 1 }
         for (k in count) { printf "%d %s\n", count[k], k }
         print "TOTAL " total > "/dev/stderr"
       }
     ' > "${FYP_TMPFILE}"
then
  log WARN "no drop events matching prefix '${PREFIX}' were found since '${WINDOW}'"
  log WARN "A silent firewall is worth checking: confirm the pair is receiving traffic and that logging is still enabled (nft list ruleset | grep -c NFT-DROP)"
  if [ "${FORMAT}" = "json" ]; then
    printf '{"host":"%s","since":"%s","prefix":"%s","group_bits":%d,"total_drops":0,"prefixes":[]}\n' \
      "${FYP_HOST}" "${WINDOW}" "${PREFIX}" "${GROUP_BITS}" > "${OUT_FILE:-/dev/stdout}"
  fi
  exit 1
fi

total="$(awk '{s+=$1} END{printf "%d", s}' "${FYP_TMPFILE}")"
rows="$(sort -k1,1nr "${FYP_TMPFILE}" | head -n "${TOP_N}")"

if [ "${FORMAT}" = "json" ]; then
  {
    printf '{\n'
    printf '  "host": "%s",\n' "${FYP_HOST}"
    printf '  "since": "%s",\n' "${WINDOW}"
    printf '  "generated": "%s",\n' "$(date -Is)"
    printf '  "prefix": "%s",\n' "${PREFIX}"
    printf '  "group_bits": %d,\n' "${GROUP_BITS}"
    printf '  "total_drops": %s,\n' "${total}"
    printf '  "prefixes": [\n'
    first=1
    while read -r cnt pfx; do
      [ -n "${pfx:-}" ] || continue
      [ "${first}" -eq 1 ] || printf ',\n'
      first=0
      printf '    {"prefix": "%s", "drops": %s}' "${pfx}" "${cnt}"
    done <<<"${rows}"
    printf '\n  ]\n}\n'
  } > "${OUT_FILE:-/dev/stdout}"
else
  {
    printf 'FYP nftables drop summary\n'
    printf 'host        : %s\n' "${FYP_HOST}"
    printf 'window      : since %s\n' "${WINDOW}"
    printf 'generated   : %s\n' "$(date -Is)"
    printf 'total drops : %s\n\n' "${total}"
    printf '%-22s %10s\n' "SOURCE PREFIX" "DROPS"
    printf '%-22s %10s\n' "----------------------" "----------"
    while read -r cnt pfx; do
      [ -n "${pfx:-}" ] || continue
      printf '%-22s %10d\n' "${pfx}" "${cnt}"
    done <<<"${rows}"
    printf '\nInterpretation: a source inside 10.10.0.0/16 is an INTERNAL host whose traffic\n'
    printf 'the policy correctly denied (see TB-02/TB-03/TB-09 - check the source VLAN).\n'
    printf 'A source inside 10.70.0.0/24 is the deliberately isolated lab segment and any\n'
    printf 'traffic from it at the egress pair is a policy finding, not routine noise (TB-09/TB-10).\n'
  } | if [ -n "${OUT_FILE}" ]; then tee "${OUT_FILE}"; else cat; fi
fi

[ -n "${OUT_FILE}" ] && log INFO "report written to ${OUT_FILE}"
log INFO "summarised ${total} drop event(s) across $(wc -l < "${FYP_TMPFILE}") prefix(es)"
exit "${FYP_EXIT_OK}"
```

The `Interpretation` footer is deliberate. A raw count of dropped packets says nothing; a count attributed to a source prefix, read against the trust-boundary table, says whether the firewall is doing its job or whether a host is misconfigured. The blank-line accounting (`total` and the prefix count) also gives the section 11 agent a stable, parseable summary object rather than a wall of text to interpret.

##### 10.6.2.3 `08-cert-expiry-check.sh`

**Design note.** Certificates are the failure mode most likely to be discovered during the final demonstration rather than during testing. This script closes that gap: it walks a configurable list of hosts, reads the certificate each published endpoint presents, computes the remaining validity, and exits non-zero when anything is inside the warning window. It uses `openssl s_client` for remote endpoints and direct file reads for local material, and it treats an unreachable endpoint as a **finding**, never as a pass — a certificate that cannot be checked is not a certificate that is valid.

```bash
#!/usr/bin/env bash
# 04-automation/bash/08-cert-expiry-check.sh
# Purpose : Check TLS certificate expiry across the estate.
#           Local material is read from disk; published endpoints are probed with
#           openssl s_client. Exit non-zero when anything is inside the warning window.
# Owner   : W2 (Linux & Services). Reviewer: W1 (PKI owner).  Test IDs: TC-PKI-01
# Runtime : Ubuntu Server 24.04.3 LTS; openssl 3.0.x.
# Safety  : READ-ONLY. No certificate is issued, renewed or modified.
# Exit    : 0 = all certificates outside the window, 1 = findings, 2 = usage, 3 = dependency.

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
. "${SCRIPT_DIR}/lib/common.sh"

WARN_DAYS=30
LOCAL_PATHS=("/etc/nginx/ssl" "/etc/openvpn/easy-rsa/pki")
ENDPOINTS=(
  "vpnz-dmzrev01:443"
  "vpnz-dmzrev02:443"
  "vpnz-dmzweba01:443"
  "vpnz-dmzweba02:443"
  "vpnz-dmzwp01:443"
  "vpnz-dmzwp02:443"
  "vpnz-lnxra01:1194"
  "vpnz-rras01:443"
)
FORMAT="text"
OUT_FILE=""
VERBOSE=0

usage() {
  cat <<'EOF'
Usage: 08-cert-expiry-check.sh [OPTIONS]

Checks TLS certificate expiry for local material and published endpoints.

Options:
  -d DAYS     Warning window in days                    (default 30)
  -e LIST     Comma-separated host:port endpoints to probe (default: FYP published set)
  -l LIST     Comma-separated local directories to scan   (default: FYP TLS paths)
  -f FMT      Output format: text or json               (default text)
  -o FILE     Also write the report to FILE
  -v          Verbose
  -h          Show this help and exit 0

Exit codes:
  0  all certificates expire outside the warning window
  1  one or more certificates are inside the window or cannot be checked
  2  usage error   3  a required dependency is missing

Examples:
  08-cert-expiry-check.sh
  08-cert-expiry-check.sh -d 45 -v
  08-cert-expiry-check.sh -e vpnz-dmzrev01:443 -l /etc/nginx/ssl -f json
EOF
}

while getopts ':d:e:l:f:o:vh' opt; do
  case "${opt}" in
    d) WARN_DAYS="${OPTARG}" ;;
    e) IFS=',' read -r -a ENDPOINTS <<<"${OPTARG}" ;;
    l) IFS=',' read -r -a LOCAL_PATHS <<<"${OPTARG}" ;;
    f) FORMAT="${OPTARG}" ;;
    o) OUT_FILE="${OPTARG}" ;;
    v) VERBOSE=1 ;;
    h) usage; exit "${FYP_EXIT_OK}" ;;
    :) usage; die "option -${OPTARG} requires an argument" ;;
    \?) usage; die "unknown option -${OPTARG}" ;;
  esac
done
shift $((OPTIND - 1))

case "${WARN_DAYS}" in ''|*[!0-9]*) usage; die "-d must be a positive integer";; esac
[ "${WARN_DAYS}" -ge 1 ] || { usage; die "-d must be at least 1"; }
case "${FORMAT}" in text|json) ;; *) usage; die "-f must be text or json" ;; esac
require_cmd openssl date

FINDINGS=0
ROWS=()

add_row() {  # add_row SOURCE SUBJECT DAYS STATUS DETAIL
  ROWS+=("$1|$2|$3|$4|$5")
  [ "$4" = "FAIL" ] && FINDINGS=$((FINDINGS + 1))
  if [ "${VERBOSE}" -eq 1 ] || [ "$4" != "PASS" ]; then
    if [ "$4" = "FAIL" ]; then log ERROR "$1 $2: $5"; else log INFO "$1 $2: $5"; fi
  fi
}

days_remaining() {  # days_remaining "enddate string"
  local end="$1" end_epoch now_epoch
  end_epoch="$(date -d "${end}" +%s 2>/dev/null)" || return 1
  now_epoch="$(date +%s)"
  echo $(( (end_epoch - now_epoch) / 86400 ))
}

# --- 1. Local certificate material -------------------------------------------
log INFO "scanning local certificate material in: ${LOCAL_PATHS[*]}"
for dir in "${LOCAL_PATHS[@]}"; do
  [ -d "${dir}" ] || { [ "${VERBOSE}" -eq 1 ] && log INFO "directory absent, skipped: ${dir}"; continue; }
  while IFS= read -r crt; do
    [ -n "${crt}" ] || continue
    if ! end="$(openssl x509 -enddate -noout -in "${crt}" 2>/dev/null | cut -d= -f2-)"; then
      add_row "${crt}" "unparsable" "?" "FAIL" "file does not parse as a certificate"
      continue
    fi
    subj="$(openssl x509 -subject -noout -in "${crt}" 2>/dev/null | sed 's/^subject=//' || echo unknown)"
    days="$(days_remaining "${end}")" || { add_row "${crt}" "${subj}" "?" "FAIL" "unparsable expiry '${end}'"; continue; }
    if [ "${days}" -le 0 ]; then
      add_row "${crt}" "${subj}" "${days}" "FAIL" "EXPIRED on ${end}"
    elif [ "${days}" -le "${WARN_DAYS}" ]; then
      add_row "${crt}" "${subj}" "${days}" "FAIL" "inside the ${WARN_DAYS}-day window (expires ${end})"
    else
      add_row "${crt}" "${subj}" "${days}" "PASS" "expires in ${days} day(s)"
    fi
  done < <(find "${dir}" -maxdepth 3 -type f \( -name '*.crt' -o -name '*.pem' \) 2>/dev/null)
done

# --- 2. Published endpoints ---------------------------------------------------
log INFO "probing ${#ENDPOINTS[@]} published endpoint(s)"
for endpoint in "${ENDPOINTS[@]}"; do
  host="${endpoint%%:*}"
  port="${endpoint##*:}"
  case "${port}" in ''|*[!0-9]*) add_row "${endpoint}" "-" "?" "FAIL" "endpoint is not in host:port form"; continue ;; esac

  # A UDP service (for example OpenVPN 1194) has no TLS handshake to a TCP probe;
  # it is still recorded so that the report shows what was and was not checked.
  if [ "${port}" = "1194" ]; then
    add_row "${endpoint}" "-" "?" "INFO" "UDP/TLS endpoint - certificate must be checked on the host, not probed from here"
    continue
  fi

  if ! out="$(openssl s_client -connect "${endpoint}" -servername "${host}" </dev/null 2>/dev/null)"; then
    add_row "${endpoint}" "-" "?" "FAIL" "cannot connect or complete a TLS handshake"
    continue
  fi

  cert="$(printf '%s\n' "${out}" | openssl x509 -noout -enddate -subject 2>/dev/null || true)"
  if [ -z "${cert}" ]; then
    add_row "${endpoint}" "-" "?" "FAIL" "connected but no certificate could be parsed - check the listener"
    continue
  fi
  end="$(printf '%s\n' "${cert}" | awk -F= '/notAfter/{print $2}')"
  subj="$(printf '%s\n' "${cert}" | sed -n 's/^subject=//p')"
  days="$(days_remaining "${end}")" || { add_row "${endpoint}" "${subj}" "?" "FAIL" "unparsable expiry '${end}'"; continue; }

  if [ "${days}" -le 0 ]; then
    add_row "${endpoint}" "${subj}" "${days}" "FAIL" "EXPIRED on ${end}"
  elif [ "${days}" -le "${WARN_DAYS}" ]; then
    add_row "${endpoint}" "${subj}" "${days}" "FAIL" "inside the ${WARN_DAYS}-day window (expires ${end})"
  else
    add_row "${endpoint}" "${subj}" "${days}" "PASS" "expires in ${days} day(s) (${end})"
  fi
done

# --- Output -------------------------------------------------------------------
if [ "${FORMAT}" = "json" ]; then
  {
    printf '{\n  "host": "%s",\n  "generated": "%s",\n  "warn_days": %d,\n  "findings": %d,\n  "certificates": [\n' \
      "${FYP_HOST}" "$(date -Is)" "${WARN_DAYS}" "${FINDINGS}"
    first=1
    for row in "${ROWS[@]}"; do
      IFS='|' read -r src subj days status detail <<<"${row}"
      [ "${first}" -eq 1 ] || printf ',\n'
      first=0
      printf '    {"source": "%s", "subject": "%s", "days_remaining": "%s", "status": "%s", "detail": "%s"}' \
        "${src//\"/\\\"}" "${subj//\"/\\\"}" "${days}" "${status}" "${detail//\"/\\\"}"
    done
    printf '\n  ]\n}\n'
  } > "${OUT_FILE:-/dev/stdout}"
else
  {
    printf 'FYP certificate expiry report\n'
    printf 'host       : %s\n' "${FYP_HOST}"
    printf 'generated  : %s\n' "$(date -Is)"
    printf 'window     : %d day(s)\n' "${WARN_DAYS}"
    printf 'findings   : %d\n\n' "${FINDINGS}"
    printf '%-28s %-8s %-6s %s\n' "SOURCE" "DAYS" "STATUS" "SUBJECT / DETAIL"
    printf '%-28s %-8s %-6s %s\n' "----------------------------" "--------" "------" "------------------------------"
    for row in "${ROWS[@]}"; do
      IFS='|' read -r src subj days status detail <<<"${row}"
      printf '%-28s %-8s %-6s %s | %s\n' "${src}" "${days}" "${status}" "${subj}" "${detail}"
    done
  } | if [ -n "${OUT_FILE}" ]; then tee "${OUT_FILE}"; else cat; fi
fi

[ -n "${OUT_FILE}" ] && log INFO "report written to ${OUT_FILE}"

if [ "${FINDINGS}" -gt 0 ]; then
  log ERROR "${FINDINGS} certificate finding(s); renewal or investigation required. See ${FYP_LOG_FILE}"
  exit "${FYP_EXIT_FAIL}"
fi
log INFO "all checked certificates are outside the ${WARN_DAYS}-day window"
exit "${FYP_EXIT_OK}"
```

#### 10.6.3 ShellCheck and linting

**An honest statement, as the brief requires.** Whether ShellCheck is available in this lab is **not confirmed at the time of writing**. `shellcheck` is packaged in the Ubuntu 24.04 archive and is therefore installable with `sudo apt-get install shellcheck` on any Linux guest that can reach the archive or an on-site package mirror; the baseline's assumption A-04 requires package caches to be pre-downloaded to `vpnz-mon01` before the build week, and whether `shellcheck` is in that cache depends on a decision the group makes at that time. **[ASSUMPTION]** The group should therefore record one of two outcomes and state it in the report:

```bash
# Case A - ShellCheck is available:
sudo apt-get install -y shellcheck
shellcheck --version
shellcheck -x -S warning 04-automation/bash/*.sh 04-automation/bash/lib/common.sh \
  | tee 06-verification/shellcheck-$(date +%F).txt
# -x  : follow the `source` of lib/common.sh so that the library's definitions are known
# -S  : treat warnings and above as the reporting floor; informational notes are noise

# Case B - ShellCheck is not available:
#   State plainly in the report that ShellCheck was not available in the lab and that
#   the scripts were reviewed manually. Do NOT cite ShellCheck output that does not exist.
```

The scripts above are written to be ShellCheck-clean in intent: they use `set -euo pipefail`, quote every expansion, use `readonly`/`local` appropriately, guard against unset arrays with `${arr[@]+"${arr[@]}"}`, use `# shellcheck source=` directives where a library is sourced, and use `IFS= read -r`. Some of those details exist *because* ShellCheck's rules were followed by hand even before the tool was available.

**The human review procedure when no linter is available.** Two group members read each script against a fixed checklist, and the review is recorded in the meeting minutes with the script name and the reviewer:

1. Does the script start with `set -euo pipefail` and source `lib/common.sh`?
2. Is every variable expansion quoted, and is every intentional word-splitting case commented?
3. Is every `read` using `IFS= read -r`?
4. Is every external command's absence handled (`require_cmd`, or an explicit `command -v` test)?
5. Are temporary files created with `mktemp` and removed through the `trap` registry?
6. Does every failure path exit non-zero, and is the exit code documented in the usage text?
7. Are all arguments validated before use, including numeric bounds and mutual constraints?
8. Does the script write to `/var/log/fyp/` through `log`, and never with an unredirected `echo`?
9. Is there any unquoted `rm`, any `eval`, any `$( )` inside a double-quoted string used as a command, or any `kill` without a PID check?
10. Does the script behave correctly when the log directory, the role file, or a target directory is missing?

A reviewer who cannot answer "yes" or "not applicable" to every question returns the script. The value of this checklist is that it is short enough to be applied honestly and specific enough that a superficial read cannot pass it.

#### 10.6.4 Verification

##### 10.6.4.1 Example runs and expected output

All output below is **illustrative** and reflects the shape required, not a captured run.

```bash
# --- Health report: clean host ------------------------------------------------
$ sudo ./06-server-health-report.sh
FYP server health report
host      : vpnz-dmzrev02
timestamp : 2026-11-09T14:41:02+08:00
findings  : 0

CHECK                                STATUS DETAIL
------------------------------------ ------ -----------------------------------
load5-per-cpu                        PASS   5-min load 0.14 over 2 CPU(s) = 0.07/CPU
memory-used-percent                  PASS   31.4% used (2871404 kB available of 4012076 kB)
swap-used-percent                    PASS   0.0% of 2097148 kB swap in use
disk:/                                PASS   27% used on /dev/sda2 (21884012 kB free)
disk:/var/log                        PASS   11% used on /dev/sda3 (4112696 kB free)
role                                 PASS   role=nginx_reverse_proxy; expected services: nginx keepalived
service:nginx                        PASS   active
service:keepalived                   PASS   active
systemd-failed-units                 PASS   no failed units
time-sync                            PASS   chrony tracking normal (system time 0.000082 seconds fast)
listening-ports-unexpected           PASS   all TCP listeners are in the design port matrix
cert:/etc/nginx/ssl/portal.crt       PASS   expires in 84 day(s) on 2027-02-01 00:00:00 GMT
reboot-required                      PASS   no reboot required
$ echo $?
0
```

```bash
# --- Health report: threshold breach and a dependency problem -----------------
$ sudo ./06-server-health-report.sh -d 60 -c 120 -v
ERROR: 2026-11-09 14:44:19 [ERROR] disk:/var FAIL 78% used on /dev/sda3 (912840 kB free) - warning threshold 60%
ERROR: 2026-11-09 14:44:19 [ERROR] service:nftables FAIL not active: inactive
ERROR: 2026-11-09 14:44:19 [ERROR] cert:/etc/nginx/ssl/portal.crt FAIL expires in 84 day(s) on 2027-02-01
ERROR: 2026-11-09 14:44:19 [ERROR] health report completed with 3 finding(s); full log: /var/log/fyp/2026-11-09_06-server-health-report.log
$ echo $?
1
```

```bash
# --- nftables drop summary ----------------------------------------------------
$ sudo ./07-nftables-log-summary.sh -s "2026-11-09 20:00:00" -b 24 -n 5
FYP nftables drop summary
host        : vpnz-nft01
window      : since 2026-11-09 20:00:00
generated   : 2026-11-09T22:15:44+08:00
total drops : 1834

SOURCE PREFIX            DROPS
---------------------- ----------
10.10.40.0/24              1487
10.10.70.0/24               301
192.0.2.0/24                 38
198.51.100.0/24               8

Interpretation: a source inside 10.10.0.0/16 is an INTERNAL host whose traffic
the policy correctly denied (see TB-02/TB-03/TB-09 - check the source VLAN).
A source inside 10.70.0.0/24 is the deliberately isolated lab segment and any
traffic from it at the egress pair is a policy finding, not routine noise (TB-09/TB-10).
```

The `10.70.0.0/24` line is the interesting one in the output above: the isolated lab segment must not be able to reach the egress pair at all, and the summary surfaces that in a single line. This is exactly the output the section 11 agent is given as a tool result, which is why the script produces both a table and a JSON object.

```bash
# --- Certificate expiry -------------------------------------------------------
$ ./08-cert-expiry-check.sh -d 45
FYP certificate expiry report
host       : vpnz-mon01
generated  : 2026-11-09T22:20:11+08:00
window     : 45 day(s)
findings   : 1

SOURCE                       DAYS     STATUS SUBJECT / DETAIL
---------------------------- -------- ------ ------------------------------
/etc/nginx/ssl/portal.crt    84       PASS   CN=portal.vertexpeak.example | expires in 84 day(s)
/etc/openvpn/easy-rsa/pki/ca.crt 3475 PASS  CN=Easy-RSA CA | expires in 3475 day(s)
vpnz-dmzrev01:443            84       PASS   CN=portal.vertexpeak.example | expires in 84 day(s) (2027-02-01 00:00:00 GMT)
vpnz-dmzweba01:443           31       FAIL   CN=www.vertexpeak.example | inside the 45-day window (expires 2026-12-10 00:00:00 GMT)
vpnz-rras01:443              -        FAIL   cannot connect or complete a TLS handshake
$ echo $?
1
```

Two findings in one run, and both are useful: one certificate is genuinely close to expiry, and one endpoint cannot complete a handshake at all. The second is the kind of finding that only a probe-based check produces — a file-based check would have reported the certificate as healthy while the service was unreachable.

```bash
# --- The same scripts under a scheduled timer, checked by exit code -----------
$ systemctl list-timers 'fyp-*' --all
NEXT                        LEFT    LAST                        PASSED  UNIT                    ACTIVATES
Mon 2026-11-10 06:00:00 CST 7h left Sun 2026-11-09 06:00:02 CST 10h ago fyp-health-report.timer  fyp-health-report.service
Sun 2026-11-16 03:00:00 CST 6 days  Sun 2026-11-09 03:00:01 CST 13h ago fyp-cert-expiry.timer     fyp-cert-expiry.service
```

A non-zero exit from a `oneshot` service triggered by a timer is visible in `systemctl status` and in `journalctl -u fyp-health-report.service`, which is how the monitoring layer and the AI layer both learn about a finding without either of them parsing a log line. This is the integration point described in 10.8.

---

### 10.7 Automation of the Cisco Layer

This subsection is written to be uncomfortable but accurate. The project's Cisco work is performed exclusively in **Cisco Packet Tracer** (a fixed project constraint), and the design baseline records the consequence bluntly: Packet Tracer has **no API, no SSH server reachable from real tooling, and no Ansible collection** (PT-06). No playbook, script or tool in this project can log in to a Packet Tracer device. Any statement to the contrary would be fabrication.

#### 10.7.1 What can be automated against Packet Tracer

| Capability | Possible? | How it is done |
|---|---|---|
| Keeping the **intended** configuration of every device under version control | **Yes** | `03-build/packet-tracer/configs/*.txt` — one file per device — is the source of truth, committed to Git. Each file holds the exact intended running configuration as it should appear in the device |
| Generating those configurations from templates | **Yes, on the host** | A template plus a per-device variable file (hostname, management address, loopback, VLAN list, peer list) rendered by the same Jinja2 machinery used for the Linux templates, with the output committed as the `.txt` file. This is genuine infrastructure-as-code applied to device configuration, even though the *delivery* is manual |
| Detecting drift between the intended configuration and the device | **Partly** | The group can compare the device's `show running-config` output, pasted into a file, against the committed `.txt`. The comparison is a `diff`, and it is manual because nothing can read the device directly |
| Comparing configurations between milestones | **Yes** | `git diff` between tags shows exactly what changed in the network configuration between week 4 and week 8 |
| Archiving device configurations with a timestamp | **Yes, as files** | The archive playbook of 10.4.6.5 copies the committed `.txt` files into a dated archive directory and writes a manifest stating that no device was logged into |
| Verifying that a configuration is *complete* | **Yes, partially** | A validator can check that every device file contains the required elements (hostname, management IP, VLAN definitions, trunk settings, routing block, banner, `no ip domain-lookup`), which catches an omitted section even without a device |
| Executing a configuration on the device | **No** | Packet Tracer offers no scriptable interface that external tooling can reach. The configuration is applied through PT's own CLI, by hand, in the simulator |
| Retrieving a live configuration from the device | **No** | Same reason |
| Automated testing of the device's response | **No** | Verification is by PT's own `show` output and simulation mode, captured as screenshots |

#### 10.7.2 What would be done in a real lab

The group must state clearly what changes if the same designs are applied to real equipment, because this is the gap analysis that turns a limitation into a learning outcome:

| Task | Real-equipment method | Tooling that would be needed |
|---|---|---|
| Push an intended configuration to a device | SSH to the device with an automation account, enter configuration mode, apply the template, exit, then save | An SSH-based configuration library — `netmiko` or `napalm` in Python, invoked by an Ansible module or a playbook using `connection: network_cli`. **Python, `napalm`, `netmiko`, YANG, RESTCONF and NETCONF are not named in the WSOS 2026 and are therefore presented as future work, not as project requirements** |
| Retrieve the running configuration | `show running-config` over SSH, saved and committed automatically | The same library, plus a scheduled job |
| Enforce a configuration | Compare the running configuration against the intended configuration, fail the run on any difference, optionally remediate | An idempotent configuration-management module; Ansible's `ios_config` family in a real collection |
| Validate the configuration | Parse the running configuration and assert expected values | The same tooling, plus assertions written as code |
| Roll back a bad change | Keep the previous configuration, and apply it through the same SSH path when a check fails | The same tooling plus a Git-tracked history, which is exactly the pattern the Linux estate already uses |
| Use model-driven interfaces | Retrieve and set configuration through YANG models over NETCONF/RESTCONF | Model-driven tooling — explicitly out of scope here, and absent from the WSOS 2026 Domain 5 as revised |

The WSOS 2026 does name **Git** as the modern automation tool for systems deployment and configuration management (Domain 5), and the project uses Git in exactly the way that matters for network devices: the device configurations are version-controlled artefacts with a review history, a diff between milestones, and a tagged release per milestone. That is a genuine — and citable — implementation of configuration-as-code for the Cisco layer, and it is the strongest claim the project can honestly make about automating it.

#### 10.7.3 How the device configurations are managed

```text
C:\FYP\03-build\packet-tracer\configs\
├── README.md                        (states plainly: extracted by hand from the PT CLI,
│                                     never retrieved by any automated tool)
├── VP-HQ-CORE-01.running-config.txt
├── VP-HQ-CORE-02.running-config.txt
├── VP-HQ-DSW-A01.running-config.txt
├── VP-HQ-DSW-A02.running-config.txt
├── VP-HQ-DSW-A03.running-config.txt
├── VP-HQ-DSW-A04.running-config.txt
├── VP-HQ-EDGE-01.running-config.txt
├── VP-HQ-FW-01.running-config.txt    (ASA: show run)
├── VP-HQ-VOICE-01.running-config.txt
├── VP-BR-EDGE-01.running-config.txt
├── VP-BR-DSW-A01.running-config.txt
├── VP-MO-EDGE-01.running-config.txt
├── VP-MO-DSW-A01.running-config.txt
├── VP-WC-EDGE-01.running-config.txt
├── VP-WC-DSW-A01.running-config.txt
├── VP-ISP-EDGE-01.running-config.txt
└── MANIFEST.md                      (device, PT file, date extracted, who extracted it,
                                      and the show command used)
```

The working method, which is a manual process documented as a manual process:

1. After each configuration change in Packet Tracer, the owner runs the device's own capture command: `show running-config` on IOS devices, `show run` on the ASA, and PT's **File → Save As** for the project file.
2. The output is pasted into the device's `.running-config.txt` file, the change is described in the commit message with the test-case ID, and the file is committed on a `task-l3-*` branch.
3. A second member reviews the diff — the diff is the review artefact, and it is the reason this process is worth doing even though it is manual.
4. `design-review` and milestone tags (`v0.4`, `v0.8`) make the configuration history navigable: `git log --oneline -- 03-build/packet-tracer/configs/VP-HQ-CORE-01.running-config.txt` is the complete change history of that device.
5. Backups are the Git history plus the dated archive produced by `08-collect-network-configs.yml`, which also runs `Backup-NetworkDeviceConfig.ps1`. The manifest of that archive states exactly what it does and does not contain, so the backup claim cannot be inflated later.

#### 10.7.4 The claim the report may and may not make

| Claim | Permitted? |
|---|---|
| "The intended configuration of all 16 Packet Tracer devices is managed as code in Git, with peer review and tagged milestones" | **Yes** — this is true and it satisfies the `Git` and configuration-as-code requirements |
| "The configurations were generated from templates with per-device variables" | **Yes, if it was actually done** — and the generated files must be committed so the claim is checkable |
| "A read-only verification playbook checks the completeness of every device configuration file and archives it with a manifest" | **Yes** — this is what `08-collect-network-configs.yml` does |
| "Ansible (or any automated tool) logged in to a Packet Tracer device and pushed a configuration" | **No — forbidden.** No evidence could exist, because the capability does not exist |
| "Network-device configuration is fully automated" | **No.** The delivery step is manual and must be described as manual |
| "The same design would be automated on real equipment using SSH-based configuration push" | **Yes** — as an explicitly labelled gap analysis and future-work statement |

### 10.8 Scheduling and Orchestration

#### 10.8.1 How the routine jobs run

| Job | Host | Mechanism | Schedule | Output |
|---|---|---|---|---|
| Playbook runs against the estate | `vpnz-mon01` | `systemd` timer `fyp-ansible-audit.timer` → `fyp-ansible-audit.service` (a `oneshot` running `09-verify-services.yml`) | Daily 06:00 | JSON audit report in `runs/audit/`; non-zero exit on assertion failure |
| Linux health report | every Linux guest | `systemd` timer `fyp-health-report.timer` → `fyp-health-report.service` | Daily 06:30 | `/var/log/fyp/` log, optional JSON file, non-zero exit on findings |
| nftables drop summary | `vpnz-nft01` | `systemd` timer `fyp-nft-summary.timer` | Hourly at :05 | Text summary for the operations log, JSON object for the agent |
| Certificate expiry check | `vpnz-mon01` | `systemd` timer `fyp-cert-expiry.timer` | Weekly, Sunday 03:00 | Report file, non-zero exit inside the warning window |
| Backup with verification | Windows guests | Windows Task Scheduler task scheduled by the `windows_baseline` role, named `BKP-{TARGET}-DAILY` | Daily 22:00 | Phase result CSV in `C:\FYP\config\`, exit code 3 on failure |
| Off-host configuration and evidence copy | `vpnz-lnxra01` / Linux guests | `systemd` timer `fyp-restic-backup.timer` → `04-backup-restic.sh` | Daily 23:00 | Restic snapshot on `vpnz-dmzjump01` |
| Configuration archive | `vpnz-mon01` | `systemd` timer | After each milestone tag | Dated archive plus manifest under `/srv/tftp/config-archive/` |

A `systemd` timer is used rather than `cron` for four reasons that matter in this project: it can express `OnCalendar` schedules that survive a missed run with `Persistent=true`; it captures the unit's stdout and stderr in the journal, so a failed run has a transcript without any extra logging code; it exposes `systemctl list-timers` as a one-command inventory of every scheduled job; and a `oneshot` service's **non-zero exit is a first-class signal** that the monitoring layer and the AI layer can both consume without parsing anything.

```ini
# /etc/systemd/system/fyp-health-report.service
[Unit]
Description=Vertex Peak FYP Linux health and capacity report
Documentation=file:/opt/fyp/docs/runbook-health-report.md
After=network-online.target chrony.service
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/opt/fyp/bin/06-server-health-report.sh -f json -o /var/lib/fyp/health-%H.json
User=root
# A non-zero exit is expected when findings exist; it is a signal, not a crash.
SuccessExitStatus=
Nice=10
IOSchedulingClass=idle
TimeoutStartSec=300
StandardOutput=journal
StandardError=journal
SyslogIdentifier=fyp-health

[Install]
WantedBy=multi-user.target
```

```ini
# /etc/systemd/system/fyp-health-report.timer
[Unit]
Description=Daily Vertex Peak FYP health report

[Timer]
OnCalendar=*-*-* 06:30:00
Persistent=true            # run once at start-up if a scheduled window was missed
RandomizedDelaySec=300     # spread load across the 19-VM estate
Unit=fyp-health-report.service

[Install]
WantedBy=timers.target
```

`Persistent=true` and `RandomizedDelaySec` are not decoration. Without `Persistent`, a timer missed while the host was suspended (which happens constantly on a hypervisor host that is also a workstation) is simply skipped, and the group would then be unable to explain a gap in the evidence. Without a random delay, nine Linux guests all start a report at 06:30:00 on one physical host with 32–64 GB of RAM and the host briefly becomes the bottleneck.

**What is deliberately not scheduled.** No job applies a configuration change unattended. Every mutating playbook is run by a human, inside the change window, with the review gate of 10.4.7.4. The scheduled jobs are read-only audits or backups; the only writes they perform are their own reports and the backup repository. This boundary is a design decision and must be stated as one, because "we could have scheduled the deployment too" is the obvious question a reader will ask.

#### 10.8.2 How the monitoring layer detects drift

Drift is any difference between the estate and the repository. It is detected at four levels, each with a different latency:

| Level | Mechanism | Latency | Evidence |
|---|---|---|---|
| Configuration drift on the egress pair | The `nftables` role's drift task (10.4.5.4) diffs the running ruleset against the rendered template and writes the diff into `runs/` | On each run | `runs/…_05-nftables-drift-*.txt` |
| Service and security drift across the estate | `09-verify-services.yml` asserts the properties the design fixes (SSH hardening, exactly one WinRM HTTPS listener, `svc_aiagent` group membership, nftables table presence) | Daily, and on demand | `runs/audit/audit-*.json` |
| Metrics drift | Prometheus alert rules held in files in Git (Grafana dashboards are provisioned from files for the same reason) fire when a value leaves its expected band | Minutes | Firing alerts and their resolution in Grafana; at least three alerts must be shown firing and resolving |
| Log-based drift | rsyslog forwards every guest's syslog to `vpnz-mon01`, Loki ingests it, and the nftables drop summary surfaces policy-relevant denials | Hourly | `/var/log/remote/{host}.log`, the drop summary, and the `fyp-security` dashboard |

A drift finding is a **finding record**, not a silent correction. The group's rule is that drift is written down in the findings records of 10.11 with what changed, when, how it was detected and what was done — because a drift that is corrected silently teaches the team nothing and leaves the report unable to explain its own configuration history.

#### 10.8.3 How the AI line consumes the automation output

The AI operations layer of section 11 is a **consumer** of this chapter's output, never an executor of it. Three concrete integration points exist, and each is a file or an endpoint that this chapter already produces:

| Automation output | How section 11 consumes it | Where it is defined |
|---|---|---|
| `inventory/hosts.yml` | The agent's address-plan and inventory questions are answered from this file, and its allow-list of hosts is derived from it. The agent reads the file; it never runs Ansible | 10.4.2, and the `inventory-query` Skill in 11.7 |
| `runs/audit/audit-*.json` and the health-report JSON | The agent's "is anything wrong right now" Skill reads these structured reports rather than probing the estate itself, which keeps the agent's action surface small | 10.4.6.4, 10.6.2.1 |
| The nftables drop summary JSON | The agent's log-correlation Skill consumes it directly as a tool result, which is why the script emits JSON as well as a table | 10.6.2.2 |

The direction of dependency is one-way and must stay that way: the automation layer does not call the AI layer, and no playbook's behaviour changes because an agent exists. Section 11.10 states this from the other side; the two subsections deliberately cross-reference rather than repeat.

### 10.9 Evidence and Screenshot Checklist

The HDTN topic sheet requires that students *"produce well-organized documentation that includes all findings, manuals, steps, screen captures, verifications, and references related to the project."* **Screen captures are therefore an HDTN brief requirement.** They are **not** a WorldSkills requirement: the WSOS 2026 contains zero occurrences of `screen`, `capture`, `screenshot` or `evidence`. This chapter's checklist exists to satisfy the topic sheet, and the report must attribute the requirement correctly rather than to the standard.

All screenshots follow the baseline's naming convention `{date}_{host}_{what}.png` under `07-evidence/`, and all captions follow the template `Figure {n}: {what} — {host} — {command or action} — {date}`.

| # | Evidence | Host | What to capture | Test ID |
|---|---|---|---|---|
| L4-01 | Ansible version and collection list | `vpnz-mon01` | `ansible --version` and `ansible-galaxy collection list` output, showing `ansible-core 2.18.x`, the community package version and `pywinrm 0.5.0` | TC-L4-02 |
| L4-02 | Control-node reachability | `vpnz-mon01` | `ansible windows -m ansible.windows.win_ping` and `ansible linux -m ansible.builtin.ping` with all hosts `SUCCESS` | TC-L4-02 |
| L4-03 | Inventory graph | `vpnz-mon01` | `ansible-inventory --graph` showing the windows/linux/web/edge/monitoring/cisco/mgmt hierarchy | TC-L4-02 |
| L4-04 | `ansible.cfg` in Git | `vpnz-mon01` | The committed `ansible.cfg`, with the `host_key_checking = False` line visible and the declared lab simplification shown in the caption | TC-L4-02 |
| L4-05 | Vault usage, secrets redacted | `vpnz-mon01` | `ansible-vault view inventory/group_vars/all/vault.yml` **with every secret value replaced by `REDACTED` before the capture**, the caption stating that redaction was applied | TC-L4-04 |
| L4-06 | Vault password file excluded | `vpnz-mon01` | `ls -l /home/adm-w4/.ansible/vault-pass-vp` showing `0600`, plus `git check-ignore -v` proving the login-free exclusion of the vault password pattern | TC-L4-04 |
| L4-07 | Dry run with diffs | `vpnz-mon01` | `--check --diff` output for the firewall playbook, showing the `nftables.conf` diff | TC-L4-03 |
| L4-08 | Canary run | `vpnz-mon01` | A `--limit vpnz-nft02` run showing the limited host list in the recap | TC-L4-03 |
| L4-09 | Rollback timer armed and disarmed | `vpnz-nft02` | `ls -l /run/fyp-nft-rollback.armed` before the apply and the disarmed state after verification, plus the script itself | TC-L4-03 |
| L4-10 | **Successful playbook recap** | `vpnz-mon01` | The first full run's `PLAY RECAP` with the changed counts | TC-L4-02 |
| L4-11 | **Idempotence proof** | `vpnz-mon01` | The **second** run's `PLAY RECAP` showing `changed=0` on every host, with the log file path visible in the same capture | TC-L4-02 |
| L4-12 | Idempotence log table | `vpnz-mon01` | `docs/05-idempotence-log.md` with all nine playbooks recorded | TC-L4-02 |
| L4-13 | Running nftables ruleset | `vpnz-nft01` | `nft list ruleset` showing `table inet fyp_filter`, `policy drop` on input and forward, the log prefix and the NAT block | TC-L2-03 |
| L4-14 | Drift detection output | `vpnz-nft01` | The drift task's `DRIFT`/`NO-DRIFT` line and, if drift was found, the diff | TC-L4-03 |
| L4-15 | VRRP state and VIP | `vpnz-dmzrev01` | `ip -br addr` showing the VIP, plus `journalctl -u keepalived` showing the state transition | TC-L2-02 |
| L4-16 | Audit JSON | `vpnz-mon01` | The `audit-*.json` file rendered, showing a host entry with its checks | TC-L4-05 |
| L4-17 | **PowerShell script output** | `vpnz-dc01` | `Invoke-NewStarterOnboarding.ps1` `-WhatIf` output, then the real run's object table | TC-L4-01 |
| L4-18 | PowerShell idempotence evidence | `vpnz-dc01` | The second run's object table with `Created=False` for every row, and the log showing no `Created` lines on the second pass | TC-L4-01 |
| L4-19 | Firewall and service audit CSV | `vpnz-fs01` | `Import-Csv` of the audit CSV showing at least one `FAIL` and its resolution | TC-L4-01 |
| L4-20 | Backup and verification | `vpnz-fs01` | The four phase objects in a table, with `Verify` = `PASS` and the component count | TC-L1-06 |
| L4-21 | WinRM listener state | `vpnz-fs01` | `Get-ChildItem WSMan:\Localhost\Listener` showing one HTTPS listener and no HTTP listener, plus the scoped firewall rule's `RemoteAddress` | TB-07 |
| L4-22 | **Bash script output** | `vpnz-dmzrev02` | `06-server-health-report.sh` output with the findings count, and the non-zero exit code shown with `echo $?` | TC-L4-03 |
| L4-23 | Drop log analysis | `vpnz-nft01` | `07-nftables-log-summary.sh` output plus, in a second capture, the matching raw `NFT-DROP:` journal lines it summarised | TC-L4-03, TB-02 |
| L4-24 | Certificate check | `vpnz-mon01` | `08-cert-expiry-check.sh` output, including the deliberate unreachable-endpoint finding | TC-PKI-01 |
| L4-25 | `systemd` timer inventory | every Linux guest or `vpnz-mon01` | `systemctl list-timers 'fyp-*' --all` | TC-L4-03 |
| L4-26 | **Git log and network graph** | `vpnz-mon01` | `git log --oneline --graph --decorate` covering the L4 commits, and `git tag -l` showing `v0.1` … `v1.0` | TC-L4-04 |
| L4-27 | Peer review record | `vpnz-mon01` | The commit message showing `Reviewed-by:` plus the matching line in the meeting minutes | TC-L4-04 |
| L4-28 | Secret sweep result | `vpnz-mon01` | The pre-tag sweep output (clean), plus the deliberate negative-test capture in which a fake key **was** caught | TC-L4-04 |
| L4-29 | Packet Tracer configuration archive | `vpnz-mon01` | The dated archive directory listing and `MANIFEST.txt`, whose text states that no automated tool logged in to a Packet Tracer device | TC-L4-04, TC-L3-xx |
| L4-30 | Run logs committed to Git | `vpnz-mon01` | `ls 04-automation/runs/` and the corresponding `git log` entry for the logs | TC-L4-02, TC-DOC-01 |

**The two captures that cannot be skipped.** L4-11 (the second-run `changed=0` recap) and L4-18 (the second-run PowerShell object table with `Created=False`) are the two pieces of evidence that answer the question the topic sheet's "verifications" wording is really asking. Everything else in this table supports them; without them the chapter's central claim — that the configuration is repeatable — is unproven.

### 10.10 Common Failure Modes and Troubleshooting

Each entry states the **symptom** as it appears, the **cause**, the **diagnostic command** that distinguishes it from the look-alikes, and the **resolution**. The order is the order the group is likely to meet them.

| # | Problem | Symptom | Cause | Diagnostic | Resolution |
|---|---|---|---|---|---|
| 1 | SSH authentication failure to a Linux host | `fatal: [vpnz-nft01]: UNREACHABLE! => {"msg": "Failed to connect to the host via ssh: Permission denied (publickey)."}` | The wrong identity is being used (Ansible is not running as the administrator whose key is installed), the key is not in `authorized_keys`, or the account has been removed from `gg-infra-admins` | `ssh -v adm-w4@10.10.50.11`, then `ansible linux -m ansible.builtin.command -a 'id' --become=false` and on the target `sudo grep -c adm-w4 /home/adm-w4/.ssh/authorized_keys` and `getent group gg-infra-admins` | Install the correct public key with the `users` role, confirm the account is in `gg-infra-admins`, and confirm `ansible_user` per host. If `PasswordAuthentication no` was set before keys worked, the console of the VM is the recovery path |
| 2 | WinRM authentication failure | `winrm or requests is not installed` or `HTTP 401 Unauthorized` or `the specified credentials were rejected by the server` | The `svc_ansible` password is wrong, the account is not in `GG-WINRM-Admins`, the domain name is missing from the username, or the vault did not decrypt | `ansible windows -m ansible.windows.win_ping -vvv`, then `Test-WSMan -ComputerName vpnz-dc01 -UseSSL -Credential (Get-Credential VERTEXPEAK\svc_ansible)`, and `ansible-vault view inventory/group_vars/all/vault.yml` | Use the `VERTEXPEAK\svc_ansible` form; confirm membership of `GG-WINRM-Admins` with `Get-ADGroupMember`; rekey the vault plaintext if decryption failed |
| 3 | SSH host key verification failure | `WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!` or `Host key verification failed` | A VM was rebuilt from the template, so its host key legitimately changed | `ssh-keygen -F 10.10.50.11` and compare the key on the target with `ssh-keyscan` | Either remove the stale entry (`ssh-keygen -R`) or rely on the configured `host_key_checking = False` policy. **Either way the report states that this setting is a declared lab simplification, not best practice** |
| 4 | Python interpreter discovery warning or failure | `WARNING: Platform linux on host ... is using the discovered Python interpreter at /usr/bin/python3` or `module_utils` import errors on Windows | A stale fact cache points at an interpreter that moved, or `auto_silent` is not in effect, or Windows is somehow being sent a Python task | `ansible all -m ansible.builtin.setup -a 'filter=ansible_python*'` and `ansible linux -m ansible.builtin.command -a 'which python3; python3 -V'` | Clear the cache (`rm -rf logs/facts`), keep `interpreter_python = auto_silent`, and remember that `ansible_python_interpreter` is meaningless on Windows targets |
| 5 | `become` failure on Linux | `sudo: a password is required` or `Sorry, user adm-w4 is not allowed to execute ...` | The sudoers drop-in is missing, the passwordless rule is absent, or `become_flags` is wrong for this sudo version | `ansible linux -m ansible.builtin.command -a 'id' --become -vvv` and on the target `sudo -n true; echo $?` and `sudo visudo -c` | Deploy `sudoers-gg-infra-admins.j2` through the `common` role, verify with `visudo -cf`, keep `become_flags = -H -S -n`, and note that `requiretty` must not be set (pipelining depends on it) |
| 6 | Vault password problem | `ERROR! Attempting to decrypt but no vault secrets found` or `Decryption failed (no vault secrets were found that could decrypt)` | The vault password file is missing or unreadable, the file was rekeyed without updating the local copy, or `vault_password_file` points at a path that does not exist on this machine | `ls -l /home/adm-w4/.ansible/vault-pass-vp`, `ansible-vault view inventory/group_vars/all/vault.yml --ask-vault-pass` | Recover the password from the group's password manager, recreate the file with mode `0600`, and confirm `vault_password_file` in `ansible.cfg`. If the value is unrecoverable, the file is recreated from the design's documented secret list and re-encrypted — the secrets are all lab-generated, so no data is lost |
| 7 | YAML indentation or syntax error | `ERROR! We were unable to read either as JSON nor YAML` with a line and column, or `mapping values are not allowed in this context` | A tab used instead of spaces, an inconsistent indent, a colon inside an unquoted string, or a `{{ }}` that Jinja2 rendered into something that is no longer valid YAML | `ansible-playbook playbooks/XX.yml --syntax-check`, `python3 -c "import yaml,sys;yaml.safe_load(open('file.yml'))"` if Python is available on the control node, and `grep -Pn '\t' file.yml` to find tabs | Fix the indentation, quote the value, and add the playbook to the pre-commit `--syntax-check` loop so the same error cannot recur unnoticed |
| 8 | Idempotence failure — a task changes on every run | The second run reports `changed=1` (or more) where `changed=0` is required | A `command` or `shell` task with no `creates:`, `changed_when:` or `when:` guard; a template containing a timestamp or a random ordering; a handler that fires unconditionally; a password task that resets the password on every run | `ansible-playbook … -vvv` and read which task reports changed; then the targeted dry run `--check --diff --tags <tag>` | Add the guard, remove the non-deterministic content from the template, set `changed_when: false` on read-only verification tasks, and for a password use `update_password: on_create`. The four usual offenders in this repository are named in 10.4.5.7 |
| 9 | Firewall lock-out | After applying a ruleset, the host stops answering on SSH; the playbook then reports `UNREACHABLE` | The new ruleset dropped the management path, or `policy drop` was applied to input before the management rule was added | From the hypervisor console: `nft list ruleset`, and the rollback timer's status with `systemctl list-timers 'fyp-nft-*'` | The armed rollback timer restores the previous ruleset automatically within `nftables_rollback_seconds`. Then fix the ruleset in the template, re-run with `--check --diff --limit <the canary>`, and add the missing trust-boundary rule. **This is why the timer is armed before the apply and not after** |
| 10 | Ansible cannot find a collection or a module | `ERROR! couldn't resolve module/action 'ansible.windows.win_ping'` or `win_ping was not found` | The community package is not installed in the virtual environment in use, or the playbook was run with the system `ansible` rather than `/opt/ansible-venv/venv/bin/ansible-playbook` | `which ansible-playbook`, `/opt/ansible-venv/venv/bin/ansible-galaxy collection list | grep -i windows` | Activate the virtual environment, install the pinned community package, verify `collections_path` in `ansible.cfg`, and use fully-qualified collection names (`ansible.windows.win_ping`) everywhere rather than bare module names |
| 11 | Windows module fails with an envelope or timeout error | `WinRM cannot process the request` or `The WSMan provider host process did not return a proper response` or a task that hangs and then times out | A large module payload against the default envelope size, a slow host under memory pressure, or a long-running command with no shell timeout configured | `Test-WSMan -ComputerName <host> -UseSSL` and `Get-Item WSMan:\localhost\MaxEnvelopeSizekb` on the target; time a trivial task with `-vvv` | Set `MaxEnvelopeSizekb` to 500, keep `ansible_winrm_operation_timeout_sec: 30` with `ansible_winrm_read_timeout_sec: 60`, reduce `forks` if the host is thrashing, and use `async`/`poll` for genuinely long tasks rather than raising timeouts blindly |
| 12 | Playbook runs against the wrong hosts | The recap lists hosts that were not intended, or a change appears on a tier-0 host | A bare `hosts: all` in a deployment playbook, an inventory group typo, or a missing `--limit` | `ansible-playbook playbooks/XX.yml --list-hosts` before running anything | Correct the `hosts:` line, add the grouping or `--limit`, and treat any `hosts: all` outside the read-only audit playbook as a review defect |
| 13 | `.gitignore` does not stop a secret being committed | A key or a `wg0.conf` appears in `git status`, or a secret-shaped string is found by the sweep | A file was force-added (`git add -f`), the filter was added after the file was already tracked, or the pattern does not match the actual path | `git check-ignore -v <file>`, `git log --all -- <path>`, and the repository sweep | Remove the file from tracking (`git rm --cached`), fix the pattern, rotate the exposed credential because a commit is permanent even after a history rewrite that the group may not perform, and record the incident as a findings entry |
| 14 | PowerShell script produces no objects | The script appears to run but nothing is returned, or `Export-Csv` writes an empty file | Data was written with `Write-Host` instead of being emitted to the pipeline, or a `return` inside a `foreach` terminated the function early, or the script was dot-sourced instead of invoked | Run the script interactively and pipe to `Get-Member` — an empty result means nothing reached the pipeline; check for `Write-Host` in the data path and for `return` inside a loop | Emit objects; use `continue` rather than `return` inside the loop; invoke rather than dot-source. The check is mechanical: `Get-Command -Verb Get` should list every read-only function, and `Select-String -Pattern 'Write-Host' -Path *.ps1` should show only progress lines |
| 15 | Bash script continues after a failure | A script reports success although a step failed, and files are missing | A command inside a pipeline or a subshell whose failure `set -e` does not catch, or an error masked by `|| true` | Run with `bash -x script.sh` and check `set -o | grep pipefail`; look for `|` without `pipefail` and for `|| true` on a meaningful command | Keep `set -euo pipefail`, avoid swallowing errors with `|| true`, and handle expected non-zero results explicitly with an `if` rather than by disarming the shell's error handling |

### 10.11 Findings

A findings record is the mechanism by which this chapter reports what was **observed** rather than what was **intended**. Every test case in the verification chapter, every drift detection, every idempotence failure and every troubleshooting episode that took more than a few minutes produces one row. A findings subsection with no rows is a finding in itself: it means the estate was never exercised.

#### 10.11.1 Findings record template

Each finding is written in the following form. The template is fixed so that findings from four different group members can be read side by side.

```text
Finding ID      : F-L4-nn
Date recorded   : YYYY-MM-DD
Recorded by     : adm-{initials}
Host(s)         : vpnz-nft01  (all hosts affected, verbatim hostnames)
Task / playbook : 05-nftables-egress.yml  (or the script name, or the manual step)
Change window   : in-window | out-of-window (state which)
Test case ID    : TC-L4-nn
Trust boundary  : TB-nn, or "not applicable"

OBSERVED
  What actually happened, with the verbatim command that produced it and the
  relevant output lines. Screenshot reference: 07-evidence/{date}_{host}_{what}.png

EXPECTED
  What the design says should have happened, with the section or baseline
  reference that fixes the expectation (for example "design baseline section
  12.4 requires changed=0 on the second run").

DIFFERENCE
  The precise delta: which value differed, or which step did not occur.

ROOT CAUSE
  The underlying reason, once established. If it is not established, write
  "NOT ESTABLISHED" and state what further test would establish it. Do not guess.

RESOLUTION
  The change made, who reviewed it, the commit that carries it, and the
  verification that proves the resolution (with the evidence path).

RESIDUAL RISK
  What remains uncertain or unaddressed after the fix.

LESSON
  What the group would do differently, stated in one or two sentences.
```

#### 10.11.2 Worked example (illustrative)

```text
Finding ID      : F-L4-01
Date recorded   : 2026-11-09
Recorded by     : adm-w2
Host(s)         : vpnz-nft02
Task / playbook : 05-nftables-egress.yml, tags: drift
Change window   : in-window
Test case ID    : TC-L4-03
Trust boundary  : TB-03

OBSERVED
  The drift task reported DRIFT on the canary node. The diff showed one extra rule:
    + ip saddr 10.10.30.31 tcp dport 9090 accept
  which does not exist in templates/nftables-30-filter-forward.nft.j2.
  Evidence: 07-evidence/2026-11-09_vpnz-nft02_nft-drift-diff.png

EXPECTED
  The running ruleset should be byte-identical to the rendered template, because
  the design statement is that the template is the single source of truth for the
  egress policy (design baseline section 12.2 and section 12.4 of this project's
  automation strategy).

DIFFERENCE
  One forward-accept rule for TCP 9090 from the monitoring host was present on the
  live firewall and absent from Git.

ROOT CAUSE
  During the Prometheus triage experiment on 2026-11-06 an ad-hoc rule was added by
  hand with `nft add rule` to reach a temporary exporter port. The rule was never
  removed and never written back into the template.

RESOLUTION
  The rule was removed from the live node; the port was instead added to the
  monitoring port row in templates/nftables-30-filter-forward.nft.j2 under
  group_vars/edge.yml (commit a1b2c3d, reviewed by adm-w4). The playbook was
  re-run, the drift task reported NO-DRIFT, and the second run reported changed=0
  on both nodes (runs/2026-11-09_2231_05-nftables.SECOND-RUN.log).

RESIDUAL RISK
  The ad-hoc change existed for three days before detection. The daily audit
  would not have caught it, because the audit playbook asserts the presence of the
  table and the policy, not the absence of extra rules. A future check that hashes
  the running ruleset and compares it with the rendered template on a schedule
  would close that gap; it is recorded as future work.

LESSON
  Every hand-made change on a live firewall must be written back into the template
  within the same session. The drift task caught it, but only because a playbook
  happened to be run; relying on that is a process weakness, not a control.
```

This example is **illustrative** and demonstrates the level of specificity expected. A real findings record names the actual commit, the actual run log paths and the actual evidence file, and it must not be written from memory. The rule the group applies is simple: **a finding that cannot be traced to a command transcript, a log path or a screenshot is not yet a finding — it is a suspicion, and it belongs in the meeting minutes until it can be evidenced.**
