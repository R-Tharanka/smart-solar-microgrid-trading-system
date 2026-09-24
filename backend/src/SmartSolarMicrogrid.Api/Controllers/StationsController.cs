using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.Authorization;
using SmartSolarMicrogrid.Api.Contracts;
using SmartSolarMicrogrid.Api.Contracts.BookingSlots;
using SmartSolarMicrogrid.Api.Contracts.Stations;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/stations")]
public sealed class StationsController(
    ISolarStationService stationService,
    IBookingSlotService bookingSlotService) : ControllerBase
{
    // Creates a new active station. Only Backoffice users may manage station records.
    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.BackofficeOnly)]
    [ProducesResponseType<ApiEnvelope<StationResponse>>(StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiEnvelope<StationResponse>>> Create(
        CreateStationRequest request,
        CancellationToken cancellationToken)
    {
        var station = await stationService.CreateAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created,
            new ApiEnvelope<StationResponse>(station, "Solar station created successfully."));
    }

    // Returns stations, optionally filtered by status and ordered by proximity.
    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.Authenticated)]
    [ProducesResponseType<ApiEnvelope<IReadOnlyCollection<StationResponse>>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<IReadOnlyCollection<StationResponse>>>> GetAll(
        [FromQuery] string? status,
        [FromQuery] double? nearLat,
        [FromQuery] double? nearLng,
        CancellationToken cancellationToken)
    {
        var stations = await stationService.GetAllAsync(status, nearLat, nearLng, cancellationToken);
        return Ok(new ApiEnvelope<IReadOnlyCollection<StationResponse>>(stations, "Stations loaded."));
    }

    // Returns one station using its public business code rather than its MongoDB identifier.
    [HttpGet("{stationCode}")]
    [Authorize(Policy = AuthorizationPolicies.Authenticated)]
    [ProducesResponseType<ApiEnvelope<StationResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<StationResponse>>> Get(
        string stationCode,
        CancellationToken cancellationToken)
    {
        var station = await stationService.GetAsync(stationCode, cancellationToken);
        return Ok(new ApiEnvelope<StationResponse>(station));
    }

    // Replaces the editable information for an existing station.
    [HttpPut("{stationCode}")]
    [Authorize(Policy = AuthorizationPolicies.BackofficeOnly)]
    [ProducesResponseType<ApiEnvelope<StationResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<StationResponse>>> Update(
        string stationCode,
        UpdateStationRequest request,
        CancellationToken cancellationToken)
    {
        var station = await stationService.UpdateAsync(stationCode, request, cancellationToken);
        return Ok(new ApiEnvelope<StationResponse>(station, "Solar station updated successfully."));
    }

    // Changes operational status; the service protects deactivation when reservations are active.
    [HttpPatch("{stationCode}/status")]
    [Authorize(Policy = AuthorizationPolicies.BackofficeOnly)]
    [ProducesResponseType<ApiEnvelope<StationResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<StationResponse>>> ChangeStatus(
        string stationCode,
        ChangeStationStatusRequest request,
        CancellationToken cancellationToken)
    {
        var station = await stationService.ChangeStatusAsync(stationCode, request, cancellationToken);
        return Ok(new ApiEnvelope<StationResponse>(station, "Solar station status updated successfully."));
    }

    // Creates an energy slot under an active station.
    [HttpPost("{stationCode}/slots")]
    [Authorize(Policy = AuthorizationPolicies.BackofficeOnly)]
    [ProducesResponseType<ApiEnvelope<BookingSlotResponse>>(StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiEnvelope<BookingSlotResponse>>> CreateSlot(
        string stationCode,
        CreateBookingSlotRequest request,
        CancellationToken cancellationToken)
    {
        var slot = await bookingSlotService.CreateAsync(stationCode, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created,
            new ApiEnvelope<BookingSlotResponse>(slot, "Energy booking slot created successfully."));
    }

    // Lists a station's slots with optional UTC date and status filters.
    [HttpGet("{stationCode}/slots")]
    [Authorize(Policy = AuthorizationPolicies.Authenticated)]
    [ProducesResponseType<ApiEnvelope<IReadOnlyCollection<BookingSlotResponse>>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<IReadOnlyCollection<BookingSlotResponse>>>> GetSlots(
        string stationCode,
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc,
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var slots = await bookingSlotService.GetForStationAsync(
            stationCode, fromUtc, toUtc, status, cancellationToken);
        return Ok(new ApiEnvelope<IReadOnlyCollection<BookingSlotResponse>>(slots, "Energy slots loaded."));
    }
}
