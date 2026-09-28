import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';

const SlotForm = ({ slot, stationCode, onClose, onSuccess }) => {
  const isEditing = !!slot;
  
  // Format dates for datetime-local input (YYYY-MM-DDThh:mm)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Convert UTC to local datetime string for input
    const pad = (num) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const [formData, setFormData] = useState({
    slotCode: '',
    startTimeUtc: '',
    endTimeUtc: '',
    availableEnergyKwh: 0,
    pricePerKwh: 0
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditing && slot) {
      setFormData({
        slotCode: slot.slotCode || '',
        startTimeUtc: formatDateForInput(slot.startTimeUtc),
        endTimeUtc: formatDateForInput(slot.endTimeUtc),
        availableEnergyKwh: slot.availableEnergyKwh || 0,
        pricePerKwh: slot.pricePerKwh || 0
      });
    } else {
      // Set default times (now and 1 hour from now)
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      
      setFormData(prev => ({
        ...prev,
        startTimeUtc: formatDateForInput(now.toISOString()),
        endTimeUtc: formatDateForInput(oneHourLater.toISOString())
      }));
    }
  }, [slot, isEditing]);

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
      // Convert local datetime input back to UTC ISO string
      const payload = {
        ...formData,
        startTimeUtc: new Date(formData.startTimeUtc).toISOString(),
        endTimeUtc: new Date(formData.endTimeUtc).toISOString()
      };

      if (isEditing) {
        // Exclude slotCode from update payload
        const { slotCode, ...updatePayload } = payload;
        await apiClient.put(`/slots/${slot.slotCode}`, updatePayload);
      } else {
        await apiClient.post(`/stations/${stationCode}/slots`, payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'An error occurred while saving the slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-slate-500 opacity-75" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-xl leading-6 font-semibold text-slate-900 mb-4">
                {isEditing ? 'Edit Energy Slot' : 'Create New Energy Slot'}
              </h3>
              
              {!isEditing && (
                <p className="text-sm text-slate-500 mb-4">
                  Creating slot for station: <span className="font-mono font-medium">{stationCode}</span>
                </p>
              )}

              {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {!isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Slot Code (e.g. SLT-001)</label>
                    <input type="text" name="slotCode" value={formData.slotCode} onChange={handleChange} required
                           className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700">Start Time (Local)</label>
                  <input type="datetime-local" name="startTimeUtc" value={formData.startTimeUtc} onChange={handleChange} required
                         className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">End Time (Local)</label>
                  <input type="datetime-local" name="endTimeUtc" value={formData.endTimeUtc} onChange={handleChange} required
                         className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Available Energy (kWh)</label>
                  <input type="number" step="0.01" name="availableEnergyKwh" value={formData.availableEnergyKwh} onChange={handleChange} required
                         className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Price Per kWh ($)</label>
                  <input type="number" step="0.01" name="pricePerKwh" value={formData.pricePerKwh} onChange={handleChange} required
                         className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
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

export default SlotForm;
