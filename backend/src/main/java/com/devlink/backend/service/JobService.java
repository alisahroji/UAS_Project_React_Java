package com.devlink.backend.service;

import com.devlink.backend.dto.CreateJobRequest;
import com.devlink.backend.dto.JobDto;
import com.devlink.backend.dto.UpdateJobRequest;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface JobService {

    List<JobDto> searchJobs();
    List<JobDto> searchJobs(String keyword);
    Map<String, Long> getJobStatusStatistics();

    // New REST CRUD operations
    List<JobDto> searchJobs(String keyword, String sortBy, String direction);
    JobDto getJobById(UUID id);
    JobDto createJob(CreateJobRequest request);
    JobDto updateJob(UUID id, UpdateJobRequest request);
    void deleteJob(UUID id);
}
