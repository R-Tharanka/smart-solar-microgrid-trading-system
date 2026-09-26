using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.Authorization;
using SmartSolarMicrogrid.Api.Contracts;
using SmartSolarMicrogrid.Api.Contracts.Reservations;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
public sealed class DashboardController(IReservationService reservationService) : ControllerBase
{
    // GET /api/dashboard/summary — Staff operational reservation dashboard.
    [HttpGet("api/dashboard/summary")]
    [Authorize(Policy = AuthorizationPolicies.Staff)]
    [ProducesResponseType<ApiEnvelope<DashboardSummaryResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<DashboardSummaryResponse>>> GetSummary(
        CancellationToken cancellationToken)
    {
        var result = await reservationService.GetDashboardSummaryAsync(cancellationToken);
        return Ok(new ApiEnvelope<DashboardSummaryResponse>(result));
    }

    // GET /api/dashboard/me — Prosumer's personal booking summary.
    [HttpGet("api/dashboard/me")]
    [Authorize(Policy = AuthorizationPolicies.ProsumerOnly)]
    [ProducesResponseType<ApiEnvelope<ProsumerDashboardResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<ProsumerDashboardResponse>>> GetMine(
        CancellationToken cancellationToken)
    {
        var nic = User.FindFirstValue("user_identifier")
            ?? throw new InvalidOperationException("Authenticated Prosumer token has no NIC identifier.");
        var result = await reservationService.GetProsumerDashboardAsync(nic, cancellationToken);
        return Ok(new ApiEnvelope<ProsumerDashboardResponse>(result));
    }
}
