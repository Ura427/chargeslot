import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { ExpiryJob } from './expiry.job.js';
import { ReservationsController } from './reservations.controller.js';
import { ReservationsService } from './reservations.service.js';

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, ExpiryJob],
})
export class ReservationsModule {}
