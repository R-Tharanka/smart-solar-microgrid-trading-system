package com.smartsolar.microgrid.ui.prosumer;

import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.fragment.NavHostFragment;

import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.data.api.ApiCallback;
import com.smartsolar.microgrid.data.api.ApiError;
import com.smartsolar.microgrid.data.identity.IdentityRepository;
import com.smartsolar.microgrid.data.identity.UserResponse;
import com.smartsolar.microgrid.data.reservation.ProsumerDashboardResponse;
import com.smartsolar.microgrid.data.reservation.ReservationRepository;
import com.smartsolar.microgrid.data.session.Session;
import com.smartsolar.microgrid.data.session.SessionManager;
import com.smartsolar.microgrid.navigation.AuthenticationNavigator;
import com.smartsolar.microgrid.ui.common.StatusUi;

public class ProsumerHomeFragment extends Fragment {
    private ReservationRepository reservationRepository;

    public ProsumerHomeFragment() {
        super(R.layout.fragment_prosumer_home);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        Session session = SessionManager.getInstance(requireContext()).loadSession();
        if (session == null) {
            AuthenticationNavigator.logout(this);
            return;
        }

        reservationRepository = new ReservationRepository(requireContext());

        TextView welcome = view.findViewById(R.id.prosumer_welcome);
        welcome.setText(getString(R.string.welcome_user, session.getDisplayName()));
        view.findViewById(R.id.browse_stations_button).setOnClickListener(button ->
                NavHostFragment.findNavController(this).navigate(R.id.stationsFragment));
        view.findViewById(R.id.my_bookings_button).setOnClickListener(button ->
                NavHostFragment.findNavController(this).navigate(R.id.myBookingsFragment));
        view.findViewById(R.id.profile_button).setOnClickListener(button ->
                NavHostFragment.findNavController(this).navigate(R.id.profileFragment));
        view.findViewById(R.id.logout_button).setOnClickListener(button ->
                AuthenticationNavigator.logout(this));
        view.findViewById(R.id.reservation_summary_retry).setOnClickListener(button ->
                loadReservationSummary());

        new IdentityRepository(requireContext()).getProfile(new ApiCallback<UserResponse>() {
            @Override
            public void onSuccess(UserResponse user, String message) {
                if (getView() != view || user == null) return;
                TextView accountStatus = view.findViewById(R.id.prosumer_account_status);
                StatusUi.bind(accountStatus, user.getStatus());
                accountStatus.setVisibility(View.VISIBLE);
                view.findViewById(R.id.prosumer_deactivation_request)
                        .setVisibility(user.isDeactivationRequested() ? View.VISIBLE : View.GONE);
            }

            @Override
            public void onError(ApiError error) {
                if (getView() != view) return;
                if (AuthenticationNavigator.handleExpiredSession(ProsumerHomeFragment.this, error)) return;
                TextView accountStatus = view.findViewById(R.id.prosumer_account_status);
                StatusUi.bind(accountStatus, "Status unavailable");
                accountStatus.setVisibility(View.VISIBLE);
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        if (reservationRepository != null) {
            loadReservationSummary();
        }
    }

    private void loadReservationSummary() {
        View view = getView();
        if (view == null) return;

        view.findViewById(R.id.reservation_summary_loading).setVisibility(View.VISIBLE);
        view.findViewById(R.id.reservation_summary_content).setVisibility(View.GONE);
        view.findViewById(R.id.reservation_summary_error).setVisibility(View.GONE);
        view.findViewById(R.id.reservation_summary_retry).setVisibility(View.GONE);
        view.findViewById(R.id.reservation_summary_zero).setVisibility(View.GONE);

        reservationRepository.getProsumerDashboard(new ApiCallback<ProsumerDashboardResponse>() {
            @Override
            public void onSuccess(ProsumerDashboardResponse summary, String message) {
                if (getView() != view) return;
                view.findViewById(R.id.reservation_summary_loading).setVisibility(View.GONE);
                if (summary == null) {
                    showReservationSummaryError(view);
                    return;
                }

                ((TextView) view.findViewById(R.id.pending_reservation_count))
                        .setText(String.valueOf(summary.getPendingCount()));
                ((TextView) view.findViewById(R.id.approved_future_reservation_count))
                        .setText(String.valueOf(summary.getApprovedFutureCount()));
                view.findViewById(R.id.reservation_summary_content).setVisibility(View.VISIBLE);
                view.findViewById(R.id.reservation_summary_zero).setVisibility(
                        summary.getPendingCount() == 0 && summary.getApprovedFutureCount() == 0
                                ? View.VISIBLE : View.GONE);
            }

            @Override
            public void onError(ApiError error) {
                if (getView() != view) return;
                if (AuthenticationNavigator.handleExpiredSession(ProsumerHomeFragment.this, error)) {
                    return;
                }
                showReservationSummaryError(view);
            }
        });
    }

    private void showReservationSummaryError(View view) {
        view.findViewById(R.id.reservation_summary_loading).setVisibility(View.GONE);
        view.findViewById(R.id.reservation_summary_content).setVisibility(View.GONE);
        view.findViewById(R.id.reservation_summary_error).setVisibility(View.VISIBLE);
        view.findViewById(R.id.reservation_summary_retry).setVisibility(View.VISIBLE);
        view.findViewById(R.id.reservation_summary_zero).setVisibility(View.GONE);
    }
}
