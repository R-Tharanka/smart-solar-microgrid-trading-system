package com.smartsolar.microgrid.ui.prosumer;

import android.app.AlertDialog;
import android.graphics.Color;
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

import com.google.android.material.textfield.TextInputLayout;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.data.api.ApiCallback;
import com.smartsolar.microgrid.data.api.ApiError;
import com.smartsolar.microgrid.data.identity.UtcTimestampParser;
import com.smartsolar.microgrid.data.reservation.CancelReservationRequest;
import com.smartsolar.microgrid.data.reservation.ReservationRepository;
import com.smartsolar.microgrid.data.reservation.ReservationResponse;
import com.smartsolar.microgrid.data.reservation.UpdateReservationRequest;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class BookingDetailsFragment extends Fragment {
    private ReservationRepository repository;
    private String reservationId;

    private TextView codeText;
    private TextView statusText;
    private TextView timeText;
    private TextView noteText;
    private TextInputLayout energyInputLayout;
    private EditText energyInput;
    private View actionsContainer;
    private Button updateButton;
    private Button cancelButton;
    private ProgressBar progressBar;

    private ReservationResponse currentReservation;

    public BookingDetailsFragment() {
        super(R.layout.fragment_booking_details);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        repository = new ReservationRepository(requireContext());

        if (getArguments() != null) {
            reservationId = getArguments().getString("reservationId");
        }

        codeText = view.findViewById(R.id.detail_code);
        statusText = view.findViewById(R.id.detail_status);
        timeText = view.findViewById(R.id.detail_time);
        noteText = view.findViewById(R.id.detail_note);
        energyInputLayout = view.findViewById(R.id.energy_input_layout);
        energyInput = view.findViewById(R.id.energy_input);
        actionsContainer = view.findViewById(R.id.actions_container);
        updateButton = view.findViewById(R.id.update_button);
        cancelButton = view.findViewById(R.id.cancel_button);
        progressBar = view.findViewById(R.id.progress_bar);

        updateButton.setOnClickListener(v -> updateReservation());
        cancelButton.setOnClickListener(v -> promptCancelReservation());

        if (reservationId != null) {
            loadDetails();
        } else {
            Toast.makeText(requireContext(), "No reservation ID provided", Toast.LENGTH_SHORT).show();
            NavHostFragment.findNavController(this).popBackStack();
        }
    }

    private void loadDetails() {
        showLoading(true);
        repository.getReservationDetails(reservationId, new ApiCallback<ReservationResponse>() {
            @Override
            public void onSuccess(ReservationResponse data, String message) {
                showLoading(false);
                currentReservation = data;
                populateUI();
            }

            @Override
            public void onError(ApiError error) {
                showLoading(false);
                Toast.makeText(requireContext(), error.getUserMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void populateUI() {
        if (currentReservation == null) return;

        codeText.setText("Booking Code: " + currentReservation.getReservationCode());
        
        String status = currentReservation.getStatus();
        statusText.setText("Status: " + status);
        if ("Approved".equalsIgnoreCase(status) || "Completed".equalsIgnoreCase(status)) {
            statusText.setTextColor(Color.parseColor("#388E3C"));
        } else if ("Cancelled".equalsIgnoreCase(status) || "Rejected".equalsIgnoreCase(status)) {
            statusText.setTextColor(Color.parseColor("#D32F2F"));
        } else {
            statusText.setTextColor(Color.parseColor("#F57C00"));
        }

        String timeStr = formatTime(currentReservation.getScheduledStartTimeUtc()) + " - " + formatTime(currentReservation.getScheduledEndTimeUtc());
        timeText.setText("Scheduled Time: " + timeStr);

        if (!TextUtils.isEmpty(currentReservation.getConfirmationNote())) {
            noteText.setVisibility(View.VISIBLE);
            noteText.setText("Note: " + currentReservation.getConfirmationNote());
        } else {
            noteText.setVisibility(View.GONE);
        }

        energyInput.setText(String.valueOf(currentReservation.getRequestedEnergyKwh()));

        // Only allow edits if Pending or Approved (based on backend logic)
        boolean isEditable = "Pending".equalsIgnoreCase(status) || "Approved".equalsIgnoreCase(status);
        energyInput.setEnabled(isEditable);
        actionsContainer.setVisibility(isEditable ? View.VISIBLE : View.GONE);
    }

    private void updateReservation() {
        if (currentReservation == null) return;
        
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
            energyInput.setError("Energy must be positive");
            return;
        }
        
        if (requestedEnergy == currentReservation.getRequestedEnergyKwh()) {
            Toast.makeText(requireContext(), "No changes to save.", Toast.LENGTH_SHORT).show();
            return;
        }

        showLoading(true);
        UpdateReservationRequest request = new UpdateReservationRequest(requestedEnergy);
        repository.updateReservation(reservationId, request, new ApiCallback<ReservationResponse>() {
            @Override
            public void onSuccess(ReservationResponse data, String message) {
                showLoading(false);
                Toast.makeText(requireContext(), "Reservation updated.", Toast.LENGTH_SHORT).show();
                currentReservation = data;
                populateUI();
            }

            @Override
            public void onError(ApiError error) {
                showLoading(false);
                showErrorDialog("Update Failed", error.getUserMessage());
            }
        });
    }

    private void promptCancelReservation() {
        new AlertDialog.Builder(requireContext())
                .setTitle("Cancel Reservation")
                .setMessage("Are you sure you want to cancel this reservation?")
                .setPositiveButton("Yes", (dialog, which) -> cancelReservation())
                .setNegativeButton("No", null)
                .show();
    }

    private void cancelReservation() {
        showLoading(true);
        CancelReservationRequest request = new CancelReservationRequest("Cancelled by Prosumer via app");
        repository.cancelReservation(reservationId, request, new ApiCallback<ReservationResponse>() {
            @Override
            public void onSuccess(ReservationResponse data, String message) {
                showLoading(false);
                Toast.makeText(requireContext(), "Reservation cancelled.", Toast.LENGTH_SHORT).show();
                currentReservation = data;
                populateUI();
            }

            @Override
            public void onError(ApiError error) {
                showLoading(false);
                showErrorDialog("Cancel Failed", error.getUserMessage());
            }
        });
    }

    private void showErrorDialog(String title, String message) {
        new AlertDialog.Builder(requireContext())
                .setTitle(title)
                .setMessage(message)
                .setPositiveButton("OK", null)
                .show();
    }

    private void showLoading(boolean isLoading) {
        progressBar.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        updateButton.setEnabled(!isLoading);
        cancelButton.setEnabled(!isLoading);
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
