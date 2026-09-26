using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Persistence.Repositories;

public sealed class TransactionRepository(MongoDbContext context) : ITransactionRepository
{
    private readonly IMongoCollection<EnergyReservation> _reservations =
        context.Database.GetCollection<EnergyReservation>(CollectionNames.EnergyReservations);
    private readonly IMongoCollection<EnergyBookingSlot> _slots =
        context.Database.GetCollection<EnergyBookingSlot>(CollectionNames.EnergyBookingSlots);

    public async Task<EnergyReservation?> FindByIdAsync(string reservationId, CancellationToken cancellationToken = default)
    {
        if (!ObjectId.TryParse(reservationId, out var id)) return null;
        return await _reservations.Find(r => r.Id == id).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<EnergyReservation?> FindByCodeAsync(
        string reservationCode,
        CancellationToken cancellationToken = default) =>
        await _reservations.Find(r => r.ReservationCode == reservationCode).FirstOrDefaultAsync(cancellationToken);

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

    public async Task<bool> FinalizeAsync(string reservationCode, ObjectId slotId, string operatorIdentifier,
        string confirmationNote, decimal actualEnergyTransferredKwh, DateTime finalizedAtUtc,
        CancellationToken cancellationToken = default)
    {
        using var session = await context.Client.StartSessionAsync(cancellationToken: cancellationToken);
        session.StartTransaction();

        var reservationFilter = Builders<EnergyReservation>.Filter.Where(r =>
            r.ReservationCode == reservationCode && r.Status == ReservationStatus.Verified);
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

        var slotFilter = Builders<EnergyBookingSlot>.Filter.Where(slot =>
            slot.Id == slotId && slot.Status == SlotStatus.Reserved);
        var slotUpdate = Builders<EnergyBookingSlot>.Update
            .Set(slot => slot.Status, SlotStatus.Expired)
            .Set(slot => slot.UpdatedAtUtc, finalizedAtUtc);
        var slotResult = await _slots.UpdateOneAsync(
            session, slotFilter, slotUpdate, cancellationToken: cancellationToken);
        if (slotResult.ModifiedCount != 1)
        {
            await session.AbortTransactionAsync(cancellationToken);
            return false;
        }

        await session.CommitTransactionAsync(cancellationToken);
        return true;
    }
}
