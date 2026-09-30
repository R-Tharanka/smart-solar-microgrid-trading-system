package com.smartsolar.microgrid.data.session;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import org.junit.Test;

public class UserRoleTest {
    @Test
    public void fromApiValue_matchesBackendRoleNames() {
        assertEquals(UserRole.PROSUMER, UserRole.fromApiValue("Prosumer"));
        assertEquals(UserRole.GRID_OPERATOR, UserRole.fromApiValue("GridOperator"));
        assertNull(UserRole.fromApiValue("Backoffice"));
    }
}
