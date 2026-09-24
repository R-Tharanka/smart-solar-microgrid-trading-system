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

    [BsonIgnoreIfNull]
    [BsonElement("phoneNumber")]
    public string? PhoneNumber { get; set; }

    [BsonIgnoreIfNull]
    [BsonElement("address")]
    public string? Address { get; set; }

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

    [BsonIgnoreIfNull]
    [BsonElement("deactivatedAtUtc")]
    public DateTime? DeactivatedAtUtc { get; set; }

    [BsonIgnoreIfNull]
    [BsonElement("reactivatedAtUtc")]
    public DateTime? ReactivatedAtUtc { get; set; }

    [BsonIgnoreIfNull]
    [BsonElement("statusChangedByIdentifier")]
    public string? StatusChangedByIdentifier { get; set; }

    [BsonElement("createdAtUtc")]
    public DateTime CreatedAtUtc { get; set; }

    [BsonElement("updatedAtUtc")]
    public DateTime UpdatedAtUtc { get; set; }
}
