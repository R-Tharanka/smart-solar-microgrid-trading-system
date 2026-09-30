package com.smartsolar.microgrid.data.api;

public class ApiError {
    private final int statusCode;
    private final String errorCode;
    private final String userMessage;

    public ApiError(int statusCode, String errorCode, String userMessage) {
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.userMessage = userMessage;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public String getUserMessage() {
        return userMessage;
    }
}
