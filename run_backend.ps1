Write-Host "Starting AeroSemi AI Burn-In Screening Backend (FastAPI on http://localhost:8000)..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\backend"
$pythonExe = "$HOME\AppData\Local\Programs\Python\Python310\python.exe"
if (-not (Test-Path $pythonExe)) {
    $pythonExe = "python"
}
& $pythonExe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
