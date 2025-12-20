package com.scoop.hackathon.controller;

import com.scoop.hackathon.dto.CreateGitSessionRequest;
import com.scoop.hackathon.dto.GitSessionDto;
import com.scoop.hackathon.payload.ApiResponse;
import com.scoop.hackathon.service.GitSessionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/git-sessions")
public class GitSessionController {
    
    private final GitSessionService gitSessionService;

    public GitSessionController(GitSessionService gitSessionService) {
        this.gitSessionService = gitSessionService;
    }
    
    @PostMapping
    public ResponseEntity<GitSessionDto> createGitSession(@RequestBody CreateGitSessionRequest request) {
        GitSessionDto gitSession = gitSessionService.createGitSession(request);
        return new ResponseEntity<>(gitSession, HttpStatus.CREATED);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<GitSessionDto> getGitSessionById(@PathVariable String id) {
        GitSessionDto gitSession = gitSessionService.getGitSessionById(id);
        return ResponseEntity.ok(gitSession);
    }
    
    @GetMapping
    public ResponseEntity<List<GitSessionDto>> getAllGitSessions() {
        List<GitSessionDto> gitSessions = gitSessionService.getAllGitSessions();
        return ResponseEntity.ok(gitSessions);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<GitSessionDto>> getGitSessionsByUserId(@PathVariable String userId) {
        List<GitSessionDto> gitSessions = gitSessionService.getGitSessionsByUserId(userId);
        return ResponseEntity.ok(gitSessions);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<GitSessionDto> updateGitSession(
            @PathVariable String id,
            @RequestBody CreateGitSessionRequest request) {
        GitSessionDto gitSession = gitSessionService.updateGitSession(id, request);
        return ResponseEntity.ok(gitSession);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteGitSession(@PathVariable String id) {
        gitSessionService.deleteGitSession(id);
        ApiResponse response = new ApiResponse(true, "GitSession deleted successfully");
        return ResponseEntity.ok(response);
    }
}

