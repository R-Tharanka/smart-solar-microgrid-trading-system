package com.smartsolar.microgrid.data.transaction;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.google.gson.JsonParser;

/**
 * Temporary in-memory representation of the bearer-style value encoded in a transaction QR.
 * Parsing only validates its shape; the backend remains authoritative for validity and expiry.
 */
public final class QrPayload {
    private final String reservationCode;
    private final String transactionToken;
    private final String expiresAtUtc;

    private QrPayload(String reservationCode, String transactionToken, String expiresAtUtc) {
        this.reservationCode = reservationCode;
        this.transactionToken = transactionToken;
        this.expiresAtUtc = expiresAtUtc;
    }

    public static QrPayload parse(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("QR payload is required.");
        }

        try {
            JsonElement root = JsonParser.parseString(value);
            if (!root.isJsonObject()) {
                throw new IllegalArgumentException("QR payload must be a JSON object.");
            }

            JsonObject payload = root.getAsJsonObject();
            String reservationCode = requiredString(payload, "reservationCode");
            String transactionToken = requiredString(payload, "transactionToken");
            String expiresAtUtc = requiredString(payload, "expiresAtUtc");
            if (transactionToken.length() < 20) {
                throw new IllegalArgumentException("QR transaction token is incomplete.");
            }
            return new QrPayload(reservationCode, transactionToken, expiresAtUtc);
        } catch (JsonParseException | IllegalStateException exception) {
            throw new IllegalArgumentException("QR payload is not valid JSON.", exception);
        }
    }

    private static String requiredString(JsonObject payload, String name) {
        JsonElement value = payload.get(name);
        if (value == null || !value.isJsonPrimitive()
                || !value.getAsJsonPrimitive().isString()
                || value.getAsString().trim().isEmpty()) {
            throw new IllegalArgumentException("QR payload is missing " + name + ".");
        }
        return value.getAsString().trim();
    }

    public String getReservationCode() { return reservationCode; }
    public String getTransactionToken() { return transactionToken; }
    public String getExpiresAtUtc() { return expiresAtUtc; }
}
