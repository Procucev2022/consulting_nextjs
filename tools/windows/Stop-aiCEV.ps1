# aiCEV Graceful Stop Script
Write-Host "Stopping aiCEV services..." -ForegroundColor Cyan

$ports = @(5000, 3001)
foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $pids) {
            Write-Host "Stopping process PID $pid on port $port..." -ForegroundColor Yellow
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
}
Write-Host "aiCEV services stopped cleanly." -ForegroundColor Green
