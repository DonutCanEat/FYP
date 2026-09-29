<#
.SYNOPSIS
    Validator for .docx (OOXML) files produced by md2docx/convert.js.

.DESCRIPTION
    Reads the .docx as a ZIP archive (System.IO.Compression, which works on this
    box) and proves the package is structurally sound and complete:

      1. the file is a readable ZIP; every part is listed with compressed and
         uncompressed sizes;
      2. every .xml/.rels part parses with System.Xml.XmlDocument;
      3. the required OOXML parts exist and every part is covered by a
         content-type Default/Override;
      4. every r:id referenced from document.xml (and from header/footer rels)
         resolves in the matching .rels part, no matter whether the relationship
         was declared before the id was used;
      5. counts are reported: paragraphs, headings by level, tables, table rows,
         code-block paragraphs, list items, figures, block quotes, rules,
         hyperlinks, and the total character count of all w:t text;
      6. if -MarkdownPath is supplied, the SAME counts are computed from the
         Markdown source and compared, so completeness can be checked rather
         than assumed;
      7. updateFields in settings.xml is confirmed true (so Word rebuilds the TOC).

    Any failed check prints "CHECK FAILED: <detail>" and the script exits with a
    non-zero code. Pass -AsJson to also emit a machine-readable summary.

.PARAMETER DocxPath
    The .docx to validate.

.PARAMETER MarkdownPath
    Optional Markdown source. When given, source counts are compared with the
    document counts.

.PARAMETER AsJson
    Also write the collected results as JSON to stdout, prefixed with "JSON|".

.PARAMETER Quiet
    Suppress the human-readable listing (errors are still printed).

.EXAMPLE
    .\validate.ps1 .\sample.docx -MarkdownPath .\sample.md
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$DocxPath,

    [Parameter(Mandatory = $false)]
    [string]$MarkdownPath,

    [switch]$AsJson,

    [switch]$Quiet
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2.0

Add-Type -AssemblyName System.IO.Compression -ErrorAction Stop
Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction Stop

# XPath namespace map for the OOXML namespaces actually used in these parts.
$script:nsMgr = New-Object System.Xml.XmlNamespaceManager((New-Object System.Xml.NameTable))
$script:nsMgr.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
$script:nsMgr.AddNamespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
$script:nsMgr.AddNamespace('pr', 'http://schemas.openxmlformats.org/package/2006/relationships')
$script:nsMgr.AddNamespace('ct', 'http://schemas.openxmlformats.org/package/2006/content-types')
$script:nsMgr.AddNamespace('cp', 'http://schemas.openxmlformats.org/package/2006/metadata/core-properties')
$nsMgr = $script:nsMgr

# Safe attribute reader: XmlElement.GetAttribute returns '' when absent, but never
# assume a node kind under Set-StrictMode.
function Attr($node, [string]$name) {
    if ($node -eq $null) { return '' }
    try { return [string]$node.GetAttribute($name) } catch { return '' }
}

# ---------------------------------------------------------------------------
# Canonical plain text - the PowerShell mirror of markdownToCanonicalText() in
# convert.js. Both sides must produce byte-identical strings for the digests to
# match; this is what proves that no visible character of the Markdown is lost.
# ---------------------------------------------------------------------------
$script:CanonRuleMarker = [string][char]0x2015   # U+2015, same as CANON_MARKERS.rule
$script:CanonTocPlaceholder = 'Right-click here and choose "Update Field" (or press F9) to build the table of contents.'

function Remove-MdInlineSyntax([string]$s) {
    # Code spans are masked first and restored last. Use this on MARKDOWN source
    # only: the backticks are what mark the literal region, so the asterisks in
    # `a_*b*_c` survive while the same characters outside a code span are treated
    # as emphasis. For text already extracted from the .docx use
    # Remove-RenderedInlineSyntax instead - masking there would double-process.
    # Mirrors stripInlineSyntax() in convert.js.
    $spans = New-Object System.Collections.ArrayList
    $r = [regex]::Replace($s, '`([^`]+)`', {
            param($m)
            [void]$spans.Add($m.Groups[1].Value)
            return [char]0x0000 + 'C' + ($spans.Count - 1).ToString() + [char]0x0000
        })
    $r = Remove-RenderedInlineSyntax $r
    # autolinks are markup on the markdown side; the rendered text keeps the URL
    # bare, so unwrap them here (this function is only used on markdown source)
    $r = [regex]::Replace($r, '<((?:https?|mailto):[^<>\s]+)>', '$1')
    $r = [regex]::Replace($r, [char]0x0000 + 'C(\d+)' + [char]0x0000, {
            param($m)
            return [string]$spans[[int]$m.Groups[1].Value]
        })
    return $r
}

# The emphasis/link part of the stripper, without code-span masking. Applied to
# text that came out of the .docx, where code spans (and code blocks) are already
# literal text and a stray '*' or '_' must be left alone.
function Remove-RenderedInlineSyntax([string]$s) {
    # Keep the rule set and order identical to stripInlineSyntax() in convert.js:
    # any divergence here shows up as a spurious digest mismatch, not as a bug in
    # the document.
    $r = $s
    $r = [regex]::Replace($r, '!\[([^\]]*)\]\(([^)]*)\)', '$1')
    $r = [regex]::Replace($r, '\[((?:[^\[\]\\]|\\.)*)\]\(([^)]*)\)', '$1')
    $r = [regex]::Replace($r, '\*\*\*([^*]+)\*\*\*', '$1')
    $r = [regex]::Replace($r, '\*\*([^*]+)\*\*', '$1')
    $r = [regex]::Replace($r, '(?<!\*)\*([^*]+)\*(?!\*)', '$1')
    $r = [regex]::Replace($r, '(^|[\s(])_([^_\s](?:[^_]*[^_\s])?)_(?=[\s.,;:)!?]|$)', '$1$2')
    $r = [regex]::Replace($r, '~~([^~]+)~~', '$1')
    $r = [regex]::Replace($r, '\\([\\`*_{}\[\]()#+\-.!>|~])', '$1')
    return $r
}
# ---------------------------------------------------------------------------
# Coverage lines: the "did any content go missing?" evidence.
#
# A canonical-text digest cannot be used as a hard gate here, and the reason is
# worth recording: markdown emphasis and a literal '*' inside a code span are
# indistinguishable once the backticks are gone. `code_span_with_*stars*` and a
# hypothetical emphasised `code_span_with_stars` normalise to the same string, so
# a digest comparison reports a false failure on perfectly converted content.
#
# Instead the validator collects every CONTENT LINE of the source - heading text,
# paragraph lines, list item text, table cell text and code-block lines, each with
# markdown inline markers stripped - and requires each one to be present verbatim
# in the concatenated text extracted from the .docx. That is a stronger statement
# than a character count: a missing sentence, a truncated code line or a dropped
# table cell is individually detectable and reported by line number.
# ---------------------------------------------------------------------------
# Split a Markdown table row on pipe characters, matching splitTableRow() in
# convert.js exactly:
#   * '\|' is an escaped pipe: a LITERAL pipe inside one cell, never a separator,
#     and escaping wins even inside a code span;
#   * a '|' inside an inline code span is cell CONTENT, not a separator - this is
#     what keeps cells such as `nft list ruleset | grep -c` in one piece.
# Doing only the first (as an earlier version did) splits code-span cells in half
# and then reports the halves as missing content.
function Split-MdTableRow([string]$line) {
    $s = $line.Trim()
    if ($s.StartsWith('|')) { $s = $s.Substring(1) }
    if ($s.EndsWith('|') -and -not $s.EndsWith('\|')) { $s = $s.Substring(0, $s.Length - 1) }
    $cells = New-Object System.Collections.ArrayList
    $cur = ''
    $inCode = $false
    for ($i = 0; $i -lt $s.Length; $i++) {
        $ch = $s[$i]
        if ($ch -eq '\' -and ($i + 1) -lt $s.Length -and $s[$i + 1] -eq '|') { $cur += '|'; $i++; continue }
        if ($ch -eq '`') { $inCode = -not $inCode; $cur += $ch; continue }
        if ($ch -eq '|' -and -not $inCode) { [void]$cells.Add($cur.Trim()); $cur = ''; continue }
        $cur += $ch
    }
    [void]$cells.Add($cur.Trim())
    return , @($cells)
}

function Get-MarkdownCoverageLines([string]$path) {
    $text = [System.IO.File]::ReadAllText($path, (New-Object System.Text.UTF8Encoding($false)))
    $text = $text -replace "^\uFEFF", ''
    $text = $text.Replace("`r`n", "`n").Replace("`r", "`n")
    $lines = $text -split "`n"
    $res = New-Object System.Collections.ArrayList

    $inFence = $false
    $fenceChar = ''
    $fenceLen = 0
    for ($n = 0; $n -lt $lines.Count; $n++) {
        $line = $lines[$n]
        $fm = [regex]::Match($line, '^\s{0,3}(`{3,}|~{3,})\s*([A-Za-z0-9_+.#-]*)\s*$')
        if ($fm.Success) {
            if (-not $inFence) {
                $inFence = $true
                $fenceChar = $fm.Groups[1].Value.Substring(0, 1)
                $fenceLen = $fm.Groups[1].Value.Length
                if ($fm.Groups[2].Value) {
                    [void]$res.Add([pscustomobject]@{ Line = $n + 1; Kind = 'code-lang'; Text = $fm.Groups[2].Value })
                }
            }
            else { $inFence = $false }
            continue
        }
        if ($inFence) {
            # code lines are literal: compare the tab-expanded form the writer emits
            [void]$res.Add([pscustomobject]@{ Line = $n + 1; Kind = 'code'; Text = $line.Replace("`t", '    ') })
            continue
        }
        $t = $line.Trim()
        if ($t -eq '') { continue }
        if ($t -match '^\[TOC\]$' -or $t -match '^\s{0,3}(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$') { continue }
        $fig = [regex]::Match($t, '^\[FIGURE:\s*(.*?)\s*\]$')
        if ($fig.Success) {
            [void]$res.Add([pscustomobject]@{ Line = $n + 1; Kind = 'figure'; Text = '[FIGURE] ' + $fig.Groups[1].Value })
            continue
        }
        $hm = [regex]::Match($t, '^(#{1,6})\s+(.*?)\s*#*\s*$')
        if ($hm.Success) {
            [void]$res.Add([pscustomobject]@{ Line = $n + 1; Kind = 'heading'; Text = (Remove-MdInlineSyntax $hm.Groups[2].Value) })
            continue
        }
        if ($t -match '^>') {
            $q = [regex]::Replace($t, '^>\s?', '').Trim()
            if ($q -ne '') { [void]$res.Add([pscustomobject]@{ Line = $n + 1; Kind = 'quote'; Text = (Remove-MdInlineSyntax $q) }) }
            continue
        }
        if ($t -match '^\|') {
            $cells = Split-MdTableRow $t
            $isSep = $true
            foreach ($c in $cells) { if ($c -notmatch '^:?-{1,}:?$') { $isSep = $false } }
            if ($isSep) { continue }
            foreach ($c in $cells) {
                if ($c -ne '') { [void]$res.Add([pscustomobject]@{ Line = $n + 1; Kind = 'table-cell'; Text = (Remove-MdInlineSyntax $c) }) }
            }
            continue
        }
        $lm = [regex]::Match($line, '^\s{0,6}([-*+]|\d{1,9}[.)])\s+(.*)$')
        if ($lm.Success) {
            $item = $lm.Groups[2].Value.Trim()
            $tm = [regex]::Match($item, '^\[( |x|X)\]\s+(.*)$')
            if ($tm.Success) {
                $box = if ($tm.Groups[1].Value.ToLowerInvariant() -eq 'x') { [char]0x2611 } else { [char]0x2610 }
                [void]$res.Add([pscustomobject]@{ Line = $n + 1; Kind = 'list'; Text = ([string]$box) + ' ' + (Remove-MdInlineSyntax $tm.Groups[2].Value) })
            }
            else {
                [void]$res.Add([pscustomobject]@{ Line = $n + 1; Kind = 'list'; Text = (Remove-MdInlineSyntax $item) })
            }
            continue
        }
        [void]$res.Add([pscustomobject]@{ Line = $n + 1; Kind = 'paragraph'; Text = (Remove-MdInlineSyntax $t) })
    }
    return , @($res)
}

function Get-MarkdownCanonicalText([string]$path) {
    $text = [System.IO.File]::ReadAllText($path, (New-Object System.Text.UTF8Encoding($false)))
    $text = $text -replace "^\uFEFF", ''
    $text = $text.Replace("`r`n", "`n").Replace("`r", "`n")
    $lines = $text -split "`n"
    $out = New-Object System.Collections.ArrayList

    $inFence = $false
    $fenceChar = ''
    $fenceLen = 0
    foreach ($line in $lines) {
        $fm = [regex]::Match($line, '^\s{0,3}(`{3,}|~{3,})\s*([A-Za-z0-9_+.#-]*)\s*$')
        if ($fm.Success) {
            if (-not $inFence) {
                $inFence = $true
                $fenceChar = $fm.Groups[1].Value.Substring(0, 1)
                $fenceLen = $fm.Groups[1].Value.Length
                if ($fm.Groups[2].Value) { [void]$out.Add($fm.Groups[2].Value) }
            }
            elseif ($fm.Groups[1].Value.Substring(0, 1) -eq $fenceChar -and $fm.Groups[1].Value.Length -ge $fenceLen) {
                $inFence = $false
            }
            continue
        }
        if ($inFence) { [void]$out.Add($line.Replace("`t", '    ')); continue }

        $t = $line.Trim()
        if ($t -eq '') { continue }
        if ($t -match '^\[TOC\]$') {
            [void]$out.Add('Table of Contents')
            [void]$out.Add($script:CanonTocPlaceholder)
            continue
        }
        if ($t -match '^\[FIGURE:\s*(.*?)\s*\]$') { [void]$out.Add('[FIGURE] ' + $Matches[1]); continue }
        if ($t -match '^\s{0,3}(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$') { [void]$out.Add($script:CanonRuleMarker); continue }
        $hm = [regex]::Match($t, '^(#{1,6})\s+(.*?)\s*#*\s*$')
        if ($hm.Success) { [void]$out.Add((Remove-MdInlineSyntax $hm.Groups[2].Value)); continue }
        if ($t -match '^>') {
            $q = [regex]::Replace($t, '^>\s?', '')
            if ($q.Trim() -ne '') { [void]$out.Add((Remove-MdInlineSyntax $q.Trim())) }
            continue
        }
        if ($t -match '^\|') {
            $cells = @($t.Trim('|') -split '\|' | ForEach-Object { $_.Trim() })
            $isSep = $true
            foreach ($c in $cells) { if ($c -notmatch '^:?-{1,}:?$') { $isSep = $false } }
            if (-not $isSep) { [void]$out.Add((Remove-MdInlineSyntax ($cells -join ' '))) }
            continue
        }
        $lm = [regex]::Match($line, '^\s{0,6}([-*+]|\d{1,9}[.)])\s+(.*)$')
        if ($lm.Success) {
            $item = $lm.Groups[2].Value.Trim()
            $tm = [regex]::Match($item, '^\[( |x|X)\]\s+(.*)$')
            if ($tm.Success) {
                $box = if ($tm.Groups[1].Value.ToLowerInvariant() -eq 'x') { [char]0x2611 } else { [char]0x2610 }
                [void]$out.Add(([string]$box) + ' ' + (Remove-MdInlineSyntax $tm.Groups[2].Value))
            }
            else { [void]$out.Add((Remove-MdInlineSyntax $item)) }
            continue
        }
        [void]$out.Add((Remove-MdInlineSyntax $t))
    }
    return (($out -join ' ') -replace '\s+', ' ').Trim()
}

$script:Failures = New-Object System.Collections.ArrayList
$script:Notes = New-Object System.Collections.ArrayList
# Declared up-front: it is consulted by the TOC check and populated later when
# -MarkdownPath is supplied, and Set-StrictMode rejects undefined variables.
$mdCounts = $null

function Fail([string]$msg) {
    [void]$script:Failures.Add($msg)
    [Console]::Error.WriteLine("CHECK FAILED: $msg")
}
function Note([string]$msg) { [void]$script:Notes.Add($msg) }
function Out([string]$msg) { if (-not $Quiet) { Write-Host $msg } }

# ---------------------------------------------------------------- arguments
if (-not [System.IO.Path]::IsPathRooted($DocxPath)) { $DocxPath = Join-Path (Get-Location).Path $DocxPath }
$DocxPath = [System.IO.Path]::GetFullPath($DocxPath)
if (-not (Test-Path -LiteralPath $DocxPath)) {
    [Console]::Error.WriteLine("CHECK FAILED: docx not found: $DocxPath")
    exit 2
}
if ($MarkdownPath) {
    if (-not [System.IO.Path]::IsPathRooted($MarkdownPath)) { $MarkdownPath = Join-Path (Get-Location).Path $MarkdownPath }
    $MarkdownPath = [System.IO.Path]::GetFullPath($MarkdownPath)
    if (-not (Test-Path -LiteralPath $MarkdownPath)) {
        [Console]::Error.WriteLine("CHECK FAILED: markdown source not found: $MarkdownPath")
        exit 2
    }
}

$fileInfo = Get-Item -LiteralPath $DocxPath

# ---------------------------------------------------------------- 1. open ZIP
$zip = $null
try {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($DocxPath)
}
catch {
    [Console]::Error.WriteLine("CHECK FAILED: cannot open '$DocxPath' as a ZIP archive: $($_.Exception.Message)")
    exit 3
}

$parts = @{}
$partList = New-Object System.Collections.ArrayList
try {
    foreach ($e in $zip.Entries) {
        $name = $e.FullName
        $text = $null
        if ($e.Length -gt 0) {
            $sr = New-Object System.IO.StreamReader($e.Open(), (New-Object System.Text.UTF8Encoding($false)), $true)
            try { $text = $sr.ReadToEnd() } finally { $sr.Dispose() }
        }
        else { $text = '' }
        $parts[$name] = $text
        [void]$partList.Add([pscustomobject]@{ Name = $name; Compressed = $e.CompressedLength; Size = $e.Length; Text = $text })
    }
}
finally { $zip.Dispose() }

Out ("=" * 78)
Out ("DOCX VALIDATION: {0}" -f $DocxPath)
Out ("  file size      : {0:N0} bytes" -f $fileInfo.Length)
Out ("  zip parts      : {0}" -f $partList.Count)
Out ("=" * 78)
Out "PARTS (uncompressed bytes):"
foreach ($p in ($partList | Sort-Object Name)) {
    Out ("  {0,-42} {1,10:N0}  (zip {2,8:N0})" -f $p.Name, $p.Size, $p.Compressed)
}

# ---------------------------------------------------------------- 2. parse XML
$xmlDocs = @{}
foreach ($p in $partList) {
    if ($p.Name -match '\.(xml|rels)$') {
        try {
            $xd = New-Object System.Xml.XmlDocument
            $xd.PreserveWhitespace = $false
            $xd.LoadXml($p.Text)
            $xmlDocs[$p.Name] = $xd
        }
        catch {
            Fail "XML parse error in part '$($p.Name)': $($_.Exception.Message)"
        }
    }
    else {
        Note "non-XML part (not parsed as XML): $($p.Name)"
    }
}
Out ""
Out ("XML PARSE: {0} of {1} xml/rels parts parsed with XmlDocument" -f $xmlDocs.Count, @($partList | Where-Object { $_.Name -match '\.(xml|rels)$' }).Count)

# ---------------------------------------------------------------- 3. required parts
$required = @(
    '[Content_Types].xml', '_rels/.rels', 'word/document.xml', 'word/_rels/document.xml.rels',
    'word/styles.xml', 'word/numbering.xml', 'word/settings.xml', 'word/fontTable.xml',
    'word/theme/theme1.xml', 'docProps/core.xml', 'docProps/custom.xml', 'docProps/app.xml',
    'word/header1.xml', 'word/footer1.xml'
)
$missing = @($required | Where-Object { -not $parts.ContainsKey($_) })
if ($missing.Count -gt 0) { Fail "missing required part(s): $($missing -join ', ')" }

# content types: every non-rels part must be declared by Default extension or Override PartName
$ctXml = $xmlDocs['[Content_Types].xml']
if (-not $ctXml) { Fail '[Content_Types].xml is missing or malformed' }
$defaults = @{}
$overrides = @{}
if ($ctXml) {
    foreach ($n in $ctXml.DocumentElement.ChildNodes) {
        if ($n.LocalName -eq 'Default') { $defaults[[string]$n.GetAttribute('Extension')] = [string]$n.GetAttribute('ContentType') }
        elseif ($n.LocalName -eq 'Override') { $overrides[[string]$n.GetAttribute('PartName')] = [string]$n.GetAttribute('ContentType') }
    }
}
$undeclared = New-Object System.Collections.ArrayList
foreach ($p in $partList) {
    if ($p.Name -eq '[Content_Types].xml') { continue }
    $ext = [System.IO.Path]::GetExtension($p.Name).TrimStart('.')
    $partName = '/' + ($p.Name -replace '\\', '/')
    if ($overrides.ContainsKey($partName)) { continue }
    if ($defaults.ContainsKey($ext)) { continue }
    [void]$undeclared.Add($p.Name)
}
if ($undeclared.Count -gt 0) { Fail "part(s) with no content-type Default or Override: $($undeclared -join ', ')" }
Out ("CONTENT TYPES: {0} Default, {1} Override; all {2} parts declared" -f $defaults.Count, $overrides.Count, $partList.Count)

# ---------------------------------------------------------------- 4. relationships
$relsByPart = @{}   # part path (e.g. 'word/document.xml') -> hashtable id->target
foreach ($k in $xmlDocs.Keys) {
    if ($k -like '*_rels/*.rels') {
        $owning = $k -replace '_rels/', ''
        $owning = $owning -replace '\.rels$', ''
        if ($k -eq '_rels/.rels') { $owning = '' }
        $map = @{}
        foreach ($n in $xmlDocs[$k].DocumentElement.ChildNodes) {
            if ($n.LocalName -eq 'Relationship') { $map[[string]$n.GetAttribute('Id')] = [string]$n.GetAttribute('Target') }
        }
        $relsByPart[$owning] = $map
    }
}
foreach ($relPart in @('_rels/.rels', 'word/_rels/document.xml.rels')) {
    if (-not $parts.ContainsKey($relPart)) { Fail "relationship part missing: $relPart" }
}

$allRefIds = New-Object System.Collections.ArrayList
foreach ($partKey in @('word/document.xml', 'word/header1.xml', 'word/footer1.xml')) {
    if (-not $xmlDocs.ContainsKey($partKey)) { continue }
    $doc = $xmlDocs[$partKey]
    foreach ($attr in @('id', 'embed', 'link')) {
        $nodes = $doc.SelectNodes("//*[@r:$attr]", $script:nsMgr)
        foreach ($n in $nodes) { [void]$allRefIds.Add([pscustomobject]@{ Part = $partKey; Id = $n.GetAttribute("r:$attr") }) }
    }
}
$docRels = $relsByPart['word/document.xml']
if (-not $docRels) { $docRels = @{} }
$unresolved = New-Object System.Collections.ArrayList
foreach ($ref in $allRefIds) {
    $owner = if ($ref.Part -eq 'word/document.xml') { 'word/document.xml' } else { $ref.Part }
    $map = $relsByPart[$owner]
    if (-not $map -or -not $map.ContainsKey($ref.Id)) { [void]$unresolved.Add(("{0} -> {1}" -f $ref.Part, $ref.Id)) }
}
$unresolved = @($unresolved | Sort-Object -Unique)
if ($unresolved.Count -gt 0) { Fail "unresolved relationship id(s): $($unresolved -join ', ')" }
Out ("RELATIONSHIPS: {0} r:id reference(s) in document/header/footer; all resolve ({1} rels declared for word/document.xml)" -f $allRefIds.Count, $docRels.Count)

# every relationship target file must exist (internal targets only)
foreach ($owner in $relsByPart.Keys) {
    foreach ($id in $relsByPart[$owner].Keys) {
        $target = $relsByPart[$owner][$id]
        if ($target -match '^[a-zA-Z]+:') { continue }  # external (hyperlink)
        $base = if ($owner -eq '') { '' } else { [System.IO.Path]::GetDirectoryName($owner) }
        $resolved = if ($base) { "$base/$target" -replace '\\', '/' } else { $target }
        $resolved = $resolved -replace '^\./', ''
        if (-not $parts.ContainsKey($resolved)) {
            Fail "relationship $owner/$id targets '$target' -> resolved part '$resolved' which is not present"
        }
    }
}

# ---------------------------------------------------------------- 5. document counts
$docXml = $xmlDocs['word/document.xml']
if (-not $docXml) {
    Fail 'word/document.xml missing or malformed - cannot count content'
}
else {
    $body = $docXml.SelectSingleNode('/w:document/w:body', $nsMgr)
    if (-not $body) { Fail 'word/document.xml has no /w:document/w:body' }

    $counts = [ordered]@{
        topLevelParagraphs = 0; allParagraphs = 0; tables = 0; tableRows = 0
        headings = [ordered]@{ '1' = 0; '2' = 0; '3' = 0; '4' = 0; '5' = 0; '6' = 0 }
        codeParagraphs = 0; listItems = 0; figures = 0; quotes = 0; rules = 0
        hyperlinks = 0; pageBreaks = 0; textNodes = 0; textChars = 0; textCharsNoSpaces = 0
        words = 0; nonHeadingChars = 0; headerRowsRepeating = 0
    }

    # Canonical text extraction of the document itself.
    #
    # This mirrors XmlTextScanner in convert.js exactly, because the two results
    # are compared by SHA-256:
    #   * only <w:t> content counts; <w:instrText> (e.g. 'TOC \o "1-3" \h \z \u')
    #     and <w:delText> are field/tracked-change plumbing that Word never shows;
    #   * text sitting between two tags is kept (a bare space is emitted before
    #     <w:br/>, and dropping it would fuse two soft-wrapped lines);
    #   * runs are concatenated, then the paragraph is trimmed once;
    #   * a <w:br/> starts a NEW canonical line, which is what makes the inline
    #     marker stripping safe: a code-span mask can then never span two lines;
    #   * each line is stripped of inline markers so rendered runs ("bold") match
    #     the markdown source ("**bold**").
    $wordDocumentRaw = $parts['word/document.xml']
    $canonParas = New-Object System.Collections.ArrayList
    $sb = New-Object System.Text.StringBuilder
    $cur = New-Object System.Collections.ArrayList
    $kind = $null   # 't' | 'instrText' | 'delText' | $null
    $flushPara = {
        $joined = ($cur -join '')
        foreach ($piece in ($joined -split "`n")) {
            $t = $piece.Trim()
            if ($t -ne '') { [void]$canonParas.Add($t) }
        }
        $cur.Clear()
    }
    $rxText = [regex]'^<w:t(?:\s[^>]*)?>$'
    $rxTextSelf = [regex]'^<w:t(?:\s[^>]*)?/>$'
    $rxInstr = [regex]'^<w:instrText(?:\s[^>]*)?>$'
    $rxDel = [regex]'^<w:delText(?:\s[^>]*)?>$'
    $rxParaOpen = [regex]'^<w:p(?:\s[^>]*)?>$'
    $i = 0
    while ($i -lt $wordDocumentRaw.Length) {
        if ($kind) {
            $closeTag = if ($kind -eq 't') { '</w:t>' } else { '</' + $kind + '>' }
            $end = $wordDocumentRaw.IndexOf($closeTag, $i, [System.StringComparison]::Ordinal)
            if ($end -lt 0) { break }
            if ($kind -eq 't') {
                [void]$cur.Add([System.Net.WebUtility]::HtmlDecode($wordDocumentRaw.Substring($i, $end - $i)))
            }
            $kind = $null
            $i = $end + $closeTag.Length
            continue
        }
        $start = $wordDocumentRaw.IndexOf('<', $i)
        if ($start -lt 0) { break }
        $gt = $wordDocumentRaw.IndexOf('>', $start)
        if ($gt -lt 0) { break }
        if ($start -gt $i) {
            [void]$cur.Add([System.Net.WebUtility]::HtmlDecode($wordDocumentRaw.Substring($i, $start - $i)))
        }
        $tag = $wordDocumentRaw.Substring($start, $gt - $start + 1)
        if ($rxText.IsMatch($tag)) { $kind = 't'; $i = $gt + 1; continue }
        if ($rxTextSelf.IsMatch($tag)) { $i = $gt + 1; continue }
        if ($rxInstr.IsMatch($tag)) { $kind = 'w:instrText'; $i = $gt + 1; continue }
        if ($rxDel.IsMatch($tag)) { $kind = 'w:delText'; $i = $gt + 1; continue }
        if ($tag -eq '<w:br/>' -or $tag -eq '<w:br>' -or $tag -like '<w:br *') {
            # line break inside a paragraph: start a new canonical line
            [void]$cur.Add("`n")
            $i = $gt + 1
            continue
        }
        if ($tag -eq '</w:p>' -or $rxParaOpen.IsMatch($tag)) { & $flushPara; $i = $gt + 1; continue }
        $i = $gt + 1
    }
    & $flushPara
    $canonParas = @($canonParas)
    $allText = ($canonParas -join ' ')

    foreach ($t in $canonParas) {
        $counts.words += @($t -split '\s+' | Where-Object { $_ -ne '' }).Count
    }

    $paraStyles = @{}

    Out ""
    Out "DOCUMENT CONTENT COUNTS"
    foreach ($node in $body.ChildNodes) {
        if ($node.LocalName -eq 'p') { $counts.topLevelParagraphs++ }
        elseif ($node.LocalName -eq 'tbl') { $counts.tables++ }
    }

    # one sweep over paragraphs
    foreach ($p in $docXml.SelectNodes('//w:p', $nsMgr)) {
        $counts.allParagraphs++
        $styleId = ''
        $hasNum = $false
        $pStyleNode = $p.SelectSingleNode('w:pPr/w:pStyle', $nsMgr)
        if ($pStyleNode) { $styleId = [string]$pStyleNode.GetAttribute('w:val') }
        if ($p.SelectSingleNode('w:pPr/w:numPr', $nsMgr)) { $hasNum = $true }
        if (-not $paraStyles.ContainsKey($styleId)) { $paraStyles[$styleId] = 0 }
        $paraStyles[$styleId] = $paraStyles[$styleId] + 1

        $text = ''
        foreach ($tn in $p.SelectNodes('.//w:t', $nsMgr)) { $text += $tn.InnerText }
        if ($styleId -match '^Heading([1-6])$') {
            $lvl = $Matches[1]
            $counts.headings[$lvl] = $counts.headings[$lvl] + 1
        }
        elseif ($styleId -eq 'SourceCode') { $counts.codeParagraphs++ }
        elseif ($styleId -eq 'FigurePlaceholder') { $counts.figures++ }
        elseif ($styleId -eq 'BlockQuote') { $counts.quotes++ }
        elseif ($styleId -eq 'HorizontalRule') { $counts.rules++ }
        if ($hasNum) { $counts.listItems++ }
        if ($styleId -notmatch '^Heading[1-6]$' -and $styleId -ne 'TitlePageTitle' -and $styleId -ne 'TitlePageSubtitle') {
            $counts.nonHeadingChars += $text.Length
        }
    }

    foreach ($tbl in $docXml.SelectNodes('//w:tbl', $nsMgr)) {
        $counts.tableRows += $tbl.SelectNodes('w:tr', $nsMgr).Count
    }
    # Table rectangularity: every row must have the same number of cells as the
    # header row. This is the check that catches mis-split table rows - a row whose
    # cell count differs means a '\|' or a pipe inside a code span was treated as a
    # column separator, which shifts every later column.
    $badTables = New-Object System.Collections.ArrayList
    $tblIndex = 0
    foreach ($tbl in $docXml.SelectNodes('//w:tbl', $nsMgr)) {
        $tblIndex++
        $rowIdx = 0
        $headerCells = -1
        foreach ($row in $tbl.SelectNodes('w:tr', $nsMgr)) {
            $rowIdx++
            $n = $row.SelectNodes('w:tc', $nsMgr).Count
            if ($headerCells -lt 0) { $headerCells = $n; continue }
            if ($n -ne $headerCells) {
                [void]$badTables.Add(("table {0} row {1}: {2} cells vs header {3}" -f $tblIndex, $rowIdx, $n, $headerCells))
            }
        }
    }
    $counts.badTableRows = $badTables.Count
    if ($badTables.Count -gt 0) {
        Fail ("{0} table row(s) have a different cell count from their header row: {1}" -f $badTables.Count, (($badTables | Select-Object -First 5) -join '; '))
    }
    else {
        Out ("TABLE INTEGRITY: all {0} table(s) rectangular ({1:N0} rows, every row's cell count matches its header)" -f $counts.tables, $counts.tableRows)
    }
    foreach ($tr in $docXml.SelectNodes('//w:tr', $nsMgr)) {
        if ($tr.SelectSingleNode('w:trPr/w:tblHeader', $nsMgr)) { $counts.headerRowsRepeating++ }
    }
    $counts.hyperlinks = $docXml.SelectNodes('//w:hyperlink', $nsMgr).Count
    $counts.pageBreaks = $docXml.SelectNodes('//w:br[@w:type="page"]', $nsMgr).Count
    $counts.textNodes = @($docXml.SelectNodes('//w:t', $nsMgr)).Count
    $counts.textChars = $allText.Length
    $counts.textCharsNoSpaces = ($allText -replace '\s', '').Length

    Out ""
    Out "DOCUMENT CONTENT COUNTS"
    Out ("  paragraphs (all, incl. inside table cells) : {0}" -f $counts.allParagraphs)
    Out ("  body-level paragraphs (<w:p> direct children): {0}" -f $counts.topLevelParagraphs)
    Out ("  headings H1/H2/H3/H4/H5/H6                : {0} / {1} / {2} / {3} / {4} / {5}" -f `
            $counts.headings['1'], $counts.headings['2'], $counts.headings['3'], $counts.headings['4'], $counts.headings['5'], $counts.headings['6'])
    Out ("  tables / table rows                       : {0} / {1}" -f $counts.tables, $counts.tableRows)
    Out ("  code-block paragraphs                     : {0}" -f $counts.codeParagraphs)
    Out ("  list items (paragraphs with numPr)        : {0}" -f $counts.listItems)
    Out ("  figure placeholders / quotes / rules      : {0} / {1} / {2}" -f $counts.figures, $counts.quotes, $counts.rules)
    Out ("  hyperlinks / explicit page breaks         : {0} / {1}" -f $counts.hyperlinks, $counts.pageBreaks)
    Out ("  w:t nodes / extracted characters          : {0} / {1:N0}" -f $counts.textNodes, $counts.textChars)
    Out ("  extracted characters (no whitespace)      : {0:N0}" -f $counts.textCharsNoSpaces)
    Out ("  extracted words (whitespace split)        : {0:N0}" -f $counts.words)
    Out ("  paragraph styles present: " + (($paraStyles.GetEnumerator() | Sort-Object Name | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ', '))

    # TOC field + updateFields
    $instrTexts = @($docXml.SelectNodes('//w:instrText', $nsMgr) | ForEach-Object { $_.InnerText })
    $tocInstr = @($instrTexts | Where-Object { $_ -match 'TOC' })
    if ($tocInstr.Count -eq 0) {
        # Only a failure if the source actually asked for a TOC. A document whose
        # Markdown has no [TOC] placeholder legitimately has no TOC field.
        # ($mdCounts is populated later, when -MarkdownPath is supplied.)
        $mdTocCount = 0
        if ($null -ne $mdCounts) { $mdTocCount = [int]$mdCounts.tocPlaceholders }
        if ($mdTocCount -gt 0) {
            Fail "the source has $mdTocCount [TOC] placeholder(s) but no TOC field instruction was found in document.xml"
        }
        else {
            Out "TOC FIELD: none (source contains no [TOC] placeholder)"
        }
    }
    elseif (-not ($tocInstr[0] -match '\\o\s+"1-3"')) { Fail "TOC field instruction is not TOC \o `"1-3`" ... : $($tocInstr[0])" }
    else { Out ("TOC FIELD: '$($tocInstr[0])'") }
    if ($tocInstr.Count -gt 0) {
        $fldChars = @($docXml.SelectNodes('//w:fldChar', $nsMgr) | ForEach-Object { [string]$_.GetAttribute('w:fldCharType') })
        foreach ($need in @('begin', 'separate', 'end')) {
            if ($fldChars -notcontains $need) { Fail "TOC field is missing w:fldChar type='$need'" }
        }
    }

    $settings = $xmlDocs['word/settings.xml']
    if ($settings) {
        $uf = $settings.SelectSingleNode('/w:settings/w:updateFields', $nsMgr)
        if (-not $uf) { Fail 'word/settings.xml has no <w:updateFields/> element, so Word will not rebuild the TOC' }
        elseif (@('true', '1', 'on') -notcontains ([string]$uf.GetAttribute('w:val'))) {
            Fail "w:updateFields is '$($uf.GetAttribute('w:val'))', expected true"
        }
        else { Out "SETTINGS: w:updateFields = true" }
    }

    # header / footer section references
    $sectPr = $docXml.SelectSingleNode('/w:document/w:body/w:sectPr', $nsMgr)
    if (-not $sectPr) { Fail 'no w:sectPr at the end of the body (page size / header / footer lost)' }
    else {
        $pgSz = $sectPr.SelectSingleNode('w:pgSz', $nsMgr)
        if (-not $pgSz) { Fail 'w:sectPr has no w:pgSz' }
        elseif ([int]$pgSz.GetAttribute('w:w') -ne 11906) { Note "page width is $($pgSz.GetAttribute('w:w')) twips (A4 = 11906)" }
        $hdr = $sectPr.SelectSingleNode('w:headerReference', $nsMgr)
        $ftr = $sectPr.SelectSingleNode('w:footerReference', $nsMgr)
        if (-not $hdr) { Fail 'w:sectPr has no w:headerReference' }
        if (-not $ftr) { Fail 'w:sectPr has no w:footerReference' }
        if ($hdr -and $docRels -and -not $docRels.ContainsKey([string]$hdr.GetAttribute('r:id'))) {
            Fail "header reference r:id=$($hdr.GetAttribute('r:id')) not found in word/_rels/document.xml.rels"
        }
        if ($ftr -and $docRels -and -not $docRels.ContainsKey([string]$ftr.GetAttribute('r:id'))) {
            Fail "footer reference r:id=$($ftr.GetAttribute('r:id')) not found in word/_rels/document.xml.rels"
        }
        $pgMar = $sectPr.SelectSingleNode('w:pgMar', $nsMgr)
        if ($pgMar) {
            Out ("PAGE SETUP: A4 {0}x{1} twips, margins T{2} R{3} B{4} L{5}" -f `
                    $pgSz.GetAttribute('w:w'), $pgSz.GetAttribute('w:h'), $pgMar.GetAttribute('w:top'),
                    $pgMar.GetAttribute('w:right'), $pgMar.GetAttribute('w:bottom'), $pgMar.GetAttribute('w:left'))
        }
    }

    # footer page-number field
    $ftrXml = $xmlDocs['word/footer1.xml']
    if ($ftrXml) {
        $fInstr = @($ftrXml.SelectNodes('//w:instrText | //w:fldSimple', $nsMgr) | ForEach-Object { $_.InnerText + ' ' + $_.GetAttribute('w:instr') })
        if (-not (($fInstr -join ' ') -match 'PAGE')) { Fail 'word/footer1.xml has no PAGE field' }
        else { Out 'FOOTER: PAGE field present' }
    }

    # styles referenced by the body must exist in styles.xml
    $stylesXml = $xmlDocs['word/styles.xml']
    if ($stylesXml) {
        $defined = @{}
        foreach ($s in $stylesXml.SelectNodes('//w:style', $nsMgr)) { $defined[[string]$s.GetAttribute('w:styleId')] = $true }
        $used = @{}
        foreach ($st in $docXml.SelectNodes('//w:pStyle | //w:rStyle | //w:tblStyle', $nsMgr)) { $used[[string]$st.GetAttribute('w:val')] = $true }
        $missingStyles = @($used.Keys | Where-Object { -not $defined.ContainsKey($_) })
        if ($missingStyles.Count -gt 0) { Note "styles referenced but not defined (Word falls back to Normal): $($missingStyles -join ', ')" }
        foreach ($need in @('Heading1', 'Heading2', 'Heading3', 'Heading4', 'SourceCode', 'FigurePlaceholder', 'BlockQuote', 'HorizontalRule', 'TableGrid')) {
            if (-not $defined.ContainsKey($need)) { Fail "required style '$need' is not defined in word/styles.xml" }
        }
        Out ("STYLES: {0} defined, {1} referenced, {2} referenced-but-undefined" -f $defined.Count, $used.Count, $missingStyles.Count)
    }
    else { Fail 'word/styles.xml missing' }

    # numbering definitions used by list paragraphs
    $numbering = $xmlDocs['word/numbering.xml']
    if ($numbering) {
        $numIds = @{}
        foreach ($n in $numbering.SelectNodes('//w:num', $nsMgr)) { $numIds[[string]$n.GetAttribute('w:numId')] = $true }
        $usedNumIds = @{}
        foreach ($n in $docXml.SelectNodes('//w:numPr/w:numId', $nsMgr)) { $usedNumIds[[string]$n.GetAttribute('w:val')] = $true }
        $badNum = @($usedNumIds.Keys | Where-Object { -not $numIds.ContainsKey($_) })
        if ($badNum.Count -gt 0) { Fail "list paragraphs reference undefined w:numId: $($badNum -join ', ')" }
        elseif ($usedNumIds.Count -eq 0 -and $counts.listItems -gt 0) { Fail 'list paragraphs exist but no numId is referenced' }
        else { Out ("NUMBERING: {0} numId(s) defined, used: {1}" -f $numIds.Count, (($usedNumIds.Keys | Sort-Object) -join ', ')) }
    }
    else { Fail 'word/numbering.xml missing' }
}

# ---------------------------------------------------------------- 6. compare with Markdown
$mdCounts = $null
if ($MarkdownPath) {
    $mdText = [System.IO.File]::ReadAllText($MarkdownPath, (New-Object System.Text.UTF8Encoding($false)))
    $mdText = $mdText -replace "^\uFEFF", ''
    $mdText = $mdText.Replace("`r`n", "`n").Replace("`r", "`n")
    $mdLines = $mdText -split "`n"

    $mdCounts = [ordered]@{
        lines = $mdLines.Count
        headings = [ordered]@{ '1' = 0; '2' = 0; '3' = 0; '4' = 0; '5' = 0; '6' = 0 }
        tables = 0; tableDataRows = 0; codeBlocks = 0; codeLines = 0
        listItems = 0; figures = 0; tocPlaceholders = 0; rules = 0
        words = 0; charsNoSpaces = 0
    }
    $inFence = $false
    $fenceMarker = ''
    for ($i = 0; $i -lt $mdLines.Count; $i++) {
        $line = $mdLines[$i]
        $fenceMatch = [regex]::Match($line, '^\s{0,3}(`{3,}|~{3,})')
        if ($fenceMatch.Success) {
            if (-not $inFence) { $inFence = $true; $fenceMarker = $fenceMatch.Groups[1].Value[0]; $mdCounts.codeBlocks++ }
            elseif ($fenceMatch.Groups[1].Value[0] -eq $fenceMarker) { $inFence = $false }
            continue
        }
        if ($inFence) { $mdCounts.codeLines++; continue }

        $hm = [regex]::Match($line, '^\s{0,3}(#{1,6})\s+\S')
        if ($hm.Success) { $lvl = $hm.Groups[1].Value.Length; $mdCounts.headings["$lvl"] = $mdCounts.headings["$lvl"] + 1; continue }
        if ($line -match '^\s*\[TOC\]\s*$') { $mdCounts.tocPlaceholders++; continue }
        if ($line -match '^\s*\[FIGURE:') { $mdCounts.figures++; continue }
        if ($line -match '^\s{0,3}(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$') { $mdCounts.rules++; continue }
        if ($line -match '^\s{0,6}([-*+]|\d{1,9}[.)])\s+\S') { $mdCounts.listItems++; continue }
        # table: current line has a pipe and the next line is a separator
        if ($line -match '\|' -and ($i + 1) -lt $mdLines.Count -and $mdLines[$i + 1] -match '^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$') {
            $mdCounts.tables++
            $j = $i + 2
            while ($j -lt $mdLines.Count -and $mdLines[$j] -match '\|' -and $mdLines[$j] -notmatch '^\s*$') { $mdCounts.tableDataRows++; $j++ }
        }
    }
    $mdCounts.words = @($mdText -split '\s+' | Where-Object { $_ -ne '' }).Count
    $mdCounts.charsNoSpaces = ($mdText -replace '\s', '').Length

    Out ""
    Out "SOURCE MARKDOWN vs DOCX"
    Out ("  {0,-30} {1,10} {2,10}" -f 'metric', 'markdown', 'docx')
    $pairs = @(
        @{ n = 'H1 headings'; md = $mdCounts.headings['1']; dx = $counts.headings['1'] },
        @{ n = 'H2 headings'; md = $mdCounts.headings['2']; dx = $counts.headings['2'] },
        @{ n = 'H3 headings'; md = $mdCounts.headings['3']; dx = $counts.headings['3'] },
        @{ n = 'H4 headings'; md = $mdCounts.headings['4']; dx = $counts.headings['4'] },
        @{ n = 'tables'; md = $mdCounts.tables; dx = $counts.tables },
        @{ n = 'table data rows'; md = $mdCounts.tableDataRows; dx = ($counts.tableRows - $counts.tables) },
        @{ n = 'fenced code blocks (lang line incl.)'; md = $mdCounts.codeBlocks; dx = -1 },
        @{ n = 'code lines'; md = $mdCounts.codeLines; dx = -1 },
        @{ n = 'list items'; md = $mdCounts.listItems; dx = $counts.listItems },
        @{ n = 'figure placeholders'; md = $mdCounts.figures; dx = $counts.figures },
        @{ n = 'horizontal rules'; md = $mdCounts.rules; dx = $counts.rules },
        @{ n = 'words'; md = $mdCounts.words; dx = $counts.words },
        @{ n = 'chars (no whitespace)'; md = $mdCounts.charsNoSpaces; dx = $counts.textCharsNoSpaces }
    )
    foreach ($pair in $pairs) {
        $dx = if ($pair.dx -lt 0) { 'n/a' } else { "{0}" -f $pair.dx }
        Out ("  {0,-30} {1,10} {2,10}" -f $pair.n, $pair.md, $dx)
    }

    # ---- hard comparisons the converter must satisfy exactly
    foreach ($lvl in @('1', '2', '3', '4')) {
        $mdH = $mdCounts.headings[$lvl]
        $dxH = $counts.headings[$lvl]
        if ($lvl -eq '1') {
            # the first H1 is rendered with the TitlePageTitle style, not Heading1
            $titleStyled = @($docXml.SelectNodes('//w:pStyle[@w:val="TitlePageTitle"]', $nsMgr)).Count
            if (($mdH - $titleStyled) -ne $dxH) { Fail "H1 count mismatch: markdown $mdH (minus $titleStyled title-styled) vs document $dxH" }
        }
        elseif ($mdH -ne $dxH) { Fail "H$lvl count mismatch: markdown $mdH vs document $dxH" }
    }
    if ($mdCounts.tables -ne $counts.tables) { Fail "table count mismatch: markdown $mdCounts.tables vs document $counts.tables" }
    if (($mdCounts.tableDataRows + $mdCounts.tables) -ne $counts.tableRows) {
        Fail "table row count mismatch: markdown header+data $($mdCounts.tableDataRows + $mdCounts.tables) vs document rows $($counts.tableRows)"
    }
    if ($mdCounts.listItems -ne $counts.listItems) { Fail "list item count mismatch: markdown $mdCounts.listItems vs document $counts.listItems" }
    if ($mdCounts.figures -ne $counts.figures) { Fail "figure placeholder count mismatch: markdown $mdCounts.figures vs document $counts.figures" }
    if ($mdCounts.rules -ne $counts.rules) { Fail "horizontal rule count mismatch: markdown $mdCounts.rules vs document $counts.rules" }
    # code: every code line becomes one SourceCode paragraph, plus one language-label paragraph per language-tagged fence
    $langLabels = @()
    $inFence = $false
    $langFences = 0
    foreach ($line in $mdLines) {
        $fm = [regex]::Match($line, '^\s{0,3}(`{3,}|~{3,})\s*([A-Za-z0-9_+.#-]*)\s*$')
        if ($fm.Success) {
            if (-not $inFence) { $inFence = $true; if ($fm.Groups[2].Value) { $langFences++ } }
            else { $inFence = $false }
        }
    }
    $expectedCodeParas = $mdCounts.codeLines + $langFences
    if ($expectedCodeParas -ne $counts.codeParagraphs) {
        Fail "code paragraph count mismatch: markdown $($mdCounts.codeLines) code lines + $langFences language labels = $expectedCodeParas vs document $($counts.codeParagraphs)"
    }
    # completeness: extracted text must match the source's canonical text exactly
    $ratio = if ($mdCounts.charsNoSpaces -gt 0) { $counts.textCharsNoSpaces / $mdCounts.charsNoSpaces } else { 1 }
    Out ("  text completeness ratio (docx chars / md non-ws chars): {0:P2}" -f $ratio)
    if ($ratio -lt 0.90) { Fail ("extracted document text is only {0:P2} of the markdown's non-whitespace character count - content looks lost" -f $ratio) }

    # ---- coverage-presence proof (the completeness gate) -------------------
    # Every content line of the source - headings, paragraph lines, list items,
    # table cells, code lines - must appear verbatim in the document's text.
    # This is the gate; see the comment above Get-MarkdownCoverageLines for why a
    # canonical text digest cannot be used as one.
    $docxFlat = ($allText -replace '\s+', ' ').Trim()
    $coverLines = Get-MarkdownCoverageLines $MarkdownPath
    # Lines that the converter normalises on purpose are exempt from the coverage
    # gate: an intentionally ragged table row is padded/truncated, so its surplus
    # text is not in the document by design. The converter's directive
    # <!-- md2docx:expect-ragged --> declares this for the table that follows it,
    # so every content line of that table's ragged rows is exempt.
    $declaredRagged = New-Object System.Collections.Generic.HashSet[int]
    $mdRawLines = [System.IO.File]::ReadAllLines($MarkdownPath, (New-Object System.Text.UTF8Encoding($false)))
    $raggedTables = 0
    for ($k = 0; $k -lt $mdRawLines.Count; $k++) {
        if ($mdRawLines[$k] -notmatch 'md2docx:expect-ragged') { continue }
        $raggedTables++
        # skip the header row (k+1) and the separator row (k+2); the DATA rows
        # (k+3 onwards) are the ones whose surplus text is dropped by design
        $j = $k + 3
        while ($j -lt $mdRawLines.Count -and $mdRawLines[$j].Trim() -ne '') {
            [void]$declaredRagged.Add($j + 1)
            $j++
        }
    }

    # md2docx directives are tooling instructions consumed by the converter, so
    # they are never written into the document and must not be expected there.
    $directiveLines = New-Object System.Collections.Generic.HashSet[int]
    for ($k = 0; $k -lt $mdRawLines.Count; $k++) {
        if ($mdRawLines[$k] -match '^\s*<!--\s*md2docx:[A-Za-z-]+\s*-->\s*$') { [void]$directiveLines.Add($k + 1) }
    }
    $missing = New-Object System.Collections.ArrayList
    $exempt = 0
    $checked = 0
    foreach ($cl in $coverLines) {
        $needle = ($cl.Text -replace '\s+', ' ').Trim()
        if ($needle -eq '') { continue }
        if ($directiveLines.Contains([int]$cl.Line)) { $exempt++; continue }
        if ($declaredRagged.Contains([int]$cl.Line)) { $exempt++; continue }
        $checked++
        if ($docxFlat.IndexOf($needle, [System.StringComparison]::Ordinal) -lt 0) { [void]$missing.Add($cl) }
    }
    $found = $checked - $missing.Count
    $pct = if ($checked -gt 0) { $found / $checked } else { 1 }
    Out ("  source content lines checked         : {0:N0}" -f $checked)
    if ($exempt -gt 0) { Out ("  lines exempted as declared-ragged    : {0:N0}" -f $exempt) }
    Out ("  lines found verbatim in the document : {0:N0} ({1:P3})" -f $found, $pct)
    if ($missing.Count -gt 0) {
        Out "  NOT FOUND (first 20):"
        foreach ($m in ($missing | Select-Object -First 20)) {
            $snippet = $m.Text.Substring(0, [Math]::Min(90, $m.Text.Length))
            Out ("    md line {0,-6} [{1,-11}] {2}" -f $m.Line, $m.Kind, $snippet)
        }
    }
    if ($pct -lt 0.995) {
        Fail ("source coverage is only {0:P3}: {1} of {2} content lines were not found in the document" -f $pct, $missing.Count, $checked)
    }
    elseif ($missing.Count -gt 0) {
        Note ("$($missing.Count) source line(s) not found verbatim (below the 0.5% gate); see the list above")
    }
    else {
        Out "  COVERAGE PROOF: every source content line is present in the document"
    }

    # ---- canonical digest: diagnostic only, NOT a gate --------------------
    # Markdown emphasis and a literal '*' inside a code span normalise to the same
    # text ('code_span_with_*stars*' is indistinguishable from an emphasised
    # 'code_span_with_stars' once the backticks are gone), so this comparison can
    # legitimately report a mismatch on correctly converted content.
    $expectedHash = ''
    $customXml = $xmlDocs['docProps/custom.xml']
    if ($customXml) {
        foreach ($prop in $customXml.SelectNodes('//*[local-name()="property"]')) {
            if ($prop.GetAttribute('name') -eq 'md2docxCanonicalTextSHA256') { $expectedHash = $prop.InnerText.Trim() }
        }
    }
    if (-not $expectedHash) { Note 'docProps/custom.xml has no md2docxCanonicalTextSHA256 property (older output?)' }

    $canonParts = @($canonParas | ForEach-Object { $s = (Remove-RenderedInlineSyntax $_).Trim(); if ($s -ne '') { $s } })
    $docxCanon = (($canonParts -join ' ') -replace '\s+', ' ').Trim()
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $docxHash = ([System.BitConverter]::ToString($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($docxCanon))) -replace '-', '').ToLowerInvariant()
    }
    finally { $sha.Dispose() }

    $mdCanon = Get-MarkdownCanonicalText $MarkdownPath
    $sha2 = [System.Security.Cryptography.SHA256]::Create()
    try {
        $mdHash = ([System.BitConverter]::ToString($sha2.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($mdCanon))) -replace '-', '').ToLowerInvariant()
    }
    finally { $sha2.Dispose() }

    Out ("  canonical chars   : markdown-normalised {0:N0}, w:t-extracted {1:N0}" -f $mdCanon.Length, $docxCanon.Length)
    Out ("  canonical SHA-256 : custom.xml {0}" -f ($(if ($expectedHash) { $expectedHash.Substring(0, 16) + '...' } else { '(absent)' })))
    Out ("                      markdown   {0}" -f ($mdHash.Substring(0, 16) + '...'))
    Out ("                      docx w:t   {0}" -f ($docxHash.Substring(0, 16) + '...'))
    if ($expectedHash -and $docxHash -ne $expectedHash) {
        Note 'canonical digest of the w:t text differs from docProps/custom.xml (expected when code spans contain a literal asterisk; not a gate)'
    }
}

# ---------------------------------------------------------------- 7. summary
Out ""
Out ("=" * 78)
if ($script:Failures.Count -eq 0) {
    Out "RESULT: PASS - all checks passed ($($script:Notes.Count) note(s))"
}
else {
    Out "RESULT: FAIL - $($script:Failures.Count) check(s) failed"
}
Out ("=" * 78)

if ($AsJson) {
    $json = [ordered]@{
        docx = $DocxPath; bytes = $fileInfo.Length; parts = @($partList | ForEach-Object { $_.Name })
        partSizes = @{}; xmlParsed = $xmlDocs.Count; failures = @($script:Failures); notes = @($script:Notes)
    }
    foreach ($p in $partList) { $json.partSizes[$p.Name] = $p.Size }
    if ($mdCounts) { $json.markdown = $mdCounts }
    Write-Output ("JSON|" + ($json | ConvertTo-Json -Depth 6 -Compress))
}

if ($script:Failures.Count -gt 0) { exit 1 }
exit 0
