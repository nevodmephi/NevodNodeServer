@echo "starting eas server"
start db\runDB
set TASK=eas&&node main.js
pause
