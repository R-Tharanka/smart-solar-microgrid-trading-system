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
        var user = await identityService.RegisterProsumerAsync(request, cancellationToken);
        return StatusCode(
            StatusCodes.Status201Created,
            new ApiEnvelope<UserResponse>(user, "Prosumer registered successfully."));
    }

    [HttpPost("staff")]
    [Authorize(Policy = AuthorizationPolicies.BackofficeOnly)]
    [ProducesResponseType<ApiEnvelope<UserResponse>>(StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiEnvelope<UserResponse>>> CreateStaff(
        CreateStaffRequest request,
        CancellationToken cancellationToken)
    {
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
        var response = await identityService.AuthenticateAsync(request, cancellationToken);
        return Ok(new ApiEnvelope<LoginResponse>(response, "Login successful."));
    }

    [HttpGet("me")]
    [Authorize(Policy = AuthorizationPolicies.Authenticated)]
    [ProducesResponseType<ApiEnvelope<UserResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<UserResponse>>> GetCurrentUser(CancellationToken cancellationToken)
    {
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
        await identityService.ChangePasswordAsync(CurrentIdentifier(), request, cancellationToken);
        return NoContent();
    }

    [HttpPost("me/deactivate")]
    [Authorize(Policy = AuthorizationPolicies.ProsumerOnly)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeactivateOwnAccount(CancellationToken cancellationToken)
    {
        await identityService.DeactivateOwnAccountAsync(CurrentIdentifier(), cancellationToken);
        return NoContent();
    }

    [HttpPost("{identifier}/reactivate")]
    [Authorize(Policy = AuthorizationPolicies.BackofficeOnly)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ReactivateUser(string identifier, CancellationToken cancellationToken)
    {
        await identityService.ReactivateUserAsync(CurrentIdentifier(), identifier, cancellationToken);
        return NoContent();
    }

    [HttpPost("{identifier}/deactivate")]
    [Authorize(Policy = AuthorizationPolicies.BackofficeOnly)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeactivateUser(string identifier, CancellationToken cancellationToken)
    {
        await identityService.DeactivateUserAsync(CurrentIdentifier(), identifier, cancellationToken);
        return NoContent();
    }

    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.BackofficeOnly)]
    [ProducesResponseType<ApiEnvelope<IReadOnlyCollection<UserResponse>>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<IReadOnlyCollection<UserResponse>>>> GetUsers(
        CancellationToken cancellationToken)
    {
        var users = await identityService.GetUsersAsync(cancellationToken);
        return Ok(new ApiEnvelope<IReadOnlyCollection<UserResponse>>(users));
    }

    private string CurrentIdentifier() =>
        User.FindFirstValue("user_identifier")
        ?? throw IdentityException.Unauthorized("The access token does not contain a user identifier.");
}
