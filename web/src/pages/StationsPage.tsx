import { useGetStationsQuery } from '../api/stations.api';
import { getErrorMessage } from '../lib/errors';
import { Button } from '../components/Button';
import { StationCard, StationCardSkeleton } from '../components/StationCard';

const GRID = 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3';

export function StationsPage() {
  const {
    data: stations,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetStationsQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Book a charger
        </h1>
        <p className="mt-1 text-slate-600">
          Reserve a 30-minute slot so a charger is waiting when you arrive.
        </p>
      </div>

      {isLoading && (
        <div className={GRID} aria-busy="true" aria-label="Loading stations">
          {Array.from({ length: 6 }, (_, i) => (
            <StationCardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-800">
            {getErrorMessage(error, 'Could not load stations.')}
          </p>
          <Button size="sm" className="mt-3" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {stations && stations.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-surface p-10 text-center">
          <p className="font-semibold">No stations yet</p>
          <p className="mt-1 text-sm text-slate-500">
            New charging locations will appear here as they join.
          </p>
        </div>
      )}

      {stations && stations.length > 0 && (
        <ul className={GRID}>
          {stations.map((station) => (
            <li key={station.id} className="flex">
              <StationCard station={station} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
