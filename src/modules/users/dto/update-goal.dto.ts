import { IsInt, Min, Max } from 'class-validator';

export class UpdateGoalDto {
  @IsInt()
  @Min(1)
  @Max(1440)
  dailyGoalMinutes: number;
}
