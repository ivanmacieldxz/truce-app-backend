import { IsArray, IsInt, IsNotEmpty, IsString, Matches, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AppUsageStatDto {
  @IsString()
  @IsNotEmpty()
  packageName: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  timeSpent: number;
}

export class SyncUsageStatsDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppUsageStatDto)
  stats: AppUsageStatDto[];
}
