package com.scoop.hackathon.dto;

public class UpdateAccountRequest {
    
    private String type;
    private String provider;
    private String providerAccountId;
    private String refreshToken;
    private String accessToken;
    private Integer expiresAt;
    private String tokenType;
    private String scope;
    private String idToken;
    private String sessionState;
    private String userId;
    
    public UpdateAccountRequest() {
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
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
}

