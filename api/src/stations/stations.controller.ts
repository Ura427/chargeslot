import { Controller, Get, Param, Query } from '@nestjs/common';
import { AvailabilityQueryDto } from './dto/availability-query.dto.js';
import { StationsService } from './stations.service.js';

@Controller('stations')
export class StationsController {
  constructor(private stationsService: StationsService) {}

  @Get()
  findAll() {
    return this.stationsService.findAll();
  }

  @Get(':id/availability')
  availability(@Param('id') id: string, @Query() query: AvailabilityQueryDto) {
    return this.stationsService.availability(id, query.date);
  }
}
