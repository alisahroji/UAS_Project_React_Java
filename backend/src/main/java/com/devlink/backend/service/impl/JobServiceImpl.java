package com.devlink.backend.service.impl;

import com.devlink.backend.dto.CreateJobRequest;
import com.devlink.backend.dto.JobDto;
import com.devlink.backend.dto.UpdateJobRequest;
import com.devlink.backend.entity.Job;
import com.devlink.backend.entity.User;
import com.devlink.backend.entity.enums.JobStatus;
import com.devlink.backend.entity.enums.ProposalStatus;
import com.devlink.backend.exception.BusinessRuleException;
import com.devlink.backend.exception.ResourceNotFoundException;
import com.devlink.backend.repository.JobRepository;
import com.devlink.backend.repository.UserRepository;
import com.devlink.backend.repository.ProposalRepository;
import com.devlink.backend.service.JobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class JobServiceImpl implements JobService {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final ProposalRepository proposalRepository;

    @Autowired
    public JobServiceImpl(JobRepository jobRepository, UserRepository userRepository, ProposalRepository proposalRepository) {
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.proposalRepository = proposalRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobDto> searchJobs() {
        return mapToDtoList(jobRepository.findAll());
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobDto> searchJobs(String keyword) {
        return searchJobs(keyword, "createdAt", "desc");
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobDto> searchJobs(String keyword, String sortBy, String direction) {
        Sort sort = getValidSort(sortBy, direction);
        
        List<Job> jobs;
        if (keyword == null || keyword.trim().isEmpty()) {
            jobs = jobRepository.findAll(sort);
        } else {
            jobs = jobRepository.searchJobs(keyword.toLowerCase(), sort);
        }
        
        return mapToDtoList(jobs);
    }

    @Override
    @Transactional(readOnly = true)
    public JobDto getJobById(UUID id) {
        Job job = getJobOrThrow(id);
        return convertToDto(job);
    }

    @Override
    @Transactional
    public JobDto createJob(CreateJobRequest request) {
        User client = getCurrentAuthenticatedUser();
        
        if (client.getRole() != com.devlink.backend.entity.enums.UserRole.CLIENT) {
            throw new org.springframework.security.access.AccessDeniedException("Only CLIENT can create jobs.");
        }
        
        Job job = new Job(
                client,
                request.getTitle(),
                request.getDescription(),
                request.getBudget(),
                request.getDeadline()
        );
        job.setStatus(JobStatus.OPEN);
        if (request.getRequiredSkills() != null) {
            job.setRequiredSkills(request.getRequiredSkills());
        }
        
        Job savedJob = jobRepository.save(job);
        return convertToDto(savedJob);
    }

    @Override
    @Transactional
    public JobDto updateJob(UUID id, UpdateJobRequest request) {
        Job job = getJobOrThrow(id);
        verifyJobOwnership(job);
        
        if (job.getStatus() != JobStatus.OPEN) {
            throw new BusinessRuleException("Only OPEN jobs can be updated. Current status: " + job.getStatus());
        }

        job.setTitle(request.getTitle());
        job.setDescription(request.getDescription());
        job.setBudget(request.getBudget());
        job.setDeadline(request.getDeadline());
        
        if (request.getRequiredSkills() != null) {
            job.setRequiredSkills(request.getRequiredSkills());
        }
        
        Job updatedJob = jobRepository.save(job);
        return convertToDto(updatedJob);
    }

    @Override
    @Transactional
    public void deleteJob(UUID id) {
        Job job = getJobOrThrow(id);
        verifyJobOwnership(job);
        
        if (job.getStatus() != JobStatus.OPEN) {
            throw new BusinessRuleException("Only OPEN jobs can be deleted. Current status: " + job.getStatus());
        }

        List<ProposalStatus> activeStatuses = Arrays.asList(ProposalStatus.PENDING, ProposalStatus.NEGOTIATING);
        boolean hasActiveProposals = proposalRepository.existsByJobAndStatusIn(job, activeStatuses);
        
        if (hasActiveProposals) {
            throw new BusinessRuleException("Cannot delete Job. It has active proposals (PENDING or NEGOTIATING).");
        }
        
        jobRepository.delete(job);
    }

    private User getCurrentAuthenticatedUser() {
        org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new ResourceNotFoundException("No authenticated user found");
        }

        com.devlink.backend.security.CustomUserDetails userDetails = (com.devlink.backend.security.CustomUserDetails) authentication.getPrincipal();
        return userDetails.getUser();
    }

    private void verifyJobOwnership(Job job) {
        User currentUser = getCurrentAuthenticatedUser();
        if (!job.getClient().getId().equals(currentUser.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You do not have permission to modify this job.");
        }
    }

    @Override
    public Map<String, Long> getJobStatusStatistics() {
        List<Job> allJobs = jobRepository.findAll();
        Map<String, Long> stats = new HashMap<>();

        for (int i = 0; i < allJobs.size(); i++) {
            Job job = allJobs.get(i);
            String status = job.getStatus().name();
            
            if (stats.containsKey(status)) {
                stats.put(status, stats.get(status) + 1L);
            } else {
                stats.put(status, 1L);
            }
        }
        return stats;
    }

    private Job getJobOrThrow(UUID id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found with id: " + id));
    }

    private Sort getValidSort(String sortBy, String direction) {
        String validSortBy = "createdAt";
        if ("budget".equalsIgnoreCase(sortBy) || "deadline".equalsIgnoreCase(sortBy) || "createdAt".equalsIgnoreCase(sortBy)) {
            validSortBy = sortBy;
        }

        Sort.Direction sortDirection = Sort.Direction.DESC;
        if ("asc".equalsIgnoreCase(direction)) {
            sortDirection = Sort.Direction.ASC;
        }

        return Sort.by(sortDirection, validSortBy);
    }

    private List<JobDto> mapToDtoList(List<Job> jobs) {
        List<JobDto> dtos = new ArrayList<>();
        for (Job job : jobs) {
            dtos.add(convertToDto(job));
        }
        return dtos;
    }

    private JobDto convertToDto(Job job) {
        return new JobDto(
            job.getId(),
            job.getTitle(),
            job.getDescription(),
            job.getBudget(),
            job.getStatus().name(),
            job.getRequiredSkills() != null ? new ArrayList<>(job.getRequiredSkills()) : new ArrayList<>(),
            job.getDeadline(),
            job.getCreatedAt(),
            job.getClient() != null ? job.getClient().getName() : null,
            job.getClient() != null ? job.getClient().getId() : null
        );
    }
}
