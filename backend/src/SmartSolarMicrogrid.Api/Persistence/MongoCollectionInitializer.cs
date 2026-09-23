using MongoDB.Bson;
using MongoDB.Driver;

namespace SmartSolarMicrogrid.Api.Persistence;

public sealed class MongoCollectionInitializer(MongoDbContext context, ILogger<MongoCollectionInitializer> logger)
{
    public async Task InitializeAsync(CancellationToken cancellationToken)
    {
        await EnsureCollectionsAsync(cancellationToken);
        await EnsureIndexesAsync(cancellationToken);
        logger.LogInformation("MongoDB collections and indexes are ready");
    }

    private async Task EnsureCollectionsAsync(CancellationToken cancellationToken)
    {
        var existing = await (await context.Database.ListCollectionNamesAsync(cancellationToken: cancellationToken))
            .ToListAsync(cancellationToken);

        foreach (var name in new[]
                 {
                     CollectionNames.Users,
                     CollectionNames.SolarStations,
                     CollectionNames.EnergyBookingSlots,
                     CollectionNames.EnergyReservations
                 })
        {
            if (!existing.Contains(name, StringComparer.Ordinal))
            {
                await context.Database.CreateCollectionAsync(name, cancellationToken: cancellationToken);
            }
        }
    }

    private async Task EnsureIndexesAsync(CancellationToken cancellationToken)
    {
        var users = context.Database.GetCollection<BsonDocument>(CollectionNames.Users);
        await users.Indexes.CreateManyAsync(new[]
        {
            Index("ux_users_email", new BsonDocument("email", 1), unique: true),
            Index("ux_users_nic", new BsonDocument("nic", 1), unique: true, sparse: true),
            Index("ix_users_role_status", new BsonDocument { { "role", 1 }, { "status", 1 } })
        }, cancellationToken);

        var stations = context.Database.GetCollection<BsonDocument>(CollectionNames.SolarStations);
        await stations.Indexes.CreateManyAsync(new[]
        {
            Index("ux_stations_code", new BsonDocument("stationCode", 1), unique: true),
            Index("ix_stations_status", new BsonDocument("status", 1)),
            Index("ix_stations_location", new BsonDocument("location", "2dsphere"))
        }, cancellationToken);

        var slots = context.Database.GetCollection<BsonDocument>(CollectionNames.EnergyBookingSlots);
        await slots.Indexes.CreateManyAsync(new[]
        {
            Index("ux_slots_station_period", new BsonDocument
            {
                { "stationId", 1 }, { "startTimeUtc", 1 }, { "endTimeUtc", 1 }
            }, unique: true),
            Index("ix_slots_station_status_start", new BsonDocument
            {
                { "stationId", 1 }, { "status", 1 }, { "startTimeUtc", 1 }
            })
        }, cancellationToken);

        var reservations = context.Database.GetCollection<BsonDocument>(CollectionNames.EnergyReservations);
        await reservations.Indexes.CreateManyAsync(new[]
        {
            Index("ux_reservations_code", new BsonDocument("reservationCode", 1), unique: true),
            Index("ux_reservations_active_slot", new BsonDocument("slotId", 1), unique: true,
                partialFilter: new BsonDocument("status", new BsonDocument("$in", new BsonArray
                {
                    "Pending", "Approved", "QrIssued", "Verified"
                }))),
            Index("ix_reservations_prosumer_start", new BsonDocument
            {
                { "prosumerNic", 1 }, { "scheduledStartTimeUtc", -1 }
            }),
            Index("ix_reservations_station_status_start", new BsonDocument
            {
                { "stationId", 1 }, { "status", 1 }, { "scheduledStartTimeUtc", 1 }
            }),
            Index("ix_reservations_qr_hash", new BsonDocument("qrTokenHash", 1), unique: true, sparse: true)
        }, cancellationToken);
    }

    private static CreateIndexModel<BsonDocument> Index(
        string name,
        BsonDocument keys,
        bool unique = false,
        bool sparse = false,
        BsonDocument? partialFilter = null) =>
        new(keys, new CreateIndexOptions<BsonDocument>
        {
            Name = name,
            Unique = unique,
            Sparse = sparse,
            PartialFilterExpression = partialFilter
        });
}
