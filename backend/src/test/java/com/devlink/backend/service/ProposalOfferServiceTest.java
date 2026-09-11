package com.devlink.backend.service;

import com.devlink.backend.entity.Job;
import com.devlink.backend.entity.Proposal;
import com.devlink.backend.entity.ProposalOffer;
import com.devlink.backend.entity.User;
import com.devlink.backend.entity.enums.JobStatus;
import com.devlink.backend.entity.enums.ProposalOfferStatus;
import com.devlink.backend.entity.enums.ProposalStatus;
import com.devlink.backend.entity.enums.UserRole;
import com.devlink.backend.exception.BusinessRuleException;
import com.devlink.backend.repository.JobRepository;
import com.devlink.backend.repository.ProjectRepository;
import com.devlink.backend.repository.ProposalOfferRepository;
import com.devlink.backend.repository.ProposalRepository;
import com.devlink.backend.repository.UserRepository;
import com.devlink.backend.service.impl.ProposalOfferServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProposalOfferServiceTest {

    @Mock
    private ProposalOfferRepository proposalOfferRepository;

    @Mock
    private ProposalRepository proposalRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProposalOfferServiceImpl proposalOfferService;

    private User client;
    private User freelancer;
    private Job job;
    private Proposal proposal;
    private ProposalOffer pendingOffer;
    private UUID proposalId;
    private UUID offerId;

    @BeforeEach
    public void setup() {
        client = new User("client@test.com", "pass", "Client", UserRole.CLIENT);
        client.setId(UUID.randomUUID());

        freelancer = new User("free@test.com", "pass", "Free", UserRole.FREELANCER);
        freelancer.setId(UUID.randomUUID());

        job = new Job(client, "Job Title", "Desc", new BigDecimal("1000"), new java.sql.Date(System.currentTimeMillis()));
        job.setId(UUID.randomUUID());

        proposal = new Proposal(job, freelancer, new BigDecimal("1000"), 10, "Cover");
        proposalId = UUID.randomUUID();
        proposal.setId(proposalId);
        proposal.setStatus(ProposalStatus.PENDING);

        // Initial offer made by freelancer
        pendingOffer = new ProposalOffer(proposal, freelancer, new BigDecimal("1000"), 10, "Initial");
        offerId = UUID.randomUUID();
        pendingOffer.setId(offerId);
        pendingOffer.setStatus(ProposalOfferStatus.PENDING);
    }

    @Test
    public void acceptOffer_ByNonRecipient_ThrowsException() {
        when(proposalRepository.findById(proposalId)).thenReturn(Optional.of(proposal));
        when(proposalOfferRepository.findById(offerId)).thenReturn(Optional.of(pendingOffer));
        when(proposalOfferRepository.findTopByProposalIdOrderByCreatedAtDesc(proposalId))
                .thenReturn(Optional.of(pendingOffer));

        // Freelancer made the offer, so the recipient is Client.
        // If Freelancer tries to accept their own offer:
        assertThatThrownBy(() -> proposalOfferService.acceptOffer(proposalId, offerId, freelancer.getId()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Only the recipient of the offer can accept it");
    }

    @Test
    public void acceptOffer_AlreadyHasProject_ThrowsException() {
        when(proposalRepository.findById(proposalId)).thenReturn(Optional.of(proposal));
        when(proposalOfferRepository.findById(offerId)).thenReturn(Optional.of(pendingOffer));
        when(proposalOfferRepository.findTopByProposalIdOrderByCreatedAtDesc(proposalId))
                .thenReturn(Optional.of(pendingOffer));
        
        when(projectRepository.existsByProposalId(proposalId)).thenReturn(true);

        assertThatThrownBy(() -> proposalOfferService.acceptOffer(proposalId, offerId, client.getId()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("This proposal already has a project");
    }

    @Test
    public void acceptOffer_JobAlreadyInProgress_ThrowsException() {
        when(proposalRepository.findById(proposalId)).thenReturn(Optional.of(proposal));
        when(proposalOfferRepository.findById(offerId)).thenReturn(Optional.of(pendingOffer));
        when(proposalOfferRepository.findTopByProposalIdOrderByCreatedAtDesc(proposalId))
                .thenReturn(Optional.of(pendingOffer));
        
        when(projectRepository.existsByProposalId(proposalId)).thenReturn(false);
        
        job.setStatus(JobStatus.IN_PROGRESS);

        assertThatThrownBy(() -> proposalOfferService.acceptOffer(proposalId, offerId, client.getId()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Job is already IN_PROGRESS");
    }

    @Test
    public void acceptOffer_Success_SavesAllEntities() {
        when(proposalRepository.findById(proposalId)).thenReturn(Optional.of(proposal));
        when(proposalOfferRepository.findById(offerId)).thenReturn(Optional.of(pendingOffer));
        when(proposalOfferRepository.findTopByProposalIdOrderByCreatedAtDesc(proposalId))
                .thenReturn(Optional.of(pendingOffer));
        
        when(projectRepository.existsByProposalId(proposalId)).thenReturn(false);
        
        Proposal otherProposal = new Proposal(job, new User(), new BigDecimal("500"), 5, "Other");
        otherProposal.setId(UUID.randomUUID());
        when(proposalRepository.findByJobIdAndStatusIn(any(), any()))
                .thenReturn(List.of(proposal, otherProposal));

        proposalOfferService.acceptOffer(proposalId, offerId, client.getId());

        verify(proposalOfferRepository).save(argThat(o -> o.getStatus() == ProposalOfferStatus.ACCEPTED));
        verify(proposalRepository, times(2)).save(any()); // Save main proposal + reject other proposal
        verify(projectRepository).save(any());
        verify(jobRepository).save(argThat(j -> j.getStatus() == JobStatus.IN_PROGRESS));
    }
}
