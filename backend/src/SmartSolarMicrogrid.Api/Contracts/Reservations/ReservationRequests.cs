// -----------------------------------------------------------------------------
// File: ReservationRequests.cs
// Purpose: Defines validated request models for reservation creation, updates, cancellation, and rejection.
// -----------------------------------------------------------------------------
using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogrid.Api.Contracts.Reservations;

/// <summary>Request body for creating a new energy reservation.</summary>
public sealed record CreateReservationRequest
{
    // Initialize an empty request for model binding.
    public CreateReservationRequest() { }

    // Initialize the request from the supplied values.
    public CreateReservationRequest(string stationId, string slotId, decimal requestedEnergyKwh) =>
        (StationId, SlotId, RequestedEnergyKwh) = (stationId, slotId, requestedEnergyKwh);

    /// <summary>MongoDB ObjectId of the target solar station.</summary>
    [Required, StringLength(24, MinimumLength = 24)]
    public string StationId { get; init; } = string.Empty;

    /// <summary>MongoDB ObjectId of the desired booking slot.</summary>
    [Required, StringLength(24, MinimumLength = 24)]
    public string SlotId { get; init; } = string.Empty;

    /// <summary>Amount of energy the Prosumer wishes to reserve (kWh).</summary>
    [Range(typeof(decimal), "0.001", "79228162514264337593543950335")]
    public decimal RequestedEnergyKwh { get; init; }
}

/// <summary>Request body for updating an existing reservation's energy amount.</summary>
public sealed record UpdateReservationRequest
{
    // Initialize an empty request for model binding.
    public UpdateReservationRequest() { }

    // Initialize the request from the supplied values.
    public UpdateReservationRequest(decimal requestedEnergyKwh) =>
        RequestedEnergyKwh = requestedEnergyKwh;

    /// <summary>Revised energy amount (kWh). Must be positive and not exceed slot availability.</summary>
    [Range(typeof(decimal), "0.001", "79228162514264337593543950335")]
    public decimal RequestedEnergyKwh { get; init; }
}

/// <summary>Request body for cancelling a reservation.</summary>
public sealed record CancelReservationRequest
{
    // Initialize an empty request for model binding.
    public CancelReservationRequest() { }

    // Initialize the request from the supplied values.
    public CancelReservationRequest(string? reason) => Reason = reason;

    /// <summary>Optional reason for cancellation.</summary>
    [StringLength(500)]
    public string? Reason { get; init; }
}

/// <summary>Request body for rejecting a pending reservation (Staff only).</summary>
public sealed record RejectReservationRequest
{
    // Initialize an empty request for model binding.
    public RejectReservationRequest() { }

    // Initialize the request from the supplied values.
    public RejectReservationRequest(string reason) => Reason = reason;

    /// <summary>Required reason explaining why the reservation is being rejected.</summary>
    [Required, StringLength(500, MinimumLength = 2)]
    public string Reason { get; init; } = string.Empty;
}
