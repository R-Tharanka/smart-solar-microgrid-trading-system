package com.smartsolar.microgrid.data.transaction;

public class VerifyTransactionRequest {
    private String reservationCode;
    private String transactionToken;

    public VerifyTransactionRequest(String reservationCode, String transactionToken) {
        this.reservationCode = reservationCode;
        this.transactionToken = transactionToken;
    }
}

