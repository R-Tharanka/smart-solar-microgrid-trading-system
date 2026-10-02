# Backend Requirements Change and Alignment Register

Date reconciled: 2026-09-30

Purpose: record backend decisions and requirement changes made after the original project plan, together with their client and documentation impact.

This register does not rewrite the assignment brief. The team must confirm any changed stakeholder requirement and retain evidence of that decision. The assignment PDF remains authoritative for assessment.

## Change Register

| ID | Original plan/brief position | Implemented or revised behavior | Reason/benefit | Impact and required action | State |
| --- | --- | --- | --- | --- | --- |
| CHG-01 | Prosumer profiles use NIC as the primary identity | MongoDB retains `_id`; NIC is unique, required for Prosumers and used as the public business identifier | Preserves MongoDB references while satisfying NIC-based lookup | Clients must never rely on MongoDB `_id`; report must explain business key versus storage key | Accepted in D-06 |
| CHG-02 | Marking table includes a pending-activation web view | Public registration creates `Pending`; the API exposes a Backoffice queue plus activate/reject actions | Aligns account creation with the required approval workflow | React must add the pending-activation view and actions | Implemented in backend |
| CHG-03 | Authentication identifier was not fully specified | Login accepts normalized email or Prosumer NIC | Supports staff email login and NIC-oriented Prosumer login through one route | Web/mobile labels and validation must explain accepted identifiers | Implemented |
| CHG-04 | Rubric mentions create/update/delete for stations and slots; the main scenario specifies deactivation | Accounts/stations use lifecycle status; reservations cancel; no physical delete endpoints | Protects audit history and active references | Explain the soft lifecycle approach and confirm it satisfies the delete wording | Decision required |
| CHG-05 | PDF describes capacity as `kW/h` | Models/contracts use `CapacityKwh`, `BatteryStorageKwh`, `AvailableEnergyKwh` and `PricePerKwh` | Uses a consistent energy quantity for booking/allocation | Report must state the interpretation and avoid silently mixing units | Accepted in D-15 |
| CHG-06 | The "within 7 days" boundary was ambiguous | Scheduled start must be after server UTC now and no later than `now + 7 days` | Creates a deterministic server-owned rule | Clients display server validation; exact boundary tests remain required | Accepted in D-11 |
| CHG-07 | The 12-hour modification rule was high level | Update/cancel is allowed only while server time is at or before `scheduledStart - 12 hours` | Removes timezone/client-clock ambiguity | Boundary tests and user-facing messages are required | Accepted in D-12 |
| CHG-08 | Slot-capacity allocation timing was unspecified | Pending requests do not consume energy; approval conditionally allocates it; update/cancel/reject restores or reallocates it | Prevents unapproved requests from locking capacity | Run competing approval tests against real MongoDB | Implemented |
| CHG-09 | Approval actor was not explicit in the top-level specification | Backoffice and Grid Operator may approve/reject through the `Staff` policy | Allows administrative and operational control | Document the role matrix consistently and verify both roles | Accepted in D-16 |
| CHG-10 | Scenario assigns Grid Operators responsibility for slot availability | General slot update uses `Staff`, but slot creation and status change are `BackofficeOnly` | Current implementation separates editing from lifecycle control | Confirm intended authority and change policy/UI if operators must control status | Decision required |
| CHG-11 | Secure QR was required, but payload/storage design was unspecified | API issues an opaque expiring token; a SHA-256 hash is stored in the reservation | Avoids predictable reservation-ID QR values and raw-token storage | Mobile must render/scan the issued payload and prove expiry/replay behavior | Accepted in D-13/D-14 |
| CHG-12 | Four server collections are required | Transaction/audit fields are embedded in `energyReservations`; no fifth transaction collection is used | Keeps the four-collection model and lifecycle together | Database/report diagrams must show embedded transaction fields | Implemented |
| CHG-13 | Final transfer behavior was high level | Grid Operator verifies, then finalizes with actual energy/note; completion and station battery-storage increment occur in a MongoDB transaction without closing the shared slot | Adds auditability, storage-capacity validation and duplicate prevention | Final Atlas tier must support transactions; rollback test required | Implemented |
| CHG-14 | SQLite is required for local user management/login/reference data | Current Android database stores one session: token, role, display name and expiry | Provides persistent authentication without duplicating authoritative server data | Confirm whether reference data must also be cached; redact the token in evidence | Partial/decision required |
| CHG-15 | Mobile app is intended for Prosumers and Grid Operators | API login requires `clientType`; Android permits Prosumer/Grid Operator and rejects Backoffice | Matches the operational scenario and enforces it at the API boundary | Android must send `clientType: Android` | Implemented in backend; client pending |
| CHG-16 | Web app is for Backoffice/Grid Operators | API login requires `clientType`; Web permits Backoffice/Grid Operator and rejects Prosumer | Enforces the required client-role matrix | React must send `clientType: Web`; remove or stop routing Prosumer web sessions | Implemented in backend; client pending |
| CHG-17 | Station deactivation is blocked by active reservations | `Pending`, `Approved`, `QrIssued` and `Verified` reservations block station and relevant slot lifecycle changes | Protects every non-terminal workflow | Keep status lists synchronized across domains and tests | Implemented |
| CHG-18 | Account deactivation behavior was general | Prosumer self-service records a pending request while remaining Active; Backoffice deactivation applies the non-terminal-reservation guard; protected policies deny deactivated accounts before JWT expiry | Separates user intent from administrative lifecycle control without weakening reservation protection | Android must adopt the request endpoint; React must expose request state/processing | Implemented in backend; clients pending |

## Current State Machine

```text
Pending --approve--> Approved --issue QR--> QrIssued --verify--> Verified --finalize--> Completed
   |                     |
   +--reject--> Rejected +--cancel (12-hour rule)--> Cancelled
   +--cancel (12-hour rule)------------------------> Cancelled
```

Terminal states are `Rejected`, `Cancelled`, `Expired` and `Completed`. Physical deletion is not part of the current backend lifecycle.

## Confirmation Checklist

- [x] Pending public registration and Backoffice activation/rejection restored in the backend.
- [ ] Team confirms whether Grid Operators may change slot status/availability.
- [ ] Team confirms that status/deactivation satisfies the rubric's "delete" wording.
- [ ] Team confirms SQLite session-only persistence is sufficient or defines a reference-cache scope.
- [ ] API contracts, web/mobile labels, diagrams and final report use the same decisions.
- [ ] All four members sign the Phase 2 contract/handoff record.

## Evidence Needed for Changed Rules

- Boundary tests for exactly seven days and exactly twelve hours.
- Competing approvals proving energy cannot be over-allocated.
- Deactivation rejection with a non-terminal reservation.
- Wrong-role tests for station/slot and approval actions.
- QR invalid, expired, replay and duplicate-finalization tests.
- MongoDB transaction rollback evidence.
- Android SQLite evidence with secrets and tokens redacted.
