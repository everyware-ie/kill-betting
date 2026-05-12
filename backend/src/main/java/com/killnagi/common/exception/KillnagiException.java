package com.killnagi.common.exception;

import org.springframework.http.HttpStatus;

public class KillnagiException extends RuntimeException {

    private final HttpStatus status;

    public KillnagiException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public static KillnagiException notFound(String message) {
        return new KillnagiException(message, HttpStatus.NOT_FOUND);
    }

    public static KillnagiException badRequest(String message) {
        return new KillnagiException(message, HttpStatus.BAD_REQUEST);
    }

    public static KillnagiException unauthorized(String message) {
        return new KillnagiException(message, HttpStatus.UNAUTHORIZED);
    }

    public static KillnagiException forbidden(String message) {
        return new KillnagiException(message, HttpStatus.FORBIDDEN);
    }

    public static KillnagiException serverError(String message) {
        return new KillnagiException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
