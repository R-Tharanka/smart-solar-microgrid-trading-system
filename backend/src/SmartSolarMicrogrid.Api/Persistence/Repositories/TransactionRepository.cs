using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Persistence.Repositories;

public sealed class TransactionRepository(MongoDbContext context) : ITransactionRepository
{
    private readonly IMongoCollection<EnergyReservation> _reservations =
        context.Database.GetCollection<EnergyReservation>(CollectionNames.EnergyReservations);

    // Invalid ObjectId input is treated as a missing transaction instead of reaching MongoDB.
    public async Task<EnergyReservation?> FindByIdAsync(string reservationId, CancellationToken cancellationToken = default)
    {
        if (!ObjectId.TryParse(reservationId, out var id)) return null;
        return await _reservations.Find(r => r.Id == id).FirstOrDefaultAsync(cancellationToken);
    }

    // Resolves the stable business code used by operator screens and QR payloads.
    public async Task<EnergyReservation?> FindByCodeAsync(
        string reservationCode,
        CancellationToken cancellationToken = default) =>
        await _reservations.Find(r => r.ReservationCode == reservationCode).FirstOrDefaultAsync(cancellationToken);

    // The status predicate prevents two callers from issuing competing QR tokens.
    public async Task<bool> IssueQrAsync(string reservationId, string tokenHash, DateTime expiresAtUtc,
        DateTime changedAtUtc, CancellationToken cancellationToken = default)
    {
        if (!ObjectId.TryParse(reservationId, out var id)) return false;
        var filter = Builders<EnergyReservation>.Filter.Where(r =>
            r.Id == id && r.Status == ReservationStatus.Approved);
        var update = Builders<EnergyReservation>.Update
            .Set(r => r.QrTokenHash, tokenHash)
            .Set(r => r.QrExpiresAtUtc, expiresAtUtc)
            .Set(r => r.Status, ReservationStatus.QrIssued)
            .Set(r => r.UpdatedAtUtc, changedAtUtc);
        return (await _reservations.UpdateOneAsync(filter, update, cancellationToken: cancellationToken)).ModifiedCount == 1;
    }

    // MongoDB rechecks status, hash and expiry during the update to prevent scan races and replay.
    public async Task<bool> VerifyAsync(string reservationCode, string tokenHash, string operatorIdentifier,
        DateTime verifiedAtUtc, CancellationToken cancellationToken = default)
    {
        var filter = Builders<EnergyReservation>.Filter.Where(r =>
            r.ReservationCode == reservationCode && r.Status == ReservationStatus.QrIssued &&
            r.QrTokenHash == tokenHash && r.QrExpiresAtUtc > verifiedAtUtc);
        var update = Builders<EnergyReservation>.Update
            .Set(r => r.Status, ReservationStatus.Verified)
            .Set(r => r.VerifiedByUserId, operatorIdentifier)
            .Set(r => r.VerifiedAtUtc, verifiedAtUtc)
            .Set(r => r.UpdatedAtUtc, verifiedAtUtc);
        return (await _reservations.UpdateOneAsync(filter, update, cancellationToken: cancellationToken)).ModifiedCount == 1;
    }

    // Completes one verified reservation without closing a shared-capacity slot.
    public async Task<bool> FinalizeAsync(string reservationCode, ObjectId stationId, ObjectId slotId, string operatorIdentifier,
        string confirmationNote, decimal actualEnergyTransferredKwh, DateTime finalizedAtUtc,
        CancellationToken cancellationToken = default)
    {
        using var session = await context.Client.StartSessionAsync(cancellationToken: cancellationToken);
        session.StartTransaction();

        // Conditional update makes repeated or concurrent finalization fail safely.
        var reservationFilter = Builders<EnergyReservation>.Filter.Where(r =>
            r.ReservationCode == reservationCode && r.SlotId == slotId &&
            r.Status == ReservationStatus.Verified);
        var reservationUpdate = Builders<EnergyReservation>.Update
            .Set(r => r.Status, ReservationStatus.Completed)
            .Set(r => r.FinalizedByUserId, operatorIdentifier)
            .Set(r => r.FinalizedAtUtc, finalizedAtUtc)
            .Set(r => r.ActualEnergyTransferredKwh, actualEnergyTransferredKwh)
            .Set(r => r.ConfirmationNote, confirmationNote)
            .Set(r => r.UpdatedAtUtc, finalizedAtUtc);
        var reservationResult = await _reservations.UpdateOneAsync(
            session, reservationFilter, reservationUpdate, cancellationToken: cancellationToken);
        if (reservationResult.ModifiedCount != 1)
        {
            await session.AbortTransactionAsync(cancellationToken);
            return false;
        }

        var stations = context.Database.GetCollection<SolarStation>(CollectionNames.SolarStations);
        var stationUpdate = Builders<SolarStation>.Update
            .Inc(s => s.BatteryStorageKwh, -actualEnergyTransferredKwh)
            .Set(s => s.UpdatedAtUtc, finalizedAtUtc);
        await stations.UpdateOneAsync(session, s => s.Id == stationId, stationUpdate, cancellationToken: cancellationToken);

        await session.CommitTransactionAsync(cancellationToken);
        return true;
    }
}
