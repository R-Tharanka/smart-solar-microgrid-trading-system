# Full System Progress and Completion Report

Audit date: 2026-10-04

Project: Smart Solar Microgrid Trading System

Scope: Current repository against the original four-member plan and SE4040 assignment brief

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
| Client build/architecture | 12 group | Web and native Android exist; Android domain coverage and hosted integration incomplete |
| UI/UX | 6 group | Web is broad; Android has account, browsing and booking screens, but Maps/QR and final screenshot coverage are absent |
| Documentation/deployment | 5 group | Engineering docs exist; IIS and student-authored assessment package incomplete |
| Web features/business rules | 18 individual | Four domains have API/web surfaces; complete hosted/browser demonstration remains |
| Mobile authentication/accounts | 9 individual | Registration, login, profile, pending activation and deactivation-request code exist; device proof remains |
| Reservation workflow | 9 individual | API and Android create/update/cancel screens exist; live action-summary/boundary proof remains |
| Booking views/dashboards | 10 individual | API/staff web and a basic Android bookings list exist; mobile search, pending/history views and counts remain |
| Operator verification/maps | 7 individual | Transaction API/web tools exist; Android scanner and Google Maps remain |
| Integration/SQLite/device | 12 individual | API clients plus SQLite session and bounded user-profile cache exist; IIS, Maps, QR and device evidence remain |

## 2. Executive Conclusion

The project has a substantial central API and React implementation and a growing native Android client, but **the full assignment is not complete or independently demonstrated**. The strongest code coverage is backend plus web. Android now goes beyond identity: Prosumer station/slot browsing, reservation creation, booking list/detail, update and cancel screens are present. Nevertheless, Google Maps, booking dashboard/search/history presentation, approved-booking QR display, operator camera scanning/verification/finalization, and final hosted/device verification remain material gaps.

Post-plan Member 1 changes are implemented in source: Web and Android pass a login `clientType`; public Prosumer registration is `Pending`; Backoffice can activate/reject; a rejected NIC may resubmit into the same record; Prosumer self-service records a deactivation **request** while status stays `Active`; Backoffice alone administratively deactivates/reactivates. The React activation and deactivation-request views and Android request feedback are now present. The old report's statements that the clients still need these contracts were stale.

The latest Member 1 Android change also resolves the previously open SQLite reference-data question for the authenticated profile. Database version 2 retains the original `session` table and adds a single-account `user_profile` cache populated from login, successful `/api/users/me` reads and successful profile updates. The Profile screen remains server-first and falls back to timestamped cached data only for network, invalid-response or server-availability failures. Logout, expiry and unauthorized-session clearing remove both rows, preventing the next local account from seeing the previous profile. Passwords, duplicate JWTs and server-only fields are not cached. This is bounded display/reference caching, not offline authorization or offline writes.

The assignment's operational scenario says Grid Operators update battery-slot availability. The current dedicated slot-status API/UI remains Backoffice-only, although Grid Operators can edit general slot details. This is an unresolved requirement/authorization decision, not a completed operator capability.

| Area | Status and principal gap |
| --- | --- |
| Requirements/architecture | Documented; team sign-off and current diagrams/evidence review still needed |
| Backend | Four domains implemented; final live MongoDB, concurrency, rollback and security proof missing |
| React web | Broad role-based experience, including activation queue and station/slot card-list toggles; hosted/browser matrix missing |
| Native Android | Identity plus basic station/slot and booking flows; Maps, complete dashboards and QR/operator mode missing |
| MongoDB/SQLite | Four server collections plus Android `session` and API-derived `user_profile` tables; device/inspection evidence remains |
| IIS | No demonstrated IIS-hosted API or both-client integration |
| Assessment package | Final screenshots, all-domain Postman run, video, verified contributions and final report missing |

## 3. Current Architecture and Repository Evidence

The repository has React/Router/Axios/Tailwind on web; native Java/XML, AndroidX Navigation, Material Components, Gson and SQLite on Android; ASP.NET Core controllers/services/repositories with JWT, BCrypt, role policies, active-account checks, Problem Details and MongoDB on the server. Both clients call the API rather than MongoDB directly. The server models `users`, `solarStationInfo`, `energyBookingSlots` and `energyReservations`; QR and transaction audit fields are embedded in reservations. Docker/Compose and health endpoints support local development, not IIS proof.

| Artifact | Current evidence | Confidence/limitation |
| --- | --- | --- |
| Identity API | `UsersController`, `IdentityService`, user repository/models and identity tests | Source-verified; final hosted calls not rerun in this audit |
| Station/slot API | Controllers/services/repositories, geospatial/index and validation code | Source-verified; live rule and role matrix need proof |
| Reservation/dashboard API | Reservation and dashboard controllers/services, capacity/status rules | Source-verified; real MongoDB concurrency proof missing |
| QR/transaction API | Verify/finalize endpoints, token/hash and transaction code | Source-verified; actual scanner/transaction rollback proof missing |
| React | Role routes; account, station, slot, reservation and transaction pages | Source-verified; current browser matrix not run |
| Android | Login/profile, station/slot lists, reservation create/list/detail/update/cancel | Source-verified; map, QR and operator actions absent |
| SQLite | `SessionDatabaseHelper`, `SessionManager`, `UserProfileCache` | Session and API-derived profile cache implemented; migration/device inspection not yet demonstrated |
| Postman | Identity collection only | All-domain suite absent |
| Deployment | Docker files, `.env.example`, emulator development URL | IIS hosting not evidenced |

Recorded earlier verification (2026-09-30): backend 113/113 tests; web 12/12 tests, build, lint with one warning; Android 7 JVM tests, debug build and lint with 23 warnings. These are historical records, **not rerun totals for today's source**. Targeted later checks include a successful Android debug build/Java compile after the identity request correction and a successful web build plus lint on the station/slot card-list edits. No full-suite or live-system verification was performed for this report.

## 4. Progress by Planned Phase

| Planned phase | Completed in repository | Still pending |
| --- | --- | --- |
| Phase 1: requirements/foundation | Roles, ownership, use cases, diagrams, collection design, UI/evidence checklist and traceability | Four-member review/sign-off; update final artifacts to actual implementation and PDF wording |
| Phase 2: architecture/contracts | Central API, MongoDB, JWT/error conventions, four domain contracts and change register | Confirm disputed role rules and soft-delete interpretation; document final SQLite cache behavior |
| Phase 3: backend core | Identity, infrastructure, reservation/dashboard and transaction domains | Hosted HTTP matrix, real MongoDB concurrency/transaction evidence, current full-suite rerun |
| React web | Public home, role workspaces, account/activation, station/slot, reservation and transaction UI | Final role/browser/responsive/hosted verification and screenshots |
| Native Android | Shared API/session, cached profile fallback, identity, station/slot browsing and basic Prosumer reservations | Maps, complete booking views/counts, QR display, operator scan/finalization and device proof |
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
| Slot authority | General edit is staff-accessible; create/status endpoint is Backoffice-only | Resolve conflict with Grid Operator scenario |
| QR/finalization | Opaque expiring QR token, stored hash, verify then transactional completion/storage increment | Real Atlas transaction and replay/rollback proof needed |
| Android local data | SQLite v2 stores one session and one API-derived authenticated profile with `lastSyncedAt`; server remains authoritative | Inspect migration/offline/account-switch behavior on a real emulator/device; Member 2 still owns any future station reference cache |

See the change register for the decision IDs and client impact. Do not describe a deactivation request as a deactivated account or a `Pending` registration.

## 6. Member 1 - Identity, Authentication and Account Management

### Planned responsibility

Own user model/collection, staff roles, Prosumer NIC registration, login, authorization, profile and password changes, account lifecycle, Web role routing/user management, Android registration/login/profile/deactivation request, SQLite account persistence, tests and evidence. The earlier report associated this work with **Ruchira Tharanka** using branch history; actual personal authorship must be confirmed from student records and commits.

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

**Completed Android work:** native registration/login sends `clientType: Android`; Prosumer/Grid Operator role homes; SQLite session restoration; online profile read/edit; request-only deactivation endpoint; pending-request feedback on profile/home; duplicate-request message; logout and network/Problem Details handling. SQLite database version 2 adds `user_profile` (`nic`, display/first/last names, email, phone, address, account status, deactivation-request flag and last-sync epoch). Login and every successful profile fetch/update replace the cache with the authoritative response. Profile opening still performs one normal API request; on connection/server failure it displays the latest cache with a localized offline/last-synchronized notice, or a friendly reconnect message if no cache exists. Offline editing is not queued or falsely saved. Explicit logout, expired sessions and unauthorized responses clear both session and profile cache. The Grid Operator home is a foundation, not the completed operator workflow.

### Remaining Member 1 work

- Verify real Android login, registration→pending→Backoffice activation→login, rejected resubmission, role denial, deactivation request/relogin and post-admin-deactivation behavior on a device against the deployed API. A prior generic mobile login error was reported; source changes/build checks do not prove the environment is fixed.
- Run emulator/device checks for the SQLite v1-to-v2 migration, login population, offline read, last-sync notice, failed offline edit, logout clearing and account switching; capture redacted database evidence. Source/build checks alone do not prove these runtime outcomes.
- Run and retain complete identity HTTP/Postman, MongoDB and client screenshots; review Android lint warnings and lifecycle/error UX.
- Verify `.cs` header blocks and method-opening comments across **all** C# files, not only Member 1 files; prepare honest individual contribution/challenge evidence.

**Member 1 conclusion:** broad three-layer implementation exists and the profile reference-cache scope is now implemented; hosted/device/assessment proof remains open.

## 7. Member 2 - Microgrid Nodes and Energy Slots

### Planned responsibility

Own station and booking-slot models/collections, GPS/capacity/schedules/status, node deactivation guard, Web infrastructure management, Android nearby/map-based discovery and slot selection, tests and evidence. Earlier branch history associated this domain with **JinaNavo**; confirm the actual student identity and contribution.

### Completed backend work

- `solarStationInfo` and `energyBookingSlots` models/repositories, station and slot create/list/detail/update/status endpoints.
- GPS, capacity, operating-hour, overlap, energy and status validation; active-reservation guards; named/geospatial indexes.
- Station/slot service tests and role policies in source.

### Completed web work

- Backoffice station/slot create, edit, detail and status controls; Grid Operator shared station/slot read and permitted edit views.
- Location picker, filters, error feedback, responsive cards **and newly added table/list toggles** on both shared pages. Cards remain default for both roles.

**Completed Android work:** API-backed station list, station selection, slot list, adapters and navigation into reservation creation. This is a basic discovery/selection path, not a Maps implementation. It is not independently device-tested in this audit.

### Remaining Member 2 work

- Implement and verify Google Maps API integration, nearby nodes using real coordinates/location, markers and station details on selection. Source currently has no Maps SDK integration.
- Confirm with the team/lecturer whether Grid Operators must change slot availability status. Current API is Backoffice-only for the dedicated status endpoint, despite the PDF scenario.
- Run station/slot hosted HTTP, overlap, reservation guard, location and actual device-selection scenarios; provide Atlas, browser and map screenshots.
- Add domain requests to the consolidated Postman collection and verify station/slot mobile DTOs against deployed responses.

**Member 2 conclusion:** API/Web and basic Android lists exist; Maps, role decision and live evidence remain.

## 8. Member 3 - Reservation Workflow and Booking Dashboards

### Planned responsibility

Own reservation create/update/cancel, seven-day/twelve-hour rules, availability allocation, history/summary APIs, operational Web booking views, Android booking workflow/history/pending/search/dashboard counts, tests and evidence. Earlier branch history associated this domain with **Shakir Cassim**; confirm personal authorship.

### Completed backend work

- Prosumer create/own-list/detail/update/cancel; staff list/approve/reject; staff and Prosumer dashboard-summary endpoints.
- Server-owned seven-day/twelve-hour, ownership, status, slot/station, capacity and conflict checks; conditional allocation/restoration.
- Reservation service tests in source. Final Atlas concurrency behavior has not been observed in this audit.

### Completed web work

- Backoffice/Grid Operator booking list, search/filter, details, approval/rejection and API-backed summary cards.
- Responsive operational feedback for loading, empty, validation and conflict cases.

**Completed Android work:** station/slot selection leads to a create-reservation form and confirmation dialog; My Bookings list, detail, requested-energy update and cancellation are coded through the central API. This is more than the old identity-only assessment, but there is no independent successful device/API workflow evidence here.

### Remaining Member 3 work

- Build explicit current/pending/history and search/filter views plus live pending and approved-future counts on the Prosumer dashboard; the current My Bookings screen is a basic unfiltered list and home does not show those counts.
- Provide robust summary feedback after **each** action, including update/cancel, not only create; validate client response parsing and stale-state refresh on device.
- Run exact seven-day/twelve-hour boundaries, ownership/status conflicts, capacity competition and full booking lifecycle against final MongoDB/API.
- Capture Android/Web/dashboard screenshots, Postman cases and member-specific test/challenge evidence.

**Member 3 conclusion:** server/Web and basic Android booking actions exist; rubric-complete mobile views, live proof and evidence remain.

## 9. Member 4 - Operator Verification and Transactions

### Planned responsibility

Own secure QR issuance/validation, Grid Operator verification, final transfer/audit, transaction Web UI, Android operator scanner/result/finalization and operational map integration, tests and evidence. Earlier branch history associated this domain with **Chathumi Gunathunga / Chathumi21**; confirm personal authorship.

### Completed backend work

- Opaque expiring QR token issuance for approved reservations; server stores a SHA-256 hash, not the raw token.
- Grid Operator verify/finalize endpoints, invalid/expired/replayed/duplicate-state protections, audit/detail response.
- MongoDB transaction for completion plus station battery-storage increment, with capacity validation; service/DTO tests exist.

### Completed web work

- Grid Operator/Backoffice transaction views, status filtering, decoded-payload verification, detail and finalization dialogs, conflict/error feedback.
- Operator dashboard and existing station/reservation views. The Web verification panel accepts a payload; it is not a camera scanner.

### Remaining Member 4 work

- Build Prosumer approved-booking QR display/dispatch coordinated with Member 3, including expiry/renewal messaging.
- Build native Grid Operator camera scanning, server verification, transfer confirmation/finalization and success/failure screens; current Android operator home is only a landing page.
- Coordinate required operational Google Maps behavior with Member 2; no Android Maps implementation is present.
- Prove valid/invalid/expired/replay/duplicate/unauthorized cases and actual MongoDB transaction/rollback on final Atlas/IIS setup; collect scanner and audit evidence.

**Member 4 conclusion:** server/Web transaction work exists; core mobile scanner/operator workflow and hosted transactional proof remain.

## 10. React Web Status

Implemented: public home/login; Backoffice and Grid Operator dashboards; protected role routes; staff/Prosumer management; pending activation queue; deactivation-request dashboard/list/detail feedback; stations/slots with card-default/list-table toggle; reservations; transaction verification/finalization; profile/security; shared Tailwind visual system, controls, responsive shell and reduced-motion styling. The Web login sends `clientType: Web` and Prosumer Web access is blocked rather than routed to a Prosumer dashboard. Some legacy Prosumer page source may remain, but is not an intended current Web route.

Recent targeted lint on the edited station/slot/toggle files and a production build passed (2026-10-02). The 2026-09-30 full web record was 12 passing tests and one lint warning; a current full web test/lint run was **not** performed for this audit. `Reservations.jsx` previously had a hooks-dependency warning, which should be rechecked rather than assumed resolved.

Still required: authenticated cross-role browser matrix; tested API success/error paths; desktop/tablet/mobile-Web overflow and accessibility checks; confirm energy-flow animation behavior in Edge/Opera and reduced-motion settings; final unique screenshots. A passing Vite build does not demonstrate those outcomes.

## 11. Android, SQLite, Maps and QR Status

Implemented native Java/XML, AndroidX Navigation, central asynchronous `HttpURLConnection` client, Gson envelopes/errors, bearer tokens and SQLite database version 2. SQLite retains the session table and adds a bounded authenticated-profile reference cache. Login explicitly identifies Android. The identity UI supports registration, online profile updates, offline read-only profile fallback, account status and deactivation-request feedback; Prosumer pages now include stations, slots, create booking, My Bookings, details, update and cancel. The Grid Operator has a login/home foundation only. The app is configured to `http://10.0.2.2:5080/` for an emulator, **not** a hosted IIS URL or a physical-device host.

| Mobile requirement | Current state | Gap |
| --- | --- | --- |
| Login/role routing | Source implemented | Live device/hosted matrix and generic-login-error investigation |
| Prosumer registration/profile | Source implemented | Activation/rejection/resubmission device demonstration |
| Deactivation request | Correct endpoint and pending feedback in source | Confirm saved request and Backoffice visibility against same database |
| SQLite | Session token/role/name/expiry plus API-derived user profile and last-sync time; safe v1-to-v2 migration | Emulator/device migration, offline and redacted inspection evidence |
| Offline profile | Server-first fetch, cache refresh on success, read-only cache fallback on availability failures | Runtime airplane-mode/API-outage and no-cache screenshots |
| Station/slot discovery | API-backed list/selection source | Google Maps, nearby filter, detail/map evidence |
| Reservation actions | Create/update/cancel and details source | Hosted action/boundary tests and consistent summaries |
| Booking views | Basic My Bookings list | Current/pending/history/search and dashboard counts |
| Prosumer QR | Absent | Secure approved-booking QR display |
| Operator mode | Basic role home | Scanner, verify/finalize/results and map |

The October 3 targeted Android debug build and final Java compile passed after profile caching was added. The JVM suite ran 9 tests with 8 passing and one pre-existing `ApiErrorHandlerTest` failure: the current handler exposes a server `detail` string while the test expects it to be hidden. That discrepancy was not introduced by profile caching and remains a security/error-contract issue to resolve. The historical 23 lint warnings predate newer station/booking/profile-cache code and must not be reported as current coverage. Instrumentation/device tests, camera/Maps credentials, SQLite evidence and hosted API tests remain.

## 12. Database Status

The four server collection models, repositories and named indexes exist. NIC/email, station/slot codes, geospatial station coordinates, reservation references and QR hash are represented in source. Transaction/audit fields remain in reservations to maintain four collections. Android SQLite stores one authenticated session and one cached profile. The profile row is display/reference data only; it never authorizes access and does not replace server authority for account status, availability, bookings, QR validity or transaction state. No password or duplicate access token is stored in the profile table.

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
| 2026-10-04 report refresh | Android test/build attempt | Restricted run could not download Gradle; use the successful October 3 elevated build record, but rerun before submission |

Evidence still required: all-domain Postman and negative/auth/role cases; complete register→activate→book→approve→QR→scan→finalize lifecycle; exact boundary/timezone, reservation deactivation and concurrent allocation tests; actual Android emulator/physical device, browser, SQLite and Atlas records; IIS-hosted smoke and both-client calls. Record dates, environment, versions and redacted results so “tested” has a reproducible meaning.

## 14. Deployment Status

Docker/Compose, `.env.example`, health endpoints and local emulator API configuration exist. These are development aids and do not satisfy the IIS requirement. No repository proof establishes an IIS site, ASP.NET Core Hosting Bundle/app-pool configuration, HTTPS binding, production CORS, Atlas connection, or Web/Android use of a common hosted API.

Required sequence: publish API for Windows; configure Hosting Bundle, IIS site/app pool, HTTPS, secrets/CORS and least-privilege Atlas access; verify health and role-protected endpoints; configure Web and Android URLs; test both clients and capture redacted deployment evidence. Do not treat a Docker health check as IIS evidence.

## 15. Documentation and Evidence Status

Present: requirements/decision logs, architecture/use-case/DFD diagrams, MongoDB design, API contracts, traceability/change register, Member 1/2 backend notes, Member 1/4 Web notes, Android setup README and an identity-only Postman collection. This progress report records the current source-level assessment; it is not the final assessed report.

Missing or needing review: Member 3/4 backend notes; all-domain Postman; current Android feature/setup notes; IIS runbook/evidence; unique screenshots of all UIs; source-code excerpts as **text**; exact references; Git history mapped to verified students; authentic individual contributions/challenges; README video link (maximum five minutes); submission screenshot/ZIP naming. Check the PDF page-4 code-comment gate: a header block on each `.cs` file and inline comment at the beginning of each method. This audit has not certified every C# file. Page-6 AI-use restrictions require truthful disclosure and independent student-authored implementation/report work; no evidence or personal reflection should be fabricated.

## 16. Requirements Readiness Summary

| Requirement group | Coverage | Blocking gap |
| --- | --- | --- |
| Central API/FAT Service | Code implemented | IIS/hosted proof and complete authorization matrix |
| MongoDB/four collections | Models/indexes implemented | Atlas/sample data, concurrency and rollback proof |
| Identity/account lifecycle | Backend/Web/Android source substantially aligned; SQLite profile cache implemented | Live device/backend/database and cache-isolation demonstration |
| Stations/slots | Backend/Web/basic Android list | Google Maps and Grid Operator status-authority decision |
| Reservations | Backend/Web/basic Android actions | Full mobile views/counts, action summaries and boundary/E2E proof |
| QR/transactions | Backend/Web | Prosumer QR, Android scanner/finalization and transaction proof |
| Web UX | Broad, buildable; card/list options | Browser/accessibility/hosted matrix and screenshots |
| Native Android/SQLite | Partial; session and profile persistence implemented | Maps, scanner, complete dashboards and device/cache evidence |
| IIS | Not evidenced | Deployment and two-client reachability |
| Final assessment | Partial engineering docs | Student-authored report, screenshots, video, code comments and verified contributions |

## 17. Prioritized Completion Plan

### Priority 0 - Start the required Android application

The Android app is **already started**; retain the original heading for continuity but finish the missing assessed scope:

1. Reproduce Member 1 identity/activation/request lifecycle against the same deployed API/DB on a device; validate SQLite migration, offline fallback and account isolation.
2. Complete Member 2 Google Maps, nearby station details and real location behavior.
3. Complete Member 3 pending/current/history/search/dashboard counts and action summaries; verify create/update/cancel against server boundaries.
4. Complete Member 4 approved QR display and operator camera scan→verify→finalize/results.
5. Integrate all mobile work with secure hosted API configuration; avoid local business rules that contradict the server.

### Priority 1 - Complete integration verification

1. Resolve Grid Operator slot-status authority and the rubric's delete/soft-deactivation wording with documented approval.
2. Build one chained, all-domain Postman collection and run positive/negative/role cases on final MongoDB.
3. Prove concurrent approvals, reservation-aware deactivation, QR expiry/replay and transaction rollback.
4. Re-run full backend/Web/Android checks on final source, triage lint warnings and review `.cs` comments.
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

**Not submission-ready on repository evidence.** The API and Web implementation are broad, and Android now includes meaningful identity, offline profile reference caching, station/slot and reservation code. Member 1's remaining SQLite implementation gap has moved from source design to runtime evidence, but the original plan's four cross-layer ownership areas are still unfinished because Maps, complete booking dashboards, QR/device operator processing, IIS deployment and reproducible final evidence are missing. Historical test counts and source inspection should not be converted into claims of complete live workflows. The four students must validate the final implementation and author their own assessed contribution/report material under the PDF's AI Planning Level 2 rules.
