# smart-solar-microgrid-trading-system
An end-to-end Smart Solar Microgrid Trading System. The planned system combines a React and Tailwind CSS web application, a native Android application built with Java and SQLite, and a centralized C# Web API using MongoDB and IIS hosting to manage solar prosumers, microgrid nodes, energy slot reservations, and operator-verified energy transfers.

Repository: https://github.com/R-Tharanka/smart-solar-microgrid-trading-system

Demonstration video: pending; the assignment requires a video of no more than five minutes before submission.

## Current project status

The central API and React client cover all four planned domains in source. React includes pending Prosumer activation/deactivation-request management and card/list views for stations and slots. Native Android Java/SQLite now includes registration, login, profile/deactivation-request feedback, Google map/list station discovery with location-aware ordering, bounded profile/station reference caching, live slot selection, and basic Prosumer booking create/list/update/cancel screens. A valid locally configured Android Maps key and device verification, complete booking search/dashboard counts, approved-booking QR display, operator scanning/finalization, IIS deployment and final live evidence remain pending. Earlier full-suite results (backend 113, web 12, Android 7 JVM tests) are historical, not a current end-to-end certification; see the dated [progress report](docs/project-status/full-system-progress-report.md).

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
