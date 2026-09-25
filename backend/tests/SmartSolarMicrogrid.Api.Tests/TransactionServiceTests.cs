using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Bson;
using SmartSolarMicrogrid.Api.Contracts.Transactions;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Persistence.Repositories;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Tests;

public sealed class TransactionServiceTests
{
    private static readonly DateTime Now = new(2026, 9, 25, 6, 0, 0, DateTimeKind.Utc);

    [Fact]
    public async Task IssueQr_AllowsOwningProsumer_AndStoresOnlyTokenHash()
    {
        var repository = new FakeTransactionRepository(Reservation(ReservationStatus.Approved));
        var service = Service(repository);

        var result = await service.IssueQrAsync(repository.Item.Id.ToString(), "200012345678", UserRole.Prosumer,
            TestContext.Current.CancellationToken);
        using var payload = JsonDocument.Parse(result.QrPayload);
        var token = payload.RootElement.GetProperty("transactionToken").GetString();

        Assert.Equal(ReservationStatus.QrIssued, repository.Item.Status);
        Assert.NotNull(repository.Item.QrTokenHash);
        Assert.DoesNotContain(token!, repository.Item.QrTokenHash!, StringComparison.Ordinal);
        Assert.Equal(repository.Item.ScheduledEndTimeUtc, result.ExpiresAtUtc);
    }

    [Fact]
    public async Task IssueQr_RejectsDifferentProsumer()
    {
        var repository = new FakeTransactionRepository(Reservation(ReservationStatus.Approved));
        var service = Service(repository);

        var error = await Assert.ThrowsAsync<TransactionException>(() =>
            service.IssueQrAsync(repository.Item.Id.ToString(), "other-nic", UserRole.Prosumer,
                TestContext.Current.CancellationToken));

        Assert.Equal(StatusCodes.Status403Forbidden, error.StatusCode);
    }

    [Fact]
    public async Task Verify_ValidIssuedToken_RecordsOperatorIdentifier()
    {
        var repository = new FakeTransactionRepository(Reservation(ReservationStatus.Approved));
        var service = Service(repository);
        var qr = await service.IssueQrAsync(repository.Item.Id.ToString(), repository.Item.ProsumerNic,
            UserRole.Prosumer, TestContext.Current.CancellationToken);
        using var payload = JsonDocument.Parse(qr.QrPayload);
        var token = payload.RootElement.GetProperty("transactionToken").GetString()!;

        var result = await service.VerifyAsync(
            new VerifyTransactionRequest(repository.Item.ReservationCode, token), "operator@example.com",
            TestContext.Current.CancellationToken);

        Assert.Equal("Verified", result.Status);
        Assert.Equal("operator@example.com", repository.Item.VerifiedByUserId);
    }

    [Fact]
    public async Task Verify_InvalidToken_DoesNotChangeReservation()
    {
        var reservation = Reservation(ReservationStatus.QrIssued);
        reservation.QrTokenHash = new string('A', 64);
        reservation.QrExpiresAtUtc = Now.AddHours(1);
        var repository = new FakeTransactionRepository(reservation);

        var error = await Assert.ThrowsAsync<TransactionException>(() => Service(repository).VerifyAsync(
            new VerifyTransactionRequest(reservation.ReservationCode, new string('x', 24)), "operator@example.com",
            TestContext.Current.CancellationToken));

        Assert.Equal("QR_TOKEN_INVALID", error.ErrorCode);
        Assert.Equal(ReservationStatus.QrIssued, reservation.Status);
    }

    [Fact]
    public async Task Finalize_ChangesVerifiedTransactionOnlyOnce()
    {
        var repository = new FakeTransactionRepository(Reservation(ReservationStatus.Verified));
        var service = Service(repository);
        var request = new FinalizeTransactionRequest(repository.Item.ReservationCode, "Transfer complete");

        var result = await service.FinalizeAsync(request, "operator@example.com", TestContext.Current.CancellationToken);
        var error = await Assert.ThrowsAsync<TransactionException>(() =>
            service.FinalizeAsync(request, "operator@example.com", TestContext.Current.CancellationToken));

        Assert.Equal("Completed", result.Status);
        Assert.Equal("FINALIZE_STATUS_INVALID", error.ErrorCode);
        Assert.Equal("Transfer complete", repository.Item.ConfirmationNote);
    }

    private static TransactionService Service(ITransactionRepository repository) =>
        new(repository, new FixedTimeProvider(Now), NullLogger<TransactionService>.Instance);

    private static EnergyReservation Reservation(ReservationStatus status) => new()
    {
        Id = ObjectId.GenerateNewId(),
        ReservationCode = "RSV-20260925-0001",
        ProsumerNic = "200012345678",
        StationId = ObjectId.GenerateNewId(),
        SlotId = ObjectId.GenerateNewId(),
        RequestedEnergyKwh = 10,
        ScheduledStartTimeUtc = Now.AddMinutes(15),
        ScheduledEndTimeUtc = Now.AddHours(1),
        Status = status,
        CreatedAtUtc = Now.AddDays(-1),
        UpdatedAtUtc = Now.AddDays(-1)
    };

    private sealed class FixedTimeProvider(DateTime utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(utcNow);
    }

    private sealed class FakeTransactionRepository(EnergyReservation item) : ITransactionRepository
    {
        public EnergyReservation Item { get; } = item;

        public Task<EnergyReservation?> FindByIdAsync(string reservationId, CancellationToken cancellationToken = default) =>
            Task.FromResult<EnergyReservation?>(reservationId == Item.Id.ToString() ? Item : null);

        public Task<EnergyReservation?> FindByCodeAsync(string reservationCode, CancellationToken cancellationToken = default) =>
            Task.FromResult<EnergyReservation?>(reservationCode == Item.ReservationCode ? Item : null);

        public Task<bool> IssueQrAsync(string reservationId, string tokenHash, DateTime expiresAtUtc,
            DateTime changedAtUtc, CancellationToken cancellationToken = default)
        {
            if (reservationId != Item.Id.ToString() || Item.Status != ReservationStatus.Approved) return Task.FromResult(false);
            Item.QrTokenHash = tokenHash;
            Item.QrExpiresAtUtc = expiresAtUtc;
            Item.Status = ReservationStatus.QrIssued;
            Item.UpdatedAtUtc = changedAtUtc;
            return Task.FromResult(true);
        }

        public Task<bool> VerifyAsync(string reservationCode, string tokenHash, string operatorIdentifier,
            DateTime verifiedAtUtc, CancellationToken cancellationToken = default)
        {
            if (reservationCode != Item.ReservationCode || Item.Status != ReservationStatus.QrIssued ||
                tokenHash != Item.QrTokenHash || Item.QrExpiresAtUtc <= verifiedAtUtc) return Task.FromResult(false);
            Item.Status = ReservationStatus.Verified;
            Item.VerifiedByUserId = operatorIdentifier;
            Item.VerifiedAtUtc = verifiedAtUtc;
            return Task.FromResult(true);
        }

        public Task<bool> FinalizeAsync(string reservationCode, string operatorIdentifier, string confirmationNote,
            DateTime finalizedAtUtc, CancellationToken cancellationToken = default)
        {
            if (reservationCode != Item.ReservationCode || Item.Status != ReservationStatus.Verified) return Task.FromResult(false);
            Item.Status = ReservationStatus.Completed;
            Item.FinalizedByUserId = operatorIdentifier;
            Item.FinalizedAtUtc = finalizedAtUtc;
            Item.ConfirmationNote = confirmationNote;
            return Task.FromResult(true);
        }
    }
}
