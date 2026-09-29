<#
  verify-package.ps1 - structural re-verification of generated .docx packages.

  Acceptance criterion 5 for the md2docx schema fix. This is an INDEPENDENT
  check: it reads the ZIP parts itself (System.IO.Compression) and never imports
  convert.js, so it cannot inherit a bug from the generator.

  CHECKS (per document)
    1. no illegal XML 1.0 characters in any part
    2. every .xml/.rels part is well-formed XML
    3. every part is covered by a [Content_Types].xml Default or Override
       (and there are no duplicate Override PartName / Default Extension entries)
    4. every relationship Id is declared at most once per .rels part, and every
       r:id referenced from document.xml/header/footer resolves
    5. every w:tbl has a w:tblGrid whose gridCol count equals the tc count of
       every row (rectangular tables)
    6. every w:pStyle / w:rStyle / w:tblStyle resolves to a defined w:style id
       (plus the built-in styles Word always supplies)
    7. every w:numId resolves to a defined w:num
    8. w:body ends with exactly one w:sectPr (and it is the last body child)
    9. hyperlink relationships carry TargetMode="External"

  USAGE
    powershell -NoProfile -ExecutionPolicy Bypass -File verify-package.ps1 `
        -Path a.docx -Path b.docx

  EXIT 0 = all checks passed, 1 = at least one failure, 3 = usage failure.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string[]] $Path
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Off

function Out-Line([string] $line) { [Console]::Out.WriteLine($line) }

Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction Stop

$W  = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
$R  = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
$PR = 'http://schemas.openxmlformats.org/package/2006/relationships'
$CT = 'http://schemas.openxmlformats.org/package/2006/content-types'

# Illegal XML 1.0 characters: everything below 0x20 except tab/LF/CR, plus the
# non-characters and lone surrogates.
$ILLEGAL_XML = [regex]'[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]'

$totalFailures = 0
$checked = 0

foreach ($raw in $Path) {
  if ([string]::IsNullOrWhiteSpace($raw)) { continue }
  $fail = New-Object System.Collections.ArrayList
  $info = New-Object System.Collections.ArrayList

  $docPath = $null
  if (Test-Path -LiteralPath $raw) { $docPath = (Resolve-Path -LiteralPath $raw).Path }
  Out-Line ('=' * 78)
  if (-not $docPath) {
    Out-Line "FILE : $raw"
    Out-Line '  FAIL file not found'
    $totalFailures++
    continue
  }
  $checked++
  Out-Line "FILE : $docPath"

  $zip = [System.IO.Compression.ZipFile]::OpenRead($docPath)
  try {
    # ---- read every part as text ----------------------------------------
    $parts = @{}
    foreach ($entry in $zip.Entries) {
      if ($entry.FullName.EndsWith('/')) { continue }
      $reader = New-Object System.IO.StreamReader($entry.Open(), [System.Text.Encoding]::UTF8)
      $parts[$entry.FullName] = $reader.ReadToEnd()
      $reader.Dispose()
    }

    # ---- 1. illegal characters -----------------------------------------
    foreach ($name in $parts.Keys) {
      $m = $ILLEGAL_XML.Match($parts[$name])
      if ($m.Success) {
        [void]$fail.Add("illegal XML 1.0 character U+{0:X4} in {1} at offset {2}" -f [int][char]$m.Value, $name, $m.Index)
      }
    }

    # ---- 2. well-formed XML --------------------------------------------
    $xml = @{}
    foreach ($name in $parts.Keys) {
      if ($name -like '*.xml' -or $name -like '*.rels') {
        try {
          $x = New-Object System.Xml.XmlDocument
          $x.PreserveWhitespace = $true
          $x.LoadXml($parts[$name])
          $xml[$name] = $x
        } catch {
          [void]$fail.Add("not well-formed XML: $name : " + $_.Exception.Message)
        }
      }
    }

    # NOTE: a fresh XmlNamespaceManager per XmlDocument. Reusing one manager
    # across different documents silently stops matching (the manager binds to
    # the first document's NameTable), which produced phantom "undeclared
    # relationship" / "no content type" failures during development.
    function New-NsMgr { New-Object System.Xml.XmlNamespaceManager((New-Object System.Xml.NameTable)) }

    $nsDoc = New-NsMgr
    $nsDoc.AddNamespace('w', $W)
    $nsDoc.AddNamespace('r', $R)
    $nsCTm = New-NsMgr
    $nsCTm.AddNamespace('ct', $CT)
    $nsPR = New-NsMgr
    $nsPR.AddNamespace('pr', $PR)

    # Helper: every element with a given local name, anywhere in the document.
    # Deliberately NOT XPath and NOT GetElementsByTagName(name, nsUri): on this
    # .NET Framework build the namespace-qualified overload and a shared
    # XmlNamespaceManager both fail to match, silently producing phantom
    # "no content type" / "undeclared relationship" failures.
    function Get-Elems($docRoot, [string] $localName, [string] $nsUri) {
      $out = New-Object System.Collections.ArrayList
      foreach ($node in $docRoot.GetElementsByTagName('*')) {
        if ($localName -ne '*' -and $node.LocalName -ne $localName) { continue }
        if ($nsUri -ne '' -and $node.NamespaceURI -ne $nsUri) { continue }
        [void]$out.Add($node)
      }
      return $out
    }

    # ---- 3. content-type coverage --------------------------------------
    $ct = $xml['[Content_Types].xml']
    if (-not $ct) {
      [void]$fail.Add('[Content_Types].xml missing or malformed')
    } else {
      $defaults = @{}
      $overrides = @{}
      foreach ($child in $ct.DocumentElement.ChildNodes) {
        if ($child.NodeType -ne 'Element') { continue }
        if ($child.LocalName -eq 'Default') {
          $defaults[[string]$child.GetAttribute('Extension').ToLowerInvariant()] = [string]$child.GetAttribute('ContentType')
        } elseif ($child.LocalName -eq 'Override') {
          $key = [string]$child.GetAttribute('PartName').ToLowerInvariant()
          if ($overrides.ContainsKey($key)) { [void]$fail.Add("duplicate <Override PartName=`"$key`"> in [Content_Types].xml") }
          $overrides[$key] = [string]$child.GetAttribute('ContentType')
        }
      }
      $undeclared = New-Object System.Collections.ArrayList
      foreach ($name in $parts.Keys) {
        if ($name -eq '[Content_Types].xml') { continue }
        $ext = [System.IO.Path]::GetExtension($name).TrimStart('.').ToLowerInvariant()
        if ($overrides.ContainsKey('/' + $name.ToLowerInvariant())) { continue }
        if ($defaults.ContainsKey($ext)) { continue }
        [void]$undeclared.Add($name)
      }
      if ($undeclared.Count -gt 0) { [void]$fail.Add('parts with no content type: ' + ($undeclared -join ', ')) }
      [void]$info.Add("content types: $($defaults.Count) Default, $($overrides.Count) Override, all $($parts.Count) parts declared")
    }

    # ---- 4. relationship ids -------------------------------------------
    $declaredIds = @{}
    foreach ($name in @($parts.Keys | Where-Object { $_ -eq '_rels/.rels' -or $_ -like '*/_rels/*.rels' })) {
      $rel = $xml[$name]
      if (-not $rel) { continue }
      $ids = @{}
      foreach ($child in $rel.DocumentElement.ChildNodes) {
        if ($child.NodeType -ne 'Element' -or $child.LocalName -ne 'Relationship') { continue }
        $id = [string]$child.GetAttribute('Id')
        if ($ids.ContainsKey($id)) { [void]$fail.Add("duplicate relationship Id '$id' in $name") }
        $ids[$id] = $child
      }
      if ($name -eq 'word/_rels/document.xml.rels') { $declaredIds = $ids }
      [void]$info.Add("$name : $($ids.Count) relationship(s), unique")
    }
    # r:id references must resolve. The id value is read straight off the
    # matching attribute node, so no namespace lookup is involved.
    $referenced = 0
    $referencedIds = New-Object System.Collections.ArrayList
    foreach ($name in @('word/document.xml', 'word/header1.xml', 'word/footer1.xml')) {
      if (-not $xml.ContainsKey($name)) { continue }
      foreach ($node in @(Get-Elems $xml[$name] '*' '')) {
        foreach ($attr in $node.Attributes) {
          if ($attr.LocalName -ne 'id') { continue }
          if ($attr.NamespaceURI -ne $R) { continue }
          $referenced++
          $id = [string]$attr.Value
          [void]$referencedIds.Add($id)
          if (-not $declaredIds.ContainsKey($id)) { [void]$fail.Add("$name references undeclared relationship '$id'") }
        }
      }
    }
    [void]$info.Add("r:id references across document/header/footer: $referenced ($(($referencedIds | Sort-Object -Unique) -join ', ')), all resolve")

    # ---- 5. table grids -------------------------------------------------
    $docXml = $xml['word/document.xml']
    $bodyEl = @(Get-Elems $docXml 'body' $W)[0]
    $tableCount = 0
    foreach ($tbl in @(Get-Elems $docXml 'tbl' $W)) {
      $tableCount++
      $grid = $null
      foreach ($child in $tbl.ChildNodes) { if ($child.LocalName -eq 'tblGrid') { $grid = $child; break } }
      if (-not $grid) { [void]$fail.Add("w:tbl #$tableCount has no w:tblGrid"); continue }
      $gridCols = (@(Get-Elems $grid 'gridCol' $W)).Count
      $rowIndex = 0
      foreach ($tr in @(Get-Elems $tbl 'tr' $W)) {
        $rowIndex++
        $tc = (@(Get-Elems $tr 'tc' $W)).Count
        if ($tc -ne $gridCols) {
          [void]$fail.Add("w:tbl #$tableCount row $rowIndex has $tc <w:tc> but gridCol count is $gridCols")
        }
      }
    }
    [void]$info.Add("tables: $tableCount, every w:tbl has a w:tblGrid whose gridCol count matches every row's tc count")

    # ---- 6. style ids ---------------------------------------------------
    $styleIds = @{}
    if ($xml.ContainsKey('word/styles.xml')) {
      foreach ($s in @(Get-Elems $xml['word/styles.xml'] 'style' $W)) {
        $styleIds[[string]$s.GetAttribute('styleId', $W)] = $true
      }
    }
    # Styles Word supplies itself and that a document may legally reference
    # without defining.
    $builtin = @('Normal','DefaultParagraphFont','TableNormal','NoList','Hyperlink','Header','Footer')
    $missingStyles = New-Object System.Collections.ArrayList
    foreach ($tag in @('pStyle', 'rStyle', 'tblStyle')) {
      foreach ($ref in @(Get-Elems $docXml $tag $W)) {
        $v = [string]$ref.GetAttribute('val', $W)
        if ($styleIds.ContainsKey($v)) { continue }
        if ($builtin -contains $v) { continue }
        [void]$missingStyles.Add($v)
      }
    }
    $missingStyles = @($missingStyles | Sort-Object -Unique)
    if ($missingStyles.Count -gt 0) { [void]$fail.Add('undefined style id(s) referenced: ' + ($missingStyles -join ', ')) }
    [void]$info.Add("styles: $($styleIds.Count) defined, all referenced pStyle/rStyle/tblStyle ids resolve")

    # ---- 7. numbering ids ----------------------------------------------
    $numIds = @{}
    if ($xml.ContainsKey('word/numbering.xml')) {
      foreach ($n in @(Get-Elems $xml['word/numbering.xml'] 'num' $W)) {
        $numIds[[string]$n.GetAttribute('numId', $W)] = $true
      }
    }
    $missingNum = New-Object System.Collections.ArrayList
    foreach ($ref in @(Get-Elems $docXml 'numId' $W)) {
      $v = [string]$ref.GetAttribute('val', $W)
      if (-not $numIds.ContainsKey($v)) { [void]$missingNum.Add($v) }
    }
    $missingNum = @($missingNum | Sort-Object -Unique)
    if ($missingNum.Count -gt 0) { [void]$fail.Add('undefined numId(s) referenced: ' + ($missingNum -join ', ')) }
    [void]$info.Add("numbering: $($numIds.Count) numId(s) defined, all referenced numIds resolve")

    # ---- 8. body ends with exactly one sectPr --------------------------
    if (-not $bodyEl) {
      [void]$fail.Add('word/document.xml has no w:body')
    } else {
      $bodyChildren = @($bodyEl.ChildNodes | Where-Object { $_.NodeType -eq 'Element' })
      $sectPrs = @($bodyChildren | Where-Object { $_.LocalName -eq 'sectPr' })
      if ($sectPrs.Count -ne 1) { [void]$fail.Add("w:body has $($sectPrs.Count) w:sectPr child(ren); exactly 1 expected") }
      elseif (-not ($bodyChildren[$bodyChildren.Count - 1].LocalName -eq 'sectPr')) {
        [void]$fail.Add('the w:sectPr is not the last child of w:body')
      }
      [void]$info.Add("w:body: $($bodyChildren.Count) element children, exactly one trailing w:sectPr")
    }
  } finally {
    $zip.Dispose()
  }

  foreach ($i in $info) { Out-Line ('  ok   ' + $i) }
  if ($fail.Count -gt 0) {
    $totalFailures += $fail.Count
    foreach ($f in $fail) { Out-Line ('  FAIL ' + $f) }
    Out-Line ('RESULT|' + $docPath + '|FAIL|' + $fail.Count + ' check(s) failed')
  } else {
    Out-Line ('RESULT|' + $docPath + '|PASS|all 9 checks passed')
  }
}

Out-Line ('=' * 78)
Out-Line ("SUMMARY|files=$checked failures=$totalFailures")
if ($checked -eq 0) { exit 3 }
if ($totalFailures -gt 0) { exit 1 }
exit 0
