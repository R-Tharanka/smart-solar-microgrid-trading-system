// -----------------------------------------------------------------------------
// File: StationSlotControllerAuthorizationTests.cs
// Purpose: Locks station and slot mutations to the approved staff-role matrix.
// -----------------------------------------------------------------------------
using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using SmartSolarMicrogrid.Api.Authorization;
using SmartSolarMicrogrid.Api.Controllers;

namespace SmartSolarMicrogrid.Api.Tests;

public sealed class StationSlotControllerAuthorizationTests
{
    [Theory]
    [InlineData(nameof(StationsController.GetAll))]
    [InlineData(nameof(StationsController.Get))]
    [InlineData(nameof(StationsController.GetSlots))]
    public void StationAndSlotReads_RequireAuthenticatedPolicy(string actionName)
    {
        // Preserve read access for active clients, including the Grid Operator workspace.
        AssertPolicy<StationsController>(actionName, AuthorizationPolicies.Authenticated);
    }

    [Fact]
    public void SlotDetailRead_RequiresAuthenticatedPolicy()
    {
        // Preserve read-only slot-detail access independently of mutation permissions.
        AssertPolicy<BookingSlotsController>(
            nameof(BookingSlotsController.Get),
            AuthorizationPolicies.Authenticated);
    }

    [Theory]
    [InlineData(nameof(StationsController.Create))]
    [InlineData(nameof(StationsController.Update))]
    [InlineData(nameof(StationsController.ChangeStatus))]
    [InlineData(nameof(StationsController.CreateSlot))]
    public void StationAndSlotAdministration_RequiresBackofficePolicy(string actionName)
    {
        // Keep Grid Operators read-only for station details and slot definitions.
        AssertPolicy<StationsController>(actionName, AuthorizationPolicies.BackofficeOnly);
    }

    [Fact]
    public void SlotDetailUpdate_RequiresBackofficePolicy()
    {
        // Prevent Grid Operators from changing slot schedules, capacity or pricing.
        AssertPolicy<BookingSlotsController>(
            nameof(BookingSlotsController.Update),
            AuthorizationPolicies.BackofficeOnly);
    }

    [Fact]
    public void SlotAvailabilityChange_AllowsBothStaffRoles()
    {
        // Permit Backoffice and Grid Operators to change only slot availability/status.
        AssertPolicy<BookingSlotsController>(
            nameof(BookingSlotsController.ChangeStatus),
            AuthorizationPolicies.Staff);
    }

    private static void AssertPolicy<TController>(string actionName, string expectedPolicy)
    {
        // Read the action policy directly so future endpoint changes cannot silently widen access.
        var action = typeof(TController).GetMethod(actionName)
            ?? throw new InvalidOperationException($"Action {actionName} was not found.");
        var authorize = action.GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(authorize);
        Assert.Equal(expectedPolicy, authorize.Policy);
        Assert.Null(action.GetCustomAttribute<AllowAnonymousAttribute>());
    }
}
