using SmartSolarMicrogrid.Api.Contracts.Transactions;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Services;

public interface ITransactionService
{
    Task<QrTransactionResponse> IssueQrAsync(string reservationId, string callerIdentifier, UserRole callerRole,
        CancellationToken cancellationToken = default);
    Task<VerifiedTransactionResponse> VerifyAsync(VerifyTransactionRequest request, string operatorIdentifier,
        CancellationToken cancellationToken = default);
    Task<FinalizedTransactionResponse> FinalizeAsync(FinalizeTransactionRequest request, string operatorIdentifier,
        CancellationToken cancellationToken = default);
    Task<TransactionDetailsResponse> GetAsync(string reservationCode, CancellationToken cancellationToken = default);
}
