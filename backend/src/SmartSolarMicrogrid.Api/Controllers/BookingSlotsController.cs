using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.Authorization;
using SmartSolarMicrogrid.Api.Contracts;
using SmartSolarMicrogrid.Api.Contracts.BookingSlots;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/slots")]
public sealed class BookingSlotsController(IBookingSlotService bookingSlotService) : ControllerBase
{
    [HttpGet("{slotCode}")]
    [Authorize(Policy = AuthorizationPolicies.Authenticated)]
    [ProducesResponseType<ApiEnvelope<BookingSlotResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<BookingSlotResponse>>> Get(
        string slotCode,
        CancellationToken cancellationToken)
    {
        var slot = await bookingSlotService.GetAsync(slotCode, cancellationToken);
        return Ok(new ApiEnvelope<BookingSlotResponse>(slot));
    }

    [HttpPut("{slotCode}")]
    [Authorize(Policy = AuthorizationPolicies.BackofficeOnly)]
    [ProducesResponseType<ApiEnvelope<BookingSlotResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<BookingSlotResponse>>> Update(
        string slotCode,
        UpdateBookingSlotRequest request,
        CancellationToken cancellationToken)
    {
        var slot = await bookingSlotService.UpdateAsync(slotCode, request, cancellationToken);
        return Ok(new ApiEnvelope<BookingSlotResponse>(slot, "Energy booking slot updated successfully."));
    }

    [HttpPatch("{slotCode}/status")]
    [Authorize(Policy = AuthorizationPolicies.BackofficeOnly)]
    [ProducesResponseType<ApiEnvelope<BookingSlotResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<BookingSlotResponse>>> ChangeStatus(
        string slotCode,
        ChangeBookingSlotStatusRequest request,
        CancellationToken cancellationToken)
    {
        var slot = await bookingSlotService.ChangeStatusAsync(slotCode, request, cancellationToken);
        return Ok(new ApiEnvelope<BookingSlotResponse>(slot, "Energy booking slot status updated successfully."));
    }
}
