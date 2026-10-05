package com.smartsolar.microgrid.ui.prosumer;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.data.station.StationResponse;
import com.smartsolar.microgrid.ui.common.StatusUi;

import java.util.ArrayList;
import java.util.List;
import android.location.Location;

public class StationAdapter extends RecyclerView.Adapter<StationAdapter.ViewHolder> {
    private final List<StationResponse> stations = new ArrayList<>();
    private final OnStationClickListener listener;
    private Location userLocation;
    private String selectedStationCode;

    public interface OnStationClickListener {
        void onStationClick(StationResponse station);
    }

    public StationAdapter(OnStationClickListener listener) {
        this.listener = listener;
    }

    public void setUserLocation(Location location) {
        this.userLocation = location;
    }

    public void setSelectedStation(String stationCode) {
        selectedStationCode = stationCode;
        notifyDataSetChanged();
    }

    public void setStations(List<StationResponse> newStations) {
        stations.clear();
        if (newStations != null) {
            stations.addAll(newStations);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_station, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        StationResponse station = stations.get(position);
        holder.bind(station, userLocation, listener,
                station.getStationCode() != null
                        && station.getStationCode().equals(selectedStationCode));
    }

    @Override
    public int getItemCount() {
        return stations.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        private final TextView nameText;
        private final TextView addressText;
        private final TextView capacityText;
        private final TextView emptySpaceText;
        private final TextView distanceText;
        private final TextView statusText;

        ViewHolder(View itemView) {
            super(itemView);
            nameText = itemView.findViewById(R.id.station_name);
            addressText = itemView.findViewById(R.id.station_address);
            capacityText = itemView.findViewById(R.id.station_capacity);
            emptySpaceText = itemView.findViewById(R.id.station_empty_space);
            distanceText = itemView.findViewById(R.id.station_distance);
            statusText = itemView.findViewById(R.id.station_status);
        }

        void bind(StationResponse station, Location userLocation,
                  OnStationClickListener listener, boolean selected) {
            nameText.setText(station.getName() + " (" + station.getStationCode() + ")");
            addressText.setText(station.getAddress());
            StatusUi.bind(statusText, station.getStatus());
            itemView.setContentDescription(station.getName() + ", "
                    + station.getStationCode() + ", status " + station.getStatus()
                    + ". View station details.");
            com.google.android.material.card.MaterialCardView card =
                    (com.google.android.material.card.MaterialCardView) itemView;
            card.setStrokeColor(androidx.core.content.ContextCompat.getColor(itemView.getContext(),
                    selected ? R.color.status_success : R.color.solar_border));
            card.setStrokeWidth(Math.round((selected ? 2 : 1)
                    * itemView.getResources().getDisplayMetrics().density));
            capacityText.setText(String.format("%.1f kWh", station.getCapacityKwh()));
            
            emptySpaceText.setText(String.format("%.1f kWh", station.getBatteryStorageKwh()));

            if (userLocation != null && Double.isFinite(station.getLatitude()) && Double.isFinite(station.getLongitude())) {
                Location stationLoc = new Location("");
                stationLoc.setLatitude(station.getLatitude());
                stationLoc.setLongitude(station.getLongitude());
                float distanceMeters = userLocation.distanceTo(stationLoc);
                if (distanceMeters < 1000) {
                    distanceText.setText(String.format("%.0f m away", distanceMeters));
                } else {
                    distanceText.setText(String.format("%.1f km away", distanceMeters / 1000f));
                }
                distanceText.setVisibility(View.VISIBLE);
            } else {
                distanceText.setVisibility(View.GONE);
            }

            itemView.setOnClickListener(v -> listener.onStationClick(station));
        }
    }
}
