import { useEffect } from 'react';
import { formatStationTime } from '../lib/date';
import { Button } from './Button';
import { SpeedBadge } from './SpeedBadge';
import { connectorLabel } from '../lib/connectors';

export interface BookingDetails {
  stationName: string;
  chargerNumber: number;
  connectorType: string;
  powerKw: number;
  slotStart: string;
  timeZone: string;
  dateLabel: string;
}

interface BookingSheetProps {
  booking: BookingDetails;
  isBooking: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

const SLOT_MS = 30 * 60 * 1000;

export function BookingSheet({
  booking,
  isBooking,
  error,
  onConfirm,
  onClose,
}: BookingSheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBooking) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isBooking, onClose]);

  const end = new Date(Date.parse(booking.slotStart) + SLOT_MS).toISOString();

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={isBooking ? undefined : onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        className="relative w-full max-w-md rounded-t-3xl bg-surface p-6 shadow-xl sm:rounded-3xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
        <h2 id="booking-title" className="text-lg font-bold">
          Confirm your booking
        </h2>
        <p className="text-sm text-slate-500">{booking.stationName}</p>

        <dl className="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-200 text-sm">
          <div className="flex justify-between gap-4 p-3">
            <dt className="text-slate-500">When</dt>
            <dd className="text-right font-semibold">
              {booking.dateLabel},{' '}
              {formatStationTime(booking.slotStart, booking.timeZone)}–
              {formatStationTime(end, booking.timeZone)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 p-3">
            <dt className="text-slate-500">Charger</dt>
            <dd className="font-semibold">
              #{booking.chargerNumber} · {connectorLabel(booking.connectorType)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 p-3">
            <dt className="text-slate-500">Power</dt>
            <dd>
              <SpeedBadge powerKw={booking.powerKw} />
            </dd>
          </div>
        </dl>

        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          You can cancel any time from My reservations. Check in within 10
          minutes of the start time, or the slot is released to other drivers.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            size="lg"
            onClick={onClose}
            disabled={isBooking}
          >
            Cancel
          </Button>
          <Button size="lg" onClick={onConfirm} disabled={isBooking} autoFocus>
            {isBooking ? 'Booking…' : 'Book slot'}
          </Button>
        </div>
      </div>
    </div>
  );
}
