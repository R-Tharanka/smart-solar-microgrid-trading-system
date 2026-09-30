package com.smartsolar.microgrid.data.api;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;

import com.google.gson.Gson;
import com.google.gson.JsonParseException;
import com.google.gson.reflect.TypeToken;
import com.smartsolar.microgrid.BuildConfig;
import com.smartsolar.microgrid.data.session.Session;
import com.smartsolar.microgrid.data.session.SessionManager;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.lang.reflect.Type;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class ApiClient {
    private static volatile ApiClient instance;

    private final Gson gson = new Gson();
    private final ExecutorService executor = Executors.newFixedThreadPool(3);
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final SessionManager sessionManager;

    private ApiClient(Context context) {
        sessionManager = SessionManager.getInstance(context);
    }

    public static ApiClient getInstance(Context context) {
        if (instance == null) {
            synchronized (ApiClient.class) {
                if (instance == null) {
                    instance = new ApiClient(context);
                }
            }
        }
        return instance;
    }

    public <T> void get(String path, Type responseType, boolean authenticated,
                        ApiCallback<T> callback) {
        request("GET", path, null, responseType, authenticated, callback);
    }

    public <T> void post(String path, Object body, Type responseType, boolean authenticated,
                         ApiCallback<T> callback) {
        request("POST", path, body, responseType, authenticated, callback);
    }

    public <T> void put(String path, Object body, Type responseType, boolean authenticated,
                        ApiCallback<T> callback) {
        request("PUT", path, body, responseType, authenticated, callback);
    }

    public <T> void delete(String path, Type responseType, boolean authenticated,
                           ApiCallback<T> callback) {
        request("DELETE", path, null, responseType, authenticated, callback);
    }

    private <T> void request(String method, String path, Object body, Type responseType,
                             boolean authenticated, ApiCallback<T> callback) {
        Session session = authenticated ? sessionManager.loadSession() : null;
        if (authenticated && session == null) {
            deliverError(callback, ApiErrorHandler.sessionRequired());
            return;
        }

        executor.execute(() -> executeRequest(
                method, path, body, responseType, session, callback));
    }

    private <T> void executeRequest(String method, String path, Object body, Type responseType,
                                    Session session, ApiCallback<T> callback) {
        HttpURLConnection connection = null;
        try {
            URL url = new URL(buildUrl(path));
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod(method);
            connection.setConnectTimeout(15_000);
            connection.setReadTimeout(20_000);
            connection.setRequestProperty("Accept", "application/json");

            if (session != null) {
                connection.setRequestProperty(
                        "Authorization", "Bearer " + session.getAccessToken());
            }

            if (body != null) {
                connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                byte[] json = gson.toJson(body).getBytes(StandardCharsets.UTF_8);
                try (OutputStream output = connection.getOutputStream()) {
                    output.write(json);
                }
            }

            int statusCode = connection.getResponseCode();
            if (statusCode >= 200 && statusCode < 300) {
                handleSuccess(connection, statusCode, responseType, callback);
            } else {
                if (statusCode == HttpURLConnection.HTTP_UNAUTHORIZED && session != null) {
                    sessionManager.clearSession();
                }
                String errorBody = readBody(connection.getErrorStream());
                deliverError(callback,
                        ApiErrorHandler.fromHttpResponse(statusCode, errorBody));
            }
        } catch (JsonParseException exception) {
            deliverError(callback, ApiErrorHandler.invalidResponse());
        } catch (IOException exception) {
            deliverError(callback, ApiErrorHandler.networkError());
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private <T> void handleSuccess(HttpURLConnection connection, int statusCode,
                                   Type responseType, ApiCallback<T> callback) throws IOException {
        if (statusCode == HttpURLConnection.HTTP_NO_CONTENT || responseType == Void.class) {
            deliverSuccess(callback, null, null);
            return;
        }

        String responseBody = readBody(connection.getInputStream());
        Type envelopeType = TypeToken.getParameterized(ApiEnvelope.class, responseType).getType();
        ApiEnvelope<T> envelope = gson.fromJson(responseBody, envelopeType);
        if (envelope == null) {
            deliverError(callback, ApiErrorHandler.invalidResponse());
            return;
        }
        deliverSuccess(callback, envelope.getData(), envelope.getMessage());
    }

    private String buildUrl(String path) {
        String cleanPath = path.startsWith("/") ? path.substring(1) : path;
        return BuildConfig.API_BASE_URL + cleanPath;
    }

    private String readBody(InputStream stream) throws IOException {
        if (stream == null) {
            return "";
        }

        StringBuilder body = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                body.append(line);
            }
        }
        return body.toString();
    }

    private <T> void deliverSuccess(ApiCallback<T> callback, T data, String message) {
        mainHandler.post(() -> callback.onSuccess(data, message));
    }

    private <T> void deliverError(ApiCallback<T> callback, ApiError error) {
        mainHandler.post(() -> callback.onError(error));
    }
}
