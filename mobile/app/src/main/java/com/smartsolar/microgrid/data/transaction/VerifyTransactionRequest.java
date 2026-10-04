package com.smartsolar.microgrid.data.transaction;

public final class VerifyTransactionRequest {
    private final String reservationCode;
    private final String transactionToken;

    public VerifyTransactionRequest(String reservationCode, String transactionToken) {
        this.reservationCode = reservationCode;
        this.transactionToken = transactionToken;
    }

    public String getReservationCode() { return reservationCode; }
    public String getTransactionToken() { return transactionToken; }
}
