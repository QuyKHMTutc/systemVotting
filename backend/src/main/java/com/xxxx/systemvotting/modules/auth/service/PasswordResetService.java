package com.xxxx.systemvotting.modules.auth.service;

public interface PasswordResetService {
    void processForgotPassword(String email);

    void resetPassword(String email, String otp, String newPassword);
}
