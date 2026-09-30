package com.smartsolar.microgrid.data.identity;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class UtcTimestampParserTest {
    @Test
    public void parseEpochMillis_acceptsAspNetUtcFractionPrecision() throws Exception {
        assertEquals(1_767_225_600_123L,
                UtcTimestampParser.parseEpochMillis("2026-01-01T00:00:00.1234567Z"));
    }

    @Test
    public void parseEpochMillis_acceptsUtcWithoutFraction() throws Exception {
        assertEquals(1_767_225_600_000L,
                UtcTimestampParser.parseEpochMillis("2026-01-01T00:00:00Z"));
    }
}
