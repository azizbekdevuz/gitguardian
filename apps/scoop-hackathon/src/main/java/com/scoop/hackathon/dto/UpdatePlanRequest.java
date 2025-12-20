package com.scoop.hackathon.dto;

public class UpdatePlanRequest {
    
    private String gitSessionId;
    private String issueType;
    private String risk;
    private String planJson;
    private Boolean dangerousAllowed;
    
    public UpdatePlanRequest() {
    }
    
    public String getGitSessionId() {
        return gitSessionId;
    }
    
    public void setGitSessionId(String gitSessionId) {
        this.gitSessionId = gitSessionId;
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
    
    public String getPlanJson() {
        return planJson;
    }
    
    public void setPlanJson(String planJson) {
        this.planJson = planJson;
    }
    
    public Boolean getDangerousAllowed() {
        return dangerousAllowed;
    }
    
    public void setDangerousAllowed(Boolean dangerousAllowed) {
        this.dangerousAllowed = dangerousAllowed;
    }
}

