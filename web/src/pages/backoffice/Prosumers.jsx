import ParticipantIdentity from '../../components/ParticipantIdentity';
import { useSearchParams } from 'react-router-dom';
import PendingActivations from '../../components/prosumers/PendingActivations';
import { ArrowPathIcon, EyeIcon, PencilSquareIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ProsumerDetails from '../../components/prosumers/ProsumerDetails';
import ProsumerForm from '../../components/prosumers/ProsumerForm';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FormField from '../../components/ui/FormField';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/PageState';
import StatusBadge from '../../components/ui/StatusBadge';
import { useToast } from '../../context/ToastContext';
import MainLayout from '../../layouts/MainLayout';
import apiClient from '../../services/api';
import { getApiError } from '../../utils/apiError';

export default function Prosumers() {
  const [params, setParams] = useSearchParams();
  const reviewing = params.get('view') === 'pending';
  const { notify } = useToast();
  const [prosumers, setProsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [formState, setFormState] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [statusFilter, setStatusFilter] = useState(() => params.get('status') === 'DeactivationRequested' ? 'DeactivationRequested' : 'All');
  const [search, setSearch] = useState('');

  const loadProsumers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/users');
      setProsumers(response.data.data.filter((account) => account.role === 'Prosumer'));
    } catch (requestError) {
      setError(getApiError(requestError, 'Prosumer accounts could not be loaded.').message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!reviewing) loadProsumers();
  }, [loadProsumers, reviewing]);

  const filteredProsumers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return prosumers.filter((prosumer) => {
      const matchesSearch = !query || [prosumer.nic, prosumer.firstName, prosumer.lastName, prosumer.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
      return matchesSearch && (statusFilter === 'All' || (statusFilter === 'DeactivationRequested' ? prosumer.deactivationRequested : prosumer.status === statusFilter));
    });
  }, [prosumers, search, statusFilter]);

  const saveProsumer = async (payload) => {
    const editing = formState?.mode === 'edit';
    const response = editing
      ? await apiClient.put(`/users/prosumers/${encodeURIComponent(formState.prosumer.nic)}`, payload)
      : await apiClient.post('/users/prosumers', payload);
    const saved = response.data.data;
    setProsumers((current) => editing
      ? current.map((prosumer) => prosumer.nic === saved.nic ? saved : prosumer)
      : [...current, saved].sort((a, b) => a.nic.localeCompare(b.nic)));
    setSelected((current) => current?.nic === saved.nic ? saved : current);
    setFormState(null);
    notify(`${saved.firstName} ${saved.lastName} was ${editing ? 'updated' : 'created'} successfully.`);
  };

  const changeStatus = async () => {
    if (!pendingStatus?.nic) return;
    const action = pendingStatus.status === 'Active' ? 'deactivate' : 'reactivate';
    setChangingStatus(true);
    try {
      await apiClient.post(`/users/${encodeURIComponent(pendingStatus.nic)}/${action}`);
      const nextStatus = action === 'deactivate' ? 'Deactivated' : 'Active';
      setProsumers((current) => current.map((prosumer) => (
        prosumer.nic === pendingStatus.nic ? { ...prosumer, status: nextStatus, deactivationRequested: false, deactivationRequestedAtUtc: null } : prosumer
      )));
      setSelected((current) => current?.nic === pendingStatus.nic ? { ...current, status: nextStatus, deactivationRequested: false, deactivationRequestedAtUtc: null } : current);
      notify(`${pendingStatus.firstName} ${pendingStatus.lastName} is now ${nextStatus.toLowerCase()}.`);
      setPendingStatus(null);
    } catch (requestError) {
      notify(getApiError(requestError, `The Prosumer could not be ${action}d.`).message, 'error');
    } finally {
      setChangingStatus(false);
    }
  };

  const accountAction = (prosumer) => prosumer.status === 'Pending'
    ? <Button variant="secondary" onClick={() => setParams({ view: 'pending' })}>Review activation</Button>
    : ['Active', 'Deactivated'].includes(prosumer.status)
      ? <Button variant="secondary" onClick={() => setPendingStatus(prosumer)}>{prosumer.status === 'Active' ? (prosumer.deactivationRequested ? 'Process request' : 'Deactivate') : 'Reactivate'}</Button>
      : null;

  return (
    <MainLayout title="Prosumer accounts">
      <PageHeader
        eyebrow="Network participants"
        title="Prosumer accounts"
        description="Manage the participants powering your energy network, from first registration to ongoing account access."
        actions={!reviewing ? <><Button variant="secondary" icon={ArrowPathIcon} onClick={loadProsumers} disabled={loading}>Refresh</Button><Button icon={PlusIcon} onClick={() => setFormState({ mode: 'create' })}>Create Prosumer</Button></> : null}
      />

      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Prosumer management views">
        <Button variant={reviewing ? 'secondary' : 'primary'} aria-current={!reviewing ? 'page' : undefined} onClick={() => setParams({})}>All accounts</Button>
        <Button variant={reviewing ? 'primary' : 'secondary'} aria-current={reviewing ? 'page' : undefined} onClick={() => setParams({ view: 'pending' })}>Pending activations{!reviewing && !loading && !error ? ` (${prosumers.filter((item) => item.status === 'Pending').length})` : ''}</Button>
      </nav>
      {reviewing ? <PendingActivations onResolved={(saved) => setProsumers((current) => current.some((item) => item.nic === saved.nic) ? current.map((item) => item.nic === saved.nic ? saved : item) : [...current, saved])} /> : <>
      <section className="app-panel-muted mb-5 grid gap-4 p-4 sm:grid-cols-2" aria-label="Prosumer filters">
        <FormField id="prosumer-search" label="Search" type="search" placeholder="NIC, name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        <FormField id="prosumer-status" label="Status" as="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Deactivated">Deactivated</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
          <option value="DeactivationRequested">Deactivation requested</option>
        </FormField>
      </section>

      <section className="app-table-wrap" aria-label="Prosumer account list">
        {loading ? <LoadingState label="Loading Prosumer accounts..." /> : null}
        {!loading && error ? <ErrorState message={error} onRetry={loadProsumers} /> : null}
        {!loading && !error && filteredProsumers.length === 0 ? <EmptyState title="No Prosumers found" description="No accounts match the current search and status filter." actionLabel="Create Prosumer" onAction={() => setFormState({ mode: 'create' })} /> : null}

        {!loading && !error && filteredProsumers.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="app-table">
                <thead><tr>{['Prosumer', 'NIC', 'Contact', 'Status', 'Actions'].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead>
                <tbody>
                  {filteredProsumers.map((prosumer) => (
                    <tr key={prosumer.nic} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-semibold text-slate-900"><ParticipantIdentity firstName={prosumer.firstName} lastName={prosumer.lastName} /></td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">{prosumer.nic}</td>
                      <td className="px-5 py-4"><p className="text-sm text-slate-900">{prosumer.email}</p><p className="text-xs text-slate-500">{prosumer.phoneNumber || 'No phone'}</p></td>
                      <td className="px-5 py-4"><div className="flex flex-wrap gap-2"><StatusBadge value={prosumer.status} />{prosumer.deactivationRequested ? <StatusBadge value="DeactivationRequested" /> : null}</div></td>
                      <td className="px-5 py-4"><div className="flex flex-wrap gap-2"><Button variant="ghost" icon={EyeIcon} onClick={() => setSelected(prosumer)}>View</Button><Button variant="ghost" icon={PencilSquareIcon} onClick={() => setFormState({ mode: 'edit', prosumer })}>Edit</Button>{accountAction(prosumer)}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-200 md:hidden">
              {filteredProsumers.map((prosumer) => (
                <article key={prosumer.nic} className="p-4">
                  <div className="flex items-start justify-between gap-3"><ParticipantIdentity firstName={prosumer.firstName} lastName={prosumer.lastName} detail={prosumer.nic} /><StatusBadge value={prosumer.status} /></div>
                  <p className="mt-3 break-all text-sm text-slate-600">{prosumer.email}</p>
                  {prosumer.deactivationRequested ? <div className="mt-2"><StatusBadge value="DeactivationRequested" /></div> : null}
                  <div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" icon={EyeIcon} onClick={() => setSelected(prosumer)}>View</Button><Button variant="secondary" icon={PencilSquareIcon} onClick={() => setFormState({ mode: 'edit', prosumer })}>Edit</Button>{accountAction(prosumer)}</div>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </section>
      </>}

      <ProsumerDetails prosumer={selected} onClose={() => setSelected(null)} />
      <Modal open={Boolean(formState)} onClose={() => setFormState(null)} title={formState?.mode === 'edit' ? 'Edit Prosumer account' : 'Create Prosumer account'} description={formState?.mode === 'edit' ? 'Update contact information. NIC, role, status and password remain unchanged.' : 'Create an active NIC-backed Prosumer account.'}>
        {formState ? <ProsumerForm key={formState.mode === 'edit' ? formState.prosumer.nic : 'create'} prosumer={formState.mode === 'edit' ? formState.prosumer : null} onSave={saveProsumer} onCancel={() => setFormState(null)} /> : null}
      </Modal>
      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title={`${pendingStatus?.status === 'Active' ? 'Deactivate' : 'Reactivate'} Prosumer account?`}
        description={pendingStatus?.status === 'Active'
          ? `${pendingStatus?.firstName} ${pendingStatus?.lastName} will lose platform access. Active reservations must be resolved before deactivation.`
          : `${pendingStatus?.firstName} ${pendingStatus?.lastName} will regain access and can sign in again.`}
        confirmLabel={pendingStatus?.status === 'Active' ? 'Deactivate Prosumer' : 'Reactivate Prosumer'}
        danger={pendingStatus?.status === 'Active'}
        loading={changingStatus}
        onConfirm={changeStatus}
        onClose={() => setPendingStatus(null)}
      />
    </MainLayout>
  );
}
