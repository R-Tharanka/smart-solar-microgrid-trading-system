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
