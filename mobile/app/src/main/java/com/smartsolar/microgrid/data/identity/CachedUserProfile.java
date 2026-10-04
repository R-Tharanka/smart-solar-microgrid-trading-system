package com.smartsolar.microgrid.data.identity;

public final class CachedUserProfile {
    private final String nic;
    private final String displayName;
    private final String firstName;
    private final String lastName;
    private final String email;
    private final String phone;
    private final String address;
    private final String accountStatus;
    private final boolean deactivationRequested;
    private final long lastSyncedAtEpochMillis;

    public CachedUserProfile(String nic, String displayName, String firstName, String lastName,
                             String email, String phone, String address, String accountStatus,
                             boolean deactivationRequested, long lastSyncedAtEpochMillis) {
        this.nic = nic;
        this.displayName = displayName;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.accountStatus = accountStatus;
        this.deactivationRequested = deactivationRequested;
        this.lastSyncedAtEpochMillis = lastSyncedAtEpochMillis;
    }

    public String getNic() { return nic; }
    public String getDisplayName() { return displayName; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getAddress() { return address; }
    public String getAccountStatus() { return accountStatus; }
    public boolean isDeactivationRequested() { return deactivationRequested; }
    public long getLastSyncedAtEpochMillis() { return lastSyncedAtEpochMillis; }
}
