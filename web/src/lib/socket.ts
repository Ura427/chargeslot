import { io, type Socket } from 'socket.io-client';

// Minimal connection setup — no business logic here. Connects to the same
// API origin the REST client uses (see VITE_API_URL) and exposes the raw
// socket instance app-wide. Event handling / cache patching lives in
// feature-specific hooks (see `features/availability/useLiveAvailability.ts`).
export const socket: Socket = io(import.meta.env.VITE_API_URL, {
  withCredentials: true,
  autoConnect: true,
});
