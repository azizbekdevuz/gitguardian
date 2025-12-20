package com.scoop.hackathon.repository;

import com.scoop.hackathon.entity.AuthenticationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuthenticationHistoryRepository extends JpaRepository<AuthenticationHistory, String> {
    List<AuthenticationHistory> findByUserIdOrderByCreatedAtDesc(String userId);
    List<AuthenticationHistory> findByUserIdAndActionOrderByCreatedAtDesc(String userId, String action);
    List<AuthenticationHistory> findByUserIdAndSuccessOrderByCreatedAtDesc(String userId, Boolean success);
    List<AuthenticationHistory> findByTokenId(String tokenId);
}

