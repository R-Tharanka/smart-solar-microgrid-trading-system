// -----------------------------------------------------------------------------
// File: UserRepository.cs
// Member 1: Identity, Authentication, Authorization and Account Management
// Purpose: Persists user identities and account lifecycle changes in MongoDB.
// -----------------------------------------------------------------------------
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Persistence.Repositories;

public class UserRepository(MongoDbContext context) : IUserRepository
{
    private readonly IMongoCollection<User> _users = context.Database.GetCollection<User>(CollectionNames.Users);

    public async Task<User?> FindByNicAsync(string nic, CancellationToken cancellationToken = default)
    {
        // Query the unique normalized Prosumer NIC.
        return await _users.Find(u => u.Nic == nic).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<User?> FindByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        // Query the unique normalized account email.
        return await _users.Find(u => u.Email == email).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<User?> FindByIdentifierAsync(string identifier, CancellationToken cancellationToken = default)
    {
        // Support role-specific login by matching either email or NIC.
        return await _users.Find(u => u.Email == identifier || u.Nic == identifier).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<List<User>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        // Return a deterministic role-and-email ordered account list.
        return await _users.Find(_ => true)
            .SortBy(u => u.Role)
            .ThenBy(u => u.Email)
            .ToListAsync(cancellationToken);
    }

    public Task<long> CountActiveBackofficeAsync(CancellationToken cancellationToken = default)
    {
        // Count active administrators to protect the final Backoffice account.
        return _users.CountDocumentsAsync(
            u => u.Role == UserRole.Backoffice && u.Status == UserStatus.Active,
            cancellationToken: cancellationToken);
    }

    public async Task CreateAsync(User user, CancellationToken cancellationToken = default)
    {
        // Stamp creation metadata before inserting the new account.
        user.CreatedAtUtc = DateTime.UtcNow;
        user.UpdatedAtUtc = DateTime.UtcNow;
        await _users.InsertOneAsync(user, new InsertOneOptions(), cancellationToken);
    }

    public async Task UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        // Replace the matching persisted account and fail if it no longer exists.
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
        // Use the expected status in the filter to make the lifecycle transition atomic.
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
        // Update login audit metadata without replacing the full account document.
        var filter = Builders<User>.Filter.Or(
            Builders<User>.Filter.Eq(u => u.Email, identifier),
            Builders<User>.Filter.Eq(u => u.Nic, identifier));
        var update = Builders<User>.Update
            .Set(u => u.LastLoginAtUtc, loginAtUtc)
            .Set(u => u.UpdatedAtUtc, loginAtUtc);

        await _users.UpdateOneAsync(filter, update, new UpdateOptions(), cancellationToken);
    }
}
