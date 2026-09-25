using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogrid.Api.Contracts.Transactions;

public sealed record VerifyTransactionRequest(
    [property: Required, StringLength(40, MinimumLength = 3)] string ReservationCode,
    [property: Required, StringLength(200, MinimumLength = 20)] string TransactionToken);

public sealed record FinalizeTransactionRequest(
    [property: Required, StringLength(40, MinimumLength = 3)] string ReservationCode,
    [property: Required, StringLength(500, MinimumLength = 2)] string ConfirmationNote);
