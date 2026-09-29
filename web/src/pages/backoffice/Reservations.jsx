import { useState, useEffect, useContext } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import MainLayout from '../../layouts/MainLayout';
import apiClient from '../../services/api';
import ReservationStatusBadge from '../../components/reservations/ReservationStatusBadge';
import ReservationDetails from '../../components/reservations/ReservationDetails';
import RejectDialog from '../../components/reservations/RejectDialog';
import { AuthContext } from '../../context/AuthContext';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FormField from '../../components/ui/FormField';
import PageHeader from '../../components/ui/PageHeader';
import { EmptyState, LoadingState } from '../../components/ui/PageState';
import { useToast } from '../../context/ToastContext';

const Reservations = () => {
  const { user } = useContext(AuthContext);
  const isBackoffice = user?.role === 'Backoffice';
  const { notify } = useToast();
  
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showDetails, setShowDetails] = useState(false);
  const [fullReservationDetails, setFullReservationDetails] = useState(null);
  const [reservationToApprove, setReservationToApprove] = useState(null);

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
      notify(err.response?.data?.detail || 'Reservation details could not be loaded.', 'error');
    }
  };

  const handleApprove = async () => {
    if (!reservationToApprove) return;
    try {
      setIsSubmitting(true);
      await apiClient.post(`/reservations/${reservationToApprove}/approve`);
      await fetchReservations();
      notify('Reservation approved successfully.');
      setReservationToApprove(null);
    } catch (err) {
      notify(err.response?.data?.detail || 'The reservation could not be approved.', 'error');
    } finally { setIsSubmitting(false); }
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
      await fetchReservations();
      notify('Reservation rejected successfully.');
    } catch (err) {
      notify(err.response?.data?.detail || 'The reservation could not be rejected.', 'error');
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
      <PageHeader eyebrow="Booking operations" title="Reservation management" description="Search, review and progress Prosumer energy reservations." actions={<Button variant="secondary" icon={ArrowPathIcon} onClick={fetchReservations} loading={loading}>Refresh</Button>} />

      <div className="app-panel-muted mb-5 grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_15rem]">
          <FormField id="reservation-search" label="Search reservations"
            type="text"
            placeholder="Search code, NIC, or station..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FormField as="select" id="reservation-status" label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
          </FormField>
      </div>

      {error && (
        <Alert className="mb-5" title="Unable to load reservations">{error}</Alert>
      )}

      <div className="app-table-wrap hidden md:block">
        <div className="overflow-x-auto">
          <table className="app-table">
            <thead>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Code / Prosumer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Station</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Energy & Date (UTC)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
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
                            onClick={() => setReservationToApprove(res.reservationId)}
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
      <div className="space-y-3 md:hidden">{loading ? <div className="app-panel"><LoadingState label="Loading reservations..." /></div> : filteredReservations.length === 0 ? <div className="app-panel"><EmptyState title="No matching reservations" description="Adjust the search or status filter and try again." /></div> : filteredReservations.map(res => <article key={res.reservationId} className="app-panel p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs font-bold text-emerald-700">{res.reservationCode}</p><p className="mt-1 text-sm font-semibold text-slate-900">{res.requestedEnergyKwh} kWh</p><p className="text-xs text-slate-500">{new Date(res.scheduledStartTimeUtc).toLocaleDateString()} · {res.stationId}</p></div><ReservationStatusBadge status={res.status} /></div><p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">Prosumer {res.prosumerNic}</p><div className="mt-3 flex gap-3 text-sm font-bold"><button onClick={() => handleView(res)} className="text-emerald-700">View</button>{isBackoffice && res.status === 'Pending' ? <><button onClick={() => setReservationToApprove(res.reservationId)} className="text-cyan-700">Approve</button><button onClick={() => handleRejectClick(res.reservationId)} className="text-red-700">Reject</button></> : null}</div></article>)}</div>

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
      <ConfirmDialog open={Boolean(reservationToApprove)} title="Approve reservation" description="Approve this reservation and allow it to proceed to the next workflow stage?" confirmLabel="Approve reservation" danger={false} loading={isSubmitting} onClose={() => setReservationToApprove(null)} onConfirm={handleApprove} />
    </MainLayout>
  );
};

export default Reservations;
