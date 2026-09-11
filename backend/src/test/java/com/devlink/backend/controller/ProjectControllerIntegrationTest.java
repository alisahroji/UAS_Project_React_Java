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
public class ProjectControllerIntegrationTest {

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
            User user = new User("Proj " + role, email, passwordEncoder.encode("password"), role);
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
    public void testProjectLifecycle_EndToEnd() throws Exception {
        User client = createAndSaveUser("proj_client@test.com", UserRole.CLIENT);
        User freelancer = createAndSaveUser("proj_free@test.com", UserRole.FREELANCER);
        
        String clientToken = getAuthToken(client.getEmail());
        String freeToken = getAuthToken(freelancer.getEmail());

        // 1. Create Job
        CreateJobRequest jobReq = new CreateJobRequest();
        jobReq.setTitle("Proj Lifecycle Job");
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
        Map jobMap = objectMapper.readValue(jobRes.body(), Map.class);
        String jobId = (String) jobMap.get("id");

        // 2. Create Proposal
        String proposalJson = "{\"initialPrice\":500, \"initialDurationDays\":5, \"coverLetter\":\"I can do it\"}";
        HttpRequest createPropReq = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/jobs/" + jobId + "/proposals"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + freeToken)
                .POST(HttpRequest.BodyPublishers.ofString(proposalJson))
                .build();
        HttpResponse<String> propRes = httpClient.send(createPropReq, HttpResponse.BodyHandlers.ofString());
        Map propMap = objectMapper.readValue(propRes.body(), Map.class);
        String proposalId = (String) propMap.get("id");
        
        // 3. Get Offer
        HttpRequest getOffersReq = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/proposals/" + proposalId + "/offers"))
                .header("Authorization", "Bearer " + clientToken)
                .GET()
                .build();
        HttpResponse<String> offersRes = httpClient.send(getOffersReq, HttpResponse.BodyHandlers.ofString());
        java.util.List<Map> offersList = objectMapper.readValue(offersRes.body(), java.util.List.class);
        String offerId = (String) offersList.get(0).get("id");

        // 4. Accept Offer -> Creates Project
        HttpRequest acceptReq = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/proposals/" + proposalId + "/offers/" + offerId + "/accept"))
                .header("Authorization", "Bearer " + clientToken)
                .POST(HttpRequest.BodyPublishers.noBody())
                .build();
        httpClient.send(acceptReq, HttpResponse.BodyHandlers.ofString());
        
        // 5. Get Project list for client
        HttpRequest getProjectsReq = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/projects"))
                .header("Authorization", "Bearer " + clientToken)
                .GET()
                .build();
        HttpResponse<String> getProjectsRes = httpClient.send(getProjectsReq, HttpResponse.BodyHandlers.ofString());
        java.util.List<Map> projectsList = objectMapper.readValue(getProjectsRes.body(), java.util.List.class);
        assertThat(projectsList).isNotEmpty();
        
        // Find the project matching our job
        Map targetProject = projectsList.stream().filter(p -> jobId.equals(p.get("jobId"))).findFirst().orElseThrow();
        String projectId = (String) targetProject.get("id");
        assertThat(targetProject.get("status")).isEqualTo("IN_PROGRESS");
        assertThat(targetProject.get("startedAt")).isNotNull();

        // 6. Freelancer submits project
        String submitJson = "{\"status\": \"SUBMITTED\"}";
        HttpRequest submitReq = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/projects/" + projectId + "/status"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + freeToken)
                .POST(HttpRequest.BodyPublishers.ofString(submitJson))
                .build();
        HttpResponse<String> submitRes = httpClient.send(submitReq, HttpResponse.BodyHandlers.ofString());
        assertThat(submitRes.statusCode()).isEqualTo(200);

        // 7. Client completes project
        String completeJson = "{\"status\": \"COMPLETED\"}";
        HttpRequest completeReq = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/projects/" + projectId + "/status"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + clientToken)
                .POST(HttpRequest.BodyPublishers.ofString(completeJson))
                .build();
        HttpResponse<String> completeRes = httpClient.send(completeReq, HttpResponse.BodyHandlers.ofString());
        assertThat(completeRes.statusCode()).isEqualTo(200);
        
        Map completedProject = objectMapper.readValue(completeRes.body(), Map.class);
        assertThat(completedProject.get("status")).isEqualTo("COMPLETED");
        assertThat(completedProject.get("completedAt")).isNotNull();
        
        // 8. Verify Job is CLOSED
        HttpRequest getJobReq = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/jobs/" + jobId))
                .GET()
                .build();
        HttpResponse<String> jobResFinal = httpClient.send(getJobReq, HttpResponse.BodyHandlers.ofString());
        Map jobFinalMap = objectMapper.readValue(jobResFinal.body(), Map.class);
        assertThat(jobFinalMap.get("status")).isEqualTo("CLOSED");
    }
}
