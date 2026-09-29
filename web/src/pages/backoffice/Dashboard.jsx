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

  const fetchStats = async () => {
    try {
      setLoading(true); setError('');
      const response = await apiClient.get('/dashboard/summary');
      setStats(response.data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Dashboard information is temporarily unavailable.');
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
      <Panel className="p-5 sm:p-6">
        <SectionHeader title="Network workspaces" description="Move directly to a focused management area." />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {actions.map(([path, Icon, title, description], index) => <Link key={path} to={path} className="workspace-link-card group"><span className="workspace-link-index">0{index + 1}</span><span className="workspace-link-icon"><Icon className="h-5 w-5" /></span><span><strong>{title}</strong><small>{description}</small></span></Link>)}
        </div>
      </Panel>
    </MainLayout>
  );
}
