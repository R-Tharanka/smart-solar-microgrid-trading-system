// -----------------------------------------------------------------------------
// File: AuthorizationPolicyTests.cs
// Purpose: Verifies that role policies also require an active persisted account.
// -----------------------------------------------------------------------------
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using SmartSolarMicrogrid.Api.Authorization;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Persistence.Repositories;

namespace SmartSolarMicrogrid.Api.Tests;

public sealed class AuthorizationPolicyTests
{
    [Theory]
    [InlineData(UserRole.Backoffice, UserStatus.Active, AuthorizationPolicies.BackofficeOnly, true)]
    [InlineData(UserRole.Prosumer, UserStatus.Active, AuthorizationPolicies.BackofficeOnly, false)]
    [InlineData(UserRole.GridOperator, UserStatus.Active, AuthorizationPolicies.BackofficeOnly, false)]
    [InlineData(UserRole.Backoffice, UserStatus.Active, AuthorizationPolicies.Staff, true)]
    [InlineData(UserRole.GridOperator, UserStatus.Active, AuthorizationPolicies.Staff, true)]
    [InlineData(UserRole.Prosumer, UserStatus.Active, AuthorizationPolicies.Staff, false)]
    [InlineData(UserRole.Prosumer, UserStatus.Active, AuthorizationPolicies.ProsumerOnly, true)]
    [InlineData(UserRole.Backoffice, UserStatus.Deactivated, AuthorizationPolicies.BackofficeOnly, false)]
    public async Task Policies_RequireCorrectRoleAndActiveAccount(
        UserRole role,
        UserStatus status,
        string policy,
        bool expectedSuccess)
    {
        // Evaluate the selected policy against both the JWT role and persisted status.
        const string identifier = "account@example.com";
        var repository = new PolicyUserRepository(new User
        {
            Email = identifier,
            Role = role,
            Status = status
        });
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton<IUserRepository>(repository);
        services.AddSingleton<IAuthorizationHandler, ActiveUserHandler>();
        services.AddAuthorization(AuthorizationPolicies.Configure);
        await using var provider = services.BuildServiceProvider();
        var authorization = provider.GetRequiredService<IAuthorizationService>();
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim("user_identifier", identifier),
            new Claim(ClaimTypes.Role, role.ToString())
        ], "Test"));

        var result = await authorization.AuthorizeAsync(principal, resource: null, policy);

        Assert.Equal(expectedSuccess, result.Succeeded);
    }

    private sealed class PolicyUserRepository(User user) : IUserRepository
    {
        // This policy test does not resolve users by NIC.
        public Task<User?> FindByNicAsync(string nic, CancellationToken cancellationToken = default) =>
            Task.FromResult<User?>(null);

        // Resolve the single test account by email.
        public Task<User?> FindByEmailAsync(string email, CancellationToken cancellationToken = default) =>
            Task.FromResult(email == user.Email ? user : null);

        // Delegate identifier lookup to the email fixture lookup.
        public Task<User?> FindByIdentifierAsync(string identifier, CancellationToken cancellationToken = default) =>
            FindByEmailAsync(identifier, cancellationToken);

        // Return the single account used by the policy fixture.
        public Task<List<User>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult(new List<User> { user });

        // Return test Prosumers matching the requested account status.
        public Task<List<User>> GetProsumersByStatusAsync(
            UserStatus status,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();

        // Reflect whether the fixture is an active Backoffice account.
        public Task<long> CountActiveBackofficeAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult(user.Role == UserRole.Backoffice && user.Status == UserStatus.Active ? 1L : 0L);

        // Reject writes because authorization tests are read-only.
        public Task CreateAsync(User newUser, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        // Reject writes because authorization tests are read-only.
        public Task UpdateAsync(User updatedUser, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        // Reject status writes because authorization tests are read-only.
        public Task<bool> UpdateStatusAsync(
            string identifier,
            UserStatus expectedStatus,
            UserStatus status,
            string changedByIdentifier,
            DateTime changedAtUtc,
            CancellationToken cancellationToken = default,
            string? rejectionReason = null) => throw new NotSupportedException();

        // Simulate recording a deactivation request in the test repository.
        public Task<bool> RequestDeactivationAsync(
            string nic,
            DateTime requestedAtUtc,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();

        // Reject login-audit writes because authorization tests are read-only.
        public Task RecordSuccessfulLoginAsync(
            string identifier,
            DateTime loginAtUtc,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();
    }
}
