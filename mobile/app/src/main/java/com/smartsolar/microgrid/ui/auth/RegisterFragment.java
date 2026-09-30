package com.smartsolar.microgrid.ui.auth;

import android.os.Bundle;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.fragment.NavHostFragment;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.data.api.ApiCallback;
import com.smartsolar.microgrid.data.api.ApiError;
import com.smartsolar.microgrid.data.identity.IdentityRepository;
import com.smartsolar.microgrid.data.identity.RegisterProsumerRequest;
import com.smartsolar.microgrid.data.identity.UserResponse;
import com.smartsolar.microgrid.ui.common.InputValidator;

import java.util.Locale;

public class RegisterFragment extends Fragment {
    private TextInputLayout nicLayout, emailLayout, passwordLayout, firstNameLayout,
            lastNameLayout, phoneLayout, addressLayout;
    private TextInputEditText nicInput, emailInput, passwordInput, firstNameInput,
            lastNameInput, phoneInput, addressInput;
    private TextView errorView;
    private ProgressBar progressBar;
    private MaterialButton submitButton, backButton;
    private IdentityRepository identityRepository;

    public RegisterFragment() {
        super(R.layout.fragment_register);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        identityRepository = new IdentityRepository(requireContext());
        nicLayout = view.findViewById(R.id.nic_layout);
        emailLayout = view.findViewById(R.id.email_layout);
        passwordLayout = view.findViewById(R.id.password_layout);
        firstNameLayout = view.findViewById(R.id.first_name_layout);
        lastNameLayout = view.findViewById(R.id.last_name_layout);
        phoneLayout = view.findViewById(R.id.phone_layout);
        addressLayout = view.findViewById(R.id.address_layout);
        nicInput = view.findViewById(R.id.nic_input);
        emailInput = view.findViewById(R.id.email_input);
        passwordInput = view.findViewById(R.id.password_input);
        firstNameInput = view.findViewById(R.id.first_name_input);
        lastNameInput = view.findViewById(R.id.last_name_input);
        phoneInput = view.findViewById(R.id.phone_input);
        addressInput = view.findViewById(R.id.address_input);
        errorView = view.findViewById(R.id.register_error);
        progressBar = view.findViewById(R.id.register_progress);
        submitButton = view.findViewById(R.id.submit_registration_button);
        backButton = view.findViewById(R.id.back_to_login_button);

        submitButton.setOnClickListener(button -> register());
        backButton.setOnClickListener(button ->
                NavHostFragment.findNavController(this).popBackStack());
    }

    private void register() {
        clearErrors();
        String nic = text(nicInput).toUpperCase(Locale.ROOT);
        String email = text(emailInput).toLowerCase(Locale.ROOT);
        String password = rawText(passwordInput);
        String firstName = text(firstNameInput);
        String lastName = text(lastNameInput);
        String phone = text(phoneInput);
        String address = text(addressInput);

        boolean valid = true;
        if (!InputValidator.isNic(nic)) { nicLayout.setError(getString(R.string.invalid_nic)); valid = false; }
        if (!InputValidator.isEmail(email)) { emailLayout.setError(getString(R.string.invalid_email)); valid = false; }
        if (!InputValidator.isStrongPassword(password)) { passwordLayout.setError(getString(R.string.invalid_password)); valid = false; }
        if (firstName.isEmpty()) { firstNameLayout.setError(getString(R.string.required_field)); valid = false; }
        if (lastName.isEmpty()) { lastNameLayout.setError(getString(R.string.required_field)); valid = false; }
        if (!InputValidator.isPhone(phone)) { phoneLayout.setError(getString(R.string.invalid_phone)); valid = false; }
        if (address.length() < 3) { addressLayout.setError(getString(R.string.invalid_address)); valid = false; }
        if (!valid) return;

        setLoading(true);
        RegisterProsumerRequest request = new RegisterProsumerRequest(
                nic, email, password, firstName, lastName, phone, address);
        identityRepository.registerProsumer(request, new ApiCallback<UserResponse>() {
            @Override
            public void onSuccess(UserResponse data, String message) {
                if (!isAdded()) return;
                setLoading(false);
                Toast.makeText(requireContext(), R.string.registration_success,
                        Toast.LENGTH_LONG).show();
                NavHostFragment.findNavController(RegisterFragment.this).popBackStack();
            }

            @Override
            public void onError(ApiError error) {
                if (!isAdded()) return;
                setLoading(false);
                errorView.setText(error.getUserMessage());
                errorView.setVisibility(View.VISIBLE);
            }
        });
    }

    private void clearErrors() {
        for (TextInputLayout layout : new TextInputLayout[]{nicLayout, emailLayout,
                passwordLayout, firstNameLayout, lastNameLayout, phoneLayout, addressLayout}) {
            layout.setError(null);
        }
        errorView.setVisibility(View.GONE);
    }

    private void setLoading(boolean loading) {
        progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
        submitButton.setEnabled(!loading);
        backButton.setEnabled(!loading);
    }

    private String text(TextInputEditText input) {
        return rawText(input).trim();
    }

    private String rawText(TextInputEditText input) {
        return input.getText() == null ? "" : input.getText().toString();
    }
}
