import StatusBadge from '../ui/StatusBadge';

export default function SlotStatusBadge({ status }) {
  return <StatusBadge value={status || 'Unknown'} />;
}
