package com.devlink.backend.service;

import com.devlink.backend.dto.ProjectDto;
import com.devlink.backend.dto.UpdateProjectStatusRequest;

import java.util.List;
import java.util.UUID;

public interface ProjectService {
    List<ProjectDto> getProjectsByUserId(UUID userId);
    ProjectDto getProjectById(UUID projectId, UUID userId);
    ProjectDto updateProjectStatus(UUID projectId, UpdateProjectStatusRequest request, UUID userId);
}
