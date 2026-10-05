package com.smartsolar.microgrid.ui.common;

import android.content.Context;
import android.graphics.drawable.GradientDrawable;
import android.widget.TextView;

import androidx.core.content.ContextCompat;

import com.smartsolar.microgrid.R;

/** Presentation-only styling for statuses returned by existing APIs. */
public final class StatusUi {
    private StatusUi() { }

    public static void bind(TextView view, String status) {
        String label = status == null || status.trim().isEmpty() ? "Unknown" : status;
        int foreground = R.color.status_neutral;
        int background = R.color.status_neutral_bg;
        switch (label.toLowerCase(java.util.Locale.ROOT)) {
            case "active": case "available": case "completed":
                foreground = R.color.status_success; background = R.color.status_success_bg; break;
            case "pending": case "expired": case "maintenance": case "fullybooked":
                foreground = R.color.status_warning; background = R.color.status_warning_bg; break;
            case "approved": case "verified":
                foreground = R.color.status_info; background = R.color.status_info_bg; break;
            case "reserved": case "qrissued":
                foreground = R.color.status_reserved; background = R.color.status_reserved_bg; break;
            case "rejected": case "error":
                foreground = R.color.status_error; background = R.color.status_error_bg; break;
            default: break;
        }
        Context context = view.getContext();
        GradientDrawable badge = new GradientDrawable();
        badge.setColor(ContextCompat.getColor(context, background));
        badge.setCornerRadius(context.getResources().getDimension(R.dimen.radius_control));
        badge.setStroke(Math.max(1, Math.round(context.getResources().getDisplayMetrics().density)),
                ContextCompat.getColor(context, foreground));
        view.setBackground(badge);
        int horizontal = Math.round(10 * context.getResources().getDisplayMetrics().density);
        int vertical = Math.round(5 * context.getResources().getDisplayMetrics().density);
        view.setPadding(horizontal, vertical, horizontal, vertical);
        view.setTextColor(ContextCompat.getColor(context, foreground));
        view.setText(label.equalsIgnoreCase("QrIssued") ? "QR issued" : label);
        view.setContentDescription("Status: " + view.getText());
    }
}
