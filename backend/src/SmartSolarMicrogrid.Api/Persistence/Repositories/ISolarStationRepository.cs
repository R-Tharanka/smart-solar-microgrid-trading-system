// -----------------------------------------------------------------------------
// Defines persistence operations required by the station domain service.
// -----------------------------------------------------------------------------
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Persistence.Repositories;

public interface ISolarStationRepository
{
    /// <summary>Finds a station by its public code.</summary>
    Task<SolarStation?> FindByCodeAsync(string stationCode, CancellationToken cancellationToken = default);

    /// <summary>Finds a station by its internal MongoDB identifier.</summary>
    Task<SolarStation?> FindByIdAsync(MongoDB.Bson.ObjectId id, CancellationToken cancellationToken = default);

    /// <summary>Returns all stations matching an optional operational status.</summary>
    Task<List<SolarStation>> GetAllAsync(StationStatus? status, CancellationToken cancellationToken = default);

    /// <summary>Persists a new station.</summary>
    Task CreateAsync(SolarStation station, CancellationToken cancellationToken = default);

    /// <summary>Replaces an existing station.</summary>
    Task<bool> UpdateAsync(SolarStation station, CancellationToken cancellationToken = default);

    /// <summary>Updates only a station's operational status.</summary>
    Task<bool> UpdateStatusAsync(string stationCode, StationStatus status, CancellationToken cancellationToken = default);
}
