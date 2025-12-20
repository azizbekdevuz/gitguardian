package com.scoop.hackathon.repository;

import com.scoop.hackathon.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, String> {
    List<Event> findByUserId(String userId);
    List<Event> findByGitSessionId(String gitSessionId);
    List<Event> findByType(String type);
}

