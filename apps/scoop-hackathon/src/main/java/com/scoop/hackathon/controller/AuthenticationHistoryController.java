package com.scoop.hackathon.controller;

import com.scoop.hackathon.dto.AuthenticationHistoryDto;
import com.scoop.hackathon.dto.CreateAuthenticationHistoryRequest;
import com.scoop.hackathon.dto.UpdateAuthenticationHistoryRequest;
import com.scoop.hackathon.payload.ApiResponse;
import com.scoop.hackathon.service.AuthenticationHistoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/authentication-history")
public class AuthenticationHistoryController {
    
    private final AuthenticationHistoryService authenticationHistoryService;

    public AuthenticationHistoryController(AuthenticationHistoryService authenticationHistoryService) {
        this.authenticationHistoryService = authenticationHistoryService;
    }
    
    @PostMapping
    public ResponseEntity<AuthenticationHistoryDto> createAuthenticationHistory(
            @Valid @RequestBody CreateAuthenticationHistoryRequest request) {
        AuthenticationHistoryDto history = authenticationHistoryService.createAuthenticationHistory(request);
        return new ResponseEntity<>(history, HttpStatus.CREATED);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<AuthenticationHistoryDto> getAuthenticationHistoryById(@PathVariable String id) {
        AuthenticationHistoryDto history = authenticationHistoryService.getAuthenticationHistoryById(id);
        return ResponseEntity.ok(history);
    }
    
    @GetMapping
    public ResponseEntity<List<AuthenticationHistoryDto>> getAllAuthenticationHistory() {
        List<AuthenticationHistoryDto> history = authenticationHistoryService.getAllAuthenticationHistory();
        return ResponseEntity.ok(history);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AuthenticationHistoryDto>> getAuthenticationHistoryByUserId(@PathVariable String userId) {
        List<AuthenticationHistoryDto> history = authenticationHistoryService.getAuthenticationHistoryByUserId(userId);
        return ResponseEntity.ok(history);
    }
    
    @GetMapping("/user/{userId}/action/{action}")
    public ResponseEntity<List<AuthenticationHistoryDto>> getAuthenticationHistoryByUserIdAndAction(
            @PathVariable String userId,
            @PathVariable String action) {
        List<AuthenticationHistoryDto> history = authenticationHistoryService.getAuthenticationHistoryByUserIdAndAction(userId, action);
        return ResponseEntity.ok(history);
    }
    
    @GetMapping("/user/{userId}/success/{success}")
    public ResponseEntity<List<AuthenticationHistoryDto>> getAuthenticationHistoryByUserIdAndSuccess(
            @PathVariable String userId,
            @PathVariable Boolean success) {
        List<AuthenticationHistoryDto> history = authenticationHistoryService.getAuthenticationHistoryByUserIdAndSuccess(userId, success);
        return ResponseEntity.ok(history);
    }
    
    @GetMapping("/token/{tokenId}")
    public ResponseEntity<List<AuthenticationHistoryDto>> getAuthenticationHistoryByTokenId(@PathVariable String tokenId) {
        List<AuthenticationHistoryDto> history = authenticationHistoryService.getAuthenticationHistoryByTokenId(tokenId);
        return ResponseEntity.ok(history);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<AuthenticationHistoryDto> updateAuthenticationHistory(
            @PathVariable String id,
            @Valid @RequestBody UpdateAuthenticationHistoryRequest request) {
        AuthenticationHistoryDto history = authenticationHistoryService.updateAuthenticationHistory(id, request);
        return ResponseEntity.ok(history);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteAuthenticationHistory(@PathVariable String id) {
        authenticationHistoryService.deleteAuthenticationHistory(id);
        ApiResponse response = new ApiResponse(true, "AuthenticationHistory deleted successfully");
        return ResponseEntity.ok(response);
    }
}

