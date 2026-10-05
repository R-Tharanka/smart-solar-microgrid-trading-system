// -----------------------------------------------------------------------------
// File: TransactionException.cs
// Purpose: Carries HTTP status codes and stable errors for transaction failures.
// -----------------------------------------------------------------------------
namespace SmartSolarMicrogrid.Api.Services;

public sealed class TransactionException(int statusCode, string errorCode, string message) : Exception(message)
{
    // HTTP status and stable client-facing code are converted to Problem Details by the global handler.
    public int StatusCode { get; } = statusCode;
    public string ErrorCode { get; } = errorCode;

    // Create the error returned when the requested transaction does not exist.
    public static TransactionException NotFound() =>
        new(StatusCodes.Status404NotFound, "TRANSACTION_NOT_FOUND", "Reservation transaction was not found.");

    // Create the error returned when the caller cannot access the reservation transaction.
    public static TransactionException Forbidden() =>
        new(StatusCodes.Status403Forbidden, "TRANSACTION_FORBIDDEN", "You cannot issue a QR transaction for this reservation.");

    // Create a conflict error with the supplied business code and message.
    public static TransactionException Conflict(string code, string message) =>
        new(StatusCodes.Status409Conflict, code, message);

    // Create the error returned for an invalid QR transaction token.
    public static TransactionException InvalidToken() =>
        new(StatusCodes.Status400BadRequest, "QR_TOKEN_INVALID", "The QR transaction token is invalid.");

    // Create a validation error with the supplied business code and message.
    public static TransactionException Validation(string code, string message) =>
        new(StatusCodes.Status422UnprocessableEntity, code, message);
}
