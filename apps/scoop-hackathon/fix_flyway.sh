#!/bin/bash
# Script to fix Flyway failed migrations

echo "=========================================="
echo "Flyway Migration Repair Script"
echo "=========================================="

# Read database credentials from .env file
if [ -f .env ]; then
    source .env
    DB_USER=${DB_USERNAME:-root}
    DB_PASS=${DB_PASSWORD:-}
    
    # Extract database name from DB_URL (format: jdbc:mysql://host:port/dbname?params)
    if [[ $DB_URL == *"jdbc:mysql://"* ]]; then
        DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    else
        DB_NAME="gitguard_agent"
    fi
    
    echo "Database: $DB_NAME"
    echo "User: $DB_USER"
    echo ""
    
    # Build MySQL command
    if [ -z "$DB_PASS" ]; then
        echo "Attempting to connect without password..."
        MYSQL_CMD="mysql -u $DB_USER"
    else
        MYSQL_CMD="mysql -u $DB_USER -p$DB_PASS"
    fi
    
    echo "Repairing Flyway migration..."
    
    # Try to execute the repair SQL
    if $MYSQL_CMD $DB_NAME -e "DELETE FROM flyway_schema_history WHERE success = 0;" 2>/dev/null; then
        FAILED_COUNT=$($MYSQL_CMD $DB_NAME -N -e "SELECT COUNT(*) FROM flyway_schema_history WHERE success = 0;" 2>/dev/null)
        if [ "$FAILED_COUNT" = "0" ] || [ -z "$FAILED_COUNT" ]; then
            echo "✓ Successfully removed failed migration records"
            echo "✓ You can now restart the application"
        else
            echo "⚠ Warning: Some failed migrations may still exist"
        fi
    else
        echo ""
        echo "⚠ Could not connect automatically. Please run manually:"
        echo ""
        echo "  mysql -u $DB_USER -p $DB_NAME"
        echo ""
        echo "Then execute:"
        echo "  DELETE FROM flyway_schema_history WHERE success = 0;"
        echo ""
        exit 1
    fi
else
    echo "Error: .env file not found"
    echo "Please create a .env file with your database credentials"
    exit 1
fi
