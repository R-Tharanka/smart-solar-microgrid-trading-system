import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import apiClient from '../../services/api';
import SlotStatusBadge from '../../components/slots/SlotStatusBadge';
import SlotForm from '../../components/slots/SlotForm';
import SlotDetails from '../../components/slots/SlotDetails';
import { AuthContext } from '../../context/AuthContext';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import { EmptyState, LoadingState } from '../../components/ui/PageState';
import { useToast } from '../../context/ToastContext';

const slotStatuses = ['Available', 'Reserved', 'Unavailable', 'Expired'];

// Keeps displayed slot schedules in UTC so they match the create and edit form.
const formatUtcDateTime = (value) => new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
}).format(new Date(value));

const problemMessage = (error, fallback) => {
  const problem = error.response?.data;
  if (problem?.errorCode === 'SLOT_ACTIVE_RESERVATION') {
    return 'This slot cannot be changed because it has an active reservation.';
  }
  if (problem?.errorCode === 'STATION_NOT_ACTIVE') {
    return 'Slots can only be created for an active station.';
  }
  return problem?.detail || problem?.message || fallback;
};

const toUtcBoundary = (date, endOfDay = false) => {
  if (!date) return undefined;
  const suffix = endOfDay ? 'T23:59:59.999' : 'T00:00:00';
  return new Date(`${date}${suffix}`).toISOString();
};

const Slots = () => {
  const { user } = useContext(AuthContext);
  const { notify } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const isBackoffice = user?.role === 'Backoffice';
  const canEditSlots = isBackoffice || user?.role === 'GridOperator';

  const [stations, setStations] = useState([]);
  const [selectedStationCode, setSelectedStationCode] = useState(searchParams.get('station') || '');
  const [slots, setSlots] = useState([]);
  const [loadingStations, setLoadingStations] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [statusDialog, setStatusDialog] = useState(null);
  const [statusReason, setStatusReason] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);

  const selectedStation = useMemo(
    () => stations.find((station) => station.stationCode === selectedStationCode),
    [stations, selectedStationCode],
  );

  const visibleSlots = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return slots.filter((slot) => !query || slot.slotCode?.toLowerCase().includes(query));
  }, [slots, searchQuery]);

  const fetchStations = useCallback(async () => {
    try {
      setLoadingStations(true);
      setError('');
      const response = await apiClient.get('/stations');
      const loadedStations = response.data.data || [];
      setStations(loadedStations);
      setSelectedStationCode((current) => loadedStations.some((station) => station.stationCode === current)
        ? current
        : loadedStations[0]?.stationCode || '');
    } catch (requestError) {
      setError(problemMessage(requestError, 'Failed to load stations.'));
    } finally {
      setLoadingStations(false);
    }
  }, []);

  const fetchSlots = useCallback(async () => {
    if (!selectedStationCode) {
      setSlots([]);
      return;
    }
    if (fromDate && toDate && fromDate > toDate) {
      setError('The start date cannot be later than the end date.');
      setSlots([]);
      return;
    }

    try {
      setLoadingSlots(true);
      setError('');
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (fromDate) params.fromUtc = toUtcBoundary(fromDate);
      if (toDate) params.toUtc = toUtcBoundary(toDate, true);
      const response = await apiClient.get(`/stations/${selectedStationCode}/slots`, { params });
      setSlots(response.data.data || []);
    } catch (requestError) {
      setError(problemMessage(requestError, 'Failed to load slots for the selected station.'));
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedStationCode, statusFilter, fromDate, toDate]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  useEffect(() => {
    if (selectedStationCode) {
      setSearchParams({ station: selectedStationCode }, { replace: true });
    }
    fetchSlots();
  }, [selectedStationCode, setSearchParams, fetchSlots]);

  const openCreate = () => {
    if (!selectedStationCode) {
      setError('Create a station before adding an energy slot.');
      return;
    }
    if (selectedStation?.status !== 'Active') {
      setError('Slots can only be created for an active station.');
      return;
    }
    setEditingSlot(null);
    setShowForm(true);
  };

  const openEdit = (slot) => {
    setEditingSlot(slot);
    setShowForm(true);
  };

  const openDetails = (slot) => {
    setSelectedSlot(slot);
    setShowDetails(true);
  };

  const handleFormSuccess = () => {
    const message = editingSlot ? 'Energy slot updated successfully.' : 'Energy slot created successfully.';
    setShowForm(false);
    setEditingSlot(null);
    notify(message);
    fetchSlots();
  };

  const openStatusDialog = (slot) => {
    if (!['Available', 'Unavailable'].includes(slot.status)) {
      setError(`${slot.status} slots cannot be changed manually.`);
      return;
    }
    setStatusDialog({ slot, nextStatus: slot.status === 'Available' ? 'Unavailable' : 'Available' });
    setStatusReason('');
    setError('');
  };

  const closeStatusDialog = () => {
    if (!changingStatus) {
      setStatusDialog(null);
      setStatusReason('');
    }
  };

  const handleStatusChange = async () => {
    if (!statusDialog) return;
    try {
      setChangingStatus(true);
      setError('');
      await apiClient.patch(`/slots/${statusDialog.slot.slotCode}/status`, {
        status: statusDialog.nextStatus,
        reason: statusReason.trim() || 'Availability changed through the Backoffice portal',
      });
      notify(`Slot ${statusDialog.slot.slotCode} is now ${statusDialog.nextStatus.toLowerCase()}.`);
      setStatusDialog(null);
      setStatusReason('');
      await fetchSlots();
    } catch (requestError) {
      setError(problemMessage(requestError, 'Failed to change slot status.'));
      setStatusDialog(null);
    } finally {
      setChangingStatus(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setFromDate('');
    setToDate('');
    setError('');
  };

  return (
    <MainLayout title="Energy slots">
      <PageHeader eyebrow="Availability" title="Energy slots" description="Inspect and manage time-bound energy capacity, schedules and pricing for each station." actions={isBackoffice ? <Button icon={PlusIcon} onClick={openCreate} disabled={!selectedStationCode || selectedStation?.status !== 'Active'}>Add slot</Button> : null} />

      <div className="app-panel-muted mb-5 space-y-4 p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(240px,1fr)_2fr] lg:items-end">
          <FormField as="select" id="station-select" label="Microgrid station" value={selectedStationCode} onChange={(event) => setSelectedStationCode(event.target.value)} disabled={loadingStations}>
            {stations.length === 0 && <option value="">No stations available</option>}
            {stations.map((station) => <option key={station.stationCode} value={station.stationCode}>{station.stationCode} - {station.name}</option>)}
          </FormField>
          {selectedStation && <div className="grid grid-cols-2 gap-3 rounded-md bg-white p-3 text-sm md:grid-cols-4"><div><span className="block text-xs text-slate-500">Status</span><StationStatusText status={selectedStation.status} /></div><div><span className="block text-xs text-slate-500">Capacity</span><span className="font-medium text-slate-800">{selectedStation.capacityKwh} kWh</span></div><div><span className="block text-xs text-slate-500">Hours</span><span className="font-medium text-slate-800">{selectedStation.openingTime} - {selectedStation.closingTime}</span></div><div><span className="block text-xs text-slate-500">Location</span><span className="font-medium text-slate-800">{selectedStation.address}</span></div></div>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(180px,1fr)_180px_170px_170px_auto] lg:items-end">
          <FormField id="slot-search" label="Search slots" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Slot code" />
          <FormField as="select" id="slot-status-filter" label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="All">All statuses</option>{slotStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</FormField>
          <FormField type="date" id="slot-from-date" label="From date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          <FormField type="date" id="slot-to-date" label="To date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          <Button variant="secondary" onClick={clearFilters}>Clear</Button>
        </div>
      </div>

      {error && <Alert className="mb-5" title="Unable to complete slot request">{error}</Alert>}

      {loadingSlots || loadingStations ? <LoadingState label="Loading energy windows…" /> : visibleSlots.length === 0 ? <EmptyState title="No energy windows found" description={selectedStationCode ? 'Adjust your filters to explore other schedules.' : 'Select a station to explore its energy availability.'} /> : (
        <div className="energy-slot-grid">
          {visibleSlots.map((slot) => (
            <article key={slot.slotCode} className="energy-slot-card">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="asset-code">{slot.slotCode}</span><SlotStatusBadge status={slot.status} /></div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-500">Scheduled energy capacity</p>
              <div className="slot-capacity">{slot.availableEnergyKwh}<span>kWh</span></div>
              <p className="text-sm text-slate-500">{selectedStation?.name || selectedStationCode}</p>
              <div className="slot-window"><div><span>From</span><strong>{formatUtcDateTime(slot.startTimeUtc)}</strong></div><div><span>Until</span><strong>{formatUtcDateTime(slot.endTimeUtc)}</strong></div></div>
              <div className="asset-meta"><span>Price per kWh</span><strong>${Number(slot.pricePerKwh).toFixed(2)}</strong></div>
              <div className="asset-actions"><Button variant="secondary" onClick={() => openDetails(slot)}>Details</Button>{canEditSlots && <Button variant="ghost" onClick={() => openEdit(slot)} disabled={['Reserved', 'Expired'].includes(slot.status)}>Edit</Button>}{isBackoffice && <Button variant="ghost" onClick={() => openStatusDialog(slot)} disabled={!['Available', 'Unavailable'].includes(slot.status)}>Availability</Button>}</div>
            </article>
          ))}
        </div>
      )}

      {showForm && <SlotForm slot={editingSlot} stationCode={selectedStationCode} onClose={() => setShowForm(false)} onSuccess={handleFormSuccess} />}
      {showDetails && <SlotDetails slot={selectedSlot} onClose={() => { setShowDetails(false); setSelectedSlot(null); }} />}

      <Modal open={Boolean(statusDialog)} title="Change slot availability" description={statusDialog ? `Change ${statusDialog.slot.slotCode} from ${statusDialog.slot.status} to ${statusDialog.nextStatus}.` : ''} onClose={closeStatusDialog} size="max-w-md">
        <div className="space-y-4"><FormField as="textarea" id="slot-status-reason" label="Reason" value={statusReason} onChange={(event) => setStatusReason(event.target.value)} placeholder="Reason for this availability change" />{statusDialog?.nextStatus === 'Unavailable' && <Alert title="Reservation check">The change will be rejected if this slot has an active reservation.</Alert>}<div className="flex justify-end gap-3"><Button variant="secondary" onClick={closeStatusDialog} disabled={changingStatus}>Cancel</Button><Button variant={statusDialog?.nextStatus === 'Unavailable' ? 'danger' : 'primary'} onClick={handleStatusChange} loading={changingStatus}>Confirm change</Button></div></div>
      </Modal>
    </MainLayout>
  );
};

const StationStatusText = ({ status }) => {
  const colours = status === 'Active' ? 'text-emerald-700' : status === 'Maintenance' ? 'text-amber-700' : 'text-red-700';
  return <span className={`font-semibold ${colours}`}>{status}</span>;
};

export default Slots;
