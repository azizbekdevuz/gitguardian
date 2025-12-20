package com.scoop.hackathon.repository;

import com.scoop.hackathon.entity.GitSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GitSessionRepository extends JpaRepository<GitSession, String> {
    List<GitSession> findByUserId(String userId);
    List<GitSession> findByUserIdOrderByCreatedAtDesc(String userId);
}

