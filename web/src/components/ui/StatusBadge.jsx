import clsx from 'clsx';

const styles = {
  DeactivationRequested: 'border-orange-200 bg-orange-50 text-orange-800',
  Active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Deactivated: 'border-slate-300 bg-slate-100 text-slate-600',
  Pending: 'border-amber-200 bg-amber-50 text-amber-700',
  Backoffice: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  GridOperator: 'border-blue-200 bg-blue-50 text-blue-700',
  Prosumer: 'border-violet-200 bg-violet-50 text-violet-700',
  Maintenance: 'border-amber-200 bg-amber-50 text-amber-700',
  Available: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Reserved: 'border-violet-200 bg-violet-50 text-violet-700',
  Unavailable: 'border-slate-300 bg-slate-100 text-slate-600',
  FullyBooked: 'border-amber-200 bg-amber-50 text-amber-700',
  Approved: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  Rejected: 'border-red-200 bg-red-50 text-red-700',
  Cancelled: 'border-slate-300 bg-slate-100 text-slate-600',
  QrIssued: 'border-violet-200 bg-violet-50 text-violet-700',
  Verified: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Expired: 'border-amber-200 bg-amber-50 text-amber-700',
};

export default function StatusBadge({ value }) {
  return (
    <span className={clsx('energy-badge inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', styles[value] || 'border-slate-200 bg-white text-slate-600')}>
      {{ DeactivationRequested: 'Deactivation requested', QrIssued: 'QR issued', GridOperator: 'Grid operator', FullyBooked: 'Fully booked' }[value] || value}
    </span>
  );
}
