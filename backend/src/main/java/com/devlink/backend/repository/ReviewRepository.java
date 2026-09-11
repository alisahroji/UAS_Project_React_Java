package com.devlink.backend.repository;

import com.devlink.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    boolean existsByProjectIdAndReviewerIdAndRevieweeId(UUID projectId, UUID reviewerId, UUID revieweeId);
    java.util.List<Review> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
    java.util.List<Review> findByRevieweeIdOrderByCreatedAtDesc(UUID revieweeId);
}
