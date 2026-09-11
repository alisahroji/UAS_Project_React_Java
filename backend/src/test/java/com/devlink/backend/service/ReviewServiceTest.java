package com.devlink.backend.service;

import com.devlink.backend.dto.ReviewRequest;
import com.devlink.backend.dto.ReviewResponse;
import com.devlink.backend.entity.Job;
import com.devlink.backend.entity.Project;
import com.devlink.backend.entity.Proposal;
import com.devlink.backend.entity.Review;
import com.devlink.backend.entity.User;
import com.devlink.backend.entity.enums.ProjectStatus;
import com.devlink.backend.exception.BusinessRuleException;
import com.devlink.backend.repository.ProjectRepository;
import com.devlink.backend.repository.ReviewRepository;
import com.devlink.backend.service.impl.ReviewServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    private Project project;
    private User client;
    private User freelancer;
    private UUID projectId;

    @BeforeEach
    public void setup() {
        client = new User();
        client.setId(UUID.randomUUID());
        client.setName("Client");

        freelancer = new User();
        freelancer.setId(UUID.randomUUID());
        freelancer.setName("Freelancer");

        Job job = new Job();
        job.setClient(client);

        Proposal proposal = new Proposal();
        proposal.setJob(job);
        proposal.setFreelancer(freelancer);

        project = new Project();
        project.setProposal(proposal);
        projectId = UUID.randomUUID();
        project.setId(projectId);
        project.setStatus(ProjectStatus.COMPLETED);
    }

    @Test
    public void createReview_ProjectNotCompleted_ThrowsException() {
        project.setStatus(ProjectStatus.IN_PROGRESS);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        ReviewRequest request = new ReviewRequest();
        request.setRating(5);

        assertThatThrownBy(() -> reviewService.createReview(projectId, request, client.getId()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("COMPLETED projects");
    }

    @Test
    public void createReview_NonParticipant_ThrowsException() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        ReviewRequest request = new ReviewRequest();
        request.setRating(5);

        assertThatThrownBy(() -> reviewService.createReview(projectId, request, UUID.randomUUID()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("participant");
    }

    @Test
    public void createReview_Duplicate_ThrowsException() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(reviewRepository.existsByProjectIdAndReviewerIdAndRevieweeId(projectId, client.getId(), freelancer.getId()))
                .thenReturn(true);

        ReviewRequest request = new ReviewRequest();
        request.setRating(5);

        assertThatThrownBy(() -> reviewService.createReview(projectId, request, client.getId()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("already reviewed");
    }

    @Test
    public void createReview_ClientReviewsFreelancer_Success() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(reviewRepository.existsByProjectIdAndReviewerIdAndRevieweeId(projectId, client.getId(), freelancer.getId()))
                .thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenAnswer(i -> {
            Review r = (Review) i.getArguments()[0];
            r.setId(UUID.randomUUID());
            r.setCreatedAt(new Timestamp(System.currentTimeMillis()));
            return r;
        });

        ReviewRequest request = new ReviewRequest();
        request.setRating(5);
        request.setComment("Great job!");

        ReviewResponse response = reviewService.createReview(projectId, request, client.getId());

        assertThat(response).isNotNull();
        assertThat(response.getRating()).isEqualTo(5);
        assertThat(response.getComment()).isEqualTo("Great job!");
        assertThat(response.getReviewerId()).isEqualTo(client.getId());
        assertThat(response.getRevieweeId()).isEqualTo(freelancer.getId());
    }

    @Test
    public void createReview_FreelancerReviewsClient_Success() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(reviewRepository.existsByProjectIdAndReviewerIdAndRevieweeId(projectId, freelancer.getId(), client.getId()))
                .thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenAnswer(i -> {
            Review r = (Review) i.getArguments()[0];
            r.setId(UUID.randomUUID());
            r.setCreatedAt(new Timestamp(System.currentTimeMillis()));
            return r;
        });

        ReviewRequest request = new ReviewRequest();
        request.setRating(4);

        ReviewResponse response = reviewService.createReview(projectId, request, freelancer.getId());

        assertThat(response).isNotNull();
        assertThat(response.getRating()).isEqualTo(4);
        assertThat(response.getReviewerId()).isEqualTo(freelancer.getId());
        assertThat(response.getRevieweeId()).isEqualTo(client.getId());
    }
}
