import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';

const StationForm = ({ station, onClose, onSuccess }) => {
  const isEditing = !!station;
  
  const [formData, setFormData] = useState({
    stationCode: '',
    name: '',
    description: '',
    latitude: 0,
    longitude: 0,
    address: '',
    capacityKwh: 0,
    batteryStorageKwh: 0,
    openingTime: '06:00:00',
    closingTime: '18:00:00'
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditing && station) {
      setFormData({
        stationCode: station.stationCode || '',
        name: station.name || '',
        description: station.description || '',
        latitude: station.latitude || 0,
        longitude: station.longitude || 0,
        address: station.address || '',
        capacityKwh: station.capacityKwh || 0,
        batteryStorageKwh: station.batteryStorageKwh || 0,
        openingTime: station.openingTime || '06:00:00',
        closingTime: station.closingTime || '18:00:00'
      });
    }
  }, [station, isEditing]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let finalValue = value;
    
    if (type === 'number') {
      finalValue = value ? parseFloat(value) : 0;
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isEditing) {
        // Exclude stationCode from the update payload
        const updatePayload = { ...formData };
        delete updatePayload.stationCode;
        await apiClient.put(`/stations/${station.stationCode}`, updatePayload);
      } else {
        await apiClient.post('/stations', formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'An error occurred while saving the station.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-graphite-950/75 backdrop-blur-sm" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="legacy-dialog inline-block w-full max-w-3xl align-bottom sm:my-8 sm:align-middle">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-xl leading-6 font-semibold text-slate-900 mb-4">
                {isEditing ? 'Edit Solar Station' : 'Create New Solar Station'}
              </h3>

              {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Station Code (e.g. STN-001)</label>
                    <input type="text" name="stationCode" value={formData.stationCode} onChange={handleChange} required
                           className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                )}
                
                <div className={!isEditing ? '' : 'md:col-span-2'}>
                  <label className="block text-sm font-medium text-slate-700">Station Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required
                         className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Capacity (kWh)</label>
                  <input type="number" step="0.01" name="capacityKwh" value={formData.capacityKwh} onChange={handleChange} required
                         className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Battery Storage (kWh)</label>
                  <input type="number" step="0.01" name="batteryStorageKwh" value={formData.batteryStorageKwh} onChange={handleChange} required
                         className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} required
                         className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Latitude</label>
                  <input type="number" step="0.000001" name="latitude" value={formData.latitude} onChange={handleChange} required
                         className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Longitude</label>
                  <input type="number" step="0.000001" name="longitude" value={formData.longitude} onChange={handleChange} required
                         className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Opening Time</label>
                  <input type="time" step="1" name="openingTime" value={formData.openingTime} onChange={handleChange} required
                         className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Closing Time</label>
                  <input type="time" step="1" name="closingTime" value={formData.closingTime} onChange={handleChange} required
                         className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} rows="3"
                            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StationForm;
