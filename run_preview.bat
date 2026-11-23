@echo off
title Jaipur Luxury Theme Local Preview Server
echo ============================================================
echo   Starting Indian Rug Store Luxury Theme Preview Server
echo ============================================================
echo.
echo Opening browser at http://localhost:3000/preview.html ...
start http://localhost:3000/preview.html
echo.
echo Press Ctrl+C in this window to stop the server when done.
echo.
cd /d "Q:\BACK OFFICE\SAHIL\theme_export__indianrugstore-com-copy-of-dawn-changes__06NOV2026-0350pm"
python -m http.server 3000
pause
