// -----------------------------------------------------------------------------
// File: MongoDbOptions.cs
// Purpose: Defines MongoDB connection and database settings.
// -----------------------------------------------------------------------------
using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogrid.Api.Configuration;

public sealed class MongoDbOptions
{
    public const string SectionName = "MongoDb";

    [Required]
    public string ConnectionString { get; init; } = string.Empty;

    [Required]
    public string DatabaseName { get; init; } = string.Empty;
}
