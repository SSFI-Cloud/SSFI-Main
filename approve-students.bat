@echo off
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot ssfi_db -e "SELECT COUNT(*) as pending_students FROM users WHERE role='STUDENT' AND isApproved=0;" > H:\approve-result.txt 2>&1
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot ssfi_db -e "UPDATE users SET isApproved=1, approvalStatus='APPROVED', isActive=1, accountStatus='ACTIVE' WHERE role='STUDENT' AND isApproved=0;" >> H:\approve-result.txt 2>&1
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot ssfi_db -e "SELECT COUNT(*) as still_pending FROM users WHERE role='STUDENT' AND isApproved=0;" >> H:\approve-result.txt 2>&1
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot ssfi_db -e "SELECT COUNT(*) as total_approved FROM users WHERE role='STUDENT' AND isApproved=1;" >> H:\approve-result.txt 2>&1
echo DONE >> H:\approve-result.txt
