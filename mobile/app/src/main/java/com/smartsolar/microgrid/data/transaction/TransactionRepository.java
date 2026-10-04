package com.smartsolar.microgrid.data.transaction;

import android.content.Context;

import com.smartsolar.microgrid.data.api.ApiCallback;
import com.smartsolar.microgrid.data.api.ApiClient;

public final class TransactionRepository {
    private static final String RESERVATIONS_PATH = "api/reservations";
    private static final String TRANSACTIONS_PATH = "api/transactions";

    private final ApiClient apiClient;

    public TransactionRepository(Context context) {
        apiClient = ApiClient.getInstance(context);
    }

    public void issueQr(String reservationId, ApiCallback<QrTransactionResponse> callback) {
        apiClient.post(RESERVATIONS_PATH + "/" + reservationId + "/qr", null,
                QrTransactionResponse.class, true, callback);
    }

    public void verifyTransaction(VerifyTransactionRequest request,
                                  ApiCallback<VerifiedTransactionResponse> callback) {
        apiClient.post(TRANSACTIONS_PATH + "/verify", request,
                VerifiedTransactionResponse.class, true, callback);
    }

    public void finalizeTransaction(FinalizeTransactionRequest request,
                                    ApiCallback<FinalizedTransactionResponse> callback) {
        apiClient.post(TRANSACTIONS_PATH + "/finalize", request,
                FinalizedTransactionResponse.class, true, callback);
    }

    public void getTransactionDetails(String reservationCode,
                                      ApiCallback<TransactionDetailsResponse> callback) {
        apiClient.get(TRANSACTIONS_PATH + "/" + reservationCode,
                TransactionDetailsResponse.class, true, callback);
    }
}
