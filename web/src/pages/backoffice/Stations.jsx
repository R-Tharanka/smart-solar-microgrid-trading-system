import React, { useState, useEffect, useContext } from 'react';
import MainLayout from '../../layouts/MainLayout';
import apiClient from '../../services/api';
import StationStatusBadge from '../../components/stations/StationStatusBadge';
import StationForm from '../../components/stations/StationForm';
import StationDetails from '../../components/stations/StationDetails';
import { AuthContext } from '../../context/AuthContext';

const Stations = () => {
  const { user } = useContext(AuthContext);
  const isBackoffice = user?.role === 'Backoffice';
  
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  
  const [showDetails, setShowDetails] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);

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

  const handleStatusChange = async (stationCode, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Deactivated' : 'Active';
    const confirmMessage = `Are you sure you want to ${newStatus.toLowerCase()} station ${stationCode}?`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
      await apiClient.patch(`/stations/${stationCode}/status`, {
        status: newStatus,
        reason: 'Status changed via Web Portal'
      });
      fetchStations();
    } catch (err) {
      alert('Failed to change status: ' + (err.response?.data?.detail || err.response?.data?.message || 'Unknown error'));
    }
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
    <MainLayout title="Microgrid Nodes (Stations)" roleNav={navItems}>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Solar Stations</h2>
          <p className="text-sm text-slate-500">Manage all physical microgrid node locations and capacities.</p>
        </div>
        
        {isBackoffice && (
          <button
            onClick={handleAdd}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            + Add Station
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Code</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name & Location</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Capacity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
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
                            onClick={() => handleStatusChange(station.stationCode, station.status)}
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
    </MainLayout>
  );
};

export default Stations;
