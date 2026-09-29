// -----------------------------------------------------------------------------
// File: UserRole.cs
// Member 1: Identity, Authentication, Authorization and Account Management
// Purpose: Defines the supported authorization roles for system users.
// -----------------------------------------------------------------------------
namespace SmartSolarMicrogrid.Api.Models;

public enum UserRole
{
    Backoffice,
    GridOperator,
    Prosumer
}
