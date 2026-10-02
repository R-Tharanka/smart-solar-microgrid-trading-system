import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowPathIcon, CalendarDaysIcon, CheckCircleIcon, ClockIcon, MapPinIcon, NoSymbolIcon, UserGroupIcon, XCircleIcon } from '@heroicons/react/24/outline';
import OperationsHero from '../../components/OperationsHero';
import MainLayout from '../../layouts/MainLayout';
import apiClient from '../../services/api';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import { LoadingState } from '../../components/ui/PageState';
import { MetricCard, Panel, SectionHeader } from '../../components/ui/Surface';
import { getApiError } from '../../utils/apiError';

const actions = [
  ['/backoffice/staff', UserGroupIcon, 'Staff accounts', 'Create and manage staff access'],
  ['/backoffice/reservations', CalendarDaysIcon, 'Reservations', 'Review energy booking requests'],
  ['/backoffice/prosumers', UserGroupIcon, 'Prosumers', 'Monitor customer account status'],
  ['/backoffice/stations', MapPinIcon, 'Microgrid nodes', 'Manage station availability'],
];

export default function BackofficeDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deactivationRequests, setDeactivationRequests] = useState([]);
  const [requestError, setRequestError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true); setError(''); setRequestError('');
      const [summary, users] = await Promise.allSettled([
        apiClient.get('/dashboard/summary'),
        apiClient.get('/users'),
      ]);
      if (summary.status === 'fulfilled') setStats(summary.value.data.data);
      else setError(getApiError(summary.reason, 'Dashboard information is temporarily unavailable.').message);
      if (users.status === 'fulfilled') {
        setDeactivationRequests(users.value.data.data.filter((account) =>
          account.role === 'Prosumer' && account.status === 'Active' && account.deactivationRequested));
      } else {
        setRequestError(getApiError(users.reason, 'Deactivation requests could not be loaded.').message);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <MainLayout title="Backoffice overview">
      <PageHeader eyebrow="Administration" title="Operational overview" description="Reservation activity and direct access to core microgrid administration." actions={<Button variant="secondary" icon={ArrowPathIcon} onClick={fetchStats} loading={loading}>Refresh</Button>} />
      <OperationsHero title="A clearer view of your energy network." description="Connect the people, infrastructure and reservations behind every energy exchange. Your network, coordinated from one place." to="/backoffice/stations" action="Explore your stations" />
      {error ? <Alert title="Unable to refresh dashboard" className="mb-6">{error}</Alert> : null}
      {loading ? <Panel><LoadingState label="Loading operational metrics..." /></Panel> : stats ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="Total reservations" value={stats.totalCount} icon={CalendarDaysIcon} tone="cyan" />
          <MetricCard label="Pending" value={stats.pendingCount} icon={ClockIcon} tone="amber" />
          <MetricCard label="Approved" value={stats.approvedCount} icon={CheckCircleIcon} />
          <MetricCard label="Completed" value={stats.completedCount} icon={CheckCircleIcon} tone="cyan" />
          <MetricCard label="Cancelled" value={stats.cancelledCount} icon={NoSymbolIcon} tone="slate" />
          <MetricCard label="Rejected" value={stats.rejectedCount} icon={XCircleIcon} tone="red" />
        </div>
      ) : null}
      <Panel className="mb-6 border-l-4 border-l-amber-400 p-5 sm:p-6">
        <SectionHeader
          title="Prosumer deactivation requests"
          description="Requests awaiting Backoffice review. These accounts remain active until you complete administrative deactivation."
          action={<Link to="/backoffice/prosumers?status=DeactivationRequested" className="text-sm font-semibold text-emerald-700 underline underline-offset-4 hover:text-emerald-900">Review in Prosumer accounts</Link>}
        />
        {loading ? <p className="mt-4 text-sm text-slate-500" role="status">Loading account requests...</p>
          : requestError ? <Alert className="mt-4" title="Requests unavailable">{requestError}</Alert>
            : <div className="mt-5 border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-600"><strong className="mr-2 text-2xl text-slate-900">{deactivationRequests.length}</strong>{deactivationRequests.length === 1 ? 'request' : 'requests'} awaiting review</p>
              {deactivationRequests.length === 0 ? <p className="mt-2 text-sm text-slate-500">No Prosumer deactivation requests need attention.</p> : <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {deactivationRequests.slice(0, 3).map((account) => <li key={account.nic} className="min-w-0 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                  <p className="truncate text-sm font-semibold text-slate-900">{account.firstName} {account.lastName}</p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-600">{account.nic}</p>
                  {account.deactivationRequestedAtUtc && Number.isFinite(Date.parse(account.deactivationRequestedAtUtc)) ? <p className="mt-2 text-xs text-slate-500">Requested {new Date(account.deactivationRequestedAtUtc).toLocaleString()}</p> : null}
                </li>)}
              </ul>}
            </div>}
      </Panel>
      <Panel className="p-5 sm:p-6">
        <SectionHeader title="Network workspaces" description="Move directly to a focused management area." />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {actions.map(([path, Icon, title, description], index) => <Link key={path} to={path} className="workspace-link-card group"><span className="workspace-link-index">0{index + 1}</span><span className="workspace-link-icon"><Icon className="h-5 w-5" /></span><span><strong>{title}</strong><small>{description}</small></span></Link>)}
        </div>
      </Panel>
    </MainLayout>
  );
}
