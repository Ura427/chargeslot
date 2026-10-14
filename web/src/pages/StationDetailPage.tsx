import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useGetAvailabilityQuery,
  useGetStationsQuery,
  type ChargerAvailability,
} from '../api/stations.api';
import { useCreateReservationMutation } from '../api/reservations.api';
import { useLiveAvailability } from '../features/availability/useLiveAvailability';
import {
  dayPart,
  formatOpeningHours,
  formatStationTime,
  isBrowserTimeZone,
  stationDateString,
  type DayPart,
} from '../lib/date';
import { getErrorCode, getErrorMessage } from '../lib/errors';
import { SlotButton } from '../components/SlotButton';
import { Button } from '../components/Button';
import { SpeedBadge } from '../components/SpeedBadge';
import { StationPhoto } from '../components/StationCard';
import { connectorLabel } from '../lib/connectors';
import { BookingSheet, type BookingDetails } from '../components/BookingSheet';

const DAY_PARTS: DayPart[] = ['Morning', 'Afternoon', 'Evening'];

function formatDateLabel(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function StationDetailPage() {
  const { stationId = '' } = useParams<{ stationId: string }>();
  const { station, isLoading: stationLoading } = useGetStationsQuery(
    undefined,
    {
      selectFromResult: ({ data, isLoading }) => ({
        station: data?.find((s) => s.id === stationId),
        isLoading,
      }),
    },
  );
  const timeZone = station?.timeZone;

  const dateOptions = useMemo(
    () =>
      timeZone
        ? [
            { label: 'Today', value: stationDateString(0, timeZone) },
            { label: 'Tomorrow', value: stationDateString(1, timeZone) },
          ]
        : [],
    [timeZone],
  );
  const [dayIndex, setDayIndex] = useState(0);
  const date = dateOptions[dayIndex]?.value;

  const [pending, setPending] = useState<
    (BookingDetails & { chargerId: string }) | null
  >(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const {
    data: availability,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAvailabilityQuery({ stationId, date: date ?? '' }, { skip: !date });

  const [createReservation, { isLoading: isBooking }] =
    useCreateReservationMutation();

  // Other drivers' bookings appear without a refetch.
  useLiveAvailability(stationId, date);

  async function handleConfirmBook() {
    if (!pending) return;
    setBookingError(null);
    try {
      await createReservation({
        chargerId: pending.chargerId,
        slotStart: pending.slotStart,
      }).unwrap();
      setNotice(
        `Booked: ${pending.dateLabel.toLowerCase()} at ${formatStationTime(pending.slotStart, pending.timeZone)}, charger #${pending.chargerNumber}.`,
      );
      setPending(null);
    } catch (err) {
      if (getErrorCode(err) === 'SLOT_TAKEN') {
        setBookingError(
          'Someone booked this slot a moment ago. Pick another time.',
        );
        refetch();
      } else {
        setBookingError(getErrorMessage(err, 'Could not book this slot.'));
      }
    }
  }

  if (stationLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-56 animate-pulse rounded-3xl bg-slate-200" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (!station) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-surface p-10 text-center">
        <p className="font-semibold">Station not found</p>
        <Link to="/" className="mt-2 inline-block text-sm text-brand-700">
          Back to all stations
        </Link>
      </div>
    );
  }

  const dayLabel = dateOptions[dayIndex]?.label ?? '';
  const hasSlots = availability?.chargers.some((c) => c.slots.length > 0);

  function openBooking(
    charger: ChargerAvailability,
    index: number,
    slotStart: string,
    stationName: string,
    stationTimeZone: string,
  ) {
    setBookingError(null);
    setNotice(null);
    setPending({
      chargerId: charger.chargerId,
      chargerNumber: index + 1,
      connectorType: charger.connectorType,
      powerKw: charger.powerKw,
      slotStart,
      timeZone: stationTimeZone,
      stationName,
      dateLabel: dayLabel,
    });
  }

  return (
    <div className="space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        ← All stations
      </Link>

      <section className="relative overflow-hidden rounded-3xl">
        <StationPhoto imageUrl={station.imageUrl} className="h-56 sm:h-72" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
          <SpeedBadge powerKw={station.maxPowerKw} solid />
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {station.name}
          </h1>
          <p className="text-sm text-white/85">
            {station.address}, {station.city} ·{' '}
            {formatOpeningHours(station.opensAtMinute, station.closesAtMinute)}
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Day"
          className="inline-flex rounded-xl bg-slate-200/70 p-1"
        >
          {dateOptions.map((option, i) => (
            <button
              key={option.value}
              role="tab"
              aria-selected={i === dayIndex}
              onClick={() => setDayIndex(i)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                i === dayIndex
                  ? 'bg-surface text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {option.label}
              <span className="ml-1.5 font-normal text-slate-500">
                {formatDateLabel(option.value)}
              </span>
            </button>
          ))}
        </div>
        {!isBrowserTimeZone(station.timeZone) && (
          <p className="text-xs text-slate-500">
            Times are local to the station ({station.timeZone.replace('_', ' ')}
            )
          </p>
        )}
      </div>

      {notice && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-800"
        >
          <span className="font-medium">{notice}</span>
          <Link to="/reservations" className="font-semibold underline">
            View my reservations
          </Link>
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-800">
            {getErrorMessage(error, 'Could not load availability.')}
          </p>
          <Button size="sm" className="mt-3" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {!availability && isFetching && (
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
      )}

      {availability && !hasSlots && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-surface p-10 text-center">
          <p className="font-semibold">
            No more slots {dayLabel.toLowerCase()}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {station.chargers.length === 0
              ? 'This station has no chargers yet.'
              : 'The station is closed for the rest of the day.'}
          </p>
          {dayIndex === 0 && (
            <Button size="sm" className="mt-4" onClick={() => setDayIndex(1)}>
              See tomorrow
            </Button>
          )}
        </div>
      )}

      {availability && hasSlots && (
        <div
          className={`space-y-4 transition-opacity ${isFetching ? 'opacity-60' : ''}`}
        >
          {availability.chargers.map((charger, index) => {
            const nextFree = charger.slots.find((s) => s.status === 'FREE');
            const freeCount = charger.slots.filter(
              (s) => s.status === 'FREE',
            ).length;
            return (
              <article
                key={charger.chargerId}
                className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm sm:p-5"
              >
                <header className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">
                      #{index + 1}
                    </span>
                    <div>
                      <h2 className="font-semibold">
                        {connectorLabel(charger.connectorType)}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {freeCount} free slot{freeCount === 1 ? '' : 's'}
                        {nextFree &&
                          ` · next at ${formatStationTime(nextFree.slotStart, station.timeZone)}`}
                      </p>
                    </div>
                  </div>
                  <SpeedBadge powerKw={charger.powerKw} />
                </header>

                <div className="mt-4 space-y-4">
                  {DAY_PARTS.map((part) => {
                    const slots = charger.slots.filter(
                      (s) => dayPart(s.slotStart, station.timeZone) === part,
                    );
                    if (slots.length === 0) return null;
                    return (
                      <div key={part}>
                        <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                          {part}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {slots.map((slot) => (
                            <SlotButton
                              key={slot.slotStart}
                              status={slot.status}
                              label={formatStationTime(
                                slot.slotStart,
                                station.timeZone,
                              )}
                              highlight={slot === nextFree}
                              disabled={isBooking}
                              onClick={() =>
                                openBooking(
                                  charger,
                                  index,
                                  slot.slotStart,
                                  station.name,
                                  station.timeZone,
                                )
                              }
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pending && (
        <BookingSheet
          booking={pending}
          isBooking={isBooking}
          error={bookingError}
          onConfirm={handleConfirmBook}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  );
}
