using MongoDB.Bson;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Persistence.Repositories;

public interface IBookingSlotRepository
{
    Task<EnergyBookingSlot?> FindByCodeAsync(string slotCode, CancellationToken cancellationToken = default);
    Task<List<EnergyBookingSlot>> GetForStationAsync(
        ObjectId stationId,
        DateTime? fromUtc,
        DateTime? toUtc,
        SlotStatus? status,
        CancellationToken cancellationToken = default);
    Task<bool> HasOverlapAsync(
        ObjectId stationId,
        DateTime startTimeUtc,
        DateTime endTimeUtc,
        ObjectId? excludedId = null,
        CancellationToken cancellationToken = default);
    Task CreateAsync(EnergyBookingSlot slot, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(EnergyBookingSlot slot, CancellationToken cancellationToken = default);
    Task<bool> UpdateStatusAsync(string slotCode, SlotStatus status, CancellationToken cancellationToken = default);
}
