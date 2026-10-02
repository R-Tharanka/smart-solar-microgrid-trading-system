package com.smartsolar.microgrid.data.station;

import android.content.Context;

import com.google.gson.reflect.TypeToken;
import com.smartsolar.microgrid.data.api.ApiCallback;
import com.smartsolar.microgrid.data.api.ApiClient;

import java.lang.reflect.Type;
import java.util.List;

public class SlotRepository {
    private final ApiClient apiClient;

    public SlotRepository(Context context) {
        apiClient = ApiClient.getInstance(context);
    }

    public void getSlotsForStation(String stationCode, ApiCallback<List<BookingSlotResponse>> callback) {
        String path = "api/stations/" + stationCode + "/slots";
        Type listType = new TypeToken<List<BookingSlotResponse>>() {}.getType();
        apiClient.get(path, listType, true, callback);
    }
}
