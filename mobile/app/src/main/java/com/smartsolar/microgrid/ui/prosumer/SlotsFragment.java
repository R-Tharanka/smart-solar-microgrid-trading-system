package com.smartsolar.microgrid.ui.prosumer;

import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.fragment.NavHostFragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.data.api.ApiCallback;
import com.smartsolar.microgrid.data.api.ApiError;
import com.smartsolar.microgrid.data.station.BookingSlotResponse;
import com.smartsolar.microgrid.data.station.SlotRepository;

import java.util.ArrayList;
import java.util.List;

public class SlotsFragment extends Fragment {
    private SlotRepository repository;
    private SlotAdapter adapter;
    private String stationCode;
    private String stationId; // Might need this later, but we use code to fetch slots

    private RecyclerView recyclerView;
    private View progressBar;
    private View errorContainer;
    private TextView errorMessage;
    private View emptyStateText;

    public SlotsFragment() {
        super(R.layout.fragment_slots);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        repository = new SlotRepository(requireContext());

        if (getArguments() != null) {
            stationCode = getArguments().getString("stationCode");
            stationId = getArguments().getString("stationId");
            String stationName = getArguments().getString("stationName");
            TextView title = view.findViewById(R.id.station_details_title);
            if (stationName != null) {
                title.setText(stationName + " Slots");
            }
            bindStationDetails(view, getArguments(), stationName);
        }

        recyclerView = view.findViewById(R.id.slots_recycler_view);
        progressBar = view.findViewById(R.id.progress_bar);
        errorContainer = view.findViewById(R.id.error_container);
        errorMessage = view.findViewById(R.id.error_message);
        emptyStateText = view.findViewById(R.id.empty_state_text);

        adapter = new SlotAdapter(slot -> {
            Bundle args = new Bundle();
            args.putString("slotId", slot.getId());
            args.putString("stationId", stationId);
            args.putString("stationCode", stationCode);
            args.putString("slotCode", slot.getSlotCode());
            args.putDouble("availableEnergy", slot.getAvailableEnergyKwh());
            args.putString("startTime", slot.getStartTimeUtc());
            args.putString("endTime", slot.getEndTimeUtc());
            NavHostFragment.findNavController(this).navigate(R.id.createReservationFragment, args);
        });

        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        recyclerView.setAdapter(adapter);

        view.findViewById(R.id.retry_button).setOnClickListener(v -> loadSlots());

        if (stationCode != null) {
            loadSlots();
        } else {
            showError("Invalid station selection");
        }
    }

    private void bindStationDetails(View view, Bundle arguments, String stationName) {
        TextView details = view.findViewById(R.id.station_selected_details);
        if (stationName == null || stationCode == null
                || !arguments.containsKey("stationCapacity")) {
            details.setVisibility(View.GONE);
            return;
        }

        String address = value(arguments.getString("stationAddress"));
        String openingTime = value(arguments.getString("stationOpeningTime"));
        String closingTime = value(arguments.getString("stationClosingTime"));
        String status = value(arguments.getString("stationStatus"));
        details.setText(getString(R.string.station_selected_details,
                stationName, stationCode, address,
                arguments.getDouble("stationCapacity"),
                arguments.getDouble("stationBatteryStorage"),
                openingTime, closingTime, status));
        details.setVisibility(View.VISIBLE);
    }

    private String value(String value) {
        return value == null || value.trim().isEmpty()
                ? getString(R.string.not_provided) : value;
    }

    private void loadSlots() {
        showLoading();
        repository.getSlotsForStation(stationCode, new ApiCallback<List<BookingSlotResponse>>() {
            @Override
            public void onSuccess(List<BookingSlotResponse> data, String message) {
                if (data == null || data.isEmpty()) {
                    showEmpty();
                } else {
                    // Present every returned status; SlotAdapter only offers booking for
                    // server-reported Available slots with remaining energy.
                    adapter.setSlots(data);
                    showContent();
                }
            }

            @Override
            public void onError(ApiError error) {
                showError(error.getUserMessage());
            }
        });
    }

    private void showLoading() {
        progressBar.setVisibility(View.VISIBLE);
        recyclerView.setVisibility(View.GONE);
        errorContainer.setVisibility(View.GONE);
        emptyStateText.setVisibility(View.GONE);
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
