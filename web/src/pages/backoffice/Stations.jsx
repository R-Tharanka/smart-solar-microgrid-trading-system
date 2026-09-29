import { useState, useEffect, useContext } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import MainLayout from '../../layouts/MainLayout';
import apiClient from '../../services/api';
import StationStatusBadge from '../../components/stations/StationStatusBadge';
import StationForm from '../../components/stations/StationForm';
import StationDetails from '../../components/stations/StationDetails';
import { AuthContext } from '../../context/AuthContext';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PageHeader from '../../components/ui/PageHeader';
import { EmptyState, LoadingState } from '../../components/ui/PageState';
import { useToast } from '../../context/ToastContext';

const Stations = () => {
  const { user } = useContext(AuthContext);
  const isBackoffice = user?.role === 'Backoffice';
  const { notify } = useToast();
  
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  
  const [showDetails, setShowDetails] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusChanging, setStatusChanging] = useState(false);

  const fetchStations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/stations');
      setStations(response.data.data);
    } catch (err) {
      setError('Failed to load stations. ' + (err.response?.data?.detail || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleAdd = () => {
    setEditingStation(null);
    setShowForm(true);
  };

  const handleEdit = (station) => {
    setEditingStation(station);
    setShowForm(true);
  };

  const handleView = (station) => {
    setSelectedStation(station);
    setShowDetails(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchStations();
  };

  const handleStatusChange = async () => {
    if (!statusTarget) return;
    const newStatus = statusTarget.status === 'Active' ? 'Deactivated' : 'Active';
    try {
      setStatusChanging(true);
      await apiClient.patch(`/stations/${statusTarget.stationCode}/status`, {
        status: newStatus,
        reason: 'Status changed via Web Portal'
      });
      await fetchStations();
      notify(`Station ${statusTarget.stationCode} is now ${newStatus.toLowerCase()}.`);
      setStatusTarget(null);
    } catch (err) {
      notify(err.response?.data?.detail || 'The station status could not be changed.', 'error');
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
    <MainLayout title="Microgrid nodes" roleNav={navItems}>
      <PageHeader eyebrow="Infrastructure" title="Solar stations" description="Review physical microgrid locations, generation capacity and operating status." actions={isBackoffice ? <Button icon={PlusIcon} onClick={handleAdd}>Add station</Button> : null} />

      {error && (
        <Alert className="mb-5" title="Unable to load stations">{error}</Alert>
      )}

      <div className="app-table-wrap hidden md:block">
        <div className="overflow-x-auto">
          <table className="app-table">
            <thead>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Code</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name & Location</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Capacity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    Loading stations...
                  </td>
                </tr>
              ) : stations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No stations found. Create one to get started.
                  </td>
                </tr>
              ) : (
                stations.map((station) => (
                  <tr key={station.stationCode} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">
                      {station.stationCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{station.name}</div>
                      <div className="text-sm text-slate-500 truncate max-w-xs" title={station.address}>{station.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{station.capacityKwh} kWh</div>
                      <div className="text-xs text-slate-500">Bat: {station.batteryStorageKwh} kWh</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StationStatusBadge status={station.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button 
                        onClick={() => handleView(station)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      
                      {isBackoffice && (
                        <>
                          <button 
                            onClick={() => handleEdit(station)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          
                          <button 
                            onClick={() => setStatusTarget(station)}
                            className={`${station.status === 'Active' ? 'text-amber-600 hover:text-amber-900' : 'text-emerald-600 hover:text-emerald-900'}`}
                          >
                            {station.status === 'Active' ? 'Deactivate' : 'Activate'}
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

      <div className="space-y-3 md:hidden">
        {loading ? <div className="app-panel"><LoadingState label="Loading stations..." /></div> : stations.length === 0 ? <div className="app-panel"><EmptyState title="No stations found" description="Create a station to begin publishing microgrid capacity." /></div> : stations.map((station) => (
          <article key={station.stationCode} className="app-panel p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-xs font-bold text-emerald-700">{station.stationCode}</p><h3 className="mt-1 truncate font-bold text-slate-950">{station.name}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-500">{station.address}</p></div><StationStatusBadge status={station.status} /></div><div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-3 text-sm"><span><span className="block text-xs text-slate-500">Capacity</span>{station.capacityKwh} kWh</span><span><span className="block text-xs text-slate-500">Battery</span>{station.batteryStorageKwh} kWh</span></div><div className="mt-3 flex flex-wrap gap-3 text-sm font-bold"><button onClick={() => handleView(station)} className="text-emerald-700">View</button>{isBackoffice ? <><button onClick={() => handleEdit(station)} className="text-cyan-700">Edit</button><button onClick={() => setStatusTarget(station)} className={station.status === 'Active' ? 'text-amber-700' : 'text-emerald-700'}>{station.status === 'Active' ? 'Deactivate' : 'Activate'}</button></> : null}</div></article>
        ))}
      </div>

      {showForm && (
        <StationForm 
          station={editingStation} 
          onClose={() => setShowForm(false)} 
          onSuccess={handleFormSuccess} 
        />
      )}

      {showDetails && (
        <StationDetails 
          station={selectedStation} 
          onClose={() => setShowDetails(false)} 
        />
      )}
      <ConfirmDialog open={Boolean(statusTarget)} title={`${statusTarget?.status === 'Active' ? 'Deactivate' : 'Activate'} station`} description={`Change the operating status of ${statusTarget?.stationCode || 'this station'}?`} confirmLabel={statusTarget?.status === 'Active' ? 'Deactivate' : 'Activate'} danger={statusTarget?.status === 'Active'} loading={statusChanging} onClose={() => setStatusTarget(null)} onConfirm={handleStatusChange} />
    </MainLayout>
  );
};

export default Stations;
