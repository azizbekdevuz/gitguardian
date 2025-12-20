package com.scoop.hackathon.dto;

public class UpdateEventRequest {
    
    private String type;
    private String userId;
    private String gitSessionId;
    private String metadata;
    
    public UpdateEventRequest() {
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    public String getGitSessionId() {
        return gitSessionId;
    }
    
    public void setGitSessionId(String gitSessionId) {
        this.gitSessionId = gitSessionId;
    }
    
    public String getMetadata() {
        return metadata;
    }
    
    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }
}

