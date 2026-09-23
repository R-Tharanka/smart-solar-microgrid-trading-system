namespace SmartSolarMicrogrid.Api.Contracts;

public sealed record ApiEnvelope<T>(T Data, string? Message = null);

public sealed record PagedEnvelope<T>(
    IReadOnlyCollection<T> Items,
    int Page,
    int PageSize,
    long TotalCount);
