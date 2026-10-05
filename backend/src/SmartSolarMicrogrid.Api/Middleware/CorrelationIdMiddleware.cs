// -----------------------------------------------------------------------------
// File: CorrelationIdMiddleware.cs
// Purpose: Propagates a correlation identifier through each HTTP request and response.
// -----------------------------------------------------------------------------
namespace SmartSolarMicrogrid.Api.Middleware;

public sealed class CorrelationIdMiddleware(RequestDelegate next)
{
    public const string HeaderName = "X-Correlation-ID";

    public async Task InvokeAsync(HttpContext context)
    {
        // Reuse or generate a correlation ID before passing the request to the next middleware.
        var correlationId = context.Request.Headers.TryGetValue(HeaderName, out var supplied)
            && !string.IsNullOrWhiteSpace(supplied)
            ? supplied.ToString()
            : Guid.NewGuid().ToString("N");

        context.TraceIdentifier = correlationId;
        context.Response.Headers[HeaderName] = correlationId;
        await next(context);
    }
}
