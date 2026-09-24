using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogrid.Api.Configuration;

public sealed class CorsOptions
{
    public const string SectionName = "Cors";
    public const string ClientApplicationsPolicy = "ClientApplications";

    [MinLength(1)]
    public string[] AllowedOrigins { get; init; } = [];
}
