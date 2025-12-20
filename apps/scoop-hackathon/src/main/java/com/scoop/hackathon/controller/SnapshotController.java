package com.scoop.hackathon.controller;

import com.scoop.hackathon.dto.CreateSnapshotRequest;
import com.scoop.hackathon.dto.SnapshotDto;
import com.scoop.hackathon.dto.UpdateSnapshotRequest;
import com.scoop.hackathon.payload.ApiResponse;
import com.scoop.hackathon.service.SnapshotService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/snapshots")
public class SnapshotController {
    
    private final SnapshotService snapshotService;

    public SnapshotController(SnapshotService snapshotService) {
        this.snapshotService = snapshotService;
    }
    
    @PostMapping
    public ResponseEntity<SnapshotDto> createSnapshot(@Valid @RequestBody CreateSnapshotRequest request) {
        SnapshotDto snapshot = snapshotService.createSnapshot(request);
        return new ResponseEntity<>(snapshot, HttpStatus.CREATED);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SnapshotDto> getSnapshotById(@PathVariable String id) {
        SnapshotDto snapshot = snapshotService.getSnapshotById(id);
        return ResponseEntity.ok(snapshot);
    }
    
    @GetMapping
    public ResponseEntity<List<SnapshotDto>> getAllSnapshots() {
        List<SnapshotDto> snapshots = snapshotService.getAllSnapshots();
        return ResponseEntity.ok(snapshots);
    }
    
    @GetMapping("/git-session/{gitSessionId}")
    public ResponseEntity<List<SnapshotDto>> getSnapshotsByGitSessionId(@PathVariable String gitSessionId) {
        List<SnapshotDto> snapshots = snapshotService.getSnapshotsByGitSessionId(gitSessionId);
        return ResponseEntity.ok(snapshots);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<SnapshotDto> updateSnapshot(
            @PathVariable String id,
            @Valid @RequestBody UpdateSnapshotRequest request) {
        SnapshotDto snapshot = snapshotService.updateSnapshot(id, request);
        return ResponseEntity.ok(snapshot);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteSnapshot(@PathVariable String id) {
        snapshotService.deleteSnapshot(id);
        ApiResponse response = new ApiResponse(true, "Snapshot deleted successfully");
        return ResponseEntity.ok(response);
    }
}

