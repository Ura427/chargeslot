import { useState } from 'react';
import {
  useCancelReservationMutation,
  useCheckInMutation,
  useGetMyReservationsQuery,
} from '../api/reservations.api';
import { formatLocalDateTime } from '../lib/date';
import { getErrorMessage } from '../lib/errors';
import { Button } from '../components/Button';

const STATUS_LABEL: Record<string, string> = {
  BOOKED: 'Booked',
  CHECKED_IN: 'Checked in',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
};

export function MyReservationsPage() {
  const {
    data: reservations,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetMyReservationsQuery();
  const [checkIn] = useCheckInMutation();
  const [cancelReservation] = useCancelReservationMutation();
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleCheckIn(id: string) {
    setActionError(null);
    try {
      await checkIn(id).unwrap();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not check in.'));
    }
  }

  async function handleCancel(id: string) {
    setActionError(null);
    try {
      await cancelReservation(id).unwrap();
    } catch (err) {
      setActionError(
        getErrorMessage(err, 'Could not cancel this reservation.'),
      );
    }
  }

  if (isLoading) {
    return <p className="text-slate-600">Loading your reservations…</p>;
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">
          {getErrorMessage(error, 'Could not load your reservations.')}
        </p>
        <Button size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!reservations || reservations.length === 0) {
    return <p className="text-slate-600">You have no reservations yet.</p>;
  }

  return (
    <div className="space-y-3">
      {actionError && <p className="text-sm text-red-600">{actionError}</p>}
      <ul className="space-y-3">
        {reservations.map((reservation) => (
          <li
            key={reservation.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
          >
            <div>
              <p className="font-medium">
                {formatLocalDateTime(reservation.slotStart)}
              </p>
              <p className="text-sm text-slate-600">
                {STATUS_LABEL[reservation.status] ?? reservation.status}
              </p>
            </div>
            {reservation.status === 'BOOKED' && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleCheckIn(reservation.id)}>
                  Check in
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleCancel(reservation.id)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
