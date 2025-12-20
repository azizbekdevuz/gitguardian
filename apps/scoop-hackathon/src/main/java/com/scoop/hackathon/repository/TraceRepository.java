package com.scoop.hackathon.repository;

import com.scoop.hackathon.entity.Trace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TraceRepository extends JpaRepository<Trace, String> {
    List<Trace> findByGitSessionId(String gitSessionId);
    List<Trace> findByGitSessionIdOrderByCreatedAtDesc(String gitSessionId);
    List<Trace> findBySnapshotId(String snapshotId);
}

