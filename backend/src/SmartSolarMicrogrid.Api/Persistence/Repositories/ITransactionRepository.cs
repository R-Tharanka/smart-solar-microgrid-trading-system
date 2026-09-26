using MongoDB.Bson;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Persistence.Repositories;

public interface ITransactionRepository
{
    Task<EnergyReservation?> FindByIdAsync(string reservationId, CancellationToken cancellationToken = default);
    Task<EnergyReservation?> FindByCodeAsync(string reservationCode, CancellationToken cancellationToken = default);
    Task<bool> IssueQrAsync(string reservationId, string tokenHash, DateTime expiresAtUtc, DateTime changedAtUtc,
        CancellationToken cancellationToken = default);
    Task<bool> VerifyAsync(string reservationCode, string tokenHash, string operatorIdentifier, DateTime verifiedAtUtc,
        CancellationToken cancellationToken = default);
    Task<bool> FinalizeAsync(string reservationCode, ObjectId slotId, string operatorIdentifier,
        string confirmationNote, decimal actualEnergyTransferredKwh, DateTime finalizedAtUtc,
        CancellationToken cancellationToken = default);
}
