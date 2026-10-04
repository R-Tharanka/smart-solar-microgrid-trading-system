package com.smartsolar.microgrid.data.transaction;

public class TransactionDetailsResponse {
    private String reservationId;
    private String reservationCode;
    private String prosumerNic;
    private String stationId;
    private String slotId;
    private double requestedEnergyKwh;
    private String scheduledStartTimeUtc;
    private String scheduledEndTimeUtc;
    private String status;
    private String qrExpiresAtUtc;
    private String verifiedByIdentifier;
    private String verifiedAtUtc;
    private String finalizedByIdentifier;
    private String finalizedAtUtc;
    private Double actualEnergyTransferredKwh;
    private String confirmationNote;

    public String getReservationId() { return reservationId; }
    public String getReservationCode() { return reservationCode; }
    public String getProsumerNic() { return prosumerNic; }
    public String getStationId() { return stationId; }
    public String getSlotId() { return slotId; }
    public double getRequestedEnergyKwh() { return requestedEnergyKwh; }
    public String getScheduledStartTimeUtc() { return scheduledStartTimeUtc; }
    public String getScheduledEndTimeUtc() { return scheduledEndTimeUtc; }
    public String getStatus() { return status; }
    public String getQrExpiresAtUtc() { return qrExpiresAtUtc; }
    public String getVerifiedByIdentifier() { return verifiedByIdentifier; }
    public String getVerifiedAtUtc() { return verifiedAtUtc; }
    public String getFinalizedByIdentifier() { return finalizedByIdentifier; }
    public String getFinalizedAtUtc() { return finalizedAtUtc; }
    public Double getActualEnergyTransferredKwh() { return actualEnergyTransferredKwh; }
    public String getConfirmationNote() { return confirmationNote; }
}
