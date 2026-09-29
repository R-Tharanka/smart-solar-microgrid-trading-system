import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from './Button';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  loading = false,
  danger = true,
  onConfirm,
  onClose,
}) {
  return (
    <Dialog open={open} onClose={loading ? () => {} : onClose} className="relative z-50">
      <div className="fixed inset-0 bg-slate-950/60" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className={`rounded-full p-2 ${danger ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
              <ExclamationTriangleIcon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold text-slate-900">{title}</DialogTitle>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
