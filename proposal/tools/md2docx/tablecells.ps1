# Report, for each table in a .docx, its size and the cell count of every row, and
# compare rows that contain a literal '|' against the Markdown source value.
# Usage: tablecells.ps1 <docx> <cellsPerRow expected for pipe-test tables> [md]
param(
    [Parameter(Mandatory = $true, Position = 0)][string]$DocxPath,
    [Parameter(Mandatory = $false, Position = 1)][string]$MarkdownPath
)
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Xml
$zip = [System.IO.Compression.ZipFile]::OpenRead($DocxPath)
$e = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
$sr = New-Object System.IO.StreamReader($e.Open(), (New-Object System.Text.UTF8Encoding($false)), $true)
$xml = $sr.ReadToEnd(); $sr.Dispose(); $zip.Dispose()
$xd = New-Object System.Xml.XmlDocument
$xd.LoadXml($xml)
$ns = New-Object System.Xml.XmlNamespaceManager($xd.NameTable)
$ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')

$ti = 0
$bad = 0
foreach ($tbl in $xd.SelectNodes('//w:tbl', $ns)) {
    $ti++
    $rows = @($tbl.SelectNodes('w:tr', $ns))
    $counts = @()
    foreach ($r in $rows) { $counts += $r.SelectNodes('w:tc', $ns).Count }
    $uniq = ($counts | Sort-Object -Unique) -join ','
    $rect = ($counts | Sort-Object -Unique).Count -eq 1
    if (-not $rect) { $bad++ }
    # show the text of any cell containing a literal pipe, which is the evidence
    # that an escaped pipe or a code-span pipe stayed inside one cell
    $piped = @()
    foreach ($r in $rows) {
        foreach ($c in $r.SelectNodes('w:tc', $ns)) {
            $txt = ''
            foreach ($tn in $c.SelectNodes('.//w:t', $ns)) { $txt += $tn.InnerText }
            if ($txt.Contains('|')) { $piped += $txt.Trim() }
        }
    }
    $flag = if ($rect) { 'rectangular' } else { 'RAGGED' }
    Write-Output ("table {0,2}: {1,2} rows x {2} cells  [{3}]  cellCounts={4}" -f $ti, $rows.Count, $counts[0], $flag, $uniq)
    if ($piped.Count) {
        Write-Output ("          cells containing a literal '|' ({0}):" -f $piped.Count)
        foreach ($p in ($piped | Select-Object -First 6)) { Write-Output ("            " + $p) }
    }
}
Write-Output ("TOTAL tables={0}  ragged={1}" -f $ti, $bad)
if ($bad -gt 0) { exit 1 }
exit 0
