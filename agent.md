# agent.md — handover for the next AI agent

Operating manual for a fresh agent continuing this project. Facts read from this repository **2026-09-29**; nothing invented; unconfirmed items marked `[VERIFY]`.

---

## 中文摘要（Traditional Chinese summary）

本專案是 **HDTN 畢業專題（AY2026/27）**：**Victor2 – Enterprise Network Infrastructure and Architect**，四人小組、十二星期，虛構企業 **Vertex Peak Financial Technologies Limited**，對照 **WorldSkills Occupational Standards 2026（Skill 2447）**。

**方向已拍板，次序是硬性依賴而非偏好：** 先建好 **Linux、Windows、Cisco** 三類裝置的網絡，做好並驗證所有網絡服務；**之後**才建 **AI 管理層**——**本機自託管模型 + MCP**，令裝置透過 MCP 與模型對接。**任何 MCP 伺服器都不得在其管理的裝置尚未可達、已認證、已在產生遙測之前開始寫。**

**最重要的技術約束：Cisco 層必須真正可被 AI 管理，而 Packet Tracer 不可能是那一層**——其裝置**沒有**任何可由外部接觸的 SSH、SNMP、NETCONF、RESTCONF 或 API。建議 **Cisco Modeling Labs（CML，五部裝置）**，後備為「Packet Tracer 做設計 + 2–4 部真正可達裝置」。**任何 MCP 工具、代理、playbook 或腳本都不得聲稱可接觸、讀取或設定任何 Packet Tracer 裝置。**

**現況：** 即時遞交物只有短版計劃書；大綱（`FYP-Outline-DRAFT.md`）是決策權威；`legacy\` 內約 286,932 字舊版**不得遞交**。**唯一阻塞是 B2（Cisco 平台拍板）**；實驗室機器規格（B1）、GPU 層級（D-04）、模型類別（B3）延後到 **G2-H（第 6 週）**，屬延後非否決。期間網絡／服務層、MCP 伺服器骨架與測試、代理與護欄、評估工具全部可照做。

**兩條最貴環境規則：**（一）**永遠不要用路徑開啟 `.docx`**——Open XML SDK 或 Word COM 即使唯讀意圖也會就地重寫（使用者原始題目表曾由 30,949 位元組改成 30,882）；請以 ZIP 讀取，並用專案內從記憶體串流開啟的驗證腳本。（二）**本機 Word COM 無法使用，故這裡無法驗證 Word 能否開啟**；最強證據是 Microsoft SDK 驗證 0 錯誤加套件檢查 9/9。

**驗證紀律：** 代理自己的「全部通過」報告不是證據——曾有報告認證「20 條 Gantt 線 0 失敗」，實際 **11 條錯位**。任何關鍵聲稱都要另派無利害關係的新代理從檔案重新推導；**不要讓兩個代理同時編輯同一檔案**（曾發生，被中止者留下半截編輯，把已完成修正還原）。

---

## 1. What this project is

| Field | Value |
|---|---|
| Title (verbatim) | **Victor2 – Enterprise Network Infrastructure and Architect** |
| Context | HDTN Final Year Project, AY2026/27; **4 students, 12 weeks** — S1 Cisco/network, S2 identity/Windows, S3 Linux/services, S4 automation/AI/documentation (names/IDs `[TO CONFIRM]`) |
| Standard | WSOS 2026, *IT Network Systems Administration* (Skill 2447), WorldSkills Shanghai 2026 |
| Host organisation (invented) | **Vertex Peak Financial Technologies Limited** (駿峰金融科技有限公司), trading as "Vertex Peak": Hong Kong insurance-technology / financial-data SaaS firm — 160 staff (Science Park HQ 110, Kwun Tong 28, Wan Chai 12, Macau 4); 260 brokerages; ~14,000 seats; five-person IT team. Clients are regulated by the **Hong Kong Insurance Authority**, so least privilege, auditability and client-data protection must be demonstrable |
| Business trigger | A brokerage group's due-diligence questionnaire: segregate production from office users; documented least-privilege access with an audit trail; certificate-based encrypted remote access with no shared passwords; documented recovery/failover for the customer-facing web tier; **evidence that network change is applied through reviewed, repeatable configuration, not by hand**. The fifth demand makes this an automation project, not a configuration project |

**Clarified direction, and the ordering rule.** Build a network of **Linux, Windows and Cisco** devices; first stand up the **network services**; then build an **AI management layer using a locally hosted model plus MCP** so the devices interface with the model. **The order is a hard dependency, stated as a rule:** *no MCP server may be written before the host or device it manages is reachable, authenticated and producing the telemetry its tools read.* No mutating tool registers before refusal test PB-2 passes. The AI layer is the **assessed differentiator**; the network is the **foundation it depends on** — ratified, not proposed.

**Estate.** 9 Windows guests and 10 Ubuntu guests (WinRM/HTTPS 5986, SNMPv3, Event Log over WinRM, `windows_exporter` 9182, syslog; SSH 22 with a forced-command read-only allow-list, `node_exporter` 9100, rsyslog). Cisco **5 target** (D-16: HQ core pair, WAN edge, branch router, perimeter firewall); ≤8 only if each is evidenced reachable; 2–4 under the hybrid. AI plane 2 hosts; hypervisor host `vpnz-hvhost01` is deliberately outside AI management. Frozen inventory = **36 rows = 16 Packet Tracer devices + 19 VMs + 1 hypervisor host**. Hostnames, addressing, VLANs, zones, TB-01…TB-16, the 15-character hostname rule, domain `vertexpeak.fyp.lab` and the banned-strings list carry forward verbatim in `proposal\00-design-baseline.md`.

---

## 2. The single most important technical constraint

> **No MCP tool, AI agent, Ansible playbook or script in this project may claim to reach, read from or configure a Cisco Packet Tracer device.**

Packet Tracer devices expose **no SSH server reachable by external tooling, no SNMP agent a real poller can query, no NETCONF endpoint, no RESTCONF endpoint and no management API whatsoever.** Anything implying otherwise — a sentence, table row, diagram arrow, tool description or test case — is a fabrication and must be deleted. Packet Tracer is **design-time only** (topology, CCNA-level configuration), labelled as such in every figure, with the crossed-out arrow drawn.

**Evidential rule:** *an interface exists only if a command run from the management host, in this lab, returned data from that specific device, and the transcript is filed as evidence.* Anything else is a design intention, labelled as one. A `REACHABLE` row without a transcript is a claim, not a fact, and must be reported as unverified.

**Cisco interface guarantee** (C1, Stage B and D-16 rest on this): **SSH via an enumerated `show`-only allow-list with no configuration mode, and SNMPv3 authPriv, are unconditional; RESTCONF is conditional on the image** and may not fail C1 or Stage B on classic IOS. SNMPv2c and community strings are forbidden.

| Option | Verdict and reason |
|---|---|
| **Cisco Modeling Labs (CML)** | **PRIMARY** — HQ core pair, WAN edge, branch router, perimeter firewall. Genuine IOS-XE/IOS with real SSH, SNMPv3 and RESTCONF; topology persists; a licensed Cisco product, so the option a school is most likely to permit. **Licence tier, image entitlement and RAM cost `[TO CONFIRM]` week 1 (D-12) at the vendor's own pages — never from memory, a forum post or a mirror.** Needs ~16–32 GB RAM on top of the hypervisor, so its own named host in B1 |
| **Hybrid: Packet Tracer for design + 2–4 genuinely reachable devices** | **FALLBACK** — keeps the PT topology artefact *and* gives the AI layer devices it can truly manage. Every figure must say "simulated in Packet Tracer" or "a real device with a real management interface" |
| GNS3 / EVE-NG | **Rejected** — the **IOS images raise a licensing/provenance question with no defensible answer for a graded deliverable**; EVE-NG also costs a full VM per node |
| Hosted sandbox (DevNet) alone | **Rejected** as environment of record — reserved instances are **time-boxed and reset**, so the built network cannot be handed in, re-run at marking or screenshot reproducibly. Supplement only |
| Physical second-hand gear alone | **Rejected** as primary — no ASA without a further purchase; classic IOS has **no RESTCONF**. Excellent supplement |
| **Packet Tracer as the AI-managed layer** | **Rejected outright** — no reachable interface, so such a design **cannot demonstrate AI network management at all** |
| Simulator-only environment | **Honest scope reduction (§C.5)** — Cisco becomes design-and-verify only; AI domains fall to two families; `MCP-S-CISCO` dropped with the reason stated; UC-1 narrows. A stated reduction is honest; a hidden one is a fabrication |

**State aloud:** the eBGP **AS-65000 provider is a Packet Tracer object** (`VP-ISP-EDGE-01`, matrix row **NR-01a**) and is **not reachable**, so the AI layer reads the **local** edge router only and **can never verify the session from the peer side** — no tool, test or figure may imply otherwise. A second genuinely reachable CML IOS-XE node as the peer is **Stage D: optional, weeks 10–12, not required**.

---

## 3. Deliverables and their exact state

Measured 2026-09-29 with `Get-FileHash`/`Get-Item`. Re-measure before relying on it — the converter is not idempotent, so a re-render changes bytes and hash without changing content (H3).

| File | Bytes | SHA-256 | Purpose |
|---|---|---|---|
| `FYP-Proposal-SHORT.md` | 131,405 | `B3A933B27E5F58C7E8104831558933BD89F289FCE9C6B44A543BE93468775BD3` | **The immediate submission** (D5) |
| `FYP-Proposal-SHORT.docx` | 65,799 | `869882D5140F67081D2AC0B3682F9DCF505127EA351C4C29E9B8282BA1493EA3` | Submitted render: **9,996 prose words** (ceiling 10,000; stricter Markdown method 9,984); coverage 1,318/1,318 = 100.000% |
| `FYP-Outline-DRAFT.md` | 265,139 | `2A422BF0E6A29FF693AB9D6C37A36C8C274642A7BC60D87525307CD3C6321760` | **Decision-level authority** |
| `FYP-Outline-DRAFT.docx` | 139,867 | `2FB88823E6726C3E9137817135B544E4F6BE2D5020B0503A275DF02811AE4E05` | Its render: coverage 2,524/2,524 = 100.000%; 73 tables / 583 rows; headings `1/15/73/12` |
| `AY2627_FYP topics_v2_Victor Li.docx` | **30,949** | `1B847CF41700BD1DB3C0E3D5E540BC349674A8177B057AD9AC09F897B4AAFB4E` | **User's own topic sheet. Immutable** — once corrupted to 30,882 and restored (H1) |
| `image.png` | **141,462** | `E2001305D91C2DDF02F8F77310C52459A1C6855CF79D057F564C13C866967FDF` | User's own image. Immutable |
| `proposal\00-design-baseline.md` | 176,892 | `8EE8FAC57E0A49537C3F584C7464E28DB12016BA1EB056874B3518D2EC1844FA` | Frozen baseline, reference only |
| `proposal\00-design-baseline-rev1.1-addendum.md` | 67,673 | `DA23A3203E2C3210ABD57DBA47717FC43C400E10A71FB597EEE42977C2B9376E` | Addendum to the same |
| `proposal\research\wsos-2026-2447.md` | 57,405 | `737140B629312B7DB4A139C3FF9B1D6DC1DF80EF8DCB6B3B6ED05D88476688C7` | Standards evidence pack (2026 page: HTTP 200, 55,200-byte body, "Last updated: 02.06.2026 13:34 (GMT)"; 2024 page 55,616 bytes) |
| `legacy\FYP-Proposal-COMPLETE.md` | 1,974,693 | `92E3664B88B06CA51831853DF8D4856BEECBFC90DB29091B18EBF3719CC62349` | Superseded generation, English |
| `legacy\FYP-Proposal-COMPLETE-ZH.md` | 1,880,703 | `75B46A4136953F40A6196EF686E0CACBDAE165A1356498F33D83E467330232D2` | Superseded generation, Chinese |

**`legacy\` must not be submitted, and must not be handed to a supervisor or examiner as a statement of what the project is:** ~**286,932 words** (the outline's figure; `legacy\README.md` says "roughly 286,000"), superseded because it predates the clarified direction, puts the Cisco layer inside Packet Tracer, centres the AI layer on OpenClaw, states that **no local GPU inference is planned**, and calls the AI line the weakest with MCP cuttable. Still **useful as reference** (design baseline, addressing, service designs, standards alignment, test-case scheme, risk register, documentation standard); the later full submission is rebuilt **from the current outline**, never from these files.

**Naming collision:** `G1`–`G10` are the short proposal's **governance mechanisms**; `G0`–`G6`/`G2-H` are the **project gates** — always write "gate G2" or "governance G2".

---

## 4. Settled decisions — do not reopen

### 4.1 Stages A–D and the minimum

The ramp exists because the ratified Cisco answer is "fully manageable, **but introduced incrementally, not all at once**". A stage is entered only when its **entry gate is evidenced** and left only when its **exit gate is evidenced** — *never entered by declaring it entered*. Build and coverage are separate axes: coverage cannot start before week 7 (AI line start) or before the stage's own entry gate. Stages may overlap in time; they may not be reordered.

| Stage | Becomes AI-manageable | Exit evidence | Weeks |
|---|---|---|---|
| **A — server estate** | RW-01…RW-06 and RW-09: all 9 Windows guests, all 10 Ubuntu guests, the agent host's audit log. **No Cisco platform, no GPU** | UC-3 and UC-6 end to end; one filed transcript per claimed row; malformed-call rate reported | **2–7** (build 2–6, covered 7) |
| **B — first genuinely reachable Cisco device** | **One** device, exec-level `show`-only, no configuration mode; ASA-class perimeter **not** required | `ssh` login succeeds, `show version` returns, one `snmpwalk -v3` returns data (**the unconditional guarantee**), plus RESTCONF GET only where the image supports it | **3–8** (build 3–6; the `show version` capture *is* G1 at week 3; closes at G3, week 8, at the earliest) |
| **C — full Cisco target set** | The **five** D-16 devices, largely RW-07 with RW-08 for the perimeter | UC-1 and UC-2 across all three families; **five filed transcripts, one per device**; count reconciled with D-16 | **8–10** (closes at G4) |
| **D — OPTIONAL peer-side eBGP** | The AS-65000 provider, NR-01a → RW-07 | Two-sided BGP verification via `MCP-S-CISCO`, both autonomous systems, one run | **10–12, only if Stage C closed early; not required** |

**Minimum acceptable stage = Stage B** — the floor, not the target. Stage C is the **operational target**; Stage D a **bonus**. The floor is **sufficient, not merely permitted**: C6's stage-based reduction is symmetric with its tier-based one, so **landing on Stage B satisfies the definition of done and landing on Stage A does not**, which triggers the §C.5 reduction.

### 4.2 Use cases and the two reductions

**Committed (D-06): UC-1, UC-3, UC-4, UC-6.** Add UC-2 and UC-5 if week 10 allows. **Commit to four, aim for six, never promise all six.** **UC-1** cross-family fault triage; **UC-2** firewall drop logs correlated with routing/ACL state; **UC-3** read-only drift check (zero false positives on unchanged hosts is the bar); **UC-4** six-field change proposal then one approved reversible change; **UC-5** operations report from telemetry; **UC-6** natural-language estate questions (ten fixed questions with known answers).

| Reduction | Trigger | Reduced set |
|---|---|---|
| **Stage-based** | Project closes at **Stage B** | **UC-3 and UC-6** (Stage A's exit pair; neither needs a Cisco device) |
| **Tier-based** | **T0** (no GPU) or a high malformed-call rate | **UC-1, UC-3, UC-5 and UC-6** (UC-4 dropped) |

Both are **stated results, not failures**, and independent: the stage decides how far the ramp got; the tier decides which tools the model can be trusted with. The cut is made at **G3 (week 8)**, never week 11.

### 4.3 Gates

| Gate | Wk | Condition | Proves |
|---|---|---|---|
| **G0** Direction locked | 1 | **D-01, D-02, D-03, D-05, D-09, D-11, D-12, D-14, D-16** answered and signed off. **D-04 deliberately absent** (deferred to G2-H). **D-03 decidable now** — no-co-location needs no GPU figure | Direction locked; nothing else starts |
| **G1** One Cisco device genuinely reachable | 3 | SSH login from the management host, an SNMPv3 authPriv walk returning data, version banner captured; RESTCONF conditional | The platform works. **If it fails, fall through the platform options immediately — do not spend week 4 hoping** |
| **G2** Required core up | 6 | Every required service verified by transcript **and** captioned capture | "The network is built", against the required-only checklist |
| **G2-H** Hardware and tier decided | 6 | **B1, B3, D-04 close.** Specification captured for **both hosts** (model, CML); tier selected from it | Model class chosen on measured hardware, not reputation. **If no answer by week 6, take the no-GPU fallback, say so, let the probe set choose — never idle** |
| **G3** AI feasibility closed | 8 | A locally served model calls a toy tool reliably; malformed-call rate measured; commitment confirmed or reduced. **Stage B closes here at the earliest** | The model is suitable before the use cases depend on it |
| **G4** Use cases demonstrated | 10 | Committed use cases end to end **where Stage C was reached**; where the project closed at Stage B, **G4 is met by UC-3 and UC-6** | The AI layer works on real devices |
| **G5** Evidence complete | 11 | Evaluation set executed; drift baseline frozen; captures captioned; documents at target size | The evidence standard is met, not promised |
| **G6** Submission | 12 | Report and companion summary assembled; consistency sweep clean; demo rehearsed | Delivery |

**Freeze points:** no new technology after week 9; no change to the committed use-case list after G4; no change to the evidence standard, ever.

### 4.4 Decision register and blocking items

| ID | Subject | Status |
|---|---|---|
| **D-01** | Cisco platform (primary CML, fallback hybrid) | **Needs ratification — B2, end of week 1** |
| **D-02** | Hardware constraint | **CLOSED** — school/lab machines allowed; "one laptop only" relaxed for compute |
| **D-03** | The lab machine's role | **Decidable now** — never co-locate the model with the 19-VM estate host |
| **D-04** | GPU/VRAM tier (T0 CPU-only, T1 ~8 GB, T2 ~12–16 GB target, T3 24 GB+; T4 described only) | **DEFERRED, NOT REFUSED** — closes at G2-H, week 6 |
| **D-05** | Windows vs Cisco depth | **Cisco-heavy** recommended; end of week 2 |
| **D-06** | Committed AI use cases | UC-1, UC-3, UC-4, UC-6; end of week 2, confirmed at G3 |
| **D-07** | May the AI layer ever change anything? | **CLOSED policy** — read-only by default; changes only with human approval |
| **D-08** | Language split | English deliverable + Chinese companion summary; end of week 1 |
| **D-09** | Screenshot/evidence standard | Fixed caption + filename template; end of week 2 (frozen week 1, while there are zero captures) |
| **D-10** | Model family — this is **B3** | **A measurement, not a choice.** Named at G2-H from the ~20-probe malformed-call rate; confirmed at G3. Never choose on reputation |
| **D-11** | Is Packet Tracer kept at all? | **CLOSED (b)** — design-time tool only, labelled in every figure; nothing automates it |
| **D-12** | CML licence and image entitlement | **`[TO CONFIRM]` week 1**, at the vendor's own pages |
| **D-13** | Offline-only or hybrid model access? | **OPEN** — recommend (a) strictly local as delivered, (b) only as a documented contingency never used for a reported result; end of week 2 |
| **D-14** | Hypervisor / virtualisation platform | **`[TO CONFIRM]` week 1 — required at G0, cannot be deferred.** Must deliver per-zone **host-only networks with DHCP disabled on every one**, 19 VMs / 42 vCPU / 78 GB RAM with thin provisioning and snapshots, and a stateable licence basis |
| **D-15** | Remote access: OpenVPN or IKEv2/RRAS | **OpenVPN** (the only one of the two named in WSOS 2026); end of week 5. One built properly, not two badly |
| **D-16** | Cisco estate size | **Five devices target**, ≤8 if each evidenced reachable, 2–4 hybrid; end of week 1 with B2 |

| Blocking item | Blocks | When |
|---|---|---|
| **B2 — ratify the Cisco platform (D-01)** | **The only item blocking work from starting now.** `MCP-S-CISCO` cannot be designed until the Cisco layer is known reachable | **end of week 1** |
| **B1 — the lab machine's exact specification** (GPU model, exact VRAM, RAM, free disk, CPU and cores, OS and version, shared/bookable/dedicated, what the lab permits installing, whether outbound access is permitted and to where — **for both the model host and the CML host**) | No defensible model class without it | **G2-H, end of week 6** — a dated gate, not an indefinite wait |
| **B3 — the model class** (derived from B1 and D-04) | Which use cases are achievable at all | **Named at G2-H week 6; confirmed at G3 week 8** |

### 4.5 Permission policy: read-only by default, change only with human approval

Settled policy. Loop: observe → retrieve context through read-only tools → reason, citing the tool call behind each claim → call further tools within a budget → emit **exactly one** of `ANSWER | DIAGNOSIS | CHANGE PROPOSAL (text only) | "I do not know"`. **"I do not know" is a first-class, successful output**; fabricating a hostname, service or metric is worse than declining.

A change requires stopping and emitting a **six-field proposal**: (1) the target, from the allow-listed inventory; (2) the exact commands or configuration difference, verbatim; (3) the expected effect and how it will be verified; (4) the rollback plan and its trigger; (5) the blast radius; (6) the supporting evidence. **Nothing executes** until a human approves; then a **single-use, host-scoped token** is issued and **one action on one allow-listed host** runs, with before-and-after verification appended to the audit log.

Components (§7.4 of the short proposal, labelled **G1–G10**): read-only default enforced by a separate mutating process; **host allow-list** from inventory enumerations, so an unlisted hostname is not expressible; **command allow-list** (the Cisco `show` parameter is an enumeration, never a string; Linux forced commands; no general "run this command" tool anywhere); **mandatory approval**, where a mutating call without a token fails closed and logs the attempt; **tamper-evident append-only audit log** chaining by digest; call caps, budgets and timeouts; **prompt-injection defence** treating all tool output as untrusted data in explicit delimiters, with the structural defence that the read-only surface with no token has nothing to execute; an explicit **blast-radius** statement; **no credential exposure** (credentials in root-owned files read at server start-up, never in the repository, a prompt or the model's context; redaction at the server boundary); **segmentation** (allow-listed management ports only; no route to the isolated lab segment or the Internet).

**Must never:** run a caller-supplied command, script block or shell string; execute a change without a valid single-use token; act on more than one host per approved action; touch a domain controller or CA except to read; enter configuration mode on any Cisco device or issue any configuration, save, copy, reload, erase, debug or clear command; read, print or transmit credentials or private keys; reach the isolated segment, the Internet or any host outside the inventory; follow a URL, path or symlink from model or tool output; modify the audit log or the policy file; or present a proposal as an executed change, or an inference as a tool result. **It does not run the network; the report must not call it autonomous.**

Servers `MCP-S-LINUX`, `MCP-S-WIN`, `MCP-S-CISCO`, `MCP-S-MON`, `MCP-S-DOC` — one per domain, each under its own minimum-rights identity, every tool classified **read-only** or **mutating**, every server carrying a must-never list. Per §7.3: 7 Linux tools (6 read-only + `linux_restart_service`), 10 Windows (9 read-only + `win_disable_ad_user`), 6 Cisco, 5 monitoring, 8 documentation/inventory — **36 tools, exactly 2 mutating** (my count). `MCP-S-DOC` is the machine-readable design baseline, and it is what the drift check and hallucination check read. Evaluation: 12 fixed scenarios × 3 runs; ≥5 injected faults with known ground truth, each reverted and each run against a human-timed baseline; permission-boundary suite **PB-1…PB-9** (refusal tests PB-2 and PB-7 matter as much as the success tests — *a system that cannot be shown to refuse has not been evaluated*); a hallucination check that counts fabrications and **gates the write demonstration**; a drift false-positive check; an audit-log coverage check with the hash chain intact.

### 4.6 Submission scope

**The immediate submission is the proposal alone (D5)** ("暫時只做 proposal"), band **15–25 pages**; the programme's own word band is `[TO CONFIRM]` against the handbook. The **later tier** is a focus-corrected full document at **90,000–110,000 words, hard ceiling 120,000** (a 58–69% cut from 286,932) assembling D6–D12: design document 40–60 pp; build manuals 60–90 pp; test plan and verification records 30–50 pp; evidence pack ~150–300 figures; references 4–8 pp; presentation plus a 12-minute script; Chinese companion summary 1,200–2,000 characters. An **initial report** is a likely future deliverable, **not current scope**.

### 4.7 Standards position — do not overstate it

- **WSOS 2026 contains no AI content whatsoever** (zero occurrences of agentic, MCP, Model Context Protocol, artificial intelligence or machine learning in its text and raw page source; zero in the 2024 edition's text too, which is a text-level extraction only). The AI layer is innovation **justified by** Domain 1 and **beyond** the standard — **never claimed as compliance**.
- The 2026 edition **removed** Python, YANG, RESTCONF and NETCONF from Domain 5, so RESTCONF must **not** be cited as a standard requirement. **Screen captures are the HDTN brief's requirement, not the standard's** (zero occurrences of screen, screenshot, capture or evidence). Documentation **is** required three times, most decisively *"Prepare a technical document reflecting the solution in detail for agreement and sign-off"* inside the 25% troubleshooting domain.
- Weights: 5% / 5% / **25% Data Transfer Networks** / **25% Network and System Operations** / 15% Infrastructure Automation / **25% Troubleshooting** — **75% is the three technical domains**, so the build and the troubleshooting/verification work are the bulk of the assessment; the AI layer is the differentiator, not the core.
- Nine brief-named technologies have **zero occurrences**: **FSRM, iSCSI, RRAS, IKEv2, Keepalived, nftables, WireGuard, RSTP, ASA.** Bridge them from the brief and say so (Keepalived implements the named virtual-router-redundancy protocol — the strongest bridge; WireGuard has only the "etcetera" of the tunnel line — the weakest, labelled as such).

---

## 5. What is still open

Only the human owner or the supervisor can close these; none is a technical unknown.

| # | Open item | Owner | Due | Why only they can decide |
|---|---|---|---|---|
| 1 | **B2 — ratify the Cisco platform (D-01)**, with the simulator-only case and its §C.5 reduction | Student + supervisor; **S1** takes it to the meeting | **end of week 1 — the only current blocker** | A licensing/permission decision needing a recorded approval |
| 2 | **SQ-3 — how far does "manages" go?** The student already chose read-only plus approved changes, which **replaces** the previous design's total exclusion of state-changing actions | **Supervisor** | ASAP — the last open supervisor-level question (SQ-1, -2, -4, -5 answered) | An academic-integrity and verification-methodology concession, not a design preference |
| 3 | **D-12 — CML licence, image entitlement, topology RAM cost**; and **school permissions** (licensed platform, personal equipment and hosted sandbox are three different permissions) | **S1**; the group | end of week 1 | Entitlement and permission questions, not design questions |
| 4 | **B1 — lab machine specification, both hosts**; then **D-04 tier** and **B3 model class** | **S4** records; S4 measures | **G2-H, end of week 6**; B3 confirmed G3 week 8 | The hardware is arranged on the student's return to Hong Kong; the class is a **measurement** |
| 5 | **D-13 — offline-only or hybrid model access?** | The group | end of week 2 | A policy choice with data-handling and credibility consequences |
| 6 | **D-14 — hypervisor platform** | The group | **week 1, required at G0** | An installed-platform and licence-basis choice that constrains the whole segmentation model |
| 7 | **D-05, D-06, D-15, D-16** — depth split, use cases, remote access, Cisco count | The group | week 2 (D-15 week 5; D-16 week 1 with D-01) | Effort allocation and scope commitment |
| 8 | **Front-matter `[TO CONFIRM]`** — date of issue, supervisor, second reader, members' names and student IDs | Student | before submission | Only the student has them |

---

## 6. ENVIRONMENT HAZARDS — the most valuable section in this file

Every rule below was learned the hard way. All are binding.

| # | Rule | Reason |
|---|---|---|
| **H1** | **Never open an artefact by path. Read `.docx` as a raw ZIP (`word/document.xml`, every `w:t`), and use the provided validators, which open from an in-memory `MemoryStream`.** | `WordprocessingDocument.Open(path, ReadOnly:=true)` + `Validate()`/`Dispose()` **rewrites the file in place** — same size, different SHA-256 — and corrupted the user's topic sheet from **30,949 / `1B847CF4…AAFB4E`** to **30,882 / `3F8632DE…54F755`**. Only three parts changed, the body stayed byte-identical, and all 24 parts stayed semantically equal XML, so only a hash comparison catches it. **Require pre/post SHA-256 to match.** |
| **H2** | **Word COM is unusable here. Do not attempt it — Word-openability cannot be verified on this machine at all.** | `Word.Application` **can be created** (Word 16.0), but `Documents.Open`, `Documents.Add` and even reading `Word.Options` **hang indefinitely**, reproduced with the machine's own topic sheet; a later run failed outright (`COMException: 0x800A13E9`). **Strongest available evidence: SDK validator 0 errors plus `verify-package.ps1` 9/9.** `wordcom-test.ps1` refuses anything under `D:\File\School\FYP` (exit 6) and works only on a temp copy. |
| **H3** | **The converter is not idempotent; byte comparison is not a valid "nothing changed" test.** | A re-render of unchanged Markdown produces fresh package timestamps — different bytes and hash, identical content. Verify by **content and measurement**. |
| **H4** | **No pandoc, no LibreOffice, no 7z; Python is a Windows Store stub.** | The toolchain is the purpose-built Node converter plus the PowerShell validators. |
| **H5** | **PowerShell is 5.1 with ANSI codepage big5 (cp950). Never `Get-Content -Raw` on a UTF-8 file.** | It misparses UTF-8. Use `[System.IO.File]::ReadAllText($p,[System.Text.Encoding]::UTF8)` or Node; prefer the `read`/`grep`/`glob` tools. |
| **H6** | **Script execution is disabled — invoke scripts as `powershell -NoProfile -ExecutionPolicy Bypass -File …`.** | The execution policy is `Undefined` at every scope. |
| **H7** | **Each paragraph and each list item must be on ONE physical line.** | The coverage validator works **line by line**, so hard-wrapped Markdown fails: the wrapped halves never match a rendered paragraph. A recorded instance measured **2,334 / 2,344 = 99.573%** with 10 lines `NOT FOUND`, repaired to 100% by rewording, no tool changed. *(The brief's 97.333% appears nowhere in the repository — `[VERIFY]`.)* |
| **H8** | **A `[FIGURE: …]` placeholder renders only when it sits alone on a single line.** | The converter recognises it as a styled placeholder only there. **A missing closing `]` silently produced `figures: 0`** and failed the figure-count check. |
| **H9** | **Emphasis-parser limits: `**A *B***` and `***A*B**` leak literal asterisks or drop emphasis, and a bold span ending in a period trips the coverage validator. Reword the construct — never patch the converter.** | Two code paths fail (renderer delimiter resolution and the coverage normaliser), so a source reword fixes both. **A converter fix was attempted: Variant A left the Chinese block leaking; Variant B cleared all four blocks and kept `--selftest` 136/136, yet was measured to regress other documents and was reverted byte-identically** (both `convert.js` and `convert.js.bak-before-emphasis-adjacency-fix` hash `33677F7819C1866B8F6D234F86951EAFE6798A3C8D9FF26F27789F2917D5D12A`). See `emphasis-source-fix-log.md` §3: *"Do not repeat it. `convert.js` must stay exactly as it is."* |
| **H10** | **The coverage validator has known FALSE failures. Do not "fix" them.** | (a) **Title-page H1 off-by-one on volume documents** — the single H1 renders with the `TitlePageTitle` style, so the `.docx` has no `Heading1` paragraph and the comparison computes `(0−1) != 0`. (b) A **horizontal-rule count mismatch** from the Markdown concatenation's frame separators plus a rule counter that ignores fenced code blocks (`COMPLETE` 60 vs 52; volumes 7 vs 4 and 53 vs 48). Neither current deliverable trips them. |
| **H11** | **Some tables contain escaped pipes `\|` and pipes inside inline code spans. Do not "tidy" those cells.** | The converter handles them (`\|` → a literal pipe in that cell; a pipe inside a code span is content; escaping wins when both apply). Measured on the real corpus (312 tables, 3,588 rows): **71 rows contain `\|`, 912 rows document pipes, and a naive split-on-every-pipe parser mis-splits 85 of them.** Only 2 genuinely ragged rows exist, both in `06-automation.md` lines 1129–1130. *(The brief's "36 rows" is not the repository's figure.)* |
| **H12** | **Never read the user's originals — not with the SDK, not with Word COM, not with Word.** | `AY2627_FYP topics_v2_Victor Li.docx` and `image.png` are **immutable**; the first is the file that was actually damaged (H1). Required state is pinned in §3. |
| **H13** | **Scratch work under `$env:TEMP` only; never write a scratch copy into the tree. Install nothing.** | A stray artefact is indistinguishable from a source, and Node (v24.9.0) plus PowerShell 5.1 already suffice. |

---

## 7. VERIFICATION DISCIPLINE — the hard lesson

**V1 — A worker's own "all green" report is not evidence.** `final-tidy-note.md` §1(c) certified *"20 bar rows checked, 0 alignment failures, 0 ruler failures"*. **That was false against the file it described:** re-measurement found **9 of the 16 first-band bars and 2 of the 4 stage bars off-grid — 11 of 20** — because each bar was appended after a row label of 15–22 characters and so began on the *second* character of its week cell; one `Evaluation set` bar was 1 week among 2-week bars; and `STAGE A`'s label overran its bar. **The row count was never the problem; the zero-failure certification was.** Only an **independent** agent found it, measuring row by row.

**V2 — Always send an independent verification task for any claim the deliverable depends on.** A fresh agent with no stake in the earlier work, instructed to **re-derive the claim from the artefact, not read the summary** — as the adversarial acceptance agent did here, which reported "reproduced exactly" or "false", never "the report says".

**V3 — Never let two agents edit the same file concurrently. Serialise edits to any shared artefact.** A second agent wrote `FYP-Outline-DRAFT.md` while the first was still working; the first was stopped mid-write and **left a partial edit that pushed `STAGE A` one column further wrong and deleted `STAGE C`'s week-7 segment outright — reverting a fix a previous session had documented as complete.** The chart would have shipped wrong.

**V4 — Before trusting a tool's pass, make it demonstrate that it can fail.** `verify-order.js` was validated with four tampered copies (rewriting `word/document.xml` inside the ZIP): swapping two complete paragraphs — every character present, only the order wrong — was caught as `orderConsistent=false`, while reversing words, swapping head halves and deleting one separator each failed differently. **That first case is invisible to a presence check, to the SDK and to any per-paragraph emitter assertion. A check that cannot fail is not a check.**

**V5 — Verify the render is current.** After any edit, extract the `.docx` text and confirm the edit is in it; a stale render is otherwise invisible. Method: a **paragraph-text diff of old against new `word/document.xml`**, which once isolated **exactly four differing entries — the two replaced cells** among 2,649 paragraphs on both sides.

**V6 — Know what each gate proves.**

| Gate | Command | Proves |
|---|---|---|
| **SDK schema** | `sdk-validate.ps1 -Path <docx>` | Opens and validates against Microsoft's Open XML SDK (2.9.1.0, Office2013) with **0 errors**, no duplicate relationship IDs or content-type declarations; non-mutating. **Does not prove content completeness.** |
| **Package** | `verify-package.ps1 -Path <docx>` | 9 structural checks: content types, unique rel IDs, `r:id` resolution, `tblGrid`/`tc` counts, style and `numId` resolution, one trailing `w:sectPr`, illegal XML characters. |
| **Coverage** | `validate.ps1 <docx> -MarkdownPath <md>` | **Presence, not order** — every source content line appears verbatim, plus table rectangularity. **Text all present but re-ordered still passes.** |
| **Order** | `node verify-order.js --config verify-order.fyp.json` | Contiguity, exactness, source order, no merge, no split — **but configured for the eight-section corpus, not for the single-file outline or short proposal**, so it does not currently prove order for the two documents that matter most. |
| **Negative control** | tampered copies (V4) | That the order gate can actually detect the defect class it claims to. |

**V7 — Hash stability, and a hash baseline, are part of every run.** Record SHA-256 before the first gate and after the last; any difference is a mutation, not noise (`pre == post` on every accepted run here). `source-integrity-manifest.md` records size, SHA-256, last-write time and purpose for **66 `.md` files plus 2 `.json`** under `proposal\` — re-run and diff it to detect unintended change (a size change with an unchanged hash is impossible; a hash change at the same size is a same-length edit; a time-only change means a touch with no content change).

**V8 — Report a defect rather than choosing silently.** Where two documents disagreed and the fix was a judgement call, the practice is to **report it as an open item** — which is why §10.3 lists leftovers honestly.

---

## 8. The toolchain, and how to use it

Converter and gates in **`proposal\tools\md2docx\`**; translation build products (scratch, not sources) in `proposal\tools\i18n-w6-auto\` and `proposal\tools\i18n-p08\`. Run from `D:\File\School\FYP\proposal\tools\md2docx`; every script needs the execution-policy flag (H6).

| File | Purpose | Invocation |
|---|---|---|
| `convert.js` | Converter core (Node, no dependencies): parser, OOXML writer, ZIP writer, ordered serialiser, section split, `--selftest` (**136 assertions**) | `node convert.js <in.md> <out.docx> ["Title"]` |
| `convert.ps1` | PowerShell front-end — **the normal way to render** | recipe below |
| `validate.ps1` | Package/structure/content validator with table integrity **and the coverage proof** | `.\validate.ps1 <docx> -MarkdownPath <md>` |
| `sdk-validate.ps1` | Microsoft Open XML SDK gate from an **in-memory** copy, SHA-256 before and after | `.\sdk-validate.ps1 -Path <docx>` — **one `-Path` per document** (repeat the parameter per file). If the SDK assemblies are absent, the package and coverage gates carry the run |
| `verify-package.ps1` | Independent 9-check structural re-verification | `.\verify-package.ps1 -Path <docx>` |
| `verify-order.js` | Contiguous-order / reassembly verifier (raw ZIP only) | `node verify-order.js --config verify-order.fyp.json [--json verify-order.fyp.report.json]` |
| `tablecells.ps1` | Table dimensions and per-row cell counts (pipe-split evidence) | `.\tablecells.ps1 <docx>` |
| `wordcom-test.ps1` | Word COM open + PDF export — **guarded, refuses anything under the FYP tree (exit 6)** | never on real documents (H2) |
| `split-plan.fyp.json` / `.zh.json` / `.example.json` | Production split manifests for `proposal\sections`: COMPLETE plus two volumes (English, Chinese) and a worked example — the split rule is **data, not code** | `node convert.js --config .\split-plan.fyp.json` |
| `verify-order.fyp.json` / `.report.json` | Document↔source manifest for the six deliverables and the last order-run result | used by `verify-order.js` |
| `bench.ps1`, `stressgen.js` | Benchmark harness; deterministic synthetic corpus generator | scale testing only |

**Render recipe — what produced the two current deliverables:**

```powershell
cd D:\File\School\FYP\proposal\tools\md2docx
powershell -NoProfile -ExecutionPolicy Bypass -File .\convert.ps1 `
  -InputPath  D:\File\School\FYP\FYP-Outline-DRAFT.md `
  -OutputPath D:\File\School\FYP\FYP-Outline-DRAFT.docx
# dc:title derives from the H1; for a body with no H1 (the short proposal) pass -Title "…"

.\sdk-validate.ps1 -Path D:\File\School\FYP\FYP-Outline-DRAFT.docx      # ERRORS: 0, exit 0
.\verify-package.ps1 -Path D:\File\School\FYP\FYP-Outline-DRAFT.docx    # 9/9 PASS, exit 0
.\validate.ps1 D:\File\School\FYP\FYP-Outline-DRAFT.docx `
  -MarkdownPath D:\File\School\FYP\FYP-Outline-DRAFT.md                 # 2,524/2,524 = 100.000%
```

`convert.ps1` prints `MD2DOCX|{…}` with `outputBytes`, `parts`, `paragraphs`, `tables`, `codeBlocks`, `listItems`, `figures`, `rules`, `headings`, `words`, `charsNoSpaces`, `raggedTableRows`, `canonicalSha256` — **keep it with the render**. **Converter scope:** GitHub-flavoured Markdown only (no raw HTML, images, footnotes, definition lists, math, nested blockquotes, tables inside list items, reference links or YAML front matter); output is a 14-part package, one `sectPr`, one TOC field for levels 1–3; **`[FIGURE: …]` is a styled placeholder, not an embedded image, so diagrams must be inserted by hand.**

---

## 9. How to not damage the repository

| Path | Contents | Treat as |
|---|---|---|
| `D:\File\School\FYP\` (root) | The two deliverables, the user's `AY2627_FYP topics_v2_Victor Li.docx` and `image.png`, and this file | The submission surface — **six files plus this manual** |
| `legacy\` | The ~286,932-word superseded generation plus its archive `README.md` | **Do not submit or present as the project.** Reference detail only |
| `proposal\sections\` | Eight English source sections behind the legacy corpus (115,332 … 429,558 bytes) | **Sources** (of the legacy artefact); **contain the withdrawn claims** |
| `proposal\i18n\zh-HK\` | Eight Chinese counterparts plus `_translation-audit.md` and two `.json` | **Sources** (translations), same caveat |
| `proposal\research\` | `wsos-2026-2447.md` | **The standards citation of record.** Read-only |
| `proposal\integration\` | 19 `.md` reports, helper `.js`/`.txt`, **nine `backup-*` folders** | **History.** Never quote as current state; never edit except to append a clearly-marked amendment |
| `proposal\tools\` | `md2docx\` (converter, gates, manifests, stress fixtures, `convert.js.bak-*`) and i18n build folders | **Tooling, read-only for normal work.** Do not "improve" the converter (H9) |
| `proposal\z-scratch-audit\` | Two one-line scratch files | Ignore |

**Sources vs generated:** the `.md` is always the source, the `.docx` generated. Under `proposal\` the sources are `sections\*.md`, `i18n\zh-HK\*.md`, `research\*.md` and the two `00-design-baseline*.md`; `tools\i18n-*\out\`, `tools\i18n-*\zh\` and `tools\md2docx\stress\*` are build products or fixtures. **Never edit a generated artefact to fix content — fix the source and re-render.****Record-keeping:** re-measure and diff against `source-integrity-manifest.md` to detect unintended change. When you change a source, take a hash-verified backup into `proposal\integration\backup-<purpose>\` **before** editing (nine such folders exist), re-render, re-run all gates, record pre/post SHA-256, and append a short log entry naming which files changed.

---

## 10. Next steps for the incoming agent

### 10.1 The immediate backlog, in order

1. **The human ratifies the Cisco platform (B2/D-01)** — primary CML, fallback hybrid, plus the simulator-only case and its §C.5 reduction — and **checks D-12 the same day** at the vendor's own pages. The **only** blocker. Put **SQ-3** to the supervisor in the same meeting.
2. **Record the lab machines' specification for both hosts (B1) and select the tier (D-04) at G2-H week 6** — or take the no-GPU plan and let the probe set choose. Never idle; never choose a model on reputation.3. **Start the network and services layer now** (it depends on neither the GPU nor the CML licence): platform and templates (weeks 1–2); identity/DNS/DHCP/time/PKI (weeks 2–3); the published service behind the HA proxy pair, the packet-filter chokepoint and the perimeter; VLANs/trunks/RSTP and OSPF/EIGRP/BGP; telemetry (metrics, exporters, SNMPv3 polling, centralised syslog, version-controlled configuration archive); automation foundations (Ansible control node, PowerShell and Bash libraries, Git workflow). **G2 at week 6 closes this.**
4. **Prove one Cisco device reachable as the week-3 gate (G1) before designing the topology** — one device, a working SSH login, one `snmpwalk -v3`, the version banner captured.
5. **Then the MCP servers and agent scaffolding in the mandated order:** `MCP-S-LINUX`, `MCP-S-WIN`, `MCP-S-MON`, `MCP-S-DOC` (Stage A, only against rows evidenced reachable), then `MCP-S-CISCO` **only after G1 passes**, then the policy engine, approval gate and audit log, then the use cases.
6. **Then the staged ramp** (A → B → C, D optional), re-running the tool-calling measurement at each boundary, tool surface frozen at the end of week 7.
7. **Then evidence and evaluation (G5, week 11)**, and the later-tier full document rebuilt **from the current outline**, never by pruning `legacy\`.

### 10.2 What can be done TODAY, with no decision pending

- **File the reachability transcripts:** `Test-WSMan` one Windows guest, `ssh` one Linux guest, query one `systemctl`/`journalctl`/`nft list ruleset` target, check one Prometheus target `up`, then write down what answered. **Every row you cannot evidence is a row the AI layer cannot use**, and this converts RW-01…RW-06 and RW-09 from claim to fact — which is what Stage A's entry gate requires.
- **Stand up repository and evidence scaffolding:** folder tree, Git, the `Figure {n}: {what} — {host} — {command or action} — {date}` caption template, the `{date}_{host}_{what}.png` filename convention. **Freeze the evidence standard now, while there are zero captures to re-caption.**
- **Build the hardware-agnostic work:** five MCP server skeletons and their tests, agent scaffolding with approval gate and audit log, the evaluation harness, and the **~20-probe tool-calling set** that will choose the model at G2-H. **Build PB-2 alongside the first mutating tool, not after it.**
- **Write the permission policy into the proposal verbatim**; **draft the required-only service list as a one-page checklist**; **delete every Packet Tracer automation claim from the old corpus before any new writing** (§L.4 W8 is the checklist).
- **Answer the group decisions needing no external input:** D-05, D-06, D-13, D-14 (required at G0), D-15, D-16 — and print the RACI before week 2.
- **Do not edit the two current deliverables.** They are at their final gate-verified state (§3); the two optional wording fixes in §10.3 item 7 need a re-render, all gates and new pinned hashes.

### 10.3 Known leftovers — listed honestly, not to be mistaken for completeness

1. **Text ordering inside the two deliverables is not proven.** Coverage proves **presence, not order** (2,524/2,524 and 1,318/1,318), and `verify-order.js` is configured for the eight-section corpus, not for the single-file outline or short proposal.
2. **Word-openability, visual fidelity, page layout and pagination were never verified for either deliverable** — and cannot be here (H2). Also unmeasured: whether the 77-character-wide §F.3 ASCII Gantt block overflows the page.
3. **§F.2's per-week use-case timing is "calibrated, not authoritative":** an offset exists between §F.2's week numbering and the §F.3 band ordering, and the first Gantt band's sixteen per-row weeks came from the §F.2 calendar and the previous chart's 2-week styling rather than a stated span.
4. **The 2024 WSOS edition's raw page source was never fetched**, so "the 2024 edition contains no AI content" is a **text-level** result only.
5. **Record-keeping gaps, partly closed:** `sections\01-introduction.md`, `sections\02-architecture.md`, `sections\07-ai.md` and seven of eight `i18n\zh-HK\` files had **no recorded baseline hash** at acceptance time; the manifest now records current hashes, which detects *future* change but cannot prove those files were unchanged earlier. `sections\02-architecture.md` and `sections\03-microsoft.md` carry modification times inside the emphasis-fix window, and three unverified section files are slightly **larger** than their last recorded state.
6. **A historical report still contains a false certification:** `final-tidy-note.md` §1(c)'s *"20 bar rows … 0 alignment failures"* stands with a marked amendment below it — read the amendment. The live outline's Gantt was independently re-measured after the fix: **20 bar rows, 20 PASS**, bar origin column 21, week *w* at `21 + 5(w − 1)`, nothing past column 80, spans `STAGE A` 2–7 / `B` 3–8 / `C` 8–10 / `D` 10–12.
7. **Two residual wording differences between the outline and the short proposal**, deliberately unchanged (editing would change its pinned hashes): its G4 "if it fails" cell says *"the read-only use cases"* instead of naming C6's stage-based pair (`UC-3 and UC-6`), and its §8.2 week-9 cell does not name **UC-6**.
8. **My own finding, recorded nowhere in the corpus: the model host is absent from the normative reachability matrix.** §C.3's Figure 1 names **`vpnz-llm01`** as the local model server, but `vpnz-llm01` does **not** appear in §C.1's ten-Ubuntu-guest enumeration and §C.2b has no row for it (RW-09 covers only "the agent host"). Add it and give it a row — or an explicit not-a-managed-element note — or reconcile Figure 1's hostname. **Resolve before Stage A is claimed:** the matrix is normative, so a device not in it is not a managed device.
9. **The `G1`–`G10` governance labels collide with `G0`–`G6`/`G2-H`**, a presentation hazard only.

---

## 11. Do not repeat — the specific mistakes made on this project

1. **Do not open a `.docx` by path.** It corrupted the user's original topic sheet (**30,949 / `1B847CF4…AAFB4E`** → **30,882 / `3F8632DE…54F755`**) with only three XML parts changed and the body byte-identical, so only a hash comparison caught it; it was restored from a byte-identical backup. Read as ZIP, validate from a `MemoryStream`, hash before and after (H1, H12).
2. **Do not let two agents edit the same file concurrently.** A second agent edited `FYP-Outline-DRAFT.md` while the first was still working; the first was stopped mid-write and **left a partial edit that reverted a completed fix** — the deleted `STAGE C` week-7 segment — so the chart would have shipped wrong (V3).
3. **Do not certify your own work, and do not accept another agent's self-report.** A note certified *"20 bar rows, 0 alignment failures"* while **11 of 20 bars were misaligned**. Send an independent verifier that re-derives the claim from the artefact (V1, V2).
4. **Do not re-import the withdrawn framing.** Superseded, and not to be restated, hedged or softened — the direction reverses all three: **"the AI line is the weakest line"** (withdrawn definitively as a ratified position — the AI/MCP line **is** the assessed differentiator); **"no local GPU inference is planned", and model hosting / fine-tuning / GPU inference out of scope** (withdrawn — a **locally served model on identified hardware is a core deliverable**, target tier T2 ≈12–16 GB VRAM with a documented CPU-only fallback; fine-tuning and trained predictive analytics remain out of scope); **"the MCP tool bridge is cuttable / optional"** (withdrawn — **MCP is the integration contract**, in the MUST band, tool-surface completeness an acceptance criterion). Also withdrawn or superseded: the 4 vCPU / 8 GB AI-host budget; the OpenClaw-centric architecture and its unverified control port including the `P-34` `[ASSUMPTION]` entry; the "two-track" Cisco workaround (playbooks written but never executed) unless §C.5 applies; the "AI is optional because the standard does not require it" *conclusion* (the fact stands; the conclusion flips — outside the standard therefore **our contribution**, not therefore optional); and fallbacks F1–F5 plus the OpenClaw feasibility spike. Full register: outline **§L.4, W1–W11** (W1's citation is `baseline §11.5`, not §11.6).
5. **Never describe Packet Tracer as manageable, automatable, pollable, configurable or reachable — anywhere, including a figure, a table cell, a tool description, a test case or a diagram arrow.** The old corpus contains a **real internal contradiction** here (`06-automation.md` §10.7 correctly says nothing can log in to a Packet Tracer device, while `07-ai.md` §11.6.3 defines an "SNMPv3 authPriv poll of the Packet Tracer device estate"); both are **withdrawn**. The consistency sweep for any such claim is a standing risk item (R12), and the crossed-out arrow in the architecture figure is deliberate and must be drawn.
6. **Do not patch the converter** to work around an emphasis or coverage defect — the attempt passed `--selftest` 136/136, was **measured to regress other documents**, and was reverted. Reword the source (H9, H7, H8, H11). **Do not "fix" the coverage validator's known false failures** (title-page H1 off-by-one on volumes; horizontal-rule count mismatch) — benign and out of scope (H10).
7. **Do not treat byte-identity as a change test** (the converter is not idempotent, H3); **do not write an MCP tool against a device not evidenced reachable, and do not raise the Cisco device count by design intent** (the matrix is normative, D-16).
8. **Do not choose the model before the hardware record and measurement exist**, and do not let weeks 7–8 idle (D-04, D-10/B3, R17, R22). **Do not relax the read-only policy under deadline pressure** — that needs a recorded decision-log entry, a re-run of PB-2…PB-5 and PB-9, and a visible change in the version-controlled policy file (R21). **Do not submit or cite anything from `legacy\`** as a statement of what this project is, and do not rebuild the later full document by pruning it.

---

## 12. Provenance and `[VERIFY]` items

Facts read 2026-09-29 from: `FYP-Proposal-SHORT.md` (all 733 lines); `FYP-Outline-DRAFT.md` (§A, §A.1, §B, §C.1–C.6, §H, §J, §K, §L, §M and the heading index); `legacy\README.md`; `proposal\00-design-baseline.md` (§1–§3); `proposal\research\wsos-2026-2447.md` (§1, §2, §4.3–4.6); `proposal\integration\{final-tidy-note, gantt-final-closeout, final-acceptance-check, source-integrity-manifest, short-proposal-reconciliation, outline-fix-log, outline-audit, emphasis-source-fix-log}.md`; `proposal\tools\md2docx\README.md` (§2–§14). Sizes and hashes measured with `Get-FileHash`/`Get-Item`; no `.docx` was read by anything other than a raw ZIP. **`[VERIFY]`:** the brief's 97.333% coverage figure (absent from the repository; the recorded instance of that failure class is 99.573%); the brief's "36 rows" escaped-pipe figure (the repository's measured figure is 71 rows containing `\|`). The project's own `[TO CONFIRM]` items are in §5 and §10.3.
