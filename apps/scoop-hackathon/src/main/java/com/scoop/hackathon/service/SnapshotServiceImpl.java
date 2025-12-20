package com.scoop.hackathon.service;

import com.scoop.hackathon.dto.CreateSnapshotRequest;
import com.scoop.hackathon.dto.SnapshotDto;
import com.scoop.hackathon.dto.UpdateSnapshotRequest;
import com.scoop.hackathon.entity.GitSession;
import com.scoop.hackathon.entity.Snapshot;
import com.scoop.hackathon.exception.ResourceNotFoundException;
import com.scoop.hackathon.repository.GitSessionRepository;
import com.scoop.hackathon.repository.SnapshotRepository;
import com.scoop.hackathon.util.CuidGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SnapshotServiceImpl implements SnapshotService {
    
    private final SnapshotRepository snapshotRepository;
    private final GitSessionRepository gitSessionRepository;
    
    public SnapshotServiceImpl(SnapshotRepository snapshotRepository, GitSessionRepository gitSessionRepository) {
        this.snapshotRepository = snapshotRepository;
        this.gitSessionRepository = gitSessionRepository;
    }
    
    @Override
    public SnapshotDto createSnapshot(CreateSnapshotRequest request) {
        GitSession gitSession = gitSessionRepository.findById(request.getGitSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("GitSession", "id", request.getGitSessionId()));
        
        Snapshot snapshot = new Snapshot();
        snapshot.setId(CuidGenerator.generate());
        snapshot.setGitSession(gitSession);
        snapshot.setSnapshotJson(request.getSnapshotJson());
        snapshot.setTruncated(request.getTruncated() != null ? request.getTruncated() : false);
        
        Snapshot savedSnapshot = snapshotRepository.save(snapshot);
        return convertToDto(savedSnapshot);
    }
    
    @Override
    @Transactional(readOnly = true)
    public SnapshotDto getSnapshotById(String id) {
        Snapshot snapshot = snapshotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Snapshot", "id", id));
        return convertToDto(snapshot);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SnapshotDto> getAllSnapshots() {
        return snapshotRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SnapshotDto> getSnapshotsByGitSessionId(String gitSessionId) {
        return snapshotRepository.findByGitSessionIdOrderByCreatedAtDesc(gitSessionId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    public SnapshotDto updateSnapshot(String id, UpdateSnapshotRequest request) {
        Snapshot snapshot = snapshotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Snapshot", "id", id));
        
        if (request.getSnapshotJson() != null) snapshot.setSnapshotJson(request.getSnapshotJson());
        if (request.getTruncated() != null) snapshot.setTruncated(request.getTruncated());
        if (request.getGitSessionId() != null) {
            GitSession gitSession = gitSessionRepository.findById(request.getGitSessionId())
                    .orElseThrow(() -> new ResourceNotFoundException("GitSession", "id", request.getGitSessionId()));
            snapshot.setGitSession(gitSession);
        }
        
        Snapshot updatedSnapshot = snapshotRepository.save(snapshot);
        return convertToDto(updatedSnapshot);
    }
    
    @Override
    public void deleteSnapshot(String id) {
        Snapshot snapshot = snapshotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Snapshot", "id", id));
        snapshotRepository.delete(snapshot);
    }
    
    private SnapshotDto convertToDto(Snapshot snapshot) {
        SnapshotDto dto = new SnapshotDto();
        dto.setId(snapshot.getId());
        dto.setCreatedAt(snapshot.getCreatedAt());
        dto.setGitSessionId(snapshot.getGitSession() != null ? snapshot.getGitSession().getId() : null);
        dto.setSnapshotJson(snapshot.getSnapshotJson());
        dto.setTruncated(snapshot.getTruncated());
        return dto;
    }
}

