// -----------------------------------------------------------------------------
// Enforces station validation, lifecycle, and proximity-ordering rules.
// -----------------------------------------------------------------------------
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
    // Validates and persists a new station with an initial Active status.
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

    // Loads stations and applies optional status filtering and nearest-first ordering.
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

    // Finds a station by its normalized public station code.
    public async Task<StationResponse> GetAsync(string stationCode, CancellationToken cancellationToken = default) =>
        Map(await FindRequiredAsync(stationCode, cancellationToken));

    // Validates and replaces the editable details of an existing station.
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

    // Changes station status after enforcing reservation-safe deactivation.
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

    // Returns a station or raises the domain-specific not-found error used by the API.
    private async Task<SolarStation> FindRequiredAsync(string stationCode, CancellationToken cancellationToken) =>
        await stationRepository.FindByCodeAsync(NormalizeCode(stationCode), cancellationToken)
        ?? throw StationSlotException.StationNotFound();

    // Enforces coordinate, capacity, storage, and daily operating-schedule rules.
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

    // Creates the longitude-first GeoJSON value required by MongoDB's geospatial index.
    private static StationLocation Location(double longitude, double latitude, string address) => new()
    {
        Type = "Point",
        Coordinates = [longitude, latitude],
        Address = address
    };

    // Keeps public station codes case-insensitive and consistently stored.
    private static string NormalizeCode(string code) => code.Trim().ToUpperInvariant();

    // Produces a lightweight comparison value used for nearest-first station ordering.
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

    // Trims required text while rejecting values containing only whitespace.
    private static string RequiredText(string value, string fieldName)
    {
        var normalized = value.Trim();
        return normalized.Length == 0
            ? throw StationSlotException.Validation("VALIDATION_STATION", $"{fieldName} cannot contain only whitespace.")
            : normalized;
    }

    // Maps the persistence model to the public response without exposing MongoDB ObjectId.
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
