
# University Computer Centre – Linux Server Infrastructure Portal

A Linux-based university server management portal built to demonstrate centralized user management, department storage, backup and recovery, server monitoring, and security administration.

## Project Overview

The project simulates the administration of a university computer centre using Linux system administration tools, shell scripting, and a web-based dashboard.

## Key Features

- **User Management:** Department-wise student and faculty accounts with Linux groups and permissions.
- **Department Storage:** LVM-based storage allocation for IT, CSE, and AIML departments.
- **Backup and Recovery:** Full and incremental backup scripts with SHA-256 integrity verification.
- **Automated Backups:** Cron-based scheduling for incremental backups.
- **Server Monitoring:** System health and storage reporting scripts.
- **Security:** UFW firewall configuration, SSH service administration, and restricted department directory access.
- **Web Dashboard:** Frontend dashboard integrated with a Python backend through REST API endpoints.

## Technology Stack

| Area | Technologies |
|---|---|
| Operating System | Ubuntu Linux (WSL2 lab environment) |
| Frontend | HTML, CSS, JavaScript |
| Backend | Python |
| Scripting | Bash Shell Scripting |
| Storage | LVM, ext4 |
| Backup | tar, SHA-256 |
| Scheduling | Cron |
| Security | UFW, SSH, Linux permissions |
| Web Server | Apache |

## Project Architecture

```text
             User Browser
                  |
             Apache Server
                  |
             Web Dashboard
                  |
             REST API Proxy
                  |
           Python Backend
                  |
       Linux Administration Layer
          /       |        \
     Users     Storage    Backups
                  |
             Monitoring
                  |
          Security Services
```

## Department Storage

Dedicated logical volumes are configured for:

- IT
- CSE
- AIML

The project demonstrates LVM allocation, mounting, and online logical volume expansion.

## Backup and Recovery

The backup implementation includes:

- Full backups
- Incremental backups
- SHA-256 checksum verification
- Backup listing
- Restore testing
- Cron-based scheduling
- Activity logging

## Monitoring

Shell scripts collect system information such as:

- Hostname and operating system
- Uptime
- CPU information
- Memory usage
- Disk usage
- Running processes
- Apache and SSH service status

## Security Implementation

- UFW firewall configuration
- SSH root login disabled
- Department-wise Linux groups
- Restricted directory permissions
- Backend bound to localhost

## Running the Project

This implementation was developed and tested in Ubuntu running through WSL2.

Start the backend and Apache services:

```bash
sudo systemctl start university-portal-backend
sudo systemctl start apache2
```

Open the dashboard:

```bash
explorer.exe http://localhost/
```

## Project Structure

```text
uni-portal/
├── backend/
│   └── server.py
├── monitoring/
│   ├── server_health.sh
│   └── storage_report.sh
├── user_management/
│   └── create_users.sh
├── backup_full.sh
├── backup_incremental.sh
├── index.html
├── script.js
├── style.css
├── test_browser_three.js
├── three.min.js
└── README.md
```

## Learning Outcomes

- Linux user and group administration
- Shell scripting and automation
- Logical Volume Management
- Backup and recovery procedures
- Server monitoring
- Linux security and permissions
- Frontend and backend integration

## Development Environment

This is an academic Linux administration project implemented in a WSL2 Ubuntu environment. It is a demonstration/lab implementation, not a production-hardened university server.

## Author

**Manyata Shah**

GitHub: [@Manyata2005](https://github.com/Manyata2005)

