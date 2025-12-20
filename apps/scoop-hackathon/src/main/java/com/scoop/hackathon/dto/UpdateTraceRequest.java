package com.scoop.hackathon.dto;

public class UpdateTraceRequest {
    
    private String gitSessionId;
    private String stage;
    private String snapshotId;
    private String outputJson;
    private Integer durationMs;
    private Boolean success;
    private String errorMessage;
    
    public UpdateTraceRequest() {
    }
    
    public String getGitSessionId() {
        return gitSessionId;
    }
    
    public void setGitSessionId(String gitSessionId) {
        this.gitSessionId = gitSessionId;
    }
    
    public String getStage() {
        return stage;
    }
    
    public void setStage(String stage) {
        this.stage = stage;
    }
    
    public String getSnapshotId() {
        return snapshotId;
    }
    
    public void setSnapshotId(String snapshotId) {
        this.snapshotId = snapshotId;
    }
    
    public String getOutputJson() {
        return outputJson;
    }
    
    public void setOutputJson(String outputJson) {
        this.outputJson = outputJson;
    }
    
    public Integer getDurationMs() {
        return durationMs;
    }
    
    public void setDurationMs(Integer durationMs) {
        this.durationMs = durationMs;
    }
    
    public Boolean getSuccess() {
        return success;
    }
    
    public void setSuccess(Boolean success) {
        this.success = success;
    }
    
    public String getErrorMessage() {
        return errorMessage;
    }
    
    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}

