package com.devlink.backend.controller;

import com.devlink.backend.dto.CreateJobRequest;
import com.devlink.backend.exception.BusinessRuleException;
import com.devlink.backend.exception.GlobalExceptionHandler;
import com.devlink.backend.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

public class JobControllerTest {

    private static Validator validator;

    @BeforeAll
    public static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    public void testCreateJob_EmptyTitle() {
        CreateJobRequest req = new CreateJobRequest();
        req.setTitle("");
        req.setDescription("Valid Description");
        req.setBudget(new BigDecimal("1000"));
        req.setDeadline(java.sql.Date.valueOf("2026-10-10"));

        Set<ConstraintViolation<CreateJobRequest>> violations = validator.validate(req);
        
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).isEqualTo("Title is required");
    }

    @Test
    public void testCreateJob_NegativeBudget() {
        CreateJobRequest req = new CreateJobRequest();
        req.setTitle("Valid Title");
        req.setDescription("Valid Description");
        req.setBudget(new BigDecimal("-100"));
        req.setDeadline(java.sql.Date.valueOf("2026-10-10"));

        Set<ConstraintViolation<CreateJobRequest>> violations = validator.validate(req);
        
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).isEqualTo("Budget must be greater than 0");
    }

    @Test
    public void testGlobalExceptionHandler_NotFound() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        ResourceNotFoundException ex = new ResourceNotFoundException("Job not found");
        HttpServletRequest request = new MockHttpServletRequest("GET", "/api/jobs/123");

        ResponseEntity<Map<String, Object>> response = handler.handleResourceNotFoundException(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().get("error")).isEqualTo("Not Found");
        assertThat(response.getBody().get("message")).isEqualTo("Job not found");
    }

    @Test
    public void testGlobalExceptionHandler_Conflict() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        BusinessRuleException ex = new BusinessRuleException("Cannot delete job");
        HttpServletRequest request = new MockHttpServletRequest("DELETE", "/api/jobs/123");

        ResponseEntity<Map<String, Object>> response = handler.handleBusinessRuleException(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().get("error")).isEqualTo("Conflict");
        assertThat(response.getBody().get("message")).isEqualTo("Cannot delete job");
    }
}
