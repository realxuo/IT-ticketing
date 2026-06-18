@echo off
echo.
echo  Pushing to GitHub...
echo  -------------------------------------

git remote remove origin 2>nul
git remote add origin https://github.com/realxuo/IT-ticketing.git

git add -A

set /p msg="  Commit message (or press Enter for 'Update'): "
if "%msg%"=="" set msg=Update

git commit -m "%msg%"

git push origin master --force

echo.
echo  Done! View your repo at:
echo  https://github.com/realxuo/IT-ticketing
echo.
pause
