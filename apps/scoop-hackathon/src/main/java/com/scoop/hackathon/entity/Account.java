package com.scoop.hackathon.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "account")
public class Account {
    
    @Id
    @Column(name = "id", length = 25)
    private String id;
    
    @Column(name = "type", nullable = false)
    private String type;
    
    @Column(name = "provider", nullable = false)
    private String provider;
    
    @Column(name = "provider_account_id", nullable = false)
    private String providerAccountId;
    
    @Column(name = "refresh_token", columnDefinition = "TEXT")
    private String refreshToken;
    
    @Column(name = "access_token", columnDefinition = "TEXT")
    private String accessToken;
    
    @Column(name = "expires_at")
    private Integer expiresAt;
    
    @Column(name = "token_type")
    private String tokenType;
    
    @Column(name = "scope")
    private String scope;
    
    @Column(name = "id_token", columnDefinition = "TEXT")
    private String idToken;
    
    @Column(name = "session_state")
    private String sessionState;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    public Account() {
    }
    
    public Account(String id, String type, String provider, String providerAccountId, User user) {
        this.id = id;
        this.type = type;
        this.provider = provider;
        this.providerAccountId = providerAccountId;
        this.user = user;
    }
    
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getProvider() {
        return provider;
    }
    
    public void setProvider(String provider) {
        this.provider = provider;
    }
    
    public String getProviderAccountId() {
        return providerAccountId;
    }
    
    public void setProviderAccountId(String providerAccountId) {
        this.providerAccountId = providerAccountId;
    }
    
    public String getRefreshToken() {
        return refreshToken;
    }
    
    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
    
    public String getAccessToken() {
        return accessToken;
    }
    
    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }
    
    public Integer getExpiresAt() {
        return expiresAt;
    }
    
    public void setExpiresAt(Integer expiresAt) {
        this.expiresAt = expiresAt;
    }
    
    public String getTokenType() {
        return tokenType;
    }
    
    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }
    
    public String getScope() {
        return scope;
    }
    
    public void setScope(String scope) {
        this.scope = scope;
    }
    
    public String getIdToken() {
        return idToken;
    }
    
    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }
    
    public String getSessionState() {
        return sessionState;
    }
    
    public void setSessionState(String sessionState) {
        this.sessionState = sessionState;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
}

