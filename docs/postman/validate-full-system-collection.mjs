import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const collectionPath = join(dirname(fileURLToPath(import.meta.url)),
  "Smart-Solar-Microgrid-Full-System.postman_collection.json");
const collection = JSON.parse(readFileSync(collectionPath, "utf8"));

const flatten = (items) => items.flatMap((item) => item.item ? flatten(item.item) : [item]);
const requests = flatten(collection.item);
const scriptSources = [];
const scriptErrors = [];
let testAssertions = 0;

for (const item of requests) {
  for (const event of item.event ?? []) {
    const source = event.script.exec.join("\n");
    scriptSources.push(source);
    testAssertions += (source.match(/pm\.test\(/g) ?? []).length;
    try {
      // Compile without executing so Postman globals are not required.
      new Function(source);
    } catch (error) {
      scriptErrors.push(`${item.name} (${event.listen}): ${error.message}`);
    }
  }
}

function normalizeUrl(url) {
  let path = url
    .replace("{{baseUrl}}", "")
    .replace(/\?.*/, "")
    .replace(/\{\{(?:cancelReservationId|rejectReservationId|reservationId)\}\}/g, "{reservationId}")
    .replace(/\{\{stationCode\}\}/g, "{stationCode}")
    .replace(/\{\{slotCode\}\}/g, "{slotCode}")
    .replace(/\{\{reservationCode\}\}/g, "{reservationCode}")
    .replace(/\{\{(?:prosumerNic|rejectedProsumerNic)\}\}/g, "{nic}");
  path = path.replace(/\{\{managedProsumerNic\}\}/g,
    path.startsWith("/api/users/prosumers/") ? "{nic}" : "{identifier}");
  return path;
}

const expectedControllerRoutes = [
  "GET /api/system/info",
  "POST /api/users/prosumer/register",
  "POST /api/users/prosumers",
  "PUT /api/users/prosumers/{nic}",
  "GET /api/users/prosumers/pending",
  "POST /api/users/prosumers/{nic}/activate",
  "POST /api/users/prosumers/{nic}/reject",
  "POST /api/users/staff",
  "POST /api/users/login",
  "GET /api/users/me",
  "PUT /api/users/me",
  "POST /api/users/change-password",
  "POST /api/users/me/deactivation-request",
  "POST /api/users/{identifier}/reactivate",
  "POST /api/users/{identifier}/deactivate",
  "GET /api/users",
  "POST /api/stations",
  "GET /api/stations",
  "GET /api/stations/{stationCode}",
  "PUT /api/stations/{stationCode}",
  "PATCH /api/stations/{stationCode}/status",
  "POST /api/stations/{stationCode}/slots",
  "GET /api/stations/{stationCode}/slots",
  "GET /api/slots/{slotCode}",
  "PUT /api/slots/{slotCode}",
  "PATCH /api/slots/{slotCode}/status",
  "POST /api/reservations",
  "GET /api/reservations/me",
  "GET /api/reservations/{reservationId}",
  "PUT /api/reservations/{reservationId}",
  "POST /api/reservations/{reservationId}/cancel",
  "POST /api/reservations/{reservationId}/approve",
  "POST /api/reservations/{reservationId}/reject",
  "GET /api/reservations",
  "GET /api/dashboard/summary",
  "GET /api/dashboard/me",
  "POST /api/reservations/{reservationId}/qr",
  "POST /api/transactions/verify",
  "POST /api/transactions/finalize",
  "GET /api/transactions/{reservationCode}"
];

const actualRoutes = new Set(requests.map((item) =>
  `${item.request.method} ${normalizeUrl(item.request.url)}`));
const missingRoutes = expectedControllerRoutes.filter((route) => !actualRoutes.has(route));
const requiredHealthRoutes = ["GET /health/live", "GET /health/ready"];
const missingHealthRoutes = requiredHealthRoutes.filter((route) => !actualRoutes.has(route));
const savedQrVariables = collection.variable
  .filter((variable) => /qr.*token|transactiontoken/i.test(variable.key))
  .map((variable) => variable.key);
const joinedScripts = scriptSources.join("\n");
const qrTokenStoredInCollectionScope = /collectionVariables\.(?:set|get)\(['"]qrToken/.test(joinedScripts);
const qrTokenConsoleLogging = /console\.(?:log|warn|error)[^\n]*(?:qrToken|transactionToken)/i.test(joinedScripts);

const result = {
  folders: collection.item.length,
  requests: requests.length,
  testAssertions,
  controllerRoutesCovered: expectedControllerRoutes.length - missingRoutes.length,
  controllerRoutesExpected: expectedControllerRoutes.length,
  missingRoutes,
  missingHealthRoutes,
  scriptSyntaxErrors: scriptErrors,
  savedQrVariables,
  qrTokenStoredInCollectionScope,
  qrTokenConsoleLogging
};

console.log(JSON.stringify(result, null, 2));

if (missingRoutes.length || missingHealthRoutes.length || scriptErrors.length ||
    savedQrVariables.length || qrTokenStoredInCollectionScope || qrTokenConsoleLogging) {
  process.exitCode = 1;
}
