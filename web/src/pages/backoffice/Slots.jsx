import React, { useState, useEffect, useContext } from 'react';
import MainLayout from '../../layouts/MainLayout';
import apiClient from '../../services/api';
import SlotStatusBadge from '../../components/slots/SlotStatusBadge';
import SlotForm from '../../components/slots/SlotForm';
import SlotDetails from '../../components/slots/SlotDetails';
import { AuthContext } from '../../context/AuthContext';

const Slots = () => {
  const { user } = useContext(AuthContext);
  const isBackoffice = user?.role === 'Backoffice';
  
  const [stations, setStations] = useState([]);
  const [selectedStationCode, setSelectedStationCode] = useState('');
  
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Load stations on mount
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await apiClient.get('/stations');
        setStations(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedStationCode(response.data.data[0].stationCode);
        }
      } catch (err) {
        setError('Failed to load stations.');
      }
    };
    fetchStations();
  }, []);

  // Load slots when station changes
  const fetchSlots = async () => {
    if (!selectedStationCode) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get(`/stations/${selectedStationCode}/slots`);
      setSlots(response.data.data);
    } catch (err) {
      setError('Failed to load slots for the selected station.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedStationCode]);

  const handleStationChange = (e) => {
    setSelectedStationCode(e.target.value);
  };

  const handleAdd = () => {
    if (!selectedStationCode) {
      alert('Please select a station first.');
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

  const handleStatusChange = async (slotCode, currentStatus) => {
    const newStatus = currentStatus === 'Available' ? 'Unavailable' : 'Available';
    const confirmMessage = `Are you sure you want to mark slot ${slotCode} as ${newStatus}?`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
      await apiClient.patch(`/slots/${slotCode}/status`, {
        status: newStatus,
        reason: 'Status changed via Web Portal'
      });
      fetchSlots();
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
    <MainLayout title="Energy Slots" roleNav={navItems}>
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Energy Slots</h2>
          <p className="text-sm text-slate-500">Manage available energy booking slots for stations.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="station-select" className="text-sm font-medium text-slate-700">Station:</label>
            <select
              id="station-select"
              value={selectedStationCode}
              onChange={handleStationChange}
              className="mt-1 block w-48 pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              {stations.map(station => (
                <option key={station.stationCode} value={station.stationCode}>
                  {station.stationCode} - {station.name}
                </option>
              ))}
            </select>
          </div>

          {isBackoffice && (
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              + Add Slot
            </button>
          )}
        </div>
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Slot Code</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time Window (UTC)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Energy & Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
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
                            onClick={() => handleStatusChange(slot.slotCode, slot.status)}
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
    </MainLayout>
  );
};

export default Slots;
