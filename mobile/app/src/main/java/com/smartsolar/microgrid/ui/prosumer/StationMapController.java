package com.smartsolar.microgrid.ui.prosumer;

import androidx.core.content.ContextCompat;
import androidx.core.graphics.drawable.DrawableCompat;
import android.graphics.drawable.Drawable;

import org.osmdroid.api.IMapController;
import org.osmdroid.util.BoundingBox;
import org.osmdroid.util.GeoPoint;
import org.osmdroid.views.MapView;
import org.osmdroid.views.overlay.Marker;
import org.osmdroid.views.overlay.mylocation.GpsMyLocationProvider;
import org.osmdroid.views.overlay.mylocation.MyLocationNewOverlay;

import com.smartsolar.microgrid.R;
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
    private final Map<String, Marker> markersByStationCode = new HashMap<>();
    private String selectedStationCode;
    private List<StationResponse> stations = new ArrayList<>();
    private MapView map;
    private MyLocationNewOverlay myLocationOverlay;

    StationMapController(OnStationMarkerSelected listener) {
        this.listener = listener;
    }

    void attach(MapView mapView) {
        map = mapView;
        map.setMultiTouchControls(true);
        
        myLocationOverlay = new MyLocationNewOverlay(new GpsMyLocationProvider(mapView.getContext()), map);
        myLocationOverlay.enableMyLocation();

        render();
    }

    void showStations(List<StationResponse> currentStations) {
        stations = currentStations == null
                ? new ArrayList<>() : new ArrayList<>(currentStations);
        render();
    }

    void selectStation(String stationCode) {
        selectedStationCode = stationCode;
        for (Map.Entry<String, Marker> entry : markersByStationCode.entrySet()) {
            entry.getValue().setIcon(markerIcon(entry.getKey().equals(stationCode)));
        }
        if (map != null) map.invalidate();
    }

    private Drawable markerIcon(boolean selected) {
        Drawable icon = ContextCompat.getDrawable(map.getContext(), R.drawable.ic_solar_station);
        if (icon == null) return null;
        icon = DrawableCompat.wrap(icon.mutate());
        DrawableCompat.setTint(icon, ContextCompat.getColor(map.getContext(),
                selected ? R.color.solar_green : R.color.status_success));
        return icon;
    }

    private void render() {
        if (map == null) return;
        map.getOverlays().clear();
        
        if (myLocationOverlay != null) {
            map.getOverlays().add(myLocationOverlay);
        }
        
        stationsByIdentifier.clear();
        markersByStationCode.clear();
        List<GeoPoint> positions = new ArrayList<>();

        for (StationResponse station : stations) {
            if (!hasValidCoordinates(station)) continue;
            String identifier = stationIdentifier(station);
            GeoPoint position = new GeoPoint(station.getLatitude(), station.getLongitude());
            
            Marker marker = new Marker(map);
            marker.setPosition(position);
            marker.setTitle(station.getName());
            marker.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM);
            marker.setRelatedObject(identifier);
            marker.setIcon(markerIcon(station.getStationCode() != null
                    && station.getStationCode().equals(selectedStationCode)));
            marker.setOnMarkerClickListener((m, mapView) -> {
                Object tag = m.getRelatedObject();
                if (tag instanceof String) {
                    StationResponse clickedStation = stationsByIdentifier.get((String) tag);
                    if (clickedStation != null) {
                        listener.onStationSelected(clickedStation);
                        return true;
                    }
                }
                return false;
            });

            map.getOverlays().add(marker);
            stationsByIdentifier.put(identifier, station);
            markersByStationCode.put(station.getStationCode(), marker);
            positions.add(position);
        }
        
        map.invalidate();
        frameMarkers(positions);
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

    private void frameMarkers(List<GeoPoint> positions) {
        if (positions.isEmpty()) return;
        
        IMapController mapController = map.getController();
        if (positions.size() == 1) {
            mapController.setZoom(13.0);
            mapController.setCenter(positions.get(0));
            return;
        }
        
        double minLat = Double.MAX_VALUE;
        double maxLat = -Double.MAX_VALUE;
        double minLon = Double.MAX_VALUE;
        double maxLon = -Double.MAX_VALUE;

        for (GeoPoint p : positions) {
            if (p.getLatitude() < minLat) minLat = p.getLatitude();
            if (p.getLatitude() > maxLat) maxLat = p.getLatitude();
            if (p.getLongitude() < minLon) minLon = p.getLongitude();
            if (p.getLongitude() > maxLon) maxLon = p.getLongitude();
        }
        
        BoundingBox boundingBox = new BoundingBox(maxLat, maxLon, minLat, minLon);
        map.post(() -> map.zoomToBoundingBox(boundingBox, true, 72));
    }
}
