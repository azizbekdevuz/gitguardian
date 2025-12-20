package com.scoop.hackathon.dto;

import java.time.LocalDateTime;

public class GitSessionDto {
    private String id;
    private String title;
    private String os;
    private String repoRootHash;
    private String userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public GitSessionDto() {
    }
    
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getOs() {
        return os;
    }
    
    public void setOs(String os) {
        this.os = os;
    }
    
    public String getRepoRootHash() {
        return repoRootHash;
    }
    
    public void setRepoRootHash(String repoRootHash) {
        this.repoRootHash = repoRootHash;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

