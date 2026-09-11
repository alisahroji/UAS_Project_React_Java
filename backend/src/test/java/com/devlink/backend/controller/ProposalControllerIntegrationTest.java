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
import java.util.UUID;

import com.fasterxml.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class ProposalControllerIntegrationTest {

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
            User user = new User("Test " + role, email, passwordEncoder.encode("password"), role);
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
        assertThat(response.statusCode()).withFailMessage("Login failed: " + response.body()).isEqualTo(200);
        Map<String, String> resMap = objectMapper.readValue(response.body(), Map.class);
        return resMap.get("token");
    }

    @Test
    public void testProposalFlow_EndToEnd() throws Exception {
        User client = createAndSaveUser("p_client_v2@test.com", UserRole.CLIENT);
        User freelancer = createAndSaveUser("p_free_v2@test.com", UserRole.FREELANCER);
        
        String clientToken = getAuthToken(client.getEmail());
        String freeToken = getAuthToken(freelancer.getEmail());

        // 1. Create Job (Client)
        CreateJobRequest jobReq = new CreateJobRequest();
        jobReq.setTitle("Flow Job");
        jobReq.setDescription("Desc");
        jobReq.setBudget(new BigDecimal("1000"));
        jobReq.setDeadline(java.sql.Date.valueOf("2026-10-10"));

        HttpRequest createJobReq = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/jobs"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + clientToken)
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(jobReq)))
                .build();
        HttpResponse<String> jobRes = httpClient.send(createJobReq, HttpResponse.BodyHandlers.ofString());
        assertThat(jobRes.statusCode()).isEqualTo(201);
        Map jobMap = objectMapper.readValue(jobRes.body(), Map.class);
        String jobId = (String) jobMap.get("id");

        // 2. Create Proposal (Freelancer)
        String proposalJson = "{\"initialPrice\":500, \"initialDurationDays\":5, \"coverLetter\":\"I can do it\"}";
        HttpRequest createPropReq = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/jobs/" + jobId + "/proposals"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + freeToken)
                .POST(HttpRequest.BodyPublishers.ofString(proposalJson))
                .build();
        HttpResponse<String> propRes = httpClient.send(createPropReq, HttpResponse.BodyHandlers.ofString());
        assertThat(propRes.statusCode()).isEqualTo(201);
        Map propMap = objectMapper.readValue(propRes.body(), Map.class);
        String proposalId = (String) propMap.get("id");
        
        // 3. Client tries to accept without offers explicitly? Wait, there is an initial offer created!
        // We need to fetch the offer id first.
        HttpRequest getOffersReq = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/proposals/" + proposalId + "/offers"))
                .header("Authorization", "Bearer " + clientToken)
                .GET()
                .build();
        HttpResponse<String> offersRes = httpClient.send(getOffersReq, HttpResponse.BodyHandlers.ofString());
        java.util.List<Map> offersList = objectMapper.readValue(offersRes.body(), java.util.List.class);
        assertThat(offersList).hasSize(1);
        String offerId = (String) offersList.get(0).get("id");

        // 4. Client accepts the offer
        HttpRequest acceptReq = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/proposals/" + proposalId + "/offers/" + offerId + "/accept"))
                .header("Authorization", "Bearer " + clientToken)
                .POST(HttpRequest.BodyPublishers.noBody())
                .build();
        HttpResponse<String> acceptRes = httpClient.send(acceptReq, HttpResponse.BodyHandlers.ofString());
        assertThat(acceptRes.statusCode()).isEqualTo(200);
        
        // 5. Job should be IN_PROGRESS
        HttpRequest getJobReq = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/jobs/" + jobId))
                .GET()
                .build();
        HttpResponse<String> getJobRes = httpClient.send(getJobReq, HttpResponse.BodyHandlers.ofString());
        Map updatedJob = objectMapper.readValue(getJobRes.body(), Map.class);
        assertThat(updatedJob.get("status")).isEqualTo("IN_PROGRESS");
    }
}
