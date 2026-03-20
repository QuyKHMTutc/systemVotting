package com.xxxx.systemvotting.exception;

import org.springframework.http.HttpStatus;
import lombok.Getter;

@Getter
public enum ErrorCode {
    INTERNAL_SERVER_ERROR(500, "Unknown Exception", HttpStatus.INTERNAL_SERVER_ERROR),
    USER_EXISTED(400, "User already existed", HttpStatus.BAD_REQUEST),
    RESOURCE_NOT_FOUND(404, "Resource not found", HttpStatus.NOT_FOUND),
    INVALID_REQUEST(400, "Invalid request", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED(401, "Unauthorized", HttpStatus.UNAUTHORIZED),
    FORBIDDEN(403, "Forbidden", HttpStatus.FORBIDDEN),
    DUPLICATE_RESOURCE(409, "Duplicate resource", HttpStatus.CONFLICT),
    TOKEN_REFRESH_EXPIRED(403, "Refresh token is invalid or expired", HttpStatus.FORBIDDEN),
    RATE_LIMIT_EXCEEDED(429, "Rate limit exceeded", HttpStatus.TOO_MANY_REQUESTS);

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(int code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
