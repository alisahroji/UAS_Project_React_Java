package com.devlink.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class ProposalRequest {

    @NotNull(message = "Initial price is required")
    @Min(value = 1, message = "Initial price must be greater than 0")
    private BigDecimal initialPrice;

    @NotNull(message = "Initial duration is required")
    @Min(value = 1, message = "Initial duration must be greater than 0")
    private Integer initialDurationDays;

    @NotBlank(message = "Cover letter is required")
    private String coverLetter;

    public ProposalRequest() {
    }

    public ProposalRequest(BigDecimal initialPrice, Integer initialDurationDays, String coverLetter) {
        this.initialPrice = initialPrice;
        this.initialDurationDays = initialDurationDays;
        this.coverLetter = coverLetter;
    }

    public BigDecimal getInitialPrice() {
        return initialPrice;
    }

    public void setInitialPrice(BigDecimal initialPrice) {
        this.initialPrice = initialPrice;
    }

    public Integer getInitialDurationDays() {
        return initialDurationDays;
    }

    public void setInitialDurationDays(Integer initialDurationDays) {
        this.initialDurationDays = initialDurationDays;
    }

    public String getCoverLetter() {
        return coverLetter;
    }

    public void setCoverLetter(String coverLetter) {
        this.coverLetter = coverLetter;
    }
}
