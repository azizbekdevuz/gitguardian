package com.scoop.hackathon.dto;

public class UpdateSnapshotRequest {
    
    private String gitSessionId;
    private String snapshotJson;
    private Boolean truncated;
    
    public UpdateSnapshotRequest() {
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

