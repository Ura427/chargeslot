import { api } from './apiSlice';

export type ReservationStatus =
  'BOOKED' | 'CHECKED_IN' | 'CANCELLED' | 'EXPIRED';

export interface Reservation {
  id: string;
  userId: string;
  chargerId: string;
  slotStart: string;
  status: ReservationStatus;
  checkedInAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const reservationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createReservation: builder.mutation<
      Reservation,
      { chargerId: string; slotStart: string }
    >({
      query: (body) => ({ url: '/reservations', method: 'POST', body }),
      invalidatesTags: ['Availability', 'Reservations'],
    }),
    checkIn: builder.mutation<Reservation, string>({
      query: (id) => ({ url: `/reservations/${id}/check-in`, method: 'POST' }),
      invalidatesTags: ['Availability', 'Reservations'],
    }),
    cancelReservation: builder.mutation<Reservation, string>({
      query: (id) => ({ url: `/reservations/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Availability', 'Reservations'],
    }),
    getMyReservations: builder.query<Reservation[], void>({
      query: () => '/reservations/me',
      providesTags: ['Reservations'],
    }),
  }),
});

export const {
  useCreateReservationMutation,
  useCheckInMutation,
  useCancelReservationMutation,
  useGetMyReservationsQuery,
} = reservationsApi;
