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
  "batteryStorageKwh": 80.0,
  "openingTime": "06:00:00",
  "closingTime": "20:00:00"
}
```

Validation:

- Station code, name, latitude, longitude, capacity and battery storage are required.
- Station code must be unique.
- Capacity must be greater than zero; battery storage must be greater than or equal to zero.
- Opening time must be before closing time.

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

Query behavior:

- `status` is optional and must match a station status.
- `nearLat` and `nearLng` are optional but must be supplied together.
- Coordinates are validated as latitude `-90..90` and longitude `-180..180`.
- When coordinates are supplied, the current service returns the status-filtered set in approximate nearest-first order. This is not a radius-limited query.

Success: `200 OK`

```json
{
  "success": true,
  "message": "Stations loaded.",
  "data": [
    {
      "id": "66f100000000000000000001",
      "stationCode": "STN-CMB-001",
      "name": "Colombo Solar Hub",
      "description": "Main solar microgrid node",
      "latitude": 6.9271,
      "longitude": 79.8612,
      "address": "Colombo",
      "capacityKwh": 120.5,
      "batteryStorageKwh": 80.0,
      "openingTime": "06:00:00",
      "closingTime": "20:00:00",
      "status": "Active"
    }
  ]
}
```

Errors: `400`, `401`, `403`

### Get Station Details

`GET /api/stations/{stationCode}`

Authorization: Authenticated user

Related collection: `solarStationInfo`

Success: `200 OK`

Errors: `401`, `403`, `404`

### Update Station

`PUT /api/stations/{stationCode}`

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
  "batteryStorageKwh": 90.0,
  "openingTime": "06:00:00",
  "closingTime": "20:00:00"
}
```

Validation:

- Station must exist.
- Capacity and battery values must be valid.

Success: `200 OK`

Errors: `400`, `401`, `403`, `404`

### Change Station Status

`PATCH /api/stations/{stationCode}/status`

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

`POST /api/stations/{stationCode}/slots`

Authorization: Backoffice

Related collection: `energyBookingSlots`

Request:

```json
{
  "slotCode": "SLT-CMB-001",
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

`GET /api/stations/{stationCode}/slots?fromUtc=2026-09-23T00:00:00Z&toUtc=2026-09-30T00:00:00Z&status=Available`

Authorization: Authenticated user

Related collection: `energyBookingSlots`

Use:

- Web slot management.
- Android station details and reservation form.

Success: `200 OK`

Errors: `400`, `401`, `403`, `404`

### Update Slot

`PUT /api/slots/{slotCode}`

Authorization: Backoffice

Related collections: `energyBookingSlots`, `energyReservations`

Validation:

- Slot must exist.
- Reserved slots cannot be moved or reduced in a way that invalidates active reservations.

Success: `200 OK`

Errors: `400`, `401`, `403`, `404`, `409`

### Change Slot Status

`PATCH /api/slots/{slotCode}/status`

Authorization: Backoffice or Grid Operator (`Staff` policy)

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
- The complete slot-status model is `Available`, `Reserved`, `Unavailable`, and `Expired`.
- The Backoffice/Grid Operator availability dropdown exposes the predefined statuses but enables only `Available` and `Unavailable` as manual targets.
- `Reserved` and `Expired` are system-managed states and are rejected as manual targets with `SLOT_STATUS_INVALID`.
- Requesting the current status is rejected with `SLOT_STATUS_UNCHANGED`.
- Active reservations prevent making the slot unavailable unless the reservation workflow handles cancellation/reassignment.
- An expired slot cannot be made available.
- Grid Operators may change only availability/status; slot schedule, capacity and pricing remain read-only to them.

Success: `200 OK`

Errors: `400`, `401`, `403`, `404`, `409`
