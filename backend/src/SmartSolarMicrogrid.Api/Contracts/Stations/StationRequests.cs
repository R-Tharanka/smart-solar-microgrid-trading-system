using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogrid.Api.Contracts.Stations;

public static class StationValidationRules
{
    public const string CodePattern = @"^STN-[A-Z0-9]+(?:-[A-Z0-9]+)*$";
}

public sealed record CreateStationRequest
{
    public CreateStationRequest() { }

    public CreateStationRequest(string stationCode, string name, string? description,
        double latitude, double longitude, string address, decimal capacityKwh,
        decimal batteryStorageKwh, TimeSpan openingTime, TimeSpan closingTime) =>
        (StationCode, Name, Description, Latitude, Longitude, Address, CapacityKwh,
            BatteryStorageKwh, OpeningTime, ClosingTime) =
        (stationCode, name, description, latitude, longitude, address, capacityKwh,
            batteryStorageKwh, openingTime, closingTime);

    [Required, StringLength(40, MinimumLength = 3), RegularExpression(StationValidationRules.CodePattern)]
    public string StationCode { get; init; } = string.Empty;

    [Required, StringLength(150, MinimumLength = 1)]
    public string Name { get; init; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; init; }

    [Range(-90, 90)]
    public double Latitude { get; init; }

    [Range(-180, 180)]
    public double Longitude { get; init; }

    [Required, StringLength(300, MinimumLength = 1)]
    public string Address { get; init; } = string.Empty;

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335")]
    public decimal CapacityKwh { get; init; }

    [Range(typeof(decimal), "0", "79228162514264337593543950335")]
    public decimal BatteryStorageKwh { get; init; }

    public TimeSpan OpeningTime { get; init; }
    public TimeSpan ClosingTime { get; init; }
}

public sealed record UpdateStationRequest
{
    public UpdateStationRequest() { }

    public UpdateStationRequest(string name, string? description, double latitude,
        double longitude, string address, decimal capacityKwh, decimal batteryStorageKwh,
        TimeSpan openingTime, TimeSpan closingTime) =>
        (Name, Description, Latitude, Longitude, Address, CapacityKwh,
            BatteryStorageKwh, OpeningTime, ClosingTime) =
        (name, description, latitude, longitude, address, capacityKwh,
            batteryStorageKwh, openingTime, closingTime);

    [Required, StringLength(150, MinimumLength = 1)]
    public string Name { get; init; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; init; }

    [Range(-90, 90)]
    public double Latitude { get; init; }

    [Range(-180, 180)]
    public double Longitude { get; init; }

    [Required, StringLength(300, MinimumLength = 1)]
    public string Address { get; init; } = string.Empty;

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335")]
    public decimal CapacityKwh { get; init; }

    [Range(typeof(decimal), "0", "79228162514264337593543950335")]
    public decimal BatteryStorageKwh { get; init; }

    public TimeSpan OpeningTime { get; init; }
    public TimeSpan ClosingTime { get; init; }
}

public sealed record ChangeStationStatusRequest
{
    public ChangeStationStatusRequest() { }

    public ChangeStationStatusRequest(string status, string? reason) =>
        (Status, Reason) = (status, reason);

    [Required, RegularExpression("^(Active|Maintenance|Deactivated)$")]
    public string Status { get; init; } = string.Empty;

    [StringLength(300)]
    public string? Reason { get; init; }
}
