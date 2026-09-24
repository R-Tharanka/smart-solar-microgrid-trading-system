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
    [InlineData(UserRole.Prosumer, UserStatus.Active, AuthorizationPolicies.ProsumerOnly, true)]
    [InlineData(UserRole.Backoffice, UserStatus.Deactivated, AuthorizationPolicies.BackofficeOnly, false)]
    public async Task Policies_RequireCorrectRoleAndActiveAccount(
        UserRole role,
        UserStatus status,
        string policy,
        bool expectedSuccess)
    {
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
        public Task<User?> FindByNicAsync(string nic, CancellationToken cancellationToken = default) =>
            Task.FromResult<User?>(null);

        public Task<User?> FindByEmailAsync(string email, CancellationToken cancellationToken = default) =>
            Task.FromResult(email == user.Email ? user : null);

        public Task<User?> FindByIdentifierAsync(string identifier, CancellationToken cancellationToken = default) =>
            FindByEmailAsync(identifier, cancellationToken);

        public Task<List<User>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult(new List<User> { user });

        public Task<long> CountActiveBackofficeAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult(user.Role == UserRole.Backoffice && user.Status == UserStatus.Active ? 1L : 0L);

        public Task CreateAsync(User newUser, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task UpdateAsync(User updatedUser, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<bool> UpdateStatusAsync(
            string identifier,
            UserStatus expectedStatus,
            UserStatus status,
            string changedByIdentifier,
            DateTime changedAtUtc,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();

        public Task RecordSuccessfulLoginAsync(
            string identifier,
            DateTime loginAtUtc,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();
    }
}
