package com.scoop.hackathon.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "snapshot")
public class Snapshot {
    
    @Id
    @Column(name = "id", length = 25)
    private String id;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "git_session_id", nullable = false)
    private GitSession gitSession;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "snapshot_json", nullable = false, columnDefinition = "json")
    private String snapshotJson;
    
    @Column(name = "truncated", nullable = false)
    private Boolean truncated = false;
    
    @OneToMany(mappedBy = "snapshot", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Trace> traces = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (truncated == null) {
            truncated = false;
        }
    }
    
    public Snapshot() {
    }
    
    public Snapshot(String id, GitSession gitSession, String snapshotJson) {
        this.id = id;
        this.gitSession = gitSession;
        this.snapshotJson = snapshotJson;
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
    
    public List<Trace> getTraces() {
        return traces;
    }
    
    public void setTraces(List<Trace> traces) {
        this.traces = traces;
    }
}

