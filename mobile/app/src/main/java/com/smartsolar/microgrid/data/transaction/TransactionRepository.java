package com.smartsolar.microgrid.data.transaction;

import android.content.Context;

import com.smartsolar.microgrid.data.api.ApiCallback;
import com.smartsolar.microgrid.data.api.ApiClient;

public class TransactionRepository {
    private static final String TRANSACTIONS_PATH = "api/transactions";
    private final ApiClient apiClient;

    public TransactionRepository(Context context) {
        apiClient = ApiClient.getInstance(context);
    }

    public void verifyTransaction(VerifyTransactionRequest request, ApiCallback<VerifiedTransactionResponse> callback) {
        apiClient.post(TRANSACTIONS_PATH + "/verify", request, VerifiedTransactionResponse.class, true, callback);
    }

    public void finalizeTransaction(FinalizeTransactionRequest request, ApiCallback<VerifiedTransactionResponse> callback) {
        apiClient.post(TRANSACTIONS_PATH + "/finalize", request, VerifiedTransactionResponse.class, true, callback);
    }
}

