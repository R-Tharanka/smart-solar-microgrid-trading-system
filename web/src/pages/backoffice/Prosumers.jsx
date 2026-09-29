import { ArrowPathIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ProsumerDetails from '../../components/prosumers/ProsumerDetails';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FormField from '../../components/ui/FormField';
import PageHeader from '../../components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/PageState';
import StatusBadge from '../../components/ui/StatusBadge';
import { useToast } from '../../context/ToastContext';
import MainLayout from '../../layouts/MainLayout';
import apiClient from '../../services/api';
import { getApiError } from '../../utils/apiError';

export default function Prosumers() {
  const { notify } = useToast();
  const [prosumers, setProsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
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
    loadProsumers();
  }, [loadProsumers]);

  const filteredProsumers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return prosumers.filter((prosumer) => {
      const matchesSearch = !query || [prosumer.nic, prosumer.firstName, prosumer.lastName, prosumer.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
      return matchesSearch && (statusFilter === 'All' || prosumer.status === statusFilter);
    });
  }, [prosumers, search, statusFilter]);

  const changeStatus = async () => {
    if (!pendingStatus?.nic) return;
    const action = pendingStatus.status === 'Active' ? 'deactivate' : 'reactivate';
    setChangingStatus(true);
    try {
      await apiClient.post(`/users/${encodeURIComponent(pendingStatus.nic)}/${action}`);
      const nextStatus = action === 'deactivate' ? 'Deactivated' : 'Active';
      setProsumers((current) => current.map((prosumer) => (
        prosumer.nic === pendingStatus.nic ? { ...prosumer, status: nextStatus } : prosumer
      )));
      setSelected((current) => current?.nic === pendingStatus.nic ? { ...current, status: nextStatus } : current);
      notify(`${pendingStatus.firstName} ${pendingStatus.lastName} is now ${nextStatus.toLowerCase()}.`);
      setPendingStatus(null);
    } catch (requestError) {
      notify(getApiError(requestError, `The Prosumer could not be ${action}d.`).message, 'error');
    } finally {
      setChangingStatus(false);
    }
  };

  return (
    <MainLayout title="Prosumer accounts">
      <PageHeader
        eyebrow="Identity administration"
        title="Prosumer accounts"
        description="Review NIC-backed Prosumer profiles and manage account access without exposing internal database identifiers."
        actions={<Button variant="secondary" icon={ArrowPathIcon} onClick={loadProsumers} disabled={loading}>Refresh</Button>}
      />

      <section className="mb-5 grid gap-3 border-b border-slate-200 pb-5 sm:grid-cols-2" aria-label="Prosumer filters">
        <FormField id="prosumer-search" label="Search" type="search" placeholder="NIC, name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        <FormField id="prosumer-status" label="Status" as="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Deactivated">Deactivated</option>
          <option value="Pending">Pending</option>
        </FormField>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white" aria-label="Prosumer account list">
        {loading ? <LoadingState label="Loading Prosumer accounts..." /> : null}
        {!loading && error ? <ErrorState message={error} onRetry={loadProsumers} /> : null}
        {!loading && !error && filteredProsumers.length === 0 ? <EmptyState title="No Prosumers found" description="No accounts match the current search and status filter." /> : null}

        {!loading && !error && filteredProsumers.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50"><tr>{['Prosumer', 'NIC', 'Contact', 'Status', 'Actions'].map((heading) => <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">{heading}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProsumers.map((prosumer) => (
                    <tr key={prosumer.nic} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-semibold text-slate-900">{prosumer.firstName} {prosumer.lastName}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">{prosumer.nic}</td>
                      <td className="px-5 py-4"><p className="text-sm text-slate-900">{prosumer.email}</p><p className="text-xs text-slate-500">{prosumer.phoneNumber || 'No phone'}</p></td>
                      <td className="px-5 py-4"><StatusBadge value={prosumer.status} /></td>
                      <td className="px-5 py-4"><div className="flex gap-2"><Button variant="ghost" icon={EyeIcon} onClick={() => setSelected(prosumer)}>View</Button><Button variant={prosumer.status === 'Active' ? 'ghost' : 'secondary'} onClick={() => setPendingStatus(prosumer)} disabled={!['Active', 'Deactivated'].includes(prosumer.status)}>{prosumer.status === 'Active' ? 'Deactivate' : 'Reactivate'}</Button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-200 md:hidden">
              {filteredProsumers.map((prosumer) => (
                <article key={prosumer.nic} className="p-4">
                  <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{prosumer.firstName} {prosumer.lastName}</p><p className="font-mono text-xs text-slate-500">{prosumer.nic}</p></div><StatusBadge value={prosumer.status} /></div>
                  <p className="mt-3 break-all text-sm text-slate-600">{prosumer.email}</p>
                  <div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" icon={EyeIcon} onClick={() => setSelected(prosumer)}>View</Button><Button variant={prosumer.status === 'Active' ? 'danger' : 'secondary'} onClick={() => setPendingStatus(prosumer)} disabled={!['Active', 'Deactivated'].includes(prosumer.status)}>{prosumer.status === 'Active' ? 'Deactivate' : 'Reactivate'}</Button></div>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </section>

      <ProsumerDetails prosumer={selected} onClose={() => setSelected(null)} />
      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title={`${pendingStatus?.status === 'Active' ? 'Deactivate' : 'Reactivate'} Prosumer account?`}
        description={pendingStatus?.status === 'Active'
          ? `${pendingStatus?.firstName} ${pendingStatus?.lastName} will immediately lose protected API access. The API will block this action if active reservations exist.`
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
