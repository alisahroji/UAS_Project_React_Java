package com.devlink.backend.controller;

import com.devlink.backend.dto.CreateJobRequest;
import com.devlink.backend.dto.LoginRequest;
import com.devlink.backend.entity.User;
import com.devlink.backend.entity.enums.UserRole;
import com.devlink.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class ReviewControllerIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    private String getBaseUrl() {
        return "http://localhost:" + port + "/api";
    }

    private User createAndSaveUser(String email, UserRole role) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = new User("Rev " + role, email, passwordEncoder.encode("password"), role);
            return userRepository.save(user);
        });
    }

    private String getAuthToken(String email) throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail(email);
        req.setPassword("password");
        
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(req)))
                .build();
                
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        Map<String, String> resMap = objectMapper.readValue(response.body(), Map.class);
        return resMap.get("token");
    }

    @Test
    public void testReviewLifecycle_EndToEnd() throws Exception {
        User client = createAndSaveUser("rev_client@test.com", UserRole.CLIENT);
        User freelancer = createAndSaveUser("rev_free@test.com", UserRole.FREELANCER);
        
        String clientToken = getAuthToken(client.getEmail());
        String freeToken = getAuthToken(freelancer.getEmail());

        // Create Job, Proposal, Offer, Accept Offer, Complete Project
        // 1. Create Job
        CreateJobRequest jobReq = new CreateJobRequest();
        jobReq.setTitle("Rev Job");
        jobReq.setDescription("Desc");
        jobReq.setBudget(new BigDecimal("1000"));
        jobReq.setDeadline(java.sql.Date.valueOf("2026-10-10"));

        HttpResponse<String> jobRes = httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/jobs"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + clientToken)
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(jobReq)))
                .build(), HttpResponse.BodyHandlers.ofString());
        String jobId = (String) objectMapper.readValue(jobRes.body(), Map.class).get("id");

        // 2. Proposal
        String proposalJson = "{\"initialPrice\":500, \"initialDurationDays\":5, \"coverLetter\":\"I can do it\"}";
        HttpResponse<String> propRes = httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/jobs/" + jobId + "/proposals"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + freeToken)
                .POST(HttpRequest.BodyPublishers.ofString(proposalJson))
                .build(), HttpResponse.BodyHandlers.ofString());
        String proposalId = (String) objectMapper.readValue(propRes.body(), Map.class).get("id");
        
        // 3. Get Offer
        HttpResponse<String> offersRes = httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/proposals/" + proposalId + "/offers"))
                .header("Authorization", "Bearer " + clientToken)
                .GET().build(), HttpResponse.BodyHandlers.ofString());
        java.util.List<Map> offersList = objectMapper.readValue(offersRes.body(), java.util.List.class);
        String offerId = (String) offersList.get(0).get("id");

        // 4. Accept
        httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/proposals/" + proposalId + "/offers/" + offerId + "/accept"))
                .header("Authorization", "Bearer " + clientToken)
                .POST(HttpRequest.BodyPublishers.noBody())
                .build(), HttpResponse.BodyHandlers.ofString());
        
        // 5. Get Project
        HttpResponse<String> getProjectsRes = httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/projects"))
                .header("Authorization", "Bearer " + clientToken)
                .GET().build(), HttpResponse.BodyHandlers.ofString());
        java.util.List<Map> projectsList = objectMapper.readValue(getProjectsRes.body(), java.util.List.class);
        String projectId = (String) projectsList.stream().filter(p -> jobId.equals(p.get("jobId"))).findFirst().orElseThrow().get("id");

        // 6. Submit
        httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/projects/" + projectId + "/status"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + freeToken)
                .POST(HttpRequest.BodyPublishers.ofString("{\"status\": \"SUBMITTED\"}"))
                .build(), HttpResponse.BodyHandlers.ofString());

        // Try review BEFORE COMPLETED -> Should fail 409
        String reviewJson = "{\"rating\": 5, \"comment\": \"Good\"}";
        HttpResponse<String> earlyRevRes = httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/projects/" + projectId + "/reviews"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + clientToken)
                .POST(HttpRequest.BodyPublishers.ofString(reviewJson))
                .build(), HttpResponse.BodyHandlers.ofString());
        assertThat(earlyRevRes.statusCode()).isEqualTo(409);

        // 7. Complete
        httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/projects/" + projectId + "/status"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + clientToken)
                .POST(HttpRequest.BodyPublishers.ofString("{\"status\": \"COMPLETED\"}"))
                .build(), HttpResponse.BodyHandlers.ofString());

        // 8. Add Review by Client
        HttpResponse<String> revRes = httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/projects/" + projectId + "/reviews"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + clientToken)
                .POST(HttpRequest.BodyPublishers.ofString(reviewJson))
                .build(), HttpResponse.BodyHandlers.ofString());
        assertThat(revRes.statusCode()).isEqualTo(201);
        Map createdReview = objectMapper.readValue(revRes.body(), Map.class);
        assertThat(createdReview.get("reviewerId")).isEqualTo(client.getId().toString());
        assertThat(createdReview.get("revieweeId")).isEqualTo(freelancer.getId().toString());

        // 9. Add Duplicate Review by Client -> Should fail 409
        HttpResponse<String> dupRevRes = httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/projects/" + projectId + "/reviews"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + clientToken)
                .POST(HttpRequest.BodyPublishers.ofString(reviewJson))
                .build(), HttpResponse.BodyHandlers.ofString());
        assertThat(dupRevRes.statusCode()).isEqualTo(409);

        // 10. Add Review by Freelancer -> Should succeed
        String freeReviewJson = "{\"rating\": 4}";
        HttpResponse<String> revFreeRes = httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/projects/" + projectId + "/reviews"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + freeToken)
                .POST(HttpRequest.BodyPublishers.ofString(freeReviewJson))
                .build(), HttpResponse.BodyHandlers.ofString());
        assertThat(revFreeRes.statusCode()).isEqualTo(201);
        
        // 11. Invalid rating -> Should fail 400
        String invalidReviewJson = "{\"rating\": 6}";
        HttpResponse<String> badRevRes = httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/projects/" + projectId + "/reviews"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + freeToken)
                .POST(HttpRequest.BodyPublishers.ofString(invalidReviewJson))
                .build(), HttpResponse.BodyHandlers.ofString());
        assertThat(badRevRes.statusCode()).isEqualTo(400);

        // 12. Retrieve Reviews for Project
        HttpResponse<String> getRevsRes = httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/projects/" + projectId + "/reviews"))
                .header("Authorization", "Bearer " + clientToken)
                .GET().build(), HttpResponse.BodyHandlers.ofString());
        java.util.List<Map> revsList = objectMapper.readValue(getRevsRes.body(), java.util.List.class);
        assertThat(revsList).hasSize(2);
    }
}
