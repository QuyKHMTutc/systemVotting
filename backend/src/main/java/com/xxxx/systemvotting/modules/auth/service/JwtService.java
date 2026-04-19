package com.xxxx.systemvotting.modules.auth.service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;
import com.xxxx.systemvotting.modules.auth.dto.response.TokenDetails;
import com.xxxx.systemvotting.modules.user.entity.User;

import java.text.ParseException;
import java.util.Set;

public interface JwtService {

    String generateAccessToken(User user, Set<String> roles);

    TokenDetails generateRefreshToken(String userId);

    SignedJWT validateToken(String token) throws ParseException, JOSEException;
}
