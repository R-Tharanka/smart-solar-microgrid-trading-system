import Modal from '../ui/Modal';
import StatusBadge from '../ui/StatusBadge';

export default function ProsumerDetails({ prosumer, onClose }) {
  return (
    <Modal
      open={Boolean(prosumer)}
      onClose={onClose}
      title="Prosumer details"
      description={prosumer?.nic ? `NIC ${prosumer.nic}` : ''}
    >
      {prosumer ? (
        <div>
          <div className="mb-5 flex flex-wrap gap-2"><StatusBadge value={prosumer.role} /><StatusBadge value={prosumer.status} /></div>
          <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {prosumer.deactivationRequested ? <div className="sm:col-span-2 rounded-xl border border-orange-200 bg-orange-50 p-4"><dt><StatusBadge value="DeactivationRequested" /></dt><dd className="mt-2 text-sm text-slate-700">This account remains {prosumer.status.toLowerCase()} until Backoffice completes administrative deactivation.{prosumer.deactivationRequestedAtUtc && Number.isFinite(Date.parse(prosumer.deactivationRequestedAtUtc)) ? ` Requested ${new Date(prosumer.deactivationRequestedAtUtc).toLocaleString()}.` : ''}</dd></div> : null}
            {prosumer.rejectionReason ? <div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase text-slate-500">Registration review reason</dt><dd className="mt-1 break-words text-sm text-slate-900">{prosumer.rejectionReason}</dd></div> : null}
            <div><dt className="text-xs font-semibold uppercase text-slate-500">Full name</dt><dd className="mt-1 text-sm text-slate-900">{prosumer.firstName} {prosumer.lastName}</dd></div>
            <div><dt className="text-xs font-semibold uppercase text-slate-500">Email</dt><dd className="mt-1 break-all text-sm text-slate-900">{prosumer.email}</dd></div>
            <div><dt className="text-xs font-semibold uppercase text-slate-500">Phone number</dt><dd className="mt-1 text-sm text-slate-900">{prosumer.phoneNumber || 'Not provided'}</dd></div>
            <div><dt className="text-xs font-semibold uppercase text-slate-500">NIC</dt><dd className="mt-1 font-mono text-sm text-slate-900">{prosumer.nic}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase text-slate-500">Address</dt><dd className="mt-1 text-sm text-slate-900">{prosumer.address || 'Not provided'}</dd></div>
          </dl>
        </div>
      ) : null}
    </Modal>
  );
}
