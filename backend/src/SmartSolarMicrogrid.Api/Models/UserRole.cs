// -----------------------------------------------------------------------------
// File: UserRole.cs
// Purpose: Defines the supported authorization roles for system users.
// -----------------------------------------------------------------------------
namespace SmartSolarMicrogrid.Api.Models;

public enum UserRole
{
    Backoffice,
    GridOperator,
    Prosumer
}
