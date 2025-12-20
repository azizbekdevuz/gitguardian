package com.scoop.hackathon.repository;

import com.scoop.hackathon.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<Session, String> {
    Optional<Session> findBySessionToken(String sessionToken);
    List<Session> findByUserId(String userId);
    void deleteBySessionToken(String sessionToken);
}

