package com.smartsolar.microgrid.data.identity;

public class RegisterProsumerRequest {
    private final String nic;
    private final String email;
    private final String password;
    private final String firstName;
    private final String lastName;
    private final String phoneNumber;
    private final String address;

    public RegisterProsumerRequest(String nic, String email, String password, String firstName,
                                   String lastName, String phoneNumber, String address) {
        this.nic = nic;
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.address = address;
    }
}
