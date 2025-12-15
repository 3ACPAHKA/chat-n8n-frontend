# Get all node and cloudflared processes
$processes = Get-CimInstance Win32_Process -Filter "Name = 'node.exe' OR Name = 'cloudflared.exe'"

foreach ($p in $processes) {
    # Check if the command line contains 'n8n'
    if ($p.CommandLine -match 'n8n') {
        Write-Host "Skipping n8n process $($p.ProcessId)..." -ForegroundColor Green
    }
    else {
        Write-Host "Killing old process $($p.ProcessId) ($($p.Name))..." -ForegroundColor Yellow
        Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    }
}
