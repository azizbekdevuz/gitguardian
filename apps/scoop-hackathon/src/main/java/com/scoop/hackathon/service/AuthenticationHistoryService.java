package com.scoop.hackathon.service;

import com.scoop.hackathon.dto.AuthenticationHistoryDto;
import com.scoop.hackathon.dto.CreateAuthenticationHistoryRequest;
import com.scoop.hackathon.dto.UpdateAuthenticationHistoryRequest;

import java.util.List;

public interface AuthenticationHistoryService {
    AuthenticationHistoryDto createAuthenticationHistory(CreateAuthenticationHistoryRequest request);
    AuthenticationHistoryDto getAuthenticationHistoryById(String id);
    List<AuthenticationHistoryDto> getAllAuthenticationHistory();
    List<AuthenticationHistoryDto> getAuthenticationHistoryByUserId(String userId);
    List<AuthenticationHistoryDto> getAuthenticationHistoryByUserIdAndAction(String userId, String action);
    List<AuthenticationHistoryDto> getAuthenticationHistoryByUserIdAndSuccess(String userId, Boolean success);
    List<AuthenticationHistoryDto> getAuthenticationHistoryByTokenId(String tokenId);
    AuthenticationHistoryDto updateAuthenticationHistory(String id, UpdateAuthenticationHistoryRequest request);
    void deleteAuthenticationHistory(String id);
}

