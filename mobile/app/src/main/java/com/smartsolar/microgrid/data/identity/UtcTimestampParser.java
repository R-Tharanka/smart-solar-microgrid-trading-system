package com.smartsolar.microgrid.data.identity;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public final class UtcTimestampParser {
    private UtcTimestampParser() {
    }

    public static long parseEpochMillis(String value) throws ParseException {
        if (value == null) {
            throw new ParseException("Missing timestamp", 0);
        }

        String normalized = value.trim();
        int zoneIndex = normalized.endsWith("Z") ? normalized.length() - 1 : -1;
        int fractionIndex = normalized.indexOf('.');
        if (fractionIndex < 0 && zoneIndex > 0) {
            normalized = normalized.substring(0, zoneIndex) + ".000Z";
        } else if (fractionIndex >= 0 && zoneIndex > fractionIndex) {
            String fraction = normalized.substring(fractionIndex + 1, zoneIndex);
            String milliseconds = (fraction + "000").substring(0, 3);
            normalized = normalized.substring(0, fractionIndex + 1) + milliseconds + "Z";
        }

        SimpleDateFormat format = new SimpleDateFormat(
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        format.setLenient(false);
        format.setTimeZone(TimeZone.getTimeZone("UTC"));
        Date parsed = format.parse(normalized);
        if (parsed == null) {
            throw new ParseException("Invalid timestamp", 0);
        }
        return parsed.getTime();
    }
}
