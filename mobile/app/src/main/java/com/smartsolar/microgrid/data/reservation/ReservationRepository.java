package com.smartsolar.microgrid.data.reservation;

import android.content.Context;

import com.smartsolar.microgrid.data.api.ApiCallback;
import com.smartsolar.microgrid.data.api.ApiClient;

public class ReservationRepository {
    private static final String RESERVATIONS_PATH = "api/reservations";
    private final ApiClient apiClient;

    public ReservationRepository(Context context) {
        apiClient = ApiClient.getInstance(context);
    }

    public void createReservation(CreateReservationRequest request, ApiCallback<ReservationResponse> callback) {
        apiClient.post(RESERVATIONS_PATH, request, ReservationResponse.class, true, callback);
    }

    public void getMyReservations(ApiCallback<java.util.List<ReservationSummaryResponse>> callback) {
        java.lang.reflect.Type listType = new com.google.gson.reflect.TypeToken<java.util.List<ReservationSummaryResponse>>() {}.getType();
        apiClient.get(RESERVATIONS_PATH + "/me", listType, true, callback);
    }

    public void getProsumerDashboard(ApiCallback<ProsumerDashboardResponse> callback) {
        apiClient.get("api/dashboard/me", ProsumerDashboardResponse.class, true, callback);
    }

    public void getReservationDetails(String id, ApiCallback<ReservationResponse> callback) {
        apiClient.get(RESERVATIONS_PATH + "/" + id, ReservationResponse.class, true, callback);
    }

    public void updateReservation(String id, UpdateReservationRequest request, ApiCallback<ReservationResponse> callback) {
        apiClient.put(RESERVATIONS_PATH + "/" + id, request, ReservationResponse.class, true, callback);
    }

    public void cancelReservation(String id, CancelReservationRequest request, ApiCallback<ReservationResponse> callback) {
        apiClient.post(RESERVATIONS_PATH + "/" + id + "/cancel", request, ReservationResponse.class, true, callback);
    }
}
