import { api } from './apiSlice';

export interface Charger {
  id: string;
  connectorType: string;
  powerKw: number;
}

export interface Station {
  id: string;
  name: string;
  address: string;
  chargers: Charger[];
}

export type SlotStatus =
  'FREE' | 'BOOKED' | 'CHECKED_IN' | 'EXPIRED' | 'CANCELLED';

export interface Slot {
  slotStart: string;
  status: SlotStatus;
}

export interface ChargerAvailability {
  chargerId: string;
  connectorType: string;
  powerKw: number;
  slots: Slot[];
}

export interface StationAvailability {
  stationId: string;
  date: string;
  chargers: ChargerAvailability[];
}

export const stationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getStations: builder.query<Station[], void>({
      query: () => '/stations',
      providesTags: ['Stations'],
    }),
    getAvailability: builder.query<
      StationAvailability,
      { stationId: string; date: string }
    >({
      query: ({ stationId, date }) =>
        `/stations/${stationId}/availability?date=${date}`,
      providesTags: ['Availability'],
    }),
  }),
});

export const { useGetStationsQuery, useGetAvailabilityQuery } = stationsApi;
