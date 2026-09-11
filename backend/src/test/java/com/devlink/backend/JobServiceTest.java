package com.devlink.backend;

import com.devlink.backend.dto.CreateJobRequest;
import com.devlink.backend.dto.JobDto;
import com.devlink.backend.dto.UpdateJobRequest;
import com.devlink.backend.entity.Job;
import com.devlink.backend.entity.Proposal;
import com.devlink.backend.entity.User;
import com.devlink.backend.entity.enums.JobStatus;
import com.devlink.backend.entity.enums.ProposalStatus;
import com.devlink.backend.entity.enums.UserRole;
import com.devlink.backend.exception.BusinessRuleException;
import com.devlink.backend.exception.ResourceNotFoundException;
import com.devlink.backend.repository.JobRepository;
import com.devlink.backend.repository.ProposalRepository;
import com.devlink.backend.repository.UserRepository;
import com.devlink.backend.security.CustomUserDetails;
import com.devlink.backend.service.JobService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Date;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class JobServiceTest {

    @Autowired
    private JobService jobService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ProposalRepository proposalRepository;

    private User client;
    private User freelancer;
    private User otherClient;

    @Autowired
    private com.devlink.backend.repository.ReviewRepository reviewRepository;

    @BeforeEach
    public void setup() {
        reviewRepository.deleteAll();
        proposalRepository.deleteAll();
        jobRepository.deleteAll();
        userRepository.deleteAll();

        client = new User("Client", "client@test.com", "pass", UserRole.CLIENT);
        client = userRepository.save(client);
        
        otherClient = new User("Other", "other@test.com", "pass", UserRole.CLIENT);
        otherClient = userRepository.save(otherClient);

        freelancer = new User("Freelancer", "freelancer@test.com", "pass", UserRole.FREELANCER);
        freelancer = userRepository.save(freelancer);
        
        // Mock authentication context for 'client' by default
        authenticateAs(client);
    }
    
    private void authenticateAs(User user) {
        CustomUserDetails userDetails = new CustomUserDetails(user);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    public void testCreateJob_Valid() {
        CreateJobRequest req = new CreateJobRequest();
        req.setTitle("New Job");
        req.setDescription("Desc");
        req.setBudget(new BigDecimal("1000"));
        req.setDeadline(Date.valueOf("2026-10-10"));

        JobDto created = jobService.createJob(req);
        assertThat(created.getId()).isNotNull();
        assertThat(created.getTitle()).isEqualTo("New Job");
        assertThat(created.getStatus()).isEqualTo(JobStatus.OPEN.name());
    }

    @Test
    public void testCreateJob_NotClient() {
        authenticateAs(freelancer); // FREELANCER trying to create job
        
        CreateJobRequest req = new CreateJobRequest();
        req.setTitle("New Job");
        req.setDescription("Desc");
        req.setBudget(new BigDecimal("1000"));
        req.setDeadline(Date.valueOf("2026-10-10"));

        assertThatThrownBy(() -> jobService.createJob(req))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    public void testGetJob_Valid() {
        Job job = createTestJob("Test Job");
        JobDto found = jobService.getJobById(job.getId());
        assertThat(found.getTitle()).isEqualTo("Test Job");
    }

    @Test
    public void testGetJob_NotFound() {
        assertThatThrownBy(() -> jobService.getJobById(UUID.randomUUID()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    public void testUpdateJob_Valid() {
        Job job = createTestJob("Old Title");

        UpdateJobRequest updateReq = new UpdateJobRequest();
        updateReq.setTitle("New Title");
        updateReq.setDescription("New Desc");
        updateReq.setBudget(new BigDecimal("2000"));
        updateReq.setDeadline(Date.valueOf("2026-12-12"));

        JobDto updated = jobService.updateJob(job.getId(), updateReq);
        assertThat(updated.getTitle()).isEqualTo("New Title");
        assertThat(updated.getBudget()).isEqualByComparingTo("2000");
    }
    
    @Test
    public void testUpdateJob_NotOwner() {
        Job job = createTestJob("Old Title");
        
        authenticateAs(otherClient); // Switching to another client

        UpdateJobRequest updateReq = new UpdateJobRequest();
        updateReq.setTitle("New Title");
        updateReq.setDescription("New Desc");
        updateReq.setBudget(new BigDecimal("2000"));
        updateReq.setDeadline(Date.valueOf("2026-12-12"));

        assertThatThrownBy(() -> jobService.updateJob(job.getId(), updateReq))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    public void testUpdateJob_NotOpen() {
        Job job = createTestJob("Test Job");
        job.setStatus(JobStatus.IN_PROGRESS);
        jobRepository.save(job);

        UpdateJobRequest updateReq = new UpdateJobRequest();
        updateReq.setTitle("New Title");
        updateReq.setDescription("New Desc");
        updateReq.setBudget(new BigDecimal("2000"));
        updateReq.setDeadline(Date.valueOf("2026-12-12"));

        assertThatThrownBy(() -> jobService.updateJob(job.getId(), updateReq))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Only OPEN jobs can be updated");
    }

    @Test
    public void testDeleteJob_Valid() {
        Job job = createTestJob("To be deleted");
        jobService.deleteJob(job.getId());
        assertThatThrownBy(() -> jobService.getJobById(job.getId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }
    
    @Test
    public void testDeleteJob_NotOwner() {
        Job job = createTestJob("To be deleted");
        
        authenticateAs(otherClient);

        assertThatThrownBy(() -> jobService.deleteJob(job.getId()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    public void testDeleteJob_WithPendingProposal() {
        Job job = createTestJob("Has Proposals");
        
        Proposal proposal = new Proposal(job, freelancer, new BigDecimal("500"), 10, "Hi");
        proposal.setStatus(ProposalStatus.PENDING);
        proposalRepository.save(proposal);

        assertThatThrownBy(() -> jobService.deleteJob(job.getId()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("active proposals");
    }

    @Test
    public void testSearchAndSort() {
        Job job1 = createTestJob("React App");
        job1.setBudget(new BigDecimal("5000"));
        jobRepository.save(job1);

        Job job2 = createTestJob("Vue App");
        job2.setBudget(new BigDecimal("3000"));
        jobRepository.save(job2);

        // Search Case Insensitive
        List<JobDto> search1 = jobService.searchJobs("rEaCt", "createdAt", "desc");
        assertThat(search1).hasSize(1);
        assertThat(search1.get(0).getTitle()).isEqualTo("React App");

        // Sort Budget DESC
        List<JobDto> sortDesc = jobService.searchJobs("", "budget", "desc");
        assertThat(sortDesc.get(0).getTitle()).isEqualTo("React App");

        // Sort Budget ASC
        List<JobDto> sortAsc = jobService.searchJobs("", "budget", "asc");
        assertThat(sortAsc.get(0).getTitle()).isEqualTo("Vue App");

        // Invalid Sort Fallback
        List<JobDto> invalidSort = jobService.searchJobs("", "invalidField", "asc");
        // Should fallback to createdAt ASC, which would be job1 then job2
        assertThat(invalidSort).isNotEmpty();
    }

    private Job createTestJob(String title) {
        Job job = new Job(client, title, "Desc", new BigDecimal("1000"), Date.valueOf("2026-10-10"));
        job.setStatus(JobStatus.OPEN);
        return jobRepository.save(job);
    }
}
