package com.scoop.hackathon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class CreateVerificationTokenRequest {
    
    @NotBlank(message = "Identifier is required")
    private String identifier;
    
    @NotBlank(message = "Token is required")
    private String token;
    
    @NotNull(message = "Expires date is required")
    private LocalDateTime expires;
    
    public CreateVerificationTokenRequest() {
    }
    
    public String getIdentifier() {
        return identifier;
    }
    
    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }
    
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public LocalDateTime getExpires() {
        return expires;
    }
    
    public void setExpires(LocalDateTime expires) {
        this.expires = expires;
    }
}

