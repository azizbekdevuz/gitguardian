package com.scoop.hackathon.controller;

import com.scoop.hackathon.dto.CreateVerificationTokenRequest;
import com.scoop.hackathon.dto.UpdateVerificationTokenRequest;
import com.scoop.hackathon.dto.VerificationTokenDto;
import com.scoop.hackathon.payload.ApiResponse;
import com.scoop.hackathon.service.VerificationTokenService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/verification-tokens")
public class VerificationTokenController {
    
    private final VerificationTokenService verificationTokenService;

    public VerificationTokenController(VerificationTokenService verificationTokenService) {
        this.verificationTokenService = verificationTokenService;
    }
    
    @PostMapping
    public ResponseEntity<VerificationTokenDto> createVerificationToken(
            @Valid @RequestBody CreateVerificationTokenRequest request) {
        VerificationTokenDto token = verificationTokenService.createVerificationToken(request);
        return new ResponseEntity<>(token, HttpStatus.CREATED);
    }
    
    @GetMapping("/{identifier}")
    public ResponseEntity<VerificationTokenDto> getVerificationTokenById(@PathVariable String identifier) {
        VerificationTokenDto token = verificationTokenService.getVerificationTokenById(identifier);
        return ResponseEntity.ok(token);
    }
    
    @GetMapping("/token/{token}")
    public ResponseEntity<VerificationTokenDto> getVerificationTokenByToken(@PathVariable String token) {
        VerificationTokenDto verificationToken = verificationTokenService.getVerificationTokenByToken(token);
        return ResponseEntity.ok(verificationToken);
    }
    
    @GetMapping
    public ResponseEntity<List<VerificationTokenDto>> getAllVerificationTokens() {
        List<VerificationTokenDto> tokens = verificationTokenService.getAllVerificationTokens();
        return ResponseEntity.ok(tokens);
    }
    
    @PutMapping("/{identifier}")
    public ResponseEntity<VerificationTokenDto> updateVerificationToken(
            @PathVariable String identifier,
            @Valid @RequestBody UpdateVerificationTokenRequest request) {
        VerificationTokenDto token = verificationTokenService.updateVerificationToken(identifier, request);
        return ResponseEntity.ok(token);
    }
    
    @DeleteMapping("/{identifier}")
    public ResponseEntity<ApiResponse> deleteVerificationToken(@PathVariable String identifier) {
        verificationTokenService.deleteVerificationToken(identifier);
        ApiResponse response = new ApiResponse(true, "VerificationToken deleted successfully");
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/token/{token}")
    public ResponseEntity<ApiResponse> deleteVerificationTokenByToken(@PathVariable String token) {
        verificationTokenService.deleteVerificationTokenByToken(token);
        ApiResponse response = new ApiResponse(true, "VerificationToken deleted successfully");
        return ResponseEntity.ok(response);
    }
}

