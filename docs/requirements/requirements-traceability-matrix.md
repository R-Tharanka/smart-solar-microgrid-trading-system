# Requirements Traceability Matrix

Purpose: map the assignment and project-plan requirements to system features, owners, API modules, database collections and client surfaces.

Source references:

- `docs/references/EAD_SE4040_Assignment_2026.pdf`
- `docs/references/Smart_Solar_Microgrid_Trading_System-plan.md`

## Traceability Matrix

| Req ID | Requirement | Owner | API Contract | Database | Web Surface | Android Surface | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-01 | Use a central REST API as the only communication path for web and mobile clients. | All | All API contracts | All server collections | API client service | Network layer | API base URL config, request screenshots |
| REQ-02 | Keep business logic in the central API using FAT Service style. | All | All service modules | All server collections | Displays server result | Displays server result | Code structure and viva explanation |
| REQ-03 | Host the C# Web API on Windows IIS. | Member 4, Member 1 reviewer | Deployment endpoints | MongoDB connection | Calls hosted API | Calls hosted API | IIS screenshots, deployed URL tests |
| REQ-04 | Use MongoDB as the server-side NoSQL database. | All | All API contracts | `users`, `solarStationInfo`, `energyBookingSlots`, `energyReservations` | None direct | None direct | MongoDB records |
| REQ-05 | Use React.js with Tailwind CSS or permitted equivalent for web. | All | Web consumes API | None direct | All web pages | Not applicable | Web screenshots |
| REQ-06 | Use native Android Java, not a cross-platform framework. | All | Android consumes API | SQLite local cache | Not applicable | All Android screens | Android project and screenshots |
| REQ-07 | Use SQLite for Android local persistence. | Member 1, Member 3 support | Auth/reference APIs | SQLite tables | Not applicable | Session/reference cache | SQLite data evidence |
| REQ-08 | Authenticate Backoffice, Grid Operator and Prosumer users. | Member 1 | `identity-api.md` | `users` | Login, role routing | Login, role routing | Login success/failure tests |
| REQ-09 | Register Prosumer profile using NIC as primary identity. | Member 1 | `POST /api/users/prosumer/register` | `users` | Prosumer management | Registration | Duplicate NIC test |
| REQ-10 | Manage users and account status. | Member 1 | `identity-api.md` | `users` | User/prosumer management | Profile/status request if implemented | Status update tests |
| REQ-11 | Enforce role-based authorization. | Member 1 | All protected endpoints | `users` | Auth guard | Auth guard | 401/403 tests |
| REQ-12 | Create and manage solar grid nodes/stations. | Member 2 | `station-slot-api.md` | `solarStationInfo` | Station dashboard/forms | Nearby station list/map | Station CRUD evidence |
| REQ-13 | Store station GPS/location details. | Member 2 | `station-slot-api.md` | `solarStationInfo` | Station form/table | Map markers/details | Map and DB evidence |
| REQ-14 | Store capacity specifications and battery/slot availability. | Member 2 | `station-slot-api.md` | `solarStationInfo`, `energyBookingSlots` | Capacity/slot screens | Slot details | Capacity and slot records |
| REQ-15 | Deactivate station only when no active reservations exist. | Member 2 | `PATCH /api/stations/{id}/status` | `solarStationInfo`, `energyReservations` | Deactivate action/error | Station status display | Rejection test |
| REQ-16 | Create energy booking slots. | Member 2 | `POST /api/stations/{stationId}/slots` | `energyBookingSlots` | Slot management | Slot selection | Slot record evidence |
| REQ-17 | Let Prosumers create reservations. | Member 3 | `reservation-dashboard-api.md` | `energyReservations`, `energyBookingSlots` | Booking management view | Reservation form | Reservation creation test |
| REQ-18 | Enforce 7-day reservation scheduling rule. | Member 3 | `reservation-dashboard-api.md` | `energyReservations` | Error display | Error display | Beyond-window rejection test |
| REQ-19 | Enforce 12-hour update/cancellation notice rule. | Member 3 | `reservation-dashboard-api.md` | `energyReservations` | Error display | Error display | Insufficient-notice test |
| REQ-20 | Provide booking history, pending bookings and summary views. | Member 3 | `reservation-dashboard-api.md` | `energyReservations` | Dashboard/history | History/pending screens | Dashboard screenshots |
| REQ-21 | Approve or reject reservations where required by operator/backoffice workflow. | Member 3/4 | `reservation-dashboard-api.md` | `energyReservations` | Operational bookings | Status view | Status transition test |
| REQ-22 | Generate secure transaction QR for approved reservation. | Member 4 | `operator-transaction-api.md` | `energyReservations` | QR/reference view if used | QR display | QR generation evidence |
| REQ-23 | Scan and verify QR transaction by Grid Operator. | Member 4 | `operator-transaction-api.md` | `energyReservations` | Operator dashboard | QR scanner | Valid/invalid QR test |
| REQ-24 | Finalize energy transfer after verification. | Member 4 | `operator-transaction-api.md` | `energyReservations` | Transfer status | Transfer completion | Completed transaction record |
| REQ-25 | Prevent invalid, expired, unauthorized or duplicate finalization. | Member 4 | `operator-transaction-api.md` | `energyReservations` | Error display | Error display | Duplicate/expired test |
| REQ-26 | Display nearby grid nodes and station details on map. | Member 2/4 | `station-slot-api.md` | `solarStationInfo` | Optional station view | Map screen | Map screenshot |
| REQ-27 | Provide consistent API errors for clients. | Member 1 | All API contracts | Not applicable | Error components | Error views | Error response examples |
| REQ-28 | Document architecture, database design, API contracts, testing, deployment and contributions. | All | Documentation | Documentation | Screenshots | Screenshots | Final report sections |

## Coverage Summary

| Phase 1 Area | Coverage |
| --- | --- |
| Authentication | REQ-08 to REQ-11 |
| User management | REQ-09 to REQ-11 |
| Stations | REQ-12 to REQ-15 |
| Slots | REQ-14 and REQ-16 |
| Reservations | REQ-17 to REQ-21 |
| Mobile | REQ-06, REQ-07, REQ-09, REQ-17 to REQ-20, REQ-23 to REQ-26 |
| QR | REQ-22 to REQ-25 |
| Maps | REQ-13 and REQ-26 |
| Deployment | REQ-03 |
| Documentation and evidence | REQ-28 |
