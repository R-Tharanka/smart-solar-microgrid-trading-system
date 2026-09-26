using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;
using SmartSolarMicrogrid.Api.Contracts.Transactions;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Persistence.Repositories;

namespace SmartSolarMicrogrid.Api.Services;

public sealed class TransactionService(
    ITransactionRepository repository,
    TimeProvider timeProvider,
    ILogger<TransactionService> logger) : ITransactionService
{
    public async Task<QrTransactionResponse> IssueQrAsync(
        string reservationId,
        string callerIdentifier,
        UserRole callerRole,
        CancellationToken cancellationToken = default)
    {
        var reservation = await repository.FindByIdAsync(reservationId, cancellationToken)
            ?? throw TransactionException.NotFound();
        if (callerRole != UserRole.Backoffice &&
            (callerRole != UserRole.Prosumer ||
             !string.Equals(reservation.ProsumerNic, callerIdentifier, StringComparison.OrdinalIgnoreCase)))
        {
            throw TransactionException.Forbidden();
        }
        if (reservation.Status != ReservationStatus.Approved)
        {
            throw TransactionException.Conflict("QR_STATUS_INVALID", "Only an approved reservation can receive a QR transaction.");
        }

        var now = UtcNow();
        var expiresAt = reservation.ScheduledEndTimeUtc;
        if (expiresAt <= now)
        {
            throw TransactionException.Conflict("QR_WINDOW_EXPIRED", "The reservation window has already expired.");
        }

        var token = Base64UrlEncoder.Encode(RandomNumberGenerator.GetBytes(32));
        var tokenHash = HashToken(token);
        if (!await repository.IssueQrAsync(reservationId, tokenHash, expiresAt, now, cancellationToken))
        {
            throw TransactionException.Conflict("QR_ALREADY_ISSUED", "The reservation state changed and a QR transaction could not be issued.");
        }

        var payload = JsonSerializer.Serialize(new
        {
            reservationCode = reservation.ReservationCode,
            transactionToken = token,
            expiresAtUtc = expiresAt
        });
        logger.LogInformation("QR transaction issued for {ReservationCode}", reservation.ReservationCode);
        return new QrTransactionResponse(reservation.ReservationCode, payload, expiresAt);
    }

    public async Task<VerifiedTransactionResponse> VerifyAsync(
        VerifyTransactionRequest request,
        string operatorIdentifier,
        CancellationToken cancellationToken = default)
    {
        var code = NormalizeCode(request.ReservationCode);
        var reservation = await repository.FindByCodeAsync(code, cancellationToken)
            ?? throw TransactionException.NotFound();
        if (reservation.Status != ReservationStatus.QrIssued)
        {
            throw TransactionException.Conflict("QR_STATUS_INVALID", "The reservation is not awaiting QR verification.");
        }
        var now = UtcNow();
        if (reservation.QrExpiresAtUtc is null || reservation.QrExpiresAtUtc <= now)
        {
            throw TransactionException.Conflict("QR_EXPIRED", "The QR transaction has expired.");
        }
        var suppliedHash = HashToken(request.TransactionToken.Trim());
        if (reservation.QrTokenHash is null || !FixedTimeEquals(reservation.QrTokenHash, suppliedHash))
        {
            throw TransactionException.InvalidToken();
        }
        if (!await repository.VerifyAsync(code, suppliedHash, operatorIdentifier, now, cancellationToken))
        {
            throw TransactionException.Conflict("QR_VERIFY_CONFLICT", "The QR transaction was already processed or changed.");
        }

        logger.LogInformation("Transaction {ReservationCode} verified by {OperatorIdentifier}", code, operatorIdentifier);
        return new VerifiedTransactionResponse(reservation.Id.ToString(), code, reservation.ProsumerNic,
            reservation.StationId.ToString(), reservation.RequestedEnergyKwh, ReservationStatus.Verified.ToString());
    }

    public async Task<FinalizedTransactionResponse> FinalizeAsync(
        FinalizeTransactionRequest request,
        string operatorIdentifier,
        CancellationToken cancellationToken = default)
    {
        var code = NormalizeCode(request.ReservationCode);
        var reservation = await repository.FindByCodeAsync(code, cancellationToken)
            ?? throw TransactionException.NotFound();
        if (reservation.Status != ReservationStatus.Verified)
        {
            throw TransactionException.Conflict("FINALIZE_STATUS_INVALID", "Only a verified transaction can be finalized.");
        }
        var transferredEnergy = request.ActualEnergyTransferredKwh ?? reservation.RequestedEnergyKwh;
        if (transferredEnergy <= 0 || transferredEnergy > reservation.RequestedEnergyKwh)
        {
            throw TransactionException.Validation(
                "TRANSFER_ENERGY_INVALID",
                "Actual transferred energy must be greater than zero and cannot exceed the reserved energy.");
        }
        var now = UtcNow();
        if (!await repository.FinalizeAsync(
                code, reservation.SlotId, operatorIdentifier, request.ConfirmationNote.Trim(),
                transferredEnergy, now, cancellationToken))
        {
            throw TransactionException.Conflict("FINALIZE_CONFLICT", "The transaction was already finalized or changed.");
        }

        logger.LogInformation("Transaction {ReservationCode} finalized by {OperatorIdentifier}", code, operatorIdentifier);
        return new FinalizedTransactionResponse(
            code, ReservationStatus.Completed.ToString(), transferredEnergy, now);
    }

    public async Task<TransactionDetailsResponse> GetAsync(
        string reservationCode,
        CancellationToken cancellationToken = default)
    {
        var reservation = await repository.FindByCodeAsync(NormalizeCode(reservationCode), cancellationToken)
            ?? throw TransactionException.NotFound();
        return new TransactionDetailsResponse(
            reservation.Id.ToString(), reservation.ReservationCode, reservation.ProsumerNic,
            reservation.StationId.ToString(), reservation.SlotId.ToString(), reservation.RequestedEnergyKwh,
            reservation.ScheduledStartTimeUtc, reservation.ScheduledEndTimeUtc, reservation.Status.ToString(),
            reservation.QrExpiresAtUtc, reservation.VerifiedByUserId, reservation.VerifiedAtUtc,
            reservation.FinalizedByUserId, reservation.FinalizedAtUtc,
            reservation.ActualEnergyTransferredKwh, reservation.ConfirmationNote);
    }

    private DateTime UtcNow() => timeProvider.GetUtcNow().UtcDateTime;

    private static string NormalizeCode(string value) => value.Trim().ToUpperInvariant();

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    private static bool FixedTimeEquals(string expected, string actual) =>
        CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(expected), Encoding.ASCII.GetBytes(actual));
}
