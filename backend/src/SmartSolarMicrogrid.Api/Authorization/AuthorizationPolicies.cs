using Microsoft.AspNetCore.Authorization;

namespace SmartSolarMicrogrid.Api.Authorization;

public static class AuthorizationPolicies
{
    public const string Staff = "Staff";
    public const string BackofficeOnly = "BackofficeOnly";
    public const string OperatorOnly = "OperatorOnly";
    public const string ProsumerOnly = "ProsumerOnly";

    public static void Configure(AuthorizationOptions options)
    {
        options.AddPolicy(Staff, policy => policy.RequireRole(AppRoles.Backoffice, AppRoles.GridOperator));
        options.AddPolicy(BackofficeOnly, policy => policy.RequireRole(AppRoles.Backoffice));
        options.AddPolicy(OperatorOnly, policy => policy.RequireRole(AppRoles.GridOperator));
        options.AddPolicy(ProsumerOnly, policy => policy.RequireRole(AppRoles.Prosumer));
    }
}
