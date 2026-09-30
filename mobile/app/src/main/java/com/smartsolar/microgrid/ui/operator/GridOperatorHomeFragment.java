package com.smartsolar.microgrid.ui.operator;

import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.data.session.Session;
import com.smartsolar.microgrid.data.session.SessionManager;
import com.smartsolar.microgrid.navigation.AuthenticationNavigator;

public class GridOperatorHomeFragment extends Fragment {
    public GridOperatorHomeFragment() {
        super(R.layout.fragment_grid_operator_home);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        Session session = SessionManager.getInstance(requireContext()).loadSession();
        if (session == null) {
            AuthenticationNavigator.logout(this);
            return;
        }
        TextView welcome = view.findViewById(R.id.operator_welcome);
        welcome.setText(getString(R.string.welcome_user, session.getDisplayName()));
        view.findViewById(R.id.logout_button).setOnClickListener(button ->
                AuthenticationNavigator.logout(this));
    }
}
