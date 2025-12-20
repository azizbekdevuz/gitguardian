package com.scoop.hackathon.service;

import com.scoop.hackathon.dto.CreateGitSessionRequest;
import com.scoop.hackathon.dto.GitSessionDto;

import java.util.List;

public interface GitSessionService {
    GitSessionDto createGitSession(CreateGitSessionRequest request);
    GitSessionDto getGitSessionById(String id);
    List<GitSessionDto> getAllGitSessions();
    List<GitSessionDto> getGitSessionsByUserId(String userId);
    GitSessionDto updateGitSession(String id, CreateGitSessionRequest request);
    void deleteGitSession(String id);
}

