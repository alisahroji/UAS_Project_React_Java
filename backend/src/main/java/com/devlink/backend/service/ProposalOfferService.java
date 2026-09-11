package com.devlink.backend.service;

import com.devlink.backend.dto.ProposalOfferRequest;
import com.devlink.backend.dto.ProposalOfferResponse;
import java.util.List;
import java.util.UUID;

public interface ProposalOfferService {
    ProposalOfferResponse createOffer(UUID proposalId, ProposalOfferRequest request, UUID participantId);
    List<ProposalOfferResponse> getOffersByProposal(UUID proposalId, UUID userId);
    void acceptOffer(UUID proposalId, UUID offerId, UUID recipientId);
    void rejectOffer(UUID proposalId, UUID offerId, UUID recipientId);
}
