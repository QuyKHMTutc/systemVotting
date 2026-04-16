package com.xxxx.systemvotting.modules.auth.service;

import com.xxxx.systemvotting.modules.auth.dto.request.LoginRequest;
import com.xxxx.systemvotting.modules.auth.dto.response.LoginResponse;

public interface AuthenticationService {
    LoginResponse login(LoginRequest request);
    LoginResponse refreshToken(String refreshToken);
    void logout(String refreshToken) throws Exception;
}
