using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.Contracts;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/system")]
public sealed class SystemController : ControllerBase
{
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
