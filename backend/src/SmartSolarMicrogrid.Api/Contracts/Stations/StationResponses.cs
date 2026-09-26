// -----------------------------------------------------------------------------
// Defines the public station response without exposing MongoDB identifiers.
// -----------------------------------------------------------------------------
namespace SmartSolarMicrogrid.Api.Contracts.Stations;

public record StationResponse(
    string StationCode,
    string Name,
    string Description,
    double Latitude,
    double Longitude,
    string Address,
    decimal CapacityKwh,
    decimal BatteryStorageKwh,
    TimeSpan OpeningTime,
    TimeSpan ClosingTime,
    string Status,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);
