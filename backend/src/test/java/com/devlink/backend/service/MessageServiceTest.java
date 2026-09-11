package com.devlink.backend.service;

import com.devlink.backend.dto.MessageRequest;
import com.devlink.backend.dto.MessageResponse;
import com.devlink.backend.entity.Job;
import com.devlink.backend.entity.Message;
import com.devlink.backend.entity.Proposal;
import com.devlink.backend.entity.User;
import com.devlink.backend.entity.enums.UserRole;
import com.devlink.backend.repository.MessageRepository;
import com.devlink.backend.repository.ProposalRepository;
import com.devlink.backend.repository.UserRepository;
import com.devlink.backend.service.impl.MessageServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class MessageServiceTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ProposalRepository proposalRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private MessageServiceImpl messageService;

    private User client;
    private User freelancer;
    private User hacker;
    private Job job;
    private Proposal proposal;
    private Message message;

    @BeforeEach
    public void setup() {
        client = new User("Client", "client@test.com", "pass", UserRole.CLIENT);
        client.setId(UUID.randomUUID());

        freelancer = new User("Freelancer", "freelancer@test.com", "pass", UserRole.FREELANCER);
        freelancer.setId(UUID.randomUUID());

        hacker = new User("Hacker", "hacker@test.com", "pass", UserRole.FREELANCER);
        hacker.setId(UUID.randomUUID());

        job = new Job(client, "Job Title", "Job Desc", new BigDecimal("100"), new java.sql.Date(System.currentTimeMillis()));
        job.setId(UUID.randomUUID());

        proposal = new Proposal(job, freelancer, new BigDecimal("100"), 10, "Hi");
        proposal.setId(UUID.randomUUID());

        message = new Message(proposal, client, "Hello Freelancer!");
        message.setId(UUID.randomUUID());
        message.setCreatedAt(new Timestamp(System.currentTimeMillis()));
    }

    @Test
    public void saveMessage_ValidParticipant_ShouldSucceed() {
        MessageRequest req = new MessageRequest();
        req.setContent("Hello Freelancer!");

        when(proposalRepository.findById(proposal.getId())).thenReturn(Optional.of(proposal));
        when(userRepository.findById(client.getId())).thenReturn(Optional.of(client));
        when(messageRepository.save(any(Message.class))).thenReturn(message);

        MessageResponse res = messageService.saveMessage(proposal.getId(), req, client.getId());

        assertThat(res).isNotNull();
        assertThat(res.getContent()).isEqualTo("Hello Freelancer!");
        assertThat(res.getSenderId()).isEqualTo(client.getId());
    }

    @Test
    public void saveMessage_NonParticipant_ShouldThrowAccessDenied() {
        MessageRequest req = new MessageRequest();
        req.setContent("I am a hacker");

        when(proposalRepository.findById(proposal.getId())).thenReturn(Optional.of(proposal));

        assertThatThrownBy(() -> messageService.saveMessage(proposal.getId(), req, hacker.getId()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    public void getMessages_ValidParticipant_ShouldReturnList() {
        when(proposalRepository.findById(proposal.getId())).thenReturn(Optional.of(proposal));
        when(messageRepository.findByProposalIdOrderByCreatedAtAsc(proposal.getId())).thenReturn(List.of(message));

        List<MessageResponse> list = messageService.getMessagesByProposalId(proposal.getId(), freelancer.getId());

        assertThat(list).hasSize(1);
        assertThat(list.get(0).getContent()).isEqualTo("Hello Freelancer!");
    }

    @Test
    public void getMessages_NonParticipant_ShouldThrowAccessDenied() {
        when(proposalRepository.findById(proposal.getId())).thenReturn(Optional.of(proposal));

        assertThatThrownBy(() -> messageService.getMessagesByProposalId(proposal.getId(), hacker.getId()))
                .isInstanceOf(AccessDeniedException.class);
    }
}
