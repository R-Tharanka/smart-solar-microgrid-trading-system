// -----------------------------------------------------------------------------
// Represents station and slot failures with stable API error codes.
// -----------------------------------------------------------------------------
namespace SmartSolarMicrogrid.Api.Services;

public sealed class StationSlotException(int statusCode, string errorCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    public string ErrorCode { get; } = errorCode;

    // Creates a domain-validation error for well-formed requests that violate business rules.
    public static StationSlotException Validation(string code, string message) =>
        new(StatusCodes.Status422UnprocessableEntity, code, message);

    // Creates a conflict error for duplicate data or invalid state transitions.
    public static StationSlotException Conflict(string code, string message) =>
        new(StatusCodes.Status409Conflict, code, message);

    // Creates the consistent not-found response used for station lookups.
    public static StationSlotException StationNotFound() =>
        new(StatusCodes.Status404NotFound, "STATION_NOT_FOUND", "Solar station was not found.");

    // Creates the consistent not-found response used for slot lookups.
    public static StationSlotException SlotNotFound() =>
        new(StatusCodes.Status404NotFound, "SLOT_NOT_FOUND", "Energy booking slot was not found.");
}
