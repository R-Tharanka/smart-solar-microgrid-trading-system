import StatusBadge from '../ui/StatusBadge';

export default function StationStatusBadge({ status }) {
  return <StatusBadge value={status || 'Unknown'} />;
}
