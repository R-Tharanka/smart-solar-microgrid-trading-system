using SmartSolarMicrogrid.Api.Contracts.BookingSlots;

namespace SmartSolarMicrogrid.Api.Services;

public interface IBookingSlotService
{
    Task<BookingSlotResponse> CreateAsync(string stationCode, CreateBookingSlotRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<BookingSlotResponse>> GetForStationAsync(
        string stationCode,
        DateTime? fromUtc,
        DateTime? toUtc,
        string? status,
        CancellationToken cancellationToken = default);
    Task<BookingSlotResponse> GetAsync(string slotCode, CancellationToken cancellationToken = default);
    Task<BookingSlotResponse> UpdateAsync(string slotCode, UpdateBookingSlotRequest request, CancellationToken cancellationToken = default);
    Task<BookingSlotResponse> ChangeStatusAsync(string slotCode, ChangeBookingSlotStatusRequest request, CancellationToken cancellationToken = default);
}
