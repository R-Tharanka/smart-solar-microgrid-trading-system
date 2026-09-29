import clsx from 'clsx';

export function Panel({ as: Component = 'section', className, children, ...props }) {
  return <Component className={clsx('app-panel', className)} {...props}>{children}</Component>;
}

export function SectionHeader({ title, description, action, className }) {
  return (
    <div className={clsx('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div><h2 className="text-lg font-bold text-slate-950">{title}</h2>{description ? <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p> : null}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function MetricCard({ label, value, icon: Icon, tone = 'emerald' }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <article className="app-panel flex min-h-32 items-start justify-between p-5">
      <div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold tabular-nums text-slate-950">{value}</p></div>
      {Icon ? <span className={`flex h-10 w-10 items-center justify-center rounded-md border ${tones[tone] || tones.emerald}`}><Icon className="h-5 w-5" /></span> : null}
    </article>
  );
}
