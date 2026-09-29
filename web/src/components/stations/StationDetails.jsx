import Button from '../ui/Button';
import Modal from '../ui/Modal';
import StationStatusBadge from './StationStatusBadge';

export default function StationDetails({ station, onClose }) {
  if (!station) return null;
  const fields = [
    ['Capacity', `${station.capacityKwh} kWh`], ['Battery storage', `${station.batteryStorageKwh} kWh`],
    ['Address', station.address], ['Coordinates', `${station.latitude}, ${station.longitude}`],
    ['Operating hours', `${station.openingTime} - ${station.closingTime}`], ['Description', station.description || 'No description provided.'],
    ['Created', new Date(station.createdAtUtc).toLocaleString()], ['Last updated', new Date(station.updatedAtUtc).toLocaleString()],
  ];
  return (
    <Modal open title={station.name} description={station.stationCode} onClose={onClose}>
      <div className="mb-5"><StationStatusBadge status={station.status} /></div>
      <dl className="grid gap-x-6 gap-y-5 border-y border-slate-200 py-5 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className={label === 'Address' || label === 'Description' ? 'sm:col-span-2' : ''}><dt className="text-xs font-bold uppercase text-slate-500" style={{ letterSpacing: '0.06em' }}>{label}</dt><dd className="mt-1 break-words text-sm leading-6 text-slate-700">{value}</dd></div>)}</dl>
      <div className="mt-5 flex justify-end"><Button variant="secondary" onClick={onClose}>Close</Button></div>
    </Modal>
  );
}
