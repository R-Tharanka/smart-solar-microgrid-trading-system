# smart-solar-microgrid-trading-system
An end-to-end Smart Solar Microgrid Trading System. The project includes a React and Tailwind CSS web application, a native Android application built with Java and SQLite, and a centralized C# Web API using MongoDB and IIS hosting to manage solar prosumers, microgrid nodes, energy slot reservations, and operator-verified energy transfers.

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

## Phase 3 identity backend

- [Member 1 implementation and verification](docs/phase-3/member-1-identity-backend.md)
- [Implemented identity API contract](docs/api-contracts/identity-api.md)
- [Member integration contract](docs/phase-3/member-integration-contract.md)
- [Postman collection and execution guide](docs/postman/README.md)

The ASP.NET Core foundation is under `backend/` and uses MongoDB Atlas. Copy `.env.example` to an untracked `.env`, add the Atlas SRV connection string and run `docker compose up --build`. Verify Atlas connectivity at `http://localhost:5080/health/ready`.
