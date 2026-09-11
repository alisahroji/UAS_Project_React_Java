package com.devlink.backend.controller;

import com.devlink.backend.dto.ProjectDto;
import com.devlink.backend.dto.UpdateProjectStatusRequest;
import com.devlink.backend.security.CustomUserDetails;
import com.devlink.backend.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @GetMapping
    public ResponseEntity<List<ProjectDto>> getMyProjects(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<ProjectDto> projects = projectService.getProjectsByUserId(userDetails.getUser().getId());
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDto> getProjectById(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ProjectDto project = projectService.getProjectById(id, userDetails.getUser().getId());
        return ResponseEntity.ok(project);
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<ProjectDto> updateProjectStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProjectStatusRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ProjectDto project = projectService.updateProjectStatus(id, request, userDetails.getUser().getId());
        return ResponseEntity.ok(project);
    }
}
