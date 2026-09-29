// -----------------------------------------------------------------------------
// This page lists, searches, filters, creates, views, and updates solar stations.
// It also manages Active, Maintenance, and Deactivated station states and links
// each station to its energy-slot management page. The backend remains the
// authority for validation and reservation-safe station deactivation.
// -----------------------------------------------------------------------------
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import apiClient from '../../services/api';
import StationStatusBadge from '../../components/stations/StationStatusBadge';
import StationForm from '../../components/stations/StationForm';
import StationDetails from '../../components/stations/StationDetails';
import { AuthContext } from '../../context/AuthContext';

const statusOptions = ['Active', 'Maintenance', 'Deactivated'];

// Converts backend Problem Details responses into clear messages for Backoffice users.
const problemMessage = (error, fallback) => {
  const problem = error.response?.data;
  if (problem?.errorCode === 'STATION_ACTIVE_RESERVATIONS') {
    return 'This station cannot be deactivated because it has active reservations.';
  }
  return problem?.detail || problem?.message || fallback;
};

// Renders the complete Backoffice station-management page.
const Stations = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isBackoffice = user?.role === 'Backoffice';

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [statusDialog, setStatusDialog] = useState(null);
  const [statusReason, setStatusReason] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);

  // Loads the latest station collection from the authenticated station API.
  const fetchStations = async () => {
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
  };

  // Loads station data when the page first opens.
  useEffect(() => {
    fetchStations();
  }, []);

  // Applies client-side search and status filters without changing server data.
  const filteredStations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return stations.filter((station) => {
      const matchesStatus = statusFilter === 'All' || station.status === statusFilter;
      const matchesSearch = !query ||
        station.stationCode?.toLowerCase().includes(query) ||
        station.name?.toLowerCase().includes(query) ||
        station.address?.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [stations, searchQuery, statusFilter]);

  // Opens the station form in create mode.
  const openCreate = () => {
    setEditingStation(null);
    setShowForm(true);
  };

  // Opens the station form with the selected station's editable values.
  const openEdit = (station) => {
    setEditingStation(station);
    setShowForm(true);
  };

  // Opens the read-only station-details dialog.
  const openDetails = (station) => {
    setSelectedStation(station);
    setShowDetails(true);
  };

  // Opens the confirmation dialog for an operational status change.
  const openStatusDialog = (station) => {
    setStatusDialog({ station, nextStatus: station.status });
    setStatusReason('');
    setError('');
  };

  // Closes the status dialog unless an API request is currently running.
  const closeStatusDialog = () => {
    if (!changingStatus) {
      setStatusDialog(null);
      setStatusReason('');
    }
  };

  // Closes the form, reports success, and refreshes station data.
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingStation(null);
    setSuccess(editingStation ? 'Station updated successfully.' : 'Station created successfully.');
    fetchStations();
  };

  // Sends a confirmed status transition to the backend and displays business-rule errors.
  const handleStatusChange = async () => {
    if (!statusDialog || statusDialog.nextStatus === statusDialog.station.status) return;

    try {
      setChangingStatus(true);
      setError('');
      await apiClient.patch(`/stations/${statusDialog.station.stationCode}/status`, {
        status: statusDialog.nextStatus,
        reason: statusReason.trim() || 'Status changed through the Backoffice portal'
      });
      setSuccess(`${statusDialog.station.stationCode} changed to ${statusDialog.nextStatus}.`);
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

  // Opens the slot-management page with this station already selected.
  const manageSlots = (stationCode) => {
    const route = isBackoffice ? '/backoffice/slots' : '/grid-operator/slots';
    navigate(`${route}?station=${encodeURIComponent(stationCode)}`);
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
    <MainLayout title="Microgrid Nodes" roleNav={navItems}>
      {/* Page heading and primary station actions. */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Solar Stations</h2>
          <p className="mt-1 text-sm text-slate-500">Manage locations, capacity, schedules, and operational status.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={fetchStations} disabled={loading} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50">
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          {isBackoffice && (
            <button onClick={openCreate} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
              + Create Station
            </button>
          )}
        </div>
      </div>

      {/* Station search, status filter, and visible result count. */}
      <div className="mb-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_auto]">
        <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search station code, name, or address..." className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="All">All statuses</option>
          {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <div className="flex items-center text-sm text-slate-500">{filteredStations.length} station{filteredStations.length === 1 ? '' : 's'}</div>
      </div>

      {success && <div className="mb-4 rounded-md border-l-4 border-emerald-500 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>}
      {error && <div className="mb-4 rounded-md border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {/* Station table with view, slot-management, edit, and status actions. */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {['Code', 'Station', 'Capacity', 'Operating Hours', 'Status', 'Actions'].map((heading) => (
                  <th key={heading} className={`${heading === 'Actions' ? 'text-right' : 'text-left'} px-5 py-3 text-xs font-medium uppercase tracking-wider text-slate-500`}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">Loading stations...</td></tr>
              ) : filteredStations.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">No stations match the current filters.</td></tr>
              ) : filteredStations.map((station) => (
                <tr key={station.stationCode} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-4 font-mono text-sm text-slate-600">{station.stationCode}</td>
                  <td className="px-5 py-4"><div className="text-sm font-medium text-slate-900">{station.name}</div><div className="max-w-xs truncate text-xs text-slate-500" title={station.address}>{station.address}</div></td>
                  <td className="whitespace-nowrap px-5 py-4"><div className="text-sm text-slate-900">{station.capacityKwh} kWh</div><div className="text-xs text-slate-500">Battery: {station.batteryStorageKwh} kWh</div></td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{station.openingTime} – {station.closingTime}</td>
                  <td className="whitespace-nowrap px-5 py-4"><StationStatusBadge status={station.status} /></td>
                  <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => openDetails(station)} className="text-blue-600 hover:text-blue-900">View</button>
                      <button onClick={() => manageSlots(station.stationCode)} className="text-violet-600 hover:text-violet-900">Slots</button>
                      {isBackoffice && <button onClick={() => openEdit(station)} className="text-indigo-600 hover:text-indigo-900">Edit</button>}
                      {isBackoffice && <button onClick={() => openStatusDialog(station)} className="text-amber-600 hover:text-amber-900">Status</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <StationForm station={editingStation} onClose={() => setShowForm(false)} onSuccess={handleFormSuccess} />}
      {showDetails && <StationDetails station={selectedStation} onClose={() => { setShowDetails(false); setSelectedStation(null); }} />}

      {/* Confirmation dialog used for Active, Maintenance, and Deactivated transitions. */}
      {statusDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Change Station Status</h3>
            <p className="mt-1 text-sm text-slate-500">{statusDialog.station.stationCode} — {statusDialog.station.name}</p>
            <label className="mt-5 block text-sm font-medium text-slate-700">New status</label>
            <select value={statusDialog.nextStatus} onChange={(event) => setStatusDialog((current) => ({ ...current, nextStatus: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <label className="mt-4 block text-sm font-medium text-slate-700">Reason</label>
            <textarea value={statusReason} onChange={(event) => setStatusReason(event.target.value)} rows="3" placeholder="Reason for this operational change" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            {statusDialog.nextStatus === 'Deactivated' && <p className="mt-3 rounded-md bg-amber-50 p-3 text-xs text-amber-800">Deactivation will be rejected if this station has active reservations.</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={closeStatusDialog} disabled={changingStatus} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={handleStatusChange} disabled={changingStatus || statusDialog.nextStatus === statusDialog.station.status} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{changingStatus ? 'Updating...' : 'Confirm Change'}</button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Stations;
