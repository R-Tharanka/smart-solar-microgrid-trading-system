package com.smartsolar.microgrid.ui.auth;

import android.os.Bundle;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.core.content.ContextCompat;
import androidx.navigation.NavController;
import androidx.navigation.fragment.NavHostFragment;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.data.api.ApiCallback;
import com.smartsolar.microgrid.data.api.ApiError;
import com.smartsolar.microgrid.data.identity.IdentityRepository;
import com.smartsolar.microgrid.data.session.Session;
import com.smartsolar.microgrid.navigation.RoleNavigator;
import com.smartsolar.microgrid.ui.common.InputValidator;

public class LoginFragment extends Fragment {
    private TextInputLayout identifierLayout;
    private TextInputLayout passwordLayout;
    private TextInputEditText identifierInput;
    private TextInputEditText passwordInput;
    private TextView errorView;
    private ProgressBar progressBar;
    private MaterialButton loginButton;
    private MaterialButton registerButton;
    private IdentityRepository identityRepository;

    public LoginFragment() {
        super(R.layout.fragment_login);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        identityRepository = new IdentityRepository(requireContext());
        identifierLayout = view.findViewById(R.id.identifier_layout);
        passwordLayout = view.findViewById(R.id.password_layout);
        identifierInput = view.findViewById(R.id.identifier_input);
        passwordInput = view.findViewById(R.id.password_input);
        errorView = view.findViewById(R.id.login_error);
        progressBar = view.findViewById(R.id.login_progress);
        loginButton = view.findViewById(R.id.login_button);
        registerButton = view.findViewById(R.id.register_button);

        loginButton.setOnClickListener(button -> login());
        registerButton.setOnClickListener(button ->
                NavHostFragment.findNavController(this).navigate(R.id.registerFragment));
    }

    private void login() {
        String identifier = text(identifierInput);
        String password = text(passwordInput);
        identifierLayout.setError(null);
        passwordLayout.setError(null);
        errorView.setVisibility(View.GONE);

        boolean valid = true;
        if (!InputValidator.isLoginIdentifier(identifier)) {
            identifierLayout.setError(getString(R.string.invalid_identifier));
            valid = false;
        }
        if (password.isEmpty()) {
            passwordLayout.setError(getString(R.string.required_field));
            valid = false;
        }
        if (!valid) {
            return;
        }

        setLoading(true);
        identityRepository.login(identifier, password, new ApiCallback<Session>() {
            @Override
            public void onSuccess(Session session, String message) {
                if (!isAdded()) return;
                setLoading(false);
                NavController navController = NavHostFragment.findNavController(LoginFragment.this);
                RoleNavigator.navigateToRoleHome(navController, session);
            }

            @Override
            public void onError(ApiError error) {
                if (!isAdded()) return;
                setLoading(false);
                boolean pending = "AUTH_ACCOUNT_PENDING".equals(error.getErrorCode());
                errorView.setBackgroundColor(ContextCompat.getColor(requireContext(),
                        pending ? R.color.status_warning_bg : R.color.status_error_bg));
                errorView.setTextColor(ContextCompat.getColor(requireContext(),
                        pending ? R.color.status_warning : R.color.status_error));
                errorView.setText(pending ? "Activation pending\n" + error.getUserMessage()
                        : error.getUserMessage());
                errorView.setVisibility(View.VISIBLE);
            }
        });
    }

    private void setLoading(boolean loading) {
        progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
        loginButton.setEnabled(!loading);
        registerButton.setEnabled(!loading);
        identifierInput.setEnabled(!loading);
        passwordInput.setEnabled(!loading);
    }

    private String text(TextInputEditText input) {
        return input.getText() == null ? "" : input.getText().toString().trim();
    }
}
