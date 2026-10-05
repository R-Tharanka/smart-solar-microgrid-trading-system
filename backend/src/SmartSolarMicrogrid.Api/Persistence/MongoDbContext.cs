// -----------------------------------------------------------------------------
// File: MongoDbContext.cs
// Purpose: Creates the MongoDB client and exposes the configured database.
// -----------------------------------------------------------------------------
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Configuration;

namespace SmartSolarMicrogrid.Api.Persistence;

public sealed class MongoDbContext
{
    public MongoDbContext(IOptions<MongoDbOptions> options)
    {
        // Create the MongoDB client and select the configured database.
        var settings = MongoClientSettings.FromConnectionString(options.Value.ConnectionString);
        settings.ServerApi = new ServerApi(ServerApiVersion.V1);
        Client = new MongoClient(settings);
        Database = Client.GetDatabase(options.Value.DatabaseName);
    }

    public MongoClient Client { get; }
    public IMongoDatabase Database { get; }
}
