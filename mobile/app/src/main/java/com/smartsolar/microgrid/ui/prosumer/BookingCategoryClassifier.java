package com.smartsolar.microgrid.ui.prosumer;

import com.smartsolar.microgrid.data.identity.UtcTimestampParser;
import com.smartsolar.microgrid.data.reservation.ReservationSummaryResponse;

import java.text.ParseException;

final class BookingCategoryClassifier {
    enum Category {
        ALL,
        PENDING,
        CURRENT_UPCOMING,
        HISTORY
    }

    private BookingCategoryClassifier() {
    }

    static Category classify(ReservationSummaryResponse reservation, long nowMillis) {
        String status = reservation.getStatus();
        if ("Pending".equalsIgnoreCase(status)) {
            return Category.PENDING;
        }

        if (isActiveApprovedStatus(status)) {
            try {
                long endMillis = UtcTimestampParser.parseEpochMillis(
                        reservation.getScheduledEndTimeUtc());
                return endMillis > nowMillis ? Category.CURRENT_UPCOMING : Category.HISTORY;
            } catch (ParseException ignored) {
                // Keep an active server status visible rather than incorrectly labelling it history.
                return Category.CURRENT_UPCOMING;
            }
        }

        return Category.HISTORY;
    }

    private static boolean isActiveApprovedStatus(String status) {
        return "Approved".equalsIgnoreCase(status)
                || "QrIssued".equalsIgnoreCase(status)
                || "Verified".equalsIgnoreCase(status);
    }
}
