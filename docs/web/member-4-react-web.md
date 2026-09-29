# Member 4 React Web — Operator Transactions

Owner: Member 4  
Status: Implemented

## Scope

The React web contribution provides the operational transaction surface defined by the project UI checklist. QR camera scanning and Google Maps remain Android requirements; the web workspace accepts already-decoded QR JSON as an operational fallback.

## Routes

| Route | Role | Purpose |
| --- | --- | --- |
| `/grid-operator/transactions` | Grid Operator | Verify QR transactions, finalize energy transfers, and inspect audit details. |
| `/backoffice/transactions` | Backoffice | Read-only transaction and operator-audit view. |

Both routes are protected by the existing role-aware route guard. The API remains the authority for every authorization and lifecycle decision.

## API Integration

- `GET /api/reservations` loads operational reservation summaries and displays `QrIssued`, `Verified`, and `Completed` records.
- `POST /api/transactions/verify` submits the reservation code and opaque token decoded from the QR payload.
- `POST /api/transactions/finalize` records the confirmation note and actual transferred energy.
- `GET /api/transactions/{reservationCode}` loads verification and finalization audit details.

The QR token is held only in component state for the verification request. It is not written to local storage or displayed in transaction history.

## User Experience and Validation

- Responsive desktop table and mobile cards.
- Transaction-state metrics and status filtering.
- Search by reservation code, Prosumer NIC, or station identifier.
- QR JSON parsing with required-field, token-length, and expiry-format checks.
- Actual transferred energy must be positive and cannot exceed reserved energy.
- Friendly messages map Member 4 Problem Details error codes.
- Duplicate, expired, unauthorized, and invalid-state operations remain enforced by the API.

## Verification

Run from `web`:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Assessment evidence should include the operator transaction dashboard, valid and invalid QR verification, successful transfer finalization, duplicate completion rejection, completed audit details, and the corresponding MongoDB reservation/slot records.
