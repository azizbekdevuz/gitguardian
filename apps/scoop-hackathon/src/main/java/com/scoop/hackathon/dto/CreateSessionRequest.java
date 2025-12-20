package com.scoop.hackathon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class CreateSessionRequest {
    
    @NotBlank(message = "Session token is required")
    private String sessionToken;
    
    @NotNull(message = "Expires date is required")
    private LocalDateTime expires;
    
    @NotBlank(message = "User ID is required")
    private String userId;
    
    public CreateSessionRequest() {
    }
    
    public String getSessionToken() {
        return sessionToken;
    }
    
    public void setSessionToken(String sessionToken) {
        this.sessionToken = sessionToken;
    }
    
    public LocalDateTime getExpires() {
        return expires;
    }
    
    public void setExpires(LocalDateTime expires) {
        this.expires = expires;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
}

