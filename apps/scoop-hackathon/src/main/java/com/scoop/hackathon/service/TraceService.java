package com.scoop.hackathon.service;

import com.scoop.hackathon.dto.CreateTraceRequest;
import com.scoop.hackathon.dto.TraceDto;
import com.scoop.hackathon.dto.UpdateTraceRequest;

import java.util.List;

public interface TraceService {
    TraceDto createTrace(CreateTraceRequest request);
    TraceDto getTraceById(String id);
    List<TraceDto> getAllTraces();
    List<TraceDto> getTracesByGitSessionId(String gitSessionId);
    List<TraceDto> getTracesBySnapshotId(String snapshotId);
    TraceDto updateTrace(String id, UpdateTraceRequest request);
    void deleteTrace(String id);
}

