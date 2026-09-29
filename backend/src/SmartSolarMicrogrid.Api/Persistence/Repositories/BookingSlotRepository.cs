// -----------------------------------------------------------------------------
// Implements MongoDB persistence and overlap queries for energy slots.
// -----------------------------------------------------------------------------
using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Persistence.Repositories;

public sealed class BookingSlotRepository(MongoDbContext context) : IBookingSlotRepository
{
    private readonly IMongoCollection<EnergyBookingSlot> _slots =
        context.Database.GetCollection<EnergyBookingSlot>(CollectionNames.EnergyBookingSlots);

    // Finds a slot by its normalized public business code.
    public async Task<EnergyBookingSlot?> FindByCodeAsync(
        string slotCode,
        CancellationToken cancellationToken = default) =>
        await _slots.Find(slot => slot.SlotCode == slotCode).FirstOrDefaultAsync(cancellationToken);

    // Finds a slot by its internal ObjectId (used when only the ObjectId is available, e.g., from EnergyReservation).
    public async Task<EnergyBookingSlot?> FindByIdAsync(
        ObjectId id,
        CancellationToken cancellationToken = default) =>
        await _slots.Find(slot => slot.Id == id).FirstOrDefaultAsync(cancellationToken);

    // Lists slots belonging to one station using optional date and status filters.
    public Task<List<EnergyBookingSlot>> GetForStationAsync(
        ObjectId stationId,
        DateTime? fromUtc,
        DateTime? toUtc,
        SlotStatus? status,
        CancellationToken cancellationToken = default)
    {
        var filters = new List<FilterDefinition<EnergyBookingSlot>>
        {
            Builders<EnergyBookingSlot>.Filter.Eq(slot => slot.StationId, stationId)
        };
        if (fromUtc.HasValue)
        {
            filters.Add(Builders<EnergyBookingSlot>.Filter.Gte(slot => slot.StartTimeUtc, fromUtc.Value));
        }
        if (toUtc.HasValue)
        {
            filters.Add(Builders<EnergyBookingSlot>.Filter.Lte(slot => slot.StartTimeUtc, toUtc.Value));
        }
        if (status.HasValue)
        {
            filters.Add(Builders<EnergyBookingSlot>.Filter.Eq(slot => slot.Status, status.Value));
        }

        return _slots.Find(Builders<EnergyBookingSlot>.Filter.And(filters))
            .SortBy(slot => slot.StartTimeUtc)
            .ToListAsync(cancellationToken);
    }

    // Detects any active slot whose time interval intersects the proposed interval.
    public async Task<bool> HasOverlapAsync(
        ObjectId stationId,
        DateTime startTimeUtc,
        DateTime endTimeUtc,
        ObjectId? excludedId = null,
        CancellationToken cancellationToken = default)
    {
        var builder = Builders<EnergyBookingSlot>.Filter;
        var filter = builder.Eq(slot => slot.StationId, stationId)
            & builder.Lt(slot => slot.StartTimeUtc, endTimeUtc)
            & builder.Gt(slot => slot.EndTimeUtc, startTimeUtc)
            & builder.In(slot => slot.Status, [SlotStatus.Available, SlotStatus.Reserved]);
        if (excludedId.HasValue)
        {
            filter &= builder.Ne(slot => slot.Id, excludedId.Value);
        }

        return await _slots.CountDocumentsAsync(filter, cancellationToken: cancellationToken) > 0;
    }

    // Inserts a slot and assigns server-controlled audit timestamps.
    public async Task CreateAsync(EnergyBookingSlot slot, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        slot.CreatedAtUtc = now;
        slot.UpdatedAtUtc = now;
        await _slots.InsertOneAsync(slot, cancellationToken: cancellationToken);
    }

    // Replaces an existing slot while refreshing its update timestamp.
    public async Task<bool> UpdateAsync(EnergyBookingSlot slot, CancellationToken cancellationToken = default)
    {
        slot.UpdatedAtUtc = DateTime.UtcNow;
        var result = await _slots.ReplaceOneAsync(
            item => item.Id == slot.Id,
            slot,
            cancellationToken: cancellationToken);
        return result.MatchedCount == 1;
    }

    // Atomically updates only slot availability status and its audit timestamp (by public code).
    public async Task<bool> UpdateStatusAsync(
        string slotCode,
        SlotStatus status,
        CancellationToken cancellationToken = default)
    {
        var update = Builders<EnergyBookingSlot>.Update
            .Set(slot => slot.Status, status)
            .Set(slot => slot.UpdatedAtUtc, DateTime.UtcNow);
        var result = await _slots.UpdateOneAsync(
            slot => slot.SlotCode == slotCode,
            update,
            cancellationToken: cancellationToken);
        return result.MatchedCount == 1;
    }

    // Atomically updates only slot availability status by its internal ObjectId.
    public async Task<bool> UpdateStatusByIdAsync(
        ObjectId id,
        SlotStatus status,
        CancellationToken cancellationToken = default)
    {
        var update = Builders<EnergyBookingSlot>.Update
            .Set(slot => slot.Status, status)
            .Set(slot => slot.UpdatedAtUtc, DateTime.UtcNow);
        var result = await _slots.UpdateOneAsync(
            slot => slot.Id == id,
            update,
            cancellationToken: cancellationToken);
        return result.MatchedCount == 1;
    }

    // Atomically subtracts an approved reservation from the remaining slot energy.
    public async Task<bool> AllocateEnergyAsync(
        ObjectId id,
        decimal energyKwh,
        CancellationToken cancellationToken = default)
    {
        if (energyKwh <= 0) return false;

        var filter = Builders<EnergyBookingSlot>.Filter.Where(slot =>
            slot.Id == id &&
            (slot.Status == SlotStatus.Available || slot.Status == SlotStatus.Reserved) &&
            slot.AvailableEnergyKwh >= energyKwh);
        var remainingExpression = new BsonDocument("$subtract", new BsonArray
        {
            "$availableEnergyKwh",
            energyKwh
        });
        var stages = new BsonDocument[]
        {
            new BsonDocument("$set", new BsonDocument
            {
                { "availableEnergyKwh", remainingExpression },
                {
                    "status",
                    new BsonDocument("$cond", new BsonArray
                    {
                        new BsonDocument("$eq", new BsonArray { remainingExpression, 0 }),
                        SlotStatus.Reserved.ToString(),
                        SlotStatus.Available.ToString()
                    })
                },
                { "updatedAtUtc", DateTime.UtcNow }
            })
        };
        var update = new PipelineUpdateDefinition<EnergyBookingSlot>(stages);

        var result = await _slots.UpdateOneAsync(filter, update, cancellationToken: cancellationToken);
        return result.ModifiedCount == 1;
    }

    // Atomically returns energy from a cancelled or reduced approved reservation.
    public async Task<bool> RestoreEnergyAsync(
        ObjectId id,
        decimal energyKwh,
        CancellationToken cancellationToken = default)
    {
        if (energyKwh <= 0) return false;

        var filter = Builders<EnergyBookingSlot>.Filter.Where(slot =>
            slot.Id == id && slot.Status != SlotStatus.Expired);
        var update = Builders<EnergyBookingSlot>.Update
            .Inc(slot => slot.AvailableEnergyKwh, energyKwh)
            .Set(slot => slot.Status, SlotStatus.Available)
            .Set(slot => slot.UpdatedAtUtc, DateTime.UtcNow);
        var result = await _slots.UpdateOneAsync(filter, update, cancellationToken: cancellationToken);
        return result.ModifiedCount == 1;
    }
}
