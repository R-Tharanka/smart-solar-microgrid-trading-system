// -----------------------------------------------------------------------------
// File: ActiveUserRequirement.cs
// Member 1: Identity, Authentication, Authorization and Account Management
// Purpose: Prevents inactive accounts from satisfying protected API policies.
// -----------------------------------------------------------------------------
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Persistence.Repositories;

namespace SmartSolarMicrogrid.Api.Authorization;

public sealed class ActiveUserRequirement : IAuthorizationRequirement;

public sealed class ActiveUserHandler(IUserRepository userRepository)
    : AuthorizationHandler<ActiveUserRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ActiveUserRequirement requirement)
    {
        // Resolve the authenticated business identifier and confirm the account is still active.
        var identifier = context.User.FindFirstValue("user_identifier");
        if (string.IsNullOrWhiteSpace(identifier))
        {
            return;
        }

        var cancellationToken = context.Resource is HttpContext httpContext
            ? httpContext.RequestAborted
            : CancellationToken.None;
        var user = await userRepository.FindByIdentifierAsync(identifier, cancellationToken);
        if (user?.Status == UserStatus.Active)
        {
            context.Succeed(requirement);
        }
    }
}
