package com.smartsolar.microgrid.data.station;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class CachedStationReferences {
    private final List<StationResponse> stations;
    private final long lastSyncedAtEpochMillis;

    CachedStationReferences(List<StationResponse> stations, long lastSyncedAtEpochMillis) {
        this.stations = Collections.unmodifiableList(new ArrayList<>(stations));
        this.lastSyncedAtEpochMillis = lastSyncedAtEpochMillis;
    }

    public List<StationResponse> getStations() {
        return stations;
    }

    public long getLastSyncedAtEpochMillis() {
        return lastSyncedAtEpochMillis;
    }
}
