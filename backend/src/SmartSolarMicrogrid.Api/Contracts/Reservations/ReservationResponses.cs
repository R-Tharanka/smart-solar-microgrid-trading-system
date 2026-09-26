namespace SmartSolarMicrogrid.Api.Contracts.Reservations;

/// <summary>Full representation of a single energy reservation.</summary>
public sealed record ReservationResponse(
    string ReservationId,
    string ReservationCode,
    string ProsumerNic,
    string StationId,
    string SlotId,
    decimal RequestedEnergyKwh,
    DateTime ScheduledStartTimeUtc,
    DateTime ScheduledEndTimeUtc,
    string Status,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);

/// <summary>Lightweight summary used in list responses.</summary>
public sealed record ReservationSummaryResponse(
    string ReservationId,
    string ReservationCode,
    string ProsumerNic,
    string StationId,
    string SlotId,
    decimal RequestedEnergyKwh,
    DateTime ScheduledStartTimeUtc,
    DateTime ScheduledEndTimeUtc,
    string Status,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);

/// <summary>Operational booking dashboard counts for staff.</summary>
public sealed record DashboardSummaryResponse(
    long PendingCount,
    long ApprovedCount,
    long CompletedCount,
    long CancelledCount,
    long RejectedCount,
    long TotalCount);

/// <summary>Personal booking summary for an authenticated Prosumer.</summary>
public sealed record ProsumerDashboardResponse(
    long PendingCount,
    long ApprovedCount,
    long CompletedCount,
    long CancelledCount,
    long TotalCount);
