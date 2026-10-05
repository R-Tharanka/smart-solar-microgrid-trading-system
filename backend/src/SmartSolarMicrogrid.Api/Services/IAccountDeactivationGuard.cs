// -----------------------------------------------------------------------------
// File: IAccountDeactivationGuard.cs
// Purpose: Defines the cross-domain check required before Prosumer deactivation.
// -----------------------------------------------------------------------------
namespace SmartSolarMicrogrid.Api.Services;

public interface IAccountDeactivationGuard
{
    // Reject deactivation when the Prosumer has blocking domain activity.
    Task EnsureCanDeactivateAsync(string prosumerNic, CancellationToken cancellationToken = default);
}
