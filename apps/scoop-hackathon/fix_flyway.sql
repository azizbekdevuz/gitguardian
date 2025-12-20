-- SQL script to fix Flyway failed migrations
-- Run this in MySQL: mysql -u root -p gitguard_agent < fix_flyway.sql

-- Option 1: Delete only failed migrations
DELETE FROM flyway_schema_history WHERE success = 0;

-- Option 2: Delete all migration history (use if you want to start fresh)
-- DELETE FROM flyway_schema_history;

-- Option 3: Drop all tables and start completely fresh
-- DROP TABLE IF EXISTS trace;
-- DROP TABLE IF EXISTS plan;
-- DROP TABLE IF EXISTS snapshot;
-- DROP TABLE IF EXISTS event;
-- DROP TABLE IF EXISTS git_session;
-- DROP TABLE IF EXISTS session;
-- DROP TABLE IF EXISTS account;
-- DROP TABLE IF EXISTS verification_token;
-- DROP TABLE IF EXISTS `user`;
-- DROP TABLE IF EXISTS flyway_schema_history;
