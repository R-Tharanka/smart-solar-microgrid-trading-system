package com.smartsolar.microgrid.ui.profile;

import android.os.Bundle;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.fragment.NavHostFragment;

import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.data.api.ApiCallback;
import com.smartsolar.microgrid.data.api.ApiError;
import com.smartsolar.microgrid.data.identity.IdentityRepository;
import com.smartsolar.microgrid.data.identity.CachedUserProfile;
import com.smartsolar.microgrid.data.identity.UserResponse;
import com.smartsolar.microgrid.navigation.AuthenticationNavigator;

import java.text.DateFormat;
import java.util.Date;

public class ProfileFragment extends Fragment {
    private ProgressBar progressBar;
    private View errorState, emptyState, content;
    private TextView errorView;
    private IdentityRepository repository;
    private boolean requestRunning;

    public ProfileFragment() {
        super(R.layout.fragment_profile);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        repository = new IdentityRepository(requireContext());
        progressBar = view.findViewById(R.id.profile_progress);
        errorState = view.findViewById(R.id.profile_error_state);
        emptyState = view.findViewById(R.id.profile_empty_state);
        content = view.findViewById(R.id.profile_content);
        errorView = view.findViewById(R.id.profile_error);

        view.findViewById(R.id.profile_retry_button).setOnClickListener(button -> loadProfile());
        view.findViewById(R.id.edit_profile_button).setOnClickListener(button ->
                NavHostFragment.findNavController(this).navigate(R.id.editProfileFragment));
        view.findViewById(R.id.profile_logout_button).setOnClickListener(button ->
                AuthenticationNavigator.logout(this));
        view.findViewById(R.id.deactivate_button).setOnClickListener(button -> confirmDeactivation());
    }

    @Override
    public void onResume() {
        super.onResume();
        loadProfile();
    }

    private void loadProfile() {
        if (requestRunning || getView() == null) return;
        requestRunning = true;
        showOnly(progressBar);
        repository.getProfile(new ApiCallback<UserResponse>() {
            @Override
            public void onSuccess(UserResponse user, String message) {
                requestRunning = false;
                if (!isAdded() || getView() == null) return;
                if (user == null) {
                    showOnly(emptyState);
                    return;
                }
                bindProfile(getView(), user);
                showOnlineState(getView());
                showOnly(content);
            }

            @Override
            public void onError(ApiError error) {
                requestRunning = false;
                if (!isAdded() || getView() == null) return;
                if (AuthenticationNavigator.handleExpiredSession(ProfileFragment.this, error)) return;
                if (!canUseCachedFallback(error)) {
                    errorView.setText(error.getUserMessage());
                    showOnly(errorState);
                    return;
                }
                CachedUserProfile cached = repository.getCachedProfile();
                if (cached == null) {
                    errorView.setText(R.string.profile_unavailable_offline);
                    showOnly(errorState);
                    return;
                }
                bindCachedProfile(getView(), cached);
                showOfflineState(getView(), cached.getLastSyncedAtEpochMillis());
                showOnly(content);
            }
        });
    }

    private boolean canUseCachedFallback(ApiError error) {
        return "NETWORK_ERROR".equals(error.getErrorCode())
                || "INVALID_RESPONSE".equals(error.getErrorCode())
                || error.getStatusCode() >= 500;
    }

    private void bindProfile(View view, UserResponse user) {
        setText(view, R.id.profile_first_name, user.getFirstName());
        setText(view, R.id.profile_last_name, user.getLastName());
        setText(view, R.id.profile_email, user.getEmail());
        setText(view, R.id.profile_nic, user.getNic());
        setText(view, R.id.profile_phone, user.getPhoneNumber());
        setText(view, R.id.profile_address, user.getAddress());
        setText(view, R.id.profile_status, user.getStatus());
        showDeactivationRequestState(view, user.isDeactivationRequested());
    }

    private void bindCachedProfile(View view, CachedUserProfile user) {
        setText(view, R.id.profile_first_name, user.getFirstName());
        setText(view, R.id.profile_last_name, user.getLastName());
        setText(view, R.id.profile_email, user.getEmail());
        setText(view, R.id.profile_nic, user.getNic());
        setText(view, R.id.profile_phone, user.getPhone());
        setText(view, R.id.profile_address, user.getAddress());
        setText(view, R.id.profile_status, user.getAccountStatus());
        showDeactivationRequestState(view, user.isDeactivationRequested());
    }

    private void showOnlineState(View view) {
        view.findViewById(R.id.profile_offline_notice).setVisibility(View.GONE);
        view.findViewById(R.id.edit_profile_button).setEnabled(true);
    }

    private void showOfflineState(View view, long lastSyncedAt) {
        TextView notice = view.findViewById(R.id.profile_offline_notice);
        String formatted = DateFormat.getDateTimeInstance(
                DateFormat.MEDIUM, DateFormat.SHORT).format(new Date(lastSyncedAt));
        notice.setText(getString(R.string.profile_offline_last_synced, formatted));
        notice.setVisibility(View.VISIBLE);
        view.findViewById(R.id.edit_profile_button).setEnabled(false);
        view.findViewById(R.id.deactivate_button).setEnabled(false);
    }

    private void showDeactivationRequestState(View view, boolean requested) {
        // Keep the pending request separate from the account's active status.
        view.findViewById(R.id.profile_deactivation_request)
                .setVisibility(requested ? View.VISIBLE : View.GONE);
        view.findViewById(R.id.deactivate_button).setEnabled(!requested);
    }

    private void setText(View view, int id, String value) {
        TextView textView = view.findViewById(id);
        textView.setText(value == null || value.trim().isEmpty()
                ? getString(R.string.not_provided) : value);
    }

    private void confirmDeactivation() {
        new MaterialAlertDialogBuilder(requireContext())
                .setTitle(R.string.deactivate_title)
                .setMessage(R.string.deactivate_message)
                .setNegativeButton(R.string.cancel_action, null)
                .setPositiveButton(R.string.confirm_deactivate_action,
                        (dialog, which) -> deactivateAccount())
                .show();
    }

    private void deactivateAccount() {
        if (requestRunning) return;
        showOnly(progressBar);
        requestRunning = true;
        repository.requestOwnDeactivation(new ApiCallback<Void>() {
            @Override
            public void onSuccess(Void data, String message) {
                requestRunning = false;
                if (!isAdded() || getView() == null) return;
                showDeactivationRequestState(requireView(), true);
                showOnly(content);
                Toast.makeText(requireContext(), R.string.deactivation_request_sent,
                        Toast.LENGTH_LONG).show();
            }

            @Override
            public void onError(ApiError error) {
                requestRunning = false;
                if (!isAdded() || getView() == null) return;
                if (AuthenticationNavigator.handleExpiredSession(ProfileFragment.this, error)) return;
                if ("USER_DEACTIVATION_ALREADY_REQUESTED".equals(error.getErrorCode())) {
                    showDeactivationRequestState(requireView(), true);
                    showOnly(content);
                    Toast.makeText(requireContext(), error.getUserMessage(), Toast.LENGTH_LONG).show();
                    return;
                }
                errorView.setText(error.getUserMessage());
                showOnly(errorState);
            }
        });
    }

    private void showOnly(View visible) {
        progressBar.setVisibility(visible == progressBar ? View.VISIBLE : View.GONE);
        errorState.setVisibility(visible == errorState ? View.VISIBLE : View.GONE);
        emptyState.setVisibility(visible == emptyState ? View.VISIBLE : View.GONE);
        content.setVisibility(visible == content ? View.VISIBLE : View.GONE);
    }
}
