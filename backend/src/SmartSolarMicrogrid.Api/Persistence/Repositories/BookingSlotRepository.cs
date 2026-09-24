using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Persistence.Repositories;

public sealed class BookingSlotRepository(MongoDbContext context) : IBookingSlotRepository
{
    private readonly IMongoCollection<EnergyBookingSlot> _slots =
        context.Database.GetCollection<EnergyBookingSlot>(CollectionNames.EnergyBookingSlots);

    public async Task<EnergyBookingSlot?> FindByCodeAsync(
        string slotCode,
        CancellationToken cancellationToken = default) =>
        await _slots.Find(slot => slot.SlotCode == slotCode).FirstOrDefaultAsync(cancellationToken);

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

    public async Task CreateAsync(EnergyBookingSlot slot, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        slot.CreatedAtUtc = now;
        slot.UpdatedAtUtc = now;
        await _slots.InsertOneAsync(slot, cancellationToken: cancellationToken);
    }

    public async Task<bool> UpdateAsync(EnergyBookingSlot slot, CancellationToken cancellationToken = default)
    {
        slot.UpdatedAtUtc = DateTime.UtcNow;
        var result = await _slots.ReplaceOneAsync(
            item => item.Id == slot.Id,
            slot,
            cancellationToken: cancellationToken);
        return result.MatchedCount == 1;
    }

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
}
