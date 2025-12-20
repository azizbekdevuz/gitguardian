package com.scoop.hackathon.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

@Configuration
public class EnvironmentConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(EnvironmentConfig.class);
    
    private final Dotenv dotenv;

    public EnvironmentConfig(Dotenv dotenv) {
        this.dotenv = dotenv;
    }
    
    @PostConstruct
    public void logEnvironmentVariables() {
        // Log that environment variables were loaded (they're already loaded in main method)
        logger.info("Environment configuration initialized");
        logger.debug("Total environment variables loaded: {}", dotenv.entries().size());
    }
}

