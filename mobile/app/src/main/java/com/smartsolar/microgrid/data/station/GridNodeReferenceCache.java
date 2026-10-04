package com.smartsolar.microgrid.data.station;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;

import com.smartsolar.microgrid.data.session.SessionDatabaseHelper;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

final class GridNodeReferenceCache {
    private final SessionDatabaseHelper databaseHelper;

    GridNodeReferenceCache(Context context) {
        databaseHelper = new SessionDatabaseHelper(context.getApplicationContext());
    }

    synchronized void upsert(StationResponse station) {
        upsertAll(Collections.singletonList(station));
    }

    synchronized void upsertAll(List<StationResponse> stations) {
        if (stations == null || stations.isEmpty()) return;

        SQLiteDatabase database = databaseHelper.getWritableDatabase();
        long syncedAt = System.currentTimeMillis();
        database.beginTransaction();
        try {
            for (StationResponse station : stations) {
                if (!isCacheable(station)) continue;
                database.insertWithOnConflict(
                        SessionDatabaseHelper.TABLE_GRID_NODE_REFERENCE,
                        null,
                        values(station, syncedAt),
                        SQLiteDatabase.CONFLICT_REPLACE
                );
            }
            database.setTransactionSuccessful();
        } finally {
            database.endTransaction();
        }
    }

    synchronized CachedStationReferences loadAll() {
        List<StationResponse> stations = new ArrayList<>();
        long lastSyncedAt = 0L;
        try (Cursor cursor = databaseHelper.getReadableDatabase().query(
                SessionDatabaseHelper.TABLE_GRID_NODE_REFERENCE,
                null, null, null, null, null,
                SessionDatabaseHelper.GRID_NODE_COLUMN_NAME + " COLLATE NOCASE ASC")) {
            while (cursor.moveToNext()) {
                GridNodeReference reference = read(cursor);
                stations.add(reference.getStation());
                lastSyncedAt = Math.max(lastSyncedAt,
                        reference.getLastSyncedAtEpochMillis());
            }
        }
        return new CachedStationReferences(stations, lastSyncedAt);
    }

    private boolean isCacheable(StationResponse station) {
        return station != null
                && hasText(station.getId())
                && hasText(station.getStationCode())
                && hasText(station.getName())
                && hasText(station.getStatus());
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private ContentValues values(StationResponse station, long syncedAt) {
        ContentValues values = new ContentValues();
        values.put(SessionDatabaseHelper.GRID_NODE_COLUMN_STATION_ID, station.getId());
        values.put(SessionDatabaseHelper.GRID_NODE_COLUMN_STATION_CODE, station.getStationCode());
        values.put(SessionDatabaseHelper.GRID_NODE_COLUMN_NAME, station.getName());
        values.put(SessionDatabaseHelper.GRID_NODE_COLUMN_DESCRIPTION, station.getDescription());
        values.put(SessionDatabaseHelper.GRID_NODE_COLUMN_LATITUDE, station.getLatitude());
        values.put(SessionDatabaseHelper.GRID_NODE_COLUMN_LONGITUDE, station.getLongitude());
        values.put(SessionDatabaseHelper.GRID_NODE_COLUMN_ADDRESS, station.getAddress());
        values.put(SessionDatabaseHelper.GRID_NODE_COLUMN_CAPACITY_KWH,
                station.getCapacityKwh());
        values.put(SessionDatabaseHelper.GRID_NODE_COLUMN_BATTERY_STORAGE_KWH,
                station.getBatteryStorageKwh());
        values.put(SessionDatabaseHelper.GRID_NODE_COLUMN_OPENING_TIME,
                station.getOpeningTime());
        values.put(SessionDatabaseHelper.GRID_NODE_COLUMN_CLOSING_TIME,
                station.getClosingTime());
        values.put(SessionDatabaseHelper.GRID_NODE_COLUMN_STATUS, station.getStatus());
        values.put(SessionDatabaseHelper.GRID_NODE_COLUMN_LAST_SYNCED_AT, syncedAt);
        return values;
    }

    private GridNodeReference read(Cursor cursor) {
        StationResponse station = new StationResponse(
                text(cursor, SessionDatabaseHelper.GRID_NODE_COLUMN_STATION_ID),
                text(cursor, SessionDatabaseHelper.GRID_NODE_COLUMN_STATION_CODE),
                text(cursor, SessionDatabaseHelper.GRID_NODE_COLUMN_NAME),
                text(cursor, SessionDatabaseHelper.GRID_NODE_COLUMN_DESCRIPTION),
                number(cursor, SessionDatabaseHelper.GRID_NODE_COLUMN_LATITUDE),
                number(cursor, SessionDatabaseHelper.GRID_NODE_COLUMN_LONGITUDE),
                text(cursor, SessionDatabaseHelper.GRID_NODE_COLUMN_ADDRESS),
                number(cursor, SessionDatabaseHelper.GRID_NODE_COLUMN_CAPACITY_KWH),
                number(cursor, SessionDatabaseHelper.GRID_NODE_COLUMN_BATTERY_STORAGE_KWH),
                text(cursor, SessionDatabaseHelper.GRID_NODE_COLUMN_OPENING_TIME),
                text(cursor, SessionDatabaseHelper.GRID_NODE_COLUMN_CLOSING_TIME),
                text(cursor, SessionDatabaseHelper.GRID_NODE_COLUMN_STATUS)
        );
        long syncedAt = cursor.getLong(cursor.getColumnIndexOrThrow(
                SessionDatabaseHelper.GRID_NODE_COLUMN_LAST_SYNCED_AT));
        return new GridNodeReference(station, syncedAt);
    }

    private String text(Cursor cursor, String column) {
        int index = cursor.getColumnIndexOrThrow(column);
        return cursor.isNull(index) ? null : cursor.getString(index);
    }

    private double number(Cursor cursor, String column) {
        return cursor.getDouble(cursor.getColumnIndexOrThrow(column));
    }
}
