using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Persistence.Repositories;

public sealed class ReservationRepository(MongoDbContext context) : IReservationRepository
{
    private readonly IMongoCollection<EnergyReservation> _reservations =
        context.Database.GetCollection<EnergyReservation>(CollectionNames.EnergyReservations);

    // Inserts a new reservation and assigns server-controlled audit timestamps.
    public async Task CreateAsync(EnergyReservation reservation, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        reservation.CreatedAtUtc = now;
        reservation.UpdatedAtUtc = now;
        await _reservations.InsertOneAsync(reservation, new InsertOneOptions(), cancellationToken);
    }

    // Finds a reservation by its string-encoded ObjectId. Returns null if the id is not a valid ObjectId.
    public async Task<EnergyReservation?> FindByIdAsync(string reservationId, CancellationToken cancellationToken = default)
    {
        if (!ObjectId.TryParse(reservationId, out var id)) return null;
        return await _reservations.Find(r => r.Id == id).FirstOrDefaultAsync(cancellationToken);
    }

    // Finds a reservation by its unique business code.
    public async Task<EnergyReservation?> FindByCodeAsync(
        string reservationCode,
        CancellationToken cancellationToken = default) =>
        await _reservations.Find(r => r.ReservationCode == reservationCode).FirstOrDefaultAsync(cancellationToken);

    // Lists reservations belonging to one Prosumer in descending scheduled-start order.
    public Task<List<EnergyReservation>> GetByProsumerAsync(
        string prosumerNic,
        ReservationStatus? status,
        CancellationToken cancellationToken = default)
    {
        var builder = Builders<EnergyReservation>.Filter;
        var filter = builder.Eq(r => r.ProsumerNic, prosumerNic);
        if (status.HasValue)
        {
            filter &= builder.Eq(r => r.Status, status.Value);
        }

        return _reservations.Find(filter)
            .SortByDescending(r => r.ScheduledStartTimeUtc)
            .ToListAsync(cancellationToken);
    }

    // Lists all reservations for staff views with optional status and station filters.
    public Task<List<EnergyReservation>> GetAllAsync(
        ReservationStatus? status,
        ObjectId? stationId,
        CancellationToken cancellationToken = default)
    {
        var builder = Builders<EnergyReservation>.Filter;
        var filter = builder.Empty;
        if (status.HasValue)
        {
            filter &= builder.Eq(r => r.Status, status.Value);
        }
        if (stationId.HasValue)
        {
            filter &= builder.Eq(r => r.StationId, stationId.Value);
        }

        return _reservations.Find(filter)
            .SortByDescending(r => r.ScheduledStartTimeUtc)
            .ToListAsync(cancellationToken);
    }

    // Replaces a reservation document and refreshes its update timestamp.
    public async Task<bool> UpdateAsync(EnergyReservation reservation, CancellationToken cancellationToken = default)
    {
        reservation.UpdatedAtUtc = DateTime.UtcNow;
        var result = await _reservations.ReplaceOneAsync(
            r => r.Id == reservation.Id,
            reservation,
            cancellationToken: cancellationToken);
        return result.MatchedCount == 1;
    }

    // Atomically transitions the reservation from the expected status to the new status.
    // Conditioned on the current status to prevent race conditions with Member 4's QR workflow.
    public async Task<bool> UpdateStatusAsync(
        ObjectId id,
        ReservationStatus expectedStatus,
        ReservationStatus newStatus,
        DateTime changedAtUtc,
        CancellationToken cancellationToken = default)
    {
        var filter = Builders<EnergyReservation>.Filter.Where(r =>
            r.Id == id && r.Status == expectedStatus);
        var update = Builders<EnergyReservation>.Update
            .Set(r => r.Status, newStatus)
            .Set(r => r.UpdatedAtUtc, changedAtUtc);
        var result = await _reservations.UpdateOneAsync(filter, update, cancellationToken: cancellationToken);
        return result.ModifiedCount == 1;
    }

    // Runs a single aggregation pipeline to count documents per status for the dashboard.
    public async Task<Dictionary<ReservationStatus, long>> GetStatusCountsAsync(
        CancellationToken cancellationToken = default)
    {
        var pipeline = new[]
        {
            new BsonDocument("$group", new BsonDocument
            {
                { "_id", "$status" },
                { "count", new BsonDocument("$sum", 1) }
            })
        };
        var results = await _reservations
            .Aggregate<BsonDocument>(pipeline, cancellationToken: cancellationToken)
            .ToListAsync(cancellationToken);

        return results.ToDictionary(
            doc => Enum.Parse<ReservationStatus>(doc["_id"].AsString),
            doc => doc["count"].AsInt64);
    }

    // Counts reservations by status for a single Prosumer.
    public async Task<Dictionary<ReservationStatus, long>> GetProsumerStatusCountsAsync(
        string prosumerNic,
        CancellationToken cancellationToken = default)
    {
        var matchFilter = new BsonDocument("$match", new BsonDocument("prosumerNic", prosumerNic));
        var groupStage = new BsonDocument("$group", new BsonDocument
        {
            { "_id", "$status" },
            { "count", new BsonDocument("$sum", 1) }
        });
        var pipeline = new[] { matchFilter, groupStage };
        var results = await _reservations
            .Aggregate<BsonDocument>(pipeline, cancellationToken: cancellationToken)
            .ToListAsync(cancellationToken);

        return results.ToDictionary(
            doc => Enum.Parse<ReservationStatus>(doc["_id"].AsString),
            doc => doc["count"].AsInt64);
    }
}
