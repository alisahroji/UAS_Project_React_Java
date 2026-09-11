package com.devlink.backend.repository;

import com.devlink.backend.entity.Proposal;
import com.devlink.backend.entity.Job;
import com.devlink.backend.entity.enums.ProposalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface ProposalRepository extends JpaRepository<Proposal, UUID> {
    
    boolean existsByJobAndStatusIn(Job job, List<ProposalStatus> statuses);

    boolean existsByJobIdAndFreelancerIdAndStatusIn(UUID jobId, UUID freelancerId, Collection<ProposalStatus> statuses);

    List<Proposal> findByJobId(UUID jobId);

    List<Proposal> findByFreelancerId(UUID freelancerId);

    List<Proposal> findByJobIdAndStatusIn(UUID jobId, Collection<ProposalStatus> statuses);
}
