package com.xxxx.systemvotting.modules.auth.service.impl;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.xxxx.systemvotting.exception.ErrorCode;
import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.modules.auth.dto.response.TokenDetails;
import com.xxxx.systemvotting.modules.auth.enums.TokenType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Set;
import java.util.Set;
import java.util.UUID;
import com.xxxx.systemvotting.modules.user.entity.User;

@Service
public class JwtService {

    @Value("${JWT_SECRET_KEY}")
    private String secretKey;

    private static final String JWT_ISSUER = "SystemVotting";
    private static final String ROLES = "roles";
    private static final String TOKEN_TYPE = "token_type";

    public String generateAccessToken(User user, Set<String> roles) {
        // Header
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        Date issueTime = new Date();
        Date expiredTime = new Date(Instant.now().plus(2, ChronoUnit.HOURS).toEpochMilli());
        String jwtId = UUID.randomUUID().toString();

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(user.getId().toString())
                .issuer(JWT_ISSUER)
                .claim(ROLES, roles)
                .claim("username", user.getUsername())
                .claim("email", user.getEmail())
                .claim("avatarUrl", user.getAvatarUrl())
                .issueTime(issueTime)
                .expirationTime(expiredTime)
                .jwtID(jwtId)
                .claim(TOKEN_TYPE, TokenType.ACCESS_TOKEN)
                .build();

        // Payload
        Payload payload = new Payload(claimsSet.toJSONObject());

        // Signature
        JWSObject jwsObject = new JWSObject(header, payload);
        try {
            jwsObject.sign(new MACSigner(secretKey));
        } catch (JOSEException e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR); // Replaced UserServiceException with AppException
        }
        return jwsObject.serialize();
    }

    public TokenDetails generateRefreshToken(String userId) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        Date issueTime = new Date();
        Date expiredTime = new Date(Instant.now().plus(14, ChronoUnit.DAYS).toEpochMilli());
        long ttlSeconds = ChronoUnit.SECONDS.between(Instant.now(), expiredTime.toInstant());

        String jwtId = UUID.randomUUID().toString();

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(userId)
                .issuer(JWT_ISSUER)
                .issueTime(issueTime)
                .expirationTime(expiredTime)
                .claim(TOKEN_TYPE, TokenType.REFRESH_TOKEN)
                .jwtID(jwtId)
                .build();

        // Payload
        Payload payload = new Payload(claimsSet.toJSONObject());

        // Signature
        JWSObject jwsObject = new JWSObject(header, payload);
        try {
            jwsObject.sign(new MACSigner(secretKey));
        } catch (JOSEException e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR); // Replaced UserServiceException with AppException
        }
        String token = jwsObject.serialize();

        return TokenDetails.builder()
                .value(token)
                .jwtId(jwtId)
                .ttlSeconds(ttlSeconds)
                .build();
    }

    public SignedJWT validateToken(String token) throws ParseException, JOSEException {
        SignedJWT signedJWT = SignedJWT.parse(token);
        Date expiration = signedJWT.getJWTClaimsSet().getExpirationTime();

        if (expiration.before(new Date()))
            throw new AppException(ErrorCode.UNAUTHORIZED);

        boolean verify = signedJWT.verify(new MACVerifier(secretKey));
        if (!verify)
            throw new AppException(ErrorCode.UNAUTHORIZED);

        return signedJWT;
    }
}
