# smart-solar-microgrid-trading-system
An end-to-end Smart Solar Microgrid Trading System. The planned system combines a React and Tailwind CSS web application, a native Android application built with Java and SQLite, and a centralized C# Web API using MongoDB and IIS hosting to manage solar prosumers, microgrid nodes, energy slot reservations, and operator-verified energy transfers.

Repository: https://github.com/R-Tharanka/smart-solar-microgrid-trading-system

Demonstration video: pending; the assignment requires a video of no more than five minutes before submission.

## Current project status

The central API, React client and native Android client now cover all four planned domains in source. Android includes identity/account workflows, location-aware station map/list discovery for Prosumers and Grid Operators, bounded profile/station-reference caching, reservation actions/search/categories/counts, transient approved-booking QR rendering, camera scanning, server verification and finalization. Raw QR persistence has been removed, QR parsing is canonical, renewal invalidates the previous token, and Android error details are sanitized. The system is still not submission-ready: the map uses osmdroid/OpenStreetMap rather than the assignment's required Google Maps implementation, and device/camera/Atlas/IIS/end-to-end evidence is absent. Current 2026-10-05 checks are backend 145/145, Web 12/12 plus a successful production build and 0 lint errors/1 warning, and Android 12/12 JVM tests plus debug APK assembly. See the dated [progress report](docs/project-status/full-system-progress-report.md).

- [Full system progress and completion report](docs/project-status/full-system-progress-report.md)
- [Requirements traceability matrix](docs/requirements/requirements-traceability-matrix.md)
- [Backend requirements change and alignment register](docs/requirements/backend-requirements-change-register.md)
- [Member 1 React web implementation](docs/web/member-1-react-web.md)
- [Member 4 React transaction implementation](docs/web/member-4-react-web.md)

## Phase 1 foundation

Phase 1 requirements analysis and project foundation documents:

- [Requirements and project foundation](docs/phase-1/requirements-and-project-foundation.md)
- [Member 1 identity scope](docs/phase-1/member-1-identity-scope.md)
- [Identity API contract](docs/api-contracts/identity-api.md)
- [Station and slot API contract](docs/api-contracts/station-slot-api.md)
- [Reservation and dashboard API contract](docs/api-contracts/reservation-dashboard-api.md)
- [Operator transaction API contract](docs/api-contracts/operator-transaction-api.md)
- [MongoDB collection design](docs/database-design/mongodb-collections.md)
- [Architecture diagrams](docs/architecture/phase-1-diagrams.md)
- [Requirements traceability matrix](docs/requirements/requirements-traceability-matrix.md)
- [UI and evidence checklist](docs/phase-1/ui-and-evidence-checklist.md)
- [Decision log](docs/phase-1/decision-log.md)

## Phase 2 architecture, database and API contracts

- [Phase 2 master specification](docs/phase-2/architecture-database-api-contracts.md)
- [Database specification](docs/phase-2/database-specification.md)
- [API contract governance](docs/phase-2/api-contract-governance.md)
- [Phase 2 diagrams](docs/architecture/phase-2-diagrams.md)
- [Verification and team handoff](docs/phase-2/verification-and-handoff.md)

## Backend implementation

- [Member 1 implementation and verification](docs/phase-3/member-1-identity-backend.md)
- [Member 2 stations and slots implementation](docs/phase-4/member-2-stations-slots-backend.md)
- [Implemented identity API contract](docs/api-contracts/identity-api.md)
- [Member integration contract](docs/phase-3/member-integration-contract.md)
- [Full-system Postman collection](docs/postman/Smart-Solar-Microgrid-Full-System.postman_collection.json)
- [Postman collection and execution guide](docs/postman/README.md)
- [IIS deployment guide](docs/deployment/iis-deployment.md)

The ASP.NET Core foundation is under `backend/` and uses MongoDB Atlas. Copy `.env.example` to an untracked `.env`, add the Atlas SRV connection string and run `docker compose up --build`. Verify Atlas connectivity at `http://localhost:5080/health/ready`.

## Individual contributions

The following names and responsibility claims are the repository's declared contribution record. Each student must confirm them against commits, pull requests, screenshots and viva evidence before submission; source presence is not proof of personal authorship or live completion.

### IT22079268 - Premathilaka G.G.R.T

Identity, Authentication, Account Management & Database Configuration
- Configured the MongoDB connection and database settings for the centralized ASP.NET Core Web API.
- Configured secure database connection handling using environment variables and application configuration.
- Configured SQLite support for the native Android application.
- Established the local SQLite database structure used for mobile-side persistence and reference data.
- Assisted with Android database access configuration and integration between SQLite-stored data and the central Web API.
- Implemented Prosumer registration and staff account creation.
- Implemented secure login using BCrypt password hashing.
- Implemented JWT-based authentication and role-based authorization.
- Implemented Backoffice, Grid Operator and Prosumer authorization policies.
- Implemented user profile retrieval and profile update functionality.
- Implemented Prosumer account deactivation.
- Implemented Backoffice-controlled account reactivation.
- Implemented user listing and account-status management.
- Added unique NIC and email validation and MongoDB indexes.
- Implemented account-state validation and reservation-aware Prosumer deactivation.
- Implemented web interfaces for login, user management, Prosumer management and profile/account operations.
- Implemented Android authentication-related functionality including registration, login, session handling and profile management.
- Implemented automated tests for authentication, authorization and account-management workflows.

### IT22070012 - Navoda H.G.J

Microgrid Stations & Energy Booking Slots
- Implemented solar/microgrid station creation, retrieval and updating.
- Implemented station GPS information using latitude and longitude.
- Implemented station capacity and battery-storage management.
- Implemented station operating schedules.
- Implemented station activation, maintenance and deactivation functionality.
- Implemented the rule preventing station deactivation when active reservations exist.
- Implemented energy booking-slot creation, retrieval and updating.
- Implemented slot availability/status management.
- Implemented slot validation including time, schedule, capacity, price and overlap rules.
- Implemented reservation-safe slot modification and status changes.
- Implemented location-based station queries for nearby-station discovery.
- Implemented the Backoffice web frontend for station and slot management using React and Tailwind CSS.
- Implemented station list, create station, station details, edit station and station-status interfaces.
- Implemented slot list, create slot, slot details, edit slot and slot-status interfaces.
- Grid Operators have read-only station/slot details and may change slot availability through the predefined status dropdown; Backoffice retains create and detail-edit permissions. Only `Available` and `Unavailable` are manual targets; `Reserved` and `Expired` remain server-managed.
- Implemented Android GPS/location functionality for nearby station discovery.
- Implemented an osmdroid/OpenStreetMap station map as a current requirement deviation.
- Implemented station markers, station details and available slot viewing in the Android application.
- Implemented automated tests for station and slot business rules.

### IT22217318 - Cassim T.S

Energy Reservations, Booking Management & Dashboards
- Implemented energy reservation creation.
- Implemented reservation modification and cancellation.
- Implemented reservation retrieval and reservation-status management.
- Implemented the required booking-window validation.
- Implemented the minimum notice period for reservation updates and cancellations.
- Implemented reservation ownership and authorization checks.
- Integrated reservations with Prosumers, stations and energy booking slots.
- Implemented slot availability checks during reservation operations.
- Implemented reservation-state transition validation.
- Implemented web interfaces for reservation management.
- Implemented current, pending and historical booking views.
- Implemented reservation searching and filtering.
- Implemented booking and operational dashboard views.
- Implemented the Android Prosumer reservation workflow.
- Implemented reservation creation from a selected station and energy slot.
- Implemented Android reservation modification and cancellation.
- Implemented booking summaries, pending reservations and booking history.
- Implemented automated tests for reservation business rules and state transitions.

### IT22087324 - Gunathunga P.C.I

Grid Operator Verification & Energy Transfer
- Implemented Grid Operator transaction-verification functionality.
- Implemented QR-based transaction validation.
- Implemented Grid Operator authorization checks.
- Implemented server-side verification of reservation and transaction states.
- Implemented energy-transfer finalization.
- Implemented protection against duplicate or invalid transaction completion.
- Integrated the transaction workflow with reservation status information.
- Implemented web interfaces for Grid Operator operational functionality.
- Implemented transaction-detail and verification-status views.
- Implemented transfer-related monitoring interfaces.
- Implemented Android QR-code scanning functionality.
- Implemented server-side QR verification from the Android application.
- Implemented Grid Operator transaction confirmation.
- Implemented final energy-transfer completion and result screens.
- Implemented handling for invalid, expired and already-completed transactions.
- Implemented backend tests for core QR verification, operator authorization and duplicate-transfer prevention; QR renewal and Android scanner/transaction paths still lack focused tests.

## Current project status

The central API, React client and native Android client now cover all four planned domains in source. Android includes identity/account workflows, location-aware station map/list discovery for Prosumers and Grid Operators, bounded profile/station-reference caching, reservation actions/search/categories/counts, transient approved-booking QR rendering, camera scanning, server verification and finalization. Raw QR persistence has been removed, QR parsing is canonical, renewal invalidates the previous token, and Android error details are sanitized. The system is still not submission-ready: the map uses osmdroid/OpenStreetMap rather than the assignment's required Google Maps implementation, and device/camera/Atlas/IIS/end-to-end evidence is absent. Current 2026-10-05 checks are backend 145/145, Web 12/12 plus a successful production build and 0 lint errors/1 warning, and Android 12/12 JVM tests plus debug APK assembly. See the dated [progress report](docs/project-status/full-system-progress-report.md).

- [Full system progress and completion report](docs/project-status/full-system-progress-report.md)
- [Requirements traceability matrix](docs/requirements/requirements-traceability-matrix.md)
- [Backend requirements change and alignment register](docs/requirements/backend-requirements-change-register.md)
- [Member 1 React web implementation](docs/web/member-1-react-web.md)
- [Member 4 React transaction implementation](docs/web/member-4-react-web.md)

## Phase 1 foundation

Phase 1 requirements analysis and project foundation documents:

- [Requirements and project foundation](docs/phase-1/requirements-and-project-foundation.md)
- [Member 1 identity scope](docs/phase-1/member-1-identity-scope.md)
- [Identity API contract](docs/api-contracts/identity-api.md)
- [Station and slot API contract](docs/api-contracts/station-slot-api.md)
- [Reservation and dashboard API contract](docs/api-contracts/reservation-dashboard-api.md)
- [Operator transaction API contract](docs/api-contracts/operator-transaction-api.md)
- [MongoDB collection design](docs/database-design/mongodb-collections.md)
- [Architecture diagrams](docs/architecture/phase-1-diagrams.md)
- [Requirements traceability matrix](docs/requirements/requirements-traceability-matrix.md)
- [UI and evidence checklist](docs/phase-1/ui-and-evidence-checklist.md)
- [Decision log](docs/phase-1/decision-log.md)

## Phase 2 architecture, database and API contracts

- [Phase 2 master specification](docs/phase-2/architecture-database-api-contracts.md)
- [Database specification](docs/phase-2/database-specification.md)
- [API contract governance](docs/phase-2/api-contract-governance.md)
- [Phase 2 diagrams](docs/architecture/phase-2-diagrams.md)
- [Verification and team handoff](docs/phase-2/verification-and-handoff.md)

## Backend implementation

- [Member 1 implementation and verification](docs/phase-3/member-1-identity-backend.md)
- [Member 2 stations and slots implementation](docs/phase-4/member-2-stations-slots-backend.md)
- [Implemented identity API contract](docs/api-contracts/identity-api.md)
- [Member integration contract](docs/phase-3/member-integration-contract.md)
- [Postman collection and execution guide](docs/postman/README.md)

The ASP.NET Core foundation is under `backend/` and uses MongoDB Atlas. Copy `.env.example` to an untracked `.env`, add the Atlas SRV connection string and run `docker compose up --build`. Verify Atlas connectivity at `http://localhost:5080/health/ready`.

The central API, React client and native Android client now cover all four planned domains in source. Android includes identity/account workflows, location-aware station map/list discovery, bounded profile/station-reference caching, reservation actions/search/categories/counts, approved-booking QR rendering, camera scanning, server verification and finalization. The system is still not submission-ready: the current Android map uses osmdroid/OpenStreetMap rather than the assignment's required Google Maps implementation, the raw QR payload/token is persisted in SharedPreferences, Android has one failing JVM test, and device/camera/Atlas/IIS/end-to-end evidence is absent. Current 2026-10-05 checks are backend 136/136, Web 12/12 plus a successful production build and 0 lint errors/1 warning, and Android APK assembly with 8/9 JVM tests. See the dated [progress report](docs/project-status/full-system-progress-report.md).

- [Full system progress and completion report](docs/project-status/full-system-progress-report.md)
- [Requirements traceability matrix](docs/requirements/requirements-traceability-matrix.md)
- [Backend requirements change and alignment register](docs/requirements/backend-requirements-change-register.md)
- [Member 1 React web implementation](docs/web/member-1-react-web.md)
- [Member 4 React transaction implementation](docs/web/member-4-react-web.md)

## Phase 1 foundation

Phase 1 requirements analysis and project foundation documents:

- [Requirements and project foundation](docs/phase-1/requirements-and-project-foundation.md)
- [Member 1 identity scope](docs/phase-1/member-1-identity-scope.md)
- [Identity API contract](docs/api-contracts/identity-api.md)
- [Station and slot API contract](docs/api-contracts/station-slot-api.md)
- [Reservation and dashboard API contract](docs/api-contracts/reservation-dashboard-api.md)
- [Operator transaction API contract](docs/api-contracts/operator-transaction-api.md)
- [MongoDB collection design](docs/database-design/mongodb-collections.md)
- [Architecture diagrams](docs/architecture/phase-1-diagrams.md)
- [Requirements traceability matrix](docs/requirements/requirements-traceability-matrix.md)
- [UI and evidence checklist](docs/phase-1/ui-and-evidence-checklist.md)
- [Decision log](docs/phase-1/decision-log.md)

## Phase 2 architecture, database and API contracts

- [Phase 2 master specification](docs/phase-2/architecture-database-api-contracts.md)
- [Database specification](docs/phase-2/database-specification.md)
- [API contract governance](docs/phase-2/api-contract-governance.md)
- [Phase 2 diagrams](docs/architecture/phase-2-diagrams.md)
- [Verification and team handoff](docs/phase-2/verification-and-handoff.md)

## Backend implementation

- [Member 1 implementation and verification](docs/phase-3/member-1-identity-backend.md)
- [Member 2 stations and slots implementation](docs/phase-4/member-2-stations-slots-backend.md)
- [Implemented identity API contract](docs/api-contracts/identity-api.md)
- [Member integration contract](docs/phase-3/member-integration-contract.md)
- [Postman collection and execution guide](docs/postman/README.md)

The ASP.NET Core foundation is under `backend/` and uses MongoDB Atlas. Copy `.env.example` to an untracked `.env`, add the Atlas SRV connection string and run `docker compose up --build`. Verify Atlas connectivity at `http://localhost:5080/health/ready`.
