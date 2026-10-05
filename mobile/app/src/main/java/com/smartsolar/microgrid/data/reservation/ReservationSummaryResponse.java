package com.smartsolar.microgrid.data.reservation;

public class ReservationSummaryResponse {
    private String reservationId;
    private String reservationCode;
    private String prosumerNic;
    private String stationId;
    private String slotId;
    private String stationName;
    private String slotName;
    private double requestedEnergyKwh;
    private String scheduledStartTimeUtc;
    private String scheduledEndTimeUtc;
    private String status;
    private String createdAtUtc;
    private String updatedAtUtc;

    public String getReservationId() { return reservationId; }
    public String getReservationCode() { return reservationCode; }
    public String getProsumerNic() { return prosumerNic; }
    public String getStationId() { return stationId; }
    public String getSlotId() { return slotId; }
    public String getStationName() { return stationName; }
    public String getSlotName() { return slotName; }
    public double getRequestedEnergyKwh() { return requestedEnergyKwh; }
    public String getScheduledStartTimeUtc() { return scheduledStartTimeUtc; }
    public String getScheduledEndTimeUtc() { return scheduledEndTimeUtc; }
    public String getStatus() { return status; }
}
