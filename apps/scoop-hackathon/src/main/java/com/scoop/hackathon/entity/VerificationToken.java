package com.scoop.hackathon.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "verification_token")
public class VerificationToken {
    
    @Id
    @Column(name = "identifier")
    private String identifier;
    
    @Column(name = "token", nullable = false)
    private String token;
    
    @Column(name = "expires", nullable = false)
    private LocalDateTime expires;
    
    public VerificationToken() {
    }
    
    public VerificationToken(String identifier, String token, LocalDateTime expires) {
        this.identifier = identifier;
        this.token = token;
        this.expires = expires;
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

