# Phase 2 API Contract Governance

## 1. Contract Sources

Detailed request examples, response DTOs, validation and error cases are defined in:

- `docs/api-contracts/identity-api.md`
- `docs/api-contracts/station-slot-api.md`
- `docs/api-contracts/reservation-dashboard-api.md`
- `docs/api-contracts/operator-transaction-api.md`

The shared behavior in `architecture-database-api-contracts.md` applies to every endpoint and overrides older Phase 1 response-format examples where they differ.

## 2. Endpoint Ownership and Client Map

| Endpoint group | Owner | Web client | Android client | Collections |
| --- | --- | --- | --- | --- |
| Register Prosumer | M1 | Optional public screen | Prosumer registration | `users` |
| Login / current user / change password | M1 | All web roles | Prosumer and operator | `users` |
| Staff and user management | M1 | Backoffice | None | `users` |
| Own Prosumer profile | M1 | Optional | Profile | `users` |
| Station list/details | M2 | Staff station views | Map and station details | `solarStationInfo` |
| Station create/update/status | M2 | Backoffice | Operator reads status | `solarStationInfo`, reservations for guards |
| Slot create/update/status | M2 | Backoffice schedule views | Availability reads | `energyBookingSlots`, stations |
| Create/update/cancel own reservation | M3 | None | Prosumer booking flow | reservations, slots, users |
| Reservation details/history | M3 | Staff booking view | Prosumer history | reservations, stations, slots |
| Approve/reject reservation | M3 | Backoffice/Grid Operator | Operator optional | reservations, slots |
| Operations list and dashboards | M3 | Staff dashboards | Prosumer/operator home | all four, read-only aggregation |
| Issue QR | M4 | Staff booking view | Prosumer booking detail | reservations |
| Verify QR / finalize transfer | M4 | Optional operations view | Operator scanner/confirmation | reservations, users |
| Transaction details | M4 | Staff audit view | Operator result | reservations, stations, slots |

## 3. Cross-Domain Calls

- M3 calls M1 user lookup to validate an active Prosumer; it never queries credentials.
- M3 calls M2 station/slot services to validate availability and reserve/release slots.
- M4 calls M3 reservation workflow methods for guarded state transitions.
- Dashboards read through repositories or query services owned by each domain; they do not reimplement mutation rules.
- Contract DTOs are not MongoDB persistence models.

## 4. Change Control

Before changing a route, field, enum, validation rule, status code or authorization policy:

1. Owner updates the relevant contract document.
2. Affected web/mobile consumers review the change.
3. Collection/index impact is reviewed by the data owner.
4. At least one other member approves.
5. Implementation and tests change in the same pull request.

Additive optional fields are backward compatible. Removing/renaming fields, narrowing permissions, or changing meanings is breaking and requires coordinated client work.

## 5. Definition of Ready for Phase 3

An endpoint is ready to implement when its contract names the route, method, request, response, authorization, validation, errors, collections, owner and consuming client. All currently planned endpoints satisfy this through the four contract documents plus this shared governance file.
