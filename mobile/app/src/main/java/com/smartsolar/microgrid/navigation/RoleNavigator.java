package com.smartsolar.microgrid.navigation;

import androidx.annotation.IdRes;
import androidx.navigation.NavController;
import androidx.navigation.NavOptions;

import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.data.session.Session;

public final class RoleNavigator {
    private RoleNavigator() {
    }

    public static void navigateToRoleHome(NavController navController, Session session) {
        if (session == null || session.getUserRole() == null) {
            return;
        }

        @IdRes int destination;
        switch (session.getUserRole()) {
            case PROSUMER:
                destination = R.id.prosumerHomeFragment;
                break;
            case GRID_OPERATOR:
                destination = R.id.gridOperatorHomeFragment;
                break;
            default:
                return;
        }

        if (navController.getCurrentDestination() != null) {
            int currentId = navController.getCurrentDestination().getId();
            if (currentId == R.id.loginFragment || currentId == R.id.homeFragment) {
                NavOptions options = new NavOptions.Builder()
                        .setPopUpTo(R.id.loginFragment, true)
                        .build();
                navController.navigate(destination, null, options);
            }
        }
    }

    public static void navigateToLogin(NavController navController) {
        NavOptions options = new NavOptions.Builder()
                .setPopUpTo(navController.getGraph().getId(), true)
                .build();
        navController.navigate(R.id.loginFragment, null, options);
    }
}
