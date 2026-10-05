# Phase 1 Decision Log

Purpose: record decisions needed before backend implementation starts.

| ID | Decision | Status | Rationale |
| --- | --- | --- | --- |
| D-01 | Use one ASP.NET Core Web API as the central service. | Accepted | Matches FAT Service requirement and prevents duplicated business logic. |
| D-02 | Use MongoDB only from the API. | Accepted | Clients must use REST API; server owns persistence. |
| D-03 | Use React with Tailwind CSS for web. | Accepted | Permitted by assignment and project plan. |
| D-04 | Use native Android Java with SQLite. | Accepted | Required by assignment plan. |
| D-05 | Store server timestamps in UTC. | Accepted | Keeps 7-day and 12-hour rules consistent. |
| D-06 | Use NIC as unique Prosumer identity while keeping MongoDB `_id`. | Accepted | Assignment requires NIC primary identity; MongoDB still benefits from `_id`. |
| D-07 | Hash passwords; never store plaintext password in MongoDB or SQLite. | Accepted | Security and viva-critical design requirement. |
| D-08 | Use JWT bearer authentication for API protection. | Accepted for implementation plan | Simple fit for web and Android clients. |
| D-09 | Backoffice creates Backoffice/Grid Operator users. | Accepted | Prevents public elevated-role registration. |
| D-10 | Prosumer public registration always creates `Prosumer` role. | Accepted | Prevents privilege escalation. |
| D-11 | Reservation booking window means scheduled start time must be from server now through server now plus 7 calendar days. | Accepted for implementation | Documents the boundary and keeps validation server-owned. |
| D-12 | Update/cancel requires scheduled start time to be at least 12 hours after server now. | Accepted | Matches planned business rule. |
| D-13 | QR payload uses opaque transaction token, not only reservation id. | Accepted | Supports secure server verification and duplicate-prevention. |
| D-14 | QR token hash is stored server-side; raw token is only returned for QR generation. | Accepted | Avoids storing reusable raw token. |
| D-15 | Capacity fields use `Kwh` in code while report notes assignment wording around kW/h. | Accepted | Keeps code internally consistent while preserving assignment terminology in documentation. |
| D-16 | Reservation approval and rejection can be performed by Backoffice and Grid Operator users. | Accepted | Backoffice needs administrative control and Grid Operator needs operational control. |
| D-17 | Station deactivation is blocked when active/future reservations exist. | Accepted | Prevents breaking existing bookings. |
| D-18 | Terminal reservation states are `Rejected`, `Cancelled`, `Expired`, `Completed`. | Accepted | Prevents invalid state transitions. |
| D-19 | Pending reservations do not allocate slot energy; approval conditionally allocates it and later eligible transitions restore or reallocate it. | Accepted in implementation | Avoids locking capacity for unapproved requests and provides a concurrency boundary. |
| D-20 | Transaction security and audit fields remain embedded in `energyReservations`; no fifth transaction collection is created. | Accepted in implementation | Preserves the assignment's four-collection model and keeps the lifecycle together. |
| D-21 | Finalization records actual energy and a note, then updates the reservation and station battery storage in a MongoDB transaction; it does not close a shared-capacity slot. | Accepted in implementation | Provides auditable completion, validates storage capacity and prevents a partial final state. |
| D-22 | Android SQLite currently persists only the authenticated token, role, display name and expiry. | Provisional | Server data remains authoritative; the team must confirm whether reference-data caching is also required. |
| D-23 | Public Prosumer registration currently creates an `Active` account rather than a `Pending` account. | Review required | The individual marking table mentions a pending-activation web view, so the changed requirement must be confirmed or implemented. |
| D-24 | Grid Operators have read-only station/slot details and may change slot availability/status; Backoffice alone creates or edits station and slot details. | Accepted | Matches the operational role without allowing Grid Operators to change schedules, capacity, pricing or station data. |

Post-plan changes and their client/evidence impact are tracked in `docs/requirements/backend-requirements-change-register.md`.
