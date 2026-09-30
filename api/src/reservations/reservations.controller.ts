import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { ReservationsService } from './reservations.service.js';

interface AuthedRequest extends Request {
  user: { userId: string };
}

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}

  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: CreateReservationDto) {
    return this.reservationsService.create(req.user.userId, dto);
  }

  @Post(':id/check-in')
  checkIn(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.reservationsService.checkIn(req.user.userId, id);
  }

  @Delete(':id')
  cancel(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.reservationsService.cancel(req.user.userId, id);
  }

  @Get('me')
  findMine(@Req() req: AuthedRequest) {
    return this.reservationsService.findMine(req.user.userId);
  }
}
