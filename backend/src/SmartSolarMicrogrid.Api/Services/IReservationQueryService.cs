using MongoDB.Bson;

namespace SmartSolarMicrogrid.Api.Services;

public interface IReservationQueryService
{
    Task<bool> HasActiveReservationsForStationAsync(ObjectId stationId, CancellationToken cancellationToken = default);
    Task<bool> HasActiveReservationsForSlotAsync(ObjectId slotId, CancellationToken cancellationToken = default);
}
