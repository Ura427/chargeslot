import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { CHECK_IN_WINDOW_MS } from './reservations.service.js';

// No-show sweep: any BOOKED reservation whose check-in window (see CHECK_IN_WINDOW_MS,
// shared with ReservationsService#checkIn) has closed without a check-in is expired,
// freeing the slot for the database's active-slot unique index.
@Injectable()
export class ExpiryJob {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expireNoShows() {
    const cutoff = new Date(Date.now() - CHECK_IN_WINDOW_MS);

    // One UPDATE ... RETURNING: a separate find-then-update could overwrite a check-in
    // that lands between the two queries.
    const expired = await this.prisma.reservation.updateManyAndReturn({
      where: { status: 'BOOKED', slotStart: { lt: cutoff } },
      data: { status: 'EXPIRED' },
    });

    for (const reservation of expired) {
      this.realtime.emitSlotUpdated({
        chargerId: reservation.chargerId,
        slotStart: reservation.slotStart.toISOString(),
        status: 'EXPIRED',
      });
    }
  }
}
