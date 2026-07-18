@echo off
REM One-click publish: saves all changes and pushes to GitHub.
REM Render sees the push and updates the live site automatically (~1-2 min).
cd /d "%~dp0"
git add -A
git commit -m "update site"
git push
echo.
echo Done! The live site will update itself in a minute or two.
pause
