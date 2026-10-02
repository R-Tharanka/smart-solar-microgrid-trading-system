# Requirements Traceability Matrix

Purpose: map the assignment and project-plan requirements to system features, owners, API modules, database collections and client surfaces.

Source references:

- `docs/references/EAD_SE4040_Assignment_2026.pdf`
- `docs/references/Smart_Solar_Microgrid_Trading_System-plan.md`
- `docs/requirements/backend-requirements-change-register.md`

Current implementation and evidence status is audited in `docs/project-status/full-system-progress-report.md`.

## Traceability Matrix

| Req ID | Requirement | Owner | API Contract | Database | Web Surface | Android Surface | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-01 | Use a central REST API as the only communication path for web and mobile clients. | All | All API contracts | All server collections | API client service | Network layer | API base URL config, request screenshots |
| REQ-02 | Keep business logic in the central API using FAT Service style. | All | All service modules | All server collections | Displays server result | Displays server result | Code structure and viva explanation |
| REQ-03 | Host the C# Web API on Windows IIS. | Member 4, Member 1 reviewer | Deployment endpoints | MongoDB connection | Calls hosted API | Calls hosted API | IIS screenshots, deployed URL tests |
| REQ-04 | Use MongoDB as the server-side NoSQL database. | All | All API contracts | `users`, `solarStationInfo`, `energyBookingSlots`, `energyReservations` | None direct | None direct | MongoDB records |
| REQ-05 | Use React.js with Tailwind CSS or permitted equivalent for web. | All | Web consumes API | None direct | All web pages | Not applicable | Web screenshots |
| REQ-06 | Use native Android Java, not a cross-platform framework. | All | Android consumes API | SQLite local cache | Not applicable | Java/XML project; identity slice implemented | APK/build evidence; remaining domain screens |
| REQ-07 | Use SQLite for Android local persistence. | Member 1, Member 3 support | Auth/reference APIs | SQLite `session` table | Not applicable | Token, role, display name and expiry persisted; no reference cache yet | Device/SQLite proof; settle reference-cache scope |
| REQ-08 | Authenticate Backoffice, Grid Operator and Prosumer users with the intended client-role matrix. | Member 1 | `identity-api.md` | `users` | `clientType: Web`, Backoffice/Grid Operator routing | `clientType: Android`, Prosumer/Grid Operator role homes | Allowed/denied login and device/browser tests |
| REQ-09 | Register Prosumer with NIC and require Backoffice activation; permit rejected resubmission without duplicate NIC. | Member 1 | `POST /api/users/prosumer/register` and pending/activate/reject endpoints | `users` | Pending activation review | Registration and pending/rejected feedback | Activation/rejection/resubmission and duplicate-NIC tests |
| REQ-10 | Let Backoffice create, update, deactivate and reactivate Prosumers; Prosumer self-service only requests deactivation. | Member 1 | `identity-api.md` | `users` | Prosumer management, request indicator and processing | Own profile/deactivation request and pending feedback | Administrative lifecycle, active-reservation guard and authorization tests |
| REQ-11 | Enforce role-based authorization. | Member 1 | All protected endpoints | `users` | Auth guard | Auth guard | 401/403 tests |
| REQ-12 | Create and manage solar grid nodes/stations. | Member 2 | `station-slot-api.md` | `solarStationInfo` | Station cards/table/forms | Basic station list; no nearby map | Station CRUD and device evidence |
| REQ-13 | Store station GPS/location details. | Member 2 | `station-slot-api.md` | `solarStationInfo` | Station form/cards/table | Map markers/details not implemented | Map and DB evidence |
| REQ-14 | Store capacity specifications and battery/slot availability. | Member 2 | `station-slot-api.md` | `solarStationInfo`, `energyBookingSlots` | Capacity/slot screens | Slot details | Capacity and slot records |
| REQ-15 | Deactivate station only when no active reservations exist. | Member 2 | `PATCH /api/stations/{id}/status` | `solarStationInfo`, `energyReservations` | Deactivate action/error | Station status display | Rejection test |
| REQ-16 | Create energy booking slots. | Member 2 | `POST /api/stations/{stationCode}/slots` | `energyBookingSlots` | Slot cards/table/management | Slot list and selection | Slot record and role evidence |
| REQ-17 | Let Prosumers create reservations. | Member 3 | `reservation-dashboard-api.md` | `energyReservations`, `energyBookingSlots` | Booking management view | Reservation form | Reservation creation test |
| REQ-18 | Enforce 7-day reservation scheduling rule. | Member 3 | `reservation-dashboard-api.md` | `energyReservations` | Error display | Error display | Beyond-window rejection test |
| REQ-19 | Enforce 12-hour update/cancellation notice rule. | Member 3 | `reservation-dashboard-api.md` | `energyReservations` | Error display | Error display | Insufficient-notice test |
| REQ-20 | Provide booking history, pending bookings, search and live summary counts. | Member 3 | `reservation-dashboard-api.md` | `energyReservations` | Dashboard/history | Basic My Bookings list; filtered views/counts pending | Dashboard and device screenshots |
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

## Current Implementation Summary

Audit date: 2026-10-02

| Requirement group | Current status | Main gap |
| --- | --- | --- |
| Central API and FAT Service architecture | Implemented | Complete all-domain HTTP/MongoDB and IIS evidence |
| MongoDB collections and indexes | Implemented | Current Atlas screenshots and concurrency/transaction evidence |
| Identity and authorization | Backend/Web/Android source supports client-role matrix, pending activation and deactivation requests | Device/browser lifecycle, SQLite scope and final Postman/Atlas evidence |
| Stations and slots | Backend/Web plus Android station/slot lists implemented | Google Maps, Grid Operator availability decision and live evidence |
| Reservations and dashboards | Backend/staff web plus basic Android booking actions implemented | Android search/history/counts, concurrency and end-to-end evidence |
| QR verification and finalization | Backend/web implemented; DTO validation tested | Android camera scanner/maps and final live evidence |
| React web client | Broadly implemented; automated checks pass | Full authenticated browser matrix and final screenshots |
| Native Android Java and SQLite | Partial; identity, station/slot and basic booking source plus session persistence | Maps, complete booking views/counts, QR/scanner/finalization and device evidence |
| IIS deployment | Not started | Publish, configure, test and document |
| Final testing/report evidence | Partial | Full Postman/E2E/screenshots/contributions/report |

The full-suite totals (backend 113, web 12, Android 7 JVM; web lint one warning and Android lint 23 warnings) are from 2026-09-30 and were not rerun for this audit. Recent targeted Android/Web builds passed, but those checks do not replace HTTP, Atlas, browser, Android device or IIS verification. See the dated record in the full-system progress report.
