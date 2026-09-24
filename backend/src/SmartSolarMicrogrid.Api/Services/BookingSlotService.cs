using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Contracts.BookingSlots;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Persistence.Repositories;

namespace SmartSolarMicrogrid.Api.Services;

public sealed class BookingSlotService(
    IBookingSlotRepository slotRepository,
    ISolarStationRepository stationRepository,
    IReservationQueryService reservationQueryService,
    ILogger<BookingSlotService> logger) : IBookingSlotService
{
    public async Task<BookingSlotResponse> CreateAsync(
        string stationCode,
        CreateBookingSlotRequest request,
        CancellationToken cancellationToken = default)
    {
        var station = await FindStationAsync(stationCode, cancellationToken);
        if (station.Status != StationStatus.Active)
        {
            throw StationSlotException.Conflict("STATION_NOT_ACTIVE", "Slots can only be created for an active station.");
        }

        var slotCode = NormalizeCode(request.SlotCode);
        if (await slotRepository.FindByCodeAsync(slotCode, cancellationToken) is not null)
        {
            throw StationSlotException.Conflict("SLOT_CODE_EXISTS", "Slot code is already registered.");
        }

        await ValidateSlotAsync(station, request.StartTimeUtc, request.EndTimeUtc,
            request.AvailableEnergyKwh, excludedId: null, cancellationToken);
        ValidatePrice(request.PricePerKwh);
        var slot = new EnergyBookingSlot
        {
            SlotCode = slotCode,
            StationId = station.Id,
            StartTimeUtc = request.StartTimeUtc,
            EndTimeUtc = request.EndTimeUtc,
            AvailableEnergyKwh = request.AvailableEnergyKwh,
            PricePerKwh = request.PricePerKwh,
            Status = SlotStatus.Available
        };

        try
        {
            await slotRepository.CreateAsync(slot, cancellationToken);
        }
        catch (MongoWriteException exception) when (exception.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            throw StationSlotException.Conflict("SLOT_DUPLICATE", "Slot code or station period already exists.");
        }

        logger.LogInformation("Energy slot {SlotCode} created for {StationCode}", slot.SlotCode, station.StationCode);
        return Map(slot, station.StationCode);
    }

    public async Task<IReadOnlyCollection<BookingSlotResponse>> GetForStationAsync(
        string stationCode,
        DateTime? fromUtc,
        DateTime? toUtc,
        string? status,
        CancellationToken cancellationToken = default)
    {
        var station = await FindStationAsync(stationCode, cancellationToken);
        if (fromUtc.HasValue && toUtc.HasValue && fromUtc.Value > toUtc.Value)
        {
            throw StationSlotException.Validation("SLOT_DATE_RANGE_INVALID", "fromUtc cannot be later than toUtc.");
        }

        SlotStatus? parsedStatus = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<SlotStatus>(status, true, out var parsed))
            {
                throw StationSlotException.Validation("SLOT_STATUS_INVALID", "Slot status is invalid.");
            }
            parsedStatus = parsed;
        }

        var slots = await slotRepository.GetForStationAsync(station.Id, fromUtc, toUtc, parsedStatus, cancellationToken);
        return slots.Select(slot => Map(slot, station.StationCode)).ToList();
    }

    public async Task<BookingSlotResponse> GetAsync(string slotCode, CancellationToken cancellationToken = default)
    {
        var slot = await FindSlotAsync(slotCode, cancellationToken);
        var stationCode = (await stationRepository.FindByIdAsync(slot.StationId, cancellationToken))?.StationCode
            ?? throw StationSlotException.StationNotFound();
        return Map(slot, stationCode);
    }

    public async Task<BookingSlotResponse> UpdateAsync(
        string slotCode,
        UpdateBookingSlotRequest request,
        CancellationToken cancellationToken = default)
    {
        var slot = await FindSlotAsync(slotCode, cancellationToken);
        if (await reservationQueryService.HasActiveReservationsForSlotAsync(slot.Id, cancellationToken))
        {
            throw StationSlotException.Conflict(
                "SLOT_ACTIVE_RESERVATION",
                "A slot with an active reservation cannot be changed.");
        }
        var station = await stationRepository.FindByIdAsync(slot.StationId, cancellationToken)
            ?? throw StationSlotException.StationNotFound();
        await ValidateSlotAsync(station, request.StartTimeUtc, request.EndTimeUtc,
            request.AvailableEnergyKwh, slot.Id, cancellationToken);
        ValidatePrice(request.PricePerKwh);

        slot.StartTimeUtc = request.StartTimeUtc;
        slot.EndTimeUtc = request.EndTimeUtc;
        slot.AvailableEnergyKwh = request.AvailableEnergyKwh;
        slot.PricePerKwh = request.PricePerKwh;
        if (!await slotRepository.UpdateAsync(slot, cancellationToken))
        {
            throw StationSlotException.SlotNotFound();
        }
        logger.LogInformation("Energy slot {SlotCode} updated", slot.SlotCode);
        return Map(slot, station.StationCode);
    }

    public async Task<BookingSlotResponse> ChangeStatusAsync(
        string slotCode,
        ChangeBookingSlotStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var slot = await FindSlotAsync(slotCode, cancellationToken);
        if (!Enum.TryParse<SlotStatus>(request.Status, true, out var newStatus) ||
            newStatus is SlotStatus.Reserved or SlotStatus.Expired)
        {
            throw StationSlotException.Validation(
                "SLOT_STATUS_INVALID",
                "Slot status can only be changed manually to Available or Unavailable.");
        }
        if (EffectiveStatus(slot) == newStatus)
        {
            throw StationSlotException.Conflict("SLOT_STATUS_UNCHANGED", "Slot already has the requested status.");
        }
        if (newStatus == SlotStatus.Unavailable &&
            await reservationQueryService.HasActiveReservationsForSlotAsync(slot.Id, cancellationToken))
        {
            throw StationSlotException.Conflict(
                "SLOT_ACTIVE_RESERVATION",
                "A slot with an active reservation cannot be made unavailable.");
        }
        if (newStatus == SlotStatus.Available && slot.EndTimeUtc <= DateTime.UtcNow)
        {
            throw StationSlotException.Conflict("SLOT_EXPIRED", "An expired slot cannot be made available.");
        }

        if (!await slotRepository.UpdateStatusAsync(slot.SlotCode, newStatus, cancellationToken))
        {
            throw StationSlotException.SlotNotFound();
        }
        slot.Status = newStatus;
        slot.UpdatedAtUtc = DateTime.UtcNow;
        var stationCode = (await stationRepository.FindByIdAsync(slot.StationId, cancellationToken))?.StationCode
            ?? throw StationSlotException.StationNotFound();
        logger.LogInformation("Energy slot {SlotCode} status changed to {Status}", slot.SlotCode, newStatus);
        return Map(slot, stationCode);
    }

    private async Task ValidateSlotAsync(
        SolarStation station,
        DateTime startTimeUtc,
        DateTime endTimeUtc,
        decimal availableEnergyKwh,
        MongoDB.Bson.ObjectId? excludedId,
        CancellationToken cancellationToken)
    {
        if (startTimeUtc.Kind != DateTimeKind.Utc || endTimeUtc.Kind != DateTimeKind.Utc)
        {
            throw StationSlotException.Validation("SLOT_TIME_ZONE_INVALID", "Slot times must be supplied in UTC.");
        }
        if (startTimeUtc >= endTimeUtc)
        {
            throw StationSlotException.Validation("SLOT_TIME_INVALID", "Slot end time must be after its start time.");
        }
        if (startTimeUtc <= DateTime.UtcNow)
        {
            throw StationSlotException.Validation("SLOT_TIME_PAST", "Slot start time must be in the future.");
        }
        if (startTimeUtc.Date != endTimeUtc.Date ||
            startTimeUtc.TimeOfDay < station.OpeningTime || endTimeUtc.TimeOfDay > station.ClosingTime)
        {
            throw StationSlotException.Validation(
                "SLOT_OUTSIDE_SCHEDULE",
                "Slot times must fall within the station operating schedule on the same UTC day.");
        }
        if (availableEnergyKwh <= 0 || availableEnergyKwh > station.CapacityKwh)
        {
            throw StationSlotException.Validation(
                "SLOT_CAPACITY_INVALID",
                "Slot energy must be greater than zero and cannot exceed station capacity.");
        }
        if (await slotRepository.HasOverlapAsync(
            station.Id, startTimeUtc, endTimeUtc, excludedId, cancellationToken))
        {
            throw StationSlotException.Conflict(
                "SLOT_TIME_OVERLAP",
                "The slot overlaps an existing active slot for this station.");
        }
    }

    private async Task<SolarStation> FindStationAsync(string stationCode, CancellationToken cancellationToken) =>
        await stationRepository.FindByCodeAsync(NormalizeCode(stationCode), cancellationToken)
        ?? throw StationSlotException.StationNotFound();

    private async Task<EnergyBookingSlot> FindSlotAsync(string slotCode, CancellationToken cancellationToken) =>
        await slotRepository.FindByCodeAsync(NormalizeCode(slotCode), cancellationToken)
        ?? throw StationSlotException.SlotNotFound();

    private static string NormalizeCode(string code) => code.Trim().ToUpperInvariant();

    private static void ValidatePrice(decimal pricePerKwh)
    {
        if (pricePerKwh <= 0)
        {
            throw StationSlotException.Validation(
                "SLOT_PRICE_INVALID",
                "Price per kWh must be greater than zero.");
        }
    }

    private static SlotStatus EffectiveStatus(EnergyBookingSlot slot) =>
        slot.EndTimeUtc <= DateTime.UtcNow && slot.Status == SlotStatus.Available
            ? SlotStatus.Expired
            : slot.Status;

    private static BookingSlotResponse Map(EnergyBookingSlot slot, string stationCode) => new(
        slot.SlotCode,
        stationCode,
        slot.StartTimeUtc,
        slot.EndTimeUtc,
        slot.AvailableEnergyKwh,
        slot.PricePerKwh,
        EffectiveStatus(slot).ToString(),
        slot.CreatedAtUtc,
        slot.UpdatedAtUtc);
}
