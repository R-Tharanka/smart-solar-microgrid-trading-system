import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import apiClient from '../../services/api';
import StationStatusBadge from '../../components/stations/StationStatusBadge';
import StationForm from '../../components/stations/StationForm';
import StationDetails from '../../components/stations/StationDetails';
import { AuthContext } from '../../context/AuthContext';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import { EmptyState, LoadingState } from '../../components/ui/PageState';
import { useToast } from '../../context/ToastContext';

const statusOptions = ['Active', 'Maintenance', 'Deactivated'];

const problemMessage = (error, fallback) => {
  const problem = error.response?.data;
  if (problem?.errorCode === 'STATION_ACTIVE_RESERVATIONS') {
    return 'This station cannot be deactivated because it has active reservations.';
  }
  return problem?.detail || problem?.message || fallback;
};

const Stations = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { notify } = useToast();
  const isBackoffice = user?.role === 'Backoffice';

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [statusDialog, setStatusDialog] = useState(null);
  const [statusReason, setStatusReason] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);

  const fetchStations = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/stations');
      setStations(response.data.data || []);
    } catch (requestError) {
      setError(problemMessage(requestError, 'Failed to load stations.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const filteredStations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return stations.filter((station) => {
      const matchesStatus = statusFilter === 'All' || station.status === statusFilter;
      const matchesSearch = !query
        || station.stationCode?.toLowerCase().includes(query)
        || station.name?.toLowerCase().includes(query)
        || station.address?.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [stations, searchQuery, statusFilter]);

  const openCreate = () => {
    setEditingStation(null);
    setShowForm(true);
  };

  const openEdit = (station) => {
    setEditingStation(station);
    setShowForm(true);
  };

  const openDetails = (station) => {
    setSelectedStation(station);
    setShowDetails(true);
  };

  const openStatusDialog = (station) => {
    setStatusDialog({ station, nextStatus: station.status });
    setStatusReason('');
    setError('');
  };

  const closeStatusDialog = () => {
    if (!changingStatus) {
      setStatusDialog(null);
      setStatusReason('');
    }
  };

  const handleFormSuccess = () => {
    const message = editingStation ? 'Station updated successfully.' : 'Station created successfully.';
    setShowForm(false);
    setEditingStation(null);
    notify(message);
    fetchStations();
  };

  const handleStatusChange = async () => {
    if (!statusDialog || statusDialog.nextStatus === statusDialog.station.status) return;

    try {
      setChangingStatus(true);
      setError('');
      await apiClient.patch(`/stations/${statusDialog.station.stationCode}/status`, {
        status: statusDialog.nextStatus,
        reason: statusReason.trim() || 'Status changed through the Backoffice portal',
      });
      notify(`Station ${statusDialog.station.stationCode} is now ${statusDialog.nextStatus.toLowerCase()}.`);
      setStatusDialog(null);
      setStatusReason('');
      await fetchStations();
    } catch (requestError) {
      setError(problemMessage(requestError, 'Failed to change station status.'));
      setStatusDialog(null);
    } finally {
      setChangingStatus(false);
    }
  };

  const manageSlots = (stationCode) => {
    const route = isBackoffice ? '/backoffice/slots' : '/grid-operator/slots';
    navigate(`${route}?station=${encodeURIComponent(stationCode)}`);
  };

  const navItems = isBackoffice ? [
    { name: 'Dashboard', path: '/backoffice' },
    { name: 'Prosumer Management', path: '/backoffice/prosumers' },
    { name: 'Microgrid Nodes', path: '/backoffice/stations' },
    { name: 'Energy Slots', path: '/backoffice/slots' },
    { name: 'Reservations', path: '/backoffice/reservations' },
  ] : [
    { name: 'Dashboard', path: '/grid-operator' },
    { name: 'Stations / Nodes', path: '/grid-operator/stations' },
    { name: 'Slots', path: '/grid-operator/slots' },
    { name: 'Bookings / Reservations', path: '/grid-operator/reservations' },
  ];

  return (
    <MainLayout title="Microgrid nodes" roleNav={navItems}>
      <PageHeader
        eyebrow="Infrastructure"
        title="Solar stations"
        description="Review physical microgrid locations, generation capacity, schedules and operating status."
        actions={isBackoffice ? <Button icon={PlusIcon} onClick={openCreate}>Add station</Button> : null}
      />

      <div className="app-panel-muted mb-5 grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
        <FormField id="station-search" label="Search stations" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Code, name or address" />
        <FormField as="select" id="station-status-filter" label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="All">All statuses</option>
          {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
        </FormField>
        <p className="pb-3 text-sm text-slate-500">{filteredStations.length} station{filteredStations.length === 1 ? '' : 's'}</p>
      </div>

      {error && <Alert className="mb-5" title="Unable to complete station request">{error}</Alert>}

      <div className="app-table-wrap hidden md:block">
        <div className="overflow-x-auto">
          <table className="app-table">
            <thead><tr>{['Code', 'Station', 'Capacity', 'Operating hours', 'Status', 'Actions'].map((heading) => <th key={heading} className={`${heading === 'Actions' ? 'text-right' : 'text-left'} px-5 py-3 text-xs font-medium uppercase tracking-wider text-slate-500`}>{heading}</th>)}</tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">Loading stations...</td></tr>
              ) : filteredStations.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">No stations match the current filters.</td></tr>
              ) : filteredStations.map((station) => (
                <tr key={station.stationCode} className="transition-colors hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-4 font-mono text-sm text-slate-600">{station.stationCode}</td>
                  <td className="px-5 py-4"><div className="text-sm font-medium text-slate-900">{station.name}</div><div className="max-w-xs truncate text-xs text-slate-500" title={station.address}>{station.address}</div></td>
                  <td className="whitespace-nowrap px-5 py-4"><div className="text-sm text-slate-900">{station.capacityKwh} kWh</div><div className="text-xs text-slate-500">Battery: {station.batteryStorageKwh} kWh</div></td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{station.openingTime} - {station.closingTime}</td>
                  <td className="whitespace-nowrap px-5 py-4"><StationStatusBadge status={station.status} /></td>
                  <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium"><div className="flex justify-end gap-3"><button onClick={() => openDetails(station)} className="text-blue-600 hover:text-blue-900">View</button><button onClick={() => manageSlots(station.stationCode)} className="text-violet-600 hover:text-violet-900">Slots</button>{isBackoffice && <button onClick={() => openEdit(station)} className="text-indigo-600 hover:text-indigo-900">Edit</button>}{isBackoffice && <button onClick={() => openStatusDialog(station)} className="text-amber-600 hover:text-amber-900">Status</button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? <div className="app-panel"><LoadingState label="Loading stations..." /></div> : filteredStations.length === 0 ? <div className="app-panel"><EmptyState title="No stations found" description="No stations match the current filters." /></div> : filteredStations.map((station) => (
          <article key={station.stationCode} className="app-panel p-4">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-xs font-bold text-emerald-700">{station.stationCode}</p><h3 className="mt-1 truncate font-bold text-slate-950">{station.name}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-500">{station.address}</p></div><StationStatusBadge status={station.status} /></div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-3 text-sm"><span><span className="block text-xs text-slate-500">Capacity</span>{station.capacityKwh} kWh</span><span><span className="block text-xs text-slate-500">Battery</span>{station.batteryStorageKwh} kWh</span><span className="col-span-2"><span className="block text-xs text-slate-500">Operating hours</span>{station.openingTime} - {station.closingTime}</span></div>
            <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold"><button onClick={() => openDetails(station)} className="text-emerald-700">View</button><button onClick={() => manageSlots(station.stationCode)} className="text-violet-700">Slots</button>{isBackoffice ? <><button onClick={() => openEdit(station)} className="text-cyan-700">Edit</button><button onClick={() => openStatusDialog(station)} className="text-amber-700">Status</button></> : null}</div>
          </article>
        ))}
      </div>

      {showForm && <StationForm station={editingStation} onClose={() => setShowForm(false)} onSuccess={handleFormSuccess} />}
      {showDetails && <StationDetails station={selectedStation} onClose={() => { setShowDetails(false); setSelectedStation(null); }} />}

      <Modal open={Boolean(statusDialog)} title="Change station status" description={statusDialog ? `${statusDialog.station.stationCode} - ${statusDialog.station.name}` : ''} onClose={closeStatusDialog} size="max-w-md">
        <div className="space-y-4">
          <FormField as="select" id="station-new-status" label="New status" value={statusDialog?.nextStatus || ''} onChange={(event) => setStatusDialog((current) => current ? { ...current, nextStatus: event.target.value } : current)}>{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</FormField>
          <FormField as="textarea" id="station-status-reason" label="Reason" value={statusReason} onChange={(event) => setStatusReason(event.target.value)} placeholder="Reason for this operational change" />
          {statusDialog?.nextStatus === 'Deactivated' && <Alert title="Reservation check">Deactivation will be rejected if this station has active reservations.</Alert>}
          <div className="flex justify-end gap-3"><Button variant="secondary" onClick={closeStatusDialog} disabled={changingStatus}>Cancel</Button><Button onClick={handleStatusChange} loading={changingStatus} disabled={!statusDialog || statusDialog.nextStatus === statusDialog.station.status}>Confirm change</Button></div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default Stations;
