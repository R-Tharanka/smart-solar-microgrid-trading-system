package com.smartsolar.microgrid.data.station;

import android.content.Context;

import com.google.gson.reflect.TypeToken;
import com.smartsolar.microgrid.data.api.ApiCallback;
import com.smartsolar.microgrid.data.api.ApiClient;
import com.smartsolar.microgrid.data.session.SessionManager;

import java.lang.reflect.Type;
import java.util.List;
import java.util.Locale;

public class StationRepository {
    private static final String STATIONS_PATH = "api/stations";

    private final ApiClient apiClient;
    private final SessionManager sessionManager;
    private final GridNodeReferenceCache cache;

    public StationRepository(Context context) {
        apiClient = ApiClient.getInstance(context);
        sessionManager = SessionManager.getInstance(context);
        cache = new GridNodeReferenceCache(context);
    }

    public void getStations(ApiCallback<List<StationResponse>> callback) {
        Type listType = new TypeToken<List<StationResponse>>() {}.getType();
        apiClient.get(STATIONS_PATH, listType, true, cachingCallback(callback));
    }

    public void getActiveStations(Double latitude, Double longitude,
                                  ApiCallback<List<StationResponse>> callback) {
        String path = STATIONS_PATH + "?status=Active";
        if (latitude != null && longitude != null) {
            path += String.format(Locale.US, "&nearLat=%.7f&nearLng=%.7f",
                    latitude, longitude);
        }
        Type listType = new TypeToken<List<StationResponse>>() {}.getType();
        apiClient.get(path, listType, true, cachingCallback(callback));
    }

    public CachedStationReferences getCachedStations() {
        if (sessionManager.loadSession() == null) {
            return new CachedStationReferences(java.util.Collections.emptyList(), 0L);
        }
        return cache.loadAll();
    }

    private ApiCallback<List<StationResponse>> cachingCallback(
            ApiCallback<List<StationResponse>> callback) {
        return new ApiCallback<List<StationResponse>>() {
            @Override
            public void onSuccess(List<StationResponse> stations, String message) {
                cache.upsertAll(stations);
                callback.onSuccess(stations, message);
            }

            @Override
            public void onError(com.smartsolar.microgrid.data.api.ApiError error) {
                callback.onError(error);
            }
        };
    }
}
