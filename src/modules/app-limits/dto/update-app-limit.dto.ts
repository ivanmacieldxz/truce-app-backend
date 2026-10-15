import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateAppLimitDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  dailyLimit?: number;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

