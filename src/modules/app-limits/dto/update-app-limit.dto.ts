import { IsInt, Min } from 'class-validator';

export class UpdateAppLimitDto {
  @IsInt()
  @Min(1)
  dailyLimit: number;
}
