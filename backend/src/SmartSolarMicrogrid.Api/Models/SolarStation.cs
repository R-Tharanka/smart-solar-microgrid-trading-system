using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarMicrogrid.Api.Models;

public sealed class SolarStation
{
    [BsonId]
    public ObjectId Id { get; set; }

    [BsonElement("stationCode")]
    public string StationCode { get; set; } = string.Empty;

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("location")]
    public StationLocation Location { get; set; } = new();

    [BsonElement("capacityKwh")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal CapacityKwh { get; set; }

    [BsonElement("batteryStorageKwh")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal BatteryStorageKwh { get; set; }

    [BsonElement("openingTime")]
    public TimeSpan OpeningTime { get; set; }

    [BsonElement("closingTime")]
    public TimeSpan ClosingTime { get; set; }

    [BsonElement("status")]
    [BsonRepresentation(BsonType.String)]
    public StationStatus Status { get; set; }

    [BsonElement("createdAtUtc")]
    public DateTime CreatedAtUtc { get; set; }

    [BsonElement("updatedAtUtc")]
    public DateTime UpdatedAtUtc { get; set; }
}

public sealed class StationLocation
{
    [BsonElement("type")]
    public string Type { get; set; } = "Point";

    [BsonElement("coordinates")]
    public double[] Coordinates { get; set; } = [0, 0];

    [BsonElement("address")]
    public string Address { get; set; } = string.Empty;
}
