using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarMicrogrid.Api.Models;

public sealed class EnergyBookingSlot
{
    [BsonId]
    public ObjectId Id { get; set; }

    [BsonElement("slotCode")]
    public string SlotCode { get; set; } = string.Empty;

    [BsonElement("stationId")]
    public ObjectId StationId { get; set; }

    [BsonElement("startTimeUtc")]
    public DateTime StartTimeUtc { get; set; }

    [BsonElement("endTimeUtc")]
    public DateTime EndTimeUtc { get; set; }

    [BsonElement("availableEnergyKwh")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal AvailableEnergyKwh { get; set; }

    [BsonElement("pricePerKwh")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal PricePerKwh { get; set; }

    [BsonElement("status")]
    [BsonRepresentation(BsonType.String)]
    public SlotStatus Status { get; set; }

    [BsonElement("createdAtUtc")]
    public DateTime CreatedAtUtc { get; set; }

    [BsonElement("updatedAtUtc")]
    public DateTime UpdatedAtUtc { get; set; }
}
