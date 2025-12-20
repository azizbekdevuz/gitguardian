package com.scoop.hackathon.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

@Entity
@Table(name = "trace")
public class Trace {
    
    @Id
    @Column(name = "id", length = 25)
    private String id;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "git_session_id", nullable = false)
    private GitSession gitSession;
    
    @Column(name = "stage", nullable = false)
    private String stage;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "snapshot_id")
    private Snapshot snapshot;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "output_json", nullable = false, columnDefinition = "json")
    private String outputJson;
    
    @Column(name = "duration_ms")
    private Integer durationMs;
    
    @Column(name = "success", nullable = false)
    private Boolean success = true;
    
    @Column(name = "error_message")
    private String errorMessage;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (success == null) {
            success = true;
        }
    }
    
    public Trace() {
    }
    
    public Trace(String id, GitSession gitSession, String stage, String outputJson) {
        this.id = id;
        this.gitSession = gitSession;
        this.stage = stage;
        this.outputJson = outputJson;
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
    
    public String getStage() {
        return stage;
    }
    
    public void setStage(String stage) {
        this.stage = stage;
    }
    
    public Snapshot getSnapshot() {
        return snapshot;
    }
    
    public void setSnapshot(Snapshot snapshot) {
        this.snapshot = snapshot;
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

