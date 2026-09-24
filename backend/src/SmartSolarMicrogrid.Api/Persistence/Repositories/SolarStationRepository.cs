using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Persistence.Repositories;

public sealed class SolarStationRepository(MongoDbContext context) : ISolarStationRepository
{
    private readonly IMongoCollection<SolarStation> _stations =
        context.Database.GetCollection<SolarStation>(CollectionNames.SolarStations);

    public async Task<SolarStation?> FindByCodeAsync(
        string stationCode,
        CancellationToken cancellationToken = default) =>
        await _stations.Find(station => station.StationCode == stationCode).FirstOrDefaultAsync(cancellationToken);

    public async Task<SolarStation?> FindByIdAsync(
        MongoDB.Bson.ObjectId id,
        CancellationToken cancellationToken = default) =>
        await _stations.Find(station => station.Id == id).FirstOrDefaultAsync(cancellationToken);

    public Task<List<SolarStation>> GetAllAsync(
        StationStatus? status,
        CancellationToken cancellationToken = default)
    {
        var filter = status is null
            ? Builders<SolarStation>.Filter.Empty
            : Builders<SolarStation>.Filter.Eq(station => station.Status, status.Value);
        return _stations.Find(filter).SortBy(station => station.StationCode).ToListAsync(cancellationToken);
    }

    public async Task CreateAsync(SolarStation station, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        station.CreatedAtUtc = now;
        station.UpdatedAtUtc = now;
        await _stations.InsertOneAsync(station, cancellationToken: cancellationToken);
    }

    public async Task<bool> UpdateAsync(SolarStation station, CancellationToken cancellationToken = default)
    {
        station.UpdatedAtUtc = DateTime.UtcNow;
        var result = await _stations.ReplaceOneAsync(
            item => item.Id == station.Id,
            station,
            cancellationToken: cancellationToken);
        return result.MatchedCount == 1;
    }

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
