# PowerShell script to kill process on port 3000
# Usage: .\scripts\kill-port.ps1 [port]

param(
    [int]$Port = 3000
)

Write-Host "Finding process on port $Port..." -ForegroundColor Yellow

$connections = netstat -ano | Select-String ":$Port.*LISTENING"
if ($connections) {
    $pid = ($connections -split '\s+')[-1]
    Write-Host "Found process $pid on port $Port" -ForegroundColor Red
    
    try {
        taskkill /F /PID $pid
        Write-Host "✓ Killed process $pid" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to kill process: $_" -ForegroundColor Red
    }
} else {
    Write-Host "✓ Port $Port is free" -ForegroundColor Green
}

# Wait a moment for cleanup
Start-Sleep -Seconds 1

Write-Host "Port $Port status:" -ForegroundColor Cyan
netstat -ano | Select-String ":$Port.*LISTENING"

