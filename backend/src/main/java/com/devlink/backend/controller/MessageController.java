package com.devlink.backend.controller;

import com.devlink.backend.dto.MessageRequest;
import com.devlink.backend.dto.MessageResponse;
import com.devlink.backend.security.CustomUserDetails;
import com.devlink.backend.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @PostMapping("/proposals/{proposalId}/messages")
    public ResponseEntity<MessageResponse> createMessage(
            @PathVariable UUID proposalId,
            @Valid @RequestBody MessageRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        MessageResponse message = messageService.saveMessage(proposalId, request, userDetails.getUser().getId());
        return new ResponseEntity<>(message, HttpStatus.CREATED);
    }

    @GetMapping("/proposals/{proposalId}/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @PathVariable UUID proposalId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<MessageResponse> messages = messageService.getMessagesByProposalId(proposalId, userDetails.getUser().getId());
        return ResponseEntity.ok(messages);
    }
}
