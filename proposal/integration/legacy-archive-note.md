# Legacy archive note — superseded proposal documents moved out of the workspace root

**Date of move:** 2026-09-29, 21:41 (+08:00) — `legacy\` created 21:41:32, files verified at the new
path immediately afterwards.
**Action performed by:** delegated archive worker.
**Authorisation:** the project owner approved this move.

## Purpose

One superseded generation of proposal documents was moved out of the workspace root
`D:\File\School\FYP\` into `D:\File\School\FYP\legacy\`, so that it cannot be confused with, or
submitted alongside, the current deliverables. This note is the move record: old path, new path,
byte size and SHA-256 for each file, plus the verification result.

The superseded set assumes a Cisco Packet Tracer topology, centres the AI layer on OpenClaw, and
states that no local GPU inference is planned and that the AI line is the weakest one. The current
direction reverses those statements. See `..\..\legacy\README.md` for the reader-facing explanation.

Method: each file was **copied** to the new path, the copy was verified against the recorded byte
size and SHA-256, and only then was the original deleted. No file was deleted before its
replacement had been verified.

## Files moved (8 of 8 present and moved)

| # | File | Old path | New path | Bytes | SHA-256 | Post-move size | Post-move hash | Verified |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `FYP-Proposal-COMPLETE.docx` | `D:\File\School\FYP\FYP-Proposal-COMPLETE.docx` | `D:\File\School\FYP\legacy\FYP-Proposal-COMPLETE.docx` | 924023 | `AB7D043BC51D2E4F25C40838371643FB30DE15E29CD0E1135E5D998229DDD6EC` | 924023 | identical | PASS |
| 2 | `FYP-Proposal-Volume1-Plan.docx` | `D:\File\School\FYP\FYP-Proposal-Volume1-Plan.docx` | `D:\File\School\FYP\legacy\FYP-Proposal-Volume1-Plan.docx` | 350563 | `8448B3B7A3784C4F9E9445A0A293E4C38D07300D3BD331618D4CD5D506B1B1A2` | 350563 | identical | PASS |
| 3 | `FYP-Proposal-Volume2-Technical.docx` | `D:\File\School\FYP\FYP-Proposal-Volume2-Technical.docx` | `D:\File\School\FYP\legacy\FYP-Proposal-Volume2-Technical.docx` | 582139 | `F887312B0B60ED6E254950E5EAEE1D8A2C5D41CBF2E17786D6ABACB20E1ACEB0` | 582139 | identical | PASS |
| 4 | `FYP-Proposal-COMPLETE-ZH.docx` | `D:\File\School\FYP\FYP-Proposal-COMPLETE-ZH.docx` | `D:\File\School\FYP\legacy\FYP-Proposal-COMPLETE-ZH.docx` | 1036570 | `48F557278AD78C49C2FD101569BE2E43D9CC80952C3664C7111D8B1C052623D9` | 1036570 | identical | PASS |
| 5 | `FYP-Proposal-Volume1-Plan-ZH.docx` | `D:\File\School\FYP\FYP-Proposal-Volume1-Plan-ZH.docx` | `D:\File\School\FYP\legacy\FYP-Proposal-Volume1-Plan-ZH.docx` | 384608 | `CCF6BE9C744A157A5BC9186E19A418C72599C7330843D70D5A4D084A0B8AF166` | 384608 | identical | PASS |
| 6 | `FYP-Proposal-Volume2-Technical-ZH.docx` | `D:\File\School\FYP\FYP-Proposal-Volume2-Technical-ZH.docx` | `D:\File\School\FYP\legacy\FYP-Proposal-Volume2-Technical-ZH.docx` | 660159 | `3F409536E4633C8F06BC796568E49A635708D4E07F3FCF8D6ADF1E765C7642D2` | 660159 | identical | PASS |
| 7 | `FYP-Proposal-COMPLETE.md` | `D:\File\School\FYP\FYP-Proposal-COMPLETE.md` | `D:\File\School\FYP\legacy\FYP-Proposal-COMPLETE.md` | 1974693 | `92E3664B88B06CA51831853DF8D4856BEECBFC90DB29091B18EBF3719CC62349` | 1974693 | identical | PASS |
| 8 | `FYP-Proposal-COMPLETE-ZH.md` | `D:\File\School\FYP\FYP-Proposal-COMPLETE-ZH.md` | `D:\File\School\FYP\legacy\FYP-Proposal-COMPLETE-ZH.md` | 1880703 | `75B46A4136953F40A6196EF686E0CACBDAE165A1356498F33D83E467330232D2` | 1880703 | identical | PASS |

No file of the eight was absent.

## Verification result

**1. Byte size and SHA-256 at the new path — identical to the recorded pre-move values.**
All eight PASS; see the table above. SHA-256 was computed with `Get-FileHash -Algorithm SHA256`
before the move and again at the new path after the move; sizes came from `FileInfo.Length`.
The originals were deleted only after the copy matched on both values.

**2. Readability / structural integrity after the move.**
Checked without the Open XML SDK, without Word COM and without Word — the `.docx` files were
read only as ordinary ZIP containers via `System.IO.Compression.ZipFile` (read-only), plus a raw
4-byte file-signature read.

| File | ZIP signature | Entries | `[Content_Types].xml` | `word/document.xml` bytes |
| --- | --- | --- | --- | --- |
| `FYP-Proposal-COMPLETE.docx` | `50 4B 03 04` (PK..) | 14 | present | 9,111,132 |
| `FYP-Proposal-Volume1-Plan.docx` | `50 4B 03 04` (PK..) | 14 | present | 3,352,113 |
| `FYP-Proposal-Volume2-Technical.docx` | `50 4B 03 04` (PK..) | 14 | present | 5,761,155 |
| `FYP-Proposal-COMPLETE-ZH.docx` | `50 4B 03 04` (PK..) | 14 | present | 8,948,981 |
| `FYP-Proposal-Volume1-Plan-ZH.docx` | `50 4B 03 04` (PK..) | 14 | present | 3,264,127 |
| `FYP-Proposal-Volume2-Technical-ZH.docx` | `50 4B 03 04` (PK..) | 14 | present | 5,686,971 |

All six `.docx` files: ZIP central directory readable, `word/document.xml` present and non-empty —
PASS.

The two Markdown files were decoded as UTF-8 with
`[System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)` (not `Get-Content -Raw`), and
their content is intact:

| File | Characters | Lines | U+FFFD replacement chars | Leading content |
| --- | --- | --- | --- | --- |
| `FYP-Proposal-COMPLETE.md` | 1,965,735 | 21,055 | 0 | `<!--\n  FYP-Proposal-COMPLETE.md - portability fallback of th...` |
| `FYP-Proposal-COMPLETE-ZH.md` | 1,230,733 | 20,447 | 0 | `<!--\n  FYP-Proposal-COMPLETE-ZH.md — 完整畢業專題計劃書（繁體中文）的可攜性備份。...` |

**3. Workspace root cleared of the eight.**
None of the eight file names exists at the workspace root any more. Workspace-root listing
(top level) after the move:

```
DIR           legacy
DIR           proposal
     30,949   AY2627_FYP topics_v2_Victor Li.docx
    137,715   FYP-Outline-DRAFT.docx
    259,634   FYP-Outline-DRAFT.md
     66,980   FYP-Proposal-SHORT.docx
    135,738   FYP-Proposal-SHORT.md
    141,462   image.png
```

**4. Protected files — not touched.**
`AY2627_FYP topics_v2_Victor Li.docx`: 30,949 bytes and SHA-256
`1B847CF41700BD1DB3C0E3D5E540BC349674A8177B057AD9AC09F897B4AAFB4E` — both match the expected
values. `image.png`: 141,462 bytes — matches. Neither was opened with the Open XML SDK, Word COM
or Word.

`FYP-Outline-DRAFT.md`/`.docx`, `FYP-Proposal-SHORT.md`/`.docx` and everything under `proposal\`
were not modified; the four current deliverables remain at the root, and the only additions to the
tree are the `legacy\` directory (with its contents) and this note.

## Additions made by this operation

- `D:\File\School\FYP\legacy\` — the archive directory, containing the eight files above.
- `D:\File\School\FYP\legacy\README.md` — reader-facing explanation of the archive.
- `D:\File\School\FYP\proposal\integration\legacy-archive-note.md` — this note.

Nothing else was created, moved or changed.
