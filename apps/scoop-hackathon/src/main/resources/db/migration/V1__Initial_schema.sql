-- Flyway migration script
-- This file will be executed automatically when the application starts
-- File naming convention: V{version}__{description}.sql

-- Disable foreign key checks temporarily to allow dropping tables in any order
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables if they exist (for clean migration)
-- Drop in reverse dependency order (child tables first, then parent tables)
DROP TABLE IF EXISTS trace;
DROP TABLE IF EXISTS plan;
DROP TABLE IF EXISTS snapshot;
DROP TABLE IF EXISTS event;
DROP TABLE IF EXISTS git_session;
DROP TABLE IF EXISTS GitSession;  -- Handle case sensitivity (Hibernate may have created this)
DROP TABLE IF EXISTS session;
DROP TABLE IF EXISTS account;
DROP TABLE IF EXISTS verification_token;
DROP TABLE IF EXISTS `user`;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Create verification_token table
CREATE TABLE verification_token (
    identifier VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY,
    token VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    expires TIMESTAMP NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user table
CREATE TABLE `user` (
    id VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY,
    name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    email_verified TIMESTAMP,
    image VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    password VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create account table
CREATE TABLE account (
    id VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY,
    type VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    provider VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    provider_account_id VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    refresh_token TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    access_token TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    expires_at INTEGER,
    token_type VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    scope VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    id_token TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    session_state VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    user_id VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    CONSTRAINT fk_account_user FOREIGN KEY (user_id) REFERENCES `user`(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create session table
CREATE TABLE session (
    id VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY,
    session_token VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
    expires TIMESTAMP NOT NULL,
    user_id VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES `user`(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create git_session table
CREATE TABLE git_session (
    id VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    os VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    repo_root_hash VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    user_id VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    CONSTRAINT fk_git_session_user FOREIGN KEY (user_id) REFERENCES `user`(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create event table
CREATE TABLE event (
    id VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    user_id VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    git_session_id VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    metadata JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create snapshot table
CREATE TABLE snapshot (
    id VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    git_session_id VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    snapshot_json JSON NOT NULL,
    truncated BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_snapshot_git_session FOREIGN KEY (git_session_id) REFERENCES git_session(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create trace table
CREATE TABLE trace (
    id VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    git_session_id VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    stage VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    snapshot_id VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    output_json JSON NOT NULL,
    duration_ms INTEGER,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    CONSTRAINT fk_trace_git_session FOREIGN KEY (git_session_id) REFERENCES git_session(id) ON DELETE CASCADE,
    CONSTRAINT fk_trace_snapshot FOREIGN KEY (snapshot_id) REFERENCES snapshot(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create plan table
CREATE TABLE plan (
    id VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    git_session_id VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    issue_type VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    risk VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    plan_json JSON NOT NULL,
    dangerous_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_plan_git_session FOREIGN KEY (git_session_id) REFERENCES git_session(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX idx_account_user_id ON account(user_id);
CREATE INDEX idx_session_user_id ON session(user_id);
CREATE INDEX idx_session_token ON session(session_token);
CREATE INDEX idx_git_session_user_id ON git_session(user_id);
CREATE INDEX idx_event_user_id ON event(user_id);
CREATE INDEX idx_event_git_session_id ON event(git_session_id);
CREATE INDEX idx_snapshot_git_session_id ON snapshot(git_session_id);
CREATE INDEX idx_trace_git_session_id ON trace(git_session_id);
CREATE INDEX idx_trace_snapshot_id ON trace(snapshot_id);
CREATE INDEX idx_plan_git_session_id ON plan(git_session_id);

