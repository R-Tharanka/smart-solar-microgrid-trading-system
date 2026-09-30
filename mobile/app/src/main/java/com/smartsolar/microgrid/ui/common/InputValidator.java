package com.smartsolar.microgrid.ui.common;

import android.util.Patterns;

import java.util.regex.Pattern;

public final class InputValidator {
    private static final Pattern NIC_PATTERN =
            Pattern.compile("^(?:\\d{9}[VvXx]|\\d{12})$");
    private static final Pattern PHONE_PATTERN =
            Pattern.compile("^\\+?[0-9]{9,15}$");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9\\s])\\S{8,128}$");

    private InputValidator() {
    }

    public static boolean isEmail(String value) {
        return value != null && Patterns.EMAIL_ADDRESS.matcher(value).matches();
    }

    public static boolean isNic(String value) {
        return value != null && NIC_PATTERN.matcher(value).matches();
    }

    public static boolean isPhone(String value) {
        return value != null && PHONE_PATTERN.matcher(value).matches();
    }

    public static boolean isStrongPassword(String value) {
        return value != null && PASSWORD_PATTERN.matcher(value).matches();
    }

    public static boolean isLoginIdentifier(String value) {
        return value != null && value.length() >= 3
                && (isEmail(value) || isNic(value));
    }
}
