# Independent Audit — `FYP-Outline-DRAFT.md` against the corpus it was derived from

**Auditor role:** adversarial, read-only, independent of the agent that wrote the outline.
**Artefact under audit:** `D:\File\School\FYP\FYP-Outline-DRAFT.md` (158,371 bytes; 1,217 lines; 154,354 chars) and its rendered `FYP-Outline-DRAFT.docx` (91,339 bytes).
**Corpus of record:** `proposal\sections\01-introduction.md` … `08-project-management.md`, plus `proposal\00-design-baseline.md` and `proposal\00-design-baseline-rev1.1-addendum.md`.
**Supporting references consulted:** `proposal\research\wsos-2026-2447.md`.
**Date of audit:** session-local; all commands run against the files as they exist now.
**Method note:** every count below was measured by me with `[System.IO.File]::ReadAllText($p,[System.Text.Encoding]::UTF8)` (never `Get-Content -Raw`, ANSI cp950 console) and .NET regex. Nothing was taken on trust from the outline, from any other agent's report, or from the `.docx`. **No existing file was modified, moved, renamed or deleted.** No `.docx` was opened by path, through the Open XML SDK by path, through Word COM, or through Word.

---

## 0. Bottom line

| # | Verdict |
|---|---|
| V1 — PT reachability + matrix | **PASS on the central claim.** Zero PT-reachability claims anywhere in the outline. Matrix is formally consistent (12 rows: 9 REACHABLE / 3 NOT REACHABLE) but is **incomplete against the frozen inventory**: 5 named Ubuntu guests and 4 named Windows guests of the baseline's 19-VM estate appear nowhere in the outline, and rows RW-07/RW-08 are labelled `REACHABLE` while being admittedly unproven. |
| V2 — W1–W11 | **10 of 11 CONFIRMED verbatim; 1 MISQUOTED.** Every statement genuinely exists. **W1's cited location is wrong** (says `baseline §11.6`; the text is in **§11.5**; §11.6 is the WSOS alignment table). One over-claim in §E.3's "every occurrence is negative or marginal". |
| V3 — headline statistics | **ALL FOUR ARITHMETICALLY CORRECT** as written (MCP 4 in `07`; `MCP server` 0 corpus-wide; OpenClaw 87 over the eight sections; Ollama/vLLM/llama.cpp/gguf/VRAM 0). One **wording** defect: "zero times **anywhere**" is false if the design baseline is included (10 further MCP hits, 40 further OpenClaw hits). |
| V4 — Chinese executive summary | **Broadly faithful, 10 discrepancies.** One *stronger* than English (blocks all five MCP servers on an unratified decision), one *softer* (drops the "hard requirement" framing for tool calling), one *looser about the scope premise* ("only a student laptop" vs "relaxed for compute"), one repeated form error ("五個 MCP 伺服器 … 五個 MCP 伺服器"), and it omits T4 from the tier list. |
| V5 — Cisco logic | **Solid; 3 real gaps.** All 9 criteria are genuinely applied (9 criteria × 6 candidates), all 6 alternatives have written rejection reasons, primary/fallback cleanly distinguished, C.5 does not contradict the recommendation. Gaps: hybrid row scored as "~ depends on the chosen reachable option"; the **eBGP provider device is a required managed Cisco device that is never placed**; the criterion-set wording slips between "five options" and six candidates. |
| V6 — tier table | **2 contradictions.** T0/T1 are said to be unable to run UC-4 safely, yet D-06 recommends committing UC-4; and T3 (24 GB+) claims "Best of the set" while T4 (48 GB+) is *slower per token* — an unexplained inversion. T0's VRAM is the only tier row with no VRAM figure, which is what makes D-04's "(a) none (CPU only)" / "(b) ~8 GB" mapping ambiguous. |
| V7 — decision tables | **2 silent decisions + 1 unrecorded choice.** The hypervisor platform choice (VMware/VirtualBox) is load-bearing (§C.2) with no decision ID; the remote-access choice "pick one" (OpenVPN vs IKEv2/RRAS, §D.1.3) is never given a decision ID; and the 5–6 Cisco-device target (§D.2) has no ratifying decision. Conversely D-11 is offered as a decision whose answer is already executed in three places. Type of B1 also flips between "a record" and "a decision". |
| V8 — gates | **BOTH PASS, HASH STABLE.** `sdk-validate.ps1`: 0 errors, 0 open failures, 0 raw issues, exit 0. `verify-package.ps1`: 9/9 checks PASS, exit 0. SHA-256 `32BDD8D1…7F2E` **before and after, byte-identical, 91,339 bytes** — the MemoryStream design holds. |
| V9 — frozen standards facts | **No misstatement found.** Every ABSENT list, the 2026 removal of Python/YANG/RESTCONF/NETCONF, the four `AI` false positives, and screen-captures-are-HDTN are all stated correctly. |
| **V10 — OVERALL** | **ACCEPT WITH CAVEATS.** |

**The single most important thing to fix:** §L.4 **W1's citation** — it points at `baseline §11.6 (L5 table)`, but §11.6 is the *WSOS alignment* table; the L5 table is **§11.5**. In a document whose entire credibility argument is "the withdrawals are clean and checkable", pointing a reviewer at the wrong section of the source is the one defect that costs the most for the least effort. (Second priority, and arguably more consequential for the build: the reachability matrix's silent narrowing of the estate — see V1.3.)

---

## V1 — Does the outline practice what it preaches?

### V1.1 PT-reachability claims in the outline: **NONE — this is a clean pass**

I enumerated **every** occurrence of `Packet Tracer` (33 occurrences), `\bPT\b` (6), `PacketTracer` (0), `packet-tracer` (0), `.pkt` (0), `get_interface_stats` (2), `netmiko` (0), `napalm` (0), `ios_config` (0), `cisco.ios` (1), `telnet` (0), `snmpwalk` (7), `snmpget` (0) and read the full surrounding context of each.

**Result: there is not one sentence, tool definition, diagram description, table cell or example in the outline that implies a Packet Tracer device is reachable, pollable, configurable or otherwise manageable by an AI agent, MCP server, Ansible playbook or script.** Every one of the 33 PT mentions is one of:

- the negative rule itself (§C.2a, lines 148–164) — *"Packet Tracer devices are NOT REACHABLE … no SSH … no SNMP agent a real poller can query, no NETCONF endpoint and no RESTCONF endpoint, and no management API whatsoever"*;
- a **withdrawal** of the corpus's offending statements (§C.2a verdict table, §L.4 W8, §M item 12);
- the **matrix row NR-01** — "Status: NOT REACHABLE … None. No SSH, no SNMP, no NETCONF, no RESTCONF, no API";
- the **crossed-out arrow** in the §C.3 figure, which is explicitly required to be drawn as crossed out;
- a **corrective restatement** at §C.4 / §L.2;
- the **C.5 simulator-only scope reduction**, which removes the AI claim rather than extending it;
- `D-11` (keep PT as a design-time tool), `B.4` non-goals, `I.6`, `K` R12, `M` items 2 and 12.

The two `get_interface_stats` hits are *both* inside the withdrawal text (§C.2a table and §L.4 W8) and both are marked **WRONG — withdraw**. The one `cisco.ios` hit is the Ansible collection named in §D.1.6, whose target is the CML/physical Cisco layer, not PT.

**No remediation required. This is the strongest single result of the audit.**

### V1.2 Reachability matrix (§C.2b) internal consistency

Measured: **12 rows — 9 `REACHABLE` (RW-01…RW-09) and 3 `NOT REACHABLE` (NR-01…NR-03).** The outline labels it "13-row" nowhere in its own text (that figure comes from the audit brief); since `RW-01` and `RW-02` each cover a host *pair* and RW-03/RW-06 are catch-alls, the count argument is not worth making. **The row count is not a defect.**

**Every `REACHABLE` row names a concrete management interface:**

| Row | Named interface | Is that a management interface a tool can use? |
|---|---|---|
| RW-01 | WinRM/HTTPS 5986, `windows_exporter` 9182, Event Log via WinRM, syslog 514/udp | **Yes** |
| RW-02 | As RW-01 **plus RPC-based FSRM cmdlets over WinRM** | **Yes** (FSRM cmdlets are remoting-capable) |
| RW-03 | As RW-01 | **Yes** |
| RW-04 | HTTPS API (Prometheus 9090, Loki, Grafana 3000 read), Git over SSH, local filesystem read | **Yes** (Grafana "read" is an authenticated HTTP API, fine) |
| RW-05 | SSH 22 with forced-command read-only allow-list, `node_exporter` 9100, rsyslog 514/udp | **Yes** |
| RW-06 | As RW-05 | **Yes** |
| RW-07 | SSH 22 (`show`-only), SNMPv3 authPriv 161/162, RESTCONF/HTTPS 443 where supported, syslog 514, NetFlow if licensed | **Yes** |
| RW-08 | SSH, SNMPv3, syslog on an ASA/ASAv | **Yes** |
| RW-09 | "Local process control only" (the agent host) | **Yes**, and correctly qualified as "not a managed network element" |

**No row names a non-management interface.** One nits: RW-04's "local filesystem read" is a host-local action rather than a network management interface, but it is honest and correctly scoped.

**Three genuine internal inconsistencies were found:**

1. **`REACHABLE` is defined in a way that two of its own rows cannot satisfy.** The legend (line 170) reads: *"`REACHABLE` = a real interface **exists** and a transcript proves it."* But RW-07 is `**REACHABLE** *(conditional on D-01/D-12)*` and RW-08 is `**REACHABLE** *(conditional on D-01)*` — neither can have a transcript yet, since D-01 is a week-1 decision. The outline does lean into this later ("If RW-07 and RW-08 are not reachable, then `MCP-S-CISCO` cannot exist"), but as written the legend and the rows contradict each other. **Fix:** state the conditional rows as `CONDITIONALLY REACHABLE — pending D-01/D-12` so the legend stays true.
2. **The legend's tense contradicts the governing rule.** §C.2a (line 164) says *"an interface exists for this project only if a command run from the management host, in this lab, returned data from that specific device, and the transcript is filed as evidence."* But the legend says "a real interface **exists** and a transcript proves it" — existence-based, not evidence-based. Line 187 does impose the transcript obligation, so this is a wording defect, not a design defect; it is nevertheless exactly the class of ambiguity the outline claims to have eliminated.
3. **RW-06 is a catch-all whose enumeration elsewhere is incomplete.** §C.3's figure text enumerates the Linux column as `vpnz-mon01, vpnz-nft01/02, vpnz-dmzrev01/02, vpnz-lnxra01, …` against a "9-10 guests" claim — six named for a nine-to-ten claim. RW-03 is likewise a catch-all over "every other Windows member server". This is defensible as a matrix (the row *is* declared for every member), but it means the matrix by itself cannot be used to check that the estate is complete.

### V1.3 **Managed devices missing from the matrix / from the outline**

This is the real V1 finding. The frozen baseline's §15.1 states the estate is **"19 virtual machines + 1 hypervisor host"**, and lists them:

> *Windows Server guests (`dc01`, `dc02`, `fs01`, `san01`, `rras01`, `dmzweba01`, `dmzweba02`, `jump01`, `brdc01`)* — **9**
> *Ubuntu guests — the other 8 (`lnxra01`, `nft01`, `nft02`, `dmzrev01`, `dmzrev02`, `dmzwp01`, `dmzwp02`, `dmzjump01`)* + `vpnz-mon01` + `vpnz-ai01` — **10**

Cross-referenced against the outline, occurrence counts are:

| VM in the frozen inventory | Occurrences in the outline | In §C.2b explicitly? |
|---|---|---|
| `vpnz-dc01`, `vpnz-dc02` | 11 / 5 | Yes (RW-01) |
| `vpnz-fs01` | 3 | Yes (RW-02) |
| `vpnz-san01`, `vpnz-rras01` | 3 each | Yes (RW-03) |
| **`vpnz-dmzweba01`, `vpnz-dmzweba02`** | **0** | **No** |
| **`vpnz-jump01`** | **0** | **No** |
| **`vpnz-brdc01`** | **0** | **No** |
| `vpnz-mon01` | 11 | Yes (RW-04) |
| `vpnz-ai01` | 3 | Yes (RW-09) |
| `vpnz-lnxra01` | 4 | Yes (RW-06) |
| `vpnz-nft01`, `vpnz-nft02` | 3 / 1 | Yes (RW-05) |
| `vpnz-dmzrev01` / `vpnz-dmzrev02` | 4 / **0** | `dmzrev01/02` (RW-06) |
| **`vpnz-dmzwp01`, `vpnz-dmzwp02`** | **0** | **No** |
| **`vpnz-dmzjump01`** | **0** | **No** |

So **five Ubuntu guests and four Windows guests of the frozen estate are invisible in the outline**. Two of them (`dmzweba01/02`) are *load-bearing in the corpus* — the baseline's own capability demonstration #2 runs a failed-login burst *"against `vpnz-dmzwp01`"*, and the Windows DMZ web tier is in the trust-boundary model.

Is this a defect? It is **defensible but must be declared, and it is not declared consistently:**

- §C.2b's rule says *"A device that is not in this matrix is not a managed device, and no tool may be written against it"* — so under the outline's own rule these nine guests are simply out of AI scope. That is coherent.
- **But** §L.1 promises *"Continuity is worth more than a redesign"* for the VLAN/zone plan, §L.1a item 3 promises the *"device and VM inventory … 36 rows, with roles, resources and NIC attachments already assigned"* is carried forward **essentially as written**, and §C.2b is presented as adding "a reachability column" to the baseline's matrix (L.1a item 4) — an addition, not a deletion.
- And §D.2's MUST core independently restates the estate as **"8–10 Linux guests, 6–8 Windows guests"**, which is neither the baseline's 10/9 nor the matrix's 6/6 named.

**Consequence to state in the report:** the outline silently narrows the managed estate from 19 VMs to the named subset, while simultaneously claiming the inventory is carried forward verbatim. A later writer reading §L.1a item 3 and §C.2b together will not know which is true. **Fix:** add one sentence to §C.2b — "the following inventory members are deliberately out of AI scope and are named here so that their absence is a decision, not an omission: `<list>`".

**One further missing device, and it is a genuine logical gap:** §B.3 C2 and §D.1.4 both require **eBGP to a simulated provider** as a SHOULD. That provider is a Cisco device that the estate routes to. It appears in **no** row of §C.2b — neither RW-07 nor NR-01 (`VP-ISP-EDGE-01` is a PT device, so it is NR-01 if it is simulated), and the outline never names the provider's platform. Under §C.2b's own rule that is a routing peer that is *not a managed device*, which is fine — but then the report is claiming exterior routing against an entity the AI layer provably cannot see, and that should be said out loud. In the baseline the provider **is** simulated (§13.2 PT-09: *"PT cannot simulate a real ISP"*), so the honest reading is: **the eBGP peer is an NR-01-class Packet Tracer device**, and therefore the AI layer can never verify the session from the peer side. Not stated.

Finally: **the hypervisor host's management plane is NR-02 and is deliberately excluded** — that is correct and consistent with the CML question in V6.5 below.

---

## V2 — Are the withdrawals W1–W11 real?

Every one of the eleven statements genuinely exists in the corpus. I located each one and read the full section around it. Below, "original text" is my verbatim transcription.

### W1 — **MISQUOTED (location)** · statement CONFIRMED verbatim

- **Outline says:** `` `Model hosting / fine-tuning / GPU inference | NOT COVERED` `` at **`baseline §11.6 (L5 table)`**.
- **I found it at:** `00-design-baseline.md` **§11.5** (heading: *"### 11.5 L5 — AI Network Management (**highest-uncertainty line — read §13.6 before writing anything about it**) [DECIDED]"*), inside the L5 table.
- **Original text (verbatim):**
  > `| Model hosting / fine-tuning / GPU inference | **NOT COVERED** | No GPU. The agent uses either a small local model or an API — see the fallback in §13.6, and note that an API dependency means the demo needs Internet access and a free-tier key, which is a documented project risk |`
- **Verdict: MISQUOTED as to location.** `baseline §11.6` is *"Alignment with the WorldSkills Occupational Standards 2026"* — a completely different table. The **content** is exact. This is the single most important fix in the document (see V10).

### W2 — **CONFIRMED** (statement + location)

- **Outline says:** `` `GPU | Not required | Not required | No local GPU inference is planned` `` at `baseline §15.2 (host specification)`.
- **Original text (§15.2, final row of the host-specification table):**
  > `| GPU | Not required | Not required | No local GPU inference is planned; see §12.5 F4 |`
- **Verdict: CONFIRMED**, verbatim except the trailing cross-reference, which the outline correctly elides. Location exactly right.

### W3 — **CONFIRMED** (statement + location)

- **Outline says:** *"Model hosting, fine-tuning, GPU inference and predictive analytics with trained models are also out of scope and appear only as future work"* at `08-project-management.md §13.7`.
- **I found it at:** `08` **§13.7 "AI Layer Evaluation"**, in the paragraph **"What is explicitly outside the gate."**
- **Original text (verbatim):**
  > "Model hosting, fine-tuning, GPU inference and predictive analytics with trained models are likewise out of scope and appear only as future work."
- **Verdict: CONFIRMED.** The outline's quote substitutes "also" for "likewise" and drops the sentence-final s — immaterial. §13.7 is exactly right.

### W4 — **CONFIRMED** (statement + location)

- **Outline says:** *"the AI line is the weakest line"* at `08 §12.5.2 (and the surrounding risk framing)`.
- **I found it at:** `08` **§12.5.2 "Primary ownership of the five technology lines"**, in the paragraph beginning *"Two consequences are worth stating in the proposal…"*.
- **Original text (verbatim, emphasis in source):**
  > "First, **the AI line is the weakest line and is deliberately scoped as a proof of concept with declared limits**, because the standard on which this project is aligned contains no AI content at all…"
  > …and in the following sentence: *"the line is protected by five pre-designed fallbacks (F1 to F5 in the baseline)"*.
- **Verdict: CONFIRMED**, direct quote, correct section, and the surrounding risk framing is fairly characterised.

### W5 — **CONFIRMED as to existence and location; the outline's *characterisation* over-reaches**

- **Outline says:** the **"MCP tool bridge"** entry sits in the **cut / optional band**, at `08` §12.1, §12.9; `baseline` §13.4 R-02.
- **I found it at three places, all correct:**
  - `08` **§12.1**: *"…**could** (voice, two-tier PKI, Restic, MCP tool bridge) and **won't** (…) Section 12.9 turns that order into an explicit cut sequence."*
  - `08` **§12.9** contingency table, row 3: *"| 3 | **could** | Voice (CUCM Express), two-tier PKI, Restic off-host configuration backup, MCP tool bridge | Cut second, and only after the should band is exhausted…"*
  - `baseline` **§13.4 R-02**: *"Priority order is fixed: **must** (…) → **should** (EIGRP/BGP, iSCSI, monitoring, WordPress) → **could** (voice, PKI…)"* — the MCP bridge is in the same "could" band.
- **Verdict: CONFIRMED.** However, the *reason* the outline gives for withdrawing it — see V3.4 — is overstated: the corpus does not treat MCP only as cuttable. `baseline §11.5` records MCP as *"PARTIAL — declared"* and states the read-only tool surface *"is designed as MCP-compatible tool definitions so that it works with or without a specific agent runtime"*. That is the outline's own position, already present in the corpus.

### W6 — **CONFIRMED** (statement + location)

- **Outline says:** `` `P-34 | 18789/tcp | OpenClaw agent control/API endpoint` `` with the port marked `[ASSUMPTION]`, at `baseline §10`.
- **Original text (verbatim, §10 port matrix):**
  > `| P-34 | 18789/tcp | OpenClaw agent control/API endpoint | \`vpnz-ai01\` | \`Z-MGMT\` → \`Z-SERVER\` | **Local bind only; must not be reachable from \`Z-USER\`.** Exact default port is an **[ASSUMPTION]** and must be confirmed against the running instance and corrected here |`
- **Verdict: CONFIRMED.** Location right (§10). The `[ASSUMPTION]` marking is exactly as quoted. *(The same statement also appears a second time as open item `O-09` in the baseline's open-decisions list — not cited, but not needed.)*

### W7 — **CONFIRMED** (statement + location)

- **Outline says:** the **five fallbacks F1–F5** and the **OpenClaw feasibility spike**, at `baseline §12.5; 08`.
- **I found it at:** `baseline` **§12.5 "AI-NETOPS proof of concept (read this before writing anything about AI) [DECIDED]"**, in the table headed *"**FALLBACKS — mandatory, because this is the weakest line [DECIDED]**"* — all five rows F1…F5 are there. The timeboxed spike is in `baseline` §13.6 item 3.
- **Original text of F4 (the one the outline's §E.1 supersedes):**
  > `| F4 | Local model inference is too slow on 4 vCPU / 8 GB | Reduce to a single capability (documentation drafting), or move the runtime to a student laptop with more RAM and document the change of host |`
- **Verdict: CONFIRMED**, verbatim and precisely anchored. Note the slight imprecision that F1–F5 live in **§12.5** (as cited as one of the two locations) and the *spike* lives in **§13.6** — the outline cites both, so it is correct.

### W8 — **CONFIRMED** (all three statements + all three locations)

- `07-ai.md` **§11.6.3**, tool inventory table — **verbatim:**
  > `| get_interface_stats | (host, interface?) | Returns interface counters — input/output errors, discards, CRC failures, utilisation — for a named host, optionally for one interface | SNMPv3 authPriv poll of the Packet Tracer device estate **as recorded in the design's device data**, plus ip -s link over SSH for Linux hosts. For Packet Tracer devices the counters are **simulated values recorded from the simulator**, and the tool result must say so rather than presenting them as a live measurement |`
  The outline's quoted fragment *"SNMPv3 authPriv poll of the Packet Tracer device estate"* is exact.
- `07-ai.md` **§11.6.4**, the data-flow diagram — **verbatim opening of the fenced block:**
  > `[ Packet Tracer devices ]        [ Linux guests ]              [ Windows guests ]`
  > `  simulated counters               node_exporter 9100            windows_exporter 9182`
  > `  SNMPv3 161 (read)                journald -> rsyslog           Security 4624/4625/4740/...`
  The diagram genuinely feeds `vpnz-mon01` from the Packet Tracer devices. The outline's characterisation is accurate.
- `07-ai.md` **§11.7.2**, Skill `interface-health`, read-only commands block — **verbatim:**
  > `2. Cisco / Packet Tracer device estate (SNMPv3 authPriv read view only):`
  > `     snmpwalk -v3 -l authPriv -u <svc_monitoring> -a SHA -A <from vault> -x AES -X <from vault> \`
  > `              <validated-device-ip> 1.3.6.1.2.1.2.2.1        # ifTable: ifDescr, ifInErrors, ifOutErrors`
- **Verdict: CONFIRMED on all three.** The outline is also right that these contradict the automation chapter: `06-automation.md` §10.7 states **verbatim** *"No playbook, script or tool in this project can log in to a Packet Tracer device. Any statement to the contrary would be fabrication"*, and §10.7.4 explicitly lists *"Ansible (or any automated tool) logged in to a Packet Tracer device and pushed a configuration"* as **"No — forbidden."** The contradiction the outline claims to fix **is real**.

### W9 — **CONFIRMED** (statement + both locations)

- **Outline says:** `vpnz-ai01` at **4 vCPU / 8 GB**, at `baseline §15.1, §6`.
- **Original text (§15.1):**
  > `| Ubuntu guest \`vpnz-ai01\` (agent runtime) | 1 | 4 | 8 | 60 |`
  and §15.1's preamble: *"The §6 inventory contains **36 rows: 16 Packet Tracer logical devices + 19 virtual machines + 1 hypervisor host**."* `07-ai.md` §11.1.3 independently confirms: *"(4 vCPU, 8 GB RAM, 60 GB disk, one NIC on `VNET-SRV`, VLAN 30, `SRV-HQ-1`, 10.10.30.51)"*.
- **Verdict: CONFIRMED**, both locations.

### W10 — **CONFIRMED** (both locations; characterisation fair)

- **Outline says:** the *"AI is optional / innovation beyond the standard, therefore may be reduced"* conclusion, at `01` §4.4; `07` §11.1.1.
- **I found it at:** `01-introduction.md` **§4.4 "The AI Network Management Line"** — *"The line is therefore positioned as **project innovation beyond the standard**"* plus *"the line is scoped as a **proof of concept with a declared scope**"*; and `07-ai.md` **§11.1.1** — *"this line must be positioned as project innovation beyond the standard, never as WSOS compliance."*
- **Verdict: CONFIRMED as to existence and location.** Honest caveat: neither location literally says "therefore may be reduced". The *inference* the outline withdraws is supplied by the surrounding material (`08` §13.7's "out of scope … only as future work"; the "could" cut band; the "weakest line" framing). The outline is transparent that it is withdrawing a *conclusion* ("WITHDRAWN as a conclusion; the underlying fact is KEPT"), which is a fair reading — but a strict reader should note that the words "therefore may be reduced" are the outline's synthesis, not a quote.

### W11 — **CONFIRMED** (statement + location)

- **Outline says:** the **"two-track" Cisco automation workaround** — Track A / Track B, at `baseline §11.4`.
- **Original text (`baseline` §11.4, row "Network-device automation *in the simulator*"):**
  > `| Network-device automation *in the simulator* | **PARTIAL — declared** | Packet Tracer has **no API, no SSH server reachable from real tooling, and no Ansible collection**. **[DECIDED] honest approach (two-track):** (a) Track A — the group maintains \`03-build/packet-tracer/configs/*.txt\` … the Ansible/Napalm-equivalent step documented but not executed; (b) Track B — \`08-collect-network-configs.yml\` and \`Backup-NetworkDeviceConfig.ps1\` are *written and tested* against the Linux/Windows estate and against the **PT device configurations treated as files in Git** … **The report must state clearly that no playbook ever logged in to a Packet Tracer device.** Claiming otherwise would be fabrication |`
- **Verdict: CONFIRMED**, verbatim in substance, correct section. §10.7 (in `06`) contains the same two-track description, so §11.4 of the baseline and §10.7 of `06` are the same content in two places — the outline cites §11.4, which is valid.

### V2 summary table

| # | Statement exists? | Quote accurate? | Location accurate? | **Verdict** |
|---|---|---|---|---|
| W1 | Yes | Yes (verbatim) | **NO — says §11.6, is §11.5** | **MISQUOTED (citation)** |
| W2 | Yes | Yes | Yes (§15.2) | CONFIRMED |
| W3 | Yes | Yes ("likewise"→"also") | Yes (§13.7) | CONFIRMED |
| W4 | Yes | Yes (direct quote) | Yes (§12.5.2) | CONFIRMED |
| W5 | Yes (3 places) | Yes | Yes (§12.1, §12.9, baseline §13.4 R-02) | CONFIRMED |
| W6 | Yes | Yes (+ 2nd copy as `O-09`) | Yes (§10) | CONFIRMED |
| W7 | Yes (F1–F5 all present) | Yes | Yes (§12.5; spike §13.6) | CONFIRMED |
| W8 | Yes (all 3) | Yes | Yes (§11.6.3, §11.6.4, §11.7.2) | CONFIRMED |
| W9 | Yes | Yes | Yes (§15.1, §6) | CONFIRMED |
| W10 | Yes (2 places) | Synthesis, not quote | Yes (§4.4, §11.1.1) | CONFIRMED, noted |
| W11 | Yes | Yes | Yes (§11.4) | CONFIRMED |

**10 CONFIRMED, 1 MISQUOTED (location only), 0 NOT FOUND.** The withdrawal list is honest and checkable. Its one defect is a wrong section number on the very first row.

---

## V3 — Verification of the headline statistics

### V3.1 The four claims, measured

| Claim in the outline | My measurement | Verdict |
|---|---|---|
| *"`MCP` appears **four times in the AI chapter**"* (§C.2a table; §E.3) | **4** occurrences of `\bMCP\b` in `07-ai.md` | **CORRECT** |
| *"`MCP server` appears **zero times anywhere**"* (§E.3) | **0** occurrences of `\bMCP[ -]server\b` across all eight English section files, the design baseline and the addendum | **CORRECT** (see V3.3 for the substring caveat) |
| *"`OpenClaw` appears **87 times corpus-wide**"* (§E.3; Chinese summary) | **87** across the eight English section files (01:6, 02:16, 03:0, 04:1, 05:0, 06:0, **07:48**, 08:16) | **CORRECT as written** (see V3.2) |
| *"every occurrence [of MCP] is negative or marginal"* (§E.3) | **FALSE — 2 of the 4 in `07`, and 2 more in the baseline, are positive/neutral** | **OVER-CLAIM** |
| `Ollama`, `vLLM`, `llama.cpp`, `gguf`, `VRAM` = **zero** in the corpus | **0 / 0 / 0 / 0 / 0** in the eight section files **and** 0 / 0 / 0 / 0 / 0 in the baseline and addendum | **CORRECT** |
| Corpus size **286,932 words** (§A.1 SQ-5, §H.3) | **286,932** whitespace-split words over the eight section files (measured to the word) | **EXACT** |
| *"23% of it in one project-management chapter"* | 66,754 / 286,932 = **23.26%** | **CORRECT** |
| `07` AI-line size **21,202 words** | 21,202 whitespace words in `07-ai.md` | **EXACT** |
| CJK content in the eight section files | 40 CJK characters total | (context only) |

### V3.2 Did I count the design baseline and the addendum? **Yes — and the answer matters**

- `00-design-baseline.md`: **MCP 10**, `MCP server` **0**, **OpenClaw 40**, Ollama/vLLM/llama.cpp/gguf/VRAM **0**.
- `00-design-baseline-rev1.1-addendum.md`: **MCP 0**, `MCP server` **0**, **OpenClaw 0**, all others **0**.

Therefore:
- **`MCP server` = 0 is true of the entire corpus including both extra files.** The claim survives the widest reading.
- **`OpenClaw` = 87 is true only of the eight English section files.** Including the baseline it is **127** (87 + 40).
- **`MCP` "anywhere" is not 4; it is 4 in the AI chapter and 34 corpus-wide** (24 in the sections — 01:6, 02:8, 07:4, 08:6 — plus 10 in the baseline).

**Wording defect, not a numerical error.** §E.3's sentence — *"`MCP` appears four times in the AI chapter and `MCP server` appears zero times anywhere"* — applies one scope ("the AI chapter") to the first figure and a different scope ("anywhere") to the second, in a single clause; and "anywhere" is false once the baseline is counted. **Recommended replacement:** *"`MCP` appears four times in the AI chapter and twenty-four times across the eight section files; the phrase `MCP server` appears nowhere in the corpus; `OpenClaw` appears 87 times in the eight section files (127 including the design baseline)."*

### V3.3 The "every occurrence is negative or marginal" claim is contradicted by the corpus

I read the context of all four `MCP` occurrences in `07-ai.md`:

1. §11.1.1 — *"records **zero occurrences** of `Agentic`, `OpenClaw`, `MCP`…"* → **negative** (a standards-absence statement). ✔ as claimed.
2. §11.1.3 — *"whose entire purpose is to hold the agent runtime, the **MCP-style tool bridge** and the read-only collector"* → **neutral/architectural**. The outline's own §E.3 labels this an adjective, which is fair.
3. §11.4 — *"The four-tool surface is expressed as **MCP-compatible tool definitions**, so the same capability works with OpenClaw, with a generic agent loop, or with a deterministic script."* → this is a **positive design commitment to MCP**, not a marginal mention. **This is the outline's own position, already present in the corpus.**
4. §11.11 risk table row 6 — *"The tool surface is expressed as MCP-compatible definitions so it is portable"* → **neutral/mitigating**.

And in `00-design-baseline.md` §11.5:
> `| MCP (named in the *other* Victor2 variant of the topic sheet, and relevant here) | **PARTIAL — declared** | The read-only tool surface is designed as MCP-compatible tool definitions so that it works with or without a specific agent runtime. **[ASSUMPTION]** MCP is a real, documented protocol for connecting models to tools; the group must cite the specification it actually reads |`

**Verdict: the outline's rhetorical claim that MCP was only ever negative or cuttable is not supported.** Two of four `07` hits and at least two baseline hits are affirmative. This does not weaken the outline's *decision* to make MCP the contract — it **strengthens** it, because the corpus already leaned that way — but the outline should say so accurately: *"MCP was mentioned four times in the AI chapter, twice negatively and twice as a design note; the corpus never made it the contract, and never made `MCP server` its unit of design."*

---

## V4 — Chinese executive summary (§摘要) versus the English body

I read the Chinese summary (lines 18–36) clause by clause against the English body. **Most of it is faithful**, including several checks that pass exactly: 五個 MCP 伺服器 (= five servers), the closed governance policy (read-only default, human-approved change, immutable audit log), T2 as target with a no-GPU fallback, the four-tier VRAM ladder, the CML-primary / DevNet-or-second-hand-fallback recommendation, keep-PT-for-design-only, the 286k corpus with 87 OpenClaw / 4 MCP / 0 `MCP server`, the 11 withdrawals, the eleven-item must-never list, and "no AI content in WSOS 2026".

**Discrepancies found (10):**

| # | Chinese text | English body | Direction |
|---|---|---|---|
| **C1** | *"**本專案任何 MCP 工具、AI 代理、Ansible playbook 或腳本，都不得聲稱可以接觸**…"* — "**any** MCP tool, AI agent, Ansible playbook or script **in this project**" | §C.2a: *"No MCP tool, AI agent, Ansible playbook or script **in this project** may claim to reach, read from, or configure a Cisco Packet Tracer device."* | **Equivalent** — but note it is scoped to PT devices only in both, while the *first* sentence of the Chinese reads as a bare prohibition. Acceptable. |
| **C2** | *"配合 Ollama 或 llama.cpp **之類的**推論服務"* — "inference serving **such as** Ollama or llama.cpp" | §E.1.6 gives a three-row serving-stack table with a **specific recommendation** (Ollama default on T2, llama.cpp on T0/T1 and as fallback) | **Weaker/softer in Chinese.** The Chinese reads as a casual example; the English is a decided default. A Chinese-only reader would not learn that Ollama-with-13B-at-4-bit is the recommended configuration. |
| **C3** | *"本項目的**核心交付物是先建好一個包含 Linux、Windows 與 Cisco 三類裝置的網絡**"* — "the core deliverable is **first** to build a network of three device families" | §B.1 says the network **and then, on top of it, an AI management plane**; §B.3 C1–C8 make the AI plane a completion condition (C4, C5, C6, C7) | **Weaker in Chinese.** "核心交付物是…網絡" de-emphasises the AI plane, which the English calls *"the project's differentiating deliverable"* (§L.2) and SQ-4 elevates to *"the assessed differentiator"*. The Chinese does describe Part 2 as the AI layer, so this is a nuance rather than a contradiction — but §C.3's English framing ("the project's stated purpose (AI managing the network)") is firmer. |
| **C4** | *"主題清單**自己列出的技術**"* — "MCP is the technology **the topic sheet itself lists**" | §E.2/§E.3 assert the same, citing *"AI Network Management (e.g., Agentic AI, OpenClaw Skills, etc.)"* as the topic sheet wording. **Note:** that quoted brief text does **not** contain the string "MCP"; the corpus is explicit that MCP was *"named in the **other** Victor2 variant of the topic sheet"* (baseline §11.5) | **Equally strong in both** — so this is a shared weakness, not a Chinese-only discrepancy. Flagged because both languages assert something the cited line does not literally say. |
| **C5** | *"**Packet Tracer 裝置一律列為 NOT REACHABLE**"* and the paragraph names *"沒有可由外部存取的 SSH、SNMP 或 NETCONF／RESTCONF 介面"* | Same, and the English §C.4 wording matches | **Equivalent.** ✔ |
| **C6** | *"在十二星期、四個人、以及（**很可能**）只有一台學生電腦的條件下"* — "**in all likelihood only one student computer**" | §A closed-decisions table and §E.1: *"The 'one student laptop, nothing else' constraint is **relaxed for compute**"*; D-02 marked **CLOSED**; SQ-2 recommends *"School/lab machines"* | **Weaker / contradicts the English premise.** The Chinese paragraph immediately before correctly says the constraint "已放寬" (has been relaxed) — so the Chinese summary **contradicts itself within two paragraphs**, and its feasibility conclusion rests on a premise the English explicitly retires. **This is the clearest Chinese-summary defect.** |
| **C7** | *"第 E.1 節提供一個按 VRAM 分層的模型選擇表（**CPU-only / 8 GB / 12–16 GB / 24 GB+**）"* | §E.1.2's table has **five** tiers (T0…T4); T4 = multi-GPU / 48 GB+ / 70B-class | **Omits T4.** Materially harmless (T4 is "Not recommended") but it is an incomplete enumeration presented as the table. |
| **C8** | "五個 MCP 伺服器分別負責 Linux、Windows、Cisco、監控、以及清單／文件知識" | §E.3 names them `MCP-S-LINUX`, `MCP-S-WIN`, `MCP-S-CISCO`, `MCP-S-MON`, `MCP-S-DOC` | **Equivalent.** ✔ (The Chinese repeats "五個 MCP 伺服器 … 五個 MCP 伺服器" in adjacent clauses — a form error, not a factual one.) |
| **C9** | *"**保留 Packet Tracer 只作拓樸設計與 CCNA 級示範**"* and *"以 **DevNet Sandbox** 或**二手實體設備**作為後備"* | §C.4: the **FALLBACK is the hybrid** (PT for design + 2–4 reachable devices); *"DevNet Sandbox **alone** … Rejected as the environment of record; **kept as a supplement**"*; *"Physical second-hand gear alone … Rejected as the primary … an excellent **supplement**"* | **Flattened in Chinese.** "DevNet or second-hand as the fallback" is not the English position: **neither may be the environment of record alone**, and the fallback is specifically the hybrid. A reader of only the Chinese could pick DevNet Sandbox alone and believe they were following the outline. |
| **C10** | *"第 A 節（另於第 J 節詳述）…**這些決定必須在第 3 週結束前作出**"* — "these decisions must be made by end of week 3" | §A: B1 by **end of week 1**, B2 by **end of week 1**, B3 by **end of week 3**; D-05/D-06/D-13 by **end of week 2** | **Looser in Chinese.** "All by week 3" would let a group miss B1's week-1 deadline — the very deadline the outline calls blocking. |

**Nothing in the Chinese summary is *absent* from the English body**, and nothing is materially *stronger* except C4 (which is a shared over-claim) and C10's deadline consolidation. The pattern is systematic **softening**: the Chinese reads as a friendlier précis, and in C6 and C9 that softening becomes a factual divergence.

---

## V5 — The Cisco recommendation's internal logic (§C.4 / §C.5)

### V5.1 (a) Every rejected alternative has a stated rejection reason — **YES**

The §C.4 "Rejection rationale" table covers **five** entries plus the PT layer:

| Option | Verdict stated | Reason stated? |
|---|---|---|
| (b) GNS3 + genuine images | "Not recommended as the platform of record" | ✔ *"the IOS images are the problem: redistribution and use of IOS software outside licensed platforms is restricted, and sourcing 'images for GNS3' from the community has no defensible answer for a graded deliverable"* |
| (c) EVE-NG | "Not recommended" | ✔ *"Same image problem as GNS3, plus the heaviest local resource cost (a full VM per node) and a steeper administrative curve"* |
| (d) DevNet Sandbox alone | "Rejected as the environment of record; kept as a supplement" | ✔ *"reserved instances are time-boxed and reset, so the 'network you built' is not an artefact you can hand in, re-run at marking time, or screenshot reproducibly"* |
| (e) Physical second-hand gear alone | "Rejected as the primary" | ✔ *"needs a purchase with a lead time, it cannot host an ASA without buying one, and classic IOS has no RESTCONF"* |
| Packet Tracer as the managed layer | "Rejected outright" | ✔ full paragraph |
| **(f) Hybrid** | **Recommended as fallback** | n/a |

**No alternative is named and then left unscored/unrejected.**

### V5.2 (b) Are the nine criteria actually applied? — **YES. Measured: 9 criteria × 6 candidates, with a symbol in every one of the 54 cells.**

Criteria rows, verbatim: (1) **Real management interfaces** (SSH/SNMPv3/RESTCONF); (2) **Licensing and cost**; (3) **Persists across sessions**; (4) **Fidelity to real IOS/IOS-XE**; (5) **Support for the named protocols** OSPF/EIGRP/BGP/RSTP; (6) **Can host an ASA / firewall equivalent**; (7) **Local resource cost**; (8) **Examinable / evidence-friendly**; (9) **Likely to be permitted by the school**. Every cell carries `✔` / `~` / `✘` plus text. The legend (`✔ strong / ~ workable with a stated cost / ✘ disqualifying`) is given. **This is genuinely applied, not merely named.** §J-D-01's "Full criteria analysis — Section C.4 (nine criteria across six candidates)" matches the artefact exactly.

### V5.3 (c) Primary vs fallback clearly distinguished — **YES**

Fully boxed, separate blockquote recommendations; the primary is *"PRIMARY: Cisco Modeling Labs (CML), at the smallest topology that does the job"*; the fallback is *"FALLBACK: the hybrid — Packet Tracer for design plus 2–4 genuinely reachable devices"*; both are restated in §A (D-01), §B2, §J-D-01 and §M item 2. The distinction survives all five restatements.

### V5.4 (d) Does the simulator-only path contradict the recommendation? — **NO**

§C.5 is correctly framed as *conditional* ("**If** the school forces a simulator-only environment") and as a **reduction**: it drops `MCP-S-CISCO`, narrows UC-1, and requires a written scope-reduction note. §C.4's third recommendation line hands off to it explicitly. **No contradiction.** §C.5 also contains the strongest honesty line in the document.

### V5.5 Gaps in the Cisco logic (three)

1. **The hybrid candidate (f) is scored without a distinct basis.** Its row in criterion 6 (ASA) reads *"~ depends on the chosen reachable option; otherwise the perimeter is emulated"*, and criterion 1 reads *"✔ (from whichever reachable option is chosen)"*. Because the fallback is defined **by** the choice it defers to, it cannot be scored independently. Not fatal — the fallback's purpose is precisely to defer — but a reviewer can fairly say the fallback was never actually assessed.
2. **A required managed Cisco device is never placed.** §D.1.4 makes *"eBGP to a simulated provider"* a SHOULD with the verification `show ip bgp summary`; the AS-65000 provider is a Cisco device the estate depends on. It is in **no** row of §C.2b. In the baseline the provider is a Packet Tracer object (`PT-09`: *"PT cannot simulate a real ISP"*), i.e. NR-01 — which means the AI layer can never verify the BGP session from the peer side. Not stated anywhere. (See V1.3.)
3. **Wording drift: "five options" vs six candidates.** §C.4's lead-in says *"**The five options**, assessed on the criteria that actually decide this."* The table has **six** columns (a)–(f), §L.3 correctly says *"a full nine-criterion comparison across **six candidates**"*, and §J-D-01 lists six options. Minor, but it is exactly the kind of internal inconsistency this document exists to prevent.

**Additional check — all nine criteria are genuine "criteria that decide this":** yes. Two are soft ("Likely to be permitted by the school" is a judgement, not a measurement) but both are defensible and both are given concrete evidence in-cell.

---

## V6 — The local-model tier table (§E.1.2)

### V6.1 Required fields present in each row? — **YES**, all four, for all five tiers

| Tier | Model class | Quantisation | Tool calling reliable? | Demo feasible? |
|---|---|---|---|---|
| T0 | ~3B–8B | 4-bit GGUF | "Yes, but fragile" + measurement required | "Narrow — scripted, queued runs only" |
| T1 | ~7B–9B | 4-bit GGUF | "Workable … need retry logic" | "Good for a scripted demo, acceptable interactively" |
| T2 | ~13B–14B | 4-bit GGUF | "Good. Reliable multi-tool chains" | "Full. Live demonstration is comfortable" |
| T3 | ~30B–35B | 4-bit GGUF | "Best of the set" | "Full, plus headroom" |
| T4 | 70B class | 3–4-bit | "Excellent" | "Overkill" |

### V6.2 Flags

**F1 — A reliability claim with a stated basis → acceptable.** The outline explicitly says *"Tool-calling reliability is measured, not read off a specification sheet"* (line 430) and makes a ~20-probe malformed-call-rate measurement the deliverable of the week-5–6 spike. The tiers' reliability words are predictions, but the outline *requires* them to be confirmed by measurement and says the tier determines D-06 rather than the reverse. **I found no tier claiming reliable tool calling without a stated basis.** The strongest claims (T3 "Best of the set", T4 "Excellent") rest on model class alone, which is weak — but each is hedged by the mandatory probe set. **Acceptable, but the report should present T3/T4 as untested predictions.**

**F2 — Internal contradiction: T0/T1 cannot safely run UC-4, yet UC-4 is the recommended commitment.**
- §E.1.2's tier-transition warning (line 429): *"**T0 and T1 cannot be assumed to run UC-4 (approval-gated change) safely**, because a model that mistypes a tool argument is a model that must not be given a change tool."*
- §E.1.3 item 2: *"Drop UC-4 (approval-gated change): a weak tool-caller must not be given a change tool."*
- T0 row: *"**UC-1, UC-3, UC-5.** Drop UC-2 and UC-4."*
- **But** §A D-06: *"Commit to **UC-1, UC-3, UC-4**; add UC-2 and UC-5 if week 10 allows"*; §E.7: *"the recommendation (D-06) is UC-1, UC-3 and UC-4"*; §J-D-06: *"Commit to three … UC-4 is now policy-compatible … but it is **tier-dependent**: on T0/T1 it should be dropped."*

  The **contingency is disclosed** (J-D-06 says so explicitly), and T2 is the recommended target. So this is a **conditional commitment**, not a bare contradiction. **But** §E.7's own commitment sentence and B.3's completion condition C6 list UC-4 unconditionally; only J-D-06 carries the tier caveat. **Fix:** put the tier caveat in §E.7 and B.3 C6 as well, so the unconditional commitment is never the only text a writer sees.

**F3 — T3/T4 inversion, unexplained.** T3 is *"Best of the set"* with *"~15–35 tok/s"* while **T4 (70 GB-class, 48 GB+, "Excellent") is ~5–15 tok/s** and described as *"the slowest per token"*. A 70B model on 48 GB+ being ~2.3× slower than a 30B model is plausible in practice (VRAM/bandwidth class, not just size), but the **document gives no reason** — and T4's hardware class (multi-GPU) is precisely the case where throughput should be highest. The table therefore contains an unstated assumption about consumer vs workstation GPU class. **Flag as a criterion claimed but not used:** the tier table's implicit "GPU class / VRAM bandwidth" axis is never named. (Note the English does **not** claim newer is faster, so this is an unexplained inversion rather than a false claim.)

**F4 — T0 is the only tier row with no VRAM figure.** T0 says *"**CPU only**, 16–32 GB RAM"*. That makes the mapping to §A's D-04 options ambiguous: D-04 offers *"(a) none (CPU only); (b) ~8 GB"* and D-04's consequence cell says *"CPU-only forces a ~3B–8B class model, **makes live demonstration impractical**"* — but T1 (~8 GB VRAM) is explicitly *"Good for a scripted demo, acceptable interactively"*. So **D-04's consequence cell conflates T0 and T1**, contradicting §E.1.2's own T1 row. Minor but real.

**F5 — VRAM figures vs §C.4.** §C.4 says CML needs *"~ 16–32 GB RAM for a small topology on top of the hypervisor"* (system RAM, not VRAM). No tier's VRAM figure contradicts another part of the document. **No VRAM contradiction found.**

### V6.3 The "must never share a host with the 19-VM estate" requirement — **not contradicted, but with one unaddressed consequence**

The rule appears in four places, all consistent: §A D-03 option (a) *"never co-locate the model with the 19-VM estate host, because the model and the network it manages would then compete for the same RAM"*; §J-B1/D-03 *"option (a) — never co-locate the model with the 19-VM estate host"*; §K **R5** *"Never place the model inside the estate host"* and **R19** *"**D-03 option (a) is mandatory**"*; §K R5's risk text *"RAM exhaustion with 19 VMs plus a model"*. The "19 VMs" figure matches `baseline` §15.1 exactly (19 VMs / 42 vCPU / 78 GB). **No contradiction found.**

**Unaddressed consequence:** §C.4's PRIMARY recommendation is **CML**, and §C.4 itself says CML costs *"~ 16–32 GB RAM for a small topology **on top of the hypervisor**"*. The outline never says **where CML runs**. If it runs on the same lab machine as either the estate or the model, D-03's mandatory "never co-locate" rule is at risk; if it runs elsewhere, that is a second machine the B1 specification capture does not cover (B1 asks about *"the lab machine"*, singular). **This is a real gap between the Cisco platform recommendation and the hardware decision.** It belongs in §J-D-01 or §B1.

---

## V7 — Decision-table completeness

The outline has two decision surfaces: **§A** (the master table: 3 blocking B1–B3, 13 decision rows D-01…D-13, 5 supervisor questions SQ-1…SQ-5) and **§J** (expanded narrative for B1/D-03/D-04, D-13, D-01, D-02, D-07, D-05, D-06, D-08/D-09/D-11, D-12). §J covers 9 of the 13 D-items and all three blocking items.

### V7.1 Gaps in one direction — decisions the body depends on that are **not in the table**

| # | The body depends on… | Where | In the decision table? | Severity |
|---|---|---|---|---|
| **DEC-1** | **Which hypervisor / virtualisation platform** (VMware vs VirtualBox) | §C.2 (*"hypervisor host-only networks"*), §D.3 (*"platform decided and installed"*), §F.2 week 1 (*"get the platform installed on one machine"*), §F.1 **G0** (*"D-01 to D-05, D-09, D-11, D-12 answered"* — the platform decision is **not** in the G0 list), §G.2 (*"Platform / hypervisor decision"* — RACI'd but never defined), §L.1 (*"hypervisor host-only networks, one per zone"*), and `baseline` §13.2 PT-07 | **NO.** No decision ID exists. §A's D-02 closed row is about **physical hardware**, not the hypervisor. The gate G0 omits it. | **High.** It is the first thing built (week 1), it is RACI'd in §G.2 with a named accountable owner, and it silently constrains §C.2's entire segmentation mechanism. A load-bearing decision with no record. |
| **DEC-2** | **The remote-access technology: OpenVPN *or* IKEv2/RRAS** | §D.1.3: *"**Pick one to build properly rather than two badly.** … prefer OpenVPN for standards alignment, prefer IKEv2 if the Windows line needs depth"*; §F.2 week 5 (*"Remote access chosen and built (OpenVPN **or** IKEv2)"*); §G.2 (*"File, storage, remote access"* RACI'd) | **NO.** No decision ID. It is a genuinely undecided either/or with an explicit standards-alignment trade-off (OpenVPN is *named* in the WSOS; IKEv2/RRAS is not). | **Medium-High.** A WSOS-citation-bearing choice left with no owner and no deadline. |
| **DEC-3** | **The size of the Cisco estate** (5–6 vs 5–8 vs 8–10 devices) | §C.1 target **5–8**; §D.2 MUST core **5–6**; §B.3 C1 "Cisco devices"; §C.4 primary topology *"one HQ core pair, one WAN edge router, one branch router, one perimeter firewall"* = **5**; §D.2 *"That is roughly 8–10 Linux guests, 6–8 Windows guests"* | **NO.** No decision ID; the numbers simply differ across sections without a ratifying decision. | **Medium.** Because §C.2b's matrix is normative and the Cisco count determines how many `REACHABLE` rows there are, an unreconciled count undermines the matrix. |
| **DEC-4** | **How many interior/exterior routing protocols are committed** | §B.3 C2 *"at least two interior protocols and one exterior protocol"*; §D.1.4 marks OSPF MUST, EIGRP SHOULD, eBGP SHOULD | **NO.** Implied by B.3 but never offered as a decision, despite being the WSOS's strongest single citation (OSPF/BGP/EIGRP in one line) and the subject of D-05's whole rationale. | **Low-Medium.** |
| **DEC-5** | **Whether the two-shift estate fallback is adopted** | §K R5 (*"the two-shift fallback for the VM estate"*), §K R18 (keep T0 fallback ready), §A D-03 (a), `baseline` §13.1 A-01 | **Partly.** It is a mitigation, not a decision — defensible, but it is a resource decision that determines whether 19 VMs run. | **Low.** |

### V7.2 Gaps in the other direction — table entries the document has **already silently decided**

| # | Table entry | How the body already answers it | Severity |
|---|---|---|---|
| **DEC-6** | **D-11 "Is Packet Tracer kept at all?" — offered as `(a) drop it; (b) keep for design and topology only`** | **Already answered (b) in four places**: §A D-11's own recommendation, §C.3's figure (which *must* contain the PT design-time box: *"This crossed-out arrow is deliberate and must be drawn"*), §C.4 (*"Packet Tracer stays in the project as a **design-time** tool and nothing more"*), §J's D-08/D-09/D-11 expansion (*"Packet Tracer is kept, strictly as a design-time tool"*), and §M item 2 (the hybrid fallback *requires* PT). If a supervisor picked (a), Figure 1 and §C.5's "configured by hand in Packet Tracer" line would both be wrong. | **Medium.** It is honestly labelled a recommendation, but the body has moved past it. Present it as closed-by-construction or state the consequence of (a). |
| **DEC-7** | **D-06 "the demonstrable AI use cases to commit to"** | §E.7 states the commitment as a fact (*"Commit to at least three; the recommendation (D-06) is UC-1, UC-3 and UC-4"*), and §B.3 **C6** makes it a closure condition (*"The agent completes the committed use cases from Section E.7"*). C6 is unconditional; D-06 is `[to be decided]`. | **Medium.** Same shape as DEC-2: a completion condition that rests on an open decision. |
| **DEC-8** | **D-05 "Windows depth vs Cisco depth"** | §G's RACI is already Cisco-emphasis-shifted and §G.1 says *"with the AI/Cisco emphasis shifted per D-05"*; §L.1's RACI row says *"Reused with the AI/Cisco emphasis shifted per D-05"*. So the artefact the decision governs is already written as though the decision were made. | **Low.** Explicitly a forward reference, so defensible. |
| **DEC-9** | **B1's type flips between "record" and "decision"** | §A's blocking table: *"**B1 — The lab machine's exact specification** … **The choice of model is blocked on this**"* (a record). §E.1.1: *"Action item"*. §J heading: *"B1 / D-03 / D-04 — … **(BLOCKING)**"* with a **Decision** field reading *"What exactly is the school/lab machine…"*. §M item 1: *"Record the lab machine's specification — BLOCKING (B1)"*. Not a real inconsistency (a record that gates a decision is fine) but the table's "Decision" column is used for a fact-gathering item. | **Low.** |
| **DEC-10** | **D-02 and D-07 are in the "DECISIONS TO CONFIRM" table while marked CLOSED**, and §A's own preamble says *"Two decisions are already closed"* above a table containing **three** closed rows | §A preamble: *"**Two decisions are already closed** by the student"* → the table below has **three** `Closed` cells (compute, permission depth, offline/hybrid). The count is wrong in the outline's own text. | **Low but embarrassing.** One-word fix. |

### V7.3 Decision-surface consistency between §A and §J

§A's 13 D-rows + 3 B-rows + 5 SQ-rows = **21 decision records**. §J expands **9 of the 13** D-rows plus B1/D-03/D-04. **Unexpanded in §J:** D-04 (as its own heading), D-08, D-09, D-10, D-11 are covered only by the composite *"D-08, D-09, D-11"* section; **D-10 ("which local model family") is mentioned in that composite's title but has no expansion anywhere in §J and is folded into B1/D-04.** That is defensible (D-10 is explicitly `[TO CONFIRM]` pending B1), but a reader of §J alone would not find D-10.

**Nothing in the table is a decision the document has *already made* in a way that hides a live choice, with the exception of D-11** (DEC-6), where the body's commitment to keeping PT is materially further advanced than "recommendation".

---

## V8 — Gate re-run and hash stability

### V8.1 `sdk-validate.ps1` — **PASS, 0 errors, exit 0**

```
FILE : D:\File\School\FYP\FYP-Outline-DRAFT.docx
SIZE : 91339
SHA256(pre) : 32BDD8D1C5871333E0237B4ED8ECA238B9ABE2511B1B833DFAD3A7E23B067F2E
RAW  : no duplicate relationship Ids, no duplicate content-type declarations
OPEN : OK
ERRORS: 0
FORMAT: Office2013   MAXERR: 2000000   SDK: 2.9.1.0
==============================================================================
SUMMARY|files=1 openFailures=0 validationErrors=0 rawIssues=0
EXITCODE=0
```

**Error count: 0. Pass.** The script's documented CRITICAL INVARIANT was honoured: the package was opened from an in-memory copy, and the script's own `SHA256(pre)` matches the hash I computed independently before running anything.

### V8.2 `verify-package.ps1` — **PASS, 9/9, exit 0**

```
FILE : D:\File\School\FYP\FYP-Outline-DRAFT.docx
  ok   content types: 2 Default, 11 Override, all 14 parts declared
  ok   _rels/.rels : 4 relationship(s), unique
  ok   word/_rels/document.xml.rels : 8 relationship(s), unique
  ok   r:id references across document/header/footer: 3 (rId6, rId7, rId8), all resolve
  ok   tables: 57, every w:tbl has a w:tblGrid whose gridCol count matches every row's tc count
  ok   styles: 29 defined, all referenced pStyle/rStyle/tblStyle ids resolve
  ok   numbering: 2 numId(s) defined, all referenced numIds resolve
  ok   w:body: 504 element children, exactly one trailing w:sectPr
RESULT|D:\File\School\FYP\FYP-Outline-DRAFT.docx|PASS|all 9 checks passed
SUMMARY|files=1 failures=0
EXITCODE=0
```

### V8.3 SHA-256 before / after — **IDENTICAL: validation did not mutate the artefact**

| | SHA-256 | Bytes |
|---|---|---|
| **Before** (`FYP-Outline-DRAFT.docx`) | `32BDD8D1C5871333E0237B4ED8ECA238B9ABE2511B1B833DFAD3A7E23B067F2E` | 91,339 |
| **After** sdk-validate + verify-package | `32BDD8D1C5871333E0237B4ED8ECA238B9ABE2511B1B833DFAD3A7E23B067F2E` | 91,339 |
| **Before/After** (`FYP-Outline-DRAFT.md`) | `16DB74CE12306BE1E271AE9E0F950C86CF37C640C24178DC40687EFD686D4B82` | 158,371 |

**Hash-stable. No mutation.** (I ran `sdk-validate.ps1` three times in total — twice successfully and once with a bad argument that failed before touching the file — and re-hashed after all of them.)

### V8.4 Incidental tool observation (not a defect in the outline, but worth reporting)

`sdk-validate.ps1`'s own header documents `-ShowFull` as a switch (*"[-Top 10] [-ShowFull] [-Quiet]"*), but the implementation now declares it `[bool]` (line 77-78 of the script explains why: a PowerShell 5.1 parameter-binder defect). Passing `-ShowFull` bare, or `-ShowFull $true` through `powershell -File`, both fail with `Cannot process argument transformation on parameter 'ShowFull'`. **The documented usage line is stale relative to the implementation.** I did not modify the tool. This does not affect validation correctness — the default run is the substantive one and it passes.

---

## V9 — Consistency with the frozen standards facts

I cross-checked the outline's §I (and every other standards claim in the document) against `proposal\research\wsos-2026-2447.md` and the corpus's own §11.6 extraction.

| Frozen fact | Outline's treatment | Verdict |
|---|---|---|
| WSOS 2026 names ADDS, Nginx, OpenVPN, OSPF/BGP/EIGRP, GLBP/HSRP/VRRP/LACP/PAgP, CDP/NetFlow/Syslog/SNMP/tcpdump, Bash/PowerShell/Git/Ansible | §I.2 lists all of them as *"Named in the standard (citable verbatim)"*; the bolded subset (Nginx, OSPF/BGP/EIGRP, HSRP/VRRP, LACP, OpenVPN, CDP/NetFlow/Syslog/SNMP/tcpdump, Bash/PowerShell/Git/Ansible) is exactly the set used as project justification. §D.1.4 correctly says GLBP/HSRP/VRRP/LACP/PAgP appear *"together with"* in one line. | **CORRECT** |
| WSOS 2026 names **no** FSRM, iSCSI, RRAS, IKEv2, Keepalived, nftables, WireGuard, RSTP, ASA, Agentic AI, OpenClaw or MCP, and **no AI content at all** | §I.3 lists FSRM, iSCSI, RRAS, IKEv2, Keepalived, nftables, WireGuard, RSTP, ASA as *"**ABSENT from the standard** — justify from the brief"*, each with a legal bridge; §I.4 states *"WSOS 2026 contains no AI content whatsoever"* with the four substring false positives (`ShanghAI`, `dAIly`, `mAIntain`, `domAIn`) named individually; §I.6 repeats all of them under "outside the standard". | **CORRECT** — matches research §5.1 and §5.2 exactly, including the four false positives |
| Likewise **absent** in the standard but listed in §I.6's "outside the standard" line | §I.6 also includes *"All AI content"*; §I.3's table enumerates the rest. | **CORRECT** |
| The **2026 edition removed** Python, YANG, RESTCONF and NETCONF from the automation domain | §I.5 heading and body: *"All four were present in the 2024 Domain 5 text and are **absent from 2026**. Therefore: **do not cite the standard as requiring RESTCONF or NETCONF.**"* It then says the project *uses* RESTCONF deliberately but **not** on the standard's authority. | **CORRECT** — matches research correction **C1** word for word |
| **Screen captures are an HDTN brief requirement, not a WSOS one** | §H.2: *"WSOS 2026 does **not** mention screen captures at all, so attribute the requirement correctly: it is the **HDTN brief's**, not the standard's."* §I.6: *"The **screen-capture** evidence requirement — **The HDTN brief's**, not the standard's — the standard says `screen`, `capture`, `screenshot`, `evidence` zero times."* | **CORRECT** — matches research §4.3 (all four counts = 0) |
| The six domains and weights (5/5/25/25/15/25) | §I.1 reproduces them exactly and correctly notes the three 25% domains are 75% | **CORRECT** |
| The documentation line is Domain 6 and 25%-weighted | §I.7 quotes *"Prepare a technical document reflecting the solution in detail for agreement and sign-off"* and calls it 25%-weighted | **CORRECT** |

**No misstatement of the frozen standards facts found. §I is the cleanest section of the document.**

**Two adjacent, non-standards observations in §I, for completeness:**

- §I.2's list also contains items the standard does **not** name: `NAT` and `NTP` appear only as words in the extraction (the standard names `DHCP/DNS` and *"network time"*-class phrasing, not `NTP` as a token); `AD CS` appears as *"Active Directory Certificate Services"*; `WDS` appears as *"Windows Deployment Services"*; and `BIND` is named. The outline prefixes these with *"(in words)"* for DHCP/DNS/NAT/NTP and later says *"(present in the standard, not necessarily as the brief lists them)"* — so it is disclosed, but a hyper-strict reader could still assert the outline is citing tokens the standard does not contain. **Low severity, and the disclosure is present.**
- §I.2's list **omits four technologies the standard does name and the project could cite**: `SSH` (named twice — the outline does use SSH everywhere but does not claim it as a standard citation here), `Telnet`, `Batch`, and `Icinga2` is included. Since the outline's habit is to cite the strongest available line, omitting `SSH` from the "citable verbatim" list is an under-claim, not an over-claim. **Informational only.**

---

## V10 — Overall verdict

### **ACCEPT WITH CAVEATS**

The outline does what it says it does. It is accurate to its sources on every checkable factual claim I could measure independently: the contradiction it claims to resolve **is real** (`06` §10.7 and §10.7.4 vs `07` §11.6.3/§11.6.4/§11.7.2 — both confirmed verbatim); the outline itself contains **no PT-reachability claim of any kind**; all four headline statistics are correct as written (with one wording scope-slips); the corpus's **286,932-word** figure is exact to the word; the standards section is entirely consistent with the frozen extraction; the withdrawals are real and accurately quoted in 10 of 11 cases; and both OOXML gates pass with the artefact's hash bit-identical before and after.

The caveats are real but none of them is disqualifying.

### The single most important thing to fix

**§L.4 row W1's citation.** It reads `baseline §11.6 (L5 table)`. `baseline §11.6` is *"Alignment with the WorldSkills Occupational Standards 2026"*; the L5 table containing `Model hosting / fine-tuning / GPU inference | NOT COVERED` is **§11.5**. The document's central integrity claim is that its withdrawal register is checkable. A reviewer who follows the first row of that register to §11.6 and does not find the quote there has been handed a reason to distrust the other ten rows. One-character fix; disproportionate cost if left.

### Runners-up, in priority order

1. **§C.2b's silent narrowing of the estate.** Nine named members of the frozen 19-VM estate (`vpnz-dmzweba01/02`, `vpnz-jump01`, `vpnz-brdc01`, `vpnz-dmzwp01/02`, `vpnz-dmzjump01`, `vpnz-dmzrev02`) appear nowhere in the outline, while §L.1/§L.1a promise the inventory is carried forward verbatim. Add one sentence declaring them out of AI scope (V1.3).
2. **The eBGP provider is an unplaced managed device.** §D.1.4 makes it a SHOULD; §C.2b never places it; the baseline says it is simulated. State that the AI layer cannot verify the session from the peer side (V1.3, V5.5).
3. **W1's counterpart: §E.3's "every occurrence is negative or marginal".** Two of the four `07` MCP hits and two baseline hits are affirmative — the corpus already leaned toward MCP. Say so; it strengthens rather than weakens the argument (V3.3).
4. **The hypervisor decision has no record but is the first thing built and is RACI'd** (§G.2). Give it an ID and add it to G0 (V7, DEC-1).
5. **The remote-access choice (OpenVPN vs IKEv2/RRAS) has no decision ID** despite carrying a WSOS-citation trade-off and a week-5 build slot (V7, DEC-2).
6. **Chinese summary C6 and C9** — the Chinese rests its feasibility on "probably only one student computer" after the same paragraph says the constraint was relaxed, and flattens "fallback = hybrid" into "fallback = DevNet or second-hand", either of which the English *rejects* as the environment of record (V4).
7. **Decisions DEC-1/2/3/6/7 and the "two closed / three closed" miscount** (V7).
8. **T0/T1 cannot run UC-4, but UC-4 is committed unconditionally in §E.7 and B.3 C6** — carry J-D-06's tier caveat into those two places (V6.2 F2).
9. **Rows RW-07/RW-08 are labelled `REACHABLE` without a transcript, contradicting the §C.2b legend's own definition** (V1.2).
10. **§C.4 says "The five options" above a six-candidate table** (V5.5).

### What I could not verify

- **The `FYP-Outline-DRAFT.docx`'s content fidelity to the Markdown.** I validated the package structurally and checked its hash stability, but I did **not** compare its text against the `.md` (that would mean re-opening it, and the instruction was to treat the Markdown as source of truth and to avoid touching the `.docx`). **A stale render is possible and I cannot rule it out.** The outline's own §M item 12 and §H.3 depend on the `.docx` matching.
- **The outline's self-reported word counts.** The outline says it is *"approximately 19,500 words by a prose count that excludes fenced code blocks (~18,650 Latin words plus ~1,350 Chinese characters)"* with *"22,394 whitespace-split words"* reported by the converter. My measurements: **1,352 CJK characters** (matches), but **21,583 Latin tokens excluding fenced blocks** and **24,943 whitespace tokens overall** — i.e. roughly **2,900 more Latin/whitespace words than the outline claims** (my Latin-token regex is generous, so the true gap is smaller; but the converter's own "22,394" figure is likewise ~2,550 below my 24,943 on the identical measure in my environment). **Either both of us are off by different methods or the document's size claims are understated by ~10–15%.** This matters because §H.3 is a *decision* (option 1 vs 2 vs 3), and its premise is that the overshoot is ~2× rather than ~2.2×. I could not resolve which method is canonical.
- **The live WorldSkills page.** Everything in V9 is checked against the project's own frozen extraction (`proposal\research\wsos-2026-2447.md`), which is the project's citation of record. I did **not** re-fetch the live standard; if the extraction is stale, V9's verdicts inherit that staleness.
- **Whether the corpus's own open decisions (`OD-…`, `O-01…O-09`) that the outline does not mention still matter.** I checked the specific ones the outline cites (O-09/P-34) but did not systematically audit the baseline's open-decisions list against the outline's D-list.
- **Anything inside the scope of the strict constraints:** I did not touch `AY2627_FYP topics_v2_Victor Li.docx` or `image.png`, did not open the `.docx` by path or via Word/Word COM, installed nothing, and wrote only this one file.

### Files written

- `D:\File\School\FYP\proposal\integration\outline-audit.md` (this report) — the only file created or modified by this audit.

---

*End of audit. Positive findings are stated as positive because they were measured, not assumed; every defect listed above is reproducible from the artefact as it exists now.*
