package com.smartsolar.microgrid.data.identity;

public class LoginRequest {
    private final String identifier;
    private final String password;
    private final String clientType;

    public LoginRequest(String identifier, String password) {
        this.identifier = identifier;
        this.password = password;
        this.clientType = "Android";
    }
}
