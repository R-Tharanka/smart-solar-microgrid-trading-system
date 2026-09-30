import clsx from 'clsx';

export default function BrandMark({ className, label = true, inverse = false }) {
  return (
    <div className={clsx('inline-flex items-center gap-3', className)}>
      <img
        src="/assets/logo.png"
        alt=""
        aria-hidden="true"
        className="h-10 w-10 shrink-0 object-contain"
      />
      {label ? (
        <span className="min-w-0 leading-tight">
          <span className={clsx('block text-sm font-bold', inverse ? 'text-white' : 'text-slate-950')}>Smart Solar</span>
          <span className={clsx('block text-xs font-semibold', inverse ? 'text-emerald-300' : 'text-emerald-700')}>Microgrid</span>
        </span>
      ) : null}
    </div>
  );
}
