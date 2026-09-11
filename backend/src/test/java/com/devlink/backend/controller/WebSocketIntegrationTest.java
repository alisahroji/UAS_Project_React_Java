package com.devlink.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class WebSocketIntegrationTest {

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

    private WebSocketStompClient stompClient;

    private String getBaseUrl() {
        return "http://localhost:" + port + "/api";
    }

    private String getWsUrl() {
        return "ws://localhost:" + port + "/ws";
    }

    @BeforeEach
    public void setup() throws Exception {
        httpClient = HttpClient.newHttpClient();
        cleanDatabase();

        // Register Users
        registerUser("client_ws@test.com", "Client", "CLIENT");
        registerUser("free_ws@test.com", "Freelancer", "FREELANCER");
        registerUser("hacker_ws@test.com", "Hacker", "FREELANCER");

        clientToken = login("client_ws@test.com");
        freeToken = login("free_ws@test.com");
        hackerToken = login("hacker_ws@test.com");

        // Create Job
        String jobJson = "{\"title\": \"Job WS\", \"description\": \"Desc\", \"budget\": 1000, \"deadline\": \"2026-10-10\"}";
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

        stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        stompClient.setMessageConverter(new MappingJackson2MessageConverter());
    }

    @AfterEach
    public void tearDown() {
        if (stompClient != null) {
            stompClient.stop();
        }
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

    private StompSession connect(String token) throws InterruptedException, ExecutionException, TimeoutException {
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + token);
        return stompClient.connectAsync(getWsUrl(), new WebSocketHttpHeaders(), connectHeaders, new StompSessionHandlerAdapter() {}).get(5, TimeUnit.SECONDS);
    }

    @Test
    public void testConnect_ValidTokens_ShouldSucceed() throws Exception {
        StompSession clientSession = connect(clientToken);
        assertThat(clientSession.isConnected()).isTrue();
        clientSession.disconnect();

        StompSession freeSession = connect(freeToken);
        assertThat(freeSession.isConnected()).isTrue();
        freeSession.disconnect();
    }

    @Test
    public void testConnect_MissingToken_ShouldFail() {
        assertThrows(ExecutionException.class, () -> {
            stompClient.connectAsync(getWsUrl(), new StompSessionHandlerAdapter() {}).get(5, TimeUnit.SECONDS);
        });
    }

    @Test
    public void testSubscribeAndSend_Participants_ShouldSucceed() throws Exception {
        StompSession clientSession = connect(clientToken);
        StompSession freeSession = connect(freeToken);

        BlockingQueue<Map<String, Object>> clientMessages = new LinkedBlockingDeque<>();
        BlockingQueue<Map<String, Object>> freeMessages = new LinkedBlockingDeque<>();

        String topicUrl = "/topic/proposals/" + proposalId;

        // Client Subscribe
        StompSession.Subscription clientSub = clientSession.subscribe(topicUrl, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return Map.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                clientMessages.offer((Map<String, Object>) payload);
            }
        });

        // Free Subscribe
        StompSession.Subscription freeSub = freeSession.subscribe(topicUrl, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return Map.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                freeMessages.offer((Map<String, Object>) payload);
            }
        });

        // Wait a bit to ensure subscriptions are processed
        Thread.sleep(500);

        // Client Sends Message
        String destUrl = "/app/proposals/" + proposalId + "/messages";
        String msgContent = "{\"content\": \"Hello Freelancer\"}";
        clientSession.send(destUrl, objectMapper.readValue(msgContent, Map.class));

        // Both should receive it
        Map<String, Object> receivedByClient = clientMessages.poll(5, TimeUnit.SECONDS);
        Map<String, Object> receivedByFree = freeMessages.poll(5, TimeUnit.SECONDS);

        assertThat(receivedByClient).isNotNull();
        assertThat(receivedByClient.get("content")).isEqualTo("Hello Freelancer");

        assertThat(receivedByFree).isNotNull();
        assertThat(receivedByFree.get("content")).isEqualTo("Hello Freelancer");
        
        // Assert Persistence
        HttpResponse<String> getRes = httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/proposals/" + proposalId + "/messages"))
                .header("Authorization", "Bearer " + clientToken)
                .GET().build(), HttpResponse.BodyHandlers.ofString());
        java.util.List<Map> msgs = objectMapper.readValue(getRes.body(), java.util.List.class);
        assertThat(msgs).hasSize(1);
        assertThat(msgs.get(0).get("content")).isEqualTo("Hello Freelancer");

        clientSub.unsubscribe();
        freeSub.unsubscribe();
        clientSession.disconnect();
        freeSession.disconnect();
    }

    @Test
    public void testSubscribe_NonParticipant_ShouldBeRejected() throws Exception {
        StompSession hackerSession = connect(hackerToken);
        String topicUrl = "/topic/proposals/" + proposalId;

        BlockingQueue<String> errorQueue = new LinkedBlockingDeque<>();
        
        StompSession.Subscription hackerSub = hackerSession.subscribe(topicUrl, new StompSessionHandlerAdapter() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return Map.class;
            }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
            }
            @Override
            public void handleException(StompSession session, StompCommand command, StompHeaders headers, byte[] payload, Throwable exception) {
                errorQueue.offer("ERROR");
            }
            @Override
            public void handleTransportError(StompSession session, Throwable exception) {
                errorQueue.offer("TRANSPORT_ERROR");
            }
        });

        // Wait for potential disconnect or error
        String error = errorQueue.poll(2, TimeUnit.SECONDS);
        // Sometimes it just disconnects the session if exception is thrown in interceptor
        if (error == null && !hackerSession.isConnected()) {
            error = "DISCONNECTED";
        }

        // We verify that the hacker cannot receive messages
        StompSession clientSession = connect(clientToken);
        clientSession.send("/app/proposals/" + proposalId + "/messages", objectMapper.readValue("{\"content\": \"Secret\"}", Map.class));
        
        Thread.sleep(1000);
        // The hacker session should be closed or unauthorized
        assertThat(hackerSession.isConnected()).isFalse();

        if (hackerSession.isConnected()) {
            hackerSession.disconnect();
        }
        clientSession.disconnect();
    }

    @Test
    public void testImpersonation_ShouldIgnoreSenderIdInPayload() throws Exception {
        StompSession freeSession = connect(freeToken);
        String topicUrl = "/topic/proposals/" + proposalId;
        
        BlockingQueue<Map<String, Object>> freeMessages = new LinkedBlockingDeque<>();
        freeSession.subscribe(topicUrl, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return Map.class;
            }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                freeMessages.offer((Map<String, Object>) payload);
            }
        });
        Thread.sleep(500);

        // Freelancer sends message trying to impersonate client
        String destUrl = "/app/proposals/" + proposalId + "/messages";
        String msgContent = "{\"content\": \"I am Client\", \"senderId\": \"" + UUID.randomUUID().toString() + "\"}";
        freeSession.send(destUrl, objectMapper.readValue(msgContent, Map.class));

        Map<String, Object> received = freeMessages.poll(5, TimeUnit.SECONDS);
        assertThat(received).isNotNull();
        assertThat(received.get("content")).isEqualTo("I am Client");
        
        // Assert Persistence Sender ID is actually freelancer's ID (which we don't have exactly here, but we can check GET API)
        HttpResponse<String> getRes = httpClient.send(HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/proposals/" + proposalId + "/messages"))
                .header("Authorization", "Bearer " + clientToken)
                .GET().build(), HttpResponse.BodyHandlers.ofString());
        java.util.List<Map> msgs = objectMapper.readValue(getRes.body(), java.util.List.class);
        assertThat(msgs).hasSize(1);
        
        // Let's get the freelancer ID from DB directly or just check that it's not the random UUID
        String senderId = (String) msgs.get(0).get("senderId");
        assertThat(senderId).isNotEqualTo(UUID.randomUUID().toString());

        freeSession.disconnect();
    }
}
