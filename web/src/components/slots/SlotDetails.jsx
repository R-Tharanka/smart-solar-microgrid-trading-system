import EnergySummary from '../EnergySummary';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import SlotStatusBadge from './SlotStatusBadge';

// Displays slot schedule values in local time.
const formatUtcDateTime = (value) => new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
}).format(new Date(value));

export default function SlotDetails({ slot, onClose }) {
  if (!slot) return null;
  const fields = [['Station code', slot.stationCode], ['Price per kWh', `$${slot.pricePerKwh}`], ['Available energy', `${slot.availableEnergyKwh} kWh`], ['Start time', formatUtcDateTime(slot.startTimeUtc)], ['End time', formatUtcDateTime(slot.endTimeUtc)], ['Created', new Date(slot.createdAtUtc).toLocaleString()], ['Last updated', new Date(slot.updatedAtUtc).toLocaleString()]];
  return <Modal open title="Energy slot" description={slot.slotCode} onClose={onClose} size="max-w-xl"><div className="mb-5"><SlotStatusBadge status={slot.status} /></div><EnergySummary value={slot.availableEnergyKwh} label="Scheduled energy capacity"><span className="text-xs text-emerald-200/70">Station {slot.stationCode} · ${Number(slot.pricePerKwh).toFixed(2)} / kWh</span></EnergySummary><dl className="grid gap-5 border-y border-slate-200 py-5 sm:grid-cols-2">{fields.map(([label,value]) => <div key={label}><dt className="text-xs font-bold uppercase text-slate-500" style={{ letterSpacing: '0.06em' }}>{label}</dt><dd className="mt-1 break-words text-sm text-slate-700">{value}</dd></div>)}</dl><div className="mt-5 flex justify-end"><Button variant="secondary" onClick={onClose}>Close</Button></div></Modal>;
}
