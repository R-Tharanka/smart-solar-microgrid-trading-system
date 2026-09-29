import StatusBadge from '../ui/StatusBadge';

export default function ReservationStatusBadge({ status }) {
  return <StatusBadge value={status || 'Unknown'} />;
}
