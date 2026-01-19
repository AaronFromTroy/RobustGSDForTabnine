@echo off
REM Create symlink for Tabnine guidelines on Windows
REM IMPORTANT: Run as Administrator!
REM Usage: Run from your project root (where gsd\ directory exists)

echo Checking for Administrator privileges...
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo.
    echo ============================================
    echo ERROR: This script requires Administrator privileges
    echo ============================================
    echo.
    echo Right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

REM Check if gsd\guidelines exists
if not exist "gsd\guidelines" (
    echo.
    echo ============================================
    echo ERROR: gsd\guidelines not found
    echo ============================================
    echo.
    echo Make sure you are running from project root with gsd\ directory
    echo Current directory: %CD%
    echo.
    pause
    exit /b 1
)

REM Create .tabnine directory if needed
if not exist ".tabnine" mkdir .tabnine

REM Remove existing symlink/directory if present
if exist ".tabnine\guidelines" (
    echo Removing existing .tabnine\guidelines...
    rmdir /s /q ".tabnine\guidelines"
)

REM Create symlink (requires Admin)
echo Creating symlink...
echo   From: .tabnine\guidelines
echo   To:   %CD%\gsd\guidelines

mklink /D ".tabnine\guidelines" "%CD%\gsd\guidelines"

if %errorLevel% EQU 0 (
    echo.
    echo ============================================
    echo SUCCESS: Symlink created!
    echo ============================================
    echo.
    echo Verification:
    dir .tabnine\guidelines
) else (
    echo.
    echo ============================================
    echo ERROR: Failed to create symlink
    echo ============================================
    echo.
    echo Alternative: Copy files instead
    echo   mkdir .tabnine\guidelines
    echo   copy gsd\guidelines\*.md .tabnine\guidelines\
    echo.
)

pause
