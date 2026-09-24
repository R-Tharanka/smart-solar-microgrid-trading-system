namespace SmartSolarMicrogrid.Api.Services;

public sealed class IdentityException(int statusCode, string errorCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    public string ErrorCode { get; } = errorCode;

    public static IdentityException Validation(string message) =>
        new(StatusCodes.Status422UnprocessableEntity, "VALIDATION_IDENTITY", message);

    public static IdentityException Conflict(string code, string message) =>
        new(StatusCodes.Status409Conflict, code, message);

    public static IdentityException Unauthorized(string message = "Invalid credentials.") =>
        new(StatusCodes.Status401Unauthorized, "AUTH_INVALID_CREDENTIALS", message);

    public static IdentityException Forbidden(string code, string message) =>
        new(StatusCodes.Status403Forbidden, code, message);

    public static IdentityException NotFound() =>
        new(StatusCodes.Status404NotFound, "USER_NOT_FOUND", "User was not found.");
}
