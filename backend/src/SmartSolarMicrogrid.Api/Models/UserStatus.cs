// -----------------------------------------------------------------------------
// File: UserStatus.cs
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
