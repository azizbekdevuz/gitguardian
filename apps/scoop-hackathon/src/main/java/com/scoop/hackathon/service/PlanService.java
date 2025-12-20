package com.scoop.hackathon.service;

import com.scoop.hackathon.dto.CreatePlanRequest;
import com.scoop.hackathon.dto.PlanDto;
import com.scoop.hackathon.dto.UpdatePlanRequest;

import java.util.List;

public interface PlanService {
    PlanDto createPlan(CreatePlanRequest request);
    PlanDto getPlanById(String id);
    List<PlanDto> getAllPlans();
    List<PlanDto> getPlansByGitSessionId(String gitSessionId);
    PlanDto updatePlan(String id, UpdatePlanRequest request);
    void deletePlan(String id);
}

