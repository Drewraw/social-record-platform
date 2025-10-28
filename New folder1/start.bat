@echo off
echo Starting Social Record Platform...
echo.

echo Starting Backend Server...
start cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start cmd /k "cd frontend && npm start"

echo.
echo Both servers are starting in separate windows!
echo Frontend: http://localhost:3000
echo Backend: http://localhost:5000/api
echo.
pause
