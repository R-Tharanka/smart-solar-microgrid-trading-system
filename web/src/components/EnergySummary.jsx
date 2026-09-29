import { BoltIcon } from '@heroicons/react/24/outline';

export default function EnergySummary({ value, label, children }) {
  return <section className="energy-summary"><div><p>{label}</p><strong>{value ?? '—'} <small>kWh</small></strong>{children}</div><BoltIcon className="h-10 w-10" aria-hidden="true" /></section>;
}
