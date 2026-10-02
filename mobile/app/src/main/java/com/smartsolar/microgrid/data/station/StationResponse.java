package com.smartsolar.microgrid.data.station;

public class StationResponse {
    private String id;
    private String stationCode;
    private String name;
    private String description;
    private double latitude;
    private double longitude;
    private String address;
    private double capacityKwh;
    private double batteryStorageKwh;
    private String openingTime;
    private String closingTime;
    private String status;

    public String getId() { return id; }
    public String getStationCode() { return stationCode; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public String getAddress() { return address; }
    public double getCapacityKwh() { return capacityKwh; }
    public double getBatteryStorageKwh() { return batteryStorageKwh; }
    public String getOpeningTime() { return openingTime; }
    public String getClosingTime() { return closingTime; }
    public String getStatus() { return status; }
}
