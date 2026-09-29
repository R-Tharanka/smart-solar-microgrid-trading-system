import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  BoltIcon,
  CheckBadgeIcon,
  ClockIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import MainLayout from '../../layouts/MainLayout';
import apiClient from '../../services/api';
import { getApiError } from '../../utils/apiError';
import { isTransactionReservation, transactionStatusCounts } from '../../utils/transaction';
import FinalizeTransactionDialog from '../../components/transactions/FinalizeTransactionDialog';
import TransactionDetails from '../../components/transactions/TransactionDetails';
import VerifyTransactionPanel from '../../components/transactions/VerifyTransactionPanel';
import ReservationStatusBadge from '../../components/reservations/ReservationStatusBadge';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import PageHeader from '../../components/ui/PageHeader';
import { EmptyState, LoadingState } from '../../components/ui/PageState';
import { MetricCard } from '../../components/ui/Surface';

const statusOptions = ['All', 'QrIssued', 'Verified', 'Completed'];

export default function Transactions() {
  const { user } = useContext(AuthContext);
  const { notify } = useToast();
  const isOperator = user?.role === 'GridOperator';
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [finalizing, setFinalizing] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/reservations');
      setReservations((response.data.data || []).filter(isTransactionReservation));
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to load transaction records.').message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const counts = useMemo(() => transactionStatusCounts(reservations), [reservations]);
  const visibleTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reservations.filter((reservation) => {
      const matchesStatus = statusFilter === 'All' || reservation.status === statusFilter;
      const matchesSearch = !query
        || reservation.reservationCode?.toLowerCase().includes(query)
        || reservation.prosumerNic?.toLowerCase().includes(query)
        || reservation.stationId?.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [reservations, search, statusFilter]);

  const showDetails = async (reservationCode) => {
    try {
      setDetailsLoading(true);
      setError('');
      setSelectedTransaction({ reservationCode });
      const response = await apiClient.get(`/transactions/${encodeURIComponent(reservationCode)}`);
      setSelectedTransaction(response.data.data);
    } catch (requestError) {
      setSelectedTransaction(null);
      setError(getApiError(requestError, 'Unable to load transaction details.').message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const verify = async (request) => {
    try {
      setSubmitting(true);
      setError('');
      const response = await apiClient.post('/transactions/verify', request);
      notify(`Transaction ${response.data.data.reservationCode} verified successfully.`);
      await loadTransactions();
      await showDetails(response.data.data.reservationCode);
    } catch (requestError) {
      setError(getApiError(requestError, 'QR verification failed.').message);
    } finally {
      setSubmitting(false);
    }
  };

  const finalize = async (request) => {
    try {
      setSubmitting(true);
      setError('');
      const response = await apiClient.post('/transactions/finalize', request);
      notify(`Energy transfer ${response.data.data.reservationCode} completed.`);
      setFinalizing(null);
      await loadTransactions();
      await showDetails(response.data.data.reservationCode);
    } catch (requestError) {
      setError(getApiError(requestError, 'Transfer finalization failed.').message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout title="Energy transactions">
      <PageHeader
        eyebrow="Operator verification"
        title="Energy transactions"
        description={isOperator
          ? 'Verify secure reservation QR payloads, complete energy transfers and review the audit trail.'
          : 'Review verified and completed energy-transfer records and their operator audit trail.'}
        actions={<Button variant="secondary" icon={ArrowPathIcon} onClick={loadTransactions} loading={loading}>Refresh</Button>}
      />

      {error ? <Alert className="mb-5" title="Transaction request failed">{error}</Alert> : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Awaiting verification" value={counts.awaitingVerification} icon={ClockIcon} tone="amber" />
        <MetricCard label="Ready to finalize" value={counts.awaitingFinalization} icon={CheckBadgeIcon} tone="cyan" />
        <MetricCard label="Completed transfers" value={counts.completed} icon={BoltIcon} />
      </div>

      {isOperator ? <div className="mb-6"><VerifyTransactionPanel onVerify={verify} submitting={submitting} /></div> : null}

      <div className="app-panel-muted mb-4 grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        <FormField
          id="transaction-search"
          label="Search transactions"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Reservation code, NIC or station ID"
        />
        <FormField as="select" id="transaction-status" label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          {statusOptions.map((status) => <option key={status} value={status}>{status === 'All' ? 'All transaction states' : status}</option>)}
        </FormField>
      </div>

      <div className="app-table-wrap hidden md:block">
        <div className="overflow-x-auto">
          <table className="app-table">
            <thead><tr>{['Reservation', 'Prosumer', 'Scheduled window', 'Energy', 'Status', 'Actions'].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6"><LoadingState label="Loading transaction records..." /></td></tr>
              ) : visibleTransactions.length === 0 ? (
                <tr><td colSpan="6" className="py-14 text-center text-slate-500">No transactions match the current filters.</td></tr>
              ) : visibleTransactions.map((reservation) => (
                <tr key={reservation.reservationId}>
                  <td><span className="font-mono text-xs font-bold text-emerald-700">{reservation.reservationCode}</span></td>
                  <td><span className="font-medium text-slate-900">{reservation.prosumerNic}</span></td>
                  <td><span className="block text-slate-900">{new Date(reservation.scheduledStartTimeUtc).toLocaleString()}</span><span className="text-xs text-slate-500">to {new Date(reservation.scheduledEndTimeUtc).toLocaleString()}</span></td>
                  <td><span className="font-semibold text-slate-900">{reservation.requestedEnergyKwh} kWh</span></td>
                  <td><ReservationStatusBadge status={reservation.status} /></td>
                  <td><div className="flex flex-wrap gap-2"><Button variant="ghost" icon={MagnifyingGlassIcon} onClick={() => showDetails(reservation.reservationCode)}>Details</Button>{isOperator && reservation.status === 'Verified' ? <Button onClick={() => setFinalizing(reservation)}>Finalize</Button> : null}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? <div className="app-panel"><LoadingState label="Loading transactions..." /></div> : visibleTransactions.length === 0 ? <div className="app-panel"><EmptyState title="No transactions found" description="Try another status or search value." /></div> : visibleTransactions.map((reservation) => (
          <article key={reservation.reservationId} className="app-panel p-4">
            <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs font-bold text-emerald-700">{reservation.reservationCode}</p><p className="mt-2 text-sm font-semibold text-slate-900">{reservation.prosumerNic}</p></div><ReservationStatusBadge status={reservation.status} /></div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-3 text-sm"><div><span className="block text-xs text-slate-500">Scheduled</span>{new Date(reservation.scheduledStartTimeUtc).toLocaleString()}</div><div><span className="block text-xs text-slate-500">Energy</span>{reservation.requestedEnergyKwh} kWh</div></div>
            <div className="mt-3 flex gap-2"><Button variant="ghost" onClick={() => showDetails(reservation.reservationCode)}>Details</Button>{isOperator && reservation.status === 'Verified' ? <Button onClick={() => setFinalizing(reservation)}>Finalize</Button> : null}</div>
          </article>
        ))}
      </div>

      <FinalizeTransactionDialog reservation={finalizing} open={Boolean(finalizing)} loading={submitting} onClose={() => !submitting && setFinalizing(null)} onConfirm={finalize} />
      {selectedTransaction ? <TransactionDetails transaction={detailsLoading ? null : selectedTransaction} loading={detailsLoading} onClose={() => setSelectedTransaction(null)} /> : null}
    </MainLayout>
  );
}
