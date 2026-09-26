using SmartSolarMicrogrid.Api.Contracts.Reservations;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Services;

public interface IReservationService
{
    /// <summary>Creates a new Pending reservation for the authenticated Prosumer.</summary>
    Task<ReservationResponse> CreateAsync(
        string prosumerNic,
        CreateReservationRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>Returns the details of a single reservation, enforcing Prosumer ownership.</summary>
    Task<ReservationResponse> GetByIdAsync(
        string reservationId,
        string callerIdentifier,
        UserRole callerRole,
        CancellationToken cancellationToken = default);

    /// <summary>Lists the authenticated Prosumer's own reservations with optional status filter.</summary>
    Task<IReadOnlyCollection<ReservationSummaryResponse>> GetOwnAsync(
        string prosumerNic,
        ReservationStatus? status,
        CancellationToken cancellationToken = default);

    /// <summary>Updates the requested energy amount on an editable reservation.</summary>
    Task<ReservationResponse> UpdateAsync(
        string reservationId,
        string prosumerNic,
        UpdateReservationRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>Cancels a Prosumer's own reservation, restoring the slot to Available.</summary>
    Task<ReservationResponse> CancelAsync(
        string reservationId,
        string prosumerNic,
        CancelReservationRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>Approves a Pending reservation (Staff only).</summary>
    Task<ReservationResponse> ApproveAsync(
        string reservationId,
        CancellationToken cancellationToken = default);

    /// <summary>Rejects a Pending reservation with a mandatory reason (Staff only).</summary>
    Task<ReservationResponse> RejectAsync(
        string reservationId,
        RejectReservationRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>Returns a filtered list of all reservations for staff operational views.</summary>
    Task<IReadOnlyCollection<ReservationSummaryResponse>> GetAllAsync(
        string? status,
        string? stationId,
        CancellationToken cancellationToken = default);

    /// <summary>Returns aggregated reservation counts for the operational dashboard.</summary>
    Task<DashboardSummaryResponse> GetDashboardSummaryAsync(
        CancellationToken cancellationToken = default);

    /// <summary>Returns aggregated reservation counts for the authenticated Prosumer's personal dashboard.</summary>
    Task<ProsumerDashboardResponse> GetProsumerDashboardAsync(
        string prosumerNic,
        CancellationToken cancellationToken = default);
}
