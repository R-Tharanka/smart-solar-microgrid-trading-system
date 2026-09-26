using MongoDB.Bson;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Persistence.Repositories;

public interface IReservationRepository
{
    /// <summary>Persists a new reservation and stamps audit timestamps.</summary>
    Task CreateAsync(EnergyReservation reservation, CancellationToken cancellationToken = default);

    /// <summary>Finds a reservation by its string-encoded ObjectId.</summary>
    Task<EnergyReservation?> FindByIdAsync(string reservationId, CancellationToken cancellationToken = default);

    /// <summary>Finds a reservation by its unique business reservation code.</summary>
    Task<EnergyReservation?> FindByCodeAsync(string reservationCode, CancellationToken cancellationToken = default);

    /// <summary>Lists reservations for a specific Prosumer, newest scheduled date first.</summary>
    Task<List<EnergyReservation>> GetByProsumerAsync(
        string prosumerNic,
        ReservationStatus? status,
        CancellationToken cancellationToken = default);

    /// <summary>Lists all reservations for staff operational views with optional filters.</summary>
    Task<List<EnergyReservation>> GetAllAsync(
        ReservationStatus? status,
        ObjectId? stationId,
        CancellationToken cancellationToken = default);

    /// <summary>Replaces a reservation document, preserving QR/transaction fields, and refreshes updatedAtUtc.</summary>
    Task<bool> UpdateAsync(EnergyReservation reservation, CancellationToken cancellationToken = default);

    /// <summary>
    /// Atomically transitions a reservation from <paramref name="expectedStatus"/> to
    /// <paramref name="newStatus"/> and refreshes the update timestamp.
    /// Returns true only when exactly one document was modified.
    /// </summary>
    Task<bool> UpdateStatusAsync(
        ObjectId id,
        ReservationStatus expectedStatus,
        ReservationStatus newStatus,
        DateTime changedAtUtc,
        CancellationToken cancellationToken = default);

    /// <summary>Returns status counts for the operational dashboard.</summary>
    Task<Dictionary<ReservationStatus, long>> GetStatusCountsAsync(CancellationToken cancellationToken = default);

    /// <summary>Returns status counts scoped to one Prosumer's reservations.</summary>
    Task<Dictionary<ReservationStatus, long>> GetProsumerStatusCountsAsync(
        string prosumerNic,
        CancellationToken cancellationToken = default);
}
