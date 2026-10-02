package com.smartsolar.microgrid.ui.prosumer;

import android.os.Bundle;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.fragment.NavHostFragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.data.api.ApiCallback;
import com.smartsolar.microgrid.data.api.ApiError;
import com.smartsolar.microgrid.data.station.StationRepository;
import com.smartsolar.microgrid.data.station.StationResponse;

import java.util.ArrayList;
import java.util.List;

public class StationsFragment extends Fragment {
    private StationRepository repository;
    private StationAdapter adapter;
    private RecyclerView recyclerView;
    private ProgressBar progressBar;
    private View errorContainer;
    private TextView errorMessage;
    private View emptyStateText;

    public StationsFragment() {
        super(R.layout.fragment_stations);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        repository = new StationRepository(requireContext());

        recyclerView = view.findViewById(R.id.stations_recycler_view);
        progressBar = view.findViewById(R.id.progress_bar);
        errorContainer = view.findViewById(R.id.error_container);
        errorMessage = view.findViewById(R.id.error_message);
        emptyStateText = view.findViewById(R.id.empty_state_text);

        adapter = new StationAdapter(station -> {
            Bundle args = new Bundle();
            args.putString("stationId", station.getId());
            args.putString("stationCode", station.getStationCode());
            args.putString("stationName", station.getName());
            // Navigate to station details (slots)
            NavHostFragment.findNavController(this).navigate(R.id.slotsFragment, args);
        });
        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        recyclerView.setAdapter(adapter);

        view.findViewById(R.id.retry_button).setOnClickListener(v -> loadStations());

        loadStations();
    }

    private void loadStations() {
        showLoading();
        repository.getStations(new ApiCallback<List<StationResponse>>() {
            @Override
            public void onSuccess(List<StationResponse> data, String message) {
                if (data == null || data.isEmpty()) {
                    showEmpty();
                } else {
                    List<StationResponse> activeStations = new ArrayList<>();
                    for (StationResponse station : data) {
                        if ("Active".equalsIgnoreCase(station.getStatus())) {
                            activeStations.add(station);
                        }
                    }
                    if (activeStations.isEmpty()) {
                        showEmpty();
                    } else {
                        adapter.setStations(activeStations);
                        showContent();
                    }
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
