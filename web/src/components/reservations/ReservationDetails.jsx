import EnergySummary from '../EnergySummary';
import OperationProgress from '../OperationProgress';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import ReservationStatusBadge from './ReservationStatusBadge';

export default function ReservationDetails({ reservation, onClose }) {
  if (!reservation) return null;
  const fields = [['Prosumer NIC', reservation.prosumerNic], ['Requested energy', `${reservation.requestedEnergyKwh} kWh`], ['Station ID', reservation.stationId], ['Slot ID', reservation.slotId], ['Scheduled start (UTC)', new Date(reservation.scheduledStartTimeUtc).toLocaleString()], ['Scheduled end (UTC)', new Date(reservation.scheduledEndTimeUtc).toLocaleString()], ['Created', new Date(reservation.createdAtUtc).toLocaleString()], ['Last updated', new Date(reservation.updatedAtUtc).toLocaleString()]];
  return <Modal open title="Reservation details" description={reservation.reservationCode} onClose={onClose}><div className="mb-5"><ReservationStatusBadge status={reservation.status} /></div><OperationProgress status={reservation.status} /><EnergySummary value={reservation.requestedEnergyKwh} label="Reserved energy" /><dl className="grid gap-5 border-y border-slate-200 py-5 sm:grid-cols-2">{fields.map(([label,value]) => <div key={label}><dt className="text-xs font-bold uppercase text-slate-500" style={{ letterSpacing: '0.06em' }}>{label}</dt><dd className="mt-1 break-all text-sm text-slate-700">{value}</dd></div>)}</dl>{reservation.confirmationNote ? <div className="app-panel-muted mt-5 p-4"><p className="text-xs font-bold uppercase text-slate-500">Note or reason</p><p className="mt-2 text-sm leading-6 text-slate-700">{reservation.confirmationNote}</p></div> : null}<div className="mt-5 flex justify-end"><Button variant="secondary" onClick={onClose}>Close</Button></div></Modal>;
}
