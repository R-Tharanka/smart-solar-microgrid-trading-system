package com.smartsolar.microgrid.ui.prosumer;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.data.station.StationResponse;

import java.util.ArrayList;
import java.util.List;

public class StationAdapter extends RecyclerView.Adapter<StationAdapter.ViewHolder> {
    private final List<StationResponse> stations = new ArrayList<>();
    private final OnStationClickListener listener;

    public interface OnStationClickListener {
        void onStationClick(StationResponse station);
    }

    public StationAdapter(OnStationClickListener listener) {
        this.listener = listener;
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
        holder.bind(station, listener);
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

        ViewHolder(View itemView) {
            super(itemView);
            nameText = itemView.findViewById(R.id.station_name);
            addressText = itemView.findViewById(R.id.station_address);
            capacityText = itemView.findViewById(R.id.station_capacity);
            emptySpaceText = itemView.findViewById(R.id.station_empty_space);
        }

        void bind(StationResponse station, OnStationClickListener listener) {
            nameText.setText(station.getName() + " (" + station.getStationCode() + ")");
            addressText.setText(station.getAddress());
            capacityText.setText(String.format("%.1f kWh", station.getCapacityKwh()));
            
            double emptySpace = station.getCapacityKwh() - station.getBatteryStorageKwh();
            emptySpaceText.setText(String.format("%.1f kWh", emptySpace));

            itemView.setOnClickListener(v -> listener.onStationClick(station));
        }
    }
}
