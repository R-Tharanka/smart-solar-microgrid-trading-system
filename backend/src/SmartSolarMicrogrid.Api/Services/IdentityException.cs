// -----------------------------------------------------------------------------
// File: IdentityException.cs
// Purpose: Carries safe HTTP status and error codes for identity-domain failures.
// -----------------------------------------------------------------------------
namespace SmartSolarMicrogrid.Api.Services;

public sealed class IdentityException(int statusCode, string errorCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    public string ErrorCode { get; } = errorCode;

    public static IdentityException Validation(string message)
    {
        // Represent identity input that is structurally valid but violates domain validation.
        return new(StatusCodes.Status422UnprocessableEntity, "VALIDATION_IDENTITY", message);
    }

    public static IdentityException Conflict(string code, string message)
    {
        // Represent duplicate identifiers or invalid account lifecycle transitions.
        return new(StatusCodes.Status409Conflict, code, message);
    }

    public static IdentityException BadRequest(string code, string message)
    {
        // Represent a request that cannot be processed in its current form.
        return new(StatusCodes.Status400BadRequest, code, message);
    }

    public static IdentityException Unauthorized(string message = "Invalid credentials.")
    {
        // Return a generic authentication failure without revealing account existence.
        return new(StatusCodes.Status401Unauthorized, "AUTH_INVALID_CREDENTIALS", message);
    }

    public static IdentityException Forbidden(string code, string message)
    {
        // Represent an authenticated account that cannot perform the requested operation.
        return new(StatusCodes.Status403Forbidden, code, message);
    }

    public static IdentityException NotFound()
    {
        // Return the stable public error used when an account cannot be resolved.
        return new(StatusCodes.Status404NotFound, "USER_NOT_FOUND", "User was not found.");
    }
}
