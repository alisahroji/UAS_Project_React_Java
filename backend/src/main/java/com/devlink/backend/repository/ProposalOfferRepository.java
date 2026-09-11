package com.devlink.backend.repository;

import com.devlink.backend.entity.ProposalOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProposalOfferRepository extends JpaRepository<ProposalOffer, UUID> {
    List<ProposalOffer> findByProposalIdOrderByCreatedAtAsc(UUID proposalId);
    Optional<ProposalOffer> findTopByProposalIdOrderByCreatedAtDesc(UUID proposalId);
}
