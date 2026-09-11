package com.devlink.backend.service.impl;

import com.devlink.backend.dto.ProjectDto;
import com.devlink.backend.dto.UpdateProjectStatusRequest;
import com.devlink.backend.entity.Job;
import com.devlink.backend.entity.Project;
import com.devlink.backend.entity.enums.JobStatus;
import com.devlink.backend.entity.enums.ProjectStatus;
import com.devlink.backend.exception.BusinessRuleException;
import com.devlink.backend.exception.ResourceNotFoundException;
import com.devlink.backend.repository.JobRepository;
import com.devlink.backend.repository.ProjectRepository;
import com.devlink.backend.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProjectServiceImpl implements ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private JobRepository jobRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ProjectDto> getProjectsByUserId(UUID userId) {
        return projectRepository.findByParticipantId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectDto getProjectById(UUID projectId, UUID userId) {
        Project project = getProjectAndVerifyParticipant(projectId, userId);
        return mapToDto(project);
    }

    @Override
    @Transactional
    public ProjectDto updateProjectStatus(UUID projectId, UpdateProjectStatusRequest request, UUID userId) {
        Project project = getProjectAndVerifyParticipant(projectId, userId);
        
        ProjectStatus currentStatus = project.getStatus();
        ProjectStatus targetStatus;
        try {
            targetStatus = ProjectStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleException("Invalid project status: " + request.getStatus());
        }

        UUID clientId = project.getProposal().getJob().getClient().getId();
        UUID freelancerId = project.getProposal().getFreelancer().getId();
        
        boolean isClient = userId.equals(clientId);
        boolean isFreelancer = userId.equals(freelancerId);

        // Validation Matrix
        if (currentStatus == ProjectStatus.IN_PROGRESS && targetStatus == ProjectStatus.SUBMITTED) {
            if (!isFreelancer) throw new org.springframework.security.access.AccessDeniedException("Only freelancer can submit project");
        } else if (currentStatus == ProjectStatus.REVISION && targetStatus == ProjectStatus.SUBMITTED) {
            if (!isFreelancer) throw new org.springframework.security.access.AccessDeniedException("Only freelancer can resubmit project");
        } else if (currentStatus == ProjectStatus.SUBMITTED && targetStatus == ProjectStatus.REVISION) {
            if (!isClient) throw new org.springframework.security.access.AccessDeniedException("Only client can request revision");
            // Revision reason is mandatory and must carry real content
            String revisionMessage = request.getMessage() == null ? null : request.getMessage().trim();
            if (revisionMessage == null || revisionMessage.isEmpty()) {
                throw new BusinessRuleException("Revision message is required when requesting a revision.");
            }
            project.setRevisionMessage(revisionMessage);
        } else if (currentStatus == ProjectStatus.SUBMITTED && targetStatus == ProjectStatus.COMPLETED) {
            if (!isClient) throw new org.springframework.security.access.AccessDeniedException("Only client can complete project");
            
            // Completion Logic
            project.setCompletedAt(new Timestamp(System.currentTimeMillis()));
            
            Job job = project.getProposal().getJob();
            job.setStatus(JobStatus.CLOSED);
            jobRepository.save(job);
        } else {
            throw new BusinessRuleException("Invalid status transition from " + currentStatus + " to " + targetStatus);
        }

        project.setStatus(targetStatus);
        Project savedProject = projectRepository.save(project);
        
        return mapToDto(savedProject);
    }

    private Project getProjectAndVerifyParticipant(UUID projectId, UUID userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        
        UUID clientId = project.getProposal().getJob().getClient().getId();
        UUID freelancerId = project.getProposal().getFreelancer().getId();
        
        if (!userId.equals(clientId) && !userId.equals(freelancerId)) {
            throw new org.springframework.security.access.AccessDeniedException("You do not have permission to access this project");
        }
        
        return project;
    }

    private ProjectDto mapToDto(Project project) {
        ProjectDto dto = new ProjectDto();
        dto.setId(project.getId());
        dto.setProposalId(project.getProposal().getId());
        dto.setJobId(project.getProposal().getJob().getId());
        dto.setJobTitle(project.getProposal().getJob().getTitle());
        dto.setClientId(project.getProposal().getJob().getClient().getId());
        dto.setClientName(project.getProposal().getJob().getClient().getName());
        dto.setFreelancerId(project.getProposal().getFreelancer().getId());
        dto.setFreelancerName(project.getProposal().getFreelancer().getName());
        dto.setAgreedPrice(project.getAgreedPrice());
        dto.setAgreedDurationDays(project.getAgreedDurationDays());
        dto.setTitle(project.getTitle());
        dto.setRevisionMessage(project.getRevisionMessage());
        dto.setDeadline(project.getDeadline());
        dto.setStatus(project.getStatus().name());
        dto.setStartedAt(project.getStartedAt());
        dto.setCompletedAt(project.getCompletedAt());
        dto.setCreatedAt(project.getCreatedAt());
        dto.setUpdatedAt(project.getUpdatedAt());
        return dto;
    }
}
