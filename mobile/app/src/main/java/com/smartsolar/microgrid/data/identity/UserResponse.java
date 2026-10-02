package com.smartsolar.microgrid.data.identity;

public class UserResponse {
    private String nic;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String address;
    private String role;
    private String status;
    private boolean deactivationRequested;
    private String deactivationRequestedAtUtc;

    public String getNic() { return nic; }
    public String getEmail() { return email; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getAddress() { return address; }
    public String getRole() { return role; }
    public String getStatus() { return status; }
    public boolean isDeactivationRequested() { return deactivationRequested; }
    public String getDeactivationRequestedAtUtc() { return deactivationRequestedAtUtc; }

    public String getDisplayName() {
        return ((firstName == null ? "" : firstName) + " "
                + (lastName == null ? "" : lastName)).trim();
    }
}
