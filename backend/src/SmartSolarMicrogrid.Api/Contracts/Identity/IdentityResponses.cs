// -----------------------------------------------------------------------------
// File: IdentityResponses.cs
// Member 1: Identity, Authentication, Authorization and Account Management
// Purpose: Defines public identity responses without exposing persistence internals.
// -----------------------------------------------------------------------------
namespace SmartSolarMicrogrid.Api.Contracts.Identity;

public record LoginResponse(
    string AccessToken,
    DateTime ExpiresAtUtc,
    UserResponse User);

public record UserResponse(
    string? Nic,
    string Email,
    string FirstName,
    string LastName,
    string? PhoneNumber,
    string? Address,
    string Role,
    string Status,
    bool DeactivationRequested,
    DateTime? DeactivationRequestedAtUtc,
    string? RejectionReason);
