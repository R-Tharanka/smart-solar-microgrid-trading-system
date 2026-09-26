namespace SmartSolarMicrogrid.Api.Contracts.Transactions;

/// <summary>Secure QR payload returned only at issue time to an authorized caller.</summary>
public sealed record QrTransactionResponse(
    string ReservationCode,
    string QrPayload,
    DateTime ExpiresAtUtc);

/// <summary>Operational reservation data returned after successful Grid Operator verification.</summary>
public sealed record VerifiedTransactionResponse(
    string ReservationId,
    string ReservationCode,
    string ProsumerNic,
    string StationId,
    decimal RequestedEnergyKwh,
    string Status);

/// <summary>Completion result containing the final measured energy and audit timestamp.</summary>
public sealed record FinalizedTransactionResponse(
    string ReservationCode,
    string Status,
    decimal ActualEnergyTransferredKwh,
    DateTime FinalizedAtUtc);

/// <summary>
/// Read model for operator and Backoffice transaction screens. The QR hash is deliberately excluded.
/// </summary>
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
