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
