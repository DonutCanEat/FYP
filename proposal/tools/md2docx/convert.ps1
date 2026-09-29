<#
.SYNOPSIS
    Markdown -> Word (.docx) converter (PowerShell front-end).

.DESCRIPTION
    This box has no pandoc, no LibreOffice/soffice, no 7z and only a broken
    Windows Store Python stub (exit 9009). Node.js is present and is what
    actually writes the OOXML package; this script is the ergonomic front-end
    that locates Node, validates the arguments, runs the converter and prints
    the machine-readable MD2DOCX|{json} report.

    The heavy lifting lives in convert.js next to this file. Do not expect
    pandoc-style Markdown extensions: this is plain GitHub-flavoured Markdown.

.PARAMETER InputPath
    Path to the source Markdown file.

.PARAMETER OutputPath
    Path to the .docx to create (overwritten if it exists).

.PARAMETER Title
    Optional document title. Also used for the running header and docProps.
    Defaults to the first " # " heading, else the input file's base name.

.PARAMETER Subtitle
    Optional subtitle line printed under the title on the title page.

.PARAMETER Author
    Author written to docProps/core.xml (default "FYP Proposal").

.EXAMPLE
    .\convert.ps1 -InputPath ..\..\00-design-baseline.md -OutputPath .\out.docx -Title "FYP Proposal"

.EXAMPLE
    .\convert.ps1 .\sample.md .\sample.docx "Sample Document"
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $false, Position = 0)]
    [string]$InputPath,

    [Parameter(Mandatory = $false, Position = 1)]
    [string]$OutputPath,

    [Parameter(Mandatory = $false, Position = 2)]
    [string]$Title,

    [Parameter(Mandatory = $false)]
    [string]$Subtitle,

    [Parameter(Mandatory = $false)]
    [string]$Author = 'FYP Proposal',

    [switch]$Quiet,

    [switch]$PassThru
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2.0

function Fail([string]$message, [int]$code = 1) {
    [Console]::Error.WriteLine("convert.ps1: ERROR: $message")
    exit $code
}

if (-not $InputPath) { Fail "no input Markdown path supplied. usage: convert.ps1 <input.md> <output.docx> [title]" 2 }
if (-not $OutputPath) { Fail "no output .docx path supplied. usage: convert.ps1 <input.md> <output.docx> [title]" 2 }

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$js = Join-Path $here 'convert.js'
if (-not (Test-Path -LiteralPath $js)) { Fail "converter core not found next to this script: $js" 3 }

# ---- locate Node.js -------------------------------------------------------
$node = $null
$cmd = Get-Command node.exe -ErrorAction SilentlyContinue
if ($cmd) { $node = $cmd.Source }
if (-not $node) {
    foreach ($candidate in @(
            (Join-Path $env:ProgramFiles 'nodejs\node.exe'),
            (Join-Path ${env:ProgramFiles(x86)} 'nodejs\node.exe'),
            (Join-Path $env:LOCALAPPDATA 'Programs\nodejs\node.exe'),
            (Join-Path $env:APPDATA 'npm\node.exe'))) {
        if ($candidate -and (Test-Path -LiteralPath $candidate)) { $node = $candidate; break }
    }
}
if (-not $node) { Fail "Node.js not found on PATH or in the usual install locations. The converter cannot run without it." 4 }

# ---- normalise paths ------------------------------------------------------
if (-not [System.IO.Path]::IsPathRooted($InputPath)) { $InputPath = Join-Path (Get-Location).Path $InputPath }
if (-not [System.IO.Path]::IsPathRooted($OutputPath)) { $OutputPath = Join-Path (Get-Location).Path $OutputPath }
$InputPath = [System.IO.Path]::GetFullPath($InputPath)
$OutputPath = [System.IO.Path]::GetFullPath($OutputPath)

if (-not (Test-Path -LiteralPath $InputPath)) { Fail "input Markdown not found: $InputPath" 5 }
if ((Get-Item -LiteralPath $InputPath).PSIsContainer) { Fail "input path is a directory, not a Markdown file: $InputPath" 5 }
if (-not $OutputPath.EndsWith('.docx', [System.StringComparison]::OrdinalIgnoreCase)) {
    Fail "output path must end in .docx: $OutputPath" 6
}

$outDir = Split-Path -Parent $OutputPath
if ($outDir -and -not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

# ---- run ------------------------------------------------------------------
# Order matters: anything placed BEFORE the script name is consumed by the Node
# CLI itself, which rejects the converter's own flags (e.g. "bad option: --author").
# The script name therefore comes first, then the positional input/output/title,
# then the converter's options.
$nodeArgs = @($js, $InputPath, $OutputPath)
if ($Title) { $nodeArgs += $Title }
if ($Author) { $nodeArgs += @('--author', $Author) }
if ($Subtitle) { $nodeArgs += @('--subtitle', $Subtitle) }

$started = Get-Date
# PowerShell 5.1 has no ArgumentList, and passing an array to a native command
# re-quotes values containing spaces in a way Node's own argument parser
# mis-splits (a title like "De-risking validation run" arrived as three
# arguments). Build a fully quoted command line instead.
$argLine = ($nodeArgs | ForEach-Object { ConvertTo-Json -Compress ([string]$_) }) -join ' '
$lines = & cmd.exe /c "`"$node`" $argLine 2>&1"
$exit = $LASTEXITCODE
$elapsed = (Get-Date) - $started

if ($exit -ne 0) {
    $lines | ForEach-Object { [Console]::Error.WriteLine([string]$_) }
    Fail "converter core (convert.js) exited with code $exit" $exit
}

$report = $null
foreach ($l in $lines) {
    $s = [string]$l
    if ($s.StartsWith('MD2DOCX|')) {
        $report = $s.Substring(8) | ConvertFrom-Json
    }
}

# Read a field out of the JSON report without tripping Set-StrictMode. A missing
# or renamed field should degrade the display, never abort the conversion, and a
# legitimate zero must be preserved (hence the explicit $null test, not -not).
function ReportField($obj, [string]$name, $default = 0) {
    if ($null -eq $obj) { return $default }
    $p = $obj.PSObject.Properties[$name]
    if ($null -ne $p) { return $p.Value }
    return $default
}

if (-not $Quiet) {
    if ($report) {
        $st = ReportField $report 'stats' $null
        Write-Host ("md2docx: wrote {0}" -f (ReportField $report 'output' $OutputPath))
        Write-Host ("  bytes      : {0:N0}" -f (ReportField $report 'outputBytes'))
        Write-Host ("  zip parts  : {0}" -f (ReportField $report 'parts'))
        Write-Host ("  paragraphs : {0}  (headings {1}/{2}/{3}/{4})" -f `
                (ReportField $st 'paragraphs'), (ReportField (ReportField $st 'headings' $null) '1'),
            (ReportField (ReportField $st 'headings' $null) '2'), (ReportField (ReportField $st 'headings' $null) '3'),
            (ReportField (ReportField $st 'headings' $null) '4'))
        Write-Host ("  tables     : {0}   code blocks: {1}   list items: {2}   figures: {3}   rules: {4}" -f `
                (ReportField $st 'tables'), (ReportField $st 'codeBlocks'), (ReportField $st 'listItems'),
            (ReportField $st 'figures'), (ReportField $st 'rules'))
        Write-Host ("  words      : {0:N0}   chars (no spaces): {1:N0}" -f `
                (ReportField $report 'words'), (ReportField $report 'charsNoSpaces'))
        Write-Host ("  elapsed    : {0:N0} ms (parse {1:N0} ms)" -f $elapsed.TotalMilliseconds, (ReportField $report 'parseMs'))
    }
    else {
        Write-Host ("md2docx: wrote {0} in {1:N0} ms" -f $OutputPath, $elapsed.TotalMilliseconds)
    }
}

# Expose the report to callers that dot-source this script or capture its output.
# Note: when invoked with -File, anything written to the output stream would be
# printed to the console, so the report is only echoed when the caller explicitly
# asks for it with -PassThru.
if ($PassThru) {
    if ($report) { $report } else { Get-Item -LiteralPath $OutputPath }
}
exit 0
