# Station and Slot API Contract

Base path: `/api`  
Authentication: Bearer token for protected endpoints  
Owner: Member 2

## Station Status Values

- `Active`
- `Maintenance`
- `Deactivated`

## Slot Status Values

- `Available`
- `Reserved`
- `Unavailable`
- `Expired`

## Endpoints

### Create Station

`POST /api/stations`

Authorization: Backoffice

Related collection: `solarStationInfo`

Request:

```json
{
  "stationCode": "STN-CMB-001",
  "name": "Colombo Solar Hub",
  "description": "Main solar microgrid node",
  "latitude": 6.9271,
  "longitude": 79.8612,
  "address": "Colombo",
  "capacityKwh": 120.5,
  "batteryStorageKwh": 80.0
}
```

Validation:

- Station code, name, latitude, longitude, capacity and battery storage are required.
- Station code must be unique.
- Capacity and battery values must be greater than or equal to zero.

Success: `201 Created`

Errors: `400`, `401`, `403`, `409`

### List Stations

`GET /api/stations?status=Active&nearLat=6.9271&nearLng=79.8612`

Authorization: Authenticated user

Related collection: `solarStationInfo`

Use:

- Web station tables.
- Android nearby station list.
- Android map markers.

Success: `200 OK`

```json
{
  "success": true,
  "message": "Stations loaded.",
  "data": [
    {
      "stationId": "66f100000000000000000001",
      "stationCode": "STN-CMB-001",
      "name": "Colombo Solar Hub",
      "latitude": 6.9271,
      "longitude": 79.8612,
      "capacityKwh": 120.5,
      "batteryStorageKwh": 80.0,
      "status": "Active"
    }
  ]
}
```

Errors: `401`, `403`

### Get Station Details

`GET /api/stations/{stationId}`

Authorization: Authenticated user

Related collection: `solarStationInfo`

Success: `200 OK`

Errors: `401`, `403`, `404`

### Update Station

`PUT /api/stations/{stationId}`

Authorization: Backoffice

Related collection: `solarStationInfo`

Request:

```json
{
  "name": "Colombo Solar Hub",
  "description": "Updated details",
  "latitude": 6.9271,
  "longitude": 79.8612,
  "address": "Colombo",
  "capacityKwh": 130.0,
  "batteryStorageKwh": 90.0
}
```

Validation:

- Station must exist.
- Capacity and battery values must be valid.

Success: `200 OK`

Errors: `400`, `401`, `403`, `404`

### Change Station Status

`PATCH /api/stations/{stationId}/status`

Authorization: Backoffice

Related collections: `solarStationInfo`, `energyReservations`

Request:

```json
{
  "status": "Deactivated",
  "reason": "Maintenance shutdown"
}
```

Validation:

- Station must exist.
- Status must be valid.
- Deactivation is rejected when active or future reservations exist.

Success: `200 OK`

Errors: `400`, `401`, `403`, `404`, `409`

### Create Slot

`POST /api/stations/{stationId}/slots`

Authorization: Backoffice

Related collection: `energyBookingSlots`

Request:

```json
{
  "startTimeUtc": "2026-09-24T04:30:00Z",
  "endTimeUtc": "2026-09-24T05:30:00Z",
  "availableEnergyKwh": 15.0,
  "pricePerKwh": 45.0
}
```

Validation:

- Station must exist and be active.
- End time must be after start time.
- Slot time must not overlap an existing active slot for the same station.
- Available energy must be greater than zero.

Success: `201 Created`

Errors: `400`, `401`, `403`, `404`, `409`

### List Station Slots

`GET /api/stations/{stationId}/slots?fromUtc=2026-09-23T00:00:00Z&toUtc=2026-09-30T00:00:00Z&status=Available`

Authorization: Authenticated user

Related collection: `energyBookingSlots`

Use:

- Web slot management.
- Android station details and reservation form.

Success: `200 OK`

Errors: `400`, `401`, `403`, `404`

### Update Slot

`PUT /api/slots/{slotId}`

Authorization: Backoffice

Related collections: `energyBookingSlots`, `energyReservations`

Validation:

- Slot must exist.
- Reserved slots cannot be moved or reduced in a way that invalidates active reservations.

Success: `200 OK`

Errors: `400`, `401`, `403`, `404`, `409`

### Change Slot Status

`PATCH /api/slots/{slotId}/status`

Authorization: Backoffice

Related collections: `energyBookingSlots`, `energyReservations`

Request:

```json
{
  "status": "Unavailable",
  "reason": "Maintenance"
}
```

Validation:

- Slot must exist.
- Status must be valid.
- Active reservations prevent making the slot unavailable unless the reservation workflow handles cancellation/reassignment.

Success: `200 OK`

Errors: `400`, `401`, `403`, `404`, `409`

