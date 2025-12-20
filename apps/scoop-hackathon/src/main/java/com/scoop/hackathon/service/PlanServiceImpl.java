package com.scoop.hackathon.service;

import com.scoop.hackathon.dto.CreatePlanRequest;
import com.scoop.hackathon.dto.PlanDto;
import com.scoop.hackathon.dto.UpdatePlanRequest;
import com.scoop.hackathon.entity.GitSession;
import com.scoop.hackathon.entity.Plan;
import com.scoop.hackathon.exception.ResourceNotFoundException;
import com.scoop.hackathon.repository.GitSessionRepository;
import com.scoop.hackathon.repository.PlanRepository;
import com.scoop.hackathon.util.CuidGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PlanServiceImpl implements PlanService {
    
    private final PlanRepository planRepository;
    private final GitSessionRepository gitSessionRepository;
    
    public PlanServiceImpl(PlanRepository planRepository, GitSessionRepository gitSessionRepository) {
        this.planRepository = planRepository;
        this.gitSessionRepository = gitSessionRepository;
    }
    
    @Override
    public PlanDto createPlan(CreatePlanRequest request) {
        GitSession gitSession = gitSessionRepository.findById(request.getGitSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("GitSession", "id", request.getGitSessionId()));
        
        Plan plan = new Plan();
        plan.setId(CuidGenerator.generate());
        plan.setGitSession(gitSession);
        plan.setPlanJson(request.getPlanJson());
        plan.setIssueType(request.getIssueType());
        plan.setRisk(request.getRisk());
        plan.setDangerousAllowed(request.getDangerousAllowed() != null ? request.getDangerousAllowed() : false);
        
        Plan savedPlan = planRepository.save(plan);
        return convertToDto(savedPlan);
    }
    
    @Override
    @Transactional(readOnly = true)
    public PlanDto getPlanById(String id) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan", "id", id));
        return convertToDto(plan);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PlanDto> getAllPlans() {
        return planRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PlanDto> getPlansByGitSessionId(String gitSessionId) {
        return planRepository.findByGitSessionIdOrderByCreatedAtDesc(gitSessionId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    public PlanDto updatePlan(String id, UpdatePlanRequest request) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan", "id", id));
        
        if (request.getIssueType() != null) plan.setIssueType(request.getIssueType());
        if (request.getRisk() != null) plan.setRisk(request.getRisk());
        if (request.getPlanJson() != null) plan.setPlanJson(request.getPlanJson());
        if (request.getDangerousAllowed() != null) plan.setDangerousAllowed(request.getDangerousAllowed());
        if (request.getGitSessionId() != null) {
            GitSession gitSession = gitSessionRepository.findById(request.getGitSessionId())
                    .orElseThrow(() -> new ResourceNotFoundException("GitSession", "id", request.getGitSessionId()));
            plan.setGitSession(gitSession);
        }
        
        Plan updatedPlan = planRepository.save(plan);
        return convertToDto(updatedPlan);
    }
    
    @Override
    public void deletePlan(String id) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan", "id", id));
        planRepository.delete(plan);
    }
    
    private PlanDto convertToDto(Plan plan) {
        PlanDto dto = new PlanDto();
        dto.setId(plan.getId());
        dto.setCreatedAt(plan.getCreatedAt());
        dto.setGitSessionId(plan.getGitSession() != null ? plan.getGitSession().getId() : null);
        dto.setIssueType(plan.getIssueType());
        dto.setRisk(plan.getRisk());
        dto.setPlanJson(plan.getPlanJson());
        dto.setDangerousAllowed(plan.getDangerousAllowed());
        return dto;
    }
}

