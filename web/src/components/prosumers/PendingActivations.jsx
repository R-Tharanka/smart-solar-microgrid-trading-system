import { useCallback, useEffect, useState } from 'react';
import { ArrowPathIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import ParticipantIdentity from '../ParticipantIdentity';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import Modal from '../ui/Modal';
import StatusBadge from '../ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../ui/PageState';
import { useToast } from '../../context/ToastContext';
import { activateProsumer, getPendingProsumers, rejectProsumer } from '../../services/identity';
import { firstValidationMessage, getApiError } from '../../utils/apiError';

export default function PendingActivations({ onResolved }) {
  const { notify } = useToast();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getPendingProsumers();
      setQueue(response.data.data);
    } catch (failure) {
      setError(getApiError(failure).message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const review = (prosumer) => {
    setSelected(prosumer);
    setDecision('');
    setReason('');
    setReasonError('');
    setActionError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (busy || !selected || !decision) return;
    if (decision === 'reject' && (reason.trim().length < 3 || reason.trim().length > 500)) {
      setReasonError('Enter a clear reason between 3 and 500 characters.');
      return;
    }
    setBusy(true);
    setActionError('');
    try {
      if (decision === 'activate') await activateProsumer(selected.nic);
      else await rejectProsumer(selected.nic, reason.trim());
      setQueue((current) => current.filter((item) => item.nic !== selected.nic));
      onResolved({ ...selected, status: decision === 'activate' ? 'Active' : 'Rejected', rejectionReason: decision === 'reject' ? reason.trim() : null });
      notify(decision === 'activate' ? `${selected.firstName}'s account is activated. Mobile sign-in is now available.` : 'Registration rejected. The Prosumer may resubmit through the mobile application.');
      setSelected(null);
    } catch (failure) {
      const feedback = getApiError(failure);
      setActionError(feedback.message);
      setReasonError(firstValidationMessage(feedback.validationErrors, 'Reason'));
      if ([404, 409].includes(feedback.status)) {
        setActionError('This registration may have changed. Close this review and refresh the queue before trying again.');
      }
    } finally { setBusy(false); }
  };

  const query = search.trim().toLowerCase();
  const visible = queue.filter((item) => [item.nic, item.email, item.firstName, item.lastName].some((value) => value?.toLowerCase().includes(query)));

  return (
    <section aria-label="Pending activation center">
      <div className="app-panel-muted mb-5 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <CheckBadgeIcon className="h-8 w-8 shrink-0 text-emerald-700" aria-hidden="true" />
          <div><p className="eyebrow">Network onboarding</p><h2 className="mt-1 text-xl font-semibold text-slate-900">Review. Activate. Connect.</h2><p className="mt-2 max-w-xl text-sm text-slate-600">Verify each participant’s details before enabling mobile access to the energy network.</p></div>
        </div>
        <div className="flex items-center gap-5"><div aria-live="polite"><strong className="block text-3xl font-semibold text-emerald-800">{loading || error ? '—' : queue.length}</strong><span className="text-xs text-slate-600">Awaiting review</span></div><Button variant="secondary" icon={ArrowPathIcon} disabled={loading || busy} onClick={load}>Refresh queue</Button></div>
      </div>
      {loading ? <LoadingState label="Loading pending registrations..." /> : error ? <ErrorState message={error} onRetry={load} /> : queue.length === 0 ? <div className="app-panel"><EmptyState title="All registrations are up to date" description="There are no pending activations. Refresh the queue when you are ready to review new participants." /></div> : (
        <>
          <FormField id="activation-search" className="mb-5 max-w-lg" label="Find a registration" type="search" placeholder="Name, NIC or email" value={search} onChange={(event) => setSearch(event.target.value)} />
          {!visible.length ? <EmptyState title="No matching registrations" description="Try another name, NIC or email." /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((item) => <article key={item.nic} className="app-panel min-w-0 border-t-2 border-t-amber-400 p-5">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registration review</span><StatusBadge value={item.status} /></div>
              <ParticipantIdentity firstName={item.firstName} lastName={item.lastName} detail={`NIC ${item.nic}`} />
              <p className="mt-4 break-all text-sm text-slate-700">{item.email}</p><p className="mt-1 text-sm text-slate-500">{item.phoneNumber || 'Phone not provided'}</p>
              <div className="mt-5 border-t border-slate-200 pt-4"><Button className="w-full" onClick={() => review(item)} aria-label={`Review registration for ${item.firstName} ${item.lastName}`}>Review registration</Button></div>
            </article>)}
          </div>}
        </>
      )}
      <Modal open={Boolean(selected)} onClose={() => { if (!busy) setSelected(null); }} title="Review Prosumer registration" description="Confirm participant details before granting access.">
        {selected ? <form onSubmit={submit} noValidate>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><ParticipantIdentity firstName={selected.firstName} lastName={selected.lastName} detail={selected.nic} /><StatusBadge value={selected.status} /></div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Email</dt><dd className="mt-1 break-all">{selected.email}</dd></div><div><dt className="text-slate-500">Phone</dt><dd className="mt-1">{selected.phoneNumber || 'Not provided'}</dd></div><div className="sm:col-span-2"><dt className="text-slate-500">Address</dt><dd className="mt-1 break-words">{selected.address || 'Not provided'}</dd></div>
          </dl>
          {actionError ? <Alert className="mt-5" title="Review not completed">{actionError}</Alert> : null}
          {decision === 'activate' ? <Alert type="info" className="mt-5" title="Activate this Prosumer?">Activating this account will allow the Prosumer to sign in through the mobile application.</Alert> : null}
          {decision === 'reject' ? <div className="mt-5"><FormField id="registration-reason" label="Rejection reason" as="textarea" required maxLength={500} value={reason} onChange={(event) => { setReason(event.target.value); setReasonError(''); }} error={reasonError} disabled={busy} hint="Required. Provide a respectful, useful explanation that the Prosumer can see. Do not include confidential information." /><p className="mt-3 text-sm text-slate-600">The account will remain unable to sign in. The Prosumer may correct their details and submit again.</p></div> : null}
          <div className="form-actions">
            {decision ? <><Button variant="secondary" disabled={busy} onClick={() => { setDecision(''); setActionError(''); }}>Back to review</Button><Button type="submit" variant={decision === 'reject' ? 'danger' : 'primary'} loading={busy}>{decision === 'reject' ? 'Confirm rejection' : 'Confirm activation'}</Button></> : <><Button variant="secondary" onClick={() => setSelected(null)}>Close</Button><Button variant="danger" onClick={() => setDecision('reject')}>Reject registration</Button><Button onClick={() => setDecision('activate')}>Activate Prosumer</Button></>}
          </div>
        </form> : null}
      </Modal>
    </section>
  );
}
