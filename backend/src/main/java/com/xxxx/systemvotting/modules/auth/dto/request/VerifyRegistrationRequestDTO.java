package com.xxxx.systemvotting.modules.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

public record VerifyRegistrationRequestDTO(
    @NotBlank(message = "Email is required")
    @Email(message = "Email is invalid")
    String email,

    @NotBlank(message = "OTP is required")
    String otp
) {}
