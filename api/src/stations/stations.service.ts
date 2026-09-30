import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const SLOT_MINUTES = 30;
const SLOTS_PER_DAY = (24 * 60) / SLOT_MINUTES;

// Statuses that occupy a slot on the availability grid.
const ACTIVE_STATUSES = ['BOOKED', 'CHECKED_IN'] as const;

@Injectable()
export class StationsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.station.findMany({ include: { chargers: true } });
  }

  async availability(stationId: string, dateStr: string) {
    const dayStart = this.parseUtcDate(dateStr);

    const station = await this.prisma.station.findUnique({
      where: { id: stationId },
      include: { chargers: true },
    });
    if (!station) {
      throw new NotFoundException('Station not found');
    }

    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const chargerIds = station.chargers.map((c) => c.id);

    const reservations = await this.prisma.reservation.findMany({
      where: {
        chargerId: { in: chargerIds },
        slotStart: { gte: dayStart, lt: dayEnd },
        status: { in: [...ACTIVE_STATUSES] },
      },
    });

    const byCharger = new Map<string, Map<number, (typeof reservations)[number]>>();
    for (const reservation of reservations) {
      const minutesFromMidnight = Math.round(
        (reservation.slotStart.getTime() - dayStart.getTime()) / 60000,
      );
      const slotIndex = minutesFromMidnight / SLOT_MINUTES;
      if (!byCharger.has(reservation.chargerId)) {
        byCharger.set(reservation.chargerId, new Map());
      }
      byCharger.get(reservation.chargerId)!.set(slotIndex, reservation);
    }

    return {
      stationId: station.id,
      date: dateStr,
      chargers: station.chargers.map((charger) => {
        const reservedSlots = byCharger.get(charger.id) ?? new Map();
        const slots = Array.from({ length: SLOTS_PER_DAY }, (_, index) => {
          const slotStart = new Date(
            dayStart.getTime() + index * SLOT_MINUTES * 60000,
          );
          const reservation = reservedSlots.get(index);
          return {
            slotStart: slotStart.toISOString(),
            status: reservation ? reservation.status : 'FREE',
          };
        });
        return {
          chargerId: charger.id,
          connectorType: charger.connectorType,
          powerKw: charger.powerKw,
          slots,
        };
      }),
    };
  }

  private parseUtcDate(dateStr: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!match) {
      throw new BadRequestException('date must be YYYY-MM-DD');
    }
    const [, year, month, day] = match;
    const date = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day)),
    );
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('date is not a valid calendar date');
    }
    return date;
  }
}
