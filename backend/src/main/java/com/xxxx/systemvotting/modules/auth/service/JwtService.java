package com.xxxx.systemvotting.modules.auth.service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;
import com.xxxx.systemvotting.common.dto.TokenDetails;

import java.text.ParseException;
import java.util.Set;

public interface JwtService {
    String generateAccessToken(String userId, Set<String> roles);
    TokenDetails generateRefreshToken(String userId);
    SignedJWT validateToken(String token) throws ParseException, JOSEException;
}
