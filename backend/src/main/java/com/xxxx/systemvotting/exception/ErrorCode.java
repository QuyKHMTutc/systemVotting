package com.xxxx.systemvotting.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    INTERNAL_ERROR(500, "Unexpected error occurred while processing request in backend service", HttpStatus.INTERNAL_SERVER_ERROR),
    USER_ALREADY_EXISTS(400, "User already exists", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(404, "User not found", HttpStatus.NOT_FOUND),
    USER_NOT_VERIFIED(403, "User account is not verified. Please check your email for OTP.", HttpStatus.FORBIDDEN),
    USER_LOCKED(403, "User account is locked.", HttpStatus.FORBIDDEN),

    TOKEN_GENERATION_FAILED(500, "Failed to generate JWT token", HttpStatus.INTERNAL_SERVER_ERROR),
    TOKEN_EXPIRED(401, "JWT token has expired", HttpStatus.UNAUTHORIZED),
    TOKEN_INVALID(401, "Invalid JWT token", HttpStatus.UNAUTHORIZED),

    MISSING_LOGOUT_INFO(400, "Authorization header or refresh token is missing", HttpStatus.BAD_REQUEST),

    UNAUTHORIZED(401, "Unauthorized", HttpStatus.UNAUTHORIZED),
    INVALID_CREDENTIALS(401, "Invalid email or password", HttpStatus.UNAUTHORIZED),
    FORBIDDEN(403, "Forbidden", HttpStatus.FORBIDDEN),

    RESOURCE_NOT_FOUND(404, "Resource not found", HttpStatus.NOT_FOUND),
    INVALID_REQUEST(400, "Invalid request", HttpStatus.BAD_REQUEST),
    DUPLICATE_RESOURCE(409, "Duplicate resource", HttpStatus.CONFLICT),
    COMMENT_BLOCKED(400, "Comment was blocked by moderation", HttpStatus.BAD_REQUEST),
    POLL_BLOCKED(400, "Poll was blocked by moderation", HttpStatus.BAD_REQUEST),
    TOKEN_REFRESH_EXPIRED(403, "Refresh token is invalid or expired", HttpStatus.FORBIDDEN),
    RATE_LIMIT_EXCEEDED(429, "Rate limit exceeded", HttpStatus.TOO_MANY_REQUESTS);

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;
}
