package com.devlink.backend.service.impl;

import com.devlink.backend.dto.ProposalOfferRequest;
import com.devlink.backend.dto.ProposalOfferResponse;
import com.devlink.backend.entity.Job;
import com.devlink.backend.entity.Project;
import com.devlink.backend.entity.Proposal;
import com.devlink.backend.entity.ProposalOffer;
import com.devlink.backend.entity.User;
import com.devlink.backend.entity.enums.JobStatus;
import com.devlink.backend.entity.enums.ProjectStatus;
import com.devlink.backend.entity.enums.ProposalOfferStatus;
import com.devlink.backend.entity.enums.ProposalStatus;
import com.devlink.backend.exception.BusinessRuleException;
import com.devlink.backend.exception.ResourceNotFoundException;
import com.devlink.backend.repository.JobRepository;
import com.devlink.backend.repository.ProjectRepository;
import com.devlink.backend.repository.ProposalOfferRepository;
import com.devlink.backend.repository.ProposalRepository;
import com.devlink.backend.repository.UserRepository;
import com.devlink.backend.service.ProposalOfferService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProposalOfferServiceImpl implements ProposalOfferService {

    @Autowired
    private ProposalOfferRepository proposalOfferRepository;

    @Autowired
    private ProposalRepository proposalRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public ProposalOfferResponse createOffer(UUID proposalId, ProposalOfferRequest request, UUID participantId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));

        if (proposal.getStatus() == ProposalStatus.ACCEPTED || proposal.getStatus() == ProposalStatus.REJECTED || proposal.getStatus() == ProposalStatus.WITHDRAWN) {
            throw new BusinessRuleException("Cannot create offer for proposal in status: " + proposal.getStatus());
        }

        UUID clientId = proposal.getJob().getClient().getId();
        UUID freelancerId = proposal.getFreelancer().getId();

        if (!participantId.equals(clientId) && !participantId.equals(freelancerId)) {
            throw new BusinessRuleException("Only the job client or the proposal freelancer can create offers");
        }

        User participant = userRepository.findById(participantId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ProposalOffer latestOffer = proposalOfferRepository.findTopByProposalIdOrderByCreatedAtDesc(proposalId).orElse(null);

        if (latestOffer != null && latestOffer.getStatus() == ProposalOfferStatus.PENDING) {
            UUID pendingOfferedById = latestOffer.getOfferedBy().getId();
            UUID recipientId = pendingOfferedById.equals(clientId) ? freelancerId : clientId;

            if (!participantId.equals(recipientId)) {
                throw new BusinessRuleException("You cannot create a new offer until the pending offer is responded to");
            }

            latestOffer.setStatus(ProposalOfferStatus.SUPERSEDED);
            proposalOfferRepository.save(latestOffer);
        }

        ProposalOffer newOffer = new ProposalOffer(proposal, participant, request.getPrice(), request.getDurationDays(), request.getMessage());
        newOffer.setStatus(ProposalOfferStatus.PENDING);
        proposal.setStatus(ProposalStatus.NEGOTIATING);

        proposalRepository.save(proposal);
        ProposalOffer savedOffer = proposalOfferRepository.save(newOffer);

        return mapToResponse(savedOffer);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProposalOfferResponse> getOffersByProposal(UUID proposalId, UUID userId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));

        if (!proposal.getFreelancer().getId().equals(userId) && !proposal.getJob().getClient().getId().equals(userId)) {
            throw new BusinessRuleException("You do not have permission to view offers for this proposal");
        }

        return proposalOfferRepository.findByProposalIdOrderByCreatedAtAsc(proposalId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void acceptOffer(UUID proposalId, UUID offerId, UUID recipientId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));
        
        ProposalOffer offer = proposalOfferRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found"));

        if (!offer.getProposal().getId().equals(proposalId)) {
            throw new BusinessRuleException("Offer does not belong to this proposal");
        }

        if (offer.getStatus() != ProposalOfferStatus.PENDING) {
            throw new BusinessRuleException("Can only accept PENDING offers");
        }

        ProposalOffer latestOffer = proposalOfferRepository.findTopByProposalIdOrderByCreatedAtDesc(proposalId).orElse(null);
        if (latestOffer == null || !latestOffer.getId().equals(offerId)) {
            throw new BusinessRuleException("Can only accept the latest pending offer");
        }

        UUID clientId = proposal.getJob().getClient().getId();
        UUID freelancerId = proposal.getFreelancer().getId();
        UUID offeredById = offer.getOfferedBy().getId();
        UUID actualRecipientId = offeredById.equals(clientId) ? freelancerId : clientId;

        if (!recipientId.equals(actualRecipientId)) {
            throw new BusinessRuleException("Only the recipient of the offer can accept it");
        }

        if (projectRepository.existsByProposalId(proposalId)) {
            throw new BusinessRuleException("This proposal already has a project");
        }

        Job job = proposal.getJob();
        
        if (job.getStatus() == JobStatus.IN_PROGRESS) {
            throw new BusinessRuleException("Job is already IN_PROGRESS");
        }

        // 1. Offer -> ACCEPTED
        offer.setStatus(ProposalOfferStatus.ACCEPTED);
        proposalOfferRepository.save(offer);

        // 2. Proposal -> ACCEPTED
        proposal.setStatus(ProposalStatus.ACCEPTED);
        proposalRepository.save(proposal);

        // 3. Create EXACTLY ONE Project
        Timestamp startedAt = new Timestamp(System.currentTimeMillis());
        long deadlineMillis = startedAt.getTime() + (offer.getDurationDays() * 24L * 60L * 60L * 1000L);
        Timestamp projectDeadline = new Timestamp(deadlineMillis);
        
        Project project = new Project(proposal, offer.getPrice(), offer.getDurationDays(), job.getTitle(), projectDeadline);
        project.setStatus(ProjectStatus.IN_PROGRESS);
        project.setStartedAt(startedAt);
        projectRepository.save(project);

        // 4. Job -> IN_PROGRESS
        job.setStatus(JobStatus.IN_PROGRESS);
        jobRepository.save(job);

        // 5. Reject other active proposals
        List<Proposal> otherProposals = proposalRepository.findByJobIdAndStatusIn(job.getId(), List.of(ProposalStatus.PENDING, ProposalStatus.NEGOTIATING));
        for (Proposal other : otherProposals) {
            if (!other.getId().equals(proposal.getId())) {
                other.setStatus(ProposalStatus.REJECTED);
                proposalRepository.save(other);
            }
        }
    }

    @Override
    @Transactional
    public void rejectOffer(UUID proposalId, UUID offerId, UUID recipientId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));
        
        ProposalOffer offer = proposalOfferRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found"));

        if (!offer.getProposal().getId().equals(proposalId)) {
            throw new BusinessRuleException("Offer does not belong to this proposal");
        }

        if (offer.getStatus() != ProposalOfferStatus.PENDING) {
            throw new BusinessRuleException("Can only reject PENDING offers");
        }

        ProposalOffer latestOffer = proposalOfferRepository.findTopByProposalIdOrderByCreatedAtDesc(proposalId).orElse(null);
        if (latestOffer == null || !latestOffer.getId().equals(offerId)) {
            throw new BusinessRuleException("Can only reject the latest pending offer");
        }

        UUID clientId = proposal.getJob().getClient().getId();
        UUID freelancerId = proposal.getFreelancer().getId();
        UUID offeredById = offer.getOfferedBy().getId();
        UUID actualRecipientId = offeredById.equals(clientId) ? freelancerId : clientId;

        if (!recipientId.equals(actualRecipientId)) {
            throw new BusinessRuleException("Only the recipient of the offer can reject it");
        }

        offer.setStatus(ProposalOfferStatus.REJECTED);
        proposalOfferRepository.save(offer);
        
        // Proposal stays in NEGOTIATING
    }

    private ProposalOfferResponse mapToResponse(ProposalOffer offer) {
        ProposalOfferResponse dto = new ProposalOfferResponse();
        dto.setId(offer.getId());
        dto.setProposalId(offer.getProposal().getId());
        dto.setOfferedById(offer.getOfferedBy().getId());
        dto.setOfferedByName(offer.getOfferedBy().getName());
        dto.setPrice(offer.getPrice());
        dto.setDurationDays(offer.getDurationDays());
        dto.setMessage(offer.getMessage());
        dto.setStatus(offer.getStatus().name());
        dto.setCreatedAt(offer.getCreatedAt());
        return dto;
    }
}
