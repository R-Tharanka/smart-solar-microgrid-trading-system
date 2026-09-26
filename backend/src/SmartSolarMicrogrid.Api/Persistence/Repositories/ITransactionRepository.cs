using MongoDB.Bson;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Persistence.Repositories;

public interface ITransactionRepository
{
    /// <summary>Finds a reservation transaction by its MongoDB ObjectId string.</summary>
    Task<EnergyReservation?> FindByIdAsync(string reservationId, CancellationToken cancellationToken = default);

    /// <summary>Finds a reservation transaction by its normalized public reservation code.</summary>
    Task<EnergyReservation?> FindByCodeAsync(string reservationCode, CancellationToken cancellationToken = default);

    /// <summary>Atomically stores a QR hash and transitions Approved to QrIssued.</summary>
    Task<bool> IssueQrAsync(string reservationId, string tokenHash, DateTime expiresAtUtc, DateTime changedAtUtc,
        CancellationToken cancellationToken = default);

    /// <summary>Atomically validates the expected QR state and transitions QrIssued to Verified.</summary>
    Task<bool> VerifyAsync(string reservationCode, string tokenHash, string operatorIdentifier, DateTime verifiedAtUtc,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Completes the reservation and expires its consumed slot in one MongoDB transaction.
    /// </summary>
    Task<bool> FinalizeAsync(string reservationCode, ObjectId slotId, string operatorIdentifier,
        string confirmationNote, decimal actualEnergyTransferredKwh, DateTime finalizedAtUtc,
        CancellationToken cancellationToken = default);
}
