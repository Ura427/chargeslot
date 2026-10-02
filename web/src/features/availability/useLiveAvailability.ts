// ---------------------------------------------------------------------------
// USER-REWRITE FILE (see .claude/plans/chargeslot-showcase.md, "The 4 files").
//
// This is a STUB. It does not subscribe to anything yet and does nothing
// if called — `StationDetailPage` still relies on Milestone 4's
// invalidatesTags-based refetch (see `createReservation` / `checkIn` /
// `cancelReservation` in `api/reservations.api.ts`) as its working fallback.
//
// TODO(user): implement this hook so that:
//   - it takes a `stationId: string` (the station currently being viewed)
//   - on mount, it subscribes to the `slot.updated` event on the shared
//     socket from `lib/socket.ts` (payload shape:
//     `{ chargerId, slotStart, status }`, see
//     `api/src/realtime/realtime.gateway.ts`)
//   - on unmount, it unsubscribes (`socket.off`) to avoid leaking listeners
//     across station navigations
//   - on each event, instead of invalidating `Availability` and refetching
//     (which causes a flash), it should directly patch the cached
//     `getAvailability` entry in place using RTK Query's
//     `stationsApi.util.updateQueryData('getAvailability', { stationId, date }, ...)`
//     dispatched via the store — find the matching charger by `chargerId`
//     and the matching slot by `slotStart`, and set that slot's `status`
//     to the incoming `status`. This is the cache entry currently
//     populated by `useGetAvailabilityQuery` in
//     `web/src/api/stations.api.ts` and read by `StationDetailPage`.
//   - events for a different `chargerId` (belonging to another station) can
//     be safely ignored, or filtered against the chargers currently loaded
//     for this station
//
// Once implemented, call this hook from `StationDetailPage` alongside (or
// instead of) the refetch-on-409 fallback, passing the current `stationId`
// and `date`.
// ---------------------------------------------------------------------------

export function useLiveAvailability(_stationId: string): void {
  // TODO(user): subscribe to socket's `slot.updated` and patch the RTK Query
  // cache for this station's availability query. No-op for now.
}
