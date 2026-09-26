using System.Collections.ObjectModel;
using System.Security.Cryptography;
using MongoDB.Bson;
using SmartSolarMicrogrid.Api.Contracts.Reservations;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Persistence.Repositories;

namespace SmartSolarMicrogrid.Api.Services;

public sealed class ReservationService(
    IReservationRepository reservationRepository,
    ISolarStationRepository stationRepository,
    IBookingSlotRepository slotRepository,
    TimeProvider timeProvider,
    ILogger<ReservationService> logger) : IReservationService
{
    // Maximum number of calendar days ahead that a slot may start.
    private const int BookingWindowDays = 7;

    // Minimum notice in hours required before a reservation's start for updates/cancellations.
    private const int NoticePeriodHours = 12;

    // -------------------------------------------------------------------------
    // CREATE
    // -------------------------------------------------------------------------

    public async Task<ReservationResponse> CreateAsync(
        string prosumerNic,
        CreateReservationRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate station
        if (!ObjectId.TryParse(request.StationId, out var stationOid))
            throw ReservationException.Validation("RESERVATION_STATION_NOT_FOUND", "Station not found.");

        var station = await stationRepository.FindByIdAsync(stationOid, cancellationToken)
            ?? throw ReservationException.Validation("RESERVATION_STATION_NOT_FOUND", "Station not found.");

        if (station.Status != StationStatus.Active)
            throw ReservationException.Validation("RESERVATION_STATION_NOT_ACTIVE",
                "The selected station is not currently active.");

        // Validate slot
        if (!ObjectId.TryParse(request.SlotId, out var slotOid))
            throw ReservationException.Validation("RESERVATION_SLOT_NOT_FOUND", "Booking slot not found.");

        var slot = await slotRepository.FindByIdAsync(slotOid, cancellationToken)
            ?? throw ReservationException.Validation("RESERVATION_SLOT_NOT_FOUND", "Booking slot not found.");

        if (slot.Status != SlotStatus.Available)
            throw ReservationException.Conflict("RESERVATION_SLOT_NOT_AVAILABLE",
                "The selected booking slot is not available for reservation.");

        // Validate energy
        if (request.RequestedEnergyKwh <= 0)
            throw ReservationException.Validation("RESERVATION_ENERGY_INVALID",
                "Requested energy must be greater than zero.");

        if (request.RequestedEnergyKwh > slot.AvailableEnergyKwh)
            throw ReservationException.Validation("RESERVATION_ENERGY_INVALID",
                $"Requested energy ({request.RequestedEnergyKwh} kWh) exceeds the slot's available energy ({slot.AvailableEnergyKwh} kWh).");

        // Validate 7-day booking window
        var now = UtcNow();
        var maxStart = now.AddDays(BookingWindowDays);
        if (slot.StartTimeUtc > maxStart)
            throw ReservationException.Validation("RESERVATION_WINDOW_INVALID",
                $"Reservations can only be made for slots starting within {BookingWindowDays} days.");

        if (slot.StartTimeUtc <= now)
            throw ReservationException.Validation("RESERVATION_WINDOW_INVALID",
                "The selected slot has already started or passed.");

        // Slot belongs to the requested station
        if (slot.StationId != stationOid)
            throw ReservationException.Validation("RESERVATION_SLOT_NOT_FOUND",
                "The selected slot does not belong to the specified station.");

        var code = await GenerateUniqueCodeAsync(now, cancellationToken);

        var reservation = new EnergyReservation
        {
            ReservationCode = code,
            ProsumerNic = prosumerNic,
            StationId = stationOid,
            SlotId = slotOid,
            RequestedEnergyKwh = request.RequestedEnergyKwh,
            ScheduledStartTimeUtc = slot.StartTimeUtc,
            ScheduledEndTimeUtc = slot.EndTimeUtc,
            Status = ReservationStatus.Pending
        };

        // Persist reservation first; the partial unique index on slotId for active statuses
        // will reject a duplicate if a concurrent request beats us.
        await reservationRepository.CreateAsync(reservation, cancellationToken);

        // Change slot status to Reserved.
        await slotRepository.UpdateStatusByIdAsync(slotOid, SlotStatus.Reserved, cancellationToken);

        logger.LogInformation(
            "Reservation {Code} created for Prosumer {Nic} on slot {SlotId}",
            code, prosumerNic, slotOid);

        return MapToResponse(reservation);
    }

    // -------------------------------------------------------------------------
    // GET BY ID
    // -------------------------------------------------------------------------

    public async Task<ReservationResponse> GetByIdAsync(
        string reservationId,
        string callerIdentifier,
        UserRole callerRole,
        CancellationToken cancellationToken = default)
    {
        var reservation = await reservationRepository.FindByIdAsync(reservationId, cancellationToken)
            ?? throw ReservationException.NotFound();

        // Prosumers can only view their own reservations.
        if (callerRole == UserRole.Prosumer &&
            !string.Equals(reservation.ProsumerNic, callerIdentifier, StringComparison.OrdinalIgnoreCase))
        {
            throw ReservationException.NotOwned();
        }

        return MapToResponse(reservation);
    }

    // -------------------------------------------------------------------------
    // GET OWN (PROSUMER HISTORY)
    // -------------------------------------------------------------------------

    public async Task<IReadOnlyCollection<ReservationSummaryResponse>> GetOwnAsync(
        string prosumerNic,
        ReservationStatus? status,
        CancellationToken cancellationToken = default)
    {
        var reservations = await reservationRepository.GetByProsumerAsync(prosumerNic, status, cancellationToken);
        return reservations.Select(MapToSummary).ToList();
    }

    // -------------------------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------------------------

    public async Task<ReservationResponse> UpdateAsync(
        string reservationId,
        string prosumerNic,
        UpdateReservationRequest request,
        CancellationToken cancellationToken = default)
    {
        var reservation = await reservationRepository.FindByIdAsync(reservationId, cancellationToken)
            ?? throw ReservationException.NotFound();

        if (!string.Equals(reservation.ProsumerNic, prosumerNic, StringComparison.OrdinalIgnoreCase))
            throw ReservationException.NotOwned();

        // Only Pending or Approved reservations may be updated.
        if (reservation.Status is not (ReservationStatus.Pending or ReservationStatus.Approved))
            throw ReservationException.Validation("RESERVATION_INVALID_STATUS",
                $"Reservations in '{reservation.Status}' status cannot be updated.");

        // Enforce 12-hour notice period.
        var now = UtcNow();
        var cutoff = reservation.ScheduledStartTimeUtc.AddHours(-NoticePeriodHours);
        if (now >= cutoff)
            throw ReservationException.Validation("RESERVATION_NOTICE_PERIOD",
                $"Reservations must be updated at least {NoticePeriodHours} hours before the scheduled start.");

        // Validate revised energy amount.
        var slot = await slotRepository.FindByIdAsync(reservation.SlotId, cancellationToken)
            ?? throw ReservationException.Validation("RESERVATION_SLOT_NOT_FOUND", "The associated slot was not found.");

        if (request.RequestedEnergyKwh <= 0)
            throw ReservationException.Validation("RESERVATION_ENERGY_INVALID",
                "Requested energy must be greater than zero.");

        if (request.RequestedEnergyKwh > slot.AvailableEnergyKwh)
            throw ReservationException.Validation("RESERVATION_ENERGY_INVALID",
                $"Requested energy ({request.RequestedEnergyKwh} kWh) exceeds the slot's available energy ({slot.AvailableEnergyKwh} kWh).");

        // Editable statuses — used as the conditional filter in the atomic update.
        ReadOnlyCollection<ReservationStatus> editableStatuses =
            new([ReservationStatus.Pending, ReservationStatus.Approved]);

        // Atomically update ONLY requestedEnergyKwh and updatedAtUtc.
        // UpdateEnergyAsync conditions the filter on id, prosumerNic, and editable statuses,
        // so QR/transaction fields owned by Member 4 are never touched by this operation.
        if (!await reservationRepository.UpdateEnergyAsync(
                reservation.Id, prosumerNic, editableStatuses,
                request.RequestedEnergyKwh, now, cancellationToken))
        {
            throw ReservationException.Conflict("RESERVATION_INVALID_STATUS",
                "The reservation could not be updated. Its status may have changed.");
        }

        logger.LogInformation("Reservation {Code} updated by Prosumer {Nic}", reservation.ReservationCode, prosumerNic);
        reservation.RequestedEnergyKwh = request.RequestedEnergyKwh;
        reservation.UpdatedAtUtc = now;
        return MapToResponse(reservation);
    }

    // -------------------------------------------------------------------------
    // CANCEL
    // -------------------------------------------------------------------------

    public async Task<ReservationResponse> CancelAsync(
        string reservationId,
        string prosumerNic,
        CancelReservationRequest request,
        CancellationToken cancellationToken = default)
    {
        var reservation = await reservationRepository.FindByIdAsync(reservationId, cancellationToken)
            ?? throw ReservationException.NotFound();

        if (!string.Equals(reservation.ProsumerNic, prosumerNic, StringComparison.OrdinalIgnoreCase))
            throw ReservationException.NotOwned();

        // Only Pending or Approved reservations may be cancelled.
        if (reservation.Status is not (ReservationStatus.Pending or ReservationStatus.Approved))
            throw ReservationException.Validation("RESERVATION_INVALID_STATUS",
                $"Reservations in '{reservation.Status}' status cannot be cancelled.");

        // Enforce 12-hour notice period.
        var now = UtcNow();
        var cutoff = reservation.ScheduledStartTimeUtc.AddHours(-NoticePeriodHours);
        if (now >= cutoff)
            throw ReservationException.Validation("RESERVATION_NOTICE_PERIOD",
                $"Reservations must be cancelled at least {NoticePeriodHours} hours before the scheduled start.");

        // Atomically transition to Cancelled.
        if (!await reservationRepository.UpdateStatusAsync(
                reservation.Id, reservation.Status, ReservationStatus.Cancelled, now, cancellationToken))
        {
            throw ReservationException.Conflict("RESERVATION_INVALID_STATUS",
                "The reservation could not be cancelled. Its status may have changed.");
        }

        // Restore the slot only if no other active reservation now holds it.
        // The partial unique index guarantees at most one active reservation per slot, so we can
        // safely restore the slot to Available after we have atomically cancelled this reservation.
        await slotRepository.UpdateStatusByIdAsync(reservation.SlotId, SlotStatus.Available, cancellationToken);

        reservation.Status = ReservationStatus.Cancelled;
        reservation.UpdatedAtUtc = now;

        logger.LogInformation("Reservation {Code} cancelled by Prosumer {Nic}", reservation.ReservationCode, prosumerNic);
        return MapToResponse(reservation);
    }

    // -------------------------------------------------------------------------
    // APPROVE (Staff)
    // -------------------------------------------------------------------------

    public async Task<ReservationResponse> ApproveAsync(
        string reservationId,
        CancellationToken cancellationToken = default)
    {
        var reservation = await reservationRepository.FindByIdAsync(reservationId, cancellationToken)
            ?? throw ReservationException.NotFound();

        if (reservation.Status != ReservationStatus.Pending)
            throw ReservationException.Validation("RESERVATION_APPROVAL_INVALID",
                $"Only a Pending reservation can be approved. Current status: '{reservation.Status}'.");

        var now = UtcNow();
        if (!await reservationRepository.UpdateStatusAsync(
                reservation.Id, ReservationStatus.Pending, ReservationStatus.Approved, now, cancellationToken))
        {
            throw ReservationException.Conflict("RESERVATION_APPROVAL_INVALID",
                "The reservation could not be approved. Its status may have changed.");
        }

        reservation.Status = ReservationStatus.Approved;
        reservation.UpdatedAtUtc = now;

        logger.LogInformation("Reservation {Code} approved", reservation.ReservationCode);
        return MapToResponse(reservation);
    }

    // -------------------------------------------------------------------------
    // REJECT (Staff)
    // -------------------------------------------------------------------------

    public async Task<ReservationResponse> RejectAsync(
        string reservationId,
        RejectReservationRequest request,
        CancellationToken cancellationToken = default)
    {
        var reservation = await reservationRepository.FindByIdAsync(reservationId, cancellationToken)
            ?? throw ReservationException.NotFound();

        if (reservation.Status != ReservationStatus.Pending)
            throw ReservationException.Validation("RESERVATION_APPROVAL_INVALID",
                $"Only a Pending reservation can be rejected. Current status: '{reservation.Status}'.");

        if (string.IsNullOrWhiteSpace(request.Reason))
            throw ReservationException.Validation("RESERVATION_REJECTION_REASON_REQUIRED",
                "A rejection reason is required.");

        var now = UtcNow();
        var trimmedReason = request.Reason.Trim();

        // RejectWithNoteAsync atomically sets status=Rejected, confirmationNote=reason, updatedAtUtc
        // in a single MongoDB UpdateOne conditioned on status==Pending.
        if (!await reservationRepository.RejectWithNoteAsync(reservation.Id, trimmedReason, now, cancellationToken))
        {
            throw ReservationException.Conflict("RESERVATION_APPROVAL_INVALID",
                "The reservation could not be rejected. Its status may have changed.");
        }

        // Restore the slot to Available so it can be reserved again.
        await slotRepository.UpdateStatusByIdAsync(reservation.SlotId, SlotStatus.Available, cancellationToken);

        reservation.Status = ReservationStatus.Rejected;
        reservation.ConfirmationNote = trimmedReason;
        reservation.UpdatedAtUtc = now;

        logger.LogInformation("Reservation {Code} rejected. Reason: {Reason}", reservation.ReservationCode, trimmedReason);
        return MapToResponse(reservation);
    }

    // -------------------------------------------------------------------------
    // STAFF LIST
    // -------------------------------------------------------------------------

    public async Task<IReadOnlyCollection<ReservationSummaryResponse>> GetAllAsync(
        string? status,
        string? stationId,
        CancellationToken cancellationToken = default)
    {
        ReservationStatus? parsedStatus = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<ReservationStatus>(status, ignoreCase: true, out var s))
                throw ReservationException.Validation("RESERVATION_INVALID_STATUS",
                    $"'{status}' is not a valid reservation status.");
            parsedStatus = s;
        }

        ObjectId? stationOid = null;
        if (!string.IsNullOrWhiteSpace(stationId))
        {
            if (!ObjectId.TryParse(stationId, out var oid))
                throw ReservationException.Validation("RESERVATION_STATION_NOT_FOUND", "Invalid station identifier.");
            stationOid = oid;
        }

        var reservations = await reservationRepository.GetAllAsync(parsedStatus, stationOid, cancellationToken);
        return reservations.Select(MapToSummary).ToList();
    }

    // -------------------------------------------------------------------------
    // DASHBOARDS
    // -------------------------------------------------------------------------

    public async Task<DashboardSummaryResponse> GetDashboardSummaryAsync(
        CancellationToken cancellationToken = default)
    {
        var counts = await reservationRepository.GetStatusCountsAsync(cancellationToken);
        return new DashboardSummaryResponse(
            PendingCount: GetCount(counts, ReservationStatus.Pending),
            ApprovedCount: GetCount(counts, ReservationStatus.Approved),
            CompletedCount: GetCount(counts, ReservationStatus.Completed),
            CancelledCount: GetCount(counts, ReservationStatus.Cancelled),
            RejectedCount: GetCount(counts, ReservationStatus.Rejected),
            TotalCount: counts.Values.Sum());
    }

    public async Task<ProsumerDashboardResponse> GetProsumerDashboardAsync(
        string prosumerNic,
        CancellationToken cancellationToken = default)
    {
        var counts = await reservationRepository.GetProsumerStatusCountsAsync(prosumerNic, cancellationToken);
        return new ProsumerDashboardResponse(
            PendingCount: GetCount(counts, ReservationStatus.Pending),
            ApprovedCount: GetCount(counts, ReservationStatus.Approved),
            CompletedCount: GetCount(counts, ReservationStatus.Completed),
            CancelledCount: GetCount(counts, ReservationStatus.Cancelled),
            TotalCount: counts.Values.Sum());
    }

    // -------------------------------------------------------------------------
    // PRIVATE HELPERS
    // -------------------------------------------------------------------------

    private DateTime UtcNow() => timeProvider.GetUtcNow().UtcDateTime;

    private static long GetCount(Dictionary<ReservationStatus, long> counts, ReservationStatus key) =>
        counts.TryGetValue(key, out var v) ? v : 0L;

    /// <summary>
    /// Generates a unique reservation code in the format RSV-YYYYMMDD-XXXXX.
    /// Uses a cryptographically secure random alphanumeric suffix and retries on collision.
    /// </summary>
    private async Task<string> GenerateUniqueCodeAsync(DateTime utcNow, CancellationToken cancellationToken)
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // unambiguous charset
        const int suffixLength = 6;
        const int maxAttempts = 10;
        var datePart = utcNow.ToString("yyyyMMdd");

        for (var attempt = 0; attempt < maxAttempts; attempt++)
        {
            var suffix = new string(RandomNumberGenerator.GetItems<char>(chars, suffixLength));
            var code = $"RSV-{datePart}-{suffix}";
            var existing = await reservationRepository.FindByCodeAsync(code, cancellationToken);
            if (existing is null) return code;
        }

        throw new InvalidOperationException("Failed to generate a unique reservation code after multiple attempts.");
    }

    private static ReservationResponse MapToResponse(EnergyReservation r) =>
        new(r.Id.ToString(), r.ReservationCode, r.ProsumerNic,
            r.StationId.ToString(), r.SlotId.ToString(), r.RequestedEnergyKwh,
            r.ScheduledStartTimeUtc, r.ScheduledEndTimeUtc, r.Status.ToString(),
            r.ConfirmationNote,
            r.CreatedAtUtc, r.UpdatedAtUtc);

    private static ReservationSummaryResponse MapToSummary(EnergyReservation r) =>
        new(r.Id.ToString(), r.ReservationCode, r.ProsumerNic,
            r.StationId.ToString(), r.SlotId.ToString(), r.RequestedEnergyKwh,
            r.ScheduledStartTimeUtc, r.ScheduledEndTimeUtc, r.Status.ToString(),
            r.CreatedAtUtc, r.UpdatedAtUtc);
}
