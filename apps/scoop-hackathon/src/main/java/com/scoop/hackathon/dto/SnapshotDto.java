package com.scoop.hackathon.dto;

import java.time.LocalDateTime;

public class SnapshotDto {
    
    private String id;
    private LocalDateTime createdAt;
    private String gitSessionId;
    private String snapshotJson;
    private Boolean truncated;
    
    public SnapshotDto() {
    }
    
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public String getGitSessionId() {
        return gitSessionId;
    }
    
    public void setGitSessionId(String gitSessionId) {
        this.gitSessionId = gitSessionId;
    }
    
    public String getSnapshotJson() {
        return snapshotJson;
    }
    
    public void setSnapshotJson(String snapshotJson) {
        this.snapshotJson = snapshotJson;
    }
    
    public Boolean getTruncated() {
        return truncated;
    }
    
    public void setTruncated(Boolean truncated) {
        this.truncated = truncated;
    }
}

