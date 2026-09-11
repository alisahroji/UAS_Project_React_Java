package com.devlink.backend.controller;

import com.devlink.backend.dto.MessageRequest;
import com.devlink.backend.dto.MessageResponse;
import com.devlink.backend.security.CustomUserDetails;
import com.devlink.backend.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.validation.Valid;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
public class ChatController {

    @Autowired
    private MessageService messageService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/proposals/{proposalId}/messages")
    public void sendMessage(
            @DestinationVariable UUID proposalId,
            @Valid @Payload MessageRequest request,
            Principal principal) {
        
        if (principal instanceof UsernamePasswordAuthenticationToken auth) {
            CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
            MessageResponse message = messageService.saveMessage(proposalId, request, userDetails.getUser().getId());
            
            messagingTemplate.convertAndSend("/topic/proposals/" + proposalId, message);
        }
    }
}
