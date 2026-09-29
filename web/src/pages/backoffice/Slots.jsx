// -----------------------------------------------------------------------------
// This page manages the energy slots belonging to a selected solar station.
// It supports station selection, slot filtering, creation, viewing, editing,
// and confirmed availability changes. The backend remains authoritative for
// station state, schedules, capacity, overlap, and active-reservation rules.
// -----------------------------------------------------------------------------
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import apiClient from '../../services/api';
import SlotStatusBadge from '../../components/slots/SlotStatusBadge';
import SlotForm from '../../components/slots/SlotForm';
import SlotDetails from '../../components/slots/SlotDetails';
import { AuthContext } from '../../context/AuthContext';

// Converts backend Problem Details responses into useful slot-management messages.
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

// Converts a date-only filter into the UTC boundary expected by the backend API.
const toUtcBoundary = (date, endOfDay = false) => {
  if (!date) return undefined;
  const suffix = endOfDay ? 'T23:59:59' : 'T00:00:00';
  return new Date(`${date}${suffix}`).toISOString();
};

// Renders the complete station energy-slot management page.
const Slots = () => {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const isBackoffice = user?.role === 'Backoffice';

  const [stations, setStations] = useState([]);
  const [selectedStationCode, setSelectedStationCode] = useState(searchParams.get('station') || '');
  const [slots, setSlots] = useState([]);
  const [loadingStations, setLoadingStations] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  // Resolves the full selected-station record for context and validation hints.
  const selectedStation = useMemo(
    () => stations.find((station) => station.stationCode === selectedStationCode),
    [stations, selectedStationCode]
  );

  // Applies the slot-code search locally after server-side status/date filtering.
  const visibleSlots = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return slots.filter((slot) => !query || slot.slotCode?.toLowerCase().includes(query));
  }, [slots, searchQuery]);

  // Loads stations and preserves a valid station supplied through the query string.
  const fetchStations = async () => {
    try {
      setLoadingStations(true);
      setError('');
      const response = await apiClient.get('/stations');
      const loadedStations = response.data.data || [];
      setStations(loadedStations);
      setSelectedStationCode((current) => {
        if (loadedStations.some((station) => station.stationCode === current)) return current;
        return loadedStations[0]?.stationCode || '';
      });
    } catch (requestError) {
      setError(problemMessage(requestError, 'Failed to load stations.'));
    } finally {
      setLoadingStations(false);
    }
  };

  // Loads slots for the selected station using the active date and status filters.
  const fetchSlots = async () => {
    if (!selectedStationCode) {
      setSlots([]);
      return;
    }

    if (fromDate && toDate && fromDate > toDate) {
      setError('The start date cannot be later than the end date.');
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
  };

  // Loads the station selector when the page first opens.
  useEffect(() => {
    fetchStations();
  }, []);

  // Keeps the selected station in the URL and refreshes slots whenever filters change.
  useEffect(() => {
    if (selectedStationCode) {
      setSearchParams({ station: selectedStationCode }, { replace: true });
      fetchSlots();
    }
  }, [selectedStationCode, statusFilter, fromDate, toDate]);

  // Opens slot creation only when an active station is selected.
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

  // Opens the slot form with the selected slot's current editable values.
  const openEdit = (slot) => {
    setEditingSlot(slot);
    setShowForm(true);
  };

  // Opens the read-only slot-details dialog.
  const openDetails = (slot) => {
    setSelectedSlot(slot);
    setShowDetails(true);
  };

  // Closes the form, reports success, and reloads the station's slots.
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingSlot(null);
    setSuccess(editingSlot ? 'Energy slot updated successfully.' : 'Energy slot created successfully.');
    fetchSlots();
  };

  // Prepares a confirmed Available/Unavailable transition for a manageable slot.
  const openStatusDialog = (slot) => {
    if (!['Available', 'Unavailable'].includes(slot.status)) {
      setError(`${slot.status} slots cannot be changed manually.`);
      return;
    }
    setStatusDialog({
      slot,
      nextStatus: slot.status === 'Available' ? 'Unavailable' : 'Available'
    });
    setStatusReason('');
  };

  // Sends the confirmed availability change and displays reservation conflicts clearly.
  const handleStatusChange = async () => {
    if (!statusDialog) return;
    try {
      setChangingStatus(true);
      setError('');
      await apiClient.patch(`/slots/${statusDialog.slot.slotCode}/status`, {
        status: statusDialog.nextStatus,
        reason: statusReason.trim() || 'Availability changed through the Backoffice portal'
      });
      setSuccess(`${statusDialog.slot.slotCode} changed to ${statusDialog.nextStatus}.`);
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

  // Resets all slot search and server-side filter values.
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setFromDate('');
    setToDate('');
  };

  // Uses the navigation appropriate to the authenticated staff role.
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
    <MainLayout title="Energy Slots" roleNav={navItems}>
      {/* Page heading and primary slot actions. */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Station Energy Slots</h2>
          <p className="mt-1 text-sm text-slate-500">Manage availability, energy capacity, schedules, and pricing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={fetchSlots} disabled={loadingSlots || !selectedStationCode} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50">
            {loadingSlots ? 'Refreshing...' : 'Refresh'}
          </button>
          {isBackoffice && <button onClick={openCreate} disabled={!selectedStationCode || selectedStation?.status !== 'Active'} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">+ Create Slot</button>}
        </div>
      </div>

      {/* Selected-station context used when listing and creating slots. */}
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[minmax(240px,1fr)_2fr] md:items-end">
          <div>
            <label htmlFor="station-select" className="block text-sm font-medium text-slate-700">Station</label>
            <select id="station-select" value={selectedStationCode} onChange={(event) => setSelectedStationCode(event.target.value)} disabled={loadingStations} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              {stations.length === 0 && <option value="">No stations available</option>}
              {stations.map((station) => <option key={station.stationCode} value={station.stationCode}>{station.stationCode} — {station.name}</option>)}
            </select>
          </div>
          {selectedStation && (
            <div className="grid grid-cols-2 gap-3 rounded-md bg-slate-50 p-3 text-sm md:grid-cols-4">
              <div><span className="block text-xs text-slate-500">Status</span><StationStatusText status={selectedStation.status} /></div>
              <div><span className="block text-xs text-slate-500">Capacity</span><span className="font-medium text-slate-800">{selectedStation.capacityKwh} kWh</span></div>
              <div><span className="block text-xs text-slate-500">Hours</span><span className="font-medium text-slate-800">{selectedStation.openingTime}–{selectedStation.closingTime}</span></div>
              <div><span className="block text-xs text-slate-500">Location</span><span className="font-medium text-slate-800">{selectedStation.address}</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Slot code, status, and UTC date-range filters. */}
      <div className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1fr_180px_170px_170px_auto]">
        <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search slot code..." className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="All">All statuses</option>
          {['Available', 'Reserved', 'Unavailable', 'Expired'].map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <input type="date" aria-label="Slots from date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input type="date" aria-label="Slots to date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <button onClick={clearFilters} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Clear</button>
      </div>

      {success && <div className="mb-4 rounded-md border-l-4 border-emerald-500 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>}
      {error && <div className="mb-4 rounded-md border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {/* Slot table with details, edit, and availability actions. */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50"><tr>
              {['Slot Code', 'Date and Time', 'Energy', 'Price / kWh', 'Status', 'Actions'].map((heading) => <th key={heading} className={`${heading === 'Actions' ? 'text-right' : 'text-left'} px-5 py-3 text-xs font-medium uppercase tracking-wider text-slate-500`}>{heading}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loadingSlots ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">Loading energy slots...</td></tr>
              ) : visibleSlots.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">{selectedStationCode ? 'No slots match the current filters.' : 'Select a station to view slots.'}</td></tr>
              ) : visibleSlots.map((slot) => (
                <tr key={slot.slotCode} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-4 font-mono text-sm text-slate-600">{slot.slotCode}</td>
                  <td className="whitespace-nowrap px-5 py-4"><div className="text-sm text-slate-900">{new Date(slot.startTimeUtc).toLocaleDateString()}</div><div className="text-xs text-slate-500">{new Date(slot.startTimeUtc).toLocaleTimeString()} – {new Date(slot.endTimeUtc).toLocaleTimeString()}</div></td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-900">{slot.availableEnergyKwh} kWh</td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">{Number(slot.pricePerKwh).toFixed(2)}</td>
                  <td className="whitespace-nowrap px-5 py-4"><SlotStatusBadge status={slot.status} /></td>
                  <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium"><div className="flex justify-end gap-3">
                    <button onClick={() => openDetails(slot)} className="text-blue-600 hover:text-blue-900">View</button>
                    {isBackoffice && <button onClick={() => openEdit(slot)} disabled={['Reserved', 'Expired'].includes(slot.status)} className="text-indigo-600 hover:text-indigo-900 disabled:cursor-not-allowed disabled:text-slate-300">Edit</button>}
                    {isBackoffice && <button onClick={() => openStatusDialog(slot)} disabled={!['Available', 'Unavailable'].includes(slot.status)} className="text-amber-600 hover:text-amber-900 disabled:cursor-not-allowed disabled:text-slate-300">Availability</button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <SlotForm slot={editingSlot} stationCode={selectedStationCode} onClose={() => setShowForm(false)} onSuccess={handleFormSuccess} />}
      {showDetails && <SlotDetails slot={selectedSlot} onClose={() => { setShowDetails(false); setSelectedSlot(null); }} />}

      {/* Confirmation dialog for manual Available/Unavailable transitions. */}
      {statusDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Change Slot Availability</h3>
            <p className="mt-1 text-sm text-slate-500">Change {statusDialog.slot.slotCode} from {statusDialog.slot.status} to {statusDialog.nextStatus}?</p>
            <label className="mt-5 block text-sm font-medium text-slate-700">Reason</label>
            <textarea value={statusReason} onChange={(event) => setStatusReason(event.target.value)} rows="3" placeholder="Reason for this availability change" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            {statusDialog.nextStatus === 'Unavailable' && <p className="mt-3 rounded-md bg-amber-50 p-3 text-xs text-amber-800">The backend will reject this action if the slot has an active reservation.</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setStatusDialog(null)} disabled={changingStatus} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={handleStatusChange} disabled={changingStatus} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{changingStatus ? 'Updating...' : 'Confirm Change'}</button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

// Displays compact station status context without introducing another shared component.
const StationStatusText = ({ status }) => {
  const colours = status === 'Active' ? 'text-emerald-700' : status === 'Maintenance' ? 'text-amber-700' : 'text-red-700';
  return <span className={`font-semibold ${colours}`}>{status}</span>;
};

export default Slots;
