import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  // Liveness only: stays up when the database is down, so the container is not restarted for it.
  @Get()
  check() {
    return { status: 'ok' };
  }
}
