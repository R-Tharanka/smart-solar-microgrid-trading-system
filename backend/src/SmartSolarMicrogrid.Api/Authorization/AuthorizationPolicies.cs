// -----------------------------------------------------------------------------
// File: AuthorizationPolicies.cs
// Member 1: Identity, Authentication, Authorization and Account Management
// Purpose: Configures active-account and role-based authorization policies.
// -----------------------------------------------------------------------------
using Microsoft.AspNetCore.Authorization;

namespace SmartSolarMicrogrid.Api.Authorization;

public static class AuthorizationPolicies
{
    public const string Authenticated = "Authenticated";
    public const string Staff = "Staff";
    public const string BackofficeOnly = "BackofficeOnly";
    public const string GridOperatorOnly = "GridOperatorOnly";
    public const string ProsumerOnly = "ProsumerOnly";

    public static void Configure(AuthorizationOptions options)
    {
        // Register each named policy against the active-account requirement and allowed roles.
        options.AddPolicy(Authenticated, policy => Active(policy));
        options.AddPolicy(Staff, policy =>
            Active(policy).RequireRole(AppRoles.Backoffice, AppRoles.GridOperator));
        options.AddPolicy(BackofficeOnly, policy =>
            Active(policy).RequireRole(AppRoles.Backoffice));
        options.AddPolicy(GridOperatorOnly, policy =>
            Active(policy).RequireRole(AppRoles.GridOperator));
        options.AddPolicy(ProsumerOnly, policy =>
            Active(policy).RequireRole(AppRoles.Prosumer));
    }

    private static AuthorizationPolicyBuilder Active(AuthorizationPolicyBuilder policy)
    {
        // Apply the common authenticated and active-account requirements.
        return policy.RequireAuthenticatedUser().AddRequirements(new ActiveUserRequirement());
    }
}
