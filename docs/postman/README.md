# Full-System Postman Collection

Import `Smart-Solar-Microgrid-Full-System.postman_collection.json` into Postman to exercise the current API contract across identity, stations, slots, reservations, dashboards and QR transactions.

The older identity-only collection is retained as historical Member 1 evidence. The full-system collection is authoritative for current whole-system verification.

## Prerequisites

1. Run the API and a transaction-capable MongoDB deployment. QR finalization uses a MongoDB transaction, so a standalone MongoDB instance may not support the complete workflow.
2. Bootstrap at least one active Backoffice account using secure local configuration.
3. Use an isolated test database. The API has no general delete endpoints, and each collection run creates uniquely named test records.
4. In the imported collection, set:
   - `baseUrl`, normally `http://localhost:5080`;
   - `adminEmail` to the active Backoffice email;
   - secret `adminPassword` to that account's password.

Do not commit real credentials, JWTs, MongoDB connection strings or generated QR payloads.

## Run Order

Use Postman's Collection Runner and run the entire collection in numeric folder order:

1. `00 - Run Setup and Health`
2. `01 - Identity, Authentication and Accounts`
3. `02 - Stations and Booking Slots`
4. `03 - Reservations and Dashboards`
5. `04 - QR Transactions and Finalization`
6. `05 - Password and Account Lifecycle`

The first request generates unique NICs, emails, station/slot codes and future UTC slot times. Later requests capture IDs and JWTs automatically. Running an individual later folder without its prerequisites will leave required variables empty.

## Security Behavior

JWTs are collection variables because they are required throughout the run. Treat them as sensitive and clear them before sharing an exported collection or run result.

Raw QR transaction tokens are stored only in Postman's temporary `pm.variables` run scope. QR A is removed after the old-token rejection check, and QR B is removed immediately after successful verification. The collection does not save either token as a collection or environment variable and does not log them.

The QR sequence verifies initial issuance, renewal, QR A invalidation, QR B verification, excessive-transfer rejection, successful finalization, duplicate-finalization rejection and omission of the stored QR hash from API responses.

## Coverage and Evidence Boundary

The collection contains 73 requests covering all current controller routes plus representative validation and authorization cases. A valid JSON file and passing script-syntax checks prove the artifact is importable; they do not prove the live API, MongoDB, IIS or role workflow.

Run it against the final test environment, export the result, redact secrets, and record the API/database versions and run date before treating it as assessment evidence. Generated database records remain because the API intentionally has no general delete endpoints.

## Regeneration

After editing the maintained generator, regenerate the collection with:

```powershell
node docs/postman/generate-full-system-collection.mjs
```

Then repeat JSON, script and route-coverage validation before committing the generated file.

The maintained validation command is:

```powershell
node docs/postman/validate-full-system-collection.mjs
```
