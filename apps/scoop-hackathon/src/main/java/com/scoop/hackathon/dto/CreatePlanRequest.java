package com.scoop.hackathon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreatePlanRequest {
    
    @NotBlank(message = "Git Session ID is required")
    private String gitSessionId;
    
    @NotBlank(message = "Plan JSON is required")
    private String planJson;
    
    private String issueType;
    private String risk;
    private Boolean dangerousAllowed;
    
    public CreatePlanRequest() {
    }
    
    public String getGitSessionId() {
        return gitSessionId;
    }
    
    public void setGitSessionId(String gitSessionId) {
        this.gitSessionId = gitSessionId;
    }
    
    public String getPlanJson() {
        return planJson;
    }
    
    public void setPlanJson(String planJson) {
        this.planJson = planJson;
    }
    
    public String getIssueType() {
        return issueType;
    }
    
    public void setIssueType(String issueType) {
        this.issueType = issueType;
    }
    
    public String getRisk() {
        return risk;
    }
    
    public void setRisk(String risk) {
        this.risk = risk;
    }
    
    public Boolean getDangerousAllowed() {
        return dangerousAllowed;
    }
    
    public void setDangerousAllowed(Boolean dangerousAllowed) {
        this.dangerousAllowed = dangerousAllowed;
    }
}

