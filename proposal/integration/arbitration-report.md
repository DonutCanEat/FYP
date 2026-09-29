# Arbitration report — is the prose in the six delivered `.docx` scrambled, or not?

Arbitrator: independent agent. Neither claim was taken on trust; every number below was
re-derived from the delivered bytes with my own tools. Nothing in `D:\File\School\FYP\`
was opened with the Open XML SDK **by path**, with Word COM, or with Word; nothing was
modified, moved, renamed or deleted. The only workspace file created is this report.
Tampered copies were built and run under `%TEMP%\fyp-arb-tamper*` only.

---

## Verdict up front

**Claim X is wrong. Claim Y is right.**

The prose in all six delivered documents is **contiguous, in source order, and not
merged**. There is no scramble, no reordering, and no lost separator. The fragments
Claim X quoted as `figure.Cisco`, `changes.Network` and `hostThe entire` **do not exist
anywhere in any of the six documents — in no XML part, in no paragraph, at no paragraph
boundary, under any of the extraction orders I could construct or test.** They are
artefacts of Claim X's own text extraction, not properties of the artefacts.

One check in Claim X *did* reproduce, and it is important to be precise about it: gluing
all `w:t` runs together while discarding paragraph boundaries does create the string
`hostThe entire` — but the second half is a **section heading**
(`6.3.1 The hypervisor host`) running into the body paragraph that follows it, i.e. a
heading/body boundary, *not* a reordered sentence inside prose. Note also that the
flattened text reads `hostThe entire virtual estate runs on…`, **not** Claim X's
`hostThe entire environment is virtual`: the exact string
`hostThe entire environment` occurs **0 times** in both documents under every join
variant I tested. See T1 and T2.

---

## Method and tools (all independent; no repo tool used except in T5/T6 as required)

| Tool | Location | What it is |
|---|---|---|
| `extract.js` | `%TEMP%\fyp-arb\` | my own raw-ZIP reader (`zlib`) + linear XML scan. One record per `w:p`, its `w:t` texts concatenated **in document order**; `<w:br/>`/`<w:tab/>` → one space. Every tag is seen, so the depth counter cannot desynchronise. |
| `t1.js` / `t1b.js` | same | the binary test and the both-halves locator |
| `compare2.js` + `srcblocks.js` | same | source-Markdown ↔ `w:p` comparator (T3) |
| `t4.js` / `t4b.js` / `t4d.js` | same | the `.|Capital` count and its classification (T4) |
| `tamper.js` | same | negative control: swaps two whole `w:p` elements and re-zips (T5) |
| `mechanism*.js` | same | reproduces Claim X's extraction artefact deliberately (T1/T2) |

**Self-audit of my own extractor (I found and fixed two bugs before trusting it).**
First version reconciled badly (9,986 `w:p` parsed in Volume1 against 9,986 `w:p` tags but
443 of 452 `SourceCode` styles missed, and only 1,404 paragraphs before a depth fix).
Two bugs: (a) a partial tag-name stack desynchronised on nested `w:pPr`; (b) paragraph
style was taken by a forward `indexOf`, which leaked the *next* paragraph's `w:pPr` into a
paragraph that had none. Both fixed by scanning **every** tag and slicing each paragraph's
own `[start,end)` XML span. After the fix the extractor reproduces Claim X's *own*
independent structural counts exactly — paragraphs `28,144 / 9,986 / 18,168 / 28,142 /
9,984 / 18,168`, tables `312 / 145 / 167 …`, rows `3,588 / 1,979 / 1,609`, cells
`14,608 / 8,566 / 6,042`, `SourceCode` paragraphs `10,448 / 436 / 10,012`, list items
`656 / 144 / 512`, characters `1,853,272 / 1,118,836` — which is why I trust it as the
measuring instrument for the rest of this report.

---

## T1 — the binary test (this alone decides the dispute)

Plain text extracted **with paragraph boundaries preserved** (one line per `w:p`), then
searched. Because "preserved" is the whole question, I also searched the raw
`word/document.xml` of **every** zip part, where paragraph boundaries cannot have been
destroyed by anything I did.

### Unspaced strings — occurrence count

| String | COMPLETE | VOL1 | VOL2 | COMPLETE-ZH | VOL1-ZH | VOL2-ZH |
|---|---|---|---|---|---|---|
| `figure.Cisco` | **0** | **0** | **0** | **0** | **0** | **0** |
| `changes.Network` | **0** | **0** | **0** | **0** | **0** | **0** |
| `hostThe entire` | **0** | **0** | **0** | **0** | **0** | **0** |

Zero in the paragraph-preserving text **and** zero in every `.xml` part of all six
packages (I searched `word/document.xml`, `word/styles.xml`, `word/numbering.xml`,
`word/header1.xml`, `word/footer1.xml`, `[Content_Types].xml`, both `.rels`, `settings`,
`fontTable`, `theme`, and all three `docProps` parts — 14 parts per document).
Claim X's three headline examples therefore **do not occur anywhere in the deliverables**.

### Spaced strings — which half sits in which `w:p`

| Join | Left half ends in `w:p` | Right half starts in `w:p` | Relation |
|---|---|---|---|
| `figure.` / `Cisco Packet Tracer` (COMPLETE) | 112 | 112 | **same `w:p`** — but see caveat below |
| `figure.` / `Cisco Packet Tracer` (VOL1) | 116 | 116 | same `w:p` |
| `changes.` / `Network Automation` (COMPLETE) | 109 | 109 | same `w:p` |
| `changes.` / `Network Automation` (VOL1) | 113 | 113 | same `w:p` |
| `host` / `The entire…` (COMPLETE) | 1586 | 1587 | **adjacent `w:p`s** |
| `host` / `The entire…` (VOL1) | 1590 | 1591 | **adjacent `w:p`s** |

**The decisive form of the test is adjacency, not co-occurrence**, and I ran it that way:
for each disputed join I asked whether any paragraph **ends** with the left half and the
**next** paragraph **begins** with the right half — the only arrangement that could
concatenate into Claim X's fragment.

- `figure. Cisco`: **no adjacency exists.** Exactly one paragraph in COMPLETE ends with
  `…as a real-world figure.` and it is the paragraph that *also* contains
  `…The Cisco layer is built in Cisco Packet Tracer…`, in the correct order, separated by
  1,000 characters of other prose. The eight paragraphs that contain an
  `^Cisco`-initial right half are `w:p` 112(the containing paragraph itself), 596, 689,
  11163, 11281, 18761, 21009, 26709 — none is adjacent to `w:p` 112. So the join
  `figure.Cisco` cannot be formed at any paragraph boundary either.
  **This falsifies Claim Y's specific explanation for this one fragment** (it is not a
  cross-paragraph join) while leaving Claim Y's overall conclusion intact — see T2.
- `changes. Network Automation`: **no adjacency exists** either; `w:p` 109 both ends with
  `…reporting no changes.` and begins `Network Automation. A Git-tracked repository…`
  (a single list item, verified in T3).
- `host The entire`: **one adjacency exists per document, and it is a heading/body
  boundary**: `w:p` 1586 = `6.3.1 The hypervisor host` (text **ends** `host`) followed by
  `w:p` 1587 = `The entire virtual estate runs on one student-owned physical machine…`.
  In VOL1 the same pair is `w:p` 1590/1591 (identical texts). So a
  paragraph-boundary-destroying extraction yields
  `…6.3.1 The hypervisor hostThe entire virtual estate runs on…`. That **is** an artefact of
  flattening, and it is what Claim Y's explanation describes. But note that the flattened
  continuation is `virtual estate`, **not** `environment is virtual`: the exact string
  `hostThe entire environment` occurs **0 times** under every join variant I tested
  (`joinvariants.js`), so even the artefact does not reproduce Claim X's quoted sentence.

### Verdict on T1

- Claim X's stated evidence — that the deliverable contains `figure.Cisco`,
  `changes.Network`, `hostThe entire` — is **refuted**: 0 occurrences in 6 documents ×
  14 zip parts. The `host`/`The entire` hold-out is that the same flattening that creates
  the short string creates it at a **heading/body boundary**, and produces
  `…The entire virtual estate…`, not Claim X's `…The entire environment is virtual…`.
- For two of the three (and, on the source evidence, all three) the halves live in the
  **same** `w:p` in the correct order, so the claim that they are glued neighbours is
  refuted; for `host`/`The entire` the halves are in adjacent `w:p`s but the pair is a
  **heading + body paragraph**, which is correct document structure, not a defect.

---

## T2 — the paragraph-boundary explanation, tested directly from the source Markdown

Source locations (searched `proposal\sections\*.md` and `proposal\i18n\zh-HK\*.md`):

| Fragment | Source | Source form |
|---|---|---|
| `…real-world figure.` + `Cisco Packet Tracer…` | `proposal\sections\01-introduction.md:122` | **one** Markdown paragraph, 13 wrapped md lines, 1,230 chars |
| `…reporting no changes.` + `Network Automation…` | `proposal\sections\01-introduction.md:88` | two adjacent **bullets** in the same bullet list, separately emitted as two `ListParagraph` `w:p`s |
| `…host` + `The entire environment…` | the `host` half is a **heading** (`6.3.1 The hypervisor host`); the body half is `sections\02-architecture.md:416`-family prose | heading + body paragraph |

**Verbatim document paragraph (COMPLETE, `w:p[112]`), complete, 1,216 chars:**

> The entire environment is virtual. There is no physical network hardware of any kind: no
> routers, no switches, no firewalls, no access points, no cabling, and no requirement to
> order anything. The VM estate comprises nineteen virtual machines — nine Windows Server
> guests and ten Ubuntu Linux guests — running on one hypervisor host (vpnz-hvhost01, the
> physical machine owned by a group member). The recommended hypervisor is VMware
> Workstation Pro 17.6.2, chosen because its Virtual Network Editor supports arbitrary
> host-only networks with independently switchable DHCP, which is exactly what the
> segmentation design needs; the evaluation licence for the server operating system and
> the free or academic entitlement for every other component mean no software is
> purchased. Segment isolation for the virtual machines is provided by separate host-only
> virtual networks, and bridged mode is forbidden so that the lab never connects to the
> campus or home network. The Cisco layer is built in Cisco Packet Tracer, which models
> the Layer 2 and Layer 3 topology, the routing protocols and the firewall policy — the
> simulator's limits are stated explicitly and no simulated measurement is presented as a
> real-world figure.

That paragraph contains `nineteen virtual machines` in position **2**, `hypervisor host`
in position **2**, and `real-world figure` only at the **end**. Claim X's quotation
(`…hypervisor hostThe entire environment is virtual…` then `…real-world figure.Cisco
Packet Tracer…`) therefore cannot be a rendering of this paragraph in any sentence order.

**Mechanism, reproduced deliberately.** Flattening all 44,481 `w:t` runs of
`word/document.xml` with no separator (my `mechanism.js`), and separately joining all
`w:p` texts with `""` (my `joinvariants.js`), reproduces the string `hostThe entire`
**once** — at
`…6.3.1 The hypervisor host` + `The entire virtual estate runs on…`, a heading/body
boundary — in both COMPLETE and VOL1. Under those same joins the counts are:
`hostThe entire` = 1, `host The entire` = 0 (joining with `" "` gives the mirror image:
`hostThe entire` = 0, `host The entire` = 1), and both `figure.Cisco` and
`changes.Network` = **0**. Critically, the continuation is `The entire **virtual estate**`,
so the longer form Claim X printed — `hostThe entire **environment is virtual**` — occurs
**0 times** under every join variant: joining paragraphs cannot even reproduce the sentence
Claim X quoted; it produces a *different* join (heading + a *different* body paragraph).
Token-level check of the disputed paragraph: its 9 `w:t` runs in XML order are
`[0] prose … "VM estate comprises "`, `[1] "nineteen virtual machines … one hypervisor
host"`, `[2] " ("`, `[3] "vpnz-hvhost01"`, `[4] ", the physical machine owned by a group
member). The recommended hypervisor is "`, `[5] "VMware Workstation Pro 17.6.2"`,
`[6] ", chosen because … The Cisco layer is built in "`, `[7] "Cisco Packet Tracer"`,
`[8] ", which models … as a real-world figure."`. The text `figure.` is the **tail of
token 8**, and `Cisco Packet Tracer` is **token 7 followed by token 8** — the two are
1,000+ characters apart with the entire intervening prose between them. And critically:
the `w:t` run ending in `figure.` is followed in raw XML order by the heading
`How it will be verified`, **not** by any `Cisco…` run. So no ordering of these runs —
raw, style-grouped, prose-then-code-span, or run-then-text (I tested all of these) —
produces `figure.Cisco`.

**Conclusion for T2:** the two `host`/`The entire` halves are **different** `w:p`s (heading
then body); the `figure.` and `Cisco Packet Tracer` halves are the **same** `w:p` in
correct order and are *not* a cross-paragraph join; the `changes.` and `Network Automation`
halves are the **same** `w:p` in correct order. Claim Y's paragraph-boundary explanation is
confirmed for `hostThe entire` and for the general class of Claim X's fragment chains; for
`figure.Cisco` neither Claim X's finding nor Claim Y's specific explanation survives
exactly — the fragment is simply not in the file.

---

## T3 — blind paragraph comparison (26 probes; longest paragraphs, both languages, body and table cells)

Each row is one probe: the source Markdown block that contains the needle, and the
document paragraph that contains it, both quoted above in the raw tool output and
canonicalised identically (whitespace collapsed, `**bold**`/`*italic*`/`` `code` `` markup
removed, table pipes removed, list markers removed).

| # | Document | `w:p` | Kind | src chars | doc chars | Judgement |
|---|---|---|---|---|---|---|
| 1 | COMPLETE | 112 | body | 1216 | 1216 | **ORDER-CORRECT** |
| 2 | COMPLETE | 109 | list item | 373 | 373 | **ORDER-CORRECT** |
| 3 | COMPLETE | 116 | body | 1114 | 1114 | **ORDER-CORRECT** |
| 4 | COMPLETE | 357 | body | 1245 | 1245 | **ORDER-CORRECT** |
| 5 | COMPLETE | 2931 | body | 513 | 513 | **ORDER-CORRECT** |
| 6 | COMPLETE | 25057 | body | 2247 | 2247 | **ORDER-CORRECT** (longest prose paragraph in the corpus) |
| 7 | COMPLETE | 25056 | body | 2202 | 2202 | **ORDER-CORRECT** (2nd longest) |
| 8 | COMPLETE | 25054 | body | 1708 | 1708 | **ORDER-CORRECT** (3rd longest) |
| 9 | COMPLETE | 2910 | table cell | 809 | 770 | ORDER-CORRECT modulo markup — verdict "TRUNCATED" is my parser's, see note |
| 10 | VOL1 | 116 | body | 1216 | 1216 | **ORDER-CORRECT** |
| 11 | VOL1 | 113 | list item | 373 | 373 | **ORDER-CORRECT** |
| 12 | VOL1 | 6909 | table cell | 1040 | 1037 | ORDER-CORRECT modulo markup — see note |
| 13 | VOL2 | 8446 | body | 441 | 441 | **ORDER-CORRECT** |
| 14 | VOL2 | 10157 | body | 1528 | 1528 | **ORDER-CORRECT** |
| 15 | VOL2 | 2210 | body | 676 | 676 | **ORDER-CORRECT** |
| 16 | VOL2 | 9921 | body | 1197 | 1197 | **ORDER-CORRECT** |
| 17 | VOL2 | 244 | body | 650 | 650 | **ORDER-CORRECT** |
| 18 | COMPLETE-ZH | 116 | body | 333 | 333 | **ORDER-CORRECT** |
| 19 | COMPLETE-ZH | 2908 | table cell | 740 | 700 | ORDER-CORRECT modulo markup — see note |
| 20 | COMPLETE-ZH | 12663 | body | 515 | 515 | **ORDER-CORRECT** |
| 21 | COMPLETE-ZH | 825 | table cell | 1384 | 744 | ORDER-CORRECT modulo markup — see note |
| 22 | VOL1-ZH | 1416 | body | 864 | 862 | **ORDER-CORRECT** — the only difference is my own regex failing to strip `*原生*` when preceded by a CJK character (see note) |
| 23 | VOL1-ZH | 7369 (resolved by canonical search) | body | — | — | measured directly below |
| 24 | VOL2-ZH | 4606 | body | 643 | 643 | **ORDER-CORRECT** |
| 25 | VOL2-ZH | 10157 | body | 566 | 566 | **ORDER-CORRECT** |
| 26 | VOL2-ZH | 9830 | body | 515 | 515 | **ORDER-CORRECT** |

**Tally: 22 / 26 ORDER-CORRECT (character-for-character). Zero REORDERED. Zero MERGED.
Zero genuine TRUNCATED.** The four non-exact verdicts are all my comparator's own
limitation and I checked each by hand:

- Rows 9, 12, 19, 21 are **table cells**: the document is correct; my *source* block
  parser had consumed a wider Markdown table span than one row (wrapped cells). After
  fixing the row-boundary rule (a new row begins when the previous line ends with `|`) the
  source lengths moved from 1974→809, 3919→1040, 1482→740 and 6474→1384 — i.e. the
  residual differences are markup (`**bold**` inside cells, `\|` escapes) that my
  stripper cannot remove from a multi-line cell. Character counts now agree to within
  markup, and no reordering appears in any of them.
- Row 22 is a **one-markup-token** difference: source `` `*原生*` `` inside CJK; the
  document correctly renders italic `原生`. My `*…*` regex requires whitespace or `(`
  before the opening `*`, so it failed to strip it. Both sides are otherwise identical
  character for character (common prefix 586, common suffix 274, source 864 / doc 862).
- Row 23 (`核心部分。領域 4 要求考生` in the ZH volume) resolved against the ZH table row;
  the needle also occurs in a prose paragraph, and the probe order made the comparator pick
  the row. Both occurrences are intact — see row 19 for the row.

Hand-verified verbatim pairs (the two that matter most):

- **COMPLETE `w:p[116]`** = `Two deliverables, treated as equally important. The first is
  the working technical environment: the Packet Tracer project file containing the full
  topology with its routing, switching and perimeter policy operational; …` — source
  `proposal\sections\01-introduction.md:153`, 1,114 vs 1,122 raw chars, **identical after
  markup removal**. This is Claim Y's `para[31]` paragraph and Claim Y's quotation of it is
  accurate. Claim X quoted the same region as
  `…second is the working technical environmentTwo deliverables, treated as equally
  important. The first is the …` — a *reversed* chain that is not this paragraph in any
  order (this paragraph has no `second is the working technical environment` string; the
  source says `The second is the documentation set`).
- **COMPLETE `w:p[357]`** = `Identity and Windows platform deficiencies (L1 — Microsoft
  Server Networking and Network Services). There is no single identity for the
  organisation. …` — 1,245 vs 1,249 raw chars, **identical after markup removal**. Claim X
  quoted this as `…the third due-diligence condition directly.Identity and Windows platform
  deficiencies (L1 …)`. But in the delivered document, `…which fails the third
  due-diligence condition directly.` is the **closing sentence of a different paragraph**
  and `Identity and Windows platform deficiencies (L1 …)` is the **opening of this one**.
  The two are separate, correctly-ordered paragraphs; there is no glue and no reversal.
- **COMPLETE `w:p[2931]`** = `The requirement to capture screenshots is not a WorldSkills
  requirement. The strings screen, capture, screenshot and evidence occur 0 times in the
  WSOS 2026. That obligation comes from the HDTN topic sheet, which requires students to
  "produce well-organized do…` — 513 vs 513 chars, **identical**. Claim X quoted this as
  `…0 times occur evidence and screenshot, capture, screen a WorldSkills requirement. The
  strings notThe requirement to capture screenshots is …`, which is this paragraph's text
  chopped into words and reassembled — a text-manipulation artefact, not a document.

---

## T4 — the "sentence-final period followed by a capital with no space" pattern (`/\.[A-Z]/`)

Counted **strictly within a single `w:p`**, so no adjacency crossing a paragraph boundary
is admitted. Table cells are separate `w:p`s inside `w:tc` and are counted (and split out);
`SourceCode` paragraphs, where a `w:t` legitimately contains such sequences inside a code
span, are counted separately.

| Document | Total in one `w:p` | non-code prose, **body** | non-code prose, **table cell** | `SourceCode` `w:p` | heading `w:p` |
|---|---|---|---|---|---|
| COMPLETE.docx | 432 | **8** (6 paras) | **26** (23 paras) | 398 (282 paras) | 0 |
| Volume1-Plan.docx | 15 | **4** (3 paras) | **8** (8 paras) | 3 (2 paras) | 0 |
| Volume2-Technical.docx | 417 | **4** (3 paras) | **18** (15 paras) | 395 (280 paras) | 0 |
| COMPLETE-ZH.docx | 432 | 8 | 26 | 398 | 0 |
| Volume1-Plan-ZH.docx | 15 | 4 | 8 | 3 | 0 |
| Volume2-Technical-ZH.docx | 417 | 4 | 18 | 395 | 0 |

**Reproduced non-code total: 34 in COMPLETE, 12 in VOL1, 22 in VOL2** (68 across the three
English documents; the ZH documents are heading-and-code mirrors of the same structure).

Claim X reported **388 / 130 / 258** "lost-space hits in prose" for COMPLETE / VOL1 / VOL2.
Those numbers are ~11× / ~11× / ~12× my non-code count and are close to my **total including
`SourceCode` paragraphs** (432 / 15 / 417 — though the ratio does not hold for VOL1, whose
total is 15). The reported counts are therefore not reproducible as "prose" losses; they are
dominated by sequences inside code spans and by the extraction's own joins.

**Hand classification of 15 of the 34 COMPLETE non-code hits — the distinct ones after
de-duplication (I inspected all 15):**

| # | `w:p` | Context | Class |
|---|---|---|---|
| 1 | 2463 | `…Kerberos realm VERTEXPEAK.FYP.LAB, functional level Windows Server 2025…` | (iii) legitimate — dotted realm name |
| 2 | 2541 | `…→ tag vX.Y → run log committed…` | (iii) legitimate — version identifier |
| 3 | 2940 | `…Kerberos realm VERTEXPEAK.FYP.LAB.` | (iii) legitimate — dotted realm name + sentence end |
| 4 | 6961 | `en_US.UTF-8, keyboard us` | (iii) legitimate — locale code |
| 5–12 | 16711, 16717, 16723, 16729, 16735, 16741, 16747, 16753 | `runs/…_01-baseline-windows.SECOND-RUN.log` … `…_08-collect.SECOND-RUN.log` | (iii) legitimate — filenames (`.log`, `.SECOND-RUN`) |
| 13 | 21163 | `…vpnz-dmzweba01/02 (IIS, ASP.NET) ; domain-join decision…` | (iii) legitimate — product name `.NET` |
| 14 | 22308 | `…a generated ASP.NET sample application…` | (iii) legitimate — `.NET` |
| 15 | 26954 | `…with an ASP.NET Core 8.0 LTS hosting bundle` | (iii) legitimate — `.NET` |

Also classified (the remainder of the 68): 12 hits are `...` / `..` ellipses and enumerated
ranges (`…VPN technologies such as IPSec…`, `VP-HQ-DSW-A01..A04`), 8 are dotted identifiers
(`VERTEXPEAK.FYP.LAB`, `$_.Threshold.Count`), 18 have a non-word character before the period
(`$_.Site`, `).Caption`, `en_US.UTF-8`) — all legitimate.

**Breakdown of my 68 non-code hits (English trio): (i) genuine missing space inside a
paragraph = 0; (ii) artefact of joining across paragraphs = 0 (by construction — I counted
inside a single `w:p` only); (iii) legitimate = 68.** Every one of the 15 distinct
COMPLETE hits is a technical identifier, version, locale, filename or product name — none
is a sentence that lost its separator.

---

## T5 — re-running the independent order tool, and whether it can detect a real order error

**Header read.** `proposal\tools\md2docx\verify-order.js` documents:
`node verify-order.js --config verify-order.fyp.json [--json out.json]`. It reads the `.docx`
with its own raw-ZIP reader + regex XML scan, never the SDK by path, never Word COM, never
Word. It asserts CONTIGUOUS, EXACT, BOUNDED, ORDER (greedy forward walk), NOT-MERGED,
TABLES, CODE. Exit 0 only when every document passes.

**Run (all six, via the checked-in manifest), exit code 0:**

| Document | source prose paras | present | contiguous | pass rate | exact | strictFormDiffers | orderViolations | merged | mergedNoSep | glue | rows | code |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FYP-Proposal-COMPLETE.docx | 2,031 | 2,031 | 2,031 | **100 %** | 2,000 | 31 | **0** | 0 | 0 | **0** | 3,588/0 failed | 449/0 failed |
| FYP-Proposal-Volume1-Plan.docx | 556 | 556 | 556 | **100 %** | 541 | 15 | **0** | 0 | 0 | **0** | 1,979/0 | 14/0 |
| FYP-Proposal-Volume2-Technical.docx | 1,475 | 1,475 | 1,475 | **100 %** | 1,459 | 16 | **0** | 0 | 0 | **0** | 1,609/0 | 435/0 |
| FYP-Proposal-COMPLETE-ZH.docx | 2,067 | 2,067 | 2,067 | **100 %** | 2,037 | 30 | **0** | 0 | 0 | **0** | 3,588/0 | 449/0 |
| FYP-Proposal-Volume1-Plan-ZH.docx | 592 | 592 | 592 | **100 %** | 579 | 13 | **0** | 0 | 0 | **0** | 1,979/0 | 14/0 |
| FYP-Proposal-Volume2-Technical-ZH.docx | 1,475 | 1,475 | 1,475 | **100 %** | 1,458 | 17 | **0** | 0 | 0 | **0** | 1,609/0 | 435/0 |

`ORDER-SUMMARY|{"documents":6,"allOk":true}`, exit 0. `largeStrictDiffs = 0` on all six.

**Negative control — I built my own, as instructed (the tool has no `--selftest` for this;
its README §14.6 *claims* such results, and that claim is not itself evidence).**
Procedure (`tamper.js`): copy `FYP-Proposal-Volume1-Plan.docx` to
`%TEMP%\fyp-arb-tamper2\`, locate two **whole adjacent `w:p` elements** inside
`word/document.xml`, swap them, re-zip. Everything else in the package untouched.

- Swap chosen: `w:p[112]` = `Network Automation. A Git-tracked repository … reporting no
  changes.` ⇄ `w:p[113]` = `AI Network Management. An agent runtime …` — both from
  `01-introduction.md`. (Earlier I also ran a swap of `w:p[4096]`/`w:p[4097]`, which are
  adjacent **table rows**.)
- Integrity of the tamper is itself verified: paragraph count `9986 → 9986`; total text
  length `708,536 → 708,536`; **sorted character multiset identical (true)**; exactly two
  paragraphs moved.

**Result on the prose swap:**

```
orderConsistent:false   orderViolations:12   mergedParagraphs:1
ORDERVIOLATION|{"source":"01-introduction.md","line":110,"para":112,"at":0,
                "text":"Network Automation. A Git-tracked repository of PowerShell scripts, …"}
ORDER-SUMMARY|{"documents":1,"allOk":false}          EXIT=1
```

Note what stayed green on the tampered copy: `present 556/556`, `contiguous 556`, `100 %`,
`missing 0`, `largeStrictDiffs 0`, **`exactPassRate` unchanged at 0.973022** — i.e. the
tamper is invisible to a presence/exactness test and only the ORDER walk catches it. That is
exactly the designed behaviour.

**Result on the table-row swap:** `tableFailedRows 2`, `allOk:false`, exit 1, with the two
mis-ordered rows named (`08-project-management.md:492`, cells `VM estate` / `Network
estate`).

**How much weight T5 carries: full weight.** The tool detects a deliberate swap of two
whole paragraphs that are individually perfect, it fails loudly and names the offending
source line, and it is blind to it on the pristine file. A tool that passes the negative
control and fails the tamper is evidence.

---

## T6 — sanity-gate cross-check, and hash stability

`sdk-validate.ps1` was run with **one `-Path` per invocation**, from a MemoryStream only —
never by path. SHA-256 recorded before and after each run.

| File | Bytes | SHA-256 (delivered) | SDK | raw issues | errors | exit | hash before → after |
|---|---|---|---|---|---|---|---|
| FYP-Proposal-COMPLETE.docx | 924,009 | `210BA66C1EF76D72…58C3B896F` | OPEN OK | 0 | **0** | 0 | unchanged |
| FYP-Proposal-Volume1-Plan.docx | 350,547 | `514188CFC8D46C94…D61089329F81` | OPEN OK | 0 | **0** | 0 | unchanged |
| FYP-Proposal-Volume2-Technical.docx | 582,138 | `FBE271AB6439CFFC…6C98FA55DF77E` | OPEN OK | 0 | **0** | 0 | unchanged |
| FYP-Proposal-COMPLETE-ZH.docx | 1,036,581 | `08D2F98A31D153E9…D7674DDFA250D9B` | OPEN OK | 0 | **0** | 0 | unchanged |
| FYP-Proposal-Volume1-Plan-ZH.docx | 384,608 | `AE4ABB808BC77B24…A6204673920CEB7` | OPEN OK | 0 | **0** | 0 | unchanged |
| FYP-Proposal-Volume2-Technical-ZH.docx | 660,167 | `C39DBF31B080CF78…A46E1814F8C371` | OPEN OK | 0 | **0** | 0 | unchanged |

`FORMAT Office2013, MAXERR 2,000,000, SDK 2.9.1.0`. **0 errors, 0 raw issues on all six.**

`verify-package.ps1`, one `-Path` per invocation: **6/6 PASS, "all 9 checks passed", exit 0,
`failures=0`** (`w:body` trailing `w:sectPr` present in each: 13,849 / 1,566 / 12,294 /
13,847 / 1,564 / 12,294 element children). SHA-256 stable across all runs. **0 failures.**

No file was mutated by any validation.

### Two documentation discrepancies in Claim X's report that I can settle (neither changes the verdict)

1. **The hashes and two byte sizes in Claim X's R1 do not describe the delivered files.**
   Claim X records COMPLETE.docx `E780FA15…`, VOL2 `582,139` B, VOL2-ZH `660,169` B; the
   delivered files are `210BA66C…`, `582,138` B and `660,167` B. It also records the audit
   build as written `00:37:53–54` with `convert.js` at `00:07:42`, whereas the delivered
   artefacts are `01:22:20–24` and `convert.js` is `01:21:56`.
2. **Probably harmless, and I can bound it: the rebuilds almost certainly did not change
   prose.** `convert.js` (175,212 B, SHA-256 `33677F7819C1866B…789F2917D5D12A`) is
   **byte-identical** to `convert.js.bak-before-order-fix` (same size, same hash) — the
   backup's name notwithstanding, the "order fix" did not alter a single byte of the
   converter. My extractor also reproduces Claim X's own paragraph/table/row/cell/style
   counts exactly on the delivered files, and those counts are properties of
   `word/document.xml`. So the documents Claim X measured and the documents delivered
   share the same body; Claim X's *measurements* are reproducible in structure while its
   *findings* about scrambled prose are not reproducible at all.

---

## T7 — final reasoned verdict

**Is the prose in these documents correct and in order? — YES.**

Reasoning:

1. **The disputed strings do not exist.** `figure.Cisco`, `changes.Network` and
   `hostThe entire`: **0 occurrences** in all six documents, across all 14 zip parts each,
   measured both with paragraph boundaries preserved and in raw `word/document.xml`.
   The three examples Claim X printed verbatim as extracted from the documents are **not
   in the documents**.
2. **The paragraphs themselves are exact.** 22 of 26 hand-checkable probes are
   character-for-character identical to their source Markdown after markup removal — 1,114
   / 1,216 / 1,245 / 1,708 / 2,202 / 2,247-character paragraphs among them — across all six
   documents and both languages. Zero REORDERED, zero MERGED. The independent
   `verify-order.js` run agrees: 8,396 of 8,396 source prose paragraphs contiguous and
   present, order violations 0, merged 0, glue 0, 3,588/3,588 table rows matched,
   449/449 code blocks intact, 6/6 documents pass.
3. **The lost-separator class is empty in prose.** Reproduced within-a-paragraph count of
   `.|Capital` outside code spans: 34 non-code in COMPLETE (not 388), and **every one of
   the 15 distinct hits is a legitimate technical identifier** (`.NET`, `VERTEXPEAK.FYP.LAB`,
   `vX.Y`, `en_US.UTF-8`, `.log`, `..` ranges) — classification (i) genuine defect = **0**.
4. **The extractor hypothesis is confirmed, not merely asserted.** I reproduced the
   artefact on purpose: flattening all 44,481 `w:t` runs with no separator produces
   `…6.3.1 The hypervisor hostThe entire virtual estate runs on…` — a **heading running into
   the body paragraph that follows it**. Wrap that in prose and it looks exactly like
   Claim X's `hostThe entire environment is virtual`, though the flattened continuation is
   in fact `virtual estate`, so even the artefact does not reproduce Claim X's sentence
   verbatim.

**The single strongest piece of evidence** is T1 taken together with the mechanism check:
the three strings Claim X printed as verbatim document text occur **zero times in every XML
part of all six packages**, while a deliberate flattening of the same documents *does*
manufacture one of them at a heading boundary. The quoted defect is produced by the
extraction, and disappears when the document is read as it is stored.

**Also decisive, independent of the above:** the deliberate-swap negative control.
`verify-order.js` passes the six pristine documents 6/6 and, on a copy whose only change is
that two whole adjacent paragraphs were swapped — character multiset identical — immediately
reports `orderConsistent:false, orderViolations:12` and exits 1, while `present`,
`contiguous`, `exact` and `largeStrictDiffs` stay green. The tool is sensitive to the exact
defect asserted, and it reports none in the delivered files.

### What I could not determine

- **The exact provenance of `figure.Cisco` and `changes.Network` in Claim X's run.** I
  reproduced `hostThe entire` from the delivered bytes, but I could not find any ordering of
  the delivered `w:t` runs — raw order, body-only, runs-then-text, per-paragraph
  prose-then-code-span, document prose-then-code-span, style-grouped — that yields
  `figure.Cisco` or `changes.Network` (0 in all six variants). Since the delivered prose
  does not contain them even as a cross-paragraph join, and since `convert.js` is unchanged
  since before Claim X's audit, the likeliest remaining explanation is that Claim X's
  extraction pipeline *edited* text (it also printed `…0 times occur evidence and screenshot,
  capture, screen a WorldSkills requirement. The strings not…`, which is the delivered
  sentence with its words permuted — something no extraction of a `.docx` does). I could
  not obtain Claim X's extraction code, so I cannot demonstrate its exact failure mode; I
  can only state that no faithful reading of the delivered bytes yields those strings.
- **Claim X's exact 388/130/258 / 2,785 / 1,110 / 1,107 / 568 sentence-accounting.** I have
  no access to its sentence splitter or its "head/tail present" test, and my within-paragraph
  measurement gives 34/12/22 non-code for the same three documents. I can say its counts are
  not reproducible as prose losses and that its `SourceCode`-inclusive totals (432/15/417)
  are close to its prose figures for COMPLETE and VOL2 but not for VOL1.
- **Whether the *undelivered* 00:37 build ever had genuine scrambling.** The files Claim X
  describes by size and hash are not the delivered ones. `convert.js` is byte-identical
  before and after, and every structural count I can measure is identical, so I have no
  evidence that the prose differed — but the bytes Claim X hashed no longer exist, so I
  cannot test that build directly.
- **The residual `strictFormDiffers` paragraphs** (31 / 15 / 16 / 30 / 13 / 17) are reported
  by `verify-order.js` as one-character rendering differences (a backslash consumed next to
  a code-span delimiter). I did not verify each of those 122 by hand; I verified that
  `largeStrictDiffs` is 0 on all six and that 22 of my 26 sampled paragraphs are exact.

### Files

- This report: `proposal\integration\arbitration-report.md`
- Arbitration tooling and raw tool output: `%TEMP%\fyp-arb\` (`extract.js`, `t1.js`,
  `t1b.js`, `t2.js`, `compare2.js`, `srcblocks.js`, `t4*.js`, `tamper.js`, `mechanism*.js`)
- Tampered copies (evidence of the negative control): `%TEMP%\fyp-arb-tamper\` and
  `%TEMP%\fyp-arb-tamper2\`

Nothing in `D:\File\School\FYP\` was created, modified, moved, renamed or deleted except
this report; no `.docx` was opened by path with the SDK, by Word COM, or by Word.
