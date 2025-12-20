package com.scoop.hackathon.service;

import com.scoop.hackathon.dto.CreateSessionRequest;
import com.scoop.hackathon.dto.SessionDto;
import com.scoop.hackathon.dto.UpdateSessionRequest;
import com.scoop.hackathon.entity.Session;
import com.scoop.hackathon.entity.User;
import com.scoop.hackathon.exception.ResourceNotFoundException;
import com.scoop.hackathon.repository.SessionRepository;
import com.scoop.hackathon.repository.UserRepository;
import com.scoop.hackathon.util.CuidGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SessionServiceImpl implements SessionService {
    
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    
    public SessionServiceImpl(SessionRepository sessionRepository, UserRepository userRepository) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }
    
    @Override
    public SessionDto createSession(CreateSessionRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));
        
        Session session = new Session();
        session.setId(CuidGenerator.generate());
        session.setSessionToken(request.getSessionToken());
        session.setExpires(request.getExpires());
        session.setUser(user);
        
        Session savedSession = sessionRepository.save(session);
        return convertToDto(savedSession);
    }
    
    @Override
    @Transactional(readOnly = true)
    public SessionDto getSessionById(String id) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", id));
        return convertToDto(session);
    }
    
    @Override
    @Transactional(readOnly = true)
    public SessionDto getSessionByToken(String token) {
        Session session = sessionRepository.findBySessionToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "token", token));
        return convertToDto(session);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SessionDto> getAllSessions() {
        return sessionRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SessionDto> getSessionsByUserId(String userId) {
        return sessionRepository.findByUserId(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    public SessionDto updateSession(String id, UpdateSessionRequest request) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", id));
        
        if (request.getSessionToken() != null) session.setSessionToken(request.getSessionToken());
        if (request.getExpires() != null) session.setExpires(request.getExpires());
        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));
            session.setUser(user);
        }
        
        Session updatedSession = sessionRepository.save(session);
        return convertToDto(updatedSession);
    }
    
    @Override
    public void deleteSession(String id) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", id));
        sessionRepository.delete(session);
    }
    
    @Override
    public void deleteSessionByToken(String token) {
        sessionRepository.deleteBySessionToken(token);
    }
    
    private SessionDto convertToDto(Session session) {
        SessionDto dto = new SessionDto();
        dto.setId(session.getId());
        dto.setSessionToken(session.getSessionToken());
        dto.setExpires(session.getExpires());
        dto.setUserId(session.getUser() != null ? session.getUser().getId() : null);
        return dto;
    }
}

