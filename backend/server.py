
#!/usr/bin/env python3

import json
import os
import pwd
import grp
import shutil
import subprocess
import platform
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

HOST = "127.0.0.1"
PORT = 8000


# -------------------------------
# HELPER FUNCTIONS
# -------------------------------

def command(args):
    try:
        result = subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=5,
            check=False
        )
        return result.stdout.strip()
    except Exception:
        return ""


def directory_size(path):
    total = 0

    for root, dirs, files in os.walk(path):
        for filename in files:
            try:
                total += os.path.getsize(
                    os.path.join(root, filename)
                )
            except OSError:
                pass

    return round(total / (1024 ** 3), 10)


def get_service_status(service):
    result = command(["systemctl", "is-active", service])
    return "running" if result == "active" else "stopped"


# -------------------------------
# 1. USER MANAGEMENT
# -------------------------------

def get_users():
    users = []

    for account in pwd.getpwall():
        username = account.pw_name

        if not username.startswith(("student_", "faculty_")):
            continue

        groups = [
            g.gr_name for g in grp.getgrall()
            if username in g.gr_mem
        ]

        primary = grp.getgrgid(account.pw_gid).gr_name

        if primary not in groups:
            groups.append(primary)

        if username.startswith("faculty_"):
            role = "faculty"
        else:
            role = "student"

        dept = next(
            (d for d in ["it", "cse", "aiml"]
             if f"_{d}_" in username),
            "unknown"
        )

        password_info = command(["passwd", "-S", username])
        password_status = (
            password_info.split()[1]
            if len(password_info.split()) >= 2
            else ""
        )

        status = (
            "locked" if password_status == "L"
            else "active" if password_status in ("P", "NP")
            else "locked"
        )

        users.append({
            "username": username,
            "name": username,
            "role": role,
            "dept": dept,
            "group": ", ".join(groups),
            "home": account.pw_dir,
            "status": status,
            "lastLogin": "Not available"
        })

    return users


# -------------------------------
# 2. DEPARTMENT MANAGEMENT
# -------------------------------

def get_departments():

    departments = []

    details = {
        "IT": ("it", 50, 8),
        "CSE": ("cse", 50, 9),
        "AIML": ("aiml", 50, 8)
    }

    for name, (group, students, faculty) in details.items():

        path = f"/srv/university/{name}"

        if not os.path.isdir(path):
            continue

        stat = os.stat(path)
        disk = shutil.disk_usage(path)

        departments.append({
            "id": name.lower(),
            "name": {
                "IT": "Information Technology",
                "CSE": "Computer Science and Engineering",
                "AIML": "Artificial Intelligence and Machine Learning"
            }[name],
            "short": name,
            "group": group,
            "lv": "Not configured",
            "mount": path,

            # Shared filesystem capacity, NOT a department quota
            "allocGB": round(disk.total / (1024 ** 3), 2),
            "usedGB": directory_size(path),

            "students": students,
            "faculty": faculty,

            "access": [
                f"Department group: {group}",
                f"Owner: {pwd.getpwuid(stat.st_uid).pw_name}",
                f"Group: {grp.getgrgid(stat.st_gid).gr_name}",
                f"Permissions: {oct(stat.st_mode)[-4:]}",
                "Shared filesystem; no individual quota configured"
            ]
        })

    return departments


# -------------------------------
# 3. SERVER OVERVIEW
# -------------------------------

def get_overview():

    mem = {}

    try:
        with open("/proc/meminfo") as file:
            for line in file:
                key, value = line.split(":", 1)
                mem[key] = int(value.strip().split()[0])
    except Exception:
        pass

    # Convert memory from KB to GB ONCE
    total_ram = mem.get("MemTotal", 0) / (1024 ** 2)
    available_ram = mem.get("MemAvailable", 0) / (1024 ** 2)
    used_ram = max(0, total_ram - available_ram)

    # Disk values are returned in bytes
    disk = shutil.disk_usage("/")

    cpu_output = command([
        "bash", "-c",
        "top -bn1 | grep 'Cpu(s)'"
    ])

    cpu_value = 0

    try:
        idle = float(
            cpu_output.split("id,")[0].split()[-1]
        )
        cpu_value = round(100 - idle, 1)
    except Exception:
        pass

    users = get_users()

    return {
        "students": sum(
            u["role"] == "student" for u in users
        ),

        "faculty": sum(
            u["role"] == "faculty" for u in users
        ),

        "departments": 3,

        "server": {
            "hostname": platform.node(),
            "os": platform.platform(),
            "kernel": platform.release(),
            "ip": "127.0.0.1 (local WSL)",
            "uptime": command(["uptime", "-p"])
        },

        "cpu": cpu_value,

        "ram": {
            "usedGB": round(used_ram, 2),
            "totalGB": round(total_ram, 2)
        },

        "disk": {
            "usedGB": round(disk.used / (1024 ** 3), 2),
            "totalGB": round(disk.total / (1024 ** 3), 2)
        },

        "activities": [
            {
                "time": datetime.now().strftime("%H:%M"),
                "level": "ok",
                "text": "Live server information retrieved"
            }
        ]
    }


# -------------------------------
# 4. STORAGE MANAGEMENT
# -------------------------------

def get_storage():

    disk = shutil.disk_usage("/")
    total = round(disk.total / (1024 ** 3), 2)

    departments = get_departments()

    # Read actual LVM information through the restricted root wrapper
    lvm_data = {}
    try:
        output = command([
            "sudo", "-n",
            "/usr/local/sbin/university-lvm-report.sh"
        ])
        lvm_data = json.loads(output)
    except Exception:
        lvm_data = {}

    def report_rows(section, key):
        try:
            return lvm_data[section]["report"][0].get(key, [])
        except (KeyError, IndexError, TypeError):
            return []

    pv_rows = report_rows("pvs", "pv")
    vg_rows = report_rows("vgs", "vg")
    lv_rows = report_rows("lvs", "lv")

    vg = vg_rows[0] if vg_rows else {}

    pv_names = [p.get("pv_name", "") for p in pv_rows]

    mount_map = {
        "it_lv": ("IT", "/mnt/university/IT"),
        "cse_lv": ("CSE", "/mnt/university/CSE"),
        "aiml_lv": ("AIML", "/mnt/university/AIML")
    }

    lvm_volumes = []

    for lv in lv_rows:
        name = lv.get("lv_name", "")
        dept, mount = mount_map.get(name, ("Unknown", ""))

        volume = {
            "name": name,
            "dept": dept,
            "path": lv.get("lv_path", ""),
            "mount": mount,
            "sizeMB": round(float(lv.get("lv_size", 0)), 2),
            "mounted": False
        }

        if mount and os.path.ismount(mount):
            usage = shutil.disk_usage(mount)
            volume.update({
                "mounted": True,
                "fs": command([
                    "findmnt", "-n", "-o", "FSTYPE", "-T", mount
                ]),
                "totalGB": round(usage.total / (1024 ** 3), 3),
                "usedGB": round((usage.total - usage.free) / (1024 ** 3), 3),
                "freeGB": round(usage.free / (1024 ** 3), 3)
            })

        lvm_volumes.append(volume)

    lvm_available = bool(vg_rows)

    return {
        # Real LVM configuration
        "vg": vg.get("vg_name", "Unavailable"),
        "pv": pv_names,
        "fs": "ext4" if lvm_available else "Unavailable",
        "totalGB": total,
        "extentMB": round(float(vg.get("vg_extent_size", 0)), 2),
        "unallocatedGB": round(
            float(vg.get("vg_free", 0)) / 1024, 3
        ),

        # Preserve existing department-directory usage data
        "lvs": [
            {
                "name": "directory_" + d["short"].lower(),
                "dept": d["id"],
                "mount": d["mount"],
                "allocGB": d["allocGB"],
                "usedGB": d["usedGB"]
            }
            for d in departments
        ],

        # Separate actual LVM logical-volume information
        "lvm": {
            "available": lvm_available,
            "vgSizeMB": round(float(vg.get("vg_size", 0)), 2),
            "vgFreeMB": round(float(vg.get("vg_free", 0)), 2),
            "extentMB": round(float(vg.get("vg_extent_size", 0)), 2),
            "physicalVolumes": pv_names,
            "volumes": lvm_volumes
        },

        "commands": [
            "LVM reports retrieved using a restricted read-only wrapper.",
            "Department directory usage and LVM volume capacity are reported separately."
        ]
    }


# -------------------------------
# 5. BACKUP AND RECOVERY
# -------------------------------

def get_backups():

    base = "/var/backups/university"
    history = []
    backup_sizes = {}

    report = command([
        "sudo", "-n",
        "/usr/local/sbin/university-backup-report.sh"
    ])

    for line in report.splitlines():
        parts = line.split("\t")

        if len(parts) == 3:
            try:
                backup_sizes[(parts[0], parts[1])] = int(parts[2])
            except ValueError:
                pass

    for backup_type in ["full", "incremental"]:

        folder = os.path.join(base, backup_type)

        if not os.path.isdir(folder):
            continue

        try:
            names = sorted(
                os.listdir(folder),
                reverse=True
            )
        except PermissionError:
            continue

        for name in names:

            if name.endswith(".sha256"):
                continue

            path = os.path.join(folder, name)

            if not os.path.exists(path):
                continue

            verified = False

            if backup_type == "full" and os.path.isfile(path):
                checksum = path + ".sha256"

                if os.path.isfile(checksum):
                    result = command([
                        "sha256sum", "-c", checksum
                    ])
                    verified = "OK" in result

            elif backup_type == "incremental":
                verified = os.path.isfile(
                    os.path.join(path, ".backup_complete")
                )

            # Calculate actual backup size in bytes
            # Read accurate backup size from restricted root report
            size = backup_sizes.get((backup_type, name), 0)
            status = "success" if verified else "failed"
            history.append({
                "id": name,
                "type": backup_type,
                "time": datetime.fromtimestamp(
                    os.path.getmtime(path)
                ).strftime("%Y-%m-%d %H:%M"),

                # Keep enough precision for small backups
                "sizeGB": round(size / (1024 ** 3), 10),

                # Actual duration has not been recorded
                "duration": "Not recorded",

                "status": status,
                "verified": verified
            })

    history.sort(
        key=lambda x: x["time"],
        reverse=True
    )

    return {
        "schedule": {
            "full": "Manual full backup",
            "incremental": "Daily at 02:00 (cron configured)",
            "retention": "No automatic retention policy configured",
            "target": base
        },

        "history": history,

        "recovery": {
            "rto": "Not measured",
            "rpo": "Depends on backup schedule",

            "steps": [
                "Identify the backup archive or snapshot",
                "Verify checksum or completion marker",
                "Restore the selected backup",
                "Check restored files and permissions"
            ]
        }
    }


# -------------------------------
# 6. SERVER MONITORING
# -------------------------------

def get_monitoring():

    overview = get_overview()

    cpu = overview["cpu"]

    total_ram = overview["ram"]["totalGB"]
    used_ram = overview["ram"]["usedGB"]

    memory = round(
        used_ram / total_ram * 100
    ) if total_ram else 0

    try:
        load = [
            round(float(value), 2)
            for value in open("/proc/loadavg").read().split()[:3]
        ]
    except Exception:
        load = [0, 0, 0]

    services = []

    service_details = [
        ("ssh", "Remote administration", 22),
        ("apache2", "Web server", 80),
        ("cron", "Scheduled tasks", "-"),
        ("ufw", "Firewall", "-")
    ]

    for name, description, port in service_details:

        services.append({
            "name": name,
            "desc": description,
            "port": port,
            "status": get_service_status(name)
        })

    return {
        "cores": os.cpu_count() or 1,
        "load": load,

        # Current sample repeated; not historical measurements
        "cpuHistory": [cpu] * 24,
        "memHistory": [memory] * 24,
        "diskIO": [0] * 24,

        "uptime": overview["server"]["uptime"],

        "health": {
            "score": 0,
            "label": "Live status",
            "notes": [
                "Values retrieved from current WSL2 system",
                "Historical monitoring is not configured"
            ]
        },

        "services": services
    }


# -------------------------------
# 7. SECURITY AND ADMINISTRATION
# -------------------------------

def get_security():

    ssh_status = get_service_status("ssh")
    apache_status = get_service_status("apache2")

    # Read effective SSH configuration
    ssh_config = command([
        "sudo", "sshd", "-T"
    ])

    root_login = "Unknown"
    password_auth = "Unknown"

    for line in ssh_config.splitlines():
        if line.startswith("permitrootlogin "):
            root_login = line.split()[1]

        elif line.startswith("passwordauthentication "):
            password_auth = line.split()[1]

    # Check UFW installation and status
    ufw_installed = shutil.which("ufw") is not None

    if ufw_installed:
        ufw_status = command(["sudo", "ufw", "status", "verbose"])
        firewall_active = "Status: active" in ufw_status

        rules_output = command(["sudo", "ufw", "show", "added"])

        rules = [
            line.strip()
            for line in rules_output.splitlines()
            if line.strip().startswith("ufw ")
        ]

        firewall_policy = (
            "UFW installed; " +
            ("active" if firewall_active else "inactive")
        )
    else:
        ufw_status = ""
        firewall_active = False
        rules = []
        firewall_policy = "UFW not installed"

    permissions = []

    for name in ["IT", "CSE", "AIML", "Faculty"]:

        path = f"/srv/university/{name}"

        if not os.path.isdir(path):
            continue

        stat = os.stat(path)

        permissions.append({
            "path": path,
            "owner": pwd.getpwuid(stat.st_uid).pw_name,
            "group": grp.getgrgid(stat.st_gid).gr_name,
            "mode": oct(stat.st_mode)[-4:],
            "meaning": "Actual directory permissions"
        })

    ssh_version = command(["ssh", "-V"])
    apache_version = command(["apache2", "-v"])

    return {
        "ssh": {
            "status": ssh_status,
            "port": 22,
            "rootLogin": root_login,
            "passwordAuth": password_auth,
            "version": ssh_version or "Unknown"
        },

        "apache": {
            "status": apache_status,
            "version": apache_version.splitlines()[0]
            if apache_version else "Unknown",
            "ssl": "Not verified",
            "vhosts": "localhost"
        },

        "firewall": {
            "status": "active" if firewall_active else "inactive",
            "policy": firewall_policy,
            "rules": rules
        },

        "permissions": permissions,
        "events": []
    }


# -------------------------------
# API ENDPOINTS
# -------------------------------

ENDPOINTS = {
    "/api/v1/overview": get_overview,
    "/api/v1/users": get_users,
    "/api/v1/departments": get_departments,
    "/api/v1/storage": get_storage,
    "/api/v1/backups": get_backups,
    "/api/v1/monitoring": get_monitoring,
    "/api/v1/security": get_security
}


# -------------------------------
# HTTP SERVER
# -------------------------------

class APIHandler(BaseHTTPRequestHandler):

    def do_GET(self):

        path = urlparse(self.path).path

        handler = ENDPOINTS.get(path)

        if handler is None:
            self.send_error(404, "API endpoint not found")
            return

        try:
            data = handler()

            body = json.dumps(data).encode("utf-8")

            self.send_response(200)

            self.send_header(
                "Content-Type",
                "application/json"
            )

            self.send_header(
                "Content-Length",
                str(len(body))
            )

            self.send_header(
                "Cache-Control",
                "no-store"
            )

            self.end_headers()

            self.wfile.write(body)

        except Exception as error:

            print("[API ERROR]", error)

            body = json.dumps({
                "error": "Internal server error"
            }).encode("utf-8")

            self.send_response(500)

            self.send_header(
                "Content-Type",
                "application/json"
            )

            self.send_header(
                "Content-Length",
                str(len(body))
            )

            self.end_headers()

            self.wfile.write(body)

    def log_message(self, format, *args):
        print("[API]", format % args)


if __name__ == "__main__":

    print("===================================")
    print(" UNIVERSITY COMPUTER CENTRE API")
    print("===================================")
    print(f"Server: http://{HOST}:{PORT}")
    print("Available endpoints:")

    for endpoint in ENDPOINTS:
        print(endpoint)

    print("===================================")

    HTTPServer((HOST, PORT), APIHandler).serve_forever()
