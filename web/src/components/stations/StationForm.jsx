import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import apiClient from '../../services/api';
import StationLocationPicker from './StationLocationPicker';

// Converts API TimeSpan values into the HH:mm:ss format accepted by a time input.
const formatTimeForInput = (value, fallback) => {
  if (!value) return fallback;
  const match = String(value).match(/^(\d{2}):(\d{2})(?::(\d{2}))?/);
  return match ? `${match[1]}:${match[2]}:${match[3] || '00'}` : fallback;
};

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
        openingTime: formatTimeForInput(station.openingTime, '06:00:00'),
        closingTime: formatTimeForInput(station.closingTime, '18:00:00')
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

  // Applies coordinates and, when available, the address selected on the map.
  const handleLocationChange = (location) => {
    setFormData((current) => ({
      ...current,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address ?? current.address,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (formData.capacityKwh <= 0) {
        throw new Error('Station capacity must be greater than zero.');
      }
      if (formData.batteryStorageKwh < 0 || formData.batteryStorageKwh > formData.capacityKwh) {
        throw new Error('Battery storage cannot be negative or exceed station capacity.');
      }
      if (formData.openingTime >= formData.closingTime) {
        throw new Error('Opening time must be earlier than closing time.');
      }

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
      setError(err.response?.data?.detail || err.response?.data?.message || err.message || 'An error occurred while saving the station.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open onClose={() => !isSubmitting && onClose()} title={isEditing ? 'Edit solar station' : 'Connect a solar station'} description={'Infrastructure, storage and operating availability.'} size="max-w-3xl">
      <form onSubmit={handleSubmit}>
        {error && <Alert className="mb-5" title="Changes could not be saved">{error}</Alert>}
        <fieldset disabled={isSubmitting} className="grid gap-5 sm:grid-cols-2">
          <legend className="sr-only">Station information</legend>
          {!isEditing && <FormField id="station-stationCode" label="Station code" type="text" name="stationCode" value={formData.stationCode} onChange={handleChange} required />}
          <FormField id="station-name" label="Station name" type="text" name="name" value={formData.name} onChange={handleChange} required className={isEditing ? 'sm:col-span-2' : ''} />
          <div className="form-section-label sm:col-span-2"><span>01</span>Energy infrastructure</div>
          <FormField id="station-capacityKwh" label="Station capacity (kWh)" type="number" step="0.01" name="capacityKwh" value={formData.capacityKwh} onChange={handleChange} required />
          <FormField id="station-batteryStorageKwh" label="Battery storage (kWh)" type="number" step="0.01" name="batteryStorageKwh" value={formData.batteryStorageKwh} onChange={handleChange} required />
          <div className="form-section-label sm:col-span-2"><span>02</span>Network location</div>
          <div className="sm:col-span-2"><StationLocationPicker latitude={formData.latitude} longitude={formData.longitude} onLocationChange={handleLocationChange} /></div>
          <FormField id="station-address" label="Address" type="text" name="address" value={formData.address} onChange={handleChange} required className="sm:col-span-2" />
          <FormField id="station-latitude" label="Latitude" type="number" step="0.000001" name="latitude" value={formData.latitude} onChange={handleChange} required />
          <FormField id="station-longitude" label="Longitude" type="number" step="0.000001" name="longitude" value={formData.longitude} onChange={handleChange} required />
          <div className="form-section-label sm:col-span-2"><span>03</span>Operating schedule</div>
          <FormField id="station-openingTime" label="Opening time" type="time" step="1" name="openingTime" value={formData.openingTime} onChange={handleChange} required />
          <FormField id="station-closingTime" label="Closing time" type="time" step="1" name="closingTime" value={formData.closingTime} onChange={handleChange} required />
          <FormField id="station-description" label="Description" as="textarea" rows="3" name="description" value={formData.description} onChange={handleChange} className="sm:col-span-2" />
        </fieldset>
        <div className="form-actions"><Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button><Button type="submit" loading={isSubmitting}>Save station</Button></div>
      </form>
    </Modal>
  );
};
export default StationForm;
