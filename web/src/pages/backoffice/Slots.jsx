import { useCallback, useState, useEffect, useContext } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import MainLayout from '../../layouts/MainLayout';
import apiClient from '../../services/api';
import SlotStatusBadge from '../../components/slots/SlotStatusBadge';
import SlotForm from '../../components/slots/SlotForm';
import SlotDetails from '../../components/slots/SlotDetails';
import { AuthContext } from '../../context/AuthContext';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FormField from '../../components/ui/FormField';
import PageHeader from '../../components/ui/PageHeader';
import { EmptyState, LoadingState } from '../../components/ui/PageState';
import { useToast } from '../../context/ToastContext';

const Slots = () => {
  const { user } = useContext(AuthContext);
  const isBackoffice = user?.role === 'Backoffice';
  const { notify } = useToast();
  
  const [stations, setStations] = useState([]);
  const [selectedStationCode, setSelectedStationCode] = useState('');
  
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusChanging, setStatusChanging] = useState(false);

  // Load stations on mount
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await apiClient.get('/stations');
        setStations(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedStationCode(response.data.data[0].stationCode);
        }
      } catch {
        setError('Failed to load stations.');
      }
    };
    fetchStations();
  }, []);

  // Load slots when station changes
  const fetchSlots = useCallback(async () => {
    if (!selectedStationCode) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get(`/stations/${selectedStationCode}/slots`);
      setSlots(response.data.data);
    } catch {
      setError('Failed to load slots for the selected station.');
    } finally {
      setLoading(false);
    }
  }, [selectedStationCode]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleStationChange = (e) => {
    setSelectedStationCode(e.target.value);
  };

  const handleAdd = () => {
    if (!selectedStationCode) {
      notify('Select a station before creating an energy slot.', 'error');
      return;
    }
    setEditingSlot(null);
    setShowForm(true);
  };

  const handleEdit = (slot) => {
    setEditingSlot(slot);
    setShowForm(true);
  };

  const handleView = (slot) => {
    setSelectedSlot(slot);
    setShowDetails(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchSlots();
  };

  const handleStatusChange = async () => {
    if (!statusTarget) return;
    const newStatus = statusTarget.status === 'Available' ? 'Unavailable' : 'Available';
    try {
      setStatusChanging(true);
      await apiClient.patch(`/slots/${statusTarget.slotCode}/status`, {
        status: newStatus,
        reason: 'Status changed via Web Portal'
      });
      await fetchSlots();
      notify(`Slot ${statusTarget.slotCode} is now ${newStatus.toLowerCase()}.`);
      setStatusTarget(null);
    } catch (err) {
      notify(err.response?.data?.detail || 'The slot status could not be changed.', 'error');
    } finally { setStatusChanging(false); }
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
    { name: 'Bookings / Reservations', path: '/grid-operator/bookings' },
  ];

  return (
    <MainLayout title="Energy slots" roleNav={navItems}>
      <PageHeader eyebrow="Availability" title="Energy slots" description="Inspect and manage time-bound energy capacity for each station." actions={isBackoffice ? <Button icon={PlusIcon} onClick={handleAdd}>Add slot</Button> : null} />
      <div className="app-panel-muted mb-5 p-4">
          <FormField as="select" id="station-select" label="Microgrid station" value={selectedStationCode} onChange={handleStationChange} className="max-w-xl">
              {stations.map(station => (
                <option key={station.stationCode} value={station.stationCode}>
                  {station.stationCode} - {station.name}
                </option>
              ))}
            </FormField>
      </div>

      {error && (
        <Alert className="mb-5" title="Unable to load energy slots">{error}</Alert>
      )}

      <div className="app-table-wrap hidden md:block">
        <div className="overflow-x-auto">
          <table className="app-table">
            <thead>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Slot Code</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time Window (UTC)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Energy & Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    Loading energy slots...
                  </td>
                </tr>
              ) : slots.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    {selectedStationCode ? 'No energy slots found for this station.' : 'Select a station to view slots.'}
                  </td>
                </tr>
              ) : (
                slots.map((slot) => (
                  <tr key={slot.slotCode} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">
                      {slot.slotCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{new Date(slot.startTimeUtc).toLocaleString()}</div>
                      <div className="text-sm text-slate-500">to {new Date(slot.endTimeUtc).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{slot.availableEnergyKwh} kWh</div>
                      <div className="text-xs text-slate-500">${slot.pricePerKwh} / kWh</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SlotStatusBadge status={slot.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button 
                        onClick={() => handleView(slot)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      
                      {isBackoffice && (
                        <>
                          <button 
                            onClick={() => handleEdit(slot)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          
                          {/* Only show toggle for Available/Unavailable, or whatever the current status is */}
                          <button 
                            onClick={() => setStatusTarget(slot)}
                            className={`${slot.status === 'Available' ? 'text-amber-600 hover:text-amber-900' : 'text-emerald-600 hover:text-emerald-900'}`}
                          >
                            {slot.status === 'Available' ? 'Make Unavailable' : 'Make Available'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="space-y-3 md:hidden">{loading ? <div className="app-panel"><LoadingState label="Loading energy slots..." /></div> : slots.length === 0 ? <div className="app-panel"><EmptyState title="No energy slots found" description={selectedStationCode ? 'This station does not currently have energy slots.' : 'Select a station to view its slots.'} /></div> : slots.map(slot => <article key={slot.slotCode} className="app-panel p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs font-bold text-emerald-700">{slot.slotCode}</p><p className="mt-2 text-sm font-semibold text-slate-900">{new Date(slot.startTimeUtc).toLocaleString()}</p><p className="text-xs text-slate-500">to {new Date(slot.endTimeUtc).toLocaleString()}</p></div><SlotStatusBadge status={slot.status} /></div><div className="mt-4 flex gap-6 border-y border-slate-100 py-3 text-sm"><span><span className="block text-xs text-slate-500">Energy</span>{slot.availableEnergyKwh} kWh</span><span><span className="block text-xs text-slate-500">Price</span>${slot.pricePerKwh} / kWh</span></div><div className="mt-3 flex flex-wrap gap-3 text-sm font-bold"><button onClick={() => handleView(slot)} className="text-emerald-700">View</button>{isBackoffice ? <><button onClick={() => handleEdit(slot)} className="text-cyan-700">Edit</button><button onClick={() => setStatusTarget(slot)} className={slot.status === 'Available' ? 'text-amber-700' : 'text-emerald-700'}>{slot.status === 'Available' ? 'Make unavailable' : 'Make available'}</button></> : null}</div></article>)}</div>

      {showForm && (
        <SlotForm 
          slot={editingSlot} 
          stationCode={selectedStationCode}
          onClose={() => setShowForm(false)} 
          onSuccess={handleFormSuccess} 
        />
      )}

      {showDetails && (
        <SlotDetails 
          slot={selectedSlot} 
          onClose={() => setShowDetails(false)} 
        />
      )}
      <ConfirmDialog open={Boolean(statusTarget)} title={`${statusTarget?.status === 'Available' ? 'Make unavailable' : 'Make available'}`} description={`Change the availability of ${statusTarget?.slotCode || 'this slot'}?`} confirmLabel={statusTarget?.status === 'Available' ? 'Make unavailable' : 'Make available'} danger={statusTarget?.status === 'Available'} loading={statusChanging} onClose={() => setStatusTarget(null)} onConfirm={handleStatusChange} />
    </MainLayout>
  );
};

export default Slots;
