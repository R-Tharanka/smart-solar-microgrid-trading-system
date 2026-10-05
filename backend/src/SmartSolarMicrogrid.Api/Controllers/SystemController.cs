// -----------------------------------------------------------------------------
// File: SystemController.cs
// Purpose: Exposes public API name, version, and server-time metadata.
// -----------------------------------------------------------------------------
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.Contracts;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/system")]
public sealed class SystemController : ControllerBase
{
    // Return API identification metadata and the current UTC time.
    [AllowAnonymous]
    [HttpGet("info")]
    [ProducesResponseType<ApiEnvelope<object>>(StatusCodes.Status200OK)]
    public ActionResult<ApiEnvelope<object>> GetInfo() => Ok(new ApiEnvelope<object>(new
    {
        name = "Smart Solar Microgrid Trading API",
        version = "v1",
        utcNow = DateTimeOffset.UtcNow
    }));
}
