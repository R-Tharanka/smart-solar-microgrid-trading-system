package com.smartsolar.microgrid.data.session;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class SessionTest {
    @Test
    public void isExpired_comparesExpiryWithCurrentTime() {
        Session session = new Session("token", UserRole.PROSUMER, "Sample User", 2_000L);

        assertFalse(session.isExpired(1_999L));
        assertTrue(session.isExpired(2_000L));
    }
}
