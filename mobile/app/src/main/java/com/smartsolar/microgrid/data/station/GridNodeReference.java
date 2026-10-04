package com.smartsolar.microgrid.data.station;

final class GridNodeReference {
    private final StationResponse station;
    private final long lastSyncedAtEpochMillis;

    GridNodeReference(StationResponse station, long lastSyncedAtEpochMillis) {
        this.station = station;
        this.lastSyncedAtEpochMillis = lastSyncedAtEpochMillis;
    }

    StationResponse getStation() {
        return station;
    }

    long getLastSyncedAtEpochMillis() {
        return lastSyncedAtEpochMillis;
    }
}
