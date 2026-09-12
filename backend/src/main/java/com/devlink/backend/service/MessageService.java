package com.devlink.backend.service;

import com.devlink.backend.dto.MessageRequest;
import com.devlink.backend.dto.MessageResponse;

import java.util.List;
import java.util.UUID;

public interface MessageService {
    MessageResponse saveMessage(UUID proposalId, MessageRequest request, UUID senderId);
    List<MessageResponse> getMessagesByProposalId(UUID proposalId, UUID userId);
    void validateParticipant(UUID proposalId, UUID userId);
}
    