@echo off
title SmartPill - Install Dependencies
echo ========================================================
echo   Installing Dependencies for SmartPill (Root, Backend, Frontend)
echo ========================================================
echo.

npm run install:all
echo.
echo ========================================================
echo   Installation complete! Run start.bat or 'npm run dev'.
echo ========================================================
pause
