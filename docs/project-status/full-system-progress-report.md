# Full System Progress and Completion Report

Audit date: 2026-10-05

Project: Smart Solar Microgrid Trading System

Scope: Current repository against the original four-member plan and SE4040 assignment brief

Audited source baseline: branch `feature/member1-identity`, commit `6a0f581` (documentation changes from this audit excluded)

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
| Operator verification/maps | 7 individual | Android QR scan/verify/finalize and a Grid Operator station map/list/details path exist; the map still uses osmdroid/OpenStreetMap rather than required Google Maps, and device proof is absent |
| Integration/SQLite/device | 12 individual | API clients, SQLite session/profile/station-reference persistence, transient-only QR handling, map and scanner source exist; IIS and device integration evidence remain blockers |

## 2. Executive Conclusion

The project has a substantial central API and React implementation and a native Android client spanning all four member domains, but **the full assignment is not complete or independently demonstrated**. Android now includes Prosumer station map/list discovery, station details, live slot selection, reservation creation, searchable current/pending/history booking views, live dashboard counts, approved-booking QR rendering, camera scanning, server verification/finalization and a read-only Grid Operator station map/list/details path. Phase 4C removed raw QR persistence, standardized Android on the strict `QrPayload` parser, sanitized raw server details, and added renewal and parser tests. The principal remaining gaps are Google Maps compliance, real device/browser/Atlas/IIS/end-to-end proof, final assessment evidence and C# comment compliance.

Post-plan Member 1 changes are implemented in source: Web and Android pass a login `clientType`; public Prosumer registration is `Pending`; Backoffice can activate/reject; a rejected NIC may resubmit into the same record; Prosumer self-service records a deactivation **request** while status stays `Active`; Backoffice alone administratively deactivates/reactivates. The React activation and deactivation-request views and Android request feedback are now present. The old report's statements that the clients still need these contracts were stale.

Member 1's Android persistence is implemented: database version 2 retained the original `session` table and added a single-account `user_profile` cache populated from login, successful `/api/users/me` reads and successful profile updates. The Profile screen remains server-first and falls back to timestamped cached data only for availability failures. Offline profile edits are not queued or falsely saved. Passwords, duplicate JWTs and server-only fields are not cached.

Member 2 subsequently advanced the same shared database to version 3 through a non-destructive v2-to-v3 migration and added `grid_node_reference`. Successful active-station responses are upserted with a local synchronization timestamp; location-based responses do not delete unrelated cached rows. On network/transport or 5xx station failures, the map/list can display cached references with an explicit offline/last-synchronized notice. Normal 4xx/authentication errors retain the normal error/session path. Cached station data is never used for slot availability or reservations: selecting a cached station still opens the live slot API flow. Logout, expiry and unauthorized-session clearing remove the session, profile and station-reference rows. These caches are bounded display/reference stores, not offline business authority. The current map widget and controller are osmdroid-based even though Google Maps dependencies/key configuration remain in the project and the assignment specifically names Google Maps.

Member 4's later Android integration adds a Prosumer QR screen and renewal action, ZXing camera scanner, Grid Operator verification form, final transfer confirmation, safe error messages and a read-only operator station map. Phase 4C removed `BookingDetailsFragment` QR persistence and clears legacy `qr_cache` preferences at application startup without changing session/SQLite data. Issued QR data remains only in the active Fragment; scanned data is parsed and passed once through `EphemeralQrPayloadStore`, never a persisted navigation argument. Both display and scan paths use the canonical strict `QrPayload` parser. Focused backend tests now prove that reissuing from `QrIssued` replaces the stored SHA-256 hash, rejects the old token, accepts the new token, preserves ownership and rejects invalid states.

The team has now resolved the assignment's Grid Operator slot-availability rule: Grid Operators have read-only station and slot details, may change slot availability/status, and may not edit station data or slot schedule/capacity/price. The shared Backoffice/Grid Operator Web dialog presents the four predefined backend statuses in a dropdown, enabling only the manual `Available` and `Unavailable` targets while keeping `Reserved` and `Expired` visible as disabled, server-managed states. The API independently rejects invalid/system-managed targets, unchanged transitions, active-reservation conflicts and attempts to reopen ended slots. Backoffice retains station/slot creation and detail-edit authority.

| Area | Status and principal gap |
| --- | --- |
| Requirements/architecture | Documented; team sign-off and current diagrams/evidence review still needed |
| Backend | Four domains implemented; final live MongoDB, concurrency, rollback and security proof missing |
| React web | Broad role-based experience, including activation queue and station/slot card-list toggles; hosted/browser matrix missing |
| Native Android | All four domains have source/UI coverage, including transient QR/scanner/finalization and operator map/list/details; Google Maps compliance and runtime proof remain missing |
| MongoDB/SQLite | Four server collections plus Android `session`, `user_profile` and `grid_node_reference` tables; migration/device inspection evidence remains |
| IIS | No demonstrated IIS-hosted API or both-client integration |
| Assessment package | Full-system Postman artifact exists; final-environment run/export, screenshots, video, verified contributions and final report remain missing |

## 3. Current Architecture and Repository Evidence

The repository has React/Router/Axios/Tailwind on web; native Java/XML, AndroidX Navigation, Material Components, Gson and SQLite on Android; ASP.NET Core controllers/services/repositories with JWT, BCrypt, role policies, active-account checks, Problem Details and MongoDB on the server. Both clients call the API rather than MongoDB directly. The server models `users`, `solarStationInfo`, `energyBookingSlots` and `energyReservations`; QR and transaction audit fields are embedded in reservations. Docker/Compose and health endpoints support local development, not IIS proof.

| Artifact | Current evidence | Confidence/limitation |
| --- | --- | --- |
| Identity API | `UsersController`, `IdentityService`, user repository/models and identity tests | Source-verified; final hosted calls not rerun in this audit |
| Station/slot API | Controllers/services/repositories, geospatial/index and validation code | Source-verified; live rule and role matrix need proof |
| Reservation/dashboard API | Reservation and dashboard controllers/services, capacity/status rules | Source-verified; real MongoDB concurrency proof missing |
| QR/transaction API | Issue/reissue, verify/finalize endpoints, token/hash and transaction code | Source and focused renewal/old-token/new-token tests verified; real MongoDB transaction rollback proof is missing |
| React | Role routes; account, station, slot, reservation and transaction pages | Source-verified; current browser matrix not run |
| Android | Login/profile, location-aware station map/list/details for Prosumer and Grid Operator, reservation workflows, transient QR rendering, camera scanning, verification and finalization | Source/build/test-verified; uses osmdroid instead of required Google Maps and lacks device/API proof |
| SQLite | Shared `SessionDatabaseHelper`, `SessionManager`, `UserProfileCache`, `GridNodeReferenceCache` | Session plus API-derived profile/station caches implemented; v1-v2-v3 migration/device inspection not yet demonstrated |
| Postman | Importable 73-request full-system collection plus the earlier identity-only collection | Final-environment collection run and redacted result export remain absent |
| Deployment | Docker files, `.env.example`, emulator development URL | IIS hosting not evidenced |

Current verification on 2026-10-05: backend 145/145 tests passed, including Grid Operator slot-policy/status coverage and QR issue/renewal/old-token/new-token/ownership/state coverage; Web 12/12 tests and production build passed, with zero lint errors and one existing hooks-dependency warning; Android 12/12 JVM tests passed and the debug APK assembled. The Android total includes `ApiErrorHandlerTest` and focused canonical-parser/ephemeral-store tests. These automated checks do not establish live MongoDB, browser, map tiles/location, camera, emulator/device or IIS behavior.

## 4. Progress by Planned Phase

| Planned phase | Completed in repository | Still pending |
| --- | --- | --- |
| Phase 1: requirements/foundation | Roles, ownership, use cases, diagrams, collection design, UI/evidence checklist and traceability | Four-member review/sign-off; update final artifacts to actual implementation and PDF wording |
| Phase 2: architecture/contracts | Central API, MongoDB, JWT/error conventions, four domain contracts, change register, finalized Grid Operator slot boundary and bounded Android profile/station caching | Confirm soft-delete interpretation; finish contract reconciliation and sign-off |
| Phase 3: backend core | Identity, infrastructure, reservation/dashboard and transaction domains; current 145-test backend suite passes | Hosted HTTP matrix and real MongoDB concurrency/transaction evidence |
| React web | Public home, role workspaces, account/activation, station/slot, reservation and transaction UI | Final role/browser/responsive/hosted verification and screenshots |
| Native Android | Shared API/session, cached profile/station fallback, identity, location/map discovery for both roles, booking workflows, transient QR display, camera scan, verify/finalize and focused parser/error tests | Replace/justify osmdroid against Google Maps; add broader transaction/UI tests and device/E2E proof |
| Deployment | Docker/local setup and health endpoints | Secure IIS/HTTPS/Atlas deployment and both-client connectivity |
| Testing/report | Unit/helper tests and a generated all-domain Postman collection | Execute/export the collection against the final environment; complete E2E/device/Atlas/IIS evidence, final student-authored report and video |

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
| QR/finalization | Opaque expiring QR token, stored server-side hash, tested token rotation from `QrIssued`, transient-only Android handling, verify then transactional completion/storage increment | Prove expiry/replay and multi-document rollback against final Atlas/IIS environment |
| Map provider | Assignment/plan require Google Maps; current Android station UI imports osmdroid and renders an OpenStreetMap `MapView` | Replace with Google Maps or obtain and document lecturer approval for the divergence; remove stale Google Maps claims/dependencies as appropriate |
| Android local data | SQLite v3 stores one session, one API-derived authenticated profile and API-derived grid-node references with local sync timestamps; QR tokens are excluded from SQLite and persistent caches | Inspect v1-to-v2-to-v3 migration, offline/no-cache behavior, legacy `qr_cache` cleanup and clearing on a real emulator/device |

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

**Completed Android work:** native registration/login sends `clientType: Android`; Prosumer/Grid Operator role homes; SQLite session restoration; online profile read/edit; request-only deactivation endpoint; pending-request feedback on profile/home; duplicate-request message; logout and safe network/Problem Details handling. Member 1's database version 2 migration added `user_profile` (`nic`, display/first/last names, email, phone, address, account status, deactivation-request flag and last-sync epoch); the shared helper is now version 3 after Member 2's independent station-reference addition. Login and every successful profile fetch/update replace the profile cache with the authoritative response. Profile opening still performs one normal API request; on connection/server failure it displays the latest cache with a localized offline/last-synchronized notice, or a friendly reconnect message if no cache exists. Offline editing is not queued or falsely saved. Explicit logout, expired sessions and unauthorized responses clear the session and protected caches. `ApiErrorHandler` now retains status/error code but maps user-visible messages safely instead of exposing arbitrary server `detail`.

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

- Backoffice station/slot create, edit, detail and status controls; Grid Operator read-only station/slot detail views plus the shared predefined slot-availability dropdown. Manual selection is limited to `Available`/`Unavailable`; server-managed `Reserved`/`Expired` remain disabled.
- Location picker, filters, error feedback, responsive cards **and newly added table/list toggles** on both shared pages. Cards remain default for both roles.

**Completed Android work:** the shared station screen preserves the list and adds an osmdroid `MapView` backed by OpenStreetMap tiles plus Play Services location. `DeviceLocationProvider` performs one current-location request rather than continuous tracking. Permission denied/permanently denied, disabled services and unavailable location have non-blocking fallbacks. With a usable location, Android calls `GET /api/stations?status=Active&nearLat=...&nearLng=...`; otherwise it calls `GET /api/stations?status=Active`. Markers use validated latitude/longitude, retain a safe station ID/code mapping and open API-derived station details. Prosumer mode retains station-to-slot navigation; the Grid Operator home now opens the same infrastructure in read-only mode, where map/list selection shows station details without entering reservation actions. Google Maps dependencies/key metadata remain, but the rendered provider is still osmdroid/OpenStreetMap.

SQLite database version 3 adds `grid_node_reference` to the existing shared helper through a non-destructive migration. It stores station ID/code, display/location/capacity/schedule/status fields and a local `lastSyncedAt` epoch. Successful station responses are upserted transactionally without deleting unrelated cached stations. Network/transport and 5xx failures may display cached active references through the same list and map with an offline/last-sync notice; 4xx/authentication errors do not masquerade as offline. No slot data is cached, and cached station selection still requires live slot retrieval. Session clearing also clears the protected station cache. The current APK assembles, but map rendering, location branches, SQLite migration and offline behavior were not exercised on a device in this audit.

### Remaining Member 2 work

- Restore a real Google Maps Android implementation, or obtain explicit lecturer approval for osmdroid/OpenStreetMap and record the approved deviation. Then verify tiles, markers, camera framing, real/coarse location and every permission/services fallback on an emulator and physical device.
- Verify SQLite v2-to-v3 migration preserves `session` and `user_profile`; inspect cache upserts, subset preservation, offline/no-cache UI, timestamp formatting and logout/expiry clearing with redacted device evidence.
- Verify the final authorization matrix over HTTP: Grid Operator can read stations/slots and patch slot status, but receives `403` for station create/update/status, slot create and slot detail update.
- Run station/slot hosted HTTP, overlap, reservation guard, location and actual device-selection scenarios; provide Atlas, browser and map screenshots.
- Run the consolidated Postman station/slot requests against the deployed API and verify the mobile DTOs against those responses.

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
- Post-plan QR renewal accepts `QrIssued`, generates a new token and replaces the stored hash/expiry; focused tests prove the previous token fails, the new token succeeds, ownership remains enforced and invalid states are rejected.

### Completed web work

- Grid Operator/Backoffice transaction views, status filtering, decoded-payload verification, detail and finalization dialogs, conflict/error feedback.
- Operator dashboard and existing station/reservation views. The Web verification panel accepts a payload; it is not a camera scanner.

**Completed Android source:** approved reservations can request a QR and render it; `QrIssued` reservations expose regeneration. The raw payload is held only in Fragment/process memory, legacy `qr_cache` preferences are cleared at startup, and no token is added to SQLite or logs. QR display and scanning share the strict `QrPayload` parser; the scanner uses a single-consume in-memory handoff instead of a saved `Bundle`. The Grid Operator home opens both the ZXing scanner and the shared read-only station map/list/details view. Verification, actual-energy/note confirmation, finalization and safe success/error dialogs are present. The current debug APK assembles and focused parser/store/error tests pass.

### Remaining Member 4 work

- Validate on a real upgrade/device that legacy `qr_cache` is cleared, process death requires safe regeneration, and no backup/SQLite/log path retains a raw token.
- Add broader Android scanner/verification/finalization UI tests. Current focused Android coverage validates payload structure, single-use memory handoff and error sanitization, but not camera or Fragment interaction.
- Replace the shared osmdroid/OpenStreetMap implementation with Google Maps, or obtain explicit lecturer approval for the provider deviation; the operator map capability itself now exists.
- Prove camera permission, valid/invalid/expired/replay/duplicate/unauthorized cases and actual MongoDB transaction/rollback on final Atlas/IIS setup; collect QR, scanner and audit evidence without exposing tokens.

**Member 4 conclusion:** backend, Web and Android QR/scanner/finalization/operator-map source exist; the critical persistence/parser/error gaps and renewal-test gap are resolved. Google Maps compliance, broader UI/device coverage and hosted transaction/rollback evidence remain.

## 10. React Web Status

Implemented: public home/login; Backoffice and Grid Operator dashboards; protected role routes; staff/Prosumer management; pending activation queue; deactivation-request dashboard/list/detail feedback; stations/slots with card-default/list-table toggle; reservations; transaction verification/finalization; profile/security; shared Tailwind visual system, controls, responsive shell and reduced-motion styling. The Web login sends `clientType: Web` and Prosumer Web access is blocked rather than routed to a Prosumer dashboard. Some legacy Prosumer page source may remain, but is not an intended current Web route.

The full Web checks were rerun on 2026-10-05: 12/12 tests passed, the production build passed, and lint completed with zero errors and one warning. The warning is the existing missing `fetchReservations` dependency in `Reservations.jsx`; it remains technical debt rather than a clean-lint result.

Still required: authenticated cross-role browser matrix; tested API success/error paths; desktop/tablet/mobile-Web overflow and accessibility checks; confirm energy-flow animation behavior in Edge/Opera and reduced-motion settings; final unique screenshots. A passing Vite build does not demonstrate those outcomes.

## 11. Android, SQLite, Maps and QR Status

Implemented native Java/XML, AndroidX Navigation, a central asynchronous `HttpURLConnection` client, Gson envelopes/errors, bearer tokens, Play Services location, an osmdroid/OpenStreetMap station map and SQLite database version 3. SQLite retains the session and bounded authenticated-profile cache and adds bounded grid-node reference caching. Login explicitly identifies Android. The identity UI supports registration, online profile updates, offline read-only profile fallback, account status and deactivation-request feedback; Prosumer pages include map/list station discovery, station details, live slots, booking workflows and transient QR rendering. The Grid Operator flow includes the shared read-only station map/list/details screen, camera scanning, canonical payload parsing, server verification and finalization. `ApiErrorHandler` preserves status/error code but never displays arbitrary Problem Details `detail`. The app is configured to `http://10.0.2.2:5080/` for an emulator, **not** a hosted IIS URL or a physical-device host. Google Maps dependency/key metadata remains configured but is not the map implementation used by the current screen.

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
| Prosumer QR | Issue/render/expiry/regenerate source; strict parser and transient-only Fragment memory; legacy `qr_cache` cleared | Device/process-death/upgrade proof and broader rendering/expiry UI tests |
| Operator mode | Shared read-only map/list/details, ZXing scan, single-use in-memory payload handoff, verify/finalize and result dialogs | Google Maps compliance, camera/map/device and hosted-API proof; broader Fragment tests |

On October 5 the current debug APK assembled successfully and all 12 JVM tests passed. `ApiErrorHandlerTest` confirms stable code/status retention with raw server `detail` hidden; `QrPayloadTest` covers the canonical structure, absence of local expiry authority, invalid structures and one-time in-memory consumption. No current Android lint, instrumentation, emulator/device, map rendering, GPS branch, SQLite migration/fallback, camera or hosted-API test was completed. Automated Android tests still do not exercise actual QR bitmap rendering, camera scanning, verification/finalization Fragments or device navigation.

## 12. Database Status

The four server collection models, repositories and named indexes exist. NIC/email, station/slot codes, GeoJSON station coordinates, reservation references and QR hash are represented in source. A `2dsphere` station index exists, although the current nearby endpoint loads status-filtered stations and applies approximate squared-coordinate sorting in the service rather than a radius-limited MongoDB query. Transaction/audit fields remain in reservations to maintain four collections. Android SQLite stores one authenticated session, one cached profile and cached grid-node references. Profile/station rows are display/reference data only; they never authorize access or replace server authority for account status, station activity, slot availability, bookings, QR validity or transaction state. Raw QR payloads/tokens are not persisted in SQLite, preferences or files; startup clears the obsolete `qr_cache` preference left by older installations.

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
| 2026-10-05 Grid Operator slot boundary and status validation | Backend full suite | 138/138 passed; endpoint policies enforce read-only station/slot details plus shared slot-status control, and service tests reject manual `Reserved`/`Expired` targets; no live MongoDB/IIS calls and no direct QR-renewal test |
| 2026-10-05 current repository audit | Web tests/lint/build | 12/12 passed; production build passed; lint 0 errors/1 existing hooks-dependency warning |
| 2026-10-05 current repository audit | Android unit tests and debug APK | APK assembled; 8/9 JVM tests passed; no transaction/scanner tests; `ApiErrorHandlerTest` still fails |
| 2026-10-05 Phase 4C and report refresh | Backend full suite | 145/145 passed; includes QR issue, renewal, old-token invalidation, renewed-token success, ownership and invalid-state coverage; no live MongoDB/IIS proof |
| 2026-10-05 Phase 4C and report refresh | Web tests/lint/build | 12/12 passed; production build passed; lint 0 errors/1 existing `Reservations.jsx` hook-dependency warning |
| 2026-10-05 Phase 4C and report refresh | Android JVM tests and debug APK | 12/12 passed and APK assembled; includes error sanitization and parser/ephemeral-store tests; no emulator/device/camera/map/API proof |
| 2026-10-05 full-system Postman artifact | Static collection validation | JSON parsed; 73 requests in six ordered folders; all 40 controller routes plus two health routes covered; embedded scripts compiled with 0 syntax errors; no saved QR-token variable; live workflow not executed |

Evidence still required: execute and export the generated all-domain Postman collection against the final environment; complete register→activate→book→approve→QR→scan→finalize device lifecycle; exact boundary/timezone, reservation deactivation and concurrent allocation tests; actual Android emulator/physical device, browser, SQLite and Atlas records; IIS-hosted smoke and both-client calls. Record dates, environment, versions and redacted results so “tested” has a reproducible meaning.

## 14. Deployment Status

Docker/Compose, `.env.example`, health endpoints and local emulator API configuration exist. These are development aids and do not satisfy the IIS requirement. No repository proof establishes an IIS site, ASP.NET Core Hosting Bundle/app-pool configuration, HTTPS binding, production CORS, Atlas connection, or Web/Android use of a common hosted API.

Required sequence: publish API for Windows; configure Hosting Bundle, IIS site/app pool, HTTPS, secrets/CORS and least-privilege Atlas access; verify health and role-protected endpoints; configure Web and Android URLs; test both clients and capture redacted deployment evidence. Do not treat a Docker health check as IIS evidence.

## 15. Documentation and Evidence Status

Present: requirements/decision logs, architecture/use-case/DFD diagrams, MongoDB design, API contracts, traceability/change register, Member 1/2 backend notes, Member 1/4 Web notes, Android setup guidance, the historical identity collection and a generated 73-request full-system Postman collection with a run guide. The full collection covers every current controller route plus role/validation and QR-renewal checks, but has not yet been executed against the final environment. This progress report records the current source-level assessment; it is not the final assessed report. The root README now declares the four student IDs/names, but those declarations still require commit/student verification and should not be treated as independent authorship proof.

Missing or needing review: Member 3/4 backend notes; a final-environment Postman run/export; IIS runbook/evidence; unique screenshots of all UIs; source-code excerpts as **text**; exact references; Git history mapped to verified students; authentic individual contributions/challenges; README video link (maximum five minutes); submission screenshot/ZIP naming. For the PDF page-4 code-comment gate, **33 of 81** current `.cs` files do not begin with a comment/header; method-opening comments still need a separate manual review. Page-6 AI-use restrictions require truthful disclosure and independent student-authored implementation/report work; no evidence or personal reflection should be fabricated.

## 16. Requirements Readiness Summary

| Requirement group | Coverage | Blocking gap |
| --- | --- | --- |
| Central API/FAT Service | Code implemented | IIS/hosted proof and complete authorization matrix |
| MongoDB/four collections | Models/indexes implemented | Atlas/sample data, concurrency and rollback proof |
| Identity/account lifecycle | Backend/Web/Android source substantially aligned; SQLite profile cache implemented | Live device/backend/database and cache-isolation demonstration |
| Stations/slots | Backend/Web plus Android map/list/details, nearby ordering and station-reference fallback; Grid Operator slot-status boundary implemented | Replace/approve non-Google map provider and provide hosted role/device/cache proof |
| Reservations | Backend/Web plus Android actions, summaries, search/categories and live dashboard counts | Boundary/E2E/device proof and refresh validation |
| QR/transactions | Backend/Web/Android source implemented; transient-only token handling and focused renewal/parser/error tests pass | Broader camera/UI tests and device/Atlas/IIS transaction proof |
| Web UX | Broad, buildable; card/list options | Browser/accessibility/hosted matrix and screenshots |
| Native Android/SQLite | Partial; all four domains have source, 12/12 JVM tests pass and the APK assembles | Google Maps non-compliance and absent device/cache/camera/hosted evidence |
| IIS | Not evidenced | Deployment and two-client reachability |
| Final assessment | Partial engineering docs | Student-authored report, screenshots, video, code comments and verified contributions |

## 17. Prioritized Completion Plan

### Priority 0 - Start the required Android application

The Android app is **already started**; retain the original heading for continuity but finish the missing assessed scope:

1. Reproduce Member 1 identity/activation/request lifecycle against the same deployed API/DB on a device; validate SQLite migration, offline fallback and account isolation.
2. Replace osmdroid with the required Google Maps implementation, or obtain explicit lecturer approval for the deviation; then runtime-verify nearby station details/location fallbacks and SQLite v2-to-v3/offline behavior.
3. Verify Member 3 pending/current/history/search/dashboard counts, post-action summaries and create/update/cancel boundaries on device.
4. Device-verify the completed transient QR handling, strict parser, legacy-cache cleanup and renewal behavior; add camera/Fragment-level transaction tests without persisting tokens.
5. Run the complete Android register→book→QR→scan→finalize journey against the same secure hosted API and database.

### Priority 1 - Complete integration verification

1. Verify the implemented Grid Operator read-only-detail/slot-status boundary over hosted HTTP and resolve the rubric's delete/soft-deactivation wording.
2. Run the generated chained, all-domain Postman collection on final MongoDB, resolve environment-specific failures and retain a redacted result export.
3. Prove concurrent approvals, reservation-aware deactivation, QR renewal/old-token invalidation, expiry/replay and transaction rollback.
4. Retain the fixed Android error-sanitization contract; triage the remaining Web hook warning, run Android lint and complete the `.cs` comment review.
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

**Not submission-ready on repository evidence.** The API and Web implementation are broad, and Android now contains source for identity, offline profile/station-reference caching, map/list discovery for both mobile roles, reservation workflows, transient QR display, camera verification and finalization. Phase 4C closed the raw-token persistence, parser consistency, renewal-test, error-sanitization and operator-map source gaps, and all current automated suites pass. A full-system Postman artifact now exists, but its final-environment run is not evidence yet. The remaining blockers are the explicit Google Maps requirement, IIS/common-host deployment, real Atlas/browser/device/camera/map/end-to-end proof, Postman execution evidence, C# comment compliance and the student-authored assessment package. Automated/source evidence must not be converted into claims of complete live workflows. The four students must validate the final implementation and author their own assessed contribution/report material under the PDF's AI Planning Level 2 rules.
