package com.smartsolar.microgrid.data.identity;

public class UpdateProfileRequest {
    private final String firstName;
    private final String lastName;
    private final String phoneNumber;
    private final String address;

    public UpdateProfileRequest(String firstName, String lastName, String phoneNumber,
                                String address) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.address = address;
    }
}
