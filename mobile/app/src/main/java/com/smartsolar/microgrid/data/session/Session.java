package com.smartsolar.microgrid.data.session;

public class Session {
    private final String accessToken;
    private final UserRole userRole;
    private final String displayName;
    private final long expiresAtEpochMillis;

    public Session(String accessToken, UserRole userRole, String displayName,
                   long expiresAtEpochMillis) {
        this.accessToken = accessToken;
        this.userRole = userRole;
        this.displayName = displayName;
        this.expiresAtEpochMillis = expiresAtEpochMillis;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public UserRole getUserRole() {
        return userRole;
    }

    public String getDisplayName() {
        return displayName;
    }

    public long getExpiresAtEpochMillis() {
        return expiresAtEpochMillis;
    }

    public boolean isExpired() {
        return isExpired(System.currentTimeMillis());
    }

    public boolean isExpired(long currentTimeMillis) {
        return expiresAtEpochMillis <= currentTimeMillis;
    }
}
