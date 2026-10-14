import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from '../../app/store';
import { stationsApi, type StationAvailability } from '../../api/stations.api';
import { useLiveAvailability } from './useLiveAvailability';

type Listener = (payload: unknown) => void;
const listeners = new Map<string, Set<Listener>>();

vi.mock('../../lib/socket', () => ({
  socket: {
    on: (event: string, fn: Listener) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(fn);
    },
    off: (event: string, fn: Listener) => listeners.get(event)?.delete(fn),
  },
}));

const emit = (payload: unknown) =>
  act(() => listeners.get('slot.updated')?.forEach((fn) => fn(payload)));

const ARGS = { stationId: 'st-1', date: '2026-10-14' };
const SLOT = '2026-10-14T09:00:00.000Z';

async function seed() {
  const store = makeStore();
  const data: StationAvailability = {
    stationId: 'st-1',
    date: ARGS.date,
    timeZone: 'Europe/London',
    chargers: [
      {
        chargerId: 'ch-1',
        connectorType: 'CCS2',
        powerKw: 50,
        slots: [{ slotStart: SLOT, status: 'FREE' }],
      },
    ],
  };
  await store.dispatch(
    stationsApi.util.upsertQueryData('getAvailability', ARGS, data),
  );
  return store;
}

function render(store: ReturnType<typeof makeStore>) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(() => useLiveAvailability(ARGS.stationId, ARGS.date), {
    wrapper,
  });
}

const slotStatus = (store: ReturnType<typeof makeStore>) =>
  stationsApi.endpoints.getAvailability.select(ARGS)(store.getState()).data
    ?.chargers[0].slots[0].status;

afterEach(() => listeners.clear());

describe('useLiveAvailability', () => {
  it('marks a slot booked when someone else books it', async () => {
    const store = await seed();
    render(store);

    emit({ chargerId: 'ch-1', slotStart: SLOT, status: 'BOOKED' });

    expect(slotStatus(store)).toBe('BOOKED');
  });

  it('frees the slot again when that booking is cancelled or expires', async () => {
    const store = await seed();
    render(store);

    emit({ chargerId: 'ch-1', slotStart: SLOT, status: 'BOOKED' });
    emit({ chargerId: 'ch-1', slotStart: SLOT, status: 'CANCELLED' });

    expect(slotStatus(store)).toBe('FREE');
  });

  it('ignores events for chargers at other stations', async () => {
    const store = await seed();
    render(store);

    emit({ chargerId: 'elsewhere', slotStart: SLOT, status: 'BOOKED' });

    expect(slotStatus(store)).toBe('FREE');
  });

  it('stops listening after unmount', async () => {
    const store = await seed();
    const { unmount } = render(store);

    unmount();

    expect(listeners.get('slot.updated')?.size ?? 0).toBe(0);
  });
});
