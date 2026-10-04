package com.smartsolar.microgrid.data.transaction;

public final class FinalizeTransactionRequest {
    private final String reservationCode;
    private final String confirmationNote;
    private final Double actualEnergyTransferredKwh;

    public FinalizeTransactionRequest(String reservationCode, String confirmationNote,
                                      Double actualEnergyTransferredKwh) {
        this.reservationCode = reservationCode;
        this.confirmationNote = confirmationNote;
        this.actualEnergyTransferredKwh = actualEnergyTransferredKwh;
    }

    public String getReservationCode() { return reservationCode; }
    public String getConfirmationNote() { return confirmationNote; }
    public Double getActualEnergyTransferredKwh() { return actualEnergyTransferredKwh; }
}
