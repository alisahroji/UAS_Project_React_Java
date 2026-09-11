package com.devlink.backend;

import com.devlink.backend.dto.AuthResponse;
import com.devlink.backend.dto.LoginRequest;
import com.devlink.backend.dto.RegisterRequest;
import com.devlink.backend.dto.UserDto;
import com.devlink.backend.entity.User;
import com.devlink.backend.entity.enums.UserRole;
import com.devlink.backend.exception.BusinessRuleException;
import com.devlink.backend.repository.UserRepository;
import com.devlink.backend.security.CustomUserDetails;
import com.devlink.backend.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Test
    public void testRegister_Valid() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Test User");
        req.setEmail("test@test.com");
        req.setPassword("pass");
        req.setRole("CLIENT");

        UserDto created = authService.registerUser(req);
        assertThat(created.getId()).isNotNull();
        assertThat(created.getEmail()).isEqualTo("test@test.com");
        assertThat(created.getRole()).isEqualTo("CLIENT");

        User saved = userRepository.findByEmail("test@test.com").get();
        // Password MUST be hashed, not plaintext
        assertThat(saved.getPassword()).isNotEqualTo("pass");
    }

    @Test
    public void testRegister_DuplicateEmail() {
        User user = new User("Old", "dup@test.com", "pass", UserRole.FREELANCER);
        userRepository.save(user);

        RegisterRequest req = new RegisterRequest();
        req.setName("New");
        req.setEmail("dup@test.com");
        req.setPassword("pass");
        req.setRole("CLIENT");

        assertThatThrownBy(() -> authService.registerUser(req))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Email is already in use");
    }

    @Test
    public void testRegister_InvalidRole() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Test");
        req.setEmail("invalid@test.com");
        req.setPassword("pass");
        req.setRole("ADMIN"); // Invalid role for this app

        assertThatThrownBy(() -> authService.registerUser(req))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Invalid role");
    }

    @Test
    public void testLogin_Valid() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Login User");
        req.setEmail("login@test.com");
        req.setPassword("pass123");
        req.setRole("FREELANCER");
        authService.registerUser(req);

        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail("login@test.com");
        loginReq.setPassword("pass123");

        AuthResponse res = authService.authenticateUser(loginReq);
        assertThat(res.getToken()).isNotNull();
        assertThat(res.getUser().getEmail()).isEqualTo("login@test.com");
    }

    @Test
    public void testGetCurrentUser_Valid() {
        User user = new User("Me", "me@test.com", "pass", UserRole.CLIENT);
        userRepository.save(user);
        
        CustomUserDetails userDetails = new CustomUserDetails(user);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        UserDto current = authService.getCurrentUser();
        assertThat(current.getEmail()).isEqualTo("me@test.com");
    }
}
