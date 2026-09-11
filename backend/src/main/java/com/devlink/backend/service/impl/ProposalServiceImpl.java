package com.devlink.backend.service.impl;

import com.devlink.backend.dto.ProposalRequest;
import com.devlink.backend.dto.ProposalResponse;
import com.devlink.backend.entity.Job;
import com.devlink.backend.entity.Proposal;
import com.devlink.backend.entity.ProposalOffer;
import com.devlink.backend.entity.User;
import com.devlink.backend.entity.enums.JobStatus;
import com.devlink.backend.entity.enums.ProposalOfferStatus;
import com.devlink.backend.entity.enums.ProposalStatus;
import com.devlink.backend.entity.enums.UserRole;
import com.devlink.backend.exception.BusinessRuleException;
import com.devlink.backend.exception.ResourceNotFoundException;
import com.devlink.backend.repository.JobRepository;
import com.devlink.backend.repository.ProposalOfferRepository;
import com.devlink.backend.repository.ProposalRepository;
import com.devlink.backend.repository.UserRepository;
import com.devlink.backend.service.ProposalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProposalServiceImpl implements ProposalService {

    @Autowired
    private ProposalRepository proposalRepository;
    
    @Autowired
    private ProposalOfferRepository proposalOfferRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public ProposalResponse createProposal(UUID jobId, ProposalRequest request, UUID freelancerId) {
        User freelancer = userRepository.findById(freelancerId)
                .orElseThrow(() -> new ResourceNotFoundException("Freelancer not found"));

        if (freelancer.getRole() != UserRole.FREELANCER) {
            throw new BusinessRuleException("Only freelancers can create proposals");
        }

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));

        if (job.getStatus() != JobStatus.OPEN) {
            throw new BusinessRuleException("Can only propose to OPEN jobs");
        }

        boolean hasActiveProposal = proposalRepository.existsByJobIdAndFreelancerIdAndStatusIn(
                jobId, freelancerId, List.of(ProposalStatus.PENDING, ProposalStatus.NEGOTIATING)
        );

        if (hasActiveProposal) {
            throw new BusinessRuleException("Freelancer already has an active proposal for this job");
        }

        Proposal proposal = new Proposal(job, freelancer, request.getInitialPrice(), request.getInitialDurationDays(), request.getCoverLetter());
        proposal.setStatus(ProposalStatus.PENDING);
        
        Proposal savedProposal = proposalRepository.save(proposal);

        ProposalOffer initialOffer = new ProposalOffer(savedProposal, freelancer, request.getInitialPrice(), request.getInitialDurationDays(), "Initial Proposal");
        initialOffer.setStatus(ProposalOfferStatus.PENDING);
        proposalOfferRepository.save(initialOffer);

        return mapToResponse(savedProposal);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProposalResponse> getProposalsByJob(UUID jobId, UUID clientId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));

        if (!job.getClient().getId().equals(clientId)) {
            throw new BusinessRuleException("Only the client owner can view proposals for this job");
        }

        return proposalRepository.findByJobId(jobId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProposalResponse> getProposalsByFreelancer(UUID freelancerId) {
        return proposalRepository.findByFreelancerId(freelancerId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProposalResponse getProposal(UUID proposalId, UUID userId) {
        Proposal proposal = getProposalOrThrow(proposalId);
        
        if (!proposal.getFreelancer().getId().equals(userId) && !proposal.getJob().getClient().getId().equals(userId)) {
            throw new BusinessRuleException("You do not have permission to view this proposal");
        }

        return mapToResponse(proposal);
    }

    @Override
    @Transactional
    public ProposalResponse withdrawProposal(UUID proposalId, UUID freelancerId) {
        Proposal proposal = getProposalOrThrow(proposalId);

        if (!proposal.getFreelancer().getId().equals(freelancerId)) {
            throw new BusinessRuleException("Only the freelancer owner can withdraw this proposal");
        }

        if (proposal.getStatus() != ProposalStatus.PENDING && proposal.getStatus() != ProposalStatus.NEGOTIATING) {
            throw new BusinessRuleException("Cannot withdraw proposal with status: " + proposal.getStatus());
        }

        proposal.setStatus(ProposalStatus.WITHDRAWN);
        
        proposalOfferRepository.findTopByProposalIdOrderByCreatedAtDesc(proposalId).ifPresent(offer -> {
            if (offer.getStatus() == ProposalOfferStatus.PENDING) {
                offer.setStatus(ProposalOfferStatus.SUPERSEDED);
                proposalOfferRepository.save(offer);
            }
        });

        return mapToResponse(proposalRepository.save(proposal));
    }

    private Proposal getProposalOrThrow(UUID proposalId) {
        return proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));
    }

    private ProposalResponse mapToResponse(Proposal proposal) {
        ProposalResponse dto = new ProposalResponse();
        dto.setId(proposal.getId());
        dto.setJobId(proposal.getJob().getId());
        dto.setJobTitle(proposal.getJob().getTitle());
        dto.setFreelancerId(proposal.getFreelancer().getId());
        dto.setFreelancerName(proposal.getFreelancer().getName());
        dto.setInitialPrice(proposal.getPrice());
        dto.setInitialDurationDays(proposal.getDurationDays());
        dto.setCoverLetter(proposal.getCoverLetter());
        dto.setStatus(proposal.getStatus().name());
        dto.setCreatedAt(proposal.getCreatedAt());
        dto.setUpdatedAt(proposal.getUpdatedAt());
        return dto;
    }
}
