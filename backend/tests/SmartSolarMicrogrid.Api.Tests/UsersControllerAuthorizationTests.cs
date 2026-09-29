// -----------------------------------------------------------------------------
// File: UsersControllerAuthorizationTests.cs
// Purpose: Locks administrative Prosumer operations to the Backoffice policy.
// -----------------------------------------------------------------------------
using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using SmartSolarMicrogrid.Api.Authorization;
using SmartSolarMicrogrid.Api.Controllers;

namespace SmartSolarMicrogrid.Api.Tests;

public sealed class UsersControllerAuthorizationTests
{
    [Theory]
    [InlineData(nameof(UsersController.CreateProsumer))]
    [InlineData(nameof(UsersController.UpdateProsumer))]
    [InlineData(nameof(UsersController.DeactivateUser))]
    [InlineData(nameof(UsersController.ReactivateUser))]
    public void ProsumerAdministration_RequiresBackofficePolicy(string actionName)
    {
        // Verify Grid Operators and Prosumers cannot reach administrative lifecycle operations.
        var action = typeof(UsersController).GetMethod(actionName)
            ?? throw new InvalidOperationException($"Action {actionName} was not found.");
        var authorize = action.GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(authorize);
        Assert.Equal(AuthorizationPolicies.BackofficeOnly, authorize.Policy);
        Assert.Null(action.GetCustomAttribute<AllowAnonymousAttribute>());
    }

    [Fact]
    public void SelfRegistration_RemainsPublicAndSeparateFromAdministration()
    {
        // Preserve self-registration while keeping administrative creation separately protected.
        var action = typeof(UsersController).GetMethod(nameof(UsersController.RegisterProsumer))
            ?? throw new InvalidOperationException("Registration action was not found.");

        Assert.NotNull(action.GetCustomAttribute<AllowAnonymousAttribute>());
        Assert.Null(action.GetCustomAttribute<AuthorizeAttribute>());
    }
}
