import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';

// Prisma's unique-constraint violation code.
const UNIQUE_VIOLATION = 'P2002';

// Check-in must happen within [slotStart, slotStart + 10min]. Using 409 (not 400) because
// "too early/too late to check in" is a conflict with the resource's current state, in the
// same family as the SLOT_TAKEN conflict this API already uses.
// Exported so the expiry job (expiry.job.ts) reuses this exact constant instead of
// redefining the no-show window separately.
export const CHECK_IN_WINDOW_MS = 10 * 60 * 1000;

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
  ) {}

  async create(userId: string, dto: CreateReservationDto) {
    try {
      const reservation = await this.prisma.reservation.create({
        data: {
          userId,
          chargerId: dto.chargerId,
          slotStart: new Date(dto.slotStart),
        },
      });
      this.realtime.emitSlotUpdated({
        chargerId: reservation.chargerId,
        slotStart: reservation.slotStart.toISOString(),
        status: reservation.status,
      });
      return reservation;
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException({
          code: 'SLOT_TAKEN',
          message: 'This slot has already been booked.',
        });
      }
      throw error;
    }
  }

  async checkIn(userId: string, reservationId: string) {
    const reservation = await this.findOwned(userId, reservationId);

    const now = Date.now();
    const windowStart = reservation.slotStart.getTime();
    const windowEnd = windowStart + CHECK_IN_WINDOW_MS;
    if (now < windowStart || now > windowEnd) {
      throw new ConflictException({
        code: 'OUTSIDE_CHECK_IN_WINDOW',
        message:
          'Check-in is only allowed from the slot start until 10 minutes after.',
      });
    }

    const updated = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'CHECKED_IN', checkedInAt: new Date() },
    });
    this.realtime.emitSlotUpdated({
      chargerId: updated.chargerId,
      slotStart: updated.slotStart.toISOString(),
      status: updated.status,
    });
    return updated;
  }

  async cancel(userId: string, reservationId: string) {
    await this.findOwned(userId, reservationId);
    const updated = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED' },
    });
    this.realtime.emitSlotUpdated({
      chargerId: updated.chargerId,
      slotStart: updated.slotStart.toISOString(),
      status: updated.status,
    });
    return updated;
  }

  findMine(userId: string) {
    return this.prisma.reservation.findMany({
      where: { userId },
      orderBy: { slotStart: 'desc' },
    });
  }

  private async findOwned(userId: string, reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }
    if (reservation.userId !== userId) {
      throw new ForbiddenException('This reservation belongs to another user');
    }
    return reservation;
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: unknown }).code === UNIQUE_VIOLATION
    );
  }
}
