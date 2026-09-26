namespace SmartSolarMicrogrid.Api.Contracts.Transactions;

public sealed record QrTransactionResponse(
    string ReservationCode,
    string QrPayload,
    DateTime ExpiresAtUtc);

public sealed record VerifiedTransactionResponse(
    string ReservationId,
    string ReservationCode,
    string ProsumerNic,
    string StationId,
    decimal RequestedEnergyKwh,
    string Status);

public sealed record FinalizedTransactionResponse(
    string ReservationCode,
    string Status,
    decimal ActualEnergyTransferredKwh,
    DateTime FinalizedAtUtc);

public sealed record TransactionDetailsResponse(
    string ReservationId,
    string ReservationCode,
    string ProsumerNic,
    string StationId,
    string SlotId,
    decimal RequestedEnergyKwh,
    DateTime ScheduledStartTimeUtc,
    DateTime ScheduledEndTimeUtc,
    string Status,
    DateTime? QrExpiresAtUtc,
    string? VerifiedByIdentifier,
    DateTime? VerifiedAtUtc,
    string? FinalizedByIdentifier,
    DateTime? FinalizedAtUtc,
    decimal? ActualEnergyTransferredKwh,
    string? ConfirmationNote);
