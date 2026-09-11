package com.devlink.backend.controller;

import com.devlink.backend.dto.AuthResponse;
import com.devlink.backend.dto.LoginRequest;
import com.devlink.backend.dto.RegisterRequest;
import com.devlink.backend.dto.UserDto;
import com.devlink.backend.exception.BusinessRuleException;
import com.devlink.backend.service.AuthService;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

public class AuthControllerTest {

    private static Validator validator;

    @BeforeAll
    public static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    public void testRegister_InvalidEmail_Validation() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Web Dev");
        req.setEmail("not-an-email"); // Invalid
        req.setPassword("secret");
        req.setRole("FREELANCER");

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(req);
        
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).isEqualTo("Email should be valid");
    }

    @Test
    public void testRegister_Valid() {
        AuthService authService = mock(AuthService.class);
        AuthController controller = new AuthController(authService);

        RegisterRequest req = new RegisterRequest();
        req.setName("Web Dev");
        req.setEmail("dev@test.com");
        req.setPassword("secret");
        req.setRole("FREELANCER");

        UserDto expectedUser = new UserDto();
        expectedUser.setEmail("dev@test.com");
        when(authService.registerUser(req)).thenReturn(expectedUser);

        ResponseEntity<UserDto> response = controller.registerUser(req);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().getEmail()).isEqualTo("dev@test.com");
    }

    @Test
    public void testLogin_Valid() {
        AuthService authService = mock(AuthService.class);
        AuthController controller = new AuthController(authService);

        LoginRequest req = new LoginRequest();
        req.setEmail("client1@test.com");
        req.setPassword("password");

        AuthResponse expectedResponse = new AuthResponse();
        expectedResponse.setToken("fake-jwt-token");
        when(authService.authenticateUser(req)).thenReturn(expectedResponse);

        ResponseEntity<AuthResponse> response = controller.authenticateUser(req);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getToken()).isEqualTo("fake-jwt-token");
    }
}
