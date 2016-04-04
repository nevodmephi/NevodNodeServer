@echo "starting neutron server"
start db\startdb
set TASK=neutron&&node main.js
pause
