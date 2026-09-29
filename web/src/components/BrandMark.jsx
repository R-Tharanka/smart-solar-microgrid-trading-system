import clsx from 'clsx';

export default function BrandMark({ className, label = true, inverse = false }) {
  return (
    <div className={clsx('inline-flex items-center gap-3', className)}>
      <svg viewBox="0 0 48 48" className="h-10 w-10 shrink-0" aria-hidden="true">
        <defs>
          <linearGradient id="brand-energy" x1="8" y1="7" x2="40" y2="41" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6ee7b7" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <path d="M24 3.5 41.75 13.75v20.5L24 44.5 6.25 34.25v-20.5L24 3.5Z" fill="#07110f" stroke="url(#brand-energy)" strokeWidth="1.5" />
        <circle cx="24" cy="16" r="5" fill="#fbbf24" />
        <path d="M14 27h20M17.5 33h13M19 27l2.5 10M29 27l-2.5 10" stroke="url(#brand-energy)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="14" cy="27" r="2" fill="#34d399" />
        <circle cx="34" cy="27" r="2" fill="#22d3ee" />
        <circle cx="24" cy="38" r="2" fill="#6ee7b7" />
      </svg>
      {label ? (
        <span className="min-w-0 leading-tight">
          <span className={clsx('block text-sm font-bold', inverse ? 'text-white' : 'text-slate-950')}>Smart Solar</span>
          <span className={clsx('block text-xs font-semibold', inverse ? 'text-emerald-300' : 'text-emerald-700')}>Microgrid</span>
        </span>
      ) : null}
    </div>
  );
}
