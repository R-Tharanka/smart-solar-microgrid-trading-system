using SmartSolarMicrogrid.Api.Contracts.Identity;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Services;

public interface IIdentityService
{
    Task<LoginResponse> AuthenticateAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<UserResponse> RegisterProsumerAsync(RegisterProsumerRequest request, CancellationToken cancellationToken = default);
    Task<UserResponse> CreateStaffAsync(string actorIdentifier, CreateStaffRequest request, CancellationToken cancellationToken = default);
    Task<UserResponse> GetCurrentUserAsync(string identifier, CancellationToken cancellationToken = default);
    Task<UserResponse> UpdateProfileAsync(string identifier, UpdateProfileRequest request, CancellationToken cancellationToken = default);
    Task DeactivateOwnAccountAsync(string identifier, CancellationToken cancellationToken = default);
    Task ReactivateUserAsync(string identifier, CancellationToken cancellationToken = default);
    Task DeactivateUserAsync(string actorIdentifier, string identifier, CancellationToken cancellationToken = default);
    Task<List<UserResponse>> GetUsersAsync(CancellationToken cancellationToken = default);
}
