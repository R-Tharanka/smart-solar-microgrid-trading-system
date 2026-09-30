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

import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.data.api.ApiCallback;
import com.smartsolar.microgrid.data.api.ApiError;
import com.smartsolar.microgrid.data.identity.IdentityRepository;
import com.smartsolar.microgrid.data.identity.UpdateProfileRequest;
import com.smartsolar.microgrid.data.identity.UserResponse;
import com.smartsolar.microgrid.navigation.AuthenticationNavigator;
import com.smartsolar.microgrid.ui.common.InputValidator;

public class EditProfileFragment extends Fragment {
    private View form;
    private ProgressBar loadProgress, saveProgress;
    private TextView errorView;
    private TextInputLayout firstNameLayout, lastNameLayout, phoneLayout, addressLayout;
    private TextInputEditText firstNameInput, lastNameInput, phoneInput, addressInput;
    private MaterialButton saveButton;
    private IdentityRepository repository;

    public EditProfileFragment() {
        super(R.layout.fragment_edit_profile);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        repository = new IdentityRepository(requireContext());
        form = view.findViewById(R.id.edit_profile_form);
        loadProgress = view.findViewById(R.id.edit_profile_load_progress);
        saveProgress = view.findViewById(R.id.edit_profile_save_progress);
        errorView = view.findViewById(R.id.edit_profile_error);
        firstNameLayout = view.findViewById(R.id.first_name_layout);
        lastNameLayout = view.findViewById(R.id.last_name_layout);
        phoneLayout = view.findViewById(R.id.phone_layout);
        addressLayout = view.findViewById(R.id.address_layout);
        firstNameInput = view.findViewById(R.id.first_name_input);
        lastNameInput = view.findViewById(R.id.last_name_input);
        phoneInput = view.findViewById(R.id.phone_input);
        addressInput = view.findViewById(R.id.address_input);
        saveButton = view.findViewById(R.id.save_profile_button);
        saveButton.setOnClickListener(button -> saveProfile());
        loadProfile();
    }

    private void loadProfile() {
        loadProgress.setVisibility(View.VISIBLE);
        form.setVisibility(View.GONE);
        repository.getProfile(new ApiCallback<UserResponse>() {
            @Override
            public void onSuccess(UserResponse user, String message) {
                if (!isAdded()) return;
                loadProgress.setVisibility(View.GONE);
                if (user == null) {
                    showError(getString(R.string.profile_empty));
                    form.setVisibility(View.VISIBLE);
                    return;
                }
                firstNameInput.setText(user.getFirstName());
                lastNameInput.setText(user.getLastName());
                phoneInput.setText(user.getPhoneNumber());
                addressInput.setText(user.getAddress());
                form.setVisibility(View.VISIBLE);
            }

            @Override
            public void onError(ApiError error) {
                if (!isAdded()) return;
                loadProgress.setVisibility(View.GONE);
                if (AuthenticationNavigator.handleExpiredSession(EditProfileFragment.this, error)) return;
                form.setVisibility(View.VISIBLE);
                showError(error.getUserMessage());
            }
        });
    }

    private void saveProfile() {
        clearErrors();
        String firstName = text(firstNameInput);
        String lastName = text(lastNameInput);
        String phone = text(phoneInput);
        String address = text(addressInput);
        boolean valid = true;
        if (firstName.isEmpty()) { firstNameLayout.setError(getString(R.string.required_field)); valid = false; }
        if (lastName.isEmpty()) { lastNameLayout.setError(getString(R.string.required_field)); valid = false; }
        if (!InputValidator.isPhone(phone)) { phoneLayout.setError(getString(R.string.invalid_phone)); valid = false; }
        if (address.length() < 3) { addressLayout.setError(getString(R.string.invalid_address)); valid = false; }
        if (!valid) return;

        setSaving(true);
        repository.updateProfile(new UpdateProfileRequest(firstName, lastName, phone, address),
                new ApiCallback<UserResponse>() {
                    @Override
                    public void onSuccess(UserResponse data, String message) {
                        if (!isAdded()) return;
                        setSaving(false);
                        Toast.makeText(requireContext(), R.string.profile_updated,
                                Toast.LENGTH_LONG).show();
                        NavHostFragment.findNavController(EditProfileFragment.this).popBackStack();
                    }

                    @Override
                    public void onError(ApiError error) {
                        if (!isAdded()) return;
                        setSaving(false);
                        if (AuthenticationNavigator.handleExpiredSession(EditProfileFragment.this, error)) return;
                        showError(error.getUserMessage());
                    }
                });
    }

    private void setSaving(boolean saving) {
        saveProgress.setVisibility(saving ? View.VISIBLE : View.GONE);
        saveButton.setEnabled(!saving);
    }

    private void clearErrors() {
        firstNameLayout.setError(null);
        lastNameLayout.setError(null);
        phoneLayout.setError(null);
        addressLayout.setError(null);
        errorView.setVisibility(View.GONE);
    }

    private void showError(String message) {
        errorView.setText(message);
        errorView.setVisibility(View.VISIBLE);
    }

    private String text(TextInputEditText input) {
        return input.getText() == null ? "" : input.getText().toString().trim();
    }
}
