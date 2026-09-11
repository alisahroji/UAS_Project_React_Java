package com.devlink.backend.entity;

import com.devlink.backend.entity.enums.ProjectStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.sql.Timestamp;

@Entity
@Table(name = "projects")
public class Project extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposal_id", nullable = false, unique = true)
    private Proposal proposal;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal agreedPrice;

    @Column(nullable = false)
    private Integer agreedDurationDays;

    @Column(nullable = false)
    private String title;

    /*
     * Client's revision reason (Step: final bug fixes). Set when the client
     * requests a revision (SUBMITTED -> REVISION); consumed/displayed by the
     * freelancer. Nullable — only populated for revision transitions.
     */
    @Column(length = 1000)
    private String revisionMessage;

    @Column(nullable = false)
    private Timestamp deadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectStatus status = ProjectStatus.IN_PROGRESS;

    private Timestamp startedAt;

    private Timestamp completedAt;

    public Project() {
    }

    public Project(Proposal proposal, BigDecimal agreedPrice, Integer agreedDurationDays, String title, Timestamp deadline) {
        this.proposal = proposal;
        this.agreedPrice = agreedPrice;
        this.agreedDurationDays = agreedDurationDays;
        this.title = title;
        this.deadline = deadline;
    }

    public Proposal getProposal() {
        return proposal;
    }

    public void setProposal(Proposal proposal) {
        this.proposal = proposal;
    }

    public BigDecimal getAgreedPrice() {
        return agreedPrice;
    }

    public void setAgreedPrice(BigDecimal agreedPrice) {
        this.agreedPrice = agreedPrice;
    }

    public Integer getAgreedDurationDays() {
        return agreedDurationDays;
    }

    public void setAgreedDurationDays(Integer agreedDurationDays) {
        this.agreedDurationDays = agreedDurationDays;
    }

    public String getRevisionMessage() {
        return revisionMessage;
    }

    public void setRevisionMessage(String revisionMessage) {
        this.revisionMessage = revisionMessage;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Timestamp getDeadline() {
        return deadline;
    }

    public void setDeadline(Timestamp deadline) {
        this.deadline = deadline;
    }

    public ProjectStatus getStatus() {
        return status;
    }

    public void setStatus(ProjectStatus status) {
        this.status = status;
    }

    public Timestamp getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Timestamp startedAt) {
        this.startedAt = startedAt;
    }

    public Timestamp getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Timestamp completedAt) {
        this.completedAt = completedAt;
    }
}
