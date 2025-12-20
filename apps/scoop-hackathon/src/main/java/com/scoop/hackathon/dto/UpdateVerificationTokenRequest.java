package com.scoop.hackathon.dto;

import java.time.LocalDateTime;

public class UpdateVerificationTokenRequest {
    
    private String token;
    private LocalDateTime expires;
    
    public UpdateVerificationTokenRequest() {
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

