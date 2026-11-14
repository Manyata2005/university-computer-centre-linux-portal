
#!/bin/bash

echo "======================================"
echo " UNIVERSITY SERVER HEALTH REPORT"
echo "======================================"

echo
echo "1. Server Hostname"
hostname

echo
echo "2. Operating System"
cat /etc/os-release | grep PRETTY_NAME

echo
echo "3. System Uptime"
uptime -p

echo
echo "4. CPU Information"
nproc
uptime

echo
echo "5. Memory Usage"
free -h

echo
echo "6. Disk Usage"
df -h /

echo
echo "7. Apache Web Server"
systemctl is-active apache2

echo
echo "8. SSH Server"
systemctl is-active ssh || true

echo
echo "9. Running Processes"
ps -eo pid,comm,%cpu,%mem --sort=-%cpu | head -n 8

echo
echo "======================================"
echo " HEALTH CHECK COMPLETED"
echo "======================================"
