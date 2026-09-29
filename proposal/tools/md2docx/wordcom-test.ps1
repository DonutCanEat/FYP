<#
.SYNOPSIS
    Acceptance test: can real Microsoft Word open a generated .docx and export it to PDF?
.DESCRIPTION
    This is the decisive end-to-end check for md2docx output. It

      1. probes whether the Word.Application COM object is registrable at all;
      2. opens the .docx with Word (not just an XML parser);
      3. reports what Word itself thinks the document contains (page count, word
         count, paragraph count) - evidence the file is genuinely well formed;
      4. exports to PDF with wdFormatPDF (17) and reports the PDF size;
      5. optionally re-reads the PDF page count through Word's own PDF support is
         not available, so the page count comes from the Word document object;
      6. always closes the document and quits Word, and releases the COM objects.

    If Word is unavailable the script exits with code 3 and prints the exact
    exception, so the caller can fall back to XML+ZIP validation.

.PARAMETER DocxPath
    The .docx to open. MANDATORY SAFETY RULE: it must live inside a temporary
    directory ($env:TEMP / $env:TMP). Anything else is refused with exit code 6.

.PARAMETER PdfPath
    Where to write the PDF. Defaults to beside the temporary copy, using a .pdf
    extension. The caller's own directory is never written to.

.PARAMETER AllowRoot
    Narrows the temporary allow-list to this one root. Defaults to $env:TEMP. It
    may only narrow the allow-list: a root outside $env:TEMP/$env:TMP is itself
    refused.

.PARAMETER KeepWordOpen
    Do not Quit Word at the end (for interactive inspection).

.PARAMETER SelfCheck
    Run the safety gate's own self-test (9 cases, no document, no Word) and exit.
    Exit 0 = all gate cases behave; 6 = a gate case is wrong.
#>
<#
    ========================================================================
    !! NEVER open a .docx BY PATH.  Word COM and the Open XML SDK can BOTH
    !! rewrite the file in place, even when opened ReadOnly.  Only
    !! word/document.xml survives byte-identical; settings.xml, endnotes.xml
    !! and footnotes.xml are re-serialised, so no text diff can detect it.
    !! This script therefore refuses every path outside a temp directory and
    !! opens ONLY its own copy.  Do not remove or weaken that gate.
    !! Exit codes: 2 = not found / no argument, 3 = Word COM unavailable,
    !!             4 = PDF not produced, 5 = open or export failed,
    !!             6 = REFUSED (unsafe target, bad -AllowRoot, or the
    !!                 caller's original changed during the run).
    ========================================================================

    FAIL-FAST [CmdletBinding()] wrapper: this script CANNOT run unattended, because
    it would call Word, and Word is the component that damages files. It may ONLY
    be run from a real interactive desktop session by a human who accepts that risk,
    and ONLY on a throwaway copy (the script still makes its own copy as well).

.LINK
    https://learn.microsoft.com/office/open-xml/  (Open XML SDK - open from a stream,
    never from a path, for exactly the same reason)

.EXAMPLE
    # the ONLY safe invocation: a disposable copy inside the temp directory
    .\wordcom-test.ps1 .\sample.docx

.EXAMPLE
    # self-check the safety gate without touching any document
    .\wordcom-test.ps1 -SelfCheck
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $false, Position = 0)][string]$DocxPath,
    [Parameter(Mandatory = $false, Position = 1)][string]$PdfPath,
    [Parameter(Mandatory = $false)][string]$AllowRoot,
    [switch]$KeepWordOpen,
    [switch]$SelfCheck
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2.0

# ============================================================================
# SAFETY GATE - HARD ALLOW-LIST.  Never open, never copy, never hash anything
# outside it.  This runs BEFORE the file is even hashed.
#
# The guard exists because on this Office build BOTH Word COM and the Open XML
# SDK rewrite a .docx in place when it is opened BY PATH, even read-only: the
# body (word/document.xml) comes back byte-identical while settings.xml /
# endnotes.xml / footnotes.xml are re-serialised, so no text comparison can see
# the damage.  Measured damage: AY2627_FYP topics_v2_Victor Li.docx went from
# 30,949 bytes / 1B847CF4...AAFB4E to 30,882 bytes / 3F8632DE...54F755.
# Therefore the only file this script may ever open is its own throwaway copy
# inside a temporary directory.
# ============================================================================
$unsafeExitCode = 6

# The caller's own root: defaults to the temp directory, and may be narrowed but
# never widened (each requested root is still checked against the SAFE roots).
$safeRoots = @()
foreach ($r in @($env:TEMP, $env:TMP)) {
    if ($r -and (Test-Path -LiteralPath $r)) { $safeRoots += [System.IO.Path]::GetFullPath($r).TrimEnd('\') }
}
$safeRoots = $safeRoots | Sort-Object -Unique
if ($AllowRoot) {
    $ar = [System.IO.Path]::GetFullPath($AllowRoot).TrimEnd('\')
    if (-not ($safeRoots | Where-Object { $ar -eq $_ -or $ar.StartsWith($_ + '\', [System.StringComparison]::OrdinalIgnoreCase) })) {
        [Console]::Error.WriteLine("wordcom-test: REFUSED: -AllowRoot '$ar' is not inside a temporary directory (-AllowRoot may narrow the allow-list, never widen it).")
        exit 6
    }
    $safeRoots = @($ar)
}

# Hard-blocked locations and names (checked independently of the allow-list).
$blockedRoots = @('D:\File\School\FYP')
$blockedNames = @('AY2627_FYP topics_v2_Victor Li.docx')
$blockedFragments = @(
    'proposal\sections', 'proposal\i18n', 'proposal\research',
    'proposal\integration', 'fyp-proposal-'
)

function Get-SafetyVerdict {
    param([Parameter(Mandatory = $true)][string]$Path)
    # Resolves $Path and returns @{ refused = $bool; reason = $string }
    $resolved = $Path
    if (-not [System.IO.Path]::IsPathRooted($resolved)) {
        $resolved = Join-Path (Get-Location).Path $resolved
    }
    $resolved = [System.IO.Path]::GetFullPath($resolved)

    $norm = $resolved
    $name = [System.IO.Path]::GetFileName($resolved)

    # a. never the user's document, wherever a copy of it happens to live
    if ($blockedNames -contains $name) {
        return @{ refused = $true; reason = ("it is the protected deliverable '{0}' by name - refusing no matter where it sits" -f $name) }
    }

    # b. never inside a hard-blocked tree (the live proposal workspace)
    $hit = $blockedRoots | Where-Object {
        $resolved.Equals($_, [System.StringComparison]::OrdinalIgnoreCase) -or
        $resolved.StartsWith($_ + '\', [System.StringComparison]::OrdinalIgnoreCase)
    }
    if ($hit) {
        return @{ refused = $true; reason = ("it is inside the live workspace '{0}'" -f $hit) }
    }

    # c. never inside a workspace sub-tree, and never a FYP-Proposal-* deliverable
    $fragHit = $blockedFragments | Where-Object { $norm.IndexOf($_, [System.StringComparison]::OrdinalIgnoreCase) -ge 0 }
    if ($fragHit) {
        return @{ refused = $true; reason = ("its path contains the protected fragment '{0}'" -f $fragHit) }
    }

    # d. ALLOW-LIST: the resolved path must be inside a permitted temporary root
    $insideSafe = $false
    foreach ($root in $safeRoots) {
        if ($resolved.Equals($root, [System.StringComparison]::OrdinalIgnoreCase) -or
            $resolved.StartsWith($root + '\', [System.StringComparison]::OrdinalIgnoreCase)) { $insideSafe = $true; break }
    }
    if (-not $insideSafe) {
        return @{ refused = $true; reason = ("it is outside every permitted temporary root ({0})" -f ($safeRoots -join '; ')) }
    }

    return @{ refused = $false; reason = '' }
}

function Get-Sha256([string]$path) {
    return (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
}

# ============================================================================
# SAFETY GATE - self-test and exit, before any real work.  Run with -SelfCheck.
# ============================================================================
if ($SelfCheck) {
    $script:gateFails = 0
    function Test-Gate {
        param([bool]$expectRefused, [string]$label)
        $verdict = Get-SafetyVerdict -Path $label
        $actual = [bool]$verdict.refused
        $ok = ($actual -eq $expectRefused)
        if (-not $ok) { $script:gateFails++ }
        Write-Host ("  {0} {1} -> {2}" -f $(
                if ($ok) { "PASS" } else { "FAIL" }), $label, $(if ($actual) { "REFUSED" } else { "allowed" }))
    }
    Write-Host "WORD COM TEST - SAFETY GATE SELF-CHECK"
    Write-Host "  (no document is opened, no Word object is created)"
    Write-Host ("  allow-list root(s): " + ($safeRoots -join '; '))
    $script:tempRootForCheck = [string]$env:TEMP
    Test-Gate -expectRefused $false -label $script:tempRootForCheck
    Test-Gate -expectRefused $false -label (Join-Path $script:tempRootForCheck 'wordcom-gate-check.docx')
    Test-Gate -expectRefused $true -label 'D:\File\School\FYP'
    Test-Gate -expectRefused $true -label 'D:\File\School\FYP\AY2627_FYP topics_v2_Victor Li.docx'
    Test-Gate -expectRefused $true -label 'D:\File\School\FYP\proposal\sections\01.md'
    Test-Gate -expectRefused $true -label 'D:\File\School\FYP\proposal\i18n\x.docx'
    Test-Gate -expectRefused $true -label 'D:\File\School\FYP\proposal\research\x.docx'
    Test-Gate -expectRefused $true -label 'D:\File\School\FYP\proposal\integration\x.docx'
    Test-Gate -expectRefused $true -label 'D:\File\School\FYP\Common\any.docx'
    Test-Gate -expectRefused $true -label 'C:\Users\Public\Documents\AY2627_FYP topics_v2_Victor Li.docx'
    Test-Gate -expectRefused $true -label 'C:\Users\Public\Documents\FYP-Proposal-COMPLETE.docx'
    if ($script:gateFails -eq 0) {
        Write-Host "RESULT: self-check PASS - the gate refuses every unsafe target and allows temp paths"
        exit 0
    }
    [Console]::Error.WriteLine("SELF-CHECK FAILED: {0} gate case(s) wrong" -f $script:gateFails)
    exit 6
}

if (-not $DocxPath) {
    [Console]::Error.WriteLine("wordcom-test: -DocxPath is required (or use -SelfCheck).")
    exit 2
}

# ---- THE GATE: nothing below may run unless the target is a temporary path ----
$gateVerdict = Get-SafetyVerdict -Path ([string]$DocxPath)
if ($gateVerdict.refused) {
    [Console]::Error.WriteLine("wordcom-test: REFUSED (exit 6): unsafe target.")
    [Console]::Error.WriteLine("  target : " + [System.IO.Path]::GetFullPath($DocxPath))
    [Console]::Error.WriteLine("  reason : " + $gateVerdict.reason)
    [Console]::Error.WriteLine("  rule   : NEVER open a .docx by path; Word COM and the Open XML SDK can both rewrite it in place.")
    [Console]::Error.WriteLine("  remedy : copy the file into `$env:TEMP yourself and point this script at the copy.")
    [Console]::Error.WriteLine("  no document was opened, read, copied or hashed by this run.")
    exit $unsafeExitCode
}

# The gate above passed, so $DocxPath is a temporary path by construction. Resolve
# and hash the CALLER's file first, then never touch it again.
if (-not [System.IO.Path]::IsPathRooted($DocxPath)) { $DocxPath = Join-Path (Get-Location).Path $DocxPath }
$originalPath = [System.IO.Path]::GetFullPath($DocxPath)
if (-not (Test-Path -LiteralPath $originalPath)) {
    [Console]::Error.WriteLine("wordcom-test: docx not found: $originalPath")
    exit 2
}

$originalHashBefore = Get-Sha256 $originalPath
$originalSize = (Get-Item -LiteralPath $originalPath).Length

# Copy into a FRESH subdirectory of the temp root and operate on the copy ONLY.
$copyDir = Join-Path $env:TEMP ('wordcom-test-' + [guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path $copyDir -Force
$workPath = Join-Path $copyDir ([System.IO.Path]::GetFileName($originalPath))
Copy-Item -LiteralPath $originalPath -Destination $workPath -Force

if (-not $PdfPath) { $PdfPath = [System.IO.Path]::ChangeExtension($workPath, '.pdf') }
else {
    if (-not [System.IO.Path]::IsPathRooted($PdfPath)) { $PdfPath = Join-Path (Get-Location).Path $PdfPath }
    $PdfPath = [System.IO.Path]::GetFullPath($PdfPath)
}

$docxSize = (Get-Item -LiteralPath $workPath).Length
Write-Host "WORD COM ACCEPTANCE TEST"
Write-Host ("  TARGET IS A TEMP COPY - the caller's file is never opened.")
Write-Host ("  original : {0} ({1:N0} bytes) sha256 {2}" -f $originalPath, $originalSize, $originalHashBefore)
Write-Host ("  copy     : {0} ({1:N0} bytes)  <-- this is what Word will see" -f $workPath, $docxSize)
Write-Host ("  pdf      : {0}" -f $PdfPath)

# ---------------------------------------------------------------- 1. registrable?
$word = $null
try {
    $word = New-Object -ComObject Word.Application
}
catch {
    [Console]::Error.WriteLine("WORD COM UNAVAILABLE: New-Object -ComObject Word.Application failed.")
    [Console]::Error.WriteLine("  type : $($_.Exception.GetType().FullName)")
    [Console]::Error.WriteLine("  msg  : $($_.Exception.Message)")
    if ($_.Exception.InnerException) { [Console]::Error.WriteLine("  inner: $($_.Exception.InnerException.Message)") }
    exit 3
}

$word.Version | Out-Null
Write-Host ("  Word.Application registered and created: Version {0}" -f $word.Version)
$word.Visible = $false
try { $word.DisplayAlerts = 0 } catch { }   # wdAlertsNone

$doc = $null
$pdfMade = $false
$exitCode = 0
try {
    # ------------------------------------------------------------ 2. open
    # This is the dangerous call. It is safe ONLY because $workPath is a throwaway
    # copy inside a fresh temp directory: even if Word rewrites the file in place
    # here (it can, even with ReadOnly), it destroys a copy, not a document.
    # NEVER restore a caller-supplied path into this line.
    $doc = $word.Documents.Open($workPath, $false, $true)   # ConfirmConversions=false, ReadOnly=true
    Write-Host ("  OPENED BY WORD (the temp copy): {0}" -f $doc.Name)

    # ------------------------------------------------------------ 3. Word's own view
    $pages = $doc.ComputeStatistics(2)    # wdStatisticPages
    $words = $doc.ComputeStatistics(0)    # wdStatisticWords
    $chars = $doc.ComputeStatistics(3)    # wdStatisticCharacters
    $paras = $doc.Paragraphs.Count
    Write-Host ("  Word reports: pages={0} words={1} characters={2} paragraphs={3}" -f $pages, $words, $chars, $paras)

    # headings Word recognises (proves real built-in heading styles, hence a nav pane)
    $hCount = 0
    foreach ($p in $doc.Paragraphs) {
        $s = [string]$p.Style.NameLocal
        if ($s -match '(?i)^Heading|^heading|^Überschrift') { $hCount++ }
    }
    Write-Host ("  Word sees {0} paragraph(s) using built-in Heading styles" -f $hCount)
    try {
        $tocCount = $doc.TablesOfContents.Count
        Write-Host ("  Word sees {0} TOC field(s); updateFields={1}" -f $tocCount, $doc.Fields.Count)
    }
    catch { }

    # ------------------------------------------------------------ 4. export PDF
    if (Test-Path -LiteralPath $PdfPath) { Remove-Item -LiteralPath $PdfPath -Force }
    $doc.SaveAs([ref]$PdfPath, [ref]17)     # 17 = wdFormatPDF
    Start-Sleep -Milliseconds 200
    if (Test-Path -LiteralPath $PdfPath) {
        $pdfMade = $true
        $pdfSize = (Get-Item -LiteralPath $PdfPath).Length
        Write-Host ("  PDF EXPORTED: {0} ({1:N0} bytes, {2} pages)" -f $PdfPath, $pdfSize, $pages)
        Write-Host ("  PDF header: " + [System.Text.Encoding]::ASCII.GetString([System.IO.File]::ReadAllBytes($PdfPath)[0..4]))
    }
    else {
        [Console]::Error.WriteLine("  PDF EXPORT FAILED: Word.SaveAs returned without creating the file")
        $exitCode = 4
    }

    # also exercise the TOC update path (Word can rebuild the field)
    try {
        if ($doc.TablesOfContents.Count -gt 0) {
            $doc.TablesOfContents.Item(1).Update()
            Write-Host "  TOC UPDATE: Word rebuilt the table of contents successfully"
        }
    }
    catch {
        Write-Host ("  TOC UPDATE: skipped/failed: " + $_.Exception.Message)
    }
}
catch {
    [Console]::Error.WriteLine("WORD COM TEST FAILED during open/export:")
    [Console]::Error.WriteLine("  type : $($_.Exception.GetType().FullName)")
    [Console]::Error.WriteLine("  msg  : $($_.Exception.Message)")
    $exitCode = 5
}
finally {
    if ($doc) {
        try { $doc.Close([ref]0) } catch { try { $doc.Close() } catch { } }
        try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc) } catch { }
    }
    if ($word -and -not $KeepWordOpen) {
        try { $word.Quit() } catch { }
        try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) } catch { }
        [GC]::Collect(); [GC]::WaitForPendingFinalizers()
    }
}

# ------------------------------------------------------------- 6. belt & braces
# The original must be byte-for-byte untouched. If it is not, say so at maximum
# volume and fail: a PASS verdict must never be printed over a changed original.
$originalHashAfter = Get-Sha256 $originalPath
if ($originalHashAfter -ne $originalHashBefore) {
    [Console]::Error.WriteLine("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    [Console]::Error.WriteLine("!! WARNING: THE CALLER'S ORIGINAL FILE CHANGED DURING THIS RUN !!!!!!!")
    [Console]::Error.WriteLine("!!   original : $originalPath")
    [Console]::Error.WriteLine("!!   sha256 before: $originalHashBefore")
    [Console]::Error.WriteLine("!!   sha256 after : $originalHashAfter")
    [Console]::Error.WriteLine("!! Restore it from a backup and do not re-run this script.")
    [Console]::Error.WriteLine("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    $exitCode = $unsafeExitCode
}
else {
    Write-Host ("  ORIGINAL UNTOUCHED: sha256 verified unchanged ({0})" -f $originalHashAfter)
}

if ($exitCode -eq 0) {
    Write-Host "RESULT: PASS - the .docx is Word-openable and PDF-convertible"
    Write-Output ("WORDCOM|" + (@{
                original   = $originalPath
                originalSha256Before = $originalHashBefore
                originalSha256After  = $originalHashAfter
                originalUnchanged    = ($originalHashAfter -eq $originalHashBefore)
                docx       = $workPath
                docxBytes  = $docxSize
                pdf        = $PdfPath
                pdfMade    = $pdfMade
                pdfBytes   = $(if ($pdfMade) { (Get-Item -LiteralPath $PdfPath).Length } else { 0 })
                pdfPages   = $pages
                wordPages  = $pages
                wordWords  = $words
                wordChars  = $chars
                wordParas  = $paras
                wordHeadingParas = $hCount
                wordVersion = [string]$wordVersion
            } | ConvertTo-Json -Compress))
}
exit $exitCode
