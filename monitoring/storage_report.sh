#!/bin/bash

echo "======================================"
echo " UNIVERSITY SERVER STORAGE REPORT"
echo "======================================"

echo
echo "1. Overall Disk Usage"
df -h /

echo
echo "2. Department Storage Usage"
for department in IT CSE AIML Faculty
do
    echo "--------------------------------------"
    echo "Department: $department"
    du -sh "/srv/university/$department"
done

echo
echo "3. Storage Directory Permissions"
ls -ld /srv/university/*

echo
echo "Storage report completed."
