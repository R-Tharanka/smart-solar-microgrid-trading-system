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

    // Member 4 transaction fields remain absent until their corresponding lifecycle stage.
    // Only the token hash is persisted; the original opaque token is returned once in the QR payload.
    [BsonIgnoreIfNull, BsonElement("qrTokenHash")]
    public string? QrTokenHash { get; set; }

    [BsonIgnoreIfNull, BsonElement("qrExpiresAtUtc")]
    public DateTime? QrExpiresAtUtc { get; set; }

    // Verification audit fields store the Grid Operator's stable identity business identifier.
    [BsonIgnoreIfNull, BsonElement("verifiedByUserId")]
    public string? VerifiedByUserId { get; set; }

    [BsonIgnoreIfNull, BsonElement("verifiedAtUtc")]
    public DateTime? VerifiedAtUtc { get; set; }

    // Finalization audit fields establish who completed the transfer, when, and how much was delivered.
    [BsonIgnoreIfNull, BsonElement("finalizedByUserId")]
    public string? FinalizedByUserId { get; set; }

    [BsonIgnoreIfNull, BsonElement("finalizedAtUtc")]
    public DateTime? FinalizedAtUtc { get; set; }

    [BsonIgnoreIfNull, BsonElement("actualEnergyTransferredKwh")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal? ActualEnergyTransferredKwh { get; set; }

    [BsonIgnoreIfNull, BsonElement("confirmationNote")]
    public string? ConfirmationNote { get; set; }

    [BsonElement("createdAtUtc")]
    public DateTime CreatedAtUtc { get; set; }

    [BsonElement("updatedAtUtc")]
    public DateTime UpdatedAtUtc { get; set; }
}
