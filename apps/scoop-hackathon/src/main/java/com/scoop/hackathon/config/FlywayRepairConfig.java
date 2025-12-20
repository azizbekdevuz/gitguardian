package com.scoop.hackathon.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.lang.Nullable;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * Automatically repairs failed Flyway migrations on application startup.
 * This component runs before FlywayAutoConfiguration to ensure failed migrations
 * are cleaned up before Flyway checks for them.
 * 
 * Uses @PostConstruct with @Order to run early in the Spring Boot lifecycle,
 * before Flyway's MigrationInitializer executes.
 */
@Configuration
@Order(1) // Run before Flyway auto-configuration (which is typically Order(2147483647))
public class FlywayRepairConfig {

    private static final Logger logger = LoggerFactory.getLogger(FlywayRepairConfig.class);

    @Nullable
    private final DataSource dataSource;

    public FlywayRepairConfig(@Nullable DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    public void repairFailedMigrations() {
        if (dataSource == null) {
            logger.debug("No DataSource found, skipping Flyway repair");
            return;
        }

        logger.info("Checking for failed Flyway migrations...");
        
        try (Connection connection = dataSource.getConnection()) {
            // Check if flyway_schema_history table exists
            if (!tableExists(connection, "flyway_schema_history")) {
                logger.debug("flyway_schema_history table does not exist, skipping repair");
                return;
            }

            // Check for failed migrations
            int failedCount = countFailedMigrations(connection);
            
            if (failedCount > 0) {
                logger.warn("Found {} failed migration(s). Attempting to repair...", failedCount);
                
                // Delete failed migration records
                int deleted = deleteFailedMigrations(connection);
                
                if (deleted > 0) {
                    logger.info("✓ Successfully repaired {} failed migration record(s)", deleted);
                    logger.info("  Application will continue with migration...");
                } else {
                    logger.warn("Failed to delete failed migration records");
                }
            } else {
                logger.debug("No failed migrations found");
            }
            
        } catch (SQLException e) {
            logger.error("Error while repairing Flyway migrations: {}", e.getMessage(), e);
            // Don't throw exception - let Flyway handle it, but log the error
        }
    }

    private boolean tableExists(Connection connection, String tableName) throws SQLException {
        String sql = "SELECT COUNT(*) FROM information_schema.tables " +
                     "WHERE table_schema = DATABASE() AND table_name = ?";
        
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, tableName);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1) > 0;
                }
            }
        }
        return false;
    }

    private int countFailedMigrations(Connection connection) throws SQLException {
        String sql = "SELECT COUNT(*) FROM flyway_schema_history WHERE success = 0";
        
        try (PreparedStatement stmt = connection.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                return rs.getInt(1);
            }
        }
        return 0;
    }

    private int deleteFailedMigrations(Connection connection) throws SQLException {
        String sql = "DELETE FROM flyway_schema_history WHERE success = 0";
        
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            return stmt.executeUpdate();
        }
    }
}

