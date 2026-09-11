package com.devlink.backend.service.impl;

import com.devlink.backend.dto.MessageRequest;
import com.devlink.backend.dto.MessageResponse;
import com.devlink.backend.entity.Message;
import com.devlink.backend.entity.Proposal;
import com.devlink.backend.entity.User;
import com.devlink.backend.exception.ResourceNotFoundException;
import com.devlink.backend.repository.MessageRepository;
import com.devlink.backend.repository.ProposalRepository;
import com.devlink.backend.repository.UserRepository;
import com.devlink.backend.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MessageServiceImpl implements MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ProposalRepository proposalRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public MessageResponse saveMessage(UUID proposalId, MessageRequest request, UUID senderId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));

        validateParticipantInternal(proposal, senderId);

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));

        Message message = new Message(proposal, sender, request.getContent());
        Message savedMessage = messageRepository.save(message);

        return mapToResponse(savedMessage);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageResponse> getMessagesByProposalId(UUID proposalId, UUID userId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));

        validateParticipantInternal(proposal, userId);

        return messageRepository.findByProposalIdOrderByCreatedAtAsc(proposalId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public void validateParticipant(UUID proposalId, UUID userId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));
        validateParticipantInternal(proposal, userId);
    }

    private void validateParticipantInternal(Proposal proposal, UUID userId) {
        UUID clientId = proposal.getJob().getClient().getId();
        UUID freelancerId = proposal.getFreelancer().getId();

        if (!userId.equals(clientId) && !userId.equals(freelancerId)) {
            throw new AccessDeniedException("Only proposal participants can access this chat");
        }
    }

    private MessageResponse mapToResponse(Message message) {
        MessageResponse dto = new MessageResponse();
        dto.setId(message.getId());
        dto.setProposalId(message.getProposal().getId());
        dto.setSenderId(message.getSender().getId());
        dto.setSenderName(message.getSender().getName());
        dto.setContent(message.getContent());
        dto.setCreatedAt(message.getCreatedAt());
        return dto;
    }
}
