package com.scoop.hackathon.dto;

import java.time.LocalDateTime;

public class VerificationTokenDto {
    
    private String identifier;
    private String token;
    private LocalDateTime expires;
    
    public VerificationTokenDto() {
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

