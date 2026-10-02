import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useGetAvailabilityQuery } from '../api/stations.api';
import { useCreateReservationMutation } from '../api/reservations.api';
import { utcDateString, formatLocalTime } from '../lib/date';
import { getErrorCode, getErrorMessage } from '../lib/errors';
import { SlotButton } from '../components/SlotButton';
import { Button } from '../components/Button';

const DATE_OPTIONS = [
  { label: 'Today', value: utcDateString(0) },
  { label: 'Tomorrow', value: utcDateString(1) },
];

export function StationDetailPage() {
  const { stationId } = useParams<{ stationId: string }>();
  const [date, setDate] = useState(DATE_OPTIONS[0].value);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [pendingSlot, setPendingSlot] = useState<{
    chargerId: string;
    slotStart: string;
  } | null>(null);

  const {
    data: availability,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAvailabilityQuery(
    { stationId: stationId ?? '', date },
    { skip: !stationId },
  );

  const [createReservation, { isLoading: isBooking }] =
    useCreateReservationMutation();

  // TODO(user): once useLiveAvailability is implemented, call it here
  // (e.g. `useLiveAvailability(stationId ?? '')`) to patch the cache live;
  // the refetch() call in handleBook below stays as the working fallback.

  async function handleConfirmBook() {
    if (!pendingSlot) return;
    setBookingError(null);
    try {
      await createReservation(pendingSlot).unwrap();
      setPendingSlot(null);
    } catch (err) {
      if (getErrorCode(err) === 'SLOT_TAKEN') {
        setBookingError('This slot was just taken by someone else.');
        setPendingSlot(null);
        refetch();
      } else {
        setBookingError(getErrorMessage(err, 'Could not book this slot.'));
      }
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm text-slate-600 hover:text-slate-900">
        ← Back to stations
      </Link>

      <div className="flex gap-2">
        {DATE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={option.value === date ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setDate(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {isLoading && <p className="text-slate-600">Loading availability…</p>}

      {isError && (
        <div className="space-y-3">
          <p className="text-sm text-red-600">
            {getErrorMessage(error, 'Could not load availability.')}
          </p>
          <Button size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {bookingError && <p className="text-sm text-red-600">{bookingError}</p>}

      {pendingSlot && (
        <div className="flex items-center justify-between rounded-lg border border-slate-300 bg-slate-50 p-3">
          <p className="text-sm">
            Book the slot at{' '}
            <span className="font-medium">
              {formatLocalTime(pendingSlot.slotStart)}
            </span>
            ?
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleConfirmBook} disabled={isBooking}>
              {isBooking ? 'Booking…' : 'Confirm'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPendingSlot(null)}
              disabled={isBooking}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {availability && availability.chargers.length === 0 && (
        <p className="text-slate-600">No chargers at this station.</p>
      )}

      {availability?.chargers.map((charger) => (
        <div
          key={charger.chargerId}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <p className="font-medium">
            {charger.connectorType} · {charger.powerKw} kW
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
            {charger.slots.map((slot) => (
              <SlotButton
                key={slot.slotStart}
                status={slot.status}
                label={formatLocalTime(slot.slotStart)}
                disabled={isBooking}
                onClick={() =>
                  setPendingSlot({
                    chargerId: charger.chargerId,
                    slotStart: slot.slotStart,
                  })
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
