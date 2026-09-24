using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogrid.Api.Contracts.BookingSlots;

public static class BookingSlotValidationRules
{
    public const string CodePattern = @"^SLT-[A-Z0-9]+(?:-[A-Z0-9]+)*$";
}

public sealed record CreateBookingSlotRequest
{
    public CreateBookingSlotRequest() { }

    public CreateBookingSlotRequest(string slotCode, DateTime startTimeUtc,
        DateTime endTimeUtc, decimal availableEnergyKwh, decimal pricePerKwh) =>
        (SlotCode, StartTimeUtc, EndTimeUtc, AvailableEnergyKwh, PricePerKwh) =
        (slotCode, startTimeUtc, endTimeUtc, availableEnergyKwh, pricePerKwh);

    [Required, StringLength(50, MinimumLength = 3), RegularExpression(BookingSlotValidationRules.CodePattern)]
    public string SlotCode { get; init; } = string.Empty;

    public DateTime StartTimeUtc { get; init; }
    public DateTime EndTimeUtc { get; init; }

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335")]
    public decimal AvailableEnergyKwh { get; init; }

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335")]
    public decimal PricePerKwh { get; init; }
}

public sealed record UpdateBookingSlotRequest
{
    public UpdateBookingSlotRequest() { }

    public UpdateBookingSlotRequest(DateTime startTimeUtc, DateTime endTimeUtc,
        decimal availableEnergyKwh, decimal pricePerKwh) =>
        (StartTimeUtc, EndTimeUtc, AvailableEnergyKwh, PricePerKwh) =
        (startTimeUtc, endTimeUtc, availableEnergyKwh, pricePerKwh);

    public DateTime StartTimeUtc { get; init; }
    public DateTime EndTimeUtc { get; init; }

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335")]
    public decimal AvailableEnergyKwh { get; init; }

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335")]
    public decimal PricePerKwh { get; init; }
}

public sealed record ChangeBookingSlotStatusRequest
{
    public ChangeBookingSlotStatusRequest() { }

    public ChangeBookingSlotStatusRequest(string status, string? reason) =>
        (Status, Reason) = (status, reason);

    [Required, RegularExpression("^(Available|Unavailable)$")]
    public string Status { get; init; } = string.Empty;

    [StringLength(300)]
    public string? Reason { get; init; }
}
