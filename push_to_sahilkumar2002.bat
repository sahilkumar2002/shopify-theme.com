@echo off
title Push to GitHub: sahilkumar2002/shopify-theme.com
echo ====================================================================
echo   Pushing Luxury Theme to https://github.com/sahilkumar2002/shopify-theme.com
echo ====================================================================
echo.
cd /d "Q:\BACK OFFICE\SAHIL\theme_export__indianrugstore-com-copy-of-dawn-changes__06NOV2026-0350pm"
git remote set-url origin https://github.com/sahilkumar2002/shopify-theme.com.git

echo Current remote:
git remote -v
echo.
echo Pushing branch main to origin...
git push -u origin main
echo.
pause
