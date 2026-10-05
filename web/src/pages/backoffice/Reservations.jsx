import { useContext, useEffect, useState } from 'react';
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
  const [stations, setStations] = useState({});
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showDetails, setShowDetails] = useState(false);
  const [fullReservationDetails, setFullReservationDetails] = useState(null);
  const [reservationToApprove, setReservationToApprove] = useState(null);

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [reservationToReject, setReservationToReject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError('');

      const [reservationsResponse, stationsResponse] = await Promise.all([
        apiClient.get('/reservations'),
        apiClient.get('/stations'),
      ]);

      setReservations(reservationsResponse.data.data);

      const stationMap = {};
      stationsResponse.data.data.forEach((station) => {
        stationMap[station.id] = station;
      });
      setStations(stationMap);

      if (isBackoffice) {
        try {
          const usersResponse = await apiClient.get('/users');
          const nextUsersMap = {};

          usersResponse.data.data.forEach((account) => {
            if (account.nic) {
              nextUsersMap[account.nic] = account;
            }
          });

          setUsersMap(nextUsersMap);
        } catch (requestError) {
          console.error('Failed to load users for reservation display.', requestError);
        }
      }
    } catch (requestError) {
      setError(
        `Failed to load reservations. ${
          requestError.response?.data?.detail || ''
        }`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleView = async (reservationSummary) => {
    try {
      const response = await apiClient.get(
        `/reservations/${reservationSummary.reservationId}`,
      );

      setFullReservationDetails(response.data.data);
      setShowDetails(true);
    } catch (requestError) {
      notify(
        requestError.response?.data?.detail
          || 'Reservation details could not be loaded.',
        'error',
      );
    }
  };

  const handleApprove = async () => {
    if (!reservationToApprove) return;

    try {
      setIsSubmitting(true);
      await apiClient.post(
        `/reservations/${reservationToApprove}/approve`,
      );
      await fetchReservations();
      notify('Reservation approved successfully.');
      setReservationToApprove(null);
    } catch (requestError) {
      notify(
        requestError.response?.data?.detail
          || 'The reservation could not be approved.',
        'error',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectClick = (reservationId) => {
    setReservationToReject(reservationId);
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = async (reason) => {
    setIsSubmitting(true);

    try {
      await apiClient.post(
        `/reservations/${reservationToReject}/reject`,
        { reason },
      );

      setShowRejectDialog(false);
      setReservationToReject(null);
      await fetchReservations();
      notify('Reservation rejected successfully.');
    } catch (requestError) {
      notify(
        requestError.response?.data?.detail
          || 'The reservation could not be rejected.',
        'error',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReservations = reservations.filter((reservation) => {
    const matchesStatus = statusFilter === 'All'
      || reservation.status === statusFilter;

    const searchValue = searchQuery.toLowerCase();

    const matchesSearch = reservation.reservationCode
      .toLowerCase()
      .includes(searchValue)
      || reservation.prosumerNic.toLowerCase().includes(searchValue)
      || reservation.stationId.toLowerCase().includes(searchValue);

    return matchesStatus && matchesSearch;
  });

  return (
    <MainLayout title="Reservations">
      <PageHeader
        eyebrow="Booking operations"
        title="Reservation management"
        description="Search, review and progress Prosumer energy reservations."
        actions={(
          <Button
            variant="secondary"
            icon={ArrowPathIcon}
            onClick={fetchReservations}
            loading={loading}
          >
            Refresh
          </Button>
        )}
      />

      {!loading && !error ? (
        <div className="reservation-pulse" aria-label="Reservation summary">
          {[
            ['Pending', 'Awaiting approval'],
            ['Approved', 'Approved bookings'],
            ['Completed', 'Completed exchanges'],
            ['Rejected', 'Rejected'],
            ['Cancelled', 'Cancelled'],
          ].map(([status, label]) => (
            <button
              type="button"
              key={status}
              onClick={() => setStatusFilter(status)}
              aria-pressed={statusFilter === status}
              className={statusFilter === status ? 'selected' : ''}
            >
              <span>{label}</span>
              <strong>
                {
                  reservations.filter(
                    (reservation) => reservation.status === status,
                  ).length
                }
              </strong>
            </button>
          ))}
        </div>
      ) : null}

      <div className="app-panel-muted mb-5 grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_15rem]">
        <FormField
          id="reservation-search"
          label="Search reservations"
          type="text"
          placeholder="Search code, NIC, or station..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />

        <FormField
          as="select"
          id="reservation-status"
          label="Status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="All">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Cancelled">Cancelled</option>
          <option value="QrIssued">QR issued</option>
          <option value="Verified">Verified</option>
          <option value="Completed">Completed</option>
          <option value="Expired">Expired</option>
        </FormField>
      </div>

      {error ? (
        <Alert className="mb-5" title="Unable to load reservations">
          {error}
        </Alert>
      ) : null}

      <div className="app-table-wrap hidden md:block">
        <div className="overflow-x-auto">
          <table className="app-table">
            <thead>
              <tr>
                <th scope="col">Code / Prosumer</th>
                <th scope="col">Station</th>
                <th scope="col">Energy &amp; date</th>
                <th scope="col">Status</th>
                <th scope="col" className="text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Loading reservations...
                  </td>
                </tr>
              ) : filteredReservations.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No reservations found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((reservation) => {
                  const prosumer = usersMap[reservation.prosumerNic];
                  const station = stations[reservation.stationId];

                  return (
                    <tr
                      key={reservation.reservationId}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="font-mono text-sm font-medium text-emerald-700">
                          {reservation.reservationCode}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                          {prosumer
                            ? `${prosumer.firstName} ${prosumer.lastName}`
                            : 'Prosumer'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {reservation.prosumerNic}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">
                          {station?.name || 'Unknown station'}
                        </div>
                        <div className="font-mono text-xs text-slate-500">
                          {station?.stationCode || reservation.stationId}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">
                          {reservation.requestedEnergyKwh} kWh
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(
                            reservation.scheduledStartTimeUtc,
                          ).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <ReservationStatusBadge
                          status={reservation.status}
                        />
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => handleView(reservation)}
                          >
                            Details
                          </Button>

                          {isBackoffice
                            && reservation.status === 'Pending' ? (
                              <>
                                <Button
                                  onClick={() => setReservationToApprove(
                                    reservation.reservationId,
                                  )}
                                >
                                  Approve
                                </Button>

                                <Button
                                  variant="danger"
                                  onClick={() => handleRejectClick(
                                    reservation.reservationId,
                                  )}
                                >
                                  Reject
                                </Button>
                              </>
                            ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="app-panel">
            <LoadingState label="Loading reservations..." />
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="app-panel">
            <EmptyState
              title="No matching reservations"
              description="Adjust the search or status filter and try again."
            />
          </div>
        ) : (
          filteredReservations.map((reservation) => {
            const prosumer = usersMap[reservation.prosumerNic];
            const station = stations[reservation.stationId];

            return (
              <article
                key={reservation.reservationId}
                className="app-panel p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="asset-code">
                      {reservation.reservationCode}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {reservation.requestedEnergyKwh} kWh
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(
                        reservation.scheduledStartTimeUtc,
                      ).toLocaleDateString()}
                      {' · '}
                      {station?.name || reservation.stationId}
                    </p>
                  </div>

                  <ReservationStatusBadge status={reservation.status} />
                </div>

                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {prosumer
                      ? `${prosumer.firstName} ${prosumer.lastName}`
                      : 'Prosumer'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {reservation.prosumerNic}
                  </p>
                </div>

                <div className="asset-actions">
                  <Button
                    variant="secondary"
                    onClick={() => handleView(reservation)}
                  >
                    Details
                  </Button>

                  {isBackoffice
                    && reservation.status === 'Pending' ? (
                      <>
                        <Button
                          onClick={() => setReservationToApprove(
                            reservation.reservationId,
                          )}
                        >
                          Approve
                        </Button>

                        <Button
                          variant="danger"
                          onClick={() => handleRejectClick(
                            reservation.reservationId,
                          )}
                        >
                          Reject
                        </Button>
                      </>
                    ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>

      {showDetails ? (
        <ReservationDetails
          reservation={fullReservationDetails}
          stations={stations}
          usersMap={usersMap}
          onClose={() => {
            setShowDetails(false);
            setFullReservationDetails(null);
          }}
        />
      ) : null}

      {showRejectDialog ? (
        <RejectDialog
          isOpen={showRejectDialog}
          isSubmitting={isSubmitting}
          onClose={() => {
            setShowRejectDialog(false);
            setReservationToReject(null);
          }}
          onConfirm={handleRejectConfirm}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(reservationToApprove)}
        title="Approve reservation"
        description="Approve this reservation and allow it to proceed to the next workflow stage?"
        confirmLabel="Approve reservation"
        danger={false}
        loading={isSubmitting}
        onClose={() => setReservationToApprove(null)}
        onConfirm={handleApprove}
      />
    </MainLayout>
  );
};

export default Reservations;