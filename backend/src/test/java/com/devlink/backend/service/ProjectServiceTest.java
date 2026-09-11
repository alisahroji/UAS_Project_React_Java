package com.devlink.backend.service;

import com.devlink.backend.dto.ProjectDto;
import com.devlink.backend.dto.UpdateProjectStatusRequest;
import com.devlink.backend.entity.Job;
import com.devlink.backend.entity.Project;
import com.devlink.backend.entity.Proposal;
import com.devlink.backend.entity.User;
import com.devlink.backend.entity.enums.JobStatus;
import com.devlink.backend.entity.enums.ProjectStatus;
import com.devlink.backend.entity.enums.UserRole;
import com.devlink.backend.exception.BusinessRuleException;
import com.devlink.backend.repository.JobRepository;
import com.devlink.backend.repository.ProjectRepository;
import com.devlink.backend.service.impl.ProjectServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private JobRepository jobRepository;

    @InjectMocks
    private ProjectServiceImpl projectService;

    private User client;
    private User freelancer;
    private Job job;
    private Proposal proposal;
    private Project project;
    private UUID projectId;

    @BeforeEach
    public void setup() {
        client = new User("client@test.com", "pass", "Client", UserRole.CLIENT);
        client.setId(UUID.randomUUID());

        freelancer = new User("free@test.com", "pass", "Free", UserRole.FREELANCER);
        freelancer.setId(UUID.randomUUID());

        job = new Job(client, "Job Title", "Desc", new BigDecimal("1000"), new java.sql.Date(System.currentTimeMillis()));
        job.setId(UUID.randomUUID());
        job.setStatus(JobStatus.IN_PROGRESS);

        proposal = new Proposal(job, freelancer, new BigDecimal("1000"), 10, "Cover");
        proposal.setId(UUID.randomUUID());

        project = new Project(proposal, new BigDecimal("1000"), 10, "Title", new Timestamp(System.currentTimeMillis() + 1000000));
        projectId = UUID.randomUUID();
        project.setId(projectId);
        project.setStatus(ProjectStatus.IN_PROGRESS);
    }

    @Test
    public void getProject_NotParticipant_ThrowsException() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        
        assertThatThrownBy(() -> projectService.getProjectById(projectId, UUID.randomUUID()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    public void submitProject_ByClient_ThrowsException() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        
        UpdateProjectStatusRequest req = new UpdateProjectStatusRequest();
        req.setStatus("SUBMITTED");

        assertThatThrownBy(() -> projectService.updateProjectStatus(projectId, req, client.getId()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only freelancer can submit");
    }

    @Test
    public void submitProject_ByFreelancer_Success() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(projectRepository.save(any(Project.class))).thenAnswer(i -> i.getArguments()[0]);
        
        UpdateProjectStatusRequest req = new UpdateProjectStatusRequest();
        req.setStatus("SUBMITTED");

        ProjectDto dto = projectService.updateProjectStatus(projectId, req, freelancer.getId());
        
        assertThat(dto.getStatus()).isEqualTo("SUBMITTED");
        verify(projectRepository).save(project);
    }

    @Test
    public void requestRevision_ByFreelancer_ThrowsException() {
        project.setStatus(ProjectStatus.SUBMITTED);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        
        UpdateProjectStatusRequest req = new UpdateProjectStatusRequest();
        req.setStatus("REVISION");

        assertThatThrownBy(() -> projectService.updateProjectStatus(projectId, req, freelancer.getId()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only client can request revision");
    }

    @Test
    public void completeProject_ByFreelancer_ThrowsException() {
        project.setStatus(ProjectStatus.SUBMITTED);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        
        UpdateProjectStatusRequest req = new UpdateProjectStatusRequest();
        req.setStatus("COMPLETED");

        assertThatThrownBy(() -> projectService.updateProjectStatus(projectId, req, freelancer.getId()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only client can complete");
    }

    @Test
    public void completeProject_ByClient_Success_UpdatesJobAndCompletedAt() {
        project.setStatus(ProjectStatus.SUBMITTED);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(projectRepository.save(any(Project.class))).thenAnswer(i -> i.getArguments()[0]);
        
        UpdateProjectStatusRequest req = new UpdateProjectStatusRequest();
        req.setStatus("COMPLETED");

        ProjectDto dto = projectService.updateProjectStatus(projectId, req, client.getId());
        
        assertThat(dto.getStatus()).isEqualTo("COMPLETED");
        assertThat(dto.getCompletedAt()).isNotNull();
        assertThat(job.getStatus()).isEqualTo(JobStatus.CLOSED);
        
        verify(jobRepository).save(job);
        verify(projectRepository).save(project);
    }

    @Test
    public void invalidTransition_InProgressToCompleted_ThrowsException() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        
        UpdateProjectStatusRequest req = new UpdateProjectStatusRequest();
        req.setStatus("COMPLETED");

        assertThatThrownBy(() -> projectService.updateProjectStatus(projectId, req, client.getId()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Invalid status transition");
    }
}
