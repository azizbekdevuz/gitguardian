package com.scoop.hackathon.controller;

import com.scoop.hackathon.dto.CreateSessionRequest;
import com.scoop.hackathon.dto.SessionDto;
import com.scoop.hackathon.dto.UpdateSessionRequest;
import com.scoop.hackathon.payload.ApiResponse;
import com.scoop.hackathon.service.SessionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {
    
    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }
    
    @PostMapping
    public ResponseEntity<SessionDto> createSession(@Valid @RequestBody CreateSessionRequest request) {
        SessionDto session = sessionService.createSession(request);
        return new ResponseEntity<>(session, HttpStatus.CREATED);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SessionDto> getSessionById(@PathVariable String id) {
        SessionDto session = sessionService.getSessionById(id);
        return ResponseEntity.ok(session);
    }
    
    @GetMapping("/token/{token}")
    public ResponseEntity<SessionDto> getSessionByToken(@PathVariable String token) {
        SessionDto session = sessionService.getSessionByToken(token);
        return ResponseEntity.ok(session);
    }
    
    @GetMapping
    public ResponseEntity<List<SessionDto>> getAllSessions() {
        List<SessionDto> sessions = sessionService.getAllSessions();
        return ResponseEntity.ok(sessions);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SessionDto>> getSessionsByUserId(@PathVariable String userId) {
        List<SessionDto> sessions = sessionService.getSessionsByUserId(userId);
        return ResponseEntity.ok(sessions);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<SessionDto> updateSession(
            @PathVariable String id,
            @Valid @RequestBody UpdateSessionRequest request) {
        SessionDto session = sessionService.updateSession(id, request);
        return ResponseEntity.ok(session);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteSession(@PathVariable String id) {
        sessionService.deleteSession(id);
        ApiResponse response = new ApiResponse(true, "Session deleted successfully");
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/token/{token}")
    public ResponseEntity<ApiResponse> deleteSessionByToken(@PathVariable String token) {
        sessionService.deleteSessionByToken(token);
        ApiResponse response = new ApiResponse(true, "Session deleted successfully");
        return ResponseEntity.ok(response);
    }
}

