package com.smartsolar.microgrid.ui.prosumer;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.data.identity.UtcTimestampParser;
import com.smartsolar.microgrid.data.station.BookingSlotResponse;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class SlotAdapter extends RecyclerView.Adapter<SlotAdapter.ViewHolder> {
    private final List<BookingSlotResponse> slots = new ArrayList<>();
    private final OnSlotClickListener listener;

    public interface OnSlotClickListener {
        void onReserveClick(BookingSlotResponse slot);
    }

    public SlotAdapter(OnSlotClickListener listener) {
        this.listener = listener;
    }

    public void setSlots(List<BookingSlotResponse> newSlots) {
        slots.clear();
        if (newSlots != null) {
            slots.addAll(newSlots);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_slot, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        BookingSlotResponse slot = slots.get(position);
        holder.bind(slot, listener);
    }

    @Override
    public int getItemCount() {
        return slots.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        private final TextView timeText;
        private final TextView availableEnergyText;
        private final TextView priceText;
        private final Button reserveButton;

        ViewHolder(View itemView) {
            super(itemView);
            timeText = itemView.findViewById(R.id.slot_time);
            availableEnergyText = itemView.findViewById(R.id.slot_available_energy);
            priceText = itemView.findViewById(R.id.slot_price);
            reserveButton = itemView.findViewById(R.id.reserve_button);
        }

        void bind(BookingSlotResponse slot, OnSlotClickListener listener) {
            String timeStr = formatTime(slot.getStartTimeUtc()) + " - " + formatTime(slot.getEndTimeUtc());
            timeText.setText(timeStr);
            availableEnergyText.setText(String.format("%.1f kWh", slot.getAvailableEnergyKwh()));
            priceText.setText(String.format("$%.2f", slot.getPricePerKwh()));

            if ("Available".equalsIgnoreCase(slot.getStatus()) && slot.getAvailableEnergyKwh() > 0) {
                reserveButton.setEnabled(true);
                reserveButton.setOnClickListener(v -> listener.onReserveClick(slot));
            } else {
                reserveButton.setEnabled(false);
                reserveButton.setText("Unavailable");
            }
        }

        private String formatTime(String utcTime) {
            try {
                long millis = UtcTimestampParser.parseEpochMillis(utcTime);
                SimpleDateFormat sdf = new SimpleDateFormat("MMM dd, yyyy h:mm a", Locale.getDefault());
                return sdf.format(new Date(millis));
            } catch (ParseException e) {
                return utcTime;
            }
        }
    }
}
