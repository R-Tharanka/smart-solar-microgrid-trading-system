using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Persistence.Repositories;

public interface IUserRepository
{
    Task<User?> FindByNicAsync(string nic, CancellationToken cancellationToken = default);
    Task<User?> FindByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<User?> FindByIdentifierAsync(string identifier, CancellationToken cancellationToken = default);
    Task<List<User>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<long> CountActiveBackofficeAsync(CancellationToken cancellationToken = default);
    Task CreateAsync(User user, CancellationToken cancellationToken = default);
    Task UpdateAsync(User user, CancellationToken cancellationToken = default);
    Task<bool> UpdateStatusAsync(string identifier, UserStatus status, CancellationToken cancellationToken = default);
    Task RecordSuccessfulLoginAsync(string identifier, DateTime loginAtUtc, CancellationToken cancellationToken = default);
}
