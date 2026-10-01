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

    public async Task<List<User>> GetProsumersByStatusAsync(
        UserStatus status,
        CancellationToken cancellationToken = default)
    {
        // Return a deterministic review queue containing only Prosumers in the requested state.
        return await _users.Find(u => u.Role == UserRole.Prosumer && u.Status == status)
            .SortBy(u => u.CreatedAtUtc)
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
        CancellationToken cancellationToken = default,
        string? rejectionReason = null)
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

        if (status == UserStatus.Deactivated)
        {
            update = update
                .Set(u => u.DeactivatedAtUtc, changedAtUtc)
                .Set(u => u.DeactivationRequested, false)
                .Unset(u => u.DeactivationRequestedAtUtc);
        }
        else if (status == UserStatus.Rejected)
        {
            update = update
                .Set(u => u.RejectionReason, rejectionReason)
                .Set(u => u.RejectedAtUtc, changedAtUtc);
        }
        else if (status == UserStatus.Active)
        {
            update = update
                .Unset(u => u.RejectionReason)
                .Unset(u => u.RejectedAtUtc);
            if (expectedStatus == UserStatus.Deactivated)
            {
                update = update.Set(u => u.ReactivatedAtUtc, changedAtUtc);
            }
        }

        var result = await _users.UpdateOneAsync(filter, update, new UpdateOptions(), cancellationToken);
        return result.MatchedCount == 1;
    }

    public async Task<bool> RequestDeactivationAsync(
        string nic,
        DateTime requestedAtUtc,
        CancellationToken cancellationToken = default)
    {
        // Keep the account active while atomically preventing duplicate pending requests.
        var filter = Builders<User>.Filter.And(
            Builders<User>.Filter.Eq(u => u.Nic, nic),
            Builders<User>.Filter.Eq(u => u.Role, UserRole.Prosumer),
            Builders<User>.Filter.Eq(u => u.Status, UserStatus.Active),
            Builders<User>.Filter.Ne(u => u.DeactivationRequested, true));
        var update = Builders<User>.Update
            .Set(u => u.DeactivationRequested, true)
            .Set(u => u.DeactivationRequestedAtUtc, requestedAtUtc)
            .Set(u => u.UpdatedAtUtc, requestedAtUtc);

        var result = await _users.UpdateOneAsync(filter, update, new UpdateOptions(), cancellationToken);
        return result.ModifiedCount == 1;
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
