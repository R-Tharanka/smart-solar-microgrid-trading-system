package com.smartsolar.microgrid.data.station;

import android.content.Context;

import com.google.gson.reflect.TypeToken;
import com.smartsolar.microgrid.data.api.ApiCallback;
import com.smartsolar.microgrid.data.api.ApiClient;

import java.lang.reflect.Type;
import java.util.List;

public class StationRepository {
    private static final String STATIONS_PATH = "api/stations";

    private final ApiClient apiClient;

    public StationRepository(Context context) {
        apiClient = ApiClient.getInstance(context);
    }

    public void getStations(ApiCallback<List<StationResponse>> callback) {
        Type listType = new TypeToken<List<StationResponse>>() {}.getType();
        apiClient.get(STATIONS_PATH, listType, true, callback);
    }
}
