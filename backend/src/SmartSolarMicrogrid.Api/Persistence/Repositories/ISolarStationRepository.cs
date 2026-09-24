using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Persistence.Repositories;

public interface ISolarStationRepository
{
    Task<SolarStation?> FindByCodeAsync(string stationCode, CancellationToken cancellationToken = default);
    Task<SolarStation?> FindByIdAsync(MongoDB.Bson.ObjectId id, CancellationToken cancellationToken = default);
    Task<List<SolarStation>> GetAllAsync(StationStatus? status, CancellationToken cancellationToken = default);
    Task CreateAsync(SolarStation station, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(SolarStation station, CancellationToken cancellationToken = default);
    Task<bool> UpdateStatusAsync(string stationCode, StationStatus status, CancellationToken cancellationToken = default);
}
