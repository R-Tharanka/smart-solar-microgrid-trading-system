package com.smartsolar.microgrid.data.api;

public interface ApiCallback<T> {
    void onSuccess(T data, String message);

    void onError(ApiError error);
}
