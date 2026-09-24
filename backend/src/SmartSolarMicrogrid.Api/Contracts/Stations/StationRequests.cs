using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogrid.Api.Contracts.Stations;

public static class StationValidationRules
{
    public const string CodePattern = @"^STN-[A-Z0-9]+(?:-[A-Z0-9]+)*$";
}

public record CreateStationRequest(
    [property: Required, StringLength(40, MinimumLength = 3), RegularExpression(StationValidationRules.CodePattern)] string StationCode,
    [property: Required, StringLength(150, MinimumLength = 1)] string Name,
    [property: StringLength(500)] string? Description,
    [property: Range(-90, 90)] double Latitude,
    [property: Range(-180, 180)] double Longitude,
    [property: Required, StringLength(300, MinimumLength = 1)] string Address,
    [property: Range(typeof(decimal), "0.01", "79228162514264337593543950335")] decimal CapacityKwh,
    [property: Range(typeof(decimal), "0", "79228162514264337593543950335")] decimal BatteryStorageKwh,
    TimeSpan OpeningTime,
    TimeSpan ClosingTime);

public record UpdateStationRequest(
    [property: Required, StringLength(150, MinimumLength = 1)] string Name,
    [property: StringLength(500)] string? Description,
    [property: Range(-90, 90)] double Latitude,
    [property: Range(-180, 180)] double Longitude,
    [property: Required, StringLength(300, MinimumLength = 1)] string Address,
    [property: Range(typeof(decimal), "0.01", "79228162514264337593543950335")] decimal CapacityKwh,
    [property: Range(typeof(decimal), "0", "79228162514264337593543950335")] decimal BatteryStorageKwh,
    TimeSpan OpeningTime,
    TimeSpan ClosingTime);

public record ChangeStationStatusRequest(
    [property: Required, RegularExpression("^(Active|Maintenance|Deactivated)$")] string Status,
    [property: StringLength(300)] string? Reason);
