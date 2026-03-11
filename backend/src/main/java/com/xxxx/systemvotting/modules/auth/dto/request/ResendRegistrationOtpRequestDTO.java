package com.xxxx.systemvotting.modules.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResendRegistrationOtpRequestDTO {
    @NotBlank(message = "Email is required")
    @Email(message = "Email is invalid")
    private String email;
}
