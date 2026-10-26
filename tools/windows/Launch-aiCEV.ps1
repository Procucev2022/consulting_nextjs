# aiCEV Launcher Script
$ErrorActionPreference = "Stop"
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")

Write-Host "Starting aiCEV Internal Assessment Platform..." -ForegroundColor Cyan

$backendPort = 5000
$frontendPort = 3001

$backendActive = Get-NetTCPConnection -LocalPort $backendPort -ErrorAction SilentlyContinue
if (-not $backendActive) {
    Write-Host "Starting backend service on port $backendPort..." -ForegroundColor Yellow
    Start-Process -FilePath "npm" -ArgumentList "run start:backend" -WorkingDirectory $ProjectRoot -WindowStyle Hidden
}

$frontendActive = Get-NetTCPConnection -LocalPort $frontendPort -ErrorAction SilentlyContinue
if (-not $frontendActive) {
    Write-Host "Starting frontend service on port $frontendPort..." -ForegroundColor Yellow
    Start-Process -FilePath "npm" -ArgumentList "run start:frontend" -WorkingDirectory $ProjectRoot -WindowStyle Hidden
}

$maxWait = 30
$count = 0
$healthy = $false
while ($count -lt $maxWait) {
    try {
        $res = Invoke-WebRequest -Uri "http://localhost:$backendPort/api/health" -UseBasicParsing -TimeoutSec 2
        if ($res.StatusCode -eq 200) {
            $healthy = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
    $count++
}

if ($healthy) {
    Write-Host "aiCEV is ready! Opening browser at http://localhost:$frontendPort..." -ForegroundColor Green
    Start-Process "http://localhost:$frontendPort"
} else {
    Write-Host "Warning: Health endpoint did not respond within $maxWait seconds. Navigating anyway..." -ForegroundColor Yellow
    Start-Process "http://localhost:$frontendPort"
}
