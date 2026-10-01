package com.smartsolar.microgrid.data.station;

public class BookingSlotResponse {
    private String id;
    private String slotCode;
    private String stationCode;
    private String startTimeUtc;
    private String endTimeUtc;
    private double availableEnergyKwh;
    private double pricePerKwh;
    private String status;

    public String getId() { return id; }
    public String getSlotCode() { return slotCode; }
    public String getStationCode() { return stationCode; }
    public String getStartTimeUtc() { return startTimeUtc; }
    public String getEndTimeUtc() { return endTimeUtc; }
    public double getAvailableEnergyKwh() { return availableEnergyKwh; }
    public double getPricePerKwh() { return pricePerKwh; }
    public String getStatus() { return status; }
}
