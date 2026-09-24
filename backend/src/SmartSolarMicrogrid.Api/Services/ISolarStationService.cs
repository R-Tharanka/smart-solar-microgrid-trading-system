using SmartSolarMicrogrid.Api.Contracts.Stations;

namespace SmartSolarMicrogrid.Api.Services;

public interface ISolarStationService
{
    Task<StationResponse> CreateAsync(CreateStationRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<StationResponse>> GetAllAsync(
        string? status,
        double? nearLat,
        double? nearLng,
        CancellationToken cancellationToken = default);
    Task<StationResponse> GetAsync(string stationCode, CancellationToken cancellationToken = default);
    Task<StationResponse> UpdateAsync(string stationCode, UpdateStationRequest request, CancellationToken cancellationToken = default);
    Task<StationResponse> ChangeStatusAsync(string stationCode, ChangeStationStatusRequest request, CancellationToken cancellationToken = default);
}
