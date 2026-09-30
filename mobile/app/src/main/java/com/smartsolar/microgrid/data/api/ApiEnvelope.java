package com.smartsolar.microgrid.data.api;

public class ApiEnvelope<T> {
    private T data;
    private String message;

    public T getData() {
        return data;
    }

    public String getMessage() {
        return message;
    }
}
