import { describe, expect, it, vi } from 'vitest';
import { RealtimeGateway } from './realtime.gateway.js';

describe('RealtimeGateway#emitSlotUpdated', () => {
  it('emits a slot.updated event with the given payload', () => {
    const gateway = new RealtimeGateway();
    const server = { emit: vi.fn() };
    // @ts-expect-error -- private field, set directly to avoid standing up real socket.io
    gateway.server = server;

    const payload = {
      chargerId: 'charger-1',
      slotStart: '2026-10-01T10:00:00.000Z',
      status: 'BOOKED' as const,
    };
    gateway.emitSlotUpdated(payload);

    expect(server.emit).toHaveBeenCalledWith('slot.updated', payload);
  });
});
