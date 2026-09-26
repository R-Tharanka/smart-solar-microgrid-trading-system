using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogrid.Api.Contracts.Transactions;

/// <summary>QR values scanned by a Grid Operator for server-side verification.</summary>
public sealed record VerifyTransactionRequest(
    /// <summary>Public reservation code contained in the QR payload.</summary>
    [property: Required, StringLength(40, MinimumLength = 3)] string ReservationCode,
    /// <summary>Opaque secret issued by the API; the database stores only its hash.</summary>
    [property: Required, StringLength(200, MinimumLength = 20)] string TransactionToken);

/// <summary>Operator confirmation used to complete a verified energy transfer.</summary>
public sealed record FinalizeTransactionRequest(
    /// <summary>Public code of the verified reservation.</summary>
    [property: Required, StringLength(40, MinimumLength = 3)] string ReservationCode,
    /// <summary>Human-readable operational note retained with the completed transaction.</summary>
    [property: Required, StringLength(500, MinimumLength = 2)] string ConfirmationNote,
    /// <summary>
    /// Measured delivered energy. When omitted, the API records the full reserved amount for
    /// backward compatibility with clients built against the original contract.
    /// </summary>
    [property: Range(typeof(decimal), "0.001", "999999999")] decimal? ActualEnergyTransferredKwh = null);
