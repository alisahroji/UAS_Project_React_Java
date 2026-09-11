package com.devlink.backend.dto;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.UUID;

public class ProposalOfferResponse {
    private UUID id;
    private UUID proposalId;
    private UUID offeredById;
    private String offeredByName;
    private BigDecimal price;
    private Integer durationDays;
    private String message;
    private String status;
    private Timestamp createdAt;

    public ProposalOfferResponse() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getProposalId() {
        return proposalId;
    }

    public void setProposalId(UUID proposalId) {
        this.proposalId = proposalId;
    }

    public UUID getOfferedById() {
        return offeredById;
    }

    public void setOfferedById(UUID offeredById) {
        this.offeredById = offeredById;
    }

    public String getOfferedByName() {
        return offeredByName;
    }

    public void setOfferedByName(String offeredByName) {
        this.offeredByName = offeredByName;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getDurationDays() {
        return durationDays;
    }

    public void setDurationDays(Integer durationDays) {
        this.durationDays = durationDays;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }
}
