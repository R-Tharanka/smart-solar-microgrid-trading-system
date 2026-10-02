package com.smartsolar.microgrid.data.reservation;

public class CreateReservationRequest {
    private String stationId;
    private String slotId;
    private double requestedEnergyKwh;

    public CreateReservationRequest(String stationId, String slotId, double requestedEnergyKwh) {
        this.stationId = stationId;
        this.slotId = slotId;
        this.requestedEnergyKwh = requestedEnergyKwh;
    }

    public String getStationId() { return stationId; }
    public String getSlotId() { return slotId; }
    public double getRequestedEnergyKwh() { return requestedEnergyKwh; }
}
