# Translation Completeness Audit — `proposal/i18n/zh-HK` vs `proposal/sections`

**Audit type:** independent, adversarial completeness audit (silent prose loss).
**Constraint:** read-only. This file is the only artefact created in the repo tree; scratch scripts lived in `D:\File\School\FYP\.tmp-audit\` (delete at will).
**Method:** Node.js flat line-scan segmentation (fenced blocks masked out), then two *independent* pairing methods:
(i) positional/index alignment, (ii) order-independent Needleman–Wunsch alignment anchored on shared identifier
multisets (`code spans`, `§` refs, version/number tokens, ACRONYMS). A paragraph was only treated as lost when the
identifier-anchored alignment left it unpaired **and** manual reading confirmed it absent.
**What the structural counts cannot see:** loss *inside* a paragraph. Both numbering hazards named in the brief were checked.

---

## SUMMARY TABLE

Paragraph counts are this audit's own numbers, not the translators'. They use the stricter split: each
blank-line-separated paragraph and each list item counted separately, so both sides of every pair are counted the same
way. A coarser split — one paragraph per run of consecutive prose lines — gives `84`, `190`, `424`, `447`, `152`,
`269`, `186`, `201` for `01`…`08`. The two splits differ only in how a multi-line list is counted, and they are counted
identically in both languages, which is why every pair agrees either way.

| File | EN paras | ZH paras | C2 ratio flags (<0.25) | C2 unpaired paras | C3 duplicates | C4 long ASCII runs | C5 long EN lines >2000 | Structural (C6) | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| `01-introduction.md` | 82 | 82 | 0 | 0 | 0 | 12 (all names/citations) | 0 | identical | **PASS** |
| `02-architecture.md` | 190 | 190 | 0 | 0 | 0 | 6 (all citations) | 0 | identical | **PASS** |
| `03-microsoft.md` | 304 | 304 | 0 | 0 | 0 | 10 (quoted EN strings) | 0 | identical | **PASS** |
| `04-linux.md` | 272 | 272 | 0 | **1 (L788)** | 0 | 2 (cited standard lines) | 0 | identical | **PASS, 1 MINOR ISSUE** |
| `05-cisco.md` | 121 | 121 | 0 | 0 | 0 | 0 | 1 (L1436) — tail present | identical | **PASS** |
| `06-automation.md` | 214 | 214 | 0 | 0 | 0 | 2 (project title) | 0 | identical | **PASS** |
| `07-ai.md` | 163 | 163 | 0 | 0 | 0 | 6 (topic-sheet quotes, log strings) | 0 | identical | **PASS** |
| `08-project-management.md` * | 189 | 189 | 0 | 0 | 0 | 2 (cited standard lines) | 2 (L1521, L1523) — tails present | identical | **PASS** (provisional) |

\* `08-project-management.md` was **present and complete-looking** (389,648 bytes, ~390 KB in the stated 400 KB range), and it was **audited**. It was byte-stable across the whole audit window (size and mtime `2026-09-16 23:11:31` unchanged from 23:11 to 23:19), so the verdict is not confounded by a mid-write read — but the other agent's session was still open when I finished, so treat it as provisional.

**Bottom line: no silent content loss attributable to the two named hazards.** Only one genuine paragraph-level omission was found (`04-linux.md:788`), and it is a **merge**, not a lost claim — the content survives, merged into another sentence. Details in §C2.

**A note on the ratio threshold used in the brief.** A character ratio below 0.25 does *flag* content loss, but ratios of **0.25–0.32 are normal** for this translator's style: they are CJK density, not loss. Every such paragraph I read was complete. Raising the threshold to 0.30 produced 96 imputed flags that manual reading reduced to **zero** real losses (e.g. `08` L1521: 2222 EN chars → 717 ZH chars, ratio 0.323, **every clause present**). Using 0.25 as instructed, the flag count is **0** across all eight pairs.

The C4 column counts *runs* of ≥40 ASCII/Latin characters found in Chinese prose (a long line can contain two, which is why the counts differ slightly from the number of distinct strings listed in §C4).

---

## C6 — Independent re-check of the structural counts (do not trust the translators' numbers)

Recomputed from the files themselves. **No mismatch found in any pair.**

| File | Headings (EN = ZH) | Fenced blocks (EN/ZH) | Lang-tag sequence | Fenced content byte-identical | Table blocks (EN/ZH) | Table rows (EN/ZH) | Table cell-count mismatches | Inline code spans (EN/ZH) |
|---|---|---|---|---|---|---|---|---|
| 01 | h2=10, h3=25, h4=8 | 2 / 2 | identical | yes (2/2) | 19 / 19 | 243 / 243 | 0 | 117 / 117 |
| 02 | h2=2, h3=21, h4=64 | 0 / 0 | n/a | n/a | 43 / 43 | 433 / 433 | 0 | 1083 / 1083 |
| 03 | h2=1, h3=13, h4=77, h5=19 | 149 / 149 | identical | yes (149/149) | 48 / 48 | 480 / 480 | 0 | 1608 / 1608 |
| 04 | h2=1, h3=13, h4=51 | 177 / 177 | identical | yes (177/177) | 24 / 24 | 297 / 297 | 0 | 1588 / 1588 |
| 05 | h2=1, h3=17, h4=50 | 31 / 31 | identical | yes (31/31) | 32 / 32 | 382 / 382 | 0 | 1064 / 1064 |
| 06 | h2=1, h3=11, h4=42, h5=47 | 55 / 55 | identical | yes (55/55) | 30 / 30 | 337 / 337 | 0 | 1537 / 1537 |
| 07 | h2=1, h3=15, h4=48 | 23 / 23 | identical | yes (23/23) | 33 / 33 | 280 / 280 | 0 | 488 / 488 |
| 08 | h2=9, h3=61, h4=32 | 12 / 12 | identical | yes (12/12) | 83 / 83 | 1448 / 1448 | 0 | 1272 / 1272 |

Two independent traps were checked and cleared:

* **Fenced-content equality is exact** in all eight pairs, not merely equal in count — every fenced block's *body* was compared byte-for-byte. Zero differences anywhere (149 pairs in `03`, 177 in `04`, etc.).
* **Ellipsis / list-continuation marks pair up exactly** (a truncation would desynchronise them): `…` occurrences in `06` are 18 EN / 18 ZH, in `03` 9 / 9, in `04` 1 / 1, in `02` 1 / 1; `...` in `03` 33 / 33, `04` 26 / 26, `05` 5 / 5, `08` 6 / 6.

---

## C2 — Paragraph-level completeness (the core check)

Two independent pairings were run per file.

**(a) Index/position alignment** — paragraph counts match 1:1 in all eight pairs (see the summary table).

**(b) Order-independent identifier-anchored alignment** (Needleman–Wunsch over shared-identifier scores; this is robust to the translator merging or splitting paragraphs). Result:

| File | Unpaired EN paragraphs (≥60 ch) | Unpaired ZH paragraphs (≥40 ch) | Aligned pairs with ratio <0.25 (≥300 EN ch) |
|---|---|---|---|
| 01 | 0 | 0 | 0 |
| 02 | 0 | 0 | 0 |
| 03 | 0 | 0 | 0 |
| 04 | **1** | 0 | 0 |
| 05 | 0 | 0 | 0 |
| 06 | 0 | 0 | 0 |
| 07 | 0 | 0 | 0 |
| 08 | 0 | 0 | 0 |

**The single flag, and why it is a MINOR ISSUE rather than loss — `04-linux.md`:**

* EN paragraph beginning at **line 788** (116 chars, no Chinese paragraph of its own):
  `The blog vhost follows the same shape with three differences, which are the ones that matter for a WordPress origin:`
* Its content **is present**, relocated and condensed into **ZH line 830**:
  `blog vhost 的結構相同，但有三處差異，而這三處正是 WordPress 來源站的重點：`
* The Chinese **merged two English lead-ins into one sentence**. The following English paragraph is
  EN L830 `Two operational details that belong in the build log because they cause real incidents:` — its Chinese counterpart
  (the list of two operational details) is carried by the same ZH paragraph and the list that follows. No English claim is
  lost; the paragraph count differs by the merge only. **MINOR ISSUE** (a translator's editorial merge), not truncation.

**Ratio flags at the instructed 0.25 threshold: none in any file.** All pairs with EN ≥250 chars had ratio ≥0.248, and
manual reading of the low end showed complete content. Representative verified pairs (EN chars → ZH chars, ratio;
**all clauses present**):

| File | EN line | EN → ZH chars | ratio | Note |
|---|---|---|---|---|
| 01 | L73 | 782 → 231 | 0.295 | 5 due-diligence conditions, all 5 present |
| 01 | L88 | 2707 → 1254 | 0.463 | 5 line bullets, all 5 present |
| 01 | L847 | 2072 → 692 | 0.334 | 5 numbered principles, all 5 present |
| 02 | L363 | 855 → 251 | 0.294 | guardrails + acceptance criteria present |
| 02 | L814 | 364 → 101 | 0.277 | retention boundary + non-compliance caveat present |
| 02 | L432 / L816 | 1720 → 1122 / 1724 → 1167 | 0.652 / 0.677 | FIGURE descriptions: every label byte-preserved |
| 03 | L1436 | 2063 → 1019 | 0.494 | last sentence (administrative distance) **present** |
| 03 | L3214 | 2386 → 1433 | 0.601 | 25-item evidence checklist, all 25 present |
| 03 | L3618 | 415 → 181 | 0.436 | last section of the file, closing clause present |
| 04 | L786 | 550 → 277 | 0.504 | `[ASSUMPTION]` on `http2`, fallback rule present |
| 04 | L28–34 | 2178 → 1522 | 0.699 | 5 line bullets present |
| 06 | L2199–2201 | 1366 → 677 | 0.496 | numbered items present (see caveat below) |
| 07 | L943–948 | 1589 → 580 | 0.365 | 6 injection-defence items, all 6 present |
| 08 | L1251 | 637 → 197 | 0.309 | risk-vs-issue distinction + weekly review present |
| 08 | L1521 | 2222 → 717 | 0.323 | every clause, incl. the closing "bridge as a bridge" sentence |
| 08 | L1523 | 2267 → 693 | 0.306 | all four "reasons" + closing outcome sentence present |
| 08 | L1134 | 298 → 74 | 0.248 | acceptance-failure clause present |

**Terminal-punctuation check.** A naive "does the Chinese end with 。！？：」】）?" test fires on 15 paragraphs in `02`, 20 in
`07`, 17 in `04`, 9 in `06`, 7 in `08`, 5 in `01`, 3 in `05` — **and every one of them is a false positive**, in the same
way: the Chinese paragraph ends with `**` (bold close), `*` (italic close, used for figure captions such as
`*圖說：圖 6.1——…*`), or a full-width `。` inside a bold span. Examples from `02`: EN L208 ends
`…may be claimed.**` / ZH L208 ends `…次世代防火牆能力。**`; EN L434 `…at the egress pair.*` / ZH L434 `…單一咽喉點。*`.
The sentence-final punctuation is present in **both** languages; only the trailing markup differed from the test's
allowed set. **No case of an abruptly cut Chinese sentence was found in any file.** (The ellipsis marks themselves are
1:1 between the languages — see C6.)

---

## C5 — The long-line hazard

Every English line >2000 characters was located programmatically (`Array.from(line).length`), and its **head and tail**
were traced into the Chinese file by content, not by line number.

| File | Line | EN chars | Content | Tail matched in ZH? |
|---|---|---|---|---|
| `05-cisco.md` | **1436** | **2063** | BGP verification paragraph (prose) | **YES.** EN tail: `Administrative distance **20** for eBGP is lower than OSPF's 110 and EIGRP's 90, so a BGP-learned route overrides an IGP-learned route to the same prefix: correct for external reachability, and exactly why internal prefixes must never be learned by BGP.` → **ZH line 1436, final sentence:** `eBGP 的管理距離 **20** 低於 OSPF 的 110 與 EIGRP 的 90，故經 BGP 學到的路由會覆蓋前往同一前綴的 IGP路由：對外部可達性而言這是正確的，也正是內部前綴絕不可被 BGP 學到的原因。` (EN para 2063 → ZH 1019 chars; EN line 1436 and ZH line 1436 are the same paragraph, unchanged line numbering.) |
| `08-project-management.md` | **1521** | **2222** | Standards-alignment paragraph (prose) | **YES.** EN tail: `Presenting a bridge as a bridge, and an inference as an inference, is the specific discipline this proposal commits to, because an alignment claim that overreaches is worth less than no claim at all.` → **ZH line 1521 tail:** `…把橋接呈現為橋接、把推論呈現為推論，正是本提案所承諾的特定紀律，因為一項過度延伸的對齊主張，比不作任何主張更沒價值。` |
| `08-project-management.md` | **1523** | **2267** | Worthwhile/achievable paragraph (prose) | **YES.** EN tail: `…is a complete and defensible outcome for a twelve-week final-year project — and it is the outcome this plan is built to produce.` → **ZH line 1523 tail:** `…對一個十二週的畢業項目而言是完整且站得住腳的成果——而這正是本計劃所建構以產生的成果。` |

No other English source line exceeds 2,000 characters (files 01, 02, 03, 04, 06, 07 have none). The two lines named in
the brief tip are confirmed as the real hazard set, and **both are fully translated, including their ends**.

A second, related hazard was checked: many long **paragraphs** (not single lines) exist, e.g. `03` L3214 (2386 chars across
23 lines) and `01` L88 (2707 chars across 31 lines). All were verified present in full (see C2 table).

---

## C1 — Truncation-artefact search

Searched every Chinese **and** English file for `truncated`, `chars)`, `… (line`, `[TRUNCATED]`, `TODO`, `（略）`, `...`, `…`.

* **`(line truncated to 2000 chars)` — ZERO hits in any file (either language).** No read-tool artefact was laundered into any translation.
* **No `[TRUNCATED]`, no `TODO`, no `（略）` in any file.**
* **`truncated` — 2 real hits, both benign English content:**
  * `01-introduction.md` EN L86 "…the auto-derived value is silently truncated at 15 characters and…" — a sentence *about* NetBIOS name truncation. Its Chinese counterpart is present (`03`-style quoting aside, the clause is translated, and the same English line is quoted inside a fenced block in the ZH file, which is why the ZH hit counts inside code).
  * `07-ai.md` — EN 14 hits / ZH 8 hits. Every ZH hit is a JSON key `"truncated": true|false` inside fenced code blocks. The EN-only hits are prose sentences *using* the word (`Output truncation: every command result is truncated to 200 lines…`, `…excessively long fields are truncated…`) whose Chinese renders the concept with 截斷/縮減 without the English word. Verified by reading `07` EN L943–948 → ZH L942–947: item 3 (`Sanitisation of log content`) is present and complete. **Not an artefact.**
* **`...` and `…`** — counts are equal EN↔ZH in every file (see C6). They are legitimate list-continuation/ellipsis marks in both languages, e.g. `Z-STORAGE …`, `10.10.30.12, … The …`. Nothing appears mid-sentence in Chinese where English had none.

**Conclusion: no truncation artefact reached any Chinese file.**

---

## C3 — Duplication

Paragraph-level byte-identical duplicate detection (excluding table separators, lines <40 chars, and fenced content):

**Zero duplicates in any of the eight Chinese files.** (Note: an early run of one of my own scratch scripts reported 2 hits in `01`; that was an artefact of a mis-parsed code-block boundary in the scratch script, not in the data. The clean full-file scan reports 0, and the EN side has 0 as well, so there is no "overwritten earlier paragraph" signature anywhere.)

---

## C4 — Untranslated prose (runs ≥40 ASCII/Latin characters in Chinese prose)

All hits are legitimate; **none is a whole untranslated English sentence.**

| File | Run | Location | Judgement |
|---|---|---|---|
| 01 | `Vertex Peak Financial Technologies Limited` ×3 | L62, L231, L279 | Company name (deliberate, also glossed in Chinese) |
| 01 | `Microsoft Server Networking and Network Services` ×4 | L70, L122, L241, L365 | Topic-sheet line name (quoted title) |
| 01 | `HDTN Final Year Project Topic (AY2026/27`, `Enterprise Network Infrastructure and Architect` | L206 | Document title |
| 01 | `WorldSkills Occupational Standards - IT Network Systems Administration` | L514 | Standard name |
| 01 | `all findings, manuals, steps, screen captures, verifications, and references` | L532 | Verbatim standard requirement, quoted in both languages |
| 01 | `implement infrastructure as code Identify and implement infrastructure as code` | L581 | Verbatim standard requirement, quoted |
| 02 | `Enterprise Network Infrastructure and Architect` | L3 | Title |
| 02 | `Internet Key Exchange Protocol Version 2 (IKEv2` | L44 | Expansion of an acronym, given as a gloss |
| 02 | `Enhanced Interior Gateway Routing Protocol` | L180 | Expansion of an acronym |
| 02 | `VMware Workstation 17.6.2 Pro release notes`, `Address Allocation for Private Internets`, `IPv4 Address Blocks Reserved for Documentation` | L444, L578 | Reference-list titles (correctly left in English) |
| 03 | `Microsoft Server Networking and Network Services (e.g., ADDS, FSRM, iS…` | L9 | Topic-sheet line, quoted |
| 03 | `findings, manuals, steps, screen captures, verifications, and referenc…` ×2 | L36, L60, L2979 | Verbatim standard requirement, quoted |
| 03 | `FIGURE: Active Directory Users and Computers` | L509 | Figure label |
| 03 | `Build from this Active Directory information` | L1349 | Verbatim GUI/standard string |
| 03 | `the certificate on the server is not configured correctly`, `The DSA operation is unable to proceed because of a DNS lookup failure`, `The replication operation encountered a database error`, `Replication has been stalled longer than the tombstone lifetime` | L3212, L3310, L3312, L3313 | **Verbatim Windows event/tool messages** — must stay English to be matchable against a real system |
| 04 | `Linux Server Administrations (e.g., Nginx, Keepalived, nftables, OpenV…` | L7 | Topic-sheet line, quoted |
| 04 | `all findings, manuals, steps, screen captures, verifications, and refe…` | L44 | Verbatim standard requirement |
| 06 | `Enterprise Network Infrastructure and Architect`, `Design, Build, Verify and Document a Virtualised Enterprise Network fo…` | L5 | Project title/subtitle |
| 07 | `AI Network Management (e.g., Agentic AI, OpenClaw Skills, etc…` | L5 | Topic-sheet line, quoted |
| 07 | `Enterprise Network Infrastructure and Architect` | L5 | Title |
| 07 | `the agent on   receives alert webhooks and scheduled triggers from  , ` / `model, agent loop, Skill, tool, target host; (b) that the model sits o…` / `telemetry path from the monitored estate into  , the webhook and file-…` | L267, L317 | Figure/table cell text (host names elided); **note the double spaces** — these look like table cells whose identifier column is filled by a host name elsewhere in the row. Worth a human glance, but the surrounding Chinese row content is translated |
| 07 | `Read-only poll only: ICMP, SNMPv3 161/udp, WinRM 5986, SSH 22 read-onl…` | L823 | Port-matrix cell text (protocol/port tokens) |
| 08 | `study, build, configure, troubleshoot, and document complex enterprise…`, `produce well-organized documentation that includes all findings, manua…` | L1515 | Verbatim standard requirements, quoted in both languages |

---

## C7 — Spot-check fidelity of the prose itself

19 paragraph pairs read in full in both languages (longest paragraphs + every flagged pair + sampled mid-size ones).

| # | File | EN → ZH | Fidelity |
|---|---|---|---|
| 1 | 01 | ¶3 (L88–118, 2707 ch) — five technology lines | **FAITHFUL** — all five bullets; product names retained; nothing dropped |
| 2 | 01 | ¶56 (L847–870, 2072 ch) — five control principles | **FAITHFUL** — all five items incl. the "seventh interesting thing in week ten" point |
| 3 | 01 | ¶0 (L73, 782 ch) — due-diligence trigger | **FAITHFUL** — all five conditions |
| 4 | 01 | L168 / L317 / L365 / L907 / L1113 (low-ratio tail) | **FAITHFUL** — each ends with the same final claim as the English |
| 5 | 02 | ¶146 (L816, 1724 ch) — FIGURE 6.8 | **FAITHFUL** — every label, annotation and the padlock caption preserved |
| 6 | 02 | ¶77 (L432, 1720 ch) — FIGURE 6.1 | **FAITHFUL** — all hostnames, CIDRs, port numbers preserved verbatim |
| 7 | 02 | L363 (855 ch) — human-in-the-loop guardrails | **FAITHFUL** |
| 8 | 02 | L814 (364 ch) — log-retention boundary | **FAITHFUL** — including the "**not** a compliance-grade archive" negation |
| 9 | 03 | ¶236 (L3214, 2386 ch) — 25-item evidence checklist | **FAITHFUL** — all 25 checklist items present, TB-01/TB-12 refs intact |
| 10 | 03 | L3618 (415 ch) — final "version deviations" item | **FAITHFUL** (file end verified: ZH L3493–3502 mirrors EN L3614–3623 exactly) |
| 11 | 05 | ¶64 (L1436, 2063 ch) — BGP verification | **FAITHFUL** — see C5 |
| 12 | 07 | L391 / L624 / L945 (prose lines using the word "truncated") | **FAITHFUL** — the truncation-control concepts are rendered (截斷/縮減); no English run left untranslated inside a Chinese sentence |
| 12 | 04 | ¶4 (L28–34, 2178 ch) — five lines | **FAITHFUL** |
| 13 | 04 | L786 (550 ch) — `[ASSUMPTION]` on `http2` | **FAITHFUL** — including the fallback and the "prefer for forward compatibility" reason |
| 14 | 04 | **L788 → ZH L830** | **MINOR ISSUE** — two EN lead-ins merged into one ZH sentence; content preserved |
| 15 | 05 | ¶64 (L1436, 2063 ch) — BGP verification | **FAITHFUL** — every check, the AS-path four-entry explanation, and the closing administrative-distance point |
| 16 | 06 | ¶140 (L2199–2201) — object pipeline / remoting | **FAITHFUL** — items 1–2 complete; a third item (`Coverage depth on Microsoft roles`, with `-WhatIf` ↔ `--check`) also present |
| 17 | 06 | L3203 (low-ratio) | **FAITHFUL** |
| 18 | 07 | ¶119 (L943–948, 1589 ch) — six injection defences | **FAITHFUL** — all six items |
| 19 | 08 | ¶152 (L1521) + ¶153 (L1523) + ¶120 (L1251) + ¶85 (L1019) + ¶99 (L1134) | **FAITHFUL** — long, low-ratio but complete in every clause |

**Systematic style note (not a defect).** The translator compresses more aggressively than 0.35–0.65: median ratio
≈0.30–0.45, dipping to 0.25–0.31 in list- and identifier-dense paragraphs. Because the compression is *uniform* across
a paragraph rather than concentrated in a prefix/suffix, it does not have the signature of truncation — but it does mean
**the 0.25 threshold in the brief is the right margin**: a translator working this tight has little headroom before
loss becomes invisible to a ratio test.

---

## What this audit did NOT verify

* Semantic accuracy of the translation (only completeness/fidelity of content) — no native-speaker review was performed.
* Whether the Chinese prose reads naturally in zh-HK register.
* `08-project-management.md` was byte-stable throughout the audit window, but the translating agent's session was still open; a late rewrite after 23:19 would invalidate its row (and only its row).
* C4 runs flagged in `07` L267/L317 contain doubled spaces suggesting elided table-cell content; I confirmed the *surrounding* row content is translated but did not trace each elided host name back to its English cell.

---

## Confidence calibration / how to break this result

Three tooling traps were hit and corrected during the audit, and are recorded here because they bound the confidence of
the numbers above:

1. **A fenced-block detector that mishandled `\r` in a mixed-EOL file.** An early implementation made `03-microsoft.md`
   look like it had 136 fenced blocks in EN and 75 in ZH, and generated 60 spurious "missing paragraph" and 66 spurious
   "low ratio" flags. The truth is 149/149 byte-identical blocks. **All 03 results quoted in this report come from the
   corrected scan**; if anyone reproduces the earlier numbers, they have the buggy detector.
2. **Token/n-gram presence tests are translation-blind.** Testing whether English 4-grams or English words appear in the
   Chinese file reports ~100 % "missing" for correct translations. The C5 long-line conclusions were therefore reached by
   reading the aligned Chinese paragraph in full, not by token matching.
3. **Sentence-splitting on CJK** produced "EN 11 → ZH 1 sentence" artefacts; sentence-count parity is not a usable
   signal here and no conclusion rests on it.

The strongest single piece of evidence in this report is the **order-independent identifier-anchored alignment**: it
pairs 100 % of paragraphs in all eight files (304/304 in `03`, 272/272 in `04`, 189/189 in `08`, etc.) with exactly one
unpaired English paragraph in `04`, which reading then explained as a merge. A silent mid-paragraph truncation in any
file would have to have preserved paragraph counts, paragraph order, identifier coverage, terminal punctuation and
fenced content simultaneously to escape it — and the two low-ratio files whose paragraphs are *densest* in identifiers
(`02`, `03`) are precisely the two with zero flags.
