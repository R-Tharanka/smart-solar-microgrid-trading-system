import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowPathIcon, BoltIcon, CalendarDaysIcon, CheckCircleIcon, ClockIcon, MapPinIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import OperationsHero from '../../components/OperationsHero';
import MainLayout from '../../layouts/MainLayout';
import apiClient from '../../services/api';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import { LoadingState } from '../../components/ui/PageState';
import { MetricCard, Panel, SectionHeader } from '../../components/ui/Surface';

export default function GridOperatorDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true); setError('');
      const response = await apiClient.get('/dashboard/summary');
      setStats(response.data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Operational information is temporarily unavailable.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, []);

  const workspaces = [
    ['/grid-operator/stations', MapPinIcon, 'Microgrid nodes', 'Review station capacity and status'],
    ['/grid-operator/slots', BoltIcon, 'Energy slots', 'Inspect current energy availability'],
    ['/grid-operator/reservations', CalendarDaysIcon, 'Reservations', 'Track booking progress and details'],
    ['/grid-operator/transactions', QrCodeIcon, 'Transactions', 'Verify exchanges and complete transfers'],
  ];

  return (
    <MainLayout title="Grid operations overview">
      <PageHeader eyebrow="Operations" title="Grid operations" description="Monitor reservation activity and open the operational tools assigned to your role." actions={<Button variant="secondary" icon={ArrowPathIcon} onClick={fetchStats} loading={loading}>Refresh</Button>} />
      <OperationsHero title="Keep energy moving. Every step connected." description="Review station availability, follow approved reservations and guide verified energy transfers through to completion." to="/grid-operator/transactions" action="Open transfer operations" />
      {error ? <Alert title="Unable to refresh dashboard" className="mb-6">{error}</Alert> : null}
      {loading ? <Panel><LoadingState label="Loading grid metrics..." /></Panel> : stats ? <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Total reservations" value={stats.totalCount} icon={CalendarDaysIcon} tone="cyan" /><MetricCard label="Pending approval" value={stats.pendingCount} icon={ClockIcon} tone="amber" /><MetricCard label="Approved bookings" value={stats.approvedCount} icon={CheckCircleIcon} /><MetricCard label="Completed" value={stats.completedCount} icon={BoltIcon} tone="cyan" /></div> : null}
      <Panel className="p-5 sm:p-6"><SectionHeader title="Operational workspaces" description="The tools that keep your energy network coordinated." /><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{workspaces.map(([path, Icon, title, description]) => <Link key={path} to={path} className="group flex min-h-28 items-start gap-4 rounded-md border border-slate-200 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/50"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-900 text-cyan-300"><Icon className="h-5 w-5" /></span><span><span className="font-bold text-slate-900 group-hover:text-cyan-800">{title}</span><span className="mt-1 block text-sm leading-5 text-slate-500">{description}</span></span></Link>)}</div></Panel>
    </MainLayout>
  );
}
