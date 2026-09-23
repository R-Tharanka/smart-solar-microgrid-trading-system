using Microsoft.Extensions.Diagnostics.HealthChecks;
using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Persistence;

namespace SmartSolarMicrogrid.Api.Infrastructure;

public sealed class MongoDbHealthCheck(MongoDbContext context) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext healthContext,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await context.Database.RunCommandAsync<BsonDocument>(
                new BsonDocument("ping", 1), cancellationToken: cancellationToken);
            return HealthCheckResult.Healthy("MongoDB connection is available.");
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy("MongoDB connection is unavailable.", exception);
        }
    }
}
