package com.smartsolar.microgrid.data.identity;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;

import com.smartsolar.microgrid.data.session.SessionDatabaseHelper;

final class UserProfileCache {
    private static final int PROFILE_ROW_ID = 1;
    private final SessionDatabaseHelper databaseHelper;

    UserProfileCache(Context context) {
        databaseHelper = new SessionDatabaseHelper(context.getApplicationContext());
    }

    synchronized void save(UserResponse user) {
        if (user == null || user.getNic() == null || user.getNic().trim().isEmpty()) return;
        ContentValues values = new ContentValues();
        values.put(SessionDatabaseHelper.PROFILE_COLUMN_ID, PROFILE_ROW_ID);
        values.put(SessionDatabaseHelper.PROFILE_COLUMN_NIC, user.getNic());
        values.put(SessionDatabaseHelper.PROFILE_COLUMN_DISPLAY_NAME, user.getDisplayName());
        values.put(SessionDatabaseHelper.PROFILE_COLUMN_FIRST_NAME, user.getFirstName());
        values.put(SessionDatabaseHelper.PROFILE_COLUMN_LAST_NAME, user.getLastName());
        values.put(SessionDatabaseHelper.PROFILE_COLUMN_EMAIL, user.getEmail());
        values.put(SessionDatabaseHelper.PROFILE_COLUMN_PHONE, user.getPhoneNumber());
        values.put(SessionDatabaseHelper.PROFILE_COLUMN_ADDRESS, user.getAddress());
        values.put(SessionDatabaseHelper.PROFILE_COLUMN_ACCOUNT_STATUS, user.getStatus());
        values.put(SessionDatabaseHelper.PROFILE_COLUMN_DEACTIVATION_REQUESTED,
                user.isDeactivationRequested() ? 1 : 0);
        values.put(SessionDatabaseHelper.PROFILE_COLUMN_LAST_SYNCED_AT, System.currentTimeMillis());
        databaseHelper.getWritableDatabase().insertWithOnConflict(
                SessionDatabaseHelper.TABLE_USER_PROFILE, null, values,
                SQLiteDatabase.CONFLICT_REPLACE);
    }

    synchronized CachedUserProfile load() {
        try (Cursor cursor = databaseHelper.getReadableDatabase().query(
                SessionDatabaseHelper.TABLE_USER_PROFILE, null,
                SessionDatabaseHelper.PROFILE_COLUMN_ID + " = ?",
                new String[]{String.valueOf(PROFILE_ROW_ID)}, null, null, null)) {
            if (!cursor.moveToFirst()) return null;
            return new CachedUserProfile(
                    text(cursor, SessionDatabaseHelper.PROFILE_COLUMN_NIC),
                    text(cursor, SessionDatabaseHelper.PROFILE_COLUMN_DISPLAY_NAME),
                    text(cursor, SessionDatabaseHelper.PROFILE_COLUMN_FIRST_NAME),
                    text(cursor, SessionDatabaseHelper.PROFILE_COLUMN_LAST_NAME),
                    text(cursor, SessionDatabaseHelper.PROFILE_COLUMN_EMAIL),
                    text(cursor, SessionDatabaseHelper.PROFILE_COLUMN_PHONE),
                    text(cursor, SessionDatabaseHelper.PROFILE_COLUMN_ADDRESS),
                    text(cursor, SessionDatabaseHelper.PROFILE_COLUMN_ACCOUNT_STATUS),
                    cursor.getInt(cursor.getColumnIndexOrThrow(
                            SessionDatabaseHelper.PROFILE_COLUMN_DEACTIVATION_REQUESTED)) == 1,
                    cursor.getLong(cursor.getColumnIndexOrThrow(
                            SessionDatabaseHelper.PROFILE_COLUMN_LAST_SYNCED_AT)));
        }
    }

    synchronized void clear() {
        databaseHelper.getWritableDatabase().delete(
                SessionDatabaseHelper.TABLE_USER_PROFILE, null, null);
    }

    private String text(Cursor cursor, String column) {
        int index = cursor.getColumnIndexOrThrow(column);
        return cursor.isNull(index) ? null : cursor.getString(index);
    }
}
