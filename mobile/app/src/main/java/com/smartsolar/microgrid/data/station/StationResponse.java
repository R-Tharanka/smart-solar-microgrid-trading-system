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

    public StationResponse() {
        // Used by Gson when reading the server response.
    }

    public StationResponse(String id, String stationCode, String name, String description,
                           double latitude, double longitude, String address,
                           double capacityKwh, double batteryStorageKwh, String openingTime,
                           String closingTime, String status) {
        this.id = id;
        this.stationCode = stationCode;
        this.name = name;
        this.description = description;
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
        this.capacityKwh = capacityKwh;
        this.batteryStorageKwh = batteryStorageKwh;
        this.openingTime = openingTime;
        this.closingTime = closingTime;
        this.status = status;
    }

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
