package com.smartsolar.microgrid.data.reservation;

public class CancelReservationRequest {
    private String reason;

    public CancelReservationRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() { return reason; }
}
