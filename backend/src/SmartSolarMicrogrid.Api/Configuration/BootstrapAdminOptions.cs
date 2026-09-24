namespace SmartSolarMicrogrid.Api.Configuration;

public sealed class BootstrapAdminOptions
{
    public const string SectionName = "BootstrapAdmin";

    public bool Enabled { get; init; }
    public string Email { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string FirstName { get; init; } = "System";
    public string LastName { get; init; } = "Administrator";
}
