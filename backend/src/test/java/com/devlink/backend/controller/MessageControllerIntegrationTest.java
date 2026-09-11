package com.devlink.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class MessageControllerIntegrationTest {

    @LocalServerPort
    private int port;

    private ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private HttpClient httpClient;
    private String clientToken;
    private String freeToken;
    private String hackerToken;
    private String jobId;
    private String proposalId;

    private String getBaseUrl() {
        return "http://localhost:" + port + "/api";
    }

    @BeforeEach
    public void setup() throws Exception {
        httpClient = HttpClient.newHttpClient();
        cleanDatabase();

        // Register Users
        registerUser("client@test.com", "Client", "CLIENT");
        registerUser("freelancer@test.com", "Freelancer", "FREELANCER");
        registerUser("hacker@test.com", "Hacker", "FREELANCER");

        clientToken = login("client@test.com");
        freeToken = login("freelancer@test.com");
        hackerToken = login("hacker@test.com");

        // Create Job
        String jobJson = "{\"title\": \"Job 1\", \"description\": \"Desc\", \"budget\": 1000, \"deadline\": \"2026-10-10\"}";
        HttpResponse<String> jobRes = httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/jobs"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + clientToken)
                .POST(HttpRequest.BodyPublishers.ofString(jobJson))
                .build(), HttpResponse.BodyHandlers.ofString());
        jobId = (String) objectMapper.readValue(jobRes.body(), Map.class).get("id");

        // Create Proposal
        String proposalJson = "{\"initialPrice\": 1000, \"initialDurationDays\": 10, \"coverLetter\": \"Hi\"}";
        HttpResponse<String> propRes = httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/jobs/" + jobId + "/proposals"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + freeToken)
                .POST(HttpRequest.BodyPublishers.ofString(proposalJson))
                .build(), HttpResponse.BodyHandlers.ofString());
        proposalId = (String) objectMapper.readValue(propRes.body(), Map.class).get("id");
    }

    @AfterEach
    public void tearDown() {
        cleanDatabase();
    }

    private void cleanDatabase() {
        jdbcTemplate.execute("DELETE FROM messages");
        jdbcTemplate.execute("DELETE FROM reviews");
        jdbcTemplate.execute("DELETE FROM projects");
        jdbcTemplate.execute("DELETE FROM proposal_offers");
        jdbcTemplate.execute("DELETE FROM proposals");
        jdbcTemplate.execute("DELETE FROM jobs");
        jdbcTemplate.execute("DELETE FROM users");
    }

    private void registerUser(String email, String name, String role) throws Exception {
        String json = String.format("{\"email\": \"%s\", \"password\": \"pass\", \"name\": \"%s\", \"role\": \"%s\"}", email, name, role);
        httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/auth/register"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build(), HttpResponse.BodyHandlers.ofString());
    }

    private String login(String email) throws Exception {
        String json = String.format("{\"email\": \"%s\", \"password\": \"pass\"}", email);
        HttpResponse<String> res = httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build(), HttpResponse.BodyHandlers.ofString());
        return (String) objectMapper.readValue(res.body(), Map.class).get("token");
    }

    @Test
    public void testRestMessageFlow_SuccessAndRejection() throws Exception {
        // 1. Client Send Message
        String msg1 = "{\"content\": \"Hi Freelancer\"}";
        HttpResponse<String> res1 = httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/proposals/" + proposalId + "/messages"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + clientToken)
                .POST(HttpRequest.BodyPublishers.ofString(msg1))
                .build(), HttpResponse.BodyHandlers.ofString());
        if (res1.statusCode() != 201) {
            System.out.println("RES1 BODY: " + res1.body());
        }
        assertThat(res1.statusCode()).isEqualTo(201);
        String msgId = (String) objectMapper.readValue(res1.body(), Map.class).get("id");
        assertThat(msgId).isNotNull();

        // 2. Freelancer Send Message
        String msg2 = "{\"content\": \"Hi Client\"}";
        HttpResponse<String> res2 = httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/proposals/" + proposalId + "/messages"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + freeToken)
                .POST(HttpRequest.BodyPublishers.ofString(msg2))
                .build(), HttpResponse.BodyHandlers.ofString());
        assertThat(res2.statusCode()).isEqualTo(201);

        // 3. Hacker tries to send message
        HttpResponse<String> res3 = httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/proposals/" + proposalId + "/messages"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + hackerToken)
                .POST(HttpRequest.BodyPublishers.ofString(msg2))
                .build(), HttpResponse.BodyHandlers.ofString());
        assertThat(res3.statusCode()).isEqualTo(403);

        // 4. Client Get Messages
        HttpResponse<String> getRes = httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/proposals/" + proposalId + "/messages"))
                .header("Authorization", "Bearer " + clientToken)
                .GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(getRes.statusCode()).isEqualTo(200);
        java.util.List<Map> messages = objectMapper.readValue(getRes.body(), java.util.List.class);
        assertThat(messages).hasSize(2);
        assertThat(messages.get(0).get("content")).isEqualTo("Hi Freelancer");
        assertThat(messages.get(1).get("content")).isEqualTo("Hi Client");

        // 5. Hacker Get Messages
        HttpResponse<String> hackerGet = httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/proposals/" + proposalId + "/messages"))
                .header("Authorization", "Bearer " + hackerToken)
                .GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(hackerGet.statusCode()).isEqualTo(403);
    }
}
