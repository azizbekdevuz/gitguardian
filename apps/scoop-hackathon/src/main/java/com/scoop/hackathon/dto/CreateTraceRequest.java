package com.scoop.hackathon.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateTraceRequest {
    
    @NotBlank(message = "Git Session ID is required")
    private String gitSessionId;
    
    @NotBlank(message = "Stage is required")
    private String stage;
    
    @NotBlank(message = "Output JSON is required")
    private String outputJson;
    
    private String snapshotId;
    private Integer durationMs;
    private Boolean success;
    private String errorMessage;
    
    public CreateTraceRequest() {
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
    
    public String getOutputJson() {
        return outputJson;
    }
    
    public void setOutputJson(String outputJson) {
        this.outputJson = outputJson;
    }
    
    public String getSnapshotId() {
        return snapshotId;
    }
    
    public void setSnapshotId(String snapshotId) {
        this.snapshotId = snapshotId;
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

