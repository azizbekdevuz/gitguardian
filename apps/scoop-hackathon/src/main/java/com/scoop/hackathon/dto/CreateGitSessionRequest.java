package com.scoop.hackathon.dto;

public class CreateGitSessionRequest {
    private String title;
    private String os;
    private String repoRootHash;
    private String userId;
    
    public CreateGitSessionRequest() {
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
}

