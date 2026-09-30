package com.smartsolar.microgrid.navigation;

import androidx.annotation.IdRes;
import androidx.navigation.NavController;

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

        if (navController.getCurrentDestination() != null
                && navController.getCurrentDestination().getId() == R.id.homeFragment) {
            navController.navigate(destination);
        }
    }
}
