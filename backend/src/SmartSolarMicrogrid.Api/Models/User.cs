using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarMicrogrid.Api.Models;

public class User
{
    [BsonId]
    public ObjectId Id { get; set; }

    [BsonIgnoreIfNull]
    [BsonElement("nic")]
    public string? Nic { get; set; } // Nullable for staff

    [BsonElement("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("passwordHash")]
    public string PasswordHash { get; set; } = string.Empty;

    [BsonElement("firstName")]
    public string FirstName { get; set; } = string.Empty;

    [BsonElement("lastName")]
    public string LastName { get; set; } = string.Empty;

    [BsonElement("role")]
    [BsonRepresentation(BsonType.String)]
    public UserRole Role { get; set; }

    [BsonElement("status")]
    [BsonRepresentation(BsonType.String)]
    public UserStatus Status { get; set; }

    [BsonIgnoreIfNull]
    [BsonElement("createdByIdentifier")]
    public string? CreatedByIdentifier { get; set; }

    [BsonIgnoreIfNull]
    [BsonElement("lastLoginAtUtc")]
    public DateTime? LastLoginAtUtc { get; set; }

    [BsonElement("createdAtUtc")]
    public DateTime CreatedAtUtc { get; set; }

    [BsonElement("updatedAtUtc")]
    public DateTime UpdatedAtUtc { get; set; }
}
