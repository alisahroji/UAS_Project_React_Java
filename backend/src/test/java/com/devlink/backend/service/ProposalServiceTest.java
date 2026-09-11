package com.devlink.backend.service;

import com.devlink.backend.dto.ProposalRequest;
import com.devlink.backend.entity.Job;
import com.devlink.backend.entity.Proposal;
import com.devlink.backend.entity.User;
import com.devlink.backend.entity.enums.JobStatus;
import com.devlink.backend.entity.enums.ProposalStatus;
import com.devlink.backend.entity.enums.UserRole;
import com.devlink.backend.exception.BusinessRuleException;
import com.devlink.backend.repository.JobRepository;
import com.devlink.backend.repository.ProposalOfferRepository;
import com.devlink.backend.repository.ProposalRepository;
import com.devlink.backend.repository.UserRepository;
import com.devlink.backend.service.impl.ProposalServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProposalServiceTest {

    @Mock
    private ProposalRepository proposalRepository;

    @Mock
    private ProposalOfferRepository proposalOfferRepository;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProposalServiceImpl proposalService;

    private User client;
    private User freelancer;
    private Job job;
    private UUID jobId;
    private UUID freelancerId;

    @BeforeEach
    public void setup() {
        client = new User("client@test.com", "pass", "Client", UserRole.CLIENT);
        client.setId(UUID.randomUUID());

        freelancer = new User("free@test.com", "pass", "Free", UserRole.FREELANCER);
        freelancerId = UUID.randomUUID();
        freelancer.setId(freelancerId);

        job = new Job(client, "Job Title", "Desc", new BigDecimal("1000"), new java.sql.Date(System.currentTimeMillis()));
        jobId = UUID.randomUUID();
        job.setId(jobId);
    }

    @Test
    public void createProposal_ClientRole_ThrowsException() {
        User clientUser = new User("c@test.com", "pass", "C", UserRole.CLIENT);
        UUID cId = UUID.randomUUID();
        when(userRepository.findById(cId)).thenReturn(Optional.of(clientUser));

        ProposalRequest request = new ProposalRequest(new BigDecimal("100"), 10, "Cover");

        assertThatThrownBy(() -> proposalService.createProposal(jobId, request, cId))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Only freelancers can create proposals");
    }

    @Test
    public void createProposal_JobNotInProgress_ThrowsException() {
        when(userRepository.findById(freelancerId)).thenReturn(Optional.of(freelancer));
        
        job.setStatus(JobStatus.IN_PROGRESS);
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

        ProposalRequest request = new ProposalRequest(new BigDecimal("100"), 10, "Cover");

        assertThatThrownBy(() -> proposalService.createProposal(jobId, request, freelancerId))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Can only propose to OPEN jobs");
    }

    @Test
    public void createProposal_DuplicateActiveProposal_ThrowsException() {
        when(userRepository.findById(freelancerId)).thenReturn(Optional.of(freelancer));
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
        
        when(proposalRepository.existsByJobIdAndFreelancerIdAndStatusIn(any(), any(), any()))
                .thenReturn(true);

        ProposalRequest request = new ProposalRequest(new BigDecimal("100"), 10, "Cover");

        assertThatThrownBy(() -> proposalService.createProposal(jobId, request, freelancerId))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Freelancer already has an active proposal");
    }

    @Test
    public void withdrawProposal_NotOwner_ThrowsException() {
        Proposal proposal = new Proposal(job, freelancer, new BigDecimal("100"), 10, "Cover");
        proposal.setId(UUID.randomUUID());
        
        when(proposalRepository.findById(proposal.getId())).thenReturn(Optional.of(proposal));

        UUID otherFreelancerId = UUID.randomUUID();

        assertThatThrownBy(() -> proposalService.withdrawProposal(proposal.getId(), otherFreelancerId))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Only the freelancer owner can withdraw");
    }

    @Test
    public void withdrawProposal_Accepted_ThrowsException() {
        Proposal proposal = new Proposal(job, freelancer, new BigDecimal("100"), 10, "Cover");
        proposal.setId(UUID.randomUUID());
        proposal.setStatus(ProposalStatus.ACCEPTED);
        
        when(proposalRepository.findById(proposal.getId())).thenReturn(Optional.of(proposal));

        assertThatThrownBy(() -> proposalService.withdrawProposal(proposal.getId(), freelancerId))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Cannot withdraw proposal with status: ACCEPTED");
    }
}
