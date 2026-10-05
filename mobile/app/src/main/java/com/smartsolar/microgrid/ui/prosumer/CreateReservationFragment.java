package com.smartsolar.microgrid.ui.prosumer;

import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.fragment.NavHostFragment;

import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.data.api.ApiCallback;
import com.smartsolar.microgrid.data.api.ApiError;
import com.smartsolar.microgrid.data.identity.UtcTimestampParser;
import com.smartsolar.microgrid.data.reservation.CreateReservationRequest;
import com.smartsolar.microgrid.data.reservation.ReservationRepository;
import com.smartsolar.microgrid.data.reservation.ReservationResponse;
import com.smartsolar.microgrid.navigation.AuthenticationNavigator;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class CreateReservationFragment extends Fragment {
    private ReservationRepository repository;
    private String stationId;
    private String slotId;
    private String stationCode;
    private String slotCode;
    private double availableEnergy;
    private String startTime;
    private String endTime;

    private EditText energyInput;
    private Button submitButton;
    private ProgressBar progressBar;

    public CreateReservationFragment() {
        super(R.layout.fragment_create_reservation);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        repository = new ReservationRepository(requireContext());

        if (getArguments() != null) {
            stationId = getArguments().getString("stationId");
            slotId = getArguments().getString("slotId");
            stationCode = getArguments().getString("stationCode");
            slotCode = getArguments().getString("slotCode");
            availableEnergy = getArguments().getDouble("availableEnergy", 0.0);
            startTime = getArguments().getString("startTime");
            endTime = getArguments().getString("endTime");
        }

        TextView stationCodeText = view.findViewById(R.id.station_code_text);
        TextView slotCodeText = view.findViewById(R.id.slot_code_text);
        TextView availableEnergyText = view.findViewById(R.id.available_energy_text);

        stationCodeText.setText("Station: " + (stationCode != null ? stationCode : "Unknown"));
        
        String formattedTime = startTime != null ? formatTime(startTime) : "Unknown Time";
        slotCodeText.setText("Slot: " + (slotCode != null ? slotCode : "Unknown") + " (" + formattedTime + ")");
        
        availableEnergyText.setText(String.format("Available Capacity: %.1f kWh", availableEnergy));

        energyInput = view.findViewById(R.id.energy_input);
        submitButton = view.findViewById(R.id.submit_reservation_button);
        progressBar = view.findViewById(R.id.progress_bar);

        submitButton.setOnClickListener(v -> submitReservation());
    }

    private void submitReservation() {
        String energyStr = energyInput.getText().toString().trim();
        if (TextUtils.isEmpty(energyStr)) {
            energyInput.setError("Required");
            return;
        }

        double requestedEnergy;
        try {
            requestedEnergy = Double.parseDouble(energyStr);
        } catch (NumberFormatException e) {
            energyInput.setError("Invalid number");
            return;
        }

        if (requestedEnergy <= 0) {
            energyInput.setError("Energy must be greater than zero");
            return;
        }
        if (requestedEnergy > availableEnergy) {
            energyInput.setError("Exceeds available capacity");
            return;
        }

        CreateReservationRequest request = new CreateReservationRequest(stationId, slotId, requestedEnergy);
        String when = startTime == null ? "Time unavailable" : formatTime(startTime);
        if (endTime != null) when += " – " + formatTime(endTime);
        new MaterialAlertDialogBuilder(requireContext())
                .setTitle("Review reservation")
                .setMessage("Station " + stationCode + "  •  Slot " + slotCode
                        + "\n" + when + "\n" + requestedEnergy
                        + " kWh\n\nYour request will be pending staff approval.")
                .setNegativeButton("Edit", null)
                .setPositiveButton("Submit reservation", (dialog, which) -> executeReservation(request))
                .show();
    }

    private void executeReservation(CreateReservationRequest request) {
        showLoading(true);
        repository.createReservation(request, new ApiCallback<ReservationResponse>() {
            @Override
            public void onSuccess(ReservationResponse data, String message) {
                showLoading(false);
                showConfirmationDialog(data);
            }

            @Override
            public void onError(ApiError error) {
                showLoading(false);
                if (AuthenticationNavigator.handleExpiredSession(
                        CreateReservationFragment.this, error)) return;
                Toast.makeText(requireContext(), error.getUserMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void showConfirmationDialog(ReservationResponse response) {
        String formattedStart = formatTime(response.getScheduledStartTimeUtc());
        String message = String.format(Locale.getDefault(),
                "Booking Code: %s\nStation: %s\nSlot: %s\nEnergy: %.1f kWh\nTime: %s\nStatus: %s\n\nYour reservation is pending staff approval.",
                response.getReservationCode(),
                stationCode,
                slotCode,
                response.getRequestedEnergyKwh(),
                formattedStart,
                response.getStatus());

        new MaterialAlertDialogBuilder(requireContext())
                .setTitle("Reservation Created")
                .setMessage(message)
                .setPositiveButton("OK", (dialog, which) -> {
                    NavHostFragment.findNavController(this).popBackStack(R.id.prosumerHomeFragment, false);
                })
                .setCancelable(false)
                .show();
    }

    private void showLoading(boolean isLoading) {
        progressBar.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        submitButton.setEnabled(!isLoading);
        energyInput.setEnabled(!isLoading);
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
