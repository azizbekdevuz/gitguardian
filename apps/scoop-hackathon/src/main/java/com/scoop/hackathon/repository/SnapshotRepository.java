package com.scoop.hackathon.repository;

import com.scoop.hackathon.entity.Snapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SnapshotRepository extends JpaRepository<Snapshot, String> {
    List<Snapshot> findByGitSessionId(String gitSessionId);
    List<Snapshot> findByGitSessionIdOrderByCreatedAtDesc(String gitSessionId);
}

