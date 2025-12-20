package com.scoop.hackathon;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.scoop.hackathon.repository")
public class ScoopHackathonApplication {

    public static void main(String[] args) {
        // Load .env file before Spring Boot starts
        loadEnvironmentVariables();
        
        SpringApplication.run(ScoopHackathonApplication.class, args);
    }
    
    private static void loadEnvironmentVariables() {
        try {
            Dotenv dotenv = Dotenv.configure()
                    .ignoreIfMissing()
                    .load();
            
            // Load .env file variables into system properties
            // This allows Spring Boot to access them via ${VAR_NAME} syntax
            dotenv.entries().forEach(entry -> {
                String key = entry.getKey();
                String value = entry.getValue();
                if (System.getProperty(key) == null) {
                    System.setProperty(key, value != null ? value : "");
                }
            });
            
            // Check if MySQL password is set
            String dbPassword = System.getProperty("DB_PASSWORD");
            if (dbPassword == null || dbPassword.trim().isEmpty()) {
                System.err.println("⚠ WARNING: DB_PASSWORD is not set in .env file!");
                System.err.println("  Please update your .env file with your MySQL password:");
                System.err.println("  DB_PASSWORD=your_mysql_password");
                System.err.println("  If MySQL has no password, you can leave it empty but ensure MySQL allows passwordless login.");
            }
            
            System.out.println("✓ Environment variables loaded from .env file");
        } catch (Exception e) {
            System.err.println("⚠ Warning: Could not load .env file: " + e.getMessage());
            System.err.println("  Make sure .env file exists in the project root directory");
            System.err.println("  You can copy .env.example to .env as a starting point");
        }
    }
}

