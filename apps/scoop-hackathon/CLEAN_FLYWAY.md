# Fixing Flyway Failed Migrations

If you encounter the error "Schema contains a failed migration", you have a few options:

## Option 1: Use the repair script (Recommended)

Run the provided script:
```bash
./fix_flyway.sh
```

## Option 2: Manual MySQL repair

Connect to MySQL and delete the failed migration record:

```sql
USE gitguard_agent;
DELETE FROM flyway_schema_history WHERE success = 0;
```

Or repair all:
```sql
USE gitguard_agent;
DELETE FROM flyway_schema_history;
```

## Option 3: Drop and recreate database

```sql
DROP DATABASE IF EXISTS gitguard_agent;
CREATE DATABASE gitguard_agent;
```

Then restart the application - it will create everything fresh.

## Option 4: Use Flyway repair via Maven

```bash
mvn flyway:repair
```

Note: Make sure Flyway Maven plugin is configured in pom.xml
