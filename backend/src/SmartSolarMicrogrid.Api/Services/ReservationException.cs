namespace SmartSolarMicrogrid.Api.Services;

public sealed class ReservationException(int statusCode, string errorCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    public string ErrorCode { get; } = errorCode;

    // Creates a domain-validation error for well-formed requests that violate business rules.
    public static ReservationException Validation(string code, string message) =>
        new(StatusCodes.Status422UnprocessableEntity, code, message);

    // Creates a conflict error for duplicate data or invalid state transitions.
    public static ReservationException Conflict(string code, string message) =>
        new(StatusCodes.Status409Conflict, code, message);

    // Creates the consistent not-found response used for reservation lookups.
    public static ReservationException NotFound() =>
        new(StatusCodes.Status404NotFound, "RESERVATION_NOT_FOUND", "Energy reservation was not found.");

    // Creates a forbidden response when a Prosumer attempts to access another user's reservation.
    public static ReservationException NotOwned() =>
        new(StatusCodes.Status403Forbidden, "RESERVATION_NOT_OWNED", "You do not have access to this reservation.");
}
