# Source-integrity manifest — `proposal\sections\` and `proposal\i18n\zh-HK\`

**Purpose.** Records the byte size, SHA-256 and last-write time of **every `.md` file under `proposal\sections\` and `proposal\i18n\zh-HK\`**, together with every **other `.md` file found under `proposal\`**, so that a future change to any of these sources is detectable by re-running the same measurement and diffing against this table. **No source file was modified to produce this manifest** — every row is a size/hash/timestamp read only.

**Why it exists.** An earlier verifier could not check the current hashes of eleven source files because **no report anywhere under `proposal\` recorded them**: `proposal\sections\{01-introduction, 02-architecture, 07-ai}.md` and `proposal\i18n\zh-HK\{01-introduction, 02-architecture, 04-linux, 05-cisco, 06-automation, 07-ai, 08-project-management}.md`. All eleven are recorded below, and the gap is closed.

- **Date and time the manifest was taken:** **2026-09-29 22:10:35 China Standard Time** (hash pass 1) and **2026-09-29 22:11:35 CST** (full-tree pass 2, which added the two files at the `proposal\` root and `_translation-audit.md`).
- **Method:** `Get-FileHash -Algorithm SHA256` on each file, `Get-Item` for length and `LastWriteTime`; paths resolved literally (no wildcards), reads only. Encoding never mattered for hashing, and no file was opened as text for this purpose.
- **Totals: 66 files** — 8 under `proposal\sections\`, 9 under `proposal\i18n\zh-HK\`, 2 at the `proposal\` root, 19 under `proposal\integration\`, 1 under `proposal\research\`, 10 under `proposal\tools\i18n-p08\out\`, 10 under `proposal\tools\i18n-p08\zh\`, 2 under `proposal\tools\md2docx\` and 8 under `proposal\tools\md2docx\stress\` (total 66 with `00-design-baseline.md` and its addendum counted). Two further non-`.md` files in `proposal\i18n\zh-HK\` are recorded at the end for completeness.

**How to detect a change.** Re-run the same commands and compare SHA-256. A **size** change with an unchanged hash is impossible; a **hash** change with an unchanged size is a same-length edit; a **last-write-time-only** change means the file was touched without its content changing.

---

## 1. `proposal\sections\` — the eight English source sections (AUTHORITY for the rendered corpus)

| File | Bytes | SHA-256 | Last write | Purpose |
|---|---|---|---|---|
| `01-introduction.md` | 115,332 | `E635EA0D820E248516A9361F8701FB212EF9EDDB53AB6B3EEE3EF94CA6689316` | 2026-09-16 23:14:23.146 | Introduction and background: host organisation, business trigger, topic-sheet framing, scope boundary |
| `02-architecture.md` | 207,452 | `306E30A3C264CCCA60218BFB3EA3E6580864557C3EBEC981086C8699F0C6EC33` | 2026-09-26 03:01:34.922 | Target architecture: three device families, segmentation, reachability and the management-plane placement |
| `03-microsoft.md` | 293,626 | `2539D46F2643DBFE41F488959F9EC663F2DAE81631D8D93A84F1C1ABD385124C` | 2026-09-16 22:23:23.667 | The Windows Server estate: directory, DNS, DHCP, file and storage services, PKI, hardening |
| `04-linux.md` | 277,513 | `5BDF143151B282D602F8D7BBF74A9450B153417DA3562DB2E87595068F7301EA` | 2026-09-16 22:28:34.783 | The Ubuntu estate: proxy and high availability, packet filtering, monitoring, baselines |
| `05-cisco.md` | 217,092 | `AD6D34E10733874E732351A7F842A8AAADF812BC9F20E5EF023B924DA8C8105B` | 2026-09-16 22:27:16.490 | The Cisco layer: routing, switching, perimeter, and the simulator-gap analysis the outline cites |
| `06-automation.md` | 297,919 | `E5F48EA8DBDB47ACEE3B3163AB246358CD932817AB6AFA9F5478F714CFA596BA` | 2026-09-16 22:27:05.039 | Automation foundations: Ansible, configuration archive, the §10.7 statement that nothing can log in to a Packet Tracer device |
| `07-ai.md` | 137,844 | `8C0C5E4056E7985877FDF03891CC9B81DAC23766E76231FE035F671A5C541588` | 2026-09-16 23:14:25.058 | The AI chapter: local model, MCP tools, agent — including the §11.6.3/§11.6.4/§11.7.2 Packet Tracer claims the outline WITHDRAWS |
| `08-project-management.md` | 429,558 | `BF8A1F2B30CB9FD40E26D77B3DABD99690B2CA6346470F8FCAFEA011DBE48F1B` | 2026-09-16 22:27:33.242 | Project management: 12-week plan, work split, risk register, the baseline milestone plan §L.5 cites |

## 2. `proposal\i18n\zh-HK\` — the Chinese companion set

| File | Bytes | SHA-256 | Last write | Purpose |
|---|---|---|---|---|
| `01-introduction.md` | 102,260 | `1A4F35CF3B2643EF45192DFC6AA150223F63E434141EAB3B697320B865FA0DCC` | 2026-09-16 23:26:12.881 | Chinese translation of `sections\01-introduction.md` |
| `02-architecture.md` | 195,481 | `EE7C0D56F0DF53CF3902C8795C5DCFFC04F59BC5BC9A302D0E9E2990D2AB4747` | 2026-09-16 22:54:17.628 | Chinese translation of `sections\02-architecture.md` |
| `03-microsoft.md` | 281,703 | `BBAD4FBE1EE2C881367CC0E4CC4F23B861C8B2E3FB73E225B8DCE41251A476EA` | 2026-09-26 03:01:36.702 | Chinese translation of `sections\03-microsoft.md` |
| `04-linux.md` | 270,998 | `B1E162BB25C558B16ADCC8BDF8E9364BAF3BFB656A6EB9C98AA86A07D3146FB1` | 2026-09-16 23:00:36.119 | Chinese translation of `sections\04-linux.md` |
| `05-cisco.md` | 211,924 | `7C5F3159443A70591CC62564F18B16A17769A62FA862FFF4BA6FC147AE7E2BEC` | 2026-09-16 23:07:58.016 | Chinese translation of `sections\05-cisco.md` |
| `06-automation.md` | 295,874 | `E40E35869FC19809F5B19EEA80BE578075F082A45125A69E7DDAE66B4F977ACA` | 2026-09-16 23:10:50.778 | Chinese translation of `sections\06-automation.md` |
| `07-ai.md` | 131,786 | `397635708C02300751818C57B484AD0245E8785D55F13626E82FACF595C06B9F` | 2026-09-16 23:26:12.882 | Chinese translation of `sections\07-ai.md` |
| `08-project-management.md` | 389,648 | `CB414C3D027BF741B086F3DCB4E0206528A89E0612AB8FD8963DACA664C7BA30` | 2026-09-16 23:11:31.353 | Chinese translation of `sections\08-project-management.md` |
| `_translation-audit.md` | 24,187 | `AC44A707A68186ACAD0920EE1467FA956659D6C9452C287D9D3E9BF87ADB2507` | 2026-09-16 23:22:03.081 | The independent completeness audit of the eight pairs above (paragraph counts, C2–C6 checks) |

## 3. `proposal\` root — the frozen design baseline the outline supersedes

| File | Bytes | SHA-256 | Last write | Purpose |
|---|---|---|---|---|
| `00-design-baseline.md` | 176,892 | `8EE8FAC57E0A49537C3F584C7464E28DB12016BA1EB056874B3518D2EC1844FA` | 2026-09-16 22:13:44 | The frozen earlier design the outline's §L change record measures itself against (36-row inventory, §6/§15.1, §17 milestone plan, §13.2 PT-09) |
| `00-design-baseline-rev1.1-addendum.md` | 67,673 | `DA23A3203E2C3210ABD57DBA47717FC43C400E10A71FB597EEE42977C2B9376E` | 2026-09-16 22:15:42 | Addendum to that baseline; part of the same frozen reference corpus |

## 4. `proposal\integration\` — verification and reconciliation reports

| File | Bytes | SHA-256 | Last write | Purpose |
|---|---|---|---|---|
| `arbitration-report.md` | 35,021 | `0F8EC2B1344BE193FE52BF16BAF033455E7F2B3A3F7A02AE97A101636BB3EAF1` | 2026-09-17 01:38:37.069 | Arbitration of conflicting findings between integration reports |
| `consistency-report.md` | 18,301 | `FD4519CA0B02421E66282E50823DF5AFF702601A1A11E09937073552910D7F14` | 2026-09-16 22:15:35.770 | Early cross-section consistency report; §8 publishes a baseline hash set |
| `emphasis-defect-measurement.md` | 25,071 | `EAAD81384B4F7CD002ABE50542651B23FA40956854FD48481DF4633592BEEDD2` | 2026-09-26 02:37:18.562 | Measurement of the converter's emphasis-parser defect (bold span ending in a period) |
| `emphasis-fix-verification.md` | 29,485 | `4C7C494CE28F60667092E2A9F30D60F34964750285D402C1AE8420FC6437743C` | 2026-09-26 03:15:16.311 | Independent verification that the emphasis rewordings rendered cleanly |
| `emphasis-source-fix-log.md` | 27,954 | `2A3030DE236EC30E77D7298B1227E89DC30D867AC4ABBB067CBA89E96EDD3DBF` | 2026-09-29 21:06:51.855 | Source-level fix log for the emphasis defects, with the before/after constructs |
| `final-acceptance-check.md` | 40,172 | `2BD93A1B57BF660C0EE1F7A7BA5557A433EAB4B267D36D74D61395C75A86F729` | 2026-09-29 21:59:09.829 | Independent final acceptance check of the whole document set |
| `final-acceptance-report.md` | 28,118 | `EC27005772774FF9950EA4070E7E7CCF596F89C7D58247F2A2E9B31A81F731CC` | 2026-09-17 00:02:22.883 | Earlier final acceptance report |
| `final-reverification.md` | 24,712 | `714AA019597DB37AD34B8F70E4EB525D1E09D062A198388E81D792DD5BDB8CE2` | 2026-09-17 01:05:34.726 | Re-verification pass over the same acceptance set |
| `final-tidy-note.md` | 18,786 | `6D8D996851E2EF2854F74725C4E36FCFBB2872B7D79DB2A6D62CD6E84085CEBA` | 2026-09-29 22:03:05.312 | The three closing jobs — including §1(c), whose "20 bar rows, 0 alignment failures" claim `gantt-final-closeout.md` §1a records as false against the file |
| `focus-gap-analysis.md` | 83,137 | `982ED9F9903DB508C26EFF181EF72FB2CFC8EBB1B17FA75A50A33EFFE4AB65B8` | 2026-09-26 02:06:40.741 | Gap analysis against the topic sheet's focus requirements |
| `gantt-final-closeout.md` | 33,985 | `2471240BDCD319FBC620042449270B296769667C45817248B8B1B93DBFCC84F1` | 2026-09-29 22:11:25 | **This close-out** — the §F.3 chart census, the Stage C span resolution, the prose-rule check, the coherence check, the outline-versus-short-proposal agreement table and the final layout proof |
| `legacy-archive-note.md` | 6,891 | `95432139118A2E5610A6C142797A973FA8AFA8CE7B5FF016B6A7B1B2CEAE62A2` | 2026-09-29 21:42:02.235 | Record of what was archived out of the live tree and where it went |
| `outline-audit.md` | 68,627 | `7D232575AB1FF5127BB20F54220D7FFFCD6C48E1CA4F237EFFDD561A68793362` | 2026-09-26 02:16:37.366 | Audit of the outline draft against the frozen baseline |
| `outline-fix-log.md` | 95,479 | `7E07E4C9B5B01BD0E67C5DC493F6196153FDAA4C068D717A7B4AAFF21CD62167` | 2026-09-29 21:28:30.300 | The Revision-3 fix log; §Gates records the 2,522/2,522 coverage run and the five emphasis rewrites |
| `outline-rev2-verification.md` | 42,882 | `898F82AE96456F14D238E844C8977875C4791F8F9C98800CDAEAAE9361E9E72F` | 2026-09-29 21:16:46.355 | Verification of the Revision-2 outline (2,510/2,510 coverage) |
| `patch-application-report.md` | 21,904 | `F8AC07B80EFE7BB47B5CADB555F52F9E8E3F13D7ADFFF968A97BD08CF8657E74` | 2026-09-16 22:25:42.397 | Report of the patch-list application |
| `patch-list.md` | 76,699 | `45309E586FC736D65D961CABF3681719402F52525C8590EC7F4D92ADFE3176B4` | 2026-09-16 22:14:10.946 | The human-readable patch list applied to the corpus |
| `residual-fix-report.md` | 27,248 | `4B99F9F5630E41A674784AA10E6CEF7B974262C531C0459E59E2B6D15C4975D2` | 2026-09-16 22:29:57.792 | Residual fixes after the patch pass |
| `short-proposal-reconciliation.md` | 62,055 | `8E11659C56ED104C24973A294D8AD0E5870FEB1DAFCFA9AF934226E25FB6DF9C` | 2026-09-29 21:39:16.555 | Reconciliation of the short proposal against the outline — the property-by-property agreement record |

## 5. `proposal\research\` — the standards evidence pack

| File | Bytes | SHA-256 | Last write | Purpose |
|---|---|---|---|---|
| `wsos-2026-2447.md` | 57,405 | `737140B629312B7DB4A139C3FF9B1D6DC1DF80EF8DCB6B3B6ED05D88476688C7` | 2026-09-16 21:31:44.204 | The WSOS 2026 / Skill 2447 evidence pack: edition diff, technology audit, citable verbatim text |

## 6. `proposal\tools\i18n-p08\` — translation build products (scratch, not sources to edit)

| File | Bytes | SHA-256 | Last write | Purpose |
|---|---|---|---|---|
| `out\batch-00.md` | 40,022 | `64F99097C6A4EB1161776A2AB20E05C7709CED49EF8ABA97F3CB62F75F92B222` | 2026-09-16 23:01:02.941 | English extraction batch 00 for the section-08 translation |
| `out\batch-01.md` | 29,338 | `21A5B322569D5A5AE671524A1378459F268E10D5B69C323F455106D417D90EB3` | 2026-09-16 23:01:02.942 | English extraction batch 01 |
| `out\batch-02.md` | 61,516 | `C567C96F4B666D28616E2AB48A9FAE15EBB5624EB731D40659A92D28F1285C86` | 2026-09-16 23:01:02.942 | English extraction batch 02 |
| `out\batch-03.md` | 40,719 | `2D0128B5F4FC76A90F8F4F9ABE84C79DE92094ED43415901474E0C480CDEDF42` | 2026-09-16 23:01:02.942 | English extraction batch 03 |
| `out\batch-04.md` | 54,375 | `449F828A0EF3677F7BC64BA3E66022D9D9639309AC88F849BE0170CA5AD1BAF4` | 2026-09-16 23:01:02.942 | English extraction batch 04 |
| `out\batch-05.md` | 53,162 | `DAA1A038F39451BD75B5636D3FDDF626BD569A09C64A649159D76FDA4E9A2909` | 2026-09-16 23:01:02.943 | English extraction batch 05 |
| `out\batch-06.md` | 39,358 | `474D920A1E5569A03651F3BAA8E2A470CDE2DBAFC5D4E1BAF6553792D371F102` | 2026-09-16 23:01:02.943 | English extraction batch 06 |
| `out\batch-07.md` | 30,860 | `CA4907E5CBDC2D7A5A52E15E1C2FCA9810104306BDD7E3A7A40242179E76CD3B` | 2026-09-16 23:01:02.943 | English extraction batch 07 |
| `out\batch-08.md` | 23,158 | `E421CE4B732F11398B37CBC811C2B0407A09EB4F26127EF4FE2AA1992C05FDA0` | 2026-09-16 23:01:02.944 | English extraction batch 08 |
| `out\batch-09.md` | 25,540 | `90B242535A1A4BFA37377D90CB89242993C6B60CB138029C725B3904D2C8A06A` | 2026-09-16 23:01:02.944 | English extraction batch 09 |
| `zh\batch-00.md` | 38,365 | `A0DDC5F5A9DD35108DA9D8CF6C3CAC698C14FC2B62E5100FBC38A0EA476FE6A4` | 2026-09-16 23:06:57.908 | Chinese translation batch 00 |
| `zh\batch-01.md` | 27,496 | `18B40D51BBBBE1F8CED471BF6CEF0737B36A7696C1E2AB1273663DF160984E0C` | 2026-09-16 23:07:24.821 | Chinese translation batch 01 |
| `zh\batch-02.md` | 57,340 | `BBF2106B36A53B0A7802D00199F1182D3A826455E648B4C1C3AFEE7CC261F33A` | 2026-09-16 23:10:53.701 | Chinese translation batch 02 |
| `zh\batch-03.md` | 36,316 | `4C78F80711CC392EDA23E8073DA5C3F438AC0E1004CA66E195F13E6C29912B19` | 2026-09-16 23:10:06.511 | Chinese translation batch 03 |
| `zh\batch-04.md` | 47,623 | `C8D3F00815CF9B1B9CDD0726DCCEFB2FB1DA39C7A2A7576E64DC2863262805A5` | 2026-09-16 23:09:47.385 | Chinese translation batch 04 |
| `zh\batch-05.md` | 45,321 | `696F82A15ACE3F10DBCD07FD6221323A451766099F71AC29116D68CE7A423F1C` | 2026-09-16 23:03:47.181 | Chinese translation batch 05 |
| `zh\batch-06.md` | 35,253 | `9CF4741F896808AE1D1A97D962E613C2884433187150F5CC7564866D90B32DBA` | 2026-09-16 23:04:45.500 | Chinese translation batch 06 |
| `zh\batch-07.md` | 29,990 | `1DEB44F24397C6CF97EE206136BF4CB73B885B965445EC0C2F2B38A91934D762` | 2026-09-16 23:05:22.516 | Chinese translation batch 07 |
| `zh\batch-08.md` | 20,643 | `2F39753A0FE502F3506D1ADE37522C4299CBE5AB242587F667F7D06268D3A997` | 2026-09-16 23:08:48.805 | Chinese translation batch 08 |
| `zh\batch-09.md` | 22,413 | `A6E0DD1CA623EB31B283344226630B3DA9835672AB70FEFAE7073041B7FFC4F4` | 2026-09-16 23:10:53.671 | Chinese translation batch 09 |

## 7. `proposal\tools\md2docx\` — the converter's own documentation and fixtures

| File | Bytes | SHA-256 | Last write | Purpose |
|---|---|---|---|---|
| `README.md` | 44,797 | `D98E58A2B78B102F3F5BA94173FF6CF4C162CB3A31DB00106AFA7802B7683FCB` | 2026-09-17 01:29:20.262 | The converter's manual: CLI shapes, validator/gate descriptions, the emphasis-parser limitation, the non-idempotence note |
| `sample.md` | 5,915 | `43C7F626A6ACE284547CEBBCBF9D0A5A7B0BE5BC8AB851725D8C07A20D0092A3` | 2026-09-16 22:34:25.136 | The converter's sample input fixture (its `.docx` is 0 SDK errors / 9-of-9 package checks) |

### 7a. `proposal\tools\md2docx\stress\` — stress fixtures

| File | Bytes | SHA-256 | Last write | Purpose |
|---|---|---|---|---|
| `stress-01.md` | 593,486 | `65BEF4D31B6F6FCA6D3209870015A465E4740C0A7C82C4BBA690A6EE0A747494` | 2026-09-16 22:22:35.318 | Generated stress fixture 01 for converter volume testing |
| `stress-02.md` | 592,560 | `AD7BC5D98A2327661792EE4D5555E75489B6A293C1D3EB544E9ECE249825F84B` | 2026-09-16 22:22:35.328 | Generated stress fixture 02 |
| `stress-03.md` | 591,214 | `45A9388716CF26A12BFDC4874D1F807AAEA80AAA430CE9FC34FACD8A48E93756` | 2026-09-16 22:22:35.335 | Generated stress fixture 03 |
| `stress-04.md` | 594,090 | `792A3786F600B50A2CDD339E4B1E74BD86ED5DA4D7772215FE767F8799249659` | 2026-09-16 22:22:35.342 | Generated stress fixture 04 |
| `stress-05.md` | 590,895 | `D50D5ED9FD70546B40F7787636D084A0D39CA8A1EF3ECA99BA07447694B01FD0` | 2026-09-16 22:22:35.347 | Generated stress fixture 05 |
| `stress-06.md` | 589,155 | `6A6B61EDF4A7E34510140D283618E4FD4CC02FF569FF9429CD2BD9F3745F0F24` | 2026-09-16 22:22:35.353 | Generated stress fixture 06 |
| `stress-07.md` | 591,328 | `F0549FEF7539F42C6D6BDA4CCB198E616E9FC41961E28AA96A0C4237B8CC3274` | 2026-09-16 22:22:35.359 | Generated stress fixture 07 |
| `stress-08.md` | 594,030 | `73418489A911FA116347CC407D9BB1DCF8451E608D7B7519BAABEAD95F99946B` | 2026-09-16 22:22:35.367 | Generated stress fixture 08 |

## 8. Non-`.md` siblings in `proposal\i18n\zh-HK\` (recorded for completeness)

| File | Bytes | SHA-256 | Last write | Purpose |
|---|---|---|---|---|
| `_fidelity-report.json` | 200 | `66B1D439473F985CD163CE5C4A1EEB981E479E164B1E05FE72E5F2F54D4C044D` | 2026-09-16 22:55:53.580 | Machine-readable fidelity summary for the translation pair set |
| `_verification-report.json` | 1,713 | `4D6F065D8340574A2862B119DE55C82CB351D7ECD57ED3423D50188A682F5B0B` | 2026-09-16 22:55:53.513 | Machine-readable verification record for the same set |

---

## 9. The eleven files the earlier verifier could not check — now recorded

| File | Bytes | SHA-256 | Last write |
|---|---|---|---|
| `proposal\sections\01-introduction.md` | 115,332 | `E635EA0D820E248516A9361F8701FB212EF9EDDB53AB6B3EEE3EF94CA6689316` | 2026-09-16 23:14:23.146 |
| `proposal\sections\02-architecture.md` | 207,452 | `306E30A3C264CCCA60218BFB3EA3E6580864557C3EBEC981086C8699F0C6EC33` | 2026-09-26 03:01:34.922 |
| `proposal\sections\07-ai.md` | 137,844 | `8C0C5E4056E7985877FDF03891CC9B81DAC23766E76231FE035F671A5C541588` | 2026-09-16 23:14:25.058 |
| `proposal\i18n\zh-HK\01-introduction.md` | 102,260 | `1A4F35CF3B2643EF45192DFC6AA150223F63E434141EAB3B697320B865FA0DCC` | 2026-09-16 23:26:12.881 |
| `proposal\i18n\zh-HK\02-architecture.md` | 195,481 | `EE7C0D56F0DF53CF3902C8795C5DCFFC04F59BC5BC9A302D0E9E2990D2AB4747` | 2026-09-16 22:54:17.628 |
| `proposal\i18n\zh-HK\04-linux.md` | 270,998 | `B1E162BB25C558B16ADCC8BDF8E9364BAF3BFB656A6EB9C98AA86A07D3146FB1` | 2026-09-16 23:00:36.119 |
| `proposal\i18n\zh-HK\05-cisco.md` | 211,924 | `7C5F3159443A70591CC62564F18B16A17769A62FA862FFF4BA6FC147AE7E2BEC` | 2026-09-16 23:07:58.016 |
| `proposal\i18n\zh-HK\06-automation.md` | 295,874 | `E40E35869FC19809F5B19EEA80BE578075F082A45125A69E7DDAE66B4F977ACA` | 2026-09-16 23:10:50.778 |
| `proposal\i18n\zh-HK\07-ai.md` | 131,786 | `397635708C02300751818C57B484AD0245E8785D55F13626E82FACF595C06B9F` | 2026-09-16 23:26:12.882 |
| `proposal\i18n\zh-HK\08-project-management.md` | 389,648 | `CB414C3D027BF741B086F3DCB4E0206528A89E0612AB8FD8963DACA664C7BA30` | 2026-09-16 23:11:31.353 |
| `proposal\sections\03-microsoft.md` | 293,626 | `2539D46F2643DBFE41F488959F9EC663F2DAE81631D8D93A84F1C1ABD385124C` | 2026-09-16 22:23:23.667 |

*(The eleventh row is included because the earlier report's list named ten paths but the gap it described covered eleven files once `_translation-audit.md` and `03-microsoft.md` are considered; both are recorded above.)*

## 10. The two documents this close-out touched (for contrast — they are NOT sources)

| File | Bytes | SHA-256 | Last write |
|---|---|---|---|
| `D:\File\School\FYP\FYP-Outline-DRAFT.md` | *(final build — see `gantt-final-closeout.md` §7a)* | *(see §7a)* | 2026-09-29 |
| `D:\File\School\FYP\FYP-Outline-DRAFT.docx` | *(final build — see §7a of the same note)* | *(see §7a)* | 2026-09-29 |
| `D:\File\School\FYP\FYP-Proposal-SHORT.md` | 131,405 | `B3A933B27E5F58C7E8104831558933BD89F289FCE9C6B44A543BE93468775BD3` | 2026-09-29 21:53:40.680 |
| `D:\File\School\FYP\FYP-Proposal-SHORT.docx` | 65,799 | `869882D5140F67081D2AC0B3682F9DCF505127EA351C4C29E9B8282BA1493EA3` | 2026-09-29 21:53:41.048 |

**The short proposal was read only and is unchanged.** Its `.docx` hash matches the value recorded before this session began.
