import React, { useState, useEffect, useContext } from 'react';
import MainLayout from '../../layouts/MainLayout';
import apiClient from '../../services/api';
import ReservationStatusBadge from '../../components/reservations/ReservationStatusBadge';
import ReservationDetails from '../../components/reservations/ReservationDetails';
import RejectDialog from '../../components/reservations/RejectDialog';
import { AuthContext } from '../../context/AuthContext';

const Reservations = () => {
  const { user } = useContext(AuthContext);
  const isBackoffice = user?.role === 'Backoffice';
  
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showDetails, setShowDetails] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [fullReservationDetails, setFullReservationDetails] = useState(null);

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [reservationToReject, setReservationToReject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtering states
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError('');
      // You can pass status or stationId as query params, but here we'll load all and filter client-side for simplicity as suggested
      const response = await apiClient.get('/reservations');
      setReservations(response.data.data);
    } catch (err) {
      setError('Failed to load reservations. ' + (err.response?.data?.detail || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleView = async (reservationSummary) => {
    try {
      // Fetch full details
      const response = await apiClient.get(`/reservations/${reservationSummary.reservationId}`);
      setFullReservationDetails(response.data.data);
      setShowDetails(true);
    } catch (err) {
      alert('Failed to load reservation details: ' + (err.response?.data?.detail || ''));
    }
  };

  const handleApprove = async (reservationId) => {
    if (!window.confirm('Are you sure you want to approve this reservation?')) return;
    
    try {
      await apiClient.post(`/reservations/${reservationId}/approve`);
      fetchReservations();
    } catch (err) {
      alert('Failed to approve: ' + (err.response?.data?.detail || err.response?.data?.message || 'Unknown error'));
    }
  };

  const handleRejectClick = (reservationId) => {
    setReservationToReject(reservationId);
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = async (reason) => {
    setIsSubmitting(true);
    try {
      await apiClient.post(`/reservations/${reservationToReject}/reject`, { reason });
      setShowRejectDialog(false);
      setReservationToReject(null);
      fetchReservations();
    } catch (err) {
      alert('Failed to reject: ' + (err.response?.data?.detail || err.response?.data?.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derived state for filtering
  const filteredReservations = reservations.filter(res => {
    const matchesStatus = statusFilter === 'All' || res.status === statusFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      res.reservationCode.toLowerCase().includes(searchLower) ||
      res.prosumerNic.toLowerCase().includes(searchLower) ||
      res.stationId.toLowerCase().includes(searchLower);
    
    return matchesStatus && matchesSearch;
  });

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
    <MainLayout title="Reservations" roleNav={navItems}>
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Reservation Management</h2>
          <p className="text-sm text-slate-500">Monitor and manage prosumer energy reservations.</p>
        </div>
        
        <button
          onClick={fetchReservations}
          className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search code, NIC, or station..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="w-full md:w-1/4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
            <option value="QrIssued">QrIssued</option>
            <option value="Verified">Verified</option>
            <option value="Completed">Completed</option>
            <option value="Expired">Expired</option>
          </select>
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Code / Prosumer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Station</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Energy & Date (UTC)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    Loading reservations...
                  </td>
                </tr>
              ) : filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No reservations found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((res) => (
                  <tr key={res.reservationId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-medium text-blue-600">{res.reservationCode}</div>
                      <div className="text-sm text-slate-500">{res.prosumerNic}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-slate-900">{res.stationId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{res.requestedEnergyKwh} kWh</div>
                      <div className="text-xs text-slate-500">{new Date(res.scheduledStartTimeUtc).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ReservationStatusBadge status={res.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button 
                        onClick={() => handleView(res)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      
                      {isBackoffice && res.status === 'Pending' && (
                        <>
                          <button 
                            onClick={() => handleApprove(res.reservationId)}
                            className="text-emerald-600 hover:text-emerald-900"
                          >
                            Approve
                          </button>
                          
                          <button 
                            onClick={() => handleRejectClick(res.reservationId)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
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

      {showDetails && (
        <ReservationDetails 
          reservation={fullReservationDetails} 
          onClose={() => {
            setShowDetails(false);
            setFullReservationDetails(null);
          }} 
        />
      )}

      {showRejectDialog && (
        <RejectDialog
          isOpen={showRejectDialog}
          isSubmitting={isSubmitting}
          onClose={() => {
            setShowRejectDialog(false);
            setReservationToReject(null);
          }}
          onConfirm={handleRejectConfirm}
        />
      )}
    </MainLayout>
  );
};

export default Reservations;
