package com.devlink.backend.controller;

import com.devlink.backend.dto.ReviewRequest;
import com.devlink.backend.dto.ReviewResponse;
import com.devlink.backend.security.CustomUserDetails;
import com.devlink.backend.service.ReviewService;
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
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @PostMapping("/projects/{projectId}/reviews")
    public ResponseEntity<ReviewResponse> createReview(
            @PathVariable UUID projectId,
            @Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ReviewResponse review = reviewService.createReview(projectId, request, userDetails.getUser().getId());
        return new ResponseEntity<>(review, HttpStatus.CREATED);
    }

    @GetMapping("/projects/{projectId}/reviews")
    public ResponseEntity<List<ReviewResponse>> getProjectReviews(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<ReviewResponse> reviews = reviewService.getReviewsByProjectId(projectId, userDetails.getUser().getId());
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/users/{userId}/reviews")
    public ResponseEntity<List<ReviewResponse>> getUserReviews(
            @PathVariable UUID userId) {
        List<ReviewResponse> reviews = reviewService.getReviewsByUserId(userId);
        return ResponseEntity.ok(reviews);
    }
}
