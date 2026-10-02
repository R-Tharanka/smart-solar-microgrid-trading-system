package com.smartsolar.microgrid.ui.prosumer;

import android.os.Bundle;
import android.view.View;
import android.widget.ProgressBar;
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
import com.smartsolar.microgrid.data.reservation.ReservationRepository;
import com.smartsolar.microgrid.data.reservation.ReservationSummaryResponse;

import java.util.List;

public class MyBookingsFragment extends Fragment {
    private ReservationRepository repository;
    private BookingAdapter adapter;

    private RecyclerView recyclerView;
    private ProgressBar progressBar;
    private View errorContainer;
    private TextView errorMessage;
    private View emptyStateText;

    public MyBookingsFragment() {
        super(R.layout.fragment_my_bookings);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        repository = new ReservationRepository(requireContext());

        recyclerView = view.findViewById(R.id.bookings_recycler_view);
        progressBar = view.findViewById(R.id.progress_bar);
        errorContainer = view.findViewById(R.id.error_container);
        errorMessage = view.findViewById(R.id.error_message);
        emptyStateText = view.findViewById(R.id.empty_state_text);

        adapter = new BookingAdapter(booking -> {
            Bundle args = new Bundle();
            args.putString("reservationId", booking.getReservationId());
            NavHostFragment.findNavController(this).navigate(R.id.bookingDetailsFragment, args);
        });

        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        recyclerView.setAdapter(adapter);

        view.findViewById(R.id.retry_button).setOnClickListener(v -> loadBookings());

        loadBookings();
    }

    private void loadBookings() {
        showLoading();
        repository.getMyReservations(new ApiCallback<List<ReservationSummaryResponse>>() {
            @Override
            public void onSuccess(List<ReservationSummaryResponse> data, String message) {
                if (data == null || data.isEmpty()) {
                    showEmpty();
                } else {
                    adapter.setBookings(data);
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
