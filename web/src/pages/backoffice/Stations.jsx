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
import ViewToggle from '../../components/ui/ViewToggle';
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

const StationActions = ({ station, isBackoffice, loadingEditor, onDetails, onManageSlots, onEdit, onStatus }) => (
  <div className="flex flex-wrap gap-1">
    <Button variant="secondary" onClick={() => onDetails(station)}>Details</Button>
    <Button variant="secondary" onClick={() => onManageSlots(station.stationCode)}>Energy slots</Button>
    {isBackoffice && <><Button variant="ghost" disabled={loadingEditor} onClick={() => onEdit(station)}>Edit</Button><Button variant="ghost" onClick={() => onStatus(station)}>Status</Button></>}
  </div>
);

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
  const [viewMode, setViewMode] = useState('grid');
  const [showForm, setShowForm] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [loadingEditor, setLoadingEditor] = useState(false);
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

  // Loads the latest station record before editing so the form never uses stale list data.
  const openEdit = async (station) => {
    try {
      setLoadingEditor(true);
      setError('');
      const response = await apiClient.get(`/stations/${station.stationCode}`);
      setEditingStation(response.data.data);
      setShowForm(true);
    } catch (requestError) {
      setError(problemMessage(requestError, 'Failed to load the station for editing.'));
    } finally {
      setLoadingEditor(false);
    }
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

  return (
    <MainLayout title="Microgrid nodes">
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

      <div className="mb-5"><ViewToggle value={viewMode} onChange={setViewMode} label="Stations" /></div>

      {error && <Alert className="mb-5" title="Unable to complete station request">{error}</Alert>}

      {loading ? <LoadingState label="Connecting to your stations…" /> : filteredStations.length === 0 ? <EmptyState title="No stations found" description="Try another name, location or operating status." /> : (
        viewMode === 'list' ? (
          <section className="app-table-wrap" aria-label="Station list">
            <div className="overflow-x-auto">
              <table className="app-table">
                <thead><tr><th scope="col">Station</th><th scope="col">Location</th><th scope="col">Capacity</th><th scope="col">Storage</th><th scope="col">Operating window</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
                <tbody>{filteredStations.map((station) => (
                  <tr key={station.stationCode}>
                    <td><span className="block font-mono text-xs">{station.stationCode}</span><span className="block min-w-36 font-semibold text-slate-900">{station.name}</span></td>
                    <td className="min-w-40">{station.address || 'Location not specified'}</td>
                    <td className="whitespace-nowrap">{station.capacityKwh ?? '—'} kWh</td>
                    <td className="whitespace-nowrap">{station.batteryStorageKwh ?? '—'} kWh</td>
                    <td className="whitespace-nowrap">{station.openingTime} – {station.closingTime}</td>
                    <td><StationStatusBadge status={station.status} /></td>
                    <td className="min-w-72"><StationActions station={station} isBackoffice={isBackoffice} loadingEditor={loadingEditor} onDetails={openDetails} onManageSlots={manageSlots} onEdit={openEdit} onStatus={openStatusDialog} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>
        ) : <div className="infrastructure-grid">
          {filteredStations.map((station) => (
            <article key={station.stationCode} className="infrastructure-card">
              <div className="infrastructure-visual" aria-hidden="true"><span /><span /><span /><i /></div>
              <div className="asset-body">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="asset-code">{station.stationCode}</span><StationStatusBadge status={station.status} /></div>
                <h2 className="mt-4 text-xl font-semibold text-slate-950">{station.name}</h2>
                <p className="asset-location">{station.address || 'Location not specified'}</p>
                <div className="asset-capacity"><div><span>Station capacity</span><strong>{station.capacityKwh ?? '—'} <small>kWh</small></strong></div><div><span>Battery storage</span><strong>{station.batteryStorageKwh ?? '—'} <small>kWh</small></strong></div></div>
                <div className="asset-meta"><span>Operating window</span><strong>{station.openingTime} — {station.closingTime}</strong></div>
                <div className="asset-actions"><StationActions station={station} isBackoffice={isBackoffice} loadingEditor={loadingEditor} onDetails={openDetails} onManageSlots={manageSlots} onEdit={openEdit} onStatus={openStatusDialog} /></div>
              </div>
            </article>
          ))}
        </div>
      )}

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
