# Short-proposal reconciliation against the outline, revision 3

**Scope.** This note records the reconciliation of `FYP-Proposal-SHORT.md` / `.docx` to the authority `FYP-Outline-DRAFT.md` / `.docx` (revision 3). It is written by the reconciling agent, not by the outline's author, and it does **not** touch `proposal\integration\outline-fix-log.md`.

**Artefacts touched.**

| Artefact | Role | Before | After |
|---|---|---|---|
| `FYP-Outline-DRAFT.md` / `.docx` | **AUTHORITY** — read only, not modified | 259,634 bytes / 137,715 bytes | **unchanged** |
| `FYP-Proposal-SHORT.md` | corrected | 117,638 bytes / `F72C371CC247C62599D052BE3E0B618D758991BCF180E030234BBAC567670069` | 135,738 bytes / `8F1BC4B8E5D2946992BFFD373D9409073FBE0726D6EB86818415E63455A3CA2C` |
| `FYP-Proposal-SHORT.docx` | re-rendered | 59,103 bytes / `77E1D201A71BE0A57CECE65E0ECD1678BF4CF3F30451636C3BD76FE6C7043CEF` | 66,980 bytes / `9D97358D2B0B66292C0F46C80D948D0C6544ED29B378716DE566B97B5291E2B8` |
| `proposal\integration\backup-short-reconciliation\FYP-Proposal-SHORT.md.bak` | backup of the pre-fix source | — | 117,638 bytes |
| `proposal\integration\backup-short-reconciliation\FYP-Proposal-SHORT.docx.bak` | backup of the pre-fix render | — | 59,103 bytes / `77E1D201…3CEF` |

Every other file — including `proposal\sections\*`, `proposal\i18n\*`, `proposal\research\*`, `proposal\integration\*` (other than this note and the new backup folder), `proposal\tools\*`, the six long `FYP-Proposal-*` documents, `AY2627_FYP topics_v2_Victor Li.docx` and `image.png` — was read only or not opened at all. **No tool was modified.** No `.docx` was opened by path, by the Open XML SDK by path, by Word COM or by Word; every `.docx` read was raw ZIP access with `w:t` extraction, and `sdk-validate.ps1` was always invoked with `-Path` so that it opens from an in-memory `MemoryStream`.

---

## 1. The authoritative scheme as extracted from the outline

**AI-coverage stages — §C.6, with the minimum stated in §A/§A.1 (SQ-1) and §B.2.**

| Stage | What becomes AI-manageable | Entry gate | Exit gate | Weeks |
|---|---|---|---|---|
| **Stage A — the server estate** | §C.2b RW-01…RW-06 and RW-09: all 9 Windows guests, all 10 Ubuntu guests, the agent host | Hosts up, authenticated, logging; the Linux/Windows/monitoring/documentation servers written against evidenced rows only | Every claimed row evidenced by a filed transcript | 2–7 (AI-to-server demonstration in week 7) |
| **Stage B — the first genuinely reachable Cisco device** | **One** Cisco device with a real management plane | G0 ratified the platform (B2); the Cisco server written against one device, exec-level `show`-only, no configuration mode | `ssh` login + `show version` + one `snmpwalk -v3`, plus RESTCONF only where the image supports it | 3–8 (closes at G3, week 8, at the earliest) |
| **Stage C — the full Cisco target set** | The **five** Cisco devices fixed by D-16 (RW-07/RW-08; the ASA-class perimeter where available) | Stage B exited; the routing/switching/perimeter services up and verified | Five filed transcripts, one per device, count reconciled with D-16 | 8–10 (closes at G4, week 10) |
| **Stage D — OPTIONAL: peer-side eBGP verification** | The peer AS-65000 provider, converted from NR-01a into an RW-07 row | **Stage C is exited**; a second genuinely reachable CML IOS-XE node under D-01 with D-12 licence cover | Two-sided BGP verification, both autonomous systems, one recorded run | **10–12**, only if Stage C closed early; **not required within the 12 weeks** |

- **Minimum acceptable stage = Stage B**, justified at §C.6: Stage A alone is coherent but does not satisfy SQ-1's ratified answer (the Cisco layer must become genuinely manageable), and the only thing that demonstrates a genuinely manageable device is a device the AI layer actually manages. Stage B is the first stage at which that is true, and it needs one device and no GPU. Stage C is the operational target; Stage D is a bonus.
- **The floor is sufficient, not merely permitted:** §B.3 C6 carries a stage-based reduction symmetric with its tier-based one — where the project closes at Stage B, C6 and G4 are met by **UC-3 and UC-6**.

**Decision-ID map — §A and its §J expansions.** **D-01…D-16** plus blocking items **B1–B3**.

| ID | Subject | Status in revision 3 |
|---|---|---|
| **D-01** | Cisco platform (primary CML, fallback hybrid) | needs ratification — **B2**, end of week 1 |
| **D-02** | Hardware constraint (school/lab machines may be used) | **CLOSED** |
| **D-03** | The lab machine's role — never co-locate the model with the 19-VM estate host | decidable now, end of week 1 |
| **D-04** | GPU / VRAM tier (T0–T3; T4 described only) | **DEFERRED, NOT REFUSED** — closed at **G2-H, week 6** |
| **D-05** | Windows depth vs Cisco depth (Cisco-heavy) | end of week 2 |
| **D-06** | Committed use cases = **UC-1, UC-3, UC-4 and UC-6** | end of week 2, confirmed at G3 |
| **D-07** | Mutating tools — read-only by default, changes with approval | **CLOSED as governing policy** |
| **D-08** | Deliverable language split (English + Chinese companion) | end of week 1 |
| **D-09** | Screenshot/evidence standard (fixed caption + filename template) | end of week 2 |
| **D-10** | Which local model **family** — this is **B3** | **G2-H, week 6**, confirmed at G3; a measurement, not a choice |
| **D-11** | Is Packet Tracer kept at all? — **(b) design-time only** | **CLOSED (b), by construction** |
| **D-12** | CML licence and image entitlement | **end of week 1** |
| **D-13** | Offline-only or hybrid model access? | **OPEN** — end of week 2 |
| **D-14** | Which hypervisor / virtualisation platform | **TO CONFIRM in week 1 (gate G0)** |
| **D-15** | Remote access: OpenVPN (named in WSOS 2026) vs IKEv2/RRAS | end of week 5 |
| **D-16** | The size of the Cisco estate — **five** devices as the CML target | end of week 1, with B2/D-01 |

**Blocking items — §A.** **B2 is the only item blocking work from starting now** (end of week 1). **B1** (the lab machine's exact specification), **B3** (the model class, derived from B1 and D-04) and **D-04** are **blocked at a scheduled gate, not now**: B1 and D-04 close at **G2-H (end of week 6)**, and B3 is named at G2-H from the week-5–6 spike's measured malformed-call rate and **confirmed at G3 (week 8)**.

**Gates and weeks — §F.1.** G0 week 1 (D-01, D-02, D-03, D-05, D-09, D-11, D-12, D-16; **D-04 deliberately absent**); **G1 week 3** (one Cisco device genuinely reachable: SSH + `snmpwalk -v3` + `show version`); **G2 week 6** (MUST core up); **G2-H week 6** (hardware record captured for both hosts, tier selected; B1, B3 and D-04 close); **G3 week 8** (AI feasibility closed; the model class chosen at G2-H confirmed by the same measurement; Stage B closes at the earliest); **G4 week 10** (use cases demonstrated; the stage-based reduction applies where the project closed at Stage B); **G5 week 11**; **G6 week 12**.

**Committed use-case set — §A D-06 / §E.7 / §B.3 C6.** **UC-1, UC-3, UC-4 and UC-6**, with UC-2 and UC-5 added if week 10 allows and never all six. UC-4 is tier-dependent. Two reductions: **stage-based → UC-3 and UC-6** (closing at Stage B); **tier-based → UC-1, UC-3, UC-5 and UC-6** (T0, or a high malformed-call rate).

**Other authoritative facts used.** The Cisco interface rule: **SSH and SNMPv3 guaranteed unconditionally; RESTCONF conditional on the image** (§B.3 C1, §C.1, §C.6). Stage D is weeks 10–12 and the week-1 requirement is on the **decision** (D-12), not the build. The immediate submission is the **proposal alone**. The outline's own size is **37,555 whitespace-split words** by the §H.3 canonical method and it is explicitly **not** sized to the 6,000–10,000-word outline band.

---

## 2. Divergence table

**21 divergences were found. 21 were fixed. 0 are outstanding.** Throughout, "SP" is the short proposal and "OL" the outline.

### 2.1 Axis 1 — stage naming and the minimum stage (4 divergences)

| # | SP section | SP text (before) | OL text | Class | Resolution |
|---|---|---|---|---|---|
| 1 | §7.2 heading and table | *"The staging ramp: incremental AI coverage"* with **eight stages P0–P7** | §C.6: **four stages named Stage A, B, C and D** | **Substantive contradiction** | **Renamed and rebuilt.** §7.2 is now titled *"The staging ramp: incremental AI coverage"* and carries the OL's **Stage A/B/C/D** names, contents, entry gates, demonstrations, exit gates and weeks |
| 2 | §7.2 closing paragraph | *"**The minimum acceptable stage is P5.**"* | §C.6 / §A: *"**The minimum acceptable stage is Stage B**"* | **Substantive contradiction** | **Corrected to Stage B**, with the OL's justification (SQ-1 requires a genuinely managed device; Stage B is the first stage where one exists; one device and no GPU is enough) |
| 3 | §7.2 table | *"**P2 is the floor below which there is no AI deliverable at all**"* | §C.6: Stage A is the first AI stage; **Stage B is the floor** | **Substantive contradiction** | Removed. The floor statement is now Stage B, and the C6 reduction (UC-3 + UC-6) is stated with it |
| 4 | §7.2 passim; §7.3.1, §7.3.2 tool tables; §7.5 UC-4 | *"stage P6 only"*; UC-4 *"**Stage P6 only**"*; *"the model passed the P2 retest"*; *"Gate G1 held for the Cisco devices"* | No P-axis exists in OL; UC-4 is **tier-gated**, not a stage; the Cisco devices are Stage C; the G1 hold is stage B's entry-gate language | **Terminology drift plus a substantive re-classification** | **All P-references re-keyed.** UC-4 is now described as **tier-gated and not one of the four coverage stages** (matching OL §E.7's caveat); the mutating tools are *"UC-4 only, and only where the tier gate permits it"*; the Cisco five-device stage is Stage C |

**Was P0–P7 a different axis?** It was *presented* as the AI-coverage ramp — *"The staging ramp: incremental AI coverage"* — so on its face it is the same axis as §C.6 and had to be brought into line. In substance it was a **conflation of two different axes**: P0 (platform build) and P1 (model proven) are **build phases** in which **no** AI coverage is added, whereas §C.6's stages are defined by what the AI layer manages. That conflation is exactly what made the SP state a different minimum stage (P5, the read-only Cisco stage) from the OL (Stage B, the first genuinely managed Cisco device). The fix therefore does two things:

1. the coverage axis is now the OL's **A–D** scheme, with the same contents, gates and minimum stage; and
2. the **build-phase axis is retained but explicitly distinguished**, in a new paragraph in §7.2: *"the stages above describe what the AI layer manages and in what order; the build phases of section 8.2 describe what the team builds and when … An earlier draft ran the two together as a single 'P0 to P7 ramp', which is how a 'minimum acceptable stage' came to be stated as the read-only Cisco stage rather than the first genuinely managed Cisco device."* The build phases are given as weeks 1–3, 4–6, 7–8, 9–10 and 11–12, matching §D.3 and §F.2.

### 2.2 Axis 2 — decision identifiers (10 divergences)

| # | SP ID (before) | SP subject (before) | OL ID | OL subject | Resolution |
|---|---|---|---|---|---|
| 5 | **D-02** | Cisco estate size | **D-16** | The size of the Cisco estate — five devices | **Re-keyed to D-16**; wording and cell contents taken from OL §A D-16 / §J-D-16 |
| 6 | **D-03** | Hardware for the local model **and the model tier**; *"Blocking, and deferred"* | **D-03** = the lab machine's **role**; **D-04** = the GPU/VRAM **tier**; **B1** = the specification record | Different decisions, and the OL splits them across three records | **Split into three.** SP D-03 is now the OL's **D-03** (the role rule, *never co-locate*); the tier is now **D-04**; the specification record is **B1** |
| 7 | **D-04** | *"Scheduled decision point for D-03"* — *"Record the specification in week 1 … schedule the model-selection spike for weeks 5 and 6"* | **D-04** is the tier, and **B1/D-04 are deferred to G2-H, end of week 6**; there is no week-1 specification deadline | Wrong ID **and** stale timing | **Replaced.** The SP D-04 row is now the OL's **D-04** (tier), status *"DEFERRED, NOT REFUSED: closed at G2-H, end of week 6 (was end of week 1)"* |
| 8 | **D-05** | Committed AI use cases | **D-06** | The demonstrable AI use cases to commit to | **Re-keyed to D-06**, content updated to the four-use-case commitment |
| 9 | **D-06** | Immediate submission scope | **no D-row** (it is SQ-5, recorded at §A.1 and §H.3) | — | **Row removed**; the subject is now carried under the SQ-5/§H.3 wording (*"the immediate submission is the proposal alone"*) |
| 10 | **D-07** | Windows depth vs Cisco depth | **D-05** | Windows depth vs Cisco depth | **Re-keyed to D-05** |
| 11 | **D-08** | Remote access: OpenVPN or IKEv2/RRAS | **D-15** | Remote-access technology: pick one, and only one | **Re-keyed to D-15** |
| 12 | **D-09** | Offline model only, or a hosted fallback | **D-13** | Offline-only or hybrid model access? — **OPEN** | **Re-keyed to D-13**, with the OL's **OPEN** status made explicit (the SP called it a recommendation without stating that the row is still open) |
| 13 | **D-10** | Virtualisation platform | **D-14** | Which hypervisor / virtualisation platform | **Re-keyed to D-14** |
| 14 | **D-11** | Model family | **D-10** | Which local model family to standardise on — **B3** | **Re-keyed to D-10**, with B3 named |
| 15 | **D-12** | Cisco platform licence and image entitlement; *"**Blocking**"* | **D-12** | CML licence and image entitlement | **ID correct, status corrected**: D-12 is a **week-1 deadline**, not the "blocking now" item — **B2** is |
| 16 | **D-13** | Evidence standard | **D-09** | Screenshot and evidence standard | **Re-keyed to D-09** |
| 17 | **D-14** | Deliverable language split | **D-08** | Deliverable language split | **Re-keyed to D-08** |
| 18 | **absent** | — | **D-02**, **D-07**, **D-11** | Hardware constraint (CLOSED); mutating tools (CLOSED); Packet Tracer role (CLOSED (b)) | **Added** as rows, with the OL's status, so the "three closed rows" are visible in the condensed document |
| 19 | **absent** | — | **B1**, **B2**, **B3** | The three blocking items | **Added** as a distinct paragraph after the decision table, with the OL's identifiers and statuses |
| 20 | §4.3 C-02; §7.2; §11 R17/R18/R20/R22; §13 item 1 | *"The model's hardware is a blocking unknown until its specification is recorded"*; *"the specification record is a blocking action item with a week-1 deadline"*; *"Establish the booking rules in week 1"* | §A, §C.6, §E.1.1, §J-B1/D-03/D-04, §K R18/R20, §M item 1: **B2 is the only current blocker**; B1/B3/D-04 close at G2-H week 6 | **Substantive contradiction** — the SP treated the hardware as blocking now | **Reconciled**: C-02 now says *"deferred, not refused … recorded and selected at the scheduled gate G2-H, end of week 6, and they do not block work from starting now"*; R17/R18/R20 and §13 item 1 now carry the G2-H gate and say the date moved, not the requirement |

**Result:** the short proposal now uses **D-01…D-16 and B1–B3** with the outline's numbering, wording and status for every one of the sixteen rows, and the three closed rows and one current blocker are identifiable from the condensed table alone.

### 2.3 Axis 3 — other revision-3 changes (7 divergences)

| # | SP section | SP text (before) | OL text | Resolution |
|---|---|---|---|---|
| 21 | §4.3, §7.2, §10, §11, §13 | The hardware specification record was a **week-1 blocking item**; nothing named G2-H | *"**Only ONE item still blocks work starting now — B2, and nothing else**"*; B1/B3/D-04 close at **G2-H, end of week 6**; G3 week 8 as the follow-up | **Fixed** — see #20 |
| 22 | §7.5 | Committed set = *"UC-1, UC-3 and UC-4"*; *"commit to three, aim for five"*; T0 reduction = *"UC-1, UC-3 and UC-5"* | §A D-06 / §E.7 / §B.3 C6: committed set is **UC-1, UC-3, UC-4 and UC-6**; *"Commit to four, aim for six, and never promise all six"*; T0 reduction includes UC-6 | **Fixed**: *"Four use cases are committed … commit to four, aim for six, never promise six"*; UC-6 is in the committed set with the reason (Stage A's exit gate is UC-3 + UC-6); the tier reduction is now **UC-1, UC-3, UC-5 and UC-6** |
| 23 | no completion conditions existed | The SP had **no** §B.3 equivalent, so C6 and its reduction clause did not exist in it | §B.3 C6 now opens *"**The committed set (D-06) is UC-1, UC-3, UC-4 and UC-6**"* and carries a **stage-based** reduction (UC-3 + UC-6) symmetric with the tier-based one | **Added** a new **§3.3 "The completion conditions, and the two stated reductions"** with C1–C8 in condensed form, including both C6 reductions |
| 24 | §4.1, §5.1, §5.4, §5.5 | *"five devices that expose real SSH, SNMPv3 and, where the image supports it, RESTCONF"*; RESTCONF listed alongside SSH/SNMPv3 with no guaranteed/conditional split | §B.3 C1, §C.1, §C.6: **SSH and SNMPv3 are the two unconditional interfaces**; **RESTCONF is conditional by design and is not required to pass C1** | **Fixed in four places**: §1, §3.2 objective 7, §4.1, §5.1 (the *"two guaranteed interfaces"*), §5.4 (the Cisco row), §5.5 |
| 25 | §5.4 closing; §5.6; no Stage D text | *"a peer-side view would require the provider to become a second reachable virtual router, **which is a week-1 decision because it changes the device count and the platform entitlement**"* — no weeks given | §C.4 / §J-D-01 / §C.6: *"**The week-1 requirement is on the decision — the licence and entitlement question — which is D-12's and needs no hardware, and it is not on the build**"*; Stage D falls in **weeks 10–12** | **Fixed**: §5.4 now says *"the week-1 requirement is on the decision, not on the build … the node itself is built only after Stage C is exited at G4 (week 10), which is why Stage D falls in weeks 10–12"*; and §7.2's Stage D row states the weeks and the entry gate |
| 26 | §10 D-06; §12.1 | *"**This condensed proposal plus an initial report**"* as the immediate submission; §12.1 *"Two artefacts are submitted now"* | §A.1 SQ-5 / §H.1 / §H.3: *"**the immediate submission is the proposal alone**"*; *"Nothing else is being submitted at this stage"*; the initial report is *"a likely future deliverable, not current scope"* | **Fixed**: §12.1 now says *"One artefact is submitted now, and it is this condensed proposal alone. **Nothing else is being submitted at this stage.**"* and the initial report is described as a future deliverable; the old submission-scope decision row was removed |
| 27 | §8.2; §13 | The weekly plan had **no row** for writing the proposal, and §13 did not carry it as an item | §F.2 gained a **"2–3"** row for **D5, the immediate submission**, placed after G0 and clear of G1/G2/G2-H; §M item 13 cross-references it | **Fixed**: §8.2 gained a **"1-3 (the immediate submission)"** row, and §13 item 13 is *"Write the proposal — the immediate submission tier"* |
| 28 | §12.2, §8.2 | *"The later submission is a focus-corrected full proposal and report of 90,000 to 110,000 words"* with no statement that this is a later tier | §H.3: two tiers, *"(ii) LATER — the full submission … **Later, and not the immediate deliverable**"* | **Fixed**: §12.2 now adds the 58–69 per cent cut against the 286,932-word corpus and states *"**This tier is later, and it is not the immediate deliverable.**"* |
| 29 | §1 | *"the full document at the 90,000-110,000-word scale is a later tier and is not submitted now"* — correct, and retained | §H.3: the outline's **37,555** words is a property of the outline and is **not** the proposal's band | **No divergence — checked and confirmed.** The SP does **not** import the outline's size claim, and the string `37,555` does not occur in it. The SP's own length is its own measure |

### 2.4 Axis 4 — factual statements about the standards (1 divergence)

| # | SP section | SP text (before) | OL text | Resolution |
|---|---|---|---|---|
| 30 | §9.2 | *"the three routing protocols in a single line, gateway and link redundancy, neighbour discovery, flow export, syslog, SNMP, **packet capture**, Bash, PowerShell, Git and Ansible"* | §I.2: **ADDS, LDAP, Windows DNS, BIND, DHCP/DNS/NAT/NTP, SSH, RDS, AD CS, OpenSSL, SMB, DFS, NFS, FTP, Apache, Nginx, IIS, Windows Server Backup, rsync, WDS, Group Policy, Software RAID, mdadm, LVM, NTFS, ReFS, EXT4, OSPF, BGP, EIGRP, GLBP, HSRP, VRRP, LACP, PAgP, IPSec, SSL VPN, Direct Access, OpenVPN, DMVPN, GRE, CDP, NetFlow, Syslog, SNMP, tcpdump, VLAN, IPv4, IPv6, Bash, PowerShell, Git, Ansible, Icinga2/Nagios/Cacti/Windows Resource Monitor, Cisco/Microsoft/Linux certification* | **Fixed**: §9.2 now names **OSPF, BGP and EIGRP** explicitly; the redundancy set as **GLBP, HSRP, VRRP, LACP and PAgP** (PAgP was missing); neighbour discovery as **CDP**; flow export as **NetFlow**; and packet capture as **`tcpdump`**. No technology was added that the standard does not name, and none of the named-absent nine was moved into the named set |

**The rest of axis 4 was verified and found already correct** — these are recorded as checks, not changes:

| Claim | SP before | OL | Verdict |
|---|---|---|---|
| Named-absent set | *"**FSRM, iSCSI, RRAS, IKEv2, Keepalived, nftables, WireGuard, RSTP and ASA**"* have zero occurrences | §I.3: the identical nine | **Agrees — no change** |
| No AI content | *"The 2026 standard contains no artificial-intelligence content whatsoever"*; zero occurrences of agentic, MCP, Model Context Protocol, artificial intelligence or machine learning | §I.4: *"WSOS 2026 contains no AI content whatsoever"*; zero occurrences of AI, artificial intelligence, machine learning, Agentic, OpenClaw and MCP | **Agrees — no change** |
| 2026 removals | *"the 2026 edition removed four items from its automation domain that the 2024 edition contained: Python, YANG, RESTCONF and NETCONF"*; RESTCONF must not be cited as a standard requirement | §I.5: identical, plus *"do not cite the standard as requiring RESTCONF or NETCONF"* | **Agrees — no change** |
| Screen captures | *"the requirement for screen captures comes from the HDTN brief and not from the standard: the 2026 page contains zero occurrences of screen, screenshot, capture or evidence"* | §H.2: *"it is the **HDTN brief's**, not the standard's"* | **Agrees — no change** |
| One difference of edition scope | *"zero occurrences … in the text or in the raw page source, and in **neither the 2026 nor the 2024 edition**"* | §I.4 makes the claim for **2026** and notes the 2024 contrast only for the domain-5 removals (§I.5) | **Residual, classified (i) in §5 below** |

### 2.5 Axis 5 — Packet Tracer reachability (verified, one strengthening)

| # | SP section | SP text (before) | OL text (§C.2a) | Resolution |
|---|---|---|---|---|
| 31 | §4.5 | *"**A Cisco Packet Tracer device cannot be reached by anything this project builds.** … Therefore no MCP tool, no AI agent, no Ansible playbook and no script may claim to reach, read from or configure one, and any sentence, table row, diagram arrow or test case that implies otherwise **will be deleted from the corpus**."* | *"**No MCP tool, AI agent, Ansible playbook or script in this project may claim to reach, read from, or configure a Cisco Packet Tracer device.** … **Packet Tracer devices are NOT REACHABLE.** … Any sentence, table row, diagram arrow, tool description or test case that implies otherwise **is a fabrication and must be deleted**."* | The **strength was already equivalent**, but the formulation differed. **Aligned to the outline's formulation** so the two can be compared word for word: the SP now leads with the outline's sentence and adds *"is a fabrication and will be deleted"* and *"**Packet Tracer devices are therefore not reachable**"* |

The SP's §4.2 out-of-scope bullet, §4.3 C-05, §5.4's `not reachable` rows (including the simulated provider with its peer-side cost) and §11 R12 were checked and **already agreed with** OL §B.4, §C.2a, §C.2b NR-01/NR-01a and §K R12. R12 in particular already carried the outline's mitigation verbatim in substance: the crossed-out arrow, the verbatim reachability rule, and a consistency sweep for any automation claim attached to a Packet Tracer device.

---

## 3. Every change made, in one line each

1. **§Front matter** — added a *decision and stage key* row (**D-01…D-16**, **B1–B3**, **Stage A–D**, minimum **Stage B**) and restated Status as *the immediate submission tier (D5, 15-25 pages)* with the 90,000–110,000-word document explicitly later.
2. **§1** — Cisco interfaces restated as *SSH and SNMPv3 unconditionally, plus RESTCONF where the image supports it; the first two are the guarantee, the third is conditional*.
3. **§1** — added the four-stage paragraph with **Stage A–D** and *"the minimum acceptable stage is Stage B"*.
4. **§1** — immediate submission stated as *this proposal alone*, later tier distinguished.
5. **§1** — split the run-on verification/deliverables paragraph into two so each sits on one physical line.
6. **§3.2 objective 7** — added the guaranteed-versus-conditional interface rule *(the unconditional guarantee … RESTCONF is conditional on the image and is not required at this gate)*.
7. **§3.3 (new)** — added the condensed completion conditions **C1–C8**, with **C6 carrying both the stage-based (UC-3 + UC-6) and tier-based (UC-1, UC-3, UC-5, UC-6) reductions** and the committed set named as UC-1, UC-3, UC-4 and UC-6.
8. **§4.1** — the Cisco layer now reads *exposing SSH and SNMPv3 unconditionally and RESTCONF only where the image supports it*; the documentation-set list is cross-referenced to §12 instead of repeated.
9. **§4.3 C-02** — hardware is *deferred, not refused*, recorded and selected at **G2-H, end of week 6**, and *does not block work from starting now*.
10. **§4.4** — merged the mis-numbered assumptions 5 and 6 into assumption 5 (they were on one physical line and read as a single numbered item).
11. **§4.5** — replaced the Packet Tracer paragraph with the outline's formulation, adding *"is a fabrication"* and *"Packet Tracer devices are therefore not reachable"*.
12. **§5.1** — the Cisco row now marks SSH and SNMPv3 as *the two guaranteed interfaces* and RESTCONF as *conditional on the image*.
13. **§5.2** — compressed the carried-forward plan list (VLAN, subnet, DHCP scope, static host address, DNS record) onto one clause.
14. **§5.4** — the legend now names the stage-to-row mapping (**Stage A** server estate, **Stage B** one Cisco device, **Stage C** the five, **Stage D** the provider conversion).
15. **§5.4** — the Cisco row now marks SSH and SNMPv3 as the two guaranteed interfaces.
16. **§5.4** — the closing paragraph now states *the week-1 requirement is on the decision, not on the build*, that the node is built only after Stage C exits at **G4 (week 10)**, and that **Stage D falls in weeks 10-12**.
17. **§5.5** — the platform choice is identified as **D-01**, *the one item that blocks work from starting now (**B2**)*; CML described as *real SSH and real SNMPv3 as the guaranteed interfaces and real RESTCONF on images that support it*; the licence check tagged **D-12**.
18. **§5.6** — the five-device count tagged **D-16**.
19. **§7.2** — **rebuilt**: the P0–P7 table replaced by the **Stage A/B/C/D** table with the outline's contents, entry gates, demonstrations, exit gates and weeks (A weeks 2-7; B weeks 3-8 closing at G3; C weeks 8-10 closing at G4; **D weeks 10-12, optional**).
20. **§7.2** — added the paragraph distinguishing **build phases** (weeks 1-3, 4-6, 7-8, 9-10, 11-12) from **coverage stages**, and recording why the earlier single "P0 to P7 ramp" conflated them.
21. **§7.2** — the minimum-stage paragraph now states **Stage B**, with the outline's justification, and that the floor is *sufficient and not merely permitted* because C6's stage-based reduction is met by **UC-3 and UC-6**.
22. **§7.2** — UC-4 restated as **tier-gated and not one of the four coverage stages**; the tool-surface freeze sentence tightened.
23. **§7.3.1, §7.3.2** — both mutating tools re-classified from *"stage P6 only"* to *"UC-4 only, and only where the tier gate permits it"*.
24. **§7.3.6** — compressed to five rules' worth of prose from six (the redaction-rules clause was a duplicate of the deny-list statement).
25. **§7.5** — commitment changed to **UC-1, UC-3, UC-4 and UC-6** with *commit to four, aim for six, never promise six*; UC-6's reason added to its row and to the closing paragraph; the tier reduction corrected to **UC-1, UC-3, UC-5 and UC-6**; the stage reduction (**UC-3 and UC-6**) added.
26. **§7.6** — tightened items 2, 4, 5 and 6 and the metrics paragraph (no change of content).
27. **§7.7** — tightened.
28. **§8.1** — **G0's condition restated as the outline's answered set (D-01, D-02, D-03, D-05, D-09, D-11, D-12, D-14, D-16) with D-04 explicitly excluded** and D-03 identified as the role rule.
29. **§8.1** — added the **G2-H (week 6)** gate row, with the B1/B3/D-04 closure, the two-host specification record and the fail-forward instruction.
30. **§8.1** — **G1** now notes that SSH and SNMPv3 are the unconditional guarantee and RESTCONF is conditional at that gate.
31. **§8.1** — **G3** now notes that the model class chosen at G2-H is confirmed there and that **Stage B closes here at the earliest**.
32. **§8.1** — **G4** now carries the stage-based reduction clause (*where it closed at Stage B … G4 is met by UC-3 and UC-6*).
33. **§8.2** — added the paragraph on the hardware-agnostic phase proceeding from week 1 and on the immediate submission being this proposal alone.
34. **§8.2** — added the **"1-3 (the immediate submission)"** row to the weekly plan, with the *no blocking gate of its own* note.
35. **§8.2 week 1** — S4 now also starts the hardware-agnostic work (MCP server skeletons, evaluation harness).
36. **§8.2 week 6** — the gate cell now reads **G2 required core complete; G2-H hardware and model tier decided**, and S4's cell names the two-host specification capture and tier selection.
37. **§10** — **the whole decision table replaced**: sixteen rows keyed **D-01…D-16** with the outline's subjects, wording, statuses and deadlines, and columns *Decision / Options / Recommendation / Status and by when / Consequence*.
38. **§10** — added the **blocking-items paragraph**: **B2 is the only item blocking now**; **B1, D-04 and B3 are blocked at a scheduled gate**, B1 and D-04 closing at **G2-H week 6** and B3 named at G2-H and confirmed at **G3 week 8**; the date moved, the requirement did not.
39. **§10** — the open-items paragraph now names **D-13 (OPEN)**, **D-04/B1 (deferred and dated)**, **D-10 (a measurement)**.
40. **§11 R11** — *commit to four, aim for six* with the C6 stage-based floor.
41. **§11 R17** — **B1 is a blocking action item with a dated gate: G2-H, end of week 6** (was a week-1 deadline).
42. **§11 R18** — the booking rules are established at **G2-H** because they depend on the machine B1 records; week 1 keeps only the scripted-and-queueable rule.
43. **§11 R20** — the installation/network questions are asked **at the G2-H gate as part of B1's record** (was *in week 1*).
44. **§11 R22** — recast from *the specification can be recorded by remote instruction* to the dated-gate form: B1 and D-04 close at **G2-H**, the hardware-agnostic phase proceeds meanwhile, and if the answer has not arrived by week 6 the processor-only plan is taken and the measurement chooses.
45. **§12.1** — *one artefact is submitted now, and it is this condensed proposal alone … nothing else is being submitted at this stage*; the initial report is a **likely future deliverable, not current scope**.
46. **§12.2** — *this tier is later, and it is not the immediate deliverable*; the 58–69 per cent cut stated.
47. **§12.2 D5 row** — *the proposal: the immediate submission, and the only thing being submitted now*.
48. **§12.3** — tightened the evidence-standard paragraph (no change of content).
49. **§13 preamble** — *only one item blocks work from starting now - item 2, the Cisco platform ratification (B2)*; item 1 is a dated gate.
50. **§13 item 1** — the specification record is **gate G2-H, end of week 6 (B1)**, for both the model host and the Cisco platform host, with *the date moved; the requirement did not*.
51. **§13 item 2** — *Ratify the Cisco platform - BLOCKING NOW (B2)*, with the direction already ratified and only the platform record outstanding.
52. **§13 item 5 (new)** — start the hardware-agnostic work in week 1 and do not idle on the deferred hardware answer.
53. **§13 items renumbered to 14** with the decision-confirmation item listing **D-05, D-06, D-13, D-14, D-15, D-16** and the **D-14 required at G0** warning.
54. **§13 item 13** — write the proposal as the immediate submission tier, with its placement in §8.2 stated.
55. **§9.2** — standards-naming sentence corrected to the outline's names (OSPF/BGP/EIGRP; GLBP/HSRP/VRRP/LACP/PAgP; CDP; NetFlow; `tcpdump`; Nginx; OpenVPN; Bash/PowerShell/Git/Ansible).
56. **Whole document** — trimmed roughly 900 words of prose so that the reconciliation did not inflate the artefact beyond its band (see §4 below), with every identifier, stage, gate and status preserved.

**Nothing was added that is not a restatement of an outline fact.** No section was reordered or renumbered, no tool was modified, and no read-only file was touched.

---

## 4. Gates, coverage and hash stability

All figures are from the delivered build. Every `.docx` gate was invoked with `-Path` (in-memory `MemoryStream`); no `.docx` was opened by path, by Word COM or by Word.

| Gate | Command | Result |
|---|---|---|
| **Baseline (pre-fix), for comparison** | `validate.ps1` on the old `.docx` | `1,268 / 1,268 = 100.000%`, tables 28, `extracted words 17,355`, **PASS** |
| **SDK validation** | `powershell -NoProfile -ExecutionPolicy Bypass -File .\sdk-validate.ps1 -Path …\FYP-Proposal-SHORT.docx` | **`OPEN : OK`, `ERRORS: 0`**, `RAW : no duplicate relationship Ids, no duplicate content-type declarations`, `SUMMARY\|files=1 openFailures=0 validationErrors=0 rawIssues=0`, SDK 2.9.1.0, Office2013. Exit **0** |
| **Package verification** | `powershell -NoProfile -ExecutionPolicy Bypass -File .\verify-package.ps1 -Path …\FYP-Proposal-SHORT.docx` | **`RESULT\|…\|PASS\|all 9 checks passed`** — content types 2 Default / 11 Override / all 14 parts; `_rels/.rels` 4 unique; `document.xml.rels` 7 unique; 2 `r:id` all resolve; **tables 29** with every `w:tblGrid` matching every row's `tc` count; 29 styles; 2 `numId`s; `w:body` **301** children with exactly one trailing `w:sectPr`. Exit **0** |
| **Coverage** | `powershell -NoProfile -ExecutionPolicy Bypass -File .\validate.ps1 …\FYP-Proposal-SHORT.docx -MarkdownPath …\FYP-Proposal-SHORT.md` | **`source content lines checked : 1,318` · `lines found verbatim : 1,318 (100.000%)` · `COVERAGE PROOF: every source content line is present in the document` · `RESULT: PASS`**, exit **0**. **Did not drop**: the checked set grew from 1,268 to **1,318** content lines and completeness is unchanged at **100.000%**. `TABLE INTEGRITY: all 29 table(s) rectangular (259 rows)`; heading counts Markdown `H1 1 / H2 15 / H3 40 / H4 6` versus render `0 / 15 / 40 / 6` on the same reconciliation |
| **Hash stability** | SHA-256 and byte length taken before SDK validation, between every gate and after the last | `9D97358D2B0B66292C0F46C80D948D0C6544ED29B378716DE566B97B5291E2B8`, 66,980 bytes — **identical at every step**. **Validation did not mutate the artefact** |
| **Markdown stability** | SHA-256 of the `.md` taken before and after the render | `8F1BC4B8E5D2946992BFFD373D9409073FBE0726D6EB86818415E63455A3CA2C`, 135,738 bytes — **unchanged**; the converter read the source without writing to it |
| **Line convention** | Checked for consecutive plain-prose lines | **No hard-wrapped paragraph.** The two adjacent plain-prose pairs present in the source (executive summary §1, §5.5) were pre-existing and were separated into distinct paragraphs; the §1 split was repaired |
| **Emphasis-parser limitation** | Checked for a bold span whose content ends with a period immediately before the closing delimiter | **Not tripped.** The render needed **no** rewording for the converter's documented limitation, and **no tool was touched** |

**Rendering command** (unchanged tool, same title as before):

```
powershell -NoProfile -ExecutionPolicy Bypass -File .\convert.ps1 `
  -InputPath  D:\File\School\FYP\FYP-Proposal-SHORT.md `
  -OutputPath D:\File\School\FYP\FYP-Proposal-SHORT.docx `
  -Title "Victor2 - Enterprise Network Infrastructure and Architect: Project Proposal"
```

The title is byte-identical to the previous render's `dc:title`, `TitlesOfParts` and running header, so the delivered document's identity is unchanged. Converter report: 14 zip parts, 271 paragraphs (headings 0/15/40/6), 29 tables, 1 code block, 54 list items, 1 figure, `words 20,394`, exit 0. The converter is **not idempotent** (fresh package timestamps), so a later re-render of the same Markdown will differ in bytes and hash; the figures above are this delivery's.

### Length of the corrected short proposal

| Measure | Value | How produced |
|---|---|---|
| **Prose words** (delivered `.docx`: body paragraphs excluding table cells, headings and the fenced code block) | **10,860** | raw ZIP `word/document.xml`, `w:t` extraction per `w:p` outside `w:tbl`, minus `Heading*` and `SourceCode` paragraphs |
| Paragraph words including headings and code | 11,413 | same extraction, all `w:p` |
| Table cell words | 9,068 | all `w:t` inside `w:tbl` |
| **Total whitespace-split words** (the measure `validate.ps1` prints as *"extracted words"*) | **20,394** | `validate.ps1` on the delivered file |
| Source `.md`, whitespace-split | 22,037 | raw Markdown — reported for transparency only, since it retains table pipes and markup the renderer drops |

**This is a divergence from the 6,000–10,000-word prose band, and it is reported rather than hidden.** The reconciled document measures **10,860 prose words**, about **8.6 per cent above the band's ceiling**. Roughly 900 words of prose were cut during this reconciliation to keep the growth down, but the change set the task required is additive in substance: adopting the outline's stage scheme with four stages and their gates, re-keying fourteen decision rows and adding the three absent closed rows and the three blocking items, adding the completion conditions with the stage-based reduction clause, restoring the deferred-hardware position in five places, and adding the immediate-submission row to the weekly plan. Trimming a further ~900 words would require deleting committed substance — the decision table, the completion conditions or the evaluation set — rather than tightening prose. **The band is a programme figure that the outline itself records as `[TO CONFIRM]` against the programme handbook for the proposal tier (§H.3), and the outline places the proposal's own band at 15–25 pages (D5).** Both the identifier-keyed decision table and the completion conditions are exactly what the outline's §H.3 option 1 names as the decision content the proposal must carry. The figure above is the reproducible measure; a reviewer who wants to apply a different prose definition has the method stated with it.

---

## 5. Cross-document consistency proof, with residual differences classified

Every item below was proved by exact-string probe against both delivered files.

| # | Property | Outline (authority) | Short proposal (corrected) | Verdict |
|---|---|---|---|---|
| 1 | **Stage names** | §C.6 *"**A — the server estate**"*, *"**B — the first genuinely reachable Cisco device**"*, *"**C — the full Cisco target set**"*, *"**D — OPTIONAL: peer-side eBGP verification**"* | *"four stages named **Stage A, Stage B, Stage C and Stage D**"*, and the table rows *"**Stage A - the server estate**"*, *"**Stage B - the first genuinely reachable Cisco device**"*, *"**Stage C - the full Cisco target set**"*, *"**Stage D - OPTIONAL: peer-side exterior-routing verification**"* | **AGREE** |
| 2 | **Minimum stage** | §C.6 *"**The minimum acceptable stage is Stage B**"* (and §A.1 SQ-1) | §7.2 *"**The minimum acceptable stage is Stage B**"* (§1 and the front-matter key state it too) | **AGREE** |
| 3 | **Minimum-stage justification** | §C.6: Stage A alone does not satisfy SQ-1; *"the only thing that demonstrates a genuinely manageable network device is a **device the AI layer actually manages**"*; Stage B needs *"**one** device and **no GPU**"*; *"**So Stage B is the floor, not the target.** Stage C is the **operational target**; Stage D is a **bonus**"* | §7.2: *"the only thing that demonstrates a genuinely manageable device is a **device the AI layer actually manages**. Stage B is the **first stage at which that is true**, and it is achievable with **one** device and **no GPU** … **So Stage B is the floor, not the target.** Stage C is the **operational target**; Stage D is a **bonus**"* | **AGREE** |
| 4 | **Decision identifiers** | D-01…D-16, B1–B3 (§A, §J) | D-01…D-16, B1–B3, sixteen rows in the same order | **AGREE (count = 16 + 3)** |
| 5 | **D-01** | Cisco platform, primary CML / fallback hybrid, **needs ratification (B2)** | identical subject, recommendation and *"Needs ratification at B2, end of week 1"* | **AGREE** |
| 6 | **D-02** | Hardware constraint — **CLOSED** | *"**Closed: school and laboratory machines may be used**"* | **AGREE** |
| 7 | **D-03** | The lab machine's role — never co-locate | *"**(a) never co-locate the model with the nineteen-guest estate host**"*, decidable now, week 1 | **AGREE** |
| 8 | **D-04** | GPU/VRAM tier — **DEFERRED, NOT REFUSED**, closed at **G2-H, week 6** | *"**DEFERRED, NOT REFUSED: closed at G2-H, end of week 6** (was end of week 1)"* | **AGREE** |
| 9 | **D-05** | Windows vs Cisco depth — Cisco-heavy | Cisco-heavy, end of week 2 | **AGREE** |
| 10 | **D-06** | Committed use cases — UC-1, UC-3, UC-4, UC-6 | *"**Commit to UC-1, UC-3, UC-4 and UC-6**; add UC-2 and UC-5 if week 10 allows; never promise all six"* | **AGREE** |
| 11 | **D-07** | Mutating tools — **CLOSED as policy** | *"**Closed: read-only by default; changes only with human approval**"*, *"**Closed as governing policy**"* | **AGREE** |
| 12 | **D-08** | Language split — English + Chinese companion | identical, end of week 1 | **AGREE** |
| 13 | **D-09** | Evidence standard — fixed template | identical, including `Figure {n}: …` and `{date}_{host}_{what}.png` | **AGREE** |
| 14 | **D-10** | Local model family — **B3**, a measurement, **G2-H week 6**, confirmed G3 | *"**[TO CONFIRM] after the hardware record and the probe-set measurement** … **G2-H, end of week 6** … **confirmed at G3 (week 8)**"* | **AGREE** |
| 15 | **D-11** | Packet Tracer kept — **CLOSED (b) by construction** | *"**(b) Closed: keep it, strictly as a design-time tool, labelled as such in every figure.** Nothing automates it"* | **AGREE** |
| 16 | **D-12** | CML licence and image entitlement — end of week 1, never from memory/a mirror | identical, *"never from memory, a forum post or a mirror"* | **AGREE** |
| 17 | **D-13** | Offline-only or hybrid — **OPEN** | subject and recommendation identical, status *"**OPEN - end of week 2**"* | **AGREE** |
| 18 | **D-14** | Hypervisor platform — **TO CONFIRM, week 1, gate G0** | identical, *"**End of week 1, gate G0**"* | **AGREE** |
| 19 | **D-15** | Remote access — OpenVPN; IKEv2/RRAS absent from the standard | identical, *"the only one of the two named in the standard"* | **AGREE** |
| 20 | **D-16** | Cisco estate size — **five** target, up to eight evidenced; 2–4 hybrid | identical, end of week 1 with B2/D-01 | **AGREE** |
| 21 | **Blocking items** | §A: *"**Only ONE item still blocks work starting now — B2, and nothing else**"*; B1, B3, D-04 in the *"blocked at a gate"* table at **G2-H week 6**, B3 **confirmed at G3 (week 8)** | §10: *"**B2 … is the only item that blocks work from starting now**"*; *"**Three further items are blocked at a scheduled gate rather than now:** B1 …, D-04 …, and B3 …, which is derived from B1 and D-04"*; B1/D-04 at G2-H, B3 confirmed at G3 | **AGREE** |
| 22 | **Committed use-case set** | §A D-06 / §E.7 / §B.3 C6: *"**The committed set (D-06) is UC-1, UC-3, UC-4 and UC-6**"* | §3.3 C6 and §7.5: *"**The committed set (D-06) is UC-1, UC-3, UC-4 and UC-6**"* | **AGREE (identical string)** |
| 23 | **C6 stage-based reduction** | §B.3 C6 / §F.1 G4: *"C6 is met by the reduced committed set UC-3 and UC-6"*; *"the stage-based reduction in §B.3 C6 applies: G4 is met by UC-3 and UC-6"* | §3.3 C6: *"C6 is met by the reduced committed set **UC-3 and UC-6**"*; §8.1 G4: *"the stage-based reduction in C6 applies: G4 is met by UC-3 and UC-6"* | **AGREE** |
| 24 | **C6 tier-based reduction** | §E.1.2 T0 / §E.1.3 / §E.7: reduced set *"UC-1, UC-3, UC-5 and UC-6"* | §3.3 C6 and §7.5: *"**UC-1, UC-3, UC-5 and UC-6**"* | **AGREE** |
| 25 | **Gates: G0** | §F.1 G0 week 1, D-01/D-02/D-03/D-05/D-09/D-11/D-12/D-16, *"**D-04 is deliberately NOT in this list**"* | §8.1 G0 week 1, the same nine IDs, *"**D-04 is deliberately NOT in this list** - it is the deferred hardware row, and it is answered at **G2-H (week 6)**"* | **AGREE** |
| 26 | **Gates: G1** | §F.1 **G1 week 3**, SSH + `snmpwalk -v3` + `show version` | §8.1 **G1 week 3**, same three, plus *"these two interfaces are the unconditional guarantee; RESTCONF is conditional on the image at this gate"* | **AGREE** |
| 27 | **Gates: G2** | §F.1 **G2 week 6**, MUST core up | §8.1 **G2 week 6**, required core up | **AGREE** |
| 28 | **Gates: G2-H** | §F.1 **G2-H week 6** — the hardware record for both hosts, the tier selected, *"the gate at which B1, B3 and D-04 are closed"* | §8.1 **G2-H week 6** — same record, same closure, same fail-forward | **AGREE** |
| 29 | **Gates: G3** | §F.1 **G3 week 8** — malformed-call rate measured, model class confirmed, *"§C.6's Stage B closes here at the earliest"* | §8.1 **G3 week 8** — same, *"**Stage B closes here at the earliest**"* | **AGREE** |
| 30 | **Gates: G4** | §F.1 **G4 week 10** with the Stage-B reduction clause | §8.1 **G4 week 10** with the same clause | **AGREE** |
| 31 | **Gates: G5 / G6** | **week 11 / week 12** | **week 11 / week 12** | **AGREE** |
| 32 | **Stage D weeks** | §C.6: *"**Weeks 10–12, and only if Stage C closed early**"*, entry gate *"Stage C is exited"*, *"Stage C closes at **G4 (week 10)**"* | §7.2: *"**Weeks 10-12, and only if Stage C closed early**"*, *"Its entry gate is that Stage C is exited, and Stage C closes at **G4 (week 10)**, so Stage D cannot begin before week 10"* | **AGREE** |
| 33 | **Week-1 decision vs week-10 build** | §C.4 / §J-D-01: *"**The week-1 requirement is on the decision — the licence and entitlement question — which is D-12's and needs no hardware, and it is not on the build**"*; *"A week-1 decision and a week-10 build are not in tension"* | §5.4: *"**The week-1 requirement is on the decision, not on the build:** the licence and entitlement question (**D-12**) … the node itself is built only after Stage C is exited at **G4 (week 10)**"*; *"A week-1 decision and a week-10 build are not in tension"* | **AGREE** |
| 34 | **Cisco interface guarantee** | §B.3 C1: *"working SSH and SNMPv3 unconditionally … plus RESTCONF where the image supports it"*; §C.1 and §C.6: the two guaranteed interfaces, RESTCONF conditional | §1, §3.2, §4.1, §5.1, §5.4, §5.5, §8.1 G1: *"SSH and SNMPv3 unconditionally, plus RESTCONF where the image supports it"*; *"the two guaranteed interfaces"*; *"conditional on the image"* | **AGREE** |
| 35 | **Packet Tracer rule** | §C.2a: *"No MCP tool, AI agent, Ansible playbook or script in this project may claim to reach, read from, or configure a Cisco Packet Tracer device"*; *"Packet Tracer devices are NOT REACHABLE"*; *"is a fabrication and must be deleted"* | §4.5: **the identical lead sentence**; *"**Packet Tracer devices are therefore not reachable**"*; *"is a fabrication and will be deleted from the corpus"*; *"no MCP tool, no AI agent, no Ansible playbook and no script"* | **AGREE — identical lead sentence, same strength** |
| 36 | **Packet Tracer: no automation of the managed layer** | §C.4: *"No MCP server, Ansible playbook, SNMP poller or AI agent can reach a Packet Tracer device"*; PT *"stays in the project as a **design-time** tool and nothing more"* | §4.2 bullet: *"**No claim that any Cisco Packet Tracer device is managed, polled, configured or tested by automation or by the AI layer**"*; §4.5 and §5.5 label it design-time | **AGREE** |
| 37 | **Peer-side eBGP cost** | §C.2b NR-01a: *"the AI layer can never verify the BGP session from the peer side"*; *"No tool, test case or figure may imply otherwise"* | §5.4: *"the AI layer can never verify the BGP session from the peer side, and no tool or test may imply otherwise"* | **AGREE** |
| 38 | **Immediate submission scope** | §A.1 SQ-5 / §H.1 D5 / §H.3: *"**the immediate submission is the proposal alone**"*; *"Nothing else is being submitted at this stage"*; the outline band applies to the proposal, not to the outline | §Front matter, §1, §8.2, §12.1: *"**This proposal alone is the immediate submission tier (D5, 15-25 pages)**"*; *"**Nothing else is being submitted at this stage**"*; the initial report is *"a **likely future deliverable, not current scope**"* | **AGREE** |
| 39 | **Outline's own size is not the proposal's** | §H.3: the outline is **37,555** whitespace-split words and *"is **NOT** sized to the 6,000–10,000-word outline band"*; *"the outline band applies to the proposal (D5, 15–25 pages), not to this document"* | The string `37,555` **does not occur** in the short proposal; the proposal states its own page band and its own tier | **AGREE — the outline's size claim is not imported** |
| 40 | **Standards: named set** | §I.2 names ADDS, Nginx, OpenVPN, OSPF/BGP/EIGRP, GLBP/HSRP/VRRP/LACP/PAgP, CDP/NetFlow/Syslog/SNMP/tcpdump, Bash/PowerShell/Git/Ansible | §9.2 names *"directory services, Nginx, OpenVPN, the three routing protocols OSPF, BGP and EIGRP in a single line, the gateway and link redundancy set of GLBP, HSRP, VRRP, LACP and PAgP, neighbour discovery through CDP, flow export through NetFlow, syslog, SNMP, `tcpdump`, and Bash, PowerShell, Git and Ansible"* | **AGREE (after the correction)** |
| 41 | **Standards: the nine absent technologies** | §I.3: FSRM, iSCSI, RRAS, IKEv2, Keepalived, nftables, WireGuard, RSTP, ASA — zero occurrences | §9.2: the identical nine, *"zero occurrences in the 2026 standard text and in its raw page source"* | **AGREE** |
| 42 | **Standards: no AI content** | §I.4: *"WSOS 2026 contains no AI content whatsoever"*; zero occurrences of AI, artificial intelligence, machine learning, Agentic, OpenClaw, MCP | §9.2: *"The 2026 standard contains no artificial-intelligence content whatsoever"*; *"zero occurrences of agentic, MCP, Model Context Protocol, artificial intelligence or machine learning"*; *"No claim that the standard covers agentic AI or MCP is supportable"* | **AGREE** |
| 43 | **Standards: 2026 removals** | §I.5: the 2026 edition removed **Python, YANG, RESTCONF and NETCONF**; *"do not cite the standard as requiring RESTCONF or NETCONF"* | §9.2: the same four removed; *"it must **not** be cited as a standard requirement"* | **AGREE** |
| 44 | **Standards: screen captures** | §H.2: *"it is the **HDTN brief's**, not the standard's"*; zero occurrences of screen/screenshot/capture/evidence | §9.2: *"the requirement for screen captures comes from the HDTN brief and not from the standard"* | **AGREE** |
| 45 | **Build versus coverage axes** | §B.2 / §C.6: the ramp is coverage, §F.2 is the calendar | §7.2: an explicit paragraph distinguishing the two, naming the earlier conflation | **AGREE (the distinction is present in both)** |

### Residual differences

| # | Difference | Classification |
|---|---|---|
| R1 | **The short proposal carries a short explanatory paragraph** recording that its earlier single "P0 to P7 ramp" conflated the build-phase and coverage axes, and defining both. The outline does not need such a paragraph because it never had the defect. | **(i) Legitimate stylistic difference for a condensed document.** It is a self-correction note, adds no claim, and the fact it records — that the coverage stages are A–D and the build phases are the calendar — is stated in both documents. |
| R2 | **The short proposal's §3.3 states the completion conditions C1–C8 condensed to one table row each**, where the outline argues each at length (§B.3). The short proposal also does **not** restate every word of §B.3 C6's justification. | **(i) Legitimate.** Same conditions, same two reductions, same reduced sets; the condensed form is what the task's method section asks for. |
| R3 | **The short proposal's decision table has five columns** (Decision / Options / Recommendation / Status and by when / Consequence); the outline's §A table has seven (ID / Decision / Options / Our recommendation / Consequence of choosing otherwise / Must be decided by, plus the separate blocked-at-a-gate table). | **(i) Legitimate.** The subject, options, recommendation, status and deadline of all sixteen rows agree; the column count is a layout difference. |
| R4 | **Wording choices.** The short proposal says *"graphics processor"* where the outline says *"GPU"*; *"required/desirable/optional"* where the outline says *"MUST/SHOULD/OPTIONAL"*; *"exterior routing"* where the outline says *"eBGP"* in places. | **(i) Legitimate.** These were pre-existing house-style choices in the condensed document, they are internally consistent, and their mappings are stated (`MUST`/required, etc.). No identifier, stage, gate, status or factual claim is affected. |
| R5 | **The short proposal's `§9.2` says the WSOS 2026 AI claim holds *"in neither the 2026 nor the 2024 edition"***, where §I.4 makes the no-AI claim for **2026** explicitly and evidences the 2024 edition only for the four domain-5 removals (§I.5). The short proposal's sentence does not cite the same raw-HTML evidence for 2024. | **(ii) A remaining inconsistency in evidentiary scope — not a contradiction in identifier, stage, gate, status or fact, but it is a claim slightly wider than the outline's stated evidential base.** It should be narrowed to *"in the 2026 edition"*, or the 2024 raw-source check should be recorded in the research pack. **It is flagged here rather than changed silently, because the underlying 2024 check is a research artefact this reconciliation did not re-run** (see §6). |
| R6 | **The short proposal's `§10` names D-13 as OPEN, which the outline's §A preamble also does** — but the outline's §A preamble additionally rules D-13 out of the closed list *"deliberately"* in a paragraph the short proposal does not reproduce. | **(i) Legitimate.** The status (*OPEN*) and the deadline (end of week 2) agree; the preamble's emphasis is not a separate fact. |

**No residual difference is a contradiction in a stage name, a decision identifier, a gate, a gate week, a status, a committed item, a guarantee, the Packet Tracer rule, the immediate-submission scope or a standards fact.** R5 is the only difference of substance and it is a difference of *evidentiary scope* in one sentence about the 2024 edition, not an identifier or status conflict.

---

## 6. What could not be verified, and the outline defects found but not fixed

**Not verified, in the same terms the outline's own log uses.**

- **Word-openability and visual fidelity of the `.docx`.** `wordcom-test.ps1` was **not** run, because it drives Word and these artefacts must not be opened with Word. The render is evidenced only by SDK validation (0 errors), the 9/9 package check and the raw-ZIP coverage proof. Layout, fonts, page breaks, table pagination and whether the tables fall across page boundaries were **not** inspected.
- **The 2024 WSOS edition's raw text.** The short proposal's §9.2 claim that the 2026 standard is AI-free *"in neither the 2026 nor the 2024 edition"* (residual R5) was **not** re-derived from the 2024 source. The 2026 claim was checked against the outline's §I.4/§I.5 wording and agrees. The 2024 raw-HTML check referenced by the outline's research pack (`proposal\research\wsos-2026-2447.md`) was not re-run, so R5 was left as flagged rather than silently narrowed.
- **The outline's `37,555`-word figure and its canonical method.** Not re-derived; the short proposal does not restate it, so nothing in the corrected document depends on it.
- **The long `FYP-Proposal-*` documents, the section files, the i18n files and the research files.** Present, untouched, and **not** assessed. Whether they also carry stale identifiers or stage names is outside this reconciliation's scope.
- **The short proposal's own `.docx` conversion fidelity to the previous render's visual layout.** The part count, style count and heading census all match the previous render's structure (14 parts, 29 styles, `0/15/40/6` headings against the previous `0/15/39/6`), but the rendered appearance was not compared pixel by page.
- **No `.docx` was opened by path, with the Open XML SDK by path, with Word COM or with Word**, and no `.docx` was opened by any other tool that rewrites in place.

**Outline defects found and NOT fixed** — the outline is the authority and was not edited.

1. **G0's condition omits D-14 from its `§F.1` "Condition to pass" list, while that same list's neighbouring text requires it and the outline says elsewhere that D-14 must be settled at G0.** Evidence: `§F.1` G0's condition reads *"**D-14 (hypervisor/platform)**, D-01, D-02, D-03, D-05, D-09, D-11, D-12 and **D-16 (Cisco device count)** answered"* — which **does** include D-14 — but the sentence immediately following says *"**D-04 is deliberately NOT in this list**"* and the enumerated closure sentence in `§M` item 6 says *"**D-14 is required at G0**, so it cannot be deferred past week 1"*, and `§J-D-14`'s "By when" says *"**End of week 1** (gate **G0**)"*. On re-reading, the defect is narrower than it first appeared: **`§F.1`'s G0 row and `§M` item 6 agree that D-14 is required at G0; the discrepancy is that `§A`'s D-14 row says *"end of week 1 (gate **G0**)"* while `§J-D-14` says *"End of week 1 (gate G0)"* and `§J-D-14`'s sibling note claims the row *"was absent from G0's answered list"* — a statement about the pre-fix state that reads as if it were about the current one.** Recorded rather than edited, because no live condition list is actually wrong. The short proposal's §8.1 G0 condition and §10 D-14 row both require D-14 at G0, so the two documents agree.
2. **`§A`'s "Blocking now" table and `§M` item 1 disagree on the item number.** `§A` states *"**Only ONE item still blocks work starting now — B2, and nothing else**"*; `§M` says *"**Only ONE item blocks work starting now — item 2, the Cisco platform ratification (B2)**"*. These agree on the fact; the "item 2" is a cross-reference to `§M`'s own numbered list, which is correct in context. Not a defect on re-reading, recorded for completeness.
3. **`§B.2` calls the Stage B content *"one genuinely reachable Cisco device"* and `§C.6`'s Stage B row calls it *"one node only, of the kind RW-07 will hold"*** — consistent, but `§C.6`'s Stage B exit gate is reached at **G3 (week 8)** while `§C.6`'s Stage B weeks column says *"**Weeks 3–8**"* and the `§F.3` second Gantt band draws `STAGE B` in **weeks 6–7** ending one column left of G3. **The Gantt band and the stage table therefore describe different spans for the same stage: the table says weeks 3–8 and the Gantt bar occupies weeks 6–7.** This is a real internal inconsistency in the authority, and it is **reported, not fixed**. The short proposal adopts the **table's** weeks (*"Weeks 3-8"*, closing at G3 week 8), which is the normative statement and the one the exit gate matches; the Gantt band in the outline was not changed.
4. **`§C.6`'s Stage B row says the stage's weeks are *"Weeks 3–8"* while its own text says the stage *"closes when the **AI** manages the device, which is **week 8** at the earliest because the AI line starts at week 7"*** — internally coherent, but it means the stage's stated start of week 3 is the *device-build* start, not the *AI-coverage* start, which is the same conflation of the two axes that the short proposal previously made. **Reported only.** The short proposal reproduces the outline's weeks and adds the explanatory distinction so that a reader cannot repeat the conflation.
5. **No `.docx`-level defect was found in the outline's render, and none was sought** — the outline's `.docx` was not re-validated by this reconciliation, since it was not modified and its revision-3 gate results are already recorded in its own log.

**Delivered artefacts of this reconciliation.**

- `FYP-Proposal-SHORT.md` — corrected source, 135,738 bytes, `8F1BC4B8E5D2946992BFFD373D9409073FBE0726D6EB86818415E63455A3CA2C`.
- `FYP-Proposal-SHORT.docx` — re-rendered, 66,980 bytes, `9D97358D2B0B66292C0F46C80D948D0C6544ED29B378716DE566B97B5291E2B8`, SDK 0 errors, package 9/9, coverage **1,318/1,318 = 100.000%**.
- `proposal\integration\backup-short-reconciliation\FYP-Proposal-SHORT.md.bak` and `.docx.bak` — the pre-fix pair.
- This note.

