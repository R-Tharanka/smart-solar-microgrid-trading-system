package com.smartsolar.microgrid.data.session;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

public final class SessionDatabaseHelper extends SQLiteOpenHelper {
    static final String TABLE_SESSION = "session";
    static final String COLUMN_ID = "id";
    static final String COLUMN_ACCESS_TOKEN = "access_token";
    static final String COLUMN_USER_ROLE = "user_role";
    static final String COLUMN_DISPLAY_NAME = "display_name";
    static final String COLUMN_EXPIRES_AT = "expires_at_epoch_ms";

    private static final String DATABASE_NAME = "mobile_session.db";
    public static final String TABLE_USER_PROFILE = "user_profile";
    public static final String PROFILE_COLUMN_ID = "id";
    public static final String PROFILE_COLUMN_NIC = "nic";
    public static final String PROFILE_COLUMN_DISPLAY_NAME = "display_name";
    public static final String PROFILE_COLUMN_FIRST_NAME = "first_name";
    public static final String PROFILE_COLUMN_LAST_NAME = "last_name";
    public static final String PROFILE_COLUMN_EMAIL = "email";
    public static final String PROFILE_COLUMN_PHONE = "phone";
    public static final String PROFILE_COLUMN_ADDRESS = "address";
    public static final String PROFILE_COLUMN_ACCOUNT_STATUS = "account_status";
    public static final String PROFILE_COLUMN_DEACTIVATION_REQUESTED = "deactivation_requested";
    public static final String PROFILE_COLUMN_LAST_SYNCED_AT = "last_synced_at_epoch_ms";

    public static final String TABLE_GRID_NODE_REFERENCE = "grid_node_reference";
    public static final String GRID_NODE_COLUMN_STATION_ID = "station_id";
    public static final String GRID_NODE_COLUMN_STATION_CODE = "station_code";
    public static final String GRID_NODE_COLUMN_NAME = "name";
    public static final String GRID_NODE_COLUMN_DESCRIPTION = "description";
    public static final String GRID_NODE_COLUMN_LATITUDE = "latitude";
    public static final String GRID_NODE_COLUMN_LONGITUDE = "longitude";
    public static final String GRID_NODE_COLUMN_ADDRESS = "address";
    public static final String GRID_NODE_COLUMN_CAPACITY_KWH = "capacity_kwh";
    public static final String GRID_NODE_COLUMN_BATTERY_STORAGE_KWH = "battery_storage_kwh";
    public static final String GRID_NODE_COLUMN_OPENING_TIME = "opening_time";
    public static final String GRID_NODE_COLUMN_CLOSING_TIME = "closing_time";
    public static final String GRID_NODE_COLUMN_STATUS = "status";
    public static final String GRID_NODE_COLUMN_LAST_SYNCED_AT = "last_synced_at_epoch_ms";

    private static final int DATABASE_VERSION = 3;

    public SessionDatabaseHelper(Context context) {
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
        createUserProfileTable(database);
        createGridNodeReferenceTable(database);
    }

    @Override
    public void onUpgrade(SQLiteDatabase database, int oldVersion, int newVersion) {
        if (oldVersion < 2) {
            createUserProfileTable(database);
        }
        if (oldVersion < 3) {
            createGridNodeReferenceTable(database);
        }
    }

    private void createUserProfileTable(SQLiteDatabase database) {
        database.execSQL("CREATE TABLE IF NOT EXISTS " + TABLE_USER_PROFILE + " (" +
                PROFILE_COLUMN_ID + " INTEGER PRIMARY KEY CHECK (" + PROFILE_COLUMN_ID + " = 1), " +
                PROFILE_COLUMN_NIC + " TEXT NOT NULL, " +
                PROFILE_COLUMN_DISPLAY_NAME + " TEXT NOT NULL, " +
                PROFILE_COLUMN_FIRST_NAME + " TEXT, " +
                PROFILE_COLUMN_LAST_NAME + " TEXT, " +
                PROFILE_COLUMN_EMAIL + " TEXT, " +
                PROFILE_COLUMN_PHONE + " TEXT, " +
                PROFILE_COLUMN_ADDRESS + " TEXT, " +
                PROFILE_COLUMN_ACCOUNT_STATUS + " TEXT, " +
                PROFILE_COLUMN_DEACTIVATION_REQUESTED + " INTEGER NOT NULL DEFAULT 0, " +
                PROFILE_COLUMN_LAST_SYNCED_AT + " INTEGER NOT NULL)"
        );
    }

    private void createGridNodeReferenceTable(SQLiteDatabase database) {
        database.execSQL("CREATE TABLE IF NOT EXISTS " + TABLE_GRID_NODE_REFERENCE + " (" +
                GRID_NODE_COLUMN_STATION_ID + " TEXT PRIMARY KEY NOT NULL, " +
                GRID_NODE_COLUMN_STATION_CODE + " TEXT NOT NULL UNIQUE, " +
                GRID_NODE_COLUMN_NAME + " TEXT NOT NULL, " +
                GRID_NODE_COLUMN_DESCRIPTION + " TEXT, " +
                GRID_NODE_COLUMN_LATITUDE + " REAL NOT NULL, " +
                GRID_NODE_COLUMN_LONGITUDE + " REAL NOT NULL, " +
                GRID_NODE_COLUMN_ADDRESS + " TEXT, " +
                GRID_NODE_COLUMN_CAPACITY_KWH + " REAL NOT NULL, " +
                GRID_NODE_COLUMN_BATTERY_STORAGE_KWH + " REAL NOT NULL, " +
                GRID_NODE_COLUMN_OPENING_TIME + " TEXT, " +
                GRID_NODE_COLUMN_CLOSING_TIME + " TEXT, " +
                GRID_NODE_COLUMN_STATUS + " TEXT NOT NULL, " +
                GRID_NODE_COLUMN_LAST_SYNCED_AT + " INTEGER NOT NULL)"
        );
    }
}
