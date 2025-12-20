# MySQL Setup Instructions

## Quick Setup

1. **Make sure MySQL is installed and running:**
   ```bash
   mysql --version
   # or
   brew services list | grep mysql  # on macOS
   ```

2. **Update your `.env` file with your MySQL password:**
   ```bash
   # Edit .env file
   DB_PASSWORD=your_actual_mysql_password
   ```

3. **If MySQL root user has no password:**
   - You can leave `DB_PASSWORD=` empty in `.env`
   - But you may need to configure MySQL to allow passwordless login
   - Or create a new MySQL user with a password

## Creating a MySQL User (Recommended)

For better security, create a dedicated user:

```sql
-- Connect to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE IF NOT EXISTS scoop_hackathon;

-- Create user
CREATE USER 'scoop_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON scoop_hackathon.* TO 'scoop_user'@'localhost';
FLUSH PRIVILEGES;
```

Then update your `.env` file:
```
DB_USERNAME=scoop_user
DB_PASSWORD=your_secure_password
```

## Troubleshooting

### Error: "Access denied for user 'root'@'localhost'"

This means:
1. MySQL password is incorrect, OR
2. MySQL password is not set in `.env` file, OR
3. MySQL user doesn't have proper permissions

**Solution:**
- Check your `.env` file has `DB_PASSWORD=your_password`
- Verify MySQL is running: `mysql -u root -p`
- If you forgot the password, reset it or create a new user

### Error: "Unknown database 'scoop_hackathon'"

The application will auto-create the database if `createDatabaseIfNotExist=true` is in the URL.
If it still fails, create it manually:
```sql
CREATE DATABASE scoop_hackathon;
```

## Testing Connection

Test your MySQL connection:
```bash
mysql -u root -p -e "SHOW DATABASES;"
```

Replace `root` with your username from `.env` if different.
