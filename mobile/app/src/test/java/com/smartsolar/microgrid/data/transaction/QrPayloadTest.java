package com.smartsolar.microgrid.data.transaction;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertThrows;

import org.junit.After;
import org.junit.Test;

public class QrPayloadTest {
    private static final String TOKEN = "abcdefghijklmnopqrstuvwxyz123456";

    @After
    public void clearStore() {
        EphemeralQrPayloadStore.clear();
    }

    @Test
    public void parse_acceptsCanonicalStructureWithoutMakingExpiryDecisions() {
        QrPayload payload = QrPayload.parse("{\"reservationCode\":\"RSV-001\","
                + "\"transactionToken\":\"" + TOKEN + "\","
                + "\"expiresAtUtc\":\"2000-01-01T00:00:00Z\"}");

        assertEquals("RSV-001", payload.getReservationCode());
        assertEquals(TOKEN, payload.getTransactionToken());
        assertEquals("2000-01-01T00:00:00Z", payload.getExpiresAtUtc());
    }

    @Test
    public void parse_rejectsMissingExpiryAndIncompleteToken() {
        assertThrows(IllegalArgumentException.class, () -> QrPayload.parse(
                "{\"reservationCode\":\"RSV-001\",\"transactionToken\":\"" + TOKEN + "\"}"));
        assertThrows(IllegalArgumentException.class, () -> QrPayload.parse(
                "{\"reservationCode\":\"RSV-001\",\"transactionToken\":\"short\","
                        + "\"expiresAtUtc\":\"2026-10-05T00:00:00Z\"}"));
    }

    @Test
    public void ephemeralStore_consumesPayloadOnce() {
        QrPayload payload = QrPayload.parse("{\"reservationCode\":\"RSV-001\","
                + "\"transactionToken\":\"" + TOKEN + "\","
                + "\"expiresAtUtc\":\"2026-10-05T00:00:00Z\"}");
        EphemeralQrPayloadStore.put(payload);

        assertEquals(payload, EphemeralQrPayloadStore.consume());
        assertNull(EphemeralQrPayloadStore.consume());
    }
}
