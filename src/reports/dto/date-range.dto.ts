import { IsDateString } from 'class-validator';

export class DateRangeDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

