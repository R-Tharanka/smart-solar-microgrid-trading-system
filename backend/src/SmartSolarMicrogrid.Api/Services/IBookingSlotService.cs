// -----------------------------------------------------------------------------
// Defines booking-slot use cases exposed to API controllers.
// -----------------------------------------------------------------------------
using SmartSolarMicrogrid.Api.Contracts.BookingSlots;

namespace SmartSolarMicrogrid.Api.Services;

public interface IBookingSlotService
{
    /// <summary>Creates an energy slot for an active station.</summary>
    Task<BookingSlotResponse> CreateAsync(string stationCode, CreateBookingSlotRequest request, CancellationToken cancellationToken = default);

    /// <summary>Lists a station's slots using optional date and status filters.</summary>
    Task<IReadOnlyCollection<BookingSlotResponse>> GetForStationAsync(
        string stationCode,
        DateTime? fromUtc,
        DateTime? toUtc,
        string? status,
        CancellationToken cancellationToken = default);
    /// <summary>Gets one energy slot by its public slot code.</summary>
    Task<BookingSlotResponse> GetAsync(string slotCode, CancellationToken cancellationToken = default);

    /// <summary>Updates an unreserved energy slot.</summary>
    Task<BookingSlotResponse> UpdateAsync(string slotCode, UpdateBookingSlotRequest request, CancellationToken cancellationToken = default);

    /// <summary>Changes a slot between manually managed availability states.</summary>
    Task<BookingSlotResponse> ChangeStatusAsync(string slotCode, ChangeBookingSlotStatusRequest request, CancellationToken cancellationToken = default);
}
