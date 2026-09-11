package com.devlink.backend.service;

import com.devlink.backend.dto.ReviewRequest;
import com.devlink.backend.dto.ReviewResponse;

import java.util.List;
import java.util.UUID;

public interface ReviewService {
    ReviewResponse createReview(UUID projectId, ReviewRequest request, UUID reviewerId);
    List<ReviewResponse> getReviewsByProjectId(UUID projectId, UUID userId);
    List<ReviewResponse> getReviewsByUserId(UUID userId);
}
