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

  async function handleBook(chargerId: string, slotStart: string) {
    setBookingError(null);
    try {
      await createReservation({ chargerId, slotStart }).unwrap();
    } catch (err) {
      if (getErrorCode(err) === 'SLOT_TAKEN') {
        setBookingError('This slot was just taken by someone else.');
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
                onClick={() => handleBook(charger.chargerId, slot.slotStart)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
