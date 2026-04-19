package com.xxxx.systemvotting.exception;

import com.xxxx.systemvotting.common.dto.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.util.Date;
import java.util.List;

@RestControllerAdvice
@Slf4j(topic = "GLOBAL-EXCEPTION")
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAllExceptions(Exception ex, WebRequest request) {
        log.error("Exception occurred: ", ex);
        ErrorResponse response = buildErrorCodeResponse(ErrorCode.INTERNAL_ERROR, request);

        return ResponseEntity.status(ErrorCode.INTERNAL_ERROR.getHttpStatus()).body(response);
    }

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ErrorResponse> handleAppException(AppException exception, WebRequest request) {
        ErrorResponse response = ErrorResponse.builder()
                .code(exception.getErrorCode().getCode())
                .status(exception.getErrorCode().getHttpStatus().value())
                .error(exception.getErrorCode().getHttpStatus().getReasonPhrase())
                .message(exception.getMessage())
                .timestamp(new Date().getTime())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return ResponseEntity.status(exception.getErrorCode().getHttpStatus()).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException e, WebRequest request) {

        BindingResult bindingResult = e.getBindingResult();
        List<FieldError> fieldErrors = bindingResult.getFieldErrors();

        List<String> errors = fieldErrors.stream().map(FieldError::getDefaultMessage).toList();

        String message = errors.isEmpty()
                ? HttpStatus.BAD_REQUEST.getReasonPhrase()
                : (errors.size() > 1 ? String.valueOf(errors) : errors.getFirst());

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(new Date().getTime())
                .code(HttpStatus.BAD_REQUEST.value())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message(message)
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(AuthorizationDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAuthorizationDeniedException(WebRequest request) {
        ErrorResponse errorResponse = buildErrorCodeResponse(ErrorCode.FORBIDDEN, request);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }

    private ErrorResponse buildErrorCodeResponse(ErrorCode errorCode, WebRequest request) {
        return ErrorResponse.builder()
                .timestamp(new Date().getTime())
                .code(errorCode.getCode())
                .status(errorCode.getHttpStatus().value())
                .message(errorCode.getMessage())
                .error(errorCode.getHttpStatus().getReasonPhrase())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();
    }

}
