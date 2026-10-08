$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$stopScript = Join-Path $PSScriptRoot 'stop-demo.ps1'
$startScript = Join-Path $PSScriptRoot 'start-demo.ps1'
$sourceDataDir = Join-Path $projectRoot 'data'
$demoDataDir = Join-Path $projectRoot '.demo-data'

& $stopScript
if (Test-Path -LiteralPath $demoDataDir) {
    Remove-Item -LiteralPath $demoDataDir -Recurse -Force
}
Copy-Item -LiteralPath $sourceDataDir -Destination $demoDataDir -Recurse
& $startScript

