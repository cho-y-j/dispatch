package com.dispatch.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class CustomException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public CustomException(String message, HttpStatus status) {
        super(message);
        this.status = status;
        this.code = status.name();
    }

    public CustomException(String message, HttpStatus status, String code) {
        super(message);
        this.status = status;
        this.code = code;
    }

    // 자주 사용되는 예외 팩토리 메서드
    public static CustomException notFound(String message) {
        return new CustomException(message, HttpStatus.NOT_FOUND, "NOT_FOUND");
    }

    public static CustomException badRequest(String message) {
        return new CustomException(message, HttpStatus.BAD_REQUEST, "BAD_REQUEST");
    }

    public static CustomException unauthorized(String message) {
        return new CustomException(message, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
    }

    public static CustomException forbidden(String message) {
        return new CustomException(message, HttpStatus.FORBIDDEN, "FORBIDDEN");
    }

    public static CustomException conflict(String message) {
        return new CustomException(message, HttpStatus.CONFLICT, "CONFLICT");
    }

    public static CustomException serverError(String message) {
        return new CustomException(message, HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR");
    }
}
