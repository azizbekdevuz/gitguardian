package com.scoop.hackathon.repository;

import com.scoop.hackathon.entity.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlanRepository extends JpaRepository<Plan, String> {
    List<Plan> findByGitSessionId(String gitSessionId);
    List<Plan> findByGitSessionIdOrderByCreatedAtDesc(String gitSessionId);
}

