package com.scoop.hackathon.service;

import com.scoop.hackathon.dto.CreateTraceRequest;
import com.scoop.hackathon.dto.TraceDto;
import com.scoop.hackathon.dto.UpdateTraceRequest;
import com.scoop.hackathon.entity.GitSession;
import com.scoop.hackathon.entity.Snapshot;
import com.scoop.hackathon.entity.Trace;
import com.scoop.hackathon.exception.ResourceNotFoundException;
import com.scoop.hackathon.repository.GitSessionRepository;
import com.scoop.hackathon.repository.SnapshotRepository;
import com.scoop.hackathon.repository.TraceRepository;
import com.scoop.hackathon.util.CuidGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TraceServiceImpl implements TraceService {
    
    private final TraceRepository traceRepository;
    private final GitSessionRepository gitSessionRepository;
    private final SnapshotRepository snapshotRepository;
    
    public TraceServiceImpl(TraceRepository traceRepository, GitSessionRepository gitSessionRepository, SnapshotRepository snapshotRepository) {
        this.traceRepository = traceRepository;
        this.gitSessionRepository = gitSessionRepository;
        this.snapshotRepository = snapshotRepository;
    }
    
    @Override
    public TraceDto createTrace(CreateTraceRequest request) {
        GitSession gitSession = gitSessionRepository.findById(request.getGitSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("GitSession", "id", request.getGitSessionId()));
        
        Trace trace = new Trace();
        trace.setId(CuidGenerator.generate());
        trace.setGitSession(gitSession);
        trace.setStage(request.getStage());
        trace.setOutputJson(request.getOutputJson());
        trace.setDurationMs(request.getDurationMs());
        trace.setSuccess(request.getSuccess() != null ? request.getSuccess() : true);
        trace.setErrorMessage(request.getErrorMessage());
        
        if (request.getSnapshotId() != null) {
            Snapshot snapshot = snapshotRepository.findById(request.getSnapshotId())
                    .orElseThrow(() -> new ResourceNotFoundException("Snapshot", "id", request.getSnapshotId()));
            trace.setSnapshot(snapshot);
        }
        
        Trace savedTrace = traceRepository.save(trace);
        return convertToDto(savedTrace);
    }
    
    @Override
    @Transactional(readOnly = true)
    public TraceDto getTraceById(String id) {
        Trace trace = traceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trace", "id", id));
        return convertToDto(trace);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TraceDto> getAllTraces() {
        return traceRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TraceDto> getTracesByGitSessionId(String gitSessionId) {
        return traceRepository.findByGitSessionIdOrderByCreatedAtDesc(gitSessionId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TraceDto> getTracesBySnapshotId(String snapshotId) {
        return traceRepository.findBySnapshotId(snapshotId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    public TraceDto updateTrace(String id, UpdateTraceRequest request) {
        Trace trace = traceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trace", "id", id));
        
        if (request.getStage() != null) trace.setStage(request.getStage());
        if (request.getOutputJson() != null) trace.setOutputJson(request.getOutputJson());
        if (request.getDurationMs() != null) trace.setDurationMs(request.getDurationMs());
        if (request.getSuccess() != null) trace.setSuccess(request.getSuccess());
        if (request.getErrorMessage() != null) trace.setErrorMessage(request.getErrorMessage());
        if (request.getGitSessionId() != null) {
            GitSession gitSession = gitSessionRepository.findById(request.getGitSessionId())
                    .orElseThrow(() -> new ResourceNotFoundException("GitSession", "id", request.getGitSessionId()));
            trace.setGitSession(gitSession);
        }
        if (request.getSnapshotId() != null) {
            Snapshot snapshot = snapshotRepository.findById(request.getSnapshotId())
                    .orElseThrow(() -> new ResourceNotFoundException("Snapshot", "id", request.getSnapshotId()));
            trace.setSnapshot(snapshot);
        }
        
        Trace updatedTrace = traceRepository.save(trace);
        return convertToDto(updatedTrace);
    }
    
    @Override
    public void deleteTrace(String id) {
        Trace trace = traceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trace", "id", id));
        traceRepository.delete(trace);
    }
    
    private TraceDto convertToDto(Trace trace) {
        TraceDto dto = new TraceDto();
        dto.setId(trace.getId());
        dto.setCreatedAt(trace.getCreatedAt());
        dto.setGitSessionId(trace.getGitSession() != null ? trace.getGitSession().getId() : null);
        dto.setStage(trace.getStage());
        dto.setSnapshotId(trace.getSnapshot() != null ? trace.getSnapshot().getId() : null);
        dto.setOutputJson(trace.getOutputJson());
        dto.setDurationMs(trace.getDurationMs());
        dto.setSuccess(trace.getSuccess());
        dto.setErrorMessage(trace.getErrorMessage());
        return dto;
    }
}

