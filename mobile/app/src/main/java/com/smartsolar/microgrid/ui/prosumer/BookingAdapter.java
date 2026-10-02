package com.smartsolar.microgrid.ui.prosumer;

import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.data.identity.UtcTimestampParser;
import com.smartsolar.microgrid.data.reservation.ReservationSummaryResponse;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class BookingAdapter extends RecyclerView.Adapter<BookingAdapter.ViewHolder> {
    private final List<ReservationSummaryResponse> bookings = new ArrayList<>();
    private final OnBookingClickListener listener;

    public interface OnBookingClickListener {
        void onBookingClick(ReservationSummaryResponse booking);
    }

    public BookingAdapter(OnBookingClickListener listener) {
        this.listener = listener;
    }

    public void setBookings(List<ReservationSummaryResponse> newBookings) {
        bookings.clear();
        if (newBookings != null) {
            bookings.addAll(newBookings);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_booking, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        ReservationSummaryResponse booking = bookings.get(position);
        holder.bind(booking, listener);
    }

    @Override
    public int getItemCount() {
        return bookings.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        private final TextView codeText;
        private final TextView timeText;
        private final TextView energyText;
        private final TextView statusText;

        ViewHolder(View itemView) {
            super(itemView);
            codeText = itemView.findViewById(R.id.booking_code);
            timeText = itemView.findViewById(R.id.booking_time);
            energyText = itemView.findViewById(R.id.booking_energy);
            statusText = itemView.findViewById(R.id.booking_status);
        }

        void bind(ReservationSummaryResponse booking, OnBookingClickListener listener) {
            codeText.setText(booking.getReservationCode());
            String timeStr = formatTime(booking.getScheduledStartTimeUtc()) + " - " + formatTime(booking.getScheduledEndTimeUtc());
            timeText.setText(timeStr);
            energyText.setText(String.format("%.1f kWh", booking.getRequestedEnergyKwh()));
            
            String status = booking.getStatus();
            statusText.setText(status);
            if ("Approved".equalsIgnoreCase(status) || "Completed".equalsIgnoreCase(status)) {
                statusText.setTextColor(Color.parseColor("#388E3C"));
            } else if ("Cancelled".equalsIgnoreCase(status) || "Rejected".equalsIgnoreCase(status)) {
                statusText.setTextColor(Color.parseColor("#D32F2F"));
            } else {
                statusText.setTextColor(Color.parseColor("#F57C00"));
            }

            itemView.setOnClickListener(v -> listener.onBookingClick(booking));
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
