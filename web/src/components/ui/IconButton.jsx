import clsx from 'clsx';

export default function IconButton({ icon: Icon, label, className, ...props }) {
  return (
    <button type="button" className={clsx('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[9px] border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50', className)} aria-label={label} title={label} {...props}>
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
