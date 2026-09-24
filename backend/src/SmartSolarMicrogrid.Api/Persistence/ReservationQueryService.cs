using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Persistence;

public sealed class ReservationQueryService(MongoDbContext context) : IReservationQueryService
{
    private static readonly BsonArray ActiveStatuses = ["Pending", "Approved", "QrIssued", "Verified"];
    private readonly IMongoCollection<BsonDocument> _reservations =
        context.Database.GetCollection<BsonDocument>(CollectionNames.EnergyReservations);

    public Task<bool> HasActiveReservationsForStationAsync(
        ObjectId stationId,
        CancellationToken cancellationToken = default) => HasActiveAsync("stationId", stationId, cancellationToken);

    public Task<bool> HasActiveReservationsForSlotAsync(
        ObjectId slotId,
        CancellationToken cancellationToken = default) => HasActiveAsync("slotId", slotId, cancellationToken);

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
