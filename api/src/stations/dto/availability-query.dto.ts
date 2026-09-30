import { Matches } from 'class-validator';

export class AvailabilityQueryDto {
  // YYYY-MM-DD, interpreted as a UTC calendar day.
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;
}
