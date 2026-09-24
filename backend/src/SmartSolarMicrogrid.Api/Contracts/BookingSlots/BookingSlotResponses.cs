namespace SmartSolarMicrogrid.Api.Contracts.BookingSlots;

public record BookingSlotResponse(
    string SlotCode,
    string StationCode,
    DateTime StartTimeUtc,
    DateTime EndTimeUtc,
    decimal AvailableEnergyKwh,
    decimal PricePerKwh,
    string Status,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);
