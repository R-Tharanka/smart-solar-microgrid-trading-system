// -----------------------------------------------------------------------------
// File: UserStatus.cs
// Member 1: Identity, Authentication, Authorization and Account Management
// Purpose: Defines the lifecycle states available to a user account.
// -----------------------------------------------------------------------------
namespace SmartSolarMicrogrid.Api.Models;

public enum UserStatus
{
    Pending,
    Active,
    Deactivated,
    Rejected
}
