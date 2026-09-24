# MongoDB Collection Design

This file preserves the Phase 1 MongoDB data-model sketch for the Smart Solar Microgrid Trading System. The authoritative Phase 2 model, storage types, concurrency rules and indexes are defined in `docs/phase-2/database-specification.md`.

## 1. `users`

Owner: Member 1  
Purpose: Identity, roles, credentials and account lifecycle.

```json
{
  "_id": "ObjectId",
  "nic": "200012345678",
  "email": "prosumer@example.com",
  "firstName": "Sample",
  "lastName": "Prosumer",
  "phoneNumber": "0771234567",
  "address": "Colombo",
  "role": "Prosumer",
  "status": "Active",
  "passwordHash": "hashed-password",
  "createdAtUtc": "2026-09-23T00:00:00Z",
  "updatedAtUtc": "2026-09-23T00:00:00Z",
  "createdByIdentifier": null,
  "lastLoginAtUtc": null,
  "deactivatedAtUtc": null,
  "reactivatedAtUtc": null,
  "statusChangedByIdentifier": null
}
```

Indexes:

- Unique: `email`
- Unique sparse: `nic`
- Non-unique: `role`, `status`

## 2. `solarStationInfo`

Owner: Member 2  
Purpose: Solar microgrid node/station profile.

```json
{
  "_id": "ObjectId",
  "stationCode": "STN-CMB-001",
  "name": "Colombo Solar Hub",
  "description": "Main solar microgrid node",
  "location": {
    "latitude": 6.9271,
    "longitude": 79.8612,
    "address": "Colombo"
  },
  "capacityKwh": 120.5,
  "batteryStorageKwh": 80.0,
  "status": "Active",
  "createdAtUtc": "2026-09-23T00:00:00Z",
  "updatedAtUtc": "2026-09-23T00:00:00Z"
}
```

Indexes:

- Unique: `stationCode`
- Geospatial index on location coordinates for nearby station queries.
- Non-unique: `status`

Status values:

- `Active`
- `Maintenance`
- `Deactivated`

## 3. `energyBookingSlots`

Owner: Member 2  
Purpose: Bookable energy slot availability for a station.

```json
{
  "_id": "ObjectId",
  "stationId": "ObjectId",
  "slotDate": "2026-09-24",
  "startTimeUtc": "2026-09-24T04:30:00Z",
  "endTimeUtc": "2026-09-24T05:30:00Z",
  "availableEnergyKwh": 15.0,
  "pricePerKwh": 45.0,
  "status": "Available",
  "createdAtUtc": "2026-09-23T00:00:00Z",
  "updatedAtUtc": "2026-09-23T00:00:00Z"
}
```

Indexes:

- Compound: `stationId`, `startTimeUtc`, `endTimeUtc`
- Non-unique: `status`

Status values:

- `Available`
- `Reserved`
- `Unavailable`
- `Expired`

## 4. `energyReservations`

Owner: Member 3 for reservation workflow, Member 4 for QR/transfer fields  
Purpose: Reservation lifecycle and final energy transfer verification.

```json
{
  "_id": "ObjectId",
  "reservationCode": "RSV-20260923-0001",
  "prosumerNic": "200012345678",
  "stationId": "ObjectId",
  "slotId": "ObjectId",
  "requestedEnergyKwh": 10.0,
  "scheduledStartTimeUtc": "2026-09-24T04:30:00Z",
  "scheduledEndTimeUtc": "2026-09-24T05:30:00Z",
  "status": "Pending",
  "qrTokenHash": null,
  "qrExpiresAtUtc": null,
  "verifiedByUserId": null,
  "verifiedAtUtc": null,
  "finalizedByUserId": null,
  "finalizedAtUtc": null,
  "createdAtUtc": "2026-09-23T00:00:00Z",
  "updatedAtUtc": "2026-09-23T00:00:00Z",
  "cancelledAtUtc": null,
  "cancellationReason": null
}
```

Indexes:

- Unique: `reservationCode`
- Non-unique: `prosumerNic`, `stationId`, `slotId`, `status`, `scheduledStartTimeUtc`

Recommended reservation status values:

- `Pending`
- `Approved`
- `Rejected`
- `Cancelled`
- `QrIssued`
- `Verified`
- `Completed`
- `Expired`

## Cross-Collection Rules

- `energyReservations.prosumerNic` references `users.nic` where `role = Prosumer`.
- `energyReservations.stationId` references `solarStationInfo._id`.
- `energyReservations.slotId` references `energyBookingSlots._id`.
- A slot should not be double-booked.
- A station cannot be deactivated while active reservations exist.
- QR verification and finalization must update the reservation state atomically where practical.
- Clients must not directly mutate MongoDB records.
