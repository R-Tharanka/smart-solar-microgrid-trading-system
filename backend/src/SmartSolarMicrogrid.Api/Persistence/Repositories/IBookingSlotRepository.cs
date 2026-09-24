using MongoDB.Bson;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Persistence.Repositories;

public interface IBookingSlotRepository
{
    /// <summary>Finds a slot by its public code.</summary>
    Task<EnergyBookingSlot?> FindByCodeAsync(string slotCode, CancellationToken cancellationToken = default);

    /// <summary>Lists slots for one station using optional filters.</summary>
    Task<List<EnergyBookingSlot>> GetForStationAsync(
        ObjectId stationId,
        DateTime? fromUtc,
        DateTime? toUtc,
        SlotStatus? status,
        CancellationToken cancellationToken = default);
    /// <summary>Checks for intersecting active slot periods at the same station.</summary>
    Task<bool> HasOverlapAsync(
        ObjectId stationId,
        DateTime startTimeUtc,
        DateTime endTimeUtc,
        ObjectId? excludedId = null,
        CancellationToken cancellationToken = default);
    /// <summary>Persists a new energy slot.</summary>
    Task CreateAsync(EnergyBookingSlot slot, CancellationToken cancellationToken = default);

    /// <summary>Replaces an existing energy slot.</summary>
    Task<bool> UpdateAsync(EnergyBookingSlot slot, CancellationToken cancellationToken = default);

    /// <summary>Updates only a slot's availability status.</summary>
    Task<bool> UpdateStatusAsync(string slotCode, SlotStatus status, CancellationToken cancellationToken = default);
}
