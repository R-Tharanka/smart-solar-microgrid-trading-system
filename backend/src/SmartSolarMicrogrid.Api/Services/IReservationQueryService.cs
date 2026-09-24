using MongoDB.Bson;

namespace SmartSolarMicrogrid.Api.Services;

public interface IReservationQueryService
{
    /// <summary>Checks whether a station has a reservation in a non-terminal state.</summary>
    Task<bool> HasActiveReservationsForStationAsync(ObjectId stationId, CancellationToken cancellationToken = default);

    /// <summary>Checks whether a slot has a reservation in a non-terminal state.</summary>
    Task<bool> HasActiveReservationsForSlotAsync(ObjectId slotId, CancellationToken cancellationToken = default);
}
