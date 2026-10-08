$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $projectRoot '.demo-server.pid'
$stdoutLog = Join-Path $projectRoot '.demo-server.out.log'
$stderrLog = Join-Path $projectRoot '.demo-server.err.log'
$serverEntry = Join-Path $projectRoot 'dist\server.cjs'
$sourceDataDir = Join-Path $projectRoot 'data'
$demoDataDir = Join-Path $projectRoot '.demo-data'
$demoUrl = 'http://127.0.0.1:3000/'

if (Test-Path -LiteralPath $pidFile) {
    $existingPid = Get-Content -LiteralPath $pidFile -ErrorAction SilentlyContinue
    if ($existingPid -and (Get-Process -Id $existingPid -ErrorAction SilentlyContinue)) {
        Start-Process $demoUrl
        exit 0
    }
    Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}

if (-not (Test-Path -LiteralPath $serverEntry)) {
    throw 'Build output dist\server.cjs was not found. Run npm install and npm run build first.'
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
    throw 'Node.js was not found. Install Node.js or add node.exe to PATH.'
}

$env:NODE_ENV = 'production'
$env:DEMO_MODE = '1'
$env:PORT = '3000'
$env:APP_DATA_DIR = $demoDataDir
Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue

if (-not (Test-Path -LiteralPath $demoDataDir)) {
    Copy-Item -LiteralPath $sourceDataDir -Destination $demoDataDir -Recurse
}

$process = Start-Process -FilePath $nodeCommand.Source `
    -ArgumentList @($serverEntry) `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -PassThru

Set-Content -LiteralPath $pidFile -Value $process.Id -Encoding ASCII

$ready = $false
for ($attempt = 0; $attempt -lt 40; $attempt++) {
    try {
        $health = Invoke-RestMethod -Uri 'http://127.0.0.1:3000/api/health' -TimeoutSec 1
        if ($health.success -and $health.mode -eq 'demo') {
            $ready = $true
            break
        }
    } catch {
        Start-Sleep -Milliseconds 250
    }
}

if (-not $ready) {
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
    throw "Demo server failed to start. Check log: $stderrLog"
}

Start-Process $demoUrl

