// -----------------------------------------------------------------------------
// File: UsersController.cs
// Purpose: Exposes identity, profile, password, and account-status HTTP endpoints.
// -----------------------------------------------------------------------------
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.Authorization;
using SmartSolarMicrogrid.Api.Contracts;
using SmartSolarMicrogrid.Api.Contracts.Identity;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/users")]
public sealed class UsersController(IIdentityService identityService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("prosumer/register")]
    [ProducesResponseType<ApiEnvelope<UserResponse>>(StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiEnvelope<UserResponse>>> RegisterProsumer(
        RegisterProsumerRequest request,
        CancellationToken cancellationToken)
    {
        // Register a public Prosumer account through the identity service.
        var user = await identityService.RegisterProsumerAsync(request, cancellationToken);
        return StatusCode(
            StatusCodes.Status201Created,
            new ApiEnvelope<UserResponse>(user, "Prosumer registration submitted for Backoffice review."));
    }

    [HttpPost("prosumers")]
    [Authorize(Policy = AuthorizationPolicies.BackofficeOnly)]
    [ProducesResponseType<ApiEnvelope<UserResponse>>(StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiEnvelope<UserResponse>>> CreateProsumer(
        RegisterProsumerRequest request,
        CancellationToken cancellationToken)
    {
        // Create a Prosumer administratively and retain the Backoffice actor for auditing.
        var user = await identityService.CreateProsumerAsync(CurrentIdentifier(), request, cancellationToken);
        return StatusCode(
            StatusCodes.Status201Created,
            new ApiEnvelope<UserResponse>(user, "Prosumer account created successfully."));
    }

    [HttpPut("prosumers/{nic}")]
    [Authorize(Policy = AuthorizationPolicies.BackofficeOnly)]
    [ProducesResponseType<ApiEnvelope<UserResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<UserResponse>>> UpdateProsumer(
        string nic,
        UpdateProsumerRequest request,
        CancellationToken cancellationToken)
    {
        // Update the selected Prosumer without allowing NIC, role, status, or password changes.
        var user = await identityService.UpdateProsumerAsync(
            CurrentIdentifier(), nic, request, cancellationToken);
        return Ok(new ApiEnvelope<UserResponse>(user, "Prosumer account updated successfully."));
    }

    [HttpGet("prosumers/pending")]
    [Authorize(Policy = AuthorizationPolicies.BackofficeOnly)]
    [ProducesResponseType<ApiEnvelope<IReadOnlyCollection<UserResponse>>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<IReadOnlyCollection<UserResponse>>>> GetPendingProsumers(
        CancellationToken cancellationToken)
    {
        // Return the pending public registrations awaiting Backoffice review.
        var users = await identityService.GetPendingProsumersAsync(cancellationToken);
        return Ok(new ApiEnvelope<IReadOnlyCollection<UserResponse>>(users));
    }

    [HttpPost("prosumers/{nic}/activate")]
    [Authorize(Policy = AuthorizationPolicies.BackofficeOnly)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ActivateProsumer(string nic, CancellationToken cancellationToken)
    {
        // Activate the selected pending Prosumer using the authenticated Backoffice actor.
        await identityService.ActivateProsumerAsync(CurrentIdentifier(), nic, cancellationToken);
        return NoContent();
    }

    [HttpPost("prosumers/{nic}/reject")]
    [Authorize(Policy = AuthorizationPolicies.BackofficeOnly)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RejectProsumer(
        string nic,
        RejectProsumerRequest request,
        CancellationToken cancellationToken)
    {
        // Reject the selected pending Prosumer and retain the supplied review reason.
        await identityService.RejectProsumerAsync(CurrentIdentifier(), nic, request, cancellationToken);
        return NoContent();
    }

    [HttpPost("staff")]
    [Authorize(Policy = AuthorizationPolicies.BackofficeOnly)]
    [ProducesResponseType<ApiEnvelope<UserResponse>>(StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiEnvelope<UserResponse>>> CreateStaff(
        CreateStaffRequest request,
        CancellationToken cancellationToken)
    {
        // Create a staff account using the authenticated Backoffice user as the actor.
        var user = await identityService.CreateStaffAsync(CurrentIdentifier(), request, cancellationToken);
        return StatusCode(
            StatusCodes.Status201Created,
            new ApiEnvelope<UserResponse>(user, "Staff account created successfully."));
    }

    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType<ApiEnvelope<LoginResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<LoginResponse>>> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        // Authenticate the submitted business identifier and return an access token.
        var response = await identityService.AuthenticateAsync(request, cancellationToken);
        return Ok(new ApiEnvelope<LoginResponse>(response, "Login successful."));
    }

    [HttpGet("me")]
    [Authorize(Policy = AuthorizationPolicies.Authenticated)]
    [ProducesResponseType<ApiEnvelope<UserResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<UserResponse>>> GetCurrentUser(CancellationToken cancellationToken)
    {
        // Load the profile associated with the current token's business identifier.
        var user = await identityService.GetCurrentUserAsync(CurrentIdentifier(), cancellationToken);
        return Ok(new ApiEnvelope<UserResponse>(user));
    }

    [HttpPut("me")]
    [Authorize(Policy = AuthorizationPolicies.Authenticated)]
    [ProducesResponseType<ApiEnvelope<UserResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<UserResponse>>> UpdateProfile(
        UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        // Apply allowed profile changes to the currently authenticated account.
        var user = await identityService.UpdateProfileAsync(CurrentIdentifier(), request, cancellationToken);
        return Ok(new ApiEnvelope<UserResponse>(user, "Profile updated successfully."));
    }

    [HttpPost("change-password")]
    [Authorize(Policy = AuthorizationPolicies.Authenticated)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ChangePassword(
        ChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        // Verify the current password before replacing the stored password hash.
        await identityService.ChangePasswordAsync(CurrentIdentifier(), request, cancellationToken);
        return NoContent();
    }

    [HttpPost("me/deactivation-request")]
    [Authorize(Policy = AuthorizationPolicies.ProsumerOnly)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RequestOwnDeactivation(CancellationToken cancellationToken)
    {
        // Record a request for Backoffice review while leaving the account active.
        await identityService.RequestOwnDeactivationAsync(CurrentIdentifier(), cancellationToken);
        return NoContent();
    }

    [HttpPost("{identifier}/reactivate")]
    [Authorize(Policy = AuthorizationPolicies.BackofficeOnly)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ReactivateUser(string identifier, CancellationToken cancellationToken)
    {
        // Reactivate the selected account and record the Backoffice actor.
        await identityService.ReactivateUserAsync(CurrentIdentifier(), identifier, cancellationToken);
        return NoContent();
    }

    [HttpPost("{identifier}/deactivate")]
    [Authorize(Policy = AuthorizationPolicies.BackofficeOnly)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeactivateUser(string identifier, CancellationToken cancellationToken)
    {
        // Deactivate the selected account while enforcing administrative safeguards.
        await identityService.DeactivateUserAsync(CurrentIdentifier(), identifier, cancellationToken);
        return NoContent();
    }

    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.BackofficeOnly)]
    [ProducesResponseType<ApiEnvelope<IReadOnlyCollection<UserResponse>>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<IReadOnlyCollection<UserResponse>>>> GetUsers(
        CancellationToken cancellationToken)
    {
        // Return the complete account list for Backoffice administration.
        var users = await identityService.GetUsersAsync(cancellationToken);
        return Ok(new ApiEnvelope<IReadOnlyCollection<UserResponse>>(users));
    }

    private string CurrentIdentifier()
    {
        // Read the stable business identifier issued in the authenticated JWT.
        return User.FindFirstValue("user_identifier")
            ?? throw IdentityException.Unauthorized("The access token does not contain a user identifier.");
    }
}
