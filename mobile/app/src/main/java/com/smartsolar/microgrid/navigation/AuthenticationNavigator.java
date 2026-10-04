package com.smartsolar.microgrid.navigation;

import android.widget.Toast;

import androidx.fragment.app.Fragment;
import androidx.navigation.fragment.NavHostFragment;

import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.data.api.ApiError;
import com.smartsolar.microgrid.data.identity.IdentityRepository;

public final class AuthenticationNavigator {
    private AuthenticationNavigator() {
    }

    public static void logout(Fragment fragment) {
        new IdentityRepository(fragment.requireContext()).clearLocalIdentity();
        RoleNavigator.navigateToLogin(NavHostFragment.findNavController(fragment));
    }

    public static boolean handleExpiredSession(Fragment fragment, ApiError error) {
        if (error.getStatusCode() != 401 && error.getStatusCode() != 403) {
            return false;
        }

        Toast.makeText(fragment.requireContext(), R.string.session_expired,
                Toast.LENGTH_LONG).show();
        logout(fragment);
        return true;
    }
}
