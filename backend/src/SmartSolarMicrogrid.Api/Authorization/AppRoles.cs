// -----------------------------------------------------------------------------
// File: AppRoles.cs
// Member 1: Identity, Authentication, Authorization and Account Management
// Purpose: Defines the role names shared by identity claims and authorization policies.
// -----------------------------------------------------------------------------
namespace SmartSolarMicrogrid.Api.Authorization;

public static class AppRoles
{
    public const string Backoffice = "Backoffice";
    public const string GridOperator = "GridOperator";
    public const string Prosumer = "Prosumer";
}
