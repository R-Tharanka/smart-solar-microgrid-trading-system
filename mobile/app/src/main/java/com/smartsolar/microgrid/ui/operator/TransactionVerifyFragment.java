package com.smartsolar.microgrid.ui.operator;

import android.app.AlertDialog;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.fragment.NavHostFragment;

import com.google.gson.Gson;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.data.api.ApiCallback;
import com.smartsolar.microgrid.data.api.ApiError;
import com.smartsolar.microgrid.data.transaction.FinalizeTransactionRequest;
import com.smartsolar.microgrid.data.transaction.FinalizedTransactionResponse;
import com.smartsolar.microgrid.data.transaction.TransactionRepository;
import com.smartsolar.microgrid.data.transaction.VerifiedTransactionResponse;
import com.smartsolar.microgrid.data.transaction.VerifyTransactionRequest;
import com.smartsolar.microgrid.navigation.AuthenticationNavigator;

class QrPayloadData {
    public String reservationCode;
    public String transactionToken;
}

public class TransactionVerifyFragment extends Fragment {
    private TransactionRepository repository;
    private String rawQrPayload;
    private VerifiedTransactionResponse verifiedTransaction;

    private ProgressBar progressBar;
    private LinearLayout detailsContainer;
    private LinearLayout errorContainer;

    private TextView tvReservationCode;
    private TextView tvProsumerNic;
    private TextView tvRequestedEnergy;
    private TextView tvStatus;
    private TextView tvErrorMessage;

    private EditText actualEnergyInput;
    private EditText confirmationNoteInput;

    private Button btnFinalize;
    private Button btnCancel;
    private Button btnBackError;

    public TransactionVerifyFragment() {
        super(R.layout.fragment_transaction_verify);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        repository = new TransactionRepository(requireContext());

        if (getArguments() != null) {
            rawQrPayload = getArguments().getString("qrPayload");
        }

        progressBar = view.findViewById(R.id.progress_bar);
        detailsContainer = view.findViewById(R.id.details_container);
        errorContainer = view.findViewById(R.id.error_container);

        tvReservationCode = view.findViewById(R.id.tv_reservation_code);
        tvProsumerNic = view.findViewById(R.id.tv_prosumer_nic);
        tvRequestedEnergy = view.findViewById(R.id.tv_requested_energy);
        tvStatus = view.findViewById(R.id.tv_status);
        tvErrorMessage = view.findViewById(R.id.tv_error_message);

        actualEnergyInput = view.findViewById(R.id.actual_energy_input);
        confirmationNoteInput = view.findViewById(R.id.confirmation_note_input);

        btnFinalize = view.findViewById(R.id.btn_finalize);
        btnCancel = view.findViewById(R.id.btn_cancel);
        btnBackError = view.findViewById(R.id.btn_back_error);

        btnCancel.setOnClickListener(v -> NavHostFragment.findNavController(this).popBackStack());
        btnBackError.setOnClickListener(v -> NavHostFragment.findNavController(this).popBackStack());
        btnFinalize.setOnClickListener(v -> finalizeTransaction());

        if (rawQrPayload != null) {
            verifyQrCode();
        } else {
            showError("No QR code data provided.");
        }
    }

    private void verifyQrCode() {
        try {
            Gson gson = new Gson();
            QrPayloadData payloadData = gson.fromJson(rawQrPayload, QrPayloadData.class);

            if (payloadData == null || payloadData.reservationCode == null || payloadData.transactionToken == null) {
                showError("Invalid QR Code Format");
                return;
            }

            showLoading();
            VerifyTransactionRequest request = new VerifyTransactionRequest(payloadData.reservationCode, payloadData.transactionToken);
            repository.verifyTransaction(request, new ApiCallback<VerifiedTransactionResponse>() {
                @Override
                public void onSuccess(VerifiedTransactionResponse data, String message) {
                    hideLoading();
                    verifiedTransaction = data;
                    showDetails();
                }

                @Override
                public void onError(ApiError error) {
                    hideLoading();
                    if (AuthenticationNavigator.handleExpiredSession(TransactionVerifyFragment.this, error)) return;
                    showError(error.getUserMessage());
                }
            });
        } catch (Exception e) {
            showError("Failed to parse QR Code");
        }
    }

    private void showDetails() {
        detailsContainer.setVisibility(View.VISIBLE);
        errorContainer.setVisibility(View.GONE);
        
        tvReservationCode.setText("Code: " + verifiedTransaction.getReservationCode());
        tvProsumerNic.setText("Prosumer NIC: " + verifiedTransaction.getProsumerNic());
        tvRequestedEnergy.setText("Requested Energy: " + verifiedTransaction.getRequestedEnergyKwh() + " kWh");
        tvStatus.setText("Status: " + verifiedTransaction.getStatus());

        actualEnergyInput.setText(String.valueOf(verifiedTransaction.getRequestedEnergyKwh()));
    }

    private void showError(String message) {
        detailsContainer.setVisibility(View.GONE);
        errorContainer.setVisibility(View.VISIBLE);
        tvErrorMessage.setText(message);
    }

    private void showLoading() {
        progressBar.setVisibility(View.VISIBLE);
        detailsContainer.setVisibility(View.GONE);
        errorContainer.setVisibility(View.GONE);
    }

    private void hideLoading() {
        progressBar.setVisibility(View.GONE);
    }

    private void finalizeTransaction() {
        String energyStr = actualEnergyInput.getText().toString().trim();
        if (TextUtils.isEmpty(energyStr)) {
            actualEnergyInput.setError("Required");
            return;
        }

        double actualEnergy;
        try {
            actualEnergy = Double.parseDouble(energyStr);
        } catch (NumberFormatException e) {
            actualEnergyInput.setError("Invalid number");
            return;
        }

        if (actualEnergy <= 0) {
            actualEnergyInput.setError("Must be positive");
            return;
        }

        if (actualEnergy > verifiedTransaction.getRequestedEnergyKwh()) {
            actualEnergyInput.setError("Cannot exceed reserved energy");
            return;
        }

        String note = confirmationNoteInput.getText().toString().trim();
        if (note.length() < 2) {
            confirmationNoteInput.setError("Enter at least 2 characters");
            return;
        }

        if (note.length() > 500) {
            confirmationNoteInput.setError("Must be 500 characters or fewer");
            return;
        }

        new AlertDialog.Builder(requireContext())
                .setTitle("Confirm Energy Transfer")
                .setMessage("Are you sure you want to finalize the transfer of " + actualEnergy + " kWh?")
                .setPositiveButton("Confirm", (dialog, which) -> executeFinalize(actualEnergy, note))
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void executeFinalize(double actualEnergy, String note) {
        showLoading();
        FinalizeTransactionRequest request = new FinalizeTransactionRequest(
                verifiedTransaction.getReservationCode(),
                note,
                actualEnergy
        );

        repository.finalizeTransaction(request, new ApiCallback<FinalizedTransactionResponse>() {
            @Override
            public void onSuccess(FinalizedTransactionResponse data, String message) {
                hideLoading();
                showSuccessAndNavigateBack(data);
            }

            @Override
            public void onError(ApiError error) {
                hideLoading();
                if (AuthenticationNavigator.handleExpiredSession(TransactionVerifyFragment.this, error)) return;
                showErrorDialog("Finalization Failed", error.getUserMessage());
                showDetails(); // Go back to details view
            }
        });
    }

    private void showSuccessAndNavigateBack(FinalizedTransactionResponse data) {
        new AlertDialog.Builder(requireContext())
                .setTitle("Success")
                .setMessage("Energy transfer completed successfully.\n\nCode: "
                        + data.getReservationCode() + "\nTransferred: "
                        + data.getActualEnergyTransferredKwh() + " kWh")
                .setPositiveButton("OK", (dialog, which) -> {
                    NavHostFragment.findNavController(this).popBackStack(R.id.gridOperatorHomeFragment, false);
                })
                .setCancelable(false)
                .show();
    }

    private void showErrorDialog(String title, String message) {
        new AlertDialog.Builder(requireContext())
                .setTitle(title)
                .setMessage(message)
                .setPositiveButton("OK", null)
                .show();
    }
}

