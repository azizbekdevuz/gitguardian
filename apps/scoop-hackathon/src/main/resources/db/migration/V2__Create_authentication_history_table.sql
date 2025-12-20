-- Create authentication_history table for JWT-based authentication tracking
CREATE TABLE authentication_history (
    id VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY,
    user_id VARCHAR(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    action VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    ip_address VARCHAR(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    user_agent VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    token_id VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_auth_history_user FOREIGN KEY (user_id) REFERENCES `user`(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX idx_auth_history_user_id ON authentication_history(user_id);
CREATE INDEX idx_auth_history_action ON authentication_history(action);
CREATE INDEX idx_auth_history_success ON authentication_history(success);
CREATE INDEX idx_auth_history_token_id ON authentication_history(token_id);
CREATE INDEX idx_auth_history_created_at ON authentication_history(created_at);

