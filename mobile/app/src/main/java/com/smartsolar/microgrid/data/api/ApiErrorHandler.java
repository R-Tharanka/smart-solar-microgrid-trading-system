package com.smartsolar.microgrid.data.api;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

public final class ApiErrorHandler {
    private ApiErrorHandler() {
    }

    public static ApiError fromHttpResponse(int statusCode, String responseBody) {
        String errorCode = readErrorCode(responseBody);
        return new ApiError(statusCode, errorCode, messageForError(statusCode, errorCode));
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

    private static String messageForError(int statusCode, String errorCode) {
        switch (errorCode) {
            case "AUTH_INVALID_CREDENTIALS":
                return "The identifier or password is incorrect.";
            case "AUTH_ACCOUNT_INACTIVE":
                return "This account is not active. Contact an administrator.";
            case "AUTH_ACCOUNT_PENDING":
                return "Your registration is awaiting Backoffice activation. Please try again after it has been approved.";
            case "AUTH_REGISTRATION_REJECTED":
                return "Your registration was rejected. You can register again with corrected details for review.";
            case "AUTH_ACCOUNT_DEACTIVATED":
                return "Your account has been deactivated. Please contact Backoffice for assistance.";
            case "AUTH_CLIENT_ROLE_FORBIDDEN":
                return "Backoffice accounts are accessed through the web application.";
            case "USER_NIC_EXISTS":
                return "An account already exists with this NIC.";
            case "USER_EMAIL_EXISTS":
                return "An account already exists with this email address.";
            case "USER_IDENTIFIER_EXISTS":
                return "An account already exists with these details.";
            case "USER_ACTIVE_RESERVATIONS":
                return "The account cannot be deactivated while it has active reservations.";
            case "USER_DEACTIVATION_ALREADY_REQUESTED":
                return "Your deactivation request is already pending Backoffice review. Your account remains active.";
            case "QR_TOKEN_INVALID":
                return "This QR code is invalid or has been replaced. Ask the Prosumer to generate a new code.";
            case "QR_EXPIRED":
            case "QR_WINDOW_EXPIRED":
                return "This QR code has expired. Ask the Prosumer to generate a new code.";
            case "QR_STATUS_INVALID":
            case "QR_VERIFY_CONFLICT":
                return "This QR transaction is no longer available for verification.";
            case "FINALIZE_STATUS_INVALID":
            case "FINALIZE_CONFLICT":
                return "This energy transfer can no longer be finalized.";
            case "TRANSFER_ENERGY_INVALID":
                return "Enter a transferred energy amount within the reserved quantity.";
            default:
                break;
        }

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
