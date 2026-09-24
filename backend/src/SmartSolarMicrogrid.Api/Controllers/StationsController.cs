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
