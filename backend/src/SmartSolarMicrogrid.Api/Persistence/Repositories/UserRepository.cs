using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Persistence.Repositories;

public class UserRepository(MongoDbContext context) : IUserRepository
{
    private readonly IMongoCollection<User> _users = context.Database.GetCollection<User>(CollectionNames.Users);

    public async Task<User?> FindByNicAsync(string nic, CancellationToken cancellationToken = default)
    {
        return await _users.Find(u => u.Nic == nic).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<User?> FindByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _users.Find(u => u.Email == email).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<User?> FindByIdentifierAsync(string identifier, CancellationToken cancellationToken = default)
    {
        return await _users.Find(u => u.Email == identifier || u.Nic == identifier).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<List<User>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _users.Find(_ => true)
            .SortBy(u => u.Role)
            .ThenBy(u => u.Email)
            .ToListAsync(cancellationToken);
    }

    public Task<long> CountActiveBackofficeAsync(CancellationToken cancellationToken = default)
    {
        return _users.CountDocumentsAsync(
            u => u.Role == UserRole.Backoffice && u.Status == UserStatus.Active,
            cancellationToken: cancellationToken);
    }

    public async Task CreateAsync(User user, CancellationToken cancellationToken = default)
    {
        user.CreatedAtUtc = DateTime.UtcNow;
        user.UpdatedAtUtc = DateTime.UtcNow;
        await _users.InsertOneAsync(user, new InsertOneOptions(), cancellationToken);
    }

    public async Task UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        user.UpdatedAtUtc = DateTime.UtcNow;
        var filter = Builders<User>.Filter.Eq(u => u.Id, user.Id);
        var result = await _users.ReplaceOneAsync(filter, user, new ReplaceOptions(), cancellationToken);
        if (result.MatchedCount == 0)
        {
            throw new KeyNotFoundException("User not found.");
        }
    }

    public async Task<bool> UpdateStatusAsync(
        string identifier,
        UserStatus expectedStatus,
        UserStatus status,
        string changedByIdentifier,
        DateTime changedAtUtc,
        CancellationToken cancellationToken = default)
    {
        var filter = Builders<User>.Filter.And(
            Builders<User>.Filter.Or(
                Builders<User>.Filter.Eq(u => u.Email, identifier),
                Builders<User>.Filter.Eq(u => u.Nic, identifier)),
            Builders<User>.Filter.Eq(u => u.Status, expectedStatus));
        var update = Builders<User>.Update
            .Set(u => u.Status, status)
            .Set(u => u.StatusChangedByIdentifier, changedByIdentifier)
            .Set(u => u.UpdatedAtUtc, changedAtUtc);

        update = status == UserStatus.Deactivated
            ? update.Set(u => u.DeactivatedAtUtc, changedAtUtc)
            : update.Set(u => u.ReactivatedAtUtc, changedAtUtc);

        var result = await _users.UpdateOneAsync(filter, update, new UpdateOptions(), cancellationToken);
        return result.MatchedCount == 1;
    }

    public async Task RecordSuccessfulLoginAsync(
        string identifier,
        DateTime loginAtUtc,
        CancellationToken cancellationToken = default)
    {
        var filter = Builders<User>.Filter.Or(
            Builders<User>.Filter.Eq(u => u.Email, identifier),
            Builders<User>.Filter.Eq(u => u.Nic, identifier));
        var update = Builders<User>.Update
            .Set(u => u.LastLoginAtUtc, loginAtUtc)
            .Set(u => u.UpdatedAtUtc, loginAtUtc);

        await _users.UpdateOneAsync(filter, update, new UpdateOptions(), cancellationToken);
    }
}
