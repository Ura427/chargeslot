import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../app/store';
import { stationsApi, type SlotStatus } from '../../api/stations.api';
import { socket } from '../../lib/socket';

interface SlotUpdated {
  chargerId: string;
  slotStart: string;
  status: SlotStatus;
}

// The availability grid only knows "occupied" statuses; a cancelled or expired
// reservation means the slot is free again.
const OCCUPIED: SlotStatus[] = ['BOOKED', 'CHECKED_IN'];

// Patches the cached availability for this station and day in place when any
// user's booking changes, instead of refetching (which would flash the grid).
export function useLiveAvailability(
  stationId: string,
  date: string | undefined,
) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!date) return;

    const onSlotUpdated = ({ chargerId, slotStart, status }: SlotUpdated) => {
      dispatch(
        stationsApi.util.updateQueryData(
          'getAvailability',
          { stationId, date },
          (draft) => {
            // Events for other stations' chargers find nothing and change nothing.
            const slot = draft.chargers
              .find((c) => c.chargerId === chargerId)
              ?.slots.find((s) => s.slotStart === slotStart);
            if (slot) {
              slot.status = OCCUPIED.includes(status) ? status : 'FREE';
            }
          },
        ),
      );
      // The station list's "X free at" summary may have changed too.
      dispatch(stationsApi.util.invalidateTags(['Stations']));
    };

    socket.on('slot.updated', onSlotUpdated);
    return () => {
      socket.off('slot.updated', onSlotUpdated);
    };
  }, [dispatch, stationId, date]);
}
