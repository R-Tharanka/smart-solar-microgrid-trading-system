// -----------------------------------------------------------------------------
// Defines supported lifecycle and availability states for energy slots.
// -----------------------------------------------------------------------------
namespace SmartSolarMicrogrid.Api.Models;

public enum SlotStatus
{
    Available,
    Reserved,
    Unavailable,
    Expired
}
