package com.devlink.backend.repository;

import com.devlink.backend.entity.Project;
import com.devlink.backend.entity.enums.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    boolean existsByProposalId(UUID proposalId);
    boolean existsByProposal_Job_IdAndStatusIn(UUID jobId, Collection<ProjectStatus> statuses);

    @Query("SELECT p FROM Project p WHERE p.proposal.job.client.id = :userId OR p.proposal.freelancer.id = :userId ORDER BY p.createdAt DESC")
    List<Project> findByParticipantId(@Param("userId") UUID userId);
}
