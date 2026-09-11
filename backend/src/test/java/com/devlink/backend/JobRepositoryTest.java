package com.devlink.backend;

import com.devlink.backend.entity.Job;
import com.devlink.backend.entity.User;
import com.devlink.backend.entity.enums.UserRole;
import com.devlink.backend.repository.JobRepository;
import com.devlink.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Date;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class JobRepositoryTest {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    public void testCreateAndReadJob() {
        // Create Client
        User client = new User("John Doe", "john@example.com", "hashedpassword", UserRole.CLIENT);
        client = userRepository.save(client);

        // Create Job
        Job job = new Job(client, "Frontend Developer", "Need React dev", new BigDecimal("500.00"), Date.valueOf("2026-10-01"));
        job.setRequiredSkills(List.of("React", "Tailwind"));
        job = jobRepository.save(job);

        // Read Job
        Optional<Job> foundJobOpt = jobRepository.findById(job.getId());
        assertThat(foundJobOpt).isPresent();
        Job foundJob = foundJobOpt.get();

        assertThat(foundJob.getTitle()).isEqualTo("Frontend Developer");
        assertThat(foundJob.getClient().getId()).isEqualTo(client.getId());
        assertThat(foundJob.getRequiredSkills()).containsExactly("React", "Tailwind");
    }
}
