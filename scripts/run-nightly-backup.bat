@echo off
cd /d "D:\Picmychip\picmychip"
npx tsx --env-file=.env scripts\backup-database-to-onedrive.ts >> backups\backup-task.log 2>&1
