import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import CreateStaffForm from '../../components/staff/CreateStaffForm';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FormField from '../../components/ui/FormField';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/PageState';
import StatusBadge from '../../components/ui/StatusBadge';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import MainLayout from '../../layouts/MainLayout';
import apiClient from '../../services/api';
import { getApiError } from '../../utils/apiError';

function StaffActions({ account, isCurrentUser, onStatusChange, busy }) {
  const activate = account.status === 'Deactivated';
  return (
    <Button
      variant={activate ? 'secondary' : 'ghost'}
      onClick={() => onStatusChange(account)}
      disabled={busy || isCurrentUser || !['Active', 'Deactivated'].includes(account.status)}
      title={isCurrentUser ? 'Use another Backoffice account to change your own status.' : undefined}
    >
      {activate ? 'Reactivate' : 'Deactivate'}
    </Button>
  );
}

export default function Staff() {
  const { user } = useContext(AuthContext);
  const { notify } = useToast();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [busyEmail, setBusyEmail] = useState('');

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/users');
      setStaff(response.data.data.filter((account) => account.role !== 'Prosumer'));
    } catch (requestError) {
      setError(getApiError(requestError, 'Staff accounts could not be loaded.').message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();
    return staff.filter((account) => {
      const matchesSearch = !query || [account.firstName, account.lastName, account.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
      return matchesSearch
        && (roleFilter === 'All' || account.role === roleFilter)
        && (statusFilter === 'All' || account.status === statusFilter);
    });
  }, [roleFilter, search, staff, statusFilter]);

  const createStaff = async (payload) => {
    const response = await apiClient.post('/users/staff', payload);
    const created = response.data.data;
    setStaff((current) => [...current, created].sort((a, b) => a.email.localeCompare(b.email)));
    setCreateOpen(false);
    notify(`${created.firstName} ${created.lastName} was created as ${created.role}.`);
  };

  const changeStatus = async () => {
    if (!pendingStatus) return;
    const action = pendingStatus.status === 'Active' ? 'deactivate' : 'reactivate';
    setBusyEmail(pendingStatus.email);
    try {
      await apiClient.post(`/users/${encodeURIComponent(pendingStatus.email)}/${action}`);
      const nextStatus = action === 'deactivate' ? 'Deactivated' : 'Active';
      setStaff((current) => current.map((account) => (
        account.email === pendingStatus.email ? { ...account, status: nextStatus } : account
      )));
      notify(`${pendingStatus.email} is now ${nextStatus.toLowerCase()}.`);
      setPendingStatus(null);
    } catch (requestError) {
      notify(getApiError(requestError, `The account could not be ${action}d.`).message, 'error');
    } finally {
      setBusyEmail('');
    }
  };

  return (
    <MainLayout title="Staff accounts">
      <PageHeader
        eyebrow="Identity administration"
        title="Staff accounts"
        description="Create and manage Backoffice and Grid Operator access. Authorization rules are enforced by the central API."
        actions={(
          <>
            <Button variant="secondary" icon={ArrowPathIcon} onClick={loadStaff} disabled={loading}>Refresh</Button>
            <Button icon={PlusIcon} onClick={() => setCreateOpen(true)}>Create staff</Button>
          </>
        )}
      />

      <section className="mb-5 grid gap-3 border-b border-slate-200 pb-5 sm:grid-cols-3" aria-label="Staff filters">
        <FormField id="staff-search" label="Search" type="search" placeholder="Name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        <FormField id="staff-role-filter" label="Role" as="select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="All">All staff roles</option>
          <option value="Backoffice">Backoffice</option>
          <option value="GridOperator">Grid Operator</option>
        </FormField>
        <FormField id="staff-status-filter" label="Status" as="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Deactivated">Deactivated</option>
        </FormField>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white" aria-label="Staff account list">
        {loading ? <LoadingState label="Loading staff accounts..." /> : null}
        {!loading && error ? <ErrorState message={error} onRetry={loadStaff} /> : null}
        {!loading && !error && filteredStaff.length === 0 ? (
          <EmptyState title="No staff accounts found" description="Change the filters or create a staff account." actionLabel="Create staff" onAction={() => setCreateOpen(true)} />
        ) : null}

        {!loading && !error && filteredStaff.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {['Staff member', 'Role', 'Status', 'Account', 'Actions'].map((heading) => <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((account) => {
                    const isCurrent = account.email === user.email;
                    return (
                      <tr key={account.email} className="hover:bg-slate-50">
                        <td className="px-5 py-4"><p className="font-semibold text-slate-900">{account.firstName} {account.lastName}</p><p className="text-sm text-slate-500">{account.email}</p></td>
                        <td className="px-5 py-4"><StatusBadge value={account.role} /></td>
                        <td className="px-5 py-4"><StatusBadge value={account.status} /></td>
                        <td className="px-5 py-4 text-sm text-slate-500">{isCurrent ? 'Current account' : 'Staff'}</td>
                        <td className="px-5 py-4"><StaffActions account={account} isCurrentUser={isCurrent} onStatusChange={setPendingStatus} busy={busyEmail === account.email} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-200 md:hidden">
              {filteredStaff.map((account) => {
                const isCurrent = account.email === user.email;
                return (
                  <article key={account.email} className="p-4">
                    <p className="font-semibold text-slate-900">{account.firstName} {account.lastName}</p>
                    <p className="break-all text-sm text-slate-500">{account.email}</p>
                    <div className="my-3 flex flex-wrap gap-2"><StatusBadge value={account.role} /><StatusBadge value={account.status} /></div>
                    <StaffActions account={account} isCurrentUser={isCurrent} onStatusChange={setPendingStatus} busy={busyEmail === account.email} />
                  </article>
                );
              })}
            </div>
          </>
        ) : null}
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create staff account" description="Issue access for an authorized Backoffice or Grid Operator user.">
        <CreateStaffForm onCreate={createStaff} onCancel={() => setCreateOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title={`${pendingStatus?.status === 'Active' ? 'Deactivate' : 'Reactivate'} staff account?`}
        description={pendingStatus?.status === 'Active'
          ? `${pendingStatus?.email} will immediately lose access, including with an existing token.`
          : `${pendingStatus?.email} will regain access and can sign in again.`}
        confirmLabel={pendingStatus?.status === 'Active' ? 'Deactivate account' : 'Reactivate account'}
        danger={pendingStatus?.status === 'Active'}
        loading={Boolean(busyEmail)}
        onConfirm={changeStatus}
        onClose={() => setPendingStatus(null)}
      />
    </MainLayout>
  );
}
