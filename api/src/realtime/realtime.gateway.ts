import { Injectable } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server } from 'socket.io';
import type { ReservationStatus } from '../generated/prisma/enums.js';

export interface SlotUpdatedPayload {
  chargerId: string;
  slotStart: string;
  status: ReservationStatus;
}

// CORS reuses the same WEB_ORIGIN env var the REST API trusts (see main.ts) rather than
// hardcoding the dev origin. Gateway decorator options are evaluated at class-decoration
// time, before Nest's DI container exists, so this reads process.env directly instead of
// going through ConfigService (same source of truth as main.ts's `config.get('WEB_ORIGIN')`).
@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.WEB_ORIGIN,
    credentials: true,  
  },
})
export class RealtimeGateway {
  @WebSocketServer()
  private server!: Server;

  emitSlotUpdated(payload: SlotUpdatedPayload) {
    this.server.emit('slot.updated', payload);
  }
}
