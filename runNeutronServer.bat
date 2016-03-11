@echo "starting neutron server"
start db\startdb
node neutron-main.js
pause
