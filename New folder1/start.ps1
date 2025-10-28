# Start both frontend and backend servers
Write-Host "🚀 Starting Social Record Platform..." -ForegroundColor Green
Write-Host ""

# Start backend server in a new window
Write-Host "📡 Starting Backend Server (Port 5000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend server in a new window
Write-Host "🎨 Starting Frontend Server (Port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm start"

Write-Host ""
Write-Host "✅ Both servers are starting in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Access the application at:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API: http://localhost:5000/api" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
