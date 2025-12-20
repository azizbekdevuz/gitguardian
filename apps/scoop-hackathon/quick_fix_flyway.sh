#!/bin/bash
# Quick fix for Flyway failed migrations
# Run this script to repair the database, then restart your application

echo "=========================================="
echo "Quick Flyway Repair"
echo "=========================================="
echo ""
echo "This will delete failed migration records from the database."
echo ""

# Default values
DB_NAME="gitguard_agent"
DB_USER="root"

# Try to read from .env if it exists
if [ -f .env ]; then
    source .env
    if [ ! -z "$DB_URL" ]; then
        # Extract database name from DB_URL
        DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    fi
    DB_USER=${DB_USERNAME:-root}
fi

echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""
echo "Please enter your MySQL password when prompted:"
echo ""

# Run the repair SQL
mysql -u "$DB_USER" -p "$DB_NAME" << EOF
DELETE FROM flyway_schema_history WHERE success = 0;
SELECT 'Repair complete!' AS message;
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Repair successful!"
    echo "✓ You can now restart your Spring Boot application"
else
    echo ""
    echo "✗ Repair failed. Please check your MySQL credentials."
    echo ""
    echo "You can also run this SQL manually:"
    echo "  mysql -u $DB_USER -p $DB_NAME"
    echo "  DELETE FROM flyway_schema_history WHERE success = 0;"
fi

