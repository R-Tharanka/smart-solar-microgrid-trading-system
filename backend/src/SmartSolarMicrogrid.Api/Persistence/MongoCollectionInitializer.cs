using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Configuration;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Persistence;

public sealed class MongoCollectionInitializer(
    MongoDbContext context,
    IOptions<BootstrapAdminOptions> bootstrapAdminOptions,
    ILogger<MongoCollectionInitializer> logger)
{
    public async Task InitializeAsync(CancellationToken cancellationToken)
    {
        await EnsureCollectionsAsync(cancellationToken);
        await MigrateLegacyUserFieldNamesAsync(cancellationToken);
        await EnsureIndexesAsync(cancellationToken);
        await SeedInitialAdminAsync(cancellationToken);
        logger.LogInformation("MongoDB collections, indexes, and seed data are ready");
    }

    private async Task MigrateLegacyUserFieldNamesAsync(CancellationToken cancellationToken)
    {
        var users = context.Database.GetCollection<BsonDocument>(CollectionNames.Users);
        var legacyDocuments = new BsonDocument
        {
            { "Email", new BsonDocument("$exists", true) },
            { "email", new BsonDocument("$exists", false) }
        };
        var update = Builders<BsonDocument>.Update.Combine(
            Builders<BsonDocument>.Update.Rename("Nic", "nic"),
            Builders<BsonDocument>.Update.Rename("Email", "email"),
            Builders<BsonDocument>.Update.Rename("PasswordHash", "passwordHash"),
            Builders<BsonDocument>.Update.Rename("FirstName", "firstName"),
            Builders<BsonDocument>.Update.Rename("LastName", "lastName"),
            Builders<BsonDocument>.Update.Rename("Role", "role"),
            Builders<BsonDocument>.Update.Rename("Status", "status"),
            Builders<BsonDocument>.Update.Rename("CreatedAtUtc", "createdAtUtc"),
            Builders<BsonDocument>.Update.Rename("UpdatedAtUtc", "updatedAtUtc"));

        var result = await users.UpdateManyAsync(legacyDocuments, update, cancellationToken: cancellationToken);
        if (result.ModifiedCount > 0)
        {
            logger.LogInformation("Migrated {UserCount} legacy user documents to camel-case fields", result.ModifiedCount);
        }
    }

    private async Task SeedInitialAdminAsync(CancellationToken cancellationToken)
    {
        var options = bootstrapAdminOptions.Value;
        if (!options.Enabled)
        {
            return;
        }

        var users = context.Database.GetCollection<User>(CollectionNames.Users);
        var adminCount = await users.CountDocumentsAsync(
            u => u.Role == UserRole.Backoffice,
            cancellationToken: cancellationToken);
        if (adminCount > 0)
        {
            logger.LogInformation("Backoffice bootstrap skipped because an administrator already exists");
            return;
        }

        var now = DateTime.UtcNow;
        var adminUser = new User
        {
            Email = options.Email.Trim().ToLowerInvariant(),
            FirstName = options.FirstName.Trim(),
            LastName = options.LastName.Trim(),
            Role = UserRole.Backoffice,
            Status = UserStatus.Active,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(options.Password),
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };
        await users.InsertOneAsync(adminUser, new InsertOneOptions(), cancellationToken);
        logger.LogInformation("Initial Backoffice administrator seeded from secure configuration");
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
        await EnsureIndexesAsync(users, new[]
        {
            Index("ux_users_email", new BsonDocument("email", 1), unique: true),
            Index("ux_users_nic", new BsonDocument("nic", 1), unique: true, sparse: true),
            Index("ix_users_role_status", new BsonDocument { { "role", 1 }, { "status", 1 } })
        }, cancellationToken);

        var stations = context.Database.GetCollection<BsonDocument>(CollectionNames.SolarStations);
        await EnsureIndexesAsync(stations, new[]
        {
            Index("ux_stations_code", new BsonDocument("stationCode", 1), unique: true),
            Index("ix_stations_status", new BsonDocument("status", 1)),
            Index("ix_stations_location", new BsonDocument("location", "2dsphere"))
        }, cancellationToken);

        var slots = context.Database.GetCollection<BsonDocument>(CollectionNames.EnergyBookingSlots);
        await EnsureIndexesAsync(slots, new[]
        {
            Index("ux_slots_code", new BsonDocument("slotCode", 1), unique: true, sparse: true),
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
        await EnsureIndexesAsync(reservations, new[]
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

    private static async Task EnsureIndexesAsync(
        IMongoCollection<BsonDocument> collection,
        IReadOnlyCollection<CreateIndexModel<BsonDocument>> desiredIndexes,
        CancellationToken cancellationToken)
    {
        var existingIndexes = await (await collection.Indexes.ListAsync(cancellationToken))
            .ToListAsync(cancellationToken);

        var toCreate = new List<CreateIndexModel<BsonDocument>>();
        foreach (var desired in desiredIndexes)
        {
            var name = desired.Options.Name
                ?? throw new InvalidOperationException("Application indexes must have a stable name.");
            var existing = existingIndexes.FirstOrDefault(index => index["name"] == name);
            var desiredKeys = desired.Keys.Render(new RenderArgs<BsonDocument>(
                collection.DocumentSerializer,
                collection.Settings.SerializerRegistry));

            if (existing is not null && existing["key"].AsBsonDocument != desiredKeys)
            {
                await collection.Indexes.DropOneAsync(name, cancellationToken);
                existing = null;
            }

            if (existing is null)
            {
                toCreate.Add(desired);
            }
        }

        if (toCreate.Count > 0)
        {
            await collection.Indexes.CreateManyAsync(toCreate, cancellationToken);
        }
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
