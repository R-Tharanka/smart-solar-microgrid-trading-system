# Full System Progress and Completion Report

Audit date: 2026-10-05

Project: Smart Solar Microgrid Trading System

Scope: Current repository against the original four-member plan and SE4040 assignment brief

Audited source baseline: branch `feature/member1-identity`, commit `eba9689` (documentation changes from this audit excluded)

## 1. Assessment Basis

This is a factual repository audit, not the student-authored final submission report. It compares the current `backend/`, `web/`, `mobile/`, and `docs/` source with:

- `docs/references/Smart_Solar_Microgrid_Trading_System-plan.md` (the original implementation/ownership plan);
- `docs/references/EAD_SE4040_Assignment_2026.pdf` (the authoritative assignment and marking brief, especially pages 1–4 and 7–9);
- the API contracts, requirement traceability matrix, and post-plan decisions in `docs/requirements/backend-requirements-change-register.md`.

The plan is a target, not proof of implementation. Its September 28 schedule conflicts with the PDF's September 30, 2026, 11:59 PM deadline; the PDF takes precedence. The PDF requires a central C# FAT Service on IIS, MongoDB, a web UI, native Android with SQLite, four clearly attributable contributions, screenshots, diagrams, a detailed report, source code as text, references, a Git link, challenges, a README video link, and `.cs` file/method comments. Page 6 restricts AI use to planning: team members must independently validate and author any assessed implementation, contribution statement, and final report. This audit must not be represented as a student's personal contribution or submitted unchanged.

Status terms used here: **implemented** means source exists; **build-checked** means a recorded local check passed; **partial** means required behavior or evidence is missing; **not evidenced** means no reliable repository artifact was found. Source presence alone does not prove a live API, browser, emulator, physical device, MongoDB Atlas, or IIS workflow.

| Assignment assessment area | Marks | Current position |
| --- | ---: | --- |
| Service architecture/API | 8 group | Central API and service/repository separation exist; IIS-hosted reachability unproved |
| Database design/model | 4 group | Four MongoDB collection models and indexes exist; final sample/Atlas evidence absent |
| Client build/architecture | 12 group | Web and native Android exist across all four domains; hosted/client integration and Android runtime proof are incomplete |
| UI/UX | 6 group | Web is broad; Android has account, station/booking, QR display and operator scan/finalize screens, but final device/browser evidence is absent |
| Documentation/deployment | 5 group | Engineering docs exist; IIS and student-authored assessment package incomplete |
| Web features/business rules | 18 individual | Four domains have API/web surfaces; complete hosted/browser demonstration remains |
| Mobile authentication/accounts | 9 individual | Registration, login, profile, pending activation and deactivation-request code exist; device proof remains |
| Reservation workflow | 9 individual | API and Android create/update/cancel screens exist; live action-summary/boundary proof remains |
| Booking views/dashboards | 10 individual | API/staff web plus Android booking search, current/pending/history categories and live pending/approved-upcoming counts exist; device evidence remains |
| Operator verification/maps | 7 individual | Android QR camera scan, server verification and finalization source exists; the station map uses osmdroid/OpenStreetMap rather than the required Google Maps implementation |
| Integration/SQLite/device | 12 individual | API clients, location/map source and SQLite session/profile/station-reference persistence exist; raw QR payload persistence, IIS and device evidence remain blockers |

## 2. Executive Conclusion

The project has a substantial central API and React implementation and a native Android client spanning all four member domains, but **the full assignment is not complete or independently demonstrated**. Android now includes Prosumer station map/list discovery, station details, live slot selection, reservation creation, searchable current/pending/history booking views, live dashboard counts, approved-booking QR rendering, camera scanning, server verification and finalization. Those additions close the earlier source-code gap, but they do not close the assignment: the map is currently implemented with osmdroid/OpenStreetMap rather than Google Maps, the raw bearer-style QR payload is persisted in SharedPreferences, the transaction UI has no dedicated automated tests, and no camera/device/IIS/end-to-end run is evidenced.

Post-plan Member 1 changes are implemented in source: Web and Android pass a login `clientType`; public Prosumer registration is `Pending`; Backoffice can activate/reject; a rejected NIC may resubmit into the same record; Prosumer self-service records a deactivation **request** while status stays `Active`; Backoffice alone administratively deactivates/reactivates. The React activation and deactivation-request views and Android request feedback are now present. The old report's statements that the clients still need these contracts were stale.

Member 1's Android persistence is implemented: database version 2 retained the original `session` table and added a single-account `user_profile` cache populated from login, successful `/api/users/me` reads and successful profile updates. The Profile screen remains server-first and falls back to timestamped cached data only for availability failures. Offline profile edits are not queued or falsely saved. Passwords, duplicate JWTs and server-only fields are not cached.

Member 2 subsequently advanced the same shared database to version 3 through a non-destructive v2-to-v3 migration and added `grid_node_reference`. Successful active-station responses are upserted with a local synchronization timestamp; location-based responses do not delete unrelated cached rows. On network/transport or 5xx station failures, the map/list can display cached references with an explicit offline/last-synchronized notice. Normal 4xx/authentication errors retain the normal error/session path. Cached station data is never used for slot availability or reservations: selecting a cached station still opens the live slot API flow. Logout, expiry and unauthorized-session clearing remove the session, profile and station-reference rows. These caches are bounded display/reference stores, not offline business authority. The current map widget and controller are osmdroid-based even though Google Maps dependencies/key configuration remain in the project and the assignment specifically names Google Maps.

Member 4's later Android integration adds a Prosumer QR screen and renewal action, ZXing camera scanner, Grid Operator verification form, final transfer confirmation and success/error dialogs. The backend was also changed after the original plan so an already `QrIssued` reservation can rotate/reissue its token; the newest token hash replaces the old hash. This renewal path is not directly covered by a backend test. More importantly, `BookingDetailsFragment` stores the entire raw QR payload in `qr_cache` SharedPreferences and does not clear it through the identity/logout cache path; current backup rules exclude only the SQLite database. Because the payload contains the transaction token, this contradicts the hash-only/no-token-persistence security design and must be remediated before the mobile QR feature is considered secure or complete.

The team has now resolved the assignment's Grid Operator slot-availability rule: Grid Operators have read-only station and slot details, may change slot availability/status, and may not edit station data or slot schedule/capacity/price. The API and Web actions implement this division; Backoffice retains station/slot creation and detail-edit authority.

| Area | Status and principal gap |
| --- | --- |
| Requirements/architecture | Documented; team sign-off and current diagrams/evidence review still needed |
| Backend | Four domains implemented; final live MongoDB, concurrency, rollback and security proof missing |
| React web | Broad role-based experience, including activation queue and station/slot card-list toggles; hosted/browser matrix missing |
| Native Android | All four domains have source/UI coverage, including QR/scanner/finalization; Google Maps compliance, token-storage remediation and runtime proof are missing |
| MongoDB/SQLite | Four server collections plus Android `session`, `user_profile` and `grid_node_reference` tables; migration/device inspection evidence remains |
| IIS | No demonstrated IIS-hosted API or both-client integration |
| Assessment package | Final screenshots, all-domain Postman run, video, verified contributions and final report missing |

## 3. Current Architecture and Repository Evidence

The repository has React/Router/Axios/Tailwind on web; native Java/XML, AndroidX Navigation, Material Components, Gson and SQLite on Android; ASP.NET Core controllers/services/repositories with JWT, BCrypt, role policies, active-account checks, Problem Details and MongoDB on the server. Both clients call the API rather than MongoDB directly. The server models `users`, `solarStationInfo`, `energyBookingSlots` and `energyReservations`; QR and transaction audit fields are embedded in reservations. Docker/Compose and health endpoints support local development, not IIS proof.

| Artifact | Current evidence | Confidence/limitation |
| --- | --- | --- |
| Identity API | `UsersController`, `IdentityService`, user repository/models and identity tests | Source-verified; final hosted calls not rerun in this audit |
| Station/slot API | Controllers/services/repositories, geospatial/index and validation code | Source-verified; live rule and role matrix need proof |
| Reservation/dashboard API | Reservation and dashboard controllers/services, capacity/status rules | Source-verified; real MongoDB concurrency proof missing |
| QR/transaction API | Issue/reissue, verify/finalize endpoints, token/hash and transaction code | Source-verified; reissue has no direct test and real transaction rollback proof is missing |
| React | Role routes; account, station, slot, reservation and transaction pages | Source-verified; current browser matrix not run |
| Android | Login/profile, location-aware station map/list/details, reservation workflows, QR rendering, camera scanning, verification and finalization | Source/build-verified; uses osmdroid instead of required Google Maps, persists raw QR payload, and lacks device/API proof |
| SQLite | Shared `SessionDatabaseHelper`, `SessionManager`, `UserProfileCache`, `GridNodeReferenceCache` | Session plus API-derived profile/station caches implemented; v1-v2-v3 migration/device inspection not yet demonstrated |
| Postman | Identity collection only | All-domain suite absent |
| Deployment | Docker files, `.env.example`, emulator development URL | IIS hosting not evidenced |

Current verification on 2026-10-05: backend 136/136 tests passed, including read and mutation endpoint-policy coverage for the finalized Grid Operator slot boundary; Web 12/12 tests and production build passed, with zero lint errors and one existing hooks-dependency warning; Android assembled successfully but its 9-test JVM suite has 8 passing and one failing API error-sanitization test. These automated checks do not establish live MongoDB, browser, map tiles/location, camera, emulator/device or IIS behavior.

## 4. Progress by Planned Phase

| Planned phase | Completed in repository | Still pending |
| --- | --- | --- |
| Phase 1: requirements/foundation | Roles, ownership, use cases, diagrams, collection design, UI/evidence checklist and traceability | Four-member review/sign-off; update final artifacts to actual implementation and PDF wording |
| Phase 2: architecture/contracts | Central API, MongoDB, JWT/error conventions, four domain contracts, change register, finalized Grid Operator slot boundary and bounded Android profile/station caching | Confirm soft-delete interpretation; finish contract reconciliation and sign-off |
| Phase 3: backend core | Identity, infrastructure, reservation/dashboard and transaction domains; current 136-test backend suite passes | Hosted HTTP matrix and real MongoDB concurrency/transaction evidence |
| React web | Public home, role workspaces, account/activation, station/slot, reservation and transaction UI | Final role/browser/responsive/hosted verification and screenshots |
| Native Android | Shared API/session, cached profile/station fallback, identity, location/map discovery, booking workflows, QR display, camera scan, verify and finalize source | Replace/justify osmdroid against the Google Maps requirement; remove raw QR persistence; add tests and device/E2E proof |
| Deployment | Docker/local setup and health endpoints | Secure IIS/HTTPS/Atlas deployment and both-client connectivity |
| Testing/report | Unit/helper tests and identity Postman | All-domain Postman, E2E/device/Atlas/IIS evidence, final student-authored report and video |

## 5. Shared Backend Foundation

Implemented: dependency injection; separate controllers, services and repositories; MongoDB initialization and indexes; JWT/BCrypt; `Backoffice`, `GridOperator` and `Prosumer` policies; current-account active checks on protected requests; API envelopes/Problem Details; logging, correlation and environment-based configuration. These do not remove the need for hosted authorization and database tests.

Important post-plan decisions and divergences:

| Topic | Current behavior | Remaining consequence |
| --- | --- | --- |
| Identity key | MongoDB `_id` remains internal; NIC is unique public Prosumer business identifier | Explain distinction in final database report |
| Client-role access | Web: Backoffice/Grid Operator; Android: Prosumer/Grid Operator; API enforces via `clientType` | Prove all allowed/denied combinations over HTTP |
| Prosumer lifecycle | Public registration `Pending`; Backoffice activates/rejects; rejected NIC resubmits as `Pending` | Capture activation, rejection and duplicate-NIC evidence |
| Session status | Only `Active` accounts log in; protected API checks current active status after JWT issuance | Demonstrate post-login deactivation rejection |
| Deactivation request | Prosumer request leaves account `Active`; Backoffice administrative action makes it `Deactivated` | Show pending flag/time separately from status; no auto-logout for request |
| Reservation-aware deactivation | Non-terminal reservations block administrative account/station changes | Test each protected state, do not weaken guard |
| Deletion | Status transitions/cancellation preserve records; no blanket physical-delete API | Confirm rubric's “delete” terminology is satisfied |
| Units | Booking energy/capacity uses kWh; price uses per-kWh | Document interpretation of PDF `kW/h` wording |
| Booking boundary | Server UTC, start after now and within seven days; changes/cancel at least twelve hours before start | Exact-boundary and timezone evidence needed |
| Allocation/approval | Pending reservation does not consume slot energy; staff approval conditionally allocates | Live competing-approval test needed |
| Slot authority | Grid Operator: read stations/slots and change slot availability/status only. Backoffice: create/edit station and slot details plus status operations | Verify the positive/negative role matrix over hosted HTTP |
| QR/finalization | Opaque expiring QR token, stored server-side hash, optional token rotation from `QrIssued`, verify then transactional completion/storage increment | Add renewal tests; remove Android raw-token persistence; prove replay/rollback on Atlas |
| Map provider | Assignment/plan require Google Maps; current Android station UI imports osmdroid and renders an OpenStreetMap `MapView` | Replace with Google Maps or obtain and document lecturer approval for the divergence; remove stale Google Maps claims/dependencies as appropriate |
| Android local data | SQLite v3 stores one session, one API-derived authenticated profile and API-derived grid-node references with local sync timestamps; server remains authoritative | Inspect v1-to-v2-to-v3 migration, offline/no-cache behavior and clearing on a real emulator/device; QR token must not join persistent local data |

See the change register for the decision IDs and client impact. Do not describe a deactivation request as a deactivated account or a `Pending` registration.

## 6. Member 1 - Identity, Authentication and Account Management

### Planned responsibility

Own user model/collection, staff roles, Prosumer NIC registration, login, authorization, profile and password changes, account lifecycle, Web role routing/user management, Android registration/login/profile/deactivation request, SQLite account persistence, tests and evidence. The repository README declares this owner as **IT22079268 - Premathilaka G.G.R.T**. The team must confirm that declaration against student records, commits and viva evidence.

### Completed backend work

- `users` model/repository, unique email and sparse unique NIC indexes, BCrypt hashing and secure bootstrap admin.
- Identifier login (email or Prosumer NIC), JWT issuance, explicit Web/Android client-role matrix and distinct invalid-credentials/status/client errors.
- `Pending`, `Active`, `Rejected`, `Deactivated` Prosumer states; pending list, activation and rejection; rejected NIC resubmission without duplicate record.
- Backoffice staff/Prosumer creation and Prosumer editing; current-user profile/update/password change.
- Prosumer `POST /api/users/me/deactivation-request` records flag/time but keeps `Active`; Backoffice `/{identifier}/deactivate` and `/reactivate` perform lifecycle changes with reservation guard.
- Current-user and Backoffice user responses expose safe status/request fields; active-account authorization rechecks protected requests.
- Identity, JWT, policy, validation and controller test source exists. No final hosted test run is claimed.

### Completed web work

- Login sends `clientType: Web`; polite account/client error messages; Backoffice and Grid Operator routing only.
- Backoffice staff/Prosumer management, status filters, profile/security controls and reservation-aware error feedback.
- Pending activation review with activate/reject; separate deactivation-request indicator/filter, processing action and dashboard notice.
- Shared responsive shell, dialogs, alerts, toasts, loading/empty/error states.

**Completed Android work:** native registration/login sends `clientType: Android`; Prosumer/Grid Operator role homes; SQLite session restoration; online profile read/edit; request-only deactivation endpoint; pending-request feedback on profile/home; duplicate-request message; logout and network/Problem Details handling. Member 1's database version 2 migration added `user_profile` (`nic`, display/first/last names, email, phone, address, account status, deactivation-request flag and last-sync epoch); the shared helper is now version 3 after Member 2's independent station-reference addition. Login and every successful profile fetch/update replace the profile cache with the authoritative response. Profile opening still performs one normal API request; on connection/server failure it displays the latest cache with a localized offline/last-synchronized notice, or a friendly reconnect message if no cache exists. Offline editing is not queued or falsely saved. Explicit logout, expired sessions and unauthorized responses clear the session and protected caches. The Grid Operator home is a foundation, not the completed operator workflow.

### Remaining Member 1 work

- Verify real Android login, registration→pending→Backoffice activation→login, rejected resubmission, role denial, deactivation request/relogin and post-admin-deactivation behavior on a device against the deployed API. A prior generic mobile login error was reported; source changes/build checks do not prove the environment is fixed.
- Run emulator/device checks for the SQLite v1-to-v2 migration, login population, offline read, last-sync notice, failed offline edit, logout clearing and account switching; capture redacted database evidence. Source/build checks alone do not prove these runtime outcomes.
- Run and retain complete identity HTTP/Postman, MongoDB and client screenshots; review Android lint warnings and lifecycle/error UX.
- Verify `.cs` header blocks and method-opening comments across **all** C# files, not only Member 1 files; prepare honest individual contribution/challenge evidence.

**Member 1 conclusion:** broad three-layer implementation exists and the profile reference-cache scope is now implemented; hosted/device/assessment proof remains open.

## 7. Member 2 - Microgrid Nodes and Energy Slots

### Planned responsibility

Own station and booking-slot models/collections, GPS/capacity/schedules/status, node deactivation guard, Web infrastructure management, Android nearby/map-based discovery and slot selection, tests and evidence. The repository README declares this owner as **IT22070012 - Navoda H.G.J**. The team must confirm that declaration against student records, commits and viva evidence.

### Completed backend work

- `solarStationInfo` and `energyBookingSlots` models/repositories, station and slot create/list/detail/update/status endpoints.
- GPS, capacity, operating-hour, overlap, energy and status validation; active-reservation guards; named/geospatial indexes.
- Station/slot service tests and role policies in source.

### Completed web work

- Backoffice station/slot create, edit, detail and status controls; Grid Operator read-only station/slot detail views plus slot availability/status control.
- Location picker, filters, error feedback, responsive cards **and newly added table/list toggles** on both shared pages. Cards remain default for both roles.

**Completed Android work:** the station screen preserves the list and adds an osmdroid `MapView` backed by OpenStreetMap tiles plus Play Services location. `DeviceLocationProvider` performs one current-location request rather than continuous tracking. Permission denied/permanently denied, disabled services and unavailable location have non-blocking fallbacks. With a usable location, Android calls `GET /api/stations?status=Active&nearLat=...&nearLng=...`; otherwise it calls `GET /api/stations?status=Active`. Markers use validated latitude/longitude, retain a safe station ID/code mapping and open API-derived station details before reusing the existing station-to-slots navigation. `SlotsFragment` displays the selected station context and continues using the live slot API and reservation contract. Google Maps dependencies, manifest key metadata and setup text remain, but no Java/XML screen currently imports or renders a Google Maps component.

SQLite database version 3 adds `grid_node_reference` to the existing shared helper through a non-destructive migration. It stores station ID/code, display/location/capacity/schedule/status fields and a local `lastSyncedAt` epoch. Successful station responses are upserted transactionally without deleting unrelated cached stations. Network/transport and 5xx failures may display cached active references through the same list and map with an offline/last-sync notice; 4xx/authentication errors do not masquerade as offline. No slot data is cached, and cached station selection still requires live slot retrieval. Session clearing also clears the protected station cache. The current APK assembles, but map rendering, location branches, SQLite migration and offline behavior were not exercised on a device in this audit.

### Remaining Member 2 work

- Restore a real Google Maps Android implementation, or obtain explicit lecturer approval for osmdroid/OpenStreetMap and record the approved deviation. Then verify tiles, markers, camera framing, real/coarse location and every permission/services fallback on an emulator and physical device.
- Verify SQLite v2-to-v3 migration preserves `session` and `user_profile`; inspect cache upserts, subset preservation, offline/no-cache UI, timestamp formatting and logout/expiry clearing with redacted device evidence.
- Verify the final authorization matrix over HTTP: Grid Operator can read stations/slots and patch slot status, but receives `403` for station create/update/status, slot create and slot detail update.
- Run station/slot hosted HTTP, overlap, reservation guard, location and actual device-selection scenarios; provide Atlas, browser and map screenshots.
- Add domain requests to the consolidated Postman collection and verify station/slot mobile DTOs against deployed responses.

**Member 2 conclusion:** API/Web, Android nearby map/list discovery and bounded station-reference caching exist in source. The slot-authority decision is implemented and policy-tested; the current map provider still does not satisfy the stated Google Maps requirement, and map/device/database/hosted evidence remains.

## 8. Member 3 - Reservation Workflow and Booking Dashboards

### Planned responsibility

Own reservation create/update/cancel, seven-day/twelve-hour rules, availability allocation, history/summary APIs, operational Web booking views, Android booking workflow/history/pending/search/dashboard counts, tests and evidence. The repository README declares this owner as **IT22217318 - Cassim T.S**. The team must confirm that declaration against student records, commits and viva evidence.

### Completed backend work

- Prosumer create/own-list/detail/update/cancel; staff list/approve/reject; staff and Prosumer dashboard-summary endpoints.
- Server-owned seven-day/twelve-hour, ownership, status, slot/station, capacity and conflict checks; conditional allocation/restoration.
- Reservation service tests in source. Final Atlas concurrency behavior has not been observed in this audit.

### Completed web work

- Backoffice/Grid Operator booking list, search/filter, details, approval/rejection and API-backed summary cards.
- Responsive operational feedback for loading, empty, validation and conflict cases.

**Completed Android work:** station/slot selection leads to a create-reservation form and confirmation dialog; My Bookings list, detail, requested-energy update and cancellation are coded through the central API. Update and cancellation now show post-action summaries using the returned authoritative reservation. This is more than the old identity-only assessment, but there is no independent successful device/API workflow evidence here.

The October 4 revision adds case-insensitive booking search, current/pending/history category views, empty-result feedback, and live Prosumer-home counts for pending and future approved reservations. The backend summary contract now calculates `approvedFutureCount` using a repository-side future-start predicate instead of treating every approved record as upcoming. The current backend suite includes coverage for this distinction.

### Remaining Member 3 work

- Validate create/update/cancel summary parsing, list/dashboard refresh and stale-state behavior on device against the deployed API.
- Run exact seven-day/twelve-hour boundaries, ownership/status conflicts, capacity competition and full booking lifecycle against final MongoDB/API.
- Capture Android/Web/dashboard screenshots, Postman cases and member-specific test/challenge evidence.

**Member 3 conclusion:** server/Web and the planned Android booking/search/category/count surfaces exist in source; action feedback consistency, live workflow proof and assessment evidence remain.

## 9. Member 4 - Operator Verification and Transactions

### Planned responsibility

Own secure QR issuance/validation, Grid Operator verification, final transfer/audit, transaction Web UI, Android operator scanner/result/finalization and operational map integration, tests and evidence. The repository README declares this owner as **IT22087324 - Gunathunga P.C.I**. The team must confirm that declaration against student records, commits and viva evidence.

### Completed backend work

- Opaque expiring QR token issuance for approved reservations; server stores a SHA-256 hash, not the raw token.
- Grid Operator verify/finalize endpoints, invalid/expired/replayed/duplicate-state protections, audit/detail response.
- MongoDB transaction for completion plus station battery-storage increment, with capacity validation; service/DTO tests exist.
- Post-plan QR renewal now accepts `QrIssued`, generates a new token and replaces the stored hash/expiry; the previous token then fails verification. This added branch lacks a direct unit test.

### Completed web work

- Grid Operator/Backoffice transaction views, status filtering, decoded-payload verification, detail and finalization dialogs, conflict/error feedback.
- Operator dashboard and existing station/reservation views. The Web verification panel accepts a payload; it is not a camera scanner.

**Completed Android source:** approved reservations can request a QR and render it; `QrIssued` reservations expose a regeneration action. The Grid Operator home opens a ZXing camera scanner, sends decoded reservation/token fields to the verify endpoint, shows the verified reservation, validates actual energy/note, calls finalize, and presents success/error dialogs. Camera permission and navigation entries are present, and the current debug APK assembles.

### Remaining Member 4 work

- Remove raw QR payload/token persistence from `qr_cache`; keep it only in memory or obtain a fresh server-issued payload, and ensure logout/account switching/backup cannot retain it. Reuse the stricter `QrPayload` parser rather than the weaker UI-local parser.
- Add focused tests for QR renewal/old-token invalidation, Android payload validation, verification/finalization input and status/error paths. The existing 123 backend tests predate direct coverage of renewal, and no Android scanner/transaction tests were found.
- Resolve the operational-map responsibility with Member 2. The Grid Operator Android home currently provides scanning but no operator station map, while the shared Prosumer map uses the wrong provider for the assignment.
- Prove camera permission, valid/invalid/expired/replay/duplicate/unauthorized cases and actual MongoDB transaction/rollback on final Atlas/IIS setup; collect QR, scanner and audit evidence without exposing tokens.

**Member 4 conclusion:** backend, Web and core Android QR/scanner/finalization source now exist. Security remediation, automated coverage, map ownership and hosted/device transaction proof remain, so the domain is not complete.

## 10. React Web Status

Implemented: public home/login; Backoffice and Grid Operator dashboards; protected role routes; staff/Prosumer management; pending activation queue; deactivation-request dashboard/list/detail feedback; stations/slots with card-default/list-table toggle; reservations; transaction verification/finalization; profile/security; shared Tailwind visual system, controls, responsive shell and reduced-motion styling. The Web login sends `clientType: Web` and Prosumer Web access is blocked rather than routed to a Prosumer dashboard. Some legacy Prosumer page source may remain, but is not an intended current Web route.

The full Web checks were rerun on 2026-10-05: 12/12 tests passed, the production build passed, and lint completed with zero errors and one warning. The warning is the existing missing `fetchReservations` dependency in `Reservations.jsx`; it remains technical debt rather than a clean-lint result.

Still required: authenticated cross-role browser matrix; tested API success/error paths; desktop/tablet/mobile-Web overflow and accessibility checks; confirm energy-flow animation behavior in Edge/Opera and reduced-motion settings; final unique screenshots. A passing Vite build does not demonstrate those outcomes.

## 11. Android, SQLite, Maps and QR Status

Implemented native Java/XML, AndroidX Navigation, a central asynchronous `HttpURLConnection` client, Gson envelopes/errors, bearer tokens, Play Services location, an osmdroid/OpenStreetMap station map and SQLite database version 3. SQLite retains the session and bounded authenticated-profile cache and adds bounded grid-node reference caching. Login explicitly identifies Android. The identity UI supports registration, online profile updates, offline read-only profile fallback, account status and deactivation-request feedback; Prosumer pages include map/list station discovery, station details, live slots, booking workflows and QR rendering. The Grid Operator flow includes camera scanning, server verification and finalization. The app is configured to `http://10.0.2.2:5080/` for an emulator, **not** a hosted IIS URL or a physical-device host. Google Maps dependency/key metadata remains configured but is not the map implementation used by the current screen.

| Mobile requirement | Current state | Gap |
| --- | --- | --- |
| Login/role routing | Source implemented | Live device/hosted matrix and generic-login-error investigation |
| Prosumer registration/profile | Source implemented | Activation/rejection/resubmission device demonstration |
| Deactivation request | Correct endpoint and pending feedback in source | Confirm saved request and Backoffice visibility against same database |
| SQLite | Session token/role/name/expiry plus API-derived user profile and grid-node references with sync times; incremental v1-v2-v3 creation/migration | Emulator/device migration, offline/no-cache/clearing and redacted inspection evidence |
| Offline profile | Server-first fetch, cache refresh on success, read-only cache fallback on availability failures | Runtime airplane-mode/API-outage and no-cache screenshots |
| Station/slot discovery | osmdroid/OpenStreetMap plus retained list, single location request, nearby query, markers/details, cached-reference fallback and existing slot selection | Does not meet the stated Google Maps requirement; provider decision and device/location/offline proof needed |
| Reservation actions | Create/update/cancel, details and post-action summary source | Hosted action/boundary, refresh and device tests |
| Booking views | Search, current/pending/history categories, empty results and live pending/approved-upcoming dashboard counts in source | Device/API proof and UX verification after mutations |
| Prosumer QR | Issue/render/expiry/regenerate source exists | Raw QR/token is persisted in SharedPreferences; remove persistence and test expiry/renewal |
| Operator mode | ZXing camera scan, verify, finalize and result-dialog source exists | No operator map, transaction tests, camera/device or hosted-API proof |

On October 5 the current debug APK assembled successfully. The JVM suite ran 9 tests with 8 passing and one `ApiErrorHandlerTest` failure: the handler exposes a server `detail` string while the test expects it to be hidden. This remains a security/error-contract issue. No current lint run, instrumentation test, emulator/device test, map rendering test, GPS branch test, SQLite migration/fallback inspection, camera test or hosted-API test was completed. No automated Android test covers QR rendering, payload parsing, renewal, camera scanning, verification or finalization.

## 12. Database Status

The four server collection models, repositories and named indexes exist. NIC/email, station/slot codes, GeoJSON station coordinates, reservation references and QR hash are represented in source. A `2dsphere` station index exists, although the current nearby endpoint loads status-filtered stations and applies approximate squared-coordinate sorting in the service rather than a radius-limited MongoDB query. Transaction/audit fields remain in reservations to maintain four collections. Android SQLite stores one authenticated session, one cached profile and cached grid-node references. Profile/station rows are display/reference data only; they never authorize access or replace server authority for account status, station activity, slot availability, bookings, QR validity or transaction state. However, the new non-SQLite `qr_cache` SharedPreferences stores the raw QR payload/token by reservation ID and is not cleared by the normal logout path; backup rules exclude only the SQLite database. This sensitive persistence is outside the approved local-data scope and must be removed.

Pending: verify final Atlas documents/indexes with redacted examples; check uniqueness/geo behavior; prove competing allocation and multi-document transaction rollback on the chosen Atlas tier; configure least-privilege credentials/allow-list and rotate demonstration secrets. The report should never include passwords, full JWTs or raw QR tokens.

## 13. Testing and Verification Record

| When/source | Check | Result and limitation |
| --- | --- | --- |
| 2026-09-30 earlier audit | Backend full suite | 113 passed; not rerun for today's source |
| 2026-09-30 earlier audit | Web tests/lint/build | 12 passed; lint 0 errors/1 warning; build passed |
| 2026-09-30 earlier audit | Android tests/build/lint | 7 JVM tests passed; APK built; 23 lint warnings |
| Recent Member 1 correction | Android `assembleDebug` and Java compile | Passed; no device/server data proof |
| 2026-10-03 Member 1 profile cache | Android `assembleDebug` and final Java compile | Passed; 9 JVM tests ran, 8 passed and the existing API-detail sanitization test failed; no emulator/SQLite proof |
| 2026-10-02 station/slot UI change | Targeted ESLint and Vite build | Passed; no browser interaction proof |
| 2026-10-04 report refresh | Web tests/lint/build | 12/12 tests passed; production build passed; lint reported 0 errors and the existing `Reservations.jsx` hook-dependency warning |
| 2026-10-04 report refresh | Backend test attempt | Could not run in the restricted environment because MSBuild could not write a temporary `obj` file; this is not a product test failure |
| 2026-10-04 report refresh | Initial restricted Android build attempt | Could not download Gradle inside the restricted environment; later focused reruns with dependency access passed as recorded below |
| 2026-10-04 Member 2 Maps/location | Focused Android Java compilation and `assembleDebug` | Passed; no real Maps key, emulator/device, GPS or marker interaction proof |
| 2026-10-04 Member 2 station cache | Focused Android Java compilation, `assembleDebug`, `git diff --check` | Passed; migration, SQLite contents, offline fallback and clearing require runtime inspection |
| 2026-10-04 current repository audit | Backend full suite | 123/123 passed; unit/controller/service evidence only, not live MongoDB or hosted HTTP proof |
| 2026-10-04 current repository audit | Web tests/lint/build | 12/12 passed; production build passed; lint 0 errors/1 existing hooks-dependency warning |
| 2026-10-04 current repository audit | Android unit tests and debug APK | APK assembled; 8/9 JVM tests passed; `ApiErrorHandlerTest` failed because raw server detail is exposed |
| 2026-10-05 Grid Operator slot boundary | Backend full suite | 136/136 passed; endpoint policies enforce read-only station/slot details plus shared slot-status control; no live MongoDB/IIS calls and no direct QR-renewal test |
| 2026-10-05 current repository audit | Web tests/lint/build | 12/12 passed; production build passed; lint 0 errors/1 existing hooks-dependency warning |
| 2026-10-05 current repository audit | Android unit tests and debug APK | APK assembled; 8/9 JVM tests passed; no transaction/scanner tests; `ApiErrorHandlerTest` still fails |

Evidence still required: all-domain Postman and negative/auth/role cases; complete register→activate→book→approve→QR→scan→finalize lifecycle; exact boundary/timezone, reservation deactivation and concurrent allocation tests; actual Android emulator/physical device, browser, SQLite and Atlas records; IIS-hosted smoke and both-client calls. Record dates, environment, versions and redacted results so “tested” has a reproducible meaning.

## 14. Deployment Status

Docker/Compose, `.env.example`, health endpoints and local emulator API configuration exist. These are development aids and do not satisfy the IIS requirement. No repository proof establishes an IIS site, ASP.NET Core Hosting Bundle/app-pool configuration, HTTPS binding, production CORS, Atlas connection, or Web/Android use of a common hosted API.

Required sequence: publish API for Windows; configure Hosting Bundle, IIS site/app pool, HTTPS, secrets/CORS and least-privilege Atlas access; verify health and role-protected endpoints; configure Web and Android URLs; test both clients and capture redacted deployment evidence. Do not treat a Docker health check as IIS evidence.

## 15. Documentation and Evidence Status

Present: requirements/decision logs, architecture/use-case/DFD diagrams, MongoDB design, API contracts, traceability/change register, Member 1/2 backend notes, Member 1/4 Web notes, Android setup guidance and an identity-only Postman collection. This progress report records the current source-level assessment; it is not the final assessed report. The root README now declares the four student IDs/names, but those declarations still require commit/student verification and should not be treated as independent authorship proof.

Missing or needing review: Member 3/4 backend notes; all-domain Postman; IIS runbook/evidence; unique screenshots of all UIs; source-code excerpts as **text**; exact references; Git history mapped to verified students; authentic individual contributions/challenges; README video link (maximum five minutes); submission screenshot/ZIP naming. The current Android setup text was stale about Google Maps and did not describe QR/scanner/token handling accurately before this audit. For the PDF page-4 code-comment gate, **33 of 80** current `.cs` files do not begin with a comment/header; method-opening comments still need a separate manual review. Page-6 AI-use restrictions require truthful disclosure and independent student-authored implementation/report work; no evidence or personal reflection should be fabricated.

## 16. Requirements Readiness Summary

| Requirement group | Coverage | Blocking gap |
| --- | --- | --- |
| Central API/FAT Service | Code implemented | IIS/hosted proof and complete authorization matrix |
| MongoDB/four collections | Models/indexes implemented | Atlas/sample data, concurrency and rollback proof |
| Identity/account lifecycle | Backend/Web/Android source substantially aligned; SQLite profile cache implemented | Live device/backend/database and cache-isolation demonstration |
| Stations/slots | Backend/Web plus Android map/list/details, nearby ordering and station-reference fallback; Grid Operator slot-status boundary implemented | Replace/approve non-Google map provider and provide hosted role/device/cache proof |
| Reservations | Backend/Web plus Android actions, summaries, search/categories and live dashboard counts | Boundary/E2E/device proof and refresh validation |
| QR/transactions | Backend/Web/Android source implemented | Remove persisted raw token, add renewal/mobile tests and provide camera/Atlas/IIS transaction proof |
| Web UX | Broad, buildable; card/list options | Browser/accessibility/hosted matrix and screenshots |
| Native Android/SQLite | Partial; all four domains have source and the APK assembles | Google Maps non-compliance, raw-token persistence, one failing JVM test and absent device/cache/camera evidence |
| IIS | Not evidenced | Deployment and two-client reachability |
| Final assessment | Partial engineering docs | Student-authored report, screenshots, video, code comments and verified contributions |

## 17. Prioritized Completion Plan

### Priority 0 - Start the required Android application

The Android app is **already started**; retain the original heading for continuity but finish the missing assessed scope:

1. Reproduce Member 1 identity/activation/request lifecycle against the same deployed API/DB on a device; validate SQLite migration, offline fallback and account isolation.
2. Replace osmdroid with the required Google Maps implementation, or obtain explicit lecturer approval for the deviation; then runtime-verify nearby station details/location fallbacks and SQLite v2-to-v3/offline behavior.
3. Verify Member 3 pending/current/history/search/dashboard counts, post-action summaries and create/update/cancel boundaries on device.
4. Remove raw QR/token SharedPreferences persistence, use the strict payload parser, clear any legacy cache, and add QR renewal/scanner/transaction tests.
5. Run the complete Android register→book→QR→scan→finalize journey against the same secure hosted API and database.

### Priority 1 - Complete integration verification

1. Verify the implemented Grid Operator read-only-detail/slot-status boundary over hosted HTTP and resolve the rubric's delete/soft-deactivation wording.
2. Build one chained, all-domain Postman collection and run positive/negative/role cases on final MongoDB.
3. Prove concurrent approvals, reservation-aware deactivation, QR renewal/old-token invalidation, expiry/replay and transaction rollback.
4. Fix the Android error-sanitization contract, re-run full backend/Web/Android checks, triage lint warnings and complete the `.cs` comment review.
5. Perform authenticated browser, accessibility, Android emulator/physical-device and SQLite inspections.

### Priority 2 - Deploy on IIS

1. Publish/configure the API with HTTPS, secrets, CORS and Atlas.
2. Point React and Android at the hosted service and verify complete user journeys.
3. Capture redacted IIS/health/role/API and client-connectivity proof.

### Priority 3 - Assemble assessment evidence

1. Capture unique UI, Maps, QR, MongoDB, SQLite, IIS and failure-state screenshots.
2. Complete current diagrams, database/API explanations, references and code excerpts as text.
3. Have each member independently verify and write their true contributions, decisions, challenges and AI-use disclosure; retain commits and viva explanations.
4. Add repository/video links to README; prepare the report and correctly named ZIP with opening-screen screenshot.

## 18. Final Readiness Decision

**Not submission-ready on repository evidence.** The API and Web implementation are broad, and Android now contains source for identity, offline profile/station-reference caching, map/list discovery, reservation workflows, QR display, camera verification and finalization. Member 4's earlier source gap is therefore closed, but the implementation currently persists the raw QR token, uses osmdroid/OpenStreetMap where the assignment calls for Google Maps, lacks mobile transaction tests/device proof, and has one failing JVM test. IIS deployment, a shared hosted end-to-end run and reproducible final assessment evidence are also absent. Automated/source evidence must not be converted into claims of complete live workflows. The four students must validate the final implementation and author their own assessed contribution/report material under the PDF's AI Planning Level 2 rules.
