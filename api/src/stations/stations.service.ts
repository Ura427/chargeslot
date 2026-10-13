import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { isWithinOpeningHours } from './opening-hours.js';
import { SLOT_MINUTES } from './slots.js';
import { summarizeStation } from './station-summary.js';

const SLOTS_PER_DAY = (24 * 60) / SLOT_MINUTES;

// Statuses that occupy a slot on the availability grid.
const ACTIVE_STATUSES = ['BOOKED', 'CHECKED_IN'] as const;

@Injectable()
export class StationsService {
  constructor(private prisma: PrismaService) {}

  // Two queries total: all stations, then every active reservation in the next 24h.
  async findAll() {
    const now = new Date();
    const stations = await this.prisma.station.findMany({
      include: { chargers: true },
      orderBy: { name: 'asc' },
    });
    const reservations = await this.prisma.reservation.findMany({
      where: {
        slotStart: {
          gt: now,
          lt: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        },
        status: { in: [...ACTIVE_STATUSES] },
      },
      select: { chargerId: true, slotStart: true },
    });

    return stations.map((station) => {
      const chargerIds = new Set(station.chargers.map((c) => c.id));
      const own = reservations.filter((r) => chargerIds.has(r.chargerId));
      return { ...station, ...summarizeStation(station, own, now) };
    });
  }

  async availability(stationId: string, dateStr: string) {
    const dayStart = this.parseUtcDate(dateStr);
    const now = Date.now();

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

    const byCharger = new Map<
      string,
      Map<number, (typeof reservations)[number]>
    >();
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
        // Only bookable slots are offered: not started yet, and inside opening hours.
        const slots = Array.from({ length: SLOTS_PER_DAY }, (_, index) => {
          const slotStart = new Date(
            dayStart.getTime() + index * SLOT_MINUTES * 60000,
          );
          const reservation = reservedSlots.get(index);
          return {
            slotStart: slotStart.toISOString(),
            status: reservation ? reservation.status : 'FREE',
          };
        }).filter(
          (slot) =>
            Date.parse(slot.slotStart) > now &&
            isWithinOpeningHours(station, new Date(slot.slotStart)),
        );
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
