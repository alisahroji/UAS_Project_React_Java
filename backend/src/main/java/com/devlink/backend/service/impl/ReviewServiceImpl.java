package com.devlink.backend.service.impl;

import com.devlink.backend.dto.ReviewRequest;
import com.devlink.backend.dto.ReviewResponse;
import com.devlink.backend.entity.Project;
import com.devlink.backend.entity.Review;
import com.devlink.backend.entity.User;
import com.devlink.backend.entity.enums.ProjectStatus;
import com.devlink.backend.exception.BusinessRuleException;
import com.devlink.backend.exception.ResourceNotFoundException;
import com.devlink.backend.repository.ProjectRepository;
import com.devlink.backend.repository.ReviewRepository;
import com.devlink.backend.repository.UserRepository;
import com.devlink.backend.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ReviewServiceImpl implements ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public ReviewResponse createReview(UUID projectId, ReviewRequest request, UUID reviewerId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (project.getStatus() != ProjectStatus.COMPLETED) {
            throw new BusinessRuleException("Reviews can only be submitted for COMPLETED projects");
        }

        User client = project.getProposal().getJob().getClient();
        User freelancer = project.getProposal().getFreelancer();

        if (!reviewerId.equals(client.getId()) && !reviewerId.equals(freelancer.getId())) {
            throw new AccessDeniedException("Only project participants can submit a review");
        }

        User reviewer = reviewerId.equals(client.getId()) ? client : freelancer;
        User reviewee = reviewerId.equals(client.getId()) ? freelancer : client;

        if (reviewRepository.existsByProjectIdAndReviewerIdAndRevieweeId(projectId, reviewer.getId(), reviewee.getId())) {
            throw new BusinessRuleException("You have already reviewed this user for this project");
        }

        Review review = new Review(project, reviewer, reviewee, request.getRating(), request.getComment());
        Review savedReview = reviewRepository.save(review);

        return mapToResponse(savedReview);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByProjectId(UUID projectId, UUID userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        
        UUID clientId = project.getProposal().getJob().getClient().getId();
        UUID freelancerId = project.getProposal().getFreelancer().getId();
        
        if (!userId.equals(clientId) && !userId.equals(freelancerId)) {
            throw new AccessDeniedException("You do not have permission to view reviews for this project");
        }
        
        return reviewRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByUserId(UUID userId) {
        // Anyone can view a user's reviews, acting as a public reputation system
        return reviewRepository.findByRevieweeIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ReviewResponse mapToResponse(Review review) {
        ReviewResponse dto = new ReviewResponse();
        dto.setId(review.getId());
        dto.setProjectId(review.getProject().getId());
        dto.setReviewerId(review.getReviewer().getId());
        dto.setReviewerName(review.getReviewer().getName());
        dto.setRevieweeId(review.getReviewee().getId());
        dto.setRevieweeName(review.getReviewee().getName());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setCreatedAt(review.getCreatedAt());
        return dto;
    }
}
