@echo off
title Shape Friends - server
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  powershell -NoProfile -Command "Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('Node.js is needed to run Shape Friends. Install it from https://nodejs.org and run this again.', 'Shape Friends') | Out-Null"
  exit /b 1
)

node server.js
pause
