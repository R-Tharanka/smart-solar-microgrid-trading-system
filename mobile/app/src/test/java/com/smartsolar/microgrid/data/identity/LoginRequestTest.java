package com.smartsolar.microgrid.data.identity;

import static org.junit.Assert.assertEquals;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import org.junit.Test;

public class LoginRequestTest {
    @Test
    public void loginPayloadDeclaresAndroidClient() {
        JsonObject payload = JsonParser.parseString(new Gson().toJson(
                new LoginRequest("200012345678", "Strong@123"))).getAsJsonObject();

        assertEquals("200012345678", payload.get("identifier").getAsString());
        assertEquals("Strong@123", payload.get("password").getAsString());
        assertEquals("Android", payload.get("clientType").getAsString());
    }
}
