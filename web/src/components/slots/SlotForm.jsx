import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import apiClient from '../../services/api';

const SlotForm = ({ slot, stationCode, onClose, onSuccess }) => {
  const isEditing = !!slot;
  
  // Format a UTC timestamp into a timezone-aware local datetime string for the input.
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const pad = (num) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  // Convert the local datetime value from the form back to an ISO string.
  const toUtcIsoString = (value) => new Date(value).toISOString();

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
      // Submit exactly the UTC date and time shown in the form.
      const payload = {
        ...formData,
        startTimeUtc: toUtcIsoString(formData.startTimeUtc),
        endTimeUtc: toUtcIsoString(formData.endTimeUtc)
      };

      if (isEditing) {
        // Exclude slotCode from update payload
        const updatePayload = { ...payload };
        delete updatePayload.slotCode;
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
    <Modal open onClose={() => !isSubmitting && onClose()} title={isEditing ? 'Edit energy window' : 'Publish an energy window'} description={isEditing ? slot.slotCode : `Station / ${stationCode}`} size="max-w-xl">
      <form onSubmit={handleSubmit}>
        {error && <Alert className="mb-5" title="Changes could not be saved">{error}</Alert>}
        <fieldset disabled={isSubmitting} className="grid gap-5 sm:grid-cols-2">
          <legend className="sr-only">Energy window information</legend>
          {!isEditing && <FormField id="slot-slotCode" label="Slot code" type="text" name="slotCode" value={formData.slotCode} onChange={handleChange} required className="sm:col-span-2" />}
          <div className="form-section-label sm:col-span-2"><span>01</span>Availability window</div>
          <FormField id="slot-startTimeUtc" label="Start time" type="datetime-local" name="startTimeUtc" value={formData.startTimeUtc} onChange={handleChange} required />
          <FormField id="slot-endTimeUtc" label="End time" type="datetime-local" name="endTimeUtc" value={formData.endTimeUtc} onChange={handleChange} required />
          <div className="form-section-label sm:col-span-2"><span>02</span>Energy & pricing</div>
          <FormField id="slot-availableEnergyKwh" label="Energy capacity (kWh)" type="number" step="0.01" name="availableEnergyKwh" value={formData.availableEnergyKwh} onChange={handleChange} required />
          <FormField id="slot-pricePerKwh" label="Price per kWh ($)" type="number" step="0.01" name="pricePerKwh" value={formData.pricePerKwh} onChange={handleChange} required />
        </fieldset>
        <div className="form-actions"><Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button><Button type="submit" loading={isSubmitting}>Save energy window</Button></div>
      </form>
    </Modal>
  );
};
export default SlotForm;
