package com.smartsolar.microgrid.data.station;

import android.content.Context;

import com.google.gson.reflect.TypeToken;
import com.smartsolar.microgrid.data.api.ApiCallback;
import com.smartsolar.microgrid.data.api.ApiClient;

import java.lang.reflect.Type;
import java.util.List;
import java.util.Locale;

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

    public void getActiveStations(Double latitude, Double longitude,
                                  ApiCallback<List<StationResponse>> callback) {
        String path = STATIONS_PATH + "?status=Active";
        if (latitude != null && longitude != null) {
            path += String.format(Locale.US, "&nearLat=%.7f&nearLng=%.7f",
                    latitude, longitude);
        }
        Type listType = new TypeToken<List<StationResponse>>() {}.getType();
        apiClient.get(path, listType, true, callback);
    }
}
