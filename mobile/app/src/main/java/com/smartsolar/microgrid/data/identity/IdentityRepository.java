package com.smartsolar.microgrid.data.identity;

import android.content.Context;

import com.smartsolar.microgrid.data.api.ApiCallback;
import com.smartsolar.microgrid.data.api.ApiClient;
import com.smartsolar.microgrid.data.api.ApiError;
import com.smartsolar.microgrid.data.session.Session;
import com.smartsolar.microgrid.data.session.SessionManager;
import com.smartsolar.microgrid.data.session.UserRole;

import java.text.ParseException;

public final class IdentityRepository {
    private static final String USERS_PATH = "api/users/";

    private final ApiClient apiClient;
    private final SessionManager sessionManager;
    private final UserProfileCache profileCache;

    public IdentityRepository(Context context) {
        apiClient = ApiClient.getInstance(context);
        sessionManager = SessionManager.getInstance(context);
        profileCache = new UserProfileCache(context);
    }

    public void login(String identifier, String password, ApiCallback<Session> callback) {
        apiClient.post(USERS_PATH + "login", new LoginRequest(identifier, password),
                LoginResponse.class, false, new ApiCallback<LoginResponse>() {
                    @Override
                    public void onSuccess(LoginResponse response, String message) {
                        if (response == null || response.getUser() == null) {
                            callback.onError(invalidLoginResponse());
                            return;
                        }

                        UserRole role = UserRole.fromApiValue(response.getUser().getRole());
                        if (role == null) {
                            callback.onError(new ApiError(403, "ROLE_NOT_SUPPORTED",
                                    "This account role is not supported by the mobile application."));
                            return;
                        }

                        try {
                            Session session = new Session(
                                    response.getAccessToken(),
                                    role,
                                    response.getUser().getDisplayName(),
                                    UtcTimestampParser.parseEpochMillis(response.getExpiresAtUtc())
                            );
                            profileCache.clear();
                            sessionManager.saveSession(session);
                            profileCache.save(response.getUser());
                            callback.onSuccess(session, message);
                        } catch (ParseException | IllegalArgumentException exception) {
                            callback.onError(invalidLoginResponse());
                        }
                    }

                    @Override
                    public void onError(ApiError error) {
                        callback.onError(error);
                    }
                });
    }

    public void registerProsumer(RegisterProsumerRequest request,
                                 ApiCallback<UserResponse> callback) {
        apiClient.post(USERS_PATH + "prosumer/register", request,
                UserResponse.class, false, callback);
    }

    public void getProfile(ApiCallback<UserResponse> callback) {
        apiClient.get(USERS_PATH + "me", UserResponse.class, true,
                cachingCallback(callback));
    }

    public CachedUserProfile getCachedProfile() {
        return sessionManager.loadSession() == null ? null : profileCache.load();
    }

    public void updateProfile(UpdateProfileRequest request,
                              ApiCallback<UserResponse> callback) {
        apiClient.put(USERS_PATH + "me", request, UserResponse.class, true,
                new ApiCallback<UserResponse>() {
                    @Override
                    public void onSuccess(UserResponse user, String message) {
                        Session current = sessionManager.loadSession();
                        if (current != null && user != null) {
                            sessionManager.saveSession(new Session(
                                    current.getAccessToken(), current.getUserRole(),
                                    user.getDisplayName(), current.getExpiresAtEpochMillis()));
                            profileCache.save(user);
                        }
                        callback.onSuccess(user, message);
                    }

                    @Override
                    public void onError(ApiError error) {
                        callback.onError(error);
                    }
                });
    }

    public void requestOwnDeactivation(ApiCallback<Void> callback) {
        apiClient.post(USERS_PATH + "me/deactivation-request", null, Void.class, true, callback);
    }

    public void logout() {
        profileCache.clear();
        sessionManager.clearSession();
    }

    public void clearLocalIdentity() {
        profileCache.clear();
        sessionManager.clearSession();
    }

    private ApiCallback<UserResponse> cachingCallback(ApiCallback<UserResponse> callback) {
        return new ApiCallback<UserResponse>() {
            @Override
            public void onSuccess(UserResponse user, String message) {
                if (user != null) profileCache.save(user);
                callback.onSuccess(user, message);
            }

            @Override
            public void onError(ApiError error) {
                callback.onError(error);
            }
        };
    }

    private ApiError invalidLoginResponse() {
        return new ApiError(0, "INVALID_RESPONSE",
                "The server returned an invalid login response. Please try again.");
    }
}
