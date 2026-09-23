# UI and Evidence Checklist

Purpose: ensure Phase 1 defines every expected web/mobile surface and the evidence each member must collect later.

## Web Screens

| Screen | Owner | Main API Modules | Evidence |
| --- | --- | --- | --- |
| Login | Member 1 | Identity | Screenshot, invalid login test |
| Role-based dashboard shell | Member 1 | Identity | Backoffice/Grid Operator routing screenshot |
| User management | Member 1 | Identity | Create/list/deactivate/reactivate screenshots |
| Prosumer management | Member 1 | Identity | Prosumer list/status screenshots |
| Station dashboard | Member 2 | Station/Slot | Station table screenshot |
| Create/edit station | Member 2 | Station/Slot | Form validation screenshots |
| Slot/schedule management | Member 2 | Station/Slot | Slot creation/list screenshots |
| Booking management | Member 3 | Reservation/Dashboard | Pending/current booking screenshots |
| Booking search/filter | Member 3 | Reservation/Dashboard | Filter result screenshot |
| Operational dashboard | Member 3/4 | Reservation/Transaction | Counts/status screenshots |
| Transaction details | Member 4 | Operator Transaction | Verification/final status screenshot |

## Android Screens

| Screen | Owner | Main API Modules | SQLite Use | Evidence |
| --- | --- | --- | --- | --- |
| Registration | Member 1 | Identity | Optional profile/session after login | Registration screenshot |
| Login | Member 1 | Identity | Store session/reference data | Login screenshot and SQLite evidence |
| Prosumer home | Member 1/3 | Identity, Dashboard | Cached session | Dashboard screenshot |
| Profile view/edit | Member 1 | Identity | Cached user summary | Profile screenshot |
| Nearby station map | Member 2/4 | Station/Slot | Optional station cache | Map screenshot |
| Station details | Member 2 | Station/Slot | Optional station cache | Details screenshot |
| Slot selection | Member 2/3 | Station/Slot, Reservation | Optional reference cache | Slot screenshot |
| Reservation form | Member 3 | Reservation | Session data | Create reservation screenshot |
| Booking history | Member 3 | Reservation/Dashboard | Optional cached references | History screenshot |
| Pending bookings | Member 3 | Reservation/Dashboard | Optional cached references | Pending screenshot |
| Booking summary | Member 3 | Reservation | Session data | Success/error screenshot |
| Operator home | Member 4 | Identity, Dashboard | Session data | Operator home screenshot |
| QR scanner | Member 4 | Operator Transaction | Session data | Scanner screenshot |
| Verification result | Member 4 | Operator Transaction | Session data | Valid/invalid result screenshots |
| Transfer completion | Member 4 | Operator Transaction | Session data | Completion screenshot |

## Required API Evidence

| Area | Owner | Evidence |
| --- | --- | --- |
| Authentication | Member 1 | Valid login, invalid login, inactive account login, role denial |
| Account management | Member 1 | Duplicate NIC, update own profile, blocked cross-user profile update |
| Stations | Member 2 | Create/update/deactivate station, blocked deactivate with active reservation |
| Slots | Member 2 | Create slot, list available slots, blocked overlapping slot |
| Reservations | Member 3 | Create/update/cancel reservation, 7-day rejection, 12-hour rejection |
| Dashboards | Member 3 | Booking counts matching database records |
| QR verification | Member 4 | Valid QR, invalid QR, expired QR |
| Transfer finalization | Member 4 | Successful completion, duplicate completion blocked |
| Deployment | Member 4, Member 1 reviewer | IIS URL called by web and Android |

