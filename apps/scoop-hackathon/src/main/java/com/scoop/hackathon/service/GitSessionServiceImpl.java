package com.scoop.hackathon.service;

import com.scoop.hackathon.dto.CreateGitSessionRequest;
import com.scoop.hackathon.dto.GitSessionDto;
import com.scoop.hackathon.entity.GitSession;
import com.scoop.hackathon.entity.User;
import com.scoop.hackathon.exception.ResourceNotFoundException;
import com.scoop.hackathon.repository.GitSessionRepository;
import com.scoop.hackathon.repository.UserRepository;
import com.scoop.hackathon.util.CuidGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class GitSessionServiceImpl implements GitSessionService {
    
    private final GitSessionRepository gitSessionRepository;
    
    private final UserRepository userRepository;

    public GitSessionServiceImpl(GitSessionRepository gitSessionRepository, UserRepository userRepository) {
        this.gitSessionRepository = gitSessionRepository;
        this.userRepository = userRepository;
    }
    
    @Override
    public GitSessionDto createGitSession(CreateGitSessionRequest request) {
        GitSession gitSession = new GitSession();
        gitSession.setId(CuidGenerator.generate());
        gitSession.setTitle(request.getTitle());
        gitSession.setOs(request.getOs());
        gitSession.setRepoRootHash(request.getRepoRootHash());
        
        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));
            gitSession.setUser(user);
        }
        
        GitSession savedSession = gitSessionRepository.save(gitSession);
        return convertToDto(savedSession);
    }
    
    @Override
    @Transactional(readOnly = true)
    public GitSessionDto getGitSessionById(String id) {
        GitSession gitSession = gitSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("GitSession", "id", id));
        return convertToDto(gitSession);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<GitSessionDto> getAllGitSessions() {
        return gitSessionRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<GitSessionDto> getGitSessionsByUserId(String userId) {
        return gitSessionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    public GitSessionDto updateGitSession(String id, CreateGitSessionRequest request) {
        GitSession gitSession = gitSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("GitSession", "id", id));
        
        if (request.getTitle() != null) {
            gitSession.setTitle(request.getTitle());
        }
        if (request.getOs() != null) {
            gitSession.setOs(request.getOs());
        }
        if (request.getRepoRootHash() != null) {
            gitSession.setRepoRootHash(request.getRepoRootHash());
        }
        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));
            gitSession.setUser(user);
        }
        
        GitSession updatedSession = gitSessionRepository.save(gitSession);
        return convertToDto(updatedSession);
    }
    
    @Override
    public void deleteGitSession(String id) {
        GitSession gitSession = gitSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("GitSession", "id", id));
        gitSessionRepository.delete(gitSession);
    }
    
    private GitSessionDto convertToDto(GitSession gitSession) {
        GitSessionDto dto = new GitSessionDto();
        dto.setId(gitSession.getId());
        dto.setTitle(gitSession.getTitle());
        dto.setOs(gitSession.getOs());
        dto.setRepoRootHash(gitSession.getRepoRootHash());
        dto.setUserId(gitSession.getUser() != null ? gitSession.getUser().getId() : null);
        dto.setCreatedAt(gitSession.getCreatedAt());
        dto.setUpdatedAt(gitSession.getUpdatedAt());
        return dto;
    }
}

