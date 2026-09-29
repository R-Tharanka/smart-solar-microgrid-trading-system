import Button from '../ui/Button';
import Modal from '../ui/Modal';
import ReservationStatusBadge from '../reservations/ReservationStatusBadge';

const displayDate = (value) => value ? new Date(value).toLocaleString() : 'Not recorded';

export default function TransactionDetails({ transaction, loading, onClose }) {
  if (!transaction && !loading) return null;

  const fields = transaction ? [
    ['Prosumer NIC', transaction.prosumerNic],
    ['Station ID', transaction.stationId],
    ['Slot ID', transaction.slotId],
    ['Reserved energy', `${transaction.requestedEnergyKwh} kWh`],
    ['Actual energy transferred', transaction.actualEnergyTransferredKwh == null ? 'Not finalized' : `${transaction.actualEnergyTransferredKwh} kWh`],
    ['Scheduled start', displayDate(transaction.scheduledStartTimeUtc)],
    ['Scheduled end', displayDate(transaction.scheduledEndTimeUtc)],
    ['QR expires', displayDate(transaction.qrExpiresAtUtc)],
    ['Verified by', transaction.verifiedByIdentifier || 'Not verified'],
    ['Verified at', displayDate(transaction.verifiedAtUtc)],
    ['Finalized by', transaction.finalizedByIdentifier || 'Not finalized'],
    ['Finalized at', displayDate(transaction.finalizedAtUtc)],
  ] : [];

  return (
    <Modal
      open
      title="Transaction audit details"
      description={transaction?.reservationCode || 'Loading transaction record'}
      onClose={onClose}
      size="max-w-3xl"
    >
      {loading ? (
        <div className="py-12 text-center text-sm font-medium text-slate-500">Loading transaction details...</div>
      ) : (
        <>
          <div className="mb-5"><ReservationStatusBadge status={transaction.status} /></div>
          <dl className="grid gap-5 border-y border-slate-200 py-5 sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-bold uppercase text-slate-500">{label}</dt>
                <dd className="mt-1 break-all text-sm text-slate-700">{value}</dd>
              </div>
            ))}
          </dl>
          {transaction.confirmationNote ? (
            <div className="app-panel-muted mt-5 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Confirmation note</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{transaction.confirmationNote}</p>
            </div>
          ) : null}
        </>
      )}
      <div className="mt-5 flex justify-end"><Button variant="secondary" onClick={onClose}>Close</Button></div>
    </Modal>
  );
}
