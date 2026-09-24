using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Persistence;

public sealed class ReservationQueryService(MongoDbContext context) : IReservationQueryService
{
    private static readonly BsonArray ActiveStatuses = ["Pending", "Approved", "QrIssued", "Verified"];
    private readonly IMongoCollection<BsonDocument> _reservations =
        context.Database.GetCollection<BsonDocument>(CollectionNames.EnergyReservations);

    // Reports whether a station is referenced by any non-terminal reservation.
    public Task<bool> HasActiveReservationsForStationAsync(
        ObjectId stationId,
        CancellationToken cancellationToken = default) => HasActiveAsync("stationId", stationId, cancellationToken);

    // Reports whether a slot is referenced by any non-terminal reservation.
    public Task<bool> HasActiveReservationsForSlotAsync(
        ObjectId slotId,
        CancellationToken cancellationToken = default) => HasActiveAsync("slotId", slotId, cancellationToken);

    // Performs the shared read-only reservation lookup without owning reservation transitions.
    private async Task<bool> HasActiveAsync(string field, ObjectId id, CancellationToken cancellationToken)
    {
        var filter = new BsonDocument
        {
            { field, id },
            { "status", new BsonDocument("$in", ActiveStatuses) }
        };
        return await _reservations.CountDocumentsAsync(filter, cancellationToken: cancellationToken) > 0;
    }
}
