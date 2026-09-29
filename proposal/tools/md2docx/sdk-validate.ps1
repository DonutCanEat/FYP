<#
  sdk-validate.ps1 - independent OOXML schema validation with Microsoft's own
  Open XML SDK.

  The assembly used is the DocumentFormat.OpenXml.dll that ships inside Office:
    C:\Program Files\Microsoft Office\root\Office16\ADDINS\
        Microsoft Power Query for Excel Integrated\bin\DocumentFormat.OpenXml.dll
  (version 2.9.1.0). This is Microsoft's own parser, so it is the ground truth
  for (a) package-level relationship conflicts and (b) WordprocessingML
  child-element order.

  USAGE  (repeat -Path once per document; powershell -File does not accept
          comma-separated array values)
    powershell -NoProfile -ExecutionPolicy Bypass -File sdk-validate.ps1 `
        -Path a.docx -Path b.docx [-Top 10] [-ShowFull] [-Quiet]
        -FormatVer Office2013

  OUTPUT (per file)
    SIZE  : byte size
    RAW   : duplicate relationship Ids per .rels part, duplicate
            <Override PartName>/<Default Extension> in [Content_Types].xml,
            duplicate zip entry names. Computed from the ZIP entries directly,
            so it still works on a package the SDK refuses to open.
    SHA256(pre) : hash of the file BEFORE anything touches it
    OPEN  : result of opening the package from an in-memory COPY of the file,
            i.e. WordprocessingDocument.Open(MemoryStream, true) - never by path
    ERRORS: the TRUE total - MaxNumberOfErrors is raised well past the SDK's
            silent 1000-error cap
    SHA256(post): hash re-computed AFTER Dispose(); a difference means this
            script mutated the artefact and is reported as a WARNING and a
            non-zero exit
    DISTINCT DESCRIPTIONS: top N error descriptions with counts + sample paths
    BY PART: errors per package part URI

  EXIT CODES
    0  all files opened, zero schema errors, no duplicate rel ids/overrides
    1  at least one schema error or duplicate declaration
    2  at least one file could not be opened at all (package-level failure)
    3  usage / setup failure

  CRITICAL INVARIANT - NEVER OPEN A .docx BY PATH (do not "simplify" this away)
    On this Office build, opening a .docx from a path with the Open XML SDK
    REWRITES THE FILE ON DISK even when read-only is requested:

        WordprocessingDocument.Open(pathName, true)  ->  Validate()  ->  Dispose()

    leaves the file with the SAME byte size but a DIFFERENT SHA-256. The SDK
    re-serialises every XML part (attribute order, `/>` spacing, encoding-case),
    so the package stays semantically identical but is no longer the artefact
    that was recorded. A by-path open therefore destroys the very hash it was
    invoked to confirm. This is exactly how the user's original
    `AY2627_FYP topics_v2_Victor Li.docx` was silently corrupted
    (30,949 bytes / 1B847CF4...  ->  30,882 bytes / 3F8632DE...).

    Word COM is the same hazard: Word.Documents.Open(<path>, ..., ReadOnly:=true)
    can also rewrite the file in place.

    Therefore every open in this script MUST go through a MemoryStream copy of
    the bytes (see the "$memStream" block below), and the SHA-256 MUST be
    recorded before and re-verified after. Validation results are identical
    either way - there is no reason to open by path.

  IMPLEMENTATION NOTE (do not "simplify" this away)
    This script deliberately uses NO [switch] parameters and NO function-local
    parameter named $p. Windows PowerShell 5.1 has a parameter-binder defect
    where a script that declares a [switch] parameter together with a function
    whose parameter is [string] $p mis-binds a *variable* argument to that
    function as the script-level switch. The reproduction is 12 lines:

        [CmdletBinding()]
        param([string[]] $Path, [switch] $Full)
        function F([string] $p) { return $p }
        foreach ($raw in $Path) { $x = F $raw }   # -> "Cannot convert value
                                                  #     System.String to type
                                                  #     SwitchParameter"

    Renaming either side fixes it. Hence $ShowFull/$Quiet are [bool] here and
    the helper parameter is $docPath.

  ASCII-only output so it is readable from a big5 (ANSI cp950) console.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string[]] $Path,

  # Number of distinct error descriptions to print per file (default 10).
  [int] $Top = 10,

  # 0 = print only the top -Top descriptions. 1 = print all of them.
  [bool] $ShowFull = $false,

  # 1 = do not print sample element paths under each description.
  [bool] $Quiet = $false,

  # Validation target. Office2013 matches the independent audit; the SDK
  # default is Office2007.
  [string] $FormatVer = 'Office2013'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Off

$SDK_DLL = 'C:\Program Files\Microsoft Office\root\Office16\ADDINS\Microsoft Power Query for Excel Integrated\bin\DocumentFormat.OpenXml.dll'

function Out-Line([string] $line) { [Console]::Out.WriteLine($line) }

if (-not (Test-Path -LiteralPath $SDK_DLL)) {
  Out-Line "sdk-validate: FATAL: Open XML SDK not found at $SDK_DLL"
  exit 3
}
try {
  Add-Type -Path $SDK_DLL -ErrorAction Stop
} catch {
  if (-not ('DocumentFormat.OpenXml.Packaging.WordprocessingDocument' -as [type])) {
    Out-Line ("sdk-validate: FATAL: cannot load the Open XML SDK: " + $_.Exception.Message)
    exit 3
  }
}

$fileFormat = [DocumentFormat.OpenXml.FileFormatVersions]::$FormatVer
if ($null -eq $fileFormat) {
  Out-Line "sdk-validate: FATAL: unknown -FormatVer '$FormatVer'"
  exit 3
}

# Strongly typed target so PowerShell picks the (FileFormatVersions) constructor
# overload instead of failing on the conversion.
$verTarget = [DocumentFormat.OpenXml.FileFormatVersions] $fileFormat
$validator = New-Object DocumentFormat.OpenXml.Validation.OpenXmlValidator -ArgumentList (, $verTarget)
# The SDK default is 1000 and it silently STOPS there. Real documents in this
# repository carried ~10776 errors, so a capped run under-reports badly.
$validator.MaxNumberOfErrors = 2000000

<#
  Raw, SDK-independent package checks. Reads the .zip entries directly, so it
  still works on a package the SDK refuses to open (exactly the duplicate-rId
  failure mode).
#>
function Get-RawPackageIssues([string] $docPath) {
  $issueList = New-Object System.Collections.ArrayList
  Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction SilentlyContinue
  $zip = $null
  try { $zip = [System.IO.Compression.ZipFile]::OpenRead($docPath) } catch {
    [void]$issueList.Add('RAW: cannot open the zip container: ' + $_.Exception.Message)
    return $issueList
  }
  try {
    $entries = @($zip.Entries | Where-Object { -not $_.FullName.EndsWith('/') })

    # ---- duplicate relationship Ids in any .rels part -------------------
    foreach ($entry in ($entries | Where-Object { $_.FullName -eq '_rels/.rels' -or $_.FullName -like '*/_rels/*.rels' })) {
      $reader = New-Object System.IO.StreamReader($entry.Open(), [System.Text.Encoding]::UTF8)
      $xmlText = $reader.ReadToEnd(); $reader.Dispose()
      try { [xml]$xdoc = $xmlText } catch { [void]$issueList.Add('RAW: ' + $entry.FullName + ': not well-formed XML'); continue }
      $idList = New-Object System.Collections.ArrayList
      foreach ($rel in $xdoc.Relationships.Relationship) { [void]$idList.Add([string]$rel.Id) }
      foreach ($dup in ($idList | Group-Object | Where-Object { $_.Count -gt 1 })) {
        [void]$issueList.Add("RAW: duplicate relationship Id '" + $dup.Name + "' x" + $dup.Count + ' in ' + $entry.FullName)
      }
    }

    # ---- duplicate content-type declarations ----------------------------
    foreach ($entry in ($entries | Where-Object { $_.FullName -eq '[Content_Types].xml' })) {
      $reader = New-Object System.IO.StreamReader($entry.Open(), [System.Text.Encoding]::UTF8)
      $xmlText = $reader.ReadToEnd(); $reader.Dispose()
      try { [xml]$xdoc = $xmlText } catch { [void]$issueList.Add('RAW: [Content_Types].xml: not well-formed XML'); continue }
      $partNames = New-Object System.Collections.ArrayList
      foreach ($ov in $xdoc.Types.Override) { [void]$partNames.Add(([string]$ov.PartName).ToLowerInvariant()) }
      foreach ($dup in ($partNames | Group-Object | Where-Object { $_.Count -gt 1 })) {
        [void]$issueList.Add('RAW: duplicate <Override PartName="' + $dup.Name + '"> x' + $dup.Count + ' in [Content_Types].xml')
      }
      $exts = New-Object System.Collections.ArrayList
      foreach ($df in $xdoc.Types.Default) { [void]$exts.Add(([string]$df.Extension).ToLowerInvariant()) }
      foreach ($dup in ($exts | Group-Object | Where-Object { $_.Count -gt 1 })) {
        [void]$issueList.Add('RAW: duplicate <Default Extension="' + $dup.Name + '"> x' + $dup.Count + ' in [Content_Types].xml')
      }
    }

    # ---- duplicate zip entry names --------------------------------------
    foreach ($dup in ($entries | Group-Object -Property FullName | Where-Object { $_.Count -gt 1 })) {
      [void]$issueList.Add("RAW: duplicate zip entry '" + $dup.Name + "' x" + $dup.Count)
    }
  } finally {
    $zip.Dispose()
  }
  return $issueList
}

$totalErrors = 0
$totalRaw = 0
$openFailures = 0
$checked = 0

foreach ($raw in $Path) {
  if ([string]::IsNullOrWhiteSpace($raw)) { continue }
  $docPath = $null
  if (Test-Path -LiteralPath $raw) { $docPath = (Resolve-Path -LiteralPath $raw).Path }
  Out-Line ('=' * 78)
  if (-not $docPath) {
    Out-Line "FILE : $raw"
    Out-Line 'ERROR: file not found'
    $openFailures++
    continue
  }
  $checked++
  $preHash = (Get-FileHash -LiteralPath $docPath -Algorithm SHA256).Hash
  Out-Line "FILE : $docPath"
  Out-Line ('SIZE : ' + (Get-Item -LiteralPath $docPath).Length)
  Out-Line ('SHA256(pre) : ' + $preHash)

  # --- raw package checks (independent of the SDK) ------------------------
  $rawIssues = @(Get-RawPackageIssues $docPath)
  if ($rawIssues.Count -gt 0) {
    $totalRaw += $rawIssues.Count
    Out-Line ('RAW  : ' + $rawIssues.Count + ' issue(s)')
    foreach ($one in $rawIssues) { Out-Line ('       ' + $one) }
  } else {
    Out-Line 'RAW  : no duplicate relationship Ids, no duplicate content-type declarations'
  }

  # --- SDK open (read-only) ----------------------------------------------
  #
  # IMPORTANT: the package is opened from a MemoryStream copy, NEVER by path.
  # Measured on this Office/SDK build: WordprocessingDocument.Open(path, true)
  # followed by Validate(package) and Dispose() REWRITES the .docx on disk
  # (same byte size, different SHA-256), even though ReadOnly is true. Opening by
  # path therefore silently mutates the artefact it is measuring, so a run would
  # invalidate the very hash it was meant to confirm. The MemoryStream copy is
  # validated identically (same error count) and leaves the file byte-identical.
  $doc = $null
  $opened = $false
  $openError = $null
  $memStream = $null
  try {
    $bytes = [System.IO.File]::ReadAllBytes($docPath)
    $memStream = New-Object System.IO.MemoryStream
    $memStream.Write($bytes, 0, $bytes.Length)
    $memStream.Position = 0
    $doc = [DocumentFormat.OpenXml.Packaging.WordprocessingDocument]::Open($memStream, $true)
    $opened = $true
  } catch {
    $openError = $_.Exception
  }

  if (-not $opened) {
    $ex = $openError
    Out-Line 'OPEN : FAILED'
    while ($ex) {
      Out-Line ('       ' + $ex.GetType().FullName + ': ' + $ex.Message)
      $ex = $ex.InnerException
    }
    $openFailures++
    continue
  }
  Out-Line 'OPEN : OK'

  # --- schema validation --------------------------------------------------
  # Cast to OpenXmlPackage: otherwise PowerShell reports Validate() as
  # ambiguous, and the package overload is the one that walks every part
  # (document, styles, settings, numbering, header, footer, theme, fontTable,
  # properties).
  $pkg = [DocumentFormat.OpenXml.Packaging.OpenXmlPackage] $doc
  $errs = @($validator.Validate($pkg))
  Out-Line ('ERRORS: ' + $errs.Count)
  Out-Line ('FORMAT: ' + $FormatVer + '   MAXERR: ' + $validator.MaxNumberOfErrors +
            '   SDK: ' + ([System.Reflection.Assembly]::LoadFrom($SDK_DLL).GetName().Version.ToString()))

  if ($errs.Count -gt 0) {
    $totalErrors += $errs.Count
    $groups = $errs | Group-Object -Property Description | Sort-Object Count -Descending
    $shown = $groups.Count
    if (-not $ShowFull) { $shown = [Math]::Min($Top, $groups.Count) }
    Out-Line ('DISTINCT DESCRIPTIONS: ' + $groups.Count + '  (showing ' + $shown + ')')
    for ($gi = 0; $gi -lt $shown; $gi++) {
      $grp = $groups[$gi]
      Out-Line ('  [{0,7}] {1}' -f $grp.Count, $grp.Name)
      if (-not $Quiet) {
        foreach ($sample in @($grp.Group | Select-Object -First 2)) {
          $vpath = $sample.Path
          if ($vpath -and $vpath.XmlPath) { Out-Line ('            at ' + $vpath.XmlPath) }
          elseif ($vpath) { Out-Line ('            at ' + [string]$vpath) }
        }
      }
    }
    Out-Line 'BY PART:'
    foreach ($pg in ($errs | Group-Object -Property { $_.Part.Uri.ToString() } | Sort-Object Count -Descending)) {
      Out-Line ('  [{0,7}] {1}' -f $pg.Count, $pg.Name)
    }
  }

  # Dispose can throw IsolatedStorageException ("Unable to determine the
  # identity of domain") on this Office build; that is an SDK bookkeeping
  # failure, not a schema result, so it must not abort the run or change the
  # exit code.
  try { $doc.Dispose() } catch { }
  if ($memStream) { try { $memStream.Dispose() } catch { } }
  # Self-check: validation must not alter the artefact it measured.
  $postHash = (Get-FileHash -LiteralPath $docPath -Algorithm SHA256).Hash
  if ($postHash -ne $preHash) {
    Out-Line "WARNING: this script changed the file it was validating ($preHash -> $postHash)"
    $totalRaw++
  }
}
Out-Line ('=' * 78)
Out-Line ('SUMMARY|files=' + $checked + ' openFailures=' + $openFailures +
          ' validationErrors=' + $totalErrors + ' rawIssues=' + $totalRaw)

if ($checked -eq 0) { exit 3 }
if ($openFailures -gt 0) { exit 2 }
if ($totalErrors -gt 0 -or $totalRaw -gt 0) { exit 1 }
exit 0
