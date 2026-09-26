// -----------------------------------------------------------------------------
// Implements MongoDB persistence for solar-station records.
// -----------------------------------------------------------------------------
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Persistence.Repositories;

public sealed class SolarStationRepository(MongoDbContext context) : ISolarStationRepository
{
    private readonly IMongoCollection<SolarStation> _stations =
        context.Database.GetCollection<SolarStation>(CollectionNames.SolarStations);

    // Finds a station by its normalized public business code.
    public async Task<SolarStation?> FindByCodeAsync(
        string stationCode,
        CancellationToken cancellationToken = default) =>
        await _stations.Find(station => station.StationCode == stationCode).FirstOrDefaultAsync(cancellationToken);

    // Finds a station by the internal ObjectId used in cross-collection relationships.
    public async Task<SolarStation?> FindByIdAsync(
        MongoDB.Bson.ObjectId id,
        CancellationToken cancellationToken = default) =>
        await _stations.Find(station => station.Id == id).FirstOrDefaultAsync(cancellationToken);

    // Lists stations in deterministic code order with an optional status filter.
    public Task<List<SolarStation>> GetAllAsync(
        StationStatus? status,
        CancellationToken cancellationToken = default)
    {
        var filter = status is null
            ? Builders<SolarStation>.Filter.Empty
            : Builders<SolarStation>.Filter.Eq(station => station.Status, status.Value);
        return _stations.Find(filter).SortBy(station => station.StationCode).ToListAsync(cancellationToken);
    }

    // Inserts a station and assigns server-controlled audit timestamps.
    public async Task CreateAsync(SolarStation station, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        station.CreatedAtUtc = now;
        station.UpdatedAtUtc = now;
        await _stations.InsertOneAsync(station, cancellationToken: cancellationToken);
    }

    // Replaces an existing station while refreshing its update timestamp.
    public async Task<bool> UpdateAsync(SolarStation station, CancellationToken cancellationToken = default)
    {
        station.UpdatedAtUtc = DateTime.UtcNow;
        var result = await _stations.ReplaceOneAsync(
            item => item.Id == station.Id,
            station,
            cancellationToken: cancellationToken);
        return result.MatchedCount == 1;
    }

    // Atomically updates only operational status and its audit timestamp.
    public async Task<bool> UpdateStatusAsync(
        string stationCode,
        StationStatus status,
        CancellationToken cancellationToken = default)
    {
        var update = Builders<SolarStation>.Update
            .Set(station => station.Status, status)
            .Set(station => station.UpdatedAtUtc, DateTime.UtcNow);
        var result = await _stations.UpdateOneAsync(
            station => station.StationCode == stationCode,
            update,
            cancellationToken: cancellationToken);
        return result.MatchedCount == 1;
    }
}
