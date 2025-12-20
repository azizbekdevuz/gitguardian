package com.scoop.hackathon.controller;

import com.scoop.hackathon.dto.CreateTraceRequest;
import com.scoop.hackathon.dto.TraceDto;
import com.scoop.hackathon.dto.UpdateTraceRequest;
import com.scoop.hackathon.payload.ApiResponse;
import com.scoop.hackathon.service.TraceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/traces")
public class TraceController {
    
    private final TraceService traceService;

    public TraceController(TraceService traceService) {
        this.traceService = traceService;
    }
    
    @PostMapping
    public ResponseEntity<TraceDto> createTrace(@Valid @RequestBody CreateTraceRequest request) {
        TraceDto trace = traceService.createTrace(request);
        return new ResponseEntity<>(trace, HttpStatus.CREATED);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<TraceDto> getTraceById(@PathVariable String id) {
        TraceDto trace = traceService.getTraceById(id);
        return ResponseEntity.ok(trace);
    }
    
    @GetMapping
    public ResponseEntity<List<TraceDto>> getAllTraces() {
        List<TraceDto> traces = traceService.getAllTraces();
        return ResponseEntity.ok(traces);
    }
    
    @GetMapping("/git-session/{gitSessionId}")
    public ResponseEntity<List<TraceDto>> getTracesByGitSessionId(@PathVariable String gitSessionId) {
        List<TraceDto> traces = traceService.getTracesByGitSessionId(gitSessionId);
        return ResponseEntity.ok(traces);
    }
    
    @GetMapping("/snapshot/{snapshotId}")
    public ResponseEntity<List<TraceDto>> getTracesBySnapshotId(@PathVariable String snapshotId) {
        List<TraceDto> traces = traceService.getTracesBySnapshotId(snapshotId);
        return ResponseEntity.ok(traces);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<TraceDto> updateTrace(
            @PathVariable String id,
            @Valid @RequestBody UpdateTraceRequest request) {
        TraceDto trace = traceService.updateTrace(id, request);
        return ResponseEntity.ok(trace);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteTrace(@PathVariable String id) {
        traceService.deleteTrace(id);
        ApiResponse response = new ApiResponse(true, "Trace deleted successfully");
        return ResponseEntity.ok(response);
    }
}

