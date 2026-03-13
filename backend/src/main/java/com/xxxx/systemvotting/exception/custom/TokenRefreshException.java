package com.xxxx.systemvotting.exception.custom;

/**
 * Thrown when refresh token is invalid or expired.
 * Do not include the token in the message to avoid leaking it in API responses.
 */
public class TokenRefreshException extends RuntimeException {
    public TokenRefreshException(String message) {
        super(message);
    }

    /**
     * @deprecated Use {@link #TokenRefreshException(String)} to avoid exposing the token.
     */
    @Deprecated
    public TokenRefreshException(String token, String message) {
        super(message);
    }
}
