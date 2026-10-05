package com.smartsolar.microgrid.data.transaction;

public class VerifiedTransactionResponse {
    private String reservationId;
    private String reservationCode;
    private String prosumerNic;
    private String stationId;
    private double requestedEnergyKwh;
    private String status;

    public String getReservationId() { return reservationId; }
    public String getReservationCode() { return reservationCode; }
    public String getProsumerNic() { return prosumerNic; }
    public String getStationId() { return stationId; }
    public double getRequestedEnergyKwh() { return requestedEnergyKwh; }
    public String getStatus() { return status; }
}

