package com.scoop.hackathon.service;

import com.scoop.hackathon.dto.CreateVerificationTokenRequest;
import com.scoop.hackathon.dto.UpdateVerificationTokenRequest;
import com.scoop.hackathon.dto.VerificationTokenDto;
import com.scoop.hackathon.entity.VerificationToken;
import com.scoop.hackathon.exception.ResourceNotFoundException;
import com.scoop.hackathon.repository.VerificationTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class VerificationTokenServiceImpl implements VerificationTokenService {
    
    private final VerificationTokenRepository verificationTokenRepository;
    
    public VerificationTokenServiceImpl(VerificationTokenRepository verificationTokenRepository) {
        this.verificationTokenRepository = verificationTokenRepository;
    }
    
    @Override
    public VerificationTokenDto createVerificationToken(CreateVerificationTokenRequest request) {
        VerificationToken token = new VerificationToken();
        token.setIdentifier(request.getIdentifier());
        token.setToken(request.getToken());
        token.setExpires(request.getExpires());
        
        VerificationToken savedToken = verificationTokenRepository.save(token);
        return convertToDto(savedToken);
    }
    
    @Override
    @Transactional(readOnly = true)
    public VerificationTokenDto getVerificationTokenById(String identifier) {
        VerificationToken token = verificationTokenRepository.findById(identifier)
                .orElseThrow(() -> new ResourceNotFoundException("VerificationToken", "identifier", identifier));
        return convertToDto(token);
    }
    
    @Override
    @Transactional(readOnly = true)
    public VerificationTokenDto getVerificationTokenByToken(String token) {
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("VerificationToken", "token", token));
        return convertToDto(verificationToken);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<VerificationTokenDto> getAllVerificationTokens() {
        return verificationTokenRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    public VerificationTokenDto updateVerificationToken(String identifier, UpdateVerificationTokenRequest request) {
        VerificationToken token = verificationTokenRepository.findById(identifier)
                .orElseThrow(() -> new ResourceNotFoundException("VerificationToken", "identifier", identifier));
        
        if (request.getToken() != null) token.setToken(request.getToken());
        if (request.getExpires() != null) token.setExpires(request.getExpires());
        
        VerificationToken updatedToken = verificationTokenRepository.save(token);
        return convertToDto(updatedToken);
    }
    
    @Override
    public void deleteVerificationToken(String identifier) {
        VerificationToken token = verificationTokenRepository.findById(identifier)
                .orElseThrow(() -> new ResourceNotFoundException("VerificationToken", "identifier", identifier));
        verificationTokenRepository.delete(token);
    }
    
    @Override
    public void deleteVerificationTokenByToken(String token) {
        verificationTokenRepository.deleteByToken(token);
    }
    
    private VerificationTokenDto convertToDto(VerificationToken token) {
        VerificationTokenDto dto = new VerificationTokenDto();
        dto.setIdentifier(token.getIdentifier());
        dto.setToken(token.getToken());
        dto.setExpires(token.getExpires());
        return dto;
    }
}

