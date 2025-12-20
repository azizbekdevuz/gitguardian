# MySQL Database Inspection Queries

Useful SQL queries to check and inspect your MySQL database tables.

## Database Connection
```bash
mysql -u root -p gitguard_agent
```

Or if no password:
```bash
mysql -u root gitguard_agent
```

---

## 1. List All Tables
```sql
-- Show all tables in the database
SHOW TABLES;

-- Or using information schema
SELECT TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'gitguard_agent';
```

---

## 2. Check Table Structure (Columns)
```sql
-- Describe table structure
DESCRIBE user;
DESCRIBE account;
DESCRIBE session;
DESCRIBE git_session;
DESCRIBE event;
DESCRIBE snapshot;
DESCRIBE trace;
DESCRIBE plan;
DESCRIBE verification_token;
DESCRIBE authentication_history;

-- Or using SHOW COLUMNS
SHOW COLUMNS FROM user;
SHOW COLUMNS FROM authentication_history;

-- Or detailed information
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_KEY,
    EXTRA
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'gitguard_agent' 
  AND TABLE_NAME = 'user'
ORDER BY ORDINAL_POSITION;
```

---

## 3. View Table Data
```sql
-- View all users
SELECT * FROM user;

-- View all accounts
SELECT * FROM account;

-- View all sessions
SELECT * FROM session;

-- View all git sessions
SELECT * FROM git_session;

-- View all events
SELECT * FROM event;

-- View all snapshots
SELECT * FROM snapshot;

-- View all traces
SELECT * FROM trace;

-- View all plans
SELECT * FROM plan;

-- View all verification tokens
SELECT * FROM verification_token;

-- View all authentication history
SELECT * FROM authentication_history;
```

---

## 4. Count Records in Each Table
```sql
-- Count records in all tables
SELECT 
    'user' AS table_name, COUNT(*) AS record_count FROM user
UNION ALL
SELECT 'account', COUNT(*) FROM account
UNION ALL
SELECT 'session', COUNT(*) FROM session
UNION ALL
SELECT 'git_session', COUNT(*) FROM git_session
UNION ALL
SELECT 'event', COUNT(*) FROM event
UNION ALL
SELECT 'snapshot', COUNT(*) FROM snapshot
UNION ALL
SELECT 'trace', COUNT(*) FROM trace
UNION ALL
SELECT 'plan', COUNT(*) FROM plan
UNION ALL
SELECT 'verification_token', COUNT(*) FROM verification_token
UNION ALL
SELECT 'authentication_history', COUNT(*) FROM authentication_history;
```

---

## 5. Check Table Indexes
```sql
-- Show indexes for a specific table
SHOW INDEXES FROM user;
SHOW INDEXES FROM authentication_history;
SHOW INDEXES FROM git_session;

-- Or using information schema
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,
    NON_UNIQUE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'gitguard_agent'
  AND TABLE_NAME = 'user'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;
```

---

## 6. Check Foreign Key Constraints
```sql
-- Show foreign keys for a specific table
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'gitguard_agent'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- Check foreign keys for a specific table
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'gitguard_agent'
  AND TABLE_NAME = 'account';
```

---

## 7. Check Table Sizes
```sql
-- Get table sizes (data + index)
SELECT 
    TABLE_NAME AS `Table`,
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS `Size (MB)`,
    ROUND((DATA_LENGTH / 1024 / 1024), 2) AS `Data (MB)`,
    ROUND((INDEX_LENGTH / 1024 / 1024), 2) AS `Index (MB)`,
    TABLE_ROWS AS `Rows`
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'gitguard_agent'
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;
```

---

## 8. Useful Data Queries

### Users with their accounts
```sql
SELECT 
    u.id,
    u.name,
    u.email,
    u.email_verified,
    u.created_at,
    COUNT(a.id) AS account_count
FROM user u
LEFT JOIN account a ON u.id = a.user_id
GROUP BY u.id, u.name, u.email, u.email_verified, u.created_at;
```

### Active sessions
```sql
SELECT 
    s.id,
    s.session_token,
    s.expires,
    u.email,
    u.name
FROM session s
JOIN user u ON s.user_id = u.id
WHERE s.expires > NOW()
ORDER BY s.expires DESC;
```

### Git sessions with user info
```sql
SELECT 
    gs.id,
    gs.title,
    gs.os,
    gs.created_at,
    u.email,
    u.name
FROM git_session gs
LEFT JOIN user u ON gs.user_id = u.id
ORDER BY gs.created_at DESC;
```

### Recent authentication history
```sql
SELECT 
    ah.id,
    ah.action,
    ah.success,
    ah.ip_address,
    ah.created_at,
    u.email
FROM authentication_history ah
LEFT JOIN user u ON ah.user_id = u.id
ORDER BY ah.created_at DESC
LIMIT 50;
```

### Failed authentication attempts
```sql
SELECT 
    ah.id,
    ah.action,
    ah.failure_reason,
    ah.ip_address,
    ah.user_agent,
    ah.created_at,
    u.email
FROM authentication_history ah
LEFT JOIN user u ON ah.user_id = u.id
WHERE ah.success = FALSE
ORDER BY ah.created_at DESC;
```

### Events by type
```sql
SELECT 
    type,
    COUNT(*) AS count
FROM event
GROUP BY type
ORDER BY count DESC;
```

### Traces with success/failure stats
```sql
SELECT 
    stage,
    COUNT(*) AS total,
    SUM(CASE WHEN success = TRUE THEN 1 ELSE 0 END) AS successful,
    SUM(CASE WHEN success = FALSE THEN 1 ELSE 0 END) AS failed,
    AVG(duration_ms) AS avg_duration_ms
FROM trace
GROUP BY stage
ORDER BY total DESC;
```

---

## 9. Check Table Engine and Charset
```sql
SELECT 
    TABLE_NAME,
    ENGINE,
    TABLE_COLLATION,
    TABLE_ROWS,
    CREATE_TIME,
    UPDATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'gitguard_agent'
ORDER BY TABLE_NAME;
```

---

## 10. Check for Orphaned Records
```sql
-- Check for orphaned accounts (user_id doesn't exist)
SELECT a.id, a.user_id, a.provider
FROM account a
LEFT JOIN user u ON a.user_id = u.id
WHERE u.id IS NULL;

-- Check for orphaned sessions
SELECT s.id, s.user_id, s.session_token
FROM session s
LEFT JOIN user u ON s.user_id = u.id
WHERE u.id IS NULL;

-- Check for orphaned git_sessions
SELECT gs.id, gs.user_id, gs.title
FROM git_session gs
LEFT JOIN user u ON gs.user_id = u.id
WHERE gs.user_id IS NOT NULL AND u.id IS NULL;
```

---

## 11. Check Expired Tokens/Sessions
```sql
-- Expired verification tokens
SELECT * FROM verification_token
WHERE expires < NOW();

-- Expired sessions
SELECT * FROM session
WHERE expires < NOW();

-- Active (non-expired) sessions
SELECT * FROM session
WHERE expires > NOW();
```

---

## 12. Database Information
```sql
-- Database size
SELECT 
    TABLE_SCHEMA AS 'Database',
    ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'gitguard_agent';

-- MySQL version
SELECT VERSION();

-- Current database
SELECT DATABASE();

-- Current user
SELECT USER();
```

---

## Quick Reference Commands

```sql
-- Connect to database
USE gitguard_agent;

-- Show all tables
SHOW TABLES;

-- Describe a table
DESC user;

-- Select with limit
SELECT * FROM user LIMIT 10;

-- Count records
SELECT COUNT(*) FROM user;

-- Check if table exists
SHOW TABLES LIKE 'user';
```

