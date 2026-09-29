// -----------------------------------------------------------------------------
// File: IIdentityService.cs
// Member 1: Identity, Authentication, Authorization and Account Management
// Purpose: Defines identity and account-management use cases exposed to the API.
// -----------------------------------------------------------------------------
using SmartSolarMicrogrid.Api.Contracts.Identity;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Services;

public interface IIdentityService
{
    // Authenticate an account and issue its access token.
    Task<LoginResponse> AuthenticateAsync(LoginRequest request, CancellationToken cancellationToken = default);
    // Register a self-service Prosumer account.
    Task<UserResponse> RegisterProsumerAsync(RegisterProsumerRequest request, CancellationToken cancellationToken = default);
    // Create a Backoffice or Grid Operator account.
    Task<UserResponse> CreateStaffAsync(string actorIdentifier, CreateStaffRequest request, CancellationToken cancellationToken = default);
    // Retrieve the current account profile.
    Task<UserResponse> GetCurrentUserAsync(string identifier, CancellationToken cancellationToken = default);
    // Resolve an active Prosumer for dependent backend modules.
    Task<UserResponse> GetActiveProsumerAsync(string nic, CancellationToken cancellationToken = default);
    // Update fields editable by the current account.
    Task<UserResponse> UpdateProfileAsync(string identifier, UpdateProfileRequest request, CancellationToken cancellationToken = default);
    // Verify and replace the current account password.
    Task ChangePasswordAsync(string identifier, ChangePasswordRequest request, CancellationToken cancellationToken = default);
    // Deactivate the current Prosumer account.
    Task DeactivateOwnAccountAsync(string identifier, CancellationToken cancellationToken = default);
    // Reactivate an account through Backoffice administration.
    Task ReactivateUserAsync(string actorIdentifier, string identifier, CancellationToken cancellationToken = default);
    // Deactivate another account through Backoffice administration.
    Task DeactivateUserAsync(string actorIdentifier, string identifier, CancellationToken cancellationToken = default);
    // List accounts for Backoffice administration.
    Task<List<UserResponse>> GetUsersAsync(CancellationToken cancellationToken = default);
}
