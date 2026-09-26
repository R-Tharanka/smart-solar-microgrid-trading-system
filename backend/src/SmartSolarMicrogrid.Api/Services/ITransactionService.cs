using SmartSolarMicrogrid.Api.Contracts.Transactions;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Services;

public interface ITransactionService
{
    /// <summary>
    /// Issues an opaque QR transaction token for an approved reservation after checking that the
    /// caller is either Backoffice or the Prosumer who owns the reservation.
    /// </summary>
    Task<QrTransactionResponse> IssueQrAsync(string reservationId, string callerIdentifier, UserRole callerRole,
        CancellationToken cancellationToken = default);

    /// <summary>Validates a scanned QR token and records the Grid Operator who verified it.</summary>
    Task<VerifiedTransactionResponse> VerifyAsync(VerifyTransactionRequest request, string operatorIdentifier,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Completes a verified transfer, records the delivered energy and closes its booking slot.
    /// </summary>
    Task<FinalizedTransactionResponse> FinalizeAsync(FinalizeTransactionRequest request, string operatorIdentifier,
        CancellationToken cancellationToken = default);

    /// <summary>Returns the operational and audit details for one reservation transaction.</summary>
    Task<TransactionDetailsResponse> GetAsync(string reservationCode, CancellationToken cancellationToken = default);
}
