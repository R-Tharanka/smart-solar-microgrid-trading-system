// -----------------------------------------------------------------------------
// Provides read-only reservation checks for safe station and slot changes.
// -----------------------------------------------------------------------------
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

    public async Task<decimal> GetTotalApprovedEnergyForStationAsync(ObjectId stationId, CancellationToken cancellationToken = default)
    {
        var filter = new BsonDocument
        {
            { "stationId", stationId },
            { "status", new BsonDocument("$in", new BsonArray { "Approved", "QrIssued", "Verified" }) }
        };
        
        var pipeline = new BsonDocument[]
        {
            new BsonDocument("$match", filter),
            new BsonDocument("$group", new BsonDocument
            {
                { "_id", BsonNull.Value },
                { "totalEnergy", new BsonDocument("$sum", "$requestedEnergyKwh") }
            })
        };

        var cursor = await _reservations.AggregateAsync<BsonDocument>(pipeline, cancellationToken: cancellationToken);
        var result = await cursor.FirstOrDefaultAsync(cancellationToken);

        if (result != null && result.Contains("totalEnergy"))
        {
            return (decimal)result["totalEnergy"].AsDecimal128;
        }
        return 0m;
    }
}
