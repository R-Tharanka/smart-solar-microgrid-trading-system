package com.smartsolar.microgrid.ui.prosumer;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.navigation.fragment.NavHostFragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import org.osmdroid.config.Configuration;
import org.osmdroid.views.MapView;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.data.api.ApiCallback;
import com.smartsolar.microgrid.data.api.ApiError;
import com.smartsolar.microgrid.data.location.DeviceLocationProvider;
import com.smartsolar.microgrid.data.station.CachedStationReferences;
import com.smartsolar.microgrid.data.station.StationRepository;
import com.smartsolar.microgrid.data.station.StationResponse;
import com.smartsolar.microgrid.navigation.AuthenticationNavigator;

import java.text.DateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class StationsFragment extends Fragment {
    private StationRepository repository;
    private DeviceLocationProvider locationProvider;
    private StationAdapter adapter;
    private RecyclerView recyclerView;
    private ProgressBar progressBar;
    private View errorContainer;
    private TextView errorMessage;
    private View emptyStateText;
    private TextView locationNotice;
    private TextView cacheNotice;
    private MaterialButton locationAction;
    private final List<StationResponse> currentStations = new ArrayList<>();
    private StationMapController mapController;
    private boolean mapAvailable = true;
    private boolean returningFromSettings;
    private boolean operatorReadOnly;

    private final ActivityResultLauncher<String[]> locationPermissionLauncher =
            registerForActivityResult(new ActivityResultContracts.RequestMultiplePermissions(), result -> {
                if (!isAdded()) return;
                if (hasLocationPermission()) {
                    acquireLocation();
                    return;
                }

                boolean canRequestAgain = shouldShowRequestPermissionRationale(
                        Manifest.permission.ACCESS_FINE_LOCATION)
                        || shouldShowRequestPermissionRationale(
                        Manifest.permission.ACCESS_COARSE_LOCATION);
                if (canRequestAgain) {
                    showLocationNotice(R.string.station_location_permission_denied,
                            R.string.allow_location_action, ignored -> requestLocationPermission());
                } else {
                    showLocationNotice(R.string.station_location_permission_permanent,
                            R.string.open_settings_action, this::openApplicationSettings);
                }
                loadStations(null);
            });

    public StationsFragment() {
        super(R.layout.fragment_stations);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        repository = new StationRepository(requireContext());
        locationProvider = new DeviceLocationProvider(requireContext());
        mapController = new StationMapController(this::showMarkerStation);
        operatorReadOnly = getArguments() != null
                && getArguments().getBoolean("operatorReadOnly", false);

        recyclerView = view.findViewById(R.id.stations_recycler_view);
        progressBar = view.findViewById(R.id.progress_bar);
        errorContainer = view.findViewById(R.id.error_container);
        errorMessage = view.findViewById(R.id.error_message);
        emptyStateText = view.findViewById(R.id.empty_state_text);
        locationNotice = view.findViewById(R.id.station_location_notice);
        cacheNotice = view.findViewById(R.id.station_cache_notice);
        locationAction = view.findViewById(R.id.station_location_action);

        TextView title = view.findViewById(R.id.stations_title);
        if (operatorReadOnly) title.setText(R.string.operator_station_map_title);

        adapter = new StationAdapter(operatorReadOnly
                ? this::showMarkerStation : this::openStationSlots);
        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        recyclerView.setAdapter(adapter);

        view.findViewById(R.id.retry_button).setOnClickListener(button -> startDiscovery());
        initializeMap(view);
        startDiscovery();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (getView() != null) {
            MapView mapView = getView().findViewById(R.id.station_map_view);
            if (mapView != null) mapView.onResume();
        }
        if (returningFromSettings && getView() != null) {
            returningFromSettings = false;
            if (hasLocationPermission()) {
                acquireLocation();
            } else {
                showLocationNotice(R.string.station_location_permission_permanent,
                        R.string.open_settings_action, this::openApplicationSettings);
            }
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        if (getView() != null) {
            MapView mapView = getView().findViewById(R.id.station_map_view);
            if (mapView != null) mapView.onPause();
        }
    }

    private void initializeMap(View view) {
        Configuration.getInstance().load(requireContext(), 
                requireContext().getSharedPreferences("osmdroid", android.content.Context.MODE_PRIVATE));
                
        MapView mapView = view.findViewById(R.id.station_map_view);
        if (mapView != null) {
            mapController.attach(mapView);
        } else {
            mapAvailable = false;
        }
    }

    private void startDiscovery() {
        if (hasLocationPermission()) {
            acquireLocation();
        } else {
            requestLocationPermission();
        }
    }

    private boolean hasLocationPermission() {
        return ContextCompat.checkSelfPermission(requireContext(),
                Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || ContextCompat.checkSelfPermission(requireContext(),
                Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private void requestLocationPermission() {
        locationPermissionLauncher.launch(new String[]{
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
        });
    }

    private void acquireLocation() {
        showLoading();
        locationProvider.getCurrentLocation(new DeviceLocationProvider.Callback() {
            @Override
            public void onLocation(Location location) {
                if (!isAdded() || getView() == null) return;
                hideLocationNotice();
                loadStations(location);
            }

            @Override
            public void onUnavailable(DeviceLocationProvider.Failure failure) {
                if (!isAdded() || getView() == null) return;
                if (failure == DeviceLocationProvider.Failure.SERVICES_DISABLED) {
                    showLocationNotice(R.string.station_location_services_disabled,
                            R.string.open_location_settings_action,
                            StationsFragment.this::openLocationSettings);
                } else if (failure == DeviceLocationProvider.Failure.PERMISSION_MISSING) {
                    showLocationNotice(R.string.station_location_permission_denied,
                            R.string.allow_location_action,
                            ignored -> StationsFragment.this.requestLocationPermission());
                } else {
                    showLocationNotice(R.string.station_location_temporarily_unavailable,
                            R.string.retry_location_action,
                            ignored -> StationsFragment.this.acquireLocation());
                }
                loadStations(null);
            }
        });
    }

    private void loadStations(@Nullable Location location) {
        showLoading();
        Double latitude = location == null ? null : location.getLatitude();
        Double longitude = location == null ? null : location.getLongitude();
        repository.getActiveStations(latitude, longitude,
                new ApiCallback<List<StationResponse>>() {
                    @Override
                    public void onSuccess(List<StationResponse> data, String message) {
                        if (!isAdded() || getView() == null) return;
                        List<StationResponse> activeStations = new ArrayList<>();
                        if (data != null) {
                            for (StationResponse station : data) {
                                if (station != null
                                        && "Active".equalsIgnoreCase(station.getStatus())) {
                                    activeStations.add(station);
                                }
                            }
                        }

                        adapter.setUserLocation(location);
                        displayStations(activeStations);
                        hideCacheNotice();
                        if (activeStations.isEmpty()) {
                            showEmpty();
                        } else {
                            showContent();
                        }
                    }

                    @Override
                    public void onError(ApiError error) {
                        if (!isAdded() || getView() == null) return;
                        if (AuthenticationNavigator.handleExpiredSession(
                                StationsFragment.this, error)) return;
                        if (!canUseCachedFallback(error)) {
                            clearStations();
                            showError(error.getUserMessage());
                            return;
                        }

                        CachedStationReferences cached = repository.getCachedStations();
                        List<StationResponse> cachedActiveStations = new ArrayList<>();
                        for (StationResponse station : cached.getStations()) {
                            if (station != null
                                    && "Active".equalsIgnoreCase(station.getStatus())) {
                                cachedActiveStations.add(station);
                            }
                        }
                        if (cachedActiveStations.isEmpty()) {
                            clearStations();
                            hideCacheNotice();
                            showError(getString(R.string.stations_unavailable_offline));
                            return;
                        }

                        adapter.setUserLocation(location);
                        displayStations(cachedActiveStations);
                        showCacheNotice(cached.getLastSyncedAtEpochMillis());
                        showContent();
                    }
                });
    }

    private boolean canUseCachedFallback(ApiError error) {
        return "NETWORK_ERROR".equals(error.getErrorCode())
                || error.getStatusCode() >= 500;
    }

    private void displayStations(List<StationResponse> stations) {
        currentStations.clear();
        currentStations.addAll(stations);
        adapter.setStations(currentStations);
        mapController.showStations(currentStations);
    }

    private void clearStations() {
        displayStations(new ArrayList<>());
    }

    private void showCacheNotice(long lastSyncedAt) {
        String formatted = DateFormat.getDateTimeInstance(
                DateFormat.MEDIUM, DateFormat.SHORT).format(new Date(lastSyncedAt));
        cacheNotice.setText(getString(R.string.station_offline_last_synced, formatted));
        cacheNotice.setVisibility(View.VISIBLE);
    }

    private void hideCacheNotice() {
        cacheNotice.setVisibility(View.GONE);
    }

    private void showMarkerStation(StationResponse station) {
        double emptySpace = Math.max(0,
                station.getCapacityKwh() - station.getBatteryStorageKwh());
        String details = getString(R.string.station_marker_details,
                station.getStationCode(), value(station.getAddress()),
                station.getCapacityKwh(), station.getBatteryStorageKwh(), emptySpace,
                value(station.getOpeningTime()), value(station.getClosingTime()),
                value(station.getStatus()));
        MaterialAlertDialogBuilder dialog = new MaterialAlertDialogBuilder(requireContext())
                .setTitle(station.getName())
                .setMessage(details)
                .setNegativeButton(R.string.cancel_action, null);
        if (!operatorReadOnly) {
            dialog.setPositiveButton(R.string.view_slots_action,
                    (ignored, which) -> openStationSlots(station));
        }
        dialog.show();
    }

    private String value(String value) {
        return value == null || value.trim().isEmpty()
                ? getString(R.string.not_provided) : value;
    }

    private void openStationSlots(StationResponse station) {
        Bundle args = new Bundle();
        args.putString("stationId", station.getId());
        args.putString("stationCode", station.getStationCode());
        args.putString("stationName", station.getName());
        args.putString("stationAddress", station.getAddress());
        args.putDouble("stationCapacity", station.getCapacityKwh());
        args.putDouble("stationBatteryStorage", station.getBatteryStorageKwh());
        args.putString("stationOpeningTime", station.getOpeningTime());
        args.putString("stationClosingTime", station.getClosingTime());
        args.putString("stationStatus", station.getStatus());
        NavHostFragment.findNavController(this).navigate(R.id.slotsFragment, args);
    }

    private void showLocationNotice(int message, int actionText,
                                    @Nullable View.OnClickListener action) {
        locationNotice.setText(message);
        locationNotice.setVisibility(View.VISIBLE);
        if (actionText == 0 || action == null) {
            locationAction.setVisibility(View.GONE);
            locationAction.setOnClickListener(null);
        } else {
            locationAction.setText(actionText);
            locationAction.setOnClickListener(action);
            locationAction.setVisibility(View.VISIBLE);
        }
    }

    private void hideLocationNotice() {
        if (!mapAvailable) {
            showLocationNotice(R.string.station_map_unavailable, 0, null);
            return;
        }
        locationNotice.setVisibility(View.GONE);
        locationAction.setVisibility(View.GONE);
        locationAction.setOnClickListener(null);
    }

    private void openApplicationSettings(View ignored) {
        returningFromSettings = true;
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                Uri.parse("package:" + requireContext().getPackageName()));
        startActivity(intent);
    }

    private void openLocationSettings(View ignored) {
        returningFromSettings = true;
        startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS));
    }

    private void showLoading() {
        progressBar.setVisibility(View.VISIBLE);
        recyclerView.setVisibility(View.GONE);
        errorContainer.setVisibility(View.GONE);
        emptyStateText.setVisibility(View.GONE);
        hideCacheNotice();
    }

    private void showContent() {
        progressBar.setVisibility(View.GONE);
        recyclerView.setVisibility(View.VISIBLE);
        errorContainer.setVisibility(View.GONE);
        emptyStateText.setVisibility(View.GONE);
    }

    private void showError(String message) {
        progressBar.setVisibility(View.GONE);
        recyclerView.setVisibility(View.GONE);
        errorContainer.setVisibility(View.VISIBLE);
        errorMessage.setText(message);
        emptyStateText.setVisibility(View.GONE);
    }

    private void showEmpty() {
        progressBar.setVisibility(View.GONE);
        recyclerView.setVisibility(View.GONE);
        errorContainer.setVisibility(View.GONE);
        emptyStateText.setVisibility(View.VISIBLE);
    }
}
