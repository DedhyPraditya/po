@echo off
REM Script untuk push otomatis ke GitHub (Windows)
REM Usage: git-push.bat "pesan commit"

echo ========================================
echo    Auto Push ke GitHub
echo ========================================
echo.

REM Cek apakah ada perubahan
git status -s > nul 2>&1
if errorlevel 1 (
    echo [ERROR] Bukan git repository
    pause
    exit /b 1
)

REM Tampilkan file yang berubah
echo File yang berubah:
git status -s
echo.

REM Ambil pesan commit dari argument atau gunakan default
if "%~1"=="" (
    set "COMMIT_MSG=Update: %date% %time%"
) else (
    set "COMMIT_MSG=%~1"
)

echo Pesan commit: %COMMIT_MSG%
echo.

REM Add semua perubahan
echo [1/3] Menambahkan file...
git add -A

REM Commit
echo [2/3] Melakukan commit...
git commit -m "%COMMIT_MSG%"

REM Push ke GitHub
echo [3/3] Push ke GitHub...
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo  [SUCCESS] Berhasil push ke GitHub!
    echo ========================================
    echo Repository: https://github.com/DedhyPraditya/po
) else (
    echo.
    echo ========================================
    echo  [ERROR] Gagal push ke GitHub
    echo ========================================
    pause
    exit /b 1
)

echo.
pause
