export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
