package com.smartsolar.microgrid.data.transaction;

public class FinalizedTransactionResponse {
    private String reservationCode;
    private String status;
    private double actualEnergyTransferredKwh;
    private String finalizedAtUtc;

    public String getReservationCode() { return reservationCode; }
    public String getStatus() { return status; }
    public double getActualEnergyTransferredKwh() { return actualEnergyTransferredKwh; }
    public String getFinalizedAtUtc() { return finalizedAtUtc; }
}
