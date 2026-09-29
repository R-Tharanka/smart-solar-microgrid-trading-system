import clsx from 'clsx';

const variants = {
  primary: 'border-emerald-500 bg-emerald-500 text-graphite-950 hover:border-emerald-400 hover:bg-emerald-400 focus-visible:ring-emerald-500',
  secondary: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-emerald-500',
  danger: 'border-red-600 bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  ghost: 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-emerald-500',
};

export default function Button({
  children,
  className,
  icon: Icon,
  variant = 'primary',
  loading = false,
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-bold shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 disabled:active:translate-y-0',
        variants[variant],
        'energy-button',
        `energy-button-${variant}`,
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="h-4 w-4" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}
