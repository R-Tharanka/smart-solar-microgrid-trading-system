import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function Modal({ open, title, description, onClose, children, size = 'max-w-2xl' }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-graphite-950/75 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel transition className={`energy-dialog w-full ${size} max-h-[calc(100svh-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl duration-200 data-[closed]:translate-y-3 data-[closed]:opacity-0`}>
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-[#f1f5eb] px-5 py-5 sm:px-6">
              <div>
                <DialogTitle className="text-lg font-semibold text-slate-900">{title}</DialogTitle>
                {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
              </div>
              <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="Close dialog">
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="p-5 sm:p-6">{children}</div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
