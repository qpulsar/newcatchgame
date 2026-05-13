@echo off
setlocal

REM UTF-8 destegi
chcp 65001 > nul

REM Renk tanimlamalari
set "ESC="
for /F %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"

set "GREEN="
set "BLUE="
set "NC="

if not "%ESC%"=="" (
    set "GREEN=%ESC%[92m"
    set "BLUE=%ESC%[94m"
    set "NC=%ESC%[0m"
)

echo %GREEN%EduGame Studio baslatiliyor...%NC%

REM 1. Backend Baslatma
echo %BLUE%Backend (FastAPI) baslatiliyor...%NC%
start "Backend" cmd /k "cd apps\api && if exist venv\Scripts\uvicorn.exe (venv\Scripts\uvicorn main:app --reload --port 8000) else if exist .venv\Scripts\uvicorn.exe (.venv\Scripts\uvicorn main:app --reload --port 8000) else (uvicorn main:app --reload --port 8000)"

REM 2. Frontend Baslatma
echo %BLUE%Frontend (Vite + React) baslatiliyor...%NC%
start "Frontend" cmd /k "cd apps\web-game && npm run dev -- --port 5173"

echo %GREEN%------------------------------------------%NC%
echo %GREEN%Sistem Hazir!%NC%
echo Backend: %BLUE%http://localhost:8000%NC%
echo Frontend: %BLUE%http://localhost:5173%NC%
echo %GREEN%------------------------------------------%NC%
echo Servisler ayri pencerelerde baslatildi.
echo Kapatmak icin acilan pencereleri kapatabilir veya bu pencereyi kapatabilirsiniz.

pause
