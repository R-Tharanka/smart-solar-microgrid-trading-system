namespace SmartSolarMicrogrid.Api.Services;

public interface IAccountDeactivationGuard
{
    Task EnsureCanDeactivateAsync(string prosumerNic, CancellationToken cancellationToken = default);
}
