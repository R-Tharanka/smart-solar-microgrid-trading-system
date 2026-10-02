import apiClient from './api';

export const getPendingProsumers = () => apiClient.get('/users/prosumers/pending');
export const activateProsumer = (nic) => apiClient.post(`/users/prosumers/${encodeURIComponent(nic)}/activate`);
export const rejectProsumer = (nic, reason) => apiClient.post(`/users/prosumers/${encodeURIComponent(nic)}/reject`, { reason });
