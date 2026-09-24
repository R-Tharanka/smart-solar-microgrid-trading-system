using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Contracts.Stations;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Persistence.Repositories;

namespace SmartSolarMicrogrid.Api.Services;

public sealed class SolarStationService(
    ISolarStationRepository stationRepository,
    IReservationQueryService reservationQueryService,
    ILogger<SolarStationService> logger) : ISolarStationService
{
    public async Task<StationResponse> CreateAsync(
        CreateStationRequest request,
        CancellationToken cancellationToken = default)
    {
        var stationCode = NormalizeCode(request.StationCode);
        if (await stationRepository.FindByCodeAsync(stationCode, cancellationToken) is not null)
        {
            throw StationSlotException.Conflict("STATION_CODE_EXISTS", "Station code is already registered.");
        }

        ValidateStation(request.Latitude, request.Longitude, request.CapacityKwh,
            request.BatteryStorageKwh, request.OpeningTime, request.ClosingTime);
        var station = new SolarStation
        {
            StationCode = stationCode,
            Name = RequiredText(request.Name, "Station name"),
            Description = request.Description?.Trim() ?? string.Empty,
            Location = Location(request.Longitude, request.Latitude, RequiredText(request.Address, "Address")),
            CapacityKwh = request.CapacityKwh,
            BatteryStorageKwh = request.BatteryStorageKwh,
            OpeningTime = request.OpeningTime,
            ClosingTime = request.ClosingTime,
            Status = StationStatus.Active
        };

        try
        {
            await stationRepository.CreateAsync(station, cancellationToken);
        }
        catch (MongoWriteException exception) when (exception.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            throw StationSlotException.Conflict("STATION_CODE_EXISTS", "Station code is already registered.");
        }

        logger.LogInformation("Solar station {StationCode} created", station.StationCode);
        return Map(station);
    }

    public async Task<IReadOnlyCollection<StationResponse>> GetAllAsync(
        string? status,
        double? nearLat,
        double? nearLng,
        CancellationToken cancellationToken = default)
    {
        StationStatus? parsedStatus = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<StationStatus>(status, true, out var parsed))
            {
                throw StationSlotException.Validation("STATION_STATUS_INVALID", "Station status is invalid.");
            }
            parsedStatus = parsed;
        }

        if (nearLat.HasValue != nearLng.HasValue)
        {
            throw StationSlotException.Validation(
                "STATION_LOCATION_QUERY_INVALID",
                "nearLat and nearLng must be supplied together.");
        }
        if (nearLat is < -90 or > 90 || nearLng is < -180 or > 180)
        {
            throw StationSlotException.Validation(
                "STATION_COORDINATES_INVALID",
                "Latitude must be between -90 and 90 and longitude between -180 and 180.");
        }

        IEnumerable<SolarStation> stations = await stationRepository.GetAllAsync(parsedStatus, cancellationToken);
        if (nearLat.HasValue && nearLng.HasValue)
        {
            stations = stations.OrderBy(station => DistanceSquared(
                nearLat.Value,
                nearLng.Value,
                station.Location.Coordinates[1],
                station.Location.Coordinates[0]));
        }
        return stations.Select(Map).ToList();
    }

    public async Task<StationResponse> GetAsync(string stationCode, CancellationToken cancellationToken = default) =>
        Map(await FindRequiredAsync(stationCode, cancellationToken));

    public async Task<StationResponse> UpdateAsync(
        string stationCode,
        UpdateStationRequest request,
        CancellationToken cancellationToken = default)
    {
        var station = await FindRequiredAsync(stationCode, cancellationToken);
        ValidateStation(request.Latitude, request.Longitude, request.CapacityKwh,
            request.BatteryStorageKwh, request.OpeningTime, request.ClosingTime);

        station.Name = RequiredText(request.Name, "Station name");
        station.Description = request.Description?.Trim() ?? string.Empty;
        station.Location = Location(request.Longitude, request.Latitude, RequiredText(request.Address, "Address"));
        station.CapacityKwh = request.CapacityKwh;
        station.BatteryStorageKwh = request.BatteryStorageKwh;
        station.OpeningTime = request.OpeningTime;
        station.ClosingTime = request.ClosingTime;
        if (!await stationRepository.UpdateAsync(station, cancellationToken))
        {
            throw StationSlotException.StationNotFound();
        }

        logger.LogInformation("Solar station {StationCode} updated", station.StationCode);
        return Map(station);
    }

    public async Task<StationResponse> ChangeStatusAsync(
        string stationCode,
        ChangeStationStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var station = await FindRequiredAsync(stationCode, cancellationToken);
        if (!Enum.TryParse<StationStatus>(request.Status, true, out var newStatus))
        {
            throw StationSlotException.Validation("STATION_STATUS_INVALID", "Station status is invalid.");
        }
        if (station.Status == newStatus)
        {
            throw StationSlotException.Conflict("STATION_STATUS_UNCHANGED", "Station already has the requested status.");
        }
        if (newStatus == StationStatus.Deactivated &&
            await reservationQueryService.HasActiveReservationsForStationAsync(station.Id, cancellationToken))
        {
            throw StationSlotException.Conflict(
                "STATION_ACTIVE_RESERVATIONS",
                "The station cannot be deactivated while active reservations exist.");
        }

        var oldStatus = station.Status;
        if (!await stationRepository.UpdateStatusAsync(station.StationCode, newStatus, cancellationToken))
        {
            throw StationSlotException.StationNotFound();
        }
        station.Status = newStatus;
        station.UpdatedAtUtc = DateTime.UtcNow;
        logger.LogInformation(
            "Solar station {StationCode} status changed from {OldStatus} to {NewStatus}",
            station.StationCode,
            oldStatus,
            newStatus);
        return Map(station);
    }

    private async Task<SolarStation> FindRequiredAsync(string stationCode, CancellationToken cancellationToken) =>
        await stationRepository.FindByCodeAsync(NormalizeCode(stationCode), cancellationToken)
        ?? throw StationSlotException.StationNotFound();

    private static void ValidateStation(
        double latitude,
        double longitude,
        decimal capacityKwh,
        decimal batteryStorageKwh,
        TimeSpan openingTime,
        TimeSpan closingTime)
    {
        if (latitude is < -90 or > 90 || longitude is < -180 or > 180)
        {
            throw StationSlotException.Validation(
                "STATION_COORDINATES_INVALID",
                "Latitude must be between -90 and 90 and longitude between -180 and 180.");
        }
        if (capacityKwh <= 0)
        {
            throw StationSlotException.Validation("STATION_CAPACITY_INVALID", "Station capacity must be greater than zero.");
        }
        if (batteryStorageKwh < 0 || batteryStorageKwh > capacityKwh)
        {
            throw StationSlotException.Validation(
                "STATION_STORAGE_INVALID",
                "Battery storage must be non-negative and cannot exceed station capacity.");
        }
        if (openingTime < TimeSpan.Zero || closingTime > TimeSpan.FromDays(1) || openingTime >= closingTime)
        {
            throw StationSlotException.Validation(
                "STATION_SCHEDULE_INVALID",
                "Opening time must be earlier than closing time within the same day.");
        }
    }

    private static StationLocation Location(double longitude, double latitude, string address) => new()
    {
        Type = "Point",
        Coordinates = [longitude, latitude],
        Address = address
    };

    private static string NormalizeCode(string code) => code.Trim().ToUpperInvariant();

    private static double DistanceSquared(
        double latitude1,
        double longitude1,
        double latitude2,
        double longitude2)
    {
        var latitudeDifference = latitude1 - latitude2;
        var longitudeDifference = longitude1 - longitude2;
        return latitudeDifference * latitudeDifference + longitudeDifference * longitudeDifference;
    }

    private static string RequiredText(string value, string fieldName)
    {
        var normalized = value.Trim();
        return normalized.Length == 0
            ? throw StationSlotException.Validation("VALIDATION_STATION", $"{fieldName} cannot contain only whitespace.")
            : normalized;
    }

    private static StationResponse Map(SolarStation station) => new(
        station.StationCode,
        station.Name,
        station.Description,
        station.Location.Coordinates[1],
        station.Location.Coordinates[0],
        station.Location.Address,
        station.CapacityKwh,
        station.BatteryStorageKwh,
        station.OpeningTime,
        station.ClosingTime,
        station.Status.ToString(),
        station.CreatedAtUtc,
        station.UpdatedAtUtc);
}
