# Phase 2 Verification and Team Handoff

## Atlas Setup

1. Create an Atlas project and cluster.
2. Create a dedicated database user with read/write access to `smart_solar_microgrid`.
3. Add only the development machine and deployment server IP addresses to the Atlas IP access list.
4. Select **Connect > Drivers > C#/.NET** and copy the `mongodb+srv://` connection string.
5. URL-encode reserved characters in the database password.
6. Copy `.env.example` to `.env` and replace the placeholder connection string. `.env` is ignored by Git.

## Docker API Startup

```powershell
docker compose up --build -d
docker compose ps
Invoke-RestMethod http://localhost:5080/health/live
Invoke-RestMethod http://localhost:5080/health/ready
Invoke-RestMethod http://localhost:5080/api/system/info
```

Expected results: `health/live` and `health/ready` return HTTP 200; system info returns API name, version and UTC time. `health/ready` proves the API can execute a `ping` command against Atlas. Stop the API container with `docker compose down`.

## SDK Startup

```powershell
$env:MongoDb__ConnectionString = "<Atlas SRV connection string>"
$env:MongoDb__DatabaseName = "smart_solar_microgrid"
dotnet restore backend/SmartSolarMicrogrid.slnx
dotnet build backend/SmartSolarMicrogrid.slnx --no-restore
dotnet run --project backend/src/SmartSolarMicrogrid.Api
```

## Verification Record

| Check | Evidence | Result |
| --- | --- | --- |
| API project restores and builds | .NET 10.0.401; 0 warnings, 0 errors | Passed 2026-09-23 |
| Docker image publishes | Multi-stage Docker build | Passed 2026-09-23 |
| Liveness endpoint | HTTP 200 from `/health/live` | Passed 2026-09-23 |
| MongoDB readiness | HTTP 200 from `/health/ready` | Passed 2026-09-23 |
| Four collections created | `users`, `solarStationInfo`, `energyBookingSlots`, `energyReservations` | Passed 2026-09-23 |
| Required indexes created | 13 named application indexes plus four `_id` indexes | Passed 2026-09-23 |
| Atlas connectivity and initialization | `/health/ready` and Atlas Collections view | Pending Atlas credentials and IP access |
| Missing/invalid JWT rejected | API request | Phase 3 authentication implementation |
| Role policy denies wrong role | API request | Phase 3 endpoint implementation |

## Member Contract Sign-off

Each member confirms their endpoint contracts, collection fields, statuses and client dependencies before Phase 3 starts.

| Member | Domain | Name/date | Approved |
| --- | --- | --- | --- |
| 1 | Identity and accounts |  | [ ] |
| 2 | Stations and slots |  | [ ] |
| 3 | Reservations and dashboards |  | [ ] |
| 4 | Verification and transfer |  | [ ] |

## Phase 3 Handoff

- Member 1 implements user persistence, password hashing, JWT issuance and account endpoints first.
- Member 2 implements station and slot repositories/services in parallel after shared models are reviewed.
- Member 3 integrates through M1/M2 service interfaces and owns reservation transaction boundaries.
- Member 4 uses M3 state-transition services and never mutates reservation status directly.
- Every endpoint receives unit/service tests and at least one HTTP integration test with real MongoDB behavior.
