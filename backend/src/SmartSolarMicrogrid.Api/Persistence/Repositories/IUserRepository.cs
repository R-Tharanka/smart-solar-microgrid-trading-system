// -----------------------------------------------------------------------------
// File: IUserRepository.cs
// Purpose: Defines persistence operations required by the identity domain.
// -----------------------------------------------------------------------------
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Persistence.Repositories;

public interface IUserRepository
{
    // Find a Prosumer by normalized NIC.
    Task<User?> FindByNicAsync(string nic, CancellationToken cancellationToken = default);
    // Find an account by normalized email address.
    Task<User?> FindByEmailAsync(string email, CancellationToken cancellationToken = default);
    // Find an account by its role-appropriate business identifier.
    Task<User?> FindByIdentifierAsync(string identifier, CancellationToken cancellationToken = default);
    // Return all accounts for Backoffice administration.
    Task<List<User>> GetAllAsync(CancellationToken cancellationToken = default);
    // Return Prosumer accounts in the requested lifecycle state.
    Task<List<User>> GetProsumersByStatusAsync(UserStatus status, CancellationToken cancellationToken = default);
    // Count active Backoffice accounts before an administrative deactivation.
    Task<long> CountActiveBackofficeAsync(CancellationToken cancellationToken = default);
    // Persist a newly registered account.
    Task CreateAsync(User user, CancellationToken cancellationToken = default);
    // Replace an existing account after a profile or password update.
    Task UpdateAsync(User user, CancellationToken cancellationToken = default);
    // Atomically transition an account from the expected status to a new status.
    Task<bool> UpdateStatusAsync(
        string identifier,
        UserStatus expectedStatus,
        UserStatus status,
        string changedByIdentifier,
        DateTime changedAtUtc,
        CancellationToken cancellationToken = default,
        string? rejectionReason = null);
    // Atomically record one pending self-service deactivation request.
    Task<bool> RequestDeactivationAsync(
        string nic,
        DateTime requestedAtUtc,
        CancellationToken cancellationToken = default);
    // Record the latest successful authentication time.
    Task RecordSuccessfulLoginAsync(string identifier, DateTime loginAtUtc, CancellationToken cancellationToken = default);
}
