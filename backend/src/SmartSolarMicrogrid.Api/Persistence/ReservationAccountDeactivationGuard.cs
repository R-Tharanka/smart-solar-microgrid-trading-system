using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Persistence;

public sealed class ReservationAccountDeactivationGuard(MongoDbContext context) : IAccountDeactivationGuard
{
    private static readonly BsonArray NonTerminalStatuses =
    [
        "Pending",
        "Approved",
        "QrIssued",
        "Verified"
    ];

    public async Task EnsureCanDeactivateAsync(
        string prosumerNic,
        CancellationToken cancellationToken = default)
    {
        var reservations = context.Database.GetCollection<BsonDocument>(CollectionNames.EnergyReservations);
        var filter = new BsonDocument
        {
            { "prosumerNic", prosumerNic },
            { "status", new BsonDocument("$in", NonTerminalStatuses) }
        };

        if (await reservations.CountDocumentsAsync(filter, cancellationToken: cancellationToken) > 0)
        {
            throw IdentityException.Conflict(
                "USER_ACTIVE_RESERVATIONS",
                "The account cannot be deactivated while it has non-terminal reservations.");
        }
    }
}
