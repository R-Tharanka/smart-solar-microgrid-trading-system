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
import com.smartsolar.microgrid.data.session.Session;
import com.smartsolar.microgrid.data.session.SessionManager;
import com.smartsolar.microgrid.navigation.AuthenticationNavigator;

public class ProsumerHomeFragment extends Fragment {
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

        TextView welcome = view.findViewById(R.id.prosumer_welcome);
        welcome.setText(getString(R.string.welcome_user, session.getDisplayName()));
        view.findViewById(R.id.profile_button).setOnClickListener(button ->
                NavHostFragment.findNavController(this).navigate(R.id.profileFragment));
        view.findViewById(R.id.logout_button).setOnClickListener(button ->
                AuthenticationNavigator.logout(this));

        new IdentityRepository(requireContext()).getProfile(new ApiCallback<UserResponse>() {
            @Override
            public void onSuccess(UserResponse user, String message) {
                if (getView() != view || user == null) return;
                view.findViewById(R.id.prosumer_deactivation_request)
                        .setVisibility(user.isDeactivationRequested() ? View.VISIBLE : View.GONE);
            }

            @Override
            public void onError(ApiError error) {
                if (getView() != view) return;
                AuthenticationNavigator.handleExpiredSession(ProsumerHomeFragment.this, error);
            }
        });
    }
}
