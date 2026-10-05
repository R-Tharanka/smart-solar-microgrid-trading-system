// -----------------------------------------------------------------------------
// File: CollectionNames.cs
// Purpose: Centralizes MongoDB collection names used by persistence services.
// -----------------------------------------------------------------------------
namespace SmartSolarMicrogrid.Api.Persistence;

public static class CollectionNames
{
    public const string Users = "users";
    public const string SolarStations = "solarStationInfo";
    public const string EnergyBookingSlots = "energyBookingSlots";
    public const string EnergyReservations = "energyReservations";
}
