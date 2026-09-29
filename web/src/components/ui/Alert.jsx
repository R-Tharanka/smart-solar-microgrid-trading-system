import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const styles = {
  error: ['border-red-200 bg-red-50 text-red-900', ExclamationTriangleIcon],
  success: ['border-emerald-200 bg-emerald-50 text-emerald-900', CheckCircleIcon],
  info: ['border-cyan-200 bg-cyan-50 text-cyan-900', InformationCircleIcon],
};

export default function Alert({ children, title, type = 'error', className }) {
  const [style, Icon] = styles[type];
  return (
    <div className={clsx('flex gap-3 rounded-md border p-4', style, className)} role={type === 'error' ? 'alert' : 'status'}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title ? <p className="text-sm font-semibold">{title}</p> : null}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}
