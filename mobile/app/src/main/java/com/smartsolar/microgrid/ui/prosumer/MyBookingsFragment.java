package com.smartsolar.microgrid.ui.prosumer;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.EditText;
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
import com.smartsolar.microgrid.navigation.AuthenticationNavigator;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class MyBookingsFragment extends Fragment {
    private ReservationRepository repository;
    private BookingAdapter adapter;

    private RecyclerView recyclerView;
    private ProgressBar progressBar;
    private View errorContainer;
    private TextView errorMessage;
    private View emptyStateText;
    private EditText searchInput;
    private final List<ReservationSummaryResponse> allBookings = new ArrayList<>();
    private BookingCategoryClassifier.Category selectedCategory =
            BookingCategoryClassifier.Category.ALL;

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
        searchInput = view.findViewById(R.id.booking_search_input);

        adapter = new BookingAdapter(booking -> {
            Bundle args = new Bundle();
            args.putString("reservationId", booking.getReservationId());
            NavHostFragment.findNavController(this).navigate(R.id.bookingDetailsFragment, args);
        });

        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        recyclerView.setAdapter(adapter);

        view.findViewById(R.id.retry_button).setOnClickListener(v -> loadBookings());
        configureFilters(view);
    }

    @Override
    public void onResume() {
        super.onResume();
        if (repository != null) {
            loadBookings();
        }
    }

    private void configureFilters(View view) {
        searchInput.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) { }
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {
                applyFilters();
            }
            @Override public void afterTextChanged(Editable s) { }
        });

        com.google.android.material.button.MaterialButtonToggleGroup group =
                view.findViewById(R.id.booking_category_toggle);
        group.addOnButtonCheckedListener((toggleGroup, checkedId, isChecked) -> {
            if (!isChecked) return;
            if (checkedId == R.id.bookings_pending_filter) {
                selectedCategory = BookingCategoryClassifier.Category.PENDING;
            } else if (checkedId == R.id.bookings_upcoming_filter) {
                selectedCategory = BookingCategoryClassifier.Category.CURRENT_UPCOMING;
            } else if (checkedId == R.id.bookings_history_filter) {
                selectedCategory = BookingCategoryClassifier.Category.HISTORY;
            } else {
                selectedCategory = BookingCategoryClassifier.Category.ALL;
            }
            applyFilters();
        });
    }

    private void loadBookings() {
        showLoading();
        repository.getMyReservations(new ApiCallback<List<ReservationSummaryResponse>>() {
            @Override
            public void onSuccess(List<ReservationSummaryResponse> data, String message) {
                allBookings.clear();
                if (data != null) allBookings.addAll(data);
                applyFilters();
            }

            @Override
            public void onError(ApiError error) {
                if (AuthenticationNavigator.handleExpiredSession(
                        MyBookingsFragment.this, error)) return;
                showError(error.getUserMessage());
            }
        });
    }

    private void applyFilters() {
        if (adapter == null || searchInput == null) return;

        String query = searchInput.getText().toString().trim().toLowerCase(Locale.ROOT);
        long now = System.currentTimeMillis();
        List<ReservationSummaryResponse> visible = new ArrayList<>();
        for (ReservationSummaryResponse booking : allBookings) {
            BookingCategoryClassifier.Category category =
                    BookingCategoryClassifier.classify(booking, now);
            boolean categoryMatches = selectedCategory == BookingCategoryClassifier.Category.ALL
                    || selectedCategory == category;
            String code = booking.getReservationCode() == null
                    ? "" : booking.getReservationCode().toLowerCase(Locale.ROOT);
            String status = booking.getStatus() == null
                    ? "" : booking.getStatus().toLowerCase(Locale.ROOT);
            boolean searchMatches = query.isEmpty()
                    || code.contains(query)
                    || status.contains(query);
            if (categoryMatches && searchMatches) visible.add(booking);
        }

        adapter.setBookings(visible);
        if (visible.isEmpty()) {
            showEmpty();
        } else {
            showContent();
        }
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
