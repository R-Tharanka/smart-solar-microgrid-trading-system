package com.smartsolar.microgrid.data.location;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;

import androidx.core.content.ContextCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import com.google.android.gms.tasks.CancellationTokenSource;

public final class DeviceLocationProvider {
    public enum Failure {
        PERMISSION_MISSING,
        SERVICES_DISABLED,
        TEMPORARILY_UNAVAILABLE
    }

    public interface Callback {
        void onLocation(Location location);
        void onUnavailable(Failure failure);
    }

    private final Context context;
    private final FusedLocationProviderClient client;

    public DeviceLocationProvider(Context context) {
        this.context = context.getApplicationContext();
        client = LocationServices.getFusedLocationProviderClient(this.context);
    }

    @SuppressLint("MissingPermission")
    public void getCurrentLocation(Callback callback) {
        boolean fineGranted = ContextCompat.checkSelfPermission(context,
                Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean coarseGranted = ContextCompat.checkSelfPermission(context,
                Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        if (!fineGranted && !coarseGranted) {
            callback.onUnavailable(Failure.PERMISSION_MISSING);
            return;
        }

        LocationManager locationManager =
                (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
        boolean gpsEnabled = locationManager != null
                && locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
        boolean networkEnabled = locationManager != null
                && locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
        if (!gpsEnabled && !networkEnabled) {
            callback.onUnavailable(Failure.SERVICES_DISABLED);
            return;
        }

        int priority = fineGranted
                ? Priority.PRIORITY_HIGH_ACCURACY
                : Priority.PRIORITY_BALANCED_POWER_ACCURACY;
        CancellationTokenSource cancellation = new CancellationTokenSource();
        client.getCurrentLocation(priority, cancellation.getToken())
                .addOnSuccessListener(location -> {
                    if (location == null) {
                        callback.onUnavailable(Failure.TEMPORARILY_UNAVAILABLE);
                    } else {
                        callback.onLocation(location);
                    }
                })
                .addOnFailureListener(error ->
                        callback.onUnavailable(Failure.TEMPORARILY_UNAVAILABLE));
    }
}
