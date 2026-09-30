package com.smartsolar.microgrid.data.api;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

public final class ApiErrorHandler {
    private ApiErrorHandler() {
    }

    public static ApiError fromHttpResponse(int statusCode, String responseBody) {
        String errorCode = readErrorCode(responseBody);
        return new ApiError(statusCode, errorCode, messageForStatus(statusCode));
    }

    public static ApiError networkError() {
        return new ApiError(0, "NETWORK_ERROR",
                "Unable to reach the server. Check your connection and try again.");
    }

    public static ApiError invalidResponse() {
        return new ApiError(0, "INVALID_RESPONSE",
                "The server returned an unexpected response. Please try again.");
    }

    public static ApiError sessionRequired() {
        return new ApiError(401, "AUTH_SESSION_REQUIRED",
                "Your session has expired. Please sign in again.");
    }

    private static String readErrorCode(String responseBody) {
        if (responseBody == null || responseBody.trim().isEmpty()) {
            return "HTTP_ERROR";
        }

        try {
            JsonObject problem = JsonParser.parseString(responseBody).getAsJsonObject();
            if (problem.has("errorCode") && !problem.get("errorCode").isJsonNull()) {
                return problem.get("errorCode").getAsString();
            }
        } catch (RuntimeException ignored) {
            // The UI receives a safe generic error when Problem Details is malformed.
        }
        return "HTTP_ERROR";
    }

    private static String messageForStatus(int statusCode) {
        switch (statusCode) {
            case 400:
                return "The request could not be completed. Check the information and try again.";
            case 401:
                return "Your session is invalid or has expired. Please sign in again.";
            case 403:
                return "You do not have permission to perform this action.";
            case 404:
                return "The requested information could not be found.";
            case 409:
                return "The request conflicts with the current server state.";
            default:
                if (statusCode >= 500) {
                    return "The server is temporarily unavailable. Please try again later.";
                }
                return "The request could not be completed. Please try again.";
        }
    }
}
