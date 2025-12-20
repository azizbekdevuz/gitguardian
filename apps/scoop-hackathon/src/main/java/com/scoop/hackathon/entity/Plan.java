package com.scoop.hackathon.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

@Entity
@Table(name = "plan")
public class Plan {
    
    @Id
    @Column(name = "id", length = 25)
    private String id;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "git_session_id", nullable = false)
    private GitSession gitSession;
    
    @Column(name = "issue_type")
    private String issueType;
    
    @Column(name = "risk")
    private String risk;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "plan_json", nullable = false, columnDefinition = "json")
    private String planJson;
    
    @Column(name = "dangerous_allowed", nullable = false)
    private Boolean dangerousAllowed = false;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (dangerousAllowed == null) {
            dangerousAllowed = false;
        }
    }
    
    public Plan() {
    }
    
    public Plan(String id, GitSession gitSession, String planJson) {
        this.id = id;
        this.gitSession = gitSession;
        this.planJson = planJson;
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
    
    public GitSession getGitSession() {
        return gitSession;
    }
    
    public void setGitSession(GitSession gitSession) {
        this.gitSession = gitSession;
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

