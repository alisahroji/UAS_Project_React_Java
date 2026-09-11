package com.devlink.backend.dto;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.util.List;
import java.util.UUID;

public class JobDto {

    private UUID id;
    private String title;
    private String description;
    private BigDecimal budget;
    private String status;
    private List<String> requiredSkills;

    // Enhanced fields — DTO projection only (not new entity fields)
    private Date deadline;
    private Timestamp createdAt;
    private String clientName;
    private UUID clientId;

    // All-args constructor (demonstrating Encapsulation via 'this' usage)
    public JobDto(UUID id, String title, String description, BigDecimal budget, String status,
                  List<String> requiredSkills, Date deadline, Timestamp createdAt, String clientName,
                  UUID clientId) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.budget = budget;
        this.status = status;
        this.requiredSkills = requiredSkills;
        this.deadline = deadline;
        this.createdAt = createdAt;
        this.clientName = clientName;
        this.clientId = clientId;
    }

    public JobDto() {
    }

    // Getters and Setters demonstrating Encapsulation

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getBudget() {
        return budget;
    }

    public void setBudget(BigDecimal budget) {
        this.budget = budget;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<String> getRequiredSkills() {
        return requiredSkills;
    }

    public void setRequiredSkills(List<String> requiredSkills) {
        this.requiredSkills = requiredSkills;
    }

    public Date getDeadline() {
        return deadline;
    }

    public void setDeadline(Date deadline) {
        this.deadline = deadline;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public UUID getClientId() {
        return clientId;
    }

    public void setClientId(UUID clientId) {
        this.clientId = clientId;
    }
}
