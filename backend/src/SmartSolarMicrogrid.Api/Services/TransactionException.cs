namespace SmartSolarMicrogrid.Api.Services;

public sealed class TransactionException(int statusCode, string errorCode, string message) : Exception(message)
{
    // HTTP status and stable client-facing code are converted to Problem Details by the global handler.
    public int StatusCode { get; } = statusCode;
    public string ErrorCode { get; } = errorCode;

    public static TransactionException NotFound() =>
        new(StatusCodes.Status404NotFound, "TRANSACTION_NOT_FOUND", "Reservation transaction was not found.");

    public static TransactionException Forbidden() =>
        new(StatusCodes.Status403Forbidden, "TRANSACTION_FORBIDDEN", "You cannot issue a QR transaction for this reservation.");

    public static TransactionException Conflict(string code, string message) =>
        new(StatusCodes.Status409Conflict, code, message);

    public static TransactionException InvalidToken() =>
        new(StatusCodes.Status400BadRequest, "QR_TOKEN_INVALID", "The QR transaction token is invalid.");

    public static TransactionException Validation(string code, string message) =>
        new(StatusCodes.Status422UnprocessableEntity, code, message);
}
