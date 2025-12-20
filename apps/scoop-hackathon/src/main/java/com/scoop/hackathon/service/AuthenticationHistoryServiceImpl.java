package com.scoop.hackathon.service;

import com.scoop.hackathon.dto.AuthenticationHistoryDto;
import com.scoop.hackathon.dto.CreateAuthenticationHistoryRequest;
import com.scoop.hackathon.dto.UpdateAuthenticationHistoryRequest;
import com.scoop.hackathon.entity.AuthenticationHistory;
import com.scoop.hackathon.entity.User;
import com.scoop.hackathon.exception.ResourceNotFoundException;
import com.scoop.hackathon.repository.AuthenticationHistoryRepository;
import com.scoop.hackathon.repository.UserRepository;
import com.scoop.hackathon.util.CuidGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AuthenticationHistoryServiceImpl implements AuthenticationHistoryService {
    
    private final AuthenticationHistoryRepository authenticationHistoryRepository;
    private final UserRepository userRepository;
    
    public AuthenticationHistoryServiceImpl(
            AuthenticationHistoryRepository authenticationHistoryRepository,
            UserRepository userRepository) {
        this.authenticationHistoryRepository = authenticationHistoryRepository;
        this.userRepository = userRepository;
    }
    
    @Override
    public AuthenticationHistoryDto createAuthenticationHistory(CreateAuthenticationHistoryRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));
        
        AuthenticationHistory history = new AuthenticationHistory();
        history.setId(CuidGenerator.generate());
        history.setUser(user);
        history.setAction(request.getAction());
        history.setIpAddress(request.getIpAddress());
        history.setUserAgent(request.getUserAgent());
        history.setTokenId(request.getTokenId());
        history.setSuccess(request.getSuccess());
        history.setFailureReason(request.getFailureReason());
        
        AuthenticationHistory savedHistory = authenticationHistoryRepository.save(history);
        return convertToDto(savedHistory);
    }
    
    @Override
    @Transactional(readOnly = true)
    public AuthenticationHistoryDto getAuthenticationHistoryById(String id) {
        AuthenticationHistory history = authenticationHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AuthenticationHistory", "id", id));
        return convertToDto(history);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AuthenticationHistoryDto> getAllAuthenticationHistory() {
        return authenticationHistoryRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AuthenticationHistoryDto> getAuthenticationHistoryByUserId(String userId) {
        return authenticationHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AuthenticationHistoryDto> getAuthenticationHistoryByUserIdAndAction(String userId, String action) {
        return authenticationHistoryRepository.findByUserIdAndActionOrderByCreatedAtDesc(userId, action).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AuthenticationHistoryDto> getAuthenticationHistoryByUserIdAndSuccess(String userId, Boolean success) {
        return authenticationHistoryRepository.findByUserIdAndSuccessOrderByCreatedAtDesc(userId, success).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AuthenticationHistoryDto> getAuthenticationHistoryByTokenId(String tokenId) {
        return authenticationHistoryRepository.findByTokenId(tokenId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    public AuthenticationHistoryDto updateAuthenticationHistory(String id, UpdateAuthenticationHistoryRequest request) {
        AuthenticationHistory history = authenticationHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AuthenticationHistory", "id", id));
        
        if (request.getAction() != null) history.setAction(request.getAction());
        if (request.getIpAddress() != null) history.setIpAddress(request.getIpAddress());
        if (request.getUserAgent() != null) history.setUserAgent(request.getUserAgent());
        if (request.getTokenId() != null) history.setTokenId(request.getTokenId());
        if (request.getSuccess() != null) history.setSuccess(request.getSuccess());
        if (request.getFailureReason() != null) history.setFailureReason(request.getFailureReason());
        
        AuthenticationHistory updatedHistory = authenticationHistoryRepository.save(history);
        return convertToDto(updatedHistory);
    }
    
    @Override
    public void deleteAuthenticationHistory(String id) {
        AuthenticationHistory history = authenticationHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AuthenticationHistory", "id", id));
        authenticationHistoryRepository.delete(history);
    }
    
    private AuthenticationHistoryDto convertToDto(AuthenticationHistory history) {
        AuthenticationHistoryDto dto = new AuthenticationHistoryDto();
        dto.setId(history.getId());
        dto.setUserId(history.getUser() != null ? history.getUser().getId() : null);
        dto.setAction(history.getAction());
        dto.setIpAddress(history.getIpAddress());
        dto.setUserAgent(history.getUserAgent());
        dto.setTokenId(history.getTokenId());
        dto.setSuccess(history.getSuccess());
        dto.setFailureReason(history.getFailureReason());
        dto.setCreatedAt(history.getCreatedAt());
        return dto;
    }
}

