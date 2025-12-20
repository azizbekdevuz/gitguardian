package com.scoop.hackathon.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateEventRequest {
    
    @NotBlank(message = "Type is required")
    private String type;
    
    private String userId;
    private String gitSessionId;
    private String metadata;
    
    public CreateEventRequest() {
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

