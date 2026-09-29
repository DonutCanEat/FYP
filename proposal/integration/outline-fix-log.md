# Outline fix log — `FYP-Outline-DRAFT.md` / `.docx`

**Date of run:** session-local; every command was run against the files as they exist now.
**Trigger:** the independent audit at `proposal\integration\outline-audit.md` (verdict **ACCEPT WITH CAVEATS**, 16 defects).
**Scope discipline:** only `FYP-Outline-DRAFT.md`, its render `FYP-Outline-DRAFT.docx`, backups of both, and this log were written. No section file, i18n file, research file, tool or other deliverable was modified. No software was installed. Shell was Windows PowerShell 5.1 with an ANSI cp950 console, so every UTF-8 read used `[System.IO.File]::ReadAllText($p,[System.Text.Encoding]::UTF8)`.

## 0. Artefact identity

| | Before | After |
|---|---|---|
| `FYP-Outline-DRAFT.md` | 158,371 bytes · `16DB74CE12306BE1E271AE9E0F950C86CF37C640C24178DC40687EFD686D4B82` | **197,870 bytes** · `5546CE59658376B831DCDAC7D97788A63D14D924E827A92FBF7794F5A9ADD18F` |
| `FYP-Outline-DRAFT.docx` | 91,339 bytes · `32BDD8D1C5871333E0237B4ED8ECA238B9ABE2511B1B833DFAD3A7E23B067F2E` | **110,517 bytes** · `B2FD9F7409BCC3A9F56DC013911566D4FE6A34806AA90984E25E79911E135BBD` |

Backups (byte-identical to the pre-edit originals, verified by SHA-256 after copying):

- `proposal\integration\backup-outline-audit-fix\FYP-Outline-DRAFT.md.bak` — 158,371 bytes · `16DB74CE…D4B82`
- `proposal\integration\backup-outline-audit-fix\FYP-Outline-DRAFT.docx.bak` — 91,339 bytes · `32BDD8D1…67F2E`

---

## FIX 1 (highest priority) — §L.4 W1's citation was wrong; the whole register was then re-verified

### 1.1 W1 citation corrected

`00-design-baseline.md` §11.5 is *"L5 — AI Network Management"* and contains the L5 table. §11.6 is *"Alignment with the WorldSkills Occupational Standards 2026"* — a different table entirely.

**Before**
```
| W1 | `Model hosting / fine-tuning / GPU inference | NOT COVERED` | baseline §11.6 (L5 table) | **WITHDRAWN.** …
```
**After**
```
| W1 | `Model hosting / fine-tuning / GPU inference | NOT COVERED` | baseline **§11.5** (L5 table; §11.6 is the WSOS alignment table) | **WITHDRAWN.** …
```

Verified in the source: `proposal\00-design-baseline.md` line 959 is `### 11.5 L5 — AI Network Management (…)` and line 966 is the `Model hosting / fine-tuning / GPU inference | **NOT COVERED**` row; line 970 is `### 11.6 Alignment with the WorldSkills Occupational Standards 2026`.

### 1.2 Every other citation in §L.4 W1–W11 re-verified against the source files

The whole register was treated as suspect. Each location was opened and the quoted text matched. **No other wrong section number was found.** Full table in the final report; the locations are:

| # | Outline's cited location | Verified against | Result |
|---|---|---|---|
| W1 | `baseline` §11.5 (corrected from §11.6) | `00-design-baseline.md` ### 11.5, table row | ✅ |
| W2 | `baseline` §15.2 (host specification) | `00-design-baseline.md` §15.2 final table row `\| GPU \| Not required \| Not required \|` | ✅ |
| W3 | `08-project-management.md` §13.7 | line 793, *"…are likewise out of scope and appear only as future work."* | ✅ |
| W4 | `08` §12.5.2 | line 279, *"the AI line is the weakest line…"* | ✅ |
| W5 | `08` §12.1, §12.9; `baseline` §13.4 R-02 | lines 15, 428; baseline §13.4 priority order | ✅ |
| W6 | `baseline` §10 | §10 port matrix row `P-34 \| 18789/tcp \| OpenClaw agent control/API endpoint` | ✅ |
| W7 | `baseline` §12.5; `08` | baseline §12.5 FALLBACKS F1–F5; spike in §13.6 item 3 | ✅ |
| W8 | `07-ai.md` §11.6.3, §11.6.4, §11.7.2 | lines 288, 292 (### 11.6.4), 506–507 (#### 11.7.2) | ✅ |
| W9 | `baseline` §15.1, §6 | §15.1 table row `Ubuntu guest \`vpnz-ai01\` (agent runtime) \| 1 \| 4 \| 8 \| 60` | ✅ |
| W10 | `01` §4.4; `07` §11.1.1 | `01` line 1033 `### 4.4 The AI Network Management Line`; `07` line 7 `#### 11.1.1` | ✅ |
| W11 | `baseline` §11.4 | §11.4 row *"Network-device automation *in the simulator*"* | ✅ |

---

## FIX 2 — §C.2b silently narrowed the estate

### 2.1 The nine invisible VMs are now named everywhere they belong

**Before:** §C.2b's RW-03 named `vpnz-san01`, `vpnz-rras01` "and every other Windows member server"; RW-06 named `vpnz-dmzrev01/02`, `vpnz-lnxra01` "and every other Ubuntu guest". `vpnz-dmzweba01`, `vpnz-dmzweba02`, `vpnz-jump01`, `vpnz-brdc01`, `vpnz-dmzwp01`, `vpnz-dmzwp02`, `vpnz-dmzjump01` and `vpnz-dmzrev02` appeared **nowhere in the outline** — 0 occurrences each — while §L.1a item 3 promised the 36-row inventory was carried forward verbatim.

**After** — both catch-alls carry a complete enumeration, so the matrix can now be used to check estate completeness:

```
| RW-03 | **Every Windows member server not named in RW-01/RW-02** — complete enumeration:
  `vpnz-san01`, `vpnz-rras01`, `vpnz-dmzweba01`, `vpnz-dmzweba02`, `vpnz-jump01`, `vpnz-brdc01`
  (all 6 named; **9 of 9 Windows guests are covered** …) | … |
| RW-06 | **Every Ubuntu guest not named in RW-04/RW-05** — complete enumeration:
  `vpnz-dmzrev01`, `vpnz-dmzrev02`, `vpnz-lnxra01`, `vpnz-dmzwp01`, `vpnz-dmzwp02`, `vpnz-dmzjump01`
  (all 6 named; **10 of 10 Ubuntu guests are covered** …) | … |
```

A **new estate-coverage table** was added to §C.2b that reconciles the inventory class by class (9 Windows + 10 Ubuntu + 1 hypervisor + 16 PT devices + the eBGP provider = 36 rows, every row either a matrix row or a named `NOT REACHABLE` row) and ends with: *"Every inventory member is therefore either in the matrix or named as excluded in it, and none is silently absent."*

### 2.2 Three different estate counts reconciled to one

**Before**
- §L.1/§L.1a: the 36-row inventory is carried forward.
- §D.2: *"That is roughly **8–10 Linux guests, 6–8 Windows guests, and 5–6 Cisco devices**"*.
- §C.1 table: Windows `8–10`, Linux `9–10`, Cisco `5–8`.

**After** — one number, stated once in §C.1 and reused:

> "**The estate count, stated once so that nothing below has to re-derive it.** The frozen baseline's §6/§15.1 inventory is **36 rows = 16 Packet Tracer logical devices + 19 virtual machines + 1 hypervisor host**; the 19 VMs are **9 Windows Server guests + 10 Ubuntu guests** … **That 19-VM / 10-Linux / 9-Windows estate is the number this outline carries forward and the number §C.2b, §D.2, §D.3, §F.2, §L.1 and §L.1a all use.**"

§C.1's Windows row is now `**9**` with the nine hostnames listed; the Linux row is `**10**` with the ten hostnames listed; the Cisco row points at the new **D-16**. §D.2's MUST-core sentence now reads *"a subset of the **19-VM estate … 10 Ubuntu guests, 9 Windows Server guests and the hypervisor host** — plus the **five Cisco devices fixed as the target by D-16**"*.

### 2.3 RW-07 / RW-08 no longer labelled `REACHABLE`

**Before:** `**REACHABLE** *(conditional on D-01/D-12)*` and `**REACHABLE** *(conditional on D-01)*` — under a legend that defined `REACHABLE` as requiring a transcript, which neither row can have before its decision is ratified.

**After:** both rows read **`CONDITIONALLY REACHABLE`**, and the new status is defined in the legend.

### 2.4 The legend now matches §C.2a's governing rule

**Before**
```
`REACHABLE` = a real interface exists and a transcript proves it. `NOT REACHABLE` = no interface exists…
```
**After**
```
`REACHABLE` = **a transcript is filed showing a command run from the management host, in this lab, returning
data from that specific device through a real interface.** Existence is not enough and a design intention is
not enough: the evidence-based rule at §C.2a governs, and this legend states the same rule in the same tense.
`CONDITIONALLY REACHABLE` = … depends on an **open decision (named in the row)** and therefore **no
transcript can exist yet** … `NOT REACHABLE` = no interface exists in this project…
```

### 2.5 RW-03 / RW-06 completed rather than "representative"

See 2.1 — both are now complete enumerations with the covered/total counts stated inline, so no reader has to know whether the list is illustrative.

---

## FIX 3 — the eBGP "simulated provider" device is now placed, and the consequence is stated

**Before:** §B.3 C2 and §D.1.4 required eBGP to a simulated provider; the provider appeared in **no** matrix row; nothing said its platform or what its absence costs.

**After:** a new matrix row **NR-01a** places it, and the consequence is stated in three places (§C.2b, §C.4, §J-D-01) and in a new §C.3 figure element:

```
| **NR-01a** | **`VP-ISP-EDGE-01` — the eBGP AS-65000 simulated provider** … | **Cisco Packet Tracer, as
recorded in the baseline's §13.2 PT-09** (*"PT cannot simulate a real ISP"*) | **NOT REACHABLE** | **None.**
… | **Nothing — and this has a specific cost that must be stated:** **the AI layer can never verify the eBGP
session from the peer side.** … If the group wants a peer-side view it must make the provider a **genuinely
reachable** device (a second CML IOS-XE node used as AS-65000, per D-01), in which case that node joins RW-07 … |
```

And in the §C.2b reachability discussion:

> "**The one consequence of the eBGP exclusion that the report must state out loud** … **the AI layer can never verify the BGP session from the peer side** … The honest framing for the report is: *"the eBGP session was verified from the local autonomous system only; the simulated provider exposes no management interface, so no peer-side verification is claimed."*"

§D.1.4's eBGP row also gained the peer's matrix status, and the §C.3 figure gained a labelled, unarrowed design-time box for the provider.

---

## FIX 4 — §E.3 over-claimed

### 4.1 "every occurrence is negative or marginal" — withdrawn and corrected

**Before**
> "Measured across the existing 286k-word proposal: `MCP` appears **four times in the AI chapter and `MCP server` appears zero times anywhere**, and **every occurrence is negative or marginal** — evidence that the standard does not mention it, an adjective ("the MCP-style tool bridge"), a "design choice, not a verified implementation", or a **cuttable** item in the risk register."

**After** — a measured table plus an explicit correction:

> "| Term | In the eight section files | In the design baseline + its Rev 1.1 addendum | **Corpus-wide** |
> | `MCP` | **24** (01: 6, 02: 8, 07: 4, 08: 6) — of which **4 are in the AI chapter** | **10** | **34** |
> | `MCP server` | **0** | **0** | **0 — the phrase appears nowhere in the corpus** |
> | `OpenClaw` | **87** (01: 6, 02: 16, 04: 1, 07: 48, 08: 16) — of which **24 are in the AI chapter** | **40** | **127** |
> | `Ollama`, `vLLM`, `llama.cpp`, `gguf`, `VRAM` | **0 each** | **0 each** | **0 each** |"
>
> "**The claim that has to be corrected, and why correcting it strengthens this outline.** An earlier draft of this section said of MCP that *"every occurrence is negative or marginal"*. **That is false and the corpus contradicts it.** … the other **two are affirmative design commitments**. The first is §11.4 … The second is §11.11 … The design baseline is more explicit still: `§11.5` records **MCP as "PARTIAL — declared"**…"

*(The `MCP server` = 0, `Ollama` = 0, `vLLM` = 0, `llama.cpp` = 0, `gguf` = 0 and `VRAM` = 0 claims were independently re-measured and are correct as written — they were kept, only their scope is now named.)*

### 4.2 "zero times anywhere" — scope-named and corrected

**Before:** *"`MCP` appears four times in the AI chapter and `MCP server` appears zero times anywhere"* — one scope for the first figure, a different (and false) scope for the second, in a single clause.

**After:** every figure states its scope — *"in the eight section files"* vs *"in the design baseline + its Rev 1.1 addendum"* vs *"corpus-wide (sections + baseline + addendum)"*. The corrected corpus-wide figures are **`MCP` 34** and **`OpenClaw` 127**. `MCP server` = 0 survives the widest reading and is stated as corpus-wide.

The Chinese summary was corrected in the same way (see FIX 6).

---

## FIX 5 — missing decision IDs

Three decisions the body depends on had no record. All three now have IDs, options, a recommendation, a consequence and a deadline, and are expanded in §J.

### 5.1 D-14 — the hypervisor / virtualisation platform *(new)*

**Before:** no ID at all. Depended on by §C.2 (*"hypervisor host-only networks"*), §D.3 (*"platform decided and installed"*), §F.2 week 1, §L.1 and `baseline` §13.2 PT-07; RACI'd in §G.2 as *"Platform / hypervisor decision"*; and **absent from G0's answered list**.

**After:** **D-14** added to §A with options (a) VMware Workstation/Player, (b) VirtualBox, (c) Hyper-V, (d) another; recommendation `[TO CONFIRM] in week 1`, with the hard requirements it must satisfy (per-zone host-only networks with DHCP disabled, 19 VMs / 42 vCPU / 78 GB RAM, thin provisioning, snapshots). §G.2's RACI row now reads `Platform / hypervisor decision (**D-14**)`, and **G0 now reads**:

```
| **G0 — Direction locked** | 1 | **D-14 (hypervisor/platform)**, D-01 to D-05, D-09, D-11, D-12 and
  **D-16 (Cisco device count)** answered; this outline signed off | Nothing else starts |
```

### 5.2 D-15 — the remote-access choice "pick one to build properly" *(new)*

**Before:** no ID. §D.1.3 left OpenVPN vs IKEv2/RRAS open, carrying a WSOS-citation trade-off (OpenVPN is *named* in the standard, IKEv2/RRAS is not), with a week-5 build slot and no owner.

**After:** **D-15** added, recommending **(a) OpenVPN** on standards-citation grounds; §D.1.3's table row now says *"that choice is decision D-15, and it must be recorded by end of week 5."*

### 5.3 D-16 — the Cisco device count reconciled *(new)*

**Before:** §C.1 said **5–8**, §D.2 said **5–6**, §C.4's primary topology implied **5**, and §D.2's estate sentence said 8–10 Linux / 6–8 Windows against the baseline's 10 / 9 — with no ratifying decision.

**After:** **D-16** added, settling **five devices as the CML target** (one HQ core pair, one WAN edge router, one branch router, one perimeter firewall), rising to **at most eight only if every one can be evidenced `REACHABLE` in §C.2b**, and **2–4** under the hybrid fallback. §C.4 gained a paragraph naming the three disagreeing figures and their resolution; §C.1's Cisco row and §D.2 now use the D-16 figures.

---

## FIX 6 — Chinese executive summary (§摘要)

### 6.1 C6 — the retired premise is gone

**Before**
> 「**誠實的可行性判斷**：在十二星期、四個人、以及（**很可能**）只有一台學生電腦的條件下，能做到的是…」

**After**
> 「**誠實的可行性判斷**：在十二星期、四個人的條件下，能做到的是…。**這個判斷的依據不是「只有一台學生電腦」——那個限制已經放寬，第 A 節與 D-02 已把它列為 CLOSED（學校／實驗室機器可以使用）——而是實驗室機器的實際規格仍然未知，而且這是阻塞性決定 B1…**」

The summary's feasibility conclusion no longer rests on a premise the English body retires, and the self-contradiction inside the paragraph is removed.

### 6.2 C9 — the fallback is no longer flattened

**Before**
> 「以 **DevNet Sandbox** 或**二手實體設備**作為後備，並**保留 Packet Tracer 只作拓樸設計與 CCNA 級示範**…」

**After**
> 「**後備方案要說清楚，不可含糊：正式的後備是「混合方案」——用 Packet Tracer 做設計，再加上少數幾部真正可被接觸的裝置（2–4 部實體設備，或作為補充的 DevNet Sandbox 實例）。`DevNet Sandbox` 或「二手實體設備」單獨使用，兩者都已被明確否決作為本專案的正式環境**：DevNet 的預約實例有時限而且會被重設…；二手設備單獨使用則買不到 ASA、而且舊版 IOS 沒有 RESTCONF。**兩者都只可作為補充，不可單獨作為後備，更不可單獨作為正式環境。**若學校規則只允許模擬器，則適用第 C.5 節的範圍縮減，並必須寫下來。」

A Chinese-only reader can no longer rationally pick DevNet alone.

### 6.3 C2 — the serving stack is now a decided default, not a casual example

**Before:** 「配合 Ollama 或 llama.cpp **之類的**推論服務」

**After:** 「**推論服務的建議是明確的（第 E.1.6 節）：預設用 Ollama 配一個 ~13B–14B 級、4-bit 量化、支援 tool calling 的模型；T0／T1（CPU-only 或 ~8 GB）改用 llama.cpp，並以 llama.cpp 作為 chat template 需要人手控制時的後備。**」

### 6.4 C7 — T4 restored to the tier enumeration

**Before:** 「一個按 VRAM 分層的模型選擇表（CPU-only / 8 GB / 12–16 GB / 24 GB+）」 — four tiers against a five-tier table.

**After:** 「**共五層：T0 完全沒有 GPU（CPU-only）／ T1 約 8 GB ／ T2 約 12–16 GB（建議目標）／ T3 24 GB+ ／ T4 多 GPU 或 48 GB+（不建議採用）**」

### 6.5 C10 — the week-1 blocking deadlines are restored

**Before:** 「**這些決定必須在第 3 週結束前作出**，否則 Cisco 層與 AI 層都會來不及。」

**After:** 「**截止時間必須逐項看清楚，不可一律當作第 3 週：阻塞項 B1（實驗室機器規格）與 B2（Cisco 平台拍板）必須在第 1 週結束前完成；D-01／D-02／D-03／D-04／D-08／D-11／D-12／D-14／D-16 亦在第 1 週結束前；D-05、D-06、D-13 在第 2 週結束前；B3（模型類別，須先量測）在第 3 週結束前；D-15（遠端存取）在第 5 週的建置時段內。B1 與 B2 是第 1 週的阻塞性關卡（gate G0），錯過了就不應該開始建置。**」

### 6.6 C3 — the AI plane is no longer weakened

**Before:** 「本項目的**核心交付物是先建好一個包含 Linux、Windows 與 Cisco 三類裝置的網絡**，然後**在這個網絡之上建立一個能管理該網絡的 AI 能力**」

**After:** 「本項目的**核心交付物是先建好一個包含 Linux、Windows 與 Cisco 三類裝置的網絡，然後在這個網絡之上建立一個能管理該網絡的 AI 能力——而這個 AI 管理層本身就是本專案被評分的差異化交付物（第 L.2 節、SQ-4）**…。**網絡是基礎，AI 管理層才是重點**，兩者缺一不可：第 B.3 節的完成條件中，C4、C5、C6、C7 四項全部屬於 AI 管理層。」

### 6.7 Repeated-clause form error removed

**Before:** 「**五個 MCP 伺服器**作為**主要的整合契約**。…**五個 MCP 伺服器**分別負責 Linux、Windows、Cisco、監控、以及清單／文件知識」 — the same five-word clause twice in one paragraph.

**After:** the second occurrence is now the single enumeration sentence and the first is the contract statement; the repeated enumeration is gone.

### 6.8 Chinese counts scope-corrected (C4-adjacent)

**Before:** 「（全份文件出現 87 次），而 **MCP 只出現 4 次、`MCP server` 出現 0 次**」

**After:** 「**按檔案範圍明確計算：`OpenClaw` 在八個章節檔案中出現 87 次（其中 AI 章節 24 次），加上設計基線的 40 次即全語料庫 127 次；而 `MCP` 在八個章節檔案中出現 24 次（其中 AI 章節 4 次），加上設計基線的 10 次即全語料庫 34 次，而片語 `MCP server` 在全語料庫中出現 0 次**」

### 6.9 Chinese C-C4 support: the corpus already leaned towards MCP

Added, because FIX 4 establishes it and it strengthens rather than weakens the argument:

> 「**這一點並非本綱要的新發明：語料庫本身在 AI 章節 §11.4 已把工具面寫成「MCP-compatible tool definitions」，設計基線 §11.5 亦已把 MCP 記為「PARTIAL — declared」，只是從未把它定為契約、也從未以 `MCP server` 作為設計單位。本綱要做的，是把語料庫已有的傾向變成明確的架構。**」

---

## FIX 7 — the small but visible errors

### 7.1 §A "Two decisions are already closed" → three

**Before:** `**Two decisions are already closed** by the student and are now project policy, not questions:`
**After:** `**Three decisions are already closed** by the student and are now project policy, not questions:`

(The table below it has three closed rows: compute, permission depth, offline/hybrid.)

### 7.2 "The five options" → six candidates

**Before:** `**The five options, assessed on the criteria that actually decide this.**`
**After:** `**The six candidates, assessed on the criteria that actually decide this.**`

§C.4's table has six scored candidates (a)–(f), and §L.3 and §J-D-01 both say six.

### 7.3 F3 — the T3/T4 inversion is explained

The tier table gained a **VRAM** column and a hardware-class note on each row (memory bandwidth class per tier), plus a new explanatory block:

> "**Why T4 is slower than T3 — the GPU-class axis the table above makes explicit, and which an earlier draft left unstated.** … 1. A 70B model at 3–4-bit still needs ~40–48 GB of weights, which forces … **model sharding across 2–4 consumer cards** … 2. **The comparison is like-for-like only if the bandwidth class is held constant.** … 3. **Does that make T4 pointless? No.** T4 is **superseded for this project** rather than bad …"

### 7.4 F4 — T0's VRAM figure and D-04's consequence both reconciled

**Before (T0 row):** `| **T0** | **CPU only**, 16–32 GB RAM | ~3B–8B | …`
**After:** the row now carries `**none — no discrete GPU; system RAM 16–32 GB is the only budget**`, and the reading note says T0 is the only row with no VRAM *by definition*, which makes D-04's mapping unambiguous.

**Before (D-04 consequence cell):** *"CPU-only forces a ~3B–8B class model, makes live demonstration impractical, and (honestly) shrinks the deliverable AI demo to 2–3 use cases."* — which conflated T0 with T1 and contradicted §E.1.2's own T1 row (*"Good for a scripted demo, acceptable interactively"*).

**After:** D-04's options now read *(a) none (CPU only) = T0; (b) ~8 GB = T1; (c) ~12–16 GB = T2; (d) 24 GB+ = T3*, and the consequence cell reads *"**(a)/T0 only:** … makes live interactive demonstration impractical … **(b)/T1 is materially better and must not be described as if it were (a):** ~8 GB VRAM is *"Good for a scripted demo, acceptable interactively"* — the live-demonstration loss is a T0 consequence alone."*

### 7.5 UC-4 inconsistency — the tier caveat now travels

**Before:** §E.7 said *"the recommendation (D-06) is UC-1, UC-3 and UC-4"*, and B.3 C6 was an unconditional completion condition, while §E.1.2/§E.1.3 said T0/T1 cannot safely run UC-4.

**After:** §E.7 carries a four-bullet caveat block — *"**UC-4 is tier-dependent and is not an unconditional commitment** … if the lab is T0, or the malformed-call rate is high, **UC-4 is dropped** and the committed set becomes **UC-1, UC-3 and UC-5** … and this narrowing is **disclosed in the report**"* — and **C6 now reads**:

```
| C6 | The agent completes the committed use cases from Section E.7 … **UC-4 is tier-dependent:** it is a
completion condition **only** where the measured tier (E.1.2) and malformed-call rate … support an
approval-gated change tool; **on T0, or on a T1 machine with a high malformed-call rate, C6 is met by the
reduced committed set UC-1, UC-3 and UC-5**… The reduction is a stated result, not a failure |
```

### 7.6 D-11 is closed rather than offered as open

**Before:** `| **D-11** | **Is Packet Tracer kept at all?** | (a) drop it; (b) keep for **design and topology only** | **(b) keep it…** | Dropping it loses a genuinely useful CCNA-fidelity artefact… | end of week 1 |`

**After:** the row heading is now `**Is Packet Tracer kept at all?** — **CLOSED (b) by construction**`, the recommendation cell begins **`(b) CLOSED`**, the deadline cell reads **`closed`**, and the consequence cell now explains *why* (a) is not really available: *"dropping Packet Tracer would delete Figure 1's design-time band, delete the CCNA-fidelity topology artefact the brief rewards, and make the D-01 fallback … impossible to describe."* §J's D-11 record says the same. **G0 still lists D-11 among the items to be confirmed — which is correct, because a gate asks for confirmation of the record, not for a fresh decision.**

### 7.7 §J now expands all of D-01 … D-16

**Before:** §J expanded **9 of 13** D-rows; **D-10 had no expansion anywhere**, and D-04/D-08/D-09/D-11 were covered only by a composite sentence ("Low-controversy, recorded so that silence is not mistaken for agreement…").

**After:** §J has individual records for **D-01, D-02, D-04, D-05, D-06, D-07, D-08, D-09, D-10, D-11, D-12, D-13, D-14, D-15, D-16**, plus the composite **B1 / D-03 / D-04** blocking block. **D-10 — which had no expansion anywhere in §J, surviving only as a name in the old composite heading — now has its own record.** The D-04 expansion is deliberately distinct from the B1/D-03/D-04 block: the block covers the hardware record, the D-04 record covers the tier mapping and the T0/T1 consequence split. The old composite sentence is replaced by a short note pointing to the individual records. **Every D-row in §A now has an expansion in §J** (D-02, D-07 and D-11 are closed records whose full text is already in §A, and each still has its own §J record).

### 7.8 CML's host is stated, and B1 captures it

**Before:** §C.4's primary recommendation named CML and its RAM cost but never said where CML runs; D-03's no-co-location rule implied a second machine; B1 asked about *"the lab machine"* singular; §B/§A's blocking table listed one machine.

**After:** §C.4 gained a paragraph — *"**Where CML runs, stated explicitly, because it decides whether D-03 can be honoured.** CML runs on the **CML host** — its own machine, recorded in **B1** alongside the model host … it must not be the 19-VM estate host, and it must not be the model host unless the machine's RAM covers the model **and** CML's nodes **and** its own operating system with margin … **B1 therefore captures two hosts, not one**"* — and B1's §A row now reads *"…**and the Cisco platform's host — see below**… The specification capture must therefore identify BOTH hosts…"*. §F.2 week 1 was updated to match.

---

## FIX 8 — word-count reconciliation

### The defect

§H.3 said the outline measured *"approximately **19,500 words** by a prose count that excludes fenced code blocks (~**18,650** Latin words plus ~**1,350** Chinese characters)"* with *"**22,394** whitespace-split words"* reported by the converter. The document named **no counting method**, so the two figures came from two different measures and both were understated. The auditor measured 1,352 CJK (a match), 21,583 Latin tokens outside fenced blocks and 24,943 whitespace tokens.

### The canonical method, now stated in §H.3

1. Render the Markdown to `.docx` with `proposal\tools\md2docx\convert.ps1` — **the `.docx` is the artefact and the unit of measurement**.
2. Extract visible text by **raw ZIP access** (`word/document.xml`, `w:t` content, runs concatenated within each paragraph, `<w:instrText>`/`<w:delText>` dropped). **Never the SDK by path, Word COM or Word.**
3. **`whitespace-split words`** = maximal non-whitespace runs in that text — *the identical measure `validate.ps1` prints as "extracted words (whitespace split)"*, so the document's figure and the validation report's figure are the same number from the same tool.
4. **`CJK characters`** = count of `[\u4E00-\u9FFF]` code points, per character.
5. Anything else (a Latin-only count, a "prose" count) is **derived and labelled as derived**.

### The corrected figures

| Measure | Before (claimed) | After (measured, canonical) |
|---|---|---|
| whitespace-split words | 22,394 | **28,299** |
| CJK characters | ~1,350 | **2,015** |
| "prose" total | ~19,500 | *derived only*: 26,284 Latin (non-CJK) whitespace words + 2,015 CJK |
| Markdown source, whitespace-split | not stated | 31,089 (reported for transparency; the `.docx` figure governs) |

**Honest conclusion, rewritten:** *"this document sits well above the recommended 6,000–10,000-word band — roughly **2.8×** the band's ceiling — and the earlier '~19,500 words / 22,394 whitespace words' understated it by around **31% and 21%** respectively."*

The `**This outline**` row in §H.3's target table was changed from *"**6,000–10,000 words** (it is at the upper end of that band)"* to *"(it is at **~2.8× the top of that band**)"* — the "2.4×" that a first pass wrote there reflected the intermediate 28,264-word render and was superseded by the delivered 28,299-word render.

> **Superseded-progress note.** The measurement was first written down as 28,264 (from an intermediate render) and the ratio as "~2.4×"; both were corrected to the delivered values, **28,299** and **~2.8×**. The `28,299` in §H.3 and the `28,299` that `validate.ps1` prints for the delivered `.docx` are the same number, from the same tool, on the same file. A negative-control probe in the stale-render check confirms that the superseded `~2.4×` string is **not** present in the delivered `.docx`.

---

## Gates and proof

All figures below are from the delivered build: `.md` 197,870 bytes / `5546CE59…D18F`; `.docx` **110,517 bytes / `B2FD9F7409BCC3A9F56DC013911566D4FE6A34806AA90984E25E79911E135BBD`**.

| Gate | Command | Result |
|---|---|---|
| **SDK validation** | `powershell -ExecutionPolicy Bypass -File .\sdk-validate.ps1 -Path …\FYP-Outline-DRAFT.docx` | **ERRORS: 0**, `openFailures=0 validationErrors=0 rawIssues=0`, `OPEN : OK`, exit 0. Opened from an in-memory `MemoryStream`, never by path. |
| **Package verification** | `powershell -ExecutionPolicy Bypass -File .\verify-package.ps1 -Path …\FYP-Outline-DRAFT.docx` | **PASS, all 9 checks passed**, exit 0 (content types 2 Default/11 Override/14 parts; `_rels/.rels` 4 unique; `document.xml.rels` 8 unique; 3 `r:id` all resolve; **68 tables** every `w:tblGrid` matching; 29 styles; 2 `numId`s; `w:body` 566 children with exactly one trailing `w:sectPr`) |
| **Coverage** | `powershell -ExecutionPolicy Bypass -File .\validate.ps1 …\FYP-Outline-DRAFT.docx -MarkdownPath …\FYP-Outline-DRAFT.md` | **`source content lines checked : 2,344` · `lines found verbatim : 2,344 (100.000%)` · `COVERAGE PROOF: every source content line is present in the document` · RESULT: PASS**, exit 0. **Did not drop** — the pre-fix baseline was 2,108 / 2,108 = 100.000%, so the checked set grew by 236 lines and completeness is unchanged at 100%. `TABLE INTEGRITY: all 68 table(s) rectangular (550 rows)`. |
| **Hash stability through validation** | SHA-256 before and after all three gates | `B2FD9F7409BCC3A9F56DC013911566D4FE6A34806AA90984E25E79911E135BBD`, 110,517 bytes — **identical before and after**. Validation did not mutate the artefact. |

### Stale-render check (closing audit finding (a))

The auditor could not compare the `.docx` text against the Markdown and could not rule out a stale render. That was closed here by extracting the new `.docx`'s text **by raw ZIP access** (Node `zlib` only — never the SDK by path, Word COM or Word) and probing it for the specific strings that changed, including negative controls for the old wording:

- **59 probes: 53 positive probes all present, 6 negative controls all absent.** The six negative controls are the superseded wording itself — `baseline §11.6 (L5 table)`, `8–10 Linux guests, 6–8 Windows guests`, `以及（很可能）只有一台學生電腦`, `**Two decisions are already closed**`, `five options, assessed` and `~2.4× the top of that band` — so the check proves both that the new text is in the render **and** that the old text is not.
- The extraction independently reproduced `validate.ps1`'s own counts on the same file (`whitespace tokens: 28,299`, `CJK ideographs: 2,015`), which is itself evidence that the text pulled from the package is the delivered body.
- Probe definitions are kept at `proposal\integration\backup-outline-audit-fix\probes.json` for re-run.

---

## An incidental converter finding (not a defect in the outline, and not fixed — the tool is read-only for this task)

While closing the coverage gate, the Markdown→OOXML converter was found to leave **literal `**`/`*` delimiters in the rendered document** for two emphasis shapes:

1. **`**bold *italic*.**`** — bold whose content ends with an italic span whose closing `*` is immediately followed by punctuation (`.`, `,`, `;`, `)`, `]`, `"`). The converter's `\*\*([^*]+)\*\*` rule cannot match across the inner `*`, and its italic rule `(?<!\*)\*([^*]+)\*(?!\*)` cannot match because the character after the closing `*` is punctuation rather than whitespace. The literal asterisks therefore reach the `.docx`.
2. A quoting-heavy variant in which a `*` is left adjacent to a following `*` after the first substitution, with the same result.

**This is a converter parser limitation, not a content loss** — the text is fully present, which is why the coverage proof stays at 100% when the constructs are avoided. It was worked around in the outline only: **six passages in the sections written by this fix run were reworded to a form the converter renders cleanly**, and the rewrite also removed a duplicated word that had been introduced in `D-15`. `convert.js`, `validate.ps1` and the other tools were **not** modified.

Before the workaround the same file measured **2,334 / 2,344 (99.573%)** with 10 lines reported `NOT FOUND`; after it, **2,344 / 2,344 (100.000%)**. The affected source lines were 54, 72, 288, 464, 468, 550, 726, 961, 963 and 1212.

---

## What was not changed

- **No restructure.** Section order, heading hierarchy, table shapes and the decision numbering were preserved; D-14/D-15/D-16 were appended to §A's table and §J's narrative in the same style.
- **No new claims.** Every added statement is either a correction of an existing claim, a restatement of a source fact already in the corpus, or a cross-reference.
- **No read-only file was touched.** `proposal\sections\*`, `proposal\i18n\*`, `proposal\research\*`, `proposal\integration\*` (other than this new log and the backup folder), `proposal\tools\*`, the eight `FYP-Proposal-*` deliverables, `AY2627_FYP topics_v2_Victor Li.docx` and `image.png` are all unmodified.
- **No `.docx` was ever opened by path, by the Open XML SDK by path, by Word COM or by Word.** Every read of a `.docx` in this run was raw ZIP + `XmlDocument`/regex.
- **Nothing was installed.**

---
---

# Revision 2 — the four ratified supervisor answers (SQ-1, SQ-2, SQ-4, SQ-5), plus the staged AI-coverage ramp

**Trigger:** the student ratified four of the five supervisor-level questions. Each answer is transcribed in `FYP-Outline-DRAFT.md` §A.1 and carried into the body, the decision table (§A), the expansions (§J) and the Chinese executive summary (§摘要). **SQ-3 remains open** — it asks for a supervisor's agreement, not the group's decision, and it is the only SQ row still marked open.

**Scope discipline:** unchanged from Revision 1. Only `FYP-Outline-DRAFT.md`, `FYP-Outline-DRAFT.docx`, backups of both under `proposal\integration\backup-outline-sq-ratify\`, and this log were written. No section file, i18n file, research file, tool, or `FYP-Proposal-*` deliverable was touched. No software installed. Every UTF-8 read used `[System.IO.File]::ReadAllText($p,[System.Text.Encoding]::UTF8)` or Node. **No `.docx` was opened by path, by the Open XML SDK by path, by Word COM or by Word** — every read was raw ZIP (`word/document.xml`, `w:t` content).

## 0. Artefact identity (Revision 2)

| | Before (Revision 1 delivery) | After (Revision 2 delivery) |
|---|---|---|
| `FYP-Outline-DRAFT.md` | 197,870 bytes · `5546CE59658376B831DCDAC7D97788A63D14D924E827A92FBF7794F5A9ADD18F` | **246,559 bytes** · `B172D5963BDB08BE848032E0006A8553E60835AB81EA1494DFFEF0DC19AB651F` |
| `FYP-Outline-DRAFT.docx` | 110,517 bytes · `B2FD9F7409BCC3A9F56DC013911566D4FE6A34806AA90984E25E79911E135BBD` | **132,049 bytes** · `38EE0EE9C6DCB5CE7078427EDC346D3DFB1B5A0CAD465122E31D7DC6828BFB0E` |

Backups (byte-identical to the pre-edit originals, verified by SHA-256 after copying):

- `proposal\integration\backup-outline-sq-ratify\FYP-Outline-DRAFT.md.bak` — 197,870 bytes · `5546CE59…D18F`
- `proposal\integration\backup-outline-sq-ratify\FYP-Outline-DRAFT.docx.bak` — 110,517 bytes · `B2FD9F74…5BBD`

## 1. ANSWER 1 — SQ-1: **RATIFIED, with a qualification** (full management as destination, introduced incrementally)

The answer is 「期望係完全管理，可逐步加入，非一步到位」.

| Change | Before | After |
|---|---|---|
| **SQ-1's row in §A.1** | *"**Genuinely manageable**, because otherwise the project's stated purpose … is undemonstrable for the Cisco family."* — a **recommendation** | **ANSWERED — RATIFIED**, with the answer transcribed and the qualification kept: the Cisco layer must become genuinely reachable and AI-manageable, **CML** is confirmed as primary, **Packet Tracer is confirmed as unable to be the AI-managed layer**, and the **§C.6 ramp** is named as the mechanism |
| **§A preamble** | *"**Three items are BLOCKING.** Nothing else starts until these three are answered"* with B1/B2/B3 | **Two blocks** are distinguished: **blocking now (B2 only)**, and **blocked at a scheduled gate (B1, D-04 — G2-H, end of week 6)**. A new paragraph records the four answered SQ items and what each changes |
| **A new section §C.6** | *did not exist* | **"The staged AI-coverage ramp — how management is introduced incrementally (SQ-1's answer, made operational)"**, inserted between §C.5 and §D |

### The new §C.6, in summary

A dependency chain stated as a diagram (**services up → AI manages Linux/Windows → AI manages Cisco → optional peer-side BGP**), then a **four-stage table** with columns **stage / what becomes AI-manageable / preconditions (entry gate) / the demonstration that proves it / evidence required / exit gate / weeks it can fall in**:

- **Stage A — the server estate.** §C.2b **RW-01 … RW-06** (all 19 VMs) and **RW-09**. Needs **no Cisco platform and no GPU**. Proved by the four server-side MCP servers answering real questions, with **UC-3 and UC-6 end to end**. Evidence: one filed transcript per `REACHABLE` row. Exit gate: every claimed row evidenced, not merely designed. Weeks **2–7**.
- **Stage B — the first genuinely reachable Cisco device.** **One** device of the kind RW-07 will hold; **RW-08 not required**. Proved by a read-only end-to-end run (`ssh`, `show version`, one `snmpwalk -v3`, one RESTCONF GET) with the agent reporting **through `MCP-S-CISCO` only**. Evidence: the exact `show version` string, the SNMPv3 output, syslog lines, the §C.2b transcript. Exit gate: all filed. Weeks **3–8** (the `show version` capture *is* G1 at week 3; the stage closes when the **AI** manages the device, ≥ week 8).
- **Stage C — the full Cisco target set.** The **five D-16 devices** in RW-07/RW-08. Proved by **UC-1 and UC-2 across all three families**. Evidence: **five transcripts, one per device**. Exit gate: count reconciled with D-16; `NR-01` Packet Tracer devices excluded by definition. Weeks **8–10** (closes at **G4**).
- **Stage D — OPTIONAL: peer-side eBGP verification.** Converts **NR-01a** into an RW-07 row via a second CML IOS-XE node as AS-65000 under D-01/D-12. **Explicitly not required in the 12 weeks**; taken up only after Stage C is evidenced. Weeks **8–11**.

Also added: **four numbered hard dependencies** (A→B→C→D, with the rule that the Cisco count may rise from one to five only as transcripts are filed and **never by design intent**); **a use-case-to-stage mapping table** (UC-3/UC-6/UC-5 → A; UC-1 → C, runnable narrowed at B; UC-2 → C; UC-4 → A **and** tier-gated); and the **minimum acceptable stage** paragraph below.

**Minimum acceptable stage: Stage B — stated and justified.** Stage A alone is coherent but the student's ratified answer requires the Cisco layer to become genuinely manageable, and only a device the AI layer actually manages demonstrates that; Stage B is the **first stage at which that is true** and is achievable with **one** device, **one** server and **no GPU** (the GPU decision was deferred to G2-H). **Stage B is therefore the floor, not the target; Stage C is the operational target; Stage D is a bonus.** If Stage B cannot be evidenced by week 8 — after G1's fall-through and §C.4's option sequence have both been exercised — **§C.5's scope reduction applies as a stated result, never as a silent slide from three families to two.**

### Cross-references added rather than duplication

- **§C.2b** gained a paragraph stating how the matrix is consumed by the ramp (the matrix is the register; §C.6 is the order its rows are brought under management), and that a row may not be advanced by design intent — only by a filed transcript.
- **§B.2** gained a paragraph stating the ramp is the operational form of its own "services first" rule.
- **§F.3** gained a **second Gantt band** drawing the ramp and the G2-H gate beneath the same week ruler.
- **§F.4** gained the SQ-2 dependency paragraph (below).
- **§L.2** and **§J-D-01** now point at §C.6 at their Cisco-platform rows; **§J-D-16** points at Stage C and reconciles Stage D's extra node against D-16.

## 2. ANSWER 2 — SQ-2: **DEFERRED, not refused** — B1/D-04 re-timed to G2-H (week 6)

The answer is 「未定，但應有硬件資源，需要待我返港才可安排」.

| Change | Before | After |
|---|---|---|
| **§A blocking table** | B1 listed as **BLOCKING**, "end of week 1" | Split into **"blocking now" (B2, B3)** and **"blocked at a scheduled gate"** — **B1 at G2-H, end of week 6**, with the reason recorded (the hardware answer does not exist yet) and the note that **the deferral changes the date, not the requirement** |
| **§A D-04 row** | plain row, deadline "end of week 1 (B1)" | Row heading now carries **"DEFERRED, NOT REFUSED"**; deadline now **"POSTPONED to G2-H, end of week 6"**; a note that **the T0–T4 tier table and the no-GPU fallback are unchanged and still correct — only the timing is re-labelled** |
| **§A.1 SQ-2 row** | "School/lab machines, specification captured in week 1 (B1)" | **ANSWERED — DEFERRED, NOT REFUSED**, with the four consequences listed (B1/D-04 move to G2-H; §E.1.1a added; tier table and no-GPU fallback kept; gate owner **S4**) |
| **§E.1.1** | heading **"BLOCKING ACTION — capture the lab machine's specification first"**; owner S4, **end of week 1** | heading **"The hardware decision is DEFERRED to a scheduled gate — and what that does not block"**; owner S4, **at G2-H, end of week 6**; the same field list retained verbatim |
| **A NEW §E.1.1a** | *did not exist* | **"The hardware-agnostic first phase — what proceeds with NO specification at all"** |
| **§F.1 gate table** | G0 … G6 | **A NEW ROW `G2-H — Hardware and model tier decided` (week 6, owner S4)** inserted after G2; **G3's row extended** to record that §C.6's **Stage B closes there at the earliest** |
| **§F.2 week 6** | *"Local-model spike closes; D-06/D-07 confirmed"* | now leads with **"G2-H: capture the lab machine's specification for both hosts and select the model tier (B1, B3, D-04)"**, milestone cell now *"**G2** MUST core complete; **G2-H** hardware and model tier decided"* |
| **§F.2 week 1** | *"name BOTH hosts in B1"* | now states the specification fields are captured **at G2-H (week 6), not now**, and adds the §E.1.1a work to the S4 cell |
| **§G.2 RACI** | — | **New row "Lab-machine specification and model tier (B1/D-04) — gate G2-H, week 6"** (S4 **A/R**), plus a new row for the §C.6 ramp |
| **§J B1/D-03/D-04 block** | heading *"(BLOCKING)"*; RECORDED ACTION "by the end of week 1" | heading now *"(blocked at the scheduled gate G2-H, end of week 6 — no longer blocking now)"*; RECORDED ACTION re-timed, with a **"What the deferral does NOT block"** row added; the old *"If the specification is unknown at week 3"* row became *"If the specification is still unknown at G2-H (week 6)"* |
| **§J D-04** | no status row | gained **"Status: DEFERRED, NOT REFUSED"** and **"What proceeds without this row"** rows; deadline moved to G2-H |
| **§K R17** | *"B1 is a blocking action item with a week-1 deadline"* | *"a blocking action item with a dated gate: **G2-H, end of week 6** — the date moved with SQ-2's deferral, and the requirement did not"* |
| **§M** | *"Items 1–4 are the three blocking items (B1, B2, B3)"* | *"**Only ONE item blocks work starting now — item 2, the Cisco platform ratification (B2)**"*; item 1 re-timed to G2-H; **a new item 2a** releases the hardware-agnostic work in week 1; item 9 (the model spike) is now tied to G2-H |

**The hardware-agnostic first phase (§E.1.1a), as written:** a table of what proceeds with **no** hardware decision — *(1) the whole network and services layer (§D.1–§D.3, weeks 1–6); (2) the five MCP servers, designed, built and tested (§E.3); (3) the agent scaffolding, approval gate, guardrails and audit log (§E.4–§E.5.1); (4) the evaluation harness — the 12-scenario set, the five injected faults, the ~20-probe tool-calling set, the hallucination check, the drift false-positive check, the audit-log coverage check (§E.7–§E.8); (5) the evidence and documentation scaffolding (§H.2)* — followed by the explicit statement that **only the model class (B3) and the serving configuration (§E.1.6) wait**, and by the argument for why the deferral is safe: §L.5 already puts the AI line's start at **week 7**, so a hardware answer owed at the **end of week 6** arrives **before the first thing that needs it**.

## 3. ANSWER 3 — SQ-4: **CONFIRMED YES** — the differentiator, and a definitive withdrawal

The answer is 「你可以用呢個方式理解」 to the compound question.

| Change | Before | After |
|---|---|---|
| **§A.1 SQ-4 row** | *"**Yes.** MCP + local model is the differentiator; the framing change is listed in Section L.4 as an explicit withdrawal"* — a recommendation | **ANSWERED — CONFIRMED YES**, with **both halves of the compound question** recorded as ratified: the AI/MCP layer **is** the assessed differentiator, **and** the old framing **is** withdrawn |
| **§L.4 W4** | *"**WITHDRAWN.** This framing is incompatible with the project's purpose"* | **"WITHDRAWN — DEFINITIVELY, AND AS A RATIFIED POSITION RATHER THAN A RECOMMENDATION."** Names the SQ-4 answer, states that **both halves are decided**, and adds an express prohibition: *"**No later writer may re-import this framing, restate it as a caveat, or hedge it as 'arguably' — it is superseded, and the change record must say so.**"* The replacement cell states **the AI / MCP line is THE ASSESSED DIFFERENTIATOR** and that the network is **the foundation it depends on**, and it records that the dominant AI risk has changed from *"the runtime may not exist"* to *"the model may not fit the hardware"* (**now a deferred decision with a dated gate**) and *"no device may be reachable"* |
| **§I.4 (standards alignment)** | ended with the "justified by, but beyond, the standard" framing | gained a closing block **"Where the differentiator sits relative to the standard, stated so the two claims cannot be confused (SQ-4, answered yes)"**, in **three parts that must appear together**: (i) the AI content is **outside** the standard (no AI content, no `MCP`); (ii) it is **justified by** the standard's own Domain 1 currency / research / embrace-change lines, quoted verbatim; (iii) it is **never claimed as WSOS compliance**. **No new claim about the standard is introduced and no existing citation or quotation is altered** |
| **§A preamble, §M item 2** | — | both now record that **SQ-1 has ratified the direction**, so what remains outstanding for B2 is the *platform record*, not the principle |

## 4. ANSWER 4 — SQ-5: **two submission tiers; the IMMEDIATE tier is the proposal ALONE**

**Note on the brief for this revision.** The task was initially framed as *"the proposal plus an initial report"*; the orchestrating agent then corrected it, because the student's answer is 「暫時只做 proposal」. **The corrected framing is what was implemented**: the initial report is **not** a current deliverable.

| Change | Before | After |
|---|---|---|
| **§A.1 SQ-5 row** | *"**Recommendation to confirm, not a unilateral decision:** a focus-corrected full proposal of 90,000–110,000 words …"* | **ANSWERED — TWO SUBMISSION TIERS, and the immediate one is the proposal alone**, with the answer transcribed: **(i) immediate = the proposal** (the current target, nothing else submitted now); **(ii) later = the full document at 90,000–110,000 words**. A **single sentence** records the initial report as a **likely future deliverable, not current scope**, with its structure **`[TO CONFIRM]` against the programme handbook** |
| **§H.1 deliverable list** | `D5` read **"Proposal / outline (this document and its successors) — 15–25 pages"** | `D5` now reads **"Proposal — this is the IMMEDIATE submission, and the only thing being submitted now"**, with the outline identified as its **working draft**; the numbering is unchanged (nothing inserted, nothing renumbered) |
| **§H.1 closing note** | *did not exist* | a paragraph restating the **two tiers** where a reader looks first, and stating that the initial report is **not** current scope |
| **§H.3 heading** | *"Submission size and shape — a recommendation to confirm (SQ-5)"* | **"Submission size and shape — the two submission tiers (SQ-5, ANSWERED)"** |
| **§H.3 content** | one table comparing the outline and the full proposal | a **two-tier table** (immediate: the proposal, 15–25 pages, programme word band `[TO CONFIRM]`; later: 90,000–110,000 words, hard ceiling 120,000) plus the **one-line future-deliverable record**, plus an explicit paragraph **comparing against the immediate tier's expectations rather than only the full book** (the figures are later-tier planning targets; this outline's overshoot is a property of the working artefact, not of the proposal being submitted) |
| **Front matter** | 10 rows | gained a **"Submission scope now (SQ-5)"** row stating the two tiers, that the outline is the proposal's working draft, and that the initial report is a future deliverable with structure `[TO CONFIRM]` |
| **§M item 13 (new)** | — | *"Write the proposal — the immediate submission tier — from the decision material, not by pruning this outline"*, with the later tier and the initial-report status restated |

**§H.3's measured figures were re-measured and the numbers are exactly consistent.** `whitespace-split words (canonical)` **35,384** — the same figure `validate.ps1` prints for the delivered `.docx`; `CJK characters` **3,136**; Latin (derived) **32,248**; Markdown source **38,357**. The revision moved the canonical figure from 28,299 to 35,384 (roughly **3.5×** the 6,000–10,000-word band's ceiling), and **the growth is attributed in the text to the three additions this revision made** rather than presented as drift. The self-reference is handled honestly: the note states that inserting this section's own table changes the document by roughly the length of the note, and the figure is reported as a measurement with its method rather than as a constant. *(The count and the number in §H.3 were reconciled by re-rendering after the number was written: the delivered render measures 35,384 and §H.3 says 35,384.)*

## 5. The Chinese executive summary (§摘要) — updated to match the English in strength and specificity

No Chinese paragraph was softened or left vaguer than its English counterpart. Specifically:

| Paragraph | Change |
|---|---|
| **Opening** | the **new second paragraph** records all four answers as decided rather than pending: SQ-1 answered and the direction ratified with the **incremental** qualification and the §C.6 ramp named; SQ-2 recorded as **延後而非否決** with the G2-H gate and the hardware-agnostic phase; SQ-4 **已答：是** with the differentiator confirmed and the withdrawal of the old framing; SQ-5 with the **two tiers and the proposal-only immediate scope** |
| **硬件方面** | rewritten: the student's answer is transcribed, **B1/D-04 的阻塞時間改為第 6 週的關卡 G2-H（不是第 1 週）**, the hardware-agnostic first phase is named, and it states that **the five tiers and the no-GPU fallback path are all retained — only the timing is re-labelled** |
| **Cisco 段** | rewritten: SQ-1's answer transcribed, the **four stages** described by name (Stage A/B/C and optional Stage D with the NR-01a reference), the **硬性依賴** stated, and **最低可接受階段是 Stage B** with the reason |
| **截止時間段** | corrected from *"B1 與 B2 是第 1 週的阻塞性關卡"* to **現在就阻塞的只有 B2**, with B1/B3/D-04 moved to **G2-H（第 6 週）** |
| **誠實的可行性判斷段** | no longer rests on *"實驗室機器的實際規格仍然未知，而且這是阻塞性決定 B1"*; now gives **two** concrete reasons (the deferred-but-dated hardware gate, and the 12-week/4-person budget), states that the network layer, MCP servers, agent/guardrails and evaluation tools **all proceed before the gate** while only the model class and serving configuration wait, and closes with the **proposal-only immediate scope** |

## 6. What was NOT done, deliberately

- **No restructure.** No section was reordered, renumbered or rewritten wholesale. §C.6 was **inserted** between §C.5 and §D; §E.1.1a **inside** §E.1; every other change is a targeted edit to an existing row, sentence or table cell. The heading hierarchy gained exactly **two** new H3 headings — §C.6 (line 367) and §E.1.1a (line 518) — so the counts moved **H1 1 / H2 15 / H3 71 / H4 12 → H1 1 / H2 15 / H3 73 / H4 12**, which is the **two new subsections and nothing else**. The delivered render's heading counts equal the Markdown's exactly (`validate.ps1` compares them and reports **H2 15 / H3 73** on both sides).
- **No new claim about the WorldSkills standard.** §I.4's additions restate the established facts: WSOS 2026 has **no AI content** and **does not name MCP**; the standard is **not** claimed to cover the AI layer; the innovation is argued **from** the brief and the standard's Domain 1 lines. The screen-capture requirement is still attributed to the **HDTN brief**, not the standard; the 2026 removal of Python/YANG/RESTCONF/NETCONF is untouched.
- **No citation, quotation or honesty statement was removed or weakened.** §L.4's withdrawal register is intact and W4 is **strengthened**; §C.2a/§C.2b's fabrication rules, the eBGP peer-side limitation (NR-01a) and the §C.5 scope reduction are all unchanged in substance.
- **No read-only file was touched** — `proposal\sections\*`, `proposal\i18n\*`, `proposal\research\*`, `proposal\integration\*` (other than this log and the new backup folder), `proposal\tools\*`, the six `FYP-Proposal-*` deliverables, `AY2627_FYP topics_v2_Victor Li.docx` and `image.png` are all unmodified. **No tool was modified.**
- **Nothing was installed.** All scratch work used `$env:TEMP`.

## 7. Gates and proof (Revision 2 delivery)

All figures below are from the delivered build: `.md` **246,559 bytes** / `B172D596…651F`; `.docx` **132,049 bytes** / `38EE0EE9C6DCB5CE7078427EDC346D3DFB1B5A0CAD465122E31D7DC6828BFB0E`.

| Gate | Command | Result |
|---|---|---|
| **SDK validation** | `powershell -ExecutionPolicy Bypass -File .\sdk-validate.ps1 -Path …\FYP-Outline-DRAFT.docx` | **ERRORS: 0**, `openFailures=0 validationErrors=0 rawIssues=0`, `OPEN : OK`, exit 0. Opened from an in-memory `MemoryStream`; **never opened by path** |
| **Package verification** | `powershell -ExecutionPolicy Bypass -File .\verify-package.ps1 -Path …\FYP-Outline-DRAFT.docx` | **PASS, all 9 checks passed**, exit 0 (content types 2 Default / 11 Override / 14 parts; `_rels/.rels` 4 unique; `document.xml.rels` 8 unique; 3 `r:id` all resolve; **73 tables** every `w:tblGrid` matching; 29 styles; 2 `numId`s; `w:body` 625 children with exactly one trailing `w:sectPr`) |
| **Coverage** | `powershell -ExecutionPolicy Bypass -File .\validate.ps1 …\FYP-Outline-DRAFT.docx -MarkdownPath …\FYP-Outline-DRAFT.md` | **`source content lines checked : 2,510` · `lines found verbatim : 2,510 (100.000%)` · `COVERAGE PROOF: every source content line is present in the document` · RESULT: PASS**, exit 0. **Did not drop** — Revision 1 delivered 2,344 / 2,344 = 100.000%, so the checked set grew by **166 lines** and completeness is unchanged at **100.000%**. `TABLE INTEGRITY: all 73 table(s) rectangular (581 rows)` |
| **Hash stability through validation** | SHA-256 before and after all three gates | `38EE0EE9C6DCB5CE7078427EDC346D3DFB1B5A0CAD465122E31D7DC6828BFB0E`, 132,049 bytes — **identical at every stage** (`132049 -> 132049 -> 132049 -> 132049`). **Validation did not mutate the artefact** |

### The converter's non-idempotence, recorded rather than treated as a defect

The converter is **not idempotent**: re-rendering the same Markdown produces a different byte length and a different SHA-256 (the package carries fresh timestamps). **Every size and hash above is therefore the delivered build's, and a later re-render of the same source will differ.** This is expected and is not evidence of a problem.

### Coverage repair during this revision (the one intermediate failure, and how it was closed)

The first render of the revised Markdown measured **2,507 / 2,510 = 99.880%**, with **three** lines reported `NOT FOUND` — **md lines 406, 1462 and 1491**. All three were **converter emphasis-parsing limitations of exactly the class already documented in Revision 1** (bold whose content ends with an italic span followed by punctuation; and a very long bold span), **not content loss** — the text was verified present in `word/document.xml`. **The three constructs were reworded to forms the converter renders cleanly, and no tool was modified**; the coverage gate then returned **2,510 / 2,510 = 100.000%**. The specific rewrites:

1. *"**The minimum acceptable stage, stated and justified: the project must reach Stage B.**"* → *"**The minimum acceptable stage is Stage B, stated and justified as follows.**"* (bold close no longer abuts a full stop).
2. §L.4 W4's status cell: a quotation-laden italic/bold mixture replaced by plain sentences (the quotation marks around the retired framing removed from inside the bold span).
3. §M item 2: *"**…ratified the *direction* — …**"* → *"**…ratified the direction** — …"*, removing the nested emphasis.

A **fourth** limitation was found and closed the same way: the long final bold span of §C.6's minimum-stage paragraph (*"**Stages A→D are therefore attempts in priority order, and if …**"*) did not survive the converter's bold parser, so it was split into three shorter spans with the long consequence clause left bold but separated.

### Content probes on the delivered `.docx` (raw ZIP + `w:t` extraction; no SDK-by-path, no Word)

A probe set was run against the delivered package's own text. **Positive probes present:** §C.6's heading and all four stage labels; the SQ-1 answer verbatim (「期望係完全管理，可逐步加入，非一步到位」); §E.1.1a's heading; the `G2-H — Hardware and model tier decided` gate; *"end of week 6"*; 「暫時只做 proposal」; the two submission tiers; the *"likely future deliverable, not current scope"* line; *"STILL OPEN — this is the one question only a supervisor can close"* (SQ-3); the §E.1.1a independence statement; the four `ANSWERED — …` statuses; the canonical count **35,384** and CJK **3,136**. **Negative controls absent:** *"BLOCKING ACTION — capture the lab machine's specification first"*, the superseded **28,299**, *"G2-H, end of week 1"*, *"B1 is a blocking action item with a week-1 deadline"*, *"Two decisions are already closed"*, *"Three items are BLOCKING"*, *"Five items are BLOCKING"* and *"proposal plus an initial report"*. The phrase *"the AI line is the weakest line"* occurs **three** times and **only** inside withdrawal records (§A's SQ-4 summary, §A.1's SQ-4 row, §L.4 W4's quoted statement) — never as a live framing.

### One pre-existing render artefact, not introduced by this revision

One paragraph still contains literal `*` characters in the render: §E.5.1's must-never list, where `` `*.key` `` is a **deliberate glob pattern inside a code span**. This was verified to be **present in the pre-edit backup** (`backup-outline-sq-ratify\FYP-Outline-DRAFT.md.bak` line 581) and is unchanged by this revision.

## 8. What was not verified

- **The `-Path`-free claim is verified by construction**: every `.docx` read in this revision used raw ZIP access (`System.IO.Compression.ZipFile` + XML text extraction, or Node `zlib`). **No call to `sdk-validate.ps1` used anything other than `-Path`, and no `.docx` was ever opened by path, by Word COM or by Word.**
- **`wordcom-test.ps1` was NOT run**, because it drives Word and Word must not be opened on these artefacts (and the brief forbids it). The render's Word-openability is therefore evidenced only by the **Open XML SDK validation (0 errors)** and the package check (9/9), not by an actual Word open or PDF export.
- **The section files, i18n files, research files and tools were not re-validated** — they were not touched, and no claim is made about their state.
- **The proposal itself was not written.** §M item 13 records that it is the next step; this revision only made the outline say so.

---
---

# Revision 3 — the internal-consistency reconciliation (ten defects from the independent Rev-2 verification)

**Trigger:** the independent verification at `proposal\integration\outline-rev2-verification.md` returned **ACCEPT WITH CAVEATS** and listed internal-consistency residues in the English body. The direction and the four ratified decisions were **not** in question and were **not** revisited; this revision fixes the ten defects in priority order and changes nothing else.

**Scope discipline:** only `FYP-Outline-DRAFT.md`, its render `FYP-Outline-DRAFT.docx`, backups of both under `proposal\integration\backup-outline-rev3\`, and this log were written. **No tool was modified** — `convert.js`, `convert.ps1`, `validate.ps1`, `verify-package.ps1` and `sdk-validate.ps1` are byte-identical to their Revision-2 state. **No restructure:** no section was reordered, renumbered or rewritten wholesale; every change is a targeted edit to an existing row, sentence, table cell or fenced block. No new claim was introduced beyond resolving the listed conflicts. Every UTF-8 read used `[System.IO.File]::ReadAllText($p,[System.Text.Encoding]::UTF8)` or Node. **No `.docx` was opened by path, by the Open XML SDK by path, by Word COM or by Word** — every read was raw ZIP (`word/document.xml`, `w:t` content). Nothing was installed; scratch work used `$env:TEMP`.

## 0. Artefact identity (Revision 3)

| | Before (Revision 2 delivery) | After (Revision 3 delivery) |
|---|---|---|
| `FYP-Outline-DRAFT.md` | 246,559 bytes · `B172D5963BDB08BE848032E0006A8553E60835AB81EA1494DFFEF0DC19AB651F` | **259,634 bytes** · `863DFC22971150F3CCAC5754036DB628B6CE5A9E2379B7A83BEF578205690B53` |
| `FYP-Outline-DRAFT.docx` | 132,049 bytes · `38EE0EE9C6DCB5CE7078427EDC346D3DFB1B5A0CAD465122E31D7DC6828BFB0E` | **137,715 bytes** · `4286241E38437F0613A4942A29A6F7DCBDAC1D966C7F905818A288320933E7A2` |

Backups (byte-identical to the pre-edit originals, verified by SHA-256 after copying):

- `proposal\integration\backup-outline-rev3\FYP-Outline-DRAFT.md.bak` — 246,559 bytes · `B172D596…651F`
- `proposal\integration\backup-outline-rev3\FYP-Outline-DRAFT.docx.bak` — 132,049 bytes · `38EE0EE9…FB0E`

## FIX 1 — the deferred hardware decision was half-applied: eight places treated the hardware specification as a CURRENT blocker

The decision itself (gate **G2-H**, end of week 6, owner **S4**; development must not block on it) was already correct in §E.1.1, §E.1.1a, §F.1, §F.2, §G.2, §J-B1/D-04, §M item 1 and the Chinese summary. **Eight English places still carried week-1/week-3 hardware timing.** All eight were reconciled to the deferred position:

| # | Place | Before | After |
|---|---|---|---|
| 1 | **§A preamble + blocking table** | *"**Only two items still block work starting now.**"* with **B2** and **B3** in the same table; the blocked-at-a-gate table held only B1 and D-04 | **B2 is the only row in the "Blocking now" table.** The preamble reads *"**Only ONE item still blocks work starting now — B2, and nothing else.**"* and the second table is now headed *"**Three further items are blocked, but at a scheduled gate rather than now**"*, carrying **B3**, B1 and D-04. The §A **SQ-2** bullet now names **B1, B3, D-04** as the deferred set, matching the Chinese |
| 2 | **§A D-10 row** | *"end of week 3"* | *"**G2-H, end of week 6** (the hardware record and tier — B1/D-04; the week-5–6 spike names the model); **confirmed at G3 (week 8)**"* |
| 3 | **§J-D-10 "By when"** | *"**provisional end of week 3**, confirmed at G3 week 8"* — which also contradicted its own "week-5–6 spike" row | *"**G2-H, end of week 6** (…the week-5–6 spike's measured malformed-call rate names the model); **confirmed at G3 (week 8)**. **There is no longer any "provisional end of week 3" date**"*. §J-D-10's **"Status against the schedule"** row was also corrected: it had said *"G3 (week 8) is the gate at which it is confirmed or reduced"*, which is not what G3 does; it now says the spike produces it and **its output is tied to G2-H by §M item 9**. **§F.1's G3 row** gained the sentence *"The model class chosen at G2-H (D-10, B3) is confirmed here by the same measurement"*, so G3's confirmed-list (D-06, D-07) and B3's gate now agree |
| 4 | **§F.1 G0** | required *"**D-01 to D-05**"* answered at week 1 — i.e. including the deferred **D-04** | the list is now **D-01, D-02, D-03, D-05, D-09, D-11, D-12, D-16**, with an explicit sentence: *"**D-04 is deliberately NOT in this list** — it is the deferred hardware row, and it is answered at **G2-H (week 6)**."* and a note that **D-03** is a design rule decidable now while the machine's identity and contents (**B1**) wait for G2-H |
| 5 | **§A D-03 row** | *"end of week 1 (with B1)"* — the *"(with B1)"* was stale once B1 moved to week 6 | *"end of week 1 — and this is decidable now, because option (a) needs no GPU or VRAM figure. What is deferred to G2-H is B1's capture of the two machines' identity and specification, not this rule"*. **D-03 stays in the week-1 set in both languages**, because it is the *role* rule and not a hardware fact; the Chinese line 37 was extended to say exactly that |
| 6 | **§K R20** | *"Ask in week 1 as part of B1"* | *"**Ask at the G2-H gate, as part of B1's record** — 'what the lab permits installing' and 'whether outbound network access is permitted and to where' are two of B1's own fields"* |
| 7 | **§K R18** | *"Establish the booking rules in week 1"* | *"The booking rules depend on which machine it is, and the machine's identity is **B1's record at G2-H (week 6)** — so they are established at that gate rather than in week 1."* The week-1 work is narrowed to the rule that needs no hardware answer: *"establish the rule that every evaluation run must be scripted and queueable in an available window"*. **The verifier's alternative (keep it and say why it needs no hardware) was rejected because the booking rules name a machine that is B1's own record** — but the part that genuinely does not depend on the specification was kept and marked as week 1 |
| 8 | **§L.3 item 3** | *"a **blocking action item to capture the lab specification**"* | *"a **scheduled action item to capture the lab specification at the G2-H gate (week 6), not now**"* |

**Whole-document sweep after the eight edits.** The document was then searched for any surviving statement that the hardware specification, the GPU or the model tier blocks work from starting now. Every hit and its resolution:

| Line (final) | Statement found | Resolution |
|---|---|---|
| 62 | *"Only ONE item still blocks work starting now — B2, and nothing else."* | **The target state, not a defect** |
| 66 | the single "Blocking now" row | **B2 only** |
| 72 | *"B3 — The model class … G2-H, end of week 6 … confirmed at G3 (week 8)"* | In the **blocked-at-a-gate** table |
| 73–74 | B1 and D-04 rows | In the **blocked-at-a-gate** table |
| 1498 | §M *"Only ONE item blocks work starting now — item 2, the Cisco platform ratification (B2)"* | Agrees with §A |
| 1501 | §M item 2 *"Ratify the Cisco platform — BLOCKING NOW (B2)"* | Agrees |
| 1186 | §J heading *"(blocked at the scheduled gate G2-H, end of week 6 — no longer blocking now)"* | Agrees |
| 1389 | §K R17 *"B1 is a blocking action item with a dated gate: G2-H, end of week 6"* | Agrees — "blocking action item **with a dated gate**", not "blocking now" |
| 1198, 1311 | §J-D-10 / §J-D-10 *"end of week 3"* survivals | Both are inside the explicit correction *"There is no longer any 'provisional end of week 3' date"* — **records of the removed date, not live claims** |
| 1280 | §J-D-04 *"(was 'end of week 1, as part of B1')"* | A **historical note of the old date**, correctly parenthesised |
| 492, 916, 924, 936 | *"week 1"* in §D.3, §F.3 and §C.4 referring to *platform/hypervisor* work and to the eBGP *decision* | Genuinely week-1 work that needs no hardware answer |

**End state: B2 is the only current blocker; B1, B3 and D-04 are closed at named gates — B1 and D-04 at G2-H (week 6), B3 named at G2-H and confirmed at G3 (week 8).**

## FIX 2 — the minimum acceptable stage could not satisfy the completion conditions

**Option (a) was chosen:** a **stage-based** reduction clause was added to §B.3 **C6**, symmetric with the tier-based clause it already had.

- **§B.3 C6** now opens with the committed set — *"**The committed set (D-06) is UC-1, UC-3, UC-4 and UC-6.**"* — and then states **two independent reductions**: **(i) stage-based** — *"where the project closes at Stage B — the minimum acceptable stage stated and justified at §C.6 — C6 is met by the reduced committed set **UC-3 and UC-6**, because Stage A's exit gate is exactly UC-3 and UC-6 running end to end, and neither depends on a Cisco device. A project that lands on the declared floor therefore satisfies this condition and does not fail it."* — and **(ii) tier-based**, the clause it already had (UC-4 dropped on T0/T1, reduced set **UC-1, UC-3, UC-5 and UC-6**).
- **§F.1 G4** gained the matching clause so the gate and the condition cannot diverge: *"where the project has reached Stage C. Where it closed at Stage B (the minimum acceptable stage, §C.6), the stage-based reduction in §B.3 C6 applies: G4 is met by UC-3 and UC-6…"*
- **§C.6's minimum-stage paragraph** now says the floor is **sufficient and not merely permitted**, and states the Stage-B outcome explicitly, while **keeping the SQ-1 justification intact** (it still says Stage A alone cannot satisfy SQ-1, that Stage B is the first stage at which a device is really AI-managed, and that Stage B is the floor, Stage C the target, Stage D a bonus).
- **Consistency of §C.6's own mapping table:** the clause is **type-correct** — UC-3 and UC-6 are the two rows the mapping table already puts at Stage **A**, which is a subset of any Stage-B delivery, so the reduced set introduces no new claim and requires no edit to the mapping table.

**Result: the minimum stage, the committed use cases, C6 and G4 now agree, and SQ-1's justification is unchanged.**

## FIX 3 — Stage D's weeks were impossible and contradicted §C.4/§J-D-01

**Both halves of the offered reconciliation were applied**, because they are different facts:

- **Stage D's weeks column** §C.6: *"Weeks 8–11"* → **"Weeks 10–12, and only if Stage C closed early."** with the reason written in: *"Its entry gate is 'Stage C is exited', and Stage C closes at **G4 (week 10)** — so **Stage D cannot begin before week 10**, and the window is the three weeks that remain."* (§C.6's closing paragraph was updated to the same weeks.)
- **The "week 1" statements in §C.4 and §J-D-01** were corrected to describe only the **decision**, not the build: *"**The week-1 requirement is on the decision — the licence and entitlement question — which is D-12's and needs no hardware, and it is not on the build; that is the distinction that resolves the apparent conflict.** The node itself is **built only after Stage C is evidenced** … Stage D therefore falls in **weeks 10–12** … **A week-1 decision and a week-10 build are not in tension.**"* §J-D-01 carries the same formulation.

**§C.4, §J-D-01 and §C.6 now agree**, and §F.3's second Gantt band was redrawn to match (see FIX 9).

## FIX 4 — Stage A's exit gate required a use case that was not committed

**UC-6 was added to D-06's committed set** (option "add UC-6 to D-06"), because Stage A's own demonstration — *"UC-3 (drift check) and UC-6 (estate Q&A) run end to end"* — is its evidence, and §B.3 C6 is written against the committed set: leaving UC-6 uncommitted would make a declared stage's exit gate require an uncommitted use case.

- **§A D-06 row:** *"Commit to **UC-1, UC-3, UC-4 and UC-6**; add UC-2 and UC-5 if week 10 allows"*, with the reason.
- **§J-D-06:** *"Commit to four, aim for six, and never promise all six."* with UC-6's non-optional status stated, and the by-when cell noting that C6 carries both reductions.
- **§E.7:** *"Commit to UC-1, UC-3, UC-4 and UC-6 — four of the six"*, with the reason; the T0 reduction list became **UC-1, UC-3, UC-5 and UC-6**.
- **§E.1.2 T0 row** and **§E.1.3 item 2** now list **UC-6** in their reduced sets, with UC-6 explicitly marked *never dropped* (it needs no Cisco device and no strong model).
- **§K R11** now says *"Commit to four, aim for six"* and points at C6's stated floor.

## FIX 5 — §B.3 C1 was stronger than what Stage B guarantees

**C1 was weakened to match what is committed**, and the guaranteed-versus-conditional split was made explicit in three places rather than one, so the rule cannot be re-inflated:

- **§B.3 C1:** *"Cisco devices **that expose working SSH and SNMPv3 unconditionally — these are the two interfaces §C.6's Stage B guarantees — plus RESTCONF where the image supports it. The third interface is conditional by design and is not required to pass C1**; the platform's own image decides it…"*
- **§C.1's Cisco row:** *"**SSH (22) for `show` commands** and **SNMPv3 (161/162) are the two guaranteed interfaces** — §C.6's Stage B and §B.3 C1 are both written on exactly these two. **RESTCONF (443) is conditional on the image**…"*
- **§C.6 Stage B's demonstration cell:** *"these three are the unconditional guarantee, and they are exactly what §B.3 C1 requires — plus one `restconf` GET returning JSON **where the image supports it**. **The RESTCONF step is conditional, not part of the guarantee** … a classic-IOS image that has no RESTCONF endpoint cannot fail C1 or this stage on that ground."*

## FIX 6 — the self-contradicting size statement

**§A.1's SQ-5 cell** said *"**This outline itself is sized to 6,000–10,000 words**"* while §H.3 measured it far above that band and explicitly called it *"a working reference artefact, not a banded deliverable"*. It now reads: *"**This outline is NOT sized to the 6,000–10,000-word outline band — it is a working reference artefact that sits well above it**, at **37,555 whitespace-split words by the canonical method stated at §H.3** … **the outline band applies to the proposal (D5, 15–25 pages), not to this document.**"* §H.3 remains the authority and its measured figures were re-measured for this revision.

## FIX 7 — the D-13 status conflict and the closed-rows mismatch

**D-13 was resolved to one status: OPEN.** The evidence pointed one way — §A's D-13 row carried an "end of week 2" deadline with no CLOSED marker, §J-D-13 had no status field, and §M item 6 still instructed the group to answer it — so the two places that called it closed were the outliers:

- **§A's preamble closed-list was rewritten.** It named the three closed rows as **D-02, D-07 and D-11** — *"the same three rows the C-table below marks CLOSED"* — and the table's third row became **D-11** (*"(b) — kept, strictly as a design-time tool … Closed by construction"*) in place of the old *"Offline model only, or hybrid"* row. **The preamble and the table now name the same three rows.**
- **A new paragraph states D-13's status explicitly:** *"**D-13 (offline-only or hybrid) is deliberately NOT in that list.** Its recommendation is firm … but the row itself is still **open with an "end of week 2" deadline** in the C-table below, §J-D-13 is written as a decision still to be taken, and §M item 6 still asks the group to answer it. **A recommendation is not a closed decision.**"*
- **§A's D-13 row** now carries **"— OPEN (this is one of the rows still to answer; see §M item 6)"**, and **§J-D-13 gained a Status row:** *"**OPEN — this row is not closed, and it is one of the items §M item 6 asks the group to answer.** It is deliberately absent from §A's list of the three CLOSED rows (D-02, D-07, D-11)."*

## FIX 8 — the immediate-tier proposal had no row in the schedule

A row was **added to §F.2, the weekly plan**, labelled **"2–3"** and placed immediately after week 1 and **before** every blocking gate:

- **S4's cell:** *"**WRITE THE PROPOSAL — the IMMEDIATE submission tier (D5, 15–25 pages).** Draft it **from the decision material, not by pruning this outline** (§H.3 option 1, §M item 13): §A's decisions and §A.1's four answers, §C.2a–§C.2b, §C.4–§C.6, §D's MUST core, §E.1–§E.8 and §H–§M's next steps."*
- **Gate/milestone cell:** *"**D5 — the immediate submission.** No blocking gate: placed after **G0** and clear of **G1/G2/G2-H**, so the schedule delivers the immediate tier before the build gates absorb the team."*
- **§M item 13** was updated to cross-reference it: *"**§F.2 now carries it as its own row (weeks 2–3), placed after G0 and clear of the G1/G2/G2-H gates**, so the schedule delivers the immediate submission rather than leaving it to this list alone."*

**Placement rationale:** the proposal needs no new decision of its own — G0 has locked what it reports — and it is deliberately kept out of weeks 3–6 so that neither **G1** (week 3) nor **G2/G2-H** (week 6) nor the deferred hardware path can delay it.

## FIX 9 — the §F.3 Gantt was misaligned

Both bands were **redrawn from a generator that derives the week columns from the ruler itself**, then verified character by character. Ruler geometry: `W1` at column 17, `W2` at 22, … `W12` at 72, each week a 5-character cell, the last cell ending at column 76.

| Defect (Rev 2) | Fix (Rev 3) |
|---|---|
| **Band 1**: `G1` drawn at column 46 (the W6/W7 cell) although G1 is week 3; `G2` at 56, `G3` at 61 | `G1` at column **27** (week 3), `G2` at **42** (week 6), `G3` at **52** (week 8) — verified equal to `17 + 5×(w−1)` for each |
| **Band 1**: bars drawn as detached `###` groups, not aligned to cells | every bar occupies whole 5-character cells starting at its week's column; verified per row |
| **Band 2**: `G1/G2/G3/G4` drawn in four *consecutive* cells regardless of their weeks | `G1` 27, `G2` 42, `G3` 52, `G4` **62** — each at its own week |
| **Band 2**: `G2-H` not aligned to G2's column | `G2-H` starts at column **42**, the same column as `G2` (both week 6) |
| **Band 2**: stage bars sat to the **right** of the gates they close at (`STAGE B` at cols 64/68 although it closes at G3 = week 8) | each stage bar now **ends immediately before the gate column**: `STAGE B` occupies weeks 6–7 and ends at column **51**, one column left of `G3` (52); `STAGE C` occupies weeks 8–9 and ends at **61**, one column left of `G4` (62) |
| **Band 2**: `STAGE D`'s ellipsis ran to column 78, past the W12 edge | `STAGE D` is drawn in weeks 10–11 and ends at column **71**, **inside** the W12 cell — nothing extends past column 76 |
| **Band 2**: `STAGE D` drawn as weeks 8–11 | drawn in **weeks 10–11**, matching §C.6's corrected window (weeks 10–12 after G4) |
| (pre-existing) `--- GATE ---` prefix columns | removed; the gate row is now pure marker positions, matching the ruler |

**One label needed a character-level change to make the alignment exact:** the first row's label `Platform+templates` is 18 characters, which pushed its bar into column 18 and off the W1 column by one. It was shortened to **`Platform build`** (17 characters) so the bar starts exactly at column 17 — the only text change made for alignment reasons, and it is a Gantt label, not a claim.

**Verification method (character-by-character, after editing):** for each row the bar's first and last character indices were computed and compared against `17 + 5(w−1)` for the intended start week and `17 + 5(w−1) + 4` for the intended end week. **All 16 band-1 rows and all 6 band-2 content rows matched; the gate markers matched at 27/42/52 (band 1) and 27/42/52/62 plus G2-H at 42 (band 2); no row exceeded column 76.**

## FIX 10 — the literal-accuracy nit about the H1 heading

**The claim as quoted by the verifier — that the document contains "no `# ` H1 heading" — does not exist anywhere in the Revision-2 Markdown, in the Revision-2 render, or in this log.** A full search of `FYP-Outline-DRAFT.md` for `H1`, `Heading 1`, `Heading1` and `# ` returned one unrelated hit (the word "heading" inside §J's D-08/D-09/D-11 note); the render contains no `H1` text either; and the log's own Revision-2 entry records `H1 1`, which is the opposite of the quoted claim. **So there was no false statement in the artefact to correct.**

**What was done instead:** a **new, literally exact statement of the heading facts** was added to §H.3's counting-method list (rule 6), so that the nuance the verifier identified is now recorded in the document and any future shorthand can be checked against it:

> *"**The heading claim, stated literally so that it cannot be read as saying something it does not.** This document **does contain one `# ` H1 heading** — line 1, `# Victor2 – Enterprise Network Infrastructure and Architect`, the document title. What is true … is narrower than that shorthand: **(i) there is exactly one H1 and it is the title — no body section of this outline uses H1** (the shallowest body heading is `## `, level 2); and **(ii) the converter renders that one title with the `TitlePageTitle` paragraph style rather than `Heading1`, so the delivered `.docx` contains no `Heading1`-styled paragraph at all**, while `validate.ps1`'s comparison still reconciles the two sides by subtracting the title-styled paragraph. **The count is therefore H1 1 / H2 15 / H3 73 / H4 12 in the Markdown, and the render's `TitlePageTitle` 1 / `Heading2` 15 / `Heading3` 73 / `Heading4` 12 matches it level for level.**"*

**Both halves were re-derived independently from the delivered render:** `dc:title` = `Victor2 – Enterprise Network Infrastructure and Architect`; style census `TitlePageTitle=1, Heading1=0, Heading2=15, Heading3=73, Heading4=12`; Markdown `H1 1 / H2 15 / H3 73 / H4 12`.

## Cross-cutting: the Chinese executive summary was re-checked and updated where the English changed

The English edits created **three** asymmetries, and the Chinese was corrected in the two places that carried them:

1. **B3's deferral.** Chinese line 33 named only *"B1 與 D-04"*. It now reads **"B1、B3（模型類別）與 D-04 的阻塞時間改為第 6 週的關卡 G2-H（不是第 1 週；B3 由 B1 與 D-04 推導出來，所以不能在硬件紀錄之前定案，之後在第 8 週的 G3 覆核）"**, which matches the English §A blocking set and §F.1 G2-H/G3 exactly.
2. **D-03's timing.** Chinese line 37 already listed D-03 in the week-1 group, matching the English after FIX 1.5, but the *reason* was absent on both sides. Both now state it: the Chinese gained **"至於 D-03（實驗室機器所扮演的角色），其規則「不要把模型與 19 部 VM 的資產主機放在一起」本身不需要任何 GPU 或 VRAM 數字即可拍板，所以仍然在第 1 週完成；真正延後到 G2-H 的，是 B1 對兩部機器身分與規格的紀錄。"**
3. **Line 37's deferred group** was extended with the same G3 cross-reference as the English.

**No Chinese claim is now absent from, weaker than, or stronger than the English**, and the Chinese already carried the parts the English was missing (`現在就阻塞的只有 B2`; the minimum stage **Stage B**; the deferral's 「延後而非否決」 framing). No other Chinese paragraph was touched.

## Gates and proof (Revision 3 delivery)

All figures below are from the delivered build: `.md` **259,634 bytes** / `863DFC22…0B53`; `.docx` **137,715 bytes** / `4286241E38437F0613A4942A29A6F7DCBDAC1D966C7F905818A288320933E7A2`.

| Gate | Command | Result |
|---|---|---|
| **SDK validation** | `powershell -NoProfile -ExecutionPolicy Bypass -File .\sdk-validate.ps1 -Path …\FYP-Outline-DRAFT.docx` | **`OPEN : OK`, `ERRORS: 0`**, `RAW : no duplicate relationship Ids, no duplicate content-type declarations`, `SUMMARY\|files=1 openFailures=0 validationErrors=0 rawIssues=0`, SDK 2.9.1.0, Office2013. Exit **0**. Opened from an in-memory `MemoryStream`; **never by path** |
| **Package verification** | `powershell -NoProfile -ExecutionPolicy Bypass -File .\verify-package.ps1 -Path …\FYP-Outline-DRAFT.docx` | **`RESULT\|…\|PASS\|all 9 checks passed`** — content types 2 Default / 11 Override / 14 parts; `_rels/.rels` 4 unique; `document.xml.rels` 8 unique; 3 `r:id` all resolve; **tables 73** with every `w:tblGrid` matching every row's `tc` count; 29 styles; 2 `numId`s; `w:body` **629** children with exactly one trailing `w:sectPr`. Exit **0** |
| **Coverage** | `powershell -NoProfile -ExecutionPolicy Bypass -File .\validate.ps1 …\FYP-Outline-DRAFT.docx -MarkdownPath …\FYP-Outline-DRAFT.md` | **`source content lines checked : 2,522` · `lines found verbatim : 2,522 (100.000%)` · `COVERAGE PROOF: every source content line is present in the document` · `RESULT: PASS`**, exit **0**. **Did not drop** — Revision 2 delivered 2,510 / 2,510 = 100.000%, so the checked set grew by **12 lines** and completeness is unchanged at **100.000%**. `TABLE INTEGRITY: all 73 table(s) rectangular (583 rows)`; heading counts Markdown `H1 1 / H2 15 / H3 73 / H4 12` versus render `0 / 15 / 73 / 12` (the single title H1 carrying `TitlePageTitle`) |
| **Hash stability through validation** | SHA-256 and byte length taken immediately before gate 1, between every gate, and after gate 3 | `4286241E38437F0613A4942A29A6F7DCBDAC1D966C7F905818A288320933E7A2`, 137,715 bytes — **identical at every step**. **Validation did not mutate the artefact** |

### The converter's non-idempotence, recorded rather than treated as a defect

The converter is **not idempotent**: re-rendering the same Markdown produces a different byte length and SHA-256 (fresh package timestamps). **Every size and hash above is the delivered build's, and a later re-render of the same source will differ.** Expected, and not evidence of a problem.

### Coverage repair during this revision (the one intermediate failure, and how it was closed)

The first render of the revised Markdown measured **2,517 / 2,522 = 99.802%**, with **five** lines reported `NOT FOUND` — **md lines 62, 72, 312, 409 and 870**. **All five were the converter's emphasis-parsing limitation already documented in Revisions 1 and 2** (a bold span whose content ends with a period, so the closing `**` abuts punctuation and the literal `**` survives), **not content loss** — the text was verified present in `word/document.xml`, and each failure was reproduced exactly with the validator's own regex chain before being touched. **The five constructs were reworded to forms the converter renders cleanly, and no tool was modified.** The specific rewrites:

1. §A *"…blocks work starting now — B2. Everything else … is now a *scheduled* gate**"* → *"…blocks work starting now — B2, and nothing else.** Everything … is now a **scheduled** gate"* (removed the period before the closing delimiter and the nested italic).
2. §A B3 row *"…and it is a *measurement*, not a choice made in advance**"* → *"…and it is a measurement rather than a choice made in advance**"*.
3. §C.4 *"…on the *decision* — … — and not on the build.**"* → *"…on the decision — … — which is D-12's and needs no hardware, and it is not on the build; that is the distinction that resolves the apparent conflict.**"*
4. §C.6 minimum-stage paragraph *"**The floor is a *sufficient* stage and not merely a permitted one: … applies.**"* → *"**The floor is a sufficient stage and not merely a permitted one:** … **So a project that lands on Stage B satisfies the definition of done; …**"* (split into two spans).
5. §F.1 G0 *"**D-03 is the lab machine's *role*, which is …** … the machine's *identity and contents* (**B1**)"* → *"**D-03 is the role the lab machine plays, and that is a design rule which can be fixed now** … the machine's identity and contents (**B1**)"* (nested emphasis removed).

**The generator for the Gantt is scratch work under `$env:TEMP` and is not part of the deliverable; no tool in `proposal\tools\*` was created or modified by this revision.**

## Content probes on the delivered `.docx` (raw ZIP + `w:t` extraction; no SDK-by-path, no Word)

A 32-item probe set was run against the delivered package's own text. **Every positive probe for all ten fixes is present**, including: *"Only ONE item still blocks work starting now"*; *"B3 — The model class (derived from B1, then measured)"* in the gate table; *"D-04 is deliberately NOT in this list"*; *"Ask at the G2-H gate, as part of B1's record"*; *"C6 is met by the reduced committed set UC-3 and UC-6"*; *"the stage-based reduction in §B.3 C6 applies"*; *"Weeks 10–12, and only if Stage C closed early"*; *"A week-1 decision and a week-10 build are not in tension"*; *"The committed set (D-06) is UC-1, UC-3, UC-4 and UC-6"*; *"that expose working SSH and SNMPv3 unconditionally"*; *"This outline is NOT sized to the 6,000–10,000-word outline band"*; *"The three are D-02, D-07 and D-11"*; *"OPEN — this row is not closed"*; *"WRITE THE PROPOSAL — the IMMEDIATE submission tier"*; the redrawn gate rows `G1…G2…G3` and `G1…G2…G3…G4` and `G2-H`; *"Every gate marker is drawn starting at its own week's column"*; *"This document does contain one `# ` H1 heading"*; and the re-measured **37,555** and **3,253**.

**Negative controls absent:** *"Only two items still block work starting now"*; *"D-01 to D-05"*; *"Offline model only, or hybrid"* (the old closed-list row); *"This outline itself is sized to 6,000"*; *"a blocking action item to capture the lab specification"*; *"Weeks 8–11"*; *"at least two of {SNMPv3, RESTCONF, NETCONF}"*; *"C6 is met by the reduced committed set UC-1, UC-3 and UC-5"*; *"Commit to three, aim for five"*; *"--- GATE ---"*; and the superseded **28,299**. **Two retained-but-intended survivals, verified in context:** *"provisional end of week 3"* occurs **once, inside the sentence that removes it** (*"There is no longer any 'provisional end of week 3' date"*), and *"35,384"* occurs **once, inside the history sentence** (*"the canonical figure moved from 35,384 to 37,555"*).

## H.3's measured figures were re-measured for this revision

Because this revision changed the document, §H.3's published figures were re-derived from the delivered render by the method §H.3 itself defines, and the count in the text was reconciled by re-rendering after the number was written:

| Measure | Revision 2 | **Revision 3** |
|---|---|---|
| whitespace-split words (canonical) | 35,384 | **37,555** |
| CJK characters | 3,136 | **3,253** |
| Latin (non-CJK) whitespace words (derived) | 32,248 | **34,302** |
| Markdown source, whitespace-split | 38,357 | **40,540** |

The canonical figure also agrees with `validate.ps1`'s own *"extracted words (whitespace split)"* on the delivered file (**37,555**), which is the cross-check §H.3 rule 3 promises.

## What was NOT done, deliberately

- **No restructure.** No section was reordered, renumbered or rewritten wholesale. §F.2 gained **one** row (the immediate-tier proposal) — the minimum change that puts the immediate submission in the schedule — and no other table changed shape. Heading counts are **unchanged** from Revision 2: `H1 1 / H2 15 / H3 73 / H4 12`.
- **No new claim.** Every added statement is a correction of an existing claim, a restatement of a fact already in the document, or a cross-reference. The one shortening (`Platform+templates` → `Platform build`) is a Gantt label changed solely to make the alignment exact.
- **No tool was modified.** `convert.js`, `convert.ps1`, `validate.ps1`, `verify-package.ps1`, `sdk-validate.ps1` and every other file under `proposal\tools\*` are untouched.
- **No read-only file was touched** — `proposal\sections\*`, `proposal\i18n\*`, `proposal\research\*`, `proposal\integration\*` (other than this log and the new `backup-outline-rev3` folder), all `FYP-Proposal-*` deliverables including `FYP-Proposal-SHORT.*`, `AY2627_FYP topics_v2_Victor Li.docx` and `image.png` are unmodified.
- **No `.docx` was opened by path, by the Open XML SDK by path, by Word COM or by Word.** Every `.docx` read was raw ZIP access (`System.IO.Compression.ZipFile` / Node `zlib` + `w:t` extraction); `sdk-validate.ps1` was always invoked with `-Path` and opens from an in-memory `MemoryStream`.
- **Nothing was installed.** All scratch work used `$env:TEMP`.

## What was not verified

- **Word-openability and visual fidelity of the `.docx`.** `wordcom-test.ps1` was **not** run, because it drives Word and these artefacts must not be opened with Word. The render is evidenced only by the Open XML SDK validation (0 errors), the 9/9 package check and the raw-ZIP text probes. **Layout, fonts, page breaks, table pagination and whether the ASCII Gantt blocks fall across a page boundary were not inspected.**
- **The ASCII Gantt's monospace appearance in Word.** Alignment was verified character-by-character in the Markdown source — which is the authority the verifier's complaint was about — but the code-block paragraph style's font was not confirmed to be fixed-pitch in the render, so the on-screen alignment in Word was not checked.
- **The Chinese summary's fluency as Chinese.** The two updated paragraphs were checked for factual symmetry with the English and for the same strength and specificity; they were **not** re-reviewed by a native speaker.
- **The other agent's `FYP-Proposal-SHORT.*`, the section files, the i18n files and the research files** — present, untouched, and not assessed.


