using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarMicrogrid.Api.Models;

public sealed class EnergyReservation
{
    [BsonId]
    public ObjectId Id { get; set; }

    [BsonElement("reservationCode")]
    public string ReservationCode { get; set; } = string.Empty;

    [BsonElement("prosumerNic")]
    public string ProsumerNic { get; set; } = string.Empty;

    [BsonElement("stationId")]
    public ObjectId StationId { get; set; }

    [BsonElement("slotId")]
    public ObjectId SlotId { get; set; }

    [BsonElement("requestedEnergyKwh")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal RequestedEnergyKwh { get; set; }

    [BsonElement("scheduledStartTimeUtc")]
    public DateTime ScheduledStartTimeUtc { get; set; }

    [BsonElement("scheduledEndTimeUtc")]
    public DateTime ScheduledEndTimeUtc { get; set; }

    [BsonElement("status")]
    [BsonRepresentation(BsonType.String)]
    public ReservationStatus Status { get; set; }

    [BsonIgnoreIfNull, BsonElement("qrTokenHash")]
    public string? QrTokenHash { get; set; }

    [BsonIgnoreIfNull, BsonElement("qrExpiresAtUtc")]
    public DateTime? QrExpiresAtUtc { get; set; }

    [BsonIgnoreIfNull, BsonElement("verifiedByUserId")]
    public string? VerifiedByUserId { get; set; }

    [BsonIgnoreIfNull, BsonElement("verifiedAtUtc")]
    public DateTime? VerifiedAtUtc { get; set; }

    [BsonIgnoreIfNull, BsonElement("finalizedByUserId")]
    public string? FinalizedByUserId { get; set; }

    [BsonIgnoreIfNull, BsonElement("finalizedAtUtc")]
    public DateTime? FinalizedAtUtc { get; set; }

    [BsonIgnoreIfNull, BsonElement("confirmationNote")]
    public string? ConfirmationNote { get; set; }

    [BsonElement("createdAtUtc")]
    public DateTime CreatedAtUtc { get; set; }

    [BsonElement("updatedAtUtc")]
    public DateTime UpdatedAtUtc { get; set; }
}
