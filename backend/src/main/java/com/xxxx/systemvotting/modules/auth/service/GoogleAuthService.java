package com.xxxx.systemvotting.modules.auth.service;

import com.xxxx.systemvotting.modules.auth.dto.response.AuthResponseDTO;

public interface GoogleAuthService {
    AuthResponseDTO authenticateWithGoogle(String idTokenString);
}
