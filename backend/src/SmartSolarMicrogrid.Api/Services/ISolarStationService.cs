// -----------------------------------------------------------------------------
// Defines station-management use cases exposed to API controllers.
// -----------------------------------------------------------------------------
using SmartSolarMicrogrid.Api.Contracts.Stations;

namespace SmartSolarMicrogrid.Api.Services;

public interface ISolarStationService
{
    /// <summary>Creates an active solar station after validating its domain data.</summary>
    Task<StationResponse> CreateAsync(CreateStationRequest request, CancellationToken cancellationToken = default);

    /// <summary>Lists stations with optional status filtering and proximity ordering.</summary>
    Task<IReadOnlyCollection<StationResponse>> GetAllAsync(
        string? status,
        double? nearLat,
        double? nearLng,
        CancellationToken cancellationToken = default);
    /// <summary>Gets one station by its public station code.</summary>
    Task<StationResponse> GetAsync(string stationCode, CancellationToken cancellationToken = default);

    /// <summary>Updates the editable details of an existing station.</summary>
    Task<StationResponse> UpdateAsync(string stationCode, UpdateStationRequest request, CancellationToken cancellationToken = default);

    /// <summary>Changes station operational status while enforcing deactivation rules.</summary>
    Task<StationResponse> ChangeStatusAsync(string stationCode, ChangeStationStatusRequest request, CancellationToken cancellationToken = default);
}
