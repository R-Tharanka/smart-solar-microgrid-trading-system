package com.smartsolar.microgrid.data.transaction;

public class FinalizeTransactionRequest {
    private String reservationCode;
    private String confirmationNote;
    private double actualEnergyTransferredKwh;

    public FinalizeTransactionRequest(String reservationCode, String confirmationNote, double actualEnergyTransferredKwh) {
        this.reservationCode = reservationCode;
        this.confirmationNote = confirmationNote;
        this.actualEnergyTransferredKwh = actualEnergyTransferredKwh;
    }
}

