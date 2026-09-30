package com.smartsolar.microgrid.data.session;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;

public final class SessionManager {
    private static final int SESSION_ROW_ID = 1;
    private static volatile SessionManager instance;

    private final SessionDatabaseHelper databaseHelper;

    private SessionManager(Context context) {
        databaseHelper = new SessionDatabaseHelper(context.getApplicationContext());
    }

    public static SessionManager getInstance(Context context) {
        if (instance == null) {
            synchronized (SessionManager.class) {
                if (instance == null) {
                    instance = new SessionManager(context);
                }
            }
        }
        return instance;
    }

    public synchronized void saveSession(Session session) {
        if (session == null || session.getAccessToken() == null
                || session.getAccessToken().trim().isEmpty()
                || session.getUserRole() == null) {
            throw new IllegalArgumentException("A valid session is required.");
        }

        ContentValues values = new ContentValues();
        values.put(SessionDatabaseHelper.COLUMN_ID, SESSION_ROW_ID);
        values.put(SessionDatabaseHelper.COLUMN_ACCESS_TOKEN, session.getAccessToken());
        values.put(SessionDatabaseHelper.COLUMN_USER_ROLE, session.getUserRole().getApiValue());
        values.put(SessionDatabaseHelper.COLUMN_DISPLAY_NAME,
                session.getDisplayName() == null ? "" : session.getDisplayName());
        values.put(SessionDatabaseHelper.COLUMN_EXPIRES_AT,
                session.getExpiresAtEpochMillis());

        databaseHelper.getWritableDatabase().insertWithOnConflict(
                SessionDatabaseHelper.TABLE_SESSION,
                null,
                values,
                SQLiteDatabase.CONFLICT_REPLACE
        );
    }

    public synchronized Session loadSession() {
        SQLiteDatabase database = databaseHelper.getReadableDatabase();
        String[] columns = {
                SessionDatabaseHelper.COLUMN_ACCESS_TOKEN,
                SessionDatabaseHelper.COLUMN_USER_ROLE,
                SessionDatabaseHelper.COLUMN_DISPLAY_NAME,
                SessionDatabaseHelper.COLUMN_EXPIRES_AT
        };

        try (Cursor cursor = database.query(
                SessionDatabaseHelper.TABLE_SESSION,
                columns,
                SessionDatabaseHelper.COLUMN_ID + " = ?",
                new String[]{String.valueOf(SESSION_ROW_ID)},
                null,
                null,
                null
        )) {
            if (!cursor.moveToFirst()) {
                return null;
            }

            UserRole role = UserRole.fromApiValue(cursor.getString(1));
            if (role == null) {
                clearSession();
                return null;
            }

            Session session = new Session(
                    cursor.getString(0),
                    role,
                    cursor.getString(2),
                    cursor.getLong(3)
            );

            if (session.isExpired()) {
                clearSession();
                return null;
            }
            return session;
        }
    }

    public synchronized void clearSession() {
        databaseHelper.getWritableDatabase().delete(
                SessionDatabaseHelper.TABLE_SESSION,
                SessionDatabaseHelper.COLUMN_ID + " = ?",
                new String[]{String.valueOf(SESSION_ROW_ID)}
        );
    }
}
