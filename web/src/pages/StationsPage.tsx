import { Link } from 'react-router-dom';
import { useGetStationsQuery } from '../api/stations.api';
import { getErrorMessage } from '../lib/errors';
import { Button } from '../components/Button';

export function StationsPage() {
  const {
    data: stations,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetStationsQuery();

  if (isLoading) {
    return <p className="text-slate-600">Loading stations…</p>;
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">
          {getErrorMessage(error, 'Could not load stations.')}
        </p>
        <Button size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!stations || stations.length === 0) {
    return <p className="text-slate-600">No stations available yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {stations.map((station) => (
        <li key={station.id}>
          <Link
            to={`/stations/${station.id}`}
            className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300"
          >
            <p className="font-medium">{station.name}</p>
            <p className="text-sm text-slate-600">{station.address}</p>
            <p className="mt-1 text-xs text-slate-500">
              {station.chargers.length} charger
              {station.chargers.length === 1 ? '' : 's'}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
