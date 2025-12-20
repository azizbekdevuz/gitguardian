package com.scoop.hackathon.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "git_session")
public class GitSession {
    
    @Id
    @Column(name = "id", length = 25)
    private String id;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    @Column(name = "title")
    private String title;
    
    @Column(name = "os")
    private String os;
    
    @Column(name = "repo_root_hash")
    private String repoRootHash;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    @OneToMany(mappedBy = "gitSession", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Snapshot> snapshots = new ArrayList<>();
    
    @OneToMany(mappedBy = "gitSession", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Plan> plans = new ArrayList<>();
    
    @OneToMany(mappedBy = "gitSession", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Trace> traces = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }
    
    public GitSession() {
    }
    
    public GitSession(String id) {
        this.id = id;
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
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
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
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public List<Snapshot> getSnapshots() {
        return snapshots;
    }
    
    public void setSnapshots(List<Snapshot> snapshots) {
        this.snapshots = snapshots;
    }
    
    public List<Plan> getPlans() {
        return plans;
    }
    
    public void setPlans(List<Plan> plans) {
        this.plans = plans;
    }
    
    public List<Trace> getTraces() {
        return traces;
    }
    
    public void setTraces(List<Trace> traces) {
        this.traces = traces;
    }
}

