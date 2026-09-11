package com.devlink.backend.controller;

import com.devlink.backend.dto.ProposalOfferRequest;
import com.devlink.backend.dto.ProposalOfferResponse;
import com.devlink.backend.dto.ProposalRequest;
import com.devlink.backend.dto.ProposalResponse;
import com.devlink.backend.security.CustomUserDetails;
import com.devlink.backend.service.ProposalOfferService;
import com.devlink.backend.service.ProposalService;
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
public class ProposalController {

    @Autowired
    private ProposalService proposalService;

    @Autowired
    private ProposalOfferService proposalOfferService;

    @PostMapping("/jobs/{jobId}/proposals")
    public ResponseEntity<ProposalResponse> createProposal(
            @PathVariable UUID jobId,
            @Valid @RequestBody ProposalRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        ProposalResponse response = proposalService.createProposal(jobId, request, userDetails.getId());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/jobs/{jobId}/proposals")
    public ResponseEntity<List<ProposalResponse>> getProposalsByJob(
            @PathVariable UUID jobId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        List<ProposalResponse> responses = proposalService.getProposalsByJob(jobId, userDetails.getId());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/proposals/me")
    public ResponseEntity<List<ProposalResponse>> getMyProposals(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        List<ProposalResponse> responses = proposalService.getProposalsByFreelancer(userDetails.getId());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/proposals/{proposalId}")
    public ResponseEntity<ProposalResponse> getProposal(
            @PathVariable UUID proposalId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        ProposalResponse response = proposalService.getProposal(proposalId, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/proposals/{proposalId}/withdraw")
    public ResponseEntity<ProposalResponse> withdrawProposal(
            @PathVariable UUID proposalId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        ProposalResponse response = proposalService.withdrawProposal(proposalId, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/proposals/{proposalId}/offers")
    public ResponseEntity<ProposalOfferResponse> createOffer(
            @PathVariable UUID proposalId,
            @Valid @RequestBody ProposalOfferRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        ProposalOfferResponse response = proposalOfferService.createOffer(proposalId, request, userDetails.getId());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/proposals/{proposalId}/offers")
    public ResponseEntity<List<ProposalOfferResponse>> getOffers(
            @PathVariable UUID proposalId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        List<ProposalOfferResponse> responses = proposalOfferService.getOffersByProposal(proposalId, userDetails.getId());
        return ResponseEntity.ok(responses);
    }

    @PostMapping("/proposals/{proposalId}/offers/{offerId}/accept")
    public ResponseEntity<Void> acceptOffer(
            @PathVariable UUID proposalId,
            @PathVariable UUID offerId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        proposalOfferService.acceptOffer(proposalId, offerId, userDetails.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/proposals/{proposalId}/offers/{offerId}/reject")
    public ResponseEntity<Void> rejectOffer(
            @PathVariable UUID proposalId,
            @PathVariable UUID offerId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        proposalOfferService.rejectOffer(proposalId, offerId, userDetails.getId());
        return ResponseEntity.ok().build();
    }
}
