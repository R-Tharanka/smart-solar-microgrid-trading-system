namespace SmartSolarMicrogrid.Api.Services;

public sealed class StationSlotException(int statusCode, string errorCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    public string ErrorCode { get; } = errorCode;

    public static StationSlotException Validation(string code, string message) =>
        new(StatusCodes.Status422UnprocessableEntity, code, message);

    public static StationSlotException Conflict(string code, string message) =>
        new(StatusCodes.Status409Conflict, code, message);

    public static StationSlotException StationNotFound() =>
        new(StatusCodes.Status404NotFound, "STATION_NOT_FOUND", "Solar station was not found.");

    public static StationSlotException SlotNotFound() =>
        new(StatusCodes.Status404NotFound, "SLOT_NOT_FOUND", "Energy booking slot was not found.");
}
