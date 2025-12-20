package com.scoop.hackathon.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateSnapshotRequest {
    
    @NotBlank(message = "Git Session ID is required")
    private String gitSessionId;
    
    @NotBlank(message = "Snapshot JSON is required")
    private String snapshotJson;
    
    private Boolean truncated;
    
    public CreateSnapshotRequest() {
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

