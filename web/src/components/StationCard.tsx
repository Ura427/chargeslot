import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Station } from '../api/stations.api';
import {
  formatOpeningHours,
  formatStationTime,
  isBrowserTimeZone,
  zoneAbbreviation,
} from '../lib/date';
import { connectorLabel } from '../lib/connectors';
import { SpeedBadge } from './SpeedBadge';

export function StationPhoto({
  imageUrl,
  className = '',
}: {
  imageUrl: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    // The gradient shows while the photo loads, or instead of it if it fails.
    <div
      className={`overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-teal-400 ${className}`}
    >
      {imageUrl && !failed && (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      )}
    </div>
  );
}

function Availability({ station }: { station: Station }) {
  if (!station.nextFreeAt) {
    return <span className="text-slate-500">Fully booked for 24 h</span>;
  }
  return (
    <span className="flex items-center gap-1.5 text-slate-700">
      <span className="size-2 rounded-full bg-brand-500" aria-hidden="true" />
      <span>
        <strong className="font-semibold text-brand-800">
          {station.freeChargersAtNext} of {station.chargers.length}
        </strong>{' '}
        free at {formatStationTime(station.nextFreeAt, station.timeZone)}
        {!isBrowserTimeZone(station.timeZone) &&
          ` ${zoneAbbreviation(station.nextFreeAt, station.timeZone)}`}
      </span>
    </span>
  );
}

export function StationCard({ station }: { station: Station }) {
  return (
    <Link
      to={`/stations/${station.id}`}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand-600"
    >
      <div className="relative">
        <StationPhoto
          imageUrl={station.imageUrl}
          className="aspect-[16/9] transition duration-300 group-hover:brightness-105"
        />
        <div className="absolute top-3 left-3">
          <SpeedBadge powerKw={station.maxPowerKw} solid />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h2 className="font-semibold text-slate-900">{station.name}</h2>
          <p className="text-sm text-slate-500">
            {station.city} · {station.address}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {station.connectorTypes.map((type) => (
            <span
              key={type}
              className="rounded-md border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600"
            >
              {connectorLabel(type)}
            </span>
          ))}
          <span className="rounded-md px-2 py-0.5 text-xs text-slate-500">
            {formatOpeningHours(station.opensAtMinute, station.closesAtMinute)}
          </span>
        </div>
        <div className="mt-auto border-t border-slate-100 pt-3 text-sm">
          <Availability station={station} />
        </div>
      </div>
    </Link>
  );
}

export function StationCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-200 bg-surface"
      aria-hidden="true"
    >
      <div className="aspect-[16/9] animate-pulse bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}
