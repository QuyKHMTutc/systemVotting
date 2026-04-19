package com.xxxx.systemvotting.modules.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ResendRegistrationOtpRequestDTO(

    @NotBlank(message = "Email is required")
    @Email(message = "Email is invalid")
    String email

) {}
