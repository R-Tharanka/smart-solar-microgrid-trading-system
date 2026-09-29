import clsx from 'clsx';

const styles = {
  Active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Deactivated: 'border-slate-300 bg-slate-100 text-slate-600',
  Pending: 'border-amber-200 bg-amber-50 text-amber-700',
  Backoffice: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  GridOperator: 'border-blue-200 bg-blue-50 text-blue-700',
  Prosumer: 'border-violet-200 bg-violet-50 text-violet-700',
};

export default function StatusBadge({ value }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', styles[value] || 'border-slate-200 bg-white text-slate-600')}>
      {value}
    </span>
  );
}
