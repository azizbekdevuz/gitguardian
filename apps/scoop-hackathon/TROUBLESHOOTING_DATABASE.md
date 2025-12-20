# Troubleshooting Database Connection Issues

## Error: "Unable to commit against JDBC Connection"

This error typically indicates a database connection or transaction issue. Follow these steps to diagnose and fix the problem.

---

## Step 1: Verify MySQL is Running

### Check if MySQL is running:
```bash
# On macOS
brew services list | grep mysql

# Or check the process
ps aux | grep mysql

# Or try to connect
mysql -u root -p
```

### Start MySQL if it's not running:
```bash
# On macOS with Homebrew
brew services start mysql

# Or
mysql.server start
```

---

## Step 2: Verify Database Connection Settings

Check your `application.properties` or environment variables:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/gitguard_agent?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=your_password_here
```

**Important:** Make sure:
- The database name is correct: `gitguard_agent`
- The username is correct (default: `root`)
- The password is correct (or empty if no password is set)
- MySQL is running on port 3306

---

## Step 3: Test Database Connection Manually

```bash
# Connect to MySQL
mysql -u root -p

# Or if no password
mysql -u root
```

Once connected, verify the database exists:
```sql
SHOW DATABASES;
```

If `gitguard_agent` doesn't exist, create it:
```sql
CREATE DATABASE gitguard_agent CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gitguard_agent;
```

---

## Step 4: Check if Tables Exist

After connecting to MySQL:
```sql
USE gitguard_agent;
SHOW TABLES;
```

You should see tables like:
- `user`
- `account`
- `session`
- `authentication_history`
- etc.

If tables don't exist, Flyway migrations haven't run. Check the application logs for Flyway errors.

---

## Step 5: Check Application Logs

Look for database connection errors in your application logs:

```bash
# If running with Maven
mvn spring-boot:run

# Check for errors like:
# - "Communications link failure"
# - "Access denied for user"
# - "Unknown database"
# - "Connection refused"
```

---

## Step 6: Verify Flyway Migrations

Check if Flyway migrations ran successfully. Look for messages like:
```
Flyway Migrations: Successfully applied X migration(s)
```

If migrations failed, you may need to:
1. Check the migration files in `src/main/resources/db/migration/`
2. Manually run the SQL scripts if needed
3. Check the `flyway_schema_history` table

---

## Step 7: Common Solutions

### Solution 1: Database Doesn't Exist
```sql
CREATE DATABASE gitguard_agent CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Solution 2: Wrong Password
Update your `application.properties`:
```properties
spring.datasource.password=your_actual_password
```

Or set environment variable:
```bash
export DB_PASSWORD=your_actual_password
```

### Solution 3: MySQL Not Running
```bash
# Start MySQL
brew services start mysql
# or
mysql.server start
```

### Solution 4: Port Conflict
Check if MySQL is running on a different port:
```bash
# Check MySQL port
mysql -u root -p -e "SHOW VARIABLES LIKE 'port';"
```

Update `application.properties` if needed:
```properties
spring.datasource.url=jdbc:mysql://localhost:YOUR_PORT/gitguard_agent?...
```

### Solution 5: Connection Pool Issues
If you're getting connection pool errors, try restarting the application and ensure MySQL has enough connections:

```sql
-- Check max connections
SHOW VARIABLES LIKE 'max_connections';
```

---

## Step 8: Test Connection with Simple Query

Once connected to MySQL, test a simple query:
```sql
USE gitguard_agent;
SELECT COUNT(*) FROM user;
```

If this works, the database connection is fine, and the issue might be with the application's transaction management.

---

## Step 9: Check Hibernate Configuration

The issue might be related to the Hibernate autocommit setting. Check `application.properties`:

```properties
# This setting can sometimes cause issues
spring.jpa.properties.hibernate.connection.provider_disables_autocommit=true
```

If you continue to have issues, you can try temporarily disabling this:
```properties
# Comment out or set to false
# spring.jpa.properties.hibernate.connection.provider_disables_autocommit=false
```

---

## Step 10: Restart Everything

Sometimes a simple restart fixes connection issues:

1. **Stop the application** (Ctrl+C)
2. **Restart MySQL:**
   ```bash
   brew services restart mysql
   ```
3. **Restart the application:**
   ```bash
   mvn spring-boot:run
   ```

---

## Quick Diagnostic Commands

```bash
# 1. Check MySQL status
brew services list | grep mysql

# 2. Test MySQL connection
mysql -u root -p -e "SELECT 1;"

# 3. Check if database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'gitguard_agent';"

# 4. Check if tables exist
mysql -u root -p gitguard_agent -e "SHOW TABLES;"

# 5. Check application logs for database errors
# (Look in your console output or log files)
```

---

## Still Having Issues?

1. **Check the full error stack trace** in your application logs
2. **Verify your MySQL version** is compatible (MySQL 5.7+ or MySQL 8.0+)
3. **Check firewall settings** if MySQL is on a remote server
4. **Review the application startup logs** for any initialization errors

---

## Environment Variables

If you're using environment variables, make sure they're set:

```bash
# Check current environment variables
echo $DB_URL
echo $DB_USERNAME
echo $DB_PASSWORD

# Set them if needed
export DB_URL="jdbc:mysql://localhost:3306/gitguard_agent?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
export DB_USERNAME="root"
export DB_PASSWORD="your_password"
```

---

## Need More Help?

Check the application logs for the full stack trace. The improved error handling will now provide more specific error messages to help diagnose the issue.

