# React Web Implementation and UI System

Status: UI modernization complete; transaction surfaces integrated; final live API/browser evidence pending
Owners: Shared web client, with Member 1 identity/account workflows
Audit date: 2026-10-02

## Member 1 API Integration Correction

Web login now sends `clientType: "Web"`. Only active Backoffice and Grid Operator accounts establish Web sessions. Legacy Prosumer sessions are cleared with guidance to use the mobile application; `/prosumer/*` redirects to login. The historical Prosumer Web features described below are superseded by this correction.

Prosumer management includes an addressable `?view=pending` activation queue with profile cards, search, a current pending count, focused review, activation confirmation, and rejection with the required 3–500 character reason. Reviews use the existing pending/activate/reject endpoints through `services/identity.js`. Successful decisions remove the item immediately; returning to all accounts reloads current data. The existing sidebar entry remains the parent of both management views.

All four account statuses are supported. Deactivation requests appear as a separate badge and filter while the account remains Active. The existing administrative action processes requests with confirmation and reservation-aware error feedback. Details expose the request timestamp when available and the safe rejection reason. Web self-deactivation has been removed.

Contract limitations: registration dates and pending duration are not supplied by the user DTO and are therefore omitted. Protected authorization can return an undifferentiated 403; the existing API interceptor performs one shared `/users/me` check after an ambiguous denial, preserving valid sessions on ordinary role denial. It never polls. Backend code is unchanged.

Verification: edited JavaScript/JSX received targeted lint and a production build; current live API and keyboard/responsive acceptance remain manual follow-up. Android source now sends its client type and uses the deactivation-request endpoint with pending feedback, but device/hosted evidence remains.

## Public Home and Route Behavior

The root route now supports a public Home/Index page without changing authenticated role destinations:

| Visitor state at `/` | Destination |
| --- | --- |
| Session is still hydrating | Full-page secure-session loading state |
| Unauthenticated | Public Home/Index page |
| Backoffice | `/backoffice` |
| Grid Operator | `/grid-operator` |
| Legacy Prosumer session | Cleared; redirected to login with mobile application guidance |

The Home/Index page introduces the real system through a generated project-owned microgrid hero image, system workflow, role responsibilities, implemented capabilities, smart-grid relationship visualization, actual project technologies, final sign-in action and project footer. It contains no authenticated records or fabricated operational metrics.

## Shared Design System

- Graphite structural surfaces with light operational workspaces.
- Emerald is the primary energy/action color; cyan identifies grid/network context; amber and red retain warning/error meaning.
- Consistent 6px controls and 8px panels/dialogs, restrained shadows and thin borders.
- `Segoe UI Variable` with local system fallbacks; no remote font dependency.
- Shared `Button`, `IconButton`, `FormField`, `StatusBadge`, `Panel`, `MetricCard`, `Modal`, `ConfirmDialog`, `Alert`, `Toast`, `PageHeader`, `SectionHeader`, loading, empty and error states.
- Tables share one high-contrast header and row treatment. Station and slot pages offer an explicit Cards/List toggle with cards as default in both Backoffice and Grid Operator routes; other management views use their existing responsive table/card patterns.

## Application Shell

The authenticated shell uses one role-aware navigation configuration for all members' pages. Desktop uses a fixed graphite navigation sidebar; smaller screens use an accessible Headless UI drawer. The top bar provides page context, current-user identity, role, profile access, sign out and mobile navigation.

## Motion and Reduced Motion

Motion is limited to page entrance, energy-path movement, loading indicators, dialog transitions, navigation states and subtle hover feedback. The global `prefers-reduced-motion` rule reduces non-essential animation and transition durations.

## Brand Assets

- `web/src/components/BrandMark.jsx`: original solar, connected-node and energy-path identity used in public and authenticated interfaces.
- `web/public/favicon.svg`: matching project-owned favicon.
- `web/public/assets/microgrid-hero.png`: generated project-owned hero visual with no text, logos or fake interface data.
- `web/index.html`: updated favicon, theme color and system description metadata.

## Full-Web Visual Alignment

The same visual system is applied to login, Backoffice and Grid Operator dashboards, staff and Prosumer management, stations, energy slots, reservations, transactions, profile, password security, access denied and not found. A legacy Prosumer Web home source remains but is not an active route. Member 4's transaction routes and components use the shared shell; details are recorded in `docs/web/member-4-react-web.md`.

## Responsive Strategy

- Fluid page padding and a 1500px maximum operational workspace.
- Desktop sidebar becomes a mobile drawer below the large breakpoint.
- Multi-column forms collapse to one column.
- Management tables become touch-friendly record cards below the medium breakpoint.
- Dialogs use viewport-aware maximum heights and internal scrolling.
- Public sections use responsive grids and avoid fixed-width content.
- Supported verification targets: 1440, 1280, 1024, 768, 390 and 360 CSS pixels.

## Scope Completed

- Web login using a staff email and `clientType: Web`; Prosumer accounts are directed to Android.
- Centralized JWT/session persistence with server-provided expiry.
- Startup profile refresh through `GET /api/users/me`.
- Global expired/invalid-session handling.
- Backoffice and Grid Operator role destinations; legacy Prosumer Web sessions are cleared.
- Protected routes and an explicit access-denied page.
- Responsive role-aware navigation and logout.
- Backoffice staff list, search, role/status filters and empty/error/loading states.
- Backoffice creation of Backoffice and Grid Operator staff accounts with contract-aligned validation.
- Staff deactivation/reactivation with confirmation and immediate local updates.
- Prosumer list/details/search/status filters, Backoffice creation/editing, and status management.
- Friendly `USER_ACTIVE_RESERVATIONS` and other identity error messages.
- Current-user profile display/update for all roles.
- Backoffice pending-activation review and administrative Prosumer deactivation/reactivation; Prosumer self-deactivation is not a Web action.
- Password change with confirmation, visibility controls and validation.
- Shared buttons, fields, alerts, loaders, empty/error states, status badges, modals, confirmation dialogs, page headers and toast notifications.

## Routes

| Route | Roles | Purpose |
| --- | --- | --- |
| `/login` | Public only | Authenticate by business identifier |
| `/backoffice/staff` | Backoffice | Manage staff accounts |
| `/backoffice/prosumers` | Backoffice | Manage Prosumer accounts |
| `/account/profile` | Backoffice, Grid Operator | View/update current profile |
| `/account/security` | Backoffice, Grid Operator | Change current password |
| `/prosumer/*` | None | Redirect legacy Prosumer Web URLs to login |
| `/access-denied` | Authenticated | Wrong-role route feedback |

Existing Member 2 and Member 3 station, slot and reservation routes remain unchanged.

## API Integration

| Method and endpoint | Web workflow |
| --- | --- |
| `POST /api/users/login` | Login and role routing |
| `GET /api/users/me` | Session hydration/current profile |
| `PUT /api/users/me` | Profile update |
| `POST /api/users/change-password` | Password change |
| `GET /api/users` | Staff and Prosumer lists |
| `POST /api/users/staff` | Create Backoffice/Grid Operator |
| `POST /api/users/prosumers` | Backoffice creates a Prosumer |
| `PUT /api/users/prosumers/{nic}` | Backoffice updates a Prosumer profile |
| `GET /api/users/prosumers/pending` | Backoffice activation queue |
| `POST /api/users/prosumers/{nic}/activate` | Activate pending Prosumer |
| `POST /api/users/prosumers/{nic}/reject` | Reject pending Prosumer with reason |
| `POST /api/users/{identifier}/deactivate` | Staff/Prosumer deactivation |
| `POST /api/users/{identifier}/reactivate` | Staff/Prosumer reactivation |

All responses follow the existing API envelope and RFC 7807 Problem Details contracts. The API remains the authorization and business-rule boundary.

## Security Decisions

- Passwords are never written to browser storage or logs.
- The browser stores only the access token, public user summary and expiry timestamp.
- Client role checks control navigation only; the API still enforces every protected operation.
- A `401` clears the session and presents a sign-in notice, except expected login failures handled by the login form.
- Startup calls `/users/me` to refresh account status/profile data.
- Server `500` details are not displayed to users.
- Internal MongoDB identifiers are not shown or used by Member 1 screens.

## Verification Performed

Commands completed successfully:

```powershell
cd web
npm test
npm run lint
npm run build
```

Results:

- 9 focused session/error utility tests passed.
- Production Vite build passed (667 modules transformed).
- ESLint passed with 0 errors. Seven warnings remain in pre-existing Member 2/3 files.
- Headless Microsoft Edge rendered login, staff, create-staff dialog and profile views.
- Desktop viewport: 1440 x 1000, no horizontal overflow.
- Mobile viewport: 390 x 844, no horizontal overflow.
- Browser console/page errors: none.
- Contract-mocked browser workflows passed for staff creation, profile update, password mismatch/success, role denial and expired-session redirect.
- Production dependency audit reported no high-severity vulnerability. Two moderate React Router advisories require a breaking React Router 7 upgrade and remain for a coordinated frontend dependency update.

The API was not running at `localhost:5080` during final browser verification. Therefore, contract-mocked browser results do not replace the required final live API/Postman evidence.

## Final Live Evidence Checklist

Use redacted test accounts and capture:

- [ ] Login page at desktop and mobile widths.
- [ ] Successful Backoffice login and automatic dashboard routing.
- [ ] Successful Grid Operator login and automatic dashboard routing.
- [ ] Prosumer Web login is denied with mobile-app guidance.
- [ ] Pending Prosumer activation/rejection and rejected resubmission are reflected in the Backoffice queue.
- [ ] Deactivation-request indicator appears separately from Active status and is removed after administrative processing.
- [ ] Invalid credentials response.
- [ ] Inactive account response.
- [ ] Protected route redirect after clearing the session.
- [ ] Access-denied page for a wrong-role route.
- [ ] Staff list with Backoffice and Grid Operator records.
- [ ] Successful Backoffice staff creation.
- [ ] Successful Grid Operator staff creation.
- [ ] Duplicate staff email conflict.
- [ ] Staff deactivate/reactivate confirmation and result.
- [ ] Final-active-Backoffice and self-deactivation safeguards.
- [ ] Prosumer list, details, create, update, deactivate and Backoffice-only reactivate.
- [ ] `USER_ACTIVE_RESERVATIONS` deactivation rejection.
- [ ] Current profile before and after an update.
- [ ] Password mismatch, incorrect-current-password and successful change states.
- [ ] Responsive sidebar, table-to-card behavior, forms and dialogs.

Do not show full JWTs, passwords, signing keys, MongoDB credentials or real personal data in evidence.

## Live Verification Steps

1. Start the Atlas-backed API and confirm `/health/ready` returns `200`.
2. Start the web client with `npm run dev`.
3. Set `VITE_API_BASE_URL` only when the API is not at `http://localhost:5080/api`.
4. Execute the identity Postman collection first to create known test accounts.
5. Complete each checklist item above in the browser.
6. Confirm the corresponding `users` changes in Atlas with secrets and hashes redacted.

## Scope Boundary

No Android, MongoDB schema, station/slot backend, reservation backend or transaction backend code was changed by the shared UI modernization. Member 4's transaction UI was integrated separately and is documented in `docs/web/member-4-react-web.md`.
