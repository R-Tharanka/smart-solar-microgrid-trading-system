package com.smartsolar.microgrid.data.transaction;

/**
 * Process-memory-only handoff for a scanned QR payload. The value is consumed once and is
 * deliberately never written to a Bundle, SharedPreferences, SQLite, a file, or a log.
 */
public final class EphemeralQrPayloadStore {
    private static QrPayload pendingPayload;

    private EphemeralQrPayloadStore() {
    }

    public static synchronized void put(QrPayload payload) {
        pendingPayload = payload;
    }

    public static synchronized QrPayload consume() {
        QrPayload payload = pendingPayload;
        pendingPayload = null;
        return payload;
    }

    public static synchronized void clear() {
        pendingPayload = null;
    }
}
