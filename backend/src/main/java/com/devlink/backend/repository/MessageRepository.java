package com.devlink.backend.repository;

import com.devlink.backend.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    java.util.List<Message> findByProposalIdOrderByCreatedAtAsc(UUID proposalId);
}
