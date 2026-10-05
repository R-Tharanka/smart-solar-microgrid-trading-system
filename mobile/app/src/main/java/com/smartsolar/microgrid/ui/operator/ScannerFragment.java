package com.smartsolar.microgrid.ui.operator;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.View;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.navigation.fragment.NavHostFragment;

import com.google.zxing.ResultPoint;
import com.journeyapps.barcodescanner.BarcodeCallback;
import com.journeyapps.barcodescanner.BarcodeResult;
import com.journeyapps.barcodescanner.DecoratedBarcodeView;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.data.transaction.EphemeralQrPayloadStore;
import com.smartsolar.microgrid.data.transaction.QrPayload;

import java.util.List;

public class ScannerFragment extends Fragment {
    private DecoratedBarcodeView barcodeScannerView;
    private boolean hasScanned = false;

    private final ActivityResultLauncher<String> requestPermissionLauncher =
            registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
                if (isGranted) {
                    barcodeScannerView.resume();
                } else {
                    Toast.makeText(requireContext(), "Camera permission is required", Toast.LENGTH_LONG).show();
                    NavHostFragment.findNavController(this).popBackStack();
                }
            });

    public ScannerFragment() {
        super(R.layout.fragment_scanner);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        EphemeralQrPayloadStore.clear();
        barcodeScannerView = view.findViewById(R.id.barcode_scanner);
        
        barcodeScannerView.decodeContinuous(new BarcodeCallback() {
            @Override
            public void barcodeResult(BarcodeResult result) {
                if (!hasScanned && result.getText() != null) {
                    hasScanned = true;
                    barcodeScannerView.pause();

                    try {
                        EphemeralQrPayloadStore.put(QrPayload.parse(result.getText()));
                        NavHostFragment.findNavController(ScannerFragment.this)
                                .navigate(R.id.transactionVerifyFragment);
                    } catch (IllegalArgumentException exception) {
                        hasScanned = false;
                        Toast.makeText(requireContext(),
                                "Invalid transaction QR code.", Toast.LENGTH_LONG).show();
                        barcodeScannerView.resume();
                    }
                }
            }

            @Override
            public void possibleResultPoints(List<ResultPoint> resultPoints) {}
        });
        
        checkCameraPermission();
    }

    private void checkCameraPermission() {
        if (ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.CAMERA)
                == PackageManager.PERMISSION_GRANTED) {
            barcodeScannerView.resume();
        } else {
            requestPermissionLauncher.launch(Manifest.permission.CAMERA);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        hasScanned = false;
        if (ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.CAMERA)
                == PackageManager.PERMISSION_GRANTED) {
            barcodeScannerView.resume();
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        barcodeScannerView.pause();
    }
}

