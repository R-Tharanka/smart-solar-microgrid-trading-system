# smart-solar-microgrid-trading-system
An end-to-end Smart Solar Microgrid Trading System. The planned system combines a React and Tailwind CSS web application, a native Android application built with Java and SQLite, and a centralized C# Web API using MongoDB and IIS hosting to manage solar prosumers, microgrid nodes, energy slot reservations, and operator-verified energy transfers.

## Current project status

The central backend is substantially implemented and its test suite currently passes 105/105 tests. Member 1's React identity/account-management scope, including Backoffice Prosumer creation and editing, is implemented, while the overall React client still lacks Member 4 transaction operations. The native Android client has not been started, and IIS deployment plus final evidence remain pending.

- [Full system progress and completion report](docs/project-status/full-system-progress-report.md)
- [Requirements traceability matrix](docs/requirements/requirements-traceability-matrix.md)
- [Member 1 React web implementation](docs/web/member-1-react-web.md)

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
