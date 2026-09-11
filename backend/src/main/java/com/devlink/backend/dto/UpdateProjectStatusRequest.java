package com.devlink.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateProjectStatusRequest {

    @NotBlank(message = "Status cannot be blank")
    private String status;

    /*
     * Optional reason/message. Required by business rule when a CLIENT requests
     * a revision (SUBMITTED -> REVISION); validated in ProjectServiceImpl.
     */
    private String message;

    public UpdateProjectStatusRequest() {
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
