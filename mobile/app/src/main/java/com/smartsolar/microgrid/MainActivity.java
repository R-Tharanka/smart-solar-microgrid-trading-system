package com.smartsolar.microgrid;

import android.os.Bundle;
import android.view.View;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.navigation.NavController;
import androidx.navigation.fragment.NavHostFragment;
import androidx.navigation.ui.AppBarConfiguration;
import androidx.navigation.ui.NavigationUI;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.smartsolar.microgrid.data.session.Session;
import com.smartsolar.microgrid.data.session.SessionManager;
import com.smartsolar.microgrid.data.session.UserRole;
import com.smartsolar.microgrid.navigation.RoleNavigator;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        clearLegacyQrCache();
        setContentView(R.layout.activity_main);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (view, windowInsets) -> {
            Insets systemBars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
            view.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return windowInsets;
        });

        MaterialToolbar toolbar = findViewById(R.id.top_app_bar);
        BottomNavigationView bottomNavigation = findViewById(R.id.bottom_navigation);
        NavHostFragment navHostFragment = (NavHostFragment) getSupportFragmentManager()
                .findFragmentById(R.id.nav_host_fragment);

        if (navHostFragment != null) {
            NavController navController = navHostFragment.getNavController();
            AppBarConfiguration appBarConfiguration = new AppBarConfiguration.Builder(
                    R.id.loginFragment,
                    R.id.homeFragment,
                    R.id.prosumerHomeFragment,
                    R.id.gridOperatorHomeFragment
            ).build();
            NavigationUI.setupWithNavController(toolbar, navController, appBarConfiguration);
            navController.addOnDestinationChangedListener((controller, destination, arguments) -> {
                boolean authenticationScreen = destination.getId() == R.id.loginFragment
                        || destination.getId() == R.id.registerFragment;
                toolbar.setVisibility(authenticationScreen ? View.GONE : View.VISIBLE);
                Session current = SessionManager.getInstance(this).loadSession();
                boolean operator = current != null && current.getUserRole()
                        == UserRole.GRID_OPERATOR;
                int menu = operator ? R.menu.navigation_operator : R.menu.navigation_prosumer;
                if (bottomNavigation.getTag() == null || !bottomNavigation.getTag().equals(menu)) {
                    bottomNavigation.getMenu().clear();
                    bottomNavigation.inflateMenu(menu);
                    bottomNavigation.setTag(menu);
                }
                boolean rootScreen = destination.getId() == R.id.prosumerHomeFragment
                        || destination.getId() == R.id.gridOperatorHomeFragment
                        || destination.getId() == R.id.stationsFragment
                        || destination.getId() == R.id.myBookingsFragment
                        || destination.getId() == R.id.profileFragment;
                bottomNavigation.setVisibility(!authenticationScreen && rootScreen
                        ? View.VISIBLE : View.GONE);
                if (rootScreen && bottomNavigation.getMenu().findItem(destination.getId()) != null) {
                    bottomNavigation.getMenu().findItem(destination.getId()).setChecked(true);
                }
            });
            bottomNavigation.setOnItemSelectedListener(item -> {
                int destination = item.getItemId();
                if (navController.getCurrentDestination() != null
                        && navController.getCurrentDestination().getId() == destination) return true;
                Bundle args = null;
                if (destination == R.id.stationsFragment) {
                    Session current = SessionManager.getInstance(this).loadSession();
                    args = new Bundle();
                    args.putBoolean("operatorReadOnly", current != null && current.getUserRole()
                            == UserRole.GRID_OPERATOR);
                }
                Session current = SessionManager.getInstance(this).loadSession();
                int roleHome = current != null && current.getUserRole() == UserRole.GRID_OPERATOR
                        ? R.id.gridOperatorHomeFragment : R.id.prosumerHomeFragment;
                navController.navigate(destination, args,
                        new androidx.navigation.NavOptions.Builder()
                                .setLaunchSingleTop(true).setPopUpTo(roleHome, false).build());
                return true;
            });

            Session session = SessionManager.getInstance(this).loadSession();
            RoleNavigator.navigateToRoleHome(navController, session);
        }
    }

    // Removes QR bearer tokens persisted by older app versions without touching session data.
    private void clearLegacyQrCache() {
        getSharedPreferences("qr_cache", MODE_PRIVATE).edit().clear().apply();
    }
}
