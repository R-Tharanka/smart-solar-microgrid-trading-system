import { ExclamationCircleIcon, BoltIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import Button from './Button';

export function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-slate-500" role="status">
      <span className="energy-loader" aria-hidden="true"><BoltIcon className="h-5 w-5" /></span>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function FullPageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
      <LoadingState label="Restoring secure session..." />
    </div>
  );
}

export function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
      <span className="empty-network" aria-hidden="true"><Squares2X2Icon className="h-7 w-7" /></span>
      <h3 className="mt-3 text-base font-semibold text-slate-800">{title}</h3>
      {description ? <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p> : null}
      {onAction ? <Button className="mt-4" variant="secondary" onClick={onAction}>{actionLabel}</Button> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center" role="alert">
      <ExclamationCircleIcon className="h-10 w-10 text-red-500" aria-hidden="true" />
      <h3 className="mt-3 text-base font-semibold text-slate-800">Unable to load this view</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>
      {onRetry ? <Button className="mt-4" variant="secondary" onClick={onRetry}>Try again</Button> : null}
    </div>
  );
}
