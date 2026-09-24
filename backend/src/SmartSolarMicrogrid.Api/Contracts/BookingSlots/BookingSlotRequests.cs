using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogrid.Api.Contracts.BookingSlots;

public static class BookingSlotValidationRules
{
    public const string CodePattern = @"^SLT-[A-Z0-9]+(?:-[A-Z0-9]+)*$";
}

public record CreateBookingSlotRequest(
    [property: Required, StringLength(50, MinimumLength = 3), RegularExpression(BookingSlotValidationRules.CodePattern)] string SlotCode,
    DateTime StartTimeUtc,
    DateTime EndTimeUtc,
    [property: Range(typeof(decimal), "0.01", "79228162514264337593543950335")] decimal AvailableEnergyKwh,
    [property: Range(typeof(decimal), "0.01", "79228162514264337593543950335")] decimal PricePerKwh);

public record UpdateBookingSlotRequest(
    DateTime StartTimeUtc,
    DateTime EndTimeUtc,
    [property: Range(typeof(decimal), "0.01", "79228162514264337593543950335")] decimal AvailableEnergyKwh,
    [property: Range(typeof(decimal), "0.01", "79228162514264337593543950335")] decimal PricePerKwh);

public record ChangeBookingSlotStatusRequest(
    [property: Required, RegularExpression("^(Available|Unavailable)$")] string Status,
    [property: StringLength(300)] string? Reason);
