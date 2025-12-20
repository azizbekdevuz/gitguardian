package com.scoop.hackathon.service;

import com.scoop.hackathon.dto.CreateSnapshotRequest;
import com.scoop.hackathon.dto.SnapshotDto;
import com.scoop.hackathon.dto.UpdateSnapshotRequest;

import java.util.List;

public interface SnapshotService {
    SnapshotDto createSnapshot(CreateSnapshotRequest request);
    SnapshotDto getSnapshotById(String id);
    List<SnapshotDto> getAllSnapshots();
    List<SnapshotDto> getSnapshotsByGitSessionId(String gitSessionId);
    SnapshotDto updateSnapshot(String id, UpdateSnapshotRequest request);
    void deleteSnapshot(String id);
}

