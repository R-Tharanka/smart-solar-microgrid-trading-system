package com.smartsolar.microgrid.data.session;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

final class SessionDatabaseHelper extends SQLiteOpenHelper {
    static final String TABLE_SESSION = "session";
    static final String COLUMN_ID = "id";
    static final String COLUMN_ACCESS_TOKEN = "access_token";
    static final String COLUMN_USER_ROLE = "user_role";
    static final String COLUMN_DISPLAY_NAME = "display_name";
    static final String COLUMN_EXPIRES_AT = "expires_at_epoch_ms";

    private static final String DATABASE_NAME = "mobile_session.db";
    private static final int DATABASE_VERSION = 1;

    SessionDatabaseHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase database) {
        database.execSQL(
                "CREATE TABLE " + TABLE_SESSION + " (" +
                        COLUMN_ID + " INTEGER PRIMARY KEY CHECK (" + COLUMN_ID + " = 1), " +
                        COLUMN_ACCESS_TOKEN + " TEXT NOT NULL, " +
                        COLUMN_USER_ROLE + " TEXT NOT NULL, " +
                        COLUMN_DISPLAY_NAME + " TEXT NOT NULL, " +
                        COLUMN_EXPIRES_AT + " INTEGER NOT NULL)"
        );
    }

    @Override
    public void onUpgrade(SQLiteDatabase database, int oldVersion, int newVersion) {
        // Add explicit migrations here when the session schema changes.
    }
}
