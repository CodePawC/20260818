$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $projectRoot '.demo-server.pid'

if (-not (Test-Path -LiteralPath $pidFile)) {
    Write-Host 'Demo server is not running.'
    exit 0
}

$serverPid = Get-Content -LiteralPath $pidFile -ErrorAction SilentlyContinue
if ($serverPid) {
    Stop-Process -Id $serverPid -Force -ErrorAction SilentlyContinue
}
Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
Write-Host 'Demo server stopped.'

