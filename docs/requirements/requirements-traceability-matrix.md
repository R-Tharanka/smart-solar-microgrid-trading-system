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
| REQ-06 | Use native Android Java, not a cross-platform framework. | All | Android consumes API | SQLite local cache | Not applicable | Java/XML identity, station/slot, reservation/dashboard, QR scanner and finalization screens | APK/build plus emulator/device and hosted-API evidence |
| REQ-07 | Use SQLite for Android local persistence. | Member 1 and Member 2 | Auth/reference APIs | SQLite `session`, `user_profile`, `grid_node_reference` | Not applicable | Session persisted; authoritative API profile and station references cached with local sync times for read-only offline display | v1-v2-v3 migration, profile/station fallback, logout/expiry clearing and redacted SQLite device proof |
| REQ-08 | Authenticate Backoffice, Grid Operator and Prosumer users with the intended client-role matrix. | Member 1 | `identity-api.md` | `users` | `clientType: Web`, Backoffice/Grid Operator routing | `clientType: Android`, Prosumer/Grid Operator role homes | Allowed/denied login and device/browser tests |
| REQ-09 | Register Prosumer with NIC and require Backoffice activation; permit rejected resubmission without duplicate NIC. | Member 1 | `POST /api/users/prosumer/register` and pending/activate/reject endpoints | `users` | Pending activation review | Registration and pending/rejected feedback | Activation/rejection/resubmission and duplicate-NIC tests |
| REQ-10 | Let Backoffice create, update, deactivate and reactivate Prosumers; Prosumer self-service only requests deactivation. | Member 1 | `identity-api.md` | `users` | Prosumer management, request indicator and processing | Own profile/deactivation request and pending feedback | Administrative lifecycle, active-reservation guard and authorization tests |
| REQ-11 | Enforce role-based authorization. | Member 1 | All protected endpoints | `users` | Auth guard | Auth guard | 401/403 tests |
| REQ-12 | Create and manage solar grid nodes/stations. | Member 2 | `station-slot-api.md` | `solarStationInfo`; SQLite `grid_node_reference` cache | Station cards/table/forms | Active station map/list, details and slot selection | Station CRUD, cache and device evidence |
| REQ-13 | Store station GPS/location details and use the required Google Maps client feature. | Member 2 | `GET /api/stations` with optional paired `nearLat`/`nearLng` | GeoJSON station location and `2dsphere` index; cached latitude/longitude | Station form/cards/table | Validated-coordinate markers and single current-location nearby ordering currently use osmdroid/OpenStreetMap | Replace with Google Maps or document lecturer-approved deviation; device permission/location and DB evidence |
| REQ-14 | Store capacity specifications and battery/slot availability. | Member 2 | `station-slot-api.md` | `solarStationInfo`, `energyBookingSlots` | Backoffice edits details; Grid Operator views details; both use the predefined availability dropdown with server-enforced transitions | Slot details | Capacity/status records, transition validation and role tests |
| REQ-15 | Deactivate station only when no active reservations exist. | Member 2 | `PATCH /api/stations/{stationCode}/status` | `solarStationInfo`, `energyReservations` | Deactivate action/error | Station status display | Rejection test |
| REQ-16 | Create energy booking slots. | Member 2 | `POST /api/stations/{stationCode}/slots` | `energyBookingSlots` | Slot cards/table/management | Slot list and selection | Slot record and role evidence |
| REQ-17 | Let Prosumers create reservations. | Member 3 | `reservation-dashboard-api.md` | `energyReservations`, `energyBookingSlots` | Booking management view | Reservation form | Reservation creation test |
| REQ-18 | Enforce 7-day reservation scheduling rule. | Member 3 | `reservation-dashboard-api.md` | `energyReservations` | Error display | Error display | Beyond-window rejection test |
| REQ-19 | Enforce 12-hour update/cancellation notice rule. | Member 3 | `reservation-dashboard-api.md` | `energyReservations` | Error display | Error display | Insufficient-notice test |
| REQ-20 | Provide booking history, pending bookings, search and live summary counts. | Member 3 | `reservation-dashboard-api.md` | `energyReservations` | Dashboard/history | Search plus current/pending/history categories and live pending/approved-upcoming counts implemented | Dashboard/device screenshots and live API proof |
| REQ-21 | Approve or reject reservations where required by operator/backoffice workflow. | Member 3/4 | `reservation-dashboard-api.md` | `energyReservations` | Operational bookings | Status view | Status transition test |
| REQ-22 | Generate secure transaction QR for approved reservation. | Member 4 | `operator-transaction-api.md` | `energyReservations` stores only SHA-256 hash/expiry | QR/reference view if used | Issue/render/expiry/regenerate uses canonical parser and transient-only token memory; legacy cache cleared | Focused issue/renewal/old-token/new-token tests pass; device/process-death/upgrade proof pending |
| REQ-23 | Scan and verify QR transaction by Grid Operator. | Member 4 | `operator-transaction-api.md` | `energyReservations` | Operator dashboard | ZXing scanner, strict parser, one-time in-memory handoff and server verification source exists | Valid/invalid/expired/permission camera/device tests |
| REQ-24 | Finalize energy transfer after verification. | Member 4 | `operator-transaction-api.md` | `energyReservations` | Transfer status | Actual-energy/note confirmation, finalize call and result dialog source exists | Completed Atlas record, station increment and device evidence |
| REQ-25 | Prevent invalid, expired, unauthorized or duplicate finalization. | Member 4 | `operator-transaction-api.md` | `energyReservations` | Error display | Safe mapped errors; server remains authoritative | Renewal/ownership/invalid-state coverage exists; complete expiry/replay/duplicate/rollback and device matrix pending |
| REQ-26 | Display nearby grid nodes and station details on Google Maps. | Member 2/4 | `GET /api/stations?status=Active&nearLat=...&nearLng=...` | `solarStationInfo`; SQLite station-reference fallback | Optional station view | Shared Prosumer/Grid Operator map/list, markers, details and location fallbacks use osmdroid/OpenStreetMap | Capability exists, but provider does not match requirement; replace/approve deviation and capture device marker proof |
| REQ-27 | Provide consistent API errors for clients. | Member 1 | All API contracts | Not applicable | Error components | Stable status/code plus safe mapped messages; raw server `detail` is hidden | Backend/client examples and focused Android sanitization tests; hosted negative matrix pending |
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

Audit date: 2026-10-05

| Requirement group | Current status | Main gap |
| --- | --- | --- |
| Central API and FAT Service architecture | Implemented | Complete all-domain HTTP/MongoDB and IIS evidence |
| MongoDB collections and indexes | Implemented | Current Atlas screenshots and concurrency/transaction evidence |
| Identity and authorization | Backend/Web/Android source supports client-role matrix, pending activation/deactivation requests and SQLite profile fallback | Device/browser lifecycle, SQLite runtime isolation and final Postman/Atlas evidence |
| Stations and slots | Backend/Web plus Android map/list/details, nearby ordering, slot selection and station-reference cache implemented; Grid Operator may change slot status but not details | Android uses osmdroid instead of required Google Maps; hosted role-matrix and device/cache proof |
| Reservations and dashboards | Backend/staff web plus Android booking actions, action summaries, search/categories and live counts implemented | Refresh, concurrency, device and end-to-end evidence |
| QR verification and finalization | Backend/Web/Android source implemented; raw token is transient-only; focused renewal/parser/error tests pass; APK assembles | Broader camera/Fragment/device and final Atlas/IIS evidence |
| React web client | Broadly implemented; automated checks pass | Full authenticated browser matrix and final screenshots |
| Native Android Java and SQLite | Partial; all four domains have source; session/profile/grid-node SQLite scope exists; 12/12 JVM tests and APK assembly pass | Google Maps non-compliance and device/cache/camera/hosted evidence |
| IIS deployment | Not started | Publish, configure, test and document |
| Final testing/report evidence | Partial | Full Postman/E2E/screenshots/contributions/report |

Current 2026-10-05 checks: backend 145/145 passed, including finalized Grid Operator slot-policy/status coverage and QR issue/renewal/old-token/new-token/ownership/state coverage; Web 12/12 and production build passed with 0 lint errors/1 warning; Android 12/12 JVM tests and debug APK assembly passed, including API-detail sanitization and canonical QR parser/ephemeral-store coverage. These checks do not replace HTTP, Atlas, browser, Android device or IIS verification. See the dated record in the full-system progress report.
