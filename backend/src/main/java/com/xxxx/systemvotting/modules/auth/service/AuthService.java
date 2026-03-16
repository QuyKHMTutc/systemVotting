package com.xxxx.systemvotting.modules.auth.service;

import com.xxxx.systemvotting.modules.auth.dto.request.AuthRequestDTO;
import com.xxxx.systemvotting.modules.auth.dto.response.AuthResponseDTO;
import com.xxxx.systemvotting.modules.auth.dto.request.TokenRefreshRequestDTO;

public interface AuthService {
    AuthResponseDTO login(AuthRequestDTO requestDTO);
    AuthResponseDTO refreshToken(TokenRefreshRequestDTO requestDTO);
    void logout(String accessToken);
}
