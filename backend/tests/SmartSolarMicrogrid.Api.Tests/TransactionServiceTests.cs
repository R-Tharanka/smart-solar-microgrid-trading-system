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
    public async Task IssueQr_RenewsIssuedQr_AndReplacesHashAndExpiry()
    {
        var repository = new FakeTransactionRepository(Reservation(ReservationStatus.Approved));
        var service = Service(repository);
        var original = await service.IssueQrAsync(
            repository.Item.Id.ToString(), repository.Item.ProsumerNic, UserRole.Prosumer,
            TestContext.Current.CancellationToken);
        var originalToken = ReadToken(original);
        var originalHash = repository.Item.QrTokenHash;
        repository.Item.QrExpiresAtUtc = Now.AddMinutes(5);

        var renewed = await service.IssueQrAsync(
            repository.Item.Id.ToString(), repository.Item.ProsumerNic, UserRole.Prosumer,
            TestContext.Current.CancellationToken);
        var renewedToken = ReadToken(renewed);

        Assert.NotEqual(originalToken, renewedToken);
        Assert.Equal(ReservationStatus.QrIssued, repository.Item.Status);
        Assert.NotEqual(originalHash, repository.Item.QrTokenHash);
        Assert.DoesNotContain(renewedToken, repository.Item.QrTokenHash!, StringComparison.Ordinal);
        Assert.Equal(repository.Item.ScheduledEndTimeUtc, repository.Item.QrExpiresAtUtc);
        Assert.Equal(repository.Item.ScheduledEndTimeUtc, renewed.ExpiresAtUtc);
    }

    [Fact]
    public async Task IssueQr_RenewalRejectsDifferentProsumerWithoutReplacingHash()
    {
        var reservation = Reservation(ReservationStatus.QrIssued);
        reservation.QrTokenHash = new string('A', 64);
        reservation.QrExpiresAtUtc = Now.AddMinutes(5);
        var repository = new FakeTransactionRepository(reservation);

        var error = await Assert.ThrowsAsync<TransactionException>(() => Service(repository).IssueQrAsync(
            reservation.Id.ToString(), "other-nic", UserRole.Prosumer,
            TestContext.Current.CancellationToken));

        Assert.Equal(StatusCodes.Status403Forbidden, error.StatusCode);
        Assert.Equal(new string('A', 64), reservation.QrTokenHash);
        Assert.Equal(Now.AddMinutes(5), reservation.QrExpiresAtUtc);
    }

    [Fact]
    public async Task Verify_OldTokenAfterRenewal_IsRejected()
    {
        var repository = new FakeTransactionRepository(Reservation(ReservationStatus.Approved));
        var service = Service(repository);
        var original = await service.IssueQrAsync(
            repository.Item.Id.ToString(), repository.Item.ProsumerNic, UserRole.Prosumer,
            TestContext.Current.CancellationToken);
        var originalToken = ReadToken(original);

        await service.IssueQrAsync(
            repository.Item.Id.ToString(), repository.Item.ProsumerNic, UserRole.Prosumer,
            TestContext.Current.CancellationToken);

        var error = await Assert.ThrowsAsync<TransactionException>(() => service.VerifyAsync(
            new VerifyTransactionRequest(repository.Item.ReservationCode, originalToken),
            "operator@example.com", TestContext.Current.CancellationToken));

        Assert.Equal("QR_TOKEN_INVALID", error.ErrorCode);
        Assert.Equal(ReservationStatus.QrIssued, repository.Item.Status);
    }

    [Fact]
    public async Task Verify_RenewedToken_RemainsValid()
    {
        var repository = new FakeTransactionRepository(Reservation(ReservationStatus.Approved));
        var service = Service(repository);
        await service.IssueQrAsync(
            repository.Item.Id.ToString(), repository.Item.ProsumerNic, UserRole.Prosumer,
            TestContext.Current.CancellationToken);
        var renewed = await service.IssueQrAsync(
            repository.Item.Id.ToString(), repository.Item.ProsumerNic, UserRole.Prosumer,
            TestContext.Current.CancellationToken);

        var result = await service.VerifyAsync(
            new VerifyTransactionRequest(repository.Item.ReservationCode, ReadToken(renewed)),
            "operator@example.com", TestContext.Current.CancellationToken);

        Assert.Equal("Verified", result.Status);
        Assert.Equal("operator@example.com", repository.Item.VerifiedByUserId);
    }

    [Theory]
    [InlineData(ReservationStatus.Pending)]
    [InlineData(ReservationStatus.Verified)]
    [InlineData(ReservationStatus.Completed)]
    public async Task IssueQr_RejectsInvalidReservationState(ReservationStatus status)
    {
        var repository = new FakeTransactionRepository(Reservation(status));

        var error = await Assert.ThrowsAsync<TransactionException>(() => Service(repository).IssueQrAsync(
            repository.Item.Id.ToString(), repository.Item.ProsumerNic, UserRole.Prosumer,
            TestContext.Current.CancellationToken));

        Assert.Equal("QR_STATUS_INVALID", error.ErrorCode);
        Assert.Equal(status, repository.Item.Status);
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
        Assert.Equal(repository.Item.RequestedEnergyKwh, result.ActualEnergyTransferredKwh);
        Assert.Equal("FINALIZE_STATUS_INVALID", error.ErrorCode);
        Assert.Equal("Transfer complete", repository.Item.ConfirmationNote);
        Assert.Equal(repository.Item.RequestedEnergyKwh, repository.Item.ActualEnergyTransferredKwh);
    }

    [Fact]
    public async Task Finalize_RecordsOperatorReportedEnergy()
    {
        var repository = new FakeTransactionRepository(Reservation(ReservationStatus.Verified));
        var request = new FinalizeTransactionRequest(
            repository.Item.ReservationCode, "Partial transfer completed", 8.5m);

        var result = await Service(repository).FinalizeAsync(
            request, "operator@example.com", TestContext.Current.CancellationToken);

        Assert.Equal(8.5m, result.ActualEnergyTransferredKwh);
        Assert.Equal(8.5m, repository.Item.ActualEnergyTransferredKwh);
    }

    [Fact]
    public async Task Finalize_RejectsEnergyAboveReservation()
    {
        var repository = new FakeTransactionRepository(Reservation(ReservationStatus.Verified));
        var request = new FinalizeTransactionRequest(
            repository.Item.ReservationCode, "Transfer completed", 10.1m);

        var error = await Assert.ThrowsAsync<TransactionException>(() => Service(repository).FinalizeAsync(
            request, "operator@example.com", TestContext.Current.CancellationToken));

        Assert.Equal("TRANSFER_ENERGY_INVALID", error.ErrorCode);
        Assert.Equal(ReservationStatus.Verified, repository.Item.Status);
    }

    [Fact]
    public async Task Finalize_RejectsTransferExceedingBatteryCapacity()
    {
        var repository = new FakeTransactionRepository(Reservation(ReservationStatus.Verified))
        {
            SimulateStationCapacityExceeded = true
        };
        var request = new FinalizeTransactionRequest(
            repository.Item.ReservationCode, "Transfer completed", 10m);

        var error = await Assert.ThrowsAsync<TransactionException>(() => Service(repository).FinalizeAsync(
            request, "operator@example.com", TestContext.Current.CancellationToken));

        Assert.Equal("FINALIZE_CONFLICT", error.ErrorCode);
        Assert.Equal(ReservationStatus.Verified, repository.Item.Status);
    }

    private static TransactionService Service(ITransactionRepository repository) =>
        new(repository, new FixedTimeProvider(Now), NullLogger<TransactionService>.Instance);

    private static string ReadToken(QrTransactionResponse response)
    {
        using var payload = JsonDocument.Parse(response.QrPayload);
        return payload.RootElement.GetProperty("transactionToken").GetString()!;
    }

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
            if (reservationId != Item.Id.ToString() ||
                (Item.Status != ReservationStatus.Approved && Item.Status != ReservationStatus.QrIssued))
            {
                return Task.FromResult(false);
            }
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

        public bool SimulateStationCapacityExceeded { get; init; }

        public Task<bool> FinalizeAsync(string reservationCode, ObjectId stationId, ObjectId slotId, string operatorIdentifier,
            string confirmationNote, decimal actualEnergyTransferredKwh, DateTime finalizedAtUtc,
            CancellationToken cancellationToken = default)
        {
            if (SimulateStationCapacityExceeded) return Task.FromResult(false);
            if (reservationCode != Item.ReservationCode || slotId != Item.SlotId ||
                Item.Status != ReservationStatus.Verified) return Task.FromResult(false);
            Item.Status = ReservationStatus.Completed;
            Item.FinalizedByUserId = operatorIdentifier;
            Item.FinalizedAtUtc = finalizedAtUtc;
            Item.ActualEnergyTransferredKwh = actualEnergyTransferredKwh;
            Item.ConfirmationNote = confirmationNote;
            return Task.FromResult(true);
        }
    }
}
