package com.devlink.backend.security;

import com.devlink.backend.dto.CreateJobRequest;
import com.devlink.backend.entity.User;
import com.devlink.backend.entity.enums.UserRole;
import com.devlink.backend.repository.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class SecurityIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${jwt.secret}")
    private String jwtSecret;

    private CreateJobRequest buildValidJobRequest() {
        CreateJobRequest req = new CreateJobRequest();
        req.setTitle("Test Job");
        req.setDescription("Description");
        req.setBudget(new BigDecimal("1000"));
        req.setDeadline(java.sql.Date.valueOf("2026-10-10"));
        return req;
    }

    private User createAndSaveUser(String email, UserRole role) {
        if (userRepository.findByEmail(email).isPresent()) {
            return userRepository.findByEmail(email).get();
        }
        User user = new User("Test User", email, passwordEncoder.encode("password"), role);
        return userRepository.save(user);
    }

    private String generateTestToken(String email, int expirationMs) {
        SecretKey key = Keys.hmacShaKeyFor(io.jsonwebtoken.io.Decoders.BASE64.decode(jwtSecret));
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key)
                .compact();
    }

    private final HttpClient httpClient = HttpClient.newHttpClient();

    private String getBaseUrl() {
        return "http://localhost:" + port + "/api/jobs";
    }

    private String buildValidJobRequestJson() {
        return "{\"title\":\"Test Job\", \"description\":\"Description\", \"budget\":1000, \"deadline\":\"2026-10-10\"}";
    }

    @Test
    public void testMissingAuthorization_Returns401() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl()))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(buildValidJobRequestJson()))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        assertThat(response.statusCode()).isEqualTo(401);
        assertThat(response.body()).contains("\"error\":\"Unauthorized\"");
    }

    @Test
    public void testMalformedJwt_Returns401() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl()))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer not-a-real-jwt")
                .POST(HttpRequest.BodyPublishers.ofString(buildValidJobRequestJson()))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        assertThat(response.statusCode()).isEqualTo(401);
        assertThat(response.body()).contains("\"error\":\"Unauthorized\"");
    }

    @Test
    public void testInvalidSignatureJwt_Returns401() throws Exception {
        String invalidSecret = "505E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
        SecretKey wrongKey = Keys.hmacShaKeyFor(io.jsonwebtoken.io.Decoders.BASE64.decode(invalidSecret));
        
        String fakeToken = Jwts.builder()
                .subject("test@test.com")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 10000))
                .signWith(wrongKey)
                .compact();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl()))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + fakeToken)
                .POST(HttpRequest.BodyPublishers.ofString(buildValidJobRequestJson()))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        assertThat(response.statusCode()).isEqualTo(401);
        assertThat(response.body()).contains("\"error\":\"Unauthorized\"");
    }

    @Test
    public void testExpiredJwt_Returns401() throws Exception {
        User user = createAndSaveUser("expired@test.com", UserRole.CLIENT);
        String expiredToken = generateTestToken(user.getEmail(), -1000); // Expired 1 second ago

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl()))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + expiredToken)
                .POST(HttpRequest.BodyPublishers.ofString(buildValidJobRequestJson()))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        assertThat(response.statusCode()).isEqualTo(401);
        assertThat(response.body()).contains("\"error\":\"Unauthorized\"");
    }

    @Test
    public void testAuthenticatedUser_WithoutPermission_Returns403() throws Exception {
        User freelancer = createAndSaveUser("freelancer2@test.com", UserRole.FREELANCER);
        String token = generateTestToken(freelancer.getEmail(), 3600000);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl()))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .POST(HttpRequest.BodyPublishers.ofString(buildValidJobRequestJson()))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        assertThat(response.statusCode()).isEqualTo(403);
        assertThat(response.body()).contains("\"error\":\"Forbidden\"");
    }

    @Test
    public void testValidJwt_WithPermission_Returns201() throws Exception {
        User client = createAndSaveUser("client2@test.com", UserRole.CLIENT);
        String token = generateTestToken(client.getEmail(), 3600000);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl()))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .POST(HttpRequest.BodyPublishers.ofString(buildValidJobRequestJson()))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        assertThat(response.statusCode()).isEqualTo(201);
        assertThat(response.body()).contains("\"title\":\"Test Job\"");
    }
}
