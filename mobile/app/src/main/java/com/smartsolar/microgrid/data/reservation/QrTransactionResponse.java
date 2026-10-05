package com.smartsolar.microgrid.data.reservation;

public class QrTransactionResponse {
    private String reservationCode;
    private String qrPayload;
    private String expiresAtUtc;

    public String getReservationCode() { return reservationCode; }
    public String getQrPayload() { return qrPayload; }
    public String getExpiresAtUtc() { return expiresAtUtc; }

    public void setReservationCode(String reservationCode) { this.reservationCode = reservationCode; }
    public void setQrPayload(String qrPayload) { this.qrPayload = qrPayload; }
    public void setExpiresAtUtc(String expiresAtUtc) { this.expiresAtUtc = expiresAtUtc; }
}

