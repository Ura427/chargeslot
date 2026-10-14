import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useCancelReservationMutation,
  useCheckInMutation,
  useGetMyReservationsQuery,
  type ReservationStatus,
  type ReservationWithStation,
} from '../api/reservations.api';
import { connectorLabel } from '../lib/connectors';
import { formatStationDateTime, formatStationTime } from '../lib/date';
import { getErrorMessage } from '../lib/errors';
import { Button } from '../components/Button';
import { SpeedBadge } from '../components/SpeedBadge';
import { StationPhoto } from '../components/StationCard';

// Mirrors CHECK_IN_WINDOW_MS on the API.
const CHECK_IN_WINDOW_MS = 10 * 60 * 1000;
const ACTIVE: ReservationStatus[] = ['BOOKED', 'CHECKED_IN'];

const STATUS_STYLE: Record<ReservationStatus, string> = {
  BOOKED: 'bg-brand-50 text-brand-800',
  CHECKED_IN: 'bg-blue-50 text-blue-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
  EXPIRED: 'bg-amber-50 text-amber-700',
};

const STATUS_LABEL: Record<ReservationStatus, string> = {
  BOOKED: 'Booked',
  CHECKED_IN: 'Checked in',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Missed',
};

// Re-renders every 30s so the check-in button appears when its window opens.
function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

interface RowProps {
  reservation: ReservationWithStation;
  now: number;
  busy: boolean;
  onCheckIn: (id: string) => void;
  onCancel: (id: string) => void;
}

function ReservationRow({
  reservation,
  now,
  busy,
  onCheckIn,
  onCancel,
}: RowProps) {
  const { station } = reservation.charger;
  const start = Date.parse(reservation.slotStart);
  const canCheckIn =
    reservation.status === 'BOOKED' &&
    now >= start &&
    now <= start + CHECK_IN_WINDOW_MS;
  const notYet = reservation.status === 'BOOKED' && now < start;

  return (
    <li className="flex gap-4 rounded-2xl border border-slate-200 bg-surface p-3 shadow-sm sm:p-4">
      <Link to={`/stations/${station.id}`} className="shrink-0">
        <StationPhoto
          imageUrl={station.imageUrl}
          className="size-20 rounded-xl sm:size-24"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[reservation.status]}`}
            >
              {STATUS_LABEL[reservation.status]}
            </span>
            <SpeedBadge powerKw={reservation.charger.powerKw} showKw={false} />
          </div>
          <p className="mt-1 truncate font-semibold">{station.name}</p>
          <p className="text-sm text-slate-600">
            {formatStationDateTime(reservation.slotStart, station.timeZone)} ·{' '}
            {connectorLabel(reservation.charger.connectorType)},{' '}
            {reservation.charger.powerKw} kW
          </p>
          {notYet && (
            <p className="mt-0.5 text-xs text-slate-500">
              Check-in opens at{' '}
              {formatStationTime(reservation.slotStart, station.timeZone)}
            </p>
          )}
        </div>
        {reservation.status === 'BOOKED' && (
          <div className="flex shrink-0 gap-2">
            {canCheckIn && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => onCheckIn(reservation.id)}
              >
                Check in
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => onCancel(reservation.id)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}

export function MyReservationsPage() {
  const {
    data: reservations,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetMyReservationsQuery();
  const [checkIn, { isLoading: checkingIn }] = useCheckInMutation();
  const [cancelReservation, { isLoading: cancelling }] =
    useCancelReservationMutation();
  const [actionError, setActionError] = useState<string | null>(null);
  const now = useNow();

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

  const all = reservations ?? [];
  const upcoming = all
    .filter(
      (r) =>
        ACTIVE.includes(r.status) &&
        Date.parse(r.slotStart) + 30 * 60 * 1000 > now,
    )
    .sort((a, b) => Date.parse(a.slotStart) - Date.parse(b.slotStart));
  const past = all.filter((r) => !upcoming.includes(r));

  const rowProps = {
    now,
    busy: checkingIn || cancelling,
    onCheckIn: handleCheckIn,
    onCancel: handleCancel,
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        My reservations
      </h1>

      {isLoading && (
        <div className="space-y-3" aria-busy="true">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-800">
            {getErrorMessage(error, 'Could not load your reservations.')}
          </p>
          <Button size="sm" className="mt-3" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {actionError && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {actionError}
        </p>
      )}

      {reservations && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
            Upcoming
          </h2>
          {upcoming.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-surface p-8 text-center">
              <p className="font-semibold">Nothing booked</p>
              <p className="mt-1 text-sm text-slate-500">
                Find a charger near your route and reserve a slot.
              </p>
              <Link
                to="/"
                className="mt-4 inline-flex rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
              >
                Browse stations
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((r) => (
                <ReservationRow key={r.id} reservation={r} {...rowProps} />
              ))}
            </ul>
          )}
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
            Past
          </h2>
          <ul className="space-y-3 opacity-80">
            {past.map((r) => (
              <ReservationRow key={r.id} reservation={r} {...rowProps} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
