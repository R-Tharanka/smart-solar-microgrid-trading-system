# Phase 1 Architecture and Analysis Diagrams

These Mermaid diagrams can be pasted into the report or rendered by Markdown tools that support Mermaid.

## System Architecture

```mermaid
flowchart TD
    Web[React Web App] -->|REST JSON| API[ASP.NET Core Web API]
    Android[Native Android Java App] -->|REST JSON| API
    API --> Auth[Authentication and Authorization]
    API --> Services[Service Layer]
    Services --> Rules[Business Rule Validation]
    Services --> Repos[Repository Layer]
    Repos --> Mongo[(MongoDB)]
    Android --> SQLite[(SQLite)]
```

## Use Case Diagram

```mermaid
flowchart LR
    Backoffice((Backoffice))
    Operator((Grid Operator))
    Prosumer((Prosumer))

    Backoffice --> Login[Login]
    Backoffice --> ManageUsers[Manage Users]
    Backoffice --> ManageStations[Manage Stations]
    Backoffice --> ManageBookings[Manage/View Bookings]

    Operator --> Login
    Operator --> ViewOperationalBookings[View Operational Bookings]
    Operator --> ScanQR[Scan QR]
    Operator --> VerifyTransaction[Verify Transaction]
    Operator --> FinalizeTransfer[Finalize Transfer]

    Prosumer --> Register[Register]
    Prosumer --> Login
    Prosumer --> UpdateProfile[Update Profile]
    Prosumer --> ViewStations[View Nearby Stations]
    Prosumer --> ReserveSlot[Reserve Energy Slot]
    Prosumer --> ManageOwnBookings[Update/Cancel Own Bookings]
    Prosumer --> ViewHistory[View History]
```

## Level 0 DFD

```mermaid
flowchart TD
    Web[Web Client] -->|Admin/Operator Requests| API[Central API]
    Mobile[Android Client] -->|Prosumer/Operator Requests| API
    API -->|User CRUD/Auth| Users[(User Details)]
    API -->|Station CRUD| Stations[(SolarStationInfo)]
    API -->|Slot CRUD| Slots[(EnergyBookingSlots)]
    API -->|Reservation/Transaction CRUD| Reservations[(Energy Reservation)]
    Mobile -->|Local login/reference cache| SQLite[(SQLite)]
```

## Reservation State Model

```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> Approved
    Pending --> Rejected
    Pending --> Cancelled
    Approved --> QrIssued
    Approved --> Cancelled
    QrIssued --> Verified
    QrIssued --> Expired
    Verified --> Completed
    Cancelled --> [*]
    Rejected --> [*]
    Expired --> [*]
    Completed --> [*]
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant Client as Web/Android Client
    participant API as ASP.NET Core API
    participant DB as MongoDB

    Client->>API: POST /api/auth/login
    API->>DB: Find user by email/NIC
    DB-->>API: User account
    API->>API: Verify password hash and account status
    API-->>Client: JWT + user summary
    Client->>API: Protected request with Bearer token
    API->>API: Validate token and role policy
    API-->>Client: Authorized response or 403
```

