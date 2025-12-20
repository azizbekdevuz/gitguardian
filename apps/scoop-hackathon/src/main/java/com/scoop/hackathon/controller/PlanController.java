package com.scoop.hackathon.controller;

import com.scoop.hackathon.dto.CreatePlanRequest;
import com.scoop.hackathon.dto.PlanDto;
import com.scoop.hackathon.dto.UpdatePlanRequest;
import com.scoop.hackathon.payload.ApiResponse;
import com.scoop.hackathon.service.PlanService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/plans")
public class PlanController {
    
    private final PlanService planService;

    public PlanController(PlanService planService) {
        this.planService = planService;
    }
    
    @PostMapping
    public ResponseEntity<PlanDto> createPlan(@Valid @RequestBody CreatePlanRequest request) {
        PlanDto plan = planService.createPlan(request);
        return new ResponseEntity<>(plan, HttpStatus.CREATED);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<PlanDto> getPlanById(@PathVariable String id) {
        PlanDto plan = planService.getPlanById(id);
        return ResponseEntity.ok(plan);
    }
    
    @GetMapping
    public ResponseEntity<List<PlanDto>> getAllPlans() {
        List<PlanDto> plans = planService.getAllPlans();
        return ResponseEntity.ok(plans);
    }
    
    @GetMapping("/git-session/{gitSessionId}")
    public ResponseEntity<List<PlanDto>> getPlansByGitSessionId(@PathVariable String gitSessionId) {
        List<PlanDto> plans = planService.getPlansByGitSessionId(gitSessionId);
        return ResponseEntity.ok(plans);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<PlanDto> updatePlan(
            @PathVariable String id,
            @Valid @RequestBody UpdatePlanRequest request) {
        PlanDto plan = planService.updatePlan(id, request);
        return ResponseEntity.ok(plan);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deletePlan(@PathVariable String id) {
        planService.deletePlan(id);
        ApiResponse response = new ApiResponse(true, "Plan deleted successfully");
        return ResponseEntity.ok(response);
    }
}

