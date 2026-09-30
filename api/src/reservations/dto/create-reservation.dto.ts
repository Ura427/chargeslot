import { IsISO8601, IsUUID } from 'class-validator';

export class CreateReservationDto {
  @IsUUID()
  chargerId: string;

  @IsISO8601()
  slotStart: string;
}
