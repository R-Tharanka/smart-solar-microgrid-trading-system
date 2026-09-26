using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.Authorization;
using SmartSolarMicrogrid.Api.Contracts;
using SmartSolarMicrogrid.Api.Contracts.Reservations;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
public sealed class ReservationsController(IReservationService reservationService) : ControllerBase
{
    // POST /api/reservations — Prosumer creates a new energy reservation.
    [HttpPost("api/reservations")]
    [Authorize(Policy = AuthorizationPolicies.ProsumerOnly)]
    [ProducesResponseType<ApiEnvelope<ReservationResponse>>(StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiEnvelope<ReservationResponse>>> Create(
        CreateReservationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await reservationService.CreateAsync(RequiredNic(), request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { reservationId = result.ReservationId },
            new ApiEnvelope<ReservationResponse>(result, "Reservation created successfully."));
    }

    // GET /api/reservations/me — Prosumer retrieves their own reservation history.
    [HttpGet("api/reservations/me")]
    [Authorize(Policy = AuthorizationPolicies.ProsumerOnly)]
    [ProducesResponseType<ApiEnvelope<IReadOnlyCollection<ReservationSummaryResponse>>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<IReadOnlyCollection<ReservationSummaryResponse>>>> GetMine(
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        ReservationStatus? parsedStatus = null;
        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<ReservationStatus>(status, ignoreCase: true, out var s))
        {
            parsedStatus = s;
        }

        var result = await reservationService.GetOwnAsync(RequiredNic(), parsedStatus, cancellationToken);
        return Ok(new ApiEnvelope<IReadOnlyCollection<ReservationSummaryResponse>>(result));
    }

    // GET /api/reservations/{reservationId} — Any authenticated user; Prosumer is scoped to their own.
    [HttpGet("api/reservations/{reservationId}")]
    [Authorize(Policy = AuthorizationPolicies.Authenticated)]
    [ProducesResponseType<ApiEnvelope<ReservationResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<ReservationResponse>>> GetById(
        string reservationId,
        CancellationToken cancellationToken)
    {
        var result = await reservationService.GetByIdAsync(
            reservationId, RequiredIdentifier(), RequiredRole(), cancellationToken);
        return Ok(new ApiEnvelope<ReservationResponse>(result));
    }

    // PUT /api/reservations/{reservationId} — Prosumer updates their reservation's energy amount.
    [HttpPut("api/reservations/{reservationId}")]
    [Authorize(Policy = AuthorizationPolicies.ProsumerOnly)]
    [ProducesResponseType<ApiEnvelope<ReservationResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<ReservationResponse>>> Update(
        string reservationId,
        UpdateReservationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await reservationService.UpdateAsync(reservationId, RequiredNic(), request, cancellationToken);
        return Ok(new ApiEnvelope<ReservationResponse>(result, "Reservation updated successfully."));
    }

    // POST /api/reservations/{reservationId}/cancel — Prosumer cancels their reservation.
    [HttpPost("api/reservations/{reservationId}/cancel")]
    [Authorize(Policy = AuthorizationPolicies.ProsumerOnly)]
    [ProducesResponseType<ApiEnvelope<ReservationResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<ReservationResponse>>> Cancel(
        string reservationId,
        CancelReservationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await reservationService.CancelAsync(reservationId, RequiredNic(), request, cancellationToken);
        return Ok(new ApiEnvelope<ReservationResponse>(result, "Reservation cancelled successfully."));
    }

    // POST /api/reservations/{reservationId}/approve — Staff approves a pending reservation.
    [HttpPost("api/reservations/{reservationId}/approve")]
    [Authorize(Policy = AuthorizationPolicies.Staff)]
    [ProducesResponseType<ApiEnvelope<ReservationResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<ReservationResponse>>> Approve(
        string reservationId,
        CancellationToken cancellationToken)
    {
        var result = await reservationService.ApproveAsync(reservationId, cancellationToken);
        return Ok(new ApiEnvelope<ReservationResponse>(result, "Reservation approved successfully."));
    }

    // POST /api/reservations/{reservationId}/reject — Staff rejects a pending reservation.
    [HttpPost("api/reservations/{reservationId}/reject")]
    [Authorize(Policy = AuthorizationPolicies.Staff)]
    [ProducesResponseType<ApiEnvelope<ReservationResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<ReservationResponse>>> Reject(
        string reservationId,
        RejectReservationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await reservationService.RejectAsync(reservationId, request, cancellationToken);
        return Ok(new ApiEnvelope<ReservationResponse>(result, "Reservation rejected."));
    }

    // GET /api/reservations — Staff views all reservations with optional filters.
    [HttpGet("api/reservations")]
    [Authorize(Policy = AuthorizationPolicies.Staff)]
    [ProducesResponseType<ApiEnvelope<IReadOnlyCollection<ReservationSummaryResponse>>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<IReadOnlyCollection<ReservationSummaryResponse>>>> GetAll(
        [FromQuery] string? status,
        [FromQuery] string? stationId,
        CancellationToken cancellationToken)
    {
        var result = await reservationService.GetAllAsync(status, stationId, cancellationToken);
        return Ok(new ApiEnvelope<IReadOnlyCollection<ReservationSummaryResponse>>(result));
    }

    // -------------------------------------------------------------------------
    // Private helpers — identical pattern to TransactionsController
    // -------------------------------------------------------------------------

    private string RequiredNic() => User.FindFirstValue("user_identifier")
        ?? throw new InvalidOperationException("Authenticated Prosumer token has no NIC identifier.");

    private string RequiredIdentifier() => User.FindFirstValue("user_identifier")
        ?? throw new InvalidOperationException("Authenticated token has no business identifier.");

    private UserRole RequiredRole()
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        return Enum.TryParse<UserRole>(role, out var parsed)
            ? parsed
            : throw new InvalidOperationException("Authenticated token has no supported role.");
    }
}
