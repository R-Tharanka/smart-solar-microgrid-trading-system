using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Middleware;

public sealed class ApiExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (status, title, code, detail) = exception switch
        {
            IdentityException identity =>
                (identity.StatusCode, "Identity request failed", identity.ErrorCode, identity.Message),
            StationSlotException stationSlot =>
                (stationSlot.StatusCode, "Station or slot request failed", stationSlot.ErrorCode, stationSlot.Message),
            TransactionException transaction =>
                (transaction.StatusCode, "Transaction request failed", transaction.ErrorCode, transaction.Message),
            ReservationException reservation =>
                (reservation.StatusCode, "Reservation request failed", reservation.ErrorCode, reservation.Message),
            MongoWriteException { WriteError.Category: ServerErrorCategory.DuplicateKey } =>
                (StatusCodes.Status409Conflict, "Duplicate user", "USER_IDENTIFIER_EXISTS", "The email or NIC is already registered."),
            _ =>
                (StatusCodes.Status500InternalServerError, "Unexpected server error", "INTERNAL_ERROR", "An unexpected error occurred.")
        };

        if (status >= 500)
        {
            logger.LogError(exception, "Unhandled exception for {Method} {Path}", httpContext.Request.Method, httpContext.Request.Path);
        }
        else
        {
            logger.LogWarning("Request failed with {ErrorCode}: {Detail}", code, detail);
        }

        httpContext.Response.StatusCode = status;
        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = detail,
            Instance = httpContext.Request.Path
        };
        problem.Extensions["errorCode"] = code;
        problem.Extensions["traceId"] = httpContext.TraceIdentifier;

        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problem
        });
    }
}
