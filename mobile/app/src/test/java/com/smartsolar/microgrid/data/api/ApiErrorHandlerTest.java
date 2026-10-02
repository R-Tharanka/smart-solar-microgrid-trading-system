package com.smartsolar.microgrid.data.api;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;

import org.junit.Test;

public class ApiErrorHandlerTest {
    @Test
    public void fromHttpResponse_keepsStableCodeButHidesRawServerDetail() {
        String problemDetails = "{\"errorCode\":\"USER_NOT_FOUND\","
                + "\"detail\":\"Sensitive database detail\"}";

        ApiError error = ApiErrorHandler.fromHttpResponse(404, problemDetails);

        assertEquals("USER_NOT_FOUND", error.getErrorCode());
        assertEquals(404, error.getStatusCode());
        assertFalse(error.getUserMessage().contains("Sensitive database detail"));
    }

    @Test
    public void fromHttpResponse_handlesMalformedErrorBody() {
        ApiError error = ApiErrorHandler.fromHttpResponse(500, "not-json");

        assertEquals("HTTP_ERROR", error.getErrorCode());
        assertEquals("The server is temporarily unavailable. Please try again later.",
                error.getUserMessage());
    }

    @Test
    public void fromHttpResponse_explainsPendingActivation() {
        ApiError error = ApiErrorHandler.fromHttpResponse(403,
                "{\"errorCode\":\"AUTH_ACCOUNT_PENDING\"}");

        assertEquals("AUTH_ACCOUNT_PENDING", error.getErrorCode());
        assertEquals("Your registration is awaiting Backoffice activation. Please try again after it has been approved.",
                error.getUserMessage());
    }
}
