@echo off
echo.
echo  Starting auto-push watcher...
echo  Changes will be pushed to GitHub automatically.
echo  Close this window to stop.
echo.
python watch_and_push.py
pause
