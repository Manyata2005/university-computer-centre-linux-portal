
#!/bin/bash

# University Computer Centre - User Creation Script

set -e

create_department_users() {
    local role="$1"
    local primary_group="$2"
    local department="$3"
    local count="$4"

    for ((i=1; i<=count; i++)); do
        username=$(printf "%s_%s_%03d" "$role" "$department" "$i")

        if id "$username" &>/dev/null; then
            echo "Already exists: $username"
        else
            sudo useradd -m -s /bin/bash \
                -g "$primary_group" \
                -G "$department" \
                "$username"

            # Lock password: demonstration account only
            sudo passwd -l "$username" >/dev/null 2>&1

            echo "Created: $username"
        fi
    done
}

echo "Creating University Computer Centre accounts..."

# 50 students in each department
create_department_users student students it 50
create_department_users student students cse 50
create_department_users student students aiml 50

# Faculty distribution: 8 + 9 + 8 = 25
create_department_users faculty faculty it 8
create_department_users faculty faculty cse 9
create_department_users faculty faculty aiml 8

echo "-----------------------------------"
echo "User account creation completed!"
echo "-----------------------------------"
