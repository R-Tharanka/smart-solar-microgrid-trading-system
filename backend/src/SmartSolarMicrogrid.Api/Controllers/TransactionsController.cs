using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.Authorization;
using SmartSolarMicrogrid.Api.Contracts;
using SmartSolarMicrogrid.Api.Contracts.Transactions;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
public sealed class TransactionsController(ITransactionService transactionService) : ControllerBase
{
    // Allows Backoffice or the owning Prosumer to obtain the secure QR payload.
    [HttpPost("api/reservations/{reservationId}/qr")]
    [Authorize(Policy = AuthorizationPolicies.Authenticated)]
    [ProducesResponseType<ApiEnvelope<QrTransactionResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<QrTransactionResponse>>> IssueQr(
        string reservationId,
        CancellationToken cancellationToken)
    {
        var result = await transactionService.IssueQrAsync(
            reservationId, RequiredIdentifier(), RequiredRole(), cancellationToken);
        return Ok(new ApiEnvelope<QrTransactionResponse>(result, "QR transaction issued."));
    }

    // Accepts scanned QR data from an active Grid Operator and records verification audit data.
    [HttpPost("api/transactions/verify")]
    [Authorize(Policy = AuthorizationPolicies.GridOperatorOnly)]
    [ProducesResponseType<ApiEnvelope<VerifiedTransactionResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<VerifiedTransactionResponse>>> Verify(
        VerifyTransactionRequest request,
        CancellationToken cancellationToken)
    {
        var result = await transactionService.VerifyAsync(request, RequiredIdentifier(), cancellationToken);
        return Ok(new ApiEnvelope<VerifiedTransactionResponse>(result, "Transaction verified."));
    }

    // Records the delivered energy and completes a previously verified transaction.
    [HttpPost("api/transactions/finalize")]
    [Authorize(Policy = AuthorizationPolicies.GridOperatorOnly)]
    [ProducesResponseType<ApiEnvelope<FinalizedTransactionResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<FinalizedTransactionResponse>>> Finalize(
        FinalizeTransactionRequest request,
        CancellationToken cancellationToken)
    {
        var result = await transactionService.FinalizeAsync(request, RequiredIdentifier(), cancellationToken);
        return Ok(new ApiEnvelope<FinalizedTransactionResponse>(result, "Energy transfer finalized."));
    }

    // Provides transaction and audit details to Backoffice and Grid Operator operational screens.
    [HttpGet("api/transactions/{reservationCode}")]
    [Authorize(Policy = AuthorizationPolicies.Staff)]
    [ProducesResponseType<ApiEnvelope<TransactionDetailsResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiEnvelope<TransactionDetailsResponse>>> Get(
        string reservationCode,
        CancellationToken cancellationToken)
    {
        var result = await transactionService.GetAsync(reservationCode, cancellationToken);
        return Ok(new ApiEnvelope<TransactionDetailsResponse>(result));
    }

    // Audit fields use the stable business identifier established by the identity module.
    private string RequiredIdentifier() => User.FindFirstValue("user_identifier")
        ?? throw new InvalidOperationException("Authenticated token has no business identifier.");

    private UserRole RequiredRole()
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        return Enum.TryParse<UserRole>(role, out var parsed)
            ? parsed
            : throw new InvalidOperationException("Authenticated token has no supported role.");
    }
}
