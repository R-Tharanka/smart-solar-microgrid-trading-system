package com.smartsolar.microgrid.data.reservation;

public class UpdateReservationRequest {
    private double requestedEnergyKwh;

    public UpdateReservationRequest(double requestedEnergyKwh) {
        this.requestedEnergyKwh = requestedEnergyKwh;
    }

    public double getRequestedEnergyKwh() { return requestedEnergyKwh; }
}
