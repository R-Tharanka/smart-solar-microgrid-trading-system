import clsx from 'clsx';

export default function FormField({
  id,
  label,
  error,
  hint,
  as = 'input',
  className,
  children,
  ...props
}) {
  const Component = as;
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-xs font-semibold text-slate-700">
        {label}
      </label>
      {as === 'select' ? (
        <select
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={clsx(
            'app-control',
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-100',
          )}
          {...props}
        >
          {children}
        </select>
      ) : (
        <Component
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={clsx(
            'app-control',
            as === 'textarea' && 'min-h-24 resize-y',
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-100',
          )}
          {...props}
        />
      )}
      {error ? <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600">{error}</p> : null}
      {!error && hint ? <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
