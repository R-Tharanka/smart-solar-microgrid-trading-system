package com.smartsolar.microgrid.data.session;

public enum UserRole {
    PROSUMER("Prosumer"),
    GRID_OPERATOR("GridOperator");

    private final String apiValue;

    UserRole(String apiValue) {
        this.apiValue = apiValue;
    }

    public String getApiValue() {
        return apiValue;
    }

    public static UserRole fromApiValue(String value) {
        if (value == null) {
            return null;
        }

        for (UserRole role : values()) {
            if (role.apiValue.equalsIgnoreCase(value)) {
                return role;
            }
        }
        return null;
    }
}
