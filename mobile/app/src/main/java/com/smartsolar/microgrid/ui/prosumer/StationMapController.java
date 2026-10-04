package com.smartsolar.microgrid.ui.prosumer;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.smartsolar.microgrid.data.station.StationResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

final class StationMapController {
    interface OnStationMarkerSelected {
        void onStationSelected(StationResponse station);
    }

    private final OnStationMarkerSelected listener;
    private final Map<String, StationResponse> stationsByIdentifier = new HashMap<>();
    private List<StationResponse> stations = new ArrayList<>();
    private GoogleMap map;

    StationMapController(OnStationMarkerSelected listener) {
        this.listener = listener;
    }

    void attach(GoogleMap googleMap) {
        map = googleMap;
        map.getUiSettings().setMapToolbarEnabled(false);
        map.setOnMarkerClickListener(this::onMarkerClick);
        render();
    }

    void showStations(List<StationResponse> currentStations) {
        stations = currentStations == null
                ? new ArrayList<>() : new ArrayList<>(currentStations);
        render();
    }

    private void render() {
        if (map == null) return;
        map.clear();
        stationsByIdentifier.clear();
        List<LatLng> positions = new ArrayList<>();

        for (StationResponse station : stations) {
            if (!hasValidCoordinates(station)) continue;
            String identifier = stationIdentifier(station);
            LatLng position = new LatLng(station.getLatitude(), station.getLongitude());
            Marker marker = map.addMarker(new MarkerOptions()
                    .position(position)
                    .title(station.getName()));
            if (marker != null) {
                marker.setTag(identifier);
                stationsByIdentifier.put(identifier, station);
                positions.add(position);
            }
        }
        frameMarkers(positions);
    }

    private boolean onMarkerClick(Marker marker) {
        Object tag = marker.getTag();
        if (!(tag instanceof String)) return false;
        StationResponse station = stationsByIdentifier.get((String) tag);
        if (station == null) return false;
        listener.onStationSelected(station);
        return true;
    }

    private boolean hasValidCoordinates(StationResponse station) {
        return Double.isFinite(station.getLatitude())
                && station.getLatitude() >= -90
                && station.getLatitude() <= 90
                && Double.isFinite(station.getLongitude())
                && station.getLongitude() >= -180
                && station.getLongitude() <= 180;
    }

    private String stationIdentifier(StationResponse station) {
        return station.getId() == null || station.getId().trim().isEmpty()
                ? station.getStationCode() : station.getId();
    }

    private void frameMarkers(List<LatLng> positions) {
        if (positions.isEmpty()) return;
        if (positions.size() == 1) {
            map.moveCamera(CameraUpdateFactory.newLatLngZoom(positions.get(0), 13f));
            return;
        }
        LatLngBounds.Builder bounds = new LatLngBounds.Builder();
        for (LatLng position : positions) bounds.include(position);
        map.setOnMapLoadedCallback(() ->
                map.animateCamera(CameraUpdateFactory.newLatLngBounds(bounds.build(), 72)));
    }
}
