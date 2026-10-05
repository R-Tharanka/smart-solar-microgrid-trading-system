package com.smartsolar.microgrid.data.transaction;

public class QrTransactionResponse {
    private String reservationCode;
    private String qrPayload;
    private String expiresAtUtc;

    public String getReservationCode() { return reservationCode; }
    public String getQrPayload() { return qrPayload; }
    public String getExpiresAtUtc() { return expiresAtUtc; }
}
