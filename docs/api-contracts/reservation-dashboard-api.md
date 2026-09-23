# Reservation and Dashboard API Contract

Base path: `/api`  
Authentication: Bearer token for protected endpoints  
Owner: Member 3

## Reservation Status Values

- `Pending`
- `Approved`
- `Rejected`
- `Cancelled`
- `QrIssued`
- `Verified`
- `Completed`
- `Expired`

## Business Rules

- Reservations must be scheduled within 7 days from server time.
- Reservation update/cancellation must happen at least 12 hours before scheduled start time.
- Prosumers can create, update and cancel only their own reservations.
- Slot conflict checks are performed by the API.
- Cancelled, rejected, completed and expired reservations are terminal states.
- QR and transfer transitions are owned by the operator transaction workflow.

## Endpoints

### Create Reservation

`POST /api/reservations`

Authorization: Prosumer

Related collections: `energyReservations`, `energyBookingSlots`, `solarStationInfo`, `users`

Request:

```json
{
  "stationId": "66f100000000000000000001",
  "slotId": "66f200000000000000000001",
  "requestedEnergyKwh": 10.0
}
```

Validation:

- Authenticated user must be an active Prosumer.
- Station must be active.
- Slot must be available.
- Requested energy must be greater than zero and less than or equal to slot availability.
- Scheduled slot must be inside the 7-day booking window.

Success: `201 Created`

```json
{
  "success": true,
  "message": "Reservation created.",
  "data": {
    "reservationId": "66f300000000000000000001",
    "reservationCode": "RSV-20260923-0001",
    "status": "Pending"
  }
}
```

Errors: `400`, `401`, `403`, `404`, `409`

### Get Own Reservations

`GET /api/reservations/me?status=Pending`

Authorization: Prosumer

Related collection: `energyReservations`

Success: `200 OK`

Errors: `401`, `403`

### Get Reservation Details

`GET /api/reservations/{reservationId}`

Authorization: Backoffice, GridOperator, or owning Prosumer

Related collection: `energyReservations`

Validation:

- Prosumer can read only own reservation.
- Backoffice/Grid Operator can read operational reservations.

Success: `200 OK`

Errors: `401`, `403`, `404`

### Update Own Reservation

`PUT /api/reservations/{reservationId}`

Authorization: Prosumer

Related collections: `energyReservations`, `energyBookingSlots`

Request:

```json
{
  "slotId": "66f200000000000000000002",
  "requestedEnergyKwh": 8.0
}
```

Validation:

- Reservation must belong to authenticated Prosumer.
- Reservation must be in an editable state, usually `Pending` or `Approved` before QR issue.
- Update must happen at least 12 hours before scheduled start time.
- New slot must be available and within 7-day booking window.

Success: `200 OK`

Errors: `400`, `401`, `403`, `404`, `409`

### Cancel Own Reservation

`POST /api/reservations/{reservationId}/cancel`

Authorization: Prosumer

Related collection: `energyReservations`

Request:

```json
{
  "reason": "Schedule changed"
}
```

Validation:

- Reservation must belong to authenticated Prosumer.
- Reservation must be cancellable.
- Cancellation must happen at least 12 hours before scheduled start time.

Success: `200 OK`

Errors: `400`, `401`, `403`, `404`, `409`

### Approve Reservation

`POST /api/reservations/{reservationId}/approve`

Authorization: Backoffice or GridOperator

Related collection: `energyReservations`

Validation:

- Reservation must be `Pending`.
- Related station and slot must still be valid.

Success: `200 OK`

Errors: `400`, `401`, `403`, `404`, `409`

### Reject Reservation

`POST /api/reservations/{reservationId}/reject`

Authorization: Backoffice or GridOperator

Related collection: `energyReservations`

Request:

```json
{
  "reason": "Slot unavailable"
}
```

Validation:

- Reservation must be `Pending`.
- Reason is required.

Success: `200 OK`

Errors: `400`, `401`, `403`, `404`, `409`

### Operational Booking List

`GET /api/reservations?status=Pending&stationId=66f100000000000000000001`

Authorization: Backoffice or GridOperator

Related collection: `energyReservations`

Use:

- Web booking dashboard.
- Operator operational booking view.

Success: `200 OK`

Errors: `401`, `403`

### Booking Summary Dashboard

`GET /api/dashboard/summary`

Authorization: Backoffice or GridOperator

Related collection: `energyReservations`

Response data:

```json
{
  "pendingCount": 5,
  "approvedCount": 3,
  "completedCount": 12,
  "cancelledCount": 2
}
```

Success: `200 OK`

Errors: `401`, `403`

### Prosumer Dashboard Summary

`GET /api/dashboard/me`

Authorization: Prosumer

Related collection: `energyReservations`

Success: `200 OK`

Errors: `401`, `403`
