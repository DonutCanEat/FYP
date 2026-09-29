<#
.SYNOPSIS
    Scale benchmark for md2docx: runs conversions as child processes and records
    wall-clock time and PEAK memory.

.DESCRIPTION
    Node is launched as a child process so its peak Working Set can be sampled
    with Get-Process while it runs. Peak memory is the number that matters for the
    300,000-word target: it shows whether the converter holds the whole document
    in memory or streams it.

    Reports, for each case: input bytes, output bytes, elapsed ms, peak MB,
    parts, words, tables, code blocks and whether the digests self-checked.

.PARAMETER OutDir
    Directory holding the generated stress corpus and receiving the .docx files.

.EXAMPLE
    .\bench.ps1 -OutDir .\stress
#>
[CmdletBinding()]
param(
    [string]$OutDir = (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'stress'),
    [int]$SampleMs = 150
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2.0

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$node = (Get-Command node.exe).Source
$convert = Join-Path $here 'convert.js'

function Invoke-Md2Docx {
    param([string[]]$NodeArgs, [string]$Label)
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $node
    $psi.WorkingDirectory = $here
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    # .NET Framework 4.x (Windows PowerShell 5.1) has no ArgumentList; build the
    # quoted argument string instead.
    $quoted = @()
    foreach ($a in $NodeArgs) { $quoted += '"' + ($a -replace '"', '\"') + '"' }
    $psi.Arguments = $quoted -join ' '
    $proc = [System.Diagnostics.Process]::Start($psi)
    $peak = 0L
    $readOut = $proc.StandardOutput.ReadToEndAsync()
    $readErr = $proc.StandardError.ReadToEndAsync()
    while (-not $proc.HasExited) {
        try {
            $proc.Refresh()
            if ($proc.WorkingSet64 -gt $peak) { $peak = $proc.WorkingSet64 }
        }
        catch { }
        Start-Sleep -Milliseconds $SampleMs
    }
    $proc.WaitForExit()
    $stdout = $readOut.Result
    $stderr = $readErr.Result
    $sw.Stop()
    $report = $null
    foreach ($line in ($stdout -split "`n")) {
        if ($line.StartsWith('MD2DOCX|')) { $report = $line.Substring(8) | ConvertFrom-Json }
    }
    [pscustomobject]@{
        Label     = $Label
        ExitCode  = $proc.ExitCode
        ElapsedMs = [math]::Round($sw.Elapsed.TotalMilliseconds)
        PeakMB    = [math]::Round($peak / 1MB, 1)
        Report    = $report
        Stderr    = ($stderr -split "`n" | Where-Object { $_ -match 'WARNING|Error|error' } | Select-Object -First 3) -join ' | '
    }
}

$files = @(Get-ChildItem -LiteralPath $OutDir -Filter 'stress-*.md' | Sort-Object Name)
if ($files.Count -eq 0) { throw "no stress-*.md files in $OutDir" }
$inputBytes = ($files | Measure-Object -Property Length -Sum).Sum
Write-Host ("stress corpus: {0} files, {1:N0} bytes" -f $files.Count, $inputBytes)

$results = @()
$combined = Join-Path $OutDir 'stress-combined.docx'
$results += Invoke-Md2Docx -Label 'combined-8-files' -NodeArgs (@($convert) + $files.FullName + @($combined, 'Stress Corpus (8 files combined)'))

$single = Join-Path $OutDir 'stress-single-01.docx'
$results += Invoke-Md2Docx -Label 'single-largest-file' -NodeArgs @($convert, $files[-1].FullName, $single, 'Single file')

$dup = @()
for ($i = 0; $i -lt 3; $i++) { $dup += $files.FullName }
$triple = Join-Path $OutDir 'stress-triple.docx'
$results += Invoke-Md2Docx -Label 'triple-concatenation' -NodeArgs (@($convert) + $dup + @($triple, 'Triple concatenation'))

Write-Host ''
Write-Host ('{0,-22} {1,7} {2,10} {3,14} {4,9} {5,12}' -f 'case', 'exit', 'time-ms', 'output-bytes', 'peak-MB', 'words')
$rows = @()
foreach ($r in $results) {
    $ob = if ($r.Report -and $r.Report.PSObject.Properties['outputBytes']) { $r.Report.outputBytes } else { 0 }
    $w = if ($r.Report -and $r.Report.PSObject.Properties['words']) { $r.Report.words } else { 0 }
    Write-Host ('{0,-22} {1,7} {2,10} {3,14:N0} {4,9} {5,12:N0}' -f $r.Label, $r.ExitCode, $r.ElapsedMs, $ob, $r.PeakMB, $w)
    if ($r.Stderr) { Write-Host ("    stderr: " + $r.Stderr) }
    $rows += [pscustomobject]@{
        case = $r.Label; exit = $r.ExitCode; ms = $r.ElapsedMs; peakMB = $r.PeakMB
        outputBytes = $ob; words = $w
        paragraphs = $(if ($r.Report -and $r.Report.PSObject.Properties['stats']) { $r.Report.stats.paragraphs } else { 0 })
        tables = $(if ($r.Report -and $r.Report.PSObject.Properties['stats']) { $r.Report.stats.tables } else { 0 })
        codeBlocks = $(if ($r.Report -and $r.Report.PSObject.Properties['stats']) { $r.Report.stats.codeBlocks } else { 0 })
        listItems = $(if ($r.Report -and $r.Report.PSObject.Properties['stats']) { $r.Report.stats.listItems } else { 0 })
        docXmlBytes = $(if ($r.Report -and $r.Report.PSObject.Properties['documentXmlBytes']) { $r.Report.documentXmlBytes } else { 0 })
        digestOk = $(if ($r.Report -and $r.Report.PSObject.Properties['bodyDigestMatches']) { $r.Report.bodyDigestMatches } else { $false })
        inputBytes = $inputBytes
        stderr = $r.Stderr
    }
}
Write-Output ('BENCH|' + ($rows | ConvertTo-Json -Depth 4 -Compress))
