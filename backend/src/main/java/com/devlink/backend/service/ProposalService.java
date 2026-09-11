package com.devlink.backend.service;

import com.devlink.backend.dto.ProposalRequest;
import com.devlink.backend.dto.ProposalResponse;
import java.util.List;
import java.util.UUID;

public interface ProposalService {
    ProposalResponse createProposal(UUID jobId, ProposalRequest request, UUID freelancerId);
    List<ProposalResponse> getProposalsByJob(UUID jobId, UUID clientId);
    List<ProposalResponse> getProposalsByFreelancer(UUID freelancerId);
    ProposalResponse getProposal(UUID proposalId, UUID userId);
    ProposalResponse withdrawProposal(UUID proposalId, UUID freelancerId);
}
