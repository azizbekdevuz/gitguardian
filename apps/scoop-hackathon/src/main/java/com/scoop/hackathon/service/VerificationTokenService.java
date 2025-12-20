package com.scoop.hackathon.service;

import com.scoop.hackathon.dto.CreateVerificationTokenRequest;
import com.scoop.hackathon.dto.UpdateVerificationTokenRequest;
import com.scoop.hackathon.dto.VerificationTokenDto;

import java.util.List;

public interface VerificationTokenService {
    VerificationTokenDto createVerificationToken(CreateVerificationTokenRequest request);
    VerificationTokenDto getVerificationTokenById(String identifier);
    VerificationTokenDto getVerificationTokenByToken(String token);
    List<VerificationTokenDto> getAllVerificationTokens();
    VerificationTokenDto updateVerificationToken(String identifier, UpdateVerificationTokenRequest request);
    void deleteVerificationToken(String identifier);
    void deleteVerificationTokenByToken(String token);
}

