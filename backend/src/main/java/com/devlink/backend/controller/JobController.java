package com.devlink.backend.controller;

import com.devlink.backend.dto.CreateJobRequest;
import com.devlink.backend.dto.JobDto;
import com.devlink.backend.dto.UpdateJobRequest;
import com.devlink.backend.service.JobService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService jobService;

    @Autowired
    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    /**
     * GET /api/jobs
     * Support search, sortBy, direction
     */
    @GetMapping
    public ResponseEntity<List<JobDto>> getJobs(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "sortBy", required = false, defaultValue = "createdAt") String sortBy,
            @RequestParam(value = "direction", required = false, defaultValue = "desc") String direction) {
        
        List<JobDto> result = jobService.searchJobs(search, sortBy, direction);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/jobs/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<JobDto> getJobById(@PathVariable UUID id) {
        return ResponseEntity.ok(jobService.getJobById(id));
    }

    /**
     * POST /api/jobs
     */
    @PostMapping
    public ResponseEntity<JobDto> createJob(@Valid @RequestBody CreateJobRequest request) {
        JobDto created = jobService.createJob(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    /**
     * PUT /api/jobs/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<JobDto> updateJob(@PathVariable UUID id, @Valid @RequestBody UpdateJobRequest request) {
        JobDto updated = jobService.updateJob(id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/jobs/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable UUID id) {
        jobService.deleteJob(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/jobs/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getJobStats() {
        return ResponseEntity.ok(jobService.getJobStatusStatistics());
    }
}
