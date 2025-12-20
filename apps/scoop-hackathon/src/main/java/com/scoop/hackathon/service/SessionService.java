package com.scoop.hackathon.service;

import com.scoop.hackathon.dto.CreateSessionRequest;
import com.scoop.hackathon.dto.SessionDto;
import com.scoop.hackathon.dto.UpdateSessionRequest;

import java.util.List;

public interface SessionService {
    SessionDto createSession(CreateSessionRequest request);
    SessionDto getSessionById(String id);
    SessionDto getSessionByToken(String token);
    List<SessionDto> getAllSessions();
    List<SessionDto> getSessionsByUserId(String userId);
    SessionDto updateSession(String id, UpdateSessionRequest request);
    void deleteSession(String id);
    void deleteSessionByToken(String token);
}

