# Phase 4 - Member 2 Stations and Energy Slots Backend

Status: Implemented; runtime verification requires .NET 10 and MongoDB credentials  
Owner: Member 2

## Scope

This module owns solar/microgrid station information and energy booking slots. It reuses Member 1's JWT authentication and authorization policies and reads Member 3's reservation collection only through `IReservationQueryService`.

## Public identifiers

- Stations use a normalized business code such as `STN-CMB-001`.
- Slots use a normalized business code such as `SLT-CMB-001`.
- MongoDB `ObjectId` values remain internal and are used for station-slot-reservation relationships.

## Endpoints

| Method and route | Policy | Purpose |
| --- | --- | --- |
| `POST /api/stations` | `BackofficeOnly` | Create an active station |
| `GET /api/stations` | `Authenticated` | List stations with optional `status`, `nearLat`, and `nearLng` filters |
| `GET /api/stations/{stationCode}` | `Authenticated` | Get one station |
| `PUT /api/stations/{stationCode}` | `BackofficeOnly` | Update station details |
| `PATCH /api/stations/{stationCode}/status` | `BackofficeOnly` | Activate, maintain, or deactivate a station |
| `POST /api/stations/{stationCode}/slots` | `BackofficeOnly` | Create an available slot |
| `GET /api/stations/{stationCode}/slots` | `Authenticated` | List slots with date/status filters |
| `GET /api/slots/{slotCode}` | `Authenticated` | Get one slot |
| `PUT /api/slots/{slotCode}` | `BackofficeOnly` | Update an unreserved slot |
| `PATCH /api/slots/{slotCode}/status` | `BackofficeOnly` | Make a slot available/unavailable |

All protected calls require `Authorization: Bearer <jwt-token>`.

## Main rules

- Station codes and slot codes are unique and normalized to uppercase.
- Station coordinates use GeoJSON longitude-first order and are returned as separate latitude/longitude fields.
- When both `nearLat` and `nearLng` are provided, station results are ordered nearest-first for map consumers.
- Station capacity must be positive. Battery storage cannot be negative or exceed capacity.
- Opening time must be earlier than closing time on the same day.
- Slots can only be created for active stations.
- Slot times must use UTC, be in the future, have end after start, and fit within the station schedule.
- Slot energy must be positive and cannot exceed station capacity; price must be positive.
- Available/reserved slots at the same station cannot overlap.
- Active reservations (`Pending`, `Approved`, `QrIssued`, `Verified`) prevent station deactivation.
- Active reservations also prevent slot updates or making a slot unavailable.
- Expired available slots are returned as `Expired` without deleting historical records.

## Example create station request

```json
{
  "stationCode": "STN-CMB-001",
  "name": "Colombo Solar Hub",
  "description": "Main solar microgrid node",
  "latitude": 6.9271,
  "longitude": 79.8612,
  "address": "Colombo",
  "capacityKwh": 120.5,
  "batteryStorageKwh": 80.0,
  "openingTime": "08:00:00",
  "closingTime": "20:00:00"
}
```

## Example create slot request

```json
{
  "slotCode": "SLT-CMB-001",
  "startTimeUtc": "2026-10-01T10:00:00Z",
  "endTimeUtc": "2026-10-01T11:00:00Z",
  "availableEnergyKwh": 15.0,
  "pricePerKwh": 45.0
}
```

## Reservation integration

Member 2 does not change reservation state. `ReservationQueryService` performs read-only checks against `energyReservations` using internal station/slot ObjectIds. Member 3 must preserve the agreed `stationId`, `slotId`, and status fields.

When a station has a non-terminal reservation, deactivation returns `409 Conflict` with error code `STATION_ACTIVE_RESERVATIONS`.

## Verification

Automated service tests cover station creation, duplicate codes, capacity/storage rules, reservation-safe deactivation, inactive-station slot rejection, overlap and schedule rules, valid slot creation, and reservation-safe slot changes.

Manual verification should include authenticated calls with Backoffice and Prosumer JWTs, MongoDB document inspection, validation failures, and the `409` station-deactivation scenario.
